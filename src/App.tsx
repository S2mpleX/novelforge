import React, { useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { AiAssistantPanel } from '@/components/editor/AiAssistantPanel';
import { DashboardView } from '@/components/views/DashboardView';
import { StoryBibleView } from '@/components/views/StoryBibleView';

export const App: React.FC = () => {
  const { loadNovels, loadProviders, activeTab } = useNovelStore();

  useEffect(() => {
    loadNovels();
    loadProviders();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'EDITOR' && (
            <>
              <NovelEditor />
              <AiAssistantPanel />
            </>
          )}
          {activeTab === 'DASHBOARD' && <DashboardView />}
          {(activeTab === 'CHARACTERS' || activeTab === 'WORLD' || activeTab === 'PLOTS') && (
            <StoryBibleView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
