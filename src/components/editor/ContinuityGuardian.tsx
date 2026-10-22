import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Character, WorldRule, PlotThread, CanonFact, ReviewFinding } from '@/types';
import { api } from '@/utils/tauriBridge';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

export interface ContinuityConflict {
  id: string;
  category: 'CHARACTER' | 'WORLD_RULE' | 'PLOT_THREAD' | 'CANON';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION';
  title: string;
  description: string;
  evidence_quote?: string;
  source_setting: string;
  suggestion: string;
}

export interface ContinuityGuardianProps {
  chapterId: string | null;
  chapterText: string;
  novelId: string | null;
  characters: Character[];
  worldRules: WorldRule[];
  plotThreads: PlotThread[];
}

export const ContinuityGuardian: React.FC<ContinuityGuardianProps> = ({
  chapterId,
  chapterText,
  novelId,
  characters,
  worldRules,
  plotThreads,
}) => {
  const [canonFacts, setCanonFacts] = useState<CanonFact[]>([]);
  const [conflicts, setConflicts] = useState<ContinuityConflict[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  // Load L3/L4 canon facts
  useEffect(() => {
    if (!novelId) return;
    api.listCanonFacts(novelId).then((facts) => {
      setCanonFacts(facts || []);
    }).catch(() => setCanonFacts([]));
  }, [novelId]);

  // Fast background heuristic scanner for instant zero-latency feedback
  const runLocalConsistencyScan = useCallback(() => {
    if (!chapterText || chapterText.length < 20) {
      setConflicts([]);
      return;
    }

    const cleanText = chapterText.replace(/<[^>]+>/g, ' ');
    const results: ContinuityConflict[] = [];

    // 1. World Rule / Canon Conflicts (Check CANON rules with negative constraints)
    worldRules.forEach((rule) => {
      if (rule.authority_level !== 'CANON') return;
      const ruleKeywords = rule.title.split(/[\s·:：()（）]+/);

      ruleKeywords.forEach((kw) => {
        if (kw.length >= 2 && cleanText.includes(kw)) {
          // If rule contains absolute prohibitions (e.g. 严禁 / 不得 / 无法 / 代价)
          const hasProhibition = /严禁|不得|不可|无法|禁忌|必须|代价|反噬/.test(rule.rule_content);
          if (hasProhibition) {
            // Find quote snippet
            const idx = cleanText.indexOf(kw);
            const start = Math.max(0, idx - 15);
            const end = Math.min(cleanText.length, idx + kw.length + 25);
            const quote = cleanText.slice(start, end).trim();

            results.push({
              id: `rule_conflict_${rule.id}`,
              category: 'WORLD_RULE',
              severity: 'MAJOR',
              title: `触碰权威法则【${rule.title}】`,
              description: `此处涉及权威法则【${rule.title}】，该法则存在严格因果约束：“${rule.rule_content.slice(0, 45)}...”，请确保正文未违背设定底线。`,
              evidence_quote: `...${quote}...`,
              source_setting: `权威法则: ${rule.title} (CANON)`,
              suggestion: '检查是否已遵循施法代价或环境限制，避免出现吃书式战力崩盘。',
            });
          }
        }
      });
    });

    // 2. Canon Facts Cross-check
    canonFacts.forEach((fact) => {
      if (fact.authority_level !== 'CANON') return;
      const sub = fact.subject_id || '';
      if (sub && cleanText.includes(sub)) {
        const idx = cleanText.indexOf(sub);
        const start = Math.max(0, idx - 15);
        const end = Math.min(cleanText.length, idx + sub.length + 25);
        const quote = cleanText.slice(start, end).trim();

        results.push({
          id: `canon_fact_${fact.id}`,
          category: 'CANON',
          severity: 'MINOR',
          title: `关联权威事实【${sub}】`,
          description: `前文已确立核心事实：${fact.predicate}【${fact.object_value}】。`,
          evidence_quote: `...${quote}...`,
          source_setting: `权威事实库: ${sub} ${fact.predicate} ${fact.object_value}`,
          suggestion: '请保持此项已确立设定的一致性。',
        });
      }
    });

    // 3. Character status & traits check
    characters.forEach((char) => {
      if (char.status === 'DEAD' && cleanText.includes(char.name)) {
        results.push({
          id: `char_dead_${char.id}`,
          category: 'CHARACTER',
          severity: 'CRITICAL',
          title: `已故人物【${char.name}】疑似复活现身`,
          description: `人物档案中【${char.name}】状态标记为已故 (DEAD)，但当前章节正文中出现了其活跃描写。`,
          evidence_quote: `“...${char.name}...”`,
          source_setting: `人物档案: ${char.name} (已故)`,
          suggestion: '如系回忆或幻象，请在行文增加心智或幻视标志；若非回忆，则属严重吃书bug。',
        });
      }
    });

    // 4. Plot Threads check
    plotThreads.forEach((thread) => {
      if (thread.status === 'PLANTED' && cleanText.includes(thread.title)) {
        results.push({
          id: `thread_${thread.id}`,
          category: 'PLOT_THREAD',
          severity: 'SUGGESTION',
          title: `正文触及前文伏笔【${thread.title}】`,
          description: `此处提及已埋设的伏笔“${thread.description}”。预期回收方案：“${thread.expected_resolution || '暂无'}”。`,
          source_setting: `全书伏笔: ${thread.title}`,
          suggestion: '可顺势推进伏笔进展，或埋入新的悬念变数。',
        });
      }
    });

    // Deduplicate by ID
    const unique = Array.from(new Map(results.map((r) => [r.id, r])).values());
    setConflicts(unique);
  }, [chapterText, worldRules, canonFacts, characters, plotThreads]);

  // Debounced auto-scan on content change (2500ms idle)
  useEffect(() => {
    const timer = setTimeout(() => {
      runLocalConsistencyScan();
    }, 2500);
    return () => clearTimeout(timer);
  }, [runLocalConsistencyScan]);

  // Deep LLM-powered continuity audit on demand
  const handleRunDeepAudit = async () => {
    if (!chapterId) return;
    setIsAuditing(true);
    toast.info('防吃书深度监护中', '正在由 Continuity Auditor 对齐前文五层记忆与世界法则...');

    try {
      const rep = await api.runContinuityAudit(chapterId);
      if (rep && rep.findings) {
        const deepConflicts: ContinuityConflict[] = rep.findings.map((f: ReviewFinding, idx: number) => ({
          id: `deep_${f.id || idx}`,
          category: (f.category as any) || 'CONTINUITY',
          severity: (f.severity as any) || 'MAJOR',
          title: f.title,
          description: f.description,
          evidence_quote: f.evidence_quote,
          source_setting: '全书因果链审计',
          suggestion: f.suggestion || '建议进行因果重塑或补充破局代价',
        }));

        setConflicts((prev) => {
          const merged = [...deepConflicts, ...prev];
          return Array.from(new Map(merged.map((m) => [m.id, m])).values());
        });

        toast.success(
          '全书防吃书巡检完毕',
          `因果评分: ${rep.score} 分，发现 ${deepConflicts.length} 处潜在设定冲突或优化项`
        );
      }
    } catch (e: any) {
      console.warn('深度监护回退至本地规则引擎:', e);
      runLocalConsistencyScan();
    } finally {
      setIsAuditing(false);
    }
  };

  const activeConflicts = useMemo(() => {
    return conflicts.filter((c) => !ignoredIds.has(c.id));
  }, [conflicts, ignoredIds]);

  const handleIgnore = (id: string) => {
    setIgnoredIds((prev) => new Set([...prev, id]));
    toast.info('已忽略此条提示', '已将其标记为例外，不再打扰');
  };

  return (
    <>
      {/* Discreet Editor Bottom Pill / Footer Status Bar */}
      <div className="flex items-center gap-2 text-xs font-serif select-none">
        <button
          type="button"
          onClick={() => setShowDrawer(!showDrawer)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
            activeConflicts.length > 0
              ? 'bg-rose-950/10 text-rose-800 dark:text-rose-300 border-rose-800/30 dark:border-rose-400/30 font-bold animate-pulse'
              : 'bg-emerald-950/10 text-emerald-800 dark:text-emerald-300 border-emerald-800/20 dark:border-emerald-400/20'
          }`}
          title="点击查看全书因果与防吃书实时监护面板"
        >
          {activeConflicts.length > 0 ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
              <span>防吃书监护: 存疑 {activeConflicts.length} 处</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>防吃书监护中 · 设定严密</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleRunDeepAudit}
          disabled={isAuditing}
          className="p-1 rounded text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
          title="触发深度因果巡检 (由 Continuity Auditor Agent 执行)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Slide-over Drawer / Card of Conflicts */}
      {showDrawer && (
        <div className="fixed bottom-12 right-6 w-96 bg-[#fdfbf7] dark:bg-[#1f1b18] border border-amber-900/30 dark:border-[#38312b] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 font-serif text-xs text-ink dark:text-[#ede6dc]">
          <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-[#352f2a] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary dark:text-amber-400" />
              <h3 className="font-bold text-sm tracking-wide text-ink dark:text-[#ede6dc]">
                全书防吃书实时监护
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              className="p-1 rounded text-ink-2 hover:text-ink transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mb-3">
            基于 L3/L4 长期权威事实库、世界法则与人物状态静默比对，温和守护设定严密性。
          </div>

          {activeConflicts.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-800 dark:text-emerald-400 space-y-1">
              <ShieldCheck className="w-8 h-8 mx-auto" />
              <p className="font-bold">当前章节暂未发现设定冲突与吃书迹象</p>
              <p className="text-[10px] text-ink-2">权威法则与前文因果链完好保全</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {activeConflicts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-amber-950/5 dark:bg-[#25201b] border border-amber-900/15 dark:border-[#38312b] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-rose-800 dark:text-rose-400 text-xs truncate">
                      {c.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIgnore(c.id)}
                      className="text-[10px] text-ink-2 hover:text-ink hover:underline cursor-pointer font-sans"
                    >
                      忽略
                    </button>
                  </div>

                  <p className="text-ink dark:text-[#dcd3c5] leading-relaxed">
                    {c.description}
                  </p>

                  {c.evidence_quote && (
                    <div className="p-1.5 rounded bg-amber-50 dark:bg-[#1a1714] border-l-2 border-rose-700 text-[11px] text-ink-2 italic">
                      原文线索：{c.evidence_quote}
                    </div>
                  )}

                  <div className="pt-1 text-[11px] text-primary dark:text-amber-300 font-sans">
                    💡 建议: {c.suggestion}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2.5 border-t border-amber-900/10 dark:border-[#352f2a] flex items-center justify-between text-[11px]">
            <span className="text-ink-2 font-mono">
              权威设定 {worldRules.length + canonFacts.length} 条已联通
            </span>
            <button
              type="button"
              onClick={handleRunDeepAudit}
              disabled={isAuditing}
              className="px-2.5 py-1 rounded-lg bg-amber-800 text-white hover:bg-amber-700 transition cursor-pointer flex items-center gap-1 font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? '巡检中...' : '深度巡检'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
