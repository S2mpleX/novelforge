# NovelForge AI — 一键版本发布脚本
# 用法：
#   .\scripts\release.ps1 patch   → 2.2.0 → 2.2.1（修 Bug）
#   .\scripts\release.ps1 minor   → 2.2.0 → 2.3.0（加功能）
#   .\scripts\release.ps1 major   → 2.2.0 → 3.0.0（大改版）
#   .\scripts\release.ps1 2.5.0   → 指定版本号

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$BumpType
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NovelForge AI — 一键版本发布脚本              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ────────────────────────────────────────────
# 1. 读取当前版本
# ────────────────────────────────────────────
$pkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $pkgJson.version
Write-Host "[1/9] 当前版本: v$currentVersion" -ForegroundColor Yellow

# ────────────────────────────────────────────
# 2. 计算新版本号
# ────────────────────────────────────────────
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

switch ($BumpType) {
    "patch" { $patch++; }
    "minor" { $minor++; $patch = 0; }
    "major" { $major++; $minor = 0; $patch = 0; }
    default {
        # 视为直接指定版本号
        if ($BumpType -match '^\d+\.\d+\.\d+$') {
            $parts2 = $BumpType.Split('.')
            $major = [int]$parts2[0]
            $minor = [int]$parts2[1]
            $patch = [int]$parts2[2]
        } else {
            Write-Host "错误：参数必须是 patch / minor / major 或具体版本号 (如 2.5.0)" -ForegroundColor Red
            exit 1
        }
    }
}

$newVersion = "$major.$minor.$patch"
Write-Host "[2/9] 新版本号: v$currentVersion → v$newVersion" -ForegroundColor Green

$confirm = Read-Host "     确认发布 v$newVersion？(y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "已取消。" -ForegroundColor Gray
    exit 0
}

# ────────────────────────────────────────────
# 3. 同步更新三处版本号
# ────────────────────────────────────────────
Write-Host "[3/9] 同步更新 package.json / Cargo.toml / tauri.conf.json ..." -ForegroundColor Yellow

# package.json
$pkgContent = Get-Content "package.json" -Raw -Encoding UTF8
$pkgContent = $pkgContent -replace "`"version`":\s*`"$currentVersion`"", "`"version`": `"$newVersion`""
[System.IO.File]::WriteAllText("$PWD\package.json", $pkgContent, [System.Text.Encoding]::UTF8)

# src-tauri/Cargo.toml — 只替换 [package] 下紧跟的 version
$cargoPath = "src-tauri\Cargo.toml"
$cargoContent = Get-Content $cargoPath -Raw -Encoding UTF8
$cargoContent = $cargoContent -replace "(?m)^(version\s*=\s*)`"$currentVersion`"", "`$1`"$newVersion`""
[System.IO.File]::WriteAllText("$PWD\$cargoPath", $cargoContent, [System.Text.Encoding]::UTF8)

# src-tauri/tauri.conf.json
$tauriConfPath = "src-tauri\tauri.conf.json"
$tauriContent = Get-Content $tauriConfPath -Raw -Encoding UTF8
$tauriContent = $tauriContent -replace "`"version`":\s*`"$currentVersion`"", "`"version`": `"$newVersion`""
[System.IO.File]::WriteAllText("$PWD\$tauriConfPath", $tauriContent, [System.Text.Encoding]::UTF8)

# UpdateService.ts 中的硬编码版本
$usPath = "src\features\updater\services\UpdateService.ts"
if (Test-Path $usPath) {
    $usContent = Get-Content $usPath -Raw -Encoding UTF8
    $usContent = $usContent -replace "APP_CURRENT_VERSION\s*=\s*'$currentVersion'", "APP_CURRENT_VERSION = '$newVersion'"
    [System.IO.File]::WriteAllText("$PWD\$usPath", $usContent, [System.Text.Encoding]::UTF8)
}

Write-Host "     ✅ 四处版本号已同步为 $newVersion" -ForegroundColor Green

# ────────────────────────────────────────────
# 4. 验证版本一致性
# ────────────────────────────────────────────
Write-Host "[4/9] 验证版本号一致性 ..." -ForegroundColor Yellow
pnpm run check:version
if ($LASTEXITCODE -ne 0) {
    Write-Host "版本号不一致，请手动检查！" -ForegroundColor Red
    exit 1
}

# ────────────────────────────────────────────
# 5. 确保 MinGW-w64 在 PATH 中
# ────────────────────────────────────────────
$mingwBin = "E:\tools\winlibs_msvcrt\mingw64\bin"
if ($env:PATH -notlike "*$mingwBin*") {
    $env:PATH = "$mingwBin;$env:PATH"
    Write-Host "[5/9] 已将 MinGW-w64 加入 PATH" -ForegroundColor Yellow
} else {
    Write-Host "[5/9] MinGW-w64 已在 PATH 中" -ForegroundColor Green
}

# ────────────────────────────────────────────
# 6. TypeScript 编译检查
# ────────────────────────────────────────────
Write-Host "[6/9] TypeScript 编译检查 ..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "前端编译失败，请修复后重试！" -ForegroundColor Red
    exit 1
}
Write-Host "     ✅ 前端编译通过" -ForegroundColor Green

# ────────────────────────────────────────────
# 7. 运行自动化测试
# ────────────────────────────────────────────
Write-Host "[7/9] 运行更新系统测试 ..." -ForegroundColor Yellow
pnpm run test:updater
if ($LASTEXITCODE -ne 0) {
    Write-Host "测试未通过，请修复后重试！" -ForegroundColor Red
    exit 1
}
Write-Host "     ✅ 全部测试通过" -ForegroundColor Green

# ────────────────────────────────────────────
# 8. 加载签名私钥并构建安装包
# ────────────────────────────────────────────
Write-Host "[8/9] 构建 Windows x64 NSIS 安装包 (Release 模式) ..." -ForegroundColor Yellow

$keyPath = "$PWD\updater.key"
if (-not (Test-Path $keyPath)) {
    Write-Host "错误：未找到签名私钥 updater.key，请确认文件存在于项目根目录！" -ForegroundColor Red
    exit 1
}

$key = (Get-Content $keyPath -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY = $key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""

pnpm tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}

# ────────────────────────────────────────────
# 9. 复制产物到桌面
# ────────────────────────────────────────────
Write-Host "[9/9] 复制安装包到桌面 ..." -ForegroundColor Yellow

$bundleDir = "E:\tools\novelforge_target\x86_64-pc-windows-gnu\release\bundle\nsis"
$destDir = "$env:USERPROFILE\Desktop\NovelForge-AI-v$newVersion"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$exeName = Get-ChildItem $bundleDir -Filter "*_${newVersion}_x64-setup.exe" | Select-Object -First 1
if ($exeName) {
    Copy-Item $exeName.FullName -Destination $destDir
    Copy-Item "$($exeName.FullName).sig" -Destination $destDir -ErrorAction SilentlyContinue
    $sizeMB = [math]::Round($exeName.Length / 1MB, 2)
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ 发布完成！                                 ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  版本:    v$newVersion" -ForegroundColor White
    Write-Host "  安装包:  $destDir\$($exeName.Name)" -ForegroundColor White
    Write-Host "  大小:    $sizeMB MB" -ForegroundColor White
    Write-Host ""
    Write-Host "  → 把 .exe 文件发给对方即可安装" -ForegroundColor Cyan
    Write-Host ""

    # 询问是否推送到 GitHub
    $pushGit = Read-Host "  是否提交到 Git 并推送标签触发 GitHub 发布？(y/N)"
    if ($pushGit -eq 'y' -or $pushGit -eq 'Y') {
        git add -A
        git commit -m "release: v$newVersion"
        git tag "v$newVersion"
        git push origin main --tags
        Write-Host "  ✅ 已推送 v$newVersion 标签，GitHub Actions 将自动构建并创建草稿 Release" -ForegroundColor Green
    }
} else {
    Write-Host "警告：未在 $bundleDir 找到安装包文件" -ForegroundColor Yellow
}
