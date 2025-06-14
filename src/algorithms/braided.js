// src/algorithms/braided.js - FIXED VERSION

import { generateRecursiveBacktracker } from './recursiveBacktracker.js';
import { Maze } from '../model/maze.js';

/**
 * Braided Maze Generator (Post-Processed)
 * 
 * Starts with a perfect maze, then removes dead ends by adding loops.
 * Fixed to properly re-evaluate dead end status after modifications.
 * 
 * @param {number} width
 * @param {number} height
 * @param {object} [options] - { braidness: float [0..1], baseAlgorithm: function }
 * @returns {Maze}
 */
export function generateBraided(width, height, options = {}) {
  // Configurable "braidness": 0 = standard maze, 1 = no dead ends
  const braidness = typeof options.braidness === 'number' ? options.braidness : 0.5;
  const baseAlgorithm = options.baseAlgorithm || generateRecursiveBacktracker;

  // 1. Generate initial perfect maze
  const maze = baseAlgorithm(width, height);

  // 2. Helper to count open passages
  function countOpenings(x, y) {
    const cell = maze.getCell(x, y);
    return ['N', 'E', 'S', 'W'].filter(d => !cell.hasWall(d)).length;
  }

  // 3. Remove dead ends by connecting to neighbors
  const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const opposite = { N: "S", E: "W", S: "N", W: "E" };
  
  let totalDeadEnds = 0;
  let deadEndsList = [];
  
  // First pass: count dead ends
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (countOpenings(x, y) === 1) {
        totalDeadEnds++;
        deadEndsList.push({ x, y });
      }
    }
  }
  
  // Shuffle dead ends list
  for (let i = deadEndsList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deadEndsList[i], deadEndsList[j]] = [deadEndsList[j], deadEndsList[i]];
  }
  
  const targetRemovals = Math.floor(totalDeadEnds * braidness);
  let removed = 0;
  
  // Process dead ends
  for (const { x, y } of deadEndsList) {
    if (removed >= targetRemovals) break;
    
    // Re-check if still a dead end (important!)
    if (countOpenings(x, y) !== 1) continue;
    
    const cell = maze.getCell(x, y);
    // Find walls that can be removed (have valid neighbors)
    const candidates = [];
    
    for (const dir in deltas) {
      const [dx, dy] = deltas[dir];
      const nx = x + dx, ny = y + dy;
      
      if (
        cell.hasWall(dir) &&
        nx >= 0 && nx < width &&
        ny >= 0 && ny < height
      ) {
        const neighbor = maze.getCell(nx, ny);
        // Only consider if both cells have the wall
        if (neighbor.hasWall(opposite[dir])) {
          candidates.push({ dir, nx, ny });
        }
      }
    }
    
    if (candidates.length > 0) {
      // Prefer connecting to cells that aren't dead ends themselves
      candidates.sort((a, b) => {
        const aOpenings = countOpenings(a.nx, a.ny);
        const bOpenings = countOpenings(b.nx, b.ny);
        return bOpenings - aOpenings; // More openings first
      });
      
      const { dir, nx, ny } = candidates[0];
      cell.removeWall(dir);
      maze.getCell(nx, ny).removeWall(opposite[dir]);
      removed++;
    }
  }

  // Ensure entrance and exit are open
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
