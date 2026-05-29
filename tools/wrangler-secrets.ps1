<#
.SYNOPSIS
  Load a .env file and upload each variable as a Wrangler secret.

.DESCRIPTION
  Reads a .env file (KEY=VALUE format), ignoring blank lines and comments
  (lines starting with '#'), trims whitespace, unquotes values if wrapped
  in single or double quotes, then uploads each variable as a Wrangler secret.

.PARAMETER EnvPath
  Path to the .env file. Defaults to ".env" in the current directory.

.PARAMETER WranglerPath
  Path to the wrangler executable. Defaults to "wrangler" (from PATH).

.EXAMPLE
  ./tools/wrangler-secrets.ps1

.EXAMPLE
  ./tools/wrangler-secrets.ps1 -EnvPath ./env.example -WranglerPath ./node_modules/.bin/wrangler
#>

[CmdletBinding()]
param(
  [string]$EnvPath = ".env",
  [string]$WranglerPath = "wrangler"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $EnvPath)) {
  throw "Env file not found: $EnvPath"
}

$lines = Get-Content -Path $EnvPath -ErrorAction Stop

function Convert-EnvValue {
  param([string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  $trimmed = $Value.Trim()
  if (($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
      ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))) {
    return $trimmed.Substring(1, $trimmed.Length - 2)
  }

  return $trimmed
}

$envPairs = @()

foreach ($line in $lines) {
  $trimmed = $line.Trim()

  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    continue
  }

  if ($trimmed.StartsWith("#")) {
    continue
  }

  $splitIndex = $trimmed.IndexOf("=")
  if ($splitIndex -lt 1) {
    Write-Warning "Skipping invalid .env line (missing '='): $line"
    continue
  }

  $name = $trimmed.Substring(0, $splitIndex).Trim()
  $value = $trimmed.Substring($splitIndex + 1)

  if ([string]::IsNullOrWhiteSpace($name)) {
    Write-Warning "Skipping invalid .env line (empty key): $line"
    continue
  }

  $envPairs += [PSCustomObject]@{
    Name = $name
    Value = (Convert-EnvValue -Value $value)
  }
}

if ($envPairs.Count -eq 0) {
  Write-Warning "No environment variables found in $EnvPath."
  exit 0
}

foreach ($pair in $envPairs) {
  Write-Host "Uploading secret: $($pair.Name)" -ForegroundColor Cyan

  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = $WranglerPath
  $processInfo.Arguments = "secret put $($pair.Name)"
  $processInfo.RedirectStandardInput = $true
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true
  $processInfo.UseShellExecute = $false

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $processInfo

  if (-not $process.Start()) {
    throw "Failed to start wrangler process for $($pair.Name)."
  }

  $process.StandardInput.WriteLine($pair.Value)
  $process.StandardInput.Close()

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($stdout) {
    Write-Host $stdout.Trim()
  }

  if ($stderr) {
    Write-Warning $stderr.Trim()
  }

  if ($process.ExitCode -ne 0) {
    throw "Wrangler failed for $($pair.Name) with exit code $($process.ExitCode)."
  }
}

Write-Host "All secrets uploaded successfully." -ForegroundColor Green