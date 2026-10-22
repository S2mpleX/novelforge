import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { confirmDialog, alertDialog } from '@/utils/dialog';
import { api } from '@/utils/tauriBridge';
import { optimizeImageFileToDataUrl } from '@/utils/imageOptimizer';
import {
  X,
  Palette,
  Upload,
  Link,
  Sparkles,
  Check,
  RotateCcw,
  Copy,
  Info,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sliders,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  BookCoverView,
  BOOK_COVER_PRESETS,
  detectPresetByGenre,
} from '@/components/common/BookCoverView';

interface BookCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const BookCoverModal: React.FC<BookCoverModalProps> = ({
  isOpen,
  onClose,
  embedded = false,
}) => {
  const { activeNovel, updateNovel } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'PRESETS' | 'UPLOAD' | 'URL' | 'AI_GENERATE'>('PRESETS');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset:xuan_ink');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customSubtitle, setCustomSubtitle] = useState<string>('');
  const [customAuthor, setCustomAuthor] = useState<string>('著 / 佚名');
  const [customStamp, setCustomStamp] = useState<string>('藏书');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI 封面生成专属状态
  const [aiCoverStyle, setAiCoverStyle] = useState<string>('xianxia');
  const [aiCoverModel, setAiCoverModel] = useState<string>('dall-e-3');
  const [customCoverModel, setCustomCoverModel] = useState<string>('');
  const [aiCoverSize, setAiCoverSize] = useState<string>('1024x1024');
  const [aiCoverPrompt, setAiCoverPrompt] = useState<string>('');
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string>('');
  const [coverGenerationError, setCoverGenerationError] = useState<string | null>(null);

  // 初始化已有数据
  useEffect(() => {
    if (activeNovel) {
      setCustomTitle(activeNovel.title || '');
      setCustomSubtitle(activeNovel.description || '');

      const currentCover = activeNovel.cover_url;
      if (currentCover) {
        if (currentCover.startsWith('preset:')) {
          setSelectedPresetId(currentCover);
          setActiveTab('PRESETS');
        } else if (currentCover.startsWith('data:image')) {
          setUploadedDataUrl(currentCover);
          setActiveTab('UPLOAD');
        } else if (currentCover.startsWith('http')) {
          setInputUrl(currentCover);
          setActiveTab('URL');
        }
      } else {
        const defaultPreset = detectPresetByGenre(activeNovel.genre_profile);
        setSelectedPresetId(defaultPreset.id);
        setActiveTab('PRESETS');
      }
    }
  }, [activeNovel, isOpen]);

  if (!isOpen && !embedded) return null;
  if (!activeNovel) return null;

  // 计算当前预览的实际 cover_url
  const getPreviewCoverUrl = (): string => {
    if (activeTab === 'UPLOAD' && uploadedDataUrl) {
      return uploadedDataUrl;
    }
    if (activeTab === 'URL' && inputUrl) {
      return inputUrl;
    }
    if (activeTab === 'AI_GENERATE' && generatedCoverUrl) {
      return generatedCoverUrl;
    }
    return selectedPresetId;
  };

  // 处理本地图片选择并执行本地内存高清优化压缩
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedDataUrl = await optimizeImageFileToDataUrl(file, {
        maxDimension: 1200,
        quality: 0.9,
        maxFileSizeBytes: 10 * 1024 * 1024,
      });
      setUploadedDataUrl(optimizedDataUrl);
      setFeedback('封面图片已载入并自动完成高清优化压缩！');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      await alertDialog(err?.message || '读取并优化封面图片失败');
    }
  };

  const COVER_STYLE_PRESETS: { id: string; label: string; snippet: string }[] = [
    { id: 'xianxia', label: '🎋 国风水墨', snippet: 'Traditional Chinese ink wash painting, ethereal Taoist landscape, poetic atmosphere, elegant brushwork' },
    { id: 'fantasy', label: '🌌 东方玄幻', snippet: 'Epic Eastern fantasy illustration, golden glowing runes, grand mythical landscape, cinematic volumetric lighting, Unreal Engine 5' },
    { id: 'cyberpunk', label: '⚡ 赛博科幻', snippet: 'Sci-fi concept art, deep space nebula, interstellar starship, futuristic neon lighting, ultra-detailed' },
    { id: 'suspense', label: '🕯️ 悬疑惊悚', snippet: 'Dark noir illustration, mysterious foggy night, dramatic rim light, moody suspense atmosphere, chiaroscuro' },
    { id: 'romance', label: '🌸 古风言情', snippet: 'Delicate Chinese ancient romance watercolor, soft pastel tones, blossoming peach flowers, gentle breeze' },
    { id: 'modern', label: '🏢 都市质感', snippet: 'Modern urban literature aesthetic, minimalist typography layout, architectural geometry, artistic photography' },
  ];

  const assembleCoverPrompt = (styleId: string) => {
    const s = COVER_STYLE_PRESETS.find((x) => x.id === styleId) || COVER_STYLE_PRESETS[0];
    const genre = activeNovel.genre_profile || '玄幻';
    const title = activeNovel.title;
    const desc = activeNovel.description || '宏大的世界观';
    return `Book cover illustration for "${title}", a ${genre} novel. Theme: ${desc}. Art style: ${s.snippet}, highly aesthetic, dramatic composition, centered, no text on artwork, 8k resolution, masterpiece.`;
  };

  useEffect(() => {
    if (activeNovel && !aiCoverPrompt) {
      setAiCoverPrompt(assembleCoverPrompt(aiCoverStyle));
    }
  }, [activeNovel?.id, aiCoverStyle]);

  const handleGenerateCover = async () => {
    if (!aiCoverPrompt.trim()) return;
    setIsGeneratingCover(true);
    setCoverGenerationError(null);
    try {
      const modelName = customCoverModel.trim() || aiCoverModel;
      const res = await api.generateImage({
        prompt: aiCoverPrompt.trim(),
        model_name: modelName,
        size: aiCoverSize,
        style: 'vivid',
      });
      if (res && res.image_url) {
        setGeneratedCoverUrl(res.image_url);
        setFeedback('AI 封面原画生成成功！左侧已实时呈现 3D 书卷装帧效果');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setCoverGenerationError('生图服务未返回有效图片结果');
      }
    } catch (err: any) {
      console.error('生图错误:', err);
      const msg = err?.message || String(err);
      setCoverGenerationError(
        msg.includes('未配置')
          ? '请先前往【设置 / 模型网关】配置支持绘图的 API Key（如 OpenAI、SiliconFlow、智谱等）'
          : `封面生成异常: ${msg}`
      );
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // 保存封面
  const handleSaveCover = async () => {
    setIsSaving(true);
    try {
      const finalCoverUrl = getPreviewCoverUrl();
      await updateNovel({
        id: activeNovel.id,
        title: activeNovel.title,
        cover_url: finalCoverUrl,
      });

      setFeedback('作品封面已成功更新并持久化！');
      setTimeout(() => {
        setFeedback(null);
        if (!embedded) onClose();
      }, 1200);
    } catch (e) {
      await alertDialog('保存封面失败: ' + e);
    } finally {
      setIsSaving(false);
    }
  };

  // 清除封面恢复默认
  const handleResetToDefault = async () => {
    if (await confirmDialog('确定要清除当前自定义封面，恢复为系统默认艺术书卷吗？')) {
      setIsSaving(true);
      try {
        const defaultPreset = detectPresetByGenre(activeNovel.genre_profile);
        await updateNovel({
          id: activeNovel.id,
          title: activeNovel.title,
          cover_url: defaultPreset.id,
        });
        setSelectedPresetId(defaultPreset.id);
        setUploadedDataUrl('');
        setInputUrl('');
        setActiveTab('PRESETS');
        setFeedback('已恢复为默认艺术封皮！');
        setTimeout(() => setFeedback(null), 1500);
      } catch (e) {
        await alertDialog('恢复默认封面失败: ' + e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const previewCoverUrl = getPreviewCoverUrl();

  const modalContent = (
    <div className={`w-full ${embedded ? 'h-full rounded-none border-0' : 'max-w-4xl h-[86vh] rounded-2xl border border-line dark:border-[#2e2a27] shadow-2xl animate-in fade-in zoom-in-95 duration-200'} bg-surface dark:bg-[#1a1714] flex flex-col overflow-hidden`}>
      {/* 顶部标题栏 */}
      <div className="px-5 py-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center shadow-xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
              作品封面与装帧设计工坊 (Cover Studio)
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-primary dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                看板与全书装帧
              </span>
            </h2>
            <p className="text-[11px] text-ink-2 dark:text-stone-400">
              为《{activeNovel.title}》定制典雅艺术封皮、上传专属原画，或提取专业 AI 提示词
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#ded5c4]/60 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 反馈成功提示 */}
      {feedback && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* 主体双栏：左侧 3D 实体书卷预览，右侧装帧配置 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#ded5c4] dark:divide-[#2e2a27]">
        {/* 左栏：3D 实体书卷沉浸式预览 (5列) */}
        <div className="md:col-span-5 p-6 bg-surface/70 dark:bg-[#141210] flex flex-col items-center justify-between overflow-y-auto">
          <div className="text-center w-full">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest block mb-4">
              3D 实体书卷装帧实时预览
            </span>

            {/* 3D 封面大图 */}
            <div className="flex justify-center items-center py-4">
              <BookCoverView
                novel={{
                  ...activeNovel,
                  cover_url: previewCoverUrl,
                }}
                size="xl"
                showRibbon={true}
                customTitle={customTitle}
                customSubtitle={customSubtitle}
                customAuthor={customAuthor}
                customStamp={customStamp}
                presetId={activeTab === 'PRESETS' ? selectedPresetId : undefined}
                className="transform hover:rotate-y-[-6deg] hover:scale-102 transition-transform duration-300"
              />
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 font-serif">
              {activeTab === 'PRESETS'
                ? '典雅宣纸暗纹 · 书脊 3D 弧光 · 丝带书签'
                : activeTab === 'UPLOAD'
                ? '本地高清原画 · 3D 书脊包边与侧边光影'
                : '网络图片直连 · 自适应装帧画幅'}
            </p>
          </div>

          {/* 快捷恢复按钮 */}
          <div className="w-full pt-4 border-t border-line/60 dark:border-[#2e2a27] flex items-center justify-between text-xs">
            <button
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 transition cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置为默认书卷</span>
            </button>
            <span className="text-[11px] text-primary dark:text-amber-500 font-medium">
              标准 3:4 比例
            </span>
          </div>
        </div>

        {/* 右栏：4 大装帧模式 Tab 与参数配置 (7列) */}
        <div className="md:col-span-7 flex flex-col h-full bg-white dark:bg-[#1a1714] overflow-hidden">
          {/* Tab 切换栏 */}
          <div className="flex items-center px-4 pt-3 border-b border-line dark:border-[#2e2a27] gap-2 shrink-0 bg-[#faf5ec]/40 dark:bg-[#181513]/40">
            <button
              onClick={() => setActiveTab('PRESETS')}
              className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'PRESETS'
                  ? 'border-amber-800 text-primary dark:text-amber-400 dark:border-amber-400 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>典雅艺术封皮</span>
            </button>

            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'UPLOAD'
                  ? 'border-amber-800 text-primary dark:text-amber-400 dark:border-amber-400 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>本地原画上传</span>
            </button>

            <button
              onClick={() => setActiveTab('URL')}
              className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'URL'
                  ? 'border-amber-800 text-primary dark:text-amber-400 dark:border-amber-400 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>网络图片链接</span>
            </button>

            <button
              onClick={() => setActiveTab('AI_GENERATE')}
              className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'AI_GENERATE'
                  ? 'border-amber-800 text-primary dark:text-amber-400 dark:border-amber-400 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>✨ AI 原画生图</span>
            </button>
          </div>

          {/* Tab 内容区 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {/* Tab 1: 典雅艺术封皮选择 */}
            {activeTab === 'PRESETS' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2 font-serif">
                    选择装帧流派风格 (8 款典雅工艺)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {BOOK_COVER_PRESETS.map((p) => {
                      const isSelected = selectedPresetId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPresetId(p.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-800 dark:border-amber-500 ring-2 ring-amber-700/20 bg-amber-50/50 dark:bg-amber-950/30'
                              : 'border-line dark:border-[#38332e] hover:border-amber-700/50 bg-surface dark:bg-[#1f1b17]'
                          }`}
                        >
                          <div
                            className={`w-full h-16 rounded-lg bg-gradient-to-b ${p.bgGradient} border border-black/10 flex items-center justify-center relative overflow-hidden mb-1.5 shadow-2xs`}
                          >
                            <span
                              className="font-serif font-black text-[10px] truncate max-w-[80%]"
                              style={{ color: p.textColor }}
                            >
                              {activeNovel.title}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-800 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-stone-800 dark:text-stone-200 truncate">
                              {p.name.split('·')[0]}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                              {p.genre.split('/')[0]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 封面文字与署名定制 */}
                <div className="p-3.5 rounded-xl border border-line dark:border-[#38332e] bg-[#fbf9f5] dark:bg-[#181513] space-y-3">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block font-serif">
                    封面文案微调 (实时预览生效)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-stone-600 dark:text-stone-400 block mb-1">
                        封面主书名
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder={activeNovel.title}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-stone-600 dark:text-stone-400 block mb-1">
                        著者署名
                      </label>
                      <input
                        type="text"
                        value={customAuthor}
                        onChange={(e) => setCustomAuthor(e.target.value)}
                        placeholder="著 / 你的笔名"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] text-stone-600 dark:text-stone-400 block mb-1">
                        封面副标 / 腰封宣传语
                      </label>
                      <input
                        type="text"
                        value={customSubtitle}
                        onChange={(e) => setCustomSubtitle(e.target.value)}
                        placeholder="一句话点明世界观或主角核心冲突"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-stone-600 dark:text-stone-400 block mb-1">
                        藏书印章 (2字)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={customStamp}
                        onChange={(e) => setCustomStamp(e.target.value)}
                        placeholder="藏书"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 text-center font-serif focus:outline-none focus:ring-1 focus:ring-amber-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 本地原画图片上传 */}
            {activeTab === 'UPLOAD' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-line dark:border-[#38332e] hover:border-amber-700 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#faf5ec]/50 dark:bg-[#151311] group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-800/10 text-primary dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                    点击选择本地图片 或 拖拽图片至此处
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                    支持 PNG, JPG, WebP 格式；图片将直接持久化于本地数据库，断网离线随身携带
                  </p>
                  <span className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-950/60 text-primary dark:text-amber-300">
                    推荐比例：3:4 (如 600×800 或 900×1200)
                  </span>
                </div>

                {uploadedDataUrl && (
                  <div className="p-3 rounded-xl border border-line dark:border-[#38332e] bg-[#fbf9f5] dark:bg-[#181513] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedDataUrl}
                        alt="上传预览"
                        className="w-10 h-14 object-cover rounded shadow-xs border border-black/10"
                      />
                      <div>
                        <div className="font-medium text-xs text-stone-800 dark:text-stone-200">
                          已就绪的原画封面
                        </div>
                        <div className="text-[10px] text-stone-500">
                          已自动转换为本地 Base64 存储
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedDataUrl('')}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                    >
                      移除重选
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: 网络图片链接 */}
            {activeTab === 'URL' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                    输入外部图片直链 URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value.trim())}
                      placeholder="https://example.com/your-book-cover.jpg"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700"
                    />
                    <button
                      onClick={() => {
                        if (inputUrl) {
                          setFeedback('已载入外部图片链接！');
                          setTimeout(() => setFeedback(null), 1500);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium"
                    >
                      验证载入
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-primary dark:text-amber-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-primary dark:text-amber-400 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    贴士：支持任何公开可访问的图片地址（如各大图床、Unsplash或网文平台封面直链）。若需长期离线安全保存，推荐使用【本地原画上传】。
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: AI 封面原画生成 */}
            {activeTab === 'AI_GENERATE' && (
              <div className="space-y-4">
                {coverGenerationError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <div className="leading-relaxed">{coverGenerationError}</div>
                  </div>
                )}

                {/* 1. 流派风格选择 */}
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mb-2">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    装帧流派意境 (6 款文学原画预设)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COVER_STYLE_PRESETS.map((style) => {
                      const isSelected = aiCoverStyle === style.id;
                      return (
                        <div
                          key={style.id}
                          onClick={() => {
                            setAiCoverStyle(style.id);
                            setAiCoverPrompt(assembleCoverPrompt(style.id));
                          }}
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 画幅规格与模型选择 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3 h-3 text-primary" />
                      画幅比例
                    </label>
                    <select
                      value={aiCoverSize}
                      onChange={(e) => setAiCoverSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-700 cursor-pointer"
                    >
                      <option value="1024x1024">1024×1024 (标准正方)</option>
                      <option value="1024x1792">1024×1792 (竖屏全画幅)</option>
                      <option value="768x1024">768×1024 (3:4 书卷黄金比例)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                      <Sliders className="w-3 h-3 text-primary" />
                      绘图模型网关
                    </label>
                    <select
                      value={aiCoverModel}
                      onChange={(e) => setAiCoverModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-700 cursor-pointer"
                    >
                      <option value="dall-e-3">OpenAI DALL-E 3 (高精度理解)</option>
                      <option value="black-forest-labs/FLUX.1-schnell">FLUX.1-schnell (极速/高性价比)</option>
                      <option value="black-forest-labs/FLUX.1-dev">FLUX.1-dev (顶级画质)</option>
                      <option value="cogview-3-plus">智谱 CogView-3 (中文友好)</option>
                      <option value="wanx-v1">阿里通义万相 (国风原画)</option>
                      <option value="custom">⚙️ 自定义其他模型...</option>
                    </select>
                    {aiCoverModel === 'custom' && (
                      <input
                        type="text"
                        placeholder="输入模型标识符"
                        value={customCoverModel}
                        onChange={(e) => setCustomCoverModel(e.target.value)}
                        className="mt-1.5 w-full px-2.5 py-1 text-[11px] rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900"
                      />
                    )}
                  </div>
                </div>

                {/* 3. 提示词与一键生成 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      封面原画提示词 (Prompt)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAiCoverPrompt(assembleCoverPrompt(aiCoverStyle))}
                        className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>重置初始</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(aiCoverPrompt)}
                        className="text-[10px] text-primary dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPrompt ? '已复制' : '复制 Prompt'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={aiCoverPrompt}
                    onChange={(e) => setAiCoverPrompt(e.target.value)}
                    rows={3}
                    placeholder="在此自由微调封面景致、光影氛围或象征意象..."
                    className="w-full p-2.5 rounded-xl border border-line dark:border-[#38332e] bg-[#faf5ec]/30 dark:bg-stone-900 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-700 resize-none"
                  />
                </div>

                {/* 触发生成按钮 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                  <span className="text-[11px] text-primary dark:text-amber-300">
                    点击生成后，左侧 3D 实体书卷将实时呈现新封套装帧！
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在极速绘制封面...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>立即 AI 生成新封面</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 已生成的图片状态与外置工具提示词折叠 */}
                {generatedCoverUrl && (
                  <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={generatedCoverUrl}
                        alt="AI生成封面"
                        className="w-12 h-16 object-cover rounded shadow-xs border border-emerald-400"
                      />
                      <div>
                        <div className="font-semibold text-xs text-emerald-800 dark:text-emerald-300">
                          ✨ 封面原画已生成就绪
                        </div>
                        <div className="text-[10px] text-stone-500">
                          已自动载入左侧 3D 书卷，点击下方【保存并应用封面】即可完成全书装帧
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部保存操作条 */}
          <div className="px-5 py-3 border-t border-line dark:border-[#2e2a27] bg-[#faf5ec]/50 dark:bg-[#181513]/50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-stone-500">
              当前装帧方案：
              <span className="font-semibold text-stone-800 dark:text-stone-200 ml-1">
                {activeTab === 'PRESETS'
                  ? '内置艺术封皮'
                  : activeTab === 'UPLOAD'
                  ? '本地 Base64 原画'
                  : activeTab === 'URL'
                  ? '网络图片直连'
                  : 'AI 原画艺术生成'}
              </span>
            </span>

            <div className="flex items-center gap-2.5">
              {!embedded && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl border border-line dark:border-[#38332e] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition cursor-pointer"
                >
                  取消
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveCover}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? '正在保存...' : '保存并应用封面'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="w-full h-full select-none font-sans">{modalContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      {modalContent}
    </div>
  );
};
