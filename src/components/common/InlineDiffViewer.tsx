import React from 'react';
import { computeTextDiff } from '@/utils/textDiff';

interface InlineDiffViewerProps {
  original: string;
  revised: string;
  className?: string;
  mode?: 'unified' | 'split';
}

/**
 * 优雅水墨风行内红绿可视化差异渲染组件
 */
export const InlineDiffViewer: React.FC<InlineDiffViewerProps> = ({
  original,
  revised,
  className = '',
  mode = 'unified',
}) => {
  const chunks = computeTextDiff(original, revised);

  if (mode === 'split') {
    return (
      <div className={`grid grid-cols-2 gap-3 text-xs leading-relaxed ${className}`}>
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-900 dark:text-rose-200">
          <div className="text-[10px] font-semibold text-rose-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <span>原文（待精修）</span>
          </div>
          <div className="whitespace-pre-wrap font-sans opacity-90">{original}</div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
          <div className="text-[10px] font-semibold text-emerald-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <span>精修重塑版</span>
          </div>
          <div className="whitespace-pre-wrap font-sans font-medium">{revised}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-xs leading-relaxed font-sans p-3 rounded-xl bg-muted/40 border border-border/60 ${className}`}>
      {chunks.map((chunk, idx) => {
        if (chunk.type === 'EQUAL') {
          return (
            <span key={idx} className="text-foreground/90">
              {chunk.text}
            </span>
          );
        }
        if (chunk.type === 'REMOVED') {
          return (
            <span
              key={idx}
              className="bg-rose-500/15 text-rose-700 dark:text-rose-400 line-through decoration-rose-500/60 mx-0.5 px-0.5 rounded-sm"
              title="剔除的原文"
            >
              {chunk.text}
            </span>
          );
        }
        if (chunk.type === 'ADDED') {
          return (
            <span
              key={idx}
              className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold mx-0.5 px-1 py-0.5 rounded-sm border-b-2 border-emerald-600/40"
              title="新增与精修内容"
            >
              {chunk.text}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};
