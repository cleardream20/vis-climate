/** 是否从 /public/data/real/ 加载真实格点（热浪 t2m、距平 anomaly）与 national_stats */
export const USE_REAL_GRID = import.meta.env.VITE_USE_REAL_GRID === 'true'

export function realGridJsonUrl(year: number): string {
  return `/data/real/t2m_${year}.json`
}

export function realAnomalyJsonUrl(year: number): string {
  return `/data/real/anomaly_${year}.json`
}

/** 年最高温空间场（每年一图）；缺文件时回退 `t2m_${year}.json` */
export function realAnnualMaxJsonUrl(year: number): string {
  return `/data/real/t2m_annual_max_${year}.json`
}

export const NATIONAL_STATS_URL = '/data/real/national_stats.json'
