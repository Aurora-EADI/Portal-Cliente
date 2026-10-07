#!/usr/bin/env sh
# Wrapper do Compose de homologação — host Linux/macOS.
# Equivalente Windows: scripts\hml.ps1
#
# Existe por dois motivos:
#  1. O project name e o arquivo de compose ficam embutidos. `--remove-orphans`
#     sem `-p` alcança containers de OUTRO projeto Compose da mesma máquina — na
#     VM de homologação isso derruba a stack do Portal Aurora.
#  2. O runbook passa a ter um único conjunto de comandos para os dois SOs.
#
# Uso: ./scripts/hml.sh <qualquer argumento do docker compose>
#   ./scripts/hml.sh config
#   ./scripts/hml.sh --profile migration build
#   ./scripts/hml.sh --profile migration run --rm migrate
#   ./scripts/hml.sh up -d --remove-orphans
#   ./scripts/hml.sh ps
set -eu

PROJECT=portal-cliente-hml
COMPOSE_FILE=docker-compose.homolog.yml
ENV_FILE=.env.homolog

# Roda sempre da raiz do repo, não de onde o script foi chamado: os `build` do
# compose usam `context: .` e os bind mounts do Traefik são relativos.
cd "$(dirname "$0")/.."

if [ ! -f "$ENV_FILE" ]; then
  echo "erro: $ENV_FILE não existe." >&2
  echo "      cp .env.homolog.example $ENV_FILE  e preencha os SUBSTITUA_ME." >&2
  echo "      Se havia um $ENV_FILE antigo da era Aurora, não o reaproveite." >&2
  exit 1
fi

exec docker compose -p "$PROJECT" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
