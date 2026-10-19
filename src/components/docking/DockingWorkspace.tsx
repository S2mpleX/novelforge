import React, { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useNovelStore } from '@/stores/useNovelStore';
import { LayoutRenderer } from './LayoutRenderer';
import { FloatingPanelContainer } from './FloatingPanelContainer';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { PanelWrapper } from './PanelWrapper';
import { PANEL_METADATA_MAP } from './PanelRegistry';
import { allPanelsInTree } from '@/utils/dockingTree';
import { X } from 'lucide-react';

const DraggingGhostPill: React.FC = React.memo(() => {
  const draggingState = useWorkspaceStore((s) => s.draggingState);
  if (!draggingState || draggingState.dragSource === 'floating') return null;

  return (
    <div
      style={{
        left: `${draggingState.currentMousePos.x - draggingState.offset.x}px`,
        top: `${draggingState.currentMousePos.y - draggingState.offset.y}px`,
      }}
      className="fixed pointer-events-none z-[9999] px-3 py-1.5 rounded-lg bg-surface border-2 border-amber-800 text-primary font-bold text-xs shadow-2xl flex items-center gap-2 opacity-95 animate-pulse"
    >
      <span className="w-2 h-2 rounded-full bg-amber-800" />
      <span>
        {draggingState.panel.title ||
          PANEL_METADATA_MAP[draggingState.panel.panelType]?.title ||
          '拖动模块'}
      </span>
    </div>
  );
});

export const DockingWorkspace: React.FC = () => {
  const {
    layout,
    loadWorkspace,
    toggleMaximizePanel,
  } = useWorkspaceStore();
  const { activeNovel, zenMode } = useNovelStore();

  useEffect(() => {
    loadWorkspace(activeNovel?.id);
  }, [activeNovel?.id]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+M or Cmd+M: Toggle maximize
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (layout.maximizedInstanceId) {
          toggleMaximizePanel(null);
        } else {
          // Maximize active chapter editor if available
          toggleMaximizePanel('editor_main');
        }
      }
      // Escape: Exit maximized panel mode
      if (e.key === 'Escape' && layout.maximizedInstanceId) {
        toggleMaximizePanel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layout.maximizedInstanceId, toggleMaximizePanel]);

  // Find maximized panel if active
  const maximizedPanel = layout.maximizedInstanceId
    ? allPanelsInTree(layout.root).find((p) => p.instanceId === layout.maximizedInstanceId) ||
      layout.floatingPanels.find((f) => f.panel.instanceId === layout.maximizedInstanceId)?.panel
    : null;

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative bg-canvas">
      {/* Workspace Sub-Toolbar */}
      {!zenMode && <WorkspaceToolbar />}

      {/* Main Layout Area */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {maximizedPanel ? (
          <div className="w-full h-full flex flex-col z-30 bg-surface relative">
            <div className="h-8 bg-surface-2 border-b border-line px-3 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span>[已最大化独占模式]</span>
                <span>{maximizedPanel.title || PANEL_METADATA_MAP[maximizedPanel.panelType]?.title}</span>
              </span>
              <button
                onClick={() => toggleMaximizePanel(null)}
                className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium transition flex items-center gap-1.5 text-[11px] cursor-pointer shadow-xs active:scale-95 group"
                title="退出最大化独占模式 (Esc / 点击恢复)"
              >
                <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>退出最大化 (Esc)</span>
              </button>
            </div>
            <div className="flex-1 w-full h-full overflow-hidden">
              <PanelWrapper
                panel={maximizedPanel}
                isMaximized={true}
                showTitlebar={false}
              />
            </div>
          </div>
        ) : (
          <LayoutRenderer node={layout.root} />
        )}

        {/* Floating Windows Layer */}
        {!zenMode && !maximizedPanel && <FloatingPanelContainer />}

        {/* Dragging Ghost Cursor Pill */}
        <DraggingGhostPill />
      </div>
    </div>
  );
};
