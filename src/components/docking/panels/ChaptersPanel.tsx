import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import {
  Plus,
  Book,
  Search,
  BookOpen,
  Copy,
  ExternalLink,
  Trash2,
  FileText,
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';

export const ChaptersPanel: React.FC = () => {
  const {
    novels,
    activeNovel,
    selectNovel,
    chapters,
    activeChapter,
    selectChapter,
    deleteChapter,
  } = useNovelStore();
  const { openPanel } = useWorkspaceStore();

  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `第${c.chapter_number}章`.includes(searchQuery)
  );

  const handleCopyChapterText = async (chapter: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const content = chapter.content || '';
      await navigator.clipboard.writeText(content);
      setCopyFeedback(chapter.id);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleOpenInNewEditorTab = (chapter: any, e: React.MouseEvent) => {
    e.stopPropagation();
    openPanel('editor', { id: chapter.id, title: `第${chapter.chapter_number}章: ${chapter.title}` }, {
      title: `第${chapter.chapter_number}章: ${chapter.title}`,
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f6f1e8] text-[#2c2825] select-none text-xs">
      {/* Novel Selector Header */}
      <div className="p-2.5 border-b border-[#ded5c4] bg-[#ede5d6]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[#786f65] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-800" />
            当前作品项目
          </span>
          <button
            onClick={() => setShowCreateNovel(true)}
            className="text-[11px] text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-800/10"
          >
            <Plus className="w-3 h-3" />
            新建
          </button>
        </div>

        <select
          value={activeNovel?.id || ''}
          onChange={(e) => {
            const found = novels.find((n) => n.id === e.target.value);
            if (found) selectNovel(found);
          }}
          className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-md px-2 py-1 text-xs text-[#2b2621] focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium cursor-pointer"
        >
          {novels.length === 0 ? (
            <option value="">暂无小说项目</option>
          ) : (
            novels.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title} ({n.genre_profile || '长篇'})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Chapters Header & Actions */}
      <div className="p-2 border-b border-[#ded5c4] flex items-center justify-between bg-[#fbf8f2]">
        <div className="flex items-center gap-1.5">
          <Book className="w-3.5 h-3.5 text-[#786f65]" />
          <span className="font-semibold text-[#2c2825]">
            章节目录 ({chapters.length})
          </span>
        </div>

        <button
          onClick={() => setShowCreateChapter(true)}
          disabled={!activeNovel}
          className="px-2 py-0.5 rounded bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/25 font-medium flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
          新建章节
        </button>
      </div>

      {/* Search Bar & Summary */}
      <div className="p-2 space-y-1 bg-[#fbf8f2]/60 border-b border-[#ded5c4]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8e8476]" />
          <input
            type="text"
            placeholder="搜索章节标题或序号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded pl-7 pr-2 py-1 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
        <div className="flex items-center justify-between px-1 text-[10px] text-[#786f65]">
          <span>全书字数统计:</span>
          <span className="font-mono font-medium text-[#2b2621]">
            {chapters.reduce((sum, c) => sum + (c.word_count || 0), 0).toLocaleString()} 字
          </span>
        </div>
      </div>

      {/* Chapters Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-8 text-[#786f65]">
            <FileText className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-amber-800" />
            <p className="text-[11px]">暂无章节</p>
          </div>
        ) : (
          filteredChapters.map((ch) => {
            const isActive = activeChapter?.id === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => selectChapter(ch)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition text-xs border ${
                  isActive
                    ? 'bg-[#fdfbf7] text-amber-900 font-semibold border-amber-800/30 shadow-xs'
                    : 'border-transparent text-[#5a5247] hover:text-[#1f1d1a] hover:bg-[#eae3d4]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="font-mono text-[10px] text-amber-800 shrink-0 font-medium">
                    第{ch.chapter_number}章
                  </span>
                  <span className="truncate">{ch.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className="font-mono text-[10px] text-[#8e8476] group-hover:hidden">
                    {ch.word_count || 0}字
                  </span>

                  {/* Actions on hover */}
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleCopyChapterText(ch, e)}
                      title={copyFeedback === ch.id ? '已复制！' : '复制正文'}
                      className="p-1 rounded text-[#786f65] hover:text-amber-800 hover:bg-amber-800/10"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleOpenInNewEditorTab(ch, e)}
                      title="在分栏新标签中打开"
                      className="p-1 rounded text-[#786f65] hover:text-amber-800 hover:bg-amber-800/10"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定删除第 ${ch.chapter_number} 章《${ch.title}》吗？`)) {
                          deleteChapter(ch.id);
                        }
                      }}
                      title="删除章节"
                      className="p-1 rounded text-[#786f65] hover:text-red-700 hover:bg-red-800/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
      {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
    </div>
  );
};
