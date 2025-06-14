// src/algorithms/prims.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Prim's Maze Generation Algorithm
 * 
 * FIXED:
 * - Enhanced frontier management with validation
 * - Improved null checking and error handling
 * - Better random selection and deduplication
 * - Robust boundary wall management
 * - Comprehensive algorithm state tracking
 * 
 * Grows maze from a single starting cell by maintaining a frontier
 * of walls to potentially remove. Creates mazes with short, twisty
 * passages and many small dead ends.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generatePrims(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Prim\'s: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Prim\'s: Width and height must be at least 2');
  }
  if (width > 300 || height > 300) {
    throw new Error('Prim\'s: Dimensions too large (max 300x300)');
  }

  console.log(`Generating Prim's maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Prim's: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // Track visited cells and frontier walls
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const frontierWalls = new Set(); // Use Set for automatic deduplication
    let totalVisited = 1;
    const totalCells = width * height;

    // Direction helpers
    const directions = {
      N: [0, -1],
      E: [1, 0],
      S: [0, 1],
      W: [-1, 0]
    };
    const opposite = { N: "S", E: "W", S: "N", W: "E" };

    /**
     * ENHANCED: Frontier wall representation with validation
     */
    class FrontierWall {
      constructor(x, y, direction, toX, toY) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || 
            !Number.isInteger(toX) || !Number.isInteger(toY)) {
          throw new Error('FrontierWall: Coordinates must be integers');
        }
        if (!directions.hasOwnProperty(direction)) {
          throw new Error(`FrontierWall: Invalid direction ${direction}`);
        }
        
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.toX = toX;
        this.toY = toY;
        this.key = `${x},${y},${direction}`;
      }

      isValid(width, height) {
        return this.x >= 0 && this.x < width && 
               this.y >= 0 && this.y < height &&
               this.toX >= 0 && this.toX < width &&
               this.toY >= 0 && this.toY < height;
      }
    }

    /**
     * ENHANCED: Add frontier walls with validation and deduplication
     */
    function addFrontierWalls(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        console.warn(`Prim's: Invalid coordinates for frontier (${x}, ${y})`);
        return;
      }

      let addedWalls = 0;
      
      for (const [dir, [dx, dy]] of Object.entries(directions)) {
        const toX = x + dx;
        const toY = y + dy;
        
        // Check bounds
        if (toX >= 0 && toX < width && toY >= 0 && toY < height) {
          // Only add if target cell is unvisited
          if (!visited[toY][toX]) {
            try {
              const frontierWall = new FrontierWall(x, y, dir, toX, toY);
              if (!frontierWalls.has(frontierWall.key)) {
                frontierWalls.add(frontierWall.key);
                addedWalls++;
              }
            } catch (error) {
              console.warn(`Prim's: Failed to create frontier wall: ${error.message}`);
            }
          }
        }
      }
      
      return addedWalls;
    }

    /**
     * ENHANCED: Parse frontier wall key back to object
     */
    function parseFrontierWall(key) {
      const parts = key.split(',');
      if (parts.length !== 3) {
        throw new Error(`Prim's: Invalid frontier wall key ${key}`);
      }
      
      const [x, y, direction] = parts;
      const [dx, dy] = directions[direction];
      
      return new FrontierWall(
        parseInt(x, 10),
        parseInt(y, 10),
        direction,
        parseInt(x, 10) + dx,
        parseInt(y, 10) + dy
      );
    }

    // ENHANCED: Start position with validation
    let startX = maze.start?.x ?? Math.floor(Math.random() * width);
    let startY = maze.start?.y ?? Math.floor(Math.random() * height);
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      console.warn('Prim\'s: Invalid start position, using random');
      startX = Math.floor(Math.random() * width);
      startY = Math.floor(Math.random() * height);
    }

    // Mark starting cell as visited and add its frontier walls
    visited[startY][startX] = true;
    const initialFrontierWalls = addFrontierWalls(startX, startY);
    
    console.log(`Prim's: Starting at (${startX}, ${startY}), initial frontier: ${initialFrontierWalls} walls`);

    let iterationCount = 0;
    let connectionsAdded = 0;
    const maxIterations = totalCells * 2; // Safety limit

    // Main Prim's algorithm loop
    while (frontierWalls.size > 0 && totalVisited < totalCells && iterationCount < maxIterations) {
      iterationCount++;
      
      // ENHANCED: Random frontier wall selection
      const wallKeys = Array.from(frontierWalls);
      const randomKey = wallKeys[Math.floor(Math.random() * wallKeys.length)];
      
      let frontierWall;
      try {
        frontierWall = parseFrontierWall(randomKey);
      } catch (error) {
        console.warn(`Prim's: Failed to parse frontier wall ${randomKey}: ${error.message}`);
        frontierWalls.delete(randomKey);
        continue;
      }
      
      // Remove from frontier
      frontierWalls.delete(randomKey);
      
      // Validate wall is still valid
      if (!frontierWall.isValid(width, height)) {
        console.warn(`Prim's: Invalid frontier wall: ${frontierWall.key}`);
        continue;
      }
      
      // Check if target cell is still unvisited
      if (visited[frontierWall.toY][frontierWall.toX]) {
        continue; // Target already visited, skip this wall
      }
      
      // ENHANCED: Safe cell access
      const fromCell = maze.getCell(frontierWall.x, frontierWall.y);
      const toCell = maze.getCell(frontierWall.toX, frontierWall.toY);
      
      if (!fromCell || !toCell) {
        console.warn(`Prim's: Missing cells for wall ${frontierWall.key}`);
        continue;
      }
      
      // Remove wall between cells
      fromCell.removeWall(frontierWall.direction);
      toCell.removeWall(opposite[frontierWall.direction]);
      connectionsAdded++;
      
      // Mark target cell as visited
      visited[frontierWall.toY][frontierWall.toX] = true;
      totalVisited++;
      
      // Add new frontier walls from the newly visited cell
      const newFrontierWalls = addFrontierWalls(frontierWall.toX, frontierWall.toY);
      
      // Progress logging
      if (totalVisited % Math.ceil(totalCells / 10) === 0) {
        console.log(`Prim's: ${totalVisited}/${totalCells} cells visited, ${frontierWalls.size} frontier walls`);
      }
    }

    // Safety check
    if (iterationCount >= maxIterations) {
      console.warn('Prim\'s: Algorithm reached maximum iterations');
    }

    console.log(`Prim's: Completed in ${iterationCount} iterations, ${connectionsAdded} connections, ${totalVisited}/${totalCells} cells visited`);

    // Handle any remaining unvisited cells (shouldn't happen in correct implementation)
    if (totalVisited < totalCells) {
      console.warn(`Prim's: ${totalCells - totalVisited} cells remain unvisited`);
      
      // Emergency connection of remaining cells
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!visited[y][x]) {
            console.warn(`Prim's: Emergency visit to isolated cell (${x}, ${y})`);
            visited[y][x] = true;
            totalVisited++;
          }
        }
      }
    }

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Prim\'s: Generated maze is invalid');
    }

    console.log('Prim\'s: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Prim\'s maze generation failed:', error);
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
    console.warn('Prim\'s: Failed to ensure boundary walls:', error);
  }
}