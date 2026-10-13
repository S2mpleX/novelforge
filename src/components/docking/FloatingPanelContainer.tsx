import React from 'react';
import { FloatingPanel } from '@/types/docking';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { PANEL_METADATA_MAP, getPanelIcon } from './PanelRegistry';
import { PanelWrapper } from './PanelWrapper';
import {
  Minimize2,
  Maximize2,
  X,
  ArrowDownToLine,
} from 'lucide-react';

export const FloatingPanelContainer: React.FC = () => {
  const {
    layout,
    updateFloatingPanel,
    bringFloatingToFront,
    dockFloatingPanel,
    closePanel,
    toggleMaximizePanel,
  } = useWorkspaceStore();

  const handlePointerDownHeader = (e: React.PointerEvent, f: FloatingPanel) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    bringFloatingToFront(f.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...f.position };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      updateFloatingPanel(f.id, {
        position: {
          x: Math.max(10, initialPos.x + dx),
          y: Math.max(40, initialPos.y + dy),
        },
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
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
    document.body.appendChild(overlay);

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = initialPos.x;
      let newY = initialPos.y;

      if (direction.includes('e')) newWidth = Math.max(240, initialSize.width + dx);
      if (direction.includes('s')) newHeight = Math.max(180, initialSize.height + dy);
      if (direction.includes('w')) {
        const potentialW = initialSize.width - dx;
        if (potentialW >= 240) {
          newWidth = potentialW;
          newX = initialPos.x + dx;
        }
      }
      if (direction.includes('n')) {
        const potentialH = initialSize.height - dy;
        if (potentialH >= 180) {
          newHeight = potentialH;
          newY = initialPos.y + dy;
        }
      }

      updateFloatingPanel(f.id, {
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      });
    };

    const handlePointerUp = () => {
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
            className="fixed bg-[#fdfbf7] rounded-xl shadow-2xl border border-[#c8b496] flex flex-col overflow-hidden animate-in fade-in duration-150"
          >
            {/* Floating Titlebar */}
            <div
              onPointerDown={(e) => handlePointerDownHeader(e, f)}
              className="h-8 border-b border-[#ded5c4] bg-[#eadecb] px-2.5 flex items-center justify-between text-xs cursor-move select-none shrink-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-bold text-xs text-[#2c2825] truncate">
                  {title} (悬浮窗)
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Dock back into main layout */}
                <button
                  onClick={() => dockFloatingPanel(f.id)}
                  title="重新停靠回主工作台"
                  className="p-1 rounded text-[#786f65] hover:text-amber-800 hover:bg-[#dfd4c0] transition"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                </button>

                {/* Minimize */}
                <button
                  onClick={() => updateFloatingPanel(f.id, { isMinimized: !f.isMinimized })}
                  title={f.isMinimized ? '展开窗口' : '最小化折叠'}
                  className="p-1 rounded text-[#786f65] hover:text-amber-800 hover:bg-[#dfd4c0] transition"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>

                {/* Maximize */}
                <button
                  onClick={() => toggleMaximizePanel(f.panel.instanceId)}
                  title="最大化显示"
                  className="p-1 rounded text-[#786f65] hover:text-amber-800 hover:bg-[#dfd4c0] transition"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>

                {/* Close */}
                <button
                  onClick={() => closePanel(f.panel.instanceId)}
                  title="关闭悬浮面板"
                  className="p-1 rounded text-[#786f65] hover:text-red-700 hover:bg-red-800/10 transition"
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
