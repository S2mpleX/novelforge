import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { WorldRule } from '@/types';
import {
  Compass,
  Plus,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export const WorldSettingsPanel: React.FC = () => {
  const { activeNovel } = useNovelStore();
  const [rules, setRules] = useState<WorldRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [ruleAuthority, setRuleAuthority] = useState<'CANON' | 'EXTENDED' | 'HYPOTHESIS'>('CANON');

  const loadRules = async () => {
    if (!activeNovel) return;
    try {
      const rls = await api.listWorldRules(activeNovel.id);
      setRules(rls);
    } catch (e) {
      console.error('加载世界观法则失败:', e);
    }
  };

  useEffect(() => {
    loadRules();
  }, [activeNovel?.id]);

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
    setShowAddModal(false);
    loadRules();
  };

  const getAuthorityBadge = (level: string) => {
    switch (level) {
      case 'CANON':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-800/10 text-red-800 border border-red-800/20 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            核心铁律 (CANON)
          </span>
        );
      case 'EXTENDED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-amber-800 border border-amber-800/20 font-semibold flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" />
            扩展衍生 (EXTENDED)
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-800/10 text-blue-800 border border-blue-800/20 font-semibold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            待验假说 (HYPOTHESIS)
          </span>
        );
    }
  };

  const filtered = rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65]">
        请选择或创建小说项目以管理世界观设定
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">世界观铁律与法则 ({rules.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Plus className="w-3 h-3" />
          新增法则
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#fdfbf7]/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8e8476]" />
          <input
            type="text"
            placeholder="搜索战力体系、地理法则、魔法规则..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded pl-7 pr-2 py-1 text-xs text-[#2b2621] placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#786f65]">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-800" />
            <p>暂无世界观法则设定，点击右上角【新增法则】建立</p>
          </div>
        ) : (
          filtered.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#fdfbf7] border border-[#dcd3c1] hover:border-amber-800/40 rounded-lg p-3 transition shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#854d0e]">{rule.title}</span>
                {getAuthorityBadge(rule.authority_level)}
              </div>
              <div className="text-[11px] leading-relaxed text-[#4b4337] font-serif whitespace-pre-wrap">
                {rule.rule_content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create World Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] border border-[#d5cbb8] rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded5c4] mb-3">
              <span className="font-bold text-sm text-[#2c2825]">新增世界观铁律</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#786f65] hover:text-[#2c2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">法则标题 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：原初灵能三大不可逆定律、大荒界域重力常数"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">权威分级</label>
                <select
                  value={ruleAuthority}
                  onChange={(e) => setRuleAuthority(e.target.value as any)}
                  className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded px-2.5 py-1.5 text-xs text-[#2b2621] focus:outline-none focus:border-amber-700"
                >
                  <option value="CANON">核心铁律 (CANON) — 不可违背的世界公理</option>
                  <option value="EXTENDED">扩展衍生 (EXTENDED) — 局部学派或势力共识</option>
                  <option value="HYPOTHESIS">待验假说 (HYPOTHESIS) — 传说或人物揣测</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#554b3e] mb-1">法则详细定义与限制 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="详细描述法则生效条件、反噬后果、适用范围..."
                  value={ruleContent}
                  onChange={(e) => setRuleContent(e.target.value)}
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
                  确认入库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
