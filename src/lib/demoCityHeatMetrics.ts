import { DOMAIN } from './constants'
import type { Place } from './places'

function hash32(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function u01(seed: number, y: number, k: number): number {
  const x = Math.imul(seed ^ Math.imul(y, 2654435761), k + 1)
  return (x >>> 0) / 4294967296
}

export type YearMetricPoint = { year: number; value: number }

/** 演示用：按城市位置与名称生成 1974–2023 年四类 CMA 口径指标的年度序列（非真实观测） */
export function cityHeatMetricSeries(place: Place): {
  heatDays: YearMetricPoint[]
  heatwaveEvents: YearMetricPoint[]
  extremeHeatwaveEvents: YearMetricPoint[]
  super40Days: YearMetricPoint[]
} {
  const seed = hash32(`${place.name}|${place.lon}|${place.lat}`)
  const heatDays: YearMetricPoint[] = []
  const heatwaveEvents: YearMetricPoint[] = []
  const extremeHeatwaveEvents: YearMetricPoint[] = []
  const super40Days: YearMetricPoint[] = []
  for (let y = DOMAIN.yearMin; y <= DOMAIN.yearMax; y++) {
    const t = (y - DOMAIN.yearMin) / (DOMAIN.yearMax - DOMAIN.yearMin + 1)
    const w = Math.sin(t * Math.PI * 2.1 + seed * 0.001) * 0.4 + 1
    const u0 = u01(seed, y, 1)
    const u1 = u01(seed, y, 2)
    const u2 = u01(seed, y, 3)
    const u3 = u01(seed, y, 4)
    const warm = (y - 1970) * 0.25
    const hd = Math.round(12 + warm * w + u0 * 18 + Math.sin(y * 0.15) * 5)
    const he = Math.max(0, Math.round(1 + warm * 0.08 + u1 * 4 + Math.sin(y * 0.12) * 1.5))
    const ee = Math.max(0, Math.round(warm * 0.05 + u2 * 2.5))
    const s40 = Math.max(0, Math.round((y > 2000 ? (y - 2000) * 0.15 : 0) + u3 * 6))
    heatDays.push({ year: y, value: Math.min(90, Math.max(0, hd)) })
    heatwaveEvents.push({ year: y, value: Math.min(25, he) })
    extremeHeatwaveEvents.push({ year: y, value: Math.min(15, ee) })
    super40Days.push({ year: y, value: Math.min(35, s40) })
  }
  return { heatDays, heatwaveEvents, extremeHeatwaveEvents, super40Days }
}

/** 演示用：某年某月逐日最高气温（℃），用于侧栏「月内变化」折线 */
export function cityMonthDailyMaxSeries(
  place: Place,
  year: number,
  month: number,
): { day: number; tmax: number }[] {
  const seed = hash32(`${place.name}|${year}|${month}`)
  const daysInMonth = new Date(year, month, 0).getDate()
  const out: { day: number; tmax: number }[] = []
  const base =
    28 +
    (month >= 6 && month <= 8 ? 8 : month <= 2 ? -6 : -2) +
    (u01(seed, year, month + 11) - 0.5) * 4
  for (let d = 1; d <= daysInMonth; d++) {
    const u = u01(seed, d * 997, year)
    const wave = Math.sin((d / daysInMonth) * Math.PI * 2) * 3
    const t = base + wave + (u - 0.5) * 6
    out.push({ day: d, tmax: Math.round(t * 10) / 10 })
  }
  return out
}
