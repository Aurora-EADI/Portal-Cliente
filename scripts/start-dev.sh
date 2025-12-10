#!/bin/bash

echo "🚀 Iniciando Portal Aurora - Ambiente de Desenvolvimento"

if [ ! -f .env.dev ]; then
    echo "❌ Erro: Arquivo .env.dev não encontrado"
    exit 1
fi

echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.dev.yml --env-file .env.dev down

echo "🔨 Construindo imagens..."
docker compose -f docker-compose.dev.yml --env-file .env.dev build

echo "▶️  Iniciando containers..."
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

echo "⏳ Aguardando serviços..."
sleep 10

echo "📊 Status dos containers:"
docker compose -f docker-compose.dev.yml --env-file .env.dev ps

echo ""
echo "✅ Aplicação iniciada!"
echo "🌐 Frontend: http://dev.local"
echo "🔌 Backend API: http://api.dev.local/api"
echo "📊 Traefik Dashboard: http://localhost:8080"
