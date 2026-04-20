import { useEffect, useRef } from 'react'
import { flowVector } from '../../lib/demoField'
import { USE_REAL_GRID } from '../../lib/gridConfig'
import { flowVectorFromRealTemp } from '../../lib/realGridFlow'
import { selectActiveYear, useAppStore } from '../../store/useAppStore'

type Particle = { x: number; y: number; life: number; ttl: number }

function makeParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    life: 0,
    ttl: 30 + Math.random() * 120,
  }
}

export function FlowOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const year = useAppStore(selectActiveYear)
  const flowOverlay = useAppStore((s) => s.flowOverlay)
  const yearRef = useRef(year)
  const overlayRef = useRef(flowOverlay)

  useEffect(() => {
    yearRef.current = year
  }, [year])

  useEffect(() => {
    overlayRef.current = flowOverlay
  }, [flowOverlay])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: Particle[] = []
    let raf = 0
    const density = 1300

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${Math.floor(rect.width)}px`
      canvas.style.height = `${Math.floor(rect.height)}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const targetCount = Math.max(350, Math.floor(rect.width * rect.height / density))
      particles.length = 0
      for (let i = 0; i < targetCount; i++) particles.push(makeParticle(rect.width, rect.height))
    }

    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    resize()

    let prev = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w <= 2 || h <= 2) {
        raf = requestAnimationFrame(tick)
        return
      }

      // 关键修复：每帧先清空，避免半透明叠加把整屏“涂黑”
      ctx.clearRect(0, 0, w, h)
      if (overlayRef.current) {
        ctx.lineWidth = 0.8
        ctx.strokeStyle = 'rgba(127,219,255,0.2)'
        ctx.beginPath()
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.life += dt * 60
          if (p.life > p.ttl) {
            particles[i] = makeParticle(w, h)
            continue
          }
          const nx = p.x / w
          const ny = p.y / h
          const vec = USE_REAL_GRID
            ? flowVectorFromRealTemp(nx, ny, yearRef.current)
            : flowVector(nx, ny, yearRef.current)
          const speed = 42
          const nx2 = p.x + vec.u * speed * dt
          const ny2 = p.y + vec.v * speed * dt
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(nx2, ny2)
          p.x = nx2
          p.y = ny2
          if (p.x < -5 || p.x > w + 5 || p.y < -5 || p.y > h + 5) {
            particles[i] = makeParticle(w, h)
          }
        }
        ctx.stroke()
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      aria-hidden="true"
    />
  )
}
