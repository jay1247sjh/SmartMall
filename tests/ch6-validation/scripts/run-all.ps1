param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot/../../..").Path,
  [int]$Samples = 30,
  [int]$FunctionalRepetitions = 3,
  [int]$Concurrency = 20,
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw "run-all.ps1 requires PowerShell 7+. Please run: pwsh -File tests/ch6-validation/scripts/run-all.ps1 ..."
}

function Write-Step([string]$msg) {
  Write-Host "[run-all] $msg"
}

function Get-CommandFirstLine([string]$command, [string[]]$arguments) {
  try {
    $output = & $command @arguments 2>&1
    if ($null -eq $output -or $output.Count -eq 0) { return "N/A" }
    return ([string]($output | Select-Object -First 1)).Trim()
  } catch {
    return "N/A"
  }
}

function Invoke-Health {
  param(
    [string]$Url,
    [hashtable]$Headers = @{}
  )
  try {
    $params = @{
      Uri = $Url
      Method = "GET"
      TimeoutSec = 8
      SkipHttpErrorCheck = $true
    }
    if ($Headers -and $Headers.Count -gt 0) { $params.Headers = $Headers }
    $resp = Invoke-WebRequest @params
    return [ordered]@{
      url = $Url
      up = ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500)
      http_code = [int]$resp.StatusCode
      error = ""
      timestamp = (Get-Date).ToString("o")
    }
  } catch {
    return [ordered]@{
      url = $Url
      up = $false
      http_code = 0
      error = $_.Exception.Message
      timestamp = (Get-Date).ToString("o")
    }
  }
}

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutDir = Join-Path $RepoRoot "tests/ch6-validation/results/$timestamp"
}
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

Write-Step "Result directory: $OutDir"

$runMeta = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  out_dir = $OutDir
  params = [ordered]@{
    samples = $Samples
    functional_repetitions = $FunctionalRepetitions
    concurrency = $Concurrency
  }
}
$runMetaPath = Join-Path $OutDir "run-meta.json"
$runMeta | ConvertTo-Json -Depth 10 | Set-Content -Path $runMetaPath -Encoding UTF8

Write-Step "Bootstrap stack (docker + backend + intelligence + frontend auto-start)"
& "$PSScriptRoot/bootstrap-stack.ps1" -RepoRoot $RepoRoot -OutDir $OutDir -StartFrontend | Out-Null

Write-Step "Collecting service health"
$healthRows = @()
$healthRows += Invoke-Health -Url "http://localhost:5173"
$healthRows += Invoke-Health -Url "http://localhost:8081/api/health"
$healthRows += Invoke-Health -Url "http://localhost:8081/api/ai/health"
$healthRows += Invoke-Health -Url "http://localhost:19191/health"

$tokensPath = Join-Path $OutDir "tokens.json"
if (($healthRows | Where-Object { $_.url -eq "http://localhost:8081/api/ai/health" }).http_code -eq 401) {
  & "$PSScriptRoot/get-tokens.ps1" -BaseUrl "http://localhost:8081" -OutDir $OutDir | Out-Null
  if (Test-Path $tokensPath) {
    $tokens = Get-Content -Path $tokensPath -Raw | ConvertFrom-Json
    if ($tokens.admin.success -and $tokens.admin.accessToken) {
      $aiHealth = Invoke-Health -Url "http://localhost:8081/api/ai/health" -Headers @{ Authorization = "Bearer $($tokens.admin.accessToken)" }
      $healthRows = @($healthRows | Where-Object { $_.url -ne "http://localhost:8081/api/ai/health" })
      $healthRows += $aiHealth
    }
  }
}

$serviceHealth = [ordered]@{
  collected_at = (Get-Date).ToString("o")
  endpoints = $healthRows
}
$serviceHealth | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $OutDir "service-health.json") -Encoding UTF8

Write-Step "Collecting environment baseline"
$osInfo = $null
$cpuInfo = $null
try { $osInfo = Get-CimInstance Win32_OperatingSystem } catch {}
try { $cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1 } catch {}

$envData = [ordered]@{
  collected_at = (Get-Date).ToString("o")
  os = [ordered]@{
    caption = if ($osInfo) { [string]$osInfo.Caption } else { "N/A" }
    version = if ($osInfo) { [string]$osInfo.Version } else { "N/A" }
    build = if ($osInfo) { [string]$osInfo.BuildNumber } else { "N/A" }
  }
  cpu = [ordered]@{
    name = if ($cpuInfo) { [string]$cpuInfo.Name } else { "N/A" }
    cores = if ($cpuInfo) { [int]$cpuInfo.NumberOfCores } else { 0 }
    logical_processors = if ($cpuInfo) { [int]$cpuInfo.NumberOfLogicalProcessors } else { 0 }
  }
  memory_gb = if ($osInfo) { [math]::Round(($osInfo.TotalVisibleMemorySize / 1MB), 2) } else { 0 }
  versions = [ordered]@{
    node = Get-CommandFirstLine -command "node" -arguments @("-v")
    pnpm = Get-CommandFirstLine -command "pnpm" -arguments @("-v")
    java = Get-CommandFirstLine -command "java" -arguments @("-version")
    maven = Get-CommandFirstLine -command "mvn" -arguments @("-v")
    python = Get-CommandFirstLine -command "python" -arguments @("--version")
  }
  ports = [ordered]@{
    frontend = 5173
    backend = 8081
    intelligence = 19191
  }
  services = $healthRows
  browser = [ordered]@{
    version = "N/A"
    user_agent = "N/A"
  }
}

$envPath = Join-Path $OutDir "env.json"
$envData | ConvertTo-Json -Depth 10 | Set-Content -Path $envPath -Encoding UTF8

Write-Step "Fetching role tokens"
& "$PSScriptRoot/get-tokens.ps1" -BaseUrl "http://localhost:8081" -OutDir $OutDir | Out-Null

Write-Step "Running functional tests (6.2 data source)"
& "$PSScriptRoot/run-functional.ps1" -BaseUrl "http://localhost:8081" -OutDir $OutDir -Repetitions $FunctionalRepetitions | Out-Null

Write-Step "Running API performance tests (6.3 data source)"
& "$PSScriptRoot/run-api-perf.ps1" -BaseUrl "http://localhost:8081" -OutDir $OutDir -Samples $Samples -Concurrency $Concurrency | Out-Null

Write-Step "Running AI performance tests (6.3 data source)"
& "$PSScriptRoot/run-ai-perf.ps1" -BaseUrl "http://localhost:8081" -OutDir $OutDir -Samples $Samples | Out-Null

$feToolDir = Join-Path $RepoRoot "tests/ch6-validation"
if (-not (Test-Path (Join-Path $feToolDir "node_modules/playwright"))) {
  Write-Step "Installing frontend perf dependencies (playwright)"
  npm install --prefix $feToolDir | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "npm install failed for frontend perf toolchain." }
}

Write-Step "Ensuring Chromium is installed for frontend perf"
npm exec --prefix $feToolDir playwright install chromium | Out-Host
if ($LASTEXITCODE -ne 0) { throw "Chromium install failed." }

Write-Step "Running frontend performance tests (Playwright)"
node "$PSScriptRoot/run-frontend-perf.mjs" --outDir "$OutDir" --samples "$Samples" --config "$RepoRoot/tests/ch6-validation/config/perf-cases.json" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Frontend performance script failed." }

$browserMetaPath = Join-Path $OutDir "frontend-browser.json"
if (Test-Path $browserMetaPath) {
  $browserMeta = Get-Content -Path $browserMetaPath -Raw | ConvertFrom-Json
  $envData.browser.version = [string]$browserMeta.version
  $envData.browser.user_agent = [string]$browserMeta.user_agent
  $envData | ConvertTo-Json -Depth 10 | Set-Content -Path $envPath -Encoding UTF8
}

Write-Step "Aggregating results and exporting thesis snippets"
python "$PSScriptRoot/aggregate-results.py" --out-dir "$OutDir" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "aggregate-results.py failed." }
python "$PSScriptRoot/export-thesis-snippets.py" --out-dir "$OutDir" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "export-thesis-snippets.py failed." }

$runMeta.generated_at = (Get-Date).ToString("o")
$runMeta | ConvertTo-Json -Depth 10 | Set-Content -Path $runMetaPath -Encoding UTF8

Write-Step "All checks done."
Write-Output $OutDir
