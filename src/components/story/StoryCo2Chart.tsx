import * as d3 from 'd3'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CO2_CHINA_FOSSIL,
  CO2_HISTORICAL_MAX,
  CO2_HISTORICAL_MIN,
  co2HistoricalSeries,
  type Co2Point,
} from '../../lib/storyCo2Data'
import type { StoryCo2Mode } from '../../lib/storyData'
import { LINE_CHART_MARGIN } from '../../lib/lineChartLayout'

const CHART_H = 200

function formatGt(tonnes: number): string {
  return `${(tonnes / 1e9).toFixed(1)}`
}

export function StoryCo2Chart({ mode }: { mode: StoryCo2Mode }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [playIdx, setPlayIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  /** 始终展示 1907–2024 全历史；预测模式向右延伸至 2060 */
  const histPts = useMemo(() => co2HistoricalSeries(), [])
  const projPts = useMemo(
    () => (mode.kind === 'forecast' ? CO2_CHINA_FOSSIL.filter((p) => p.projected) : []),
    [mode.kind],
  )

  const xDomainMax = mode.kind === 'forecast' ? 2060 : CO2_HISTORICAL_MAX

  const highlightFrom = mode.kind === 'range' ? mode.from : undefined
  const highlightTo = mode.kind === 'range' ? mode.to : undefined
  const markerYear =
    mode.kind === 'marker' ? mode.year : mode.kind === 'forecast' ? 2020 : undefined
  const showProjected = mode.kind === 'forecast'

  const playableYears = useMemo(() => {
    if (mode.kind !== 'range' || !mode.playable) return []
    return histPts
      .filter((p) => p.year >= mode.from && p.year <= mode.to)
      .map((p) => p.year)
  }, [mode, histPts])

  useEffect(() => {
    if (!playing || playableYears.length === 0) return
    const id = window.setInterval(() => {
      setPlayIdx((i) => {
        if (i >= playableYears.length - 1) {
          setPlaying(false)
          return 0
        }
        return i + 1
      })
    }, 280)
    return () => clearInterval(id)
  }, [playing, playableYears.length])

  useEffect(() => {
    setPlayIdx(0)
    setPlaying(false)
  }, [mode])

  const activeHighlightTo =
    mode.kind === 'range' && mode.playable && playing
      ? playableYears[playIdx] ?? highlightTo
      : highlightTo

  const draw = useCallback(() => {
    if (!svgRef.current || histPts.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = LINE_CHART_MARGIN
    const w = svgRef.current.clientWidth || 360
    const innerW = w - margin.left - margin.right
    const innerH = CHART_H - margin.top - margin.bottom

    const allY = [...histPts, ...projPts].map((p) => p.tonnes)
    const yMax = d3.max(allY) ?? 1
    const yMin = d3.min(allY) ?? 0

    const x = d3
      .scaleLinear()
      .domain([CO2_HISTORICAL_MIN, xDomainMax])
      .range([0, innerW])
    const y = d3
      .scaleLinear()
      .domain([yMin * 0.92, yMax * 1.04])
      .nice()
      .range([innerH, 0])

    const g = svg
      .attr('viewBox', `0 0 ${w} ${CHART_H}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const line = d3
      .line<Co2Point>()
      .x((d) => x(d.year))
      .y((d) => y(d.tonnes))

    if (highlightFrom != null && highlightTo != null) {
      g.append('rect')
        .attr('x', x(highlightFrom))
        .attr('y', 0)
        .attr('width', Math.max(0, x(activeHighlightTo ?? highlightTo) - x(highlightFrom)))
        .attr('height', innerH)
        .attr('fill', 'rgba(248,113,113,0.12)')
    }

    g.append('path')
      .datum(histPts)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(148,163,184,0.85)')
      .attr('stroke-width', 1.5)
      .attr('d', line)

    if (projPts.length > 0) {
      const bridge = [histPts[histPts.length - 1], projPts[0]]
      g.append('path')
        .datum(bridge)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(148,163,184,0.45)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 3')
        .attr('d', line)

      g.append('path')
        .datum(projPts)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(52,211,153,0.75)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 4')
        .attr('d', line)
    }

    const highlightYears = new Set(
      histPts
        .filter((p) => {
          if (highlightFrom == null || activeHighlightTo == null) return false
          return p.year >= highlightFrom && p.year <= activeHighlightTo
        })
        .map((p) => p.year),
    )

    const markerHighlight = markerYear != null ? new Set([markerYear]) : highlightYears

    g.selectAll('circle.hist')
      .data(histPts.filter((p) => p.year % 10 === 0 || markerHighlight.has(p.year)))
      .join('circle')
      .attr('class', 'hist')
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => y(d.tonnes))
      .attr('r', (d) => (markerHighlight.has(d.year) ? 3.5 : 2))
      .attr('fill', (d) =>
        markerHighlight.has(d.year) && highlightFrom != null
          ? '#f87171'
          : markerHighlight.has(d.year) && markerYear != null
            ? '#fbbf24'
            : 'rgba(148,163,184,0.75)',
      )

    if (projPts.length) {
      g.selectAll('circle.proj')
        .data(projPts.filter((_, i) => i % 5 === 0 || i === projPts.length - 1))
        .join('circle')
        .attr('class', 'proj')
        .attr('cx', (d) => x(d.year))
        .attr('cy', (d) => y(d.tonnes))
        .attr('r', 2.5)
        .attr('fill', 'rgba(52,211,153,0.85)')
    }

    if (markerYear != null && highlightFrom == null) {
      const mp = histPts.find((p) => p.year === markerYear)
      if (mp) {
        g.append('line')
          .attr('x1', x(markerYear))
          .attr('x2', x(markerYear))
          .attr('y1', 0)
          .attr('y2', innerH)
          .attr('stroke', 'rgba(251,191,36,0.75)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 3')
      }
    }

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(mode.kind === 'forecast' ? 7 : 6)
          .tickFormat((v) => String(Math.round(Number(v)))),
      )
      .selectAll('text')
      .attr('fill', 'rgba(148,163,184,0.9)')
      .attr('font-size', '10px')

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((v) => `${formatGt(Number(v))}`),
      )
      .selectAll('text')
      .attr('fill', 'rgba(148,163,184,0.9)')
      .attr('font-size', '10px')

    g.append('text')
      .attr('x', innerW)
      .attr('y', -4)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(148,163,184,0.75)')
      .attr('font-size', '10px')
      .text('十亿吨 CO₂（化石燃料）')

    g.append('text')
      .attr('x', 0)
      .attr('y', -4)
      .attr('fill', 'rgba(148,163,184,0.6)')
      .attr('font-size', '9px')
      .text(`${CO2_HISTORICAL_MIN}–${CO2_HISTORICAL_MAX}`)
  }, [
    histPts,
    projPts,
    highlightFrom,
    highlightTo,
    activeHighlightTo,
    markerYear,
    xDomainMax,
    mode.kind,
  ])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(() => draw())
    if (svgRef.current) ro.observe(svgRef.current)
    return () => ro.disconnect()
  }, [draw])

  const caption =
    mode.kind === 'forecast'
      ? `横轴展示 ${CO2_HISTORICAL_MIN}–${CO2_HISTORICAL_MAX} 全历史，右侧绿色虚线为 2030/2060 课堂示意预测。`
      : mode.kind === 'range'
        ? `全图 ${CO2_HISTORICAL_MIN}–${CO2_HISTORICAL_MAX}；红色高亮 ${mode.from}–${mode.to} 年区间，可播放该区间的逐年变化。`
        : `全图 ${CO2_HISTORICAL_MIN}–${CO2_HISTORICAL_MAX}；竖线标出 ${mode.year} 年，便于对照当年气候事件。`

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-300">
          中国化石燃料 CO₂ 排放（{CO2_HISTORICAL_MIN}–{CO2_HISTORICAL_MAX}）
        </p>
        {mode.kind === 'range' && mode.playable ? (
          <button
            type="button"
            className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-100 hover:bg-amber-500/25"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? '暂停' : '播放区间'}
          </button>
        ) : null}
      </div>
      <svg ref={svgRef} className="h-[200px] w-full" role="img" aria-label="二氧化碳排放折线图" />
      <p className="text-[10px] leading-relaxed text-slate-500">{caption}</p>
      {showProjected ? (
        <p className="text-[10px] text-emerald-400/80">
          示意：约 2030 年达峰、2060 年中和（教学用模拟曲线）
        </p>
      ) : null}
    </div>
  )
}
