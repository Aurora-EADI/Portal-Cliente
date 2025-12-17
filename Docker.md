
  Opção 1: Rodar do Windows

  # 1. Abrir PowerShell na pasta do projeto
  cd C:\Users\Jonathan.ferreira\Documents\Portal\Portal-Aurora

  # 2. Iniciar os containers
  docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d

  # 3. Ver logs em tempo real
  docker-compose -f docker-compose.dev.yml logs -f

  # 4. Ver logs de um serviço específico
  docker-compose -f docker-compose.dev.yml logs -f backend
  docker-compose -f docker-compose.dev.yml logs -f frontend

  # 5. Parar containers
  docker-compose -f docker-compose.dev.yml down

  # 6. Parar e remover volumes (apaga dados do banco)
  docker-compose -f docker-compose.dev.yml down -v

  Opção 2: Rodar de dentro do WSL (Melhor performance)

  # 1. Abrir o terminal WSL (Ubuntu)
  wsl

  # 2. Navegar para o projeto (usando caminho WSL)
  cd /mnt/c/Users/Jonathan.ferreira/Documents/Portal/Portal-Aurora

  # 3. Verificar se Docker está instalado no WSL
  docker --version
  docker-compose --version

  # Se não estiver instalado, instale:
  # sudo apt-get update
  # sudo apt-get install docker.io docker-compose

  # 4. Iniciar os containers
  docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d

  # 5. Ver logs
  docker-compose -f docker-compose.dev.yml logs -f

  # 6. Parar containers
  docker-compose -f docker-compose.dev.yml down

  ---
  🔧 Primeira Execução (Setup Inicial)

  # 1. Subir os containers
  docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

  # 2. Aguardar o PostgreSQL iniciar (20-30 segundos)
  docker-compose -f docker-compose.dev.yml logs -f postgres

  # 3. Executar migrations do Prisma (IMPORTANTE!)
  docker exec -it portal-aurora-backend sh

  # Dentro do container do backend:
  npx prisma migrate deploy --schema=prisma/postgres/schema.prisma
  # ou se for a primeira vez:
  npx prisma migrate dev --schema=prisma/postgres/schema.prisma

  # Seed opcional (dados iniciais)
  npm run prisma:seed

  # Sair do container
  exit

  # 4. Acessar a aplicação
  # Frontend: http://localhost:3000
  # Backend: http://localhost:5000/api

  ---
  📝 Comandos Úteis

  Status e Monitoramento

  # Listar containers rodando
  docker ps

  # Listar todos os containers (incluindo parados)
  docker ps -a

  # Ver uso de recursos
  docker stats

  # Inspecionar um container
  docker inspect portal-aurora-backend

  Gerenciamento de Containers

  # Restart de um serviço específico
  docker-compose -f docker-compose.dev.yml restart backend

  # Rebuild de um serviço
  docker-compose -f docker-compose.dev.yml up -d --build backend

  # Parar um container específico
  docker stop portal-aurora-frontend

  # Remover containers parados
  docker container prune

  Acessar Shell dos Containers

  # Backend (NestJS)
  docker exec -it portal-aurora-backend sh

  # Frontend (Next.js)
  docker exec -it portal-aurora-frontend sh

  # PostgreSQL
  docker exec -it portal-aurora-postgres psql -U aurora_user -d portal_aurora_dev

  Logs

  # Todos os serviços
  docker-compose -f docker-compose.dev.yml logs -f

  # Últimas 100 linhas
  docker-compose -f docker-compose.dev.yml logs --tail=100

  # Apenas backend
  docker-compose -f docker-compose.dev.yml logs -f backend

  # Sem follow (snapshot)
  docker-compose -f docker-compose.dev.yml logs

  Banco de Dados

  # Backup do PostgreSQL
  docker exec portal-aurora-postgres pg_dump -U aurora_user portal_aurora_dev > backup.sql

  # Restaurar backup
  docker exec -i portal-aurora-postgres psql -U aurora_user -d portal_aurora_dev < backup.sql

  # Abrir Prisma Studio (no backend local, não no container)
  cd backend
  npm run studio

  📌 Notas Importantes

  1. Hot Reload: Os Dockerfiles estão configurados com volumes para hot reload automático
  2. SQL Server: A connection string do SQL Server aponta para localhost:1433 - ajuste conforme seu     
  ambiente
  3. Traefik: Está comentado no docker-compose, pode descomentar se precisar de proxy reverso
  4. Produção: Use Dockerfiles diferentes para produção (sem volumes, otimizados)