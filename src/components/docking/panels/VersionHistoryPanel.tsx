import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import type { ChapterVersion } from '@/types';
import { confirmDialog } from '@/utils/dialog';
import {
  History,
  RotateCcw,
  Clock,
  Sparkles,
  User,
  Check,
} from 'lucide-react';

export const VersionHistoryPanel: React.FC = () => {
  const { versions, activeChapter, restoreVersion, acceptProposal } = useNovelStore(
    useShallow((s) => ({
      versions: s.versions,
      activeChapter: s.activeChapter,
      restoreVersion: s.restoreVersion,
      acceptProposal: s.acceptProposal,
    }))
  );
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(
    versions.length > 0 ? versions[0] : null
  );
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const handleRestore = async (version: ChapterVersion) => {
    if (
      await confirmDialog(
        `确定要将第 ${activeChapter?.chapter_number} 章回退到版本 V${version.version_number} 吗？当前正文也将自动保存为新快照。`
      )
    ) {
      await restoreVersion(version);
      setRestoredId(version.id);
      setTimeout(() => setRestoredId(null), 2000);
    }
  };

  const handleAcceptProposal = async (version: ChapterVersion) => {
    if (
      await confirmDialog(
        `确定要采纳外部 Agent 提交的第 V${version.version_number} 版候选草稿，并将其生效为当前章节正文吗？`
      )
    ) {
      await acceptProposal(version);
      setRestoredId(version.id);
      setTimeout(() => setRestoredId(null), 2000);
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
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-primary border border-amber-500/20 flex items-center gap-1 font-medium">
            <RotateCcw className="w-2.5 h-2.5" />
            因果回滚
          </span>
        );
      case 'AI_APPEND':
      case 'AI_REPLACE':
      case 'AI_GENERATED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-800 border border-purple-500/20 flex items-center gap-1 font-medium">
            <Sparkles className="w-2.5 h-2.5" />
            AI 创作
          </span>
        );
      case 'RESTORE_VERSION':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-primary border border-amber-500/20 flex items-center gap-1 font-medium">
            <RotateCcw className="w-2.5 h-2.5" />
            版本回退
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-ink-2 border border-line flex items-center gap-1 font-medium">
            <User className="w-2.5 h-2.5" />
            手动编辑
          </span>
        );
    }
  };

  if (!activeChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-2 p-6 text-center">
        请在章节目录中选择一个章节以查看历史版本
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-surface text-ink text-xs divide-x divide-[#ded5c4]">
      {/* Left: Version snapshots list */}
      <div className="w-64 flex flex-col shrink-0 bg-surface-2">
        <div className="p-2.5 border-b border-line bg-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <History className="w-3.5 h-3.5 text-primary" />
            <span>版本列表 ({versions.length})</span>
          </div>
          <span className="text-[10px] font-mono text-ink-2">
            第 {activeChapter.chapter_number} 章
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-ink-2">
              <Clock className="w-6 h-6 mx-auto mb-1 opacity-40 text-primary" />
              <p className="text-[11px]">暂无历史快照</p>
            </div>
          ) : (
            versions.map((ver) => {
              const isSelected = (selectedVersion?.id || versions[0]?.id) === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-2 rounded cursor-pointer transition border ${
                    isSelected
                      ? 'bg-surface border-amber-800/40 shadow-xs'
                      : 'border-transparent hover:bg-surface-3'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-primary">
                      V{ver.version_number}
                    </span>
                    {getSourceBadge(ver.source_type)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-2">
                    <span>{ver.created_by || '作者'}</span>
                    <span className="font-mono">
                      {new Date(ver.created_at * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Version details & preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {selectedVersion ? (
          <>
            <div className="p-2.5 border-b border-line bg-surface-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-ink">
                  版本快照 V{selectedVersion.version_number}
                </span>
                <span className="ml-2 text-[11px] font-mono text-ink-2">
                  字数: {selectedVersion.content?.replace(/\s+/g, '').length || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedVersion.source_type === 'AI_PROPOSAL' && (
                  <button
                    onClick={() => handleAcceptProposal(selectedVersion)}
                    className="px-2.5 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 font-medium transition flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    采纳此提案
                  </button>
                )}
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs"
                >
                  {restoredId === selectedVersion.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300" />
                      已生效
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      回退到此版本
                    </>
                  )}
                </button>
              </div>
            </div>

            {selectedVersion.source_type === 'AI_PROPOSAL' && selectedVersion.created_by && selectedVersion.created_by !== 'agent' && (
              <div className="mx-3 mt-2 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] text-emerald-900 dark:text-emerald-200">
                <span className="font-bold mr-1">🤖 Agent 修订意图与思考链：</span>
                {selectedVersion.created_by}
              </div>
            )}

            <div className="flex-1 p-3 overflow-y-auto font-serif text-[13px] leading-relaxed text-ink whitespace-pre-wrap select-text bg-[#fcfaf5]">
              {selectedVersion.content || '(空内容)'}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-2">
            请在左侧选择版本快照进行对比预览
          </div>
        )}
      </div>
    </div>
  );
};
