import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ReviewReport } from '@/types';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  FileText,
} from 'lucide-react';

export const ReviewReportPanel: React.FC = () => {
  const { activeChapter } = useNovelStore();
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReport = async () => {
    if (!activeChapter) return;
    try {
      const rep = await api.getLatestReviewReport(activeChapter.id);
      setReport(rep);
    } catch (e) {
      console.error('加载审稿报告失败:', e);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeChapter?.id]);

  const handleRunAudit = async () => {
    if (!activeChapter) return;
    setIsAuditing(true);
    setMessage('逻辑审稿 Agent 正在全面质检正文因果与 Canon 规则...');
    try {
      const rep = await api.runContinuityAudit(activeChapter.id);
      setReport(rep);
      setMessage(`审稿完成！质检得分：${rep.score} 分`);
    } catch (e) {
      setMessage(`审稿失败: ${e}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-800/10 text-red-800 border border-red-800/30 font-bold">
            严重矛盾 (CRITICAL)
          </span>
        );
      case 'MAJOR':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-amber-800 border border-amber-800/30 font-bold">
            主要瑕疵 (MAJOR)
          </span>
        );
      case 'MINOR':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-800/10 text-blue-800 border border-blue-800/30 font-medium">
            轻微出入 (MINOR)
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-800/10 text-emerald-800 border border-emerald-800/30 font-medium">
            润色建议 (SUGGESTION)
          </span>
        );
    }
  };

  if (!activeChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择小说章节以查看逻辑审稿报告
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f4efe6] text-[#2c2825] text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-2 border-b border-[#ded5c4] bg-[#efe9dc] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-xs">
            逻辑审稿质检报告（第 {activeChapter.chapter_number} 章）
          </span>
        </div>
        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium transition flex items-center gap-1 shadow-xs text-[11px] disabled:opacity-40"
        >
          {isAuditing ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin" />
              全面质检中...
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              执行逻辑一致性质检
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="px-3 py-1.5 bg-amber-800/10 text-amber-900 border-b border-amber-800/20 text-[11px] font-medium">
          {message}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!report ? (
          <div className="py-12 text-center text-[#786f65]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-800" />
            <p>本章暂无审稿报告，点击右上角【执行逻辑一致性质检】启动审核</p>
          </div>
        ) : (
          <>
            {/* Score card */}
            <div className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#786f65] font-medium">
                  版本快照 V{report.version_number} 一致性评分
                </div>
                <div className="text-xl font-bold text-[#854d0e] mt-0.5">
                  {report.score} / 100
                </div>
              </div>
              <p className="text-[11px] text-[#554b3e] max-w-sm font-serif leading-relaxed">
                {report.summary}
              </p>
            </div>

            {/* Findings list */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#554b3e]">
                体检发现与修订建议 ({report.findings.length})
              </h4>
              {report.findings.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-800/10 border border-emerald-800/20 text-emerald-900 text-center font-medium">
                  🎉 本章未检测出与设定冲突的逻辑矛盾，情节因果严密自洽！
                </div>
              ) : (
                report.findings.map((f) => (
                  <div
                    key={f.id}
                    className="bg-[#fdfbf7] border border-[#dcd3c1] rounded-lg p-3 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#854d0e]">{f.title}</span>
                      {getSeverityBadge(f.severity)}
                    </div>
                    <p className="text-[11px] text-[#4b4337] font-serif leading-relaxed">
                      {f.description}
                    </p>
                    {f.evidence_quote && (
                      <div className="p-2 rounded bg-[#f7f2e7] border-l-2 border-amber-800 font-serif text-[11px] text-[#6b583f] italic">
                        “{f.evidence_quote}”
                      </div>
                    )}
                    {f.suggestion && (
                      <div className="text-[11px] text-[#854d0e] font-serif font-medium">
                        <strong>修改建议：</strong>{f.suggestion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
