import { HumanizerEngine } from '../src/features/humanizer/HumanizerEngine';

function runTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — Humanizer 去 AI 味与提示词约束专项自动化测试');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean, detail: string = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    } else {
      console.error(`  ❌ FAIL: ${desc} ${detail ? `(${detail})` : ''}`);
      process.exitCode = 1;
    }
  }

  // 测试 1: 典型 AI 腔调段落扫描
  console.log('▶ [测试 1] 扫描典型 AI 套话段落');
  const aiHeavyText = `
    不仅如此，主角嘴角勾起了一抹冷酷的弧度，眼中闪过一丝不可察觉的杀机。
    深吸了一口气，空气仿佛凝固了。不得不说，这代表着他的实力已经突破。
    殊不知，命运的齿轮在这一刻开始转动。
  `;
  const matches = HumanizerEngine.detectClichés(aiHeavyText);
  assert('成功扫描出套话数量 >= 6', matches.length >= 6, `实际检出: ${matches.length}`);
  const phrases = matches.map(m => m.phrase);
  assert('成功捕获 "不仅如此"', phrases.includes('不仅如此'));
  assert('成功捕获 "嘴角勾起"', phrases.includes('嘴角勾起'));
  assert('成功捕获 "眼中闪过"', phrases.includes('眼中闪过'));
  assert('成功捕获 "空气仿佛凝固"', phrases.includes('空气仿佛凝固') || phrases.includes('仿佛'));
  assert('成功捕获 "殊不知"', phrases.includes('殊不知'));
  assert('成功捕获 "命运的齿轮"', phrases.includes('命运的齿轮'));

  // 测试 2: 审计报告生成与评分扣减
  console.log('\n▶ [测试 2] 严重 AI 味文本质量评分与评级判定');
  const report = HumanizerEngine.auditText(aiHeavyText);
  assert('AI 浓郁文本得分应当 < 70', report.score < 70, `实际得分: ${report.score}`);
  assert('评级判定应为 NEEDS_POLISH 或 SEVERE_AI_TONE', ['NEEDS_POLISH', 'SEVERE_AI_TONE'].includes(report.rating));
  assert('诊断建议包含针对性提示', report.summary.length > 10);

  // 测试 3: 高文学质感白描文本测试
  console.log('\n▶ [测试 3] 高人情味与白描文本检测（低误报率）');
  const highQualityText = `
    灶膛里的松柴噼啪炸了一声，溅出几星火沫。
    他没抬头，手里捏着半块发硬的玉米馍，粗糙的指腹顺着豁口一点点往下剥。
    窗外落着细盐似的冷雪，青石板路早就冻得发亮。对面的老汉抽完最后一锅旱烟，在鞋底上磕了磕烟袋锅子，铜嘴碰着牛皮，发出笃笃的两声闷响。
  `;
  const cleanMatches = HumanizerEngine.detectClichés(highQualityText);
  const cleanReport = HumanizerEngine.auditText(highQualityText);
  assert('纯文学白描文本命中套话数为 0', cleanMatches.length === 0, `实际检出: ${cleanMatches.length}`);
  assert('纯文学白描文本得分应 >= 95', cleanReport.score >= 95, `实际得分: ${cleanReport.score}`);
  assert('评级判定应为 EXCELLENT', cleanReport.rating === 'EXCELLENT');

  // 测试 4: 专业 Humanizer 润色提示词组装验证
  console.log('\n▶ [测试 4] 自动化组装 Humanizer 强约束重写 Prompt');
  const prompt = HumanizerEngine.buildPolishingPrompt('测试文本', '修仙玄幻', '剔除说明文腔');
  assert('Prompt 包含 Show Don\'t Tell 戒律', prompt.includes("Show, Don't Tell"));
  assert('Prompt 明确封杀嘴角勾起与眼中闪过', prompt.includes('嘴角勾起') && prompt.includes('眼中闪过'));
  assert('Prompt 包含题材定制标识', prompt.includes('修仙玄幻'));
  assert('Prompt 严厉禁止输出客套废话', prompt.includes('直接输出') || prompt.includes('绝不要带任何'));

  console.log('\n===============================================================');
  console.log(` 测试完成：总计 ${total} 项，通过 ${passed} 项，失败 ${total - passed} 项`);
  console.log('===============================================================\n');
}

runTests();
