export type BatchRevisePresetKey =
  | 'DEAI_POLISH'
  | 'PACE_ACCELERATE'
  | 'HOOK_ENHANCE'
  | 'SENSORY_DETAIL'
  | 'CUSTOM';

export type BatchReviseScopeType = 'ALL' | 'RANGE' | 'SELECTION';

export interface BatchRevisePreset {
  key: BatchRevisePresetKey;
  label: string;
  description: string;
  iconName: string;
  defaultPrompt: string;
}

export interface BatchReviseScope {
  type: BatchReviseScopeType;
  rangeStart?: number; // 1-based chapter order
  rangeEnd?: number;
  selectedChapterIds: string[];
}

export interface BatchReviseProposal {
  id: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  originalContent: string;
  revisedContent: string;
  originalWordCount: number;
  revisedWordCount: number;
  diffSummary: string;
  addedChars: number;
  removedChars: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt?: number;
}

export interface BatchReviseJob {
  id: string;
  novelId: string;
  presetKey: BatchRevisePresetKey;
  customInstruction?: string;
  scope: BatchReviseScope;
  proposals: BatchReviseProposal[];
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  currentIndex: number;
  totalChapters: number;
  createdAt: number;
}
