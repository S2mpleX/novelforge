import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import type { WorldRule } from '@/types';
import {
  Compass,
  Plus,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  X,
  Edit3,
  Trash2,
} from 'lucide-react';

interface RuleTemplateItem {
  genre: string;
  title: string;
  authority: 'CANON' | 'EXTENDED' | 'HYPOTHESIS';
  content: string;
}

const GENRE_RULE_TEMPLATES: RuleTemplateItem[] = [
  {
    genre: '科幻',
    title: '超空间曲率跃迁过载极限公理',
    authority: 'CANON',
    content: '任何常规物质飞船在执行超空间跃迁时，曲率引擎过载率严禁突破 145%；一旦被重力透镜或黑洞引力井捕获，逆向跃迁将直接导致舰体微观粒子坍缩消亡。',
  },
  {
    genre: '科幻',
    title: '纳米自毁与智械底层硬编码协议',
    authority: 'EXTENDED',
    content: '所有搭载自主作战逻辑的战斗型外骨骼与纳米无人机集群，均必须内置第三级硬编码物理熔断保险，严禁在无主控信标授权下进入自律杀戮模式。',
  },
  {
    genre: '都市',
    title: '金融证券双向做空熔断公理',
    authority: 'CANON',
    content: '单日大盘波动超过 10% 自动触发第一级无条件停牌熔断；任何离岸信托基金与杠杆拆借交易必须通过跨国加密清算所备案，杜绝幽灵账户操盘。',
  },
  {
    genre: '都市',
    title: '超凡觉醒者社会治安管理条例',
    authority: 'EXTENDED',
    content: '觉醒者禁止在非受控公共场合动用二级以上具象战技或精神干预；违规造成平民伤亡者直接剥夺公民权并由特别稽查处实施神经抑制。',
  },
  {
    genre: '末日',
    title: '地表黑雨生物基因衰变公理',
    authority: 'CANON',
    content: '地表降落的酸性黑雨含有高浓度变异辐射孢子；未穿戴密闭防化护甲暴露在黑雨中超过 180 秒，将触发不可逆机体溃烂与神经异化。',
  },
  {
    genre: '末日',
    title: '避难所高能净水与血清战略配给制',
    authority: 'EXTENDED',
    content: '深层地下净水与抗畸变血清为避难所全体生存者共有的不可再生资源；私自截留或向黑市走私者将被剥夺生存资格并放逐至辐射红区。',
  },
  {
    genre: '玄幻',
    title: '天地灵气守恒与神魂誓约公理',
    authority: 'CANON',
    content: '大千世界灵脉产出总量恒定；凡修士以本命神魂引动天道契约立下血誓者，背誓必遭九霄神雷心魔反噬，道基俱毁。',
  },
  {
    genre: '玄幻',
    title: '次级秘境与洞天福地空间承载律',
    authority: 'EXTENDED',
    content: '化神期以上大能严禁在凡品洞天福地内全力施展法天象地，否则世界晶壁失稳崩裂，空间乱流将彻底湮灭该秘境内所有生灵。',
  },
];

export const WorldSettingsPanel: React.FC = () => {
  const activeNovel = useNovelStore((s) => s.activeNovel);
  const [rules, setRules] = useState<WorldRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

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

    const handleReload = () => {
      loadRules();
    };
    window.addEventListener('novelforge:reload-story-bible', handleReload);
    return () => {
      window.removeEventListener('novelforge:reload-story-bible', handleReload);
    };
  }, [activeNovel?.id]);

  const handleStartAdd = () => {
    setEditingRuleId(null);
    setRuleTitle('');
    setRuleContent('');
    setRuleAuthority('CANON');
    setShowAddModal(true);
  };

  const handleStartEdit = (r: WorldRule) => {
    setEditingRuleId(r.id);
    setRuleTitle(r.title);
    setRuleContent(r.rule_content);
    setRuleAuthority(r.authority_level as any);
    setShowAddModal(true);
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
      loadRules();
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
    } catch (e) {
      console.error('删除法则失败:', e);
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
    setShowAddModal(false);
    loadRules();
    window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
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
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-primary border border-amber-800/20 font-semibold flex items-center gap-1">
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
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2">
        请选择或创建小说项目以管理世界观设定
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-ink text-xs overflow-hidden select-none">
      {/* Top action bar */}
      <div className="p-2 border-b border-line bg-surface-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-xs">世界观铁律与法则 ({rules.length})</span>
        </div>
        <button
          onClick={handleStartAdd}
          className="px-2 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px]"
        >
          <Plus className="w-3 h-3" />
          新增法则
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-line bg-surface/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2" />
          <input
            type="text"
            placeholder="搜索战力体系、地理法则、魔法规则..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded pl-7 pr-2 py-1 text-xs text-ink placeholder-[#8e8476] focus:outline-none focus:border-amber-700"
          />
        </div>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-2">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>暂无世界观法则设定，点击右上角【新增法则】建立</p>
          </div>
        ) : (
          filtered.map((rule) => (
            <div
              key={rule.id}
              className="bg-surface border border-line hover:border-amber-800/40 rounded-lg p-3 transition shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">{rule.title}</span>
                  {getAuthorityBadge(rule.authority_level)}
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleStartEdit(rule)}
                    className="p-1 text-ink-2 hover:text-amber-800 rounded hover:bg-surface-3 transition"
                    title="编辑法则"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="p-1 text-ink-2 hover:text-red-600 rounded hover:bg-red-50 transition"
                    title="删除法则"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] leading-relaxed text-[#4b4337] font-serif whitespace-pre-wrap">
                {rule.rule_content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create or Edit World Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-xl max-w-md w-full p-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
              <span className="font-bold text-sm text-ink">
                {editingRuleId ? '编辑世界观铁律' : '新增世界观铁律'}
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-ink-2 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* 快速注入流派模板胶囊 */}
            <div className="p-2 rounded-lg bg-surface-2 border border-line space-y-1.5">
              <span className="text-[10px] text-ink-2 font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-primary" />
                流派公理推荐模板 (点击一键填入):
              </span>
              <div className="flex flex-wrap gap-1">
                {GENRE_RULE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => {
                      setRuleTitle(tpl.title);
                      setRuleAuthority(tpl.authority);
                      setRuleContent(tpl.content);
                    }}
                    className="px-2 py-0.5 rounded text-[10.5px] bg-surface hover:bg-surface-3 text-stone-700 dark:text-stone-300 border border-line hover:border-amber-700 transition cursor-pointer"
                  >
                    [{tpl.genre}] {tpl.title.slice(0, 8)}...
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">法则标题 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：超空间曲率跃迁极限定律、金融做空熔断公理、基因衰变律..."
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">权威分级</label>
                <select
                  value={ruleAuthority}
                  onChange={(e) => setRuleAuthority(e.target.value as any)}
                  className="w-full bg-surface border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-amber-700"
                >
                  <option value="CANON">核心铁律 (CANON) — 不可违背的世界公理</option>
                  <option value="EXTENDED">扩展衍生 (EXTENDED) — 局部学派或势力共识</option>
                  <option value="HYPOTHESIS">待验假说 (HYPOTHESIS) — 传说或人物揣测</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-2 mb-1">法则详细定义与限制 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="详细描述法则生效条件、反噬后果、适用范围..."
                  value={ruleContent}
                  onChange={(e) => setRuleContent(e.target.value)}
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
                  {editingRuleId ? '保存修改' : '确认入库'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
