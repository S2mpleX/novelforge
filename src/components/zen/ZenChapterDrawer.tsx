import React, { useState, useMemo } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { Chapter, Volume } from '@/types';
import {
  BookOpen,
  Search,
  Plus,
  X,
  FileText,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const ZenChapterDrawer: React.FC<Props> = ({ isOpen, onClose, onToggle }) => {
  const {
    activeNovel,
    chapters,
    activeChapter,
    volumes,
    selectChapter,
    createChapter,
  } = useNovelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // 排序并过滤章节
  const sortedChapters = useMemo(() => {
    return [...chapters].sort(
      (a, b) => (a.chapter_number ?? a.sequence ?? 0) - (b.chapter_number ?? b.sequence ?? 0)
    );
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return sortedChapters;
    const q = searchQuery.toLowerCase().trim();
    return sortedChapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        `第${c.chapter_number}章`.includes(q) ||
        String(c.chapter_number).includes(q)
    );
  }, [sortedChapters, searchQuery]);

  // 按分卷分组
  const groupedChapters = useMemo(() => {
    if (volumes.length === 0) {
      return [{ volume: null, chapters: filteredChapters }];
    }
    const map = new Map<string, Chapter[]>();
    const unassigned: Chapter[] = [];

    filteredChapters.forEach((ch) => {
      if (ch.volume_id) {
        if (!map.has(ch.volume_id)) map.set(ch.volume_id, []);
        map.get(ch.volume_id)!.push(ch);
      } else {
        unassigned.push(ch);
      }
    });

    const groups: { volume: Volume | null; chapters: Chapter[] }[] = [];
    volumes.forEach((vol) => {
      groups.push({
        volume: vol,
        chapters: map.get(vol.id) || [],
      });
    });

    if (unassigned.length > 0) {
      groups.push({ volume: null, chapters: unassigned });
    }
    return groups;
  }, [filteredChapters, volumes]);

  const handleSelect = async (chapter: Chapter) => {
    if (chapter.id === activeChapter?.id) {
      onClose();
      return;
    }
    try {
      await selectChapter(chapter);
      toast.info(`已翻至第 ${chapter.chapter_number} 章`, `《${chapter.title}》`);
      onClose();
    } catch (e) {
      console.error('切换章节失败:', e);
    }
  };

  const handleCreateNewChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChapterTitle.trim();
    if (!trimmed) return;

    try {
      const nextNum = sortedChapters.length + 1;
      const titleWithNum = trimmed.startsWith('第') ? trimmed : `第${nextNum}章 ${trimmed}`;
      const created = await createChapter({
        title: titleWithNum,
        initial_content: '<p></p>',
      });
      await selectChapter(created);
      setNewChapterTitle('');
      setIsCreating(false);
      toast.success('新建章节成功', `已切换至《${created.title}》`);
      onClose();
    } catch (e: any) {
      toast.error('新建章节失败', e?.message || '请检查数据库');
    }
  };

  return (
    <>
      {/* 边缘触发胶囊按钮（仅在抽屉未展开时显现） */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 px-1 py-3.5 rounded-r-xl bg-surface-2/90 hover:bg-surface-2 dark:bg-[#1f1c19]/90 dark:hover:bg-[#282420] border-y border-r border-line dark:border-[#3d362e] shadow-xl text-ink-2 hover:text-primary dark:hover:text-amber-300 transition-all group flex flex-col items-center gap-1.5 cursor-pointer backdrop-blur-md"
          title="展开章节目录 (快速切章 / 查看全卷)"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary dark:text-amber-400 group-hover:scale-110 transition-transform" />
          <span
            className="text-[10px] font-serif font-bold tracking-widest text-ink-2 dark:text-[#a09485] group-hover:text-primary dark:group-hover:text-amber-300"
            style={{ writingMode: 'vertical-rl' }}
          >
            目录
          </span>
          <ChevronRight className="w-3 h-3 text-ink-2/60 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 抽屉背衬遮罩 (点击空白关闭) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* 侧滑抽屉面板 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-surface/95 dark:bg-[#1a1714]/95 backdrop-blur-md border-r border-line dark:border-[#38332d] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 顶部标题栏 */}
        <div className="h-14 border-b border-line dark:border-[#322d28] px-4 flex items-center justify-between shrink-0 bg-surface-2/50 dark:bg-[#201d19]/50">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm text-ink truncate">
                {activeNovel?.title || '小说章节目录'}
              </h3>
              <p className="text-[10px] text-ink-2 dark:text-[#908474] font-mono">
                共 {chapters.length} 章 · 禅意轻量浏览
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#2c2824] transition cursor-pointer"
            title="关闭目录抽屉 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索与新增工具条 */}
        <div className="p-3 border-b border-line dark:border-[#322d28] space-y-2 bg-surface-2/30 dark:bg-[#1c1916]/30 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-2 dark:text-[#807464] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索章节名或章号..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface-3 dark:bg-[#24201c] border border-line dark:border-[#3d362e] text-xs text-ink placeholder:text-ink-2/60 focus:outline-none focus:border-primary/60 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink text-xs p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 新增章节折叠表单 */}
          {isCreating ? (
            <form onSubmit={handleCreateNewChapter} className="space-y-1.5 animate-in fade-in duration-150">
              <input
                type="text"
                autoFocus
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="输入新章节标题..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface dark:bg-[#1a1714] border border-amber-800/50 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary font-serif"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewChapterTitle('');
                  }}
                  className="px-2.5 py-1 text-[11px] rounded text-ink-2 hover:text-ink cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newChapterTitle.trim()}
                  className="px-3 py-1 text-[11px] font-medium rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition cursor-pointer"
                >
                  确认新建
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-line dark:border-[#3d362e] hover:border-primary/50 text-xs text-ink-2 hover:text-primary dark:hover:text-amber-300 font-serif flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-surface-3-hover/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建下一章节</span>
            </button>
          )}
        </div>

        {/* 章节树滚动列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
          {groupedChapters.length === 0 || (groupedChapters.length === 1 && groupedChapters[0].chapters.length === 0) ? (
            <div className="text-center py-12 text-ink-2 dark:text-[#7d7162] text-xs font-serif">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>暂无符合条件的章节</p>
            </div>
          ) : (
            groupedChapters.map((grp, gIdx) => (
              <div key={grp.volume?.id || `unassigned_${gIdx}`} className="space-y-1">
                {grp.volume && (
                  <div className="px-2 py-1 text-[11px] font-serif font-bold text-primary dark:text-amber-400/90 flex items-center gap-1.5 bg-surface-3/50 dark:bg-[#201d1a]/50 rounded-md">
                    <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      第 {grp.volume.sequence ?? grp.volume.order_index ?? (gIdx + 1)} 卷：{grp.volume.title}
                    </span>
                    <span className="text-[10px] text-ink-2/70 font-mono ml-auto shrink-0">
                      ({grp.chapters.length}章)
                    </span>
                  </div>
                )}

                <div className="space-y-0.5">
                  {grp.chapters.map((ch) => {
                    const isActive = ch.id === activeChapter?.id;
                    const wordCount = (ch.content || '').replace(/<[^>]+>/g, '').length;

                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelect(ch)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-all flex items-center gap-2 group cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 shadow-xs font-bold border border-amber-950/30'
                            : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-surface-3-hover dark:hover:bg-[#25211e]'
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-line dark:bg-[#3d362e] group-hover:bg-primary shrink-0 transition-colors" />
                        )}
                        <span className="font-serif truncate flex-1 min-w-0">
                          {ch.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono shrink-0 ${
                            isActive ? 'text-amber-200' : 'text-ink-2/60 dark:text-[#7d7162]'
                          }`}
                        >
                          {wordCount > 0 ? `${wordCount}字` : '空草稿'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部退出禅意提示 */}
        <div className="p-2.5 border-t border-line dark:border-[#322d28] text-center bg-surface-2/40 dark:bg-[#1e1b18]/40 shrink-0">
          <p className="text-[11px] text-ink-2 dark:text-[#807464] font-serif">
            提示：在沉浸写作中，随时按 <kbd className="px-1 py-0.5 rounded bg-surface border border-line text-[9px] font-mono">Esc</kbd> 退出回专业工坊
          </p>
        </div>
      </aside>
    </>
  );
};
