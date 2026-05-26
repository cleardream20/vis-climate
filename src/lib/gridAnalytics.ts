import { DOMAIN } from './constants'
import { scalarField01, scalarToTempC } from './demoField'
import { USE_REAL_GRID } from './gridConfig'
import type { Place } from './places'
import { fetchRealYearGrid } from './realGridCache'
import { loadNationalStats } from './realNationalStats'

export type YearValue = { year: number; value: number }

export type ProfilePoint = { x: number; mean: number; max: number }

function rowLat(row: number): number {
  const { latMin, latMax, gridRows } = DOMAIN
  return latMax - (row / Math.max(1, gridRows - 1)) * (latMax - latMin)
}

function colLon(col: number): number {
  const { lonMin, lonMax, gridCols } = DOMAIN
  return lonMin + (col / Math.max(1, gridCols - 1)) * (lonMax - lonMin)
}

function nearestRow(lat: number): number {
  const { latMin, latMax, gridRows } = DOMAIN
  const t = (latMax - lat) / (latMax - latMin)
  return Math.round(t * (gridRows - 1))
}

function nearestCol(lon: number): number {
  const { lonMin, lonMax, gridCols } = DOMAIN
  const t = (lon - lonMin) / (lonMax - lonMin)
  return Math.round(t * (gridCols - 1))
}

function aggregateFinite(values: number[]): { mean: number; max: number } | null {
  let sum = 0
  let n = 0
  let max = -Infinity
  for (const v of values) {
    if (!Number.isFinite(v)) continue
    sum += v
    n++
    if (v > max) max = v
  }
  if (n === 0) return null
  return { mean: sum / n, max }
}

export function aggregateGrid(grid: Float32Array): { mean: number; max: number } | null {
  const vals: number[] = []
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i]!
    if (Number.isFinite(v)) vals.push(v)
  }
  return aggregateFinite(vals)
}

function buildSyntheticGrid(year: number): Float32Array {
  const { gridRows, gridCols } = DOMAIN
  const out = new Float32Array(gridRows * gridCols)
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      out[r * gridCols + c] = scalarToTempC(
        scalarField01(r, c, gridRows, gridCols, year),
      )
    }
  }
  return out
}

export async function loadGridForYear(year: number): Promise<Float32Array> {
  if (USE_REAL_GRID) {
    const g = await fetchRealYearGrid(year)
    if (g) return g
  }
  return buildSyntheticGrid(year)
}

export function latitudinalProfile(grid: Float32Array): ProfilePoint[] {
  const { gridRows, gridCols } = DOMAIN
  const out: ProfilePoint[] = []
  for (let r = 0; r < gridRows; r++) {
    const row: number[] = []
    for (let c = 0; c < gridCols; c++) {
      const v = grid[r * gridCols + c]!
      if (Number.isFinite(v)) row.push(v)
    }
    const agg = aggregateFinite(row)
    if (agg) out.push({ x: rowLat(r), mean: agg.mean, max: agg.max })
  }
  return out
}

export function longitudinalProfile(grid: Float32Array): ProfilePoint[] {
  const { gridRows, gridCols } = DOMAIN
  const out: ProfilePoint[] = []
  for (let c = 0; c < gridCols; c++) {
    const col: number[] = []
    for (let r = 0; r < gridRows; r++) {
      const v = grid[r * gridCols + c]!
      if (Number.isFinite(v)) col.push(v)
    }
    const agg = aggregateFinite(col)
    if (agg) out.push({ x: colLon(c), mean: agg.mean, max: agg.max })
  }
  return out
}

function samplePoint(grid: Float32Array, lon: number, lat: number): number | null {
  const { lonMin, lonMax, latMin, latMax, gridRows, gridCols } = DOMAIN
  if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) return null
  const fracRow = ((latMax - lat) / (latMax - latMin)) * (gridRows - 1)
  const fracCol = ((lon - lonMin) / (lonMax - lonMin)) * (gridCols - 1)
  const r0 = Math.floor(fracRow)
  const c0 = Math.floor(fracCol)
  const r1 = Math.min(gridRows - 1, r0 + 1)
  const c1 = Math.min(gridCols - 1, c0 + 1)
  const tr = fracRow - r0
  const tc = fracCol - c0
  const at = (rr: number, cc: number) => {
    const v = grid[rr * gridCols + cc]!
    return Number.isFinite(v) ? v : null
  }
  const v00 = at(r0, c0)
  const v01 = at(r0, c1)
  const v10 = at(r1, c0)
  const v11 = at(r1, c1)
  const lerp = (a: number | null, b: number | null, t: number) => {
    if (a === null && b === null) return null
    if (a === null) return b
    if (b === null) return a
    return a + (b - a) * t
  }
  const a = lerp(v00, v01, tc)
  const b = lerp(v10, v11, tc)
  if (a === null && b === null) return null
  if (a === null) return b
  if (b === null) return a
  return a + (b - a) * tr
}

function rowStats(grid: Float32Array, row: number): { mean: number; max: number } | null {
  const { gridCols } = DOMAIN
  const vals: number[] = []
  for (let c = 0; c < gridCols; c++) {
    const v = grid[row * gridCols + c]!
    if (Number.isFinite(v)) vals.push(v)
  }
  return aggregateFinite(vals)
}

function colStats(grid: Float32Array, col: number): { mean: number; max: number } | null {
  const { gridRows, gridCols } = DOMAIN
  const vals: number[] = []
  for (let r = 0; r < gridRows; r++) {
    const v = grid[r * gridCols + col]!
    if (Number.isFinite(v)) vals.push(v)
  }
  return aggregateFinite(vals)
}

export async function loadNationalTemperatureSeries(): Promise<{
  meanByYear: YearValue[]
  maxByYear: YearValue[]
}> {
  const stats = await loadNationalStats()
  const meanByYear: YearValue[] = []
  const maxByYear: YearValue[] = []

  for (let y = DOMAIN.yearMin; y <= DOMAIN.yearMax; y++) {
    const row = stats?.find((s) => s.year === y)
    if (row?.annualMeanTempC != null && Number.isFinite(row.annualMeanTempC)) {
      meanByYear.push({ year: y, value: row.annualMeanTempC })
    } else if (row?.meanTempC != null && Number.isFinite(row.meanTempC)) {
      meanByYear.push({ year: y, value: row.meanTempC })
    } else {
      const grid = await loadGridForYear(y)
      const agg = aggregateGrid(grid)
      if (agg) meanByYear.push({ year: y, value: Math.round(agg.mean * 100) / 100 })
    }

    if (row?.annualMaxTempC != null && Number.isFinite(row.annualMaxTempC)) {
      maxByYear.push({ year: y, value: row.annualMaxTempC })
    } else {
      const grid = await loadGridForYear(y)
      const agg = aggregateGrid(grid)
      if (agg) maxByYear.push({ year: y, value: Math.round(agg.max * 100) / 100 })
    }
  }
  return { meanByYear, maxByYear }
}

export async function loadCityTemperatureSeries(place: Place): Promise<{
  pointMeanByYear: YearValue[]
  pointMaxByYear: YearValue[]
  latRowMeanByYear: YearValue[]
  latRowMaxByYear: YearValue[]
  lonColMeanByYear: YearValue[]
  lonColMaxByYear: YearValue[]
}> {
  const row = nearestRow(place.lat)
  const col = nearestCol(place.lon)
  const pointMeanByYear: YearValue[] = []
  const pointMaxByYear: YearValue[] = []
  const latRowMeanByYear: YearValue[] = []
  const latRowMaxByYear: YearValue[] = []
  const lonColMeanByYear: YearValue[] = []
  const lonColMaxByYear: YearValue[] = []

  for (let y = DOMAIN.yearMin; y <= DOMAIN.yearMax; y++) {
    const grid = await loadGridForYear(y)
    const pt = samplePoint(grid, place.lon, place.lat)
    if (pt != null) {
      pointMeanByYear.push({ year: y, value: Math.round(pt * 100) / 100 })
      pointMaxByYear.push({ year: y, value: Math.round(pt * 100) / 100 })
    }
    const rs = rowStats(grid, row)
    if (rs) {
      latRowMeanByYear.push({ year: y, value: Math.round(rs.mean * 100) / 100 })
      latRowMaxByYear.push({ year: y, value: Math.round(rs.max * 100) / 100 })
    }
    const cs = colStats(grid, col)
    if (cs) {
      lonColMeanByYear.push({ year: y, value: Math.round(cs.mean * 100) / 100 })
      lonColMaxByYear.push({ year: y, value: Math.round(cs.max * 100) / 100 })
    }
  }
  return {
    pointMeanByYear,
    pointMaxByYear,
    latRowMeanByYear,
    latRowMaxByYear,
    lonColMeanByYear,
    lonColMaxByYear,
  }
}
