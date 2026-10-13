import React from 'react';
import { NovelEditor } from '@/components/editor/NovelEditor';

interface Props {
  instanceId?: string;
  params?: Record<string, any>;
}

export const EditorPanel: React.FC<Props> = ({ instanceId }) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative" data-editor-instance={instanceId}>
      <NovelEditor />
    </div>
  );
};
