import { WorldRule } from '@/types';
import { NovelMap, MapMarker, MapRoute, MapBgTheme } from './types';

export class MapEngine {
  private static extractGenreString(genreProfile?: any): string {
    if (!genreProfile) return '';
    if (typeof genreProfile === 'string') return genreProfile;
    if (typeof genreProfile === 'object') {
      return [genreProfile.genre, genreProfile.subGenre, genreProfile.category, genreProfile.style].filter(Boolean).join(' ');
    }
    return String(genreProfile);
  }

  /**
   * 根据作品流派与标题生成个性化默认沙盘名称
   */
  static getDefaultTitle(novelTitle?: string, genreProfile?: any): string {
    const genre = this.extractGenreString(genreProfile);
    if (novelTitle) {
      if (genre.includes('科幻') || genre.includes('星际') || genre.includes('深空')) {
        return `《${novelTitle}》星图势力沙盘`;
      }
      if (genre.includes('奇幻') || genre.includes('西幻') || genre.includes('魔幻')) {
        return `《${novelTitle}》大陆地理沙盘`;
      }
      if (genre.includes('都市') || genre.includes('现实') || genre.includes('商战')) {
        return `《${novelTitle}》都市格局沙盘`;
      }
      if (genre.includes('末日') || genre.includes('废土') || genre.includes('丧尸')) {
        return `《${novelTitle}》废土生存沙盘`;
      }
      if (genre.includes('仙侠') || genre.includes('修真') || genre.includes('玄幻')) {
        return `《${novelTitle}》天地山河沙盘`;
      }
      return `《${novelTitle}》世界地理沙盘`;
    }

    if (genre.includes('科幻') || genre.includes('星际')) return '深空星图沙盘';
    if (genre.includes('都市') || genre.includes('现实')) return '现代都市格局沙盘';
    if (genre.includes('末日') || genre.includes('废土')) return '末日废土生存沙盘';
    if (genre.includes('奇幻') || genre.includes('西幻')) return '诸国大陆疆域沙盘';
    return '架空世界地理沙盘';
  }

  /**
   * 根据作品流派推断默认视觉主题风格
   */
  static getDefaultTheme(genreProfile?: any): MapBgTheme {
    const genre = this.extractGenreString(genreProfile);
    if (genre.includes('科幻') || genre.includes('星际') || genre.includes('深空')) {
      return 'COSMIC_DEEP';
    }
    if (genre.includes('末日') || genre.includes('废土')) {
      return 'DESERT_BROWN';
    }
    if (genre.includes('仙侠') || genre.includes('修真')) {
      return 'ANCIENT_JADE';
    }
    if (genre.includes('悬疑') || genre.includes('惊悚') || genre.includes('克苏鲁')) {
      return 'INK_DARK';
    }
    return 'PARCHMENT';
  }

  /**
   * 基于世界观法则智能推演生成沙盘地图（等同于 createDefaultMap）
   */
  static generateMapFromRules(
    novelId: string,
    worldRules: WorldRule[] = [],
    novelTitle?: string,
    genreProfile?: any
  ): NovelMap {
    return this.createDefaultMap(novelId, worldRules, novelTitle, genreProfile);
  }

  /**
   * 生成默认初始化沙盘地图
   */
  static createDefaultMap(
    novelId: string,
    worldRules: WorldRule[] = [],
    novelTitle?: string,
    genreProfile?: any
  ): NovelMap {
    const defaultMarkers: MapMarker[] = [];
    const genre = this.extractGenreString(genreProfile);

    // 广谱地理关键词检索（跨仙侠、科幻、奇幻、都市、末日全流派）
    const GEO_KEYWORDS = /(地理|疆域|版图|宗门|宗|门|派|城|都|郡|镇|庄|阁|峰|谷|山|渊|洞|府|海|洋|河|湖|岛|港|要塞|关隘|堡|堡垒|哨所|营|星|星系|星区|星轨|星门|空间站|基地|辐射区|避难所|遗迹|秘境|神殿|学院|领地|公国|帝国|荒原|废土|特区|战区|聚集地)/;

    const geoRules = worldRules.filter(
      (r) =>
        r.authority_level !== 'DEPRECATED' &&
        (GEO_KEYWORDS.test(r.title || '') || GEO_KEYWORDS.test(r.rule_content || ''))
    );

    if (geoRules.length > 0) {
      geoRules.slice(0, 5).forEach((rule, idx) => {
        // 分布在画布四周
        const angle = (idx / Math.min(geoRules.length, 5)) * 2 * Math.PI;
        const x = Math.round(50 + 35 * Math.cos(angle));
        const y = Math.round(50 + 35 * Math.sin(angle));

        let category: any = 'CITY';
        const title = rule.title || '';
        if (title.includes('宗') || title.includes('门') || title.includes('学院') || title.includes('空间站')) {
          category = 'SECT';
        } else if (title.includes('渊') || title.includes('险') || title.includes('洞') || title.includes('异象') || title.includes('遗迹')) {
          category = 'DUNGEON';
        } else if (title.includes('堡') || title.includes('塞') || title.includes('关') || title.includes('哨') || title.includes('星门')) {
          category = 'FORTRESS';
        } else if (title.includes('荒') || title.includes('海') || title.includes('林') || title.includes('深空')) {
          category = 'WILDERNESS';
        }

        defaultMarkers.push({
          id: `marker-${Date.now()}-${idx}`,
          name: rule.title,
          category,
          x,
          y,
          description: rule.rule_content.slice(0, 80),
          linkedWorldRuleId: rule.id,
        });
      });
    } else {
      // 流派感知保底预设（当暂未设定世界法则时）
      if (genre.includes('科幻') || genre.includes('星际')) {
        defaultMarkers.push(
          {
            id: `m-1`,
            name: '空间枢纽 · 核心星港',
            category: 'SECT',
            x: 25,
            y: 35,
            description: '主航线交汇的巨型轨道枢纽，配备重力环与反物质加注站',
          },
          {
            id: `m-2`,
            name: '中央主星 · 联合行星城',
            category: 'CITY',
            x: 70,
            y: 40,
            description: '星区行政与商贸核心，人口稠密的穹顶生态都会',
          },
          {
            id: `m-3`,
            name: '柯伊伯带 · 异象深空',
            category: 'DUNGEON',
            x: 48,
            y: 80,
            description: '暗物质潮汐频繁，隐藏着史前先驱者文明遗落的时空裂隙',
          }
        );
      } else if (genre.includes('末日') || genre.includes('废土')) {
        defaultMarkers.push(
          {
            id: `m-1`,
            name: '01号地下避难所 · 幸存据点',
            category: 'FORTRESS',
            x: 25,
            y: 35,
            description: '全封闭地下三层工事，拥有独立水培与地热能源系统',
          },
          {
            id: `m-2`,
            name: '钢铁集市 · 废墟聚落',
            category: 'CITY',
            x: 70,
            y: 40,
            description: '旧时代立交桥残骸上搭建的黑市贸易区，各路拾荒者汇聚之地',
          },
          {
            id: `m-3`,
            name: '高能辐射区 · 变异深渊',
            category: 'DUNGEON',
            x: 48,
            y: 80,
            description: '灾变核心爆心，盖革计数器尖啸，潜伏着高度异化生物',
          }
        );
      } else if (genre.includes('都市') || genre.includes('现实')) {
        defaultMarkers.push(
          {
            id: `m-1`,
            name: '金融中心 · 集团摩天总部',
            category: 'CITY',
            x: 25,
            y: 35,
            description: '资本与权力的策源地，俯瞰整座不夜城的顶层落地窗',
          },
          {
            id: `m-2`,
            name: '临海旧货港 · 秘密仓库',
            category: 'FORTRESS',
            x: 70,
            y: 40,
            description: '集装箱林立，海雾弥漫，地下暗流交易的关键关卡',
          },
          {
            id: `m-3`,
            name: '近郊隐秘庄园 · 绝密据点',
            category: 'DUNGEON',
            x: 48,
            y: 80,
            description: '高墙铁网、监控密布，外界传说中的私人隐秘俱乐部',
          }
        );
      } else if (genre.includes('奇幻') || genre.includes('西幻')) {
        defaultMarkers.push(
          {
            id: `m-1`,
            name: '至高王城 · 圣光殿堂',
            category: 'CITY',
            x: 25,
            y: 35,
            description: '白石筑成的雄伟王都，骑士团驻地与帝国权力中枢',
          },
          {
            id: `m-2`,
            name: '星落法师塔 · 皇家学院',
            category: 'SECT',
            x: 70,
            y: 40,
            description: '七重结界悬浮之塔，汇聚大陆最高深奥术与古代卷轴',
          },
          {
            id: `m-3`,
            name: '黑森林暗谷 · 远古龙冢',
            category: 'DUNGEON',
            x: 48,
            y: 80,
            description: '永夜迷雾弥漫，巨龙骸骨长眠的禁忌之地',
          }
        );
      } else {
        // 经典仙侠 / 玄幻 / 通用默认
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
            name: '天斗古城 · 仙凡重镇',
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
    }

    const defaultRoutes: MapRoute[] = [];
    if (defaultMarkers.length >= 2) {
      const isSciFi = genre.includes('科幻') || genre.includes('星际');
      const isUrban = genre.includes('都市');
      defaultRoutes.push({
        id: `route-1`,
        name: isSciFi ? '常规跃迁星轨' : isUrban ? '跨区主干通道' : '要道安全商线',
        fromMarkerId: defaultMarkers[0].id,
        toMarkerId: defaultMarkers[1].id,
        travelDays: isUrban ? 1 : 3,
        dangerLevel: 'SAFE',
        description: isSciFi
          ? '帝国航道巡防舰队常态化排查，护航信号畅通'
          : '官道平坦巡查严密，沿途设有驿站与补给哨卡',
      });
    }
    if (defaultMarkers.length >= 3) {
      const isSciFi = genre.includes('科幻') || genre.includes('星际');
      const isUrban = genre.includes('都市');
      defaultRoutes.push({
        id: `route-2`,
        name: isSciFi ? '高危引力剪切捷径' : isUrban ? '地下走私暗道' : '探秘凶险捷径',
        fromMarkerId: defaultMarkers[1].id,
        toMarkerId: defaultMarkers[2].id,
        travelDays: isUrban ? 2 : 7,
        dangerLevel: 'DANGEROUS',
        description: isSciFi
          ? '航道穿越小行星密集引力潮汐区，常有掠夺者雷达盲区潜伏'
          : '横穿险恶区域，常有盗匪险情与未知危险出没',
      });
    }

    return {
      id: `map-${novelId}`,
      novelId,
      title: this.getDefaultTitle(novelTitle, genreProfile),
      bgTheme: this.getDefaultTheme(genreProfile),
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
        warning: `【${markerA.name}】与【${markerB.name}】在沙盘上跨越广袤地域，仅耗时 ${declaredDays} 天到达。若无超常规空间跃迁、传送阵、神行遁术或特殊极速载具支撑，易造成前后行程因果降智。`,
      };
    }

    return { isReasonable: true };
  }

  /**
   * 存储地图数据到本地 LocalStorage
   */
  static saveMapToStorage(map: NovelMap): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`novelforge_map_${map.novelId}`, JSON.stringify(map));
      }
    } catch (e) {
      console.error('保存沙盘地图失败:', e);
    }
  }

  /**
   * 从本地读取地图数据
   */
  static loadMapFromStorage(
    novelId: string,
    worldRules: WorldRule[] = [],
    novelTitle?: string,
    genreProfile?: any
  ): NovelMap {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`novelforge_map_${novelId}`);
        if (raw) {
          const parsed: NovelMap = JSON.parse(raw);
          // 若此前存储了旧版硬编码的“神州山河总略图”，且当前作品有标题，自动平滑升级为定制名称
          if (parsed.title === '神州山河总略图' && novelTitle) {
            parsed.title = this.getDefaultTitle(novelTitle, genreProfile);
            this.saveMapToStorage(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('读取本地沙盘地图失败，生成默认地图:', e);
    }
    const defaultMap = this.createDefaultMap(novelId, worldRules, novelTitle, genreProfile);
    this.saveMapToStorage(defaultMap);
    return defaultMap;
  }
}

