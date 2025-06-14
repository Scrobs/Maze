// src/algorithms/sparseLoop.js - FIXED VERSION

import { generateRecursiveBacktracker } from './recursiveBacktracker.js';
import { Maze } from '../model/maze.js';

/**
 * Sparse Loop Maze Generator (Post-Processed)
 * 
 * FIXED:
 * - Enhanced loop addition with validation and connectivity checking
 * - Improved null checking and error handling
 * - Better loop candidate selection and filtering
 * - Robust boundary wall management
 * - Comprehensive algorithm state tracking and statistics
 * 
 * Starts with a perfect maze, then adds a controlled number of loops
 * to create shortcuts without making the maze too easy.
 * 
 * @param {number} width
 * @param {number} height
 * @param {object} [options] - { loopiness: float [0..1], baseAlgorithm: function }
 * @returns {Maze}
 */
export function generateSparseLoop(width, height, options = {}) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Sparse Loop: Width and height must be integers');
  }
  if (width < 3 || height < 3) {
    throw new Error('Sparse Loop: Width and height must be at least 3 for meaningful loops');
  }
  if (width > 200 || height > 200) {
    throw new Error('Sparse Loop: Dimensions too large (max 200x200)');
  }

  // Validate loopiness parameter
  const loopiness = typeof options.loopiness === 'number' ? options.loopiness : 0.1;
  if (loopiness < 0 || loopiness > 1) {
    throw new Error('Sparse Loop: loopiness must be between 0 and 1');
  }

  const baseAlgorithm = options.baseAlgorithm || generateRecursiveBacktracker;

  console.log(`Generating Sparse Loop maze: ${width}x${height}, loopiness: ${loopiness}`);

  try {
    // 1. Generate initial perfect maze
    const maze = baseAlgorithm(width, height);
    if (!maze || !maze.isValid()) {
      throw new Error('Sparse Loop: Base algorithm failed to generate valid maze');
    }

    console.log('Sparse Loop: Base maze generated, analyzing structure...');

    // 2. ENHANCED: Analyze current maze structure
    const directions = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const opposite = { N: "S", E: "W", S: "N", W: "E" };

    /**
     * ENHANCED: Check if maze is connected using BFS
     */
    function isConnected() {
      if (!maze.start) {
        console.warn('Sparse Loop: No start position for connectivity check');
        return false;
      }

      const visited = Array.from({ length: height }, () => Array(width).fill(false));
      const queue = [{ x: maze.start.x, y: maze.start.y }];
      visited[maze.start.y][maze.start.x] = true;
      let visitedCount = 1;

      while (queue.length > 0) {
        const { x, y } = queue.shift();
        const cell = maze.getCell(x, y);
        if (!cell) continue;

        for (const [dir, [dx, dy]] of Object.entries(directions)) {
          if (!cell.hasWall(dir)) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
              visited[ny][nx] = true;
              visitedCount++;
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }

      return visitedCount === width * height;
    }

    // Verify base maze connectivity
    if (!isConnected()) {
      throw new Error('Sparse Loop: Base maze is not fully connected');
    }

    /**
     * ENHANCED: Find potential loop candidates with validation
     */
    function findLoopCandidates() {
      const candidates = [];
      let totalWalls = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = maze.getCell(x, y);
          if (!cell) continue;

          for (const [dir, [dx, dy]] of Object.entries(directions)) {
            // Only consider each wall once (avoid duplicates)
            if ((dir === 'E' && x === width - 1) || (dir === 'S' && y === height - 1)) {
              continue;
            }

            if (cell.hasWall(dir)) {
              totalWalls++;
              const nx = x + dx, ny = y + dy;
              
              // Validate neighbor exists and is in bounds
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const neighbor = maze.getCell(nx, ny);
                if (neighbor && neighbor.hasWall(opposite[dir])) {
                  candidates.push({
                    x1: x, y1: y,
                    x2: nx, y2: ny,
                    direction: dir,
                    key: `${Math.min(x, nx)},${Math.min(y, ny)},${dir}`
                  });
                }
              }
            }
          }
        }
      }

      console.log(`Sparse Loop: Found ${candidates.length} potential loop candidates out of ${totalWalls} total walls`);
      return candidates;
    }

    /**
     * ENHANCED: Score loop candidates based on strategic value
     */
    function scoreLoopCandidate(candidate) {
      let score = 1.0; // Base score

      // Prefer loops in the interior (avoid boundary loops)
      const { x1, y1, x2, y2 } = candidate;
      const minDistanceFromBorder = Math.min(
        Math.min(x1, x2),                    // Distance from left
        Math.min(y1, y2),                    // Distance from top
        Math.min(width - 1 - Math.max(x1, x2), height - 1 - Math.max(y1, y2)) // Distance from right/bottom
      );
      
      if (minDistanceFromBorder > 0) {
        score += 0.5; // Bonus for interior loops
      }

      // Prefer loops that create interesting shortcuts
      const centerX = width / 2;
      const centerY = height / 2;
      const avgX = (x1 + x2) / 2;
      const avgY = (y1 + y2) / 2;
      const distanceFromCenter = Math.sqrt((avgX - centerX) ** 2 + (avgY - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      
      // Slightly prefer loops closer to center
      score += 0.3 * (1 - distanceFromCenter / maxDistance);

      return score;
    }

    // 3. ENHANCED: Select and add loops with validation
    const loopCandidates = findLoopCandidates();
    
    if (loopCandidates.length === 0) {
      console.log('Sparse Loop: No loop candidates found, returning base maze');
      ensureBoundaryWalls(maze);
      return maze;
    }

    // Score and sort candidates
    const scoredCandidates = loopCandidates.map(candidate => ({
      ...candidate,
      score: scoreLoopCandidate(candidate)
    })).sort((a, b) => b.score - a.score);

    // Calculate target number of loops
    const maxPossibleLoops = loopCandidates.length;
    const targetLoops = Math.max(1, Math.floor(maxPossibleLoops * loopiness));
    
    console.log(`Sparse Loop: Adding ${targetLoops} loops out of ${maxPossibleLoops} possible`);

    let loopsAdded = 0;
    let candidatesProcessed = 0;
    const addedLoops = [];

    // Shuffle scored candidates to add randomness while respecting scores
    const topCandidates = scoredCandidates.slice(0, Math.max(targetLoops * 3, 20));
    for (let i = topCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topCandidates[i], topCandidates[j]] = [topCandidates[j], topCandidates[i]];
    }

    for (const candidate of topCandidates) {
      if (loopsAdded >= targetLoops) break;
      
      candidatesProcessed++;
      const { x1, y1, x2, y2, direction } = candidate;

      // ENHANCED: Safe cell access with validation
      const cell1 = maze.getCell(x1, y1);
      const cell2 = maze.getCell(x2, y2);

      if (!cell1 || !cell2) {
        console.warn(`Sparse Loop: Missing cells for loop candidate: (${x1},${y1}) -> (${x2},${y2})`);
        continue;
      }

      // Verify walls still exist (important for complex scenarios)
      if (!cell1.hasWall(direction) || !cell2.hasWall(opposite[direction])) {
        continue; // Walls already removed
      }

      // Add the loop by removing walls
      cell1.removeWall(direction);
      cell2.removeWall(opposite[direction]);

      // Verify connectivity is maintained (should always be true for loop addition)
      if (isConnected()) {
        loopsAdded++;
        addedLoops.push({
          from: { x: x1, y: y1 },
          to: { x: x2, y: y2 },
          direction: direction,
          score: candidate.score
        });

        if (loopsAdded % Math.ceil(targetLoops / 5) === 0 || loopsAdded === targetLoops) {
          console.log(`Sparse Loop: Added ${loopsAdded}/${targetLoops} loops`);
        }
      } else {
        // This should never happen with loop addition, but safety check
        console.warn('Sparse Loop: Loop addition broke connectivity, reverting');
        cell1.addWall(direction);
        cell2.addWall(opposite[direction]);
      }
    }

    console.log(`Sparse Loop: Processed ${candidatesProcessed} candidates, successfully added ${loopsAdded} loops`);

    // Store loop metadata
    maze._loops = addedLoops;
    maze._loopiness = loopiness;
    maze._targetLoops = targetLoops;
    maze._actualLoops = loopsAdded;

    // Calculate final statistics
    const finalConnectivity = isConnected();
    const loopEfficiency = loopsAdded / targetLoops;

    console.log(`Sparse Loop: Final statistics:`);
    console.log(`  - Target loops: ${targetLoops}`);
    console.log(`  - Actual loops: ${loopsAdded}`);
    console.log(`  - Loop efficiency: ${(loopEfficiency * 100).toFixed(1)}%`);
    console.log(`  - Final connectivity: ${finalConnectivity ? 'OK' : 'BROKEN'}`);

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Sparse Loop: Post-processed maze is invalid');
    }

    if (!finalConnectivity) {
      throw new Error('Sparse Loop: Final maze is not fully connected');
    }

    console.log('Sparse Loop: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Sparse Loop maze generation failed:', error);
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
    console.warn('Sparse Loop: Failed to ensure boundary walls:', error);
  }
}