import React from 'react';
import { DropDirection } from '@/types/docking';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';

interface Props {
  tabGroupId: string;
  containerRect: DOMRect | null;
}

export const DockDropIndicator: React.FC<Props> = React.memo(({ tabGroupId, containerRect }) => {
  const isDragging = useWorkspaceStore((s) => Boolean(s.draggingState));
  const dropTarget = useWorkspaceStore((s) => s.dropTarget);
  const setDropTarget = useWorkspaceStore((s) => s.setDropTarget);

  if (!isDragging || !containerRect) return null;

  const handlePointerEnterZone = (direction: DropDirection) => {
    setDropTarget({
      targetTabGroupId: tabGroupId,
      direction,
      rect: {
        x: containerRect.left,
        y: containerRect.top,
        width: containerRect.width,
        height: containerRect.height,
      },
    });
  };

  const isCurrentTarget = dropTarget?.targetTabGroupId === tabGroupId;
  const currentDirection = isCurrentTarget ? dropTarget.direction : null;

  // Calculate preview rect style
  const getPreviewStyle = (): React.CSSProperties => {
    switch (currentDirection) {
      case 'left':
        return { top: 0, left: 0, width: '50%', height: '100%' };
      case 'right':
        return { top: 0, right: 0, width: '50%', height: '100%' };
      case 'top':
        return { top: 0, left: 0, width: '100%', height: '50%' };
      case 'bottom':
        return { bottom: 0, left: 0, width: '100%', height: '50%' };
      case 'center':
      default:
        return { inset: '8px' };
    }
  };

  const getDirectionText = () => {
    switch (currentDirection) {
      case 'left':
        return '← 停靠在左侧';
      case 'right':
        return '停靠在右侧 →';
      case 'top':
        return '↑ 停靠在顶部';
      case 'bottom':
        return '↓ 停靠在底部';
      case 'center':
        return '⧉ 合并为标签页';
      default:
        return '';
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRect) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const relX = (mouseX - containerRect.left) / containerRect.width;
    const relY = (mouseY - containerRect.top) / containerRect.height;

    // Outer 28% threshold for left/right/top/bottom docking zones
    const distLeft = relX;
    const distRight = 1 - relX;
    const distTop = relY;
    const distBottom = 1 - relY;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    let direction: DropDirection = 'center';
    if (minDist < 0.28) {
      if (minDist === distLeft) direction = 'left';
      else if (minDist === distRight) direction = 'right';
      else if (minDist === distTop) direction = 'top';
      else direction = 'bottom';
    } else {
      direction = 'center';
    }

    if (!dropTarget || dropTarget.targetTabGroupId !== tabGroupId || dropTarget.direction !== direction) {
      setDropTarget({
        targetTabGroupId: tabGroupId,
        direction,
        rect: {
          x: containerRect.left,
          y: containerRect.top,
          width: containerRect.width,
          height: containerRect.height,
        },
      });
    }
  };

  const handleOverlayPointerLeave = () => {
    if (dropTarget?.targetTabGroupId === tabGroupId) {
      setDropTarget(null);
    }
  };

  return (
    <div
      onPointerMove={handleOverlayPointerMove}
      onPointerLeave={handleOverlayPointerLeave}
      className="absolute inset-0 pointer-events-auto z-40 flex items-center justify-center bg-black/10"
    >
      {/* Visual Drop Preview Rectangle */}
      {currentDirection && (
        <div
          style={getPreviewStyle()}
          className="absolute bg-amber-700/25 border-2 border-amber-600 rounded-lg pointer-events-none transition-all duration-150 flex items-center justify-center shadow-lg"
        >
          <span className="px-3 py-1.5 rounded-full bg-surface text-primary font-bold text-xs shadow-md border border-amber-600/40">
            {getDirectionText()}
          </span>
        </div>
      )}

      {/* 5-Zone Cross Docking Compass */}
      <div className="relative w-40 h-40 flex items-center justify-center z-50">
        {/* Center / Merge Tab */}
        <div
          onPointerEnter={() => handlePointerEnterZone('center')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition shadow-md border ${
            currentDirection === 'center'
              ? 'bg-amber-800 text-white border-amber-900 scale-110'
              : 'bg-surface text-primary border-line hover:bg-amber-800/20'
          }`}
          title="拖入此处合并为标签页"
        >
          <Layers className="w-5 h-5" />
        </div>

        {/* Top */}
        <div
          onPointerEnter={() => handlePointerEnterZone('top')}
          className={`absolute top-0 w-12 h-10 rounded-t-lg flex items-center justify-center cursor-pointer transition shadow-md border ${
            currentDirection === 'top'
              ? 'bg-amber-800 text-white border-amber-900 scale-110'
              : 'bg-surface text-primary border-line hover:bg-amber-800/20'
          }`}
          title="停靠在上方"
        >
          <ArrowUp className="w-5 h-5" />
        </div>

        {/* Bottom */}
        <div
          onPointerEnter={() => handlePointerEnterZone('bottom')}
          className={`absolute bottom-0 w-12 h-10 rounded-b-lg flex items-center justify-center cursor-pointer transition shadow-md border ${
            currentDirection === 'bottom'
              ? 'bg-amber-800 text-white border-amber-900 scale-110'
              : 'bg-surface text-primary border-line hover:bg-amber-800/20'
          }`}
          title="停靠在下方"
        >
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Left */}
        <div
          onPointerEnter={() => handlePointerEnterZone('left')}
          className={`absolute left-0 w-10 h-12 rounded-l-lg flex items-center justify-center cursor-pointer transition shadow-md border ${
            currentDirection === 'left'
              ? 'bg-amber-800 text-white border-amber-900 scale-110'
              : 'bg-surface text-primary border-line hover:bg-amber-800/20'
          }`}
          title="停靠在左侧"
        >
          <ArrowLeft className="w-5 h-5" />
        </div>

        {/* Right */}
        <div
          onPointerEnter={() => handlePointerEnterZone('right')}
          className={`absolute right-0 w-10 h-12 rounded-r-lg flex items-center justify-center cursor-pointer transition shadow-md border ${
            currentDirection === 'right'
              ? 'bg-amber-800 text-white border-amber-900 scale-110'
              : 'bg-surface text-primary border-line hover:bg-amber-800/20'
          }`}
          title="停靠在右侧"
        >
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
});
