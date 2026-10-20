import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { Chapter } from '@/types';
import {
  Feather,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Disc,
  Sun,
  Moon,
  LayoutGrid,
  Check,
  AlertCircle,
  Clock,
  Minimize2,
  ChevronUp,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

interface Props {
  onOpenChapterDrawer?: () => void;
}

export const ZenFloatingIsland: React.FC<Props> = ({ onOpenChapterDrawer }) => {
  const {
    chapters,
    activeChapter,
    selectChapter,
    saveStatus,
    exitZenMode,
    themeMode,
    toggleThemeMode,
    editorContent,
  } = useNovelStore();

  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('novelforge_focus_mode') === 'true';
  });

  const [isTypewriterMode, setIsTypewriterMode] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('novelforge_typewriter_mode') === 'true';
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  // 章节前后顺序计算
  const sortedChapters = useMemo(() => {
    return [...chapters].sort(
      (a, b) => (a.chapter_number ?? a.sequence ?? 0) - (b.chapter_number ?? b.sequence ?? 0)
    );
  }, [chapters]);

  const currentIndex = sortedChapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // 实时字数与阅读时长预估
  const wordCount = useMemo(() => {
    const raw = editorContent || activeChapter?.content || '';
    return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  }, [editorContent, activeChapter?.content]);

  const readMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 400));
  }, [wordCount]);

  const handleSwitchChapter = async (target: Chapter) => {
    if (!target || target.id === activeChapter?.id) return;
    try {
      await selectChapter(target);
      toast.info(`已翻至第 ${target.chapter_number} 章`, `《${target.title}》`);
    } catch (e) {
      console.error('切换章节失败:', e);
    }
  };

  const handleToggleFocus = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      localStorage.setItem('novelforge_focus_mode', String(next));
      window.dispatchEvent(new CustomEvent('novelforge:toggle-focus'));
      if (next) {
        toast.info('段落聚焦已开启', '仅高亮光标段落，淡化其余文本 (Ctrl+Alt+F)');
      } else {
        toast.info('段落聚焦已关闭', '恢复全文常规浏览');
      }
      return next;
    });
  }, []);

  const handleToggleTypewriter = useCallback(() => {
    setIsTypewriterMode((prev) => {
      const next = !prev;
      localStorage.setItem('novelforge_typewriter_mode', String(next));
      window.dispatchEvent(new CustomEvent('novelforge:toggle-typewriter'));
      if (next) {
        toast.info('打字机滚动已开启', '光标保持垂直居中视口黄金线 (Ctrl+Alt+T)');
      } else {
        toast.info('打字机滚动已关闭', '恢复标准视口滚动');
      }
      return next;
    });
  }, []);

  // 监听外部键盘快捷键同步本地状态
  useEffect(() => {
    const syncState = () => {
      setIsFocusMode(localStorage.getItem('novelforge_focus_mode') === 'true');
      setIsTypewriterMode(localStorage.getItem('novelforge_typewriter_mode') === 'true');
    };
    window.addEventListener('storage', syncState);
    return () => window.removeEventListener('storage', syncState);
  }, []);

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-surface-2/90 dark:bg-[#1f1c19]/90 backdrop-blur-md border border-line dark:border-[#3d362e] shadow-lg text-[11px] text-ink-2 hover:text-primary dark:hover:text-amber-300 font-serif flex items-center gap-1.5 transition-all cursor-pointer opacity-70 hover:opacity-100 hover:scale-105"
        title="展开案头浮岛"
      >
        <ChevronUp className="w-3.5 h-3.5" />
        <span>案头浮岛 ({wordCount}字)</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] transition-all duration-200">
      <div className="bg-surface/90 dark:bg-[#1a1714]/90 backdrop-blur-md border border-line dark:border-[#38332d] shadow-2xl rounded-full px-3.5 py-1.5 flex items-center gap-2 sm:gap-3 text-xs text-ink font-sans">
        {/* 1. 章节快速穿梭器 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!prevChapter}
            onClick={() => prevChapter && handleSwitchChapter(prevChapter)}
            className="p-1 rounded-full hover:bg-surface-3-hover dark:hover:bg-[#282420] text-ink-2 hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
            title={prevChapter ? `上一章：《${prevChapter.title}》 (Alt+[)` : '已是第一章'}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenChapterDrawer}
            className="px-2 py-0.5 rounded-md hover:bg-surface-3-hover dark:hover:bg-[#282420] text-primary dark:text-amber-300 font-serif font-bold flex items-center gap-1.5 transition cursor-pointer max-w-[150px] sm:max-w-[200px]"
            title="点击展开全书章节目录抽屉"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {activeChapter ? activeChapter.title : '未选定章节'}
            </span>
          </button>

          <button
            type="button"
            disabled={!nextChapter}
            onClick={() => nextChapter && handleSwitchChapter(nextChapter)}
            className="p-1 rounded-full hover:bg-surface-3-hover dark:hover:bg-[#282420] text-ink-2 hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
            title={nextChapter ? `下一章：《${nextChapter.title}》 (Alt+])` : '已是最新一章'}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-3.5 bg-line dark:bg-[#352f2a] shrink-0" />

        {/* 2. 字数与阅读时长 */}
        <div className="flex items-center gap-2 text-[11px] text-ink-2 dark:text-[#a09485] font-mono shrink-0">
          <span className="flex items-center gap-1">
            <Feather className="w-3 h-3 text-primary dark:text-amber-400" />
            <strong className="text-ink dark:text-[#ede6dc] font-sans">{wordCount}</strong> 字
          </span>
          <span className="hidden md:flex items-center gap-0.5 opacity-70">
            <Clock className="w-2.5 h-2.5" />
            <span>~{readMinutes}m</span>
          </span>
        </div>

        <div className="w-px h-3.5 bg-line dark:bg-[#352f2a] shrink-0" />

        {/* 3. 保存状态 */}
        <div className="flex items-center shrink-0">
          {saveStatus === 'SAVED' && (
            <span
              className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-serif"
              title="当前正文内容已自动同步至本地 SQLite 数据库"
            >
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">已存</span>
            </span>
          )}
          {saveStatus === 'SAVING' && (
            <span className="flex items-center gap-1 text-[11px] text-primary dark:text-amber-400 font-serif animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              <span className="hidden sm:inline">存盘中</span>
            </span>
          )}
          {saveStatus === 'DIRTY' && (
            <span className="flex items-center gap-1 text-[11px] text-ink-2 dark:text-[#8d8273] font-serif">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <span className="hidden sm:inline">待存</span>
            </span>
          )}
          {saveStatus === 'ERROR' && (
            <span className="flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400 font-serif">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">失败</span>
            </span>
          )}
        </div>

        <div className="w-px h-3.5 bg-line dark:bg-[#352f2a] shrink-0" />

        {/* 4. 专注辅助工具 (段落聚焦、打字机滚动、日夜切换) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleFocus}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isFocusMode
                ? 'bg-amber-800 text-amber-50 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#282420]'
            }`}
            title={isFocusMode ? '关闭段落聚焦 (Ctrl+Alt+F)' : '开启段落聚焦：淡化非焦点段落 (Ctrl+Alt+F)'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleTypewriter}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isTypewriterMode
                ? 'bg-amber-800 text-amber-50 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#282420]'
            }`}
            title={isTypewriterMode ? '关闭打字机居中滚动 (Ctrl+Alt+T)' : '开启打字机居中滚动：光标定位于视口中线 (Ctrl+Alt+T)'}
          >
            <Disc className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleThemeMode}
            className="p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#282420] transition cursor-pointer"
            title={themeMode === 'dark' ? '切换为白天暖玉宣纸模式' : '切换为夜间深宵冷砚模式'}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="w-px h-3.5 bg-line dark:bg-[#352f2a] shrink-0" />

        {/* 5. 退出模式胶囊按钮 */}
        <button
          type="button"
          onClick={exitZenMode}
          className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface-3 dark:bg-[#25211e] dark:hover:bg-[#2d2925] border border-line dark:border-[#3d362e] text-primary dark:text-amber-300 hover:text-primary-hover font-serif font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-102"
          title="退出沉浸写作，返回专业工坊模式 (快捷键: Esc / F11)"
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">返回工坊</span>
          <kbd className="hidden lg:inline text-[9px] font-mono opacity-60">Esc</kbd>
        </button>

        {/* 收起浮岛小箭头 */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-full text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#282420] transition cursor-pointer ml-[-4px]"
          title="最小化案头浮岛"
        >
          <Minimize2 className="w-3 h-3 opacity-60" />
        </button>
      </div>
    </div>
  );
};
