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
              <div className="px-4 py-3 bg-[#fdfbf7] border border-[#d5cbb8] hover:border-amber-800 rounded-xl shadow-xs transition-all text-left min-w-[150px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-amber-900 font-serif">
                    {char.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1f1d1a] text-sm leading-tight font-serif">
                      {char.name}
                    </div>
                    {char.aliases && (
                      <div className="text-[11px] text-[#786f65] leading-tight">
                        {char.aliases}
                      </div>
                    )}
                  </div>
                </div>
                {char.personality && (
                  <div className="text-[11px] text-[#786f65] line-clamp-1 border-t border-[#ded5c4] pt-1 mt-1">
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
        const edgeColor = preset ? preset.color : '#8c7e6d';

        return {
          id: rel.id,
          source: rel.source_character_id,
          target: rel.target_character_id,
          label: rel.relation_type,
          animated: rel.relation_type === '情投意合' || rel.relation_type === '宿命仇敌',
          style: { stroke: edgeColor, strokeWidth: 2 },
          labelStyle: {
            fill: '#1f1d1a',
            fontWeight: 600,
            fontSize: 11,
          },
          labelBgStyle: {
            fill: '#fdfbf7',
            fillOpacity: 0.95,
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
    <div className="flex flex-col h-full bg-[#fdfbf7] text-[#2b2621] rounded-xl overflow-hidden border border-[#ded5c4] shadow-xs">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#efe9dc]/90 border-b border-[#ded5c4]">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-800" />
          <h2 className="font-semibold text-[#1f1d1a] font-serif">人物动态关系拓扑图 (React Flow)</h2>
          <span className="text-xs bg-amber-800/10 text-amber-900 border border-amber-800/20 px-2 py-0.5 rounded-full font-mono">
            {characters.length} 人物 / {relationships.length} 条关系
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedEdgeId && (
            <button
              onClick={handleDeleteSelectedEdge}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-800/10 hover:bg-rose-800/20 text-rose-800 border border-rose-800/20 rounded-lg text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除选中连线
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            disabled={characters.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            建立关系连线
          </button>

          <button
            onClick={loadData}
            title="刷新图谱"
            className="p-1.5 bg-[#e4dcce] hover:bg-[#ded4c3] text-[#5c4f3d] rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-[550px] relative bg-[#f7f2e7]">
        {characters.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#786f65] gap-3">
            <Users className="w-12 h-12 stroke-[1.2] text-[#9e9383]" />
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
            className="bg-[#f7f2e7]"
          >
            <Background color="#ded5c4" gap={20} size={1} />
            <Controls className="!bg-[#fdfbf7] !border-[#ded5c4] !text-[#2b2621] !fill-[#2b2621]" />
            <MiniMap
              nodeColor="#b45309"
              maskColor="rgba(244, 239, 230, 0.75)"
              className="!bg-[#fdfbf7] !border-[#ded5c4] rounded-lg"
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend footer */}
      <div className="px-4 py-2.5 bg-[#efe9dc]/90 border-t border-[#ded5c4] flex flex-wrap items-center justify-between text-xs text-[#786f65] gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-serif font-bold text-[#2b2621] mb-4 flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-[#854d0e]" />
              建立新的人物关联
            </h3>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                    起始角色 (Source)
                  </label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] focus:outline-hidden focus:border-[#854d0e]"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                    目标角色 (Target)
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] focus:outline-hidden focus:border-[#854d0e]"
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
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">关系类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {RELATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setRelType(p.label)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-serif font-medium border text-center transition-all ${
                        relType === p.label
                          ? 'bg-[#efe9dc] border-[#854d0e] text-[#854d0e] shadow-2xs font-bold'
                          : 'bg-[#f7f2e7] border-[#ded5c4] text-[#685f54] hover:bg-[#efe9dc]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  关系背景描述 (可选)
                </label>
                <textarea
                  value={relDesc}
                  onChange={(e) => setRelDesc(e.target.value)}
                  placeholder="例如：自小一同在宗门修炼，数次生死相托……"
                  rows={2}
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ded5c4]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-serif font-medium text-[#685f54] hover:text-[#2b2621] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium rounded-lg shadow-xs transition-all"
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
