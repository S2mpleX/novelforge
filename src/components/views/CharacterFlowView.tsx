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
import { alertDialog } from '@/utils/dialog';
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
  ArrowLeftRight,
  X,
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
              <div className="px-4 py-3 bg-surface border border-line hover:border-amber-800 rounded-xl shadow-xs transition-all text-left min-w-[150px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-primary font-serif">
                    {char.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm leading-tight font-serif">
                      {char.name}
                    </div>
                    {char.aliases && (
                      <div className="text-[11px] text-ink-2 leading-tight">
                        {char.aliases}
                      </div>
                    )}
                  </div>
                </div>
                {char.personality && (
                  <div className="text-[11px] text-ink-2 line-clamp-1 border-t border-line pt-1 mt-1">
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
      await alertDialog('关系源角色与目标角色不能相同');
      return;
    }
    if (!relType.trim()) {
      await alertDialog('请输入或选择关系类型');
      return;
    }

    try {
      await api.createCharacterRelationship({
        novel_id: novelId,
        source_character_id: sourceId,
        target_character_id: targetId,
        relation_type: relType.trim(),
        description: relDesc.trim() || undefined,
      });

      setShowAddModal(false);
      setRelDesc('');
      loadData();
    } catch (err) {
      await alertDialog('添加角色关系失败: ' + err);
    }
  };

  const handleDeleteSelectedEdge = async () => {
    if (!selectedEdgeId) return;
    try {
      await api.deleteCharacterRelationship(selectedEdgeId);
      setSelectedEdgeId(null);
      loadData();
    } catch (err) {
      await alertDialog('删除关系失败: ' + err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;

      // 拖拽拉线后，自动填入源角色和目标角色，并唤起关系选择面板
      setSourceId(params.source);
      setTargetId(params.target);
      setRelType((prev) => (prev ? prev : RELATION_PRESETS[0].label));
      setRelDesc('');
      setShowAddModal(true);
    },
    []
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      // 过滤掉 'remove' 变更，防止在拓扑图中通过键盘按键误删角色节点
      const safeChanges = changes.filter((c) => c.type !== 'remove');
      onNodesChange(safeChanges);
    },
    [onNodesChange]
  );

  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        try {
          await api.deleteCharacterRelationship(edge.id);
        } catch (err) {
          console.error('删除关系失败:', err);
        }
      }
      setSelectedEdgeId(null);
      loadData();
    },
    [loadData]
  );

  return (
    <div className="flex flex-col h-full bg-surface text-ink rounded-xl overflow-hidden border border-line shadow-xs">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2/90 border-b border-line gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <h2 className="font-semibold text-ink font-serif truncate">人物关系拓扑图 (React Flow)</h2>
          <span className="text-xs bg-amber-800/10 text-primary border border-amber-800/20 px-2 py-0.5 rounded-full font-mono shrink-0 whitespace-nowrap">
            {characters.length} 人物 / {relationships.length} 关系
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          {selectedEdgeId && (
            <button
              onClick={handleDeleteSelectedEdge}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-800/10 hover:bg-rose-800/20 text-rose-800 border border-rose-800/20 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              删除连线
            </button>
          )}

          <button
            onClick={() => {
              if (characters.length >= 2) {
                if (!sourceId || !characters.some((c) => c.id === sourceId)) {
                  setSourceId(characters[0].id);
                }
                if (!targetId || !characters.some((c) => c.id === targetId) || targetId === sourceId) {
                  const other = characters.find((c) => c.id !== (sourceId || characters[0].id));
                  if (other) setTargetId(other.id);
                }
              }
              setShowAddModal(true);
            }}
            disabled={characters.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40 shadow-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">建立关系连线</span>
            <span className="sm:hidden">建立关系</span>
          </button>

          <button
            onClick={loadData}
            title="刷新图谱"
            className="p-1.5 bg-surface-3 hover:bg-surface-3-hover text-[#5c4f3d] rounded-lg transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-[550px] relative bg-surface">
        {characters.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-2 gap-3">
            <Users className="w-12 h-12 stroke-[1.2] text-ink-2" />
            <p className="text-sm">暂无角色数据，请先在“角色档案”选项卡中创建角色</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
            onPaneClick={() => setSelectedEdgeId(null)}
            fitView
            className="bg-surface"
          >
            <Background color="#ded5c4" gap={20} size={1} />
            <Controls className="!bg-surface !border-line !text-ink !fill-[#2b2621]" />
            <MiniMap
              nodeColor="#b45309"
              maskColor="rgba(244, 239, 230, 0.75)"
              className="!bg-surface !border-line rounded-lg"
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend footer */}
      <div className="px-4 py-2.5 bg-surface-2/90 border-t border-line flex flex-wrap items-center justify-between text-xs text-ink-2 gap-2">
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
          提示：拖拽节点可自由排列；直接从节点连接点拉线可立即选择建立人物关系
        </div>
      </div>

      {/* Modal: Add Relationship */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setRelDesc('');
            }
          }}
        >
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-bold text-ink flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-primary" />
                建立人物关系连线
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setRelDesc('');
                }}
                className="text-ink-2 hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 可视化方向指示条与快速翻转 */}
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-line mb-4">
              <div className="flex items-center gap-2 min-w-0 max-w-[42%]">
                <div className="w-7 h-7 rounded-full bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {characters.find((c) => c.id === sourceId)?.name?.slice(0, 1) || '源'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-ink-2">起始角色</div>
                  <div className="text-xs font-bold text-ink truncate">
                    {characters.find((c) => c.id === sourceId)?.name || '未选择'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const temp = sourceId;
                  setSourceId(targetId);
                  setTargetId(temp);
                }}
                title="交换关系方向"
                className="p-1.5 hover:bg-surface-3 rounded-lg text-ink-2 hover:text-ink border border-line transition-all shrink-0 flex items-center gap-1 text-[11px]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 min-w-0 max-w-[42%] justify-end text-right">
                <div className="min-w-0">
                  <div className="text-[10px] text-ink-2">目标角色</div>
                  <div className="text-xs font-bold text-ink truncate">
                    {characters.find((c) => c.id === targetId)?.name || '未选择'}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-800/10 border border-amber-800/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {characters.find((c) => c.id === targetId)?.name?.slice(0, 1) || '目'}
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-medium text-ink-2 mb-1">
                    起始角色 (Source)
                  </label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-hidden focus:border-amber-800"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-medium text-ink-2 mb-1">
                    目标角色 (Target)
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-hidden focus:border-amber-800"
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
                <label className="block text-xs font-serif font-medium text-ink-2 mb-1.5 flex items-center justify-between">
                  <span>关系类型</span>
                  <span className="text-[10px] text-ink-2 font-normal">点击预设或下方输入</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {RELATION_PRESETS.map((p) => {
                    const isSelected = relType === p.label;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setRelType(p.label)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-serif font-medium border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-800/10 border-amber-800 text-primary shadow-2xs font-bold'
                            : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  placeholder="关系类型名称"
                  required
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder-ink-2/50 focus:outline-hidden focus:border-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-ink-2 mb-1">
                  关系背景描述 (可选)
                </label>
                <textarea
                  value={relDesc}
                  onChange={(e) => setRelDesc(e.target.value)}
                  placeholder="例如：数次生死相托，但在某些利益分配上暗藏提防……"
                  rows={2}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-2/50 focus:outline-hidden focus:border-amber-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setRelDesc('');
                  }}
                  className="px-4 py-2 text-xs font-serif font-medium text-ink-2 hover:text-ink transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-serif font-medium rounded-lg shadow-xs transition-all"
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
