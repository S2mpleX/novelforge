import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { X, BookPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const GENRE_OPTIONS = [
  '玄幻', '仙侠', '奇幻', '科幻', '都市', '悬疑', '推理', '历史',
  '架空历史', '轻小说', '恋爱', '末世', '群像', '日常', '治愈'
];

const STYLE_OPTIONS = [
  '通俗流畅、生动细腻',
  '硬派沉稳、考据扎实',
  '幽默轻松、快节奏爽感',
  '古典典雅、文笔优美',
  '暗黑冷峻、紧迫悬疑',
];

export const CreateNovelModal: React.FC<Props> = ({ onClose }) => {
  const { createNovel } = useNovelStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('玄幻');
  const [writingStyle, setWritingStyle] = useState('通俗流畅、生动细腻');
  const [targetLength, setTargetLength] = useState(3000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createNovel({
        title: title.trim(),
        description: description.trim(),
        genre_profile: genre,
        chapter_target_length: targetLength,
      });
      onClose();
    } catch (err) {
      alert(`创建作品失败: ${err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#ded5c4] flex items-center justify-between bg-[#efe9dc]">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-[#854d0e]" />
            <h2 className="text-sm font-serif font-bold text-[#2b2621]">立项开篇 · 创建新长篇作品</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#685f54] hover:text-[#2b2621] hover:bg-[#e5ded0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
              作品名称 <span className="text-[#c2410c]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：万古剑神、深空序列、临高启明..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
                核心题材 / 类型
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] cursor-pointer"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
                单章目标字数
              </label>
              <input
                type="number"
                min={1000}
                max={15000}
                step={500}
                value={targetLength}
                onChange={(e) => setTargetLength(Number(e.target.value))}
                className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
              文风基调
            </label>
            <select
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] cursor-pointer"
            >
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
              故事简介与核心梗概
            </label>
            <textarea
              rows={3}
              placeholder="一句话核心创意、主角身份与主线核心矛盾..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg p-2.5 text-xs text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ded5c4]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#ded5c4] text-xs font-serif text-[#685f54] hover:text-[#2b2621] hover:bg-[#efe9dc] transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium transition shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? '正在创建...' : '立即创建作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
