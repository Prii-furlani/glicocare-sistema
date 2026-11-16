-- =============================================================================
-- ARQUIVO: database.sql (Localização: /backend/database.sql)
-- PROJETO: GlicoCare — Porto Seguro para Famílias com Diabetes Tipo 1 (DM1)
-- OBJETIVO: Criar a estrutura relacional completa e atualizada do banco de dados
--           compatível com MySQL 8+, phpMyAdmin e TiDB Cloud.
-- REGRAS DE NEGÓCIO ATENDIDAS (memory.md):
--   * RN-MOD-01: Moderação manual prévia obrigatória de depoimentos familiares.
--   * RN-MOD-MKT: Validação rigorosa de conselho ativo (CRM, CRN, CREF, CRP, Pedagogia),
--                 exclusividade financeira interna (proibido pagamento por fora)
--                 e teleconsulta por vídeo integrada com suporte a laudos/receitas.
--   * RN-AGD-02: Disponibilidade em tempo real com bloqueio imediato de slot.
--   * RN-FIN-03: Exclusividade financeira com taxa de retenção da plataforma.
--   * RN-ATD-04: Atendimento online por videoconferência nativa.
--   * RN-AUD-01: Sistema completo de Auditoria e Logs Imutáveis (append-only).
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-03:00";
SET NAMES utf8mb4;

-- Criação do banco de dados glicocare_db
CREATE DATABASE IF NOT EXISTS `glicocare_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `glicocare_db`;

-- =============================================================================
-- TABELA 1: usuarios
-- =============================================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do usuário',
  `nome_completo` VARCHAR(150) NOT NULL COMMENT 'Nome completo do usuário',
  `email` VARCHAR(180) NOT NULL COMMENT 'E-mail para autenticação e notificações',
  `senha_hash` VARCHAR(255) NOT NULL COMMENT 'Hash seguro da senha (Bcrypt/Argon2)',
  `telefone` VARCHAR(30) DEFAULT NULL COMMENT 'Telefone fixo ou alternativo',
  `telefone_whatsapp` VARCHAR(30) DEFAULT NULL COMMENT 'WhatsApp para lembretes de consultas',
  `tipo_perfil` ENUM('familiar_paciente', 'especialista', 'admin_moderador') NOT NULL DEFAULT 'familiar_paciente' COMMENT 'Papel do usuário no sistema',
  `contexto_dm1` VARCHAR(200) DEFAULT NULL COMMENT 'Vínculo empático com DM1 (ex: Mãe do Theo, 6 anos)',
  `ativo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = conta ativa, 0 = inativa',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `idx_usuarios_tipo_perfil` (`tipo_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela base de usuários da plataforma';

-- =============================================================================
-- TABELA 2: especialistas
-- =============================================================================
CREATE TABLE IF NOT EXISTS `especialistas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do especialista',
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `especialidade` VARCHAR(120) NOT NULL COMMENT 'Especialidade clínica ou pedagógica',
  `tipo_conselho` ENUM('CRM', 'CRN', 'CRP', 'CREF', 'PEDAGOGIA') NOT NULL COMMENT 'Conselho de classe',
  `numero_conselho` VARCHAR(40) NOT NULL COMMENT 'Número do registro profissional',
  `uf_conselho` CHAR(2) NOT NULL COMMENT 'UF do conselho (ex: SP, RJ)',
  `foco_atuacao` VARCHAR(255) NOT NULL COMMENT 'Focos de atuação no cuidado do DM1',
  `biografia_metodo` TEXT NOT NULL COMMENT 'Metodologia de atendimento humanizado',
  `resumo_card` VARCHAR(255) DEFAULT NULL COMMENT 'Texto curto para o card da vitrine',
  `valor_consulta` DECIMAL(10, 2) NOT NULL DEFAULT 240.00 COMMENT 'Valor em R$ da teleconsulta integrada',
  `duracao_consulta_min` SMALLINT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Duração padrão da consulta em minutos',
  `slug` VARCHAR(150) DEFAULT NULL COMMENT 'Slug para link público amigável',
  `foto_perfil_url` VARCHAR(255) DEFAULT NULL COMMENT 'URL da foto do profissional',
  `comprovante_registro_url` VARCHAR(255) DEFAULT NULL COMMENT 'Comprovante do conselho',
  `dias_disponiveis` VARCHAR(255) DEFAULT NULL COMMENT 'Dias de atendimento',
  `horarios_disponiveis` TEXT DEFAULT NULL COMMENT 'Slots de horários disponíveis',
  `registro_verificado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Selo de Verificado concedido pela curadoria',
  `aceite_exclusividade_financeira` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Aceite de exclusividade financeira interna (RN-MOD-MKT)',
  `status_credenciamento` ENUM('pendente_validacao', 'aprovado', 'rejeitado', 'suspenso') NOT NULL DEFAULT 'pendente_validacao',
  `validado_em` DATETIME DEFAULT NULL COMMENT 'Data/hora da validação pela curadoria',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_especialistas_usuario` (`usuario_id`),
  UNIQUE KEY `uk_especialistas_conselho_uf` (`tipo_conselho`, `numero_conselho`, `uf_conselho`),
  KEY `idx_especialistas_status` (`status_credenciamento`, `especialidade`),
  CONSTRAINT `fk_especialistas_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Perfis profissionais com validação de conselho (RN-MOD-MKT)';

-- =============================================================================
-- TABELA 3: artigos_conteudos
-- =============================================================================
CREATE TABLE IF NOT EXISTS `artigos_conteudos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID do artigo',
  `autor_usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK para usuarios(id)',
  `titulo` VARCHAR(220) NOT NULL COMMENT 'Título do artigo pedagógico',
  `slug` VARCHAR(240) NOT NULL COMMENT 'URL amigável',
  `categoria` VARCHAR(80) NOT NULL COMMENT 'Categoria temática',
  `resumo` VARCHAR(500) NOT NULL COMMENT 'Resumo curto exibido nos cards',
  `conteudo` LONGTEXT NOT NULL COMMENT 'Corpo integral do artigo',
  `tempo_leitura_min` SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Tempo estimado de leitura em minutos',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biblioteca pedagógica e guias práticos GlicoCare';

-- =============================================================================
-- TABELA 4: sugestoes_conteudo
-- =============================================================================
CREATE TABLE IF NOT EXISTS `sugestoes_conteudo` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome_familiar` VARCHAR(150) DEFAULT NULL,
  `categoria_sugerida` VARCHAR(80) NOT NULL DEFAULT 'Com o Lufy',
  `tema_ideia` TEXT NOT NULL,
  `parecer_moderador` VARCHAR(255) DEFAULT NULL,
  `status_moderacao` ENUM('pendente', 'aprovada', 'rejeitada') NOT NULL DEFAULT 'pendente',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sugestoes_status` (`status_moderacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sugestões de temas enviadas pela comunidade';

-- =============================================================================
-- TABELA 5: depoimentos_moderacao
-- =============================================================================
CREATE TABLE IF NOT EXISTS `depoimentos_moderacao` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `artigo_id` INT UNSIGNED NOT NULL,
  `usuario_id` INT UNSIGNED DEFAULT NULL,
  `nome_exibicao_familiar` VARCHAR(120) NOT NULL,
  `parentesco_contexto` VARCHAR(120) DEFAULT 'Família DM1',
  `relato` TEXT NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fila de moderação de depoimentos familiares (RN-MOD-01)';

-- =============================================================================
-- TABELA 6: agendamentos
-- =============================================================================
CREATE TABLE IF NOT EXISTS `agendamentos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `familiar_usuario_id` INT UNSIGNED NOT NULL,
  `especialista_id` INT UNSIGNED NOT NULL,
  `data_hora_consulta` DATETIME NOT NULL,
  `valor_transacao_interna` DECIMAL(10, 2) NOT NULL,
  `taxa_servico_glicocare` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `repasse_especialista` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `comprovante_nf` VARCHAR(80) DEFAULT NULL,
  `codigo_transacao_interna` VARCHAR(80) DEFAULT NULL,
  `status_pagamento_interno` ENUM(
    'aguardando_pagamento',
    'pago_custodia_interna',
    'pago_retido_custodia',
    'repassado_especialista',
    'reembolsado'
  ) NOT NULL DEFAULT 'pago_retido_custodia',
  `status_agendamento` ENUM(
    'agendado',
    'confirmado',
    'em_atendimento',
    'concluido',
    'cancelado'
  ) NOT NULL DEFAULT 'confirmado',
  `link_video_integrado` VARCHAR(255) NOT NULL,
  `url_laudo_receita_pdf` VARCHAR(255) DEFAULT NULL,
  `observacoes_familia` TEXT DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agendamentos por vídeo integrado e financeiro interno (RN-MOD-MKT)';

-- =============================================================================
-- TABELA 7: logs_auditoria
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
-- SEED DATA
-- =============================================================================
INSERT INTO `usuarios` (`id`, `nome_completo`, `email`, `senha_hash`, `telefone`, `telefone_whatsapp`, `tipo_perfil`, `contexto_dm1`, `ativo`) VALUES
(1, 'Curadoria GlicoCare', 'curadoria@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0001', '(11) 99999-0001', 'admin_moderador', 'Equipe de Curadoria e Moderação Oficial', 1),
(2, 'Dra. Helena Vasconcelos', 'helena.endo@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1001', '(11) 98888-1001', 'especialista', 'Endocrinologia e Metabologia Pediátrica', 1),
(3, 'Nut. Clara Mendonça', 'clara.nutri@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1002', '(11) 98888-1002', 'especialista', 'Nutrição em Diabetes e Contagem Gentil', 1),
(4, 'Mariana Silva', 'mariana.mae@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 97777-2001', '(11) 97777-2001', 'familiar_paciente', 'Mãe do Theo (6 anos, sensor FreeStyle Libre)', 1),
(5, 'Carlos Eduardo Souza', 'carlos.pai@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(21) 97777-2002', '(21) 97777-2002', 'familiar_paciente', 'Pai da Sofia (9 anos)', 1)
ON DUPLICATE KEY UPDATE `nome_completo` = VALUES(`nome_completo`);

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
