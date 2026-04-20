import type { StyleSpecification } from 'maplibre-gl'

/** 水域视觉基准：rgb(100,100,100) */
export const BASEMAP_WATER_HEX = '#646464'

/**
 * 无彩但保留细节的底图：使用含江河湖泊/地形纹理的栅格瓦片，再强制灰度。
 * 这样可保留细节，不会用彩色干扰热力图。
 */
export function basemapRasterStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'Gray-detail-raster',
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
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
