import React from 'react';
import { AiAssistantPanel as CoreAiAssistantPanel } from '@/components/editor/AiAssistantPanel';

export const AiAssistantPanelWrapper: React.FC = () => {
  return (
    <div className="w-full h-full min-w-[240px] flex flex-col overflow-hidden">
      <CoreAiAssistantPanel />
    </div>
  );
};
