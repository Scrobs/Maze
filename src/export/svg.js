// src/export/svg.js

/**
 * Zaokrouhlí číslo na zadaný počet desetinných míst
 * @param {number} num - Číslo k zaokrouhlení
 * @param {number} decimals - Počet desetinných míst
 * @returns {number}
 */
function round(num, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Generuje SVG markup pro bludiště a spustí stažení.
 * @param {Maze} maze - Objekt bludiště (z src/model/maze.js)
 * @param {string} [filename="bludiste.svg"]
 * @param {object} [options] - Možnosti exportu SVG
 * @param {number} [options.size=600] - Šířka/výška SVG v px
 * @param {number} [options.margin=24] - Okraj kolem bludiště v px
 * @param {string} [options.wallColor="#222"] - Barva stěn
 * @param {number} [options.wallWidth=2] - Tloušťka stěny v px
 * @param {string} [options.startColor="#26a65b"] - Barva výplně startovní buňky
 * @param {string} [options.finishColor="#e17055"] - Barva výplně cílové buňky
 */
export function saveMazeAsSVG(
  maze,
  filename = "bludiste.svg",
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

  // SVG hlavička
  let svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="100%" height="100%" fill="#fafafa"/>`
  ];

  // Zvýraznit startovní buňku
  if (maze.start) {
    const sx = round(xOffset + maze.start.x * cellSize + 2);
    const sy = round(yOffset + maze.start.y * cellSize + 2);
    const sw = round(cellSize - 4);
    svg.push(
      `<rect x="${sx}" y="${sy}" width="${sw}" height="${sw}" fill="${startColor}" fill-opacity="0.35"/>`
    );
  }
  
  // Zvýraznit cílovou buňku
  if (maze.finish) {
    const fx = round(xOffset + maze.finish.x * cellSize + 2);
    const fy = round(yOffset + maze.finish.y * cellSize + 2);
    const fw = round(cellSize - 4);
    svg.push(
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${fw}" fill="${finishColor}" fill-opacity="0.35"/>`
    );
  }

  // Seskupit všechny stěny pro lepší organizaci
  svg.push(`<g stroke="${wallColor}" stroke-width="${wallWidth}" stroke-linecap="square">`);
  
  // Nakreslit všechny stěny
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.getCell(x, y);
      const x1 = round(xOffset + x * cellSize);
      const y1 = round(yOffset + y * cellSize);
      const x2 = round(x1 + cellSize);
      const y2 = round(y1 + cellSize);
      
      // Každá stěna jako SVG <line> se zaokrouhlenými souřadnicemi
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

  // Stáhnout jako soubor
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  
  try {
    a.click();
  } finally {
    // Okamžité vyčištění
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}