param(
  [string]$BaseUrl = "http://localhost:8081",
  [string]$OutDir = "",
  [string]$ConfigPath = "",
  [int]$Samples = 30
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  throw "OutDir is required."
}
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $PSScriptRoot "../config/ai-cases.json"
}

$tokensPath = Join-Path $OutDir "tokens.json"
if (-not (Test-Path $tokensPath)) {
  & "$PSScriptRoot/get-tokens.ps1" -BaseUrl $BaseUrl -OutDir $OutDir | Out-Null
}

$tokens = Get-Content -Path $tokensPath -Raw | ConvertFrom-Json
$cases = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json

$actor = $null
foreach ($role in @("user", "admin", "merchant")) {
  $node = $tokens.$role
  if ($null -ne $node -and $node.success -and -not [string]::IsNullOrWhiteSpace([string]$node.accessToken)) {
    $actor = [ordered]@{
      role = $role
      username = [string]$node.username
      password = [string]$node.password_used
      accessToken = [string]$node.accessToken
    }
    break
  }
}

if ($null -eq $actor) {
  throw "No valid token available (user/admin/merchant). Cannot run AI performance tests."
}

if ([string]::IsNullOrWhiteSpace($actor.password)) {
  # 回退默认密码，避免历史 tokens.json 缺失 password_used 时无法自动续期
  $actor.password = "123456"
}

function Refresh-ActorToken {
  param(
    [string]$Username,
    [string]$Password
  )
  try {
    $body = @{
      username = $Username
      password = $Password
    } | ConvertTo-Json -Depth 5 -Compress
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30 -SkipHttpErrorCheck
    if ($resp.StatusCode -eq 200 -and $resp.Content) {
      $json = $resp.Content | ConvertFrom-Json
      if ($json.code -eq "0" -and $json.data.accessToken) {
        return [string]$json.data.accessToken
      }
    }
  } catch {}
  return $null
}

function Get-Percentile([double[]]$values, [double]$percentile) {
  if ($null -eq $values -or $values.Count -eq 0) { return 0.0 }
  $sorted = $values | Sort-Object
  $rank = [math]::Ceiling(($percentile / 100.0) * $sorted.Count)
  if ($rank -lt 1) { $rank = 1 }
  if ($rank -gt $sorted.Count) { $rank = $sorted.Count }
  return [math]::Round([double]$sorted[$rank - 1], 2)
}

function Invoke-AiChat {
  param(
    [string]$CaseId,
    [string]$CaseName,
    [string]$Message,
    [string]$ExpectedType
  )

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $body = @{ message = $Message } | ConvertTo-Json -Depth 8 -Compress
    $headers = @{ Authorization = "Bearer $($actor.accessToken)" }
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/ai/chat" -Method POST -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 120 -SkipHttpErrorCheck

    if ($resp.StatusCode -eq 401) {
      $newToken = Refresh-ActorToken -Username $actor.username -Password $actor.password
      if (-not [string]::IsNullOrWhiteSpace($newToken)) {
        $actor.accessToken = $newToken
        $headers = @{ Authorization = "Bearer $($actor.accessToken)" }
        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/ai/chat" -Method POST -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 120 -SkipHttpErrorCheck
      }
    }
    $sw.Stop()

    $json = $null
    if ($resp.Content) {
      try { $json = $resp.Content | ConvertFrom-Json } catch {}
    }
    $codeOk = ($null -ne $json -and [string]$json.code -eq "0")
    $dtype = "error"
    if ($null -ne $json -and $null -ne $json.data -and -not [string]::IsNullOrWhiteSpace([string]$json.data.type)) {
      $dtype = [string]$json.data.type
    }
    $ok = ([int]$resp.StatusCode -eq 200) -and $codeOk -and ($dtype -ne "error")
    if (-not [string]::IsNullOrWhiteSpace($ExpectedType)) {
      $ok = $ok -and ($dtype -eq $ExpectedType)
    }

    return [pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      timestamp = (Get-Date).ToString("o")
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      status = if ($ok) { "pass" } else { "fail" }
      http_code = [int]$resp.StatusCode
      error = ""
      response_type = $dtype
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
      response_type = "error"
    }
  }
}

$rows = New-Object System.Collections.Generic.List[object]

foreach ($c in $cases) {
  for ($i = 1; $i -le $Samples; $i++) {
    $row = Invoke-AiChat -CaseId $c.case_id -CaseName $c.name -Message $c.message -ExpectedType ([string]$c.expected_type)
    $rows.Add($row) | Out-Null
  }
}

$summary = $rows |
  Group-Object -Property case_id |
  ForEach-Object {
    $grp = $_.Group
    $lat = @($grp | ForEach-Object { [double]$_.latency_ms })
    $total = $grp.Count
    $pass = @($grp | Where-Object { $_.status -eq "pass" }).Count
    $textCnt = @($grp | Where-Object { $_.response_type -eq "text" }).Count
    $confirmCnt = @($grp | Where-Object { $_.response_type -eq "confirmation_required" }).Count
    $errorCnt = @($grp | Where-Object { $_.response_type -eq "error" }).Count
    [pscustomobject]@{
      case_id = $_.Name
      case_name = $grp[0].case_name
      samples = $total
      success = $pass
      failed = ($total - $pass)
      success_rate = [math]::Round(($pass * 100.0 / [math]::Max($total, 1)), 2)
      error_rate = [math]::Round((($total - $pass) * 100.0 / [math]::Max($total, 1)), 2)
      avg_ms = [math]::Round((($lat | Measure-Object -Average).Average), 2)
      p50_ms = Get-Percentile -values $lat -percentile 50
      p95_ms = Get-Percentile -values $lat -percentile 95
      min_ms = [math]::Round((($lat | Measure-Object -Minimum).Minimum), 2)
      max_ms = [math]::Round((($lat | Measure-Object -Maximum).Maximum), 2)
      type_text = $textCnt
      type_confirmation_required = $confirmCnt
      type_error = $errorCnt
    }
  }

$rawPath = Join-Path $OutDir "ai-latency-raw.csv"
$summaryPath = Join-Path $OutDir "ai-latency-summary.csv"

$rows | Select-Object case_id, timestamp, latency_ms, status, http_code, error, response_type, case_name | Export-Csv -Path $rawPath -NoTypeInformation -Encoding UTF8
$summary | Export-Csv -Path $summaryPath -NoTypeInformation -Encoding UTF8

Write-Output $summaryPath
