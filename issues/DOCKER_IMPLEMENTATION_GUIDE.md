# Guia de Implementação Docker - Portal Aurora

Este documento fornece um passo a passo detalhado para implementar Docker na aplicação Portal Aurora, incluindo separação de serviços (Backend, Frontend, Banco de Dados) e configuração do Traefik como reverse proxy para os ambientes de **Desenvolvimento** e **Produção**.

---

## Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Docker Desktop - Diferenças e Configurações](#docker-desktop---diferenças-e-configurações)
4. [Estrutura de Arquivos Docker](#estrutura-de-arquivos-docker)
5. [Passo 1: Criar Dockerfile para Backend](#passo-1-criar-dockerfile-para-backend)
6. [Passo 2: Criar Dockerfile para Frontend](#passo-2-criar-dockerfile-para-frontend)
7. [Passo 3: Criar Docker Compose - Ambiente de Desenvolvimento](#passo-3-criar-docker-compose---ambiente-de-desenvolvimento)
8. [Passo 4: Criar Docker Compose - Ambiente de Produção](#passo-4-criar-docker-compose---ambiente-de-produção)
9. [Passo 5: Configurar Traefik](#passo-5-configurar-traefik)
10. [Passo 6: Configurar Variáveis de Ambiente](#passo-6-configurar-variáveis-de-ambiente)
11. [Passo 7: Scripts de Inicialização](#passo-7-scripts-de-inicialização)
12. [Comandos de Uso](#comandos-de-uso)
13. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Ambiente de Desenvolvimento
```
┌─────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)              │
│                    localhost:80 / :443                  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌────────▼─────────┐
│   Frontend     │  │   Backend    │  │  PostgreSQL      │
│   Next.js      │  │   NestJS     │  │  Port: 5432      │
│   Port: 3000   │  │   Port: 3333 │  │                  │
│   dev.local    │  │api.dev.local │  └──────────────────┘
└────────────────┘  └──────────────┘  ┌──────────────────┐
                                      │  SQL Server      │
                                      │  Port: 1433      │
                                      └──────────────────┘
```

### Ambiente de Produção
```
┌─────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)              │
│              yourdomain.com / api.yourdomain.com        │
│                    Port: 80 / 443 (SSL)                │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌────────▼─────────┐
│   Frontend     │  │   Backend    │  │  PostgreSQL      │
│   Next.js      │  │   NestJS     │  │  Port: 5432      │
│   (Build)      │  │   (Build)    │  │  + Volume        │
│   Port: 3000   │  │   Port: 3333 │  │                  │
└────────────────┘  └──────────────┘  └──────────────────┘
                                      ┌──────────────────┐
                                      │  SQL Server      │
                                      │  Port: 1433      │
                                      │  + Volume        │
                                      └──────────────────┘
```

---

## Pré-requisitos

- Docker Engine 24.0+ instalado
- Docker Compose 2.0+ instalado
- 4GB RAM mínimo (8GB recomendado)
- 10GB de espaço em disco livre
- Git
- Conhecimento básico de Docker e redes

**Verificar instalação:**
```bash
docker --version
docker compose version
```

---

## Docker Desktop - Diferenças e Configurações

Se você está usando **Docker Desktop** (Windows, macOS ou Linux), existem algumas diferenças importantes e configurações necessárias em relação ao Docker Engine puro. Esta seção detalha tudo que muda ao usar Docker Desktop.

### O que é Docker Desktop?

Docker Desktop é uma aplicação completa que inclui:
- **Docker Engine** - Motor do Docker
- **Docker Compose** - Orquestração de containers
- **Docker CLI** - Interface de linha de comando
- **GUI Dashboard** - Interface gráfica para gerenciar containers
- **Kubernetes** (opcional) - Orquestração avançada
- **WSL2 Integration** (Windows) - Integração com Windows Subsystem for Linux

### Vantagens do Docker Desktop

✅ **Instalação simplificada** - Tudo em um único instalador
✅ **Interface gráfica** - Visualizar containers, imagens, volumes
✅ **Gerenciamento de recursos** - Configurar CPU/RAM pela GUI
✅ **Networking automático** - `localhost` funciona out-of-the-box
✅ **Atualizações automáticas** - Mantém Docker atualizado
✅ **Integração com IDE** - VS Code, IntelliJ, etc.

### Configurações Iniciais do Docker Desktop

#### 1. Configurar Recursos (CPU/RAM)

**Windows/Mac:**
1. Abrir Docker Desktop
2. Settings → Resources
3. Configurar:
   - **CPUs:** Mínimo 2, recomendado 4
   - **Memory:** Mínimo 4GB, recomendado 8GB
   - **Swap:** 1GB
   - **Disk image size:** 60GB

**IMPORTANTE:** SQL Server precisa de pelo menos 2GB de RAM. Configure 6-8GB no total para rodar todos os containers.

#### 2. Habilitar WSL2 Integration (Windows apenas)

**Pré-requisito:** WSL2 instalado no Windows

```powershell
# Verificar se WSL2 está instalado
wsl --list --verbose

# Se não estiver instalado, instalar:
wsl --install
wsl --set-default-version 2
```

**No Docker Desktop:**
1. Settings → General
2. ✅ Marcar "Use the WSL 2 based engine"
3. Settings → Resources → WSL Integration
4. ✅ Marcar "Enable integration with my default WSL distro"
5. ✅ Marcar distribuições específicas (Ubuntu, Debian, etc.)
6. Apply & Restart

#### 3. File Sharing (Windows/Mac)

**Windows:**
- Docker Desktop automaticamente compartilha drives C:, D:, etc.
- Verificar: Settings → Resources → File Sharing
- Adicionar `C:\Users\Jonathan.ferreira\Documents\Portal\Portal-Aurora`

**Mac:**
- Verificar: Settings → Resources → File Sharing
- Adicionar o diretório do projeto

### Diferenças nos Comandos

#### Comando `docker compose` (sem hífen)

Docker Desktop usa a versão V2 do Compose integrada:

```bash
# ✅ Docker Desktop (V2 - sem hífen)
docker compose up -d
docker compose down
docker compose logs -f

# ❌ Docker Compose V1 (standalone - com hífen)
docker-compose up -d
docker-compose down
docker-compose logs -f
```

**IMPORTANTE:** Todos os comandos neste guia usam `docker compose` (V2). Se você tem o Compose V1 instalado separadamente, substitua por `docker-compose`.

#### Verificar qual versão você tem:

```bash
# Docker Compose V2 (integrado no Docker Desktop)
docker compose version
# Output: Docker Compose version v2.x.x

# Docker Compose V1 (standalone)
docker-compose --version
# Output: docker-compose version 1.x.x
```

### Ajustes para Windows

#### 1. Scripts de Inicialização (PowerShell)

Como o Windows não executa scripts `.sh` nativamente, crie versões PowerShell:

**Criar `scripts/start-dev.ps1`:**

```powershell
# scripts/start-dev.ps1
Write-Host "🚀 Iniciando Portal Aurora - Ambiente de Desenvolvimento" -ForegroundColor Green

# Verificar se .env.dev existe
if (-Not (Test-Path .env.dev)) {
    Write-Host "❌ Erro: Arquivo .env.dev não encontrado" -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml --env-file .env.dev down

# Build e iniciar
Write-Host "🔨 Construindo imagens..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev build

Write-Host "▶️  Iniciando containers..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Aguardar serviços
Write-Host "⏳ Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev ps

Write-Host ""
Write-Host "✅ Aplicação iniciada!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://dev.local" -ForegroundColor White
Write-Host "🔌 Backend API: http://api.dev.local/api" -ForegroundColor White
Write-Host "📊 Traefik Dashboard: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs: docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
```

**Criar `scripts/start-prod.ps1`:**

```powershell
# scripts/start-prod.ps1
Write-Host "🚀 Iniciando Portal Aurora - Ambiente de Produção" -ForegroundColor Green

# Verificar se .env.prod existe
if (-Not (Test-Path .env.prod)) {
    Write-Host "❌ Erro: Arquivo .env.prod não encontrado" -ForegroundColor Red
    exit 1
}

# Carregar e verificar variáveis
$envContent = Get-Content .env.prod | Out-String
if ($envContent -match "JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING") {
    Write-Host "❌ Erro: JWT_SECRET não foi alterado!" -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml --env-file .env.prod down

# Build e iniciar
Write-Host "🔨 Construindo imagens de produção..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

Write-Host "▶️  Iniciando containers..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Aguardar serviços
Write-Host "⏳ Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verificar status
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

# Ler domínio do .env.prod
$domain = (Get-Content .env.prod | Select-String -Pattern "^DOMAIN=(.+)$").Matches.Groups[1].Value

Write-Host ""
Write-Host "✅ Aplicação iniciada!" -ForegroundColor Green
Write-Host "🌐 Frontend: https://$domain" -ForegroundColor White
Write-Host "🔌 Backend API: https://api.$domain/api" -ForegroundColor White
Write-Host "📊 Traefik Dashboard: https://traefik.$domain" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs: docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
```

**Executar scripts PowerShell:**

```powershell
# No PowerShell (como administrador na primeira vez)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Executar
.\scripts\start-dev.ps1
.\scripts\start-prod.ps1
```

#### 2. Configurar arquivo `hosts` no Windows

**Localização:** `C:\Windows\System32\drivers\etc\hosts`

**Editar como Administrador:**

```powershell
# Abrir Notepad como administrador
notepad C:\Windows\System32\drivers\etc\hosts
```

**Adicionar:**

```
127.0.0.1 dev.local
127.0.0.1 api.dev.local
```

**Salvar e fechar.**

#### 3. Permissões de arquivo `acme.json`

No Windows, o comando `chmod 600` não funciona nativamente. Use PowerShell:

```powershell
# Criar arquivo
New-Item -Path docker\traefik\acme.json -ItemType File -Force

# Definir permissões (equivalente a chmod 600)
$acl = Get-Acl docker\traefik\acme.json
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $env:USERNAME, "FullControl", "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl docker\traefik\acme.json $acl
```

**Ou simplesmente:**

```powershell
# Criar arquivo vazio (Docker Desktop gerencia permissões automaticamente no Windows)
New-Item -Path docker\traefik\acme.json -ItemType File -Force
```

### Usando Git Bash no Windows (Alternativa)

Se você prefere usar os scripts `.sh` no Windows, instale o Git Bash:

1. Instalar [Git for Windows](https://git-scm.com/download/win) (inclui Git Bash)
2. Abrir Git Bash no diretório do projeto
3. Executar scripts normalmente:

```bash
./scripts/start-dev.sh
./scripts/start-prod.sh
```

### Diferenças nos Volumes e Bind Mounts

#### Performance no Windows

**❌ RUIM - Arquivos no Windows (C:/):**
```yaml
volumes:
  - C:/Users/Jonathan.ferreira/Documents/Portal/Portal-Aurora/backend:/app
```
Performance lenta devido à conversão de filesystem entre Windows e Linux.

**✅ BOM - Arquivos no WSL2:**
```yaml
volumes:
  - ./backend:/app  # Se o projeto estiver dentro do WSL2
```

**Recomendação para Windows:**
- Clone o projeto dentro do WSL2 (não no C:/ do Windows)
- Acesse via `\\wsl$\Ubuntu\home\user\Portal-Aurora`
- Ou use o VS Code Remote WSL para editar arquivos

#### Caminhos de Volume

Docker Desktop traduz caminhos automaticamente:

```yaml
# Funciona em Windows, Mac e Linux
volumes:
  - ./backend:/app
  - ./aurora-eadi-front:/app

# Windows: C:\Users\...\Portal-Aurora\backend
# Mac/Linux: /home/user/Portal-Aurora/backend
```

### Acesso ao Docker Socket

No Linux tradicional:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

No Docker Desktop (Windows/Mac):
- O socket é gerenciado automaticamente
- O mesmo caminho funciona, Docker Desktop faz a tradução
- Nenhuma alteração necessária nos docker-compose files

### Dashboard do Docker Desktop

Docker Desktop inclui uma GUI poderosa:

**Acesso:** Clicar no ícone do Docker na bandeja do sistema

**Funcionalidades:**
- 📦 **Containers** - Ver status, logs, terminal
- 🖼️ **Images** - Gerenciar imagens, ver tamanhos
- 💾 **Volumes** - Ver e limpar volumes
- 🌐 **Dev Environments** - Ambientes isolados
- ⚙️ **Settings** - Configurações de recursos

**Atalhos úteis:**
- Ver logs de um container: Containers → aurora-backend-dev → Logs
- Abrir terminal: Containers → aurora-backend-dev → CLI
- Ver uso de recursos: Container → Stats

### Comandos Ajustados para Docker Desktop

Todos os comandos do guia funcionam no Docker Desktop, apenas substitua `docker compose` se necessário:

```bash
# Desenvolvimento
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Produção
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Ver logs no terminal
docker compose -f docker-compose.dev.yml logs -f backend

# Ou usar o Dashboard do Docker Desktop (mais fácil)
```

### Gerando hash para Traefik Dashboard Auth no Windows

**Opção 1: Usar Docker (mais fácil)**

```powershell
docker run --rm httpd:2.4-alpine htpasswd -nb admin password
# Output: admin:$apr1$xyz$ABC123
```

**Opção 2: Usar WSL2**

```bash
# No Git Bash ou WSL2
htpasswd -nb admin password
```

**No arquivo `.env.prod`, duplicar `$`:**

```env
TRAEFIK_DASHBOARD_AUTH=admin:$$apr1$$xyz$$ABC123
```

### Troubleshooting Específico do Docker Desktop

#### Problema: "Docker Desktop is not running"

**Solução:**
1. Abrir Docker Desktop manualmente
2. Aguardar inicialização completa (ícone fica verde)
3. Executar comandos novamente

#### Problema: Containers lentos no Windows

**Causa:** Arquivos no filesystem do Windows (C:/)

**Solução:**
1. Mover projeto para dentro do WSL2:
```bash
# No WSL2 (Ubuntu)
cd ~
git clone https://github.com/Aurora-EADI/Portal-Aurora.git
cd Portal-Aurora
```

2. Acessar no VS Code:
```bash
code .  # Instala VS Code Remote WSL automaticamente
```

3. Executar Docker Compose dentro do WSL2

#### Problema: "The system cannot find the file specified" no volume mount

**Causa:** Caminho do volume não está compartilhado

**Solução:**
1. Docker Desktop → Settings → Resources → File Sharing
2. Adicionar o diretório do projeto
3. Apply & Restart

#### Problema: "port is already in use"

**Solução:**

```powershell
# Ver o que está usando a porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID pelo número da última coluna)
taskkill /PID 1234 /F
```

#### Problema: WSL2 consome muita RAM

Docker Desktop no WSL2 pode consumir muita RAM ao longo do tempo.

**Solução: Criar `.wslconfig`**

```powershell
# Criar arquivo em C:\Users\SEU_USUARIO\.wslconfig
notepad $env:USERPROFILE\.wslconfig
```

**Conteúdo:**

```ini
[wsl2]
memory=6GB
processors=4
swap=2GB
```

**Reiniciar WSL2:**

```powershell
wsl --shutdown
```

### Resumo das Diferenças

| Aspecto | Docker Engine (Linux) | Docker Desktop |
|---------|----------------------|----------------|
| **Instalação** | `apt install docker.io` | Instalador GUI |
| **Comando Compose** | `docker-compose` (V1) | `docker compose` (V2) |
| **Scripts** | `.sh` (Bash) | `.ps1` (PowerShell) ou Git Bash |
| **Volumes** | Nativos | Tradução automática |
| **Performance** | Nativa | WSL2 (boa dentro do WSL) |
| **Dashboard** | Não | Sim (GUI) |
| **Networking** | Manual | Automático |
| **Recursos** | Ilimitados | Configurável (GUI) |

### Checklist Docker Desktop (Windows)

**Antes de começar:**

- [ ] Docker Desktop instalado e rodando
- [ ] WSL2 habilitado e integrado
- [ ] Recursos alocados (6-8GB RAM, 4 CPUs)
- [ ] File Sharing configurado para o diretório do projeto
- [ ] Git Bash instalado (opcional, mas recomendado)
- [ ] VS Code com Remote WSL instalado (opcional)

**Desenvolvimento:**

- [ ] Projeto clonado (dentro do WSL2 para melhor performance)
- [ ] Scripts PowerShell criados (ou usar Git Bash)
- [ ] Arquivo `hosts` configurado (`C:\Windows\System32\drivers\etc\hosts`)
- [ ] Docker Compose V2 disponível (`docker compose version`)

---

## Estrutura de Arquivos Docker

Crie a seguinte estrutura de arquivos na raiz do projeto:

```
Portal-Aurora/
├── docker/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── traefik/
│   │   ├── traefik.dev.yml
│   │   ├── traefik.prod.yml
│   │   └── acme.json (criar vazio, chmod 600)
│   └── postgres/
│       └── init.sql (scripts de inicialização, se necessário)
├── scripts/
│   ├── start-dev.sh (Linux/Mac ou Git Bash)
│   ├── start-prod.sh (Linux/Mac ou Git Bash)
│   ├── start-dev.ps1 (Windows PowerShell)
│   └── start-prod.ps1 (Windows PowerShell)
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.dev
├── .env.prod
└── .dockerignore
```

---

## Passo 1: Criar Dockerfile para Backend

### 1.1 Criar `docker/backend/Dockerfile` (Produção)

```dockerfile
# Multi-stage build para otimizar tamanho da imagem
FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY backend/ .

# Gerar Prisma Client
RUN npx prisma generate --schema=./prisma/postgres/schema.prisma
RUN npx prisma generate --schema=./prisma/sqlserver/schema.prisma

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:20-alpine

WORKDIR /app

# Copiar dependências e build do stage anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Expor porta
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["npm", "run", "start:prod"]
```

### 1.2 Criar `docker/backend/Dockerfile.dev` (Desenvolvimento)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema para desenvolvimento
RUN apk add --no-cache git

# Copiar package.json
COPY backend/package*.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm install

# Copiar código fonte
COPY backend/ .

# Gerar Prisma Client
RUN npx prisma generate --schema=./prisma/postgres/schema.prisma
RUN npx prisma generate --schema=./prisma/sqlserver/schema.prisma

# Expor porta
EXPOSE 3333

# Comando de desenvolvimento com hot reload
CMD ["npm", "run", "start:dev"]
```

### 1.3 Criar `docker/backend/.dockerignore`

```
node_modules
dist
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
.vscode
.idea
coverage
*.log
```

---

## Passo 2: Criar Dockerfile para Frontend

### 2.1 Criar `docker/frontend/Dockerfile` (Produção)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY aurora-eadi-front/package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY aurora-eadi-front/ .

# Build de produção
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 2: Produção
FROM node:20-alpine

WORKDIR /app

# Copiar apenas o necessário
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

**NOTA:** Para usar o modo standalone do Next.js, adicione ao `aurora-eadi-front/next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  // ... resto da configuração
}
```

### 2.2 Criar `docker/frontend/Dockerfile.dev` (Desenvolvimento)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY aurora-eadi-front/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY aurora-eadi-front/ .

EXPOSE 3000

# Comando de desenvolvimento com hot reload
CMD ["npm", "run", "dev"]
```

### 2.3 Criar `docker/frontend/.dockerignore`

```
node_modules
.next
.git
.gitignore
README.md
.vscode
.idea
*.log
.env*.local
```

---

## Passo 3: Criar Docker Compose - Ambiente de Desenvolvimento

### 3.1 Criar `docker-compose.dev.yml` na raiz

```yaml
version: '3.8'

services:
  # Traefik - Reverse Proxy
  traefik:
    image: traefik:v3.0
    container_name: aurora-traefik-dev
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--log.level=DEBUG"
    ports:
      - "80:80"
      - "8080:8080" # Traefik Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - aurora-network

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: aurora-postgres-dev
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-aurora}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data-dev:/var/lib/postgresql/data
      - ./docker/postgres:/docker-entrypoint-initdb.d
    networks:
      - aurora-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SQL Server (Legacy Siaum)
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: aurora-sqlserver-dev
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: ${SQLSERVER_SA_PASSWORD:-YourStrong@Passw0rd}
      MSSQL_PID: Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data-dev:/var/opt/mssql
    networks:
      - aurora-network
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ${SQLSERVER_SA_PASSWORD:-YourStrong@Passw0rd} -Q 'SELECT 1' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Backend NestJS
  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile.dev
    container_name: aurora-backend-dev
    environment:
      NODE_ENV: development
      PORT: 3333
      DATABASE_URL_POSTGRES: ${DATABASE_URL_POSTGRES}
      DATABASE_URL_SQLSERVER: ${DATABASE_URL_SQLSERVER}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key-change-in-production}
    ports:
      - "3333:3333"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - /app/dist
    depends_on:
      postgres:
        condition: service_healthy
      sqlserver:
        condition: service_healthy
    networks:
      - aurora-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend-dev.rule=Host(`api.dev.local`)"
      - "traefik.http.routers.backend-dev.entrypoints=web"
      - "traefik.http.services.backend-dev.loadbalancer.server.port=3333"
    command: sh -c "npx prisma migrate deploy --schema=./prisma/postgres/schema.prisma && npm run start:dev"

  # Frontend Next.js
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile.dev
    container_name: aurora-frontend-dev
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://api.dev.local/api}
    ports:
      - "3000:3000"
    volumes:
      - ./aurora-eadi-front:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    networks:
      - aurora-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend-dev.rule=Host(`dev.local`)"
      - "traefik.http.routers.frontend-dev.entrypoints=web"
      - "traefik.http.services.frontend-dev.loadbalancer.server.port=3000"

networks:
  aurora-network:
    driver: bridge

volumes:
  postgres-data-dev:
    driver: local
  sqlserver-data-dev:
    driver: local
```

---

## Passo 4: Criar Docker Compose - Ambiente de Produção

### 4.1 Criar `docker-compose.prod.yml` na raiz

```yaml
version: '3.8'

services:
  # Traefik - Reverse Proxy com SSL
  traefik:
    image: traefik:v3.0
    container_name: aurora-traefik-prod
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--log.level=INFO"
      # Redirect HTTP to HTTPS
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./docker/traefik/acme.json:/letsencrypt/acme.json
    networks:
      - aurora-network
    labels:
      # Dashboard
      - "traefik.enable=true"
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: aurora-postgres-prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data-prod:/var/lib/postgresql/data
      - ./docker/postgres:/docker-entrypoint-initdb.d
    networks:
      - aurora-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # SQL Server (Legacy Siaum)
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: aurora-sqlserver-prod
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: ${SQLSERVER_SA_PASSWORD}
      MSSQL_PID: ${SQLSERVER_EDITION:-Standard}
    volumes:
      - sqlserver-data-prod:/var/opt/mssql
    networks:
      - aurora-network
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ${SQLSERVER_SA_PASSWORD} -Q 'SELECT 1' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # Backend NestJS
  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: aurora-backend-prod
    environment:
      NODE_ENV: production
      PORT: 3333
      DATABASE_URL_POSTGRES: ${DATABASE_URL_POSTGRES}
      DATABASE_URL_SQLSERVER: ${DATABASE_URL_SQLSERVER}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      sqlserver:
        condition: service_healthy
    networks:
      - aurora-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend-prod.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.backend-prod.entrypoints=websecure"
      - "traefik.http.routers.backend-prod.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend-prod.loadbalancer.server.port=3333"
      # Security headers
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Frame-Options=SAMEORIGIN"
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Content-Type-Options=nosniff"
      - "traefik.http.routers.backend-prod.middlewares=security-headers"
    restart: unless-stopped
    command: sh -c "npx prisma migrate deploy --schema=./prisma/postgres/schema.prisma && npm run start:prod"

  # Frontend Next.js
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.${DOMAIN}/api
    container_name: aurora-frontend-prod
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.${DOMAIN}/api
    depends_on:
      - backend
    networks:
      - aurora-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend-prod.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"
      - "traefik.http.routers.frontend-prod.entrypoints=websecure"
      - "traefik.http.routers.frontend-prod.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend-prod.loadbalancer.server.port=3000"
      # Security headers
      - "traefik.http.routers.frontend-prod.middlewares=security-headers"
    restart: unless-stopped

networks:
  aurora-network:
    driver: bridge

volumes:
  postgres-data-prod:
    driver: local
  sqlserver-data-prod:
    driver: local
```

---

## Passo 5: Configurar Traefik

### 5.1 Criar arquivo acme.json para certificados SSL

```bash
mkdir -p docker/traefik
touch docker/traefik/acme.json
chmod 600 docker/traefik/acme.json
```

### 5.2 Configurar hosts locais para desenvolvimento

Adicione ao arquivo `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 dev.local
127.0.0.1 api.dev.local
```

---

## Passo 6: Configurar Variáveis de Ambiente

### 6.1 Criar `.env.dev` na raiz

```env
# PostgreSQL
POSTGRES_DB=aurora_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# SQL Server
SQLSERVER_SA_PASSWORD=YourStrong@Passw0rd
SQLSERVER_EDITION=Developer

# Database URLs (formato Prisma)
DATABASE_URL_POSTGRES=postgresql://postgres:postgres123@postgres:5432/aurora_dev?schema=public
DATABASE_URL_SQLSERVER=sqlserver://postgres:5432;database=Siaum;user=sa;password=YourStrong@Passw0rd;trustServerCertificate=true;encrypt=true

# Backend
JWT_SECRET=dev-secret-key-change-in-production
PORT=3333

# Frontend
NEXT_PUBLIC_API_URL=http://api.dev.local/api
```

### 6.2 Criar `.env.prod` na raiz

```env
# Domain
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# PostgreSQL
POSTGRES_DB=aurora_prod
POSTGRES_USER=aurora_user
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123

# SQL Server
SQLSERVER_SA_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_456
SQLSERVER_EDITION=Standard

# Database URLs (formato Prisma)
DATABASE_URL_POSTGRES=postgresql://aurora_user:CHANGE_THIS_STRONG_PASSWORD_123@postgres:5432/aurora_prod?schema=public
DATABASE_URL_SQLSERVER=sqlserver://postgres:5432;database=Siaum;user=sa;password=CHANGE_THIS_STRONG_PASSWORD_456;trustServerCertificate=true;encrypt=true

# Backend
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
PORT=3333

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Traefik Dashboard Auth (gerar com: htpasswd -nb admin password)
TRAEFIK_DASHBOARD_AUTH=admin:$$apr1$$xyz$$ABC123
```

**Gerar senha para Traefik Dashboard:**
```bash
# Instalar htpasswd (se necessário)
sudo apt-get install apache2-utils

# Gerar hash (substituir 'admin' e 'password')
htpasswd -nb admin password
# Resultado: admin:$apr1$xyz$ABC123
# IMPORTANTE: No .env, duplicar $ para escapar: $$apr1$$xyz$$ABC123
```

### 6.3 Adicionar ao `.gitignore`

```
.env.dev
.env.prod
docker/traefik/acme.json
```

---

## Passo 7: Scripts de Inicialização

### 7.1 Criar `scripts/start-dev.sh`

```bash
#!/bin/bash

echo "🚀 Iniciando Portal Aurora - Ambiente de Desenvolvimento"

# Verificar se .env.dev existe
if [ ! -f .env.dev ]; then
    echo "❌ Erro: Arquivo .env.dev não encontrado"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.dev.yml --env-file .env.dev down

# Build e iniciar
echo "🔨 Construindo imagens..."
docker compose -f docker-compose.dev.yml --env-file .env.dev build

echo "▶️  Iniciando containers..."
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Aguardar serviços estarem prontos
echo "⏳ Aguardando serviços..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker-compose.dev.yml --env-file .env.dev ps

echo ""
echo "✅ Aplicação iniciada!"
echo "🌐 Frontend: http://dev.local"
echo "🔌 Backend API: http://api.dev.local/api"
echo "📊 Traefik Dashboard: http://localhost:8080"
echo ""
echo "📝 Logs: docker compose -f docker-compose.dev.yml logs -f"
```

### 7.2 Criar `scripts/start-prod.sh`

```bash
#!/bin/bash

echo "🚀 Iniciando Portal Aurora - Ambiente de Produção"

# Verificar se .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ Erro: Arquivo .env.prod não encontrado"
    exit 1
fi

# Carregar variáveis
source .env.prod

# Validar variáveis críticas
if [ "$JWT_SECRET" == "CHANGE_THIS_TO_RANDOM_64_CHAR_STRING" ]; then
    echo "❌ Erro: JWT_SECRET não foi alterado!"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.prod.yml --env-file .env.prod down

# Build e iniciar
echo "🔨 Construindo imagens de produção..."
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

echo "▶️  Iniciando containers..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Aguardar serviços
echo "⏳ Aguardando serviços..."
sleep 15

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

echo ""
echo "✅ Aplicação iniciada!"
echo "🌐 Frontend: https://$DOMAIN"
echo "🔌 Backend API: https://api.$DOMAIN/api"
echo "📊 Traefik Dashboard: https://traefik.$DOMAIN"
echo ""
echo "📝 Logs: docker compose -f docker-compose.prod.yml logs -f"
```

### 7.3 Tornar scripts executáveis

```bash
chmod +x scripts/start-dev.sh
chmod +x scripts/start-prod.sh
```

---

## Comandos de Uso

### Desenvolvimento

```bash
# Iniciar ambiente completo
./scripts/start-dev.sh

# Ou manualmente:
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Ver logs de todos os serviços
docker compose -f docker-compose.dev.yml logs -f

# Ver logs de um serviço específico
docker compose -f docker-compose.dev.yml logs -f backend

# Parar containers
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose -f docker-compose.dev.yml down -v

# Rebuild de um serviço específico
docker compose -f docker-compose.dev.yml build backend
docker compose -f docker-compose.dev.yml up -d backend

# Executar comandos dentro de um container
docker compose -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.dev.yml exec backend npm run prisma:studio

# Verificar status
docker compose -f docker-compose.dev.yml ps
```

### Produção

```bash
# Iniciar ambiente completo
./scripts/start-prod.sh

# Ou manualmente:
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Restart de um serviço
docker compose -f docker-compose.prod.yml restart backend

# Update de uma imagem
docker compose -f docker-compose.prod.yml pull backend
docker compose -f docker-compose.prod.yml up -d backend

# Backup do banco de dados
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U aurora_user aurora_prod > backup_$(date +%Y%m%d).sql

# Restore do banco de dados
docker compose -f docker-compose.prod.yml exec -T postgres psql -U aurora_user aurora_prod < backup_20241209.sql

# Parar containers
docker compose -f docker-compose.prod.yml down
```

### Prisma Migrations

```bash
# Desenvolvimento - Criar migration
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name migration_name --schema=./prisma/postgres/schema.prisma

# Produção - Aplicar migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy --schema=./prisma/postgres/schema.prisma

# Prisma Studio
docker compose -f docker-compose.dev.yml exec backend npx prisma studio --schema=./prisma/postgres/schema.prisma
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune -a

# Remover volumes não utilizados (CUIDADO!)
docker volume prune

# Limpeza completa (CUIDADO: remove tudo!)
docker system prune -a --volumes
```

---

## Troubleshooting

### Problema: Containers não iniciam

**Solução:**
```bash
# Verificar logs
docker compose -f docker-compose.dev.yml logs

# Verificar recursos
docker system df
docker stats

# Verificar portas em uso
netstat -tulpn | grep LISTEN
```

### Problema: Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar se container está rodando
docker compose -f docker-compose.dev.yml ps postgres

# Testar conexão
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d aurora_dev

# Verificar health check
docker inspect aurora-postgres-dev | grep -A 10 Health
```

### Problema: Backend não consegue conectar ao Postgres

**Causa:** Container do backend inicia antes do Postgres estar pronto

**Solução:**
- Os health checks já estão configurados no docker-compose
- Se persistir, aumentar o tempo de espera no comando do backend:
```yaml
command: sh -c "sleep 20 && npx prisma migrate deploy && npm run start:prod"
```

### Problema: Traefik não redireciona corretamente

**Solução:**
```bash
# Verificar dashboard do Traefik
# Dev: http://localhost:8080
# Prod: https://traefik.yourdomain.com

# Verificar labels dos containers
docker inspect aurora-frontend-dev | grep -A 20 Labels

# Verificar rede
docker network inspect aurora-network
```

### Problema: SSL não funciona em produção

**Solução:**
```bash
# Verificar logs do Traefik
docker compose -f docker-compose.prod.yml logs traefik

# Verificar certificados
docker compose -f docker-compose.prod.yml exec traefik cat /letsencrypt/acme.json

# Verificar se portas 80 e 443 estão abertas no firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar DNS
nslookup yourdomain.com
nslookup api.yourdomain.com
```

### Problema: Volume mounts não funcionam no Windows

**Solução:**
- Habilitar integração WSL2 no Docker Desktop
- Usar caminhos absolutos ou relativos consistentes
- Verificar permissões de compartilhamento de arquivos no Docker Desktop

### Problema: SQL Server não inicia

**Solução:**
```bash
# SQL Server precisa de mínimo 2GB RAM
# Verificar recursos disponíveis
docker stats

# Verificar logs
docker compose -f docker-compose.dev.yml logs sqlserver

# Verificar senha (mínimo 8 caracteres, maiúscula, minúscula, número, símbolo)
# Senha inválida: "password"
# Senha válida: "YourStrong@Passw0rd"
```

### Problema: Hot reload não funciona em desenvolvimento

**Solução:**
- Verificar se os volumes estão montados corretamente
- Verificar `.dockerignore` não está bloqueando arquivos necessários
- Em alguns sistemas, pode ser necessário usar polling:

**Backend (NestJS):**
```json
// backend/package.json
"start:dev": "nest start --watch --watchOptions.usePolling=true"
```

**Frontend (Next.js):**
```javascript
// aurora-eadi-front/next.config.js
module.exports = {
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}
```

---

## Checklist de Implementação

### Pré-Deploy

- [ ] Todos os arquivos Docker criados conforme estrutura
- [ ] `.env.dev` configurado com valores de desenvolvimento
- [ ] `.env.prod` configurado com senhas fortes únicas
- [ ] `acme.json` criado com permissões 600
- [ ] Scripts de inicialização com permissão de execução
- [ ] `.gitignore` atualizado
- [ ] Hosts locais configurados (`/etc/hosts`)

### Desenvolvimento

- [ ] Build das imagens sem erros
- [ ] Todos os containers iniciando corretamente
- [ ] PostgreSQL acessível e com migrations aplicadas
- [ ] SQL Server acessível
- [ ] Backend respondendo em `http://api.dev.local/api`
- [ ] Frontend acessível em `http://dev.local`
- [ ] Traefik Dashboard em `http://localhost:8080`
- [ ] Hot reload funcionando (backend e frontend)
- [ ] Autenticação JWT funcionando

### Produção

- [ ] Domínio apontando para servidor (DNS configurado)
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Certificados SSL gerados automaticamente
- [ ] HTTPS funcionando para frontend e backend
- [ ] Redirecionamento HTTP → HTTPS ativo
- [ ] Backup automático de banco de dados configurado
- [ ] Monitoramento e logs centralizados
- [ ] Security headers configurados
- [ ] Traefik Dashboard protegido por senha
- [ ] Variáveis de ambiente de produção seguras

---

## Próximos Passos Recomendados

1. **Monitoramento:**
   - Implementar Prometheus + Grafana para métricas
   - Configurar alertas (PagerDuty, Slack)

2. **CI/CD:**
   - GitHub Actions para build automático
   - Deploy automático em staging/produção
   - Testes automatizados antes do deploy

3. **Backup:**
   - Cron job para backup diário do PostgreSQL
   - Retenção de backups (7 dias, 4 semanas, 12 meses)
   - Teste de restore periódico

4. **Segurança:**
   - Scan de vulnerabilidades (Trivy, Snyk)
   - Rate limiting no Traefik
   - WAF (Web Application Firewall)

5. **Performance:**
   - CDN para assets estáticos
   - Cache com Redis
   - Database pooling e otimização de queries

---

## Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [NestJS Docker Deployment](https://docs.nestjs.com/recipes/prisma#docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)

---

**Criado em:** 2024-12-09
**Última atualização:** 2024-12-09
**Versão:** 1.1 (Adicionada seção Docker Desktop)
**Autor:** Claude Code
**Projeto:** Portal Aurora - Aurora EADI
