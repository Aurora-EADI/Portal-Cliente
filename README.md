# Portal do Cliente

Monorepo Turborepo com pnpm 11.3.0 e Node.js 22.13+.

| Workspace | Pacote | Stack |
| --- | --- | --- |
| `frontend/` | `aurora-eadi-nextjs` | Next.js 15, React 19, Better Auth Client |
| `portal-cliente-api/` | `portal-cliente-api` | NestJS 11, Prisma 7 |

## Instalação

```sh
npm install --global pnpm@11.3.0
pnpm install --frozen-lockfile
pnpm dev
```

Execute comandos na raiz. `pnpm-workspace.yaml` define os workspaces;
`pnpm-lock.yaml` é o único lockfile. Não misture instalações npm e pnpm.
Dependências ficam isoladas por pnpm. O banco e o Prisma pertencem somente à
API; o Next encaminha `/api` para o Nest e não carrega credenciais de banco.
`allowBuilds` declara scripts de instalação necessários aos pacotes nativos.

Configure `frontend/.env.local` e `portal-cliente-api/.env`, usando os exemplos
disponíveis. A API precisa de `DATABASE_URL` para carregar `prisma.config.ts`.
Better Auth usa `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e a chave de
provisionamento por convite. Turbo não carrega `.env`; cada aplicação faz seu
próprio carregamento.

## Comandos

| Comando | Ação |
| --- | --- |
| `pnpm dev` | Inicia ambas as aplicações |
| `pnpm dev:web` / `pnpm dev:api` | Inicia apenas um workspace |
| `pnpm build` | Gera o cliente Prisma da API e compila ambos |
| `pnpm build:web` / `pnpm build:api` | Compila apenas um workspace |
| `pnpm start` | Inicia builds previamente gerados |
| `pnpm typecheck` | Verifica tipos em ambos |
| `pnpm lint` | ESLint do frontend; API ainda não possui lint |
| `pnpm prisma:generate` | Gera o cliente Prisma da API sem alterar banco |
| `pnpm db:migrate --name nome_da_migracao` | Cria/aplica migração de desenvolvimento da API |
| `pnpm db:studio` | Abre Prisma Studio da API |

## Prisma na API

Prisma pertence a cada workspace, não à raiz. Use os atalhos abaixo em vez de
`npx prisma migrate dev`:

```sh
# API (Prisma 7) — nunca use `db push`
pnpm prisma migrate dev --name nome_da_migracao
# Equivalente explícito:
pnpm --filter portal-cliente-api exec prisma migrate dev --name nome_da_migracao

```

Migrações não fazem parte de `build`, `dev` ou instalação. Após migrar,
`pnpm prisma:generate` atualiza o cliente; Prisma 7
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

Produção usa `docker-compose.yml` como stack oficial. O serviço `migrate` aplica
somente migrations versionadas com `prisma migrate deploy`; `prisma db push` não
faz parte do pipeline. API, frontend e migrator são imagens publicadas no GHCR;
o servidor não faz build. O Traefik fica separado da stack, usa Docker provider
na rede externa `portal_net`, redireciona `web` para `websecure` e recebe o
certificado da infraestrutura. O domínio de produção é
`portal-cliente.auroramanaus.com.br`.

## Deploy de produção

O pipeline oficial é `.github/workflows/deploy.yml`, acionado por push em `main`
ou manualmente. Quality, build e push rodam em GitHub-hosted runners. O deploy
roda somente em um runner Linux self-hosted com as labels
`self-hosted`, `linux` e `portal-eadi`, dentro da rede EADI; um runner público
não tem acesso presumido ao `SRVPORTALEADI`.

O build publica estas imagens, com tags SHA, `latest` e `production`:

```text
ghcr.io/<GHCR_OWNER>/portal-cliente-api:<tag>
ghcr.io/<GHCR_OWNER>/portal-cliente-frontend:<tag>
ghcr.io/<GHCR_OWNER>/portal-cliente-migrator:<tag>
```

Configure como Variables do repositório ou do environment `production`:

```text
GHCR_OWNER                 # obrigatório se o owner do pacote diferir do repositório; sempre minúsculo
PORTAL_HOST=portal-cliente.auroramanaus.com.br
AVERBACAO_ATIVA=false      # opcional; default false
```

O frontend recebe `NEXT_PUBLIC_API_URL=/api` no build. Nenhum segredo é incluído
na imagem. No servidor, o Compose usa `GHCR_OWNER`, `IMAGE_TAG` e os demais
valores de `.env.prod`. O serviço `migrate` tem o profile `migration`, portanto
`docker compose up` não o executa novamente; o deploy normal o chama
explicitamente antes de subir a aplicação. Falha na migration interrompe o
deploy.

### Ativação e secrets

Configure no GitHub, preferencialmente no environment `production`:

```text
SSH_HOST
SSH_USER
SSH_PORT
SSH_PRIVATE_KEY
SSH_KNOWN_HOSTS
```

`SSH_PRIVATE_KEY` deve ser uma chave dedicada de deploy. `SSH_KNOWN_HOSTS`
mantém a verificação da identidade do host; não desative
`StrictHostKeyChecking`. O usuário SSH deve ter somente o acesso necessário ao
diretório `/opt/portaleadi/app` e ao Docker; se precisar de `sudo`, documente
uma regra restrita para os comandos Docker.

Mantenha no servidor, nunca no GitHub, os secrets de runtime:

```text
DB_PASSWORD
BETTER_AUTH_SECRET
BETTER_AUTH_PROVISIONING_SECRET
SERVICE_API_KEY
MINIO_ROOT_PASSWORD
```

Se os pacotes GHCR forem privados, configure no servidor uma credencial
read-only para `ghcr.io` no usuário que executa o Docker. Não coloque token de
pull no Compose nem em argumentos de build. Pacotes públicos dispensam esse
login.

### Rollback manual

Execute `workflow_dispatch` informando uma tag SHA já publicada em
`image_tag`. O rollback não reconstrói imagens e não executa migration:

```text
IMAGE_TAG=<sha-anterior>
docker compose pull
docker compose up -d --remove-orphans
healthcheck HTTPS /api/health
```

Rollback de app != rollback de banco. Migrations não são revertidas
automaticamente; qualquer reversão de schema exige procedimento separado e
revisado.

Staging/desenvolvimento podem continuar usando os compose próprios, com redes e
domínios isolados. Nenhum desses arquivos é a configuração oficial de produção.

Referências: [pnpm workspaces](https://pnpm.io/workspaces),
[Prisma em pnpm workspaces](https://www.prisma.io/docs/guides/deployment/pnpm-workspaces).
