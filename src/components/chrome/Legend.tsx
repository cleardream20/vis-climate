import {
  ANOMALY_PALETTE_COLORBLIND,
  ANOMALY_PALETTE_NORMAL,
  getTempColorStops,
} from '../../lib/colorScale'
import { useAppStore } from '../../store/useAppStore'

export function Legend() {
  const colorBlind = useAppStore((s) => s.colorBlind)
  const vizMode = useAppStore((s) => s.vizMode)
  const metricsOpen = useAppStore((s) => s.metricsOpen)
  const tempStops = getTempColorStops()

  const anomalyColors = colorBlind ? [...ANOMALY_PALETTE_COLORBLIND] : [...ANOMALY_PALETTE_NORMAL]
  const tempColors = tempStops.map((s) => `rgb(${s.rgb[0]}, ${s.rgb[1]}, ${s.rgb[2]})`)

  return (
    <div
      className={[
        'pointer-events-none absolute z-10 max-w-[260px] rounded-xl border px-3 py-2.5 text-xs text-white shadow-lg backdrop-blur-md',
        'border-white/10 bg-slate-950/70',
        metricsOpen ? 'bottom-32 right-3 md:bottom-10' : 'bottom-28 right-3 md:bottom-10',
      ].join(' ')}
      role="img"
      aria-label="图例说明"
    >
      {vizMode === 'anomaly' ? (
        <>
          <div className="mb-1.5 font-medium text-slate-300">距平 / 强度场（演示）</div>
          <div
            className="h-3 w-full rounded-sm ring-1 ring-white/10"
            style={{
              background: `linear-gradient(to right, ${anomalyColors.join(', ')})`,
            }}
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
            左→右：相对偏低 → 偏高。色标间连续渐变；无数据区透明，露出灰底。
          </p>
        </>
      ) : (
        <>
          <div className="mb-1.5 font-medium text-slate-300">代表气温场（℃）</div>
          <div
            className="h-3 w-full rounded-sm ring-1 ring-white/10"
            style={{
              background: `linear-gradient(to right, ${tempColors.join(', ')})`,
            }}
          />
          <div className="mt-1 grid grid-cols-8 gap-1 text-[10px] text-slate-400">
            {[50, 30, 20, 10, 0, -10, -20, -40].map((t) => (
              <span key={t} className="text-center tabular-nums">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            温度在色标间连续插值，不透明填充；无数据处透明。
          </p>
        </>
      )}
    </div>
  )
}
