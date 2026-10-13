import React from 'react';
import { DataSafetyPrecheckResult } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  FileEdit,
  Cpu,
  Database,
  ArrowRight,
} from 'lucide-react';

interface Props {
  result: DataSafetyPrecheckResult;
  onProceed: () => void;
  onCancel: () => void;
  onSaveAndProceed?: () => Promise<void>;
}

export const PreUpdateSafetyModal: React.FC<Props> = ({
  result,
  onProceed,
  onCancel,
  onSaveAndProceed,
}) => {
  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl shadow-2xl overflow-hidden font-serif">
        {/* 头部 */}
        <div className="p-4 bg-[#efe9dc] border-b border-[#ded5c4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2b2621]">
                NovelForge AI — 升级前创作数据安全守卫
              </h3>
              <p className="text-[11px] text-[#685f54]">
                执行全面防丢失核验，杜绝正文遗失与任务损坏
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#685f54] hover:text-[#2b2621] hover:bg-[#e4dcce] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 检查结果详情 */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-[#efe9dc]/50 border border-[#ded5c4] text-xs text-[#4a4237] leading-relaxed">
            NovelForge AI 恪守本地优先与创作保护准则，在应用升级安装或重启前，必须确保当前小说正文已落盘、正在运行的 Agent 任务已安全挂起并已创建 SQLite 数据库灾备。
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. 正文保存状态 */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 ${
              result.unsavedEditorContent
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            }`}>
              <FileEdit className={`w-4 h-4 shrink-0 mt-0.5 ${
                result.unsavedEditorContent ? 'text-rose-600' : 'text-emerald-600'
              }`} />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>正文编辑器状态</span>
                  <span>{result.unsavedEditorContent ? '⚠️ 存在未保存草稿' : '✅ 均已持久化保存'}</span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {result.unsavedDetails || '所有章节正文与不可逆历史版本快照均已落盘于本地数据库。'}
                </p>
              </div>
            </div>

            {/* 2. 多 Agent 任务状态 */}
            <div className="p-3 rounded-xl border border-[#ded5c4] bg-[#f7f2e7] flex items-start gap-3 text-[#3d362e]">
              <Cpu className="w-4 h-4 text-[#854d0e] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>多 Agent 连载任务队列</span>
                  <span className="text-emerald-700">
                    {result.activeAgentJobs ? '已自动安全暂停' : '无进行中任务'}
                  </span>
                </div>
                <p className="text-[11px] text-[#786f65] mt-0.5">
                  {result.activeJobDetails || '当前无正在生成长篇章节的后台任务，无需挂起。'}
                </p>
              </div>
            </div>

            {/* 3. 数据库备份与完整性 */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3 text-emerald-950">
              <Database className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>SQLite 灾备与完整性诊断</span>
                  <span>{result.databaseIntegrityOk ? '✅ 完整性 PASS' : '❌ 完整性异常'}</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 mt-0.5">
                  {result.integrityReport || '数据库健康度正常。'}
                </p>
                {result.backupPath && (
                  <p className="text-[10px] font-mono text-emerald-700 truncate mt-1">
                    安全热备份快照已生成：{result.backupPath}
                  </p>
                )}
              </div>
            </div>
          </div>

          {result.errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{result.errorMessage}</span>
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="p-4 bg-[#efe9dc] border-t border-[#ded5c4] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-serif font-medium text-[#5e5549] hover:bg-[#e4dcce] transition cursor-pointer"
          >
            暂缓更新
          </button>

          {result.unsavedEditorContent && onSaveAndProceed ? (
            <button
              type="button"
              onClick={onSaveAndProceed}
              className="px-4 py-2 rounded-xl text-xs font-serif font-bold bg-amber-700 hover:bg-amber-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>一键保存草稿并开始更新</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!result.canProceed}
              onClick={onProceed}
              className="px-4 py-2 rounded-xl text-xs font-serif font-bold bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>安全继续更新</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
