import React, { useState, useEffect, useCallback } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type {
  CanonFact,
  Character,
  CharacterStateEvent,
  Chapter,
  ExtractChapterMemoryResult,
} from '@/types';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  User,
  Database,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface MemoryEngineViewProps {
  novelId?: string;
}

export const MemoryEngineView: React.FC<MemoryEngineViewProps> = ({ novelId: propNovelId }) => {
  const { activeNovel } = useNovelStore();
  const novelId = propNovelId || activeNovel?.id || '';
  const [activeTab, setActiveTab] = useState<'CANON_FACTS' | 'CHARACTER_STATES' | 'FTS_SEARCH' | 'CURATOR'>('CANON_FACTS');

  // --- CANON FACTS STATE ---
  const [facts, setFacts] = useState<CanonFact[]>([]);
  const [factSearchQuery, setFactSearchQuery] = useState('');
  const [showAddFact, setShowAddFact] = useState(false);
  const [factSubject, setFactSubject] = useState('');
  const [factPredicate, setFactPredicate] = useState('');
  const [factObject, setFactObject] = useState('');
  const [factAuthority, setFactAuthority] = useState<'CANON' | 'CONFIRMED_PLOT' | 'HYPOTHESIS'>('CANON');

  // --- CHARACTER STATES STATE ---
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [stateEvents, setStateEvents] = useState<CharacterStateEvent[]>([]);
  const [showAddState, setShowAddState] = useState(false);
  const [stateField, setStateField] = useState('境界修为');
  const [statePrev, setStatePrev] = useState('');
  const [stateNew, setStateNew] = useState('');
  const [stateTime, setStateTime] = useState('');

  // --- FTS5 SEARCH STATE ---
  const [ftsQuery, setFtsQuery] = useState('');
  const [ftsResults, setFtsResults] = useState<Array<[string, string, string]>>([]);
  const [isSearchingFts, setIsSearchingFts] = useState(false);

  // --- MEMORY CURATOR STATE ---
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCuratorChapterId, setSelectedCuratorChapterId] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [curatorResult, setCuratorResult] = useState<ExtractChapterMemoryResult | null>(null);

  const loadData = useCallback(async () => {
    if (!novelId) return;
    try {
      const [fList, cList, chList] = await Promise.all([
        api.listCanonFacts(novelId, factSearchQuery.trim() || undefined),
        api.listCharacters(novelId),
        api.listChapters(novelId),
      ]);
      setFacts(fList);
      setCharacters(cList);
      setChapters(chList);

      if (cList.length > 0 && !selectedCharId) {
        setSelectedCharId(cList[0].id);
      }
      if (chList.length > 0 && !selectedCuratorChapterId) {
        setSelectedCuratorChapterId(chList[0].id);
      }
    } catch (e) {
      console.error('加载记忆库数据失败:', e);
    }
  }, [novelId, factSearchQuery, selectedCharId, selectedCuratorChapterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load state events when selected character changes
  useEffect(() => {
    if (selectedCharId) {
      api.listCharacterStateEvents(selectedCharId).then((evs) => {
        setStateEvents(evs);
      });
    }
  }, [selectedCharId]);

  // Handle Add Fact
  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !factPredicate.trim() || !factObject.trim()) return;

    try {
      await api.createCanonFact({
        novel_id: novelId,
        subject_id: factSubject.trim() || undefined,
        predicate: factPredicate.trim(),
        object_value: factObject.trim(),
        authority_level: factAuthority,
      });
      setFactSubject('');
      setFactPredicate('');
      setFactObject('');
      setShowAddFact(false);
      loadData();
    } catch (err) {
      alert('创建权威事实失败: ' + err);
    }
  };

  const handleDeleteFact = async (id: string) => {
    if (!confirm('确定删除此权威事实吗？')) return;
    try {
      await api.deleteCanonFact(id);
      loadData();
    } catch (err) {
      alert('删除事实失败: ' + err);
    }
  };

  // Handle Add State Event
  const handleAddStateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharId || !stateField.trim() || !stateNew.trim()) return;

    try {
      await api.createCharacterStateEvent({
        character_id: selectedCharId,
        field_name: stateField.trim(),
        previous_value: statePrev.trim() || undefined,
        new_value: stateNew.trim(),
        effective_time: stateTime.trim() || undefined,
      });
      setStatePrev('');
      setStateNew('');
      setStateTime('');
      setShowAddState(false);
      const evs = await api.listCharacterStateEvents(selectedCharId);
      setStateEvents(evs);
    } catch (err) {
      alert('记录状态变更失败: ' + err);
    }
  };

  // Handle FTS Search
  const handleRunFtsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !ftsQuery.trim()) return;
    setIsSearchingFts(true);
    try {
      const res = await api.searchChaptersFts(novelId, ftsQuery.trim());
      setFtsResults(res);
    } catch (err) {
      alert('全文搜索失败: ' + err);
    } finally {
      setIsSearchingFts(false);
    }
  };

  // Handle Memory Curator Extraction
  const handleExtractMemory = async () => {
    if (!selectedCuratorChapterId) return;
    setIsExtracting(true);
    setCuratorResult(null);
    try {
      const res = await api.extractChapterMemory(selectedCuratorChapterId);
      setCuratorResult(res);
      loadData();
    } catch (err) {
      alert('记忆提取失败: ' + err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4efe6] text-[#2b2621] rounded-2xl overflow-hidden border border-[#ded5c4] shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#efe9dc] border-b border-[#ded5c4] shrink-0">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-[#854d0e]" />
          <h2 className="font-serif font-bold text-[#2b2621]">长期记忆引擎与因果追踪 (L0~L4 Memory Engine)</h2>
          <span className="text-xs bg-[#f4efe6] text-[#854d0e] border border-[#ded5c4] px-2.5 py-0.5 rounded-full font-serif font-medium">
            SQLite FTS5 + 权威 Canon 约束
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-[#e5ded0] border border-[#ded5c4] rounded-xl">
          <button
            onClick={() => setActiveTab('CANON_FACTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition ${
              activeTab === 'CANON_FACTS'
                ? 'bg-[#fdfbf7] text-[#854d0e] shadow-xs border border-[#ded5c4]'
                : 'text-[#685f54] hover:text-[#2b2621]'
            }`}
          >
            权威因果事实库 ({facts.length})
          </button>
          <button
            onClick={() => setActiveTab('CHARACTER_STATES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition ${
              activeTab === 'CHARACTER_STATES'
                ? 'bg-[#fdfbf7] text-[#854d0e] shadow-xs border border-[#ded5c4]'
                : 'text-[#685f54] hover:text-[#2b2621]'
            }`}
          >
            角色状态时间轴
          </button>
          <button
            onClick={() => setActiveTab('FTS_SEARCH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition ${
              activeTab === 'FTS_SEARCH'
                ? 'bg-[#fdfbf7] text-[#854d0e] shadow-xs border border-[#ded5c4]'
                : 'text-[#685f54] hover:text-[#2b2621]'
            }`}
          >
            FTS5 记忆检索台
          </button>
          <button
            onClick={() => setActiveTab('CURATOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition ${
              activeTab === 'CURATOR'
                ? 'bg-[#fdfbf7] text-[#854d0e] shadow-xs border border-[#ded5c4]'
                : 'text-[#685f54] hover:text-[#2b2621]'
            }`}
          >
            章节记忆自动提炼
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f4efe6]">
        {/* TAB 1: CANON FACTS */}
        {activeTab === 'CANON_FACTS' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#854d0e] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={factSearchQuery}
                  onChange={(e) => setFactSearchQuery(e.target.value)}
                  placeholder="在 SQLite FTS5 全文索引中即时搜索权威因果事实（如：曲率核心、宗门秘宝）..."
                  className="w-full bg-[#fdfbf7] border border-[#ded5c4] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] shadow-2xs"
                />
              </div>

              <button
                onClick={() => setShowAddFact(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-xl text-xs font-serif font-medium transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                新增权威事实
              </button>
            </div>

            {facts.length === 0 ? (
              <div className="py-16 text-center text-[#786f65] border border-dashed border-[#ded5c4] rounded-2xl bg-[#fdfbf7]/60">
                <Database className="w-10 h-10 text-[#854d0e] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-serif">暂无因果事实记录。完成章节创作后可通过“章节记忆提炼”自动提取沉淀！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {facts.map((fact) => (
                  <div
                    key={fact.id}
                    className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] hover:border-[#854d0e]/60 transition-all shadow-2xs flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f7f2e7] text-[#854d0e] border border-[#ded5c4]">
                          {fact.authority_level} · {fact.truth_scope}
                        </span>
                        <button
                          onClick={() => handleDeleteFact(fact.id)}
                          className="text-[#a89f91] hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-sm font-serif font-bold text-[#2b2621] flex items-center gap-1.5 flex-wrap">
                        {fact.subject_id && (
                          <span className="text-[#854d0e] font-bold">【{fact.subject_id}】</span>
                        )}
                        <span className="text-[#52493d]">{fact.predicate}</span>
                        <span className="text-[#047857] font-bold">【{fact.object_value}】</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#786f65] pt-2 border-t border-[#ded5c4]/60 flex items-center justify-between font-serif">
                      <span>沉淀于 {new Date(fact.created_at).toLocaleDateString()}</span>
                      <span className="text-[#854d0e]">版本 v{fact.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHARACTER STATE EVOLUTION */}
        {activeTab === 'CHARACTER_STATES' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto h-full">
            {/* Left Character Selector */}
            <div className="md:col-span-1 bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl p-4 space-y-2 shadow-2xs">
              <h3 className="text-xs font-serif font-bold text-[#854d0e] mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#854d0e]" />
                选择角色
              </h3>
              <div className="space-y-1">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-serif font-medium transition flex items-center justify-between ${
                      selectedCharId === c.id
                        ? 'bg-[#854d0e] text-[#fdfbf7] shadow-xs'
                        : 'text-[#4a4237] hover:bg-[#efe9dc]'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-75 truncate max-w-[70px]">{c.aliases}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Evolution Timeline */}
            <div className="md:col-span-3 bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl p-5 space-y-4 flex flex-col shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#ded5c4]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#854d0e]" />
                  <span className="font-serif font-bold text-[#2b2621] text-sm">
                    动态状态变更时间线 ({stateEvents.length} 次演变)
                  </span>
                </div>
                <button
                  onClick={() => setShowAddState(true)}
                  disabled={!selectedCharId}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-lg text-xs font-serif font-medium transition shadow-xs disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  手动登记状态流转
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {stateEvents.length === 0 ? (
                  <div className="py-16 text-center text-[#786f65] text-xs font-serif border border-dashed border-[#ded5c4] rounded-xl bg-[#f7f2e7]/40">
                    该角色暂无状态演变记录。随着章节创作推进，人物心境、修为突破与伤病将在此自动时间线沉淀。
                  </div>
                ) : (
                  stateEvents.map((ev, index) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-[#f7f2e7] border border-[#ded5c4] flex items-start gap-3 relative"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#efe9dc] border border-[#ded5c4] flex items-center justify-center text-xs font-serif font-bold text-[#854d0e] shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-serif font-bold text-[#854d0e]">
                            【{ev.field_name}】
                          </span>
                          <span className="text-[11px] text-[#786f65] font-serif">
                            {ev.effective_time || new Date(ev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#2b2621] mt-1">
                          {ev.previous_value && (
                            <>
                              <span className="text-[#786f65] line-through">{ev.previous_value}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#a89f91] shrink-0" />
                            </>
                          )}
                          <span className="text-[#047857] font-semibold">{ev.new_value}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FTS5 RETRIEVAL BENCH */}
        {activeTab === 'FTS_SEARCH' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] text-xs text-[#2b2621] shadow-2xs">
              <div className="font-serif font-bold text-[#854d0e] mb-1 flex items-center gap-1.5 text-sm">
                <Search className="w-4 h-4 text-[#854d0e]" />
                L4 历史检索型记忆 (SQLite FTS5 Full-text Search Bench)
              </div>
              <p className="text-[12px] text-[#52493d] leading-relaxed font-serif">
                长篇小说随着章节推移，历史细节极易遗忘。此测试台直观检验 SQLite FTS5 对历史章节正文及伏笔线索的毫秒级全文索引检索能力。
              </p>
            </div>

            <form onSubmit={handleRunFtsSearch} className="flex gap-2">
              <input
                type="text"
                value={ftsQuery}
                onChange={(e) => setFtsQuery(e.target.value)}
                placeholder="输入检索线索或实体（如：反物质引擎、玉佩、藏经阁、重力井）..."
                className="flex-1 bg-[#fdfbf7] border border-[#ded5c4] rounded-xl px-4 py-2 text-xs text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] shadow-2xs"
              />
              <button
                type="submit"
                disabled={isSearchingFts || !ftsQuery.trim()}
                className="px-5 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-40"
              >
                <Search className="w-3.5 h-3.5" />
                执行 FTS5 检索
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {ftsResults.length === 0 ? (
                <div className="py-16 text-center text-[#786f65] text-xs font-serif border border-dashed border-[#ded5c4] rounded-xl bg-[#fdfbf7]/60">
                  输入关键词并点击检索，查看 FTS5 全文索引匹配的命中片段
                </div>
              ) : (
                ftsResults.map(([chId, title, snippet], idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] hover:border-[#854d0e]/60 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-[#2b2621] text-sm">《{title}》</span>
                      <span className="text-[11px] text-[#854d0e] bg-[#f7f2e7] px-2 py-0.5 rounded border border-[#ded5c4] font-serif">
                        章节 ID: {chId.slice(0, 8)}...
                      </span>
                    </div>
                    <div
                      className="text-xs text-[#2b2621] font-serif leading-relaxed bg-[#f7f2e7] p-3 rounded-lg border border-[#ded5c4]"
                      dangerouslySetInnerHTML={{ __html: snippet }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEMORY CURATOR EXTRACTION */}
        {activeTab === 'CURATOR' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex-1">
                <label className="text-xs font-serif font-bold text-[#2b2621] block mb-1">
                  选择待提炼记忆的定稿章节
                </label>
                <select
                  value={selectedCuratorChapterId}
                  onChange={(e) => setSelectedCuratorChapterId(e.target.value)}
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e]"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      第 {ch.chapter_number} 章《{ch.title}》({ch.word_count} 字)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-5">
                <button
                  onClick={handleExtractMemory}
                  disabled={isExtracting || !selectedCuratorChapterId}
                  className="px-5 py-2.5 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-xl text-xs font-serif font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-40"
                >
                  <Sparkles className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                  启动 Memory Curator 事实提炼
                </button>
              </div>
            </div>

            {curatorResult && (
              <div className="space-y-4 pt-2">
                {/* Chapter Summary */}
                <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] space-y-1 shadow-2xs">
                  <div className="text-xs font-serif font-bold text-[#854d0e]">本章核心事实摘要：</div>
                  <p className="text-sm text-[#2b2621] font-serif leading-relaxed">
                    {curatorResult.chapter_summary}
                  </p>
                </div>

                {/* State Events */}
                {curatorResult.character_state_events.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-2xs">
                    <div className="text-xs font-serif font-bold text-[#2b2621]">
                      识别到的人物状态流转 ({curatorResult.character_state_events.length})：
                    </div>
                    <div className="space-y-1.5">
                      {curatorResult.character_state_events.map((ev, i) => (
                        <div key={i} className="text-xs text-[#2b2621] flex items-center gap-2 font-serif">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                          <span>【{ev.field_name}】:</span>
                          <span className="text-[#047857] font-semibold">{ev.new_value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Canon Facts */}
                {curatorResult.new_canon_facts.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-2xs">
                    <div className="text-xs font-serif font-bold text-[#2b2621]">
                      新增沉淀的因果事实 ({curatorResult.new_canon_facts.length})：
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {curatorResult.new_canon_facts.map((f, i) => (
                        <div key={i} className="p-2.5 rounded bg-[#f7f2e7] border border-[#ded5c4] text-xs font-serif">
                          <span className="text-[#854d0e] font-bold">【{f.subject_id}】</span>
                          <span className="text-[#52493d] mx-1">{f.predicate}</span>
                          <span className="text-[#047857] font-bold">【{f.object_value}】</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Fact */}
      {showAddFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-serif font-bold text-[#2b2621] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#854d0e]" />
              新增权威事实 (Canon Fact)
            </h3>

            <form onSubmit={handleAddFact} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  主语 (Subject，如：角色/阵营/神器/地点)
                </label>
                <input
                  type="text"
                  value={factSubject}
                  onChange={(e) => setFactSubject(e.target.value)}
                  placeholder="例如：先驱者号 / 青云门 / 李观棋"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  关系 / 行为谓语 (Predicate) *
                </label>
                <input
                  type="text"
                  required
                  value={factPredicate}
                  onChange={(e) => setFactPredicate(e.target.value)}
                  placeholder="例如：掌握了 / 隐藏着 / 敌对于"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  客体 / 状态事实 (Object) *
                </label>
                <input
                  type="text"
                  required
                  value={factObject}
                  onChange={(e) => setFactObject(e.target.value)}
                  placeholder="例如：第三号反物质曲率核心技术"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">权威分级</label>
                <select
                  value={factAuthority}
                  onChange={(e: any) => setFactAuthority(e.target.value)}
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] focus:outline-hidden focus:border-[#854d0e]"
                >
                  <option value="CANON">CANON (绝对真理/铁律)</option>
                  <option value="CONFIRMED_PLOT">CONFIRMED_PLOT (已发生剧情确证)</option>
                  <option value="HYPOTHESIS">HYPOTHESIS (传闻或待求证假设)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ded5c4]">
                <button
                  type="button"
                  onClick={() => setShowAddFact(false)}
                  className="px-4 py-2 text-xs font-serif font-medium text-[#685f54] hover:text-[#2b2621]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium rounded-lg shadow-xs"
                >
                  确认保存事实
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add State Event */}
      {showAddState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-serif font-bold text-[#2b2621] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#854d0e]" />
              登记角色动态状态变更
            </h3>

            <form onSubmit={handleAddStateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">变更维度 *</label>
                <input
                  type="text"
                  required
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                  placeholder="例如：心理状态 / 境界修为 / 持有道具 / 伤病"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  变更前状态 (可选)
                </label>
                <input
                  type="text"
                  value={statePrev}
                  onChange={(e) => setStatePrev(e.target.value)}
                  placeholder="例如：筑基中期"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">
                  变更后新状态 *
                </label>
                <input
                  type="text"
                  required
                  value={stateNew}
                  onChange={(e) => setStateNew(e.target.value)}
                  placeholder="例如：突破至金丹初期，本命剑器已成"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-medium text-[#685f54] mb-1">故事时间 (可选)</label>
                <input
                  type="text"
                  value={stateTime}
                  onChange={(e) => setStateTime(e.target.value)}
                  placeholder="例如：大比前夕、雨夜"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-sm text-[#2b2621] placeholder-[#a89f91] focus:outline-hidden focus:border-[#854d0e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ded5c4]">
                <button
                  type="button"
                  onClick={() => setShowAddState(false)}
                  className="px-4 py-2 text-xs font-serif font-medium text-[#685f54] hover:text-[#2b2621]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium rounded-lg shadow-xs"
                >
                  登记状态演变
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
