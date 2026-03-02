param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot/../../..").Path,
  [string]$OutDir = "",
  [switch]$StartFrontend
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "[bootstrap] $msg"
}

function Test-PortOpen([int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(800)
    if ($ok -and $client.Connected) {
      $client.EndConnect($iar) | Out-Null
      $client.Close()
      return $true
    }
    $client.Close()
    return $false
  } catch {
    return $false
  }
}

function Wait-Http([string]$Url, [int]$TimeoutSec = 120) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
    try {
      $r = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 3 -SkipHttpErrorCheck
      if ($null -ne $r.StatusCode) { return $true }
    } catch {}
    Start-Sleep -Seconds 1
  }
  return $false
}

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutDir = Join-Path $RepoRoot "tests/ch6-validation/results/$timestamp"
}
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$procInfo = [ordered]@{
  timestamp = (Get-Date).ToString("o")
  repo_root = $RepoRoot
  out_dir = $OutDir
  frontend = @{ started_by_script = $false; pid = $null; port = 5173 }
  backend = @{ started_by_script = $false; pid = $null; port = 8081 }
  intelligence = @{ started_by_script = $false; pid = $null; port = 19191 }
}

Write-Step "Starting docker dependencies (postgres, redis, etcd, minio, milvus)"
Push-Location $RepoRoot
docker compose -f infra/docker-compose.yml up -d postgres redis etcd minio milvus | Out-Host
Pop-Location

if (-not (Test-PortOpen 8081)) {
  Write-Step "Starting backend (Spring Boot) on 8081"
  $backendLog = Join-Path $OutDir "backend.log"
  $p = Start-Process -FilePath "powershell" -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      "Set-Location '$RepoRoot/apps/backend/SMART-MALL'; mvn spring-boot:run *>&1 | Tee-Object -FilePath '$backendLog'"
    ) -PassThru -WindowStyle Hidden
  $procInfo.backend.started_by_script = $true
  $procInfo.backend.pid = $p.Id
} else {
  Write-Step "Backend already running on 8081"
}

if (-not (Test-PortOpen 19191)) {
  Write-Step "Starting intelligence service (uvicorn) on 19191"
  $aiLog = Join-Path $OutDir "intelligence.log"
  $p = Start-Process -FilePath "powershell" -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      "Set-Location '$RepoRoot/apps/intelligence/SMART-MALL'; uvicorn app.main:app --port 19191 *>&1 | Tee-Object -FilePath '$aiLog'"
    ) -PassThru -WindowStyle Hidden
  $procInfo.intelligence.started_by_script = $true
  $procInfo.intelligence.pid = $p.Id
} else {
  Write-Step "Intelligence service already running on 19191"
}

if (-not (Test-PortOpen 5173) -and $StartFrontend) {
  Write-Step "Starting frontend dev server on 5173"
  $feLog = Join-Path $OutDir "frontend.log"
  $p = Start-Process -FilePath "powershell" -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      "Set-Location '$RepoRoot'; pnpm --filter smart-mall dev *>&1 | Tee-Object -FilePath '$feLog'"
    ) -PassThru -WindowStyle Hidden
  $procInfo.frontend.started_by_script = $true
  $procInfo.frontend.pid = $p.Id
} elseif (Test-PortOpen 5173) {
  Write-Step "Frontend already running on 5173"
}

Write-Step "Waiting for service readiness"
$frontendUp = Wait-Http "http://localhost:5173/" 120
$backendUp = Wait-Http "http://localhost:8081/api/auth/login" 180
$aiUp = Wait-Http "http://localhost:19191/health" 180

$health = [ordered]@{
  collected_at = (Get-Date).ToString("o")
  endpoints = @(
    @{ url = "http://localhost:5173/"; up = $frontendUp },
    @{ url = "http://localhost:8081/api/health"; up = $backendUp },
    @{ url = "http://localhost:8081/api/ai/health"; up = $backendUp },
    @{ url = "http://localhost:19191/health"; up = $aiUp }
  )
}

$procPath = Join-Path $OutDir "processes.json"
$healthPath = Join-Path $OutDir "service-health.json"
$procInfo | ConvertTo-Json -Depth 10 | Set-Content -Path $procPath -Encoding UTF8
$health | ConvertTo-Json -Depth 10 | Set-Content -Path $healthPath -Encoding UTF8

Write-Step "Bootstrap done. Output: $OutDir"
Write-Output $OutDir

