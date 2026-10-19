import {
  LayoutNode,
  SplitNode,
  TabGroupNode,
  PanelInstance,
  WorkspaceLayout,
  SplitOrientation,
} from '@/types/docking';

let counter = 0;
export function generateNodeId(prefix = 'node'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}_${counter}`;
}

/**
 * 深度克隆布局节点树
 */
export function cloneTree(node: LayoutNode): LayoutNode {
  if (node.type === 'tabs') {
    return {
      type: 'tabs',
      id: node.id,
      panels: node.panels.map((p) => ({ ...p, params: p.params ? { ...p.params } : undefined })),
      activeInstanceId: node.activeInstanceId,
    };
  }

  return {
    type: 'split',
    id: node.id,
    orientation: node.orientation,
    children: node.children.map(cloneTree),
    sizes: [...node.sizes],
  };
}

/**
 * 递归查找具有指定 ID 的节点
 */
export function findNodeById(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  if (root.type === 'split') {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 查找指定节点的父 SplitNode 及其在 children 中的索引
 */
export function findParentSplit(
  root: LayoutNode,
  childId: string
): { parent: SplitNode; index: number } | null {
  if (root.type !== 'split') return null;

  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.id === childId) {
      return { parent: root, index: i };
    }
    if (child.type === 'split') {
      const found = findParentSplit(child, childId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 查找包含指定 instanceId 的 TabGroupNode
 */
export function findTabGroupByPanel(root: LayoutNode, instanceId: string): TabGroupNode | null {
  if (root.type === 'tabs') {
    if (root.panels.some((p) => p.instanceId === instanceId)) {
      return root;
    }
    return null;
  }

  for (const child of root.children) {
    const found = findTabGroupByPanel(child, instanceId);
    if (found) return found;
  }
  return null;
}

/**
 * 递归查找最左侧的 TabGroup 节点（侧边栏主位）
 */
export function findLeftmostTabGroup(root: LayoutNode): TabGroupNode | null {
  if (root.type === 'tabs') return root;
  if (!root.children || root.children.length === 0) return null;
  return findLeftmostTabGroup(root.children[0]);
}

/**
 * 递归查找最右侧的 TabGroup 节点（右侧工具栏主位）
 */
export function findRightmostTabGroup(root: LayoutNode): TabGroupNode | null {
  if (root.type === 'tabs') return root;
  if (!root.children || root.children.length === 0) return null;
  return findRightmostTabGroup(root.children[root.children.length - 1]);
}

/**
 * 查找树中第一个可用的 TabGroup 节点
 */
export function findFirstTabGroup(root: LayoutNode): TabGroupNode | null {
  if (root.type === 'tabs') return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findFirstTabGroup(child);
    if (found) return found;
  }
  return null;
}

/**
 * 获取树中所有的 PanelInstance 列表
 */
export function allPanelsInTree(root: LayoutNode | null): PanelInstance[] {
  if (!root) return [];
  if (root.type === 'tabs') {
    return [...root.panels];
  }
  const result: PanelInstance[] = [];
  for (const child of root.children) {
    result.push(...allPanelsInTree(child));
  }
  return result;
}

/**
 * 重新归一化百分比大小数组，确保和为 100
 */
export function normalizeSizes(sizes: number[]): number[] {
  if (sizes.length === 0) return [];
  if (sizes.length === 1) return [100];
  const total = sizes.reduce((sum, s) => sum + Math.max(5, s), 0);
  if (total <= 0) {
    const equal = 100 / sizes.length;
    return sizes.map(() => equal);
  }
  return sizes.map((s) => (Math.max(5, s) / total) * 100);
}

/**
 * 从树中移除指定 panelInstanceId，并自平衡剪枝空节点
 */
export function removePanelFromTree(
  root: LayoutNode,
  instanceId: string
): { newRoot: LayoutNode | null; removedPanel: PanelInstance | null } {
  let removed: PanelInstance | null = null;

  function prune(node: LayoutNode): LayoutNode | null {
    if (node.type === 'tabs') {
      const idx = node.panels.findIndex((p) => p.instanceId === instanceId);
      if (idx === -1) return node;

      removed = node.panels[idx];
      const nextPanels = node.panels.filter((_, i) => i !== idx);
      if (nextPanels.length === 0) {
        return null; // 节点已空，剪除
      }

      let nextActiveId = node.activeInstanceId;
      if (node.activeInstanceId === instanceId) {
        const nextIdx = Math.min(idx, nextPanels.length - 1);
        nextActiveId = nextPanels[nextIdx].instanceId;
      }

      return {
        ...node,
        panels: nextPanels,
        activeInstanceId: nextActiveId,
      };
    }

    // Split 节点剪枝
    const newChildren: LayoutNode[] = [];
    const newSizes: number[] = [];

    for (let i = 0; i < node.children.length; i++) {
      const childResult = prune(node.children[i]);
      if (childResult !== null) {
        newChildren.push(childResult);
        newSizes.push(node.sizes[i] || 100 / node.children.length);
      }
    }

    if (newChildren.length === 0) {
      return null;
    }

    if (newChildren.length === 1) {
      // 只有一个子节点时，将其提升替代本 SplitNode
      return newChildren[0];
    }

    return {
      ...node,
      children: newChildren,
      sizes: normalizeSizes(newSizes),
    };
  }

  const newRoot = prune(cloneTree(root));
  return { newRoot, removedPanel: removed };
}

/**
 * 在目标 TabGroup 上执行拆分 (Split)
 * direction: 'left' | 'right' | 'top' | 'bottom'
 */
export function splitTabGroup(
  root: LayoutNode,
  targetTabGroupId: string,
  newPanel: PanelInstance,
  direction: 'left' | 'right' | 'top' | 'bottom'
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const targetNode = findNodeById(clonedRoot, targetTabGroupId);
  if (!targetNode || targetNode.type !== 'tabs') {
    return clonedRoot;
  }

  const orientation: SplitOrientation =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';
  const isBefore = direction === 'left' || direction === 'top';

  const newTabGroup: TabGroupNode = {
    type: 'tabs',
    id: generateNodeId('tabgroup'),
    panels: [newPanel],
    activeInstanceId: newPanel.instanceId,
  };

  const parentInfo = findParentSplit(clonedRoot, targetTabGroupId);

  // 如果父节点正好与当前拆分方向一致，则直接在父节点同层级插入
  if (parentInfo && parentInfo.parent.orientation === orientation) {
    const { parent, index } = parentInfo;
    const insertIndex = isBefore ? index : index + 1;
    const targetSize = parent.sizes[index] || 100 / parent.children.length;
    const halfSize = targetSize / 2;

    const newChildren = [...parent.children];
    newChildren.splice(insertIndex, 0, newTabGroup);

    const newSizes = [...parent.sizes];
    newSizes[index] = halfSize;
    newSizes.splice(insertIndex, 0, halfSize);

    parent.children = newChildren;
    parent.sizes = normalizeSizes(newSizes);
    return clonedRoot;
  }

  // 否则，用一个新的 SplitNode 替换 targetNode
  const children = isBefore ? [newTabGroup, targetNode] : [targetNode, newTabGroup];
  const replacementSplit: SplitNode = {
    type: 'split',
    id: generateNodeId('split'),
    orientation,
    children,
    sizes: [50, 50],
  };

  if (!parentInfo) {
    // targetNode 就是根节点
    return replacementSplit;
  }

  parentInfo.parent.children[parentInfo.index] = replacementSplit;
  return clonedRoot;
}

/**
 * 将面板作为 Tab 追加或插入到目标 TabGroup
 */
export function addTabToGroup(
  root: LayoutNode,
  targetTabGroupId: string,
  newPanel: PanelInstance,
  insertIndex?: number
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const targetNode = findNodeById(clonedRoot, targetTabGroupId);
  if (!targetNode || targetNode.type !== 'tabs') {
    return clonedRoot;
  }

  // 检查是否已包含相同 instanceId，防止重复
  const existingIdx = targetNode.panels.findIndex((p) => p.instanceId === newPanel.instanceId);
  if (existingIdx !== -1) {
    targetNode.activeInstanceId = newPanel.instanceId;
    return clonedRoot;
  }

  const newPanels = [...targetNode.panels];
  if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= newPanels.length) {
    newPanels.splice(insertIndex, 0, newPanel);
  } else {
    newPanels.push(newPanel);
  }

  targetNode.panels = newPanels;
  targetNode.activeInstanceId = newPanel.instanceId;
  return clonedRoot;
}

/**
 * 交换两个 PanelInstance 的位置
 */
export function swapPanels(
  root: LayoutNode,
  instanceIdA: string,
  instanceIdB: string
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const groupA = findTabGroupByPanel(clonedRoot, instanceIdA);
  const groupB = findTabGroupByPanel(clonedRoot, instanceIdB);
  if (!groupA || !groupB) return clonedRoot;

  const idxA = groupA.panels.findIndex((p) => p.instanceId === instanceIdA);
  const idxB = groupB.panels.findIndex((p) => p.instanceId === instanceIdB);
  if (idxA === -1 || idxB === -1) return clonedRoot;

  const panelA = groupA.panels[idxA];
  const panelB = groupB.panels[idxB];

  groupA.panels[idxA] = panelB;
  groupB.panels[idxB] = panelA;

  if (groupA.activeInstanceId === instanceIdA) groupA.activeInstanceId = panelB.instanceId;
  if (groupB.activeInstanceId === instanceIdB) groupB.activeInstanceId = panelA.instanceId;

  return clonedRoot;
}

/**
 * 在同一个 TabGroup 内重排标签页顺序
 */
export function reorderTabs(
  root: LayoutNode,
  tabGroupId: string,
  fromIndex: number,
  toIndex: number
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const targetNode = findNodeById(clonedRoot, tabGroupId);
  if (!targetNode || targetNode.type !== 'tabs') return clonedRoot;

  const panels = [...targetNode.panels];
  if (fromIndex < 0 || fromIndex >= panels.length || toIndex < 0 || toIndex >= panels.length) {
    return clonedRoot;
  }

  const [moved] = panels.splice(fromIndex, 1);
  panels.splice(toIndex, 0, moved);
  targetNode.panels = panels;

  return clonedRoot;
}

/**
 * 设置 TabGroup 当前激活的面板
 */
export function setActiveTabInGroup(
  root: LayoutNode,
  tabGroupId: string,
  instanceId: string
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const targetNode = findNodeById(clonedRoot, tabGroupId);
  if (!targetNode || targetNode.type !== 'tabs') return clonedRoot;

  if (targetNode.panels.some((p) => p.instanceId === instanceId)) {
    targetNode.activeInstanceId = instanceId;
  }
  return clonedRoot;
}

/**
 * 更新 SplitNode 子节点的尺寸百分比
 */
export function updateSplitSizes(
  root: LayoutNode,
  splitId: string,
  newSizes: number[]
): LayoutNode {
  const clonedRoot = cloneTree(root);
  const targetNode = findNodeById(clonedRoot, splitId);
  if (!targetNode || targetNode.type !== 'split') return clonedRoot;

  targetNode.sizes = normalizeSizes(newSizes);
  return clonedRoot;
}

/**
 * 校验并修复布局结构（防崩与容错机制）
 */
export function validateAndSanitizeLayout(
  layout: unknown,
  fallbackLayout: WorkspaceLayout
): WorkspaceLayout {
  if (!layout || typeof layout !== 'object') {
    return fallbackLayout;
  }

  const candidate = layout as Partial<WorkspaceLayout>;
  if (!candidate.root || typeof candidate.root !== 'object') {
    return fallbackLayout;
  }

  function validateNode(node: unknown): LayoutNode | null {
    if (!node || typeof node !== 'object') return null;
    const n = node as any;

    if (n.type === 'tabs') {
      if (!Array.isArray(n.panels)) return null;
      const validPanels: PanelInstance[] = n.panels.filter(
        (p: any) => p && typeof p === 'object' && typeof p.instanceId === 'string' && typeof p.panelType === 'string'
      );
      if (validPanels.length === 0) {
        if (n.id === 'tab_empty_workspace') {
          return {
            type: 'tabs',
            id: 'tab_empty_workspace',
            panels: [],
            activeInstanceId: '',
          };
        }
        return null;
      }
      const activeId = validPanels.some((p) => p.instanceId === n.activeInstanceId)
        ? n.activeInstanceId
        : validPanels[0].instanceId;
      return {
        type: 'tabs',
        id: typeof n.id === 'string' ? n.id : generateNodeId('tabgroup'),
        panels: validPanels,
        activeInstanceId: activeId,
      };
    }

    if (n.type === 'split') {
      if (!Array.isArray(n.children) || n.children.length === 0) return null;
      const validChildren: LayoutNode[] = [];
      const validSizes: number[] = [];

      for (let i = 0; i < n.children.length; i++) {
        const validatedChild = validateNode(n.children[i]);
        if (validatedChild) {
          validChildren.push(validatedChild);
          validSizes.push(typeof n.sizes?.[i] === 'number' ? n.sizes[i] : 100 / n.children.length);
        }
      }

      if (validChildren.length === 0) return null;
      if (validChildren.length === 1) return validChildren[0];

      return {
        type: 'split',
        id: typeof n.id === 'string' ? n.id : generateNodeId('split'),
        orientation: n.orientation === 'vertical' ? 'vertical' : 'horizontal',
        children: validChildren,
        sizes: normalizeSizes(validSizes),
      };
    }

    return null;
  }

  const validatedRoot = validateNode(candidate.root);
  if (!validatedRoot) {
    return fallbackLayout;
  }

  return {
    version: typeof candidate.version === 'number' ? candidate.version : 1,
    root: validatedRoot,
    floatingPanels: Array.isArray(candidate.floatingPanels) ? candidate.floatingPanels : [],
    maximizedInstanceId: candidate.maximizedInstanceId || null,
    activePresetKey: candidate.activePresetKey || fallbackLayout.activePresetKey,
  };
}
