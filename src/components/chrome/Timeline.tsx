import clsx from 'clsx'
import { useCallback, useEffect, type KeyboardEvent } from 'react'
import { DOMAIN } from '../../lib/constants'
import { formatTimelineLabel, YEAR_AXIS_MAX } from '../../lib/temporalTypes'
import {
  clampYear,
  selectActiveYear,
  useAppStore,
} from '../../store/useAppStore'

const SPEED_PRESETS = [
  { label: '慢', ms: 480 },
  { label: '中', ms: 320 },
  { label: '快', ms: 200 },
] as const

export function Timeline() {
  const vizMode = useAppStore((s) => s.vizMode)
  const temporalField = useAppStore((s) => s.temporalField)
  const year = useAppStore(selectActiveYear)
  const setActiveYear = useAppStore((s) => s.setActiveYear)
  const userMode = useAppStore((s) => s.userMode)
  const playbackActive = useAppStore((s) => s.playbackActive)
  const playFrom = useAppStore((s) => s.playFrom)
  const playTo = useAppStore((s) => s.playTo)
  const setPlayFrom = useAppStore((s) => s.setPlayFrom)
  const setPlayTo = useAppStore((s) => s.setPlayTo)
  const playIntervalMs = useAppStore((s) => s.playIntervalMs)
  const setPlayIntervalMs = useAppStore((s) => s.setPlayIntervalMs)
  const annualHottestMonthByYear = useAppStore((s) => s.annualHottestMonthByYear)

  const monthFor = (y: number) =>
    temporalField === 'annualMax' ? annualHottestMonthByYear[Math.round(y)] : undefined

  const playYearStep = temporalField === 'annualMax' ? 1 : 1 / 12
  const sliderMax = temporalField === 'annualMax' ? DOMAIN.yearMax : YEAR_AXIS_MAX
  const sliderStep = temporalField === 'annualMax' ? 1 : 1 / 12

  useEffect(() => {
    if (!playbackActive) return
    const id = window.setInterval(() => {
      const s = useAppStore.getState()
      const cur = selectActiveYear(s)
      const to = s.playTo
      const step = s.temporalField === 'annualMax' ? 1 : 1 / 12
      if (cur >= to) {
        s.setActiveYear(to)
        s.setPlaybackActive(false)
        return
      }
      s.setActiveYear(Math.min(to, cur + step))
    }, playIntervalMs)
    return () => window.clearInterval(id)
  }, [playbackActive, playIntervalMs])

  const startPlayback = useCallback(() => {
    const s = useAppStore.getState()
    const cur = selectActiveYear(s)
    const from = s.playFrom
    const to = s.playTo
    /** 已播到区间末端时再点播放：从头；暂停中途再播：从当前年月继续 */
    const atEnd =
      s.temporalField === 'annualMax'
        ? Math.round(cur) >= to
        : cur >= to - 1e-9
    if (atEnd) {
      s.setActiveYear(from)
    }
    s.setPlaybackActive(true)
  }, [])

  const togglePlayback = useCallback(() => {
    const s = useAppStore.getState()
    if (s.playbackActive) {
      s.setPlaybackActive(false)
      return
    }
    startPlayback()
  }, [startPlayback])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActiveYear(year - playYearStep)
      if (e.key === 'ArrowRight') setActiveYear(year + playYearStep)
      if (e.key === ' ') {
        e.preventDefault()
        togglePlayback()
      }
    },
    [year, playYearStep, setActiveYear, togglePlayback],
  )

  return (
    <div
      className="pointer-events-auto border-t border-cyan-500/15 bg-gradient-to-t from-slate-950/95 to-slate-900/90 px-4 py-3 backdrop-blur-md"
      onKeyDown={onKey}
      tabIndex={0}
      role="group"
      aria-label="年份时间轴"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="shrink-0 font-medium">演示区间</span>
        <label className="flex items-center gap-1">
          <span className="text-slate-500">从</span>
          <input
            type="number"
            className="w-[4.5rem] rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-100 tabular-nums"
            min={DOMAIN.yearMin}
            max={DOMAIN.yearMax}
            value={playFrom}
            disabled={playbackActive}
            onChange={(e) => setPlayFrom(clampYear(Number(e.target.value) || DOMAIN.yearMin))}
          />
        </label>
        <span className="text-slate-500">到</span>
        <label className="flex items-center gap-1">
          <input
            type="number"
            className="w-[4.5rem] rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-100 tabular-nums"
            min={DOMAIN.yearMin}
            max={DOMAIN.yearMax}
            value={playTo}
            disabled={playbackActive}
            onChange={(e) => setPlayTo(clampYear(Number(e.target.value) || DOMAIN.yearMax))}
          />
        </label>
        <span className="text-slate-500">年</span>
        <span className="hidden shrink-0 text-slate-500 sm:inline">
          （播放到结束年自动暂停；仅影响当前「{vizMode === 'anomaly' ? '距平场' : '热浪档'}」年份）
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">
          当前图层年份
          <span className="ml-1 text-slate-500">
            （{vizMode === 'anomaly' ? '距平' : '热浪'}）
          </span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            速度
            <select
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-100"
              value={playIntervalMs}
              disabled={playbackActive}
              onChange={(e) => setPlayIntervalMs(Number(e.target.value))}
            >
              {SPEED_PRESETS.map((p) => (
                <option key={p.label} value={p.ms}>
                  {p.label}（{p.ms}ms/年）
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={togglePlayback}
            className={clsx(
              'rounded-lg px-3 py-1 text-xs font-semibold transition ring-1',
              playbackActive
                ? 'bg-amber-500/20 text-amber-100 ring-amber-400/40'
                : 'bg-cyan-500/15 text-cyan-100 ring-cyan-400/30 hover:bg-cyan-500/25',
            )}
          >
            {playbackActive ? '暂停' : '播放'}
          </button>
          <span className="tabular-nums text-sm font-semibold text-white md:text-base">
            {formatTimelineLabel(year, temporalField, monthFor(year))}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={DOMAIN.yearMin}
        max={sliderMax}
        step={sliderStep}
        value={year}
        onChange={(e) => {
          useAppStore.getState().setPlaybackActive(false)
          setActiveYear(Number(e.target.value))
        }}
        className="w-full accent-cyan-500"
        aria-valuemin={DOMAIN.yearMin}
        aria-valuemax={sliderMax}
        aria-valuenow={year}
      />
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
        {userMode !== 'basic'
          ? '快捷键：← → 调当前模式年份；空格 播放/暂停；暂停后续播从当前位置继续，播到末尾再播从「从」年重来。'
          : '点「播放」从当前年月继续播到结束年；已播到末尾再点播放则从「从」年重来。拖滑块会暂停。'}
      </p>
    </div>
  )
}
