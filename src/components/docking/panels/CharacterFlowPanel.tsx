import React from 'react';
import { CharacterFlowView } from '@/components/views/CharacterFlowView';
import { useNovelStore } from '@/stores/useNovelStore';

export const CharacterFlowPanel: React.FC = () => {
  const { activeNovel } = useNovelStore();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <CharacterFlowView novelId={activeNovel?.id || ''} />
    </div>
  );
};
