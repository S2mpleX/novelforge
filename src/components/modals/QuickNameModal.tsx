import React, { useState, useMemo } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  Wand2,
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  UserPlus,
  BookMarked,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryConfig {
  key: string;
  label: string;
  subtypes: string[];
  placeholder: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: '人物',
    label: '角色人物',
    subtypes: ['主角', '反派', '女性角色', '长辈宿老', '生死同伴', '关键配角'],
    placeholder: '如：外冷内热，背负家族血仇，执掌核心机密...',
  },
  {
    key: '地点',
    label: '地理地点',
    subtypes: ['都城要塞', '自然险地', '宗门洞府', '星际空港', '避难所基地'],
    placeholder: '如：终年积雪，极寒深渊，地势险要，重兵把守...',
  },
  {
    key: '势力',
    label: '势力阵营',
    subtypes: ['隐世仙宗', '星际财阀', '人间神朝', '跨国集团', '地下公会', '武装同盟'],
    placeholder: '如：行事隐秘，亦正亦邪，垄断核心能源与情报...',
  },
  {
    key: '招式',
    label: '异能战技',
    subtypes: ['无上剑诀', '纳米协议', '超频战技', '玄门内功', '禁咒魔导', '暗杀枪术'],
    placeholder: '如：招式凌厉，一击封喉，引动量子坍缩或九天雷火...',
  },
  {
    key: '装备',
    label: '装备器物',
    subtypes: ['通灵神兵', '单兵机甲', '外骨骼战甲', '高科义体', '古代秘宝', '战术目镜'],
    placeholder: '如：通体乌黑，吸食暗能，搭载微型曲率发生器...',
  },
  {
    key: '怪物',
    label: '生灵异种',
    subtypes: ['太古凶兽', '辐射畸变', '硅基异类', '深渊魔种', '仿生机兽'],
    placeholder: '如：盘踞万丈深渊，吞食精气能源，外骨骼如合金...',
  },
  {
    key: '道具',
    label: '道具补给',
    subtypes: ['破阶灵丹', '战地血清', '神经修复液', '天机秘卷', '高维钥匙'],
    placeholder: '如：可突破生理极限，带有强烈神经毒性副作用...',
  },
];

const STYLES = ['中式古典/玄幻', '硬核科幻/赛博', '近现代/都市', '冷冽仙侠'];
const LENGTHS = ['不限字数', '双字', '三字', '四字'];

// 离线高质多流派词根库 (0-Token 秒级即时推演)
const LOCAL_BANKS: Record<string, Record<string, { prefixes: string[]; stems: string[]; suffixes: string[] }>> = {
  '硬核科幻/赛博': {
    人物: {
      prefixes: ['柯', '雷', '莫', '陈', '林', '艾', '诺', '夏', '维', '凯', '零', '简', '黑泽', '西泽', '伊恩'],
      stems: ['温特', '维克', '斯特', '莱恩', '零度', '逆流', '信标', '星芒', '极客', '渡鸦', '矩阵', '骇客', '寒川'],
      suffixes: ['工程师', '专员', '特工', '行者', '先锋'],
    },
    地点: {
      prefixes: ['黑石', '苍穹', '静海', '泰坦', '第七区', '阿尔法', '新霓虹', '深空', '柯伊伯', '暗面'],
      stems: ['轨道城', '方舟号', '空间站', '走廊', '空港', '核心区', '矿区', '母舰', '实验室', '观测站', '避难所'],
      suffixes: ['基站', '前哨', '据点', '中继港', '特区'],
    },
    势力: {
      prefixes: ['黑石', '泛亚', '环球', '深空', '神经', '钛金', '赛博', '方舟', '星穹', '极光', '轨道'],
      stems: ['重工', '联合体', '理事会', '开拓团', '防务', '同盟', '生命科学', '财阀', '网络', '学会', '工业'],
      suffixes: ['分部', '执行局', '防线', '议会'],
    },
    招式: {
      prefixes: ['战术', '超频', '纳米', '量子', '神经', '重力', '脉冲', '重组', '相位', '折叠', '热能'],
      stems: ['协议', '超载', '过载', '闪击', '侵蚀', '矩阵', '崩解', '校准', '断线', '反冲', '跃迁'],
      suffixes: ['指令', '模块', '阵列', '算法', '程序'],
    },
    装备: {
      prefixes: ['高斯', '等离子', '外骨骼', '动力', '全息', '电磁', '纳米', '虚数', '声波', '相位'],
      stems: ['步枪', '光刃', '战甲', '终端', '目镜', '护盾', '发射器', '手套', '推进器', '芯片', '核心'],
      suffixes: ['原型机', '改型', '强化件', '装置'],
    },
    怪物: {
      prefixes: ['辐射', '机械', '异化', '硅基', '突变', '仿生', '噬能', '生化', '裂变', '虚空'],
      stems: ['母体', '猎手', '构造体', '爬行者', '主脑', '畸变体', '工蜂', '巡游者', '蠕虫'],
      suffixes: ['核心', '变种', '原生体', '首脑'],
    },
    道具: {
      prefixes: ['神经', '战地', '基因', '纳米', '能量', '抗辐', '增幅', '高纯', '聚合'],
      stems: ['血清', '药剂', '修复液', '抑制剂', '电池', '电容', '解码器', '催化剂', '培养基'],
      suffixes: ['针剂', '胶囊', '模块'],
    },
  },
  '近现代/都市': {
    人物: {
      prefixes: ['陆', '顾', '江', '程', '周', '盛', '贺', '傅', '沈', '季', '霍', '严', '赵', '许', '宋'],
      stems: ['谨言', '怀安', '知行', '明诚', '景琛', '予安', '时雨', '若谷', '崇光', '远舟', '成峰', '少卿'],
      suffixes: ['先生', '律师', '顾问', '队长', '总裁'],
    },
    地点: {
      prefixes: ['望海', '滨江', '云顶', '金茂', '枫桥', '栖霞', '港岛', '老街', '外滩', '金融城', '临江'],
      stems: ['大厦', '庄园', '公馆', '天际线', '弄堂', '会所', '俱乐部', '半岛', '码头', '老洋房'],
      suffixes: ['壹号', '公馆', '特区', '园区'],
    },
    势力: {
      prefixes: ['盛世', '远洋', '鼎丰', '君和', '天盛', '华信', '启明', '嘉和', '恒生', '安邦', '宏图'],
      stems: ['集团', '资本', '律所', '投行', '俱乐部', '商会', '医疗', '控股', '实业', '基金会'],
      suffixes: ['总部', '总舵', '分社'],
    },
    招式: {
      prefixes: ['近身', '军警', '十字', '速射', '擒拿', '锁喉', '借力', '突击', '防暴'],
      stems: ['摔投', '枪法', '截击', '压制', '格斗术', '反关节', '快拔', '突刺'],
      suffixes: ['连环', '要诀', '套路'],
    },
    装备: {
      prefixes: ['定制', '特种', '微型', '防弹', '消音', '便携', '暗藏', '战术'],
      stems: ['手枪', '风衣', '军刀', '腕表', '录音笔', '公文箱', '窃听器', '防刺服'],
      suffixes: ['套装', '升级版'],
    },
    怪物: {
      prefixes: ['黑市', '斗犬', '暗夜', '疯血', '杂交', '地宫'],
      stems: ['藏獒', '猛兽', '疯犬', '斗牛', '毒蟒'],
      suffixes: ['王', '种'],
    },
    道具: {
      prefixes: ['特种', '应急', '急救', '抗凝', '高浓', '止血'],
      stems: ['喷雾', '包扎带', '注射液', '镇痛剂', '血浆'],
      suffixes: ['包', '盒'],
    },
  },
  '中式古典/玄幻': {
    人物: {
      prefixes: ['陆', '苏', '林', '顾', '白', '萧', '叶', '谢', '沈', '江', '秦', '墨', '裴', '楚', '宁', '温'],
      stems: ['长生', '清雪', '子墨', '不疑', '知微', '停云', '景行', '寒舟', '无咎', '听雨', '观棋', '破晓', '临渊', '凌绝', '暮云', '玄戈'],
      suffixes: ['真仙', '居士', '君', '候', '道人', '散人', '剑尊'],
    },
    地点: {
      prefixes: ['黑水', '天墉', '落星', '九幽', '青岚', '望月', '断界', '陨仙', '无妄', '万仞', '栖霞', '冥海'],
      stems: ['峡', '渊', '谷', '峰', '崖', '墟', '岭', '湖', '岛', '林', '荒', '城'],
      suffixes: ['古墟', '大川', '绝地', '禁域', '福地', '秘境'],
    },
    势力: {
      prefixes: ['太虚', '万剑', '九霄', '大炎', '天机', '七星', '幽冥', '玄天', '问情', '浮屠', '真武', '凌霄'],
      stems: ['道宗', '山庄', '商盟', '神朝', '阁', '仙盟', '皇朝', '古族', '世家', '圣地'],
      suffixes: ['分舵', '主脉', '别院', '法堂'],
    },
    招式: {
      prefixes: ['大荒', '九霄', '焚天', '太虚', '碎星', '断魂', '万相', '落日', '紫电', '无痕', '玄冰', '神引'],
      stems: ['分海剑', '惊雷破', '古煞掌', '撼地印', '归元诀', '踏虚步', '贯日枪', '回梦指', '化劫功'],
      suffixes: ['式', '变', '图', '真解', '残卷'],
    },
    装备: {
      prefixes: ['斩虚', '摄魂', '太虚九龙', '青鸾玄火', '山河乾坤', '幽冥破妄', '七星照夜', '大梵伏魔', '无极纯阳'],
      stems: ['剑', '鼎', '钟', '琴', '镜', '印', '尺', '塔', '图', '鉴', '令', '幡'],
      suffixes: ['佩', '环', '刺', '刃'],
    },
    怪物: {
      prefixes: ['九幽', '金翅', '吞天', '赤焰', '噬元', '幽冥', '裂地', '覆海', '虚空', '幻夜', '六目', '极雷'],
      stems: ['玄蛇', '天鹏', '魔蟾', '古蜥', '凶狡', '雷雀', '巨蜃', '冥獒', '魔蛛', '青蛟'],
      suffixes: ['王', '皇', '幼兽', '始祖'],
    },
    道具: {
      prefixes: ['九转', '破障', '紫府', '生生', '五行', '龙虎', '太上', '天元', '塑神', '补天', '替死', '匿气'],
      stems: ['还阳丹', '聚灵散', '洗髓液', '生机膏', '清心丸', '降尘露', '造化散', '凝神珠'],
      suffixes: ['神符', '遁卷', '密录'],
    },
  },
};

export const QuickNameModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activeNovel } = useNovelStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('人物');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('主角');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0]);
  const [selectedLength, setSelectedLength] = useState<string>(LENGTHS[0]);
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [isLlmRunning, setIsLlmRunning] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const currentCategoryConfig = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0],
    [selectedCategory]
  );

  // 本地即时随机生成 16 个名字（深度匹配所选艺术风格）
  const handleLocalGenerate = () => {
    const stylePool = LOCAL_BANKS[selectedStyle] || LOCAL_BANKS['中式古典/玄幻'];
    const bank = stylePool[selectedCategory] || LOCAL_BANKS['中式古典/玄幻']['人物'];
    const results: string[] = [];

    for (let i = 0; i < 16; i++) {
      const p = bank.prefixes[Math.floor(Math.random() * bank.prefixes.length)];
      const s = bank.stems[Math.floor(Math.random() * bank.stems.length)];
      let combined = `${p}${s}`;

      if (selectedLength === '双字' && combined.length > 2) {
        combined = combined.slice(0, 2);
      } else if (selectedLength === '三字' && combined.length === 2) {
        combined = `${p}${s[0]}${s[1] || '生'}`;
      } else if (selectedLength === '四字' && combined.length < 4) {
        const suf = bank.suffixes[Math.floor(Math.random() * bank.suffixes.length)] || '';
        combined = (combined + suf).slice(0, 4);
      }

      if (!results.includes(combined)) {
        results.push(combined);
      }
    }

    setGeneratedNames(results);
    setStatusFeedback(`已通过【${selectedStyle}】本地专有词库生成 16 组候选名称`);
  };

  // 初始自动生成一次
  React.useEffect(() => {
    if (isOpen && generatedNames.length === 0) {
      handleLocalGenerate();
    }
  }, [isOpen]);

  // 调用 AI 模型深度定制生成
  const handleLlmGenerate = async () => {
    if (!activeNovel) return;
    setIsLlmRunning(true);
    setStatusFeedback('正在通过模型深度定制推演起名...');

    try {
      const systemPrompt = `你是一位顶级小说设定大师与中文起名专家。
请根据作者的品类、风格与设定要求，生成 12 到 18 个具有极高文学美感、网文爆款辨识度与音韵节律的专有名称。
每行只输出一个名称，后面可用逗号简短附注 4~8 字气质（如：陆长生，道骨仙风避世者），不要输出任何客套前言或总结废话。`;

      const userPrompt = `【小说题材】：${activeNovel.genre_profile || '通用网文'}
【起名类别】：${selectedCategory} (${selectedSubtype})
【艺术风格】：${selectedStyle}
【字数要求】：${selectedLength}
【附加人设或气质要求】：${customKeyword.trim() || currentCategoryConfig.placeholder}

请直接输出名称清单：`;

      const res = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        temperature: 0.8,
        max_tokens: 800,
      });

      const lines = res
        .split('\n')
        .map((l) => l.replace(/^[-*·\d.\s]+/, '').trim())
        .filter((l) => l.length > 0 && !l.includes('好的') && !l.includes('以下是'));

      if (lines.length > 0) {
        setGeneratedNames(lines);
        setStatusFeedback('AI 深度推演已生成高质候选！');
      } else {
        handleLocalGenerate();
      }
    } catch (e: any) {
      console.error('AI 起名失败:', e);
      setStatusFeedback(`模型调用出错，已自动切换至本地词库: ${e.message || e}`);
      handleLocalGenerate();
    } finally {
      setIsLlmRunning(false);
    }
  };

  const handleCopy = async (name: string) => {
    const pureName = name.split(/[,，:：\s]/)[0] || name;
    try {
      await navigator.clipboard.writeText(pureName);
      setCopiedName(name);
      toast.info('已复制到剪贴板', pureName);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  // 一键存为角色档案
  const handleSaveAsCharacter = async (item: string) => {
    if (!activeNovel) return;
    const parts = item.split(/[,，:：\s]/);
    const pureName = parts[0] || item;
    const desc = parts.slice(1).join(' ').trim() || `${selectedSubtype}，起名灵感生成`;

    try {
      await api.createCharacter({
        novel_id: activeNovel.id,
        name: pureName,
        profile: desc,
        personality: '待设定',
        background: `基于【${selectedStyle}】风格起名生成`,
        motivation: '核心目标待定',
      });
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
      toast.success('已存入角色档案', `已成功将【${pureName}】录入角色工坊！`);
    } catch (e: any) {
      toast.error('录入角色失败', e.message || '创建角色出错');
    }
  };

  // 一键存为世界观设定
  const handleSaveAsWorldRule = async (item: string) => {
    if (!activeNovel) return;
    const parts = item.split(/[,，:：\s]/);
    const pureName = parts[0] || item;
    const desc = parts.slice(1).join(' ').trim() || `${selectedCategory}·${selectedSubtype}`;

    try {
      await api.createWorldRule({
        novel_id: activeNovel.id,
        title: pureName,
        rule_content: `【${selectedCategory}·${selectedSubtype}】风格：${selectedStyle}。\n设定要点：${desc}`,
        authority_level: 'EXTENDED',
      });
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
      toast.success('已存入世界观', `已成功将【${pureName}】录入世界观设定库！`);
    } catch (e: any) {
      toast.error('录入世界观失败', e.message || '创建世界规则出错');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-surface dark:bg-[#1a1714] border border-line dark:border-[#2e2a27] rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* 顶部标题栏 */}
        <div className="p-4 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary dark:text-amber-500" />
            <h3 className="font-bold text-sm text-ink dark:text-stone-100 font-serif">
              起名灵感生成器 (QuickName)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary dark:text-amber-400 border border-amber-800/20 font-medium">
              多流派词库 + AI 混合双驱
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-[#ded5c4]/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. 类别大项选择 */}
          <div>
            <label className="block text-[11px] font-bold text-ink-2 dark:text-stone-400 mb-1.5">
              1. 目标品类
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setSelectedSubtype(cat.subtypes[0]);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition text-center border cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-canvas dark:bg-[#221e1a] text-ink-2 dark:text-stone-300 border-line dark:border-[#38332e] hover:border-amber-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 子类型与风格参数 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-2 dark:text-stone-400 mb-1">
                细分身份 / 定位
              </label>
              <select
                value={selectedSubtype}
                onChange={(e) => setSelectedSubtype(e.target.value)}
                className="w-full bg-canvas dark:bg-[#221e1a] border border-line dark:border-[#38332e] rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-stone-200 outline-none focus:border-amber-700"
              >
                {currentCategoryConfig.subtypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-2 dark:text-stone-400 mb-1">
                艺术风格
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => {
                  setSelectedStyle(e.target.value);
                }}
                className="w-full bg-canvas dark:bg-[#221e1a] border border-line dark:border-[#38332e] rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-stone-200 outline-none focus:border-amber-700"
              >
                {STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-2 dark:text-stone-400 mb-1">
                字数控制
              </label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="w-full bg-canvas dark:bg-[#221e1a] border border-line dark:border-[#38332e] rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-stone-200 outline-none focus:border-amber-700"
              >
                {LENGTHS.map((len) => (
                  <option key={len} value={len}>
                    {len}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. 自定义气质提示词 */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-2 dark:text-stone-400 mb-1">
              设定特质 / 附加要求 (可选)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder={currentCategoryConfig.placeholder}
                className="flex-1 bg-canvas dark:bg-[#221e1a] border border-line dark:border-[#38332e] rounded-lg px-3 py-1.5 text-xs text-ink dark:text-stone-200 placeholder-[#8e8476] outline-none focus:border-amber-700"
              />
              <button
                type="button"
                onClick={handleLocalGenerate}
                className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#26211d] hover:bg-[#ded5c4] text-ink-2 dark:text-stone-300 border border-line dark:border-[#38332e] text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                title="通过本地对应风格词库立即刷新 (0 Token 毫秒级)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                本地刷新
              </button>
              <button
                type="button"
                onClick={handleLlmGenerate}
                disabled={isLlmRunning}
                className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isLlmRunning ? 'animate-spin' : ''}`} />
                {isLlmRunning ? '推演中...' : 'AI 深度起名'}
              </button>
            </div>
          </div>

          {/* 状态反馈 */}
          {statusFeedback && (
            <div className="text-[11px] text-primary dark:text-amber-400 bg-amber-800/10 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-800/20">
              {statusFeedback}
            </div>
          )}

          {/* 4. 候选名字展示区 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-ink-2 dark:text-stone-400">
                候选名称清单 (点击复制，或直接一键入库)
              </label>
              <span className="text-[10px] text-ink-2">
                共 {generatedNames.length} 组
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {generatedNames.map((item, idx) => {
                const isCopied = copiedName === item;
                const parts = item.split(/[,，:：\s]/);
                const namePart = parts[0] || item;
                const descPart = parts.slice(1).join(' ').trim();

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-line dark:border-[#2e2a27] bg-[#fbf9f5] dark:bg-[#201c18] hover:border-amber-800/60 dark:hover:border-amber-600 transition flex flex-col justify-between gap-1.5 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div>
                      <div className="w-full flex items-center justify-between">
                        <span
                          onClick={() => handleCopy(item)}
                          className="font-bold text-sm text-primary dark:text-amber-400 font-serif hover:underline cursor-pointer"
                          title="点击复制"
                        >
                          {namePart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item)}
                          className="p-1 rounded text-ink-2 hover:text-primary transition cursor-pointer"
                          title="复制名称"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {descPart && (
                        <span className="text-[10px] text-ink-2 dark:text-stone-400 line-clamp-1 block">
                          {descPart}
                        </span>
                      )}
                    </div>

                    {/* Quick Save Buttons */}
                    <div className="flex items-center gap-1 pt-1 border-t border-line/50 dark:border-[#2e2a27]">
                      {selectedCategory === '人物' ? (
                        <button
                          type="button"
                          onClick={() => handleSaveAsCharacter(item)}
                          className="text-[10px] text-primary dark:text-amber-400 hover:bg-amber-800/10 dark:hover:bg-amber-950/40 px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
                          title="直接存入角色工坊"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>存为角色</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveAsWorldRule(item)}
                          className="text-[10px] text-primary dark:text-amber-400 hover:bg-amber-800/10 dark:hover:bg-amber-950/40 px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
                          title="直接存入世界观设定"
                        >
                          <BookMarked className="w-3 h-3" />
                          <span>存为设定</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部提示与关闭 */}
        <div className="p-3 bg-surface-2 dark:bg-[#231f1b] border-t border-line dark:border-[#2e2a27] flex items-center justify-between text-xs text-ink-2">
          <span>提示：点击名字可复制，点击【存为角色/设定】可一键直接录入故事设定库。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#ded5c4] dark:bg-stone-800 hover:bg-[#d5cbb8] text-ink dark:text-stone-200 font-medium transition cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
