import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { PanelType } from '@/types/docking';
import { PANEL_METADATA_MAP, getPanelIcon } from './PanelRegistry';
import { ManagePresetsModal } from './ManagePresetsModal';
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
      <div className="h-9 border-b border-[#ded5c4] bg-[#eae2d3]/90 backdrop-blur-md px-3 flex items-center justify-between text-xs select-none shrink-0 z-20 shadow-xs min-w-0">
        {/* Left: Preset Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative shrink-0" ref={presetDropdownRef}>
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fdfbf7] hover:bg-[#f6efe1] text-[#2c2825] border border-[#d5cbb8] shadow-xs font-medium transition shrink-0 whitespace-nowrap cursor-pointer"
              title="切换工作区预设"
            >
              <Layout className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="font-semibold text-[11px] whitespace-nowrap">{activePreset?.name || '工作区布局'}</span>
              <ChevronDown className="w-3 h-3 text-[#786f65] shrink-0" />
            </button>

            {showPresetDropdown && (
              <div className="absolute left-0 top-8 z-50 bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg shadow-xl py-1.5 w-60 text-xs text-[#2b2621]">
                <div className="px-3 py-1 text-[10px] font-bold text-[#8e8476] uppercase tracking-wider border-b border-[#eee6d8]">
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
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#ede5d6] transition ${
                        isCurrent ? 'bg-[#f0e8d9] font-bold text-amber-900' : ''
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-[11px]">{p.name}</div>
                        <div className="text-[10px] text-[#786f65] truncate font-serif font-normal">
                          {p.description}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] text-amber-800 font-bold ml-2 shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="border-t border-[#ded5c4] my-1" />
                <button
                  onClick={() => {
                    setShowManageModal(true);
                    setShowPresetDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#ede5d6] text-amber-900 font-medium flex items-center gap-1.5"
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
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-800/10 hover:bg-amber-800/20 text-amber-900 border border-amber-800/25 text-[11px] font-medium transition shrink-0 whitespace-nowrap cursor-pointer"
              title="快速打开并停靠更多模块"
            >
              <Plus className="w-3 h-3 text-amber-800 shrink-0" />
              <span className="whitespace-nowrap">添加工作模块</span>
              <ChevronDown className="w-2.5 h-2.5 shrink-0" />
            </button>

            {showAddPanelDropdown && (
              <div className="absolute left-0 top-8 z-50 bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg shadow-2xl py-2 w-72 max-h-96 overflow-y-auto text-xs text-[#2b2621]">
                <div className="px-3 py-1 text-[10px] font-bold text-[#8e8476] uppercase tracking-wider border-b border-[#eee6d8]">
                  打开 20 大全功能创作模块
                </div>
                {categories.map((cat) => (
                  <div key={cat.key} className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-[#854d0e] bg-[#f8f4ec]">
                      {cat.label}
                    </div>
                    {cat.types.map((pt) => {
                      const meta = PANEL_METADATA_MAP[pt];
                      const Icon = getPanelIcon(pt);
                      return (
                        <div
                          key={pt}
                          className="px-3 py-1 hover:bg-[#ede5d6] flex items-center justify-between group transition"
                        >
                          <button
                            onClick={() => {
                              openPanel(pt);
                              setShowAddPanelDropdown(false);
                            }}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                          >
                            <Icon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            <span className="truncate text-[11px] font-medium">{meta.title}</span>
                          </button>
                          <button
                            onClick={() => {
                              openPanel(pt, undefined, { asFloating: true });
                              setShowAddPanelDropdown(false);
                            }}
                            title="悬浮打开"
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#ded4c3] text-[#786f65] hover:text-amber-800 transition"
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
            onClick={() => {
              if (confirm('确认恢复当前预设的默认布局排布？')) {
                resetToDefaultLayout();
              }
            }}
            title="恢复当前预设推荐排布"
            className="p-1 rounded text-[#786f65] hover:text-[#2c2825] hover:bg-[#ded4c3] transition flex items-center gap-1 text-[11px] shrink-0 whitespace-nowrap cursor-pointer"
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
