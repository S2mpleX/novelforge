import React, { Suspense, lazy } from 'react';

const FullCheckModal = lazy(() => import('@/components/modals/FullCheckModal').then(m => ({ default: m.FullCheckModal })));

export const FullCheckPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <Suspense fallback={<div className="p-4 text-xs text-ink-2">载入因果体检...</div>}>
        <FullCheckModal isOpen={true} onClose={() => {}} embedded={true} />
      </Suspense>
    </div>
  );
};
