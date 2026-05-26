import { useEffect, useState } from 'react'
import { LineChart } from '../charts/LineChart'
import { loadNationalTemperatureSeries } from '../../lib/gridAnalytics'
import { getStoryMilestone } from '../../lib/storyData'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'
import { StoryCo2Chart } from './StoryCo2Chart'

function toLineData(rows: { year: number; value: number }[]) {
  return rows.map((d) => ({ x: d.year, y: d.value }))
}

export function StoryDetailDrawer() {
  const selectedStoryId = useAppStore((s) => s.selectedStoryId)
  const closeStoryDetail = useAppStore((s) => s.closeStoryDetail)
  const setActiveYear = useAppStore((s) => s.setActiveYear)
  const year = useAppStore(selectActiveYear)

  const milestone = selectedStoryId ? getStoryMilestone(selectedStoryId) : undefined

  const [tempSeries, setTempSeries] = useState<{
    meanByYear: { year: number; value: number }[]
    maxByYear: { year: number; value: number }[]
  } | null>(null)

  useEffect(() => {
    if (!milestone?.showNationalTempCharts) {
      setTempSeries(null)
      return
    }
    let cancelled = false
    void loadNationalTemperatureSeries().then((ts) => {
      if (!cancelled) setTempSeries(ts)
    })
    return () => {
      cancelled = true
    }
  }, [milestone?.id, milestone?.showNationalTempCharts])

  if (!milestone) return null

  const yk = Math.round(year)

  return (
    <aside
      className="pointer-events-auto relative z-30 flex h-full w-[min(100%,520px)] shrink-0 flex-col border-l border-amber-500/20 bg-[var(--chrome-bg)] shadow-2xl backdrop-blur-md"
      role="dialog"
      aria-label={`故事：${milestone.label}`}
    >
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-amber-200/90">{milestone.year}</p>
            <h2 className="mt-0.5 text-base font-semibold text-white">{milestone.label}</h2>
            {milestone.subtitle ? (
              <p className="mt-1 text-xs text-slate-400">{milestone.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-white/10 hover:text-white"
            onClick={() => closeStoryDetail()}
          >
            关闭
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          教学阅读模式：地图时间已同步至 {milestone.year} 年。关闭后将恢复此前打开的侧栏。
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 py-4">
        {milestone.images?.map((img) => (
          <figure
            key={img.src}
            className="overflow-hidden rounded-lg border border-white/10 bg-black/30"
          >
            <img src={img.src} alt={img.alt} className="max-h-52 w-full object-cover object-center" />
          </figure>
        ))}

        <div className="space-y-3 text-[13px] leading-relaxed text-slate-300">
          {milestone.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {milestone.co2 ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <StoryCo2Chart mode={milestone.co2} />
          </section>
        ) : null}

        {milestone.showNationalTempCharts && tempSeries ? (
          <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <h3 className="text-[11px] font-semibold text-slate-300">全国气温（与地图数据一致）</h3>
            <div>
              <p className="mb-2 text-[10px] text-slate-500">年平均气温 · ℃</p>
              <LineChart
                series={[
                  {
                    data: toLineData(tempSeries.meanByYear),
                    stroke: '#38bdf8',
                    name: '年平均',
                  },
                ]}
                xLabel="年份"
                yLabel="℃"
                markerX={milestone.year}
                yScale="tight"
              />
            </div>
            <div>
              <p className="mb-2 text-[10px] text-slate-500">年最高气温 · ℃</p>
              <LineChart
                series={[
                  {
                    data: toLineData(tempSeries.maxByYear),
                    stroke: '#fb7185',
                    name: '年最高',
                  },
                ]}
                xLabel="年份"
                yLabel="℃"
                markerX={milestone.year}
                yScale="tight"
              />
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            className="rounded-md border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/25"
            onClick={() => setActiveYear(milestone.year)}
          >
            时间轴定位 {milestone.year}
          </button>
          {yk !== milestone.year ? (
            <span className="self-center text-[10px] text-slate-500">当前浏览 {yk} 年</span>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
