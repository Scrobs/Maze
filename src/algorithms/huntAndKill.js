// src/algorithms/huntAndKill.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Hunt-and-Kill Maze Generation Algorithm
 *
 * Alternates between random walks ("kill") and systematic "hunt" for
 * the next unvisited cell with a visited neighbor. Produces mazes with
 * long straight runs and a mix of branchy/dead-end structure.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateHuntAndKill(width, height) {
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

  // Track visited cells
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  // Utility: shuffle array in-place
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Directions for neighbors
  const deltas = {
    N: [0, -1],
    E: [1, 0],
    S: [0, 1],
    W: [-1, 0]
  };

  // Start at (0,0)
  let x = 0, y = 0;
  visited[y][x] = true;

  while (true) {
    // "Kill" phase: random walk until dead end
    let neighbors = [];
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        neighbors.push({ dir, nx, ny });
      }
    }
    if (neighbors.length > 0) {
      // Pick random neighbor and carve passage
      const { dir, nx, ny } = shuffle(neighbors)[0];
      maze.getCell(x, y).removeWall(dir);
      const opposite = { N: "S", E: "W", S: "N", W: "E" }[dir];
      maze.getCell(nx, ny).removeWall(opposite);
      x = nx; y = ny;
      visited[y][x] = true;
    } else {
      // "Hunt" phase: find next unvisited cell with a visited neighbor
      let found = false;
      for (let hy = 0; hy < height && !found; hy++) {
        for (let hx = 0; hx < width && !found; hx++) {
          if (!visited[hy][hx]) {
            // Find any visited neighbor
            let neighborDirs = [];
            for (const dir in deltas) {
              const [dx, dy] = deltas[dir];
              const nx = hx + dx, ny = hy + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && visited[ny][nx]) {
                neighborDirs.push({ dir, nx, ny });
              }
            }
            if (neighborDirs.length > 0) {
              // Pick one neighbor to connect
              const { dir, nx, ny } = shuffle(neighborDirs)[0];
              maze.getCell(hx, hy).removeWall(dir);
              const opposite = { N: "S", E: "W", S: "N", W: "E" }[dir];
              maze.getCell(nx, ny).removeWall(opposite);
              x = hx; y = hy;
              visited[y][x] = true;
              found = true;
            }
          }
        }
      }
      if (!found) break; // All cells visited
    }
  }

  // Open entrance/exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
