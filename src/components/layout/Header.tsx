import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/utils/tauriBridge';
import {
  BookOpen,
  CheckCircle2,
  Download,
  AlertCircle,
  Settings,
  Sparkles,
  LayoutDashboard,
  Users,
  Compass,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Brain,
  TrendingUp,
  Archive,
  Search,
  Maximize2,
  Minimize2,
  Cpu,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Wand2,
  GitBranch,
  Feather,
  Swords,
  ChevronDown,
  ChevronRight,
  FileText,
  Sliders,
  FileSearch,
  HeartPulse,
  PackageOpen,
  HelpCircle,
  Plus,
  Layers,
  Keyboard,
  LayoutGrid,
  Globe,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';
import { APP_CURRENT_VERSION } from '@/features/updater/services/UpdateService';

const SettingsModal = React.lazy(() => import('@/components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
const SerializationModal = React.lazy(() => import('@/components/modals/SerializationModal').then(m => ({ default: m.SerializationModal })));
const PublishingModal = React.lazy(() => import('@/components/modals/PublishingModal').then(m => ({ default: m.PublishingModal })));
const CommandPaletteModal = React.lazy(() => import('@/components/modals/CommandPaletteModal').then(m => ({ default: m.CommandPaletteModal })));
const CreateChapterModal = React.lazy(() => import('@/components/modals/CreateChapterModal').then(m => ({ default: m.CreateChapterModal })));
const CreateNovelModal = React.lazy(() => import('@/components/modals/CreateNovelModal').then(m => ({ default: m.CreateNovelModal })));
const NovelistToolboxModal = React.lazy(() => import('@/components/modals/NovelistToolboxModal').then(m => ({ default: m.NovelistToolboxModal })));
const WorkflowRunnerModal = React.lazy(() => import('@/components/modals/WorkflowRunnerModal').then(m => ({ default: m.WorkflowRunnerModal })));
const VoiceProfileModal = React.lazy(() => import('@/components/modals/VoiceProfileModal').then(m => ({ default: m.VoiceProfileModal })));
const ModelArenaModal = React.lazy(() => import('@/components/arena/ModelArenaModal').then(m => ({ default: m.ModelArenaModal })));
const TypesetterCleanerModal = React.lazy(() => import('@/components/modals/TypesetterCleanerModal').then(m => ({ default: m.TypesetterCleanerModal })));
const WordImportModal = React.lazy(() => import('@/components/modals/WordImportModal').then(m => ({ default: m.WordImportModal })));
const DeconstructModal = React.lazy(() => import('@/components/modals/DeconstructModal').then(m => ({ default: m.DeconstructModal })));
const FullCheckModal = React.lazy(() => import('@/components/modals/FullCheckModal').then(m => ({ default: m.FullCheckModal })));
const AssetProposalModal = React.lazy(() => import('@/components/modals/AssetProposalModal').then(m => ({ default: m.AssetProposalModal })));
const CreationWorkflowModal = React.lazy(() => import('@/components/modals/CreationWorkflowModal').then(m => ({ default: m.CreationWorkflowModal })));
const BatchReviseModal = React.lazy(() => import('@/components/modals/BatchReviseModal').then(m => ({ default: m.BatchReviseModal })));
const MapModal = React.lazy(() => import('@/components/modals/MapModal').then(m => ({ default: m.MapModal })));
const CharacterSandboxModal = React.lazy(() => import('@/components/arena/CharacterSandboxModal').then(m => ({ default: m.CharacterSandboxModal })));
const CollaborationModal = React.lazy(() => import('@/components/collaboration/CollaborationModal').then(m => ({ default: m.CollaborationModal })));
import { useCollaborationStore } from '@/stores/useCollaborationStore';

import { DualWordStatsBadge } from '@/components/common/DualWordStatsBadge';
import { useUpdateStore } from '@/features/updater/stores/useUpdateStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { WindowControls } from './WindowControls';
import { isTauri } from '@/utils/tauriBridge';
import type { ActiveTab } from '@/stores/useNovelStore';
import { alertDialog } from '@/utils/dialog';

const HeaderWordCount: React.FC = React.memo(() => {
  const characterCount = useNovelStore((s) => (s.editorContent ? s.editorContent.replace(/\s+/g, '').length : 0));
  return <strong className="text-ink dark:text-[#f3eee7] font-mono font-semibold">{characterCount}</strong>;
});

const HeaderSaveStatusBadge: React.FC = React.memo(() => {
  const saveStatus = useNovelStore((s) => s.saveStatus);
  return (
    <>
      {saveStatus === 'SAVED' && (
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span>已存</span>
        </span>
      )}
      {saveStatus === 'SAVING' && (
        <span className="flex items-center gap-1 text-primary dark:text-amber-400 font-medium text-[11px] animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
          <span>存盘中</span>
        </span>
      )}
      {saveStatus === 'DIRTY' && (
        <span className="flex items-center gap-1 text-ink-2 dark:text-[#9e9486] text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600/60" />
          <span>待存</span>
        </span>
      )}
      {saveStatus === 'ERROR' && (
        <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium text-[11px]">
          <AlertCircle className="w-3 h-3" />
          <span>失败</span>
        </span>
      )}
    </>
  );
});

// 创作流程六大标准阶段定义
interface PipelineStepItem {
  id: ActiveTab;
  stepNum: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  tooltip: string;
}

const CREATION_PIPELINE: PipelineStepItem[] = [
  {
    id: 'DASHBOARD',
    stepNum: 1,
    label: '构思立项',
    shortLabel: '立项',
    icon: LayoutDashboard,
    tooltip: '第一步 · 构思立项：确定题材定位、黄金三章钩子、全书总字数目标与创作看板',
  },
  {
    id: 'WORLD',
    stepNum: 2,
    label: '世界架构',
    shortLabel: '设定',
    icon: Compass,
    tooltip: '第二步 · 世界架构：设定战力阶层、地理版图、门派势力与权威世界规则 (Canon)',
  },
  {
    id: 'CHARACTERS',
    stepNum: 3,
    label: '角色谱系',
    shortLabel: '角色',
    icon: Users,
    tooltip: '第三步 · 角色谱系：构建人设档案、动机秘密、动态状态变迁与人际拓扑图',
  },
  {
    id: 'PLOTS',
    stepNum: 4,
    label: '剧情大纲',
    shortLabel: '大纲',
    icon: GitBranch,
    tooltip: '第四步 · 剧情大纲：规划宏观四阶段、主支线剧情弧 (Arcs) 与伏笔回收追踪',
  },
  {
    id: 'EDITOR',
    stepNum: 5,
    label: '正文执笔',
    shortLabel: '正文',
    icon: BookOpen,
    tooltip: '第五步 · 正文执笔：分卷章节沉浸撰写、场景节拍 (Scene Beats) 与多 Agent 协同',
  },
  {
    id: 'MEMORY',
    stepNum: 6,
    label: '记忆连载',
    shortLabel: '连载',
    icon: Brain,
    tooltip: '第六步 · 记忆连载：L0~L4 五层长期记忆自动沉淀、因果质检与多 Agent 自动连载',
  },
];

export const Header: React.FC = () => {
  const {
    novels,
    activeNovel,
    selectNovel,
    activeChapter,
    activeTab,
    setActiveTab,
    toggleSidebar,
    toggleRightPanel,
    rightPanelOpen,
    activeProvider,
    activeModel,
    zenMode,
    toggleZenMode,
    enterZenMode,
    exitZenMode,
    themeMode,
    toggleThemeMode,
    uiScale,
    setUiScale,
    increaseUiScale,
    decreaseUiScale,
  } = useNovelStore(
    useShallow((s) => ({
      novels: s.novels,
      activeNovel: s.activeNovel,
      selectNovel: s.selectNovel,
      activeChapter: s.activeChapter,
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      toggleSidebar: s.toggleSidebar,
      toggleRightPanel: s.toggleRightPanel,
      rightPanelOpen: s.rightPanelOpen,
      activeProvider: s.activeProvider,
      activeModel: s.activeModel,
      zenMode: s.zenMode,
      toggleZenMode: s.toggleZenMode,
      enterZenMode: s.enterZenMode,
      exitZenMode: s.exitZenMode,
      themeMode: s.themeMode,
      toggleThemeMode: s.toggleThemeMode,
      uiScale: s.uiScale,
      setUiScale: s.setUiScale,
      increaseUiScale: s.increaseUiScale,
      decreaseUiScale: s.decreaseUiScale,
    }))
  );

  const chaptersCount = useNovelStore((s) => s.chapters.length);

  const { status } = useUpdateStore();
  const openPanel = useWorkspaceStore((s) => s.openPanel);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'MODEL' | 'UPDATER' | 'SKILLS'>('MODEL');
  const [showSerializationModal, setShowSerializationModal] = useState(false);
  const [showPublishingModal, setShowPublishingModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showToolboxModal, setShowToolboxModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showVoiceProfileModal, setShowVoiceProfileModal] = useState(false);
  const [showArenaModal, setShowArenaModal] = useState(false);
  const [showTypesetterModal, setShowTypesetterModal] = useState(false);
  const [showWordImportModal, setShowWordImportModal] = useState(false);
  const [showDeconstructModal, setShowDeconstructModal] = useState(false);
  const [showFullCheckModal, setShowFullCheckModal] = useState(false);
  const [showAssetProposalModal, setShowAssetProposalModal] = useState(false);
  const [showWorkflowGuideModal, setShowWorkflowGuideModal] = useState(false);
  const [showBatchReviseModal, setShowBatchReviseModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const { status: collabStatus, roomCode: collabRoomCode } = useCollaborationStore();

  // Popovers state
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const scaleMenuRef = useRef<HTMLDivElement | null>(null);
  const [showWorkshopMenu, setShowWorkshopMenu] = useState(false);
  const workshopMenuRef = useRef<HTMLDivElement | null>(null);
  const [showNovelMenu, setShowNovelMenu] = useState(false);
  const novelMenuRef = useRef<HTMLDivElement | null>(null);
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const pipelineMenuRef = useRef<HTMLDivElement | null>(null);

  // Close pipeline menu when clicking outside
  useEffect(() => {
    if (!showPipelineMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pipelineMenuRef.current && !pipelineMenuRef.current.contains(e.target as Node)) {
        setShowPipelineMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPipelineMenu]);

  // Close scale menu when clicking outside
  useEffect(() => {
    if (!showScaleMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (scaleMenuRef.current && !scaleMenuRef.current.contains(e.target as Node)) {
        setShowScaleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showScaleMenu]);

  // Close workshop menu when clicking outside
  useEffect(() => {
    if (!showWorkshopMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (workshopMenuRef.current && !workshopMenuRef.current.contains(e.target as Node)) {
        setShowWorkshopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWorkshopMenu]);

  // Close novel menu when clicking outside
  useEffect(() => {
    if (!showNovelMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (novelMenuRef.current && !novelMenuRef.current.contains(e.target as Node)) {
        setShowNovelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNovelMenu]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape' && zenMode) {
        toggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, toggleZenMode]);

  // Global open settings event listener
  useEffect(() => {
    const handleOpenSettings = (e: any) => {
      if (e?.detail?.tab) {
        setSettingsInitialTab(e.detail.tab);
      } else {
        setSettingsInitialTab('MODEL');
      }
      setShowSettings(true);
    };
    window.addEventListener('novelforge:open-settings', handleOpenSettings);
    return () => window.removeEventListener('novelforge:open-settings', handleOpenSettings);
  }, []);

  const handleExport = async (format: 'txt' | 'markdown') => {
    if (!activeChapter) return;
    try {
      const text = await api.exportChapterText(activeChapter.id, format);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `第${activeChapter.chapter_number}章_${activeChapter.title}.${format === 'markdown' ? 'md' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage(`已成功导出第 ${activeChapter.chapter_number} 章！`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (e) {
      await alertDialog(`导出失败: ${e}`);
    }
  };

  const handleExportNovel = async (format: 'txt' | 'markdown') => {
    if (!activeNovel) return;
    try {
      const text = await api.exportNovelText(activeNovel.id, format);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `《${activeNovel.title}》全本.${format === 'markdown' ? 'md' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMessage(`已成功导出全本小说！`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (e) {
      await alertDialog(`导出失败: ${e}`);
    }
  };

  const handleHeaderDoubleClick = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, [data-tauri-drag-region="false"]')) {
      return;
    }
    if (isTauri()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.warn('Failed to toggle maximize on double click:', err);
      }
    }
  };

  const currentPipelineStep = CREATION_PIPELINE.find((p) => p.id === activeTab) || CREATION_PIPELINE[4];
  const CurrentPipelineIcon = currentPipelineStep.icon;

  return (
    <>
      <header
        data-tauri-drag-region
        onDoubleClick={handleHeaderDoubleClick}
        className="h-14 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#1a1714] flex items-center justify-between pl-2.5 md:pl-3.5 pr-0 select-none shrink-0 z-30 shadow-[0_1px_3px_rgba(120,90,50,0.06)] min-w-0 w-full relative"
      >
        {/* ============================================================ */}
        {/* APP CONTENT REGION: Zone 1, Zone 2, Zone 3 Actions           */}
        {/* Strictly flex-1 min-w-0: Cannot push the window controls     */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between flex-1 min-w-0 h-full mr-1">
          {/* ============================================================ */}
          {/* ZONE 1 (LEFT): Brand & Active Project Selector              */}
          {/* ============================================================ */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mr-1 sm:mr-2">
          {/* Toggle Chapters Sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#f3eee7] hover:bg-surface-3-hover dark:hover:bg-[#282421] transition shrink-0 cursor-pointer"
            title="折叠/展开章节目录侧边栏"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* App Branding */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-700 to-orange-700 flex items-center justify-center shadow-xs border border-amber-600/30 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden lg:flex items-center gap-1 whitespace-nowrap">
              <span className="font-bold text-ink dark:text-[#f3eee7] text-xs lg:text-sm tracking-wide font-serif">
                NovelForge
              </span>
              <span className="hidden 2xl:inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 rounded-full border border-amber-800/20">
                v{APP_CURRENT_VERSION}
              </span>
            </div>
          </div>

          {/* Active Novel Badge & Quick Shelf Switcher */}
          {activeNovel ? (
            <div ref={novelMenuRef} className="relative flex items-center ml-0.5 sm:ml-1 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowNovelMenu(!showNovelMenu)}
                className={`group flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl border transition-all cursor-pointer max-w-[130px] sm:max-w-[170px] xl:max-w-[210px] 2xl:max-w-[260px] ${
                  showNovelMenu
                    ? 'bg-surface dark:bg-[#26221f] border-amber-800/50 dark:border-amber-600/50 shadow-xs'
                    : 'bg-[#e5dcce] dark:bg-[#23201d] hover:bg-surface-3-hover dark:hover:bg-[#2a2622] border-line dark:border-[#38332d]'
                }`}
                title={`当前创作工程：《${activeNovel.title}》\n点击快速切换小说或新建作品`}
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-3 h-3" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold font-serif text-ink dark:text-[#ede6dc] truncate leading-tight">
                    《{activeNovel.title}》
                  </div>
                  <div className="text-[10px] text-ink-2 dark:text-[#9e9486] flex items-center gap-1 leading-none mt-0.5">
                    <span className="truncate max-w-[50px] sm:max-w-[70px]">{activeNovel.genre_profile || '长篇通俗'}</span>
                    <span>·</span>
                    <span className="font-mono">{chaptersCount}章</span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-ink-2 dark:text-[#9e9486] group-hover:text-primary dark:group-hover:text-amber-400 shrink-0 transition-transform ${
                    showNovelMenu ? 'rotate-180 text-primary dark:text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Open Writer's Desk Button */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('novelforge:open-desk'))}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-amber-800/10 hover:bg-amber-800/15 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 text-primary dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/30 text-xs font-semibold font-serif transition cursor-pointer shadow-2xs hover:scale-105 shrink-0"
                title="打开文人案头速览与新书启程中心 (快捷键: F2 或 Ctrl+D)"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                <span className="hidden md:inline">案头</span>
              </button>

              {/* Shelf Quick Switcher Dropdown */}
              {showNovelMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-primary dark:text-amber-400 border-b border-line dark:border-[#322d28] mb-1.5">
                    <span>我的书架 ({novels.length} 部)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('novelforge:open-desk'));
                          setShowNovelMenu(false);
                        }}
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
                        title="打开文人案头速览 (F2)"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>案头</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateNovel(true);
                          setShowNovelMenu(false);
                        }}
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>新建</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {novels.map((n) => {
                      const isActive = n.id === activeNovel.id;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            selectNovel(n);
                            setShowNovelMenu(false);
                          }}
                          className={`w-full p-2 rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                            isActive
                              ? 'bg-amber-800/10 dark:bg-amber-400/10 border border-amber-800/25 dark:border-amber-400/25'
                              : 'hover:bg-surface-3 dark:hover:bg-[#282421]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-serif font-bold text-ink dark:text-[#ede6dc] truncate">
                              《{n.title}》
                            </div>
                            <div className="text-[10px] text-ink-2 dark:text-[#9e9486] flex items-center gap-1.5 mt-0.5">
                              <span className="px-1 py-0.2 rounded bg-surface-3 dark:bg-[#322d28] text-ink-2 dark:text-[#c4b59d]">
                                {n.genre_profile || '长篇小说'}
                              </span>
                              <span className="truncate">{n.writing_style}</span>
                            </div>
                          </div>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 ml-2" title="当前激活" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-line dark:border-[#322d28] flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWordImportModal(true);
                        setShowNovelMenu(false);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-center font-medium transition cursor-pointer border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>导入 Word (.docx)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('novelforge:open-desk'))}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white text-xs font-bold font-serif shadow-sm animate-pulse cursor-pointer hover:from-amber-600 hover:to-amber-700 shrink-0"
              title="案头尚无小说，点击开启新书 3 步向导"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>开启新长篇 (3步向导)</span>
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* ZONE 2 (CENTER): Mode Switcher Capsule & Creation Pipeline   */}
        {/* ============================================================ */}
        <div className="flex items-center justify-center mx-auto min-w-0 shrink-0 gap-1.5 sm:gap-2">
          {/* Dual Mode Switcher Capsule (方案 2: 纯粹写作 Zen 模式 vs 专业工坊 Studio 模式一键切换) */}
          <div className="flex items-center bg-surface-3 dark:bg-[#201d1a] p-0.5 rounded-xl border border-line dark:border-[#352f2a] shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!zenMode) {
                  enterZenMode();
                  toast.info('沉浸写作模式已开启', '已收拢所有多余窗格，专心执笔正文 (按 Esc 随时切回工坊)');
                }
              }}
              className={`px-2 lg:px-2.5 py-1 rounded-lg text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                zenMode
                  ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 shadow-sm border border-amber-950/30'
                  : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#f3eee7] hover:bg-surface-3-hover/70'
              }`}
              title="切换至沉浸写作模式 (Zen)：零干扰、无杂念，主正文居中独占，专为快速码字打磨打造 (快捷键: F11 / Ctrl+Alt+Z)"
            >
              <Feather className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">沉浸写作</span>
              {zenMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse hidden sm:inline-block" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (zenMode) {
                  exitZenMode();
                  toast.info('专业工坊模式已激活', '已恢复完整 Docking 多窗格排布、权威大纲与多 Agent 控制台');
                }
              }}
              className={`px-2 lg:px-2.5 py-1 rounded-lg text-xs font-serif font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                !zenMode
                  ? 'bg-gradient-to-r from-[#5c4033] to-[#422e24] dark:from-[#2e2620] dark:to-[#383028] text-amber-100 shadow-sm border border-amber-900/30'
                  : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#f3eee7] hover:bg-surface-3-hover/70'
              }`}
              title="切换至专业工坊模式 (Studio)：全功能工作台、多窗格 Docking、权威世界观、多 Agent 主编、因果巡检与思维沙盘"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-200/80 shrink-0" />
              <span className="whitespace-nowrap">专业工坊</span>
            </button>
          </div>

          {/* Creation Pipeline Stepper: 窄屏/常规屏 (< xl) 折叠为紧凑阶段胶囊，防顶栏拥挤重叠 */}
          <div ref={pipelineMenuRef} className="relative xl:hidden flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowPipelineMenu(!showPipelineMenu)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-surface-3 dark:bg-[#201d1a] hover:bg-surface-3-hover dark:hover:bg-[#282421] text-xs font-serif font-bold text-ink dark:text-[#ede6dc] border border-line dark:border-[#352f2a] shadow-inner transition cursor-pointer shrink-0"
              title="当前创作阶段，点击展开完整六步工作流"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                {currentPipelineStep.stepNum}
              </span>
              <CurrentPipelineIcon className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">{currentPipelineStep.label}</span>
              <ChevronDown className={`w-3 h-3 text-ink-2 dark:text-[#9e9486] transition-transform ${showPipelineMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPipelineMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-serif font-bold text-primary dark:text-amber-400 px-2 py-1 border-b border-line dark:border-[#322d28] mb-1.5 flex items-center justify-between">
                  <span>六步创作工作流</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkflowGuideModal(true);
                      setShowPipelineMenu(false);
                    }}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>向导指南</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {CREATION_PIPELINE.map((item) => {
                    const StepIcon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowPipelineMenu(false);
                        }}
                        className={`w-full p-1.5 rounded-lg text-left flex items-center justify-between text-xs transition cursor-pointer ${
                          isItemActive
                            ? 'bg-amber-800/15 dark:bg-amber-400/15 text-primary dark:text-amber-300 font-bold border border-amber-800/30'
                            : 'text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            isItemActive ? 'bg-amber-800 text-amber-100' : 'bg-surface-3 dark:bg-[#342e29] text-ink-2'
                          }`}>
                            {item.stepNum}
                          </span>
                          <StepIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-ink-2 opacity-60">Ctrl+{item.stepNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Creation Pipeline Stepper: 超宽屏 (>= xl) 展开完整横向步进器 */}
          <div className="hidden xl:flex items-center bg-surface-3 dark:bg-[#201d1a] p-0.5 lg:p-1 rounded-xl border border-line dark:border-[#352f2a] shadow-inner shrink-0">
            {CREATION_PIPELINE.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLast = idx === CREATION_PIPELINE.length - 1;

              return (
                <React.Fragment key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative px-1.5 3xl:px-2.5 py-1 rounded-lg text-xs transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 shadow-sm font-bold border border-amber-950/20'
                        : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#f3eee7] hover:bg-surface-3-hover/70 dark:hover:bg-[#2b2724]'
                    }`}
                    title={item.tooltip}
                  >
                    {/* Step Number Badge */}
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-[#d6cbba] dark:bg-[#342e29] text-[#6b5f52] dark:text-[#a5998a]'
                      }`}
                    >
                      {item.stepNum}
                    </span>

                    {/* Step Icon */}
                    <Icon className="w-3.5 h-3.5 shrink-0" />

                    {/* Label: 
                        - 激活项：始终展示完整 label 明确当前位置
                        - 非激活项：仅展示图标与序号数字微标，悬停有完备提示词，节约 180px+ 宽度彻底杜绝拥挤
                    */}
                    {isActive && (
                      <span className="whitespace-nowrap font-bold text-xs inline">
                        {item.label}
                      </span>
                    )}

                    {/* Subtle pulse dot on active */}
                    {isActive && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse ml-0.5" />
                    )}
                  </button>

                  {/* Flow Arrow Connector: 仅在 3xl 超宽屏显示 */}
                  {!isLast && (
                    <ChevronRight className="w-3 h-3 text-[#b5a794] dark:text-[#4a423a] shrink-0 mx-[-1px] hidden 3xl:inline-block opacity-70" />
                  )}
                </React.Fragment>
              );
            })}

            {/* Creation Flow Guide Button (向导提示入口) */}
            <div className="ml-1 pl-1 border-l border-line dark:border-[#352f2a] flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowWorkflowGuideModal(true)}
                className="p-1 3xl:px-1.5 3xl:py-1 rounded-md text-[11px] text-primary dark:text-amber-400 hover:bg-surface-3-hover dark:hover:bg-[#2b2724] font-medium flex items-center gap-1 transition cursor-pointer"
                title="打开长篇小说六步法协同创作向导与交付清单"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 3xl:inline whitespace-nowrap">流程向导</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ZONE 3 (RIGHT): Grouped Action Suite & Permanent Controls    */}
        {/* ============================================================ */}
        <div className="flex items-center ml-auto h-full shrink-0 min-w-0">
          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0 justify-end mx-1">
            {/* Context Status: Current Chapter Word Count & Save Status */}
            {activeChapter && (
              <div className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 bg-surface-3 dark:bg-[#23201d] rounded-lg border border-line dark:border-[#38332d] text-xs shrink-0 whitespace-nowrap">
                <span className="text-ink-2 dark:text-[#9e9486]">
                  <HeaderWordCount /> 字
                </span>

                <div className="w-px h-3 bg-[#d5cbb8] dark:bg-[#38332d]" />

                <HeaderSaveStatusBadge />
              </div>
            )}

            {/* Dual Word Count Origin Badge */}
            {activeNovel && (
              <div className="hidden 3xl:flex items-center shrink-0">
                <DualWordStatsBadge />
              </div>
            )}

            {/* P2P 联机状态常驻小胶囊 */}
            {collabStatus === 'CONNECTED' && (
              <button
                type="button"
                onClick={() => setShowCollaborationModal(true)}
                className="h-7 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors shrink-0"
                title="P2P 联机创作进行中，点击打开协作面板"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>P2P: {collabRoomCode}</span>
              </button>
            )}

            {/* Quick Command Palette Search Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-3-hover dark:bg-[#23201d] dark:hover:bg-[#2c2824] text-xs text-ink-2 dark:text-[#a09485] border border-line dark:border-[#38332d] shadow-inner transition shrink-0 whitespace-nowrap cursor-pointer"
              title="呼出全局指令与速查面板 (Ctrl+K / ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
              <span className="font-medium text-[11px] hidden 3xl:inline whitespace-nowrap">指令</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38332d] rounded text-ink-2 shadow-xs hidden 3xl:inline whitespace-nowrap">
                Ctrl+K
              </kbd>
            </button>

            {/* Active Model Badge (紧凑图标适配各分辨率，超宽屏展开模型全称) */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-2 3xl:px-2.5 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-3-hover dark:bg-[#25211e] dark:hover:bg-[#2d2925] text-[11px] text-ink-2 dark:text-[#a5998a] border border-line dark:border-[#38332d] transition font-medium shrink-0 cursor-pointer"
              title={`当前活跃模型：${activeProvider?.name || '未配置'}${activeModel ? ` (${activeModel.model_name})` : ''}\n点击快速配置或切换网关`}
            >
              <Cpu className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
              <span className="hidden 3xl:inline max-w-[140px] truncate text-ink dark:text-[#ede6dc]">
                {activeProvider
                  ? `${activeProvider.name}${activeModel ? ` · ${activeModel.model_name}` : ''}`
                  : '未配置模型'}
              </span>
            </button>

            {/* Serialization Auto-Pilot Trigger (核心功能常驻) */}
            <button
              onClick={() => setShowSerializationModal(true)}
              className="px-2 lg:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-md shadow-amber-900/15 border border-amber-600/30 flex items-center gap-1.5 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
              title="打开多 Agent 自动连载控制台"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">自动连载</span>
            </button>

            {/* 【创作工坊】聚合分类抽屉 (存稿排版 / AI协同 / 审校质检 / 交付备份) */}
            <div ref={workshopMenuRef} className="relative flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowWorkshopMenu(!showWorkshopMenu)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition cursor-pointer shrink-0 ${
                  showWorkshopMenu
                    ? 'bg-amber-800/20 text-primary dark:text-amber-200 border-amber-800/40 shadow-xs'
                    : 'bg-amber-800/10 hover:bg-amber-800/15 text-primary dark:text-amber-300 border-amber-800/20 dark:border-amber-400/20'
                }`}
                title="打开创作工坊：涵盖排版、拆解、百宝箱、竞技场、工作流与交付备份"
              >
                <Wand2 className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium hidden sm:inline">工坊</span>
                <ChevronDown className={`w-3 h-3 text-primary dark:text-amber-400 transition-transform ${showWorkshopMenu ? 'rotate-180' : ''}`} />
              </button>

              {showWorkshopMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-surface dark:bg-[#1f1c19] border border-line dark:border-[#38332e] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* Category 1: Input & Typesetting */}
                  <div>
                    <div className="text-[10px] font-serif font-bold text-primary dark:text-amber-400 px-2 py-0.5 border-b border-line dark:border-[#322d28] mb-1 flex items-center justify-between">
                      <span>稿件输入与排版</span>
                      <span className="text-[9px] font-sans font-normal opacity-70">格式与分章</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowWordImportModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-blue-900 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-left cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="flex-1 truncate">
                        <span className="font-bold">Word (.docx) 导入分章</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowTypesetterModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">网文排版清洗机</span>
                    </button>
                    <div className="grid grid-cols-2 gap-1 mt-1 px-1">
                      <button
                        type="button"
                        onClick={() => { handleExport('txt'); setShowWorkshopMenu(false); }}
                        className="py-1 px-1.5 rounded text-[11px] text-ink-2 dark:text-[#a09485] hover:bg-[#eee5d5] dark:hover:bg-[#2b2724] border border-line dark:border-[#38332d] flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>导出本章TXT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleExportNovel('markdown'); setShowWorkshopMenu(false); }}
                        className="py-1 px-1.5 rounded text-[11px] text-ink-2 dark:text-[#a09485] hover:bg-[#eee5d5] dark:hover:bg-[#2b2724] border border-line dark:border-[#38332d] flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>导出全本MD</span>
                      </button>
                    </div>
                  </div>

                  {/* Category 2: AI Assistance & Deconstruction */}
                  <div>
                    <div className="text-[10px] font-serif font-bold text-primary dark:text-amber-400 px-2 py-0.5 border-b border-line dark:border-[#322d28] mb-1 flex items-center justify-between">
                      <span>AI 创作与拆解</span>
                      <span className="text-[9px] font-sans font-normal opacity-70">协同工坊</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowDeconstructModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                      <span className="flex-1 truncate">爆款范文拆解器</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowToolboxModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">小说专项百宝箱</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowWorkflowModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400 shrink-0" />
                      <span className="flex-1 truncate">剧情工作流引擎</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowVoiceProfileModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Feather className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">作者文风档案工作室</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowArenaModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">双模型比稿竞技场</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBatchReviseModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">跨章节批量重塑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowMapModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span className="flex-1 truncate">世界地理与势力沙盘</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSandboxModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">角色对戏演武场</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 font-mono">NEW</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCollaborationModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="flex-1 truncate">互联网 P2P 联机创作</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 font-mono">P2P</span>
                    </button>
                  </div>

                  {/* Category 3: Audit, Proposals & Publishing */}
                  <div>
                    <div className="text-[10px] font-serif font-bold text-primary dark:text-amber-400 px-2 py-0.5 border-b border-line dark:border-[#322d28] mb-1 flex items-center justify-between">
                      <span>质检、沉淀与交付</span>
                      <span className="text-[9px] font-sans font-normal opacity-70">全书闭环</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowFullCheckModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" />
                      <span className="flex-1 truncate">全书贯通因果体检</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAssetProposalModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <PackageOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="flex-1 truncate">正文资产沉淀提案</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsInitialTab('SKILLS');
                        setShowSettings(true);
                        setShowWorkshopMenu(false);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                      <span className="flex-1 truncate">Agent Skills 技能中心</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPublishingModal(true); setShowWorkshopMenu(false); }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center gap-2 text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421] transition text-left cursor-pointer font-bold text-emerald-800 dark:text-emerald-400 mt-1"
                    >
                      <Archive className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="flex-1 truncate">发布交付与数据备份</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Far-Right: System, UI Zoom, Theme & Frameless Window Controls */}
          <div className="flex items-center shrink-0 ml-auto h-full bg-surface-2 dark:bg-[#1a1714] pl-1 select-none z-40">
            {/* Global UI Scale Stepper */}
            <div ref={scaleMenuRef} className="relative flex items-center shrink-0">
              <div className="flex items-center gap-0.5 bg-surface-3 dark:bg-[#25201c] p-0.5 rounded-lg border border-line dark:border-stone-700/60 shadow-2xs">
                <button
                  type="button"
                  onClick={decreaseUiScale}
                  disabled={uiScale <= 80}
                  className="p-1 rounded text-[11px] font-mono font-bold text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:text-[#9e9486] dark:hover:text-[#ede6dc] dark:hover:bg-[#342e29] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                  title="缩小全站界面与字体 (每次 5%)"
                  aria-label="缩小界面"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowScaleMenu(!showScaleMenu)}
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-primary dark:text-amber-400 hover:bg-surface-3-hover dark:hover:bg-[#342e29] transition cursor-pointer shrink-0"
                  title="点击选择界面缩放预设或重置"
                >
                  {uiScale}%
                </button>

                <button
                  type="button"
                  onClick={increaseUiScale}
                  disabled={uiScale >= 140}
                  className="p-1 rounded text-[11px] font-mono font-bold text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:text-[#9e9486] dark:hover:text-[#ede6dc] dark:hover:bg-[#342e29] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                  title="放大全站界面与字体 (每次 5%)"
                  aria-label="放大界面"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scale Presets Popover */}
              {showScaleMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-44 bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-serif font-bold text-primary dark:text-amber-400 px-1.5 py-1 mb-1 border-b border-line dark:border-[#322d28] flex items-center justify-between">
                    <span>全站界面缩放</span>
                    <span className="font-mono">{uiScale}%</span>
                  </div>
                  <div className="space-y-0.5">
                    {[90, 100, 110, 120, 130].map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => {
                          setUiScale(scale);
                          setShowScaleMenu(false);
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center justify-between transition cursor-pointer ${
                          uiScale === scale
                            ? 'bg-[#854d0e] text-white font-bold shadow-xs'
                            : 'text-ink dark:text-[#ede6dc] hover:bg-surface-3 dark:hover:bg-[#282421]'
                        }`}
                      >
                        <span>{scale === 100 ? '默认尺寸 (100%)' : scale < 100 ? '紧凑精致' : scale === 110 ? '适度放大' : scale === 120 ? '清晰大字' : '巨幅易读'}</span>
                        <span className="font-mono text-[11px] opacity-80">{scale}%</span>
                      </button>
                    ))}
                  </div>
                  {uiScale !== 100 && (
                    <div className="mt-1.5 pt-1.5 border-t border-line dark:border-[#322d28]">
                      <button
                        type="button"
                        onClick={() => {
                          setUiScale(100);
                          setShowScaleMenu(false);
                        }}
                        className="w-full py-1 rounded text-[11px] font-serif text-primary dark:text-amber-400 hover:bg-surface-3 dark:hover:bg-[#282421] transition text-center cursor-pointer font-medium"
                      >
                        恢复默认 (100%)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Mode Toggle (Day / Night) */}
            <button
              type="button"
              onClick={toggleThemeMode}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ml-0.5 ${
                themeMode === 'dark'
                  ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30 shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
              }`}
              title={themeMode === 'dark' ? '切换至温润白天模式 (宣纸素笺)' : '切换至水墨黑夜模式 (深宵冷砚)'}
              aria-label="切换白天与黑夜模式"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            </button>

            {/* Zen Mode Toggle (已在 Zone 2 核心切换胶囊中常驻，桌面端隐藏防重复拥挤，极窄视口备用) */}
            <button
              onClick={toggleZenMode}
              className={`hidden max-sm:flex p-2 rounded-lg transition shrink-0 cursor-pointer ${
                zenMode
                  ? 'text-primary dark:text-amber-400 bg-[#854d0e]/15 font-bold border border-[#854d0e]/30'
                  : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-surface-3-hover dark:hover:bg-[#282421]'
              }`}
              title={zenMode ? '退出沉浸专注模式 (Esc)' : '进入沉浸专注写作模式 (免打扰)'}
            >
              {zenMode ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
            </button>

            {/* Shortcuts Help Center Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('novelforge:open-shortcuts'))}
              className="p-2 rounded-lg text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-surface-3-hover dark:hover:bg-[#282421] transition relative cursor-pointer shrink-0"
              title="快捷键速查指南 (F1 / ?)"
            >
              <Keyboard className="w-4 h-4 shrink-0" />
            </button>

            {/* Model & System Settings Button */}
            <button
              onClick={() => {
                setSettingsInitialTab('MODEL');
                setShowSettings(true);
              }}
              className="p-2 rounded-lg text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-surface-3-hover dark:hover:bg-[#282421] transition relative cursor-pointer shrink-0"
              title="模型网关与系统设置"
            >
              <Settings className="w-4 h-4 shrink-0" />
              {status === 'UPDATE_AVAILABLE' && (
                <span className="w-2 h-2 rounded-full bg-rose-600 ring-2 ring-surface dark:ring-[#282421] shadow-xs absolute top-1.5 right-1.5" />
              )}
            </button>

            {/* AI Assistant Right Panel Toggle */}
            <button
              onClick={() => {
                toggleRightPanel();
                openPanel('ai_assistant');
              }}
              className={`p-2 rounded-lg transition shrink-0 cursor-pointer ${
                rightPanelOpen
                  ? 'text-primary dark:text-amber-300 bg-amber-800/10 dark:bg-amber-400/15 border border-amber-800/25 dark:border-amber-400/30 shadow-sm'
                  : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-surface-3-hover dark:hover:bg-[#282421]'
              }`}
              title="折叠/展开 AI 写作助手面板"
            >
              {rightPanelOpen ? <PanelRightClose className="w-4 h-4 shrink-0" /> : <PanelRightOpen className="w-4 h-4 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PERMANENT WINDOW CONTROLS ANCHOR                             */}
      {/* Strictly isolated direct child of <header>, shrink-0,        */}
      {/* permanently anchored to the top-right viewport corner.       */}
      {/* ============================================================ */}
      <div className="flex items-center shrink-0 h-full bg-surface-2 dark:bg-[#1a1714] z-50 select-none">
        <WindowControls />
      </div>
    </header>

      {/* Floating Export Toast Message */}
      {exportMessage && (
        <div className="fixed top-16 right-6 bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {exportMessage}
        </div>
      )}

      {/* Modals & Drawers */}
      <React.Suspense fallback={null}>
        {showSettings && (
          <SettingsModal
            initialTab={settingsInitialTab}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showSerializationModal && (
          <SerializationModal onClose={() => setShowSerializationModal(false)} />
        )}
        {showPublishingModal && (
          <PublishingModal onClose={() => setShowPublishingModal(false)} />
        )}
        {showCreateChapter && (
          <CreateChapterModal onClose={() => setShowCreateChapter(false)} />
        )}
        {showCreateNovel && (
          <CreateNovelModal onClose={() => setShowCreateNovel(false)} />
        )}
        {showToolboxModal && (
          <NovelistToolboxModal
            isOpen={showToolboxModal}
            onClose={() => setShowToolboxModal(false)}
          />
        )}
        {showWorkflowModal && (
          <WorkflowRunnerModal
            isOpen={showWorkflowModal}
            onClose={() => setShowWorkflowModal(false)}
          />
        )}
        {showVoiceProfileModal && (
          <VoiceProfileModal
            isOpen={showVoiceProfileModal}
            onClose={() => setShowVoiceProfileModal(false)}
          />
        )}
        {showArenaModal && (
          <ModelArenaModal
            isOpen={showArenaModal}
            onClose={() => setShowArenaModal(false)}
          />
        )}
        {showTypesetterModal && (
          <TypesetterCleanerModal
            isOpen={showTypesetterModal}
            onClose={() => setShowTypesetterModal(false)}
          />
        )}
        {showWordImportModal && (
          <WordImportModal
            isOpen={showWordImportModal}
            onClose={() => setShowWordImportModal(false)}
          />
        )}
        {showDeconstructModal && (
          <DeconstructModal
            isOpen={showDeconstructModal}
            onClose={() => setShowDeconstructModal(false)}
          />
        )}
        {showFullCheckModal && (
          <FullCheckModal
            isOpen={showFullCheckModal}
            onClose={() => setShowFullCheckModal(false)}
          />
        )}
        {showAssetProposalModal && (
          <AssetProposalModal
            isOpen={showAssetProposalModal}
            onClose={() => setShowAssetProposalModal(false)}
          />
        )}
        {showWorkflowGuideModal && (
          <CreationWorkflowModal
            isOpen={showWorkflowGuideModal}
            onClose={() => setShowWorkflowGuideModal(false)}
          />
        )}
        {showBatchReviseModal && (
          <BatchReviseModal
            isOpen={showBatchReviseModal}
            onClose={() => setShowBatchReviseModal(false)}
          />
        )}
        {showMapModal && (
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
          />
        )}
        {showSandboxModal && (
          <CharacterSandboxModal
            isOpen={showSandboxModal}
            onClose={() => setShowSandboxModal(false)}
          />
        )}
        {showCollaborationModal && (
          <CollaborationModal
            isOpen={showCollaborationModal}
            onClose={() => setShowCollaborationModal(false)}
            onOpenSandbox={() => setShowSandboxModal(true)}
          />
        )}
        <CommandPaletteModal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onOpenSettings={() => {
            setSettingsInitialTab('MODEL');
            setShowSettings(true);
          }}
          onOpenUpdater={() => {
            setSettingsInitialTab('UPDATER');
            setShowSettings(true);
          }}
          onOpenSkills={() => {
            setSettingsInitialTab('SKILLS');
            setShowSettings(true);
          }}
          onOpenSerialization={() => setShowSerializationModal(true)}
          onOpenPublishing={() => setShowPublishingModal(true)}
          onOpenCreateChapter={() => setShowCreateChapter(true)}
          onOpenToolbox={() => setShowToolboxModal(true)}
          onOpenWorkflow={() => setShowWorkflowModal(true)}
          onOpenVoiceProfile={() => setShowVoiceProfileModal(true)}
          onOpenArena={() => setShowArenaModal(true)}
          onOpenTypesetter={() => setShowTypesetterModal(true)}
          onOpenWordImport={() => setShowWordImportModal(true)}
          onOpenDeconstruct={() => setShowDeconstructModal(true)}
          onOpenFullCheck={() => setShowFullCheckModal(true)}
          onOpenAssetProposal={() => setShowAssetProposalModal(true)}
          onOpenBatchRevise={() => setShowBatchReviseModal(true)}
          onOpenMap={() => setShowMapModal(true)}
          onOpenSandbox={() => setShowSandboxModal(true)}
          onOpenCollaboration={() => setShowCollaborationModal(true)}
        />
      </React.Suspense>
    </>
  );
};
