# Acesso Rápido - Portal Aurora 🚀

## ✅ Serviços Rodando

### Frontend (Next.js)
```
http://localhost:3000
```
🎨 Interface web do portal

### Backend API (NestJS)
```
http://localhost:5000/api
```
⚙️ API REST do backend

### Traefik Dashboard (Opcional - Desligado por enquanto)
```
http://localhost:8080
```
📊 Dashboard do proxy reverso

### PostgreSQL
```
Host: localhost
Port: 5432
Database: portal_aurora_dev
User: aurora_user
Password: aurora_dev_password_2024
```
🗄️ Banco de dados principal

## 🔥 Comandos Úteis

### Iniciar todos os serviços
```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

### Parar todos os serviços
```bash
docker-compose -f docker-compose.dev.yml down
```

### Ver logs em tempo real
```bash
# Frontend
docker logs portal-aurora-frontend -f

# Backend
docker logs portal-aurora-backend -f

# Todos
docker-compose -f docker-compose.dev.yml logs -f
```

### Reiniciar um serviço específico
```bash
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart backend
```

### Rebuild após mudanças no código
```bash
# Backend
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend

# Frontend
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml up -d frontend
```

## 🧪 Testar a API

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@aurora.com\",\"password\":\"senha123\"}"
```

### Listar Módulos
```bash
curl http://localhost:5000/api/modules
```

### Criar usuário admin (seed)
```bash
docker exec -it portal-aurora-backend npm run prisma:seed
```

## 📝 Variáveis de Ambiente

Arquivo: `.env.dev`

Principais configurações:
- `API_URL`: http://localhost:5000/api
- `CORS_ORIGIN`: http://localhost:3000
- `DATABASE_URL_POSTGRES`: String de conexão PostgreSQL
- `JWT_SECRET`: Chave secreta do JWT

## 🛠️ Troubleshooting

### Frontend não carrega
```bash
docker-compose -f docker-compose.dev.yml restart frontend
docker logs portal-aurora-frontend -f
```

### Backend com erro
```bash
docker-compose -f docker-compose.dev.yml restart backend
docker logs portal-aurora-backend -f
```

### Limpar tudo e recomeçar
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

### Gerar clientes Prisma localmente (para o VSCode reconhecer os tipos)
```bash
cd backend
npm run prisma:generate:pg
npm run prisma:generate:sql
```

## 📂 Estrutura de Portas

| Serviço     | Porta Host | Porta Container | URL                       |
|-------------|-----------|----------------|---------------------------|
| Frontend    | 3000      | 3000           | http://localhost:3000     |
| Backend     | 5000      | 5000           | http://localhost:5000/api |
| PostgreSQL  | 5432      | 5432           | localhost:5432            |
| Traefik     | 80, 8080  | 80, 8080       | http://localhost:8080     |

## 🔐 Credenciais Padrão (após seed)

```
Email: admin@aurora.com
Senha: senha123
```

## 📱 Acessar do Navegador

Abra o Chrome/Edge e acesse:
```
http://localhost:3000
```

Faça login com as credenciais padrão!
