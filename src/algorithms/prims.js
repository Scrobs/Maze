// src/algorithms/prims.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Randomized Prim's Maze Generation Algorithm
 *
 * Starts with a random cell, grows the maze by adding the nearest
 * frontier cell, always connecting to the maze with a random wall.
 * Tends to produce mazes with short branches and many dead ends.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generatePrims(width, height) {
  const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

  // IMPORTANT: Start with ALL walls on ALL cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, y);
      cell.addWall("N");
      cell.addWall("E");
      cell.addWall("S");
      cell.addWall("W");
    }
  }

  // Visited grid
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  // Pick a random starting cell (or use start)
  let startX = maze.start.x;
  let startY = maze.start.y;
  visited[startY][startX] = true;

  // Frontier: cells adjacent to the maze (and not yet in it)
  const frontier = [];
  const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

  function addFrontier(x, y) {
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (
        nx >= 0 && nx < width &&
        ny >= 0 && ny < height &&
        !visited[ny][nx] &&
        !frontier.some(f => f.x === nx && f.y === ny)
      ) {
        frontier.push({ x: nx, y: ny });
      }
    }
  }

  addFrontier(startX, startY);

  while (frontier.length > 0) {
    // Pick a random frontier cell
    const idx = Math.floor(Math.random() * frontier.length);
    const { x, y } = frontier.splice(idx, 1)[0];

    // Find all visited neighbors
    const neighbors = [];
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (
        nx >= 0 && nx < width &&
        ny >= 0 && ny < height &&
        visited[ny][nx]
      ) {
        neighbors.push({ dir, nx, ny });
      }
    }
    // Connect to a random visited neighbor
    if (neighbors.length > 0) {
      const { dir, nx, ny } = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze.getCell(x, y).removeWall(dir);
      const opposite = { N: "S", E: "W", S: "N", W: "E" }[dir];
      maze.getCell(nx, ny).removeWall(opposite);
    }

    visited[y][x] = true;
    addFrontier(x, y);
  }

  // Open entrance and exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
