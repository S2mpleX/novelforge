import React, { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { isTauri } from '@/utils/tauriBridge';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [inTauri, setInTauri] = useState(() => isTauri());

  useEffect(() => {
    if (!isTauri()) return;
    setInTauri(true);

    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        setIsMaximized(await appWindow.isMaximized());
        unlisten = await appWindow.onResized(async () => {
          setIsMaximized(await appWindow.isMaximized());
        });
      } catch (err) {
        console.warn('[WindowControls] Failed to attach window listeners:', err);
      }
    })();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  if (!inTauri) return null;

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error('[WindowControls] Failed to minimize window:', err);
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    } catch (err) {
      console.error('[WindowControls] Failed to toggle maximize:', err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.error('[WindowControls] Failed to close window:', err);
    }
  };

  return (
    <div
      className="flex items-center ml-2 pl-2 border-l border-[#ded5c4] dark:border-stone-700/60 -mr-1 shrink-0 z-50 select-none"
      data-tauri-drag-region="false"
    >
      {/* 最小化 */}
      <button
        type="button"
        onClick={handleMinimize}
        className="w-9 h-8 flex items-center justify-center rounded-md text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] active:bg-[#d8cebe] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/60 transition cursor-pointer shrink-0"
        title="最小化"
        aria-label="最小化窗口"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* 最大化 / 向下还原 */}
      <button
        type="button"
        onClick={handleToggleMaximize}
        className="w-9 h-8 flex items-center justify-center rounded-md text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] active:bg-[#d8cebe] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/60 transition cursor-pointer shrink-0"
        title={isMaximized ? '向下还原' : '最大化'}
        aria-label={isMaximized ? '向下还原窗口' : '最大化窗口'}
      >
        {isMaximized ? (
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="4.5" y="2" width="9.5" height="9.5" rx="1" />
            <path d="M2 4.5v9a1 1 0 0 0 1 1h9" />
          </svg>
        ) : (
          <Square className="w-3.5 h-3.5" strokeWidth={1.6} />
        )}
      </button>

      {/* 关闭应用 */}
      <button
        type="button"
        onClick={handleClose}
        className="w-9 h-8 flex items-center justify-center rounded-md text-[#685f54] hover:text-white hover:bg-rose-600 active:bg-rose-700 dark:text-stone-300 dark:hover:text-white dark:hover:bg-rose-600 transition cursor-pointer group shrink-0"
        title="关闭 NovelForge AI"
        aria-label="关闭应用"
      >
        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};
