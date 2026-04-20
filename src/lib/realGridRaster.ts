import { DOMAIN } from './constants'
import { anomalyCelsiusToRgba, temperatureToRgba } from './colorScale'
import { RASTER_STRIDE } from './syntheticGrid'

const TRANSPARENT: [number, number, number, number] = [0, 0, 0, 0]

/**
 * 将真实气温格点（℃）转为与 syntheticGrid 相同布局的 ImageData。
 * `values`：行优先，第 0 行 = 最北、第 0 列 = 最西（导出脚本已 sortby 对齐 DOMAIN）。
 */
export function buildTempImageFromFloatGrid(
  values: Float32Array,
  colorBlind: boolean,
): { imageData: ImageData; meanTempC: number; maxTempC: number } {
  void colorBlind
  const { gridRows: fullRows, gridCols: fullCols } = DOMAIN
  if (values.length < fullRows * fullCols) {
    throw new Error('real grid too short')
  }

  const stride = RASTER_STRIDE
  const rows2 = Math.max(1, Math.ceil(fullRows / stride))
  const cols2 = Math.max(1, Math.ceil(fullCols / stride))
  const img = new ImageData(cols2, rows2)
  let sum = 0
  let n = 0
  let mx = -Infinity

  for (let r = 0; r < rows2; r++) {
    const sr = Math.min(fullRows - 1, r * stride)
    for (let c = 0; c < cols2; c++) {
      const sc = Math.min(fullCols - 1, c * stride)
      const idx = sr * fullCols + sc
      const t = values[idx]
      const rgba = Number.isFinite(t) ? temperatureToRgba(t) : TRANSPARENT
      if (Number.isFinite(t)) {
        sum += t
        n++
        mx = Math.max(mx, t)
      }
      const i = (r * cols2 + c) * 4
      img.data[i] = rgba[0]
      img.data[i + 1] = rgba[1]
      img.data[i + 2] = rgba[2]
      img.data[i + 3] = rgba[3]
    }
  }
  const meanTempC = n > 0 ? sum / n : Number.NaN
  const maxTempC = n > 0 ? mx : Number.NaN
  return { imageData: img, meanTempC, maxTempC }
}

/** 真实距平格点（℃）→ ImageData */
export function buildAnomalyImageFromFloatGrid(
  values: Float32Array,
  colorBlind: boolean,
): { imageData: ImageData; meanAnomalyC: number; maxAnomalyC: number } {
  const { gridRows: fullRows, gridCols: fullCols } = DOMAIN
  if (values.length < fullRows * fullCols) {
    throw new Error('anomaly grid too short')
  }

  const stride = RASTER_STRIDE
  const rows2 = Math.max(1, Math.ceil(fullRows / stride))
  const cols2 = Math.max(1, Math.ceil(fullCols / stride))
  const img = new ImageData(cols2, rows2)
  let sum = 0
  let n = 0
  let mx = -Infinity

  for (let r = 0; r < rows2; r++) {
    const sr = Math.min(fullRows - 1, r * stride)
    for (let c = 0; c < cols2; c++) {
      const sc = Math.min(fullCols - 1, c * stride)
      const idx = sr * fullCols + sc
      const d = values[idx]
      const rgba = Number.isFinite(d) ? anomalyCelsiusToRgba(d, colorBlind) : TRANSPARENT
      if (Number.isFinite(d)) {
        sum += d
        n++
        mx = Math.max(mx, d)
      }
      const i = (r * cols2 + c) * 4
      img.data[i] = rgba[0]
      img.data[i + 1] = rgba[1]
      img.data[i + 2] = rgba[2]
      img.data[i + 3] = rgba[3]
    }
  }
  const meanAnomalyC = n > 0 ? sum / n : Number.NaN
  const maxAnomalyC = n > 0 ? mx : Number.NaN
  return { imageData: img, meanAnomalyC, maxAnomalyC }
}

export function blendFloatGrids(a: Float32Array, b: Float32Array, ft: number): Float32Array {
  const n = Math.min(a.length, b.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const va = a[i]
    const vb = b[i]
    if (!Number.isFinite(va) && !Number.isFinite(vb)) {
      out[i] = Number.NaN
      continue
    }
    if (!Number.isFinite(va)) {
      out[i] = vb
      continue
    }
    if (!Number.isFinite(vb)) {
      out[i] = va
      continue
    }
    out[i] = va + (vb - va) * ft
  }
  return out
}
