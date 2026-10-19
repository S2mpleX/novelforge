import React from 'react';
import { DeconstructModal } from '@/components/modals/DeconstructModal';

export const DeconstructPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <DeconstructModal isOpen={true} onClose={() => {}} embedded={true} />
    </div>
  );
};
