import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

async function main() {
  const envPath = path.resolve('backend', '.env');
  const env = parseEnv(envPath);

  const host = env.DB_HOST || 'localhost';
  const port = parseInt(env.DB_PORT || '4000', 10);
  const user = env.DB_USER || 'root';
  const password = env.DB_PASS || '';
  const isCloud = port === 4000 || host.includes('tidbcloud.com');

  console.log(`📡 Conectando ao banco em ${host}:${port}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: isCloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false,
    multipleStatements: true,
  });

  console.log('✅ Conexão estabelecida com sucesso!');

  await connection.query('USE `glicocare_db`;');

  // 1. Atualiza enum acao em logs_auditoria para suportar ACESSO_NEGADO (RN-ACC-01)
  try {
    await connection.query(`
      ALTER TABLE \`logs_auditoria\`
      MODIFY COLUMN \`acao\` ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'LOGIN', 'FALHA_LOGIN', 'ACESSO_NEGADO') NOT NULL;
    `);
    console.log('✅ ENUM acao atualizado com ACESSO_NEGADO (RN-ACC-01).');
  } catch (err) {
    console.log('ℹ️ Enum logs_auditoria:', err.message);
  }

  // 2. Adiciona colunas de token_sessao e token_expira_em na tabela usuarios se não existirem
  try {
    await connection.query(`
      ALTER TABLE \`usuarios\`
      ADD COLUMN IF NOT EXISTS \`token_sessao\` VARCHAR(128) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`token_expira_em\` DATETIME DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`tipo_usuario\` ENUM('diabetico', 'cuidador', 'especialista', 'admin') NOT NULL DEFAULT 'diabetico',
      ADD COLUMN IF NOT EXISTS \`perfil_configurado\` TINYINT(1) NOT NULL DEFAULT 0;
    `);
    console.log('✅ Colunas tipo_usuario e perfil_configurado adicionadas/verificadas em usuarios.');

    // Sincroniza tipo_usuario para registros já existentes
    await connection.query(`
      UPDATE \`usuarios\`
      SET \`tipo_usuario\` = CASE
        WHEN \`tipo_perfil\` = 'admin_moderador' THEN 'admin'
        WHEN \`tipo_perfil\` = 'especialista' THEN 'especialista'
        WHEN \`tipo_perfil\` = 'familiar_paciente' AND \`id\` = 4 THEN 'cuidador'
        ELSE 'diabetico'
      END,
      \`perfil_configurado\` = 1
      WHERE \`tipo_usuario\` IS NULL OR \`tipo_usuario\` = 'diabetico';
    `);
    console.log('✅ Mapeamento de perfis existentes concluído com sucesso.');
  } catch (err) {
    console.log('ℹ️ Colunas de perfil em usuarios:', err.message);
  }

  // 3. Adiciona colunas clínicas educativas em perfis_saude e registros_glicemia
  try {
    await connection.query(`
      ALTER TABLE \`perfis_saude\`
      ADD COLUMN IF NOT EXISTS \`fsi\` DECIMAL(5, 2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`glicemia_alvo\` INT DEFAULT 100,
      ADD COLUMN IF NOT EXISTS \`duracao_insulina_horas\` INT DEFAULT 3;
    `);
    console.log('✅ Colunas fsi, glicemia_alvo e duracao_insulina_horas verificadas em perfis_saude.');
  } catch (err) {
    console.log('ℹ️ Colunas em perfis_saude:', err.message);
  }

  try {
    await connection.query(`
      ALTER TABLE \`registros_glicemia\`
      ADD COLUMN IF NOT EXISTS \`insulina_ativa_estimada\` DECIMAL(5, 2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`insulina_total_organismo\` DECIMAL(5, 2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`variacao_por_minuto\` DECIMAL(6, 2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`tendencia_destro\` VARCHAR(50) DEFAULT NULL;
    `);
    console.log('✅ Colunas de IOB e velocidade de tendência verificadas em registros_glicemia.');
  } catch (err) {
    console.log('ℹ️ Colunas em registros_glicemia:', err.message);
  }

  // 4. Garante a publicação do artigo educativo de Insulina Ativa e Destro (RN-EDU-01)
  try {
    await connection.query(`
      INSERT INTO \`artigos_conteudos\` (
        \`id\`, \`autor_usuario_id\`, \`titulo\`, \`slug\`, \`categoria\`, \`resumo\`, \`conteudo\`, \`tempo_leitura_min\`, \`status_publicacao\`
      ) VALUES (
        7, 1,
        'Insulina Ativa e Queda Rápida: como não ficar "às cegas" quando você está só no destro',
        'insulina-ativa-e-queda-rapida',
        'Tecnologia & Autonomia',
        'Aprenda a calcular a insulina restante no organismo (IOB), evitar empilhamento perigoso de doses e ler a velocidade de variação entre pontas de dedo sem precisar de sensor contínuo.',
        'Conviver com o DM1 sem um sensor contínuo (CGM) ou bomba de infusão não significa estar às cegas. Com conceitos simples de farmacocinética educativa — como a Insulina Ativa (IOB), o Fator de Sensibilidade (FSI) e a leitura de velocidade entre duas pontas de dedo consecutivas —, você e sua família ganham previsibilidade e serenidade no dia a dia.',
        7, 'publicado'
      ) ON DUPLICATE KEY UPDATE \`titulo\` = VALUES(\`titulo\`), \`resumo\` = VALUES(\`resumo\`);
    `);
    console.log('✅ Artigo educativo sobre IOB e Destro inserido/atualizado na tabela artigos_conteudos.');
  } catch (err) {
    console.log('ℹ️ Inserção do artigo educativo:', err.message);
  }

  const sqlPath = path.resolve('backend', 'database_tidb.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⏳ Executando script SQL completo...');
  await connection.query(sql);

  console.log('✅ Script executado com sucesso!');

  const [tables] = await connection.query('SHOW TABLES;');
  console.log('\n📋 Tabelas ativas no banco:');
  console.table(tables);

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
