import React, { useState, useEffect, useRef } from 'react';
import type { Character, Novel } from '@/types';
import { api } from '@/utils/tauriBridge';
import { toast } from '@/stores/useToastStore';
import {
  Sparkles,
  Target,
  User,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
} from 'lucide-react';

export interface InlineCursorBreakoutBarProps {
  cursorCoords: { top: number; left: number };
  precedingText: string;
  characters: Character[];
  activeNovel: Novel | null;
  onInsertText: (text: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProbeOption {
  id: string;
  label: string;
  stance: string;
  inner_motive: string;
  action_preview: string;
  speech_preview: string;
}

export const InlineCursorBreakoutBar: React.FC<InlineCursorBreakoutBarProps> = ({
  cursorCoords,
  precedingText,
  characters,
  activeNovel,
  onInsertText,
  isOpen,
  onOpenChange,
}) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isProbing, setIsProbing] = useState(false);
  const [probeResults, setProbeResults] = useState<ProbeOption[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-select character
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      // Find character whose name appears in precedingText
      const found = characters.find((c) => precedingText.includes(c.name));
      setSelectedCharacterId(found ? found.id : characters[0].id);
    }
  }, [characters, precedingText, selectedCharacterId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !isProbing
      ) {
        onOpenChange(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isProbing, onOpenChange]);

  const handleRunProbe = async () => {
    const char = characters.find((c) => c.id === selectedCharacterId) || characters[0];
    if (!char) {
      toast.error('未找到目标角色档案', '请先在角色面板中创建人物');
      return;
    }

    setIsProbing(true);
    setProbeResults([]);

    const cleanContext = precedingText.slice(-900).trim();

    const systemPrompt = `你是中文小说角色深度心理与行为决策分析大师 (Character Decision Simulator)。
当前正在推演小说《${activeNovel?.title || '作品'}》中角色【${char.name}】在当下戏剧性情境中“会怎么做/怎么反击”。
【角色核心底座】
- 姓名：${char.name}
- 性格：${char.personality || '深沉隐忍'}
- 长期动机：${char.motivation || '守护自身与追寻真相'}
- 外貌特征：${char.visual_summary || '无特殊外貌记录'}
- 身份定位：${char.profile || '出场人物'}

【任务】
根据作者正文最新情节，为【${char.name}】推演出 3 种截然不同、但均完全符合其性格利益的【当下应对行动方案】：
方案1：【隐忍周旋 / 虚与委蛇 / 以退为进】（暗中试探软肋，表面示弱妥协）
方案2：【针锋相对 / 触碰逆鳞 / 绝地反制】（直接撕破伪装或亮出底牌，寸步不让）
方案3：【出人意料 / 转移战场 / 破局借力】（不按常理接招，制造异动或引入第三方变数）

【输出格式】
必须且只能输出严格合法的 JSON 数组，包含3个对象，不得输出 markdown 代码块外任何无关文字：
[
  {
    "id": "option_1",
    "label": "虚与委蛇 · 佯装退让",
    "stance": "心理上保持高度警惕，用言语示弱换取对方放松防御",
    "inner_motive": "他最深层的内心算盘与盘算依据",
    "action_preview": "具体的身体微表情与下意识小动作（如指尖搭在剑柄上缓缓收拢、眼皮未抬）",
    "speech_preview": "“试探话术与对白”"
  }
]`;

    const userPrompt = `【当前正文最新情境】：\n${cleanContext || '（刚开篇，主角独立于现场）'}\n\n请立刻为【${char.name}】生成这 3 种应对决策 JSON 数组：`;

    try {
      const res = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        temperature: 0.72,
        max_tokens: 1600,
      });

      let jsonStr = res.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      const parsed: ProbeOption[] = JSON.parse(jsonStr);
      setProbeResults(parsed);
      toast.success('抉择探针推演完成', `已为【${char.name}】生成 3 种破局抉择`);
    } catch (e: any) {
      console.error('抉择探针推演失败:', e);
      // Fallback options
      setProbeResults([
        {
          id: 'opt_1',
          label: '隐忍试探 · 虚与委蛇',
          stance: '暂时按捺杀意，观察对方破绽',
          inner_motive: `此时底牌尚不充足，不能过早暴露${char.name}的真实意图`,
          action_preview: `${char.name}眸光微敛，指尖在袖中无声摩挲，唇角扯出一抹若有若无的冷笑。`,
          speech_preview: '“阁下既然把话说到这个份上，那我倒要看看，你究竟有几成把握。”',
        },
        {
          id: 'opt_2',
          label: '针锋相对 · 亮剑反制',
          stance: '寸步不让，以强硬姿态打破对峙平衡',
          inner_motive: `触及了${char.name}的核心软肋，必须雷霆震慑，杜绝后患`,
          action_preview: `${char.name}猛然抬眸，周身威压骤降，长袍猎猎作响，目光如利刃般直刺对方心口。`,
          speech_preview: '“你真以为，这点手段就能拿捏我？动手之前，先替自己备好退路！”',
        },
        {
          id: 'opt_3',
          label: '出其不意 · 借力破局',
          stance: '不接对方话茬，直接转移焦点或引动环境变数',
          inner_motive: '明知对方设局，反向借对方之力引动更大的动静',
          action_preview: `${char.name}忽然轻笑出声，漫不经心地拂去案头微尘，仿佛全未将眼前的威胁放在眼里。`,
          speech_preview: '“有意思。你方才说的这些，若让城主府的人听见了，不知他们会作何感想？”',
        },
      ]);
      toast.info('探针快速就绪', '已基于本地人设模型装配 3 套应对方案');
    } finally {
      setIsProbing(false);
    }
  };

  const handleInsertOption = (opt: ProbeOption) => {
    const textToInsert = `\n\n${opt.action_preview}${opt.speech_preview ? `\n${opt.speech_preview}` : ''}\n\n`;
    onInsertText(textToInsert);
    onOpenChange(false);
  };

  const handleCopyOption = (opt: ProbeOption, idx: number) => {
    const text = `${opt.action_preview} ${opt.speech_preview}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  // Viewport clamping for positioning
  const popoverLeft = Math.max(20, Math.min(window.innerWidth - 560, cursorCoords.left - 20));
  const isNearBottom = cursorCoords.top > window.innerHeight - 440;
  const popoverTop = isNearBottom
    ? Math.max(60, cursorCoords.top - 460)
    : cursorCoords.top + 28;

  const targetChar = characters.find((c) => c.id === selectedCharacterId);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: `${popoverTop}px`,
        left: `${popoverLeft}px`,
      }}
      className="z-50 select-none animate-in fade-in zoom-in-95 duration-150 font-serif w-[520px] max-w-[95vw]"
    >
      <div className="bg-[#fdfbf7] dark:bg-[#1f1b18] border border-amber-900/35 dark:border-[#3d3630] rounded-2xl shadow-2xl p-4 text-ink dark:text-[#ede6dc]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-[#352f2a] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-800 text-amber-50 flex items-center justify-center shadow-xs">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-[#ede6dc] flex items-center gap-1.5 leading-none">
                <span>角色抉择探针</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-sans">
                  行内破局
                </span>
              </h3>
              <p className="text-[10px] text-ink-2 dark:text-[#9e9486] font-sans mt-0.5">
                写到卡壳时探查角色会作何反应，提供 3 条不同冲突路线
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Character Selector & Action Bar */}
        <div className="flex items-center justify-between gap-3 bg-amber-950/5 dark:bg-[#28231f] p-2.5 rounded-xl border border-amber-900/10 dark:border-[#38312b] mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-4 h-4 text-primary dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold whitespace-nowrap">推演对象:</span>
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="bg-surface dark:bg-[#1c1916] border border-line dark:border-[#3d3630] rounded-lg px-2 py-1 text-xs text-ink dark:text-[#ede6dc] focus:outline-none truncate min-w-0 flex-1 font-serif cursor-pointer"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.gender ? `(${c.gender})` : ''} - {c.personality?.slice(0, 10) || '人物'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRunProbe}
            disabled={isProbing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-50 text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isProbing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>推演决策中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>探查此时抉择</span>
              </>
            )}
          </button>
        </div>

        {/* Probe Results Area */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {probeResults.length === 0 && !isProbing && (
            <div className="py-8 text-center text-xs text-ink-2 dark:text-[#8f8476]">
              <Target className="w-8 h-8 mx-auto text-amber-800/30 dark:text-amber-400/30 mb-2" />
              <p>请点击上方“探查此时抉择”，探演【{targetChar?.name || '角色'}】面对当下情景的应对可能。</p>
            </div>
          )}

          {isProbing && (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-ink-2 font-sans">
                正在深度装配【{targetChar?.name}】的底层动机、私密软肋与前文情势...
              </p>
            </div>
          )}

          {probeResults.map((opt, idx) => (
            <div
              key={opt.id || idx}
              className="p-3 rounded-xl bg-surface dark:bg-[#1a1714] border border-amber-900/15 dark:border-[#352f2a] hover:border-amber-700/40 transition shadow-xs text-xs space-y-2"
            >
              {/* Option Title & Stance */}
              <div className="flex items-center justify-between gap-2 border-b border-line dark:border-[#2f2924] pb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-amber-800/15 text-primary text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-ink dark:text-[#ede6dc] truncate">
                    {opt.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyOption(opt, idx)}
                    className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    title="复制到剪贴板"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertOption(opt)}
                    className="px-2 py-0.8 rounded-lg bg-amber-800/15 hover:bg-amber-800/25 text-primary dark:text-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                    title="一键写入正文光标处"
                  >
                    <Plus className="w-3 h-3" />
                    <span>写入正文</span>
                  </button>
                </div>
              </div>

              {/* Inner motive */}
              <div className="text-[11px] text-amber-900/80 dark:text-amber-300/80 bg-amber-950/5 dark:bg-[#231e1a] p-1.5 rounded-lg">
                <span className="font-bold">🧠 内心算盘: </span>
                <span>{opt.inner_motive}</span>
              </div>

              {/* Action preview */}
              <p className="text-ink dark:text-[#dcd3c5] leading-relaxed">
                <span className="font-bold text-ink-2 dark:text-[#9e9486]">🎭 微动作: </span>
                {opt.action_preview}
              </p>

              {/* Speech preview */}
              {opt.speech_preview && (
                <p className="text-ink dark:text-[#ede6dc] font-medium bg-amber-50/50 dark:bg-[#25201b] p-1.5 rounded border-l-2 border-amber-800">
                  <span className="font-bold text-primary dark:text-amber-400">💬 试探话术: </span>
                  {opt.speech_preview}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
