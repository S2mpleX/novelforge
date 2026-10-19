import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  Play,
  Lightbulb,
  Cpu,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

export const EditorInChiefPanel: React.FC = () => {
  const { activeNovel, activeChapter, activeProvider } = useNovelStore();
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [chapterGoal, setChapterGoal] = useState('主角遭遇突发刺杀，被迫暴露隐藏战力，同时引出黑市秘境情报');
  const [feedbackScore, setFeedbackScore] = useState<number | null>(92);
  const [editorialNotes] = useState<string[]>([
    '节奏把控：当前处于卷首铺垫向中段冲突过渡，建议在第 3 幕拉高张力，留足章末悬念钩子。',
    '人物弧光：主角心境从“避战退让”转变为“以雷霆手段破局”，微表情描写需配合呼吸感。',
    '世界观自洽：打斗涉及的天地灵气波动需严格符合《原初灵能三大不可逆定律》。',
  ]);

  const handleRunCollaborativeWorkflow = async () => {
    if (!activeNovel || !activeChapter) return;
    setIsRunningPipeline(true);
    setPipelineMessage('主编正在调度编剧、作家与审稿 Agent...');
    try {
      const res = await api.runCollaborativeWorkflow({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        chapter_goal: chapterGoal,
        target_word_count: 2200,
      });
      setPipelineMessage(res.message || '全流程协作推进成功完成！');
      if (res.review_report) {
        setFeedbackScore(res.review_report.score);
      }
    } catch (e) {
      setPipelineMessage(`调度异常: ${e}`);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请选择或创建小说项目以呼出 AI 主编控制台
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0">
            编
          </div>
          <span className="font-semibold text-xs text-ink truncate">AI 主编指挥控制台</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-2 shrink-0 whitespace-nowrap">
          <Cpu className="w-3 h-3 text-primary shrink-0" />
          <span>{activeProvider?.name || '默认模型'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current Chapter Status Card */}
        <div className="bg-surface border border-line rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
            <span className="font-bold text-xs text-primary flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">当前指派：第 {activeChapter?.chapter_number || 1} 章《{activeChapter?.title || '未命名'}》</span>
            </span>
            {feedbackScore !== null && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 font-bold text-[10px] shrink-0 whitespace-nowrap">
                一致性 {feedbackScore}分
              </span>
            )}
          </div>

          <label className="block text-[11px] font-semibold text-ink-2 mb-1">
            本章核心冲突目标 (Chapter Goal)
          </label>
          <textarea
            rows={2}
            value={chapterGoal}
            onChange={(e) => setChapterGoal(e.target.value)}
            className="w-full bg-[#fcfaf5] border border-line rounded p-2 text-xs text-ink focus:outline-none focus:border-amber-700 font-serif"
            placeholder="输入主编对本章设定的核心任务与戏剧冲突..."
          />

          <div className="mt-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            <span className="text-[10px] text-ink-2 truncate">
              调度链：场景编剧 → 正文作家 → 逻辑审稿 → 记忆沉淀
            </span>
            <button
              onClick={handleRunCollaborativeWorkflow}
              disabled={isRunningPipeline || !activeChapter}
              className="px-3 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40 shrink-0 whitespace-nowrap"
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  多 Agent 推进中...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  启动编排流水线
                </>
              )}
            </button>
          </div>

          {pipelineMessage && (
            <div className="mt-2 p-2 rounded bg-amber-800/10 text-primary border border-amber-800/20 text-[11px] font-medium">
              {pipelineMessage}
            </div>
          )}
        </div>

        {/* Editorial Directives */}
        <div className="bg-surface border border-line rounded-lg p-3 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-xs text-primary mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            主编策略指导建议 (Editorial Directives)
          </div>
          <div className="space-y-2">
            {editorialNotes.map((note, i) => (
              <div
                key={i}
                className="p-2 rounded bg-surface border border-line text-[11px] leading-relaxed text-ink font-serif"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
