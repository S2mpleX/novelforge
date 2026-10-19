import React from 'react';
import { Novel } from '@/types';
import { Palette } from 'lucide-react';

export interface BookCoverPreset {
  id: string;
  name: string;
  genre: string;
  description: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  sealColor: string;
  sealText: string;
  ribbonColor: string;
  decorType: 'ink' | 'stitch' | 'bamboo' | 'cosmos' | 'moon' | 'crimson' | 'rune' | 'ivory';
}

export const BOOK_COVER_PRESETS: BookCoverPreset[] = [
  {
    id: 'preset:xuan_ink',
    name: '宣纸水墨·文人雅韵',
    genre: '仙侠 / 传统文学',
    description: '澄心熟宣质感，远山云烟墨韵，加盖朱砂方印',
    bgGradient: 'from-[#f5efe4] via-[#eae0cd] to-[#ded0b6]',
    textColor: '#241c14',
    accentColor: '#92400e',
    borderColor: '#cbbba0',
    sealColor: '#b91c1c',
    sealText: '藏书',
    ribbonColor: '#9a3412',
    decorType: 'ink',
  },
  {
    id: 'preset:gilded_amber',
    name: '烫金沉香·古籍线装',
    genre: '历史 / 经典典藏',
    description: '沉香古木底色，手工宣德线装针脚，双层烫金回纹',
    bgGradient: 'from-[#382619] via-[#28190d] to-[#1c1108]',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    borderColor: '#d97706',
    sealColor: '#d97706',
    sealText: '典藏',
    ribbonColor: '#d97706',
    decorType: 'stitch',
  },
  {
    id: 'preset:bamboo_mist',
    name: '澄心青竹·幽谷仙踪',
    genre: '玄幻 / 修仙问道',
    description: '江南翠竹冷青，暮雨微岚，空灵出尘',
    bgGradient: 'from-[#193527] via-[#10241a] to-[#091710]',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    borderColor: '#059669',
    sealColor: '#10b981',
    sealText: '仙契',
    ribbonColor: '#059669',
    decorType: 'bamboo',
  },
  {
    id: 'preset:deep_cosmos',
    name: '深邃星穹·硬核科幻',
    genre: '硬核科幻 / 太空歌剧',
    description: '浩瀚星云与引力波星轨，冷峻几何徽标与星光',
    bgGradient: 'from-[#111936] via-[#15102d] to-[#090b16]',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    borderColor: '#0284c7',
    sealColor: '#38bdf8',
    sealText: '星枢',
    ribbonColor: '#0284c7',
    decorType: 'cosmos',
  },
  {
    id: 'preset:midnight_noir',
    name: '孤月夜影·暗黑悬疑',
    genre: '悬疑惊悚 / 现实推理',
    description: '冷月破晓寒雾，高对比沉暮黑金，迷离紧迫',
    bgGradient: 'from-[#22242b] via-[#18191f] to-[#0d0e12]',
    textColor: '#f1f5f9',
    accentColor: '#94a3b8',
    borderColor: '#64748b',
    sealColor: '#e11d48',
    sealText: '绝密',
    ribbonColor: '#475569',
    decorType: 'moon',
  },
  {
    id: 'preset:crimson_blade',
    name: '朱砂墨韵·热血玄幻',
    genre: '热血玄幻 / 武侠无双',
    description: '朱砂赤焰与苍劲笔触，龙鳞饰角，霸气豪迈',
    bgGradient: 'from-[#5e140f] via-[#3b0b08] to-[#220402]',
    textColor: '#fff1f2',
    accentColor: '#f87171',
    borderColor: '#b91c1c',
    sealColor: '#dc2626',
    sealText: '无双',
    ribbonColor: '#b91c1c',
    decorType: 'crimson',
  },
  {
    id: 'preset:parchment_fantasy',
    name: '羊皮做旧·复古奇幻',
    genre: '西幻奇幻 / 领主种田',
    description: '古老做旧羊皮纸，魔法卢恩符文环与封泥印信',
    bgGradient: 'from-[#3c2a1a] via-[#291b0f] to-[#1a1008]',
    textColor: '#fef3c7',
    accentColor: '#fbbf24',
    borderColor: '#b45309',
    sealColor: '#b45309',
    sealText: '御览',
    ribbonColor: '#b45309',
    decorType: 'rune',
  },
  {
    id: 'preset:minimal_ivory',
    name: '极简象牙·纯文学',
    genre: '现代文学 / 散文小说',
    description: '温润象牙白留白，微凹压花线条，至简高级风骨',
    bgGradient: 'from-[#fbf9f5] via-[#f4eee2] to-[#eae0cf]',
    textColor: '#1f1d1a',
    accentColor: '#78350f',
    borderColor: '#d7cbb5',
    sealColor: '#991b1b',
    sealText: '初版',
    ribbonColor: '#78350f',
    decorType: 'ivory',
  },
];

export function getPresetById(id?: string): BookCoverPreset {
  if (!id) return BOOK_COVER_PRESETS[0];
  const found = BOOK_COVER_PRESETS.find((p) => p.id === id);
  return found || BOOK_COVER_PRESETS[0];
}

export function detectPresetByGenre(genre?: string): BookCoverPreset {
  if (!genre) return BOOK_COVER_PRESETS[0];
  const g = genre.toLowerCase();
  if (g.includes('科幻') || g.includes('星际') || g.includes('末世')) {
    return BOOK_COVER_PRESETS[3]; // deep_cosmos
  }
  if (g.includes('悬疑') || g.includes('推理') || g.includes('惊悚') || g.includes('暗黑')) {
    return BOOK_COVER_PRESETS[4]; // midnight_noir
  }
  if (g.includes('奇幻') || g.includes('魔法') || g.includes('领主')) {
    return BOOK_COVER_PRESETS[6]; // parchment_fantasy
  }
  if (g.includes('仙侠') || g.includes('修真') || g.includes('道')) {
    return BOOK_COVER_PRESETS[2]; // bamboo_mist
  }
  if (g.includes('历史') || g.includes('架空') || g.includes('争霸')) {
    return BOOK_COVER_PRESETS[1]; // gilded_amber
  }
  if (g.includes('都市') || g.includes('热血') || g.includes('战神') || g.includes('玄幻')) {
    return BOOK_COVER_PRESETS[5]; // crimson_blade
  }
  if (g.includes('文学') || g.includes('散文') || g.includes('随笔') || g.includes('轻小说')) {
    return BOOK_COVER_PRESETS[7]; // minimal_ivory
  }
  return BOOK_COVER_PRESETS[0]; // xuan_ink
}

interface BookCoverViewProps {
  novel?: Partial<Novel> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRibbon?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  // Overrides for live customization in editor
  customTitle?: string;
  customSubtitle?: string;
  customAuthor?: string;
  customStamp?: string;
  presetId?: string;
}

export const BookCoverView: React.FC<BookCoverViewProps> = ({
  novel,
  size = 'md',
  className = '',
  showRibbon = true,
  interactive = false,
  onClick,
  customTitle,
  customSubtitle,
  customAuthor,
  customStamp,
  presetId,
}) => {
  const title = customTitle || novel?.title || '新作品项目';
  const genre = novel?.genre_profile || '未分类';
  const coverUrl = novel?.cover_url;

  // 判断是否为图片（Base64 或 http 链接）
  const isImageCover = Boolean(
    coverUrl && (coverUrl.startsWith('data:image') || coverUrl.startsWith('http') || coverUrl.startsWith('/'))
  );

  // 解析预设
  const effectivePresetId = presetId || (coverUrl?.startsWith('preset:') ? coverUrl : null);
  const preset = effectivePresetId
    ? getPresetById(effectivePresetId)
    : detectPresetByGenre(novel?.genre_profile);

  // 尺寸规则 (width, height, titleFontSize, badgeSize)
  const sizeClasses = {
    xs: 'w-[28px] h-[38px] text-[7px]',
    sm: 'w-[40px] h-[56px] text-[9px]',
    md: 'w-[96px] h-[134px] text-xs',
    lg: 'w-[130px] h-[180px] text-sm',
    xl: 'w-[190px] h-[264px] text-base',
  }[size];

  const authorText = customAuthor || '著 / 佚名';
  const subtitleText = customSubtitle || novel?.description || '';
  const stampText = customStamp || preset.sealText;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative group shrink-0 select-none ${sizeClasses} ${className} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      style={{ perspective: '800px' }}
      title={interactive ? '点击设定/更换作品封面' : title}
    >
      {/* 3D 实体书本容器与投影 */}
      <div
        className="w-full h-full rounded-r-md rounded-l-xs overflow-hidden relative transition-all duration-300 shadow-md group-hover:shadow-xl"
        style={{
          boxShadow:
            size === 'xs' || size === 'sm'
              ? '2px 3px 6px rgba(0,0,0,0.25)'
              : '4px 6px 18px rgba(0,0,0,0.3), 1px 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        {/* 书页右侧厚度边缘模拟 */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-l from-stone-400 via-stone-200 to-stone-400/30 z-20 pointer-events-none opacity-80" />

        {/* 丝带书签 (仅在 md, lg, xl 展示) */}
        {showRibbon && (size === 'md' || size === 'lg' || size === 'xl') && (
          <div
            className="absolute top-0 right-4 w-2.5 z-30 shadow-xs pointer-events-none transition-transform group-hover:translate-y-1 duration-200"
            style={{
              height: size === 'xl' ? '32px' : size === 'lg' ? '24px' : '18px',
              backgroundColor: preset.ribbonColor,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
          />
        )}

        {/* 书脊阴影条 (左侧 3D 弧线暗影) */}
        <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-gradient-to-r from-black/45 via-black/20 to-transparent z-20 pointer-events-none" />
        <div className="absolute left-[8%] top-0 bottom-0 w-[2px] bg-white/20 z-20 pointer-events-none" />

        {/* 封面表面内容：图片封面 vs 预设艺术封面 */}
        {isImageCover ? (
          <div className="w-full h-full relative overflow-hidden bg-stone-900">
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* 柔和暗角微光 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
          </div>
        ) : (
          /* 过程化艺术封面模板 */
          <div
            className={`w-full h-full bg-gradient-to-b ${preset.bgGradient} p-2 flex flex-col justify-between relative overflow-hidden`}
            style={{ color: preset.textColor }}
          >
            {/* 背景暗纹纹理 */}
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
              <svg width="100%" height="100%">
                <filter id="noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise)" />
              </svg>
            </div>

            {/* 线装书装饰线 (仅 stitch 风格展示针孔线迹) */}
            {preset.decorType === 'stitch' && (
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 border-r border-dashed border-amber-600/60 z-10 pointer-events-none flex flex-col justify-between py-1">
                <span className="w-1 h-1 -ml-0.5 rounded-full bg-amber-400/70" />
                <span className="w-1 h-1 -ml-0.5 rounded-full bg-amber-400/70" />
                <span className="w-1 h-1 -ml-0.5 rounded-full bg-amber-400/70" />
                <span className="w-1 h-1 -ml-0.5 rounded-full bg-amber-400/70" />
              </div>
            )}

            {/* 封面边框内衬 */}
            <div
              className="absolute inset-1.5 rounded-xs pointer-events-none border opacity-60"
              style={{ borderColor: preset.borderColor }}
            />

            {/* 顶栏徽标 */}
            <div className="relative z-10 pt-0.5 pl-1.5 flex items-center justify-between">
              {size !== 'xs' && (
                <span
                  className="font-serif tracking-widest uppercase opacity-85 text-[8px] sm:text-[9px]"
                  style={{ color: preset.accentColor }}
                >
                  {genre}
                </span>
              )}
            </div>

            {/* 中央书名主体 */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-1 my-auto">
              {/* 书名 */}
              <h4
                className={`font-serif font-black leading-tight tracking-wider line-clamp-3 ${
                  size === 'xl'
                    ? 'text-lg'
                    : size === 'lg'
                    ? 'text-sm'
                    : size === 'md'
                    ? 'text-[11px]'
                    : size === 'sm'
                    ? 'text-[9px]'
                    : 'text-[7px]'
                }`}
                style={{
                  textShadow:
                    preset.textColor.startsWith('#f') || preset.textColor.startsWith('#e')
                      ? '0 1px 3px rgba(0,0,0,0.7)'
                      : '0 1px 2px rgba(255,255,255,0.4)',
                }}
              >
                {title}
              </h4>

              {/* 装饰短分界线 */}
              {(size === 'lg' || size === 'xl') && (
                <div
                  className="w-8 h-0.5 my-1.5 opacity-60 rounded-full"
                  style={{ backgroundColor: preset.accentColor }}
                />
              )}

              {/* 副标题 / 腰封语 */}
              {(size === 'lg' || size === 'xl') && subtitleText && (
                <p className="text-[9px] line-clamp-2 opacity-75 font-serif max-w-[90%] scale-95 leading-tight">
                  {subtitleText}
                </p>
              )}
            </div>

            {/* 底栏：署名与印章 */}
            <div className="relative z-10 pb-0.5 px-1 flex items-end justify-between">
              {size !== 'xs' && size !== 'sm' ? (
                <span className="text-[8px] opacity-75 font-serif truncate max-w-[65px]">
                  {authorText}
                </span>
              ) : (
                <div />
              )}

              {/* 篆刻方印 */}
              <div
                className="w-4 h-4 rounded-xs border flex items-center justify-center font-serif text-[8px] font-bold leading-none shrink-0"
                style={{
                  borderColor: preset.sealColor,
                  color: preset.sealColor,
                  backgroundColor: preset.sealColor + '15',
                }}
                title="藏书印章"
              >
                {stampText.slice(0, 2)}
              </div>
            </div>
          </div>
        )}

        {/* 交互悬浮遮罩与按钮 (仅在 interactive 时展示) */}
        {interactive && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 z-40">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-lg mb-1 transform group-hover:scale-105 transition-transform">
              <Palette className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-[11px] font-medium tracking-wide">设定封面</span>
            <span className="text-[9px] opacity-70 mt-0.5">艺术封皮/本地图</span>
          </div>
        )}
      </div>
    </div>
  );
};
