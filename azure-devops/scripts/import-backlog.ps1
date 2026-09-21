# Requisitos: PowerShell 5.1+ / pwsh, y un Token PAT de Azure DevOps con permiso Work Items (Full).
# Uso:
#   ./import-backlog.ps1 -Organization "mi-organizacion" -Project "Fabrica_escuela_2026_1" `
#       -Pat "PAT" -CsvPath "backlog-fabrica_escuela_2026_1_import.csv" -Iteration "Fabrica_escuela_2026_1\Sprint 1"
param(
    [Parameter(Mandatory=$true)][string]$Organization,
    [Parameter(Mandatory=$true)][string]$Project,
    [Parameter(Mandatory=$true)][string]$Pat,
    [Parameter(Mandatory=$true)][string]$CsvPath,
    [string]$AreaPath = "",
    [string]$Iteration = ""
)

$ErrorActionPreference = "Stop"
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
$headers = @{ Authorization = "Basic $base64"; "Content-Type" = "application/json-patch+json" }
$api = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems"

function Crear-WorkItem {
    param(
        [string]$Tipo,
        [string]$Titulo,
        [string]$Descripcion,
        [string]$Prioridad,
        [string]$Sprint,
        [int]$ParentId
    )
    $patch = @(
        @{ op = "add"; path = "/fields/System.Title"; value = $Titulo }
        @{ op = "add"; path = "/fields/System.Description"; value = "<div>$($Descripcion -replace "`n","<br/>")</div>" }
    )
    if ($Prioridad -eq "Must") { $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 1 } }
    elseif ($Prioridad -eq "Should") { $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 2 } }
    else { $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 3 } }
    if ($Sprint) { $patch += @{ op = "add"; path = "/fields/System.IterationPath"; value = "$Project\$Sprint" } }
    if ($AreaPath) {
        $patch += @{ op = "add"; path = "/fields/System.AreaPath"; value = "$Project\$AreaPath" }
    } elseif ($ParentId) {
        $patch += @{ op = "add"; path = "/fields/System.AreaPath"; value = $Project }
    }

    $json = $patch | ConvertTo-Json -Depth 5
    $url = "$api/`$$Tipo`?api-version=7.1-preview.3"
    $resp = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $json
    $id = $resp.id
    if ($ParentId) {
        $link = @(@{ op = "add"; path = "/relations/-"; value = @{ rel = "System.LinkTypes.Hierarchy-Reverse"; url = "$api/$ParentId" } }) | ConvertTo-Json -Depth 6
        Invoke-RestMethod -Uri "$api/$id`?api-version=7.1-preview.3" -Method Patch -Headers $headers -Body $link | Out-Null
    }
    Write-Host "OK [$id] [$Tipo] $Titulo" -ForegroundColor Green
    return $id
}

$rows = Import-Csv -Path $CsvPath -Encoding UTF8

# 1) Crear épicas (clave = primer token del título: "E1")
$epicIds = @{}
foreach ($r in $rows | Where-Object { $_.WorkItemType -eq "Epic" }) {
    $id = Crear-WorkItem -Tipo "Epic" -Titulo $r.Titulo -Descripcion $r.CriteriosAceptacion -Prioridad "Must" -Sprint ""
    $epicIds[($r.Titulo -split " ")[0]] = $id
}

# 2) Crear historias bajo su épica ($r.Epic = "E1 Cuentas de usuario" -> clave "E1")
foreach ($r in $rows | Where-Object { $_.WorkItemType -ne "Epic" }) {
    $parent = $epicIds[($r.Epic -split " ")[0]]
    if (-not $parent) { $parent = $epicIds.Values | Select-Object -First 1 }
    Crear-WorkItem -Tipo $r.WorkItemType -Titulo $r.Titulo -Descripcion $r.CriteriosAceptacion `
        -Prioridad $r.Prioridad -Sprint $r.Sprint -ParentId $parent | Out-Null
}

Write-Host "`nBacklog importado correctamente en $Project" -ForegroundColor Cyan