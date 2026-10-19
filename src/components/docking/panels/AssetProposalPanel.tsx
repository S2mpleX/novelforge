import React from 'react';
import { AssetProposalModal } from '@/components/modals/AssetProposalModal';

export const AssetProposalPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <AssetProposalModal isOpen={true} onClose={() => {}} embedded={true} />
    </div>
  );
};
