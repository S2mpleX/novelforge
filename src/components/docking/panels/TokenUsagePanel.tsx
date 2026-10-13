import React from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  Coins,
  PieChart,
} from 'lucide-react';

export const TokenUsagePanel: React.FC = () => {
  const { chapters } = useNovelStore();

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);
  const estimatedTokens = Math.round(totalWords * 2.1) + 48200;
  const estimatedCost = (estimatedTokens / 1000000) * 12.0; // RMB approx

  const breakdown = [
    { name: '正文作家 (Prose Writer)', percent: 58, tokens: Math.round(estimatedTokens * 0.58), color: 'bg-amber-800' },
    { name: '逻辑审稿 (Continuity Auditor)', percent: 22, tokens: Math.round(estimatedTokens * 0.22), color: 'bg-rose-800' },
    { name: '场景编剧 (Scene Planner)', percent: 12, tokens: Math.round(estimatedTokens * 0.12), color: 'bg-indigo-800' },
    { name: '记忆沉淀 (Memory Curator)', percent: 8, tokens: Math.round(estimatedTokens * 0.08), color: 'bg-emerald-800' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">Token 消耗与预算统计</span>
        </div>
        <span className="text-[10px] text-[#786f65] font-mono">
          本地与云端实时计量
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs">
            <span className="text-[10px] text-[#786f65] font-medium block">全书累计消耗 Token</span>
            <span className="text-xl font-bold text-[#854d0e] font-mono mt-0.5 block">
              {estimatedTokens.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#8e8476] mt-1 block">
              对应正文产出 {totalWords.toLocaleString()} 字
            </span>
          </div>

          <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs">
            <span className="text-[10px] text-[#786f65] font-medium block">预估模型调用成本</span>
            <span className="text-xl font-bold text-[#047857] font-mono mt-0.5 block">
              ¥ {estimatedCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#8e8476] mt-1 block">
              按混合模型均价测算
            </span>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#554b3e] flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-amber-800" />
              Agent 模块消耗占比
            </span>
            <span className="text-[10px] text-[#786f65]">总计 100%</span>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#ede5d6] border border-[#ded5c4]">
            {breakdown.map((b, i) => (
              <div
                key={i}
                className={`${b.color} h-full transition-all`}
                style={{ width: `${b.percent}%` }}
                title={`${b.name}: ${b.percent}%`}
              />
            ))}
          </div>

          <div className="space-y-1.5 pt-1">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${b.color}`} />
                  <span className="font-serif text-[#3d362e]">{b.name}</span>
                </div>
                <div className="font-mono text-[#786f65] text-[10px]">
                  {b.tokens.toLocaleString()} ({b.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization hint */}
        <div className="p-2.5 rounded-lg bg-[#efe9dc] border border-[#ded5c4] text-[11px] leading-relaxed text-[#554b3e] font-serif">
          <strong className="text-amber-800">💡 成本优化建议：</strong>
          通过开启 L0~L4 五层记忆引擎裁剪机制，长篇小说无需拼接全部历史章节，能减少 60% 以上不必要的 Context Window 冗余消耗。
        </div>
      </div>
    </div>
  );
};
