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

# powershell -File [deploy-backend.ps1](http://_vscodecontentref_/7) -Host 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  Write-Host "[1/4] Build do backend" -ForegroundColor Green
  ExecOrFail "npm --prefix server run build"

  Write-Host "[2/4] Enviando server/dist" -ForegroundColor Green
  $remoteSpec = "${User}@${ServerHost}:${RemoteDir}/server/"
  ExecOrFail "scp -i `"$KeyPath`" -r server/dist $remoteSpec"

  Write-Host "[3/4] Instalando deps de runtime (se necessário)" -ForegroundColor Green
  $remoteInstall = "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; nvm use --lts >/dev/null 2>&1 || nvm use default; cd $RemoteDir && npm --prefix server install --omit=dev"
  ExecOrFail "ssh -i `"$KeyPath`" ${User}@${ServerHost} `"$remoteInstall`""

  Write-Host "[4/4] Reiniciando app (PM2)" -ForegroundColor Green
  $remoteRestart = "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; nvm use --lts >/dev/null 2>&1 || nvm use default; cd $RemoteDir && pm2 restart mirai || pm2 start server/dist/server.js --name mirai"
  ExecOrFail "ssh -i `"$KeyPath`" ${User}@${ServerHost} `"$remoteRestart`""

  Write-Host "Deploy backend concluído." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
