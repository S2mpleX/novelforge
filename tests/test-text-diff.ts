import { computeTextDiff } from '../src/utils/textDiff';

function runDiffTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — 文本 Diff 引擎与可视化差异计算自动化测试');
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

  // 测试 1: 基础相同文本
  console.log('▶ [测试 1] 完全相同的文本 Diff');
  const identical = computeTextDiff('青石古道残阳', '青石古道残阳');
  assert('相同文本返回单一 EQUAL 块', identical.length === 1 && identical[0].type === 'EQUAL');

  // 测试 2: 典型 AI 套话替换 Diff
  console.log('\n▶ [测试 2] AI 套话替换为白描动作 Diff');
  const orig = '他嘴角勾起了一抹冷笑，转身离开。';
  const rev = '他面无表情地攥紧刀柄，转身走入暮色。';
  const diff = computeTextDiff(orig, rev);

  const removedParts = diff.filter(d => d.type === 'REMOVED').map(d => d.text).join('');
  const addedParts = diff.filter(d => d.type === 'ADDED').map(d => d.text).join('');

  assert('成功标记出被删除的原文词汇', removedParts.includes('嘴角勾起了一抹冷笑'));
  assert('成功标记出新增的精修动作', addedParts.includes('面无表情地攥紧刀柄'));

  // 测试 3: 空文本与全量替换
  console.log('\n▶ [测试 3] 边界情况检测');
  const fromEmpty = computeTextDiff('', '新增段落');
  assert('从空到有全部标记为 ADDED', fromEmpty.length === 1 && fromEmpty[0].type === 'ADDED');

  const toEmpty = computeTextDiff('删除段落', '');
  assert('从有到空全部标记为 REMOVED', toEmpty.length === 1 && toEmpty[0].type === 'REMOVED');

  console.log('\n===============================================================');
  console.log(` 测试完成：总计 ${total} 项，通过 ${passed} 项，失败 ${total - passed} 项`);
  console.log('===============================================================\n');
}

runDiffTests();
