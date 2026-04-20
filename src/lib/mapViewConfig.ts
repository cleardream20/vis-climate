import type { Map } from 'maplibre-gl'
import type { MapViewMode } from '../store/useAppStore'
import { CHINA_NAV_BOUNDS, DOMAIN_MAP_BOUNDS } from './constants'

export function applyMapViewMode(
  map: Map,
  mode: MapViewMode,
  opts?: { animate?: boolean },
) {
  const animate = opts?.animate ?? true
  const duration = animate ? 900 : 0

  if (mode === 'global') {
    map.setMaxBounds(null)
    map.setMinZoom(0.5)
    map.easeTo({
      center: [0, 18],
      zoom: 1.25,
      bearing: 0,
      pitch: 0,
      duration,
    })
    return
  }

  // 中国周边：可拖范围用 CHINA_NAV_BOUNDS；初始视野让数据矩形 DOMAIN 完整入画且东侧多留白
  map.setMaxBounds(CHINA_NAV_BOUNDS)
  map.setMinZoom(2.4)
  map.fitBounds(DOMAIN_MAP_BOUNDS, {
    padding: { top: 20, bottom: 20, left: 24, right: 72 },
    animate,
    duration,
    maxZoom: 10,
  })
}
