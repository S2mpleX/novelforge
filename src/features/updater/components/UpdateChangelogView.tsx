import React from 'react';
import { StructuredChangelog } from '../types';
import {
  FileText,
  Sparkles,
  Zap,
  Bug,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Calendar,
  Layers,
} from 'lucide-react';

interface Props {
  changelog: StructuredChangelog | null;
  historyList: StructuredChangelog[];
  onSelectVersion: (version: string) => void;
  isLoadingHistory: boolean;
}

export const UpdateChangelogView: React.FC<Props> = ({
  changelog,
  historyList,
  onSelectVersion,
  isLoadingHistory,
}) => {
  if (!changelog) {
    return (
      <div className="p-8 text-center text-ink-2 font-serif bg-surface rounded-xl border border-line">
        <FileText className="w-8 h-8 text-primary/40 mx-auto mb-2" />
        <p className="text-xs">暂无更新日志内容，请点击“检查更新”获取最新说明</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-serif">
      {/* 顶部版本选择栏与元数据 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-ink">版本更新说明：</span>

          {/* 历史版本快速切换 */}
          <select
            value={changelog.version}
            onChange={(e) => onSelectVersion(e.target.value)}
            disabled={isLoadingHistory}
            className="text-xs font-mono font-semibold bg-surface-2 text-primary border border-line rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-[#854d0e] cursor-pointer"
          >
            {historyList.map((item) => (
              <option key={item.version} value={item.version}>
                {item.version} ({item.date})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-ink-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            发布于 {changelog.date}
          </span>

          {changelog.releaseUrl && (
            <a
              href={changelog.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
              title="前往 GitHub Releases 查看官方完整构建与签名产物"
            >
              <span>完整发布说明</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* 版本摘要 */}
      {changelog.summary && (
        <div className="p-3 rounded-lg bg-surface-2/60 border border-line text-xs text-ink leading-relaxed">
          <strong className="text-primary">本版概览：</strong> {changelog.summary}
        </div>
      )}

      {/* 结构化分类列表 */}
      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
        {/* 新增功能 */}
        {changelog.features.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              新增功能 · Features ({changelog.features.length})
            </h4>
            <ul className="space-y-1 pl-5 list-disc text-xs text-ink">
              {changelog.features.map((feat, idx) => (
                <li key={idx} className="leading-relaxed">
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 功能优化 */}
        {changelog.improvements.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              功能优化 · Improvements ({changelog.improvements.length})
            </h4>
            <ul className="space-y-1 pl-5 list-disc text-xs text-ink">
              {changelog.improvements.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bug 修复 */}
        {changelog.bugfixes.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-sky-700" />
              Bug 修复 · Fixes ({changelog.bugfixes.length})
            </h4>
            <ul className="space-y-1 pl-5 list-disc text-xs text-ink">
              {changelog.bugfixes.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 兼容性变更 */}
        {changelog.breakingChanges.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
              兼容性变更 · Breaking Changes ({changelog.breakingChanges.length})
            </h4>
            <ul className="space-y-1 pl-5 list-disc text-xs text-rose-900 bg-rose-50/60 p-2 rounded-lg border border-rose-200">
              {changelog.breakingChanges.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 已知问题 */}
        {changelog.knownIssues.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-ink-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-ink-2" />
              已知问题 · Known Issues ({changelog.knownIssues.length})
            </h4>
            <ul className="space-y-1 pl-5 list-disc text-xs text-ink-2">
              {changelog.knownIssues.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
