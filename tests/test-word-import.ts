/**
 * Word (.docx) 解析与智能分章引擎 专项测试套件
 */

import { WordImportService } from '../src/features/importer/services/WordImportService';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — Word (.docx) 解析与智能分章引擎 专项单元测试');
  console.log('===============================================================\n');

  // 测试 1：中文精确字符计数
  console.log('▶ [测试 1] 中文字符计数（剔除多余空白）');
  const sample1 = '　　第一章 重生归来\n\n天地不仁，以万物为刍狗。\n\n';
  const count1 = WordImportService.countWords(sample1);
  assert(count1 === 19, `字符数正确计算为 19（实际：${count1}）`);

  // 测试 2：智能识别多章节与标题提取
  console.log('\n▶ [测试 2] 智能识别多章节与标题提取');
  const bookText = `
这里是一段作者序言，记录创作初衷和故事背景设定。天地玄黄，宇宙洪荒。

第一章 少年出山
大荒无垠，山岳巍峨。少年石渊背负一柄锈迹斑斑的长剑，走出了守护他十六年的古老村落。

第二章 剑鸣九霄
寒风凛冽。古刹内的烛火摇曳不定，门外传来一阵急促的马蹄声。

第 3 章 宿命之敌
血月当空，黑袍人冷笑着从阴影中走出。

尾声 终局之战
多年以后，大荒平静如初。
  `;

  const chapters = WordImportService.splitChapters(bookText, 'AUTO');
  assert(chapters.length === 5, `成功切分出 5 个章节（实际：${chapters.length}）`);
  assert(chapters[0].title === '序章 / 前言', `成功自动提取前言/序章: ${chapters[0].title}`);
  assert(chapters[1].title === '第一章 少年出山', `章节 1 标题匹配正确: ${chapters[1].title}`);
  assert(chapters[2].title === '第二章 剑鸣九霄', `章节 2 标题匹配正确: ${chapters[2].title}`);
  assert(chapters[3].title.includes('3 章'), `章节 3 标题匹配正确: ${chapters[3].title}`);
  assert(chapters[4].title === '尾声 终局之战', `尾声 标题匹配正确: ${chapters[4].title}`);

  // 测试 3：单章无标题模式降级
  console.log('\n▶ [测试 3] 无分章标识时的智能单章降级');
  const shortText = '这是一篇短篇故事，没有任何章节标记。从前有座山，山里有座庙。';
  const singleChapter = WordImportService.splitChapters(shortText, 'AUTO');
  assert(singleChapter.length === 1, `无标记时降级为 1 章（实际：${singleChapter.length}）`);
  assert(singleChapter[0].title === '第一章', `默认标题为第一章: ${singleChapter[0].title}`);

  // 测试 4：段落格式清洗与全角缩进
  console.log('\n▶ [测试 4] 中文段落格式清洗与全角双空格对齐');
  const messyText = '第一行未缩进文本\n\n\n\n   第二行空格缩进文本   \n\n　　第三行已有缩进文本';
  const normalized = WordImportService.normalizeParagraphs(messyText);
  const lines = normalized.split('\n\n');
  assert(lines.length === 3, `过滤多余换行，保留 3 段（实际：${lines.length}）`);
  assert(lines[0].startsWith('　　'), '第一段成功补齐全角双空格');
  assert(lines[1].startsWith('　　'), '第二段空格成功清洗为全角双空格');
  assert(lines[2].startsWith('　　'), '第三段保持全角双空格');

  // 测试 5：自定义正则切分
  console.log('\n▶ [测试 5] 自定义正则切分（如 === 标题 ===）');
  const customText = `
=== 第01回 灵猴出世 ===
花果山福地，水帘洞洞天。
=== 第02回 拜师学艺 ===
灵台方寸山，斜月三星洞。
  `;
  const customChapters = WordImportService.splitChapters(customText, 'CUSTOM_REGEX', '===\\s*([^=\\n]+)\\s*===');
  assert(customChapters.length === 2, `自定义正则成功切分 2 章（实际：${customChapters.length}）`);
  assert(customChapters[0].title.includes('第01回'), `标题 1 包含第01回: ${customChapters[0].title}`);
  assert(customChapters[1].title.includes('第02回'), `标题 2 包含第02回: ${customChapters[1].title}`);

  console.log('\n===============================================================');
  console.log(` 测试总结: 共 ${passCount + failCount} 项，通过 ${passCount} 项，失败 ${failCount} 项`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
