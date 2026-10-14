@echo off
chcp 65001 >nul
title NovelForge AI 一键发布新版本与更新工具
cd /d "%~dp0"

echo ========================================================
echo        NovelForge AI 一键发布与自动构建工具
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\release.ps1"

echo.
echo ========================================================
echo 执行完毕，按任意键关闭窗口...
echo ========================================================
pause >nul
