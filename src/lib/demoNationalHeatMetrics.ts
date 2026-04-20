import type { Place } from './places'
import { cityHeatMetricSeries } from './demoCityHeatMetrics'

/**
 * 用于「全国尺度」侧栏的演示合成点：与 `cityHeatMetricSeries` 同源算法，
 * 固定虚拟地点以保证全国曲线稳定、与城市侧栏解耦。
 */
export const NATIONAL_SYNTH_PLACE: Place = {
  name: '全国',
  lon: 103.8,
  lat: 36.0,
  country: '中国',
  province: '北京市',
  tier: 'national',
}

export function nationalDemoHeatMetricSeries() {
  return cityHeatMetricSeries(NATIONAL_SYNTH_PLACE)
}
