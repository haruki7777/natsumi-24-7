param(
  [string]$MessagePrefix = "auto-sync",
  [string]$Branch = "",
  [switch]$SkipPull
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

if (-not (Test-Path ".git")) {
  throw "This script must run inside a cloned Git repository."
}

$currentBranch = if ($Branch) { $Branch } else { git branch --show-current }
if (-not $currentBranch) {
  throw "Could not resolve the current Git branch."
}

git add -A

$porcelain = git status --porcelain
if (-not $porcelain) {
  Write-Host "No changes to commit."
  exit 0
}

$blocked = $porcelain | Where-Object { $_ -match "\.env($|\.|\\|/)" }
if ($blocked) {
  throw "Refusing to auto-commit .env files. Check .gitignore and remove secrets from the working tree."
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$message = "${MessagePrefix}: $timestamp"

git commit -m $message

if (-not $SkipPull) {
  git pull --rebase origin $currentBranch
}

git push origin $currentBranch
