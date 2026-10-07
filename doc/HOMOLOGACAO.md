# Homologação — subir na VM 172.20.210.87

Passo a passo para levantar a stack de homologação do Portal do Cliente. A
separação em relação à produção está em [AMBIENTES.md](AMBIENTES.md); leia a
seção de riscos antes do primeiro deploy.

> **A VM é compartilhada.** `172.20.210.87` já roda a homologação do Portal
> Aurora, que ocupa as portas **80, 443 e 9000** e a rede `aurora-network`. Por
> isso esta stack usa portas altas, rede e volumes próprios — e por isso todo
> comando leva `-p portal-cliente-hml` explícito. `--remove-orphans` sem
> project name alcança containers do outro projeto e derruba o Aurora.

Resumo do que sobe:

| Serviço | Container | Porta no host |
|---|---|---|
| Traefik | `traefik-cliente-hml` | **8090** (http, redireciona) e **8453** (https) |
| Frontend (Next.js) | `portal-cliente-frontend-hml` | nenhuma — via Traefik |
| API (NestJS) | `portal-cliente-api-hml` | nenhuma — via Traefik, prefixo `/api` |
| MinIO | `minio-cliente-hml` | nenhuma |
| Migration | `portal-cliente-migrate-hml` | job one-shot |

Postgres **não** entra na stack: roda no host da VM, banco `portal_cliente`,
alcançado pelos containers via `host.docker.internal`.

---

## Etapa 1 — Pré-requisitos na VM

### 1.1 Conferir que as portas estão livres

```sh
ss -lntp | grep -E ':(8090|8453)\b'     # tem de sair vazio
ss -lntp | grep -E ':(80|443|9000)\b'   # aqui aparece o Aurora: é o esperado
```

Se 8090 ou 8453 estiverem ocupadas, escolha outro par e ajuste
`HOMOLOG_HTTP_PORT` / `HOMOLOG_HTTPS_PORT` no `.env.homolog` **e** o `port:` do
redirect em `docker/traefik/traefik.homolog.yml`, que é estático.

### 1.2 Conferir que a subnet não colide

```sh
docker network ls -q | xargs docker network inspect \
  -f '{{.Name}} {{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

Se `172.31.240.0/24` já estiver em uso, troque o `subnet` em
`docker-compose.homolog.yml` e repita a regra do `pg_hba.conf` abaixo com a
faixa nova.

### 1.3 Criar role e banco no Postgres do host

```sh
sudo -u postgres psql -c "CREATE ROLE portal_cliente_hml LOGIN PASSWORD 'SENHA_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE portal_cliente OWNER portal_cliente_hml;"
```

### 1.4 Deixar o Postgres aceitar conexão dos containers

Os containers chegam pelo gateway do bridge, então o Postgres precisa escutar
nessa interface e autorizar a faixa da rede da stack.

Em `postgresql.conf`:

```conf
listen_addresses = '*'
```

Em `pg_hba.conf` — faixa específica, nunca `0.0.0.0/0`:

```conf
host    portal_cliente    portal_cliente_hml    172.31.240.0/24    scram-sha-256
```

```sh
sudo systemctl reload postgresql
```

### 1.5 Vhost do RabbitMQ

Criar um vhost de homologação com usuário próprio e permissão restrita a ele.
O broker é o mesmo da produção, e este é o único ponto onde a homologação pode
causar dano real:

```sh
rabbitmqctl add_vhost homologacao
rabbitmqctl add_user portal_cliente_hml 'SENHA_FORTE'
rabbitmqctl set_permissions -p homologacao portal_cliente_hml '.*' '.*' '.*'
```

### 1.6 Resto

- Firewall liberando 8090 e 8453 apenas para a rede interna.
- Credencial SMTP de homologação (dispara e-mail de verdade — só destinatário
  de teste).
- Docker e Docker Compose v2 instalados; o usuário no grupo `docker`.

---

## Etapa 2 — Clonar e configurar

```sh
git clone https://github.com/Aurora-EADI/Portal-Cliente.git
cd Portal-Cliente
git checkout <branch-ou-tag>
```

### 2.1 Criar o `.env.homolog`

> **Se já existir um `.env.homolog` na máquina, não o reaproveite.** Clones
> antigos carregam um `.env.homolog` da época em que este repo hospedava o
> Portal Aurora: ele aponta para `db:5432/aurora_homolog`, traz SQL Server e
> **não tem nenhuma `BETTER_AUTH_*` nem `SERVICE_API_KEY`**. Com ele a API nem
> sobe, e `docker compose config` passa sem reclamar — `env_file` não é
> validado. Mova para `.env.homolog.old` e comece do template.

```sh
[ -f .env.homolog ] && mv .env.homolog .env.homolog.old
cp .env.homolog.example .env.homolog
chmod 600 .env.homolog
```

Preencher todo `SUBSTITUA_ME`. Gere segredos **novos**, diferentes dos de
produção:

```sh
openssl rand -base64 32     # BETTER_AUTH_SECRET
openssl rand -base64 32     # BETTER_AUTH_PROVISIONING_SECRET
openssl rand -base64 32     # SERVICE_API_KEY
```

`BETTER_AUTH_SECRET` e `BETTER_AUTH_PROVISIONING_SECRET` são lidas no import do
better-auth: faltando, a API não sobe.

### 2.2 Gerar o certificado autoassinado

O SAN de IP é obrigatório — sem ele o navegador recusa antes de oferecer a
opção de prosseguir:

```sh
mkdir -p docker/traefik/certs
openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout docker/traefik/certs/homolog.key \
  -out   docker/traefik/certs/homolog.crt \
  -subj  "/CN=172.20.210.87" \
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"
chmod 600 docker/traefik/certs/homolog.key
```

HTTPS não é opcional aqui: com `NODE_ENV=production` o better-auth marca o
cookie de sessão como `Secure`, e sobre HTTP puro o navegador o descarta — o
login parece funcionar e a sessão não persiste.

### 2.3 Travas antes de subir

`docker compose config` valida a **interpolação**, não o `env_file`: um
`.env.homolog` incompleto passa pelo `config` e só falha no boot. Então
confira à mão.

**a) Variáveis sem as quais a API não sobe** — cada linha tem de aparecer:

```sh
for v in DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_PROVISIONING_SECRET \
         BETTER_AUTH_URL BETTER_AUTH_TRUSTED_ORIGINS CORS_ORIGIN \
         FRONTEND_URL SERVICE_API_KEY MINIO_ROOT_USER MINIO_ROOT_PASSWORD \
         MINIO_BUCKET_NAME HOMOLOG_HOST AVERBACAO_ATIVA; do
  grep -qE "^$v=.+" .env.homolog && echo "ok   $v" || echo "FALTA $v"
done
grep -n 'SUBSTITUA_ME' .env.homolog     # tem de sair vazio
```

**b) O banco é o da homologação**, não o de produção:

```sh
grep '^DATABASE_URL' .env.homolog | sed 's|://[^:]*:[^@]*@|://***:***@|'
# esperado: host.docker.internal:5432/portal_cliente — nunca 172.20.210.68
```

**c) Trava do RabbitMQ. A saída tem de ser vazia:**

```sh
grep -E '^RABBITMQ_(EXCHANGE|RETRY_EXCHANGE|DLX_EXCHANGE|COMMAND|DI_|AGENDAMENTO_|AVERBACAO_|GESTAO_|JANELA_|TRANSPORTADORAS_)' \
  .env.homolog | grep -v '\.hml$'
```

Qualquer linha que apareça é uma fila ou exchange sem sufixo — ou seja, a de
produção. Corrija antes de continuar.

Confirme também que o vhost no fim do `RABBITMQ_URL` é o de homologação:

```sh
grep '^RABBITMQ_URL' .env.homolog | sed 's|://[^:]*:[^@]*@|://***:***@|'
```

---

## Etapa 3 — Subir

O alias abaixo embute o project name e o arquivo de compose. Use-o em todos os
comandos desta etapa.

```sh
C="docker compose -p portal-cliente-hml -f docker-compose.homolog.yml --env-file .env.homolog"
```

```sh
# 1. Valida a interpolação antes de gastar tempo em build.
#    Erro de variável faltando aparece aqui.
$C config >/dev/null && echo OK

# 2. Build. O migrator está num profile, então precisa ser pedido à parte.
$C --profile migration build
$C build

# 3. Migration como job one-shot. Falha aqui encerra o procedimento:
#    não suba a aplicação com o schema desatualizado.
$C --profile migration run --rm migrate

# 4. Sobe a stack.
$C up -d --remove-orphans

# 5. Confere.
$C ps
```

Ordem importa: migration **antes** do `up`. A API não altera schema no boot, de
propósito.

---

## Etapa 4 — Primeiro deploy: popular o mínimo

Pular esta etapa deixa o portal de pé e inutilizável — sem admin não há login,
e sem janela de atendimento não há slot para agendar.

### 4.1 Primeiro administrador

A rotina não tem endpoint HTTP e só funciona com a tabela `users` **vazia**: com
qualquer usuário existente ela encerra sem criar nada. A senha não vai para
arquivo nem para argumento de comando.

```sh
read -r -p 'Nome do administrador: ' BOOTSTRAP_ADMIN_NAME
read -r -p 'E-mail do administrador: ' BOOTSTRAP_ADMIN_EMAIL
read -r -s -p 'Senha: ' BOOTSTRAP_ADMIN_PASSWORD
printf '\n'
export BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD

$C run --rm --no-deps \
  -e BOOTSTRAP_ADMIN_NAME \
  -e BOOTSTRAP_ADMIN_EMAIL \
  -e BOOTSTRAP_ADMIN_PASSWORD \
  portal-cliente-api node dist/scripts/bootstrap-first-admin.js

unset BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

Em caso de sucesso a saída é exatamente:

```text
Primeiro administrador criado com sucesso.
E-mail: <email-normalizado>
Role: ADMIN
```

Se falhar, a mensagem é genérica por limitação do script
(`src/scripts/bootstrap-first-admin.ts:33-36`). Causas usuais: base já tem
usuário, `DATABASE_URL` inacessível, `BETTER_AUTH_*` ausente. Diagnostique com
`$C logs portal-cliente-api` e com `psql -c 'select count(*) from users;'`.

> **Não rode `prisma db seed`.** O seed está quebrado desde a migration
> `20260915120000_better_auth_foundation` — faz `user.create({ password })`, e
> `password` saiu de `User` para `Account`. Além disso criaria 2 clientes e 5
> DIs fictícios.

### 4.2 Janela de atendimento

Logue como o admin criado e crie a janela pela tela de Configuração do módulo
de agendamento (`Agendamento → Configurações`). Sem janela, nenhum horário é
oferecido no wizard.

Se preferir pela API:

```sh
curl -k -X POST https://172.20.210.87:8453/api/agendamento/janelas \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{"descricao":"Comercial","horaInicio":"08:00","horaFim":"18:00","intervaloMinutos":60,"vagasSimultaneas":3}'
```

---

## Etapa 5 — Verificação

```sh
# Liveness: handler cru, sem dependência. 200 sempre que o processo está de pé.
curl -k https://172.20.210.87:8453/api/health

# Readiness: checa Postgres, MinIO e RabbitMQ. 503 "degraded" aponta qual caiu.
curl -k https://172.20.210.87:8453/api/health/ready

# Redirect http -> https na porta publicada.
curl -I http://172.20.210.87:8090/

# Migrations aplicadas no banco (fonte da verdade).
psql -h localhost -U portal_cliente_hml -d portal_cliente \
  -c 'select migration_name, finished_at from _prisma_migrations order by finished_at;'
```

Pelo navegador, aceitando o aviso do certificado autoassinado:

| Verificar | Como | Esperado |
|---|---|---|
| Login persiste | logar e dar F5 | continua logado. DevTools → Application → Cookies mostra `portal-cliente.session_token` com `Secure`. Se a sessão cair no F5, o acesso está em HTTP em vez de HTTPS |
| Roteamento | front na raiz, API em `/api` | nenhuma chamada da tela retorna 404/500 |
| Escopo do despachante | logar como despachante e cadastrar motorista | aparece só para ele |
| MinIO | subir e baixar PDF numa averbação | download funciona; `$C exec minio mc ls local/portal-cliente-hml` lista o objeto |
| SSE | dashboard aberto, alterar agendamento em outra aba | atualiza sem reload, sem reconexão em loop no console |
| E-mail | convidar usuário de teste | e-mail chega com link para `https://172.20.210.87:8453` |
| Aurora intacto | `curl -I http://172.20.210.87/` e `docker ps` | homologação do Aurora de pé em 80/443/9000 |

Se `AVERBACAO_ATIVA=true` não refletir na tela, é rebuild do frontend que
falta: `NEXT_PUBLIC_*` é inlinado no bundle em tempo de build.

---

## Atualizar depois

```sh
cd Portal-Cliente
git pull --ff-only

C="docker compose -p portal-cliente-hml -f docker-compose.homolog.yml --env-file .env.homolog"

$C config >/dev/null && echo OK
$C --profile migration build && $C build
$C --profile migration run --rm migrate
$C up -d --remove-orphans
$C ps
```

Se o `.env.homolog.example` mudou, compare com o seu `.env.homolog` e traga as
variáveis novas antes do `up`.

## Rollback

```sh
git checkout <sha-anterior>
$C --profile migration build && $C build
$C up -d --remove-orphans
```

Sem o passo de migration: **rollback de aplicação não é rollback de banco**.
Migration não é revertida automaticamente, e uma versão antiga contra um banco
já migrado pode falhar. Avalie antes de voltar.

## Derrubar

```sh
$C down                       # mantém o volume do MinIO
$C down -v                    # apaga também os arquivos do MinIO de homologação
```

Sempre com o `-p` e o `-f`. Um `docker compose down` solto nesse diretório é o
jeito mais rápido de derrubar a stack do Aurora por engano.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| API não sobe, log cita `BETTER_AUTH_SECRET` | variável ausente no `.env.homolog`; ela é lida no import e lança |
| Login funciona e cai no F5 | acesso por HTTP em vez de HTTPS: o cookie `Secure` é descartado |
| Navegador recusa o certificado sem opção de prosseguir | certificado gerado sem `subjectAltName=IP:` |
| Redirect da 8090 leva a uma página morta | `port:` do redirect em `traefik.homolog.yml` diferente da porta publicada |
| Tudo na tela responde 500 | `NEST_API_INTERNAL_URL` errado: o proxy do Next cai no default `localhost:3030` dentro do próprio container |
| Migration falha com erro de conexão | `listen_addresses`, regra do `pg_hba.conf` ou `extra_hosts`; confirme a faixa do bridge com `docker network inspect portalcliente_hml` |
| `/api/health/ready` em 503 mas o portal funciona | um dos três: Postgres, MinIO ou RabbitMQ. O corpo da resposta diz qual |
| Mensagem de integração não chega ao Aurora | fila sem sufixo `.hml`: a homologação consumiu a de produção. Rode a trava da etapa 2.3 |
| Containers do Aurora desapareceram | `--remove-orphans` sem `-p portal-cliente-hml` |
| Traefik não roteia nada | label `traefik.docker.network` tem de ser `portalcliente_hml`, e o provider do `traefik.homolog.yml` também |
