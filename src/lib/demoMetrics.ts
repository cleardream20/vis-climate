import { DOMAIN, type VizMode } from './constants'

/** 与地图联动的「全国合成」演示指标（接入 NetCDF 后替换为真实聚合） */
export type DemoNationalStats = {
  /** 网格平均的日代表气温（演示），单位 ℃ —— 对应数据说明里「每日 12:00」 */
  meanTempC: number
  /** 相对演示气候态的距平，℃ */
  anomalyC: number
  /** 演示：热浪日数（天） */
  heatwaveDays: number
}

export function computeDemoNationalStats(
  year: number,
  _vizMode: VizMode,
): DemoNationalStats {
  const span = DOMAIN.yearMax - DOMAIN.yearMin
  const ty = span > 0 ? (year - DOMAIN.yearMin) / span : 0
  const base = 14.8 + ty * 1.65
  const wobble = Math.sin((year - DOMAIN.yearMin) * 0.29) * 0.52
  const meanTempC = Math.round((base + wobble) * 10) / 10
  const anomalyC = Math.round((ty - 0.4) * 2.45 * 10) / 10
  const heatwaveDays = Math.max(
    0,
    Math.round(5 + ty * 24 + Math.sin(year * 0.19) * 4.5),
  )
  return { meanTempC, anomalyC, heatwaveDays }
}
