param(
  [string]$BaseUrl = "http://localhost:8081",
  [string]$OutDir = "",
  [string]$ConfigPath = "",
  [int]$Repetitions = 3
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutDir)) { throw "OutDir is required." }
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $PSScriptRoot "../config/functional-cases.json"
}

$tokensPath = Join-Path $OutDir "tokens.json"
if (-not (Test-Path $tokensPath)) {
  & "$PSScriptRoot/get-tokens.ps1" -BaseUrl $BaseUrl -OutDir $OutDir | Out-Null
}

$tokens = Get-Content -Path $tokensPath -Raw | ConvertFrom-Json
$cases = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
$raw = New-Object System.Collections.Generic.List[object]

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body,
    [int]$TimeoutSec = 60
  )
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $jsonBody = $null
    $params = @{
      Uri = $Url
      Method = $Method
      TimeoutSec = $TimeoutSec
      SkipHttpErrorCheck = $true
    }
    if ($Headers) { $params.Headers = $Headers }
    if ($null -ne $Body) {
      $jsonBody = ($Body | ConvertTo-Json -Depth 20 -Compress)
      $params.ContentType = "application/json"
      $params.Body = $jsonBody
    }
    $resp = Invoke-WebRequest @params
    $sw.Stop()
    $obj = $null
    if ($resp.Content) {
      try { $obj = $resp.Content | ConvertFrom-Json } catch {}
    }
    return @{
      status = [int]$resp.StatusCode
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      json = $obj
      error = $null
    }
  } catch {
    $sw.Stop()
    return @{
      status = 0
      latency_ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
      json = $null
      error = $_.Exception.Message
    }
  }
}

function Get-AuthHeader([string]$roleKey) {
  $token = $tokens.$roleKey.accessToken
  if ([string]::IsNullOrWhiteSpace($token)) { return @{} }
  return @{ Authorization = "Bearer $token" }
}

function Add-Record {
  param(
    [string]$CaseId,
    [string]$CaseName,
    [int]$Iteration,
    [string]$Role,
    [int]$HttpStatus,
    [double]$Latency,
    [bool]$Passed,
    [string]$Details,
    [string]$Error = ""
  )
  $status = if ($Passed) { "pass" } else { "fail" }
  $raw.Add([pscustomobject]@{
      case_id = $CaseId
      case_name = $CaseName
      iteration = $Iteration
      role = $Role
      timestamp = (Get-Date).ToString("o")
      latency_ms = $Latency
      status = $status
      http_code = $HttpStatus
      error = $Error
      passed = $Passed
      details = $Details
    }) | Out-Null
}

function To-Err([object]$v) {
  if ($null -eq $v) { return "" }
  return [string]$v
}

foreach ($c in $cases) {
  switch ($c.type) {
    "auth_login" {
      for ($i=1; $i -le $Repetitions; $i++) {
        $pwd = if ($tokens.($c.username).success) { $tokens.($c.username).password_used } else { "123456" }
        $result = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
          username = $c.username
          password = $pwd
        } -Headers @{}
        $ok = ($result.status -eq 200 -and $result.json -and $result.json.code -eq "0" -and $result.json.data.accessToken)
          Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details ("login") -Error (To-Err $result.error)
      }
    }
    "user_routes_by_role" {
      foreach ($role in $c.roles) {
        $roleKey = $role.ToLower()
        for ($i=1; $i -le $Repetitions; $i++) {
          $result = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl/api/user/routes" -Headers (Get-AuthHeader $roleKey) -Body $null
          $ok = ($result.status -eq 200 -and $result.json -and $result.json.code -eq "0" -and $null -ne $result.json.data)
          Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details "dynamic routes" -Error (To-Err $result.error)
        }
      }
    }
    "role_forbidden" {
      $roleKey = $c.role.ToLower()
      for ($i=1; $i -le $Repetitions; $i++) {
        $result = Invoke-JsonRequest -Method $c.method -Url "$BaseUrl$($c.path)" -Headers (Get-AuthHeader $roleKey) -Body $null
        $ok = ($result.status -eq [int]$c.expected_status)
        Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details "forbidden check" -Error (To-Err $result.error)
      }
    }
    "role_allowed" {
      $roleKey = $c.role.ToLower()
      for ($i=1; $i -le $Repetitions; $i++) {
        $result = Invoke-JsonRequest -Method $c.method -Url "$BaseUrl$($c.path)" -Headers (Get-AuthHeader $roleKey) -Body $null
        $ok = ($result.status -eq [int]$c.expected_status -and $result.json -and ($result.json.code -eq "0"))
        Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details "allowed check" -Error (To-Err $result.error)
      }
    }
    "ai_health" {
      $roleKey = $c.role.ToLower()
      for ($i=1; $i -le $Repetitions; $i++) {
        $result = Invoke-JsonRequest -Method "GET" -Url "$BaseUrl$($c.path)" -Headers (Get-AuthHeader $roleKey) -Body $null
        $ok = ($result.status -eq [int]$c.expected_status -and $result.json -and $result.json.code -eq "0")
        Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details "ai health" -Error (To-Err $result.error)
      }
    }
    "ai_chat" {
      $roleKey = $c.role.ToLower()
      for ($i=1; $i -le $Repetitions; $i++) {
        $result = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/ai/chat" -Headers (Get-AuthHeader $roleKey) -Body @{
          message = $c.message
        } -TimeoutSec 120
        $ok = ($result.status -eq [int]$c.expected_status -and $result.json -and $result.json.code -eq "0" -and $result.json.data.type)
        $dtype = if ($result.json -and $result.json.data) { [string]$result.json.data.type } else { "none" }
        Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $result.status -Latency $result.latency_ms -Passed $ok -Details "type=$dtype" -Error (To-Err $result.error)
      }
    }
    "ai_confirm_chain" {
      $roleKey = $c.role.ToLower()
      for ($i=1; $i -le $Repetitions; $i++) {
        $triggered = $false
        $action = $null
        $args = @{}
        $chatLatency = 0.0
        foreach ($msg in $c.trigger_messages) {
          $chat = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/ai/chat" -Headers (Get-AuthHeader $roleKey) -Body @{ message = $msg } -TimeoutSec 120
          $chatLatency = $chat.latency_ms
          if ($chat.status -eq 200 -and $chat.json -and $chat.json.code -eq "0" -and $chat.json.data.type -eq "confirmation_required") {
            $triggered = $true
            $action = $chat.json.data.action
            $args = if ($chat.json.data.args) { $chat.json.data.args } else { @{} }
            break
          }
        }
        if ($triggered) {
          $confirm = Invoke-JsonRequest -Method "POST" -Url "$BaseUrl/api/ai/confirm" -Headers (Get-AuthHeader $roleKey) -Body @{
            action = $action
            args = $args
            confirmed = $false
          } -TimeoutSec 120
          $ok = ($confirm.status -eq [int]$c.expected_status -and $confirm.json -and $confirm.json.code -eq "0")
          Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus $confirm.status -Latency ($chatLatency + $confirm.latency_ms) -Passed $ok -Details "confirm_cancel action=$action" -Error (To-Err $confirm.error)
        } else {
          Add-Record -CaseId $c.case_id -CaseName $c.name -Iteration $i -Role $c.role -HttpStatus 200 -Latency $chatLatency -Passed $false -Details "confirmation_not_triggered" -Error "confirmation_not_triggered"
        }
      }
    }
    default {
      Write-Warning "Unknown case type: $($c.type)"
    }
  }
}

$rawJsonPath = Join-Path $OutDir "functional-raw.json"
$rawCsvPath = Join-Path $OutDir "functional-raw.csv"
$summaryCsvPath = Join-Path $OutDir "functional-summary.csv"
$summaryJsonPath = Join-Path $OutDir "functional-summary.json"

$raw | ConvertTo-Json -Depth 10 | Set-Content -Path $rawJsonPath -Encoding UTF8
$raw | Export-Csv -Path $rawCsvPath -NoTypeInformation -Encoding UTF8

$summary = $raw |
  Group-Object -Property case_id |
  ForEach-Object {
    $grp = $_.Group
    $total = $grp.Count
    $passed = ($grp | Where-Object { $_.passed }).Count
    $avgLatency = [math]::Round((($grp | Measure-Object -Property latency_ms -Average).Average), 2)
    [pscustomobject]@{
      case_id = $_.Name
      case_name = ($grp[0].case_name)
      samples = $total
      passed = $passed
      failed = ($total - $passed)
      pass_rate = [math]::Round(($passed * 100.0 / [math]::Max($total,1)), 2)
      avg_latency_ms = $avgLatency
      min_latency_ms = [math]::Round((($grp | Measure-Object -Property latency_ms -Minimum).Minimum), 2)
      max_latency_ms = [math]::Round((($grp | Measure-Object -Property latency_ms -Maximum).Maximum), 2)
    }
  }

$summary | Export-Csv -Path $summaryCsvPath -NoTypeInformation -Encoding UTF8

$totalSamples = $raw.Count
$totalPassed = ($raw | Where-Object { $_.passed }).Count
$functionalSummary = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  total_samples = $totalSamples
  passed = $totalPassed
  failed = ($totalSamples - $totalPassed)
  pass_rate = [math]::Round(($totalPassed * 100.0 / [math]::Max($totalSamples,1)), 2)
  cases = $summary
}

$functionalSummary | ConvertTo-Json -Depth 10 | Set-Content -Path $summaryJsonPath -Encoding UTF8
Write-Output $summaryJsonPath
