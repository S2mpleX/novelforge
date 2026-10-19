import React, { useState } from 'react';
import { FloatingPanel } from '@/types/docking';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { PANEL_METADATA_MAP, getPanelIcon } from './PanelRegistry';
import { PanelWrapper } from './PanelWrapper';
import {
  Minimize2,
  Maximize2,
  X,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
} from 'lucide-react';

export const FloatingPanelContainer: React.FC = () => {
  const {
    layout,
    updateFloatingPanel,
    bringFloatingToFront,
    dockFloatingPanel,
    dockFloatingToSidebar,
    closePanel,
    toggleMaximizePanel,
    setDraggingState,
    handleDrop,
  } = useWorkspaceStore();

  const [draggingFloatingId, setDraggingFloatingId] = useState<string | null>(null);

  const handlePointerDownHeader = (e: React.PointerEvent, f: FloatingPanel) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    bringFloatingToFront(f.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...f.position };

    let isDragging = false;
    let animationFrameId: number | null = null;
    let latestEvt: PointerEvent | null = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      latestEvt = moveEvt;
      const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);

      if (dist > 8 && !isDragging) {
        isDragging = true;
        setDraggingFloatingId(f.id);
        setDraggingState({
          panel: f.panel,
          sourceFloatingId: f.id,
          dragSource: 'floating',
          startMousePos: { x: startX, y: startY },
          currentMousePos: { x: moveEvt.clientX, y: moveEvt.clientY },
          offset: { x: moveEvt.clientX - initialPos.x, y: moveEvt.clientY - initialPos.y },
        });
      }

      if (isDragging) {
        if (animationFrameId !== null) return;
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null;
          if (!latestEvt) return;

          const rawX = initialPos.x + (latestEvt.clientX - startX);
          const rawY = initialPos.y + (latestEvt.clientY - startY);

          // 边缘磁吸对齐与安全视口约束 (Magnetic Edge Snapping & Safe Viewport Bounds)
          let snappedX = rawX;
          let snappedY = rawY;
          // 水平吸附与屏幕边界保护
          if (snappedX < 24) snappedX = 8;
          if (snappedX + f.size.width > window.innerWidth - 24) {
            snappedX = window.innerWidth - f.size.width - 8;
          }
          snappedX = Math.max(8, Math.min(window.innerWidth - Math.min(f.size.width, 100), snappedX));

          // 垂直吸附与 Header 避让保护（顶栏高度 56px，吸附至 60px；禁止冲破顶部导致标题栏消失）
          if (snappedY < 72 && snappedY >= 48) snappedY = 60;
          if (snappedY + f.size.height > window.innerHeight - 24) {
            snappedY = window.innerHeight - f.size.height - 8;
          }
          snappedY = Math.max(60, Math.min(window.innerHeight - 40, snappedY));

          updateFloatingPanel(f.id, {
            position: { x: snappedX, y: snappedY },
          });

          // 驱动全局 DockDropIndicator 停靠计算
          useWorkspaceStore.setState((state) => {
            if (!state.draggingState) return state;
            return {
              draggingState: {
                ...state.draggingState,
                currentMousePos: { x: latestEvt!.clientX, y: latestEvt!.clientY },
              },
            };
          });
        });
      }
    };

    const handlePointerUp = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      setDraggingFloatingId(null);

      if (isDragging) {
        const dropTarget = useWorkspaceStore.getState().dropTarget;
        if (dropTarget) {
          handleDrop();
        } else {
          setDraggingState(null);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Resize handler for 8 directions
  const handlePointerDownResize = (
    e: React.PointerEvent,
    f: FloatingPanel,
    direction: 'e' | 'w' | 's' | 'n' | 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    bringFloatingToFront(f.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...f.position };
    const initialSize = { ...f.size };

    // Overlay to capture pointers
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '99999';
    overlay.style.cursor = `${direction}-resize`;
    overlay.style.userSelect = 'none';
    document.body.appendChild(overlay);

    let animationFrameId: number | null = null;
    let latestEvt: PointerEvent | null = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      latestEvt = moveEvt;
      if (animationFrameId !== null) return;

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        if (!latestEvt) return;
        const dx = latestEvt.clientX - startX;
        const dy = latestEvt.clientY - startY;

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPos.x;
        let newY = initialPos.y;

        if (direction.includes('e')) newWidth = Math.max(240, initialSize.width + dx);
        if (direction.includes('s')) newHeight = Math.max(180, initialSize.height + dy);
        if (direction.includes('w')) {
          const potentialW = initialSize.width - dx;
          const potentialX = initialPos.x + dx;
          if (potentialW >= 240 && potentialX >= 8) {
            newWidth = potentialW;
            newX = potentialX;
          }
        }
        if (direction.includes('n')) {
          const potentialH = initialSize.height - dy;
          const potentialY = initialPos.y + dy;
          if (potentialH >= 180 && potentialY >= 60) {
            newHeight = potentialH;
            newY = potentialY;
          }
        }

        updateFloatingPanel(f.id, {
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        });
      });
    };

    const handlePointerUp = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (layout.floatingPanels.length === 0) return null;

  return (
    <>
      {layout.floatingPanels.map((f) => {
        const meta = PANEL_METADATA_MAP[f.panel.panelType] || {
          title: f.panel.title || f.panel.panelType,
        };
        const Icon = getPanelIcon(f.panel.panelType);
        const title = f.panel.title || meta.title;

        const isBeingDragged = draggingFloatingId === f.id;

        return (
          <div
            key={f.id}
            onPointerDown={() => bringFloatingToFront(f.id)}
            style={{
              left: `${f.position.x}px`,
              top: `${f.position.y}px`,
              width: `${f.size.width}px`,
              height: f.isMinimized ? '34px' : `${f.size.height}px`,
              zIndex: f.zIndex,
            }}
            className={`fixed bg-surface rounded-xl border border-line flex flex-col overflow-hidden transition-all duration-150 ${
              isBeingDragged
                ? 'pointer-events-none opacity-70 ring-2 ring-amber-600 shadow-2xl scale-[1.01]'
                : 'opacity-100 shadow-2xl'
            }`}
          >
            {/* Floating Titlebar */}
            <div
              onPointerDown={(e) => handlePointerDownHeader(e, f)}
              className="h-8 border-b border-line bg-surface-2 px-2.5 flex items-center justify-between text-xs cursor-move select-none shrink-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold text-xs text-ink truncate">
                  {title} (悬浮窗)
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Dock to left sidebar */}
                <button
                  onClick={() => dockFloatingToSidebar(f.id, 'left')}
                  title="自动吸附到左侧侧边栏 (章节目录侧)"
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition cursor-pointer"
                >
                  <ArrowLeftToLine className="w-3 h-3" />
                </button>

                {/* Dock to right sidebar */}
                <button
                  onClick={() => dockFloatingToSidebar(f.id, 'right')}
                  title="自动吸附到右侧栏 (AI写作助手侧)"
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition cursor-pointer"
                >
                  <ArrowRightToLine className="w-3 h-3" />
                </button>

                {/* Dock back into main layout */}
                <button
                  onClick={() => dockFloatingPanel(f.id)}
                  title="重新停靠回主工作台 (合并为标签页)"
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition cursor-pointer"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                </button>

                {/* Minimize */}
                <button
                  onClick={() => updateFloatingPanel(f.id, { isMinimized: !f.isMinimized })}
                  title={f.isMinimized ? '展开窗口' : '最小化折叠'}
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>

                {/* Maximize */}
                <button
                  onClick={() => toggleMaximizePanel(f.panel.instanceId)}
                  title="最大化显示"
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>

                {/* Close */}
                <button
                  onClick={() => closePanel(f.panel.instanceId)}
                  title="关闭悬浮面板"
                  className="p-1 rounded text-ink-2 hover:text-red-700 hover:bg-red-800/10 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            {!f.isMinimized && (
              <div className="flex-1 w-full h-full overflow-hidden relative">
                <PanelWrapper
                  panel={f.panel}
                  isFloating={true}
                  showTitlebar={false}
                />
              </div>
            )}

            {/* 8-Direction Resize Handles (only when not minimized) */}
            {!f.isMinimized && (
              <>
                {/* Edge handles */}
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'e')}
                  className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'w')}
                  className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 's')}
                  className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'n')}
                  className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize"
                />

                {/* Corner handles */}
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'se')}
                  className="absolute right-0 bottom-0 w-3 h-3 cursor-se-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'sw')}
                  className="absolute left-0 bottom-0 w-3 h-3 cursor-sw-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'ne')}
                  className="absolute right-0 top-0 w-3 h-3 cursor-ne-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, f, 'nw')}
                  className="absolute left-0 top-0 w-3 h-3 cursor-nw-resize"
                />
              </>
            )}
          </div>
        );
      })}
    </>
  );
};
