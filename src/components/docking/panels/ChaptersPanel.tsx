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
  Pencil,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { NovelSelectorDropdown } from '@/components/layout/NovelSelectorDropdown';
import { cleanTitlePrefix } from '@/utils/titleFormatter';
import { confirmDialog, alertDialog, promptDialog } from '@/utils/dialog';

const CreateNovelModal = React.lazy(() => import('@/components/modals/CreateNovelModal').then(m => ({ default: m.CreateNovelModal })));
const CreateChapterModal = React.lazy(() => import('@/components/modals/CreateChapterModal').then(m => ({ default: m.CreateChapterModal })));

export const ChaptersPanel: React.FC = () => {
  const {
    novels,
    activeNovel,
    deleteNovel,
    chapters,
    activeChapter,
    selectChapter,
    deleteChapter,
    updateChapterTitle,
  } = useNovelStore(
    useShallow((s) => ({
      novels: s.novels,
      activeNovel: s.activeNovel,
      deleteNovel: s.deleteNovel,
      chapters: s.chapters,
      activeChapter: s.activeChapter,
      selectChapter: s.selectChapter,
      deleteChapter: s.deleteChapter,
      updateChapterTitle: s.updateChapterTitle,
    }))
  );
  const { openPanel } = useWorkspaceStore();

  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'DEFAULT' | 'WORD_DESC' | 'WORD_ASC'>('DEFAULT');

  const filteredChapters = chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `第${c.chapter_number}章`.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortOrder === 'WORD_DESC') return (b.word_count || 0) - (a.word_count || 0);
      if (sortOrder === 'WORD_ASC') return (a.word_count || 0) - (b.word_count || 0);
      return a.chapter_number - b.chapter_number;
    });

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);
  const maxWordCount = Math.max(...chapters.map((c) => c.word_count || 0), 1);

  const formatWordCountDisplay = (count?: number) => {
    const n = count || 0;
    if (n >= 10000) {
      return `${(n / 10000).toFixed(1)}万字`;
    }
    return `${n.toLocaleString()}字`;
  };

  const handleCopyChapterText = async (chapter: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const content = chapter.content || '';
      const plainText = content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
      await navigator.clipboard.writeText(plainText || chapter.title);
      setCopyFeedback(chapter.id);
      setTimeout(() => setCopyFeedback(null), 1800);
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

  const handleRenameChapter = async (chapter: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawClean = cleanTitlePrefix(chapter.title, 'CHAPTER') || chapter.title;
    const newTitle = await promptDialog({ message: '请输入新的章节标题：', defaultValue: rawClean });
    if (newTitle !== null) {
      const trimmed = newTitle.trim();
      if (trimmed && trimmed !== chapter.title) {
        try {
          await updateChapterTitle(chapter.id, trimmed);
        } catch (err) {
          await alertDialog('修改章节标题失败: ' + err);
        }
      }
    }
  };

  const handleDeleteNovel = async () => {
    if (!activeNovel) return;
    const confirmMsg = novels.length <= 1
      ? `确定要彻底删除作品《${activeNovel.title}》吗？\n注意：这是当前唯一的作品，删除后将自动重置为全新的空白草稿项目。`
      : `确定要彻底删除作品《${activeNovel.title}》吗？\n注意：此操作不可撤销，该作品的所有章节、大纲与人物设定都将被永久删除。`;

    if (await confirmDialog(confirmMsg)) {
      try {
        await deleteNovel(activeNovel.id);
      } catch (err) {
        await alertDialog('删除作品失败: ' + err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface-2 dark:bg-[#1c1917] text-ink dark:text-[#ede6dc] select-none text-xs">
      {/* Novel Selector Header - 替换原生 select，接入奢华典雅书卷下拉组件 */}
      <div className="p-2.5 border-b border-line dark:border-[#2e2a27] bg-surface-2/70 dark:bg-[#201d1a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-ink-2 dark:text-[#a89d8f] uppercase tracking-wider flex items-center gap-1.5 font-serif">
            <BookOpen className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
            当前作品项目
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCreateNovel(true)}
              className="text-[11px] text-primary dark:text-amber-400 hover:text-primary font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-800/10 cursor-pointer"
              title="新建小说作品"
            >
              <Plus className="w-3 h-3" />
              新建
            </button>
            {activeNovel && (
              <button
                type="button"
                onClick={handleDeleteNovel}
                className="text-[11px] text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-rose-800/10 cursor-pointer"
                title={`删除当前作品《${activeNovel.title}》`}
              >
                <Trash2 className="w-3 h-3" />
                删除
              </button>
            )}
          </div>
        </div>

        <NovelSelectorDropdown
          compact
          onOpenCreateNovel={() => setShowCreateNovel(true)}
        />
      </div>

      {/* Chapters Header & Actions */}
      <div className="p-2 border-b border-line dark:border-[#2e2a27] flex items-center justify-between bg-surface-2/90 dark:bg-[#1e1b18] gap-2 min-w-0 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Book className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
          <span className="font-serif font-bold text-ink dark:text-[#ede6dc] truncate">
            章节目录
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-800/10 text-primary dark:text-amber-300 border border-amber-800/15 shrink-0 whitespace-nowrap">
            {chapters.length} 节
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateChapter(true)}
          disabled={!activeNovel}
          className="px-2 py-1 rounded-lg bg-amber-800/10 hover:bg-amber-800/20 text-primary dark:text-amber-300 border border-amber-800/25 font-medium flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 shrink-0" />
          新建章节
        </button>
      </div>

      {/* Search Bar & Summary Banner */}
      <div className="p-2 space-y-1.5 bg-surface-2/50 dark:bg-[#1a1715]/40 border-b border-line dark:border-[#2e2a27]">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2" />
            <input
              type="text"
              placeholder="搜索章节标题或序号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface dark:bg-[#25211d] border border-line dark:border-[#38332c] rounded-lg pl-7 pr-7 py-1 text-xs text-ink dark:text-[#ede6dc] placeholder-[#8e8476] focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 p-0.5 text-ink-2 hover:text-ink"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSortOrder((prev) =>
                prev === 'DEFAULT' ? 'WORD_DESC' : prev === 'WORD_DESC' ? 'WORD_ASC' : 'DEFAULT'
              );
            }}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              sortOrder !== 'DEFAULT'
                ? 'bg-amber-800/10 text-primary border-amber-800/30'
                : 'bg-[#efe8dc] dark:bg-[#25221e] text-ink-2 border-[#dcd1bf] dark:border-[#38332c]'
            }`}
            title={`当前排序：${
              sortOrder === 'DEFAULT'
                ? '默认章节序号'
                : sortOrder === 'WORD_DESC'
                ? '字数由多到少'
                : '字数由少到多'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-ink-2 dark:text-[#a89d8f]">
          <span>全书字数统计:</span>
          <span className="font-mono font-medium text-ink dark:text-[#ede6dc]">
            {formatWordCountDisplay(totalWords)}
          </span>
        </div>
      </div>

      {/* Chapters Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-10 text-ink-2">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-xs font-serif">{searchQuery ? '未找到相关章节' : '暂无章节内容'}</p>
          </div>
        ) : (
          filteredChapters.map((ch) => {
            const isActive = activeChapter?.id === ch.id;
            const chapterWords = ch.word_count || 0;
            const ratio = Math.min(100, Math.round((chapterWords / maxWordCount) * 100));

            return (
              <div
                key={ch.id}
                onClick={() => selectChapter(ch)}
                className={`group relative flex items-center justify-between px-2.5 py-2 my-0.5 rounded-xl cursor-pointer transition text-xs border ${
                  isActive
                    ? 'bg-[#fffefb] dark:bg-[#282420] text-amber-950 dark:text-amber-100 font-medium border-amber-800/40 dark:border-amber-600/50 shadow-xs ring-1 ring-amber-800/15'
                    : 'border-transparent text-[#443d34] dark:text-[#c4bbb0] hover:text-[#1a1816] hover:bg-surface-3 dark:hover:bg-[#221f1c]'
                }`}
              >
                {/* 激活时的朱砂书签折痕指示条 */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-800 dark:bg-amber-500 shadow-xs" />
                )}

                <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0 font-medium tracking-tighter ${
                      isActive
                        ? 'bg-amber-800 text-amber-50 shadow-xs'
                        : 'bg-surface-3 dark:bg-[#332e29] text-ink-2 dark:text-[#9e9486]'
                    }`}
                  >
                    {ch.chapter_number.toString().padStart(2, '0')}
                  </span>
                  <span className={`truncate font-serif tracking-wide ${isActive ? 'font-bold text-ink dark:text-white' : ''}`}>
                    {cleanTitlePrefix(ch.title, 'CHAPTER') || ch.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* 单章篇幅指示柱 (悬停工具组出现时隐藏，避免窄分栏挤压标题) */}
                  <div className="w-10 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden hidden sm:block group-hover:hidden transition-all" title={`篇幅占比：约 ${ratio}%`}>
                    <div
                      className={`h-full rounded-full ${isActive ? 'bg-amber-800 dark:bg-amber-500' : 'bg-amber-800/40'}`}
                      style={{ width: `${Math.max(5, ratio)}%` }}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-medium'
                        : 'text-ink-2 dark:text-[#9e9486]'
                    }`}
                  >
                    {chapterWords > 0 ? `${chapterWords.toLocaleString()}字` : '待撰'}
                  </span>

                  {/* Actions on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                    <button
                      type="button"
                      onClick={(e) => handleCopyChapterText(ch, e)}
                      title={copyFeedback === ch.id ? '已复制！' : '复制正文'}
                      className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 cursor-pointer"
                    >
                      {copyFeedback === ch.id ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRenameChapter(ch, e)}
                      title="重命名章节"
                      className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenInNewEditorTab(ch, e)}
                      title="在分栏新标签中打开"
                      className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (await confirmDialog(`确定删除第 ${ch.chapter_number} 章《${ch.title}》吗？`)) {
                          try {
                            await deleteChapter(ch.id);
                          } catch (err) {
                            await alertDialog('删除章节失败: ' + err);
                          }
                        }
                      }}
                      title="删除章节"
                      className="p-1 rounded text-ink-2 hover:text-red-700 hover:bg-red-800/10 cursor-pointer"
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

      <React.Suspense fallback={null}>
        {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
        {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
      </React.Suspense>
    </div>
  );
};
