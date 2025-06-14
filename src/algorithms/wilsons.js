// src/algorithms/wilsons.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Wilson's Maze Generation Algorithm
 *
 * Uses loop-erased random walks to add unvisited cells to the maze.
 * Produces uniform spanning trees (unbiased, highly "random" mazes).
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateWilsons(width, height) {
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

  // Choose a random cell to initialize the maze
  const startX = Math.floor(Math.random() * width);
  const startY = Math.floor(Math.random() * height);
  visited[startY][startX] = true;

  // Directions
  const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const opposite = { N: "S", E: "W", S: "N", W: "E" };

  // Helper to randomly pick direction
  function randomDir(x, y) {
    const dirs = [];
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        dirs.push(dir);
      }
    }
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  // For each unvisited cell, perform loop-erased random walk until hitting maze
  while (true) {
    // Find an unvisited cell
    let ux = -1, uy = -1;
    outer: for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x]) {
          ux = x; uy = y; break outer;
        }
      }
    }
    if (ux === -1) break; // All cells visited

    // Perform loop-erased random walk from (ux, uy)
    const path = [];
    const posMap = new Map();
    let cx = ux, cy = uy;
    
    while (!visited[cy][cx]) {
      const posKey = `${cx},${cy}`;
      if (posMap.has(posKey)) {
        // Loop detected: erase from last occurrence
        const idx = posMap.get(posKey);
        path.splice(idx + 1);
        // Update posMap for remaining path
        posMap.clear();
        for (let i = 0; i < path.length; i++) {
          const key = `${path[i].x},${path[i].y}`;
          posMap.set(key, i);
        }
      } else {
        path.push({ x: cx, y: cy });
        posMap.set(posKey, path.length - 1);
      }
      
      const dir = randomDir(cx, cy);
      const [dx, dy] = deltas[dir];
      cx += dx; cy += dy;
    }
    
    // Carve the path into the maze
    for (let i = 0; i < path.length; i++) {
      const { x, y } = path[i];
      visited[y][x] = true;
      
      // Connect to next cell in path (or to visited maze if at end)
      let nextX, nextY;
      if (i < path.length - 1) {
        nextX = path[i + 1].x;
        nextY = path[i + 1].y;
      } else {
        // Connect to the visited cell we hit
        nextX = cx;
        nextY = cy;
      }
      
      // Find direction from (x, y) to (nextX, nextY)
      let dir;
      for (const d in deltas) {
        const [dx, dy] = deltas[d];
        if (x + dx === nextX && y + dy === nextY) {
          dir = d; break;
        }
      }
      
      if (dir) {
        // Remove wall between cells
        maze.getCell(x, y).removeWall(dir);
        maze.getCell(nextX, nextY).removeWall(opposite[dir]);
      }
    }
  }

  // Open entrance and exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
