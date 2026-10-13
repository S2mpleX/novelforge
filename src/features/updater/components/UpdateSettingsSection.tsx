import React from 'react';
import { UpdateSettings } from '../types';
import { Sliders, Bell, Download, ShieldCheck, Clock, Trash2 } from 'lucide-react';

interface Props {
  settings: UpdateSettings;
  onUpdateSettings: (partial: Partial<UpdateSettings>) => void;
}

export const UpdateSettingsSection: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const formatTime = (ts: number) => {
    if (!ts) return '尚未检查';
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 font-serif p-4 bg-[#f7f2e7] rounded-xl border border-[#ded5c4]">
      <div className="flex items-center justify-between pb-2 border-b border-[#ded5c4]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#854d0e]" />
          <h4 className="text-xs font-bold text-[#2b2621]">自动更新偏好设置</h4>
        </div>
        <span className="text-[11px] text-[#786f65]">
          上次检查：{formatTime(settings.lastCheckedTimestamp)}
        </span>
      </div>

      <div className="space-y-3 text-xs text-[#3d362e]">
        {/* 启动时自动检查 */}
        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efe9dc] transition cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2b2621] block">软件启动时静默检查更新</span>
            <span className="text-[11px] text-[#786f65] block">
              在后台非阻塞执行版本检测，绝不影响小说编辑器急速启动
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.checkOnStartup}
            onChange={(e) => onUpdateSettings({ checkOnStartup: e.target.checked })}
            className="w-4 h-4 rounded text-[#854d0e] accent-[#854d0e] cursor-pointer"
          />
        </label>

        {/* 自动检查频率 */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efe9dc] transition">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2b2621] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#854d0e]" />
              定期检查频率
            </span>
            <span className="text-[11px] text-[#786f65] block">
              提供合理的检查频次，规避重复请求与 API 频控限制
            </span>
          </div>
          <select
            value={settings.checkIntervalHours}
            onChange={(e) => onUpdateSettings({ checkIntervalHours: Number(e.target.value) })}
            className="bg-[#efe9dc] text-xs font-semibold text-[#854d0e] border border-[#ded5c4] rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
          >
            <option value={24}>每 24 小时检查一次 (推荐)</option>
            <option value={72}>每 3 天检查一次</option>
            <option value={168}>每 7 天检查一次</option>
            <option value={0}>仅手动检查 (关闭自动轮询)</option>
          </select>
        </div>

        {/* 新版本桌面通知 */}
        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efe9dc] transition cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2b2621] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#854d0e]" />
              发现新版本时显示提示
            </span>
            <span className="text-[11px] text-[#786f65] block">
              当检测到稳定新版本发布时，在软件底部或设置区显示温和徽章
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.notifyNewVersion}
            onChange={(e) => onUpdateSettings({ notifyNewVersion: e.target.checked })}
            className="w-4 h-4 rounded text-[#854d0e] accent-[#854d0e] cursor-pointer"
          />
        </label>

        {/* 自动预下载安装包 */}
        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efe9dc] transition cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2b2621] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#854d0e]" />
              自动预下载新版本更新包
            </span>
            <span className="text-[11px] text-[#786f65] block">
              在后台完成更新包拉取与签名验证，准备就绪后由用户决定何时安装
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoDownload}
            onChange={(e) => onUpdateSettings({ autoDownload: e.target.checked })}
            className="w-4 h-4 rounded text-[#854d0e] accent-[#854d0e] cursor-pointer"
          />
        </label>

        {/* 安装前安全提示与数据保护 */}
        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#efe9dc] transition cursor-pointer">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2b2621] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              升级前强制数据安全守护 (DataSafetyGuard)
            </span>
            <span className="text-[11px] text-[#786f65] block">
              更新前自动审查未保存正文、暂停连载任务并执行 SQLite 在线热备份
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.promptBeforeInstall}
            onChange={(e) => onUpdateSettings({ promptBeforeInstall: e.target.checked })}
            className="w-4 h-4 rounded text-[#854d0e] accent-[#854d0e] cursor-pointer"
          />
        </label>

        {/* 已跳过的版本 */}
        {settings.skippedVersions.length > 0 && (
          <div className="pt-2 border-t border-[#ded5c4] flex items-center justify-between">
            <div className="text-[11px] text-[#786f65]">
              已跳过版本：{settings.skippedVersions.join(', ')}
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ skippedVersions: [] })}
              className="text-[11px] text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              清空跳过列表
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
