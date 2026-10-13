import React, { useEffect, useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NovelEditor } from '@/components/editor/NovelEditor';
import { AiAssistantPanel } from '@/components/editor/AiAssistantPanel';
import { DashboardView } from '@/components/views/DashboardView';
import { CharactersView } from '@/components/views/CharactersView';
import { WorldSettingsView } from '@/components/views/WorldSettingsView';
import { MemoryEngineView } from '@/components/views/MemoryEngineView';
import { isTauri } from '@/utils/tauriBridge';
import { Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const { loadNovels, loadProviders, activeTab, zenMode } = useNovelStore();
  const [showWebNotice, setShowWebNotice] = useState(!isTauri());

  useEffect(() => {
    loadNovels();
    loadProviders();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4efe6] ambient-bg text-[#2b2621] font-sans">
      {showWebNotice && (
        <div className="bg-[#efe9dc] border-b border-[#ded5c4] px-4 py-1.5 text-xs text-[#854d0e] flex items-center justify-between font-serif shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#854d0e] shrink-0" />
            <span>
              <strong>网页预览模式 (Web Preview)：</strong>
              检测到您在浏览器 (localhost:1420) 中打开。已启用 Web LocalStorage 与网络探测兼容层；完整 SQLite 数据库与多 Agent 守护进程请在桌面窗口运行（终端执行 <code className="bg-[#f4efe6] px-1 py-0.5 rounded border border-[#ded5c4] font-mono text-[11px]">pnpm tauri dev</code>）。
            </span>
          </div>
          <button
            onClick={() => setShowWebNotice(false)}
            className="p-1 rounded-md text-[#786f65] hover:text-[#2b2621] hover:bg-[#e5ded0] transition ml-4"
            title="关闭提示"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {!zenMode && <Sidebar />}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'EDITOR' && (
            <>
              <NovelEditor />
              {!zenMode && <AiAssistantPanel />}
            </>
          )}
          {activeTab === 'DASHBOARD' && <DashboardView />}
          {activeTab === 'CHARACTERS' && <CharactersView />}
          {activeTab === 'WORLD' && <WorldSettingsView />}
          {activeTab === 'PLOTS' && <WorldSettingsView initialTab="PLOTS" />}
          {activeTab === 'MEMORY' && <MemoryEngineView />}
        </main>
      </div>
    </div>
  );
};

export default App;
