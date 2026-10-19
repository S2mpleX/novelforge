import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { WorldRule, PlotThread } from '@/types';
import {
  Compass,
  Bookmark,
  Plus,
  ShieldCheck,
  Sparkles,
  Layers,
  Edit3,
  Trash2,
} from 'lucide-react';
import { PlotArcsView } from './PlotArcsView';

interface WorldSettingsViewProps {
  initialTab?: 'RULES' | 'PLOT_ARCS' | 'PLOTS';
}

export const WorldSettingsView: React.FC<WorldSettingsViewProps> = ({ initialTab = 'RULES' }) => {
  const { activeNovel } = useNovelStore();

  const [subTab, setSubTab] = useState<'RULES' | 'PLOT_ARCS' | 'PLOTS'>(initialTab);
  const [rules, setRules] = useState<WorldRule[]>([]);
  const [threads, setThreads] = useState<PlotThread[]>([]);

  // Rule form state
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [ruleAuthority, setRuleAuthority] = useState<'CANON' | 'EXTENDED' | 'HYPOTHESIS'>('CANON');

  // Plot thread form state
  const [showAddThread, setShowAddThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadDesc, setThreadDesc] = useState('');

  const loadData = async () => {
    if (!activeNovel) return;
    try {
      const [rls, thrs] = await Promise.all([
        api.listWorldRules(activeNovel.id),
        api.listPlotThreads(activeNovel.id),
      ]);
      setRules(rls);
      setThreads(thrs);
    } catch (e) {
      console.error('加载世界观设定失败:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleReload = () => loadData();
    window.addEventListener('novelforge:reload-story-bible', handleReload);
    return () => window.removeEventListener('novelforge:reload-story-bible', handleReload);
  }, [activeNovel?.id]);

  useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab);
    }
  }, [initialTab]);

  const handleStartAddRule = () => {
    setEditingRuleId(null);
    setRuleTitle('');
    setRuleContent('');
    setRuleAuthority('CANON');
    setShowAddRule(true);
  };

  const handleStartEditRule = (r: WorldRule) => {
    setEditingRuleId(r.id);
    setRuleTitle(r.title);
    setRuleContent(r.rule_content);
    setRuleAuthority(r.authority_level as any);
    setShowAddRule(true);
  };

  const handleDeleteRule = async (r: WorldRule) => {
    const ok = await confirmDialog({
      title: '删除世界观法则',
      message: `确定要删除世界观法则“${r.title}”吗？此操作不可撤销。`,
      confirmText: '彻底删除',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteWorldRule(r.id);
      loadData();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('删除世界观法则失败:', e);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNovel || !ruleTitle.trim()) return;

    if (editingRuleId) {
      await api.updateWorldRule({
        id: editingRuleId,
        title: ruleTitle.trim(),
        rule_content: ruleContent.trim(),
        authority_level: ruleAuthority,
      });
    } else {
      await api.createWorldRule({
        novel_id: activeNovel.id,
        title: ruleTitle.trim(),
        rule_content: ruleContent.trim(),
        authority_level: ruleAuthority,
      });
    }

    setRuleTitle('');
    setRuleContent('');
    setEditingRuleId(null);
    setShowAddRule(false);
    loadData();
    window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
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
    loadData();
    window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
  };

  const handleThreadStatusChange = async (threadId: string, status: string) => {
    try {
      await api.updatePlotThreadStatus(threadId, status);
      loadData();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('更新伏笔状态失败:', e);
    }
  };

  const handleDeleteThread = async (t: PlotThread) => {
    const ok = await confirmDialog({
      title: '删除剧情伏笔',
      message: `确定要删除伏笔线索“${t.title}”吗？此操作不可撤销。`,
      confirmText: '彻底删除',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await api.deletePlotThread(t.id);
      loadData();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('删除伏笔失败:', e);
    }
  };

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-2">
        请选择或创建小说项目以管理世界观设定
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-canvas select-none overflow-hidden h-full">
      {/* Top World Sub-Navigation */}
      <div className="h-12 border-b border-line px-4 sm:px-6 flex items-center justify-between bg-surface-2/95 shrink-0 shadow-xs gap-3 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none min-w-0 py-1">
          <button
            onClick={() => setSubTab('RULES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap ${
              subTab === 'RULES'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            世界观法则 ({rules.length})
          </button>
          <button
            onClick={() => setSubTab('PLOT_ARCS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap ${
              subTab === 'PLOT_ARCS'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            大纲与剧情弧
          </button>
          <button
            onClick={() => setSubTab('PLOTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap ${
              subTab === 'PLOTS'
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            伏笔与悬念 ({threads.length})
          </button>
        </div>

        <div className="shrink-0 whitespace-nowrap">
          {subTab === 'RULES' && (
            <button
              onClick={handleStartAddRule}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              新增世界观规则
            </button>
          )}
          {subTab === 'PLOTS' && (
            <button
              onClick={() => setShowAddThread(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              埋设新伏笔
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {subTab === 'PLOT_ARCS' ? (
        <div className="flex-1 p-4 overflow-hidden">
          <PlotArcsView novelId={activeNovel.id} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* WORLD RULES (CANON) TAB */}
            {subTab === 'RULES' && (
              <div>
                {rules.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-line rounded-xl bg-surface">
                    <Compass className="w-10 h-10 text-ink-2 mx-auto mb-2 opacity-50" />
                    <h4 className="text-sm font-bold text-ink font-serif mb-1">暂无世界观设定</h4>
                    <p className="text-xs text-ink-2 mb-4 max-w-md mx-auto">
                      记录战力体系、地理法则、超凡体系等权威公理（Canon），防止长篇创作前后矛盾，杜绝战力崩坏！
                    </p>
                    <button
                      onClick={handleStartAddRule}
                      className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium transition shadow-sm"
                    >
                      添加第一条核心规则
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-surface border border-line hover:border-amber-800/40 shadow-xs transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <h4 className="text-sm font-bold text-ink font-serif">{r.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                              r.authority_level === 'CANON'
                                ? 'bg-emerald-800/10 text-emerald-800 border border-emerald-800/20'
                                : r.authority_level === 'EXTENDED'
                                ? 'bg-amber-800/10 text-primary border border-amber-800/20'
                                : 'bg-indigo-800/10 text-indigo-800 border border-indigo-800/20'
                            }`}>
                              {r.authority_level === 'CANON' ? 'CANON (权威铁律)' : r.authority_level === 'EXTENDED' ? 'EXTENDED (推演扩展)' : 'HYPOTHESIS (假设猜想)'}
                            </span>
                            <button
                              onClick={() => handleStartEditRule(r)}
                              className="p-1 text-ink-2 hover:text-primary transition rounded hover:bg-surface-3 cursor-pointer"
                              title="编辑法则"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(r)}
                              className="p-1 text-ink-2 hover:text-red-700 transition rounded hover:bg-surface-3 cursor-pointer"
                              title="删除法则"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{r.rule_content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PLOT THREADS TAB */}
            {subTab === 'PLOTS' && (
              <div>
                {threads.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-line rounded-xl bg-surface">
                    <Bookmark className="w-10 h-10 text-ink-2 mx-auto mb-2 opacity-50" />
                    <h4 className="text-sm font-bold text-ink font-serif mb-1">暂无悬念伏笔</h4>
                    <p className="text-xs text-ink-2 mb-4 max-w-md mx-auto">
                      登记尚未揭晓的秘密与伏笔线索，辅助多 Agent 在后续章节流转中持续追踪与适时回收！
                    </p>
                    <button
                      onClick={() => setShowAddThread(true)}
                      className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium transition shadow-sm"
                    >
                      埋设第一条伏笔
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threads.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-surface border border-line hover:border-amber-800/40 shadow-xs transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-bold text-ink font-serif">{t.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={t.status}
                              onChange={(e) => handleThreadStatusChange(t.id, e.target.value)}
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono border cursor-pointer focus:outline-none ${
                                t.status === 'RESOLVED'
                                  ? 'bg-emerald-800/10 text-emerald-800 border-emerald-800/20'
                                  : t.status === 'READY_TO_RESOLVE'
                                  ? 'bg-purple-800/10 text-purple-800 border-purple-800/20'
                                  : t.status === 'DEVELOPING'
                                  ? 'bg-blue-800/10 text-blue-800 border-blue-800/20'
                                  : 'bg-amber-800/10 text-primary border-amber-800/20'
                              }`}
                            >
                              <option value="PLANTED">已埋设</option>
                              <option value="DEVELOPING">发酵中</option>
                              <option value="READY_TO_RESOLVE">临界回收</option>
                              <option value="RESOLVED">已回收揭秘</option>
                              <option value="ABANDONED">已废弃/遗忘</option>
                            </select>
                            <button
                              onClick={() => handleDeleteThread(t)}
                              className="p-1 text-ink-2 hover:text-red-700 transition rounded hover:bg-surface-3 cursor-pointer"
                              title="删除伏笔"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {t.description && (
                          <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD WORLD RULE */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-line rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-ink font-serif">
              {editingRuleId ? '编辑世界观法则 (Canon)' : '新增世界观法则 (Canon)'}
            </h3>
            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="text-xs text-ink-2 block mb-1">规则名称 *</label>
                <input
                  required
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="如：灵气潮汐法则、热力学禁区、超凡契约..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">权威分级</label>
                <select
                  value={ruleAuthority}
                  onChange={(e: any) => setRuleAuthority(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                >
                  <option value="CANON">CANON (权威不可动摇)</option>
                  <option value="EXTENDED">EXTENDED (可扩展推演)</option>
                  <option value="HYPOTHESIS">HYPOTHESIS (待确认猜想)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">规则详细描述 *</label>
                <textarea
                  required
                  rows={4}
                  value={ruleContent}
                  onChange={(e) => setRuleContent(e.target.value)}
                  placeholder="详细规则与约束边界..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink resize-none focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs text-ink-2 hover:bg-surface-3"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-line rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-ink font-serif">埋设新伏笔 / 故事线</h3>
            <form onSubmit={handleAddThread} className="space-y-3">
              <div>
                <label className="text-xs text-ink-2 block mb-1">伏笔标题 *</label>
                <input
                  required
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  placeholder="如：青铜古剑的真正来历、主角身世玉佩的缺口..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="text-xs text-ink-2 block mb-1">线索内容与预期回收</label>
                <textarea
                  rows={4}
                  value={threadDesc}
                  onChange={(e) => setThreadDesc(e.target.value)}
                  placeholder="描述当前已埋设的细节线索及未来推进设想..."
                  className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink resize-none focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddThread(false)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs text-ink-2 hover:bg-surface-3"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium"
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
