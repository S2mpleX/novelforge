import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type {
  WorkflowTemplate,
  WorkflowRun,
  WorkflowRunDetails,
} from '@/types';
import {
  GitCommit,
  Play,
  RotateCcw,
  X,
  Plus,
  History,
  Check,
  Loader2,
  Copy,
  Sparkles,
  FileText,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';
import { confirmDialog } from '@/utils/dialog';

interface WorkflowRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowRunnerModal: React.FC<WorkflowRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeNovel, activeChapter } = useNovelStore();

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentRunDetails, setCurrentRunDetails] = useState<WorkflowRunDetails | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedSuccessStepId, setSavedSuccessStepId] = useState<string | null>(null);

  // 初始化加载模板与运行列表
  useEffect(() => {
    if (!isOpen || !activeNovel) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.listWorkflowTemplates(activeNovel.id).catch(() => []),
      api.listWorkflowRuns(activeNovel.id).catch(() => []),
    ]).then(([tpls, runList]) => {
      if (!isMounted) return;
      setTemplates(tpls || []);
      setRuns(runList || []);
      if (tpls && tpls.length > 0) {
        setSelectedTemplateId(tpls[0].id);
      }
      if (runList && runList.length > 0) {
        // 自动装载最近的一个 run
        loadRunDetails(runList[0].id);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeNovel]);

  const loadRunDetails = async (runId: string) => {
    try {
      const details = await api.getWorkflowRunDetails(runId);
      setCurrentRunDetails(details);
    } catch (e: any) {
      console.error('Failed to load run details:', e);
    }
  };

  const handleCreateRun = async (templateId: string) => {
    if (!activeNovel) return;
    setIsLoading(true);
    setStatusMessage('正在初始化工作流实例...');

    try {
      const run = await api.createWorkflowRun({
        template_id: templateId,
        novel_id: activeNovel.id,
        target_chapter_id: activeChapter?.id,
        run_mode: 'STEP',
      });
      // 重新加载并激活新 run
      const updatedRuns = await api.listWorkflowRuns(activeNovel.id);
      setRuns(updatedRuns);
      await loadRunDetails(run.id);
      setStatusMessage('新工作流实例已创建，可以开始执行第一步！');
    } catch (e: any) {
      setStatusMessage(`创建运行失败: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存单步原地修改
  const handleSaveStepOutput = async (stepId: string, output: string) => {
    try {
      await api.updateWorkflowStepOutput({
        step_record_id: stepId,
        edited_output: output,
      });
      setSavedSuccessStepId(stepId);
      setTimeout(() => setSavedSuccessStepId(null), 2000);
    } catch (e: any) {
      setStatusMessage(`保存修改失败: ${e.message || e}`);
    }
  };

  // 执行单步生成
  const handleExecuteCurrentStep = async (stepIndex: number) => {
    if (!currentRunDetails || !activeNovel) return;
    const { run, steps } = currentRunDetails;
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    setIsExecutingStep(true);
    setStatusMessage(`正在执行步骤 [${currentStep.title}]...`);

    try {
      // 1. 动态变量替换：将前面步骤的 output 替换到当前 prompt 中（采用函数返回值杜绝 $ 字符捕获组吞字缺陷）
      let renderedPrompt = currentStep.prompt_rendered;
      steps.forEach((prevStep, prevIdx) => {
        const val = prevStep.edited_output || prevStep.raw_output || '';
        renderedPrompt = renderedPrompt
          .replace(new RegExp(`\\{\\{step_${prevIdx + 1}_output\\}\\}`, 'g'), () => val)
          .replace(new RegExp(`\\{\\{${prevStep.step_key}\\}\\}`, 'g'), () => val);
      });

      // 2. 调用真实的 LLM 生成
      const systemPrompt = `你作为小说创作专业 Agent，正在为作品《${activeNovel.title}》执行连贯推演工作流。文风要求：${activeNovel.writing_style}。请针对当前步骤给出严谨、沉浸、符合长篇小说创作逻辑的高质量内容。直接输出正文结果，严禁多余客套话。`;

      const generated = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: renderedPrompt,
        temperature: 0.75,
        max_tokens: 3000,
      });

      // 3. 更新单步记录
      await api.updateWorkflowStepOutput({
        step_record_id: currentStep.id,
        edited_output: generated,
      });

      // 4. 流转步骤状态至 COMPLETED
      const advanced = await api.advanceWorkflowStep({
        run_id: run.id,
        step_index: stepIndex,
        auto_advance_next: false,
      });

      setCurrentRunDetails(advanced);
      setStatusMessage(`步骤 [${currentStep.title}] 推演完毕！您可以在卡片内原地修改，满意后点击进入下一步。`);
    } catch (e: any) {
      console.error('Execute step error:', e);
      setStatusMessage(`执行失败: ${e.message || e}`);
    } finally {
      setIsExecutingStep(false);
    }
  };

  const handleAppendToChapter = async (text: string) => {
    if (!activeChapter || !text.trim()) return;
    try {
      const paragraphs = text
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('');
      const newContent = `${activeChapter.content || ''}${paragraphs}`;
      await api.saveChapterContent(activeChapter.id, newContent, true, 'WORKFLOW_APPEND');
      window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'));
      toast.success('已追加至正文', `已将成果追加到《${activeChapter.title}》末尾`);
    } catch (e: any) {
      toast.error('追加失败', e?.message || '保存正文出错');
    }
  };

  const handleReplaceChapter = async (text: string) => {
    if (!activeChapter || !text.trim()) return;
    const ok = await confirmDialog({
      title: '采纳为当前章节正文',
      message: `确定要将工作流产出成果覆盖《${activeChapter.title}》吗？系统将自动为你生成历史版本备份。`,
      confirmText: '确定采纳',
      cancelText: '取消',
    });
    if (!ok) return;

    try {
      const paragraphs = text
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('');
      await api.saveChapterContent(activeChapter.id, paragraphs, true, 'WORKFLOW_REPLACE');
      window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'));
      toast.success('已采纳为正文', `已将工作流成果覆盖至《${activeChapter.title}》`);
    } catch (e: any) {
      toast.error('采纳失败', e?.message || '保存正文出错');
    }
  };

  const handleCopyStepOutput = async (text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.info('已复制到剪贴板', text.slice(0, 30) + '...');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const currentRun = currentRunDetails?.run;
  const currentSteps = currentRunDetails?.steps || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-6xl h-[88vh] rounded-2xl border border-border/80 shadow-2xl flex flex-col overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                剧情工作流执行引擎
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  MVP Pipeline
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                分步推演 · 上游输出自动注入下游 · 卡片内原地打磨 · 断点恢复
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体分栏 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：工作流模板与历史实例 */}
          <div className="w-64 border-r border-border/60 bg-muted/10 p-4 space-y-4 overflow-y-auto">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                预设工作流模板
              </div>
              <div className="space-y-1.5">
                {templates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-medium border-indigo-500/30 shadow-sm'
                          : 'bg-background/40 border-border/50 hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{tpl.name}</span>
                        {tpl.is_builtin && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground">
                            内置
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 创建新运行按钮 */}
              <button
                type="button"
                onClick={() => handleCreateRun(selectedTemplateId)}
                disabled={isLoading || !selectedTemplateId}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                开启此模板新推演
              </button>
            </div>

            {/* 历史运行实例 */}
            {runs.length > 0 && (
              <div className="pt-3 border-t border-border/50">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  历史推演记录 ({runs.length})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {runs.map((r) => {
                    const isSelected = currentRun?.id === r.id;
                    const runTemplate = templates.find((t) => t.id === r.template_id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => loadRunDetails(r.id)}
                        className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                            : 'bg-background/20 border-border/40 hover:bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="truncate">{runTemplate?.name || '工作流'}</span>
                          <span
                            className={`text-[10px] px-1 rounded ${
                              r.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {r.status === 'COMPLETED' ? '已完成' : `步骤 ${r.current_step_index + 1}`}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：当前工作流流水线视图 */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between custom-scrollbar">
            {currentRunDetails ? (
              <div className="space-y-6">
                {/* 状态横幅 */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/70 shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>{currentRunDetails.template.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                        共 {currentSteps.length} 个步骤
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentRunDetails.template.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        currentRun?.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {currentRun?.status === 'COMPLETED' ? '全流水线完成' : `进行至步骤 ${(currentRun?.current_step_index || 0) + 1}`}
                    </span>
                  </div>
                </div>

                {/* 流水线卡片列表 */}
                <div className="space-y-5">
                  {currentSteps.map((step, idx) => {
                    const isCurrent = currentRun?.current_step_index === idx && currentRun.status !== 'COMPLETED';
                    const isCompleted = step.status === 'COMPLETED' || Boolean(step.edited_output || step.raw_output);

                    return (
                      <div
                        key={step.id}
                        className={`rounded-2xl border transition-all p-4.5 ${
                          isCurrent
                            ? 'bg-card border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/20'
                            : isCompleted
                            ? 'bg-card/70 border-emerald-500/30'
                            : 'bg-muted/10 border-border/50 opacity-70'
                        }`}
                      >
                        {/* 步骤标题与状态 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {step.title}
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 font-normal">
                                    当前阶段
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleExecuteCurrentStep(idx)}
                                disabled={isExecutingStep}
                                className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                              >
                                {isExecutingStep ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    推演中...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5" />
                                    {step.edited_output ? '重新执行此步' : '执行此步'}
                                  </>
                                )}
                              </button>
                            )}

                            {isCompleted && !isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleExecuteCurrentStep(idx)}
                                disabled={isExecutingStep}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded bg-muted/60"
                              >
                                <RotateCcw className="w-3 h-3" />
                                重跑
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 提示词说明 */}
                        <div className="text-xs text-muted-foreground mb-2.5 bg-muted/20 p-2.5 rounded-lg border border-border/40 font-mono">
                          <span className="font-semibold text-foreground/80">输入提示/模板：</span>
                          {step.prompt_rendered}
                        </div>

                        {/* 步骤产出文本框（支持原地打磨） */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">
                              阶段产出成果（可直接编辑打磨）：
                            </span>
                            {savedSuccessStepId === step.id && (
                              <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                                <Check className="w-3 h-3" /> 已保存修改
                              </span>
                            )}
                          </div>
                          <textarea
                            value={step.edited_output || step.raw_output || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentRunDetails((prev) => {
                                if (!prev) return prev;
                                const updatedSteps = prev.steps.map((s) =>
                                  s.id === step.id ? { ...s, edited_output: val } : s
                                );
                                return { ...prev, steps: updatedSteps };
                              });
                            }}
                            onBlur={(e) => handleSaveStepOutput(step.id, e.target.value)}
                            placeholder={
                              isCurrent
                                ? '点击右上角“执行此步”按钮开启模型推演，或直接在此手动键入设定...'
                                : '等待前序步骤执行完成后解锁...'
                            }
                            rows={4}
                            disabled={!isCurrent && !isCompleted}
                            className="w-full text-xs p-3 rounded-xl bg-background/80 border border-border/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed custom-scrollbar disabled:opacity-50"
                          />

                          {/* 成果消费快捷动作栏 */}
                          {(step.edited_output || step.raw_output) && (
                            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleCopyStepOutput(step.edited_output || step.raw_output || '')}
                                className="px-2.5 py-1 rounded-lg border border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center gap-1 transition cursor-pointer"
                                title="复制本步产出成果"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制成果</span>
                              </button>

                              {activeChapter && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAppendToChapter(step.edited_output || step.raw_output || '')}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 transition cursor-pointer font-medium"
                                    title={`追加到当前章节《${activeChapter.title}》末尾`}
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>追加至本章末尾</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReplaceChapter(step.edited_output || step.raw_output || '')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 dark:text-amber-400 border border-amber-800/30 flex items-center gap-1 transition cursor-pointer font-medium"
                                    title={`采纳并覆盖为《${activeChapter.title}》正文`}
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>采纳为正文</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-3">
                  <GitCommit className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">选择或新建推演工作流</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  从左侧选择预设模板开启全新的结构化创作流水线，或载入历史推演断点继续。
                </p>
              </div>
            )}

            {/* 底部状态条 */}
            {statusMessage && (
              <div className="mt-4 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium text-center animate-fade-in">
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
