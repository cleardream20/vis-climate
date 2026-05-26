import * as d3 from 'd3'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LineChart } from '../charts/LineChart'
import { DOMAIN } from '../../lib/constants'
import {
  cityHeatMetricSeries,
  cityMonthDailyMaxSeries,
} from '../../lib/demoCityHeatMetrics'
import { loadCityTemperatureSeries } from '../../lib/gridAnalytics'
import {
  formatLatitudeDMS,
  formatLocalTimeLine,
  formatLongitudeDMS,
  formatPlaceHierarchyLine,
  ianaTimezoneForPlace,
} from '../../lib/geoFormat'
import { placeMapLabel } from '../../lib/placeMarkers'
import { LINE_CHART_MARGIN, LINE_CHART_HEIGHT } from '../../lib/lineChartLayout'
import { computeYDomain } from '../../lib/chartYDomain'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'
import { MetricYearSparkline } from './MetricYearSparkline'
import { ExportChartCard, ExportChartGrid } from './ExportChartCard'
import { ShareMenu } from './ShareMenu'

function DayPointSparkline({
  series,
  xLabel,
  yLabel,
  stroke,
}: {
  series: { x: number; y: number }[]
  xLabel: string
  yLabel: string
  stroke: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || series.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const margin = LINE_CHART_MARGIN
    const w = svgRef.current.clientWidth || 280
    const h = LINE_CHART_HEIGHT
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    const x = d3
      .scalePoint<number>()
      .domain(series.map((d) => d.x))
      .range([0, innerW])
      .padding(0.2)

    const yMax = d3.max(series, (d) => d.y) ?? 1
    const yMin = d3.min(series, (d) => d.y) ?? 0
    const [yLo, yHi] = computeYDomain(yMin, yMax, 'tight')
    const y = d3
      .scaleLinear()
      .domain([yLo, yHi])
      .nice()
      .range([innerH, 0])

    const g = svg
      .attr('viewBox', `0 0 ${w} ${h}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x)!)
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX)

    g.append('path').datum(series).attr('fill', 'none').attr('stroke', stroke).attr('stroke-width', 1.6).attr('d', line)

    const ticks = series
      .filter((_, i) => i % Math.max(1, Math.ceil(series.length / 6)) === 0)
      .map((d) => d.x)
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues(ticks))
      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 26)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10)
      .text(xLabel)

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10)
      .text(yLabel)
  }, [series, xLabel, yLabel, stroke])

  return <svg ref={svgRef} className="w-full" style={{ height: LINE_CHART_HEIGHT }} role="img" />
}

const METRIC_COPY = [
  {
    title: '1) 高温日',
    def: '日最高气温 ≥ 35°C',
    role: '刻画「热」的出现频次',
  },
  {
    title: '2) 热浪事件',
    def: '连续 ≥ 3 天，且每日最高气温 ≥ 35°C',
    role: '区分偶发高温与持续性热风险',
  },
  {
    title: '3) 极端热浪事件',
    def: '连续 ≥ 5 天，且每日最高气温 ≥ 38°C',
    role: '识别高强度、高持续性极端过程',
  },
  {
    title: '4) 超 40°C 日数',
    def: '日最高气温 ≥ 40°C',
    role: '关注极端阈值突破频率',
  },
] as const

function toYearLine(rows: { year: number; value: number }[]) {
  return rows.map((d) => ({ x: d.year, y: d.value }))
}

export function CityDetailDrawer() {
  const exportRef = useRef<HTMLDivElement>(null)
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)
  const timelineYear = useAppStore(selectActiveYear)
  const [clock, setClock] = useState(0)
  const [monthYear, setMonthYear] = useState<number>(DOMAIN.yearMax)
  const [month, setMonth] = useState<number>(7)
  const [cityTemp, setCityTemp] = useState<Awaited<
    ReturnType<typeof loadCityTemperatureSeries>
  > | null>(null)
  const [tempLoading, setTempLoading] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setClock((c) => c + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const tz = selectedPlace ? ianaTimezoneForPlace(selectedPlace) : 'Asia/Shanghai'
  const timeLine = useMemo(() => formatLocalTimeLine(tz), [tz, clock])

  const metrics = useMemo(() => {
    if (!selectedPlace) return null
    return cityHeatMetricSeries(selectedPlace)
  }, [selectedPlace])

  const monthSeries = useMemo(() => {
    if (!selectedPlace) return []
    return cityMonthDailyMaxSeries(selectedPlace, monthYear, month).map((d) => ({
      x: d.day,
      y: d.tmax,
    }))
  }, [selectedPlace, monthYear, month])

  useEffect(() => {
    if (!selectedPlace) {
      setCityTemp(null)
      return
    }
    let cancelled = false
    setTempLoading(true)
    void loadCityTemperatureSeries(selectedPlace).then((data) => {
      if (!cancelled) {
        setCityTemp(data)
        setTempLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedPlace])

  const onClose = useCallback(() => setSelectedPlace(null), [setSelectedPlace])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!selectedPlace || !metrics) return null

  const label = placeMapLabel(selectedPlace)
  const years = []
  for (let y = DOMAIN.yearMin; y <= DOMAIN.yearMax; y++) years.push(y)
  const latLabel = `${selectedPlace.lat.toFixed(1)}°N 纬度带`
  const lonLabel = `${selectedPlace.lon.toFixed(1)}°E 经度带`

  return (
    <aside
      className="pointer-events-auto relative z-[25] flex h-full w-[min(100vw,420px)] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[var(--chrome-bg)] shadow-2xl backdrop-blur-md"
      role="dialog"
      aria-label={`${label} 城市洞察`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-white">{label}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
            {formatPlaceHierarchyLine(selectedPlace)}
          </p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-300">
            {formatLatitudeDMS(selectedPlace.lat)} / {formatLongitudeDMS(selectedPlace.lon)} /{' '}
            {timeLine}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ShareMenu
            exportRootRef={exportRef}
            filenameBase={`城市-${label}-气候图表`}
          />
          <button
            type="button"
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>

      <div ref={exportRef} className="flex-1 overflow-y-auto px-4 py-3">
        <p
          className="mb-3 text-[10px] leading-relaxed text-slate-400"
          data-export-summary
        >
          {formatPlaceHierarchyLine(selectedPlace)} · {formatLatitudeDMS(selectedPlace.lat)} /{' '}
          {formatLongitudeDMS(selectedPlace.lon)}
        </p>

        <section
          className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3"
          data-export-section
          data-export-skip-png
        >
          <h3 data-export-title className="text-xs font-semibold text-amber-100/95">
            CMA 业务口径 · 四层热浪指标
          </h3>
          <ul className="mt-2 space-y-2">
            {METRIC_COPY.map((m) => (
              <li key={m.title} className="text-[10px] leading-relaxed text-slate-300">
                <span className="font-medium text-slate-200">{m.title}</span>
                <span className="text-slate-500"> — </span>
                <span className="text-slate-400">{m.def}</span>
                <br />
                <span className="text-slate-500">{m.role}</span>
              </li>
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
          {tempLoading && !cityTemp ? (
            <p className="text-[10px] text-slate-500">正在加载温度序列…</p>
          ) : null}
          {cityTemp ? (
            <ExportChartGrid>
              <ExportChartCard title="点位气温" yLabel="气温 (℃)">
                <LineChart
                  series={[
                    {
                      data: toYearLine(cityTemp.pointMeanByYear),
                      stroke: '#fbbf24',
                    },
                  ]}
                  xLabel="年份"
                  yLabel="℃"
                  xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
                  markerX={timelineYear}
                  xTicks={5}
                  yScale="tight"
                />
              </ExportChartCard>
              <ExportChartCard
                title={`${latLabel} · 平均 / 最高`}
                yLabel="气温 (℃)"
                legend="蓝：平均 · 红：最高"
              >
                <LineChart
                  series={[
                    {
                      data: toYearLine(cityTemp.latRowMeanByYear),
                      stroke: '#38bdf8',
                    },
                    {
                      data: toYearLine(cityTemp.latRowMaxByYear),
                      stroke: '#f87171',
                    },
                  ]}
                  xLabel="年份"
                  yLabel="℃"
                  xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
                  markerX={timelineYear}
                  xTicks={5}
                  yScale="tight"
                />
              </ExportChartCard>
              <ExportChartCard
                title={`${lonLabel} · 平均 / 最高`}
                yLabel="气温 (℃)"
                legend="蓝：平均 · 红：最高"
              >
                <LineChart
                  series={[
                    {
                      data: toYearLine(cityTemp.lonColMeanByYear),
                      stroke: '#38bdf8',
                    },
                    {
                      data: toYearLine(cityTemp.lonColMaxByYear),
                      stroke: '#f87171',
                    },
                  ]}
                  xLabel="年份"
                  yLabel="℃"
                  xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
                  markerX={timelineYear}
                  xTicks={5}
                  yScale="tight"
                />
              </ExportChartCard>
            </ExportChartGrid>
          ) : null}
        </section>

        <section data-export-section>
          <h3
            data-export-title
            className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            1974–2023 · 热浪过程指标
          </h3>
          <ExportChartGrid>
            <ExportChartCard title="高温日" yLabel="天/年">
              <MetricYearSparkline
                data={metrics.heatDays}
                stroke="#fbbf24"
                yLabel="天"
                markerYear={timelineYear}
              />
            </ExportChartCard>
            <ExportChartCard title="热浪事件" yLabel="次/年">
              <MetricYearSparkline
                data={metrics.heatwaveEvents}
                stroke="#fb923c"
                yLabel="次"
                markerYear={timelineYear}
              />
            </ExportChartCard>
            <ExportChartCard title="极端热浪事件" yLabel="次/年">
              <MetricYearSparkline
                data={metrics.extremeHeatwaveEvents}
                stroke="#f87171"
                yLabel="次"
                markerYear={timelineYear}
              />
            </ExportChartCard>
            <ExportChartCard title="超 40℃ 日数" yLabel="天/年">
              <MetricYearSparkline
                data={metrics.super40Days}
                stroke="#dc2626"
                yLabel="天"
                markerYear={timelineYear}
              />
            </ExportChartCard>
          </ExportChartGrid>
        </section>

        <section className="mt-5 border-t border-white/10 pt-4" data-export-section>
          <h3
            data-export-title
            className="mb-2 text-[11px] font-semibold text-slate-400"
          >
            月内日最高气温
          </h3>
          <div className="mb-2 flex flex-wrap gap-2">
            <label className="flex items-center gap-1 text-[10px] text-slate-400">
              年
              <select
                className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-white"
                value={monthYear}
                onChange={(e) => setMonthYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-slate-400">
              月
              <select
                className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-white"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m} 月
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ExportChartGrid>
            <ExportChartCard
              title={`${monthYear} 年 ${month} 月 · 日最高气温`}
              yLabel="气温 (℃)"
            >
              <DayPointSparkline series={monthSeries} xLabel="日" yLabel="℃" stroke="#38bdf8" />
            </ExportChartCard>
          </ExportChartGrid>
        </section>
      </div>
    </aside>
  )
}
