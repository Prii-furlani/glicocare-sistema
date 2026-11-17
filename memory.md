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
  * **Tempo de Descoberta / Diagnóstico e Cálculo Automático da Jornada:**
    - Campo `data_diagnostico` (DATE) posicionado logo após a classificação do diabetes, aceitando data completa ou mês/ano (com dia 01 padrão).
    - Função utilitária pura `calcularTempoDiagnostico(dataDiagnostico)` em `frontend/src/utils/dateUtils.js`.
    - Retorna anos e meses naturais em português (ex: *"3 anos e 5 meses"*, *"1 ano"*, *"Menos de 1 mês"*).
    - Classificação empática de fases:
      * `recem_diagnosticado` (< 6 meses): *"Primeiros passos: estamos com você em cada descoberta!"*
      * `adaptacao` (6 meses a 2 anos): *"Fase de adaptação: construindo uma rotina serena e segura."*
      * `experiente` (> 2 anos): *"Sua jornada já soma X anos e Y meses de aprendizado, força e superação."*
    - Feedback em tempo real exibido imediatamente abaixo do campo de data em `/configurar-perfil`.
    - Badge elegante com ícone no cabeçalho do Meu Espaço (`/meu-perfil`) e resumo clínico formatado para anamnese de especialistas em teleconsultas.
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

### C. Páginas de Leitura de Artigos / Conteúdos (Layout Editorial Aberto — RN-EDI-01)
- **Regra Visual Fundamental:** As páginas de detalhamento de artigos (`/artigo/:slug` ou `/artigo/:id`) **NUNCA** devem ser encaixotadas dentro de um card único ou container branco que envolva todo o texto. A leitura deve fluir de maneira aberta e serena diretamente sobre o fundo bege acolhedor (`--cor-fundo: #EAE4D9`).
- **Cabeçalho Centralizado (~820px):**
  * Badge em pílula com ícone da categoria e tempo estimado de leitura (ex: `🐾 Com o Lufy • 6 min de leitura`).
  * Título H1 em `Fraunces` com destaque em itálico e cor terracota (`#7C533F`) nas palavras-chave empáticas.
  * Subtítulo introdutório e metadados do autor com avatar circular em Verde Alívio (`#3B7E48`) contendo iniciais, nome e ano de revisão clínica.
- **Imagens Amplas e Responsivas (max-width: 1040px):**
  * Tanto a imagem de capa quanto imagens intermediárias ocupam largura ampla (1040px) com cantos arredondados (`border-radius: 16px`) e legenda centralizada em itálico suave.
- **Coluna de Leitura Editorial (~720px):**
  * Primeiro parágrafo com letra capitular (Drop Cap) em `Fraunces` Terracota (`#7C533F`) com 2 linhas de altura.
  * Blocos de citação *"Respiro do Guardião"* em cards internos `--cor-superficie` (`#F6F3EE`) com borda lateral esquerda de `4px solid` em Verde Alívio (`#3B7E48`) ou Terracota (`#7C533F`).
  * Lista vertical de passos numerados práticos: cards horizontais individuais em `#F6F3EE` com badge circular (`01`, `02`, `03`, `04`) à esquerda e título + descrição à direita.
  * Banner escuro do mascote Lufy (`#231F1D`): fundo escuro acolhedor com avatar circular do Lufy, frase em `Fraunces` e link de rolagem suave *"Encontrar outras famílias ↓"*.
  * Box de aviso ético e clínico discreto em `#F6F3EE` reforçando o papel pedagógico e o não-substitutivo do médico.
- **Seção de Comentários e Comunidade (Grid 2 Colunas sobre #EAE4D9):**
  * Separada por linha divisória horizontal sutil.
  * Título *"Este também pode ser um lugar de encontro."*
  * Coluna esquerda: card de formulário em `#F6F3EE` com campos, validação do moderador e botão verde de envio.
  * Coluna direita: coluna *"VOZES QUE JÁ PASSARAM POR AQUI"* com os depoimentos aprovados em cards limpos `#F6F3EE` com borda lateral em Verde Alívio.

---

## 6. Tempo de Diagnóstico, Jornada de Aprendizado e Resumo Clínico

### A. Campo de Data de Diagnóstico (`data_diagnostico` em `perfis_saude`)
- Localizado logo após a classificação do diabetes nas telas de cadastro complementar (`ConfigurarPerfil.jsx`) e de edição de perfil.
- Feedback imediato, afetuoso e em tempo real à medida que a data é preenchida.

### B. Cálculo Automático da Jornada (`frontend/src/utils/dateUtils.js`)
- Função utilitária pura `calcularTempoDiagnostico(dataDiagnostico)`:
  * Devolve o tempo transcorrido em anos e meses formatados em português natural (ex: *"3 anos e 5 meses"*, *"1 ano"*, *"8 meses"*, *"Menos de 1 mês"*).
  * Classificação de fase da jornada:
    - `recem_diagnosticado` (< 6 meses) — Badge `🌿 Recém-diagnosticado(a)` — Tom de acolhimento nos primeiros passos;
    - `adaptacao` (6 meses a 2 anos) — Badge `🌱 Fase de Adaptação` — Reconhecimento da construção de rotina segura;
    - `experiente` (> 2 anos) — Badge `🌱 Jornada Experiente` — Validação de resiliência e maturidade no autocuidado.

### C. Apresentação nas Telas do Sistema
- **Página Pessoal (`MeuPerfil.jsx`):** Badge de destaque no cabeçalho do perfil e card de medidas com resumo acolhedor da jornada.
- **Painel do Especialista (`PainelEspecialista.jsx`):** Exibição do "Resumo Clínico para Anamnese" em cada consulta agendada, informando o tempo de diagnóstico e tipo de diabetes para agilizar a consulta sem exigir que a família repita toda a história clínica.

---

## 7. Diário Inteligente de Glicemia, Insulina Ativa (IOB), FSI e Tendência Destro (RN-GLI-01)

### A. Parâmetros Clínicos Educativos (`perfis_saude`)
- Campos armazenados:
  * `fsi`: Fator de Sensibilidade Insulínica (1 UI reduz X mg/dL, ex: 20, 30, 40).
  * `glicemia_alvo`: Meta glicêmica educativa (padrão 100 mg/dL).
  * `duracao_insulina_horas`: Duração da ação da insulina rápida/ultrarrápida no organismo (3h, 4h ou 5h, padrão 3h).
- **Aviso Ético Obrigatório:** *"Estes parâmetros são estritamente educativos e devem refletir com fidelidade as metas prescritas pela equipe médica do paciente. A GlicoCare não prescreve nem altera doses de insulina."*

### B. Motor de Cálculo Educativo (`frontend/src/utils/glicemiaAnalytics.js`)
1. **Insulina Ativa (IOB Estimada) — `calcularInsulinaAtiva()`:**
   - Calcula a insulina restante no organismo com base em curva de decaimento fisiológico (0 min: 100%, 30 min: 80%, 60 min: 60%, 90 min: 40%, 120 min: 25%, 150 min: 10%, 180 min: 0%).
   - Informa as UI ativas e o tempo estimado de expiração total (ex: `expira em ~1h15`).
2. **Projeção pelo FSI e Detecção de Empilhamento — `calcularProjecaoFSI()`:**
   - Calcula `(insulinaAtiva + novaDose) * fsi` e projeta a glicemia resultante.
   - Emite **Alerta Educativo de Sobreposição / Risco de Hipoglicemia** quando a projeção resultante fica abaixo de 70 mg/dL, orientando calma antes de aplicar uma nova correção.
3. **Velocidade de Variação e Seta de Tendência entre Destros — `calcularTendenciaDestro()`:**
   - Para intervalos $\le 45$ minutos entre pontas de dedo consecutivas, calcula a taxa em mg/dL por minuto:
     * $> +2.0$: `↑↑ Subida brusca`
     * $> +1.0$: `↑ Subida rápida`
     * $> +0.4$: `↗ Subida moderada`
     * $-0.4 \dots +0.4$: `→ Estável`
     * $-1.0 \dots -0.4$: `↘ Queda moderada`
     * $-2.0 \dots -1.0$: `↓ Queda rápida`
     * $< -2.0$: `↓↓ Queda brusca` (atenção preventiva mesmo com número atual ainda em faixa normal).

### C. Apresentação no Diário Pessoal (`MeuPerfil.jsx`)
- **Painel Resumo Superior:** 3 cards com Insulina Ativa (IOB), Última Glicemia + Seta de Tendência e Metas Clínicas com botão de ajuste modal.
- **Formulário com Simulação em Tempo Real:** Feedback dinâmico enquanto digita a glicemia e/ou dose de insulina.
- **Linha do Tempo em Planilha Inteligente:** Colunas para Data/Hora, Glicemia & Tendência, Dose Aplicada, IOB no Momento, Insulina Total no Corpo, Contexto e Ação de exclusão auditada.
- **Auditoria e Banco TiDB Cloud:** Tabela `registros_glicemia` atualizada com as colunas de IOB, taxa por minuto e tendência, auditada compulsória por `AuditLogger::registrar()` no fuso `America/Sao_Paulo`.

## 8. Página Informativa de Atendimentos e Módulo de Pré-Atendimento Acolhedor (RN-ATD-05)

### A. Página Informativa `/como-funciona-atendimentos`
- **Layout Fluido & Aberto:** Concebido de ponta a ponta sobre o fundo bege acolhedor (`--cor-fundo: #EAE4D9`), utilizando cards isolados em marfim suave (`--cor-superficie: #F6F3EE`) apenas para os passos, bloco de metodologia e FAQ.
- **Hero Acolhedor:**
  * Eyebrow em letras maiúsculas: `— ATENDIMENTO HUMANIZADO E SEM PRESSA`.
  * H1 em tipografia serifada `Fraunces` com palavra-chave em destaque itálico terracota: *"Consultas que acolhem, esclarecem e respeitam o tempo da sua família."*
  * Selos de confiança: Especialistas com conselho verificado (CRM, CRN, CREF, CRP), pagamento em custódia interna protegida (RN-FIN-03) e teleconsulta nativa sem necessidade de baixar apps externos (RN-ATD-04).
- **Os 5 Passos do Atendimento GlicoCare:**
  * `01`: Escolha o especialista ideal para o seu momento (filtros por infância, esporte, contagem de carboidratos e diagnóstico recente).
  * `02`: Agende com tranquilidade na agenda em tempo real (bloqueio automático de slot e confirmação imediata).
  * `03`: Pagamento 100% seguro com custódia protegida (garantia de acolhimento e recibo para reembolso).
  * `04`: O Pré-Atendimento Acolhedor que muda o jogo (coleta de dores, dúvidas e compartilhamento de diário).
  * `05`: Teleconsulta nativa e plano de ação conjunto (vídeo integrado e receitas/laudos digitais).
- **Destaque: Por que o Pré-Atendimento transforma a consulta:**
  * Card em `#F6F3EE` com borda lateral esquerda de 6px em Verde Alívio (`#3B7E48`).
  * 3 pilares práticos: Zero tempo perdido com perguntas repetitivas, Nenhuma dúvida importante fica para trás e Foco total nas dores e metas reais da família.
- **FAQ Interativo em Accordion:** 4 respostas imediatas para dúvidas sobre navegadores, remarcação acolhedora, compartilhamento de diário e emissão digital de receitas.
- **Chamada Final (CTA):** Botão em Verde Alívio (`#3B7E48`) direcionando a família para a vitrine de especialistas (`/especialistas`).
- **Navegação Integrada:**
  * Link *"Como Funciona"* na barra horizontal fixa do desktop e no menu hambúrguer mobile (`Navbar.jsx`).
  * Link em destaque no topo da vitrine de profissionais (`Especialistas.jsx`): *"Entenda como funciona o atendimento humanizado na GlicoCare →"*.

### B. Módulo de Pré-Atendimento e Banco de Dados (`pre_atendimentos`)
- **Tabela `pre_atendimentos` (TiDB Cloud MySQL):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `agendamento_id`: INT UNSIGNED NOT NULL UNIQUE (FK -> `agendamentos(id)` ON DELETE CASCADE).
  * `motivo_principal`: VARCHAR(255) NOT NULL (razão principal da consulta).
  * `maiores_dores`: TEXT NOT NULL (preocupações e sentimentos da família).
  * `duvidas_prioritarias`: TEXT DEFAULT NULL (perguntas que a família não quer esquecer).
  * `compartilhar_perfil_saude`: TINYINT(1) NOT NULL DEFAULT 1 (autorização de acesso ao diário glicêmico).
  * `preenchido_em`: DATETIME NOT NULL.
  * `criado_em` e `atualizado_em`: TIMESTAMP.
- **Endpoint PHP (`/backend/api/agendamentos/pre_atendimento.php`):**
  * `GET`: Visualização autorizada para o familiar tutor, o especialista responsável e a curadoria (admin).
  * `POST` / `PUT`: Criação e edição restrita à família tutora ou admin, capturando snapshots antes e depois para a trilha imutável `logs_auditoria` via `AuditLogger::registrar()` no fuso `America/Sao_Paulo`.

## 9. Padrão Oficial de Layout: Container Fluido e Menu Enxuto (RN-LAY-01)

### A. Container Fluido Proporcional
- **Classe Global `.container`**: `width: 92%; max-width: 1320px; margin: 0 auto; padding: 0 var(--espaco-lg);`
  * Aproveita dinamicamente a largura de monitores desktop e telas widescreen, eliminando a sensação de conteúdo estreito ou "encaixotado" no centro.
- **Leitura Confortável de Artigos (`.container-leitura`)**: `width: 92%; max-width: 760px; margin: 0 auto;`
  * Mantém largura controlada exclusivamente para o corpo textual de artigos longos, preservando a ergonomia e o conforto ocular da família.

### B. Barra de Navegação Desktop e Mobile (`Navbar.jsx` e CSS)
- **Menu Desktop (>= 1024px) Enxuto e Sem Quebra de Linha:**
  * Máximo de 5 links em linha única com `white-space: nowrap`: `Início`, `Conteúdos`, `Especialistas`, `Como Funciona`, `FAQ`.
  * Eliminação completa de duplicidade de links ("Entrar" nunca é repetido ao lado do botão).
  * Exatamente 2 ações alinhadas à extrema direita (`gap: 12px`, `flex-shrink: 0`):
    - Botão secundário pílula `Entrar` (quando deslogado) ou pílula com identificação do perfil logado (ex: `Mariana · Família DM1`) + botão discreto `Sair`.
    - Botão principal pílula Verde Alívio (`#3B7E48`): `Baixar guia gratuito →`.
- **Breakpoint Responsivo em 1024px:**
  * Em telas menores que `1024px` (tablets e smartphones), os links horizontais e ações de desktop são ocultados e substituídos pelo botão hambúrguer limpo.
  * A gaveta mobile abre com itens verticais organizados e confortáveis para o polegar (`min-height: 44px` por item), incluindo atalhos para Início, Conteúdos, Especialistas, Como Funciona, Diferenciais, Planos, FAQ, autenticação e CTA do guia gratuito no rodapé.

### C. Grid Dinâmico da Home (`Home.jsx`)
- **Seção Hero:**
  * **Desktop (>= 1024px):** Layout em 2 colunas equilibradas (`grid-template-columns: 1.1fr 0.9fr`, `gap: 64px`, `align-items: center`). Coluna esquerda com título em Fraunces, subtítulo e CTAs; coluna direita com o card do mascote Lufy ocupando 100% da largura da coluna, sem recuos excessivos.
  * **Mobile (< 768px):** 1 coluna vertical fluida.
- **Seção "Conheça o Lufy":**
  * **Desktop (>= 1024px):** 2 colunas lado a lado (`grid-template-columns: 1fr 1fr`, `gap: 56px`, `align-items: center`) — imagem da família com a citação acolhedora à esquerda, narrativa e pilares *Calma* e *Coragem* à direita.
  * **Mobile/Tablet (< 1024px):** Empilhamento suave em coluna única.
- **Diferenciais e Biblioteca de Conteúdos:**
  * Grid responsivo: **3 colunas no desktop (>= 1024px)**, **2 colunas no tablet (640px-1023px)** e **1 coluna / feed vertical no mobile**.

## 10. Central de Exames, Upload de Laudos e Guias Médicas (RN-EXA-01)

### A. Estrutura do Banco de Dados Relacional (TiDB Cloud MySQL)
- **Tabela `solicitacoes_exames` (Guias médicas emitidas pelos especialistas):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `agendamento_id`: INT UNSIGNED NOT NULL (FK -> `agendamentos(id)` ON DELETE CASCADE).
  * `especialista_id`: INT UNSIGNED NOT NULL (FK -> `especialistas(id)` ON DELETE CASCADE).
  * `perfil_saude_id`: INT UNSIGNED NOT NULL (FK -> `perfis_saude(id)` ON DELETE CASCADE).
  * `titulo_pedido`: VARCHAR(180) NOT NULL (ex: "Rotina Trimestral DM1 + Vitaminas e Função Renal").
  * `lista_exames_solicitados`: JSON NOT NULL (array com procedimentos solicitados).
  * `guia_pdf_path`: VARCHAR(255) DEFAULT NULL (rota/caminho para emissão e impressão do PDF).
  * `status`: ENUM('PENDENTE', 'REALIZADO') NOT NULL DEFAULT 'PENDENTE'.
  * `data_solicitacao`: DATETIME NOT NULL.
- **Tabela `exames_paciente` (Cabeçalho de cada coleta/bateria laboratorial):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `perfil_saude_id`: INT UNSIGNED NOT NULL (FK -> `perfis_saude(id)` ON DELETE CASCADE).
  * `solicitacao_id`: INT UNSIGNED DEFAULT NULL (FK -> `solicitacoes_exames(id)` ON DELETE SET NULL).
  * `laboratorio`: VARCHAR(150) NOT NULL (ex: "Delboni", "Lavoisier", "Fleury", "SUS / UBS").
  * `data_realizacao`: DATE NOT NULL (data da coleta).
  * `data_registro_app`: DATETIME NOT NULL (registro no app em `America/Sao_Paulo`).
  * `arquivo_anexo_path`: VARCHAR(255) DEFAULT NULL (hash único em `/backend/uploads/exames/`).
  * `arquivo_nome_original`: VARCHAR(255) DEFAULT NULL.
  * `observacoes_paciente`: TEXT DEFAULT NULL (notas da família).
- **Tabela `exames_resultados_itens` (Marcadores clínicos individuais 1:N):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `exame_id`: INT UNSIGNED NOT NULL (FK -> `exames_paciente(id)` ON DELETE CASCADE).
  * `nome_marcador`: VARCHAR(120) NOT NULL (ex: "Hemoglobina Glicada (HbA1c)", "Glicemia em Jejum").
  * `valor_resultado`: VARCHAR(50) NOT NULL (ex: "6.8", "104").
  * `unidade`: VARCHAR(30) NOT NULL (ex: "%", "mg/dL", "ng/mL").
  * `valor_referencia`: VARCHAR(100) DEFAULT NULL (ex: "< 7,0% para DM1 pediátrico").

### B. Endpoints da API PHP (`/backend/api/exames/`)
- `cadastrar_exame.php` (POST `multipart/form-data`):
  * Valida extensões permitidas (`PDF`, `JPG`, `JPEG`, `PNG`) e tamanho limite de 10 MB.
  * Gera hash aleatório criptográfico de arquivo e salva em `/backend/uploads/exames/`.
  * Transação atômica PDO gravando cabeçalho (`exames_paciente`) e itens de marcadores (`exames_resultados_itens`).
  * Atualiza automaticamente `solicitacoes_exames.status = 'REALIZADO'` quando vinculado a uma guia.
  * Registra trilha de auditoria imutável via `AuditLogger::registrar()` no fuso `America/Sao_Paulo`.
- `listar_exames.php` (GET):
  * Retorna histórico cronológico de coletas, marcadores aninhados, anexos e guias solicitadas.
  * Controle de acesso por RBAC: familiar/paciente acessa o próprio perfil; especialista consulta os pacientes de suas teleconsultas.
- `solicitar_exames.php` (POST):
  * Especialista credenciado emite guia médica oficial com array de exames e justificativa clínica.
  * Registra auditoria imutável com fuso de São Paulo.
- `gerar_guia_pdf.php` (GET):
  * Renderiza documento oficial timbrado, estilizado no design system "Porto Seguro", pronto para impressão direta ou exportação em PDF (`window.print()`).
  * Exibe CRM/CRN, especialidade, identificação do paciente, lista de procedimentos com caixas de checagem, orientações acolhedoras de preparo e hash de autenticidade digital.

### C. Interface Front-End e Experiência do Usuário
- **Página Pessoal (`MeuPerfil.jsx` + `CentralExames.jsx`):**
  * Seletor de abas limpo e responsivo: `🩸 Diário Inteligente & IOB` e `📑 Meus Exames & Guias`.
  * **Bloco 1 (Guias Solicitadas)**: Cards com badges de status (`Aguardando Coleta / Laudo` vs `Exame Realizado & Anexado`), botão *"Baixar Guia (PDF)"* e botão *"Anexar Resultado"* que pré-carrega os dados no modal.
  * **Bloco 2 (Modal "+ Registrar Novo Exame")**: Laboratório, data, seleção de guia, upload de arquivo com validação até 10MB, e construtor dinâmico de marcadores com chips de inclusão rápida em 1 clique (HbA1c, Glicemia em Jejum, Vitamina D, B12, Creatinina, Microalbuminúria, TSH e Colesterol).
  * **Bloco 3 (Linha do Tempo Histórica)**: Filtro interativo por marcador para acompanhamento evolutivo, cards de exames com chips coloridos de resultado (classificação clínica de HbA1c: meta atingida, ajuste suave ou atenção clínica) e link direto para o laudo digital.
- **Painel do Especialista (`PainelEspecialista.jsx`):**
  * Botão *"📑 Ver Exames do Paciente"* no card de atendimento: abre modal com histórico detalhado e laudos anexados.
  * Botão *"🩺 Solicitar Novos Exames"*: abre modal para seleção rápida de dosagens frequentes em DM1 ou adição de itens personalizados, emitindo a guia oficial assinada e gerando link para o PDF timbrado.



