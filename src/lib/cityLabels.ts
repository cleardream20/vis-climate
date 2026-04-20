/**
 * 兼容旧名：地点数据已迁至 `places.ts`（分级 + 搜索）。
 */
export {
  PLACES,
  flyZoomForTier,
  minZoomForTier,
  placesVisibleAtZoom,
  searchPlaces,
  type Place,
  type PlaceTier,
} from './places'

import { PLACES } from './places'

export type CityPoint = { name: string; lon: number; lat: number }

/** 仅国家级要点（与旧 MAJOR_CITIES 数量级相近） */
export const MAJOR_CITIES: CityPoint[] = PLACES.filter((p) => p.tier === 'national').map(
  ({ name, lon, lat }) => ({ name, lon, lat }),
)
