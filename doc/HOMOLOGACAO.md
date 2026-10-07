# Homologação — subir a stack

Passo a passo para levantar a stack de homologação do Portal do Cliente. A
separação em relação à produção está em [AMBIENTES.md](AMBIENTES.md); leia a
seção de riscos antes do primeiro deploy.

**O mesmo código roda nos dois sistemas operacionais.** Os containers são Linux
(`node:22-bookworm-slim`) independentemente do host, e nenhum arquivo
versionado é específico de SO: compose, Dockerfiles e configs do Traefik são
idênticos. O que muda são os comandos de preparo do **host** — e esta página dá
as duas variantes.

Hoje a homologação roda em `172.20.210.87`, que é **Windows**; a produção roda
em `172.20.210.68`, que é **Linux**.

> **A VM de homologação é compartilhada.** `172.20.210.87` já roda a
> homologação do Portal Aurora, que ocupa as portas **80, 443 e 9000** e a rede
> `aurora-network`. Por isso esta stack usa portas altas, rede e volumes
> próprios — e por isso os comandos passam por um wrapper que embute
> `-p portal-cliente-hml`. Um `docker compose up --remove-orphans` sem project
> name alcança containers do outro projeto e derruba o Aurora.

Resumo do que sobe:

| Serviço | Container | Porta no host |
|---|---|---|
| Traefik | `traefik-cliente-hml` | **8090** (http, redireciona) e **8453** (https) |
| Frontend (Next.js) | `portal-cliente-frontend-hml` | nenhuma — via Traefik |
| API (NestJS) | `portal-cliente-api-hml` | nenhuma — via Traefik, prefixo `/api` |
| MinIO | `minio-cliente-hml` | nenhuma |
| RabbitMQ | `rabbitmq-cliente-hml` | nenhuma — vhost `homologacao` |
| Migration | `portal-cliente-migrate-hml` | job one-shot |

Postgres **não** entra na stack: roda no host da VM, banco `portal_cliente`,
alcançado pelos containers via `host.docker.internal`.

O RabbitMQ **entra** na stack. O broker de `172.20.210.85` é o da produção, e
toda a homologação — Aurora e Cliente — roda na `.87`; nada da homologação
conecta no `.85`.

Branch: a homologação faz deploy de **`develop`**; produção, de `main`. Ver
[AMBIENTES.md](AMBIENTES.md#fluxo-de-branches).

---

## O wrapper

Todos os comandos Compose passam por um script que embute o project name, o
arquivo de compose e o `--env-file`:

| Host | Invocação |
|---|---|
| Linux / macOS | `./scripts/hml.sh` |
| Windows | `.\scripts\hml.ps1` |

Nos blocos adiante, **`hml`** representa a invocação do seu SO. Os argumentos
são os mesmos nos dois: tudo que você passa vai direto para o `docker compose`.

```sh
hml config --quiet
hml --profile migration build
hml up -d --remove-orphans
hml logs -f portal-cliente-api
```

Use sempre `config --quiet`: sem ele o `config` imprime o `env_file` inteiro
interpolado, com todos os segredos, na tela.

Se o PowerShell bloquear a execução do script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\hml.ps1 ps
```

Não chame `docker compose` direto neste diretório. O wrapper é a trava que
impede o `--remove-orphans` de alcançar a stack do Aurora.

---

## Etapa 1 — Pré-requisitos no host

### 1.1 Docker

```sh
docker version
docker compose version    # precisa ser v2
docker info --format '{{.OSType}} / {{.OperatingSystem}}'
```

`OSType` tem de ser `linux`. Num host Windows isso significa Docker Desktop com
backend WSL2 (ou Hyper-V); se vier `windows`, o daemon está em modo Windows
containers e as imagens deste projeto não rodam — troque antes de seguir.

### 1.2 Portas livres

As portas 8090 e 8453 têm de estar livres. Em `172.20.210.87`, 80/443/9000
aparecem ocupadas pelo Aurora: é o esperado, não mexa.

**Linux**

```sh
ss -lntp | grep -E ':(8090|8453)\b'       # tem de sair vazio
ss -lntp | grep -E ':(80|443|9000)\b'
```

**Windows**

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8090,8453 -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -LocalPort 80,443,9000 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
```

Se 8090 ou 8453 estiverem ocupadas, escolha outro par e ajuste
`HOMOLOG_HTTP_PORT` / `HOMOLOG_HTTPS_PORT` no `.env.homolog` **e** o `to:` do
redirect em `docker/traefik/traefik.homolog.yml`, que é estático.

### 1.3 Subnet livre

**Linux**

```sh
docker network ls -q | xargs docker network inspect \
  -f '{{.Name}} {{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

**Windows**

```powershell
docker network ls --format '{{.Name}}' | ForEach-Object {
  $n = $_
  $s = docker network inspect $n --format '{{range .IPAM.Config}}{{.Subnet}} {{end}}'
  "{0,-40} {1}" -f $n, $s
}
```

Se `172.31.240.0/24` já estiver em uso, troque o `subnet` em
`docker-compose.homolog.yml` e repita a regra do `pg_hba.conf` com a faixa nova.

### 1.4 Role e banco no Postgres

**Linux**

```sh
sudo -u postgres psql -c "CREATE ROLE portal_cliente_hml LOGIN PASSWORD 'SENHA_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE portal_cliente OWNER portal_cliente_hml;"
```

**Windows** — `psql` não entra no PATH na instalação padrão. Descubra a versão
e fixe os caminhos; estas variáveis voltam a ser usadas nas etapas 4 e 5, então
redefina se abrir outro shell:

```powershell
Get-Service postgresql* | Select-Object Name, Status
Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory | Select-Object Name

$PGVER  = '18'    # conforme o encontrado acima
$PGBIN  = "C:\Program Files\PostgreSQL\$PGVER\bin"
$PGDATA = "C:\Program Files\PostgreSQL\$PGVER\data"
$PGSVC  = "postgresql-x64-$PGVER"

& "$PGBIN\psql.exe" -U postgres -c "CREATE ROLE portal_cliente_hml LOGIN PASSWORD 'SENHA_FORTE';"
& "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE portal_cliente OWNER portal_cliente_hml;"
```

### 1.5 Postgres aceitando conexão dos containers

Os containers chegam pelo gateway do bridge do Docker, que no host é um
endereço distinto de `127.0.0.1`. O Postgres precisa escutar nessa interface e
autorizar a faixa da rede da stack.

Em `postgresql.conf`:

```conf
listen_addresses = '*'
```

Em `pg_hba.conf` — faixa específica, nunca `0.0.0.0/0`:

```conf
host    portal_cliente    portal_cliente_hml    172.31.240.0/24    scram-sha-256
```

Mudança no `pg_hba.conf` precisa só de reload; `listen_addresses` exige
restart.

**Linux**

```sh
sudo systemctl reload postgresql
sudo systemctl restart postgresql      # se mexeu em listen_addresses
ss -lntp | grep ':5432'
```

**Windows**

```powershell
& "$PGBIN\pg_ctl.exe" reload -D "$PGDATA"
Restart-Service $PGSVC                 # se mexeu em listen_addresses
Get-NetTCPConnection -State Listen -LocalPort 5432 | Select-Object LocalAddress, LocalPort
```

### 1.6 Firewall

Liberar 8090 e 8453 apenas para a rede interna. A 5432 **não** precisa de regra
de entrada: o tráfego dos containers chega pela interface interna do Docker,
não pela rede física.

**Linux (ufw)**

```sh
sudo ufw allow from 172.20.210.0/24 to any port 8090,8453 proto tcp
```

**Windows**

```powershell
New-NetFirewallRule -DisplayName 'Portal Cliente HML (HTTP/HTTPS)' `
  -Direction Inbound -Protocol TCP -LocalPort 8090,8453 `
  -RemoteAddress 172.20.210.0/24 -Action Allow
```

### 1.7 RabbitMQ — nada a fazer no host

O broker é o serviço `rabbitmq` da própria stack. O compose cria o vhost
`homologacao` e o usuário `RABBITMQ_HML_USER` na primeira inicialização do
volume `rabbitmq_data_hml`, com a senha `RABBITMQ_HML_PASSWORD` do
`.env.homolog` (etapa 2.2).

> **Não use o broker de `172.20.210.85`.** É o da produção: o Portal do
> Cliente de produção consome ali, no vhost `/agendamento`, as filas sem
> sufixo. Nenhum comando desta página roda no `.85`.

Sem porta publicada: só a API da stack conecta. Integrar o Aurora homolog a
este broker exige publicar a 5672 (ou ligar o Aurora à rede
`portalcliente_hml`) — decisão à parte, ver "Problemas comuns".

### 1.8 SMTP

Credencial de homologação. Dispara e-mail de verdade: só destinatário de teste.

---

## Etapa 2 — Clonar e configurar

Escolha um diretório que **não** seja o da stack do Aurora.

```sh
git clone https://github.com/Aurora-EADI/Portal-Cliente.git
cd Portal-Cliente
git checkout develop
```

> Fim de linha não é problema: o `.gitattributes` só força LF nos `*.sh`, então
> num host Windows com `core.autocrlf=true` o resto vem em CRLF — mas o Compose
> v2 descarta o `\r` ao ler `env_file`, e os YAML montados nos containers
> toleram CRLF. Não converta nada.

### 2.1 Criar o `.env.homolog`

> **Se já existir um `.env.homolog`, não o reaproveite.** Clones antigos
> carregam um `.env.homolog` da época em que este repo hospedava o Portal
> Aurora: aponta para `db:5432/aurora_homolog`, traz SQL Server e **não tem
> nenhuma `BETTER_AUTH_*` nem `SERVICE_API_KEY`**. Com ele a API nem sobe, e
> `hml config` passa sem reclamar — `env_file` não é validado.

**Linux**

```sh
[ -f .env.homolog ] && mv .env.homolog .env.homolog.old
cp .env.homolog.example .env.homolog
chmod 600 .env.homolog
```

**Windows** — o equivalente do `chmod 600` é remover a herança de ACL:

```powershell
if (Test-Path .env.homolog) { Move-Item .env.homolog .env.homolog.old }
Copy-Item .env.homolog.example .env.homolog

# *S-1-5-32-544 é o SID do grupo de administradores locais. Usar o SID em vez
# do nome é obrigatório: num Windows em português o grupo chama-se
# "Administradores", e `BUILTIN\Administrators` falha com erro de mapeamento.
icacls .env.homolog /inheritance:r /grant:r "$($env:USERNAME):(R,W)" /grant:r '*S-1-5-32-544:(F)'
```

### 2.2 Gerar os segredos

Novos, diferentes dos de produção. `BETTER_AUTH_SECRET` e
`BETTER_AUTH_PROVISIONING_SECRET` são lidas no import do better-auth: faltando,
a API não sobe.

**Linux**

```sh
for i in 1 2 3; do openssl rand -base64 32; done
```

**Windows** — sem depender de openssl no PATH:

```powershell
# Compatível com Windows PowerShell 5.1: o overload estático
# RandomNumberGenerator::GetBytes(int) só existe no PowerShell 7+.
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
1..3 | ForEach-Object {
  $b = New-Object byte[] 32
  $rng.GetBytes($b)
  [Convert]::ToBase64String($b)
}
```

Um para `BETTER_AUTH_SECRET`, um para `BETTER_AUTH_PROVISIONING_SECRET`, um
para `SERVICE_API_KEY`. Preencha também todo o resto dos `SUBSTITUA_ME`.

`RABBITMQ_HML_PASSWORD` (e, por conveniência, `MINIO_ROOT_PASSWORD`) tem de ser
**só letras e números**: o compose a coloca dentro da `RABBITMQ_URL`, e base64
traz `/`, `+` e `=`, que quebram a URL.

**Linux**

```sh
openssl rand -hex 24
```

**Windows**

```powershell
$c   = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$b   = New-Object byte[] 32; $rng.GetBytes($b)
-join ($b | ForEach-Object { $c[$_ % $c.Length] })
```

### 2.3 Gerar o certificado autoassinado

O SAN de IP é obrigatório — sem ele o navegador recusa antes de oferecer a
opção de prosseguir.

**Linux**

```sh
mkdir -p docker/traefik/certs
openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout docker/traefik/certs/homolog.key \
  -out    docker/traefik/certs/homolog.crt \
  -subj   "/CN=172.20.210.87" \
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"
chmod 600 docker/traefik/certs/homolog.key
```

**Windows** — `openssl` não vem no PATH, mas o Git for Windows o traz:

```powershell
New-Item -ItemType Directory -Force docker\traefik\certs | Out-Null
$OPENSSL = 'C:\Program Files\Git\usr\bin\openssl.exe'

& $OPENSSL req -x509 -newkey rsa:2048 -nodes -days 825 `
  -keyout docker/traefik/certs/homolog.key `
  -out    docker/traefik/certs/homolog.crt `
  -subj   "/CN=172.20.210.87" `
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"

icacls docker\traefik\certs\homolog.key /inheritance:r /grant:r "$($env:USERNAME):(R)" /grant:r '*S-1-5-32-544:(F)'
```

Se o Git não estiver nesse caminho, gere dentro de um container — serve nos
dois SOs e não acrescenta dependência:

```sh
docker run --rm -v "$PWD/docker/traefik/certs:/certs" alpine/openssl \
  req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout /certs/homolog.key -out /certs/homolog.crt \
  -subj "/CN=172.20.210.87" \
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"
```

Confirmar que o SAN de IP entrou:

```sh
openssl x509 -in docker/traefik/certs/homolog.crt -noout -text | grep -A1 'Alternative Name'
```

HTTPS não é opcional: com `NODE_ENV=production` o better-auth marca o cookie de
sessão como `Secure`, e sobre HTTP puro o navegador o descarta — o login parece
funcionar e a sessão não persiste.

### 2.4 Travas antes de subir

O `hml config` barra parte dos erros sozinho: as variáveis que o compose
interpola (`HOMOLOG_HOST`, `API_URL`, `FRONTEND_URL`, `MINIO_ROOT_USER`,
`MINIO_ROOT_PASSWORD`, `RABBITMQ_HML_PASSWORD`) estão declaradas com `:?`, então faltando qualquer uma
ele encerra com erro em vez de gerar um `Host()` vazio que não casa nada. Com o
`.env.homolog` antigo do Aurora a saída é exatamente:

```text
error while interpolating services.portal-cliente-api.labels.[]:
required variable HOMOLOG_HOST is missing a value: HOMOLOG_HOST e obrigatorio
```

O que o `config` **não** valida é o `env_file`: as variáveis lidas direto pela
aplicação (`DATABASE_URL`, `BETTER_AUTH_*`, `SERVICE_API_KEY`, as filas) passam
batido e só falham no boot. Essas confira à mão.

**Linux**

```sh
# a) Variáveis sem as quais a API não sobe
for v in DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_PROVISIONING_SECRET \
         BETTER_AUTH_URL BETTER_AUTH_TRUSTED_ORIGINS CORS_ORIGIN \
         FRONTEND_URL SERVICE_API_KEY MINIO_ROOT_USER MINIO_ROOT_PASSWORD \
         MINIO_BUCKET_NAME HOMOLOG_HOST AVERBACAO_ATIVA RABBITMQ_HML_PASSWORD; do
  grep -qE "^$v=.+" .env.homolog && echo "ok    $v" || echo "FALTA $v"
done
grep -n '=.*SUBSTITUA_ME' .env.homolog       # tem de sair vazio

# b) O banco é o da homologação
grep '^DATABASE_URL' .env.homolog | sed 's|://[^:]*:[^@]*@|://***:***@|'

# c) Trava do RabbitMQ — tem de sair vazio
grep -E '^RABBITMQ_(EXCHANGE|RETRY_EXCHANGE|DLX_EXCHANGE|COMMAND|DI_|AGENDAMENTO_|AVERBACAO_|GESTAO_|JANELA_|TRANSPORTADORAS_)' \
  .env.homolog | grep -v '\.hml$'
```

**Windows**

```powershell
# a) Variáveis sem as quais a API não sobe
$obrig = @(
  'DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_PROVISIONING_SECRET',
  'BETTER_AUTH_URL','BETTER_AUTH_TRUSTED_ORIGINS','CORS_ORIGIN',
  'FRONTEND_URL','SERVICE_API_KEY','MINIO_ROOT_USER','MINIO_ROOT_PASSWORD',
  'MINIO_BUCKET_NAME','HOMOLOG_HOST','AVERBACAO_ATIVA','RABBITMQ_HML_PASSWORD'
)
$env_hml = Get-Content .env.homolog
foreach ($v in $obrig) { if ($env_hml -match "^$v=.+") { "ok    $v" } else { "FALTA $v" } }
Select-String -Path .env.homolog -Pattern '=.*SUBSTITUA_ME'   # tem de sair vazio

# b) O banco é o da homologação
(Select-String -Path .env.homolog -Pattern '^DATABASE_URL').Line -replace '://[^:]*:[^@]*@','://***:***@'

# c) Trava do RabbitMQ — tem de sair vazio
Select-String -Path .env.homolog `
  -Pattern '^RABBITMQ_(EXCHANGE|RETRY_EXCHANGE|DLX_EXCHANGE|COMMAND|DI_|AGENDAMENTO_|AVERBACAO_|GESTAO_|JANELA_|TRANSPORTADORAS_)' |
  Where-Object { $_.Line -notmatch '\.hml$' }
```

Em (b), o esperado é `host.docker.internal:5432/portal_cliente` — **nunca**
`172.20.210.68`.

O padrão `=.*SUBSTITUA_ME` olha só os valores: o comentário do topo do
template cita a palavra e faria um `SUBSTITUA_ME` puro acusar sempre.

Em (c), qualquer linha que apareça é uma fila ou exchange sem sufixo, isto é,
o nome usado pela produção. Com o broker próprio da stack isso não alcança a
produção, mas o sufixo é a defesa para o dia em que a stack for apontada por
engano para um broker compartilhado. Corrija antes de continuar.

---

## Etapa 3 — Subir

Daqui em diante os comandos são iguais nos dois SOs — só a invocação do wrapper
muda (`./scripts/hml.sh` ou `.\scripts\hml.ps1`).

```sh
# 1. Valida a interpolação antes de gastar tempo em build.
hml config --quiet

# 2. Build. O migrator está num profile, então precisa ser pedido à parte.
hml --profile migration build
hml build

# 3. Migration como job one-shot. Falha aqui encerra o procedimento:
#    não suba a aplicação com o schema desatualizado.
hml --profile migration run --rm migrate

# 4. Sobe a stack.
hml up -d --remove-orphans

# 5. Confere.
hml ps
```

Ordem importa: migration **antes** do `up`. A API não altera schema no boot, de
propósito.

> O build do frontend é o passo mais pesado. Se a VM tiver pouca RAM livre,
> rode `hml build portal-cliente-api` e `hml build frontend` em separado.

---

## Etapa 4 — Primeiro deploy: popular o mínimo

Pular esta etapa deixa o portal de pé e inutilizável — sem admin não há login,
e sem janela de atendimento não há slot para agendar.

### 4.1 Primeiro administrador

A rotina não tem endpoint HTTP e só funciona com a tabela `users` **vazia**: com
qualquer usuário existente ela encerra sem criar nada. A senha não vai para
arquivo nem para argumento de comando — `-e VAR` sem valor manda a variável do
ambiente do shell.

**Linux**

```sh
read -r -p 'Nome do administrador: ' BOOTSTRAP_ADMIN_NAME
read -r -p 'E-mail do administrador: ' BOOTSTRAP_ADMIN_EMAIL
read -r -s -p 'Senha: ' BOOTSTRAP_ADMIN_PASSWORD
printf '\n'
export BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD

hml run --rm --no-deps \
  -e BOOTSTRAP_ADMIN_NAME -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD \
  portal-cliente-api node dist/scripts/bootstrap-first-admin.js

unset BOOTSTRAP_ADMIN_NAME BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

**Windows**

```powershell
$env:BOOTSTRAP_ADMIN_NAME  = Read-Host 'Nome do administrador'
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$sec = Read-Host 'Senha' -AsSecureString
$env:BOOTSTRAP_ADMIN_PASSWORD =
  [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

.\scripts\hml.ps1 run --rm --no-deps `
  -e BOOTSTRAP_ADMIN_NAME -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD `
  portal-cliente-api node dist/scripts/bootstrap-first-admin.js

Remove-Item Env:\BOOTSTRAP_ADMIN_NAME, Env:\BOOTSTRAP_ADMIN_EMAIL, Env:\BOOTSTRAP_ADMIN_PASSWORD
Remove-Variable sec
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
`hml logs portal-cliente-api` e contando os usuários no banco.

> **Não rode `prisma db seed`.** O seed está quebrado desde a migration
> `20260915120000_better_auth_foundation` — faz `user.create({ password })`, e
> `password` saiu de `User` para `Account`. Além disso criaria 2 clientes e 5
> DIs fictícios.

### 4.2 Janela de atendimento

Logue como o admin criado e crie a janela pela tela de Configuração do módulo
de agendamento (`Agendamento → Configurações`). Sem janela, nenhum horário é
oferecido no wizard.

---

## Etapa 5 — Verificação

```sh
curl -k https://172.20.210.87:8453/api/health        # 200 {"status":"ok"}
curl -k https://172.20.210.87:8453/api/health/ready  # 200 ok, ou 503 degraded
curl -I http://172.20.210.87:8090/                   # redirect para a 8453
```

No Windows use `curl.exe` (vem no Windows 10/11 e Server 2019+).
`Invoke-WebRequest` valida o certificado e falha com o autoassinado, e o
Windows PowerShell 5.1 não tem `-SkipCertificateCheck`.

`/api/health` é handler cru, sem dependência: responde 200 sempre que o
processo está de pé. `/api/health/ready` checa Postgres, MinIO e RabbitMQ, e o
corpo do 503 diz qual caiu.

Broker da stack — a API conectada no vhost `homologacao` e as filas `.hml`
declaradas:

```sh
hml exec rabbitmq rabbitmqctl -q list_connections user vhost
hml exec rabbitmq rabbitmqctl -q list_queues -p homologacao name consumers
```

Migrations aplicadas no banco — fonte da verdade, mais confiável que a pasta do
repo. Dá para consultar de dentro do container, sem depender do `psql` do host:

```sh
hml exec portal-cliente-api node -e "const{PrismaClient}=require('@prisma/client');const{PrismaPg}=require('@prisma/adapter-pg');const p=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});p.\$queryRawUnsafe('select migration_name,finished_at from _prisma_migrations order by finished_at').then(r=>console.table(r)).finally(()=>p.\$disconnect())"
```

Pelo navegador, aceitando o aviso do certificado autoassinado:

| Verificar | Como | Esperado |
|---|---|---|
| Login persiste | logar e dar F5 | continua logado. DevTools → Application → Cookies mostra `portal-cliente.session_token` com `Secure`. Se a sessão cair no F5, o acesso está em HTTP em vez de HTTPS |
| Roteamento | front na raiz, API em `/api` | nenhuma chamada da tela retorna 404/500 |
| Escopo do despachante | logar como despachante e cadastrar motorista | aparece só para ele |
| MinIO | subir e baixar PDF numa averbação | download funciona; `hml exec minio mc ls local/portal-cliente-hml` lista o objeto |
| SSE | dashboard aberto, alterar agendamento em outra aba | atualiza sem reload, sem reconexão em loop no console |
| E-mail | convidar usuário de teste | e-mail chega com link para `https://172.20.210.87:8453` |
| Aurora intacto | `curl -I http://172.20.210.87/` e `docker ps` | homologação do Aurora de pé em 80/443/9000 |

Se `AVERBACAO_ATIVA=true` não refletir na tela, é rebuild do frontend que
falta: `NEXT_PUBLIC_*` é inlinado no bundle em tempo de build.

---

## Atualizar depois

```sh
git pull --ff-only          # na branch develop

hml config --quiet
hml --profile migration build
hml build
hml --profile migration run --rm migrate
hml up -d --remove-orphans
hml ps
```

Se o `.env.homolog.example` mudou, traga as variáveis novas antes do `up`:

```sh
# Linux
diff <(grep -oE '^[A-Z_]+' .env.homolog.example | sort) \
     <(grep -oE '^[A-Z_]+' .env.homolog         | sort)
```

```powershell
# Windows
$novas  = (Select-String .env.homolog.example -Pattern '^[A-Z_]+=').Matches.Value
$atuais = (Select-String .env.homolog         -Pattern '^[A-Z_]+=').Matches.Value
Compare-Object $novas $atuais
```

## Rollback

```sh
git checkout <sha-anterior>
hml --profile migration build
hml build
hml up -d --remove-orphans
```

Sem o passo de migration: **rollback de aplicação não é rollback de banco**.
Migration não é revertida automaticamente, e uma versão antiga contra um banco
já migrado pode falhar. Avalie antes de voltar.

## Derrubar

```sh
hml down          # mantém os volumes do MinIO e do RabbitMQ
hml down -v       # apaga também os volumes do MinIO e do RabbitMQ de homologação
```

Sempre pelo wrapper. Um `docker compose down` solto nesse diretório é o jeito
mais rápido de derrubar a stack do Aurora por engano.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `docker info` mostra `OSType: windows` | daemon em modo Windows containers; as imagens deste projeto são Linux |
| `hml.ps1` não executa | política de execução: `powershell -ExecutionPolicy Bypass -File .\scripts\hml.ps1 ...` |
| `hml.sh` dá "Permission denied" | `chmod +x scripts/hml.sh`, ou chame via `sh ./scripts/hml.sh` |
| API não sobe, log cita `BETTER_AUTH_SECRET` | variável ausente no `.env.homolog`; ela é lida no import e lança |
| Login funciona e cai no F5 | acesso por HTTP em vez de HTTPS: o cookie `Secure` é descartado |
| Navegador recusa o certificado sem opção de prosseguir | certificado gerado sem `subjectAltName=IP:` |
| `Invoke-WebRequest` falha no certificado | esperado com autoassinado; use `curl.exe -k` |
| Redirect da 8090 leva a uma página morta | `to:` do redirect em `traefik.homolog.yml` diferente da porta publicada |
| Tudo na tela responde 500 | `NEST_API_INTERNAL_URL` errado: o proxy do Next cai no default `localhost:3030` dentro do próprio container |
| Migration falha com erro de conexão | `listen_addresses`, regra do `pg_hba.conf`, ou firewall bloqueando a interface do Docker. Confirme a faixa com `docker network inspect portalcliente_hml` e que a 5432 escuta em todas as interfaces |
| `host.docker.internal` não resolve no container | em Docker Desktop é nativo; o `extra_hosts: host-gateway` do compose é a garantia de paridade no Linux. Teste: `hml exec portal-cliente-api getent hosts host.docker.internal` |
| `/api/health/ready` em 503 mas o portal funciona | um dos três: Postgres, MinIO ou RabbitMQ. O corpo da resposta diz qual |
| Mensagem de integração não chega ao Aurora | o Aurora homolog ainda aponta para o broker de produção (`172.20.210.85`) ou não alcança o broker desta stack, que não publica porta. Integrar exige publicar a 5672 (ou ligar o Aurora à rede `portalcliente_hml`), reapontar o Aurora homolog para o vhost `homologacao` e usar as filas `.hml` dos dois lados |
| API loga `RabbitMQ reconectará` em loop | broker da stack fora do ar ou credencial diferente da gravada no volume: usuário/senha só valem na primeira inicialização de `rabbitmq_data_hml`. Ver `hml logs rabbitmq` |
| `up` falha com `401 UNAUTHORIZED` ao baixar `quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z` | a tag não está mais disponível publicamente (nem no quay.io nem no Docker Hub). Se a máquina já tiver a imagem com outro nome, confira que é a mesma release — `docker run --rm --entrypoint minio <id> --version` — e dê a ela a tag esperada: `docker tag <id> quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z`. Em host limpo, a imagem tem de vir de um mirror |
| Traefik loga `Error response from daemon: ""` no provider docker | Traefik antigo demais para o Docker Engine 29 (API mínima 1.40). O compose fixa `traefik:v3.6`; não volte para v3.1 |
| Traefik reinicia com `field not found, node: port` | campo `port` no redirect do `traefik.homolog.yml`, que o v3 não tem. A porta vai no `to:` (`to: ":8453"`) |
| Containers do Aurora desapareceram | `docker compose --remove-orphans` chamado sem o wrapper |
| Traefik não roteia nada | label `traefik.docker.network` tem de ser `portalcliente_hml`, e o provider do `traefik.homolog.yml` também |
| Build do frontend morre sem mensagem | memória: rode os builds em separado. No Windows, aumente a RAM do WSL2 em `%USERPROFILE%\.wslconfig` |
