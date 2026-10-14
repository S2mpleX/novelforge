@echo off
chcp 65001 >nul
title NovelForge AI 桌面开发端
cd /d "%~dp0"

echo ========================================================
echo        NovelForge AI 桌面端极速启动器
echo ========================================================
echo.
echo [1/2] 正在配置 MinGW-w64 与 Node 开发环境...
set "PATH=E:\tools\winlibs_msvcrt\mingw64\bin;%PATH%"

echo [2/2] 正在启动桌面端窗口 (pnpm tauri dev)...
echo.

pnpm tauri dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 运行发生异常，错误码：%ERRORLEVEL%
    pause
)
