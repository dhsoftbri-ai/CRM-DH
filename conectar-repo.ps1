# Conecta esta carpeta con el repositorio de GitHub e instala las dependencias.
# Se ejecuta una sola vez. Uso: doble clic en conectar-repo.cmd
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$repo = 'https://github.com/dhsoftbri-ai/CRM-DH.git'

function Requiere($cmd, $url) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "Falta '$cmd'. Instalalo desde $url y vuelve a ejecutar este script." -ForegroundColor Red
    exit 1
  }
}
Requiere git  'https://git-scm.com/download/win'
Requiere node 'https://nodejs.org'

if (-not (Test-Path '.git')) {
  Write-Host '> Creando repositorio local...' -ForegroundColor Cyan
  git init -b main | Out-Null
  git remote add origin $repo
}

Write-Host '> Descargando historial de GitHub (puede pedirte iniciar sesion)...' -ForegroundColor Cyan
git fetch origin

# Adopta el historial del repo sin modificar los archivos de esta carpeta
git reset --mixed origin/main | Out-Null
git branch --set-upstream-to=origin/main main | Out-Null

$cambios = git status --porcelain
if ($cambios) {
  Write-Host 'Archivos que difieren del repositorio:' -ForegroundColor Yellow
  git status --short
} else {
  Write-Host 'Carpeta sincronizada con GitHub.' -ForegroundColor Green
}

Write-Host '> Instalando dependencias (npm install)...' -ForegroundColor Cyan
npm install

Write-Host ''
Write-Host 'Listo.' -ForegroundColor Green
Write-Host '  Probar la app:     npm start   -> http://localhost:4200'
Write-Host '  Abrir Claude Code: claude'
