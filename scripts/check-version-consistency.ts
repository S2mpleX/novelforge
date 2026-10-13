import fs from 'fs';
import path from 'path';

function checkVersions() {
  const rootDir = process.cwd();

  // 1. package.json
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const pkgVersion = pkg.version;

  // 2. src-tauri/Cargo.toml
  const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
  const cargoContent = fs.readFileSync(cargoPath, 'utf8');
  const cargoMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
  const cargoVersion = cargoMatch ? cargoMatch[1] : null;

  // 3. src-tauri/tauri.conf.json
  const tauriPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
  const tauriVersion = tauri.version;

  console.log(`[Version Check] package.json:        ${pkgVersion}`);
  console.log(`[Version Check] src-tauri/Cargo.toml: ${cargoVersion}`);
  console.log(`[Version Check] tauri.conf.json:     ${tauriVersion}`);

  if (pkgVersion !== cargoVersion || pkgVersion !== tauriVersion) {
    console.error('❌ 版本号不一致！请确保 package.json, Cargo.toml 与 tauri.conf.json 版本号完全相同。');
    process.exit(1);
  }

  console.log('✅ 版本号完全一致，符合 SemVer 发布规范！');
}

checkVersions();
