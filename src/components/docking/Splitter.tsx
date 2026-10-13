import React from 'react';
import { SplitOrientation } from '@/types/docking';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

interface Props {
  splitId: string;
  orientation: SplitOrientation;
  index: number; // Divider between child index and index + 1
  sizes: number[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const Splitter: React.FC<Props> = ({
  splitId,
  orientation,
  index,
  sizes,
  containerRef,
}) => {
  const { updateSplitSizes } = useWorkspaceStore();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const isHorizontal = orientation === 'horizontal';
    const totalPixels = isHorizontal ? rect.width : rect.height;
    const startCoord = isHorizontal ? e.clientX : e.clientY;

    const initialSizes = [...sizes];
    const leftSize = initialSizes[index];
    const rightSize = initialSizes[index + 1];
    const combinedPercent = leftSize + rightSize;

    // Create invisible full-screen overlay during drag to prevent iframe / react-flow event capture
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    overlay.style.userSelect = 'none';
    document.body.appendChild(overlay);

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const currentCoord = isHorizontal ? moveEvt.clientX : moveEvt.clientY;
      const deltaPx = currentCoord - startCoord;
      const deltaPercent = (deltaPx / totalPixels) * 100;

      // Min size threshold in percentage (e.g. 10% or at least 120px)
      const minPercent = Math.max(10, (120 / totalPixels) * 100);

      let newLeft = leftSize + deltaPercent;
      let newRight = rightSize - deltaPercent;

      if (newLeft < minPercent) {
        newLeft = minPercent;
        newRight = combinedPercent - minPercent;
      } else if (newRight < minPercent) {
        newRight = minPercent;
        newLeft = combinedPercent - minPercent;
      }

      const nextSizes = [...initialSizes];
      nextSizes[index] = newLeft;
      nextSizes[index + 1] = newRight;

      updateSplitSizes(splitId, nextSizes);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = () => {
    // Equalize sizes between all children
    const equalSize = 100 / sizes.length;
    const nextSizes = sizes.map(() => equalSize);
    updateSplitSizes(splitId, nextSizes);
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      title="双击恢复等分尺寸，按住拖动调整大小"
      className={`relative group shrink-0 select-none z-10 transition-colors ${
        isHorizontal
          ? 'w-1.5 cursor-col-resize hover:bg-amber-700/50 active:bg-amber-800'
          : 'h-1.5 cursor-row-resize hover:bg-amber-700/50 active:bg-amber-800'
      } bg-[#ded5c4]`}
    >
      {/* Decorative center notch */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a89b88] group-hover:bg-amber-800 transition-colors ${
          isHorizontal ? 'w-0.5 h-4' : 'w-4 h-0.5'
        }`}
      />
    </div>
  );
};
