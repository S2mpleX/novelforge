import React from 'react';
import { SkillsManagerView } from '@/features/skills/components/SkillsManagerView';

export const SkillsManagerPanel: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto overscroll-contain">
      <SkillsManagerView />
    </div>
  );
};
