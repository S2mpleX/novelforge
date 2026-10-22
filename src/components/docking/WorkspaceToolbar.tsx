import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { PanelType } from '@/types/docking';
import { PANEL_METADATA_MAP, getPanelIcon } from './PanelRegistry';
import { ManagePresetsModal } from './ManagePresetsModal';
import { confirmDialog } from '@/utils/dialog';
import {
  Layout,
  ChevronDown,
  Plus,
  RotateCcw,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export const WorkspaceToolbar: React.FC = () => {
  const {
    presets,
    activePresetKey,
    applyPreset,
    openPanel,
    resetToDefaultLayout,
  } = useWorkspaceStore();

  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showAddPanelDropdown, setShowAddPanelDropdown] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const presetDropdownRef = useRef<HTMLDivElement | null>(null);
  const addPanelDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(e.target as Node)
      ) {
        setShowPresetDropdown(false);
      }
      if (
        addPanelDropdownRef.current &&
        !addPanelDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAddPanelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePreset = presets[activePresetKey] || presets.focus_writing;

  // Categorize 20 panels
  const categories = [
    { key: 'core', label: '核心创作与正文', types: ['chapters', 'editor', 'version_history', 'novel_info'] as PanelType[] },
    { key: 'ai', label: 'AI 协同与审稿流水线', types: ['ai_assistant', 'editor_in_chief', 'agent_status', 'review_report', 'serialization_queue', 'memory_engine'] as PanelType[] },
    { key: 'world', label: '世界观与人物设定', types: ['character_profiles', 'character_flow', 'world_settings'] as PanelType[] },
    { key: 'plot', label: '大纲剧情与时间线', types: ['plot_outline', 'story_arcs', 'plot_threads', 'timeline', 'chapter_goals'] as PanelType[] },
    { key: 'analytics', label: '日志监控与数据统计', types: ['model_logs', 'token_usage'] as PanelType[] },
  ];

  return (
    <>
      <div className="h-9 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#1a1714] px-3 flex items-center justify-between text-xs select-none shrink-0 z-20 shadow-xs min-w-0">
        {/* Left: Preset Selector & Add Panel Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative shrink-0" ref={presetDropdownRef}>
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface hover:bg-surface-3 text-ink border border-line shadow-xs font-medium transition shrink-0 whitespace-nowrap cursor-pointer"
              title="切换工作区预设"
            >
              <Layout className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold text-[11px] whitespace-nowrap">{activePreset?.name || '工作区布局'}</span>
              <ChevronDown className="w-3 h-3 text-ink-2 shrink-0" />
            </button>

            {showPresetDropdown && (
              <div className="absolute left-0 top-8 z-50 bg-surface border border-line rounded-lg shadow-xl py-1.5 w-60 text-xs text-ink">
                <div className="px-3 py-1 text-[10px] font-bold text-ink-2 uppercase tracking-wider border-b border-line">
                  工作区布局预设
                </div>
                {Object.values(presets).map((p) => {
                  const isCurrent = p.id === activePresetKey;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        applyPreset(p.id);
                        setShowPresetDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-surface-3 transition ${
                        isCurrent ? 'bg-surface-3 font-bold text-primary' : ''
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-[11px]">{p.name}</div>
                        <div className="text-[10px] text-ink-2 truncate font-serif font-normal">
                          {p.description}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] text-primary font-bold ml-2 shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="border-t border-line my-1" />
                <button
                  onClick={() => {
                    setShowManageModal(true);
                    setShowPresetDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-surface-3 text-primary font-medium flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  管理与另存预设...
                </button>
              </div>
            )}
          </div>

          {/* Quick Add Panel Button */}
          <div className="relative shrink-0" ref={addPanelDropdownRef}>
            <button
              onClick={() => setShowAddPanelDropdown(!showAddPanelDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-800/10 hover:bg-amber-800/20 text-primary border border-amber-800/25 text-[11px] font-medium transition shrink-0 whitespace-nowrap cursor-pointer"
              title="快速打开并停靠更多模块"
            >
              <Plus className="w-3 h-3 text-primary shrink-0" />
              <span className="whitespace-nowrap">添加工作模块</span>
              <ChevronDown className="w-2.5 h-2.5 shrink-0" />
            </button>

            {showAddPanelDropdown && (
              <div className="absolute left-0 top-8 z-50 bg-surface border border-line rounded-lg shadow-2xl py-2 w-72 max-h-96 overflow-y-auto text-xs text-ink">
                <div className="px-3 py-1 text-[10px] font-bold text-ink-2 uppercase tracking-wider border-b border-line">
                  打开 20 大全功能创作模块
                </div>
                {categories.map((cat) => (
                  <div key={cat.key} className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-primary bg-surface-2">
                      {cat.label}
                    </div>
                    {cat.types.map((pt) => {
                      const meta = PANEL_METADATA_MAP[pt];
                      const Icon = getPanelIcon(pt);
                      return (
                        <div
                          key={pt}
                          className="px-3 py-1 hover:bg-surface-3 flex items-center justify-between group transition"
                        >
                          <button
                            onClick={() => {
                              openPanel(pt);
                              setShowAddPanelDropdown(false);
                            }}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                          >
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate text-[11px] font-medium">{meta.title}</span>
                          </button>
                          <button
                            onClick={() => {
                              openPanel(pt, undefined, { asFloating: true });
                              setShowAddPanelDropdown(false);
                            }}
                            title="悬浮打开"
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-3-hover text-ink-2 hover:text-primary transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Helpers */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <button
            onClick={async () => {
              if (await confirmDialog('确认恢复当前预设的默认布局排布？')) {
                resetToDefaultLayout();
              }
            }}
            title="恢复当前预设推荐排布"
            className="p-1 rounded text-ink-2 hover:text-ink hover:bg-surface-3-hover transition flex items-center gap-1 text-[11px] shrink-0 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">恢复布局</span>
          </button>
        </div>
      </div>

      {showManageModal && <ManagePresetsModal onClose={() => setShowManageModal(false)} />}
    </>
  );
};
