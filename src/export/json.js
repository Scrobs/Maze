// src/export/json.js

/**
 * Triggers a download of the maze as a JSON file.
 * @param {Maze} maze - Maze object (from src/model/maze.js)
 * @param {string} [filename="maze.json"]
 */
export function saveMazeAsJSON(maze, filename = "maze.json") {
  const data = JSON.stringify(maze, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create and click a hidden link
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
}
