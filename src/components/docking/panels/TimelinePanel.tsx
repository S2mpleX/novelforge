import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { StoryEvent } from '@/types';
import {
  Clock,
  Plus,
  Search,
  Calendar,
  X,
  BookOpen,
} from 'lucide-react';

export const TimelinePanel: React.FC = () => {
  const { activeNovel, chapters } = useNovelStore();
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [storyTime, setStoryTime] = useState('');
  const [description, setDescription] = useState('');
  const [sourceChapterId, setSourceChapterId] = useState('');

  const loadEvents = async () => {
    if (!activeNovel) return;
    try {
      const list = await api.listStoryEvents(activeNovel.id);
      setEvents(list);
    } catch (e) {
      console.error('加载时间线事件失败:', e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeNovel?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !title.trim()) return;

    await api.createStoryEvent({
      novel_id: activeNovel.id,
      title: title.trim(),
      story_time: storyTime.trim() || undefined,
      description: description.trim() || undefined,
      source_chapter_id: sourceChapterId || undefined,
    });

    setTitle('');
    setStoryTime('');
    setDescription('');
    setSourceChapterId('');
    setShowAddModal(false);
    loadEvents();
  };

  const filtered = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.story_time?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择或创建小说项目以管理时间线
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">小说时间线与大事件谱 ({events.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Plus className="w-3 h-3" />
          添加时间线节点
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#fdfbf7]/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8e8476]" />
          <input
            type="text"
            placeholder="搜索时间、纪元或大事件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded pl-7 pr-2 py-1 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#786f65]">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-800" />
            <p>暂无时间线节点，点击右上角【添加时间线节点】记录</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-amber-800/30 ml-3 space-y-4">
            {filtered.map((ev) => {
              const ch = chapters.find((c) => c.id === ev.source_chapter_id);
              return (
                <div key={ev.id} className="relative pl-5 group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-amber-800 border-2 border-[#fdfbf7] shadow-xs group-hover:scale-125 transition-transform" />

                  <div className="bg-[#fdfbf7] border border-[#dcd3c1] hover:border-amber-800/40 rounded-lg p-2.5 transition shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#854d0e]">{ev.title}</span>
                      {ev.story_time && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-amber-900 border border-amber-800/20 font-mono font-medium">
                          {ev.story_time}
                        </span>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-[11px] leading-relaxed text-[#4b4337] font-serif mb-1.5 whitespace-pre-wrap">
                        {ev.description}
                      </p>
                    )}

                    {ch && (
                      <div className="text-[10px] text-[#786f65] pt-1 border-t border-[#eee6d8] flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-800" />
                        <span>
                          对应章节：第 {ch.chapter_number} 章《{ch.title}》
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] border border-[#d5cbb8] rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded5c4] mb-3">
              <span className="font-bold text-sm text-[#2c2825]">添加时间线节点</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#786f65] hover:text-[#2c2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">事件名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：圣火历 342 年黑潮破界、主角初入北冥宗"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">剧情故事时间 / 纪元</label>
                <input
                  type="text"
                  placeholder="例如：元狩二年三月望日、纪元前300年"
                  value={storyTime}
                  onChange={(e) => setStoryTime(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">关联小说章节</label>
                <select
                  value={sourceChapterId}
                  onChange={(e) => setSourceChapterId(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                >
                  <option value="">未指定 / 背景历史大事件</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      第{ch.chapter_number}章: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">事件详情与因果影响</label>
                <textarea
                  rows={3}
                  placeholder="详细记录事件经过、造成的伤亡或世界格局变化..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  确认落盘
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
