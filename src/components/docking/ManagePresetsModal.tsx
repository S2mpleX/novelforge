import React, { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { confirmDialog, alertDialog } from '@/utils/dialog';
import {
  X,
  Layout,
  Plus,
  Trash2,
  Download,
  RotateCcw,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const ManagePresetsModal: React.FC<Props> = ({ onClose }) => {
  const {
    presets,
    activePresetKey,
    applyPreset,
    saveCurrentAsPreset,
    deleteCustomPreset,
    resetToDefaultLayout,
    layout,
  } = useWorkspaceStore();

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [showSaveNew, setShowSaveNew] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    saveCurrentAsPreset(newPresetName.trim(), newPresetDesc.trim());
    setNewPresetName('');
    setNewPresetDesc('');
    setShowSaveNew(false);
    setMsg('已成功保存为新工作区预设！');
    setTimeout(() => setMsg(null), 2500);
  };

  const handleExportJson = () => {
    const formatted = JSON.stringify(layout, null, 2);
    setJsonText(formatted);
    setShowJsonExport(true);
  };

  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      useWorkspaceStore.setState({ layout: parsed });
      useWorkspaceStore.getState().saveWorkspace();
      setMsg('布局配置已成功导入并生效！');
      setShowJsonExport(false);
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      await alertDialog(`导入 JSON 失败: ${e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-xl max-w-xl w-full p-4 shadow-2xl text-xs text-ink">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary">工作区布局管理中心</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-ink-2 hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div className="mb-3 px-3 py-1.5 rounded bg-emerald-800/10 text-emerald-900 border border-emerald-800/20 font-medium text-[11px]">
            {msg}
          </div>
        )}

        {/* Presets List */}
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {Object.values(presets).map((preset) => {
            const isActive = activePresetKey === preset.id;
            return (
              <div
                key={preset.id}
                className={`p-2.5 rounded-lg border transition flex items-center justify-between ${
                  isActive
                    ? 'bg-[#f5efe3] border-amber-800/40 shadow-xs'
                    : 'bg-[#fcfaf5] border-[#e2d9c8] hover:bg-surface-3'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-ink">{preset.name}</span>
                    {preset.isBuiltIn ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-800/10 text-primary border border-amber-800/20 font-medium">
                        内置预设
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-800/10 text-blue-800 border border-blue-800/20 font-medium">
                        用户自定义
                      </span>
                    )}
                    {isActive && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 font-bold">
                        当前使用中
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-2 mt-0.5 font-serif line-clamp-1">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {!isActive && (
                    <button
                      onClick={() => {
                        applyPreset(preset.id);
                        setMsg(`已切换至【${preset.name}】！`);
                      }}
                      className="px-2 py-1 rounded bg-amber-800 text-white font-medium hover:bg-amber-700 transition text-[11px]"
                    >
                      应用
                    </button>
                  )}

                  {!preset.isBuiltIn && (
                    <button
                      onClick={async () => {
                        if (await confirmDialog(`确定删除自定义预设【${preset.name}】吗？`)) {
                          deleteCustomPreset(preset.id);
                        }
                      }}
                      title="删除此预设"
                      className="p-1 rounded text-ink-2 hover:text-red-700 hover:bg-red-800/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveNew(!showSaveNew)}
              className="px-2.5 py-1.5 rounded bg-amber-800/10 hover:bg-amber-800/20 text-primary border border-amber-800/30 font-medium flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              另存当前布局为预设
            </button>
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded border border-line hover:bg-surface-3 text-ink-2 font-medium flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              导出/导入 JSON
            </button>
          </div>

          <button
            onClick={async () => {
              if (await confirmDialog('确定要恢复默认专注写作布局吗？小说正文数据不会受到任何影响。')) {
                resetToDefaultLayout();
                setMsg('已恢复出厂默认布局！');
              }
            }}
            className="px-2.5 py-1.5 rounded border border-red-800/20 text-red-800 hover:bg-red-800/10 font-medium flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复默认布局
          </button>
        </div>

        {/* Form: Save New Preset */}
        {showSaveNew && (
          <form onSubmit={handleSaveNew} className="mt-3 p-3 rounded-lg bg-surface-2 border border-line space-y-2">
            <h4 className="font-bold text-xs text-primary">另存为新预设</h4>
            <input
              type="text"
              required
              placeholder="预设名称（例如：夜间精细审稿工作区）"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full bg-surface border border-line rounded px-2.5 py-1 text-xs"
            />
            <input
              type="text"
              placeholder="预设简短描述（可选）"
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
              className="w-full bg-surface border border-line rounded px-2.5 py-1 text-xs"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveNew(false)}
                className="px-2.5 py-1 rounded border border-line"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-amber-800 text-white font-medium hover:bg-amber-700"
              >
                保存预设
              </button>
            </div>
          </form>
        )}

        {/* JSON Export / Import Sub-panel */}
        {showJsonExport && (
          <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-line space-y-2">
            <h4 className="font-bold text-xs text-primary">工作区布局 JSON 配置</h4>
            <textarea
              rows={5}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full font-mono text-[10px] bg-surface border border-line rounded p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJsonExport(false)}
                className="px-2.5 py-1 rounded border border-line"
              >
                关闭
              </button>
              <button
                onClick={handleImportJson}
                className="px-3 py-1 rounded bg-amber-800 text-white font-medium hover:bg-amber-700"
              >
                应用导入 JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
