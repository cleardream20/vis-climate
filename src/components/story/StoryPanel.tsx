import clsx from 'clsx'
import { DOMAIN } from '../../lib/constants'
import { useAppStore } from '../../store/useAppStore'

/** 三阶段叙事：时间段主题 + 无年份背景条 + 可跳转年份节点 */
const storyEras: {
  range: string
  theme: string
  contextLines: string[]
  milestones: { year: number; label: string }[]
}[] = [
  {
    range: '1974–1990',
    theme: '缓慢起步 · 二氧化碳积累',
    contextLines: ['北方沙尘暴高发期', '80 年代冷事件频发'],
    milestones: [{ year: 1978, label: '改革开放启动' }],
  },
  {
    range: '1991–2010',
    theme: '加速变暖 · 化石能源消耗激增',
    contextLines: [],
    milestones: [
      { year: 1992, label: '市场经济体制确立' },
      { year: 2001, label: '加入 WTO，工业化猛冲' },
      { year: 1998, label: '长江特大洪水' },
    ],
  },
  {
    range: '2011–2023',
    theme: '高烧新常态 · 气候系统惯性',
    contextLines: [],
    milestones: [
      { year: 2022, label: '极端高温破纪录' },
      { year: 2023, label: '有记录最热一年' },
      { year: 2020, label: '碳达峰、碳中和承诺' },
    ],
  },
]

/**
 * 置于地图左上叠放列（HUD → 搜索 → 本面板），不遮挡搜索框。
 * 父列为 `flex` + `min-h-0` 且锚定 `top/bottom`，本面板 `flex-1 min-h-0` 内滚动。
 */
export function StoryPanel() {
  const storyOpen = useAppStore((s) => s.storyOpen)
  const setStoryOpen = useAppStore((s) => s.setStoryOpen)
  const setActiveYear = useAppStore((s) => s.setActiveYear)

  if (!storyOpen) return null

  return (
    <div
      className={clsx(
        'pointer-events-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-white/10',
        'bg-black/60 shadow-2xl backdrop-blur-md',
      )}
      role="dialog"
      aria-label="数据故事线"
    >
      <div className="shrink-0 border-b border-white/10 px-3 py-2.5 md:px-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">故事线</h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-white/10 hover:text-white"
            onClick={() => setStoryOpen(false)}
          >
            关闭
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          以下为叙事与历史节点规划稿；点击带年份的条目可将时间轴跳到该年（{DOMAIN.yearMin}–{DOMAIN.yearMax}）。
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2 pb-3 md:px-4">
        <div className="space-y-3 text-xs leading-relaxed text-[var(--muted)]">
          {storyEras.map((era) => (
            <section key={era.range} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <h3 className="text-[11px] font-semibold tracking-wide text-amber-100/95">{era.range}</h3>
              <p className="mt-1 text-[11px] text-slate-300">{era.theme}</p>
              {era.contextLines.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-slate-400">
                  {era.contextLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {era.milestones.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {era.milestones.map((m) => (
                    <li key={`${era.range}-${m.year}`}>
                      <button
                        type="button"
                        className={clsx(
                          'w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left transition',
                          'hover:border-amber-500/30 hover:bg-amber-500/10',
                        )}
                        onClick={() => setActiveYear(m.year)}
                      >
                        <span className="font-mono text-[11px] text-amber-200/95">{m.year}</span>
                        <span className="ml-2 text-[11px] text-slate-200">{m.label}</span>
                        <div className="mt-1 text-[10px] text-slate-500">跳转至该年</div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
