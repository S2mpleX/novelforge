import React from 'react';
import type { Character, WorldRule, PlotThread } from '@/types';
import {
  User,
  BookOpen,
  GitBranch,
  Plus,
  X,
  HeartCrack,
  Shirt,
  Compass,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

export type EntityType = 'character' | 'world_rule' | 'plot_thread';

export interface EntityHoverCardProps {
  entityType: EntityType;
  character?: Character | null;
  worldRule?: WorldRule | null;
  plotThread?: PlotThread | null;
  onInsertText?: (text: string) => void;
  onClose?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const EntityHoverCard: React.FC<EntityHoverCardProps> = ({
  entityType,
  character,
  worldRule,
  plotThread,
  onInsertText,
  onClose,
  style,
  className = '',
}) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制${label}`, text.slice(0, 30) + (text.length > 30 ? '...' : ''));
  };

  const handleInsert = (text: string, label: string) => {
    if (onInsertText) {
      onInsertText(text);
      toast.success(`已插入${label}到正文光标处`);
    } else {
      handleCopy(text, label);
    }
  };

  if (entityType === 'character' && character) {
    const visual = character.visual_summary?.trim() || '暂无详细立绘外貌特征记录';
    const motivation = character.motivation?.trim() || '暂无详细动机记录';
    const personality = character.personality?.trim() || '暂无性格描述';

    return (
      <div
        style={style}
        className={`w-80 md:w-96 rounded-2xl bg-[#fdfbf7] dark:bg-[#1f1b18] text-ink dark:text-[#ede6dc] border border-amber-900/25 dark:border-[#3d3630] shadow-2xl p-4 select-none z-50 animate-in fade-in zoom-in-95 duration-150 font-serif ${className}`}
      >
        {/* Top Header: Avatar + Name + Tags + Close */}
        <div className="flex items-start justify-between gap-3 border-b border-amber-900/10 dark:border-[#352f2a] pb-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar thumbnail or fallback */}
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-amber-800/20 dark:border-amber-400/20 bg-gradient-to-br from-amber-700/10 to-amber-900/20 flex items-center justify-center shadow-xs">
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary dark:text-amber-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-ink dark:text-[#ede6dc] truncate tracking-wide">
                  {character.name}
                </h4>
                {character.gender && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-sans">
                    {character.gender}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-ink-2 dark:text-[#9e9486] truncate mt-0.5 font-sans">
                {character.aliases ? `又名: ${character.aliases}` : character.profile || '出场人物档案'}
              </div>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
              title="关闭卡片"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body: Appearance, Weakness/Motivation, Personality */}
        <div className="space-y-2.5 text-xs">
          {/* Section 1: Visual & Clothing */}
          <div className="p-2.5 rounded-xl bg-amber-950/5 dark:bg-[#28231f] border border-amber-900/10 dark:border-[#38312b]">
            <div className="flex items-center justify-between text-[11px] font-bold text-primary dark:text-amber-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5" />
                <span>当前外貌体态衣饰</span>
              </span>
              {character.visual_summary && (
                <button
                  type="button"
                  onClick={() => handleInsert(character.visual_summary!, '外貌描写')}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
                  title="将外貌描写插入当前光标处"
                >
                  <Plus className="w-3 h-3" />
                  <span>插入正文</span>
                </button>
              )}
            </div>
            <p className="text-ink dark:text-[#dcd3c5] leading-relaxed line-clamp-3">
              {visual}
            </p>
          </div>

          {/* Section 2: Core Motivation & Vulnerability */}
          <div className="p-2.5 rounded-xl bg-rose-950/5 dark:bg-[#291e1d] border border-rose-900/15 dark:border-[#422927]">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 dark:text-rose-400 mb-1">
              <span className="flex items-center gap-1.5">
                <HeartCrack className="w-3.5 h-3.5" />
                <span>底层动机与软肋</span>
              </span>
              {character.motivation && (
                <button
                  type="button"
                  onClick={() => handleInsert(character.motivation!, '动机软肋')}
                  className="text-[10px] text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
                  title="将动机插入正文"
                >
                  <Plus className="w-3 h-3" />
                  <span>插入</span>
                </button>
              )}
            </div>
            <p className="text-ink dark:text-[#dcd3c5] leading-relaxed line-clamp-3">
              {motivation}
            </p>
          </div>

          {/* Section 3: Personality */}
          <div className="px-1 text-[11px] text-ink-2 dark:text-[#a09485] flex items-start gap-1.5 leading-relaxed">
            <Compass className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              <strong className="text-ink dark:text-[#ede6dc] font-medium">行事风格:</strong> {personality}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (entityType === 'world_rule' && worldRule) {
    const isCanon = worldRule.authority_level === 'CANON';

    return (
      <div
        style={style}
        className={`w-80 md:w-96 rounded-2xl bg-[#fdfbf7] dark:bg-[#1f1b18] text-ink dark:text-[#ede6dc] border border-amber-900/25 dark:border-[#3d3630] shadow-2xl p-4 select-none z-50 animate-in fade-in zoom-in-95 duration-150 font-serif ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-amber-900/10 dark:border-[#352f2a] pb-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
              <h4 className="text-base font-bold text-ink dark:text-[#ede6dc] truncate tracking-wide">
                {worldRule.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isCanon
                    ? 'bg-emerald-800/15 text-emerald-800 dark:text-emerald-300 border border-emerald-700/30'
                    : 'bg-amber-800/15 text-primary dark:text-amber-300 border border-amber-700/30'
                }`}
              >
                {isCanon ? 'CANON 权威设定' : 'EXTENDED 拓展设定'}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
              title="关闭卡片"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-3 rounded-xl bg-amber-950/5 dark:bg-[#28231f] border border-amber-900/10 dark:border-[#38312b] text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary dark:text-amber-300 mb-1.5">
            <span>法则核心与约束</span>
            <button
              type="button"
              onClick={() => handleInsert(worldRule.rule_content, '设定法则')}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
              title="插入法则设定至正文"
            >
              <Plus className="w-3 h-3" />
              <span>插入正文</span>
            </button>
          </div>
          <p className="text-ink dark:text-[#dcd3c5] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {worldRule.rule_content}
          </p>
        </div>
      </div>
    );
  }

  if (entityType === 'plot_thread' && plotThread) {
    return (
      <div
        style={style}
        className={`w-80 md:w-96 rounded-2xl bg-[#fdfbf7] dark:bg-[#1f1b18] text-ink dark:text-[#ede6dc] border border-amber-900/25 dark:border-[#3d3630] shadow-2xl p-4 select-none z-50 animate-in fade-in zoom-in-95 duration-150 font-serif ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-amber-900/10 dark:border-[#352f2a] pb-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <h4 className="text-base font-bold text-ink dark:text-[#ede6dc] truncate tracking-wide">
                {plotThread.title}
              </h4>
            </div>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-800/15 text-purple-800 dark:text-purple-300 border border-purple-700/30 mt-1">
              伏笔线索 · {plotThread.status}
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
              title="关闭卡片"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-950/5 dark:bg-[#251f28] border border-purple-900/10 dark:border-[#3c2f42]">
            <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1">
              伏笔线索描述
            </div>
            <p className="text-ink dark:text-[#dcd3c5] leading-relaxed">
              {plotThread.description}
            </p>
          </div>
          {plotThread.expected_resolution && (
            <div className="p-2.5 rounded-xl bg-amber-950/5 dark:bg-[#28231f] border border-amber-900/10 dark:border-[#38312b]">
              <div className="text-[11px] font-bold text-primary dark:text-amber-300 mb-1">
                预期回收节点与推演
              </div>
              <p className="text-ink dark:text-[#dcd3c5] leading-relaxed">
                {plotThread.expected_resolution}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
