param(
  [Parameter(Mandatory=$true)] [string]$Host,          # IP ou domínio do servidor
  [Parameter(Mandatory=$true)] [string]$KeyPath,       # Caminho da chave SSH .pem
  [string]$LocalPath = "server/uploads",              # Pasta local com as pastas/arquivos a enviar
  [string]$User = "ubuntu",
  [string]$RemoteDir = "~/mirai-react/uploads",       # Destino remoto (project root)/uploads
  [switch]$Replace                                     # Se definido, apaga conteúdo remoto antes de enviar
)

function ExecOrFail {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor Cyan
  $LASTEXITCODE = 0
  & powershell -NoProfile -Command $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Cmd" }
}

try {
  if (-not (Test-Path $LocalPath)) {
    throw "Pasta local '$LocalPath' não encontrada. Ajuste o parâmetro -LocalPath."
  }

  # Normaliza caminhos relativos
  $LocalFull = Resolve-Path $LocalPath | Select-Object -ExpandProperty Path
  Write-Host "Local:  $LocalFull" -ForegroundColor Yellow
  Write-Host "Remoto: $User@$Host:$RemoteDir" -ForegroundColor Yellow

  Write-Host "[1/4] Garantindo diretório remoto" -ForegroundColor Green
  $mk = "mkdir -p $RemoteDir"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$mk`""

  if ($Replace) {
    Write-Host "[2/4] Limpando conteúdo remoto (Replace)" -ForegroundColor Green
    $rm = "rm -rf $RemoteDir/*"
    ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$rm`""
  } else {
    Write-Host "[2/4] Mantendo conteúdo remoto existente (modo incremental)" -ForegroundColor Green
  }

  Write-Host "[3/4] Enviando conteúdo (recursivo)" -ForegroundColor Green
  # Copia o conteúdo da pasta (não a pasta em si). Antes, garante que há itens a enviar.
  $items = Get-ChildItem -Force -LiteralPath $LocalFull | Where-Object { $_.Name -ne "." -and $_.Name -ne ".." }
  if (-not $items -or $items.Count -eq 0) {
    Write-Host "Nenhum arquivo/pasta encontrado em '$LocalFull'. Nada para enviar." -ForegroundColor Yellow
  } else {
    # O wildcard * expande no PowerShell e envia todos os itens dentro de $LocalFull
    ExecOrFail "scp -i `"$KeyPath`" -r `"$LocalFull`"/* $User@$Host:$RemoteDir/"
  }

  Write-Host "[4/4] Ajustando permissões (opcional)" -ForegroundColor Green
  $chmod = "chmod -R 775 $RemoteDir || true"
  ExecOrFail "ssh -i `"$KeyPath`" $User@$Host `"$chmod`""

  Write-Host "Uploads enviados com sucesso." -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
