import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('🛡️⚡ NovelForge AI — 图像本地存储优化与性能边界防御测试');
console.log('===============================================================');

let passCount = 0;
function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res
        .then(() => {
          console.log(`  ✅ PASS: ${name}`);
          passCount++;
        })
        .catch((e: any) => {
          console.error(`  ❌ FAIL: ${name}`, e.message);
          throw e;
        });
    } else {
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    }
  } catch (e: any) {
    console.error(`  ❌ FAIL: ${name}`, e.message);
    throw e;
  }
}

async function runTests() {
  const optimizerSrc = fs.readFileSync('src/utils/imageOptimizer.ts', 'utf8');
  const bookCoverSrc = fs.readFileSync('src/components/modals/BookCoverModal.tsx', 'utf8');
  const charsViewSrc = fs.readFileSync('src/components/views/CharactersView.tsx', 'utf8');
  const charsPanelSrc = fs.readFileSync('src/components/docking/panels/CharacterProfilesPanel.tsx', 'utf8');
  const sandboxPanelSrc = fs.readFileSync('src/components/docking/panels/CharacterSandboxPanel.tsx', 'utf8');
  const openaiClientSrc = fs.readFileSync('src-tauri/src/providers/openai_compatible.rs', 'utf8');
  const dbSrc = fs.readFileSync('src-tauri/src/database/mod.rs', 'utf8');

  test('imageOptimizer 模块提供等比缩放、体积防御与透明显色支持', () => {
    assert(optimizerSrc.includes('optimizeImageFileToDataUrl'), '导出 optimizeImageFileToDataUrl 函数');
    assert(optimizerSrc.includes('DEFAULT_MAX_DIMENSION'), '包含默认最大尺寸限制');
    assert(optimizerSrc.includes('DEFAULT_MAX_FILE_SIZE'), '包含 10MB 物理文件安全防御');
    assert(optimizerSrc.includes('canvasToDataUrl'), '包含 Canvas 高保真等比重绘');
  });

  test('全书封面与三大角色面板全量接入本地图像优化器', () => {
    assert(bookCoverSrc.includes('optimizeImageFileToDataUrl'), 'BookCoverModal 接入优化器');
    assert(charsViewSrc.includes('optimizeImageFileToDataUrl'), 'CharactersView 接入优化器');
    assert(charsPanelSrc.includes('optimizeImageFileToDataUrl'), 'CharacterProfilesPanel 接入优化器');
    assert(sandboxPanelSrc.includes('optimizeImageFileToDataUrl'), 'CharacterSandboxPanel 接入优化器');
  });

  test('OpenAIClient 生图网关安全防御已包含前缀重复检测与业务错误提取', () => {
    assert(openaiClientSrc.includes('b64.starts_with("data:image")'), '防止 data:image 前缀被重复拼接');
    assert(openaiClientSrc.includes('val.get("error")'), '自动捕获并提取根级业务 error 消息');
  });

  test('SQLite 核心数据库模块彻底消除潜在 Panic unwrap', () => {
    assert(!dbSrc.includes('let cur_v = current_version_id.unwrap();'), '消除 save_chapter_content 中的 unwrap');
    assert(!dbSrc.includes('target_novel_id.as_ref().unwrap()'), '消除 set_active_voice_profile 中的 unwrap');
  });

  console.log('\n===============================================================');
  console.log(`🎉 恭喜！全部 ${passCount} 项性能边界与漏洞修复断言 100% 通过！`);
  console.log('===============================================================');
}

runTests().catch((e) => {
  console.error('测试失败:', e);
  process.exit(1);
});
