import { DOMAIN } from '../../lib/constants'
import type { YearMetricPoint } from '../../lib/demoCityHeatMetrics'
import { LineChart } from '../charts/LineChart'

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
  markerYear?: number
}) {
  const series = [
    {
      data: data.map((d) => ({ x: d.year, y: d.value })),
      stroke,
    },
  ]
  return (
    <LineChart
      series={series}
      xLabel="年份"
      yLabel={yLabel}
      xDomain={[DOMAIN.yearMin, DOMAIN.yearMax]}
      markerX={markerYear}
      xTickFormat={(d) => String(Math.round(Number(d)))}
      xTicks={5}
      yScale="tight"
    />
  )
}
