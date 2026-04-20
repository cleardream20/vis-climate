import { CHINA_NAV_BOUNDS } from './constants'
import { flowVector } from './demoField'
import { getCachedRealGrid } from './realGridCache'
import { sampleFloatGridAtLonLat } from './realGridSample'

const DL = 0.45

/**
 * 用真实气温格点梯度估计「风状」方向（屏幕归一化），与画布粒子动画对齐。
 * 若该年未缓存或采样失败，回退 `demoField.flowVector`。
 */
export function flowVectorFromRealTemp(
  nx: number,
  ny: number,
  year: number,
): { u: number; v: number } {
  const y0 = Math.floor(year)
  const grid = getCachedRealGrid(y0)
  if (!grid) return flowVector(nx, ny, year)

  const [sw, ne] = CHINA_NAV_BOUNDS
  const lon = sw[0] + nx * (ne[0] - sw[0])
  const lat = ne[1] - ny * (ne[1] - sw[1])

  const t0 = sampleFloatGridAtLonLat(grid, lon, lat)
  if (t0 === null) return flowVector(nx, ny, year)

  const tpx = sampleFloatGridAtLonLat(grid, lon + DL, lat)
  const tmx = sampleFloatGridAtLonLat(grid, lon - DL, lat)
  const tpy = sampleFloatGridAtLonLat(grid, lon, lat + DL)
  const tmy = sampleFloatGridAtLonLat(grid, lon, lat - DL)

  if (tpx === null || tmx === null || tpy === null || tmy === null) {
    return flowVector(nx, ny, year)
  }

  const dTdlon = (tpx - tmx) / (2 * DL)
  const dTdlat = (tpy - tmy) / (2 * DL)
  let u = -dTdlat
  let v = dTdlon
  const mag = Math.hypot(u, v) + 1e-6
  const scale = 0.38
  u = (u / mag) * scale
  v = (v / mag) * scale
  return { u, v }
}
