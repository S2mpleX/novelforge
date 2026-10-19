import React, { useState, useMemo } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { alertDialog } from '@/utils/dialog';
import {
  X,
  Sparkles,
  Layers,
  Play,
  Check,
  CheckCheck,
  Sliders,
  Filter,
  Zap,
  Anchor,
  Eye,
  Wand2,
} from 'lucide-react';
import {
  BatchRevisePresetKey,
  BatchReviseScope,
  BatchReviseProposal,
} from '@/features/batchrevise/types';
import {
  BatchReviseEngine,
  BATCH_REVISE_PRESETS,
} from '@/features/batchrevise/BatchReviseEngine';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export const BatchReviseModal: React.FC<Props> = ({
  isOpen = true,
  onClose,
  embedded = false,
}) => {
  const {
    chapters,
    activeProvider,
    activeModel,
    activeNovel,
    activeChapter,
    loadChapters,
  } = useNovelStore();

  const [selectedPreset, setSelectedPreset] = useState<BatchRevisePresetKey>('DEAI_POLISH');
  const [customPrompt, setCustomPrompt] = useState('');
  const [scopeType, setScopeType] = useState<'ALL' | 'RANGE' | 'SELECTION'>('ALL');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(5, chapters.length || 1));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(chapters.slice(0, 3).map((c) => c.id)));

  const [isRunning, setIsRunning] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [proposals, setProposals] = useState<BatchReviseProposal[]>([]);
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);

  const scope: BatchReviseScope = useMemo(
    () => ({
      type: scopeType,
      rangeStart,
      rangeEnd,
      selectedChapterIds: Array.from(selectedIds),
    }),
    [scopeType, rangeStart, rangeEnd, selectedIds]
  );

  const targetChapters = useMemo(
    () => BatchReviseEngine.filterChaptersByScope(chapters, scope),
    [chapters, scope]
  );

  if (!isOpen && !embedded) return null;

  // 切换勾选
  const toggleChapterSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 运行批量修订
  const handleStartBatchRevise = async () => {
    if (targetChapters.length === 0) return;
    setIsRunning(true);
    setProposals([]);
    setActiveProposalIndex(0);

    const generatedProposals: BatchReviseProposal[] = [];

    for (let i = 0; i < targetChapters.length; i++) {
      const ch = targetChapters[i];
      setProgressText(`正在修订第 ${i + 1} / ${targetChapters.length} 章：《${ch.title}》...`);

      let revised = '';
      const promptPack = BatchReviseEngine.assemblePrompt({
        chapterTitle: ch.title,
        content: ch.content || '',
        presetKey: selectedPreset,
        customInstruction: customPrompt,
      });

      try {
        // 如果已配置模型网关且处于激活态，尝试调用大模型
        if (activeProvider && activeModel) {
          const res = await api.executeLlmChat({
            system_prompt: promptPack.systemPrompt,
            user_prompt: promptPack.userPrompt,
            temperature: 0.6,
          });
          revised = res?.trim() || '';
        }
      } catch (err) {
        console.warn(`第 ${i + 1} 章模型修订调用失败，降级为离线规则清洗:`, err);
      }

      // 若未配置模型或调用失败，自动降级为 0-Token 纯离线快速清洗
      if (!revised) {
        revised = BatchReviseEngine.offlineFastRevise(ch.content || '', selectedPreset);
      }

      const diff = BatchReviseEngine.calculateDiffMetrics(ch.content || '', revised);
      const origText = BatchReviseEngine.stripHtml(ch.content || '');

      const proposal: BatchReviseProposal = {
        id: `prop-${ch.id}-${Date.now()}`,
        chapterId: ch.id,
        chapterTitle: ch.title,
        chapterOrder: ch.chapter_number,
        originalContent: origText,
        revisedContent: revised,
        originalWordCount: origText.length,
        revisedWordCount: revised.length,
        diffSummary: diff.summary,
        addedChars: diff.addedChars,
        removedChars: diff.removedChars,
        status: 'PENDING',
      };

      generatedProposals.push(proposal);
      setProposals([...generatedProposals]);
    }

    setIsRunning(false);
    setProgressText(`批量重塑完成！共生成 ${generatedProposals.length} 份修订草案。`);
  };

  // 采纳单章
  const handleAcceptSingle = async (idx: number) => {
    const target = proposals[idx];
    if (!target || target.status === 'ACCEPTED') return;

    try {
      await BatchReviseEngine.acceptProposal(target.chapterId, target.revisedContent);
      setProposals((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, status: 'ACCEPTED', appliedAt: Date.now() } : p))
      );

      // 同步刷新全局 Store，杜绝编辑器旧正文二次覆写
      if (activeNovel) {
        await loadChapters(activeNovel.id);
        if (activeChapter && activeChapter.id === target.chapterId) {
          const fresh = await api.getChapter(activeChapter.id);
          useNovelStore.setState({
            activeChapter: fresh,
            editorContent: fresh.content || '',
            saveStatus: 'SAVED',
          });
          window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'));
        }
      }
    } catch (e) {
      await alertDialog('采纳保存失败，请检查数据库连接');
    }
  };

  // 采纳全部
  const handleAcceptAll = async () => {
    const pendingProposals = proposals.filter((p) => p.status === 'PENDING');
    if (pendingProposals.length === 0) return;

    const acceptedChapterIds: string[] = [];
    for (let i = 0; i < proposals.length; i++) {
      if (proposals[i].status === 'PENDING') {
        try {
          await BatchReviseEngine.acceptProposal(proposals[i].chapterId, proposals[i].revisedContent);
          acceptedChapterIds.push(proposals[i].chapterId);
        } catch (e) {
          console.error('批量采纳中单章失败:', e);
        }
      }
    }

    setProposals((prev) =>
      prev.map((p) => (p.status === 'PENDING' ? { ...p, status: 'ACCEPTED', appliedAt: Date.now() } : p))
    );

    // 同步刷新全局 Store
    if (activeNovel) {
      await loadChapters(activeNovel.id);
      if (activeChapter && acceptedChapterIds.includes(activeChapter.id)) {
        const fresh = await api.getChapter(activeChapter.id);
        useNovelStore.setState({
          activeChapter: fresh,
          editorContent: fresh.content || '',
          saveStatus: 'SAVED',
        });
        window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'));
      }
    }
  };

  // 拒绝单章
  const handleRejectSingle = (idx: number) => {
    setProposals((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, status: 'REJECTED' } : p))
    );
  };

  const activeProp = proposals[activeProposalIndex];

  const content = (
    <div className={`flex flex-col h-full bg-[#fcfaf7] dark:bg-[#1a1714] text-ink dark:text-[#dfdbd0] select-none ${embedded ? '' : 'rounded-2xl shadow-2xl border border-line dark:border-[#38332d] overflow-hidden'}`}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#201c18] shrink-0 gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate">
                <h3 className="font-bold text-sm tracking-wide truncate">跨章节批量重塑工作流</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary font-semibold border border-amber-800/20 shrink-0 whitespace-nowrap">
                  Batch Revise
                </span>
              </div>
              <p className="text-[11px] text-ink-2 dark:text-[#a0978d] truncate">
                多章节批量去AI味、节奏提速与悬念强化，安全生成 Diff 提案草案
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#2b2520] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Control Sidebar */}
        <div className="w-full md:w-80 border-r border-line dark:border-[#2e2a27] bg-[#f7f2e8]/80 dark:bg-[#1e1a17]/90 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Section 1: 范围选择 */}
          <div>
            <label className="text-xs font-bold flex items-center gap-1.5 mb-2 text-[#4a3b2c] dark:text-[#c4b5a2]">
              <Filter className="w-3.5 h-3.5" />
              1. 选定修改章节范围 ({targetChapters.length} 章)
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-2 dark:bg-[#27221d] rounded-lg text-xs font-medium mb-2.5">
              <button
                onClick={() => setScopeType('ALL')}
                className={`py-1 rounded text-center transition cursor-pointer ${scopeType === 'ALL' ? 'bg-[#854d0e] text-white shadow-xs font-semibold' : 'text-ink-2 hover:text-ink'}`}
              >
                全书全部
              </button>
              <button
                onClick={() => setScopeType('RANGE')}
                className={`py-1 rounded text-center transition cursor-pointer ${scopeType === 'RANGE' ? 'bg-[#854d0e] text-white shadow-xs font-semibold' : 'text-ink-2 hover:text-ink'}`}
              >
                连续范围
              </button>
              <button
                onClick={() => setScopeType('SELECTION')}
                className={`py-1 rounded text-center transition cursor-pointer ${scopeType === 'SELECTION' ? 'bg-[#854d0e] text-white shadow-xs font-semibold' : 'text-ink-2 hover:text-ink'}`}
              >
                自选手选
              </button>
            </div>

            {scopeType === 'RANGE' && (
              <div className="flex items-center gap-2 text-xs bg-white/70 dark:bg-[#1a1714] p-2 rounded-lg border border-line dark:border-[#38332d]">
                <span className="text-ink-2">第</span>
                <input
                  type="number"
                  min={1}
                  max={chapters.length}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 px-1 py-0.5 border rounded text-center bg-transparent"
                />
                <span className="text-ink-2">章 至 第</span>
                <input
                  type="number"
                  min={rangeStart}
                  max={chapters.length}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || rangeStart))}
                  className="w-12 px-1 py-0.5 border rounded text-center bg-transparent"
                />
                <span className="text-ink-2">章</span>
              </div>
            )}

            {scopeType === 'SELECTION' && (
              <div className="max-h-32 overflow-y-auto border border-line dark:border-[#38332d] rounded-lg p-1.5 bg-white/70 dark:bg-[#1a1714] flex flex-col gap-1 text-xs">
                {chapters.map((ch) => (
                  <label key={ch.id} className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-surface-3-hover/60 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ch.id)}
                      onChange={() => toggleChapterSelection(ch.id)}
                      className="rounded accent-[#854d0e]"
                    />
                    <span className="truncate flex-1">{ch.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: 预设目标 */}
          <div>
            <label className="text-xs font-bold flex items-center gap-1.5 mb-2 text-[#4a3b2c] dark:text-[#c4b5a2]">
              <Sliders className="w-3.5 h-3.5" />
              2. 选择精修目标指令
            </label>
            <div className="flex flex-col gap-1.5">
              {BATCH_REVISE_PRESETS.map((p) => (
                <div
                  key={p.key}
                  onClick={() => setSelectedPreset(p.key)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPreset === p.key
                      ? 'bg-amber-800/10 border-amber-800 text-amber-950 dark:text-amber-200 font-semibold shadow-xs'
                      : 'border-line dark:border-[#2e2a27] bg-white/50 dark:bg-[#1e1a17] hover:bg-surface-3/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      {p.key === 'DEAI_POLISH' && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                      {p.key === 'PACE_ACCELERATE' && <Zap className="w-3.5 h-3.5 text-blue-600" />}
                      {p.key === 'HOOK_ENHANCE' && <Anchor className="w-3.5 h-3.5 text-rose-600" />}
                      {p.key === 'SENSORY_DETAIL' && <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                      {p.key === 'CUSTOM' && <Wand2 className="w-3.5 h-3.5 text-purple-600" />}
                      {p.label}
                    </span>
                    {selectedPreset === p.key && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-ink-2 dark:text-[#9c9388] line-clamp-2">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>

            {selectedPreset === 'CUSTOM' && (
              <div className="mt-2.5">
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="请输入您的定制精修要求，如：将文中所有“师尊”修改为“宗主”，并精炼对白……"
                  className="w-full text-xs p-2 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714] outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-2">
            <button
              disabled={isRunning || targetChapters.length === 0}
              onClick={handleStartBatchRevise}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-800 to-orange-800 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>开始批量推演重塑 ({targetChapters.length} 章)</span>
                </>
              )}
            </button>
            {progressText && (
              <p className="text-[11px] text-primary font-medium text-center mt-2 animate-pulse">
                {progressText}
              </p>
            )}
          </div>
        </div>

        {/* Right Output Review Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#fcfaf7] dark:bg-[#1a1714] overflow-hidden">
          {proposals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9c9388]">
              <Layers className="w-12 h-12 text-[#ded5c4] dark:text-[#38332d] mb-3 stroke-[1.5]" />
              <h4 className="font-bold text-sm mb-1 text-[#4a3b2c] dark:text-[#c4b5a2]">
                等待发起批量修订任务
              </h4>
              <p className="text-xs max-w-sm">
                在左侧面板选定修改范围与目标（去AI味、提速或钩子），点击【开始批量推演重塑】。系统将逐章生成带 Diff 增删对比的草案卡片，支持作者自主审查与一键写入版本快照。
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Proposal Tabs Bar */}
              <div className="px-4 py-2 border-b border-line dark:border-[#2e2a27] bg-[#f5efe3] dark:bg-[#201c18] flex items-center justify-between shrink-0 gap-3 min-w-0">
                <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {proposals.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProposalIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition cursor-pointer whitespace-nowrap ${
                        activeProposalIndex === idx
                          ? 'bg-[#854d0e] text-white shadow-xs font-semibold'
                          : 'text-ink-2 hover:bg-surface-3-hover/60'
                      }`}
                    >
                      <span>{p.chapterTitle}</span>
                      {p.status === 'ACCEPTED' && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      {p.status === 'REJECTED' && <X className="w-3 h-3 text-rose-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2 whitespace-nowrap">
                  <button
                    onClick={handleAcceptAll}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>一键采纳全部草案</span>
                  </button>
                </div>
              </div>

              {/* Proposal Detail Card */}
              {activeProp && (
                <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f4ece0] dark:bg-[#231e1a] border border-line dark:border-[#38332d] shrink-0 gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-800/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        #{activeProp.chapterOrder}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs truncate">{activeProp.chapterTitle}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-ink-2 truncate">
                          <span>{activeProp.diffSummary}</span>
                          <span>• 原文 {activeProp.originalWordCount} 字 ➔ 重塑后 {activeProp.revisedWordCount} 字</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                      {activeProp.status === 'ACCEPTED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-800/15 text-emerald-800 border border-emerald-800/30 font-bold text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> 已采纳并提交版本快照
                        </span>
                      ) : activeProp.status === 'REJECTED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-800/15 text-rose-800 border border-rose-800/30 font-bold text-xs flex items-center gap-1">
                          <X className="w-3 h-3" /> 已拒绝放弃
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRejectSingle(activeProposalIndex)}
                            className="px-2.5 py-1 rounded-lg border border-line hover:bg-rose-50 text-rose-700 text-xs transition cursor-pointer"
                          >
                            放弃草案
                          </button>
                          <button
                            onClick={() => handleAcceptSingle(activeProposalIndex)}
                            className="px-3 py-1 rounded-lg bg-[#854d0e] hover:bg-[#6d3e0b] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> 采纳并写入正文
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Diff View */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
                    <div className="flex flex-col border border-line dark:border-[#2e2a27] rounded-xl overflow-hidden bg-white/70 dark:bg-[#1a1714]">
                      <div className="px-3 py-1.5 bg-surface-2 dark:bg-[#27221d] text-xs font-bold text-ink-2 dark:text-[#a0978d] border-b border-line dark:border-[#2e2a27]">
                        原文版本（修改前）
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto text-xs font-serif leading-relaxed text-[#554d42] dark:text-[#b3aba0] whitespace-pre-wrap select-text">
                        {activeProp.originalContent}
                      </div>
                    </div>

                    <div className="flex flex-col border border-amber-800/30 rounded-xl overflow-hidden bg-amber-50/20 dark:bg-[#201c18]">
                      <div className="px-3 py-1.5 bg-amber-800/10 text-xs font-bold text-primary dark:text-amber-200 border-b border-amber-800/20 flex items-center justify-between">
                        <span>重塑草案（修改后）</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          +{activeProp.addedChars} / -{activeProp.removedChars}
                        </span>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto text-xs font-serif leading-relaxed text-ink dark:text-[#dfdbd0] whitespace-pre-wrap select-text">
                        {activeProp.revisedContent}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[85vh]">{content}</div>
    </div>
  );
};
