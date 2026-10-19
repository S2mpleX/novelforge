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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {}

    const rect = container.getBoundingClientRect();
    const isHorizontal = orientation === 'horizontal';
    const totalPixels = isHorizontal ? rect.width : rect.height;
    const containerStart = isHorizontal ? rect.left : rect.top;

    const initialSizes = [...sizes];
    const leftSize = initialSizes[index];
    const rightSize = initialSizes[index + 1];
    const combinedPercent = leftSize + rightSize;

    // Sum of sizes of all panes preceding child `index`
    let offsetBeforePercent = 0;
    for (let i = 0; i < index; i++) {
      offsetBeforePercent += initialSizes[i];
    }

    // Min size boundary: at least 180px horizontally or 80px vertically
    const minPixelBoundary = isHorizontal ? 180 : 80;
    const computedMinPercent = Math.max(8, (minPixelBoundary / totalPixels) * 100);
    const minPercent = Math.min(computedMinPercent, combinedPercent * 0.45);

    let animationFrameId: number | null = null;
    let latestEvt: PointerEvent | null = null;

    const updatePosition = (coord: number) => {
      // Direct 1:1 cursor-following: target percentage relative to parent container
      const targetDividerPercent = ((coord - containerStart) / totalPixels) * 100;
      let newLeft = targetDividerPercent - offsetBeforePercent;

      // Clamp between min and max bounds
      if (newLeft < minPercent) {
        newLeft = minPercent;
      } else if (newLeft > combinedPercent - minPercent) {
        newLeft = combinedPercent - minPercent;
      }
      const newRight = combinedPercent - newLeft;

      const nextSizes = [...initialSizes];
      nextSizes[index] = newLeft;
      nextSizes[index + 1] = newRight;

      updateSplitSizes(splitId, nextSizes);
    };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      latestEvt = moveEvt;
      if (animationFrameId !== null) return;

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        if (!latestEvt) return;
        const currentCoord = isHorizontal ? latestEvt.clientX : latestEvt.clientY;
        updatePosition(currentCoord);
      });
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      try {
        targetEl.releasePointerCapture(upEvt.pointerId);
      } catch {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
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
          ? 'w-1.5 cursor-col-resize hover:bg-amber-700/60 active:bg-amber-800'
          : 'h-1.5 cursor-row-resize hover:bg-amber-700/60 active:bg-amber-800'
      } bg-[#ded5c4] dark:bg-[#2e2a27]` }
    >
      {/* Invisible expanded hit area (16px) for effortless mouse grabbing */}
      <div
        className={`absolute z-10 ${
          isHorizontal
            ? '-left-1.5 -right-1.5 top-0 bottom-0 cursor-col-resize'
            : '-top-1.5 -bottom-1.5 left-0 right-0 cursor-row-resize'
        }`}
      />
      {/* Decorative center notch */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a89b88] group-hover:bg-amber-800 group-active:bg-amber-900 transition-colors ${
          isHorizontal ? 'w-0.5 h-4' : 'w-4 h-0.5'
        }`}
      />
    </div>
  );
};
