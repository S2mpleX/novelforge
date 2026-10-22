import React, { useState, useEffect, useRef } from 'react';
import type { Character, WorldRule } from '@/types';
import { EntityHoverCard } from './EntityHoverCard';
import { User, BookOpen, Sparkles } from 'lucide-react';

export interface EditorMentionPopoverProps {
  query: string;
  characters: Character[];
  worldRules: WorldRule[];
  position: { top: number; left: number };
  onSelect: (entity: { type: 'character' | 'world_rule'; item: Character | WorldRule }) => void;
  onClose: () => void;
  onInsertText?: (text: string) => void;
}

export const EditorMentionPopover: React.FC<EditorMentionPopoverProps> = ({
  query,
  characters,
  worldRules,
  position,
  onSelect,
  onClose,
  onInsertText,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cleanQuery = query.toLowerCase().trim();

  // Filter items
  const filteredChars = characters.filter((c) => {
    if (!cleanQuery) return true;
    return (
      c.name.toLowerCase().includes(cleanQuery) ||
      (c.aliases && c.aliases.toLowerCase().includes(cleanQuery))
    );
  });

  const filteredRules = worldRules.filter((r) => {
    if (!cleanQuery) return true;
    return (
      r.title.toLowerCase().includes(cleanQuery) ||
      r.rule_content.toLowerCase().includes(cleanQuery)
    );
  });

  interface CombinedItem {
    type: 'character' | 'world_rule';
    item: Character | WorldRule;
    id: string;
    title: string;
    sub: string;
  }

  const items: CombinedItem[] = [
    ...filteredChars.map((c) => ({
      type: 'character' as const,
      item: c,
      id: `char_${c.id}`,
      title: c.name,
      sub: c.aliases ? `又名: ${c.aliases}` : c.gender || '人物角色',
    })),
    ...filteredRules.map((r) => ({
      type: 'world_rule' as const,
      item: r,
      id: `rule_${r.id}`,
      title: r.title,
      sub: r.authority_level === 'CANON' ? 'CANON 权威设定' : '拓展设定',
    })),
  ];

  // Reset or clamp selectedIndex
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (items.length === 0) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = items[selectedIndex];
        if (selected) {
          onSelect({ type: selected.type, item: selected.item });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [items, selectedIndex, onSelect, onClose]);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  if (items.length === 0 && cleanQuery.length > 0) {
    return null;
  }

  const activeItem = items[selectedIndex];

  // Viewport clamping
  const popoverLeft = Math.max(16, Math.min(window.innerWidth - 300, position.left));
  const isNearBottom = position.top > window.innerHeight - 340;
  const popoverTop = isNearBottom ? Math.max(60, position.top - 280) : position.top + 24;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: `${popoverTop}px`,
        left: `${popoverLeft}px`,
      }}
      className="z-50 select-none animate-in fade-in zoom-in-95 duration-100 flex items-start gap-2.5 font-serif"
    >
      {/* Mention list dropdown */}
      <div className="w-64 max-h-72 bg-[#fdfbf7] dark:bg-[#1f1b18] border border-amber-900/30 dark:border-[#38312b] rounded-xl shadow-2xl p-1.5 overflow-y-auto text-xs text-ink dark:text-[#ede6dc]">
        <div className="px-2 py-1 text-[10px] font-bold text-primary dark:text-amber-400 border-b border-amber-900/10 dark:border-[#352f2a] flex items-center justify-between mb-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>@ 设定提及 (Enter 插入)</span>
          </span>
          <span className="text-[10px] text-ink-2 font-mono">
            {items.length} 条
          </span>
        </div>

        <div className="space-y-0.5">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isChar = item.type === 'character';

            return (
              <div
                key={item.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => onSelect({ type: item.type, item: item.item })}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-800/15 dark:bg-amber-400/15 font-bold text-primary dark:text-amber-300 border border-amber-800/25 dark:border-amber-400/25'
                    : 'hover:bg-amber-800/5 dark:hover:bg-[#28231f]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isChar ? (
                    <User className="w-3.5 h-3.5 text-primary dark:text-amber-400 shrink-0" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate text-xs">{item.title}</span>
                </div>
                <span className="text-[10px] text-ink-2 dark:text-[#8f8476] shrink-0 font-sans ml-1">
                  {item.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side live preview of active item */}
      {activeItem && (
        <div className="hidden lg:block">
          <EntityHoverCard
            entityType={activeItem.type}
            character={activeItem.type === 'character' ? (activeItem.item as Character) : null}
            worldRule={activeItem.type === 'world_rule' ? (activeItem.item as WorldRule) : null}
            onInsertText={onInsertText}
            className="shadow-2xl border-amber-900/35"
          />
        </div>
      )}
    </div>
  );
};
