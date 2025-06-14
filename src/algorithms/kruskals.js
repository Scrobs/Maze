// src/algorithms/kruskals.js - OPTIMIZED WITH UNION-FIND

import { Maze, MazeCell } from '../model/maze.js';

/**
 * Union-Find data structure with path compression and union by rank
 */
class UnionFind {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.parent = [];
    this.rank = [];
    
    // Initialize each cell as its own set
    for (let y = 0; y < height; y++) {
      this.parent[y] = [];
      this.rank[y] = [];
      for (let x = 0; x < width; x++) {
        this.parent[y][x] = { x, y };
        this.rank[y][x] = 0;
      }
    }
  }
  
  find(x, y) {
    // Path compression
    if (this.parent[y][x].x !== x || this.parent[y][x].y !== y) {
      this.parent[y][x] = this.find(this.parent[y][x].x, this.parent[y][x].y);
    }
    return this.parent[y][x];
  }
  
  union(x1, y1, x2, y2) {
    const root1 = this.find(x1, y1);
    const root2 = this.find(x2, y2);
    
    if (root1.x === root2.x && root1.y === root2.y) {
      return false; // Already in same set
    }
    
    // Union by rank
    const rank1 = this.rank[root1.y][root1.x];
    const rank2 = this.rank[root2.y][root2.x];
    
    if (rank1 < rank2) {
      this.parent[root1.y][root1.x] = root2;
    } else if (rank1 > rank2) {
      this.parent[root2.y][root2.x] = root1;
    } else {
      this.parent[root2.y][root2.x] = root1;
      this.rank[root1.y][root1.x]++;
    }
    
    return true;
  }
  
  connected(x1, y1, x2, y2) {
    const root1 = this.find(x1, y1);
    const root2 = this.find(x2, y2);
    return root1.x === root2.x && root1.y === root2.y;
  }
}

/**
 * Randomized Kruskal's Maze Generation Algorithm
 *
 * Treats each cell as a disjoint set, merges sets by randomly removing walls.
 * Now uses efficient union-find with path compression.
 *
 * @param {number} width
 * @param {number} height
 * @returns {Maze}
 */
export function generateKruskals(width, height) {
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

  // Initialize Union-Find structure
  const uf = new UnionFind(width, height);

  // List of all possible walls between neighboring cells
  const walls = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < width - 1) {
        walls.push({ x, y, dir: "E", nx: x + 1, ny: y });
      }
      if (y < height - 1) {
        walls.push({ x, y, dir: "S", nx: x, ny: y + 1 });
      }
    }
  }

  // Shuffle walls
  for (let i = walls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [walls[i], walls[j]] = [walls[j], walls[i]];
  }

  // Kruskal's: remove walls between cells of different sets
  for (const { x, y, dir, nx, ny } of walls) {
    if (!uf.connected(x, y, nx, ny)) {
      // Remove wall between (x, y) and (nx, ny)
      maze.getCell(x, y).removeWall(dir);
      const opposite = { N: "S", E: "W", S: "N", W: "E" }[dir];
      maze.getCell(nx, ny).removeWall(opposite);
      // Merge sets
      uf.union(x, y, nx, ny);
    }
  }

  // Open entrance and exit
  maze.getCell(maze.start.x, maze.start.y).removeWall("W");
  maze.getCell(maze.finish.x, maze.finish.y).removeWall("E");

  return maze;
}
