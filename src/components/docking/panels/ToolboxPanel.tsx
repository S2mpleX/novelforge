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
  Clapperboard,
  FileSearch,
  HeartPulse,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

const NovelistToolboxModal = React.lazy(() => import('@/components/modals/NovelistToolboxModal').then(m => ({ default: m.NovelistToolboxModal })));
const QuickNameModal = React.lazy(() => import('@/components/modals/QuickNameModal').then(m => ({ default: m.QuickNameModal })));
const DeconstructModal = React.lazy(() => import('@/components/modals/DeconstructModal').then(m => ({ default: m.DeconstructModal })));
const FullCheckModal = React.lazy(() => import('@/components/modals/FullCheckModal').then(m => ({ default: m.FullCheckModal })));
const AssetProposalModal = React.lazy(() => import('@/components/modals/AssetProposalModal').then(m => ({ default: m.AssetProposalModal })));

const QUICK_TOOLS: { type: ToolboxActionType; label: string; icon: any }[] = [
  { type: 'name', label: '起名灵感', icon: Wand2 },
  { type: 'intro', label: '爆款简介', icon: Sparkles },
  { type: 'premise', label: '核心脑洞', icon: Zap },
  { type: 'cheat', label: '外挂金手指', icon: Compass },
  { type: 'world_law', label: '力量境界', icon: Compass },
  { type: 'gold_opening', label: '黄金开篇', icon: BookOpen },
  { type: 'chapter_outline', label: '单章细纲', icon: FileText },
  { type: 'story_architect', label: '因果架构', icon: Compass },
  { type: 'scene_dramaturge', label: '双导演方案', icon: Clapperboard },
  { type: 'ending_forge', label: '结局锻造', icon: Sparkles },
  { type: 'cold_reader', label: '读者盲审', icon: BookOpen },
  { type: 'dialogue_polish', label: '对白精修', icon: Users },
  { type: 'humanizer_polish', label: '去AI味重塑', icon: Sparkles },
];

export const ToolboxPanel: React.FC = () => {
  const { activeNovel, activeChapter, updateEditorContent, saveCurrentChapter } =
    useNovelStore(
      useShallow((s) => ({
        activeNovel: s.activeNovel,
        activeChapter: s.activeChapter,
        updateEditorContent: s.updateEditorContent,
        saveCurrentChapter: s.saveCurrentChapter,
      }))
    );
  const [selectedType, setSelectedType] = useState<ToolboxActionType>('name');
  const [inputText, setInputText] = useState('');
  const [outputResult, setOutputResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [showQuickNameModal, setShowQuickNameModal] = useState(false);
  const [showDeconstructModal, setShowDeconstructModal] = useState(false);
  const [showFullCheckModal, setShowFullCheckModal] = useState(false);
  const [showAssetProposalModal, setShowAssetProposalModal] = useState(false);
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

    const currentContent = useNovelStore.getState().editorContent || '';
    const newContent = currentContent + formatted;
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
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowQuickNameModal(true)}
            className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20 cursor-pointer"
            title="快捷起名生成器 (含本地高质词根与AI双驱动)"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            起名
          </button>
          <button
            type="button"
            onClick={() => setShowDeconstructModal(true)}
            className="flex items-center gap-1 text-[11px] text-primary dark:text-amber-300 hover:text-amber-600 font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer"
            title="拆书工坊：逆向拆解竞品与爆款范文骨架、黄金三章开局与可复用打法"
          >
            <FileSearch className="w-3 h-3 text-primary dark:text-amber-400" />
            拆书工坊
          </button>
          <button
            type="button"
            onClick={() => setShowFullCheckModal(true)}
            className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
            title="全书体检：死人诈尸、伤病闭关登场、核心角色掉线、伏笔烂尾滞后排查"
          >
            <HeartPulse className="w-3 h-3 text-emerald-600" />
            全景体检
          </button>
          <button
            type="button"
            onClick={() => setShowAssetProposalModal(true)}
            className="flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400 hover:text-purple-600 font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800 cursor-pointer"
            title="资产反哺：扫描正文野生新角色、新宗门、新功法与法宝，一键采纳落库"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            资产反哺
          </button>
          <button
            type="button"
            onClick={() => setShowFullModal(true)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            展开
          </button>
        </div>
      </div>

      {/* 专项快捷标签：窄面板 2 列自适应，避免文本强行截断 */}
      <div className="p-2 border-b border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-background/50">
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

      <React.Suspense fallback={null}>
        {/* 完整模态框 */}
        {showFullModal && (
          <NovelistToolboxModal
            isOpen={showFullModal}
            onClose={() => setShowFullModal(false)}
            initialAction={selectedType}
          />
        )}

        {/* 起名灵感生成器 */}
        {showQuickNameModal && (
          <QuickNameModal
            isOpen={showQuickNameModal}
            onClose={() => setShowQuickNameModal(false)}
          />
        )}

        {/* 拆书工坊 */}
        {showDeconstructModal && (
          <DeconstructModal
            isOpen={showDeconstructModal}
            onClose={() => setShowDeconstructModal(false)}
          />
        )}

        {/* 全身因果体检 */}
        {showFullCheckModal && (
          <FullCheckModal
            isOpen={showFullCheckModal}
            onClose={() => setShowFullCheckModal(false)}
          />
        )}

        {/* 资产反哺提案 */}
        {showAssetProposalModal && (
          <AssetProposalModal
            isOpen={showAssetProposalModal}
            onClose={() => setShowAssetProposalModal(false)}
          />
        )}
      </React.Suspense>
    </div>

  );
};
