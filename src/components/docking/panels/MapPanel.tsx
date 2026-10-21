import React, { Suspense, lazy } from 'react';

const MapModal = lazy(() => import('@/components/modals/MapModal').then(m => ({ default: m.MapModal })));

export const MapPanel: React.FC = () => {
  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-surface-2 dark:bg-[#1a1714] overflow-hidden">
      <Suspense fallback={<div className="p-4 text-xs text-ink-2">载入沙盘地图...</div>}>
        <MapModal embedded={true} />
      </Suspense>
    </div>
  );
};
