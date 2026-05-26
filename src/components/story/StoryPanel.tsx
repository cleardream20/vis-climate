import clsx from 'clsx'
import { STORY_ERAS, getStoryMilestone } from '../../lib/storyData'
import { useAppStore } from '../../store/useAppStore'

/**
 * 置于地图左上叠放列（HUD → 搜索 → 本面板），不遮挡搜索框。
 * 大卡片：设置播放区间；小卡片：跳转年份并打开右侧故事详情侧栏。
 */
export function StoryPanel() {
  const storyOpen = useAppStore((s) => s.storyOpen)
  const setStoryOpen = useAppStore((s) => s.setStoryOpen)
  const setPlayRange = useAppStore((s) => s.setPlayRange)
  const openStoryDetail = useAppStore((s) => s.openStoryDetail)
  const playFrom = useAppStore((s) => s.playFrom)
  const playTo = useAppStore((s) => s.playTo)

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
          点击时段大卡片：设置播放区间。点击里程碑小卡片：同时选中该时段、设置播放区间、跳转年份并打开教学详情。
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2 pb-3 md:px-4">
        <div className="space-y-3 text-xs leading-relaxed text-[var(--muted)]">
          {STORY_ERAS.map((era) => {
            const eraActive = playFrom === era.playFrom && playTo === era.playTo
            const milestones = era.milestoneIds
              .map((id) => getStoryMilestone(id))
              .filter((m): m is NonNullable<typeof m> => m != null)
              .sort((a, b) => a.year - b.year)

            return (
              <section key={era.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-0">
                <button
                  type="button"
                  className={clsx(
                    'w-full rounded-lg px-3 py-2.5 text-left transition',
                    eraActive
                      ? 'bg-amber-500/15 ring-1 ring-amber-500/35'
                      : 'hover:bg-white/[0.06]',
                  )}
                  onClick={() => setPlayRange(era.playFrom, era.playTo)}
                >
                  <h3 className="text-[11px] font-semibold tracking-wide text-amber-100/95">
                    {era.range}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-300">{era.theme}</p>
                  {era.contextLines.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-slate-400">
                      {era.contextLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 text-[10px] text-slate-500">
                    {eraActive ? '当前播放区间' : '点击设置播放区间'}
                  </p>
                </button>

                {milestones.length > 0 ? (
                  <ul className="space-y-2 border-t border-white/10 px-3 py-2">
                    {milestones.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className={clsx(
                            'w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left transition',
                            'hover:border-amber-500/30 hover:bg-amber-500/10',
                          )}
                          onClick={() => openStoryDetail(m.id)}
                        >
                          <span className="font-mono text-[11px] text-amber-200/95">{m.year}</span>
                          <span className="ml-2 text-[11px] text-slate-200">{m.label}</span>
                          <div className="mt-1 text-[10px] text-slate-500">
                            同步时段播放区间 · 跳转并阅读详情
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
