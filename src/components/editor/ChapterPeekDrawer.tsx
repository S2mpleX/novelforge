import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { Chapter } from '@/types';
import {
  Eye,
  X,
  Copy,
  Check,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ChapterPeekDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activeChapter, chapters, selectChapter } = useNovelStore();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [peekChapter, setPeekChapter] = useState<Chapter | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // 默认定位到上一章（如果没有上一章则定位到当前章）
  useEffect(() => {
    if (!isOpen || !activeChapter || !chapters.length) return;

    const currentIndex = chapters.findIndex((c) => c.id === activeChapter.id);
    const target = currentIndex > 0 ? chapters[currentIndex - 1] : activeChapter;
    setSelectedChapterId(target.id);
  }, [isOpen, activeChapter?.id, chapters]);

  // 载入选定章节完整内容
  useEffect(() => {
    if (!selectedChapterId) return;

    // 先从内存找
    const found = chapters.find((c) => c.id === selectedChapterId);
    if (found?.content) {
      setPeekChapter(found);
      return;
    }

    // 若无 content 则从数据库/API 异步读取
    let isMounted = true;
    setLoading(true);
    api
      .getChapter(selectedChapterId)
      .then((c) => {
        if (isMounted && c) setPeekChapter(c);
      })
      .catch((e) => console.error('载入章节预览失败:', e))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChapterId, chapters]);

  if (!isOpen) return null;

  // 清洗 HTML 标签获得纯文本
  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const plainText = stripHtml(peekChapter?.content);
  const totalLength = plainText.length;

  // 提取开头 200 字与末尾 350 字 (章末钩子)
  const headSnippet = plainText.slice(0, 200);
  const tailSnippet = totalLength > 350 ? plainText.slice(-350) : plainText;

  // 当前章在列表中的索引
  const currentIndex = chapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

  const handleCopyTail = async () => {
    if (!tailSnippet) return;
    try {
      await navigator.clipboard.writeText(tailSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleJumpToChapter = (id: string) => {
    const ch = chapters.find((c) => c.id === id);
    if (ch) {
      selectChapter(ch);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end select-none font-sans">
      <div className="w-full max-w-xl h-full bg-surface dark:bg-[#1a1714] border-l border-line dark:border-[#2e2a27] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* 顶部标题栏 */}
        <div className="p-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary dark:text-amber-500" />
            <span className="font-bold text-sm text-ink dark:text-stone-200">
              章节速览偷看抽屉 (ChapterPeek)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-[#ded5c4]/60 dark:hover:bg-[#342e27] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷偷看提示条 */}
        {prevChapter && (
          <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-primary dark:text-amber-400">
            <span>
              正在编写：<strong>{activeChapter?.title}</strong>
            </span>
            <button
              onClick={() => setSelectedChapterId(prevChapter.id)}
              className="text-[11px] underline font-medium hover:text-primary"
            >
              直接定位上一章 ({prevChapter.title})
            </button>
          </div>
        )}

        {/* 主体分栏：左侧章节目录列表，右侧预览内容 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左侧：章节树列表 (1/3 宽度) */}
          <div className="w-48 border-r border-line dark:border-[#2e2a27] bg-surface dark:bg-[#181513] overflow-y-auto p-2 space-y-1">
            <div className="text-[10px] font-bold text-ink-2 uppercase px-2 py-1 tracking-wider">
              小说目录 ({chapters.length} 章)
            </div>
            {chapters.map((ch) => {
              const isCurrent = ch.id === activeChapter?.id;
              const isSelected = ch.id === selectedChapterId;
              const words = stripHtml(ch.content).length;

              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-800 text-white font-semibold shadow-xs'
                      : isCurrent
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-primary dark:text-amber-300 font-medium'
                      : 'hover:bg-[#eae1d0] dark:hover:bg-[#25201c] text-ink-2 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[110px]">{ch.title}</span>
                    {isCurrent && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-800/20 text-primary dark:text-amber-200">
                        当前
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] ${
                      isSelected ? 'text-white/80' : 'text-ink-2'
                    }`}
                  >
                    {words > 0 ? `${words} 字` : '待动笔'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右侧：章节偷看内容详情 (2/3 宽度) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface dark:bg-[#1c1916]">
            {peekChapter ? (
              <>
                {/* 章节标题与跳转 */}
                <div className="flex items-center justify-between pb-2 border-b border-line dark:border-[#2e2a27]">
                  <div>
                    <h3 className="font-bold text-sm text-ink dark:text-stone-100 font-serif">
                      {peekChapter.title}
                    </h3>
                    <span className="text-[11px] text-ink-2">
                      共 {totalLength} 字 · 正文速览
                      {loading && <span className="ml-2 text-[11px] text-amber-600 animate-pulse font-sans">载入中...</span>}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJumpToChapter(peekChapter.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 dark:bg-[#28231e] hover:bg-[#ded5c4] dark:hover:bg-[#342e27] text-ink-2 dark:text-[#ede6dc] text-xs font-medium border border-line dark:border-[#38332e] transition cursor-pointer"
                  >
                    <span>跳转编辑</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* 1. 末尾断章钩子 (最核心痛点：上一章停在哪里) */}
                <div className="space-y-1.5 bg-[#faf5ec] dark:bg-[#24201c] border border-line dark:border-[#38332e] p-3.5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      章末断章悬念与收尾 (后 350 字)
                    </span>
                    <button
                      onClick={handleCopyTail}
                      className="flex items-center gap-1 text-[11px] text-ink-2 hover:text-primary transition"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? '已复制' : '复制末尾'}</span>
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-ink dark:text-stone-300 font-serif whitespace-pre-wrap select-text bg-surface dark:bg-[#1a1714] p-3 rounded-lg border border-[#e8dfcf] dark:border-[#2e2a27]">
                    {tailSnippet || '当前章节暂无正文内容。'}
                  </p>
                </div>

                {/* 2. 开篇切入 (前 200 字) */}
                <div className="space-y-1.5 bg-[#faf5ec] dark:bg-[#24201c] border border-line dark:border-[#38332e] p-3.5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-2 dark:text-stone-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      开篇前景 (前 200 字)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2 dark:text-stone-400 font-serif whitespace-pre-wrap select-text bg-surface dark:bg-[#1a1714] p-3 rounded-lg border border-[#e8dfcf] dark:border-[#2e2a27]">
                    {headSnippet || '暂无内容'}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-ink-2 text-xs">
                请在左侧选择需要偷看的章节
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
