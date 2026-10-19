export type ProposalCategory =
  | 'CHARACTER'  // 新角色 / 人物档案
  | 'FACTION'    // 新宗门 / 势力组织
  | 'TECHNIQUE'  // 新功法 / 秘术战技
  | 'ARTIFACT'   // 新灵宝 / 装备法宝
  | 'LOCATION'   // 新地点 / 秘境场景
  | 'CANON_RULE';// 新世界观法则 / 设定

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED';

export interface AssetProposal {
  id: string;
  category: ProposalCategory;
  categoryLabel: string;
  name: string;
  summary: string;
  contextSentence: string;
  sourceChapterId?: string;
  sourceChapterTitle?: string;
  suggestedAttributes: {
    role_type?: string;
    personality?: string;
    power_level?: string;
    authority_level?: 'CANON' | 'EXTENDED';
    background?: string;
    rule_content?: string;
  };
  status: ProposalStatus;
  confidence: number; // 0.0 ~ 1.0
  createdAt: number;
}
