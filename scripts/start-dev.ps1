Write-Host "Iniciando Portal Aurora - Ambiente de Desenvolvimento" -ForegroundColor Green

# Verificar se .env.dev existe
if (-Not (Test-Path .env.dev)) {
    Write-Host "Erro: Arquivo .env.dev não encontrado" -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "Parando containers existentes..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml --env-file .env.dev down

# Build e iniciar
Write-Host "Construindo imagens..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev build

Write-Host "Iniciando containers..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Aguardar serviços
Write-Host "Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "Status dos containers:" -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml --env-file .env.dev ps

Write-Host ""
Write-Host "Aplicação iniciada!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Logs: docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f" -ForegroundColor Gray