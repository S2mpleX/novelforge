import React, { useState, useEffect } from 'react';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { ZenChapterDrawer } from './ZenChapterDrawer';
import { ZenFloatingIsland } from './ZenFloatingIsland';
import { useNovelStore } from '@/stores/useNovelStore';

export const ZenWritingWorkspace: React.FC = () => {
  const { exitZenMode } = useNovelStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 全局 Escape 键分层响应：若章节抽屉展开则优先关闭抽屉，否则退出沉浸写作模式返回专业工坊
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawerOpen) {
          e.preventDefault();
          setIsDrawerOpen(false);
        } else {
          e.preventDefault();
          exitZenMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, exitZenMode]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-canvas select-text">
      {/* 1. 左侧轻量章节速览抽屉与边缘触发按钮 */}
      <ZenChapterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggle={() => setIsDrawerOpen((v) => !v)}
      />

      {/* 2. 居中独占主正文编辑器 */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <NovelEditor />
      </div>

      {/* 3. 案头极简磨砂浮岛（章节穿梭、字数流向、存盘微标、专注模式开关与退出工坊） */}
      <ZenFloatingIsland
        onOpenChapterDrawer={() => setIsDrawerOpen(true)}
      />
    </div>
  );
};
