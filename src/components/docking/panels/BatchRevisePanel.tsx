import React from 'react';
import { BatchReviseModal } from '@/components/modals/BatchReviseModal';

export const BatchRevisePanel: React.FC = () => {
  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-[#fcfaf7] dark:bg-[#1a1714] overflow-hidden">
      <BatchReviseModal embedded={true} />
    </div>
  );
};
