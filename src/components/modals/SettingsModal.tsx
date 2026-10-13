import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ConnectionTestResult } from '@/types';
import {
  X,
  Settings,
  Server,
  KeyRound,
  Zap,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { activeProvider, loadProviders } = useNovelStore();

  const [providerName, setProviderName] = useState('本地网关 (CPA / OpenAI 兼容)');
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:8317/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbStats, setDbStats] = useState<{ db_path: string; total_novels: number; total_providers: number } | null>(null);

  useEffect(() => {
    if (activeProvider) {
      setProviderName(activeProvider.name);
      setBaseUrl(activeProvider.base_url);
      setApiKey(activeProvider.api_key);
    }
    api.getDbStats().then(setDbStats).catch(console.error);
  }, [activeProvider]);

  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      alert('请输入 Base URL');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.testProviderConnection(
        baseUrl.trim(),
        apiKey.trim(),
        modelName.trim() || undefined
      );
      setTestResult(res);
      if (res.models_found && res.models_found.length > 0 && !modelName) {
        setModelName(res.models_found[0]);
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        latency_ms: 0,
        message: `测试异常: ${e.message || e}`,
        models_found: [],
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.saveProvider({
        id: activeProvider?.id,
        name: providerName.trim(),
        provider_type: 'OPENAI_COMPATIBLE',
        base_url: baseUrl.trim(),
        api_key: apiKey.trim(),
        is_active: true,
        models: [
          {
            model_name: modelName.trim() || 'gpt-4o-mini',
            display_name: modelName.trim() || '默认模型',
            is_default: true,
          },
        ],
      });

      await loadProviders();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      alert(`保存失败: ${e}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-[#0d1117]/95 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4.5 border-b border-white/[0.06] flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                模型网关配置 (Model Gateway)
              </h2>
              <span className="text-[11px] text-slate-400">支持 OpenAI 兼容协议、Gemini 与本地 CPA 端点</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-500/25 text-xs text-slate-300 flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-indigo-300">本地优先与密钥安全保障：</strong>
              所有小说正文、人物档案与长期设定默认保存在本地 SQLite 数据库中。API Key 仅在调用受控 Tauri 命令时于 Rust 本地进程向配置网关发起 HTTP 请求，绝不打印到普通日志中。
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                服务商名称
              </label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="例如：本地网关 (CPA / CLIProxyAPI)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Base URL (API 端点)</span>
                <span className="text-[11px] text-slate-500">示例：http://127.0.0.1:8317/v1</span>
              </label>
              <div className="relative">
                <Server className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8317/v1 或 https://api.openai.com/v1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>API Key (密钥)</span>
                <span className="text-[11px] text-slate-500">本地网关如无需密钥可留空</span>
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                模型 ID (Model ID)
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="例如：gpt-4o-mini、gpt-4o、claude-3-5-sonnet、deepseek-chat"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Connection Test Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition border border-slate-700 disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isTesting ? '正在连接测试...' : '测试 API 连通性与延迟'}
              </button>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{testResult.message}</span>
                      {testResult.latency_ms > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                          {testResult.latency_ms} ms
                        </span>
                      )}
                    </div>
                    {testResult.models_found && testResult.models_found.length > 0 && (
                      <div className="mt-1.5 text-[11px] text-slate-400">
                        可用模型：{testResult.models_found.slice(0, 6).join(', ')}
                        {testResult.models_found.length > 6 && ` 等共 ${testResult.models_found.length} 个`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Database Diagnostics Info */}
            {dbStats && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>本地数据库路径：</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
                  {dbStats.db_path}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  设置已成功保存并激活！
                </span>
              )}
              {!saveSuccess && <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  关闭
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-40"
                >
                  {isSaving ? '保存中...' : '保存并激活配置'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
