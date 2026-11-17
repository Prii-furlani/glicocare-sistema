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

  // 6. Atualizações para Telemedicina Integrada e Conformidade CFM 2.314/2022
  try {
    await connection.query(`
      ALTER TABLE \`especialistas\`
      ADD COLUMN IF NOT EXISTS \`conselho_sigla\` VARCHAR(20) DEFAULT 'CRM',
      ADD COLUMN IF NOT EXISTS \`conselho_numero\` VARCHAR(40) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`conselho_uf\` CHAR(2) DEFAULT 'SP',
      ADD COLUMN IF NOT EXISTS \`normas_categoria_aceitas\` TINYINT(1) NOT NULL DEFAULT 1;

      UPDATE \`especialistas\`
      SET \`conselho_sigla\` = COALESCE(\`conselho_sigla\`, \`tipo_conselho\`),
          \`conselho_numero\` = COALESCE(\`conselho_numero\`, \`numero_conselho\`),
          \`conselho_uf\` = COALESCE(\`conselho_uf\`, \`uf_conselho\`)
      WHERE \`conselho_sigla\` IS NULL OR \`conselho_numero\` IS NULL;
    `);
    console.log('✅ Colunas de conformidade e conselho verificadas em especialistas.');
  } catch (err) {
    console.log('ℹ️ Colunas em especialistas:', err.message);
  }

  try {
    await connection.query(`
      ALTER TABLE \`agendamentos\`
      ADD COLUMN IF NOT EXISTS \`sala_token_unico\` VARCHAR(120) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`lembrete_enviado\` TINYINT(1) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS \`status_financeiro\` ENUM('RETIDO_PLATAFORMA', 'LIBERADO_ESPECIALISTA', 'ESTORNADO') NOT NULL DEFAULT 'RETIDO_PLATAFORMA',
      ADD COLUMN IF NOT EXISTS \`status_atendimento\` ENUM('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'AGENDADO';

      UPDATE \`agendamentos\`
      SET \`sala_token_unico\` = 'SALA-NATIVA-GC-HELENA-THEO',
          \`status_atendimento\` = 'AGENDADO',
          \`status_financeiro\` = 'RETIDO_PLATAFORMA'
      WHERE \`id\` = 1 AND (\`sala_token_unico\` IS NULL OR \`sala_token_unico\` = '');
    `);
    console.log('✅ Colunas de sala nativa e status de teleconsulta verificadas em agendamentos.');
  } catch (err) {
    console.log('ℹ️ Colunas em agendamentos:', err.message);
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`consentimentos_teleconsulta\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do termo de consentimento aceito',
        \`usuario_id\` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
        \`perfil_saude_id\` INT UNSIGNED DEFAULT NULL COMMENT 'FK para perfis_saude(id)',
        \`agendamento_id\` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id) - consulta de origem',
        \`modalidade\` ENUM('TELECONSULTA', 'TELEINTERCONSULTA') NOT NULL DEFAULT 'TELECONSULTA',
        \`nome_declarante\` VARCHAR(150) NOT NULL DEFAULT 'Paciente GlicoCare',
        \`cpf_declarante\` VARCHAR(14) NOT NULL DEFAULT '000.000.000-00',
        \`data_nascimento_paciente\` DATE NOT NULL DEFAULT '2019-05-14',
        \`nome_paciente_dependente\` VARCHAR(150) DEFAULT NULL,
        \`cidade_aceite\` VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
        \`versao_termo\` VARCHAR(30) NOT NULL DEFAULT 'TCLE-GC-2026.1',
        \`texto_integral_hash\` VARCHAR(64) NOT NULL DEFAULT 'b28f9d6c7e3a1f8b4c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        \`aceito\` TINYINT(1) NOT NULL DEFAULT 1,
        \`ip_aceite\` VARCHAR(45) NOT NULL,
        \`user_agent\` VARCHAR(255) DEFAULT NULL,
        \`data_hora_aceite\` DATETIME NOT NULL,
        \`valido_ate\` DATETIME NOT NULL COMMENT 'Timestamp de validade anual (12 meses)',
        \`status_termo\` ENUM('ATIVO', 'EXPIRADO', 'REVOGADO') NOT NULL DEFAULT 'ATIVO',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_consentimento_agendamento\` (\`agendamento_id\`),
        KEY \`idx_consentimento_usuario\` (\`usuario_id\`),
        KEY \`idx_consentimento_perfil\` (\`perfil_saude_id\`),
        CONSTRAINT \`fk_consentimento_usuario\`
          FOREIGN KEY (\`usuario_id\` ) REFERENCES \`usuarios\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_consentimento_agendamento\`
          FOREIGN KEY (\`agendamento_id\`) REFERENCES \`agendamentos\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Termos de consentimento livre e esclarecido (TCLE) formalizados com validade anual';

      ALTER TABLE \`consentimentos_teleconsulta\`
      ADD COLUMN IF NOT EXISTS \`perfil_saude_id\` INT UNSIGNED DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`modalidade\` ENUM('TELECONSULTA', 'TELEINTERCONSULTA') NOT NULL DEFAULT 'TELECONSULTA',
      ADD COLUMN IF NOT EXISTS \`nome_declarante\` VARCHAR(150) NOT NULL DEFAULT 'Paciente GlicoCare',
      ADD COLUMN IF NOT EXISTS \`cpf_declarante\` VARCHAR(14) NOT NULL DEFAULT '000.000.000-00',
      ADD COLUMN IF NOT EXISTS \`data_nascimento_paciente\` DATE NOT NULL DEFAULT '2019-05-14',
      ADD COLUMN IF NOT EXISTS \`nome_paciente_dependente\` VARCHAR(150) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`cidade_aceite\` VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
      ADD COLUMN IF NOT EXISTS \`texto_integral_hash\` VARCHAR(64) NOT NULL DEFAULT 'b28f9d6c7e3a1f8b4c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      ADD COLUMN IF NOT EXISTS \`user_agent\` VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`valido_ate\` DATETIME DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS \`status_termo\` ENUM('ATIVO', 'EXPIRADO', 'REVOGADO') NOT NULL DEFAULT 'ATIVO';

      UPDATE \`consentimentos_teleconsulta\` c
      LEFT JOIN \`perfis_saude\` p ON c.usuario_id = p.usuario_id
      SET c.perfil_saude_id = COALESCE(c.perfil_saude_id, p.id, 1),
          c.valido_ate = COALESCE(c.valido_ate, DATE_ADD(c.data_hora_aceite, INTERVAL 1 YEAR)),
          c.status_termo = 'ATIVO'
      WHERE c.valido_ate IS NULL OR c.perfil_saude_id IS NULL;

      UPDATE \`consentimentos_teleconsulta\`
      SET \`nome_declarante\` = 'Mariana Silva',
          \`cpf_declarante\` = '123.456.789-00',
          \`nome_paciente_dependente\` = 'Theo Silva',
          \`versao_termo\` = 'TCLE-GC-2026.1',
          \`perfil_saude_id\` = 1,
          \`valido_ate\` = '2027-11-18 10:25:00',
          \`status_termo\` = 'ATIVO'
      WHERE \`id\` = 1;
    `);

    // Remove restrição UNIQUE de agendamento_id caso exista
    try {
      await connection.query(`ALTER TABLE \`consentimentos_teleconsulta\` DROP INDEX \`uk_consentimento_agendamento\`;`);
    } catch (ignoreUniqueErr) {}

    console.log('✅ Tabela consentimentos_teleconsulta verificada/atualizada com validade anual (12 meses).');
  } catch (err) {
    console.log('ℹ️ Tabela consentimentos_teleconsulta:', err.message);
  }

  // Tabela auxiliar de confirmações rápidas por agendamento
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`consentimentos_agendamentos_uso\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do registro de uso de TCLE vigente',
        \`consentimento_id\` INT UNSIGNED NOT NULL COMMENT 'FK para consentimentos_teleconsulta(id)',
        \`agendamento_id\` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id)',
        \`especialista_id\` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
        \`confirmado_em\` DATETIME NOT NULL COMMENT 'Timestamp da confirmação rápida no fuso America/Sao_Paulo',
        \`ip_confirmacao\` VARCHAR(45) DEFAULT NULL COMMENT 'IP do declarante na confirmação rápida',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_tcle_uso_consentimento\` (\`consentimento_id\`),
        KEY \`idx_tcle_uso_agendamento\` (\`agendamento_id\`),
        KEY \`idx_tcle_uso_especialista\` (\`especialista_id\`),
        CONSTRAINT \`fk_tcle_uso_consentimento\`
          FOREIGN KEY (\`consentimento_id\`) REFERENCES \`consentimentos_teleconsulta\` (\`id\` )
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_tcle_uso_agendamento\`
          FOREIGN KEY (\`agendamento_id\`) REFERENCES \`agendamentos\` (\`id\` )
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_tcle_uso_especialista\`
          FOREIGN KEY (\`especialista_id\`) REFERENCES \`especialistas\` (\`id\` )
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de uso de TCLE vigente por consulta';

      INSERT INTO \`consentimentos_agendamentos_uso\`
        (\`id\`, \`consentimento_id\`, \`agendamento_id\`, \`especialista_id\`, \`confirmado_em\`, \`ip_confirmacao\`)
      VALUES
        (1, 1, 1, 1, '2026-11-18 10:25:00', '127.0.0.1')
      ON DUPLICATE KEY UPDATE \`confirmado_em\` = VALUES(\`confirmado_em\`);
    `);
    console.log('✅ Tabela consentimentos_agendamentos_uso criada/verificada com sucesso.');
  } catch (err) {
    console.log('ℹ️ Tabela consentimentos_agendamentos_uso:', err.message);
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`prontuarios_atendimentos\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do prontuário do atendimento',
        \`agendamento_id\` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK 1:1 para agendamentos(id)',
        \`perfil_saude_id\` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
        \`especialista_id\` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
        \`queixa_principal\` TEXT NOT NULL COMMENT 'Motivo e queixa relatados no atendimento',
        \`evolucao_clinica\` TEXT NOT NULL COMMENT 'Anamnese remota e notas de evolução clínica',
        \`conduta_orientacoes\` TEXT NOT NULL COMMENT 'Plano terapêutico, metas e orientações de rotina',
        \`encaminhamento_presencial\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Indicada consulta presencial de segurança',
        \`data_registro\` DATETIME NOT NULL COMMENT 'Momento do registro oficial do prontuário',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_prontuario_perfil\` (\`perfil_saude_id\`),
        KEY \`idx_prontuario_especialista\` (\`especialista_id\`),
        CONSTRAINT \`fk_prontuario_agendamento\`
          FOREIGN KEY (\`agendamento_id\`) REFERENCES \`agendamentos\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_prontuario_perfil\`
          FOREIGN KEY (\`perfil_saude_id\`) REFERENCES \`perfis_saude\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_prontuario_especialista\`
          FOREIGN KEY (\`especialista_id\`) REFERENCES \`especialistas\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prontuários eletrônicos de teleatendimento CFM 2.314/2022';
    `);
    console.log('✅ Tabela prontuarios_atendimentos verificada/criada com sucesso.');
  } catch (err) {
    console.log('ℹ️ Tabela prontuarios_atendimentos:', err.message);
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`avaliacoes_especialistas\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da avaliação',
        \`agendamento_id\` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK 1:1 para agendamentos(id)',
        \`especialista_id\` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
        \`usuario_id\` INT UNSIGNED DEFAULT NULL COMMENT 'FK para usuarios(id) do paciente/cuidador',
        \`nota\` TINYINT UNSIGNED NOT NULL COMMENT 'Nota de 1 a 5 estrelas',
        \`comentario\` TEXT DEFAULT NULL COMMENT 'Relato acolhedor ou elogio da família',
        \`status_moderacao\` ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'APROVADO' COMMENT 'Status de moderação de reputação',
        \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_avaliacoes_especialista\` (\`especialista_id\`, \`status_moderacao\`),
        KEY \`idx_avaliacoes_usuario\` (\`usuario_id\`),
        CONSTRAINT \`fk_avaliacao_agendamento\`
          FOREIGN KEY (\`agendamento_id\`) REFERENCES \`agendamentos\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_avaliacao_especialista\`
          FOREIGN KEY (\`especialista_id\`) REFERENCES \`especialistas\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_avaliacao_usuario\`
          FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Avaliações e reputação moderada de especialistas';
    `);
    console.log('✅ Tabela avaliacoes_especialistas verificada/criada com sucesso.');
  } catch (err) {
    console.log('ℹ️ Tabela avaliacoes_especialistas:', err.message);
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
