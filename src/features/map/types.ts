export type MapMarkerCategory =
  | 'SECT'       // 宗门道场
  | 'CITY'       // 城池市镇
  | 'DUNGEON'    // 险地秘境
  | 'WILDERNESS' // 荒原绝岭
  | 'FORTRESS';  // 关隘要塞

export type DangerLevel = 'SAFE' | 'DANGEROUS' | 'FATAL';

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
  travelDays: number; // 徒步/飞行常规行程耗时（天数）
  dangerLevel: DangerLevel;
  description: string;
}

export interface NovelMap {
  id: string;
  novelId: string;
  title: string;
  bgTheme: 'PARCHMENT' | 'INK_DARK' | 'ANCIENT_JADE' | 'DESERT_BROWN';
  markers: MapMarker[];
  routes: MapRoute[];
  updatedAt: number;
}
