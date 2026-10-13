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

export const DockDropIndicator: React.FC<Props> = ({ tabGroupId, containerRect }) => {
  const { draggingState, dropTarget, setDropTarget } = useWorkspaceStore();

  if (!draggingState || !containerRect) return null;

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

  return (
    <div className="absolute inset-0 pointer-events-auto z-40 flex items-center justify-center bg-black/10 backdrop-blur-[0.5px]">
      {/* Visual Drop Preview Rectangle */}
      {currentDirection && (
        <div
          style={getPreviewStyle()}
          className="absolute bg-amber-700/25 border-2 border-amber-600 rounded-lg pointer-events-none transition-all duration-150 flex items-center justify-center shadow-lg"
        >
          <span className="px-3 py-1.5 rounded-full bg-[#fdfbf7] text-[#854d0e] font-bold text-xs shadow-md border border-amber-600/40">
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
              : 'bg-[#fdfbf7] text-[#854d0e] border-[#d5cbb8] hover:bg-amber-800/20'
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
              : 'bg-[#fdfbf7] text-[#854d0e] border-[#d5cbb8] hover:bg-amber-800/20'
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
              : 'bg-[#fdfbf7] text-[#854d0e] border-[#d5cbb8] hover:bg-amber-800/20'
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
              : 'bg-[#fdfbf7] text-[#854d0e] border-[#d5cbb8] hover:bg-amber-800/20'
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
              : 'bg-[#fdfbf7] text-[#854d0e] border-[#d5cbb8] hover:bg-amber-800/20'
          }`}
          title="停靠在右侧"
        >
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
