import React, { useEffect, useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardView } from '@/components/views/DashboardView';
import { CharactersView } from '@/components/views/CharactersView';
import { WorldSettingsView } from '@/components/views/WorldSettingsView';
import { MemoryEngineView } from '@/components/views/MemoryEngineView';
import { DockingWorkspace } from '@/components/docking/DockingWorkspace';
import { useUpdateStore } from '@/features/updater/stores/useUpdateStore';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { isTauri } from '@/utils/tauriBridge';
import { Sparkles, ArrowRight, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const { loadNovels, loadProviders, activeTab, zenMode, themeMode } = useNovelStore();
  const { status, latestVersion, settings, loadSettings, checkForUpdates } = useUpdateStore();
  const [showWebNotice, setShowWebNotice] = useState(!isTauri());
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    loadNovels();
    loadProviders();
    loadSettings();

    // 启动时后台非阻塞静默检查更新（延迟 3 秒）
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    // Apply saved UI scale
    const savedScale = parseInt(localStorage.getItem('novelforge_ui_scale') || '100', 10);
    if (!isNaN(savedScale) && savedScale >= 75 && savedScale <= 150) {
      document.documentElement.style.zoom = `${savedScale}%`;
    }

    return () => clearTimeout(timer);
  }, []);

  // Dynamically apply themeMode to document root
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#f4efe6] ambient-bg text-[#2b2621] font-sans">
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
      {/* New version notification banner */}
      {status === 'UPDATE_AVAILABLE' && settings.notifyNewVersion && showUpdateBanner && (
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 border-b border-amber-600/50 px-4 py-2 text-xs text-white flex items-center justify-between font-serif shrink-0 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>
              <strong>发现 NovelForge AI 新版本 v{latestVersion}！</strong> 包含多项创作引擎升级与稳定性优化，建议及时更新以获取最佳体验。
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-1 transition text-[11px] cursor-pointer"
            >
              <span>查看详情并升级</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="稍后提醒"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Header />
      <div className="flex-1 flex overflow-hidden">
        {activeTab !== 'EDITOR' && !zenMode && <Sidebar />}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'EDITOR' && <DockingWorkspace />}
          {activeTab === 'DASHBOARD' && <DashboardView />}
          {activeTab === 'CHARACTERS' && <CharactersView />}
          {activeTab === 'WORLD' && <WorldSettingsView />}
          {activeTab === 'PLOTS' && <WorldSettingsView initialTab="PLOTS" />}
          {activeTab === 'MEMORY' && <MemoryEngineView />}
        </main>
      </div>

      {showUpdateModal && (
        <SettingsModal
          initialTab="UPDATER"
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};

export default App;
