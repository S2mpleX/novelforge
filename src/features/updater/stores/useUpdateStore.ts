import { create } from 'zustand';
import {
  UpdateStatus,
  DownloadProgress,
  UpdateInfo,
  UpdateSettings,
  StructuredChangelog,
  DataSafetyPrecheckResult,
} from '../types';
import {
  UpdateService,
  APP_CURRENT_VERSION,
} from '../services/UpdateService';
import { DataSafetyGuard } from '../services/DataSafetyGuard';

const STORAGE_KEY_SETTINGS = 'novelforge_updater_settings';

const DEFAULT_SETTINGS: UpdateSettings = {
  checkOnStartup: true,
  checkIntervalHours: 24,
  notifyNewVersion: true,
  autoDownload: false,
  promptBeforeInstall: true,
  skippedVersions: [],
  lastCheckedTimestamp: 0,
};

interface UpdateStoreState {
  // 核心状态
  status: UpdateStatus;
  currentVersion: string;
  latestVersion: string;
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress;
  errorMessage: string | null;

  // 设置与配置
  settings: UpdateSettings;

  // 历史版本更新日志
  historyChangelogs: StructuredChangelog[];
  selectedChangelog: StructuredChangelog | null;
  isLoadingHistory: boolean;

  // 升级前安全检查弹窗状态
  precheckResult: DataSafetyPrecheckResult | null;
  isPrechecking: boolean;
  precheckStatusText: string;

  // 动作
  loadSettings: () => void;
  updateSettings: (partial: Partial<UpdateSettings>) => void;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  startSafeUpdateFlow: (params: {
    hasUnsavedChanges: boolean;
    activeChapterTitle?: string;
  }) => Promise<void>;
  proceedInstallationAfterPrecheck: () => Promise<void>;
  cancelPrecheck: () => void;
  loadHistoryChangelogs: () => Promise<void>;
  selectChangelogVersion: (version: string) => void;
  skipVersion: (version: string) => void;
  resetError: () => void;
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  status: 'IDLE',
  currentVersion: APP_CURRENT_VERSION,
  latestVersion: APP_CURRENT_VERSION,
  updateInfo: null,
  errorMessage: null,

  downloadProgress: {
    contentLength: 0,
    downloadedBytes: 0,
    percent: null,
    speedBytesPerSec: 0,
    statusText: '',
    errorMessage: null,
  },

  settings: DEFAULT_SETTINGS,
  historyChangelogs: [],
  selectedChangelog: null,
  isLoadingHistory: false,

  precheckResult: null,
  isPrechecking: false,
  precheckStatusText: '',

  loadSettings: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed } });
        return;
      }
    } catch (e) {
      console.warn('加载更新配置失败，使用默认设置:', e);
    }
    set({ settings: DEFAULT_SETTINGS });
  },

  updateSettings: (partial) => {
    const current = get().settings;
    const next = { ...current, ...partial };
    set({ settings: next });
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
    } catch (e) {
      console.error('持久化更新设置失败:', e);
    }
  },

  checkForUpdates: async (manual = false) => {
    const { settings, status } = get();

    // 如果当前正在下载或安装，不打断
    if (status === 'DOWNLOADING' || status === 'INSTALLING' || status === 'PRECHECKING') {
      return;
    }

    // 检查频率防刷限制（非手动模式下）
    if (!manual && settings.checkIntervalHours > 0) {
      const intervalMs = settings.checkIntervalHours * 60 * 60 * 1000;
      const elapsed = Date.now() - settings.lastCheckedTimestamp;
      if (elapsed < intervalMs) {
        // 未到自动检查时间，静默跳过
        return;
      }
    }

    set({ status: 'CHECKING', errorMessage: null });

    try {
      const info = await UpdateService.checkForUpdates(manual);
      
      // 更新上次检查成功时间
      get().updateSettings({ lastCheckedTimestamp: Date.now() });

      // 检查该版本是否被用户跳过
      const isSkipped = settings.skippedVersions.includes(info.latestVersion);

      if (info.isAvailable && !isSkipped) {
        set({
          status: 'UPDATE_AVAILABLE',
          latestVersion: info.latestVersion,
          updateInfo: info,
          selectedChangelog: info.changelog,
          errorMessage: null,
        });
      } else {
        set({
          status: 'UP_TO_DATE',
          latestVersion: info.latestVersion,
          updateInfo: info,
          selectedChangelog: info.changelog,
          errorMessage: null,
        });
      }
    } catch (err: any) {
      console.error('检查更新流程遇到错误:', err);
      set({
        status: 'ERROR_CHECK',
        errorMessage: err.message || '检查更新失败，无法连通更新发布服务器',
      });
    }
  },

  startSafeUpdateFlow: async ({ hasUnsavedChanges, activeChapterTitle }) => {
    set({
      isPrechecking: true,
      precheckStatusText: '开始执行更新前数据安全与多 Agent 状态检查...',
      errorMessage: null,
    });

    try {
      const precheck = await DataSafetyGuard.runPreUpdateSafetyCheck({
        hasUnsavedChanges,
        activeChapterTitle,
        onStatusUpdate: (text) => set({ precheckStatusText: text }),
      });

      set({
        precheckResult: precheck,
        isPrechecking: false,
      });

      // 如果安全检查通过并且不需要二次弹窗阻断，直接进入下载安装
      if (precheck.canProceed && !precheck.unsavedEditorContent) {
        await get().proceedInstallationAfterPrecheck();
      }
    } catch (err: any) {
      set({
        isPrechecking: false,
        status: 'ERROR_INSTALL',
        errorMessage: `升级安全检查失败: ${err.message || err}`,
      });
    }
  },

  proceedInstallationAfterPrecheck: async () => {
    set({
      status: 'DOWNLOADING',
      precheckResult: null,
      errorMessage: null,
      downloadProgress: {
        contentLength: 0,
        downloadedBytes: 0,
        percent: null,
        speedBytesPerSec: 0,
        statusText: '正在连接安全分发节点...',
        errorMessage: null,
      },
    });

    try {
      await UpdateService.downloadAndInstall((progress) => {
        set({
          downloadProgress: progress,
          status: progress.errorMessage
            ? 'ERROR_DOWNLOAD'
            : progress.percent === 100
            ? 'INSTALLING'
            : 'DOWNLOADING',
        });
      });

      set({
        status: 'RESTART_REQUIRED',
        downloadProgress: {
          contentLength: 0,
          downloadedBytes: 0,
          percent: 100,
          speedBytesPerSec: 0,
          statusText: '安装完成！请点击立即重启以启用新版本。',
          errorMessage: null,
        },
      });
    } catch (err: any) {
      set({
        status: 'ERROR_DOWNLOAD',
        errorMessage: err.message || '安装包下载或验证失败',
      });
    }
  },

  cancelPrecheck: () => {
    set({ precheckResult: null, isPrechecking: false });
  },

  loadHistoryChangelogs: async () => {
    set({ isLoadingHistory: true });
    try {
      const logs = await UpdateService.fetchHistoricalChangelogs();
      set({
        historyChangelogs: logs,
        selectedChangelog: get().selectedChangelog || logs[0] || null,
        isLoadingHistory: false,
      });
    } catch (err) {
      console.warn('获取历史更新日志异常:', err);
      set({ isLoadingHistory: false });
    }
  },

  selectChangelogVersion: (version: string) => {
    const log = get().historyChangelogs.find((l) => l.version === version);
    if (log) {
      set({ selectedChangelog: log });
    }
  },

  skipVersion: (version: string) => {
    const { settings } = get();
    if (!settings.skippedVersions.includes(version)) {
      get().updateSettings({
        skippedVersions: [...settings.skippedVersions, version],
      });
    }
    set({ status: 'UP_TO_DATE' });
  },

  resetError: () => {
    set({ errorMessage: null, status: 'IDLE' });
  },
}));
