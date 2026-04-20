/** 单次栅格构建结果（地图 + 左上角 HUD） */
export type HeatRasterBuildResult = {
  imageData: ImageData
  /** 年最高模式：该年「最热月」日历月（1–12）；年内为 null */
  annualHottestMonth: number | null
  /** 热浪档：当前帧格点上的全国平均 ℃ 与格点最高 ℃（仅统计有限值） */
  heatwaveMeanMaxC: { mean: number; max: number } | null
  /** 距平场：当前帧全国平均距平与格点最大距平（℃） */
  anomalyMeanMaxC: { mean: number; max: number } | null
}
