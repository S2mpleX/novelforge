import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  Sparkles,
  X,
  Plus,
  Check,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AssetProposalEngine } from '@/features/proposals/AssetProposalEngine';
import { AssetProposal } from '@/features/proposals/types';
import { alertDialog } from '@/utils/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const AssetProposalModal: React.FC<Props> = ({ isOpen, onClose, embedded = false }) => {
  const { activeNovel, activeChapter, chapters } = useNovelStore();
  const [proposals, setProposals] = useState<AssetProposal[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'ALL'>('PENDING');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  if (!isOpen && !embedded) return null;

  const handleScan = async () => {
    if (!activeChapter || !activeNovel) return;
    setIsScanning(true);

    try {
      const [characters, worldRules] = await Promise.all([
        api.listCharacters(activeNovel.id).catch(() => []),
        api.listWorldRules(activeNovel.id).catch(() => []),
      ]);

      const found = AssetProposalEngine.scanChapterProposals({
        chapterId: activeChapter.id,
        chapterTitle: activeChapter.title,
        content: activeChapter.content || '',
        existingCharacters: characters,
        existingRules: worldRules,
      });

      setProposals(found);
    } catch (e) {
      console.error('扫描反哺提案失败:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanAllChapters = async () => {
    if (!activeNovel || !chapters.length) return;
    setIsScanning(true);

    try {
      const [characters, worldRules] = await Promise.all([
        api.listCharacters(activeNovel.id).catch(() => []),
        api.listWorldRules(activeNovel.id).catch(() => []),
      ]);

      let allFound: AssetProposal[] = [];
      chapters.forEach((ch) => {
        const list = AssetProposalEngine.scanChapterProposals({
          chapterId: ch.id,
          chapterTitle: ch.title,
          content: ch.content || '',
          existingCharacters: characters,
          existingRules: worldRules,
        });
        allFound = [...allFound, ...list];
      });

      // 依据品类与名称去重，杜绝不同分类间同名实体误吞
      const map = new Map<string, AssetProposal>();
      allFound.forEach((p) => {
        const key = `${p.category}:${p.name}`;
        if (!map.has(key)) {
          map.set(key, p);
        }
      });

      setProposals(Array.from(map.values()));
    } catch (e) {
      console.error('全书扫描反哺提案失败:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAccept = async (proposal: AssetProposal) => {
    if (!activeNovel) return;
    setAcceptingId(proposal.id);

    try {
      await AssetProposalEngine.acceptProposal(proposal, activeNovel.id);

      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'ACCEPTED' } : p))
      );

      setSuccessFeedback(`已成功采纳并收录【${proposal.name}】至设定档案！`);
      window.dispatchEvent(
        new CustomEvent('novelforge:reload-story-bible', {
          detail: { category: proposal.category, novelId: activeNovel.id },
        })
      );
      setTimeout(() => setSuccessFeedback(null), 3000);
    } catch (e: any) {
      await alertDialog(`采纳失败: ${e.message || e}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDismiss = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'DISMISSED' } : p))
    );
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === 'PENDING') return p.status === 'PENDING';
    if (activeTab === 'ACCEPTED') return p.status === 'ACCEPTED';
    return true;
  });

  const pendingCount = proposals.filter((p) => p.status === 'PENDING').length;
  const acceptedCount = proposals.filter((p) => p.status === 'ACCEPTED').length;

  const innerContent = (
    <div className={`w-full ${embedded ? 'h-full rounded-none border-0' : 'max-w-4xl h-[86vh] rounded-2xl border border-line dark:border-[#2e2a27] shadow-2xl animate-in fade-in zoom-in-95 duration-200'} bg-surface dark:bg-[#1a1714] flex flex-col overflow-hidden`}>
      {/* 顶部标题栏 */}
      <div className="px-5 py-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
              正文资产反哺提案 (Asset Proposals)
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-primary dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                写正文即建世界观
              </span>
            </h2>
            <p className="text-[11px] text-ink-2 dark:text-stone-400">
              扫描正文中随手写出的野生新人名、宗门势力、功法招式与灵宝法宝，一键采纳收录至世界观设定库 (Story Bible)
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#ded5c4]/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* 扫描控制条 */}
        <div className="p-4 border-b border-line dark:border-[#2e2a27] bg-[#faf5ec]/50 dark:bg-[#181513]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleScan}
              disabled={isScanning || !activeChapter}
              className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>扫描当前章节 ({activeChapter?.title || '未选章节'})</span>
            </button>

            <button
              onClick={handleScanAllChapters}
              disabled={isScanning || !chapters.length}
              className="px-3.5 py-1.5 rounded-xl border border-line dark:border-[#38332e] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>全书多章扫描 ({chapters.length} 章)</span>
            </button>
          </div>

          {/* Tab 过滤 */}
          <div className="flex items-center bg-stone-200/60 dark:bg-stone-800/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'PENDING'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              待采纳 ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('ACCEPTED')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'ACCEPTED'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              已采纳入库 ({acceptedCount})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'ALL'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              全部 ({proposals.length})
            </button>
          </div>
        </div>

        {/* 采纳成功通知 */}
        {successFeedback && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successFeedback}
            </span>
          </div>
        )}

        {/* 提案卡片网格列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface dark:bg-[#1a1714]">
          {filteredProposals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProposals.map((proposal) => {
                const isAccepted = proposal.status === 'ACCEPTED';
                const isDismissed = proposal.status === 'DISMISSED';

                return (
                  <div
                    key={proposal.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      isAccepted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                        : isDismissed
                        ? 'bg-stone-100/50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800 opacity-60'
                        : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e] shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* 卡片头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              proposal.category === 'CHARACTER'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : proposal.category === 'FACTION'
                                ? 'bg-amber-100 text-primary dark:bg-amber-950 dark:text-amber-300'
                                : proposal.category === 'TECHNIQUE'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {proposal.categoryLabel}
                          </span>
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                            {proposal.name}
                          </span>
                        </div>

                        {isAccepted && (
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            已入库
                          </span>
                        )}
                      </div>

                      {/* 摘要与出处 */}
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-serif mb-2">
                        {proposal.summary}
                      </p>

                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/60 text-[11px] font-serif text-stone-600 dark:text-stone-400 mb-3">
                        <span className="text-[10px] text-stone-400 block mb-0.5">
                          原文出处 ({proposal.sourceChapterTitle})：
                        </span>
                        “{proposal.contextSentence}”
                      </div>
                    </div>

                    {/* 底部动作 */}
                    <div className="flex items-center justify-between pt-2 border-t border-line/60 dark:border-[#2e2a27]">
                      <span className="text-[10px] text-stone-400">
                        置信度: {(proposal.confidence * 100).toFixed(0)}%
                      </span>

                      {!isAccepted && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDismiss(proposal.id)}
                            className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 transition cursor-pointer"
                          >
                            忽略
                          </button>
                          <button
                            onClick={() => handleAccept(proposal)}
                            disabled={acceptingId === proposal.id}
                            className="px-3 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{acceptingId === proposal.id ? '正在入库...' : '一键采纳'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-stone-400 space-y-3">
              <Sparkles className="w-12 h-12 opacity-30 text-primary" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                暂无待处理反哺提案
              </p>
              <p className="text-xs text-stone-400 max-w-md text-center">
                点击上方【扫描当前章节】或【全书多章扫描】，系统将自动提炼正文中尚未登记的野生新人名、宗门势力与功法法宝！
              </p>
            </div>
          )}
        </div>
      </div>
    );

  if (embedded) {
    return <div className="w-full h-full select-none font-sans">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      {innerContent}
    </div>
  );
};
