import React from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { PlotArcsView } from '@/components/views/PlotArcsView';

export const StoryArcsPanel: React.FC = () => {
  const { activeNovel } = useNovelStore();

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#786f65] p-6 text-center">
        请选择或创建小说项目以管理故事弧
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <PlotArcsView novelId={activeNovel.id} />
    </div>
  );
};
