import { create } from 'zustand'
import type { UserMode, VizMode } from '../lib/constants'
import { DOMAIN } from '../lib/constants'
import type { HeatRasterBuildResult } from '../lib/heatRasterTypes'
import type { Place } from '../lib/places'
import { clampTimelineYear, type TemporalField } from '../lib/temporalTypes'

export type MapViewMode = 'china' | 'global'

/** 地图飞行定位（由搜索等触发，HeatmapMap 消费） */
export type MapFlyRequest = {
  lon: number
  lat: number
  zoom: number
  /** 同坐标重复搜索时递增以触发 effect */
  nonce: number
}

export type AppStore = {
  /** 距平场独立年份 */
  yearAnomaly: number
  /** 热浪档独立年份 */
  yearHeatwave: number
  /** 按当前 vizMode 写入对应年份 */
  setActiveYear: (y: number) => void
  userMode: UserMode
  setUserMode: (m: UserMode) => void
  colorBlind: boolean
  setColorBlind: (v: boolean) => void
  vizMode: VizMode
  setVizMode: (m: VizMode) => void
  /** 热浪气温时间语义：年内代表日插值 | 年最高（每年一图） */
  temporalField: TemporalField
  setTemporalField: (m: TemporalField) => void
  playbackActive: boolean
  setPlaybackActive: (v: boolean) => void
  /** 动画演示区间（含端点），播放到 playTo 后自动暂停 */
  playFrom: number
  playTo: number
  setPlayFrom: (y: number) => void
  setPlayTo: (y: number) => void
  /** 每年一帧的间隔（毫秒），数值越大越慢 */
  playIntervalMs: number
  setPlayIntervalMs: (ms: number) => void
  /** 是否显示 Ventusky 风格流线动画层 */
  flowOverlay: boolean
  setFlowOverlay: (v: boolean) => void
  mapViewMode: MapViewMode
  setMapViewMode: (m: MapViewMode) => void
  metricsOpen: boolean
  setMetricsOpen: (v: boolean) => void
  storyOpen: boolean
  setStoryOpen: (v: boolean) => void
  /** 非 null 时地图应 flyTo 到该点（读一次即由 HeatmapMap 处理） */
  mapFlyRequest: MapFlyRequest | null
  requestMapFlyTo: (lon: number, lat: number, zoom: number) => void
  clearMapFlyRequest: () => void
  /** 当前帧栅格对应的 HUD 统计（由 HeatmapMap 在换图后写入） */
  lastRasterHud: HeatRasterBuildResult | null
  setLastRasterHud: (r: HeatRasterBuildResult | null, timelineYear: number) => void
  /** 年最高模式下各年「最热月」日历月（1–12），用于记忆行等 */
  annualHottestMonthByYear: Record<number, number>
  /** 是否绘制国界 / 省界（可用 `VITE_MAP_SHOW_COUNTRY` / `VITE_MAP_SHOW_PROVINCE` 初值） */
  showCountryBoundary: boolean
  showProvinceBoundary: boolean
  setShowCountryBoundary: (v: boolean) => void
  setShowProvinceBoundary: (v: boolean) => void
  /** 地图点击城市标注后打开右侧城市洞察侧栏；null 为关闭 */
  selectedPlace: Place | null
  setSelectedPlace: (p: Place | null) => void
}

export function clampYear(y: number) {
  return Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, y))
}

/** 当前图层对应的年份 */
export function selectActiveYear(s: Pick<AppStore, 'vizMode' | 'yearAnomaly' | 'yearHeatwave'>) {
  return s.vizMode === 'anomaly' ? s.yearAnomaly : s.yearHeatwave
}

let flyNonce = 0

function envTruthy(raw: string | undefined, defaultVal: boolean): boolean {
  if (raw === undefined || raw === '') return defaultVal
  const v = raw.trim().toLowerCase()
  return v !== 'false' && v !== '0' && v !== 'no'
}

export const useAppStore = create<AppStore>((set) => ({
  yearAnomaly: 1988,
  yearHeatwave: 2023,
  setActiveYear: (y) =>
    set((state) => {
      const cy = clampTimelineYear(y, state.temporalField)
      return state.vizMode === 'anomaly'
        ? { yearAnomaly: cy }
        : { yearHeatwave: cy }
    }),
  userMode: 'basic',
  setUserMode: (m) => set({ userMode: m }),
  colorBlind: false,
  setColorBlind: (v) => set({ colorBlind: v }),
  vizMode: 'heatwave',
  setVizMode: (m) => set({ vizMode: m }),
  temporalField: 'intrayear',
  setTemporalField: (m) =>
    set((s) =>
      m === 'annualMax'
        ? {
            temporalField: m,
            yearHeatwave: Math.round(
              Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, s.yearHeatwave)),
            ),
            yearAnomaly: Math.round(
              Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, s.yearAnomaly)),
            ),
          }
        : { temporalField: m },
    ),
  playbackActive: false,
  setPlaybackActive: (v) => set({ playbackActive: v }),
  playFrom: 1990,
  playTo: 2020,
  setPlayFrom: (y) =>
    set((s) => {
      const from = clampYear(y)
      const to = clampYear(s.playTo)
      if (from <= to) return { playFrom: from }
      return { playFrom: from, playTo: from }
    }),
  setPlayTo: (y) =>
    set((s) => {
      const to = clampYear(y)
      const from = clampYear(s.playFrom)
      if (to >= from) return { playTo: to }
      return { playFrom: to, playTo: to }
    }),
  playIntervalMs: 200,
  setPlayIntervalMs: (ms) =>
    set({ playIntervalMs: Math.min(900, Math.max(80, Math.round(ms))) }),
  flowOverlay: false,
  setFlowOverlay: (v) => set({ flowOverlay: v }),
  mapViewMode: 'china',
  setMapViewMode: (m) => set({ mapViewMode: m }),
  metricsOpen: false,
  setMetricsOpen: (v) => set({ metricsOpen: v }),
  storyOpen: false,
  setStoryOpen: (v) => set({ storyOpen: v }),
  mapFlyRequest: null,
  requestMapFlyTo: (lon, lat, zoom) =>
    set({
      mapFlyRequest: {
        lon,
        lat,
        zoom: Math.min(8.45, Math.max(2.4, zoom)),
        nonce: ++flyNonce,
      },
    }),
  clearMapFlyRequest: () => set({ mapFlyRequest: null }),
  lastRasterHud: null,
  setLastRasterHud: (r, timelineYear) =>
    set((s) => {
      const yk = Math.round(timelineYear)
      const nextMonths = { ...s.annualHottestMonthByYear }
      if (r?.annualHottestMonth != null && yk >= DOMAIN.yearMin && yk <= DOMAIN.yearMax) {
        nextMonths[yk] = r.annualHottestMonth
      }
      return { lastRasterHud: r, annualHottestMonthByYear: nextMonths }
    }),
  annualHottestMonthByYear: {},
  showCountryBoundary: envTruthy(import.meta.env.VITE_MAP_SHOW_COUNTRY, true),
  showProvinceBoundary: envTruthy(import.meta.env.VITE_MAP_SHOW_PROVINCE, true),
  setShowCountryBoundary: (v) => set({ showCountryBoundary: v }),
  setShowProvinceBoundary: (v) => set({ showProvinceBoundary: v }),
  selectedPlace: null,
  setSelectedPlace: (p) => set({ selectedPlace: p }),
}))
