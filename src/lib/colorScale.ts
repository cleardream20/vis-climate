import { HEAT_PALETTE } from './constants'
import { FIELD_VISUAL } from './fieldVisualConfig'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ]
}

const NO_DATA_RGBA: [number, number, number, number] = [0, 0, 0, 0]

/** 可选：若 `mistRgbPull>0` 则向灰靠拢，用于轻微柔化 */
function applyMistRgb(r: number, g: number, b: number): [number, number, number] {
  const t = FIELD_VISUAL.mistRgbPull
  if (t <= 0) return [r, g, b]
  const gx = FIELD_VISUAL.mistMixGray
  return [
    Math.round(r + (gx - r) * t),
    Math.round(g + (gx - g) * t),
    Math.round(b + (gx - b) * t),
  ]
}

/** 距平图例与栅格：色标锚点 */
export const ANOMALY_PALETTE_NORMAL = [
  '#172554',
  '#1d4ed8',
  '#7c3aed',
  '#e879f9',
  '#fb7185',
  '#dc2626',
] as const

export const ANOMALY_PALETTE_COLORBLIND = ['#0a2540', '#219EBC', '#ffb703', '#fb8500'] as const

/** 0=无热浪（透明）；1..4 为离散档 */
export function levelToRgba(
  level: number,
  colorBlind: boolean,
): [number, number, number, number] {
  if (level <= 0) return [0, 0, 0, 0]

  const palette = colorBlind ? HEAT_PALETTE.colorBlind : HEAT_PALETTE.normal
  const idx = Math.max(0, Math.min(3, Math.floor(level) - 1))
  const [r, g, b] = hexToRgb(palette[idx])
  const [mr, mg, mb] = applyMistRgb(r, g, b)
  const alphaBand = [0.88, 0.9, 0.92, 0.94] as const
  const a = alphaBand[idx]
  return [mr, mg, mb, Math.round(FIELD_VISUAL.mistFieldAlpha * a)]
}

/**
 * 距平场：色标锚点间 **RGB 连续渐变**；无数据区（强度低于 0.1）透明以露出底图。
 */
export function anomalyFieldRgba(
  t: number,
  colorBlind: boolean,
): [number, number, number, number] {
  const x = Math.max(0, Math.min(1, t))
  if (x < 0.1) return NO_DATA_RGBA
  const x2 = (x - 0.1) / 0.9

  const hexes = colorBlind ? ANOMALY_PALETTE_COLORBLIND : ANOMALY_PALETTE_NORMAL
  const pal = hexes.map((h) => hexToRgb(h))
  const segs = pal.length - 1
  const pos = Math.min(segs - 1e-9, Math.max(0, x2 * segs))
  const i = Math.floor(pos)
  const frac = pos - i
  const rgb = lerpRgb(pal[i], pal[i + 1], frac)
  const [mr, mg, mb] = applyMistRgb(rgb[0], rgb[1], rgb[2])
  return [mr, mg, mb, FIELD_VISUAL.mistFieldAlpha]
}

/** 真实距平（℃）上色：约 -8℃（偏冷）→ +8℃（偏暖），与 `anomalyFieldRgba` 色带一致 */
export function anomalyCelsiusToRgba(
  deltaC: number,
  colorBlind: boolean,
): [number, number, number, number] {
  if (!Number.isFinite(deltaC)) return NO_DATA_RGBA
  const lo = -8
  const hi = 8
  const u = Math.max(0, Math.min(1, (deltaC - lo) / (hi - lo)))
  const x = 0.1 + u * 0.9
  return anomalyFieldRgba(x, colorBlind)
}

const TEMP_COLOR_STOPS: { temp: number; rgb: [number, number, number] }[] = [
  { temp: 50, rgb: [53, 18, 19] },
  { temp: 40, rgb: [107, 37, 52] },
  { temp: 30, rgb: [166, 60, 100] },
  { temp: 25, rgb: [197, 107, 87] },
  { temp: 20, rgb: [202, 150, 73] },
  { temp: 15, rgb: [202, 187, 66] },
  { temp: 10, rgb: [168, 197, 72] },
  { temp: 5, rgb: [92, 181, 80] },
  { temp: 0, rgb: [84, 164, 142] },
  { temp: -5, rgb: [72, 117, 174] },
  { temp: -10, rgb: [90, 84, 159] },
  { temp: -15, rgb: [56, 47, 108] },
  { temp: -20, rgb: [134, 32, 134] },
  { temp: -30, rgb: [217, 153, 217] },
  { temp: -40, rgb: [198, 198, 198] },
]

export function getTempColorStops() {
  return TEMP_COLOR_STOPS
}

/**
 * 气温场：在相邻温度色标间 **连续插值**（填充质感，不透明）。
 */
export function temperatureToRgba(tempC: number): [number, number, number, number] {
  const stops = TEMP_COLOR_STOPS
  if (tempC >= stops[0].temp) {
    const [r, g, b] = applyMistRgb(...stops[0].rgb)
    return [r, g, b, FIELD_VISUAL.mistFieldAlpha]
  }
  if (tempC <= stops[stops.length - 1].temp) {
    const [r, g, b] = applyMistRgb(...stops[stops.length - 1].rgb)
    return [r, g, b, FIELD_VISUAL.mistFieldAlpha]
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (tempC <= a.temp && tempC >= b.temp) {
      const t = (tempC - b.temp) / (a.temp - b.temp)
      const rgb = lerpRgb(b.rgb, a.rgb, t)
      const [mr, mg, mb] = applyMistRgb(rgb[0], rgb[1], rgb[2])
      return [mr, mg, mb, FIELD_VISUAL.mistFieldAlpha]
    }
  }
  return NO_DATA_RGBA
}
