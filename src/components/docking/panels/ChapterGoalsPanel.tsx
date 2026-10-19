import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { Scene } from '@/types';
import {
  Target,
  Sparkles,
  RefreshCw,
  Compass,
} from 'lucide-react';

export const ChapterGoalsPanel: React.FC = () => {
  const { activeChapter } = useNovelStore();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [goalText, setGoalText] = useState('遭遇伏击，破局脱身，暴露功法秘密');
  const [isPlanning, setIsPlanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadScenes = async () => {
    if (!activeChapter) return;
    try {
      const list = await api.listScenes(activeChapter.id);
      setScenes(list);
    } catch (e) {
      console.error('加载场景节拍失败:', e);
    }
  };

  useEffect(() => {
    loadScenes();
  }, [activeChapter?.id]);

  const handlePlanScenes = async () => {
    if (!activeChapter) return;
    setIsPlanning(true);
    setMessage('场景编剧 Agent 正在拆解细纲节拍...');
    try {
      const result = await api.runScenePlanning(activeChapter.id, goalText);
      setScenes(result);
      setMessage(`编剧拆解完成！生成 ${result.length} 个场景节拍。`);
    } catch (e) {
      setMessage(`拆解失败: ${e}`);
    } finally {
      setIsPlanning(false);
    }
  };

  if (!activeChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请选择小说章节以查看本章创作目标与细纲
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">
            第 {activeChapter.chapter_number} 章目标与节拍
          </span>
        </div>
        <button
          onClick={handlePlanScenes}
          disabled={isPlanning}
          className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] disabled:opacity-40 shrink-0 whitespace-nowrap"
        >
          {isPlanning ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
              拆解中...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">AI 编剧拆解场景</span>
              <span className="sm:hidden">编剧拆解</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="px-3 py-1 bg-amber-800/10 text-primary border-b border-amber-800/20 text-[11px] font-medium">
          {message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Goal input card */}
        <div className="bg-surface border border-line rounded-lg p-3 space-y-2 shadow-xs">
          <label className="block text-[11px] font-bold text-primary">
            本章核心戏剧性目标 (Core Objective)
          </label>
          <textarea
            rows={2}
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            className="w-full bg-[#fcfaf5] border border-line rounded p-2 text-xs text-ink focus:outline-none focus:border-amber-700 font-serif"
            placeholder="设定本章主冲突、情境转折或情绪高潮..."
          />
        </div>

        {/* Scene Beats */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-ink-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            场景细纲节拍 ({scenes.length})
          </h4>

          {scenes.length === 0 ? (
            <div className="py-8 text-center text-ink-2">
              <Target className="w-6 h-6 mx-auto mb-1 opacity-30 text-primary" />
              <p>暂无场景节拍，可点击右上角【AI 编剧拆解场景】自动生成</p>
            </div>
          ) : (
            scenes.map((sc, i) => (
              <div
                key={sc.id || i}
                className="bg-surface border border-line rounded-lg p-2.5 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                    <span className="w-4 h-4 rounded-full bg-amber-800/10 text-primary flex items-center justify-center text-[10px]">
                      {sc.sequence || i + 1}
                    </span>
                    <span>场景节拍 {i + 1}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-800/10 text-primary border border-amber-800/20 font-medium">
                    {sc.status || 'PLAN'}
                  </span>
                </div>

                <div className="text-[11px] text-ink font-semibold">
                  目标：{sc.objective}
                </div>

                {sc.outline && (
                  <p className="text-[11px] text-[#4b4337] font-serif leading-relaxed whitespace-pre-wrap">
                    {sc.outline}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
