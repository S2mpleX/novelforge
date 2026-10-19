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
} from 'lucide-react';

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
    subtypes: ['主角', '反派', '女性角色', '长辈宿老', '生死同伴'],
    placeholder: '如：外冷内热，背负血仇，五行属水...',
  },
  {
    key: '地点',
    label: '地理地点',
    subtypes: ['城镇城郭', '自然险地', '宗门洞府', '秘境古墟'],
    placeholder: '如：终年积雪，妖兽横行，地势孤悬...',
  },
  {
    key: '势力',
    label: '宗门势力',
    subtypes: ['隐世仙宗', '人间王朝', '修仙世家', '江湖密织'],
    placeholder: '如：行事隐秘，亦正亦邪，执掌天下情报...',
  },
  {
    key: '招式',
    label: '功法招式',
    subtypes: ['无上剑诀', '霸道拳掌', '诡谲身法', '玄门内功'],
    placeholder: '如：招式狠辣，一剑封喉，引动九霄雷火...',
  },
  {
    key: '装备',
    label: '法宝神兵',
    subtypes: ['通灵兵刃', '护体防具', '镇宗法宝', '玄奇饰品'],
    placeholder: '如：通体乌黑，吸食煞气，刻满上古符文...',
  },
  {
    key: '怪物',
    label: '妖兽异种',
    subtypes: ['太古凶兽', '天地灵兽', '深渊魔种', '变异妖禽'],
    placeholder: '如：盘踞万丈深渊，吞食精气，鳞甲如寒铁...',
  },
  {
    key: '道具',
    label: '丹药灵物',
    subtypes: ['破阶丹药', '救命神符', '天机卷轴', '奇珍异宝'],
    placeholder: '如：可破金丹瓶颈，亦含烈性火毒...',
  },
];

const STYLES = ['中式古典/玄幻', '近现代/都市', '冷冽仙侠', '硬核科幻/赛博'];
const LENGTHS = ['不限字数', '双字', '三字', '四字'];

// 离线高质词根库 (0-Token 秒级即时推演)
const LOCAL_BANKS: Record<string, { prefixes: string[]; stems: string[]; suffixes: string[] }> = {
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

  // 本地即时随机生成 16 个名字
  const handleLocalGenerate = () => {
    const bank = LOCAL_BANKS[selectedCategory] || LOCAL_BANKS['人物'];
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
    setStatusFeedback('已通过本地词根库即时生成 16 组候选名称');
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
      setStatusFeedback(`模型调用出错，已切换至本地词根库: ${e.message || e}`);
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
      setTimeout(() => setCopiedName(null), 2000);
    } catch (e) {
      console.error('复制失败:', e);
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
              本地词库 + AI 混合双驱
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
                onChange={(e) => setSelectedStyle(e.target.value)}
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
                title="通过本地词根库立即刷新 (0 Token 毫秒级)"
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
                候选名称清单 (点击任一项一键复制名称)
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
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="p-2.5 rounded-xl border border-line dark:border-[#2e2a27] bg-[#fbf9f5] dark:bg-[#201c18] hover:border-amber-800/60 dark:hover:border-amber-600 transition flex flex-col items-start gap-1 text-left group cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="font-bold text-sm text-primary dark:text-amber-400 font-serif group-hover:scale-105 transition-transform">
                        {namePart}
                      </span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-ink-2 group-hover:text-primary opacity-0 group-hover:opacity-100 transition shrink-0" />
                      )}
                    </div>
                    {descPart && (
                      <span className="text-[10px] text-ink-2 dark:text-stone-400 line-clamp-1">
                        {descPart}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部提示与关闭 */}
        <div className="p-3 bg-surface-2 dark:bg-[#231f1b] border-t border-line dark:border-[#2e2a27] flex items-center justify-between text-xs text-ink-2">
          <span>提示：点击名字可直接拷贝到剪贴板，贴入正文或人物设定卡。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#ded5c4] dark:bg-stone-800 hover:bg-[#d5cbb8] text-ink dark:text-stone-200 font-medium transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
