import type { StyleSpecification } from 'maplibre-gl'

/** 水域视觉基准：rgb(100,100,100) */
export const BASEMAP_WATER_HEX = '#646464'

const CARTO_ONLINE_TILES = [
  'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
] as const

/** `public/basemap/{z}/{x}/{y}.png`，由 `data/download_basemap_tiles.py` 生成 */
const LOCAL_BASEMAP_TILES = ['/basemap/{z}/{x}/{y}.png'] as const

const BASEMAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'

function envFlag(v: string | undefined): boolean {
  if (!v) return false
  const s = v.trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

/** 是否使用 `public/basemap/` 本地瓦片（`VITE_USE_LOCAL_BASEMAP`） */
export function useLocalBasemapTiles(): boolean {
  return envFlag(import.meta.env.VITE_USE_LOCAL_BASEMAP)
}

export function basemapTileUrls(): readonly string[] {
  return useLocalBasemapTiles() ? LOCAL_BASEMAP_TILES : CARTO_ONLINE_TILES
}

/**
 * 无彩但保留细节的底图：使用含江河湖泊/地形纹理的栅格瓦片，再强制灰度。
 * 这样可保留细节，不会用彩色干扰热力图。
 *
 * 瓦片源：`VITE_USE_LOCAL_BASEMAP=true` → `/basemap/...`；否则 CARTO CDN（默认）。
 */
export function basemapRasterStyle(): StyleSpecification {
  const local = useLocalBasemapTiles()
  return {
    version: 8,
    name: local ? 'Gray-detail-raster-local' : 'Gray-detail-raster',
    sources: {
      carto: {
        type: 'raster',
        tiles: [...basemapTileUrls()],
        tileSize: 256,
        attribution: BASEMAP_ATTRIBUTION,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': BASEMAP_WATER_HEX },
      },
      {
        id: 'base-gray-detail',
        type: 'raster',
        source: 'carto',
        minzoom: 0,
        maxzoom: 22,
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 180,
          'raster-saturation': -1,
          'raster-contrast': 0.28,
          'raster-brightness-min': 0.22,
          'raster-brightness-max': 0.72,
        },
      },
    ],
  }
}
