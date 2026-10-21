import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUpdateStore } from '@/features/updater/stores/useUpdateStore';
import { ToastContainer } from '@/components/common/ToastContainer';
import { DialogHost } from '@/components/common/DialogHost';
import { toast } from '@/stores/useToastStore';
import { isTauri } from '@/utils/tauriBridge';
import { Sparkles, ArrowRight, Info, X } from 'lucide-react';

// Lazy-loaded Views and Heavy Modals for Code Splitting & Instant Startup
const DashboardView = lazy(() => import('@/components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const CharactersView = lazy(() => import('@/components/views/CharactersView').then(m => ({ default: m.CharactersView })));
const WorldSettingsView = lazy(() => import('@/components/views/WorldSettingsView').then(m => ({ default: m.WorldSettingsView })));
const MemoryEngineView = lazy(() => import('@/components/views/MemoryEngineView').then(m => ({ default: m.MemoryEngineView })));
const DockingWorkspace = lazy(() => import('@/components/docking/DockingWorkspace').then(m => ({ default: m.DockingWorkspace })));

const SettingsModal = lazy(() => import('@/components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ShortcutHelpModal = lazy(() => import('@/components/modals/ShortcutHelpModal').then(m => ({ default: m.ShortcutHelpModal })));
const WritersDeskModal = lazy(() => import('@/components/desk/WritersDeskModal').then(m => ({ default: m.WritersDeskModal })));
const WordImportModal = lazy(() => import('@/components/modals/WordImportModal').then(m => ({ default: m.WordImportModal })));
const MapModal = lazy(() => import('@/components/modals/MapModal').then(m => ({ default: m.MapModal })));

export const App: React.FC = () => {
  const {
    loadNovels,
    loadProviders,
    activeTab,
    setActiveTab,
    toggleSidebar,
    zenMode,
    themeMode,
    exitZenMode,
    toggleZenMode,
  } = useNovelStore(
    useShallow((s) => ({
      loadNovels: s.loadNovels,
      loadProviders: s.loadProviders,
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      toggleSidebar: s.toggleSidebar,
      zenMode: s.zenMode,
      themeMode: s.themeMode,
      exitZenMode: s.exitZenMode,
      toggleZenMode: s.toggleZenMode,
    }))
  );
  const { status, latestVersion, settings, loadSettings, checkForUpdates } = useUpdateStore();
  const [showWebNotice, setShowWebNotice] = useState(!isTauri());
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showWordImportModal, setShowWordImportModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDeskModal, setShowDeskModal] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('novelforge_startup_show_desk');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });

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

  // Global keyboard shortcuts (F1, Ctrl+1~6, Ctrl+B)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in standard text input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // F1 or Shift+? (when not typing) opens shortcuts guide
      if (e.key === 'F1' || (!isInput && e.shiftKey && e.key === '?')) {
        e.preventDefault();
        setShowShortcutModal((prev) => !prev);
        return;
      }

      // F2 or Ctrl+D (when not typing) opens Writer's Desk
      if (e.key === 'F2' || (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        setShowDeskModal((prev) => !prev);
        return;
      }

      // F11 or Ctrl+Alt+Z (when not typing) toggles Zen Mode
      if (e.key === 'F11' || (!isInput && (e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        toggleZenMode();
        return;
      }

      // Escape: If in Zen Mode, exit back to Studio Mode
      if (e.key === 'Escape' && zenMode) {
        e.preventDefault();
        exitZenMode();
        toast.info('模式切换', '已返回专业工坊模式 (Studio)');
        return;
      }

      // Ctrl + 1~6 for pipeline phase navigation
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('DASHBOARD');
          toast.info('阶段导航', '第 1 阶段：构思立项仪表盘');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('WORLD');
          toast.info('阶段导航', '第 2 阶段：世界架构权威设定');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('CHARACTERS');
          toast.info('阶段导航', '第 3 阶段：人物档案工坊');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('PLOTS');
          toast.info('阶段导航', '第 4 阶段：剧情伏笔矩阵');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('EDITOR');
          toast.info('阶段导航', '第 5 阶段：小说正文工作台');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveTab('MEMORY');
          toast.info('阶段导航', '第 6 阶段：五层长期记忆与连载');
        } else if (!isInput && (e.key === 'b' || e.key === 'B')) {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };

    const handleOpenShortcutsEvent = () => {
      setShowShortcutModal(true);
    };

    const handleOpenDeskEvent = () => {
      setShowDeskModal(true);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('novelforge:open-shortcuts', handleOpenShortcutsEvent);
    window.addEventListener('novelforge:open-desk', handleOpenDeskEvent);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('novelforge:open-shortcuts', handleOpenShortcutsEvent);
      window.removeEventListener('novelforge:open-desk', handleOpenDeskEvent);
    };
  }, [setActiveTab, toggleSidebar, zenMode, toggleZenMode, exitZenMode]);

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
    <div className="flex flex-col h-full w-full overflow-hidden bg-canvas ambient-bg text-ink font-sans">
      {showWebNotice && (
        <div className="bg-surface-2 border-b border-line px-4 py-1.5 text-xs text-primary flex items-center justify-between font-serif shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>网页预览模式 (Web Preview)：</strong>
              检测到您在浏览器 (localhost:1420) 中打开。已启用 Web LocalStorage 与网络探测兼容层；完整 SQLite 数据库与多 Agent 守护进程请在桌面窗口运行（终端执行 <code className="bg-canvas px-1 py-0.5 rounded border border-line font-mono text-[11px]">pnpm tauri dev</code>）。
            </span>
          </div>
          <button
            onClick={() => setShowWebNotice(false)}
            className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-surface-3-hover transition ml-4"
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
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
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
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-8 text-ink-2 font-serif text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>载入工坊组件...</span>
                </div>
              </div>
            }
          >
            {activeTab === 'EDITOR' && <DockingWorkspace />}
            {activeTab === 'DASHBOARD' && <DashboardView />}
            {activeTab === 'CHARACTERS' && <CharactersView />}
            {activeTab === 'WORLD' && <WorldSettingsView />}
            {activeTab === 'PLOTS' && <WorldSettingsView initialTab="PLOTS" />}
            {activeTab === 'MEMORY' && <MemoryEngineView />}
          </Suspense>
        </main>
      </div>

      {/* 全局应用内对话框宿主（替代失效的原生 alert/confirm/prompt） */}
      <DialogHost />

      <Suspense fallback={null}>
        {showUpdateModal && (
          <SettingsModal
            initialTab="UPDATER"
            onClose={() => setShowUpdateModal(false)}
          />
        )}

        {/* Global Shortcut Help Center Modal */}
        <ShortcutHelpModal
          isOpen={showShortcutModal}
          onClose={() => setShowShortcutModal(false)}
        />

        {/* 文人案头速览与新书启航中心 (Writer's Desk) */}
        <WritersDeskModal
          isOpen={showDeskModal}
          onClose={() => setShowDeskModal(false)}
          onOpenWordImport={() => setShowWordImportModal(true)}
          onOpenMap={() => setShowMapModal(true)}
        />

        {/* 导入 Word 模态框 */}
        {showWordImportModal && (
          <WordImportModal isOpen={true} onClose={() => setShowWordImportModal(false)} />
        )}

        {/* 架空世界沙盘地图模态框 */}
        {showMapModal && (
          <MapModal isOpen={true} onClose={() => setShowMapModal(false)} />
        )}
      </Suspense>

      {/* Global Lightweight Literary Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default App;
