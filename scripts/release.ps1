# NovelForge AI — 一键版本发布脚本
# 用法：
#   .\scripts\release.ps1 patch   → 2.2.0 → 2.2.1（修 Bug）
#   .\scripts\release.ps1 minor   → 2.2.0 → 2.3.0（加功能）
#   .\scripts\release.ps1 major   → 2.2.0 → 3.0.0（大改版）
#   .\scripts\release.ps1 2.5.0   → 指定版本号

param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$BumpType = ''
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

# 设置终端输入/输出与管道为 UTF-8，防止控制台中文乱码与子进程通讯乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING     = 'utf-8'
$env:LANG                 = 'zh_CN.UTF-8'

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   NovelForge AI — 一键版本发布与自动构建系统    ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''

# ────────────────────────────────────────────
# 1. 读取当前版本
# ────────────────────────────────────────────
$pkgJson = Get-Content 'package.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$currentVersion = $pkgJson.version
Write-Host ('[1/10] 当前应用版本: v' + $currentVersion) -ForegroundColor Yellow

# ────────────────────────────────────────────
# 2. 计算新版本号
# ────────────────────────────────────────────
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

if ([string]::IsNullOrWhiteSpace($BumpType)) {
    Write-Host ''
    Write-Host "请选择升级类型:" -ForegroundColor White
    Write-Host "  [1] patch  - 修复 Bug（推荐）如 v$currentVersion -> v$major.$minor.$([int]$patch + 1)" -ForegroundColor Green
    Write-Host "  [2] minor  - 新增功能如 v$currentVersion -> v$major.$([int]$minor + 1).0" -ForegroundColor Cyan
    Write-Host "  [3] major  - 重大重构如 v$currentVersion -> v$([int]$major + 1).0.0" -ForegroundColor Magenta
    Write-Host "  [4] 自定义指定具体版本号 (例如 2.3.5)" -ForegroundColor Yellow
    Write-Host "  [5] 仅本地重新打包（保持当前版本 v$currentVersion）" -ForegroundColor Gray
    Write-Host "  [0] 退出" -ForegroundColor Red
    Write-Host ""
    $choice = Read-Host "请输入数字 [1-5, 0] (默认 1)"
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

    switch ($choice) {
        "1" { $BumpType = "patch" }
        "2" { $BumpType = "minor" }
        "3" { $BumpType = "major" }
        "4" {
            $customVer = Read-Host "请输入目标版本号 (如 2.3.5)"
            $BumpType = $customVer.Trim().TrimStart('v')
        }
        "5" { $BumpType = "keep" }
        "0" { Write-Host "已退出"; exit 0 }
        default { $BumpType = "patch" }
    }
}

if ($BumpType -eq 'keep') {
    $newVersion = $currentVersion
} else {
    switch ($BumpType) {
        'patch' { $patch++; }
        'minor' { $minor++; $patch = 0; }
        'major' { $major++; $minor = 0; $patch = 0; }
        default {
            if ($BumpType -match '^\d+\.\d+\.\d+$') {
                $parts2 = $BumpType.Split('.')
                $major = [int]$parts2[0]
                $minor = [int]$parts2[1]
                $patch = [int]$parts2[2]
            } else {
                Write-Host '错误: 参数必须是 patch / minor / major 或具体版本号 (如 2.5.0)' -ForegroundColor Red
                exit 1
            }
        }
    }
    $newVersion = '' + $major + '.' + $minor + '.' + $patch
}
Write-Host ('[2/9] 新版本号: v' + $currentVersion + ' → v' + $newVersion) -ForegroundColor Green

$confirm = Read-Host ('     确认发布 v' + $newVersion + ' ? (y/N)')
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host '已取消' -ForegroundColor Gray
    exit 0
}

# ────────────────────────────────────────────
# 3. 同步更新各处版本号
# ────────────────────────────────────────────
Write-Host '[3/9] 同步更新 package.json / Cargo.toml / tauri.conf.json ...' -ForegroundColor Yellow

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

# package.json
$pkgContent = Get-Content 'package.json' -Raw -Encoding UTF8
$pkgContent = $pkgContent -replace '"version":\s*"[^"]+"', ('"version": "' + $newVersion + '"')
[System.IO.File]::WriteAllText("$PWD\package.json", $pkgContent, $utf8NoBom)

# src-tauri/Cargo.toml — 只替换 [package] 下紧跟的 version
$cargoPath = 'src-tauri\Cargo.toml'
$cargoContent = Get-Content $cargoPath -Raw -Encoding UTF8
$cargoContent = $cargoContent -replace '(?m)^(version\s*=\s*)"[^"]+"', ('$1"' + $newVersion + '"')
[System.IO.File]::WriteAllText("$PWD\$cargoPath", $cargoContent, $utf8NoBom)

# src-tauri/tauri.conf.json
$tauriConfPath = 'src-tauri\tauri.conf.json'
$tauriContent = Get-Content $tauriConfPath -Raw -Encoding UTF8
$tauriContent = $tauriContent -replace '"version":\s*"[^"]+"', ('"version": "' + $newVersion + '"')
[System.IO.File]::WriteAllText("$PWD\$tauriConfPath", $tauriContent, $utf8NoBom)

# UpdateService.ts 中的硬编码版本
$usPath = 'src\features\updater\services\UpdateService.ts'
if (Test-Path $usPath) {
    $usContent = Get-Content $usPath -Raw -Encoding UTF8
    $usContent = $usContent -replace "APP_CURRENT_VERSION\s*=\s*'[^']+'", ("APP_CURRENT_VERSION = '" + $newVersion + "'")
    [System.IO.File]::WriteAllText("$PWD\$usPath", $usContent, $utf8NoBom)
}

Write-Host ('     ✅ 四处版本号已同步为 ' + $newVersion) -ForegroundColor Green

# ────────────────────────────────────────────
# 4. 验证版本一致性
# ────────────────────────────────────────────
Write-Host '[4/9] 验证版本号一致性 ...' -ForegroundColor Yellow
pnpm run check:version
if ($LASTEXITCODE -ne 0) {
    Write-Host '版本号不一致，请手动检查' -ForegroundColor Red
    exit 1
}

# ────────────────────────────────────────────
# 5. 确保 MinGW-w64 在 PATH 中
# ────────────────────────────────────────────
$mingwBin = 'E:\tools\winlibs_msvcrt\mingw64\bin'
if ($env:PATH -notlike ('*' + $mingwBin + '*')) {
    $env:PATH = $mingwBin + ';' + $env:PATH
    Write-Host '[5/9] 已将 MinGW-w64 加入 PATH' -ForegroundColor Yellow
} else {
    Write-Host '[5/9] MinGW-w64 已在 PATH 中' -ForegroundColor Green
}

# ────────────────────────────────────────────
# 6. TypeScript 编译检查
# ────────────────────────────────────────────
Write-Host '[6/9] TypeScript 编译检查 ...' -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host '前端编译失败，请修复后重试' -ForegroundColor Red
    exit 1
}
Write-Host '     ✅ 前端编译通过' -ForegroundColor Green

# ────────────────────────────────────────────
# 7. 运行自动化测试
# ────────────────────────────────────────────
Write-Host '[7/9] 运行更新系统测试 ...' -ForegroundColor Yellow
pnpm run test:updater
if ($LASTEXITCODE -ne 0) {
    Write-Host '测试未通过，请修复后重试' -ForegroundColor Red
    exit 1
}
Write-Host '     ✅ 全部测试通过' -ForegroundColor Green

# ────────────────────────────────────────────
# 8. 加载签名私钥并构建安装包
# ────────────────────────────────────────────
Write-Host '[8/9] 构建 Windows x64 NSIS 安装包 (Release 模式) ...' -ForegroundColor Yellow

$keyPath = "$PWD\updater.key"
if (-not (Test-Path $keyPath)) {
    Write-Host '错误: 未找到签名私钥 updater.key，请确认文件存在于项目根目录' -ForegroundColor Red
    exit 1
}

$key = (Get-Content $keyPath -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY = $key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
$env:CI = 'true'

Write-Host '     正在进行免密签名与打包构建，请稍候...' -ForegroundColor Cyan
pnpm tauri build --ci
if ($LASTEXITCODE -ne 0) {
    Write-Host '构建失败' -ForegroundColor Red
    exit 1
}

# ────────────────────────────────────────────
# 9. 复制产物到桌面
# ────────────────────────────────────────────
Write-Host '[9/9] 复制安装包到桌面 ...' -ForegroundColor Yellow

$bundleDir = 'E:\tools\novelforge_target\x86_64-pc-windows-gnu\release\bundle\nsis'
$destDir = $env:USERPROFILE + '\Desktop\NovelForge-AI-v' + $newVersion
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$exeName = Get-ChildItem $bundleDir -Filter ('*_' + $newVersion + '_x64-setup.exe') | Select-Object -First 1
if ($exeName) {
    Copy-Item $exeName.FullName -Destination $destDir
    Copy-Item ($exeName.FullName + '.sig') -Destination $destDir -ErrorAction SilentlyContinue
    $sizeMB = [math]::Round($exeName.Length / 1MB, 2)
    Write-Host ''
    Write-Host '╔══════════════════════════════════════════════════╗' -ForegroundColor Green
    Write-Host '║   ✅ 发布完成！                                 ║' -ForegroundColor Green
    Write-Host '╚══════════════════════════════════════════════════╝' -ForegroundColor Green
    Write-Host ''
    Write-Host ('  版本:    v' + $newVersion) -ForegroundColor White
    Write-Host ('  安装包:  ' + $destDir + '\' + $exeName.Name) -ForegroundColor White
    Write-Host ('  大小:    ' + $sizeMB + ' MB') -ForegroundColor White
    Write-Host ''
    Write-Host '  → 把 .exe 文件发给对方即可安装' -ForegroundColor Cyan
    Write-Host ''

    # 询问是否发布到 GitHub
    $pushGit = Read-Host '  是否一键发布到 GitHub Releases 并推送代码？(Y/n)'
    if ($pushGit -ne 'n' -and $pushGit -ne 'N') {
        Write-Host ''
        Write-Host '[10/10] 正在推送 Git 代码与标签 ...' -ForegroundColor Yellow
        git add -A
        git commit -m ('release: v' + $newVersion)
        git tag -a ('v' + $newVersion) -m ('Release v' + $newVersion) -f
        git push origin main --tags --force
        Write-Host '     ✅ Git 代码与标签已同步至 GitHub' -ForegroundColor Green

        Write-Host "     正在发布资产到 GitHub Releases ..." -ForegroundColor Yellow
        try {
            $uploadScript = Join-Path $PSScriptRoot "upload-release.cjs"
            if (Test-Path $uploadScript) {
                & node $uploadScript $newVersion
                if ($LASTEXITCODE -ne 0) {
                    throw "upload-release.cjs 退出码为 $LASTEXITCODE"
                }
            } else {
                throw "未找到上传工具脚本 scripts/upload-release.cjs"
            }
        } catch {
            Write-Host ''
            Write-Host "⚠️ 直接上传 GitHub Release 时遇到网络异常: $_" -ForegroundColor Yellow
            Write-Host "【重要提示】：若因网络受限导致上传未完成，新版本安装包已完整保存在桌面：" -ForegroundColor Cyan
            Write-Host "  📂 桌面目录: $destDir" -ForegroundColor White
            Write-Host "  1. 本机直接升级：双击运行桌面上的 $($exeName.Name) 即可立即升级至 v$newVersion ！" -ForegroundColor Green
            Write-Host "  2. 重新上传：可随时执行 `node scripts/upload-release.cjs $newVersion` 重试上传。" -ForegroundColor Cyan
            Write-Host "  3. 网页端发布：亦可打开 https://github.com/S2mpleX/novelforge/releases/new ，将桌面目录下的 3 个文件拖拽上传发布。" -ForegroundColor White
        }
    }
} else {
    Write-Host "警告: 未在 $bundleDir 找到安装包文件" -ForegroundColor Yellow
}
