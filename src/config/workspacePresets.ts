import { WorkspaceLayout, WorkspacePreset } from '@/types/docking';

export const FOCUS_WRITING_LAYOUT: WorkspaceLayout = {
  version: 1,
  activePresetKey: 'focus_writing',
  maximizedInstanceId: null,
  floatingPanels: [],
  root: {
    type: 'split',
    id: 'split_focus_root',
    orientation: 'horizontal',
    sizes: [22, 56, 22],
    children: [
      {
        type: 'tabs',
        id: 'tab_focus_left',
        panels: [{ instanceId: 'chapters_main', panelType: 'chapters', title: '章节目录' }],
        activeInstanceId: 'chapters_main',
      },
      {
        type: 'tabs',
        id: 'tab_focus_center',
        panels: [{ instanceId: 'editor_main', panelType: 'editor', title: '正文编辑器' }],
        activeInstanceId: 'editor_main',
      },
      {
        type: 'tabs',
        id: 'tab_focus_right',
        panels: [{ instanceId: 'ai_assistant_main', panelType: 'ai_assistant', title: 'AI 写作助手' }],
        activeInstanceId: 'ai_assistant_main',
      },
    ],
  },
};

export const AGENT_COLLABORATION_LAYOUT: WorkspaceLayout = {
  version: 1,
  activePresetKey: 'agent_collaboration',
  maximizedInstanceId: null,
  floatingPanels: [],
  root: {
    type: 'split',
    id: 'split_agent_root',
    orientation: 'horizontal',
    sizes: [18, 44, 38],
    children: [
      {
        type: 'tabs',
        id: 'tab_agent_left',
        panels: [{ instanceId: 'chapters_main', panelType: 'chapters', title: '章节目录' }],
        activeInstanceId: 'chapters_main',
      },
      {
        type: 'tabs',
        id: 'tab_agent_center',
        panels: [{ instanceId: 'editor_main', panelType: 'editor', title: '正文编辑器' }],
        activeInstanceId: 'editor_main',
      },
      {
        type: 'split',
        id: 'split_agent_right',
        orientation: 'vertical',
        sizes: [50, 50],
        children: [
          {
            type: 'tabs',
            id: 'tab_agent_top_right',
            panels: [
              { instanceId: 'editor_in_chief_main', panelType: 'editor_in_chief', title: 'AI 主编控制台' },
              { instanceId: 'ai_assistant_main', panelType: 'ai_assistant', title: 'AI 写作助手' },
              { instanceId: 'agent_status_main', panelType: 'agent_status', title: '多 Agent 状态' },
            ],
            activeInstanceId: 'editor_in_chief_main',
          },
          {
            type: 'tabs',
            id: 'tab_agent_bottom_right',
            panels: [
              { instanceId: 'serialization_queue_main', panelType: 'serialization_queue', title: '自动连载任务' },
              { instanceId: 'review_report_main', panelType: 'review_report', title: 'AI 审稿报告' },
              { instanceId: 'model_logs_main', panelType: 'model_logs', title: '模型调用日志' },
            ],
            activeInstanceId: 'serialization_queue_main',
          },
        ],
      },
    ],
  },
};

export const WORLD_BUILDING_LAYOUT: WorkspaceLayout = {
  version: 1,
  activePresetKey: 'world_building',
  maximizedInstanceId: null,
  floatingPanels: [],
  root: {
    type: 'split',
    id: 'split_world_root',
    orientation: 'horizontal',
    sizes: [28, 44, 28],
    children: [
      {
        type: 'tabs',
        id: 'tab_world_left',
        panels: [
          { instanceId: 'world_settings_main', panelType: 'world_settings', title: '世界观设定' },
          { instanceId: 'memory_engine_main', panelType: 'memory_engine', title: '长期记忆检索' },
        ],
        activeInstanceId: 'world_settings_main',
      },
      {
        type: 'tabs',
        id: 'tab_world_center',
        panels: [{ instanceId: 'character_flow_main', panelType: 'character_flow', title: '人物关系图谱' }],
        activeInstanceId: 'character_flow_main',
      },
      {
        type: 'tabs',
        id: 'tab_world_right',
        panels: [
          { instanceId: 'character_profiles_main', panelType: 'character_profiles', title: '角色档案' },
          { instanceId: 'timeline_main', panelType: 'timeline', title: '小说时间线' },
        ],
        activeInstanceId: 'character_profiles_main',
      },
    ],
  },
};

export const PLOT_PLANNING_LAYOUT: WorkspaceLayout = {
  version: 1,
  activePresetKey: 'plot_planning',
  maximizedInstanceId: null,
  floatingPanels: [],
  root: {
    type: 'split',
    id: 'split_plot_root',
    orientation: 'horizontal',
    sizes: [30, 42, 28],
    children: [
      {
        type: 'tabs',
        id: 'tab_plot_left',
        panels: [
          { instanceId: 'plot_outline_main', panelType: 'plot_outline', title: '剧情大纲' },
          { instanceId: 'story_arcs_main', panelType: 'story_arcs', title: '故事弧管理' },
        ],
        activeInstanceId: 'plot_outline_main',
      },
      {
        type: 'tabs',
        id: 'tab_plot_center',
        panels: [
          { instanceId: 'chapter_goals_main', panelType: 'chapter_goals', title: '章节目标与创作提示' },
          { instanceId: 'plot_threads_main', panelType: 'plot_threads', title: '伏笔管理' },
        ],
        activeInstanceId: 'chapter_goals_main',
      },
      {
        type: 'tabs',
        id: 'tab_plot_right',
        panels: [
          { instanceId: 'editor_in_chief_main', panelType: 'editor_in_chief', title: 'AI 主编建议' },
          { instanceId: 'review_report_main', panelType: 'review_report', title: '审稿建议' },
        ],
        activeInstanceId: 'editor_in_chief_main',
      },
    ],
  },
};

export const FREE_CUSTOM_LAYOUT: WorkspaceLayout = {
  version: 1,
  activePresetKey: 'free_custom',
  maximizedInstanceId: null,
  floatingPanels: [],
  root: {
    type: 'split',
    id: 'split_free_root',
    orientation: 'horizontal',
    sizes: [25, 75],
    children: [
      {
        type: 'tabs',
        id: 'tab_free_left',
        panels: [
          { instanceId: 'chapters_main', panelType: 'chapters', title: '章节目录' },
          { instanceId: 'novel_info_main', panelType: 'novel_info', title: '作品信息' },
        ],
        activeInstanceId: 'chapters_main',
      },
      {
        type: 'split',
        id: 'split_free_right',
        orientation: 'vertical',
        sizes: [65, 35],
        children: [
          {
            type: 'tabs',
            id: 'tab_free_editor',
            panels: [
              { instanceId: 'editor_main', panelType: 'editor', title: '正文编辑器' },
              { instanceId: 'character_flow_main', panelType: 'character_flow', title: '人物关系图谱' },
            ],
            activeInstanceId: 'editor_main',
          },
          {
            type: 'tabs',
            id: 'tab_free_tools',
            panels: [
              { instanceId: 'ai_assistant_main', panelType: 'ai_assistant', title: 'AI 写作助手' },
              { instanceId: 'token_usage_main', panelType: 'token_usage', title: 'Token 消耗统计' },
              { instanceId: 'version_history_main', panelType: 'version_history', title: '章节版本对比' },
            ],
            activeInstanceId: 'ai_assistant_main',
          },
        ],
      },
    ],
  },
};

export const BUILTIN_WORKSPACE_PRESETS: Record<string, WorkspacePreset> = {
  focus_writing: {
    id: 'focus_writing',
    name: '专注写作布局',
    description: '正文编辑器占据大部分空间，左侧章节目录，右侧 AI 助手，适合高效码字与心流沉浸。',
    isBuiltIn: true,
    layout: FOCUS_WRITING_LAYOUT,
  },
  agent_collaboration: {
    id: 'agent_collaboration',
    name: '多 Agent 协作布局',
    description: '正文编辑器、主编控制台、自动连载队列、审稿报告协同展示，全面掌控 Agent 流水线。',
    isBuiltIn: true,
    layout: AGENT_COLLABORATION_LAYOUT,
  },
  world_building: {
    id: 'world_building',
    name: '世界观设计布局',
    description: '人物档案、关系拓扑图谱、世界法则、时间线及记忆库联同展示，构筑庞大奇幻宇宙。',
    isBuiltIn: true,
    layout: WORLD_BUILDING_LAYOUT,
  },
  plot_planning: {
    id: 'plot_planning',
    name: '剧情策划布局',
    description: '宏观大纲、故事弧演进、伏笔线索追踪与章节目标规划深度联动，推敲剧情张力。',
    isBuiltIn: true,
    layout: PLOT_PLANNING_LAYOUT,
  },
  free_custom: {
    id: 'free_custom',
    name: '自由布局',
    description: '自由组合所有 20 个工作模块，随意拆分、停靠、合并与悬浮，满足个性化工作流。',
    isBuiltIn: true,
    layout: FREE_CUSTOM_LAYOUT,
  },
};
