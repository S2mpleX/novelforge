import fs from 'fs';
import path from 'path';

function checkVersions() {
  const rootDir = process.cwd();

  // 1. package.json
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8').replace(/^\uFEFF/, ''));
  const pkgVersion = pkg.version;

  // 2. src-tauri/Cargo.toml
  const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
  const cargoContent = fs.readFileSync(cargoPath, 'utf8').replace(/^\uFEFF/, '');
  const cargoMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
  const cargoVersion = cargoMatch ? cargoMatch[1] : null;

  // 3. src-tauri/tauri.conf.json
  const tauriPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8').replace(/^\uFEFF/, ''));
  const tauriVersion = tauri.version;

  // 4. src/features/updater/services/UpdateService.ts
  const updaterPath = path.join(rootDir, 'src', 'features', 'updater', 'services', 'UpdateService.ts');
  const updaterContent = fs.readFileSync(updaterPath, 'utf8').replace(/^\uFEFF/, '');
  const updaterMatch = updaterContent.match(/APP_CURRENT_VERSION\s*=\s*'([^']+)'/);
  const updaterVersion = updaterMatch ? updaterMatch[1] : null;

  console.log(`[Version Check] package.json:        ${pkgVersion}`);
  console.log(`[Version Check] src-tauri/Cargo.toml: ${cargoVersion}`);
  console.log(`[Version Check] tauri.conf.json:     ${tauriVersion}`);
  console.log(`[Version Check] UpdateService.ts:    ${updaterVersion}`);

  if (pkgVersion !== cargoVersion || pkgVersion !== tauriVersion || pkgVersion !== updaterVersion) {
    console.error('❌ 版本号不一致！请确保 package.json, Cargo.toml, tauri.conf.json 与 UpdateService.ts 版本号完全相同。');
    process.exit(1);
  }

  console.log('✅ 版本号完全一致，符合 SemVer 发布规范！');
}

checkVersions();
