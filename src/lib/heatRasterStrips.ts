import { DOMAIN } from './constants'
import { FIELD_VISUAL } from './fieldVisualConfig'
import { RASTER_STRIDE } from './syntheticGrid'

/** 水平分条数：多条较窄的 image 源可减轻 MapLibre 在大范围下单瓦片取整带来的轻微扭曲感 */
export function heatRasterStripCount(): number {
  const raw = import.meta.env.VITE_HEAT_RASTER_STRIPS
  if (raw !== undefined && raw !== '') {
    const n = Math.floor(Number(raw))
    if (n >= 1 && n <= 16) return n
  }
  return FIELD_VISUAL.heatRasterStripCount
}

export function heatStripSourceId(i: number): string {
  return `heatwave-raster-s${i}`
}

export function heatStripLayerId(i: number): string {
  return `heatwave-raster-layer-s${i}`
}

/** 将 [0, imgRows) 均分为 n 段，每段 [row0, row1) */
export function stripImageRowRanges(
  imgRows: number,
  n: number,
): { row0: number; row1: number }[] {
  const out: { row0: number; row1: number }[] = []
  for (let i = 0; i < n; i++) {
    const row0 = Math.floor((i * imgRows) / n)
    const row1 = Math.floor(((i + 1) * imgRows) / n)
    out.push({ row0, row1: Math.max(row0 + 1, row1) })
  }
  return out
}

/** 图像第 r 行对应的 DOMAIN 格点行（与 syntheticGrid / realGridRaster 一致） */
export function imageRowToDomainGridRow(r: number, imgRows: number): number {
  const fullRows = DOMAIN.gridRows
  if (imgRows <= 1) return 0
  return Math.min(fullRows - 1, r * RASTER_STRIDE)
}

/** 格点行 sr（0=北）→ 纬度（北缘） */
export function domainGridRowToLatNorth(sr: number, fullRows: number): number {
  const { latMin, latMax } = DOMAIN
  if (fullRows <= 1) return latMax
  const t = sr / (fullRows - 1)
  return latMax - t * (latMax - latMin)
}

/**
 * 条带四角：西北、东北、东南、西南（顺时针），与 MapLibre image 规范一致。
 * 南缘用「下一条图像行」对应的纬度，使相邻条带无缝衔接；最后一条到底 `latMin`。
 */
export function stripLngLatCorners(
  row0: number,
  row1: number,
  imgRows: number,
  latShiftDeg: number,
): [[number, number], [number, number], [number, number], [number, number]] {
  const fullRows = DOMAIN.gridRows
  const { lonMin, lonMax, latMin } = DOMAIN
  const sh = latShiftDeg
  const srTop = imageRowToDomainGridRow(row0, imgRows)
  const latNorth = domainGridRowToLatNorth(srTop, fullRows) + sh
  const latSouth =
    row1 >= imgRows
      ? latMin + sh
      : domainGridRowToLatNorth(imageRowToDomainGridRow(row1, imgRows), fullRows) + sh
  return [
    [lonMin, latNorth],
    [lonMax, latNorth],
    [lonMax, latSouth],
    [lonMin, latSouth],
  ]
}

export function extractImageDataRowSlice(
  src: ImageData,
  row0: number,
  row1: number,
): ImageData {
  const h = row1 - row0
  const out = new ImageData(src.width, h)
  const w = src.width
  for (let r = 0; r < h; r++) {
    const srcRow = row0 + r
    const so = srcRow * w * 4
    const doff = r * w * 4
    out.data.set(src.data.subarray(so, so + w * 4), doff)
  }
  return out
}
