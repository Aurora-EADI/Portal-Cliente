# Ambientes do Portal do Cliente

Mapa dos ambientes, da separação entre eles e do caminho de volta quando um
deploy dá errado. Para o procedimento de subir a homologação, ver
[HOMOLOGACAO.md](HOMOLOGACAO.md).

> Blocos marcados **[VERIFICAR NA VM]** contêm o comando que apura o fato, não
> o fato. Preencha a resposta ao lado na primeira vez que rodar, porque o repo
> se contradiz em alguns pontos e suposição aqui custa caro.

---

## Fluxo de branches

```text
feature/*  ──>  develop  ──>  main
                 homolog       produção
```

| Branch | Ambiente | VM |
|---|---|---|
| `develop` | Homologação | `172.20.210.87` (Windows) |
| `main` | Produção | `172.20.210.68` (Linux) |

Mesma convenção do Portal Aurora (`DEPLOY.md:5-12` daquele repo). `develop` é
**estágio de release**, não variante de sistema operacional: o código é
idêntico nas duas branches e nenhum arquivo versionado é específico de SO. Os
containers são Linux nos dois hosts; o que varia são os comandos de preparo do
host, e esses estão lado a lado em [HOMOLOGACAO.md](HOMOLOGACAO.md).

> Não bifurque por SO. Uma cópia por ambiente apodrece: o
> `docker-compose.homolog.yml` deste repo *era* uma cópia do Portal Aurora
> apontando para `./backend` e `./aurora-eadi-front`, pastas que nunca
> existiram aqui, e o `develop` antigo ficou 148 commits atrás do `main` sem
> nunca ter ido ao `origin`. Correção de segurança aplicada numa branch só não
> chega na outra.

---

## Inventário

| | Produção | Homologação |
|---|---|---|
| VM | `172.20.210.68` | `172.20.210.87` |
| SO do host | Linux (runner do CI é `[self-hosted, linux, portal-eadi]`, caminhos `/opt/...`) | **Windows** — comandos de host em PowerShell, Postgres como serviço do Windows |
| URL | https://portal-cliente.auroraeadi.com.br | `https://172.20.210.87:8453` |
| Compose | `docker-compose.yml` | `docker-compose.homolog.yml` |
| Project name | **[VERIFICAR NA VM]** | `portal-cliente-hml` |
| Arquivo de env | `.env.prod` | `.env.homolog` |
| Imagens | GHCR, por tag — ou build local via `docker-compose.manual.yml` | build na própria VM |
| Traefik | externo à stack, compartilhado, ACME/Let's Encrypt | dentro da stack, certificado autoassinado |
| Portas no host | 80, 443 | 8090, 8453 |
| Rede | `portal_net` (external, criada fora do compose) | `portalcliente_hml` (própria, subnet `172.31.240.0/24`) |
| Postgres | `172.20.210.68:5432`, banco `portal_agendamento`, `sslmode=require` | host da própria VM via `host.docker.internal:5432`, banco `portal_cliente`, `sslmode=disable` |
| MinIO | `minio-prod`, volume `minio_data`, bucket `portal-cliente` | `minio-cliente-hml`, volume `minio_data_hml`, bucket `portal-cliente-hml` |
| RabbitMQ | broker em `172.20.210.85:5672`, vhost `/agendamento`, filas sem sufixo | **broker próprio**, container `rabbitmq-cliente-hml` na stack, vhost `homologacao`, filas sufixadas `.hml` |
| Containers | `portal-cliente-api`, `portal-cliente-frontend`, `minio-prod` | mesmos nomes com sufixo `-hml`, mais `traefik-cliente-hml` e `rabbitmq-cliente-hml` |

### Quem mais vive nessas VMs

- **`172.20.210.87` hospeda também a homologação do Portal Aurora**, que ocupa
  as portas **80, 443 e 9000** e a rede `aurora-network`. É a razão de o Portal
  do Cliente usar portas altas e Traefik próprio ali. Não mexa na stack do
  Aurora para liberar porta.
- `172.20.210.84` é a produção do Portal Aurora; `172.20.210.81` hospeda
  Postgres e MinIO do Aurora. Nenhuma das duas é deste projeto.
- Porta 3000 em máquina de desenvolvimento é do Portal Aurora, não deste
  projeto (ver `AGENTS.md`).

---

## Separação entre os ambientes

A tabela acima é o contrato. Três consequências práticas:

1. **Não existe caminho de rede da homologação para o banco de produção.**
   `host.docker.internal` resolve para o gateway do host da `.87`, e o
   `DATABASE_URL` de homologação não contém o IP `.68`.
2. **O compose de produção não é compartilhado.** `docker-compose.yml` compõe o
   `DATABASE_URL` internamente com o IP `172.20.210.68` fixo (linhas 36 e 49);
   a homologação carrega o `DATABASE_URL` inteiro via `env_file`. Parametrizar
   `DB_HOST`/`DB_SSLMODE` no arquivo de produção foi considerado e descartado,
   para que ele siga byte-idêntico ao que já roda. Fica como dívida: se um dia
   houver um terceiro ambiente, parametrizar passa a valer a pena.
3. **Só o servidor SMTP é compartilhado.** O RabbitMQ da homologação é um
   container da própria stack: toda a homologação roda na `.87`, e o broker de
   `172.20.210.85` é exclusivo da produção. Nenhum comando de homologação roda
   no `.85`.

### Regras de operação

- **Todo comando Compose na `.87` carrega `-p portal-cliente-hml` e
  `-f docker-compose.homolog.yml`.** `--remove-orphans` sem project name
  explícito alcança containers de outro projeto Compose da mesma máquina, e ali
  isso significa derrubar a homologação do Portal Aurora.
- **Não rode `docker compose` solto** no diretório da `.87`.
- Diagnóstico em produção é read-only. Nenhum `up`, `down`, `restart`, `pull`,
  `build` ou `rm` fora de uma janela de deploy.

---

## Produção hoje

### Onde a stack roda **[VERIFICAR NA VM]**

O repo tem dois caminhos conflitantes para a mesma stack:

- `.github/workflows/deploy.yml:178` e `README.md:212` → `/opt/portaleadi/app`
- `doc/DEPLOY-PRODUCAO.md:10,14-15` (nota local, não versionada) → afirma que
  `/opt/portaleadi/app` está **vazio** e que a stack roda de
  `/home/auroraeadi/Portal-Cliente`

```sh
ls -la /opt/portaleadi/app 2>/dev/null; ls -la ~/Portal-Cliente 2>/dev/null
docker compose ls                     # project name e caminho do compose em uso
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
cd <dir-confirmado> && git log -1 --format='%H %ci %s' && git status --short
```

Resposta: `__________________________`

### Deploy

O deploy oficial é **manual**, documentado em `README.md:205-222`, a partir do
clone no servidor:

```sh
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod config
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod build --pull
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.yml -f docker-compose.manual.yml --env-file .env.prod up -d --remove-orphans
```

Falha na migration encerra o procedimento: não suba a aplicação antes de
corrigir. Nunca use `prisma db push` (ver `AGENTS.md`).

### Configuração

`.env.prod` existe **somente no servidor**, com permissão `0600`, e seu
template é `.env.example`. Para inspecionar sem vazar valor:

```sh
grep -oE '^[A-Z_]+' .env.prod          # só os NOMES das chaves
stat -c '%a %U:%G' .env.prod
docker compose --env-file .env.prod config | grep -vE 'PASSWORD|SECRET|_KEY|RABBITMQ_URL'
```

Secrets de runtime que vivem só no servidor, nunca no GitHub: `DB_PASSWORD`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_PROVISIONING_SECRET`, `SERVICE_API_KEY`,
`MINIO_ROOT_PASSWORD`, `RABBITMQ_URL`.

### Traefik externo **[VERIFICAR NA VM]**

Fica fora da stack, usa o Docker provider na rede externa `portal_net`,
redireciona `web` → `websecure` e emite certificado ACME. Requisitos em
`docker/traefik/README.md`; config em `docker/traefik/traefik.prod.yml`. O
estado do ACME (`acme.json`) vive num mount do host e **não** é versionado.
Uma única réplica de Traefik, e a porta 80 tem de ser pública para o
desafio HTTP-01.

```sh
docker inspect <traefik> --format '{{.Config.Image}}{{"\n"}}{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

Versão em uso: `__________`  ·  Mount do ACME: `__________________________`

### Banco **[VERIFICAR NA VM]**

```sh
psql "$DATABASE_URL" -c 'select migration_name, finished_at from _prisma_migrations order by finished_at;'
psql "$DATABASE_URL" -c 'show listen_addresses; show ssl;'
```

A tabela `_prisma_migrations` é a fonte da verdade sobre o que foi aplicado — o
repo ter a pasta da migration não significa que ela entrou no banco.

Última migration aplicada: `__________________________`

---

## O que o CI faz — e o que não faz

`.github/workflows/deploy.yml` tem **apenas** o trigger `workflow_dispatch`,
com `image_tag` obrigatória. Roda num runner self-hosted
(`[self-hosted, linux, portal-eadi]`), environment `production`.

| Job | Hoje |
|---|---|
| `quality` | roda: `pnpm typecheck`, `pnpm lint` e 4 arquivos de teste (`deploy.yml:62-66`). **Não roda `build`** nem os testes que exigem Postgres/RabbitMQ reais. |
| `build-images` | **nunca executa.** Tem `if: github.event_name == 'push'` (`:70`), e o workflow não aceita `push`. Logo o CI **não publica imagem no GHCR**. |
| `deploy` | só passa pelo braço `workflow_dispatch` + `build-images skipped` (`:138`), que força `DEPLOY_MODE=rollback` (`:146`) — e esse modo **pula a migration** (`:183-184`). |

> **Consequência operacional:** o pipeline **nunca aplica migration**. Toda
> migration nova só entra em produção pelo procedimento manual acima. Depois de
> commitar migration, confira `_prisma_migrations` no banco antes de considerar
> o deploy concluído.

Variables do repositório/environment: `GHCR_OWNER` (minúsculo), `PORTAL_HOST`,
`AVERBACAO_ATIVA`. Nenhum secret customizado.

---

## Rollback

### Aplicação

Pelo workflow, informando uma tag SHA já publicada em `image_tag`. O rollback
não reconstrói imagem e não executa migration:

```text
IMAGE_TAG=<sha-anterior>
docker compose pull
docker compose up -d --remove-orphans
healthcheck HTTPS /api/health
```

No deploy manual, o equivalente é `git checkout <sha-anterior>` seguido da
mesma sequência de build/up — sem o passo de migration.

### Banco

**Rollback de aplicação não é rollback de banco.** Migrations não são
revertidas automaticamente. Qualquer reversão de schema exige procedimento
separado e revisado, com backup antes. Uma versão antiga da aplicação contra um
banco já migrado pode funcionar ou falhar, dependendo da migration — avalie
caso a caso antes de voltar a tag.

### Homologação

`git checkout <sha-anterior>` → `build` → `up -d`, com o `-p` e o `-f` sempre
explícitos. Mesma ressalva sobre o banco.

---

## Riscos conhecidos

### Compartilhado entre produção e homologação

- **RabbitMQ — Aurora homolog ligado ao broker de produção.** Apurado em
  2026-10-07 no broker do `.85` (`rabbitmqctl list_connections`): o usuário
  `portal_aurora` conecta a partir de `172.20.210.87` — a homologação do Aurora
  — no vhost `/agendamento`, o mesmo onde o usuário `portal_cliente` consome as
  filas de produção sem sufixo. O env do Aurora homolog também aponta
  `PORTAL_CLIENTE_API_URL` para `https://portal-cliente.auroraeadi.com.br`. Ou
  seja, a homologação do Aurora conversava com a **produção** do Cliente.
  - **HTTP corrigido em 2026-10-07:** `PORTAL_CLIENTE_API_URL`/`_NEST_URL`/
    `_PUBLIC_URL` do Aurora homolog apontam para `https://172.20.210.87:8453`,
    com a `SERVICE_API_KEY` da homologação. O backend do Aurora confia no
    certificado autoassinado via bundle montado em
    `Portal-Aurora/docker/portal-cliente-hml/ca-bundle.pem`
    (`NODE_EXTRA_CA_CERTS`). **Regerar `docker/traefik/certs/homolog.crt`
    exige refazer esse bundle** e recriar o backend do Aurora.
  - **RabbitMQ corrigido em 2026-10-07:** antes da correção, o Aurora homolog
    publicou no broker de produção um lote de 37 DIs e desaverbações (19:27).
    Agora conecta no broker desta stack (`host.docker.internal:5672`, vhost
    `homologacao`, usuário `portal_aurora_hml`, exchanges `.hml`). Nada da
    homologação conecta mais no `.85`.
- **RabbitMQ — sufixo `.hml`.** Continua obrigatório em todas as filas e
  exchanges, mesmo com broker próprio: é a defesa se a stack for apontada por
  engano para um broker compartilhado. A conferência está no runbook (etapa
  2.4); a lista completa de variáveis vem de
  `portal-cliente-api/src/rabbitmq/rabbitmq.config.ts`.
- **SMTP.** Mesmo servidor. Homologação dispara e-mail de verdade: use apenas
  endereços de teste e não importe base de clientes real.

### Produção

- `/api/docs` (Swagger) está exposto sem autenticação (`src/main.ts:45`).
- `doc/CLAUDE.md:5` contém uma string de 32 caracteres aleatórios, em formato
  de segredo, num arquivo versionado — e portanto no histórico do git. Conferir
  se corresponde a algum segredo em uso e, em caso afirmativo, **rotacionar**:
  remover do arquivo não basta. O resto desse arquivo está obsoleto (descreve
  o Portal Aurora, SQL Server, JWT+Passport).
- Dois domínios conflitantes no repo: `portal-cliente.auroraeadi.com.br`
  (`.env.example:5`, `deploy.yml:23`) vs `portal-cliente.auroramanaus.com.br`
  (`README.md:203,272`). Um dos dois está errado na documentação.

---

## Dívida técnica registrada

| Item | Onde | Efeito |
|---|---|---|
| Pipeline nunca aplica migration | `deploy.yml:70,146,183-184` | migration só entra por procedimento manual |
| `prisma/seed.ts` quebrado | `prisma/seed.ts:19-29` | faz `user.create({ password })`, campo que saiu de `User` para `Account` na migration `20260915120000_better_auth_foundation`. **Não rode o seed**; use o bootstrap do primeiro admin. Também criaria 2 clientes e 5 DIs fictícios. |
| `DELETE /agendamento/janelas/:id` não existe | `src/janelas/janelas.controller.ts:1` importa `Delete` sem declarar a rota | o botão de excluir janela na tela de Configuração responde 404. `JanelasService.delete` já existe e faria soft-delete. Mantido fora de escopo de propósito: janela inativa para de gerar slot, e isso é efeito operacional novo. Desativar janela hoje é SQL: `update janelas_atendimento set ativo = false where id = '<id>'`. |
| `.githooks/pre-commit` nunca dispara | allowlist no caminho `prisma/postgres/migrations/`, inexistente | hook inócuo |
| Segunda conexão ao Postgres | `src/auth/better-auth.ts:26-27` abre `Pool`/`PrismaClient` próprios além do `PrismaService` | dobro de conexões |
| Bootstrap engole a causa do erro | `src/scripts/bootstrap-first-admin.ts:33-36` | imprime só "Falha ao criar o primeiro administrador", sem motivo |
| Sessão sem cache | `better-auth.ts:93` `cookieCache: { enabled: false }` | toda request bate no banco |
| `NEXT_PUBLIC_ENVIRONMENT` nunca chega ao bundle | lida em `Header.tsx:73` e `Login.tsx:52`, sem `ARG` em `frontend/Dockerfile` | atalhos de ambiente invisíveis em imagem Docker |
| Envs mortas injetadas | `PROTHEUS_API_KEY` (`docker-compose.yml:73`), `JWT_SECRET`, `DIRECT_URL`, `MINIO_EXTERNAL_*` | nenhum código as lê |
| Arquivos órfãos | `portal-cliente-api/test-db.js`, `railway.toml`, 3 scripts em `portal-cliente-api/scripts/` que fazem DDL em SQL cru | contrariam a regra de migration do `AGENTS.md` |
| 6 testes falhando na API | mocks sem o emitter de SSE introduzido em `709c5ba` | pré-existente, reproduzível em árvore limpa; não é regressão |
