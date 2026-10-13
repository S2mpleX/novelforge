import type { StructuredChangelog } from '../types';

export class ChangelogParser {
  /**
   * 将 Markdown 文本或 Release Note 解析为结构化更新日志对象
   */
  static parse(rawBody: string, version: string, date?: string): StructuredChangelog {
    const lines = rawBody.split('\n');
    const features: string[] = [];
    const improvements: string[] = [];
    const bugfixes: string[] = [];
    const breakingChanges: string[] = [];
    const knownIssues: string[] = [];

    let currentSection: 'features' | 'improvements' | 'bugfixes' | 'breaking' | 'known' | 'none' = 'none';
    const summaryLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // 标题识别
      if (line.startsWith('#')) {
        const lower = line.toLowerCase();
        if (lower.includes('新增') || lower.includes('新特性') || lower.includes('feature')) {
          currentSection = 'features';
        } else if (lower.includes('优化') || lower.includes('改进') || lower.includes('improvement') || lower.includes('perf')) {
          currentSection = 'improvements';
        } else if (lower.includes('修复') || lower.includes('bug') || lower.includes('fix')) {
          currentSection = 'bugfixes';
        } else if (lower.includes('兼容') || lower.includes('破坏') || lower.includes('breaking')) {
          currentSection = 'breaking';
        } else if (lower.includes('已知问题') || lower.includes('known issue')) {
          currentSection = 'known';
        } else {
          currentSection = 'none';
        }
        continue;
      }

      // 列表条目提取
      const isListItem = line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line);
      const cleanContent = isListItem ? line.replace(/^[-*]\s+|\d+\.\s+/, '').trim() : line;

      if (!cleanContent) continue;

      if (currentSection === 'features') {
        features.push(cleanContent);
      } else if (currentSection === 'improvements') {
        improvements.push(cleanContent);
      } else if (currentSection === 'bugfixes') {
        bugfixes.push(cleanContent);
      } else if (currentSection === 'breaking') {
        breakingChanges.push(cleanContent);
      } else if (currentSection === 'known') {
        knownIssues.push(cleanContent);
      } else if (summaryLines.length < 3 && !isListItem) {
        summaryLines.push(cleanContent);
      }
    }

    // 如果未匹配到明确的分类区块，将前置条目智能归纳
    if (features.length === 0 && improvements.length === 0 && bugfixes.length === 0) {
      for (const line of lines) {
        const clean = line.replace(/^[-*]\s+/, '').trim();
        if (clean && !clean.startsWith('#')) {
          if (clean.includes('修复') || clean.includes('fix') || clean.includes('Fix')) {
            bugfixes.push(clean);
          } else if (clean.includes('优化') || clean.includes('提速') || clean.includes('重构')) {
            improvements.push(clean);
          } else {
            features.push(clean);
          }
        }
      }
    }

    const summary = summaryLines.join(' ') || (features[0] ? `核心更新：${features[0]}` : '此版本包含多项功能升级与稳定性优化。');

    return {
      version,
      date: date || new Date().toISOString().split('T')[0],
      summary,
      features,
      improvements,
      bugfixes,
      breakingChanges,
      knownIssues,
      rawBody,
    };
  }

  /**
   * SemVer 语义化版本对比：v1 > v2 返回正数，v1 < v2 返回负数，相等返回 0
   */
  static compareSemVer(v1: string, v2: string): number {
    const normalize = (v: string) =>
      v
        .replace(/^v/i, '')
        .split('-')[0]
        .split('.')
        .map((n) => parseInt(n, 10) || 0);

    const [maj1 = 0, min1 = 0, pat1 = 0] = normalize(v1);
    const [maj2 = 0, min2 = 0, pat2 = 0] = normalize(v2);

    if (maj1 !== maj2) return maj1 - maj2;
    if (min1 !== min2) return min1 - min2;
    return pat1 - pat2;
  }
}
