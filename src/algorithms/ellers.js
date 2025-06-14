// src/algorithms/ellers.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Eller's Maze Generation Algorithm
 * 
 * FIXED:
 * - Enhanced input validation and error handling
 * - Improved set management with null checking
 * - Better vertical connection validation
 * - Robust boundary wall handling
 * - Comprehensive algorithm state tracking
 * 
 * Generates maze row by row, maintaining sets to ensure connectivity.
 * Efficient for very wide mazes. Produces some cycles, avoids bias.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateEller(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Eller\'s: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Eller\'s: Width and height must be at least 2');
  }
  if (width > 1000) {
    throw new Error('Eller\'s: Width too large (max 1000) - algorithm may be slow');
  }
  if (height > 500) {
    throw new Error('Eller\'s: Height too large (max 500)');
  }

  console.log(`Generating Eller's maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Eller's: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // ENHANCED: Set management with validation
    let currentRowSets = Array(width).fill(0);
    let nextSetId = 1;
    let totalSetsCreated = 0;

    /**
     * ENHANCED: Safe set operations with validation
     */
    function validateSets(rowSets, rowIndex) {
      for (let i = 0; i < rowSets.length; i++) {
        if (!Number.isInteger(rowSets[i]) || rowSets[i] < 0) {
          throw new Error(`Eller's: Invalid set ID ${rowSets[i]} at row ${rowIndex}, column ${i}`);
        }
      }
    }

    /**
     * Merge sets safely
     */
    function mergeSets(rowSets, fromSet, toSet) {
      if (fromSet === toSet) return;
      
      let mergedCells = 0;
      for (let i = 0; i < rowSets.length; i++) {
        if (rowSets[i] === fromSet) {
          rowSets[i] = toSet;
          mergedCells++;
        }
      }
      return mergedCells;
    }

    /**
     * Get all cells belonging to a specific set
     */
    function getCellsInSet(rowSets, setId) {
      const cells = [];
      for (let i = 0; i < rowSets.length; i++) {
        if (rowSets[i] === setId) {
          cells.push(i);
        }
      }
      return cells;
    }

    console.log('Eller\'s: Starting row-by-row generation...');

    // Process each row
    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
      console.log(`Eller's: Processing row ${rowIndex + 1}/${height}`);

      // 1. ENHANCED: Assign sets to each cell in current row
      for (let x = 0; x < width; x++) {
        if (currentRowSets[x] === 0) {
          currentRowSets[x] = nextSetId++;
          totalSetsCreated++;
        }
      }

      // Validate current row sets
      validateSets(currentRowSets, rowIndex);

      // 2. ENHANCED: Carve east walls (merge sets with validation)
      let eastConnections = 0;
      for (let x = 0; x < width - 1; x++) {
        const shouldMerge = Math.random() < 0.5 || rowIndex === height - 1; // Always merge in last row
        
        if (currentRowSets[x] !== currentRowSets[x + 1] && shouldMerge) {
          // ENHANCED: Safe cell access for wall removal
          const currentCell = maze.getCell(x, rowIndex);
          const eastCell = maze.getCell(x + 1, rowIndex);
          
          if (!currentCell || !eastCell) {
            console.warn(`Eller's: Missing cells for east connection at (${x}, ${rowIndex})`);
            continue;
          }
          
          // Remove east wall
          currentCell.removeWall("E");
          eastCell.removeWall("W");
          eastConnections++;
          
          // Merge sets
          const fromSet = currentRowSets[x + 1];
          const toSet = currentRowSets[x];
          const mergedCount = mergeSets(currentRowSets, fromSet, toSet);
          
          if (mergedCount === 0) {
            console.warn(`Eller's: Set merge failed at row ${rowIndex}, column ${x}`);
          }
        }
      }

      console.log(`Eller's: Row ${rowIndex}: ${eastConnections} east connections`);

      // Skip vertical connections for the last row
      if (rowIndex === height - 1) {
        console.log('Eller\'s: Last row completed');
        break;
      }

      // 3. ENHANCED: Carve vertical connections with validation
      const verticalConnections = new Map(); // Track which sets have vertical connections
      let totalVerticalConnections = 0;

      // First pass: random vertical connections
      for (let x = 0; x < width; x++) {
        const shouldCarveDown = Math.random() < 0.5;
        
        if (shouldCarveDown) {
          const currentCell = maze.getCell(x, rowIndex);
          const southCell = maze.getCell(x, rowIndex + 1);
          
          if (!currentCell || !southCell) {
            console.warn(`Eller's: Missing cells for vertical connection at (${x}, ${rowIndex})`);
            continue;
          }
          
          currentCell.removeWall("S");
          southCell.removeWall("N");
          
          const setId = currentRowSets[x];
          verticalConnections.set(setId, (verticalConnections.get(setId) || 0) + 1);
          totalVerticalConnections++;
        }
      }

      // ENHANCED: Ensure every set has at least one vertical connection
      const uniqueSets = [...new Set(currentRowSets)];
      let forcedConnections = 0;
      
      for (const setId of uniqueSets) {
        if (!verticalConnections.has(setId) || verticalConnections.get(setId) === 0) {
          // This set needs a forced vertical connection
          const cellsInSet = getCellsInSet(currentRowSets, setId);
          
          if (cellsInSet.length === 0) {
            console.warn(`Eller's: No cells found for set ${setId}`);
            continue;
          }
          
          // Pick a random cell from this set
          const randomIndex = cellsInSet[Math.floor(Math.random() * cellsInSet.length)];
          
          const currentCell = maze.getCell(randomIndex, rowIndex);
          const southCell = maze.getCell(randomIndex, rowIndex + 1);
          
          if (currentCell && southCell) {
            currentCell.removeWall("S");
            southCell.removeWall("N");
            forcedConnections++;
            totalVerticalConnections++;
          }
        }
      }

      console.log(`Eller's: Row ${rowIndex}: ${totalVerticalConnections} vertical connections (${forcedConnections} forced)`);

      // 4. ENHANCED: Prepare sets for next row
      const nextRowSets = Array(width).fill(0);
      let inheritedCells = 0;
      
      for (let x = 0; x < width; x++) {
        // Check if this cell has a connection to the row below
        const currentCell = maze.getCell(x, rowIndex);
        if (currentCell && !currentCell.hasWall("S")) {
          nextRowSets[x] = currentRowSets[x];
          inheritedCells++;
        }
        // Otherwise, the cell gets a new set ID (assigned in next iteration)
      }

      console.log(`Eller's: ${inheritedCells} cells inherited sets for next row`);
      
      currentRowSets = nextRowSets;
    }

    console.log(`Eller's: Algorithm completed. Total sets created: ${totalSetsCreated}`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Eller\'s: Generated maze is invalid');
    }

    console.log('Eller\'s: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Eller\'s maze generation failed:', error);
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
    console.warn('Eller\'s: Failed to ensure boundary walls:', error);
  }
}