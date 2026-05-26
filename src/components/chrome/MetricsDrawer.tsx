import { useEffect, useMemo, useRef, useState } from 'react'
import { LineChart } from '../charts/LineChart'
import { DOMAIN } from '../../lib/constants'
import { computeDemoNationalStats } from '../../lib/demoMetrics'
import { nationalDemoHeatMetricSeries } from '../../lib/demoNationalHeatMetrics'
import {
  latitudinalProfile,
  longitudinalProfile,
  loadGridForYear,
  loadNationalTemperatureSeries,
  type YearValue,
} from '../../lib/gridAnalytics'
import {
  loadNationalStats,
  pickNationalStat,
  type NationalStatRow,
} from '../../lib/realNationalStats'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'
import { MetricYearSparkline } from './MetricYearSparkline'
import { ExportChartCard, ExportChartGrid } from './ExportChartCard'
import { ShareMenu } from './ShareMenu'

const CMA_BRIEF = [
  '高温日：日最高气温 ≥ 35℃',
  '热浪事件：连续 ≥ 3 天且每日最高 ≥ 35℃',
  '极端热浪：连续 ≥ 5 天且每日最高 ≥ 38℃',
  '超 40℃ 日数：日最高气温 ≥ 40℃',
] as const

function valueAtYear(series: { year: number; value: number }[], y: number): number | undefined {
  return series.find((r) => r.year === y)?.value
}

function toLineData(rows: YearValue[]) {
  return rows.map((d) => ({ x: d.year, y: d.value }))
}

export function MetricsDrawer() {
  const exportRef = useRef<HTMLDivElement>(null)
  const metricsOpen = useAppStore((s) => s.metricsOpen)
  const setMetricsOpen = useAppStore((s) => s.setMetricsOpen)
  const year = useAppStore(selectActiveYear)
  const yearHeatwave = useAppStore((s) => s.yearHeatwave)
  const vizMode = useAppStore((s) => s.vizMode)
  const [realRows, setRealRows] = useState<NationalStatRow[] | null>(null)
  const [tempSeries, setTempSeries] = useState<{
    meanByYear: YearValue[]
    maxByYear: YearValue[]
  } | null>(null)
  const [latProfile, setLatProfile] = useState<{ x: number; mean: number; max: number }[] | null>(
    null,
  )
  const [lonProfile, setLonProfile] = useState<{ x: number; mean: number; max: number }[] | null>(
    null,
  )
  const [chartsLoading, setChartsLoading] = useState(false)

  const yk = Math.round(year)

  useEffect(() => {
    void loadNationalStats().then(setRealRows)
  }, [])

  useEffect(() => {
    if (!metricsOpen) return
    let cancelled = false
    setChartsLoading(true)
    void (async () => {
      try {
        const ts = await loadNationalTemperatureSeries()
        if (cancelled) return
        setTempSeries(ts)
        const grid = await loadGridForYear(yk)
        if (cancelled) return
        setLatProfile(latitudinalProfile(grid))
        setLonProfile(longitudinalProfile(grid))
      } finally {
        if (!cancelled) setChartsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [metricsOpen, yk])

  const demoFour = useMemo(() => nationalDemoHeatMetricSeries(), [])

  const seriesHeatDays = useMemo(() => {
    if (realRows?.length) {
      return realRows.map((r) => ({ year: r.year, value: r.heatwaveDays }))
    }
    return demoFour.heatDays
  }, [realRows, demoFour.heatDays])

  const stats = useMemo(() => {
    const picked = pickNationalStat(year, realRows ?? undefined)
    if (picked) return picked
    return computeDemoNationalStats(year, vizMode)
  }, [year, vizMode, realRows])

  const fourAtYear = useMemo(() => {
    const row = realRows?.find((r) => r.year === yk)
    return {
      heat: row?.heatwaveDays ?? valueAtYear(seriesHeatDays, yk) ?? '—',
      hw: valueAtYear(demoFour.heatwaveEvents, yk) ?? '—',
      ex: valueAtYear(demoFour.extremeHeatwaveEvents, yk) ?? '—',
      s40: valueAtYear(demoFour.super40Days, yk) ?? '—',
    }
  }, [yk, realRows, seriesHeatDays, demoFour])

  if (!metricsOpen) return null

  return (
    <aside
      className="pointer-events-auto relative z-20 flex h-full w-[min(100%,400px)] shrink-0 flex-col border-l border-white/10 bg-[var(--chrome-bg)] shadow-2xl backdrop-blur-md"
      aria-label="全国指标与图表"
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="min-w-0 flex-1 text-sm font-semibold text-white">全国尺度 · 指标与图表</h2>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ShareMenu exportRootRef={exportRef} filenameBase="全国尺度-气候图表" />
          <button
            type="button"
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10"
            onClick={() => setMetricsOpen(false)}
          >
            关闭
          </button>
        </div>
      </div>

      <div ref={exportRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            当前年 · 摘要
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
          <p className="mt-2 text-[10px] text-slate-500" data-export-summary>
            {yk} 年：全国均温 {stats.meanTempC}℃ · 距平 {stats.anomalyC >= 0 ? '+' : ''}
            {stats.anomalyC}℃ · 热浪日 {stats.heatwaveDays} 天 · 高温日 {fourAtYear.heat} · 热浪事件{' '}
            {fourAtYear.hw} · 极端热浪 {fourAtYear.ex} · 超 40℃ {fourAtYear.s40} 天
          </p>
        </div>

        <div className="px-4 py-3">
          <section
            className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
            data-export-section
            data-export-skip-png
          >
            <h3
              data-export-title
              className="text-[10px] font-semibold text-amber-100/90"
            >
              CMA 业务口径
            </h3>
            <ul className="mt-1.5 space-y-0.5 text-[9px] leading-snug text-slate-400">
              {CMA_BRIEF.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </section>

          <section data-export-section className="mb-4">
            <h3
              data-export-title
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              温度 · 年际变化
            </h3>
            {chartsLoading && !tempSeries ? (
              <p className="text-[10px] text-slate-500">正在加载温度序列…</p>
            ) : null}
            {tempSeries ? (
              <ExportChartGrid>
                <ExportChartCard title="年平均气温" yLabel="气温 (℃)">
                  <LineChart
                    series={[
                      {
                        data: toLineData(tempSeries.meanByYear),
                        stroke: '#fbbf24',
                      },
                    ]}
                    xLabel="年份"
                    yLabel="℃"
                    xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
                    markerX={yearHeatwave}
                    xTicks={5}
                    yScale="tight"
                  />
                </ExportChartCard>
                <ExportChartCard title="年最高气温" yLabel="气温 (℃)">
                  <LineChart
                    series={[
                      {
                        data: toLineData(tempSeries.maxByYear),
                        stroke: '#f97316',
                      },
                    ]}
                    xLabel="年份"
                    yLabel="℃"
                    xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
                    markerX={yearHeatwave}
                    xTicks={5}
                    yScale="tight"
                  />
                </ExportChartCard>
              </ExportChartGrid>
            ) : null}
          </section>

          <section data-export-section className="mb-4">
            <h3
              data-export-title
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {yk} 年 · 纬度与经向剖面
            </h3>
            {latProfile && latProfile.length > 0 ? (
              <ExportChartGrid>
                <ExportChartCard
                  title="沿纬度（南→北）"
                  yLabel="气温 (℃)"
                  legend="蓝：平均 · 红：最高"
                >
                  <LineChart
                    series={[
                      {
                        data: latProfile.map((d) => ({ x: d.x, y: d.mean })),
                        stroke: '#38bdf8',
                      },
                      {
                        data: latProfile.map((d) => ({ x: d.x, y: d.max })),
                        stroke: '#f87171',
                      },
                    ]}
                    xLabel="纬度 (°N)"
                    yLabel="℃"
                    xTickFormat={(d) => `${Math.round(Number(d as number))}°`}
                    yScale="tight"
                  />
                </ExportChartCard>
                {lonProfile && lonProfile.length > 0 ? (
                  <ExportChartCard
                    title="沿经度（西→东）"
                    yLabel="气温 (℃)"
                    legend="蓝：平均 · 红：最高"
                  >
                    <LineChart
                      series={[
                        {
                          data: lonProfile.map((d) => ({ x: d.x, y: d.mean })),
                          stroke: '#38bdf8',
                        },
                        {
                          data: lonProfile.map((d) => ({ x: d.x, y: d.max })),
                          stroke: '#f87171',
                        },
                      ]}
                      xLabel="经度 (°E)"
                      yLabel="℃"
                      xTickFormat={(d) => `${Math.round(Number(d as number))}°`}
                      yScale="tight"
                    />
                  </ExportChartCard>
                ) : null}
              </ExportChartGrid>
            ) : null}
          </section>

          <section data-export-section>
            <h3
              data-export-title
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              1974–{DOMAIN.yearMax} · 热浪过程指标
            </h3>
            <ExportChartGrid>
              <ExportChartCard title="热浪日数" yLabel="天/年">
                <MetricYearSparkline
                  data={seriesHeatDays}
                  stroke="#fbbf24"
                  yLabel="天"
                  markerYear={year}
                />
              </ExportChartCard>
              <ExportChartCard title="热浪事件" yLabel="次/年">
                <MetricYearSparkline
                  data={demoFour.heatwaveEvents}
                  stroke="#fb923c"
                  yLabel="次"
                  markerYear={year}
                />
              </ExportChartCard>
              <ExportChartCard title="极端热浪事件" yLabel="次/年">
                <MetricYearSparkline
                  data={demoFour.extremeHeatwaveEvents}
                  stroke="#f87171"
                  yLabel="次"
                  markerYear={year}
                />
              </ExportChartCard>
              <ExportChartCard title="超 40℃ 日数" yLabel="天/年">
                <MetricYearSparkline
                  data={demoFour.super40Days}
                  stroke="#dc2626"
                  yLabel="天"
                  markerYear={year}
                />
              </ExportChartCard>
            </ExportChartGrid>
          </section>
        </div>
      </div>
    </aside>
  )
}
