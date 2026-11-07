param(
    [Parameter(Mandatory = $true)][string]$Env,
    [string]$HookUrl = "",
    [string]$Ref = "develop",
    [string]$ImageTag = "",
    [int]$Retries = 3
)
# Dispara el deploy de un servicio web en Render mediante su Deploy Hook.
# Render acepta opcionalmente ?ref=<rama> para desplegar una rama concreta.
# Ref: https://render.com/docs/deploy-hooks
$ErrorActionPreference = "Stop"

$isPlaceholder = [string]::IsNullOrWhiteSpace($HookUrl) -or $HookUrl -match '^\$\(.+\)$' -or $HookUrl -match 'srv-xxxx'
if ($isPlaceholder) {
    Write-Host "Deploy hook [$Env] no configurado; se omite (Render despliega por autoDeploy)." -ForegroundColor Yellow
    exit 0
}

$uri = $HookUrl
if ($Ref -and $HookUrl -notmatch '[?&]ref=') {
    $separator = if ($HookUrl.Contains('?')) { '&' } else { '?' }
    $uri = "$HookUrl${separator}ref=$Ref"
}

$attempt = 0
while ($attempt -lt $Retries) {
    $attempt++
    try {
        $resp = Invoke-WebRequest -Uri $uri -Method Post -UseBasicParsing -TimeoutSec 60
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "Deploy [$Env] disparado OK (HTTP $($resp.StatusCode), rama $Ref, build $ImageTag)" -ForegroundColor Green
            exit 0
        }
        throw "HTTP inesperado: $($resp.StatusCode)"
    } catch {
        Write-Warning "Intento $attempt/$Retries falló para deploy [$Env]: $($_.Exception.Message)"
        if ($attempt -lt $Retries) {
            Start-Sleep -Seconds (5 * $attempt)
        }
    }
}

Write-Error "No fue posible disparar el deploy [$Env] tras $Retries intentos."
exit 1
