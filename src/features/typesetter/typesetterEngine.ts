/**
 * NovelForge AI — 网文平台一键排版清洗机与敏感词合规审查引擎 (Typesetter & Censor Guard)
 * 专为中国主流网络文学平台（起点中文网、番茄小说、晋江文学城等）提供专业级格式化、标点统一与合规预检
 */

export type TypesetPreset = 'QIDIAN' | 'FANQIE' | 'JINJIANG' | 'GENERAL';

export interface TypesetOptions {
  indentTwoEm?: boolean; // 段首全角缩进 \u3000\u3000
  convertPunctuation?: boolean; // 中英文标点全角规范化
  fixQuotes?: boolean; // 英文引号转中文成对弯引号
  convertDashesAndEllipsis?: boolean; // 破折号与省略号规范化
  removeRedundantBlankLines?: boolean; // 清理连续空行
  removeTrailingSpaces?: boolean; // 清理段末多余空格
  blankLineBetweenParagraphs?: boolean; // 段与段之间保留单空行 (番茄模式)
  censorScan?: boolean; // 是否执行敏感合规扫描
}

export interface CensorMatch {
  word: string;
  category: 'POLITICS' | 'VIOLENCE' | 'PORN' | 'PLATFORM_BANNED';
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  column: number;
  suggest?: string;
}

export interface TypesetResult {
  cleanedText: string;
  originalCharCount: number;
  cleanedCharCount: number;
  paragraphCount: number;
  censorMatches: CensorMatch[];
}

/**
 * 网文高频敏感违规与限流词汇库（按平台审核规则分类）
 */
export const DEFAULT_CENSOR_DICT: Array<{
  word: string;
  category: CensorMatch['category'];
  level: CensorMatch['level'];
  suggest?: string;
}> = [
  // 涉政 / 禁限类
  { word: '中南海', category: 'POLITICS', level: 'HIGH', suggest: '权力核心 / 决策层' },
  { word: '国家主席', category: 'POLITICS', level: 'HIGH', suggest: '最高统帅 / 首脑' },
  { word: '省委书记', category: 'POLITICS', level: 'MEDIUM', suggest: '地方要员 / 封疆大吏' },
  { word: '反动', category: 'POLITICS', level: 'HIGH', suggest: '叛乱 / 异端' },
  // 暴力血腥类
  { word: '肢解', category: 'VIOLENCE', level: 'HIGH', suggest: '重创 / 撕碎' },
  { word: '开膛破肚', category: 'VIOLENCE', level: 'HIGH', suggest: '血洒当场' },
  { word: '虐杀', category: 'VIOLENCE', level: 'MEDIUM', suggest: '残忍诛灭' },
  { word: '血浆喷溅', category: 'VIOLENCE', level: 'LOW', suggest: '血痕斑驳' },
  // 低俗涉黄类
  { word: '春药', category: 'PORN', level: 'HIGH', suggest: '魅惑灵药 / 迷神散' },
  { word: '合欢散', category: 'PORN', level: 'HIGH', suggest: '阴毒秘药' },
  { word: '双修邪法', category: 'PORN', level: 'MEDIUM', suggest: '同源淬体' },
  { word: '呻吟娇喘', category: 'PORN', level: 'HIGH', suggest: '气息紊乱 / 低呼出声' },
  { word: '赤裸娇躯', category: 'PORN', level: 'MEDIUM', suggest: '纤细身形' },
  { word: '肉欲', category: 'PORN', level: 'HIGH', suggest: '贪念 / 执念' },
  // 平台网文常见限流屏蔽词
  { word: '自杀', category: 'PLATFORM_BANNED', level: 'HIGH', suggest: '自我了断 / 绝命' },
  { word: '毒品', category: 'PLATFORM_BANNED', level: 'HIGH', suggest: '禁药 / 祸胎' },
  { word: '走私军火', category: 'PLATFORM_BANNED', level: 'MEDIUM', suggest: '私运重械' },
  { word: '黑帮头目', category: 'PLATFORM_BANNED', level: 'LOW', suggest: '暗渠巨擘 / 灰产魁首' },
  { word: '杀人犯', category: 'PLATFORM_BANNED', level: 'MEDIUM', suggest: '凶徒 / 狂徒' },
];

export class TypesetterEngine {
  /**
   * 获取预设配置
   */
  public static getPresetOptions(preset: TypesetPreset): TypesetOptions {
    switch (preset) {
      case 'QIDIAN':
        return {
          indentTwoEm: true,
          convertPunctuation: true,
          fixQuotes: true,
          convertDashesAndEllipsis: true,
          removeRedundantBlankLines: true,
          removeTrailingSpaces: true,
          blankLineBetweenParagraphs: false, // 起点后台自带行距，段间不空行
          censorScan: true,
        };
      case 'FANQIE':
        return {
          indentTwoEm: true,
          convertPunctuation: true,
          fixQuotes: true,
          convertDashesAndEllipsis: true,
          removeRedundantBlankLines: true,
          removeTrailingSpaces: true,
          blankLineBetweenParagraphs: true, // 番茄移动端偏好段间单空行
          censorScan: true,
        };
      case 'JINJIANG':
        return {
          indentTwoEm: true,
          convertPunctuation: true,
          fixQuotes: true,
          convertDashesAndEllipsis: true,
          removeRedundantBlankLines: true,
          removeTrailingSpaces: true,
          blankLineBetweenParagraphs: false,
          censorScan: true,
        };
      case 'GENERAL':
      default:
        return {
          indentTwoEm: true,
          convertPunctuation: true,
          fixQuotes: true,
          convertDashesAndEllipsis: true,
          removeRedundantBlankLines: true,
          removeTrailingSpaces: true,
          blankLineBetweenParagraphs: false,
          censorScan: true,
        };
    }
  }

  /**
   * 核心文本排版与清洗执行器
   */
  public static formatText(
    rawText: string,
    preset: TypesetPreset = 'QIDIAN',
    customOptions?: Partial<TypesetOptions>
  ): TypesetResult {
    const opts: TypesetOptions = {
      ...this.getPresetOptions(preset),
      ...customOptions,
    };

    const originalCharCount = rawText.replace(/\s/g, '').length;
    if (!rawText || !rawText.trim()) {
      return {
        cleanedText: '',
        originalCharCount: 0,
        cleanedCharCount: 0,
        paragraphCount: 0,
        censorMatches: [],
      };
    }

    // 1. 按行拆分，过滤非法不可见控制字符 (保留 \n 与全半角文字)
    let lines = rawText
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .split(/\r?\n/);

    const processedParagraphs: string[] = [];

    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // 清除行内首部可能残留的各种空格/制表符/全角空格
      trimmed = trimmed.replace(/^[\s\u3000\t]+/, '');
      if (opts.removeTrailingSpaces) {
        trimmed = trimmed.replace(/[\s\u3000\t]+$/, '');
      }

      // 2. 标点符号规范化
      if (opts.convertPunctuation) {
        trimmed = this.normalizePunctuation(trimmed);
      }

      // 3. 破折号与省略号规范化
      if (opts.convertDashesAndEllipsis) {
        trimmed = this.normalizeDashesAndEllipsis(trimmed);
      }

      // 4. 成对引号纠偏
      if (opts.fixQuotes) {
        trimmed = this.normalizeQuotes(trimmed);
      }

      // 5. 段首全角两格缩进 (\u3000\u3000)
      if (opts.indentTwoEm) {
        trimmed = `\u3000\u3000${trimmed}`;
      }

      processedParagraphs.push(trimmed);
    }

    // 6. 段落组织：根据预设决定是否保留单空行
    let cleanedText = '';
    if (opts.blankLineBetweenParagraphs) {
      cleanedText = processedParagraphs.join('\n\n');
    } else {
      cleanedText = processedParagraphs.join('\n');
    }

    const cleanedCharCount = cleanedText.replace(/\s/g, '').length;

    // 7. 敏感词扫描
    let censorMatches: CensorMatch[] = [];
    if (opts.censorScan) {
      censorMatches = this.scanCensorWords(cleanedText);
    }

    return {
      cleanedText,
      originalCharCount,
      cleanedCharCount,
      paragraphCount: processedParagraphs.length,
      censorMatches,
    };
  }

  /**
   * 中英文标点全角规范化
   */
  private static normalizePunctuation(text: string): string {
    return text
      .replace(/,/g, '，')
      .replace(/(?<![0-9])\.(?![0-9])/g, '。') // 避免误伤浮点数如 3.14
      .replace(/!/g, '！')
      .replace(/\?/g, '？')
      .replace(/;/g, '；')
      .replace(/:/g, '：')
      .replace(/\(/g, '（')
      .replace(/\)/g, '）')
      .replace(/\[/g, '【')
      .replace(/\]/g, '】');
  }

  /**
   * 破折号与省略号规范化
   */
  private static normalizeDashesAndEllipsis(text: string): string {
    return text
      // 将连续多重减号或下划线转为中文双破折号
      .replace(/--+|——{2,}|——/g, '——')
      // 将多个连续句号、英文省略号转换为标准六点省略号
      .replace(/\.{3,}|。{3,}|…+/g, '……');
  }

  /**
   * 引号成对中文化转换
   */
  private static normalizeQuotes(text: string): string {
    let inDoubleQuote = false;
    let res = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (!inDoubleQuote) {
          res += '“';
          inDoubleQuote = true;
        } else {
          res += '”';
          inDoubleQuote = false;
        }
      } else if (char === "'") {
        // 单引号处理
        const prev = i > 0 ? text[i - 1] : '';
        const next = i < text.length - 1 ? text[i + 1] : '';
        // 如果夹在两个英文字符中间，可能是所有格如 it's，保留原样
        if (/[a-zA-Z]/.test(prev) && /[a-zA-Z]/.test(next)) {
          res += "'";
        } else {
          res += '’';
        }
      } else {
        res += char;
      }
    }
    return res;
  }

  /**
   * 敏感词扫描定位
   */
  public static scanCensorWords(
    text: string,
    customDict: typeof DEFAULT_CENSOR_DICT = DEFAULT_CENSOR_DICT
  ): CensorMatch[] {
    const matches: CensorMatch[] = [];
    const lines = text.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];
      for (const item of customDict) {
        if (!item.word || item.word.length === 0) continue;
        let startIndex = 0;
        while ((startIndex = lineText.indexOf(item.word, startIndex)) !== -1) {
          matches.push({
            word: item.word,
            category: item.category,
            level: item.level,
            line: lineIdx + 1,
            column: startIndex + 1,
            suggest: item.suggest,
          });
          startIndex += item.word.length;
        }
      }
    }

    return matches;
  }
}
