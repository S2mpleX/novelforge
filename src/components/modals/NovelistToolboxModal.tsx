import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type { ToolboxActionType } from '@/types';
import { ContextPicker } from '@/components/common/ContextPicker';
import { HumanizerEngine } from '@/features/humanizer/HumanizerEngine';
import {
  Sparkles,
  BookOpen,
  Wand2,
  Users,
  Compass,
  FileText,
  Copy,
  Check,
  X,
  Loader2,
  RefreshCw,
  Flame,
  Zap,
} from 'lucide-react';

interface ToolActionMeta {
  type: ToolboxActionType;
  title: string;
  category: string;
  description: string;
  placeholder: string;
  defaultDestination: 'insert_editor' | 'save_as_character' | 'save_as_rule' | 'save_as_chapter';
}

const TOOLBOX_ACTIONS: ToolActionMeta[] = [
  {
    type: 'name',
    title: '书名与角色起名',
    category: '灵感起步',
    description: '结合题材基调与人物性格，生成具有网文记忆点和辨识度的好名字',
    placeholder: '例：设计一个看似温润如玉、实则执掌生死因果的古仙门弃徒名字...',
    defaultDestination: 'save_as_character',
  },
  {
    type: 'intro',
    title: '爆款作品简介',
    category: '灵感起步',
    description: '制造极强期待感、戏剧反差与核心金手指卖点的百字吸睛简介',
    placeholder: '例：突出主角穿越到寿元可被交易的世界，从最底层典当行开始逆风翻盘...',
    defaultDestination: 'insert_editor',
  },
  {
    type: 'premise',
    title: '颠覆核心脑洞',
    category: '世界架构',
    description: '打破传统套路，设计具有新颖规则和因果冲突的奇特世界观脑洞',
    placeholder: '例：若神明必须通过吸收人类的遗忘才能获得神力，主角拥有绝对记忆...',
    defaultDestination: 'save_as_rule',
  },
  {
    type: 'cheat',
    title: '金手指与系统设计',
    category: '力量体系',
    description: '打造自洽且极具爽感成长的外挂系统、运行机制、兑换体系与代价平衡',
    placeholder: '例：设计一个按秒结算复利真气的投资型修炼系统，具有不可逆的规则限制...',
    defaultDestination: 'save_as_rule',
  },
  {
    type: 'world_law',
    title: '力量境界与世界法则',
    category: '力量体系',
    description: '定义严谨的位阶晋升机制、破境禁忌、世界公理与天地异象',
    placeholder: '例：九大仙道境界，每一层晋升都需要吞噬一种天地特质的情绪...',
    defaultDestination: 'save_as_rule',
  },
  {
    type: 'gold_opening',
    title: '黄金三章开门杀',
    category: '剧情推进',
    description: '设计第一章危机开局、压迫感临界点与身份认同剧变，快速抓住读者',
    placeholder: '例：开局三分钟即面临宗门灭顶之灾，主角在密室中强行开启禁忌仪式...',
    defaultDestination: 'save_as_chapter',
  },
  {
    type: 'chapter_outline',
    title: '单章细纲与戏剧节拍',
    category: '剧情推进',
    description: '拆解三幕式冲突、推进目标、期待感布置与章末断章悬念钩子',
    placeholder: '例：本章主角潜入拍卖会截胡关键灵草，遭遇宿敌抬价，最后压哨反杀...',
    defaultDestination: 'insert_editor',
  },
  {
    type: 'dialogue_polish',
    title: '对白交锋与微表情精修',
    category: '文字精炼',
    description: '消除AI说教味，强化言辞机锋、潜台词博弈与具有呼吸感的微表情',
    placeholder: '例：将原本直白的质问改写为看似客气、实则步步紧逼的诛心之语...',
    defaultDestination: 'insert_editor',
  },
  {
    type: 'humanizer_polish',
    title: 'Humanizer 去AI味重塑',
    category: '文字精炼',
    description: '深度剔除"嘴角勾起/眼中闪过/仿佛/深吸一口气"等50+种机械套话，强化生理触感与潜台词留白',
    placeholder: '粘贴需要去AI味、注入生活呼吸感与文学质感的正文段落（点击下方可一键填入当前正文）...',
    defaultDestination: 'insert_editor',
  },
];

interface NovelistToolboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: ToolboxActionType;
}

export const NovelistToolboxModal: React.FC<NovelistToolboxModalProps> = ({
  isOpen,
  onClose,
  initialAction = 'name',
}) => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
    loadChapters,
  } = useNovelStore();

  const [selectedActionType, setSelectedActionType] = useState<ToolboxActionType>(initialAction);
  const [customInput, setCustomInput] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [includePrevChapter, setIncludePrevChapter] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAction = TOOLBOX_ACTIONS.find((a) => a.type === selectedActionType) || TOOLBOX_ACTIONS[0];

  const handleGenerate = async () => {
    if (!activeNovel) {
      setStatusMessage('请先选择或创建一部小说作品');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('正在根据关联设定装配上下文提示词...');

    try {
      // 1. 装配提示词
      const assembled = await api.assembleToolboxPrompt({
        novel_id: activeNovel.id,
        action_type: selectedActionType,
        chapter_id: activeChapter?.id,
        custom_input: customInput.trim() || null,
        character_ids: selectedCharacterIds.length > 0 ? selectedCharacterIds : null,
        world_rule_ids: selectedRuleIds.length > 0 ? selectedRuleIds : null,
        include_prev_chapter: includePrevChapter,
        include_memo: false,
      });

      setStatusMessage('正在驱动模型网关生成专业方案...');

      // 2. 调用真实的 LLM 生成
      const generated = await api.executeLlmChat({
        system_prompt: assembled.system_prompt,
        user_prompt: assembled.user_prompt,
        temperature: 0.75,
        max_tokens: 2500,
      });

      setResultText(generated);
      setStatusMessage('创作完成！支持在右侧卡片原地修改打磨或一键落地。');
    } catch (e: any) {
      console.error('Toolbox generation error:', e);
      setStatusMessage(`生成失败: ${e.message || e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 快捷动作：插入当前正文
  const handleInsertEditor = async () => {
    if (!activeChapter) {
      setStatusMessage('未打开章节，请先在正文编辑器中打开目标章节');
      return;
    }
    const formatted = resultText
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    const newContent = (editorContent || '') + formatted;
    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'TOOLBOX_APPEND');
    setStatusMessage('已成功追加至当前章节末尾！');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 快捷动作：保存为新角色
  const handleSaveAsCharacter = async () => {
    if (!activeNovel) return;
    const nameMatch = resultText.match(/【?([^】：\n\r(（]{2,8})[】(（]?/);
    const candidateName = nameMatch ? nameMatch[1].trim() : '新人物';

    try {
      await api.createCharacter({
        novel_id: activeNovel.id,
        name: candidateName,
        profile: resultText.slice(0, 500),
        personality: '待补充',
        motivation: '待梳理',
      });
      setStatusMessage(`已成功将【${candidateName}】保存至人物档案！`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`保存角色失败: ${e.message || e}`);
    }
  };

  // 快捷动作：保存为世界法则
  const handleSaveAsRule = async () => {
    if (!activeNovel) return;
    const titleMatch = resultText.match(/【?([^】：\n\r]{2,12})[】：]/);
    const candidateTitle = titleMatch ? titleMatch[1].trim() : '新设定法则';

    try {
      await api.createWorldRule({
        novel_id: activeNovel.id,
        title: candidateTitle,
        rule_content: resultText,
        authority_level: 'CANON',
      });
      setStatusMessage(`已成功将【${candidateTitle}】保存至世界法则！`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`保存法则失败: ${e.message || e}`);
    }
  };

  // 快捷动作：创建为新章节
  const handleSaveAsChapter = async () => {
    if (!activeNovel) return;
    const titleMatch = resultText.match(/第[一二三四五六七八九十百0-9]+章[：\s]+([^\n\r]+)/);
    const candidateTitle = titleMatch ? titleMatch[1].trim() : `${currentAction.title}生成稿`;

    try {
      await api.createChapter({
        novel_id: activeNovel.id,
        title: candidateTitle,
        initial_content: resultText,
      });
      await loadChapters(activeNovel.id);
      setStatusMessage(`已成功根据生成方案创建新章节《${candidateTitle}》！`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage(`创建新章节失败: ${e.message || e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-5xl h-[88vh] rounded-2xl border border-border/80 shadow-2xl flex flex-col overflow-hidden">
        {/* 顶栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                一体化小说专项工具箱
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  V2.3 竞品升级
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                作品《{activeNovel?.title || '未选择'}》· 结合设定集深度推演，一键直连模型网关
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体分栏 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：8大专项导航 */}
          <div className="w-56 border-r border-border/60 bg-muted/10 p-3 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              小说创作专项
            </div>
            {TOOLBOX_ACTIONS.map((action) => {
              const isSelected = action.type === selectedActionType;
              return (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => {
                    setSelectedActionType(action.type);
                    setResultText('');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30 shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{action.title}</span>
                    <span className="text-[10px] text-muted-foreground opacity-75">{action.category}</span>
                  </div>
                  <span className="text-[10px] opacity-70 line-clamp-1">{action.description}</span>
                </button>
              );
            })}
          </div>

          {/* 中间：输入与设定上下文配置 */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 border-r border-border/60 flex flex-col">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {currentAction.title}
                </h3>
                <span className="text-xs text-muted-foreground">{currentAction.description}</span>
              </div>

              {/* 上下文选择器 */}
              {activeNovel && (
                <ContextPicker
                  novelId={activeNovel.id}
                  chapterId={activeChapter?.id}
                  selectedCharacterIds={selectedCharacterIds}
                  onChangeCharacters={setSelectedCharacterIds}
                  selectedRuleIds={selectedRuleIds}
                  onChangeRules={setSelectedRuleIds}
                  includePrevChapter={includePrevChapter}
                  onChangeIncludePrevChapter={setIncludePrevChapter}
                  compact={false}
                />
              )}
            </div>

            {/* 用户个性化需求 */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  {selectedActionType === 'humanizer_polish' ? '待去AI味重塑的正文段落：' : '个性化构思与定制需求（选填）：'}
                </label>
                <div className="flex items-center gap-2">
                  {activeChapter && editorContent && (
                    <button
                      type="button"
                      onClick={() => {
                        const plain = editorContent.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
                        setCustomInput(plain);
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>从当前章节载入正文</span>
                    </button>
                  )}
                  <span className="text-[11px] text-muted-foreground">留空则由 AI 自动推演</span>
                </div>
              </div>

              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={currentAction.placeholder}
                rows={5}
                className="w-full text-xs p-3 rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans leading-relaxed"
              />

              {/* 实时 Humanizer 诊断状态条 */}
              {customInput.trim().length > 10 && (() => {
                const audit = HumanizerEngine.auditText(customInput);
                return (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1.5 text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Humanizer 质感诊断:
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          audit.score >= 85 ? 'bg-emerald-500/15 text-emerald-600' :
                          audit.score >= 65 ? 'bg-amber-500/15 text-amber-600' : 'bg-rose-500/15 text-rose-600'
                        }`}>
                          {audit.score} 分 ({audit.score >= 85 ? '自然人情味' : audit.score >= 65 ? '轻度AI腔' : '严重AI套话'})
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        检出套话: <strong className={audit.clicheCount > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>{audit.clicheCount}</strong> 处
                      </span>
                    </div>

                    {audit.matches.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                        {Array.from(new Set(audit.matches.map(m => m.phrase))).slice(0, 8).map((phrase) => (
                          <span
                            key={phrase}
                            className="px-1.5 py-0.5 text-[10px] rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20 font-mono"
                            title="典型 AI 模板套话，建议用具象动作或生理反应替换"
                          >
                            ⚠️ {phrase}
                          </span>
                        ))}
                        {audit.matches.length > 8 && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            等共 {audit.matches.length} 处
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 执行生成按钮 */}
            <div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !activeNovel}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在推演生成中...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    立即生成【{currentAction.title}】方案
                  </>
                )}
              </button>

              {statusMessage && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 text-center animate-fade-in font-medium">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：生成成果与落地打磨区 */}
          <div className="w-[45%] p-5 bg-muted/5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">推演结果（支持原地编辑修改）</span>
              </div>
              {resultText && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    重新生成
                  </button>
                </div>
              )}
            </div>

            {/* 结果编辑框 */}
            <div className="flex-1 min-h-[300px] mb-3">
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="生成的内容将呈现在这里。您可以直接在此处打磨润色、微调细节，然后通过下方快捷按钮无缝落地到小说设定或正文中..."
                className="w-full h-full text-xs p-3.5 rounded-xl bg-card border border-border/80 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans leading-relaxed custom-scrollbar shadow-inner"
              />
            </div>

            {/* 快捷落地按钮群 */}
            {resultText ? (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="text-[11px] font-medium text-muted-foreground">一键落地到小说工程：</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleInsertEditor}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-medium transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    追加至当前章节
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsCharacter}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    存为新人物档案
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsRule}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-medium transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    存为世界法则
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsChapter}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    创建为新章节
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground/60">
                暂无生成内容，请在左侧配置需求后点击开始推演
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
