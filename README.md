# 🌿 GlicoCare — Sistema Integrado de Apoio ao DM1

> Plataforma humanizada de acolhimento, suporte pedagógico, biblioteca editorial de conteúdos, diário glicêmico inteligente e gestão de saúde voltada para famílias, pacientes e cuidadores de Diabetes Tipo 1 (DM1).

---

## 🩺 Sobre o Projeto e Propósito ("Porto Seguro")

O **GlicoCare** foi concebido com uma missão clara: transformar a angústia inicial do diagnóstico de Diabetes Tipo 1 em uma rotina informada, serena, segura e acolhedora. Guiada pela identidade visual **"Porto Seguro"** e pelo mascote **Lufy** (o coala guardião equipado com sensor FreeStyle Libre), a plataforma substitui o alarmismo médico por acolhimento prático e ferramentas de alta precisão clínica.

---

## 🗺️ Mapa de Fases do Sistema

### 🟢 Fase 1 — Lançamento Ativo (Go-Live)
1. **Blog Editorial & Biblioteca de Conteúdos:**
   - Textos e imagens dinâmicos gerenciados via CMS Admin (`configuracoes_home`).
   - Vitrine de guias e artigos categorizados (*Com o Lufy*, *Rotina Escolar*, *Tecnologia & Autonomia*).
   - Componente visual `<CapaEditorialDefault />` com numeração `Fraunces` itálica e paleta terracota/verde/carvalho para artigos sem foto.
   - Leitura fluida e aberta sobre fundo bege acolhedor (`#EAE4D9`), barra de progresso em tempo real, citações *"Respiro do Guardião"*, botão nativo de compartilhamento e envio de comentários com moderação prévia obrigatória (`RN-MOD-01`).
2. **Criação de Contas & Perfis Especializados:**
   - Onboarding rápido em 2 etapas com foco nos perfis **Diabético** e **Cuidador** (`RN-ACC-01`).
   - Redirecionamento inteligente por perfil (`admin` -> `/admin`, `cuidador` -> `/painel-cuidador`, `diabetico` -> `/meu-perfil`).
   - Configuração de perfil de saúde com cálculo em português do tempo de diagnóstico (`dateUtils.js`), registro de sensibilidades e alergias estruturadas (`medicamentos`, `alimentos`, `adesivos/insumos`), medicamentos/insulinas e vínculo de dependentes menores de 12 anos com convite familiar seguro.
3. **Cuidado Diário, Central de Exames & Cartão Escolar:**
   - Diário de glicemia com cálculo fisiológico de **Insulina Ativa (IOB)**, projeção pelo FSI, detecção de empilhamento de doses e setas de tendência rápida entre destros.
   - Central de Exames Laboratoriais com upload seguro de laudos (PDF/imagem até 10MB) e múltiplos marcadores históricos (HbA1c, glicemia de jejum, etc.).
   - Emissão e impressão direta (`window.print()`) do **Resumo Histórico de Saúde** e do **Cartão de Cuidado Escolar / Emergência** (com a Regra dos 15g de resgate de hipoglicemia).
4. **Painel Administrativo Completo (`/admin`):**
   - Gestão restrita da curadoria (Priscila Manzoni Furlani).
   - Abas ativas da Fase 1: Visão Geral com KPIs, Editor Visual da Home (CMS), Gestão Editorial da Biblioteca (CRUD de artigos e upload até 8MB) e Moderação de Depoimentos & Usuários.
   - Trilha imutável append-only de auditoria (`logs_auditoria`) com rastreabilidade total de mutações de dados.

### 🟡 Fase 2 — Preservada e em Homologação Ética
- **Marketplace de Especialistas:** Credenciamento com validação de conselho ativo (CRM, CRN, CRP, CREF).
- **Agendamento & Retorno Incluso:** Agenda em tempo real com garantia de 1 retorno incluso em até 30 dias (`RN-AGD-02`).
- **Módulo Financeiro & Split Pix:** Custódia protegida com repasse automático de 65% para o especialista e 35% para a plataforma (`RN-FIN-03`).
- **Teleatendimento Nativo & TCLE CFM 2.314/2022:** Videoconferência integrada com sala de espera, anamnese pré-atendimento, prontuário CFM e receitas digitais (`RN-ATD-04`).
- *Status:* Preservada no código com flags centrais (`FEATURES.TELEMEDICINA_ATIVA = false` e trava HTTP 503 no backend), exibindo a tela acolhedora `<EmPreparacaoLufy />` nas rotas `/especialistas`, `/como-funciona` e `/sala-consulta/:token`.

---

## 🛠️ Arquitetura Tecnológica

- **Front-end:** React 18, Vite, React Router DOM v6, Lucide Icons.
- **Design System:** "Porto Seguro" com alternância fluida entre **Tema Claro** (`#EAE4D9`) e **Tema Noturno Acolhedor** (`#181513`), tipografia serifada `Fraunces` e sem-serifa `Plus Jakarta Sans`, `<CustomSelect />` acessível e sem azul padrão de navegadores.
- **Back-end:** PHP 8+ com PDO nativo, arquitetura RESTful modular e auditoria imutável via `AuditLogger`.
- **Banco de Dados:** TiDB Cloud (Serverless MySQL com conexão SSL TLS v1.2 na porta 4000) e compatibilidade total com MySQL local (XAMPP / Laragon).
- **Segurança de Uploads:** Proteção contra execução de scripts maliciosos em `/backend/uploads/` via `.htaccess` e validação estrita de tipos MIME e tamanho.

---

## 📁 Estrutura de Diretórios

```
glicocare/
├── backend/
│   ├── api/
│   │   ├── admin/           # Endpoints do CMS, artigos, moderação e auditoria
│   │   ├── artigos/         # Endpoints públicos de artigos e biblioteca
│   │   ├── auth/            # Cadastro e login com hash seguro e tokens
│   │   ├── cuidadores/      # Vínculo familiar, dependentes e cartão escolar
│   │   ├── exames/          # Central de exames e upload de laudos laboratoriais
│   │   ├── glicemia/        # Diário glicêmico e cálculos educativos
│   │   ├── perfil/          # Perfil de saúde, alergias e medicamentos
│   │   ├── publico/         # Configurações leves da Home (CMS)
│   │   ├── pagamentos/      # Split Pix e custódia (Trava Fase 2)
│   │   └── teleconsulta/    # Salas de vídeo e prontuário CFM (Trava Fase 2)
│   ├── config/              # Conexão PDO segura (TiDB Cloud / MySQL)
│   ├── middleware/          # Autenticação e RBAC (AuthMiddleware)
│   ├── services/            # Trilha imutável de auditoria (AuditLogger)
│   ├── uploads/             # Diretórios de upload protegidos (.htaccess)
│   ├── database_tidb.sql    # Schema relacional completo com views da Fase 1
│   ├── migrar_banco.mjs     # Script automatizado de migração TiDB Cloud
│   └── .env.example         # Template com variáveis de produção documentadas
├── frontend/
│   ├── src/
│   │   ├── assets/          # Fotos e ilustrações oficiais do Mascote Lufy
│   │   ├── components/      # Componentes (Navbar, Footer, CustomSelect, EmPreparacaoLufy...)
│   │   ├── config/          # Feature flags centrais (features.js)
│   │   ├── context/         # AuthContext e gerenciamento global de sessão
│   │   ├── pages/           # Telas do sistema (Home, Biblioteca, MeuPerfil, PainelAdmin...)
│   │   ├── services/        # Clientes HTTP axios com interceptors de token
│   │   ├── styles/          # Design tokens (variables.css) e Tema Dark
│   │   └── utils/           # Motor glicêmico (IOB, FSI) e cálculos de data
│   └── package.json
├── memory.md                # Base de conhecimento e regras de negócio
└── README.md                # Documentação técnica do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+) e npm
- PHP 8+ com extensão PDO MySQL habilitada
- Conexão com o TiDB Cloud ou MySQL local

### 1. Configuração do Back-end (PHP + TiDB Cloud)
1. Acesse a pasta `backend/` e crie seu arquivo `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Preencha as credenciais do banco no `.env` (ex: TiDB Cloud na porta 4000 com `DB_SSL=true`).
3. Execute a sincronização de banco de dados:
   ```bash
   node migrar_banco.mjs
   ```
4. Inicie o servidor PHP embutido na porta 8000:
   ```bash
   php -S localhost:8000
   ```

### 2. Configuração do Front-end (React + Vite)
1. Em outro terminal, acesse a pasta `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Abra a aplicação no navegador: [http://localhost:5173/](http://localhost:5173/).

---

## 🔐 Contas de Demonstração e Testes (Ambiente de Staging)

Para testar todos os perfis do sistema na tela de `/login`:

| Perfil | E-mail de Demonstração | Senha Padrão | Painel de Redirecionamento |
| :--- | :--- | :--- | :--- |
| **Administrador (Curadoria)** | `curadoria@glicocare.com.br` | `glicocare123` | `/admin` |
| **Cuidador (Família DM1)** | `mariana.mae@exemplo.com.br` | `glicocare123` | `/painel-cuidador` |
| **Pessoa com Diabetes** | `carlos.pai@exemplo.com.br` | `glicocare123` | `/meu-perfil` |

---

## 📄 Licença e Autoria
Projeto desenvolvido e gerenciado por **Priscila Manzoni Furlani**. Todos os direitos reservados.
