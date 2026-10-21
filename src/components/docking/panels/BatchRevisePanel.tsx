import React, { Suspense, lazy } from 'react';

const BatchReviseModal = lazy(() => import('@/components/modals/BatchReviseModal').then(m => ({ default: m.BatchReviseModal })));

export const BatchRevisePanel: React.FC = () => {
  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-[#fcfaf7] dark:bg-[#1a1714] overflow-hidden">
      <Suspense fallback={<div className="p-4 text-xs text-ink-2">载入批量修订...</div>}>
        <BatchReviseModal embedded={true} />
      </Suspense>
    </div>
  );
};
