import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { Character } from '@/types';

const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
  window.dispatchEvent(
    new CustomEvent('novelforge:toast', {
      detail: { title, type },
    })
  );
};
import {
  Users,
  Plus,
  GitCommit,
  UserCheck,
  Edit3,
  Trash2,
  Image,
  Upload,
  Eye,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { CharacterFlowView } from './CharacterFlowView';

export const CharactersView: React.FC = () => {
  const activeNovel = useNovelStore((s) => s.activeNovel);

  const [subTab, setSubTab] = useState<'LIST' | 'RELATIONSHIPS'>('LIST');
  const [characters, setCharacters] = useState<Character[]>([]);

  // Character form state
  const [showAddChar, setShowAddChar] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [charGender, setCharGender] = useState('男');
  const [charAliases, setCharAliases] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charMotivation, setCharMotivation] = useState('');
  const [charBackground, setCharBackground] = useState('');
  const [charAvatarUrl, setCharAvatarUrl] = useState('');
  const [charVisualSummary, setCharVisualSummary] = useState('');
  const [isAnalyzingVisual, setIsAnalyzingVisual] = useState(false);
  const [appearanceTags, setAppearanceTags] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCharGender('男');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setCharAvatarUrl('');
    setCharVisualSummary('');
    setAppearanceTags([]);
    setShowAddChar(true);
  };

  const handleStartEdit = (c: Character) => {
    setEditingCharId(c.id);
    setCharName(c.name);
    setCharGender(c.gender || '男');
    setCharAliases(c.aliases || '');
    setCharPersonality(c.personality || '');
    setCharMotivation(c.motivation || '');
    setCharBackground(c.background || '');
    setCharAvatarUrl(c.avatar_url || '');
    setCharVisualSummary(c.visual_summary || '');
    setAppearanceTags([]);
    setShowAddChar(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请选择有效的图片文件 (PNG, JPG, WEBP)', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('图片尺寸建议不超过 10MB', 'warning');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCharAvatarUrl(base64);
        showToast('角色立绘贴图已载入，可点击【AI 识图理解外貌】自动提取人设！', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiAnalyzeAvatar = async () => {
    if (!charAvatarUrl) {
      showToast('请先上传角色立绘贴图或粘贴图片链接', 'warning');
      return;
    }

    setIsAnalyzingVisual(true);
    try {
      const res = await api.analyzeCharacterAppearance({
        image_url: charAvatarUrl,
        character_name: charName.trim() || '本角色',
        gender: charGender,
        genre: activeNovel?.genre_profile,
      });

      if (res && res.visual_summary) {
        setCharVisualSummary(res.visual_summary);
        if (res.appearance_tags && res.appearance_tags.length > 0) {
          setAppearanceTags(res.appearance_tags);
        }
        showToast('AI 识图成功！已深度理解并生成人设外貌描写与特征标签', 'success');
      }
    } catch (e: any) {
      console.error('AI 识图失败:', e);
      showToast(`AI 识图解析出现偏差: ${e?.message || e}`, 'error');
    } finally {
      setIsAnalyzingVisual(false);
    }
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
        gender: charGender,
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
        avatar_url: charAvatarUrl.trim() || undefined,
        visual_summary: charVisualSummary.trim() || undefined,
      });
    } else {
      await api.createCharacter({
        novel_id: activeNovel.id,
        name: charName.trim(),
        gender: charGender,
        aliases: charAliases.trim() || undefined,
        personality: charPersonality.trim(),
        motivation: charMotivation.trim(),
        background: charBackground.trim(),
        avatar_url: charAvatarUrl.trim() || undefined,
        visual_summary: charVisualSummary.trim() || undefined,
      });
    }

    setCharName('');
    setCharAliases('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setCharAvatarUrl('');
    setCharVisualSummary('');
    setAppearanceTags([]);
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
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
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
                  创建人物并上传角色立绘贴图后，AI 即可深度理解人设外貌，在正文生成与推演台中高度自洽！
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
                      <div className="flex items-center gap-2.5">
                        {/* 角色立绘贴图 / 头像 */}
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.name}
                            className="w-14 h-18 rounded-xl object-cover border-2 border-amber-800/30 shadow-xs shrink-0 bg-surface-2 transition-transform hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-14 h-18 rounded-xl bg-amber-800/10 text-primary flex items-center justify-center font-bold text-base font-serif border border-dashed border-amber-800/25 shrink-0">
                            {c.name.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-ink text-sm font-serif">{c.name}</span>
                            {c.gender && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-800/20 font-sans">
                                {c.gender}
                              </span>
                            )}
                            {c.avatar_url && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-sans flex items-center gap-0.5">
                                <Image className="w-2.5 h-2.5" /> 立绘已配
                              </span>
                            )}
                          </div>
                          {c.aliases && (
                            <span className="text-[11px] text-ink-2">({c.aliases})</span>
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

                    {/* AI 识图外貌特征速览 */}
                    {c.visual_summary && (
                      <div className="text-xs bg-amber-500/5 dark:bg-amber-400/5 border border-amber-800/15 rounded-lg p-2 leading-relaxed">
                        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                          <Eye className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>人设外貌与视觉特征：</span>
                        </div>
                        <p className="line-clamp-2 text-[11px] text-[#52483d] dark:text-[#c4baa8]">
                          {c.visual_summary}
                        </p>
                      </div>
                    )}

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
                        <span className="line-clamp-2">{c.background}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CHARACTER */}
      {showAddChar && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface border border-line rounded-xl p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                {editingCharId ? '编辑人物档案' : '新建人物档案'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChar(false)}
                className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChar} className="space-y-3.5">
              {/* 角色立绘贴图与 AI 识图识别区 */}
              <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-800/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-amber-700" />
                    角色立绘贴图 / 视觉头像
                  </label>
                  <span className="text-[10px] text-ink-2">支持上传本地图片或粘贴图片直链</span>
                </div>

                <div className="flex items-start gap-3">
                  {/* 图片预览 */}
                  <div className="relative group shrink-0">
                    {charAvatarUrl ? (
                      <div className="relative">
                        <img
                          src={charAvatarUrl}
                          alt="角色立绘"
                          className="w-24 h-28 rounded-xl object-cover border-2 border-amber-800/40 shadow-sm bg-surface"
                        />
                        <button
                          type="button"
                          onClick={() => setCharAvatarUrl('')}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs hover:bg-red-700 transition cursor-pointer"
                          title="移除立绘"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-28 rounded-xl border-2 border-dashed border-line hover:border-amber-700 flex flex-col items-center justify-center text-ink-2 hover:text-amber-800 transition cursor-pointer bg-surface/50"
                        title="点击选择本地立绘"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">选择本地立绘</span>
                      </div>
                    )}
                  </div>

                  {/* 动作与链接输入 */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-3 text-xs text-ink font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3 h-3 text-amber-700" />
                        本地图片上传
                      </button>
                      {charAvatarUrl && (
                        <button
                          type="button"
                          onClick={handleAiAnalyzeAvatar}
                          disabled={isAnalyzingVisual}
                          className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                          title="让 AI 深度细致观察立绘外貌特征，提炼为人设描写段落"
                        >
                          {isAnalyzingVisual ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>AI 正在观察立绘...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>👁️ AI 识图理解外貌</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      value={charAvatarUrl.startsWith('data:') ? '已载入本地立绘数据' : charAvatarUrl}
                      onChange={(e) => setCharAvatarUrl(e.target.value)}
                      placeholder="或输入图片公网直链 (https://...)"
                      disabled={charAvatarUrl.startsWith('data:')}
                      className="w-full bg-surface border border-line rounded-lg px-2.5 py-1 text-xs text-ink placeholder-[#8e8476] focus:outline-none focus:ring-1 focus:ring-amber-700"
                    />
                  </div>
                </div>

                {/* 提取出的外貌标签 */}
                {appearanceTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-800/10">
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                      AI 识别标签：
                    </span>
                    {appearanceTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800/10 text-amber-900 dark:text-amber-200 border border-amber-800/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="text-xs text-ink-2 block mb-1">性别</label>
                  <div className="flex rounded-lg border border-line bg-surface p-0.5 text-xs">
                    {(['男', '女', '其他', '未知'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCharGender(g)}
                        className={`flex-1 py-1 rounded text-center transition cursor-pointer font-medium ${
                          charGender === g
                            ? 'bg-amber-800 text-white shadow-2xs'
                            : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
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

              {/* 人设外貌与视觉特征 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-ink-2 flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3 text-amber-700" />
                    人设外貌与视觉特征 (AI 识图提炼或自行手填)
                  </label>
                  <span className="text-[10px] text-amber-700/80">
                    ★ 正文作家与推演台微动作将严格遵照此处描写
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={charVisualSummary}
                  onChange={(e) => setCharVisualSummary(e.target.value)}
                  placeholder="发型发色、五官神态、体态身形、标志性服饰与随身佩饰... (上传立绘后点击上方的【AI 识图理解外貌】可一键生成)"
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink resize-none focus:outline-none focus:ring-1 focus:ring-amber-700 leading-relaxed font-serif"
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
                  rows={2}
                  value={charBackground}
                  onChange={(e) => setCharBackground(e.target.value)}
                  placeholder="生平过往、家族背景与隐藏秘密..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink resize-none focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddChar(false)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs text-ink-2 hover:bg-surface-3 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer shadow-xs active:scale-95"
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

