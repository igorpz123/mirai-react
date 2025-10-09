param(
  [Parameter(Mandatory=$true)] [string]$Host,
  [Parameter(Mandatory=$true)] [string]$KeyPath,
  [string]$User = "ubuntu",
  [string]$RemoteDir = "~/mirai-react"
)

function ExecOrFail {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor Cyan
  $LASTEXITCODE = 0
  & powershell -NoProfile -Command $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Cmd" }
}

# powershell -File [deploy-backend.ps1](http://_vscodecontentref_/7) -Host 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  Write-Host "[1/4] Build do backend" -ForegroundColor Green
  ExecOrFail "npm --prefix server run build"

  Write-Host "[2/4] Enviando server/dist" -ForegroundColor Green
  ExecOrFail "scp -i `"$KeyPath`" -r server/dist $User@$Host:$RemoteDir/server/"

  Write-Host "[3/4] Instalando deps de runtime (se necessário)" -ForegroundColor Green
  $remoteInstall = "cd $RemoteDir && npm --prefix server install --omit=dev"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$remoteInstall`""

  Write-Host "[4/4] Reiniciando app (PM2)" -ForegroundColor Green
  $remoteRestart = "cd $RemoteDir && pm2 restart mirai || pm2 start server/dist/server.js --name mirai"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$remoteRestart`""

  Write-Host "Deploy backend concluído." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
