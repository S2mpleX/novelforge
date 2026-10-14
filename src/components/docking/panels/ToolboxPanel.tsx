import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ToolboxActionType } from '@/types';
import {
  Wand2,
  Sparkles,
  Zap,
  Copy,
  Check,
  FileText,
  Users,
  Compass,
  BookOpen,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { NovelistToolboxModal } from '@/components/modals/NovelistToolboxModal';

const QUICK_TOOLS: { type: ToolboxActionType; label: string; icon: any }[] = [
  { type: 'name', label: '起名灵感', icon: Wand2 },
  { type: 'intro', label: '爆款简介', icon: Sparkles },
  { type: 'premise', label: '核心脑洞', icon: Zap },
  { type: 'cheat', label: '外挂金手指', icon: Compass },
  { type: 'world_law', label: '力量境界', icon: Compass },
  { type: 'gold_opening', label: '黄金开篇', icon: BookOpen },
  { type: 'chapter_outline', label: '单章细纲', icon: FileText },
  { type: 'dialogue_polish', label: '对白精修', icon: Users },
  { type: 'humanizer_polish', label: '去AI味重塑', icon: Sparkles },
];

export const ToolboxPanel: React.FC = () => {
  const { activeNovel, activeChapter, editorContent, updateEditorContent, saveCurrentChapter } =
    useNovelStore();
  const [selectedType, setSelectedType] = useState<ToolboxActionType>('name');
  const [inputText, setInputText] = useState('');
  const [outputResult, setOutputResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-6 text-center">
        请选择或创建小说项目以使用小说专项工具箱
      </div>
    );
  }

  const handleQuickRun = async () => {
    setIsGenerating(true);
    setFeedback('正在调用模型推演...');

    try {
      const assembled = await api.assembleToolboxPrompt({
        novel_id: activeNovel.id,
        action_type: selectedType,
        chapter_id: activeChapter?.id,
        custom_input: inputText.trim() || null,
        include_prev_chapter: true,
      });

      const res = await api.executeLlmChat({
        system_prompt: assembled.system_prompt,
        user_prompt: assembled.user_prompt,
        temperature: 0.75,
        max_tokens: 1500,
      });

      setOutputResult(res);
      setFeedback('推演完成！可在下方修改并快捷应用。');
    } catch (e: any) {
      setFeedback(`生成出错: ${e.message || e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAppendToEditor = async () => {
    if (!activeChapter || !outputResult) return;
    const formatted = outputResult
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    const newContent = (editorContent || '') + formatted;
    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'TOOLBOX_APPEND');
    setFeedback('已成功追加至正文！');
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-card text-foreground text-xs overflow-hidden select-none">
      {/* 顶栏 */}
      <div className="p-2.5 border-b border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-xs">
          <Wand2 className="w-3.5 h-3.5 text-amber-500" />
          <span>小说专项工具箱</span>
        </div>
        <button
          type="button"
          onClick={() => setShowFullModal(true)}
          className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
          展开高级工作室
        </button>
      </div>

      {/* 专项快捷标签 */}
      <div className="p-2 border-b border-border/40 grid grid-cols-4 gap-1 bg-background/50">
        {QUICK_TOOLS.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => {
              setSelectedType(t.type);
              setOutputResult('');
            }}
            className={`py-1 px-1.5 rounded text-[11px] font-medium text-center truncate transition-all ${
              selectedType === t.type
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 输入与执行 */}
      <div className="p-3 space-y-2 border-b border-border/40 flex-shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`键入要求（选填，留空则由 AI 自动推演）...`}
          rows={2}
          className="w-full text-xs p-2 rounded-lg bg-background border border-border/70 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
        />

        <button
          type="button"
          onClick={handleQuickRun}
          disabled={isGenerating}
          className="w-full py-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          立即生成方案
        </button>

        {feedback && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 text-center animate-fade-in">
            {feedback}
          </div>
        )}
      </div>

      {/* 输出与原地打磨区 */}
      <div className="flex-1 p-3 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 text-[11px] text-muted-foreground font-medium">
          <span>方案产出（支持直接修改）：</span>
          {outputResult && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(outputResult);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-foreground flex items-center gap-0.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
              {activeChapter && (
                <button
                  type="button"
                  onClick={handleAppendToEditor}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-0.5"
                >
                  <FileText className="w-3 h-3" />
                  填入正文
                </button>
              )}
            </div>
          )}
        </div>

        <textarea
          value={outputResult}
          onChange={(e) => setOutputResult(e.target.value)}
          placeholder="推演产出将呈现在这里，支持直接编辑润色..."
          className="w-full flex-1 text-xs p-2.5 rounded-lg bg-background border border-border/70 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans leading-relaxed custom-scrollbar"
        />
      </div>

      {/* 完整模态框 */}
      {showFullModal && (
        <NovelistToolboxModal
          isOpen={showFullModal}
          onClose={() => setShowFullModal(false)}
          initialAction={selectedType}
        />
      )}
    </div>
  );
};
