// src/algorithms/aldousBroder.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Aldous-Broder Maze Generation Algorithm
 * 
 * Performs a random walk until all cells have been visited,
 * carving passages only when entering unvisited cells.
 * Produces uniform spanning trees (unbiased, fully random).
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateAldousBroder(width, height) {
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

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  let totalVisited = 1;
  const totalCells = width * height;

  // Start at random position (or (0,0) if preferred)
  let x = Math.floor(Math.random() * width);
  let y = Math.floor(Math.random() * height);
  visited[y][x] = true;

  // Directions/deltas
  const deltas = {
    N: [0, -1],
    E: [1, 0],
    S: [0, 1],
    W: [-1, 0]
  };

  // Utility
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  while (totalVisited < totalCells) {
    // Get list of valid directions from current cell
    const possible = [];
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        possible.push({ dir, nx, ny });
      }
    }
    // Pick random direction
    const { dir, nx, ny } = possible[Math.floor(Math.random() * possible.length)];
    if (!visited[ny][nx]) {
      // Carve passage to unvisited neighbor
      maze.getCell(x, y).removeWall(dir);
      const opposite = { N: "S", E: "W", S: "N", W: "E" }[dir];
      maze.getCell(nx, ny).removeWall(opposite);
      visited[ny][nx] = true;
      totalVisited++;
    }
    // Move to neighbor
    x = nx; y = ny;
  }

  // Open entrance/exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
