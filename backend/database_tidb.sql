-- =============================================================================
-- ARQUIVO: database_tidb.sql (Localização: /backend/database_tidb.sql)
-- PROJETO: GlicoCare — Porto Seguro para Famílias com Diabetes Tipo 1 (DM1)
-- AMBIENTE: TiDB Cloud (Serverless / Starter - MySQL Compatible) & MySQL 8+
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = "-03:00";

-- Criação do banco de dados na instância TiDB Cloud
CREATE DATABASE IF NOT EXISTS `glicocare_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `glicocare_db`;

-- =============================================================================
-- TABELA 1: usuarios
-- Centraliza familiares/pacientes DM1, especialistas e equipe de moderação
-- =============================================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do usuário',
  `nome_completo` VARCHAR(150) NOT NULL COMMENT 'Nome completo do usuário',
  `email` VARCHAR(180) NOT NULL COMMENT 'E-mail para autenticação e notificações',
  `senha_hash` VARCHAR(255) NOT NULL COMMENT 'Hash da senha (Bcrypt/Argon2)',
  `telefone` VARCHAR(30) DEFAULT NULL COMMENT 'Telefone fixo ou alternativo',
  `telefone_whatsapp` VARCHAR(30) DEFAULT NULL COMMENT 'WhatsApp para lembretes de consultas e avisos',
  `tipo_perfil` ENUM('familiar_paciente', 'especialista', 'admin_moderador') NOT NULL DEFAULT 'familiar_paciente' COMMENT 'Papel do usuário legado',
  `tipo_usuario` ENUM('diabetico', 'cuidador', 'especialista', 'admin') NOT NULL DEFAULT 'diabetico' COMMENT '4 Perfis Oficiais GlicoCare',
  `perfil_configurado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = pendente/configurar depois, 1 = perfil completo',
  `contexto_dm1` VARCHAR(200) DEFAULT NULL COMMENT 'Vínculo com DM1 (ex: Mãe do Theo, 6 anos)',
  `token_sessao` VARCHAR(128) DEFAULT NULL COMMENT 'Token ativo de autenticação Bearer',
  `token_expira_em` DATETIME DEFAULT NULL COMMENT 'Data e hora de expiração da sessão',
  `ativo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = conta ativa, 0 = inativa',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `idx_usuarios_tipo_usuario` (`tipo_usuario`),
  KEY `idx_usuarios_tipo_perfil` (`tipo_perfil`),
  KEY `idx_usuarios_token` (`token_sessao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Base unificada de usuários GlicoCare';

-- =============================================================================
-- TABELA 2: especialistas
-- Perfil profissional com validação rigorosa de conselho ativo (RN-MOD-MKT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `especialistas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do especialista',
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `especialidade` VARCHAR(120) NOT NULL COMMENT 'Ex: Endocrinologia e Metabologia, Nutrição em DM1',
  `tipo_conselho` ENUM('CRM', 'CRN', 'CRP', 'CREF', 'PEDAGOGIA') NOT NULL COMMENT 'Conselho de classe',
  `numero_conselho` VARCHAR(40) NOT NULL COMMENT 'Número do registro profissional',
  `uf_conselho` CHAR(2) NOT NULL COMMENT 'UF do conselho (ex: SP, RJ)',
  `foco_atuacao` VARCHAR(255) NOT NULL COMMENT 'Focos (ex: Ajuste de Insulina, Contagem de Carboidratos)',
  `biografia_metodo` TEXT NOT NULL COMMENT 'Apresentação da metodologia de acolhimento',
  `resumo_card` VARCHAR(255) DEFAULT NULL COMMENT 'Texto curto para o card da vitrine',
  `valor_consulta` DECIMAL(10, 2) NOT NULL DEFAULT 240.00 COMMENT 'Valor em R$ da teleconsulta integrada',
  `duracao_consulta_min` SMALLINT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Duração da consulta em minutos (30, 50 ou 60)',
  `slug` VARCHAR(150) DEFAULT NULL COMMENT 'Slug amigável para URL do perfil público',
  `foto_perfil_url` VARCHAR(255) DEFAULT NULL COMMENT 'URL da foto do profissional',
  `comprovante_registro_url` VARCHAR(255) DEFAULT NULL COMMENT 'Comprovante do conselho para moderação',
  `dias_disponiveis` VARCHAR(255) DEFAULT NULL COMMENT 'Dias de atendimento (ex: Segunda, Quarta, Sexta)',
  `horarios_disponiveis` TEXT DEFAULT NULL COMMENT 'Slots de horários configurados pelo profissional',
  `registro_verificado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Selo de Verificado concedido pela curadoria',
  `aceite_exclusividade_financeira` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'RN-MOD-MKT: 1 = exclusividade interna aceita',
  `status_credenciamento` ENUM('pendente_validacao', 'aprovado', 'rejeitado', 'suspenso') NOT NULL DEFAULT 'pendente_validacao',
  `validado_em` DATETIME DEFAULT NULL COMMENT 'Data/hora de aprovação pelo back-office',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_especialistas_usuario` (`usuario_id`),
  UNIQUE KEY `uk_especialistas_conselho_uf` (`tipo_conselho`, `numero_conselho`, `uf_conselho`),
  KEY `idx_especialistas_status` (`status_credenciamento`, `especialidade`),
  CONSTRAINT `fk_especialistas_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Perfis clínicos e credenciamento RN-MOD-MKT';

-- =============================================================================
-- TABELA 2B: perfis_saude
-- Perfil detalhado de saúde e conduta clínica (vinculado 1:1 a usuarios ou ao dependente)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `perfis_saude` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do perfil de saúde',
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `nome_completo` VARCHAR(150) NOT NULL COMMENT 'Nome completo da pessoa com DM1',
  `data_nascimento` DATE NOT NULL COMMENT 'Data de nascimento para cálculo da idade',
  `sexo` ENUM('masculino', 'feminino', 'outro') NOT NULL COMMENT 'Sexo biológico para fluxo condicional',
  `altura_cm` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Altura em centímetros (opcional)',
  `peso_kg` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Peso em quilos (opcional)',
  `tipo_diabetes` ENUM('Tipo 1A', 'Tipo 1B', 'Tipo 2', 'LADA', 'MODY', 'Gestacional', 'Pre-diabetes', 'Nao tenho') NOT NULL DEFAULT 'Tipo 1A' COMMENT 'Classificação do diabetes',
  `data_diagnostico` DATE DEFAULT NULL COMMENT 'Data estimada do diagnóstico',
  `terapia_insulina` ENUM('Caneta', 'Seringa', 'Bomba com fio', 'Bomba sem fio / Adesivo', 'Nao uso insulina') NOT NULL DEFAULT 'Caneta' COMMENT 'Modalidade de aplicação de insulina',
  `fatores_glicemia` JSON DEFAULT NULL COMMENT 'JSON com sensibilidade a estresse, calor, infecções, exercício, etc.',
  `config_sexo_especifica` JSON DEFAULT NULL COMMENT 'JSON com respostas condicionais específicas de saúde feminina ou masculina',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_perfis_saude_usuario` (`usuario_id`),
  CONSTRAINT `fk_perfis_saude_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Perfis clínicos personalizados de saúde DM1';

-- =============================================================================
-- TABELA 2C: medicamentos_usuario
-- Medicamentos, insulinas e suplementos ativos vinculados a perfis_saude (1:N)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `medicamentos_usuario` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do medicamento',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `nome_medicamento` VARCHAR(150) NOT NULL COMMENT 'Nome comercial ou princípio ativo (ex: Tresiba, Novorapid)',
  `tipo` ENUM('Insulina', 'Comprimido', 'Dragea', 'Suplemento', 'Outro') NOT NULL DEFAULT 'Insulina' COMMENT 'Forma farmacêutica',
  `dose` VARCHAR(50) NOT NULL COMMENT 'Quantidade (ex: 12, 1, 500)',
  `unidade_medida` VARCHAR(30) NOT NULL DEFAULT 'UI' COMMENT 'Unidade (UI, mg, ml, etc.)',
  `horario` TIME DEFAULT NULL COMMENT 'Horário padrão de uso',
  `uso_continuo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = uso contínuo, 0 = tratamento com prazo',
  `numero_dias` INT DEFAULT NULL COMMENT 'Duração em dias caso não seja contínuo',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_medicamentos_perfil` (`perfil_saude_id`),
  CONSTRAINT `fk_medicamentos_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Medicamentos e insulinas em uso no perfil de saúde';

-- =============================================================================
-- TABELA 2D: registros_glicemia
-- Diário glicêmico e histórico de medições, doses e fatores contextuais
-- =============================================================================
CREATE TABLE IF NOT EXISTS `registros_glicemia` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do registro de glicemia',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `valor_mg_dl` INT NOT NULL COMMENT 'Valor medido em mg/dL',
  `momento_medicao` ENUM('Jejum', 'Antes da Refeicao', '1h/2h Apos Refeicao', 'Antes de Dormir', 'Padrao') NOT NULL DEFAULT 'Padrao' COMMENT 'Momento do dia em que a leitura ocorreu',
  `tipo_leitura` ENUM('Manual', 'Sensor/CGM') NOT NULL DEFAULT 'Manual' COMMENT 'Glicosímetro de ponta de dedo ou sensor contínuo',
  `acao_realizada` ENUM('Bolus de Correcao', 'Bolus para Refeicao', 'Bolus Correcao + Refeicao', 'Ajuste na Basal', 'Nenhuma Acao') NOT NULL DEFAULT 'Nenhuma Acao' COMMENT 'Conduta adotada na medição',
  `dose_insulina` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Dose aplicada (se houver)',
  `carboidratos_g` INT DEFAULT NULL COMMENT 'Carboidratos ingeridos em gramas',
  `fator_contexto` VARCHAR(100) DEFAULT NULL COMMENT 'Contexto (Estresse, Calor Extremo, Exercício, TPM/Ciclo, Doença)',
  `sintomas` JSON DEFAULT NULL COMMENT 'Sintomas relatados (tontura, suor frio, tremores, etc.)',
  `observacoes` TEXT DEFAULT NULL COMMENT 'Notas complementares do usuário',
  `data_hora_medicao` DATETIME NOT NULL COMMENT 'Data e hora da medição (permite retroativa)',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_glicemia_perfil_data` (`perfil_saude_id`, `data_hora_medicao`),
  CONSTRAINT `fk_glicemia_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico e diário de medições glicêmicas';

-- =============================================================================
-- TABELA 3: artigos_conteudos
-- Biblioteca pedagógica e guias práticos com tom Porto Seguro
-- =============================================================================
CREATE TABLE IF NOT EXISTS `artigos_conteudos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do artigo',
  `autor_usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `titulo` VARCHAR(220) NOT NULL COMMENT 'Título do artigo',
  `slug` VARCHAR(240) NOT NULL COMMENT 'URL amigável',
  `categoria` VARCHAR(80) NOT NULL COMMENT 'Ex: Acolhimento Inicial, Rotina Escolar, Monitoramento',
  `resumo` VARCHAR(500) NOT NULL COMMENT 'Resumo para os cards da Biblioteca',
  `conteudo` LONGTEXT NOT NULL COMMENT 'Conteúdo completo do artigo',
  `tempo_leitura_min` SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Tempo de leitura em minutos',
  `status_publicacao` ENUM('rascunho', 'em_revisao', 'publicado', 'arquivado') NOT NULL DEFAULT 'publicado',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_artigos_slug` (`slug`),
  KEY `idx_artigos_categoria` (`categoria`, `status_publicacao`),
  KEY `idx_artigos_autor` (`autor_usuario_id`),
  CONSTRAINT `fk_artigos_autor`
    FOREIGN KEY (`autor_usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biblioteca de conteúdos e guias GlicoCare';

-- =============================================================================
-- TABELA 4: sugestoes_conteudo
-- Sugestões de novos temas enviadas pela comunidade (SugerirConteudoCTA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `sugestoes_conteudo` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da sugestão',
  `nome_familiar` VARCHAR(150) DEFAULT NULL COMMENT 'Nome ou parentesco do familiar',
  `categoria_sugerida` VARCHAR(80) NOT NULL DEFAULT 'Com o Lufy',
  `tema_ideia` TEXT NOT NULL COMMENT 'Tema ou pergunta sugerida',
  `parecer_moderador` VARCHAR(255) DEFAULT NULL COMMENT 'Parecer do moderador',
  `status_moderacao` ENUM('pendente', 'aprovada', 'rejeitada') NOT NULL DEFAULT 'pendente',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sugestoes_status` (`status_moderacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sugestões de temas enviadas pelas famílias';

-- =============================================================================
-- TABELA 5: depoimentos_moderacao
-- Depoimentos familiares com moderação prévia obrigatória (RN-MOD-01)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `depoimentos_moderacao` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do depoimento',
  `artigo_id` INT UNSIGNED NOT NULL COMMENT 'FK para artigos_conteudos(id)',
  `usuario_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK para usuarios(id)',
  `nome_exibicao_familiar` VARCHAR(120) NOT NULL COMMENT 'Nome público de exibição',
  `parentesco_contexto` VARCHAR(120) DEFAULT 'Família DM1' COMMENT 'Ex: Mãe de criança com DM1',
  `relato` TEXT NOT NULL COMMENT 'Mensagem de acolhimento',
  `status_moderacao` ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente' COMMENT 'RN-MOD-01',
  `observacao_moderador` VARCHAR(255) DEFAULT NULL,
  `motivo_moderacao` VARCHAR(255) DEFAULT NULL,
  `moderado_por_usuario_id` INT UNSIGNED DEFAULT NULL,
  `moderado_em` DATETIME DEFAULT NULL,
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_depoimentos_artigo` (`artigo_id`, `status_moderacao`),
  KEY `idx_depoimentos_usuario` (`usuario_id`),
  CONSTRAINT `fk_depoimentos_artigo`
    FOREIGN KEY (`artigo_id`) REFERENCES `artigos_conteudos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_depoimentos_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fila de moderação de depoimentos RN-MOD-01';

-- =============================================================================
-- TABELA 6: agendamentos
-- Consultas, bloqueio de slots (RN-AGD-02), financeiro (RN-FIN-03) e vídeo nativo (RN-ATD-04)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `agendamentos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da teleconsulta',
  `familiar_usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `data_hora_consulta` DATETIME NOT NULL COMMENT 'Data e hora agendadas',
  `valor_transacao_interna` DECIMAL(10, 2) NOT NULL COMMENT 'Valor total da consulta em R$',
  `taxa_servico_glicocare` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Retenção da plataforma (RN-FIN-03)',
  `repasse_especialista` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Repasse líquido ao profissional',
  `comprovante_nf` VARCHAR(80) DEFAULT NULL COMMENT 'Número do recibo ou nota fiscal interna',
  `codigo_transacao_interna` VARCHAR(80) DEFAULT NULL COMMENT 'Código identificador da transação',
  `status_pagamento_interno` ENUM(
    'aguardando_pagamento',
    'pago_custodia_interna',
    'pago_retido_custodia',
    'repassado_especialista',
    'reembolsado'
  ) NOT NULL DEFAULT 'pago_retido_custodia' COMMENT 'Status financeiro interno RN-FIN-03',
  `status_agendamento` ENUM(
    'agendado',
    'confirmado',
    'em_atendimento',
    'concluido',
    'cancelado'
  ) NOT NULL DEFAULT 'confirmado' COMMENT 'Estado operacional da teleconsulta',
  `link_video_integrado` VARCHAR(255) NOT NULL COMMENT 'Rota interna de teleconsulta nativa (RN-ATD-04)',
  `url_laudo_receita_pdf` VARCHAR(255) DEFAULT NULL COMMENT 'Laudo ou receita emitidos na consulta',
  `observacoes_familia` TEXT DEFAULT NULL COMMENT 'Notas prévias enviadas pela família',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_especialista_slot` (`especialista_id`, `data_hora_consulta`),
  KEY `idx_agendamentos_familiar` (`familiar_usuario_id`),
  CONSTRAINT `fk_agendamentos_familiar`
    FOREIGN KEY (`familiar_usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_agendamentos_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agendamentos de teleconsulta com financeiro e vídeo nativo';

-- =============================================================================
-- TABELA 7: logs_auditoria
-- Trilha de auditoria imutável (append-only) para conformidade LGPD e rastreabilidade (RN-AUD-01)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `logs_auditoria` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único sequencial do log de auditoria',
  `usuario_id` INT UNSIGNED DEFAULT NULL COMMENT 'ID do usuário responsável (NULL se anônimo/sistema)',
  `usuario_nome` VARCHAR(150) NOT NULL COMMENT 'Nome ou identificação do responsável pela ação (RN-AUD-01)',
  `acao` ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'LOGIN', 'FALHA_LOGIN') NOT NULL COMMENT 'Tipo exato da mutação ou evento realizado',
  `tabela_afetada` VARCHAR(100) NOT NULL COMMENT 'Entidade/tabela modificada no banco',
  `registro_id` VARCHAR(100) NOT NULL COMMENT 'ID ou chave primária do registro impactado',
  `pagina_impacto` VARCHAR(150) NOT NULL COMMENT 'Rota ou tela do front-end impactada',
  `valor_anterior` JSON DEFAULT NULL COMMENT 'Snapshot dos dados antes da alteração (NULL em CRIACAO)',
  `valor_novo` JSON DEFAULT NULL COMMENT 'Snapshot dos dados após a alteração (NULL em EXCLUSAO)',
  `ip_origem` VARCHAR(45) DEFAULT NULL COMMENT 'Endereço IP de onde partiu a requisição',
  `data_hora_local` DATETIME NOT NULL COMMENT 'Data e hora no fuso horário America/Sao_Paulo',
  PRIMARY KEY (`id`),
  KEY `idx_logs_tabela_reg` (`tabela_afetada`, `registro_id`),
  KEY `idx_logs_data` (`data_hora_local`),
  KEY `idx_logs_usuario` (`usuario_id`),
  KEY `idx_logs_acao` (`acao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trilha de auditoria imutável (append-only) - RN-AUD-01';

-- =============================================================================
-- CARGA INICIAL DE DADOS (SEED DATA COMPATÍVEL COM TIDB CLOUD E O FRONTEND)
-- =============================================================================

-- 1. Usuários iniciais com suporte aos 4 perfis
INSERT INTO `usuarios` (`id`, `nome_completo`, `email`, `senha_hash`, `telefone`, `telefone_whatsapp`, `tipo_perfil`, `tipo_usuario`, `perfil_configurado`, `contexto_dm1`, `ativo`) VALUES
(1, 'Curadoria GlicoCare', 'curadoria@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0001', '(11) 99999-0001', 'admin_moderador', 'admin', 1, 'Equipe de Curadoria e Moderação Oficial', 1),
(2, 'Dra. Helena Vasconcelos', 'helena.endo@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1001', '(11) 98888-1001', 'especialista', 'especialista', 1, 'Endocrinologia e Metabologia Pediátrica', 1),
(3, 'Nut. Clara Mendonça', 'clara.nutri@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1002', '(11) 98888-1002', 'especialista', 'especialista', 1, 'Nutrição em Diabetes e Contagem Gentil', 1),
(4, 'Mariana Silva', 'mariana.mae@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 97777-2001', '(11) 97777-2001', 'familiar_paciente', 'cuidador', 1, 'Mãe do Theo (6 anos, sensor FreeStyle Libre)', 1),
(5, 'Carlos Eduardo Souza', 'carlos.pai@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(21) 97777-2002', '(21) 97777-2002', 'familiar_paciente', 'diabetico', 1, 'Pessoa com DM1 há 10 anos', 1)
ON DUPLICATE KEY UPDATE `nome_completo` = VALUES(`nome_completo`), `tipo_usuario` = VALUES(`tipo_usuario`), `perfil_configurado` = VALUES(`perfil_configurado`);

-- 1B. Perfis detalhados de saúde iniciais
INSERT INTO `perfis_saude` (
  `id`, `usuario_id`, `nome_completo`, `data_nascimento`, `sexo`, `altura_cm`, `peso_kg`,
  `tipo_diabetes`, `data_diagnostico`, `terapia_insulina`, `fatores_glicemia`, `config_sexo_especifica`
) VALUES
(
  1, 4, 'Theo Silva', '2019-05-14', 'masculino', 118.00, 22.50,
  'Tipo 1A', '2023-08-10', 'Caneta',
  '{"estresse": "Sobe drasticamente", "calor": "Cai", "infeccao": "Aumenta necessidade de insulina", "exercicio": "Cai", "sonolencia": true}',
  '{"fadiga_persistente": false, "queda_libido": false, "objetivo_fisico": "Manutenção", "suplementos": "Vitamina D"}'
),
(
  2, 5, 'Carlos Eduardo Souza', '1988-11-20', 'masculino', 178.00, 76.00,
  'Tipo 1A', '2015-03-12', 'Bomba com fio',
  '{"estresse": "Sobe levemente", "calor": "Não se altera", "infeccao": "Aumenta necessidade de insulina", "exercicio": "Cai", "sonolencia": false}',
  '{"fadiga_persistente": false, "queda_libido": false, "objetivo_fisico": "Ganho de massa muscular", "suplementos": "Creatina e Whey"}'
)
ON DUPLICATE KEY UPDATE `nome_completo` = VALUES(`nome_completo`);

-- 1C. Medicamentos e insulinas iniciais
INSERT INTO `medicamentos_usuario` (
  `id`, `perfil_saude_id`, `nome_medicamento`, `tipo`, `dose`, `unidade_medida`, `horario`, `uso_continuo`
) VALUES
(1, 1, 'Tresiba (Degludeca)', 'Insulina', '6', 'UI', '21:00:00', 1),
(2, 1, 'Novorapid (Aspart)', 'Insulina', '1:15g', 'UI', NULL, 1),
(3, 2, 'Humalog (Lispro)', 'Insulina', 'Basal contínua', 'UI/h', NULL, 1),
(4, 2, 'Multivitamínico Mineral', 'Suplemento', '1', 'Comprimido', '08:00:00', 1)
ON DUPLICATE KEY UPDATE `nome_medicamento` = VALUES(`nome_medicamento`);

-- 1D. Registros de glicemia e diário inicial
INSERT INTO `registros_glicemia` (
  `id`, `perfil_saude_id`, `valor_mg_dl`, `momento_medicao`, `tipo_leitura`, `acao_realizada`,
  `dose_insulina`, `carboidratos_g`, `fator_contexto`, `observacoes`, `data_hora_medicao`
) VALUES
(1, 1, 108, 'Jejum', 'Manual', 'Nenhuma Acao', NULL, NULL, 'Acordou bem disposto', 'Noite estável sem alarmes de hipo', NOW() - INTERVAL 1 DAY),
(2, 1, 145, '1h/2h Apos Refeicao', 'Sensor/CGM', 'Bolus para Refeicao', 1.5, 32, 'Almoço escolar', 'Lanche com pão integral e maçã', NOW() - INTERVAL 5 HOUR),
(3, 1, 95, 'Antes de Dormir', 'Sensor/CGM', 'Nenhuma Acao', NULL, NULL, 'Estável', 'Leitura conferida antes do sono', NOW() - INTERVAL 1 HOUR)
ON DUPLICATE KEY UPDATE `valor_mg_dl` = VALUES(`valor_mg_dl`);

-- 2. Especialistas credenciados com selo verificado
INSERT INTO `especialistas` (
  `id`, `usuario_id`, `especialidade`, `tipo_conselho`, `numero_conselho`, `uf_conselho`,
  `foco_atuacao`, `biografia_metodo`, `resumo_card`, `valor_consulta`, `duracao_consulta_min`,
  `slug`, `registro_verificado`, `aceite_exclusividade_financeira`, `status_credenciamento`, `validado_em`
) VALUES
(
  1, 2, 'Endocrinologia Pediátrica', 'CRM', '148290', 'SP',
  'Diagnóstico recente, lua de mel, bombas de insulina e leitura serena do sensor FreeStyle Libre',
  'Consultas de 60 minutos focadas em escuta ativa da família e elaboração conjunta do plano de ação para o cotidiano escolar e noturno.',
  'Endocrinologista pediátrica com foco em diagnóstico recente e rotina sem pânico.',
  320.00, 60, 'dra-helena-vasconcelos-1', 1, 1, 'aprovado', NOW()
),
(
  2, 3, 'Nutrição em DM1', 'CRN', '45912', 'SP',
  'Contagem de carboidratos sem terrorismo nutricional, lanches para escola e celebrações infantis',
  'Atendimento nutricional acolhedor que preserva o prazer de comer em família e a liberdade da infância com controle glicêmico seguro.',
  'Nutricionista especialista em contagem de carboidratos gentil e lanches escolares.',
  210.00, 50, 'nut-clara-mendonca-2', 1, 1, 'aprovado', NOW()
)
ON DUPLICATE KEY UPDATE `especialidade` = VALUES(`especialidade`);

-- 3. Artigos pedagógicos da Biblioteca
INSERT INTO `artigos_conteudos` (
  `id`, `autor_usuario_id`, `titulo`, `slug`, `categoria`, `resumo`, `conteudo`, `tempo_leitura_min`, `status_publicacao`
) VALUES
(
  1, 1,
  'O primeiro mês após o diagnóstico: respirando um dia de cada vez',
  'primeiro-mes-apos-diagnostico-respirando-um-dia-de-cada-vez',
  'Acolhimento Inicial',
  'Como estruturar a rotina do lar, acolher as emoções familiares e proporcionar segurança à criança nos passos iniciais com insulina e sensores.',
  'Receber a confirmação do Diabetes Tipo 1 na família vem acompanhado de uma sobrecarga de termos técnicos e sentimentos intensos. Lembre-se: nenhum valor na tela do glicosímetro mede o amor ou a dedicação dos pais. O tempo constrói a tranquilidade da rotina.',
  6, 'publicado'
),
(
  2, 1,
  'DM1 na Escola: construindo uma parceria tranquila com os professores',
  'dm1-na-escola-parceria-tranquila-com-professores',
  'Rotina Escolar',
  'Orientações práticas para alinhar condutas com a coordenação pedagógica sobre momentos de lanche, aulas de educação física e o estojo de hipoglicemia.',
  'Confiar os cuidados da criança à equipe escolar é um passo significativo. Um roteiro ilustrado simples, orientações claras sobre sintomas de hipoglicemia e a presença do kit de emergência devidamente sinalizado aproximam pais e professores com total serenidade.',
  8, 'publicado'
)
ON DUPLICATE KEY UPDATE `titulo` = VALUES(`titulo`);

-- 4. Depoimentos familiares com moderação prévia (RN-MOD-01)
INSERT INTO `depoimentos_moderacao` (
  `id`, `artigo_id`, `usuario_id`, `nome_exibicao_familiar`, `parentesco_contexto`, `relato`, `status_moderacao`, `observacao_moderador`, `moderado_em`
) VALUES
(
  1, 1, 4,
  'Mariana S., mãe do Theo (6 anos)',
  'Mãe de criança com DM1',
  'Nos primeiros dias, achei que as madrugadas nunca mais seriam tranquilas. Hoje, com apoio e método, vejo meu filho ativo e seguro na escola com o sensorzinho.',
  'aprovado',
  'Depoimento acolhedor aprovado conforme diretrizes da comunidade.',
  NOW()
),
(
  2, 1, 5,
  'Carlos E., pai da Sofia (9 anos)',
  'Pai de criança com DM1',
  'Substituir o medo pelo conhecimento compartilhado transformou a nossa rotina. Seguimos as orientações da endocrinologista com tranquilidade.',
  'pendente',
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE `status_moderacao` = VALUES(`status_moderacao`);

-- 5. Agendamentos de teleconsulta (RN-AGD-02, RN-FIN-03, RN-ATD-04)
INSERT INTO `agendamentos` (
  `id`, `familiar_usuario_id`, `especialista_id`, `data_hora_consulta`,
  `valor_transacao_interna`, `taxa_servico_glicocare`, `repasse_especialista`,
  `comprovante_nf`, `codigo_transacao_interna`, `status_pagamento_interno`,
  `status_agendamento`, `link_video_integrado`, `observacoes_familia`
) VALUES
(
  1, 4, 1, '2026-11-20 14:00:00',
  320.00, 38.40, 281.60,
  'NF-GC-20261120-A1B2', 'GC-PAY-2026-0001', 'pago_retido_custodia',
  'confirmado', '/atendimento-nativo/SALA-NATIVA-GC-HELENA-THEO',
  'Desejo analisar a estabilidade glicêmica noturna e revisar a carta de orientações escolares.'
)
ON DUPLICATE KEY UPDATE `status_agendamento` = VALUES(`status_agendamento`);

-- 6. Logs de auditoria iniciais demonstrando conformidade com a RN-AUD-01
INSERT INTO `logs_auditoria` (
  `id`, `usuario_id`, `usuario_nome`, `acao`, `tabela_afetada`, `registro_id`,
  `pagina_impacto`, `valor_anterior`, `valor_novo`, `ip_origem`, `data_hora_local`
) VALUES
(
  1, 1, 'Curadoria GlicoCare', 'CRIACAO', 'artigos_conteudos', '1',
  '/conteudos', NULL,
  '{"id": 1, "titulo": "O primeiro mês após o diagnóstico: respirando um dia de cada vez", "status": "publicado"}',
  '127.0.0.1', NOW()
),
(
  2, 1, 'Curadoria GlicoCare', 'EDICAO', 'especialistas', '1',
  '/especialistas/1',
  '{"id": 1, "status_credenciamento": "pendente_validacao", "registro_verificado": 0}',
  '{"id": 1, "status_credenciamento": "aprovado", "registro_verificado": 1}',
  '127.0.0.1', NOW()
)
ON DUPLICATE KEY UPDATE `usuario_nome` = VALUES(`usuario_nome`);
