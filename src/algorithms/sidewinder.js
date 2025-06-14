// src/algorithms/sidewinder.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Sidewinder Maze Generation Algorithm
 * 
 * FIXED:
 * - Enhanced run management with validation
 * - Improved null checking and error handling
 * - Better random decision making and run termination
 * - Robust boundary wall management
 * - Comprehensive algorithm state tracking
 * 
 * Works row by row, building "runs" of cells connected eastward,
 * then randomly connecting one cell from each run northward.
 * Creates mazes with horizontal bias and interesting texture.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateSidewinder(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Sidewinder: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Sidewinder: Width and height must be at least 2');
  }
  if (width > 500 || height > 500) {
    throw new Error('Sidewinder: Dimensions too large (max 500x500)');
  }

  console.log(`Generating Sidewinder maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Sidewinder: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // Algorithm statistics
    let totalRuns = 0;
    let totalEastConnections = 0;
    let totalNorthConnections = 0;
    let averageRunLength = 0;

    /**
     * ENHANCED: Run management with validation
     */
    class SidewinderRun {
      constructor(y) {
        if (!Number.isInteger(y) || y < 0) {
          throw new Error('SidewinderRun: Invalid row number');
        }
        this.y = y;
        this.cells = [];
        this.startX = -1;
        this.endX = -1;
      }

      addCell(x) {
        if (!Number.isInteger(x) || x < 0) {
          throw new Error('SidewinderRun: Invalid cell x coordinate');
        }
        
        this.cells.push(x);
        
        if (this.startX === -1) {
          this.startX = x;
        }
        this.endX = x;
      }

      getRandomCell() {
        if (this.cells.length === 0) {
          throw new Error('SidewinderRun: Cannot get random cell from empty run');
        }
        return this.cells[Math.floor(Math.random() * this.cells.length)];
      }

      getLength() {
        return this.cells.length;
      }

      isEmpty() {
        return this.cells.length === 0;
      }

      validate(width) {
        if (this.cells.length === 0) return false;
        if (this.startX < 0 || this.endX >= width) return false;
        if (this.startX > this.endX) return false;
        
        // Validate all cells are sequential
        for (let i = 0; i < this.cells.length - 1; i++) {
          if (this.cells[i + 1] !== this.cells[i] + 1) {
            return false;
          }
        }
        return true;
      }
    }

    console.log('Sidewinder: Processing rows...');

    // Process each row (starting from the top row)
    for (let y = 0; y < height; y++) {
      console.log(`Sidewinder: Processing row ${y + 1}/${height}`);
      
      let currentRun = new SidewinderRun(y);
      let runsInThisRow = 0;
      let eastConnectionsInRow = 0;
      let northConnectionsInRow = 0;

      // Process each cell in the current row
      for (let x = 0; x < width; x++) {
        // Add current cell to the run
        currentRun.addCell(x);

        // ENHANCED: Decision making for run continuation
        let shouldCarveEast = false;
        let shouldEndRun = false;

        if (x === width - 1) {
          // Last column: must end run (can't carve east)
          shouldEndRun = true;
        } else if (y === 0) {
          // Top row: always carve east (can't carve north)
          shouldCarveEast = true;
        } else {
          // Middle rows: random decision
          // Bias towards longer runs by using probability < 0.5
          const continueRunProbability = 0.6; // Favor horizontal runs
          shouldCarveEast = Math.random() < continueRunProbability;
          shouldEndRun = !shouldCarveEast;
        }

        // ENHANCED: Carve east connection if decided
        if (shouldCarveEast && x < width - 1) {
          const currentCell = maze.getCell(x, y);
          const eastCell = maze.getCell(x + 1, y);
          
          if (!currentCell || !eastCell) {
            console.warn(`Sidewinder: Missing cells for east connection at (${x}, ${y})`);
          } else {
            currentCell.removeWall("E");
            eastCell.removeWall("W");
            totalEastConnections++;
            eastConnectionsInRow++;
          }
        }

        // ENHANCED: End run and carve north connection if decided
        if (shouldEndRun) {
          if (!currentRun.isEmpty() && currentRun.validate(width)) {
            runsInThisRow++;
            totalRuns++;
            
            // For rows other than the top row, carve a north connection
            if (y > 0) {
              try {
                const randomX = currentRun.getRandomCell();
                
                const southCell = maze.getCell(randomX, y);
                const northCell = maze.getCell(randomX, y - 1);
                
                if (!southCell || !northCell) {
                  console.warn(`Sidewinder: Missing cells for north connection at (${randomX}, ${y})`);
                } else {
                  southCell.removeWall("N");
                  northCell.removeWall("S");
                  totalNorthConnections++;
                  northConnectionsInRow++;
                }
              } catch (error) {
                console.warn(`Sidewinder: Failed to carve north connection: ${error.message}`);
              }
            }
          }
          
          // Start a new run for the next iteration
          currentRun = new SidewinderRun(y);
        }
      }

      console.log(`Sidewinder: Row ${y}: ${runsInThisRow} runs, ${eastConnectionsInRow} east, ${northConnectionsInRow} north connections`);
    }

    // Calculate statistics
    if (totalRuns > 0) {
      // Approximate average run length
      averageRunLength = totalEastConnections / totalRuns + 1; // +1 because runs have one more cell than east connections
    }

    console.log(`Sidewinder: Algorithm completed:`);
    console.log(`  - Total runs: ${totalRuns}`);
    console.log(`  - East connections: ${totalEastConnections}`);
    console.log(`  - North connections: ${totalNorthConnections}`);
    console.log(`  - Average run length: ${averageRunLength.toFixed(2)} cells`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Sidewinder: Generated maze is invalid');
    }

    // Validate expected connection counts
    const expectedMinConnections = width * (height - 1) + (width - 1) * height - (width - 1) - (height - 1);
    const actualConnections = totalEastConnections + totalNorthConnections;
    
    if (actualConnections < expectedMinConnections * 0.5) {
      console.warn(`Sidewinder: Fewer connections than expected (${actualConnections} vs ~${expectedMinConnections})`);
    }

    console.log('Sidewinder: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Sidewinder maze generation failed:', error);
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
    console.warn('Sidewinder: Failed to ensure boundary walls:', error);
  }
}