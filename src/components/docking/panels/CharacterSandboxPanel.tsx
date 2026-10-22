import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useShallow } from 'zustand/react/shallow';
import { useToastStore } from '@/stores/useToastStore';
import { api } from '@/utils/tauriBridge';
import { confirmDialog } from '@/utils/dialog';
import { CharacterAvatarModal } from '@/components/modals/CharacterAvatarModal';
import { optimizeImageFileToDataUrl } from '@/utils/imageOptimizer';
import type {
  Character,
  AiProvider,
  AiModel,
  CharacterActorConfig,
  DialogueRoundRecord,
  CharacterSandboxSession,
  SandboxBranch,
  InspirationNote,
  CharacterActionOption,
} from '@/types';
import {
  Users,
  Swords,
  Play,
  Pause,
  SkipForward,
  Sparkles,
  Eye,
  EyeOff,
  Edit2,
  Check,
  Trash2,
  MessageSquare,
  BookOpen,
  Copy,
  FileText,
  Send,
  X,
  Flame,
  ArrowLeftRight,
  Download,
  Share2,
  BookmarkPlus,
  Compass,
  RotateCcw,
  ChevronDown,
  Plus,
  ArrowDown,
  Lightbulb,
  Globe,
  GitBranch,
  AlertTriangle,
  MessageCircle,
  Sliders,
  Target,
  Image,
  Upload,
  Loader2,
  Split,
  Dices,
  GitCompare,
  Pin,
  ArrowRight,
} from 'lucide-react';
import { useCollaborationStore } from '@/stores/useCollaborationStore';
const CollaborationModal = lazy(() => import('@/components/collaboration/CollaborationModal').then(m => ({ default: m.CollaborationModal })));
import { SandboxImportBibleModal } from '@/components/modals/SandboxImportBibleModal';
const SettingsModal = lazy(() => import('@/components/modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
import {
  auditPersonaDrift,
  generatePersonaCorrectionPrompt,
  distillSubtext,
} from '@/utils/personaAuditor';

export interface SandboxPresetTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  scene_setting: string;
  scene_goal: string;
  motivation_a: string;
  secret_a: string;
  motivation_b: string;
  secret_b: string;
}

export const SANDBOX_PRESET_TEMPLATES: SandboxPresetTemplate[] = [
  {
    id: 'secret_room_interrogation',
    name: '密室试探',
    icon: '🔍',
    title: '密室试探与解药虚实',
    scene_setting: '昏暗内室，油灯微光摇曳，窗外雷雨交加，桌上一盏残茶早已冰凉。',
    scene_goal: '双方互相试探对方是否掌握当年真相，严守底线，在6轮内决裂或达成口头协议。',
    motivation_a: '试探对方是否查明解药去向，绝不能让他发现我已受内伤。',
    secret_a: '解药就在我袖中夹层里，但我功力暂时无法运转。',
    motivation_b: '逼迫对方交出解药，言语施压逼其露出破绽。',
    secret_b: '门外其实根本没有援兵，我是孤身前来虚张声势。',
  },
  {
    id: 'banquet_hidden_daggers',
    name: '鸿门夜宴',
    icon: '🍷',
    title: '鸿门夜宴 · 笑里藏刀',
    scene_setting: '灯火通明的王府偏厅，丝竹管弦微弱，案上珍馐罗列，两人推杯换盏，神情亲昵却目带杀机。',
    scene_goal: '以敬酒祝寿为名连环发难，逼迫对方主动交出兵权；对方则以退为进，暗讽其弑兄夺嫡的罪证。',
    motivation_a: '借酒劲试探他的野心，若他稍有不臣之心，摔杯为号。',
    secret_a: '屏风后已埋伏了十二名刀斧手，只待我掷杯为号。',
    motivation_b: '虚与委蛇，假装醉酒，套出今夜王府的换防口令。',
    secret_b: '我袖中藏着先帝真正的遗诏，已做好同归于尽的准备。',
  },
  {
    id: 'identity_unmasking',
    name: '当面掉马',
    icon: '⚡',
    title: '当面掉马 · 身份戳穿',
    scene_setting: '深夜的藏书阁深处，尘埃在月光中浮动，窗棂上映出两人一前一后的剪影。',
    scene_goal: '隐忍潜伏三年的卧底身份突然被对方轻描淡写戳破，双方展开极度克制却凶险至极的心理防线绞杀。',
    motivation_a: '稳住阵脚，无论对方如何试探，死不认账，暗中计算逃生路线。',
    secret_a: '密阁的机关钥匙已经在刚才被我偷梁换柱。',
    motivation_b: '不急于动手，欣赏对方强作镇定的狼狈，逼其弃暗投明成为双面间谍。',
    secret_b: '其实我并无确凿证据，只是在用诈术炸他。',
  },
  {
    id: 'cliff_betrayal',
    name: '生死决裂',
    icon: '🗡️',
    title: '绝壁残阳 · 终极决裂',
    scene_setting: '断魂崖边，狂风猎猎，夕阳如血，脚下是万丈深渊，两人身上的战袍皆染满血污。',
    scene_goal: '多年同生共死的挚友在唯一的飞升/生还名额面前图穷匕见，信念与过往情义的彻底撕裂。',
    motivation_a: '劝说对方放弃执念，若执迷不悟，哪怕斩断旧情也要夺取机缘。',
    secret_a: '我体内已无半点灵力，全靠一口本命真元撑着佩剑。',
    motivation_b: '痛斥对方当年背叛盟约的虚伪，宁为玉碎不为瓦全。',
    secret_b: '我怀里还留着当年结义时你送给我的护心镜。',
  },
  {
    id: 'warlords_bargain',
    name: '利益拉扯',
    icon: '⚖️',
    title: '枭雄分羹 · 利益博弈',
    scene_setting: '两军阵前的中立营帐，战马嘶鸣隐隐可闻，沙盘地图上插满了代表势力的赤黑两色令旗。',
    scene_goal: '两大霸主商讨瓜分沦陷州府的税银与灵矿，寸土不让，在刀刃上求得脆弱的平衡。',
    motivation_a: '坚决拿下黑水城的开采权，为此可以出让部分粮道作为交换。',
    secret_a: '我军的粮草实际上只够维持三日。',
    motivation_b: '看穿对方粮道软肋，步步紧逼索要关隘驻军权。',
    secret_b: '主城昨夜爆发瘟疫，我比对方更渴望尽早停战。',
  },
  {
    id: 'past_lovers_duel',
    name: '旧情反目',
    icon: '🥀',
    title: '长街偶遇 · 剑拔弩张',
    scene_setting: '冷雨淅沥的雨夜石桥上，一把红伞，一把铁伞，水波倒映着拔出的半截寒锋。',
    scene_goal: '曾经的恋人因阵营与师门血仇相逢，每一句对话都在割舍旧情与服从使命之间撕扯。',
    motivation_a: '希望逼退对方，留其一条生路，但不能被师门发现徇私。',
    secret_a: '当年放走你全家的那把火，其实是我亲手点的。',
    motivation_b: '求死以证道，同时想从对方口中得到一句当年的真心话。',
    secret_b: '我服了绝脉丹，无论今夜胜负如何我都活不过拂晓。',
  },
];

/**
 * 测算每轮对戏的戏剧张力指数 (1~10)
 */
export function calculateDialogueTension(round: DialogueRoundRecord): {
  level: number;
  label: string;
  colorClass: string;
} {
  if (round.is_narrator_event) {
    return { level: 8, label: '环境突变', colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
  }

  let score = Math.min(10, Math.max(1, Math.floor((round.round_index / 8) * 6) + 2));
  const text = (round.character_action + ' ' + round.speech).toLowerCase();

  if (/拔剑|拔刀|杀|死|毒|斩|绝|掀|血|断|命|阎王|同归于尽/.test(text)) {
    score = Math.min(10, score + 3);
  } else if (/冷笑|冷哼|嗤笑|逼|查|试探|为何|难道|凭什么|住口/.test(text)) {
    score = Math.min(10, score + 1);
  }

  if (score <= 2) {
    return { level: score, label: '试水寒暄', colorClass: 'text-stone-600 bg-stone-500/10 border-stone-500/20' };
  } else if (score <= 4) {
    return { level: score, label: '暗流涌动', colorClass: 'text-blue-600 bg-blue-500/10 border-blue-500/20' };
  } else if (score <= 6) {
    return { level: score, label: '步步紧逼', colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
  } else if (score <= 8) {
    return { level: score, label: '剑拔弩张', colorClass: 'text-orange-600 bg-orange-500/10 border-orange-500/20' };
  } else {
    return { level: score, label: '刺刀见红', colorClass: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  }
}

interface CharacterSandboxPanelProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const CharacterSandboxPanel: React.FC<CharacterSandboxPanelProps> = ({
  onClose,
  isModal = false,
}) => {
  const { activeNovel, activeChapter, updateEditorContent, saveCurrentChapter } = useNovelStore(
    useShallow((s) => ({
      activeNovel: s.activeNovel,
      activeChapter: s.activeChapter,
      updateEditorContent: s.updateEditorContent,
      saveCurrentChapter: s.saveCurrentChapter,
    }))
  );
  const { addToast } = useToastStore();
  const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') =>
    addToast({ title, type });

  // 基础数据
  const [characters, setCharacters] = useState<Character[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [modelsMap, setModelsMap] = useState<Record<string, AiModel[]>>({});

  // 会话与推演状态
  const [sessions, setSessions] = useState<CharacterSandboxSession[]>([]);
  const [activeSession, setActiveSession] = useState<CharacterSandboxSession | null>(null);
  const [sessionTitle, setSessionTitle] = useState('密室对峙与解药试探');
  const [sceneSetting, setSceneSetting] = useState('昏暗的内室，窗外雷雨交加，桌上一盏油灯微光摇曳，茶已冰凉。');
  const [sceneGoal, setSceneGoal] = useState('双方互相试探对方是否知晓当年真相，绝不率先亮出底牌，在6轮内决裂或达成口头同盟。');
  const [actors, setActors] = useState<CharacterActorConfig[]>([]);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueRoundRecord[]>([]);

  // 🌿 树状分支推演状态 (What-If Branches)
  const [branches, setBranches] = useState<SandboxBranch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>('main');
  const [mainHistoryBackup, setMainHistoryBackup] = useState<DialogueRoundRecord[]>([]);
  const [mainHistoryCount, setMainHistoryCount] = useState<number>(0);
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkFromIndex, setForkFromIndex] = useState<number>(0);
  const [forkBranchName, setForkBranchName] = useState('');

  // 💬 潜台词透视状态
  const [showSubtext, setShowSubtext] = useState(true);

  // 运行控制与暂停/中断机制
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [isStepping, setIsStepping] = useState(false);
  const isSteppingRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const currentStepSessionIdRef = useRef<string | null>(null);
  const currentStepHistoryBeforeRef = useRef<DialogueRoundRecord[]>([]);
  const [autoRunRoundsRemaining, setAutoRunRoundsRemaining] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedProse, setSynthesizedProse] = useState('');
  // 🎭 剧本与角色阵容设定抽屉及分界面状态 (Drawer & Sub-interfaces)
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [configDrawerTab, setConfigDrawerTab] = useState<'actors' | 'scene' | 'presets'>('actors');
  const [isConfigDrawerPinned, setIsConfigDrawerPinned] = useState(false);
  const [showSynthesizedModal, setShowSynthesizedModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);
  const [showInterveneMenu, setShowInterveneMenu] = useState(false);
  const [isImportingDemo, setIsImportingDemo] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showImportBibleModal, setShowImportBibleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 💡 灵感火花盒与金句提炼状态
  const [inspirationNotes, setInspirationNotes] = useState<InspirationNote[]>([]);
  const [showInspirationDrawer, setShowInspirationDrawer] = useState(false);
  const [isDistillingInspirations, setIsDistillingInspirations] = useState(false);
  const [inspirationFilter, setInspirationFilter] = useState<'ALL' | 'QUOTE' | 'ACTION' | 'PSYCHOLOGY' | 'TWIST'>('ALL');

  // 🎯 角色行动与抉择探针状态 (What Would They Do?)
  const [showActionProbeModal, setShowActionProbeModal] = useState(false);
  const [isProbingActions, setIsProbingActions] = useState(false);
  const [actionOptions, setActionOptions] = useState<CharacterActionOption[]>([]);
  const [probeSpeakerId, setProbeSpeakerId] = useState('');
  const [probeSpeakerName, setProbeSpeakerName] = useState('');
  const [customActionGuidance, setCustomActionGuidance] = useState('');

  // ✍️ 高光文段精修打磨状态 (Highlight Prose Polishing Studio)
  const [polishingStyle, setPolishingStyle] = useState<
    'CINEMATIC' | 'PSYCHOLOGICAL' | 'HARDCORE_TENSE' | 'CLASSICAL_ELEGANT' | 'DARK_HUMOR_IRONY'
  >('CINEMATIC');
  const [polishingRange, setPolishingRange] = useState<'FOCUSED_ROUND' | 'RECENT_3' | 'ALL'>('ALL');
  const [polishingPov, setPolishingPov] = useState<'THIRD_LIMITED' | 'THIRD_OMNISCIENT' | 'FIRST_PERSON'>('THIRD_LIMITED');
  const [polishingAnchorIndex, setPolishingAnchorIndex] = useState<number | null>(null);
  const [customPolishingGuidance, setCustomPolishingGuidance] = useState('');
  const [polishingStudioView, setPolishingStudioView] = useState<'READ' | 'COMPARE' | 'DIFF' | 'EDIT'>('READ');
  
  // 多版本打磨历史 (留存快照，方便创作者横向比对挑选好句子)
  const [polishedVariations, setPolishedVariations] = useState<
    Array<{
      id: string;
      style: string;
      pov: string;
      range: string;
      text: string;
      wordCount: number;
      timestamp: number;
    }>
  >([]);
  const [activeVariationId, setActiveVariationId] = useState<string>('');
  const [diffLeftVariationId, setDiffLeftVariationId] = useState<string>('');
  const [diffRightVariationId, setDiffRightVariationId] = useState<string>('');
  const [copiedParaIdx, setCopiedParaIdx] = useState<number | null>(null);

  // 划选文字悬浮灵感捕获
  const [selectedProseSnippet, setSelectedProseSnippet] = useState('');

  // 👗 角色立绘贴图与 AI 视觉理解弹窗状态
  const [showActorVisualModal, setShowActorVisualModal] = useState(false);
  const [selectedActorIndex, setSelectedActorIndex] = useState<number | null>(null);
  const [modalAvatarUrl, setModalAvatarUrl] = useState('');
  const [modalVisualSummary, setModalVisualSummary] = useState('');
  const [modalGender, setModalGender] = useState('男');
  const [isAnalyzingActorVisual, setIsAnalyzingActorVisual] = useState(false);
  const [modalAppearanceTags, setModalAppearanceTags] = useState<string[]>([]);
  const [syncToNovelDb, setSyncToNovelDb] = useState(true);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [showAvatarGenModal, setShowAvatarGenModal] = useState(false);
  const actorFileInputRef = useRef<HTMLInputElement>(null);

  // P2P 互联网协同状态
  const {
    status: collabStatus,
    roomCode: collabRoomCode,
    remoteSandboxRound,
    remoteSandboxSyncPayload,
    sendSandboxRound,
    sendSandboxSync,
  } = useCollaborationStore();

  // 监听远端协作者通过 P2P 提交的新台词
  useEffect(() => {
    if (!remoteSandboxRound) return;
    setDialogueHistory((prev) => {
      if (prev.some((r) => r.round_index === remoteSandboxRound.round_index && r.timestamp === remoteSandboxRound.timestamp)) {
        return prev;
      }
      const nextHistory = [...prev, remoteSandboxRound];
      if (activeSession) {
        api.updateSandboxSession({
          id: activeSession.id,
          dialogue_history: nextHistory,
        });
      }
      return nextHistory;
    });
    showToast(`【协作者 · ${remoteSandboxRound.speaker_name}】通过 P2P 提交了新对白！`, 'info');
  }, [remoteSandboxRound]);

  // 监听来自房主的沙盒全量同步包
  useEffect(() => {
    if (!remoteSandboxSyncPayload) return;
    setSessionTitle(remoteSandboxSyncPayload.session_title);
    setSceneSetting(remoteSandboxSyncPayload.scene_setting);
    setSceneGoal(remoteSandboxSyncPayload.scene_goal);
    setActors(remoteSandboxSyncPayload.actors);
    setDialogueHistory(remoteSandboxSyncPayload.dialogue_history);
    if (remoteSandboxSyncPayload.branches) {
      setBranches(remoteSandboxSyncPayload.branches);
    }
    if (remoteSandboxSyncPayload.active_branch_id) {
      setActiveBranchId(remoteSandboxSyncPayload.active_branch_id);
    }
    showToast('已同步来自房主的演武场舞台、分支走向与角色阵容！', 'success');
  }, [remoteSandboxSyncPayload]);

  // 作者亲演输入态
  const [humanSpeech, setHumanSpeech] = useState('');
  const [humanAction, setHumanAction] = useState('');
  const [humanThought, setHumanThought] = useState('');

  // 辅助编辑与旁白插入
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null);
  const [editAction, setEditAction] = useState('');
  const [editSpeech, setEditSpeech] = useState('');
  const [narratorInput, setNarratorInput] = useState('');
  const [showNarratorInput, setShowNarratorInput] = useState(false);
  const [showPrivateThoughts, setShowPrivateThoughts] = useState(true);

  // 智能滚动保护与未读提示
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadRoundsCount, setUnreadRoundsCount] = useState(0);

  // 卸载保护：防止后台异步循环在组件销毁后继续跑，并清理定时器
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      if (saveActorsTimerRef.current !== null) clearTimeout(saveActorsTimerRef.current);
    };
  }, []);

  // 1. 初始化加载角色、模型与历史会话
  useEffect(() => {
    if (!activeNovel) return;
    const loadData = async () => {
      try {
        const [chars, provs, sessList] = await Promise.all([
          api.listCharacters(activeNovel.id),
          api.listProviders(),
          api.listSandboxSessions(activeNovel.id),
        ]);
        setCharacters(chars);
        setProviders(provs);
        setSessions(sessList);

        const mMap: Record<string, AiModel[]> = {};
        for (const p of provs) {
          try {
            mMap[p.id] = await api.listModels(p.id);
          } catch {
            mMap[p.id] = [];
          }
        }
        setModelsMap(mMap);

        if (sessList && sessList.length > 0) {
          loadSession(sessList[0]);
        } else if (chars && chars.length >= 2) {
          initDefaultActors(chars);
        } else if (chars && chars.length === 1) {
          initSingleActorWithMock(chars[0]);
        }
      } catch (err: any) {
        console.error('加载演武场数据失败:', err);
      }
    };
    loadData();
  }, [activeNovel?.id]);

  // 智能滚动处理：使用 requestAnimationFrame 防抖节流，且仅在视角布尔状态翻转时触发重绘
  const scrollRafRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setIsScrolledUp((prev) => (prev !== !isNearBottom ? !isNearBottom : prev));
      if (isNearBottom) {
        setUnreadRoundsCount(0);
      }
    });
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setUnreadRoundsCount(0);
      setIsScrolledUp(false);
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
      setUnreadRoundsCount(0);
    } else {
      setUnreadRoundsCount((prev) => prev + 1);
    }
  }, [dialogueHistory.length]);

  // 角色缓存 Map：将角色信息与性别查找优化为 O(1)
  const charactersMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.id, c);
    return map;
  }, [characters]);

  // 高光打磨台对比视角的原对戏切片
  const comparedRounds = useMemo(() => {
    if (dialogueHistory.length === 0) return [];
    const anchor = polishingAnchorIndex;
    if (polishingRange === 'FOCUSED_ROUND' && anchor !== null) {
      const s = Math.max(0, anchor - 1);
      const e = Math.min(dialogueHistory.length - 1, anchor + 1);
      return dialogueHistory.slice(s, e + 1);
    }
    if (polishingRange === 'RECENT_3') {
      return dialogueHistory.slice(Math.max(0, dialogueHistory.length - 3));
    }
    return dialogueHistory;
  }, [dialogueHistory, polishingAnchorIndex, polishingRange]);

  // 可选新增角色列表 Memo：避免每次渲染重复执行 filter
  const availableCharacters = useMemo(() => {
    const actorIds = new Set(actors.map((a) => a.character_id));
    return characters.filter((c) => !actorIds.has(c.id));
  }, [characters, actors]);

  // 计算当前下一位发言人与是否为人身亲演
  const nonNarratorRounds = dialogueHistory.filter((r) => !r.is_narrator_event);
  const nextActorIndex = actors.length > 0 ? nonNarratorRounds.length % actors.length : 0;
  const nextSpeaker = actors[nextActorIndex] || null;
  const isHumanTurn = nextSpeaker?.is_human === true;

  // 统一暂停/中断推演 (支持 Esc 快捷键、气泡卡片按钮与底部主控制键)
  const handleStopDeduction = useCallback(async () => {
    if (!isRunningRef.current && !isSteppingRef.current) return;

    cancelRequestedRef.current = true;
    const wasRunning = isRunningRef.current;
    isRunningRef.current = false;
    setIsRunning(false);
    setAutoRunRoundsRemaining(0);

    // 如果当前正处于单步模型调用等待中，且已记录了推演前快照，立即执行原子回滚保全现场
    if (isSteppingRef.current && currentStepSessionIdRef.current) {
      const snap = currentStepHistoryBeforeRef.current;
      try {
        await api.updateSandboxSession({
          id: currentStepSessionIdRef.current,
          dialogue_history: snap,
          status: 'PAUSED',
        });
        setDialogueHistory(snap);
      } catch (err) {
        console.error('原子回滚推演历史失败:', err);
      }
      showToast('已立即暂停推演，已保全当前对戏现场', 'info');
    } else if (wasRunning) {
      showToast('已暂停连续推演', 'info');
    }
  }, [showToast]);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (showNarratorInput && narratorInput.trim()) {
          handleInsertNarrator();
        } else if (isHumanTurn && humanSpeech.trim()) {
          handleHumanSubmit();
        } else if (!isRunning && !isStepping && actors.length > 0) {
          executeStep();
        }
        return;
      }

      if (e.key === 'Escape') {
        // ★ 核心修复：当推演正在进行中（无论是连续推演还是单步推演），优先响应暂停/中断指令！
        if (isRunningRef.current || isSteppingRef.current) {
          e.preventDefault();
          e.stopPropagation();
          handleStopDeduction();
          return;
        }

        if (editingRoundIndex !== null) {
          setEditingRoundIndex(null);
        } else if (showNarratorInput) {
          setShowNarratorInput(false);
        } else if (showSessionDropdown) {
          setShowSessionDropdown(false);
        } else if (showExportMenu) {
          setShowExportMenu(false);
        } else if (showSpeakerPicker) {
          setShowSpeakerPicker(false);
        } else if (showInterveneMenu) {
          setShowInterveneMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showNarratorInput,
    narratorInput,
    isRunning,
    isStepping,
    actors.length,
    editingRoundIndex,
    showSessionDropdown,
    showExportMenu,
    showSpeakerPicker,
    showInterveneMenu,
    isHumanTurn,
    humanSpeech,
    nextSpeaker,
    handleStopDeduction,
  ]);

  const initDefaultActors = (chars: Character[]) => {
    const actorA: CharacterActorConfig = {
      character_id: chars[0].id,
      character_name: chars[0].name,
      private_motivation: '试探对方是否查明解药去向，绝不能让他发现我已受内伤。',
      private_secret: '解药就在我袖中夹层里，但我功力暂时无法运转。',
      voice_quirks: '语气平淡沉稳，语速缓慢，惜字如金',
      order_index: 0,
      is_human: false,
    };
    const actorB: CharacterActorConfig = {
      character_id: chars[1].id,
      character_name: chars[1].name,
      private_motivation: '逼迫对方交出解药，言语施压逼其露出破绽。',
      private_secret: '门外其实根本没有援兵，我是孤身前来虚张声势。',
      voice_quirks: '言辞锋芒毕露，步步紧逼，带着冷笑与讥讽',
      order_index: 1,
      is_human: false,
    };
    setActors([actorA, actorB]);
  };

  const initSingleActorWithMock = (char: Character) => {
    const actorA: CharacterActorConfig = {
      character_id: char.id,
      character_name: char.name,
      private_motivation: '探查虚实，伺机反扑。',
      private_secret: '怀揣密信。',
      voice_quirks: '沉稳戒备',
      order_index: 0,
      is_human: false,
    };
    setActors([actorA]);
  };

  const loadSession = (sess: CharacterSandboxSession) => {
    setActiveSession(sess);
    setSessionTitle(sess.title);
    setSceneSetting(sess.scene_setting);
    setSceneGoal(sess.scene_goal);
    try {
      const parsedActors = JSON.parse(sess.characters_config_json || '[]');
      const parsedHistory: DialogueRoundRecord[] = JSON.parse(sess.dialogue_history_json || '[]');
      const parsedBranches: SandboxBranch[] = sess.branches_json ? JSON.parse(sess.branches_json) : [];
      const parsedInspirations: InspirationNote[] = sess.inspiration_notes_json ? JSON.parse(sess.inspiration_notes_json) : [];
      setActors(parsedActors);
      setDialogueHistory(parsedHistory);
      setSynthesizedProse(sess.synthesized_prose || '');
      setBranches(parsedBranches);
      setInspirationNotes(parsedInspirations);

      const branchId = sess.active_branch_id || 'main';
      setActiveBranchId(branchId);
      if (branchId === 'main') {
        setMainHistoryBackup(parsedHistory);
        setMainHistoryCount(parsedHistory.length);
      } else {
        setMainHistoryCount(parsedHistory.length);
      }
    } catch {
      setActors([]);
      setDialogueHistory([]);
      setBranches([]);
      setActiveBranchId('main');
    }
  };

  // 一键导入高戏剧冲突示范角色 (林渊 vs 洛清雪)
  const handleImportDemoCharacters = async () => {
    if (!activeNovel) return;
    setIsImportingDemo(true);
    try {
      const char1 = await api.createCharacter({
        novel_id: activeNovel.id,
        name: '林渊',
        aliases: '无名刀客',
        personality: '沉敛寡言，城府极深，喜怒不形于色',
        profile: '潜伏名门正派三年的神秘剑客，身负灭门血仇，暗中查访当年断魂崖真相。',
        motivation: '查清当年断魂崖血案元凶，同时掩饰自身魔功气息。',
      });
      const char2 = await api.createCharacter({
        novel_id: activeNovel.id,
        name: '洛清雪',
        aliases: '清雪仙子',
        personality: '清冷绝尘，敏锐如鹰，言辞机锋逼人',
        profile: '宗门刑律殿首席掌印使，负责彻查宗门暗桩，行事雷厉风行，不徇私情。',
        motivation: '试探林渊真实功法破绽，逼迫其露出马脚。',
      });

      const updatedChars = await api.listCharacters(activeNovel.id);
      setCharacters(updatedChars);

      const actorA: CharacterActorConfig = {
        character_id: char1.id,
        character_name: char1.name,
        private_motivation: '试探洛清雪是否掌握确凿铁证，死守防线，绝不能让她发现我暗练魔功。',
        private_secret: '密阁的真正账簿就在我袖中夹层里，但我经脉暂时无法运转。',
        voice_quirks: '语气平淡沉稳，语速缓慢，惜字如金',
        order_index: 0,
        is_human: false,
      };
      const actorB: CharacterActorConfig = {
        character_id: char2.id,
        character_name: char2.name,
        private_motivation: '言辞施压，步步紧逼，诈出林渊昨夜子时的去向。',
        private_secret: '我其实根本没有搜查令，门外也无援兵，全凭虚张声势。',
        voice_quirks: '言辞如霜如刃，步步紧逼，带着冷笑与讥讽',
        order_index: 1,
        is_human: false,
      };
      setActors([actorA, actorB]);
      showToast('已成功导入示范角色【林渊 vs 洛清雪】并装配完毕！', 'success');
    } catch (err: any) {
      showToast(`导入示范角色失败: ${err.message || err}`, 'error');
    } finally {
      setIsImportingDemo(false);
    }
  };

  // 应用经典对戏模板
  const applyPresetTemplate = (preset: SandboxPresetTemplate) => {
    setSessionTitle(preset.title);
    setSceneSetting(preset.scene_setting);
    setSceneGoal(preset.scene_goal);

    if (actors.length >= 2) {
      const copy = [...actors];
      copy[0] = { ...copy[0], private_motivation: preset.motivation_a, private_secret: preset.secret_a };
      copy[1] = { ...copy[1], private_motivation: preset.motivation_b, private_secret: preset.secret_b };
      setActors(copy);
    } else if (actors.length === 1) {
      const copy = [...actors];
      copy[0] = { ...copy[0], private_motivation: preset.motivation_a, private_secret: preset.secret_a };
      setActors(copy);
    }
    showToast(`已套用情境模板：${preset.name}`, 'success');
  };

  // 互换攻守位置
  const handleSwapActors = () => {
    if (actors.length < 2) return;
    const copy = [...actors];
    const temp = copy[0];
    copy[0] = { ...copy[1], order_index: 0 };
    copy[1] = { ...temp, order_index: 1 };
    setActors(copy);
    showToast('已互换双方的攻守与先手发难顺序！', 'info');
  };

  // 新建对戏沙盒
  const handleCreateNewSession = async () => {
    if (!activeNovel) return;
    try {
      const timeTag = new Date().toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const created = await api.createSandboxSession({
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        title: `新对戏演武 · ${timeTag}`,
        scene_setting: '昏暗的内室，窗外雷雨交加，桌上一盏油灯微光摇曳，茶已冰凉。',
        scene_goal: '双方互相试探对方是否知晓当年真相，绝不率先亮出底牌，在6轮内决裂或达成口头同盟。',
        characters_config: actors.length >= 2 ? actors : (characters.length >= 2 ? [
          {
            character_id: characters[0].id,
            character_name: characters[0].name,
            private_motivation: '试探对方底细，严守秘密。',
            private_secret: '怀揣绝密卷轴。',
            voice_quirks: '语气平淡沉稳',
            order_index: 0,
            is_human: false,
          },
          {
            character_id: characters[1].id,
            character_name: characters[1].name,
            private_motivation: '施压逼迫对方交出卷轴。',
            private_secret: '其实我并无确凿证据。',
            voice_quirks: '言辞锋芒毕露',
            order_index: 1,
            is_human: false,
          },
        ] : []),
      });
      setSessions([created, ...sessions]);
      loadSession(created);
      setShowSessionDropdown(false);
      showToast('已创建新对戏演武会话！', 'success');
    } catch (err: any) {
      showToast(`创建新会话失败: ${err.message || err}`, 'error');
    }
  };

  // 删除对戏沙盒
  const handleDeleteSession = async (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirmDialog({
      title: '删除对戏沙盒',
      message: '确定删除该场对戏记录吗？此操作不可逆。',
      tone: 'danger',
      confirmText: '确定删除',
      cancelText: '取消',
    });
    if (!confirmed) return;
    try {
      await api.deleteSandboxSession(sessId);
      const remaining = sessions.filter((s) => s.id !== sessId);
      setSessions(remaining);
      if (activeSession?.id === sessId) {
        if (remaining.length > 0) {
          loadSession(remaining[0]);
        } else {
          setActiveSession(null);
          setDialogueHistory([]);
          setSynthesizedProse('');
        }
      }
      showToast('已删除对戏记录', 'success');
    } catch (err: any) {
      showToast(`删除失败: ${err.message || err}`, 'error');
    }
  };

  // 保存当前会话
  const handleSaveSession = async () => {
    if (!activeNovel) return;
    try {
      if (activeSession) {
        const updated = await api.updateSandboxSession({
          id: activeSession.id,
          title: sessionTitle,
          scene_setting: sceneSetting,
          scene_goal: sceneGoal,
          characters_config: actors,
          dialogue_history: dialogueHistory,
          synthesized_prose: synthesizedProse,
          branches_json: JSON.stringify(branches),
          active_branch_id: activeBranchId,
          inspiration_notes_json: JSON.stringify(inspirationNotes),
        });
        setActiveSession(updated);
        setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
        showToast('沙盒对戏会话已保存', 'success');
      } else {
        const created = await api.createSandboxSession({
          novel_id: activeNovel.id,
          chapter_id: activeChapter?.id,
          title: sessionTitle,
          scene_setting: sceneSetting,
          scene_goal: sceneGoal,
          characters_config: actors,
          branches_json: JSON.stringify(branches),
          active_branch_id: activeBranchId,
          inspiration_notes_json: JSON.stringify(inspirationNotes),
        });
        setActiveSession(created);
        setSessions([created, ...sessions]);
        showToast('新对戏沙盒已创建', 'success');
      }
    } catch (err: any) {
      showToast(`保存失败: ${err.message || err}`, 'error');
    }
  };

  // 添加角色卡片
  const handleAddActor = (charId: string) => {
    const targetChar = characters.find((c) => c.id === charId);
    if (!targetChar) return;
    if (actors.some((a) => a.character_id === charId)) {
      showToast('该角色已经在演武场中', 'info');
      return;
    }
    const newActor: CharacterActorConfig = {
      character_id: targetChar.id,
      character_name: targetChar.name,
      private_motivation: '静观其变，伺机而动。',
      private_secret: '隐藏在暗处的后手尚未发动。',
      voice_quirks: '神态从容，言辞内敛',
      order_index: actors.length,
      is_human: false,
    };
    setActors([...actors, newActor]);
  };

  // 移除角色
  const handleRemoveActor = (index: number) => {
    const updated = actors.filter((_, i) => i !== index);
    setActors(updated);
    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        characters_config: updated,
      }).catch(console.error);
    }
  };

  // 重新加载所有服务商与模型
  const handleCloseSettingsModal = async () => {
    setShowSettingsModal(false);
    try {
      const provs = await api.listProviders();
      setProviders(provs);
      const mMap: Record<string, AiModel[]> = {};
      for (const p of provs) {
        try {
          mMap[p.id] = await api.listModels(p.id);
        } catch {}
      }
      setModelsMap(mMap);
    } catch (e) {
      console.error('刷新服务商失败:', e);
    }
  };

  // 极速多模型攻防分工
  const handleQuickMultiApiAssign = () => {
    if (providers.length < 2) {
      showToast('当前仅配置了 1 个服务商，可点击顶栏【🔌 API/模型管理】快速添加 DeepSeek / Claude / OpenAI！', 'info');
      setShowSettingsModal(true);
      return;
    }
    const copy = [...actors];
    if (copy.length >= 2) {
      copy[0] = {
        ...copy[0],
        provider_id: providers[0].id,
        model_name: modelsMap[providers[0].id]?.[0]?.model_name || undefined,
      };
      copy[1] = {
        ...copy[1],
        provider_id: providers[1].id,
        model_name: modelsMap[providers[1].id]?.[0]?.model_name || undefined,
      };
      setActors(copy);
      if (activeSession) {
        api.updateSandboxSession({
          id: activeSession.id,
          characters_config: copy,
        }).catch(console.error);
      }
      showToast(
        `已成功分配跨模型攻防：${copy[0].character_name} -> [${providers[0].name}]，${copy[1].character_name} -> [${providers[1].name}]！`,
        'success'
      );
    }
  };

  // 导入书本与设定回调
  const handleImportContext = async (data: {
    novelId?: string;
    sceneSetting?: string;
    sceneGoal?: string;
    actorUpdates?: Array<{
      character_id: string;
      private_motivation?: string;
      private_secret?: string;
    }>;
  }) => {
    let nextSetting = sceneSetting;
    let nextGoal = sceneGoal;

    if (data.sceneSetting) {
      nextSetting = data.sceneSetting;
      setSceneSetting(nextSetting);
    }
    if (data.sceneGoal) {
      nextGoal = data.sceneGoal;
      setSceneGoal(nextGoal);
    }

    let nextActors = [...actors];
    if (data.actorUpdates && data.actorUpdates.length > 0) {
      for (const update of data.actorUpdates) {
        const idx = nextActors.findIndex((a) => a.character_id === update.character_id);
        if (idx !== -1) {
          nextActors[idx] = {
            ...nextActors[idx],
            private_motivation: update.private_motivation || nextActors[idx].private_motivation,
            private_secret: update.private_secret || nextActors[idx].private_secret,
          };
        }
      }
      setActors(nextActors);
    }

    if (activeSession) {
      await api.updateSandboxSession({
        id: activeSession.id,
        scene_setting: nextSetting,
        scene_goal: nextGoal,
        characters_config: nextActors,
      });
    }

    showToast('已成功将原著正文、大纲与世界观法则装配至演武场！', 'success');
  };

  // 角色存盘防抖计时器
  const saveActorsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 更新角色字段（附带防抖自动同步至数据库，杜绝密集打字与下拉切换引发 IPC 阻塞）
  const updateActorField = (index: number, field: keyof CharacterActorConfig, val: any) => {
    const copy = [...actors];
    copy[index] = { ...copy[index], [field]: val };
    setActors(copy);

    if (activeSession) {
      if (saveActorsTimerRef.current !== null) clearTimeout(saveActorsTimerRef.current);
      saveActorsTimerRef.current = setTimeout(() => {
        saveActorsTimerRef.current = null;
        api.updateSandboxSession({
          id: activeSession.id,
          characters_config: copy,
        }).catch(console.error);
      }, 500);
    }
  };

  // 单步推演 (Step) - 支持中断/暂停与原子快照保全
  const executeStep = async (
    narratorText?: string,
    targetSpeakerId?: string,
    actionGuidance?: string
  ): Promise<boolean> => {
    if (!activeNovel) return false;
    if (actors.length === 0) {
      showToast('请至少配置一名出场角色', 'warning');
      return false;
    }
    // 防止并发重复步进
    if (isSteppingRef.current) {
      return false;
    }

    let sessionId = activeSession?.id;
    if (!sessionId) {
      const created = await api.createSandboxSession({
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        title: sessionTitle,
        scene_setting: sceneSetting,
        scene_goal: sceneGoal,
        characters_config: actors,
      });
      setActiveSession(created);
      sessionId = created.id;
      setSessions([created, ...sessions]);
    } else {
      // ！！！CRITICAL: Flush current actor config, scene setting, and goal to DB before stepping!
      await api.updateSandboxSession({
        id: sessionId,
        scene_setting: sceneSetting,
        scene_goal: sceneGoal,
        characters_config: actors,
      });
    }

    // 记录推演前对话历史快照，用于用户中途暂停时保全现场与原子回滚
    const historyBefore = [...dialogueHistory];
    currentStepHistoryBeforeRef.current = historyBefore;
    currentStepSessionIdRef.current = sessionId;
    cancelRequestedRef.current = false;
    isSteppingRef.current = true;
    setIsStepping(true);

    try {
      const res = await api.executeSandboxStep({
        session_id: sessionId,
        narrator_intervention: narratorText,
        target_speaker_id: targetSpeakerId,
        action_guidance: actionGuidance,
      });

      // 检查在等待模型返回期间，用户是否按下了暂停/Esc！
      if (cancelRequestedRef.current) {
        // 用户在模型推理期间发出了暂停指令：将沙盒会话原子回滚至推演前状态
        try {
          await api.updateSandboxSession({
            id: sessionId,
            dialogue_history: historyBefore,
            status: 'PAUSED',
          });
          setDialogueHistory(historyBefore);
        } catch (rollbackErr) {
          console.error('回滚推演历史失败:', rollbackErr);
        }
        showToast('推演已成功暂停，已保全当前对戏现场', 'info');
        return false;
      }

      const fresh = await api.getSandboxSession(sessionId);
      if (fresh) {
        loadSession(fresh);
      }
      if (res.round && collabStatus === 'CONNECTED') {
        sendSandboxRound(res.round);
      }
      return !res.is_completed;
    } catch (err: any) {
      if (cancelRequestedRef.current) {
        showToast('推演已按需暂停', 'info');
      } else {
        showToast(`推演中断: ${err.message || err}`, 'error');
      }
      return false;
    } finally {
      isSteppingRef.current = false;
      setIsStepping(false);
      cancelRequestedRef.current = false;
    }
  };

  // 作者亲演提交
  const handleHumanSubmit = async () => {
    if (!humanSpeech.trim() || !nextSpeaker || !activeNovel) return;
    let sessionId = activeSession?.id;
    if (!sessionId) {
      const created = await api.createSandboxSession({
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        title: sessionTitle,
        scene_setting: sceneSetting,
        scene_goal: sceneGoal,
        characters_config: actors,
      });
      setActiveSession(created);
      sessionId = created.id;
      setSessions([created, ...sessions]);
    }

    const newRound: DialogueRoundRecord = {
      round_index: dialogueHistory.length + 1,
      speaker_id: nextSpeaker.character_id,
      speaker_name: nextSpeaker.character_name,
      inner_thought: humanThought.trim() || `【亲演心机】${nextSpeaker.private_motivation}`,
      character_action: humanAction.trim(),
      speech: humanSpeech.trim(),
      is_narrator_event: false,
      is_edited_by_user: true,
      timestamp: Date.now(),
    };
    const updatedHistory = [...dialogueHistory, newRound];
    setDialogueHistory(updatedHistory);
    setHumanSpeech('');
    setHumanAction('');
    setHumanThought('');

    if (sessionId) {
      try {
        await api.updateSandboxSession({
          id: sessionId,
          dialogue_history: updatedHistory,
        });
      } catch (err) {
        console.error('更新会话历史失败:', err);
      }
    }

    if (collabStatus === 'CONNECTED') {
      sendSandboxRound(newRound);
    }

    // 接下来轮到的若是 AI 角色，自动触发一次对方的反击思考
    const nextNextIndex = (nonNarratorRounds.length + 1) % actors.length;
    const opponent = actors[nextNextIndex];
    if (opponent && !opponent.is_human) {
      showToast(`【${nextSpeaker.character_name}】台词已出手，等待【${opponent.character_name}】思考反击...`, 'info');
      await executeStep();
    } else {
      showToast(`【${nextSpeaker.character_name}】台词已出手！`, 'success');
    }
  };

  // 连续自动推演 (支持 Esc 快捷键与实时一键暂停)
  const handleStartAuto = async () => {
    if (isRunningRef.current || isSteppingRef.current) {
      await handleStopDeduction();
      return;
    }
    cancelRequestedRef.current = false;
    isRunningRef.current = true;
    setIsRunning(true);
    let rounds = 6;
    setAutoRunRoundsRemaining(rounds);

    while (rounds > 0 && isRunningRef.current) {
      const canContinue = await executeStep();
      if (!isRunningRef.current || cancelRequestedRef.current) break;
      rounds--;
      setAutoRunRoundsRemaining(rounds);
      if (!canContinue || rounds <= 0) break;

      // 细粒度可中断等待，避免 600ms 期间点击暂停不灵敏
      for (let i = 0; i < 12; i++) {
        if (!isRunningRef.current || cancelRequestedRef.current) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    const wasStopped = !isRunningRef.current || cancelRequestedRef.current;
    isRunningRef.current = false;
    setIsRunning(false);
    setAutoRunRoundsRemaining(0);
    if (!wasStopped) {
      showToast('对手戏推演完成！', 'success');
    }
  };

  // 重掷最新一轮台词 (Re-roll)
  const handleRerollLatestRound = async () => {
    if (dialogueHistory.length === 0 || isRunning || isStepping) return;
    const lastRound = dialogueHistory[dialogueHistory.length - 1];
    if (lastRound.is_narrator_event) {
      showToast('旁白突发事件不支持重掷，可点击编辑或清空', 'info');
      return;
    }
    const poppedHistory = dialogueHistory.slice(0, -1);
    setDialogueHistory(poppedHistory);

    if (activeSession) {
      try {
        await api.updateSandboxSession({
          id: activeSession.id,
          dialogue_history: poppedHistory,
        });
      } catch (err) {
        console.error('更新会话历史失败:', err);
      }
    }

    showToast(`正在重新生成【${lastRound.speaker_name}】的当轮台词与动作...`, 'info');
    await executeStep();
  };

  // 按人设纠偏强行重掷本轮 (Persona Correction Re-roll)
  const handleRerollWithCorrection = async (
    roundIndex: number,
    actor: CharacterActorConfig,
    warningText: string
  ) => {
    if (isRunning) return;
    const truncated = dialogueHistory.slice(0, roundIndex);
    setDialogueHistory(truncated);

    const correctionPrompt = generatePersonaCorrectionPrompt(actor, warningText);
    showToast(`正在按【${actor.character_name}】核心人设纠偏重掷第 ${roundIndex + 1} 轮...`, 'info');

    if (activeSession) {
      try {
        await api.updateSandboxSession({
          id: activeSession.id,
          dialogue_history: truncated,
        });

        await api.executeSandboxStep({
          session_id: activeSession.id,
          target_speaker_id: actor.character_id,
          narrator_intervention: correctionPrompt,
        });

        const fresh = await api.getSandboxSession(activeSession.id);
        if (fresh) {
          loadSession(fresh);
        }
        showToast(`【${actor.character_name}】已按人设要求纠偏重写完成！`, 'success');
      } catch (err: any) {
        showToast(`纠偏重掷失败: ${err.message || err}`, 'error');
      }
    }
  };

  // 打开开辟分支弹窗
  const handleOpenForkModal = (roundIndex: number) => {
    setForkFromIndex(roundIndex);
    const targetRound = dialogueHistory[roundIndex];
    const defaultName = targetRound
      ? `分支：${targetRound.speaker_name}换种选择 (第${roundIndex + 1}轮)`
      : `分支 ${branches.length + 1}`;
    setForkBranchName(defaultName);
    setShowForkModal(true);
  };

  // 确认开辟分支
  const handleConfirmFork = async () => {
    if (!activeSession) return;
    const branchHistory = dialogueHistory.slice(0, forkFromIndex + 1);
    const newBranchId = `branch-${Date.now()}`;
    const newBranchName = forkBranchName.trim() || `分支 ${branches.length + 1}`;

    if (activeBranchId === 'main') {
      setMainHistoryBackup(dialogueHistory);
      setMainHistoryCount(dialogueHistory.length);
    }

    const newBranch: SandboxBranch = {
      id: newBranchId,
      name: newBranchName,
      fork_round_index: forkFromIndex,
      history: branchHistory,
      created_at: Date.now(),
    };

    const nextBranches = [...branches, newBranch];
    setBranches(nextBranches);
    setActiveBranchId(newBranchId);
    setDialogueHistory(branchHistory);
    setShowForkModal(false);

    try {
      await api.updateSandboxSession({
        id: activeSession.id,
        branches_json: JSON.stringify(nextBranches),
        active_branch_id: newBranchId,
        dialogue_history: branchHistory,
      });
      showToast(`已开辟新推演走向【${newBranchName}】！`, 'success');
    } catch (err) {
      console.error('保存分支失败:', err);
    }
  };

  // 切换推演分支
  const handleSwitchBranch = async (targetBranchId: string) => {
    if (!activeSession || targetBranchId === activeBranchId) return;

    let nextBranches = [...branches];
    let targetHistory: DialogueRoundRecord[] = [];

    // 1. 保存当前分支
    if (activeBranchId === 'main') {
      setMainHistoryBackup(dialogueHistory);
      setMainHistoryCount(dialogueHistory.length);
    } else {
      nextBranches = nextBranches.map((b) =>
        b.id === activeBranchId ? { ...b, history: dialogueHistory } : b
      );
      setBranches(nextBranches);
    }

    // 2. 载入目标分支
    if (targetBranchId === 'main') {
      targetHistory = mainHistoryBackup.length > 0 ? mainHistoryBackup : dialogueHistory;
    } else {
      const target = nextBranches.find((b) => b.id === targetBranchId);
      if (target) {
        targetHistory = target.history;
      }
    }

    setActiveBranchId(targetBranchId);
    setDialogueHistory(targetHistory);

    try {
      await api.updateSandboxSession({
        id: activeSession.id,
        branches_json: JSON.stringify(nextBranches),
        active_branch_id: targetBranchId,
        dialogue_history: targetHistory,
      });
      const targetName =
        targetBranchId === 'main'
          ? '主时间线'
          : nextBranches.find((b) => b.id === targetBranchId)?.name || '分支';
      showToast(`已切换至【${targetName}】走向 (当前 ${targetHistory.length} 轮)`, 'info');
    } catch (err) {
      console.error('切换分支失败:', err);
    }
  };

  // 删除分支
  const handleDeleteBranch = async (branchId: string) => {
    if (branchId === 'main') return;
    const target = branches.find((b) => b.id === branchId);
    const confirmed = await confirmDialog({
      title: '删除推演分支',
      message: `确定要删除分支【${target?.name || branchId}】吗？此操作无法撤销。`,
      tone: 'danger',
      confirmText: '删除分支',
      cancelText: '取消',
    });
    if (!confirmed) return;

    const nextBranches = branches.filter((b) => b.id !== branchId);
    setBranches(nextBranches);

    if (activeBranchId === branchId) {
      handleSwitchBranch('main');
    } else if (activeSession) {
      try {
        await api.updateSandboxSession({
          id: activeSession.id,
          branches_json: JSON.stringify(nextBranches),
        });
      } catch (err) {
        console.error('更新分支失败:', err);
      }
    }
    showToast('已删除推演分支', 'info');
  };

  // 清空对话记录重新开场 (保留角色设定与场景)
  const handleResetDialogue = async () => {
    if (dialogueHistory.length === 0) return;
    const confirmed = await confirmDialog({
      title: '重置推演对戏记录',
      message: '确定重置当前推演记录吗？对白实录将清空，角色秘密与场景设定将予以保留。',
      tone: 'danger',
      confirmText: '确认重置',
      cancelText: '取消',
    });
    if (!confirmed) return;
    setDialogueHistory([]);
    setSynthesizedProse('');
    if (activeSession) {
      try {
        await api.updateSandboxSession({
          id: activeSession.id,
          dialogue_history: [],
          synthesized_prose: '',
        });
      } catch (err) {
        console.error('更新会话历史失败:', err);
      }
    }
    showToast('已重置推演实录，可重新开场！', 'success');
  };

  // 重置场景目标与角色临时动机 (恢复纯净沙盒)
  const handleResetSceneAndActors = async () => {
    const confirmed = await confirmDialog({
      title: '重置情境与出场设定',
      message: '确定重置场景设定与出场角色动机吗？此操作将清空当前场景描述、交锋目标以及角色的临时秘密与动机。',
      tone: 'danger',
      confirmText: '确认重置',
      cancelText: '取消',
    });
    if (!confirmed) return;
    setSceneSetting('');
    setSceneGoal('');
    setSessionTitle('新对戏沙盒');
    setActors((prev) =>
      prev.map((a) => ({
        ...a,
        private_motivation: '',
        private_secret: '',
      }))
    );
    showToast('已重置场景与角色设定', 'info');
  };

  // 原地编辑台词
  const handleSaveEditRound = (index: number) => {
    const updated = [...dialogueHistory];
    updated[index].character_action = editAction;
    updated[index].speech = editSpeech;
    updated[index].is_edited_by_user = true;
    setDialogueHistory(updated);
    setEditingRoundIndex(null);

    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        dialogue_history: updated,
      });
    }
    showToast('台词已就地精修，下一轮将基于此继续推演', 'success');
  };

  // 复制单轮台词
  const handleCopySingleRound = (round: DialogueRoundRecord) => {
    let text = '';
    if (round.is_narrator_event) {
      text = `【旁白】${round.character_action}`;
    } else {
      text = `${round.speaker_name}：` + (round.character_action ? `（${round.character_action}）` : '') + `“${round.speech}”`;
    }
    navigator.clipboard.writeText(text);
    showToast(`已复制 ${round.speaker_name} 的此句对白与神态`, 'success');
  };

  // 捕获灵感入盒 (支持台词金句/动作/心理)
  const handleCaptureInspiration = async (
    round: DialogueRoundRecord,
    type: 'QUOTE' | 'ACTION' | 'PSYCHOLOGY' = 'QUOTE'
  ) => {
    let content = '';
    if (type === 'QUOTE') {
      content = `“${round.speech}”`;
    } else if (type === 'ACTION') {
      content = round.character_action || '神色如常';
    } else {
      content = round.inner_thought || round.speech;
    }

    const newNote: InspirationNote = {
      id: `insp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      content,
      speaker_name: round.speaker_name,
      round_index: Number(round.round_index),
      created_at: Date.now(),
    };

    const nextNotes = [newNote, ...inspirationNotes];
    setInspirationNotes(nextNotes);
    showToast(`已捕获【${round.speaker_name}】的灵感火花入盒！`, 'success');

    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        inspiration_notes_json: JSON.stringify(nextNotes),
      }).catch(console.error);
    }
  };

  // 一键提炼全场灵感火花与金句
  const handleDistillInspirations = async () => {
    if (!activeSession) return;
    if (dialogueHistory.length === 0) {
      showToast('暂无对话记录，请先推演几轮对手戏后再提炼', 'warning');
      return;
    }
    setIsDistillingInspirations(true);
    try {
      const res = await api.distillSandboxInspirations({
        session_id: activeSession.id,
      });

      const gathered: InspirationNote[] = [];
      const now = Date.now();
      for (const q of res.golden_quotes) {
        gathered.push({
          id: `insp-q-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'QUOTE',
          content: q,
          created_at: now,
        });
      }
      for (const a of res.micro_actions) {
        gathered.push({
          id: `insp-a-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'ACTION',
          content: a,
          created_at: now,
        });
      }
      for (const p of res.psychological_insights) {
        gathered.push({
          id: `insp-p-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'PSYCHOLOGY',
          content: p,
          created_at: now,
        });
      }
      for (const t of res.plot_twists) {
        gathered.push({
          id: `insp-t-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'TWIST',
          content: t,
          created_at: now,
        });
      }

      const nextNotes = [...gathered, ...inspirationNotes];
      setInspirationNotes(nextNotes);
      setShowInspirationDrawer(true);
      showToast(`成功提炼出 ${gathered.length} 条灵感火花与金句！`, 'success');

      await api.updateSandboxSession({
        id: activeSession.id,
        inspiration_notes_json: JSON.stringify(nextNotes),
      });
    } catch (err: any) {
      showToast(`提炼灵感失败: ${err.message || err}`, 'error');
    } finally {
      setIsDistillingInspirations(false);
    }
  };

  // 删除单条灵感
  const handleDeleteInspiration = async (id: string) => {
    const nextNotes = inspirationNotes.filter((n) => n.id !== id);
    setInspirationNotes(nextNotes);
    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        inspiration_notes_json: JSON.stringify(nextNotes),
      }).catch(console.error);
    }
  };

  // 导出灵感便签
  const handleExportInspirations = () => {
    if (inspirationNotes.length === 0) return;
    const lines = [
      `# 《${sessionTitle}》演武场对戏灵感备忘录`,
      `生成时间：${new Date().toLocaleString()}`,
      `出场角色：${actors.map((a) => a.character_name).join(' vs ')}`,
      '',
      '---',
      '',
    ];
    for (const note of inspirationNotes) {
      const typeTag =
        note.type === 'QUOTE'
          ? '【🔥 金句台词】'
          : note.type === 'ACTION'
          ? '【🎭 微表情神态】'
          : note.type === 'PSYCHOLOGY'
          ? '【🧠 心理暗流】'
          : '【🗝️ 剧情反转脑洞】';
      lines.push(`### ${typeTag} ${note.speaker_name ? `· ${note.speaker_name}` : ''}`);
      lines.push(`${note.content}`);
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对戏灵感_${sessionTitle.replace(/[\\/:*?"<>|]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('灵感备忘录已导出为 Markdown 文件！', 'success');
  };

  // 🎯 探测角色此时会怎么做 (What Would They Do?)
  const handleProbeNextActions = async (targetSpeakerId?: string) => {
    if (!activeNovel) return;
    if (actors.length === 0) {
      showToast('请至少配置一名出场角色', 'warning');
      return;
    }
    let sessionId = activeSession?.id;
    if (!sessionId) {
      const created = await api.createSandboxSession({
        novel_id: activeNovel.id,
        chapter_id: activeChapter?.id,
        title: sessionTitle,
        scene_setting: sceneSetting,
        scene_goal: sceneGoal,
        characters_config: actors,
      });
      setActiveSession(created);
      sessionId = created.id;
      setSessions([created, ...sessions]);
    } else {
      await api.updateSandboxSession({
        id: sessionId,
        scene_setting: sceneSetting,
        scene_goal: sceneGoal,
        characters_config: actors,
      });
    }

    setIsProbingActions(true);
    setShowActionProbeModal(true);
    try {
      const res = await api.probeCharacterNextActions({
        session_id: sessionId,
        target_speaker_id: targetSpeakerId,
      });
      setActionOptions(res.options);
      setProbeSpeakerId(res.speaker_id);
      setProbeSpeakerName(res.speaker_name);
    } catch (err: any) {
      showToast(`探测行动方案失败: ${err.message || err}`, 'error');
    } finally {
      setIsProbingActions(false);
    }
  };

  // 采纳方案直接步进
  const handleApplyActionOption = async (option: CharacterActionOption) => {
    setShowActionProbeModal(false);
    const guidance = `${option.label}：${option.stance}。内心计划：${option.inner_motive}。微动作体现：${option.action_preview}。对白意图：${option.speech_preview}`;
    await executeStep(undefined, probeSpeakerId, guidance);
    showToast(`已采纳【${option.label}】行动路线并触发角色推演！`, 'success');
  };

  // 插入旁白/天意变故
  const handleInsertNarrator = async () => {
    if (!narratorInput.trim()) return;
    await executeStep(narratorInput.trim());
    setNarratorInput('');
    setShowNarratorInput(false);
  };

  // ✍️ 高光文段优化精修 (Highlight Prose Polishing Studio)
  const handleSynthesizeProse = async (
    overrideStyle?: 'CINEMATIC' | 'PSYCHOLOGICAL' | 'HARDCORE_TENSE' | 'CLASSICAL_ELEGANT' | 'DARK_HUMOR_IRONY',
    overrideRange?: 'FOCUSED_ROUND' | 'RECENT_3' | 'ALL',
    targetRoundIndex?: number,
    overridePov?: 'THIRD_LIMITED' | 'THIRD_OMNISCIENT' | 'FIRST_PERSON'
  ) => {
    if (!activeSession) return;
    if (dialogueHistory.length === 0) {
      showToast('暂无对话记录，请先步进推演几轮对手戏', 'warning');
      return;
    }

    const anchor = targetRoundIndex !== undefined ? targetRoundIndex : polishingAnchorIndex;
    if (targetRoundIndex !== undefined) {
      setPolishingAnchorIndex(targetRoundIndex);
    }

    const currentStyle = overrideStyle || polishingStyle;
    const currentRange = overrideRange || (anchor !== null ? 'FOCUSED_ROUND' : polishingRange);
    const currentPov = overridePov || polishingPov;

    if (overrideStyle) setPolishingStyle(overrideStyle);
    if (overrideRange) setPolishingRange(overrideRange);
    if (overridePov) setPolishingPov(overridePov);

    setIsSynthesizing(true);
    try {
      let startIdx = 0;
      let endIdx = dialogueHistory.length - 1;

      if (currentRange === 'FOCUSED_ROUND' && anchor !== null) {
        startIdx = Math.max(0, anchor - 1);
        endIdx = Math.min(dialogueHistory.length - 1, anchor + 1);
      } else if (currentRange === 'RECENT_3') {
        startIdx = Math.max(0, dialogueHistory.length - 3);
        endIdx = dialogueHistory.length - 1;
      } else {
        startIdx = 0;
        endIdx = dialogueHistory.length - 1;
      }

      const res = await api.synthesizeSandboxProse({
        session_id: activeSession.id,
        polishing_style: currentStyle,
        pov_mode: currentPov,
        start_round_index: startIdx,
        end_round_index: endIdx,
        custom_guidance: customPolishingGuidance.trim() || undefined,
      });

      const newVar = {
        id: `var-${Date.now()}`,
        style: currentStyle,
        pov: currentPov,
        range: currentRange,
        text: res.synthesized_prose,
        wordCount: res.word_count,
        timestamp: Date.now(),
      };

      setSynthesizedProse(res.synthesized_prose);
      setPolishedVariations((prev) => {
        const next = [newVar, ...prev.slice(0, 5)];
        setDiffLeftVariationId(next[0].id);
        if (next.length > 1) {
          setDiffRightVariationId(next[1].id);
        } else {
          setDiffRightVariationId(next[0].id);
        }
        return next;
      });
      setActiveVariationId(newVar.id);
      setShowSynthesizedModal(true);
      showToast(`高光文段打磨完成，共 ${res.word_count} 字`, 'success');
    } catch (err: any) {
      showToast(`文段打磨失败: ${err.message || err}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 成果采纳：将片段插入当前章节正文末尾/光标处并自动留存快照
  const handleInsertTextToEditor = (textToInsert: string, toastMsg = '已将选段插入正文！') => {
    if (!textToInsert.trim()) return;
    const current = useNovelStore.getState().editorContent || '';
    const nextContent = current ? `${current}\n\n${textToInsert.trim()}` : textToInsert.trim();
    updateEditorContent(nextContent);
    saveCurrentChapter(true, 'SANDBOX_SNIPPET_INSERT');
    showToast(toastMsg, 'success');
  };

  // 划选文字悬浮灵感捕获
  const handleStudioTextSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedProseSnippet('');
      return;
    }
    const text = sel.toString().trim();
    if (text.length >= 2) {
      setSelectedProseSnippet(text);
    } else {
      setSelectedProseSnippet('');
    }
  };

  const handleCaptureSelectedSnippet = () => {
    if (!selectedProseSnippet) return;
    const isQuote = selectedProseSnippet.includes('“') || selectedProseSnippet.includes('"');
    const note: InspirationNote = {
      id: `insp-sel-${Date.now()}`,
      type: isQuote ? 'QUOTE' : 'ACTION',
      content: selectedProseSnippet,
      created_at: Date.now(),
    };
    const nextNotes = [note, ...inspirationNotes];
    setInspirationNotes(nextNotes);
    showToast(`已将 ${selectedProseSnippet.length} 字高光选句存入灵感盒！`, 'success');
    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        inspiration_notes_json: JSON.stringify(nextNotes),
      }).catch(console.error);
    }
    setSelectedProseSnippet('');
    window.getSelection()?.removeAllRanges();
  };

  // 智能提取高光描写与对白至灵感盒
  const handleExtractHighlightsToInspiration = () => {
    if (!synthesizedProse.trim()) return;
    const lines = synthesizedProse
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 10);
    if (lines.length === 0) return;

    const newNotes: InspirationNote[] = lines.slice(0, 3).map((line, idx) => ({
      id: `insp-extract-${Date.now()}-${idx}`,
      type: line.includes('“') || line.includes('"') ? 'QUOTE' : 'ACTION',
      content: line,
      created_at: Date.now() + idx,
    }));

    const nextNotes = [...newNotes, ...inspirationNotes];
    setInspirationNotes(nextNotes);
    showToast(`已成功提炼 ${newNotes.length} 条高光描写存入灵感盒！`, 'success');

    if (activeSession) {
      api.updateSandboxSession({
        id: activeSession.id,
        inspiration_notes_json: JSON.stringify(nextNotes),
      }).catch(console.error);
    }
  };

  // 成果采纳：追加到当前正文
  const handleAppendToEditor = () => {
    if (!synthesizedProse) return;
    const current = useNovelStore.getState().editorContent;
    const nextContent = current ? `${current}\n\n${synthesizedProse}` : synthesizedProse;
    updateEditorContent(nextContent);
    saveCurrentChapter(true, 'SANDBOX_PROSE_APPEND');
    showToast('已追加至当前章节末尾并留存快照备份！', 'success');
    setShowSynthesizedModal(false);
  };

  // 成果采纳：替换当前正文
  const handleReplaceEditor = async () => {
    if (!synthesizedProse) return;
    const confirmed = await confirmDialog({
      title: '替换当前章节正文',
      message: '确定将转译正文替换当前章节全部内容吗？系统会自动在版本抽屉留存备份。',
      tone: 'danger',
      confirmText: '确认替换',
      cancelText: '取消',
    });
    if (!confirmed) return;
    updateEditorContent(synthesizedProse);
    saveCurrentChapter(true, 'SANDBOX_PROSE_REPLACE');
    showToast('已替换章节正文并安全存档！', 'success');
    setShowSynthesizedModal(false);
  };

  // 成果采纳：存为章节候选提案
  const handleSaveAsProposal = async () => {
    if (!activeNovel || !activeChapter || !synthesizedProse) return;
    try {
      await api.createChapterProposal({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        content: synthesizedProse,
        proposal_summary: `【角色演武场对戏合成】${sessionTitle}`,
        reasoning_trace: `出场角色: ${actors.map((a) => a.character_name).join(' vs ')}；总对戏节拍: ${dialogueHistory.length} 轮`,
      });
      showToast('已暂存为章节候选提案，可去历史抽屉一键比对采纳！', 'success');
      setShowSynthesizedModal(false);
    } catch (err: any) {
      showToast(`暂存提案失败: ${err.message || err}`, 'error');
    }
  };

  // 👗 角色立绘与外貌理解交互方法
  const openActorVisualModal = (index: number) => {
    const actor = actors[index];
    if (!actor) return;
    const charObj = charactersMap.get(actor.character_id);
    setSelectedActorIndex(index);
    setModalAvatarUrl(charObj?.avatar_url || actor.avatar_url || '');
    setModalVisualSummary(charObj?.visual_summary || actor.visual_summary || '');
    setModalGender(charObj?.gender || actor.gender || '男');
    setModalAppearanceTags([]);
    setSyncToNovelDb(true);
    setShowActorVisualModal(true);
  };

  const handleActorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeImageFileToDataUrl(file, {
        maxDimension: 1024,
        quality: 0.88,
        maxFileSizeBytes: 10 * 1024 * 1024,
      });
      setModalAvatarUrl(optimized);
      showToast('已载入立绘并完成高清优化，可点击【👁️ AI 识图】自动理解人设外貌', 'success');
    } catch (err: any) {
      showToast(err?.message || '读取立绘失败', 'warning');
    }
  };

  const handleAnalyzeActorAppearance = async () => {
    if (!modalAvatarUrl) {
      showToast('请先上传或填入角色立绘/贴图', 'warning');
      return;
    }
    if (selectedActorIndex === null) return;
    const actor = actors[selectedActorIndex];
    if (!actor) return;

    setIsAnalyzingActorVisual(true);
    try {
      const result = await api.analyzeCharacterAppearance({
        image_url: modalAvatarUrl,
        character_name: actor.character_name,
        gender: modalGender,
        genre: activeNovel?.genre_profile,
      });

      setModalVisualSummary(result.visual_summary);
      setModalAppearanceTags(result.appearance_tags || []);
      showToast('AI 识图成功！已自动提取核心视觉特征与外貌描写', 'success');
    } catch (err: any) {
      console.error('AI 识图失败:', err);
      showToast(`AI 识图分析异常: ${err?.message || err}`, 'error');
    } finally {
      setIsAnalyzingActorVisual(false);
    }
  };

  const handleSaveActorVisual = async () => {
    if (selectedActorIndex === null) return;
    const actor = actors[selectedActorIndex];
    if (!actor) return;

    // 1. 更新当前演武场 Actor
    const nextActors = [...actors];
    nextActors[selectedActorIndex] = {
      ...actor,
      avatar_url: modalAvatarUrl.trim() || undefined,
      visual_summary: modalVisualSummary.trim() || undefined,
      gender: modalGender,
    };
    setActors(nextActors);

    if (activeSession) {
      await api.updateSandboxSession({
        id: activeSession.id,
        characters_config: nextActors,
      }).catch(console.error);
    }

    // 2. 如果关联了小说人物库中的角色
    const charObj = charactersMap.get(actor.character_id);
    if (charObj) {
      try {
        await api.updateCharacter({
          id: charObj.id,
          name: charObj.name,
          gender: modalGender,
          avatar_url: modalAvatarUrl.trim() || undefined,
          visual_summary: modalVisualSummary.trim() || undefined,
        });
        if (activeNovel) {
          const updated = await api.listCharacters(activeNovel.id);
          setCharacters(updated);
        }
      } catch (e) {
        console.error('同步更新角色档案失败:', e);
      }
    } else if (syncToNovelDb && activeNovel) {
      // 预设角色同步创建到小说角色库
      try {
        const created = await api.createCharacter({
          novel_id: activeNovel.id,
          name: actor.character_name,
          gender: modalGender,
          personality: '性格深沉果决',
          motivation: actor.private_motivation || '在对决中谋取主动',
          background: '演武场登场角色',
          avatar_url: modalAvatarUrl.trim() || undefined,
          visual_summary: modalVisualSummary.trim() || undefined,
        });
        nextActors[selectedActorIndex] = {
          ...nextActors[selectedActorIndex],
          character_id: created.id,
        };
        setActors(nextActors);
        if (activeSession) {
          await api.updateSandboxSession({
            id: activeSession.id,
            characters_config: nextActors,
          }).catch(console.error);
        }
        const updated = await api.listCharacters(activeNovel.id);
        setCharacters(updated);
        showToast(`已将【${actor.character_name}】及其立绘同步收录至小说人物设定库！`, 'success');
      } catch (e) {
        console.error('新建角色同步失败:', e);
      }
    }

    setShowActorVisualModal(false);
    showToast(`已应用【${actor.character_name}】的立绘贴图与外貌特征`, 'success');
  };

  // 一键反哺角色状态机到全书长期记忆
  const handleSyncToMemoryEngine = async () => {
    if (actors.length === 0 || dialogueHistory.length === 0) {
      showToast('尚无演武场心路记录，无法反哺', 'warning');
      return;
    }
    try {
      for (const actor of actors) {
        await api.createCharacterStateEvent({
          character_id: actor.character_id,
          source_chapter_id: activeChapter?.id,
          effective_time: `演武场《${sessionTitle}》`,
          field_name: '对手戏心境演变',
          previous_value: '常规对峙',
          new_value: `私密动机：${actor.private_motivation}；隐藏底牌：${actor.private_secret}`,
        });
      }
      showToast('已将全员心路暗流与认知沉淀至全书长期记忆库！', 'success');
    } catch (err: any) {
      showToast(`反哺记忆失败: ${err.message || err}`, 'error');
    }
  };

  // 导出剧本脚本 (TXT)
  const handleExportScript = () => {
    let content = `====================================================\n`;
    content += `《${sessionTitle}》戏剧对手戏脚本\n`;
    content += `物理环境：${sceneSetting}\n`;
    content += `交锋目标：${sceneGoal}\n`;
    content += `出场角色：${actors.map((a) => a.character_name).join('、')}\n`;
    content += `====================================================\n\n`;

    dialogueHistory.forEach((r, idx) => {
      if (r.is_narrator_event) {
        content += `[第 ${idx + 1} 幕 · 突发变故] 【旁白】${r.character_action}\n\n`;
      } else {
        content += `[第 ${idx + 1} 幕] ${r.speaker_name.toUpperCase()}:\n`;
        if (r.character_action) {
          content += `  （${r.character_action}）\n`;
        }
        content += `  “${r.speech}”\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle}_剧本脚本.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('剧本脚本已成功下载！', 'success');
    setShowExportMenu(false);
  };

  // 导出完整排练纪要 (Markdown)
  const handleExportRehearsalMarkdown = () => {
    let md = `# 对戏演武场排练纪要：${sessionTitle}\n\n`;
    md += `> **场景设定**：${sceneSetting}\n`;
    md += `> **交锋目标**：${sceneGoal}\n\n`;
    md += `## 一、出场阵容与私密秘密\n`;
    actors.forEach((a) => {
      md += `- **【${a.character_name}】**\n`;
      md += `  - 私密动机：${a.private_motivation}\n`;
      md += `  - 隐藏秘密：${a.private_secret}\n`;
      md += `  - 语言风格：${a.voice_quirks || '沉着克制'}\n`;
      md += `  - 驱动形式：${a.is_human ? '作者亲演 (Human)' : 'AI 子代理'}\n`;
    });
    md += `\n---\n\n## 二、心理博弈与对戏全景实录\n\n`;
    dialogueHistory.forEach((r, idx) => {
      if (r.is_narrator_event) {
        md += `### ⚡ 节拍 ${idx + 1} · 突发环境变故\n> ${r.character_action}\n\n`;
      } else {
        md += `### 节拍 ${idx + 1} · ${r.speaker_name}\n`;
        if (r.inner_thought) {
          md += `> 🧠 **私密心理独白**：*“${r.inner_thought}”*\n\n`;
        }
        if (r.character_action) {
          md += `*动作神态*：${r.character_action}\n\n`;
        }
        md += `**台词**：“${r.speech}”\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle}_排练纪要.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('上帝视角排练纪要已导出！', 'success');
    setShowExportMenu(false);
  };

  // 最新张力值
  const latestRound = dialogueHistory[dialogueHistory.length - 1];
  const currentTension = latestRound ? calculateDialogueTension(latestRound) : { level: 2, label: '静默待命', colorClass: 'text-stone-500 bg-stone-500/10' };

  // 🎭 渲染剧本与角色阵容设定抽屉内部主体 (分界面分标签页体系)
  const renderConfigDrawerContent = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#fbf8f0] dark:bg-[#1c1916] text-[#2c2621] dark:text-[#e8e2d8] select-none">
      {/* 抽屉顶栏 */}
      <div className="h-13 px-4 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7] dark:bg-[#201c19] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-600/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#e8e2d8] truncate">剧本与角色设定</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold shrink-0">
            {actors.length} 位角色
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsConfigDrawerPinned(!isConfigDrawerPinned)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isConfigDrawerPinned
                ? 'bg-amber-600/20 border-amber-500/50 text-amber-900 dark:text-amber-300 shadow-2xs'
                : 'border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 text-[#8a7f73]'
            }`}
            title={isConfigDrawerPinned ? '取消侧栏固定，转换为悬浮抽屉模式' : '固定为常驻侧边栏'}
          >
            <Pin className={`w-3.5 h-3.5 ${isConfigDrawerPinned ? 'rotate-45 text-amber-700 dark:text-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowConfigDrawer(false)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#8a7f73] hover:text-[#2c2621] dark:hover:text-[#e8e2d8] transition-colors cursor-pointer"
            title="收起设定抽屉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 分界面导航选项卡 (Tab 栏) */}
      <div className="px-3.5 py-2 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7]/60 dark:bg-[#201c19]/60 shrink-0">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-serif font-medium gap-1">
          <button
            type="button"
            onClick={() => setConfigDrawerTab('actors')}
            className={`py-1.5 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              configDrawerTab === 'actors'
                ? 'bg-white dark:bg-[#141210] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">出场阵容 ({actors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setConfigDrawerTab('scene')}
            className={`py-1.5 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              configDrawerTab === 'scene'
                ? 'bg-white dark:bg-[#141210] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">场景与目标</span>
          </button>
          <button
            type="button"
            onClick={() => setConfigDrawerTab('presets')}
            className={`py-1.5 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              configDrawerTab === 'presets'
                ? 'bg-white dark:bg-[#141210] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">经典情境</span>
          </button>
        </div>
      </div>

      {/* 分界面主体内容滚动区 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 overscroll-contain transform-gpu">
        {/* TAB 1: 出场阵容与动机 */}
        {configDrawerTab === 'actors' && (
          <div className="space-y-3.5">
            {/* 角色空态指引横幅 */}
            {characters.length < 2 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-serif font-bold text-amber-800 dark:text-amber-300">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>当前小说角色不足 2 位（仅 {characters.length} 位）</span>
                </div>
                <p className="text-[11px] text-[#6e6357] dark:text-[#a89d91] leading-relaxed">
                  对手戏需要至少两位角色交锋试探。您可以一键导入经典示范角色立刻开戏！
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleImportDemoCharacters}
                    disabled={isImportingDemo}
                    className="w-full px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isImportingDemo ? '正在导入示范角色...' : '一键导入示范角色 (林渊 vs 洛清雪)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 阵容工具栏 */}
            <div className="flex items-center justify-between pb-1 border-b border-[#eee7d8] dark:border-[#2e2823]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-serif font-bold text-[#4a4036] dark:text-[#d4cbbf] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 出场阵容 ({actors.length})
                </span>
                {actors.length >= 2 && (
                  <button
                    onClick={handleSwapActors}
                    title="互换双方攻守位置"
                    className="p-1 text-[#8a7f73] hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleQuickMultiApiAssign}
                  className="text-[10px] text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  title="为出场角色一键分配不同 AI 服务商与模型（支持跨模型对战推演）"
                >
                  <Sliders className="w-3 h-3 text-amber-600" />
                  <span>多模型分工</span>
                </button>

                {availableCharacters.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddActor(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="text-[11px] px-2 py-1 rounded border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] text-[#5c5044] dark:text-[#c4baa8] outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      + 挑选小说角色...
                    </option>
                    {availableCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.gender ? `(${c.gender})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 角色卡片列表 */}
            {actors.map((actor, idx) => {
              const charObj = charactersMap.get(actor.character_id);
              const avatarUrl = charObj?.avatar_url || actor.avatar_url;
              const visualSummary = charObj?.visual_summary || actor.visual_summary;
              const gender = charObj?.gender || actor.gender;
              return (
                <div
                  key={actor.character_id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#141210] border border-[#e8e0ce] dark:border-[#322c27] space-y-2.5 shadow-xs"
                >
                  {/* 角色卡片顶栏 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative group/avatar cursor-pointer">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={actor.character_name}
                            className="w-10 h-10 rounded-full object-cover border border-amber-500/30 shadow-2xs group-hover/avatar:opacity-85 transition-opacity"
                            onClick={() => openActorVisualModal(idx)}
                          />
                        ) : (
                          <div
                            onClick={() => openActorVisualModal(idx)}
                            className="w-10 h-10 rounded-full bg-amber-600/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-serif font-bold text-xs flex items-center justify-center group-hover/avatar:bg-amber-600/25 transition-colors"
                          >
                            {actor.character_name.slice(0, 1)}
                          </div>
                        )}
                        <span
                          onClick={() => openActorVisualModal(idx)}
                          className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] bg-black/60 text-white font-mono opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                        >
                          换图
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#f0eae0]">
                            {actor.character_name}
                          </span>
                          {gender && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              gender === '女'
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            }`}>
                              {gender === '女' ? '♀' : '♂'} {gender}
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-600/15 text-amber-800 dark:text-amber-300 font-medium">
                              先手方
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => openActorVisualModal(idx)}
                            className="text-[10px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20"
                            title="配置立绘、外貌体态或点击进行多模态视觉识别"
                          >
                            <Image className="w-2.5 h-2.5 text-teal-600" />
                            <span>立绘外貌与AI识图</span>
                          </button>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImageUrl(avatarUrl)}
                              className="text-[10px] text-[#8a7f73] hover:text-amber-700 flex items-center gap-0.5"
                              title="在新窗口查看大图"
                            >
                              <Eye className="w-2.5 h-2.5" /> 大图
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRemoveActor(idx)}
                        title="移出对戏阵容"
                        className="p-1 rounded text-[#a39788] hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 视觉外貌特征下锚摘要 */}
                  {visualSummary ? (
                    <div className="p-2 rounded-lg bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-200/90 leading-relaxed space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> 视觉锚定 (推演与精修自动融入):
                        </span>
                        <button
                          type="button"
                          onClick={() => openActorVisualModal(idx)}
                          className="hover:underline flex items-center gap-0.5 text-teal-600 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> 重新提炼
                        </button>
                      </div>
                      <p className="line-clamp-2">{visualSummary}</p>
                    </div>
                  ) : avatarUrl ? (
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-500/10 text-[10px] text-amber-800 dark:text-amber-300">
                      <span>已上传立绘，尚未生成视觉特征</span>
                      <button
                        type="button"
                        onClick={() => openActorVisualModal(idx)}
                        className="font-bold underline hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> 点击运行【AI 识图】，自动生成外貌描写
                      </button>
                    </div>
                  ) : null}

                  {/* 亲演 / AI驱动 切换 */}
                  <div className="grid grid-cols-2 p-0.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-black/5 dark:bg-white/5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => updateActorField(idx, 'is_human', false)}
                      className={`py-1 rounded text-center transition-all ${
                        !actor.is_human
                          ? 'bg-white dark:bg-[#201c19] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                          : 'text-[#8a7f73]'
                      }`}
                    >
                      🤖 AI 驱动
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActorField(idx, 'is_human', true)}
                      className={`py-1 rounded text-center transition-all ${
                        actor.is_human
                          ? 'bg-white dark:bg-[#201c19] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                          : 'text-[#8a7f73]'
                      }`}
                    >
                      👤 作者亲演
                    </button>
                  </div>

                  {/* 独立服务商与模型选择 */}
                  {!actor.is_human && (
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-[#8a7f73]">服务商</label>
                          <button
                            type="button"
                            onClick={() => setShowSettingsModal(true)}
                            className="text-[9px] text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            配置API
                          </button>
                        </div>
                        <select
                          value={actor.provider_id || ''}
                          onChange={(e) => updateActorField(idx, 'provider_id', e.target.value || undefined)}
                          className="w-full text-[11px] px-1.5 py-1 rounded border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#1c1916] outline-none"
                        >
                          <option value="">默认服务商</option>
                          {providers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8a7f73] block mb-0.5">模型</label>
                        <select
                          value={actor.model_name || ''}
                          onChange={(e) => updateActorField(idx, 'model_name', e.target.value || undefined)}
                          className="w-full text-[11px] px-1.5 py-1 rounded border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#1c1916] outline-none"
                        >
                          <option value="">默认模型</option>
                          {(actor.provider_id ? modelsMap[actor.provider_id] || [] : []).map((m) => (
                            <option key={m.id} value={m.model_name}>
                              {m.display_name || m.model_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 私密动机 */}
                  <div>
                    <label className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block mb-0.5">
                      当场私密动机
                    </label>
                    <textarea
                      rows={2}
                      value={actor.private_motivation}
                      onChange={(e) => updateActorField(idx, 'private_motivation', e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#1c1916] focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                      placeholder="他在防备什么？想达成什么？"
                    />
                  </div>

                  {/* 隐藏秘密 */}
                  <div>
                    <label className="text-[10px] text-rose-700 dark:text-rose-400 font-medium block mb-0.5">
                      隐藏秘密与软肋
                    </label>
                    <input
                      type="text"
                      value={actor.private_secret}
                      onChange={(e) => updateActorField(idx, 'private_secret', e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#1c1916] focus:ring-1 focus:ring-amber-500 outline-none"
                      placeholder="暗藏的后手或不可告人的往事..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: 场景与交锋目标 */}
        {configDrawerTab === 'scene' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#eee7d8] dark:border-[#2e2823]">
              <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 场景与目标
              </span>
              <div className="flex items-center gap-1.5">
                {collabStatus === 'CONNECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const ok = sendSandboxSync({
                        session_title: sessionTitle,
                        scene_setting: sceneSetting,
                        scene_goal: sceneGoal,
                        actors,
                        dialogue_history: dialogueHistory,
                        branches,
                        active_branch_id: activeBranchId,
                      });
                      if (ok) showToast('已将当前演武场设定同步给协作者！', 'success');
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                    title="通过 P2P 广播当前演武场给协作者"
                  >
                    <Globe className="w-3 h-3" /> 同步给协作者
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetSceneAndActors}
                  className="text-[11px] text-[#8a7f73] hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  title="重置场景描述、交锋目标与出场角色的临时秘密动机"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置设定</span>
                </button>
                <button
                  onClick={handleSaveSession}
                  className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  保存演武场
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportBibleModal(true)}
                  className="text-[11px] text-amber-800 dark:text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30"
                  title="从当前小说导入章节正文前情、大纲与世界观法则"
                >
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span>导入设定</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#8a7f73] dark:text-[#9e9284] block mb-1">对戏标题</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#8a7f73] dark:text-[#9e9284]">环境描写</label>
                <span className="text-[10px] text-[#a39788]">{sceneSetting.length} 字</span>
              </div>
              <textarea
                rows={3}
                value={sceneSetting}
                onChange={(e) => setSceneSetting(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none resize-none leading-relaxed"
                placeholder="深夜书房，窗外风雪大作，案上灯花微响..."
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-[#8a7f73]">快速环境灵感:</span>
                {[
                  '深夜书房，残烛摇曳',
                  '荒郊破庙，暴雨如注',
                  '宫闱深处，暗香浮动',
                  '喧闹茶肆，龙蛇混杂',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSceneSetting((prev) => (prev ? `${prev}。${tag}` : tag))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#8a7f73] dark:text-[#9e9284]">交锋目标</label>
                <span className="text-[10px] text-[#a39788]">{sceneGoal.length} 字</span>
              </div>
              <textarea
                rows={3}
                value={sceneGoal}
                onChange={(e) => setSceneGoal(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none resize-none leading-relaxed"
                placeholder="核心矛盾、试探底线与结局走向..."
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-[#8a7f73]">高频交锋目标:</span>
                {[
                  '逼对方露出马脚',
                  '试探彼此真正底线',
                  '利益谈判暗藏杀机',
                  '身份识破生死抉择',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSceneGoal((prev) => (prev ? `${prev}；${tag}` : tag))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 经典冲突情境库 */}
        {configDrawerTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#eee7d8] dark:border-[#2e2823]">
              <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> 经典高冲突戏份模板
              </span>
              <span className="text-[10px] text-[#8a7f73]">
                点击一键套用情境与攻防动机
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SANDBOX_PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    applyPresetTemplate(tmpl);
                    setConfigDrawerTab('actors');
                  }}
                  className="p-3 rounded-xl border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">{tmpl.icon}</span>
                      <span className="text-xs font-serif font-bold text-[#4a4036] dark:text-[#c4baa8] group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {tmpl.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8a7f73] dark:text-[#9e9284] line-clamp-2 leading-relaxed">
                      {tmpl.scene_goal}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-[#f0e8d8] dark:border-[#2d2722] flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    <span>套用模板</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 抽屉底栏 */}
      <div className="p-3 border-t border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7] dark:bg-[#201c19] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleResetSceneAndActors}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#201c19] text-[#6b5e51] dark:text-[#a89b8d] hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          title="重置场景描述、交锋目标与出场角色的临时秘密动机"
        >
          <RotateCcw className="w-3 h-3" />
          <span>重置设定</span>
        </button>
        <button
          type="button"
          onClick={() => setShowConfigDrawer(false)}
          className="px-3.5 py-1.5 text-xs rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-serif font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span>进入推演舞台</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#fdfbf7] dark:bg-[#181614] text-[#2c2621] dark:text-[#e8e2d8] select-none overflow-hidden font-sans">
      {/* 顶栏 (单行防挤压、防折行排版架构，实体背景消除滚动掉帧) */}
      <div className="h-14 px-3 sm:px-4 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7] dark:bg-[#201c19] flex items-center justify-between shrink-0 z-10 min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-600/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs shrink-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="font-serif font-bold text-sm sm:text-base tracking-wide whitespace-nowrap shrink-0">角色对戏演武场</h2>
            
            {/* 会话切换器下拉 */}
            <div className="relative shrink-0 max-w-[130px] sm:max-w-[170px]">
              <button
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                className="flex items-center justify-between gap-1.5 px-2 py-1 text-xs rounded-lg border border-[#e0d6c3] dark:border-[#38312a] bg-white dark:bg-[#201c19] hover:bg-amber-50 dark:hover:bg-amber-950/20 font-medium transition-colors w-full min-w-0 overflow-hidden"
                title="切换或新建对戏沙盒"
              >
                <span className="truncate text-amber-900 dark:text-amber-300">
                  {sessionTitle || '选择对戏会话'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8a7f73] shrink-0" />
              </button>

              {showSessionDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#1e1b18] rounded-xl shadow-md border border-[#ded5c2] dark:border-[#38322c] py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="px-3 py-1.5 border-b border-[#eee7d8] dark:border-[#2e2823] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8a7f73] dark:text-[#9e9284]">
                      历史对戏 ({sessions.length})
                    </span>
                    <button
                      onClick={handleCreateNewSession}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 新建对戏
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
                    {sessions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#8a7f73] text-center">暂无保存的会话</div>
                    ) : (
                      sessions.map((sess) => {
                        const isCur = activeSession?.id === sess.id;
                        return (
                          <div
                            key={sess.id}
                            onClick={() => {
                              loadSession(sess);
                              setShowSessionDropdown(false);
                            }}
                            className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isCur
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-bold'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#4a4036] dark:text-[#c4baa8]'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="truncate">{sess.title}</p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(sess.id, e)}
                              title="删除此会话"
                              className="p-1 rounded text-[#a39788] hover:text-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🎭 剧本与阵容设定抽屉呼出按钮 */}
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`px-2 sm:px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                showConfigDrawer
                  ? 'bg-amber-600/15 border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold'
                  : 'border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#201c19] text-[#6b5e51] dark:text-[#a89b8d] hover:bg-amber-50 dark:hover:bg-amber-950/20'
              }`}
              title={showConfigDrawer ? '收起剧本设定抽屉' : '打开剧本设定抽屉：配置出场阵容、秘密动机、环境与交锋目标'}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>剧本设定</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                {actors.length}人
              </span>
            </button>

            {/* 实时戏剧张力胶囊 (超大屏 3xl 下在顶栏透出，常规屏幕聚合于对戏走向栏，彻底杜绝排版挤压重叠) */}
            {dialogueHistory.length > 0 && (
              <div className={`hidden 3xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap shrink-0 ${currentTension.colorClass}`}>
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>张力: {currentTension.label} ({currentTension.level}/10)</span>
              </div>
            )}

            {/* 核心亮点副标: 纯单行内联展示，空间不足时平滑隐藏，绝不产生垂直折行外溢 */}
            <span className="text-xs text-[#8a7f73] dark:text-[#9e9284] truncate hidden 2xl:inline-block border-l border-[#e0d6c3] dark:border-[#38312a] pl-2.5 whitespace-nowrap shrink">
              零心理同质化 · 战争迷雾心路 (CoT) · 高光灵感捕捉
            </span>
          </div>
        </div>

        {/* 顶栏右侧功能区 (响应式紧凑弹性排版，自适应分栏与抽屉宽度) */}
        <div className="flex items-center gap-1 sm:gap-1.5 relative shrink-0">
          {/* 💡 灵感火花盒 */}
          <button
            type="button"
            onClick={() => setShowInspirationDrawer(!showInspirationDrawer)}
            className={`px-2 sm:px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showInspirationDrawer || inspirationNotes.length > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
                : 'border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 text-[#6e6357] dark:text-[#a89d91]'
            }`}
            title="打开灵感火花盒，查看提炼的金句、微动作、心理暗流与反转线索"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden lg:inline">灵感盒</span>
            {inspirationNotes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                {inspirationNotes.length}
              </span>
            )}
          </button>

          {/* 视角透视切换双分段胶囊 (内心戏 | 潜台词) */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-black/5 dark:bg-white/5 shrink-0 whitespace-nowrap">
            <button
              onClick={() => setShowPrivateThoughts(!showPrivateThoughts)}
              className={`px-1.5 sm:px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                showPrivateThoughts
                  ? 'bg-white dark:bg-[#201c19] text-amber-900 dark:text-amber-300 font-bold shadow-2xs'
                  : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
              }`}
              title={showPrivateThoughts ? '当前：显示内心算盘独白' : '当前：隐藏内心独白'}
            >
              {showPrivateThoughts ? <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden md:inline">内心戏</span>
            </button>
            <button
              onClick={() => setShowSubtext(!showSubtext)}
              className={`px-1.5 sm:px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                showSubtext
                  ? 'bg-white dark:bg-[#201c19] text-purple-900 dark:text-purple-300 font-bold shadow-2xs'
                  : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
              }`}
              title={showSubtext ? '当前：开启潜台词透视' : '当前：关闭潜台词透视'}
            >
              <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${showSubtext ? 'text-purple-600' : ''}`} />
              <span className="hidden md:inline">潜台词</span>
            </button>
          </div>

          {/* 🌐 联机已连接状态指示胶囊 (仅在已建立 P2P 房间时常驻展示，常规未连接时收纳至导出/工具箱，消除排版拥挤与多端重叠) */}
          {collabStatus === 'CONNECTED' && (
            <button
              onClick={() => setShowCollabModal(true)}
              className="px-2 sm:px-2.5 py-1 text-xs rounded-lg border bg-emerald-600/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="当前正处于 P2P 互联网异地联机中，点击管理房间与协同设置"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span className="hidden sm:inline">P2P:{collabRoomCode}</span>
            </button>
          )}

          {/* 更多工具下拉菜单 (设定导入、P2P联机、API模型管理、导出剧本/排练纪要、双轨重置) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2 sm:px-2.5 py-1.5 text-xs rounded-lg border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 text-[#6e6357] dark:text-[#a89d91] cursor-pointer"
              title="工具箱与导出"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">导出/工具</span>
              <ChevronDown className="w-3 h-3 text-[#8a7f73] shrink-0" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-[#201c19] rounded-xl shadow-md border border-[#ded5c2] dark:border-[#38322c] py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowImportBibleModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-[#4a4036] dark:text-[#c4baa8] cursor-pointer"
                  title="从小说章节导入前情正文、大纲、世界观法则与角色羁绊"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>📖 从小说导入设定与前情</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowCollabModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-[#4a4036] dark:text-[#c4baa8] cursor-pointer"
                  title="开启/管理 6 位房间码 P2P 互联网异地联机对戏"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>🌐 互联网联机协同对戏 (P2P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowSettingsModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-[#4a4036] dark:text-[#c4baa8] cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>🔌 API 与模型配置管理</span>
                </button>
                <div className="my-1 border-t border-[#eee7d8] dark:border-[#2e2823]" />
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportScript();
                  }}
                  disabled={dialogueHistory.length === 0}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 disabled:opacity-40 text-[#4a4036] dark:text-[#c4baa8] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>导出为戏剧对白脚本 (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportRehearsalMarkdown();
                  }}
                  disabled={dialogueHistory.length === 0}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 disabled:opacity-40 text-[#4a4036] dark:text-[#c4baa8] cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>导出上帝视角排练纪要 (.md)</span>
                </button>
                <div className="my-1 border-t border-[#eee7d8] dark:border-[#2e2823]" />
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleResetDialogue();
                  }}
                  disabled={dialogueHistory.length === 0}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 disabled:opacity-40 text-rose-700 dark:text-rose-400 cursor-pointer"
                  title="清空当前所有对白记录，保留设定重新推演"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>🔄 重置推演对戏记录</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleResetSceneAndActors();
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-700 dark:text-rose-400 cursor-pointer"
                  title="清空场景描述、交锋目标与出场角色的临时秘密动机"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>🧹 重置场景与出场设定</span>
                </button>
              </div>
            )}
          </div>

          {/* ✍️ 优化精修文段 (主高光按钮) */}
          <button
            onClick={() => handleSynthesizeProse()}
            disabled={dialogueHistory.length === 0 || isSynthesizing}
            className="px-2.5 sm:px-3 py-1.5 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-medium flex items-center gap-1 sm:gap-1.5 shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="将高光对手戏升华打磨为高质量小说描写文段（支持电影感/心理流/硬派多文风）"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isSynthesizing ? '打磨中...' : '✍️ 优化精修文段'}</span>
            <span className="sm:hidden">{isSynthesizing ? '打磨中' : '精修'}</span>
          </button>

          {/* 模态框关闭按钮 */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#73685d] shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* 🎭 剧本与角色阵容设定 (常驻固定侧边栏模式，点击抽屉顶部的图钉可固定) */}
        {showConfigDrawer && isConfigDrawerPinned && (
          <div className="w-88 md:w-96 border-r border-[#e6decc] dark:border-[#2d2824] bg-[#fbf8f0] dark:bg-[#1c1916] flex flex-col shrink-0 overflow-hidden z-20">
            {renderConfigDrawerContent()}
          </div>
        )}

        {/* 🎭 剧本与角色阵容设定 (悬浮抽屉 Slide-over Drawer + 遮罩层，默认模式) */}
        {showConfigDrawer && !isConfigDrawerPinned && (
          <>
            {/* 抽屉背景蒙层（纯色半透明，移除高开销的 backdrop-blur 避免滚动掉帧） */}
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 z-30 animate-in fade-in duration-150 cursor-pointer"
              onClick={() => setShowConfigDrawer(false)}
            />
            {/* 抽屉滑出容器（独立合成层硬件加速，确保抽屉内滚动与底层画布解耦达到 60FPS） */}
            <div className="absolute left-0 top-0 bottom-0 w-full sm:w-[440px] md:w-[480px] max-w-[95vw] bg-[#fbf8f0] dark:bg-[#1c1916] border-r border-[#e6decc] dark:border-[#2d2824] shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 overflow-hidden transform-gpu">
              {renderConfigDrawerContent()}
            </div>
          </>
        )}

        {/* 右侧：对戏交锋大厅与气泡流 */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#fdfbf7] dark:bg-[#181614] relative">
          {/* 🌿 树状分支推演导航栏 (What-If Branch Bar) */}
          <div className="px-4 py-2 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#fbf8f0] dark:bg-[#1c1916] flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-serif font-bold text-[#8a7f73] flex items-center gap-1 mr-1">
                <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                剧情走向:
              </span>

              {/* 主时间线胶囊 */}
              <button
                onClick={() => handleSwitchBranch('main')}
                className={`px-2.5 py-1 rounded-full text-xs font-serif transition-all flex items-center gap-1.5 border ${
                  activeBranchId === 'main'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white dark:bg-[#201c19] text-[#6b5e51] dark:text-[#a89b8d] border-[#ded5c2] dark:border-[#38322c] hover:border-emerald-500'
                }`}
              >
                <span>🌱 主时间线</span>
                <span className="text-[10px] opacity-80">
                  ({activeBranchId === 'main' ? dialogueHistory.length : mainHistoryCount}轮)
                </span>
              </button>

              {/* 平行分支胶囊列表 */}
              {branches.map((b) => (
                <div
                  key={b.id}
                  className={`group flex items-center rounded-full border text-xs font-serif transition-all pl-2.5 pr-1 py-0.5 ${
                    activeBranchId === b.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-[#201c19] text-[#6b5e51] dark:text-[#a89b8d] border-[#ded5c2] dark:border-[#38322c] hover:border-emerald-500'
                  }`}
                >
                  <button
                    onClick={() => handleSwitchBranch(b.id)}
                    className="flex items-center gap-1.5 mr-1"
                  >
                    <span>🌿 {b.name}</span>
                    <span className="text-[10px] opacity-80">
                      ({activeBranchId === b.id ? dialogueHistory.length : b.history.length}轮)
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBranch(b.id);
                    }}
                    className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 opacity-60 hover:opacity-100 transition-opacity"
                    title="删除该推演分支"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* 右侧功能区：实时戏剧张力胶囊 + 开辟分支 */}
            <div className="flex items-center gap-2 shrink-0">
              {dialogueHistory.length > 0 && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap shrink-0 shadow-2xs ${currentTension.colorClass}`}>
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>张力: {currentTension.label} ({currentTension.level}/10)</span>
                </div>
              )}

              {/* 开辟分支按钮 */}
              <button
                onClick={() => handleOpenForkModal(dialogueHistory.length > 0 ? dialogueHistory.length - 1 : 0)}
                disabled={dialogueHistory.length === 0}
                className="px-2.5 py-1 rounded-lg text-xs font-serif border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                title="从当前最新轮次开辟新的平行走向分支"
              >
                <Plus className="w-3 h-3" />
                <span>开辟新分支</span>
              </button>
            </div>
          </div>
          {/* 对话消息滚动流 (原生硬件加速滚动 transform-gpu，消除推演过程与回顾滚动时的掉帧卡顿) */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 overscroll-contain transform-gpu"
          >
            {/* 开场环境卡片 */}
            <div
              className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 font-serif leading-relaxed"
            >
              <span className="font-bold mr-1">【舞台起幕】</span>
              {sceneSetting}
            </div>

            {dialogueHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#998d7f] dark:text-[#7d7265] space-y-2">
                <Swords className="w-9 h-9 opacity-30 stroke-1 mb-1" />
                <p className="text-sm font-serif text-[#4a4036] dark:text-[#d4cbbf]">对戏准备就绪，角色各持动机与秘密</p>
                <p className="text-xs text-[#8a7f73]">
                  点击下方【步进一轮】开始推演，支持快捷键 <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">Ctrl+Enter</kbd>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigDrawer(true);
                    setConfigDrawerTab('actors');
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl border border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 text-xs font-serif font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>配置剧本场景与角色秘密 (抽屉)</span>
                </button>
              </div>
            ) : (
              dialogueHistory.map((round, idx) => {
                if (round.is_narrator_event) {
                  return (
                    <div
                      key={idx}
                      className="mx-auto max-w-lg p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-600 dark:text-stone-400 font-serif"
                    >
                      <span className="font-bold text-amber-700 dark:text-amber-500 mr-1.5">⚡ 突发变故</span>
                      {round.character_action}
                    </div>
                  );
                }

                const isEditing = editingRoundIndex === idx;
                const actorIdx = actors.findIndex((a) => a.character_id === round.speaker_id);
                const isEven = actorIdx % 2 === 0;
                const tension = calculateDialogueTension(round);
                const isLastRound = idx === dialogueHistory.length - 1;
                const speakerChar = charactersMap.get(round.speaker_id);
                const actorForSpeaker = actors.find((a) => a.character_id === round.speaker_id || a.character_name === round.speaker_name);
                const speakerAvatarUrl = speakerChar?.avatar_url || actorForSpeaker?.avatar_url;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isEven ? 'items-start' : 'items-end'} max-w-2xl ${
                      isEven ? 'mr-auto' : 'ml-auto'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-1 px-1 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                      {speakerAvatarUrl ? (
                        <img
                          src={speakerAvatarUrl}
                          alt={round.speaker_name}
                          className="w-5 h-5 rounded-full object-cover border border-amber-800/30 shadow-2xs shrink-0 bg-surface-2"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-400 font-serif font-bold text-[10px] flex items-center justify-center shrink-0">
                          {round.speaker_name.slice(0, 1)}
                        </span>
                      )}
                      <span className="font-serif font-bold text-xs text-[#4a4036] dark:text-[#d4cbbf]">
                        {round.speaker_name}
                      </span>
                      <span className="text-[10px] text-[#a39788]">第 {round.round_index} 节拍</span>
                      
                      {/* 张力小徽章 */}
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${tension.colorClass}`}>
                        {tension.label} ({tension.level})
                      </span>

                      {round.is_edited_by_user && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          作者已修
                        </span>
                      )}
                    </div>

                    <div className="w-full rounded-2xl p-4 bg-white dark:bg-[#201c19] border border-[#e8dfcb] dark:border-[#332c26] shadow-sm space-y-2.5">
                      {/* 私密内心戏 (可折叠) */}
                      {showPrivateThoughts && round.inner_thought && (
                        <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> 私密心路独白
                            </span>
                          </div>
                          <p className="text-[#695d50] dark:text-[#c4baa8] font-serif leading-relaxed italic">
                            “{round.inner_thought}”
                          </p>
                        </div>
                      )}

                      {/* 编辑态 vs 展示态 */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-[#8a7f73] block mb-0.5">肢体微动作/神态</label>
                            <input
                              type="text"
                              value={editAction}
                              onChange={(e) => setEditAction(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-amber-500 bg-white dark:bg-[#141210] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#8a7f73] block mb-0.5">正面对白</label>
                            <textarea
                              rows={2}
                              value={editSpeech}
                              onChange={(e) => setEditSpeech(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-amber-500 bg-white dark:bg-[#141210] outline-none resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingRoundIndex(null)}
                              className="px-2.5 py-1 text-xs rounded border border-[#ded5c2] dark:border-[#38322c]"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveEditRound(idx)}
                              className="px-2.5 py-1 text-xs rounded bg-amber-700 text-white font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> 确认修改
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* 微动作 */}
                          {round.character_action && (
                            <p className="text-xs text-[#857767] dark:text-[#9e9080] font-serif italic mb-1.5">
                              {round.character_action}
                            </p>
                          )}

                          {/* 台词 */}
                          <p className="text-sm md:text-base font-serif font-medium text-[#231f1a] dark:text-[#f2ece1] leading-relaxed">
                            “{round.speech}”
                          </p>

                          {/* 💬 潜台词透视 */}
                          {showSubtext && !round.is_narrator_event && (
                            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-900/20 border border-purple-500/20 text-[11px] text-purple-900 dark:text-purple-300 italic flex items-start gap-1.5 leading-relaxed">
                              <span className="font-semibold not-italic text-purple-700 dark:text-purple-400 shrink-0">💬 潜台词:</span>
                              <span className="break-words">{distillSubtext(round)}</span>
                            </div>
                          )}

                          {/* ⚠️ 人设崩坏 / OOC 预警 */}
                          {!round.is_narrator_event && (() => {
                            const actor = actors.find((a) => a.character_id === round.speaker_id);
                            if (!actor) return null;
                            const ooc = auditPersonaDrift(actor, round);
                            if (!ooc.hasDrift) return null;
                            return (
                              <div className="mt-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="text-[11px] font-medium leading-tight">{ooc.warning}</span>
                                </div>
                                <button
                                  onClick={() => handleRerollWithCorrection(idx, actor, ooc.warning!)}
                                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-medium shrink-0 flex items-center gap-1 transition-colors"
                                  title="清除该轮并按照角色人设强行纠偏重新生成"
                                >
                                  <span>纠偏重掷</span>
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          })()}

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#f0eae0] dark:border-[#2a2420]">
                            {/* 单轮复制、灵感备忘提取与开辟分支 */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopySingleRound(round)}
                                className="text-[11px] text-[#8a7e70] hover:text-amber-700 flex items-center gap-1 transition-colors"
                                title="复制本句台词与神态"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制</span>
                              </button>

                              <button
                                onClick={() => handleCaptureInspiration(round, 'QUOTE')}
                                className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/25 flex items-center gap-1 transition-colors font-medium cursor-pointer"
                                title="将台词金句存入灵感盒"
                              >
                                <Lightbulb className="w-3 h-3 text-amber-600" />
                                <span>灵感</span>
                              </button>

                              <button
                                onClick={() => handleSynthesizeProse('CINEMATIC', 'FOCUSED_ROUND', idx)}
                                className="text-[11px] text-[#8a7e70] hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                                title={`将第 ${idx + 1} 节拍交锋打磨为小说文段`}
                              >
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>优化文段</span>
                              </button>

                              <button
                                onClick={() => handleProbeNextActions(round.speaker_id)}
                                className="text-[11px] text-[#8a7e70] hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                                title={`探测【${round.speaker_name}】在此刻的可能抉择路线`}
                              >
                                <Target className="w-3 h-3 text-indigo-600" />
                                <span>探他抉择</span>
                              </button>

                              <button
                                onClick={() => handleOpenForkModal(idx)}
                                className="text-[11px] text-[#8a7e70] hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                title="以此节拍开辟新的平行走向分支"
                              >
                                <GitBranch className="w-3 h-3 text-emerald-600" />
                                <span>分支</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* 重掷本轮 (仅限最新一轮且非连续推演中) */}
                              {isLastRound && !isRunning && (
                                <button
                                  onClick={handleRerollLatestRound}
                                  className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 transition-colors font-medium"
                                  title="撤销本句并让角色重新生成"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>重掷</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingRoundIndex(idx);
                                  setEditAction(round.character_action);
                                  setEditSpeech(round.speech);
                                }}
                                className="text-[11px] text-[#8a7e70] hover:text-amber-700 flex items-center gap-1 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" /> 改词
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* 正在推演中动效卡片 (带一键暂停中断按钮) */}
            {(isStepping || isRunning) && nextSpeaker && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150 py-1">
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  {nextSpeaker.avatar_url ? (
                    <img src={nextSpeaker.avatar_url} alt={nextSpeaker.character_name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Users className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1 max-w-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-xs text-amber-900 dark:text-amber-300">
                        {nextSpeaker.character_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-700 dark:text-amber-300" />
                        正在暗自权衡利弊与构思台词...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStopDeduction}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                      title="立即中断并暂停本次推演 (Esc)"
                    >
                      <Pause className="w-3 h-3" />
                      <span>暂停推演 (Esc)</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#8a7f73] italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    <span>权衡利弊与博弈应对中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 智能滚动保护：未读新台词浮动胶囊 */}
          {unreadRoundsCount > 0 && isScrolledUp && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-lg flex items-center gap-1.5 animate-bounce z-20"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>收到 {unreadRoundsCount} 条新台词 · 点击直达最新</span>
            </button>
          )}

          {/* 插入旁白输入条 */}
          {showNarratorInput && (
            <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-300 shrink-0">
                注入天意变故:
              </span>
              <input
                type="text"
                value={narratorInput}
                onChange={(e) => setNarratorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsertNarrator()}
                placeholder="例如：门外突然传来一声马嘶；窗纸被寒风撕破一道口子..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none"
                autoFocus
              />
              <button
                onClick={handleInsertNarrator}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> 注入 (Enter)
              </button>
              <button
                onClick={() => setShowNarratorInput(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#857767]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 作者亲演即兴台词发射坞 (当下一轮由作者肉身接管时弹出) */}
          {isHumanTurn && !isRunning && !isStepping && (
            <div className="p-3 bg-amber-50/95 dark:bg-amber-950/50 border-t border-amber-300 dark:border-amber-800/60 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-amber-900 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>🎭 亲演【{nextSpeaker?.character_name}】：</span>
                </div>
                <button
                  onClick={() => executeStep()}
                  className="text-[11px] text-[#8a7f73] hover:text-amber-700 hover:underline transition-colors"
                >
                  委托 AI 代发言
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#8a7f73] block mb-0.5">肢体神态微动作</label>
                  <input
                    type="text"
                    value={humanAction}
                    onChange={(e) => setHumanAction(e.target.value)}
                    placeholder="例如：（按住佩刀，眼神微冷）"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-amber-800 dark:text-amber-400 font-bold block mb-0.5">
                    正面对白 (Enter 发射)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={humanSpeech}
                      onChange={(e) => setHumanSpeech(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleHumanSubmit()}
                      placeholder="例如：“夜深露重，私闯民宅可不合规矩。”"
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-amber-500 bg-white dark:bg-[#141210] focus:ring-2 focus:ring-amber-500 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleHumanSubmit}
                      disabled={!humanSpeech.trim()}
                      className="px-4 py-1.5 text-xs rounded-lg bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold flex items-center gap-1 shadow-sm transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" /> 发送
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 底部控制栏 (纯色实体背景，严密防折行、防溢出遮挡架构，推演中实时可暂停) */}
          <div className="h-16 px-3 sm:px-4 border-t border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7] dark:bg-[#201c19] flex items-center justify-between shrink-0 z-10 gap-2 min-w-0">
            {/* 左侧状态信息区 (严格 overflow-hidden 截断，杜绝溢出文本与右侧按钮重叠) */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden shrink-0">
              <span className="text-xs text-[#8a7f73] dark:text-[#9e9284] whitespace-nowrap shrink-0">
                对戏 <strong className="text-[#2c2621] dark:text-[#e8e2d8]">{dialogueHistory.length}</strong> 轮
              </span>

              {/* 重置推演按钮 (常驻显式呈现，用户随时可定位并一键重置对话实录) */}
              <button
                onClick={handleResetDialogue}
                disabled={dialogueHistory.length === 0 || isRunning || isStepping}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#201c19] text-[#6b5e51] dark:text-[#a89b8d] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/50 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs group"
                title={dialogueHistory.length === 0 ? "暂无推演对话记录" : "重置并清空对戏实录，保留角色设定重新推演"}
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8a7f73] group-hover:text-rose-600 transition-colors" />
                <span>重置推演</span>
              </button>

              {/* 推演中状态胶囊 */}
              {isRunning && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium animate-pulse whitespace-nowrap shrink-0 flex items-center gap-1.5">
                  <Pause className="w-3 h-3 text-rose-600" />
                  <span>连续推演中... 剩余 {autoRunRoundsRemaining} 轮</span>
                </span>
              )}

              {isStepping && !isRunning && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium animate-pulse whitespace-nowrap shrink-0 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>推演中...</span>
                </span>
              )}

              {/* 实时暂停直达按钮 */}
              {(isRunning || isStepping) && (
                <button
                  type="button"
                  onClick={handleStopDeduction}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
                  title="点此或按 Esc 立即暂停"
                >
                  <Pause className="w-3 h-3" />
                  <span>按 Esc 立即暂停</span>
                </button>
              )}
            </div>

            {/* 右侧动作控制区 (高度稳固，防挤压) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 🎭 导演干预合并下拉菜单 (在分屏与常规屏幕 < 2xl 下优雅合并，释放 220px 空间，彻底杜绝按钮挤出截断) */}
              <div className="relative 2xl:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInterveneMenu(!showInterveneMenu)}
                  disabled={isRunning || isStepping || actors.length === 0}
                  className={`px-2.5 py-2 text-xs rounded-xl border flex items-center gap-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 ${
                    showInterveneMenu
                      ? 'border-indigo-600/50 bg-indigo-600/15 text-indigo-900 dark:text-indigo-300'
                      : 'border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#201c19] text-[#5a4f43] dark:text-[#c4baa8] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="导演剧情干预：指定角色发言、插入外界旁白、🎯 抉择探针"
                >
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>剧情干预</span>
                  <ChevronDown className={`w-3 h-3 text-[#8a7f73] transition-transform ${showInterveneMenu ? 'rotate-180' : ''}`} />
                </button>

                {showInterveneMenu && (
                  <div className="absolute bottom-full mb-1.5 right-0 w-52 bg-white dark:bg-[#1e1b18] rounded-xl shadow-xl border border-[#ded5c2] dark:border-[#38322c] py-1.5 z-40 animate-in fade-in slide-in-from-bottom-1 duration-100">
                    <div className="px-3 py-1 text-[10px] text-[#8a7f73] border-b border-[#eee7d8] dark:border-[#2e2823] font-bold">
                      剧情导演干预工具
                    </div>
                    {/* 1. 抉择探针 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowInterveneMenu(false);
                        handleProbeNextActions();
                      }}
                      disabled={isProbingActions}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-medium cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{isProbingActions ? '探测中...' : '🎯 角色抉择探针'}</span>
                    </button>
                    {/* 2. 指定发言 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowInterveneMenu(false);
                        setShowSpeakerPicker(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-[#4a4036] dark:text-[#d4cbbf] cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>指定角色发言</span>
                    </button>
                    {/* 3. 插入旁白 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowInterveneMenu(false);
                        setShowNarratorInput(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 text-[#4a4036] dark:text-[#d4cbbf] cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>插入外界旁白</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 超宽大屏 (>= 2xl) 展开平铺独立干预按钮 */}
              <div className="hidden 2xl:flex items-center gap-1.5 shrink-0">
                {/* 插入旁白变故 */}
                <button
                  onClick={() => setShowNarratorInput(!showNarratorInput)}
                  disabled={isRunning || isStepping}
                  className="px-2.5 py-2 text-xs rounded-xl border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="插入突发外界变故与天意干预"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>插入旁白</span>
                </button>

                {/* 🎯 探测角色此时会怎么做 */}
                <button
                  onClick={() => handleProbeNextActions()}
                  disabled={isRunning || isStepping || actors.length === 0 || isProbingActions}
                  className="px-3 py-2 text-xs rounded-xl border border-indigo-600/40 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-800 dark:text-indigo-300 font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                  title="推演主要人物在此时的可能抉择方案"
                >
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isProbingActions ? '探测中...' : '🎯 抉择探针'}</span>
                </button>
              </div>

              {/* 指定发言人浮窗 (支持独立或从干预菜单触发) */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSpeakerPicker(!showSpeakerPicker)}
                  disabled={isRunning || isStepping || actors.length === 0}
                  className="hidden 2xl:flex px-2.5 py-2 text-xs rounded-xl border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="指定由哪位角色主动发言发难"
                >
                  <span>指定发言</span>
                  <ChevronDown className="w-3 h-3 text-[#8a7f73]" />
                </button>

                {showSpeakerPicker && (
                  <div className="absolute bottom-full mb-1.5 right-0 w-48 bg-white dark:bg-[#1e1b18] rounded-xl shadow-md border border-[#ded5c2] dark:border-[#38322c] py-1 z-50 animate-in fade-in slide-in-from-bottom-1 duration-100">
                    <div className="px-3 py-1.5 text-[10px] text-[#8a7f73] border-b border-[#eee7d8] dark:border-[#2e2823] font-bold">
                      指定发言角色
                    </div>
                    {actors.map((a) => (
                      <button
                        key={a.character_id}
                        onClick={() => {
                          setShowSpeakerPicker(false);
                          executeStep(undefined, a.character_id);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-serif font-bold text-[#4a4036] dark:text-[#d4cbbf]">
                          {a.character_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[#8a7f73]">
                          {a.is_human ? '作者亲演' : 'AI驱动'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 步进一轮 (内嵌精美 kbd 快捷键，消除横向文本占位) */}
              <button
                onClick={() => executeStep()}
                disabled={isRunning || isStepping || actors.length === 0}
                className="px-3 py-2 text-xs rounded-xl border border-amber-600/40 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                title="步进一轮对戏 (快捷键: Ctrl+Enter，推演中按 Esc 取消)"
              >
                {isStepping && !isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <SkipForward className="w-3.5 h-3.5" />
                )}
                <span>{isStepping && !isRunning ? '推演中...' : '步进一轮'}</span>
                {!isStepping && (
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.2 rounded bg-amber-600/15 text-[10px] font-mono text-amber-900 dark:text-amber-200">
                    Ctrl+↵
                  </kbd>
                )}
              </button>

              {/* 连续自动推演 / 立即暂停按钮 (单步或连续推演中均可一键暂停) */}
              <button
                onClick={isRunning || isStepping ? handleStopDeduction : handleStartAuto}
                disabled={actors.length === 0}
                className={`px-3.5 py-2 text-xs rounded-xl text-white font-medium flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                  isRunning || isStepping
                    ? 'bg-rose-700 hover:bg-rose-800 animate-pulse'
                    : 'bg-amber-700 hover:bg-amber-800 disabled:opacity-40'
                }`}
                title={
                  isRunning || isStepping
                    ? '立即暂停推演 (快捷键: Esc)'
                    : '连续自动推演多轮对手戏 (Esc 可随时暂停)'
                }
              >
                {isRunning || isStepping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning || isStepping ? '暂停推演 (Esc)' : '连续推演'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✍️ 高光文段精修打磨台 (Highlight Prose Polishing Studio) */}
      {showSynthesizedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#3a332d] bg-[#fbf9f5] dark:bg-[#1a1715] flex flex-col font-sans">
            {/* 顶栏：标题与视图模式切换 */}
            <div className="px-5 py-3 border-b border-[#e8dfcb] dark:border-[#2d2824] flex items-center justify-between bg-[#f4efe4] dark:bg-[#201c19] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#f0eae0]">
                      高光文段打磨台
                    </h3>
                    {polishingAnchorIndex !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-500/20">
                        第 {polishingAnchorIndex + 1} 节拍
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 视图切换胶囊: 纯享阅读 | 骨架对照 | 双版比对 | 原地编辑 */}
                <div className="flex items-center p-0.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-black/5 dark:bg-white/5 text-xs shrink-0">
                  <button
                    onClick={() => setPolishingStudioView('READ')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      polishingStudioView === 'READ'
                        ? 'bg-white dark:bg-[#201c19] text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                        : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
                    }`}
                    title="纯享阅读模式，支持逐段采纳与提取金句"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>纯享阅读</span>
                  </button>
                  <button
                    onClick={() => setPolishingStudioView('COMPARE')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      polishingStudioView === 'COMPARE'
                        ? 'bg-white dark:bg-[#201c19] text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                        : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
                    }`}
                    title="骨架对照：左侧对戏记录 vs 右侧打磨文段"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>骨架对照</span>
                  </button>
                  <button
                    onClick={() => setPolishingStudioView('DIFF')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      polishingStudioView === 'DIFF'
                        ? 'bg-white dark:bg-[#201c19] text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                        : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
                    }`}
                    title="双版比对：同屏比对两个版本的文采与措辞"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>双版比对</span>
                  </button>
                  <button
                    onClick={() => setPolishingStudioView('EDIT')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      polishingStudioView === 'EDIT'
                        ? 'bg-white dark:bg-[#201c19] text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                        : 'text-[#8a7f73] hover:text-[#4a4036] dark:hover:text-[#e8e2d8]'
                    }`}
                    title="原地编辑微调文段字词"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>原地编辑</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSynthesizedModal(false)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767] cursor-pointer"
                  title="关闭打磨台"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 登场人物视觉设定与外貌下锚栏 */}
            {actors.length > 0 && (
              <div className="px-5 py-1.5 border-b border-[#ede5d4] dark:border-[#2a2420] bg-stone-100/60 dark:bg-[#141210] flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
                <span className="text-[11px] font-bold text-stone-500 shrink-0 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>视觉下锚:</span>
                </span>
                {actors.map((actor, aIdx) => (
                  <div
                    key={actor.character_id || aIdx}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-[#e0d6c3] dark:border-[#38322c] bg-white dark:bg-[#1d1a17] shrink-0"
                  >
                    {actor.avatar_url ? (
                      <img
                        src={actor.avatar_url}
                        alt={actor.character_name}
                        className="w-4 h-4 rounded-full object-cover border border-amber-600/30 shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-600/15 text-amber-700 dark:text-amber-400 text-[10px] font-serif font-bold flex items-center justify-center shrink-0">
                        {actor.character_name.slice(0, 1)}
                      </div>
                    )}
                    <span className="font-serif font-bold text-stone-800 dark:text-stone-200 text-xs">
                      {actor.character_name}
                    </span>
                    {actor.visual_summary ? (
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 max-w-[220px] truncate" title={actor.visual_summary}>
                        {actor.visual_summary}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">未填外貌</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 控制条：文风流派 / 视角 / 范围 / 换写法重炼 */}
            <div className="px-5 py-2.5 border-b border-[#ede5d4] dark:border-[#2a2420] bg-stone-50/70 dark:bg-[#161412] flex flex-col gap-2 shrink-0 text-xs">
              {/* 第一行：五大文学流派文风 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-stone-500 mr-1 shrink-0">文学文风:</span>
                  {(
                    [
                      { key: 'CINEMATIC', label: '🎬 电影感白描', desc: '强化光影声色与微小动作' },
                      { key: 'PSYCHOLOGICAL', label: '🧠 心理暗流', desc: '眼神暗战与隐秘动机权衡' },
                      { key: 'HARDCORE_TENSE', label: '⚡ 硬派冷冽', desc: '语言凝练、短句高压' },
                      { key: 'CLASSICAL_ELEGANT', label: '📜 古风留白', desc: '辞藻清雅沉凝、借景生杀' },
                      { key: 'DARK_HUMOR_IRONY', label: '🎭 冷面讽刺', desc: '言不由衷、笑里藏刀' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSynthesizeProse(item.key)}
                      disabled={isSynthesizing}
                      className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-all cursor-pointer ${
                        polishingStyle === item.key
                          ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                          : 'bg-white dark:bg-[#221e1a] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-500'
                      }`}
                      title={item.desc}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* 换个写法 (Re-roll) 按钮 */}
                <button
                  onClick={() => handleSynthesizeProse()}
                  disabled={isSynthesizing}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="以此设定换一种全新的口吻重新打磨生成一个新版本"
                >
                  <Dices className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                  <span>换个写法</span>
                </button>
              </div>

              {/* 第二行：视点、打磨跨度与多版本切换 */}
              <div className="flex items-center justify-between gap-3 flex-wrap text-[11px] pt-1 border-t border-stone-200/50 dark:border-stone-800/50">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* 叙事视角 */}
                  <div className="flex items-center gap-1 text-stone-500">
                    <span className="font-medium">视点:</span>
                    {(
                      [
                        { key: 'THIRD_LIMITED', label: '第三人称限制' },
                        { key: 'THIRD_OMNISCIENT', label: '第三人称全知' },
                        { key: 'FIRST_PERSON', label: '第一人称' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => handleSynthesizeProse(undefined, undefined, undefined, p.key)}
                        disabled={isSynthesizing}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          polishingPov === p.key
                            ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold'
                            : 'hover:text-stone-800 dark:hover:text-stone-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* 打磨范围 */}
                  <div className="flex items-center gap-1 text-stone-500 border-l border-stone-200 dark:border-stone-800 pl-3">
                    <span className="font-medium">范围:</span>
                    {polishingAnchorIndex !== null && (
                      <button
                        onClick={() => handleSynthesizeProse(polishingStyle, 'FOCUSED_ROUND')}
                        disabled={isSynthesizing}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          polishingRange === 'FOCUSED_ROUND'
                            ? 'bg-amber-600/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30'
                            : 'hover:text-stone-700'
                        }`}
                      >
                        🎯 节拍 #{polishingAnchorIndex + 1}
                      </button>
                    )}
                    <button
                      onClick={() => handleSynthesizeProse(polishingStyle, 'RECENT_3')}
                      disabled={isSynthesizing}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        polishingRange === 'RECENT_3'
                          ? 'bg-amber-600/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30'
                          : 'hover:text-stone-700'
                      }`}
                    >
                      ⚡ 近 3 轮
                    </button>
                    <button
                      onClick={() => handleSynthesizeProse(polishingStyle, 'ALL')}
                      disabled={isSynthesizing}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        polishingRange === 'ALL'
                          ? 'bg-amber-600/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30'
                          : 'hover:text-stone-700'
                      }`}
                    >
                      📜 全场
                    </button>
                  </div>
                </div>

                {/* 多版本历史快照横向切换 */}
                {polishedVariations.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-stone-400">历史版本:</span>
                    {polishedVariations.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setActiveVariationId(v.id);
                          setSynthesizedProse(v.text);
                          if (v.style) setPolishingStyle(v.style as any);
                          if (v.pov) setPolishingPov(v.pov as any);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition-all ${
                          activeVariationId === v.id
                            ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                            : 'bg-black/5 dark:bg-white/10 text-stone-600 dark:text-stone-400 hover:bg-black/10'
                        }`}
                      >
                        版本 {polishedVariations.length - i} ({v.wordCount}字)
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 第三行：细调指导输入 */}
              <div className="w-full flex items-center gap-2 pt-1 border-t border-stone-200/50 dark:border-stone-800/50">
                <input
                  type="text"
                  value={customPolishingGuidance}
                  onChange={(e) => setCustomPolishingGuidance(e.target.value)}
                  placeholder="补充特别倾向，如：侧重眼神交锋、雨声氛围、语言冷峻克制..."
                  className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSynthesizeProse()}
                />
                <button
                  onClick={() => handleSynthesizeProse()}
                  disabled={isSynthesizing}
                  className="px-3 py-1 text-xs rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {isSynthesizing ? '打磨中...' : '重新打磨'}
                </button>
              </div>
            </div>

            {/* 主内容工作区 (根据视图模式切换，transform-gpu 硬件加速平滑滚动) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 overscroll-contain transform-gpu">
              {/* 模式 A：纯享文学阅读与逐段采纳 */}
              {polishingStudioView === 'READ' && (
                <div
                  onMouseUp={handleStudioTextSelection}
                  className="max-w-3xl mx-auto space-y-4"
                >
                  {/* 划选文字悬浮即时操作条 (纯色高对比度，消除 sticky 下 backdrop-blur 滚动重采样开销) */}
                  {selectedProseSnippet && (
                    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 p-2.5 px-4 rounded-xl bg-amber-700 dark:bg-amber-800 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-2 text-xs truncate max-w-[55%]">
                        <Sparkles className="w-4 h-4 shrink-0 text-amber-200" />
                        <span className="truncate">已选 {selectedProseSnippet.length} 字：“{selectedProseSnippet}”</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs">
                        <button
                          onClick={handleCaptureSelectedSnippet}
                          className="px-2.5 py-1 rounded-lg bg-white text-amber-900 font-bold hover:bg-amber-50 flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="将选中的句子单独存入灵感火花盒"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>存为灵感</span>
                        </button>
                        <button
                          onClick={() => {
                            handleInsertTextToEditor(selectedProseSnippet, `已将选中的 ${selectedProseSnippet.length} 字插入正文！`);
                            setSelectedProseSnippet('');
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium flex items-center gap-1 cursor-pointer"
                          title="将选中的句子插入当前小说正文"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>插正文</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedProseSnippet);
                            showToast(`已复制选中的 ${selectedProseSnippet.length} 字！`, 'success');
                            setSelectedProseSnippet('');
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white flex items-center gap-1 cursor-pointer"
                          title="复制所选文字"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProseSnippet('');
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="p-1 hover:bg-white/20 rounded cursor-pointer ml-1"
                          title="取消选择"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {synthesizedProse.split('\n\n').filter((p) => p.trim()).map((para, pIdx) => (
                    <div
                      key={pIdx}
                      className="group relative p-3 rounded-xl hover:bg-black/2.5 dark:hover:bg-white/2.5 transition-colors border border-transparent hover:border-[#e0d6c3]/50 dark:hover:border-[#3a322c]/50"
                    >
                      <p className="font-serif text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] select-text indent-8">
                        {para.trim()}
                      </p>
                      {/* 悬浮操作胶囊：复制本段 / 存为灵感 / 插入正文 */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-[#201c19]/95 border border-[#ded5c2] dark:border-[#3a332d] shadow-xs rounded-lg p-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(para.trim());
                            setCopiedParaIdx(pIdx);
                            setTimeout(() => setCopiedParaIdx(null), 1500);
                            showToast('已复制该段高光描写至剪贴板！', 'success');
                          }}
                          className="px-2 py-0.5 text-[11px] rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                          title="复制该自然段至剪贴板"
                        >
                          {copiedParaIdx === pIdx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedParaIdx === pIdx ? '已复制' : '复制此段'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const newNote: InspirationNote = {
                              id: `insp-para-${Date.now()}-${pIdx}`,
                              type: para.includes('“') || para.includes('"') ? 'QUOTE' : 'ACTION',
                              content: para.trim(),
                              created_at: Date.now(),
                            };
                            const nextNotes = [newNote, ...inspirationNotes];
                            setInspirationNotes(nextNotes);
                            showToast('已将该段存入灵感火花盒！', 'success');
                            if (activeSession) {
                              api.updateSandboxSession({
                                id: activeSession.id,
                                inspiration_notes_json: JSON.stringify(nextNotes),
                              }).catch(console.error);
                            }
                          }}
                          className="px-2 py-0.5 text-[11px] rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                          title="将该自然段存入灵感火花盒"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-600" />
                          <span>存为灵感</span>
                        </button>
                        <button
                          onClick={() => {
                            handleInsertTextToEditor(para.trim(), '已将该段高光描写插入当前章节！');
                          }}
                          className="px-2 py-0.5 text-[11px] rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-800 dark:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                          title="将该段插入当前小说草稿"
                        >
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <span>插正文</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 底部高光提炼卡片 */}
                  <div className="mt-4 p-2.5 px-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>提炼文段中的微动作描写与对白金句至灵感盒</span>
                    </div>
                    <button
                      onClick={handleExtractHighlightsToInspiration}
                      className="px-3 py-1 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>一键提取金句入盒</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 模式 B：骨架对照视图 (原对戏记录 vs 升华正文) */}
              {polishingStudioView === 'COMPARE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {/* 左栏：输入源 (原对戏骨架记录) */}
                  <div className="border border-[#e2d9c5] dark:border-[#322c26] rounded-xl p-4 bg-white/70 dark:bg-[#151311] overflow-y-auto space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                      <span className="text-xs font-serif font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        原始对戏记录 ({comparedRounds.length} 节拍)
                      </span>
                    </div>

                    {comparedRounds.map((r, i) => (
                      <div key={r.round_index || i} className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-[#fbf9f5] dark:bg-[#1a1715] text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                          <span>【{r.speaker_name}】</span>
                          <span className="text-[10px] text-stone-400 font-normal">节拍 #{r.round_index}</span>
                        </div>
                        {r.inner_thought && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 italic">
                            <span className="font-bold mr-1">内心算盘:</span>
                            {r.inner_thought}
                          </div>
                        )}
                        {r.character_action && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 italic indent-2">
                            （{r.character_action}）
                          </p>
                        )}
                        {r.speech && (
                          <p className="font-serif font-bold text-stone-900 dark:text-stone-100 pl-2 border-l-2 border-amber-500">
                            “{r.speech}”
                          </p>
                        )}
                        {r.subtext && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                            潜台词：{r.subtext}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 右栏：输出成果 (升华正文) */}
                  <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-500/5 dark:bg-emerald-500/5 overflow-y-auto space-y-3 font-serif">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 font-sans">
                      <span className="text-xs font-serif font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        打磨小说文段
                      </span>
                    </div>

                    <div className="text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] space-y-3 whitespace-pre-wrap select-text">
                      {synthesizedProse}
                    </div>
                  </div>
                </div>
              )}

              {/* 模式 C：双版同屏比对 (DIFF) */}
              {polishingStudioView === 'DIFF' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {/* 左侧版本 */}
                  {(() => {
                    const leftVar = polishedVariations.find((v) => v.id === diffLeftVariationId) || polishedVariations[0];
                    return (
                      <div className="border border-stone-300 dark:border-stone-800 rounded-xl p-4 bg-white/70 dark:bg-[#151311] overflow-y-auto space-y-3 flex flex-col font-serif">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800 font-sans shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">版本 A:</span>
                            <select
                              value={leftVar?.id}
                              onChange={(e) => setDiffLeftVariationId(e.target.value)}
                              className="text-xs px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#201c19] text-stone-800 dark:text-stone-200 outline-none"
                            >
                              {polishedVariations.map((v, i) => (
                                <option key={v.id} value={v.id}>
                                  版本 {polishedVariations.length - i} ({v.style} · {v.wordCount}字)
                                </option>
                              ))}
                            </select>
                          </div>
                          {leftVar && (
                            <div className="flex items-center gap-1 font-sans">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(leftVar.text);
                                  showToast('已复制版本 A 全文！', 'success');
                                }}
                                className="px-2 py-0.5 text-[11px] rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1 cursor-pointer"
                                title="复制此版本"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制</span>
                              </button>
                              <button
                                onClick={() => handleInsertTextToEditor(leftVar.text, '已将版本 A 插入正文！')}
                                className="px-2 py-0.5 text-[11px] rounded bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20 flex items-center gap-1 cursor-pointer font-medium"
                                title="插入正文"
                              >
                                <BookOpen className="w-3 h-3 text-emerald-600" />
                                <span>插正文</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] space-y-3 whitespace-pre-wrap select-text">
                          {leftVar?.text || '暂无选定版本'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 右侧版本 */}
                  {(() => {
                    const rightVar = polishedVariations.find((v) => v.id === diffRightVariationId) || polishedVariations[1] || polishedVariations[0];
                    return (
                      <div className="border border-emerald-500/30 rounded-xl p-4 bg-emerald-500/5 dark:bg-emerald-500/5 overflow-y-auto space-y-3 flex flex-col font-serif">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 font-sans shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">版本 B:</span>
                            <select
                              value={rightVar?.id}
                              onChange={(e) => setDiffRightVariationId(e.target.value)}
                              className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-white dark:bg-[#201c19] text-stone-800 dark:text-stone-200 outline-none"
                            >
                              {polishedVariations.map((v, i) => (
                                <option key={v.id} value={v.id}>
                                  版本 {polishedVariations.length - i} ({v.style} · {v.wordCount}字)
                                </option>
                              ))}
                            </select>
                          </div>
                          {rightVar && (
                            <div className="flex items-center gap-1 font-sans">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(rightVar.text);
                                  showToast('已复制版本 B 全文！', 'success');
                                }}
                                className="px-2 py-0.5 text-[11px] rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1 cursor-pointer"
                                title="复制此版本"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制</span>
                              </button>
                              <button
                                onClick={() => handleInsertTextToEditor(rightVar.text, '已将版本 B 插入正文！')}
                                className="px-2 py-0.5 text-[11px] rounded bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20 flex items-center gap-1 cursor-pointer font-medium"
                                title="插入正文"
                              >
                                <BookOpen className="w-3 h-3 text-emerald-600" />
                                <span>插正文</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] space-y-3 whitespace-pre-wrap select-text">
                          {rightVar?.text || '暂无选定版本'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 模式 D：原地编辑微调 */}
              {polishingStudioView === 'EDIT' && (
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>原地微调词句与标点：</span>
                    <span>字数：{synthesizedProse.replace(/\s+/g, '').length} 字</span>
                  </div>
                  <textarea
                    value={synthesizedProse}
                    onChange={(e) => setSynthesizedProse(e.target.value)}
                    className="flex-1 w-full p-4 rounded-xl border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] font-serif text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] outline-none focus:ring-1 focus:ring-emerald-500 resize-none select-text"
                    placeholder="在此编辑打磨文段..."
                  />
                </div>
              )}
            </div>

            {/* 底部操作栏：核心强调“找灵感与复制好句”，附加功能“随手归档” */}
            <div className="px-5 py-3 border-t border-[#e8dfcb] dark:border-[#2d2824] bg-[#f4efe4] dark:bg-[#201c19] flex items-center justify-between gap-4 flex-wrap shrink-0">
              {/* 主操作区：灵感利用与复制 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#8a7f73]">
                  字数：{synthesizedProse.replace(/\s+/g, '').length} 字
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(synthesizedProse);
                    showToast('已复制打磨小说高光文段至剪贴板！', 'success');
                  }}
                  className="px-3.5 py-1.5 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> 复制全文
                </button>
                <button
                  onClick={() => {
                    const newNote: InspirationNote = {
                      id: `insp-polish-${Date.now()}`,
                      type: 'QUOTE',
                      content: synthesizedProse.slice(0, 300) + (synthesizedProse.length > 300 ? '...' : ''),
                      created_at: Date.now(),
                    };
                    const nextNotes = [newNote, ...inspirationNotes];
                    setInspirationNotes(nextNotes);
                    showToast('已作为高光文段存入灵感火花盒！', 'success');
                    if (activeSession) {
                      api.updateSandboxSession({
                        id: activeSession.id,
                        inspiration_notes_json: JSON.stringify(nextNotes),
                      }).catch(console.error);
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-amber-600/40 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer"
                  title="将文段存入灵感火花盒"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> 存入灵感盒
                </button>
                <button
                  onClick={handleExtractHighlightsToInspiration}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5 cursor-pointer"
                  title="自动提炼其中的高光描写与对白金句"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 提炼金句
                </button>
                <button
                  onClick={() => handleInsertTextToEditor(synthesizedProse, '已将打磨文段插入当前章节！')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5 cursor-pointer"
                  title="将此打磨段落插入当前章节草稿"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" /> 插入正文
                </button>
                <button
                  onClick={handleSyncToMemoryEngine}
                  className="px-3 py-1.5 text-xs rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="将交锋事实与心境反哺至长期记忆引擎"
                >
                  <Share2 className="w-3.5 h-3.5" /> 反哺长期记忆
                </button>
              </div>

              {/* 次要辅助操作：随手归档到正文 */}
              <div className="flex items-center gap-1.5 text-[11px] border-l border-stone-300 dark:border-stone-700 pl-3">
                <span className="text-[#8a7f73] mr-1 hidden sm:inline">正文草稿:</span>
                <button
                  onClick={handleAppendToEditor}
                  className="px-2.5 py-1 text-xs rounded border border-[#ded5c2] dark:border-[#3a332d] hover:bg-black/5 dark:hover:bg-white/5 text-[#554b3f] dark:text-[#c4baa8] font-medium flex items-center gap-1 cursor-pointer"
                  title="将此打磨段落追加到当前章节末尾"
                >
                  <BookOpen className="w-3 h-3 text-emerald-600" /> 追加到章末
                </button>
                <button
                  onClick={handleSaveAsProposal}
                  className="px-2.5 py-1 text-xs rounded border border-[#ded5c2] dark:border-[#3a332d] hover:bg-black/5 dark:hover:bg-white/5 text-[#554b3f] dark:text-[#c4baa8] font-medium flex items-center gap-1 cursor-pointer"
                  title="暂存为章节候选提案"
                >
                  <FileText className="w-3 h-3 text-amber-600" /> 存为提案
                </button>
                <button
                  onClick={handleReplaceEditor}
                  className="px-2 py-1 text-xs rounded text-rose-600/70 hover:text-rose-700 hover:underline cursor-pointer"
                  title="替换当前章节全部正文"
                >
                  替换正文
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 角色当下行动抉择探针弹窗 (What Would They Do?) */}
      {showActionProbeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#38322c] bg-[#fbf9f5] dark:bg-[#181614] p-5 font-sans flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6decc] dark:border-[#2d2824] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#f0eae0]">
                    抉择路线推演 · 【{probeSpeakerName}】
                  </h4>
                  <p className="text-[11px] text-[#8a7f73]">
                    推演当前情境下的可能行动路线
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActionProbeModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
              {isProbingActions ? (
                <div className="h-48 flex flex-col items-center justify-center space-y-2 text-stone-500 text-xs">
                  <Target className="w-8 h-8 text-indigo-600 animate-spin opacity-60" />
                  <p className="font-serif font-medium">正在推演【{probeSpeakerName}】的抉择路线...</p>
                </div>
              ) : actionOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  暂未获取到行动方案，点击刷新重试
                </div>
              ) : (
                actionOptions.map((opt, i) => (
                  <div
                    key={opt.id || i}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-[#201c19] hover:border-indigo-500/50 transition-all space-y-2 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-serif font-bold text-xs text-indigo-950 dark:text-indigo-200">
                          {opt.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const note: InspirationNote = {
                              id: `insp-probe-${Date.now()}-${i}`,
                              type: 'PSYCHOLOGY',
                              content: `【${probeSpeakerName}·${opt.label}】内心算盘：${opt.inner_motive}\n微表情动作：${opt.action_preview}\n台词话术：“${opt.speech_preview}”`,
                              speaker_name: probeSpeakerName,
                              created_at: Date.now(),
                            };
                            const nextNotes = [note, ...inspirationNotes];
                            setInspirationNotes(nextNotes);
                            showToast('已将该角色的抉择路线存入灵感盒！', 'success');
                            if (activeSession) {
                              api.updateSandboxSession({
                                id: activeSession.id,
                                inspiration_notes_json: JSON.stringify(nextNotes),
                              }).catch(console.error);
                            }
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                          title="存入灵感火花盒"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-600" />
                          <span>存为灵感</span>
                        </button>
                        <button
                          onClick={() => {
                            handleInsertTextToEditor(`（${opt.action_preview}）“${opt.speech_preview}”`, '已将此抉择行动插入正文！');
                          }}
                          className="px-2 py-1 text-xs rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                          title="插入小说正文"
                        >
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <span>插正文</span>
                        </button>
                        <button
                          onClick={() => handleApplyActionOption(opt)}
                          className="px-3 py-1 text-xs rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <span>⚡ 采纳步进</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 pl-7">
                      <p className="text-[#6b5f52] dark:text-[#b8ad9f] leading-relaxed">
                        <strong className="text-stone-700 dark:text-stone-300 font-semibold mr-1">🧠 内心盘算:</strong>
                        {opt.inner_motive}
                      </p>
                      <p className="text-[#6b5f52] dark:text-[#b8ad9f] leading-relaxed italic">
                        <strong className="text-stone-700 dark:text-stone-300 font-semibold mr-1 not-italic">🎭 微动作:</strong>
                        {opt.action_preview}
                      </p>
                      <p className="text-[#2b241c] dark:text-[#ece4d8] font-serif font-medium leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/40 dark:border-amber-900/30">
                        <strong className="text-amber-800 dark:text-amber-400 mr-1">💬 话术试探:</strong>
                        {opt.speech_preview}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 底部微调补充 */}
            <div className="pt-3 border-t border-[#e6decc] dark:border-[#2d2824] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={customActionGuidance}
                onChange={(e) => setCustomActionGuidance(e.target.value)}
                placeholder="自定义应对打算，如：表面答应，暗中防备..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customActionGuidance.trim()) {
                    executeStep(undefined, probeSpeakerId, customActionGuidance.trim());
                    setShowActionProbeModal(false);
                    setCustomActionGuidance('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (customActionGuidance.trim()) {
                    executeStep(undefined, probeSpeakerId, customActionGuidance.trim());
                    setShowActionProbeModal(false);
                    setCustomActionGuidance('');
                  }
                }}
                disabled={!customActionGuidance.trim()}
                className="px-4 py-2 text-xs rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white font-bold shrink-0 transition-colors cursor-pointer"
              >
                采纳自定义路线
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 灵感火花与金句提炼盒抽屉 (Inspiration Spark Board Drawer) */}
      {showInspirationDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#fbf9f5] dark:bg-[#1a1715] border-l border-[#ded5c2] dark:border-[#3a332d] shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3.5 border-b border-[#e8dfcb] dark:border-[#2d2824] bg-[#f4efe4] dark:bg-[#201c19] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#f0eae0]">
                  灵感盒 ({inspirationNotes.length})
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowInspirationDrawer(false)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 顶层提炼与导出工具栏 */}
          <div className="p-3 border-b border-[#ede5d4] dark:border-[#2a2420] bg-stone-50/70 dark:bg-[#161412] flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={handleDistillInspirations}
              disabled={isDistillingInspirations || dialogueHistory.length === 0}
              className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-serif font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="提炼对戏中的金句台词与微表情动作"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDistillingInspirations ? '提炼中...' : '提炼全场灵感'}</span>
            </button>
            <button
              onClick={handleExportInspirations}
              disabled={inspirationNotes.length === 0}
              className="py-1.5 px-2.5 rounded-lg text-xs border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 text-[#554b3f] dark:text-[#c4baa8] flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              title="导出为 Markdown 灵感备忘录"
            >
              <Download className="w-3 h-3" />
              <span>导出</span>
            </button>
            {inspirationNotes.length > 0 && (
              <button
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: '清空灵感盒',
                    message: '确定清空本场的灵感便签吗？',
                    tone: 'danger',
                    confirmText: '清空便签',
                    cancelText: '取消',
                  });
                  if (confirmed) {
                    setInspirationNotes([]);
                    if (activeSession) {
                      api.updateSandboxSession({
                        id: activeSession.id,
                        inspiration_notes_json: '[]',
                      }).catch(console.error);
                    }
                  }
                }}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                title="清空灵感盒"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 分类过滤 Tab */}
          <div className="px-3 py-2 border-b border-[#ede5d4] dark:border-[#2a2420] flex items-center gap-1 text-[11px] overflow-x-auto shrink-0">
            {(
              [
                { key: 'ALL', label: '全部' },
                { key: 'QUOTE', label: '🔥 金句' },
                { key: 'ACTION', label: '🎭 动作' },
                { key: 'PSYCHOLOGY', label: '🧠 心理' },
                { key: 'TWIST', label: '🗝️ 破局' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setInspirationFilter(tab.key)}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  inspirationFilter === tab.key
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 灵感列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {inspirationNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400 text-xs space-y-1.5">
                <Lightbulb className="w-8 h-8 opacity-40 stroke-1 text-amber-500 mb-1" />
                <p className="font-serif text-[#4a4036] dark:text-[#d4cbbf]">灵感盒尚空</p>
                <p className="text-[11px] max-w-[200px] leading-relaxed text-[#8a7f73]">
                  在对戏中点击【灵感】或点击上方【提炼全场灵感】记录金句与动作
                </p>
              </div>
            ) : (
              inspirationNotes
                .filter((n) => inspirationFilter === 'ALL' || n.type === inspirationFilter)
                .map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#201c19] text-xs space-y-1.5 shadow-2xs group hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          n.type === 'QUOTE'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                            : n.type === 'ACTION'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : n.type === 'PSYCHOLOGY'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {n.type === 'QUOTE'
                          ? '🔥 金句'
                          : n.type === 'ACTION'
                          ? '🎭 动作'
                          : n.type === 'PSYCHOLOGY'
                          ? '🧠 心理'
                          : '🗝️ 破局'}
                      </span>
                      {n.speaker_name && (
                        <span className="font-serif text-[#665b4f] dark:text-[#b0a597]">
                          {n.speaker_name}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            handleInsertTextToEditor(n.content, '已将灵感插入正文！');
                          }}
                          className="p-1 hover:text-blue-600 rounded cursor-pointer"
                          title="插入小说正文"
                        >
                          <BookOpen className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(n.content);
                            showToast('已复制该灵感至剪贴板！', 'success');
                          }}
                          className="p-1 hover:text-amber-600 rounded cursor-pointer"
                          title="复制内容"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteInspiration(n.id)}
                          className="p-1 hover:text-rose-600 rounded cursor-pointer"
                          title="删除此便签"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="font-serif text-[#2b241c] dark:text-[#ece4d8] leading-relaxed whitespace-pre-wrap">
                      {n.content}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      {/* 🌿 开辟剧情推演分支弹窗 (What-If Branch Fork Modal) */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#38322c] bg-[#fdfbf7] dark:bg-[#181614] p-5 font-sans space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6decc] dark:border-[#2d2824]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm">开辟平行推演走向 (What-If)</h4>
                  <p className="text-[11px] text-[#8a7f73]">从指定节拍分叉，探索截然不同的因果抉择与戏剧高潮</p>
                </div>
              </div>
              <button
                onClick={() => setShowForkModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-[#201c19] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-1">
                  分叉节点：第 {forkFromIndex + 1} 节拍
                </span>
                {dialogueHistory[forkFromIndex] && (
                  <p className="mt-1 line-clamp-2 italic font-serif text-[11px] text-[#554c41] dark:text-[#b0a597]">
                    {dialogueHistory[forkFromIndex].speaker_name}: “{dialogueHistory[forkFromIndex].speech}”
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#7a6f62] dark:text-[#a09485] mb-1">
                  分支名称
                </label>
                <input
                  type="text"
                  value={forkBranchName}
                  onChange={(e) => setForkBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmFork()}
                  placeholder="分支名称，如：坦白解药所在 / 拔剑先发制人"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8cdb8] dark:border-[#3d3630] bg-white dark:bg-[#12100e] focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e6decc] dark:border-[#2d2824]">
              <button
                onClick={() => setShowForkModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-serif text-[#7a6f62] hover:bg-black/5"
              >
                取消
              </button>
              <button
                onClick={handleConfirmFork}
                disabled={!forkBranchName.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-serif font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 flex items-center gap-1 shadow-sm transition-all"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>开辟分支</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👗 角色立绘贴图与 AI 视觉外貌管理弹窗 */}
      {showActorVisualModal && selectedActorIndex !== null && actors[selectedActorIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border border-[#ded5c2] dark:border-[#38322c] bg-[#fbf9f5] dark:bg-[#1a1715] p-5 flex flex-col max-h-[90vh] overflow-hidden">
            {/* 顶栏 */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e6decc] dark:border-[#2d2824] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600/15 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Image className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#f0eae0] flex items-center gap-2">
                    <span>【{actors[selectedActorIndex].character_name}】立绘与外貌</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                      {modalGender}
                    </span>
                  </h4>
                  <p className="text-[10px] text-[#857767]">
                    上传立绘或输入外貌特征，作为对戏微动作与正文白描的物理下锚点
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActorVisualModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 min-h-0 text-xs">
              {/* 立绘上传与预览区 */}
              <div>
                <label className="block text-[11px] font-serif font-bold text-[#443b33] dark:text-[#d5ccbe] mb-1.5">
                  角色立绘 / 形象贴图
                </label>

                {modalAvatarUrl ? (
                  <div className="relative rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={modalAvatarUrl}
                        alt="立绘预览"
                        onClick={() => setLightboxImageUrl(modalAvatarUrl)}
                        className="w-32 h-40 sm:w-36 sm:h-44 rounded-xl object-cover border-2 border-amber-600/40 shadow-md cursor-zoom-in bg-surface-2 transition-transform hover:scale-[1.02]"
                        title="点击查看高清全景大图"
                      />
                      <div
                        onClick={() => setLightboxImageUrl(modalAvatarUrl)}
                        className="absolute inset-0 bg-black/35 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] cursor-zoom-in font-sans"
                      >
                        <span>🔍 放大查看</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                        <Check className="w-4 h-4" /> 立绘图片已载入
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed truncate max-w-xs">
                        {modalAvatarUrl.startsWith('data:') ? '已载入本地立绘文件 (Base64)' : modalAvatarUrl}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setLightboxImageUrl(modalAvatarUrl)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-serif border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🔍 查看全景大图</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => actorFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded text-[10px] border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                        >
                          更换图片
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAvatarGenModal(true)}
                          className="px-2.5 py-1 rounded text-[10px] border border-amber-600/40 bg-amber-500/10 text-primary dark:text-amber-300 font-medium hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>AI 生成立绘</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalAvatarUrl('')}
                          className="px-2.5 py-1 rounded text-[10px] text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          清除立绘
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#d8cdb8] dark:border-[#3d3630] rounded-xl p-4 text-center bg-[#fdfbf7] dark:bg-[#151311] space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-300 font-serif">
                      选择角色本地立绘插画或粘贴图片直链
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => actorFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-serif font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>选择本地图片</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAvatarGenModal(true)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-serif font-bold border border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-primary dark:text-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>✨ AI 生成立绘</span>
                      </button>
                    </div>
                    <div className="pt-2">
                      <input
                        type="text"
                        value={modalAvatarUrl}
                        onChange={(e) => setModalAvatarUrl(e.target.value)}
                        placeholder="或粘贴网络图片直链 (https://...)"
                        className="w-full text-[10px] px-2.5 py-1.5 rounded-lg border border-[#e0d6c2] dark:border-[#38312a] bg-white dark:bg-[#201c18] outline-none"
                      />
                    </div>
                  </div>
                )}
                <input
                  ref={actorFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleActorFileChange}
                  className="hidden"
                />
              </div>

              {/* 👁️ AI 识图操作按钮 */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-serif font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI 识图</span>
                  </div>
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    自动提炼发饰、衣着与武器配饰，生成文学级外貌描写
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeActorAppearance}
                  disabled={!modalAvatarUrl || isAnalyzingActorVisual}
                  className="px-3 py-1.5 rounded-lg text-xs font-serif font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  {isAnalyzingActorVisual ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>识图中...</span>
                    </>
                  ) : (
                    <>
                      <span>👁️ AI 识图</span>
                    </>
                  )}
                </button>
              </div>

              {/* 识别出的外貌标签 */}
              {modalAppearanceTags.length > 0 && (
                <div>
                  <label className="block text-[10px] font-serif text-[#857767] mb-1">
                    AI 提取的特征标签
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {modalAppearanceTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 人设外貌与视觉特征描摹 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-serif font-bold text-[#443b33] dark:text-[#d5ccbe]">
                    外貌描摹（注入微动作与白描）
                  </label>
                  <span className="text-[10px] text-stone-400">
                    可手动调整
                  </span>
                </div>
                <textarea
                  value={modalVisualSummary}
                  onChange={(e) => setModalVisualSummary(e.target.value)}
                  rows={4}
                  placeholder="例：墨发高束，身披玄黑金纹劲装，眉如寒星，眸光深邃而带着不可轻犯的锋芒。腰间悬挂一柄乌木长剑，举手投足间带着冷峻的肃杀之气..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] text-[#2c2621] dark:text-[#e8e2d8] focus:border-amber-600 outline-none resize-none leading-relaxed"
                />
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-normal">
                  💡 提示：此处描写的衣着佩饰将作为该角色发言微动作的下锚基准。
                </p>
              </div>

              {/* 同步保存至角色库选项 */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#554b3f] dark:text-[#c4baa8]">
                  <input
                    type="checkbox"
                    checked={syncToNovelDb}
                    onChange={(e) => setSyncToNovelDb(e.target.checked)}
                    className="rounded border-[#ded5c2] text-amber-700 focus:ring-0 cursor-pointer"
                  />
                  <span>同步更新至小说人物设定库</span>
                </label>
              </div>
            </div>

            {/* 底栏按钮 */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e6decc] dark:border-[#2d2824] shrink-0">
              <button
                type="button"
                onClick={() => setShowActorVisualModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-serif text-[#7a6f62] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveActorVisual}
                className="px-4 py-1.5 rounded-lg text-xs font-serif font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>应用外貌设定</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 互联网 P2P 联机创作弹窗 */}
      <Suspense fallback={null}>
        {showCollabModal && (
          <CollaborationModal
            isOpen={showCollabModal}
            onClose={() => setShowCollabModal(false)}
          />
        )}
      </Suspense>

      {/* 📚 导入书本与设定弹窗 */}
      <SandboxImportBibleModal
        isOpen={showImportBibleModal}
        onClose={() => setShowImportBibleModal(false)}
        activeNovel={activeNovel}
        currentActors={actors}
        onImportContext={handleImportContext}
      />

      {/* 🔌 服务商与 API 管理弹窗 */}
      <Suspense fallback={null}>
        {showSettingsModal && (
          <SettingsModal
            onClose={handleCloseSettingsModal}
            initialTab="MODEL"
          />
        )}
      </Suspense>

      {/* 🔍 高清立绘全景大图灯箱模态框 */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 animate-in fade-in duration-150 cursor-zoom-out"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImageUrl}
              alt="立绘全景大图"
              className="max-h-[85vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-white/80 font-serif">
                立绘全景大图预览 · 点击遮罩或按右上角关闭
              </span>
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-serif transition-colors cursor-pointer"
              >
                关闭大图
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-3.5 -right-3.5 p-2 rounded-full bg-black/80 hover:bg-black text-white shadow-xl cursor-pointer transition-transform hover:scale-110 border border-white/25"
              title="关闭大图"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 角色立绘 AI 创绘模态框 */}
      {showAvatarGenModal && (
        <CharacterAvatarModal
          isOpen={showAvatarGenModal}
          onClose={() => setShowAvatarGenModal(false)}
          character={{
            name: selectedActorIndex !== null && actors[selectedActorIndex] ? actors[selectedActorIndex].character_name : '演练角色',
            gender: modalGender,
            visual_summary: modalVisualSummary,
            avatar_url: modalAvatarUrl,
          }}
          genre={activeNovel?.genre_profile}
          onApplyAvatar={(newUrl) => {
            setModalAvatarUrl(newUrl);
            showToast('已生成新立绘！点击【应用并保存】即可写入演练角色', 'success');
          }}
        />
      )}
    </div>
  );
};
