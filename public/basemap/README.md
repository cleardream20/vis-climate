# 本地底图瓦片（方案 B）

本目录存放预下载的栅格瓦片：`{z}/{x}/{y}.png`。

## 生成

在仓库根目录的 Conda 环境中：

```bash
cd data
python download_basemap_tiles.py
```

可选：`--max-zoom 7` 减小体积；`--dry-run` 只统计张数。

## 启用

复制 `heatwave-viz/.env.example` 为 `.env.local`，设置：

```
VITE_USE_LOCAL_BASEMAP=true
```

未设置或为 `false` 时仍使用 CARTO 在线瓦片。

瓦片来源与 `src/lib/mapStyle.ts` 在线地址一致（CARTO `light_nolabels`，数据 © OpenStreetMap © CARTO）。
