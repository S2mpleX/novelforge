import React, { useState } from 'react';
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
} from 'lucide-react';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { SerializationModal } from '@/components/modals/SerializationModal';
import { PublishingModal } from '@/components/modals/PublishingModal';

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
  } = useNovelStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showSerializationModal, setShowSerializationModal] = useState(false);
  const [showPublishingModal, setShowPublishingModal] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

  return (
    <>
      <header className="h-14 border-b border-[#ded5c4] bg-[#efe9dc]/95 backdrop-blur-xl flex items-center justify-between px-4 select-none shrink-0 z-30 shadow-[0_1px_3px_rgba(120,90,50,0.06)]">
        {/* Left: Project Branding & Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition"
            title="折叠/展开左侧栏"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-700 to-orange-700 flex items-center justify-center shadow-md shadow-amber-900/15 border border-amber-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#231f1a] text-sm tracking-wide">NovelForge AI</span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-amber-800/10 text-amber-800 rounded-full border border-amber-800/20">
                  V2.0
                </span>
              </div>
            </div>
          </div>

          {activeNovel && (
            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-[#ded5c4]">
              <span className="text-xs text-[#786f65] font-medium">作品：</span>
              <span className="text-xs font-semibold text-[#2c2825] max-w-[160px] truncate">{activeNovel.title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#e6dece] text-[#6b583f] border border-[#d8cca8] font-medium">
                {activeNovel.genre_profile || '长篇小说'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation Segmented Tabs (Ink Seal Style) */}
        <div className="flex items-center gap-1 bg-[#e4dcce] p-1 rounded-xl border border-[#d5cbb8] shadow-inner">
          <button
            onClick={() => setActiveTab('EDITOR')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              activeTab === 'EDITOR'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            正文创作
          </button>
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              activeTab === 'DASHBOARD'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            概览看板
          </button>
          <button
            onClick={() => setActiveTab('CHARACTERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              activeTab === 'CHARACTERS'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            人物档案
          </button>
          <button
            onClick={() => setActiveTab('WORLD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              activeTab === 'WORLD'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            世界观设定
          </button>
          <button
            onClick={() => setActiveTab('MEMORY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              activeTab === 'MEMORY'
                ? 'bg-[#854d0e] text-white shadow-sm font-semibold'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]/70'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            记忆引擎
          </button>
        </div>

        {/* Right: Word count, Auto-save status, Core Action Buttons & Settings */}
        <div className="flex items-center gap-2.5">
          {/* Serialization Auto-Pilot Trigger */}
          <button
            onClick={() => setShowSerializationModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-md shadow-amber-900/15 border border-amber-600/30 flex items-center gap-1.5 active:scale-95"
            title="打开多 Agent 自动连载控制台"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            自动连载
          </button>

          {/* Publishing & Backup */}
          <button
            onClick={() => setShowPublishingModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-800 transition-all flex items-center gap-1.5 border border-emerald-800/20 shadow-sm"
            title="打开发布交付中心与数据库灾备"
          >
            <Archive className="w-3.5 h-3.5" />
            发布与备份
          </button>

          {/* Word count & Save status */}
          {activeChapter && (
            <div className="flex items-center gap-2.5 px-3 py-1 bg-[#e4dcce] rounded-lg border border-[#d5cbb8] text-xs">
              <span className="text-[#786f65]">
                字数 <strong className="text-[#231f1a] font-mono font-semibold">{characterCount}</strong>
              </span>

              <div className="w-px h-3 bg-[#d5cbb8]" />

              {saveStatus === 'SAVED' && (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  已存
                </span>
              )}
              {saveStatus === 'SAVING' && (
                <span className="flex items-center gap-1 text-amber-700 font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  保存中
                </span>
              )}
              {saveStatus === 'DIRTY' && (
                <span className="flex items-center gap-1 text-[#786f65]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600/60" />
                  待存
                </span>
              )}
              {saveStatus === 'ERROR' && (
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  失败
                </span>
              )}
            </div>
          )}

          {/* Quick Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('txt')}
              className="px-2 py-1 rounded text-[11px] text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition flex items-center gap-1"
              title="快速导出当前章节 TXT"
            >
              <Download className="w-3.5 h-3.5" />
              本章
            </button>
            <button
              onClick={() => handleExportNovel('markdown')}
              className="px-2 py-1 rounded text-[11px] text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition"
              title="快速导出全书 Markdown"
            >
              全本MD
            </button>
          </div>

          <div className="w-px h-4 bg-[#ded5c4]" />

          {/* Model settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] transition"
            title="模型网关与系统设置"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* AI Panel toggle */}
          <button
            onClick={toggleRightPanel}
            className={`p-2 rounded-lg transition ${
              rightPanelOpen
                ? 'text-amber-800 bg-amber-800/10 border border-amber-800/25 shadow-sm'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="折叠/展开 AI 助手面板"
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {exportMessage && (
        <div className="fixed top-16 right-6 bg-emerald-600/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {exportMessage}
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showSerializationModal && (
        <SerializationModal onClose={() => setShowSerializationModal(false)} />
      )}
      {showPublishingModal && (
        <PublishingModal onClose={() => setShowPublishingModal(false)} />
      )}
    </>
  );
};
