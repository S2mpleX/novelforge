import mammoth from 'mammoth';
import type {
  DocxParseResult,
  ParsedChapterItem,
  SplitMode,
  ImportOptions,
} from '../types';
import { api } from '@/utils/tauriBridge';

export class WordImportService {
  /**
   * 网文通用标准章节正则
   * 覆盖：
   * 1. 经典中文章节：第1章、第一章、第 一 章、第一回、第一节、第一卷、第一篇、第一部
   * 2. 序章与特殊章节：引子、序章、序言、楔子、前言、尾声、后记、番外、上架感言、完结感言
   * 3. 英文与混排：Chapter 1、Section 1
   * 4. 括号包裹：【第一章 ...】、[第1章 ...]
   */
  public static readonly DEFAULT_CHAPTER_REGEX =
    /(?:^|\n)\s*(第\s*[0-9一二三四五六七八九十百千万零两]+\s*[章节回集卷篇部]|Chapter\s*\d+|Section\s*\d+|引子|序章|序言|楔子|前言|尾声|后记|番外\s*[0-9一二三四五六七八九十百千万零两]*|上架感言|完结感言|【第.+?[章节回]】|\[第.+?[章节回]\])\s*([^\n\r]{0,60})/gi;

  /**
   * 精准中文字符计数（剔除回车换行与纯空格）
   */
  public static countWords(text: string): number {
    if (!text) return 0;
    return text.replace(/\s+/g, '').length;
  }

  /**
   * 解析用户上传的 .docx 文件
   */
  public static async parseDocx(file: File): Promise<DocxParseResult> {
    const arrayBuffer = await file.arrayBuffer();

    // 1. 调用 mammoth 提取纯文本与 HTML
    const [rawTextResult, rawHtmlResult] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer }),
    ]);

    const rawText = rawTextResult.value || '';
    const rawHtml = rawHtmlResult.value || '';

    // 2. 分析段落数与总字数
    const paragraphs = rawText
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const totalParagraphs = paragraphs.length;
    const totalWordCount = this.countWords(rawText);

    // 3. 智能拆分章节
    const chapters = this.splitChapters(rawText, 'AUTO');

    // 4. 提取检测到的模式标签
    const detectedPatterns: string[] = [];
    if (chapters.length > 1) {
      detectedPatterns.push(`智能识别到 ${chapters.length} 个独立章节`);
    } else {
      detectedPatterns.push('未检测到明显分章标识，默认整篇为单章');
    }

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      totalWordCount,
      totalParagraphs,
      rawText,
      rawHtml,
      chapters,
      detectedPatterns,
    };
  }

  /**
   * 根据指定模式切分章节
   */
  public static splitChapters(
    text: string,
    mode: SplitMode = 'AUTO',
    customPattern?: string
  ): ParsedChapterItem[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // 单章模式：不切分，直接整体作为单章
    if (mode === 'SINGLE_CHAPTER') {
      const cleanContent = this.normalizeParagraphs(text);
      return [
        {
          id: 'chapter-1',
          orderIndex: 1,
          title: '正文',
          content: cleanContent,
          charCount: this.countWords(cleanContent),
          previewText: cleanContent.slice(0, 120),
          selected: true,
        },
      ];
    }

    // 确定切分正则
    let regex: RegExp;
    if (mode === 'CUSTOM_REGEX' && customPattern && customPattern.trim()) {
      try {
        regex = new RegExp(customPattern.trim(), 'gi');
      } catch (err) {
        console.warn('自定义正则表达式非法，回退到默认分章规则:', err);
        regex = new RegExp(this.DEFAULT_CHAPTER_REGEX.source, 'gi');
      }
    } else {
      regex = new RegExp(this.DEFAULT_CHAPTER_REGEX.source, 'gi');
    }

    const matches: Array<{
      fullMatch: string;
      title: string;
      index: number;
    }> = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0].trim();
      const prefix = match[1] ? match[1].trim() : '';
      const suffix = match[2] ? match[2].trim() : '';
      const chapterTitle = suffix ? `${prefix} ${suffix}` : prefix;

      matches.push({
        fullMatch,
        title: chapterTitle || `第 ${matches.length + 1} 章`,
        index: match.index,
      });
    }

    // 如果未找到任何章节匹配项，则降级为整篇单章
    if (matches.length === 0) {
      const cleanContent = this.normalizeParagraphs(text);
      return [
        {
          id: 'chapter-1',
          orderIndex: 1,
          title: '第一章',
          content: cleanContent,
          charCount: this.countWords(cleanContent),
          previewText: cleanContent.slice(0, 120),
          selected: true,
        },
      ];
    }

    const chapters: ParsedChapterItem[] = [];

    // 检查第一章前面是否有“序言”、“引子”或前言文本
    const firstMatch = matches[0];
    if (firstMatch.index > 0) {
      const prologueContent = text.slice(0, firstMatch.index).trim();
      if (this.countWords(prologueContent) >= 10) {
        chapters.push({
          id: 'chapter-0',
          orderIndex: 0,
          title: '序章 / 前言',
          content: this.normalizeParagraphs(prologueContent),
          charCount: this.countWords(prologueContent),
          previewText: prologueContent.slice(0, 120),
          selected: true,
        });
      }
    }

    // 遍历所有章节切割正文
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];

      const startIndex = current.index + current.fullMatch.length;
      const endIndex = next ? next.index : text.length;

      const rawChapterText = text.slice(startIndex, endIndex).trim();
      const normalizedContent = this.normalizeParagraphs(rawChapterText);

      chapters.push({
        id: `chapter-${chapters.length + 1}`,
        orderIndex: chapters.length + 1,
        title: current.title,
        content: normalizedContent,
        charCount: this.countWords(normalizedContent),
        previewText: normalizedContent.slice(0, 120),
        selected: true,
      });
    }

    return chapters;
  }

  /**
   * 中文网文段落排版规范化：
   * 1. 过滤冗余空行与两端空格
   * 2. 段首自动对齐，使用全角双空格或段落标签
   */
  public static normalizeParagraphs(text: string): string {
    if (!text) return '';
    const lines = text.split(/\r?\n/);
    const cleaned: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // 保证段首有规范的双全角空格
      const formatted = line.startsWith('　　') ? line : `　　${line.replace(/^[ 　\t]+/, '')}`;
      cleaned.push(formatted);
    }

    return cleaned.join('\n\n');
  }

  /**
   * 批量将解析好的章节入库到本地 SQLite 数据库
   */
  public static async executeImport(
    result: DocxParseResult,
    options: ImportOptions,
    onProgress?: (current: number, total: number, chapterTitle: string) => void
  ): Promise<{ novelId: string; importedCount: number }> {
    const selectedChapters = result.chapters.filter((c) => c.selected);
    if (selectedChapters.length === 0) {
      throw new Error('未选择任何要导入的章节');
    }

    let novelId = options.targetNovelId;

    // 模式 A：新建一本小说并导入
    if (options.destination === 'NEW_NOVEL') {
      const title = options.novelTitle?.trim() || result.fileName.replace(/\.docx$/i, '') || '导入的小说';
      const genreProfile = options.genreProfile || '玄幻修仙';

      const newNovel = await api.createNovel({
        title,
        description: `从 Word 文档《${result.fileName}》自动导入，共计 ${selectedChapters.length} 章。`,
        genre_profile: genreProfile,
        chapter_target_length: 3000,
      });

      novelId = newNovel.id;
    }

    if (!novelId) {
      throw new Error('未指定导入目标作品 ID');
    }

    // 模式 B / 模式 A：批量创建章节入库
    let importedCount = 0;
    const total = selectedChapters.length;

    // 获取当前已有章节数，确定初始 chapter_number
    let baseOrder = 1;
    try {
      const existingChapters = await api.listChapters(novelId);
      baseOrder = existingChapters.length + 1;
    } catch (e) {
      baseOrder = 1;
    }

    for (let i = 0; i < selectedChapters.length; i++) {
      const item = selectedChapters[i];
      if (onProgress) {
        onProgress(i + 1, total, item.title);
      }

      await api.createChapter({
        novel_id: novelId,
        title: item.title,
        chapter_number: baseOrder + i,
        initial_content: item.content,
      });

      importedCount++;
    }

    return {
      novelId,
      importedCount,
    };
  }
}
