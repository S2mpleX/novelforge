import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  ShieldCheck,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { FullCheckEngine } from '@/features/fullcheck/FullCheckEngine';
import { FullCheckReport } from '@/features/fullcheck/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const FullCheckModal: React.FC<Props> = ({ isOpen, onClose, embedded = false }) => {
  const { activeNovel, chapters, selectChapter } = useNovelStore();
  const [report, setReport] = useState<FullCheckReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');

  if (!isOpen && !embedded) return null;

  const handleRunCheck = async () => {
    setIsRunning(true);
    try {
      const novelId = activeNovel?.id;
      const [characters, worldRules, plotThreads] = novelId
        ? await Promise.all([
            api.listCharacters(novelId).catch(() => []),
            api.listWorldRules(novelId).catch(() => []),
            api.listPlotThreads(novelId).catch(() => []),
          ])
        : [[], [], []];

      const result = FullCheckEngine.runCheck({
        chapters,
        characters,
        worldRules,
        plotThreads,
      });
      setReport(result);
    } catch (e) {
      console.error('全书体检失败:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleJumpToChapter = (chapterId?: string) => {
    if (!chapterId) return;
    const ch = chapters.find((c) => c.id === chapterId);
    if (ch) {
      selectChapter(ch);
      onClose();
    }
  };

  // 过滤后的 issues
  const filteredIssues = (report?.issues || []).filter((issue) => {
    if (selectedSeverity !== 'ALL' && issue.severity !== selectedSeverity) return false;
    if (selectedDimension !== 'ALL' && issue.dimension !== selectedDimension) return false;
    return true;
  });

  const innerContent = (
    <div className={`w-full ${embedded ? 'h-full rounded-none border-0' : 'max-w-4xl h-[88vh] rounded-2xl border border-line dark:border-[#2e2a27] shadow-2xl animate-in fade-in zoom-in-95 duration-200'} bg-surface dark:bg-[#1a1714] flex flex-col overflow-hidden`}>
      {/* 顶部标题栏 */}
      <div className="px-5 py-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
              全书因果体检巡检 (FullCheck)
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                全生命周期守护
              </span>
            </h2>
            <p className="text-[11px] text-ink-2 dark:text-stone-400">
              跨章深度排查：死人诈尸、伤病闭关登场、核心角色掉线、伏笔烂尾滞后、权威公理违背与平台发布合规
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#ded5c4]/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* 顶部操作与健康指数仪表盘 */}
        <div className="p-4 border-b border-line dark:border-[#2e2a27] bg-[#faf5ec]/50 dark:bg-[#181513]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCheck}
              disabled={isRunning || !chapters.length}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isRunning ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isRunning ? '正在深度体检全书中...' : '开始全景体检'}</span>
            </button>
            <span className="text-xs text-stone-500">
              当前作品：<strong className="text-stone-700 dark:text-stone-300">{activeNovel?.title || '未选择'}</strong> · 共 {chapters.length} 章
            </span>
          </div>

          {/* 健康指数徽章 */}
          {report && (
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                  report.overallHealthScore >= 90
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : report.overallHealthScore >= 75
                    ? 'bg-amber-50 text-primary border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>因果健康分：{report.overallHealthScore} / 100</span>
                <span className="font-normal text-[11px] opacity-80">({report.ratingLabel.slice(0, 8)})</span>
              </div>
            </div>
          )}
        </div>

        {/* 筛选标签条 */}
        {report && (
          <div className="px-4 py-2 bg-stone-100/60 dark:bg-stone-900/40 border-b border-line dark:border-[#2e2a27] flex flex-wrap items-center justify-between text-xs gap-2 shrink-0">
            {/* 严重度过滤 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400">严重程度:</span>
              <button
                onClick={() => setSelectedSeverity('ALL')}
                className={`px-2 py-0.5 rounded-md ${
                  selectedSeverity === 'ALL'
                    ? 'bg-stone-800 text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                全部 ({report.issues.length})
              </button>
              {report.criticalCount > 0 && (
                <button
                  onClick={() => setSelectedSeverity('CRITICAL')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    selectedSeverity === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  致命 ({report.criticalCount})
                </button>
              )}
              {report.warningCount > 0 && (
                <button
                  onClick={() => setSelectedSeverity('WARNING')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    selectedSeverity === 'WARNING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-primary border border-amber-200'
                  }`}
                >
                  警告 ({report.warningCount})
                </button>
              )}
              {report.infoCount > 0 && (
                <button
                  onClick={() => setSelectedSeverity('INFO')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    selectedSeverity === 'INFO'
                      ? 'bg-stone-600 text-white'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  提示 ({report.infoCount})
                </button>
              )}
            </div>

            {/* 维度过滤 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400">检查维度:</span>
              <select
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300"
              >
                <option value="ALL">全部维度</option>
                <option value="CHARACTER_LIFE">角色因果与出场</option>
                <option value="FORESHADOW_ORPHAN">伏笔生命周期</option>
                <option value="CANON_CONFLICT">世界观公理一致性</option>
                <option value="LENGTH_PACE">篇幅与断章节奏</option>
                <option value="CENSOR_RISK">平台敏感词合规</option>
              </select>
            </div>
          </div>
        )}

        {/* 主体报告列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-surface dark:bg-[#1a1714]">
          {report ? (
            filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border transition shadow-2xs ${
                    issue.severity === 'CRITICAL'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : issue.severity === 'WARNING'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : issue.severity === 'WARNING'
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-500 text-white'
                        }`}
                      >
                        {issue.severity === 'CRITICAL' ? '致命缺陷' : issue.severity === 'WARNING' ? '警示问题' : '优化建议'}
                      </span>
                      <h4 className="font-bold text-xs text-stone-800 dark:text-stone-200">
                        {issue.title}
                      </h4>
                      {issue.chapterTitle && (
                        <span className="text-[11px] text-stone-500 font-serif">
                          (《{issue.chapterTitle}》)
                        </span>
                      )}
                    </div>

                    {issue.chapterId && (
                      <button
                        onClick={() => handleJumpToChapter(issue.chapterId)}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary dark:text-amber-400 hover:underline cursor-pointer shrink-0"
                      >
                        <span>定位此章</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
                    {issue.description}
                  </p>

                  {issue.excerpt && (
                    <div className="mt-2 p-2 rounded bg-white/80 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 text-xs font-serif italic text-stone-600 dark:text-stone-400">
                      原文片段：“{issue.excerpt}”
                    </div>
                  )}

                  <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                    <strong>修复指引：</strong>{issue.suggestion}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-stone-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 opacity-80" />
                <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">
                  当前筛选条件下零缺陷！
                </p>
                <p className="text-xs">
                  {report.summary}
                </p>
              </div>
            )
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-stone-400 space-y-3">
              <ShieldCheck className="w-12 h-12 opacity-30 text-emerald-700" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                尚未执行全书体检，点击上方【开始全景体检】排查全书
              </p>
              <p className="text-xs text-stone-400 max-w-md text-center">
                将深度检验：已确认死亡角色是否意外出场、重要角色是否长时间掉线、伏笔是否烂尾未回收、世界观公理法则是否发生抵触
              </p>
            </div>
          )}
        </div>
      </div>
    );

  if (embedded) {
    return <div className="w-full h-full select-none font-sans">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      {innerContent}
    </div>
  );
};
