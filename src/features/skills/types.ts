export type SkillCategory = 'polishing' | 'linguistics' | 'architecture' | 'dramaturgy' | 'audit' | 'workflow' | 'custom';

export type RuleSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SkillRule {
  id: string;
  name: string;
  trigger: string;
  severity: RuleSeverity;
  description: string;
  badExample: string;
  goodExample: string;
  explanation?: string;
  frequencyStat?: string;
}

export interface NegativeRule {
  id: string;
  name: string;
  reason: string;
  forbiddenAction: string;
  empiricalFact: string;
}

export interface CorpusStats {
  words: string;
  articleCount: string;
  modelCount: string;
  comparisonBasis: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  category: SkillCategory;
  description: string;
  tags: string[];
  corpusStats?: CorpusStats;
  rules: SkillRule[];
  negativeRules?: NegativeRule[];
  systemPromptFragment: string;
  executionChainHint?: string;
  enabled: boolean;
}

export interface SkillAuditIssue {
  ruleId: string;
  skillId: string;
  skillName: string;
  ruleName: string;
  excerpt: string;
  startIndex: number;
  endIndex: number;
  suggestion: string;
  severity: RuleSeverity;
  badExample?: string;
  goodExample?: string;
}

export type SkillAuditRating = 'EXCELLENT' | 'GOOD' | 'NEEDS_POLISH' | 'SEVERE_AI_TONE';

export interface SkillAuditReport {
  score: number;
  rating: SkillAuditRating;
  wordCount: number;
  issueCount: number;
  issues: SkillAuditIssue[];
  summary: string;
  activeSkillNames: string[];
}
