import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Search,
  Replace,
  ChevronUp,
  ChevronDown,
  X,
  CaseSensitive,
  WholeWord,
  CheckCheck,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

interface EditorFindReplaceBarProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'find' | 'replace';
}

interface MatchItem {
  from: number;
  to: number;
  text: string;
}

export const EditorFindReplaceBar: React.FC<EditorFindReplaceBarProps> = ({
  editor,
  isOpen,
  onClose,
  initialMode = 'find',
}) => {
  const [mode, setMode] = useState<'find' | 'replace'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchWord, setMatchWord] = useState(false);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Sync mode when initialMode changes externally (e.g. user pressed Ctrl+H)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTimeout(() => {
        if (initialMode === 'replace' && searchQuery) {
          replaceInputRef.current?.focus();
          replaceInputRef.current?.select();
        } else {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, initialMode]);

  // Recalculate matches across the ProseMirror document
  const findMatches = useCallback(() => {
    if (!editor || !searchQuery) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const doc = editor.state.doc;
    const results: MatchItem[] = [];

    let flags = 'g';
    if (!caseSensitive) flags += 'i';

    let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (matchWord) {
      const hasChinese = /[\u4e00-\u9fa5]/.test(searchQuery);
      if (hasChinese) {
        flags += 'u';
        pattern = `(?<=^|[^\\p{Script=Han}\\w])${pattern}(?=$|[^\\p{Script=Han}\\w])`;
      } else {
        pattern = `\\b${pattern}\\b`;
      }
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        while ((match = regex.exec(node.text)) !== null) {
          results.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            text: match[0],
          });
          // Avoid infinite loops on empty matches
          if (regex.lastIndex === match.index) {
            regex.lastIndex++;
          }
        }
      }
    });

    setMatches(results);

    // Keep active selection index or default to first match
    if (results.length > 0) {
      const currentPos = editor.state.selection.from;
      const closestIndex = results.findIndex((m) => m.from >= currentPos);
      const targetIndex = closestIndex !== -1 ? closestIndex : 0;
      setCurrentIndex(targetIndex);
      highlightMatch(results[targetIndex]);
    } else {
      setCurrentIndex(-1);
    }
  }, [editor, searchQuery, caseSensitive, matchWord]);

  // Highlighting specific match in editor
  const highlightMatch = useCallback(
    (match: MatchItem) => {
      if (!editor || !match) return;
      editor.commands.setTextSelection({ from: match.from, to: match.to });
      editor.commands.scrollIntoView();
    },
    [editor]
  );

  useEffect(() => {
    if (isOpen) {
      findMatches();
    }
  }, [isOpen, searchQuery, caseSensitive, matchWord, findMatches]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    highlightMatch(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    highlightMatch(matches[prevIdx]);
  };

  const handleReplaceCurrent = () => {
    if (!editor || matches.length === 0 || currentIndex < 0 || currentIndex >= matches.length) {
      return;
    }
    const currentMatch = matches[currentIndex];
    editor
      .chain()
      .focus()
      .insertContentAt({ from: currentMatch.from, to: currentMatch.to }, replaceQuery)
      .run();

    toast.success('替换成功', `已将第 ${currentIndex + 1} 处匹配项替换为目标内容`);
    findMatches();
  };

  const handleReplaceAll = () => {
    if (!editor || matches.length === 0) {
      toast.info('无匹配项', '当前章节中未找到可替换的目标文本');
      return;
    }

    const count = matches.length;
    const tr = editor.state.tr;
    // Replace in reverse order so character offsets in earlier parts of the doc do not drift
    const reversed = [...matches].sort((a, b) => b.from - a.from);
    for (const m of reversed) {
      tr.insertText(replaceQuery, m.from, m.to);
    }
    editor.view.dispatch(tr);

    toast.success('全部替换完成', `已成功将全章 ${count} 处匹配项替换为目标文本`);
    findMatches();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      editor?.commands.focus();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || (e as any).isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else {
      handleKeyDown(e);
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || (e as any).isComposing || e.keyCode === 229) return;
      e.preventDefault();
      handleReplaceCurrent();
    } else {
      handleKeyDown(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="border-b border-line dark:border-[#2e2a27] bg-[#f9f5eb]/95 dark:bg-[#1e1b17]/95 backdrop-blur-md px-3 py-2 flex flex-col gap-1.5 shadow-sm select-none z-20 animate-in slide-in-from-top-1 duration-150"
    >
      {/* Row 1: Search Inputs & Controls */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setMode(mode === 'find' ? 'replace' : 'find')}
          className={`p-1.5 rounded-lg border text-xs font-serif flex items-center gap-1 transition cursor-pointer shrink-0 ${
            mode === 'replace'
              ? 'bg-[#854d0e] text-white border-[#854d0e] shadow-xs'
              : 'bg-surface-2 dark:bg-[#282420] text-ink-2 dark:text-[#a89f91] border-line dark:border-[#3a342c] hover:text-ink'
          }`}
          title={mode === 'find' ? '展开替换选项 (Ctrl+H)' : '收起替换选项'}
        >
          <Replace className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{mode === 'find' ? '替换' : '仅查找'}</span>
        </button>

        {/* Search Query Input */}
        <div className="relative flex-1 min-w-[160px] flex items-center">
          <Search className="w-3.5 h-3.5 text-ink-2 absolute left-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="在当前章节中查找... (Enter 下一个，Shift+Enter 上一个)"
            className="w-full pl-8 pr-16 py-1 text-xs font-serif bg-surface dark:bg-[#141210] border border-line dark:border-[#38322a] rounded-lg text-ink dark:text-[#ede4d4] placeholder-[#8c8273] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]/20 transition"
          />

          {/* Matches Counter Badge */}
          <div className="absolute right-2 text-[10px] font-mono font-medium text-ink-2 dark:text-[#a89f91] pointer-events-none">
            {searchQuery ? (
              matches.length > 0 ? (
                <span className="text-primary dark:text-[#d97706] font-bold">
                  {currentIndex + 1} / {matches.length}
                </span>
              ) : (
                <span className="text-stone-400">0 结果</span>
              )
            ) : null}
          </div>
        </div>

        {/* Match Modifiers (Aa, Word) */}
        <div className="flex items-center gap-0.5 border border-line dark:border-[#38322a] rounded-lg p-0.5 bg-surface-2 dark:bg-[#24201b] shrink-0">
          <button
            type="button"
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              caseSensitive
                ? 'bg-[#854d0e] text-white font-bold'
                : 'text-ink-2 dark:text-[#a89f91] hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="区分大小写 (Case Sensitive)"
          >
            <CaseSensitive className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMatchWord(!matchWord)}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              matchWord
                ? 'bg-[#854d0e] text-white font-bold'
                : 'text-ink-2 dark:text-[#a89f91] hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="全词精确匹配 (Whole Word)"
          >
            <WholeWord className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            className="p-1 rounded-lg border border-line dark:border-[#38322a] bg-surface dark:bg-[#24201b] text-ink-2 dark:text-[#a89f91] hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="上一个匹配 (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            className="p-1 rounded-lg border border-line dark:border-[#38322a] bg-surface dark:bg-[#24201b] text-ink-2 dark:text-[#a89f91] hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="下一个匹配 (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            editor?.commands.focus();
          }}
          className="p-1 rounded-lg text-ink-2 dark:text-[#a89f91] hover:text-ink hover:bg-[#ded5c4]/40 dark:hover:bg-white/10 transition cursor-pointer ml-auto shrink-0"
          title="关闭 (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Replace Inputs & Actions (Visible when mode === 'replace') */}
      {mode === 'replace' && (
        <div className="flex items-center gap-2 pt-1 border-t border-line/60 dark:border-[#38322a]/60 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[160px] flex items-center">
            <Replace className="w-3.5 h-3.5 text-ink-2 absolute left-2.5 pointer-events-none" />
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="替换为..."
              className="w-full pl-8 pr-3 py-1 text-xs font-serif bg-surface dark:bg-[#141210] border border-line dark:border-[#38322a] rounded-lg text-ink dark:text-[#ede4d4] placeholder-[#8c8273] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]/20 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReplaceCurrent}
              disabled={matches.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-serif bg-surface-2 dark:bg-[#282420] text-ink dark:text-[#ede4d4] border border-line dark:border-[#3a342c] hover:bg-surface-3-hover disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1"
              title="替换当前匹配项并跳至下一处"
            >
              <span>替换</span>
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-serif bg-[#854d0e] hover:bg-[#713f12] text-white font-medium disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="替换全章所有匹配项"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>全部替换</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
