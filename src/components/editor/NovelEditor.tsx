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
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 overflow-y-auto bg-[#090c10]/60">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              NovelForge AI <span className="text-indigo-400 text-sm font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">V2.0</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
              本地优先 · 多模型接入 · 多 Agent 协作 · 长期记忆驱动的专业长篇创作生产系统
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06] backdrop-blur-md space-y-1.5 hover:border-indigo-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">L4</div>
              <h4 className="text-xs font-semibold text-slate-200">五层长期记忆</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                分层工作记忆与 FTS5 事实检索，跨越数百万字严控剧情前后矛盾。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06] backdrop-blur-md space-y-1.5 hover:border-purple-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">AI</div>
              <h4 className="text-xs font-semibold text-slate-200">多 Agent 智囊团</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                主编、编剧、作家、审稿各司其职，装载 Humanizer 文学润色体系。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06] backdrop-blur-md space-y-1.5 hover:border-emerald-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">DB</div>
              <h4 className="text-xs font-semibold text-slate-200">本地 SQLite 离线</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                WAL 高性能存储，不可逆正文版本快照与单文件 HTML5 电子书发布。
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowCreateNovel(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              立即创建新作品
            </button>
            <button
              onClick={() => loadNovels()}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-white/[0.08]"
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
      <div className="flex-1 flex flex-col items-center justify-center select-none p-8 bg-[#090c10]/60">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Quote className="w-6 h-6" />
          </div>

          <div>
            <div className="text-xs text-indigo-400 font-semibold mb-1">
              《{activeNovel.title}》
            </div>
            <h3 className="text-base font-bold text-slate-100">未选中任何章节</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              请从左侧目录选择已有章节继续创作，或点击下方按钮开启新的一章。
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowCreateChapter(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95"
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
      className={`flex-1 flex flex-col bg-[#0b0e14]/50 min-w-0 h-[calc(100vh-3.5rem)] transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 bg-[#090c10] p-6' : ''
      }`}
    >
      {/* Editor Formatting Floating Toolbar */}
      <div className="h-12 border-b border-white/[0.08] px-6 flex items-center justify-between bg-[#0d1117]/85 backdrop-blur-xl select-none shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-25 transition"
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-25 transition"
            title="重做 (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-1.5" />

          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition ${
              editor?.isActive('bold')
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="加粗"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition ${
              editor?.isActive('italic')
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="斜体"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-1.5" />

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md transition ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="一级标题"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-md transition ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="二级标题"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-1.5" />

          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition ${
              editor?.isActive('blockquote')
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="引述"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition"
            title="分割线"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => saveCurrentChapter(true, 'USER_MANUAL_SAVE')}
            disabled={saveStatus === 'SAVING'}
            className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-white/[0.08] shadow-sm active:scale-95"
            title="保存当前快照 (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            保存快照
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition"
            title={isFullScreen ? '退出全屏专注模式' : '全屏专注模式'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Chapter Title Banner */}
          <div className="mb-8 pb-5 border-b border-white/[0.08]">
            <div className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              第 {activeChapter.chapter_number} 章
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight leading-snug">
              {activeChapter.title}
            </h1>
          </div>

          {/* Tiptap Editor Surface */}
          <div className="min-h-[520px]">
            <EditorContent editor={editor} />
          </div>

          {/* Stream preview box if actively generating */}
          {isGenerating && streamText && (
            <div className="mt-8 p-5 rounded-2xl border border-indigo-500/40 bg-indigo-950/25 backdrop-blur-xl shadow-xl shadow-indigo-950/50">
              <div className="flex items-center gap-2.5 text-xs text-indigo-400 font-semibold mb-3">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                <span>正文作家 Agent 正在实时流式创作中...</span>
              </div>
              <p className="text-slate-200 text-base whitespace-pre-wrap leading-relaxed font-serif">
                {streamText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
