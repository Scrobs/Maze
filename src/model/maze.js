// src/model/maze.js

export class MazeCell {
  /**
   * @param {Set<string>|string[]} walls - Sides with walls: "N", "E", "S", "W"
   */
  constructor(walls = []) {
    // Use a Set for fast lookup and to avoid duplicates
    this.walls = new Set(walls);
  }

  /**
   * Returns true if this cell has a wall in the given direction.
   * @param {"N"|"E"|"S"|"W"} dir
   * @returns {boolean}
   */
  hasWall(dir) {
    return this.walls.has(dir);
  }

  /**
   * Add a wall in a direction.
   * @param {"N"|"E"|"S"|"W"} dir
   */
  addWall(dir) {
    this.walls.add(dir);
  }

  /**
   * Remove a wall in a direction.
   * @param {"N"|"E"|"S"|"W"} dir
   */
  removeWall(dir) {
    this.walls.delete(dir);
  }

  /**
   * Returns an array of directions that have walls.
   * @returns {string[]}
   */
  getWallArray() {
    return Array.from(this.walls);
  }

  /**
   * Serialize for JSON.
   */
  toJSON() {
    return { walls: this.getWallArray() };
  }

  /**
   * Build from plain object (e.g., after JSON.parse).
   */
  static from(obj) {
    return new MazeCell(obj.walls || []);
  }
}

export class Maze {
  /**
   * @param {number} width - Number of columns
   * @param {number} height - Number of rows
   * @param {{x: number, y: number}} start - Entry position
   * @param {{x: number, y: number}} finish - Exit position
   * @param {MazeCell[][]} [cells] - 2D array of MazeCell objects [row][col]
   */
  constructor(width, height, start = {x:0,y:0}, finish = {x:width-1,y:height-1}, cells = null) {
    // Validate dimensions
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new TypeError('Width and height must be integers');
    }
    if (width < 2 || height < 2) {
      throw new RangeError('Width and height must be at least 2');
    }
    if (width > 1000 || height > 1000) {
      throw new RangeError('Width and height must not exceed 1000');
    }
    
    this.width = width;
    this.height = height;
    this.start = { ...start };
    this.finish = { ...finish };
    
    // Validate start/finish positions
    if (!this._isValidPosition(this.start)) {
      throw new RangeError('Invalid start position');
    }
    if (!this._isValidPosition(this.finish)) {
      throw new RangeError('Invalid finish position');
    }
    
    // Create empty grid if not supplied
    if (cells) {
      this.cells = cells;
    } else {
      this.cells = [];
      for (let y = 0; y < height; y++) {
        this.cells[y] = [];
        for (let x = 0; x < width; x++) {
          this.cells[y][x] = new MazeCell();
        }
      }
    }
  }

  /**
   * Check if a position is valid within the maze bounds
   * @private
   */
  _isValidPosition(pos) {
    return pos && 
           typeof pos.x === 'number' && 
           typeof pos.y === 'number' &&
           pos.x >= 0 && 
           pos.x < this.width && 
           pos.y >= 0 && 
           pos.y < this.height;
  }

  /**
   * Get the MazeCell at (x, y)
   */
  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.cells[y][x];
  }

  /**
   * Set the MazeCell at (x, y)
   * @param {number} x
   * @param {number} y
   * @param {MazeCell} cell
   */
  setCell(x, y, cell) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    if (!(cell instanceof MazeCell)) {
      throw new TypeError('Cell must be an instance of MazeCell');
    }
    this.cells[y][x] = cell;
  }

  /**
   * Returns plain object for JSON serialization.
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      cells: this.cells.map(row => row.map(cell => cell.toJSON())),
      start: { ...this.start },
      finish: { ...this.finish },
      // Include metadata if present
      ...(this._portals && { _portals: this._portals }),
      ...(this._layers && { _layers: this._layers }),
      ...(this._widthPerLayer && { _widthPerLayer: this._widthPerLayer }),
      ...(this._heightPerLayer && { _heightPerLayer: this._heightPerLayer })
    };
  }

  /**
   * Build Maze from plain object (e.g., after JSON.parse).
   * @param {object} obj
   * @returns {Maze}
   */
  static from(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new TypeError('Invalid maze object');
    }
    
    const cells = obj.cells.map(
      row => row.map(cellObj => MazeCell.from(cellObj))
    );
    const maze = new Maze(obj.width, obj.height, obj.start, obj.finish, cells);
    
    // Restore metadata if present
    if (obj._portals) maze._portals = obj._portals;
    if (obj._layers) maze._layers = obj._layers;
    if (obj._widthPerLayer) maze._widthPerLayer = obj._widthPerLayer;
    if (obj._heightPerLayer) maze._heightPerLayer = obj._heightPerLayer;
    
    return maze;
  }

  /**
   * Validate structure (comprehensive checks).
   * @returns {boolean}
   */
  isValid() {
    try {
      // Check basic properties
      if (!Number.isInteger(this.width) || !Number.isInteger(this.height) ||
          this.width < 2 || this.height < 2) return false;
      
      // Check cells array structure
      if (!Array.isArray(this.cells) || this.cells.length !== this.height) return false;
      
      for (let y = 0; y < this.height; y++) {
        if (!Array.isArray(this.cells[y]) || this.cells[y].length !== this.width) return false;
        for (let x = 0; x < this.width; x++) {
          if (!(this.cells[y][x] instanceof MazeCell)) return false;
        }
      }
      
      // Check start and finish
      if (!this._isValidPosition(this.start) || !this._isValidPosition(this.finish)) return false;
      
      // Basic connectivity check: at least one cell should have fewer than 4 walls
      let hasOpenCell = false;
      for (let y = 0; y < this.height && !hasOpenCell; y++) {
        for (let x = 0; x < this.width && !hasOpenCell; x++) {
          if (this.cells[y][x].getWallArray().length < 4) {
            hasOpenCell = true;
          }
        }
      }
      
      return hasOpenCell;
    } catch (e) {
      return false;
    }
  }
}
