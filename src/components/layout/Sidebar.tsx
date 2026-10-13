import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  Plus,
  Book,
  Trash2,
  History,
  FolderOpen,
  Search,
  BookOpen,
  Copy,
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';
import { VersionDrawer } from '@/components/modals/VersionDrawer';

export const Sidebar: React.FC = () => {
  const {
    novels,
    activeNovel,
    selectNovel,
    chapters,
    activeChapter,
    selectChapter,
    deleteChapter,
    sidebarCollapsed,
  } = useNovelStore();

  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (sidebarCollapsed) {
    return null;
  }

  const filteredChapters = chapters.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `第${c.chapter_number}章`.includes(searchQuery)
  );

  return (
    <>
      <aside className="w-72 border-r border-[#ded5c4] bg-[#f3ede1]/95 backdrop-blur-xl flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)] shadow-sm">
        {/* Novel Selector Header */}
        <div className="p-3 border-b border-[#ded5c4] bg-[#eae2d3]/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#786f65] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-800" />
              当前作品项目
            </span>
            <button
              onClick={() => setShowCreateNovel(true)}
              className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-800/10"
            >
              <Plus className="w-3.5 h-3.5" />
              新建
            </button>
          </div>

          <div className="relative">
            <select
              value={activeNovel?.id || ''}
              onChange={(e) => {
                const found = novels.find((n) => n.id === e.target.value);
                if (found) selectNovel(found);
              }}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium cursor-pointer shadow-inner"
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
        </div>

        {/* Chapters Header & Actions */}
        <div className="p-3 pb-2 border-b border-[#ded5c4] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Book className="w-3.5 h-3.5 text-[#786f65]" />
            <span className="text-xs font-semibold text-[#2c2825]">
              章节目录 ({chapters.length})
            </span>
          </div>

          <button
            onClick={() => setShowCreateChapter(true)}
            disabled={!activeNovel}
            className="px-2 py-1 rounded-md bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/25 text-[11px] font-medium flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Plus className="w-3 h-3" />
            新建章节
          </button>
        </div>

        {/* Search Bar & Novel Stats Overview */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8e8476]" />
            <input
              type="text"
              placeholder="搜索章节标题或编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700 shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-[#786f65]">
            <span>全书累计:</span>
            <span className="font-mono font-medium text-[#2b2621]">
              <strong>{chapters.length}</strong> 章节 · <strong>{chapters.reduce((sum, c) => sum + (c.word_count || 0), 0).toLocaleString()}</strong> 字
            </span>
          </div>
        </div>

        {/* Chapters Tree List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filteredChapters.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FolderOpen className="w-8 h-8 text-[#9e9383] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#786f65] mb-3">暂无匹配章节</p>
              {activeNovel && (
                <button
                  onClick={() => setShowCreateChapter(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium hover:bg-amber-700 transition inline-flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建第一章
                </button>
              )}
            </div>
          ) : (
            filteredChapters.map((ch) => {
              const isActive = activeChapter?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => selectChapter(ch)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 text-xs select-none border ${
                    isActive
                      ? 'bg-[#fdfbf7] text-amber-900 font-medium border-amber-800/30 shadow-sm'
                      : 'border-transparent text-[#5a5247] hover:text-[#1f1d1a] hover:bg-[#eae3d4]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                      isActive ? 'bg-amber-800/15 text-amber-900 font-semibold' : 'bg-[#e4dcce] text-[#786f65] group-hover:text-[#231f1a]'
                    }`}>
                      {ch.chapter_number.toString().padStart(2, '0')}
                    </span>
                    <span className="truncate text-[#2b2621]">{ch.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-[#786f65] font-mono px-1 py-0.5 rounded bg-[#e8e0d0] border border-[#dcd1be]">
                      {ch.word_count || 0}字
                    </span>

                    {/* Quick Copy Plaintext */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const plainText = (ch.content || '').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
                          await navigator.clipboard.writeText(plainText || ch.title);
                          alert(`已复制第 ${ch.chapter_number} 章内容到剪贴板！`);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#ded4c3] transition opacity-0 group-hover:opacity-100"
                      title="快速复制本章纯文本"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除第 ${ch.chapter_number} 章《${ch.title}》吗？`)) {
                            deleteChapter(ch.id);
                          }
                        }}
                        className="p-1 rounded text-[#786f65] hover:text-rose-700 hover:bg-rose-800/10 transition opacity-0 group-hover:opacity-100"
                        title="删除章节"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Version Drawer trigger */}
        {activeChapter && (
          <div className="p-3 border-t border-[#ded5c4] bg-[#eae2d3]/60 flex items-center justify-between">
            <button
              onClick={() => setShowVersions(true)}
              className="text-xs text-[#5a5247] hover:text-amber-900 flex items-center gap-1.5 transition py-1 px-1.5 rounded hover:bg-[#ded4c3]"
              title="查看与回退历史草稿快照"
            >
              <History className="w-3.5 h-3.5 text-amber-800" />
              <span>本章版本快照</span>
            </button>
            <span className="text-[11px] text-[#786f65] font-mono">
              共 {activeChapter.word_count || 0} 字
            </span>
          </div>
        )}
      </aside>

      {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
      {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
      {showVersions && <VersionDrawer onClose={() => setShowVersions(false)} />}
    </>
  );
};
