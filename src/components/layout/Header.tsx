import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
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
} from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { SerializationModal } from '@/components/modals/SerializationModal';
import { PublishingModal } from '@/components/modals/PublishingModal';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';

import { useUpdateStore } from '@/features/updater/stores/useUpdateStore';
import { WindowControls } from './WindowControls';
import { isTauri } from '@/utils/tauriBridge';

export const Header: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    saveStatus,
    activeTab,
    setActiveTab,
    toggleSidebar,
    toggleRightPanel,
    rightPanelOpen,
    activeProvider,
    zenMode,
    toggleZenMode,
    themeMode,
    toggleThemeMode,
    uiScale,
    setUiScale,
    increaseUiScale,
    decreaseUiScale,
  } = useNovelStore();

  const { status } = useUpdateStore();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'MODEL' | 'UPDATER'>('MODEL');
  const [showSerializationModal, setShowSerializationModal] = useState(false);
  const [showPublishingModal, setShowPublishingModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const scaleMenuRef = useRef<HTMLDivElement | null>(null);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      // Esc: Exit Zen mode if active
      if (e.key === 'Escape' && zenMode) {
        toggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, toggleZenMode]);

  // Accurate word count: characters excluding whitespace
  const characterCount = editorContent.replace(/\s+/g, '').length;

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
      alert(`导出失败: ${e}`);
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
      alert(`导出失败: ${e}`);
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

  return (
    <>
      <header
        data-tauri-drag-region
        onDoubleClick={handleHeaderDoubleClick}
        className="h-14 border-b border-[#ded5c4] bg-[#efe9dc]/95 backdrop-blur-xl flex items-center justify-between px-3 md:px-4 select-none shrink-0 z-30 shadow-[0_1px_3px_rgba(120,90,50,0.06)] min-w-0 w-full overflow-hidden"
      >
        {/* Left: Project Branding & Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition shrink-0 cursor-pointer"
            title="折叠/展开左侧栏"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-700 to-orange-700 flex items-center justify-center shadow-md shadow-amber-900/15 border border-amber-600/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-bold text-[#231f1a] text-sm tracking-wide">NovelForge AI</span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-amber-800/10 text-amber-800 rounded-full border border-amber-800/20">
                  V2.1
                </span>
              </div>
            </div>
          </div>

          {activeNovel && (
            <div className="hidden 3xl:flex items-center gap-2 ml-3 pl-3 border-l border-[#ded5c4] shrink-0">
              <span className="text-xs text-[#786f65] font-medium whitespace-nowrap">作品：</span>
              <span className="text-xs font-semibold text-[#2c2825] max-w-[120px] truncate">{activeNovel.title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#e6dece] text-[#6b583f] border border-[#d8cca8] font-medium whitespace-nowrap">
                {activeNovel.genre_profile || '长篇小说'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation Segmented Tabs (Ink Seal Style) */}
        <div className="flex items-center gap-0.5 lg:gap-1 bg-[#e4dcce] p-1 rounded-xl border border-[#d5cbb8] shadow-inner shrink-0 mx-1 lg:mx-2">
          <button
            onClick={() => setActiveTab('EDITOR')}
            className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'EDITOR'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
            title="正文创作"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">正文创作</span>
          </button>
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
            title="概览看板"
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">概览看板</span>
          </button>
          <button
            onClick={() => setActiveTab('CHARACTERS')}
            className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'CHARACTERS'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
            title="人物档案"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">人物档案</span>
          </button>
          <button
            onClick={() => setActiveTab('WORLD')}
            className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'WORLD'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
            title="世界观设定"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">世界观设定</span>
          </button>
          <button
            onClick={() => setActiveTab('MEMORY')}
            className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'MEMORY'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
            title="记忆引擎"
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">记忆引擎</span>
          </button>
        </div>

        {/* Right - Secondary Toolbar (flex-shrink, wraps/hides gracefully when screen is narrow or scaled up) */}
        <div className="flex items-center gap-1 lg:gap-1.5 min-w-0 overflow-hidden shrink justify-end">
          {/* Quick Command Palette Search Button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#e4dcce] hover:bg-[#dad0c0] text-xs text-[#5e5549] border border-[#d5cbb8] shadow-inner transition shrink-0 whitespace-nowrap cursor-pointer"
            title="呼出全局指令与速查面板 (Ctrl+K / ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#854d0e] shrink-0" />
            <span className="font-medium text-[11px] hidden 3xl:inline whitespace-nowrap">全局指令</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[#fdfbf7] border border-[#d5cbb8] rounded text-[#8e8476] shadow-xs hidden 2xl:inline whitespace-nowrap">
              Ctrl+K
            </kbd>
          </button>

          {/* Current Active Model Badge */}
          <button
            onClick={() => setShowSettings(true)}
            className="hidden 3xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e8e0d1] hover:bg-[#dfd5c4] text-[11px] text-[#6b6255] border border-[#d5cbb8] transition font-medium shrink-0"
            title="点击快速配置或切换当前模型服务商"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="max-w-[100px] truncate text-[#3d362e]">
              {activeProvider ? activeProvider.name : '未配置模型'}
            </span>
          </button>

          {/* Serialization Auto-Pilot Trigger */}
          <button
            onClick={() => setShowSerializationModal(true)}
            className="px-2 lg:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-md shadow-amber-900/15 border border-amber-600/30 flex items-center gap-1.5 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
            title="打开多 Agent 自动连载控制台"
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">自动连载</span>
          </button>

          {/* Publishing & Backup */}
          <button
            onClick={() => setShowPublishingModal(true)}
            className="px-2 lg:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-800 transition-all flex items-center gap-1.5 border border-emerald-800/20 shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
            title="打开发布交付中心与数据库灾备"
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">交付备份</span>
          </button>

          {/* Word count & Save status */}
          {activeChapter && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-[#e4dcce] rounded-lg border border-[#d5cbb8] text-xs shrink-0 whitespace-nowrap">
              <span className="text-[#786f65]">
                <strong className="text-[#231f1a] font-mono font-semibold">{characterCount}</strong> 字
              </span>

              <div className="w-px h-3 bg-[#d5cbb8]" />

              {saveStatus === 'SAVED' && (
                <span className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="hidden 2xl:inline">已存</span>
                </span>
              )}
              {saveStatus === 'SAVING' && (
                <span className="flex items-center gap-1 text-amber-700 font-medium text-[11px] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span className="hidden 2xl:inline">保存中</span>
                </span>
              )}
              {saveStatus === 'DIRTY' && (
                <span className="flex items-center gap-1 text-[#786f65] text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600/60" />
                  <span className="hidden 2xl:inline">待存</span>
                </span>
              )}
              {saveStatus === 'ERROR' && (
                <span className="flex items-center gap-1 text-rose-700 font-medium text-[11px]">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden 2xl:inline">失败</span>
                </span>
              )}
            </div>
          )}

          {/* Quick Export Dropdown */}
          <div className="hidden 3xl:flex items-center gap-0.5 shrink-0 whitespace-nowrap">
            <button
              onClick={() => handleExport('txt')}
              className="px-1.5 py-1 rounded text-[11px] text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
              title="快速导出当前章节 TXT"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>本章</span>
            </button>
            <button
              onClick={() => handleExportNovel('markdown')}
              className="px-1.5 py-1 rounded text-[11px] text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition shrink-0 whitespace-nowrap cursor-pointer"
              title="快速导出全本小说 Markdown"
            >
              全本
            </button>
          </div>
        </div>

        {/* Right - Essential Controls & Window Controls (shrink-0, ml-auto, highest priority, never pushed out) */}
        <div className="flex items-center gap-1 lg:gap-1.5 shrink-0 ml-auto pl-1 z-20">
          <div className="hidden sm:block w-px h-4 bg-[#ded5c4] shrink-0" />

          {/* Global UI Scale Stepper */}
          <div ref={scaleMenuRef} className="relative flex items-center shrink-0">
            <div className="flex items-center gap-0.5 bg-[#e4dcce] p-0.5 rounded-lg border border-[#d5cbb8] shadow-2xs">
              <button
                type="button"
                onClick={decreaseUiScale}
                disabled={uiScale <= 80}
                className="p-1 rounded text-[11px] font-mono font-bold text-[#685f54] hover:text-[#231f1a] hover:bg-[#dad0c0] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                title="缩小全站界面与字体 (每次 5%)"
                aria-label="缩小界面"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowScaleMenu(!showScaleMenu)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-[#854d0e] hover:bg-[#dad0c0] transition cursor-pointer shrink-0"
                title="点击选择界面缩放预设或重置"
              >
                {uiScale}%
              </button>

              <button
                type="button"
                onClick={increaseUiScale}
                disabled={uiScale >= 140}
                className="p-1 rounded text-[11px] font-mono font-bold text-[#685f54] hover:text-[#231f1a] hover:bg-[#dad0c0] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                title="放大全站界面与字体 (每次 5%)"
                aria-label="放大界面"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scale Presets Popover */}
            {showScaleMenu && (
              <div className="absolute top-full right-0 mt-1.5 w-44 bg-[#fdfbf7] border border-[#ded5c4] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-serif font-bold text-[#854d0e] px-1.5 py-1 mb-1 border-b border-[#eee6d8] flex items-center justify-between">
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
                          : 'text-[#3d362e] hover:bg-[#f2ece0]'
                      }`}
                    >
                      <span>{scale === 100 ? '默认尺寸 (100%)' : scale < 100 ? '紧凑精致' : scale === 110 ? '适度放大' : scale === 120 ? '清晰大字' : '巨幅易读'}</span>
                      <span className="font-mono text-[11px] opacity-80">{scale}%</span>
                    </button>
                  ))}
                </div>
                {uiScale !== 100 && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#eee6d8]">
                    <button
                      type="button"
                      onClick={() => {
                        setUiScale(100);
                        setShowScaleMenu(false);
                      }}
                      className="w-full py-1 rounded text-[11px] font-serif text-[#854d0e] hover:bg-[#f2ece0] transition text-center cursor-pointer font-medium"
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
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
              themeMode === 'dark'
                ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title={themeMode === 'dark' ? '切换至温润白天模式 (宣纸素笺)' : '切换至水墨黑夜模式 (深宵冷砚)'}
            aria-label="切换白天与黑夜模式"
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          </button>

          <div className="w-px h-4 bg-[#ded5c4] shrink-0" />

          {/* Zen Mode Toggle */}
          <button
            onClick={toggleZenMode}
            className={`p-2 rounded-lg transition shrink-0 cursor-pointer ${
              zenMode
                ? 'text-[#854d0e] bg-[#854d0e]/15 font-bold border border-[#854d0e]/30'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title={zenMode ? '退出沉浸专注模式 (Esc)' : '进入沉浸专注写作模式 (免打扰)'}
          >
            {zenMode ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
          </button>

          {/* Model settings button */}
          <button
            onClick={() => {
              setSettingsInitialTab('MODEL');
              setShowSettings(true);
            }}
            className="p-2 rounded-lg text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition relative cursor-pointer shrink-0"
            title="模型网关与系统设置"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {status === 'UPDATE_AVAILABLE' && (
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping absolute top-1.5 right-1.5" />
            )}
            {status === 'UPDATE_AVAILABLE' && (
              <span className="w-2 h-2 rounded-full bg-rose-600 absolute top-1.5 right-1.5" />
            )}
          </button>

          {/* AI Panel toggle */}
          <button
            onClick={toggleRightPanel}
            className={`p-2 rounded-lg transition shrink-0 cursor-pointer ${
              rightPanelOpen
                ? 'text-amber-800 bg-amber-800/10 border border-amber-800/25 shadow-sm'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="折叠/展开 AI 助手面板"
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4 shrink-0" /> : <PanelRightOpen className="w-4 h-4 shrink-0" />}
          </button>

          {/* Frameless Desktop Window Controls (Min, Max/Restore, Close - Permanently Anchored) */}
          <WindowControls />
        </div>
      </header>

      {exportMessage && (
        <div className="fixed top-16 right-6 bg-emerald-600/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {exportMessage}
        </div>
      )}

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
        onOpenSerialization={() => setShowSerializationModal(true)}
        onOpenPublishing={() => setShowPublishingModal(true)}
        onOpenCreateChapter={() => setShowCreateChapter(true)}
      />
    </>
  );
};
