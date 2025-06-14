// src/algorithms/recursiveBacktracker.js - ITERATIVE VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Recursive Backtracker Maze Generation Algorithm (Iterative DFS)
 * 
 * Produces mazes with long corridors and many dead ends.
 * Uses iterative approach to avoid stack overflow on large mazes.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateRecursiveBacktracker(width, height) {
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

  // Randomized DFS using explicit stack
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Stack for iterative DFS
  const stack = [];
  
  // Start at the maze start position
  const startX = maze.start.x;
  const startY = maze.start.y;
  visited[startY][startX] = true;
  stack.push({ x: startX, y: startY });

  // Direction helpers
  const directions = {
    N: [0, -1],
    E: [1, 0],
    S: [0, 1],
    W: [-1, 0]
  };
  const opposite = { N: "S", E: "W", S: "N", W: "E" };

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { x, y } = current;
    
    // Get unvisited neighbors
    const unvisitedNeighbors = [];
    for (const [dir, [dx, dy]] of Object.entries(directions)) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        unvisitedNeighbors.push({ dir, nx, ny });
      }
    }
    
    if (unvisitedNeighbors.length > 0) {
      // Choose random unvisited neighbor
      const { dir, nx, ny } = shuffle(unvisitedNeighbors)[0];
      
      // Remove walls between cells
      maze.getCell(x, y).removeWall(dir);
      maze.getCell(nx, ny).removeWall(opposite[dir]);
      
      // Mark as visited and add to stack
      visited[ny][nx] = true;
      stack.push({ x: nx, y: ny });
    } else {
      // Backtrack
      stack.pop();
    }
  }

  // Open entrance/exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
