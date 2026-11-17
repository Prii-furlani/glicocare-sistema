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
      ADD COLUMN IF NOT EXISTS \`duracao_insulina_horas\` INT DEFAULT 3,
      ADD COLUMN IF NOT EXISTS \`possui_alergias\` TINYINT(1) DEFAULT NULL;
    `);
    console.log('✅ Colunas fsi, glicemia_alvo, duracao_insulina_horas e possui_alergias verificadas em perfis_saude.');
  } catch (err) {
    console.log('ℹ️ Colunas em perfis_saude:', err.message);
  }

  // 3B. Garante a criação da tabela alergias_usuario (Alergias e Sensibilidades)
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`alergias_usuario\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da alergia ou sensibilidade',
        \`perfil_saude_id\` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
        \`categoria\` ENUM('MEDICAMENTO', 'ALIMENTO', 'ADESIVO_INSUMO', 'OUTRA') NOT NULL COMMENT 'Categoria da substância ou insumo',
        \`substancia_ou_item\` VARCHAR(150) NOT NULL COMMENT 'Nome da substância, medicamento ou item causador',
        \`gravidade\` ENUM('LEVE', 'MODERADA', 'GRAVE') NOT NULL DEFAULT 'MODERADA' COMMENT 'Gravidade clínica da reação',
        \`reacao_observada\` VARCHAR(255) DEFAULT NULL COMMENT 'Sintomas ou manifestações clínicas relatadas',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_alergias_perfil\` (\`perfil_saude_id\`),
        CONSTRAINT \`fk_alergias_perfil\`
          FOREIGN KEY (\`perfil_saude_id\`) REFERENCES \`perfis_saude\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Alergias e sensibilidades clínicas do usuário';
    `);
    console.log('✅ Tabela alergias_usuario verificada/criada com sucesso.');

    // Seed inicial para o perfil do Theo Silva (perfil_saude_id = 1)
    await connection.query(`
      UPDATE \`perfis_saude\` SET \`possui_alergias\` = 1 WHERE \`id\` = 1;
      UPDATE \`perfis_saude\` SET \`possui_alergias\` = 0 WHERE \`id\` = 2;

      INSERT INTO \`alergias_usuario\` (
        \`id\`, \`perfil_saude_id\`, \`categoria\`, \`substancia_ou_item\`, \`gravidade\`, \`reacao_observada\`
      ) VALUES
      (1, 1, 'ADESIVO_INSUMO', 'Adesivo de Sensor / Cateter', 'LEVE', 'Dermatite de contato no braço após 10 dias de uso'),
      (2, 1, 'MEDICAMENTO', 'Dipirona', 'MODERADA', 'Urticária e prurido generalizado')
      ON DUPLICATE KEY UPDATE \`substancia_ou_item\` = VALUES(\`substancia_ou_item\`), \`gravidade\` = VALUES(\`gravidade\`);
    `);
    console.log('✅ Alergias demonstrativas inseridas com sucesso para o paciente Theo Silva.');
  } catch (err) {
    console.log('ℹ️ Tabela alergias_usuario:', err.message);
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

  // 5. Garante a criação da tabela pre_atendimentos (Módulo de Pré-Atendimento Acolhedor)
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`pre_atendimentos\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do pré-atendimento',
        \`agendamento_id\` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK para agendamentos(id)',
        \`motivo_principal\` VARCHAR(255) NOT NULL COMMENT 'Razão principal da consulta sem jargões',
        \`maiores_dores\` TEXT NOT NULL COMMENT 'Sentimentos, preocupações e dores familiares',
        \`duvidas_prioritarias\` TEXT DEFAULT NULL COMMENT 'Dúvidas que a família não quer esquecer de perguntar',
        \`compartilhar_perfil_saude\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Autorização para especialista acessar histórico de saúde',
        \`preenchido_em\` DATETIME NOT NULL COMMENT 'Momento em que o formulário foi concluído',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_preatend_agendamento\`
          FOREIGN KEY (\`agendamento_id\`) REFERENCES \`agendamentos\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Módulo de Pré-Atendimento Acolhedor';
    `);
    console.log('✅ Tabela pre_atendimentos verificada/criada com sucesso.');
  } catch (err) {
    console.log('ℹ️ Tabela pre_atendimentos:', err.message);
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
