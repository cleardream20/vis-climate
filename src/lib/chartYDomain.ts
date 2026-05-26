export type YScaleMode = 'auto' | 'tight' | 'zero'

/** 收紧纵轴，突出年际变化趋势 */
export function computeYDomain(
  yMin: number,
  yMax: number,
  mode: YScaleMode,
): [number, number] {
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return [0, 1]
  }
  if (yMin === yMax) {
    const p = Math.max(Math.abs(yMin) * 0.08, 0.5)
    return [yMin - p, yMax + p]
  }

  const span = yMax - yMin

  if (mode === 'zero') {
    const lo = Math.min(0, yMin)
    const pad = Math.max(span * 0.06, 0.5)
    return [lo, yMax + pad]
  }

  if (mode === 'tight') {
    const pad = Math.max(span * 0.12, span > 20 ? 1.5 : 0.6)
    return [yMin - pad, yMax + pad]
  }

  // auto：正值序列仍从 0 起，否则随数据
  const lo = yMin >= 0 ? 0 : yMin - span * 0.06
  const pad = Math.max(span * 0.08, 0.5)
  return [lo, yMax + pad]
}
