import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { useToastStore } from '@/stores/useToastStore';
import { api } from '@/utils/tauriBridge';
import type {
  Character,
  AiProvider,
  AiModel,
  CharacterActorConfig,
  DialogueRoundRecord,
  CharacterSandboxSession,
  SandboxBranch,
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
  Settings2,
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
} from 'lucide-react';
import { useCollaborationStore } from '@/stores/useCollaborationStore';
import { CollaborationModal } from '@/components/collaboration/CollaborationModal';
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
  const { activeNovel, activeChapter, updateEditorContent, editorContent, saveCurrentChapter } = useNovelStore();
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

  // 运行控制
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [autoRunRoundsRemaining, setAutoRunRoundsRemaining] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedProse, setSynthesizedProse] = useState('');
  const [showConfig, setShowConfig] = useState(true);
  const [showSynthesizedModal, setShowSynthesizedModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);
  const [isImportingDemo, setIsImportingDemo] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);

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

  // 卸载保护：防止后台异步循环在组件销毁后继续跑
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
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

  // 智能滚动处理：只有用户停留在底部附近才强制自动滑行，否则保留视角并提示有新台词
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsScrolledUp(!isNearBottom);
    if (isNearBottom) {
      setUnreadRoundsCount(0);
    }
  };

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

  // 计算当前下一位发言人与是否为人身亲演
  const nonNarratorRounds = dialogueHistory.filter((r) => !r.is_narrator_event);
  const nextActorIndex = actors.length > 0 ? nonNarratorRounds.length % actors.length : 0;
  const nextSpeaker = actors[nextActorIndex] || null;
  const isHumanTurn = nextSpeaker?.is_human === true;

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (showNarratorInput && narratorInput.trim()) {
          handleInsertNarrator();
        } else if (isHumanTurn && humanSpeech.trim()) {
          handleHumanSubmit();
        } else if (!isRunning && actors.length > 0) {
          executeStep();
        }
        return;
      }

      if (e.key === 'Escape') {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showNarratorInput,
    narratorInput,
    isRunning,
    actors.length,
    editingRoundIndex,
    showSessionDropdown,
    showExportMenu,
    showSpeakerPicker,
    isHumanTurn,
    humanSpeech,
    nextSpeaker,
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
      setActors(parsedActors);
      setDialogueHistory(parsedHistory);
      setSynthesizedProse(sess.synthesized_prose || '');
      setBranches(parsedBranches);

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
    if (!confirm('确定删除该场对戏记录吗？此操作不可逆。')) return;
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
  };

  // 更新角色字段
  const updateActorField = (index: number, field: keyof CharacterActorConfig, val: any) => {
    const copy = [...actors];
    copy[index] = { ...copy[index], [field]: val };
    setActors(copy);
  };

  // 单步推演 (Step)
  const executeStep = async (narratorText?: string, targetSpeakerId?: string): Promise<boolean> => {
    if (!activeNovel) return false;
    if (actors.length === 0) {
      showToast('请至少配置一名出场角色', 'warning');
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
    }

    try {
      const res = await api.executeSandboxStep({
        session_id: sessionId,
        narrator_intervention: narratorText,
        target_speaker_id: targetSpeakerId,
      });

      const fresh = await api.getSandboxSession(sessionId);
      if (fresh) {
        loadSession(fresh);
      }
      if (res.round && collabStatus === 'CONNECTED') {
        sendSandboxRound(res.round);
      }
      return !res.is_completed;
    } catch (err: any) {
      showToast(`推演中断: ${err.message || err}`, 'error');
      return false;
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

  // 连续自动推演
  const handleStartAuto = async () => {
    if (isRunningRef.current) {
      isRunningRef.current = false;
      setIsRunning(false);
      showToast('已暂停推演', 'info');
      return;
    }
    isRunningRef.current = true;
    setIsRunning(true);
    let rounds = 6;
    setAutoRunRoundsRemaining(rounds);

    while (rounds > 0 && isRunningRef.current) {
      const canContinue = await executeStep();
      if (!isRunningRef.current) break;
      rounds--;
      setAutoRunRoundsRemaining(rounds);
      if (!canContinue || rounds <= 0) break;
      await new Promise((r) => setTimeout(r, 600));
    }
    const wasStopped = !isRunningRef.current;
    isRunningRef.current = false;
    setIsRunning(false);
    setAutoRunRoundsRemaining(0);
    if (!wasStopped) {
      showToast('对手戏推演完成！', 'success');
    }
  };

  // 重掷最新一轮台词 (Re-roll)
  const handleRerollLatestRound = async () => {
    if (dialogueHistory.length === 0 || isRunning) return;
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
    if (!window.confirm(`确定要删除分支【${target?.name || branchId}】吗？此操作无法撤销。`)) return;

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
    if (!confirm('确定清空当前对戏记录吗？角色秘密、动机与场景设定将予以保留。')) return;
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
    showToast('已清空对戏实录，可重新开场！', 'success');
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

  // 提取为灵感备忘
  const handleSavePlotNote = (round: DialogueRoundRecord) => {
    const note = `【对戏灵感 · ${round.speaker_name}】（${round.character_action || '神色如常'}）“${round.speech}”\n[对戏场景：《${sessionTitle}》]`;
    navigator.clipboard.writeText(note);
    showToast(`已提取【${round.speaker_name}】此节拍为灵感备忘至剪贴板！`, 'success');
  };

  // 插入旁白/天意变故
  const handleInsertNarrator = async () => {
    if (!narratorInput.trim()) return;
    await executeStep(narratorInput.trim());
    setNarratorInput('');
    setShowNarratorInput(false);
  };

  // 一键转译小说正文
  const handleSynthesizeProse = async () => {
    if (!activeSession) return;
    if (dialogueHistory.length === 0) {
      showToast('暂无对话记录，请先步进推演几轮对手戏', 'warning');
      return;
    }
    setIsSynthesizing(true);
    try {
      const res = await api.synthesizeSandboxProse({
        session_id: activeSession.id,
      });
      setSynthesizedProse(res.synthesized_prose);
      setShowSynthesizedModal(true);
      showToast(`小说正文转译完成，共 ${res.word_count} 字`, 'success');
    } catch (err: any) {
      showToast(`合成失败: ${err.message || err}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 成果采纳：追加到当前正文
  const handleAppendToEditor = () => {
    if (!synthesizedProse) return;
    const nextContent = editorContent ? `${editorContent}\n\n${synthesizedProse}` : synthesizedProse;
    updateEditorContent(nextContent);
    saveCurrentChapter(true, 'SANDBOX_PROSE_APPEND');
    showToast('已追加至当前章节末尾并留存快照备份！', 'success');
    setShowSynthesizedModal(false);
  };

  // 成果采纳：替换当前正文
  const handleReplaceEditor = () => {
    if (!synthesizedProse) return;
    if (!confirm('确定将转译正文替换当前章节全部内容吗？系统会自动在版本抽屉留存备份。')) return;
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

  return (
    <div className="w-full h-full flex flex-col bg-[#fdfbf7] dark:bg-[#181614] text-[#2c2621] dark:text-[#e8e2d8] select-none overflow-hidden font-sans">
      {/* 顶栏 */}
      <div className="h-14 px-4 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7]/90 dark:bg-[#201c19]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base tracking-wide">角色对戏演武场</h2>
              
              {/* 会话切换器下拉 */}
              <div className="relative">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-[#e0d6c3] dark:border-[#38312a] bg-white/70 dark:bg-[#201c19]/70 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-medium transition-colors"
                  title="切换或新建对戏沙盒"
                >
                  <span className="max-w-[130px] truncate text-amber-900 dark:text-amber-300">
                    {sessionTitle || '选择对戏会话'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a7f73]" />
                </button>

                {showSessionDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#1e1b18] rounded-xl shadow-xl border border-[#ded5c2] dark:border-[#38322c] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
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

                    <div className="max-h-56 overflow-y-auto py-1">
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

              {/* 实时戏剧张力胶囊 */}
              {dialogueHistory.length > 0 && (
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${currentTension.colorClass}`}>
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>张力: {currentTension.label} ({currentTension.level}/10)</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#8a7f73] dark:text-[#9e9284]">
              零心理同质化 · 战争迷雾独立心路 (CoT) · 经典情境一键排练
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* 互联网 P2P 联机对戏 */}
          <button
            onClick={() => setShowCollabModal(true)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition-colors ${
              collabStatus === 'CONNECTED'
                ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium'
                : 'bg-stone-200/40 dark:bg-stone-800/40 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5'
            }`}
            title="开启/管理 6 位房间码 P2P 互联网异地联机对戏"
          >
            <Globe className={`w-3.5 h-3.5 ${collabStatus === 'CONNECTED' ? 'text-emerald-600 animate-pulse' : ''}`} />
            <span>{collabStatus === 'CONNECTED' ? `P2P 联机中 (${collabRoomCode})` : '🌐 联机对戏'}</span>
          </button>

          {/* 上帝视角开关 */}
          <button
            onClick={() => setShowPrivateThoughts(!showPrivateThoughts)}
            title={showPrivateThoughts ? '隐藏内心算盘' : '展开内心算盘'}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition-all ${
              showPrivateThoughts
                ? 'bg-amber-600/10 border-amber-600/30 text-amber-800 dark:text-amber-300 font-medium'
                : 'bg-stone-200/50 dark:bg-stone-800/40 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            {showPrivateThoughts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showPrivateThoughts ? '上帝视角 (内心戏)' : '观众视角 (纯台词)'}</span>
          </button>

          {/* 潜台词透视开关 */}
          <button
            onClick={() => setShowSubtext(!showSubtext)}
            title={showSubtext ? '隐藏潜台词透视' : '开启潜台词透视'}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition-all ${
              showSubtext
                ? 'bg-purple-600/10 border-purple-500/30 text-purple-800 dark:text-purple-300 font-medium'
                : 'bg-stone-200/50 dark:bg-stone-800/40 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{showSubtext ? '潜台词透视' : '潜台词 (关)'}</span>
          </button>

          {/* 导出菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={dialogueHistory.length === 0}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出剧本</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#201c19] rounded-xl shadow-xl border border-[#ded5c2] dark:border-[#38322c] py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleExportScript}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>导出为戏剧对白脚本 (.txt)</span>
                </button>
                <button
                  onClick={handleExportRehearsalMarkdown}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>导出上帝视角排练纪要 (.md)</span>
                </button>
              </div>
            )}
          </div>

          {/* 设置抽屉折叠 */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 text-xs rounded-lg border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="折叠/展开演武场情境与阵容"
          >
            <Settings2 className="w-4 h-4 text-[#73685d] dark:text-[#a89d91]" />
          </button>

          {/* 转译正文 */}
          <button
            onClick={handleSynthesizeProse}
            disabled={dialogueHistory.length === 0 || isSynthesizing}
            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSynthesizing ? '转译合成中...' : '转译小说正文'}</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#73685d]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* 左侧：沙盒情境与角色人设面板 */}
        {showConfig && (
          <div className="w-80 md:w-96 border-r border-[#e6decc] dark:border-[#2d2824] bg-[#fbf8f0] dark:bg-[#1c1916] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
            
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
                    className="w-full px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isImportingDemo ? '正在导入示范角色...' : '一键导入示范角色 (林渊 vs 洛清雪)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 经典情境模板一键载入 */}
            <div className="bg-white/70 dark:bg-black/20 p-3 rounded-xl border border-[#e8e0ce] dark:border-[#322c27] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> 经典情境模板库 (6大高冲突戏)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SANDBOX_PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => applyPresetTemplate(tmpl)}
                    className="p-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-center transition-all group"
                  >
                    <span className="text-sm block mb-0.5">{tmpl.icon}</span>
                    <span className="text-[10px] font-serif block truncate text-[#4a4036] dark:text-[#c4baa8] group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      {tmpl.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 场景与目标 */}
            <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-[#e8e0ce] dark:border-[#322c27] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> 场景与交锋目标
                </span>
                <div className="flex items-center gap-2">
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
                    onClick={handleSaveSession}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                  >
                    保存演武场
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
                <label className="text-[11px] text-[#8a7f73] dark:text-[#9e9284] block mb-1">物理环境描写</label>
                <textarea
                  rows={2}
                  value={sceneSetting}
                  onChange={(e) => setSceneSetting(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                  placeholder="例如：深夜书房，窗外风雪大作，案上灯花爆裂..."
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8a7f73] dark:text-[#9e9284] block mb-1">冲突目标与戏剧节拍</label>
                <textarea
                  rows={2}
                  value={sceneGoal}
                  onChange={(e) => setSceneGoal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#141210] focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                  placeholder="本场戏的核心矛盾、试探目标与结局走向..."
                />
              </div>
            </div>

            {/* 出场角色列表 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-serif font-bold text-[#4a4036] dark:text-[#d4cbbf] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 出场阵容 ({actors.length})
                  </span>
                  {actors.length >= 2 && (
                    <button
                      onClick={handleSwapActors}
                      title="互换双方攻守位置"
                      className="p-1 text-[#8a7f73] hover:text-amber-700 transition-colors"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 下拉添加角色 */}
                {characters.length > actors.length && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddActor(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="text-[11px] px-2 py-1 rounded border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] text-[#5c5044] dark:text-[#c4baa8] outline-none"
                  >
                    <option value="" disabled>
                      + 挑选小说角色...
                    </option>
                    {characters
                      .filter((c) => !actors.some((a) => a.character_id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {actors.map((actor, idx) => (
                <div
                  key={actor.character_id}
                  className="p-3 rounded-xl bg-white/70 dark:bg-[#141210]/60 border border-[#e8e0ce] dark:border-[#322c27] space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-400 font-serif font-bold text-xs flex items-center justify-center">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-serif font-bold text-xs text-[#2c2621] dark:text-[#e8e2d8]">
                        {actor.character_name}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 font-mono">
                          先手方
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {actors.length > 2 && (
                        <button
                          onClick={() => handleRemoveActor(idx)}
                          className="p-1 text-[#a39788] hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 扮演模式选择：AI 子代理 vs 作者亲演 */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#efe9dc] dark:bg-[#201c18] border border-[#e0d6c2] dark:border-[#38312a] text-[10px]">
                    <button
                      type="button"
                      onClick={() => updateActorField(idx, 'is_human', false)}
                      className={`flex-1 py-1 rounded text-center transition-all ${
                        !actor.is_human
                          ? 'bg-white dark:bg-[#2b2521] text-amber-900 dark:text-amber-300 shadow-2xs font-bold'
                          : 'text-[#8a7f73] hover:text-[#4a4036]'
                      }`}
                    >
                      🤖 AI 子代理驱动
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActorField(idx, 'is_human', true)}
                      className={`flex-1 py-1 rounded text-center transition-all ${
                        actor.is_human
                          ? 'bg-amber-700 text-white shadow-2xs font-bold'
                          : 'text-[#8a7f73] hover:text-[#4a4036]'
                      }`}
                    >
                      👤 作者亲演
                    </button>
                  </div>

                  {actor.is_human ? (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      🎭 <strong>作者亲演接管中</strong>：轮到该角色时由您亲自输入微表情动作与正面对白，AI 对手将根据您的实时言辞作出独立反击！
                    </div>
                  ) : (
                    /* 绑定模型选择 */
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#8a7f73] block mb-0.5">服务商</label>
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
                      当场私密动机 (私密CoT，绝不泄漏)
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
                      隐藏秘密与软肋 (绝不外露)
                    </label>
                    <input
                      type="text"
                      value={actor.private_secret}
                      onChange={(e) => updateActorField(idx, 'private_secret', e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded border border-[#e2d9c5] dark:border-[#3a332d] bg-white dark:bg-[#1c1916] focus:ring-1 focus:ring-amber-500 outline-none"
                      placeholder="他身上藏着的绝密后手或不能提的往事"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

            {/* 开辟分支按钮 */}
            <button
              onClick={() => handleOpenForkModal(dialogueHistory.length > 0 ? dialogueHistory.length - 1 : 0)}
              disabled={dialogueHistory.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-serif border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1 shrink-0 transition-colors"
              title="从当前最新轮次开辟新的平行走向分支"
            >
              <Plus className="w-3 h-3" />
              <span>开辟新分支</span>
            </button>
          </div>
          {/* 对话消息滚动流 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4"
          >
            {/* 开场环境卡片 */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 font-serif leading-relaxed">
              <span className="font-bold mr-1">【舞台起幕】</span>
              {sceneSetting}
            </div>

            {dialogueHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#998d7f] dark:text-[#7d7265] space-y-2">
                <Swords className="w-10 h-10 opacity-30 stroke-1" />
                <p className="text-sm font-serif">舞台就绪，角色已各怀鬼胎。</p>
                <p className="text-xs">点击下方【步进一轮 (Step)】或【连续推演 (Auto)】，观摩角色独立思考与唇枪舌剑！</p>
                <p className="text-[11px] text-[#a89d91]">快捷提示：支持按 <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">Ctrl+Enter</kbd> 极速步进</p>
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

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isEven ? 'items-start' : 'items-end'} max-w-2xl ${
                      isEven ? 'mr-auto' : 'ml-auto'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
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
                              <Eye className="w-3 h-3" /> 私密内心独白 (对他人完全屏蔽)
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
                                title="一键复制本句台词与神态"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制本句</span>
                              </button>

                              <button
                                onClick={() => handleSavePlotNote(round)}
                                className="text-[11px] text-[#8a7e70] hover:text-amber-700 flex items-center gap-1 transition-colors"
                                title="提取此句台词与机锋为创作灵感备忘"
                              >
                                <Lightbulb className="w-3 h-3 text-amber-600" />
                                <span>提取灵感</span>
                              </button>

                              <button
                                onClick={() => handleOpenForkModal(idx)}
                                className="text-[11px] text-[#8a7e70] hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                title="以此回合为节点开辟新的平行走向分支"
                              >
                                <GitBranch className="w-3 h-3 text-emerald-600" />
                                <span>开辟分支</span>
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
                                  <span>换个说法 (重掷)</span>
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
                                <Edit2 className="w-3 h-3" /> 原地改词
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
          {isHumanTurn && !isRunning && (
            <div className="p-3 bg-amber-50/95 dark:bg-amber-950/50 border-t border-amber-300 dark:border-amber-800/60 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-amber-900 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>🎭 轮到您亲身演绎【{nextSpeaker?.character_name}】发难/接招：</span>
                </div>
                <button
                  onClick={() => executeStep()}
                  className="text-[11px] text-[#8a7f73] hover:text-amber-700 hover:underline transition-colors"
                >
                  临时委托 AI 替我发言一次
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
                    正面对白台词 * (Enter / Ctrl+Enter 发射)
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
                      <Send className="w-3.5 h-3.5" /> 发射对白
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 底部控制栏 */}
          <div className="h-16 px-4 border-t border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7]/90 dark:bg-[#201c19]/90 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8a7f73] dark:text-[#9e9284]">
                累计对戏: <strong className="text-[#2c2621] dark:text-[#e8e2d8]">{dialogueHistory.length}</strong> 轮
              </span>

              {/* 清空重来按钮 */}
              {dialogueHistory.length > 0 && (
                <button
                  onClick={handleResetDialogue}
                  disabled={isRunning}
                  className="text-xs text-[#8a7f73] hover:text-rose-600 flex items-center gap-1 transition-colors"
                  title="清空当前对戏记录，保留角色秘密重新推演"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>清空重开</span>
                </button>
              )}

              {isRunning && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium animate-pulse">
                  连续推演中... 剩余 {autoRunRoundsRemaining} 轮
                </span>
              )}

              <span className="hidden lg:inline text-[11px] text-[#a89d91]">
                (Ctrl+Enter 步进 · Esc 取消)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 指定发言人下拉浮窗 */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeakerPicker(!showSpeakerPicker)}
                  disabled={isRunning || actors.length === 0}
                  className="px-2.5 py-2 text-xs rounded-xl border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium flex items-center gap-1 disabled:opacity-40 transition-colors"
                  title="指定由哪位角色主动发言发难"
                >
                  <span>指定发言人</span>
                  <ChevronDown className="w-3 h-3 text-[#8a7f73]" />
                </button>

                {showSpeakerPicker && (
                  <div className="absolute bottom-full mb-1.5 left-0 w-48 bg-white dark:bg-[#1e1b18] rounded-xl shadow-xl border border-[#ded5c2] dark:border-[#38322c] py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] text-[#8a7f73] border-b border-[#eee7d8] dark:border-[#2e2823] font-bold">
                      让指定角色主动发起攻势
                    </div>
                    {actors.map((a) => (
                      <button
                        key={a.character_id}
                        onClick={() => {
                          setShowSpeakerPicker(false);
                          executeStep(undefined, a.character_id);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-between"
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

              {/* 插入旁白变故 */}
              <button
                onClick={() => setShowNarratorInput(!showNarratorInput)}
                className="px-3 py-2 text-xs rounded-xl border border-[#ded5c2] dark:border-[#38322c] hover:bg-black/5 dark:hover:bg-white/5 font-medium flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>插入旁白/天意</span>
              </button>

              {/* 步进一轮 */}
              <button
                onClick={() => executeStep()}
                disabled={isRunning || actors.length === 0}
                className="px-3.5 py-2 text-xs rounded-xl border border-amber-600/40 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-2xs"
                title="步进一轮 (Ctrl+Enter)"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>步进一轮 (Step)</span>
              </button>

              {/* 连续自动推演 */}
              <button
                onClick={handleStartAuto}
                disabled={actors.length === 0}
                className={`px-4 py-2 text-xs rounded-xl text-white font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                  isRunning
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-amber-700 hover:bg-amber-800 disabled:opacity-40'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? '暂停推演' : '连续推演 (Auto)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 小说正文转译成果弹窗 */}
      {showSynthesizedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#3a332d] bg-[#fbf9f5] dark:bg-[#1a1715] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#e8dfcb] dark:border-[#2d2824] flex items-center justify-between bg-[#f4efe4] dark:bg-[#201c19]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-serif font-bold text-sm">小说正文转译成果 (Prose Synthesis)</h3>
              </div>
              <button
                onClick={() => setShowSynthesizedModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto font-serif text-sm md:text-base leading-relaxed text-[#231f1a] dark:text-[#f0eae0] space-y-4 whitespace-pre-wrap select-text">
              {synthesizedProse}
            </div>

            <div className="px-5 py-3.5 border-t border-[#e8dfcb] dark:border-[#2d2824] bg-[#f4efe4] dark:bg-[#201c19] flex items-center justify-between">
              <span className="text-xs text-[#8a7f73]">
                字数：{synthesizedProse.replace(/\s+/g, '').length} 字
              </span>
              <div className="flex items-center gap-2">
                {/* 反哺长期记忆 */}
                <button
                  onClick={handleSyncToMemoryEngine}
                  className="px-3 py-1.5 text-xs rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> 反哺长期记忆
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(synthesizedProse);
                    showToast('已复制转译小说正文至剪贴板', 'success');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#ded5c2] dark:border-[#3a332d] hover:bg-black/5 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> 复制正文
                </button>
                <button
                  onClick={handleSaveAsProposal}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-amber-600/50 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> 暂存为候选提案
                </button>
                <button
                  onClick={handleReplaceEditor}
                  className="px-3 py-1.5 text-xs rounded-lg border border-rose-600/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-medium transition-colors"
                >
                  替换章节正文
                </button>
                <button
                  onClick={handleAppendToEditor}
                  className="px-4 py-1.5 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" /> 追加到正文末尾
                </button>
              </div>
            </div>
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
                  分叉起点：第 {forkFromIndex + 1} 轮
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
                  placeholder="例如：分支A：坦白解药所在 / 分支B：拔剑先发制人"
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
                <span>确认开辟分支</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 互联网 P2P 联机创作弹窗 */}
      <CollaborationModal
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
      />
    </div>
  );
};
