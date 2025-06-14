// src/algorithms/braided.js - FIXED VERSION

import { generateRecursiveBacktracker } from './recursiveBacktracker.js';
import { Maze } from '../model/maze.js';

/**
 * Braided Maze Generator (Post-Processed)
 * 
 * FIXED:
 * - Enhanced null checking and validation
 * - Improved dead-end detection and processing
 * - Better boundary wall handling
 * - More robust loop addition algorithm
 * - Comprehensive error handling
 * 
 * Starts with a perfect maze, then removes dead ends by adding loops.
 * 
 * @param {number} width
 * @param {number} height
 * @param {object} [options] - { braidness: float [0..1], baseAlgorithm: function }
 * @returns {Maze}
 */
export function generateBraided(width, height, options = {}) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Braided: Width and height must be integers');
  }
  if (width < 3 || height < 3) {
    throw new Error('Braided: Width and height must be at least 3 for meaningful braiding');
  }
  if (width > 300 || height > 300) {
    throw new Error('Braided: Dimensions too large (max 300x300)');
  }

  // Validate braidness parameter
  const braidness = typeof options.braidness === 'number' ? options.braidness : 0.5;
  if (braidness < 0 || braidness > 1) {
    throw new Error('Braided: braidness must be between 0 and 1');
  }

  const baseAlgorithm = options.baseAlgorithm || generateRecursiveBacktracker;

  console.log(`Generating Braided maze: ${width}x${height}, braidness: ${braidness}`);

  try {
    // 1. Generate initial perfect maze
    const maze = baseAlgorithm(width, height);
    if (!maze || !maze.isValid()) {
      throw new Error('Braided: Base algorithm failed to generate valid maze');
    }

    console.log('Braided: Base maze generated, beginning braiding process...');

    // 2. Helper to count open passages (with null checking)
    function countOpenings(x, y) {
      const cell = maze.getCell(x, y);
      if (!cell) {
        console.warn(`Braided: Missing cell at (${x}, ${y})`);
        return 0;
      }
      return ['N', 'E', 'S', 'W'].filter(d => !cell.hasWall(d)).length;
    }

    // 3. Enhanced dead-end detection and processing
    const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const opposite = { N: "S", E: "W", S: "N", W: "E" };
    
    let initialDeadEnds = 0;
    let deadEndsList = [];
    
    // First pass: identify all dead ends
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (countOpenings(x, y) === 1) {
          initialDeadEnds++;
          deadEndsList.push({ x, y });
        }
      }
    }
    
    console.log(`Braided: Found ${initialDeadEnds} initial dead ends`);
    
    if (initialDeadEnds === 0) {
      console.log('Braided: No dead ends found, returning original maze');
      ensureBoundaryWalls(maze);
      return maze;
    }
    
    // Shuffle dead ends list for random processing
    for (let i = deadEndsList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deadEndsList[i], deadEndsList[j]] = [deadEndsList[j], deadEndsList[i]];
    }
    
    const targetRemovals = Math.floor(initialDeadEnds * braidness);
    let actualRemovals = 0;
    let processedDeadEnds = 0;
    
    console.log(`Braided: Targeting ${targetRemovals} dead end removals`);
    
    // Process dead ends
    for (const { x, y } of deadEndsList) {
      if (actualRemovals >= targetRemovals) break;
      
      processedDeadEnds++;
      
      // ENHANCED: Re-check if still a dead end (important!)
      if (countOpenings(x, y) !== 1) {
        continue; // No longer a dead end
      }
      
      const cell = maze.getCell(x, y);
      if (!cell) {
        console.warn(`Braided: Missing cell during processing at (${x}, ${y})`);
        continue;
      }
      
      // Find walls that can be removed (have valid neighbors)
      const candidates = [];
      
      for (const dir in deltas) {
        if (!cell.hasWall(dir)) continue; // Already open
        
        const [dx, dy] = deltas[dir];
        const nx = x + dx, ny = y + dy;
        
        // ENHANCED: Comprehensive bounds and validity checking
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const neighbor = maze.getCell(nx, ny);
        if (!neighbor) {
          console.warn(`Braided: Missing neighbor at (${nx}, ${ny})`);
          continue;
        }
        
        // Only consider if both cells have the wall (symmetric wall state)
        if (neighbor.hasWall(opposite[dir])) {
          const neighborOpenings = countOpenings(nx, ny);
          candidates.push({ 
            dir, 
            nx, 
            ny, 
            neighborOpenings,
            priority: neighborOpenings // Prefer connecting to less-connected cells
          });
        }
      }
      
      if (candidates.length === 0) {
        continue; // No valid connections possible
      }
      
      // ENHANCED: Sort candidates by priority (prefer connecting to cells with fewer openings)
      candidates.sort((a, b) => a.priority - b.priority);
      
      // Pick the best candidate (or random from top candidates)
      const topCandidates = candidates.filter(c => c.priority === candidates[0].priority);
      const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      
      const { dir, nx, ny } = chosen;
      
      // Remove the wall
      cell.removeWall(dir);
      const neighbor = maze.getCell(nx, ny);
      if (neighbor) {
        neighbor.removeWall(opposite[dir]);
        actualRemovals++;
        
        if (actualRemovals % Math.ceil(targetRemovals / 5) === 0) {
          console.log(`Braided: Removed ${actualRemovals}/${targetRemovals} dead ends`);
        }
      }
    }

    console.log(`Braided: Processed ${processedDeadEnds} dead ends, removed ${actualRemovals} (${(actualRemovals/initialDeadEnds*100).toFixed(1)}%)`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Braided: Post-processed maze is invalid');
    }

    // Final statistics
    let finalDeadEnds = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (countOpenings(x, y) === 1) finalDeadEnds++;
      }
    }
    
    console.log(`Braided: Final dead ends: ${finalDeadEnds} (reduced from ${initialDeadEnds})`);
    
    return maze;

  } catch (error) {
    console.error('Braided maze generation failed:', error);
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
    console.warn('Braided: Failed to ensure boundary walls:', error);
  }
}