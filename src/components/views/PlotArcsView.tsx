import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/tauriBridge';
import type { StoryPhase, StoryArc } from '@/types';
import {
  Layers,
  GitBranch,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
} from 'lucide-react';

interface PlotArcsViewProps {
  novelId: string;
}

const PRIORITY_BADGES = {
  MAIN: { label: '核心主线', color: 'bg-rose-950 text-rose-300 border-rose-800' },
  SUB: { label: '支线剧情', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  CHARACTER: { label: '角色成长弧', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  WORLD: { label: '世界观揭秘', color: 'bg-amber-950 text-amber-300 border-amber-800' },
};

const STATUS_ICONS = {
  PLANNING: { label: '规划中', color: 'text-slate-400', icon: Clock },
  DEVELOPING: { label: '展开推进中', color: 'text-indigo-400', icon: GitBranch },
  PAUSED: { label: '已暂停', color: 'text-amber-400', icon: AlertCircle },
  COMPLETED: { label: '已完结', color: 'text-emerald-400', icon: CheckCircle2 },
  CANCELLED: { label: '已废弃', color: 'text-rose-400', icon: AlertCircle },
};

export const PlotArcsView: React.FC<PlotArcsViewProps> = ({ novelId }) => {
  const [phases, setPhases] = useState<StoryPhase[]>([]);
  const [arcs, setArcs] = useState<StoryArc[]>([]);

  // New Phase Modal
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [phaseGoal, setPhaseGoal] = useState('');

  // New Arc Modal
  const [showAddArc, setShowAddArc] = useState(false);
  const [arcPhaseId, setArcPhaseId] = useState<string>('');
  const [arcTitle, setArcTitle] = useState('');
  const [arcGoal, setArcGoal] = useState('');
  const [arcDesc, setArcDesc] = useState('');
  const [arcPriority, setArcPriority] = useState<'MAIN' | 'SUB' | 'CHARACTER' | 'WORLD'>('MAIN');

  const loadData = useCallback(async () => {
    if (!novelId) return;
    try {
      const [pList, aList] = await Promise.all([
        api.listStoryPhases(novelId),
        api.listStoryArcs(novelId),
      ]);
      setPhases(pList);
      setArcs(aList);
      if (pList.length > 0 && !arcPhaseId) {
        setArcPhaseId(pList[0].id);
      }
    } catch (e) {
      console.error('加载大纲与剧情弧失败:', e);
    }
  }, [novelId, arcPhaseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !phaseTitle.trim()) return;

    try {
      await api.createStoryPhase({
        novel_id: novelId,
        title: phaseTitle.trim(),
        goal: phaseGoal.trim() || undefined,
      });
      setPhaseTitle('');
      setPhaseGoal('');
      setShowAddPhase(false);
      loadData();
    } catch (err) {
      alert('创建故事阶段失败: ' + err);
    }
  };

  const handleCreateArc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !arcTitle.trim()) return;

    try {
      await api.createStoryArc({
        novel_id: novelId,
        phase_id: arcPhaseId || undefined,
        title: arcTitle.trim(),
        goal: arcGoal.trim() || undefined,
        description: arcDesc.trim() || undefined,
        priority: arcPriority,
      });
      setArcTitle('');
      setArcGoal('');
      setArcDesc('');
      setShowAddArc(false);
      loadData();
    } catch (err) {
      alert('创建剧情弧失败: ' + err);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('确定删除此故事阶段吗？所属剧情弧线不会被删除，将变为未归类状态。')) return;
    try {
      await api.deleteStoryPhase(phaseId);
      loadData();
    } catch (err) {
      alert('删除故事阶段失败: ' + err);
    }
  };

  const handleToggleArcStatus = async (arc: StoryArc) => {
    const nextStatus =
      arc.status === 'DEVELOPING'
        ? 'COMPLETED'
        : arc.status === 'PLANNING'
        ? 'DEVELOPING'
        : 'PLANNING';

    try {
      await api.updateStoryArcStatus(arc.id, nextStatus);
      loadData();
    } catch (err) {
      alert('更新剧情弧状态失败: ' + err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-200">故事阶段与剧情弧线规划 (Story Arcs)</h2>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
            {phases.length} 阶段 / {arcs.length} 剧情弧
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPhase(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            新建宏观阶段 (Phase)
          </button>

          <button
            onClick={() => setShowAddArc(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            新建剧情弧 (Story Arc)
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {phases.length === 0 && arcs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-2xl">
            <GitBranch className="w-10 h-10 stroke-[1.2] text-slate-600" />
            <p className="text-sm">暂无故事大纲阶段，建议首先创建“第一阶段：起航/铺垫”以规划长篇剧情</p>
          </div>
        ) : (
          phases.map((phase) => {
            const phaseArcs = arcs.filter((a) => a.phase_id === phase.id);

            return (
              <div
                key={phase.id}
                className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {phase.order_index}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-base">{phase.title}</h3>
                      {phase.goal && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Target className="w-3 h-3 text-indigo-400" />
                          阶段战略目标：{phase.goal}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePhase(phase.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="删除阶段"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Arcs Grid under Phase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phaseArcs.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                      本阶段暂无剧情弧线，点击右上角“新建剧情弧”添加
                    </div>
                  ) : (
                    phaseArcs.map((arc) => {
                      const priorityMeta = PRIORITY_BADGES[arc.priority] || PRIORITY_BADGES.MAIN;
                      const statusMeta = STATUS_ICONS[arc.status] || STATUS_ICONS.PLANNING;
                      const StatusIcon = statusMeta.icon;

                      return (
                        <div
                          key={arc.id}
                          className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.color}`}
                              >
                                {priorityMeta.label}
                              </span>

                              <button
                                onClick={() => handleToggleArcStatus(arc)}
                                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md hover:bg-slate-800/80 transition-colors ${statusMeta.color}`}
                                title="点击切换状态"
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusMeta.label}
                              </button>
                            </div>

                            <h4 className="font-semibold text-slate-100 text-sm">{arc.title}</h4>

                            {arc.goal && (
                              <p className="text-xs text-indigo-300/90 mt-1 line-clamp-2">
                                核心冲突目标：{arc.goal}
                              </p>
                            )}

                            {arc.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                                {arc.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                            <span>创建于 {new Date(arc.created_at).toLocaleDateString()}</span>
                            <span className="text-slate-400">点击状态标签可流转</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Phase */}
      {showAddPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              新建宏观故事阶段 (Phase)
            </h3>

            <form onSubmit={handleCreatePhase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">阶段标题</label>
                <input
                  type="text"
                  value={phaseTitle}
                  onChange={(e) => setPhaseTitle(e.target.value)}
                  placeholder="例如：第一阶段：潜龙在渊 / 宗门大比"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  阶段总体战略目标
                </label>
                <textarea
                  value={phaseGoal}
                  onChange={(e) => setPhaseGoal(e.target.value)}
                  placeholder="例如：主角在底层积攒资源，查清身世初步线索，并在大比中一鸣惊人"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPhase(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  创建阶段
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Arc */}
      {showAddArc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              新建剧情弧线 (Story Arc)
            </h3>

            <form onSubmit={handleCreateArc} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    所属宏观阶段
                  </label>
                  <select
                    value={arcPhaseId}
                    onChange={(e) => setArcPhaseId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">未指定阶段</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">优先级/类型</label>
                  <select
                    value={arcPriority}
                    onChange={(e) => setArcPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="MAIN">核心主线</option>
                    <option value="SUB">支线剧情</option>
                    <option value="CHARACTER">角色成长弧</option>
                    <option value="WORLD">世界观揭秘</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">剧情弧标题</label>
                <input
                  type="text"
                  value={arcTitle}
                  onChange={(e) => setArcTitle(e.target.value)}
                  placeholder="例如：后山古洞探秘弧 / 黑煞帮暗杀事件"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  核心冲突与戏剧目标
                </label>
                <input
                  type="text"
                  value={arcGoal}
                  onChange={(e) => setArcGoal(e.target.value)}
                  placeholder="例如：获得筑基丹药方并击退黑煞帮先遣探子"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">剧情设计梗概</label>
                <textarea
                  value={arcDesc}
                  onChange={(e) => setArcDesc(e.target.value)}
                  placeholder="简要规划该剧情弧的发展阶段、反转点与预期收尾方式……"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddArc(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  创建剧情弧
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
