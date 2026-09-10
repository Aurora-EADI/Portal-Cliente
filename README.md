# Portal do Cliente

Monorepo Turborepo com pnpm 11.3.0 e Node.js 22.13+.

| Workspace | Pacote | Stack |
| --- | --- | --- |
| `frontend/` | `aurora-eadi-nextjs` | Next.js 15, React 19, Prisma 6 |
| `portal-cliente-api/` | `portal-cliente-api` | NestJS 11, Prisma 7 |

## Instalação

```sh
npm install --global pnpm@11.3.0
pnpm install --frozen-lockfile
pnpm dev
```

Execute comandos na raiz. `pnpm-workspace.yaml` define os workspaces;
`pnpm-lock.yaml` é o único lockfile. Não misture instalações npm e pnpm.
Dependências ficam isoladas por pnpm, incluindo as duas versões do Prisma.
`allowBuilds` declara scripts de instalação necessários aos pacotes nativos.

Configure `frontend/.env.local` e `portal-cliente-api/.env`, usando os exemplos
disponíveis. A API precisa de `DATABASE_URL` para carregar `prisma.config.ts`.
Frontend também precisa de `DATABASE_URL` durante build; geração Prisma usa
`DATABASE_URL` e `DIRECT_URL` quando configuradas. Turbo não carrega `.env`;
cada aplicação e a configuração Prisma fazem esse carregamento.

## Comandos

| Comando | Ação |
| --- | --- |
| `pnpm dev` | Inicia ambas as aplicações |
| `pnpm dev:web` / `pnpm dev:api` | Inicia apenas um workspace |
| `pnpm build` | Gera clientes Prisma e compila ambos |
| `pnpm build:web` / `pnpm build:api` | Compila apenas um workspace |
| `pnpm start` | Inicia builds previamente gerados |
| `pnpm typecheck` | Verifica tipos em ambos |
| `pnpm lint` | ESLint do frontend; API ainda não possui lint |
| `pnpm prisma:generate` | Gera ambos os clientes sem alterar banco |
| `pnpm db:migrate --name nome_da_migracao` | Cria/aplica migração de desenvolvimento da API |
| `pnpm db:migrate:web --name nome_da_migracao` | Cria/aplica migração de desenvolvimento do frontend |
| `pnpm db:studio` | Abre Prisma Studio da API |

## Prisma na raiz

Prisma pertence a cada workspace, não à raiz. Use os atalhos abaixo em vez de
`npx prisma migrate dev`:

```sh
# API (Prisma 7)
pnpm prisma migrate dev --name nome_da_migracao
# Equivalente explícito:
pnpm --filter portal-cliente-api exec prisma migrate dev --name nome_da_migracao

# Frontend (Prisma 6)
pnpm prisma:web migrate dev --name nome_da_migracao
```

Escolha o schema correto. Migrações não fazem parte de `build`, `dev` ou
instalação. Após migrar, `pnpm prisma:generate` atualiza os clientes; Prisma 7
não gera o cliente automaticamente em `migrate dev`. Para inspecionar comandos
sem alterar banco, use `pnpm db:migrate --help`.

Para adicionar dependências:

```sh
pnpm --filter aurora-eadi-nextjs add nome-do-pacote
pnpm --filter portal-cliente-api add nome-do-pacote
pnpm add -Dw nome-da-ferramenta
```

## Cache e Docker

Turbo armazena `.next/` (exceto cache interno) e `dist/`. `.env*` e variáveis de
build declaradas em `turbo.json` participam da chave de cache. Geração Prisma
roda antes de build/dev/typecheck; dev/start são persistentes, sem cache.

Dockerfiles usam contexto da raiz, pnpm fixado e `--frozen-lockfile`:

```sh
docker compose build frontend portal-cliente-api
```

Frontend usa saída standalone (`frontend/server.js`) no Docker, com
`NEXT_STANDALONE=true`. Build local usa saída padrão e `pnpm start`, evitando
permissão especial para criar symlinks no Windows. API usa `pnpm deploy`
para preparar dependências de produção e gera cliente Prisma nessa árvore.
Arquivos `.env` locais ficam fora das imagens; configuração chega pelo Compose.

Pipeline GitLab preexistente referencia `backend`, `docker-compose.prod.yml`
e `docker-compose.dev.yml`, ausentes neste checkout. Precisa de alinhamento com
infraestrutura antes de deploy. Next mantém opções preexistentes de ignorar
lint/tipos durante build; execute essas verificações separadamente.

Referências: [pnpm workspaces](https://pnpm.io/workspaces),
[Prisma em pnpm workspaces](https://www.prisma.io/docs/guides/deployment/pnpm-workspaces).
