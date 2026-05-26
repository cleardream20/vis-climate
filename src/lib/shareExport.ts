/** 将侧栏内容导出为 PNG 或自包含 HTML；优先使用系统「另存为」对话框 */

export type ExportFormat = 'png' | 'html'

const PNG_WIDTH = 920
const PNG_PAD = 28
const PNG_COL_GAP = 20
const PNG_ROW_GAP = 18
const PNG_CHART_H = 132
const PNG_TITLE_H = 18
const PNG_LEGEND_H = 14
const PNG_SECTION_GAP = 22

type ExportChart = {
  title: string
  yLabel: string
  legend?: string
  svg: SVGSVGElement
}

type ExportSection = {
  title: string
  skipPng?: boolean
  charts: ExportChart[]
  textHtml?: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function saveWithPicker(
  blob: Blob,
  suggestedName: string,
  mime: string,
  ext: string,
): Promise<void> {
  const picker = (
    window as Window & {
      showSaveFilePicker?: (o: {
        suggestedName: string
        types: { description: string; accept: Record<string, string[]> }[]
      }) => Promise<FileSystemFileHandle>
    }
  ).showSaveFilePicker

  if (!picker) {
    downloadBlob(blob, suggestedName)
    return
  }

  try {
    const handle = await picker({
      suggestedName,
      types: [
        {
          description: ext === '.png' ? 'PNG 图片' : 'HTML 网页',
          accept: { [mime]: [ext] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    downloadBlob(blob, suggestedName)
  }
}

function svgRenderSize(svg: SVGSVGElement): { w: number; h: number } {
  const vb = svg.viewBox.baseVal
  if (vb.width > 0 && vb.height > 0) return { w: vb.width, h: vb.height }
  const r = svg.getBoundingClientRect()
  return { w: Math.max(280, r.width || 300), h: Math.max(100, r.height || 112) }
}

async function svgToCanvas(
  svg: SVGSVGElement,
  targetW: number,
  targetH: number,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const { w: sw, h: sh } = svgRenderSize(svg)
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(targetW))
  clone.setAttribute('height', String(targetH))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${sw} ${sh}`)
  }

  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(
    new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }),
  )
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG 渲染失败'))
    img.src = url
  })
  URL.revokeObjectURL(url)

  const canvas = document.createElement('canvas')
  canvas.width = targetW * scale
  canvas.height = targetH * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.drawImage(img, 0, 0, targetW, targetH)
  return canvas
}

function collectExportModel(root: HTMLElement): {
  pageTitle: string
  summary?: string
  sections: ExportSection[]
} {
  const pageTitle =
    root.closest('aside')?.querySelector('h2')?.textContent?.trim() ||
    root.querySelector('h2')?.textContent?.trim() ||
    '气候图表'

  const summaryEl = root.querySelector('[data-export-summary]')
  const summary = summaryEl?.textContent?.replace(/\s+/g, ' ').trim()

  const sections: ExportSection[] = []
  root.querySelectorAll('[data-export-section]').forEach((sec) => {
    const title = sec.querySelector('[data-export-title]')?.textContent?.trim() ?? ''
    const skipPng = sec.hasAttribute('data-export-skip-png')
    const charts: ExportChart[] = []
    sec.querySelectorAll('[data-export-chart]').forEach((card) => {
      const svg = card.querySelector('svg')
      if (!svg) return
      charts.push({
        title: card.getAttribute('data-export-chart-title') ?? title,
        yLabel: card.getAttribute('data-export-y-label') ?? '',
        legend: card.getAttribute('data-export-legend') ?? undefined,
        svg: svg as SVGSVGElement,
      })
    })
    sections.push({
      title,
      skipPng,
      charts,
      textHtml: charts.length === 0 ? sec.innerHTML : undefined,
    })
  })

  return { pageTitle, summary, sections }
}

function chartCellHeight(c: ExportChart): number {
  return PNG_TITLE_H + (c.legend ? PNG_LEGEND_H : 0) + PNG_CHART_H + 8
}

async function rootToPngBlob(root: HTMLElement): Promise<Blob> {
  const { pageTitle, summary, sections } = collectExportModel(root)
  const colW = (PNG_WIDTH - PNG_PAD * 2 - PNG_COL_GAP) / 2

  const rows: { sectionTitle?: string; cells: ExportChart[] }[] = []
  for (const sec of sections) {
    if (sec.skipPng || sec.charts.length === 0) continue
    for (let i = 0; i < sec.charts.length; i += 2) {
      rows.push({
        sectionTitle: i === 0 ? sec.title : undefined,
        cells: sec.charts.slice(i, i + 2),
      })
    }
  }

  let totalH = PNG_PAD + 36
  if (summary) totalH += 36
  for (const row of rows) {
    if (row.sectionTitle) totalH += PNG_SECTION_GAP
    const h0 = row.cells[0] ? chartCellHeight(row.cells[0]) : 0
    const h1 = row.cells[1] ? chartCellHeight(row.cells[1]) : 0
    totalH += Math.max(h0, h1) + PNG_ROW_GAP
  }
  totalH += PNG_PAD

  const out = document.createElement('canvas')
  out.width = PNG_WIDTH * 2
  out.height = totalH * 2
  const ctx = out.getContext('2d')!
  ctx.scale(2, 2)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, PNG_WIDTH, totalH)

  let y = PNG_PAD
  ctx.fillStyle = '#f8fafc'
  ctx.font = '600 18px system-ui,sans-serif'
  ctx.fillText(pageTitle, PNG_PAD, y + 18)
  y += 36

  if (summary) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px system-ui,sans-serif'
    ctx.fillText(summary, PNG_PAD, y + 14)
    y += 36
  }

  for (const row of rows) {
    if (row.sectionTitle) {
      y += 8
      ctx.fillStyle = '#64748b'
      ctx.font = '600 11px system-ui,sans-serif'
      ctx.fillText(row.sectionTitle.toUpperCase(), PNG_PAD, y + 10)
      y += PNG_SECTION_GAP
    }

    const rowH = Math.max(
      row.cells[0] ? chartCellHeight(row.cells[0]) : 0,
      row.cells[1] ? chartCellHeight(row.cells[1]) : 0,
    )

    for (let col = 0; col < row.cells.length; col++) {
      const chart = row.cells[col]!
      const x = PNG_PAD + col * (colW + PNG_COL_GAP)
      let cy = y

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '600 13px system-ui,sans-serif'
      ctx.fillText(chart.title, x, cy + 12)
      cy += PNG_TITLE_H

      if (chart.legend) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '11px system-ui,sans-serif'
        ctx.fillText(chart.legend, x, cy + 10)
        cy += PNG_LEGEND_H
      }

      ctx.fillStyle = '#64748b'
      ctx.font = '10px system-ui,sans-serif'
      ctx.fillText(`纵轴：${chart.yLabel}`, x, cy + 10)
      cy += 12

      const chartCanvas = await svgToCanvas(chart.svg, colW, PNG_CHART_H)
      ctx.drawImage(chartCanvas, x, cy, colW, PNG_CHART_H)
    }

    y += rowH + PNG_ROW_GAP
  }

  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 生成失败'))), 'image/png')
  })
}

function buildHtmlDocument(title: string, bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  body{margin:0;padding:24px;font-family:system-ui,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.5}
  h1{font-size:1.25rem;margin:0 0 0.75rem}
  .summary{font-size:0.8rem;color:#94a3b8;margin-bottom:1.25rem}
  section{margin-bottom:1.75rem}
  h2{font-size:0.85rem;color:#94a3b8;margin:0 0 0.75rem;font-weight:600;letter-spacing:0.04em}
  [data-export-grid]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem 1.25rem}
  [data-export-chart]{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0.65rem 0.75rem}
  [data-export-chart] p{margin:0 0 0.35rem;font-size:0.72rem;color:#94a3b8}
  svg{max-width:100%;height:auto;display:block;background:#0f172a}
  @media (max-width:720px){[data-export-grid]{grid-template-columns:1fr}}
</style>
</head>
<body>
<h1>${title}</h1>
${bodyInner}
</body>
</html>`
}

function rootToHtml(root: HTMLElement, title: string): string {
  const clone = root.cloneNode(true) as HTMLElement
  clone.querySelectorAll('button').forEach((b) => b.remove())
  clone.querySelectorAll('[data-export-hide]').forEach((el) => el.remove())

  const summary = clone.querySelector('[data-export-summary]')
  let body = summary
    ? `<p class="summary">${summary.textContent?.replace(/\s+/g, ' ').trim() ?? ''}</p>`
    : ''

  clone.querySelectorAll('[data-export-section]').forEach((sec) => {
    const heading = sec.querySelector('[data-export-title]')?.textContent ?? ''
    body += `<section><h2>${heading}</h2>${sec.innerHTML}</section>\n`
  })

  if (!body) body = `<section>${clone.innerHTML}</section>`
  return buildHtmlDocument(title, body)
}

export async function exportPanel(
  root: HTMLElement,
  format: ExportFormat,
  filenameBase: string,
): Promise<void> {
  if (format === 'png') {
    const blob = await rootToPngBlob(root)
    await saveWithPicker(blob, `${filenameBase}.png`, 'image/png', '.png')
    return
  }
  const title =
    root.closest('aside')?.querySelector('h2')?.textContent?.trim() ||
    root.querySelector('h2')?.textContent?.trim() ||
    filenameBase
  const html = rootToHtml(root, title)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  await saveWithPicker(blob, `${filenameBase}.html`, 'text/html', '.html')
}
