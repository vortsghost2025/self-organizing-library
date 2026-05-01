@echo off
REM Parallel Library Worker Launcher for Windows
REM Starts N independent lane-worker instances with logging
REM Usage: start-workers.bat [count]  (default: 3)

SETLOCAL ENABLEDELAYEDEXPANSION

SET COUNT=%1
IF "%COUNT%"=="" SET COUNT=3

ECHO Starting %COUNT% Library worker(s)...
ECHO Each worker will process inbox items concurrently with 60s lease intervals.
ECHO Logs will be written to logs\workers\worker-*.log
ECHO Press Ctrl+C to stop all workers (or close this window).
ECHO.

REM Create logs directory
IF NOT EXIST "S:\self-organizing-library\logs\workers" (
    mkdir "S:\self-organizing-library\logs\workers"
)

FOR /L %%i IN (1,1,%COUNT%) DO (
    SET WORKER_NAME=Worker %%i
    SET LOGFILE=S:\self-organizing-library\logs\workers\worker-%%i.log
    
    ECHO Launching !WORKER_NAME! (log: !LOGFILE!)...
    
    REM Start in new minimized window with logging
    START "Library Worker %%i" /MIN powershell -Command ^
        "Set-Location 'S:\self-organizing-library'; ^
        npm run worker 2>&1 | Tee-Object -FilePath '!LOGFILE!' -Append"
    
    REM Small delay between launches
    TIMEOUT /T 2 /NOBREAK >NUL
)

ECHO.
ECHO ========================================
ECHO Launched %COUNT% Library workers.
ECHO Monitor: dir S:\self-organizing-library\logs\workers\ /b
ECHOR Stop: taskkill /F /IM node.exe (kills all node workers)
ECHO ========================================
PAUSE
