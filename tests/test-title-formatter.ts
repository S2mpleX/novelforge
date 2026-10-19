import { cleanTitlePrefix, formatNodeDisplayTitle } from '../src/utils/titleFormatter';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- 测试标题前缀去重与展示规范化 ---');

// 1. Volume 格式化测试
assert(
  cleanTitlePrefix('第一卷：初入尘世', 'VOLUME') === '初入尘世',
  '清理中文卷名带冒号失败'
);
assert(
  cleanTitlePrefix('第 1 卷: 初入尘世', 'VOLUME') === '初入尘世',
  '清理数字卷名失败'
);
assert(
  cleanTitlePrefix('第 1 卷: 第一卷：初入尘世', 'VOLUME') === '初入尘世',
  '清理双重重复卷名失败'
);
assert(
  cleanTitlePrefix('第一卷', 'VOLUME') === '',
  '无副标题的纯卷名应清理为空'
);
assert(
  cleanTitlePrefix('初入尘世', 'VOLUME') === '初入尘世',
  '无前缀的副标题应保留'
);

assert(
  formatNodeDisplayTitle('第一卷：初入尘世', 'VOLUME', 1) === '第 1 卷: 初入尘世',
  '展示重复卷名应规整为单一前缀'
);
assert(
  formatNodeDisplayTitle('第一卷', 'VOLUME', 1) === '第 1 卷',
  '纯卷名展示应为第 1 卷'
);
assert(
  formatNodeDisplayTitle('初入尘世', 'VOLUME', 1) === '第 1 卷: 初入尘世',
  '无前缀卷名组装展示失败'
);

// 2. Chapter 格式化测试
assert(
  cleanTitlePrefix('第一章 宗门大选', 'CHAPTER') === '宗门大选',
  '清理中文章节名失败'
);
assert(
  cleanTitlePrefix('第1章：宗门大选', 'CHAPTER') === '宗门大选',
  '清理数字章名带冒号失败'
);
assert(
  cleanTitlePrefix('第一回 风云突变', 'CHAPTER') === '风云突变',
  '清理回目名失败'
);
assert(
  cleanTitlePrefix('Chapter 12: Encounter', 'CHAPTER') === 'Encounter',
  '清理英文 Chapter 失败'
);
assert(
  formatNodeDisplayTitle('第一章 宗门大选', 'CHAPTER', 1) === '第 1 章: 宗门大选',
  '章节标题规范化组装失败'
);

// 3. Part & Scene 测试
assert(
  cleanTitlePrefix('第一篇：宏大开局', 'PART') === '宏大开局',
  '清理篇名失败'
);
assert(
  formatNodeDisplayTitle('第一篇：宏大开局', 'PART', 1) === '第 1 篇: 宏大开局',
  '篇展示组装失败'
);
assert(
  cleanTitlePrefix('第一幕 荒野搏杀', 'SCENE') === '荒野搏杀',
  '清理幕名失败'
);
assert(
  formatNodeDisplayTitle('幕 1: 荒野搏杀', 'SCENE', 1) === '幕 1: 荒野搏杀',
  '幕展示组装失败'
);

console.log('✅ 所有标题去重与规范化测试均顺利通过！');
