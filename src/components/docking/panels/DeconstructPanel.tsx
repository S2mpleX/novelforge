import React, { Suspense, lazy } from 'react';

const DeconstructModal = lazy(() => import('@/components/modals/DeconstructModal').then(m => ({ default: m.DeconstructModal })));

export const DeconstructPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <Suspense fallback={<div className="p-4 text-xs text-ink-2">载入拆书工坊...</div>}>
        <DeconstructModal isOpen={true} onClose={() => {}} embedded={true} />
      </Suspense>
    </div>
  );
};
