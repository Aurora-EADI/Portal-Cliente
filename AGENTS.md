# Diretrizes para Agentes de IA (AGENTS.md)

Este documento estabelece as regras e padrões obrigatórios para qualquer agente de IA ou desenvolvedor atuando neste repositório.

---

## 🛑 Regra Crítica: Banco de Dados e Prisma

> [!CAUTION]
> **NUNCA USAR `prisma db push`. SEMPRE USAR `prisma migrate`.**
> Todas as alterações de esquema de banco de dados DEVEM ser representadas por migrations versionadas no repositório.

### Comandos Permitidos:
- **Criar/Aplicar migration em desenvolvimento:**
  ```bash
  pnpm --filter portal-cliente-api exec prisma migrate dev --name <nome_da_migracao>
  # ou na pasta portal-cliente-api:
  npx prisma migrate dev --name <nome_da_migracao>
  ```
- **Aplicar migrations em ambiente de produção/CI:**
  ```bash
  pnpm --filter portal-cliente-api exec prisma migrate deploy
  # ou na pasta portal-cliente-api:
  npx prisma migrate deploy
  ```
- **Popular dados essenciais:**
  ```bash
  pnpm --filter portal-cliente-api exec prisma db seed
  # ou na pasta portal-cliente-api:
  npm run prisma:seed
  ```

### Justificativa:
1. `db push` desconsidera o histórico de migrations, impede rastreabilidade de alterações e pode introduzir alterações destrutivas silenciosas em staging/produção.
2. Todo o ciclo de vida do schema deve ser versionado via migrations SQL sob `portal-cliente-api/prisma/migrations`.

