import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { StoryPhase } from '@/types';
import {
  Layers,
  Plus,
  X,
} from 'lucide-react';

export const PlotOutlinePanel: React.FC = () => {
  const { activeNovel } = useNovelStore();
  const [phases, setPhases] = useState<StoryPhase[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [phaseGoal, setPhaseGoal] = useState('');

  const loadPhases = async () => {
    if (!activeNovel) return;
    try {
      const list = await api.listStoryPhases(activeNovel.id);
      setPhases(list);
    } catch (e) {
      console.error('加载大纲阶段失败:', e);
    }
  };

  useEffect(() => {
    loadPhases();
  }, [activeNovel?.id]);

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !phaseTitle.trim()) return;

    await api.createStoryPhase({
      novel_id: activeNovel.id,
      title: phaseTitle.trim(),
      goal: phaseGoal.trim(),
      order_index: phases.length + 1,
    });

    setPhaseTitle('');
    setPhaseGoal('');
    setShowAddModal(false);
    loadPhases();
  };

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请选择或创建小说项目以管理剧情大纲
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">大纲与故事阶段 ({phases.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 shrink-0" />
          新增大纲阶段
        </button>
      </div>

      {/* Phases Outline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {phases.length === 0 ? (
          <div className="py-12 text-center text-ink-2">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>暂无宏观剧情阶段规划，点击右上角【新增大纲阶段】规划起承转合</p>
          </div>
        ) : (
          phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="bg-surface border border-line hover:border-amber-800/40 rounded-lg p-3 transition shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-800/10 text-primary flex items-center justify-center font-bold text-[11px] border border-amber-800/20">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-primary">{phase.title}</span>
                </div>
                <span className="text-[10px] text-ink-2 font-mono">
                  阶段序号 #{phase.order_index}
                </span>
              </div>

              {phase.goal && (
                <div className="bg-surface p-2 rounded border border-line mb-2 font-serif text-[11px] text-[#4b4337] leading-relaxed">
                  <strong className="text-primary">阶段核心目标与冲突：</strong>
                  {phase.goal}
                </div>
              )}

              <div className="text-[10px] text-ink-2 flex items-center justify-between pt-1 border-t border-line">
                <span>规划状态：已立项推进</span>
                <span>创建时间：{new Date(phase.created_at * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Story Phase */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
              <span className="font-bold text-sm text-ink">新增大纲阶段</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-ink-2 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">大纲阶段名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：第一阶段：荒原启蒙与宗门大劫、第二阶段：中州风云"
                  value={phaseTitle}
                  onChange={(e) => setPhaseTitle(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">阶段核心矛盾与终局高潮 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="明确本阶段主角的核心困境、主要对手、升级突破与阶段大决战..."
                  value={phaseGoal}
                  onChange={(e) => setPhaseGoal(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-line text-ink-2 hover:bg-surface-3"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
