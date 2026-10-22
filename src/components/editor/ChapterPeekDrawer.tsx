import React, { useState, useEffect, useMemo } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
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
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ChapterPeekDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activeChapter, chapters, selectChapter } = useNovelStore(
    useShallow((s) => ({
      activeChapter: s.activeChapter,
      chapters: s.chapters,
      selectChapter: s.selectChapter,
    }))
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [peekChapter, setPeekChapter] = useState<Chapter | null>(null);
  const [copiedTail, setCopiedTail] = useState(false);
  const [copiedHead, setCopiedHead] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'snippets' | 'full'>('snippets');

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

  // 过滤章节列表
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.trim().toLowerCase();
    return chapters.filter((c) => c.title.toLowerCase().includes(q));
  }, [chapters, searchQuery]);

  if (!isOpen) return null;

  // 清洗 HTML 标签并保留段落自然换行
  const formatPlainText = (html?: string) => {
    if (!html) return '';
    return html
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const plainText = formatPlainText(peekChapter?.content);
  // 计算纯字数（排除空白字符）
  const totalLength = plainText.replace(/\s+/g, '').length;

  // 提取开头约 200 字与末尾约 350 字 (章末钩子)
  const headSnippet = plainText.slice(0, 260);
  const tailSnippet = totalLength > 400 ? plainText.slice(-400) : plainText;

  // 当前章在列表中的索引
  const currentIndex = chapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

  const handleCopyTail = async () => {
    if (!tailSnippet) return;
    try {
      await navigator.clipboard.writeText(tailSnippet);
      setCopiedTail(true);
      setTimeout(() => setCopiedTail(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleCopyHead = async () => {
    if (!headSnippet) return;
    try {
      await navigator.clipboard.writeText(headSnippet);
      setCopiedHead(true);
      setTimeout(() => setCopiedHead(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleCopyFull = async () => {
    if (!plainText) return;
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end select-none font-sans">
      <div className="w-full max-w-3xl xl:max-w-4xl h-full bg-surface dark:bg-[#1a1714] border-l border-line dark:border-[#2e2a27] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* 顶部标题栏 */}
        <div className="p-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-800/15 dark:bg-amber-400/15 text-primary dark:text-amber-300 flex items-center justify-center shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-sm text-ink dark:text-stone-100 font-serif">
                章节速览偷看抽屉 (ChapterPeek)
              </span>
              <span className="text-[10px] text-ink-2 dark:text-[#a09485] ml-2 hidden sm:inline">
                随时回顾前后章节因果伏笔与断章钩子
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-[#ded5c4]/60 dark:hover:bg-[#342e27] transition cursor-pointer"
            title="关闭抽屉 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷定位上一章提示条 */}
        {prevChapter && (
          <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-400/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-primary dark:text-amber-300 shrink-0">
            <span className="truncate mr-2">
              当前执笔：<strong>《{activeChapter?.title}》</strong>
            </span>
            <button
              onClick={() => setSelectedChapterId(prevChapter.id)}
              className="text-[11px] font-semibold underline hover:text-amber-700 dark:hover:text-amber-200 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>直达上一章回顾</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 主体分栏：左侧章节目录列表，右侧预览内容 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左侧：章节树列表 (宽敞布局，完整展示章节名) */}
          <div className="w-64 sm:w-72 border-r border-line dark:border-[#2e2a27] bg-surface dark:bg-[#181513] flex flex-col shrink-0 min-h-0">
            {/* 章节搜索与统计 */}
            <div className="p-2.5 border-b border-line dark:border-[#282420] shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-ink-2 dark:text-[#a09485]">
                <span>小说目录 ({chapters.length} 章)</span>
                {searchQuery && (
                  <span className="text-[10px] text-primary">匹配 {filteredChapters.length} 章</span>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ink-2 dark:text-[#786e64]" />
                <input
                  type="text"
                  placeholder="搜索章节名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1 bg-surface-2 dark:bg-[#201d1a] border border-line dark:border-[#352f2a] rounded text-xs text-ink placeholder-ink-2/60 focus:outline-none focus:border-amber-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-ink-2 hover:text-ink text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* 章节项列表 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChapters.length === 0 ? (
                <div className="py-8 text-center text-ink-2 text-xs">未找到匹配章节</div>
              ) : (
                filteredChapters.map((ch) => {
                  const isCurrent = ch.id === activeChapter?.id;
                  const isSelected = ch.id === selectedChapterId;
                  const words = (ch.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-800 text-white font-semibold shadow-xs'
                          : isCurrent
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-primary dark:text-amber-300 font-medium border border-amber-800/20 dark:border-amber-400/25'
                          : 'hover:bg-surface-3-hover dark:hover:bg-[#25201c] text-ink dark:text-stone-300 border border-transparent'
                      }`}
                      title={ch.title}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0 w-full">
                        <span className="truncate flex-1 min-w-0 font-medium" title={ch.title}>
                          {ch.title}
                        </span>
                        {isCurrent && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-sans shrink-0 font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-800/20 text-primary dark:text-amber-200'
                            }`}
                          >
                            当前
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] flex items-center justify-between ${
                          isSelected ? 'text-white/80' : 'text-ink-2 dark:text-[#8e8476]'
                        }`}
                      >
                        <span>{words > 0 ? `${words} 字` : '待动笔'}</span>
                        {isSelected && <span className="text-[10px]">正在速览 ▸</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧：章节偷看内容详情 (大视野、双视图切换) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-surface dark:bg-[#1c1916]">
            {peekChapter ? (
              <>
                {/* 章节标题与视图切换工具条 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line dark:border-[#2e2a27]">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-ink dark:text-stone-100 font-serif truncate" title={peekChapter.title}>
                      {peekChapter.title}
                    </h3>
                    <div className="text-[11px] text-ink-2 dark:text-[#a09485] flex items-center gap-2 mt-0.5">
                      <span>共 {totalLength} 字</span>
                      <span>·</span>
                      <span className="text-primary dark:text-amber-400 font-medium">
                        {viewMode === 'snippets' ? '首尾断章速查' : '章节完整正文'}
                      </span>
                      {loading && (
                        <span className="text-[11px] text-amber-600 animate-pulse font-sans flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin" /> 载入全章中...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* 视图模式切换胶囊 */}
                    <div className="flex items-center bg-surface-2 dark:bg-[#24201c] p-0.5 rounded-lg border border-line dark:border-[#352f2a] text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('snippets')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                          viewMode === 'snippets'
                            ? 'bg-amber-800 text-white shadow-2xs font-semibold'
                            : 'text-ink-2 dark:text-[#a09485] hover:text-ink'
                        }`}
                        title="只看开篇与章末悬念，快速承接剧情"
                      >
                        <Clock className="w-3 h-3" />
                        <span>首尾断章</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('full')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                          viewMode === 'full'
                            ? 'bg-amber-800 text-white shadow-2xs font-semibold'
                            : 'text-ink-2 dark:text-[#a09485] hover:text-ink'
                        }`}
                        title="完整通读本章所有正文"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>全文通读</span>
                      </button>
                    </div>

                    {/* 跳转编辑按钮 */}
                    <button
                      onClick={() => handleJumpToChapter(peekChapter.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-[#28231e] hover:bg-[#ded5c4] dark:hover:bg-[#342e27] text-ink dark:text-[#ede6dc] text-xs font-medium border border-line dark:border-[#38332e] transition cursor-pointer shadow-2xs"
                      title="直接将当前编辑器切换为此章节"
                    >
                      <span>跳转编辑</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 视图模式 1: 全文通读模式 */}
                {viewMode === 'full' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink-2 dark:text-[#a09485]">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                        完整正文通读 ({totalLength} 字)
                      </span>
                      <button
                        onClick={handleCopyFull}
                        className="flex items-center gap-1 px-2 py-0.5 rounded border border-line hover:border-primary text-xs hover:text-primary transition cursor-pointer"
                      >
                        {copiedFull ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedFull ? '已复制全章' : '复制全章'}</span>
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 rounded-xl bg-surface-2/60 dark:bg-[#181513] border border-line dark:border-[#2e2a27] shadow-inner font-serif text-sm leading-relaxed text-ink dark:text-stone-200 select-text whitespace-pre-wrap max-h-[calc(100vh-250px)] overflow-y-auto">
                      {plainText || '当前章节暂无正文内容。'}
                    </div>
                  </div>
                ) : (
                  /* 视图模式 2: 首尾断章速查模式 (按自然阅读时序：先开篇前景 ➔ 后章末断章钩子) */
                  <div className="space-y-4">
                    {/* 1. 开篇前景切入 (前 200 字) */}
                    <div className="space-y-2 bg-[#faf5ec] dark:bg-[#24201c] border border-line dark:border-[#38332e] p-3.5 sm:p-4 rounded-xl shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink dark:text-stone-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          开篇前景 (前 200~260 字)
                        </span>
                        <button
                          onClick={handleCopyHead}
                          className="flex items-center gap-1 text-[11px] text-ink-2 hover:text-primary transition cursor-pointer"
                        >
                          {copiedHead ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHead ? '已复制' : '复制开篇'}</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-ink dark:text-stone-300 font-serif whitespace-pre-wrap select-text bg-surface dark:bg-[#1a1714] p-3.5 rounded-lg border border-[#e8dfcf] dark:border-[#2e2a27]">
                        {headSnippet || '暂无内容'}
                      </p>
                    </div>

                    {/* 2. 章末断章悬念与收尾 (后 350~400 字) */}
                    <div className="space-y-2 bg-[#faf5ec] dark:bg-[#24201c] border border-line dark:border-[#38332e] p-3.5 sm:p-4 rounded-xl shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary dark:text-amber-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          章末断章悬念与收尾 (后 350~400 字)
                        </span>
                        <button
                          onClick={handleCopyTail}
                          className="flex items-center gap-1 text-[11px] text-ink-2 hover:text-primary transition cursor-pointer"
                        >
                          {copiedTail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTail ? '已复制末尾' : '复制末尾'}</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-ink dark:text-stone-300 font-serif whitespace-pre-wrap select-text bg-surface dark:bg-[#1a1714] p-3.5 rounded-lg border border-[#e8dfcf] dark:border-[#2e2a27]">
                        {tailSnippet || '当前章节暂无正文内容。'}
                      </p>
                    </div>

                    {/* 引导切换全文通读 */}
                    {totalLength > 400 && (
                      <div className="p-3 rounded-xl bg-surface-2 dark:bg-[#201d19] border border-line dark:border-[#332c25] flex items-center justify-between text-xs text-ink-2 dark:text-[#a09485]">
                        <span>想查阅中间具体对话或伏笔？本章共 {totalLength} 字</span>
                        <button
                          type="button"
                          onClick={() => setViewMode('full')}
                          className="flex items-center gap-1 text-primary dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                        >
                          <span>查看章节完整正文</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-24 text-center text-ink-2 text-xs">
                请在左侧选择需要偷看的章节
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
