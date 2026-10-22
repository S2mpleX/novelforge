import { useDialogStore } from '@/stores/useDialogStore';
import type {
  AlertDialogOptions,
  ConfirmDialogOptions,
  PromptDialogOptions,
} from '@/stores/useDialogStore';

/**
 * 应用内对话框 API（可在任意模块直接 import 调用，无需 React 上下文）。
 *
 * - confirmDialog(msg)            → Promise<boolean>
 * - alertDialog(msg)              → Promise<void>
 * - promptDialog(msg, default)    → Promise<string | null>（取消返回 null）
 *
 * 破坏性操作（删除/回退/恢复默认等）自动升级为 danger 红色语气，
 * 也可通过 options.tone 显式指定。
 */

const DANGER_KEYWORDS = /删除|回退|恢复|清除|不可撤销|彻底|重置|清空/;

function normalizeConfirm(options: ConfirmDialogOptions | string): ConfirmDialogOptions {
  const opts = typeof options === 'string' ? { message: options } : options;
  const tone =
    opts.tone ?? (DANGER_KEYWORDS.test(opts.message) ? 'danger' : 'default');
  return { ...opts, tone };
}

export function confirmDialog(options: ConfirmDialogOptions | string): Promise<boolean> {
  const opts = normalizeConfirm(options);
  return new Promise<boolean>((resolve) => {
    useDialogStore.getState().push({ type: 'confirm', ...opts, resolve });
  });
}

export function alertDialog(options: AlertDialogOptions | string): Promise<void> {
  const opts: AlertDialogOptions =
    typeof options === 'string' ? { message: options } : options;
  return new Promise<void>((resolve) => {
    useDialogStore.getState().push({ type: 'alert', ...opts, resolve });
  });
}

export function promptDialog(
  options: PromptDialogOptions | string,
  defaultValue?: string
): Promise<string | null> {
  const opts: PromptDialogOptions =
    typeof options === 'string'
      ? { message: options, defaultValue }
      : options;
  return new Promise<string | null>((resolve) => {
    useDialogStore.getState().push({ type: 'prompt', ...opts, resolve });
  });
}
