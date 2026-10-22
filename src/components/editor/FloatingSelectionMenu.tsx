import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { useSkillsStore } from '@/features/skills/useSkillsStore';
import { InlineDiffViewer } from '@/components/common/InlineDiffViewer';
import {
  Sparkles,
  Zap,
  Eye,
  MessageSquare,
  BookmarkPlus,
  Check,
  X,
  Copy,
  Loader2,
  Edit3,
  Clapperboard,
  Target,
} from 'lucide-react';

interface FloatingSelectionMenuProps {
  editor: Editor | null;
}

type ActionKey = 'humanize' | 'dramaturgy' | 'probe' | 'actionize' | 'sensory' | 'dialogue' | 'save_rule';

export const FloatingSelectionMenu: React.FC<FloatingSelectionMenuProps> = ({ editor }) => {
  const { activeNovel, saveCurrentChapter } = useNovelStore();

  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  visibleRef.current = visible;
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);

  // 展开模式状态
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // 监听编辑器选区与滚动
  useEffect(() => {
    if (!editor) return;

    const updateMenuPosition = () => {
      // 若当前正处于展开精修对比视图中，不随意根据鼠标微移关闭
      if (activeAction) return;

      const { from, to, empty } = editor.state.selection;
      if (empty || from === to) {
        if (visibleRef.current) setVisible(false);
        return;
      }

      const text = editor.state.doc.textBetween(from, to, ' ').trim();
      // 至少选中 2 个字符才触发悬浮胶囊
      if (text.length < 2) {
        if (visibleRef.current) setVisible(false);
        return;
      }

      try {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        // 视口相对坐标计算
        const left = (start.left + end.left) / 2;
        const top = Math.min(start.top, end.top) - 10;

        setSelectedText(text);
        setSelectionRange({ from, to });
        setPosition({ top, left });
        setVisible(true);
      } catch (e) {
        // 坐标异常时安全隐藏
        if (visibleRef.current) setVisible(false);
      }
    };

    let rafId: number | null = null;
    const handleScroll = () => {
      // 关键优化：菜单未显示时绝不打扰任何全局滚动，彻底杜绝 Forced Synchronous Reflow
      if (!visibleRef.current) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateMenuPosition();
      });
    };

    // 监听 Tiptap 选区更新与安全滚动
    editor.on('selectionUpdate', updateMenuPosition);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      editor.off('selectionUpdate', updateMenuPosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor, activeAction]);

  // 点击菜单外部时重置关闭
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!isGenerating) {
          handleClose();
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isGenerating]);

  const handleClose = () => {
    setVisible(false);
    setActiveAction(null);
    setGeneratedText('');
    setIsEditingDraft(false);
    setMessage(null);
  };

  // 触发 AI 动作
  const handleTriggerAction = async (action: ActionKey) => {
    if (!editor || !selectedText || !activeNovel) return;

    if (action === 'save_rule') {
      // 快速存为世界观设定
      try {
        const title = selectedText.slice(0, 12).trim() || '新设定法则';
        await api.createWorldRule({
          novel_id: activeNovel.id,
          title,
          rule_content: selectedText,
          authority_level: 'CANON',
        });
        setMessage(`已成功将【${title}】沉淀为世界观法则！`);
        setTimeout(() => handleClose(), 1500);
      } catch (err: any) {
        setMessage(`保存失败: ${err.message || err}`);
      }
      return;
    }

    setActiveAction(action);
    setIsGenerating(true);
    setGeneratedText('');
    setMessage(null);

    let systemPrompt = '你是一名中文小说文学大师。';
    let userPrompt = '';

    const genre = activeNovel.genre_profile || '长篇小说';

    if (action === 'humanize') {
      const { buildPolishingPrompt, getEnabledSkills } = useSkillsStore.getState();
      const activeSkills = getEnabledSkills();
      systemPrompt = `你是一位专精中文小说文学重构与去 AI 味大师。当前搭载已启用的专业技能规范：【${activeSkills.map((s) => s.displayName).join(' + ')}】。严格遵守白名单规则与文学守则，直接输出高质量纯小说正文。`;
      userPrompt = buildPolishingPrompt(
        selectedText,
        genre,
        '彻底消灭套话与机械腔调，强化中式小说身体微动作白描与现场呼吸感'
      );
    } else if (action === 'dramaturgy') {
      const { buildSceneDramaturgePrompt } = useSkillsStore.getState();
      systemPrompt =
        '你是一位小说单场景戏剧导演 (Scene Dramaturge)。精通双导演进场方案（后果切入 vs 细节延迟）与场景呼吸感，严禁给情绪直接贴标签。直接输出重塑后的纯小说段落。';
      userPrompt = buildSceneDramaturgePrompt({
        genre,
        prevContext: selectedText,
        sceneGoal: '消除平淡流水账与情绪贴标签，重构戏剧张力与真实行动后坐力',
      });
    } else if (action === 'probe') {
      systemPrompt =
        '你是一名中文小说角色深度心理与行为决策分析大师。根据选中的当下小说剧情，推演出角色最精彩的下一步应对抉择（结合内心算盘、身体微动作与试探对白）。直接输出推演改写后的纯小说正文。';
      userPrompt = `请以此情境为依据，为主要当事角色输出最具戏剧张力与心理纵深的【下一步微动作与试探对白】：\n\n【原文】：\n${selectedText}\n\n要求：\n1. 包含具体的身体微动作白描；\n2. 包含带有潜台词的试探话术；\n3. 直接输出纯小说正文：`;
    } else if (action === 'actionize') {
      systemPrompt =
        '你是一名小说动作白描大师。擅长将抽象情绪、心理独白与说明文宣告，彻底转化为具体可感的身体微反应、手头动作、物理受力与环境互动。';
      userPrompt = `请将以下小说段落中的心理活动或概括叙述，彻底重构成高密度的【具体身体微动作、生理反馈与现场物象互动白描】：\n\n【原文】：\n${selectedText}\n\n要求：\n1. 严禁出现“感到恐惧/愤怒”等心理结论；\n2. 纯动作与细节推进，直接输出改写后的纯小说正文：`;
    } else if (action === 'sensory') {
      systemPrompt =
        '你是一名小说感官沉浸大师。擅长为干瘪粗疏的情节注入视、听、嗅、触、味与温度光影的五感细节。';
      userPrompt = `请为以下小说片段注入沉浸式的【五感细节（声响、光影、气味、冷暖触感与环境物象）】：\n\n【原文】：\n${selectedText}\n\n要求：\n1. 丰富在场感，描写要融入当事人的生理呼吸；\n2. 直接输出扩写重塑后的纯小说正文：`;
    } else if (action === 'dialogue') {
      systemPrompt =
        '你是一名小说台词大师。擅长撰写带有阶层口吻、时代烟火气、潜台词博弈与呼吸感的人性化对白。';
      userPrompt = `请精修润色以下片段中的对话交锋：\n\n【原文】：\n${selectedText}\n\n要求：\n1. 消除大段宣讲说明腔，增加潜台词博弈与说话时的手头微动作；\n2. 直接输出精修后的纯小说正文：`;
    }

    try {
      const res = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        temperature: 0.7,
        max_tokens: 1500,
      });

      setGeneratedText(res.trim());
    } catch (e: any) {
      console.error('划词 AI 生成失败:', e);
      setMessage(`生成失败: ${e.message || e}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 一键采纳替换
  const handleApplyReplacement = async () => {
    if (!editor || !selectionRange || !generatedText) return;

    const { from, to } = selectionRange;

    // 原子化替换选中文本
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(generatedText)
      .run();

    // 立即同步更新 store 中正文，避免 250ms 防抖延迟导致快照存盘旧正文
    useNovelStore.getState().updateEditorContent(editor.getHTML());

    // 触发安全保存并生成快照
    await saveCurrentChapter(true, 'INLINE_AI_APPLY');

    handleClose();
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  const isExpanded = Boolean(activeAction);
  const isNearTop = position.top < (isExpanded ? 360 : 110);

  let topStyle: string;
  let transformStyle: string;
  let leftStyle: string;

  if (isExpanded) {
    const cardTop = Math.max(68, Math.min(window.innerHeight - 420, position.top - 100));
    const cardLeft = Math.max(250, Math.min(window.innerWidth - 250, position.left));
    topStyle = `${cardTop}px`;
    leftStyle = `${cardLeft}px`;
    transformStyle = 'translate(-50%, 0)';
  } else {
    const capsuleLeft = Math.max(190, Math.min(window.innerWidth - 190, position.left));
    leftStyle = `${capsuleLeft}px`;
    if (isNearTop) {
      topStyle = `${Math.max(65, position.top + 28)}px`;
      transformStyle = 'translate(-50%, 0)';
    } else {
      topStyle = `${position.top}px`;
      transformStyle = 'translate(-50%, -100%)';
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: topStyle,
        left: leftStyle,
        transform: transformStyle,
      }}
      className="z-50 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 紧凑悬浮胶囊条 */}
      {!activeAction ? (
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[#231f1a] dark:bg-[#1a1714] text-white shadow-2xl border border-amber-600/40 text-xs">
          <button
            type="button"
            onClick={() => handleTriggerAction('humanize')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-amber-600/30 text-amber-300 font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="以 Humanizer 准则深度祛除 AI 味与机械套话"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>去AI味</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('dramaturgy')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-orange-600/30 text-orange-300 font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="Scene Dramaturge 双导演方案进场重塑（消除流水账与情绪贴标签）"
          >
            <Clapperboard className="w-3.5 h-3.5 text-orange-400" />
            <span>戏剧重塑</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('probe')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-amber-600/30 text-amber-200 font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="以此段情境为依据，探查角色下一步会作何反应与决策"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>探他抉择</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('actionize')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-stone-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="将抽象心理或叙述转化为具体身体微动作白描"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>动作化</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('sensory')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-stone-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="注入声响、气味、光影与触感五感细节"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>五感扩写</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('dialogue')}
            className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-stone-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="优化对白潜台词、微动作与人情世故"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>润色对白</span>
          </button>

          <div className="w-px h-3 bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={() => handleTriggerAction('save_rule')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 transition cursor-pointer"
            title="一键沉淀为世界观法则 (Canon)"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
            title="关闭浮窗"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* 展开卡片：红绿两色原地 Diff 对比与采纳面板 (自适应最大高度与滚动，防上下截断) */
        <div className="w-[92vw] max-w-[480px] max-h-[82vh] overflow-y-auto p-4 rounded-2xl bg-surface dark:bg-[#1f1c18] border border-line dark:border-amber-900/30 shadow-2xl space-y-3 text-xs text-ink dark:text-stone-200">
          {/* 卡片头部 */}
          <div className="flex items-center justify-between border-b border-line dark:border-stone-800 pb-2">
            <div className="flex items-center gap-2 font-serif font-bold text-sm text-primary dark:text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                {activeAction === 'humanize' && 'Humanizer 去AI味重塑'}
                {activeAction === 'actionize' && '动作化白描重构'}
                {activeAction === 'sensory' && '五感细节沉浸扩写'}
                {activeAction === 'dialogue' && '对白机锋与微表情精修'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 生成中状态 */}
          {isGenerating && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-500">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              <span className="text-xs font-serif">正在依据 Humanizer 准则外科手术式精修...</span>
            </div>
          )}

          {/* 错误或提示信息 */}
          {message && !isGenerating && (
            <div className="p-2 rounded-lg bg-amber-500/10 text-primary dark:text-amber-300 text-[11px]">
              {message}
            </div>
          )}

          {/* 生成完成：可视化红绿 Diff 渲染 */}
          {!isGenerating && generatedText && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-stone-500 flex items-center justify-between">
                <span>行内差异对比 (红色删除线为原句，绿色为精修)：</span>
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="text-primary dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingDraft ? '查看Diff' : '手动微调'}</span>
                </button>
              </div>

              {isEditingDraft ? (
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-amber-600 leading-relaxed font-sans"
                />
              ) : (
                <InlineDiffViewer
                  original={selectedText}
                  revised={generatedText}
                  className="max-h-48 overflow-y-auto"
                />
              )}

              {/* 底部操作按钮栏 */}
              <div className="flex items-center justify-between pt-2 border-t border-line dark:border-stone-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1 transition cursor-pointer"
                    title="仅复制精修结果"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-stone-500 transition cursor-pointer"
                  >
                    放弃
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyReplacement}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/15 transition cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>采纳替换原句</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
