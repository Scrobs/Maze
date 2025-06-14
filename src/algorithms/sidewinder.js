// src/algorithms/sidewinder.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Sidewinder Maze Generation Algorithm
 * 
 * For each row: runs from left to right, carving east with random runs,
 * and occasionally carves north from a random cell in the run. Produces
 * "easy" mazes with few vertical passages and many horizontal ones.
 * 
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateSidewinder(width, height) {
  const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

  // IMPORTANT: Start with ALL walls on ALL cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, y);
      cell.addWall("N");
      cell.addWall("E"); 
      cell.addWall("S");
      cell.addWall("W");
    }
  }

  // Generate maze using sidewinder algorithm
  for (let y = 0; y < height; y++) {
    let run = [];
    for (let x = 0; x < width; x++) {
      run.push(x);

      const atEasternBoundary = (x === width - 1);
      const atNorthernBoundary = (y === 0);
      const shouldCloseOut = atEasternBoundary || (!atNorthernBoundary && Math.random() < 0.5);

      if (shouldCloseOut) {
        // Carve north from a random cell in the current run (unless on top row)
        if (!atNorthernBoundary) {
          const member = run[Math.floor(Math.random() * run.length)];
          const cell = maze.getCell(member, y);
          // Remove north wall from this cell and south wall from cell above
          cell.removeWall("N");
          maze.getCell(member, y - 1).removeWall("S");
        }
        run = [];
      } else {
        // Carve east: remove east wall from this cell, west wall from cell to the east
        const cell = maze.getCell(x, y);
        cell.removeWall("E");
        maze.getCell(x + 1, y).removeWall("W");
      }
    }
  }

  // Open entrance and exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
