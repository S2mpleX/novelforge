import React from 'react';
import { MemoryEngineView } from '@/components/views/MemoryEngineView';

export const MemoryEnginePanel: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <MemoryEngineView />
    </div>
  );
};
