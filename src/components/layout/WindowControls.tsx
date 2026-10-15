import React, { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { isTauri } from '@/utils/tauriBridge';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [inTauri, setInTauri] = useState(() => isTauri());

  useEffect(() => {
    let isMounted = true;
    let unlisten: (() => void) | undefined;

    const initListeners = async () => {
      const desktop = isTauri() || (typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__));
      if (desktop) {
        if (isMounted) setInTauri(true);
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();
          const max = await appWindow.isMaximized();
          const full = await appWindow.isFullscreen();
          if (isMounted) setIsMaximized(max || full);

          const fn = await appWindow.onResized(async () => {
            if (isMounted) {
              const curMax = await appWindow.isMaximized();
              const curFull = await appWindow.isFullscreen();
              setIsMaximized(curMax || curFull);
            }
          });
          if (!isMounted) {
            if (typeof fn === 'function') fn();
          } else {
            unlisten = fn;
          }
        } catch (err) {
          console.warn('[WindowControls] Tauri window init fallback:', err);
        }
      } else {
        // 浏览器环境：同步监听原生全屏状态变更
        const handleFullscreenChange = () => {
          if (isMounted) {
            setIsMaximized(Boolean(document.fullscreenElement));
          }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
      }
    };

    const cleanup = initListeners();

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
      if (cleanup && typeof (cleanup as any).then === 'function') {
        (cleanup as any).then((cleanFn: any) => {
          if (typeof cleanFn === 'function') cleanFn();
        });
      }
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      } catch (err) {
        console.error('[WindowControls] Failed to minimize window:', err);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        const isFull = await appWindow.isFullscreen();
        if (isFull) {
          await appWindow.setFullscreen(false);
          setIsMaximized(await appWindow.isMaximized());
        } else {
          await appWindow.toggleMaximize();
          setIsMaximized(await appWindow.isMaximized());
        }
      } catch (err) {
        console.error('[WindowControls] Failed to toggle maximize:', err);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsMaximized(false);
        } else {
          await document.documentElement.requestFullscreen();
          setIsMaximized(true);
        }
      } catch (err) {
        console.warn('[WindowControls] Browser fullscreen toggle failed:', err);
      }
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch (err) {
        console.error('[WindowControls] Failed to close window:', err);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        window.close();
      } catch (err) {
        console.warn('[WindowControls] Browser close window failed:', err);
      }
    }
  };

  return (
    <div
      className={`flex items-center ml-1.5 pl-1.5 border-l border-[#ded5c4] dark:border-stone-700/60 shrink-0 z-50 select-none ${
        isMaximized ? 'pr-3' : 'pr-2'
      }`}
      data-tauri-drag-region="false"
    >
      {/* 最小化 */}
      <button
        type="button"
        onClick={handleMinimize}
        className="w-9 h-8 flex items-center justify-center rounded-md text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] active:bg-[#d8cebe] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/60 transition cursor-pointer shrink-0"
        title={inTauri ? "最小化窗口" : "最小化 / 退出全屏"}
        aria-label="最小化窗口"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* 最大化 / 向下还原 */}
      <button
        type="button"
        onClick={handleToggleMaximize}
        className="w-9 h-8 flex items-center justify-center rounded-md text-[#685f54] hover:text-[#231f1a] hover:bg-[#e4dcce] active:bg-[#d8cebe] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/60 transition cursor-pointer shrink-0"
        title={isMaximized ? '向下还原 (退出全屏)' : '窗口最大化'}
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
