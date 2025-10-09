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

# powershell -File [deploy-frontend.ps1](http://_vscodecontentref_/8) -Host 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  Write-Host "[1/3] Build do frontend" -ForegroundColor Green
  ExecOrFail "npm run build"

  Write-Host "[2/3] Enviando dist/" -ForegroundColor Green
  ExecOrFail "scp -i `"$KeyPath`" -r dist $User@$Host:$RemoteDir/"

  Write-Host "[3/3] (Opcional) Reiniciar app para limpar cache" -ForegroundColor Green
  $remoteRestart = "pm2 restart mirai || true"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$remoteRestart`""

  Write-Host "Deploy frontend concluído." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
