// src/export/json.js

/**
 * Triggers a download of the maze as a JSON file.
 * @param {Maze} maze - Maze object (from src/model/maze.js)
 * @param {string} [filename="maze.json"]
 */
export function saveMazeAsJSON(maze, filename = "maze.json") {
  const data = JSON.stringify(maze, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create and click a hidden link
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  
  try {
    a.click();
  } finally {
    // Immediate cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// src/export/svg.js

/**
 * Rounds a number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number}
 */
function round(num, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Generates SVG markup for a maze and triggers a download.
 * @param {Maze} maze - Maze object (from src/model/maze.js)
 * @param {string} [filename="maze.svg"]
 * @param {object} [options] - SVG export options
 * @param {number} [options.size=600] - SVG width/height in px
 * @param {number} [options.margin=24] - Margin around maze in px
 * @param {string} [options.wallColor="#222"] - Wall color
 * @param {number} [options.wallWidth=2] - Wall thickness in px
 * @param {string} [options.startColor="#26a65b"] - Start cell fill
 * @param {string} [options.finishColor="#e17055"] - Finish cell fill
 */
export function saveMazeAsSVG(
  maze,
  filename = "maze.svg",
  options = {}
) {
  const size = options.size ?? 600;
  const margin = options.margin ?? 24;
  const wallColor = options.wallColor ?? "#222";
  const wallWidth = options.wallWidth ?? 2;
  const startColor = options.startColor ?? "#26a65b";
  const finishColor = options.finishColor ?? "#e17055";

  const { width: cols, height: rows } = maze;
  const cellSize = Math.min(
    (size - margin * 2) / cols,
    (size - margin * 2) / rows
  );
  const xOffset = (size - cols * cellSize) / 2;
  const yOffset = (size - rows * cellSize) / 2;

  // SVG header
  let svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="100%" height="100%" fill="#fafafa"/>`
  ];

  // Highlight start cell
  if (maze.start) {
    const sx = round(xOffset + maze.start.x * cellSize + 2);
    const sy = round(yOffset + maze.start.y * cellSize + 2);
    const sw = round(cellSize - 4);
    svg.push(
      `<rect x="${sx}" y="${sy}" width="${sw}" height="${sw}" fill="${startColor}" fill-opacity="0.35"/>`
    );
  }
  
  // Highlight finish cell
  if (maze.finish) {
    const fx = round(xOffset + maze.finish.x * cellSize + 2);
    const fy = round(yOffset + maze.finish.y * cellSize + 2);
    const fw = round(cellSize - 4);
    svg.push(
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${fw}" fill="${finishColor}" fill-opacity="0.35"/>`
    );
  }

  // Group all walls for better organization
  svg.push(`<g stroke="${wallColor}" stroke-width="${wallWidth}" stroke-linecap="square">`);
  
  // Draw all walls
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.getCell(x, y);
      const x1 = round(xOffset + x * cellSize);
      const y1 = round(yOffset + y * cellSize);
      const x2 = round(x1 + cellSize);
      const y2 = round(y1 + cellSize);
      
      // Each wall as SVG <line> with rounded coordinates
      if (cell.hasWall("N")) {
        svg.push(`  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}"/>`);
      }
      if (cell.hasWall("E")) {
        svg.push(`  <line x1="${x2}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
      }
      if (cell.hasWall("S")) {
        svg.push(`  <line x1="${x2}" y1="${y2}" x2="${x1}" y2="${y2}"/>`);
      }
      if (cell.hasWall("W")) {
        svg.push(`  <line x1="${x1}" y1="${y2}" x2="${x1}" y2="${y1}"/>`);
      }
    }
  }
  
  svg.push(`</g>`);
  svg.push(`</svg>`);
  
  const svgText = svg.join("\n");
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Download as file
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  
  try {
    a.click();
  } finally {
    // Immediate cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
