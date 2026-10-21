import React, { Suspense, lazy } from 'react';

const AssetProposalModal = lazy(() => import('@/components/modals/AssetProposalModal').then(m => ({ default: m.AssetProposalModal })));

export const AssetProposalPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <Suspense fallback={<div className="p-4 text-xs text-ink-2">载入资产提案...</div>}>
        <AssetProposalModal isOpen={true} onClose={() => {}} embedded={true} />
      </Suspense>
    </div>
  );
};
