// src/app.js - ČESKÁ VERZE

import { algorithms } from './algorithms/index.js';
import { renderMaze } from './render/canvas.js';
import { saveMazeAsJSON } from './export/json.js';
import { saveMazeAsSVG } from './export/svg.js';
import { ensureSinglePath } from './utils/mazeUtils.js';
import { analyzeDistribution, balanceDistribution } from './utils/distributionUtils.js';

// --- DOM Elementy ---
const form             = document.getElementById('maze-config');
const widthInput       = document.getElementById('maze-width');
const heightInput      = document.getElementById('maze-height');
const algoSelect       = document.getElementById('algorithm');
const singlePathChk    = document.getElementById('single-path');
const balanceChk       = document.getElementById('balance-dist');
const balanceOpts      = document.getElementById('balance-options');
const deadInput        = document.getElementById('dead-end-ratio');
const threeInput       = document.getElementById('three-way-ratio');
const straightInput    = document.getElementById('straight-ratio');
const generateBtn      = document.getElementById('generate-btn');
const clearBtn         = document.getElementById('clear-btn');
const saveBtn          = document.getElementById('save-btn');
const saveSvgBtn       = document.getElementById('save-svg-btn');
const printWorksheetBtn = document.getElementById('print-worksheet-btn');
const canvas           = document.getElementById('maze-canvas');
const errorMessage     = document.getElementById('error-message');
const algorithmOptions = document.getElementById('algorithm-options');

// Algoritmy, které mohou produkovat smyčky
const LOOP_ALGOS = new Set(['braided', 'sparse-loop', 'multi-layer']);

// --- Stav aplikace ---
let currentMaze    = null;
let isGenerating   = false;

// --- Nastavení plátna ---
function setupCanvas() {
  const dpr  = window.devicePixelRatio || 1;
  const size = 600;
  canvas.style.width  = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width  = size * dpr;
  canvas.height = size * dpr;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);
}

// --- Rozšířená validace formuláře ---
function validateDistributionRatios(deadEnds, threeWay, straight) {
  // Validace jednotlivých hodnot
  if (isNaN(deadEnds) || deadEnds < 0 || deadEnds > 1) {
    throw new Error('Poměr mrtvých konců musí být mezi 0 a 1');
  }
  if (isNaN(threeWay) || threeWay < 0 || threeWay > 1) {
    throw new Error('Poměr trojcestných křižovatek musí být mezi 0 a 1');
  }
  if (isNaN(straight) || straight < 0 || straight > 1) {
    throw new Error('Poměr rovných chodeb musí být mezi 0 a 1');
  }

  const sum = deadEnds + threeWay + straight;
  
  // Kontrola, zda nejsou všechny nuly
  if (sum === 0) {
    throw new Error('Alespoň jeden poměr distribuce musí být větší než 0');
  }
  
  // Kontrola, zda součet je přibližně 1.0
  if (Math.abs(sum - 1.0) > 0.05) {
    throw new Error(`Poměry distribuce se sčítají na ${sum.toFixed(2)}, ale měly by se sčítat přibližně na 1,0`);
  }
  
  return {
    deadEnds: deadEnds / sum,   // Normalizace pro malé zaokrouhlovací chyby
    threeWay: threeWay / sum,
    straight: straight / sum
  };
}

// --- Pomocné funkce ---
function getFormConfig() {
  const config = {
    width: parseInt(widthInput.value, 10),
    height: parseInt(heightInput.value, 10),
    algorithm: algoSelect.value,
    singlePath: singlePathChk.checked,
    balanceDist: balanceChk.checked
  };

  // Validace rozměrů
  if (isNaN(config.width) || config.width < 2 || config.width > 100) {
    throw new Error('Šířka musí být mezi 2 a 100');
  }
  if (isNaN(config.height) || config.height < 2 || config.height > 100) {
    throw new Error('Výška musí být mezi 2 a 100');
  }

  // Specifické možnosti algoritmů
  const optsGroup = algorithmOptions.querySelector(
    `.option-group[data-algorithm="${config.algorithm}"]`
  );
  if (optsGroup) {
    config.options = {};
    optsGroup.querySelectorAll('input[type="number"]').forEach(input => {
      const v = parseFloat(input.value);
      if (!isNaN(v)) {
        config.options[input.name] = v;
      }
    });
  }

  // Možnosti vyvažování distribuce - VYLEPŠENÁ VALIDACE
  if (config.balanceDist) {
    const deadEnds = parseFloat(deadInput.value);
    const threeWay = parseFloat(threeInput.value);
    const straight = parseFloat(straightInput.value);
    
    try {
      config.distribution = validateDistributionRatios(deadEnds, threeWay, straight);
    } catch (error) {
      throw new Error(`Validace distribuce selhala: ${error.message}`);
    }
  }

  return config;
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.add('show');
  setTimeout(() => errorMessage.classList.remove('show'), 8000); // Delší zobrazení pro složité chyby
}

function setGenerating(flag) {
  isGenerating = flag;
  generateBtn.disabled = flag;
  generateBtn.textContent = flag ? 'Generuji...' : 'Generovat';
}

// --- Zpracování možností algoritmů ---
function updateAlgorithmOptions() {
  const sel = algoSelect.value;
  algorithmOptions.querySelectorAll('.option-group')
    .forEach(g => g.classList.remove('active'));
  const active = algorithmOptions.querySelector(
    `.option-group[data-algorithm="${sel}"]`
  );
  if (active) active.classList.add('active');
}

// --- Hlavní akce UI ---
async function handleGenerate(e) {
  if (e) e.preventDefault?.();
  if (isGenerating) return;

  try {
    setGenerating(true);
    const config = getFormConfig();

    if (!algorithms[config.algorithm]) {
      throw new Error(`Algoritmus "${config.algorithm}" není dostupný.`);
    }

    // Umožnit aktualizaci UI
    await new Promise(r => requestAnimationFrame(r));

    // Generovat základní bludiště
    console.log(`Generuji ${config.width}x${config.height} bludiště pomocí ${config.algorithm}`);
    currentMaze = config.options
      ? algorithms[config.algorithm](config.width, config.height, config.options)
      : algorithms[config.algorithm](config.width, config.height);

    if (!currentMaze || !currentMaze.isValid()) {
      throw new Error('Vygenerované bludiště je neplatné nebo poškozené.');
    }

    console.log('Základní bludiště úspěšně vygenerováno');

    // OPRAVENÉ POŘADÍ: Vyvážení distribuce PŘED vynucením jedné cesty
    // Toto zabrání tomu, aby balanceDistribution znovu přidalo smyčky poté, co je ensureSinglePath odstraní
    
    // 1. Nejprve vyvážit distribuci (pokud je požadováno)
    if (config.balanceDist) {
      console.log('Vyvažuji distribuci...', config.distribution);
      try {
        balanceDistribution(currentMaze, config.distribution);
        const finalDist = analyzeDistribution(currentMaze);
        console.log('Finální distribuce:', finalDist);
      } catch (error) {
        console.warn('Vyvažování distribuce selhalo:', error.message);
        // Pokračovat přesto - toto je vylepšení, ne kritická funkce
      }
    }

    // 2. Nakonec vynutit jednu cestu (pokud je požadováno) 
    if (config.singlePath && LOOP_ALGOS.has(config.algorithm)) {
      console.log('Vynucuji jedinou cestu řešení...');
      try {
        ensureSinglePath(currentMaze);
        console.log('Vynucení jedné cesty dokončeno');
      } catch (error) {
        console.warn('Vynucení jedné cesty selhalo:', error.message);
        // Pokračovat přesto - bludiště je stále platné
      }
    }

    // Finální validace
    if (!currentMaze.isValid()) {
      throw new Error('Bludiště se stalo neplatným po post-processingu.');
    }

    // Vykreslit finální bludiště
    renderMaze(currentMaze, canvas);
    console.log('Bludiště úspěšně vykresleno');

  } catch (err) {
    console.error('Generování bludiště selhalo:', err);
    showError(err.message || 'Při generování bludiště došlo k chybě.');
    currentMaze = null;
    
    // Vymazat plátno při chybě
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } finally {
    setGenerating(false);
  }
}

function handleClear(e) {
  if (e) e.preventDefault?.();
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformace
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentMaze = null;
  console.log('Plátno vymazáno');
}

// --- PWA Shortcut Handler ---
function handlePWAShortcuts() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'generate') {
    setTimeout(() => {
      handleGenerate();
    }, 500);
  } else if (action === 'pdf') {
    setTimeout(() => {
      handlePrintWorksheet();
    }, 500);
  }
  
  // Vyčistit URL parametry
  if (action) {
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }
}

// --- Offline Storage pro uložená bludiště ---
const OFFLINE_STORAGE_KEY = 'saved_mazes';

function saveToOfflineStorage(maze, name) {
  try {
    const savedMazes = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
    const mazeData = {
      id: Date.now(),
      name: name || `Bludiště ${new Date().toLocaleString('cs-CZ')}`,
      data: maze.serialize ? maze.serialize() : maze,
      created: new Date().toISOString(),
      algorithm: algoSelect.value,
      dimensions: `${maze.width}×${maze.height}`
    };
    
    savedMazes.unshift(mazeData);
    
    // Zachovat pouze posledních 10 bludišť
    if (savedMazes.length > 10) {
      savedMazes.splice(10);
    }
    
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(savedMazes));
    console.log('💾 Bludiště uloženo offline:', mazeData.name);
    return true;
  } catch (error) {
    console.error('❌ Offline uložení selhalo:', error);
    return false;
  }
}

function getOfflineStoredMazes() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('❌ Načítání offline uložených bludišť selhalo:', error);
    return [];
  }
}

// --- Vylepšená funkce pro uložení ---
function handleSave(e) {
  if (e) e.preventDefault?.();
  if (!currentMaze) {
    showError('Žádné bludiště k uložení! Nejprve vygenerujte bludiště.');
    return;
  }
  try {
    // Offline backup
    saveToOfflineStorage(currentMaze);
    
    // Standardní JSON export
    saveMazeAsJSON(currentMaze);
    console.log('Bludiště uloženo jako JSON + offline backup');
  } catch (error) {
    console.error('Uložení JSON selhalo:', error);
    showError('Uložení bludiště jako JSON selhalo.');
  }
}

function handleSaveSVG(e) {
  if (e) e.preventDefault?.();
  if (!currentMaze) {
    showError('Žádné bludiště k exportu! Nejprve vygenerujte bludiště.');
    return;
  }
  try {
    saveMazeAsSVG(currentMaze);
    console.log('Bludiště exportováno jako SVG');
  } catch (error) {
    console.error('Export SVG selhal:', error);
    showError('Export bludiště jako SVG selhal.');
  }
}

// Jednoduchý BFS algoritmus pro ověření řešitelnosti bludiště
function isMazeSolvable(maze) {
  if (!maze || !maze.start || !maze.finish) {
    console.warn('Bludiště nemá nastaven start nebo cíl');
    return false;
  }

  const { start, finish, width, height } = maze;
  const visited = new Set();
  const queue = [start];
  
  // BFS pro nalezení cesty od startu k cíli
  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Našli jsme cíl?
    if (current.x === finish.x && current.y === finish.y) {
      return true;
    }
    
    // Prozkoumat sousední buňky
    const cell = maze.getCell(current.x, current.y);
    if (!cell) continue;
    
    // Zkontrolovat všechny směry
    const directions = [
      { dx: 0, dy: -1, wall: 'N' }, // Sever
      { dx: 1, dy: 0, wall: 'E' },  // Východ
      { dx: 0, dy: 1, wall: 'S' },  // Jih
      { dx: -1, dy: 0, wall: 'W' }  // Západ
    ];
    
    for (const dir of directions) {
      // Pokud není stěna v tomto směru, můžeme projít
      if (!cell.hasWall(dir.wall)) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        
        // Ověřit, že jsme v mezích bludiště
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborKey = `${nx},${ny}`;
          if (!visited.has(neighborKey)) {
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
  
  return false; // Cesta nenalezena
}

async function handlePrintWorksheet(e) {
  if (e) e.preventDefault?.();
  
  try {
    setGenerating(true);
    printWorksheetBtn.textContent = 'Generuji PDF...';
    
    console.log('Generuji tiskový arch se 3 bludišti...');
    
    let easyMaze, mediumMaze, hardMaze;
    let attempts = 0;
    const maxAttempts = 10; // Bezpečnostní limit
    
    // Generovat a ověřovat bludiště dokud nejsou všechna řešitelná
    do {
      attempts++;
      console.log(`Pokus ${attempts}: Generuji a ověřuji bludiště...`);
      
      // Generovat 3 PERFEKTNÍ bludiště s různými obtížnostmi a velikostmi
      easyMaze = algorithms['sidewinder'](15, 15);           
      mediumMaze = algorithms['recursive-backtracker'](30, 30);  
      hardMaze = algorithms['recursive-backtracker'](50, 50);    
      
      // Ověřit řešitelnost každého bludiště
      const easyValid = isMazeSolvable(easyMaze);
      const mediumValid = isMazeSolvable(mediumMaze);
      const hardValid = isMazeSolvable(hardMaze);
      
      console.log(`Ověření řešitelnosti: Snadné=${easyValid}, Střední=${mediumValid}, Těžké=${hardValid}`);
      
      if (easyValid && mediumValid && hardValid) {
        console.log('✅ Všechna bludiště jsou řešitelná!');
        break;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error(`Nepodařilo se vygenerovat řešitelná bludiště po ${maxAttempts} pokusech`);
      }
      
      console.warn(`❌ Některá bludiště nejsou řešitelná, pokus ${attempts}/${maxAttempts}`);
      
    } while (attempts < maxAttempts);
    
    // Vytvořit printovatelnou HTML stránku
    const printableHTML = createPrintableWorksheet(easyMaze, mediumMaze, hardMaze);
    
    // Otevřít v novém okně pro tisk s čistými nastaveními
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printableHTML);
    printWindow.document.close();
    
    // Automaticky spustit tisk s čistými nastaveními
    setTimeout(() => {
      // Nastavit browser na minimální metadata
      printWindow.focus();
      printWindow.print();
      
      // Zavřít okno po tisku
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
    
    console.log('Tiskový arch vygenerován - pro nejčistší tisk vypněte hlavičky a patičky v nastavení tisku');
    
  } catch (error) {
    console.error('Generování tiskového archu selhalo:', error);
    showError('Generování PDF selhalo: ' + error.message);
  } finally {
    setGenerating(false);
    printWorksheetBtn.textContent = '📄 Stáhnout tiskový arch PDF';
  }
}

function createPrintableWorksheet(easyMaze, mediumMaze, hardMaze) {
  // Generovat SVG pro každé bludiště s proporčními velikostmi
  const easySVG = generateMazeSVG(easyMaze, 'SNADNÉ (15×15)', 50);    // 50mm - malé a rychlé
  const mediumSVG = generateMazeSVG(mediumMaze, 'STŘEDNÍ (30×30)', 70); // 70mm - střední velikost
  const hardSVG = generateMazeSVG(hardMaze, 'TĚŽKÉ (50×50)', 100);      // 100mm - velké a detailní
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bludiště - Tiskový arch</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background: white;
      width: 194mm;
      height: 281mm;
      display: flex;
      flex-direction: column;
    }
    .title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 2mm 0 3mm 0;
      color: #000;
      line-height: 1.2;
    }
    .mazes-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      align-items: center;
      padding: 1mm 0;
    }
    .maze-container {
      text-align: center;
      margin: 1mm 0;
    }
    .maze-title {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 2mm;
      color: #333;
      line-height: 1;
    }
    .maze-svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .instructions {
      text-align: center;
      font-size: 8px;
      color: #666;
      margin-top: 2mm;
      padding: 1.5mm;
      border-top: 0.5px solid #ccc;
      line-height: 1.3;
    }
    @media print {
      body { 
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* ODSTRANIT VŠECHNY BROWSER METADATA */
      @page {
        margin: 0;
        size: A4;
      }
      body {
        margin: 8mm;
        -webkit-print-color-adjust: exact;
      }
      /* Skrýt vše kromě našeho obsahu */
      * {
        visibility: hidden;
      }
      body, body * {
        visibility: visible;
      }
      /* Potlačit hlavičky a patičky */
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- INSTRUKCE PRO ČISTÝ TISK -->
  <div style="position: absolute; top: -1000px; left: -1000px; font-size: 1px; color: white;">
    Pro nejlepší výsledky: V dialogu tisku vypněte "Hlavičky a patičky" / "Headers and footers"
  </div>
  
  <div class="title">BLUDIŠTĚ</div>
  
  <div class="mazes-grid">
    <div class="maze-container">
      <div class="maze-title">🟢 ${easySVG.title}</div>
      <div style="width: ${easySVG.size}mm; height: ${easySVG.size}mm; margin: 0 auto; border: 1px solid #000;">
        ${easySVG.svg}
      </div>
    </div>
    
    <div class="maze-container">
      <div class="maze-title">🟡 ${mediumSVG.title}</div>
      <div style="width: ${mediumSVG.size}mm; height: ${mediumSVG.size}mm; margin: 0 auto; border: 1px solid #000;">
        ${mediumSVG.svg}
      </div>
    </div>
    
    <div class="maze-container">
      <div class="maze-title">🔴 ${hardSVG.title}</div>
      <div style="width: ${hardSVG.size}mm; height: ${hardSVG.size}mm; margin: 0 auto; border: 1px solid #000;">
        ${hardSVG.svg}
      </div>
    </div>
  </div>
  
  <div class="instructions">
    🟢 S = START | 🔴 C = CÍL<br>
    Najděte jedinou cestu od startu k cíli! Každé bludiště má pouze jedno řešení.
  </div>
</body>
</html>`;
}

function generateMazeSVG(maze, title, physicalSize) {
  const size = physicalSize; // mm - different sizes based on complexity
  const margin = 1;
  const wallColor = "#000";
  const startColor = "#26a65b";
  const finishColor = "#e17055";
  
  const { width: cols, height: rows } = maze;
  const availableSize = size - (margin * 2);
  const cellSize = availableSize / Math.max(cols, rows);
  
  // Adjust wall width based on cell size for consistent appearance
  let wallWidth;
  if (cellSize >= 4) wallWidth = 0.8;      // Large cells - thick lines
  else if (cellSize >= 2) wallWidth = 0.5; // Medium cells - medium lines  
  else wallWidth = 0.4;                    // Small cells - thin lines
  
  const mazeWidth = cols * cellSize;
  const mazeHeight = rows * cellSize;
  const xOffset = margin + (availableSize - mazeWidth) / 2;
  const yOffset = margin + (availableSize - mazeHeight) / 2;
  
  let svg = `<svg class="maze-svg" width="${size}mm" height="${size}mm" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;
  
  // VYLEPŠENÉ start a finish značky - adaptivní velikost
  if (maze.start) {
    const sx = xOffset + maze.start.x * cellSize;
    const sy = yOffset + maze.start.y * cellSize;
    // Celá buňka vyplněná
    svg += `<rect x="${sx}" y="${sy}" width="${cellSize}" height="${cellSize}" fill="${startColor}" fill-opacity="0.7"/>`;
    // Bílé "S" pro START - adaptivní velikost písma
    const fontSize = Math.max(cellSize * 0.6, 1.2);
    svg += `<text x="${sx + cellSize/2}" y="${sy + cellSize/2 + fontSize/3}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="white">S</text>`;
  }
  
  if (maze.finish) {
    const fx = xOffset + maze.finish.x * cellSize;
    const fy = yOffset + maze.finish.y * cellSize;
    // Celá buňka vyplněná
    svg += `<rect x="${fx}" y="${fy}" width="${cellSize}" height="${cellSize}" fill="${finishColor}" fill-opacity="0.7"/>`;
    // Bílé "C" pro CÍL - adaptivní velikost písma
    const fontSize = Math.max(cellSize * 0.6, 1.2);
    svg += `<text x="${fx + cellSize/2}" y="${fy + cellSize/2 + fontSize/3}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="white">C</text>`;
  }
  
  // Stěny - optimalizované pro různé velikosti
  svg += `<g stroke="${wallColor}" stroke-width="${wallWidth}" stroke-linecap="square" fill="none">`;
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.getCell(x, y);
      if (!cell) continue;
      
      const x1 = xOffset + x * cellSize;
      const y1 = yOffset + y * cellSize;
      const x2 = x1 + cellSize;
      const y2 = y1 + cellSize;
      
      // Nakreslit každou stěnu pouze jednou
      if (cell.hasWall("N")) {
        svg += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y1.toFixed(2)}"/>`;
      }
      if (cell.hasWall("E")) {
        svg += `<line x1="${x2.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
      }
      if (cell.hasWall("S")) {
        svg += `<line x1="${x2.toFixed(2)}" y1="${y2.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
      }
      if (cell.hasWall("W")) {
        svg += `<line x1="${x1.toFixed(2)}" y1="${y2.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}"/>`;
      }
    }
  }
  
  svg += `</g></svg>`;
  
  return { svg, title, size };
}

// --- Event Listenery ---
generateBtn.addEventListener('click', handleGenerate);
clearBtn.addEventListener('click', handleClear);
saveBtn.addEventListener('click', handleSave);
saveSvgBtn.addEventListener('click', handleSaveSVG);
printWorksheetBtn.addEventListener('click', handlePrintWorksheet);
form.addEventListener('submit', handleGenerate);
algoSelect.addEventListener('change', updateAlgorithmOptions);

// Přepnutí panelu možností distribuce
balanceChk.addEventListener('change', () => {
  balanceOpts.classList.toggle('active', balanceChk.checked);
});

// Aktualizace zobrazení poměrů distribuce v reálném čase pro pomoc uživateli udržet součet = 1.0
function updateRatioDisplay() {
  const dead = parseFloat(deadInput.value) || 0;
  const three = parseFloat(threeInput.value) || 0;
  const straight = parseFloat(straightInput.value) || 0;
  const sum = dead + three + straight;
  
  // Vizuální zpětná vazba pro součet poměrů (volitelné vylepšení)
  if (Math.abs(sum - 1.0) > 0.05) {
    balanceOpts.style.backgroundColor = '#fff5f5'; // Světle červená nápověda
  } else {
    balanceOpts.style.backgroundColor = '#f8f8f8'; // Normální
  }
}

deadInput.addEventListener('input', updateRatioDisplay);
threeInput.addEventListener('input', updateRatioDisplay);
straightInput.addEventListener('input', updateRatioDisplay);

// Responzivní zpracování plátna
window.addEventListener('resize', () => {
  clearTimeout(window._resizeTimeout);
  window._resizeTimeout = setTimeout(() => {
    setupCanvas();
    if (currentMaze) {
      try {
        renderMaze(currentMaze, canvas);
      } catch (error) {
        console.warn('Překreslení po změně velikosti selhalo:', error);
      }
    }
  }, 250);
});

// --- Inicializace ---
function initialize() {
  try {
    setupCanvas();
    updateAlgorithmOptions();
    updateRatioDisplay();
    
    // PWA Shortcuts handler
    handlePWAShortcuts();
    
    // Automaticky vygenerovat demo bludiště po krátké prodlevě
    setTimeout(() => {
      if (!currentMaze) { // Pouze pokud ještě neexistuje žádné bludiště
        handleGenerate();
      }
    }, 100);
    
    console.log('Generátor bludišť inicializován (PWA režim)');
    
    // Zobrazit počet offline uložených bludišť
    const offlineMazes = getOfflineStoredMazes();
    if (offlineMazes.length > 0) {
      console.log(`📱 Nalezeno ${offlineMazes.length} offline uložených bludišť`);
    }
    
  } catch (error) {
    console.error('Inicializace selhala:', error);
    showError('Aplikace se nepodařilo správně inicializovat.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// --- Debug Helper + PWA Tools ---
window.__maze = () => currentMaze;
window.__debug = {
  regenerate: handleGenerate,
  clear: handleClear,
  analyze: () => currentMaze ? analyzeDistribution(currentMaze) : null,
  // PWA debug funkce
  offlineStorage: {
    list: getOfflineStoredMazes,
    clear: () => localStorage.removeItem(OFFLINE_STORAGE_KEY),
    save: (name) => currentMaze ? saveToOfflineStorage(currentMaze, name) : 'Žádné bludiště k uložení'
  },
  pwa: {
    isInstalled: () => window.matchMedia('(display-mode: standalone)').matches,
    isOnline: () => navigator.onLine,
    serviceWorker: () => navigator.serviceWorker.controller,
    cache: async () => {
      if ('caches' in window) {
        const names = await caches.keys();
        return names;
      }
      return 'Cache API není podporováno';
    }
  }
};