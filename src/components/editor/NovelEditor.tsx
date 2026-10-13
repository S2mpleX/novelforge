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
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';

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
  } = useNovelStore();

  const [isFullScreen, setIsFullScreen] = useState(false);
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
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-200 text-lg leading-relaxed',
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
      className={`flex-1 flex flex-col bg-[#f4efe6] min-w-0 h-[calc(100vh-3.5rem)] transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 bg-[#f4efe6] p-6' : ''
      }`}
    >
      {/* Editor Formatting Floating Toolbar */}
      <div className="h-12 border-b border-[#ded5c4] px-6 flex items-center justify-between bg-[#efe9dc]/95 backdrop-blur-xl select-none shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-1">
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

          <div className="w-px h-4 bg-[#ded5c4] mx-1.5" />

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

          <div className="w-px h-4 bg-[#ded5c4] mx-1.5" />

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

          <div className="w-px h-4 bg-[#ded5c4] mx-1.5" />

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
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => saveCurrentChapter(true, 'USER_MANUAL_SAVE')}
            disabled={saveStatus === 'SAVING'}
            className="px-3 py-1 rounded-lg bg-[#e8dfcf] hover:bg-[#dfd4c0] text-[#2b2621] text-xs font-medium flex items-center gap-1.5 transition border border-[#d5c9b4] shadow-xs active:scale-95"
            title="保存当前快照 (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-amber-800" />
            保存快照
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

      {/* Editor Content Area (Physical Paper Sheet Layout) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8">
        <div className="max-w-3xl mx-auto bg-[#fdfbf7] p-8 md:p-14 rounded-2xl border border-[#ded5c4] shadow-[0_4px_25px_-5px_rgba(120,90,50,0.08),0_0_0_1px_rgba(215,200,180,0.5)]">
          {/* Chapter Title Banner */}
          <div className="mb-8 pb-5 border-b border-[#ded5c4]">
            <div className="text-xs font-bold text-amber-800 tracking-wider uppercase mb-2 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-700" />
              第 {activeChapter.chapter_number} 章
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f1d1a] tracking-tight leading-snug font-serif">
              {activeChapter.title}
            </h1>
          </div>

          {/* Tiptap Editor Surface */}
          <div className="min-h-[540px]">
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
    </div>
  );
};
