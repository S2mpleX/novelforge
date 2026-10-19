import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { HumanizerEngine } from '@/features/humanizer/HumanizerEngine';
import { InlineDiffViewer } from '@/components/common/InlineDiffViewer';
import type {
  AiProvider,
  AiModel,
  ModelArenaRun,
  ArenaStreamChunkPayload,
} from '@/types';
import {
  Swords,
  Play,
  RotateCcw,
  Trophy,
  Check,
  Copy,
  Sparkles,
  Eye,
  EyeOff,
  GitCompare,
  History,
  Trash2,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

interface ModelArenaPanelProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ModelArenaPanel: React.FC<ModelArenaPanelProps> = ({ onClose, isModal = false }) => {
  const { activeNovel, activeChapter, editorContent, updateEditorContent, saveCurrentChapter } = useNovelStore();

  // Providers & Models
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [modelsMap, setModelsMap] = useState<Record<string, AiModel[]>>({});

  // Slot A Config
  const [providerIdA, setProviderIdA] = useState<string>('');
  const [modelNameA, setModelNameA] = useState<string>('');
  const [tempA, setTempA] = useState<number>(0.75);

  // Slot B Config
  const [providerIdB, setProviderIdB] = useState<string>('');
  const [modelNameB, setModelNameB] = useState<string>('');
  const [tempB, setTempB] = useState<number>(0.75);

  // Prompt & Options
  const [prompt, setPrompt] = useState<string>('');
  const [isBlind, setIsBlind] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [revealedBlind, setRevealedBlind] = useState<boolean>(false);

  // Dual Running State
  const [isDueling, setIsDueling] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [outputA, setOutputA] = useState<string>('');
  const [outputB, setOutputB] = useState<string>('');
  const [durationA, setDurationA] = useState<number>(0);
  const [durationB, setDurationB] = useState<number>(0);
  const [isDoneA, setIsDoneA] = useState<boolean>(false);
  const [isDoneB, setIsDoneB] = useState<boolean>(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  // Timing
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Diff & Merge State
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedOutput, setMergedOutput] = useState<string>('');
  const [mergeFocus, setMergeFocus] = useState<string>('融合 A 方案的剧情冲突框架，与 B 方案细腻生动的肢体白描与人物对白');
  const [winnerSlot, setWinnerSlot] = useState<'A' | 'B' | 'TIE' | 'MERGED' | 'NONE'>('NONE');
  const [message, setMessage] = useState<string | null>(null);
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);

  // History Runs
  const [historyRuns, setHistoryRuns] = useState<ModelArenaRun[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load Providers & Models
  const loadProvidersAndModels = async () => {
    try {
      const provs = await api.listProviders();
      setProviders(provs);

      const map: Record<string, AiModel[]> = {};
      for (const p of provs) {
        try {
          const mList = await api.listModels(p.id);
          map[p.id] = mList;
        } catch {
          map[p.id] = [];
        }
      }
      setModelsMap(map);

      // Default slot assignments
      const activeProv = provs.find((p) => p.is_active) || provs[0];
      if (activeProv) {
        setProviderIdA(activeProv.id);
        const mList = map[activeProv.id] || [];
        const defM = mList.find((m) => m.is_default) || mList[0];
        if (defM) setModelNameA(defM.model_name);

        // Slot B: if another provider exists use it, otherwise use same provider with another model or same model
        const otherProv = provs.find((p) => p.id !== activeProv.id) || activeProv;
        setProviderIdB(otherProv.id);
        const otherModels = map[otherProv.id] || [];
        const otherDef = otherModels.find((m) => m.model_name !== defM?.model_name) || otherModels[0] || defM;
        if (otherDef) setModelNameB(otherDef.model_name);
      }
    } catch (e) {
      console.error('加载模型服务商失败:', e);
    }
  };

  const loadHistory = async () => {
    if (!activeNovel) return;
    try {
      const runs = await api.listModelArenaRuns(activeNovel.id);
      setHistoryRuns(runs);
    } catch (e) {
      console.error('加载历史比稿失败:', e);
    }
  };

  useEffect(() => {
    loadProvidersAndModels();
    loadHistory();
  }, [activeNovel?.id]);

  // Listen to Stream Chunks
  useEffect(() => {
    let isCancelled = false;
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const fn = await api.onArenaStreamChunk((payload: ArenaStreamChunkPayload) => {
          if (!currentSessionId || payload.session_id !== currentSessionId) return;

          if (payload.slot === 'A') {
            if (payload.chunk) {
              setOutputA((prev) => prev + payload.chunk);
            }
            if (payload.error) {
              setErrorA(payload.error);
            }
            if (payload.is_done) {
              setIsDoneA(true);
            }
          } else if (payload.slot === 'B') {
            if (payload.chunk) {
              setOutputB((prev) => prev + payload.chunk);
            }
            if (payload.error) {
              setErrorB(payload.error);
            }
            if (payload.is_done) {
              setIsDoneB(true);
            }
          }
        });

        if (isCancelled) {
          if (typeof fn === 'function') fn();
        } else {
          unlisten = fn;
        }
      } catch (err) {
        console.error('[ModelArenaPanel] Failed to attach stream listener:', err);
      }
    };

    setupListener();

    return () => {
      isCancelled = true;
      if (typeof unlisten === 'function') unlisten();
    };
  }, [currentSessionId]);

  // Timer Tick
  useEffect(() => {
    if (isDueling) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.max(0, now - startTimeRef.current);
        if (!isDoneA) setDurationA(elapsed);
        if (!isDoneB) setDurationB(elapsed);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDueling, isDoneA, isDoneB]);

  // When both slots complete
  useEffect(() => {
    if (isDueling && isDoneA && isDoneB) {
      setIsDueling(false);
      setMessage('🎉 双模推演完成！可进行文采评分对比、A/B 差异比对、投票或智能融合。');
    }
  }, [isDueling, isDoneA, isDoneB]);

  // Quick prompt injection
  const handleInjectContext = () => {
    if (!activeChapter) {
      setMessage('当前未打开章节，无法提取前文');
      return;
    }
    const currentText = editorContent || activeChapter.content || '';
    if (!currentText.trim()) {
      setMessage('当前章节正文为空');
      return;
    }
    const tail = currentText.slice(-300).trim();
    setPrompt((prev) =>
      prev ? `${prev}\n\n【接续前文背景】：\n${tail}` : `接续当前章节前文，重点描写剧情转折与人物张力：\n……${tail}\n\n请开始续写正文：`
    );
  };

  // Launch Duel
  const handleStartDuel = async () => {
    if (!activeNovel) {
      setMessage('请先选择或创建小说作品');
      return;
    }
    if (!prompt.trim()) {
      setMessage('请输入创作指令或情节描述');
      return;
    }

    const sessionId = `arena-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCurrentSessionId(sessionId);
    setOutputA('');
    setOutputB('');
    setErrorA(null);
    setErrorB(null);
    setIsDoneA(false);
    setIsDoneB(false);
    setDurationA(0);
    setDurationB(0);
    setMergedOutput('');
    setWinnerSlot('NONE');
    setRevealedBlind(false);
    setShowDiff(false);
    setIsDueling(true);
    startTimeRef.current = Date.now();
    setMessage('双模型并发推演中，请关注两侧流式比稿...');

    const systemPrompt = `你是一名专业网文作家与文学主笔。\n作品：《${activeNovel.title}》，题材：${activeNovel.genre_profile}，基调要求：${activeNovel.writing_style}。\n请直接输出沉浸式小说正文，严格遵守 Show Don't Tell 原则，严禁聊天客套话！`;

    try {
      const res = await api.executeArenaDuel({
        session_id: sessionId,
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        system_prompt: systemPrompt,
        user_prompt: prompt,
        slot_a_provider_id: providerIdA || undefined,
        slot_a_model: modelNameA || undefined,
        slot_a_temperature: tempA,
        slot_b_provider_id: providerIdB || undefined,
        slot_b_model: modelNameB || undefined,
        slot_b_temperature: tempB,
      });

      // Update full outputs if not fully caught by stream
      if (res.slot_a_output) setOutputA(res.slot_a_output);
      if (res.slot_b_output) setOutputB(res.slot_b_output);
      if (res.slot_a_duration_ms) setDurationA(res.slot_a_duration_ms);
      if (res.slot_b_duration_ms) setDurationB(res.slot_b_duration_ms);
    } catch (e: any) {
      console.error('双模对决异常:', e);
      setMessage(`对决执行遇到异常: ${e}`);
    } finally {
      setIsDoneA(true);
      setIsDoneB(true);
      setIsDueling(false);
    }
  };

  // Vote Winner
  const handleVoteWinner = async (slot: 'A' | 'B' | 'TIE') => {
    setWinnerSlot(slot);
    setRevealedBlind(true);
    if (!activeNovel) return;

    try {
      const provAName = providers.find((p) => p.id === providerIdA)?.name || '服务商 A';
      const provBName = providers.find((p) => p.id === providerIdB)?.name || '服务商 B';

      await api.saveModelArenaRun({
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        prompt,
        model_a_provider: provAName,
        model_a_name: modelNameA,
        model_a_output: outputA,
        model_a_duration_ms: durationA,
        model_a_tokens: Math.round(outputA.length * 1.3),
        model_b_provider: provBName,
        model_b_name: modelNameB,
        model_b_output: outputB,
        model_b_duration_ms: durationB,
        model_b_tokens: Math.round(outputB.length * 1.3),
        winner_slot: slot,
        is_blind: isBlind,
        merged_output: mergedOutput,
      });

      loadHistory();
      setMessage(`🏆 已投票判定【${slot === 'A' ? '选手 A' : slot === 'B' ? '选手 B' : '平局 (不分伯仲)'}】胜出，已揭晓真实模型并保存记录！`);
    } catch (e) {
      console.error('保存比稿判定失败:', e);
    }
  };

  // Merge Outputs
  const handleMergeOutputs = async () => {
    if (!activeNovel || !outputA || !outputB) return;
    setIsMerging(true);
    setMessage('融稿专家 Agent 正在将 A 方案与 B 方案深度融合提炼...');
    try {
      const merged = await api.mergeArenaOutputs({
        novel_id: activeNovel.id,
        prompt,
        output_a: outputA,
        output_b: outputB,
        merge_focus: mergeFocus,
      });
      setMergedOutput(merged);
      setWinnerSlot('MERGED');
      setRevealedBlind(true);
      setMessage('✨ 智能融合完成！已提取两篇草案精华。');
    } catch (e) {
      setMessage(`融合失败: ${e}`);
    } finally {
      setIsMerging(false);
    }
  };

  // Apply to Editor
  const handleApplyToEditor = async (text: string, mode: 'REPLACE' | 'APPEND') => {
    if (!activeChapter) {
      setMessage('请先在左侧选择小说章节');
      return;
    }
    const current = editorContent || activeChapter.content || '';
    let newContent = '';
    if (mode === 'REPLACE') {
      newContent = text.trim();
    } else {
      newContent = current.trim() ? `${current.trim()}\n\n${text.trim()}` : text.trim();
    }

    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'ARENA_APPLY');
    setMessage(`✅ 已成功${mode === 'REPLACE' ? '替换当前章节正文' : '追加到当前章节末尾'}，并留存历史快照！`);
  };

  // Copy text
  const handleCopy = (text: string, slotId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlot(slotId);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  // Humanizer Score Analysis
  const analysisA = outputA ? HumanizerEngine.auditText(outputA) : null;
  const analysisB = outputB ? HumanizerEngine.auditText(outputB) : null;

  const provAName = providers.find((p) => p.id === providerIdA)?.name || 'Provider A';
  const provBName = providers.find((p) => p.id === providerIdB)?.name || 'Provider B';

  const labelA = !isBlind || revealedBlind ? `${modelNameA || '模型 A'} (${provAName})` : '选手甲 (盲测中)';
  const labelB = !isBlind || revealedBlind ? `${modelNameB || '模型 B'} (${provBName})` : '选手乙 (盲测中)';

  return (
    <div className={`flex flex-col h-full w-full bg-canvas text-ink font-serif select-none overflow-hidden ${isModal ? 'p-1' : ''}`}>
      {/* Top Banner / Duel Setup */}
      <div className="p-3 border-b border-line bg-surface-2 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-800 text-white shadow-2xs">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-ink">多模型同台比稿竞技场</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-800/10 text-primary border border-amber-800/20 font-sans font-bold">
                  Multi-Model Arena
                </span>
                {activeNovel && (
                  <span className="text-xs text-ink-2">《{activeNovel.title}》</span>
                )}
              </div>
              <p className="text-[10px] text-ink-2 font-sans">
                双模型同台并发流式生成 · 盲测文笔对决 · Humanizer 去 AI 味评分对比 · 智能融稿
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Blind mode switch */}
            <button
              onClick={() => setIsBlind(!isBlind)}
              className={`px-2 py-1 rounded-md text-xs font-sans font-medium flex items-center gap-1.5 border transition cursor-pointer ${
                isBlind
                  ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                  : 'bg-surface text-[#6b5f52] border-line hover:bg-surface-3-hover'
              }`}
              title="开启后将遮蔽两侧模型真实名称，根据纯文学质量进行盲测投票"
            >
              {isBlind ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isBlind ? '盲测模式开启' : '实名模式'}</span>
            </button>

            {/* Toggle Config */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-2 py-1 rounded-md text-xs font-sans text-[#6b5f52] bg-surface hover:bg-surface-3-hover border border-line flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>模型参数</span>
              {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-2 py-1 rounded-md text-xs font-sans font-medium flex items-center gap-1 border transition cursor-pointer ${
                showHistory
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-surface text-[#6b5f52] border-line hover:bg-surface-3-hover'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>对决战报 ({historyRuns.length})</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-surface-3-hover cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Model Selectors */}
        {showConfig && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 rounded-lg bg-surface border border-line font-sans text-xs">
            {/* Slot A Settings */}
            <div className="space-y-1.5 p-2 rounded bg-surface-2 dark:bg-[#201c18] border border-amber-800/10 dark:border-amber-500/20">
              <div className="font-bold text-primary flex items-center justify-between">
                <span>🔴 选手 A (Slot A) 配置</span>
                <span className="text-[11px] text-ink-2">发散度: {tempA}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-ink-2 block mb-0.5">服务商</label>
                  <select
                    value={providerIdA}
                    onChange={(e) => {
                      setProviderIdA(e.target.value);
                      const mList = modelsMap[e.target.value] || [];
                      if (mList[0]) setModelNameA(mList[0].model_name);
                    }}
                    className="w-full p-1 text-xs rounded border border-line bg-surface dark:bg-[#1f1b17] text-ink dark:text-stone-200"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.is_active ? '(默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-ink-2 block mb-0.5">模型</label>
                  <select
                    value={modelNameA}
                    onChange={(e) => setModelNameA(e.target.value)}
                    className="w-full p-1 text-xs rounded border border-line bg-surface dark:bg-[#1f1b17] text-ink dark:text-stone-200 font-mono"
                  >
                    {(modelsMap[providerIdA] || []).map((m) => (
                      <option key={m.id} value={m.model_name}>
                        {m.display_name || m.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={tempA}
                onChange={(e) => setTempA(parseFloat(e.target.value))}
                className="w-full accent-amber-800"
              />
            </div>

            {/* Slot B Settings */}
            <div className="space-y-1.5 p-2 rounded bg-surface-2 dark:bg-[#201c18] border border-emerald-800/10 dark:border-emerald-500/20">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <span>🟢 选手 B (Slot B) 配置</span>
                <span className="text-[11px] text-ink-2">发散度: {tempB}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-ink-2 block mb-0.5">服务商</label>
                  <select
                    value={providerIdB}
                    onChange={(e) => {
                      setProviderIdB(e.target.value);
                      const mList = modelsMap[e.target.value] || [];
                      if (mList[0]) setModelNameB(mList[0].model_name);
                    }}
                    className="w-full p-1 text-xs rounded border border-line bg-surface dark:bg-[#1f1b17] text-ink dark:text-stone-200"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.is_active ? '(默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-ink-2 block mb-0.5">模型</label>
                  <select
                    value={modelNameB}
                    onChange={(e) => setModelNameB(e.target.value)}
                    className="w-full p-1 text-xs rounded border border-line bg-surface dark:bg-[#1f1b17] text-ink dark:text-stone-200 font-mono"
                  >
                    {(modelsMap[providerIdB] || []).map((m) => (
                      <option key={m.id} value={m.model_name}>
                        {m.display_name || m.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={tempB}
                onChange={(e) => setTempB(parseFloat(e.target.value))}
                className="w-full accent-emerald-800"
              />
            </div>
          </div>
        )}

        {/* Prompt Input Box */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="输入创作指令、情节大纲或关键冲突，让两个 AI 模型同台飙戏比稿（例如：描写反派撕下伪装的震撼反转时刻，注意动作微表情）..."
            className="w-full p-2.5 text-xs rounded-lg border border-line bg-surface dark:bg-[#1a1714] text-ink dark:text-stone-200 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none pr-32"
          />
          <div className="absolute right-2 bottom-2.5 flex items-center gap-1.5 font-sans">
            <button
              onClick={handleInjectContext}
              className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3-hover text-primary border border-line text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              title="自动提取当前编辑章节末尾前文作为背景上下文"
            >
              <FileText className="w-3 h-3" />
              <span>提取前文</span>
            </button>

            <button
              onClick={handleStartDuel}
              disabled={isDueling || !prompt.trim()}
              className="px-3.5 py-1 rounded bg-amber-800 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 active:scale-95 transition cursor-pointer"
            >
              {isDueling ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>并发推演中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>开始对决</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="px-3 py-1.5 bg-amber-800/10 text-amber-950 dark:text-amber-300 border-b border-amber-800/20 text-xs font-sans font-medium flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-primary hover:text-amber-950 dark:hover:text-amber-100">
            ✕
          </button>
        </div>
      )}

      {/* Main Dual-Column Arena Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Slot A */}
        <div className="flex-1 flex flex-col border-r border-line overflow-hidden bg-surface">
          {/* Header A */}
          <div className="p-2.5 border-b border-line bg-surface flex items-center justify-between shrink-0 font-sans gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-800 shrink-0" />
              <span className="font-bold text-xs text-amber-950 dark:text-amber-200 truncate" title={labelA}>
                {labelA}
              </span>
              {winnerSlot === 'A' && (
                <span className="px-1.5 py-0.2 rounded bg-amber-800 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-2xs shrink-0 whitespace-nowrap">
                  <Trophy className="w-2.5 h-2.5" /> 本场胜出
                </span>
              )}
            </div>

            {/* Metrics A */}
            <div className="flex items-center gap-2 text-[11px] text-ink-2 shrink-0 whitespace-nowrap">
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-primary" />
                {(durationA / 1000).toFixed(1)}s
              </span>
              <span>{outputA.length} 字</span>
              {analysisA && (
                <span
                  className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                    analysisA.score >= 80
                      ? 'bg-emerald-800/10 text-emerald-800 border border-emerald-800/20'
                      : analysisA.score >= 60
                      ? 'bg-amber-800/10 text-primary border border-amber-800/20'
                      : 'bg-rose-800/10 text-rose-800 border border-rose-800/20'
                  }`}
                  title={`人情味得分: ${analysisA.score} 分，命中 AI 套话: ${analysisA.clicheCount} 处`}
                >
                  人情味 {analysisA.score}分
                </span>
              )}
            </div>
          </div>

          {/* Content Surface A */}
          <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed font-serif text-[#231d17] dark:text-stone-200 whitespace-pre-wrap selection:bg-amber-800/20">
            {errorA ? (
              <div className="p-3 rounded bg-rose-50 text-rose-800 border border-rose-200 font-sans">
                {errorA}
              </div>
            ) : outputA ? (
              outputA
            ) : (
              <div className="h-full flex items-center justify-center text-[#9b9286] font-sans text-xs">
                {isDueling ? '正在实时接收模型 A 创作流...' : '待命状态：点击上方【开始对决】发起推演'}
              </div>
            )}
          </div>

          {/* Action Footer A */}
          <div className="p-2 border-t border-line bg-surface flex items-center justify-between shrink-0 font-sans text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleVoteWinner('A')}
                disabled={!outputA || isDueling}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition shadow-2xs disabled:opacity-30 cursor-pointer ${
                  winnerSlot === 'A'
                    ? 'bg-amber-800 text-white'
                    : 'bg-surface dark:bg-[#28231e] hover:bg-amber-800/10 text-primary dark:text-amber-300 border border-amber-800/30'
                }`}
                title="判定选手 A 胜出，并揭晓双方模型"
              >
                <Trophy className="w-3 h-3" />
                <span>判定 A 胜出</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(outputA, 'A')}
                disabled={!outputA}
                className="p-1 rounded hover:bg-surface-3-hover text-ink-2 hover:text-ink disabled:opacity-30 cursor-pointer"
                title="复制全文"
              >
                {copiedSlot === 'A' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleApplyToEditor(outputA, 'APPEND')}
                disabled={!outputA}
                className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3-hover text-primary border border-line text-[11px] font-medium disabled:opacity-30 cursor-pointer"
                title="追加到当前编辑器章节末尾"
              >
                追加文末
              </button>
              <button
                onClick={() => handleApplyToEditor(outputA, 'REPLACE')}
                disabled={!outputA}
                className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium text-[11px] shadow-2xs disabled:opacity-30 cursor-pointer"
                title="完全替换当前编辑器正文"
              >
                采纳替换
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Slot B */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {/* Header B */}
          <div className="p-2.5 border-b border-line bg-surface flex items-center justify-between shrink-0 font-sans gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-800 shrink-0" />
              <span className="font-bold text-xs text-emerald-950 dark:text-emerald-300 truncate" title={labelB}>
                {labelB}
              </span>
              {winnerSlot === 'B' && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-2xs shrink-0 whitespace-nowrap">
                  <Trophy className="w-2.5 h-2.5" /> 本场胜出
                </span>
              )}
            </div>

            {/* Metrics B */}
            <div className="flex items-center gap-2 text-[11px] text-ink-2 shrink-0 whitespace-nowrap">
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-emerald-800 dark:text-emerald-400" />
                {(durationB / 1000).toFixed(1)}s
              </span>
              <span>{outputB.length} 字</span>
              {analysisB && (
                <span
                  className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                    analysisB.score >= 80
                      ? 'bg-emerald-800/10 text-emerald-800 dark:text-emerald-300 border border-emerald-800/20'
                      : analysisB.score >= 60
                      ? 'bg-amber-800/10 text-primary border border-amber-800/20'
                      : 'bg-rose-800/10 text-rose-800 border border-rose-800/20'
                  }`}
                  title={`人情味得分: ${analysisB.score} 分，命中 AI 套话: ${analysisB.clicheCount} 处`}
                >
                  人情味 {analysisB.score}分
                </span>
              )}
            </div>
          </div>

          {/* Content Surface B */}
          <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed font-serif text-[#231d17] dark:text-stone-200 whitespace-pre-wrap selection:bg-emerald-800/20">
            {errorB ? (
              <div className="p-3 rounded bg-rose-50 text-rose-800 border border-rose-200 font-sans">
                {errorB}
              </div>
            ) : outputB ? (
              outputB
            ) : (
              <div className="h-full flex items-center justify-center text-[#9b9286] font-sans text-xs">
                {isDueling ? '正在实时接收模型 B 创作流...' : '待命状态：点击上方【开始对决】发起推演'}
              </div>
            )}
          </div>

          {/* Action Footer B */}
          <div className="p-2 border-t border-line bg-surface flex items-center justify-between shrink-0 font-sans text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleVoteWinner('B')}
                disabled={!outputB || isDueling}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition shadow-2xs disabled:opacity-30 cursor-pointer ${
                  winnerSlot === 'B'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-surface dark:bg-[#28231e] hover:bg-emerald-800/10 text-emerald-900 dark:text-emerald-300 border border-emerald-800/30'
                }`}
                title="判定选手 B 胜出，并揭晓双方模型"
              >
                <Trophy className="w-3 h-3" />
                <span>判定 B 胜出</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(outputB, 'B')}
                disabled={!outputB}
                className="p-1 rounded hover:bg-surface-3-hover text-ink-2 hover:text-ink disabled:opacity-30 cursor-pointer"
                title="复制全文"
              >
                {copiedSlot === 'B' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleApplyToEditor(outputB, 'APPEND')}
                disabled={!outputB}
                className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3-hover text-emerald-900 dark:text-emerald-300 border border-line text-[11px] font-medium disabled:opacity-30 cursor-pointer"
                title="追加到当前编辑器章节末尾"
              >
                追加文末
              </button>
              <button
                onClick={() => handleApplyToEditor(outputB, 'REPLACE')}
                disabled={!outputB}
                className="px-2.5 py-1 rounded bg-emerald-800 text-white hover:bg-emerald-700 font-medium text-[11px] shadow-2xs disabled:opacity-30 cursor-pointer"
                title="完全替换当前编辑器正文"
              >
                采纳替换
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Deck: Diff & Synthesis Bar */}
      <div className="p-2.5 border-t border-line bg-surface-2 flex flex-wrap items-center justify-between gap-2 shrink-0 font-sans text-xs">
        <div className="flex items-center gap-2">
          {/* Diff Toggle */}
          <button
            onClick={() => setShowDiff(!showDiff)}
            disabled={!outputA || !outputB}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 border transition disabled:opacity-30 cursor-pointer ${
              showDiff
                ? 'bg-amber-800 text-white border-amber-800'
                : 'bg-surface dark:bg-[#24201b] hover:bg-surface-3-hover text-ink-2 dark:text-[#ede6dc] border-line'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{showDiff ? '收起 A/B 差异对比' : '查看 A/B 红绿 Diff 对比'}</span>
          </button>

          {/* Equal button */}
          <button
            onClick={() => handleVoteWinner('TIE')}
            disabled={!outputA || !outputB || isDueling}
            className={`px-2 py-1 rounded font-medium border transition disabled:opacity-30 cursor-pointer ${
              winnerSlot === 'TIE'
                ? 'bg-purple-800 text-white border-purple-800'
                : 'bg-surface dark:bg-[#24201b] hover:bg-surface-3-hover text-ink-2 dark:text-[#ede6dc] border-line'
            }`}
          >
            不分伯仲 (平局)
          </button>
        </div>

        {/* Synthesis / Merge Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={mergeFocus}
            onChange={(e) => setMergeFocus(e.target.value)}
            placeholder="融稿偏好要求..."
            className="w-56 p-1 text-[11px] rounded border border-line bg-surface dark:bg-[#1a1714] text-ink dark:text-stone-200 font-sans hidden xl:inline-block"
          />
          <button
            onClick={handleMergeOutputs}
            disabled={!outputA || !outputB || isMerging}
            className="px-3 py-1 rounded bg-purple-900 hover:bg-purple-800 text-white font-medium flex items-center gap-1.5 shadow-2xs disabled:opacity-30 transition cursor-pointer"
          >
            {isMerging ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>智能融稿中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>智能融合两篇精华</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Diff Section (Expandable) */}
      {showDiff && outputA && outputB && (
        <div className="h-64 border-t border-line bg-surface p-3 overflow-y-auto shrink-0 flex flex-col">
          <div className="text-xs font-bold text-amber-950 dark:text-amber-200 mb-1.5 flex items-center justify-between font-sans">
            <span>A 方案 vs B 方案 词句红绿 Visual Diff</span>
            <span className="text-[10px] text-ink-2">红色划线为 A 专有词，绿色高亮为 B 专有词</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <InlineDiffViewer original={outputA} revised={outputB} />
          </div>
        </div>
      )}

      {/* Merged Synthesis Section (Expandable) */}
      {mergedOutput && (
        <div className="h-64 border-t border-line bg-surface-2 p-3 overflow-y-auto shrink-0 flex flex-col space-y-2">
          <div className="flex items-center justify-between font-sans">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 dark:text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-800 dark:text-purple-400" />
              <span>智能双模融合精华稿</span>
              <span className="text-[10px] text-ink-2 font-normal">({mergedOutput.length} 字)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(mergedOutput, 'MERGED')}
                className="p-1 rounded hover:bg-surface-3-hover text-ink-2"
                title="复制融合结果"
              >
                {copiedSlot === 'MERGED' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleApplyToEditor(mergedOutput, 'APPEND')}
                className="px-2 py-0.5 rounded bg-surface dark:bg-[#201a24] hover:bg-surface-3-hover text-purple-900 dark:text-purple-200 border border-purple-800/30 text-[11px] cursor-pointer"
              >
                追加文末
              </button>
              <button
                onClick={() => handleApplyToEditor(mergedOutput, 'REPLACE')}
                className="px-2.5 py-0.5 rounded bg-purple-900 text-white hover:bg-purple-800 text-[11px] shadow-2xs cursor-pointer"
              >
                采纳为正文
              </button>
            </div>
          </div>
          <div className="flex-1 p-2 rounded bg-surface dark:bg-[#19151e] border border-purple-800/20 dark:border-purple-800/40 text-xs font-serif leading-relaxed text-ink dark:text-stone-200 whitespace-pre-wrap overflow-y-auto">
            {mergedOutput}
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="h-56 border-t border-line bg-surface p-3 overflow-y-auto shrink-0 space-y-2 font-sans">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span>过往比稿战报记录 ({historyRuns.length})</span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[11px] text-ink-2 hover:text-ink"
            >
              收起战报
            </button>
          </div>
          {historyRuns.length === 0 ? (
            <div className="text-center py-6 text-xs text-ink-2">暂无历史比稿记录</div>
          ) : (
            <div className="space-y-1.5">
              {historyRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-2 rounded bg-surface dark:bg-[#1a1714] border border-line flex items-center justify-between text-xs hover:border-amber-800/40 transition"
                >
                  <div className="space-y-0.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-amber-950 dark:text-amber-100 truncate max-w-xs">{run.prompt}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-800/10 text-primary font-bold">
                        {run.winner_slot === 'A'
                          ? `A [${run.model_a_name}] 胜出`
                          : run.winner_slot === 'B'
                          ? `B [${run.model_b_name}] 胜出`
                          : run.winner_slot === 'MERGED'
                          ? '双模智能融合'
                          : '平局'}
                      </span>
                    </div>
                    <div className="text-[10px] text-ink-2 flex items-center gap-3">
                      <span>A: {run.model_a_name} ({(run.model_a_duration_ms / 1000).toFixed(1)}s)</span>
                      <span>B: {run.model_b_name} ({(run.model_b_duration_ms / 1000).toFixed(1)}s)</span>
                      <span>{new Date(run.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPrompt(run.prompt);
                        setOutputA(run.model_a_output);
                        setOutputB(run.model_b_output);
                        setDurationA(run.model_a_duration_ms);
                        setDurationB(run.model_b_duration_ms);
                        setWinnerSlot(run.winner_slot as any);
                        setMergedOutput(run.merged_output || '');
                        setIsBlind(run.is_blind);
                        setRevealedBlind(true);
                        setShowHistory(false);
                      }}
                      className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3-hover text-primary text-[11px]"
                    >
                      加载查看
                    </button>
                    <button
                      onClick={async () => {
                        await api.deleteModelArenaRun(run.id);
                        loadHistory();
                      }}
                      className="p-1 rounded text-ink-2 hover:text-rose-800 hover:bg-rose-50"
                      title="删除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
