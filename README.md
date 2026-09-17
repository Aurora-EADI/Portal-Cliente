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

## Testes

```sh
pnpm test                                  # ambos os workspaces
pnpm --filter portal-cliente-api test
pnpm --filter aurora-eadi-nextjs test
```

Quase toda a suíte da API roda com o Prisma dublado, sem banco algum. As
exceções são os testes de sessão do Better Auth (`tests/auth-flow.test.cjs`),
que gravam usuário e sessão de verdade, e o de integração do RabbitMQ.

Esses testes **não leem `DATABASE_URL`**: num shell de desenvolvimento ela
aponta para o banco com dados reais. Eles exigem `TEST_DATABASE_URL` explícito e,
sem ela, pulam imprimindo o motivo — em vez de rodar contra o banco errado.

### PostgreSQL descartável

`docker-compose.postgres.test.yml` sobe um Postgres na **55432**, fora da porta
padrão para não ser confundido com o de desenvolvimento, e com os dados em
tmpfs: somem quando o container para, então nenhuma execução herda estado da
anterior.

```sh
docker compose -f docker-compose.postgres.test.yml up -d

export TEST_DATABASE_URL='postgresql://portal_test:portal_test@127.0.0.1:55432/portal_cliente_test'
export DATABASE_URL="$TEST_DATABASE_URL"
export BETTER_AUTH_SECRET='qualquer-segredo-de-teste-com-32-caracteres'
export BETTER_AUTH_PROVISIONING_SECRET='qualquer-segredo-de-teste'

pnpm --filter portal-cliente-api exec prisma migrate deploy
pnpm --filter portal-cliente-api test

docker compose -f docker-compose.postgres.test.yml down -v
```

`DATABASE_URL` também é exportada porque `node --test --test-isolation=none`
carrega todos os arquivos no mesmo processo, e `src/auth/better-auth` abre o
pool quando é importado — o que acontece por outro arquivo de teste, antes de
`auth-flow.test.cjs` executar.

## Integração Aurora por RabbitMQ

Não existe sincronização REST entre Portal Aurora e Portal do Cliente para DI
averbada ou status de agendamento. A ponte obrigatória é RabbitMQ:

```text
Portal Aurora
     │ dis.averbada.created
     ▼
  RabbitMQ
     ▼
Portal Cliente
     │ agendamento.status-changed
     ▼
  RabbitMQ
     ▼
Portal Aurora
```

`amqplib` 2.x é usado diretamente para manter ACK manual, ConfirmChannel,
publisher confirms e topology explícita. `RABBITMQ_URL` é a única credencial de
broker; use `amqps://` em produção e nunca a registre em logs.

| Recurso | Default configurável |
| --- | --- |
| Exchange principal topic/durável | `portal.integration.events` |
| Exchange retry topic/durável | `portal.integration.retry` |
| DLX topic/durável | `portal.integration.dlx` |
| Fila DI Portal Cliente | `portal-cliente.dis-averbada.created` |
| Retry DI TTL 30 s | `portal-cliente.dis-averbada.created.retry.30s` |
| DLQ DI | `portal-cliente.dis-averbada.created.dlq` |

Contrato `dis.averbada.created` v1: envelope contém `eventId` UUID,
`eventType`, `version: 1`, `occurredAt`, `source`, `correlationId` e `payload`.
O payload exige `nLote` autoritativo, `diId`, `numeroDI`, `cpfMotorista`,
`placaVeiculo`, `dtAverbacao` e `idContainers`. O portal não deriva `nLote`.

Inbox (`ProcessedEvent.eventId` único), DI e containers são gravados na mesma
transação; somente então a mensagem recebe ACK. Payload inválido vai direto à
DLQ. Falha transitória é republicada com confirm para retry TTL; cinco tentativas
encerram na DLQ. Não há `nack(requeue=true)` em loop.

Mudança de status grava `AgendamentoStatusHistorico` e `OutboxEvent` na mesma
transação. Worker seleciona eventos com `FOR UPDATE SKIP LOCKED`, publica com
mensagem persistente e confirm, e só então preenche `publishedAt`. Falha mantém
o evento pendente com backoff. `/api/health` permanece liveness; `/api/health/ready`
reporta API, PostgreSQL, MinIO e RabbitMQ sem dados sensíveis.

### Teste local descartável

```sh
docker compose -f docker-compose.rabbitmq.test.yml up -d
# PostgreSQL descartável já migrado — ver "Testes" acima
docker compose -f docker-compose.postgres.test.yml up -d
$env:RABBITMQ_TEST_URL='amqp://127.0.0.1:5672'
$env:DATABASE_URL='postgresql://portal_test:portal_test@127.0.0.1:55432/portal_cliente_test'
pnpm --filter portal-cliente-api test -- tests/rabbitmq.integration.test.cjs
docker compose -f docker-compose.rabbitmq.test.yml down -v
docker compose -f docker-compose.postgres.test.yml down -v
```

Variáveis: `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`, `RABBITMQ_RETRY_EXCHANGE`,
`RABBITMQ_DLX_EXCHANGE`, `RABBITMQ_DI_AVERBADA_QUEUE`,
`RABBITMQ_DI_AVERBADA_RETRY_QUEUE`, `RABBITMQ_DI_AVERBADA_DLQ`,
`RABBITMQ_RETRY_DELAY_MS` e `RABBITMQ_MAX_RETRIES`.

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
na rede externa `portal_net`, redireciona `web` para `websecure` e emite o
certificado ACME/Let's Encrypt. O domínio de produção é
`portal-cliente.auroramanaus.com.br`.

## Deploy de produção

O primeiro deploy é manual no `SRVPORTALEADI`. `.github/workflows/deploy.yml`
aceita somente `workflow_dispatch`; push em `main` não publica nem aplica
migrations. O Compose oficial permanece preparado para GHCR. O override
`docker-compose.manual.yml` constrói localmente API, migrator e frontend.

No clone em `/opt/portaleadi/app`, valide, construa, migre e só então suba:

```sh
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod config
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod build --pull
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod up -d --remove-orphans
```

Não use `prisma db push`. Falha na migration encerra o procedimento; não suba a
aplicação até corrigi-la.

### Bootstrap do primeiro administrador

Use este procedimento uma única vez, depois de aplicar as migrations e antes de
subir a API. A rotina não expõe endpoint HTTP, consulta `users` antes de mudar
o banco e só continua se a contagem for exatamente zero. Com qualquer usuário
existente, ela encerra com código diferente de zero sem criar credencial.

No servidor, informe os dados de forma interativa. A senha não deve ser passada
como argumento, colocada em arquivo Compose ou registrada no Git:

```sh
read -r -p 'Nome do administrador: ' BOOTSTRAP_ADMIN_NAME
read -r -p 'E-mail do administrador: ' BOOTSTRAP_ADMIN_EMAIL
read -r -s -p 'Senha: ' BOOTSTRAP_ADMIN_PASSWORD
printf '\n'
export BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD

docker compose --env-file .env.prod run --rm --no-deps \
  -e BOOTSTRAP_ADMIN_NAME \
  -e BOOTSTRAP_ADMIN_EMAIL \
  -e BOOTSTRAP_ADMIN_PASSWORD \
  portal-cliente-api node dist/scripts/bootstrap-first-admin.js

unset BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

O comando usa a imagem já publicada da API e o mesmo mecanismo interno de
provisionamento Better Auth usado por convites e por `/users`; não cria hash nem
manipula tabelas de autenticação diretamente. Em sucesso, a única saída é:

```text
Primeiro administrador criado com sucesso.
E-mail: <email-normalizado>
Role: ADMIN
```

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

Clone o repositório privado no servidor com uma Deploy Key read-only. Mantenha
o `.env.prod` somente no servidor, com permissão `0600`. Não são necessários
GitHub Actions secrets nem runner self-hosted para o deploy manual.

Mantenha no servidor, nunca no GitHub, os secrets de runtime:

```text
DB_PASSWORD
BETTER_AUTH_SECRET
BETTER_AUTH_PROVISIONING_SECRET
SERVICE_API_KEY
MINIO_ROOT_PASSWORD
RABBITMQ_URL
```

Quando o fluxo GHCR for habilitado, configure a credencial read-only para
`ghcr.io` no usuário que executa o Docker. Não coloque token de pull no Compose,
em `.env.prod` ou em argumentos de build. O build manual não faz pull de imagens
da aplicação.

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
