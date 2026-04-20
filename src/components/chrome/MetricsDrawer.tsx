import { useEffect, useMemo, useState } from 'react'
import { DOMAIN } from '../../lib/constants'
import { computeDemoNationalStats } from '../../lib/demoMetrics'
import { nationalDemoHeatMetricSeries } from '../../lib/demoNationalHeatMetrics'
import {
  loadNationalStats,
  pickNationalStat,
  type NationalStatRow,
} from '../../lib/realNationalStats'
import { formatTimelineLabel } from '../../lib/temporalTypes'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'
import { MetricYearSparkline } from './MetricYearSparkline'

const CMA_BRIEF = [
  '高温日：日最高气温 ≥ 35℃',
  '热浪事件：连续 ≥ 3 天且每日最高 ≥ 35℃',
  '极端热浪：连续 ≥ 5 天且每日最高 ≥ 38℃',
  '超 40℃ 日数：日最高气温 ≥ 40℃',
] as const

function valueAtYear(series: { year: number; value: number }[], y: number): number | undefined {
  return series.find((r) => r.year === y)?.value
}

export function MetricsDrawer() {
  const metricsOpen = useAppStore((s) => s.metricsOpen)
  const vizMode = useAppStore((s) => s.vizMode)
  const temporalField = useAppStore((s) => s.temporalField)
  const annualHottestMonthByYear = useAppStore((s) => s.annualHottestMonthByYear)
  const year = useAppStore(selectActiveYear)
  const yearAnomaly = useAppStore((s) => s.yearAnomaly)
  const yearHeatwave = useAppStore((s) => s.yearHeatwave)
  const userMode = useAppStore((s) => s.userMode)
  const [realRows, setRealRows] = useState<NationalStatRow[] | null>(null)

  useEffect(() => {
    void loadNationalStats().then(setRealRows)
  }, [])

  const chartIsReal = Boolean(realRows?.length)
  const demoFour = useMemo(() => nationalDemoHeatMetricSeries(), [])

  /** JSON 中热浪日数是否全为 0（旧版「全国日平均≥28℃」口径易如此） */
  const realHeatAllZero = Boolean(
    chartIsReal && realRows!.every((r) => (r.heatwaveDays ?? 0) === 0),
  )

  const seriesHeatDaysOrJson = useMemo(() => {
    if (realRows?.length) {
      return realRows.map((r) => ({ year: r.year, value: r.heatwaveDays }))
    }
    return demoFour.heatDays
  }, [realRows, demoFour.heatDays])

  const monthFor = (y: number) =>
    temporalField === 'annualMax' ? annualHottestMonthByYear[Math.round(y)] : undefined

  const stats = useMemo(() => {
    const picked = pickNationalStat(year, realRows ?? undefined)
    if (picked) return picked
    return computeDemoNationalStats(year, vizMode)
  }, [year, vizMode, realRows])

  const yk = Math.round(year)
  const fourAtYear = useMemo(() => {
    const row = realRows?.find((r) => r.year === yk)
    return {
      heatOrJson: row?.heatwaveDays ?? valueAtYear(seriesHeatDaysOrJson, yk) ?? '—',
      hw: valueAtYear(demoFour.heatwaveEvents, yk) ?? '—',
      ex: valueAtYear(demoFour.extremeHeatwaveEvents, yk) ?? '—',
      s40: valueAtYear(demoFour.super40Days, yk) ?? '—',
    }
  }, [yk, realRows, seriesHeatDaysOrJson, demoFour])

  if (!metricsOpen) return null

  return (
    <aside
      className="pointer-events-auto relative z-20 flex h-full w-[min(100%,400px)] shrink-0 flex-col border-l border-white/10 bg-[var(--chrome-bg)] shadow-2xl backdrop-blur-md"
      aria-label="指标与图表"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">全国尺度 · 指标与图表</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          与地图联动（当前模式 {formatTimelineLabel(year, temporalField, monthFor(year))}；距平{' '}
          {formatTimelineLabel(yearAnomaly, temporalField, monthFor(yearAnomaly))} / 热浪{' '}
          {formatTimelineLabel(yearHeatwave, temporalField, monthFor(yearHeatwave))}）。
          {chartIsReal
            ? ' 首图纵轴为 national_stats.json 中的热浪日数字段；后三图为 CMA 口径演示序列（待 bundle 扩展）。'
            : ' 未检测到 national_stats.json 时四类年序均为演示合成。'}
        </p>
      </div>

      <div className="border-b border-white/10 px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {chartIsReal ? '当前年 · 摘要（栅格聚合）' : '当前年 · 演示读数'}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <div className="text-[10px] text-slate-400">全国均温</div>
            <div className="font-mono text-lg font-semibold text-amber-200">
              {stats.meanTempC}
              <span className="text-xs text-slate-500">℃</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <div className="text-[10px] text-slate-400">距平</div>
            <div
              className={`font-mono text-lg font-semibold ${stats.anomalyC >= 0 ? 'text-red-300' : 'text-sky-300'}`}
            >
              {stats.anomalyC >= 0 ? '+' : ''}
              {stats.anomalyC}
              <span className="text-xs text-slate-500">℃</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <div className="text-[10px] text-slate-400">热浪日</div>
            <div className="font-mono text-lg font-semibold text-orange-200">
              {stats.heatwaveDays}
              <span className="text-xs text-slate-500">d</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          当前年 · 四类过程读数：
          <span className="ml-1 font-mono text-slate-300">
            {chartIsReal ? 'JSON日数' : '高温日'}
            {fourAtYear.heatOrJson}
          </span>
          <span className="text-slate-600"> · </span>
          <span className="font-mono text-slate-300">事件{fourAtYear.hw}</span>
          <span className="text-slate-600"> · </span>
          <span className="font-mono text-slate-300">极端{fourAtYear.ex}</span>
          <span className="text-slate-600"> · </span>
          <span className="font-mono text-slate-300">≥40℃ {fourAtYear.s40}d</span>
        </p>
        {realHeatAllZero ? (
          <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-amber-100/95">
            检测到 national_stats 中「热浪日」历年均为 0：多为旧脚本用「全国格点<strong>日平均</strong>温 ≥
            28℃」计数，域平均常年达不到阈值。已在{' '}
            <code className="rounded bg-black/30 px-0.5">data/build_public_bundle.py</code>{' '}
            改为「当日全网格<strong>最高气温</strong> ≥ 35℃」的天数；请重新运行打包生成 JSON 后刷新。
          </p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <section className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <h3 className="text-[10px] font-semibold text-amber-100/90">CMA 业务口径（全国展示）</h3>
          <ul className="mt-1.5 space-y-0.5 text-[9px] leading-snug text-slate-400">
            {CMA_BRIEF.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </section>

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          1974–{DOMAIN.yearMax} 年序
        </h3>
        <div className="space-y-3">
          <div>
            <p className="mb-0.5 text-[10px] font-medium text-slate-400">
              {chartIsReal
                ? realHeatAllZero
                  ? '热浪日数（national_stats，旧口径可能全 0）'
                  : '热浪日数（national_stats，与 bundle 定义一致）'
                : '高温日（天/年，演示 · Tmax≥35℃）'}
            </p>
            <MetricYearSparkline
              data={seriesHeatDaysOrJson}
              stroke="#fbbf24"
              yLabel={chartIsReal ? 'd' : '天'}
              markerYear={year}
            />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium text-slate-400">
              热浪事件（次/年，演示 · 连续≥3 天且每日≥35℃）
            </p>
            <MetricYearSparkline data={demoFour.heatwaveEvents} stroke="#fb923c" yLabel="次" markerYear={year} />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium text-slate-400">
              极端热浪事件（次/年，演示 · 连续≥5 天且每日≥38℃）
            </p>
            <MetricYearSparkline
              data={demoFour.extremeHeatwaveEvents}
              stroke="#f87171"
              yLabel="次"
              markerYear={year}
            />
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium text-slate-400">超 40℃ 日数（天/年，演示）</p>
            <MetricYearSparkline data={demoFour.super40Days} stroke="#dc2626" yLabel="天" markerYear={year} />
          </div>
        </div>

        {userMode === 'pro' && (
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            专业模式将扩展导出与 bundle 中写入四类全国统计后，此处与 JSON 完全对齐。
          </p>
        )}
      </div>
    </aside>
  )
}
