/**
 * 章节/分卷/篇章/场景标题格式化工具
 * 解决前后端标题自带“第一卷：/第1章”前缀导致 UI 重复拼接显示（如“第 1 卷: 第一卷：初入尘世”）的问题。
 */

// 匹配卷前缀：如“第一卷：”、“第 1 卷:”、“卷一：”、“Volume 1:”、“Vol.1 -”
const VOLUME_PREFIX_REGEX =
  /^(?:第\s*[0-9一二三四五六七八九十百千万零两]+\s*卷|卷\s*[0-9一二三四五六七八九十百千万零两]+|Volume\s*\d+|Vol\.\s*\d+)[:：\s\-—_]*/i;

// 匹配章前缀：如“第一章：”、“第 1 章 ”、“第一回：”、“Chapter 1:”、“Ch.1 -”
const CHAPTER_PREFIX_REGEX =
  /^(?:第\s*[0-9一二三四五六七八九十百千万零两]+\s*[章节回话]|Chapter\s*\d+|Ch\.\s*\d+)[:：\s\-—_]*/i;

// 匹配篇/部前缀：如“第一篇：”、“第一部：”、“Part 1:”、“第 1 篇 ”
const PART_PREFIX_REGEX =
  /^(?:第\s*[0-9一二三四五六七八九十百千万零两]+\s*[篇部]|Part\s*\d+)[:：\s\-—_]*/i;

// 匹配场景/幕前缀：如“第一幕：”、“幕 1:”、“Scene 1:”、“第 1 幕 ”
const SCENE_PREFIX_REGEX =
  /^(?:第\s*[0-9一二三四五六七八九十百千万零两]+\s*幕|幕\s*[0-9一二三四五六七八九十百千万零两]+|Scene\s*\d+)[:：\s\-—_]*/i;

/**
 * 清除用户正文或预设数据中冗余的“第X卷/第X章”前缀。
 * 支持多重清理（例如已错误保存的“第 1 卷: 第一卷：初入尘世”将递归清洗为“初入尘世”）。
 * 若标题本身仅有“第一卷”而无副标题，则返回空字符串。
 */
export function cleanTitlePrefix(
  title: string | undefined | null,
  type: 'PART' | 'VOLUME' | 'CHAPTER' | 'SCENE' | string
): string {
  if (!title) return '';
  let cleaned = title.trim();

  let regex: RegExp;
  switch (type.toUpperCase()) {
    case 'VOLUME':
      regex = VOLUME_PREFIX_REGEX;
      break;
    case 'CHAPTER':
      regex = CHAPTER_PREFIX_REGEX;
      break;
    case 'PART':
      regex = PART_PREFIX_REGEX;
      break;
    case 'SCENE':
      regex = SCENE_PREFIX_REGEX;
      break;
    default:
      return cleaned;
  }

  // 循环清洗可能被多次叠加的前缀
  let prev = '';
  while (cleaned !== prev && regex.test(cleaned)) {
    prev = cleaned;
    cleaned = cleaned.replace(regex, '').trim();
  }

  return cleaned;
}

/**
 * 组装规范且不重复的树节点或面板展示标题。
 * 样例效果：
 * - title="第一卷：初入尘世", type="VOLUME", number=1 => "第 1 卷: 初入尘世"
 * - title="第一卷", type="VOLUME", number=1 => "第 1 卷"
 * - title="初入尘世", type="VOLUME", number=1 => "第 1 卷: 初入尘世"
 * - title="第一章 宗门大选", type="CHAPTER", number=1 => "第 1 章: 宗门大选"
 * - title="宗门大选", type="CHAPTER", number=1 => "第 1 章: 宗门大选"
 */
export function formatNodeDisplayTitle(
  title: string | undefined | null,
  type: 'PART' | 'VOLUME' | 'CHAPTER' | 'SCENE' | string,
  number: number
): string {
  const nodeType = (type || '').toUpperCase();
  const cleaned = cleanTitlePrefix(title, nodeType);

  switch (nodeType) {
    case 'VOLUME':
      return cleaned ? `第 ${number} 卷: ${cleaned}` : `第 ${number} 卷`;
    case 'CHAPTER':
      return cleaned ? `第 ${number} 章: ${cleaned}` : `第 ${number} 章`;
    case 'PART':
      return cleaned ? `第 ${number} 篇: ${cleaned}` : `第 ${number} 篇`;
    case 'SCENE':
      return cleaned ? `幕 ${number}: ${cleaned}` : `幕 ${number}`;
    default:
      return title || '';
  }
}
