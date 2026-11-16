# Git Auto-Commit & Sync Rule

## Regra de Versionamento Contínuo
Sempre que você (o assistente de IA) concluir uma alteração, refatoração, correção ou criação de arquivos no sistema:
1. Execute `git add .` (respeitando `.gitignore`).
2. Crie um commit semântico e descritivo em português ou formato Conventional Commits (ex: `feat: ...`, `fix: ...`, `refactor: ...`) detalhando exatamente o que foi adicionado, alterado ou removido.
3. Envie para o repositório remoto via `git push origin main`.
4. Mantenha sempre o repositório no GitHub sincronizado e atualizado.
