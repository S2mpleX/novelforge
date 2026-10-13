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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-[#fdfbf7] border border-[#ded5c4] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#ded5c4] flex items-center justify-between bg-[#efe9dc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#854d0e] flex items-center justify-center text-[#fdfbf7] shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-[#2b2621]">
                模型网关配置 · Model Gateway
              </h2>
              <span className="text-[11px] text-[#685f54] font-serif">支持 OpenAI 兼容协议、Gemini 与本地 CPA 端点</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#685f54] hover:text-[#2b2621] hover:bg-[#e5ded0] transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#fdfbf7]">
          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-[#efe9dc]/80 border border-[#ded5c4] text-xs text-[#4a4237] flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#854d0e] shrink-0 mt-0.5" />
            <div className="leading-relaxed font-serif">
              <strong className="text-[#854d0e]">本地优先与密钥安全保障：</strong>
              所有小说正文、人物档案与长期设定默认保存在本地 SQLite 数据库中。API Key 仅在调用受控 Tauri 命令时于 Rust 本地进程向配置网关发起 HTTP 请求，绝不打印到普通日志中。
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
                服务商名称
              </label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="例如：本地网关 (CPA / CLIProxyAPI)"
                className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]"
              />
            </div>

            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5 flex items-center justify-between">
                <span>Base URL (API 端点)</span>
                <span className="text-[11px] text-[#786f65]">示例：http://127.0.0.1:8317/v1</span>
              </label>
              <div className="relative">
                <Server className="w-3.5 h-3.5 text-[#854d0e] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8317/v1 或 https://api.openai.com/v1"
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg pl-8 pr-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5 flex items-center justify-between">
                <span>API Key (密钥)</span>
                <span className="text-[11px] text-[#786f65]">本地网关如无需密钥可留空</span>
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-[#854d0e] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg pl-8 pr-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-serif font-semibold text-[#2b2621] block mb-1.5">
                模型 ID (Model ID)
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="例如：gpt-4o-mini、gpt-4o、claude-3-5-sonnet、deepseek-chat"
                className="w-full bg-[#f7f2e7] border border-[#ded5c4] rounded-lg px-3 py-2 text-xs text-[#2b2621] focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
              />
            </div>

            {/* Connection Test Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full py-2 rounded-lg bg-[#efe9dc] hover:bg-[#e5ded0] text-[#2b2621] text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition border border-[#ded5c4] disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5 text-[#854d0e]" />
                {isTesting ? '正在连接测试...' : '测试 API 连通性与延迟'}
              </button>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-[#047857]/10 border-[#047857]/30 text-[#047857]'
                      : 'bg-[#b91c1c]/10 border-[#b91c1c]/30 text-[#b91c1c]'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed font-serif">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{testResult.message}</span>
                      {testResult.latency_ms > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-[#f7f2e7] border border-[#ded5c4] text-[10px] text-[#2b2621]">
                          {testResult.latency_ms} ms
                        </span>
                      )}
                    </div>
                    {testResult.models_found && testResult.models_found.length > 0 && (
                      <div className="mt-1.5 text-[11px] text-[#52493d]">
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
              <div className="pt-2 border-t border-[#ded5c4]">
                <div className="flex items-center gap-1.5 text-xs text-[#685f54] font-serif mb-1">
                  <Database className="w-3.5 h-3.5 text-[#854d0e]" />
                  <span>本地数据库路径：</span>
                </div>
                <div className="text-[11px] font-mono text-[#52493d] bg-[#f7f2e7] p-2 rounded-lg border border-[#ded5c4] break-all select-all">
                  {dbStats.db_path}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-3 flex items-center justify-between border-t border-[#ded5c4]">
              {saveSuccess && (
                <span className="text-xs text-[#047857] flex items-center gap-1 font-serif font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  设置已成功保存并激活！
                </span>
              )}
              {!saveSuccess && <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-[#ded5c4] text-xs font-serif text-[#685f54] hover:text-[#2b2621] hover:bg-[#efe9dc] transition"
                >
                  关闭
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium transition shadow-xs disabled:opacity-40"
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
