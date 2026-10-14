import React from 'react';
import { PanelType, PanelMeta, PanelInstance } from '@/types/docking';
import {
  BookOpen,
  Edit3,
  Sparkles,
  Compass,
  Users,
  GitCommit,
  Layers,
  Bookmark,
  Clock,
  Brain,
  ShieldCheck,
  History,
  Activity,
  Coins,
  FastForward,
  Target,
  Book,
  Feather,
} from 'lucide-react';

// Panel components
import { ChaptersPanel } from './panels/ChaptersPanel';
import { EditorPanel } from './panels/EditorPanel';
import { AiAssistantPanelWrapper } from './panels/AiAssistantPanelWrapper';
import { EditorInChiefPanel } from './panels/EditorInChiefPanel';
import { AgentStatusPanel } from './panels/AgentStatusPanel';
import { CharacterProfilesPanel } from './panels/CharacterProfilesPanel';
import { CharacterFlowPanel } from './panels/CharacterFlowPanel';
import { WorldSettingsPanel } from './panels/WorldSettingsPanel';
import { PlotOutlinePanel } from './panels/PlotOutlinePanel';
import { StoryArcsPanel } from './panels/StoryArcsPanel';
import { PlotThreadsPanel } from './panels/PlotThreadsPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { MemoryEnginePanel } from './panels/MemoryEnginePanel';
import { ReviewReportPanel } from './panels/ReviewReportPanel';
import { VersionHistoryPanel } from './panels/VersionHistoryPanel';
import { ModelLogsPanel } from './panels/ModelLogsPanel';
import { TokenUsagePanel } from './panels/TokenUsagePanel';
import { SerializationQueuePanel } from './panels/SerializationQueuePanel';
import { ChapterGoalsPanel } from './panels/ChapterGoalsPanel';
import { NovelInfoPanel } from './panels/NovelInfoPanel';
import { ToolboxPanel } from './panels/ToolboxPanel';
import { WorkflowPanel } from './panels/WorkflowPanel';
import { VoiceProfilePanel } from './panels/VoiceProfilePanel';

export const PANEL_METADATA_MAP: Record<PanelType, PanelMeta> = {
  chapters: {
    type: 'chapters',
    title: '小说章节目录',
    iconName: 'Book',
    minWidth: 200,
    minHeight: 250,
    defaultSize: { width: 280, height: 600 },
    allowMultiple: false,
    category: 'core',
    description: '展示小说分卷结构、章节列表、字数汇总与快速搜索',
  },
  editor: {
    type: 'editor',
    title: '小说正文编辑器',
    iconName: 'Edit3',
    minWidth: 320,
    minHeight: 300,
    defaultSize: { width: 700, height: 600 },
    allowMultiple: true,
    category: 'core',
    description: '温润物理纸张质感、Tiptap 富文本、防抖自动保存与排版工作室',
  },
  ai_assistant: {
    type: 'ai_assistant',
    title: 'AI 写作助手',
    iconName: 'Sparkles',
    minWidth: 260,
    minHeight: 300,
    defaultSize: { width: 340, height: 600 },
    allowMultiple: false,
    category: 'ai',
    description: '人类打字动力学流式写作、8 大高频剧情快捷动作与草稿暂存箱',
  },
  editor_in_chief: {
    type: 'editor_in_chief',
    title: 'AI 主编控制台',
    iconName: 'Compass',
    minWidth: 280,
    minHeight: 260,
    defaultSize: { width: 400, height: 500 },
    allowMultiple: false,
    category: 'ai',
    description: '全书宏观把控、多 Agent 编排调度流水线与策略指导',
  },
  agent_status: {
    type: 'agent_status',
    title: '多 Agent 状态面板',
    iconName: 'Users',
    minWidth: 280,
    minHeight: 250,
    defaultSize: { width: 450, height: 450 },
    allowMultiple: false,
    category: 'ai',
    description: '监控编剧、作家、审稿、润色、记忆各角色就绪状态与提示词注册',
  },
  character_profiles: {
    type: 'character_profiles',
    title: '角色档案',
    iconName: 'Users',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: true,
    category: 'world',
    description: '角色静态属性、化名、性格特征、核心欲望与生平背景',
  },
  character_flow: {
    type: 'character_flow',
    title: '人物关系图谱',
    iconName: 'GitCommit',
    minWidth: 320,
    minHeight: 300,
    defaultSize: { width: 600, height: 500 },
    allowMultiple: false,
    category: 'world',
    description: '基于 React Flow 的动态关系拓扑网络，自由连线与持久化',
  },
  world_settings: {
    type: 'world_settings',
    title: '世界观设定',
    iconName: 'Compass',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: false,
    category: 'world',
    description: '战力体系、地理法则、Canon 权威三级公理库',
  },
  plot_outline: {
    type: 'plot_outline',
    title: '剧情大纲',
    iconName: 'Layers',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: false,
    category: 'plot',
    description: '宏观分卷规划与大纲起承转合阶段演进',
  },
  story_arcs: {
    type: 'story_arcs',
    title: '故事弧管理',
    iconName: 'Layers',
    minWidth: 300,
    minHeight: 280,
    defaultSize: { width: 450, height: 500 },
    allowMultiple: false,
    category: 'plot',
    description: '核心主线、支线、角色成长弧与世界观揭秘弧状态机',
  },
  plot_threads: {
    type: 'plot_threads',
    title: '伏笔管理',
    iconName: 'Bookmark',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: false,
    category: 'plot',
    description: '伏笔悬念追踪，埋设节点、发酵进度与预期回收闭合',
  },
  timeline: {
    type: 'timeline',
    title: '小说时间线',
    iconName: 'Clock',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: false,
    category: 'plot',
    description: '纪元大事件谱、因果时序与章节关联链条',
  },
  memory_engine: {
    type: 'memory_engine',
    title: '长期记忆检索',
    iconName: 'Brain',
    minWidth: 320,
    minHeight: 300,
    defaultSize: { width: 600, height: 500 },
    allowMultiple: false,
    category: 'ai',
    description: 'L0~L4 五层记忆控制台、FTS5 全文搜索与章节事实沉淀',
  },
  review_report: {
    type: 'review_report',
    title: 'AI 审稿报告',
    iconName: 'ShieldCheck',
    minWidth: 280,
    minHeight: 250,
    defaultSize: { width: 400, height: 500 },
    allowMultiple: false,
    category: 'ai',
    description: '逻辑一致性质检得分、严重矛盾项引用与修改建议',
  },
  version_history: {
    type: 'version_history',
    title: '章节版本对比',
    iconName: 'History',
    minWidth: 280,
    minHeight: 250,
    defaultSize: { width: 480, height: 500 },
    allowMultiple: false,
    category: 'core',
    description: '历史版本不可逆快照浏览、正文对比与一键安全回退',
  },
  model_logs: {
    type: 'model_logs',
    title: '模型调用日志',
    iconName: 'Activity',
    minWidth: 280,
    minHeight: 200,
    defaultSize: { width: 450, height: 400 },
    allowMultiple: false,
    category: 'analytics',
    description: '记录每次 AI 请求延迟、耗时、模型名称与执行状态',
  },
  token_usage: {
    type: 'token_usage',
    title: 'Token 消耗统计',
    iconName: 'Coins',
    minWidth: 240,
    minHeight: 200,
    defaultSize: { width: 380, height: 400 },
    allowMultiple: false,
    category: 'analytics',
    description: '全书累计消耗 Token、各 Agent 占比与模型成本估算',
  },
  serialization_queue: {
    type: 'serialization_queue',
    title: '自动连载任务队列',
    iconName: 'FastForward',
    minWidth: 280,
    minHeight: 250,
    defaultSize: { width: 420, height: 500 },
    allowMultiple: false,
    category: 'ai',
    description: '多 Agent 自动连载状态机、进度条监控与安全防覆盖单步推进',
  },
  chapter_goals: {
    type: 'chapter_goals',
    title: '章节目标与创作提示',
    iconName: 'Target',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 500 },
    allowMultiple: false,
    category: 'plot',
    description: '设定当前章节核心冲突、戏剧目标与分幕场景节拍',
  },
  novel_info: {
    type: 'novel_info',
    title: '作品信息面板',
    iconName: 'BookOpen',
    minWidth: 260,
    minHeight: 250,
    defaultSize: { width: 380, height: 450 },
    allowMultiple: false,
    category: 'core',
    description: '书名简介、全书字数看板、HTML5 电子书导出与灾备热备份',
  },
  novelist_toolbox: {
    type: 'novelist_toolbox',
    title: '小说专项工具箱',
    iconName: 'Wand2',
    minWidth: 280,
    minHeight: 300,
    defaultSize: { width: 400, height: 600 },
    allowMultiple: false,
    category: 'ai',
    description: '8大网文创作专项、设定集深度上下文关联与一键直连模型推演',
  },
  workflow_engine: {
    type: 'workflow_engine',
    title: '剧情工作流引擎',
    iconName: 'GitCommit',
    minWidth: 300,
    minHeight: 300,
    defaultSize: { width: 420, height: 600 },
    allowMultiple: false,
    category: 'ai',
    description: '结构化推演流水线、上游输出下游自动消费与卡片原地打磨',
  },
  voice_profiles: {
    type: 'voice_profiles',
    title: '作者文风档案工作室',
    iconName: 'Feather',
    minWidth: 320,
    minHeight: 300,
    defaultSize: { width: 520, height: 600 },
    allowMultiple: false,
    category: 'ai',
    description: '作者文风档案建模、节奏语调参数调控、一键试读与全局/单书隔离激活',
  },
};

export function getPanelIcon(panelType: PanelType) {
  switch (panelType) {
    case 'chapters':
      return Book;
    case 'editor':
      return Edit3;
    case 'ai_assistant':
      return Sparkles;
    case 'editor_in_chief':
      return Compass;
    case 'agent_status':
      return Users;
    case 'character_profiles':
      return Users;
    case 'character_flow':
      return GitCommit;
    case 'world_settings':
      return Compass;
    case 'plot_outline':
      return Layers;
    case 'story_arcs':
      return Layers;
    case 'plot_threads':
      return Bookmark;
    case 'timeline':
      return Clock;
    case 'memory_engine':
      return Brain;
    case 'review_report':
      return ShieldCheck;
    case 'version_history':
      return History;
    case 'model_logs':
      return Activity;
    case 'token_usage':
      return Coins;
    case 'serialization_queue':
      return FastForward;
    case 'chapter_goals':
      return Target;
    case 'novel_info':
      return BookOpen;
    case 'novelist_toolbox':
      return Sparkles;
    case 'workflow_engine':
      return GitCommit;
    case 'voice_profiles':
      return Feather;
    default:
      return BookOpen;
  }
}

export function renderPanelComponent(panel: PanelInstance): React.ReactNode {
  switch (panel.panelType) {
    case 'chapters':
      return <ChaptersPanel />;
    case 'editor':
      return <EditorPanel instanceId={panel.instanceId} params={panel.params} />;
    case 'ai_assistant':
      return <AiAssistantPanelWrapper />;
    case 'editor_in_chief':
      return <EditorInChiefPanel />;
    case 'agent_status':
      return <AgentStatusPanel />;
    case 'character_profiles':
      return <CharacterProfilesPanel params={panel.params} />;
    case 'character_flow':
      return <CharacterFlowPanel />;
    case 'world_settings':
      return <WorldSettingsPanel />;
    case 'plot_outline':
      return <PlotOutlinePanel />;
    case 'story_arcs':
      return <StoryArcsPanel />;
    case 'plot_threads':
      return <PlotThreadsPanel />;
    case 'timeline':
      return <TimelinePanel />;
    case 'memory_engine':
      return <MemoryEnginePanel />;
    case 'review_report':
      return <ReviewReportPanel />;
    case 'version_history':
      return <VersionHistoryPanel />;
    case 'model_logs':
      return <ModelLogsPanel />;
    case 'token_usage':
      return <TokenUsagePanel />;
    case 'serialization_queue':
      return <SerializationQueuePanel />;
    case 'chapter_goals':
      return <ChapterGoalsPanel />;
    case 'novel_info':
      return <NovelInfoPanel />;
    case 'novelist_toolbox':
      return <ToolboxPanel />;
    case 'workflow_engine':
      return <WorkflowPanel />;
    case 'voice_profiles':
      return <VoiceProfilePanel />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-xs text-[#786f65]">
          未知模块: {panel.panelType}
        </div>
      );
  }
}
