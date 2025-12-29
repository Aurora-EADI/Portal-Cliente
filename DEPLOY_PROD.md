# 🚀 Guia de Deploy - Portal Aurora (Produção)

Este guia contém o passo a passo completo para subir a aplicação Portal Aurora em ambiente de produção usando Docker.

---

## 📋 Pré-requisitos

- Docker instalado e funcionando
- Docker Compose instalado
- Acesso ao servidor de produção (IP: 172.20.210.84)
- Banco de dados PostgreSQL `portal_prod` configurado e acessível

---

## 🔧 Passo a Passo

### 1. Acessar o diretório do projeto

```bash
cd c:\Users\jonathan.ferreira\Documents\Portal_Prod\Portal-Aurora
```

### 2. Verificar se o arquivo .env.prod existe

```bash
# Windows (PowerShell)
Test-Path .env.prod

# Linux/Mac
ls -la .env.prod
```

### 3. Parar containers antigos (se houver)

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
```

### 4. Limpar imagens antigas (opcional, mas recomendado)

```bash
# Remove imagens não utilizadas
docker image prune -f

# Ou para forçar rebuild completo
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --rmi local
```

### 5. Construir e subir os containers

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 6. Verificar o status dos containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

Esperado:
```
NAME                          STATUS              PORTS
minio-prod                    Up (healthy)        0.0.0.0:9000-9001->9000-9001/tcp
portal-aurora-backend-prod    Up (healthy)        0.0.0.0:5000->5000/tcp
portal-aurora-frontend-prod   Up (healthy)        0.0.0.0:3000->3000/tcp
```

### 7. Verificar logs (se necessário)

```bash
# Todos os containers
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f

# Apenas backend
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend

# Apenas frontend
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend

# Apenas MinIO
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f minio
```

### 8. Executar migrations do Prisma (se necessário)

```bash
docker exec -it portal-aurora-backend-prod npx prisma migrate deploy --schema=prisma/postgres/schema.prisma
```

### 9. Testar a aplicação

- **Frontend**: http://172.20.210.84:3000
- **Backend API**: http://172.20.210.84:5000/api
- **MinIO Console**: http://172.20.210.84:9001

---

## 🔄 Comandos Úteis

### Reiniciar um container específico

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart backend
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart frontend
```

### Parar todos os containers

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
```

### Ver uso de recursos

```bash
docker stats
```

### Acessar shell do container

```bash
# Backend
docker exec -it portal-aurora-backend-prod sh

# Frontend
docker exec -it portal-aurora-frontend-prod sh
```

### Verificar healthcheck

```bash
docker inspect --format='{{json .State.Health}}' portal-aurora-backend-prod | jq
docker inspect --format='{{json .State.Health}}' portal-aurora-frontend-prod | jq
```

---

## 🚨 Troubleshooting

### Container não inicia

1. Verificar logs:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod logs backend
   ```

2. Verificar se o banco está acessível:
   ```bash
   docker exec -it portal-aurora-backend-prod sh -c "nc -zv host.docker.internal 5432"
   ```

### Erro de conexão com o banco

1. Verificar se o PostgreSQL está rodando no host
2. Verificar credenciais no `.env.prod`
3. Confirmar que o banco `portal_prod` existe

### Erro de memória

1. Aumentar limites no `docker-compose.prod.yml`
2. Verificar memória disponível: `docker info | grep Memory`

### Rebuild forçado

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 📁 Estrutura de Arquivos

```
Portal-Aurora/
├── .env.prod                          # Variáveis de ambiente (PRODUÇÃO)
├── docker-compose.prod.yml            # Docker Compose (PRODUÇÃO)
├── backend/
│   ├── Dockerfile.prod                # Dockerfile backend (PRODUÇÃO)
│   └── ...
├── aurora-eadi-front/
│   ├── Dockerfile.prod                # Dockerfile frontend (PRODUÇÃO)
│   └── ...
```

---

## ✅ Checklist de Deploy

- [ ] Banco `portal_prod` criado e acessível
- [ ] Arquivo `.env.prod` configurado corretamente
- [ ] Docker e Docker Compose instalados
- [ ] Portas 3000, 5000, 9000, 9001 liberadas
- [ ] Containers buildados e iniciados
- [ ] Migrations executadas
- [ ] Aplicação testada e funcionando
