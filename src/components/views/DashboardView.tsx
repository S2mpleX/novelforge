import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  FileText,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  GitBranch,
  BookOpen,
  Brain,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Layers,
  Palette,
  Map as MapIcon,
  SlidersHorizontal,
  PenTool,
} from 'lucide-react';
import { CreationWorkflowModal } from '@/components/modals/CreationWorkflowModal';
import { BookCoverView } from '@/components/common/BookCoverView';
import { BookCoverModal } from '@/components/modals/BookCoverModal';
import { DualWordStatsBadge } from '@/components/common/DualWordStatsBadge';
import { BatchReviseModal } from '@/components/modals/BatchReviseModal';
import { MapModal } from '@/components/modals/MapModal';
import type { ActiveTab } from '@/stores/useNovelStore';

export const DashboardView: React.FC = () => {
  const { activeNovel, chapters, activeChapter, setActiveTab, selectChapter } = useNovelStore();
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showBatchReviseModal, setShowBatchReviseModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-canvas dark:bg-[#181513] select-none text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-800 to-yellow-800 text-amber-100 flex items-center justify-center shadow-lg mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-ink dark:text-[#ede6dc] mb-2">
          文人书斋 · 开启你的长篇创作之旅
        </h2>
        <p className="text-xs text-ink-2 dark:text-[#a09485] max-w-md leading-relaxed mb-6">
          案头当前尚未选定创作工程。无论你脑海中已经拥有成熟大纲，还是只有一个灵感火花，都可以从这里启程。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('novelforge:open-desk'))}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-serif font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ 开启第一本长篇 (3步立项向导)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);
  const avgWords = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;

  const creationPipelineCards: Array<{
    step: number;
    tab: ActiveTab;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    desc: string;
    statusText: string;
  }> = [
    {
      step: 1,
      tab: 'DASHBOARD',
      title: '构思立项',
      subtitle: '选题与目标',
      icon: Layers,
      color: 'text-primary dark:text-amber-400',
      bg: 'bg-amber-800/10 dark:bg-amber-400/10',
      border: 'border-amber-800/20 dark:border-amber-400/20',
      desc: '题材流派、核心梗概、黄金三章抓手与全书字数目标',
      statusText: `当前：《${activeNovel.title}》· ${activeNovel.genre_profile || '长篇通俗'}`,
    },
    {
      step: 2,
      tab: 'WORLD',
      title: '世界架构',
      subtitle: '公理与法则',
      icon: Compass,
      color: 'text-orange-800 dark:text-orange-400',
      bg: 'bg-orange-800/10 dark:bg-orange-400/10',
      border: 'border-orange-800/20 dark:border-orange-400/20',
      desc: '战力层级、地理疆域版图、势力门派与权威法则 (Canon)',
      statusText: '确立不可推翻的世界观底线，杜绝战力崩溃',
    },
    {
      step: 3,
      tab: 'CHARACTERS',
      title: '角色谱系',
      subtitle: '人设与拓扑',
      icon: Users,
      color: 'text-rose-800 dark:text-rose-400',
      bg: 'bg-rose-800/10 dark:bg-rose-400/10',
      border: 'border-rose-800/20 dark:border-rose-400/20',
      desc: '主角反派人设卡、动机秘密、动态状态变迁与关系拓扑网',
      statusText: '用欲望与羁绊驱动故事，支持拉线拓扑图',
    },
    {
      step: 4,
      tab: 'PLOTS',
      title: '剧情大纲',
      subtitle: '阶段与伏笔',
      icon: GitBranch,
      color: 'text-indigo-800 dark:text-indigo-400',
      bg: 'bg-indigo-800/10 dark:bg-indigo-400/10',
      border: 'border-indigo-800/20 dark:border-indigo-400/20',
      desc: '故事宏观四阶段 (Phases)、主支线剧情弧 (Arcs) 与伏笔埋设',
      statusText: '长篇节奏框架，确保有伏必有应',
    },
    {
      step: 5,
      tab: 'EDITOR',
      title: '正文执笔',
      subtitle: '沉浸分章创作',
      icon: BookOpen,
      color: 'text-primary dark:text-amber-300',
      bg: 'bg-amber-900/10 dark:bg-amber-300/10',
      border: 'border-amber-900/20 dark:border-amber-300/20',
      desc: '分卷章节树、场景细化 (Scene Beats)、Tiptap沉浸写作',
      statusText: `已连载 ${chapters.length} 章，共 ${totalWords.toLocaleString()} 字`,
    },
    {
      step: 6,
      tab: 'MEMORY',
      title: '记忆连载',
      subtitle: '五层记忆与连载',
      icon: Brain,
      color: 'text-teal-800 dark:text-teal-400',
      bg: 'bg-teal-800/10 dark:bg-teal-400/10',
      border: 'border-teal-800/20 dark:border-teal-400/20',
      desc: 'L0~L4 五层记忆自动沉淀、因果质检与多 Agent 自动连载',
      statusText: '沉淀章节客观事实，支撑百万字无矛盾推演',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-canvas dark:bg-[#181513] select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner with 3D Book Cover & Action Suite */}
        <div className="p-6 rounded-2xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-sm flex flex-col md:flex-row md:items-center gap-6">
          {/* 左侧：3D 实体书卷封面（带鼠标悬浮更换交互） */}
          <div className="shrink-0 flex justify-center md:justify-start">
            <BookCoverView
              novel={activeNovel}
              size="lg"
              interactive={true}
              onClick={() => setShowCoverModal(true)}
              className="hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* 中部：作品详情与元数据 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/20 font-semibold font-mono">
                {activeNovel.genre_profile || '长篇小说'}
              </span>
              <span className="text-xs text-ink-2 dark:text-[#9e9486]">
                创建于 {new Date(activeNovel.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-ink-2 dark:text-[#9e9486]">·</span>
              <span className="text-xs text-ink-2 dark:text-[#9e9486] font-mono">
                {chapters.length} 章节
              </span>
              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="ml-auto md:ml-1 text-[11px] font-medium text-primary dark:text-amber-400 hover:text-primary hover:underline flex items-center gap-1 cursor-pointer transition"
                title="打开封面与装帧设计工坊"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>设定封面</span>
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-[#f3eee7] tracking-tight mb-2 font-serif">
              《{activeNovel.title}》
            </h1>
            <p className="text-xs text-ink-2 dark:text-[#9e9486] max-w-xl leading-relaxed line-clamp-3">
              {activeNovel.description || '暂无作品简介。可在世界观设定或作品配置中随时补充背景设定与核心抓手。'}
            </p>

            {/* 今日创作指南针微标 (Smart Action Compass) */}
            <div className="p-3 rounded-xl bg-amber-800/10 dark:bg-amber-400/10 border border-amber-800/20 dark:border-amber-400/20 flex items-center justify-between gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <Compass className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
                <span className="text-xs text-ink dark:text-[#ede6dc] font-medium truncate">
                  {chapters.length === 0
                    ? '当前尚未起笔，建议拟定第 1 章奠定黄金开局！'
                    : (activeChapter || chapters[chapters.length - 1])?.word_count! < 1200
                    ? `《${(activeChapter || chapters[chapters.length - 1])?.title}》推进中，建议继续执笔推进核心冲突！`
                    : `《${(activeChapter || chapters[chapters.length - 1])?.title}》篇幅饱满，建议开启下一章或提取角色设定！`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = activeChapter || (chapters.length > 0 ? chapters[chapters.length - 1] : null);
                  if (target) selectChapter(target);
                  setActiveTab('EDITOR');
                }}
                className="text-[11px] text-primary dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
              >
                <span>直达光标开写</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 操作按钮区 */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-line/60 dark:border-[#38332e]">
              {/* 大主行动按钮：继续执笔 */}
              <button
                type="button"
                onClick={() => {
                  const target = activeChapter || (chapters.length > 0 ? chapters[chapters.length - 1] : null);
                  if (target) {
                    selectChapter(target);
                  }
                  setActiveTab('EDITOR');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold font-serif flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  继续执笔：
                  {activeChapter ? activeChapter.title : (chapters.length > 0 ? chapters[chapters.length - 1]?.title : '第一章')}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('novelforge:open-desk'))}
                className="px-3 py-2 rounded-xl bg-amber-800/10 hover:bg-amber-800/15 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 text-primary dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition border border-amber-800/20 dark:border-amber-400/30 cursor-pointer"
                title="打开全功能文人案头速览与新书启程中心"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                <span>案头启航台</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="px-3 py-2 rounded-xl bg-[#ede5d5] hover:bg-surface-3-hover dark:bg-[#2b2723] dark:hover:bg-[#342f2b] text-[#735e47] dark:text-[#d4c3ae] text-xs font-semibold flex items-center gap-1.5 transition border border-line dark:border-[#423b34] cursor-pointer"
                title="为小说定制艺术封皮、上传专属原画"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>设定封面</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWorkflowGuide(true)}
                className="px-3 py-2 rounded-xl bg-[#ede5d5] hover:bg-surface-3-hover dark:bg-[#2b2723] dark:hover:bg-[#342f2b] text-[#735e47] dark:text-[#d4c3ae] text-xs font-semibold flex items-center gap-1.5 transition border border-line dark:border-[#423b34] cursor-pointer"
                title="查看长篇小说多 Agent 协同创作全流程导引"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                <span>创作向导</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NEW: Visual Novel Creation Pipeline Roadmap                 */}
        {/* ============================================================ */}
        <div className="p-6 rounded-2xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-line dark:border-[#38332e] gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
              <h2 className="text-sm font-bold text-ink dark:text-[#f3eee7] font-serif tracking-wide truncate">
                长篇小说六步法协同创作流水线 (Creation Pipeline)
              </h2>
            </div>
            <button
              onClick={() => setShowWorkflowGuide(true)}
              className="text-xs text-primary dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>查看详细工作流规范</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {creationPipelineCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  onClick={() => setActiveTab(card.tab)}
                  className="group p-4 rounded-xl bg-[#faf6ee] dark:bg-[#25211e] hover:bg-[#f5ece0] dark:hover:bg-[#2c2723] border border-[#e5dcce] dark:border-[#38322c] hover:border-amber-800/40 dark:hover:border-amber-600/40 transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-surface-3 dark:bg-[#342e29] text-ink-2 dark:text-[#c4b59d] flex items-center justify-center text-xs font-mono font-bold">
                          {card.step}
                        </span>
                        <div className={`p-1.5 rounded-lg border ${card.bg} ${card.border}`}>
                          <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-primary dark:text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        <span>前往</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="font-serif font-bold text-sm text-ink dark:text-[#ede6dc] flex items-center gap-1.5">
                      <span>{card.title}</span>
                      <span className="text-[10px] font-sans font-normal text-ink-2 dark:text-[#8f8577]">
                        · {card.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-ink-2 dark:text-[#a09485] mt-1.5 leading-relaxed line-clamp-2">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#ede4d4] dark:border-[#322d28] text-[11px] text-ink-2 dark:text-[#9e9486] truncate">
                    {card.statusText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-xs">
            <div className="flex items-center justify-between text-ink-2 dark:text-[#9e9486] mb-2">
              <span className="text-xs font-medium">总创作字数</span>
              <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-ink dark:text-[#f3eee7] font-mono">
              {totalWords.toLocaleString()} <span className="text-xs font-sans text-ink-2 font-normal">字</span>
            </div>
            <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-1">
              平均每章约 {avgWords.toLocaleString()} 字
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-xs">
            <div className="flex items-center justify-between text-ink-2 dark:text-[#9e9486] mb-2">
              <span className="text-xs font-medium">连载章节数</span>
              <FileText className="w-4 h-4 text-primary dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-ink dark:text-[#f3eee7] font-mono">
              {chapters.length} <span className="text-xs font-sans text-ink-2 font-normal">章</span>
            </div>
            <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-1">
              已完成本地 SQLite WAL 存盘与版本快照
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-xs">
            <div className="flex items-center justify-between text-ink-2 dark:text-[#9e9486] mb-2">
              <span className="text-xs font-medium">文风与语言</span>
              <Award className="w-4 h-4 text-primary dark:text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-ink dark:text-[#ede6dc] truncate">
              {activeNovel.writing_style}
            </div>
            <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-1">
              内置 Humanizer 去 AI 味与对话呼吸感
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-ink-2 dark:text-[#9e9486] mb-2">
                <span className="text-xs font-medium">心流与原创字数</span>
                <PenTool className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-1">
                <DualWordStatsBadge />
              </div>
            </div>
            <div className="text-[10px] text-ink-2 dark:text-[#9e9486] mt-2">
              金黄手打 · 蓝紫AI · 签约申报存证
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveTab('CHARACTERS')}
            className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] hover:bg-[#faf4e8] dark:hover:bg-[#26221f] border border-line dark:border-[#38332e] hover:border-amber-800/40 cursor-pointer transition group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-800/10 text-primary dark:text-amber-400 group-hover:bg-amber-800/20 transition">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink dark:text-[#ede6dc]">人物档案库与拓扑图</h3>
                <p className="text-xs text-ink-2 dark:text-[#9e9486]">管理主角、配角与反派的性格、秘密、羁绊与动态演化</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('WORLD')}
            className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] hover:bg-[#faf4e8] dark:hover:bg-[#26221f] border border-line dark:border-[#38332e] hover:border-amber-800/40 cursor-pointer transition group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-800/10 text-orange-800 dark:text-orange-400 group-hover:bg-orange-800/20 transition">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink dark:text-[#ede6dc]">世界观设定 (Canon)</h3>
                <p className="text-xs text-ink-2 dark:text-[#9e9486]">构建战力法则、势力门派、地理体系与权威规则</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setShowBatchReviseModal(true)}
            className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] hover:bg-[#faf4e8] dark:hover:bg-[#26221f] border border-line dark:border-[#38332e] hover:border-amber-800/40 cursor-pointer transition group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-800/10 text-purple-800 dark:text-purple-400 group-hover:bg-purple-800/20 transition">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink dark:text-[#ede6dc]">跨章节批量修改与提案 (Batch Revise)</h3>
                <p className="text-xs text-ink-2 dark:text-[#9e9486]">批量去AI味、提速、尾钩、具象化，生成双栏 Diff 比较提案并安全采纳</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setShowMapModal(true)}
            className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] hover:bg-[#faf4e8] dark:hover:bg-[#26221f] border border-line dark:border-[#38332e] hover:border-amber-800/40 cursor-pointer transition group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-800/10 text-emerald-800 dark:text-emerald-400 group-hover:bg-emerald-800/20 transition">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink dark:text-[#ede6dc]">架空世界地理沙盘 (Map Sandbox)</h3>
                <p className="text-xs text-ink-2 dark:text-[#9e9486]">宣纸墨韵沙盘，宗门道场/都城天险坐标打点与历练行军路线因果校验</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Chapters Preview */}
        <div className="p-5 rounded-xl bg-surface dark:bg-[#201d1a] border border-line dark:border-[#38332e] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-line dark:border-[#38332e]">
            <h3 className="text-xs font-bold text-ink dark:text-[#ede6dc] uppercase tracking-wider font-serif">
              最近章节列表
            </h3>
            <span className="text-xs text-ink-2 dark:text-[#9e9486]">
              共 {chapters.length} 章
            </span>
          </div>

          {chapters.length === 0 ? (
            <p className="text-xs text-ink-2 dark:text-[#9e9486] py-4 text-center">
              暂无章节，请点击左侧栏新建章节或进入正文创作
            </p>
          ) : (
            <div className="space-y-2">
              {chapters.slice(0, 5).map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    selectChapter(ch);
                    setActiveTab('EDITOR');
                  }}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface dark:bg-[#25211e] hover:bg-surface-3 dark:hover:bg-[#2c2723] cursor-pointer transition text-xs border border-[#e3d9c7] dark:border-[#38322c] gap-3 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-ink dark:text-[#ede6dc] shrink-0 whitespace-nowrap">
                      第 {ch.chapter_number} 章
                    </span>
                    <span className="text-ink-2 dark:text-[#a09485] truncate">{ch.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-ink-2 dark:text-[#9e9486] shrink-0 whitespace-nowrap">
                    <span className="font-mono">{ch.word_count || 0} 字</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-2 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creation Workflow Modal */}
      <CreationWorkflowModal
        isOpen={showWorkflowGuide}
        onClose={() => setShowWorkflowGuide(false)}
      />

      {/* Book Cover Design Studio Modal */}
      <BookCoverModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
      />

      {/* Batch Revise Studio Modal */}
      <BatchReviseModal
        isOpen={showBatchReviseModal}
        onClose={() => setShowBatchReviseModal(false)}
      />

      {/* World Map Sandbox Modal */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
      />
    </div>
  );
};
