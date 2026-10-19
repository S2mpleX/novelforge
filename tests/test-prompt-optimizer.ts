import fs from 'fs';
import path from 'path';
import { api } from '../src/utils/tauriBridge';
import type { PromptOptimizationAngle } from '../src/types';

console.log('===============================================================');
console.log('🧪 NovelForge AI V2.5.1 — AI 提示词深度重构引擎核心自动化测试');
console.log('===============================================================\n');

let passCount = 0;
let totalCount = 0;

function assert(condition: boolean, msg: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
}

async function runTests() {
  // --- 测试 1: 权威系统提示词文件存在性与规范 ---
  console.log('▶ [测试 1] 提示词与业务解耦规范（prompts/prompt_optimizer.md）');
  const promptPath = path.resolve(process.cwd(), 'prompts', 'prompt_optimizer.md');
  assert(fs.existsSync(promptPath), 'prompts/prompt_optimizer.md 物理文件存在');
  const promptContent = fs.readFileSync(promptPath, 'utf-8');
  assert(promptContent.includes('四大点金重构维度'), '系统提示词包含四大点金重构维度指南');
  assert(promptContent.includes('DRAMA_CONFLICT'), '系统提示词包含戏剧冲突博弈视角');
  assert(promptContent.includes('SENSORY_DETAIL'), '系统提示词包含感官白描物象视角');
  assert(promptContent.includes('PLOT_HOOK'), '系统提示词包含伏笔悬念断章视角');
  assert(promptContent.includes('CONCISE_PUNCHY'), '系统提示词包含快节奏爽利推进视角');
  assert(promptContent.includes('optimized_prompt'), '系统提示词包含严格 JSON Schema');

  // --- 测试 2: 戏剧博弈视角 (DRAMA_CONFLICT) ---
  console.log('\n▶ [测试 2] 戏剧博弈与人物交锋视角优化 (DRAMA_CONFLICT)');
  const resDrama = await api.optimizeWritingPrompt({
    raw_prompt: '写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋。',
    optimization_angle: 'DRAMA_CONFLICT',
  });
  assert(Boolean(resDrama), '成功返回重构结果对象');
  assert(resDrama.original_prompt.includes('藏经阁第七层'), '原提示词无损保留');
  assert(resDrama.optimized_prompt.includes('戏剧博弈') || resDrama.optimized_prompt.includes('冲突'), '重构提示词强化了戏剧冲突与博弈');
  assert(Array.isArray(resDrama.enhancement_points) && resDrama.enhancement_points.length >= 3, '提供了至少3个核心文学强化要点');
  assert(Boolean(resDrama.suggested_hooks), '生成了章末断章悬念');
  assert(Array.isArray(resDrama.suggested_tags) && resDrama.suggested_tags.length > 0, '生成了对应文学标签');

  // --- 测试 3: 感官白描视角 (SENSORY_DETAIL) ---
  console.log('\n▶ [测试 3] 多维感官白描与物象细节视角优化 (SENSORY_DETAIL)');
  const resSensory = await api.optimizeWritingPrompt({
    raw_prompt: '主角独自穿过雨夜中的破败城隍庙，寻找受伤的同伴。',
    optimization_angle: 'SENSORY_DETAIL',
  });
  assert(resSensory.optimized_prompt.includes('感官白描') || resSensory.optimized_prompt.includes('五感') || resSensory.optimized_prompt.includes('细节'), '重构提示词侧重感官白描与物象');
  assert(resSensory.enhancement_points.some(p => p.includes('白描') || p.includes('感官') || p.includes('细节')), '核心强化要点点明临场感');

  // --- 测试 4: 伏笔悬念断章视角 (PLOT_HOOK) ---
  console.log('\n▶ [测试 4] 伏笔勾连与章末断章悬念视角优化 (PLOT_HOOK)');
  const resHook = await api.optimizeWritingPrompt({
    raw_prompt: '主角解开密室机关，发现盒子里的遗物。',
    optimization_angle: 'PLOT_HOOK',
  });
  assert(resHook.optimized_prompt.includes('断章') || resHook.optimized_prompt.includes('伏笔') || resHook.optimized_prompt.includes('悬念'), '重构指令体现断章悬念');
  assert(Boolean(resHook.suggested_hooks), '断章悬念有效生成');

  // --- 测试 5: 快节奏爽利推进视角 (CONCISE_PUNCHY) ---
  console.log('\n▶ [测试 5] 快节奏爽利推进与强对抗视角优化 (CONCISE_PUNCHY)');
  const resPunchy = await api.optimizeWritingPrompt({
    raw_prompt: '敌对杀手突袭营地，主角果断拔刀迎战。',
    optimization_angle: 'CONCISE_PUNCHY',
  });
  assert(resPunchy.optimized_prompt.includes('快节奏') || resPunchy.optimized_prompt.includes('强冲突'), '重构指令体现快节奏推进');

  // --- 测试 6: 角度遍历与类型安全性 ---
  console.log('\n▶ [测试 6] 四维优化视角全覆盖与完整性验证');
  const allAngles: PromptOptimizationAngle[] = ['DRAMA_CONFLICT', 'SENSORY_DETAIL', 'PLOT_HOOK', 'CONCISE_PUNCHY'];
  for (const angle of allAngles) {
    const res = await api.optimizeWritingPrompt({
      raw_prompt: '测试粗纲指令',
      optimization_angle: angle,
    });
    assert(res.optimized_prompt.length > 50, `视角 ${angle} 返回了详实充实的文学重构提示词`);
  }

  console.log('\n===============================================================');
  console.log(`🎉 全部 ${passCount}/${totalCount} 项自动化测试 100% 顺利通过！AI 提示词优化引擎稳健可靠！`);
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('测试运行异常:', err);
  process.exit(1);
});
