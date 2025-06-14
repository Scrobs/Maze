// src/algorithms/binaryTree.js - WORKING VERSION

import { Maze, MazeCell } from '../model/maze.js';

export function generateBinaryTree(width, height) {
  const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

  // Start with ALL walls on ALL cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = maze.getCell(x, y);
      // Add all four walls initially
      cell.addWall("N");
      cell.addWall("E");
      cell.addWall("S");
      cell.addWall("W");
    }
  }

  // Now carve passages by removing walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const canGoNorth = (y > 0);
      const canGoEast = (x < width - 1);
      
      // Skip if at top-right corner
      if (!canGoNorth && !canGoEast) continue;

      // Choose direction
      let carveDir;
      if (canGoNorth && canGoEast) {
        carveDir = Math.random() < 0.5 ? "N" : "E";
      } else if (canGoNorth) {
        carveDir = "N";
      } else {
        carveDir = "E";
      }

      const cell = maze.getCell(x, y);

      if (carveDir === "N") {
        // Remove wall between this cell and north neighbor
        cell.removeWall("N");
        maze.getCell(x, y - 1).removeWall("S");
      } else if (carveDir === "E") {
        // Remove wall between this cell and east neighbor
        cell.removeWall("E");
        maze.getCell(x + 1, y).removeWall("W");
      }
    }
  }

  // Create entrance and exit
  maze.getCell(0, 0).removeWall("W");
  maze.getCell(width - 1, height - 1).removeWall("E");

  return maze;
}
