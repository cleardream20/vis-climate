/**
 * ⚠️ 演示用合成标量场（高斯团 + 三角函数），不是 ERA5/站点等真实观测。
 * 地图上「气温」由 scalarToTempC 把 [0,1] 线性映射到约 -38～48℃，与真实气候无关。
 * 接入 NetCDF 等真实格点数据时，应替换本模块在场上的使用，见 README「数据说明」。
 */
import { DOMAIN } from './constants'

const TAU = Math.PI * 2
function normalizedYear(year: number): number {
  const span = DOMAIN.yearMax - DOMAIN.yearMin
  if (span <= 0) return 0
  return (year - DOMAIN.yearMin) / span
}

/** 统一的演示标量场（0..1），供热力纹理与流场动画共享 */
export function scalarField01(
  row: number,
  col: number,
  rows: number,
  cols: number,
  year: number,
): number {
  const y = row / rows
  const x = col / cols
  const ty = normalizedYear(year)

  const cx1 = 0.35 + 0.08 * Math.sin(ty * TAU)
  const cy1 = 0.55 + 0.06 * Math.cos(ty * TAU * 0.7)
  const cx2 = 0.72 + 0.05 * Math.cos(ty * TAU * 1.1)
  const cy2 = 0.38 + 0.07 * Math.sin(ty * TAU * 0.9)

  const d1 = Math.hypot(x - cx1, y - cy1)
  const d2 = Math.hypot(x - cx2, y - cy2)
  const blob =
    Math.exp(-d1 * d1 / 0.018) * 0.55 + Math.exp(-d2 * d2 / 0.022) * 0.45

  const monsoon = Math.sin((x - 0.2) * TAU * 1.2) * 0.08 * (0.4 + y)
  const coast = (1 - y) * 0.06 * Math.sin(x * TAU)
  const warming = ty * 0.12

  let v = blob + monsoon + coast + warming + (y - 0.35) * 0.05
  v += 0.04 * Math.sin(x * TAU * 3 + row * 0.02) * Math.cos(y * TAU * 2)
  return Math.max(0, Math.min(1, v))
}

/** 与热力栅格一致的 ℃ 映射（演示场） */
export function scalarToTempC(t: number): number {
  return -38 + t * 86
}

function bilinearScalar(
  fracRow: number,
  fracCol: number,
  rows: number,
  cols: number,
  yearInt: number,
): number {
  const r0 = Math.floor(fracRow)
  const c0 = Math.floor(fracCol)
  const tr = fracRow - r0
  const tc = fracCol - c0
  const r1 = Math.min(rows - 1, r0 + 1)
  const c1 = Math.min(cols - 1, c0 + 1)
  const v00 = scalarField01(r0, c0, rows, cols, yearInt)
  const v01 = scalarField01(r0, c1, rows, cols, yearInt)
  const v10 = scalarField01(r1, c0, rows, cols, yearInt)
  const v11 = scalarField01(r1, c1, rows, cols, yearInt)
  const a = v00 + tc * (v01 - v00)
  const b = v10 + tc * (v11 - v10)
  return a + tr * (b - a)
}

/**
 * 在 DOMAIN 内对演示标量场做双线性插值 + 年份插值（与栅格时间混合一致）。
 * 用于 Ventusky 式「悬停即读场值」：纯前端、不读 PNG 像素。
 */
export function interpolatedScalar01AtLonLat(
  lon: number,
  lat: number,
  year: number,
): number | null {
  const { lonMin, lonMax, latMin, latMax, gridRows, gridCols } = DOMAIN
  if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) return null

  const fracRow = ((latMax - lat) / (latMax - latMin)) * (gridRows - 1)
  const fracCol = ((lon - lonMin) / (lonMax - lonMin)) * (gridCols - 1)

  const y0 = Math.floor(year)
  const y1 = Math.min(DOMAIN.yearMax, y0 + 1)
  const ft = Math.max(0, Math.min(1, year - y0))
  const t0 = bilinearScalar(fracRow, fracCol, gridRows, gridCols, y0)
  const t1 = bilinearScalar(fracRow, fracCol, gridRows, gridCols, y1)
  return t0 + (t1 - t0) * ft
}

/** Ventusky 风格流线的简化向量场（经纬归一化坐标） */
export function flowVector(
  nx: number,
  ny: number,
  year: number,
): { u: number; v: number } {
  const ty = normalizedYear(year)
  const swirl = Math.sin((nx * 2.5 + ny * 1.3 + ty * 1.8) * TAU)
  const jet = Math.cos((ny * 1.9 - ty * 0.9) * TAU)
  const monsoon = Math.sin((nx * 1.2 - ty * 1.4) * TAU)
  const u = 0.35 * jet + 0.28 * swirl + 0.22 * monsoon
  const v = 0.32 * Math.cos((nx * 1.1 + ty * 0.7) * TAU) + 0.24 * swirl
  return { u, v }
}
