// src/algorithms/binaryTree.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Binary Tree Maze Generation Algorithm
 * 
 * FIXED:
 * - Added comprehensive input validation
 * - Enhanced null checking and error handling
 * - Improved boundary wall management
 * - Better algorithm state validation
 * 
 * Creates very straightforward mazes with a strong diagonal bias.
 * Each cell connects to either its north or east neighbor (if available).
 * Produces "easy" mazes ideal for beginners.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateBinaryTree(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Binary Tree: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Binary Tree: Width and height must be at least 2');
  }
  if (width > 500 || height > 500) {
    throw new Error('Binary Tree: Dimensions too large (max 500x500)');
  }

  console.log(`Generating Binary Tree maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Binary Tree: Failed to create cell at (${x}, ${y})`);
        }
        // Add all four walls initially
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    console.log('Binary Tree: Initial walls set, beginning carving...');

    // Carving statistics for validation
    let carvedConnections = 0;
    let processedCells = 0;

    // ENHANCED: Carve passages with comprehensive checking
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        processedCells++;
        
        const currentCell = maze.getCell(x, y);
        if (!currentCell) {
          throw new Error(`Binary Tree: Missing cell at (${x}, ${y})`);
        }

        // Determine available directions
        const canGoNorth = (y > 0);
        const canGoEast = (x < width - 1);
        
        // Skip if at top-right corner (no valid directions)
        if (!canGoNorth && !canGoEast) {
          continue;
        }

        // Choose direction based on availability
        let carveDirection;
        if (canGoNorth && canGoEast) {
          // Both directions available: choose randomly
          carveDirection = Math.random() < 0.5 ? "N" : "E";
        } else if (canGoNorth) {
          // Only north available
          carveDirection = "N";
        } else {
          // Only east available
          carveDirection = "E";
        }

        // ENHANCED: Carve passage with null checking
        if (carveDirection === "N") {
          const northNeighbor = maze.getCell(x, y - 1);
          if (!northNeighbor) {
            console.warn(`Binary Tree: Missing north neighbor at (${x}, ${y - 1})`);
            continue;
          }
          
          // Remove wall between current cell and north neighbor
          currentCell.removeWall("N");
          northNeighbor.removeWall("S");
          carvedConnections++;
          
        } else if (carveDirection === "E") {
          const eastNeighbor = maze.getCell(x + 1, y);
          if (!eastNeighbor) {
            console.warn(`Binary Tree: Missing east neighbor at (${x + 1}, ${y})`);
            continue;
          }
          
          // Remove wall between current cell and east neighbor
          currentCell.removeWall("E");
          eastNeighbor.removeWall("W");
          carvedConnections++;
        }
      }
    }

    console.log(`Binary Tree: Processed ${processedCells} cells, carved ${carvedConnections} connections`);

    // Validate carving results
    const expectedConnections = (width - 1) * height + width * (height - 1) - (width - 1) - (height - 1);
    if (carvedConnections < expectedConnections * 0.8) {
      console.warn(`Binary Tree: Fewer connections than expected (${carvedConnections} vs ~${expectedConnections})`);
    }

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Binary Tree: Generated maze is invalid');
    }

    console.log('Binary Tree: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Binary Tree generation failed:', error);
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
    // Top boundary - ensure all cells have north walls
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, 0);
      if (cell) {
        cell.addWall("N");
      } else {
        console.warn(`Binary Tree: Missing boundary cell at (${x}, 0)`);
      }
    }
    
    // Bottom boundary - ensure all cells have south walls
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, height - 1);
      if (cell) {
        cell.addWall("S");
      } else {
        console.warn(`Binary Tree: Missing boundary cell at (${x}, ${height - 1})`);
      }
    }
    
    // Left boundary - ensure all cells have west walls
    for (let y = 0; y < height; y++) {
      const cell = maze.getCell(0, y);
      if (cell) {
        cell.addWall("W");
      } else {
        console.warn(`Binary Tree: Missing boundary cell at (0, ${y})`);
      }
    }
    
    // Right boundary - ensure all cells have east walls
    for (let y = 0; y < height; y++) {
      const cell = maze.getCell(width - 1, y);
      if (cell) {
        cell.addWall("E");
      } else {
        console.warn(`Binary Tree: Missing boundary cell at (${width - 1}, ${y})`);
      }
    }
    
    // ENHANCED: Open entrance and exit with flexible positioning
    if (maze.start) {
      const startCell = maze.getCell(maze.start.x, maze.start.y);
      if (startCell) {
        // Open appropriate boundary wall based on start position
        if (maze.start.x === 0) startCell.removeWall("W");
        if (maze.start.y === 0) startCell.removeWall("N");
        if (maze.start.x === width - 1) startCell.removeWall("E");
        if (maze.start.y === height - 1) startCell.removeWall("S");
        console.log(`Binary Tree: Entrance opened at (${maze.start.x}, ${maze.start.y})`);
      } else {
        console.warn('Binary Tree: Could not open entrance - start cell not found');
      }
    }
    
    if (maze.finish) {
      const finishCell = maze.getCell(maze.finish.x, maze.finish.y);
      if (finishCell) {
        // Open appropriate boundary wall based on finish position
        if (maze.finish.x === 0) finishCell.removeWall("W");
        if (maze.finish.y === 0) finishCell.removeWall("N");
        if (maze.finish.x === width - 1) finishCell.removeWall("E");
        if (maze.finish.y === height - 1) finishCell.removeWall("S");
        console.log(`Binary Tree: Exit opened at (${maze.finish.x}, ${maze.finish.y})`);
      } else {
        console.warn('Binary Tree: Could not open exit - finish cell not found');
      }
    }

  } catch (error) {
    console.warn('Binary Tree: Failed to ensure boundary walls:', error);
  }
}