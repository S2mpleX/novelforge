import React, { useState, useEffect } from 'react';
import { api } from '@/utils/tauriBridge';
import type { Character, WorldRule } from '@/types';
import {
  Users,
  Compass,
  FileText,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';

export interface ContextPickerProps {
  novelId: string;
  chapterId?: string;
  selectedCharacterIds: string[];
  onChangeCharacters: (ids: string[]) => void;
  selectedRuleIds: string[];
  onChangeRules: (ids: string[]) => void;
  includePrevChapter?: boolean;
  onChangeIncludePrevChapter?: (include: boolean) => void;
  className?: string;
  compact?: boolean;
}

export const ContextPicker: React.FC<ContextPickerProps> = ({
  novelId,
  chapterId,
  selectedCharacterIds,
  onChangeCharacters,
  selectedRuleIds,
  onChangeRules,
  includePrevChapter = false,
  onChangeIncludePrevChapter,
  className = '',
  compact = false,
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(!compact);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'CHARACTERS' | 'RULES'>('CHARACTERS');

  useEffect(() => {
    if (!novelId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.listCharacters(novelId).catch(() => []),
      api.listWorldRules(novelId).catch(() => []),
    ]).then(([chars, rules]) => {
      if (!isMounted) return;
      setCharacters(chars || []);
      setWorldRules(rules || []);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [novelId]);

  const toggleCharacter = (id: string) => {
    if (selectedCharacterIds.includes(id)) {
      onChangeCharacters(selectedCharacterIds.filter((item) => item !== id));
    } else {
      onChangeCharacters([...selectedCharacterIds, id]);
    }
  };

  const toggleRule = (id: string) => {
    if (selectedRuleIds.includes(id)) {
      onChangeRules(selectedRuleIds.filter((item) => item !== id));
    } else {
      onChangeRules([...selectedRuleIds, id]);
    }
  };

  const clearAll = () => {
    onChangeCharacters([]);
    onChangeRules([]);
    if (onChangeIncludePrevChapter) {
      onChangeIncludePrevChapter(false);
    }
  };

  const totalSelectedCount =
    selectedCharacterIds.length +
    selectedRuleIds.length +
    (includePrevChapter ? 1 : 0);

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.personality && c.personality.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.profile && c.profile.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRules = worldRules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.rule_content && r.rule_content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className={`border border-border/70 rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden transition-all shadow-sm ${className}`}
    >
      {/* 头部摘要栏 */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>设定上下文关联</span>
          {totalSelectedCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
              已选 {totalSelectedCount} 项
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">(未绑定，纯自由推演)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalSelectedCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors px-1.5 py-0.5"
            >
              <X className="w-3 h-3" />
              清空
            </button>
          )}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-transform"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {isOpen && (
        <div className="p-3 border-t border-border/50 space-y-3">
          {/* 前序章节快捷开关 */}
          {chapterId && onChangeIncludePrevChapter && (
            <label className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/60 hover:border-amber-500/40 cursor-pointer transition-all">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="text-xs font-medium text-foreground">关联前一章正文片段</div>
                  <div className="text-[10px] text-muted-foreground">
                    自动提取上一章末尾正文作为连续性铺垫
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includePrevChapter}
                onChange={(e) => onChangeIncludePrevChapter(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          )}

          {/* 切换 Tab 与 搜索 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center p-0.5 bg-muted/60 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('CHARACTERS')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'CHARACTERS'
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-500" />
                角色 ({selectedCharacterIds.length}/{characters.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RULES')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'RULES'
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Compass className="w-3 h-3 text-indigo-500" />
                世界法则 ({selectedRuleIds.length}/{worldRules.length})
              </button>
            </div>

            <div className="relative flex-1 max-w-[180px]">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索设定..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-7 pr-2 py-1 rounded-md bg-background border border-border/70 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 列表区 */}
          {isLoading ? (
            <div className="py-4 text-center text-xs text-muted-foreground">加载小说设定集中...</div>
          ) : activeTab === 'CHARACTERS' ? (
            <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredCharacters.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {characters.length === 0 ? '暂无角色，请在人物档案中添加' : '无匹配角色'}
                </div>
              ) : (
                filteredCharacters.map((char) => {
                  const isChecked = selectedCharacterIds.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-foreground'
                          : 'bg-background/40 border-border/40 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${isChecked ? 'text-foreground' : ''}`}>
                            {char.name}
                          </span>
                          {char.personality && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground truncate max-w-[120px]">
                              {char.personality}
                            </span>
                          )}
                        </div>
                        {char.profile && (
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                            {char.profile}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredRules.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {worldRules.length === 0 ? '暂无世界法则，请在世界观设定中添加' : '无匹配法则'}
                </div>
              ) : (
                filteredRules.map((rule) => {
                  const isChecked = selectedRuleIds.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleRule(rule.id)}
                      className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground'
                          : 'bg-background/40 border-border/40 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${isChecked ? 'text-foreground' : ''}`}>
                            {rule.title}
                          </span>
                          {rule.authority_level && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground">
                              {rule.authority_level}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                          {rule.rule_content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
