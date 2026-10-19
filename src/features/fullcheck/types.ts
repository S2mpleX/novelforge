export type CheckDimension =
  | 'CHARACTER_LIFE'      // 角色生命体征与出场因果冲突（死人诈尸/伤病闭关冲突/核心角色掉线）
  | 'FORESHADOW_ORPHAN'   // 伏笔悬念孤儿（已埋设但未回收/预期章节已过）
  | 'CANON_CONFLICT'      // 世界观公理与战力一致性（与权威法则冲突）
  | 'LENGTH_PACE'         // 篇幅与节奏失调（过短/过长/骤增骤降）
  | 'CENSOR_RISK';        // 平台发布违规合规风险

export type CheckSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface FullCheckIssue {
  id: string;
  dimension: CheckDimension;
  severity: CheckSeverity;
  title: string;
  description: string;
  chapterId?: string;
  chapterTitle?: string;
  excerpt?: string;
  suggestion: string;
  targetEntity?: string;
}

export type HealthRating = 'PERFECT' | 'GOOD' | 'NEEDS_ATTENTION' | 'DANGER';

export interface FullCheckReport {
  overallHealthScore: number; // 0 ~ 100
  rating: HealthRating;
  ratingLabel: string;
  scannedChaptersCount: number;
  scannedCharactersCount: number;
  scannedCanonRulesCount: number;
  scannedForeshadowsCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: FullCheckIssue[];
  timestamp: string;
  summary: string;
}
