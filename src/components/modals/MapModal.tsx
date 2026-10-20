import React, { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { WorldRule } from '@/types';
import {
  X,
  Compass,
  MapPin,
  Route as RouteIcon,
  Plus,
  Trash2,
  Shield,
  Building,
  Mountain,
  Castle,
  Skull,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Edit3,
  Check,
  Palette,
} from 'lucide-react';
import {
  MapMarker,
  MapRoute,
  NovelMap,
  MapMarkerCategory,
  DangerLevel,
  MapBgTheme,
} from '@/features/map/types';
import { MapEngine } from '@/features/map/MapEngine';
import { alertDialog, confirmDialog } from '@/utils/dialog';
import { toast } from '@/stores/useToastStore';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

// -------------------------------------------------------------
// 大师级制图学专属矢量水印组件 (Cartographic Master Watermarks)
// -------------------------------------------------------------

/** 羊皮古卷：十六芒星航海罗盘玫瑰 (Compass Rose) */
const ParchmentCompassRoseWatermark: React.FC = () => (
  <svg
    viewBox="0 0 360 360"
    className="w-72 h-72 md:w-96 md:h-96 text-amber-900/[0.09] dark:text-amber-400/[0.06] select-none pointer-events-none transition-transform duration-1000"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="180" cy="180" r="160" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="180" cy="180" r="152" strokeWidth="1.5" />
    <circle cx="180" cy="180" r="136" strokeWidth="0.75" />
    <circle cx="180" cy="180" r="88" strokeWidth="1" strokeDasharray="6 4" />
    <circle cx="180" cy="180" r="32" strokeWidth="1" />
    <circle cx="180" cy="180" r="8" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />

    {/* 航海风向辐射测绘线 */}
    <line x1="20" y1="180" x2="340" y2="180" strokeWidth="0.75" strokeDasharray="8 6" />
    <line x1="180" y1="20" x2="180" y2="340" strokeWidth="0.75" strokeDasharray="8 6" />
    <line x1="67" y1="67" x2="293" y2="293" strokeWidth="0.5" strokeDasharray="6 6" />
    <line x1="293" y1="67" x2="67" y2="293" strokeWidth="0.5" strokeDasharray="6 6" />

    {/* 北主针 */}
    <polygon points="180,30 188,140 180,180" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="0.75" />
    <polygon points="180,30 172,140 180,180" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.75" />
    {/* 南主针 */}
    <polygon points="180,330 188,220 180,180" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.75" />
    <polygon points="180,330 172,220 180,180" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="0.75" />
    {/* 东主针 */}
    <polygon points="330,180 220,188 180,180" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="0.75" />
    <polygon points="330,180 220,172 180,180" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.75" />
    {/* 西主针 */}
    <polygon points="30,180 140,188 180,180" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.75" />
    <polygon points="30,180 140,172 180,180" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="0.75" />

    {/* 八方副芒针 */}
    <polygon points="286,74 205,160 180,180" fill="currentColor" fillOpacity="0.14" strokeWidth="0.5" />
    <polygon points="74,74 160,205 180,180" fill="currentColor" fillOpacity="0.14" strokeWidth="0.5" />
    <polygon points="286,286 160,205 180,180" fill="currentColor" fillOpacity="0.14" strokeWidth="0.5" />
    <polygon points="74,286 205,160 180,180" fill="currentColor" fillOpacity="0.14" strokeWidth="0.5" />

    <text x="180" y="52" textAnchor="middle" fontSize="11" fontFamily="serif" fill="currentColor" fillOpacity="0.4" stroke="none">N</text>
    <text x="180" y="324" textAnchor="middle" fontSize="11" fontFamily="serif" fill="currentColor" fillOpacity="0.4" stroke="none">S</text>
    <text x="320" y="184" textAnchor="middle" fontSize="11" fontFamily="serif" fill="currentColor" fillOpacity="0.4" stroke="none">E</text>
    <text x="42" y="184" textAnchor="middle" fontSize="11" fontFamily="serif" fill="currentColor" fillOpacity="0.4" stroke="none">W</text>
  </svg>
);

/** 深空星轨：精密浑天星仪与星门轨道 (Celestial Astrolabe & Orbital Rings) */
const CosmicAstrolabeWatermark: React.FC = () => (
  <svg
    viewBox="0 0 360 360"
    className="w-72 h-72 md:w-96 md:h-96 text-cyan-400/[0.12] select-none pointer-events-none transition-transform duration-1000"
    fill="none"
    stroke="currentColor"
  >
    {/* 中心星核 */}
    <circle cx="180" cy="180" r="14" strokeWidth="1.5" />
    <circle cx="180" cy="180" r="6" fill="currentColor" fillOpacity="0.3" />
    <circle cx="180" cy="180" r="38" strokeWidth="1" strokeDasharray="4 4" />

    {/* 轨道圆环与引力波层 */}
    <circle cx="180" cy="180" r="82" strokeWidth="1" strokeDasharray="12 6" />
    <circle cx="180" cy="180" r="126" strokeWidth="1.2" />
    <circle cx="180" cy="180" r="158" strokeWidth="0.8" strokeDasharray="2 4" />
    <circle cx="180" cy="180" r="168" strokeWidth="1.5" />

    {/* 天体黄道倾角大椭圆 (Orbit Ellipses) */}
    <ellipse cx="180" cy="180" rx="156" ry="68" transform="rotate(-28 180 180)" strokeWidth="1.2" strokeDasharray="8 4" />
    <ellipse cx="180" cy="180" rx="148" ry="46" transform="rotate(35 180 180)" strokeWidth="0.9" />

    {/* 象限坐标标尺与深空瞄准刻度 */}
    <line x1="180" y1="8" x2="180" y2="352" strokeWidth="0.75" strokeDasharray="16 8" />
    <line x1="8" y1="180" x2="352" y2="180" strokeWidth="0.75" strokeDasharray="16 8" />

    {/* 四周微型星位卫星点 */}
    <circle cx="288" cy="120" r="4" fill="currentColor" fillOpacity="0.4" strokeWidth="1" />
    <circle cx="72" cy="240" r="3" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />
    <circle cx="240" cy="270" r="2.5" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />
    <circle cx="110" cy="85" r="2" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />

    {/* 精密角刻度 */}
    <line x1="180" y1="12" x2="180" y2="24" strokeWidth="1.5" />
    <line x1="180" y1="336" x2="180" y2="348" strokeWidth="1.5" />
    <line x1="12" y1="180" x2="24" y2="180" strokeWidth="1.5" />
    <line x1="336" y1="180" x2="348" y2="180" strokeWidth="1.5" />
    <text x="180" y="28" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" stroke="none">000°</text>
    <text x="338" y="176" textAnchor="end" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" stroke="none">090°</text>
    <text x="180" y="332" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" stroke="none">180°</text>
    <text x="24" y="176" textAnchor="start" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.5" stroke="none">270°</text>
  </svg>
);

/** 仙道青玉：周天太极八卦灵轨 (Sacred Bagua & Daoist Talismanic Orbit) */
const AncientJadeBaguaWatermark: React.FC = () => (
  <svg
    viewBox="0 0 360 360"
    className="w-72 h-72 md:w-96 md:h-96 text-emerald-800/[0.11] select-none pointer-events-none transition-transform duration-1000"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="180" cy="180" r="162" strokeWidth="1.5" />
    <circle cx="180" cy="180" r="150" strokeWidth="0.8" strokeDasharray="3 3" />
    <circle cx="180" cy="180" r="128" strokeWidth="1" />
    <circle cx="180" cy="180" r="76" strokeWidth="0.8" strokeDasharray="8 4" />

    {/* 八角灵阵几何正八边形 */}
    <polygon
      points="233,52 288,107 288,180 288,253 233,308 127,308 72,253 72,107"
      strokeWidth="0.75"
      strokeDasharray="6 6"
    />
    <polygon
      points="180,48 273,87 312,180 273,273 180,312 87,273 48,180 87,87"
      strokeWidth="1"
    />

    {/* 中央太极游丝线 */}
    <circle cx="180" cy="180" r="48" strokeWidth="1.2" />
    <path
      d="M180,132 A24,24 0 0,1 180,180 A24,24 0 0,0 180,228"
      strokeWidth="1.2"
    />
    <circle cx="180" cy="156" r="4" fill="currentColor" fillOpacity="0.25" />
    <circle cx="180" cy="204" r="4" fill="currentColor" fillOpacity="0.25" />

    {/* 八方道纹刻度射线 */}
    <line x1="180" y1="18" x2="180" y2="48" strokeWidth="1.5" />
    <line x1="180" y1="312" x2="180" y2="342" strokeWidth="1.5" />
    <line x1="18" y1="180" x2="48" y2="180" strokeWidth="1.5" />
    <line x1="312" y1="180" x2="342" y2="180" strokeWidth="1.5" />

    <text x="180" y="38" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor" fillOpacity="0.35" stroke="none">乾</text>
    <text x="180" y="335" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor" fillOpacity="0.35" stroke="none">坤</text>
    <text x="330" y="184" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor" fillOpacity="0.35" stroke="none">离</text>
    <text x="32" y="184" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor" fillOpacity="0.35" stroke="none">坎</text>
  </svg>
);

/** 废土沙盘：战术要塞测绘标尺 (Tactical Hex Grid & Military Target Reticle) */
const DesertBrownSurveyWatermark: React.FC = () => (
  <svg
    viewBox="0 0 360 360"
    className="w-72 h-72 md:w-96 md:h-96 text-amber-900/[0.12] select-none pointer-events-none transition-transform duration-1000"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="180" cy="180" r="162" strokeWidth="1.5" />
    <circle cx="180" cy="180" r="148" strokeWidth="0.75" strokeDasharray="4 2" />
    <circle cx="180" cy="180" r="120" strokeWidth="1" strokeDasharray="16 8" />
    <circle cx="180" cy="180" r="50" strokeWidth="1" />
    <circle cx="180" cy="180" r="8" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />

    {/* 战术六边形要塞基准 */}
    <polygon points="180,70 275,125 275,235 180,290 85,235 85,125" strokeWidth="1" />
    <polygon points="180,95 253,138 253,222 180,265 107,222 107,138" strokeWidth="0.75" strokeDasharray="6 4" />

    {/* 十字战术测距瞄准线 */}
    <line x1="20" y1="180" x2="150" y2="180" strokeWidth="1" />
    <line x1="210" y1="180" x2="340" y2="180" strokeWidth="1" />
    <line x1="180" y1="20" x2="180" y2="150" strokeWidth="1" />
    <line x1="180" y1="210" x2="180" y2="340" strokeWidth="1" />

    <text x="180" y="40" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="currentColor" fillOpacity="0.4" stroke="none">GRID · 01</text>
    <text x="320" y="184" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.4" stroke="none">SEC · E</text>
    <text x="42" y="184" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="currentColor" fillOpacity="0.4" stroke="none">SEC · W</text>
  </svg>
);

/** 水墨暗夜：孤月寒江与文人闲章 (Solitary Moon & Seal) */
const InkDarkMoonWatermark: React.FC = () => (
  <svg
    viewBox="0 0 360 360"
    className="w-72 h-72 md:w-96 md:h-96 text-zinc-400/[0.1] select-none pointer-events-none transition-transform duration-1000"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="180" cy="180" r="160" strokeWidth="1" strokeDasharray="8 6" />
    <circle cx="180" cy="180" r="144" strokeWidth="1.2" />
    <circle cx="180" cy="180" r="64" strokeWidth="0.75" />

    {/* 工笔重峦叠嶂曲线 */}
    <path d="M36,230 Q90,185 140,215 T240,190 T324,230" strokeWidth="1.2" />
    <path d="M20,260 Q100,210 180,245 T340,250" strokeWidth="0.8" strokeDasharray="4 4" />

    {/* 纵横天元经纬细线 */}
    <line x1="180" y1="20" x2="180" y2="340" strokeWidth="0.5" strokeDasharray="12 12" />
    <line x1="20" y1="180" x2="340" y2="180" strokeWidth="0.5" strokeDasharray="12 12" />

    {/* 右上角仿古文人闲章方印 */}
    <rect x="220" y="80" width="46" height="46" rx="4" strokeWidth="1.2" />
    <rect x="224" y="84" width="38" height="38" rx="2" strokeWidth="0.6" strokeDasharray="2 2" />
    <text x="243" y="108" textAnchor="middle" fontSize="12" fontFamily="serif" fill="currentColor" fillOpacity="0.35" stroke="none">墨韵</text>
  </svg>
);

export interface MapThemeVisual {
  name: string;
  desc: string;
  isDark: boolean;
  bgStyle: React.CSSProperties;
  textColor: string;
  headerBg: string;
  panelBg: string;
  borderColor: string;
  watermark: React.ReactNode;
}

const THEME_CONFIGS: Record<MapBgTheme, MapThemeVisual> = {
  PARCHMENT: {
    name: '羊皮古卷',
    desc: '古典微黄宣纸温润纹理，适合古典仙侠、奇幻与历史',
    isDark: false,
    bgStyle: {
      backgroundColor: '#fbf7ee',
      backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(246, 238, 224, 0.6) 70%, rgba(226, 212, 190, 0.55) 100%),
        linear-gradient(rgba(180, 145, 95, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(180, 145, 95, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 72px 72px, 72px 72px',
    },
    textColor: '#574838',
    headerBg: '#f7f1e5',
    panelBg: '#f7f2e8',
    borderColor: '#e8dcce',
    watermark: <ParchmentCompassRoseWatermark />,
  },
  COSMIC_DEEP: {
    name: '深空星轨',
    desc: '深邃幽蓝星云与天体星相仪，适合硬核科幻、星际与深空探索',
    isDark: true,
    bgStyle: {
      backgroundColor: '#070a13',
      backgroundImage: `
        radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.09) 0%, transparent 65%),
        radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.07) 0%, transparent 55%),
        radial-gradient(circle at 20% 85%, rgba(16, 185, 129, 0.05) 0%, transparent 45%),
        linear-gradient(rgba(56, 189, 248, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.035) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 80px 80px, 80px 80px',
    },
    textColor: '#cbd5e1',
    headerBg: '#0b101c',
    panelBg: '#090e18',
    borderColor: '#1e293b',
    watermark: <CosmicAstrolabeWatermark />,
  },
  ANCIENT_JADE: {
    name: '仙道青玉',
    desc: '通透青白玉质与周天太极灵轨，适合凡人修仙、道门神朝',
    isDark: false,
    bgStyle: {
      backgroundColor: '#f3f8f4',
      backgroundImage: `
        radial-gradient(ellipse at 50% 45%, rgba(255, 255, 255, 0.6) 0%, rgba(232, 244, 235, 0.7) 70%, rgba(212, 232, 218, 0.5) 100%),
        linear-gradient(rgba(74, 138, 102, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74, 138, 102, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 72px 72px, 72px 72px',
    },
    textColor: '#2e4e3f',
    headerBg: '#eff5f0',
    panelBg: '#eef5f0',
    borderColor: '#d7e7dc',
    watermark: <AncientJadeBaguaWatermark />,
  },
  DESERT_BROWN: {
    name: '废土沙盘',
    desc: '苍茫风化沙砾与战术测绘标尺，适合末日辐射、避难所基建',
    isDark: false,
    bgStyle: {
      backgroundColor: '#f4ede1',
      backgroundImage: `
        radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.5) 0%, rgba(238, 227, 211, 0.7) 75%, rgba(218, 203, 180, 0.6) 100%),
        linear-gradient(rgba(160, 115, 60, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(160, 115, 60, 0.06) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 64px 64px, 64px 64px',
    },
    textColor: '#574229',
    headerBg: '#eee7d8',
    panelBg: '#ede5d5',
    borderColor: '#ded2be',
    watermark: <DesertBrownSurveyWatermark />,
  },
  INK_DARK: {
    name: '水墨暗夜',
    desc: '宋代工笔重峦冷月与天元星枰，适合悬疑异界与暗黑冒险',
    isDark: true,
    bgStyle: {
      backgroundColor: '#101013',
      backgroundImage: `
        radial-gradient(ellipse at 50% 40%, rgba(45, 45, 55, 0.6) 0%, rgba(18, 18, 22, 0.85) 70%, #0a0a0c 100%),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 80px 80px, 80px 80px',
    },
    textColor: '#cbd5e1',
    headerBg: '#131317',
    panelBg: '#0f0f12',
    borderColor: '#26262b',
    watermark: <InkDarkMoonWatermark />,
  },
};

export const MapModal: React.FC<Props> = ({
  isOpen = true,
  onClose,
  embedded = false,
}) => {
  const { activeNovel } = useNovelStore();
  const [worldRules, setWorldRules] = useState<WorldRule[]>([]);
  const [map, setMap] = useState<NovelMap | null>(null);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // 连线创建中状态
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  // 坐标拾取模式
  const [isAddingMarker, setIsAddingMarker] = useState(false);

  // 标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // 拖拽地标状态
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    markerId: string;
    clientX: number;
    clientY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  } | null>(null);

  // 画布容器
  const canvasRef = useRef<HTMLDivElement>(null);

  // 加载世界规则与地图
  useEffect(() => {
    if (!activeNovel) return;
    (async () => {
      try {
        const rules = await api.listWorldRules(activeNovel.id);
        setWorldRules(rules);
        const loadedMap = MapEngine.loadMapFromStorage(
          activeNovel.id,
          rules,
          activeNovel.title,
          (activeNovel as any).genreProfile
        );
        setMap(loadedMap);
        setTitleDraft(loadedMap.title);
      } catch (e) {
        console.warn('加载世界法则或沙盘地图失败:', e);
      }
    })();
  }, [activeNovel]);

  if (!isOpen && !embedded) return null;
  if (!map) return null;

  const currentTheme: MapBgTheme = map.bgTheme || 'PARCHMENT';
  const themeConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.PARCHMENT;

  const saveCurrentMap = (updatedMap: NovelMap) => {
    setMap(updatedMap);
    MapEngine.saveMapToStorage(updatedMap);
  };

  // 更改地图标题
  const handleSaveTitle = () => {
    const finalTitle = titleDraft.trim() || MapEngine.getDefaultTitle(activeNovel?.title, (activeNovel as any)?.genreProfile);
    const updated = { ...map, title: finalTitle, updatedAt: Date.now() };
    saveCurrentMap(updated);
    setTitleDraft(finalTitle);
    setIsEditingTitle(false);
    toast.success('地图名称已更新', finalTitle);
  };

  // 切换背景主题风格
  const handleChangeTheme = (newTheme: MapBgTheme) => {
    const updated: NovelMap = { ...map, bgTheme: newTheme, updatedAt: Date.now() };
    saveCurrentMap(updated);
    toast.info('底图风格切换', `已切换至【${THEME_CONFIGS[newTheme].name}】风格`);
  };

  // 点击画布添加地标
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !isAddingMarker) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      name: `新据点 #${map.markers.length + 1}`,
      category: 'CITY',
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      description: '点击编辑此地标风貌、阵营从属及战略意义',
    };

    const updated = {
      ...map,
      markers: [...map.markers, newMarker],
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
    setSelectedMarkerId(newMarker.id);
    setSelectedRouteId(null);
    setIsAddingMarker(false);
  };

  // 地标指针按下（准备拖拽或点击）
  const handleMarkerPointerDown = (marker: MapMarker, e: React.PointerEvent) => {
    if (isConnecting || isAddingMarker) return;
    if (e.button !== 0) return; // 仅左键响应
    e.stopPropagation();

    dragStartRef.current = {
      markerId: marker.id,
      clientX: e.clientX,
      clientY: e.clientY,
      originX: marker.x,
      originY: marker.y,
      hasMoved: false,
    };
    setDraggingMarkerId(marker.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 地标指针移动（实时拖拽）
  const handleMarkerPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !canvasRef.current) return;
    const { markerId, clientX, clientY, originX, originY } = dragStartRef.current;

    const dx = e.clientX - clientX;
    const dy = e.clientY - clientY;

    if (Math.hypot(dx, dy) > 4) {
      dragStartRef.current.hasMoved = true;
    }

    if (dragStartRef.current.hasMoved) {
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaXPercent = (dx / rect.width) * 100;
      const deltaYPercent = (dy / rect.height) * 100;

      const newX = Math.round(Math.max(4, Math.min(96, originX + deltaXPercent)));
      const newY = Math.round(Math.max(4, Math.min(96, originY + deltaYPercent)));

      setMap((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          markers: prev.markers.map((m) => (m.id === markerId ? { ...m, x: newX, y: newY } : m)),
        };
      });
    }
  };

  // 地标指针抬起（完成拖拽或触发点击）
  const handleMarkerPointerUp = (markerId: string, e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const dragInfo = dragStartRef.current;
    dragStartRef.current = null;
    setDraggingMarkerId(null);

    if (dragInfo && dragInfo.hasMoved) {
      // 触发了拖拽，持久化当前坐标
      if (map) {
        MapEngine.saveMapToStorage(map);
      }
      setSelectedMarkerId(markerId);
      setSelectedRouteId(null);
    } else {
      // 原地轻点，处理选中与连线
      handleMarkerClick(markerId, e);
    }
  };

  // 点击地标
  const handleMarkerClick = (markerId: string, e: React.SyntheticEvent) => {
    e.stopPropagation();

    if (isConnecting && connectFromId && connectFromId !== markerId) {
      // 完成连线创建
      const fromM = map.markers.find((m) => m.id === connectFromId);
      const toM = map.markers.find((m) => m.id === markerId);

      if (fromM && toM) {
        const newRoute: MapRoute = {
          id: `route-${Date.now()}`,
          name: `${fromM.name.slice(0, 4)} ➔ ${toM.name.slice(0, 4)} 路线`,
          fromMarkerId: fromM.id,
          toMarkerId: toM.id,
          travelDays: 3,
          dangerLevel: 'SAFE',
          description: '常规行军探索与交通驿道',
        };
        const updated = {
          ...map,
          routes: [...map.routes, newRoute],
          updatedAt: Date.now(),
        };
        saveCurrentMap(updated);
        toast.success('路线创建成功', newRoute.name);
      }
      setIsConnecting(false);
      setConnectFromId(null);
      return;
    }

    setSelectedMarkerId(markerId);
    setSelectedRouteId(null);
  };

  // 删除地标
  const handleDeleteMarker = (markerId: string) => {
    const updated = {
      ...map,
      markers: map.markers.filter((m) => m.id !== markerId),
      routes: map.routes.filter((r) => r.fromMarkerId !== markerId && r.toMarkerId !== markerId),
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
    if (selectedMarkerId === markerId) setSelectedMarkerId(null);
  };

  // 删除路线
  const handleDeleteRoute = (routeId: string) => {
    const updated = {
      ...map,
      routes: map.routes.filter((r) => r.id !== routeId),
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
    if (selectedRouteId === routeId) setSelectedRouteId(null);
  };

  // 更新地标属性
  const handleUpdateMarker = (markerId: string, patch: Partial<MapMarker>) => {
    const updated = {
      ...map,
      markers: map.markers.map((m) => (m.id === markerId ? { ...m, ...patch } : m)),
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
  };

  // 更新路线属性
  const handleUpdateRoute = (routeId: string, patch: Partial<MapRoute>) => {
    const updated = {
      ...map,
      routes: map.routes.map((r) => (r.id === routeId ? { ...r, ...patch } : r)),
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
  };

  // 反哺世界观法则（Canon）
  const handleSaveMarkerAsCanon = async (marker: MapMarker) => {
    if (!activeNovel) return;
    try {
      const newRule = await api.createWorldRule({
        novel_id: activeNovel.id,
        title: marker.name,
        rule_content: marker.description || `${marker.name}，重要地理地标与战略要冲。`,
        authority_level: 'CANON',
      });
      setWorldRules((prev) => [...prev, newRule]);
      handleUpdateMarker(marker.id, { linkedWorldRuleId: newRule.id });
      toast.success('反哺成功', `已将【${marker.name}】录入为世界观正典法则！`);
    } catch (e: any) {
      toast.error('反哺失败', e?.message || '创建世界法则出错');
    }
  };

  // 根据当前世界法则与题材重新智能生成沙盘
  const handleRegenerateSandbox = async () => {
    if (!activeNovel) return;
    const confirmed = await confirmDialog({
      title: '重新智能推演沙盘',
      message: '确定基于当前小说的世界观法则与流派特征，重新推演沙盘地标与探索路线？当前自定义地标将被重塑。',
      confirmText: '确定重塑',
      cancelText: '取消',
    });
    if (!confirmed) return;

    try {
      const freshMap = MapEngine.generateMapFromRules(
        activeNovel.id,
        worldRules,
        activeNovel.title,
        (activeNovel as any)?.genreProfile
      );
      saveCurrentMap(freshMap);
      setSelectedMarkerId(null);
      setSelectedRouteId(null);
      setTitleDraft(freshMap.title);
      toast.success('沙盘重塑完成', `已基于【${activeNovel.title}】的题材法则全新重构！`);
    } catch (e: any) {
      toast.error('重塑失败', e?.message || '推演沙盘过程出错');
    }
  };

  const selectedMarker = map.markers.find((m) => m.id === selectedMarkerId);
  const selectedRoute = map.routes.find((r) => r.id === selectedRouteId);
  const routeFromMarker = selectedRoute ? map.markers.find((m) => m.id === selectedRoute.fromMarkerId) : null;
  const routeToMarker = selectedRoute ? map.markers.find((m) => m.id === selectedRoute.toMarkerId) : null;
  const speedCausality =
    selectedRoute && routeFromMarker && routeToMarker
      ? MapEngine.verifyTravelSpeed(routeFromMarker, routeToMarker, selectedRoute.travelDays)
      : null;

  // 获得地标图标
  const getMarkerIcon = (category: MapMarkerCategory) => {
    switch (category) {
      case 'SECT':
        return <Building className="w-3.5 h-3.5 text-primary" />;
      case 'CITY':
        return <Castle className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />;
      case 'DUNGEON':
        return <Skull className="w-3.5 h-3.5 text-rose-800 dark:text-rose-400" />;
      case 'WILDERNESS':
        return <Mountain className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />;
      case 'FORTRESS':
        return <Shield className="w-3.5 h-3.5 text-purple-800 dark:text-purple-400" />;
      case 'LANDMARK':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const isDark = themeConfig.isDark;

  const content = (
    <div
      className={`flex flex-col h-full select-none transition-colors duration-300 ${
        isDark ? 'bg-[#090e18] text-slate-200' : 'bg-surface-2 dark:bg-[#1a1714] text-ink dark:text-[#dfdbd0]'
      } ${embedded ? '' : 'rounded-2xl shadow-2xl border overflow-hidden'}`}
      style={{ borderColor: themeConfig.borderColor }}
    >
      {/* Top Header */}
      {!embedded && (
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0 transition-colors duration-300"
          style={{ backgroundColor: themeConfig.headerBg, borderColor: themeConfig.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs ${
                isDark
                  ? 'bg-gradient-to-tr from-cyan-900 to-blue-700 text-cyan-200 border border-cyan-500/30'
                  : 'bg-gradient-to-tr from-amber-800 to-yellow-800'
              }`}
            >
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      autoFocus
                      className={`px-2 py-0.5 text-sm font-bold rounded border outline-none ${
                        isDark
                          ? 'border-cyan-500/50 bg-[#121a2c] text-slate-100'
                          : 'border-primary/50 bg-white dark:bg-[#151210]'
                      }`}
                    />
                    <button
                      onClick={handleSaveTitle}
                      className={`p-1 rounded transition cursor-pointer ${
                        isDark ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30' : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}
                      title="保存名称"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3
                      onClick={() => setIsEditingTitle(true)}
                      className={`font-bold text-sm tracking-wide transition cursor-pointer flex items-center gap-1.5 ${
                        isDark ? 'hover:text-cyan-400 text-slate-100' : 'hover:text-primary text-ink'
                      }`}
                      title="点击修改沙盘名称"
                    >
                      <span>{map.title}</span>
                      <Edit3
                        className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition ${
                          isDark ? 'text-slate-400 group-hover:text-cyan-400' : 'text-ink-2 group-hover:text-primary'
                        }`}
                      />
                    </h3>
                  </div>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isDark
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'
                      : 'bg-amber-800/10 text-primary border-amber-800/20'
                  }`}
                >
                  {themeConfig.name}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-ink-2 dark:text-[#a0978d]'}`}>
                地标势力坐标定标、行军探索路线规划与行程因果校对（支持自由拖拽与流派背景定制）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div
        className="px-4 py-2 border-b flex items-center justify-between shrink-0 text-xs flex-wrap gap-2 transition-colors duration-300"
        style={{ backgroundColor: themeConfig.headerBg, borderColor: themeConfig.borderColor }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingMarker(!isAddingMarker)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isAddingMarker
                ? isDark
                  ? 'bg-cyan-600 text-white animate-pulse shadow-cyan-900/50'
                  : 'bg-amber-800 text-white animate-pulse'
                : isDark
                ? 'bg-[#151e30] border border-slate-700/80 text-slate-200 hover:bg-[#1d2942] hover:text-white'
                : 'bg-white dark:bg-[#2a241f] border border-line dark:border-[#38332d] text-[#4a3b2c] dark:text-[#c4b5a2] hover:bg-surface-3-hover'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingMarker ? '点击沙盘画布任意位置放置据点' : '新增地标据点'}</span>
          </button>

          <button
            onClick={async () => {
              if (selectedMarkerId) {
                setIsConnecting(true);
                setConnectFromId(selectedMarkerId);
              } else {
                await alertDialog('请先在沙盘中点击选定一个起始地标！');
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isConnecting
                ? 'bg-blue-600 text-white animate-pulse'
                : isDark
                ? 'bg-[#151e30] border border-slate-700/80 text-slate-200 hover:bg-[#1d2942] hover:text-white'
                : 'bg-white dark:bg-[#2a241f] border border-line dark:border-[#38332d] text-[#4a3b2c] dark:text-[#c4b5a2] hover:bg-surface-3-hover'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5" />
            <span>{isConnecting ? '点击目标地标完成路线连接' : '绘制行军/探索路线'}</span>
          </button>
        </div>

        {/* Theme Selector & Stats */}
        <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>
          {/* Quick Theme Switcher */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              isDark
                ? 'bg-[#141b2a] border-slate-700/70 text-slate-200'
                : 'bg-white/80 dark:bg-[#26211c] border-line dark:border-[#38332d] text-ink'
            }`}
          >
            <Palette className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-amber-700 dark:text-amber-400'}`} />
            <select
              value={currentTheme}
              onChange={(e) => handleChangeTheme(e.target.value as MapBgTheme)}
              className="bg-transparent text-[11px] font-medium outline-none cursor-pointer"
            >
              <option value="PARCHMENT" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>羊皮古卷</option>
              <option value="COSMIC_DEEP" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>深空星轨</option>
              <option value="ANCIENT_JADE" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>仙道青玉</option>
              <option value="DESERT_BROWN" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>废土沙盘</option>
              <option value="INK_DARK" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>水墨暗夜</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span>地标：{map.markers.length} 个</span>
            <span>• 路线：{map.routes.length} 条</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Canvas Surface */}
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`flex-1 relative overflow-hidden flex items-center justify-center select-none ${
            isAddingMarker ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={themeConfig.bgStyle}
        >
          {/* Cartographer Corner Coordinates & Reticles (制图师四角微标) */}
          <div
            className="absolute top-2.5 left-3 text-[10px] font-mono pointer-events-none select-none flex items-center gap-1 opacity-40 transition-opacity"
            style={{ color: themeConfig.textColor }}
          >
            <span>✛</span>
            <span>00°00′00″ N</span>
          </div>
          <div
            className="absolute top-2.5 right-3 text-[10px] font-mono pointer-events-none select-none flex items-center gap-1 opacity-40 transition-opacity"
            style={{ color: themeConfig.textColor }}
          >
            <span>090°00′00″ E</span>
            <span>✛</span>
          </div>
          <div
            className="absolute bottom-2.5 left-3 text-[10px] font-mono pointer-events-none select-none flex items-center gap-1 opacity-40 transition-opacity"
            style={{ color: themeConfig.textColor }}
          >
            <span>✛</span>
            <span>00°00′00″ S</span>
          </div>
          <div
            className="absolute bottom-2.5 right-3 text-[10px] font-mono pointer-events-none select-none flex items-center gap-1 opacity-40 transition-opacity"
            style={{ color: themeConfig.textColor }}
          >
            <span>090°00′00″ W</span>
            <span>✛</span>
          </div>

          {/* Vignette Depth Overlay (四周自然柔和景深暗角) */}
          <div
            className="absolute inset-0 pointer-events-none select-none transition-all duration-500"
            style={{
              boxShadow: isDark
                ? 'inset 0 0 100px rgba(0, 0, 0, 0.75), inset 0 0 35px rgba(0, 0, 0, 0.9)'
                : 'inset 0 0 70px rgba(120, 80, 20, 0.08), inset 0 0 25px rgba(120, 80, 20, 0.05)',
            }}
          />

          {/* Theme Master Watermark (大尺寸专属细线矢量水印) */}
          <div className="absolute right-6 bottom-6 pointer-events-none select-none">
            {themeConfig.watermark}
          </div>

          {/* SVG Routes Lines Rendering */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <filter id="route-glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="route-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {map.routes.map((route) => {
              const fromM = map.markers.find((m) => m.id === route.fromMarkerId);
              const toM = map.markers.find((m) => m.id === route.toMarkerId);
              if (!fromM || !toM) return null;

              const isSelected = selectedRouteId === route.id;

              return (
                <g key={route.id} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedRouteId(route.id)}>
                  <line
                    x1={`${fromM.x}%`}
                    y1={`${fromM.y}%`}
                    x2={`${toM.x}%`}
                    y2={`${toM.y}%`}
                    stroke={
                      isSelected
                        ? '#f59e0b'
                        : route.dangerLevel === 'FATAL'
                        ? '#ef4444'
                        : route.dangerLevel === 'DANGEROUS'
                        ? '#f97316'
                        : isDark
                        ? '#38bdf8'
                        : '#65a30d'
                    }
                    strokeWidth={isSelected ? 3.5 : 2}
                    strokeDasharray={route.dangerLevel === 'SAFE' ? 'none' : '5,4'}
                    strokeOpacity={isSelected ? 0.95 : isDark ? 0.65 : 0.8}
                    filter={isSelected ? 'url(#route-glow-amber)' : isDark ? 'url(#route-glow-cyan)' : undefined}
                    className="transition-all hover:stroke-width-4"
                  />
                </g>
              );
            })}
          </svg>

          {/* Route Floating Pill Badges (彻底消除折线穿字，高可读性毛玻璃药丸标签) */}
          {map.routes.map((route) => {
            const fromM = map.markers.find((m) => m.id === route.fromMarkerId);
            const toM = map.markers.find((m) => m.id === route.toMarkerId);
            if (!fromM || !toM) return null;

            const isSelected = selectedRouteId === route.id;
            const midX = (fromM.x + toM.x) / 2;
            const midY = (fromM.y + toM.y) / 2;

            return (
              <div
                key={`badge-${route.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRouteId(route.id);
                  setSelectedMarkerId(null);
                }}
                style={{ left: `${midX}%`, top: `${midY}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-sans flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs select-none shadow-sm ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-950/95 text-amber-200 border border-amber-500/80 ring-2 ring-amber-500/40 shadow-lg font-bold scale-105'
                      : 'bg-amber-100/95 text-amber-950 border border-amber-600/80 ring-2 ring-amber-600/30 shadow-md font-bold scale-105'
                    : isDark
                    ? 'bg-[#0f172a]/90 text-slate-300 border border-slate-700/70 hover:border-cyan-400/70 hover:text-white hover:bg-slate-900'
                    : 'bg-white/95 text-[#4a3b2c] border border-amber-900/20 hover:border-amber-700/50 hover:bg-amber-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    route.dangerLevel === 'FATAL'
                      ? 'bg-rose-500 ring-2 ring-rose-500/30 animate-pulse'
                      : route.dangerLevel === 'DANGEROUS'
                      ? 'bg-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="truncate max-w-[120px]">{route.name}</span>
                <span className="opacity-75 text-[9px] font-mono shrink-0">({route.travelDays}天)</span>
              </div>
            );
          })}

          {/* Marker Nodes Rendering (自适应流派呼吸发光环与高质感标记) */}
          {map.markers.map((marker) => {
            const isSelected = selectedMarkerId === marker.id;
            const isConnectSource = connectFromId === marker.id;
            const isDragging = draggingMarkerId === marker.id;

            return (
              <div
                key={marker.id}
                onPointerDown={(e) => handleMarkerPointerDown(marker, e)}
                onPointerMove={handleMarkerPointerMove}
                onPointerUp={(e) => handleMarkerPointerUp(marker.id, e)}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab active:cursor-grabbing transition-transform duration-75 z-20 group ${
                  isDragging ? 'scale-125 z-40' : isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                }`}
              >
                {/* Marker Pin Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isConnectSource
                      ? 'bg-blue-600 border-2 border-white text-white animate-bounce shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                      : isSelected
                      ? 'bg-amber-600 border-2 border-white text-white ring-4 ring-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                      : isDark
                      ? 'bg-[#0b1324]/90 border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:border-cyan-300 hover:text-white hover:bg-slate-900'
                      : 'bg-gradient-to-b from-[#fffefc] to-[#f4ebe0] border border-[#854d0e]/60 text-[#5c3e1e] shadow-md hover:border-amber-700'
                  }`}
                >
                  {getMarkerIcon(marker.category)}
                </div>

                {/* Marker Name Badge */}
                <div
                  className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-md font-serif text-[11px] pointer-events-none flex items-center gap-1.5 shadow-md border ${
                    isDark
                      ? 'bg-[#080d18]/90 text-slate-200 border-slate-700/60'
                      : 'bg-[#2c2825]/90 text-amber-50 border-amber-950/40'
                  }`}
                >
                  <span>{marker.name}</span>
                  {marker.linkedWorldRuleId && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="已绑定权威世界法则" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Attribute Inspector Drawer (自适应主题色阶与边框) */}
        <div
          className="w-full md:w-80 border-l p-4 flex flex-col gap-3.5 shrink-0 overflow-y-auto text-xs transition-colors duration-300"
          style={{ backgroundColor: themeConfig.panelBg, borderColor: themeConfig.borderColor }}
        >
          {selectedMarker ? (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <span className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-cyan-300' : 'text-primary'}`}>
                  <MapPin className="w-4 h-4" />
                  地标据点属性检视
                </span>
                <button
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                  title="删除此地标"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>地标名称</label>
                <input
                  type="text"
                  value={selectedMarker.name}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { name: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-medium outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100 focus:border-cyan-400'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>地势与流派品类</label>
                <select
                  value={selectedMarker.category}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { category: e.target.value as MapMarkerCategory })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                >
                  <option value="SECT" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>宗门道场 / 科研中枢 / 核心学派</option>
                  <option value="CITY" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>都城重镇 / 星际都会 / 聚落基地</option>
                  <option value="DUNGEON" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>上古秘境 / 险境迷区 / 异常地带</option>
                  <option value="WILDERNESS" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>蛮荒异域 / 深空荒原 / 辐射废土</option>
                  <option value="FORTRESS" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>边境要塞 / 轨道要塞 / 军事重垒</option>
                  <option value="LANDMARK" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>自然奇观 / 星门要冲 / 奇观界碑</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>绑定世界法则 (Canon)</label>
                  {!selectedMarker.linkedWorldRuleId && (
                    <button
                      onClick={() => handleSaveMarkerAsCanon(selectedMarker)}
                      className={`text-[10px] flex items-center gap-0.5 cursor-pointer font-bold ${
                        isDark ? 'text-cyan-400 hover:underline' : 'text-primary hover:underline'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>存为权威法则</span>
                    </button>
                  )}
                </div>
                <select
                  value={selectedMarker.linkedWorldRuleId || ''}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { linkedWorldRuleId: e.target.value || undefined })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                >
                  <option value="" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>-- 未关联特定世界法则 --</option>
                  {worldRules.map((r) => (
                    <option key={r.id} value={r.id} className={isDark ? 'bg-slate-900 text-slate-200' : ''}>
                      [{r.authority_level}] {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>风貌景致与地理描述</label>
                <textarea
                  rows={4}
                  value={selectedMarker.description}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { description: e.target.value })}
                  placeholder="描写此处的气候地势、阵营归属、战略要害或险阻..."
                  className={`w-full p-2.5 rounded-lg border font-serif leading-relaxed outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100 placeholder-slate-500'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              <div
                className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-center justify-between border ${
                  isDark
                    ? 'bg-cyan-950/30 text-cyan-300 border-cyan-800/40'
                    : 'bg-amber-800/10 text-primary border-amber-800/20'
                }`}
              >
                <span>坐标：X: {selectedMarker.x}% | Y: {selectedMarker.y}%</span>
                <span className="text-[10px] opacity-75">可在沙盘直接按住拖拽</span>
              </div>
            </div>
          ) : selectedRoute ? (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <span className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                  <RouteIcon className="w-4 h-4 text-blue-500" />
                  路线属性检视
                </span>
                <button
                  onClick={() => handleDeleteRoute(selectedRoute.id)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                  title="删除此路线"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>路线名称</label>
                <input
                  type="text"
                  value={selectedRoute.name}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { name: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-medium outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100 focus:border-cyan-400'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>常规行程耗时（天数/跃迁轮数）</label>
                <input
                  type="number"
                  min={1}
                  value={selectedRoute.travelDays}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { travelDays: Math.max(1, parseInt(e.target.value) || 1) })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>途中危险程度</label>
                <select
                  value={selectedRoute.dangerLevel}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { dangerLevel: e.target.value as DangerLevel })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                >
                  <option value="SAFE" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>安全通路 · 巡防严密/航道畅通</option>
                  <option value="DANGEROUS" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>凶险凶道 · 异兽出没/风暴迷雾</option>
                  <option value="FATAL" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>九死一生 · 绝命死地/黑洞引力陷阱</option>
                </select>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>沿途历险备注</label>
                <textarea
                  rows={3}
                  value={selectedRoute.description}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { description: e.target.value })}
                  placeholder="记录沿途补给站、埋伏点或通关禁制..."
                  className={`w-full p-2.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100 placeholder-slate-500'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              {speedCausality && !speedCausality.isReasonable && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{speedCausality.warning}</span>
                </div>
              )}
            </div>
          ) : (
            /* Global Sandbox Configuration & Overview */
            <div className="flex flex-col gap-4">
              <div
                className="border-b pb-2"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <span className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-cyan-300' : 'text-primary'}`}>
                  <Compass className="w-4 h-4" />
                  沙盘全局设置与概览
                </span>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>沙盘地图名称</label>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  placeholder="自拟沙盘名称，如【苍穹星系全图】"
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-medium outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100 focus:border-cyan-400'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>底图流派风格</label>
                <select
                  value={currentTheme}
                  onChange={(e) => handleChangeTheme(e.target.value as MapBgTheme)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121927] border-slate-700/80 text-slate-100'
                      : 'bg-white dark:bg-[#1a1714] border-line dark:border-[#38332d]'
                  }`}
                >
                  <option value="PARCHMENT" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>羊皮古卷（古典修真/仙侠/奇幻）</option>
                  <option value="COSMIC_DEEP" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>深空星轨（硬核科幻/星际探索）</option>
                  <option value="ANCIENT_JADE" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>仙道青玉（宗门灵脉/神朝秘境）</option>
                  <option value="DESERT_BROWN" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>废土沙盘（末日辐射/求生基建）</option>
                  <option value="INK_DARK" className={isDark ? 'bg-slate-900 text-slate-200' : ''}>水墨暗夜（悬疑谍影/冷峻暗黑）</option>
                </select>
                <p className={`text-[10px] mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>
                  {themeConfig.desc}
                </p>
              </div>

              {/* Sandbox Regenerate Button */}
              <div
                className="pt-2 border-t"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <button
                  onClick={handleRegenerateSandbox}
                  className={`w-full py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isDark
                      ? 'bg-[#141d2e] hover:bg-[#1b263b] border-slate-700 text-slate-200'
                      : 'bg-surface-3 hover:bg-surface-3-hover dark:bg-[#28231e] dark:hover:bg-[#332d26] border-line dark:border-[#38332d] text-ink dark:text-[#ede6dc]'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-primary'}`} />
                  <span>依据当前世界法则重塑沙盘</span>
                </button>
                <p className={`text-[10px] mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>
                  自动扫描当前作品世界观法则提取地标，构建新沙盘
                </p>
              </div>

              {/* Sandbox Quick Statistics */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isDark ? 'bg-[#101726]/80 border-slate-800' : 'bg-white/60 dark:bg-[#161311] border-line dark:border-[#302a24]'
                }`}
              >
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-ink-2'}`}>沙盘现状统计</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-2 rounded ${isDark ? 'bg-[#151e30]' : 'bg-surface-2 dark:bg-[#201c18]'}`}>
                    <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>地标据点</span>
                    <span className={`font-bold text-base ${isDark ? 'text-cyan-400' : 'text-primary'}`}>{map.markers.length}</span>
                  </div>
                  <div className={`p-2 rounded ${isDark ? 'bg-[#151e30]' : 'bg-surface-2 dark:bg-[#201c18]'}`}>
                    <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-ink-2'}`}>通达路线</span>
                    <span className={`font-bold text-base ${isDark ? 'text-blue-400' : 'text-blue-700 dark:text-blue-400'}`}>{map.routes.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Operation Guide */}
              <div
                className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex flex-col gap-1 border ${
                  isDark ? 'bg-[#101726]/60 text-slate-400 border-slate-800' : 'bg-surface-3/50 dark:bg-[#241f1b] text-ink-2 border-line/40'
                }`}
              >
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-ink dark:text-[#dfdbd0]'}`}>快捷操作提示：</span>
                <span>• 鼠标按住地标可自由平移拖拽，路线自动跟随</span>
                <span>• 点击地标再点“绘制路线”即可连接两地</span>
                <span>• 点击顶栏标题可随时重命名沙盘</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[85vh]">{content}</div>
    </div>
  );
};
