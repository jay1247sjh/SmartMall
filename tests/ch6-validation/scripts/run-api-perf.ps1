param(
  [string]$BaseUrl = "http://localhost:8081",
  [string]$OutDir = "",
  [string]$ConfigPath = "",
  [int]$Samples = 30,
  [int]$Concurrency = 20
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  throw "OutDir is required."
}
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $PSScriptRoot "../config/perf-cases.json"
}

$tokensPath = Join-Path $OutDir "tokens.json"
if (-not (Test-Path $tokensPath)) {
  & "$PSScriptRoot/get-tokens.ps1" -BaseUrl $BaseUrl -OutDir $OutDir | Out-Null
}

$tokens = Get-Content -Path $tokensPath -Raw | ConvertFrom-Json
$config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json

function Get-Percentile([double[]]$values, [double]$percentile) {
  if ($null -eq $values -or $values.Count -eq 0) { return 0.0 }
  $sorted = $values | Sort-Object
  $rank = [math]::Ceiling(($percentile / 100.0) * $sorted.Count)
  if ($rank -lt 1) { $rank = 1 }
  if ($rank -gt $sorted.Count) { $rank = $sorted.Count }
  return [math]::Round([double]$sorted[$rank - 1], 2)
}

function New-AuthHeaders([string]$authType) {
  if ($authType -eq "none") { return @{} }
  $token = $tokens.$authType.accessToken
  if ([string]::IsNullOrWhiteSpace($token)) { return @{} }
  return @{ Authorization = "Bearer $token" }
}

function Test-ApiSuccess([int]$statusCode, [object]$json) {
  if ($statusCode -lt 200 -or $statusCode -ge 300) { return $false }
  if ($null -eq $json) { return $true }
  if ($json.PSObject.Properties.Name -contains "code") {
    return [string]$json.code -eq "0"
  }
  return $true
}

function Invoke-ApiRequest {
  param(
    [string]$CaseId,
    [string]$CaseName,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body,
    [int]$TimeoutSec = 60
  )

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $params = @{
      Uri = $Url
      Method = $Method
      TimeoutSec = $TimeoutSec
      SkipHttpErrorCheck = $true
    }
    if ($Headers -and $Headers.Count -gt 0) {
      $params.Headers = $Headers
    }
    if ($null -ne $Body) {
      $params.ContentType = "application/json"
      $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }
    $resp = Invoke-WebRequest @params
    $sw.Stop()

    $json = $null
    if ($resp.Content) {
      try { $json = $resp.Content | ConvertFrom-Json } catch {}
    }
    $ok = Test-ApiSuccess -statusCode ([int]$resp.StatusCode) -json $json
    return [pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      timestamp = (Get-Date).ToString("o")
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      status = if ($ok) { "pass" } else { "fail" }
      http_code = [int]$resp.StatusCode
      error = ""
    }
  } catch {
    $sw.Stop()
    return [pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      timestamp = (Get-Date).ToString("o")
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      status = "fail"
      http_code = 0
      error = $_.Exception.Message
    }
  }
}

$rawRows = New-Object System.Collections.Generic.List[object]
$summaryRows = New-Object System.Collections.Generic.List[object]

foreach ($case in $config.api_sequential) {
  $headers = New-AuthHeaders -authType $case.auth
  $body = $null
  if ($null -ne $case.body) {
    $body = @{}
    foreach ($p in $case.body.PSObject.Properties) {
      $body[$p.Name] = $p.Value
    }
  }

  # 与真实账号一致，避免密码漂移导致基准失真
  if ($case.path -eq "/api/auth/login" -and $null -ne $body -and $body.ContainsKey("username")) {
    $username = [string]$body["username"]
    $tokenNode = $tokens.$username
    if ($null -ne $tokenNode -and $tokenNode.success -and -not [string]::IsNullOrWhiteSpace([string]$tokenNode.password_used)) {
      $body["password"] = [string]$tokenNode.password_used
    }
  }

  $caseTimer = [System.Diagnostics.Stopwatch]::StartNew()
  for ($i = 1; $i -le $Samples; $i++) {
    $row = Invoke-ApiRequest `
      -CaseId $case.case_id `
      -CaseName $case.name `
      -Method $case.method `
      -Url "$BaseUrl$($case.path)" `
      -Headers $headers `
      -Body $body
    $rawRows.Add($row) | Out-Null
  }
  $caseTimer.Stop()

  $rows = $rawRows | Where-Object { $_.case_id -eq $case.case_id }
  $latency = @($rows | ForEach-Object { [double]$_.latency_ms })
  $passed = @($rows | Where-Object { $_.status -eq "pass" }).Count
  $total = $rows.Count
  $durationSec = [math]::Max($caseTimer.Elapsed.TotalSeconds, 0.001)
  $summaryRows.Add([pscustomobject]@{
      case_id = $case.case_id
      case_name = $case.name
      samples = $total
      success = $passed
      failed = ($total - $passed)
      success_rate = [math]::Round(($passed * 100.0 / [math]::Max($total, 1)), 2)
      error_rate = [math]::Round((($total - $passed) * 100.0 / [math]::Max($total, 1)), 2)
      avg_ms = [math]::Round((($latency | Measure-Object -Average).Average), 2)
      p50_ms = Get-Percentile -values $latency -percentile 50
      p95_ms = Get-Percentile -values $latency -percentile 95
      min_ms = [math]::Round((($latency | Measure-Object -Minimum).Minimum), 2)
      max_ms = [math]::Round((($latency | Measure-Object -Maximum).Maximum), 2)
      throughput_req_s = [math]::Round(($total / $durationSec), 2)
    }) | Out-Null
}

# 并发压测（关键接口）
$conc = $config.api_concurrency
if ($Concurrency -gt 0) {
  $concConcurrency = $Concurrency
} else {
  $concConcurrency = [int]$conc.concurrency
}
$totalRequests = [int]$conc.total_requests
$concHeaders = New-AuthHeaders -authType $conc.auth
$concBody = $null
if ($null -ne $conc.body) {
  $concBody = @{}
  foreach ($p in $conc.body.PSObject.Properties) {
    $concBody[$p.Name] = $p.Value
  }
}
$bodyJson = if ($null -ne $concBody) { $concBody | ConvertTo-Json -Depth 20 -Compress } else { $null }

$jobScript = {
  param(
    [string]$CaseId,
    [string]$CaseName,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [string]$BodyJson
  )
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $params = @{
      Uri = $Url
      Method = $Method
      TimeoutSec = 60
      SkipHttpErrorCheck = $true
    }
    if ($null -ne $Headers -and $Headers.Count -gt 0) {
      $params.Headers = $Headers
    }
    if (-not [string]::IsNullOrWhiteSpace($BodyJson)) {
      $params.ContentType = "application/json"
      $params.Body = $BodyJson
    }
    $resp = Invoke-WebRequest @params
    $sw.Stop()

    $json = $null
    if ($resp.Content) {
      try { $json = $resp.Content | ConvertFrom-Json } catch {}
    }
    $ok = $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300
    if ($null -ne $json -and ($json.PSObject.Properties.Name -contains "code")) {
      $ok = $ok -and ([string]$json.code -eq "0")
    }

    [pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      timestamp = (Get-Date).ToString("o")
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      status = if ($ok) { "pass" } else { "fail" }
      http_code = [int]$resp.StatusCode
      error = ""
    }
  } catch {
    $sw.Stop()
    [pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      timestamp = (Get-Date).ToString("o")
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      status = "fail"
      http_code = 0
      error = $_.Exception.Message
    }
  }
}

$concRows = New-Object System.Collections.Generic.List[object]
$concTimer = [System.Diagnostics.Stopwatch]::StartNew()
for ($offset = 1; $offset -le $totalRequests; $offset += $concConcurrency) {
  $batchEnd = [math]::Min($offset + $concConcurrency - 1, $totalRequests)
  $jobs = @()
  for ($idx = $offset; $idx -le $batchEnd; $idx++) {
    $jobs += Start-Job -ScriptBlock $jobScript -ArgumentList @(
      [string]$conc.case_id,
      [string]$conc.name,
      [string]$conc.method,
      "$BaseUrl$($conc.path)",
      $concHeaders,
      $bodyJson
    )
  }
  if ($jobs.Count -gt 0) {
    $jobs | Wait-Job | Out-Null
    foreach ($j in $jobs) {
      $rec = Receive-Job -Job $j
      if ($null -ne $rec) { $concRows.Add($rec) | Out-Null }
      Remove-Job -Job $j -Force | Out-Null
    }
  }
}
$concTimer.Stop()

$concLatency = @($concRows | ForEach-Object { [double]$_.latency_ms })
$concPassed = @($concRows | Where-Object { $_.status -eq "pass" }).Count
$concTotal = $concRows.Count
$concDurationSec = [math]::Max($concTimer.Elapsed.TotalSeconds, 0.001)
$concurrencySummary = [pscustomobject]@{
  case_id = $conc.case_id
  case_name = $conc.name
  concurrency = $concConcurrency
  total_requests = $concTotal
  success = $concPassed
  failed = ($concTotal - $concPassed)
  success_rate = [math]::Round(($concPassed * 100.0 / [math]::Max($concTotal, 1)), 2)
  error_rate = [math]::Round((($concTotal - $concPassed) * 100.0 / [math]::Max($concTotal, 1)), 2)
  avg_ms = [math]::Round((($concLatency | Measure-Object -Average).Average), 2)
  p50_ms = Get-Percentile -values $concLatency -percentile 50
  p95_ms = Get-Percentile -values $concLatency -percentile 95
  min_ms = [math]::Round((($concLatency | Measure-Object -Minimum).Minimum), 2)
  max_ms = [math]::Round((($concLatency | Measure-Object -Maximum).Maximum), 2)
  throughput_req_s = [math]::Round(($concTotal / $concDurationSec), 2)
}

$rawPath = Join-Path $OutDir "api-latency-raw.csv"
$summaryPath = Join-Path $OutDir "api-latency-summary.csv"
$concSummaryPath = Join-Path $OutDir "api-concurrency-summary.csv"

$rawRows | Select-Object case_id, timestamp, latency_ms, status, http_code, error, case_name | Export-Csv -Path $rawPath -NoTypeInformation -Encoding UTF8
$summaryRows | Export-Csv -Path $summaryPath -NoTypeInformation -Encoding UTF8
@($concurrencySummary) | Export-Csv -Path $concSummaryPath -NoTypeInformation -Encoding UTF8

Write-Output $summaryPath
