import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { exportPanel, type ExportFormat } from '../../lib/shareExport'

export function ShareMenu({
  exportRootRef,
  filenameBase,
  className,
}: {
  exportRootRef: RefObject<HTMLElement | null>
  filenameBase: string
  className?: string
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const run = useCallback(
    async (format: ExportFormat) => {
      const root = exportRootRef.current
      if (!root || busy) return
      setBusy(true)
      setOpen(false)
      try {
        await exportPanel(root, format, filenameBase)
      } catch (e) {
        console.warn('[ShareMenu] export failed', e)
        window.alert('导出失败，请稍后重试。')
      } finally {
        setBusy(false)
      }
    },
    [exportRootRef, filenameBase, busy],
  )

  return (
    <div ref={menuRef} className={clsx('relative', className)} data-export-hide>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'rounded-lg px-2.5 py-1 text-xs font-medium transition',
          open || busy
            ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/35'
            : 'border border-white/15 text-slate-200 hover:bg-white/10',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {busy ? '导出中…' : '分享'}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] rounded-lg border border-white/15 bg-slate-900 py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10"
            onClick={() => void run('png')}
          >
            导出 PNG 图片
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10"
            onClick={() => void run('html')}
          >
            导出 HTML 网页
          </button>
        </div>
      ) : null}
    </div>
  )
}
