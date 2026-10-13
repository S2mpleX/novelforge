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

  if (!activeNovel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 select-none p-6">
        <Sparkles className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-400 mb-1">欢迎使用 NovelForge AI</h3>
        <p className="text-xs text-slate-500 mb-4 text-center max-w-md">
          请在左侧栏选择或创建小说项目，开启本地优先、长期记忆驱动的专业长篇连载创作。
        </p>
      </div>
    );
  }

  if (!activeChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 select-none p-6">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
          <Quote className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">未选中章节</h3>
        <p className="text-xs text-slate-500 mb-3">请从左侧目录选择一个章节，或点击新建章节开始写作。</p>
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
