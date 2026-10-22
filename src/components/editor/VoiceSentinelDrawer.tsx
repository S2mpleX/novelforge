import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import { useNovelStore } from '../../stores/useNovelStore';
import { toast } from '../../stores/useToastStore';
import { api } from '../../utils/tauriBridge';
import { VoiceSentinelEngine, type VoiceSentinelIssue } from '../../utils/voiceSentinel';
import type { VoiceProfile } from '../../types';

interface VoiceSentinelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterText: string;
  onReplaceText: (target: string, replacement: string) => void;
  onBatchReplaceText: (replacements: Array<{ target: string; replacement: string }>) => void;
}

export const VoiceSentinelDrawer: React.FC<VoiceSentinelDrawerProps> = ({
  isOpen,
  onClose,
  chapterText,
  onReplaceText,
  onBatchReplaceText,
}) => {
  const { activeNovel } = useNovelStore();
  const [activeVoiceProfile, setActiveVoiceProfile] = useState<VoiceProfile | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SUGGESTION'>('ALL');

  // 加载当前活跃文风
  useEffect(() => {
    if (!activeNovel) return;
    api
      .listVoiceProfiles(activeNovel.id)
      .then((profiles) => {
        const active = profiles.find((p) => p.is_active);
        setActiveVoiceProfile(active || null);
      })
      .catch(() => {});
  }, [activeNovel?.id]);

  // 实时运算文风巡检报告
  const report = useMemo(() => {
    return VoiceSentinelEngine.auditText(
      chapterText,
      activeNovel?.genre_profile || '仙侠',
      activeVoiceProfile
    );
  }, [chapterText, activeNovel?.genre_profile, activeVoiceProfile]);

  if (!isOpen) return null;

  const filteredIssues = report.issues.filter((issue) => {
    if (filterType === 'ALL') return true;
    return issue.severity === filterType;
  });

  // 单处采纳替换
  const handleApplySingle = (issue: VoiceSentinelIssue) => {
    onReplaceText(issue.target_text, issue.replacement);
    toast.success(
      '文风对齐替换',
      `已将「${issue.target_text}」替换为「${issue.replacement || '（已移除）'}」`
    );
  };

  // 一键全部采纳
  const handleApplyAll = () => {
    const validReplacements = report.issues
      .filter((i) => i.replacement !== undefined)
      .map((i) => ({ target: i.target_text, replacement: i.replacement }));

    if (validReplacements.length === 0) return;

    onBatchReplaceText(validReplacements);
    toast.success(
      '批量清洗完成',
      `已一键规范化替换 ${validReplacements.length} 处文风违和词汇！`
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90)
      return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    if (score >= 70)
      return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-[#fdfbf7] dark:bg-[#1a1714] text-[#2c241c] dark:text-[#dfdbd0] shadow-2xl border-l border-[#e7e1d5] dark:border-[#38332c] flex flex-col font-serif transition-transform duration-200">
      {/* 顶栏 Header */}
      <div className="h-14 px-5 border-b border-[#e7e1d5] dark:border-[#38332c] flex items-center justify-between bg-[#f7f2e7]/80 dark:bg-[#231f1a]/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2c241c] dark:text-[#efe9dc]">
                行文文风监护与防串味巡检
              </h3>
              <span
                className={`px-2 py-0.5 text-[11px] font-sans rounded-full border font-bold ${getScoreColor(
                  report.score
                )}`}
              >
                {report.score} 分
              </span>
            </div>
            <p className="text-[11px] text-[#8c8275] dark:text-[#9e9587] truncate max-w-xs font-sans">
              活跃文风：{report.profileName} ｜ 题材：{report.genre}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-800 text-[#8c8275] transition-colors cursor-pointer"
          title="关闭 (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 摘要与一键清洗栏 */}
      <div className="px-5 py-2.5 border-b border-[#e7e1d5] dark:border-[#38332c] bg-[#faf6ee] dark:bg-[#201c18] flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-sans text-stone-600 dark:text-stone-400">
          <span>发现</span>
          <strong className="text-amber-800 dark:text-amber-300 font-bold">
            {report.issues.length}
          </strong>
          <span>处串味违和 / 翻译腔词汇</span>
        </div>

        {report.issues.length > 0 && (
          <button
            onClick={handleApplyAll}
            className="px-2.5 py-1 text-xs font-sans rounded-md bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 font-medium cursor-pointer shadow-xs transition-all"
            title="一键将全部有建议替换词的违和处完成清洗"
          >
            <Sparkles className="w-3.5 h-3.5" />
            一键全部清洗对齐
          </button>
        )}
      </div>

      {/* 筛选标签条 */}
      <div className="px-5 py-2 border-b border-[#e7e1d5] dark:border-[#38332c] flex items-center gap-1.5 text-xs font-sans bg-white/40 dark:bg-stone-900/40">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-amber-800 text-white font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          全部 ({report.issues.length})
        </button>
        <button
          onClick={() => setFilterType('WARNING')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
            filterType === 'WARNING'
              ? 'bg-amber-800 text-white font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          网络烂梗 ({report.issues.filter((i) => i.severity === 'WARNING').length})
        </button>
        <button
          onClick={() => setFilterType('SUGGESTION')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
            filterType === 'SUGGESTION'
              ? 'bg-amber-800 text-white font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          翻译腔/赘词 ({report.issues.filter((i) => i.severity === 'SUGGESTION').length})
        </button>
      </div>

      {/* 问题清单列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#2c241c] dark:text-[#efe9dc] mb-1">
              文风清纯自洽！
            </h4>
            <p className="text-xs text-[#8c8275] dark:text-[#9e9587] max-w-xs mx-auto font-sans leading-relaxed">
              当前正文中未检出出戏流行梗、职场黑话或违背当前文风的违和表达。
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            return (
              <div
                key={issue.id}
                className="p-3 rounded-lg border border-[#e7e1d5] dark:border-[#38332c] bg-white/80 dark:bg-[#1f1b17]/80 hover:shadow-xs transition-all space-y-2 text-xs"
              >
                {/* 顶栏：词汇与类型 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/50">
                      {issue.target_text}
                    </span>
                    <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {issue.type === 'OUT_OF_GENRE'
                        ? '出戏网络梗'
                        : issue.type === 'TRANSLATIONESE'
                        ? '欧化翻译腔'
                        : '文风法则'}
                    </span>
                  </div>

                  {issue.replacement && (
                    <button
                      onClick={() => handleApplySingle(issue)}
                      className="px-2 py-0.5 text-[11px] font-sans rounded bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 font-medium cursor-pointer transition-all shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      对齐替换
                    </button>
                  )}
                </div>

                {/* 上下文语境 */}
                <div className="font-serif text-[#443c33] dark:text-[#d5cfc4] leading-relaxed bg-[#f9f6f0] dark:bg-[#161412] p-2 rounded border border-[#ebe5da] dark:border-[#2d2822]">
                  …
                  {issue.context_snippet.split(issue.target_text).map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      {part}
                      {idx < arr.length - 1 && (
                        <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold px-0.5 rounded">
                          {issue.target_text}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                  …
                </div>

                {/* 诊断原因与替换建议 */}
                <div className="flex items-center justify-between font-sans text-[11px] pt-1 gap-2 min-w-0">
                  <span className="text-[#8c8275] dark:text-[#9e9587] truncate min-w-0 flex-1" title={issue.reason}>
                    {issue.reason}
                  </span>

                  {issue.replacement && (
                    <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold shrink-0 whitespace-nowrap">
                      <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>建议换为：{issue.replacement}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底栏 */}
      <div className="p-3 border-t border-[#e7e1d5] dark:border-[#38332c] bg-[#f7f2e7]/80 dark:bg-[#231f1a]/80 shrink-0 flex items-center justify-between text-xs font-sans">
        <span className="text-[11px] text-[#8c8275] dark:text-[#9e9587]">
          💡 结合当前作品题材与作者文风档案实时巡检，守护文学沉浸感
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-[#2c241c] dark:text-[#efe9dc] transition-colors cursor-pointer"
        >
          完成
        </button>
      </div>
    </div>
  );
};
