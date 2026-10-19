import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { SerializationJob } from '@/types';
import {
  FastForward,
  Play,
  RefreshCw,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export const SerializationQueuePanel: React.FC = () => {
  const { activeNovel, loadChapters } = useNovelStore();
  const [jobs, setJobs] = useState<SerializationJob[]>([]);
  const [currentJob, setCurrentJob] = useState<SerializationJob | null>(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New job state
  const [showCreate, setShowCreate] = useState(false);
  const [targetCount, setTargetCount] = useState(3);
  const [targetWords, setTargetWords] = useState(3000);
  const [autoApprove, setAutoApprove] = useState(false);

  const loadJobs = async () => {
    if (!activeNovel) return;
    try {
      const list = await api.listSerializationJobs(activeNovel.id);
      setJobs(list);
      if (list.length > 0) {
        const active = list.find(
          (j) => j.status === 'RUNNING' || j.status === 'WAITING_REVIEW' || j.status === 'PENDING'
        );
        setCurrentJob(active || list[0]);
      }
    } catch (e) {
      console.error('加载连载任务失败:', e);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [activeNovel?.id]);

  const handleStartJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel) return;
    try {
      const newJob = await api.startSerializationJob({
        novel_id: activeNovel.id,
        chapters_count: targetCount,
        chapter_target_words: targetWords,
        auto_approve: autoApprove,
        budget_tokens: 150000,
      });
      setShowCreate(false);
      await loadJobs();
      setCurrentJob(newJob);
      setStatusMessage('新连载任务已启动！');
    } catch (e) {
      setStatusMessage(`启动任务失败: ${e}`);
    }
  };

  const handleAdvanceStep = async () => {
    if (!currentJob) return;
    setStepLoading(true);
    setStatusMessage('多 Agent 正在按流水线协同生成下一章节...');
    try {
      const updated = await api.advanceSerializationJobStep(currentJob.id);
      setCurrentJob(updated);
      await loadJobs();
      if (activeNovel) await loadChapters(activeNovel.id);
      setStatusMessage(`推进完成！当前进度: ${updated.completed_chapters_count}/${updated.target_chapters_count} 章`);
    } catch (e) {
      setStatusMessage(`单步推进失败: ${e}`);
    } finally {
      setStepLoading(false);
    }
  };

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请选择或创建小说项目以管理自动连载队列
      </div>
    );
  }

  const progressPercent = currentJob
    ? Math.round((currentJob.completed_chapters_count / Math.max(1, currentJob.target_chapters_count)) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <FastForward className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">连载任务队列 ({jobs.length})</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 shrink-0" />
          新建连载
        </button>
      </div>

      {statusMessage && (
        <div className="px-3 py-1 bg-amber-800/10 text-primary border-b border-amber-800/20 text-[11px] font-medium">
          {statusMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {showCreate && (
          <form onSubmit={handleStartJob} className="bg-surface border border-line rounded-lg p-3 space-y-2.5 shadow-xs">
            <h4 className="font-bold text-xs text-primary">配置新连载任务</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">连载目标章节数</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#fcfaf5] border border-line rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">单章期望字数</label>
                <input
                  type="number"
                  step={500}
                  value={targetWords}
                  onChange={(e) => setTargetWords(parseInt(e.target.value) || 3000)}
                  className="w-full bg-[#fcfaf5] border border-line rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-ink-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded text-primary"
              />
              <span>全自动连续推进模式（免人工审核挂起）</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-2.5 py-1 rounded border border-line"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-amber-800 text-white font-medium hover:bg-amber-700"
              >
                确认创建
              </button>
            </div>
          </form>
        )}

        {currentJob ? (
          <div className="bg-surface border border-line rounded-lg p-3 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-primary">
                  任务 #{currentJob.id.substring(0, 8)}
                </span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary border border-amber-800/20 font-bold">
                  {currentJob.status}
                </span>
              </div>
              <span className="text-[10px] text-ink-2">
                {currentJob.completed_chapters_count} / {currentJob.target_chapters_count} 章
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
                <div
                  className="bg-amber-800 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink-2">
                <span>推进进度 {progressPercent}%</span>
                <span>Token: {currentJob.used_tokens?.toLocaleString() || 0} / {currentJob.budget_tokens?.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-line flex items-center justify-between">
              <div className="text-[10px] text-ink-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                <span>防破坏性安全防护机制已启用</span>
              </div>
              <button
                onClick={handleAdvanceStep}
                disabled={stepLoading || currentJob.status === 'COMPLETED'}
                className="px-3 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                {stepLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    推进中...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    推进下一章
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-ink-2">
            <FastForward className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>暂无连载任务，点击右上角【新建连载任务】</p>
          </div>
        )}
      </div>
    </div>
  );
};
