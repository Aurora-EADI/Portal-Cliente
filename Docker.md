
  # 1. Iniciar os containers
  docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d

  # 2. Ver logs em tempo real
  docker-compose -f docker-compose.dev.yml logs -f

  # 3. Ver logs de um serviço específico
  docker-compose -f docker-compose.dev.yml logs -f backend
  docker-compose -f docker-compose.dev.yml logs -f frontend

  # 4. Rodar o prisma studio

  docker compose -f docker-compose.dev.yml exec backend npm run studio

  docker compose -f docker-compose.dev.yml build --no-cache

---------------------------------------------------------------------------

  🚀 Scripts Disponíveis
1️⃣ start-dev.ps1 - Iniciar Aplicação
Função: Inicia o Portal Aurora em modo desenvolvimento com verificação automática de seed.
O que faz:

✅ Valida ambiente (Docker, Docker Compose, arquivos)
🛑 Para containers existentes
🏗️ Constrói imagens Docker
🚀 Inicia todos os containers
🔍 Monitora execução do seed automático
🎉 Exibe credenciais do admin (se criado)
📊 Mostra status dos serviços
💡 Oferece visualização de logs

Como usar:
powershell# Opção 1: Clique duplo no arquivo
# (Windows irá executar automaticamente)

# Opção 2: PowerShell
.\start-dev.ps1

# Opção 3: PowerShell com execução forçada
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
Saída esperada (primeira vez):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 PORTAL AURORA - AMBIENTE DE DESENVOLVIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 Validando ambiente...
✅ Docker encontrado
✅ Docker Compose encontrado
✅ Arquivo .env.dev encontrado
✅ Arquivo docker-compose.dev.yml encontrado

🔹 Parando containers existentes...
✅ Containers parados

🔹 Construindo imagens Docker...
✅ Imagens construídas com sucesso

🔹 Iniciando containers...
✅ Containers iniciados

🔹 Aguardando inicialização dos serviços...

Monitorando logs do backend para verificar seed...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎉 SEED EXECUTADO COM SUCESSO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email: admin@aurora.com.br
🔑 Senha: aurora@2025
👤 Nome: Admin Aurora
🛡️  Role: ADMIN
