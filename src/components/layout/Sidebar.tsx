import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  Plus,
  Trash2,
  History,
  FolderOpen,
  Search,
  BookOpen,
  Copy,
  Layers,
  List,
  Split,
  Merge,
  Hash,
  ChevronRight,
  ChevronDown,
  Clapperboard,
  FileText,
  Pencil,
  Sparkles,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';
import { CreateVolumeModal } from '@/components/modals/CreateVolumeModal';
import { VersionDrawer } from '@/components/modals/VersionDrawer';
import { WordImportModal } from '@/components/modals/WordImportModal';
import { NovelSelectorDropdown } from '@/components/layout/NovelSelectorDropdown';
import { cleanTitlePrefix, formatNodeDisplayTitle } from '@/utils/titleFormatter';
import type { ContentTreeNode } from '@/types';
import { confirmDialog, alertDialog, promptDialog } from '@/utils/dialog';

export const Sidebar: React.FC = () => {
  const {
    novels,
    activeNovel,
    deleteNovel,
    chapters,
    activeChapter,
    selectChapter,
    deleteChapter,
    updateChapterTitle,
    deleteVolume,
    updateVolume,
    sidebarCollapsed,
    contentTree,
    scenes,
    activeScene,
    selectScene,
    splitChapter,
    mergeChapters,
    renumberHierarchy,
  } = useNovelStore();

  const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('TREE');
  const [listSortOrder, setListSortOrder] = useState<'DEFAULT' | 'WORD_DESC' | 'WORD_ASC'>('DEFAULT');
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [selectedVolumeIdForNewChapter, setSelectedVolumeIdForNewChapter] = useState<string | undefined>(undefined);
  const [showVersions, setShowVersions] = useState(false);
  const [showWordImportModal, setShowWordImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Split Chapter Modal State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitPoint, setSplitPoint] = useState<number>(500);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Merge Chapter Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetChapterId, setMergeTargetChapterId] = useState('');

  // Expanded tree node IDs
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  if (sidebarCollapsed) {
    return null;
  }

  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleCopyChapter = async (id: string, textToCopy: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedbackId(id);
      setTimeout(() => setCopyFeedbackId(null), 1800);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSplitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter) return;
    try {
      await splitChapter(splitPoint, newChapterTitle.trim() || undefined);
      setShowSplitModal(false);
      setNewChapterTitle('');
      await alertDialog('章节拆分成功！已保留原版本快照并重新排定后继章节。');
    } catch (err) {
      await alertDialog('拆分章节失败: ' + err);
    }
  };

  const handleMergeChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter || !mergeTargetChapterId) return;
    if (activeChapter.id === mergeTargetChapterId) {
      await alertDialog('不能将章节与自身合并！');
      return;
    }
    if (!await confirmDialog(`确定将当前章节《${activeChapter.title}》合并入目标章节吗？原章节场景将重新挂载，剧情关联平滑转移。`)) return;

    try {
      await mergeChapters(activeChapter.id, mergeTargetChapterId);
      setShowMergeModal(false);
      setMergeTargetChapterId('');
      await alertDialog('章节合并成功！正文已拼接，子场景与剧情关联已安全转移。');
    } catch (err) {
      await alertDialog('合并章节失败: ' + err);
    }
  };

  const handleRenumber = async () => {
    if (!await confirmDialog('确定对全书所有层级（部、卷、章、场景）执行全局连续重编号吗？')) return;
    try {
      await renumberHierarchy();
      await alertDialog('层级重编号成功！全部章节与场景序号已规范连续。');
    } catch (err) {
      await alertDialog('重编号失败: ' + err);
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

  // 章节过滤与排序
  const filteredChapters = chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `第${c.chapter_number}章`.includes(searchQuery)
    )
    .sort((a, b) => {
      if (listSortOrder === 'WORD_DESC') return (b.word_count || 0) - (a.word_count || 0);
      if (listSortOrder === 'WORD_ASC') return (a.word_count || 0) - (b.word_count || 0);
      return a.chapter_number - b.chapter_number;
    });

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);
  const maxChapterWordCount = Math.max(...chapters.map((c) => c.word_count || 0), 1);
  const estReadingMinutes = Math.max(1, Math.round(totalWords / 500));

  const formatWordCountDisplay = (count?: number) => {
    const n = count || 0;
    if (n >= 10000) {
      return `${(n / 10000).toFixed(1)}万字`;
    }
    return `${n.toLocaleString()}字`;
  };

  const handleOpenCreateChapter = (volumeId?: string) => {
    setSelectedVolumeIdForNewChapter(volumeId);
    setShowCreateChapter(true);
  };

  const handleDeleteVolume = async (
    volumeId: string,
    title: string,
    number: number,
    childrenCount: number
  ) => {
    const displayName = formatNodeDisplayTitle(title, 'VOLUME', number);
    const msg =
      childrenCount > 0
        ? `确定要删除分卷《${displayName}》吗？\n注意：此分卷下的 ${childrenCount} 个章节将被安全保留并转为未分卷章节，绝不会丢失内容。`
        : `确定要彻底删除分卷《${displayName}》吗？`;

    if (await confirmDialog(msg)) {
      try {
        await deleteVolume(volumeId);
      } catch (err) {
        await alertDialog('删除分卷失败: ' + err);
      }
    }
  };

  const handleRenameChapter = async (chapterId: string, currentTitle: string) => {
    const rawClean = cleanTitlePrefix(currentTitle, 'CHAPTER') || currentTitle;
    const newTitle = await promptDialog({ message: '请输入新的章节标题：', defaultValue: rawClean });
    if (newTitle !== null) {
      const trimmed = newTitle.trim();
      if (trimmed && trimmed !== currentTitle) {
        try {
          await updateChapterTitle(chapterId, trimmed);
        } catch (err) {
          await alertDialog('修改章节标题失败: ' + err);
        }
      }
    }
  };

  const handleRenameVolume = async (volumeId: string, currentTitle: string) => {
    const rawClean = cleanTitlePrefix(currentTitle, 'VOLUME') || currentTitle;
    const newTitle = await promptDialog({ message: '请输入新的分卷标题：', defaultValue: rawClean });
    if (newTitle !== null) {
      const trimmed = newTitle.trim();
      if (trimmed && trimmed !== currentTitle) {
        try {
          await updateVolume({ id: volumeId, title: trimmed });
        } catch (err) {
          await alertDialog('修改分卷标题失败: ' + err);
        }
      }
    }
  };

  // 递归渲染多层级大纲树节点（书卷与印章古典装帧感）
  const renderTreeNode = (node: ContentTreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] !== false; // 默认展开
    const isChapter = node.node_type === 'CHAPTER';
    const isScene = node.node_type === 'SCENE';
    const isPart = node.node_type === 'PART';
    const isVolume = node.node_type === 'VOLUME';

    const isActive =
      (isChapter && activeChapter?.id === node.id) ||
      (isScene && activeScene?.id === node.id);

    // 统计分卷下包含的章节数与总字数
    const volumeChapterCount = isVolume && node.children ? node.children.filter((c) => c.node_type === 'CHAPTER').length : 0;
    const volumeTotalWords = isVolume && node.children ? node.children.reduce((sum, c) => sum + (c.word_count || 0), 0) : 0;

    // 分卷节点：典雅卷轴卡片设计
    if (isVolume) {
      return (
        <div key={node.id} className="select-none my-1.5">
          <div
            onClick={() => toggleNodeExpanded(node.id)}
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
            className="group relative flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-all duration-200 border bg-gradient-to-r from-[#ebe3d3] to-[#f4ede0] dark:from-[#26221d] dark:to-[#1e1b18] border-[#d8cdb8] dark:border-[#38332c] hover:border-amber-800/40 hover:shadow-xs text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpanded(node.id);
                }}
                className="p-0.5 rounded text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {/* 卷标印章 */}
              <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-serif font-bold bg-indigo-900/10 dark:bg-indigo-400/15 text-indigo-950 dark:text-indigo-300 border border-indigo-900/20">
                卷{node.number}
              </span>

              <span className="font-serif font-bold text-xs text-ink dark:text-[#ede6dc] truncate">
                {cleanTitlePrefix(node.title, 'VOLUME') || node.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-ink-2 dark:text-[#9e9486] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                {volumeChapterCount}章 · {formatWordCountDisplay(volumeTotalWords)}
              </span>

              {/* 悬停操作组 */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateChapter(node.id);
                  }}
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                  title="在此卷下添加章节"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameVolume(node.id, node.title);
                  }}
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                  title="重命名此分卷"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVolume(
                      node.id,
                      node.title,
                      node.number,
                      (node.children || []).length
                    );
                  }}
                  className="p-1 rounded text-ink-2 hover:text-rose-700 hover:bg-rose-800/10 transition cursor-pointer"
                  title="删除此分卷"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 展开的章节子集 */}
          {isExpanded && node.children && node.children.length > 0 && (
            <div className="space-y-0.5 mt-1 border-l border-line/60 dark:border-[#38332c] ml-3 pl-1">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}

          {/* 若分卷已展开且无子章节，提供直观温馨的新建指引 */}
          {isExpanded && (!node.children || node.children.length === 0) && (
            <div
              style={{ paddingLeft: `${(depth + 1) * 10 + 8}px` }}
              className="py-2 px-3 my-1 mr-2 rounded-xl bg-amber-800/5 dark:bg-amber-400/5 border border-dashed border-amber-800/20 dark:border-amber-400/20 flex items-center justify-between text-[11px] text-ink-2"
            >
              <span className="italic font-serif">该卷暂无章节内容</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCreateChapter(node.id);
                }}
                className="text-primary hover:text-primary font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                添加本卷第 1 章
              </button>
            </div>
          )}
        </div>
      );
    }

    // 分部节点 (PART)
    if (isPart) {
      return (
        <div key={node.id} className="select-none my-2">
          <div
            onClick={() => toggleNodeExpanded(node.id)}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-purple-900/10 dark:bg-purple-400/10 border border-purple-900/20 text-xs font-serif font-bold text-purple-950 dark:text-purple-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-800 dark:text-purple-300" />
              <span>{formatNodeDisplayTitle(node.title, 'PART', node.number)}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpanded(node.id);
              }}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
          {isExpanded && node.children && (
            <div className="space-y-0.5 mt-1">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // 章节节点 (CHAPTER) - 线装书目质感卡片
    if (isChapter) {
      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => {
              const ch = chapters.find((c) => c.id === node.id);
              if (ch) selectChapter(ch);
            }}
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
            className={`group relative flex items-center justify-between py-2 pr-2.5 my-0.5 rounded-xl cursor-pointer transition-all duration-150 text-xs border ${
              isActive
                ? 'bg-[#fffefb] dark:bg-[#282420] text-amber-950 dark:text-amber-100 font-medium border-amber-800/40 dark:border-amber-600/50 shadow-xs ring-1 ring-amber-800/15'
                : 'border-transparent text-[#443d34] dark:text-[#c4bbb0] hover:text-[#1a1816] hover:bg-surface-3 dark:hover:bg-[#221f1c]'
            }`}
          >
            {/* 激活时的朱砂书签折痕指示条 */}
            {isActive && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-800 dark:bg-amber-500 shadow-xs" />
            )}

            <div className="flex items-center gap-2 min-w-0 flex-1 pl-1.5">
              {/* 树节点如果有子场景则显示展开箭头 */}
              {node.children && node.children.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeExpanded(node.id);
                  }}
                  className="p-0.5 text-ink-2 hover:text-ink"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}

              {/* 章节序号印章 */}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0 font-medium tracking-tighter ${
                  isActive
                    ? 'bg-amber-800 text-amber-50 shadow-xs'
                    : 'bg-surface-3 dark:bg-[#332e29] text-ink-2 dark:text-[#9e9486]'
                }`}
              >
                {node.number.toString().padStart(2, '0')}
              </span>

              {/* 章节标题 */}
              <span className={`truncate font-serif tracking-wide ${isActive ? 'font-bold text-ink dark:text-white' : ''}`}>
                {cleanTitlePrefix(node.title, 'CHAPTER') || node.title}
              </span>
            </div>

            {/* 右侧元数据与悬浮操作 */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {/* 关联剧情伏笔数徽标 */}
              {node.associated_plot_count > 0 && (
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 border border-amber-800/20 font-mono flex items-center gap-0.5"
                  title={`关联 ${node.associated_plot_count} 条剧情伏笔线索`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {node.associated_plot_count}
                </span>
              )}

              {/* 字数胶囊 */}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-medium'
                    : 'text-ink-2 dark:text-[#9e9486]'
                }`}
              >
                {node.word_count > 0 ? `${node.word_count.toLocaleString()}字` : '待撰'}
              </span>

              {/* 悬停操作工具组 */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                <button
                  type="button"
                  onClick={async (e) => {
                    const ch = chapters.find((c) => c.id === node.id);
                    const plainText = (ch?.content || '').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
                    await handleCopyChapter(node.id, plainText || node.title, e);
                  }}
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                  title={copyFeedbackId === node.id ? '已复制！' : '复制纯文本'}
                >
                  {copyFeedbackId === node.id ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameChapter(node.id, node.title);
                  }}
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                  title="重命名此章节"
                >
                  <Pencil className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (await confirmDialog(`确定要删除章节《${node.title}》吗？`)) {
                      try {
                        await deleteChapter(node.id);
                      } catch (err) {
                        await alertDialog('删除章节失败: ' + err);
                      }
                    }
                  }}
                  className="p-1 rounded text-ink-2 hover:text-rose-700 hover:bg-rose-800/10 transition cursor-pointer"
                  title="删除章节"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 展开的场景子节点 */}
          {isExpanded && node.children && node.children.length > 0 && (
            <div className="space-y-0.5 mt-0.5 border-l border-emerald-800/20 ml-4 pl-1.5">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // 场景节点 (SCENE) - 戏剧细纲与节拍卡片
    if (isScene) {
      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => {
              const sc = scenes.find((s) => s.id === node.id);
              if (sc) selectScene(sc);
            }}
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
            className={`group flex items-center justify-between py-1 px-2 my-0.5 rounded-lg cursor-pointer transition text-xs border ${
              isActive
                ? 'bg-emerald-800/10 dark:bg-emerald-400/10 text-emerald-950 dark:text-emerald-200 font-medium border-emerald-800/30'
                : 'border-transparent text-ink-2 dark:text-[#a89d8f] hover:text-[#1a1816] hover:bg-emerald-800/5'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Clapperboard className="w-3 h-3 text-emerald-800 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {formatNodeDisplayTitle(node.title, 'SCENE', node.number)}
              </span>
            </div>

            {node.word_count > 0 && (
              <span className="text-[10px] text-ink-2 font-mono">
                {node.word_count}字
              </span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <aside className="w-80 border-r border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#1c1917] flex flex-col shrink-0 select-none h-full shadow-sm">
        {/* Novel Selector Header - 替换原生 select，接入奢华典雅书卷下拉组件 */}
        <div className="p-3 border-b border-line dark:border-[#2e2a27] bg-surface-2/50 dark:bg-[#1a1715]/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-ink-2 dark:text-[#a89d8f] uppercase tracking-wider flex items-center gap-1.5 font-serif">
              <BookOpen className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
              当前创作工程
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowWordImportModal(true)}
                className="text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-900 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-blue-800/10 cursor-pointer"
                title="导入已有 Word (.docx) 存稿并智能分卷分章"
              >
                <FileText className="w-3 h-3" />
                导入Word
              </button>
              <button
                type="button"
                onClick={() => setShowCreateNovel(true)}
                className="text-xs text-primary dark:text-amber-400 hover:text-primary font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-800/10 cursor-pointer"
                title="开启全新小说作品"
              >
                <Plus className="w-3.5 h-3.5" />
                新建
              </button>
              {activeNovel && (
                <button
                  type="button"
                  onClick={handleDeleteNovel}
                  className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-rose-800/10 cursor-pointer"
                  title={`删除当前作品《${activeNovel.title}》`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              )}
            </div>
          </div>

          <NovelSelectorDropdown
            onOpenCreateNovel={() => setShowCreateNovel(true)}
            onOpenWordImport={() => setShowWordImportModal(true)}
          />
        </div>

        {/* View Mode & Hierarchy Toolbar */}
        <div className="px-3 py-2 border-b border-line dark:border-[#2e2a27] bg-surface-2/30 dark:bg-[#1a1715]/40 flex items-center justify-between">
          <div className="flex items-center bg-surface-2 dark:bg-[#25221e] p-0.5 rounded-lg border border-line dark:border-[#38332c] text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('TREE')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-serif transition cursor-pointer ${
                viewMode === 'TREE'
                  ? 'bg-surface dark:bg-[#322d28] text-primary dark:text-amber-200 font-bold shadow-xs'
                  : 'text-ink-2 dark:text-[#a89d8f] hover:text-ink'
              }`}
              title="多层级大纲树视图 (部/卷/章/场景)"
            >
              <Layers className="w-3 h-3" />
              大纲树
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-serif transition cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-surface dark:bg-[#322d28] text-primary dark:text-amber-200 font-bold shadow-xs'
                  : 'text-ink-2 dark:text-[#a89d8f] hover:text-ink'
              }`}
              title="平铺章节目录列表"
            >
              <List className="w-3 h-3" />
              章节表
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRenumber}
              className="p-1.5 rounded-lg text-ink-2 dark:text-[#a89d8f] hover:text-primary hover:bg-surface-3-hover dark:hover:bg-[#2b2723] transition cursor-pointer"
              title="全书规范化重编号 (自动整理部/卷/章/场景连续序号)"
            >
              <Hash className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateVolume(true)}
              disabled={!activeNovel}
              className="px-2 py-1 rounded-lg bg-indigo-800/10 hover:bg-indigo-800/20 text-indigo-900 dark:text-indigo-300 border border-indigo-800/25 text-[11px] font-medium flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-40"
              title="为此作品新建分卷"
            >
              <BookOpen className="w-3 h-3 text-indigo-800 dark:text-indigo-400" />
              加卷
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateChapter()}
              disabled={!activeNovel}
              className="px-2 py-1 rounded-lg bg-amber-800/10 hover:bg-amber-800/20 text-primary dark:text-amber-300 border border-amber-800/25 text-[11px] font-medium flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
              加章
            </button>
          </div>
        </div>

        {/* 全书创作看板概括卡 (Novel Stats Card) */}
        <div className="px-3 py-2.5 border-b border-line dark:border-[#2e2a27] bg-surface-2/60 dark:bg-[#1a1715]/40 space-y-2">
          {/* 3 列微型指标栅格 */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-1.5 rounded-lg bg-[#efe8dc]/70 dark:bg-[#25221e] border border-[#dcd1bf] dark:border-[#38332c] text-center">
              <span className="block text-[10px] text-ink-2 dark:text-[#a89d8f]">总章节</span>
              <span className="font-serif font-bold text-xs text-ink dark:text-[#ede6dc]">
                {chapters.length} <span className="text-[10px] font-normal text-ink-2">章</span>
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#efe8dc]/70 dark:bg-[#25221e] border border-[#dcd1bf] dark:border-[#38332c] text-center">
              <span className="block text-[10px] text-ink-2 dark:text-[#a89d8f]">累计字数</span>
              <span className="font-serif font-bold text-xs text-ink dark:text-[#ede6dc]">
                {formatWordCountDisplay(totalWords)}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#efe8dc]/70 dark:bg-[#25221e] border border-[#dcd1bf] dark:border-[#38332c] text-center">
              <span className="block text-[10px] text-ink-2 dark:text-[#a89d8f]">预计读时</span>
              <span className="font-serif font-bold text-xs text-ink dark:text-[#ede6dc]">
                ~{estReadingMinutes} <span className="text-[10px] font-normal text-ink-2">分</span>
              </span>
            </div>
          </div>

          {/* 搜索过滤框与排序条 */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-2" />
              <input
                type="text"
                placeholder="搜索章节、分卷或场景..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface dark:bg-[#24201c] border border-line dark:border-[#38332c] rounded-lg pl-8 pr-7 py-1.5 text-xs text-ink dark:text-[#ede6dc] placeholder-[#8e8476] focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-ink-2 hover:text-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {viewMode === 'LIST' && (
              <button
                type="button"
                onClick={() => {
                  setListSortOrder((prev) =>
                    prev === 'DEFAULT' ? 'WORD_DESC' : prev === 'WORD_DESC' ? 'WORD_ASC' : 'DEFAULT'
                  );
                }}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  listSortOrder !== 'DEFAULT'
                    ? 'bg-amber-800/10 text-primary border-amber-800/30'
                    : 'bg-[#efe8dc] dark:bg-[#25221e] text-ink-2 border-[#dcd1bf] dark:border-[#38332c]'
                }`}
                title={`当前排序：${
                  listSortOrder === 'DEFAULT'
                    ? '默认章节序号'
                    : listSortOrder === 'WORD_DESC'
                    ? '字数由多到少'
                    : '字数由少到多'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tree View or List View */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
          {viewMode === 'TREE' && contentTree && contentTree.root_nodes.length > 0 ? (
            <div className="space-y-1">
              {contentTree.root_nodes.map((node) => renderTreeNode(node))}
            </div>
          ) : (
            filteredChapters.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FolderOpen className="w-10 h-10 text-primary/40 dark:text-amber-400/40 mx-auto mb-2.5" />
                <p className="text-xs font-serif text-ink-2 dark:text-[#a89d8f] mb-3.5">
                  {searchQuery ? '未找到相关章节或分卷' : '当前作品暂无章节或分卷内容'}
                </p>
                {activeNovel && !searchQuery && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateChapter()}
                      className="px-3 py-1.5 rounded-xl bg-amber-800 text-amber-50 text-xs font-medium hover:bg-amber-700 transition inline-flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      新建第一章
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateVolume(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-[#2b2723] text-indigo-950 dark:text-indigo-200 text-xs font-medium hover:bg-surface-3-hover transition inline-flex items-center gap-1 border border-line dark:border-[#38332c] cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-800 dark:text-indigo-400" />
                      新建分卷
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredChapters.map((ch) => {
                const isActive = activeChapter?.id === ch.id;
                const chapterWords = ch.word_count || 0;
                const ratio = Math.min(100, Math.round((chapterWords / maxChapterWordCount) * 100));

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
                      {/* 单章篇幅指示进度条 (悬停时隐藏，让位于操作工具组) */}
                      <div className="w-12 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden hidden sm:block group-hover:hidden transition-all" title={`篇幅占比：约 ${ratio}%`}>
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

                      {/* 悬停操作按钮 */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                        <button
                          type="button"
                          onClick={async (e) => {
                            const plainText = (ch.content || '').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
                            await handleCopyChapter(ch.id, plainText || ch.title, e);
                          }}
                          className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                          title={copyFeedbackId === ch.id ? '已复制！' : '复制正文'}
                        >
                          {copyFeedbackId === ch.id ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChapter(ch.id, ch.title);
                          }}
                          className="p-1 rounded text-ink-2 hover:text-primary hover:bg-amber-800/10 transition cursor-pointer"
                          title="重命名章节"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (await confirmDialog(`确定要删除第 ${ch.chapter_number} 章《${ch.title}》吗？`)) {
                              try {
                                await deleteChapter(ch.id);
                              } catch (err) {
                                await alertDialog('删除章节失败: ' + err);
                              }
                            }
                          }}
                          className="p-1 rounded text-ink-2 hover:text-rose-700 hover:bg-rose-800/10 transition cursor-pointer"
                          title="删除章节"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer: Chapter Actions (Split, Merge, Version) */}
        {activeChapter && (
          <div className="p-2.5 border-t border-line bg-surface-2/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSplitPoint(Math.floor((activeChapter.word_count || 1000) / 2));
                  setNewChapterTitle(`第 ${activeChapter.chapter_number} 章（续）：`);
                  setShowSplitModal(true);
                }}
                className="p-1 rounded text-[#5a5247] hover:text-primary hover:bg-surface-3-hover transition flex items-center gap-1 text-[11px]"
                title="拆分当前章节（在指定字数处一分为二）"
              >
                <Split className="w-3.5 h-3.5 text-primary" />
                拆分
              </button>

              <button
                onClick={() => {
                  const otherChapters = chapters.filter((c) => c.id !== activeChapter.id);
                  if (otherChapters.length > 0) {
                    setMergeTargetChapterId(otherChapters[0].id);
                  }
                  setShowMergeModal(true);
                }}
                className="p-1 rounded text-[#5a5247] hover:text-primary hover:bg-surface-3-hover transition flex items-center gap-1 text-[11px]"
                title="将当前章节合并入另一章节"
              >
                <Merge className="w-3.5 h-3.5 text-primary" />
                合并
              </button>

              <button
                onClick={() => setShowVersions(true)}
                className="p-1 rounded text-[#5a5247] hover:text-primary hover:bg-surface-3-hover transition flex items-center gap-1 text-[11px]"
                title="查看与回退历史草稿快照"
              >
                <History className="w-3.5 h-3.5 text-primary" />
                版本
              </button>
            </div>

            <span className="text-[11px] text-ink-2 font-mono">
              {activeChapter.word_count || 0} 字
            </span>
          </div>
        )}
      </aside>

      {/* Modal: Split Chapter */}
      {showSplitModal && activeChapter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-ink mb-2 flex items-center gap-2">
              <Split className="w-4 h-4 text-primary" />
              拆分章节：第 {activeChapter.chapter_number} 章《{activeChapter.title}》
            </h3>
            <p className="text-xs text-ink-2 mb-4">
              系统将在拆分点截断正文，自动生成新章节，并将后继章节重新编号，且两章均会自动保存历史快照。
            </p>

            <form onSubmit={handleSplitChapter} className="space-y-3.5 text-xs font-serif">
              <div>
                <label className="block text-ink-2 mb-1">
                  拆分字符偏移点 (当前总字数: {activeChapter.word_count || 0})
                </label>
                <input
                  type="number"
                  value={splitPoint}
                  min={1}
                  max={activeChapter.word_count || 100000}
                  onChange={(e) => setSplitPoint(parseInt(e.target.value, 10))}
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="block text-ink-2 mb-1">新章节标题</label>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="例如：第 1 章（续）：深空觉醒"
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-4 py-2 text-xs text-ink-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                >
                  执行安全拆分
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Merge Chapters */}
      {showMergeModal && activeChapter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-ink mb-2 flex items-center gap-2">
              <Merge className="w-4 h-4 text-primary" />
              合并章节：将第 {activeChapter.chapter_number} 章并入其他章节
            </h3>
            <p className="text-xs text-ink-2 mb-4">
              两章正文将以双换行拼接，本章所属的场景将自动归属到目标章节，原剧情关联安全平滑转移。
            </p>

            <form onSubmit={handleMergeChapter} className="space-y-3.5 text-xs font-serif">
              <div>
                <label className="block text-ink-2 mb-1">选择目标合并章节</label>
                <select
                  value={mergeTargetChapterId}
                  onChange={(e) => setMergeTargetChapterId(e.target.value)}
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink"
                >
                  <option value="">请选择目标章节...</option>
                  {chapters
                    .filter((c) => c.id !== activeChapter.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        第 {c.chapter_number} 章: {c.title} ({c.word_count || 0}字)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 text-xs text-ink-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                >
                  确认合并
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateNovel && <CreateNovelModal onClose={() => setShowCreateNovel(false)} />}
      {showCreateChapter && (
        <CreateChapterModal
          defaultVolumeId={selectedVolumeIdForNewChapter}
          onClose={() => {
            setShowCreateChapter(false);
            setSelectedVolumeIdForNewChapter(undefined);
          }}
        />
      )}
      {showVersions && <VersionDrawer onClose={() => setShowVersions(false)} />}
      {showWordImportModal && <WordImportModal isOpen={showWordImportModal} onClose={() => setShowWordImportModal(false)} />}
      {showCreateVolume && <CreateVolumeModal onClose={() => setShowCreateVolume(false)} />}
    </>
  );
};
