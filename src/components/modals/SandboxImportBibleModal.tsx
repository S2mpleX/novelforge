import React, { useState, useEffect } from 'react';
import { api } from '@/utils/tauriBridge';
import type {
  Novel,
  Chapter,
  WorldRule,
  CharacterRelationship,
  Character,
  PlotThread,
  CharacterActorConfig,
} from '@/types';
import {
  BookOpen,
  FileText,
  Compass,
  Users,
  Check,
  Sparkles,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  Loader2,
} from 'lucide-react';

interface SandboxImportBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNovel: Novel | null;
  currentActors: CharacterActorConfig[];
  onImportContext: (data: {
    novelId?: string;
    sceneSetting?: string;
    sceneGoal?: string;
    actorUpdates?: Array<{
      character_id: string;
      private_motivation?: string;
      private_secret?: string;
    }>;
  }) => void;
}

export const SandboxImportBibleModal: React.FC<SandboxImportBibleModalProps> = ({
  isOpen,
  onClose,
  activeNovel,
  currentActors,
  onImportContext,
}) => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovelId, setSelectedNovelId] = useState<string>(activeNovel?.id || '');
  const [activeTab, setActiveTab] = useState<'CHAPTERS' | 'CANON' | 'RELATIONS' | 'THREADS'>('CHAPTERS');

  // Chapters Data
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterTailContent, setChapterTailContent] = useState<string>('');

  // World Rules Data
  const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());

  // Character Relationships & State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [matchedRelations, setMatchedRelations] = useState<Array<{ rel: CharacterRelationship; source: Character; target: Character }>>([]);

  // Plot Threads Data
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load Novels
  useEffect(() => {
    if (!isOpen) return;
    api.listNovels().then((list) => {
      setNovels(list);
      if (!selectedNovelId && list.length > 0) {
        setSelectedNovelId(activeNovel?.id || list[0].id);
      }
    }).catch(console.error);
  }, [isOpen, activeNovel?.id]);

  // Load selected novel data
  useEffect(() => {
    if (!isOpen || !selectedNovelId) return;
    setIsLoading(true);

    Promise.all([
      api.listChapters(selectedNovelId),
      api.listWorldRules(selectedNovelId),
      api.listCharacters(selectedNovelId),
      api.listCharacterRelationships(selectedNovelId),
      api.listPlotThreads(selectedNovelId),
    ])
      .then(([chaps, rules, chars, rels, threads]) => {
        setChapters(chaps);
        setWorldRules(rules);
        setCharacters(chars);
        setRelationships(rels);
        setPlotThreads(threads);

        if (chaps.length > 0) {
          const first = chaps[chaps.length - 1]; // Default to latest chapter
          setSelectedChapterId(first.id);
          setSelectedChapter(first);
          extractChapterTail(first.content || '');
        } else {
          setSelectedChapterId('');
          setSelectedChapter(null);
          setChapterTailContent('');
        }

        // Match relations between current actors
        const actorIds = new Set(currentActors.map((a) => a.character_id));
        const matched = rels
          .filter((r) => actorIds.has(r.source_character_id) && actorIds.has(r.target_character_id))
          .map((r) => {
            const source = chars.find((c) => c.id === r.source_character_id)!;
            const target = chars.find((c) => c.id === r.target_character_id)!;
            return { rel: r, source, target };
          })
          .filter((item) => Boolean(item.source && item.target));

        setMatchedRelations(matched);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isOpen, selectedNovelId, currentActors]);

  const extractChapterTail = (content: string) => {
    const plain = content.replace(/<[^>]+>/g, '').trim();
    if (!plain) {
      setChapterTailContent('');
      return;
    }
    // Take last 400 chars
    const tail = plain.slice(-400).trim();
    setChapterTailContent(tail);
  };

  const handleSelectChapter = (ch: Chapter) => {
    setSelectedChapterId(ch.id);
    setSelectedChapter(ch);
    extractChapterTail(ch.content || '');
  };

  const toggleRule = (id: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 1. 一键导入章节前情作为场景设定
  const handleImportChapterSetting = () => {
    if (!selectedChapter) return;
    const settingText = chapterTailContent
      ? `【承接第${selectedChapter.chapter_number}章《${selectedChapter.title}》前文】：\n……${chapterTailContent}`
      : `【承接第${selectedChapter.chapter_number}章《${selectedChapter.title}》】`;

    onImportContext({ sceneSetting: settingText });
  };

  // 2. 一键导入章节目标作为交锋目标
  const handleImportChapterGoal = () => {
    if (!selectedChapter) return;
    const goalText = selectedChapter.chapter_goal
      ? `围绕第${selectedChapter.chapter_number}章核心矛盾推进：${selectedChapter.chapter_goal}`
      : `双方围绕《${selectedChapter.title}》的核心悬念展开博弈试探，争夺主动权。`;

    onImportContext({ sceneGoal: goalText });
  };

  // 3. 追加世界观法则到场景
  const handleAppendRules = () => {
    const selected = worldRules.filter((r) => selectedRuleIds.has(r.id));
    if (selected.length === 0) return;

    const formatted = selected
      .map((r) => `【法则《${r.title}》】${r.rule_content}`)
      .join('\n');

    onImportContext({
      sceneSetting: formatted,
    });
  };

  // 4. 一键将角色关系与心境注入到出场角色
  const handleApplyRelationships = () => {
    const updates: Array<{
      character_id: string;
      private_motivation?: string;
      private_secret?: string;
    }> = [];

    for (const actor of currentActors) {
      const charRels = relationships.filter(
        (r) => r.source_character_id === actor.character_id || r.target_character_id === actor.character_id
      );

      if (charRels.length > 0) {
        const relDescriptions = charRels.map((r) => {
          const isSource = r.source_character_id === actor.character_id;
          const otherId = isSource ? r.target_character_id : r.source_character_id;
          const otherChar = characters.find((c) => c.id === otherId);
          return `与【${otherChar?.name || '对手'}】为${r.relation_type}${r.description ? `（${r.description}）` : ''}`;
        }).join('；');

        const matchedChar = characters.find((c) => c.id === actor.character_id);

        updates.push({
          character_id: actor.character_id,
          private_motivation: `基于人物关系（${relDescriptions}），在对峙中力争主导，绝不退让。`,
          private_secret: matchedChar?.background ? `生平秘密：${matchedChar.background.slice(0, 100)}` : '严守绝密底牌不外露。',
        });
      }
    }

    if (updates.length > 0) {
      onImportContext({ actorUpdates: updates });
    }
  };

  // 5. 综合一键整装导入 (All-in-One Master Import)
  const handleMasterImport = () => {
    let settingText = '';
    if (selectedChapter) {
      settingText += chapterTailContent
        ? `【承接第${selectedChapter.chapter_number}章《${selectedChapter.title}》】：\n……${chapterTailContent}\n\n`
        : `【场景选定：第${selectedChapter.chapter_number}章《${selectedChapter.title}》】\n\n`;
    }

    // Append rules
    const selected = worldRules.filter((r) => selectedRuleIds.has(r.id));
    if (selected.length > 0) {
      settingText += `【核心世界观法则约束】：\n` + selected.map((r) => `* 《${r.title}》: ${r.rule_content}`).join('\n') + '\n\n';
    }

    // Goal text
    let goalText = '';
    if (selectedChapter?.chapter_goal) {
      goalText = `本场冲突目标：${selectedChapter.chapter_goal}`;
    } else if (selectedChapter) {
      goalText = `双方围绕《${selectedChapter.title}》的核心悬念展开博弈试探，争夺主动权。`;
    }

    // Selected thread
    if (selectedThreadId) {
      const thread = plotThreads.find((t) => t.id === selectedThreadId);
      if (thread) {
        goalText += `\n【核心伏笔暗线争端】：双方暗中试探关于“${thread.title}”的线索（细节：${thread.description || '不可轻泄'}）。`;
      }
    }

    // Actor updates
    const updates: Array<{
      character_id: string;
      private_motivation?: string;
      private_secret?: string;
    }> = [];

    for (const actor of currentActors) {
      const charRels = relationships.filter(
        (r) => r.source_character_id === actor.character_id || r.target_character_id === actor.character_id
      );
      if (charRels.length > 0) {
        const relDescriptions = charRels.map((r) => {
          const isSource = r.source_character_id === actor.character_id;
          const otherId = isSource ? r.target_character_id : r.source_character_id;
          const otherChar = characters.find((c) => c.id === otherId);
          return `与【${otherChar?.name || '对方'}】是${r.relation_type}${r.description ? `（${r.description}）` : ''}`;
        }).join('；');

        const matchedChar = characters.find((c) => c.id === actor.character_id);

        updates.push({
          character_id: actor.character_id,
          private_motivation: `因（${relDescriptions}），在对戏中谨慎试探，护住底牌。`,
          private_secret: matchedChar?.motivation ? `内心深层执念：${matchedChar.motivation}` : '不惜代价探明对方动机。',
        });
      }
    }

    onImportContext({
      novelId: selectedNovelId,
      sceneSetting: settingText.trim() || undefined,
      sceneGoal: goalText.trim() || undefined,
      actorUpdates: updates.length > 0 ? updates : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-3xl bg-surface border border-line rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-line bg-surface-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-800/10 text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-ink flex items-center gap-2">
                <span>导入书本与设定到推演台</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-sans border border-amber-500/20">
                  原著因果贯通
                </span>
              </h3>
              <p className="text-[11px] text-ink-2">
                一键提取小说正文前情、章节大纲、世界观铁律与人物羁绊，直接赋予对戏沙盒
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-2 hover:text-ink transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Novel Selector Bar */}
        <div className="px-5 py-2.5 bg-surface-1 border-b border-line flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-ink-2 shrink-0 font-medium">当前目标作品：</span>
            <select
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-line bg-surface text-ink font-serif font-bold text-xs outline-none focus:border-amber-700 max-w-[260px] truncate"
            >
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  《{n.title}》 ({n.genre_profile || '未分类'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-ink-2">
            <span>已载入：</span>
            <span className="font-mono text-primary font-bold">{chapters.length}</span> 章 ·
            <span className="font-mono text-primary font-bold">{worldRules.length}</span> 条铁律 ·
            <span className="font-mono text-primary font-bold">{characters.length}</span> 位角色
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-line bg-surface-2 text-xs font-serif shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('CHAPTERS')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'CHAPTERS'
                ? 'border-amber-700 text-primary bg-surface'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. 章节正文与目标 ({chapters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANON')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'CANON'
                ? 'border-amber-700 text-primary bg-surface'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. 世界观铁律法则 ({worldRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RELATIONS')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'RELATIONS'
                ? 'border-amber-700 text-primary bg-surface'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. 角色羁绊与心境 ({relationships.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('THREADS')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'THREADS'
                ? 'border-amber-700 text-primary bg-surface'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>4. 伏笔悬念暗线 ({plotThreads.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 text-xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-ink-2 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
              <span>正在提取书本与故事设定...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: CHAPTERS */}
              {activeTab === 'CHAPTERS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                  {/* Left: Chapter list */}
                  <div className="md:col-span-1 border border-line rounded-xl overflow-hidden flex flex-col bg-surface-1 max-h-[360px]">
                    <div className="px-3 py-2 bg-surface-2 border-b border-line font-bold text-[11px] text-ink flex items-center justify-between shrink-0">
                      <span>选择承接章节</span>
                      <span className="text-[10px] text-ink-2 font-mono">共 {chapters.length} 章</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 space-y-1">
                      {chapters.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-ink-2">当前小说暂无章节</div>
                      ) : (
                        chapters.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelectChapter(ch)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                              selectedChapterId === ch.id
                                ? 'bg-amber-800 text-white font-medium shadow-2xs'
                                : 'hover:bg-surface-3 text-ink'
                            }`}
                          >
                            <span className="truncate">
                              第{ch.chapter_number}章 {ch.title}
                            </span>
                            <span className="text-[10px] opacity-70 shrink-0 ml-1 font-mono">
                              {ch.word_count || 0}字
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Chapter Preview & Actions */}
                  <div className="md:col-span-2 space-y-3">
                    {selectedChapter ? (
                      <>
                        <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-ink font-serif text-sm">
                              第 {selectedChapter.chapter_number} 章：《{selectedChapter.title}》
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                              共 {selectedChapter.word_count || 0} 字
                            </span>
                          </div>

                          {/* Chapter Goal */}
                          <div>
                            <span className="text-[10px] text-ink-2 font-bold block mb-0.5">本章核心冲突目标 (Chapter Goal)：</span>
                            <p className="text-[11px] text-ink bg-surface p-2 rounded-lg border border-line font-serif leading-relaxed">
                              {selectedChapter.chapter_goal || '（未设定显式章节目标，系统将自动基于标题与正文归纳博弈动机）'}
                            </p>
                          </div>

                          {/* Chapter Tail Content Preview */}
                          <div>
                            <span className="text-[10px] text-ink-2 font-bold block mb-0.5">前文末尾切入剧情（最近约400字）：</span>
                            <div className="text-[11px] text-ink-2 bg-surface p-2.5 rounded-lg border border-line font-serif leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                              {chapterTailContent || '（该章节正文为空）'}
                            </div>
                          </div>
                        </div>

                        {/* Quick Apply Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleImportChapterSetting}
                            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>单项填入【场景设定】</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleImportChapterGoal}
                            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            <span>单项填入【交锋目标】</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-20 text-center text-ink-2">请在左侧选择小说章节</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CANON RULES */}
              {activeTab === 'CANON' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-2">
                      勾选需要在对戏中严格约束角色的世界观铁律（如境界压制、功法反噬、物理公理）：
                    </p>
                    <button
                      type="button"
                      onClick={handleAppendRules}
                      disabled={selectedRuleIds.size === 0}
                      className="px-3 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>追加已选法则 ({selectedRuleIds.size}) 到场景</span>
                    </button>
                  </div>

                  {worldRules.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-line rounded-xl text-ink-2">
                      当前小说尚未录入世界观法则，可在【世界观与设定集】中添加权威设定。
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto">
                      {worldRules.map((r) => {
                        const checked = selectedRuleIds.has(r.id);
                        return (
                          <div
                            key={r.id}
                            onClick={() => toggleRule(r.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                              checked
                                ? 'bg-amber-500/10 border-amber-500/50 text-ink'
                                : 'bg-surface-2 border-line hover:border-amber-700/40 text-ink-2 hover:text-ink'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-amber-800 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-serif font-bold text-xs text-primary truncate">
                                  《{r.title}》
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800/10 text-primary border border-amber-800/20 font-mono">
                                  {r.authority_level}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed line-clamp-3">
                                {r.rule_content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RELATIONSHIPS */}
              {activeTab === 'RELATIONS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-2">
                      当前推演台出场角色的恩怨关系拓扑（自动侦测宿敌、暗恋、师徒、同盟）：
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyRelationships}
                      disabled={matchedRelations.length === 0}
                      className="px-3 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>注入羁绊到双方私密动机</span>
                    </button>
                  </div>

                  {matchedRelations.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-line rounded-xl text-ink-2 space-y-1">
                      <p className="font-bold text-xs text-ink">当前出场角色之间暂无显式拓扑关系</p>
                      <p className="text-[11px]">
                        可前往【角色关系拓扑】建立两人的羁绊，或在左侧角色卡中直接手填私密算盘。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                      {matchedRelations.map(({ rel, source, target }) => (
                        <div
                          key={rel.id}
                          className="p-3 rounded-xl bg-surface-2 border border-line flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 font-serif font-bold text-xs text-ink min-w-0">
                            <span className="text-primary">{source.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="text-primary">{target.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary border border-amber-800/20 font-sans ml-2">
                              {rel.relation_type}
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-2 truncate max-w-[280px]">
                            {rel.description || '命运交织，各怀心思'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: THREADS */}
              {activeTab === 'THREADS' && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-2">
                    选择当前小说中尚未闭合的关键伏笔，将其作为本场对手戏的核心筹码与争端焦点：
                  </p>

                  {plotThreads.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-line rounded-xl text-ink-2">
                      当前小说暂无伏笔线索记录。
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                      {plotThreads.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedThreadId(t.id === selectedThreadId ? '' : t.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            selectedThreadId === t.id
                              ? 'bg-amber-500/10 border-amber-500/50 text-ink'
                              : 'bg-surface-2 border-line hover:border-amber-700/40 text-ink-2 hover:text-ink'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-serif font-bold text-xs text-primary truncate">
                                伏笔：{t.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-800/10 text-primary border border-amber-800/20 font-mono">
                                {t.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-2 truncate">{t.description || '未填写线索细节'}</p>
                          </div>
                          <div className="shrink-0">
                            {selectedThreadId === t.id ? (
                              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> 已选定
                              </span>
                            ) : (
                              <span className="text-[11px] text-ink-2">点击选用</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-line bg-surface-2 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-ink-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>智能装配将保护已有的对话记录，仅更新场景环境、冲突目标与私密动机</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-line text-xs text-ink-2 hover:bg-surface-3 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleMasterImport}
              className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>一键装配到推演台</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
