# Homologação — subir na VM 172.20.210.87 (Windows)

Passo a passo para levantar a stack de homologação do Portal do Cliente. A
separação em relação à produção está em [AMBIENTES.md](AMBIENTES.md); leia a
seção de riscos antes do primeiro deploy.

> **A VM é Windows.** Os comandos aqui são PowerShell. O host é Windows, mas os
> containers são Linux (`node:22-bookworm-slim`) — então tudo que roda *dentro*
> do container segue sendo Linux. A produção, na `172.20.210.68`, é Linux: não
> copie comando de um doc para o outro.

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

Postgres **não** entra na stack: roda como serviço do Windows na própria VM,
banco `portal_cliente`, alcançado pelos containers via `host.docker.internal`.

---

## Etapa 1 — Pré-requisitos na VM

### 1.1 Conferir o Docker

```powershell
docker version
docker compose version          # precisa ser v2
docker info --format '{{.OSType}} / {{.OperatingSystem}} / {{.Driver}}'
```

`OSType` tem de ser `linux` (containers Linux via WSL2 ou Hyper-V). Se vier
`windows`, o daemon está em modo Windows containers e as imagens deste projeto
não rodam — troque para Linux containers antes de seguir.

### 1.2 Conferir que as portas estão livres

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8090,8453 -ErrorAction SilentlyContinue
# tem de não retornar nada

Get-NetTCPConnection -State Listen -LocalPort 80,443,9000 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
# aqui aparece o Aurora homolog: é o esperado, não mexa
```

Se 8090 ou 8453 estiverem ocupadas, escolha outro par e ajuste
`HOMOLOG_HTTP_PORT` / `HOMOLOG_HTTPS_PORT` no `.env.homolog` **e** o `port:` do
redirect em `docker/traefik/traefik.homolog.yml`, que é estático.

### 1.3 Conferir que a subnet não colide

```powershell
docker network ls --format '{{.Name}}' | ForEach-Object {
  $n = $_
  $s = docker network inspect $n --format '{{range .IPAM.Config}}{{.Subnet}} {{end}}'
  "{0,-40} {1}" -f $n, $s
}
```

Se `172.31.240.0/24` já estiver em uso, troque o `subnet` em
`docker-compose.homolog.yml` e repita a regra do `pg_hba.conf` abaixo com a
faixa nova.

### 1.4 Criar role e banco no Postgres

O `psql` não está no PATH na instalação padrão do Windows. Localize a versão:

```powershell
Get-Service postgresql* | Select-Object Name, Status
Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory | Select-Object Name
```

Fixe os caminhos conforme a versão encontrada (exemplo com a 18). Estas três
variáveis são usadas também nas etapas 4 e 5 — se abrir um shell novo, defina
de novo:

```powershell
$PGVER  = '18'
$PGBIN  = "C:\Program Files\PostgreSQL\$PGVER\bin"
$PGDATA = "C:\Program Files\PostgreSQL\$PGVER\data"
$PGSVC  = "postgresql-x64-$PGVER"

& "$PGBIN\psql.exe" -U postgres -c "CREATE ROLE portal_cliente_hml LOGIN PASSWORD 'SENHA_FORTE';"
& "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE portal_cliente OWNER portal_cliente_hml;"
```

### 1.5 Deixar o Postgres aceitar conexão dos containers

Os containers chegam pelo gateway do bridge do Docker, que no host é um
endereço distinto de `127.0.0.1`. Então o Postgres precisa escutar nessa
interface e autorizar a faixa da rede da stack.

Em `$PGDATA\postgresql.conf`:

```conf
listen_addresses = '*'
```

Em `$PGDATA\pg_hba.conf` — faixa específica, nunca `0.0.0.0/0`:

```conf
host    portal_cliente    portal_cliente_hml    172.31.240.0/24    scram-sha-256
```

Recarregar (não precisa reiniciar para mudança no `pg_hba.conf`; mudança em
`listen_addresses` exige restart):

```powershell
& "$PGBIN\pg_ctl.exe" reload -D "$PGDATA"
# depois de mexer em listen_addresses:
Restart-Service $PGSVC
```

Confirme que subiu escutando em todas as interfaces:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5432 | Select-Object LocalAddress, LocalPort
```

### 1.6 Firewall do Windows

Liberar 8090 e 8453 apenas para a rede interna:

```powershell
New-NetFirewallRule -DisplayName 'Portal Cliente HML (HTTP/HTTPS)' `
  -Direction Inbound -Protocol TCP -LocalPort 8090,8453 `
  -RemoteAddress 172.20.210.0/24 -Action Allow
```

A porta 5432 **não** precisa de regra de entrada: o tráfego dos containers
chega pela interface interna do Docker, não pela rede física.

### 1.7 Vhost do RabbitMQ

> O broker é **externo** à VM — não roda na `.87`. Estes comandos vão no host
> do RabbitMQ, ou pelo Management UI.

```sh
rabbitmqctl add_vhost homologacao
rabbitmqctl add_user portal_cliente_hml 'SENHA_FORTE'
rabbitmqctl set_permissions -p homologacao portal_cliente_hml '.*' '.*' '.*'
```

É o mesmo broker da produção, e o único ponto onde a homologação pode causar
dano real — ver a trava na etapa 2.3.

### 1.8 Credencial SMTP

De homologação. Dispara e-mail de verdade: só destinatário de teste.

---

## Etapa 2 — Clonar e configurar

Escolha um diretório que **não** seja o da stack do Aurora. Por convenção da
VM, algo como `C:\Users\administrator\Documents\Portal-Cliente`.

```powershell
git clone https://github.com/Aurora-EADI/Portal-Cliente.git
Set-Location Portal-Cliente
git checkout <branch-ou-tag>
```

> Sobre fim de linha: o repo não tem `.gitattributes`, então com
> `core.autocrlf=true` os arquivos vêm em CRLF. Isso **não** é problema — o
> Compose v2 descarta o `\r` ao ler `env_file`, e os YAML montados nos
> containers toleram CRLF. Não precisa converter nada.

### 2.1 Criar o `.env.homolog`

> **Se já existir um `.env.homolog`, não o reaproveite.** Clones antigos
> carregam um `.env.homolog` da época em que este repo hospedava o Portal
> Aurora: aponta para `db:5432/aurora_homolog`, traz SQL Server e **não tem
> nenhuma `BETTER_AUTH_*` nem `SERVICE_API_KEY`**. Com ele a API nem sobe, e
> `docker compose config` passa sem reclamar — `env_file` não é validado.

```powershell
if (Test-Path .env.homolog) { Move-Item .env.homolog .env.homolog.old }
Copy-Item .env.homolog.example .env.homolog
```

Restringir a leitura do arquivo (equivalente ao `chmod 600`): remover herança e
deixar só o dono e os administradores.

```powershell
# *S-1-5-32-544 é o SID do grupo de administradores locais. Usar o SID em vez
# do nome é obrigatório: num Windows em português o grupo chama-se
# "Administradores", e `BUILTIN\Administrators` falha com erro de mapeamento.
icacls .env.homolog /inheritance:r /grant:r "$($env:USERNAME):(R,W)" /grant:r '*S-1-5-32-544:(F)'
```

Preencher todo `SUBSTITUA_ME`. Gere segredos **novos**, diferentes dos de
produção — sem depender de openssl no host:

```powershell
# Compatível com Windows PowerShell 5.1: o overload estático
# RandomNumberGenerator::GetBytes(int) só existe no PowerShell 7+.
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
1..3 | ForEach-Object {
  $b = New-Object byte[] 32
  $rng.GetBytes($b)
  [Convert]::ToBase64String($b)
}
# um para BETTER_AUTH_SECRET, um para BETTER_AUTH_PROVISIONING_SECRET,
# um para SERVICE_API_KEY
```

`BETTER_AUTH_SECRET` e `BETTER_AUTH_PROVISIONING_SECRET` são lidas no import do
better-auth: faltando, a API não sobe.

### 2.2 Gerar o certificado autoassinado

O SAN de IP é obrigatório — sem ele o navegador recusa antes de oferecer a
opção de prosseguir.

`openssl` não vem no PATH do Windows, mas o Git for Windows o traz:

```powershell
New-Item -ItemType Directory -Force docker\traefik\certs | Out-Null
$OPENSSL = 'C:\Program Files\Git\usr\bin\openssl.exe'

& $OPENSSL req -x509 -newkey rsa:2048 -nodes -days 825 `
  -keyout docker/traefik/certs/homolog.key `
  -out    docker/traefik/certs/homolog.crt `
  -subj   "/CN=172.20.210.87" `
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"
```

Se o Git não estiver nesse caminho, gere dentro de um container — o Docker já
está na VM, então não há dependência nova:

```powershell
docker run --rm -v "${PWD}/docker/traefik/certs:/certs" alpine/openssl `
  req -x509 -newkey rsa:2048 -nodes -days 825 `
  -keyout /certs/homolog.key -out /certs/homolog.crt `
  -subj "/CN=172.20.210.87" `
  -addext "subjectAltName=IP:172.20.210.87,DNS:localhost"
```

Proteger a chave privada:

```powershell
icacls docker\traefik\certs\homolog.key /inheritance:r /grant:r "$($env:USERNAME):(R)" /grant:r '*S-1-5-32-544:(F)'
```

Confirmar que o SAN de IP entrou:

```powershell
& $OPENSSL x509 -in docker/traefik/certs/homolog.crt -noout -text |
  Select-String -Pattern 'Subject Alternative Name' -Context 0,1
```

HTTPS não é opcional aqui: com `NODE_ENV=production` o better-auth marca o
cookie de sessão como `Secure`, e sobre HTTP puro o navegador o descarta — o
login parece funcionar e a sessão não persiste.

### 2.3 Travas antes de subir

`docker compose config` valida a **interpolação**, não o `env_file`: um
`.env.homolog` incompleto passa pelo `config` e só falha no boot. Confira à mão.

**a) Variáveis sem as quais a API não sobe** — nenhuma pode sair como `FALTA`:

```powershell
$obrig = @(
  'DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_PROVISIONING_SECRET',
  'BETTER_AUTH_URL','BETTER_AUTH_TRUSTED_ORIGINS','CORS_ORIGIN',
  'FRONTEND_URL','SERVICE_API_KEY','MINIO_ROOT_USER','MINIO_ROOT_PASSWORD',
  'MINIO_BUCKET_NAME','HOMOLOG_HOST','AVERBACAO_ATIVA'
)
$env_hml = Get-Content .env.homolog
foreach ($v in $obrig) {
  if ($env_hml -match "^$v=.+") { "ok    $v" } else { "FALTA $v" }
}

# Nenhum placeholder esquecido — tem de não retornar nada:
Select-String -Path .env.homolog -Pattern 'SUBSTITUA_ME'
```

**b) O banco é o da homologação**, não o de produção:

```powershell
(Select-String -Path .env.homolog -Pattern '^DATABASE_URL').Line -replace '://[^:]*:[^@]*@','://***:***@'
# esperado: host.docker.internal:5432/portal_cliente — nunca 172.20.210.68
```

**c) Trava do RabbitMQ. Tem de não retornar nada:**

```powershell
Select-String -Path .env.homolog `
  -Pattern '^RABBITMQ_(EXCHANGE|RETRY_EXCHANGE|DLX_EXCHANGE|COMMAND|DI_|AGENDAMENTO_|AVERBACAO_|GESTAO_|JANELA_|TRANSPORTADORAS_)' |
  Where-Object { $_.Line -notmatch '\.hml$' }
```

Qualquer linha que apareça é uma fila ou exchange sem sufixo — ou seja, a de
produção. Sem o sufixo, esta stack declara e **consome** a fila de produção, e
a mensagem não chega ao consumidor real. Corrija antes de continuar.

Confirme também que o vhost no fim do `RABBITMQ_URL` é o de homologação:

```powershell
(Select-String -Path .env.homolog -Pattern '^RABBITMQ_URL').Line -replace '://[^:]*:[^@]*@','://***:***@'
```

---

## Etapa 3 — Subir

O array abaixo embute o project name e o arquivo de compose. Em PowerShell ele
é expandido com `@C` (splat). Use em todos os comandos desta etapa — **não**
chame `docker compose` solto neste diretório.

```powershell
$C = @('compose','-p','portal-cliente-hml','-f','docker-compose.homolog.yml','--env-file','.env.homolog')
```

```powershell
# 1. Valida a interpolação antes de gastar tempo em build.
docker @C config | Out-Null; if ($?) { 'OK' }

# 2. Build. O migrator está num profile, então precisa ser pedido à parte.
docker @C --profile migration build
docker @C build

# 3. Migration como job one-shot. Falha aqui encerra o procedimento:
#    não suba a aplicação com o schema desatualizado.
docker @C --profile migration run --rm migrate

# 4. Sobe a stack.
docker @C up -d --remove-orphans

# 5. Confere.
docker @C ps
```

Ordem importa: migration **antes** do `up`. A API não altera schema no boot, de
propósito.

> O build do frontend é o passo mais pesado (Next.js em container). Se a VM
> tiver pouca RAM livre, rode `docker @C build portal-cliente-api` e
> `docker @C build frontend` em separado.

---

## Etapa 4 — Primeiro deploy: popular o mínimo

Pular esta etapa deixa o portal de pé e inutilizável — sem admin não há login,
e sem janela de atendimento não há slot para agendar.

### 4.1 Primeiro administrador

A rotina não tem endpoint HTTP e só funciona com a tabela `users` **vazia**: com
qualquer usuário existente ela encerra sem criar nada. A senha não vai para
arquivo nem para argumento de comando — `-e VAR` sem valor manda a variável do
ambiente do shell.

```powershell
$env:BOOTSTRAP_ADMIN_NAME  = Read-Host 'Nome do administrador'
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$sec = Read-Host 'Senha' -AsSecureString
$env:BOOTSTRAP_ADMIN_PASSWORD =
  [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

docker @C run --rm --no-deps `
  -e BOOTSTRAP_ADMIN_NAME `
  -e BOOTSTRAP_ADMIN_EMAIL `
  -e BOOTSTRAP_ADMIN_PASSWORD `
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
`docker @C logs portal-cliente-api` e com:

```powershell
& "$PGBIN\psql.exe" -U portal_cliente_hml -d portal_cliente -c 'select count(*) from users;'
```

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

`Invoke-WebRequest` valida o certificado por padrão e vai falhar com o
autoassinado. Em PowerShell 7+ use `-SkipCertificateCheck`; no Windows
PowerShell 5.1 essa opção não existe, então use o `curl.exe` que vem no Windows
10/11 e no Server 2019+:

```powershell
curl.exe -k https://172.20.210.87:8453/api/health        # 200 {"status":"ok"}
curl.exe -k https://172.20.210.87:8453/api/health/ready   # 200 ok, ou 503 degraded
curl.exe -I http://172.20.210.87:8090/                    # redirect para a 8453
```

`/api/health` é handler cru, sem dependência: responde 200 sempre que o
processo está de pé. `/api/health/ready` checa Postgres, MinIO e RabbitMQ, e o
corpo do 503 diz qual caiu.

Migrations aplicadas no banco — fonte da verdade, mais confiável que a pasta
do repo:

```powershell
& "$PGBIN\psql.exe" -U portal_cliente_hml -d portal_cliente `
  -c 'select migration_name, finished_at from _prisma_migrations order by finished_at;'
```

Pelo navegador, aceitando o aviso do certificado autoassinado:

| Verificar | Como | Esperado |
|---|---|---|
| Login persiste | logar e dar F5 | continua logado. DevTools → Application → Cookies mostra `portal-cliente.session_token` com `Secure`. Se a sessão cair no F5, o acesso está em HTTP em vez de HTTPS |
| Roteamento | front na raiz, API em `/api` | nenhuma chamada da tela retorna 404/500 |
| Escopo do despachante | logar como despachante e cadastrar motorista | aparece só para ele |
| MinIO | subir e baixar PDF numa averbação | download funciona; `docker @C exec minio mc ls local/portal-cliente-hml` lista o objeto |
| SSE | dashboard aberto, alterar agendamento em outra aba | atualiza sem reload, sem reconexão em loop no console |
| E-mail | convidar usuário de teste | e-mail chega com link para `https://172.20.210.87:8453` |
| Aurora intacto | `curl.exe -I http://172.20.210.87/` e `docker ps` | homologação do Aurora de pé em 80/443/9000 |

Se `AVERBACAO_ATIVA=true` não refletir na tela, é rebuild do frontend que
falta: `NEXT_PUBLIC_*` é inlinado no bundle em tempo de build.

---

## Atualizar depois

```powershell
Set-Location C:\caminho\para\Portal-Cliente
git pull --ff-only

$C = @('compose','-p','portal-cliente-hml','-f','docker-compose.homolog.yml','--env-file','.env.homolog')

docker @C config | Out-Null; if ($?) { 'OK' }
docker @C --profile migration build
docker @C build
docker @C --profile migration run --rm migrate
docker @C up -d --remove-orphans
docker @C ps
```

Se o `.env.homolog.example` mudou, compare com o seu `.env.homolog` e traga as
variáveis novas antes do `up`:

```powershell
$novas = (Select-String .env.homolog.example -Pattern '^[A-Z_]+=').Matches.Value
$atuais = (Select-String .env.homolog         -Pattern '^[A-Z_]+=').Matches.Value
Compare-Object $novas $atuais
```

## Rollback

```powershell
git checkout <sha-anterior>
docker @C --profile migration build
docker @C build
docker @C up -d --remove-orphans
```

Sem o passo de migration: **rollback de aplicação não é rollback de banco**.
Migration não é revertida automaticamente, e uma versão antiga contra um banco
já migrado pode falhar. Avalie antes de voltar.

## Derrubar

```powershell
docker @C down          # mantém o volume do MinIO
docker @C down -v       # apaga também os arquivos do MinIO de homologação
```

Sempre com o splat `@C`. Um `docker compose down` solto nesse diretório é o
jeito mais rápido de derrubar a stack do Aurora por engano.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `docker info` mostra `OSType: windows` | daemon em modo Windows containers; as imagens deste projeto são Linux |
| API não sobe, log cita `BETTER_AUTH_SECRET` | variável ausente no `.env.homolog`; ela é lida no import e lança |
| Login funciona e cai no F5 | acesso por HTTP em vez de HTTPS: o cookie `Secure` é descartado |
| Navegador recusa o certificado sem opção de prosseguir | certificado gerado sem `subjectAltName=IP:` |
| `Invoke-WebRequest` falha no certificado | esperado com autoassinado; use `curl.exe -k` |
| Redirect da 8090 leva a uma página morta | `port:` do redirect em `traefik.homolog.yml` diferente da porta publicada |
| Tudo na tela responde 500 | `NEST_API_INTERNAL_URL` errado: o proxy do Next cai no default `localhost:3030` dentro do próprio container |
| Migration falha com erro de conexão | `listen_addresses`, regra do `pg_hba.conf`, ou firewall do Windows bloqueando a interface do Docker. Confirme a faixa com `docker network inspect portalcliente_hml` e que a 5432 escuta em `0.0.0.0` |
| `host.docker.internal` não resolve no container | em Docker Desktop ele é nativo; o `extra_hosts: host-gateway` do compose é a garantia de paridade. Teste: `docker @C exec portal-cliente-api getent hosts host.docker.internal` |
| `/api/health/ready` em 503 mas o portal funciona | um dos três: Postgres, MinIO ou RabbitMQ. O corpo da resposta diz qual |
| Mensagem de integração não chega ao Aurora | fila sem sufixo `.hml`: a homologação consumiu a de produção. Rode a trava da etapa 2.3 |
| Containers do Aurora desapareceram | `--remove-orphans` sem `-p portal-cliente-hml` |
| Traefik não roteia nada | label `traefik.docker.network` tem de ser `portalcliente_hml`, e o provider do `traefik.homolog.yml` também |
| Build do frontend morre sem mensagem | memória: rode os builds em separado, ou aumente a RAM do WSL2 em `%USERPROFILE%\.wslconfig` |
