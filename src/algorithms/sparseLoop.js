// src/algorithms/sparseLoop.js - WORKING VERSION

import { generateRecursiveBacktracker } from './recursiveBacktracker.js';
import { Maze } from '../model/maze.js';

/**
 * Sparse Loop-Added Maze Generator
 *
 * Starts with a perfect maze, then adds a *few* random extra connections
 * (loops), resulting in a difficult maze with very few dead ends but not
 * fully "braided". Suitable for very hard human/algorithmic challenges.
 *
 * @param {number} width
 * @param {number} height
 * @param {object} [options] - { loopFraction: float [0..1], baseAlgorithm: function }
 * @returns {Maze}
 */
export function generateSparseLoop(width, height, options = {}) {
  // loopFraction: what percent of possible wall connections to add as loops (default 0.12)
  const loopFraction = typeof options.loopFraction === 'number' ? options.loopFraction : 0.12;
  const baseAlgorithm = options.baseAlgorithm || generateRecursiveBacktracker;

  // 1. Generate a perfect maze first
  const maze = baseAlgorithm(width, height);

  // 2. Collect all possible candidate walls between adjacent cells
  const candidates = [];
  const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const opposite = { N: "S", E: "W", S: "N", W: "E" };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (const dir in deltas) {
        const [dx, dy] = deltas[dir];
        const nx = x + dx, ny = y + dy;
        if (
          nx >= 0 && nx < width &&
          ny >= 0 && ny < height
        ) {
          const cell = maze.getCell(x, y);
          const neighbor = maze.getCell(nx, ny);
          // Only consider walls that separate two cells (present in both)
          if (cell.hasWall(dir) && neighbor.hasWall(opposite[dir])) {
            // Use a canonical representation to avoid duplicates
            if (dir === "E" || dir === "S") { // Only east or south to avoid double-adding
              candidates.push({ x, y, dir, nx, ny });
            }
          }
        }
      }
    }
  }

  // 3. Shuffle and pick a subset to remove
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const numToRemove = Math.floor(candidates.length * loopFraction);

  for (let i = 0; i < numToRemove; i++) {
    const { x, y, dir, nx, ny } = candidates[i];
    maze.getCell(x, y).removeWall(dir);
    maze.getCell(nx, ny).removeWall(opposite[dir]);
  }

  // Entrance and exit should already be open from base algorithm
  // But ensure they are open
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
