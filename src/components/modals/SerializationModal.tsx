import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { SerializationJob, StartSerializationJobInput } from '@/types';
import {
  X,
  Play,
  Pause,
  StopCircle,
  FastForward,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface SerializationModalProps {
  onClose: () => void;
}

export const SerializationModal: React.FC<SerializationModalProps> = ({ onClose }) => {
  const { activeNovel, chapters, loadChapters, selectChapter, setActiveTab } = useNovelStore();

  const [jobs, setJobs] = useState<SerializationJob[]>([]);
  const [currentJob, setCurrentJob] = useState<SerializationJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Job Configuration Form
  const [chaptersCount, setChaptersCount] = useState<number>(3);
  const [chapterTargetWords, setChapterTargetWords] = useState<number>(3000);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [budgetTokens, setBudgetTokens] = useState<number>(200000);

  useEffect(() => {
    if (activeNovel) {
      loadJobs();
    }
  }, [activeNovel]);

  const loadJobs = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const list = await api.listSerializationJobs(activeNovel.id);
      setJobs(list);
      if (list.length > 0) {
        // Default to the latest active or most recent job
        const active = list.find(j => j.status === 'RUNNING' || j.status === 'WAITING_REVIEW' || j.status === 'PENDING');
        setCurrentJob(active || list[0]);
      }
    } catch (e) {
      console.error('加载连载任务失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!activeNovel) return;
    setLoading(true);
    setStatusMessage('正在初始化多 Agent 自动连载流水线...');
    try {
      const input: StartSerializationJobInput = {
        novel_id: activeNovel.id,
        chapters_count: Number(chaptersCount),
        chapter_target_words: Number(chapterTargetWords),
        auto_approve: autoApprove,
        budget_tokens: Number(budgetTokens),
      };
      const created = await api.createSerializationJob(input);
      setStatusMessage(`连载任务已创建，计划生成 ${created.target_chapters_count} 章。`);
      await loadJobs();
      setCurrentJob(created);
    } catch (e: any) {
      setStatusMessage(`创建失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStep = async () => {
    if (!currentJob || !activeNovel) return;
    setStepLoading(true);
    setStatusMessage('【Agent 协作流执行中】主编规划 ➔ 场景编剧 ➔ 正文生成 ➔ 逻辑审校 ➔ 长期记忆沉淀...');
    try {
      const updated = await api.advanceSerializationJobStep(currentJob.id);
      setCurrentJob(updated);
      await loadChapters(activeNovel.id);
      await loadJobs();
      setStatusMessage(`已推进至第 ${updated.completed_chapters_count}/${updated.target_chapters_count} 章！当前状态: ${updated.status}`);
      return updated;
    } catch (e: any) {
      setStatusMessage(`单步推进失败: ${e.message || e}`);
      throw e;
    } finally {
      setStepLoading(false);
    }
  };

  // Continuous Auto Run loop
  const handleToggleAutoRun = async () => {
    if (isAutoRunning) {
      setIsAutoRunning(false);
      setStatusMessage('已停止自动循环推进。');
      return;
    }

    if (!currentJob) return;
    setIsAutoRunning(true);
    setStatusMessage('启动连续连载推进流...');

    try {
      let jobState = currentJob;
      while (
        jobState.status !== 'COMPLETED' &&
        jobState.status !== 'CANCELLED' &&
        jobState.status !== 'FAILED' &&
        jobState.completed_chapters_count < jobState.target_chapters_count
      ) {
        if (!isAutoRunning && jobState !== currentJob) {
          // If stopped
          break;
        }
        setStatusMessage(`正在自动编排第 ${jobState.completed_chapters_count + 1} 章...`);
        const nextJob = await handleAdvanceStep();
        if (!nextJob) break;
        jobState = nextJob;

        // If not auto_approve and waiting review, pause loop for user confirmation
        if (jobState.status === 'WAITING_REVIEW') {
          setStatusMessage('章节已就绪，当前处于待人工审阅状态，已安全暂缓连载。');
          break;
        }
      }
      if (jobState.status === 'COMPLETED') {
        setStatusMessage('🎉 全书连载目标已达成！全部章节均已生成并提炼长期记忆。');
      }
    } catch (e: any) {
      console.error('连续推进中断:', e);
    } finally {
      setIsAutoRunning(false);
    }
  };

  const handlePauseJob = async () => {
    if (!currentJob) return;
    try {
      await api.pauseSerializationJob(currentJob.id);
      setStatusMessage('连载任务已暂停。');
      await loadJobs();
    } catch (e: any) {
      setStatusMessage(`暂停失败: ${e.message || e}`);
    }
  };

  const handleCancelJob = async () => {
    if (!currentJob) return;
    if (!confirm('确定要取消该连载任务吗？已生成章节将安全保留。')) return;
    try {
      await api.cancelSerializationJob(currentJob.id);
      setStatusMessage('连载任务已安全终止。');
      await loadJobs();
    } catch (e: any) {
      setStatusMessage(`取消失败: ${e.message || e}`);
    }
  };

  const handleViewCurrentChapter = async () => {
    if (!currentJob?.current_chapter_id) return;
    const target = chapters.find(c => c.id === currentJob.current_chapter_id);
    if (target) {
      await selectChapter(target);
      setActiveTab('EDITOR');
      onClose();
    }
  };

  const getStatusBadge = (status: SerializationJob['status']) => {
    switch (status) {
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3 animate-spin" /> 执行中</span>;
      case 'WAITING_REVIEW':
        return <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> 等待审定</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已完结</span>;
      case 'PAUSED':
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1"><Pause className="w-3 h-3" /> 已暂停</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><StopCircle className="w-3 h-3" /> 已取消</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const progressPercent = currentJob
    ? Math.min(100, Math.round((currentJob.completed_chapters_count / Math.max(1, currentJob.target_chapters_count)) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">自动连载控制台 (Serialization Engine)</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded">
                  Phase 5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                多 Agent 串联连载流：从剧情弧与伏笔提取 ➔ 分解场景细纲 ➔ 结合五层记忆写作 ➔ 严密逻辑审稿 ➔ 权威记忆沉淀
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Novel Summary */}
          {activeNovel ? (
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">当前连载作品</span>
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2 mt-0.5">
                  <span>{activeNovel.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                    {activeNovel.genre_profile}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">现有已建章节</span>
                <div className="text-sm font-bold text-slate-300 mt-0.5">{chapters.length} 章</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
              请先在左侧选择或创建一部小说。
            </div>
          )}

          {/* Current Active Job Status Card */}
          {currentJob ? (
            <div className="bg-slate-950 p-5 rounded-xl border border-indigo-900/40 shadow-inner space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">当前任务状态:</span>
                  {getStatusBadge(currentJob.status)}
                  <span className="text-xs text-slate-500 ml-2">ID: {currentJob.id.slice(0, 8)}...</span>
                </div>
                <div className="text-xs text-slate-400">
                  Token 消耗：<span className="text-indigo-400 font-semibold">{currentJob.used_tokens}</span> / {currentJob.budget_tokens}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    连载进度：{currentJob.completed_chapters_count} / {currentJob.target_chapters_count} 章
                  </span>
                  <span className="text-indigo-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Guardrail & Mode Indicator */}
              <div className="flex items-center gap-4 text-xs bg-slate-900/80 p-2.5 rounded border border-slate-800 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>定稿模式: <strong className="text-slate-200">{currentJob.auto_approve ? '全自动定稿推进' : '安全模式 (每章等待人工审定)'}</strong></span>
                </div>
                {currentJob.current_chapter_id && (
                  <button
                    onClick={handleViewCurrentChapter}
                    className="ml-auto text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    跳转编辑当前章节
                  </button>
                )}
              </div>

              {/* Operations Control Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleAdvanceStep}
                  disabled={stepLoading || currentJob.status === 'COMPLETED' || currentJob.status === 'CANCELLED'}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                >
                  <FastForward className="w-4 h-4" />
                  {stepLoading ? 'Agent 正在创作中...' : '推进下一章 (Advance Step)'}
                </button>

                <button
                  onClick={handleToggleAutoRun}
                  disabled={stepLoading || currentJob.status === 'COMPLETED' || currentJob.status === 'CANCELLED'}
                  className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
                    isAutoRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isAutoRunning ? '暂停自动循环' : '连续自动连载 (Auto Run)'}
                </button>

                {currentJob.status === 'RUNNING' && (
                  <button
                    onClick={handlePauseJob}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition border border-slate-700"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    暂停任务
                  </button>
                )}

                {currentJob.status !== 'COMPLETED' && currentJob.status !== 'CANCELLED' && (
                  <button
                    onClick={handleCancelJob}
                    className="px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-800/60 text-xs flex items-center gap-1 transition"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    中止任务
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">暂无进行中的连载任务</p>
              <p className="text-xs text-slate-500">可在下方配置并启动新的全自动多 Agent 创作任务。</p>
            </div>
          )}

          {/* Status Live Notification */}
          {statusMessage && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-xs text-indigo-200 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* New Job Setup Section */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              配置并启动新的连载批次
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  计划生成章节数
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={chaptersCount}
                  onChange={(e) => setChaptersCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">建议每次批次规划 3 ~ 10 章</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  单章预期目标字数
                </label>
                <input
                  type="number"
                  step={500}
                  min={1000}
                  max={8000}
                  value={chapterTargetWords}
                  onChange={(e) => setChapterTargetWords(parseInt(e.target.value) || 3000)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">默认 3000 字（按细纲场景精准拆解分段）</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  批次 Token 预算上限
                </label>
                <input
                  type="number"
                  step={10000}
                  value={budgetTokens}
                  onChange={(e) => setBudgetTokens(parseInt(e.target.value) || 200000)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs text-slate-200 font-medium">允许全自动定稿并推进</span>
                </label>
                <span className="text-[11px] text-slate-500 mt-1 ml-6">
                  未勾选时，每章生成后将安全停留在待审定状态，不擅自推进下一章
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreateJob}
                disabled={loading || !activeNovel}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                初始化并启动连载流水线
              </button>
            </div>
          </div>

          {/* Job History Table */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                历史任务记录 ({jobs.length})
              </h3>
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">任务 ID</th>
                      <th className="px-3 py-2">状态</th>
                      <th className="px-3 py-2">进度</th>
                      <th className="px-3 py-2">Token</th>
                      <th className="px-3 py-2">创建时间</th>
                      <th className="px-3 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-900/40 transition">
                        <td className="px-3 py-2.5 font-mono text-slate-300">
                          {job.id.slice(0, 8)}...
                        </td>
                        <td className="px-3 py-2.5">{getStatusBadge(job.status)}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-medium">
                          {job.completed_chapters_count} / {job.target_chapters_count} 章
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {job.used_tokens}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Date(job.created_at * 1000).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => setCurrentJob(job)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            载入控制台
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>安全保障：已生成文本永久存入本地 SQLite，随时支持版本回溯与手动精修</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
