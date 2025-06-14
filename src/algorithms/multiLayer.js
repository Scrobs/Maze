// src/algorithms/multiLayer.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';
import { generateRecursiveBacktracker } from './recursiveBacktracker.js';

/**
 * Multi-layer / 3D / Non-Euclidean Maze Generator
 * 
 * Fixed portal creation to properly connect layers at boundaries.
 * 
 * @param {number} width - cells per row (per layer)
 * @param {number} height - cells per col (per layer)
 * @param {object} [options] - { layers: number, portals: number }
 * @returns {Maze} - Metadata property `maze._portals` contains portals.
 */
export function generateMultiLayer(width, height, options = {}) {
  const layers = Math.min(Math.max(options.layers || 2, 2), 5); // Clamp between 2-5
  const portals = Math.min(Math.max(options.portals || 4, 1), 10); // Clamp between 1-10

  // 1. Generate a perfect maze for each layer
  const mazes = [];
  for (let l = 0; l < layers; l++) {
    mazes.push(generateRecursiveBacktracker(width, height));
  }

  // 2. Combine layers into one flat maze grid (lay layers side-by-side horizontally)
  const totalWidth = width * layers;
  const totalHeight = height;
  const flatMaze = new Maze(totalWidth, totalHeight, { x: 0, y: 0 }, { x: totalWidth - 1, y: totalHeight - 1 });

  // IMPORTANT: Start with ALL walls on the flat maze
  for (let y = 0; y < totalHeight; y++) {
    for (let x = 0; x < totalWidth; x++) {
      const cell = flatMaze.getCell(x, y);
      cell.addWall("N");
      cell.addWall("E");
      cell.addWall("S");
      cell.addWall("W");
    }
  }

  // Copy each layer's walls to the flat grid
  for (let l = 0; l < layers; l++) {
    const offsetX = l * width;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellSrc = mazes[l].getCell(x, y);
        const cellDst = flatMaze.getCell(offsetX + x, y);
        
        // Copy walls from source layer to destination
        for (const dir of ["N", "E", "S", "W"]) {
          if (!cellSrc.hasWall(dir)) {
            cellDst.removeWall(dir);
          }
        }
      }
    }
  }

  // 3. Add "portals" between adjacent layers
  flatMaze._portals = [];
  const portalCandidates = [];
  
  // Find all valid portal locations (boundaries between layers)
  for (let l = 0; l < layers - 1; l++) {
    const boundaryX = (l + 1) * width - 1; // Right edge of layer l
    const nextBoundaryX = (l + 1) * width; // Left edge of layer l+1
    
    for (let y = 0; y < height; y++) {
      portalCandidates.push({
        fromX: boundaryX,
        fromY: y,
        toX: nextBoundaryX,
        toY: y,
        fromLayer: l,
        toLayer: l + 1
      });
    }
  }
  
  // Shuffle and select portal locations
  for (let i = portalCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [portalCandidates[i], portalCandidates[j]] = [portalCandidates[j], portalCandidates[i]];
  }
  
  const actualPortals = Math.min(portals, portalCandidates.length);
  for (let i = 0; i < actualPortals; i++) {
    const { fromX, fromY, toX, toY } = portalCandidates[i];
    
    // Create portal by removing the walls between layers
    flatMaze.getCell(fromX, fromY).removeWall("E");
    flatMaze.getCell(toX, toY).removeWall("W");
    
    flatMaze._portals.push({
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY }
    });
  }

  // Open entrance and exit
  flatMaze.getCell(flatMaze.start.x, flatMaze.start.y).removeWall("W");
  flatMaze.getCell(flatMaze.finish.x, flatMaze.finish.y).removeWall("E");

  // Attach metadata
  flatMaze._layers = layers;
  flatMaze._widthPerLayer = width;
  flatMaze._heightPerLayer = height;

  return flatMaze;
}
