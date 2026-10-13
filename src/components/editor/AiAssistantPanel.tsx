import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  Send,
  Square,
  Copy,
  PlusCircle,
  FileCheck2,
  AlertCircle,
  Bot,
  Zap,
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

  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamResult, setStreamResult] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(streamResult);
    setStatusMessage('已复制到剪贴板！');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950/80 flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">AI 创作协作者</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{activeProvider ? activeProvider.name : '未配置模型'}</span>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="p-3 border-b border-slate-800/60">
        <label className="text-[11px] font-semibold text-slate-400 block mb-2">
          快捷创作动作
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PROMPT_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setInstruction(p.instruction)}
              className="px-2 py-1.5 rounded text-xs text-left bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instruction Input */}
      <div className="p-3 flex-1 flex flex-col min-h-0">
        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
          创作指令与剧情推进
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="例如：写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋..."
          className="w-full h-24 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none mb-2"
        />

        <button
          onClick={handleStartGeneration}
          disabled={isGenerating || !activeChapter}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed mb-3"
        >
          {isGenerating ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
              生成进行中...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              启动 Agent 流式创作
            </>
          )}
        </button>

        {statusMessage && (
          <div className="mb-2 p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {/* Stream Result Box */}
        <div className="flex-1 flex flex-col min-h-0 border border-slate-800/80 rounded-lg bg-slate-900/40 p-2.5">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400">
              Agent 输出候选 ({streamResult.length} 字)
            </span>
            {streamResult && (
              <button
                onClick={handleCopy}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
                title="复制"
              >
                <Copy className="w-3 h-3" />
                复制
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text pr-1 font-serif">
            {streamResult || (
              <span className="text-slate-600 italic select-none">
                点击上方启动后，Agent 将在此处实时流式输出生成的正文草稿...
              </span>
            )}
          </div>

          {streamResult && !isGenerating && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleAppendToEditor}
                className="py-1.5 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-1 transition"
              >
                <PlusCircle className="w-3 h-3" />
                追加到文末
              </button>
              <button
                onClick={handleReplaceEditor}
                className="py-1.5 px-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-medium flex items-center justify-center gap-1 transition"
              >
                <FileCheck2 className="w-3 h-3" />
                替换正文
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
