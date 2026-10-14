export type ClicheSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type ClicheCategory =
  | 'MECHANICAL_METAPHOR'   // 廉价机械比喻（如仿佛、宛如）
  | 'FACIAL_TWITCH'         // 脸谱化肌肉抽搐（如嘴角勾起、眼中闪过）
  | 'EXPOSITORY_TRANSITION' // 说明文/议论文过渡腔（如与此同时、不仅如此、总的来说）
  | 'EMPTY_CONCLUSION'      // 空洞总结与上帝视角（如殊不知、命运的齿轮）
  | 'META_LEAK'             // 游戏/策划/系统术语外露（如Flag、机制、结算）
  | 'BREATH_FORMULA';       // 公式化呼吸（如倒吸一口凉气、深吸一口气）

export interface ClicheItem {
  phrase: string;
  category: ClicheCategory;
  severity: ClicheSeverity;
  reason: string;
  suggestion: string;
}

export interface ClicheMatch {
  phrase: string;
  category: ClicheCategory;
  severity: ClicheSeverity;
  startIndex: number;
  endIndex: number;
  reason: string;
  suggestion: string;
}

export interface HumanizerAuditReport {
  score: number; // 0 ~ 100
  rating: 'EXCELLENT' | 'GOOD' | 'NEEDS_POLISH' | 'SEVERE_AI_TONE';
  wordCount: number;
  clicheCount: number;
  matches: ClicheMatch[];
  summary: string;
}
