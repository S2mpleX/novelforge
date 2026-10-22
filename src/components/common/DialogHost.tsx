import React, { useEffect, useRef, useState } from 'react';
import { useDialogStore } from '@/stores/useDialogStore';
import { AlertTriangle, Info, MessageSquareText } from 'lucide-react';

/**
 * DialogHost — 应用内全局对话框渲染器。
 * 在 App 根节点挂载一次，消费 useDialogStore 队列。
 * 支持 Esc 取消 / Enter 确认，prompt 模式支持输入框聚焦与全选预填值。
 */
export const DialogHost: React.FC = () => {
  const queue = useDialogStore((s) => s.queue);
  const settle = useDialogStore((s) => s.settle);
  const current = queue[0];

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;

    if (current.type === 'prompt') {
      setInputValue(current.defaultValue ?? '');
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 40);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        settle(current.type === 'prompt' ? null : false);
        return;
      }
      if (e.key === 'Enter') {
        // 防止中文输入法拼音确认候选字时误触回车提交对话框
        if (e.isComposing || (e as any).isComposing || e.keyCode === 229) return;
        // prompt 模式：输入框内回车提交；其余模式回车等于确认
        const inTextarea = (e.target as HTMLElement | null)?.tagName === 'TEXTAREA';
        if (inTextarea) return;
        e.preventDefault();
        settle(current.type === 'prompt' ? inputValue : true);
      }
    };
    // 使用捕获阶段，确保优先于页面其它快捷键（如 Ctrl+K 指令面板）
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [current, inputValue, settle]);

  if (!current) return null;

  const isPrompt = current.type === 'prompt';
  const tone = 'tone' in current ? current.tone : undefined;
  const isDanger = tone === 'danger';

  const confirmLabel =
    current.type === 'prompt'
      ? current.confirmText ?? '确定'
      : current.type === 'confirm'
        ? current.confirmText ?? '确定'
        : current.confirmText ?? '知道了';

  const cancelLabel =
    current.type === 'prompt'
      ? current.cancelText ?? '取消'
      : current.type === 'confirm'
        ? current.cancelText ?? '取消'
        : null;

  const handleConfirm = () => {
    if (isPrompt) settle(inputValue);
    else settle(true);
  };

  const handleCancel = () => {
    settle(isPrompt ? null : false);
  };

  return (
    <div
      className="dialog-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        // 点击遮罩空白处 = 取消（与 Esc 等价）
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="dialog-panel w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl dark:border-[#38332e] dark:bg-[#201d1a]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 标题行 */}
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
              isDanger
                ? 'border-rose-700/25 bg-rose-700/10 text-rose-700 dark:text-rose-400'
                : isPrompt
                  ? 'border-amber-800/25 bg-amber-800/10 text-primary dark:text-amber-400'
                  : 'border-amber-800/25 bg-amber-800/10 text-primary dark:text-amber-400'
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="h-4 w-4" />
            ) : isPrompt ? (
              <MessageSquareText className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {current.title && (
              <h3 className="mb-1 font-serif text-sm font-bold text-ink dark:text-[#ede6dc]">
                {current.title}
              </h3>
            )}
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink dark:text-[#d8d2c6]">
              {current.message}
            </p>
          </div>
        </div>

        {/* prompt 输入区 */}
        {isPrompt && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder={current.placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-2 font-serif text-sm text-ink outline-none transition placeholder:text-[#a89e8c] focus:border-amber-700 dark:border-[#38332d] dark:bg-[#23232e] dark:text-[#ede6dc] dark:focus:border-amber-500"
          />
        )}

        {/* 操作区与快捷键说明：左右两端对称平衡布局，充实左下角空间 */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3.5 border-t border-line/50 dark:border-[#332e29]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#a89e8c] dark:text-[#7d756b] font-sans select-none">
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] border border-line/60 dark:border-[#3d3832]">Enter</kbd>
            <span>确认</span>
            <span className="opacity-40">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] border border-line/60 dark:border-[#3d3832]">Esc</kbd>
            <span>取消</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cancelLabel && (
              <button
                type="button"
                onClick={handleCancel}
                className="cursor-pointer rounded-xl border border-line bg-surface-2 px-3.5 py-1.5 font-serif text-xs font-medium text-ink-2 transition hover:bg-[#eee5d5] active:scale-95 dark:border-[#38332d] dark:bg-[#26221f] dark:text-[#a09485] dark:hover:bg-[#2d2925]"
              >
                {cancelLabel}
              </button>
            )}
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              className={`cursor-pointer rounded-xl px-4 py-1.5 font-serif text-xs font-semibold text-white shadow-sm transition active:scale-95 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                  : 'bg-amber-800 hover:bg-amber-700 shadow-amber-900/20'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
