import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  flyZoomForTier,
  searchPlaces,
  type Place,
} from '../../lib/places'
import { useAppStore } from '../../store/useAppStore'

function formatLatLon(p: Place): string {
  const ns = p.lat >= 0 ? 'N' : 'S'
  const ew = p.lon >= 0 ? 'E' : 'W'
  return `${Math.abs(p.lat).toFixed(2)}°${ns}，${Math.abs(p.lon).toFixed(2)}°${ew}`
}

export function MapPlaceSearch() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const requestMapFlyTo = useAppStore((s) => s.requestMapFlyTo)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 220)
    return () => window.clearTimeout(t)
  }, [query])

  const results = useMemo(() => searchPlaces(debounced, 18), [debounced])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const onPick = useCallback(
    (p: Place) => {
      requestMapFlyTo(p.lon, p.lat, flyZoomForTier(p.tier))
      setSelectedPlace(p)
      setOpen(false)
      setQuery('')
      setDebounced('')
    },
    [requestMapFlyTo, setSelectedPlace],
  )

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto w-full max-w-[min(100%,20rem)] rounded-xl border border-cyan-500/25 bg-slate-950/92 shadow-lg backdrop-blur-md"
    >
      <label className="sr-only" htmlFor="map-place-search">
        搜索地点
      </label>
      <input
        id="map-place-search"
        type="search"
        autoComplete="off"
        placeholder="搜索城市、县或省名…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-t-xl border-0 bg-transparent px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 md:px-3.5 md:py-3"
      />
      {open && debounced.length > 0 && results.length > 0 ? (
        <ul
          className="max-h-[min(50vh,18rem)] overflow-y-auto border-t border-white/10 py-1"
          role="listbox"
        >
          {results.map((p) => (
            <li key={`${p.name}-${p.province}-${p.lon}`}>
              <button
                type="button"
                role="option"
                className={clsx(
                  'flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs transition-colors',
                  'hover:bg-white/10 active:bg-white/15',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(p)}
              >
                <span className="font-medium text-white">
                  {p.name}，{p.country}
                </span>
                <span className="font-mono text-[10px] text-cyan-100/90">
                  {formatLatLon(p)}
                </span>
                <span className="text-[10px] text-slate-400">{p.province}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && debounced.length > 0 && results.length === 0 ? (
        <p className="border-t border-white/10 px-3 py-2 text-[11px] text-slate-400">无匹配地名</p>
      ) : null}
    </div>
  )
}
