import maplibregl, { setWorkerUrl } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type { VizMode } from '../../lib/constants'
import { CHINA_NAV_BOUNDS } from '../../lib/constants'
import {
  ensureAdminBoundaryLayers,
  stackHeatRasterBelowBoundaries,
  syncBoundaryLayerVisibility,
} from '../../lib/mapBoundaries'
import { buildHeatRasterImageData } from '../../lib/heatRasterBuilder'
import { placesVisibleAtZoom } from '../../lib/places'
import { createPlaceMarkerEl, markerZoomScale } from '../../lib/placeMarkers'
import { defaultProbeLine, probeLineAt } from '../../lib/mapProbe'
import { applyMapViewMode } from '../../lib/mapViewConfig'
import { FIELD_VISUAL } from '../../lib/fieldVisualConfig'
import {
  extractImageDataRowSlice,
  heatRasterStripCount,
  heatStripLayerId,
  heatStripSourceId,
  stripImageRowRanges,
  stripLngLatCorners,
} from '../../lib/heatRasterStrips'
import { basemapRasterStyle } from '../../lib/mapStyle'
import { imageDataToDataUrl } from '../../lib/syntheticGrid'
import type { TemporalField } from '../../lib/temporalTypes'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'
import { MapHud } from '../chrome/MapHud'
import { StoryPanel } from '../story/StoryPanel'
import { FlowOverlay } from './FlowOverlay'
import { MapPlaceSearch } from './MapPlaceSearch'

import maplibreglWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker?url'

setWorkerUrl(maplibreglWorker)

const LEGACY_HEAT_SOURCE = 'heatwave-raster'
const LEGACY_HEAT_LAYER = 'heatwave-raster-layer'

/** 避免异步换图时旧请求覆盖新年份 */
let rasterRequestSeq = 0

function removeLegacyHeatRaster(map: maplibregl.Map) {
  if (map.getLayer(LEGACY_HEAT_LAYER)) map.removeLayer(LEGACY_HEAT_LAYER)
  if (map.getSource(LEGACY_HEAT_SOURCE)) map.removeSource(LEGACY_HEAT_SOURCE)
}

function removeHeatStripsFromIndex(map: maplibregl.Map, fromIndex: number) {
  for (let i = fromIndex; i < 16; i++) {
    const lid = heatStripLayerId(i)
    const sid = heatStripSourceId(i)
    if (map.getLayer(lid)) map.removeLayer(lid)
    if (map.getSource(sid)) map.removeSource(sid)
  }
}

/** 整层不透明度等见 `src/lib/fieldVisualConfig.ts`（FIELD_VISUAL） */
function heatLayerPaint() {
  return {
    'raster-opacity': FIELD_VISUAL.heatLayerOpacity,
    'raster-fade-duration': FIELD_VISUAL.heatRasterFadeMs,
    'raster-saturation': FIELD_VISUAL.heatRasterSaturation,
    'raster-contrast': FIELD_VISUAL.heatRasterContrast,
  } as const
}

function heatRasterLatShift(): number {
  const raw = import.meta.env.VITE_HEAT_RASTER_LAT_SHIFT
  if (raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw)
  }
  return FIELD_VISUAL.heatRasterLatShiftDeg
}

async function applyRasterToMap(
  map: maplibregl.Map,
  year: number,
  colorBlind: boolean,
  vizMode: VizMode,
  temporalField: TemporalField,
) {
  if (!map.isStyleLoaded()) return
  const seq = ++rasterRequestSeq
  const built = await buildHeatRasterImageData(year, colorBlind, vizMode, temporalField)
  if (seq !== rasterRequestSeq) return
  useAppStore.getState().setLastRasterHud(built, year)
  const img = built.imageData

  removeLegacyHeatRaster(map)
  const nStrips = heatRasterStripCount()
  removeHeatStripsFromIndex(map, nStrips)

  const sh = heatRasterLatShift()
  const ranges = stripImageRowRanges(img.height, nStrips)
  const p = heatLayerPaint()

  for (let i = 0; i < nStrips; i++) {
    const { row0, row1 } = ranges[i]!
    const sub = extractImageDataRowSlice(img, row0, row1)
    const url = imageDataToDataUrl(sub)
    const coords = stripLngLatCorners(row0, row1, img.height, sh)
    const sid = heatStripSourceId(i)
    const lid = heatStripLayerId(i)

    const existing = map.getSource(sid) as maplibregl.ImageSource | undefined
    if (existing && typeof existing.updateImage === 'function') {
      existing.updateImage({ url, coordinates: coords })
    } else {
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(sid)) map.removeSource(sid)
      map.addSource(sid, {
        type: 'image',
        url,
        coordinates: coords,
      })
      map.addLayer({
        id: lid,
        type: 'raster',
        source: sid,
        paint: { ...p },
      })
    }

    map.setPaintProperty(lid, 'raster-opacity', p['raster-opacity'])
    map.setPaintProperty(lid, 'raster-fade-duration', p['raster-fade-duration'])
    map.setPaintProperty(lid, 'raster-saturation', p['raster-saturation'])
    map.setPaintProperty(lid, 'raster-contrast', p['raster-contrast'])
    stackHeatRasterBelowBoundaries(map, lid)
  }
}

export function HeatmapMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker[]>([])
  const hoverLineRef = useRef('')
  const lastHoverLngLatRef = useRef<{ lng: number; lat: number } | null>(null)
  const [mapHover, setMapHover] = useState<string | null>(null)
  const year = useAppStore(selectActiveYear)
  const colorBlind = useAppStore((s) => s.colorBlind)
  const vizMode = useAppStore((s) => s.vizMode)
  const mapViewMode = useAppStore((s) => s.mapViewMode)
  const temporalField = useAppStore((s) => s.temporalField)
  const mapFlyRequest = useAppStore((s) => s.mapFlyRequest)
  const clearMapFlyRequest = useAppStore((s) => s.clearMapFlyRequest)
  const showCountryBoundary = useAppStore((s) => s.showCountryBoundary)
  const showProvinceBoundary = useAppStore((s) => s.showProvinceBoundary)
  const storyOpen = useAppStore((s) => s.storyOpen)

  useEffect(() => {
    const map = mapRef.current
    const req = mapFlyRequest
    if (!map?.loaded() || !req) return
    map.flyTo({
      center: [req.lon, req.lat],
      zoom: req.zoom,
      duration: 1300,
      essential: true,
    })
    clearMapFlyRequest()
  }, [mapFlyRequest, clearMapFlyRequest])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.loaded()) return
    const st = useAppStore.getState()
    const y = selectActiveYear(st)
    const { vizMode: vm } = st
    const p = lastHoverLngLatRef.current
    const line = p
      ? probeLineAt(p.lng, p.lat, y, vm)
      : defaultProbeLine(y, vm)
    if (line === hoverLineRef.current) return
    hoverLineRef.current = line
    setMapHover(line)
  }, [year, vizMode, temporalField])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    syncBoundaryLayerVisibility(map, {
      showCountry: showCountryBoundary,
      showProvince: showProvinceBoundary,
    })
  }, [showCountryBoundary, showProvinceBoundary])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapRasterStyle(),
      center: [
        (CHINA_NAV_BOUNDS[0][0] + CHINA_NAV_BOUNDS[1][0]) / 2,
        (CHINA_NAV_BOUNDS[0][1] + CHINA_NAV_BOUNDS[1][1]) / 2,
      ],
      zoom: 4,
      minZoom: 2.4,
      maxZoom: 8.5,
      maxBounds: CHINA_NAV_BOUNDS,
      attributionControl: { compact: true },
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    let hoverMove: ((e: maplibregl.MapMouseEvent) => void) | undefined
    let hoverOut: (() => void) | undefined

    const resize = () => {
      map.resize()
    }
    resize()

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(resize)
    })
    ro.observe(containerRef.current)

    const markerZoomCtx: { debounce?: number; schedule: (() => void) | null } = {
      schedule: null,
    }

    map.on('load', () => {
      requestAnimationFrame(resize)
      const st = useAppStore.getState()
      applyMapViewMode(map, st.mapViewMode, { animate: false })
      const y = selectActiveYear(st)
      const { colorBlind: cb, vizMode: vm } = st
      ensureAdminBoundaryLayers(map)
      syncBoundaryLayerVisibility(map, {
        showCountry: st.showCountryBoundary,
        showProvince: st.showProvinceBoundary,
      })
      void applyRasterToMap(map, y, cb, vm, st.temporalField).catch((e) => {
        console.warn('[HeatmapMap] applyRasterToMap failed', e)
      })

      const syncPlaceMarkers = () => {
        markerRef.current.forEach((m) => m.remove())
        markerRef.current = []
        const z = map.getZoom()
        for (const c of placesVisibleAtZoom(z)) {
          const el = createPlaceMarkerEl(c, z)
          el.addEventListener('mousedown', (e) => e.stopPropagation())
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            useAppStore.getState().setSelectedPlace(c)
          })
          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'left',
            offset: [Math.round(3 * markerZoomScale(z)), 0],
          })
            .setLngLat([c.lon, c.lat])
            .addTo(map)
          markerRef.current.push(marker)
        }
      }

      const scheduleMarkerSync = () => {
        window.clearTimeout(markerZoomCtx.debounce)
        markerZoomCtx.debounce = window.setTimeout(() => syncPlaceMarkers(), 70)
      }
      markerZoomCtx.schedule = scheduleMarkerSync

      syncPlaceMarkers()
      map.on('zoom', scheduleMarkerSync)
      map.on('zoomend', scheduleMarkerSync)

      hoverMove = (e: maplibregl.MapMouseEvent) => {
        if (mapRef.current !== map) return
        const st = useAppStore.getState()
        const y = selectActiveYear(st)
        const { lng, lat } = e.lngLat
        lastHoverLngLatRef.current = { lng, lat }
        const line = probeLineAt(lng, lat, y, st.vizMode)
        if (line === hoverLineRef.current) return
        hoverLineRef.current = line
        setMapHover(line)
      }
      hoverOut = () => {
        if (mapRef.current !== map) return
        lastHoverLngLatRef.current = null
        const st = useAppStore.getState()
        const y = selectActiveYear(st)
        const line = defaultProbeLine(y, st.vizMode)
        hoverLineRef.current = line
        setMapHover(line)
      }
      map.on('mousemove', hoverMove)
      map.on('mouseout', hoverOut)
    })

    mapRef.current = map
    return () => {
      ro.disconnect()
      if (markerZoomCtx.schedule) {
        map.off('zoom', markerZoomCtx.schedule)
        map.off('zoomend', markerZoomCtx.schedule)
      }
      window.clearTimeout(markerZoomCtx.debounce)
      if (hoverMove) map.off('mousemove', hoverMove)
      if (hoverOut) map.off('mouseout', hoverOut)
      markerRef.current.forEach((m) => m.remove())
      markerRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    void applyRasterToMap(map, year, colorBlind, vizMode, temporalField).catch((e) => {
      console.warn('[HeatmapMap] applyRasterToMap failed', e)
    })
  }, [year, colorBlind, vizMode, temporalField])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.loaded()) return
    applyMapViewMode(map, mapViewMode, { animate: true })
  }, [mapViewMode])

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full min-h-0 bg-[#646464]"
        role="application"
        aria-label="中国热浪与气温场地图"
      />
      <FlowOverlay />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 top-3 z-10 flex min-h-0 max-w-[min(100%,26rem)] flex-col gap-2 md:inset-x-4 md:bottom-4 md:top-4">
        <MapHud mapHover={mapHover} />
        <MapPlaceSearch />
        {storyOpen ? <StoryPanel /> : null}
      </div>
    </div>
  )
}
