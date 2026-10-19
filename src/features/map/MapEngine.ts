import { WorldRule } from '@/types';
import { NovelMap, MapMarker, MapRoute } from './types';

export class MapEngine {
  /**
   * 生成默认初始化沙盘地图
   */
  static createDefaultMap(novelId: string, worldRules: WorldRule[] = []): NovelMap {
    const defaultMarkers: MapMarker[] = [];

    // 从现有地理或宗门法则中提取地标候选
    const geoRules = worldRules.filter(
      (r) =>
        r.authority_level !== 'DEPRECATED' &&
        (r.title?.includes('地理') ||
          r.title?.includes('宗门') ||
          r.title?.includes('宗') ||
          r.title?.includes('门') ||
          r.title?.includes('城') ||
          r.title?.includes('阁') ||
          r.rule_content?.includes('地理') ||
          r.rule_content?.includes('宗门'))
    );

    if (geoRules.length > 0) {
      geoRules.slice(0, 5).forEach((rule, idx) => {
        // 分布在画布四周
        const angle = (idx / Math.min(geoRules.length, 5)) * 2 * Math.PI;
        const x = Math.round(50 + 35 * Math.cos(angle));
        const y = Math.round(50 + 35 * Math.sin(angle));

        defaultMarkers.push({
          id: `marker-${Date.now()}-${idx}`,
          name: rule.title,
          category: rule.title.includes('宗') || rule.title.includes('门') ? 'SECT' : 'CITY',
          x,
          y,
          description: rule.rule_content.slice(0, 80),
          linkedWorldRuleId: rule.id,
        });
      });
    } else {
      // 预设三个标准沙盘地标
      defaultMarkers.push(
        {
          id: `m-1`,
          name: '青云主峰 · 宗门大殿',
          category: 'SECT',
          x: 25,
          y: 35,
          description: '宗门立派祖庭，群峰环抱，护山大阵日夜流转',
        },
        {
          id: `m-2`,
          name: '天斗古城 · 凡俗重镇',
          category: 'CITY',
          x: 70,
          y: 40,
          description: '商贾云集之重镇，仙凡交界贸易枢纽',
        },
        {
          id: `m-3`,
          name: '落日深渊 · 上古险地',
          category: 'DUNGEON',
          x: 48,
          y: 80,
          description: '瘴气弥漫，传闻藏有古魔遗骸与上古机缘',
        }
      );
    }

    const defaultRoutes: MapRoute[] = [];
    if (defaultMarkers.length >= 2) {
      defaultRoutes.push({
        id: `route-1`,
        name: '宗门下山商道',
        fromMarkerId: defaultMarkers[0].id,
        toMarkerId: defaultMarkers[1].id,
        travelDays: 3,
        dangerLevel: 'SAFE',
        description: '官道平坦，沿途设有驿站与修真巡逻小队',
      });
    }
    if (defaultMarkers.length >= 3) {
      defaultRoutes.push({
        id: `route-2`,
        name: '探秘凶险捷径',
        fromMarkerId: defaultMarkers[1].id,
        toMarkerId: defaultMarkers[2].id,
        travelDays: 7,
        dangerLevel: 'DANGEROUS',
        description: '横穿黑风峡谷，常有二阶凶兽出没',
      });
    }

    return {
      id: `map-${novelId}`,
      novelId,
      title: '神州山河总略图',
      bgTheme: 'PARCHMENT',
      markers: defaultMarkers,
      routes: defaultRoutes,
      updatedAt: Date.now(),
    };
  }

  /**
   * 校验路线因果合理性（避免前后距离逻辑崩坏）
   */
  static verifyTravelSpeed(
    markerA: MapMarker,
    markerB: MapMarker,
    declaredDays: number
  ): { isReasonable: boolean; warning?: string } {
    const dx = markerA.x - markerB.x;
    const dy = markerA.y - markerB.y;
    const distanceScore = Math.sqrt(dx * dx + dy * dy); // 0 ~ 141

    // 假设沙盘跨图极限距离（>60%）需要至少 5 天常规行程
    if (distanceScore > 60 && declaredDays <= 1) {
      return {
        isReasonable: false,
        warning: `【${markerA.name}】与【${markerB.name}】在地图上跨越广袤地域，仅耗时 ${declaredDays} 天到达，若无御空飞舟或传送阵支撑，易造成行程因果降智。`,
      };
    }

    return { isReasonable: true };
  }

  /**
   * 存储地图数据到本地 LocalStorage
   */
  static saveMapToStorage(map: NovelMap): void {
    try {
      localStorage.setItem(`novelforge_map_${map.novelId}`, JSON.stringify(map));
    } catch (e) {
      console.error('保存沙盘地图失败:', e);
    }
  }

  /**
   * 从本地读取地图数据
   */
  static loadMapFromStorage(novelId: string, worldRules: WorldRule[] = []): NovelMap {
    try {
      const raw = localStorage.getItem(`novelforge_map_${novelId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('读取本地沙盘地图失败，生成默认地图:', e);
    }
    const defaultMap = this.createDefaultMap(novelId, worldRules);
    this.saveMapToStorage(defaultMap);
    return defaultMap;
  }
}
