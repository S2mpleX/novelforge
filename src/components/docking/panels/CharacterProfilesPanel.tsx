import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { Character } from '@/types';
import {
  Users,
  Plus,
  Search,
  X,
} from 'lucide-react';

interface Props {
  params?: Record<string, any>;
}

export const CharacterProfilesPanel: React.FC<Props> = ({ params }) => {
  const { activeNovel } = useNovelStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Form state
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
      if (params?.characterId) {
        const found = chars.find((c) => c.id === params.characterId);
        if (found) setSelectedCharacter(found);
      }
    } catch (e) {
      console.error('加载人物档案失败:', e);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, [activeNovel?.id, params?.characterId]);

  const handleAddChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !charName.trim()) return;

    await api.createCharacter({
      novel_id: activeNovel.id,
      name: charName.trim(),
      aliases: charAliases.trim() || undefined,
      personality: charPersonality.trim(),
      motivation: charMotivation.trim(),
      background: charBackground.trim(),
    });

    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setShowAddModal(false);
    loadCharacters();
  };

  const filtered = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aliases?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65]">
        请选择或创建小说项目以管理人物档案
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">角色档案 ({characters.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Plus className="w-3 h-3" />
          新建角色
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#fdfbf7]/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8e8476]" />
          <input
            type="text"
            placeholder="搜索姓名、别名或性格特征..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded pl-7 pr-2 py-1 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* Character Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#786f65]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-800" />
            <p>暂无角色档案，点击右上角【新建角色】录入</p>
          </div>
        ) : (
          filtered.map((char) => (
            <div
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className={`bg-[#fdfbf7] border rounded-lg p-3 transition shadow-xs flex flex-col justify-between cursor-pointer ${
                selectedCharacter?.id === char.id ? 'border-amber-800 ring-1 ring-amber-800/40' : 'border-[#dcd3c1] hover:border-amber-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#854d0e]">{char.name}</span>
                    {char.aliases && (
                      <span className="text-[10px] text-[#786f65] font-serif">（{char.aliases}）</span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-800/10 text-amber-800 border border-amber-800/20 font-medium">
                    核心角色
                  </span>
                </div>

                {char.personality && (
                  <p className="text-[11px] text-[#554b3e] line-clamp-2 mb-1.5 font-serif">
                    <strong>性格：</strong>{char.personality}
                  </p>
                )}

                {char.motivation && (
                  <p className="text-[11px] text-[#6b583f] line-clamp-2 mb-1.5 font-serif">
                    <strong>动机：</strong>{char.motivation}
                  </p>
                )}
              </div>

              {char.background && (
                <div className="mt-2 pt-2 border-t border-[#eee6d8] text-[10px] text-[#8e8476] line-clamp-2">
                  {char.background}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Character */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] border border-[#d5cbb8] rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded5c4] mb-3">
              <span className="font-bold text-sm text-[#2c2825]">新建人物档案</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#786f65] hover:text-[#2c2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddChar} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">角色姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：林远、苏若雪"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">化名/称号</label>
                <input
                  type="text"
                  placeholder="例如：无名剑客、摘星客"
                  value={charAliases}
                  onChange={(e) => setCharAliases(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">性格特质</label>
                <textarea
                  rows={2}
                  placeholder="外冷内热，极度重诺，面对背叛零容忍..."
                  value={charPersonality}
                  onChange={(e) => setCharPersonality(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">核心动机 / 欲望</label>
                <textarea
                  rows={2}
                  placeholder="寻找灭门真相，打破旧世界阶级枷锁..."
                  value={charMotivation}
                  onChange={(e) => setCharMotivation(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">身世背景</label>
                <textarea
                  rows={2}
                  placeholder="前朝遗脉，幼年被遗弃在荒北黑石要塞..."
                  value={charBackground}
                  onChange={(e) => setCharBackground(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-[#d5cbb8] text-[#554b3e] hover:bg-[#ede5d6]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium"
                >
                  保存档案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
