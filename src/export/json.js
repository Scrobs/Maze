// src/export/json.js

/**
 * Spustí stažení bludiště jako JSON soubor.
 * @param {Maze} maze - Objekt bludiště (z src/model/maze.js)
 * @param {string} [filename="bludiste.json"]
 */
export function saveMazeAsJSON(maze, filename = "bludiste.json") {
  const data = JSON.stringify(maze, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Vytvořit a kliknout na skrytý odkaz
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Vyčištění
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
}