import type { VizMode } from './constants'
import { DOMAIN } from './constants'
import { interpolatedScalar01AtLonLat, scalarToTempC } from './demoField'
import { USE_REAL_GRID } from './gridConfig'
import {
  interpolatedRealAnomalyAtLonLat,
  interpolatedRealTempAtLonLat,
} from './realGridSample'

/** 北京：无鼠标/无场值时的默认读数（与左上角卡片固定行高配合） */
export const DEFAULT_PROBE_LON = 116.4
export const DEFAULT_PROBE_LAT = 39.9

function lineFor(
  lon: number,
  lat: number,
  year: number,
  vizMode: VizMode,
  allowFallbackToBeijing: boolean,
): string {
  const pos = `${lon.toFixed(2)}°E, ${lat.toFixed(2)}°N`
  if (USE_REAL_GRID && vizMode === 'heatwave') {
    const tr = interpolatedRealTempAtLonLat(lon, lat, year)
    if (tr !== null) return `${pos} · 气温 ${tr.toFixed(1)} ℃`
  }
  if (USE_REAL_GRID && vizMode === 'anomaly') {
    const da = interpolatedRealAnomalyAtLonLat(lon, lat, year)
    if (da !== null) {
      return `${pos} · 距平 ${da >= 0 ? '+' : ''}${da.toFixed(2)} ℃`
    }
  }
  const t = interpolatedScalar01AtLonLat(lon, lat, year)
  if (t !== null) {
    return vizMode === 'anomaly'
      ? `${pos} · 距平场 t=${t.toFixed(2)}`
      : `${pos} · 代表气温 ${scalarToTempC(t).toFixed(1)} ℃`
  }
  if (
    allowFallbackToBeijing &&
    (Math.abs(lon - DEFAULT_PROBE_LON) > 1e-6 || Math.abs(lat - DEFAULT_PROBE_LAT) > 1e-6)
  ) {
    return lineFor(DEFAULT_PROBE_LON, DEFAULT_PROBE_LAT, year, vizMode, false)
  }
  return `${DEFAULT_PROBE_LON.toFixed(2)}°E, ${DEFAULT_PROBE_LAT.toFixed(2)}°N · 读数暂不可用`
}

/** 鼠标位置读数；研究域外退回北京默认读数，避免 HUD 行高跳动 */
export function probeLineAt(
  lon: number,
  lat: number,
  year: number,
  vizMode: VizMode,
): string {
  const { lonMin, lonMax, latMin, latMax } = DOMAIN
  if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) {
    return defaultProbeLine(year, vizMode)
  }
  return lineFor(lon, lat, year, vizMode, true)
}

export function defaultProbeLine(year: number, vizMode: VizMode): string {
  return lineFor(DEFAULT_PROBE_LON, DEFAULT_PROBE_LAT, year, vizMode, false)
}
