/**
 * 热力 / 距平场：**填充**为主，略向中性灰靠拢可减轻「又深又亮」的刺眼感。
 */
export const FIELD_VISUAL = {
  /** 混合目标灰（略亮则整体更柔和） */
  mistMixGray: 206,

  /** 略大于 0：压一点饱和度与明暗对比，仍保持填充感 */
  mistRgbPull: 0.12,

  mistFieldAlpha: 242,

  heatLayerOpacity: 0.9,

  heatRasterSaturation: -0.08,
  heatRasterContrast: -0.05,

  heatRasterFadeMs: 220,

  /**
   * 热力 image 四角纬度整体微调（°）。默认 0；若仍与底图有系统偏差可用 `VITE_HEAT_RASTER_LAT_SHIFT` 覆盖。
   */
  heatRasterLatShiftDeg: 0,

  /**
   * 将整块热力拆成多条水平 image 源，减轻 MapLibre 在大范围下单瓦片坐标取整带来的轻微「扭」感。
   * 可用 `VITE_HEAT_RASTER_STRIPS`（1～16）覆盖；设为 1 即恢复为单张纹理。
   */
  heatRasterStripCount: 4,
} as const
