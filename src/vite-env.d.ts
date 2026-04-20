/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 设为 `true` 时从 `/data/real/` 加载 t2m、anomaly、national_stats */
  readonly VITE_USE_REAL_GRID?: string
  /** 旧版 JSON 无 gridLayout 且 NC 行序为南→北时可设 `true` 以纠正与底图错位 */
  readonly VITE_REAL_GRID_FLIP_ROWS?: string
  readonly VITE_REAL_GRID_FLIP_COLS?: string
  /** 热力横向分条数 1～16，减轻大范围 image 源取整扭曲 */
  readonly VITE_HEAT_RASTER_STRIPS?: string
  /** 热力四角纬度平移（度） */
  readonly VITE_HEAT_RASTER_LAT_SHIFT?: string
  /** 为 true 时对导出 PNG 做纵向翻转（少数数据行序与 Canvas 不一致时试） */
  readonly VITE_HEAT_FLIP_IMAGE_Y?: string
  /** 是否显示国界，默认 true；`false` / `0` / `no` 为关 */
  readonly VITE_MAP_SHOW_COUNTRY?: string
  /** 是否显示省界，默认 true */
  readonly VITE_MAP_SHOW_PROVINCE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
