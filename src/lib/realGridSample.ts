import { DOMAIN } from './constants'
import { getCachedRealAnomalyGrid, getCachedRealGrid } from './realGridCache'

function bilinear(
  grid: Float32Array,
  rows: number,
  cols: number,
  fracRow: number,
  fracCol: number,
): number | null {
  const r0 = Math.floor(fracRow)
  const c0 = Math.floor(fracCol)
  const tr = fracRow - r0
  const tc = fracCol - c0
  const r1 = Math.min(rows - 1, r0 + 1)
  const c1 = Math.min(cols - 1, c0 + 1)

  const at = (rr: number, cc: number) => {
    const v = grid[rr * cols + cc]
    return Number.isFinite(v) ? v : null
  }

  const v00 = at(r0, c0)
  const v01 = at(r0, c1)
  const v10 = at(r1, c0)
  const v11 = at(r1, c1)
  if (v00 === null && v01 === null && v10 === null && v11 === null) return null

  const s = (a: number | null, b: number | null, t: number) => {
    if (a === null && b === null) return null
    if (a === null) return b
    if (b === null) return a
    return a + (b - a) * t
  }

  const a = s(v00, v01, tc)
  const b = s(v10, v11, tc)
  if (a === null && b === null) return null
  if (a === null) return b
  if (b === null) return a
  return a + (b - a) * tr
}

/** 任意与 DOMAIN 同形状的格点（℃ 或距平 ℃） */
export function sampleFloatGridAtLonLat(
  grid: Float32Array,
  lon: number,
  lat: number,
): number | null {
  const { lonMin, lonMax, latMin, latMax, gridRows, gridCols } = DOMAIN
  if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) return null

  const fracRow = ((latMax - lat) / (latMax - latMin)) * (gridRows - 1)
  const fracCol = ((lon - lonMin) / (lonMax - lonMin)) * (gridCols - 1)
  return bilinear(grid, gridRows, gridCols, fracRow, fracCol)
}

/** 悬停：某一整年格点上的 ℃（需该年已在缓存中，例如刚完成上图请求） */
export function sampleRealTempAtLonLat(
  lon: number,
  lat: number,
  yearInt: number,
): number | null {
  const grid = getCachedRealGrid(yearInt)
  if (!grid) return null
  return sampleFloatGridAtLonLat(grid, lon, lat)
}

export function sampleRealAnomalyAtLonLat(
  lon: number,
  lat: number,
  yearInt: number,
): number | null {
  const grid = getCachedRealAnomalyGrid(yearInt)
  if (!grid) return null
  return sampleFloatGridAtLonLat(grid, lon, lat)
}

/** 与栅格时间混合一致：跨年份时对两年格点做线性混合 */
export function interpolatedRealTempAtLonLat(
  lon: number,
  lat: number,
  year: number,
): number | null {
  const y0 = Math.floor(year)
  const y1 = Math.min(DOMAIN.yearMax, y0 + 1)
  const ft = Math.max(0, Math.min(1, year - y0))
  const t0 = sampleRealTempAtLonLat(lon, lat, y0)
  if (ft <= 1e-6 || y0 === y1) return t0
  const t1 = sampleRealTempAtLonLat(lon, lat, y1)
  if (t0 === null && t1 === null) return null
  if (t0 === null) return t1
  if (t1 === null) return t0
  return t0 + (t1 - t0) * ft
}

export function interpolatedRealAnomalyAtLonLat(
  lon: number,
  lat: number,
  year: number,
): number | null {
  const y0 = Math.floor(year)
  const y1 = Math.min(DOMAIN.yearMax, y0 + 1)
  const ft = Math.max(0, Math.min(1, year - y0))
  const t0 = sampleRealAnomalyAtLonLat(lon, lat, y0)
  if (ft <= 1e-6 || y0 === y1) return t0
  const t1 = sampleRealAnomalyAtLonLat(lon, lat, y1)
  if (t0 === null && t1 === null) return null
  if (t0 === null) return t1
  if (t1 === null) return t0
  return t0 + (t1 - t0) * ft
}
