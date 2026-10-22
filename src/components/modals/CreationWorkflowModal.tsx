import React from 'react';
import {
  X,
  Compass,
  Users,
  GitBranch,
  BookOpen,
  Brain,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useNovelStore } from '@/stores/useNovelStore';
import type { ActiveTab } from '@/stores/useNovelStore';

interface CreationWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowStep {
  step: number;
  id: ActiveTab;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  description: string;
  keyOutputs: string[];
  tips: string;
}

export const CreationWorkflowModal: React.FC<CreationWorkflowModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeNovel, chapters, setActiveTab, activeTab } = useNovelStore();

  if (!isOpen) return null;

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

  const workflowSteps: WorkflowStep[] = [
    {
      step: 1,
      id: 'DASHBOARD',
      title: '立项与构思',
      subtitle: 'Inception & Vision',
      icon: LayoutDashboard,
      color: 'text-primary dark:text-amber-400',
      badgeBg: 'bg-amber-800/10 dark:bg-amber-400/10 border-amber-800/20 dark:border-amber-400/20',
      description: '确定小说核心创意、题材流派、受众定位、字数规模及黄金三章核心抓手，建立全书总览目标。',
      keyOutputs: ['作品基本档案', '流派约束模板', '全书总字数目标', '创作节奏把控'],
      tips: '建议在立项初期明确核心爽点与主线冲突，选择匹配的流派法则。',
    },
    {
      step: 2,
      id: 'WORLD',
      title: '世界观架构',
      subtitle: 'Worldbuilding & Canon',
      icon: Compass,
      color: 'text-orange-800 dark:text-orange-400',
      badgeBg: 'bg-orange-800/10 dark:bg-orange-400/10 border-orange-800/20 dark:border-orange-400/20',
      description: '定义不可推翻的世界规则 (Canon)、战力进阶层级、地理疆域版图与势力门派，严防长篇战力崩溃。',
      keyOutputs: ['战力/修炼阶层', '地理疆域分布', '宗门势力网络', '权威法则公理'],
      tips: '严禁规则随意改动，权威设定将自动注入到多 Agent 上下文中作为真理公理。',
    },
    {
      step: 3,
      id: 'CHARACTERS',
      title: '角色与谱系',
      subtitle: 'Characters & Topology',
      icon: Users,
      color: 'text-rose-800 dark:text-rose-400',
      badgeBg: 'bg-rose-800/10 dark:bg-rose-400/10 border-rose-800/20 dark:border-rose-400/20',
      description: '创建主角、主要配角与反派档案，设定动机、弱点与前史秘密，利用可视化拓扑图编织错综复杂的人际网。',
      keyOutputs: ['角色人设档案', '人际关系拓扑图', '角色动态状态演化', '动机与禁忌清单'],
      tips: '每个重要角色都应有不可妥协的核心欲望与致命弱点，支撑长篇因果闭环。',
    },
    {
      step: 4,
      id: 'PLOTS',
      title: '剧情与大纲',
      subtitle: 'Plots & Story Arcs',
      icon: GitBranch,
      color: 'text-indigo-800 dark:text-indigo-400',
      badgeBg: 'bg-indigo-800/10 dark:bg-indigo-400/10 border-indigo-800/20 dark:border-indigo-400/20',
      description: '划分宏观故事阶段 (Story Phases)，编织多条并行的剧情弧线 (Plot Arcs)，埋设悬念伏笔并规划回收节点。',
      keyOutputs: ['宏观故事四阶段', '主线/支线剧情弧', '伏笔与悬念追踪', '分卷高潮节点规划'],
      tips: '有伏必有应，伏笔追踪系统能帮助作者在几十万字后准确收束前期埋下的暗线。',
    },
    {
      step: 5,
      id: 'EDITOR',
      title: '正文沉浸执笔',
      subtitle: 'Writing & Drafting',
      icon: BookOpen,
      color: 'text-primary dark:text-amber-300',
      badgeBg: 'bg-amber-900/15 dark:bg-amber-300/15 border-amber-900/30 dark:border-amber-300/30',
      description: '进入核心写作工作区，分卷分章排布，场景节拍 (Scene Beats) 细化，Tiptap 专注写作与多 Agent 协同生成。',
      keyOutputs: ['分卷章节目录树', '场景细纲节拍', '正文不可逆版本历史', '智能自动存盘'],
      tips: '通过“场景拆解”将单章目标分解为 3~4 个场景节拍，能大幅提升 AI 执笔的连贯性与画面感。',
    },
    {
      step: 6,
      id: 'MEMORY',
      title: '记忆沉淀与连载',
      subtitle: 'Memory & Serialization',
      icon: Brain,
      color: 'text-teal-800 dark:text-teal-400',
      badgeBg: 'bg-teal-800/10 dark:bg-teal-400/10 border-teal-800/20 dark:border-teal-400/20',
      description: 'L0~L4 五层记忆引擎自动沉淀章节客观事实与状态演变，通过 FTS5 检索支撑百万字长篇无缝自动连载。',
      keyOutputs: ['L0~L4 分层记忆', '章节权威事实沉淀', '因果一致性审查', '多 Agent 自动连载推进'],
      tips: '每章定稿后，让记忆管理员 Agent 沉淀事实，后续章节写作即可自动挂载历史记忆，杜绝前后矛盾。',
    },
  ];

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-surface dark:bg-[#1f1c19] rounded-2xl shadow-2xl border border-line dark:border-[#38332e] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line dark:border-[#38332e] bg-surface-2 dark:bg-[#1a1714] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center shadow-md border border-amber-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink dark:text-[#f3eee7] font-serif tracking-wide">
                  NovelForge AI — 长篇小说多 Agent 协同创作全流程
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-800/10 text-primary dark:text-amber-300 rounded-full border border-amber-800/20">
                  工作流向导
                </span>
              </div>
              <p className="text-xs text-ink-2 dark:text-[#9e9383] mt-0.5">
                严谨遵循长篇创作规律，从设定奠基、大纲推演到正文执笔与记忆沉淀，六步闭环打造百万字佳作
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-[#ded5c4]/60 dark:hover:bg-[#2b2724] transition cursor-pointer"
            title="关闭向导"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Novel Overview Banner */}
        {activeNovel && (
          <div className="px-6 py-3 bg-[#f5efe6] dark:bg-[#25211e] border-b border-[#e2d8c6] dark:border-[#332e29] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-ink-2 dark:text-[#9e9383]">当前创作工程：</span>
              <span className="font-bold font-serif text-ink dark:text-[#f3eee7] text-sm">
                《{activeNovel.title}》
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface-3 dark:bg-[#322c27] text-ink-2 dark:text-[#c4b59d] border border-line dark:border-[#423b35] text-[11px]">
                {activeNovel.genre_profile || '长篇小说'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-ink-2 dark:text-[#9e9383] font-mono text-[11px]">
              <span>章节数：<strong className="text-ink dark:text-[#f3eee7]">{chapters.length}</strong> 章</span>
              <span>累计正文：<strong className="text-ink dark:text-[#f3eee7]">{totalWords.toLocaleString()}</strong> 字</span>
            </div>
          </div>
        )}

        {/* Modal Body: Pipeline Step Cards */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          <div className="text-xs text-ink-2 dark:text-[#9e9383] flex items-center gap-1.5 font-medium mb-1">
            <Layers className="w-4 h-4 text-primary dark:text-amber-400" />
            <span>推荐按以下流水线依序推进创作。点击任意阶段可直接跳转：</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const isCurrentActive = activeTab === step.id;

              return (
                <div
                  key={step.step}
                  onClick={() => handleNavigate(step.id)}
                  className={`group relative p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isCurrentActive
                      ? 'bg-[#f4ebe0] dark:bg-[#2b2520] border-amber-800/40 dark:border-amber-600/40 shadow-sm ring-1 ring-amber-800/20'
                      : 'bg-[#faf7f0] dark:bg-[#23201d] border-[#e2d8c6] dark:border-[#38332e] hover:border-amber-800/30 hover:bg-[#f6f0e4] dark:hover:bg-[#282421]'
                  }`}
                >
                  {/* Step Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isCurrentActive
                              ? 'bg-amber-800 text-white'
                              : 'bg-surface-3 dark:bg-[#342e29] text-ink-2 dark:text-[#c4b59d]'
                          }`}
                        >
                          {step.step}
                        </span>
                        <div className={`p-1.5 rounded-lg border ${step.badgeBg}`}>
                          <Icon className={`w-4 h-4 ${step.color}`} />
                        </div>
                      </div>

                      {isCurrentActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-800 text-white shadow-xs">
                          当前所在阶段
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#a39786] group-hover:text-primary group-hover:translate-x-0.5 transition" />
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-ink dark:text-[#f3eee7] font-serif tracking-wide flex items-center gap-1.5">
                      {step.title}
                      <span className="text-[10px] font-sans font-normal text-[#8e8273] dark:text-[#887c6e]">
                        ({step.subtitle})
                      </span>
                    </h3>

                    <p className="text-xs text-ink-2 dark:text-[#a09485] leading-relaxed mt-2 line-clamp-2">
                      {step.description}
                    </p>

                    {/* Key Outputs */}
                    <div className="mt-3 pt-2.5 border-t border-[#e8dfcf] dark:border-[#322d28]">
                      <div className="text-[10px] font-bold text-primary dark:text-amber-400 mb-1.5">
                        阶段产出清单：
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {step.keyOutputs.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-[11px] text-ink-2 dark:text-[#b5aaa0]"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step Action & Tip */}
                  <div className="mt-4 pt-3 border-t border-[#e8dfcf] dark:border-[#322d28] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[#8e8273] dark:text-[#887c6e] italic truncate max-w-[180px]">
                      {step.tips}
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-amber-800/10 hover:bg-amber-800 text-primary hover:text-white dark:bg-amber-400/10 dark:hover:bg-amber-500 dark:text-amber-300 dark:hover:text-stone-900 transition font-semibold text-[11px] flex items-center gap-1 shrink-0"
                    >
                      <span>前往</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-line dark:border-[#38332e] bg-surface-2 dark:bg-[#1a1714] flex items-center justify-between text-xs text-ink-2 dark:text-[#9e9383] shrink-0">
          <span>
            💡 提示：顶部标题栏的 <strong>① 构思 ➔ ② 设定 ➔ ③ 角色 ➔ ④ 大纲 ➔ ⑤ 执笔 ➔ ⑥ 记忆</strong> 即为本工作流导航条，可随时无缝切换。
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-medium transition cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
