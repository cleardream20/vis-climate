import clsx from 'clsx'
import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { DOMAIN } from '../../lib/constants'
import {
  formatTimelineLabel,
  timelineToYearMonth,
  yearMonthToTimeline,
  YEAR_AXIS_MAX,
} from '../../lib/temporalTypes'
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
  const playbackActive = useAppStore((s) => s.playbackActive)
  const playFrom = useAppStore((s) => s.playFrom)
  const playTo = useAppStore((s) => s.playTo)
  const setPlayFrom = useAppStore((s) => s.setPlayFrom)
  const setPlayTo = useAppStore((s) => s.setPlayTo)
  const playIntervalMs = useAppStore((s) => s.playIntervalMs)
  const setPlayIntervalMs = useAppStore((s) => s.setPlayIntervalMs)
  const annualHottestMonthByYear = useAppStore((s) => s.annualHottestMonthByYear)

  const parsed = timelineToYearMonth(year)
  const [jumpYear, setJumpYear] = useState(parsed.year)
  const [jumpMonth, setJumpMonth] = useState(parsed.month)

  useEffect(() => {
    const p = timelineToYearMonth(year)
    setJumpYear(p.year)
    setJumpMonth(p.month)
  }, [year])

  const monthFor = (y: number) =>
    temporalField === 'annualMax' ? annualHottestMonthByYear[Math.round(y)] : undefined

  const playYearStep = temporalField === 'annualMax' ? 1 : 1 / 12
  const sliderMax = temporalField === 'annualMax' ? DOMAIN.yearMax : YEAR_AXIS_MAX
  const sliderStep = temporalField === 'annualMax' ? 1 : 1 / 12
  const applyYearMonthJump = useCallback(() => {
    useAppStore.getState().setPlaybackActive(false)
    setActiveYear(yearMonthToTimeline(jumpYear, jumpMonth))
  }, [jumpYear, jumpMonth, setActiveYear])

  useEffect(() => {
    if (!playbackActive) return
    const id = window.setInterval(() => {
      const s = useAppStore.getState()
      const cur = selectActiveYear(s)
      const to =
        s.temporalField === 'annualMax'
          ? s.playTo
          : yearMonthToTimeline(s.playTo, 12)
      const step = s.temporalField === 'annualMax' ? 1 : 1 / 12
      if (cur >= to - 1e-9) {
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
    const from =
      s.temporalField === 'annualMax'
        ? s.playFrom
        : yearMonthToTimeline(s.playFrom, 1)
    const to =
      s.temporalField === 'annualMax'
        ? s.playTo
        : yearMonthToTimeline(s.playTo, 12)
    const atEnd =
      s.temporalField === 'annualMax'
        ? Math.round(cur) >= s.playTo
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
        <span className="shrink-0 font-medium">播放区间</span>
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

        {temporalField === 'intrayear' ? (
          <>
            <span className="mx-0.5 text-slate-600">|</span>
            <span className="shrink-0 text-slate-500">定位</span>
            <label className="flex items-center gap-1">
              <input
                type="number"
                className="w-[4.5rem] rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-100 tabular-nums"
                min={DOMAIN.yearMin}
                max={DOMAIN.yearMax}
                value={jumpYear}
                disabled={playbackActive}
                onChange={(e) =>
                  setJumpYear(clampYear(Number(e.target.value) || DOMAIN.yearMin))
                }
              />
              <span className="text-slate-500">年</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="number"
                className="w-[3.25rem] rounded-md border border-white/10 bg-black/40 px-2 py-1 text-slate-100 tabular-nums"
                min={1}
                max={12}
                value={jumpMonth}
                disabled={playbackActive}
                onChange={(e) =>
                  setJumpMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))
                }
              />
              <span className="text-slate-500">月</span>
            </label>
            <button
              type="button"
              disabled={playbackActive}
              onClick={applyYearMonthJump}
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10 disabled:opacity-50"
            >
              跳转
            </button>
          </>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">
          当前图层
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
                  {p.label}（{p.ms}ms/步）
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
        快捷键：← → 调整时间；空格 播放/暂停。年内模式可用「定位」跳转到指定年月。
      </p>
    </div>
  )
}
