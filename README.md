# HeatwaveViz（中国热浪五十年演变）

面向《虚拟现实与数据可视化技术》课程实验的可视化前端：**单页、地图主画布、全局联动状态**，与 `docs/guideline.md` 中的架构一致。

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 状态 | Zustand（年份、用户模式、色盲模式、侧栏开关） |
| 地图 | MapLibre GL JS（**灰度细节底图**：保留江河湖泊/地形纹理，但整体去彩；热力层见下「调参」） |
| 图表 | D3（指标折线，Canvas/SVG 可后续按数据量切换） |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite`） |

## 目录结构（可扩展）

```
src/
  app/           # AppShell：整体布局
  components/
    map/         # 地图与栅格层（后续可换 Deck.gl / 自定义 shader）
    chrome/      # 顶栏、时间轴、图例、指标抽屉
    story/       # 故事线（`StoryPanel.tsx`：叠在地图左上列 HUD→搜索之下，可滚动）
  lib/           # 常量、色带、合成栅格（演示用）
  store/         # Zustand
```

## 运行

```bash
cd heatwave-viz
npm install
npm run dev
```

数据处理与 NetCDF 下载脚本在仓库根目录 `data/`，建议使用 **Conda** 独立环境安装 `data/requirements.txt` 中的 Python 依赖；前端使用 **Node/npm**，与 Conda 互不冲突。

## 地图与图层调参（Ventusky 式观感）

| 想改的内容 | 文件与位置 |
|------------|------------|
| 底图细节与灰度强度 | `src/lib/mapStyle.ts`：`BASEMAP_WATER_HEX`、`sources.carto.tiles`、`base-gray-detail.paint`（`raster-saturation` / `raster-contrast` / `raster-brightness-min`·`max`） |
| 国界 / 中国省界（深色矢量线，叠在热力之上） | `src/lib/mapBoundaries.ts`：省界 GeoJSON 为 **Natural Earth v5.1.2 完整 admin-1**（jsDelivr）；勿使用 cloudfront `naturalearth-3.3.0` 下同路径子集（仅约百条要素、无中国） |
| 填充质感 / 轻微云雾（可选） | **`src/lib/fieldVisualConfig.ts`**：`mistRgbPull=0` 为实色填充；若需薄膜感可略增 `mistRgbPull` 并降 `mistFieldAlpha` |
| 距平/气温渐变与色标 | `src/lib/colorScale.ts`：`anomalyFieldRgba`（锚点间 lerp）、`temperatureToRgba`；`src/lib/syntheticGrid.ts`：`RASTER_STRIDE` |
| 国界 / 省界 | `src/lib/mapBoundaries.ts`：`BOUNDARY_LAYER_PROVINCE_CN` 细于国界；`adm0_a3` / `sr_adm0_a3` 等过滤 `CHN` |
| 中国周边视野与 fitBounds 留白 | `src/lib/constants.ts`：`CHINA_NAV_BOUNDS`；`src/lib/mapViewConfig.ts`：`fitBounds` 的 `padding` |
| 城市标注分级 / 地图搜索 | `src/lib/places.ts`（`national`→`county` 与 `minZoomForTier`）；`MapPlaceSearch.tsx`；缩放时 `HeatmapMap` 内 `zoomend` 重绘标注 |
| 点击城市 / 搜索选点 · 右侧城市洞察 | 标注可点选（`placeMarkers` + `HeatmapMap` 绑定 `setSelectedPlace`）；`CityDetailDrawer.tsx`：层级文案、经纬度度分秒、本地时区时间、CMA 四层热浪指标说明、1974–2023 四类指标演示折线、可选年月的「日最高气温」演示折线；状态见 `useAppStore.selectedPlace` |
| 顶栏「指标」· 全国侧栏 | `MetricsDrawer.tsx`：摘要卡 + CMA 四层简介 + **1974–2023 四张年序折线**（`MetricYearSparkline.tsx`）；有 `national_stats.json` 时**首图**使用该文件中的热浪日数，后三图为演示序列（`demoNationalHeatMetrics.ts`）；竖线与时间轴当前年联动 |

## 数据说明（重要）

**当前地图上的场不是真实观测数据。**

- 格点值来自 `src/lib/demoField.ts` 里的 **`scalarField01`**：用数学函数（高斯团块、正弦项等）在 0～1 之间造的一个**演示标量场**，仅用于打通交互与可视化。
- 「气温」展示模式（热浪档）里，该标量再经 **`scalarToTempC`** 线性映射到约 **-38～48℃**（`t=0` 对应 -38℃，与真实年均温分布无关）。
- 色标在 `src/lib/colorScale.ts` 的 `TEMP_COLOR_STOPS`：例如 **-20℃、-30℃** 附近对应紫红、浅粉紫等，演示场在空间上很容易大量落在偏冷的温度档，**视觉上会像大片粉红/紫色，这不代表真实零下二十多度的面积分布**。
- 距平模式同理：是对同一套演示标量做分档/渐变上色，**不是**真实距平场。

若要 **真实数据**，需用 ERA5、再分析或自处理结果替换上述合成场（见下节）。

## 与真实数据对接

完整步骤与 DOMAIN 约定见仓库根目录 **`docs/real-data-integration.md`**。

**已实现的接入方式：**

1. 在 Conda 环境中用 **`data/build_public_bundle.py`**（推荐）从 `data/nc/china_temp_*.nc` 批量生成 **`t2m_YYYY.json`、`anomaly_YYYY.json`、`t2m_annual_max_YYYY.json`（最热月月均温场）、`national_stats.json`** 到 **`public/data/real/`**；或单文件使用 `data/export_grid_json.py`。
2. 复制 **`.env.example`** 为 **`.env.local`**，设置 **`VITE_USE_REAL_GRID=true`**（示例默认已开启），再 `npm run dev`。
3. 地图：**热浪** 用真实气温，**距平** 用真实距平栅格；侧栏指标与热浪日曲线来自 **`national_stats.json`**；流场用气温梯度近似。任一文件缺失时自动回退 **`demoField` 合成场** / 演示指标。  
   **`heatwaveDays` 含义**：新版 `build_public_bundle.py` 为「全年中当日**全网格 2m 气温最大值** ≥ 阈值（默认 **35℃**）」的天数，与「全国日平均 ≥28℃」的旧口径不同；若 JSON 中历年均为 0，多为旧产物，请用当前脚本重新导出。

悬停：真实模式下热浪显示 ℃，距平显示距平 ℃；否则仍用演示场插值。

**时间与顶栏：** 顶栏「年内 / 年最高」——**年内** 为 12 档/年（月）拖动与播放；**年最高** 为每年一帧：`t2m_annual_max_*.json` 表示**全国格点平均温最高的日历月**的月平均 2m 气温（`build_public_bundle.py` 写入 `meta.hottestMonth`）；缺文件时回退代表日 `t2m_*.json`。左上角 HUD：**热浪档** 显示当前图层格点的全国均温与格点最高温（海洋缺测透明、不计入）；**距平场** 显示全国平均距平与格点最大距平。悬停无值时固定**北京**占位行。

**栅格与底图对齐：** MapLibre 大范围 `image` 源偶发轻微扭曲感；默认 **4 条**水平 image（`VITE_HEAT_RASTER_STRIPS` 可调，1 为单张）。纬度微调 **`VITE_HEAT_RASTER_LAT_SHIFT`**（度）。

```bash
python data/build_public_bundle.py --nc-dir data --out heatwave-viz/public/data/real --day 181
```

## 性能注意（实验报告可写）

- 全量 361×621 像素 PNG 纹理 + `raster-opacity` + `raster-fade-duration: 0` 避免切换闪烁；
- 年份切换仅 `updateImage`，不重建几何；
- 后续 22 万矢量面需改为 **GPU 纹理/实例化**（guideline 5.3）。
