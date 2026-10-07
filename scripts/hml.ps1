# Wrapper do Compose de homologação — host Windows.
# Equivalente Linux/macOS: scripts/hml.sh
#
# Existe por dois motivos:
#  1. O project name e o arquivo de compose ficam embutidos. `--remove-orphans`
#     sem `-p` alcança containers de OUTRO projeto Compose da mesma máquina — na
#     VM de homologação isso derruba a stack do Portal Aurora.
#  2. O runbook passa a ter um único conjunto de comandos para os dois SOs.
#
# Uso: .\scripts\hml.ps1 <qualquer argumento do docker compose>
#   .\scripts\hml.ps1 config
#   .\scripts\hml.ps1 --profile migration build
#   .\scripts\hml.ps1 --profile migration run --rm migrate
#   .\scripts\hml.ps1 up -d --remove-orphans
#   .\scripts\hml.ps1 ps
#
# Se a execução de script estiver bloqueada pela política do host:
#   powershell -ExecutionPolicy Bypass -File .\scripts\hml.ps1 ps

#Requires -Version 5.1

$Project     = 'portal-cliente-hml'
$ComposeFile = 'docker-compose.homolog.yml'
$EnvFile     = '.env.homolog'

# Roda sempre da raiz do repo, não de onde o script foi chamado: os `build` do
# compose usam `context: .` e os bind mounts do Traefik são relativos.
Push-Location (Join-Path $PSScriptRoot '..')
try {
  if (-not (Test-Path $EnvFile)) {
    Write-Host "erro: $EnvFile nao existe." -ForegroundColor Red
    Write-Host "      Copy-Item .env.homolog.example $EnvFile  e preencha os SUBSTITUA_ME."
    Write-Host "      Se havia um $EnvFile antigo da era Aurora, nao o reaproveite."
    exit 1
  }

  docker compose -p $Project -f $ComposeFile --env-file $EnvFile @args
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
