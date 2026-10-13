import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { api } from '@/utils/tauriBridge';
import type { Character, CharacterRelationship } from '@/types';
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  GitCommit,
  Sparkles,
  Shield,
  Heart,
  Swords,
  BookOpen,
} from 'lucide-react';

interface CharacterFlowViewProps {
  novelId: string;
}

const RELATION_PRESETS = [
  { label: '生死战友', color: '#10b981', icon: Shield },
  { label: '同门师徒', color: '#6366f1', icon: BookOpen },
  { label: '宿命仇敌', color: '#ef4444', icon: Swords },
  { label: '情投意合', color: '#ec4899', icon: Heart },
  { label: '利益结盟', color: '#f59e0b', icon: Sparkles },
  { label: '主仆隶属', color: '#8b5cf6', icon: GitCommit },
];

export const CharacterFlowView: React.FC<CharacterFlowViewProps> = ({ novelId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New relationship modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('生死战友');
  const [relDesc, setRelDesc] = useState('');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadData = useCallback(async () => {
    if (!novelId) return;
    setIsLoading(true);
    try {
      const [chars, rels] = await Promise.all([
        api.listCharacters(novelId),
        api.listCharacterRelationships(novelId),
      ]);
      setCharacters(chars);
      setRelationships(rels);

      if (chars.length > 0) {
        setSourceId(chars[0].id);
        setTargetId(chars.length > 1 ? chars[1].id : chars[0].id);
      }

      // Calculate circular layout for nodes
      const radius = Math.max(220, chars.length * 45);
      const centerX = 360;
      const centerY = 280;

      const flowNodes: Node[] = chars.map((char, index) => {
        const angle = (index / (chars.length || 1)) * 2 * Math.PI;
        const x = chars.length === 1 ? centerX : centerX + radius * Math.cos(angle);
        const y = chars.length === 1 ? centerY : centerY + radius * Math.sin(angle);

        return {
          id: char.id,
          position: { x, y },
          data: {
            label: (
              <div className="px-4 py-3 bg-slate-900 border border-slate-700/80 hover:border-indigo-500/80 rounded-xl shadow-lg transition-all text-left min-w-[150px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {char.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm leading-tight">
                      {char.name}
                    </div>
                    {char.aliases && (
                      <div className="text-[11px] text-slate-400 leading-tight">
                        {char.aliases}
                      </div>
                    )}
                  </div>
                </div>
                {char.personality && (
                  <div className="text-[11px] text-slate-400 line-clamp-1 border-t border-slate-800/80 pt-1 mt-1">
                    {char.personality}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0,
          },
        };
      });

      const flowEdges: Edge[] = rels.map((rel) => {
        const preset = RELATION_PRESETS.find((p) => p.label === rel.relation_type);
        const edgeColor = preset ? preset.color : '#94a3b8';

        return {
          id: rel.id,
          source: rel.source_character_id,
          target: rel.target_character_id,
          label: rel.relation_type,
          animated: rel.relation_type === '情投意合' || rel.relation_type === '宿命仇敌',
          style: { stroke: edgeColor, strokeWidth: 2 },
          labelStyle: {
            fill: '#f8fafc',
            fontWeight: 600,
            fontSize: 11,
          },
          labelBgStyle: {
            fill: '#0f172a',
            fillOpacity: 0.85,
            stroke: edgeColor,
            strokeWidth: 1,
            rx: 6,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (e) {
      console.error('加载人物关系图失败:', e);
    } finally {
      setIsLoading(false);
    }
  }, [novelId, setNodes, setEdges]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !sourceId || !targetId) return;
    if (sourceId === targetId) {
      alert('关系源角色与目标角色不能相同');
      return;
    }

    try {
      await api.createCharacterRelationship({
        novel_id: novelId,
        source_character_id: sourceId,
        target_character_id: targetId,
        relation_type: relType,
        description: relDesc.trim() || undefined,
      });

      setShowAddModal(false);
      setRelDesc('');
      loadData();
    } catch (err) {
      alert('添加角色关系失败: ' + err);
    }
  };

  const handleDeleteSelectedEdge = async () => {
    if (!selectedEdgeId) return;
    try {
      await api.deleteCharacterRelationship(selectedEdgeId);
      setSelectedEdgeId(null);
      loadData();
    } catch (err) {
      alert('删除关系失败: ' + err);
    }
  };

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;

      try {
        await api.createCharacterRelationship({
          novel_id: novelId,
          source_character_id: params.source,
          target_character_id: params.target,
          relation_type: '利益结盟',
          description: '通过拓扑图快速连接建立',
        });
        loadData();
      } catch (err) {
        console.error('连线创建关系失败:', err);
      }
    },
    [novelId, loadData]
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-200">人物动态关系拓扑图 (React Flow)</h2>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
            {characters.length} 人物 / {relationships.length} 条关系
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedEdgeId && (
            <button
              onClick={handleDeleteSelectedEdge}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除选中连线
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            disabled={characters.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            建立关系连线
          </button>

          <button
            onClick={loadData}
            title="刷新图谱"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-[550px] relative bg-slate-950">
        {characters.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Users className="w-12 h-12 stroke-[1.2] text-slate-600" />
            <p className="text-sm">暂无角色数据，请先在“角色档案”选项卡中创建角色</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
            fitView
            className="bg-slate-950"
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 !fill-slate-300" />
            <MiniMap
              nodeColor="#6366f1"
              maskColor="rgba(15, 23, 42, 0.75)"
              className="!bg-slate-900 !border-slate-800 rounded-lg"
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend footer */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium text-slate-300">关系类型图例：</span>
          {RELATION_PRESETS.map((p) => (
            <div key={p.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500">
          提示：拖拽节点可自由排列；直接从节点连接点拉线可快速建立关联
        </div>
      </div>

      {/* Modal: Add Relationship */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-indigo-400" />
              建立新的人物关联
            </h3>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    起始角色 (Source)
                  </label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    目标角色 (Target)
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">关系类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {RELATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setRelType(p.label)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        relType === p.label
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  关系背景描述 (可选)
                </label>
                <textarea
                  value={relDesc}
                  onChange={(e) => setRelDesc(e.target.value)}
                  placeholder="例如：自小一同在青云门修炼，数次生死相托……"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                >
                  确认建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
