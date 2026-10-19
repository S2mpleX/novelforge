import React from 'react';
import { FullCheckModal } from '@/components/modals/FullCheckModal';

export const FullCheckPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-surface dark:bg-[#1a1714]">
      <FullCheckModal isOpen={true} onClose={() => {}} embedded={true} />
    </div>
  );
};
