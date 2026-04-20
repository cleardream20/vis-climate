type LonLat = [number, number]

// 粗粒度中国及周边外轮廓（用于视觉掩膜，非行政精确边界）
const CHINA_OUTLINE: LonLat[] = [
  [73.2, 39.5],
  [74.8, 41.8],
  [78.5, 44.8],
  [83.0, 47.5],
  [88.0, 49.2],
  [96.0, 49.8],
  [104.0, 49.2],
  [112.0, 47.3],
  [119.5, 46.8],
  [126.5, 48.8],
  [132.8, 49.0],
  [135.0, 47.8],
  [134.8, 45.5],
  [133.5, 41.5],
  [129.8, 39.5],
  [125.2, 40.3],
  [122.0, 38.5],
  [121.0, 35.8],
  [119.0, 32.5],
  [121.0, 29.2],
  [120.0, 25.5],
  [117.0, 22.5],
  [113.8, 21.0],
  [110.8, 18.0],
  [106.0, 19.2],
  [102.0, 21.2],
  [98.5, 22.8],
  [95.0, 24.8],
  [92.0, 27.0],
  [89.0, 29.5],
  [84.0, 31.0],
  [80.0, 33.8],
  [76.5, 35.5],
  [73.2, 39.5],
]

// 南海岛域粗框（仅用于“范围观感”，不代表精确岛礁边界）
const SOUTH_CHINA_SEA_BOX: LonLat[] = [
  [106.0, 3.0],
  [123.0, 3.0],
  [123.0, 23.0],
  [106.0, 23.0],
  [106.0, 3.0],
]

function pointInPolygon(point: LonLat, poly: LonLat[]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isInChinaRegion(lon: number, lat: number): boolean {
  if (lon < 72 || lon > 136 || lat < 2 || lat > 55) return false
  const p: LonLat = [lon, lat]
  return pointInPolygon(p, CHINA_OUTLINE) || pointInPolygon(p, SOUTH_CHINA_SEA_BOX)
}

export function chinaOutlineGeoJson(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'ChinaRegionApprox' },
        geometry: { type: 'Polygon', coordinates: [CHINA_OUTLINE] },
      },
      {
        type: 'Feature',
        properties: { name: 'SouthChinaSeaApprox' },
        geometry: { type: 'Polygon', coordinates: [SOUTH_CHINA_SEA_BOX] },
      },
    ],
  }
}
