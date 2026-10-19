import React, { useRef, useState, useEffect } from 'react';
import { TabGroupNode, PanelInstance, PanelType } from '@/types/docking';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { PANEL_METADATA_MAP, getPanelIcon } from './PanelRegistry';
import { PanelWrapper } from './PanelWrapper';
import { DockDropIndicator } from './DockDropIndicator';
import {
  X,
  Plus,
  Maximize2,
  Minimize2,
  MoreVertical,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  BookOpen,
  FolderTree,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface Props {
  node: TabGroupNode;
}

export const TabGroup: React.FC<Props> = React.memo(({ node }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const panelMenuRef = useRef<HTMLDivElement | null>(null);

  const {
    setActiveTab,
    closePanel,
    setDraggingState,
    draggingState,
    openPanel,
    toggleMaximizePanel,
    floatPanel,
    splitTabGroup,
    layout,
    reorderTabs,
    resetToDefaultLayout,
  } = useWorkspaceStore();

  const activePanel =
    node.panels.find((p) => p.instanceId === node.activeInstanceId) || node.panels[0];

  const isDraggingActive = Boolean(draggingState);

  // Update container rect for drop indicator (only once when drag begins/ends, zero reflow during drag)
  useEffect(() => {
    if (isDraggingActive && containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    } else {
      setContainerRect(null);
    }
  }, [isDraggingActive]);

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  // Close panel menu on outside click
  useEffect(() => {
    if (!showPanelMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelMenuRef.current && !panelMenuRef.current.contains(e.target as Node)) {
        setShowPanelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanelMenu]);



  // Tab dragging with rAF throttling
  const handleTabPointerDown = (e: React.PointerEvent, panel: PanelInstance) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setActiveTab(node.id, panel.instanceId);

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
          sourceTabGroupId: node.id,
          dragSource: 'tab',
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

  const handleSelectPanelToAdd = (panelType: PanelType) => {
    openPanel(panelType);
    setShowAddMenu(false);
  };

  const allPanelTypes = Object.keys(PANEL_METADATA_MAP) as PanelType[];

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col overflow-hidden relative bg-surface"
    >
      {/* Tabs Header Bar */}
      <div className="h-8 border-b border-line bg-surface-2 flex items-center justify-between px-1 select-none shrink-0 min-w-0 relative z-20">
        <div className="flex items-center gap-0.5 h-full overflow-x-auto scrollbar-none flex-1 min-w-0">
          {node.panels.length === 0 ? (
            <span className="text-[11px] text-ink-2 italic px-2">工作区（暂无已打开面板）</span>
          ) : (
            node.panels.map((panel, targetIndex) => {
              const isActive = panel.instanceId === activePanel?.instanceId;
              const meta = PANEL_METADATA_MAP[panel.panelType] || {
                title: panel.title || panel.panelType,
              };
              const IconComponent = getPanelIcon(panel.panelType);
              const title = panel.title || meta.title;

            return (
              <div
                key={panel.instanceId}
                onPointerDown={(e) => handleTabPointerDown(e, panel)}
                onPointerEnter={() => {
                  if (
                    draggingState &&
                    draggingState.sourceTabGroupId === node.id &&
                    draggingState.panel.instanceId !== panel.instanceId
                  ) {
                    const fromIndex = node.panels.findIndex(
                      (p) => p.instanceId === draggingState.panel.instanceId
                    );
                    if (fromIndex !== -1 && fromIndex !== targetIndex) {
                      reorderTabs(node.id, fromIndex, targetIndex);
                    }
                  }
                }}
                className={`group flex items-center gap-1.5 px-3 h-full cursor-pointer transition text-xs border-r border-line select-none shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-surface text-primary font-bold border-t-2 border-t-amber-800 shadow-xs'
                    : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[130px] text-[11px]">{title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closePanel(panel.instanceId);
                  }}
                  title="关闭标签"
                  className="p-0.5 rounded text-ink-2 hover:text-red-700 hover:bg-red-800/10 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }))}
        </div>

        {/* Tab Group Header Actions (Maximize/Restore, Float, Split Menu, Add) */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Maximize / Restore Panel Button (放大当前面板) */}
          {activePanel && (
            <button
              onClick={() => toggleMaximizePanel(activePanel.instanceId)}
              title={layout.maximizedInstanceId === activePanel.instanceId ? '恢复面板原始尺寸' : '最大化当前面板 (放大 / Ctrl+M)'}
              className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition cursor-pointer"
            >
              {layout.maximizedInstanceId === activePanel.instanceId ? (
                <Minimize2 className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Float Panel Shortcut */}
          {activePanel && (
            <button
              onClick={() => floatPanel(activePanel)}
              title="将此面板悬浮独立显示"
              className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Panel Operations Dropdown Menu (拆分等) */}
          {activePanel && (
            <div className="relative" ref={panelMenuRef}>
              <button
                onClick={() => setShowPanelMenu(!showPanelMenu)}
                title="面板布局拆分与管理操作"
                className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showPanelMenu && (
                <div className="absolute right-0 top-7 z-50 bg-surface border border-line rounded-md shadow-lg py-1 w-36 text-xs text-ink">
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'left');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 text-primary" />
                    拆分至左侧
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'right');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3 text-primary" />
                    拆分至右侧
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'top');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3 text-primary" />
                    拆分至上方
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'bottom');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3 text-primary" />
                    拆分至下方
                  </button>
                  <div className="border-t border-line my-1" />
                  <button
                    onClick={() => {
                      floatPanel(activePanel);
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-surface-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 text-primary" />
                    悬浮独立显示
                  </button>
                  <button
                    onClick={() => {
                      closePanel(activePanel.instanceId);
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-red-50 text-red-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    关闭面板
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add panel button in group */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              title="添加工作模块到当前组"
              className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-7 z-50 bg-surface border border-line rounded-lg shadow-xl py-1.5 w-52 max-h-80 overflow-y-auto text-xs text-ink">
                <div className="px-2.5 py-1 text-[10px] font-bold text-ink-2 uppercase tracking-wider border-b border-line">
                  打开工作模块
                </div>
                {allPanelTypes.map((pt) => {
                  const meta = PANEL_METADATA_MAP[pt];
                  const Icon = getPanelIcon(pt);
                  return (
                    <button
                      key={pt}
                      onClick={() => handleSelectPanelToAdd(pt)}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-surface-3 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{meta.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Panel Content */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {activePanel ? (
          <PanelWrapper
            key={activePanel.instanceId}
            panel={activePanel}
            tabGroupId={node.id}
            showTitlebar={false} // Tabs header already shows title
          />
        ) : (
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-surface-2">
            <div className="max-w-md w-full p-6 rounded-2xl border border-line bg-surface shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-800/10 text-primary flex items-center justify-center mx-auto">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">工作区面板已全部关闭</h3>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                  当前工作区暂无打开的功能面板。你可以点击右上角「+」自由添加模块，或通过下方快捷入口打开常用面板：
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => openPanel('editor')}
                  className="p-2.5 rounded-lg bg-[#f7f2e8] hover:bg-surface-3 border border-line text-ink font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span>打开正文编辑器</span>
                </button>
                <button
                  onClick={() => openPanel('chapters')}
                  className="p-2.5 rounded-lg bg-[#f7f2e8] hover:bg-surface-3 border border-line text-ink font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <FolderTree className="w-4 h-4 text-primary shrink-0" />
                  <span>打开章节目录</span>
                </button>
                <button
                  onClick={() => openPanel('ai_assistant')}
                  className="p-2.5 rounded-lg bg-[#f7f2e8] hover:bg-surface-3 border border-line text-ink font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>打开 AI 写作助手</span>
                </button>
                <button
                  onClick={() => openPanel('novelist_toolbox')}
                  className="p-2.5 rounded-lg bg-[#f7f2e8] hover:bg-surface-3 border border-line text-ink font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-primary shrink-0" />
                  <span>打开小说百宝箱</span>
                </button>
              </div>
              <div className="pt-3 border-t border-line flex items-center justify-between text-[11px] text-ink-2">
                <span>想恢复默认三栏？</span>
                <button
                  onClick={() => resetToDefaultLayout()}
                  className="text-primary hover:text-primary font-semibold underline cursor-pointer"
                >
                  恢复初始专注写作布局
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drop indicator if hovering */}
        <DockDropIndicator tabGroupId={node.id} containerRect={containerRect} />
      </div>
    </div>
  );
});
