param (
    [string]$Mensagem = ""
)

Write-Host "🔍 Verificando alterações no GlicoCare..." -ForegroundColor Cyan

$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ Nenhuma alteração pendente para commitar." -ForegroundColor Green
    exit 0
}

Write-Host "📦 Arquivos modificados/adicionados:" -ForegroundColor Yellow
$status | ForEach-Object { Write-Host "   $_" }

# Se nenhuma mensagem foi fornecida, gera uma automática com base nos arquivos
if ([string]::IsNullOrWhiteSpace($Mensagem)) {
    $dataHora = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $Mensagem = "update: atualização do sistema em $dataHora"
}

Write-Host "`n🚀 Executando git add, commit e push..." -ForegroundColor Cyan

git add .
git commit -m "$Mensagem"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Sucesso! Repositório no GitHub atualizado com o commit: '$Mensagem'" -ForegroundColor Green
} else {
    Write-Host "`n❌ Ocorreu um erro ao enviar para o GitHub." -ForegroundColor Red
}
