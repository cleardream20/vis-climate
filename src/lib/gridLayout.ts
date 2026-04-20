import { DOMAIN } from './constants'

/** 旧版 JSON（未写 gridLayout）且 NC 为南→北递增时，可设 `VITE_REAL_GRID_FLIP_ROWS=true` */
export const REAL_GRID_FLIP_ROWS =
  import.meta.env.VITE_REAL_GRID_FLIP_ROWS === 'true'
export const REAL_GRID_FLIP_COLS =
  import.meta.env.VITE_REAL_GRID_FLIP_COLS === 'true'

export type GridLayoutMeta = {
  row0?: string
  col0?: string
}

export function flipRowsFloat32(
  grid: Float32Array,
  rows: number,
  cols: number,
): Float32Array {
  const out = new Float32Array(grid.length)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[(rows - 1 - r) * cols + c] = grid[r * cols + c]!
    }
  }
  return out
}

export function flipColsFloat32(
  grid: Float32Array,
  rows: number,
  cols: number,
): Float32Array {
  const out = new Float32Array(grid.length)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[r * cols + (cols - 1 - c)] = grid[r * cols + c]!
    }
  }
  return out
}

/** 按 meta / 环境变量把缓冲区对齐为「row0=北、col0=西」 */
export function applyGridLayoutToBuffer(
  grid: Float32Array,
  rows: number,
  cols: number,
  layout: GridLayoutMeta | undefined,
): Float32Array {
  let g = grid
  const row0 = layout?.row0
  const col0 = layout?.col0

  const needRowFlip =
    row0 === 'south' || (row0 !== 'north' && row0 == null && REAL_GRID_FLIP_ROWS)
  const needColFlip =
    col0 === 'east' || (col0 !== 'west' && col0 == null && REAL_GRID_FLIP_COLS)

  if (needRowFlip) g = flipRowsFloat32(g, rows, cols)
  if (needColFlip) g = flipColsFloat32(g, rows, cols)
  return g
}

export function assertDomainShape(rows: number, cols: number): void {
  if (rows !== DOMAIN.gridRows || cols !== DOMAIN.gridCols) {
    console.warn(
      `[realGrid] JSON grid ${rows}x${cols} differs from DOMAIN ${DOMAIN.gridRows}x${DOMAIN.gridCols}`,
    )
  }
}
