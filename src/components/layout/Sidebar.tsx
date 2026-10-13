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
  Layers,
  List,
  Split,
  Merge,
  Hash,
  ChevronRight,
  ChevronDown,
  Clapperboard,
} from 'lucide-react';
import { CreateNovelModal } from '@/components/modals/CreateNovelModal';
import { CreateChapterModal } from '@/components/modals/CreateChapterModal';
import { VersionDrawer } from '@/components/modals/VersionDrawer';
import type { ContentTreeNode } from '@/types';

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
    contentTree,
    scenes,
    activeScene,
    selectScene,
    splitChapter,
    mergeChapters,
    renumberHierarchy,
  } = useNovelStore();

  const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('TREE');
  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
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

  const handleSplitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter) return;
    try {
      await splitChapter(splitPoint, newChapterTitle.trim() || undefined);
      setShowSplitModal(false);
      setNewChapterTitle('');
      alert('章节拆分成功！已保留原版本快照并重新排定后继章节。');
    } catch (err) {
      alert('拆分章节失败: ' + err);
    }
  };

  const handleMergeChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter || !mergeTargetChapterId) return;
    if (activeChapter.id === mergeTargetChapterId) {
      alert('不能将章节与自身合并！');
      return;
    }
    if (!confirm(`确定将当前章节《${activeChapter.title}》合并入目标章节吗？原章节场景将重新挂载，剧情关联平滑转移。`)) return;

    try {
      await mergeChapters(activeChapter.id, mergeTargetChapterId);
      setShowMergeModal(false);
      setMergeTargetChapterId('');
      alert('章节合并成功！正文已拼接，子场景与剧情关联已安全转移。');
    } catch (err) {
      alert('合并章节失败: ' + err);
    }
  };

  const handleRenumber = async () => {
    if (!confirm('确定对全书所有层级（部、卷、章、场景）执行全局连续重编号吗？')) return;
    try {
      await renumberHierarchy();
      alert('层级重编号成功！全部章节与场景序号已规范连续。');
    } catch (err) {
      alert('重编号失败: ' + err);
    }
  };

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `第${c.chapter_number}章`.includes(searchQuery)
  );

  const renderTreeNode = (node: ContentTreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] !== false; // Default expanded
    const isChapter = node.node_type === 'CHAPTER';
    const isScene = node.node_type === 'SCENE';
    const isPart = node.node_type === 'PART';
    const isVolume = node.node_type === 'VOLUME';

    const isActive =
      (isChapter && activeChapter?.id === node.id) ||
      (isScene && activeScene?.id === node.id);

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => {
            if (isChapter) {
              const ch = chapters.find((c) => c.id === node.id);
              if (ch) selectChapter(ch);
            } else if (isScene) {
              const sc = scenes.find((s) => s.id === node.id);
              if (sc) selectScene(sc);
            } else {
              toggleNodeExpanded(node.id);
            }
          }}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition text-xs border ${
            isActive
              ? 'bg-[#fdfbf7] text-amber-900 font-semibold border-amber-800/30 shadow-xs'
              : 'border-transparent text-[#5a5247] hover:text-[#1f1d1a] hover:bg-[#eae3d4]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {node.children && node.children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpanded(node.id);
                }}
                className="p-0.5 text-[#8e8476] hover:text-[#2b2621]"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5 h-3.5" />
            )}

            {isPart && <Layers className="w-3.5 h-3.5 text-purple-800 shrink-0" />}
            {isVolume && <BookOpen className="w-3.5 h-3.5 text-indigo-800 shrink-0" />}
            {isChapter && <Book className="w-3.5 h-3.5 text-amber-800 shrink-0" />}
            {isScene && <Clapperboard className="w-3.5 h-3.5 text-emerald-800 shrink-0" />}

            <span className="truncate">
              {isPart && `第 ${node.number} 篇: `}
              {isVolume && `第 ${node.number} 卷: `}
              {isChapter && `第 ${node.number} 章: `}
              {isScene && `幕 ${node.number}: `}
              {node.title}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {node.word_count > 0 && (
              <span className="text-[10px] text-[#8e8476] font-mono">
                {node.word_count}字
              </span>
            )}
            {node.associated_plot_count > 0 && (
              <span className="text-[9px] px-1 rounded bg-amber-800/10 text-amber-900 border border-amber-800/20" title="关联剧情线索数">
                {node.associated_plot_count}
              </span>
            )}
          </div>
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="space-y-0.5 mt-0.5">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className="w-80 border-r border-[#ded5c4] bg-[#f3ede1]/95 backdrop-blur-xl flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)] shadow-sm">
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

        {/* View Mode & Hierarchy Toolbar */}
        <div className="px-3 py-2 border-b border-[#ded5c4] bg-[#eae2d3]/30 flex items-center justify-between">
          <div className="flex items-center bg-[#efe9dc] p-0.5 rounded-lg border border-[#d5cbb8] text-[11px]">
            <button
              onClick={() => setViewMode('TREE')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-serif transition ${
                viewMode === 'TREE'
                  ? 'bg-[#fdfbf7] text-amber-900 font-bold shadow-xs'
                  : 'text-[#786f65] hover:text-[#2b2621]'
              }`}
              title="多层级大纲树视图 (部/卷/章/场景)"
            >
              <Layers className="w-3 h-3" />
              大纲树
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-serif transition ${
                viewMode === 'LIST'
                  ? 'bg-[#fdfbf7] text-amber-900 font-bold shadow-xs'
                  : 'text-[#786f65] hover:text-[#2b2621]'
              }`}
              title="平铺章节目录列表"
            >
              <List className="w-3 h-3" />
              章节表
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRenumber}
              className="p-1 rounded text-[#786f65] hover:text-amber-900 hover:bg-[#ded4c3] transition"
              title="全书规范化重编号 (自动整理部/卷/章/场景连续序号)"
            >
              <Hash className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCreateChapter(true)}
              disabled={!activeNovel}
              className="px-2 py-1 rounded-md bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/25 text-[11px] font-medium flex items-center gap-1 transition shadow-xs"
            >
              <Plus className="w-3 h-3" />
              加章
            </button>
          </div>
        </div>

        {/* Search Bar & Novel Stats Overview */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8e8476]" />
            <input
              type="text"
              placeholder="搜索章节、场景或序号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700 shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-[#786f65]">
            <span>全书累计统计:</span>
            <span className="font-mono font-medium text-[#2b2621]">
              <strong>{chapters.length}</strong> 章 · <strong>{chapters.reduce((sum, c) => sum + (c.word_count || 0), 0).toLocaleString()}</strong> 字
            </span>
          </div>
        </div>

        {/* Tree View or List View */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {viewMode === 'TREE' && contentTree && contentTree.root_nodes.length > 0 ? (
            <div className="space-y-1">
              {contentTree.root_nodes.map((node) => renderTreeNode(node))}
            </div>
          ) : (
            filteredChapters.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FolderOpen className="w-8 h-8 text-[#9e9383] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#786f65] mb-3">暂无章节内容</p>
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
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition text-xs border ${
                      isActive
                        ? 'bg-[#fdfbf7] text-amber-900 font-medium border-amber-800/30 shadow-xs'
                        : 'border-transparent text-[#5a5247] hover:text-[#1f1d1a] hover:bg-[#eae3d4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                        isActive ? 'bg-amber-800/15 text-amber-900 font-semibold' : 'bg-[#e4dcce] text-[#786f65]'
                      }`}>
                        {ch.chapter_number.toString().padStart(2, '0')}
                      </span>
                      <span className="truncate text-[#2b2621]">{ch.title}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-[#786f65] font-mono px-1 py-0.5 rounded bg-[#e8e0d0] border border-[#dcd1be]">
                        {ch.word_count || 0}字
                      </span>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const plainText = (ch.content || '').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
                          await navigator.clipboard.writeText(plainText || ch.title);
                          alert(`已复制第 ${ch.chapter_number} 章内容到剪贴板！`);
                        }}
                        className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#ded4c3] transition opacity-0 group-hover:opacity-100"
                        title="复制纯文本"
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
            )
          )}
        </div>

        {/* Footer: Chapter Actions (Split, Merge, Version) */}
        {activeChapter && (
          <div className="p-2.5 border-t border-[#ded5c4] bg-[#eae2d3]/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSplitPoint(Math.floor((activeChapter.word_count || 1000) / 2));
                  setNewChapterTitle(`第 ${activeChapter.chapter_number} 章（续）：`);
                  setShowSplitModal(true);
                }}
                className="p-1 rounded text-[#5a5247] hover:text-amber-900 hover:bg-[#ded4c3] transition flex items-center gap-1 text-[11px]"
                title="拆分当前章节（在指定字数处一分为二）"
              >
                <Split className="w-3.5 h-3.5 text-amber-800" />
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
                className="p-1 rounded text-[#5a5247] hover:text-amber-900 hover:bg-[#ded4c3] transition flex items-center gap-1 text-[11px]"
                title="将当前章节合并入另一章节"
              >
                <Merge className="w-3.5 h-3.5 text-amber-800" />
                合并
              </button>

              <button
                onClick={() => setShowVersions(true)}
                className="p-1 rounded text-[#5a5247] hover:text-amber-900 hover:bg-[#ded4c3] transition flex items-center gap-1 text-[11px]"
                title="查看与回退历史草稿快照"
              >
                <History className="w-3.5 h-3.5 text-amber-800" />
                版本
              </button>
            </div>

            <span className="text-[11px] text-[#786f65] font-mono">
              {activeChapter.word_count || 0} 字
            </span>
          </div>
        )}
      </aside>

      {/* Modal: Split Chapter */}
      {showSplitModal && activeChapter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-[#1f1d1a] mb-2 flex items-center gap-2">
              <Split className="w-4 h-4 text-amber-800" />
              拆分章节：第 {activeChapter.chapter_number} 章《{activeChapter.title}》
            </h3>
            <p className="text-xs text-[#786f65] mb-4">
              系统将在拆分点截断正文，自动生成新章节，并将后继章节重新编号，且两章均会自动保存历史快照。
            </p>

            <form onSubmit={handleSplitChapter} className="space-y-3.5 text-xs font-serif">
              <div>
                <label className="block text-[#685f54] mb-1">
                  拆分字符偏移点 (当前总字数: {activeChapter.word_count || 0})
                </label>
                <input
                  type="number"
                  value={splitPoint}
                  min={1}
                  max={activeChapter.word_count || 100000}
                  onChange={(e) => setSplitPoint(parseInt(e.target.value, 10))}
                  required
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621]"
                />
              </div>

              <div>
                <label className="block text-[#685f54] mb-1">新章节标题</label>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="例如：第 1 章（续）：深空觉醒"
                  required
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ded5c4]">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-4 py-2 text-xs text-[#685f54]"
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
          <div className="bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-[#1f1d1a] mb-2 flex items-center gap-2">
              <Merge className="w-4 h-4 text-amber-800" />
              合并章节：将第 {activeChapter.chapter_number} 章并入其他章节
            </h3>
            <p className="text-xs text-[#786f65] mb-4">
              两章正文将以双换行拼接，本章所属的场景将自动归属到目标章节，原剧情关联安全平滑转移。
            </p>

            <form onSubmit={handleMergeChapter} className="space-y-3.5 text-xs font-serif">
              <div>
                <label className="block text-[#685f54] mb-1">选择目标合并章节</label>
                <select
                  value={mergeTargetChapterId}
                  onChange={(e) => setMergeTargetChapterId(e.target.value)}
                  required
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621]"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ded5c4]">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 text-xs text-[#685f54]"
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
      {showCreateChapter && <CreateChapterModal onClose={() => setShowCreateChapter(false)} />}
      {showVersions && <VersionDrawer onClose={() => setShowVersions(false)} />}
    </>
  );
};
