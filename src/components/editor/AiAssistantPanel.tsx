import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type {
  ReviewReport,
  StylePolishResponse,
  CollaborativeWorkflowResult,
} from '@/types';
import {
  Send,
  Square,
  Copy,
  PlusCircle,
  FileCheck2,
  Bot,
  Zap,
  Sparkles,
  ShieldCheck,
  Wand2,
  Layers,
  CheckCircle2,
  Check,
  RefreshCw,
} from 'lucide-react';

const PROMPT_PRESETS = [
  { label: '续写后文', instruction: '根据前文剧情因果与人物状态，顺畅续写后续桥段，保持故事冲突与情绪张力。' },
  { label: '扩写场景', instruction: '重点刻画当前场景的环境细节、光影氛围与人物动作神态，增强文学质感。' },
  { label: '对话推敲', instruction: '聚焦出场人物对白，强化人物性格声音，言语间暗藏动机与试探，避免直白扁平。' },
  { label: '高潮转折', instruction: '在此处引入意料之外又合乎情理的情节突变或危机，打破平静局势。' },
];

export const AiAssistantPanel: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
    rightPanelOpen,
    activeProvider,
    loadProviders,
  } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'STREAM_WRITE' | 'COLLABORATE' | 'CONTINUITY' | 'STYLE_POLISH'>('STREAM_WRITE');

  // --- STREAM WRITE STATE ---
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamResult, setStreamResult] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // --- COLLABORATIVE WORKFLOW STATE ---
  const [workflowGoal, setWorkflowGoal] = useState('');
  const [workflowWordCount, setWorkflowWordCount] = useState(3000);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<CollaborativeWorkflowResult | null>(null);

  // --- CONTINUITY AUDIT STATE ---
  const [isAuditing, setIsAuditing] = useState(false);
  const [reviewReport, setReviewReport] = useState<ReviewReport | null>(null);

  // --- STYLE POLISH STATE ---
  const [polishInput, setPolishInput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<StylePolishResponse | null>(null);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Load existing latest review report when chapter changes
  useEffect(() => {
    if (activeChapter) {
      api.getLatestReviewReport(activeChapter.id).then((rep) => {
        if (rep) setReviewReport(rep);
      });
    }
  }, [activeChapter?.id]);

  // Listen for streaming chunks from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    api.onStreamChunk((payload) => {
      if (activeChapter && payload.chapter_id === activeChapter.id) {
        if (payload.chunk) {
          setStreamResult((prev) => prev + payload.chunk);
        }
        if (payload.is_done) {
          setIsGenerating(false);
          if (payload.error) {
            setStatusMessage(`生成出错: ${payload.error}`);
          } else {
            setStatusMessage('生成完毕，请审阅或应用！');
          }
        }
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [activeChapter?.id]);

  if (!rightPanelOpen) return null;

  // --- HANDLERS: STREAM WRITE ---
  const handleStartGeneration = async () => {
    if (!activeNovel || !activeChapter) return;
    if (!instruction.trim()) {
      setStatusMessage('请输入创作指令或选择快捷预设');
      return;
    }

    setIsGenerating(true);
    setStreamResult('');
    setStatusMessage('正文作家 Agent 正在流式写作中...');

    try {
      await api.generateStreamChapter({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        instruction: instruction.trim(),
        current_content: editorContent,
      });
    } catch (e: any) {
      setIsGenerating(false);
      setStatusMessage(`请求失败: ${e.message || e}`);
    }
  };

  const handleAppendToEditor = async () => {
    if (!streamResult) return;
    const formattedParagraphs = streamResult
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    const newContent = (editorContent || '') + formattedParagraphs;
    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'AI_APPEND');
    setStatusMessage('已成功追加到正文末尾并保存快照！');
    setStreamResult('');
  };

  const handleReplaceEditor = async () => {
    if (!streamResult) return;
    if (!confirm('确定要用 AI 生成的内容替换当前章节正文吗？（原正文已自动保存为历史版本，可随时回退）')) {
      return;
    }

    const formattedParagraphs = streamResult
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    updateEditorContent(formattedParagraphs);
    await saveCurrentChapter(true, 'AI_REPLACE');
    setStatusMessage('已替换正文并创建新版本快照！');
    setStreamResult('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage('已复制到剪贴板！');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // --- HANDLERS: COLLABORATIVE PIPELINE ---
  const handleRunWorkflow = async () => {
    if (!activeNovel || !activeChapter) return;
    if (!workflowGoal.trim()) {
      setStatusMessage('请输入本章剧情推进目标');
      return;
    }

    setIsWorkflowRunning(true);
    setStatusMessage('多 Agent 流水线调度中：编剧拆解场景 -> 作家创作正文 -> 逻辑审稿质检...');
    setWorkflowResult(null);

    try {
      const res = await api.runCollaborativeWorkflow({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        chapter_goal: workflowGoal.trim(),
        target_word_count: workflowWordCount,
      });
      setWorkflowResult(res);
      if (res.review_report) {
        setReviewReport(res.review_report);
      }
      setStatusMessage('协作创作流水线顺利完成！');
    } catch (e: any) {
      setStatusMessage(`协作流水线执行失败: ${e.message || e}`);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleApplyWorkflowDraft = async () => {
    if (!workflowResult?.generated_draft) return;
    const formattedParagraphs = workflowResult.generated_draft
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    updateEditorContent(formattedParagraphs);
    await saveCurrentChapter(true, 'AI_COLLABORATIVE');
    setStatusMessage('已将协同定稿装载至编辑器！');
  };

  // --- HANDLERS: CONTINUITY AUDIT ---
  const handleRunAudit = async () => {
    if (!activeChapter) return;
    setIsAuditing(true);
    setStatusMessage('逻辑审稿 Agent 正在全面核查人物、世界法则与时间因果...');

    try {
      const rep = await api.runContinuityAudit(activeChapter.id);
      setReviewReport(rep);
      setStatusMessage(`审稿完成！综合健康度评分: ${rep.score} 分`);
    } catch (e: any) {
      setStatusMessage(`审稿执行失败: ${e.message || e}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleToggleFindingStatus = async (findingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    try {
      await api.updateFindingStatus(findingId, nextStatus);
      if (reviewReport) {
        setReviewReport({
          ...reviewReport,
          findings: reviewReport.findings.map((f) =>
            f.id === findingId ? { ...f, status: nextStatus as any } : f
          ),
        });
      }
    } catch (e) {
      console.error('更新问题状态失败:', e);
    }
  };

  // --- HANDLERS: STYLE POLISH ---
  const handleRunPolish = async () => {
    if (!activeNovel) return;
    const textToPolish = polishInput.trim() || editorContent?.replace(/<[^>]+>/g, '').slice(0, 1000);
    if (!textToPolish) {
      setStatusMessage('请选择或输入待润色的段落文本');
      return;
    }

    setIsPolishing(true);
    setStatusMessage('文学编辑 Agent 正在基于 Humanizer 守则打磨文笔...');
    try {
      const res = await api.runStylePolish(activeNovel.id, textToPolish);
      setPolishResult(res);
      setStatusMessage('文学润色完成！');
    } catch (e: any) {
      setStatusMessage(`文学润色失败: ${e.message || e}`);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <aside className="w-96 border-l border-[#ded5c4] bg-[#f3ede1]/95 backdrop-blur-xl flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)] shadow-sm">
      {/* Top Header & Model Info */}
      <div className="p-3.5 border-b border-[#ded5c4] flex items-center justify-between bg-[#eae2d3]/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#2b2621]">AI 创作智囊团</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fdfbf7] border border-[#d5cbb8] text-[11px] text-[#6b6255]">
          <Zap className="w-3 h-3 text-amber-700" />
          <span className="max-w-[130px] truncate font-medium" title={activeProvider?.name}>
            {activeProvider ? activeProvider.name : '未配置模型'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 p-1.5 bg-[#e4dcce] border-b border-[#ded5c4] gap-1 text-center">
        <button
          onClick={() => setActiveTab('STREAM_WRITE')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'STREAM_WRITE'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          单章写作
        </button>
        <button
          onClick={() => setActiveTab('COLLABORATE')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'COLLABORATE'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          协同编排
        </button>
        <button
          onClick={() => setActiveTab('CONTINUITY')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'CONTINUITY'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          逻辑审稿
        </button>
        <button
          onClick={() => setActiveTab('STYLE_POLISH')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'STYLE_POLISH'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          文学润色
        </button>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="px-3.5 py-2 bg-[#faecd8] border-b border-[#f0d4b2] text-[11px] text-amber-900 flex items-center gap-2 shrink-0 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: STREAM WRITE */}
      {activeTab === 'STREAM_WRITE' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden bg-[#f3ede1]/40">
          <div className="mb-2">
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1.5">
              快捷创作动作
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROMPT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInstruction(p.instruction)}
                  className="px-2 py-1.5 rounded text-xs text-left bg-[#fdfbf7] hover:bg-[#eae2d3] text-[#3d362e] hover:text-[#1a1714] border border-[#d5cbb8] transition truncate shadow-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              创作指令与剧情推进
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋..."
              className="w-full h-20 bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none mb-2"
            />

            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !activeChapter}
              className="w-full py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40 mb-2"
            >
              {isGenerating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                  正文流式生成中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  启动正文作家 Agent 写作
                </>
              )}
            </button>

            {/* Output stream display */}
            <div className="flex-1 flex flex-col min-h-0 border border-[#ded5c4] rounded-lg bg-[#fdfbf7] p-2.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#ded5c4]">
                <span className="text-[11px] font-semibold text-[#786f65]">
                  实时正文草稿 ({streamResult.length} 字)
                </span>
                {streamResult && (
                  <button
                    onClick={() => handleCopy(streamResult)}
                    className="text-[10px] text-[#786f65] hover:text-[#231f1a] flex items-center gap-0.5"
                    title="复制"
                  >
                    <Copy className="w-3 h-3" />
                    复制
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-[#2b2621] whitespace-pre-wrap leading-relaxed select-text font-serif pr-1">
                {streamResult || (
                  <span className="text-[#a89f92] italic select-none">
                    点击上方启动后，Agent 将在此处实时流式输出生成的正文草稿...
                  </span>
                )}
              </div>

              {streamResult && !isGenerating && (
                <div className="pt-2 border-t border-[#ded5c4] grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={handleAppendToEditor}
                    className="py-1.5 px-2 rounded bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-800 border border-emerald-800/25 text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <PlusCircle className="w-3 h-3" />
                    追加到文末
                  </button>
                  <button
                    onClick={handleReplaceEditor}
                    className="py-1.5 px-2 rounded bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/25 text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <FileCheck2 className="w-3 h-3" />
                    替换正文
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COLLABORATIVE PIPELINE */}
      {activeTab === 'COLLABORATE' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] text-xs text-[#2b2621] shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-900">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              多 Agent 协作工作流 (Pipeline)
            </div>
            <p className="text-[11px] text-[#786f65] leading-relaxed">
              自动化流水线调度：由章节编剧 (Scene Planner) 拆解场景节拍，再由正文作家 (Prose Writer) 撰写草稿，最后由逻辑审稿 (Continuity Auditor) 自动出具质检报告。
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              本章剧情核心推进目标 *
            </label>
            <textarea
              value={workflowGoal}
              onChange={(e) => setWorkflowGoal(e.target.value)}
              placeholder="例如：揭开先驱者号主引擎失谐之谜，林远与安雅在引力雷区产生战术分歧，最终冒险跃迁。"
              rows={3}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              期望篇幅 (字数)
            </label>
            <div className="flex items-center gap-2">
              {[2000, 3000, 4000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWorkflowWordCount(num)}
                  className={`px-2.5 py-1 rounded text-xs border transition ${
                    workflowWordCount === num
                      ? 'bg-amber-800/15 border-amber-800 text-amber-900 font-semibold shadow-xs'
                      : 'bg-[#fdfbf7] border-[#d5cbb8] text-[#6b6255] hover:text-[#2b2621]'
                  }`}
                >
                  {num} 字
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunWorkflow}
            disabled={isWorkflowRunning || !activeChapter}
            className="w-full py-2.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40"
          >
            {isWorkflowRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                多 Agent 流水线协作推进中...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                启动完整多 Agent 协同流水线
              </>
            )}
          </button>

          {/* Workflow Results Display */}
          {workflowResult && (
            <div className="space-y-3 pt-2 border-t border-[#ded5c4]">
              <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2b2621]">
                    编剧拆解的场景节拍 ({workflowResult.planned_scenes.length} 幕)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {workflowResult.planned_scenes.map((s) => (
                    <div key={s.id} className="p-2 rounded bg-[#f7f2e7] border border-[#e3d9c7] text-xs">
                      <div className="font-semibold text-amber-900">
                        场次 {s.sequence}：{s.objective}
                      </div>
                      <div className="text-[11px] text-[#6b6255] mt-0.5">{s.outline}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2b2621]">
                    生成的初稿草稿 ({workflowResult.generated_draft.length} 字)
                  </span>
                  <button
                    onClick={handleApplyWorkflowDraft}
                    className="text-xs px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-medium rounded transition flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    装载至正文
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs text-[#2b2621] font-serif leading-relaxed whitespace-pre-wrap p-2 bg-[#f7f2e7] rounded border border-[#e3d9c7]">
                  {workflowResult.generated_draft}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTINUITY AUDIT */}
      {activeTab === 'CONTINUITY' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#2b2621]">逻辑审稿与设定核查</h3>
              <p className="text-[11px] text-[#786f65]">核查人物性格、世界法则与时间线冲突</p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={isAuditing || !activeChapter}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm disabled:opacity-40"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              执行审稿
            </button>
          </div>

          {reviewReport ? (
            <div className="space-y-3">
              {/* Score Card */}
              <div className="p-3 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[11px] text-[#786f65]">本章综合合规评分</div>
                  <div className="text-2xl font-bold text-[#1f1d1a] mt-0.5">
                    {reviewReport.score} <span className="text-xs font-normal text-[#9e9383]">/ 100</span>
                  </div>
                </div>
                <div className="text-right max-w-[170px]">
                  <span className="text-[11px] text-amber-900 font-medium line-clamp-2">
                    {reviewReport.summary}
                  </span>
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#786f65]">
                  审查发现与整改建议 ({reviewReport.findings.length})
                </div>

                {reviewReport.findings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#786f65] border border-dashed border-[#ded5c4] rounded-lg bg-[#fdfbf7]">
                    未发现设定冲突或逻辑硬伤，剧情逻辑严密！
                  </div>
                ) : (
                  reviewReport.findings.map((f) => {
                    const isResolved = f.status === 'RESOLVED';
                    const severityColor =
                      f.severity === 'CRITICAL'
                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                        : f.severity === 'MAJOR'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-orange-200 bg-orange-50 text-orange-950';

                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isResolved ? 'opacity-50 border-[#ded5c4] bg-[#eae3d4]' : severityColor
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 border border-current">
                            {f.severity} · {f.category}
                          </span>
                          <button
                            onClick={() => handleToggleFindingStatus(f.id, f.status)}
                            className="text-[11px] text-[#6b6255] hover:text-[#1f1d1a] flex items-center gap-1"
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? 'text-emerald-700' : ''}`} />
                            {isResolved ? '已解决' : '标记已改'}
                          </button>
                        </div>

                        <div className="text-xs font-semibold text-[#1f1d1a]">{f.title}</div>
                        <div className="text-[11px] text-[#3d362e] mt-1 leading-relaxed">
                          {f.description}
                        </div>

                        {f.evidence_quote && (
                          <div className="mt-1.5 p-1.5 rounded bg-white/60 border border-[#e3d9c7] text-[11px] text-[#6b6255] italic">
                            “{f.evidence_quote}”
                          </div>
                        )}

                        <div className="mt-1.5 text-[11px] text-amber-900 font-medium">
                          修改建议：{f.suggestion}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#786f65] border border-dashed border-[#ded5c4] rounded-lg bg-[#fdfbf7]">
              点击“执行审稿”对当前正文进行全面逻辑因果体检
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STYLE POLISH */}
      {activeTab === 'STYLE_POLISH' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] text-xs text-[#2b2621] shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-900">
              <Wand2 className="w-3.5 h-3.5 text-amber-700" />
              Humanizer 文学精修守则
            </div>
            <p className="text-[11px] text-[#786f65] leading-relaxed">
              坚决剔除“AI 腔调”与空洞说明文套话，清退策划/引擎术语，增强微表情、对话留白与临场动作呼吸感。
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              待润色正文选段
            </label>
            <textarea
              value={polishInput}
              onChange={(e) => setPolishInput(e.target.value)}
              placeholder="粘贴或输入需要润色的段落（留空则默认截取当前正文前段）..."
              rows={4}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
            />
          </div>

          <button
            onClick={handleRunPolish}
            disabled={isPolishing}
            className="w-full py-2.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40"
          >
            {isPolishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                文学编辑 Agent 精修润色中...
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                启动文学编辑润色
              </>
            )}
          </button>

          {polishResult && (
            <div className="space-y-3 pt-2 border-t border-[#ded5c4]">
              <div className="text-[11px] text-[#786f65] italic">
                {polishResult.summary}
              </div>

              {polishResult.revisions.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                  <div className="text-[11px] text-[#8e8476] line-through">
                    原文：{rev.original_text}
                  </div>
                  <div className="text-xs text-[#1f1d1a] font-serif leading-relaxed bg-[#f7f2e7] p-2.5 rounded border border-[#e3d9c7]">
                    精修：{rev.revised_text}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-900">
                    <span>理由：{rev.rationale}</span>
                    <button
                      onClick={() => handleCopy(rev.revised_text)}
                      className="text-[#786f65] hover:text-[#1f1d1a] flex items-center gap-0.5"
                    >
                      <Copy className="w-3 h-3" />
                      复制精修
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
