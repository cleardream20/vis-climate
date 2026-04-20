import { DOMAIN, type VizMode } from './constants'
import {
  blendFloatGrids,
  buildAnomalyImageFromFloatGrid,
  buildTempImageFromFloatGrid,
} from './realGridRaster'
import type { HeatRasterBuildResult } from './heatRasterTypes'
import {
  fetchRealAnomalyGrid,
  fetchRealAnnualMaxGrid,
  fetchRealYearGrid,
  getAnnualMaxHottestMonth,
  getCachedRealAnomalyGrid,
  getCachedRealAnnualMaxGrid,
  getCachedRealGrid,
} from './realGridCache'
import { USE_REAL_GRID } from './gridConfig'
import { buildSyntheticHeatRaster } from './syntheticGrid'
import type { TemporalField } from './temporalTypes'

function emptyHud(): Pick<
  HeatRasterBuildResult,
  'heatwaveMeanMaxC' | 'anomalyMeanMaxC' | 'annualHottestMonth'
> {
  return {
    annualHottestMonth: null,
    heatwaveMeanMaxC: null,
    anomalyMeanMaxC: null,
  }
}

/**
 * 异步构建地图栅格：`VITE_USE_REAL_GRID=true` 时优先 `public/data/real/` JSON，失败回退合成场。
 */
export async function buildHeatRasterImageData(
  year: number,
  colorBlind: boolean,
  vizMode: VizMode,
  temporalField: TemporalField,
): Promise<HeatRasterBuildResult> {
  if (!USE_REAL_GRID) {
    return buildSyntheticHeatRaster(year, colorBlind, vizMode, temporalField)
  }

  const snap = temporalField === 'annualMax'
  const y0 = snap
    ? Math.round(Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, year)))
    : Math.floor(year)
  const y1 = snap ? y0 : Math.min(DOMAIN.yearMax, y0 + 1)
  const ft = snap ? 0 : Math.max(0, Math.min(1, year - y0))

  if (vizMode === 'heatwave') {
    if (snap) {
      let g =
        getCachedRealAnnualMaxGrid(y0) ?? (await fetchRealAnnualMaxGrid(y0))
      if (!g) {
        return buildSyntheticHeatRaster(year, colorBlind, vizMode, temporalField)
      }
      void fetchRealYearGrid(y0).catch(() => {})
      const { imageData, meanTempC, maxTempC } = buildTempImageFromFloatGrid(g, colorBlind)
      const hm = getAnnualMaxHottestMonth(y0) ?? 7
      return {
        imageData,
        annualHottestMonth: hm,
        heatwaveMeanMaxC:
          Number.isFinite(meanTempC) && Number.isFinite(maxTempC)
            ? { mean: meanTempC, max: maxTempC }
            : null,
        anomalyMeanMaxC: null,
      }
    }

    let g0 = getCachedRealGrid(y0) ?? (await fetchRealYearGrid(y0))
    if (!g0) {
      return buildSyntheticHeatRaster(year, colorBlind, vizMode, temporalField)
    }

    if (ft <= 1e-6 || y0 === y1) {
      const { imageData, meanTempC, maxTempC } = buildTempImageFromFloatGrid(g0, colorBlind)
      return {
        imageData,
        ...emptyHud(),
        heatwaveMeanMaxC:
          Number.isFinite(meanTempC) && Number.isFinite(maxTempC)
            ? { mean: meanTempC, max: maxTempC }
            : null,
      }
    }

    let g1 = getCachedRealGrid(y1) ?? (await fetchRealYearGrid(y1))
    if (!g1) {
      const { imageData, meanTempC, maxTempC } = buildTempImageFromFloatGrid(g0, colorBlind)
      return {
        imageData,
        ...emptyHud(),
        heatwaveMeanMaxC:
          Number.isFinite(meanTempC) && Number.isFinite(maxTempC)
            ? { mean: meanTempC, max: maxTempC }
            : null,
      }
    }

    const blended = blendFloatGrids(g0, g1, ft)
    const { imageData, meanTempC, maxTempC } = buildTempImageFromFloatGrid(blended, colorBlind)
    return {
      imageData,
      ...emptyHud(),
      heatwaveMeanMaxC:
        Number.isFinite(meanTempC) && Number.isFinite(maxTempC)
          ? { mean: meanTempC, max: maxTempC }
          : null,
    }
  }

  let a0 = getCachedRealAnomalyGrid(y0) ?? (await fetchRealAnomalyGrid(y0))
  if (!a0) {
    return buildSyntheticHeatRaster(year, colorBlind, vizMode, temporalField)
  }

  void fetchRealYearGrid(y0).catch(() => {})
  if (!snap && y0 !== y1) void fetchRealYearGrid(y1).catch(() => {})

  if (snap) {
    const { imageData, meanAnomalyC, maxAnomalyC } = buildAnomalyImageFromFloatGrid(
      a0,
      colorBlind,
    )
    return {
      imageData,
      /** 距平 JSON 仍为单日导出；时间标签月与「最热月气温」对齐需另配数据，此处不填 */
      annualHottestMonth: null,
      heatwaveMeanMaxC: null,
      anomalyMeanMaxC:
        Number.isFinite(meanAnomalyC) && Number.isFinite(maxAnomalyC)
          ? { mean: meanAnomalyC, max: maxAnomalyC }
          : null,
    }
  }

  if (ft <= 1e-6 || y0 === y1) {
    const { imageData, meanAnomalyC, maxAnomalyC } = buildAnomalyImageFromFloatGrid(
      a0,
      colorBlind,
    )
    return {
      imageData,
      ...emptyHud(),
      anomalyMeanMaxC:
        Number.isFinite(meanAnomalyC) && Number.isFinite(maxAnomalyC)
          ? { mean: meanAnomalyC, max: maxAnomalyC }
          : null,
    }
  }

  let a1 = getCachedRealAnomalyGrid(y1) ?? (await fetchRealAnomalyGrid(y1))
  if (!a1) {
    const { imageData, meanAnomalyC, maxAnomalyC } = buildAnomalyImageFromFloatGrid(
      a0,
      colorBlind,
    )
    return {
      imageData,
      ...emptyHud(),
      anomalyMeanMaxC:
        Number.isFinite(meanAnomalyC) && Number.isFinite(maxAnomalyC)
          ? { mean: meanAnomalyC, max: maxAnomalyC }
          : null,
    }
  }

  const blended = blendFloatGrids(a0, a1, ft)
  const { imageData, meanAnomalyC, maxAnomalyC } = buildAnomalyImageFromFloatGrid(
    blended,
    colorBlind,
  )
  return {
    imageData,
    ...emptyHud(),
    anomalyMeanMaxC:
      Number.isFinite(meanAnomalyC) && Number.isFinite(maxAnomalyC)
        ? { mean: meanAnomalyC, max: maxAnomalyC }
        : null,
  }
}
