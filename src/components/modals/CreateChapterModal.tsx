import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { X, FilePlus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CreateChapterModal: React.FC<Props> = ({ onClose }) => {
  const { createChapter, chapters } = useNovelStore();

  const nextNumber = chapters.length + 1;
  const [title, setTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createChapter({
        title: title.trim(),
        initial_content: initialContent.trim()
          ? `<p>${initialContent.trim().replace(/\n+/g, '</p><p>')}</p>`
          : '',
      });
      onClose();
    } catch (err) {
      alert(`创建章节失败: ${err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">
              新建章节 (第 {nextNumber} 章)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              章节标题 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="例如：初见端倪、幽夜异变、剑破苍穹..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              初始正文或场景细纲 (可选)
            </label>
            <textarea
              rows={4}
              placeholder="可先输入初始段落或本章核心剧情规划，亦可在创建后使用 AI 辅助编写..."
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-40"
            >
              {isSubmitting ? '正在创建...' : '创建并进入写作'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
