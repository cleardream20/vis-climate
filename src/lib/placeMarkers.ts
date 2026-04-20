import type { Place, PlaceTier } from './places'

/** 地图与侧栏展示用：市/县等行政后缀 */
export function placeMapLabel(p: Place): string {
  if (p.tier === 'county') {
    if (/[市县区旗]$/.test(p.name)) return p.name
    return `${p.name}县`
  }
  if (/[市县区省州旗港澳]$/.test(p.name)) return p.name
  return `${p.name}市`
}

function markerStyle(tier: PlaceTier): {
  ring: number
  size: number
  fontPx: number
  fontWeight: string
} {
  switch (tier) {
    case 'national':
      return { ring: 2.4, size: 11, fontPx: 12, fontWeight: '700' }
    case 'province':
      return { ring: 2.1, size: 9, fontPx: 11, fontWeight: '600' }
    case 'prefecture':
      return { ring: 1.65, size: 7, fontPx: 10, fontWeight: '600' }
    case 'county':
    default:
      return { ring: 1.35, size: 6, fontPx: 9, fontWeight: '550' }
  }
}

/** 参考 zoom≈4 为 1；随地图放大略放大标注，避免高 zoom 下字相对变小 */
export function markerZoomScale(zoom: number): number {
  const zRef = 4
  const t = Math.pow(1.14, zoom - zRef)
  return Math.min(2.65, Math.max(0.72, t))
}

/** 黑边空心圆 + 分级字号/线粗；名称带市/县后缀；`zoom` 为当前地图缩放 */
export function createPlaceMarkerEl(place: Place, zoom: number): HTMLDivElement {
  const sc = markerZoomScale(zoom)
  const wrap = document.createElement('div')
  wrap.style.display = 'flex'
  wrap.style.alignItems = 'center'
  wrap.style.gap = `${Math.round(5 * sc)}px`
  wrap.style.pointerEvents = 'auto'
  wrap.style.cursor = 'pointer'
  wrap.setAttribute('role', 'button')
  wrap.setAttribute('aria-label', `查看 ${placeMapLabel(place)} 详情`)

  const { ring, size, fontPx, fontWeight } = markerStyle(place.tier)
  const ringPx = Math.max(0.9, ring * sc)
  const dotPx = Math.max(4, size * sc)

  const dot = document.createElement('span')
  dot.style.display = 'inline-block'
  dot.style.flexShrink = '0'
  dot.style.width = `${dotPx}px`
  dot.style.height = `${dotPx}px`
  dot.style.borderRadius = '9999px'
  dot.style.boxSizing = 'border-box'
  dot.style.background = 'transparent'
  dot.style.border = `${ringPx}px solid rgba(17,24,39,0.92)`
  dot.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.75)'
  wrap.appendChild(dot)

  const text = document.createElement('span')
  text.textContent = placeMapLabel(place)
  text.style.fontSize = `${Math.max(8, fontPx * sc)}px`
  text.style.fontWeight = fontWeight
  text.style.color = 'rgba(17,24,39,0.95)'
  text.style.textShadow = '0 1px 0 rgba(255,255,255,0.88)'
  text.style.letterSpacing = place.tier === 'county' ? '0.01em' : '0.02em'
  wrap.appendChild(text)

  return wrap
}
