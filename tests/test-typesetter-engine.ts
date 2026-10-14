import { TypesetterEngine } from '../src/features/typesetter/typesetterEngine';

console.log('===============================================================');
console.log(' NovelForge AI V2.5 — 网文排版清洗机与敏感词审查自动化测试');
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

// --- 测试 1: 起点中文网紧凑排版预设 ---
console.log('▶ [测试 1] 起点中文网紧凑排版规范 (全角两空格缩进、无多余空行)');
const rawQidian = `  深空冷寂，战舰在暗夜中滑行。 
    
    引力波雷达骤然发出蜂鸣。   
`;

const resQidian = TypesetterEngine.formatText(rawQidian, 'QIDIAN');
assert(resQidian.paragraphCount === 2, '成功识别 2 个自然段落');
const linesQidian = resQidian.cleanedText.split('\n');
assert(linesQidian.length === 2, '起点紧凑模式下段与段之间无多余空行');
assert(linesQidian[0].startsWith('\u3000\u3000'), '第一段段首严格包含两个全角空格缩进');
assert(linesQidian[1].startsWith('\u3000\u3000'), '第二段段首严格包含两个全角空格缩进');
assert(!linesQidian[0].endsWith(' '), '段尾多余半角空格已被消除');

// --- 测试 2: 番茄小说呼吸留白排版预设 ---
console.log('\n▶ [测试 2] 番茄小说呼吸感留白排版 (段间保留单空行)');
const rawFanqie = `林远握紧操纵杆。
二号副传感器读数溢出。
舰桥红光急促闪烁。`;

const resFanqie = TypesetterEngine.formatText(rawFanqie, 'FANQIE');
assert(resFanqie.paragraphCount === 3, '成功识别 3 个自然段落');
const partsFanqie = resFanqie.cleanedText.split('\n\n');
assert(partsFanqie.length === 3, '番茄模式下段与段之间严格保留单空行留白');
assert(partsFanqie[0].startsWith('\u3000\u3000'), '段首依然保持全角缩进');

// --- 测试 3: 中英文标点全角规范化 ---
console.log('\n▶ [测试 3] 中英文半角标点智能规范化');
const rawPunctuation = `警报响了,怎么回事?难道是敌袭!林远(舰长)沉声道:检查仪表;圆周率约是3.14。`;
const resPunctuation = TypesetterEngine.formatText(rawPunctuation, 'GENERAL');
assert(resPunctuation.cleanedText.includes('警报响了，怎么回事？难道是敌袭！'), '半角逗号、问号、感叹号已转换为全角');
assert(resPunctuation.cleanedText.includes('林远（舰长）沉声道：检查仪表；'), '半角括号、冒号、分号已转换为全角');
assert(resPunctuation.cleanedText.includes('3.14'), '保留数学浮点数 3.14 中的英文句点不被误转');

// --- 测试 4: 破折号与标准六点省略号 ---
console.log('\n▶ [测试 4] 破折号与中文标准六点省略号规范化');
const rawDashes = `他深吸一口气--那是未知的深空...一切都将结束.....`;
const resDashes = TypesetterEngine.formatText(rawDashes, 'GENERAL');
assert(resDashes.cleanedText.includes('他深吸一口气——那是未知的深空……一切都将结束……'), '连续短横线转为破折号，多重点号转为六点省略号');

// --- 测试 5: 英文直引号转换为成对中文双引号 ---
console.log('\n▶ [测试 5] 英文直引号转成对中文弯引号');
const rawQuotes = `林远下令:"全体进入曲率就绪状态!"`;
const resQuotes = TypesetterEngine.formatText(rawQuotes, 'GENERAL');
assert(resQuotes.cleanedText.includes('“全体进入曲率就绪状态！”'), '英文直双引号已转换为成对中文双引号');

// --- 测试 6: 平台敏感违规词审查与替换建议 (Censor Guard) ---
console.log('\n▶ [测试 6] 平台违规与敏感词审查');
const rawCensor = `凶徒在此处肢解了对手，更服用了合欢散，企图挑衅中南海高层。`;
const resCensor = TypesetterEngine.formatText(rawCensor, 'QIDIAN');
assert(resCensor.censorMatches.length >= 3, '成功扫描出多处高危敏感违规词');
const words = resCensor.censorMatches.map((m) => m.word);
assert(words.includes('肢解'), '成功识别暴力血腥词汇 "肢解"');
assert(words.includes('合欢散'), '成功识别违规涉低俗词汇 "合欢散"');
assert(words.includes('中南海'), '成功识别涉政禁限词汇 "中南海"');

const matchZhijie = resCensor.censorMatches.find((m) => m.word === '肢解');
assert(matchZhijie?.suggest === '重创 / 撕碎', '给出合理的网络文学建议替换词');

// --- 测试 7: 纯净文学白描无误报 ---
console.log('\n▶ [测试 7] 纯净文学正文零误报');
const rawClean = `风穿过松林，在青石阶上落下一层细雪。少年推开柴扉，肩头落着半寸微凉。`;
const resClean = TypesetterEngine.formatText(rawClean, 'QIDIAN');
assert(resClean.censorMatches.length === 0, '规范白描正文敏感词命中数为 0');

// --- 测试 8: 异常防御：空敏感词项绝对不引发死循环与卡顿 ---
console.log('\n▶ [测试 8] 词典空字符串安全防御');
const badDict = [
  { word: '', category: 'POLITICS' as const, level: 'HIGH' as const },
  { word: '杀人犯', category: 'PLATFORM_BANNED' as const, level: 'HIGH' as const },
];
const safeMatches = TypesetterEngine.scanCensorWords('此人乃是凶顽杀人犯。', badDict);
assert(safeMatches.length === 1 && safeMatches[0].word === '杀人犯', '空词项安全跳过，未引发死循环，正常识别杀人犯');

console.log('\n===============================================================');
console.log(` 验收测试完成：总计 ${totalCount} 项，通过 ${passCount} 项，失败 0 项`);
console.log('===============================================================\n');
