@echo off
REM Library Lane Auto-Start for Windows
REM Launched by Windows Task Scheduler on user logon with 30s delay
REM Runs: lane-worker, relay-daemon, heartbeat (continuous)

set REPO_DIR=S:\self-organizing-library
set BUN=C:\Users\seand\scoop\shims\bun.exe

REM Wait 10s for network/Tailscale to stabilize
timeout /t 10 /nobreak >nul

cd /d %REPO_DIR%

echo [%date% %time%] Library Lane Auto-Start beginning >> %REPO_DIR%\lanes\library\logs\windows-autostart.log

start "Library Lane Worker" /min cmd /c "%BUN%" run scripts/lane-worker.js --watch --apply --poll-seconds 20 --lane library >> %REPO_DIR%\lanes\library\logs\lane-worker-autostart.log 2>&1
echo [%date% %time%] lane-worker started >> %REPO_DIR%\lanes\library\logs\windows-autostart.log

timeout /t 3 /nobreak >nul

start "Library Relay Daemon" /min cmd /c "%BUN%" run scripts/relay-daemon.js --watch --apply --poll-seconds 20 --lane library >> %REPO_DIR%\lanes\library\logs\relay-daemon-autostart.log 2>&1
echo [%date% %time%] relay-daemon started >> %REPO_DIR%\lanes\library\logs\windows-autostart.log

timeout /t 3 /nobreak >nul

start "Library Heartbeat" /min cmd /c "%BUN%" run scripts/heartbeat.js --lane library --continuous --interval 60 >> %REPO_DIR%\lanes\library\logs\heartbeat-autostart.log 2>&1
echo [%date% %time%] heartbeat started >> %REPO_DIR%\lanes\library\logs\windows-autostart.log

echo [%date% %time%] Library Lane Auto-Start complete >> %REPO_DIR%\lanes\library\logs\windows-autostart.log
