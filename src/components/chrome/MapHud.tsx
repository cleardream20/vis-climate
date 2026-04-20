import clsx from 'clsx'
import { DOMAIN } from '../../lib/constants'
import { defaultProbeLine } from '../../lib/mapProbe'
import { formatTimelineLabel } from '../../lib/temporalTypes'
import { RASTER_STRIDE } from '../../lib/syntheticGrid'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'

type MapHudProps = {
  /** 地图悬停读数；为 null 时显示北京默认读数，保持卡片高度稳定 */
  mapHover?: string | null
}

function fmt1(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—'
  return (Math.round(x * 10) / 10).toFixed(1)
}

export function MapHud({ mapHover = null }: MapHudProps) {
  const vizMode = useAppStore((s) => s.vizMode)
  const temporalField = useAppStore((s) => s.temporalField)
  const yearAnomaly = useAppStore((s) => s.yearAnomaly)
  const yearHeatwave = useAppStore((s) => s.yearHeatwave)
  const playbackActive = useAppStore((s) => s.playbackActive)
  const flowOverlay = useAppStore((s) => s.flowOverlay)
  const active = useAppStore(selectActiveYear)
  const lastRasterHud = useAppStore((s) => s.lastRasterHud)
  const annualHottestMonthByYear = useAppStore((s) => s.annualHottestMonthByYear)

  const probeLine = mapHover ?? defaultProbeLine(active, vizMode)

  const monthFor = (y: number) => {
    if (temporalField !== 'annualMax') return undefined
    const yi = Math.round(y)
    return annualHottestMonthByYear[yi]
  }

  const timeLabel = formatTimelineLabel(active, temporalField, monthFor(active))

  const heat = lastRasterHud?.heatwaveMeanMaxC
  const anom = lastRasterHud?.anomalyMeanMaxC

  return (
    <div className="pointer-events-none flex max-w-[min(100%,26rem)] flex-col gap-2">
      <div
        className={clsx(
          'pointer-events-auto rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-md md:px-4 md:py-3',
          'border-cyan-500/25 bg-slate-950/88',
          playbackActive && 'border-amber-400/45 shadow-amber-500/15',
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-mono text-2xl font-semibold tabular-nums text-white md:text-3xl">
            {timeLabel}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-200/85">
            {vizMode === 'anomaly' ? '距平场' : '热浪等级'}
            {temporalField === 'annualMax' ? ' · 最热月' : ' · 当月'}
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-slate-400 md:text-[11px]">
          距平场记忆：
          <span className="text-sky-200/90">
            {formatTimelineLabel(yearAnomaly, temporalField, monthFor(yearAnomaly))}
          </span>
          {' · '}
          热浪档记忆：
          <span className="text-amber-200/90">
            {formatTimelineLabel(yearHeatwave, temporalField, monthFor(yearHeatwave))}
          </span>
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-center">
          {vizMode === 'heatwave' ? (
            <>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  全国均温
                </dt>
                <dd className="font-mono text-sm font-semibold text-amber-200 md:text-base">
                  {fmt1(heat?.mean)}
                  <span className="text-[10px] font-normal text-slate-400">℃</span>
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  格点最高
                </dt>
                <dd className="font-mono text-sm font-semibold text-orange-200 md:text-base">
                  {fmt1(heat?.max)}
                  <span className="text-[10px] font-normal text-slate-400">℃</span>
                </dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  全国平均距平
                </dt>
                <dd
                  className={clsx(
                    'font-mono text-sm font-semibold md:text-base',
                    anom != null && Number.isFinite(anom.mean) && anom.mean >= 0
                      ? 'text-red-300'
                      : 'text-sky-300',
                  )}
                >
                  {anom != null && Number.isFinite(anom.mean) ? (
                    <>
                      {anom.mean >= 0 ? '+' : ''}
                      {fmt1(anom.mean)}
                      <span className="text-[10px] font-normal text-slate-400">℃</span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  格点最大距平
                </dt>
                <dd
                  className={clsx(
                    'font-mono text-sm font-semibold md:text-base',
                    anom != null && Number.isFinite(anom.max) && anom.max >= 0
                      ? 'text-red-300'
                      : 'text-sky-300',
                  )}
                >
                  {anom != null && Number.isFinite(anom.max) ? (
                    <>
                      {anom.max >= 0 ? '+' : ''}
                      {fmt1(anom.max)}
                      <span className="text-[10px] font-normal text-slate-400">℃</span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </>
          )}
        </dl>
        <p className="mt-2 min-h-[2.75rem] border-t border-white/10 pt-2 font-mono text-[10px] leading-snug text-cyan-100/90 md:min-h-[2.5rem] md:text-[11px]">
          {probeLine}
        </p>
        <p className="mt-2 text-[10px] leading-snug text-slate-400 md:text-[11px]">
          上列为<strong>当前图层格点</strong>有限值聚合（海洋缺测不计入）；真实数据以导出 JSON 为准。地图{' '}
          {DOMAIN.gridCols}×{DOMAIN.gridRows}，步长 {RASTER_STRIDE}；流线：{flowOverlay ? '开' : '关'}。
        </p>
      </div>
    </div>
  )
}
