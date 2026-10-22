import { create } from 'zustand';
import {
  WorkspaceLayout,
  WorkspacePreset,
  PanelInstance,
  PanelType,
  FloatingPanel,
  DraggingState,
  DropTargetZone,
  DropDirection,
  LayoutNode,
  TabGroupNode,
} from '@/types/docking';
import {
  BUILTIN_WORKSPACE_PRESETS,
  FOCUS_WRITING_LAYOUT,
} from '@/config/workspacePresets';
import {
  cloneTree,
  findTabGroupByPanel,
  removePanelFromTree,
  splitTabGroup,
  addTabToGroup,
  swapPanels,
  reorderTabs,
  setActiveTabInGroup,
  updateSplitSizes,
  validateAndSanitizeLayout,
  generateNodeId,
  allPanelsInTree,
  findLeftmostTabGroup,
  findRightmostTabGroup,
  findFirstTabGroup,
} from '@/utils/dockingTree';

const STORAGE_LAYOUT_KEY = 'novelforge_docking_layout';
const STORAGE_PRESETS_KEY = 'novelforge_workspace_presets';

interface WorkspaceState {
  layout: WorkspaceLayout;
  presets: Record<string, WorkspacePreset>;
  activePresetKey: string;
  draggingState: DraggingState | null;
  dropTarget: DropTargetZone | null;
  currentNovelId: string | null;

  // Actions
  loadWorkspace: (novelId?: string) => void;
  saveWorkspace: (novelId?: string) => void;
  applyPreset: (presetKey: string) => void;
  saveCurrentAsPreset: (name: string, description?: string) => string;
  deleteCustomPreset: (presetKey: string) => void;
  resetToDefaultLayout: () => void;

  // Tree manipulation
  setActiveTab: (tabGroupId: string, instanceId: string) => void;
  updateSplitSizes: (splitId: string, newSizes: number[]) => void;
  reorderTabs: (tabGroupId: string, fromIndex: number, toIndex: number) => void;
  splitTabGroup: (
    targetTabGroupId: string,
    panel: PanelInstance,
    direction: 'left' | 'right' | 'top' | 'bottom'
  ) => void;
  addTabToGroup: (targetTabGroupId: string, panel: PanelInstance, insertIndex?: number) => void;
  swapPanels: (instanceIdA: string, instanceIdB: string) => void;
  closePanel: (instanceId: string) => void;
  toggleMaximizePanel: (instanceId: string | null) => void;

  // Floating panels
  floatPanel: (
    panel: PanelInstance,
    pos?: { x: number; y: number },
    size?: { width: number; height: number }
  ) => void;
  dockFloatingPanel: (
    floatingId: string,
    targetTabGroupId?: string,
    direction?: DropDirection
  ) => void;
  dockFloatingToSidebar: (
    floatingId: string,
    side?: 'left' | 'right' | 'center'
  ) => void;
  updateFloatingPanel: (floatingId: string, updates: Partial<FloatingPanel>) => void;
  bringFloatingToFront: (floatingId: string) => void;

  // Drag & drop
  setDraggingState: (state: DraggingState | null) => void;
  setDropTarget: (target: DropTargetZone | null) => void;
  handleDrop: () => void;

  // Panel opening
  openPanel: (
    panelType: PanelType,
    params?: Record<string, any>,
    options?: { asFloating?: boolean; title?: string; preferredSide?: 'left' | 'right' }
  ) => void;
  togglePanel: (
    panelType: PanelType,
    params?: Record<string, any>,
    options?: { preferredSide?: 'left' | 'right'; title?: string }
  ) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  layout: FOCUS_WRITING_LAYOUT,
  presets: BUILTIN_WORKSPACE_PRESETS,
  activePresetKey: 'focus_writing',
  draggingState: null,
  dropTarget: null,
  currentNovelId: null,

  loadWorkspace: (novelId?: string) => {
    try {
      // 1. 加载所有预设
      const savedPresetsJson = localStorage.getItem(STORAGE_PRESETS_KEY);
      let mergedPresets = { ...BUILTIN_WORKSPACE_PRESETS };
      if (savedPresetsJson) {
        try {
          const parsedCustom = JSON.parse(savedPresetsJson);
          mergedPresets = { ...mergedPresets, ...parsedCustom };
        } catch (e) {
          console.warn('解析自定义预设失败，使用默认预设:', e);
        }
      }

      // 2. 加载当前布局
      const layoutStorageKey = novelId
        ? `${STORAGE_LAYOUT_KEY}_novel_${novelId}`
        : STORAGE_LAYOUT_KEY;
      const savedLayoutJson = localStorage.getItem(layoutStorageKey) || localStorage.getItem(STORAGE_LAYOUT_KEY);

      let layoutToUse: WorkspaceLayout = FOCUS_WRITING_LAYOUT;
      if (savedLayoutJson) {
        try {
          const parsed = JSON.parse(savedLayoutJson);
          layoutToUse = validateAndSanitizeLayout(parsed, FOCUS_WRITING_LAYOUT);
        } catch (e) {
          console.warn('解析保存布局失败，回退默认布局:', e);
        }
      }

      set({
        presets: mergedPresets,
        layout: layoutToUse,
        activePresetKey: layoutToUse.activePresetKey || 'focus_writing',
        currentNovelId: novelId || null,
      });
    } catch (e) {
      console.error('工作区初始化失败，重置为专注写作布局:', e);
      set({
        presets: BUILTIN_WORKSPACE_PRESETS,
        layout: FOCUS_WRITING_LAYOUT,
        activePresetKey: 'focus_writing',
      });
    }
  },

  saveWorkspace: (novelId?: string) => {
    try {
      if (typeof localStorage === 'undefined') return;
      const { layout, currentNovelId } = get();
      const targetNovelId = novelId || currentNovelId;
      const layoutStorageKey = targetNovelId
        ? `${STORAGE_LAYOUT_KEY}_novel_${targetNovelId}`
        : STORAGE_LAYOUT_KEY;

      localStorage.setItem(layoutStorageKey, JSON.stringify(layout));
      // 同时更新全局最近一次布局
      localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('保存工作区布局失败:', e);
    }
  },

  applyPreset: (presetKey: string) => {
    const { presets } = get();
    const preset = presets[presetKey];
    if (!preset) return;

    const newLayout: WorkspaceLayout = {
      ...preset.layout,
      activePresetKey: presetKey,
      maximizedInstanceId: null,
      // 保持深拷贝以防污染原始模板
      root: cloneTree(preset.layout.root),
      floatingPanels: preset.layout.floatingPanels.map((f) => ({ ...f })),
    };

    set({ layout: newLayout, activePresetKey: presetKey });
    get().saveWorkspace();
  },

  saveCurrentAsPreset: (name: string, description?: string) => {
    const { layout, presets } = get();
    const presetId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPreset: WorkspacePreset = {
      id: presetId,
      name,
      description: description || '用户自定义工作区预设',
      isBuiltIn: false,
      layout: {
        ...layout,
        activePresetKey: presetId,
        root: cloneTree(layout.root),
        floatingPanels: layout.floatingPanels.map((f) => ({ ...f })),
      },
    };

    const updatedPresets = { ...presets, [presetId]: newPreset };

    // 持久化仅保存自定义预设
    const customOnly: Record<string, WorkspacePreset> = {};
    for (const [key, p] of Object.entries(updatedPresets)) {
      if (!p.isBuiltIn) customOnly[key] = p;
    }
    localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(customOnly));

    set({
      presets: updatedPresets,
      activePresetKey: presetId,
      layout: { ...layout, activePresetKey: presetId },
    });
    get().saveWorkspace();
    return presetId;
  },

  deleteCustomPreset: (presetKey: string) => {
    const { presets, activePresetKey } = get();
    if (!presets[presetKey] || presets[presetKey].isBuiltIn) return;

    const nextPresets = { ...presets };
    delete nextPresets[presetKey];

    const customOnly: Record<string, WorkspacePreset> = {};
    for (const [key, p] of Object.entries(nextPresets)) {
      if (!p.isBuiltIn) customOnly[key] = p;
    }
    localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(customOnly));

    set({
      presets: nextPresets,
      activePresetKey: activePresetKey === presetKey ? 'focus_writing' : activePresetKey,
    });
  },

  resetToDefaultLayout: () => {
    get().applyPreset('focus_writing');
  },

  setActiveTab: (tabGroupId: string, instanceId: string) => {
    const { layout } = get();
    const nextRoot = setActiveTabInGroup(layout.root, tabGroupId, instanceId);
    set({ layout: { ...layout, root: nextRoot } });
    get().saveWorkspace();
  },

  updateSplitSizes: (splitId: string, newSizes: number[]) => {
    const { layout } = get();
    const nextRoot = updateSplitSizes(layout.root, splitId, newSizes);
    set({ layout: { ...layout, root: nextRoot } });
    get().saveWorkspace();
  },

  reorderTabs: (tabGroupId: string, fromIndex: number, toIndex: number) => {
    const { layout } = get();
    const nextRoot = reorderTabs(layout.root, tabGroupId, fromIndex, toIndex);
    set({ layout: { ...layout, root: nextRoot } });
    get().saveWorkspace();
  },

  splitTabGroup: (targetTabGroupId, panel, direction) => {
    const { layout } = get();
    // 先检查并在原位置移除，防止重复实例
    const { newRoot } = removePanelFromTree(layout.root, panel.instanceId);
    const rootToSplit = newRoot || layout.root;
    const finalRoot = splitTabGroup(rootToSplit, targetTabGroupId, panel, direction);

    set({ layout: { ...layout, root: finalRoot } });
    get().saveWorkspace();
  },

  addTabToGroup: (targetTabGroupId, panel, insertIndex) => {
    const { layout } = get();
    const { newRoot } = removePanelFromTree(layout.root, panel.instanceId);
    const rootToAdd = newRoot || layout.root;
    const finalRoot = addTabToGroup(rootToAdd, targetTabGroupId, panel, insertIndex);

    set({ layout: { ...layout, root: finalRoot } });
    get().saveWorkspace();
  },

  swapPanels: (instanceIdA, instanceIdB) => {
    const { layout } = get();
    const finalRoot = swapPanels(layout.root, instanceIdA, instanceIdB);
    set({ layout: { ...layout, root: finalRoot } });
    get().saveWorkspace();
  },

  closePanel: (instanceId: string) => {
    const { layout } = get();
    // 检查是否在悬浮面板中
    const floatingIdx = layout.floatingPanels.findIndex((f) => f.panel.instanceId === instanceId);
    if (floatingIdx !== -1) {
      const nextFloating = layout.floatingPanels.filter((_, i) => i !== floatingIdx);
      set({
        layout: {
          ...layout,
          floatingPanels: nextFloating,
          maximizedInstanceId:
            layout.maximizedInstanceId === instanceId ? null : layout.maximizedInstanceId,
        },
      });
      get().saveWorkspace();
      return;
    }

    // 在树中移除
    const { newRoot } = removePanelFromTree(layout.root, instanceId);
    if (!newRoot) {
      // 如果全部被关闭，保留一个纯净的空工作区容器，绝不擅自复活初始的三栏面板
      const emptyRoot: TabGroupNode = {
        type: 'tabs',
        id: 'tab_empty_workspace',
        panels: [],
        activeInstanceId: '',
      };
      set({ layout: { ...layout, root: emptyRoot, maximizedInstanceId: null } });
    } else {
      set({
        layout: {
          ...layout,
          root: newRoot,
          maximizedInstanceId:
            layout.maximizedInstanceId === instanceId ? null : layout.maximizedInstanceId,
        },
      });
    }
    get().saveWorkspace();
  },

  toggleMaximizePanel: (instanceId: string | null) => {
    const { layout } = get();
    const nextMax = layout.maximizedInstanceId === instanceId ? null : instanceId;
    set({ layout: { ...layout, maximizedInstanceId: nextMax } });
  },

  floatPanel: (panel, pos, size) => {
    const { layout } = get();
    // 1. 如果在树中，先从树中移除
    const { newRoot } = removePanelFromTree(layout.root, panel.instanceId);
    const updatedRoot: LayoutNode =
      newRoot || {
        type: 'tabs',
        id: 'tab_empty_workspace',
        panels: [],
        activeInstanceId: '',
      };

    // 2. 检查是否已经在悬浮窗中
    const existingIdx = layout.floatingPanels.findIndex((f) => f.panel.instanceId === panel.instanceId);
    if (existingIdx !== -1) {
      get().bringFloatingToFront(layout.floatingPanels[existingIdx].id);
      return;
    }

    // 3. 计算最高 z-index
    const maxZ = layout.floatingPanels.reduce((max, f) => Math.max(max, f.zIndex), 100);

    const defaultPos = pos || {
      x: 100 + (layout.floatingPanels.length % 5) * 40,
      y: 80 + (layout.floatingPanels.length % 5) * 40,
    };
    const defaultSize = size || { width: 560, height: 420 };

    const newFloating: FloatingPanel = {
      id: generateNodeId('float'),
      panel,
      position: defaultPos,
      size: defaultSize,
      zIndex: maxZ + 1,
      isMinimized: false,
    };

    set({
      layout: {
        ...layout,
        root: updatedRoot,
        floatingPanels: [...layout.floatingPanels, newFloating],
      },
    });
    get().saveWorkspace();
  },

  dockFloatingPanel: (floatingId, targetTabGroupId, direction = 'center') => {
    const { layout } = get();
    const targetFloating = layout.floatingPanels.find((f) => f.id === floatingId);
    if (!targetFloating) return;

    const remainingFloating = layout.floatingPanels.filter((f) => f.id !== floatingId);

    let nextRoot = layout.root;
    if (targetTabGroupId) {
      if (direction === 'center') {
        nextRoot = addTabToGroup(nextRoot, targetTabGroupId, targetFloating.panel);
      } else {
        nextRoot = splitTabGroup(
          nextRoot,
          targetTabGroupId,
          targetFloating.panel,
          direction as 'left' | 'right' | 'top' | 'bottom'
        );
      }
    } else {
      // 默认附加到树中的第一个 TabGroup
      const firstTab = findFirstTabGroup(nextRoot);
      if (firstTab) {
        nextRoot = addTabToGroup(nextRoot, firstTab.id, targetFloating.panel);
      }
    }

    set({
      layout: {
        ...layout,
        root: nextRoot,
        floatingPanels: remainingFloating,
      },
    });
    get().saveWorkspace();
  },

  dockFloatingToSidebar: (floatingId, side = 'left') => {
    const { layout } = get();
    const targetFloating = layout.floatingPanels.find((f) => f.id === floatingId);
    if (!targetFloating) return;

    const remainingFloating = layout.floatingPanels.filter((f) => f.id !== floatingId);
    let nextRoot = layout.root;

    if (side === 'left') {
      const leftTab = findLeftmostTabGroup(nextRoot);
      if (leftTab) {
        // 如果最左侧包含章节目录，则优先作为侧边栏标签页合并；否则拆分出新的最左侧分屏
        const hasChapters = leftTab.panels.some((p) => p.panelType === 'chapters');
        if (hasChapters) {
          nextRoot = addTabToGroup(nextRoot, leftTab.id, targetFloating.panel);
        } else {
          nextRoot = splitTabGroup(nextRoot, leftTab.id, targetFloating.panel, 'left');
        }
      }
    } else if (side === 'right') {
      const rightTab = findRightmostTabGroup(nextRoot);
      if (rightTab) {
        const hasRightTools = rightTab.panels.some(
          (p) => p.panelType === 'ai_assistant' || p.panelType === 'editor_in_chief'
        );
        if (hasRightTools) {
          nextRoot = addTabToGroup(nextRoot, rightTab.id, targetFloating.panel);
        } else {
          nextRoot = splitTabGroup(nextRoot, rightTab.id, targetFloating.panel, 'right');
        }
      }
    } else {
      const firstTab = findFirstTabGroup(nextRoot);
      if (firstTab) {
        nextRoot = addTabToGroup(nextRoot, firstTab.id, targetFloating.panel);
      }
    }

    set({
      layout: {
        ...layout,
        root: nextRoot,
        floatingPanels: remainingFloating,
      },
    });
    get().saveWorkspace();
  },

  updateFloatingPanel: (floatingId, updates) => {
    const { layout } = get();
    const updated = layout.floatingPanels.map((f) => (f.id === floatingId ? { ...f, ...updates } : f));
    set({ layout: { ...layout, floatingPanels: updated } });
    get().saveWorkspace();
  },

  bringFloatingToFront: (floatingId) => {
    const { layout } = get();
    const target = layout.floatingPanels.find((f) => f.id === floatingId);
    if (!target) return;
    const maxZ = layout.floatingPanels.reduce((max, f) => Math.max(max, f.zIndex), 100);
    const updated = layout.floatingPanels.map((f) =>
      f.id === floatingId ? { ...f, zIndex: maxZ + 1 } : f
    );
    set({ layout: { ...layout, floatingPanels: updated } });
  },

  setDraggingState: (state) => set({ draggingState: state }),
  setDropTarget: (target) => set({ dropTarget: target }),

  handleDrop: () => {
    const { draggingState, dropTarget, layout } = get();
    if (!draggingState) return;

    const { panel, sourceFloatingId } = draggingState;

    // 清理拖拽状态
    set({ draggingState: null, dropTarget: null });

    if (!dropTarget) {
      // 未落在有效停靠区域时安全取消拖拽，保持标签页在原位，严禁意外转换为悬浮窗
      return;
    }

    const { targetTabGroupId, direction } = dropTarget;

    // 如果来源是悬浮窗
    if (sourceFloatingId) {
      get().dockFloatingPanel(sourceFloatingId, targetTabGroupId, direction);
      return;
    }

    // 如果来源是树中面板
    // 1. 先从原位置安全移除
    const { newRoot } = removePanelFromTree(layout.root, panel.instanceId);
    const rootWithoutSource = newRoot || layout.root;

    // 2. 根据目标方向执行合并或拆分
    let finalRoot: LayoutNode;
    if (direction === 'center') {
      finalRoot = addTabToGroup(rootWithoutSource, targetTabGroupId, panel);
    } else if (direction === 'float') {
      get().floatPanel(panel);
      return;
    } else {
      finalRoot = splitTabGroup(rootWithoutSource, targetTabGroupId, panel, direction);
    }

    set({ layout: { ...layout, root: finalRoot } });
    get().saveWorkspace();
  },

  openPanel: (panelType, params, options) => {
    const { layout } = get();
    const instanceId = `${panelType}_${params?.id || 'main'}`;

    // 检查是否已经在树中
    const allPanels = allPanelsInTree(layout.root);
    const existingInTree = allPanels.find((p) => p.instanceId === instanceId);
    if (existingInTree) {
      // 切换到对应标签并退出最大化
      const tabGroup = findTabGroupByPanel(layout.root, instanceId);
      if (tabGroup) {
        get().setActiveTab(tabGroup.id, instanceId);
      }
      return;
    }

    // 检查是否在悬浮窗中
    const existingFloating = layout.floatingPanels.find((f) => f.panel.instanceId === instanceId);
    if (existingFloating) {
      get().bringFloatingToFront(existingFloating.id);
      return;
    }

    const newPanel: PanelInstance = {
      instanceId,
      panelType,
      title: options?.title,
      params,
    };

    if (options?.asFloating) {
      get().floatPanel(newPanel);
      return;
    }

    // 停靠到目标 TabGroup (优先根据 preferredSide 选取，默认根据 panelType 偏向右侧或左侧)
    const preferRight =
      options?.preferredSide === 'right' ||
      panelType === 'ai_assistant' ||
      panelType === 'editor_in_chief' ||
      panelType === 'review_report';

    const targetTab = preferRight
      ? findRightmostTabGroup(layout.root) || findFirstTabGroup(layout.root)
      : findFirstTabGroup(layout.root);

    if (targetTab) {
      const nextRoot = addTabToGroup(layout.root, targetTab.id, newPanel);
      set({ layout: { ...layout, root: nextRoot } });
      get().setActiveTab(targetTab.id, instanceId);
      get().saveWorkspace();
    } else {
      const nextRoot: TabGroupNode = {
        type: 'tabs',
        id: 'tab_empty_workspace',
        panels: [newPanel],
        activeInstanceId: newPanel.instanceId,
      };
      set({ layout: { ...layout, root: nextRoot } });
      get().saveWorkspace();
    }
  },

  togglePanel: (panelType, params, options) => {
    const { layout } = get();
    const instanceId = `${panelType}_${params?.id || 'main'}`;
    const allPanels = allPanelsInTree(layout.root);
    const existingInTree = allPanels.find((p) => p.instanceId === instanceId);
    const existingFloating = layout.floatingPanels.find((f) => f.panel.instanceId === instanceId);

    if (existingInTree || existingFloating) {
      // 已经打开 -> 执行收起关闭
      get().closePanel(instanceId);
      return false;
    } else {
      // 未打开 -> 在对应侧边展开
      get().openPanel(panelType, params, options);
      return true;
    }
  },
}));
