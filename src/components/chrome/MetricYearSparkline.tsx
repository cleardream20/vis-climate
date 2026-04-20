import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { DOMAIN } from '../../lib/constants'
import type { YearMetricPoint } from '../../lib/demoCityHeatMetrics'

/** 1974–2023 年序折线；可选 `markerYear` 为时间轴当前年竖线 */
export function MetricYearSparkline({
  data,
  stroke,
  yLabel,
  markerYear,
}: {
  data: YearMetricPoint[]
  stroke: string
  yLabel: string
  /** 与地图时间轴联动：热浪/距平当前年 */
  markerYear?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 6, right: 8, bottom: 22, left: 34 }
    const w = svgRef.current.clientWidth || 280
    const h = 100
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    const x = d3.scaleLinear().domain([DOMAIN.yearMin, DOMAIN.yearMax]).range([0, innerW])
    const yMax = d3.max(data, (d) => d.value) ?? 1
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
      .line<YearMetricPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path').datum(data).attr('fill', 'none').attr('stroke', stroke).attr('stroke-width', 1.6).attr('d', line)

    const my = markerYear
    if (my != null && my >= DOMAIN.yearMin && my <= DOMAIN.yearMax) {
      g.append('line')
        .attr('x1', x(my))
        .attr('x2', x(my))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#38bdf8')
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.9)
    }

    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d3.format('d'))
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
      .attr('y', innerH + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', 9)
      .text('年份')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -24)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', 9)
      .text(yLabel)
  }, [data, stroke, yLabel, markerYear])

  return <svg ref={svgRef} className="h-[100px] w-full" role="img" />
}
