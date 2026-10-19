export type CreatorPurityLevel = 'PURIST' | 'BALANCED_COPILOT' | 'AI_HEAVY';

export interface ChapterStatsRecord {
  chapterId: string;
  chapterTitle: string;
  totalWords: number;
  manualWords: number;
  aiWords: number;
  manualRatio: number;
}

export interface DualWordStats {
  novelId: string;
  totalWordCount: number;
  manualWordCount: number;
  aiWordCount: number;
  manualRatio: number; // 0 ~ 100 percentage
  aiRatio: number; // 0 ~ 100 percentage
  creatorPurityLevel: CreatorPurityLevel;
  purityLabel: string;
  purityDescription: string;
  chapterRecords: ChapterStatsRecord[];
  lastUpdated: number;
}
