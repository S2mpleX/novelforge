import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { WorkflowTemplate, WorkflowRunDetails } from '@/types';
import {
  GitCommit,
  Check,
  Maximize2,
  Plus,
} from 'lucide-react';
import { WorkflowRunnerModal } from '@/components/modals/WorkflowRunnerModal';

export const WorkflowPanel: React.FC = () => {
  const { activeNovel, activeChapter } = useNovelStore();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [currentRunDetails, setCurrentRunDetails] = useState<WorkflowRunDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!activeNovel) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.listWorkflowTemplates(activeNovel.id).catch(() => []),
      api.listWorkflowRuns(activeNovel.id).catch(() => []),
    ]).then(([tpls, runList]) => {
      if (!isMounted) return;
      setTemplates(tpls || []);
      if (runList && runList.length > 0) {
        api.getWorkflowRunDetails(runList[0].id).then((d) => {
          if (isMounted) setCurrentRunDetails(d);
        });
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeNovel]);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-6 text-center">
        请选择或创建小说项目以使用工作流引擎
      </div>
    );
  }

  const handleStartRun = async (templateId: string) => {
    try {
      setIsLoading(true);
      const newRun = await api.createWorkflowRun({
        template_id: templateId,
        novel_id: activeNovel.id,
        target_chapter_id: activeChapter?.id,
      });
      const details = await api.getWorkflowRunDetails(newRun.id);
      setCurrentRunDetails(details);
      setFeedback('已启动新工作流！');
    } catch (e: any) {
      setFeedback(`启动失败: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRun = currentRunDetails?.run;
  const steps = currentRunDetails?.steps || [];

  return (
    <div className="flex flex-col h-full w-full bg-card text-foreground text-xs overflow-hidden select-none">
      {/* 顶栏 */}
      <div className="p-2.5 border-b border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-xs">
          <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
          <span>剧情工作流执行流水线</span>
        </div>
        <button
          type="button"
          onClick={() => setShowFullModal(true)}
          className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
          全屏工作台
        </button>
      </div>

      {/* 实例摘要与快捷新建 */}
      <div className="p-3 border-b border-border/40 bg-background/50 flex items-center justify-between">
        <div>
          <div className="font-semibold text-foreground text-xs">
            {currentRunDetails?.template.name || '暂无进行中工作流'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {currentRun
              ? currentRun.status === 'COMPLETED'
                ? '全部步骤已执行完毕'
                : `当前进行中：第 ${currentRun.current_step_index + 1} 步`
              : '点击右侧开启新推演'}
          </div>
        </div>

        {templates.length > 0 && (
          <button
            type="button"
            onClick={() => handleStartRun(templates[0].id)}
            disabled={isLoading}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            黄金三章推演
          </button>
        )}
      </div>

      {/* 步骤轻量列表 */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar">
        {steps.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            暂无步骤记录，请点击上方按钮开启推演或点击右上角打开全屏工作台。
          </div>
        ) : (
          steps.map((s, idx) => {
            const isCurrent = currentRun?.current_step_index === idx && currentRun.status !== 'COMPLETED';
            const isCompleted = s.status === 'COMPLETED' || Boolean(s.edited_output || s.raw_output);

            return (
              <div
                key={s.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-card border-indigo-500/60 shadow-sm'
                    : isCompleted
                    ? 'bg-card/60 border-emerald-500/30'
                    : 'bg-muted/10 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </span>
                    {s.title}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : isCurrent
                        ? 'bg-indigo-500/15 text-indigo-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? '已产出' : isCurrent ? '进行中' : '等待'}
                  </span>
                </div>

                {s.edited_output || s.raw_output ? (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 bg-background/50 p-1.5 rounded border border-border/30">
                    {s.edited_output || s.raw_output}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">
                    等待执行生成...
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {feedback && (
        <div className="p-2 text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 text-center border-t border-indigo-500/20">
          {feedback}
        </div>
      )}

      {/* 完整模态框 */}
      {showFullModal && (
        <WorkflowRunnerModal
          isOpen={showFullModal}
          onClose={() => setShowFullModal(false)}
        />
      )}
    </div>
  );
};
