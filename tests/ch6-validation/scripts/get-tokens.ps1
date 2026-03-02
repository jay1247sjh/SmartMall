param(
  [string]$BaseUrl = "http://localhost:8081",
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  throw "OutDir is required."
}

function Try-Login([string]$username, [string[]]$passwords) {
  foreach ($pwd in $passwords) {
    try {
      $body = @{
        username = $username
        password = $pwd
      } | ConvertTo-Json

      $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 15 -SkipHttpErrorCheck
      $code = [int]$resp.StatusCode
      $json = $null
      if ($resp.Content) { $json = $resp.Content | ConvertFrom-Json }

      if ($code -eq 200 -and $json.code -eq "0") {
        return @{
          success = $true
          username = $username
          password_used = $pwd
          accessToken = $json.data.accessToken
          refreshToken = $json.data.refreshToken
          user = $json.data.user
        }
      }
    } catch {}
  }
  return @{
    success = $false
    username = $username
    accessToken = $null
    refreshToken = $null
    user = $null
  }
}

$roles = [ordered]@{
  admin = @{ username = "admin"; passwords = @("123456", "admin123") }
  merchant = @{ username = "merchant"; passwords = @("123456", "merchant123") }
  user = @{ username = "user"; passwords = @("123456", "user123") }
}

$tokens = [ordered]@{
  collected_at = (Get-Date).ToString("o")
  base_url = $BaseUrl
  admin = Try-Login $roles.admin.username $roles.admin.passwords
  merchant = Try-Login $roles.merchant.username $roles.merchant.passwords
  user = Try-Login $roles.user.username $roles.user.passwords
}

$path = Join-Path $OutDir "tokens.json"
$tokens | ConvertTo-Json -Depth 10 | Set-Content -Path $path -Encoding UTF8
Write-Output $path

