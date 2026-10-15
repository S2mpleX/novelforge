import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNovelStore } from '@/stores/useNovelStore';
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
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';
import { WindowControls } from '@/components/layout/WindowControls';
import { FloatingSelectionMenu } from './FloatingSelectionMenu';

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

export const NovelEditor: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
    saveStatus,
    streamText,
    isGenerating,
    zenMode,
    toggleZenMode,
    themeMode,
    setThemeMode,
  } = useNovelStore();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
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
    // If user clicked midnight, harmonize app into dark mode
    if (theme === 'midnight' && themeMode !== 'dark') {
      setThemeMode('dark');
    } else if (theme !== 'midnight' && themeMode === 'dark') {
      // If user chose a daylight paper, harmonize app into light mode
      setThemeMode('light');
    }
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

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: editorContent || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[500px] leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateEditorContent(html);

      // Debounce auto-save (800ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveCurrentChapter(false, 'USER_EDIT');
      }, 800);
    },
  });

  // Sync editor content when chapter changes
  useEffect(() => {
    if (editor && editorContent !== editor.getHTML()) {
      editor.commands.setContent(editorContent || '', { emitUpdate: false });
    }
  }, [activeChapter?.id]);

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

  // Handle Ctrl+S keyboard shortcut & Escape to exit editor fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentChapter(true, 'USER_MANUAL_SAVE');
      }
      // Escape exits editor's own fullscreen mode
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentChapter, isFullScreen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const { loadNovels } = useNovelStore();

  // One-click Literature Format: clean extra blank paragraphs and fix punctuation
  const handleAutoFormat = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHtml;

    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach((p) => {
      let text = p.innerText.trim();
      if (!text) {
        p.remove();
        return;
      }
      // Replace English punctuations with Chinese standard
      text = text
        .replace(/,/g, '，')
        .replace(/\?/g, '？')
        .replace(/!/g, '！')
        .replace(/:/g, '：')
        .replace(/;/g, '；');
      p.innerText = text;
    });

    const cleanedHtml = tempDiv.innerHTML;
    editor.commands.setContent(cleanedHtml);
    updateEditorContent(cleanedHtml);
    saveCurrentChapter(true, 'AUTO_FORMAT');
    setFormatSuccess(true);
    setTimeout(() => setFormatSuccess(false), 2000);
  };

  // Character stats & calculations
  const charCount = editorContent.replace(/\s+/g, '').length;
  const targetWords = activeNovel?.chapter_target_length || 3000;
  const targetPercent = Math.min(150, Math.round((charCount / Math.max(1, targetWords)) * 100));
  const estimatedReadMinutes = (charCount / 400).toFixed(1);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 overflow-y-auto bg-[#f4efe6]">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-orange-700 shadow-lg shadow-amber-900/15 border border-amber-600/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1f1d1a] tracking-tight font-serif">
              NovelForge AI <span className="text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-800/10 border border-amber-800/20 align-middle">V2.0</span>
            </h2>
            <p className="text-sm text-[#786f65] mt-2 max-w-lg mx-auto leading-relaxed">
              本地优先 · 多模型接入 · 多 Agent 协作 · 长期记忆驱动的专业长篇创作生产系统
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-amber-800/10 flex items-center justify-center text-amber-800 font-bold text-xs font-mono">L4</div>
              <h4 className="text-xs font-semibold text-[#2b2621]">五层长期记忆</h4>
              <p className="text-[11px] text-[#786f65] leading-normal">
                分层工作记忆与 FTS5 事实检索，跨越数百万字严控剧情前后矛盾。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-orange-800/10 flex items-center justify-center text-orange-800 font-bold text-xs font-mono">AI</div>
              <h4 className="text-xs font-semibold text-[#2b2621]">多 Agent 智囊团</h4>
              <p className="text-[11px] text-[#786f65] leading-normal">
                主编、编剧、作家、审稿各司其职，装载 Humanizer 文学润色体系。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-sm space-y-1.5 hover:border-amber-800/40 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-800/10 flex items-center justify-center text-emerald-800 font-bold text-xs font-mono">DB</div>
              <h4 className="text-xs font-semibold text-[#2b2621]">本地 SQLite 离线</h4>
              <p className="text-[11px] text-[#786f65] leading-normal">
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
              className="px-4 py-2.5 rounded-xl bg-[#e8dfcf] hover:bg-[#dfd4c0] text-[#2b2621] text-xs font-medium transition border border-[#d5c9b4]"
            >
              刷新作品列表
            </button>
          </div>
        </div>

        {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
      </div>
    );
  }

  if (!activeChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 bg-[#f4efe6]">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-[#fdfbf7] border border-[#ded5c4] shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-800/10 border border-amber-800/20 flex items-center justify-center mx-auto text-amber-800">
            <Quote className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs text-amber-800 font-semibold mb-1">
              《{activeNovel.title}》
            </div>
            <h3 className="text-base font-bold text-[#1f1d1a] font-serif">未选中任何章节</h3>
            <p className="text-xs text-[#786f65] mt-1.5 leading-relaxed">
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

        {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 w-full h-full transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 bg-[#f4efe6] p-6' : ''
      }`}
    >
      {/* 全屏模式下右上角固定常驻退出/关闭控制器（无论工具栏横向滚动或缩放，始终绝对置顶于屏幕右上角，绝对显眼） */}
      {isFullScreen && (
        <div className="fixed top-3 right-4 z-[999] flex items-center gap-2 bg-[#efe9dc]/95 dark:bg-stone-800/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#ded5c4] dark:border-stone-700 shadow-xl select-none animate-in fade-in zoom-in-95 duration-150">
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
      <div className="h-12 border-b border-[#ded5c4] px-2.5 md:px-4 flex items-center justify-between bg-[#efe9dc]/95 backdrop-blur-xl select-none shrink-0 z-10 shadow-sm gap-1.5 overflow-hidden min-w-0">
        {/* Left: Text Formatting Controls & Zen Mode Indicator */}
        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {zenMode && (
            <button
              type="button"
              onClick={toggleZenMode}
              className="mr-2 px-2 py-0.5 rounded bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/20 text-[10px] font-serif font-bold shrink-0 whitespace-nowrap flex items-center gap-1 transition cursor-pointer"
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
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] disabled:opacity-25 transition shrink-0 cursor-pointer"
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] disabled:opacity-25 transition shrink-0 cursor-pointer"
            title="重做 (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('bold')
                ? 'bg-amber-800/15 text-amber-900 border border-amber-800/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="加粗"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('italic')
                ? 'bg-amber-800/15 text-amber-900 border border-amber-800/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="斜体"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-amber-800/15 text-amber-900 border border-amber-800/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="一级标题"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-amber-800/15 text-amber-900 border border-amber-800/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="二级标题"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition shrink-0 cursor-pointer ${
              editor?.isActive('blockquote')
                ? 'bg-amber-800/15 text-amber-900 border border-amber-800/30 shadow-xs'
                : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce]'
            }`}
            title="引述"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] transition shrink-0 cursor-pointer"
            title="分割线"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          {/* One-click Formatting */}
          <button
            onClick={handleAutoFormat}
            className="px-2 py-1 rounded-md bg-[#efe9dc] hover:bg-[#e4dcce] text-[#854d0e] border border-[#ded5c4] text-xs font-serif flex items-center gap-1 transition shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="一键文学规范排版：清理空行、全角标点规范化"
          >
            {formatSuccess ? <Check className="w-3.5 h-3.5 text-[#047857]" /> : <AlignLeft className="w-3.5 h-3.5" />}
            <span className="hidden md:inline whitespace-nowrap">{formatSuccess ? '排版完成' : '规范排版'}</span>
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1 shrink-0" />

          {/* Paper Theme Selector & Ruled Lines Toggle */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-0.5 bg-[#e8e0d0] p-0.5 rounded-md border border-[#d5cbb8] shadow-2xs shrink-0">
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
                        : 'text-[#6b6255] hover:text-[#231f1a] hover:bg-[#dfd5c4]'
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
                  ? 'bg-[#854d0e]/15 text-[#854d0e] border-[#854d0e]/30 font-bold shadow-2xs'
                  : 'bg-[#efe9dc] hover:bg-[#e4dcce] text-[#6b6255] border-[#ded5c4]'
              }`}
              title="开启/关闭信笺稿纸行线（开启后呈现真实原稿信笺纸横格）"
            >
              <AlignJustify className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">信笺横线</span>
            </button>
          </div>

          {/* Font Size Adjuster & Quick Presets */}
          <div ref={fontSizeMenuRef} className="relative flex items-center shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-0.5 bg-[#e8e0d0] p-0.5 rounded-md border border-[#d5cbb8] shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handleDecreaseFontSize}
                disabled={fontSize <= 12}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#6b6255] hover:text-[#231f1a] hover:bg-[#dfd5c4] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition cursor-pointer"
                title={`减小字号 (当前 ${fontSize}px，快捷步进 2px)`}
                aria-label="减小字号"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setShowFontSizeMenu((prev) => !prev)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#854d0e] font-bold hover:bg-[#dfd5c4] transition cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                title="点击快速选择字号或恢复默认"
              >
                {fontSize}px
              </button>
              <button
                type="button"
                onClick={handleIncreaseFontSize}
                disabled={fontSize >= 32}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#6b6255] hover:text-[#231f1a] hover:bg-[#dfd5c4] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition cursor-pointer"
                title={`放大字号 (当前 ${fontSize}px，快捷步进 2px)`}
                aria-label="放大字号"
              >
                A+
              </button>
            </div>

            {/* Quick Font Size Presets Popover */}
            {showFontSizeMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-[#fdfbf7] border border-[#ded5c4] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-serif font-bold text-[#854d0e] px-1.5 py-1 mb-1 border-b border-[#eee6d8] flex items-center justify-between">
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
                          : 'text-[#3d362e] hover:bg-[#f2ece0]'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`font-mono text-[11px] ${fontSize === preset.size ? 'text-white/90' : 'text-[#8c8273]'}`}>
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
                {fontSize !== 18 && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#eee6d8]">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetFontSize(18);
                        setShowFontSizeMenu(false);
                      }}
                      className="w-full py-1 rounded text-[11px] font-serif text-[#854d0e] hover:bg-[#f2ece0] transition text-center cursor-pointer font-medium"
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
        <div className="hidden 2xl:flex items-center gap-3 text-xs font-serif text-[#685f54] bg-[#f7f2e7] px-3 py-1 rounded-lg border border-[#ded5c4] shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <Target className="w-3.5 h-3.5 text-[#854d0e] shrink-0" />
            <span>目标:</span>
            <span className="font-bold text-[#2b2621]">
              {charCount} / {targetWords} 字
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              targetPercent >= 100
                ? 'bg-[#047857]/10 text-[#047857] border border-[#047857]/20'
                : 'bg-[#854d0e]/10 text-[#854d0e] border border-[#854d0e]/20'
            }`}>
              {targetPercent}%
            </span>
          </div>

          <div className="w-px h-3 bg-[#ded5c4] shrink-0" />

          <div className="flex items-center gap-1 text-[#786f65] shrink-0 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-[#854d0e] shrink-0" />
            <span>~{estimatedReadMinutes} 分钟</span>
          </div>
        </div>

        {/* Right: Actions (Scratchpad, Save, Fullscreen/放大) */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-auto z-10">
          {/* Scratchpad Toggle */}
          <button
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`px-2.5 py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border shrink-0 whitespace-nowrap cursor-pointer ${
              showScratchpad
                ? 'bg-[#854d0e] text-[#fdfbf7] border-[#854d0e] shadow-xs'
                : 'bg-[#efe9dc] hover:bg-[#e4dcce] text-[#2b2621] border-[#ded5c4]'
            }`}
            title="展开/折叠灵感随手记便签"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">灵感便签</span>
          </button>

          <button
            onClick={() => saveCurrentChapter(true, 'USER_MANUAL_SAVE')}
            disabled={saveStatus === 'SAVING'}
            className="px-3 py-1 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium flex items-center gap-1.5 transition shadow-xs active:scale-95 disabled:opacity-40 shrink-0 whitespace-nowrap cursor-pointer"
            title="保存当前快照 (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">保存快照</span>
          </button>

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
              className="p-1.5 rounded-lg hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] transition shrink-0 cursor-pointer"
              title="全屏专注写作模式"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* 全屏模式下显示窗口控制按钮，确保关闭/最大化/最小化始终可达 */}
          {isFullScreen && <WindowControls />}
        </div>
      </div>

      {/* Main Workspace (Editor Canvas + Optional Scratchpad Drawer) */}
      <div className={`flex-1 flex overflow-hidden transition-colors duration-300 ${PAPER_THEMES[paperTheme].canvasClass}`}>
        {/* Editor Content Area (Physical Paper Sheet Layout) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8">
          <div
            className={`max-w-3xl mx-auto p-8 md:p-14 rounded-2xl transition-all duration-300 relative ${PAPER_THEMES[paperTheme].sheetClass}`}
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
              <h1
                className="text-2xl md:text-3xl font-bold tracking-tight leading-snug font-serif transition-colors duration-200"
                style={{ color: PAPER_THEMES[paperTheme].variables.headingColor }}
              >
                {activeChapter.title}
              </h1>
            </div>

            {/* Tiptap Editor Surface */}
            <div
              className={`min-h-[540px] editor-surface transition-colors duration-200 ${showRuledLines ? 'paper-ruled-active' : ''}`}
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
              <EditorContent editor={editor} />
              <FloatingSelectionMenu editor={editor} />
            </div>

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

            {/* Stream preview box if actively generating */}
            {isGenerating && streamText && (
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
            )}
          </div>
        </div>

        {/* Scratchpad Slide-in Board */}
        {showScratchpad && (
          <aside
            className="w-72 md:w-80 border-l flex flex-col shrink-0 animate-in slide-in-from-right duration-200 shadow-md"
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
    </div>
  );
};
