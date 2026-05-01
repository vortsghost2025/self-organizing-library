param(
    [int]$Count = 3
)

Write-Host "Starting $Count visible Library worker windows..." -ForegroundColor Cyan
Write-Host "Each window runs an independent lane-worker with 60s polling." -ForegroundColor Gray
Write-Host "Close windows to stop workers." -ForegroundColor Yellow
Write-Host ""

for ($i = 1; $i -le $Count; $i++) {
    $windowTitle = "Library Worker $i (PID: $([System.Diagnostics.Process]::GetCurrentProcess().Id))"
    $command = "cd /d S:\self-organizing-library && npm run worker"
    
    Write-Host "Opening Worker $i..." -ForegroundColor Green
    # Open new PowerShell window, keep open after command finishes, run command
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-WindowStyle', 'Normal',
        '-Command', $command
    ) -WorkingDirectory "S:\self-organizing-library"
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n$Count worker windows launched." -ForegroundColor Cyan
