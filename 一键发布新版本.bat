@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title NovelForge AI Release Tool
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\release.ps1" %*
echo.
echo ========================================================
echo Execution finished. Press any key to close this window...
echo ========================================================
pause >nul
endlocal
