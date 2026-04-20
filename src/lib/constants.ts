/** 与需求 / guideline 一致的研究域与网格规格 */
export const DOMAIN = {
  lonMin: 73,
  lonMax: 135,
  latMin: 18,
  latMax: 54,
  gridRows: 361,
  gridCols: 621,
  yearMin: 1974,
  yearMax: 2023,
} as const

/** 与数据栅格四角一致（热力图 image coordinates 仍严格用 DOMAIN） */
export const DOMAIN_MAP_BOUNDS: [[number, number], [number, number]] = [
  [DOMAIN.lonMin, DOMAIN.latMin],
  [DOMAIN.lonMax, DOMAIN.latMax],
]

/**
 * 中国周边模式：可视/拖拽范围在 DOMAIN 外扩，尤其东侧多留海城与俄远东一侧，
 * 避免有色区贴屏幕边缘、被误认为「未覆盖」；数据层范围不变。
 */
export const CHINA_NAV_BOUNDS: [[number, number], [number, number]] = [
  [DOMAIN.lonMin - 2.5, DOMAIN.latMin - 1.5],
  [DOMAIN.lonMax + 10, DOMAIN.latMax + 1.5],
]

/** 分段色带：轻度 → 极端（需求文档 F01） */
export const HEAT_PALETTE = {
  normal: ['#FFF3B3', '#FFA500', '#E63946', '#C1121C'] as const,
  colorBlind: ['#BDE0FE', '#8CEAE6', '#219EBC', '#023047'] as const,
}

export type UserMode = 'basic' | 'classroom' | 'pro'

/** 热浪分级（离散）| 距平场（色标连续渐变） */
export type VizMode = 'heatwave' | 'anomaly'
