import { DOMAIN } from './constants'

/** 年内平滑（按月刻度）| 年最高温（每年一帧、整年） */
export type TemporalField = 'intrayear' | 'annualMax'

/** 时间轴上限：含 12 月则到「最后一年 12 月」 */
export const YEAR_AXIS_MAX = DOMAIN.yearMax + 11 / 12

export function clampTimelineYear(y: number, mode: TemporalField): number {
  if (mode === 'annualMax') {
    return Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, Math.round(y)))
  }
  return Math.min(YEAR_AXIS_MAX, Math.max(DOMAIN.yearMin, y))
}

/**
 * 用于 UI 展示：年内 → 「2023年7月」；
 * 年最高 → 「2023年7月」（`hottestMonth` 为 `t2m_annual_max` 的 meta，缺省 7 月）。
 */
export function formatTimelineLabel(
  y: number,
  mode: TemporalField,
  hottestMonth?: number | null,
): string {
  if (mode === 'annualMax') {
    const yi = clampTimelineYear(y, 'annualMax')
    const m =
      hottestMonth != null && hottestMonth >= 1 && hottestMonth <= 12 ? hottestMonth : 7
    return `${yi}年${m}月`
  }
  const y0 = Math.floor(y)
  const frac = Math.max(0, Math.min(0.999999, y - y0))
  const m = Math.min(12, Math.floor(frac * 12) + 1)
  return `${y0}年${m}月`
}
