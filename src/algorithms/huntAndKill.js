// src/algorithms/huntAndKill.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Hunt-and-Kill Maze Generation Algorithm
 *
 * FIXED:
 * - Enhanced input validation and error handling
 * - Improved null checking for all cell operations
 * - Better hunt phase optimization and validation
 * - Robust boundary wall handling
 * - Comprehensive algorithm state tracking and debugging
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
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Hunt-and-Kill: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Hunt-and-Kill: Width and height must be at least 2');
  }
  if (width > 300 || height > 300) {
    throw new Error('Hunt-and-Kill: Dimensions too large (max 300x300)');
  }

  console.log(`Generating Hunt-and-Kill maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Hunt-and-Kill: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // Track visited cells
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
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
     * ENHANCED: Shuffle array with validation
     */
    function shuffle(arr) {
      if (!Array.isArray(arr)) {
        throw new Error('Hunt-and-Kill: shuffle() requires an array');
      }
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    /**
     * ENHANCED: Get unvisited neighbors with comprehensive validation
     */
    function getUnvisitedNeighbors(x, y) {
      const neighbors = [];
      
      for (const [dir, [dx, dy]] of Object.entries(directions)) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Bounds check
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // Visited check
          if (!visited[ny][nx]) {
            // Cell existence check
            const neighborCell = maze.getCell(nx, ny);
            if (neighborCell) {
              neighbors.push({ dir, nx, ny });
            } else {
              console.warn(`Hunt-and-Kill: Missing neighbor cell at (${nx}, ${ny})`);
            }
          }
        }
      }
      
      return neighbors;
    }

    /**
     * ENHANCED: Get visited neighbors during hunt phase
     */
    function getVisitedNeighbors(x, y) {
      const neighbors = [];
      
      for (const [dir, [dx, dy]] of Object.entries(directions)) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Bounds check
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // Visited check
          if (visited[ny][nx]) {
            // Cell existence check
            const neighborCell = maze.getCell(nx, ny);
            if (neighborCell) {
              neighbors.push({ dir, nx, ny });
            } else {
              console.warn(`Hunt-and-Kill: Missing visited neighbor at (${nx}, ${ny})`);
            }
          }
        }
      }
      
      return neighbors;
    }

    // ENHANCED: Start position with validation
    let currentX = maze.start?.x ?? 0;
    let currentY = maze.start?.y ?? 0;
    
    if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) {
      console.warn('Hunt-and-Kill: Invalid start position, using (0,0)');
      currentX = 0;
      currentY = 0;
    }
    
    visited[currentY][currentX] = true;
    console.log(`Hunt-and-Kill: Starting at (${currentX}, ${currentY})`);

    let killPhases = 0;
    let huntPhases = 0;
    let totalConnections = 0;

    // Main Hunt-and-Kill loop
    while (totalVisited < totalCells) {
      // "KILL" PHASE: Random walk until dead end
      let killSteps = 0;
      const maxKillSteps = totalCells; // Prevent infinite loops in kill phase
      
      while (killSteps < maxKillSteps) {
        killSteps++;
        
        // ENHANCED: Get unvisited neighbors with validation
        const unvisitedNeighbors = getUnvisitedNeighbors(currentX, currentY);
        
        if (unvisitedNeighbors.length > 0) {
          // Pick random neighbor and carve passage
          const { dir, nx, ny } = shuffle(unvisitedNeighbors)[0];
          
          // ENHANCED: Safe cell access
          const currentCell = maze.getCell(currentX, currentY);
          const neighborCell = maze.getCell(nx, ny);
          
          if (!currentCell || !neighborCell) {
            console.warn(`Hunt-and-Kill: Invalid cells during kill phase: (${currentX},${currentY}) -> (${nx},${ny})`);
            break;
          }
          
          // Carve passage
          currentCell.removeWall(dir);
          neighborCell.removeWall(opposite[dir]);
          totalConnections++;
          
          // Move to neighbor
          currentX = nx;
          currentY = ny;
          visited[currentY][currentX] = true;
          totalVisited++;
          
          if (totalVisited % Math.ceil(totalCells / 10) === 0) {
            console.log(`Hunt-and-Kill: ${totalVisited}/${totalCells} cells visited`);
          }
        } else {
          // Dead end reached, exit kill phase
          break;
        }
      }
      
      killPhases++;
      
      if (killSteps >= maxKillSteps) {
        console.warn('Hunt-and-Kill: Kill phase exceeded maximum steps');
      }

      // "HUNT" PHASE: Find next unvisited cell with a visited neighbor
      let huntFound = false;
      huntPhases++;
      
      // ENHANCED: Optimized hunt with early termination
      huntLoop: for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!visited[y][x]) {
            // ENHANCED: Find visited neighbors with validation
            const visitedNeighbors = getVisitedNeighbors(x, y);
            
            if (visitedNeighbors.length > 0) {
              // Found a huntable cell - pick random visited neighbor to connect to
              const { dir, nx, ny } = shuffle(visitedNeighbors)[0];
              
              // ENHANCED: Safe cell access
              const huntCell = maze.getCell(x, y);
              const visitedCell = maze.getCell(nx, ny);
              
              if (!huntCell || !visitedCell) {
                console.warn(`Hunt-and-Kill: Invalid cells during hunt phase: (${x},${y}) -> (${nx},${ny})`);
                continue;
              }
              
              // Connect to visited neighbor
              huntCell.removeWall(dir);
              visitedCell.removeWall(opposite[dir]);
              totalConnections++;
              
              // Set new current position and mark as visited
              currentX = x;
              currentY = y;
              visited[currentY][currentX] = true;
              totalVisited++;
              huntFound = true;
              
              break huntLoop;
            }
          }
        }
      }
      
      if (!huntFound && totalVisited < totalCells) {
        // This shouldn't happen in a correct implementation
        console.error(`Hunt-and-Kill: Hunt phase failed with ${totalVisited}/${totalCells} cells visited`);
        
        // Emergency: find any unvisited cell
        let emergencyFound = false;
        for (let y = 0; y < height && !emergencyFound; y++) {
          for (let x = 0; x < width && !emergencyFound; x++) {
            if (!visited[y][x]) {
              console.warn(`Hunt-and-Kill: Emergency visit to isolated cell (${x}, ${y})`);
              visited[y][x] = true;
              totalVisited++;
              currentX = x;
              currentY = y;
              emergencyFound = true;
            }
          }
        }
        
        if (!emergencyFound) {
          break; // All cells should be visited
        }
      }
    }

    console.log(`Hunt-and-Kill: Completed with ${killPhases} kill phases, ${huntPhases} hunt phases, ${totalConnections} connections`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Hunt-and-Kill: Generated maze is invalid');
    }

    console.log('Hunt-and-Kill: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Hunt-and-Kill maze generation failed:', error);
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
    console.warn('Hunt-and-Kill: Failed to ensure boundary walls:', error);
  }
}