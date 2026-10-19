import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/tauriBridge';
import type { StoryPhase, StoryArc } from '@/types';
import { confirmDialog, alertDialog } from '@/utils/dialog';
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
      setArcPhaseId((prev) => (pList.some((p) => p.id === prev) ? prev : (pList.length > 0 ? pList[0].id : '')));
    } catch (e) {
      console.error('加载大纲与剧情弧失败:', e);
    }
  }, [novelId]);

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
      await alertDialog('创建故事阶段失败: ' + err);
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
      await alertDialog('创建剧情弧失败: ' + err);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!await confirmDialog('确定删除此故事阶段吗？所属剧情弧线不会被删除，将变为未归类状态。')) return;
    try {
      await api.deleteStoryPhase(phaseId);
      loadData();
    } catch (err) {
      await alertDialog('删除故事阶段失败: ' + err);
    }
  };

  const handleDeleteArc = async (arcId: string) => {
    if (!await confirmDialog('确定删除此剧情弧线吗？')) return;
    try {
      await api.deleteStoryArc(arcId);
      loadData();
    } catch (err) {
      await alertDialog('删除剧情弧失败: ' + err);
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
      await alertDialog('更新剧情弧状态失败: ' + err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface text-ink rounded-xl overflow-hidden border border-line shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-2/90 border-b border-line gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <h2 className="font-semibold text-ink font-serif truncate">故事阶段与剧情弧线规划 (Story Arcs)</h2>
          <span className="text-xs bg-amber-800/10 text-primary border border-amber-800/20 px-2 py-0.5 rounded-full font-mono shrink-0 whitespace-nowrap">
            {phases.length} 阶段 / {arcs.length} 剧情弧
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddPhase(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-3 text-ink rounded-lg text-xs font-medium border border-line transition-all shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">新建宏观阶段 (Phase)</span>
            <span className="sm:hidden">新建阶段</span>
          </button>

          <button
            onClick={() => setShowAddArc(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">新建剧情弧 (Story Arc)</span>
            <span className="sm:hidden">新建剧情弧</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas">
        {phases.length === 0 && arcs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-ink-2 gap-3 border border-dashed border-line rounded-2xl bg-surface">
            <GitBranch className="w-10 h-10 stroke-[1.2] text-ink-2" />
            <p className="text-sm">暂无故事大纲阶段，建议首先创建“第一阶段：起航/铺垫”以规划长篇剧情</p>
          </div>
        ) : (
          <>
            {phases.map((phase) => {
              const phaseArcs = arcs.filter((a) => a.phase_id === phase.id);

              return (
                <div
                  key={phase.id}
                  className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-primary font-mono">
                        {phase.order_index}
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink text-base font-serif">{phase.title}</h3>
                        {phase.goal && (
                          <p className="text-xs text-ink-2 mt-0.5 flex items-center gap-1">
                            <Target className="w-3 h-3 text-primary" />
                            阶段战略目标：{phase.goal}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-1.5 text-ink-2 hover:text-rose-700 transition-colors"
                      title="删除阶段"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Arcs Grid under Phase */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phaseArcs.length === 0 ? (
                      <div className="col-span-full py-6 text-center text-xs text-ink-2 border border-dashed border-line rounded-xl bg-surface">
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
                            className="bg-surface border border-[#e3d9c7] hover:border-amber-800/40 rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.color}`}
                                >
                                  {priorityMeta.label}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleArcStatus(arc)}
                                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md hover:bg-white/60 transition-colors ${statusMeta.color}`}
                                    title="点击切换状态"
                                  >
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusMeta.label}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArc(arc.id)}
                                    className="p-1 text-ink-2 hover:text-rose-700 transition-colors"
                                    title="删除剧情弧"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="font-semibold text-ink text-sm font-serif">{arc.title}</h4>

                              {arc.goal && (
                                <p className="text-xs text-primary mt-1 line-clamp-2">
                                  核心冲突目标：{arc.goal}
                                </p>
                              )}

                              {arc.description && (
                                <p className="text-xs text-ink-2 mt-1 line-clamp-3">
                                  {arc.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-2">
                              <span>创建于 {new Date(arc.created_at).toLocaleDateString()}</span>
                              <span className="text-primary font-medium">点击状态标签可流转</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unassigned / Standalone Arcs */}
            {(() => {
              const unassignedArcs = arcs.filter((a) => !a.phase_id || !phases.some((p) => p.id === a.phase_id));
              if (unassignedArcs.length === 0) return null;
              return (
                <div className="bg-surface border border-dashed border-amber-800/40 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-primary font-mono">
                        ✦
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink text-base font-serif">独立 / 未归类剧情弧 ({unassignedArcs.length})</h3>
                        <p className="text-xs text-ink-2 mt-0.5">未归属特定宏观阶段的单体剧情弧线，可在其展开状态时指引单章与细纲设计</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unassignedArcs.map((arc) => {
                      const priorityMeta = PRIORITY_BADGES[arc.priority] || PRIORITY_BADGES.MAIN;
                      const statusMeta = STATUS_ICONS[arc.status] || STATUS_ICONS.PLANNING;
                      const StatusIcon = statusMeta.icon;

                      return (
                        <div
                          key={arc.id}
                          className="bg-surface border border-[#e3d9c7] hover:border-amber-800/40 rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.color}`}
                              >
                                {priorityMeta.label}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleArcStatus(arc)}
                                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md hover:bg-white/60 transition-colors ${statusMeta.color}`}
                                  title="点击切换状态"
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusMeta.label}
                                </button>
                                <button
                                  onClick={() => handleDeleteArc(arc.id)}
                                  className="p-1 text-ink-2 hover:text-rose-700 transition-colors"
                                  title="删除剧情弧"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-semibold text-ink text-sm font-serif">{arc.title}</h4>

                            {arc.goal && (
                              <p className="text-xs text-primary mt-1 line-clamp-2">
                                核心冲突目标：{arc.goal}
                              </p>
                            )}

                            {arc.description && (
                              <p className="text-xs text-ink-2 mt-1 line-clamp-3">
                                {arc.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-2">
                            <span>创建于 {new Date(arc.created_at).toLocaleDateString()}</span>
                            <span className="text-primary font-medium">点击状态标签可流转</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Modal: Add Phase */}
      {showAddPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2 font-serif">
              <Layers className="w-5 h-5 text-primary" />
              新建宏观故事阶段 (Phase)
            </h3>

            <form onSubmit={handleCreatePhase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">阶段标题</label>
                <input
                  type="text"
                  value={phaseTitle}
                  onChange={(e) => setPhaseTitle(e.target.value)}
                  placeholder="例如：第一阶段：潜龙在渊 / 宗门大比"
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  阶段总体战略目标
                </label>
                <textarea
                  value={phaseGoal}
                  onChange={(e) => setPhaseGoal(e.target.value)}
                  placeholder="例如：主角在底层积攒资源，查清身世初步线索，并在大比中一鸣惊人"
                  rows={3}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddPhase(false)}
                  className="px-4 py-2 text-xs font-medium text-ink-2 hover:text-ink"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-serif font-bold text-ink mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              新建剧情弧线 (Story Arc)
            </h3>

            <form onSubmit={handleCreateArc} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-medium text-ink-2 mb-1">
                    所属宏观阶段
                  </label>
                  <select
                    value={arcPhaseId}
                    onChange={(e) => setArcPhaseId(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-hidden focus:border-[#854d0e]"
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
                  <label className="block text-xs font-serif font-medium text-ink-2 mb-1">优先级/类型</label>
                  <select
                    value={arcPriority}
                    onChange={(e) => setArcPriority(e.target.value as any)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-hidden focus:border-[#854d0e]"
                  >
                    <option value="MAIN">核心主线</option>
                    <option value="SUB">支线剧情</option>
                    <option value="CHARACTER">角色成长弧</option>
                    <option value="WORLD">世界观揭秘</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-ink-2 mb-1">剧情弧标题</label>
                <input
                  type="text"
                  value={arcTitle}
                  onChange={(e) => setArcTitle(e.target.value)}
                  placeholder="例如：后山古洞探秘弧 / 黑煞帮暗杀事件"
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-ink-2 mb-1">
                  核心冲突与戏剧目标
                </label>
                <input
                  type="text"
                  value={arcGoal}
                  onChange={(e) => setArcGoal(e.target.value)}
                  placeholder="例如：获得筑基丹药方并击退黑煞帮先遣探子"
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-ink-2 mb-1">剧情设计梗概</label>
                <textarea
                  value={arcDesc}
                  onChange={(e) => setArcDesc(e.target.value)}
                  placeholder="简要规划该剧情弧的发展阶段、反转点与预期收尾方式……"
                  rows={3}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddArc(false)}
                  className="px-4 py-2 text-xs font-serif font-medium text-ink-2 hover:text-ink"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium rounded-lg shadow-xs"
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
