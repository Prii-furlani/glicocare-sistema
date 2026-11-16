-- =============================================================================
-- ARQUIVO: database.sql (Localização: /backend/database.sql)
-- PROJETO: GlicoCare — Porto Seguro para Famílias com Diabetes Tipo 1 (DM1)
-- OBJETIVO: Criar a estrutura relacional completa do banco de dados MySQL
--           totalmente compatível com importação direta via phpMyAdmin.
-- REGRAS DE NEGÓCIO ATENDIDAS (memory.md):
--   * RN-MOD-01: Moderação manual prévia obrigatória de depoimentos familiares.
--   * RN-MOD-MKT: Validação rigorosa de conselho ativo (CRM, CRN, CREF, CRP),
--                 exclusividade financeira interna (proibido pagamento por fora)
--                 e teleconsulta por vídeo integrada com suporte a laudos/receitas.
-- =============================================================================

/* INÍCIO DAS CONFIGURAÇÕES DE AMBIENTE DO MYSQL / PHPMYADMIN */
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"; -- Evita que o valor 0 gere incremento indesejado na importação
SET time_zone = "-03:00";               -- Define o fuso horário padrão (Brasília) para registros de data/hora
SET NAMES utf8mb4;                      -- Garante suporte total a acentuação em português e emojis
/* FIM DAS CONFIGURAÇÕES DE AMBIENTE DO MYSQL / PHPMYADMIN */


/* INÍCIO DA CRIAÇÃO E SELEÇÃO DO BANCO DE DADOS */
-- Cria o banco de dados glicocare_db caso ainda não exista, usando codificação utf8mb4
CREATE DATABASE IF NOT EXISTS `glicocare_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Seleciona o banco recém-criado para executar a criação das 5 tabelas relacionais
USE `glicocare_db`;
/* FIM DA CRIAÇÃO E SELEÇÃO DO BANCO DE DADOS */


/* =============================================================================
   INÍCIO DA TABELA 1: usuarios
   OBJETIVO: Centralizar o cadastro de todos os atores da plataforma (pais, mães,
   familiares/pacientes DM1, especialistas de saúde e administradores/moderadores).
   ============================================================================= */
CREATE TABLE IF NOT EXISTS `usuarios` (
  -- Identificador único autoincremental do usuário (Chave Primária)
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do usuário na plataforma GlicoCare',

  -- Nome civil ou social completo para identificação acolhedora na plataforma
  `nome_completo` VARCHAR(150) NOT NULL COMMENT 'Nome completo do familiar, paciente, especialista ou moderador',

  -- Endereço de e-mail único utilizado para login e notificações de agendamento/moderação
  `email` VARCHAR(180) NOT NULL COMMENT 'E-mail único para autenticação e comunicação segura',

  -- Hash criptográfico da senha (gerado via password_hash no PHP para máxima segurança)
  `senha_hash` VARCHAR(255) NOT NULL COMMENT 'Hash seguro da senha (Bcrypt/Argon2 gerado pelo PHP)',

  -- Telefone celular ou WhatsApp opcional para lembretes de consultas agendadas
  `telefone` VARCHAR(30) DEFAULT NULL COMMENT 'Telefone de contato para avisos de teleconsulta',

  -- Define o papel do usuário no sistema para controle de acesso e permissões
  `tipo_perfil` ENUM('familiar_paciente', 'especialista', 'admin_moderador') NOT NULL DEFAULT 'familiar_paciente' COMMENT 'Perfil de acesso: familiar/paciente DM1, especialista de saúde ou administrador',

  -- Contexto familiar opcional (ex: "Mãe do Theo, 6 anos, diagnosticado há 4 meses")
  `contexto_dm1` VARCHAR(200) DEFAULT NULL COMMENT 'Descrição empática do vínculo com o DM1 (ex: Pai da Sofia, 8 anos)',

  -- Flag booleana (1 = ativo, 0 = desativado) para controle de contas ativas
  `ativo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica se a conta do usuário está ativa (1) ou inativa (0)',

  -- Data e hora exatas em que o cadastro foi realizado
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação do registro do usuário',

  -- Data e hora da última atualização cadastral (atualizada automaticamente pelo MySQL)
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última alteração no cadastro',

  -- Definição da chave primária da tabela usuarios
  PRIMARY KEY (`id`),

  -- Garante que não existam dois cadastros utilizando o mesmo endereço de e-mail
  UNIQUE KEY `uk_usuarios_email` (`email`),

  -- Índice para acelerar buscas filtradas pelo tipo de perfil (familiar, especialista, admin)
  KEY `idx_usuarios_tipo_perfil` (`tipo_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela base de usuários (famílias DM1, especialistas e moderadores)';
/* FIM DA TABELA 1: usuarios */


/* =============================================================================
   INÍCIO DA TABELA 2: especialistas
   OBJETIVO: Armazenar os dados profissionais, credenciamento rigoroso de conselho
   ativo (CRM, CRN, CREF, CRP) e o termo de exclusividade financeira interna
   conforme a regra de negócio RN-MOD-MKT.
   ============================================================================= */
CREATE TABLE IF NOT EXISTS `especialistas` (
  -- Identificador único do perfil profissional no marketplace (Chave Primária)
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do especialista credenciado',

  -- Chave estrangeira vinculando o especialista ao seu cadastro base na tabela usuarios
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK que referencia o usuário correspondente em usuarios(id)',

  -- Área clínica ou pedagógica de atuação (ex: Endocrinologia Pediátrica, Nutrição em DM1)
  `especialidade` VARCHAR(120) NOT NULL COMMENT 'Especialidade clínica voltada ao cuidado de DM1',

  -- Sigla oficial do conselho profissional obrigatório segundo a RN-MOD-MKT
  `tipo_conselho` ENUM('CRM', 'CRN', 'CRP', 'CREF') NOT NULL COMMENT 'Conselho profissional obrigatório: CRM, CRN, CRP ou CREF (RN-MOD-MKT)',

  -- Número de inscrição no respectivo conselho regional para auditoria e validação
  `numero_conselho` VARCHAR(40) NOT NULL COMMENT 'Número do registro profissional no conselho de classe',

  -- Sigla da Unidade Federativa (Estado) onde o conselho profissional está registrado
  `uf_conselho` CHAR(2) NOT NULL COMMENT 'UF de emissão do registro profissional (ex: SP, RJ, MG)',

  -- Síntese dos temas em que o especialista foca (ex: bombas de insulina, contagem de carboidratos)
  `foco_atuacao` VARCHAR(255) NOT NULL COMMENT 'Resumo das áreas de foco no acompanhamento do Diabetes Tipo 1',

  -- Apresentação detalhada do método humanizado de consulta para exibição no perfil público
  `biografia_metodo` TEXT NOT NULL COMMENT 'Descrição acolhedora sobre a metodologia de atendimento do profissional',

  -- Valor da consulta definido pelo profissional para cobrança exclusiva dentro da plataforma
  `valor_consulta` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Valor em reais (R$) da teleconsulta integrada na plataforma',

  -- Tempo médio de duração da sessão em minutos (ex: 60 minutos para consulta detalhada)
  `duracao_consulta_min` SMALLINT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Duração padrão da consulta por vídeo em minutos',

  -- Aceite jurídico obrigatório da RN-MOD-MKT proibindo cobranças ou pagamentos por fora
  `aceite_exclusividade_financeira` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Confirmação de exclusividade financeira interna (RN-MOD-MKT: 1 = aceito)',

  -- Estado da validação cadastral: só aparece na vitrine pública quando "aprovado"
  `status_credenciamento` ENUM('pendente_validacao', 'aprovado', 'rejeitado', 'suspenso') NOT NULL DEFAULT 'pendente_validacao' COMMENT 'Status da validação do conselho ativo (RN-MOD-MKT)',

  -- Data e hora em que a administração validou o registro ativo no conselho (CRM/CRN/CRP/CREF)
  `validado_em` DATETIME DEFAULT NULL COMMENT 'Data e hora da aprovação do conselho profissional pela equipe GlicoCare',

  -- Data e hora em que o profissional enviou o formulário de credenciamento
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da solicitação de credenciamento',

  --Data e hora da última atualização nos dados do perfil do especialista
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última atualização do perfil profissional',

  -- Definição da chave primária da tabela especialistas
  PRIMARY KEY (`id`),

  -- Garante que cada usuário tenha no máximo um perfil de especialista vinculado
  UNIQUE KEY `uk_especialistas_usuario` (`usuario_id`),

  -- Impede duplicidade do mesmo número e tipo de conselho na mesma UF
  UNIQUE KEY `uk_especialistas_conselho_uf` (`tipo_conselho`, `numero_conselho`, `uf_conselho`),

  -- Índice para otimizar a filtragem de especialistas aprovados e por especialidade na vitrine
  KEY `idx_especialistas_status_area` (`status_credenciamento`, `especialidade`),

  -- Chave Estrangeira com CASCADE: se o usuário for excluído ou atualizado, reflete automaticamente
  CONSTRAINT `fk_especialistas_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Perfis profissionais com validação de conselho e exclusividade (RN-MOD-MKT)';
/* FIM DA TABELA 2: especialistas */


/* =============================================================================
   INÍCIO DA TABELA 3: artigos_conteudos
   OBJETIVO: Armazenar os artigos pedagógicos e guias práticos da Biblioteca
   GlicoCare, projetados para leitura com amplo respiro visual e tom acolhedor.
   ============================================================================= */
CREATE TABLE IF NOT EXISTS `artigos_conteudos` (
  -- Identificador único do artigo ou guia pedagógico (Chave Primária)
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do artigo na Biblioteca GlicoCare',

  -- Chave estrangeira identificando o autor ou curador responsável pelo conteúdo
  `autor_usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK referenciando o autor/curador na tabela usuarios(id)',

  -- Título acolhedor do artigo exibido em fonte serifada Fraunces
  `titulo` VARCHAR(220) NOT NULL COMMENT 'Título principal do artigo pedagógico',

  -- Identificador amigável para URL (ex: primeiro-mes-apos-diagnostico-dm1)
  `slug` VARCHAR(240) NOT NULL COMMENT 'Slug único amigável para SEO e rotas de leitura',

  -- Categoria temática para filtro rápido na Biblioteca (ex: Rotina Escolar, Monitoramento)
  `categoria` VARCHAR(80) NOT NULL COMMENT 'Categoria temática para filtragem no feed da Biblioteca',

  -- Síntese empática exibida nos Cards de Conteúdo antes do clique para leitura
  `resumo` VARCHAR(500) NOT NULL COMMENT 'Resumo curto exibido nos cards da Biblioteca e da Home',

  -- Corpo completo do artigo estruturado para leitura tranquila e com respiro visual
  `conteudo` LONGTEXT NOT NULL COMMENT 'Texto integral do artigo pedagógico com suporte a formatação rica',

  -- Tempo estimado de leitura em minutos para orientar a família
  `tempo_leitura_min` SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Tempo estimado de leitura em minutos',

  -- Controle editorial do artigo (apenas artigos "publicado" aparecem na Biblioteca pública)
  `status_publicacao` ENUM('rascunho', 'em_revisao', 'publicado', 'arquivado') NOT NULL DEFAULT 'publicado' COMMENT 'Status editorial do artigo na plataforma',

  -- Data e hora de criação do artigo
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação do artigo',

  -- Data e hora da última revisão editorial
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última edição do artigo',

  -- Definição da chave primária da tabela artigos_conteudos
  PRIMARY KEY (`id`),

  -- Garante que não existam dois artigos com a mesma URL amigável (slug)
  UNIQUE KEY `uk_artigos_slug` (`slug`),

  -- Índice para busca rápida do autor do conteúdo
  KEY `idx_artigos_autor` (`autor_usuario_id`),

  -- Índice composto para acelerar os filtros por categoria na Biblioteca pública
  KEY `idx_artigos_categoria_status` (`categoria`, `status_publicacao`),

  -- Chave Estrangeira com CASCADE vinculada à tabela usuarios
  CONSTRAINT `fk_artigos_autor_usuario`
    FOREIGN KEY (`autor_usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Acervo de artigos pedagógicos e conteúdos da Biblioteca GlicoCare';
/* FIM DA TABELA 3: artigos_conteudos */


/* =============================================================================
   INÍCIO DA TABELA 4: depoimentos_moderacao
   OBJETIVO: Armazenar os relatos enviados pelas famílias na seção "Vozes que já
   passaram por aqui", aplicando rigorosamente a Regra de Negócio RN-MOD-01
   (aprovação manual prévia obrigatória antes da exibição pública).
   ============================================================================= */
CREATE TABLE IF NOT EXISTS `depoimentos_moderacao` (
  -- Identificador único do depoimento na fila de moderação (Chave Primária)
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do depoimento familiar',

  -- Chave estrangeira vinculando o depoimento ao artigo onde foi escrito
  `artigo_id` INT UNSIGNED NOT NULL COMMENT 'FK referenciando o artigo em artigos_conteudos(id)',

  -- Chave estrangeira vinculando o relato ao usuário familiar que o enviou
  `usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK referenciando o autor do relato em usuarios(id)',

  -- Nome de exibição escolhido pelo familiar (ex: "Mariana S., mãe do Theo")
  `nome_exibicao_familiar` VARCHAR(120) NOT NULL COMMENT 'Nome público e parentesco exibidos após aprovação (RN-MOD-01)',

  -- Contexto opcional da jornada com o DM1 (ex: "6 anos, usa sensor FreeStyle Libre")
  `parentesco_contexto` VARCHAR(120) DEFAULT 'Família DM1' COMMENT 'Contexto familiar exibido junto à assinatura do depoimento',

  -- Texto integral do depoimento compartilhado pela família
  `relato` TEXT NOT NULL COMMENT 'Conteúdo textual da mensagem de acolhimento enviada pela família',

  -- RN-MOD-01: Todo relato nasce obrigatoriamente como "pendente" até revisão manual do admin
  `status_moderacao` ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente' COMMENT 'RN-MOD-01: Exige status aprovado manualmente antes de exibir no site',

  -- Observação interna opcional registrada pelo moderador no momento da análise
  `observacao_moderador` VARCHAR(255) DEFAULT NULL COMMENT 'Nota administrativa sobre a aprovação ou motivo de rejeição',

  -- Data e hora exatas em que o administrador aprovou ou rejeitou o relato
  `moderado_em` DATETIME DEFAULT NULL COMMENT 'Data e hora da decisão manual da curadoria GlicoCare',

  -- Data e hora em que a família enviou o depoimento pela página do artigo
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de envio do depoimento para a fila de moderação',

  -- Data e hora da última atualização do registro de moderação
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última atualização de status',

  -- Definição da chave primária da tabela depoimentos_moderacao
  PRIMARY KEY (`id`),

  -- Índice composto para listar rapidamente apenas os depoimentos aprovados de um artigo
  KEY `idx_depoimentos_artigo_status` (`artigo_id`, `status_moderacao`),

  -- Índice para localizar os depoimentos enviados por um usuário específico
  KEY `idx_depoimentos_usuario` (`usuario_id`),

  -- Chave Estrangeira com CASCADE: se o artigo for removido, seus depoimentos são excluídos juntos
  CONSTRAINT `fk_depoimentos_artigo`
    FOREIGN KEY (`artigo_id`) REFERENCES `artigos_conteudos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Chave Estrangeira com CASCADE: vincula o autor familiar na tabela usuarios
  CONSTRAINT `fk_depoimentos_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fila de moderação prévia de relatos familiares (RN-MOD-01)';
/* FIM DA TABELA 4: depoimentos_moderacao */


/* =============================================================================
   INÍCIO DA TABELA 5: agendamentos
   OBJETIVO: Gerenciar a marcação de consultas entre famílias e especialistas,
   garantindo a Regra de Negócio RN-MOD-MKT: exclusividade financeira interna
   (nenhum pagamento por fora), sala de vídeo integrada e emissão de laudos e
   receitas dentro da plataforma.
   ============================================================================= */
CREATE TABLE IF NOT EXISTS `agendamentos` (
  -- Identificador único do agendamento de teleconsulta (Chave Primária)
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID único do agendamento de consulta',

  -- Chave estrangeira do familiar/paciente que agendou a consulta
  `familiar_usuario_id` INT UNSIGNED NOT NULL COMMENT 'FK referenciando o familiar/paciente em usuarios(id)',

  -- Chave estrangeira do especialista credenciado que realizará o atendimento
  `especialista_id` INT UNSIGNED NOT NULL COMMENT 'FK referenciando o profissional em especialistas(id)',

  -- Data e horário agendados para o início da sessão por vídeo
  `data_hora_consulta` DATETIME NOT NULL COMMENT 'Data e horário marcados para a teleconsulta',

  -- Valor pago exclusivamente pelo checkout interno da plataforma (RN-MOD-MKT)
  `valor_transacao_interna` DECIMAL(10, 2) NOT NULL COMMENT 'Valor financeiro processado exclusivamente dentro da plataforma (RN-MOD-MKT)',

  -- Código identificador da transação no gateway interno para auditoria de exclusividade
  `codigo_transacao_interna` VARCHAR(80) NOT NULL COMMENT 'Código de rastreio do pagamento interno exclusivo (proibido pagamento externo)',

  -- Controle do fluxo financeiro interno (custódia segura até a realização da consulta)
  `status_pagamento_interno` ENUM('aguardando_pagamento', 'pago_custodia_interna', 'repassado_especialista', 'reembolsado') NOT NULL DEFAULT 'pago_custodia_interna' COMMENT 'Status do pagamento exclusivo no ecossistema GlicoCare (RN-MOD-MKT)',

  -- Estado operacional da consulta agendada
  `status_agendamento` ENUM('agendado', 'em_atendimento', 'concluido', 'cancelado') NOT NULL DEFAULT 'agendado' COMMENT 'Ciclo de vida da consulta agendada',

  -- URL exclusiva da sala de vídeo integrada gerada pela plataforma GlicoCare
  `link_video_integrado` VARCHAR(255) NOT NULL COMMENT 'Link da sala de teleconsulta por vídeo integrada à plataforma (RN-MOD-MKT)',

  -- Caminho/URL do arquivo PDF contendo receita médica ou laudo assinado digitalmente
  `url_laudo_receita_pdf` VARCHAR(255) DEFAULT NULL COMMENT 'URL interna para download de receitas, planos de ação e laudos emitidos na consulta',

  -- Notas prévias enviadas pela família (ex: dúvidas sobre sensor, basal ou escola)
  `observacoes_familia` TEXT DEFAULT NULL COMMENT 'Relato pré-consulta enviado pela família para preparar o especialista',

  -- Data e hora em que o agendamento foi registrado no sistema
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de criação do agendamento',

  -- Data e hora da última atualização do agendamento (ex: anexação de receita/laudo)
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data e hora da última modificação no registro da consulta',

  -- Definição da chave primária da tabela agendamentos
  PRIMARY KEY (`id`),

  -- Garante que cada código de transação financeira interna seja único
  UNIQUE KEY `uk_agendamentos_transacao` (`codigo_transacao_interna`),

  -- Impede que o mesmo especialista tenha duas consultas marcadas exatamente no mesmo horário
  UNIQUE KEY `uk_especialista_horario` (`especialista_id`, `data_hora_consulta`),

  -- Índice para listar rapidamente o histórico de consultas de uma família
  KEY `idx_agendamentos_familiar` (`familiar_usuario_id`),

  -- Chave Estrangeira com CASCADE vinculada ao usuário familiar/paciente
  CONSTRAINT `fk_agendamentos_familiar_usuario`
    FOREIGN KEY (`familiar_usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Chave Estrangeira com CASCADE vinculada ao especialista credenciado
  CONSTRAINT `fk_agendamentos_especialista`
    FOREIGN KEY (`especialista_id`) REFERENCES `especialistas` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agendamentos por vídeo com pagamento interno exclusivo e laudos (RN-MOD-MKT)';
/* FIM DA TABELA 5: agendamentos */


/* =============================================================================
   INÍCIO DA CARGA INICIAL DE DADOS (SEED DATA) PARA TESTES NO PHPMYADMIN
   OBJETIVO: Popular o banco com registros iniciais coerentes com a identidade
   "Porto Seguro" para validação imediata dos relacionamentos e regras de negócio.
   ============================================================================= */

-- 1. Inserção de usuários iniciais (1 Administrador/Moderador, 2 Especialistas e 2 Familiares DM1)
INSERT INTO `usuarios` (`id`, `nome_completo`, `email`, `senha_hash`, `telefone`, `tipo_perfil`, `contexto_dm1`, `ativo`) VALUES
(1, 'Curadoria GlicoCare', 'curadoria@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 99999-0001', 'admin_moderador', 'Equipe de Acolhimento e Moderação RN-MOD-01', 1),
(2, 'Dra. Helena Vasconcelos', 'helena.endo@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1001', 'especialista', 'Endocrinologista Pediátrica dedicada ao DM1', 1),
(3, 'Nut. Clara Mendonça', 'clara.nutri@glicocare.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 98888-1002', 'especialista', 'Nutricionista especialista em contagem de carboidratos gentil', 1),
(4, 'Mariana Silva', 'mariana.mae@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(11) 97777-2001', 'familiar_paciente', 'Mãe do Theo (6 anos, usa sensor FreeStyle Libre)', 1),
(5, 'Carlos Eduardo Souza', 'carlos.pai@exemplo.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '(21) 97777-2002', 'familiar_paciente', 'Pai da Sofia (9 anos)', 1);

-- 2. Inserção dos especialistas com conselhos validados e exclusividade financeira aceita (RN-MOD-MKT)
INSERT INTO `especialistas` (`id`, `usuario_id`, `especialidade`, `tipo_conselho`, `numero_conselho`, `uf_conselho`, `foco_atuacao`, `biografia_metodo`, `valor_consulta`, `duracao_consulta_min`, `aceite_exclusividade_financeira`, `status_credenciamento`, `validado_em`) VALUES
(1, 2, 'Endocrinologia Pediátrica', 'CRM', '148290', 'SP', 'Diagnóstico recente, lua de mel, bombas de insulina e leitura tranquila do sensor FreeStyle Libre', 'Consultas serenas de 60 minutos com escuta ativa da família e construção compartilhada do plano de ação para casa, escola e madrugadas.', 320.00, 60, 1, 'aprovado', NOW()),
(2, 3, 'Nutrição em DM1', 'CRN', '45912', 'SP', 'Contagem de carboidratos sem terrorismo nutricional, lanches escolares e festas infantis', 'Acompanhamento nutricional afetuoso que preserva o prazer de comer em família e a liberdade da infância com segurança glicêmica.', 210.00, 50, 1, 'aprovado', NOW());

-- 3. Inserção de artigos pedagógicos iniciais na Biblioteca GlicoCare
INSERT INTO `artigos_conteudos` (`id`, `autor_usuario_id`, `titulo`, `slug`, `categoria`, `resumo`, `conteudo`, `tempo_leitura_min`, `status_publicacao`) VALUES
(1, 1, 'O primeiro mês após o diagnóstico: respirando um dia de cada vez', 'primeiro-mes-apos-diagnostico-respirando-um-dia-de-cada-vez', 'Acolhimento Inicial', 'Como organizar a rotina da casa, acolher os sentimentos da família e dar segurança à criança nos primeiros passos com a insulina e o sensor.', 'Receber o diagnóstico de Diabetes Tipo 1 na família costuma vir acompanhado de muitas informações novas de uma só vez. Lembre-se de que nenhum número no leitor do sensor define o seu amor ou o seu cuidado.', 6, 'publicado'),
(2, 1, 'DM1 na Escola: construindo uma parceria tranquila com os professores', 'dm1-na-escola-parceria-tranquila-com-professores', 'Rotina Escolar', 'Um roteiro prático e afetuoso para orientar a equipe pedagógica sobre lanches, educação física e o kit de hipoglicemia.', 'Deixar quem amamos na escola exige confiança. Preparar um guia visual simples para os professores e um kit de hipoglicemia identificado transforma o receio em parceria.', 8, 'publicado');

-- 4. Inserção de depoimentos familiares demonstrando a fila RN-MOD-01 (1 aprovado e 1 pendente de moderação)
INSERT INTO `depoimentos_moderacao` (`id`, `artigo_id`, `usuario_id`, `nome_exibicao_familiar`, `parentesco_contexto`, `relato`, `status_moderacao`, `observacao_moderador`, `moderado_em`) VALUES
(1, 1, 4, 'Mariana S., mãe do Theo (6 anos)', 'Mãe de criança com DM1', 'No começo achei que nunca mais dormiria em paz. Hoje, seis meses depois, ver meu filho brincando feliz na escola com o sensorzinho dele me mostra o quanto somos fortes.', 'aprovado', 'Relato acolhedor e alinhado às diretrizes Porto Seguro.', NOW()),
(2, 1, 5, 'Carlos E., pai da Sofia (9 anos)', 'Pai de criança com DM1', 'Trocar a culpa pelo acolhimento mudou tudo aqui em casa. Seguimos o plano da endocrinologista com serenidade.', 'pendente', NULL, NULL);

-- 5. Inserção de agendamento de teleconsulta demonstrando a RN-MOD-MKT (pagamento interno, vídeo integrado e laudo)
INSERT INTO `agendamentos` (`id`, `familiar_usuario_id`, `especialista_id`, `data_hora_consulta`, `valor_transacao_interna`, `codigo_transacao_interna`, `status_pagamento_interno`, `status_agendamento`, `link_video_integrado`, `url_laudo_receita_pdf`, `observacoes_familia`) VALUES
(1, 4, 1, '2026-11-20 14:00:00', 320.00, 'GC-PAY-2026-0001', 'pago_custodia_interna', 'agendado', 'https://video.glicocare.com.br/sala/helena-theo-001', '/arquivos_internos/laudos/plano_acao_theo_dm1.pdf', 'Gostaria de revisar as curvas da madrugada no sensor FreeStyle Libre e atualizar a cartinha da escola.');

/* FIM DA CARGA INICIAL DE DADOS (SEED DATA) */
