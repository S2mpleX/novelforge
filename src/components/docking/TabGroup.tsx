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
} from 'lucide-react';

interface Props {
  node: TabGroupNode;
}

export const TabGroup: React.FC<Props> = ({ node }) => {
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
  } = useWorkspaceStore();

  const activePanel =
    node.panels.find((p) => p.instanceId === node.activeInstanceId) || node.panels[0];

  // Update container rect for drop indicator
  useEffect(() => {
    if (draggingState && containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    } else {
      setContainerRect(null);
    }
  }, [draggingState]);

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



  // Tab dragging
  const handleTabPointerDown = (e: React.PointerEvent, panel: PanelInstance) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setActiveTab(node.id, panel.instanceId);

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
      if (dist > 5 && !isDragging) {
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
        useWorkspaceStore.setState((state) => {
          if (!state.draggingState) return state;
          return {
            draggingState: {
              ...state.draggingState,
              currentMousePos: { x: moveEvt.clientX, y: moveEvt.clientY },
            },
          };
        });
      }
    };

    const handlePointerUp = () => {
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
      className="w-full h-full flex flex-col overflow-hidden relative bg-[#fdfbf7]"
    >
      {/* Tabs Header Bar */}
      <div className="h-8 border-b border-[#ded5c4] bg-[#eadecb] flex items-center justify-between px-1 select-none shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-0.5 h-full overflow-x-auto scrollbar-none flex-1">
          {node.panels.map((panel) => {
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
                className={`group flex items-center gap-1.5 px-3 h-full cursor-pointer transition text-xs border-r border-[#ded5c4] select-none shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#fdfbf7] text-[#854d0e] font-bold border-t-2 border-t-amber-800 shadow-xs'
                    : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#dfd4c0]'
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
                  className="p-0.5 rounded text-[#786f65] hover:text-red-700 hover:bg-red-800/10 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Group Header Actions (Maximize/Restore, Float, Split Menu, Add) */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Maximize / Restore Panel Button (放大当前面板) */}
          {activePanel && (
            <button
              onClick={() => toggleMaximizePanel(activePanel.instanceId)}
              title={layout.maximizedInstanceId === activePanel.instanceId ? '恢复面板原始尺寸' : '最大化当前面板 (放大 / Ctrl+M)'}
              className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#dfd4c0] transition cursor-pointer"
            >
              {layout.maximizedInstanceId === activePanel.instanceId ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-800" />
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
              className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#dfd4c0] transition cursor-pointer"
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
                className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#dfd4c0] transition cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showPanelMenu && (
                <div className="absolute right-0 top-7 z-50 bg-[#fdfbf7] border border-[#d5cbb8] rounded-md shadow-lg py-1 w-36 text-xs text-[#2b2621]">
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'left');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-[#ede5d6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 text-amber-800" />
                    拆分至左侧
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'right');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-[#ede5d6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-800" />
                    拆分至右侧
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'top');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-[#ede5d6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3 text-amber-800" />
                    拆分至上方
                  </button>
                  <button
                    onClick={() => {
                      splitTabGroup(node.id, activePanel, 'bottom');
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-[#ede5d6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3 text-amber-800" />
                    拆分至下方
                  </button>
                  <div className="border-t border-[#ded5c4] my-1" />
                  <button
                    onClick={() => {
                      floatPanel(activePanel);
                      setShowPanelMenu(false);
                    }}
                    className="w-full px-2.5 py-1 text-left hover:bg-[#ede5d6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 text-amber-800" />
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
              className="p-1 rounded text-[#786f65] hover:text-[#231f1a] hover:bg-[#dfd4c0] transition flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-7 z-50 bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg shadow-xl py-1.5 w-52 max-h-80 overflow-y-auto text-xs text-[#2b2621]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[#8e8476] uppercase tracking-wider border-b border-[#eee6d8]">
                  打开工作模块
                </div>
                {allPanelTypes.map((pt) => {
                  const meta = PANEL_METADATA_MAP[pt];
                  const Icon = getPanelIcon(pt);
                  return (
                    <button
                      key={pt}
                      onClick={() => handleSelectPanelToAdd(pt)}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-[#ede5d6] flex items-center gap-2 transition cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
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
          <div className="flex-1 flex items-center justify-center text-xs text-[#786f65]">
            暂无已打开面板
          </div>
        )}

        {/* Drop indicator if hovering */}
        <DockDropIndicator tabGroupId={node.id} containerRect={containerRect} />
      </div>
    </div>
  );
};
