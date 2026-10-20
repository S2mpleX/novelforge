export type MapMarkerCategory =
  | 'SECT'       // 宗门道场 / 核心总部 / 空间要塞
  | 'CITY'       // 都城重镇 / 星际城市 / 凡俗市镇
  | 'DUNGEON'    // 险地秘境 / 异象深空 / 上古遗迹
  | 'WILDERNESS' // 荒原绝岭 / 茫茫星海 / 废土深处
  | 'FORTRESS'   // 边塞要塞 / 星门哨所 / 防御关隘
  | 'LANDMARK';  // 自然奇观 / 标志天堑 / 核心地标

export type DangerLevel = 'SAFE' | 'DANGEROUS' | 'FATAL';

export type MapBgTheme =
  | 'PARCHMENT'    // 古卷羊皮纸 (古雅温润，适合传统奇幻/历史)
  | 'COSMIC_DEEP'  // 深空星轨图 (深邃幽蓝科技网格，适合科幻太空)
  | 'ANCIENT_JADE' // 青绿山水璧 (清润青玉质感，适合仙道修真)
  | 'DESERT_BROWN' // 大漠废土荒 (苍茫沙砾斑驳，适合末日废土)
  | 'INK_DARK';    // 水墨暗夜图 (炭黑古籍刻度，适合暗黑悬疑)

export interface MapMarker {
  id: string;
  name: string;
  category: MapMarkerCategory;
  x: number; // 0 ~ 100 percentage
  y: number; // 0 ~ 100 percentage
  description: string;
  linkedWorldRuleId?: string;
}

export interface MapRoute {
  id: string;
  name: string;
  fromMarkerId: string;
  toMarkerId: string;
  travelDays: number; // 徒步/飞行/跃迁常规行程耗时（天数）
  dangerLevel: DangerLevel;
  description: string;
}

export interface NovelMap {
  id: string;
  novelId: string;
  title: string;
  bgTheme: MapBgTheme;
  markers: MapMarker[];
  routes: MapRoute[];
  updatedAt: number;
}

