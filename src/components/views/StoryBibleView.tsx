import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { Character, WorldRule, PlotThread } from '@/types';
import {
  Users,
  Compass,
  Bookmark,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const StoryBibleView: React.FC = () => {
  const { activeNovel } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'CHARACTERS' | 'RULES' | 'PLOTS'>('CHARACTERS');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [rules, setRules] = useState<WorldRule[]>([]);
  const [threads, setThreads] = useState<PlotThread[]>([]);

  // Character form state
  const [showAddChar, setShowAddChar] = useState(false);
  const [charName, setCharName] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charMotivation, setCharMotivation] = useState('');
  const [charBackground, setCharBackground] = useState('');

  // Rule form state
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [ruleAuthority, setRuleAuthority] = useState<'CANON' | 'EXTENDED' | 'HYPOTHESIS'>('CANON');

  // Plot thread form state
  const [showAddThread, setShowAddThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadDesc, setThreadDesc] = useState('');

  const loadAll = async () => {
    if (!activeNovel) return;
    try {
      const [chars, rls, thrs] = await Promise.all([
        api.listCharacters(activeNovel.id),
        api.listWorldRules(activeNovel.id),
        api.listPlotThreads(activeNovel.id),
      ]);
      setCharacters(chars);
      setRules(rls);
      setThreads(thrs);
    } catch (e) {
      console.error('加载设定库失败:', e);
    }
  };

  useEffect(() => {
    loadAll();
  }, [activeNovel?.id]);

  const handleAddChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !charName.trim()) return;

    await api.createCharacter({
      novel_id: activeNovel.id,
      name: charName.trim(),
      personality: charPersonality.trim(),
      motivation: charMotivation.trim(),
      background: charBackground.trim(),
    });

    setCharName('');
    setCharPersonality('');
    setCharMotivation('');
    setCharBackground('');
    setShowAddChar(false);
    loadAll();
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !ruleTitle.trim()) return;

    await api.createWorldRule({
      novel_id: activeNovel.id,
      title: ruleTitle.trim(),
      rule_content: ruleContent.trim(),
      authority_level: ruleAuthority,
    });

    setRuleTitle('');
    setRuleContent('');
    setShowAddRule(false);
    loadAll();
  };

  const handleAddThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !threadTitle.trim()) return;

    await api.createPlotThread({
      novel_id: activeNovel.id,
      title: threadTitle.trim(),
      description: threadDesc.trim(),
    });

    setThreadTitle('');
    setThreadDesc('');
    setShowAddThread(false);
    loadAll();
  };

  if (!activeNovel) {
    return <div className="flex-1 flex items-center justify-center text-slate-500">请选择小说</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900/40 select-none overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Top Bible Sub-Navigation */}
      <div className="h-12 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CHARACTERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'CHARACTERS'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            人物档案 ({characters.length})
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'RULES'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            世界观法则 ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('PLOTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'PLOTS'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            伏笔与悬念 ({threads.length})
          </button>
        </div>

        <div>
          {activeTab === 'CHARACTERS' && (
            <button
              onClick={() => setShowAddChar(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              新建人物
            </button>
          )}
          {activeTab === 'RULES' && (
            <button
              onClick={() => setShowAddRule(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              新增世界观规则
            </button>
          )}
          {activeTab === 'PLOTS' && (
            <button
              onClick={() => setShowAddThread(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              埋设新伏笔
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* CHARACTERS TAB */}
          {activeTab === 'CHARACTERS' && (
            <div>
              {characters.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 mb-3">暂无角色档案。创建人物后，写作 Agent 将在生成章节时自动遵守人物性格与动机！</p>
                  <button
                    onClick={() => setShowAddChar(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    创建首位角色
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{c.name}</span>
                          {c.aliases && (
                            <span className="text-[11px] text-slate-400">({c.aliases})</span>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          已激活
                        </span>
                      </div>

                      {c.personality && (
                        <div className="text-xs text-slate-300">
                          <span className="text-slate-500 mr-1.5">性格：</span>
                          {c.personality}
                        </div>
                      )}
                      {c.motivation && (
                        <div className="text-xs text-slate-300">
                          <span className="text-slate-500 mr-1.5">核心动机：</span>
                          {c.motivation}
                        </div>
                      )}
                      {c.background && (
                        <div className="text-xs text-slate-400 leading-relaxed">
                          <span className="text-slate-500 mr-1.5">生平背景：</span>
                          {c.background}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WORLD RULES (CANON) TAB */}
          {activeTab === 'RULES' && (
            <div>
              {rules.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
                  <Compass className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 mb-3">暂无世界观设定。记录战力体系、地理法则等权威规则，防止长篇创作前后矛盾！</p>
                  <button
                    onClick={() => setShowAddRule(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    添加核心规则
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-slate-100">{r.title}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {r.authority_level} (权威)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{r.rule_content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLOT THREADS TAB */}
          {activeTab === 'PLOTS' && (
            <div>
              {threads.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 mb-3">暂无悬念伏笔。登记尚未揭晓的秘密与伏笔线索，辅助多 Agent 持续追踪！</p>
                  <button
                    onClick={() => setShowAddThread(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    埋设第一条伏笔
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <h4 className="text-sm font-bold text-slate-100">{t.title}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD CHARACTER */}
      {showAddChar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">新建人物档案</h3>
            <form onSubmit={handleAddChar} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">姓名 *</label>
                <input
                  required
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="如：叶修、顾清怀、陈平安..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">性格特质</label>
                <input
                  value={charPersonality}
                  onChange={(e) => setCharPersonality(e.target.value)}
                  placeholder="如：沉稳果决、玩世不恭、外冷内热..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">核心动机 / 目标</label>
                <input
                  value={charMotivation}
                  onChange={(e) => setCharMotivation(e.target.value)}
                  placeholder="如：重返荣耀巅峰、为宗门复仇..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">背景身世</label>
                <textarea
                  rows={3}
                  value={charBackground}
                  onChange={(e) => setCharBackground(e.target.value)}
                  placeholder="生平过往、家族背景与隐藏秘密..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChar(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                >
                  保存人物
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WORLD RULE */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">新增世界观法则 (Canon)</h3>
            <form onSubmit={handleAddRule} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">规则名称 *</label>
                <input
                  required
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="如：灵气潮汐法则、热力学禁区、超凡契约..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">权威分级</label>
                <select
                  value={ruleAuthority}
                  onChange={(e: any) => setRuleAuthority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="CANON">CANON (权威不可动摇)</option>
                  <option value="EXTENDED">EXTENDED (可扩展推演)</option>
                  <option value="HYPOTHESIS">HYPOTHESIS (待确认猜想)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">规则详细描述 *</label>
                <textarea
                  required
                  rows={4}
                  value={ruleContent}
                  onChange={(e) => setRuleContent(e.target.value)}
                  placeholder="详细规则与约束边界..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                >
                  保存规则
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PLOT THREAD */}
      {showAddThread && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">埋设新伏笔 / 故事线</h3>
            <form onSubmit={handleAddThread} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">伏笔标题 *</label>
                <input
                  required
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  placeholder="如：青铜古剑的真正来历、主角身世玉佩的缺口..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">线索内容与预期回收</label>
                <textarea
                  rows={4}
                  value={threadDesc}
                  onChange={(e) => setThreadDesc(e.target.value)}
                  placeholder="描述当前已埋设的细节线索及未来推进设想..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddThread(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                >
                  登记伏笔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
