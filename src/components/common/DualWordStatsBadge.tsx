import React, { useState, useMemo } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/utils/tauriBridge';
import { DualWordStatsEngine } from '@/features/stats/DualWordStatsEngine';
import { Feather, Sparkles, Activity, X } from 'lucide-react';

export interface DualWordStatsBadgeProps {
  className?: string;
  modal?: boolean;
}

export const DualWordStatsBadge: React.FC<DualWordStatsBadgeProps> = ({ className, modal = true }) => {
  const { activeNovel, chapters, activeChapter, versions } = useNovelStore(
    useShallow((s) => ({
      activeNovel: s.activeNovel,
      chapters: s.chapters,
      activeChapter: s.activeChapter,
      versions: s.versions,
    }))
  );
  const [showDetail, setShowDetail] = useState(false);
  const [extraVersionsMap, setExtraVersionsMap] = useState<Record<string, any[]>>({});

  const combinedVersionsMap = useMemo(() => {
    const map: Record<string, any[]> = { ...extraVersionsMap };
    if (activeChapter?.id && versions && versions.length > 0) {
      map[activeChapter.id] = versions;
    }
    return map;
  }, [activeChapter?.id, versions, extraVersionsMap]);

  const stats = useMemo(() => {
    if (!activeNovel) return null;
    return DualWordStatsEngine.calculateNovelDualStats(activeNovel.id, chapters, combinedVersionsMap);
  }, [activeNovel, chapters, combinedVersionsMap]);

  const handleToggleDetail = async () => {
    const nextState = !showDetail;
    setShowDetail(nextState);
    if (nextState && chapters.length > 0) {
      try {
        const promises = chapters.slice(0, 10).map(async (ch) => {
          if (extraVersionsMap[ch.id]) return null;
          const vList = await api.listChapterVersions(ch.id);
          return { chapterId: ch.id, versions: vList };
        });
        const results = await Promise.all(promises);
        const newMap: Record<string, any[]> = {};
        results.forEach((r) => {
          if (r && r.versions) {
            newMap[r.chapterId] = r.versions;
          }
        });
        if (Object.keys(newMap).length > 0) {
          setExtraVersionsMap((prev) => ({ ...prev, ...newMap }));
        }
      } catch (err) {
        console.warn('获取双流章节版本历史失败:', err);
      }
    }
  };

  if (!stats) return null;

  if (stats.totalWordCount === 0) {
    return (
      <div className={`relative inline-block text-xs select-none whitespace-nowrap shrink-0 ${className || ''}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/60 dark:bg-[#25201b] border border-line/70 dark:border-[#38332d] whitespace-nowrap shrink-0">
          <Feather className="w-3.5 h-3.5 text-primary/70 dark:text-amber-500/70 shrink-0" />
          <span className="font-medium text-[11px] text-ink-2 dark:text-[#9e9486] whitespace-nowrap">
            手打 100% · 待开篇
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-xs select-none whitespace-nowrap shrink-0 ${className || ''}`}>
      {/* Mini Badge Trigger */}
      <div
        onClick={handleToggleDetail}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-3/70 dark:bg-[#25201b] border border-line dark:border-[#38332d] hover:border-[#854d0e] transition cursor-pointer whitespace-nowrap shrink-0"
        title="点击查看 手写纯原创 vs AI协同 字数双轨大盘"
      >
        <Feather className="w-3.5 h-3.5 text-primary dark:text-amber-500 shrink-0" />
        <span className="font-semibold text-[11px] text-[#4a3b2c] dark:text-[#c4b5a2] whitespace-nowrap">
          手打 {stats.manualRatio}%
        </span>

        {/* Dual Progress Pill */}
        <div className="w-14 h-2 rounded-full bg-[#d5cbb8] dark:bg-[#38332d] overflow-hidden flex shadow-inner shrink-0">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-700 transition-all duration-300"
            style={{ width: `${stats.manualRatio}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${stats.aiRatio}%` }}
          />
        </div>

        <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
      </div>

      {/* Detail View (Modal or Popover) */}
      {showDetail && (
        modal ? (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-text"
            onClick={() => setShowDetail(false)}
          >
            <div
              className="w-full max-w-sm p-5 rounded-2xl bg-[#fcfaf7] dark:bg-[#1f1b17] border border-line dark:border-[#38332d] shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 border-b border-line dark:border-[#38332d] pb-2.5">
                <span className="font-bold text-sm text-ink dark:text-[#dfdbd0] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary shrink-0" />
                  字数双轨归因与心流看板
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 font-semibold">
                    {stats.purityLabel.split(' · ')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDetail(false)}
                    className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3 transition cursor-pointer"
                    title="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-ink-2 dark:text-[#a0978d] mb-4 leading-relaxed">
                {stats.purityDescription}
              </p>

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-primary dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <Feather className="w-3.5 h-3.5 shrink-0" /> 纯手打字数
                    </span>
                    <span className="font-bold font-mono text-ink dark:text-[#f3eee7]">
                      {stats.manualWordCount.toLocaleString()} 字 ({stats.manualRatio}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-3 dark:bg-[#2e2a27] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-700 transition-all duration-300"
                      style={{ width: `${stats.manualRatio}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" /> AI 辅助 / 润色
                    </span>
                    <span className="font-bold font-mono text-ink dark:text-[#f3eee7]">
                      {stats.aiWordCount.toLocaleString()} 字 ({stats.aiRatio}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-3 dark:bg-[#2e2a27] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${stats.aiRatio}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-line dark:border-[#2e2a27] flex items-center justify-between text-xs text-ink-2 dark:text-[#9e9486]">
                <span>全书累计：<strong className="font-mono text-ink dark:text-[#f3eee7]">{stats.totalWordCount.toLocaleString()}</strong> 字</span>
                <span className="text-primary dark:text-amber-400 font-medium text-[11px]">签约申报合规凭证</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDetail(false)} />
            <div className="absolute right-0 top-full mt-2 w-72 z-50 p-3.5 rounded-xl bg-[#fcfaf7] dark:bg-[#1f1b17] border border-line dark:border-[#38332d] shadow-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-ink dark:text-[#dfdbd0] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  字数双轨归因与心流看板
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800/10 text-primary font-semibold">
                  {stats.purityLabel.split(' · ')[0]}
                </span>
              </div>

              <p className="text-[11px] text-ink-2 dark:text-[#a0978d] mb-3 leading-relaxed">
                {stats.purityDescription}
              </p>

              {/* Metrics */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-primary dark:text-amber-400 font-medium flex items-center gap-1">
                      <Feather className="w-3 h-3" /> 纯手打字数
                    </span>
                    <span className="font-bold">{stats.manualWordCount.toLocaleString()} 字 ({stats.manualRatio}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-3 dark:bg-[#2e2a27] overflow-hidden">
                    <div className="h-full bg-amber-700" style={{ width: `${stats.manualRatio}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI 辅助 / 润色
                    </span>
                    <span className="font-bold">{stats.aiWordCount.toLocaleString()} 字 ({stats.aiRatio}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-3 dark:bg-[#2e2a27] overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${stats.aiRatio}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-line dark:border-[#2e2a27] flex items-center justify-between text-[10px] text-ink-2">
                <span>全书累计：{stats.totalWordCount.toLocaleString()} 字</span>
                <span>签约申报合规凭证</span>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};
