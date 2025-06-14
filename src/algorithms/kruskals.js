// src/algorithms/kruskals.js - FIXED VERSION

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Kruskal's Maze Generation Algorithm
 * 
 * FIXED:
 * - Enhanced Union-Find data structure with path compression
 * - Improved edge generation and validation
 * - Better null checking and error handling
 * - Robust boundary wall management
 * - Comprehensive algorithm state tracking
 * 
 * Uses minimum spanning tree approach. Creates all possible edges,
 * shuffles them, then adds edges that connect different components.
 * Produces mazes with many short dead ends and uniform texture.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateKruskals(width, height) {
  // Enhanced input validation
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Kruskal\'s: Width and height must be integers');
  }
  if (width < 2 || height < 2) {
    throw new Error('Kruskal\'s: Width and height must be at least 2');
  }
  if (width > 200 || height > 200) {
    throw new Error('Kruskal\'s: Dimensions too large (max 200x200) - too many edges to process efficiently');
  }

  console.log(`Generating Kruskal's maze: ${width}x${height}`);

  try {
    const maze = new Maze(width, height, { x: 0, y: 0 }, { x: width - 1, y: height - 1 });

    // IMPORTANT: Start with ALL walls on ALL cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) {
          throw new Error(`Kruskal's: Failed to create cell at (${x}, ${y})`);
        }
        cell.addWall("N");
        cell.addWall("E");
        cell.addWall("S");
        cell.addWall("W");
      }
    }

    // ENHANCED: Union-Find data structure with path compression
    class UnionFind {
      constructor(size) {
        if (!Number.isInteger(size) || size <= 0) {
          throw new Error('UnionFind: Size must be a positive integer');
        }
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = Array(size).fill(0);
        this.components = size;
      }

      // Find with path compression
      find(x) {
        if (!Number.isInteger(x) || x < 0 || x >= this.parent.length) {
          throw new Error(`UnionFind: Invalid element ${x}`);
        }
        if (this.parent[x] !== x) {
          this.parent[x] = this.find(this.parent[x]); // Path compression
        }
        return this.parent[x];
      }

      // Union by rank
      union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        
        if (rootX === rootY) {
          return false; // Already in same set
        }

        // Union by rank
        if (this.rank[rootX] < this.rank[rootY]) {
          this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
          this.parent[rootY] = rootX;
        } else {
          this.parent[rootY] = rootX;
          this.rank[rootX]++;
        }

        this.components--;
        return true;
      }

      connected(x, y) {
        return this.find(x) === this.find(y);
      }

      getComponentCount() {
        return this.components;
      }
    }

    // Initialize Union-Find for all cells
    const totalCells = width * height;
    const uf = new UnionFind(totalCells);

    /**
     * ENHANCED: Convert 2D coordinates to 1D index with validation
     */
    function cellToIndex(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        throw new Error(`Kruskal's: Invalid coordinates (${x}, ${y})`);
      }
      return y * width + x;
    }

    /**
     * Convert 1D index back to 2D coordinates
     */
    function indexToCell(index) {
      if (index < 0 || index >= totalCells) {
        throw new Error(`Kruskal's: Invalid index ${index}`);
      }
      return {
        x: index % width,
        y: Math.floor(index / width)
      };
    }

    // ENHANCED: Generate all possible edges with validation
    const edges = [];
    let totalEdgesGenerated = 0;

    // Horizontal edges (east-west connections)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - 1; x++) {
        const cell1Index = cellToIndex(x, y);
        const cell2Index = cellToIndex(x + 1, y);
        
        edges.push({
          cell1: { x, y, index: cell1Index },
          cell2: { x: x + 1, y, index: cell2Index },
          direction: 'E',
          type: 'horizontal'
        });
        totalEdgesGenerated++;
      }
    }

    // Vertical edges (north-south connections)
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const cell1Index = cellToIndex(x, y);
        const cell2Index = cellToIndex(x, y + 1);
        
        edges.push({
          cell1: { x, y, index: cell1Index },
          cell2: { x, y: y + 1, index: cell2Index },
          direction: 'S',
          type: 'vertical'
        });
        totalEdgesGenerated++;
      }
    }

    console.log(`Kruskal's: Generated ${totalEdgesGenerated} edges`);

    // ENHANCED: Shuffle edges with Fisher-Yates algorithm
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    console.log('Kruskal\'s: Edges shuffled, processing...');

    // Process edges and build minimum spanning tree
    let edgesAdded = 0;
    let edgesProcessed = 0;
    const targetEdges = totalCells - 1; // MST has n-1 edges

    const opposite = { N: "S", E: "W", S: "N", W: "E" };

    for (const edge of edges) {
      edgesProcessed++;
      
      // Check if cells are already connected
      if (!uf.connected(edge.cell1.index, edge.cell2.index)) {
        // ENHANCED: Safe cell access with validation
        const cell1 = maze.getCell(edge.cell1.x, edge.cell1.y);
        const cell2 = maze.getCell(edge.cell2.x, edge.cell2.y);
        
        if (!cell1 || !cell2) {
          console.warn(`Kruskal's: Missing cells for edge: (${edge.cell1.x},${edge.cell1.y}) -> (${edge.cell2.x},${edge.cell2.y})`);
          continue;
        }

        // Remove walls between cells
        cell1.removeWall(edge.direction);
        cell2.removeWall(opposite[edge.direction]);
        
        // Union the cells in the disjoint set
        const unionSuccess = uf.union(edge.cell1.index, edge.cell2.index);
        if (unionSuccess) {
          edgesAdded++;
          
          if (edgesAdded % Math.ceil(targetEdges / 10) === 0) {
            console.log(`Kruskal's: ${edgesAdded}/${targetEdges} edges added (${uf.getComponentCount()} components remaining)`);
          }
        }

        // OPTIMIZATION: Stop when we have a spanning tree
        if (edgesAdded >= targetEdges) {
          console.log(`Kruskal's: Spanning tree completed with ${edgesAdded} edges`);
          break;
        }
      }
    }

    console.log(`Kruskal's: Processed ${edgesProcessed}/${edges.length} edges, added ${edgesAdded} connections`);

    // Validate spanning tree
    if (uf.getComponentCount() !== 1) {
      console.warn(`Kruskal's: Warning - ${uf.getComponentCount()} disconnected components remain`);
    }

    if (edgesAdded < targetEdges) {
      console.warn(`Kruskal's: Warning - Only added ${edgesAdded}/${targetEdges} edges`);
    }

    // FIXED: Ensure boundary walls are properly set
    ensureBoundaryWalls(maze);

    // Final validation
    if (!maze.isValid()) {
      throw new Error('Kruskal\'s: Generated maze is invalid');
    }

    console.log('Kruskal\'s: Maze generation completed successfully');
    return maze;

  } catch (error) {
    console.error('Kruskal\'s maze generation failed:', error);
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
    console.warn('Kruskal\'s: Failed to ensure boundary walls:', error);
  }
}