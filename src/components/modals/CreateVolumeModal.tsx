import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { X, BookOpen } from 'lucide-react';
import { alertDialog } from '@/utils/dialog';

interface Props {
  onClose: () => void;
}

export const CreateVolumeModal: React.FC<Props> = ({ onClose }) => {
  const { createVolume, volumes } = useNovelStore();

  const nextOrder = volumes.length + 1;
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createVolume({
        title: title.trim(),
        summary: summary.trim() || undefined,
        order_index: nextOrder,
      });
      onClose();
    } catch (err) {
      await alertDialog(`创建分卷失败: ${err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-800" />
            <h2 className="text-sm font-serif font-bold text-ink">
              新建分卷 · 第 {nextOrder} 卷
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
              分卷标题 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="例如：初入宗门、深空跃迁、风云突变..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-indigo-800 focus:ring-1 focus:ring-indigo-800"
            />
            <p className="text-[11px] text-ink-2 mt-1">
              无需手动输入“第X卷:”，系统会自动规范组织大纲序号。
            </p>
          </div>

          <div>
            <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
              分卷剧情梗概 / 核心矛盾 (可选)
            </label>
            <textarea
              rows={3}
              placeholder="简述本卷核心剧情主线、关键矛盾发展与收束目标..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg p-2.5 text-xs text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-indigo-800 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-line text-xs font-serif text-ink-2 hover:text-ink hover:bg-surface-2 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-[#fdfbf7] text-xs font-serif font-medium transition shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? '正在创建...' : '确认新建分卷'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
