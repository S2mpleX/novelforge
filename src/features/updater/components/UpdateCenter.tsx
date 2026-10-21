import React, { useState, useEffect } from 'react';
import { useUpdateStore } from '../stores/useUpdateStore';
import { useNovelStore } from '@/stores/useNovelStore';
import { UpdateStatusBadge } from './UpdateStatusBadge';
import { UpdateProgressBar } from './UpdateProgressBar';
import { UpdateChangelogView } from './UpdateChangelogView';
import { UpdateSettingsSection } from './UpdateSettingsSection';
import { PreUpdateSafetyModal } from './PreUpdateSafetyModal';
import { UpdateService, OFFICIAL_RELEASES_URL } from '../services/UpdateService';
import {
  Sparkles,
  RefreshCw,
  Download,
  RotateCw,
  Settings,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Info,
  Loader2,
} from 'lucide-react';

export const UpdateCenter: React.FC = () => {
  const {
    status,
    currentVersion,
    latestVersion,
    downloadProgress,
    errorMessage,
    settings,
    historyChangelogs,
    selectedChangelog,
    isLoadingHistory,
    precheckResult,
    isPrechecking,
    loadSettings,
    updateSettings,
    checkForUpdates,
    startSafeUpdateFlow,
    proceedInstallationAfterPrecheck,
    cancelPrecheck,
    loadHistoryChangelogs,
    selectChangelogVersion,
    skipVersion,
  } = useUpdateStore();

  const { saveStatus, activeChapter, saveCurrentChapter } = useNovelStore();
  const [showSettingsView, setShowSettingsView] = useState(false);

  // 初始化加载设置与历史更新记录
  useEffect(() => {
    loadSettings();
    loadHistoryChangelogs();
  }, [loadSettings, loadHistoryChangelogs]);

  const handleManualCheck = () => {
    checkForUpdates(true);
  };

  const handleStartUpdate = () => {
    const hasUnsaved = saveStatus !== 'SAVED';
    startSafeUpdateFlow({
      hasUnsavedChanges: hasUnsaved,
      activeChapterTitle: activeChapter?.title,
    });
  };

  const handleSaveAndProceed = async () => {
    if (activeChapter) {
      await saveCurrentChapter();
    }
    await proceedInstallationAfterPrecheck();
  };

  const handleRelaunch = async () => {
    await UpdateService.relaunchApp();
  };

  return (
    <div className="space-y-6 font-serif">
      {/* 3.1 顶部版本状态看板卡片 */}
      <div className="p-5 rounded-2xl bg-surface-2 border border-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-orange-700 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">
                  软件更新 · Update Center
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface text-primary border border-line">
                  v{currentVersion}
                </span>
              </div>
              <p className="text-xs text-ink-2 mt-0.5">
                基于 Tauri 原生安全更新机制与 GitHub Releases 正式发布通道
              </p>
            </div>
          </div>

          {/* 版本对比与状态徽章 */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="text-ink-2">
              <span>当前版本：</span>
              <strong className="font-mono text-ink">v{currentVersion}</strong>
            </div>

            <div className="w-px h-3 bg-[#ded5c4]" />

            <div className="text-ink-2">
              <span>最新版本：</span>
              <strong className="font-mono text-primary">
                {latestVersion ? (latestVersion.startsWith('v') ? latestVersion : `v${latestVersion}`) : `v${currentVersion}`}
              </strong>
            </div>

            <div className="w-px h-3 bg-[#ded5c4]" />

            <div className="flex items-center gap-1.5">
              <span>状态：</span>
              <UpdateStatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* 顶部操作按钮 */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={status === 'PRECHECKING' || status === 'DOWNLOADING' || status === 'INSTALLING'}
            onClick={() => setShowSettingsView(!showSettingsView)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              showSettingsView
                ? 'bg-[#854d0e] text-white border-[#854d0e] shadow-xs'
                : 'bg-surface text-ink-2 border-line hover:bg-surface-2'
            }`}
            title="配置更新策略与自动检查周期"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>更新设置</span>
          </button>

          <button
            type="button"
            disabled={status === 'CHECKING' || status === 'PRECHECKING' || status === 'DOWNLOADING' || status === 'INSTALLING'}
            onClick={handleManualCheck}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed text-ink border border-line transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="手动向远端更新端点发起查询"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${status === 'CHECKING' ? 'animate-spin' : ''}`} />
            <span>{status === 'CHECKING' ? '检查中...' : '检查更新'}</span>
          </button>

          {/* 发现新版本时的下载安装按钮（已彻底移除 animate-pulse，杜绝点击前后呼吸闪烁假象） */}
          {status === 'UPDATE_AVAILABLE' && (
            <button
              type="button"
              onClick={handleStartUpdate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="执行升级前安全检查并下载安装新版本"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载并安装 (v{latestVersion})</span>
            </button>
          )}

          {/* 升级前安全检查状态指示按钮 */}
          {(status === 'PRECHECKING' || isPrechecking) && (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-800/80 text-amber-100 border border-amber-600/40 shadow-xs flex items-center gap-1.5 cursor-wait opacity-90"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>安全检查与灾备中...</span>
            </button>
          )}

          {/* 正在下载更新包状态指示按钮 */}
          {status === 'DOWNLOADING' && (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-800/85 text-blue-100 border border-blue-600/40 shadow-xs flex items-center gap-1.5 cursor-wait opacity-90"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
              <span>
                正在下载更新包
                {downloadProgress.percent !== null ? ` (${downloadProgress.percent}%)` : '...'}
              </span>
            </button>
          )}

          {/* 正在安装更新包状态指示按钮 */}
          {status === 'INSTALLING' && (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-800/85 text-purple-100 border border-purple-600/40 shadow-xs flex items-center gap-1.5 cursor-wait opacity-90"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
              <span>正在解压与启动安装向导...</span>
            </button>
          )}

          {/* 重试更新按钮（下载或安装失败时展示） */}
          {(status === 'ERROR_DOWNLOAD' || status === 'ERROR_INSTALL') && (
            <button
              type="button"
              onClick={handleStartUpdate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="点击重新尝试安全更新流程"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重试更新流程</span>
            </button>
          )}

          {/* 重启按钮 */}
          {status === 'RESTART_REQUIRED' && (
            <button
              type="button"
              onClick={handleRelaunch}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>立即重启应用生效</span>
            </button>
          )}
        </div>
      </div>

      {/* 3.3 正在下载状态区（仅在下载或安装阶段展示） */}
      {(status === 'DOWNLOADING' || status === 'INSTALLING' || status === 'DOWNLOADED' || downloadProgress.downloadedBytes > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            更新包传输与校验状态
          </h4>
          <UpdateProgressBar progress={downloadProgress} />
        </div>
      )}

      {/* 检查或更新失败提醒卡片 */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">更新服务提示：</strong>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
            <span>若自动更新受网络或代理限制，您可访问官方 Releases 页面手动下载安装包：</span>
            <a
              href={OFFICIAL_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <span>前往官方发布页</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 发现新版本时的跳过操作条 */}
      {status === 'UPDATE_AVAILABLE' && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-ink-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              已为您发现新版本 <strong className="text-primary">v{latestVersion}</strong>。若暂不更新，可选择跳过该版本。
            </span>
          </div>
          <button
            type="button"
            onClick={() => skipVersion(latestVersion)}
            className="text-[11px] text-ink-2 hover:text-ink hover:underline cursor-pointer"
          >
            跳过此版本
          </button>
        </div>
      )}

      {/* 3.4 更新设置区域（展开时展示） */}
      {showSettingsView && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150">
          <UpdateSettingsSection
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </div>
      )}

      {/* 3.2 结构化更新日志与历史版本浏览 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            版本发布说明与历史更新归档
          </h4>
          <span className="text-[11px] text-ink-2">
            遵循 SemVer 语义化版本与发布日期排序
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line shadow-xs">
          <UpdateChangelogView
            changelog={selectedChangelog}
            historyList={historyChangelogs}
            onSelectVersion={selectChangelogVersion}
            isLoadingHistory={isLoadingHistory}
          />
        </div>
      </div>

      {/* 升级前安全守护弹窗 (DataSafetyGuard) */}
      {precheckResult && (
        <PreUpdateSafetyModal
          result={precheckResult}
          onProceed={proceedInstallationAfterPrecheck}
          onCancel={cancelPrecheck}
          onSaveAndProceed={handleSaveAndProceed}
        />
      )}
    </div>
  );
};
