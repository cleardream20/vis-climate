import type { Place } from './places'

function splitDeg(deg: number): { sign: string; d: number; m: number; s: number } {
  const sign = deg >= 0 ? '' : '-'
  const a = Math.abs(deg)
  const d = Math.floor(a)
  const mf = (a - d) * 60
  const m = Math.floor(mf)
  const s = Math.round((mf - m) * 60)
  return { sign, d, m, s: s >= 60 ? 59 : s }
}

/** 例如 34°48′北 */
export function formatLatitudeDMS(lat: number): string {
  const { sign, d, m, s } = splitDeg(lat)
  const hem = lat >= 0 ? '北' : '南'
  return `${sign}${d}°${m}′${s !== 0 ? `${s}″` : ''}${hem}`.replace("''", '′')
}

/** 例如 117°19′东 */
export function formatLongitudeDMS(lon: number): string {
  const { sign, d, m, s } = splitDeg(lon)
  const hem = lon >= 0 ? '东' : '西'
  return `${sign}${d}°${m}′${s !== 0 ? `${s}″` : ''}${hem}`.replace("''", '′')
}

const PROVINCE_EN: Record<string, string> = {
  北京市: 'Beijing',
  天津市: 'Tianjin',
  上海市: 'Shanghai',
  重庆市: 'Chongqing',
  河北省: 'Hebei',
  山西省: 'Shanxi',
  内蒙古自治区: 'Inner Mongolia',
  辽宁省: 'Liaoning',
  吉林省: 'Jilin',
  黑龙江省: 'Heilongjiang',
  江苏省: 'Jiangsu',
  浙江省: 'Zhejiang',
  安徽省: 'Anhui',
  福建省: 'Fujian',
  江西省: 'Jiangxi',
  山东省: 'Shandong',
  河南省: 'Henan',
  湖北省: 'Hubei',
  湖南省: 'Hunan',
  广东省: 'Guangdong',
  广西壮族自治区: 'Guangxi',
  海南省: 'Hainan',
  四川省: 'Sichuan',
  贵州省: 'Guizhou',
  云南省: 'Yunnan',
  西藏自治区: 'Tibet',
  陕西省: 'Shaanxi',
  甘肃省: 'Gansu',
  青海省: 'Qinghai',
  宁夏回族自治区: 'Ningxia',
  新疆维吾尔自治区: 'Xinjiang',
  台湾省: 'Taiwan',
  香港特别行政区: 'Hong Kong',
  澳门特别行政区: 'Macau',
}

/** 繁体简称（与简体并列展示用） */
const PROVINCE_TW: Record<string, string> = {
  山东省: '山東',
  广东省: '廣東',
  广西壮族自治区: '廣西',
  内蒙古自治区: '內蒙古',
  宁夏回族自治区: '寧夏',
  新疆维吾尔自治区: '新疆',
  西藏自治区: '西藏',
}

/** 世界 / 中国 / 山東|山东 (Shandong) */
export function formatPlaceHierarchyLine(place: Place): string {
  const en = PROVINCE_EN[place.province] ?? place.province
  const tw = PROVINCE_TW[place.province]
  const mid = tw ? `${tw}|${place.province}` : place.province
  return `世界 / ${place.country} / ${mid} (${en})`
}

/** 中国大陆默认 Asia/Shanghai；新疆用 Asia/Urumqi */
export function ianaTimezoneForPlace(place: Place): string {
  if (place.province.includes('新疆')) return 'Asia/Urumqi'
  if (place.country !== '中国') return 'UTC'
  return 'Asia/Shanghai'
}

export function formatLocalTimeLine(timeZone: string): string {
  const d = new Date()
  if (timeZone === 'UTC') {
    const hm = d.toISOString().slice(11, 16)
    const ymd = d.toISOString().slice(0, 10)
    return `${hm} ${ymd}, UTC (UTC+0)`
  }
  const hm = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  const ymd = new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const gmt =
    new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  return `${hm} ${ymd}, ${timeZone} (${gmt})`
}
