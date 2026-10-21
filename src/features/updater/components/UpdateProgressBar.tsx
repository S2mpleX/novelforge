import React from 'react';
import { DownloadProgress } from '../types';
import { HardDrive, Activity, AlertCircle } from 'lucide-react';

interface Props {
  progress: DownloadProgress;
}

export const UpdateProgressBar: React.FC<Props> = ({ progress }) => {
  const { contentLength, downloadedBytes, percent, speedBytesPerSec, statusText, errorMessage } = progress;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return '计算中...';
    return `${formatBytes(bytesPerSec)}/s`;
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-line space-y-3 font-serif">
      {/* 顶部指标 */}
      <div className="flex items-center justify-between text-xs text-ink-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>
            {formatBytes(downloadedBytes)}
            {contentLength > 0 ? ` / ${formatBytes(contentLength)}` : ' (总大小获取中...)'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {speedBytesPerSec > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-ink-2">
              <Activity className="w-3 h-3 text-emerald-700" />
              <span>{formatSpeed(speedBytesPerSec)}</span>
            </div>
          )}

          <span className="font-mono font-bold text-primary">
            {percent !== null ? `${percent}%` : '流式传输中'}
          </span>
        </div>
      </div>

      {/* 进度条轨道 */}
      <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden p-0.5 border border-line">
        {percent !== null ? (
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
          />
        ) : (
          <div className="h-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 rounded-full w-2/5 opacity-85 transition-all" />
        )}
      </div>

      {/* 状态文字与失败描述 */}
      <div className="flex items-start justify-between text-[11px] text-ink-2">
        <span className="leading-tight">{statusText}</span>
        {contentLength === 0 && (
          <span className="text-[10px] text-primary bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
            真实流式计算·严禁假进度
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>下载失败原因：</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
