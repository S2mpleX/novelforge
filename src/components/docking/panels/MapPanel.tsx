import React from 'react';
import { MapModal } from '@/components/modals/MapModal';

export const MapPanel: React.FC = () => {
  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-surface-2 dark:bg-[#1a1714] overflow-hidden">
      <MapModal embedded={true} />
    </div>
  );
};
