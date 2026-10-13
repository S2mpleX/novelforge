export type PanelType =
  | 'chapters'             // 1. 小说章节目录
  | 'editor'               // 2. 小说正文编辑器 (支持多实例)
  | 'ai_assistant'         // 3. AI 写作助手
  | 'editor_in_chief'      // 4. AI 主编控制台
  | 'agent_status'         // 5. 多 Agent 状态面板
  | 'character_profiles'   // 6. 角色档案 (支持多实例)
  | 'character_flow'       // 7. 人物关系图 (React Flow)
  | 'world_settings'       // 8. 世界观设定
  | 'plot_outline'         // 9. 剧情大纲
  | 'story_arcs'           // 10. 故事弧管理
  | 'plot_threads'         // 11. 伏笔管理
  | 'timeline'             // 12. 小说时间线
  | 'memory_engine'        // 13. 长期记忆检索
  | 'review_report'        // 14. AI 审稿报告
  | 'version_history'      // 15. 章节版本对比
  | 'model_logs'           // 16. 模型调用日志
  | 'token_usage'          // 17. Token 消耗统计
  | 'serialization_queue'  // 18. 自动连载任务队列
  | 'chapter_goals'        // 19. 章节目标与创作提示
  | 'novel_info';          // 20. 作品信息面板

export interface PanelInstance {
  instanceId: string;
  panelType: PanelType;
  title?: string;
  params?: Record<string, any>;
}

export type SplitOrientation = 'horizontal' | 'vertical';

export interface SplitNode {
  type: 'split';
  id: string;
  orientation: SplitOrientation;
  children: LayoutNode[];
  sizes: number[]; // 百分比数组，和为 100
}

export interface TabGroupNode {
  type: 'tabs';
  id: string;
  panels: PanelInstance[];
  activeInstanceId: string;
}

export type LayoutNode = SplitNode | TabGroupNode;

export interface FloatingPanel {
  id: string;
  panel: PanelInstance;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized?: boolean;
}

export interface WorkspaceLayout {
  version: number;
  root: LayoutNode;
  floatingPanels: FloatingPanel[];
  maximizedInstanceId: string | null;
  activePresetKey: string;
}

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  layout: WorkspaceLayout;
}

export type DropDirection = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'float';

export interface DraggingState {
  panel: PanelInstance;
  sourceTabGroupId?: string;
  sourceFloatingId?: string;
  dragSource: 'tab' | 'header' | 'floating' | 'palette';
  startMousePos: { x: number; y: number };
  currentMousePos: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface DropTargetZone {
  targetTabGroupId: string;
  direction: DropDirection;
  rect: { x: number; y: number; width: number; height: number };
}

export interface PanelMeta {
  type: PanelType;
  title: string;
  iconName: string;
  minWidth: number;
  minHeight: number;
  defaultSize: { width: number; height: number };
  allowMultiple: boolean;
  category: 'core' | 'world' | 'plot' | 'ai' | 'analytics';
  description: string;
}
