// src/algorithms/multiLayer.js - FIXED VERSION

import { Maze } from '../model/maze.js';
import { generateRecursiveBacktracker } from './recursiveBacktracker.js';

/**
 * Multi-layer / 3-D / Non-Euclidean Maze Generator
 *
 * FIXED: 
 * - Explicit wall state copying between layers
 * - Improved seam wall symmetry enforcement  
 * - Better boundary wall handling
 * - Enhanced validation and error checking
 *
 * 1. Builds a perfect maze for each layer.
 * 2. Flattens them side-by-side horizontally.
 * 3. Enforces wall symmetry along inter-layer seams.
 * 4. Optionally punches extra "portals" between layers.
 *
 * @param {number} width   Cells per row (per layer)
 * @param {number} height  Cells per column (per layer)
 * @param {object} options { layers: 2-5, portals: 1-10 }
 * @returns {Maze} flatMaze (metadata: _layers, _portals, etc.)
 */
export function generateMultiLayer(width, height, options = {}) {
  // Validate input parameters
  if (width < 2 || height < 2) {
    throw new Error('Multi-layer maze requires width and height >= 2');
  }

  const layers = Math.max(2, Math.min(5, options.layers ?? 2));
  const portals = Math.max(1, Math.min(10, options.portals ?? 4));

  console.log(`Generating ${layers}-layer maze (${width}x${height} per layer) with ${portals} portals`);

  /* ------------------------------------------------------------
   * 1. Generate one perfect maze per layer
   * ---------------------------------------------------------- */
  const baseMazes = [];
  for (let l = 0; l < layers; l++) {
    try {
      const layerMaze = generateRecursiveBacktracker(width, height);
      if (!layerMaze || !layerMaze.isValid()) {
        throw new Error(`Layer ${l} generation failed`);
      }
      baseMazes.push(layerMaze);
      console.log(`Layer ${l} generated successfully`);
    } catch (error) {
      throw new Error(`Failed to generate layer ${l}: ${error.message}`);
    }
  }

  /* ------------------------------------------------------------
   * 2. Create flattened maze structure
   * ---------------------------------------------------------- */
  const totalWidth = width * layers;
  const totalHeight = height;
  const flatMaze = new Maze(
    totalWidth, 
    totalHeight,
    { x: 0, y: 0 },
    { x: totalWidth - 1, y: totalHeight - 1 }
  );

  // Initialize ALL cells with ALL walls
  for (let y = 0; y < totalHeight; y++) {
    for (let x = 0; x < totalWidth; x++) {
      const cell = flatMaze.getCell(x, y);
      if (!cell) {
        throw new Error(`Failed to create cell at (${x}, ${y})`);
      }
      cell.addWall('N');
      cell.addWall('E');
      cell.addWall('S');
      cell.addWall('W');
    }
  }

  /* ------------------------------------------------------------
   * 3. FIXED: Copy wall states explicitly from each layer
   * ---------------------------------------------------------- */
  for (let layerIndex = 0; layerIndex < layers; layerIndex++) {
    const offsetX = layerIndex * width;
    const sourceMaze = baseMazes[layerIndex];

    console.log(`Copying layer ${layerIndex} to offset ${offsetX}`);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceCell = sourceMaze.getCell(x, y);
        const targetCell = flatMaze.getCell(offsetX + x, y);

        if (!sourceCell || !targetCell) {
          throw new Error(`Invalid cells during layer copy: layer ${layerIndex}, pos (${x}, ${y})`);
        }

        // FIXED: Explicitly copy each wall state
        for (const direction of ['N', 'E', 'S', 'W']) {
          if (sourceCell.hasWall(direction)) {
            targetCell.addWall(direction);
          } else {
            targetCell.removeWall(direction);
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------
   * 4. ENHANCED: Enforce wall symmetry at inter-layer seams
   * ---------------------------------------------------------- */
  for (let layerIndex = 0; layerIndex < layers - 1; layerIndex++) {
    const seamLeftX = (layerIndex + 1) * width - 1;  // Rightmost column of current layer
    const seamRightX = seamLeftX + 1;                // Leftmost column of next layer

    console.log(`Enforcing seam symmetry between columns ${seamLeftX} and ${seamRightX}`);

    for (let y = 0; y < height; y++) {
      const leftCell = flatMaze.getCell(seamLeftX, y);
      const rightCell = flatMaze.getCell(seamRightX, y);

      if (!leftCell || !rightCell) {
        console.warn(`Missing seam cells at y=${y}, skipping`);
        continue;
      }

      // ENHANCED: Ensure wall symmetry
      // If EITHER cell has the seam wall removed, remove it from BOTH
      const leftHasEastWall = leftCell.hasWall('E');
      const rightHasWestWall = rightCell.hasWall('W');

      if (!leftHasEastWall || !rightHasWestWall) {
        // At least one side is open, so open both
        leftCell.removeWall('E');
        rightCell.removeWall('W');
      } else {
        // Both sides are walled, ensure they stay walled
        leftCell.addWall('E');
        rightCell.addWall('W');
      }
    }
  }

  /* ------------------------------------------------------------
   * 5. ENHANCED: Add random portals between layers
   * ---------------------------------------------------------- */
  flatMaze._portals = [];
  const portalCandidates = [];

  // Collect all potential portal locations (seam positions)
  for (let layerIndex = 0; layerIndex < layers - 1; layerIndex++) {
    const seamLeftX = (layerIndex + 1) * width - 1;
    const seamRightX = seamLeftX + 1;

    for (let y = 0; y < height; y++) {
      portalCandidates.push({
        fromX: seamLeftX,
        fromY: y,
        toX: seamRightX,
        toY: y,
        layerPair: `${layerIndex}-${layerIndex + 1}`
      });
    }
  }

  // Shuffle candidates for random selection
  for (let i = portalCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [portalCandidates[i], portalCandidates[j]] = [portalCandidates[j], portalCandidates[i]];
  }

  // Create the requested number of portals
  const actualPortals = Math.min(portals, portalCandidates.length);
  for (let i = 0; i < actualPortals; i++) {
    const { fromX, fromY, toX, toY, layerPair } = portalCandidates[i];

    const fromCell = flatMaze.getCell(fromX, fromY);
    const toCell = flatMaze.getCell(toX, toY);

    if (fromCell && toCell) {
      // Create portal connection
      fromCell.removeWall('E');
      toCell.removeWall('W');

      flatMaze._portals.push({
        from: { x: fromX, y: fromY },
        to: { x: toX, y: toY },
        layerPair: layerPair
      });

      console.log(`Portal ${i + 1} created: (${fromX},${fromY}) <-> (${toX},${toY}) [${layerPair}]`);
    }
  }

  /* ------------------------------------------------------------
   * 6. FIXED: Ensure proper boundary walls and entrance/exit
   * ---------------------------------------------------------- */
  ensureMultiLayerBoundaryWalls(flatMaze, width, layers);

  // Store metadata
  flatMaze._layers = layers;
  flatMaze._widthPerLayer = width;
  flatMaze._heightPerLayer = height;
  flatMaze._portalCount = flatMaze._portals.length;

  console.log(`Multi-layer maze completed: ${layers} layers, ${flatMaze._portals.length} portals`);

  // Final validation
  if (!flatMaze.isValid()) {
    throw new Error('Generated multi-layer maze is invalid');
  }

  return flatMaze;
}

/**
 * ENHANCED: Ensure boundary walls for multi-layer maze
 */
function ensureMultiLayerBoundaryWalls(maze, widthPerLayer, layers) {
  const totalWidth = widthPerLayer * layers;
  const totalHeight = maze.height;

  // Top boundary - all cells
  for (let x = 0; x < totalWidth; x++) {
    const cell = maze.getCell(x, 0);
    if (cell) cell.addWall("N");
  }

  // Bottom boundary - all cells  
  for (let x = 0; x < totalWidth; x++) {
    const cell = maze.getCell(x, totalHeight - 1);
    if (cell) cell.addWall("S");
  }

  // Left boundary - only first layer
  for (let y = 0; y < totalHeight; y++) {
    const cell = maze.getCell(0, y);
    if (cell) cell.addWall("W");
  }

  // Right boundary - only last layer
  for (let y = 0; y < totalHeight; y++) {
    const cell = maze.getCell(totalWidth - 1, y);
    if (cell) cell.addWall("E");
  }

  // IMPORTANT: Inter-layer boundaries should NOT have walls
  // (these are handled by seam symmetry and portals)

  // Open entrance and exit
  if (maze.start) {
    const startCell = maze.getCell(maze.start.x, maze.start.y);
    if (startCell) {
      if (maze.start.x === 0) startCell.removeWall("W");
      if (maze.start.y === 0) startCell.removeWall("N");
    }
  }

  if (maze.finish) {
    const finishCell = maze.getCell(maze.finish.x, maze.finish.y);
    if (finishCell) {
      if (maze.finish.x === totalWidth - 1) finishCell.removeWall("E");
      if (maze.finish.y === totalHeight - 1) finishCell.removeWall("S");
    }
  }
}