import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  User,
  Palette,
  Sliders,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { api } from '@/utils/tauriBridge';

interface CharacterAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    id?: string;
    name: string;
    gender?: string;
    personality?: string;
    motivation?: string;
    visual_summary?: string;
    avatar_url?: string;
  };
  genre?: string;
  onApplyAvatar: (avatarUrl: string, autoVisualSummary?: string) => Promise<void> | void;
}

export type AvatarArtStyle =
  | 'xianxia_cg'
  | 'anime_lightnovel'
  | 'cinematic_realism'
  | 'concept_art'
  | 'traditional_ink'
  | 'cyber_scifi';

export type AvatarFraming = 'bust' | 'portrait' | 'fullbody';

const STYLE_OPTIONS: { id: AvatarArtStyle; label: string; desc: string; promptSnippet: string }[] = [
  {
    id: 'xianxia_cg',
    label: '仙侠3D CG',
    desc: '国产3D仙侠动画原画质感，飘逸灵动，光影璀璨',
    promptSnippet: 'Chinese xianxia 3D animation style, ethereal atmosphere, exquisite silk fabric, floating ribbons, cinematic lighting, Unreal Engine 5 render, hyper-detailed, 8k',
  },
  {
    id: 'anime_lightnovel',
    label: '二次元日漫精细',
    desc: '日系轻小说插画风格，线条细腻，五官精致',
    promptSnippet: 'Anime light novel character illustration, highly detailed lines, Kyoto Animation aesthetic, expressive eyes, soft ambient lighting, clean masterpiece, pixiv ranking',
  },
  {
    id: 'cinematic_realism',
    label: '电影级写实立绘',
    desc: '写实真人质感，真实皮肤发丝光泽，大师级人像摄影',
    promptSnippet: 'Cinematic realistic portrait, 85mm lens photo, natural skin texture, realistic hair strands, subsurface scattering, dramatic rim light, award-winning cinematography',
  },
  {
    id: 'concept_art',
    label: '厚涂概念设计',
    desc: '艺术游戏原画厚涂，笔触丰富，氛围感极强',
    promptSnippet: 'Digital concept art, thick oil painting brushwork, Craig Mullins style, dramatic volumetric lighting, character concept design, artstation trending',
  },
  {
    id: 'traditional_ink',
    label: '国风水墨古韵',
    desc: '传统水墨丹青与工笔融合，留白写意，古雅典重',
    promptSnippet: 'Traditional Chinese ink wash and delicate watercolor painting, subtle mineral pigments, elegant brush calligraphy lines, poetic atmospheric mood, Guofeng aesthetic',
  },
  {
    id: 'cyber_scifi',
    label: '赛博未来机能',
    desc: '近未来科幻机能风，霓虹光晕，机械与机能服饰',
    promptSnippet: 'Cyberpunk futuristic techwear character portrait, neon volumetric lights, high-tech cybernetic accents, reflective visor, dark atmospheric city background',
  },
];

const FRAMING_OPTIONS: { id: AvatarFraming; label: string; desc: string; snippet: string }[] = [
  { id: 'bust', label: '半身立绘', desc: '胸部以上至腰部，兼顾面容与服饰', snippet: 'upper body bust shot, dynamic standing posture' },
  { id: 'portrait', label: '面部特写', desc: '头部与神情特写，极佳作为圆形头像', snippet: 'head and shoulders close-up face portrait, focused expressive gaze' },
  { id: 'fullbody', label: '全身原画', desc: '完整身姿体态与佩饰，适合人设全景', snippet: 'full body standing character design, complete outfit and shoes' },
];

const MODEL_PRESETS = [
  { id: 'dall-e-3', label: 'OpenAI DALL-E 3 (高精度理解)' },
  { id: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1-schnell (极速/高性价比)' },
  { id: 'black-forest-labs/FLUX.1-dev', label: 'FLUX.1-dev (顶级画质)' },
  { id: 'cogview-3-plus', label: '智谱 CogView-3 (中文友好)' },
  { id: 'wanx-v1', label: '阿里通义万相 (国风原画)' },
];

export const CharacterAvatarModal: React.FC<CharacterAvatarModalProps> = ({
  isOpen,
  onClose,
  character,
  genre = '通俗小说',
  onApplyAvatar,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<AvatarArtStyle>('xianxia_cg');
  const [selectedFraming, setSelectedFraming] = useState<AvatarFraming>('bust');
  const [selectedModel, setSelectedModel] = useState<string>('dall-e-3');
  const [customModel, setCustomModel] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 依据角色人设与风格自动装配提示词
  const assemblePrompt = (styleKey: AvatarArtStyle, framingKey: AvatarFraming) => {
    const styleObj = STYLE_OPTIONS.find((s) => s.id === styleKey) || STYLE_OPTIONS[0];
    const framingObj = FRAMING_OPTIONS.find((f) => f.id === framingKey) || FRAMING_OPTIONS[0];
    const charName = character.name || '主角';
    const charGender = character.gender || '男';
    const charVis = character.visual_summary ? `Appearance details: ${character.visual_summary}.` : '';
    const charPers = character.personality ? `Expression & temperament: ${character.personality}.` : '';

    return `Character portrait of ${charName}, ${charGender}, from genre ${genre}. ${framingObj.snippet}. ${charVis} ${charPers} ${styleObj.promptSnippet}, masterpiece, highest quality, sharp focus, beautiful aesthetics, clean composition.`;
  };

  // 初始化与重置提示词
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setGeneratedUrl('');
      // 若已有题材特定风格判断
      const g = (genre || '').toLowerCase();
      let initStyle: AvatarArtStyle = 'xianxia_cg';
      if (g.includes('科幻') || g.includes('赛博') || g.includes('星际')) {
        initStyle = 'cyber_scifi';
      } else if (g.includes('都市') || g.includes('职场') || g.includes('现实')) {
        initStyle = 'cinematic_realism';
      } else if (g.includes('二次元') || g.includes('轻小说') || g.includes('同人')) {
        initStyle = 'anime_lightnovel';
      } else if (g.includes('悬疑') || g.includes('推理') || g.includes('奇幻')) {
        initStyle = 'concept_art';
      }
      setSelectedStyle(initStyle);
      setPromptText(assemblePrompt(initStyle, selectedFraming));
    }
  }, [isOpen, character.name, character.visual_summary, genre]);

  // 支持键盘 Esc 键退出
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating && !isApplying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, isApplying, onClose]);

  // 当风格或构图切换时联动更新提示词（若未深度手动魔改）
  const handleStyleChange = (newStyle: AvatarArtStyle) => {
    setSelectedStyle(newStyle);
    setPromptText(assemblePrompt(newStyle, selectedFraming));
  };

  const handleFramingChange = (newFraming: AvatarFraming) => {
    setSelectedFraming(newFraming);
    setPromptText(assemblePrompt(selectedStyle, newFraming));
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setErrorMessage('提示词 (Prompt) 不能为空！');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const modelName = customModel.trim() || selectedModel;

    try {
      const res = await api.generateImage({
        prompt: promptText.trim(),
        model_name: modelName,
        size: '1024x1024',
        style: 'vivid',
      });

      if (res && res.image_url) {
        setGeneratedUrl(res.image_url);
      } else {
        setErrorMessage('生图服务未返回有效图片结果');
      }
    } catch (err: any) {
      console.error('生图异常:', err);
      const msg = err?.message || String(err);
      setErrorMessage(
        msg.includes('未配置')
          ? '请先前往【设置 / 模型网关】配置支持文生图的 API Key（如 OpenAI、SiliconFlow、智谱等）'
          : `绘图请求失败: ${msg}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!generatedUrl) return;
    setIsApplying(true);
    try {
      await onApplyAvatar(generatedUrl);
      onClose();
    } catch (e: any) {
      setErrorMessage(`应用立绘失败: ${e?.message || e}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-200">
      <div className="bg-surface dark:bg-[#1a1714] border border-line dark:border-[#2e2a27] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs text-ink dark:text-stone-200">
        {/* 顶部标题栏 */}
        <div className="px-5 py-3.5 border-b border-line dark:border-[#2e2a27] flex items-center justify-between shrink-0 bg-[#faf5ec]/60 dark:bg-[#181513]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
                角色立绘与头像 AI 创绘工坊
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-primary dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  {character.name} · {character.gender || '未知性别'}
                </span>
              </h2>
              <p className="text-[11px] text-ink-2 dark:text-stone-400">
                融合《{genre}》世界观与人设立绘提示词，一键生成专属高精度视觉立绘
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#ded5c4]/60 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 主体双栏：左侧立绘实时预览与对比，右侧生成控制面板 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-line dark:divide-[#2e2a27] overflow-y-auto">
          {/* 左侧：立绘大图渲染与对比区 (5列) */}
          <div className="md:col-span-5 p-5 bg-surface/70 dark:bg-[#141210] flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  立绘贴图预览区
                </span>
                {generatedUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                    ✨ 绘图已生成
                  </span>
                )}
              </div>

              {/* 核心立绘预览大框 */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-line dark:border-[#38332e] bg-stone-900 shadow-md group">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-stone-900/90 text-amber-300">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="font-semibold text-xs tracking-wide">
                      正在呼叫绘图模型极速渲染中...
                    </span>
                    <span className="text-[10px] text-stone-400 text-center max-w-[200px]">
                      注入外貌体态、神态光影与艺术笔触
                    </span>
                  </div>
                ) : generatedUrl ? (
                  <img
                    src={generatedUrl}
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : character.avatar_url ? (
                  <div className="relative w-full h-full">
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[10px] text-stone-300">当前已有角色旧立绘</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 gap-2 p-6 text-center">
                    <User className="w-12 h-12 stroke-[1.2] opacity-40 text-stone-400" />
                    <span className="text-xs text-stone-400 font-medium">暂无立绘贴图</span>
                    <span className="text-[10px] text-stone-500">
                      请在右侧选择艺术流派并点击【开始 AI 生成立绘】
                    </span>
                  </div>
                )}
              </div>

              {/* 角色现有人设外貌摘要 */}
              <div className="p-3 rounded-xl bg-surface dark:bg-[#1f1b17] border border-line dark:border-[#2e2a27] space-y-1">
                <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  当前人设底稿外貌：
                </span>
                <p className="text-[10px] text-ink-2 dark:text-stone-400 leading-relaxed font-serif line-clamp-3">
                  {character.visual_summary || character.personality || '尚未录入详细外貌特征，生成后将作为该角色视觉锚点。'}
                </p>
              </div>
            </div>

            {/* 底部应用按钮 */}
            {generatedUrl && (
              <div className="pt-4 border-t border-line dark:border-[#2e2a27] mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>正在持久化保存...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>确认应用为此角色正式立绘</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 右侧：生成参数配置与提示词调控 (7列) */}
          <div className="md:col-span-7 p-5 flex flex-col min-h-0 space-y-4 overflow-y-auto bg-white dark:bg-[#1a1714]">
            <div className="space-y-4">
              {/* 错误提示框 */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* 1. 艺术风格流派选择 */}
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mb-2">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  艺术风格流派 (6 款专业美学定制)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => handleStyleChange(style.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-700 bg-amber-500/10 dark:bg-amber-400/10 shadow-xs'
                            : 'border-line dark:border-[#38332e] hover:border-amber-700/50 bg-[#faf5ec]/40 dark:bg-[#1f1b17]'
                        }`}
                      >
                        <div className="font-semibold text-xs text-stone-800 dark:text-stone-200 flex items-center justify-between">
                          <span>{style.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-primary dark:text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-tight">
                          {style.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 画幅构图与模型选择 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 构图角度 */}
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3 h-3 text-primary" />
                    构图画幅
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FRAMING_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleFramingChange(f.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition cursor-pointer ${
                          selectedFraming === f.id
                            ? 'border-amber-700 bg-amber-800 text-white font-bold'
                            : 'border-line dark:border-[#38332e] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title={f.desc}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 绘图大模型 */}
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                    <Sliders className="w-3 h-3 text-primary" />
                    绘图网关模型
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-700 cursor-pointer"
                  >
                    {MODEL_PRESETS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                    <option value="custom">⚙️ 自定义其他模型...</option>
                  </select>
                  {selectedModel === 'custom' && (
                    <input
                      type="text"
                      placeholder="输入模型标识符 (如 stabilityai/sd-3)"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="mt-1.5 w-full px-2.5 py-1 text-[11px] rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900"
                    />
                  )}
                </div>
              </div>

              {/* 3. 提示词自由编辑与微调 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    提示词 (Prompt) 调校
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPromptText(assemblePrompt(selectedStyle, selectedFraming))}
                      className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 transition"
                      title="重置为根据角色人设生成的推荐提示词"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>重置初始</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="text-[10px] text-primary dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? '已复制' : '复制 Prompt'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={4}
                  placeholder="在此自由增删角色的武器、饰品、发色、瞳色或特定动作特征..."
                  className="w-full p-2.5 rounded-xl border border-line dark:border-[#38332e] bg-[#faf5ec]/30 dark:bg-stone-900 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-700 resize-none"
                />
                <p className="text-[10px] text-stone-400">
                  支持中英文提示词；可在末尾自由追加细节，如“手握古剑”、“嘴角带血”、“银白长发”等。
                </p>
              </div>
            </div>

            {/* 底部操作条 */}
            <div className="pt-3 border-t border-line dark:border-[#2e2a27] flex items-center justify-between shrink-0 mt-auto">
              <span className="text-[11px] text-stone-500">
                比例规格：<strong>1024×1024 正方</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl border border-line dark:border-[#38332e] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>正在极速绘制中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>开始 AI 生成立绘</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
