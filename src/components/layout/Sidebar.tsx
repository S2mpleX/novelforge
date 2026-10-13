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
      <aside className="w-72 border-r border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-xl flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)] shadow-lg">
        {/* Novel Selector Header */}
        <div className="p-3 border-b border-white/[0.06] bg-slate-900/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              当前作品项目
            </span>
            <button
              onClick={() => setShowCreateNovel(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-indigo-500/10"
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
              className="w-full bg-slate-900/90 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer shadow-inner"
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
        <div className="p-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Book className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">
              章节目录 ({chapters.length})
            </span>
          </div>

          <button
            onClick={() => setShowCreateChapter(true)}
            disabled={!activeNovel}
            className="px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Plus className="w-3 h-3" />
            新建章节
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="搜索章节标题或编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 shadow-inner"
            />
          </div>
        </div>

        {/* Chapters Tree List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filteredChapters.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-500 mb-3">暂无匹配章节</p>
              {activeNovel && (
                <button
                  onClick={() => setShowCreateChapter(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition inline-flex items-center gap-1 shadow-md shadow-indigo-600/20"
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
                      ? 'bg-indigo-600/15 text-indigo-300 font-medium border-indigo-500/40 shadow-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                      isActive ? 'bg-indigo-500/25 text-indigo-300 font-semibold' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
                    }`}>
                      {ch.chapter_number.toString().padStart(2, '0')}
                    </span>
                    <span className="truncate text-slate-300 group-hover:text-slate-100">{ch.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono px-1 py-0.5 rounded bg-slate-900/60 border border-white/[0.05]">
                      {ch.word_count || 0}字
                    </span>

                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除第 ${ch.chapter_number} 章《${ch.title}》吗？`)) {
                            deleteChapter(ch.id);
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
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
          <div className="p-3 border-t border-white/[0.06] bg-slate-900/40 flex items-center justify-between">
            <button
              onClick={() => setShowVersions(true)}
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition py-1 px-1.5 rounded hover:bg-white/[0.04]"
              title="查看与回退历史草稿快照"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>本章版本快照</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
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
