export interface ParsedChapterItem {
  id: string;
  orderIndex: number;
  title: string;
  content: string;
  charCount: number;
  previewText: string;
  selected: boolean;
}

export type SplitMode = 'AUTO' | 'CUSTOM_REGEX' | 'SINGLE_CHAPTER';

export type ImportDestination = 
  | 'NEW_NOVEL' 
  | 'APPEND_EXISTING_NOVEL' 
  | 'CURRENT_CHAPTER_OVERWRITE' 
  | 'CURRENT_CHAPTER_APPEND';

export interface DocxParseResult {
  fileName: string;
  fileSizeBytes: number;
  totalWordCount: number;
  totalParagraphs: number;
  rawText: string;
  rawHtml: string;
  chapters: ParsedChapterItem[];
  detectedPatterns: string[];
}

export interface ImportOptions {
  destination: ImportDestination;
  novelTitle?: string;
  genreProfile?: string;
  targetNovelId?: string;
  targetChapterId?: string;
}
