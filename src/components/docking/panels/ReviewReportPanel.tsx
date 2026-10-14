import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ReviewReport, FindingRepairResult } from '@/types';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  FileText,
  Sparkles,
  Check,
  X,
  EyeOff,
  Feather,
  Edit3,
} from 'lucide-react';

export const ReviewReportPanel: React.FC = () => {
  const { activeNovel, activeChapter, editorContent, updateEditorContent, saveCurrentChapter } = useNovelStore();
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // V2.3.1 审稿修复闭环状态
  const [repairResults, setRepairResults] = useState<Record<string, FindingRepairResult>>({});
  const [repairLoading, setRepairLoading] = useState<Record<string, boolean>>({});
  const [acceptedFindings, setAcceptedFindings] = useState<Set<string>>(new Set());
  const [ignoredFindings, setIgnoredFindings] = useState<Set<string>>(new Set());
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [isEditingDraft, setIsEditingDraft] = useState<Record<string, boolean>>({});

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
    setRepairResults({});
    setAcceptedFindings(new Set());
    setIgnoredFindings(new Set());
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

  const handleGenerateRepair = async (findingId: string) => {
    if (!activeNovel || !activeChapter) return;
    setRepairLoading((prev) => ({ ...prev, [findingId]: true }));
    try {
      const result = await api.generateFindingRepair({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        finding_id: findingId,
      });
      setRepairResults((prev) => ({ ...prev, [findingId]: result }));
      setEditedDrafts((prev) => ({ ...prev, [findingId]: result.revised_text_draft }));
    } catch (e) {
      console.error('生成修复草案失败:', e);
      setMessage(`修复生成失败: ${e}`);
    } finally {
      setRepairLoading((prev) => ({ ...prev, [findingId]: false }));
    }
  };

  const handleApplyRepair = async (findingId: string) => {
    if (!activeChapter) return;
    const repair = repairResults[findingId];
    if (!repair) return;

    const draftText = (editedDrafts[findingId] || repair.revised_text_draft).trim();
    const currentText = editorContent || activeChapter.content || '';
    const quote = repair.original_quote.trim();

    let newContent = currentText;
    if (quote && currentText.includes(quote)) {
      newContent = currentText.replace(quote, draftText);
    } else {
      // 若原文本已被修改或未完全匹配，在章节末尾补充替换
      newContent = `${currentText}\n\n【审稿修订】${draftText}`;
    }

    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'AUDIT_REPAIR');

    setAcceptedFindings((prev) => new Set([...prev, findingId]));
    setMessage(`已成功将【${repair.finding_title}】的修订草案替换入正文，并已自动生成版本快照！`);
  };

  const handleIgnoreFinding = (findingId: string) => {
    setIgnoredFindings((prev) => new Set([...prev, findingId]));
  };

  const handleDiscardRepair = (findingId: string) => {
    setRepairResults((prev) => {
      const copy = { ...prev };
      delete copy[findingId];
      return copy;
    });
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
        <div className="px-3 py-1.5 bg-amber-800/10 text-amber-900 border-b border-amber-800/20 text-[11px] font-medium flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-amber-800 hover:text-amber-950">
            <X className="w-3 h-3" />
          </button>
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
                report.findings.map((f) => {
                  const isAccepted = acceptedFindings.has(f.id);
                  const isIgnored = ignoredFindings.has(f.id);
                  const repair = repairResults[f.id];
                  const isLoadingRepair = repairLoading[f.id];
                  const isEditing = isEditingDraft[f.id];

                  if (isIgnored) {
                    return (
                      <div
                        key={f.id}
                        className="p-2 rounded bg-[#ebe4d6] border border-[#ded5c4] text-[#8e8579] flex items-center justify-between opacity-60"
                      >
                        <span className="line-through">{f.title} (已忽略)</span>
                        <button
                          onClick={() => setIgnoredFindings((prev) => {
                            const next = new Set(prev);
                            next.delete(f.id);
                            return next;
                          })}
                          className="text-[10px] text-amber-800 hover:underline"
                        >
                          恢复展示
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={f.id}
                      className={`bg-[#fdfbf7] border rounded-lg p-3 space-y-2.5 shadow-xs transition-colors ${
                        isAccepted ? 'border-emerald-700/40 bg-emerald-50/30' : 'border-[#dcd3c1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#854d0e]">{f.title}</span>
                          {isAccepted && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-800/10 text-emerald-800 border border-emerald-800/30 font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> 已采纳替换
                            </span>
                          )}
                        </div>
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

                      {/* V2.3.1 差异修复与草案仲裁卡片 */}
                      {repair && !isAccepted && (
                        <div className="mt-2.5 p-2.5 rounded-md bg-[#f5ede0] border border-amber-800/20 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 font-medium text-amber-900">
                              <Feather className="w-3 h-3 text-amber-800" />
                              <span>文风档案对齐：</span>
                              <span className="px-1.5 py-0.2 bg-amber-800/10 rounded text-amber-800 font-bold">
                                {repair.voice_profile_used}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8e8579]">{repair.diff_summary}</span>
                          </div>

                          {/* 修订文本预览与对比 */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-[#786f65]">
                              <span>修订草案比对（可直接编辑微调）：</span>
                              <button
                                onClick={() => setIsEditingDraft((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
                                className="flex items-center gap-0.5 text-amber-800 hover:underline"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                {isEditing ? '完成微调' : '直接编辑草案'}
                              </button>
                            </div>

                            {isEditing ? (
                              <textarea
                                value={editedDrafts[f.id] ?? repair.revised_text_draft}
                                onChange={(e) =>
                                  setEditedDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                                }
                                rows={3}
                                className="w-full p-2 text-xs rounded border border-amber-800/30 bg-white font-serif focus:outline-none focus:ring-1 focus:ring-amber-800"
                              />
                            ) : (
                              <div className="p-2 rounded bg-white/90 border border-amber-800/15 font-serif text-xs text-[#2c2825] leading-relaxed">
                                {editedDrafts[f.id] ?? repair.revised_text_draft}
                              </div>
                            )}
                          </div>

                          {/* 仲裁按钮栏 */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-800/10">
                            <button
                              onClick={() => handleDiscardRepair(f.id)}
                              className="px-2 py-1 rounded border border-[#ded5c4] bg-[#efe9dc] text-[#554b3e] hover:bg-[#e4dcce] text-[11px] font-medium"
                            >
                              放弃草案
                            </button>
                            <button
                              onClick={() => handleApplyRepair(f.id)}
                              className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              采纳并替换入正文 (留存快照)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 底部功能条 */}
                      {!isAccepted && !repair && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#eee6d7]">
                          <button
                            onClick={() => handleIgnoreFinding(f.id)}
                            className="text-[10px] text-[#8e8579] hover:text-[#554b3e] flex items-center gap-1"
                          >
                            <EyeOff className="w-2.5 h-2.5" /> 忽略/误报
                          </button>
                          <button
                            onClick={() => handleGenerateRepair(f.id)}
                            disabled={isLoadingRepair}
                            className="px-2.5 py-1 rounded bg-amber-800 text-white hover:bg-amber-700 font-medium text-[11px] flex items-center gap-1 shadow-xs disabled:opacity-40"
                          >
                            {isLoadingRepair ? (
                              <>
                                <RotateCcw className="w-3 h-3 animate-spin" />
                                正在推演精准修复草案...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                一键生成修复草案 (对齐文风)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

