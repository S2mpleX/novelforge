import React, { useState, useRef, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import {
  ChevronDown,
  Plus,
  Search,
  Trash2,
  FileText,
  Check,
  BookMarked,
} from 'lucide-react';
import type { Novel } from '@/types';
import { BookCoverView } from '@/components/common/BookCoverView';
import { confirmDialog, alertDialog } from '@/utils/dialog';

interface NovelSelectorDropdownProps {
  onOpenCreateNovel: () => void;
  onOpenWordImport?: () => void;
  compact?: boolean;
}

export const NovelSelectorDropdown: React.FC<NovelSelectorDropdownProps> = ({
  onOpenCreateNovel,
  onOpenWordImport,
  compact = false,
}) => {
  const { novels, activeNovel, selectNovel, deleteNovel, chapters } = useNovelStore(
    useShallow((s) => ({
      novels: s.novels,
      activeNovel: s.activeNovel,
      selectNovel: s.selectNovel,
      deleteNovel: s.deleteNovel,
      chapters: s.chapters,
    }))
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部自动收起
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNovels = novels.filter((n) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      (n.genre_profile && n.genre_profile.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q))
    );
  });

  const handleDeleteNovel = async (novel: Novel, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg =
      novels.length <= 1
        ? `确定要彻底删除作品《${novel.title}》吗？\n注意：这是当前唯一的作品，删除后将自动重置为全新的空白草稿项目。`
        : `确定要彻底删除作品《${novel.title}》吗？\n注意：此操作不可撤销，该作品的所有章节、大纲与人物设定都将被永久删除。`;

    if (await confirmDialog(confirmMsg)) {
      try {
        await deleteNovel(novel.id);
      } catch (err) {
        await alertDialog('删除作品失败: ' + err);
      }
    }
  };

  // 格式化字数展示
  const formatWordCount = (count?: number) => {
    const n = count || 0;
    if (n >= 10000) {
      return `${(n / 10000).toFixed(1)}万字`;
    }
    return `${n.toLocaleString()}字`;
  };

  // 计算当前小说的章节数和字数汇总
  const currentChapterCount = chapters.length;
  const currentTotalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* 典雅书卷风格触发器按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full group text-left transition-all duration-200 cursor-pointer rounded-xl border ${
          isOpen
            ? 'bg-[#fffdfa] dark:bg-[#25221e] border-amber-800/50 shadow-md ring-2 ring-amber-700/15'
            : 'bg-gradient-to-b from-[#fdfbf7] to-[#f7f2e7] dark:from-[#24211e] dark:to-[#1c1917] border-[#d8cdb8] dark:border-[#38332d] hover:border-amber-800/40 hover:shadow-sm'
        } ${compact ? 'p-2' : 'p-2.5'}`}
      >
        <div className="flex items-center gap-2.5">
          {/* 古典装帧书脊与微型封面 */}
          <div className="relative shrink-0">
            <BookCoverView
              novel={activeNovel}
              size="xs"
              showRibbon={false}
              className="shadow-2xs"
            />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-[#f7f2e7] dark:border-[#1c1917]" title="当前创作就绪" />
          </div>

          {/* 书籍信息主体 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                title={activeNovel ? activeNovel.title : '未选择作品项目'}
                className="font-serif font-bold text-xs text-ink dark:text-[#ede6dc] truncate tracking-wide"
              >
                {activeNovel ? activeNovel.title : '未选择作品项目'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              {activeNovel?.genre_profile ? (
                <span
                  title={activeNovel.genre_profile}
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/20 truncate max-w-[180px]"
                >
                  {activeNovel.genre_profile}
                </span>
              ) : (
                <span className="text-[10px] text-ink-2">长篇通俗</span>
              )}

              <span className="text-[10px] text-ink-2 dark:text-[#9e9486] font-mono shrink-0">
                {currentChapterCount}章 · {formatWordCount(currentTotalWords)}
              </span>
            </div>
          </div>

          {/* 下拉箭头与切换提示 */}
          <div className="shrink-0 flex items-center pl-1 text-ink-2 group-hover:text-primary dark:group-hover:text-amber-400 transition-colors">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-primary dark:text-amber-400' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* 自定义书架下拉菜单卡片 (Custom Popover) */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-full z-50 rounded-xl bg-[#faf6ee] dark:bg-[#1f1c19] border border-line dark:border-[#38332d] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* 下拉面板顶部：搜索框与作品总数 */}
          <div className="p-2.5 border-b border-line dark:border-[#332e29] bg-[#f2ebd9]/70 dark:bg-[#181614]/70 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-ink-2 dark:text-[#a89d8f]">
              <span className="font-serif font-semibold flex items-center gap-1 text-ink dark:text-[#ede6dc]">
                <BookMarked className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                切换书架作品
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 border border-amber-800/15">
                共 {novels.length} 部作品
              </span>
            </div>

            {novels.length > 2 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2" />
                <input
                  type="text"
                  placeholder="搜索书名、题材或简介..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-surface dark:bg-[#282420] border border-line dark:border-[#3d3730] rounded-lg pl-7 pr-2 py-1 text-xs text-ink dark:text-[#ede6dc] placeholder-[#8e8476] focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
            )}
          </div>

          {/* 作品列表项 */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {filteredNovels.length === 0 ? (
              <div className="text-center py-6 px-3 text-ink-2">
                <p className="text-xs">未找到匹配的小说作品</p>
              </div>
            ) : (
              filteredNovels.map((novel) => {
                const isActive = activeNovel?.id === novel.id;
                return (
                  <div
                    key={novel.id}
                    onClick={() => {
                      selectNovel(novel);
                      setIsOpen(false);
                    }}
                    className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs border ${
                      isActive
                        ? 'bg-surface dark:bg-[#2a2622] text-amber-950 dark:text-amber-100 font-medium border-amber-800/35 dark:border-amber-600/40 shadow-xs'
                        : 'border-transparent text-[#443d34] dark:text-[#c4bbb0] hover:bg-[#efe7d8] dark:hover:bg-[#26221e] hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    {/* 左侧激活书签线 */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-amber-800 dark:bg-amber-500" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0 pl-1.5 flex-1">
                      <BookCoverView
                        novel={novel}
                        size="xs"
                        showRibbon={false}
                        className="shrink-0 shadow-2xs"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-serif truncate ${isActive ? 'font-bold text-ink dark:text-white' : ''}`}>
                            {novel.title}
                          </span>
                          {isActive && (
                            <span className="shrink-0 text-[9px] px-1 py-0.2 rounded bg-amber-800/15 dark:bg-amber-400/20 text-primary dark:text-amber-300 font-sans">
                              创编中
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink-2 dark:text-[#998f82]">
                          {novel.genre_profile && (
                            <span title={novel.genre_profile} className="truncate max-w-[180px]">
                              {novel.genre_profile}
                            </span>
                          )}
                          {novel.total_word_count !== undefined && (
                            <span className="font-mono">
                              {formatWordCount(novel.total_word_count)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧操作微区 */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNovel(novel, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-2 hover:text-rose-700 hover:bg-rose-800/10 transition cursor-pointer"
                          title={`删除作品《${novel.title}》`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 下拉面板底部：快捷创建与导入入口 */}
          <div className="p-2 border-t border-line dark:border-[#332e29] bg-[#f4ede0]/80 dark:bg-[#161412]/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateNovel();
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              开启新作品
            </button>

            {onOpenWordImport && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenWordImport();
                }}
                className="py-1.5 px-2.5 rounded-lg bg-[#e8e0ce] dark:bg-[#2b2723] hover:bg-[#ded4bf] text-ink dark:text-[#ede6dc] text-xs font-medium flex items-center justify-center gap-1.5 transition border border-line dark:border-[#3d3730] cursor-pointer"
                title="导入已有 Word (.docx) 存稿并智能分卷分章"
              >
                <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                导入Word
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
