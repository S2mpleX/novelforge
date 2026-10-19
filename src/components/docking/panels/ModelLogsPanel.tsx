import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  Activity,
  Cpu,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface MockLogEntry {
  id: string;
  time: string;
  model: string;
  operation: string;
  latencyMs: number;
  tokens: { prompt: number; completion: number; total: number };
  status: 'SUCCESS' | 'ERROR';
}

const SAMPLE_LOGS: MockLogEntry[] = [
  {
    id: 'log-1',
    time: '15:38:12',
    model: 'claude-3-7-sonnet',
    operation: '长篇正文流式生成 (Prose Writer)',
    latencyMs: 1420,
    tokens: { prompt: 2150, completion: 1840, total: 3990 },
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    time: '15:36:05',
    model: 'deepseek-chat',
    operation: '世界观因果审稿 (Continuity Auditor)',
    latencyMs: 820,
    tokens: { prompt: 3410, completion: 620, total: 4030 },
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    time: '15:32:44',
    model: 'gpt-4o-mini',
    operation: '章节事实提取沉淀 (Memory Curator)',
    latencyMs: 460,
    tokens: { prompt: 1890, completion: 310, total: 2200 },
    status: 'SUCCESS',
  },
  {
    id: 'log-4',
    time: '15:28:10',
    model: 'claude-3-7-sonnet',
    operation: '场景分段与节拍规划 (Scene Planner)',
    latencyMs: 910,
    tokens: { prompt: 1650, completion: 480, total: 2130 },
    status: 'SUCCESS',
  },
];

export const ModelLogsPanel: React.FC = () => {
  const { activeProvider } = useNovelStore();
  const [logs] = useState<MockLogEntry[]>(SAMPLE_LOGS);
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.operation.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.model.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">调用与审计日志 ({logs.length})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-2 shrink-0 whitespace-nowrap">
          <Cpu className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate max-w-[120px]">{activeProvider?.name || '本地网关'}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="p-2 border-b border-line bg-surface/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2" />
          <input
            type="text"
            placeholder="搜索调用操作或模型名称..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded pl-7 pr-2 py-1 text-xs text-ink placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-y-auto p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line text-ink-2 text-[10px] uppercase font-semibold">
              <th className="py-1.5 px-2">时间</th>
              <th className="py-1.5 px-2">操作动作</th>
              <th className="py-1.5 px-2">模型</th>
              <th className="py-1.5 px-2 text-right">延迟</th>
              <th className="py-1.5 px-2 text-right">消耗 Token</th>
              <th className="py-1.5 px-2 text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee6d8]">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-[#fcf9f2] transition font-serif">
                <td className="py-2 px-2 font-mono text-[10px] text-ink-2">{log.time}</td>
                <td className="py-2 px-2 font-medium text-ink">{log.operation}</td>
                <td className="py-2 px-2 font-mono text-[10px] text-primary">{log.model}</td>
                <td className="py-2 px-2 font-mono text-[10px] text-right text-ink-2">
                  {log.latencyMs}ms
                </td>
                <td className="py-2 px-2 font-mono text-[10px] text-right text-ink">
                  {log.tokens.total.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 font-bold inline-flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    成功
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
