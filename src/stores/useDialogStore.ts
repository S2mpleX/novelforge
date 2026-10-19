import { create } from 'zustand';

/**
 * 应用内全局对话框系统（替代 Tauri v2 下失效的原生 alert/confirm/prompt）。
 * 所有交互均以 Promise 暴露：await confirmDialog(...) → boolean。
 */

export type DialogTone = 'default' | 'danger' | 'info';

export interface ConfirmDialogOptions {
  /** 对话框标题（可选，缺省时仅展示消息） */
  title?: string;
  /** 消息正文，支持 \n 换行 */
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 视觉语气：danger 用于删除/回退等破坏性操作 */
  tone?: DialogTone;
}

export interface AlertDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  tone?: DialogTone;
}

export interface PromptDialogOptions {
  title?: string;
  message: string;
  /** 输入框预填值 */
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

type DialogRequest =
  | ({ type: 'confirm'; resolve: (ok: boolean) => void } & ConfirmDialogOptions)
  | ({ type: 'alert'; resolve: () => void } & AlertDialogOptions)
  | ({ type: 'prompt'; resolve: (value: string | null) => void } & PromptDialogOptions);

interface DialogStoreState {
  /** 待展示的对话框队列（正常情况下同一时刻只有一个） */
  queue: DialogRequest[];
  /** 入队一个新对话框请求 */
  push: (req: DialogRequest) => void;
  /** 关闭队首对话框并以 value 兑现其 Promise（boolean / string | null） */
  settle: (value: boolean | string | null) => void;
}

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  queue: [],
  push: (req) => set({ queue: [...get().queue, req] }),
  settle: (value) => {
    const [current, ...rest] = get().queue;
    if (!current) return;
    if (current.type === 'prompt') {
      current.resolve(typeof value === 'string' ? value : null);
    } else if (current.type === 'confirm') {
      current.resolve(value === true);
    } else {
      current.resolve();
    }
    set({ queue: rest });
  },
}));
