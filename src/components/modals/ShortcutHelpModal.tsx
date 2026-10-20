import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  X,
  Search,
  PenTool,
  Compass,
  Sparkles,
  Sliders,
  Layers,
} from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  action: string;
  description: string;
  category: 'editing' | 'immersion' | 'navigation' | 'system';
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  // 写作与排版
  {
    keys: ['Ctrl', 'S'],
    action: '保存快照',
    description: '安全将当前正文写入本地 SQLite 数据库并保留不可逆版本',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'F'],
    action: '章内查找',
    description: '在当前章节中高亮检索关键词，支持大小写与全词精确匹配',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'H'],
    action: '查找与替换',
    description: '展开替换控制栏，支持单处逐项替换或全章一键批量替换',
    category: 'editing',
  },
  {
    keys: ['Alt', 'Shift', 'F'],
    action: '一键文学排版',
    description: '自动清理多余空行、规范全角标点、统一段落排版格式',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'Z'],
    action: '撤销',
    description: '撤回上一步正文编辑或替换操作',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'Y'],
    action: '重做',
    description: '恢复被撤销的正文编辑操作',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'B'],
    action: '加粗',
    description: '对选中的文字切换加粗样式',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'I'],
    action: '斜体',
    description: '对选中的文字切换斜体样式',
    category: 'editing',
  },

  // 沉浸与心流
  {
    keys: ['Alt', '['],
    action: '前翻上一章',
    description: '无缝翻到上一章，自动同步存盘当前正在撰写的正文',
    category: 'immersion',
  },
  {
    keys: ['Alt', ']'],
    action: '后翻下一章',
    description: '无缝翻到下一章，最后一章可直接一键续写新篇',
    category: 'immersion',
  },
  {
    keys: ['Ctrl', 'Alt', 'F'],
    action: '段落聚焦模式',
    description: '淡化非焦点段落，仅高亮光标所在段落，专注单段心流',
    category: 'immersion',
  },
  {
    keys: ['Ctrl', 'Alt', 'T'],
    action: '打字机居中滚动',
    description: '光标始终保持在屏幕垂直黄金线，避免颈椎低头疲劳',
    category: 'immersion',
  },
  {
    keys: ['F11', '/', 'Ctrl+Alt+Z'],
    action: '沉浸写作 (Zen) / 专业工坊切换',
    description: '一键在零打扰独占写作与全功能多窗格工坊之间平滑穿梭',
    category: 'immersion',
  },
  {
    keys: ['Esc'],
    action: '退出沉浸写作 / 关闭浮层',
    description: '从沉浸写作快速返回专业工坊模式，或关闭当前弹窗与目录抽屉',
    category: 'immersion',
  },

  // 创作阶段导航 (六步法)
  {
    keys: ['Ctrl', '1'],
    action: '创作成长仪表盘',
    description: '查看小说总字数、章节目标进度、每日码字热力与状态',
    category: 'navigation',
  },
  {
    keys: ['Ctrl', '2'],
    action: '世界观权威设定 (Canon)',
    description: '管理力量体系、地理秘境、宗门宗派与核心世界法则',
    category: 'navigation',
  },
  {
    keys: ['Ctrl', '3'],
    action: '人物档案工坊',
    description: '管理角色设定、外貌特征、性格底色、阵营与关系图谱',
    category: 'navigation',
  },
  {
    keys: ['Ctrl', '4'],
    action: '剧情伏笔矩阵',
    description: '统筹多线叙事、情节支线、伏笔埋设与回收闭环',
    category: 'navigation',
  },
  {
    keys: ['Ctrl', '5'],
    action: '小说正文工作台',
    description: '返回核心正文编辑器与多 Agent 协同创作工作台',
    category: 'navigation',
  },
  {
    keys: ['Ctrl', '6'],
    action: '五层长期记忆与连载 (L0~L4)',
    description: '查阅工作记忆、事实知识图谱、因果质检与多 Agent 自动连载',
    category: 'navigation',
  },

  // 界面与辅助
  {
    keys: ['F1'],
    action: '快捷键中心',
    description: '随时呼出本快捷键速查面板',
    category: 'system',
  },
  {
    keys: ['Ctrl', 'B'],
    action: '切换导航侧栏',
    description: '展开或折叠左侧导航栏，扩大正文写作视野（非正文选区时）',
    category: 'system',
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: '全部按键', icon: Keyboard },
  { id: 'editing', label: '写作与排版', icon: PenTool },
  { id: 'immersion', label: '沉浸与视野', icon: Sparkles },
  { id: 'navigation', label: '阶段导航', icon: Compass },
  { id: 'system', label: '界面与系统', icon: Sliders },
] as const;

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_DATA.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38322a] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-line dark:border-[#2e2a27] bg-surface-2/70 dark:bg-[#201c18]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-800/10 dark:bg-amber-500/10 flex items-center justify-center text-primary dark:text-amber-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-ink dark:text-[#ede4d4]">
                NovelForge AI 快捷键与高效手势指南
              </h3>
              <p className="text-xs text-ink-2 dark:text-[#a89f91] mt-0.5">
                掌握全链路快捷指令，双手不离键盘，保持专注灵感心流
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink dark:hover:text-[#ede4d4] hover:bg-[#ded5c4]/40 dark:hover:bg-white/10 transition cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-line/60 dark:border-[#2e2a27]/60 flex flex-col gap-2.5 bg-[#f9f5ec]/50 dark:bg-[#1c1815]/50">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索按键或功能，例如：查找、全屏、保存、Ctrl..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-serif bg-white dark:bg-[#141210] border border-line dark:border-[#38322a] rounded-xl text-ink dark:text-[#ede4d4] placeholder-[#8c8273] focus:outline-hidden focus:border-[#854d0e] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-2 hover:text-ink"
              >
                清空
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-serif flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-[#854d0e] text-white font-bold shadow-xs'
                      : 'text-ink-2 dark:text-[#a89f91] hover:bg-surface-2 dark:hover:bg-[#282420]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-2 dark:text-[#a89f91]">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              未找到与「{searchQuery}」相匹配的快捷键
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-line/60 dark:border-[#2e2a27] bg-surface/60 dark:bg-[#1e1b17]/60 hover:border-[#854d0e]/40 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-serif font-bold text-ink dark:text-[#ede4d4] group-hover:text-primary dark:group-hover:text-[#d97706] transition">
                      {item.action}
                    </h5>
                    <p className="text-[11px] text-ink-2 dark:text-[#a89f91] mt-0.5 leading-relaxed font-sans line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Kbd Keys Pill */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-[10px] text-ink-2 font-mono">+</span>}
                        <kbd className="px-2 py-0.5 rounded-md bg-surface-2 dark:bg-[#282420] border border-line dark:border-[#38322a] text-[11px] font-mono font-semibold text-ink dark:text-[#ede4d4] shadow-2xs">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-line dark:border-[#2e2a27] bg-surface-2/50 dark:bg-[#1c1815]/50 flex items-center justify-between text-[11px] font-serif text-ink-2 dark:text-[#a89f91]">
          <span>按 <kbd className="font-mono bg-white/60 dark:bg-white/10 px-1 py-0.5 rounded border border-line dark:border-[#38322a]">Esc</kbd> 或点击外部任意处退出</span>
          <span className="text-primary dark:text-amber-400 font-semibold">NovelForge AI · 极速创作流</span>
        </div>
      </div>
    </div>
  );
};
