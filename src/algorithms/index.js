// src/algorithms/index.js

import { Maze } from '../model/maze.js';
import { generateBinaryTree } from './binaryTree.js';
import { generateSidewinder } from './sidewinder.js';
import { generateRecursiveBacktracker } from './recursiveBacktracker.js';
import { generateHuntAndKill } from './huntAndKill.js';
import { generateAldousBroder } from './aldousBroder.js';
import { generateEller } from './ellers.js';
import { generatePrims } from './prims.js';
import { generateKruskals } from './kruskals.js';
import { generateWilsons } from './wilsons.js';
import { generateBraided } from './braided.js';
import { generateSparseLoop } from './sparseLoop.js';
import { generateMultiLayer } from './multiLayer.js';

/**
 * Fallback stub for not-yet-implemented algorithms.
 * Returns a simple maze with just outer walls.
 */
function notImplemented(width, height) {
  const maze = new Maze(width, height);
  
  // Add all walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, y);
      cell.addWall("N");
      cell.addWall("E");
      cell.addWall("S");
      cell.addWall("W");
    }
  }
  
  // Create a simple path from start to finish
  for (let x = 0; x < width - 1; x++) {
    maze.getCell(x, 0).removeWall("E");
    maze.getCell(x + 1, 0).removeWall("W");
  }
  for (let y = 0; y < height - 1; y++) {
    maze.getCell(width - 1, y).removeWall("S");
    maze.getCell(width - 1, y + 1).removeWall("N");
  }
  
  // Open entrance and exit
  maze.getCell(0, 0).removeWall("W");
  maze.getCell(width - 1, height - 1).removeWall("E");
  
  return maze;
}

/**
 * Wrapper to ensure algorithms can accept options parameter
 */
function wrapAlgorithm(fn) {
  return (width, height, options = {}) => {
    try {
      return fn(width, height, options);
    } catch (error) {
      console.error(`Algorithm failed: ${error.message}`);
      throw error;
    }
  };
}

/**
 * Map of all algorithms/methods to their generator functions.
 * The keys must match the <option value="..."> in the algorithm dropdown.
 */
export const algorithms = {
  "binary-tree": wrapAlgorithm(generateBinaryTree),
  "sidewinder": wrapAlgorithm(generateSidewinder),
  "recursive-backtracker": wrapAlgorithm(generateRecursiveBacktracker),
  "hunt-and-kill": wrapAlgorithm(generateHuntAndKill),
  "aldous-broder": wrapAlgorithm(generateAldousBroder),
  "ellers": wrapAlgorithm(generateEller),
  "prims": wrapAlgorithm(generatePrims),
  "kruskals": wrapAlgorithm(generateKruskals),
  "wilsons": wrapAlgorithm(generateWilsons),
  "braided": wrapAlgorithm(generateBraided),
  "sparse-loop": wrapAlgorithm(generateSparseLoop),
  "multi-layer": wrapAlgorithm(generateMultiLayer),
};

// Export individual functions for testing
export {
  generateBinaryTree,
  generateSidewinder,
  generateRecursiveBacktracker,
  generateHuntAndKill,
  generateAldousBroder,
  generateEller,
  generatePrims,
  generateKruskals,
  generateWilsons,
  generateBraided,
  generateSparseLoop,
  generateMultiLayer,
  notImplemented
};
