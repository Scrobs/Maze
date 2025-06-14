// src/algorithms/aldousBroder.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Aldous-Broder Maze Generation Algorithm
 * 
 * FIXED:
 * - Added comprehensive null checking
 * - Enhanced boundary wall handling
 * - Improved error handling and validation
 * - Better random walk safety measures
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
  // Input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Width and height must be at least 2');
  }
  if (width > 200 || height > 200) {
    throw new Error('Aldous-Broder algorithm: dimensions too large (max 200x200)');
  }

  const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

  try {
    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // Initialize visited tracking
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    let totalVisited = 1;
    const totalCells = width * height;

    // Start at random position
    let currentX = Math.floor(Math.random() * width);
    let currentY = Math.floor(Math.random() * height);
    visited[currentY][currentX] = true;

    console.log(`Aldous-Broder: Starting at (${currentX}, ${currentY})`);

    // Direction helpers
    const deltas = {
      N: [0, -1],
      E: [1, 0],
      S: [0, 1],
      W: [-1, 0]
    };
    const opposite = { N: "S", E: "W", S: "N", W: "E" };

    /**
     * ENHANCED: Get valid directions with null checking
     */
    function getValidDirections(x, y) {
      const validDirs = [];
      for (const dir in deltas) {
        const [dx, dy] = deltas[dir];
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborCell = maze.getCell(nx, ny);
          if (neighborCell) {  // NULL CHECK
            validDirs.push({ dir, nx, ny });
          }
        }
      }
      return validDirs;
    }

    // Safety counter to prevent infinite loops
    let walkSteps = 0;
    const maxWalkSteps = totalCells * totalCells; // Very generous limit

    // Main Aldous-Broder random walk
    while (totalVisited < totalCells && walkSteps < maxWalkSteps) {
      walkSteps++;

      // Get all valid neighbors from current position
      const possibleMoves = getValidDirections(currentX, currentY);
      
      if (possibleMoves.length === 0) {
        throw new Error(`Aldous-Broder: No valid moves from (${currentX}, ${currentY})`);
      }

      // Pick random direction
      const { dir, nx, ny } = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      
      // ENHANCED: Null checking for cells
      const currentCell = maze.getCell(currentX, currentY);
      const neighborCell = maze.getCell(nx, ny);
      
      if (!currentCell || !neighborCell) {
        console.warn(`Aldous-Broder: Invalid cells at (${currentX},${currentY}) -> (${nx},${ny})`);
        continue;
      }

      // If neighbor hasn't been visited, carve passage and mark as visited
      if (!visited[ny][nx]) {
        // Remove walls between current cell and neighbor
        currentCell.removeWall(dir);
        neighborCell.removeWall(opposite[dir]);
        
        // Mark neighbor as visited
        visited[ny][nx] = true;
        totalVisited++;
        
        if (totalVisited % Math.ceil(totalCells / 10) === 0) {
          console.log(`Aldous-Broder: ${totalVisited}/${totalCells} cells visited`);
        }
      }
      
      // Move to neighbor (whether it was visited or not)
      currentX = nx;
      currentY = ny;
    }

    // Safety check
    if (walkSteps >= maxWalkSteps) {
      throw new Error('Aldous-Broder: Walk exceeded maximum steps, possible infinite loop');
    }

    if (totalVisited < totalCells) {
      throw new Error(`Aldous-Broder: Only visited ${totalVisited}/${totalCells} cells`);
    }

    console.log(`Aldous-Broder: Completed in ${walkSteps} steps`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Aldous-Broder: Generated maze is invalid');
    }

    return maze;

  } catch (error) {
    console.error('Aldous-Broder generation failed:', error);
    throw error;
  }
}

/**
 * ENHANCED: Ensure all boundary walls are present except for entrance/exit
 */
function ensureBoundaryWalls(maze) {
  const width = maze.width;
  const height = maze.height;

  try {
    // Top boundary
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, 0);
      if (cell) cell.addWall("N");
    }
    
    // Bottom boundary  
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, height - 1);
      if (cell) cell.addWall("S");
    }
    
    // Left boundary
    for (let y = 0; y < height; y++) {
      const cell = maze.getCell(0, y);
      if (cell) cell.addWall("W");
    }
    
    // Right boundary
    for (let y = 0; y < height; y++) {
      const cell = maze.getCell(width - 1, y);
      if (cell) cell.addWall("E");
    }
    
    // Open entrance and exit
    if (maze.start) {
      const startCell = maze.getCell(maze.start.x, maze.start.y);
      if (startCell) {
        if (maze.start.x === 0) startCell.removeWall("W");
        if (maze.start.y === 0) startCell.removeWall("N");
        if (maze.start.x === width - 1) startCell.removeWall("E");
        if (maze.start.y === height - 1) startCell.removeWall("S");
      }
    }
    
    if (maze.finish) {
      const finishCell = maze.getCell(maze.finish.x, maze.finish.y);
      if (finishCell) {
        if (maze.finish.x === 0) finishCell.removeWall("W");
        if (maze.finish.y === 0) finishCell.removeWall("N");
        if (maze.finish.x === width - 1) finishCell.removeWall("E");
        if (maze.finish.y === height - 1) finishCell.removeWall("S");
      }
    }
  } catch (error) {
    console.warn('Failed to ensure boundary walls:', error);
  }
}