import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { X, FilePlus } from 'lucide-react';
import { cleanTitlePrefix } from '@/utils/titleFormatter';
import { alertDialog } from '@/utils/dialog';

interface Props {
  onClose: () => void;
  defaultVolumeId?: string;
}

export const CreateChapterModal: React.FC<Props> = ({ onClose, defaultVolumeId }) => {
  const { createChapter, chapters, volumes } = useNovelStore();

  const nextNumber = chapters.length + 1;
  const [title, setTitle] = useState('');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(
    defaultVolumeId || (volumes.length > 0 ? volumes[0].id : '')
  );
  const [initialContent, setInitialContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createChapter({
        title: title.trim(),
        volume_id: selectedVolumeId || undefined,
        initial_content: initialContent.trim()
          ? `<p>${initialContent.trim().replace(/\n+/g, '</p><p>')}</p>`
          : '',
      });
      onClose();
    } catch (err) {
      await alertDialog(`创建章节失败: ${err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-serif font-bold text-ink">
              新建章节 · 第 {nextNumber} 章
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
          {volumes.length > 0 && (
            <div>
              <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
                所属分卷
              </label>
              <select
                value={selectedVolumeId}
                onChange={(e) => setSelectedVolumeId(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]"
              >
                {volumes.map((v) => (
                  <option key={v.id} value={v.id}>
                    第 {v.order_index} 卷: {cleanTitlePrefix(v.title, 'VOLUME') || v.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
              章节标题 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="例如：初见端倪、幽夜异变、剑破苍穹..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]"
            />
          </div>

          <div>
            <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
              初始正文或场景细纲 (可选)
            </label>
            <textarea
              rows={4}
              placeholder="可先输入初始段落或本章核心剧情规划，亦可在创建后使用 AI 辅助编写..."
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg p-2.5 text-xs text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] resize-none"
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
              className="px-4 py-1.5 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium transition shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? '正在创建...' : '创建并进入写作'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
