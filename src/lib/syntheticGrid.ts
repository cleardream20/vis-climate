import { DOMAIN, type VizMode } from './constants'
import { anomalyFieldRgba, temperatureToRgba } from './colorScale'
import { scalarField01, scalarToTempC } from './demoField'
import type { HeatRasterBuildResult } from './heatRasterTypes'
import type { TemporalField } from './temporalTypes'

/**
 * 相对 DOMAIN 的步长：`1` 表示一网格点一像素（有数据即有点）；若性能不足可改为 2。
 */
export const RASTER_STRIDE = 1

/** 降采样后的演示栅格（与全域四角坐标对齐） */
export function buildSyntheticHeatRaster(
  year: number,
  colorBlind: boolean,
  vizMode: VizMode,
  temporalField: TemporalField = 'intrayear',
): HeatRasterBuildResult {
  const { gridRows: fullRows, gridCols: fullCols } = DOMAIN
  const stride = RASTER_STRIDE
  const rows2 = Math.max(1, Math.ceil(fullRows / stride))
  const cols2 = Math.max(1, Math.ceil(fullCols / stride))
  const img = new ImageData(cols2, rows2)

  let y0: number
  let y1: number
  let ft: number
  if (temporalField === 'annualMax') {
    const yi = Math.round(Math.min(DOMAIN.yearMax, Math.max(DOMAIN.yearMin, year)))
    y0 = yi
    y1 = yi
    ft = 0
  } else {
    y0 = Math.floor(year)
    y1 = Math.min(DOMAIN.yearMax, y0 + 1)
    ft = Math.max(0, Math.min(1, year - y0))
  }

  let sumT = 0
  let nT = 0
  let mxT = -Infinity
  let sumA = 0
  let nA = 0
  let mxA = -Infinity

  for (let r = 0; r < rows2; r++) {
    const sr = Math.min(fullRows - 1, r * stride)
    for (let c = 0; c < cols2; c++) {
      const sc = Math.min(fullCols - 1, c * stride)
      // 与 DOMAIN 研究域矩形一致：整幅栅格全部上色（与 NetCDF 网格对齐，不做行政掩膜裁剪）
      // 两年份插值：让时间轴非整数年份也能平滑过渡
      const t0 = scalarField01(sr, sc, fullRows, fullCols, y0)
      const t1 = scalarField01(sr, sc, fullRows, fullCols, y1)
      const t = t0 + (t1 - t0) * ft
      const rgba =
        vizMode === 'anomaly'
          ? anomalyFieldRgba(t, colorBlind)
          : temperatureToRgba(scalarToTempC(t))
      if (vizMode === 'heatwave') {
        const tc = scalarToTempC(t)
        sumT += tc
        nT++
        mxT = Math.max(mxT, tc)
      } else if (t >= 0.1) {
        const proxy = (t - 0.5) * 14
        sumA += proxy
        nA++
        mxA = Math.max(mxA, proxy)
      }
      const i = (r * cols2 + c) * 4
      img.data[i] = rgba[0]
      img.data[i + 1] = rgba[1]
      img.data[i + 2] = rgba[2]
      img.data[i + 3] = rgba[3]
    }
  }

  const annualHottestMonth = temporalField === 'annualMax' ? 7 : null
  return {
    imageData: img,
    annualHottestMonth,
    heatwaveMeanMaxC:
      vizMode === 'heatwave' && nT > 0 ? { mean: sumT / nT, max: mxT } : null,
    anomalyMeanMaxC:
      vizMode === 'anomaly' && nA > 0 ? { mean: sumA / nA, max: mxA } : null,
  }
}

export function imageDataToDataUrl(img: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  const flipY = import.meta.env.VITE_HEAT_FLIP_IMAGE_Y === 'true'
  if (flipY) {
    ctx.translate(0, img.height)
    ctx.scale(1, -1)
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}
