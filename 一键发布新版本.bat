@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title NovelForge AI Release Tool
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$f = '%~dp0scripts\release.ps1'; if (Test-Path $f) { $bytes = [System.IO.File]::ReadAllBytes($f); if ($bytes.Length -ge 3 -and ($bytes[0] -ne 0xEF -or $bytes[1] -ne 0xBB -or $bytes[2] -ne 0xBF)) { $text = [System.Text.Encoding]::UTF8.GetString($bytes); [System.IO.File]::WriteAllText($f, $text, [System.Text.UTF8Encoding]::new($true)); } }"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & '%~dp0scripts\release.ps1' %*"
echo.
echo ========================================================
echo Execution finished. Press any key to close this window...
echo ========================================================
pause >nul
endlocal
