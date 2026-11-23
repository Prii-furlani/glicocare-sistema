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

### D. Barra de Rolagem Global ("Porto Seguro") & Responsividade Anti-Overflow
- **Barra de Rolagem Global Elegante (`index.css`):**
  * Espessura fina (6px), bordas em formato de pílula (`border-radius: 999px`).
  * Thumb em tom terracota translúcido (`rgba(124, 83, 63, 0.32)`), escurecendo no hover para `rgba(124, 83, 63, 0.55)`.
  * Trilha 100% transparente com respiro vertical (`margin-block: 8px`).
  * Compatibilidade universal: WebKit (`::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-track`) e padrão Firefox / W3C (`scrollbar-width: thin; scrollbar-color: rgba(124, 83, 63, 0.32) transparent`).
- **Eliminação de Overflow Horizontal em Modais (`CentralExames.jsx`):**
  * No modal *"Registrar Exame Laboratorial"*, a linha de inputs dos marcadores clínicos (Nome, Valor, Unidade, Valor de Referência e Botão Lixeira) opera com `display: flex; flex-wrap: wrap; gap: 0.5rem`.
  * Os campos utilizam `flex-grow` e `min-width` proporcionais, garantindo que em telas estreitas, smartphones ou tablets a linha quebre com naturalidade sem jamais produzir barra de rolagem horizontal no rodapé do modal (`scrollWidth <= clientWidth`).

### E. Padronização Global de Formulários & Componente <CustomSelect /> ("Porto Seguro")
- **Regra de Ouro Visual:** Proibido o uso de azul padrão de sistemas operacionais / navegadores (Windows, Chrome, Safari) em seleções, dropdowns, focos, checkboxes ou radios.
- **Controles Nativos com Verde Alívio (`index.css` & `variables.css`):**
  * `accent-color: #3B7E48;` configurado no `:root` para checkboxes e radios assumirem o Verde Alívio da marca.
  * Inputs (`text`, `email`, `password`, `number`, `date`, `time`, `datetime-local`, `search`) e `textarea`:
    - Fundo limpo (`#FFFFFF`), borda sutil (`1px solid rgba(124, 83, 63, 0.22)`), `border-radius: 12px`, `padding: 11px 14px`, fonte `Plus Jakarta Sans` (`14.5px`), cor `#2E2824`.
    - Placeholder suave em `rgba(46, 40, 36, 0.45)`.
    - Foco minimalista com anel suave: `border-color: var(--cor-cta, #3B7E48); box-shadow: 0 0 0 3px rgba(59, 126, 72, 0.14); outline: none;`.
    - Ícone nativo de calendário/relógio (`::-webkit-calendar-picker-indicator`): cursor pointer, opacidade discreta (0.65) e tonalidade acolhedora com filtro sépia sutil.
- **Componente Reutilizável `<CustomSelect />` (`frontend/src/components/CustomSelect.jsx`):**
  * **Botão Gatilho:** Fundo `#FFFFFF`, `border-radius: 12px`, borda sutil, seta minimalista em SVG animada (rotação de 180° ao abrir) e truncamento com reticências para textos longos.
  * **Dropdown Flutuante:** Card suspenso em `#FFFFFF`, `border-radius: 14px`, borda suave `1px solid rgba(124, 83, 63, 0.18)`, sombra elegante (`0 12px 30px rgba(46, 40, 36, 0.12)`), scroll fino terracota e fechamento automático ao clicar fora ou apertar `Esc`.
  * **Opções no Design System GlicoCare:**
    - Hover: fundo bege acolhedor (`#F6F3EE`).
    - Opção selecionada: fundo verde suave (`rgba(59, 126, 72, 0.12)`), texto em Verde Alívio escuro (`#2D6337`) com `font-weight: 600` e ícone de check (`✓`) destacado em Verde Alívio (`#3B7E48`) à direita (zero azul nativo do navegador).
  * **Acessibilidade e Navegação:** Suporte a `Enter`, `Espaço`, `Esc`, `Setas` e eventos sintéticos compatíveis tanto com `(e) => setVal(e.target.value)` quanto com `(val) => setVal(val)`.
  * **Adoção Oficial:** Substitui os `<select>` nativos nos formulários de Perfil de Saúde (`ConfigurarPerfil.jsx`), Central de Exames (`CentralExames.jsx`), Diário de Glicemia e Parâmetros Clínicos (`MeuPerfil.jsx`), Vitrine de Especialistas (`Especialistas.jsx`) e inputs genéricos (`FormInput.jsx`).

### F. Padrão Visual Oficial de Capa Editorial Padrão (CapaEditorialDefault — RN-CAP-01)
- **Objetivo & Acionamento Automático:** Exibição imediata e padronizada sempre que um conteúdo/artigo não possuir imagem enviada via upload (`imagem_capa_url` nulo/vazio) ou caso a imagem remota falhe ao carregar (`onError`).
- **Paleta Oficial "Porto Seguro" (Alternância Automática ou Manual):**
  * `terracota` (`#947460`): Padrão para *Com o Lufy*, *Conversa em Família* e *Acolhimento Inicial*.
  * `verde` (`#527356`): Padrão para *Rotina Escolar*, *Checklist Prático* e nutrição familiar.
  * `carvalho` (`#665B53`): Padrão para *Tecnologia & Autonomia*, *Vida Real* e monitoramento.
- **Elementos Gráficos Decorativos Sutis:**
  * **Arcos Concêntricos:** Dois círculos concêntricos delicados (`border: 1px solid rgba(246, 243, 238, 0.22)`) fixados no canto superior direito.
  * **Ponto de Respiro:** Um pequeno círculo sólido de `8px` (`#EAE4D9`, opacidade 0.95) no canto inferior direito.
- **Selo Superior (Pílula Marfim Oficial):**
  * Fundo `#F6F3EE`, tipografia em caixa alta `#2E2824` (`font-size: 11px`, `font-weight: 700`, `letter-spacing: 0.08em`, `border-radius: 9999px`, sombra sutil `0 2px 8px rgba(0,0,0,0.08)`), exibindo rótulos editoriais como `GUIA ESSENCIAL`, `CHECKLIST PRÁTICO`, `VIDA REAL`, `CONVERSA EM FAMÍLIA`, `AUTONOMIA POSSÍVEL`.
- **Numeração Editorial em Itálico:**
  * Formatação estrita com dois dígitos (`01`, `02`, `03`, `04`...) em tipografia serifada `Fraunces` itálica (`font-size: clamp(2.6rem, 4vw, 3.4rem)` para cards e `clamp(3.4rem, 6vw, 5.2rem)` para banners; cor `#EAE4D9`), posicionada no canto inferior esquerdo.
- **Responsividade e Adaptação Multi-Ambiente:**
  * `variante="card"`: Preenche 100% da área do topo dos cards (`CardConteudo.jsx`), mantendo altura exata de 235px no desktop e 185px no mobile.
  * `variante="banner"`: Renderiza com cantos arredondados de 16px e altura fluida (`clamp(240px, 34vw, 380px)`) no topo da página de leitura (`/artigo/:id` ou `/conteudo/:id`).
  * `variante="preview"`: Exibição em tempo real no formulário do Painel Admin (`PainelAdmin.jsx`) enquanto o administrador digita o selo ou altera a cor.
  * `variante="mini"`: Thumbnail elegante de 56px na listagem de acervo do Painel Admin.
- **Persistência no Banco de Dados (`artigos_conteudos`):**
  * Coluna `imagem_capa_url` configurada como `VARCHAR(255) DEFAULT NULL` (upload opcional).
  * Coluna `selo_editorial`: `VARCHAR(60) NOT NULL DEFAULT 'GUIA ESSENCIAL'`.
  * Coluna `cor_capa_default`: `ENUM('terracota', 'verde', 'carvalho') NOT NULL DEFAULT 'terracota'`.

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

## 11. Registro Estruturado de Alergias e Sensibilidades Clínicas (RN-ALE-01)

### A. Estrutura do Banco de Dados Relacional (TiDB Cloud MySQL)
- **Tabela `perfis_saude`**:
  * `possui_alergias`: TINYINT(1) DEFAULT NULL (diferenciação explícita entre `NULL` = não informado, `0` = sem alergias conhecidas e `1` = possui alergias cadastradas).
- **Tabela `alergias_usuario` (Relacionamento 1:N com `perfis_saude`):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `perfil_saude_id`: INT UNSIGNED NOT NULL (FK -> `perfis_saude(id)` ON DELETE CASCADE).
  * `categoria`: ENUM('MEDICAMENTO', 'ALIMENTO', 'ADESIVO_INSUMO', 'OUTRA') NOT NULL (abrangendo medicamentos, alimentos, reações a adesivos de sensores/cateteres e outras).
  * `substancia_ou_item`: VARCHAR(150) NOT NULL (ex: "Dipirona", "Amoxicilina", "Amendoim", "Adesivo de Sensor / Cateter").
  * `gravidade`: ENUM('LEVE', 'MODERADA', 'GRAVE') NOT NULL DEFAULT 'MODERADA' (LEVE: vermelhidão/prurido; MODERADA: urticária/edema; GRAVE: risco de anafilaxia/urgência).
  * `reacao_observada`: VARCHAR(255) DEFAULT NULL (ex: "Dermatite de contato no braço após 10 dias", "Urticária e prurido generalizado").
  * `criado_em` e `atualizado_em`: TIMESTAMP.

### B. Endpoints da API PHP (`/backend/api/perfil/`)
- `index.php` (GET / POST / PUT):
  * No `GET`, retorna `possui_alergias` e o array `alergias` aninhado aos dados clínicos do perfil.
  * No `POST` / `PUT`, processa em transação atômica a atualização de `possui_alergias` e a sincronização estruturada de `alergias_usuario`.
  * Toda mutação é auditada compulsoriamente via `AuditLogger::registrar()` no fuso `America/Sao_Paulo`.
- `alergias.php` (GET / POST / DELETE):
  * Endpoint RESTful dedicado para consulta individual, inclusão e remoção de alergias com auditoria imutável.

### C. Interface Front-End e Experiência do Usuário
- **Cadastro Complementar (`ConfigurarPerfil.jsx` - Bloco D):**
  * Pergunta obrigatória com seleção rápida: *"Você possui alguma alergia (medicamento, alimento, adesivo de sensor ou outra)?"* (`Não possuo alergias conhecidas` vs `Sim, possuo alergia(s)`).
  * Ao selecionar `Sim`, abre construtor dinâmico com:
    - Pílulas de seleção de categoria (`💊 Medicamento`, `🍎 Alimento`, `🩹 Adesivo / Insumo DM1`, `🌿 Outra`).
    - Chips de sugestão rápida em 1 clique: *Dipirona*, *Penicilina / Amoxicilina*, *Anti-inflamatórios*, *Adesivo de Sensor / Cateter*, *Amendoim / Castanhas*, *Leite / Lactose*, *Frutos do Mar*, *Látex*.
    - Seletor de gravidade com código de cores e campo descritivo da reação observada.
- **Página Pessoal (`MeuPerfil.jsx`):**
  * Faixa de segurança clínica em terracota `#7C533F` com superfície `#F6F3EE` no topo da página.
  * Exibe chips detalhados com ícones por categoria, substância, gravidade e reação para consulta rápida em emergências ou compartilhamento escolar.
  * Quando não houver alergias, exibe o selo seguro *"✓ Nenhuma alergia conhecida relatada"*.
- **Painel do Especialista (`PainelEspecialista.jsx`):**
  * Alerta visual em `#FFF5F0` com borda terracota `#E06A55` posicionado no topo do resumo clínico do paciente e no modal de emissão de guia médica/receitas, prevenindo qualquer prescrição de risco.

## 12. Fluxo Integrado de Telemedicina, Prontuário Eletrônico e Conformidade (CFM 2.314/2022, CFN, CFP, CONFEF & LGPD)

### A. Estrutura do Banco de Dados Relacional (TiDB Cloud MySQL)
- **Tabela `especialistas`:**
  * `conselho_sigla` VARCHAR(20) DEFAULT 'CRM' (CRM, CRN, CRP, CREF).
  * `conselho_numero` VARCHAR(40) (número de registro profissional validado).
  * `conselho_uf` CHAR(2) (UF de registro do conselho).
  * `normas_categoria_aceitas` TINYINT(1) DEFAULT 1 (aceite obrigatório das resoluções de telessaúde).
- **Tabela `agendamentos`:**
  * `sala_token_unico` VARCHAR(120) (token criptográfico único para rota nativa).
  * `lembrete_enviado` TINYINT(1) DEFAULT 0.
  * `status_atendimento` ENUM('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO') DEFAULT 'AGENDADO'.
  * `status_financeiro` ENUM('RETIDO_PLATAFORMA', 'LIBERADO_ESPECIALISTA', 'ESTORNADO') DEFAULT 'RETIDO_PLATAFORMA' (custódia interna RN-FIN-03).
- **Tabela `consentimentos_teleconsulta` (CFM 2.314/2022 & LGPD):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `usuario_id`: INT UNSIGNED NOT NULL (FK -> `usuarios(id)`).
  * `agendamento_id`: INT UNSIGNED NOT NULL (FK -> `agendamentos(id)`).
  * `versao_termo`: VARCHAR(20) DEFAULT 'v1.0-2026'.
  * `aceito`: TINYINT(1) DEFAULT 1.
  * `ip_aceite`: VARCHAR(45) NOT NULL.
  * `data_hora_aceite`: DATETIME NOT NULL (`America/Sao_Paulo`).
- **Tabela `prontuarios_atendimentos` (Prontuário Eletrônico CFM 2.314/2022):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `agendamento_id`: INT UNSIGNED NOT NULL UNIQUE (FK 1:1 -> `agendamentos(id)`).
  * `perfil_saude_id`: INT UNSIGNED NOT NULL (FK -> `perfis_saude(id)`).
  * `especialista_id`: INT UNSIGNED NOT NULL (FK -> `especialistas(id)`).
  * `queixa_principal`: TEXT NOT NULL (pré-alimentada do pré-atendimento).
  * `evolucao_clinica`: TEXT NOT NULL (anamnese e notas do atendimento).
  * `conduta_orientacoes`: TEXT NOT NULL (metas, ajustes e rotina escolar).
  * `encaminhamento_presencial`: TINYINT(1) DEFAULT 0 (requisito ético do CFM para limitações da telessaúde).
  * `data_registro`: DATETIME NOT NULL (`America/Sao_Paulo`).
- **Tabela `avaliacoes_especialistas` (Reputação e Moderação):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `agendamento_id`: INT UNSIGNED NOT NULL UNIQUE (FK 1:1 -> `agendamentos(id)`).
  * `especialista_id`: INT UNSIGNED NOT NULL (FK -> `especialistas(id)`).
  * `usuario_id`: INT UNSIGNED DEFAULT NULL (FK -> `usuarios(id)`).
  * `nota`: TINYINT UNSIGNED NOT NULL (1 a 5 estrelas).
  * `comentario`: TEXT DEFAULT NULL.
  * `status_moderacao`: ENUM('PENDENTE', 'APROVADO', 'REJEITADO') DEFAULT 'APROVADO'.

### B. Endpoints da API PHP (`/backend/api/teleconsulta/` e `/backend/api/perfil/`)
- `sala.php` (GET):
  * Valida token criptográfico da sala e aplica RBAC estrito (apenas paciente/familiar ou especialista vinculado).
  * Retorna sessão consolidada: dados do agendamento, profissional com conselho ativo, pré-atendimento, perfil de saúde, alergias estruturadas, medicamentos ativos, diário recente com IOB e exames laboratoriais.
- `salvar_prontuario.php` (POST):
  * Apenas especialista autenticado: grava/atualiza `prontuarios_atendimentos`.
  * Atualiza atomicamente `agendamentos.status_atendimento = 'CONCLUIDO'`, `status_agendamento = 'concluido'`, `status_financeiro = 'LIBERADO_ESPECIALISTA'` e `status_pagamento_interno = 'repassado_especialista'`.
  * Registra auditoria imutável via `AuditLogger::registrar()` para prontuário e agendamento no fuso `America/Sao_Paulo`.
- `consentimento.php` (GET / POST):
  * Registra formalmente a anuência ao Termo de Consentimento Livre e Esclarecido capturando IP e timestamp oficial.
- `avaliar.php` (GET / POST):
  * Registra avaliação do paciente (1 a 5 estrelas e comentário acolhedor) vinculada ao agendamento concluído.
  * Fornece média consolidada e depoimentos aprovados para a vitrine pública de especialistas.
- `resumo_compartilhavel.php` (GET):
  * Compila histórico unificado (identificação, diagnóstico, jornada, alergias, medicações, glicemias, exames e orientações de teleconsultas) com hash SHA-256 de integridade digital.

### C. Interface Front-End e Experiência do Usuário
- **Sala Nativa de Videoconsulta (`/sala-consulta/:token` e `/atendimento-nativo/:token`):**
  * Ambiente imersivo com simulação de vídeo em alta fidelidade, badge de conformidade CFM 2.314/2022, timer regressivo da sessão (60 min) e botão de Suporte/Emergência (SAMU 192 e sinais de alarme de cetoacidose).
  * Drawer lateral com 3 abas essenciais:
    - *Aba 1 (Prontuário)*: Formulário clínico com queixa, evolução, conduta e checkbox obrigatório CFM; botão de conclusão que salva o prontuário e dispara a liberação financeira ao especialista.
    - *Aba 2 (Pré-Atendimento)*: Motivo principal, dores e dúvidas prioritárias digitadas pela família.
    - *Aba 3 (Resumo DM1)*: Tipo de diabetes, anos/meses de jornada, alerta em vermelho para alergias ativas (ex: Dipirona e Adesivo), medicamentos ativos com horários, diário recente com IOB e últimos exames laboratoriais.
- **Perfil do Especialista & Agendamento (`PerfilEspecialista.jsx`):**
  * Seção *"Avaliações das Famílias"* com média e relatos de famílias reais.
  * Checkbox obrigatório do **Termo de Consentimento Livre e Esclarecido (CFM 2.314/2022 & LGPD)** no checkout seguro.
  * Pós-checkout com botão direto *"🎥 Entrar na Sala de Videoconsulta Nativa"* e atalho para o Pré-Atendimento.
- **Histórico Médico Compartilhável (`MeuPerfil.jsx` + `ResumoHistoricoCompartilhavel.jsx`):**
  * Botão de destaque no topo da página: *"📋 Gerar Resumo Histórico para Compartilhar (PDF / Impressão)"*.
  * Modal responsivo e documento imprimível com `@media print` contendo: identificação do paciente e responsável legal, diagnóstico e tempo de aprendizado em anos/meses, alergias em destaque visual, medicamentos ativos, parâmetros de sensibilidade/IOB, últimos exames e condutas das teleconsultas, finalizando com hash criptográfico e termo LGPD.

## 10. Termo de Consentimento Livre e Esclarecido (TCLE) para Telemedicina / Teleassistência (CFM 2.314/2022 & LGPD)

### A. Estrutura Jurídico-Regulatória e Cláusulas Oficiais
Em conformidade estrita com o modelo oficial de consentimento informado, com a Resolução CFM nº 2.314/2022, resoluções de conselhos afins (CFN, CFP, CONFEF) e a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), todo teleatendimento exige aceite formalizado do declarante (paciente ou responsável legal) contendo 4 cláusulas pétreas:
1. **Cláusula 1 — Da Definição e Finalidade da Teleconsulta**:
   - Teleatendimento como ato profissional não presencial mediado por Tecnologias Digitais de Informação e Comunicação (TDIC), com o mesmo rigor ético e clínico da consulta presencial.
2. **Cláusula 2 — Do Sigilo Profissional e Proteção de Dados Pessoais (LGPD)**:
   - Tratamento de dados sensíveis de saúde com criptografia, guarda em ambiente de prontuário eletrônico seguro e garantia dos direitos de privacidade e anonimização.
3. **Cláusula 3 — Do Registro Clínico e do Sigilo Bilateral de Imagem**:
   - Registro obrigatório em prontuário eletrônico.
   - **Proibição expressa de gravação unilateral**: nem o paciente/família nem o especialista podem gravar áudio ou vídeo da consulta sem prévia anuência formal mútua e justificada, sob pena de violação de sigilo ético e direitos de imagem.
4. **Cláusula 4 — Das Limitações da Telessaúde e Encaminhamento Presencial**:
   - Reconhecimento das limitações da ausência de exame físico palpatório.
   - **Protocolo de Emergência Imediata**: em situações agudas com risco de vida (como Cetoacidose Diabética descompensada ou Hipoglicemia Severa com perda de consciência), a família é orientada a procurar imediatamente o Pronto-Socorro / SAMU 192 presencial.
   - Autonomia e dever do profissional de interromper a teleconsulta e exigir avaliação presencial se identificar sinais de gravidade.

### B. Persistência de Dados e Carimbo Digital de Autenticidade
- **Tabela `consentimentos_teleconsulta` (TiDB Cloud MySQL):**
  * `id`: INT AUTO_INCREMENT PRIMARY KEY.
  * `usuario_id`: INT NOT NULL (FK -> `usuarios(id)`).
  * `perfil_saude_id`: INT UNSIGNED DEFAULT NULL (FK -> `perfis_saude(id)`).
  * `agendamento_id`: INT NOT NULL (FK -> `agendamentos(id)` — referência da consulta de formalização inicial).
  * `modalidade`: ENUM('TELECONSULTA', 'TELEINTERCONSULTA') NOT NULL DEFAULT 'TELECONSULTA'.
  * `nome_declarante`: VARCHAR(150) NOT NULL.
  * `cpf_declarante`: VARCHAR(20) NOT NULL (máscara `000.000.000-00` e validação).
  * `data_nascimento_paciente`: DATE DEFAULT NULL.
  * `nome_paciente_dependente`: VARCHAR(150) DEFAULT NULL (quando perfil `cuidador`).
  * `cidade_aceite`: VARCHAR(100) NOT NULL DEFAULT 'São Paulo'.
  * `versao_termo`: VARCHAR(50) NOT NULL DEFAULT 'TCLE-GC-2026.1'.
  * `texto_integral_hash`: VARCHAR(64) NOT NULL (Hash criptográfico SHA-256 do texto das cláusulas e metadados).
  * `aceito`: TINYINT(1) DEFAULT 1.
  * `ip_aceite`: VARCHAR(45) NOT NULL.
  * `user_agent`: TEXT DEFAULT NULL.
  * `data_hora_aceite`: DATETIME NOT NULL (`America/Sao_Paulo`).
  * `valido_ate`: DATETIME NOT NULL (validade anual de 12 meses calculada a partir de `data_hora_aceite`).
  * `status_termo`: ENUM('ATIVO', 'EXPIRADO', 'REVOGADO') NOT NULL DEFAULT 'ATIVO'.

- **Tabela `consentimentos_agendamentos_uso` (TiDB Cloud MySQL):**
  * `id`: INT UNSIGNED AUTO_INCREMENT PRIMARY KEY.
  * `consentimento_id`: INT UNSIGNED NOT NULL (FK -> `consentimentos_teleconsulta(id)`).
  * `agendamento_id`: INT UNSIGNED NOT NULL (FK -> `agendamentos(id)`).
  * `especialista_id`: INT UNSIGNED NOT NULL (FK -> `especialistas(id)`).
  * `confirmado_em`: DATETIME NOT NULL (`America/Sao_Paulo`).
  * `ip_confirmacao`: VARCHAR(45) DEFAULT NULL.

### C. Endpoints e Fluxo de Verificação Inteligente
- `/backend/api/agendamentos/verificar_tcle.php`:
  * `GET`: Avalia a vigência anual (< 12 meses) do TCLE para o paciente/dependente (`perfil_saude_id` ou `usuario_id`). Retorna `tcle_vigente` (`true`/`false`), o cenário recomendado (`CENARIO_B` de 1 clique ou `CENARIO_A` formulário completo) e metadados contratuais.
  * `POST (acao = 'confirmar_uso')`: Registra com 1 clique a utilização do TCLE anual vigente para a teleconsulta atual na tabela `consentimentos_agendamentos_uso` e gera evento auditável `CONFIRMACAO_USO_TCLE` no `AuditLogger`.
  * `POST (acao = 'revogar')`: Atualiza o status do termo para `'REVOGADO'`, gerando trilha auditável `REVOGACAO_TCLE` no `AuditLogger`.
- `/backend/api/agendamentos/assinar_tcle.php`:
  * Validação formal de CPF, dados do declarante e integridade via SHA-256.
  * Gravação do TCLE com validade anual de 12 meses (`valido_ate = NOW() + 1 ano`), vinculando ao perfil de saúde e inserindo o primeiro uso na tabela auxiliar.
  * Auditoria imutável via `AuditLogger::registrar()` no fuso de Brasília.
- `/backend/api/agendamentos/comprovante_tcle.php`:
  * Certificado digital timbrado pronto para impressão/PDF com selo de validade anual (12 meses), status de vigência (`🟢 ATIVO`, `🔴 REVOGADO`, `🟠 EXPIRADO`), tabela de consultas vinculadas e carimbo com hash SHA-256.
- `/backend/api/teleconsulta/sala.php`:
  * Validação combinada: verifica se a consulta possui confirmação em `consentimentos_agendamentos_uso` ou termo direto, e se o paciente dispõe de TCLE anual vigente.

### D. Componentes de Interface e Visão no Perfil
- `ModalTCLE.jsx`:
  * **Cenário B (1 clique):** Exibe banner *"Termo de Consentimento Válido Encontrado"*, data de validade anual, profissional atendente e botão de ação rápida *"✓ Confirmar e Iniciar Consulta (1 clique)"*, além de links para visualizar o comprovante em PDF ou alternar para o formulário completo.
  * **Cenário A (Completo):** Exibe os 4 campos declaratórios, as 4 cláusulas legais oficiais (CFM 2.314/2022 e LGPD), checkbox de concordância e botão de assinatura com vigência de 1 ano.
- `MeuPerfil.jsx`:
  * Selo discreto *"📜 TCLE Teleassistência Ativo • Válido até DD/MM/AAAA"* posicionado entre o cabeçalho pessoal e a faixa de alergias.
  * Ações integradas: *"📄 Ver Comprovante (PDF)"*, *"🔄 Renovar"* (abre modal no modo formulário) e *"⚠️ Revogar"* (com confirmação e chamada de revogação na API).
- `SalaConsulta.jsx`:
  * Botão de entrada rápida integrado: orienta confirmação em 1 clique quando o termo anual está ativo ou formalização direta.

## 13. Sala de Teleconsulta Nativa (SDK de Vídeo Embarcado Daily.co / Fallback Simulação Segura & Prontuário Integrado)

### A. Arquitetura de Vídeo Efêmero e Segurança (CFM 2.314/2022 & LGPD)
- **Provedor Primário (Daily.co REST API & Web Embed):**
  * Quando a variável de ambiente `DAILY_API_KEY` estiver configurada no `backend/.env`, o endpoint `/backend/api/teleconsulta/iniciar_sala.php` conecta-se à API REST do Daily.co (`POST https://api.daily.co/v1/rooms`) gerando uma sala privada efêmera (`privacy: 'private'`).
  * Propriedades de segurança: expiração automática (`exp`) de 2 horas após o horário agendado, gravação desativada por padrão (`enable_recording: false` em respeito ao sigilo médico e LGPD) e chat nativo independente (`enable_chat: false`).
  * Geração de `meeting_token` individual (`POST https://api.daily.co/v1/meeting-tokens`) para cada participante (com privilégio de proprietário `is_owner: true` para o médico).
  * No front-end, a sala é renderizada com um container `iframe` otimizado e seguro com permissões explícitas: `allow="camera; microphone; fullscreen; display-capture; autoplay"`.
- **Modo Simulação Segura (Preview Local):**
  * Se `DAILY_API_KEY` não estiver preenchida no `.env`, a sala opera de forma resiliente e autônoma em Modo Simulação Segura.
  * O front-end captura a câmera e microfone reais do usuário via `navigator.mediaDevices.getUserMedia`, permitindo testar toda a experiência visual, áudio, compartilhamento de tela e transições sem depender de provedor externo.

### B. Controle de Acesso, Auditoria e Registro de Horários
- `/backend/api/teleconsulta/iniciar_sala.php`:
  * Protegido por `AuthMiddleware.php`: verifica se o usuário autenticado é estritamente o paciente/cuidador dono do agendamento ou o especialista responsável.
  * Valida se o TCLE anual ou por agendamento está ativo e confirmado. Bloqueia o acesso caso pendente de assinatura.
  * Registra a entrada na sala no `AuditLogger::registrar()` com a ação `LOGIN`.
- `/backend/api/teleconsulta/registrar_evento_sala.php`:
  * Registra o timestamp exato de início (`iniciado_em`) e de término (`encerrado_em`) na tabela `agendamentos`.
  * Registra trilha imutável no `AuditLogger` no fuso de Brasília (`America/Sao_Paulo`).
- `/backend/api/teleconsulta/mensagens.php` e Tabela `mensagens_teleconsulta`:
  * Armazena mensagens trocadas no chat paralelo e compartilhamento de anexos/fotos durante a teleconsulta.

### C. Experiência de Interface ("Porto Seguro" - 70% Vídeo / 30% Painel Clínico)
- **Arquivo Principal:** `frontend/src/pages/SalaTeleconsulta.jsx` (acessível via `/sala-consulta/:token` e `/atendimento-nativo/:token`).
- **Sala de Espera Virtual Acolhedora:**
  * Box de pré-visualização de câmera e microfone com controles de teste (mutar/ligar vídeo).
  * Identificação do profissional verificado (`CRM-SP 148290`) e status "Pronto na Sala".
  * Card do Lufy com mensagem serena: *"Respire fundo. Suas dúvidas do pré-atendimento já estão separadas aqui ao lado."*
  * Botão de ingresso: *"Conectar e Entrar na Consulta →"*.
- **Palco de Vídeo Ativo (70% no Desktop):**
  * Container cinematográfico suave `#1E1B18` com cantos arredondados de `20px`.
  * Barra de status superior com badge "HD • TLS 1.3" e timer regressivo de 60 minutos.
  * Controles minimalistas inferiores: Microfone, Câmera, Compartilhar Tela (`getDisplayMedia`), Chat/Anexos e Encerrar Chamada (`#C94A38`).
- **Painel Lateral Clínico Integrado (30% no Desktop):**
  * **Ocultação do Assistente Flutuante:** O widget flutuante do Lufy (`LufyChatbot.jsx`) é ocultado automaticamente nas rotas `/sala-consulta/*` e `/atendimento-nativo/*` via hook `useLocation()`, mantendo o foco exclusivo no ato médico.
  * **Visão do Especialista (4 Abas Estruturadas):**
    1. *Aba 1 — Prontuário & Conduta:* Queixa Principal, Evolução Clínica, Conduta & Orientações, bloco destacado de **`🔒 Anotações Privadas da Médica / Especialista`** (caixa de rascunho com fundo marfim suave `#F6F3EE`, badge de privacidade *"Visível apenas para você no prontuário"* persistida em `prontuarios_atendimentos.anotacoes_privadas_especialista`), checkbox obrigatório de consentimento presencial CFM 2.314/2022 e botão de ação *"Salvar Prontuário e Concluir Consulta"*.
    2. *Aba 2 — 🧪 Exames & Guias:* Emissão rápida de pedidos em tempo real com chips de atalho para DM1 (HbA1c, Glicemia em Jejum, Vitamina D 25-OH, Vitamina B12, Creatinina, Microalbuminúria, TSH e T4 Livre, Perfil Lipídico, Hemograma Completo), campo de justificativa clínica, botão de emissão com geração de link PDF da guia e painel inferior com a lista dos últimos laudos laboratoriais do paciente para visualização rápida sem trocar de tela.
    3. *Aba 3 — Pré-Atendimento:* Exibição acolhedora do motivo principal da consulta, maiores dores e dúvidas prioritárias cadastradas previamente pela família tutora.
    4. *Aba 4 — Resumo DM1:* Tempo de aprendizado em anos/meses, alerta visual de alergias em terracota (`#C94A38`), medicamentos ativos com dosagem/horários e últimas glicemias registradas com insulina ativa (IOB).
  * **Visão do Paciente / Cuidador:**
    1. *Meu Roteiro:* Checklist com as dúvidas pré-cadastradas no pré-atendimento para marcar à medida que forem respondidas.
    2. *Chat & Enviar Exame:* Canal direto para enviar fotos ou documentos na hora para o médico.
- **Encerramento e Avaliação:**
  * Modal de confirmação antes de desligar.
  * Pós-atendimento abre o modal de avaliação humanizada (1 a 5 estrelas e depoimento) gravando na tabela `avaliacoes_especialistas`.

## 14. Workspace Clínico do Especialista & Prontuário Longitudinal Permanente (RN-PRONT-01)

### A. Regras de Negócio e Guarda Permanente de Prontuário (`RN-PRONT-01`)
- **Identificação Automática de 1ª Consulta vs. Retorno:**
  * O back-end avalia o histórico de atendimentos com status `'CONCLUIDO'` entre aquele paciente (`perfil_saude_id`) e aquele especialista (`especialista_id`):
    - `0 atendimentos anteriores`: classificado automaticamente como **`1ª Consulta`** (badge destacado em marrom/terracota).
    - `1 ou mais atendimentos anteriores`: classificado automaticamente como **`Retorno`** com numeração progressiva (ex: **`Retorno #2`**).
- **Status do Pré-Atendimento e Conformidade TCLE:**
  * Verificação do formulário de acolhimento: exibe badge de sucesso **`Pré-Atendimento Pronto ✓`** com resumo da queixa principal, ou **`Aguardando Pré-Atendimento`** caso o paciente ainda não tenha preenchido.
  * Validação do Termo de Consentimento: exibe **`TCLE Ativo ✓`** (validade anual de 12 meses) com link rápido para consulta do certificado.
- **Imutabilidade e Adendos Clínicos Datados (Resolução CFM):**
  * Em estrita conformidade com as diretrizes do Conselho Federal de Medicina (CFM), os atendimentos e evoluções clínicas concluídos na tabela `prontuarios_atendimentos` **nunca são sobrescritos ou apagados**.
  * Qualquer anotação complementar, ajuste de conduta ou nota pós-exame é registrada como **Adendo Clínico** na tabela relacional `prontuarios_adendos`, contendo carimbo de data/hora automático no fuso `America/Sao_Paulo` e auditoria imutável no `AuditLogger`.

### B. Banco de Dados e Modelagem Relacional (TiDB Cloud MySQL)
- **Tabela `prontuarios_adendos`:**
  * `id`: INT AUTO_INCREMENT PRIMARY KEY.
  * `prontuario_id`: INT NOT NULL (FK -> `prontuarios_atendimentos(id)` ON DELETE CASCADE).
  * `especialista_id`: INT NOT NULL (FK -> `especialistas(id)`).
  * `texto_adendo`: TEXT NOT NULL (corpo da nota clínica complementar).
  * `data_hora_adendo`: DATETIME NOT NULL (`America/Sao_Paulo`).
  * `criado_em`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP.

### C. Endpoints Especializados (`/backend/api/especialistas/`)
- `painel_dados.php`:
  * Autenticação e autorização via `AuthMiddleware.php`.
  * Cálculo dinâmico dos 4 KPIs: `total_agendados`, `primeiras_consultas`, `retornos`, `pre_atendimentos_prontos`, `repasse_estimado` (88% do valor bruto conforme `RN-FIN-03`).
  * Lista enriquecida de agendamentos com cálculo de `is_primeira_consulta`, `retorno_numero`, `pre_atendimento_preenchido`, `tcle_valido`, tempo de diagnóstico (`calcularTempoDiagnostico`), alergias estruturadas e glicemia recente.
  * Trilha imutável em `logs_auditoria` com a ação `CONSULTA_PAINEL_ESPECIALISTA`.
- `historico_paciente.php`:
  * Linha do tempo unificada e cronológica agregando:
    1. Consultas e evoluções clínicas (`prontuarios_atendimentos`) com seus respectivos adendos (`prontuarios_adendos`).
    2. Solicitações de exames laboratoriais emitidas (`solicitacoes_exames`).
    3. Resultados e laudos anexados pelo paciente (`exames_paciente`).
  * Ordenação decrescente por data/hora (`data_evento DESC`).
  * Registro de auditoria `CONSULTA_PRONTUARIO_LONGITUDINAL`.
- `salvar_adendo.php`:
  * Inserção append-only na tabela `prontuarios_adendos`.
  * Validação de autoria médica e registro no `AuditLogger` com ação `CRIACAO` na tabela `prontuarios_adendos`.

### D. Interface do Workspace Clínico (`PainelEspecialista.jsx` — "Porto Seguro")
- **Container Fluido:** Largura `92%` (máximo `1360px`), espaçamentos generosos, sem barras horizontais indesejadas e com paleta Porto Seguro (`#EAE4D9`, `#F6F3EE`, `#2E2824`, `#7C533F`, `#3B7E48`).
- **4 Cards de KPI no Topo:**
  1. *Consultas Agendadas* (com indicação do dia de hoje).
  2. *1ª Consulta vs Retornos* (taxa de novos pacientes).
  3. *Pré-Atendimentos Prontos* (porcentagem de triagens concluídas).
  4. *Repasse Líquido Estimado* (valor líquido calculado em 88% da receita bruta).
- **3 Abas de Navegação:**
  1. **Aba 1 — Agenda & Triagem:**
     - Filtros rápidos em pílula: `Todos`, `Hoje`, `1ª Consulta`, `Retornos`, `Pré-atendimento Pendente` + busca dinâmica por nome do paciente.
     - Cards de atendimento com escaneabilidade máxima: badge de tipo (`1ª Consulta` ou `Retorno #X`), data/horário, tempo de diagnóstico, **alerta destacado de alergias em terracota**, queixa do pré-atendimento e ações diretas:
       * *Abrir Prontuário Longitudinal*
       * *+ Solicitar Exames* (modal com geração de guia laboratorial)
       * *Entrar na Sala de Vídeo →* (redirecionamento com token para a sala nativa Daily.co / simulação segura)
  2. **Aba 2 — Meus Pacientes & Prontuário Longitudinal Permanente:**
     - Layout Split:
       * *Coluna da Esquerda (Lista & Perfil Clínico Fixo):* Seleção do paciente com busca rápida; resumo com tempo de diagnóstico, classificação da fase (`recem_diagnosticado`, `adaptacao`, `experiente`), terapia de insulina, sensor glicêmico, sensibilidades (FSI, meta glicêmica) e caixa de alerta de alergias e sensibilidades.
       * *Coluna da Direita (Linha do Tempo Longitudinal Permanente):* Histórico cronológico completo de atendimentos, evoluções clínicas, guias emitidas e laudos de exames laboratoriais.
       * *Ações do Prontuário:* Botão de impressão limpa / exportação para PDF (`window.print()`) e botão destacado **"+ Adicionar Adendo Clínico"** (modal para inclusão de notas complementares datadas sem alterar a evolução original).
  3. **Aba 3 — Minha Disponibilidade & Horários:**
     - Grade visual semanal (`RN-AGD-02`), permitindo ativar/desativar dias da semana, visualizar horários configurados e editar slots de atendimento.
     - Bloco integrado de **Configuração de Honorários & Política de Retorno (`RN-FIN-03` / `RN-AGD-RETORNO`)**:
       * Edição do valor bruto da consulta pelo especialista (`valor_consulta`).
       * Simulação visual do repasse líquido do especialista (**65%**) e da taxa de sustentabilidade da plataforma GlicoCare (**35%**).
       * Comutador de ativação de retorno incluso (`oferece_retorno_incluso`) e definição do prazo em dias (`prazo_retorno_dias`, padrão 30 dias).

## 15. Precificação pelo Especialista (Split 65% / 35%) e Sistema Automático de Retorno Incluso em até 30 Dias (RN-FIN-03 & RN-AGD-RETORNO)

### A. Regras de Negócio de Precificação e Split (`RN-FIN-03`)
- **Precificação Autônoma Curada:**
  * O especialista define livremente o valor de sua consulta (`especialistas.valor_consulta`), submetido à curadoria e aprovação do Admin (`RN-ESP-01`).
  * O percentual de repasse fixo é de **65% para o Especialista** e **35% para a Plataforma GlicoCare** (`percentual_repasse = 65.00`).
  * No Painel do Especialista (`PainelEspecialista.jsx`), o KPI superior de repasse exibe: `Repasse Líquido (65%) • Split 65% Especialista / 35% GlicoCare`.
  * Na vitrine pública de especialistas (`/especialistas`), o valor final é exibido com transparência total juntamente com os selos de especialidade e retorno.

### B. Sistema Automático de Direito a Retorno Incluso (`RN-AGD-RETORNO`)
- **Elegibilidade Automática:**
  * Se o especialista oferecer retorno (`oferece_retorno_incluso = TRUE`), o paciente que concluiu uma consulta anterior no prazo regulamentar (`prazo_retorno_dias`, padrão 30 dias) tem direito garantido a 1 retorno sem novo custo.
  * O endpoint `/backend/api/agendamentos/verificar_direito_retorno.php`:
    1. `GET`: Verifica se existe consulta concluída com o especialista dentro de 30 dias que ainda não tenha sido utilizada como origem para outro retorno (`agendamentos.agendamento_origem_id`).
    2. Retorna banner acolhedor: *"Você possui 1 retorno incluso referente à sua consulta de [DD/MM/AAAA] (válido até [DD/MM/AAAA]). Agende sem custo adicional."*
    3. `POST`: Caso elegível, registra o agendamento como `tipo_agendamento = 'RETORNO_INCLUSO'`, `status_pagamento_interno = 'isento_retorno'`, `valor_consulta = 0.00` e vincula o `agendamento_origem_id`. Pula o checkout financeiro e desbloqueia diretamente o pré-atendimento e a confirmação do TCLE.
  * Caso não haja consulta concluída elegível, o agendamento segue o fluxo normal de `CONSULTA_AVULSA` com split 65/35.
- **Identificação Visual na Agenda e Vitrine:**
  * **Na Vitrine de Especialistas (`CardEspecialista.jsx`):** Badge verde suave destacado: **`✓ Inclui 1 retorno em até 30 dias`**.
  * **No Painel do Especialista (`PainelEspecialista.jsx`):** Na lista de atendimentos, exibição de chips distintos: **`🎁 Retorno Incluso (R$ 0,00)`** versus **`💳 Consulta Avulsa (Split 65%)`**.

### C. Estrutura de Banco de Dados e Migrações (TiDB Cloud MySQL)
- **Tabela `especialistas`:**
  * `valor_consulta`: DECIMAL(10,2) NOT NULL DEFAULT 320.00.
  * `percentual_repasse`: DECIMAL(5,2) NOT NULL DEFAULT 65.00.
  * `oferece_retorno_incluso`: BOOLEAN NOT NULL DEFAULT TRUE.
  * `prazo_retorno_dias`: INT NOT NULL DEFAULT 30.
- **Tabela `agendamentos`:**
  * `tipo_agendamento`: ENUM('CONSULTA_AVULSA', 'RETORNO_INCLUSO') NOT NULL DEFAULT 'CONSULTA_AVULSA'.
  * `agendamento_origem_id`: INT UNSIGNED DEFAULT NULL (FK -> `agendamentos(id)` ON DELETE SET NULL).
- **Tabela `prontuarios_atendimentos`:**
  * `anotacoes_privadas_especialista`: TEXT DEFAULT NULL (visível estritamente ao especialista autor no prontuário longitudinal, omitido do resumo e das APIs de pacientes).
- **Tabela `solicitacoes_exames`:**
  * `justificativa_clinica`: TEXT DEFAULT NULL (justificativa técnica vinculada à emissão em tempo real na teleconsulta).
- **Auditoria Imutável:** Todas as alterações de honorários, agendamentos de retorno isento e salvamentos de prontuário com anotações privadas são registradas no `AuditLogger` em `America/Sao_Paulo`.

## 16. Painel Administrativo Completo (/admin) e CMS Dinâmico da Home (configuracoes_home)

### A. Regras de Negócio, Acesso Restrito e Redirecionamento (RN-ACC-01)
- **Perfil Exclusivo Admin (Priscila Manzoni Furlani):**
  * O painel `/admin` (com alias `/painel-admin`) é estritamente restrito a contas com `tipo_usuario === 'admin'` ou `tipo_perfil === 'admin_moderador'`.
  * Ao autenticar na tela de login (`/login`) com a conta de administração (`curadoria@glicocare.com.br`), o usuário é redirecionado imediatamente para `/admin`.
  * Na barra de navegação superior (`Navbar.jsx`), quando o perfil for `admin`, um botão/badge em destaque **"⚙️ Painel Admin"** é renderizado ao lado do nome do usuário tanto no desktop quanto no menu mobile.

### B. CMS Dinâmico da Home (`configuracoes_home`)
- **Tabela Relacional no TiDB Cloud MySQL:**
  * `id`: INT AUTO_INCREMENT PRIMARY KEY.
  * `secao`: VARCHAR(60) NOT NULL (`hero`, `lufy`, `diferenciais`, `cta_final`).
  * `chave`: VARCHAR(100) NOT NULL UNIQUE (identificador único do campo na Landing Page).
  * `tipo_campo`: ENUM('TEXTO_CURTO', 'TEXTO_LONGO', 'IMAGEM') NOT NULL DEFAULT 'TEXTO_CURTO'.
  * `rotulo_admin`: VARCHAR(150) NOT NULL (nome amigável exibido no painel de edição).
  * `valor`: TEXT NOT NULL (texto, chamada ou caminho da imagem).
  * `atualizado_em`: DATETIME NOT NULL (`America/Sao_Paulo`).
- **Campos Editáveis Gerenciados:**
  * `hero_badge`: Badge superior com ponto verde.
  * `hero_titulo`: Título H1 principal com suporte a sublinhado suave na palavra destacada.
  * `hero_titulo_destaque`: Palavra que recebe o traço curvilíneo verde (`segura`).
  * `hero_subtitulo`: Subtítulo explicativo e acolhedor.
  * `hero_cta_primario` e `hero_cta_secundario`: Textos dos botões de ação do Hero.
  * `hero_balao_lufy`: Frase de acolhimento no balão do mascote Lufy.
  * `hero_imagem_url`: Imagem do mascote Lufy (com upload de JPG, PNG ou WEBP até 8MB em `/backend/uploads/home/`).
  * `lufy_eyebrow`: Sobretítulo da seção "Conheça o Lufy".
  * `lufy_titulo` e `lufy_titulo_destaque`: Título com destaque itálico em terracota (`Afeto`).
  * `lufy_paragrafo_1` e `lufy_paragrafo_2`: Parágrafos narrativos da história do Lufy.
  * `lufy_citacao_foto`: Frase inspiradora sobreposta à foto da família.
  * `lufy_imagem_url`: Imagem acolhedora da família (com upload até 8MB).
  * `cta_final_titulo`, `cta_final_subtitulo` e `cta_final_botao`: Seção de chamada final antes do rodapé.
- **Consumo Público na Home (`Home.jsx`):**
  * Consome o endpoint público leve `/backend/api/publico/home_config.php` no mount do componente, aplicando os textos e imagens dinâmicos do banco com fallback automático e transparente em caso de indisponibilidade de rede.

### C. Gestão Editorial da Biblioteca (`artigos_conteudos`)
- **Colunas Suportadas:**
  * `autor_nome` (padrão `'Priscila Manzoni Furlani'`), `titulo`, `titulo_destaque_italico`, `subtitulo`, `slug`, `categoria`, `resumo`, `tempo_leitura`, `imagem_capa_url`, `legenda_capa`, `conteudo_blocos` (JSON), `status_publicacao` (`'publicado'`, `'rascunho'`, `'arquivado'`).
- **Editor Estruturado por Blocos:**
  * Permite adicionar parágrafos normais, subtítulos H2, citações destacadas do Lufy ("Respiro do Guardião") e passos/dicas numeradas com ordenação (subir/descer) e pré-visualização instantânea antes da publicação.

### D. Endpoints Administrativos e Governança (`/backend/api/admin/`)
- `dashboard_geral.php` (GET): Retorna métricas globais consolidadas (famílias, pacientes, especialistas ativos vs. pendentes, consultas, split financeiro 35% GlicoCare / 65% Especialistas e os 25 últimos logs de auditoria).
- `salvar_home.php` (GET / POST): Obtém e atualiza chaves do CMS com processamento seguro de upload multipart de imagens até 8MB em `/backend/uploads/home/` e registro no `AuditLogger`.
- `publico/home_config.php` (GET): Endpoint público e resiliente sem necessidade de autenticação para abastecer a `Home.jsx`.
- `gerenciar_artigos.php` (GET / POST / PUT / DELETE): CRUD completo de artigos com suporte a upload de capa em `/backend/uploads/artigos/` e auditoria `CRIACAO`, `EDICAO` e `EXCLUSAO`.
- `curadoria_especialistas.php` (GET / POST): Curadoria profissional, verificação de conselhos (`CRM`, `CRN`, etc.), ativação/pausa e ajuste individual de split de repasse e retorno.
- `moderar_depoimentos.php` (GET / POST): Aprovação ou rejeição de relatos familiares (`RN-MOD-01`) e avaliações de teleconsultas.
- `usuarios.php` (GET / POST): Listagem e busca de contas com ativação/desativação imediata.

### E. Interface do Painel Administrativo (`PainelAdmin.jsx`)
- **5 Abas Principais:**
  1. *📊 Visão Geral & Finanças:* KPIs, gráfico/barra do split 35% / 65% e tabela pesquisável de logs imutáveis com filtro por ação.
  2. *🎨 Editar Tela Home (CMS):* Formulário visual por seções da Landing Page com preview de imagens e botão *"✓ Salvar Alterações na Home"*.
  3. *📚 Biblioteca de Conteúdos:* Tabela com filtros e modal de criação/edição com editor de blocos e aba de preview.
  4. *🩺 Especialistas & Curadoria:* Cards com conselho profissional, comutadores de aprovação/pausa e configuração de split.
  5. *💬 Moderação & Usuários:* Fila de aprovação de depoimentos e gestão completa de contas.

---

## 17. Módulo do Perfil Cuidador (Crianças < 12 anos, cuidadores_dependentes e Cartão Escolar)

### A. Modelagem de Dados & Co-Cuidadores (TiDB Cloud MySQL)
- **Tabela `cuidadores_dependentes`:**
  * Relacionamento N:N escalável entre responsáveis legais (`cuidador_usuario_id`) e perfis de saúde de crianças (`perfil_saude_id`).
  * `parentesco`: ENUM(`MAE`, `PAI`, `AVO_A`, `RESPONSAVEL_LEGAL`, `OUTRO_CUIDADOR`) NOT NULL DEFAULT `MAE`.
  * `nivel_acesso`: ENUM(`ADMINISTRADOR_LEGAL`, `ACOMPANHANTE_DIARIO`) NOT NULL DEFAULT `ADMINISTRADOR_LEGAL`.
    - `ADMINISTRADOR_LEGAL`: Assina TCLE anual como responsável civil, agenda consultas e gerencia exames e vínculos.
    - `ACOMPANHANTE_DIARIO`: Visualiza histórico e registra aplicações de insulina e destros diários.
  * `codigo_convite_familia`: VARCHAR(16) UNIQUE (código amigável, ex: `THEO-FAM-2026`, para o 2º responsável conectar sua conta à mesma criança).
  * `vinculado_em`: DATETIME (`America/Sao_Paulo`).
- **Atualização em `perfis_saude`:**
  * `nome_completo_paciente` VARCHAR(150), `is_menor_12` BOOLEAN DEFAULT 0, `escola_nome` VARCHAR(150), `contato_emergencia_telefone` VARCHAR(30).
- **Atualização em `registros_glicemia`:**
  * `registrado_por_usuario_id` INT UNSIGNED e `registrado_por_rotulo` VARCHAR(80) (ex: *"Mariana Silva (Mãe)"*, *"Carlos Eduardo (Pai)"*).
  * Garante que toda a família saiba exatamente quem realizou a medição ou bolus, prevenindo doses duplicadas e hipoglicemia severa.
- **Atualização em `agendamentos`:**
  * `perfil_saude_id` INT UNSIGNED vinculando a teleconsulta diretamente à criança atendida.

### B. Endpoints de Retaguarda (`/backend/api/cuidadores/`)
- `meus_dependentes.php` (GET): Retorna lista de crianças vinculadas ao cuidador autenticado, idade precisa (anos e meses), tempo de diagnóstico, co-cuidadores, alergias, medicamentos, IOB ativo, radar de queda rápida, consultas e exames.
- `cadastrar_dependente.php` (POST): Cadastra nova criança (criando `perfis_saude` e `cuidadores_dependentes`) ou vincula-se a uma criança existente via `codigo_convite_familia`.
- `gerar_convite_familia.php` (POST): Gera/renova o código de convite seguro com texto pronto para envio por WhatsApp.
- `registrar_glicemia_cuidador.php` (POST): Registra destro/bolus com rotulagem do cuidador, verificação de empilhamento de doses nas últimas 3 horas e cálculo de velocidade de queda.

### C. Workspace do Cuidador (`frontend/src/pages/PainelCuidador.jsx`)
- **Seletor de Filhos no Topo:** Card acolhedor com dados de Theo Silva (ou outros filhos), botões `+ Adicionar Filho(a)` (com abas de cadastro ou código de convite) e `🔗 Convidar Familiar (Pai/Mãe)`.
- **5 Abas Estruturadas:**
  1. *🩸 Diário & Insulina Ativa (IOB):* Alerta âmbar/ouro contra empilhamento com dose e horário da última aplicação, formulário rápido com cores imediatas (Verde 70-140, Amarelo 141-180, Terracota >180) e linha do tempo com badges de quem aplicou.
  2. *🩺 Especialistas & Consultas (Fase 2 Preservada):* Teleconsultas da criança, status do TCLE anual assinado pelo responsável legal, formulário de Pré-Atendimento e atalho para a sala criptografada `/sala-consulta/:token`.
  3. *🧪 Exames & Alergias:* Destaque de alergias (Dipirona, Adesivos FreeStyle Libre) com nível de gravidade e linha do tempo de exames laboratoriais (HbA1c).
  4. *🏫 Cartão de Cuidado Escolar (PDF):* Visualização limpa para a escola com dados do aluno, contatos diretos dos pais (WhatsApp), sinais de alarme de hipoglicemia, Regra dos 15g de resgate e botão para impressão direta (`window.print()`).
  5. *💬 Meus Comentários & Comunidade:* Histórico de depoimentos enviados pelo cuidador nos guias pedagógicos com status de moderação (`RN-MOD-01`).

---

## 18. Estratégia de Lançamento em Fases (Fase 1 Ativa vs Fase 2 Preservada/Comentada)

### A. Controle Central de Fases & Feature Flags
- **Arquivo Central (`frontend/src/config/features.js`):**
  * `export const FEATURES = { TELEMEDICINA_ATIVA: false };`
  * Permite chavear instantaneamente toda a camada de interface entre o modo de Lançamento Fase 1 e a liberação plena da Fase 2.
- **Variável de Ambiente no Back-end (`backend/.env` e `backend/.env.example`):**
  * `TELEMEDICINA_ATIVA=false`
  * Carregada automaticamente pela classe `Database` via PDO.
- **Trava de Segurança nos Endpoints PHP (`/backend/api/teleconsulta/*` e `/backend/api/pagamentos/*`):**
  * Validação atômica de `$_ENV['TELEMEDICINA_ATIVA']`: caso `false`, retorna compulsoriamente código HTTP `503 Service Unavailable` em JSON amigável com `{ "sucesso": false, "fase": "fase_1", "mensagem": "..." }`, prevenindo qualquer consumo inadvertido das rotas de teleconsulta e split Pix antes da homologação ética final.

### B. Componente Acolhedor "Em Preparação com Carinho" (`EmPreparacaoLufy.jsx`)
- **Identidade Visual "Porto Seguro":** 100% aderente ao Design System GlicoCare, compatível com Tema Claro e Dark Mode, tipografia `Fraunces` + `Plus Jakarta Sans`, avatar do Mascote Lufy com selo FreeStyle Libre e botões em Verde Alívio (`#3B7E48`).
- **Conteúdo e Tom de Voz Empático do Lufy:**
  * **Selo Superior:** `EM PREPARAÇÃO COM CARINHO`.
  * **Título (`Fraunces`):** *"Estamos preparando uma rede que realmente acolhe."*
  * **Mensagem:** *"Oi, aqui é o Lufy! Respire fundo: estamos cuidando de cada detalhe clínico e ético para conectar você a especialistas que entendem a rotina do diabetes com calma e respeito. Enquanto preparamos esse espaço, nossos conteúdos práticos, seu diário de glicemia e sua central de exames já estão abertos para acompanhar você hoje."*
- **Roteamento Inteligente de Apoio:**
  * Botão Primário Verde Alívio: `Explorar Conteúdos e Guias →` (leva a `/conteudos`).
  * Botão Secundário: `Ir para Meu Cuidado Diário` (direciona para `/painel-cuidador` se cuidador logado, `/meu-perfil` se diabético logado, ou `/cadastro` se visitante).
- **Rotas Vinculadas:** `/especialistas`, `/especialistas/:id`, `/como-funciona`, `/como-funciona-atendimentos`, `/credenciamento`, `/sala-consulta/:token` e `/atendimento-nativo/:token`.

### C. Os 3 Pilares Ativos da Fase 1
1. **Pilar 1 — Blog & Biblioteca de Conteúdos + CMS Admin:**
   * **`Home.jsx`:** Consumo dinâmico da tabela `configuracoes_home` via `/backend/api/publico/home_config.php` e dos artigos publicados em `artigos_conteudos` via `/backend/api/artigos/index.php`. Renderização automática de `<CapaEditorialDefault />` para artigos sem imagem de upload ou com falha de carregamento.
   * **`ArtigoDetalhe.jsx`:** Layout editorial aberto sobre o bege acolhedor (`#EAE4D9`), barra superior de progresso de leitura fluida, blocos "Respiro do Guardião" e comentários enviados com moderação prévia (`RN-MOD-01`).
   * **`PainelAdmin.jsx`:** Interface focada nas abas operacionais da Fase 1: *Visão Geral* (com KPIs de famílias, artigos e moderação), *Editar Tela Home (CMS)*, *Biblioteca de Conteúdos* (CRUD com editor de blocos e uploads até 8MB) e *Moderação de Depoimentos & Usuários*.
2. **Pilar 2 — Criação de Contas & Perfis Especializados (Diabético e Cuidador):**
   * **`Cadastro.jsx`:** Foco na experiência de onboarding das pessoas com DM1 e cuidadores de crianças.
   * **`Login.jsx`:** Autenticação segura com direcionamento automático por perfil (`admin` -> `/admin`, `cuidador` -> `/painel-cuidador`, `diabetico` -> `/meu-perfil`).
   * **`ConfigurarPerfil.jsx`:** Configuração completa com cálculo em linguagem natural do tempo de diagnóstico (`dateUtils.js`), registro estruturado de alergias (`alergias_usuario`), medicamentos ativos e fatores de sensibilidade.
3. **Pilar 3 — Cuidado Diário:**
   * **Diário de Glicemia & IOB (`MeuPerfil.jsx` e `glicemiaAnalytics.js`):** Estimativa fisiológica de Insulina Ativa em UI e tempo de expiração, projeção pelo FSI, seta de tendência de velocidade de variação entre destros e alertas contra empilhamento de doses e risco de hipoglicemia.
   * **Central de Exames (`CentralExames.jsx` e `/backend/api/exames/`):** Upload de PDFs/fotos até 10MB com hash seguro, registro estruturado de marcadores clínicos (HbA1c, glicemia de jejum, vitaminas) e linha do tempo histórica.
   * **Cartão de Cuidado Escolar (`PainelCuidador.jsx`) & Resumo Histórico (`ResumoHistoricoCompartilhavel.jsx`):** Exportação e impressão rápida (`window.print()`) com orientações de emergência (Regra dos 15g) e resumo médico completo.

### D. Preservação Rigorosa do Código da Fase 2
- Todos os arquivos, tabelas e regras de negócio da Fase 2 (Marketplace de Especialistas, Agendamentos com Retorno Incluso, Split Financeiro Pix 65/35, Sala de Vídeo Nativa e TCLE CFM 2.314/2022) permanecem integralmente preservados no repositório.
- Nas interfaces do front-end (`Navbar.jsx`, `Home.jsx`, `MeuPerfil.jsx`, `PainelCuidador.jsx`, `PainelAdmin.jsx`, `Cadastro.jsx`), as seções e chamadas estão delimitadas por blocos comentados explícitos em português:
  `{/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}`
  `{/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}`

---

## 19. Auditoria Técnica e Validação de Go-Live da Fase 1

### A. Checklist de Infraestrutura & Segurança Back-end
- **TiDB Cloud & Sincronização SQL:** Script `backend/database_tidb.sql` e `migrar_banco.mjs` totalmente alinhados com todas as tabelas ativas da Fase 1: `usuarios`, `perfis_saude`, `cuidadores_dependentes`, `alergias_usuario`, `medicamentos_usuario`, `registros_glicemia`, `exames_paciente`, `exames_resultados_itens`, `artigos_conteudos`, `depoimentos_moderacao`, `depoimentos_artigos` (view), `configuracoes_home` e `logs_auditoria`.
- **Proteção da Pasta de Uploads (`/backend/uploads/`):** Arquivo `.htaccess` ativo bloqueando a execução de scripts `.php`, `.phtml`, `.cgi`, `.sh` e `.py`, prevenindo vulnerabilidades de Remote Code Execution (RCE).
- **Variáveis de Ambiente Documentadas:** `backend/.env.example` atualizado com todas as chaves de produção (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_SSL`, `APP_TIMEZONE=America/Sao_Paulo`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`, `TELEMEDICINA_ATIVA=false`).

### B. Validações Ponta a Ponta Concluídas ([V01] a [V06])
- **[V01] Build de Produção:** Testada via `npm run build` no `frontend/` com 0 erros e 133 módulos compilados com sucesso.
- **[V02] Fluxo de Visitante & Fase 2 Protegida:** Acesso à Home, leitura de artigos, moderação de comentários e proteção ativa das rotas `/especialistas`, `/como-funciona` e `/sala-consulta/:token` renderizando `<EmPreparacaoLufy />` sem links quebrados.
- **[V03] Jornada do Perfil Diabético:** Fluxo completo de cadastro, login, cálculo de tempo de diagnóstico em português, gerenciamento de alergias e insulinas, lançamento no diário de glicemia com IOB e exportação do Resumo Histórico de Saúde.
- **[V04] Jornada do Perfil Cuidador (< 12 anos):** Cadastro de dependentes infantis, geração de código de convite familiar amigável (ex: `THEO-FAM-2026`), identificação visual de quem administrou a insulina/destro e impressão do Cartão de Cuidado Escolar com a Regra dos 15g.
- **[V05] Jornada do Admin (CMS & Curadoria):** Edição em tempo real da Home (`configuracoes_home`), publicação de artigos editoriais com `<CapaEditorialDefault />` automática, moderação prévia de comentários (`RN-MOD-01`) e consulta da trilha imutável `logs_auditoria`.
- **[V06] Consistência Visual (Claro & Dark):** Alternância instantânea de tema no botão flutuante da Navbar (☀️ / 🌙) com persistência em `localStorage` e estilização refinada em `#181513` / `#231F1C` / `#C88D6D` / `#4A9959`.

### C. Status Oficial
- **FASE 1 (Blog/CMS + Perfis/Contas + Cuidado Diário):** Homologada, estabilizada e pronta para Go-Live imediato.
- **FASE 2 (Teleatendimentos + Split Pix):** Preservada, protegida por feature flags e travas HTTP 503, e documentada para liberação posterior.












