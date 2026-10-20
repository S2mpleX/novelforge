import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { Character } from '@/types';
import {
  Users,
  Plus,
  Search,
  X,
  Clock,
  HeartPulse,
  Skull,
  Filter,
  Edit3,
  Trash2,
} from 'lucide-react';

interface Props {
  params?: Record<string, any>;
}

export type CharacterLifeStatus = '健康' | '受伤' | '闭关' | '离场' | '死亡';

export function getStatusDisplayName(status: CharacterLifeStatus, genre?: string): string {
  const g = (genre || '').toLowerCase();
  if (status === '闭关') {
    if (g.includes('科幻') || g.includes('星际') || g.includes('赛博')) return '休眠/冷冻';
    if (g.includes('末日') || g.includes('废土') || g.includes('丧尸')) return '隔离/失联';
    if (g.includes('都市') || g.includes('谍战') || g.includes('刑侦')) return '潜伏/隐匿';
    return '闭关/潜修';
  }
  if (status === '死亡') {
    if (g.includes('科幻') || g.includes('星际')) return '阵亡/殉职';
    return '死亡/陨落';
  }
  if (status === '离场') {
    if (g.includes('科幻') || g.includes('星际')) return '航行/脱队';
    return '离场/远行';
  }
  return status;
}

const STATUS_CONFIG: Record<
  CharacterLifeStatus,
  { label: CharacterLifeStatus; color: string; bg: string; border: string; desc: string }
> = {
  健康: {
    label: '健康',
    color: '#15803d',
    bg: '#dcfce7',
    border: '#86efac',
    desc: '行动自如，全盛或正常状态',
  },
  受伤: {
    label: '受伤',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    desc: '带伤在身或机体受损，战力折损，需要救治或调养',
  },
  闭关: {
    label: '闭关',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#93c5fd',
    desc: '闭关潜修、冷冻休眠、暗线潜伏或隔离失联，暂不插手外界纷争',
  },
  离场: {
    label: '离场',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    desc: '远行、星际航行、换地图或暂退主线，防神隐遗忘',
  },
  死亡: {
    label: '死亡',
    color: '#991b1b',
    bg: '#fee2e2',
    border: '#fca5a5',
    desc: '已确认陨落或阵亡，作为剧情因果与复仇锚点（严防误复活）',
  },
};

export const CharacterProfilesPanel: React.FC<Props> = ({ params }) => {
  const { activeNovel } = useNovelStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profiles' | 'tracking'>('tracking');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Form state
  const [charName, setCharName] = useState('');
  const [charAliases, setCharAliases] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charMotivation, setCharMotivation] = useState('');
  const [charBackground, setCharBackground] = useState('');
  const [charInitialStatus, setCharInitialStatus] = useState<CharacterLifeStatus>('健康');

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

    const handleReload = () => {
      loadCharacters();
    };
    window.addEventListener('novelforge:reload-story-bible', handleReload);
    return () => {
      window.removeEventListener('novelforge:reload-story-bible', handleReload);
    };
  }, [activeNovel?.id, params?.characterId]);

  const handleStartAdd = () => {
    setEditingChar(null);
    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setCharInitialStatus('健康');
    setShowAddModal(true);
  };

  const handleStartEdit = (char: Character) => {
    setEditingChar(char);
    setCharName(char.name);
    setCharAliases(char.aliases || '');
    setCharPersonality(char.personality || '');
    setCharMotivation(char.motivation || '');
    setCharBackground(char.background || '');
    setCharInitialStatus(getNormalizedStatus(char.status));
    setShowAddModal(true);
  };

  const handleDeleteCharacter = async (char: Character) => {
    const ok = await confirmDialog({
      title: '删除角色档案',
      message: `确定要删除角色“${char.name}”吗？此操作将同步清理该角色的关系拓扑、状态历史与成长弧。`,
      confirmText: '彻底删除',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteCharacter(char.id);
      if (selectedCharacter?.id === char.id) {
        setSelectedCharacter(null);
      }
      await loadCharacters();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('删除角色失败:', e);
    }
  };

  const handleSaveChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !charName.trim()) return;

    if (editingChar) {
      await api.updateCharacter({
        id: editingChar.id,
        name: charName.trim(),
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
      });
      if (charInitialStatus !== getNormalizedStatus(editingChar.status)) {
        await handleStatusChange(editingChar.id, charInitialStatus);
      }
    } else {
      const created = await api.createCharacter({
        novel_id: activeNovel.id,
        name: charName.trim(),
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
      });

      if (charInitialStatus !== '健康' && created?.id) {
        await api.updateCharacterStatus(created.id, charInitialStatus);
      }
    }

    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setCharInitialStatus('健康');
    setEditingChar(null);
    setShowAddModal(false);
    loadCharacters();
    window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
  };

  const handleStatusChange = async (charId: string, newStatus: CharacterLifeStatus) => {
    setIsUpdatingStatus(charId);
    try {
      await api.updateCharacterStatus(charId, newStatus);
      // 同时记录到因果状态追踪事件表
      await api.createCharacterStateEvent({
        character_id: charId,
        field_name: 'survival_status',
        new_value: newStatus,
        effective_time: `状态更新为【${newStatus}】`,
      });
      await loadCharacters();
    } catch (e) {
      console.error('更新角色生存状态失败:', e);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const getNormalizedStatus = (rawStatus?: string): CharacterLifeStatus => {
    if (!rawStatus) return '健康';
    if (['健康', 'HEALTHY', 'ACTIVE', '正常', '全盛'].includes(rawStatus)) return '健康';
    if (['受伤', 'INJURED', '受损', '重伤'].includes(rawStatus)) return '受伤';
    if (['闭关', 'SECLUDED', '休眠', '冷冻', '潜伏', '隔离', '失联', '潜修', '隐匿'].includes(rawStatus)) return '闭关';
    if (['离场', 'ABSENT', '远行', '隐退', '脱队', '换图'].includes(rawStatus)) return '离场';
    if (['死亡', 'DECEASED', '阵亡', '陨落', '殉职', '消亡'].includes(rawStatus)) return '死亡';
    return '健康';
  };

  const filtered = characters.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aliases?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'tracking' && statusFilter !== '全部') {
      const cur = getNormalizedStatus(c.status);
      return cur === statusFilter;
    }

    return true;
  });

  // 统计各状态人数
  const counts = {
    全部: characters.length,
    健康: characters.filter((c) => getNormalizedStatus(c.status) === '健康').length,
    受伤: characters.filter((c) => getNormalizedStatus(c.status) === '受伤').length,
    闭关: characters.filter((c) => getNormalizedStatus(c.status) === '闭关').length,
    离场: characters.filter((c) => getNormalizedStatus(c.status) === '离场').length,
    死亡: characters.filter((c) => getNormalizedStatus(c.status) === '死亡').length,
  };

  const deceasedList = characters.filter((c) => getNormalizedStatus(c.status) === '死亡');

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2">
        请选择或创建小说项目以管理人物档案与出场追踪
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none font-sans">
      {/* 顶部主工具栏与视图切换 */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* 模式切换胶囊 */}
          <div className="flex items-center bg-[#ded5c4]/60 p-0.5 rounded-lg border border-line shrink-0">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 shrink-0" />
              出场生存追踪
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'profiles'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              人物档案卡
            </button>
          </div>

          <span className="text-[11px] text-ink-2 hidden md:inline shrink-0 whitespace-nowrap">
            共 {characters.length} 位角色
          </span>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 shrink-0" />
          新建角色
        </button>
      </div>

      {/* 出场追踪模式下的状态筛选与防复活安全锁 */}
      {activeTab === 'tracking' && (
        <div className="border-b border-line bg-[#fbf9f5] px-3 py-2 space-y-2 shrink-0">
          {/* 状态统计药丸 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-2 mr-1 flex items-center gap-1 font-medium">
              <Filter className="w-3 h-3" /> 状态筛选:
            </span>
            {(['全部', '健康', '受伤', '闭关', '离场', '死亡'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition border ${
                  statusFilter === st
                    ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                    : 'bg-white border-line text-ink-2 hover:border-amber-700'
                }`}
              >
                {st === '全部' ? '全部' : getStatusDisplayName(st, activeNovel?.genre_profile || (activeNovel as any)?.genre)} ({counts[st]})
              </button>
            ))}
          </div>

          {/* 防死人复活安全提示条 */}
          {deceasedList.length > 0 && (
            <div className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>
                  <strong>因果锁已就绪：</strong>已确认陨落角色 ({deceasedList.map((d) => d.name).join('、')})，严防 AI 在后续章节擅自复活！
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 搜索栏 */}
      <div className="p-2 border-b border-line bg-surface/80 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2" />
          <input
            type="text"
            placeholder="搜索角色姓名、称号别名或性格特征..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded pl-7 pr-2 py-1 text-xs text-ink placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* 视图内容区 */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-2">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>暂无符合条件的角色，点击右上角【新建角色】录入</p>
          </div>
        ) : activeTab === 'tracking' ? (
          /* 出场生存追踪看板视图 (Tracking Board) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
            {filtered.map((char) => {
              const curStatus = getNormalizedStatus(char.status);
              const conf = STATUS_CONFIG[curStatus];
              return (
                <div
                  key={char.id}
                  className="bg-surface border border-line rounded-xl p-3 shadow-xs hover:border-amber-700/60 transition flex flex-col justify-between"
                >
                  <div>
                    {/* 卡片头部：姓名与生存状态选择 */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm text-primary truncate">{char.name}</span>
                        {char.aliases && (
                          <span className="text-[10px] text-ink-2 font-serif truncate max-w-[80px]">
                            ({char.aliases})
                          </span>
                        )}
                      </div>

                      {/* 状态徽章与快捷流转 */}
                      <select
                        value={curStatus}
                        disabled={isUpdatingStatus === char.id}
                        onChange={(e) =>
                          handleStatusChange(char.id, e.target.value as CharacterLifeStatus)
                        }
                        style={{
                          color: conf.color,
                          backgroundColor: conf.bg,
                          borderColor: conf.border,
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer outline-none transition"
                      >
                        <option value="健康">🟢 {getStatusDisplayName('健康', activeNovel?.genre_profile)}</option>
                        <option value="受伤">🟠 {getStatusDisplayName('受伤', activeNovel?.genre_profile)}</option>
                        <option value="闭关">🔵 {getStatusDisplayName('闭关', activeNovel?.genre_profile)}</option>
                        <option value="离场">⚪ {getStatusDisplayName('离场', activeNovel?.genre_profile)}</option>
                        <option value="死亡">🔴 {getStatusDisplayName('死亡', activeNovel?.genre_profile)}</option>
                      </select>
                    </div>

                    {/* 状态描述 */}
                    <p className="text-[11px] text-ink-2 mb-2 font-medium">
                      {conf.desc}
                    </p>

                    {/* 性格与动机速览 */}
                    {char.personality && (
                      <p className="text-[10.5px] text-ink-2 line-clamp-2 mb-1">
                        <span className="text-ink-2">性格:</span> {char.personality}
                      </p>
                    )}
                    {char.motivation && (
                      <p className="text-[10.5px] text-ink-2 line-clamp-2 mb-1">
                        <span className="text-ink-2">动机:</span> {char.motivation}
                      </p>
                    )}
                  </div>

                  {/* 快捷操作与最近更新提示 */}
                  <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between text-[10px] text-ink-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary/60" />
                      动态追踪已激活
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(char)}
                        className="text-primary hover:text-amber-700 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="编辑人物档案"
                      >
                        <Edit3 className="w-3 h-3" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char)}
                        className="text-red-700 hover:text-red-800 font-medium flex items-center gap-0.5 cursor-pointer"
                        title="删除人物档案"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 传统人物档案卡视图 (Profiles Grid) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
            {filtered.map((char) => {
              const curStatus = getNormalizedStatus(char.status);
              const conf = STATUS_CONFIG[curStatus];
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className={`bg-surface border rounded-lg p-3 transition shadow-xs flex flex-col justify-between cursor-pointer ${
                    selectedCharacter?.id === char.id
                      ? 'border-amber-800 ring-1 ring-amber-800/40'
                      : 'border-line hover:border-amber-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-primary">{char.name}</span>
                        {char.aliases && (
                          <span className="text-[10px] text-ink-2 font-serif">（{char.aliases}）</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ color: conf.color, backgroundColor: conf.bg, borderColor: conf.border }}
                          className="px-1.5 py-0.2 rounded text-[10px] border font-medium"
                        >
                          {curStatus}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(char);
                          }}
                          className="p-1 text-ink-2 hover:text-primary transition rounded hover:bg-surface-3 cursor-pointer"
                          title="编辑人物档案"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCharacter(char);
                          }}
                          className="p-1 text-ink-2 hover:text-red-700 transition rounded hover:bg-surface-3 cursor-pointer"
                          title="删除人物档案"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {char.personality && (
                      <p className="text-[11px] text-ink-2 line-clamp-2 mb-1.5 font-serif">
                        <strong>性格：</strong>{char.personality}
                      </p>
                    )}

                    {char.motivation && (
                      <p className="text-[11px] text-ink-2 line-clamp-2 mb-1.5 font-serif">
                        <strong>动机：</strong>{char.motivation}
                      </p>
                    )}
                  </div>

                  {char.background && (
                    <div className="mt-2 pt-2 border-t border-line text-[10px] text-ink-2 line-clamp-2">
                      {char.background}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建人物模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
              <span className="font-bold text-sm text-ink">
                {editingChar ? '编辑人物档案与生存状态' : '新建人物档案与追踪初始状态'}
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-ink-2 hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChar} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-2 mb-1">角色姓名 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：林远、苏若雪"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-2 mb-1">初始生存状态</label>
                  <select
                    value={charInitialStatus}
                    onChange={(e) => setCharInitialStatus(e.target.value as CharacterLifeStatus)}
                    className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                  >
                    <option value="健康">🟢 {getStatusDisplayName('健康', activeNovel?.genre_profile)} (全盛/正常)</option>
                    <option value="受伤">🟠 {getStatusDisplayName('受伤', activeNovel?.genre_profile)} (战损/虚弱)</option>
                    <option value="闭关">🔵 {getStatusDisplayName('闭关', activeNovel?.genre_profile)} (隐匿/离线)</option>
                    <option value="离场">⚪ {getStatusDisplayName('离场', activeNovel?.genre_profile)} (远行/未入局)</option>
                    <option value="死亡">🔴 {getStatusDisplayName('死亡', activeNovel?.genre_profile)} (阵亡/剧情锚点)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">化名/称号</label>
                <input
                  type="text"
                  placeholder="例如：无名剑客、摘星客"
                  value={charAliases}
                  onChange={(e) => setCharAliases(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">性格特质</label>
                <textarea
                  rows={2}
                  placeholder="外冷内热，极度重诺，面对背叛零容忍..."
                  value={charPersonality}
                  onChange={(e) => setCharPersonality(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">核心动机 / 欲望</label>
                <textarea
                  rows={2}
                  placeholder="寻找灭门真相，打破旧世界阶级枷锁..."
                  value={charMotivation}
                  onChange={(e) => setCharMotivation(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">身世背景</label>
                <textarea
                  rows={2}
                  placeholder="前朝遗脉，幼年被遗弃在荒北黑石要塞..."
                  value={charBackground}
                  onChange={(e) => setCharBackground(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-line text-ink-2 hover:bg-surface-3"
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
