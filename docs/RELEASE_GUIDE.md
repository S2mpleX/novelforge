# NovelForge AI — 软件发布与版本构建操作指南 (RELEASE_GUIDE.md)

本文档面向发布工程师与维护者，详细规范 NovelForge AI 正式版本的发布操作流程。

---

## 一、发布前环境准备与密钥配置

### 1.1 签名密钥生成 (首次部署)
在终端执行：
```powershell
pnpm tauri signer generate -w updater.key
```
命令将在当前目录生成：
- `updater.key`（签名私钥，请严格妥善保管，**绝不可提交至 Git 或泄露**）
- `updater.key.pub`（公钥文本）

### 1.2 配置客户端验签公钥
将 `updater.key.pub` 中的公钥字符串填入 `src-tauri/tauri.conf.json`：
```json
"plugins": {
  "updater": {
    "pubkey": "<此处粘贴公钥字符串>",
    "endpoints": [
      "https://github.com/novelforge-ai/novelforge/releases/latest/download/latest.json"
    ]
  }
}
```

### 1.3 配置 GitHub Actions 仓库 Secrets
进入 GitHub 仓库 Settings -> Secrets and variables -> Actions，添加以下机密项：
- `TAURI_SIGNING_PRIVATE_KEY`：将 `updater.key` 的全部文本内容复制并粘贴于此处；
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：若生成密钥时设置了密码，在此填入；若无密码可留空或填空字符串。

> [!WARNING]
> 丢失私钥将导致已安装应用无法验证新版本，后续更新只能让用户手动重新下载完整安装包！请务必多地离线冷备份私钥文件。

---

## 二、标准版本发布步骤 (Step-by-Step)

### 第 1 步：遵循 SemVer 升级版本号
更新以下三个核心配置文件中的版本号（需完全一致）：
1. `package.json` 中的 `"version": "2.2.0"`
2. `src-tauri/Cargo.toml` 中的 `version = "2.2.0"`
3. `src-tauri/tauri.conf.json` 中的 `"version": "2.2.0"`

运行版本一致性自动化核验：
```powershell
pnpm run check:version
```

### 第 2 步：维护并归档 `CHANGELOG.md`
将 `[Unreleased]` 中的改动移入当前版本发布条目下，标注日期与分类：
- `### 新增功能 · Features`
- `### 功能优化 · Improvements`
- `### Bug 修复 · Bug Fixes`
- `### 兼容性变更 · Breaking Changes`
- `### 已知问题 · Known Issues`

### 第 3 步：本地质量把关与测试通过
在本地运行完整验证流水线：
```powershell
# 1. 前端类型检查与打包
pnpm run build

# 2. 自动更新系统 28 项专项测试
pnpm run test:updater

# 3. 可停靠工作台 10 项端到端测试
pnpm run test:docking

# 4. SQLite 数据库与业务逻辑 40 项全量测试
cargo run --manifest-path src-tauri/Cargo.toml --bin db_test
```

### 第 4 步：提交代码并创建 Git Release Tag
```bash
git add .
git commit -m "chore(release): bump version to v2.2.0"
git push origin master

# 创建轻量或附注标签 (以 v 开头)
git tag v2.2.0
git push origin v2.2.0
```

### 第 5 步：GitHub Actions 流水线自动化构建
推送到 `v*` 标签后，`.github/workflows/release.yml` 将被自动唤起：
1. 检出代码并配置 Node 20 + Rust 稳定版环境；
2. 运行前端构建与自动化测试；
3. 验证 SQLite 数据库架构与 40 项业务逻辑；
4. 构建 Windows x64 NSIS 安装包；
5. 使用 `TAURI_SIGNING_PRIVATE_KEY` 签署更新包并生成 `latest.json`；
6. 自动上传产物并创建 **草稿 Release (Draft Release)**。

### 第 6 步：人工复核与正式发布
1. 访问 GitHub Releases 页面，找到新创建的 Draft Release；
2. 下载 Windows 安装程序进行虚拟机或实机冒烟测试；
3. 确认包体完整性、签名验证通过且小说正文完好无损；
4. 点击 **Publish release** 正式发布！已安装旧版客户端的用户将在下次启动或点击“检查更新”时收到更新推送。
