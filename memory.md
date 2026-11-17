# 🧠 MEMORY.MD — Glicocare: Base de Conhecimento e Regras do Sistema

## 1. Visão Geral & Público-Alvo
- Nome: GlicoCare
- Proposta: Plataforma humanizada de acolhimento, suporte pedagógico, biblioteca de conteúdos e saúde integrada para famílias com Diabetes Tipo 1 (DM1).
- Público: Pais, mães, familiares e pacientes com DM1.

## 2. Identidade Visual & Tom de Voz ("Porto Seguro")
- Cores Oficiais: Fundo bege suave (#EAE4D9), superfícies marfim (#F6F3EE), textos café quente (#2E2824), títulos terracota executivo (#7C533F), botões verde alívio (#3B7E48).
- Tipografia: Títulos em Fraunces (serifada elegante); corpo de texto em Plus Jakarta Sans (sem-serifa legível).
- Mascote: "Lufy" (coala com sensor FreeStyle Libre), atuando como guia empático e bot de triagem.
- Tom de Voz: Sereno, calmo, acolhedor, humanizado e seguro. Nunca clínico/frio.

## 3. Arquitetura Tecnológica
- Front-end: React (com Vite e componentes responsivos).
- Back-end: PHP relacional.
- Banco de Dados: MySQL (compatível com phpMyAdmin).

## 4. Regras de Negócio (RNs) Fundamentais
- Moderação de Conteúdo (RN-MOD-01): Depoimentos e mensagens enviadas pelas famílias ("Vozes que já passaram por aqui") exigem aprovação manual prévia no painel administrativo antes da exibição pública.
- Navegação (Navbar): Desktop exibe barra horizontal completa e fixa; Mobile utiliza menu hambúrguer com gaveta; Páginas de artigos exibem navbar limpa com botão "← Voltar à biblioteca".
- Marketplace de Especialistas (RN-MOD-MKT): Credenciamento exige validação rigorosa de conselho ativo (CRM, CRN, CREF, CRP). Nenhuma cobrança ou pagamento por fora é permitido (exclusividade financeira interna). Agendamento e consultas ocorrem por vídeo integrada com suporte a laudos e receitas.
  - **RN-ESP-01 (Credenciamento e Perfil do Profissional)**: Validação obrigatória de registro de classe ativo (CRM, CRN, CREF, CRP, Pedagogo, etc.), definição de especialidade principal + subespecialidades/focos (Emagrecimento, Infância e Adolescência, Contagem de Carboidratos, Ajuste de Insulina) e transparência curricular (foto oficial, nome completo, biografia humanizada com método e selo de verificação GlicoCare).
  - **RN-AGD-02 (Agenda e Agendamento de Consultas)**: Disponibilidade em tempo real gerenciada pelo profissional (dias, horários livres e duração padrão), vínculo imediato com bloqueio automático de slot na agenda para evitar conflitos de horário e disparo de confirmação automatizada para paciente e especialista.
  - **RN-FIN-03 (Módulo Financeiro e Transações Internas)**: Centralização exclusiva de pagamentos via gateways integrados à GlicoCare (proibida cobrança externa), gestão automatizada de retenção de taxa de serviço/comissão GlicoCare e repasse ao profissional, e emissão de recibos e notas fiscais digitais para usuário e especialista.
  - **RN-ATD-04 (Atendimento Online e Suporte Clínico)**: Ambiente nativo de videoconferência integrado à plataforma (sem links externos), emissão digital de prescrições médicas, pedidos de exames laboratoriais (como hemoglobina glicada HbA1c) e guias de encaminhamento, com salvamento automático no Histórico Clínico Unificado da família.
- **Controle de Permissões e Acesso por Perfil (RN-ACC-01)**: Sistema de RBAC (Role-Based Access Control) multiperfil implementado de ponta a ponta no React (`AuthContext.jsx` e `ProtectedRoute.jsx`) e no PHP PDO (`AuthMiddleware.php`).
  * **4 Perfis Oficiais e Roteamento:**
    - `visitante` (Não autenticado): Acesso irrestrito a páginas institucionais e públicas (`/`, `/conteudos`, `/biblioteca`, `/artigo/:id`, `/especialistas`, `/login`, `/cadastro`, `/credenciamento`). Qualquer tentativa de agendar consulta ou acessar áreas restritas redireciona acolhedoramente para `/login`.
    - `diabetico` (Pessoa com Diabetes): Acesso ao Meu Espaço pessoal (`/meu-perfil` ou `/minha-jornada`), diário glicêmico interativo com cores em tempo real, teleconsultas e biblioteca personalizada.
    - `cuidador` (Mãe/Pai/Apoio Familiar): Gerenciamento do perfil de saúde e histórico do dependente com DM1, teleconsultas familiares e moderação de depoimentos (`RN-MOD-01`).
    - `especialista`: Validação estrita do credenciamento profissional (`RN-ESP-01`). Se `registro_verificado = FALSE`, exibe aviso de análise acolhedora; se `TRUE`, acesso liberado ao Painel do Especialista (`/painel-especialista`) para horários, consultas e receitas.
    - `admin` (`admin_moderador`): Acesso total ao Painel de Curadoria (`/painel-admin`) para moderação prévia de relatos (`RN-MOD-01`), aprovação de credenciamento (`RN-ESP-01`) e consulta da trilha imutável `logs_auditoria`.
  * **Onboarding em Duas Etapas:**
    - **Etapa 1 — Cadastro Rápido (`/cadastro`)**: Nome de preferência, e-mail, senha e seleção visual do perfil sem atrito inicial.
    - **Etapa 2 — Boas-Vindas Pós-Cadastro (`/boas-vindas`)**: Acolhimento empático com pergunta *"Quer personalizar seu perfil de cuidado agora ou prefere fazer isso depois?"* ("Configurar agora" vs "Configurar depois").
  * **Sequência Inteligente de Configuração do Perfil (`/configurar-perfil`)**:
    - **Bloco A**: Dados Base & Diagnóstico (Nome completo, nascimento/aniversário, sexo biológico, altura e peso opcionais, tipo de diabetes, data do diagnóstico e terapia de insulina).
    - **Bloco B**: Fatores de sensibilidade glicêmica (Estresse, calor, infecções, exercícios intensos e sonolência pós-refeição).
    - **Bloco C (Condicional por Sexo)**:
      * *Feminino*: Método contraceptivo hormonal, duração do ciclo/menstruação, planejamento gestacional, hiperglicemia na TPM/menstruação, condições inflamatórias (Endometriose, SOP, Miomas) e comorbidades de alerta.
      * *Masculino*: Fadiga persistente, alteração/queda de libido / disfunção erétil, objetivo físico principal e suplementos.
    - **Bloco D**: Lista dinâmica de medicamentos e insulinas ativas (nome, tipo, dose, unidade, horário e frequência).
  * **Página Pessoal e Diário Glicêmico (`/meu-perfil`)**:
    - Cabeçalho com idade calculada, badges de diagnóstico e terapia, e aviso de cuidador quando aplicável.
    - Resumo dos fatores de sensibilidade e medicamentos ativos.
    - Diário de glicemia com feedback imediato por cores (Verde Alívio = 70-140 mg/dL, Amarelo Suave = 141-180 mg/dL, Alerta/Terracota = Fora do Alvo) e orientações empáticas sem terrorismo.
    - Linha do tempo cronológica com suporte a anotações retroativas e exclusão auditada.
  * **Segurança e Persistência:**
    - Autenticação com senhas criptografadas via `password_verify()` com `PASSWORD_DEFAULT`.
    - Tokens de sessão alfanuméricos únicos (128 chars) com expiração persistidos na tabela `usuarios`.
    - Persistência no cliente com suporte a `localStorage` (opção "Lembrar de mim") ou `sessionStorage` (sessão volátil).
    - Tentativas não autorizadas de acesso aos endpoints geram código HTTP 403 e registro automático em `logs_auditoria` com a ação `ACESSO_NEGADO` para total rastreabilidade.
- Bot do Lufy: Triagem por cenários (glicemia alta/baixa, escola, madrugada) com acolhimento imediato e disclaimer médico obrigatório recomendando o plano de ação do endocrinologista.
- **Auditoria e Logs Imutáveis (RN-AUD-01)**: Toda e qualquer mutação de dados (`CRIACAO`, `EDICAO`, `EXCLUSAO`) nas entidades do sistema (`artigos_conteudos`, `especialistas`, `depoimentos_moderacao`, `agendamentos`, `usuarios`) exige compulsoriamente a gravação de uma trilha de auditoria imutável na tabela `logs_auditoria` via `AuditLogger::registrar(...)`.
  * **Imutabilidade Estrita (Append-Only)**: A tabela `logs_auditoria` é estritamente append-only (apenas inserção). É terminantemente proibido qualquer `UPDATE` ou `DELETE` em seus registros, garantindo proteção jurídica, conformidade estrita com a LGPD e impossibilidade de fraude ou alteração de histórico.
  * **Rastreabilidade Completa**: Cada evento armazena `usuario_id`, `usuario_nome`, `acao`, `tabela_afetada`, `registro_id`, `pagina_impacto` (rota da tela no front-end), `valor_anterior` (snapshot JSON antes da mutação), `valor_novo` (snapshot JSON após a mutação), `ip_origem` e `data_hora_local` com fuso horário `America/Sao_Paulo`.
  * **Integração Obrigatória**: Qualquer novo endpoint ou funcionalidade que crie, atualize ou exclua registros deve obrigatoriamente acionar o `AuditLogger` antes de concluir a resposta ao cliente.

## 5. Design System e Padrões Visuais (GlicoCare UI)

### A. Tipografia e Estrutura de Textos
- **Fontes Oficiais:**
  * Títulos e Destaques: `Fraunces` (serifada elegante, com uso opcional de itálico em palavras-chave para suavidade, ex: *segura*, *Afeto*).
  * Corpo de Tópicos e Textos: `Plus Jakarta Sans` (sem-serifa moderna, alta legibilidade).
- **Hierarquia de Textos nas Páginas:**
  * **Tag de Seção / Eyebrow:** Texto pequeno em letras maiúsculas (uppercase), precedido por um traço horizontal sutil (`— INFORMAÇÃO QUE ACOLHE`) ou dentro de um badge estilo pílula com fundo translúcido e ponto verde alívio.
  * **Título Principal (H1):** Grande, serifado (Fraunces), com alto espaçamento entre linhas (`line-height`), transmitindo calma e autoridade afetuosa (ex: *"Transforme o diagnóstico em uma rotina segura e sem pânico"*).
  * **Subtítulo / Parágrafo de Apoio:** Texto limpo, com bom respiro lateral, focado em clareza pedagógica e acolhimento prático.

### B. Componentes e Cards Principais
1. **Botões de Ação Principal (CTA):**
   * Estilo Pílula com fundo em Verde Alívio (`#3B7E48`), texto branco e ícone de seta (`→`).
   * Botões secundários em formato de pílula com fundo marfim (`#F6F3EE`), borda fina em tom terrosos e ícone de seta diagonal (`↗`).
2. **Cards de Diferenciais (Grid 3 Colunas):**
   * Fundo em Branco Acolhedor (`#F6F3EE`), bordas suaves e arredondadas (`border-radius: 12px`).
   * Ícone circular superior em destaque (com fundo em Verde Alívio ou tom neutro) acompanhado de numeração discreta no canto superior direito (`01`, `02`, `03`).
   * Título em Fraunces e texto descritivo alinhado à esquerda com uma linha divisória sutil ao rodapé do card.
3. **Cards da Biblioteca de Conteúdos (Feed):**
   * Imagem de capa limpa e arredondada no topo com tag de categoria sobreposta (ex: *GUIA ESSENCIAL* ou *PARA COMPARTILHAR*).
   * Metadados no topo do card (ícone da categoria e tempo estimado de leitura, ex: `6 min de leitura`).
   * Título do artigo em destaque, resumo em duas linhas e rodapé com o link *"Ler conteúdo"* acompanhado de um botão circular com seta.
4. **Filtros de Categoria (Abas):**
   * Botões em formato de pílula para filtragem rápida no topo da biblioteca. O item ativo ganha preenchimento em Verde Alívio (`#3B7E48`) e texto branco; os inativos ficam em tom neutro suave com ícones.
5. **Widget do Bot (Lufy):**
   * Balão de fala flutuante com bordas arredondadas suaves, contendo uma frase acolhedora do mascote em destaque (ex: *"Ei, respira. A gente vai aprender isso juntos."*), acompanhado da identidade do Lufy e botão de chat rápido.
