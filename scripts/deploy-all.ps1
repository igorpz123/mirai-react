param(
  [Parameter(Mandatory=$true)] [string]$Host,          # IP ou domínio do servidor
  [Parameter(Mandatory=$true)] [string]$KeyPath,       # Caminho da chave SSH .pem
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

# powershell -File [deploy-all.ps1](http://_vscodecontentref_/6) -Host 35.169.222.86 -KeyPath "C:\Users\igorp\.ssh\mirai-react.pem"

try {
  Write-Host "[1/6] Instalando dependências locais" -ForegroundColor Green
  ExecOrFail "npm install"
  ExecOrFail "npm --prefix server install"

  Write-Host "[2/6] Build completo (front + back)" -ForegroundColor Green
  ExecOrFail "npm run build:full"

  Write-Host "[3/6] Empacotando artefatos" -ForegroundColor Green
  if (Test-Path ./deploy.tar.gz) { Remove-Item ./deploy.tar.gz -Force }
  ExecOrFail "tar.exe -czf deploy.tar.gz dist server/dist server/templates package.json server/package.json"

  Write-Host "[4/6] Enviando pacote para o servidor" -ForegroundColor Green
  ExecOrFail "scp -i `"$KeyPath`" deploy.tar.gz $User@$Host:$RemoteDir/"

  Write-Host "[5/6] Aplicando no servidor" -ForegroundColor Green
  $remote = "cd $RemoteDir && tar xzf deploy.tar.gz && npm --prefix server install --omit=dev && (pm2 restart mirai || pm2 start server/dist/server.js --name mirai) && rm deploy.tar.gz"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$remote`""

  Write-Host "[6/6] Concluído com sucesso." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
