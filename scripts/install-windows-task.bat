@echo off
REM Install Library Lane Auto-Start Scheduled Task
REM Run this script once as Administrator to register the task

set TASK_NAME=LibraryLaneAutoStart
set XML_PATH=S:\self-organizing-library\config\scheduled-tasks\library-lane-autostart.xml

REM Check if task already exists
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Task "%TASK_NAME%" already exists. Updating...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

REM Create the task from XML
schtasks /create /tn "%TASK_NAME%" /xml "%XML_PATH%" /f
if %errorlevel% equ 0 (
    echo Task "%TASK_NAME%" created successfully.
    echo It will run on next logon with 30s delay.
    echo.
    echo To test now:  schtasks /run /tn "LibraryLaneAutoStart"
    echo To remove:    schtasks /delete /tn "LibraryLaneAutoStart" /f
    echo To view:      schtasks /query /tn "LibraryLaneAutoStart" /v
) else (
    echo ERROR: Failed to create task. Try running as Administrator.
)
