// src/render/canvas.js

/**
 * Renders a maze to a canvas element with DPI awareness
 * @param {Maze} maze - The maze to render
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {object} [options] - Rendering options
 */
export function renderMaze(maze, canvas, options = {}) {
  const margin = options.margin ?? 24;
  const wallColor = options.wallColor ?? "#333";
  const wallWidth = options.wallWidth ?? 2;
  const startColor = options.startColor ?? "#26a65b";
  const finishColor = options.finishColor ?? "#e17055";

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Get the CSS size of the canvas
  const displayWidth = canvas.clientWidth || 600;
  const displayHeight = canvas.clientHeight || 600;
  
  // Clear with proper dimensions
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const rows = maze.height;
  const cols = maze.width;

  // Calculate cell size based on display dimensions
  const availableWidth = displayWidth - margin * 2;
  const availableHeight = displayHeight - margin * 2;
  const cellSize = Math.min(availableWidth / cols, availableHeight / rows);

  // Center the maze
  const xOffset = (displayWidth - (cellSize * cols)) / 2;
  const yOffset = (displayHeight - (cellSize * rows)) / 2;

  // Set up drawing style
  ctx.save();
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = wallWidth;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";

  // Use Path2D for better performance on complex mazes
  const wallPath = new Path2D();
  
  // Draw all walls
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.getCell(x, y);
      if (!cell) continue;

      const x1 = xOffset + x * cellSize;
      const y1 = yOffset + y * cellSize;
      const x2 = x1 + cellSize;
      const y2 = y1 + cellSize;

      // Draw walls if they exist
      if (cell.hasWall("N")) {
        wallPath.moveTo(x1, y1);
        wallPath.lineTo(x2, y1);
      }
      if (cell.hasWall("E")) {
        wallPath.moveTo(x2, y1);
        wallPath.lineTo(x2, y2);
      }
      if (cell.hasWall("S")) {
        wallPath.moveTo(x2, y2);
        wallPath.lineTo(x1, y2);
      }
      if (cell.hasWall("W")) {
        wallPath.moveTo(x1, y2);
        wallPath.lineTo(x1, y1);
      }
    }
  }
  
  ctx.stroke(wallPath);
  ctx.restore();

  // Fill start cell
  if (maze.start) {
    ctx.save();
    ctx.fillStyle = startColor;
    ctx.globalAlpha = 0.4;
    const padding = 2;
    ctx.fillRect(
      xOffset + maze.start.x * cellSize + padding,
      yOffset + maze.start.y * cellSize + padding,
      cellSize - padding * 2,
      cellSize - padding * 2
    );
    ctx.restore();
  }

  // Fill finish cell
  if (maze.finish) {
    ctx.save();
    ctx.fillStyle = finishColor;
    ctx.globalAlpha = 0.4;
    const padding = 2;
    ctx.fillRect(
      xOffset + maze.finish.x * cellSize + padding,
      yOffset + maze.finish.y * cellSize + padding,
      cellSize - padding * 2,
      cellSize - padding * 2
    );
    ctx.restore();
  }
  
  // Draw portals if maze has them (for multi-layer)
  if (maze._portals && maze._portals.length > 0) {
    ctx.save();
    ctx.strokeStyle = "#9c27b0";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    for (const portal of maze._portals) {
      const fromX = xOffset + portal.from.x * cellSize + cellSize / 2;
      const fromY = yOffset + portal.from.y * cellSize + cellSize / 2;
      const toX = xOffset + portal.to.x * cellSize + cellSize / 2;
      const toY = yOffset + portal.to.y * cellSize + cellSize / 2;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      
      // Draw portal markers
      ctx.fillStyle = "#9c27b0";
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(fromX, fromY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toX, toY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
