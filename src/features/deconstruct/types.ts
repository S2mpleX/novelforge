export type DeconstructDimensionKey =
  | 'structure'  // 结构与卷章布局
  | 'golden'     // 黄金三章与开篇钩子
  | 'pacing'     // 节奏爽点与断章悬念
  | 'character'  // 人物设计与反派动机
  | 'reusable';   // 可复用实操套路

export interface DeconstructDimension {
  key: DeconstructDimensionKey;
  label: string;
  description: string;
}

export type DeconstructScale = 'detailed' | 'pacing_block' | 'macro';

export interface DeconstructRequest {
  title: string;
  sourceText: string;
  dimensions: DeconstructDimensionKey[];
  scale: DeconstructScale;
  extraFocus?: string;
}

export interface ReusableSkillItem {
  name: string;
  scene: string;
  steps: string[];
  checklist: string[];
}

export interface ExtractedPlotBeatItem {
  title: string;
  beatType: 'ACTION' | 'REVELATION' | 'DECISION' | 'CRISIS' | 'CLIMAX';
  summary: string;
  emotionalPacing?: string;
}

export interface DeconstructReport {
  id: string;
  title: string;
  sourceLength: number;
  markdownContent: string;
  reusableSkills: ReusableSkillItem[];
  extractedPlotBeats: ExtractedPlotBeatItem[];
  createdAt: number;
}
