param(
    [Parameter(Mandatory=$true)][string]$Env,
    [Parameter(Mandatory=$true)][string]$HookUrl,
    [string]$ImageTag = "latest"
)
# Dispara el deploy de un servicio web en Render mediante Deploy Hook
# (HookUrl = Render "Deploy Hook" URL del servicio backend/frontend).
$body = @{ commit = $ImageTag; env = $Env } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri $HookUrl -Method Post -Body $body
    Write-Host "Deploy [$Env] disparado OK (build $ImageTag)" -ForegroundColor Green
} catch {
    Write-Error "Fallo deploy [$Env]: $($_.Exception.Message)"
    exit 1
}