import type { DemoNationalStats } from './demoMetrics'
import { NATIONAL_STATS_URL } from './gridConfig'

export type NationalStatRow = {
  year: number
  meanTempC: number
  anomalyC: number
  heatwaveDays: number
}

type NationalStatsPayload = {
  meta?: { dayIndex?: number }
  series: NationalStatRow[]
}

let cached: NationalStatRow[] | null | undefined

export async function loadNationalStats(): Promise<NationalStatRow[] | null> {
  if (cached !== undefined) return cached
  try {
    const res = await fetch(NATIONAL_STATS_URL)
    if (!res.ok) {
      cached = null
      return null
    }
    const j = (await res.json()) as NationalStatsPayload
    if (!Array.isArray(j.series)) {
      cached = null
      return null
    }
    cached = j.series
    return cached
  } catch {
    cached = null
    return null
  }
}

export function pickNationalStat(
  year: number,
  rows: NationalStatRow[] | null | undefined,
): DemoNationalStats | null {
  if (!rows?.length) return null
  const y = Math.floor(year)
  const row = rows.find((r) => r.year === y)
  if (!row) return null
  return {
    meanTempC: row.meanTempC,
    anomalyC: row.anomalyC,
    heatwaveDays: row.heatwaveDays,
  }
}
