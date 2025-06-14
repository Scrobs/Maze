// src/algorithms/ellers.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Eller's Maze Generation Algorithm
 * 
 * Generates maze row by row, maintaining sets to ensure connectivity.
 * Efficient for very wide mazes. Produces some cycles, avoids bias.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateEller(width, height) {
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

  // Each cell in the current row gets a set id; we use a 2D array to track
  let setRow = Array(width).fill(0);
  let nextSet = 1;

  // For each row
  for (let y = 0; y < height; y++) {
    // 1. Assign sets to each cell
    for (let x = 0; x < width; x++) {
      if (setRow[x] === 0) setRow[x] = nextSet++;
    }

    // 2. Carve east walls (merge sets with random chance)
    for (let x = 0; x < width - 1; x++) {
      const merge = Math.random() < 0.5 || y === height - 1; // always merge in last row
      if (setRow[x] !== setRow[x + 1] && merge) {
        // Remove east wall
        maze.getCell(x, y).removeWall("E");
        maze.getCell(x + 1, y).removeWall("W");
        // Merge sets
        const fromSet = setRow[x + 1];
        const toSet = setRow[x];
        for (let i = 0; i < width; i++) {
          if (setRow[i] === fromSet) setRow[i] = toSet;
        }
      }
    }

    if (y === height - 1) break; // Done after last row

    // 3. Carve vertical connections (at least one per set)
    // Track which sets have at least one vertical connection
    const setHasVertical = {};
    for (let x = 0; x < width; x++) {
      const carveDown = Math.random() < 0.5;
      if (carveDown) {
        maze.getCell(x, y).removeWall("S");
        maze.getCell(x, y + 1).removeWall("N");
        setHasVertical[setRow[x]] = true;
      }
    }
    // Ensure every set has at least one vertical connection
    for (let set of new Set(setRow)) {
      if (!setHasVertical[set]) {
        // Pick a random cell in this set to carve down
        const indices = [];
        for (let x = 0; x < width; x++) {
          if (setRow[x] === set) indices.push(x);
        }
        const x = indices[Math.floor(Math.random() * indices.length)];
        maze.getCell(x, y).removeWall("S");
        maze.getCell(x, y + 1).removeWall("N");
      }
    }

    // 4. Prepare setRow for next row: cells not connected down get new sets
    let nextSetRow = Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      if (
        !maze.getCell(x, y).hasWall("S")
      ) {
        nextSetRow[x] = setRow[x];
      }
    }
    setRow = nextSetRow;
  }

  // Open entrance and exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
