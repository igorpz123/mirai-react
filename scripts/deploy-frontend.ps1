param(
  [Parameter(Mandatory=$true)] [string]$ServerHost,
  [Parameter(Mandatory=$true)] [string]$KeyPath,
  [string]$User = "ubuntu",
  [string]$RemoteDir = "~/mirai-react",
  [switch]$Restart
)

function ExecOrFail {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor Cyan
  $LASTEXITCODE = 0
  & cmd.exe /c $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Cmd" }
}

# powershell -File [deploy-frontend.ps1](http://_vscodecontentref_/8) -Host 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  Write-Host "[1/3] Build do frontend" -ForegroundColor Green
  ExecOrFail "npm run build"

  Write-Host "[2/3] Enviando dist/" -ForegroundColor Green
  $remoteSpec = "${User}@${ServerHost}:${RemoteDir}/"
  ExecOrFail "scp -i `"$KeyPath`" -r dist $remoteSpec"

  if ($Restart) {
    Write-Host "[3/3] Reiniciando app (pm2)" -ForegroundColor Green
    ExecOrFail "ssh -i `"$KeyPath`" ${User}@${ServerHost} pm2 restart mirai"
  } else {
    Write-Host "[3/3] Reinício via pm2 pulado (use -Restart para executar)" -ForegroundColor Yellow
  }

  Write-Host "Deploy do frontend concluído (dist/ enviado)." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
