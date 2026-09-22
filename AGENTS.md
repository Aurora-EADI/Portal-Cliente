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

---

## 💻 Ambiente de Desenvolvimento Local (sem Docker)

> [!IMPORTANT]
> **O desenvolvimento local NÃO roda via Docker.** API e frontend rodam nativos no Windows (`node`), contra o PostgreSQL nativo.
> Não usar `docker exec`, `docker logs` ou `docker compose` para diagnosticar o ambiente local.

| Serviço | Como roda | Endereço | Configuração |
| --- | --- | --- | --- |
| PostgreSQL | Serviço Windows `postgresql-x64-18` | `localhost:5432`, banco `portal-cliente` | `DATABASE_URL` em `portal-cliente-api/.env` |
| API (NestJS) | `node` nativo | `http://localhost:5001/api` | `portal-cliente-api/.env` |
| Frontend (Next.js) | `next dev` nativo | `http://localhost:3001` | `frontend/.env.local` (link de convite usa `FRONTEND_URL` da API) |

- `psql` não está no PATH: usar `"C:\Program Files\PostgreSQL\18\bin\psql.exe"`.
- Erros da API aparecem no terminal onde o `node` da API está rodando (o `GlobalExceptionFilter` loga o stack de todo 5xx).
- Se um container Docker antigo (`portal-aurora-backend`, `portal-aurora-frontend`) estiver de pé, ele disputa as portas com os processos nativos e as requisições podem cair nele. Confirme com `Get-NetTCPConnection -State Listen -LocalPort 5001,3001,5432`.
- A porta 3000 é do Portal-Aurora (outro repositório), não deste projeto.
- Os arquivos `docker-compose*.yml` e `.env` da raiz servem a homologação/produção, não ao dev local.

