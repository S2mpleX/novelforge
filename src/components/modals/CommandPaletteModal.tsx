import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  Search,
  BookOpen,
  FilePlus,
  Save,
  TrendingUp,
  Archive,
  Settings,
  LayoutDashboard,
  Users,
  Compass,
  Brain,
  Sparkles,
  AlignLeft,
  X,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Wand2,
  GitCommit,
  Feather,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenUpdater?: () => void;
  onOpenSerialization: () => void;
  onOpenPublishing: () => void;
  onOpenCreateChapter: () => void;
  onFormatText?: () => void;
  onOpenToolbox?: () => void;
  onOpenWorkflow?: () => void;
  onOpenVoiceProfile?: () => void;
}

export const CommandPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenUpdater,
  onOpenSerialization,
  onOpenPublishing,
  onOpenCreateChapter,
  onFormatText,
  onOpenToolbox,
  onOpenWorkflow,
  onOpenVoiceProfile,
}) => {
  const {
    chapters,
    selectChapter,
    setActiveTab,
    saveCurrentChapter,
    themeMode,
    toggleThemeMode,
    uiScale,
    increaseUiScale,
    decreaseUiScale,
    resetUiScale,
  } = useNovelStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build commands list
  const baseCommands = [
    {
      id: 'cmd-create-ch',
      icon: <FilePlus className="w-4 h-4 text-[#854d0e]" />,
      title: '新建下一章节',
      category: '创作操作',
      action: () => {
        onClose();
        onOpenCreateChapter();
      },
    },
    {
      id: 'cmd-save',
      icon: <Save className="w-4 h-4 text-[#854d0e]" />,
      title: '立即保存当前正文快照 (Ctrl+S)',
      category: '创作操作',
      action: () => {
        onClose();
        saveCurrentChapter(true, 'COMMAND_PALETTE_SAVE');
      },
    },
    {
      id: 'cmd-novelist-toolbox',
      icon: <Wand2 className="w-4 h-4 text-amber-600" />,
      title: '打开小说专项工具箱 (8大创作专项/设定关联)',
      category: '智能写作',
      action: () => {
        onClose();
        onOpenToolbox?.();
      },
    },
    {
      id: 'cmd-workflow-engine',
      icon: <GitCommit className="w-4 h-4 text-indigo-600" />,
      title: '打开剧情工作流执行引擎 (黄金三章/爆款单章流水线)',
      category: '智能写作',
      action: () => {
        onClose();
        onOpenWorkflow?.();
      },
    },
    {
      id: 'cmd-voice-profile',
      icon: <Feather className="w-4 h-4 text-amber-800" />,
      title: '打开作者文风档案工作室 (文风建模/节奏语调/现场试读)',
      category: '智能写作',
      action: () => {
        onClose();
        onOpenVoiceProfile?.();
      },
    },
    {
      id: 'cmd-format',
      icon: <AlignLeft className="w-4 h-4 text-[#854d0e]" />,
      title: '一键文学规范排版 (首行双全角缩进、清理空行标点)',
      category: '排版精修',
      action: () => {
        onClose();
        onFormatText?.();
      },
    },
    {
      id: 'cmd-tab-editor',
      icon: <BookOpen className="w-4 h-4 text-[#854d0e]" />,
      title: '切换视图 ➔ 正文沉浸写作',
      category: '视图导航',
      action: () => {
        onClose();
        setActiveTab('EDITOR');
      },
    },
    {
      id: 'cmd-tab-dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-[#854d0e]" />,
      title: '切换视图 ➔ 全景大纲看板',
      category: '视图导航',
      action: () => {
        onClose();
        setActiveTab('DASHBOARD');
      },
    },
    {
      id: 'cmd-tab-characters',
      icon: <Users className="w-4 h-4 text-[#854d0e]" />,
      title: '切换视图 ➔ 人物档案与动态拓扑图',
      category: '视图导航',
      action: () => {
        onClose();
        setActiveTab('CHARACTERS');
      },
    },
    {
      id: 'cmd-tab-world',
      icon: <Compass className="w-4 h-4 text-[#854d0e]" />,
      title: '切换视图 ➔ 世界观法则与设定集',
      category: '视图导航',
      action: () => {
        onClose();
        setActiveTab('WORLD');
      },
    },
    {
      id: 'cmd-tab-memory',
      icon: <Brain className="w-4 h-4 text-[#854d0e]" />,
      title: '切换视图 ➔ L0~L4 因果长期记忆引擎',
      category: '视图导航',
      action: () => {
        onClose();
        setActiveTab('MEMORY');
      },
    },
    {
      id: 'cmd-serialization',
      icon: <TrendingUp className="w-4 h-4 text-[#854d0e]" />,
      title: '打开自动连载流水线控制台',
      category: '系统工具',
      action: () => {
        onClose();
        onOpenSerialization();
      },
    },
    {
      id: 'cmd-publishing',
      icon: <Archive className="w-4 h-4 text-[#854d0e]" />,
      title: '全本交付导出中心 (HTML5/TXT/MD/工程备份)',
      category: '系统工具',
      action: () => {
        onClose();
        onOpenPublishing();
      },
    },
    {
      id: 'cmd-settings',
      icon: <Settings className="w-4 h-4 text-[#854d0e]" />,
      title: '打开模型网关与 API 端点配置',
      category: '系统工具',
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'cmd-updater',
      icon: <Sparkles className="w-4 h-4 text-[#854d0e]" />,
      title: '检查软件更新 · 软件更新中心 (Update Center)',
      category: '系统工具',
      action: () => {
        onClose();
        if (onOpenUpdater) {
          onOpenUpdater();
        } else {
          onOpenSettings();
        }
      },
    },
    {
      id: 'cmd-theme-toggle',
      icon: themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      title: themeMode === 'dark' ? '切换全站外观 ➔ 白天明亮雅致模式 (Light Mode)' : '切换全站外观 ➔ 黑夜水墨护眼模式 (Dark Mode)',
      category: '外观与界面',
      action: () => {
        onClose();
        toggleThemeMode();
      },
    },
    {
      id: 'cmd-zoom-in',
      icon: <ZoomIn className="w-4 h-4 text-[#854d0e]" />,
      title: `放大全局界面与文字尺寸 (+5%，当前 ${uiScale}%)`,
      category: '外观与界面',
      action: () => {
        increaseUiScale();
      },
    },
    {
      id: 'cmd-zoom-out',
      icon: <ZoomOut className="w-4 h-4 text-[#854d0e]" />,
      title: `缩小全局界面与文字尺寸 (-5%，当前 ${uiScale}%)`,
      category: '外观与界面',
      action: () => {
        decreaseUiScale();
      },
    },
    {
      id: 'cmd-zoom-reset',
      icon: <RotateCcw className="w-4 h-4 text-[#854d0e]" />,
      title: '重置全局界面与文字尺寸为 100% 默认大小',
      category: '外观与界面',
      action: () => {
        resetUiScale();
      },
    },
  ];

  // Add chapter jumps
  const chapterCommands = chapters.map((ch) => ({
    id: `cmd-ch-${ch.id}`,
    icon: <Sparkles className="w-4 h-4 text-[#854d0e]" />,
    title: `跳转阅读/编辑：第 ${ch.chapter_number} 章《${ch.title}》(${ch.word_count} 字)`,
    category: '章节直达',
    action: () => {
      onClose();
      selectChapter(ch);
      setActiveTab('EDITOR');
    },
  }));

  const allItems = [...baseCommands, ...chapterCommands];
  const filtered = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-serif">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#ded5c4] flex items-center gap-3 bg-[#efe9dc]">
          <Search className="w-5 h-5 text-[#854d0e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="键入指令、章节名、或视图名称快速直达 (支持 ↑↓ 键移动，Enter 执行)..."
            className="flex-1 bg-transparent border-none text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#f4efe6] border border-[#ded5c4] text-[11px] font-mono text-[#786f65]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#685f54] hover:text-[#2b2621] hover:bg-[#e5ded0] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#ded5c4]/40">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#786f65]">
              未检索到匹配指令。请尝试搜索 “大纲”、“新建”、“排版” 或章节名称。
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-[#efe9dc] text-[#854d0e] shadow-2xs font-semibold'
                      : 'text-[#4a4237] hover:bg-[#f7f2e7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] shadow-2xs">
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4efe6] text-[#786f65] border border-[#ded5c4]">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer tips */}
        <div className="p-2.5 border-t border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between text-[11px] text-[#786f65]">
          <span>提示：任意时刻按下 <kbd className="font-mono bg-[#fdfbf7] px-1 py-0.5 rounded border border-[#ded5c4]">Ctrl+K</kbd> 均可唤出本命令面板</span>
          <span>当前共 {filtered.length} 项指令</span>
        </div>
      </div>
    </div>
  );
};
