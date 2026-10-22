import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/utils/tauriBridge';
import {
  BookOpen,
  Download,
  Database,
  Archive,
  Pencil,
  X,
  Palette,
} from 'lucide-react';
import { BookCoverView } from '@/components/common/BookCoverView';
import { alertDialog } from '@/utils/dialog';

const PublishingModal = React.lazy(() => import('@/components/modals/PublishingModal').then(m => ({ default: m.PublishingModal })));
const BookCoverModal = React.lazy(() => import('@/components/modals/BookCoverModal').then(m => ({ default: m.BookCoverModal })));

export const NovelInfoPanel: React.FC = () => {
  const { activeNovel, chapters, updateNovel } = useNovelStore(
    useShallow((s) => ({
      activeNovel: s.activeNovel,
      chapters: s.chapters,
      updateNovel: s.updateNovel,
    }))
  );
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Novel Metadata State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请选择或创建小说项目以查看作品档案
      </div>
    );
  }

  const handleSaveNovelInfo = async () => {
    if (!activeNovel || !editTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await updateNovel({
        id: activeNovel.id,
        title: editTitle.trim(),
        genre_profile: editGenre.trim() || '通用',
        writing_style: editStyle.trim() || '通俗流畅',
        description: editDesc.trim(),
      });
      setIsEditing(false);
      setFeedback('作品档案已成功更新！');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      await alertDialog('更新作品信息失败: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

  const handleExportTxt = async () => {
    try {
      const text = await api.exportNovelText(activeNovel.id, 'txt');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `《${activeNovel.title}》全本.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('已成功导出全本 TXT！');
      setTimeout(() => setFeedback(null), 2500);
    } catch (e) {
      setFeedback(`导出失败: ${e}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">作品档案与全书总览</span>
        </div>
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-2 py-0.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] shrink-0 whitespace-nowrap"
        >
          <Archive className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">发布与灾备中心</span>
          <span className="sm:hidden">发布/灾备</span>
        </button>
      </div>

      {feedback && (
        <div className="px-3 py-1 bg-amber-800/10 text-primary border-b border-amber-800/20 text-[11px] font-medium">
          {feedback}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Core Novel Card */}
        <div className="bg-surface border border-line rounded-lg p-3 shadow-xs space-y-2.5">
          <div className="flex items-start gap-3">
            <BookCoverView
              novel={activeNovel}
              size="sm"
              interactive={true}
              onClick={() => setShowCoverModal(true)}
              className="shrink-0 shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-primary truncate">《{activeNovel.title}》</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-amber-800/10 text-primary border border-amber-800/20 text-[10px] font-semibold">
                    {activeNovel.genre_profile || '长篇小说'}
                  </span>
                  <button
                    onClick={() => setShowCoverModal(true)}
                    className="px-2 py-0.5 rounded border border-line hover:bg-surface-3 text-ink-2 hover:text-primary font-medium transition flex items-center gap-1 text-[11px] cursor-pointer"
                    title="定制艺术封皮或上传专属原画"
                  >
                    <Palette className="w-3 h-3 text-primary" />
                    设定封面
                  </button>
                  <button
                    onClick={() => {
                      setEditTitle(activeNovel.title);
                      setEditGenre(activeNovel.genre_profile || '');
                      setEditDesc(activeNovel.description || '');
                      setEditStyle(activeNovel.writing_style || '');
                      setIsEditing(true);
                    }}
                    className="px-2 py-0.5 rounded border border-line hover:bg-surface-3 text-ink-2 hover:text-primary font-medium transition flex items-center gap-1 text-[11px] cursor-pointer"
                    title="修改作品名称、题材与简介"
                  >
                    <Pencil className="w-3 h-3 text-primary" />
                    编辑设定
                  </button>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-[#4b4337] font-serif whitespace-pre-wrap bg-[#fcfaf5] p-2 rounded border border-line mt-2 line-clamp-2">
                {activeNovel.description || '暂无作品简介。'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2 rounded bg-surface border border-line">
              <span className="text-[10px] text-ink-2 block font-sans">总章节数</span>
              <span className="font-bold text-sm text-ink mt-0.5 block">{chapters.length} 章</span>
            </div>
            <div className="p-2 rounded bg-surface border border-line">
              <span className="text-[10px] text-ink-2 block font-sans">全书累计字数</span>
              <span className="font-bold text-sm text-primary mt-0.5 block">{totalWords.toLocaleString()} 字</span>
            </div>
            <div className="p-2 rounded bg-surface border border-line">
              <span className="text-[10px] text-ink-2 block font-sans">目标单章字数</span>
              <span className="font-bold text-sm text-[#047857] mt-0.5 block">{activeNovel.chapter_target_length || 3000} 字</span>
            </div>
          </div>
        </div>

        {/* Quick Operations */}
        <div className="bg-surface border border-line rounded-lg p-3 shadow-xs space-y-2">
          <span className="font-bold text-xs text-ink-2 block">常用操作</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportTxt}
              className="px-2.5 py-1.5 rounded border border-line hover:bg-surface-3 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              导出全书 TXT
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-2.5 py-1.5 rounded border border-line hover:bg-surface-3 text-ink font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              SQLite 数据库热备份
            </button>
          </div>
        </div>
      </div>

      {/* Edit Novel Metadata Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" />
                编辑作品项目档案
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">
                  作品书名 <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                  placeholder="如：星海沉浮录"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-2 mb-1">
                    流派题材
                  </label>
                  <input
                    type="text"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                    placeholder="如：硬核科幻 / 仙侠修真"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-2 mb-1">
                    文风基调
                  </label>
                  <input
                    type="text"
                    value={editStyle}
                    onChange={(e) => setEditStyle(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                    placeholder="如：冷峻克制 / 宏大叙事"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">
                  故事核心梗概 / 简介
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-amber-700 font-serif leading-relaxed"
                  placeholder="简述故事核心矛盾、主要人物与世界背景..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-line text-[#5a5247] hover:bg-surface-3-hover transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveNovelInfo}
                disabled={!editTitle.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-amber-800 text-white font-medium hover:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isSubmitting ? '保存中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      <React.Suspense fallback={null}>
        {showPublishModal && <PublishingModal onClose={() => setShowPublishModal(false)} />}
        {showCoverModal && <BookCoverModal isOpen={showCoverModal} onClose={() => setShowCoverModal(false)} />}
      </React.Suspense>
    </div>
  );
};
