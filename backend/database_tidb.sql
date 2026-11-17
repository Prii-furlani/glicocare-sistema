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
  `conselho_sigla` VARCHAR(20) DEFAULT 'CRM' COMMENT 'Sigla oficial do conselho (CRM, CRN, CRP, CONFEF)',
  `numero_conselho` VARCHAR(40) NOT NULL COMMENT 'Número do registro profissional',
  `conselho_numero` VARCHAR(40) DEFAULT NULL COMMENT 'Alias do número para conformidade CFM',
  `uf_conselho` CHAR(2) NOT NULL COMMENT 'UF do conselho (ex: SP, RJ)',
  `conselho_uf` CHAR(2) DEFAULT NULL COMMENT 'Alias da UF para conformidade CFM',
  `normas_categoria_aceitas` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Aceite das resoluções de teleatendimento (CFM 2.314/2022, etc.)',
  `foco_atuacao` VARCHAR(255) NOT NULL COMMENT 'Focos (ex: Ajuste de Insulina, Contagem de Carboidratos)',
  `biografia_metodo` TEXT NOT NULL COMMENT 'Apresentação da metodologia de acolhimento',
  `resumo_card` VARCHAR(255) DEFAULT NULL COMMENT 'Texto curto para o card da vitrine',
  `valor_consulta` DECIMAL(10, 2) NOT NULL DEFAULT 240.00 COMMENT 'Valor em R$ da teleconsulta integrada definido pelo profissional (RN-ESP-01)',
  `percentual_repasse` DECIMAL(5, 2) NOT NULL DEFAULT 65.00 COMMENT 'Percentual líquido repassado ao especialista (65% Especialista / 35% GlicoCare - RN-FIN-03)',
  `oferece_retorno_incluso` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Consulta inclui 1 retorno sem nova cobrança (RN-AGD-RETORNO)',
  `prazo_retorno_dias` INT NOT NULL DEFAULT 30 COMMENT 'Janela máxima em dias para usufruir do retorno incluso sem custo',
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
  `fsi` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Fator de Sensibilidade Insulínica (1 UI reduz X mg/dL, ex: 20, 30, 40)',
  `glicemia_alvo` INT DEFAULT 100 COMMENT 'Meta glicêmica educativa em mg/dL (padrão 100)',
  `duracao_insulina_horas` INT DEFAULT 3 COMMENT 'Duração da insulina ativa em horas (3, 4 ou 5, padrão 3)',
  `possui_alergias` TINYINT(1) DEFAULT NULL COMMENT 'NULL = nao informado, 0 = sem alergias conhecidas, 1 = possui alergias registradas',
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
-- TABELA 2B_ALERGIAS: alergias_usuario
-- Registro estruturado de alergias e sensibilidades clínicas vinculadas a perfis_saude (1:N)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `alergias_usuario` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da alergia ou sensibilidade',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `categoria` ENUM('MEDICAMENTO', 'ALIMENTO', 'ADESIVO_INSUMO', 'OUTRA') NOT NULL COMMENT 'Categoria da substância ou insumo',
  `substancia_ou_item` VARCHAR(150) NOT NULL COMMENT 'Nome da substância, medicamento ou item causador',
  `gravidade` ENUM('LEVE', 'MODERADA', 'GRAVE') NOT NULL DEFAULT 'MODERADA' COMMENT 'Gravidade clínica da reação',
  `reacao_observada` VARCHAR(255) DEFAULT NULL COMMENT 'Sintomas ou manifestações clínicas relatadas',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alergias_perfil` (`perfil_saude_id`),
  CONSTRAINT `fk_alergias_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Alergias e sensibilidades clínicas do usuário';

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
  `insulina_ativa_estimada` DECIMAL(5, 2) DEFAULT NULL COMMENT 'IOB estimada de aplicações anteriores no momento do registro',
  `insulina_total_organismo` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Dose aplicada + insulina ativa estimada',
  `variacao_por_minuto` DECIMAL(6, 2) DEFAULT NULL COMMENT 'Velocidade de variação em mg/dL por minuto (calculada para intervalos <= 45 min)',
  `tendencia_destro` VARCHAR(50) DEFAULT NULL COMMENT 'Seta e rótulo de tendência calculada entre destros',
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
  `autor_usuario_id` INT UNSIGNED DEFAULT 1 COMMENT 'FK para usuarios(id)',
  `autor_nome` VARCHAR(150) NOT NULL DEFAULT 'Priscila Manzoni Furlani' COMMENT 'Nome do autor editorial',
  `titulo` VARCHAR(220) NOT NULL COMMENT 'Título do artigo',
  `titulo_destaque_italico` VARCHAR(150) DEFAULT NULL COMMENT 'Palavra ou trecho em destaque itálico terracota',
  `subtitulo` VARCHAR(300) DEFAULT NULL COMMENT 'Subtítulo do artigo',
  `slug` VARCHAR(240) NOT NULL COMMENT 'URL amigável',
  `categoria` VARCHAR(80) NOT NULL COMMENT 'Ex: Acolhimento Inicial, Rotina Escolar, Monitoramento',
  `resumo` VARCHAR(500) NOT NULL COMMENT 'Resumo para os cards da Biblioteca',
  `conteudo` LONGTEXT NULL COMMENT 'Conteúdo legível em texto/HTML',
  `conteudo_blocos` JSON DEFAULT NULL COMMENT 'Blocos estruturados de conteúdo (parágrafos, H2, respiros, listas)',
  `tempo_leitura` VARCHAR(50) NOT NULL DEFAULT '5 min de leitura' COMMENT 'Texto amigável de tempo',
  `tempo_leitura_min` SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Tempo de leitura em minutos',
  `imagem_capa_url` VARCHAR(255) DEFAULT NULL COMMENT 'URL ou caminho da imagem de capa',
  `legenda_capa` VARCHAR(255) DEFAULT NULL COMMENT 'Legenda da imagem de capa',
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
  `status_financeiro` ENUM(
    'RETIDO_PLATAFORMA',
    'LIBERADO_ESPECIALISTA',
    'ESTORNADO'
  ) NOT NULL DEFAULT 'RETIDO_PLATAFORMA' COMMENT 'Custódia financeira e liberação pós-prontuário (RN-FIN-03)',
  `status_agendamento` ENUM(
    'agendado',
    'confirmado',
    'em_atendimento',
    'concluido',
    'cancelado'
  ) NOT NULL DEFAULT 'confirmado' COMMENT 'Estado operacional da teleconsulta',
  `status_atendimento` ENUM(
    'AGENDADO',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO'
  ) NOT NULL DEFAULT 'AGENDADO' COMMENT 'Estado clínico e teleconsulta integrada',
  `tipo_agendamento` ENUM(
    'CONSULTA_AVULSA',
    'RETORNO_INCLUSO'
  ) NOT NULL DEFAULT 'CONSULTA_AVULSA' COMMENT 'Tipo do agendamento (avulso pago ou retorno gratuito incluso em 30 dias)',
  `agendamento_origem_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK para agendamentos(id) — consulta original que deu direito ao retorno',
  `sala_token_unico` VARCHAR(120) DEFAULT NULL COMMENT 'Token criptográfico único da sala de teleconsulta nativa',
  `iniciado_em` DATETIME DEFAULT NULL COMMENT 'Data e hora exata de início da videochamada',
  `encerrado_em` DATETIME DEFAULT NULL COMMENT 'Data e hora exata de encerramento da videochamada',
  `lembrete_enviado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Notificação/lembrete de teleconsulta disparado',
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
-- TABELA 7: pre_atendimentos
-- Módulo de Pré-Atendimento Acolhedor (Preparação humanizada para teleconsultas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `pre_atendimentos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do pré-atendimento',
  `agendamento_id` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK para agendamentos(id)',
  `motivo_principal` VARCHAR(255) NOT NULL COMMENT 'Razão principal da consulta sem jargões',
  `maiores_dores` TEXT NOT NULL COMMENT 'Sentimentos, preocupações e dores familiares',
  `duvidas_prioritarias` TEXT DEFAULT NULL COMMENT 'Dúvidas que a família não quer esquecer de perguntar',
  `compartilhar_perfil_saude` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Autorização para especialista acessar histórico de saúde',
  `preenchido_em` DATETIME NOT NULL COMMENT 'Momento em que o formulário foi concluído',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_preatend_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Módulo de Pré-Atendimento Acolhedor';

-- =============================================================================
-- TABELA 7B: consentimentos_teleconsulta
-- Termo de Consentimento Livre e Esclarecido (TCLE) com Validade Anual (12 Meses)
-- Embasamento Legal: CFM nº 2.314/2022, CFN, CFP, CONFEF & LGPD (Lei 13.709/2018)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `consentimentos_teleconsulta` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do termo de consentimento aceito',
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `perfil_saude_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK para perfis_saude(id)',
  `agendamento_id` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id) - consulta de origem',
  `modalidade` ENUM('TELECONSULTA', 'TELEINTERCONSULTA') NOT NULL DEFAULT 'TELECONSULTA' COMMENT 'Modalidade da teleassistência',
  `nome_declarante` VARCHAR(150) NOT NULL COMMENT 'Nome completo do declarante / paciente / responsável',
  `cpf_declarante` VARCHAR(14) NOT NULL COMMENT 'CPF do declarante (formato 000.000.000-00)',
  `data_nascimento_paciente` DATE NOT NULL COMMENT 'Data de nascimento do paciente atendido',
  `nome_paciente_dependente` VARCHAR(150) DEFAULT NULL COMMENT 'Nome do dependente quando declarado por responsável legal/cuidador',
  `cidade_aceite` VARCHAR(100) NOT NULL DEFAULT 'São Paulo' COMMENT 'Município da formalização do termo',
  `versao_termo` VARCHAR(30) NOT NULL DEFAULT 'TCLE-GC-2026.1' COMMENT 'Versão oficial do TCLE',
  `texto_integral_hash` VARCHAR(64) NOT NULL COMMENT 'Hash SHA-256 do texto integral exibido no momento do aceite',
  `aceito` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Aceite eletrônico confirmado',
  `ip_aceite` VARCHAR(45) NOT NULL COMMENT 'Endereço IP do dispositivo do declarante',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'Navegador/dispositivo no momento do aceite',
  `data_hora_aceite` DATETIME NOT NULL COMMENT 'Timestamp de aceite no fuso America/Sao_Paulo',
  `valido_ate` DATETIME NOT NULL COMMENT 'Data e hora limite da validade anual (12 meses)',
  `status_termo` ENUM('ATIVO', 'EXPIRADO', 'REVOGADO') NOT NULL DEFAULT 'ATIVO' COMMENT 'Status de vigência do consentimento',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consentimento_agendamento` (`agendamento_id`),
  KEY `idx_consentimento_usuario` (`usuario_id`),
  KEY `idx_consentimento_perfil` (`perfil_saude_id`),
  CONSTRAINT `fk_consentimento_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consentimento_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Termos de consentimento livre e esclarecido (TCLE) com validade anual';

-- =============================================================================
-- TABELA 7B_USO: consentimentos_agendamentos_uso
-- Confirmações Rápidas de TCLE Vigente em Consultas Subsequentes (CFM 2.314/2022)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `consentimentos_agendamentos_uso` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da confirmação de uso de TCLE vigente',
  `consentimento_id` INT UNSIGNED NOT NULL COMMENT 'FK para consentimentos_teleconsulta(id)',
  `agendamento_id` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `confirmado_em` DATETIME NOT NULL COMMENT 'Data e hora da confirmação no fuso America/Sao_Paulo',
  `ip_confirmacao` VARCHAR(45) DEFAULT NULL COMMENT 'IP do declarante na confirmação rápida',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tcle_uso_consentimento` (`consentimento_id`),
  KEY `idx_tcle_uso_agendamento` (`agendamento_id`),
  KEY `idx_tcle_uso_especialista` (`especialista_id`),
  CONSTRAINT `fk_tcle_uso_consentimento`
    FOREIGN KEY (`consentimento_id`) REFERENCES `consentimentos_teleconsulta` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tcle_uso_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tcle_uso_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de uso de TCLE vigente por consulta';

-- =============================================================================
-- TABELA 7C: prontuarios_atendimentos
-- Prontuário Eletrônico de Atendimento Clínico Remoto (CFM 2.314/2022)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `prontuarios_atendimentos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do prontuário do atendimento',
  `agendamento_id` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK 1:1 para agendamentos(id)',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `queixa_principal` TEXT NOT NULL COMMENT 'Motivo e queixa relatados no atendimento',
  `evolucao_clinica` TEXT NOT NULL COMMENT 'Anamnese remota e notas de evolução clínica',
  `conduta_orientacoes` TEXT NOT NULL COMMENT 'Plano terapêutico, metas e orientações de rotina',
  `encaminhamento_presencial` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Indicada consulta presencial de segurança',
  -- INÍCIO: ANOTAÇÕES PRIVADAS DO ESPECIALISTA (RASCUNHO CLÍNICO — NUNCA EXIBIDO AO PACIENTE)
  `anotacoes_privadas_especialista` TEXT NULL COMMENT 'Hipóteses e observações internas visíveis apenas ao próprio especialista',
  -- FIM: ANOTAÇÕES PRIVADAS DO ESPECIALISTA
  `data_registro` DATETIME NOT NULL COMMENT 'Momento do registro oficial do prontuário',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prontuario_perfil` (`perfil_saude_id`),
  KEY `idx_prontuario_especialista` (`especialista_id`),
  CONSTRAINT `fk_prontuario_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_prontuario_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_prontuario_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prontuários eletrônicos de teleatendimento CFM 2.314/2022';

-- =============================================================================
-- TABELA 7C_ADENDOS: prontuarios_adendos
-- Adendos clínicos complementares datados (RN-PRONT-01 - CFM)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `prontuarios_adendos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do adendo clínico',
  `prontuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para prontuarios_atendimentos(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `texto_adendo` TEXT NOT NULL COMMENT 'Texto do adendo clínico complementar',
  `data_hora_adendo` DATETIME NOT NULL COMMENT 'Data e hora oficial do adendo',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_adendo_prontuario` (`prontuario_id`),
  KEY `idx_adendo_especialista` (`especialista_id`),
  CONSTRAINT `fk_adendo_prontuario`
    FOREIGN KEY (`prontuario_id`) REFERENCES `prontuarios_atendimentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_adendo_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Adendos clínicos datados vinculados a prontuários (RN-PRONT-01)';

-- =============================================================================
-- TABELA 7D: avaliacoes_especialistas
-- Avaliação e Reputação Moderada da Rede de Profissionais
-- =============================================================================
CREATE TABLE IF NOT EXISTS `avaliacoes_especialistas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da avaliação',
  `agendamento_id` INT UNSIGNED NOT NULL UNIQUE COMMENT 'FK 1:1 para agendamentos(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `usuario_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK para usuarios(id) do paciente/cuidador',
  `nota` TINYINT UNSIGNED NOT NULL COMMENT 'Nota de 1 a 5 estrelas',
  `comentario` TEXT DEFAULT NULL COMMENT 'Relato acolhedor ou elogio da família',
  `status_moderacao` ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'APROVADO' COMMENT 'Status de moderação de reputação',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_avaliacoes_especialista` (`especialista_id`, `status_moderacao`),
  KEY `idx_avaliacoes_usuario` (`usuario_id`),
  CONSTRAINT `fk_avaliacao_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_avaliacao_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_avaliacao_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Avaliações e reputação moderada de especialistas';

-- =============================================================================
-- TABELA 8: solicitacoes_exames
-- Guias e pedidos de exames laboratoriais emitidos pelos especialistas
-- =============================================================================
CREATE TABLE IF NOT EXISTS `solicitacoes_exames` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da solicitação de exame',
  `agendamento_id` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id)',
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK para especialistas(id)',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `titulo_pedido` VARCHAR(180) NOT NULL COMMENT 'Título do pedido médico ex: Rotina Trimestral DM1',
  `lista_exames_solicitados` JSON NOT NULL COMMENT 'Array JSON com os nomes dos exames pedidos',
  `justificativa_clinica` TEXT NULL COMMENT 'Justificativa clínica / observação ao laboratório (emitida na sala)',
  `guia_pdf_path` VARCHAR(255) DEFAULT NULL COMMENT 'Caminho do PDF gerado da guia',
  `status` ENUM('PENDENTE', 'REALIZADO') NOT NULL DEFAULT 'PENDENTE' COMMENT 'Status da solicitação',
  `data_solicitacao` DATETIME NOT NULL COMMENT 'Data e hora da emissão da guia',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_solic_agendamento` (`agendamento_id`),
  KEY `idx_solic_perfil` (`perfil_saude_id`),
  KEY `idx_solic_especialista` (`especialista_id`),
  CONSTRAINT `fk_solic_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_solic_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_solic_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Guias de exames emitidas pelos especialistas';

-- =============================================================================
-- TABELA 8B: mensagens_teleconsulta
-- Chat em tempo real e compartilhamento de arquivos durante a teleconsulta
-- =============================================================================
CREATE TABLE IF NOT EXISTS `mensagens_teleconsulta` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da mensagem',
  `agendamento_id` INT UNSIGNED NOT NULL COMMENT 'FK para agendamentos(id)',
  `remetente_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `remetente_nome` VARCHAR(150) NOT NULL COMMENT 'Nome de quem enviou',
  `papel_remetente` ENUM('especialista', 'paciente') NOT NULL COMMENT 'Papel do remetente',
  `conteudo` TEXT DEFAULT NULL COMMENT 'Texto da mensagem',
  `arquivo_url` VARCHAR(255) DEFAULT NULL COMMENT 'URL ou caminho do anexo/PDF/imagem',
  `arquivo_nome` VARCHAR(255) DEFAULT NULL COMMENT 'Nome original do arquivo',
  `arquivo_tipo` VARCHAR(60) DEFAULT NULL COMMENT 'MIME type ou extensão',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mensagens_agendamento` (`agendamento_id`),
  CONSTRAINT `fk_mensagens_agendamento`
    FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chat e arquivos enviados durante a teleconsulta';

-- =============================================================================
-- TABELA 9: exames_paciente
-- Cabeçalho de cada coleta ou bateria de exames laboratoriais
-- =============================================================================
CREATE TABLE IF NOT EXISTS `exames_paciente` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID da coleta/bateria de exames',
  `perfil_saude_id` INT UNSIGNED NOT NULL COMMENT 'FK para perfis_saude(id)',
  `solicitacao_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK opcional para solicitacoes_exames(id)',
  `laboratorio` VARCHAR(150) NOT NULL COMMENT 'Nome do laboratório ou UBS',
  `data_realizacao` DATE NOT NULL COMMENT 'Data de realização do exame',
  `data_registro_app` DATETIME NOT NULL COMMENT 'Data e hora de registro no app (America/Sao_Paulo)',
  `arquivo_anexo_path` VARCHAR(255) DEFAULT NULL COMMENT 'Caminho relativo do laudo digital anexado',
  `arquivo_nome_original` VARCHAR(255) DEFAULT NULL COMMENT 'Nome original do arquivo submetido',
  `observacoes_paciente` TEXT DEFAULT NULL COMMENT 'Notas da família sobre o exame',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_exames_perfil` (`perfil_saude_id`),
  KEY `idx_exames_solicitacao` (`solicitacao_id`),
  KEY `idx_exames_data` (`data_realizacao`),
  CONSTRAINT `fk_exames_perfil`
    FOREIGN KEY (`perfil_saude_id`) REFERENCES `perfis_saude` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_exames_solicitacao`
    FOREIGN KEY (`solicitacao_id`) REFERENCES `solicitacoes_exames` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabeçalho de cada coleta ou bateria de exames laboratoriais';

-- =============================================================================
-- TABELA 10: exames_resultados_itens
-- Marcadores individuais e resultados de cada exame laboratorial (1:N com exames_paciente)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `exames_resultados_itens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do item de resultado',
  `exame_id` INT UNSIGNED NOT NULL COMMENT 'FK para exames_paciente(id)',
  `nome_marcador` VARCHAR(120) NOT NULL COMMENT 'Nome do marcador ex: Hemoglobina Glicada',
  `valor_resultado` VARCHAR(50) NOT NULL COMMENT 'Valor do resultado obtido',
  `unidade` VARCHAR(30) NOT NULL COMMENT 'Unidade de medida ex: % ou mg/dL',
  `valor_referencia` VARCHAR(100) DEFAULT NULL COMMENT 'Faixa ou valor de referência do laboratório',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_itens_exame` (`exame_id`),
  KEY `idx_itens_marcador` (`nome_marcador`),
  CONSTRAINT `fk_itens_exame`
    FOREIGN KEY (`exame_id`) REFERENCES `exames_paciente` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marcadores individuais e resultados de cada exame laboratorial';

-- =============================================================================
-- TABELA 11: logs_auditoria
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
-- TABELA 22: configuracoes_home
-- CMS Dinâmico para edição dos textos, chamadas e imagens da Home pelo Admin
-- =============================================================================
CREATE TABLE IF NOT EXISTS `configuracoes_home` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `secao` VARCHAR(60) NOT NULL COMMENT 'ex: hero, lufy, diferenciais, cta_final',
  `chave` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificador único do campo na tela',
  `tipo_campo` ENUM('TEXTO_CURTO', 'TEXTO_LONGO', 'IMAGEM') NOT NULL DEFAULT 'TEXTO_CURTO',
  `rotulo_admin` VARCHAR(150) NOT NULL COMMENT 'Nome amigável exibido no painel de edição',
  `valor` TEXT NOT NULL COMMENT 'Texto ou caminho da imagem',
  `atualizado_em` DATETIME NOT NULL COMMENT 'Data e hora da última alteração em America/Sao_Paulo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações e CMS Dinâmico da Home';

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
  `tipo_diabetes`, `data_diagnostico`, `terapia_insulina`, `possui_alergias`, `fatores_glicemia`, `config_sexo_especifica`
) VALUES
(
  1, 4, 'Theo Silva', '2019-05-14', 'masculino', 118.00, 22.50,
  'Tipo 1A', '2023-08-10', 'Caneta', 1,
  '{"estresse": "Sobe drasticamente", "calor": "Cai", "infeccao": "Aumenta necessidade de insulina", "exercicio": "Cai", "sonolencia": true}',
  '{"fadiga_persistente": false, "queda_libido": false, "objetivo_fisico": "Manutenção", "suplementos": "Vitamina D"}'
),
(
  2, 5, 'Carlos Eduardo Souza', '1988-11-20', 'masculino', 178.00, 76.00,
  'Tipo 1A', '2015-03-12', 'Bomba com fio', 0,
  '{"estresse": "Sobe levemente", "calor": "Não se altera", "infeccao": "Aumenta necessidade de insulina", "exercicio": "Cai", "sonolencia": false}',
  '{"fadiga_persistente": false, "queda_libido": false, "objetivo_fisico": "Ganho de massa muscular", "suplementos": "Creatina e Whey"}'
)
ON DUPLICATE KEY UPDATE `nome_completo` = VALUES(`nome_completo`), `possui_alergias` = VALUES(`possui_alergias`);

-- 1B_ALERGIAS. Alergias e sensibilidades iniciais cadastradas
INSERT INTO `alergias_usuario` (
  `id`, `perfil_saude_id`, `categoria`, `substancia_ou_item`, `gravidade`, `reacao_observada`
) VALUES
(1, 1, 'ADESIVO_INSUMO', 'Adesivo de Sensor / Cateter', 'LEVE', 'Dermatite de contato no braço após 10 dias de uso'),
(2, 1, 'MEDICAMENTO', 'Dipirona', 'MODERADA', 'Urticária e prurido generalizado')
ON DUPLICATE KEY UPDATE `substancia_ou_item` = VALUES(`substancia_ou_item`), `gravidade` = VALUES(`gravidade`);

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
),
(
  7, 1,
  'Insulina Ativa e Queda Rápida: como não ficar "às cegas" quando você está só no destro',
  'insulina-ativa-e-queda-rapida',
  'Tecnologia & Autonomia',
  'Aprenda a calcular a insulina restante no organismo (IOB), evitar empilhamento perigoso de doses e ler a velocidade de variação entre pontas de dedo sem precisar de sensor contínuo.',
  'Conviver com o DM1 sem um sensor contínuo (CGM) ou bomba de infusão não significa estar às cegas. Com conceitos simples de farmacocinética educativa — como a Insulina Ativa (IOB), o Fator de Sensibilidade (FSI) e a leitura de velocidade entre duas pontas de dedo consecutivas —, você e sua família ganham previsibilidade e serenidade no dia a dia.',
  7, 'publicado'
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
  `status_financeiro`, `status_agendamento`, `status_atendimento`, `sala_token_unico`,
  `link_video_integrado`, `observacoes_familia`
) VALUES
(
  1, 4, 1, '2026-11-20 14:00:00',
  320.00, 38.40, 281.60,
  'NF-GC-20261120-A1B2', 'GC-PAY-2026-0001', 'pago_retido_custodia',
  'RETIDO_PLATAFORMA', 'confirmado', 'AGENDADO', 'SALA-NATIVA-GC-HELENA-THEO',
  '/sala-consulta/SALA-NATIVA-GC-HELENA-THEO',
  'Desejo analisar a estabilidade glicêmica noturna e revisar a carta de orientações escolares.'
)
ON DUPLICATE KEY UPDATE `status_agendamento` = VALUES(`status_agendamento`), `sala_token_unico` = VALUES(`sala_token_unico`), `status_atendimento` = VALUES(`status_atendimento`);

-- 5A_CONSENTIMENTO. Consentimento Livre e Esclarecido (TCLE) com validade anual de 12 meses
INSERT INTO `consentimentos_teleconsulta` (
  `id`, `usuario_id`, `perfil_saude_id`, `agendamento_id`, `modalidade`, `nome_declarante`, `cpf_declarante`,
  `data_nascimento_paciente`, `nome_paciente_dependente`, `cidade_aceite`, `versao_termo`,
  `texto_integral_hash`, `aceito`, `ip_aceite`, `user_agent`, `data_hora_aceite`,
  `valido_ate`, `status_termo`
) VALUES
(
  1, 4, 1, 1, 'TELECONSULTA', 'Mariana Silva', '123.456.789-00',
  '2019-05-14', 'Theo Silva', 'São Paulo', 'TCLE-GC-2026.1',
  'b28f9d6c7e3a1f8b4c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', 1, '127.0.0.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlicoCare/1.0', '2026-11-18 10:25:00',
  '2027-11-18 10:25:00', 'ATIVO'
)
ON DUPLICATE KEY UPDATE `cpf_declarante` = VALUES(`cpf_declarante`), `valido_ate` = VALUES(`valido_ate`), `status_termo` = VALUES(`status_termo`);

-- 5A_USO. Registro de confirmação de uso de TCLE vigente na consulta 1
INSERT INTO `consentimentos_agendamentos_uso` (
  `id`, `consentimento_id`, `agendamento_id`, `especialista_id`, `confirmado_em`, `ip_confirmacao`
) VALUES (
  1, 1, 1, 1, '2026-11-18 10:25:00', '127.0.0.1'
)
ON DUPLICATE KEY UPDATE `confirmado_em` = VALUES(`confirmado_em`);

-- 5A_AVALIACOES. Avaliações moderadas da rede de especialistas
INSERT INTO `avaliacoes_especialistas` (
  `id`, `agendamento_id`, `especialista_id`, `usuario_id`, `nota`, `comentario`, `status_moderacao`
) VALUES
(
  1, 1, 1, 4, 5,
  'Dra. Helena foi fantástica! Analisou as curvas do sensor do Theo com paciência e ajustou a dose basal da madrugada sem nos assustar. Hoje dormimos tranquilos.',
  'APROVADO'
)
ON DUPLICATE KEY UPDATE `nota` = VALUES(`nota`), `comentario` = VALUES(`comentario`);

-- 5B. Pré-atendimento inicial vinculado ao agendamento 1
INSERT INTO `pre_atendimentos` (
  `id`, `agendamento_id`, `motivo_principal`, `maiores_dores`, `duvidas_prioritarias`,
  `compartilhar_perfil_saude`, `preenchido_em`
) VALUES (
  1, 1,
  'Ajuste de doses noturnas e rotina escolar',
  'Medo constante de hipoglicemias na madrugada e insegurança com o lanche da tarde na escola.',
  '1. Devo reduzir a Tresiba nos dias de natação? 2. Como orientar a professora sobre a seta de queda no Libre?',
  1,
  '2026-11-18 10:30:00'
)
ON DUPLICATE KEY UPDATE `motivo_principal` = VALUES(`motivo_principal`);

-- 5C. Guias de solicitação de exames emitidas pelos especialistas
INSERT INTO `solicitacoes_exames` (
  `id`, `agendamento_id`, `especialista_id`, `perfil_saude_id`, `titulo_pedido`,
  `lista_exames_solicitados`, `guia_pdf_path`, `status`, `data_solicitacao`
) VALUES
(
  1, 1, 1, 1,
  'Rotina Trimestral DM1 + Vitaminas e Função Renal',
  '["Hemoglobina Glicada (HbA1c)", "Glicemia em Jejum", "Vitamina D (25-OH)", "Microalbuminúria em Amostra Isolada", "TSH", "Creatinina"]',
  '/backend/uploads/guias/guia_solic_1_dra_helena_theo.pdf',
  'REALIZADO',
  '2026-10-15 14:30:00'
),
(
  2, 1, 1, 1,
  'Controle Semestral: HbA1c + Perfil Lipídico e Função Tireoidiana',
  '["Hemoglobina Glicada (HbA1c)", "Colesterol Total e Frações", "Triglicerídeos", "T4 Livre", "TSH"]',
  '/backend/uploads/guias/guia_solic_2_dra_helena_theo.pdf',
  'PENDENTE',
  '2026-11-15 10:00:00'
)
ON DUPLICATE KEY UPDATE `titulo_pedido` = VALUES(`titulo_pedido`), `status` = VALUES(`status`);

-- 5D. Baterias de exames colhidos pelo paciente e laudos arquivados
INSERT INTO `exames_paciente` (
  `id`, `perfil_saude_id`, `solicitacao_id`, `laboratorio`, `data_realizacao`,
  `data_registro_app`, `arquivo_anexo_path`, `arquivo_nome_original`, `observacoes_paciente`
) VALUES
(
  1, 1, 1, 'Delboni Auriemo', '2026-10-25', '2026-10-26 09:15:00',
  '/backend/uploads/exames/delboni_laudo_outubro_theo.pdf', 'Laudo_Completo_Theo_Outubro_2026.pdf',
  'Coleta feita em jejum de 8h sem choro na punção. Dra. Helena já visualizou na consulta.'
),
(
  2, 1, NULL, 'Lavoisier', '2026-07-20', '2026-07-22 16:00:00',
  '/backend/uploads/exames/lavoisier_laudo_julho_theo.pdf', 'Exames_Theo_Julho_2026.pdf',
  'Exame de rotina de 3 meses após ajuste de insulina basal.'
)
ON DUPLICATE KEY UPDATE `laboratorio` = VALUES(`laboratorio`), `data_realizacao` = VALUES(`data_realizacao`);

-- 5E. Marcadores individuais e resultados de cada exame
INSERT INTO `exames_resultados_itens` (
  `id`, `exame_id`, `nome_marcador`, `valor_resultado`, `unidade`, `valor_referencia`
) VALUES
(1, 1, 'Hemoglobina Glicada (HbA1c)', '6.8', '%', 'Menor que 7,0% para DM1 pediátrico'),
(2, 1, 'Glicemia em Jejum', '104', 'mg/dL', '70 a 99 mg/dL'),
(3, 1, 'Vitamina D (25-OH)', '36.5', 'ng/mL', 'Desejável acima de 30 ng/mL'),
(4, 1, 'Creatinina', '0.52', 'mg/dL', '0,30 a 0,70 mg/dL'),
(5, 1, 'TSH', '2.1', 'mUI/L', '0,4 a 4,5 mUI/L'),
(6, 2, 'Hemoglobina Glicada (HbA1c)', '7.4', '%', 'Menor que 7,0% para DM1 pediátrico'),
(7, 2, 'Glicemia em Jejum', '118', 'mg/dL', '70 a 99 mg/dL'),
(8, 2, 'Vitamina D (25-OH)', '24.0', 'ng/mL', 'Desejável acima de 30 ng/mL')
ON DUPLICATE KEY UPDATE `valor_resultado` = VALUES(`valor_resultado`);

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

-- 7. Carga inicial do CMS Dinâmico da Home (configuracoes_home)
INSERT INTO `configuracoes_home` (`secao`, `chave`, `tipo_campo`, `rotulo_admin`, `valor`, `atualizado_em`) VALUES
('hero', 'hero_badge', 'TEXTO_CURTO', 'Hero: Badge Superior', 'INFORMAÇÃO QUE ACOLHE. CUIDADO QUE APROXIMA.', NOW()),
('hero', 'hero_titulo', 'TEXTO_CURTO', 'Hero: Título Principal', 'Transforme o diagnóstico em uma rotina segura e sem pânico.', NOW()),
('hero', 'hero_titulo_destaque', 'TEXTO_CURTO', 'Hero: Palavra de Destaque no Título', 'segura', NOW()),
('hero', 'hero_subtitulo', 'TEXTO_LONGO', 'Hero: Subtítulo Explicativo', 'Apoio pedagógico e acolhimento prático para famílias que vivem o Diabetes Tipo 1 — do diagnóstico à autonomia, um passo de cada vez.', NOW()),
('hero', 'hero_cta_primario', 'TEXTO_CURTO', 'Hero: Texto do Botão Primário', 'Quero começar com segurança', NOW()),
('hero', 'hero_cta_secundario', 'TEXTO_CURTO', 'Hero: Texto do Botão Secundário', 'Conheça nossa história', NOW()),
('hero', 'hero_balao_lufy', 'TEXTO_CURTO', 'Hero: Balão de Fala do Lufy', '“Ei, respira. A gente vai aprender isso juntos.”', NOW()),
('hero', 'hero_imagem_url', 'IMAGEM', 'Hero: Imagem do Lufy Guardião', '', NOW()),
('lufy', 'lufy_eyebrow', 'TEXTO_CURTO', 'Lufy: Sobretítulo da Seção', 'CONHEÇA O LUFY', NOW()),
('lufy', 'lufy_titulo', 'TEXTO_CURTO', 'Lufy: Título da Seção', 'Tecnologia no braço. Afeto no coração.', NOW()),
('lufy', 'lufy_titulo_destaque', 'TEXTO_CURTO', 'Lufy: Palavra Destacada em Terracota', 'Afeto', NOW()),
('lufy', 'lufy_paragrafo_1', 'TEXTO_LONGO', 'Lufy: Primeiro Parágrafo', 'Lufy nasceu para ser uma presença familiar nos momentos em que tudo parece novo demais. Um coala guardião que transforma termos difíceis em conversas possíveis.', NOW()),
('lufy', 'lufy_paragrafo_2', 'TEXTO_LONGO', 'Lufy: Segundo Parágrafo', 'Com o sensor no bracinho, ele mostra para as crianças que o monitoramento não é um peso, mas uma ferramenta de autonomia e liberdade.', NOW()),
('lufy', 'lufy_citacao_foto', 'TEXTO_LONGO', 'Lufy: Citação Acolhedora na Foto da Família', '“Cuidar também é ensinar com calma, até que a confiança encontre seu lugar.”', NOW()),
('lufy', 'lufy_imagem_url', 'IMAGEM', 'Lufy: Imagem da Família Cuidado', '', NOW()),
('cta_final', 'cta_final_titulo', 'TEXTO_CURTO', 'Chamada Final: Título', 'Dê o primeiro passo para uma rotina mais serena.', NOW()),
('cta_final', 'cta_final_subtitulo', 'TEXTO_LONGO', 'Chamada Final: Subtítulo', 'Junte-se a centenas de famílias que transformaram o medo em aprendizado e confiança diária.', NOW()),
('cta_final', 'cta_final_botao', 'TEXTO_CURTO', 'Chamada Final: Texto do Botão', 'Conheça nossos planos e comece hoje', NOW())
ON DUPLICATE KEY UPDATE `rotulo_admin` = VALUES(`rotulo_admin`), `valor` = VALUES(`valor`), `atualizado_em` = VALUES(`atualizado_em`);
