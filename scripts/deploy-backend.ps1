param(
  [Parameter(Mandatory=$true)] [string]$ServerHost,
  [Parameter(Mandatory=$true)] [string]$KeyPath,
  [string]$User = "ubuntu",
  [string]$RemoteDir = "~/mirai-react"
)

function ExecOrFail {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor Cyan
  $LASTEXITCODE = 0
  & cmd.exe /c $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Cmd" }
}

# Exemplo:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-backend.ps1 -ServerHost 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  $ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty Path
  $ServerDir = Join-Path $ProjectRoot 'server'
  $ServerDist = Join-Path $ServerDir 'dist'

  Write-Host "[1/4] Build do backend" -ForegroundColor Green
  ExecOrFail "cd /d `"$ProjectRoot`" && npm --prefix `"$ServerDir`" run build"

  Write-Host "[2/4] Enviando server/dist" -ForegroundColor Green
  $remoteSpec = "${User}@${ServerHost}:${RemoteDir}/server/"
  ExecOrFail "scp -i `"$KeyPath`" -r `"$ServerDist`" $remoteSpec"

  Write-Host "[3/4] Aplicando no servidor (deps + restart)" -ForegroundColor Green
  $remoteScript = @'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi
if command -v nvm >/dev/null 2>&1; then nvm use --lts >/dev/null 2>&1 || true; fi
echo "[remote] Node: $(node -v 2>/dev/null || echo 'not found'), npm: $(npm -v 2>/dev/null || echo 'not found')"
cd {0}
echo "[remote] Installing server runtime deps..."
npm --prefix server install --omit=dev --no-audit --no-fund
echo "[remote] Ensuring pm2..."
if ! command -v pm2 >/dev/null 2>&1; then npm i -g pm2 || true; fi
PM2_BIN="$(command -v pm2 || true)"
if [ -z "$PM2_BIN" ]; then
  PM2_CAND="$(npm bin -g 2>/dev/null)/pm2"
  if [ -x "$PM2_CAND" ]; then PM2_BIN="$PM2_CAND"; fi
fi
if [ -n "$PM2_BIN" ]; then
  echo "[remote] Using pm2 at $PM2_BIN"
  $PM2_BIN restart mirai || $PM2_BIN start server/dist/server.js --name mirai
else
  echo "[remote] pm2 not found, using nohup fallback"
  pkill -f "server/dist/server.js" || true
  nohup node server/dist/server.js > server.out.log 2>&1 & echo $! > server.pid
  echo "[remote] Started node (PID $(cat server.pid))"
fi
echo "[remote] Done."
'@ -f $RemoteDir

  $tmpScript = Join-Path $env:TEMP "apply-backend-$(Get-Date -Format yyyyMMddHHmmss).sh"
  $remoteScriptLF = $remoteScript -replace "`r`n", "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($tmpScript, $remoteScriptLF, $utf8NoBom)
  try {
    ExecOrFail "scp -i `"$KeyPath`" `"$tmpScript`" ${User}@${ServerHost}:$RemoteDir/apply-backend.sh"
    ExecOrFail "ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i `"$KeyPath`" ${User}@${ServerHost} bash -e $RemoteDir/apply-backend.sh"
    ExecOrFail "ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i `"$KeyPath`" ${User}@${ServerHost} rm -f $RemoteDir/apply-backend.sh"
  } finally {
    if (Test-Path $tmpScript) { Remove-Item $tmpScript -Force }
  }

  Write-Host "Deploy backend concluído." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
