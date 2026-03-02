param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot/../../..").Path,
  [string]$OutDir = "",
  [switch]$StopDocker
)

$ErrorActionPreference = "Continue"

function Write-Step($msg) {
  Write-Host "[teardown] $msg"
}

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  Write-Step "OutDir not provided, only optional docker teardown will run."
} else {
  $procPath = Join-Path $OutDir "processes.json"
  if (Test-Path $procPath) {
    $procInfo = Get-Content -Path $procPath -Raw | ConvertFrom-Json
    foreach ($svc in @("frontend", "backend", "intelligence")) {
      $meta = $procInfo.$svc
      if ($null -ne $meta -and $meta.started_by_script -and $meta.pid) {
        try {
          $p = Get-Process -Id ([int]$meta.pid) -ErrorAction Stop
          Write-Step "Stopping $svc pid=$($meta.pid)"
          Stop-Process -Id ([int]$meta.pid) -Force -ErrorAction Stop
        } catch {
          Write-Step "$svc pid=$($meta.pid) already exited."
        }
      }
    }
  } else {
    Write-Step "processes.json not found under $OutDir"
  }
}

if ($StopDocker) {
  Write-Step "Stopping docker compose dependencies"
  Push-Location $RepoRoot
  docker compose -f infra/docker-compose.yml stop postgres redis etcd minio milvus | Out-Host
  Pop-Location
}

Write-Step "Teardown done."

