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
  Minimize2,
  Sparkles,
  AlignLeft,
  Lightbulb,
  Clock,
  Target,
  Check,
  X,
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';

type PaperTheme = 'xuan' | 'bamboo' | 'kraft' | 'midnight';
type FontSize = '16' | '18' | '20';

const PAPER_STYLES: Record<PaperTheme, { bg: string; paper: string; border: string; text: string; shadow: string; label: string }> = {
  xuan: {
    label: '温润宣纸',
    bg: 'bg-[#f4efe6]',
    paper: 'bg-[#fdfbf7]',
    border: 'border-[#ded5c4]',
    text: 'text-[#2b2621]',
    shadow: 'shadow-[0_4px_25px_-5px_rgba(120,90,50,0.08),0_0_0_1px_rgba(215,200,180,0.5)]',
  },
  bamboo: {
    label: '澄心竹纸',
    bg: 'bg-[#f2f4f0]',
    paper: 'bg-[#ffffff]',
    border: 'border-[#dce1d9]',
    text: 'text-[#1c221a]',
    shadow: 'shadow-[0_4px_25px_-5px_rgba(50,80,60,0.06),0_0_0_1px_rgba(200,210,195,0.5)]',
  },
  kraft: {
    label: '复古牛皮',
    bg: 'bg-[#ebe0cb]',
    paper: 'bg-[#f4ebdc]',
    border: 'border-[#cfbf9e]',
    text: 'text-[#261f16]',
    shadow: 'shadow-[0_4px_25px_-5px_rgba(100,70,30,0.12),0_0_0_1px_rgba(190,170,140,0.6)]',
  },
  midnight: {
    label: '水墨夜读',
    bg: 'bg-[#18181b]',
    paper: 'bg-[#222226]',
    border: 'border-[#3f3f46]',
    text: 'text-[#e4e4e7]',
    shadow: 'shadow-[0_4px_25px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(60,60,65,0.8)]',
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
  } = useNovelStore();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [paperTheme, setPaperTheme] = useState<PaperTheme>(() => {
    return (localStorage.getItem('novelforge_paper_theme') as PaperTheme) || 'xuan';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('novelforge_font_size') as FontSize) || '18';
  });
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem(`novelforge_notes_${activeNovel?.id || 'default'}`) || '';
  });
  const [formatSuccess, setFormatSuccess] = useState(false);

  const handleSetPaperTheme = (theme: PaperTheme) => {
    setPaperTheme(theme);
    localStorage.setItem('novelforge_paper_theme', theme);
  };

  const handleSetFontSize = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem('novelforge_font_size', size);
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

  // Handle Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentChapter(true, 'USER_MANUAL_SAVE');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentChapter]);

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
      className={`flex-1 flex flex-col min-w-0 h-[calc(100vh-3.5rem)] transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 bg-[#f4efe6] p-6' : ''
      }`}
    >
      {/* Editor Formatting Floating Toolbar */}
      <div className="h-12 border-b border-[#ded5c4] px-4 md:px-6 flex items-center justify-between bg-[#efe9dc]/95 backdrop-blur-xl select-none shrink-0 z-10 shadow-sm gap-2">
        {/* Left: Text Formatting Controls & Zen Mode Indicator */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {zenMode && (
            <span className="mr-2 px-2 py-0.5 rounded bg-amber-800/10 text-amber-800 border border-amber-800/20 text-[10px] font-serif font-bold">
              禅意专注 (Esc退出)
            </span>
          )}
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] disabled:opacity-25 transition"
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] disabled:opacity-25 transition"
            title="重做 (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1" />

          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition ${
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
            className={`p-1.5 rounded-md transition ${
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
            className={`p-1.5 rounded-md transition ${
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
            className={`p-1.5 rounded-md transition ${
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
            className={`p-1.5 rounded-md transition ${
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
            className="p-1.5 rounded-md hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] transition"
            title="分割线"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1" />

          {/* One-click Formatting */}
          <button
            onClick={handleAutoFormat}
            className="px-2 py-1 rounded-md bg-[#efe9dc] hover:bg-[#e4dcce] text-[#854d0e] border border-[#ded5c4] text-xs font-serif flex items-center gap-1 transition shadow-2xs"
            title="一键文学规范排版：清理空行、全角标点规范化"
          >
            {formatSuccess ? <Check className="w-3.5 h-3.5 text-[#047857]" /> : <AlignLeft className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{formatSuccess ? '排版完成' : '规范排版'}</span>
          </button>

          <div className="w-px h-4 bg-[#ded5c4] mx-1" />

          {/* Paper Theme Selector */}
          <div className="flex items-center gap-0.5 bg-[#e8e0d0] p-0.5 rounded-md border border-[#d5cbb8]">
            {(['xuan', 'bamboo', 'kraft', 'midnight'] as PaperTheme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => handleSetPaperTheme(theme)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-serif transition ${
                  paperTheme === theme
                    ? 'bg-[#854d0e] text-white font-bold shadow-xs'
                    : 'text-[#6b6255] hover:text-[#231f1a]'
                }`}
                title={`切换纸张主题：${PAPER_STYLES[theme].label}`}
              >
                {theme === 'xuan' ? '宣纸' : theme === 'bamboo' ? '竹纸' : theme === 'kraft' ? '牛皮' : '夜读'}
              </button>
            ))}
          </div>

          {/* Font Size Toggle */}
          <div className="flex items-center gap-0.5 bg-[#e8e0d0] p-0.5 rounded-md border border-[#d5cbb8]">
            <button
              onClick={() => handleSetFontSize(fontSize === '20' ? '18' : '16')}
              className="px-1 py-0.5 rounded text-[10px] font-mono text-[#6b6255] hover:text-[#231f1a]"
              title="减小字号"
            >
              A-
            </button>
            <span className="text-[10px] px-1 font-mono text-[#854d0e] font-bold">
              {fontSize}px
            </span>
            <button
              onClick={() => handleSetFontSize(fontSize === '16' ? '18' : '20')}
              className="px-1 py-0.5 rounded text-[10px] font-mono text-[#6b6255] hover:text-[#231f1a]"
              title="放大字号"
            >
              A+
            </button>
          </div>
        </div>

        {/* Center/Right: Target Word Count & Reading Time Tracker */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-serif text-[#685f54] bg-[#f7f2e7] px-3 py-1 rounded-lg border border-[#ded5c4]">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#854d0e]" />
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

          <div className="w-px h-3 bg-[#ded5c4]" />

          <div className="flex items-center gap-1 text-[#786f65]">
            <Clock className="w-3.5 h-3.5 text-[#854d0e]" />
            <span>~{estimatedReadMinutes} 分钟</span>
          </div>
        </div>

        {/* Right: Actions (Scratchpad, Save, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Scratchpad Toggle */}
          <button
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`px-2.5 py-1 rounded-lg text-xs font-serif font-medium flex items-center gap-1.5 transition border ${
              showScratchpad
                ? 'bg-[#854d0e] text-[#fdfbf7] border-[#854d0e] shadow-xs'
                : 'bg-[#efe9dc] hover:bg-[#e4dcce] text-[#2b2621] border-[#ded5c4]'
            }`}
            title="展开/折叠灵感随手记便签"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">灵感便签</span>
          </button>

          <button
            onClick={() => saveCurrentChapter(true, 'USER_MANUAL_SAVE')}
            disabled={saveStatus === 'SAVING'}
            className="px-3 py-1 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium flex items-center gap-1.5 transition shadow-xs active:scale-95 disabled:opacity-40"
            title="保存当前快照 (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存快照</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg hover:bg-[#e4dcce] text-[#685f54] hover:text-[#231f1a] transition"
            title={isFullScreen ? '退出全屏专注模式' : '全屏专注模式'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace (Editor Canvas + Optional Scratchpad Drawer) */}
      <div className={`flex-1 flex overflow-hidden transition-colors duration-200 ${PAPER_STYLES[paperTheme].bg}`}>
        {/* Editor Content Area (Physical Paper Sheet Layout) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8">
          <div className={`max-w-3xl mx-auto p-8 md:p-14 rounded-2xl border transition-colors duration-200 ${PAPER_STYLES[paperTheme].paper} ${PAPER_STYLES[paperTheme].border} ${PAPER_STYLES[paperTheme].text} ${PAPER_STYLES[paperTheme].shadow}`}>
            {/* Chapter Title Banner */}
            <div className={`mb-8 pb-5 border-b ${PAPER_STYLES[paperTheme].border}`}>
              <div className="text-xs font-bold text-amber-800 tracking-wider uppercase mb-2 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-700" />
                第 {activeChapter.chapter_number} 章
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug font-serif">
                {activeChapter.title}
              </h1>
            </div>

            {/* Tiptap Editor Surface */}
            <div className={`min-h-[540px] ${fontSize === '16' ? 'text-base leading-relaxed' : fontSize === '20' ? 'text-xl leading-loose' : 'text-lg leading-relaxed'}`}>
              <EditorContent editor={editor} />
            </div>

            {/* Stream preview box if actively generating */}
            {isGenerating && streamText && (
              <div className="mt-8 p-6 rounded-xl border border-amber-800/30 bg-[#f9f4ea] shadow-md">
                <div className="flex items-center gap-2.5 text-xs text-amber-800 font-semibold mb-3">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
                  <span>正文作家 Agent 正在实时流式创作中...</span>
                </div>
                <p className="text-[#2b2621] text-base whitespace-pre-wrap leading-relaxed font-serif">
                  {streamText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scratchpad Slide-in Board */}
        {showScratchpad && (
          <aside className="w-72 md:w-80 border-l border-[#ded5c4] bg-[#f7f2e7] flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-[#ded5c4] flex items-center justify-between bg-[#efe9dc]">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#854d0e]">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>灵感与伏笔备忘便签</span>
              </div>
              <button
                onClick={() => setShowScratchpad(false)}
                className="p-1 rounded text-[#786f65] hover:text-[#2b2621]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <span className="text-[11px] text-[#786f65] font-serif mb-2">
                随手记下剧情火花、伏笔备忘或读者心绪，自动持久化存储：
              </span>
              <textarea
                value={scratchNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="例如：\n- 下一章让反派在重力井提前埋伏\n- 李观棋的曲率钥匙还有第二重隐藏密码\n- 突出深空环境的压迫感与金属冷感..."
                className="flex-1 w-full bg-[#fdfbf7] border border-[#ded5c4] rounded-xl p-3 text-xs text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] resize-none font-serif leading-relaxed shadow-2xs"
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
