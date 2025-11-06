param(
  [Parameter(Mandatory=$true)] [string]$ServerHost,    # IP ou domínio do servidor
  [Parameter(Mandatory=$true)] [string]$KeyPath,       # Caminho da chave SSH .pem
  [string]$User = "ubuntu",
  [string]$RemoteDir = "~/mirai-react",
  [int]$StartFrom = 1  # 1..6
)

function ExecOrFail {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor Cyan
  $LASTEXITCODE = 0
  & cmd.exe /c $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Cmd" }
}

# Exemplo:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-all.ps1 -ServerHost 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  if ($StartFrom -le 1) {
    Write-Host "[1/6] Instalando dependências locais" -ForegroundColor Green
    ExecOrFail "npm install"
    ExecOrFail "npm --prefix server install"
  } else {
    Write-Host "[1/6] PULADO (StartFrom=$StartFrom)" -ForegroundColor Yellow
  }

  if ($StartFrom -le 2) {
    Write-Host "[2/6] Build completo (front + back)" -ForegroundColor Green
    ExecOrFail "npm run build:full"
  } else {
    Write-Host "[2/6] PULADO (StartFrom=$StartFrom)" -ForegroundColor Yellow
  }

  if ($StartFrom -le 3) {
    Write-Host "[3/6] Empacotando artefatos" -ForegroundColor Green
    if (Test-Path ./deploy.tar.gz) { Remove-Item ./deploy.tar.gz -Force }
    ExecOrFail "tar.exe -czf deploy.tar.gz dist server/dist server/templates package.json server/package.json"
  } else {
    Write-Host "[3/6] PULADO (StartFrom=$StartFrom)" -ForegroundColor Yellow
  }

  if ($StartFrom -le 4) {
    Write-Host "[4/6] Enviando pacote para o servidor" -ForegroundColor Green
    $remoteSpec = "${User}@${ServerHost}:${RemoteDir}/"
    ExecOrFail "scp -i `"$KeyPath`" deploy.tar.gz $remoteSpec"
  } else {
    Write-Host "[4/6] PULADO (StartFrom=$StartFrom)" -ForegroundColor Yellow
  }

  if ($StartFrom -le 5) {
    Write-Host "[5/6] Aplicando no servidor" -ForegroundColor Green
    $remoteScript = @'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi
if command -v nvm >/dev/null 2>&1; then nvm use --lts >/dev/null 2>&1 || true; fi
echo "[remote] Node: $(node -v 2>/dev/null || echo 'not found'), npm: $(npm -v 2>/dev/null || echo 'not found')"
cd {0}
echo "[remote] Extracting package..."
tar xzf deploy.tar.gz
echo "[remote] Installing server deps..."
npm --prefix server install --omit=dev --no-audit --no-fund
echo "[remote] Restarting mirai service with systemctl..."
sudo systemctl restart mirai
echo "[remote] Checking service status..."
sudo systemctl is-active mirai || sudo systemctl status mirai
rm deploy.tar.gz
echo "[remote] Done."
'@ -f $RemoteDir

    $tmpScript = Join-Path $env:TEMP "apply-remote-$(Get-Date -Format yyyyMMddHHmmss).sh"
    $remoteScriptLF = $remoteScript -replace "`r`n", "`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tmpScript, $remoteScriptLF, $utf8NoBom)
    try {
      ExecOrFail "scp -i `"$KeyPath`" `"$tmpScript`" ${User}@${ServerHost}:$RemoteDir/apply-remote.sh"
      ExecOrFail "ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i `"$KeyPath`" ${User}@${ServerHost} bash -e $RemoteDir/apply-remote.sh"
      ExecOrFail "ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i `"$KeyPath`" ${User}@${ServerHost} rm -f $RemoteDir/apply-remote.sh"
    } finally {
      if (Test-Path $tmpScript) { Remove-Item $tmpScript -Force }
    }
  } else {
    Write-Host "[5/6] PULADO (StartFrom=$StartFrom)" -ForegroundColor Yellow
  }

  if ($StartFrom -le 6) {
    Write-Host "[6/6] Concluído com sucesso." -ForegroundColor Green
  }
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
