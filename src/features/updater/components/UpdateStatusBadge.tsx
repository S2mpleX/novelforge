import React from 'react';
import { UpdateStatus } from '../types';
import {
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowDownCircle,
  Clock,
  Loader2,
  RotateCw,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface Props {
  status: UpdateStatus;
}

export const UpdateStatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'CHECKING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-amber-100 text-primary border border-amber-300 shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          正在检查远端版本...
        </span>
      );

    case 'UPDATE_AVAILABLE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          发现新版本可升级
        </span>
      );

    case 'UP_TO_DATE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          当前已是最新版本
        </span>
      );

    case 'PRECHECKING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          正在进行升级前数据守护检查...
        </span>
      );

    case 'DOWNLOADING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
          <ArrowDownCircle className="w-3.5 h-3.5 animate-bounce" />
          正在下载新版本安装包
        </span>
      );

    case 'DOWNLOADED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs">
          <Clock className="w-3.5 h-3.5" />
          安装包就绪，等待安装确认
        </span>
      );

    case 'INSTALLING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          正在执行 Windows 安装程序...
        </span>
      );

    case 'RESTART_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-amber-100 text-primary border border-amber-400 shadow-2xs">
          <RotateCw className="w-3.5 h-3.5" />
          需要重新启动以应用新版本
        </span>
      );

    case 'ERROR_CHECK':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          检查更新失败
        </span>
      );

    case 'ERROR_DOWNLOAD':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
          <XCircle className="w-3.5 h-3.5" />
          下载安装包失败
        </span>
      );

    case 'ERROR_INSTALL':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
          <XCircle className="w-3.5 h-3.5" />
          安装失败
        </span>
      );

    case 'IDLE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-surface-2 text-ink-2 border border-line shadow-2xs">
          <RefreshCw className="w-3.5 h-3.5" />
          就绪状态（待检查）
        </span>
      );
  }
};
