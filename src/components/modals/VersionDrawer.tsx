import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import type { ChapterVersion } from '@/types';
import { confirmDialog } from '@/utils/dialog';
import {
  X,
  History,
  RotateCcw,
  Clock,
  Sparkles,
  User,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const VersionDrawer: React.FC<Props> = ({ onClose }) => {
  const { versions, activeChapter, restoreVersion, acceptProposal } = useNovelStore();
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(
    versions.length > 0 ? versions[0] : null
  );

  const handleRestore = async (version: ChapterVersion) => {
    if (await confirmDialog(`确定要将第 ${activeChapter?.chapter_number} 章回退到版本 V${version.version_number} 吗？当前正文也将自动保存为新版本。`)) {
      await restoreVersion(version);
      onClose();
    }
  };

  const handleAcceptProposal = async (version: ChapterVersion) => {
    if (await confirmDialog(`确定要采纳外部 Agent 提交的第 V${version.version_number} 版候选草稿，并将其生效为当前章节正文吗？`)) {
      await acceptProposal(version);
      onClose();
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'AI_PROPOSAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            Agent 提案
          </span>
        );
      case 'ROLLBACK_RESTORE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" />
            因果回滚
          </span>
        );
      case 'AI_APPEND':
      case 'AI_REPLACE':
      case 'AI_GENERATED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            AI 创作
          </span>
        );
      case 'RESTORE_VERSION':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" />
            版本回退
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            手动编辑
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-xl bg-surface border-l border-line h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-serif font-bold text-ink">
                第 {activeChapter?.chapter_number} 章 · 历史卷宗与版本回溯
              </h2>
              <p className="text-xs text-ink-2 font-serif">
                共记录 {versions.length} 个快照版本，数据均持久化在本地 SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split list & preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List */}
          <div className="w-52 border-r border-line bg-surface overflow-y-auto p-2 space-y-1 shrink-0">
            {versions.map((v) => {
              const isSelected = selectedVersion?.id === v.id;
              const dateStr = new Date(v.created_at).toLocaleTimeString();
              const fullDate = new Date(v.created_at).toLocaleDateString();
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`p-2.5 rounded-lg cursor-pointer transition select-none text-xs font-serif ${
                    isSelected
                      ? 'bg-surface text-primary border border-line shadow-2xs font-semibold'
                      : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink">V{v.version_number}</span>
                    {getSourceBadge(v.source_type)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-ink-2">
                    <Clock className="w-3 h-3" />
                    <span>{fullDate} {dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Version Preview */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-canvas">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
                  <div>
                    <span className="text-xs font-serif font-bold text-ink mr-2">
                      快照 V{selectedVersion.version_number} 预览
                    </span>
                    <span className="text-xs text-ink-2 font-serif">
                      ({selectedVersion.content.length} 字符)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedVersion.source_type === 'AI_PROPOSAL' ? (
                      <button
                        onClick={() => handleAcceptProposal(selectedVersion)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-serif font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        采纳并生效此提案
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleRestore(selectedVersion)}
                      className="px-3 py-1.5 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium flex items-center gap-1.5 transition shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      恢复为此版本
                    </button>
                  </div>
                </div>

                {selectedVersion.source_type === 'AI_PROPOSAL' && selectedVersion.created_by && selectedVersion.created_by !== 'agent' && (
                  <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold mr-1">🤖 Agent 修订意图与思考链：</span>
                    {selectedVersion.created_by}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto bg-surface border border-line rounded-xl p-5 text-xs text-ink whitespace-pre-wrap leading-relaxed font-serif select-text shadow-2xs">
                  {selectedVersion.content || '(本版本内容为空)'}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink-2 text-xs font-serif">
                选择左侧版本查看历史快照
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
