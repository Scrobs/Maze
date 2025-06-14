// src/algorithms/wilsons.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Wilson's Maze Generation Algorithm
 *
 * Uses loop-erased random walks to add unvisited cells to the maze.
 * Produces uniform spanning trees (unbiased, highly "random" mazes).
 * 
 * FIXED: Simplified loop erasure logic for better reliability and debugging.
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

  // Track visited cells
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  // Choose a random cell to initialize the maze
  const startX = Math.floor(Math.random() * width);
  const startY = Math.floor(Math.random() * height);
  visited[startY][startX] = true;

  // Direction helpers
  const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const opposite = { N: "S", E: "W", S: "N", W: "E" };

  /**
   * Get valid directions from a position (with bounds checking)
   */
  function getValidDirections(x, y) {
    const validDirs = [];
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        validDirs.push(dir);
      }
    }
    return validDirs;
  }

  /**
   * Pick a random valid direction from a position
   */
  function randomDirection(x, y) {
    const validDirs = getValidDirections(x, y);
    if (validDirs.length === 0) {
      throw new Error(`No valid directions from (${x}, ${y})`);
    }
    return validDirs[Math.floor(Math.random() * validDirs.length)];
  }

  /**
   * SIMPLIFIED: Check if a position exists in the path
   */
  function findPositionInPath(path, x, y) {
    for (let i = 0; i < path.length; i++) {
      if (path[i].x === x && path[i].y === y) {
        return i;
      }
    }
    return -1;
  }

  // Main Wilson's algorithm loop
  let totalCells = width * height;
  let visitedCells = 1;

  while (visitedCells < totalCells) {
    // Find an unvisited cell to start the random walk
    let startX = -1, startY = -1;
    
    // Search for unvisited cell
    outerLoop: for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x]) {
          startX = x;
          startY = y;
          break outerLoop;
        }
      }
    }

    if (startX === -1) break; // All cells visited (shouldn't happen)

    // Perform loop-erased random walk from (startX, startY)
    const path = [];
    let currentX = startX, currentY = startY;
    let walkSteps = 0;
    const maxWalkSteps = width * height * 10; // Prevent infinite walks

    // Random walk until we hit a visited cell
    while (!visited[currentY][currentX] && walkSteps < maxWalkSteps) {
      walkSteps++;

      // Check if current position creates a loop in our path
      const loopIndex = findPositionInPath(path, currentX, currentY);
      
      if (loopIndex >= 0) {
        // Loop detected: erase everything after the loop start
        path.splice(loopIndex);
      } else {
        // New position: add to path
        path.push({ x: currentX, y: currentY });
      }
      
      // Move to random neighbor
      try {
        const dir = randomDirection(currentX, currentY);
        const [dx, dy] = deltas[dir];
        currentX += dx;
        currentY += dy;
      } catch (error) {
        console.error('Random walk failed:', error);
        break; // Escape infinite loop
      }
    }

    // Safety check
    if (walkSteps >= maxWalkSteps) {
      console.warn('Wilson\'s algorithm: Walk too long, skipping this path');
      continue;
    }

    // Carve the path into the maze
    for (let i = 0; i < path.length; i++) {
      const { x, y } = path[i];
      
      // Mark as visited
      if (!visited[y][x]) {
        visited[y][x] = true;
        visitedCells++;
      }
      
      // Connect to next cell in path (or to visited maze if at end)
      let nextX, nextY;
      if (i < path.length - 1) {
        nextX = path[i + 1].x;
        nextY = path[i + 1].y;
      } else {
        // Connect to the visited cell we hit
        nextX = currentX;
        nextY = currentY;
      }
      
      // Find direction from current cell to next cell
      let connectionDir = null;
      for (const dir in deltas) {
        const [dx, dy] = deltas[dir];
        if (x + dx === nextX && y + dy === nextY) {
          connectionDir = dir;
          break;
        }
      }
      
      if (connectionDir) {
        // Remove walls between cells
        const currentCell = maze.getCell(x, y);
        const nextCell = maze.getCell(nextX, nextY);
        
        if (currentCell && nextCell) {
          currentCell.removeWall(connectionDir);
          nextCell.removeWall(opposite[connectionDir]);
        } else {
          console.warn(`Wilson's: Invalid cells at (${x},${y}) -> (${nextX},${nextY})`);
        }
      }
    }
  }

  // Ensure boundary walls are present (except for entrance/exit)
  ensureBoundaryWalls(maze);

  return maze;
}

/**
 * Ensure all boundary walls are present except for entrance/exit
 */
function ensureBoundaryWalls(maze) {
  // Top boundary
  for (let x = 0; x < maze.width; x++) {
    maze.getCell(x, 0).addWall("N");
  }
  // Bottom boundary  
  for (let x = 0; x < maze.width; x++) {
    maze.getCell(x, maze.height - 1).addWall("S");
  }
  // Left boundary
  for (let y = 0; y < maze.height; y++) {
    maze.getCell(0, y).addWall("W");
  }
  // Right boundary
  for (let y = 0; y < maze.height; y++) {
    maze.getCell(maze.width - 1, y).addWall("E");
  }
  
  // Open entrance and exit
  if (maze.start) {
    const startCell = maze.getCell(maze.start.x, maze.start.y);
    if (maze.start.x === 0) startCell.removeWall("W");
    if (maze.start.y === 0) startCell.removeWall("N");
  }
  if (maze.finish) {
    const finishCell = maze.getCell(maze.finish.x, maze.finish.y);
    if (maze.finish.x === maze.width - 1) finishCell.removeWall("E");
    if (maze.finish.y === maze.height - 1) finishCell.removeWall("S");
  }
}