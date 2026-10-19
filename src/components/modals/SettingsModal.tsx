import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ConnectionTestResult, AiModel } from '@/types';
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
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';

import { UpdateCenter } from '@/features/updater/components/UpdateCenter';
import { useUpdateStore } from '@/features/updater/stores/useUpdateStore';
import { SkillsManagerView } from '@/features/skills/components/SkillsManagerView';

interface Props {
  onClose: () => void;
  initialTab?: 'MODEL' | 'UPDATER' | 'SKILLS';
}

interface PresetItem {
  name: string;
  url: string;
  model: string;
  badge: string;
  suggestedModels: string[];
}

const PRESETS: PresetItem[] = [
  {
    name: '本地 CPA / 代理',
    url: 'http://127.0.0.1:8317/v1',
    model: 'gemini-3.8-flash-high',
    badge: '免 Key',
    suggestedModels: ['gemini-3.8-flash-high', 'gemini-2.5-pro', 'gemini-2.5-flash', 'claude-3-7-sonnet'],
  },
  {
    name: 'DeepSeek 官方',
    url: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    badge: '深度思考',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    name: 'OpenAI 官方',
    url: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    badge: '稳定',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
  },
  {
    name: 'Ollama 本地模型',
    url: 'http://127.0.0.1:11434/v1',
    model: 'qwen2.5:7b',
    badge: '纯离线',
    suggestedModels: ['qwen2.5:7b', 'llama3.1:8b', 'deepseek-r1:7b'],
  },
  {
    name: '硅基流动 (SiliconFlow)',
    url: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    badge: '国产高速',
    suggestedModels: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
  },
  {
    name: '月之暗面 Kimi',
    url: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    badge: '长上下文',
    suggestedModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
];

export const SettingsModal: React.FC<Props> = ({ onClose, initialTab = 'MODEL' }) => {
  const { activeProvider, providers, loadProviders } = useNovelStore();
  const { status } = useUpdateStore();
  const [activeTab, setActiveTab] = useState<'MODEL' | 'UPDATER' | 'SKILLS'>(initialTab);

  const [providerId, setProviderId] = useState<string | undefined>(activeProvider?.id);
  const [providerName, setProviderName] = useState('本地网关 (CPA / OpenAI 兼容)');
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:8317/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-3.8-flash-high');
  const [savedModels, setSavedModels] = useState<AiModel[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ db_path: string; total_novels: number; total_providers: number } | null>(null);

  // 初始化与 activeProvider 变更时，从数据库严格查询并还原服务商信息与模型 ID
  useEffect(() => {
    let isMounted = true;

    const initProviderData = async () => {
      const target = activeProvider || (providers.length > 0 ? providers[0] : null);
      if (target) {
        setProviderId(target.id);
        setProviderName(target.name);
        setBaseUrl(target.base_url);
        setApiKey(target.api_key || '');

        try {
          const models = await api.listModels(target.id);
          if (!isMounted) return;
          setSavedModels(models);
          const defaultModel = models.find((m) => m.is_default) || models[0];
          if (defaultModel && defaultModel.model_name) {
            setModelName(defaultModel.model_name);
          } else {
            const matchedPreset = PRESETS.find((p) => p.url === target.base_url);
            setModelName(matchedPreset?.model || 'gemini-3.8-flash-high');
          }
        } catch (e) {
          console.error('从本地数据库加载模型列表失败:', e);
        }
      }
    };

    initProviderData();
    if (activeTab === 'MODEL') {
      api.getDbStats().then((stats) => {
        if (isMounted) setDbStats(stats);
      }).catch(console.error);
    }

    return () => {
      isMounted = false;
    };
  }, [activeProvider, activeTab]);

  // 当切换到 MODEL tab 且 dbStats 为空时按需懒加载
  useEffect(() => {
    if (activeTab === 'MODEL' && !dbStats) {
      api.getDbStats().then(setDbStats).catch(console.error);
    }
  }, [activeTab, dbStats]);

  // 点击快速预设处理
  const handleSelectPreset = async (preset: PresetItem) => {
    const existing = providers.find(
      (p) => p.base_url.trim() === preset.url.trim() || p.name.trim() === preset.name.trim()
    );

    if (existing) {
      setProviderId(existing.id);
      setProviderName(existing.name);
      setBaseUrl(existing.base_url);
      setApiKey(existing.api_key || '');
      try {
        const models = await api.listModels(existing.id);
        setSavedModels(models);
        const def = models.find((m) => m.is_default) || models[0];
        if (def && def.model_name) {
          setModelName(def.model_name);
        } else {
          setModelName(preset.model);
        }
      } catch {
        setModelName(preset.model);
      }
    } else {
      setProviderId(undefined);
      setProviderName(preset.name);
      setBaseUrl(preset.url);
      setApiKey('');
      setModelName(preset.model);
      setSavedModels([]);
    }
    setTestResult(null);
  };

  // 快捷切换已保存的服务商
  const handleSelectSavedProvider = async (p: typeof providers[0]) => {
    setProviderId(p.id);
    setProviderName(p.name);
    setBaseUrl(p.base_url);
    setApiKey(p.api_key || '');
    try {
      const models = await api.listModels(p.id);
      setSavedModels(models);
      const def = models.find((m) => m.is_default) || models[0];
      if (def && def.model_name) {
        setModelName(def.model_name);
      } else {
        const matched = PRESETS.find((pr) => pr.url === p.base_url);
        setModelName(matched?.model || 'gemini-3.8-flash-high');
      }
    } catch (e) {
      console.error('切换服务商时获取模型失败:', e);
    }
    setTestResult(null);
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      setTestResult({
        success: false,
        latency_ms: 0,
        message: '请输入有效 Base URL (例如 http://127.0.0.1:8317/v1)',
        models_found: [],
      });
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
      // 若当前模型为空且测得可用模型列表，则自动填充第一个
      if (res.models_found && res.models_found.length > 0 && !modelName.trim()) {
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

  // 保存网关与模型配置
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const finalModelName = modelName.trim() || 'gemini-3.8-flash-high';
      const saved = await api.saveProvider({
        id: providerId || undefined,
        name: providerName.trim(),
        provider_type: 'OPENAI_COMPATIBLE',
        base_url: baseUrl.trim(),
        api_key: apiKey.trim(),
        is_active: true,
        models: [
          {
            model_name: finalModelName,
            display_name: finalModelName,
            is_default: true,
          },
        ],
      });

      setProviderId(saved.id);
      await loadProviders();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      setSaveError(`保存失败: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 当前端点对应的常用推荐模型列表
  const matchedPreset = PRESETS.find((p) => p.url === baseUrl.trim());
  const suggestedModels = matchedPreset?.suggestedModels || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full ${activeTab === 'SKILLS' ? 'max-w-5xl' : activeTab === 'UPDATER' ? 'max-w-3xl' : 'max-w-xl'} bg-surface dark:bg-[#1c1917] border border-line dark:border-[#2e2a27] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="p-4 border-b border-line dark:border-[#2e2a27] flex items-center justify-between bg-surface-2 dark:bg-[#201c1a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#854d0e] flex items-center justify-center text-[#fdfbf7] shadow-xs shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            {/* Tabs */}
            <div className="flex items-center bg-surface-3 dark:bg-[#1a1715] p-1 rounded-xl border border-line dark:border-[#2f2b28]">
              <button
                type="button"
                onClick={() => setActiveTab('MODEL')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition cursor-pointer ${
                  activeTab === 'MODEL'
                    ? 'bg-surface dark:bg-[#2d2825] text-primary dark:text-amber-400 shadow-2xs'
                    : 'text-ink-2 dark:text-[#a8a29e] hover:text-ink dark:hover:text-white'
                }`}
              >
                模型网关配置
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SKILLS')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SKILLS'
                    ? 'bg-surface dark:bg-[#2d2825] text-primary dark:text-amber-400 shadow-2xs'
                    : 'text-ink-2 dark:text-[#a8a29e] hover:text-ink dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                <span>Skills 技能中心</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UPDATER')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
                  activeTab === 'UPDATER'
                    ? 'bg-surface dark:bg-[#2d2825] text-primary dark:text-amber-400 shadow-2xs'
                    : 'text-ink-2 dark:text-[#a8a29e] hover:text-ink dark:hover:text-white'
                }`}
              >
                <span>软件更新</span>
                {status === 'UPDATE_AVAILABLE' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping absolute -top-0.5 -right-0.5" />
                )}
                {status === 'UPDATE_AVAILABLE' && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 absolute -top-0.5 -right-0.5" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 dark:text-[#a8a29e] hover:text-ink dark:hover:text-white hover:bg-surface-3-hover dark:hover:bg-[#2d2825] transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'SKILLS' ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SkillsManagerView />
          </div>
        ) : activeTab === 'UPDATER' ? (
          <div className="p-6 overflow-y-auto bg-surface dark:bg-[#1c1917]">
            <UpdateCenter />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 bg-surface dark:bg-[#1c1917]">
            {/* Privacy Note */}
            <div className="p-3.5 rounded-xl bg-surface-2/80 dark:bg-[#24201c] border border-line dark:border-[#38332f] text-xs text-ink-2 dark:text-[#d6d3d1] flex items-start gap-3">
              <Lock className="w-4 h-4 text-primary dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-serif">
                <strong className="text-primary dark:text-amber-500">本地优先与密钥安全保障：</strong>
                所有小说正文、人物档案与长期设定默认保存在本地 SQLite 数据库中。API Key 仅在调用受控 Tauri 命令时于 Rust 本地进程向配置网关发起 HTTP 请求，绝不打印到普通日志中。
              </div>
            </div>

            {/* Configured Providers Quick Switcher (存在多个服务商时展示) */}
            {providers.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    已配置的服务商 (点击切换)
                  </span>
                  <span className="text-[11px] text-ink-2 font-normal">
                    共 {providers.length} 个本地配置
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {providers.map((p) => {
                    const isSelected = providerId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSavedProvider(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-serif flex items-center gap-1.5 border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#854d0e] text-[#fdfbf7] border-[#854d0e] shadow-2xs font-semibold'
                            : 'bg-surface hover:bg-surface-2 text-ink-2 border-line'
                        }`}
                      >
                        <span>{p.name}</span>
                        {p.is_active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="当前激活" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Provider Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-serif font-bold text-primary flex items-center justify-between">
                <span>⚡ 一键快速预设 (点击自动填入端点与模型)</span>
                <span className="text-[11px] text-ink-2 font-normal">支持本地网关、官方及第三方端点</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                  const isMatch = baseUrl.trim() === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isMatch
                          ? 'bg-surface-2 border-[#854d0e] text-primary shadow-2xs ring-1 ring-[#854d0e]/30'
                          : 'bg-surface border-line text-ink-2 hover:bg-surface-2 hover:border-[#854d0e]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-serif font-bold truncate">{preset.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface text-primary border border-line">
                          {preset.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-2 font-mono truncate">{preset.model}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-serif font-semibold text-ink block mb-1.5">
                  服务商名称
                </label>
                <input
                  type="text"
                  required
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="例如：本地网关 (CPA / CLIProxyAPI)"
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e]"
                />
              </div>

              <div>
                <label className="text-xs font-serif font-semibold text-ink block mb-1.5 flex items-center justify-between">
                  <span>Base URL (API 端点)</span>
                  <span className="text-[11px] text-ink-2">示例：http://127.0.0.1:8317/v1</span>
                </label>
                <div className="relative">
                  <Server className="w-3.5 h-3.5 text-primary absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8317/v1 或 https://api.openai.com/v1"
                    className="w-full bg-surface border border-line rounded-lg pl-8 pr-3 py-2 text-xs text-ink focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-serif font-semibold text-ink block mb-1.5 flex items-center justify-between">
                  <span>API Key (密钥)</span>
                  <span className="text-[11px] text-ink-2">本地网关如无需密钥可留空</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-primary absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-surface border border-line rounded-lg pl-8 pr-3 py-2 text-xs text-ink focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-serif font-semibold text-ink block mb-1.5 flex items-center justify-between">
                  <span>模型 ID (Model ID)</span>
                  {savedModels.length > 0 && (
                    <span className="text-[11px] text-ink-2">
                      当前库中绑定: {savedModels[0].model_name}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="例如：gemini-3.8-flash-high、deepseek-chat、gpt-4o-mini"
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-hidden focus:border-[#854d0e] focus:ring-1 focus:ring-[#854d0e] font-mono"
                />

                {/* 常用模型快捷填充芯片 */}
                {suggestedModels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[11px] text-ink-2 flex items-center gap-1 font-serif">
                      <Sparkles className="w-3 h-3 text-primary" />
                      快捷选用：
                    </span>
                    {suggestedModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelName(m)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono border transition cursor-pointer ${
                          modelName === m
                            ? 'bg-[#854d0e] text-[#fdfbf7] border-[#854d0e] font-bold shadow-2xs'
                            : 'bg-surface-2 hover:bg-surface-3-hover text-ink-2 border-line'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Connection Test Actions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full py-2 rounded-lg bg-surface-2 hover:bg-surface-3-hover text-ink text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition border border-line disabled:opacity-40 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  {isTesting ? '正在连接测试...' : '测试 API 连通性与可用模型'}
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
                    <div className="leading-relaxed font-serif w-full">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{testResult.message}</span>
                        {testResult.latency_ms > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-surface border border-line text-[10px] text-ink">
                            {testResult.latency_ms} ms
                          </span>
                        )}
                      </div>
                      {testResult.models_found && testResult.models_found.length > 0 && (
                        <div className="mt-2 text-[11px] text-ink-2">
                          <span className="font-semibold text-primary block mb-1">
                            网关返回可用模型（点击直接设为当前模型）：
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                            {testResult.models_found.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setModelName(m)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                                  modelName === m
                                    ? 'bg-[#854d0e] text-white border-[#854d0e] font-bold shadow-2xs'
                                    : 'bg-surface hover:bg-surface-2 text-ink-2 border-line'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Database Diagnostics Info */}
              {dbStats && (
                <div className="pt-2 border-t border-line">
                  <div className="flex items-center gap-1.5 text-xs text-ink-2 font-serif mb-1">
                    <Database className="w-3.5 h-3.5 text-primary" />
                    <span>本地数据库路径：</span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-2 bg-surface p-2 rounded-lg border border-line break-all select-all">
                    {dbStats.db_path}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pt-3 flex items-center justify-between border-t border-line">
                {saveSuccess && (
                  <span className="text-xs text-[#047857] flex items-center gap-1 font-serif font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    设置已成功保存并激活！
                  </span>
                )}
                {saveError && (
                  <span className="text-xs text-[#b91c1c] flex items-center gap-1 font-serif font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {saveError}
                  </span>
                )}
                {!saveSuccess && !saveError && <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg border border-line text-xs font-serif text-ink-2 hover:text-ink hover:bg-surface-2 transition cursor-pointer"
                  >
                    关闭
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] text-xs font-serif font-medium transition shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    {isSaving ? '保存中...' : '保存并激活配置'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
