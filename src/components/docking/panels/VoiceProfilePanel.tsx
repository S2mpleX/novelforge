import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { VoiceProfile, SaveVoiceProfileInput } from '@/types';
import { confirmDialog, alertDialog } from '@/utils/dialog';
import {
  Feather,
  Check,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export const VoiceProfilePanel: React.FC = () => {
  const { activeNovel } = useNovelStore();
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 编辑/新建表单状态
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SaveVoiceProfileInput>({
    name: '',
    description: '',
    sample_text: '',
    sentence_rhythm: 'BALANCED',
    vocabulary_tone: 'CLASSICAL_MODERN',
    pov_preference: 'THIRD_LIMITED',
    sensory_ratio: 'BALANCED',
    custom_rules_json: '[]',
    is_active: false,
  });
  const [rulesList, setRulesList] = useState<string[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const list = await api.listVoiceProfiles(activeNovel?.id);
      setProfiles(list);
      if (list.length > 0 && !selectedProfileId) {
        const active = list.find((p) => p.is_active) || list[0];
        setSelectedProfileId(active.id);
      }
    } catch (e) {
      console.error('加载文风档案失败:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [activeNovel?.id]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || null;

  const handleSetActive = async (id: string) => {
    try {
      await api.setActiveVoiceProfile(id, activeNovel?.id);
      setMessage('已成功切换当前小说的激活文风！后续生成与审稿将自动遵循此风格。');
      loadProfiles();
    } catch (e) {
      setMessage(`切换失败: ${e}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirmDialog('确定要删除这套文风档案吗？')) return;
    try {
      await api.deleteVoiceProfile(id);
      if (selectedProfileId === id) setSelectedProfileId(null);
      loadProfiles();
      setMessage('文风档案已删除');
    } catch (e) {
      setMessage(`删除失败: ${e}`);
    }
  };

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: '',
      sample_text: '',
      sentence_rhythm: 'BALANCED',
      vocabulary_tone: 'CLASSICAL_MODERN',
      pov_preference: 'THIRD_LIMITED',
      sensory_ratio: 'BALANCED',
      custom_rules_json: '[]',
      is_active: false,
      novel_id: activeNovel?.id,
    });
    setRulesList(['段落不超过三行', '避免生硬的说教句']);
    setIsEditing(true);
  };

  const handleStartEdit = (p: VoiceProfile) => {
    setFormData({
      id: p.id,
      name: p.name,
      description: p.description,
      sample_text: p.sample_text,
      sentence_rhythm: p.sentence_rhythm,
      vocabulary_tone: p.vocabulary_tone,
      pov_preference: p.pov_preference,
      sensory_ratio: p.sensory_ratio,
      custom_rules_json: p.custom_rules_json,
      is_active: p.is_active,
      novel_id: p.novel_id,
    });
    try {
      const parsed = JSON.parse(p.custom_rules_json || '[]');
      setRulesList(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRulesList([]);
    }
    setIsEditing(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      await alertDialog('请输入文风档案名称');
      return;
    }
    try {
      const saved = await api.saveVoiceProfile({
        ...formData,
        custom_rules_json: JSON.stringify(rulesList),
      });
      setIsEditing(false);
      setSelectedProfileId(saved.id);
      loadProfiles();
      setMessage(`文风档案【${saved.name}】已成功保存！`);
    } catch (e) {
      setMessage(`保存失败: ${e}`);
    }
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setRulesList([...rulesList, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRulesList(rulesList.filter((_, i) => i !== index));
  };

  const handleTestVoice = async () => {
    if (!selectedProfile) return;
    setIsTesting(true);
    setTestOutput(null);
    try {
      const systemPrompt = `你是一名专业文学大师。请严格按照【${selectedProfile.name}】文风写作。
文风要求：
- 叙事节奏：${selectedProfile.sentence_rhythm}
- 语调基调：${selectedProfile.vocabulary_tone}
- 视角：${selectedProfile.pov_preference}
- 感官配比：${selectedProfile.sensory_ratio}
- 自定义文风规则：${selectedProfile.custom_rules_json}
- 文风参考样章片段：“${selectedProfile.sample_text}”`;

      const userPrompt = `请结合作品《${activeNovel?.title || '长篇小说'}》的设定，现场创作一段 200 字左右的高张力场景段落，展现该文风的独特魅力。`;

      const result = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        temperature: 0.75,
      });
      setTestOutput(result);
    } catch (e) {
      setTestOutput(`试读生成失败: ${e}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* 顶部标题栏 */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Feather className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">文风工作室 (Voice Profiles)</span>
        </div>
        <button
          onClick={handleStartCreate}
          className="px-2 py-0.5 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3 h-3 shrink-0" />
          新建文风
        </button>
      </div>

      {message && (
        <div className="px-3 py-1.5 bg-amber-800/10 text-primary border-b border-amber-800/20 text-[11px] font-medium flex items-center justify-between gap-2 min-w-0">
          <span className="truncate">{message}</span>
          <button onClick={() => setMessage(null)} className="text-primary hover:text-amber-950 font-bold shrink-0">
            ×
          </button>
        </div>
      )}

      {/* 主体左右分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文风列表 */}
        <div className="w-64 border-r border-line bg-[#faf6ef] flex flex-col shrink-0">
          <div className="p-2 border-b border-line text-[11px] font-bold text-ink-2 flex items-center justify-between">
            <span>文风预设与专属 ({profiles.length})</span>
            {isLoading && <RotateCcw className="w-3 h-3 animate-spin text-primary" />}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {profiles.map((p) => {
              const isSelected = p.id === selectedProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    setIsEditing(false);
                    setTestOutput(null);
                  }}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-800/50 bg-[#efe7d8] shadow-xs'
                      : 'border-line bg-white/70 hover:bg-[#f5ede0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-ink truncate">{p.name}</span>
                    {p.is_active && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-800/15 text-emerald-800 font-bold border border-emerald-800/30 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> 激活
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-2 line-clamp-2 leading-tight">
                    {p.description || '暂无描述'}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] text-ink-2">
                    <span className="px-1 py-0.2 bg-[#f0ebd9] rounded">{p.sentence_rhythm}</span>
                    <span className="px-1 py-0.2 bg-[#f0ebd9] rounded">{p.vocabulary_tone}</span>
                    {p.is_builtin && (
                      <span className="text-primary/70 font-semibold ml-auto">内置</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧详情与编辑区 */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 bg-surface">
          {isEditing ? (
            /* 编辑/新建表单 */
            <form onSubmit={handleSaveForm} className="space-y-3 max-w-xl">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <h3 className="font-bold text-sm text-primary">
                  {formData.id ? '编辑文风档案' : '新建小说专属文风档案'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-ink-2 hover:text-ink"
                >
                  取消
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-2 mb-1">文风名称 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：悬疑冷冽·硬派电影感"
                  className="w-full px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-2 mb-1">风格定位与核心说明</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简述该文风的核心调性、适合的场景类型"
                  className="w-full px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-2 mb-1">句式节奏</label>
                  <select
                    value={formData.sentence_rhythm || 'BALANCED'}
                    onChange={(e) => setFormData({ ...formData, sentence_rhythm: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-line bg-surface text-ink"
                  >
                    <option value="FAST_PACED">爽利短句 (快节奏冲突)</option>
                    <option value="BALANCED">平缓均衡 (标准长篇叙事)</option>
                    <option value="DENSE_ATMOSPHERIC">浓稠氛围 (慢速深度沉浸)</option>
                    <option value="STACCATO_TENSION">跳跃短促 (强压迫悬念)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-2 mb-1">语调基调</label>
                  <select
                    value={formData.vocabulary_tone || 'CLASSICAL_MODERN'}
                    onChange={(e) => setFormData({ ...formData, vocabulary_tone: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-line bg-surface text-ink"
                  >
                    <option value="CLASSICAL_MODERN">文白相衬 (典雅修真/历史)</option>
                    <option value="CASUAL_MODERN">通俗利落 (都市爽文/异能)</option>
                    <option value="FORMAL_TECHNICAL">考据严密 (硬核科幻/军事)</option>
                    <option value="DARK_POETIC">冷峻压抑 (末世/克苏鲁/悬疑)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-2 mb-1">叙事视角</label>
                  <select
                    value={formData.pov_preference || 'THIRD_LIMITED'}
                    onChange={(e) => setFormData({ ...formData, pov_preference: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-line bg-surface text-ink"
                  >
                    <option value="THIRD_LIMITED">第三人称限制视角 (贴合主角心智)</option>
                    <option value="THIRD_OMNISCIENT">第三人称全知上帝视角</option>
                    <option value="FIRST_PERSON">第一人称极度主观</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-2 mb-1">感官配比</label>
                  <select
                    value={formData.sensory_ratio || 'BALANCED'}
                    onChange={(e) => setFormData({ ...formData, sensory_ratio: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-line bg-surface text-ink"
                  >
                    <option value="BALANCED">视听均衡 (标准叙事)</option>
                    <option value="ACTION_CENTRIC">动作导向 (突出速度与冲击)</option>
                    <option value="SENSORY_RICH">多感官通感 (温润细腻)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-2 mb-1">代表性样例文本 (AI 学习参照)</label>
                <textarea
                  rows={3}
                  value={formData.sample_text || ''}
                  onChange={(e) => setFormData({ ...formData, sample_text: e.target.value })}
                  placeholder="粘贴 100~300 字体现该文风语调与节奏的精选正文段落..."
                  className="w-full p-2 text-xs rounded border border-line bg-surface text-ink font-serif focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-2 mb-1">文风法则与禁用词约束</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRule();
                      }
                    }}
                    placeholder="如：段落严禁超过三行、避免'只见'等滥用词..."
                    className="flex-1 px-2.5 py-1 text-xs rounded border border-line bg-white focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-2.5 py-1 bg-amber-800 text-white rounded text-xs hover:bg-amber-700"
                  >
                    添加规则
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rulesList.map((rule, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#f0ebd9] border border-line rounded text-[11px] text-ink-2 flex items-center gap-1"
                    >
                      {rule}
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-red-700 hover:text-red-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded border border-line bg-surface-2 text-ink-2 text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium text-xs shadow-xs"
                >
                  保存文风档案
                </button>
              </div>
            </form>
          ) : selectedProfile ? (
            /* 查看选中的文风 */
            <div className="space-y-4 max-w-xl">
              {/* 标题卡片 */}
              <div className="p-3 bg-[#faf6ef] border border-line rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-primary">{selectedProfile.name}</h3>
                    {selectedProfile.is_active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-800/15 text-emerald-800 border border-emerald-800/30 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> 当前小说已激活
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-2">未激活</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-2 mt-1">{selectedProfile.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedProfile.is_active && (
                    <button
                      onClick={() => handleSetActive(selectedProfile.id)}
                      className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      设为当前激活
                    </button>
                  )}
                  {!selectedProfile.is_builtin && (
                    <>
                      <button
                        onClick={() => handleStartEdit(selectedProfile)}
                        className="px-2.5 py-1 rounded border border-line bg-white text-ink-2 hover:bg-[#efe7d8] text-xs font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(selectedProfile.id)}
                        className="p-1 rounded text-red-700 hover:bg-red-50 text-xs"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 核心参数指标 */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="text-ink-2">句式节奏：</span>
                  <span className="font-bold text-ink-2 ml-1">{selectedProfile.sentence_rhythm}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="text-ink-2">词汇语调：</span>
                  <span className="font-bold text-ink-2 ml-1">{selectedProfile.vocabulary_tone}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="text-ink-2">叙事视角：</span>
                  <span className="font-bold text-ink-2 ml-1">{selectedProfile.pov_preference}</span>
                </div>
                <div className="p-2 rounded bg-surface border border-line">
                  <span className="text-ink-2">感官配比：</span>
                  <span className="font-bold text-ink-2 ml-1">{selectedProfile.sensory_ratio}</span>
                </div>
              </div>

              {/* 代表性样例文本 */}
              {selectedProfile.sample_text && (
                <div className="space-y-1">
                  <span className="font-bold text-xs text-ink-2">代表性样例文本：</span>
                  <div className="p-3 rounded-lg bg-surface border border-line font-serif text-xs text-ink leading-relaxed italic">
                    “{selectedProfile.sample_text}”
                  </div>
                </div>
              )}

              {/* 规则与约束 */}
              <div className="space-y-1">
                <span className="font-bold text-xs text-ink-2">专属文风规则与因果禁忌：</span>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    try {
                      const rules: string[] = JSON.parse(selectedProfile.custom_rules_json || '[]');
                      if (rules.length === 0) return <span className="text-xs text-ink-2">无特殊限制</span>;
                      return rules.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#efe7d8] text-primary font-medium text-[11px] border border-amber-800/20"
                        >
                          {r}
                        </span>
                      ));
                    } catch {
                      return <span className="text-xs text-ink-2">无规则</span>;
                    }
                  })()}
                </div>
              </div>

              {/* 试读推演体验卡片 */}
              <div className="p-3 rounded-lg bg-[#f0ebd9] border border-amber-800/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>文风试读体验推演</span>
                  </div>
                  <button
                    onClick={handleTestVoice}
                    disabled={isTesting}
                    className="px-3 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium text-xs flex items-center gap-1 shadow-xs disabled:opacity-40"
                  >
                    {isTesting ? (
                      <>
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        AI 渲染中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        现场试读本风生成效果
                      </>
                    )}
                  </button>
                </div>

                {testOutput && (
                  <div className="mt-2 p-3 rounded bg-white border border-amber-800/30 font-serif text-xs text-ink leading-relaxed shadow-xs">
                    <div className="text-[10px] text-primary font-bold mb-1">【试读段落生成结果】</div>
                    {testOutput}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-ink-2">
              <Feather className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
              <p>请在左侧选择一套文风档案进行查看，或点击右上角新建</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
