import React, { useState } from 'react';
import {
  Users,
  FileCode,
  Shield,
} from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  promptFile: string;
  status: 'IDLE' | 'ACTIVE' | 'READY';
  responsibility: string;
  temperature: number;
}

const AGENTS: AgentInfo[] = [
  {
    id: 'director_commander',
    name: '创作指挥官 (Director Commander)',
    role: '自然语言一键指挥与意图自主调度',
    promptFile: 'prompts/director_commander.md',
    status: 'READY',
    responsibility: '零阻碍理解作家口语化自然语言指令，智能解析意图并一键调度正文创作输出',
    temperature: 0.75,
  },
  {
    id: 'editor_in_chief',
    name: 'AI 主编 (Editor-in-Chief)',
    role: '宏观规划与整体风控',
    promptFile: 'prompts/editor_in_chief.md',
    status: 'READY',
    responsibility: '统筹全书节奏、拆解主干剧情弧、把控核心矛盾与冲突升级',
    temperature: 0.7,
  },
  {
    id: 'scene_planner',
    name: '场景编剧 (Scene Planner)',
    role: '节拍拆解与分幕编排',
    promptFile: 'prompts/scene_planner.md',
    status: 'READY',
    responsibility: '将章节任务转化为 3~4 个结构化场景节拍，规定 POV 视角与登场道具',
    temperature: 0.6,
  },
  {
    id: 'prose_writer',
    name: '正文作家 (Prose Writer)',
    role: '文学正文长篇创作',
    promptFile: 'prompts/prose_writer.md',
    status: 'READY',
    responsibility: '挂载五层长期记忆，融入 Humanizer 叙事守则，输出高张力连载初稿',
    temperature: 0.8,
  },
  {
    id: 'continuity_auditor',
    name: '逻辑审稿 (Continuity Auditor)',
    role: '世界观因果与设定质检',
    promptFile: 'prompts/continuity_auditor.md',
    status: 'READY',
    responsibility: '对照 Canon 权威铁律与角色历史状态，输出 0~100 评分与结构化违规项',
    temperature: 0.2,
  },
  {
    id: 'style_editor',
    name: '文学编辑 (Style Editor)',
    role: '修辞润色与微表情雕琢',
    promptFile: 'prompts/style_editor.md',
    status: 'READY',
    responsibility: '精修对话呼吸感、剔除说明文腔调、提供段落并排对比与修改建议',
    temperature: 0.5,
  },
  {
    id: 'memory_curator',
    name: '记忆管理员 (Memory Curator)',
    role: '长期事实沉淀与状态流转',
    promptFile: 'prompts/memory_curator.md',
    status: 'READY',
    responsibility: '自动提炼本章事实入库 SQLite FTS5，更新角色生理伤病与心理信念',
    temperature: 0.3,
  },
];

export const AgentStatusPanel: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo>(AGENTS[0]);

  return (
    <div className="flex h-full w-full bg-surface text-ink text-xs divide-x divide-[#ded5c4] select-none">
      {/* Left: Agent List */}
      <div className="w-64 flex flex-col shrink-0 bg-surface-2">
        <div className="p-2.5 border-b border-line bg-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>创作 Agent 团队 ({AGENTS.length})</span>
          </div>
          <span className="text-[10px] text-emerald-800 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            已就绪
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-2 rounded cursor-pointer transition border ${
                  isSelected
                    ? 'bg-surface border-amber-800/40 shadow-xs'
                    : 'border-transparent hover:bg-surface-3'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-primary">{agent.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 font-medium">
                    就绪
                  </span>
                </div>
                <div className="text-[10px] text-ink-2 truncate font-serif">
                  {agent.role}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Agent Details & Prompt Specs */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface overflow-y-auto p-4 space-y-3">
        <div className="border-b border-line pb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base text-primary">{selectedAgent.name}</h3>
            <span className="px-2 py-0.5 rounded bg-amber-800/10 text-primary border border-amber-800/20 text-[10px] font-semibold">
              温度系数: {selectedAgent.temperature}
            </span>
          </div>
          <p className="text-ink-2 font-serif text-xs leading-relaxed">
            {selectedAgent.responsibility}
          </p>
        </div>

        <div className="bg-surface-2 border border-line rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
            <FileCode className="w-3.5 h-3.5 text-primary" />
            系统提示词注册路径 (Prompt Registry)
          </div>
          <code className="block bg-surface border border-line px-2.5 py-1.5 rounded font-mono text-[11px] text-primary">
            {selectedAgent.promptFile}
          </code>
        </div>

        <div className="bg-surface-2 border border-line rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
            <Shield className="w-3.5 h-3.5 text-primary" />
            职责隔离与防篡改策略
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-ink-2 font-serif leading-relaxed">
            <li>独立系统提示词与输入/输出 JSON Schema 强校验</li>
            <li>挂载 Humanizer 叙事守则，禁止空洞概括与策划术语外露</li>
            <li>生成结果默认作为候选修订，严禁无故覆盖用户手动创作正文</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
