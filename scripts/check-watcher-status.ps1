#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Checks if the lane-relay-watcher is actively syncing by examining the log file on the headless mount.
#>

$logPath = "S:\lane-relay.log"
$mountRoot = "S:\"

if (-not (Test-Path $mountRoot)) {
  Write-Host "❌ Mount not accessible at S:\" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $logPath)) {
  Write-Host "⚠️  Watcher log not found at S:\lane-relay.log" -ForegroundColor Yellow
  Write-Host "   The watcher may not have written any logs yet, or the mount points to a different location." -ForegroundColor Yellow
  exit 2
}

$lastLines = Get-Content $logPath -Tail 10 | Select-Object -Last 1
if (-not $lastLines) {
  Write-Host "⚠️  Log is empty. watcher may not have produced output." -ForegroundColor Yellow
  exit 3
}

$now = Get-Date
$lastWrite = (Get-Item $logPath).LastWriteTime
$ageMinutes = ($now - $lastWrite).TotalMinutes

if ($ageMinutes -gt 5) {
  Write-Host "⚠️  Log is stale (last write $([int]$ageMinutes) min ago). watcher may not be running." -ForegroundColor Yellow
} else {
  Write-Host "✅ Watcher log is fresh (last write $([int]$ageMinutes) min ago)." -ForegroundColor Green
}

Write-Host "`nLast log line:" -ForegroundColor Cyan
Write-Host $lastLines -ForegroundColor Gray

# Check outbox accessibility (relay mount sanity)
$outbox = "S:\self-organizing-library\lanes\library\outbox"
if (Test-Path $outbox) {
  Write-Host "`n✅ Outbox visible via mount: $outbox" -ForegroundColor Green
} else {
  Write-Host "`n❌ Outbox not accessible via mount: $outbox" -ForegroundColor Red
}

# Check inbox exists
$inbox = "S:\self-organizing-library\lanes\library\inbox"
if (Test-Path $inbox) {
  Write-Host "✅ Inbox visible via mount: $inbox" -ForegroundColor Green
} else {
  Write-Host "❌ Inbox not accessible via mount: $inbox" -ForegroundColor Red
}
