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
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择或创建小说项目以呼出 AI 主编控制台
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            编
          </div>
          <span className="font-semibold text-xs text-[#2c2825]">AI 主编指挥控制台</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#786f65]">
          <Cpu className="w-3 h-3 text-amber-800" />
          <span>{activeProvider?.name || '默认模型'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current Chapter Status Card */}
        <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs text-[#854d0e] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              当前指派章节：第 {activeChapter?.chapter_number || 1} 章《{activeChapter?.title || '未命名'}》
            </span>
            {feedbackScore !== null && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 font-bold text-[10px]">
                全书一致性健康度 {feedbackScore}分
              </span>
            )}
          </div>

          <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">
            本章核心冲突目标 (Chapter Goal)
          </label>
          <textarea
            rows={2}
            value={chapterGoal}
            onChange={(e) => setChapterGoal(e.target.value)}
            className="w-full bg-[#fcfaf5] border border-[#d5cbb8] rounded p-2 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700 font-serif"
            placeholder="输入主编对本章设定的核心任务与戏剧冲突..."
          />

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-[#786f65]">
              调度链：场景编剧 → 正文作家 → 逻辑审稿 → 记忆沉淀
            </span>
            <button
              onClick={handleRunCollaborativeWorkflow}
              disabled={isRunningPipeline || !activeChapter}
              className="px-3 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40"
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  多 Agent 协同推进中...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  启动多 Agent 编排流水线
                </>
              )}
            </button>
          </div>

          {pipelineMessage && (
            <div className="mt-2 p-2 rounded bg-amber-800/10 text-amber-900 border border-amber-800/20 text-[11px] font-medium">
              {pipelineMessage}
            </div>
          )}
        </div>

        {/* Editorial Directives */}
        <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#854d0e] mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            主编策略指导建议 (Editorial Directives)
          </div>
          <div className="space-y-2">
            {editorialNotes.map((note, i) => (
              <div
                key={i}
                className="p-2 rounded bg-[#f7f2e7] border border-[#ded5c4] text-[11px] leading-relaxed text-[#3d362e] font-serif"
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
