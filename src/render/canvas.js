// src/render/canvas.js

/**
 * Renders a maze to a canvas element with DPI awareness
 * @param {Maze} maze - The maze to render
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {object} [options] - Rendering options
 */
export function renderMaze(maze, canvas, options = {}) {
  const margin      = options.margin      ?? 24;
  const wallColor   = options.wallColor   ?? "#333";
  const wallWidth   = options.wallWidth   ?? 2;    // CSS-pixel thickness
  const startColor  = options.startColor  ?? "#26a65b";
  const finishColor = options.finishColor ?? "#e17055";

  const ctx  = canvas.getContext("2d");
  const dpr  = window.devicePixelRatio || 1;

  /* ------------------------------------------------------------------
   * 1.  FULL-SURFACE CLEAR  (must ignore any existing transform)
   * ---------------------------------------------------------------- */
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);              // identity matrix
  ctx.clearRect(0, 0, canvas.width, canvas.height); // device-pixel coords
  ctx.restore();

  /* ------------------------------------------------------------------
   * 2.  GEOMETRY CALCULATION (CSS-pixel space, because ctx is scaled
   *     by 'setupCanvas()' elsewhere)
   * ---------------------------------------------------------------- */
  const displayWidth  = canvas.width  / dpr;        // CSS-px width
  const displayHeight = canvas.height / dpr;        // CSS-px height
  const rows = maze.height;
  const cols = maze.width;

  const availW   = displayWidth  - margin * 2;
  const availH   = displayHeight - margin * 2;
  const cellSize = Math.min(availW / cols, availH / rows);

  const xOffset = (displayWidth  - cellSize * cols) / 2;
  const yOffset = (displayHeight - cellSize * rows) / 2;

  /* ------------------------------------------------------------------
   * 3.  WALL RENDERING  (draw each edge exactly once)
   * ---------------------------------------------------------------- */
  ctx.save();
  ctx.strokeStyle = wallColor;
  ctx.lineWidth   = wallWidth / dpr;                // compensate for scaling
  ctx.lineCap     = "square";
  ctx.lineJoin    = "miter";

  const path = new Path2D();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.getCell(x, y);
      if (!cell) continue;

      const x1 = xOffset + x * cellSize;
      const y1 = yOffset + y * cellSize;
      const x2 = x1 + cellSize;
      const y2 = y1 + cellSize;

      /* Draw each shared wall once:
       *  ─── North & West for every cell
       *  ─── South on bottom row
       *  ─── East  on rightmost column
       */
      if (cell.hasWall("N")) {
        path.moveTo(x1, y1);
        path.lineTo(x2, y1);
      }
      if (cell.hasWall("W")) {
        path.moveTo(x1, y1);
        path.lineTo(x1, y2);
      }
      if (y === rows - 1 && cell.hasWall("S")) {
        path.moveTo(x2, y2);
        path.lineTo(x1, y2);
      }
      if (x === cols - 1 && cell.hasWall("E")) {
        path.moveTo(x2, y1);
        path.lineTo(x2, y2);
      }
    }
  }

  ctx.stroke(path);
  ctx.restore();

  /* ------------------------------------------------------------------
   * 4.  START / FINISH HIGHLIGHT
   * ---------------------------------------------------------------- */
  const drawCellFill = (pos, color) => {
    const pad = 2;                                  // CSS-px padding
    ctx.save();
    ctx.fillStyle   = color;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(
      xOffset + pos.x * cellSize + pad,
      yOffset + pos.y * cellSize + pad,
      cellSize - pad * 2,
      cellSize - pad * 2
    );
    ctx.restore();
  };

  if (maze.start)  drawCellFill(maze.start,  startColor);
  if (maze.finish) drawCellFill(maze.finish, finishColor);

  /* ------------------------------------------------------------------
   * 5.  PORTAL OVERLAY (dashed violet lines)
   * ---------------------------------------------------------------- */
  if (Array.isArray(maze._portals) && maze._portals.length) {
    ctx.save();
    ctx.strokeStyle = "#9c27b0";
    ctx.lineWidth   = 3 / dpr;
    ctx.setLineDash([5, 5]);

    for (const portal of maze._portals) {
      const fx = xOffset + portal.from.x * cellSize + cellSize / 2;
      const fy = yOffset + portal.from.y * cellSize + cellSize / 2;
      const tx = xOffset + portal.to.x   * cellSize + cellSize / 2;
      const ty = yOffset + portal.to.y   * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // End-point markers
      ctx.globalAlpha = 0.6;
      ctx.fillStyle   = "#9c27b0";
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
