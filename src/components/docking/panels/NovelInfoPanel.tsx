import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  BookOpen,
  Download,
  Database,
  Archive,
} from 'lucide-react';
import { PublishingModal } from '@/components/modals/PublishingModal';

export const NovelInfoPanel: React.FC = () => {
  const { activeNovel, chapters } = useNovelStore();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择或创建小说项目以查看作品档案
      </div>
    );
  }

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
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">作品项目档案与全书总览</span>
        </div>
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-2 py-0.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Archive className="w-3 h-3" />
          发布与灾备中心
        </button>
      </div>

      {feedback && (
        <div className="px-3 py-1 bg-amber-800/10 text-amber-900 border-b border-amber-800/20 text-[11px] font-medium">
          {feedback}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Core Novel Card */}
        <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#854d0e]">《{activeNovel.title}》</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-800/10 text-amber-900 border border-amber-800/20 text-[10px] font-semibold">
              {activeNovel.genre_profile || '长篇小说'}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-[#4b4337] font-serif whitespace-pre-wrap bg-[#fcfaf5] p-2.5 rounded border border-[#ded5c4]">
            {activeNovel.description || '暂无作品简介。'}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2 rounded bg-[#f7f2e7] border border-[#ded5c4]">
              <span className="text-[10px] text-[#786f65] block font-sans">总章节数</span>
              <span className="font-bold text-sm text-[#2c2825] mt-0.5 block">{chapters.length} 章</span>
            </div>
            <div className="p-2 rounded bg-[#f7f2e7] border border-[#ded5c4]">
              <span className="text-[10px] text-[#786f65] block font-sans">全书累计字数</span>
              <span className="font-bold text-sm text-[#854d0e] mt-0.5 block">{totalWords.toLocaleString()} 字</span>
            </div>
            <div className="p-2 rounded bg-[#f7f2e7] border border-[#ded5c4]">
              <span className="text-[10px] text-[#786f65] block font-sans">目标单章字数</span>
              <span className="font-bold text-sm text-[#047857] mt-0.5 block">{activeNovel.chapter_target_length || 3000} 字</span>
            </div>
          </div>
        </div>

        {/* Quick Operations */}
        <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs space-y-2">
          <span className="font-bold text-xs text-[#554b3e] block">常用操作</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportTxt}
              className="px-2.5 py-1.5 rounded border border-[#d5cbb8] hover:bg-[#ede5d6] text-[#2c2825] font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-800" />
              导出全书 TXT
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-2.5 py-1.5 rounded border border-[#d5cbb8] hover:bg-[#ede5d6] text-[#2c2825] font-medium flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-amber-800" />
              SQLite 数据库热备份
            </button>
          </div>
        </div>
      </div>

      {showPublishModal && <PublishingModal onClose={() => setShowPublishModal(false)} />}
    </div>
  );
};
