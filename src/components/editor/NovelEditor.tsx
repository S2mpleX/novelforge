import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { APP_CURRENT_VERSION } from '@/features/updater/services/UpdateService';
import type { Chapter, Character, WorldRule, PlotThread } from '@/types';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  Minus,
  Undo,
  Redo,
  Save,
  Maximize2,
  Sparkles,
  AlignLeft,
  AlignJustify,
  Lightbulb,
  Clock,
  Target,
  Check,
  X,
  Pencil,
  BookOpen,
  Search,
  Eye,
  Disc,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clapperboard,
  ShieldAlert,
} from 'lucide-react';
const CreateNovelModal = React.lazy(() => import('@/components/modals/CreateNovelModal').then(m => ({ default: m.CreateNovelModal })));
const CreateChapterModal = React.lazy(() => import('@/components/modals/CreateChapterModal').then(m => ({ default: m.CreateChapterModal })));
import { WindowControls } from '@/components/layout/WindowControls';
import { FloatingSelectionMenu } from './FloatingSelectionMenu';
import { ChapterPeekDrawer } from './ChapterPeekDrawer';
import { EditorFindReplaceBar } from './EditorFindReplaceBar';
import { EntityHoverCard } from './EntityHoverCard';
import { EditorMentionPopover } from './EditorMentionPopover';
import { InlineCursorBreakoutBar } from './InlineCursorBreakoutBar';
import { ContinuityGuardian } from './ContinuityGuardian';
import { SceneBeatsDrawer } from './SceneBeatsDrawer';
import { VoiceSentinelDrawer } from './VoiceSentinelDrawer';
import { api } from '@/utils/tauriBridge';
import { toast } from '@/stores/useToastStore';

type PaperTheme = 'xuan' | 'bamboo' | 'kraft' | 'midnight';

interface PaperThemeConfig {
  label: string;
  shortLabel: string;
  desc: string;
  canvasClass: string;
  sheetClass: string;
  swatch: string;
  swatchBorder: string;
  activeBtnBg: string;
  variables: {
    textColor: string;
    headingColor: string;
    accentColor: string;
    quoteColor: string;
    quoteBg: string;
    borderColor: string;
    ruledColor: string;
    sealBorder: string;
    sealColor: string;
    sealBg: string;
  };
  seal: string;
}

const FONT_PRESETS = [
  { size: 14, label: '小号字', desc: '14px' },
  { size: 16, label: '紧凑字', desc: '16px' },
  { size: 18, label: '标准字', desc: '18px (默认)' },
  { size: 20, label: '舒逸字', desc: '20px' },
  { size: 22, label: '大号字', desc: '22px' },
  { size: 26, label: '特大字', desc: '26px' },
];

const PAPER_THEMES: Record<PaperTheme, PaperThemeConfig> = {
  xuan: {
    label: '温润宣纸',
    shortLabel: '宣纸',
    desc: '手工熟宣细筋肌理 · 徽墨松烟',
    canvasClass: 'paper-canvas-xuan',
    sheetClass: 'paper-sheet-xuan',
    swatch: '#fbf7ee',
    swatchBorder: '#c8b496',
    activeBtnBg: 'bg-[#854d0e]',
    variables: {
      textColor: '#231d17',
      headingColor: '#17130f',
      accentColor: '#c2410c',
      quoteColor: '#635749',
      quoteBg: 'rgba(194, 65, 12, 0.04)',
      borderColor: '#ded5c4',
      ruledColor: 'rgba(180, 140, 90, 0.14)',
      sealBorder: '#c2410c',
      sealColor: '#c2410c',
      sealBg: '#fef2f2',
    },
    seal: '【 宣纸 · 澄品 】',
  },
  bamboo: {
    label: '澄心竹纸',
    shortLabel: '竹纸',
    desc: '江南竹浆素帘纹 · 幽雅竹墨',
    canvasClass: 'paper-canvas-bamboo',
    sheetClass: 'paper-sheet-bamboo',
    swatch: '#edf5eb',
    swatchBorder: '#a9c2a5',
    activeBtnBg: 'bg-[#047857]',
    variables: {
      textColor: '#17241a',
      headingColor: '#0e1810',
      accentColor: '#047857',
      quoteColor: '#435447',
      quoteBg: 'rgba(4, 120, 87, 0.05)',
      borderColor: '#cdd9ca',
      ruledColor: 'rgba(60, 120, 80, 0.12)',
      sealBorder: '#047857',
      sealColor: '#047857',
      sealBg: '#f0fdf4',
    },
    seal: '【 竹笺 · 幽韵 】',
  },
  kraft: {
    label: '复古牛皮',
    shortLabel: '牛皮',
    desc: '做旧原浆羊皮斑驳 · 沉香焦褐墨',
    canvasClass: 'paper-canvas-kraft',
    sheetClass: 'paper-sheet-kraft',
    swatch: '#ecdab9',
    swatchBorder: '#b39162',
    activeBtnBg: 'bg-[#92400e]',
    variables: {
      textColor: '#2a1b10',
      headingColor: '#1a0f07',
      accentColor: '#92400e',
      quoteColor: '#5c432d',
      quoteBg: 'rgba(146, 64, 14, 0.08)',
      borderColor: '#ba9e74',
      ruledColor: 'rgba(120, 75, 25, 0.16)',
      sealBorder: '#92400e',
      sealColor: '#92400e',
      sealBg: '#fef3c7',
    },
    seal: '【 秘卷 · 珍藏 】',
  },
  midnight: {
    label: '水墨夜读',
    shortLabel: '夜读',
    desc: '深宵歙砚水墨氤氲 · 柔和月华白',
    canvasClass: 'paper-canvas-midnight',
    sheetClass: 'paper-sheet-midnight',
    swatch: '#1c1c22',
    swatchBorder: '#52525e',
    activeBtnBg: 'bg-[#27272a] border border-[#f59e0b]/40',
    variables: {
      textColor: '#dfdbd0',
      headingColor: '#f6f3eb',
      accentColor: '#f59e0b',
      quoteColor: '#a39e93',
      quoteBg: 'rgba(245, 158, 11, 0.08)',
      borderColor: '#383842',
      ruledColor: 'rgba(180, 180, 200, 0.08)',
      sealBorder: '#d97706',
      sealColor: '#f59e0b',
      sealBg: '#27272a',
    },
    seal: '【 夜墨 · 沉吟 】',
  },
};

const StreamingPreviewBox: React.FC<{ paperTheme: PaperTheme; fontSize: number }> = React.memo(
  ({ paperTheme, fontSize }) => {
    const isGenerating = useNovelStore((s) => s.isGenerating);
    const streamText = useNovelStore((s) => s.streamText);

    if (!isGenerating || !streamText) return null;

    return (
      <div
        className="mt-8 p-6 rounded-xl border shadow-md transition-colors duration-200"
        style={{
          borderColor: PAPER_THEMES[paperTheme].variables.accentColor,
          backgroundColor: PAPER_THEMES[paperTheme].variables.quoteBg,
        }}
      >
        <div
          className="flex items-center gap-2.5 text-xs font-semibold mb-3"
          style={{ color: PAPER_THEMES[paperTheme].variables.accentColor }}
        >
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>正文作家 Agent 正在实时流式创作中...</span>
        </div>
        <p
          className="whitespace-pre-wrap font-serif leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: fontSize >= 24 ? '2.25' : fontSize <= 14 ? '1.9' : '2.15',
            color: PAPER_THEMES[paperTheme].variables.textColor,
          }}
        >
          {streamText}
        </p>
      </div>
    );
  }
);

interface EditorWordStatsTrackerProps {
  targetWords: number;
  initialCharCount?: number;
  onSelectTargetWords?: (newTarget: number) => void;
}

const EditorWordStatsTracker: React.FC<EditorWordStatsTrackerProps> = React.memo(
  ({ targetWords, initialCharCount, onSelectTargetWords }) => {
    const charCount = useNovelStore((s) => (s.editorContent ? s.editorContent.replace(/\s+/g, '').length : 0));
    const targetPercent = Math.min(150, Math.round((charCount / Math.max(1, targetWords)) * 100));
    const estimatedReadMinutes = (charCount / 400).toFixed(1);
    const sessionDelta = initialCharCount !== undefined ? charCount - initialCharCount : 0;
    const [showTargetMenu, setShowTargetMenu] = useState(false);

    return (
      <div className="relative hidden lg:flex items-center gap-2.5 text-xs font-serif text-ink-2 bg-surface px-2.5 py-1 rounded-lg border border-line shrink-0 whitespace-nowrap">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
          <button
            type="button"
            onClick={() => onSelectTargetWords && setShowTargetMenu(!showTargetMenu)}
            className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 font-medium"
            title="点击切换单章目标字数"
          >
            <span>目标:</span>
            <span className="font-bold text-ink underline decoration-dotted decoration-stone-400">
              {charCount} / {targetWords} 字
            </span>
          </button>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              targetPercent >= 100
                ? 'bg-[#047857]/10 text-[#047857] border border-[#047857]/20'
                : 'bg-[#854d0e]/10 text-primary border border-[#854d0e]/20'
            }`}
          >
            {targetPercent}%
          </span>
        </div>

        {/* 本次码字增量反馈 */}
        {sessionDelta !== 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              sessionDelta > 0
                ? 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}
            title="本次开启该章节以来的净增字数"
          >
            本次 {sessionDelta > 0 ? `+${sessionDelta}` : sessionDelta}
          </span>
        )}

        <div className="w-px h-3 bg-[#ded5c4] dark:bg-[#443e37] shrink-0" />

        <div className="flex items-center gap-1 text-ink-2 shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>~{estimatedReadMinutes} 分钟</span>
        </div>

        {/* 目标字数快捷切换弹层 */}
        {showTargetMenu && onSelectTargetWords && (
          <div className="absolute top-full left-0 mt-1.5 w-36 bg-surface border border-line rounded-xl shadow-xl p-1.5 z-50">
            <div className="text-[10px] font-bold text-primary px-1.5 py-0.5 border-b border-line mb-1">
              切换章节目标字数
            </div>
            {[2000, 3000, 4000, 5000, 8000, 10000].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onSelectTargetWords(t);
                  setShowTargetMenu(false);
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs transition cursor-pointer flex items-center justify-between ${
                  targetWords === t ? 'bg-[#854d0e] text-white font-bold' : 'text-ink hover:bg-surface-3'
                }`}
              >
                <span>{t} 字</span>
                {targetWords === t && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

const EditorSaveButton: React.FC<{ onSave: () => void }> = React.memo(({ onSave }) => {
  const saveStatus = useNovelStore((s) => s.saveStatus);
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saveStatus === 'SAVING'}
      className="px-3 py-1 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium flex items-center gap-1.5 transition shadow-xs active:scale-95 disabled:opacity-40 shrink-0 whitespace-nowrap cursor-pointer"
      title="保存当前快照 (Ctrl+S)"
    >
      <Save className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">{saveStatus === 'SAVING' ? '存盘中...' : '保存快照'}</span>
    </button>
  );
});

export const NovelEditor: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    chapters,
    selectChapter,
    updateEditorContent,
    saveCurrentChapter,
    updateChapterTitle,
    zenMode,
    toggleZenMode,
    themeMode,
    setThemeMode,
    registerFlushEditorSync,
    scenes,
  } = useNovelStore(
    useShallow((s) => ({
      activeNovel: s.activeNovel,
      activeChapter: s.activeChapter,
      chapters: s.chapters,
      selectChapter: s.selectChapter,
      updateEditorContent: s.updateEditorContent,
      saveCurrentChapter: s.saveCurrentChapter,
      updateChapterTitle: s.updateChapterTitle,
      zenMode: s.zenMode,
      toggleZenMode: s.toggleZenMode,
      themeMode: s.themeMode,
      setThemeMode: s.setThemeMode,
      registerFlushEditorSync: s.registerFlushEditorSync,
      scenes: s.scenes,
    }))
  );

  const [showSceneBeatsDrawer, setShowSceneBeatsDrawer] = useState(false);
  const [showVoiceSentinelDrawer, setShowVoiceSentinelDrawer] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      setTitleInputValue(activeChapter?.title || '');
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
    }
  }, [isEditingTitle, activeChapter?.title]);

  const handleSaveTitle = async () => {
    if (!activeChapter) return;
    const trimmed = titleInputValue.trim();
    setIsEditingTitle(false);
    if (trimmed && trimmed !== activeChapter.title) {
      try {
        await updateChapterTitle(activeChapter.id, trimmed);
      } catch (e) {
        console.error('更新章节标题失败:', e);
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || (e as any).isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<'find' | 'replace'>('find');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    return localStorage.getItem('novelforge_focus_mode') === 'true';
  });
  const [isTypewriterMode, setIsTypewriterMode] = useState<boolean>(() => {
    return localStorage.getItem('novelforge_typewriter_mode') === 'true';
  });

  // Session initial word count tracking for realtime delta (+X words written this sitting)
  const [sessionInitialChars, setSessionInitialChars] = useState<number | null>(null);
  const [customTargetWords, setCustomTargetWords] = useState<number | null>(null);

  useEffect(() => {
    if (activeChapter) {
      const initLen = (activeChapter.content || '').replace(/\s+/g, '').length;
      setSessionInitialChars(initLen);
    } else {
      setSessionInitialChars(null);
    }
  }, [activeChapter?.id]);

  // --- Mention, Decision Probe & Continuity Guardian State ---
  const [novelCharacters, setNovelCharacters] = useState<Character[]>([]);
  const [novelWorldRules, setNovelWorldRules] = useState<WorldRule[]>([]);
  const [novelPlotThreads, setNovelPlotThreads] = useState<PlotThread[]>([]);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCoords, setMentionCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [precedingText, setPrecedingText] = useState<string>('');
  const [showProbeBar, setShowProbeBar] = useState(false);
  const [hoverEntity, setHoverEntity] = useState<{
    type: 'character' | 'world_rule';
    character?: Character | null;
    worldRule?: WorldRule | null;
    coords: { top: number; left: number };
  } | null>(null);

  // Load characters, world rules, and plot threads for @ mention and continuity checks
  useEffect(() => {
    if (!activeNovel?.id) return;
    api.listCharacters(activeNovel.id).then((chars) => setNovelCharacters(chars || [])).catch(() => {});
    api.listWorldRules(activeNovel.id).then((rules) => setNovelWorldRules(rules || [])).catch(() => {});
    api.listPlotThreads(activeNovel.id).then((threads) => setNovelPlotThreads(threads || [])).catch(() => {});
  }, [activeNovel?.id]);

  const editorScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Chapter navigation calculation (order-based)
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => (a.chapter_number ?? a.sequence ?? 0) - (b.chapter_number ?? b.sequence ?? 0));
  }, [chapters]);

  const currentChapterIndex = sortedChapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < sortedChapters.length - 1
      ? sortedChapters[currentChapterIndex + 1]
      : null;

  const handleSwitchChapter = useCallback(
    async (targetChapter: Chapter) => {
      if (!targetChapter || targetChapter.id === activeChapter?.id) return;
      try {
        await selectChapter(targetChapter);
        toast.info(
          `已翻至第 ${targetChapter.chapter_number} 章`,
          `《${targetChapter.title}》`
        );
      } catch (e) {
        console.error('切换章节失败:', e);
        toast.error('切换章节失败', '请检查本地数据库连接');
      }
    },
    [activeChapter?.id, selectChapter]
  );

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      localStorage.setItem('novelforge_focus_mode', String(next));
      if (next) {
        toast.info('段落聚焦已开启', '仅高亮光标所在段落，专注单段心流 (Ctrl+Alt+F)');
      } else {
        toast.info('段落聚焦已关闭', '恢复全文常规浏览透明度');
      }
      return next;
    });
  }, []);

  const toggleTypewriterMode = useCallback(() => {
    setIsTypewriterMode((prev) => {
      const next = !prev;
      localStorage.setItem('novelforge_typewriter_mode', String(next));
      if (next) {
        toast.info('打字机滚动已开启', '光标保持居中视口黄金线 (Ctrl+Alt+T)');
      } else {
        toast.info('打字机滚动已关闭', '恢复标准视口滚动');
      }
      return next;
    });
  }, []);

  const [paperTheme, setPaperTheme] = useState<PaperTheme>(() => {
    const saved = localStorage.getItem('novelforge_paper_theme') as PaperTheme;
    if (saved) return saved;
    return (localStorage.getItem('novelforge_theme_mode') === 'dark') ? 'midnight' : 'xuan';
  });
  const [showRuledLines, setShowRuledLines] = useState<boolean>(() => {
    return localStorage.getItem('novelforge_ruled_lines') === 'true';
  });

  // Automatically sync paperTheme with global themeMode
  useEffect(() => {
    if (themeMode === 'dark' && paperTheme !== 'midnight') {
      setPaperTheme('midnight');
      localStorage.setItem('novelforge_paper_theme', 'midnight');
    } else if (themeMode === 'light' && paperTheme === 'midnight') {
      const savedLight = (localStorage.getItem('novelforge_light_paper_theme') as PaperTheme) || 'xuan';
      setPaperTheme(savedLight);
      localStorage.setItem('novelforge_paper_theme', savedLight);
    }
  }, [themeMode]);

  const handleToggleRuledLines = () => {
    setShowRuledLines((prev) => {
      const next = !prev;
      localStorage.setItem('novelforge_ruled_lines', String(next));
      return next;
    });
  };
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('novelforge_font_size');
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 12 && val <= 36) {
        return val;
      }
    }
    return 18;
  });
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const fontSizeMenuRef = useRef<HTMLDivElement | null>(null);

  // Close font size dropdown when clicking outside
  useEffect(() => {
    if (!showFontSizeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
        setShowFontSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFontSizeMenu]);

  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem(`novelforge_notes_${activeNovel?.id || 'default'}`) || '';
  });
  const [formatSuccess, setFormatSuccess] = useState(false);

  const handleSetPaperTheme = (theme: PaperTheme) => {
    setPaperTheme(theme);
    localStorage.setItem('novelforge_paper_theme', theme);
    if (theme !== 'midnight') {
      localStorage.setItem('novelforge_light_paper_theme', theme);
    }
    if (theme === 'midnight' && themeMode !== 'dark') {
      setThemeMode('dark');
    } else if (theme !== 'midnight' && themeMode === 'dark') {
      setThemeMode('light');
    }
    toast.info(`切换信笺：${PAPER_THEMES[theme].label}`, PAPER_THEMES[theme].desc);
  };

  const handleSetFontSize = (size: number) => {
    const clamped = Math.min(32, Math.max(12, size));
    setFontSize(clamped);
    localStorage.setItem('novelforge_font_size', clamped.toString());
  };

  const handleDecreaseFontSize = () => {
    handleSetFontSize(fontSize - 2);
  };

  const handleIncreaseFontSize = () => {
    handleSetFontSize(fontSize + 2);
  };

  const storeUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasFocusHighlightRef = useRef(false);

  const updateFocusHighlight = useCallback(() => {
    if (!isFocusMode) {
      if (hasFocusHighlightRef.current) {
        document
          .querySelectorAll('.editor-surface .has-focus')
          .forEach((el) => el.classList.remove('has-focus'));
        hasFocusHighlightRef.current = false;
      }
      return;
    }
    const domSelection = window.getSelection();
    if (domSelection && domSelection.anchorNode) {
      let parent = domSelection.anchorNode as HTMLElement;
      while (
        parent &&
        parent.parentElement &&
        !parent.parentElement.classList.contains('ProseMirror')
      ) {
        parent = parent.parentElement;
      }
      if (
        parent &&
        parent.classList &&
        parent.parentElement?.classList.contains('ProseMirror')
      ) {
        document
          .querySelectorAll('.editor-surface .has-focus')
          .forEach((el) => el.classList.remove('has-focus'));
        parent.classList.add('has-focus');
        hasFocusHighlightRef.current = true;
      }
    }
  }, [isFocusMode]);

  const checkMentionAndCursor = useCallback((currentEditor: any) => {
    if (!currentEditor || !currentEditor.isFocused) {
      setMentionQuery(null);
      return;
    }
    const { from, empty } = currentEditor.state.selection;
    if (!empty) {
      setMentionQuery(null);
      return;
    }
    try {
      const $pos = currentEditor.state.selection.$from;
      const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, null, '\ufffc');
      const match = textBefore.match(/@([^\s@]{0,15})$/);
      if (match) {
        const coords = currentEditor.view.coordsAtPos(from);
        setMentionCoords({ top: coords.top, left: coords.left });
        setMentionQuery(match[1]);
      } else {
        setMentionQuery(null);
      }

      // Update cursor coords & preceding text for Breakout Bar
      const coords = currentEditor.view.coordsAtPos(from);
      setCursorCoords({ top: coords.top, left: coords.left });
      const fullTextBefore = currentEditor.state.doc.textBetween(Math.max(0, from - 1000), from, ' ');
      setPrecedingText(fullTextBefore);
    } catch (e) {
      setMentionQuery(null);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: useNovelStore.getState().editorContent || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[500px] leading-relaxed',
      },
    },
    onSelectionUpdate: ({ editor: ed }) => {
      updateFocusHighlight();
      checkMentionAndCursor(ed);
      if (isTypewriterMode && editorScrollContainerRef.current && ed?.isFocused) {
        try {
          const coords = ed.view.coordsAtPos(ed.state.selection.from);
          const container = editorScrollContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const targetY = containerRect.top + containerRect.height * 0.45;
          const diff = coords.top - targetY;
          if (Math.abs(diff) > 24) {
            container.scrollBy({ top: diff, behavior: 'smooth' });
          }
        } catch {}
      }
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      updateFocusHighlight();
      checkMentionAndCursor(ed);

      // Debounce global store updates (400ms)
      if (storeUpdateTimerRef.current) {
        clearTimeout(storeUpdateTimerRef.current);
      }
      storeUpdateTimerRef.current = setTimeout(() => {
        updateEditorContent(html);
      }, 400);

      // Debounce auto-save (1500ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateEditorContent(ed.getHTML());
        saveCurrentChapter(false, 'USER_EDIT');
      }, 1500);
    },
    onBlur: ({ editor }) => {
      if (storeUpdateTimerRef.current) {
        clearTimeout(storeUpdateTimerRef.current);
        storeUpdateTimerRef.current = null;
      }
      updateEditorContent(editor.getHTML());
    },
  });

  // Sync editor content when chapter changes or when activeChapter is refreshed externally
  const activeChapterIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    const isChapterSwitch = activeChapter?.id !== activeChapterIdRef.current;
    activeChapterIdRef.current = activeChapter?.id || null;

    if (isChapterSwitch) {
      // 切换章节：无条件加载新章节内容
      const currentContent = useNovelStore.getState().editorContent || activeChapter?.content || '';
      editor.commands.setContent(currentContent, { emitUpdate: false });
      return;
    }

    const currentContent = useNovelStore.getState().editorContent;
    // 同一章节内：仅当编辑器未聚焦（非主动输入中，如外部版本回滚、一键排版、批量修订采纳）且内容不一致时同步
    if (!editor.isFocused && currentContent !== editor.getHTML()) {
      editor.commands.setContent(currentContent || '', { emitUpdate: false });
    }
  }, [activeChapter?.id, activeChapter?.updated_at]);

  // 监听外部强制刷新正文事件（如版本回滚或格式化广播）
  useEffect(() => {
    const handleForceReload = () => {
      if (editor) {
        editor.commands.setContent(useNovelStore.getState().editorContent || '', { emitUpdate: false });
      }
    };
    const handleToggleFocus = () => toggleFocusMode();
    const handleToggleTypewriter = () => toggleTypewriterMode();

    window.addEventListener('novelforge:force-editor-reload', handleForceReload);
    window.addEventListener('novelforge:toggle-focus', handleToggleFocus);
    window.addEventListener('novelforge:toggle-typewriter', handleToggleTypewriter);

    return () => {
      window.removeEventListener('novelforge:force-editor-reload', handleForceReload);
      window.removeEventListener('novelforge:toggle-focus', handleToggleFocus);
      window.removeEventListener('novelforge:toggle-typewriter', handleToggleTypewriter);
    };
  }, [editor, toggleFocusMode, toggleTypewriterMode]);

  // Sync scratch notes when active novel changes
  useEffect(() => {
    if (activeNovel?.id) {
      setScratchNotes(localStorage.getItem(`novelforge_notes_${activeNovel.id}`) || '');
    }
  }, [activeNovel?.id]);

  const handleNotesChange = (val: string) => {
    setScratchNotes(val);
    if (activeNovel?.id) {
      localStorage.setItem(`novelforge_notes_${activeNovel.id}`, val);
    }
  };

  const handleManualSave = useCallback(async () => {
    if (storeUpdateTimerRef.current) {
      clearTimeout(storeUpdateTimerRef.current);
      storeUpdateTimerRef.current = null;
    }
    if (editor) {
      updateEditorContent(editor.getHTML());
    }
    await saveCurrentChapter(true, 'USER_MANUAL_SAVE');
    const curLen = (editor ? editor.getText() : (useNovelStore.getState().editorContent || '')).replace(/\s+/g, '').length;
    toast.success('正文快照已存盘', `已安全写入本地 SQLite，当前章节共计 ${curLen} 字`);
  }, [editor, updateEditorContent, saveCurrentChapter]);

  const handleSelectMention = useCallback(
    (entity: { type: 'character' | 'world_rule'; item: Character | WorldRule }) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      const matchLen = (mentionQuery?.length || 0) + 1; // +1 for '@'
      const entityName =
        entity.type === 'character'
          ? (entity.item as Character).name
          : (entity.item as WorldRule).title;

      editor
        .chain()
        .focus()
        .deleteRange({ from: from - matchLen, to: from })
        .insertContent(`@${entityName} `)
        .run();

      setMentionQuery(null);

      // Display the EntityHoverCard right beside the cursor for instant verification!
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        setHoverEntity({
          type: entity.type,
          character: entity.type === 'character' ? (entity.item as Character) : null,
          worldRule: entity.type === 'world_rule' ? (entity.item as WorldRule) : null,
          coords: { top: coords.top + 20, left: coords.left },
        });
      } catch (e) {}
    },
    [editor, mentionQuery]
  );

  const handleInsertTextAtCursor = useCallback(
    (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(text).run();
      updateEditorContent(editor.getHTML());
    },
    [editor, updateEditorContent]
  );

  // Hover over mention in editor text to trigger EntityHoverCard
  const handleEditorMouseOver = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const text = target.innerText || target.textContent || '';
      if (text.includes('@')) {
        const match = text.match(/@([^\s，。！？、“”\n]+)/);
        if (match) {
          const entityName = match[1];
          const char = novelCharacters.find((c) => c.name === entityName);
          if (char) {
            const rect = target.getBoundingClientRect();
            setHoverEntity({
              type: 'character',
              character: char,
              coords: { top: rect.top, left: rect.left },
            });
            return;
          }
          const rule = novelWorldRules.find((r) => r.title === entityName);
          if (rule) {
            const rect = target.getBoundingClientRect();
            setHoverEntity({
              type: 'world_rule',
              worldRule: rule,
              coords: { top: rect.top, left: rect.left },
            });
            return;
          }
        }
      }
    },
    [novelCharacters, novelWorldRules]
  );

  // Comprehensive keyboard shortcuts (Ctrl+S, Ctrl+J, Ctrl+F, Ctrl+H, Ctrl+Alt+F, Ctrl+Alt+T, Alt+[, Alt+], Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Manual snapshot save
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleManualSave();
        return;
      }

      // Ctrl+J: Inline character decision probe / breakout bar
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        if (editor) {
          const { from } = editor.state.selection;
          try {
            const coords = editor.view.coordsAtPos(from);
            setCursorCoords({ top: coords.top, left: coords.left });
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1000), from, ' ');
            setPrecedingText(textBefore);
            setShowProbeBar((prev) => !prev);
          } catch {}
        }
        return;
      }

      // Ctrl+F: In-chapter find
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setShowFindReplace(true);
        setFindReplaceMode('find');
        return;
      }

      // Ctrl+H: In-chapter find & replace
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowFindReplace(true);
        setFindReplaceMode('replace');
        return;
      }

      // Ctrl+Alt+F: Paragraph Focus mode
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Ctrl+Alt+T: Typewriter Scroll mode
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTypewriterMode();
        return;
      }

      // Alt+Shift+F: Literature auto-format
      if (e.altKey && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        handleAutoFormat();
        return;
      }

      // Alt+[: Jump to previous chapter
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key === '[') {
        if (prevChapter) {
          e.preventDefault();
          handleSwitchChapter(prevChapter);
        }
        return;
      }

      // Alt+]: Jump to next chapter
      if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key === ']') {
        if (nextChapter) {
          e.preventDefault();
          handleSwitchChapter(nextChapter);
        }
        return;
      }

      // Escape: Close find/replace or exit editor fullscreen
      if (e.key === 'Escape') {
        if (showFindReplace) {
          e.preventDefault();
          setShowFindReplace(false);
          editor?.commands.focus();
        } else if (isFullScreen) {
          setIsFullScreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleManualSave,
    isFullScreen,
    showFindReplace,
    editor,
    prevChapter,
    nextChapter,
    handleSwitchChapter,
    toggleFocusMode,
    toggleTypewriterMode,
  ]);

  // Register editor flush sync hook into store so selectChapter can flush changes synchronously
  useEffect(() => {
    registerFlushEditorSync(() => {
      if (editor) {
        if (storeUpdateTimerRef.current) {
          clearTimeout(storeUpdateTimerRef.current);
          storeUpdateTimerRef.current = null;
        }
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        return editor.getHTML();
      }
      return null;
    });
    return () => {
      registerFlushEditorSync(undefined);
    };
  }, [editor, registerFlushEditorSync]);

  // Clean up pending timers when chapter changes so debounced saves never run against the wrong chapter
  const lastChapterIdRef = useRef<string | null>(activeChapter?.id || null);
  useEffect(() => {
    if (lastChapterIdRef.current && lastChapterIdRef.current !== activeChapter?.id) {
      if (storeUpdateTimerRef.current) {
        clearTimeout(storeUpdateTimerRef.current);
        storeUpdateTimerRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
    lastChapterIdRef.current = activeChapter?.id || null;
  }, [activeChapter?.id]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (storeUpdateTimerRef.current) clearTimeout(storeUpdateTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showChapterPeek, setShowChapterPeek] = useState(false);
  const { loadNovels } = useNovelStore();

  // One-click Literature Format: clean extra blank paragraphs and fix punctuation
  const handleAutoFormat = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHtml;

    const paragraphs = tempDiv.querySelectorAll('p');
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.nodeValue || '';
        text = text
          .replace(/,/g, '，')
          .replace(/\?/g, '？')
          .replace(/!/g, '！')
          .replace(/:/g, '：')
          .replace(/;/g, '；');
        node.nodeValue = text;
      } else {
        node.childNodes.forEach(walkTextNodes);
      }
    };

    paragraphs.forEach((p) => {
      const text = p.textContent?.trim();
      if (!text) {
        p.remove();
        return;
      }
      walkTextNodes(p);
    });

    const cleanedHtml = tempDiv.innerHTML;
    editor.commands.setContent(cleanedHtml);
    updateEditorContent(cleanedHtml);
    saveCurrentChapter(true, 'AUTO_FORMAT');
    setFormatSuccess(true);
    toast.info('一键排版完成', '已自动规范全角标点与空行格式');
    setTimeout(() => setFormatSuccess(false), 2000);
  };

  // 文风巡检单处替换
  const handleReplaceTextInEditor = useCallback(
    (target: string, replacement: string) => {
      if (!editor || !target) return;
      const { doc } = editor.state;
      let replaced = false;

      doc.descendants((node, pos) => {
        if (replaced) return false;
        if (node.isText && node.text && node.text.includes(target)) {
          const index = node.text.indexOf(target);
          const from = pos + index;
          const to = from + target.length;
          editor.chain().focus().setTextSelection({ from, to }).insertContent(replacement).run();
          replaced = true;
          return false;
        }
        return true;
      });

      if (replaced) {
        const newHtml = editor.getHTML();
        updateEditorContent(newHtml);
        saveCurrentChapter(false, 'VOICE_SENTINEL_FIX');
      }
    },
    [editor, updateEditorContent, saveCurrentChapter]
  );

  // 文风巡检批量替换
  const handleBatchReplaceTextInEditor = useCallback(
    (replacements: Array<{ target: string; replacement: string }>) => {
      if (!editor || replacements.length === 0) return;
      let currentHtml = editor.getHTML();
      for (const { target, replacement } of replacements) {
        if (target) {
          currentHtml = currentHtml.split(target).join(replacement);
        }
      }
      editor.commands.setContent(currentHtml);
      updateEditorContent(currentHtml);
      saveCurrentChapter(true, 'VOICE_SENTINEL_BATCH_FIX');
    },
    [editor, updateEditorContent, saveCurrentChapter]
  );

  // 场景节拍正文聚焦与滚动定位
  const handleFocusSceneInEditor = useCallback(
    (sceneNumber: number, title?: string) => {
      if (!editor) return;
      const cleanTitle = (title || '').trim();
      const query1 = `场景 ${sceneNumber}`;
      const query2 = `场景${sceneNumber}`;
      const query3 = cleanTitle.length >= 2 ? cleanTitle : '';

      let foundPos = -1;
      let matchLength = query1.length;

      editor.state.doc.descendants((node, pos) => {
        if (foundPos !== -1) return false;
        if (node.isText && node.text) {
          let idx = node.text.indexOf(query1);
          if (idx !== -1) {
            foundPos = pos + idx;
            matchLength = query1.length;
            return false;
          }
          idx = node.text.indexOf(query2);
          if (idx !== -1) {
            foundPos = pos + idx;
            matchLength = query2.length;
            return false;
          }
          if (query3) {
            idx = node.text.indexOf(query3);
            if (idx !== -1) {
              foundPos = pos + idx;
              matchLength = query3.length;
              return false;
            }
          }
        }
        return true;
      });

      if (foundPos !== -1) {
        editor.chain().focus().setTextSelection({ from: foundPos, to: foundPos + matchLength }).scrollIntoView().run();
        toast.success('已定位场景', `已将光标聚焦至【第 ${sceneNumber} 场景：${cleanTitle || '节拍推进'}】`);
      } else {
        toast.info(
          '未在正文中找到场景标记',
          `正文中尚未包含【场景 ${sceneNumber}】，可点击顶栏「装配至正文提纲」一键插入！`
        );
      }
    },
    [editor]
  );

  // Character stats & calculations
  const targetWords = customTargetWords ?? (activeNovel?.chapter_target_length || 3000);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 overflow-y-auto bg-canvas">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-orange-700 shadow-lg shadow-amber-900/15 border border-amber-600/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight font-serif">
              NovelForge AI <span className="text-primary text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-800/10 border border-amber-800/20 align-middle">v{APP_CURRENT_VERSION}</span>
            </h2>
            <p className="text-sm text-ink-2 mt-2 max-w-lg mx-auto leading-relaxed">
              本地优先 · 多模型接入 · 多 Agent 协作 · 长期记忆驱动的专业长篇创作生产系统
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-xl bg-surface border border-line shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-amber-800/10 flex items-center justify-center text-primary font-bold text-xs font-mono">L4</div>
              <h4 className="text-xs font-semibold text-ink">五层长期记忆</h4>
              <p className="text-[11px] text-ink-2 leading-normal">
                分层工作记忆与 FTS5 事实检索，跨越数百万字严控剧情前后矛盾。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-orange-800/10 flex items-center justify-center text-orange-800 font-bold text-xs font-mono">AI</div>
              <h4 className="text-xs font-semibold text-ink">多 Agent 智囊团</h4>
              <p className="text-[11px] text-ink-2 leading-normal">
                主编、编剧、作家、审稿各司其职，装载 Humanizer 文学润色体系。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-800/10 flex items-center justify-center text-emerald-800 font-bold text-xs font-mono">DB</div>
              <h4 className="text-xs font-semibold text-ink">本地 SQLite 离线</h4>
              <p className="text-[11px] text-ink-2 leading-normal">
                WAL 高性能存储，不可逆正文版本快照与单文件 HTML5 电子书发布。
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowCreateNovel(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-900/15 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              立即创建新作品
            </button>
            <button
              onClick={() => loadNovels()}
              className="px-4 py-2.5 rounded-xl bg-surface-3 hover:bg-surface-3-hover text-ink text-xs font-medium transition border border-line"
            >
              刷新作品列表
            </button>
          </div>
        </div>

        <React.Suspense fallback={null}>
          {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
        </React.Suspense>
      </div>
    );
  }

  if (!activeChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 bg-canvas">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-surface border border-line shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-800/10 border border-amber-800/20 flex items-center justify-center mx-auto text-primary">
            <Quote className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs text-primary font-semibold mb-1">
              《{activeNovel.title}》
            </div>
            <h3 className="text-base font-bold text-ink font-serif">未选中任何章节</h3>
            <p className="text-xs text-ink-2 mt-1.5 leading-relaxed">
              请从左侧目录选择已有章节继续创作，或点击下方按钮开启新的一章。
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowCreateChapter(true)}
              className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-900/15 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              新建第一章
            </button>
          </div>
        </div>

        <React.Suspense fallback={null}>
          {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
        </React.Suspense>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 w-full h-full ${
        isFullScreen ? 'fixed inset-0 z-50 bg-canvas p-6' : ''
      }`}
    >
      {/* 全屏模式下右上角固定常驻退出/关闭控制器（无论工具栏横向滚动或缩放，始终绝对置顶于屏幕右上角，绝对显眼） */}
      {isFullScreen && (
        <div className="fixed top-3 right-4 z-[999] flex items-center gap-2 bg-surface-2 dark:bg-stone-800 px-2.5 py-1.5 rounded-xl border border-line dark:border-stone-700 shadow-xl select-none animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-serif font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer group"
            title="退出全屏专注模式 (Esc / 点击关闭)"
            aria-label="退出全屏"
          >
            <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>退出全屏 (Esc)</span>
          </button>
          <WindowControls />
        </div>
      )}

      {/* Editor Formatting Floating Toolbar */}
      <div className="h-12 border-b border-line dark:border-[#2e2a27] px-2.5 md:px-4 flex items-center justify-between bg-surface-2 dark:bg-[#1a1714] select-none shrink-0 z-10 shadow-sm gap-1.5 relative min-w-0">
        {/* Left: Text Formatting Controls & Zen Mode Indicator */}
        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {zenMode && (
            <button
              type="button"
              onClick={toggleZenMode}
              className="mr-2 px-2 py-0.5 rounded bg-amber-800/10 hover:bg-amber-800/20 text-primary border border-amber-800/20 text-[10px] font-serif font-bold shrink-0 whitespace-nowrap flex items-center gap-1 transition cursor-pointer"
              title="点击退出禅意专注模式 (Esc)"
            >
              <X className="w-3 h-3" />
              <span>禅意专注 (Esc退出)</span>
            </button>
          )}
          {isFullScreen && (
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="mr-2 px-2 py-0.5 rounded bg-rose-700/10 hover:bg-rose-700/20 text-rose-800 border border-rose-700/20 text-[10px] font-serif font-bold shrink-0 whitespace-nowrap flex items-center gap-1 transition cursor-pointer"
              title="点击退出全屏模式 (Esc)"
            >
              <X className="w-3 h-3" />
              <span>全屏专注 (Esc退出)</span>
            </button>
          )}
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            className="p-1.5 rounded-md hover:bg-surface-3-hover text-ink-2 hover:text-ink disabled:opacity-25 transition shrink-0 cursor-pointer"
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="p-1.5 rounded-md hover:bg-surface-3-hover text-ink-2 hover:text-ink disabled:opacity-25 transition shrink-0 cursor-pointer"
            title="重做 (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('bold')
                ? 'bg-amber-800/15 text-primary border border-amber-800/30 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
            title="加粗"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('italic')
                ? 'bg-amber-800/15 text-primary border border-amber-800/30 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
            title="斜体"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-amber-800/15 text-primary border border-amber-800/30 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
            title="一级标题"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-amber-800/15 text-primary border border-amber-800/30 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
            title="二级标题"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('blockquote')
                ? 'bg-amber-800/15 text-primary border border-amber-800/30 shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
            title="引述"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-md hover:bg-surface-3-hover text-ink-2 hover:text-ink transition shrink-0 cursor-pointer"
            title="分割线"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          {/* One-click Formatting */}
          <button
            onClick={handleAutoFormat}
            className="px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3-hover text-primary border border-line text-xs font-serif flex items-center gap-1 transition shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="一键文学规范排版：清理空行、全角标点规范化"
          >
            {formatSuccess ? <Check className="w-3.5 h-3.5 text-[#047857]" /> : <AlignLeft className="w-3.5 h-3.5" />}
            <span className="hidden md:inline whitespace-nowrap">{formatSuccess ? '排版完成' : '规范排版'}</span>
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          {/* Paper Theme Selector & Ruled Lines Toggle */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-0.5 bg-surface-3 p-0.5 rounded-md border border-line shadow-2xs shrink-0">
              {(Object.keys(PAPER_THEMES) as PaperTheme[]).map((themeKey) => {
                const conf = PAPER_THEMES[themeKey];
                const isActive = paperTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => handleSetPaperTheme(themeKey)}
                    className={`px-2 py-0.5 rounded text-[11px] font-serif transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap ${
                      isActive
                        ? `${conf.activeBtnBg} text-white font-bold shadow-xs scale-102`
                        : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
                    }`}
                    title={`切换纸张主题：${conf.label}（${conf.desc}）`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border shrink-0 transition-transform shadow-2xs"
                      style={{
                        backgroundColor: conf.swatch,
                        borderColor: conf.swatchBorder,
                        transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                    <span>{conf.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleToggleRuledLines}
              className={`px-2 py-1 rounded-md text-xs font-serif flex items-center gap-1 transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                showRuledLines
                  ? 'bg-[#854d0e]/15 text-primary border-[#854d0e]/30 font-bold shadow-2xs'
                  : 'bg-surface-2 hover:bg-surface-3-hover text-ink-2 border-line'
              }`}
              title="开启/关闭信笺稿纸行线（开启后呈现真实原稿信笺纸横格）"
            >
              <AlignJustify className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">信笺横线</span>
            </button>
          </div>

          {/* Font Size Adjuster & Quick Presets */}
          <div ref={fontSizeMenuRef} className="relative flex items-center shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-0.5 bg-surface-3 p-0.5 rounded-md border border-line shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handleDecreaseFontSize}
                disabled={fontSize <= 12}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-2 hover:text-ink hover:bg-surface-3-hover disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition cursor-pointer"
                title={`减小字号 (当前 ${fontSize}px，快捷步进 2px)`}
                aria-label="减小字号"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setShowFontSizeMenu((prev) => !prev)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-primary font-bold hover:bg-surface-3-hover transition cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                title="点击快速选择字号或恢复默认"
              >
                {fontSize}px
              </button>
              <button
                type="button"
                onClick={handleIncreaseFontSize}
                disabled={fontSize >= 32}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-2 hover:text-ink hover:bg-surface-3-hover disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition cursor-pointer"
                title={`放大字号 (当前 ${fontSize}px，快捷步进 2px)`}
                aria-label="放大字号"
              >
                A+
              </button>
            </div>

            {/* Quick Font Size Presets Popover */}
            {showFontSizeMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-surface border border-line rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-serif font-bold text-primary px-1.5 py-1 mb-1 border-b border-line flex items-center justify-between">
                  <span>正文字号调节</span>
                  <span className="font-mono text-xs">{fontSize}px</span>
                </div>
                <div className="space-y-0.5">
                  {FONT_PRESETS.map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => {
                        handleSetFontSize(preset.size);
                        setShowFontSizeMenu(false);
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-serif flex items-center justify-between transition cursor-pointer ${
                        fontSize === preset.size
                          ? 'bg-[#854d0e] text-white font-bold shadow-xs'
                          : 'text-ink hover:bg-surface-3'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`font-mono text-[11px] ${fontSize === preset.size ? 'text-white/90' : 'text-ink-2'}`}>
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
                {fontSize !== 18 && (
                  <div className="mt-1.5 pt-1.5 border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetFontSize(18);
                        setShowFontSizeMenu(false);
                      }}
                      className="w-full py-1 rounded text-[11px] font-serif text-primary hover:bg-surface-3 transition text-center cursor-pointer font-medium"
                    >
                      恢复默认 18px
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Target Word Count & Reading Time Tracker */}
        <EditorWordStatsTracker
          targetWords={targetWords}
          initialCharCount={sessionInitialChars ?? undefined}
          onSelectTargetWords={setCustomTargetWords}
        />

        {/* Right: Actions (Decision Probe, Find/Replace, Focus, Typewriter, ChapterPeek, Scratchpad, Save, Fullscreen) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ml-auto z-10">
          {/* Scene Beats Drawer Toggle (细纲节拍) */}
          <button
            type="button"
            onClick={() => setShowSceneBeatsDrawer(!showSceneBeatsDrawer)}
            className={`p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showSceneBeatsDrawer
                ? 'bg-amber-800 text-amber-50 border-amber-800 shadow-xs'
                : 'bg-surface-2 hover:bg-surface-3-hover text-ink border-line'
            }`}
            title="章节场景与细纲节拍故事板：可视化编排起承转合场景节拍"
          >
            <Clapperboard className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">细纲节拍</span>
            {scenes && scenes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-sans font-bold bg-amber-500/20 text-primary">
                {scenes.length}
              </span>
            )}
          </button>

          {/* Voice Sentinel Drawer Toggle (文风巡检) */}
          <button
            type="button"
            onClick={() => setShowVoiceSentinelDrawer(!showVoiceSentinelDrawer)}
            className={`p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showVoiceSentinelDrawer
                ? 'bg-rose-900 text-rose-50 border-rose-900 shadow-xs'
                : 'bg-surface-2 hover:bg-surface-3-hover text-ink border-line'
            }`}
            title="行文文风监护与防串味巡检：扫描出戏网络梗、翻译腔与文风偏离"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">文风巡检</span>
          </button>

          {/* Inline Decision Probe Toggle (抉择探针) */}
          <button
            type="button"
            onClick={() => {
              if (editor) {
                const { from } = editor.state.selection;
                try {
                  const coords = editor.view.coordsAtPos(from);
                  setCursorCoords({ top: coords.top, left: coords.left });
                  const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1000), from, ' ');
                  setPrecedingText(textBefore);
                  setShowProbeBar(!showProbeBar);
                } catch {}
              }
            }}
            className={`p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showProbeBar
                ? 'bg-amber-800 text-amber-50 border-amber-800 shadow-xs'
                : 'bg-surface-2 hover:bg-surface-3-hover text-ink border-line'
            }`}
            title="行内抉择探针 (快捷键: Ctrl+J)：写到卡壳时探查角色此时会怎么应对与破局"
          >
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">抉择探针</span>
          </button>

          {/* Find & Replace Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowFindReplace(!showFindReplace);
              if (!showFindReplace) setFindReplaceMode('find');
            }}
            className={`p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showFindReplace
                ? 'bg-[#854d0e] text-white border-[#854d0e] shadow-xs'
                : 'bg-surface-2 hover:bg-surface-3-hover text-ink border-line'
            }`}
            title="章内查找与替换 (Ctrl+F / Ctrl+H)"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">查找</span>
          </button>

          {/* 专注双模胶囊 (段落聚焦 + 打字机居中) */}
          <div className="flex items-center p-0.5 rounded-lg border border-line bg-surface-3/60 shrink-0">
            {/* Paragraph Focus Mode Toggle */}
            <button
              type="button"
              onClick={toggleFocusMode}
              className={`p-1 rounded-md text-xs font-serif transition shrink-0 cursor-pointer ${
                isFocusMode
                  ? 'bg-[#854d0e] text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
              }`}
              title="段落聚焦模式 (Ctrl+Alt+F)：淡化非焦点段落，沉浸于单段心流"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Typewriter Scroll Mode Toggle */}
            <button
              type="button"
              onClick={toggleTypewriterMode}
              className={`p-1 rounded-md text-xs font-serif transition shrink-0 cursor-pointer ${
                isTypewriterMode
                  ? 'bg-[#854d0e] text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
              }`}
              title="打字机居中滚动 (Ctrl+Alt+T)：光标保持在垂直视口黄金线"
            >
              <Disc className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ChapterPeek Toggle */}
          <button
            type="button"
            onClick={() => setShowChapterPeek(true)}
            className="p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border shrink-0 whitespace-nowrap cursor-pointer bg-surface-2 hover:bg-surface-3-hover text-ink border-line"
            title="快捷偷看前文、章节目录与断章结尾 (无需跳出当前正文)"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">章节速览</span>
          </button>

          {/* Scratchpad Toggle */}
          <button
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`p-1.5 3xl:px-2.5 3xl:py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showScratchpad
                ? 'bg-[#854d0e] text-[#fdfbf7] border-[#854d0e] shadow-xs'
                : 'bg-surface-2 hover:bg-surface-3-hover text-ink border-line'
            }`}
            title="展开/折叠灵感随手记便签"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden 3xl:inline whitespace-nowrap">灵感便签</span>
          </button>

          <EditorSaveButton onSave={handleManualSave} />

          {isFullScreen ? (
            <button
              onClick={() => setIsFullScreen(false)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-serif font-semibold text-xs flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer group"
              title="退出全屏专注模式 (Esc / 点击关闭)"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>退出全屏 (Esc)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-1.5 rounded-lg hover:bg-surface-3-hover text-ink-2 hover:text-ink transition shrink-0 cursor-pointer"
              title="全屏专注写作模式"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* 全屏模式下显示窗口控制按钮，确保关闭/最大化/最小化始终可达 */}
          {isFullScreen && <WindowControls />}
        </div>
      </div>

      {/* In-chapter Find & Replace Floating Bar */}
      <EditorFindReplaceBar
        editor={editor}
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        initialMode={findReplaceMode}
      />

      {/* Main Workspace (Editor Canvas + Optional Scratchpad Drawer) */}
      <div className={`flex-1 flex overflow-hidden transition-colors duration-300 ${PAPER_THEMES[paperTheme].canvasClass}`}>
        {/* Editor Content Area (Physical Paper Sheet Layout) */}
        <div
          ref={editorScrollContainerRef}
          className={`flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-6 sm:py-8 ${
            isTypewriterMode ? 'pb-[45vh]' : ''
          }`}
        >
          <div
            className={`max-w-3xl mx-auto p-5 sm:p-8 md:p-12 rounded-2xl transition-all duration-300 relative ${PAPER_THEMES[paperTheme].sheetClass}`}
            style={{
              '--editor-text-color': PAPER_THEMES[paperTheme].variables.textColor,
              '--editor-heading-color': PAPER_THEMES[paperTheme].variables.headingColor,
              '--editor-accent-color': PAPER_THEMES[paperTheme].variables.accentColor,
              '--editor-quote-color': PAPER_THEMES[paperTheme].variables.quoteColor,
              '--editor-quote-bg': PAPER_THEMES[paperTheme].variables.quoteBg,
              '--editor-border-color': PAPER_THEMES[paperTheme].variables.borderColor,
              '--paper-ruled-color': PAPER_THEMES[paperTheme].variables.ruledColor,
              '--editor-seal-border': PAPER_THEMES[paperTheme].variables.sealBorder,
              '--editor-seal-color': PAPER_THEMES[paperTheme].variables.sealColor,
              '--editor-seal-bg': PAPER_THEMES[paperTheme].variables.sealBg,
            } as React.CSSProperties}
          >
            {/* Top Right Tactile Watermark Pill */}
            <div className="absolute top-4 right-6 flex items-center gap-2 select-none pointer-events-none opacity-60">
              <span
                className="text-[10px] font-serif tracking-widest uppercase"
                style={{ color: PAPER_THEMES[paperTheme].variables.quoteColor }}
              >
                {PAPER_THEMES[paperTheme].desc}
              </span>
            </div>

            {/* Chapter Title Banner */}
            <div
              className="mb-8 pb-5 border-b transition-colors duration-200"
              style={{ borderColor: PAPER_THEMES[paperTheme].variables.borderColor }}
            >
              <div
                className="text-xs font-bold tracking-wider uppercase mb-2 flex items-center gap-2 font-mono transition-colors duration-200"
                style={{ color: PAPER_THEMES[paperTheme].variables.accentColor }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PAPER_THEMES[paperTheme].variables.accentColor }}
                />
                第 {activeChapter.chapter_number} 章
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={titleInputValue}
                    onChange={(e) => setTitleInputValue(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full text-2xl md:text-3xl font-bold tracking-tight leading-snug font-serif bg-transparent border-b-2 focus:outline-none transition-colors duration-200 px-1 py-0.5 rounded"
                    style={{
                      color: PAPER_THEMES[paperTheme].variables.headingColor,
                      borderColor: PAPER_THEMES[paperTheme].variables.accentColor,
                    }}
                    placeholder="输入章节标题..."
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-2.5 py-1 text-xs rounded font-medium bg-amber-800 text-white hover:bg-amber-700 transition shrink-0 cursor-pointer"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="px-2 py-1 text-xs rounded font-medium text-ink-2 hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0 cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div
                  className="group flex items-center justify-between gap-3 cursor-pointer py-1 -my-1 px-1.5 -mx-1.5 rounded-lg hover:bg-amber-800/5 transition"
                  onClick={() => setIsEditingTitle(true)}
                  title="点击直接修改章节标题"
                >
                  <h1
                    className="text-2xl md:text-3xl font-bold tracking-tight leading-snug font-serif transition-colors duration-200"
                    style={{ color: PAPER_THEMES[paperTheme].variables.headingColor }}
                  >
                    {activeChapter.title}
                  </h1>
                  <span
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2 py-1 rounded transition shrink-0"
                    style={{
                      color: PAPER_THEMES[paperTheme].variables.accentColor,
                      backgroundColor: PAPER_THEMES[paperTheme].variables.quoteBg,
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="font-sans text-[11px]">重命名</span>
                  </span>
                </div>
              )}
            </div>

            {/* Tiptap Editor Surface */}
            <div
              className={`min-h-[540px] editor-surface transition-colors duration-200 ${
                showRuledLines ? 'paper-ruled-active' : ''
              } ${isFocusMode ? 'paragraph-focus-active' : ''}`}
              style={{
                '--editor-font-size': `${fontSize}px`,
                '--editor-line-height': fontSize >= 24 ? '2.25' : fontSize <= 14 ? '1.9' : '2.15',
                '--editor-text-color': PAPER_THEMES[paperTheme].variables.textColor,
                '--editor-heading-color': PAPER_THEMES[paperTheme].variables.headingColor,
                '--editor-accent-color': PAPER_THEMES[paperTheme].variables.accentColor,
                '--editor-quote-color': PAPER_THEMES[paperTheme].variables.quoteColor,
                '--editor-quote-bg': PAPER_THEMES[paperTheme].variables.quoteBg,
                '--editor-border-color': PAPER_THEMES[paperTheme].variables.borderColor,
                '--paper-ruled-color': PAPER_THEMES[paperTheme].variables.ruledColor,
              } as React.CSSProperties}
            >
              <EditorContent editor={editor} onMouseOver={handleEditorMouseOver} />
              <FloatingSelectionMenu editor={editor} />

              {/* Inline @ Mention Popover */}
              {mentionQuery !== null && (
                <EditorMentionPopover
                  query={mentionQuery}
                  characters={novelCharacters}
                  worldRules={novelWorldRules}
                  position={mentionCoords}
                  onSelect={handleSelectMention}
                  onClose={() => setMentionQuery(null)}
                  onInsertText={handleInsertTextAtCursor}
                />
              )}

              {/* Hover Entity Card */}
              {hoverEntity && (
                <div
                  style={{
                    position: 'fixed',
                    top: `${Math.min(window.innerHeight - 340, hoverEntity.coords.top + 20)}px`,
                    left: `${Math.min(window.innerWidth - 400, Math.max(16, hoverEntity.coords.left))}px`,
                  }}
                  className="z-50"
                >
                  <EntityHoverCard
                    entityType={hoverEntity.type}
                    character={hoverEntity.character}
                    worldRule={hoverEntity.worldRule}
                    onInsertText={handleInsertTextAtCursor}
                    onClose={() => setHoverEntity(null)}
                  />
                </div>
              )}

              {/* Inline Cursor Breakout Bar (抉择探针) */}
              <InlineCursorBreakoutBar
                isOpen={showProbeBar}
                onOpenChange={setShowProbeBar}
                cursorCoords={cursorCoords}
                precedingText={precedingText}
                characters={novelCharacters}
                activeNovel={activeNovel}
                onInsertText={handleInsertTextAtCursor}
              />
            </div>

            {/* Paragraph Focus Mode Dynamic Scoped Styles */}
            <style>{`
              .paragraph-focus-active .ProseMirror > *:not(:hover):not(.has-focus) {
                opacity: 0.35;
                transition: opacity 0.2s ease, filter 0.2s ease;
              }
              .paragraph-focus-active .ProseMirror > *:hover,
              .paragraph-focus-active .ProseMirror > *.has-focus {
                opacity: 1;
                transition: opacity 0.2s ease, filter 0.2s ease;
              }
            `}</style>

            {/* Physical Manuscript Bottom Seal Stamp */}
            <div
              className="mt-14 pt-6 border-t flex items-center justify-between opacity-85 select-none pointer-events-none transition-colors duration-200"
              style={{ borderColor: PAPER_THEMES[paperTheme].variables.borderColor }}
            >
              <div
                className="flex items-center gap-2 text-xs font-serif"
                style={{ color: PAPER_THEMES[paperTheme].variables.quoteColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PAPER_THEMES[paperTheme].variables.accentColor }}
                />
                <span>《{activeNovel.title}》 · 第 {activeChapter.chapter_number} 章原稿</span>
              </div>
              <div
                className="px-2.5 py-1 rounded text-[11px] font-serif font-bold tracking-widest border shadow-xs"
                style={{
                  borderColor: PAPER_THEMES[paperTheme].variables.sealBorder,
                  color: PAPER_THEMES[paperTheme].variables.sealColor,
                  backgroundColor: PAPER_THEMES[paperTheme].variables.sealBg,
                }}
              >
                {PAPER_THEMES[paperTheme].seal}
              </div>
            </div>

            {/* 全书伏笔与防吃书实时监护栏 */}
            <div
              className="mt-6 pt-4 border-t flex items-center justify-between gap-3 select-none transition-colors duration-200 flex-wrap"
              style={{ borderColor: PAPER_THEMES[paperTheme].variables.borderColor }}
            >
              <ContinuityGuardian
                chapterId={activeChapter.id}
                chapterText={editor ? editor.getText() : activeChapter.content || ''}
                novelId={activeNovel.id}
                characters={novelCharacters}
                worldRules={novelWorldRules}
                plotThreads={novelPlotThreads}
              />

              <div
                className="text-[11px] font-serif flex items-center gap-1.5 opacity-75"
                style={{ color: PAPER_THEMES[paperTheme].variables.quoteColor }}
              >
                <span>正文输入</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] font-bold">@角色名</kbd>
                <span>调阅立绘软肋 · 光标处</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] font-bold">Ctrl+J</kbd>
                <span>呼出抉择探针</span>
              </div>
            </div>

            {/* 章节快速穿梭导航栏 (Paging Bar) */}
            <div
              className="mt-6 pt-5 border-t flex items-center justify-between gap-2 sm:gap-3 select-none transition-colors duration-200 flex-wrap sm:flex-nowrap min-w-0"
              style={{ borderColor: PAPER_THEMES[paperTheme].variables.borderColor }}
            >
              {/* Prev Chapter */}
              {prevChapter ? (
                <button
                  type="button"
                  onClick={() => handleSwitchChapter(prevChapter)}
                  className="group px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-serif transition cursor-pointer hover:shadow-xs active:scale-95 min-w-0 flex-1 sm:flex-initial max-w-[48%] sm:max-w-none"
                  style={{
                    borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
                    color: PAPER_THEMES[paperTheme].variables.textColor,
                    backgroundColor: PAPER_THEMES[paperTheme].variables.quoteBg,
                  }}
                  title={`翻至上一章：第 ${prevChapter.chapter_number} 章 《${prevChapter.title}》 (Alt+[)`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[10px] opacity-60 font-mono whitespace-nowrap">上一章 (Alt+[)</span>
                    <span className="font-bold truncate max-w-[120px] sm:max-w-[190px]">
                      第 {prevChapter.chapter_number} 章 {prevChapter.title}
                    </span>
                  </div>
                </button>
              ) : (
                <div
                  className="px-3 py-1.5 rounded-xl border border-dashed opacity-40 text-xs font-serif flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial justify-center sm:justify-start"
                  style={{ borderColor: PAPER_THEMES[paperTheme].variables.borderColor }}
                >
                  <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">已是第一章</span>
                </div>
              )}

              {/* Center: Chapter Peek Drawer shortcut */}
              <button
                type="button"
                onClick={() => setShowChapterPeek(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-serif transition cursor-pointer hover:shadow-xs shrink-0 whitespace-nowrap"
                style={{
                  borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
                  color: PAPER_THEMES[paperTheme].variables.accentColor,
                  backgroundColor: PAPER_THEMES[paperTheme].variables.quoteBg,
                }}
                title="打开全书目录速览"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>全书目录速览</span>
              </button>

              {/* Next Chapter or Create Next */}
              {nextChapter ? (
                <button
                  type="button"
                  onClick={() => handleSwitchChapter(nextChapter)}
                  className="group px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-serif transition cursor-pointer hover:shadow-xs active:scale-95 text-right min-w-0 flex-1 sm:flex-initial max-w-[48%] sm:max-w-none justify-end"
                  style={{
                    borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
                    color: PAPER_THEMES[paperTheme].variables.textColor,
                    backgroundColor: PAPER_THEMES[paperTheme].variables.quoteBg,
                  }}
                  title={`翻至下一章：第 ${nextChapter.chapter_number} 章 《${nextChapter.title}》 (Alt+])`}
                >
                  <div className="flex flex-col text-right min-w-0">
                    <span className="text-[10px] opacity-60 font-mono whitespace-nowrap">下一章 (Alt+])</span>
                    <span className="font-bold truncate max-w-[120px] sm:max-w-[190px]">
                      第 {nextChapter.chapter_number} 章 {nextChapter.title}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateChapter(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-serif font-medium flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
                  title="当前已是最新章节，点击立即开启新的一章"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>续写下一章</span>
                </button>
              )}
            </div>

            {/* Stream preview box if actively generating */}
            <StreamingPreviewBox paperTheme={paperTheme} fontSize={fontSize} />
          </div>
        </div>

        {/* Scratchpad Slide-in Board */}
        {showScratchpad && (
          <aside
            className="w-72 sm:w-80 max-w-[85%] border-l flex flex-col shrink-0 animate-in slide-in-from-right duration-200 shadow-md z-20"
            style={{
              backgroundColor: paperTheme === 'midnight' ? '#18181f' : paperTheme === 'kraft' ? '#ecdcb9' : paperTheme === 'bamboo' ? '#f0f5ee' : '#f7f2e7',
              borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
            }}
          >
            <div
              className="p-3.5 border-b flex items-center justify-between"
              style={{
                backgroundColor: paperTheme === 'midnight' ? '#141419' : paperTheme === 'kraft' ? '#dfcaa2' : paperTheme === 'bamboo' ? '#e4ece2' : '#efe9dc',
                borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
              }}
            >
              <div
                className="flex items-center gap-2 text-xs font-serif font-bold"
                style={{ color: PAPER_THEMES[paperTheme].variables.accentColor }}
              >
                <Lightbulb className="w-4 h-4" />
                <span>灵感与伏笔备忘便签</span>
              </div>
              <button
                type="button"
                onClick={() => setShowScratchpad(false)}
                className="p-1 rounded opacity-70 hover:opacity-100 transition cursor-pointer"
                style={{ color: PAPER_THEMES[paperTheme].variables.textColor }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <span
                className="text-[11px] font-serif mb-2"
                style={{ color: PAPER_THEMES[paperTheme].variables.quoteColor }}
              >
                随手记下剧情火花、伏笔备忘或读者心绪，自动持久化存储：
              </span>
              <textarea
                value={scratchNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="例如：\n- 下一章让反派在重力井提前埋伏\n- 李观棋的曲率钥匙还有第二重隐藏密码\n- 突出深空环境的压迫感与金属冷感..."
                className="flex-1 w-full border rounded-xl p-3 text-xs focus:outline-hidden resize-none font-serif leading-relaxed shadow-2xs"
                style={{
                  backgroundColor: paperTheme === 'midnight' ? '#202028' : paperTheme === 'kraft' ? '#f5ebd7' : paperTheme === 'bamboo' ? '#fbfdf9' : '#fdfbf7',
                  borderColor: PAPER_THEMES[paperTheme].variables.borderColor,
                  color: PAPER_THEMES[paperTheme].variables.textColor,
                }}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ChapterPeek 章节速览抽屉 */}
      <ChapterPeekDrawer isOpen={showChapterPeek} onClose={() => setShowChapterPeek(false)} />

      {/* SceneBeats 章节细纲节拍抽屉 */}
      <SceneBeatsDrawer
        isOpen={showSceneBeatsDrawer}
        onClose={() => setShowSceneBeatsDrawer(false)}
        characters={novelCharacters}
        onInsertScaffoldToEditor={(scaffoldHtml) => {
          if (editor) {
            editor.commands.insertContent(scaffoldHtml);
          }
        }}
        onFocusSceneInEditor={handleFocusSceneInEditor}
      />

      {/* VoiceSentinel 行文文风监护抽屉 */}
      <VoiceSentinelDrawer
        isOpen={showVoiceSentinelDrawer}
        onClose={() => setShowVoiceSentinelDrawer(false)}
        chapterText={editor ? editor.getText() : activeChapter?.content || ''}
        onReplaceText={handleReplaceTextInEditor}
        onBatchReplaceText={handleBatchReplaceTextInEditor}
      />
    </div>
  );
};

