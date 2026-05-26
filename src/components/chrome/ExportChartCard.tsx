import type { ReactNode } from 'react'

/** 侧栏图表块：带导出元数据（标题、纵轴含义、图例） */
export function ExportChartCard({
  title,
  yLabel,
  legend,
  children,
}: {
  title: string
  yLabel: string
  legend?: string
  children: ReactNode
}) {
  return (
    <div
      data-export-chart
      data-export-chart-title={title}
      data-export-y-label={yLabel}
      {...(legend ? { 'data-export-legend': legend } : {})}
    >
      <p className="mb-0.5 text-[10px] font-medium text-slate-400">{title}</p>
      {legend ? <p className="mb-1 text-[9px] text-slate-500">{legend}</p> : null}
      {children}
    </div>
  )
}

/** 导出 PNG 时双栏排列的图表组 */
export function ExportChartGrid({ children }: { children: ReactNode }) {
  return (
    <div data-export-grid className="grid grid-cols-1 gap-3">
      {children}
    </div>
  )
}
