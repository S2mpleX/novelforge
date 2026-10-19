import React, { useState, useRef, useEffect } from 'react';
import { PanelInstance } from '@/types/docking';
import { PANEL_METADATA_MAP, getPanelIcon, renderPanelComponent } from './PanelRegistry';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Props {
  panel: PanelInstance;
  tabGroupId?: string;
  isFloating?: boolean;
  isMaximized?: boolean;
  showTitlebar?: boolean;
}

export const PanelWrapper: React.FC<Props> = ({
  panel,
  tabGroupId,
  isFloating = false,
  isMaximized = false,
  showTitlebar = true,
}) => {
  const {
    closePanel,
    toggleMaximizePanel,
    floatPanel,
    splitTabGroup,
    setDraggingState,
  } = useWorkspaceStore();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const meta = PANEL_METADATA_MAP[panel.panelType] || {
    title: panel.title || panel.panelType,
    iconName: 'Book',
  };
  const IconComponent = getPanelIcon(panel.panelType);
  const displayTitle = panel.title || meta.title;

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Pointer drag for panel header
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    // Only left button
    if (e.button !== 0) return;
    // Don't drag if clicking buttons or menu
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.panel-menu')) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    let animationFrameId: number | null = null;
    let latestEvt: PointerEvent | null = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
      if (dist > 15 && !isDragging) {
        isDragging = true;
        setDraggingState({
          panel,
          sourceTabGroupId: tabGroupId,
          dragSource: 'header',
          startMousePos: { x: startX, y: startY },
          currentMousePos: { x: moveEvt.clientX, y: moveEvt.clientY },
          offset: { x: 40, y: 15 },
        });
      } else if (isDragging) {
        latestEvt = moveEvt;
        if (animationFrameId !== null) return;
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null;
          if (!latestEvt) return;
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
      if (isDragging) {
        useWorkspaceStore.getState().handleDrop();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface overflow-hidden select-none border border-line dark:border-[#2e2a27]">
      {/* Panel Header */}
      {showTitlebar && (
        <div
          onPointerDown={handleHeaderPointerDown}
          className="h-7 border-b border-line bg-surface-2/80 px-2 flex items-center justify-between text-xs cursor-grab active:cursor-grabbing shrink-0 select-none"
        >
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <IconComponent className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-[11px] text-ink truncate">
              {displayTitle}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Float / Unfloat */}
            {!isFloating && (
              <button
                onClick={() => floatPanel(panel)}
                title="悬浮为此面板独立浮窗"
                className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {/* Maximize */}
            <button
              onClick={() => toggleMaximizePanel(panel.instanceId)}
              title={isMaximized ? '恢复原始窗口大小' : '最大化当前面板'}
              className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition"
            >
              {isMaximized ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </button>

            {/* Menu */}
            {tabGroupId && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  title="面板布局操作"
                  className="p-1 rounded text-ink-2 hover:text-primary hover:bg-surface-3-hover transition"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>

                {showMenu && (
                  <div className="panel-menu absolute right-0 top-6 z-50 bg-surface border border-line rounded-md shadow-lg py-1 w-36 text-xs text-ink">
                    <button
                      onClick={() => {
                        splitTabGroup(tabGroupId, panel, 'left');
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3 h-3 text-primary" />
                      拆分至左侧
                    </button>
                    <button
                      onClick={() => {
                        splitTabGroup(tabGroupId, panel, 'right');
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3 h-3 text-primary" />
                      拆分至右侧
                    </button>
                    <button
                      onClick={() => {
                        splitTabGroup(tabGroupId, panel, 'top');
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5"
                    >
                      <ArrowUp className="w-3 h-3 text-primary" />
                      拆分至上方
                    </button>
                    <button
                      onClick={() => {
                        splitTabGroup(tabGroupId, panel, 'bottom');
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5"
                    >
                      <ArrowDown className="w-3 h-3 text-primary" />
                      拆分至下方
                    </button>
                    <div className="border-t border-line my-1" />
                    <button
                      onClick={() => {
                        floatPanel(panel);
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3 text-primary" />
                      悬浮独立显示
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => closePanel(panel.instanceId)}
              title="关闭此面板视图"
              className="p-1 rounded text-ink-2 hover:text-red-700 hover:bg-red-800/10 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {renderPanelComponent(panel)}
      </div>
    </div>
  );
};
