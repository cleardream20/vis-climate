import clsx from 'clsx'
import type { UserMode, VizMode } from '../../lib/constants'
import { DOMAIN } from '../../lib/constants'
import type { TemporalField } from '../../lib/temporalTypes'
import { type MapViewMode, useAppStore } from '../../store/useAppStore'

const temporalModes: { id: TemporalField; label: string; hint: string }[] = [
  { id: 'intrayear', label: '年内', hint: '按月在年内过渡（12 档/年），热浪档可跨年插值' },
  {
    id: 'annualMax',
    label: '年最高',
    hint: '每年一帧：最热月（全国格点平均温最高的日历月）月均温场；见 t2m_annual_max_*.json（缺则回退代表日 t2m）',
  },
]

const modes: { id: UserMode; label: string; hint: string }[] = [
  { id: 'basic', label: '基础', hint: '面向公众：大控件、预设叙事' },
  { id: 'classroom', label: '课堂', hint: '教学：简洁全屏、快捷键' },
  { id: 'pro', label: '专业', hint: '科研 / 政策：全量指标与导出' },
]

const vizModes: { id: VizMode; label: string; hint: string }[] = [
  { id: 'heatwave', label: '热浪档', hint: '四档离散色带，贴合需求文档 F01' },
  { id: 'anomaly', label: '距平场', hint: '蓝→紫→红连续场，适合时间播放观感（演示）' },
]

const viewModes: { id: MapViewMode; label: string; hint: string }[] = [
  { id: 'china', label: '中国周边', hint: '聚焦中国及周边，包含最东端与南海视野' },
  { id: 'global', label: '全球', hint: '全球视角，便于做全局对照' },
]

export function TopBar() {
  const userMode = useAppStore((s) => s.userMode)
  const setUserMode = useAppStore((s) => s.setUserMode)
  const colorBlind = useAppStore((s) => s.colorBlind)
  const setColorBlind = useAppStore((s) => s.setColorBlind)
  const vizMode = useAppStore((s) => s.vizMode)
  const setVizMode = useAppStore((s) => s.setVizMode)
  const flowOverlay = useAppStore((s) => s.flowOverlay)
  const setFlowOverlay = useAppStore((s) => s.setFlowOverlay)
  const mapViewMode = useAppStore((s) => s.mapViewMode)
  const setMapViewMode = useAppStore((s) => s.setMapViewMode)
  const metricsOpen = useAppStore((s) => s.metricsOpen)
  const setMetricsOpen = useAppStore((s) => s.setMetricsOpen)
  const storyOpen = useAppStore((s) => s.storyOpen)
  const setStoryOpen = useAppStore((s) => s.setStoryOpen)
  const temporalField = useAppStore((s) => s.temporalField)
  const setTemporalField = useAppStore((s) => s.setTemporalField)
  const showCountryBoundary = useAppStore((s) => s.showCountryBoundary)
  const setShowCountryBoundary = useAppStore((s) => s.setShowCountryBoundary)
  const showProvinceBoundary = useAppStore((s) => s.showProvinceBoundary)
  const setShowProvinceBoundary = useAppStore((s) => s.setShowProvinceBoundary)

  return (
    <header
      className={clsx(
        'pointer-events-auto flex flex-wrap items-center gap-3 border-b px-4 py-2.5 shadow-xl backdrop-blur-md',
        'border-cyan-500/15 bg-gradient-to-b from-slate-900/95 to-slate-950/95',
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="truncate bg-gradient-to-r from-white to-slate-300 bg-clip-text text-base font-semibold tracking-tight text-transparent md:text-lg">
          中国热浪五十年演变
        </h1>
        <p className="truncate text-xs text-slate-400">
          {DOMAIN.yearMin}–{DOMAIN.yearMax} · 9km 网格 · 灰阶底图 + 国界省界 + 城市标注 + 场填充（演示）
        </p>
      </div>

      <nav
        className="flex flex-wrap items-center gap-1 rounded-lg bg-black/25 p-0.5 ring-1 ring-white/10"
        aria-label="气温时间序列"
      >
        {temporalModes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setTemporalField(m.id)}
            className={clsx(
              'rounded-md px-2 py-1 text-[10px] font-medium transition md:px-2.5 md:text-[11px]',
              temporalField === m.id
                ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <nav
        className="flex flex-wrap items-center gap-1 rounded-lg bg-black/25 p-0.5 ring-1 ring-white/10"
        aria-label="场可视化模式"
      >
        {vizModes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setVizMode(m.id)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition md:px-3 md:text-xs',
              vizMode === m.id
                ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <nav
        className="flex flex-wrap items-center gap-1 rounded-lg bg-black/25 p-0.5 ring-1 ring-white/10"
        aria-label="地图视角模式"
      >
        {viewModes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setMapViewMode(m.id)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition md:px-3 md:text-xs',
              mapViewMode === m.id
                ? 'bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-400/35'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <nav
        className="flex flex-wrap items-center gap-1.5"
        aria-label="用户分层模式"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => setUserMode(m.id)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              userMode === m.id
                ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2 border-l border-white/10 pl-3">
        <button
          type="button"
          onClick={() => setStoryOpen(!storyOpen)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition',
            storyOpen
              ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30'
              : 'text-slate-400 hover:bg-white/5',
          )}
        >
          故事线
        </button>
        <button
          type="button"
          onClick={() => setMetricsOpen(!metricsOpen)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition',
            metricsOpen
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5',
          )}
        >
          指标
        </button>
        <button
          type="button"
          onClick={() => setFlowOverlay(!flowOverlay)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition',
            flowOverlay
              ? 'bg-cyan-500/18 text-cyan-100 ring-1 ring-cyan-400/30'
              : 'text-slate-400 hover:bg-white/5',
          )}
        >
          流线
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            className="accent-cyan-500"
            checked={colorBlind}
            onChange={(e) => setColorBlind(e.target.checked)}
          />
          色盲友好
        </label>
        <label
          className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-400"
          title="Natural Earth 国界"
        >
          <input
            type="checkbox"
            className="accent-cyan-500"
            checked={showCountryBoundary}
            onChange={(e) => setShowCountryBoundary(e.target.checked)}
          />
          国境
        </label>
        <label
          className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-400"
          title="中国省界；放大约 zoom≥5.2 起渐显，可用 store 或 VITE_MAP_SHOW_PROVINCE 初值"
        >
          <input
            type="checkbox"
            className="accent-cyan-500"
            checked={showProvinceBoundary}
            onChange={(e) => setShowProvinceBoundary(e.target.checked)}
          />
          省界
        </label>
      </div>
    </header>
  )
}
