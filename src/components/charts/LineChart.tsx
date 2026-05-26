import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { computeYDomain, type YScaleMode } from '../../lib/chartYDomain'
import { LINE_CHART_HEIGHT, LINE_CHART_MARGIN } from '../../lib/lineChartLayout'

export type LineChartSeries = {
  data: { x: number; y: number }[]
  stroke: string
  name?: string
}

export function LineChart({
  series,
  xLabel,
  yLabel,
  xDomain,
  markerX,
  height = LINE_CHART_HEIGHT,
  xTickFormat,
  xTicks,
  yScale = 'tight',
}: {
  series: LineChartSeries[]
  xLabel: string
  yLabel: string
  xDomain?: [number, number]
  markerX?: number
  height?: number
  xTickFormat?: (n: d3.NumberValue, index: number) => string
  xTicks?: number
  /** tight：纵轴随数据收紧，便于观察变暖趋势 */
  yScale?: YScaleMode
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const flat = series.flatMap((s) => s.data)
    if (flat.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = LINE_CHART_MARGIN
    const w = svgRef.current.clientWidth || 300
    const innerW = w - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const xMin = xDomain?.[0] ?? d3.min(flat, (d) => d.x) ?? 0
    const xMax = xDomain?.[1] ?? d3.max(flat, (d) => d.x) ?? 1
    const yMax = d3.max(flat, (d) => d.y) ?? 1
    const yMin = d3.min(flat, (d) => d.y) ?? 0

    const x = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW])
    const [yLo, yHi] = computeYDomain(yMin, yMax, yScale)
    const y = d3.scaleLinear().domain([yLo, yHi]).nice().range([innerH, 0])

    const g = svg
      .attr('viewBox', `0 0 ${w} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    for (const s of series) {
      if (s.data.length === 0) continue
      const line = d3
        .line<{ x: number; y: number }>()
        .x((d) => x(d.x))
        .y((d) => y(d.y))
        .curve(d3.curveMonotoneX)
      g.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.stroke)
        .attr('stroke-width', 1.6)
        .attr('d', line)
    }

    if (markerX != null && markerX >= xMin && markerX <= xMax) {
      g.append('line')
        .attr('x1', x(markerX))
        .attr('x2', x(markerX))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#38bdf8')
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.85)
    }

    const tickN = xTicks ?? (xMax - xMin > 40 ? 5 : 6)
    const fmt =
      xTickFormat ??
      ((d: d3.NumberValue) => String(Math.round(Number(d as number))))
    const yFmt = (d: d3.NumberValue) => {
      const n = Number(d)
      return Number.isInteger(n) ? String(n) : n.toFixed(1)
    }

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(tickN).tickFormat(fmt))
      .call((sel) => sel.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))
      .call((sel) => sel.select('.domain').attr('stroke', '#475569'))
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(yFmt))
      .call((sel) => sel.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 9))
      .call((sel) => sel.select('.domain').attr('stroke', '#475569'))

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
  }, [series, xLabel, yLabel, xDomain, markerX, height, xTickFormat, xTicks, yScale])

  return <svg ref={svgRef} className="w-full" style={{ height }} role="img" />
}
