import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { StoryPhase } from '@/types';
import {
  Layers,
  Plus,
  X,
  Edit3,
  Trash2,
  Sparkles,
  BookOpen,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface DramaStructureTemplate {
  name: string;
  desc: string;
  phases: { title: string; goal: string }[];
}

const DRAMA_TEMPLATES: DramaStructureTemplate[] = [
  {
    name: '起承转合四卷流 (经典网文与长篇骨架)',
    desc: '适合各类升级流、玄幻奇幻、修真与宏大叙事',
    phases: [
      {
        title: '第一卷【起 · 危机入局与宿命破茧】',
        goal: '呈现主角初始底层困境与核心缺陷；遭遇打破平静的突发事件/金手指初现；被动卷入第一层危机，完成立足破局。',
      },
      {
        title: '第二卷【承 · 暗流涌动与阵营博弈】',
        goal: '舞台切换扩大，遭遇跨阵营冲突与暗流；结识核心盟友，斩获第一阶段核心战果；隐约察觉背后隐藏的庞大阴谋。',
      },
      {
        title: '第三卷【转 · 至暗时刻与乾坤倒转】',
        goal: '前期伏笔全面引爆，原有依仗瓦解，遭遇至暗绝境；主角经历灵魂蜕变或生死抉择，完成关键逆袭，扭转战局。',
      },
      {
        title: '第四卷【合 · 终局决战与新元启航】',
        goal: '全书终极交锋爆发，彻底回收底层核心设定与终极悬念；确立新世界秩序，留下深远情绪余响，踏上更高征途。',
      },
    ],
  },
  {
    name: '好莱坞经典三幕六部曲 (强剧情张力与影视剧作)',
    desc: '适合悬疑惊悚、科幻探险、谍战刑侦与剧情向网文',
    phases: [
      {
        title: '第一阶段【建置与诱发事件 (The Inciting Incident)】',
        goal: '展示主角日常生活与内在软肋；突发非同寻常的意外事件，平静生活彻底被打破。',
      },
      {
        title: '第二阶段【跨越第一道门槛 (Plot Point 1)】',
        goal: '被迫告别舒适区，不可逆地进入全新规则的异世界/险境战场，确立第一目标。',
      },
      {
        title: '第三阶段【中点危机与假性高潮 (Midpoint Crisis)】',
        goal: '取得阶段性表面胜利，但随即遭遇对手致命反扑；真相浮出水面，赌注与代价成倍加码。',
      },
      {
        title: '第四阶段【灵魂黑夜与希望破灭 (All Hope Is Lost)】',
        goal: '关键盟友背叛或重要支柱倒塌；陷入看似不可逾越的绝望深渊，必须正视最深的自我缺陷。',
      },
      {
        title: '第五阶段【决战风暴 (The Climax)】',
        goal: '调动全书埋设的全部技能与伏笔，向最终 Boss 发起破釜沉舟的决死冲锋。',
      },
      {
        title: '第六阶段【余波平息与秩序重构 (Resolution)】',
        goal: '尘埃落定，角色心境彻底蜕变；悬念全部闭环，完成情感价值终极升华。',
      },
    ],
  },
  {
    name: '商业升级三步飞升流 (爽感节奏与阶段打脸)',
    desc: '适合都市异能、凡人升级、商业博弈与快节奏连载',
    phases: [
      {
        title: '第一阶段【微末崛起 · 打脸破局】',
        goal: '打破旧阶层压迫，借助专属优势强势打脸对手，夺取初级核心资源，确立小圈子话语权。',
      },
      {
        title: '第二阶段【名震一方 · 跨界争锋】',
        goal: '介入更高层次的顶层巨头博弈，在多方算计中火中取栗，建立属于自己的势力体系。',
      },
      {
        title: '第三阶段【登临绝顶 · 规则改写】',
        goal: '直面世界幕后黑手或天花板霸权；颠覆旧有规则体系，成为全书至高法则的制定者。',
      },
    ],
  },
];

export const PlotOutlinePanel: React.FC = () => {
  const { activeNovel } = useNovelStore();
  const [phases, setPhases] = useState<StoryPhase[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<StoryPhase | null>(null);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [phaseGoal, setPhaseGoal] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const loadPhases = async () => {
    if (!activeNovel) return;
    try {
      const list = await api.listStoryPhases(activeNovel.id);
      setPhases(list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
    } catch (e) {
      console.error('加载大纲阶段失败:', e);
    }
  };

  useEffect(() => {
    loadPhases();
  }, [activeNovel?.id]);

  const handleStartAdd = () => {
    setEditingPhase(null);
    setPhaseTitle('');
    setPhaseGoal('');
    setShowAddModal(true);
  };

  const handleStartEdit = (phase: StoryPhase) => {
    setEditingPhase(phase);
    setPhaseTitle(phase.title);
    setPhaseGoal(phase.goal || '');
    setShowAddModal(true);
  };

  const handleDeletePhase = async (phase: StoryPhase) => {
    const ok = await confirmDialog({
      title: '删除大纲故事阶段',
      message: `确定要删除大纲阶段“${phase.title}”吗？此阶段关联的剧情弧将被安全解绑并归入未归类，不会丢失。`,
      confirmText: '确认删除',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteStoryPhase(phase.id);
      await loadPhases();
      setFeedback(`已成功删除阶段【${phase.title}】`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (e) {
      console.error('删除大纲阶段失败:', e);
    }
  };

  const handleSavePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !phaseTitle.trim()) return;

    if (editingPhase) {
      await api.updateStoryPhase({
        id: editingPhase.id,
        title: phaseTitle.trim(),
        goal: phaseGoal.trim(),
        order_index: editingPhase.order_index,
      });
      setFeedback(`已更新阶段【${phaseTitle.trim()}】`);
    } else {
      await api.createStoryPhase({
        novel_id: activeNovel.id,
        title: phaseTitle.trim(),
        goal: phaseGoal.trim(),
        order_index: phases.length + 1,
      });
      setFeedback(`已新增阶段【${phaseTitle.trim()}】`);
    }

    setPhaseTitle('');
    setPhaseGoal('');
    setEditingPhase(null);
    setShowAddModal(false);
    loadPhases();
    setTimeout(() => setFeedback(null), 2500);
  };

  // 批量应用经典大纲模板
  const handleApplyTemplate = async (tpl: DramaStructureTemplate) => {
    if (!activeNovel) return;
    const ok = await confirmDialog({
      title: `注入【${tpl.name}】大纲模板`,
      message: `即将为《${activeNovel.title}》批量生成 ${tpl.phases.length} 个经典戏剧大纲阶段，便于规划宏观起承转合。是否继续？`,
      confirmText: '一键生成',
    });
    if (!ok) return;

    try {
      const baseIndex = phases.length;
      for (let i = 0; i < tpl.phases.length; i++) {
        const item = tpl.phases[i];
        await api.createStoryPhase({
          novel_id: activeNovel.id,
          title: item.title,
          goal: item.goal,
          order_index: baseIndex + i + 1,
        });
      }
      setShowTemplateModal(false);
      await loadPhases();
      setFeedback(`已成功为《${activeNovel.title}》注入【${tpl.name}】(${tpl.phases.length}个阶段)！`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      console.error('注入大纲模板失败:', e);
    }
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-primary dark:text-amber-300 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 font-medium transition flex items-center gap-1 shadow-2xs text-[11px] whitespace-nowrap cursor-pointer"
            title="一键注入起承转合四卷流、好莱坞三幕六部曲等经典戏剧结构"
          >
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <span>结构模板</span>
          </button>
          <button
            onClick={handleStartAdd}
            className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3 h-3 shrink-0" />
            <span>新增阶段</span>
          </button>
        </div>
      </div>

      {/* 提示条 */}
      {feedback && (
        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
          {feedback}
        </div>
      )}

      {/* Phases Outline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {phases.length === 0 ? (
          <div className="py-8 px-4 text-center text-ink-2 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink mb-1">暂无宏观剧情阶段规划</p>
              <p className="text-[11px] text-ink-2 max-w-sm mx-auto">
                小说长篇创作需要清晰的起承转合或分卷目标。您可以从头新建，或直接一键注入大师级戏剧模型：
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-md mx-auto text-left pt-1">
              {DRAMA_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-2.5 rounded-lg border border-line hover:border-amber-700 bg-surface hover:bg-surface-2 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-primary group-hover:text-amber-800">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" />
                      {tpl.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-[10.5px] text-stone-500 mt-1">{tpl.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="bg-surface border border-line hover:border-amber-800/40 rounded-lg p-3 transition shadow-xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-800/10 text-primary flex items-center justify-center font-bold text-[11px] border border-amber-800/20">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-primary">{phase.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-ink-2 font-mono mr-1">
                    #{phase.order_index}
                  </span>
                  <button
                    onClick={() => handleStartEdit(phase)}
                    className="p-1 text-ink-2 hover:text-amber-800 rounded hover:bg-surface-3 transition cursor-pointer"
                    title="编辑阶段"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePhase(phase)}
                    className="p-1 text-ink-2 hover:text-red-700 rounded hover:bg-red-50 transition cursor-pointer"
                    title="删除阶段"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {phase.goal && (
                <div className="bg-surface-2/60 p-2.5 rounded border border-line/60 mb-2 font-serif text-[11px] text-[#4b4337] dark:text-stone-300 leading-relaxed">
                  <strong className="text-primary mr-1">阶段核心冲突与高潮目标：</strong>
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

      {/* Modal: Create or Edit Story Phase */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
              <span className="font-bold text-sm text-ink">
                {editingPhase ? '编辑大纲故事阶段' : '新增大纲故事阶段'}
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-ink-2 hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhase} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">大纲阶段名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：第一卷：危机入局与宿命破茧、第二卷：中州风云"
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
                  placeholder="明确本阶段主角的核心困境、主要对手、阵营博弈与阶段终局大决战..."
                  value={phaseGoal}
                  onChange={(e) => setPhaseGoal(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-line text-ink-2 hover:bg-surface-3 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium cursor-pointer"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Drama Structure Templates */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-xl max-w-lg w-full p-4 shadow-2xl text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-ink">戏剧大纲结构模板库</span>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded text-ink-2 hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-ink-2">
              点击以下经典剧作结构，将一键为《{activeNovel.title}》追加对应的分阶段目标骨架：
            </p>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {DRAMA_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.name}
                  className="p-3 rounded-lg border border-line hover:border-amber-700 bg-surface-2/40 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-primary">{tpl.name}</div>
                      <div className="text-[10px] text-stone-500">{tpl.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 rounded bg-amber-800 hover:bg-amber-700 text-white text-[11px] font-medium shadow-xs cursor-pointer shrink-0"
                    >
                      一键应用
                    </button>
                  </div>

                  <div className="space-y-1 text-[10.5px] text-stone-600 dark:text-stone-300 bg-surface p-2 rounded border border-line/60 font-serif">
                    {tpl.phases.map((p, idx) => (
                      <div key={idx} className="truncate">
                        <span className="font-bold text-ink mr-1">{p.title}:</span>
                        <span>{p.goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-3 py-1 rounded border border-line text-ink-2 hover:bg-surface-3 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
