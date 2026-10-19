import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { Character } from '@/types';
import {
  Users,
  Plus,
  GitCommit,
  UserCheck,
  Edit3,
  Trash2,
} from 'lucide-react';
import { CharacterFlowView } from './CharacterFlowView';

export const CharactersView: React.FC = () => {
  const { activeNovel } = useNovelStore();

  const [subTab, setSubTab] = useState<'LIST' | 'RELATIONSHIPS'>('LIST');
  const [characters, setCharacters] = useState<Character[]>([]);

  // Character form state
  const [showAddChar, setShowAddChar] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [charAliases, setCharAliases] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charMotivation, setCharMotivation] = useState('');
  const [charBackground, setCharBackground] = useState('');

  const loadCharacters = async () => {
    if (!activeNovel) return;
    try {
      const chars = await api.listCharacters(activeNovel.id);
      setCharacters(chars);
    } catch (e) {
      console.error('加载人物档案失败:', e);
    }
  };

  useEffect(() => {
    loadCharacters();
    const handleReload = () => loadCharacters();
    window.addEventListener('novelforge:reload-story-bible', handleReload);
    return () => window.removeEventListener('novelforge:reload-story-bible', handleReload);
  }, [activeNovel?.id]);

  const handleStartAdd = () => {
    setEditingCharId(null);
    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setShowAddChar(true);
  };

  const handleStartEdit = (c: Character) => {
    setEditingCharId(c.id);
    setCharName(c.name);
    setCharAliases(c.aliases || '');
    setCharPersonality(c.personality || '');
    setCharMotivation(c.motivation || '');
    setCharBackground(c.background || '');
    setShowAddChar(true);
  };

  const handleDeleteChar = async (c: Character) => {
    const ok = await confirmDialog({
      title: '删除角色档案',
      message: `确定要删除角色“${c.name}”吗？此操作将同步清理该角色的关系拓扑、状态历史与成长弧。`,
      confirmText: '彻底删除',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteCharacter(c.id);
      await loadCharacters();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('删除角色失败:', e);
    }
  };

  const handleSaveChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !charName.trim()) return;

    if (editingCharId) {
      await api.updateCharacter({
        id: editingCharId,
        name: charName.trim(),
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
      });
    } else {
      await api.createCharacter({
        novel_id: activeNovel.id,
        name: charName.trim(),
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
      });
    }

    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setEditingCharId(null);
    setShowAddChar(false);
    loadCharacters();
    window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
  };

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-2">
        请选择或创建小说项目以管理人物档案
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-canvas select-none overflow-hidden h-full">
      {/* Top Characters Sub-Navigation */}
      <div className="h-12 border-b border-line px-4 sm:px-6 flex items-center justify-between bg-surface-2/95 shrink-0 shadow-xs gap-3 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none min-w-0 py-1">
          <button
            onClick={() => setSubTab('LIST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap ${
              subTab === 'LIST'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            角色档案 ({characters.length})
          </button>
          <button
            onClick={() => setSubTab('RELATIONSHIPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap ${
              subTab === 'RELATIONSHIPS'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 shrink-0" />
            人物动态关系拓扑图
          </button>
        </div>

        <div className="shrink-0 whitespace-nowrap">
          {subTab === 'LIST' && (
            <button
              onClick={handleStartAdd}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              新建人物档案
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {subTab === 'RELATIONSHIPS' ? (
        <div className="flex-1 p-4 overflow-hidden">
          <CharacterFlowView novelId={activeNovel.id} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {characters.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-line rounded-xl bg-surface">
                <Users className="w-10 h-10 text-ink-2 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-ink font-serif mb-1">暂无角色档案</h4>
                <p className="text-xs text-ink-2 mb-4 max-w-md mx-auto">
                  创建人物后，正文作家与逻辑审稿 Agent 将在生成章节时自动遵守人物性格、核心动机与生平背景约束！
                </p>
                <button
                  onClick={handleStartAdd}
                  className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium transition shadow-sm"
                >
                  创建首位角色
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-surface border border-line hover:border-amber-800/40 shadow-xs space-y-2.5 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-line">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-800/10 text-primary flex items-center justify-center font-bold text-xs font-serif">
                          {c.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-ink text-sm font-serif">{c.name}</span>
                          {c.aliases && (
                            <span className="text-[11px] text-ink-2 ml-1.5">({c.aliases})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary border border-amber-800/20 font-medium flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" />
                          已激活
                        </span>
                        <button
                          onClick={() => handleStartEdit(c)}
                          className="p-1 text-ink-2 hover:text-primary transition rounded hover:bg-surface-3 cursor-pointer"
                          title="编辑人物档案"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChar(c)}
                          className="p-1 text-ink-2 hover:text-red-700 transition rounded hover:bg-surface-3 cursor-pointer"
                          title="删除人物档案"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {c.personality && (
                      <div className="text-xs text-ink flex items-baseline">
                        <span className="text-ink-2 w-16 shrink-0 font-medium">性格特质：</span>
                        <span>{c.personality}</span>
                      </div>
                    )}
                    {c.motivation && (
                      <div className="text-xs text-ink flex items-baseline">
                        <span className="text-ink-2 w-16 shrink-0 font-medium">核心动机：</span>
                        <span>{c.motivation}</span>
                      </div>
                    )}
                    {c.background && (
                      <div className="text-xs text-ink-2 leading-relaxed flex items-baseline">
                        <span className="text-ink-2 w-16 shrink-0 font-medium">生平背景：</span>
                        <span className="line-clamp-3">{c.background}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD CHARACTER */}
      {showAddChar && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-line rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-ink font-serif">
              {editingCharId ? '编辑人物档案' : '新建人物档案'}
            </h3>
            <form onSubmit={handleSaveChar} className="space-y-3">
              <div>
                <label className="text-xs text-ink-2 block mb-1">姓名 *</label>
                <input
                  required
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="如：叶修、顾清怀、陈平安..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">称号 / 别名</label>
                <input
                  value={charAliases}
                  onChange={(e) => setCharAliases(e.target.value)}
                  placeholder="如：深空巡游者、一叶之秋..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">性格特质</label>
                <input
                  value={charPersonality}
                  onChange={(e) => setCharPersonality(e.target.value)}
                  placeholder="如：沉稳果决、玩世不恭、外冷内热..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">核心动机 / 目标</label>
                <input
                  value={charMotivation}
                  onChange={(e) => setCharMotivation(e.target.value)}
                  placeholder="如：重返荣耀巅峰、为宗门复仇..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">背景身世</label>
                <textarea
                  rows={3}
                  value={charBackground}
                  onChange={(e) => setCharBackground(e.target.value)}
                  placeholder="生平过往、家族背景与隐藏秘密..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink resize-none focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChar(false)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs text-ink-2 hover:bg-surface-3"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium"
                >
                  保存人物
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
