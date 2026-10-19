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
} from 'lucide-react';
import {
  MapMarker,
  MapRoute,
  NovelMap,
  MapMarkerCategory,
  DangerLevel,
} from '@/features/map/types';
import { MapEngine } from '@/features/map/MapEngine';
import { alertDialog } from '@/utils/dialog';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

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

  // 画布容器
  const canvasRef = useRef<HTMLDivElement>(null);

  // 加载世界规则与地图
  useEffect(() => {
    if (!activeNovel) return;
    (async () => {
      try {
        const rules = await api.listWorldRules(activeNovel.id);
        setWorldRules(rules);
        const loadedMap = MapEngine.loadMapFromStorage(activeNovel.id, rules);
        setMap(loadedMap);
      } catch (e) {
        console.warn('加载世界法则失败:', e);
      }
    })();
  }, [activeNovel]);

  if (!isOpen && !embedded) return null;
  if (!map) return null;

  const saveCurrentMap = (updatedMap: NovelMap) => {
    setMap(updatedMap);
    MapEngine.saveMapToStorage(updatedMap);
  };

  // 点击画布添加地标
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !isAddingMarker) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      name: `新地标 #${map.markers.length + 1}`,
      category: 'CITY',
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      description: '点击编辑地标风物及地势背景',
    };

    const updated = {
      ...map,
      markers: [...map.markers, newMarker],
      updatedAt: Date.now(),
    };
    saveCurrentMap(updated);
    setSelectedMarkerId(newMarker.id);
    setIsAddingMarker(false);
  };

  // 点击地标
  const handleMarkerClick = (markerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isConnecting && connectFromId && connectFromId !== markerId) {
      // 完成连线创建
      const fromM = map.markers.find((m) => m.id === connectFromId);
      const toM = map.markers.find((m) => m.id === markerId);

      if (fromM && toM) {
        const newRoute: MapRoute = {
          id: `route-${Date.now()}`,
          name: `${fromM.name.slice(0, 4)} ➔ ${toM.name.slice(0, 4)} 驿道`,
          fromMarkerId: fromM.id,
          toMarkerId: toM.id,
          travelDays: 3,
          dangerLevel: 'SAFE',
          description: '常规行程路线',
        };
        const updated = {
          ...map,
          routes: [...map.routes, newRoute],
          updatedAt: Date.now(),
        };
        saveCurrentMap(updated);
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

  const selectedMarker = map.markers.find((m) => m.id === selectedMarkerId);
  const selectedRoute = map.routes.find((r) => r.id === selectedRouteId);
  const routeFromMarker = selectedRoute ? map.markers.find((m) => m.id === selectedRoute.fromMarkerId) : null;
  const routeToMarker = selectedRoute ? map.markers.find((m) => m.id === selectedRoute.toMarkerId) : null;
  const speedCausality =
    selectedRoute && routeFromMarker && routeToMarker
      ? MapEngine.verifyTravelSpeed(routeFromMarker, routeToMarker, selectedRoute.travelDays)
      : null;

  // 获得图标
  const getMarkerIcon = (category: MapMarkerCategory) => {
    switch (category) {
      case 'SECT':
        return <Building className="w-3.5 h-3.5 text-primary" />;
      case 'CITY':
        return <Castle className="w-3.5 h-3.5 text-blue-900" />;
      case 'DUNGEON':
        return <Skull className="w-3.5 h-3.5 text-rose-800" />;
      case 'WILDERNESS':
        return <Mountain className="w-3.5 h-3.5 text-emerald-900" />;
      case 'FORTRESS':
        return <Shield className="w-3.5 h-3.5 text-purple-900" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const content = (
    <div className={`flex flex-col h-full bg-surface-2 dark:bg-[#1a1714] text-ink dark:text-[#dfdbd0] select-none ${embedded ? '' : 'rounded-2xl shadow-2xl border border-line dark:border-[#38332d] overflow-hidden'}`}>
      {/* Top Header */}
      {!embedded && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#201c18] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-800 to-yellow-800 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">神州山河地理沙盘</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 text-primary font-semibold border border-amber-800/20">
                  World Map Sandbox
                </span>
              </div>
              <p className="text-[11px] text-ink-2 dark:text-[#a0978d]">
                宗门城池坐标定标、历练行军路线规划与行程耗时因果校对
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#2b2520] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="px-4 py-2 border-b border-line dark:border-[#2e2a27] bg-[#f5efe3] dark:bg-[#201c18] flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingMarker(!isAddingMarker)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isAddingMarker
                ? 'bg-amber-800 text-white animate-pulse'
                : 'bg-white dark:bg-[#2a241f] border border-line dark:border-[#38332d] text-[#4a3b2c] dark:text-[#c4b5a2] hover:bg-surface-3-hover'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingMarker ? '点击沙盘画布任意位置放置地标' : '新增地标点'}</span>
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
                ? 'bg-blue-800 text-white animate-pulse'
                : 'bg-white dark:bg-[#2a241f] border border-line dark:border-[#38332d] text-[#4a3b2c] dark:text-[#c4b5a2] hover:bg-surface-3-hover'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5" />
            <span>{isConnecting ? '点击目标地标完成路线连接' : '绘制行军/商道路线'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-ink-2">
          <span>地标：{map.markers.length} 个</span>
          <span>• 路线：{map.routes.length} 条</span>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Canvas Surface */}
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`flex-1 relative overflow-hidden flex items-center justify-center ${
            isAddingMarker ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{
            backgroundColor: '#f7f1e5',
            backgroundImage: `
              radial-gradient(#d8cca8 1px, transparent 1px),
              linear-gradient(to right, rgba(216, 204, 168, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(216, 204, 168, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          }}
        >
          {/* Ancient Compass Rose Watermark */}
          <div className="absolute right-6 bottom-6 opacity-15 pointer-events-none">
            <Compass className="w-48 h-48 text-primary" />
          </div>

          {/* SVG Routes Rendering */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                    stroke={isSelected ? '#854d0e' : route.dangerLevel === 'FATAL' ? '#dc2626' : route.dangerLevel === 'DANGEROUS' ? '#f59e0b' : '#65a30d'}
                    strokeWidth={isSelected ? 3.5 : 2}
                    strokeDasharray={route.dangerLevel === 'SAFE' ? 'none' : '4,4'}
                    className="transition-all hover:stroke-width-4"
                  />
                  {/* Route Label in Middle */}
                  <text
                    x={`${(fromM.x + toM.x) / 2}%`}
                    y={`${(fromM.y + toM.y) / 2}%`}
                    dy="-6"
                    textAnchor="middle"
                    className="text-[10px] fill-[#685f54] font-serif font-bold pointer-events-none select-none"
                  >
                    {route.name} ({route.travelDays}天)
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Marker Nodes Rendering */}
          {map.markers.map((marker) => {
            const isSelected = selectedMarkerId === marker.id;
            const isConnectSource = connectFromId === marker.id;

            return (
              <div
                key={marker.id}
                onClick={(e) => handleMarkerClick(marker.id, e)}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 z-20 group ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                }`}
              >
                {/* Marker Pin Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 transition-colors ${
                    isConnectSource
                      ? 'bg-blue-600 border-white text-white animate-bounce'
                      : isSelected
                      ? 'bg-amber-600 border-white text-white ring-4 ring-amber-800/20'
                      : 'bg-[#fffaf0] border-[#854d0e] text-ink hover:bg-[#faebd7]'
                  }`}
                >
                  {getMarkerIcon(marker.category)}
                </div>

                {/* Marker Name Badge */}
                <div className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#2c2825]/90 text-white font-serif text-[11px] shadow-md pointer-events-none">
                  {marker.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Attribute Inspector Drawer */}
        <div className="w-full md:w-80 border-l border-line dark:border-[#2e2a27] bg-[#f7f2e8]/90 dark:bg-[#1e1a17] p-4 flex flex-col gap-3.5 shrink-0 overflow-y-auto text-xs">
          {selectedMarker ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-line dark:border-[#2e2a27] pb-2">
                <span className="font-bold text-xs text-primary dark:text-amber-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  地标属性检视
                </span>
                <button
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className="p-1 rounded text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="删除此地标"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">地标名称</label>
                <input
                  type="text"
                  value={selectedMarker.name}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714] font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">地势品类</label>
                <select
                  value={selectedMarker.category}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { category: e.target.value as MapMarkerCategory })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714]"
                >
                  <option value="SECT">宗门道场 / 仙山福地</option>
                  <option value="CITY">都城重镇 / 凡俗市镇</option>
                  <option value="DUNGEON">上古秘境 / 妖魔险地</option>
                  <option value="WILDERNESS">蛮荒异域 / 绝壁深渊</option>
                  <option value="FORTRESS">边境要塞 / 天险关隘</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">绑定世界法则 (Canon)</label>
                <select
                  value={selectedMarker.linkedWorldRuleId || ''}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { linkedWorldRuleId: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714]"
                >
                  <option value="">-- 未关联特定世界法则 --</option>
                  {worldRules.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.authority_level}] {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">风物景致与地理描述</label>
                <textarea
                  rows={4}
                  value={selectedMarker.description}
                  onChange={(e) => handleUpdateMarker(selectedMarker.id, { description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714] font-serif leading-relaxed"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-amber-800/10 text-primary dark:text-amber-200 text-[11px] leading-relaxed">
                坐标位置：X: {selectedMarker.x}% | Y: {selectedMarker.y}%
              </div>
            </div>
          ) : selectedRoute ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-line dark:border-[#2e2a27] pb-2">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <RouteIcon className="w-4 h-4 text-blue-700" />
                  路线属性检视
                </span>
                <button
                  onClick={() => handleDeleteRoute(selectedRoute.id)}
                  className="p-1 rounded text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="删除此路线"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">路线名称</label>
                <input
                  type="text"
                  value={selectedRoute.name}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714] font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">常规行程耗时（天数）</label>
                <input
                  type="number"
                  min={1}
                  value={selectedRoute.travelDays}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { travelDays: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">途中危险程度</label>
                <select
                  value={selectedRoute.dangerLevel}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { dangerLevel: e.target.value as DangerLevel })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714]"
                >
                  <option value="SAFE">安全官道 · 巡防严密</option>
                  <option value="DANGEROUS">凶险凶道 · 盗匪凶兽出没</option>
                  <option value="FATAL">九死一生 · 绝命死地</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-2 block mb-1">沿途历险备注</label>
                <textarea
                  rows={3}
                  value={selectedRoute.description}
                  onChange={(e) => handleUpdateRoute(selectedRoute.id, { description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-line dark:border-[#38332d] bg-white dark:bg-[#1a1714]"
                />
              </div>

              {speedCausality && !speedCausality.isReasonable && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-[11px] flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{speedCausality.warning}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9c9388] p-4">
              <Compass className="w-8 h-8 mb-2 stroke-[1.5] text-[#ded5c4]" />
              <p className="font-medium text-xs text-ink-2 mb-1">点击沙盘中的地标或路线</p>
              <p className="text-[11px]">可查看或编辑其宗门背景、行程天数与关联法则</p>
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
