import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { PlotThread } from '@/types';
import {
  Bookmark,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PLANTED: { label: '已埋设', color: 'bg-amber-800/10 text-amber-800 border-amber-800/20', icon: Clock },
  DEVELOPING: { label: '发酵推进中', color: 'bg-blue-800/10 text-blue-800 border-blue-800/20', icon: Sparkles },
  READY_TO_RESOLVE: { label: '临界回收', color: 'bg-purple-800/10 text-purple-800 border-purple-800/20', icon: AlertCircle },
  RESOLVED: { label: '已揭秘闭合', color: 'bg-emerald-800/10 text-emerald-800 border-emerald-800/20', icon: CheckCircle2 },
  ABANDONED: { label: '已废弃/遗忘', color: 'bg-stone-500/10 text-stone-600 border-stone-500/20', icon: X },
};

export const PlotThreadsPanel: React.FC = () => {
  const { activeNovel, chapters } = useNovelStore();
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introducedChapterId, setIntroducedChapterId] = useState('');
  const [expectedResolution, setExpectedResolution] = useState('');

  const loadThreads = async () => {
    if (!activeNovel) return;
    try {
      const list = await api.listPlotThreads(activeNovel.id);
      setThreads(list);
    } catch (e) {
      console.error('加载伏笔列表失败:', e);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [activeNovel?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !title.trim()) return;

    await api.createPlotThread({
      novel_id: activeNovel.id,
      title: title.trim(),
      description: description.trim(),
      introduced_chapter_id: introducedChapterId || undefined,
      expected_resolution: expectedResolution.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setIntroducedChapterId('');
    setExpectedResolution('');
    setShowAddModal(false);
    loadThreads();
  };

  const filtered = threads.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择或创建小说项目以管理伏笔线索
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">伏笔与悬念追踪 ({threads.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Plus className="w-3 h-3" />
          埋设新伏笔
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#fdfbf7]/80 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8e8476]" />
          <input
            type="text"
            placeholder="搜索伏笔暗线、谜题关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded pl-7 pr-2 py-1 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2 py-1 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700 shrink-0"
        >
          <option value="ALL">全部状态 ({threads.length})</option>
          <option value="PLANTED">已埋设</option>
          <option value="DEVELOPING">发酵中</option>
          <option value="READY_TO_RESOLVE">临界回收</option>
          <option value="RESOLVED">已闭合</option>
        </select>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#786f65]">
            <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-800" />
            <p>暂无匹配的伏笔线索，点击右上角【埋设新伏笔】记录</p>
          </div>
        ) : (
          filtered.map((thread) => {
            const statusConfig = STATUS_MAP[thread.status] || STATUS_MAP.PLANTED;
            const StatusIcon = statusConfig.icon;
            const introChapter = chapters.find((c) => c.id === thread.introduced_chapter_id);

            return (
              <div
                key={thread.id}
                className="bg-[#fdfbf7] border border-[#dcd3c1] hover:border-amber-800/40 rounded-lg p-3 transition shadow-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-[#854d0e]">{thread.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConfig.label}
                  </span>
                </div>

                {thread.description && (
                  <p className="text-[11px] leading-relaxed text-[#4b4337] font-serif mb-2 whitespace-pre-wrap">
                    {thread.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#786f65] pt-1.5 border-t border-[#eee6d8]">
                  {introChapter && (
                    <span>
                      <strong>埋设位置：</strong>第 {introChapter.chapter_number} 章《{introChapter.title}》
                    </span>
                  )}
                  {thread.expected_resolution && (
                    <span className="text-[#854d0e]">
                      <strong>预期回收：</strong>{thread.expected_resolution}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Thread */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] border border-[#d5cbb8] rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded5c4] mb-3">
              <span className="font-bold text-sm text-[#2c2825]">埋设新剧情伏笔</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#786f65] hover:text-[#2c2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">伏笔线索名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：怀中玉佩的半道裂痕、神秘黑衣人的断剑之诺"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">埋设章节</label>
                <select
                  value={introducedChapterId}
                  onChange={(e) => setIntroducedChapterId(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                >
                  <option value="">未指定 / 灵感前期预设</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      第{ch.chapter_number}章: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">伏笔详情与暗线逻辑</label>
                <textarea
                  rows={3}
                  placeholder="详细记录此处伏笔的表层意图与深层玄机..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">预期揭秘/回收节点</label>
                <input
                  type="text"
                  placeholder="例如：第一卷高潮大决战前夕、主角突破元婴期之时"
                  value={expectedResolution}
                  onChange={(e) => setExpectedResolution(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-[#d5cbb8] text-[#554b3e] hover:bg-[#ede5d6]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium"
                >
                  确认埋设
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
