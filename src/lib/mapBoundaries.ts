import type { Map } from 'maplibre-gl'

const SRC_COUNTRY = 'ne-50m-admin-0'
/** 与旧 cloudfront 子集 URL 区分，避免缓存到仅含约 100 条要素的残缺 admin1 */
const SRC_PROVINCE = 'ne-admin1-natural-earth-v51'

export const BOUNDARY_LAYER_COUNTRY = 'boundary-country'
export const BOUNDARY_LAYER_PROVINCE_CN = 'boundary-province-cn'

/** 省界开始明显出现的缩放级别（略低于此逐渐淡入） */
export const PROVINCE_LINE_MIN_ZOOM = 5.15

/** Natural Earth 50m */
const NE_50M_COUNTRIES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson'

/** 完整 Natural Earth 5.1.2 admin-1（cloudfront 3.3.0 同名文件仅为子集，不含中国省界） */
const NE_50M_ADMIN1 =
  'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_50m_admin_1_states_provinces.geojson'

/**
 * 确保国界、中国省界数据源与图层存在（可多次调用；已存在则跳过对应图层）。
 * 省界比国界细；省界在缩放较低时通过 opacity 淡出，约从 `PROVINCE_LINE_MIN_ZOOM` 起明显。
 */
export function ensureAdminBoundaryLayers(map: Map): void {
  if (!map.getSource(SRC_COUNTRY)) {
    map.addSource(SRC_COUNTRY, {
      type: 'geojson',
      data: NE_50M_COUNTRIES,
      attribution:
        '<a href="https://www.naturalearthdata.com/">Natural Earth</a> · Public domain',
    })
  }
  if (!map.getSource(SRC_PROVINCE)) {
    map.addSource(SRC_PROVINCE, {
      type: 'geojson',
      data: NE_50M_ADMIN1,
      attribution:
        '<a href="https://www.naturalearthdata.com/">Natural Earth</a> · Public domain',
    })
  }

  if (!map.getLayer(BOUNDARY_LAYER_COUNTRY)) {
    map.addLayer({
      id: BOUNDARY_LAYER_COUNTRY,
      type: 'line',
      source: SRC_COUNTRY,
      paint: {
        'line-color': '#0a0a0a',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.85, 4, 1.35, 6, 2.1, 8.5, 2.65],
        'line-opacity': 0.94,
      },
    })
  }

  if (!map.getLayer(BOUNDARY_LAYER_PROVINCE_CN)) {
    map.addLayer({
      id: BOUNDARY_LAYER_PROVINCE_CN,
      type: 'line',
      source: SRC_PROVINCE,
      filter: [
        'any',
        ['==', ['get', 'adm0_a3'], 'CHN'],
        ['==', ['get', 'ADM0_A3'], 'CHN'],
        ['==', ['get', 'sr_adm0_a3'], 'CHN'],
      ],
      paint: {
        'line-color': '#141414',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          PROVINCE_LINE_MIN_ZOOM - 0.5,
          0.2,
          PROVINCE_LINE_MIN_ZOOM,
          0.42,
          6,
          0.72,
          8.5,
          0.95,
        ],
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          PROVINCE_LINE_MIN_ZOOM - 0.55,
          0,
          PROVINCE_LINE_MIN_ZOOM - 0.25,
          0.35,
          PROVINCE_LINE_MIN_ZOOM,
          0.9,
          8.5,
          0.96,
        ],
        'line-blur': 0.12,
      },
    })
  }
}

export type BoundaryVisibility = {
  showCountry: boolean
  showProvince: boolean
}

/** 与 store / 环境变量联动：控制国界、省界是否参与绘制 */
export function syncBoundaryLayerVisibility(map: Map, v: BoundaryVisibility): void {
  if (!map.getLayer(BOUNDARY_LAYER_COUNTRY) || !map.getLayer(BOUNDARY_LAYER_PROVINCE_CN)) return
  map.setLayoutProperty(
    BOUNDARY_LAYER_COUNTRY,
    'visibility',
    v.showCountry ? 'visible' : 'none',
  )
  map.setLayoutProperty(
    BOUNDARY_LAYER_PROVINCE_CN,
    'visibility',
    v.showProvince ? 'visible' : 'none',
  )
}

/**
 * 不透明热力栅格必须在国界/省界 **之下**，否则矢量线会被盖住。
 * 在添加或更新热力层后调用。
 */
export function stackHeatRasterBelowBoundaries(map: Map, heatLayerId: string): void {
  if (!map.getLayer(heatLayerId) || !map.getLayer(BOUNDARY_LAYER_COUNTRY)) return
  map.moveLayer(heatLayerId, BOUNDARY_LAYER_COUNTRY)
}
