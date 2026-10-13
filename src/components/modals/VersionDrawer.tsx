import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import type { ChapterVersion } from '@/types';
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
  const { versions, activeChapter, restoreVersion } = useNovelStore();
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(
    versions.length > 0 ? versions[0] : null
  );

  const handleRestore = async (version: ChapterVersion) => {
    if (confirm(`确定要将第 ${activeChapter?.chapter_number} 章回退到版本 V${version.version_number} 吗？当前正文也将自动保存为新版本。`)) {
      await restoreVersion(version);
      onClose();
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                第 {activeChapter?.chapter_number} 章 历史版本与恢复
              </h2>
              <p className="text-xs text-slate-400">
                共记录 {versions.length} 个快照版本，数据均持久化在本地 SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split list & preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List */}
          <div className="w-52 border-r border-slate-800 overflow-y-auto p-2 space-y-1 shrink-0">
            {versions.map((v) => {
              const isSelected = selectedVersion?.id === v.id;
              const dateStr = new Date(v.created_at).toLocaleTimeString();
              const fullDate = new Date(v.created_at).toLocaleDateString();
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`p-2.5 rounded-lg cursor-pointer transition select-none text-xs ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">V{v.version_number}</span>
                    {getSourceBadge(v.source_type)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{fullDate} {dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Version Preview */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-950/30">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 mr-2">
                      快照 V{selectedVersion.version_number} 预览
                    </span>
                    <span className="text-xs text-slate-500">
                      ({selectedVersion.content.length} 字符)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    恢复为此版本
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800/80 rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-serif select-text">
                  {selectedVersion.content || '(本版本内容为空)'}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                选择左侧版本查看历史快照
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
