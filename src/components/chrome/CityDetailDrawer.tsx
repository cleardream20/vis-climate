import * as d3 from 'd3'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DOMAIN } from '../../lib/constants'

import {

  cityHeatMetricSeries,

  cityMonthDailyMaxSeries,

} from '../../lib/demoCityHeatMetrics'

import {

  formatLatitudeDMS,

  formatLocalTimeLine,

  formatLongitudeDMS,

  formatPlaceHierarchyLine,

  ianaTimezoneForPlace,

} from '../../lib/geoFormat'

import { placeMapLabel } from '../../lib/placeMarkers'

import { selectActiveYear, useAppStore } from '../../store/useAppStore'

import { MetricYearSparkline } from './MetricYearSparkline'



/** 月内逐日折线（按「日」离散 scalePoint） */

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

    const margin = { top: 6, right: 8, bottom: 22, left: 34 }

    const w = svgRef.current.clientWidth || 280

    const h = 108

    const innerW = w - margin.left - margin.right

    const innerH = h - margin.top - margin.bottom



    const x = d3

      .scalePoint<number>()

      .domain(series.map((d) => d.x))

      .range([0, innerW])

      .padding(0.2)



    const yMax = d3.max(series, (d) => d.y) ?? 1

    const y = d3

      .scaleLinear()

      .domain([0, yMax + Math.max(1, yMax * 0.08)])

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

    const xAxis = d3.axisBottom(x).tickValues(ticks)

    const yAxis = d3.axisLeft(y).ticks(3)

    g.append('g')

      .attr('transform', `translate(0,${innerH})`)

      .call(xAxis)

      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))

    g.append('g')

      .call(yAxis)

      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))



    g.append('text')

      .attr('x', innerW / 2)

      .attr('y', innerH + 18)

      .attr('text-anchor', 'middle')

      .attr('fill', '#64748b')

      .attr('font-size', 9)

      .text(xLabel)



    g.append('text')

      .attr('transform', 'rotate(-90)')

      .attr('x', -innerH / 2)

      .attr('y', -24)

      .attr('text-anchor', 'middle')

      .attr('fill', '#64748b')

      .attr('font-size', 9)

      .text(yLabel)

  }, [series, xLabel, yLabel, stroke])



  return <svg ref={svgRef} className="h-[108px] w-full" role="img" />

}



const METRIC_COPY = [

  {

    title: '1) 高温日（Heat Day）',

    def: '日最高气温 ≥ 35°C',

    role: '刻画「热」的出现频次，是最基础的暴露指标',

  },

  {

    title: '2) 热浪事件（Heatwave Event）',

    def: '连续 ≥ 3 天，且每日最高气温 ≥ 35°C',

    role: '区分「偶发高温」与「持续性热风险」，反映过程性影响',

  },

  {

    title: '3) 极端热浪事件（Extreme Heatwave Event）',

    def: '连续 ≥ 5 天，且每日最高气温 ≥ 38°C',

    role: '识别高强度、高持续性的极端过程，用于风险预警与重点年份识别',

  },

  {

    title: '4) 超 40°C 日数（Super-Extreme Day）',

    def: '日最高气温 ≥ 40°C',

    role: '补充热浪事件之外的「强度上界」信息，关注极端阈值突破频率',

  },

] as const



export function CityDetailDrawer() {

  const selectedPlace = useAppStore((s) => s.selectedPlace)

  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const timelineYear = useAppStore(selectActiveYear)

  const [clock, setClock] = useState(0)

  const [monthYear, setMonthYear] = useState<number>(DOMAIN.yearMax)

  const [month, setMonth] = useState<number>(7)



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

            {formatLatitudeDMS(selectedPlace.lat)} / {formatLongitudeDMS(selectedPlace.lon)} / {timeLine}

          </p>

        </div>

        <button

          type="button"

          className="shrink-0 rounded-md border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10"

          onClick={onClose}

        >

          关闭

        </button>

      </div>



      <div className="flex-1 overflow-y-auto px-4 py-3">

        <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">

          <h3 className="text-xs font-semibold text-amber-100/95">CMA 业务口径 · 四层热浪指标</h3>

          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">

            本研究采用中国气象局（CMA）业务口径，构建四层热浪指标体系（以下为口径说明；侧栏年序曲线为演示合成序列，接入站点日值后将替换为真实统计）。

          </p>

          <ul className="mt-2 space-y-2">

            {METRIC_COPY.map((m) => (

              <li key={m.title} className="text-[10px] leading-relaxed text-slate-300">

                <span className="font-medium text-slate-200">{m.title}</span>

                <span className="text-slate-500"> — </span>

                <span className="text-slate-400">定义：{m.def}</span>

                <br />

                <span className="text-slate-500">作用：{m.role}</span>

              </li>

            ))}

          </ul>

        </section>



        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">

          1974–2023 年序指标（演示）

        </h3>

        <div className="space-y-3">

          <div>

            <p className="mb-0.5 text-[10px] font-medium text-slate-400">高温日（天/年，Tmax≥35℃）</p>

            <MetricYearSparkline data={metrics.heatDays} stroke="#fbbf24" yLabel="天" markerYear={timelineYear} />

          </div>

          <div>

            <p className="mb-0.5 text-[10px] font-medium text-slate-400">热浪事件（次/年，连续≥3 天且每日≥35℃）</p>

            <MetricYearSparkline data={metrics.heatwaveEvents} stroke="#fb923c" yLabel="次" markerYear={timelineYear} />

          </div>

          <div>

            <p className="mb-0.5 text-[10px] font-medium text-slate-400">

              极端热浪事件（次/年，连续≥5 天且每日≥38℃）

            </p>

            <MetricYearSparkline

              data={metrics.extremeHeatwaveEvents}

              stroke="#f87171"

              yLabel="次"

              markerYear={timelineYear}

            />

          </div>

          <div>

            <p className="mb-0.5 text-[10px] font-medium text-slate-400">超 40℃ 日数（天/年）</p>

            <MetricYearSparkline data={metrics.super40Days} stroke="#dc2626" yLabel="天" markerYear={timelineYear} />

          </div>

        </div>



        <section className="mt-5 border-t border-white/10 pt-4">

          <h3 className="mb-2 text-[11px] font-semibold text-slate-400">月内日最高气温（演示）</h3>

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

          <DayPointSparkline series={monthSeries} xLabel="日" yLabel="℃" stroke="#38bdf8" />

          <p className="mt-2 text-[9px] leading-relaxed text-slate-500">

            扩展思路：后续可叠加常年同期、箱线图、雷达图（多指标归一）、或与全国/省均值对比的小 multiples 等。

          </p>

        </section>

      </div>

    </aside>

  )

}





