import {
  realAnomalyJsonUrl,
  realAnnualMaxJsonUrl,
  realGridJsonUrl,
} from './gridConfig'
import {
  applyGridLayoutToBuffer,
  assertDomainShape,
  type GridLayoutMeta,
} from './gridLayout'

/** 每年一份：NaN 表示海洋/缺测 */
const cache = new Map<number, Float32Array>()
const anomalyCache = new Map<number, Float32Array>()
/** 年最高温栅格（或回退到同日 t2m 后的缓存） */
const annualMaxCache = new Map<number, Float32Array>()
/** `t2m_annual_max_*.json` 中 meta.hottestMonth（1–12）；回退同日文件时删除 */
const annualMaxHottestMonth = new Map<number, number>()

export function getAnnualMaxHottestMonth(year: number): number | undefined {
  return annualMaxHottestMonth.get(year)
}

export function getCachedRealGrid(year: number): Float32Array | undefined {
  return cache.get(year)
}

export function setCachedRealGrid(year: number, grid: Float32Array): void {
  cache.set(year, grid)
}

export function parseJsonValuesToFloat32(
  values: unknown[],
  gridRows: number,
  gridCols: number,
): Float32Array | null {
  const expected = gridRows * gridCols
  if (values.length !== expected) {
    console.warn(
      `[realGrid] values length ${values.length} != ${expected} (${gridRows}x${gridCols})`,
    )
    return null
  }
  const out = new Float32Array(expected)
  for (let i = 0; i < expected; i++) {
    const v = values[i]
    out[i] = v === null || v === undefined ? Number.NaN : Number(v)
  }
  return out
}

export async function fetchRealYearGrid(year: number): Promise<Float32Array | null> {
  const cached = cache.get(year)
  if (cached) return cached

  const url = realGridJsonUrl(year)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return null
    }
    const j = (await res.json()) as {
      gridRows: number
      gridCols: number
      values: unknown[]
      meta?: { gridLayout?: GridLayoutMeta }
    }
    let grid = parseJsonValuesToFloat32(j.values, j.gridRows, j.gridCols)
    if (!grid) return null
    grid = applyGridLayoutToBuffer(grid, j.gridRows, j.gridCols, j.meta?.gridLayout)
    assertDomainShape(j.gridRows, j.gridCols)
    cache.set(year, grid)
    return grid
  } catch (e) {
    console.warn(`[realGrid] fetch failed ${url}`, e)
    return null
  }
}

export function getCachedRealAnomalyGrid(year: number): Float32Array | undefined {
  return anomalyCache.get(year)
}

export async function fetchRealAnomalyGrid(year: number): Promise<Float32Array | null> {
  const cached = anomalyCache.get(year)
  if (cached) return cached

  const url = realAnomalyJsonUrl(year)
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const j = (await res.json()) as {
      gridRows: number
      gridCols: number
      values: unknown[]
      meta?: { gridLayout?: GridLayoutMeta }
    }
    let grid = parseJsonValuesToFloat32(j.values, j.gridRows, j.gridCols)
    if (!grid) return null
    grid = applyGridLayoutToBuffer(grid, j.gridRows, j.gridCols, j.meta?.gridLayout)
    assertDomainShape(j.gridRows, j.gridCols)
    anomalyCache.set(year, grid)
    return grid
  } catch (e) {
    console.warn(`[realGrid] anomaly fetch failed ${url}`, e)
    return null
  }
}

export function getCachedRealAnnualMaxGrid(year: number): Float32Array | undefined {
  return annualMaxCache.get(year)
}

/**
 * 年最高温 JSON；不存在则回退 `fetchRealYearGrid`（同日代表场）。
 */
export async function fetchRealAnnualMaxGrid(year: number): Promise<Float32Array | null> {
  const cached = annualMaxCache.get(year)
  if (cached) return cached

  const url = realAnnualMaxJsonUrl(year)
  try {
    const res = await fetch(url)
    if (res.ok) {
      const j = (await res.json()) as {
        gridRows: number
        gridCols: number
        values: unknown[]
        meta?: { gridLayout?: GridLayoutMeta; hottestMonth?: unknown }
      }
      let grid = parseJsonValuesToFloat32(j.values, j.gridRows, j.gridCols)
      if (!grid) return null
      grid = applyGridLayoutToBuffer(grid, j.gridRows, j.gridCols, j.meta?.gridLayout)
      assertDomainShape(j.gridRows, j.gridCols)
      annualMaxCache.set(year, grid)
      const hm = j.meta?.hottestMonth
      if (typeof hm === 'number' && hm >= 1 && hm <= 12) {
        annualMaxHottestMonth.set(year, Math.round(hm))
      } else {
        annualMaxHottestMonth.delete(year)
      }
      return grid
    }
  } catch (e) {
    console.warn(`[realGrid] annual max fetch failed ${url}`, e)
  }
  const fallback = await fetchRealYearGrid(year)
  if (fallback) {
    annualMaxCache.set(year, fallback)
    annualMaxHottestMonth.delete(year)
  }
  return fallback
}
