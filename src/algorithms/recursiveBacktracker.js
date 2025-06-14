// src/algorithms/recursiveBacktracker.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Recursive Backtracker Maze Generation Algorithm
 * 
 * FIXED:
 * - Enhanced stack management with overflow protection
 * - Improved null checking and error handling
 * - Better neighbor validation and selection
 * - Robust boundary wall management
 * - Comprehensive algorithm state tracking and debugging
 * 
 * Classic depth-first search maze generation. Creates mazes with long,
 * winding corridors and relatively few dead ends. One of the most
 * popular and reliable maze generation algorithms.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateRecursiveBacktracker(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Recursive Backtracker: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Recursive Backtracker: Width and height must be at least 2');
  }
  if (width > 400 || height > 400) {
    throw new Error('Recursive Backtracker: Dimensions too large (max 400x400) - risk of stack overflow');
  }

  console.log(`Generating Recursive Backtracker maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Recursive Backtracker: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // Track visited cells and algorithm state
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const stack = [];
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
        throw new Error('Recursive Backtracker: shuffle() requires an array');
      }
      const shuffled = [...arr]; // Create copy to avoid modifying original
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    /**
     * ENHANCED: Get unvisited neighbors with comprehensive validation
     */
    function getUnvisitedNeighbors(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        console.warn(`Recursive Backtracker: Invalid coordinates (${x}, ${y})`);
        return [];
      }

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
              console.warn(`Recursive Backtracker: Missing neighbor cell at (${nx}, ${ny})`);
            }
          }
        }
      }
      
      return neighbors;
    }

    // ENHANCED: Start position with validation
    let currentX = maze.start?.x ?? Math.floor(Math.random() * width);
    let currentY = maze.start?.y ?? Math.floor(Math.random() * height);
    
    if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) {
      console.warn('Recursive Backtracker: Invalid start position, using (0,0)');
      currentX = 0;
      currentY = 0;
    }

    // Mark starting cell as visited
    visited[currentY][currentX] = true;
    console.log(`Recursive Backtracker: Starting at (${currentX}, ${currentY})`);

    // Algorithm state tracking
    let iterations = 0;
    let connectionsCarved = 0;
    let backtrackSteps = 0;
    let maxStackDepth = 0;
    const maxIterations = totalCells * 10; // Safety limit to prevent infinite loops

    // Main algorithm loop
    while (totalVisited < totalCells && iterations < maxIterations) {
      iterations++;
      
      // Track maximum stack depth for debugging
      if (stack.length > maxStackDepth) {
        maxStackDepth = stack.length;
      }
      
      // ENHANCED: Get unvisited neighbors with validation
      const unvisitedNeighbors = getUnvisitedNeighbors(currentX, currentY);
      
      if (unvisitedNeighbors.length > 0) {
        // MOVE FORWARD: Choose random unvisited neighbor
        const shuffledNeighbors = shuffle(unvisitedNeighbors);
        const chosen = shuffledNeighbors[0];
        
        // ENHANCED: Safe cell access
        const currentCell = maze.getCell(currentX, currentY);
        const neighborCell = maze.getCell(chosen.nx, chosen.ny);
        
        if (!currentCell || !neighborCell) {
          console.warn(`Recursive Backtracker: Missing cells during forward move: (${currentX},${currentY}) -> (${chosen.nx},${chosen.ny})`);
          // Try to continue with another neighbor
          if (shuffledNeighbors.length > 1) {
            const alternative = shuffledNeighbors[1];
            const altCurrentCell = maze.getCell(currentX, currentY);
            const altNeighborCell = maze.getCell(alternative.nx, alternative.ny);
            if (altCurrentCell && altNeighborCell) {
              chosen.dir = alternative.dir;
              chosen.nx = alternative.nx;
              chosen.ny = alternative.ny;
            } else {
              // Fall back to backtracking
              if (stack.length > 0) {
                const prev = stack.pop();
                currentX = prev.x;
                currentY = prev.y;
                backtrackSteps++;
              }
              continue;
            }
          } else {
            // No alternatives, fall back to backtracking
            if (stack.length > 0) {
              const prev = stack.pop();
              currentX = prev.x;
              currentY = prev.y;
              backtrackSteps++;
            }
            continue;
          }
        }
        
        // Push current position to stack
        stack.push({ x: currentX, y: currentY });
        
        // Carve passage between current cell and chosen neighbor
        currentCell.removeWall(chosen.dir);
        neighborCell.removeWall(opposite[chosen.dir]);
        connectionsCarved++;
        
        // Move to chosen neighbor
        currentX = chosen.nx;
        currentY = chosen.ny;
        visited[currentY][currentX] = true;
        totalVisited++;
        
        // Progress logging
        if (totalVisited % Math.ceil(totalCells / 10) === 0) {
          console.log(`Recursive Backtracker: ${totalVisited}/${totalCells} cells visited (stack depth: ${stack.length})`);
        }
        
      } else {
        // BACKTRACK: No unvisited neighbors, go back
        if (stack.length > 0) {
          const prev = stack.pop();
          currentX = prev.x;
          currentY = prev.y;
          backtrackSteps++;
        } else {
          // Stack is empty but we haven't visited all cells
          console.warn(`Recursive Backtracker: Stack empty with ${totalVisited}/${totalCells} cells visited`);
          
          // Emergency: find any unvisited cell
          let emergencyFound = false;
          for (let y = 0; y < height && !emergencyFound; y++) {
            for (let x = 0; x < width && !emergencyFound; x++) {
              if (!visited[y][x]) {
                console.warn(`Recursive Backtracker: Emergency jump to unvisited cell (${x}, ${y})`);
                currentX = x;
                currentY = y;
                visited[currentY][currentX] = true;
                totalVisited++;
                emergencyFound = true;
              }
            }
          }
          
          if (!emergencyFound) {
            break; // All cells visited
          }
        }
      }
      
      // Safety check for infinite loops
      if (iterations % 1000 === 0) {
        console.log(`Recursive Backtracker: Iteration ${iterations}, visited: ${totalVisited}/${totalCells}, stack: ${stack.length}`);
      }
    }

    // Safety check
    if (iterations >= maxIterations) {
      console.warn('Recursive Backtracker: Algorithm reached maximum iterations');
    }

    console.log(`Recursive Backtracker: Completed in ${iterations} iterations`);
    console.log(`  - ${connectionsCarved} connections carved`);
    console.log(`  - ${backtrackSteps} backtrack steps`);
    console.log(`  - Maximum stack depth: ${maxStackDepth}`);
    console.log(`  - Final cells visited: ${totalVisited}/${totalCells}`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Recursive Backtracker: Generated maze is invalid');
    }

    console.log('Recursive Backtracker: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Recursive Backtracker maze generation failed:', error);
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
    console.warn('Recursive Backtracker: Failed to ensure boundary walls:', error);
  }
}