# GlicoCare — Sistema Integrado de Apoio ao DM1

> Plataforma humanizada de acolhimento, suporte pedagógico, biblioteca de conteúdos e marketplace de especialistas voltado para famílias e pacientes com Diabetes Tipo 1 (DM1).

---

## 🩺 Sobre o Projeto

O **GlicoCare** foi desenvolvido para transformar o diagnóstico de diabetes tipo 1 em uma rotina segura, informada e acolhedora. Através de uma identidade visual serena ("Porto Seguro") e do mascote **Lufy**, o sistema integra:

- **Biblioteca de Conteúdos:** Artigos, guias práticos e materiais educativos categorizados por fases e temas.
- **Marketplace de Especialistas:** Busca, agendamento de consultas e atendimento integrado com profissionais de saúde certificados (Endocrinologistas, Nutricionistas, Psicólogos, Educadores Físicos).
- **Moderação de Histórias e Depoimentos:** Espaço para famílias compartilharem experiências com aprovação administrativa prévia.
- **Bot de Triagem do Lufy:** Orientação rápida para dúvidas e situações do dia a dia (glicemia alta/baixa, escola, noites).

---

## 🛠️ Tecnologias

- **Front-end:** React, Vite, Lucide Icons, CSS Modular / Tailwind
- **Back-end:** PHP Relacional (Arquitetura RESTful modular)
- **Banco de Dados:** MySQL (compatível com phpMyAdmin)

---

## 📁 Estrutura de Diretórios

```
glicocare/
├── backend/
│   ├── api/            # Endpoints REST (artigos, especialistas, agendamentos, moderação)
│   ├── config/         # Configurações do sistema e conexão com banco
│   └── database.sql    # Script de estruturação do banco de dados MySQL
├── frontend/
│   ├── public/         # Assets estáticos
│   ├── src/            # Componentes React, páginas, rotas e estilização
│   ├── index.html
│   └── package.json
├── memory.md           # Regras de negócio, design system e especificações técnicas
└── README.md           # Documentação do projeto
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+) e npm
- Servidor Web com suporte a PHP 8+ e MySQL (ex: Apache / XAMPP / Laragon / WampServer)

### 1. Banco de Dados
1. Inicie o MySQL através do seu gerenciador (ex: phpMyAdmin).
2. Crie uma base de dados (ex: `glicocare`).
3. Importe o arquivo `backend/database.sql`.
4. Configure as credenciais de acesso em `backend/config/database.php`.

### 2. Back-end (PHP)
Sirva a pasta `backend/` no seu servidor Apache/Nginx ou utilize o servidor embutido do PHP:
```bash
cd backend
php -S localhost:8000
```

### 3. Front-end (React + Vite)
Instale as dependências e inicie o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Licença e Autoria
Projeto desenvolvido por Priscila Furlani. Todos os direitos reservados.
