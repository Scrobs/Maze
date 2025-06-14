// src/utils/distributionUtils.js - ČESKÁ VERZE

/**
 * Analyzuje distribuci stupňů bludiště.
 * Vrací podíly pro mrtvé konce (stupeň=1), rovné (stupeň=2),
 * trojcestné (stupeň=3) a čtyřcestné (stupeň=4).
 * 
 * @param {Maze} maze - Bludiště k analýze
 * @returns {Object} Poměry distribuce
 */
export function analyzeDistribution(maze) {
    const counts = { deadEnds: 0, straight: 0, threeWay: 0, fourWay: 0 };
    const dirs = ['N','E','S','W'];
  
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) continue; // Bezpečnostní kontrola
        
        const openCount = dirs.filter(d => !cell.hasWall(d)).length;
        if (openCount === 1) counts.deadEnds++;
        else if (openCount === 2) counts.straight++;
        else if (openCount === 3) counts.threeWay++;
        else if (openCount === 4) counts.fourWay++;
      }
    }
  
    const totalCells = maze.width * maze.height;
    return {
      deadEnds: counts.deadEnds / totalCells,
      straight: counts.straight / totalCells,
      threeWay: counts.threeWay / totalCells,
      fourWay: counts.fourWay / totalCells,
      // Zahrnout surové počty pro ladění
      _counts: counts,
      _totalCells: totalCells
    };
  }
  
  /**
   * Kontrola, zda je bludiště plně propojené pomocí BFS ze startovní pozice
   * 
   * @param {Maze} maze - Bludiště ke kontrole
   * @returns {boolean} True, pokud jsou všechny buňky dosažitelné ze startu
   */
  function isConnected(maze) {
    if (!maze.start) {
      console.warn('Bludiště nemá startovní pozici, nelze zkontrolovat propojení');
      return false;
    }
  
    const visited = Array.from({ length: maze.height }, () => Array(maze.width).fill(false));
    const queue = [{ x: maze.start.x, y: maze.start.y }];
    visited[maze.start.y][maze.start.x] = true;
    let visitedCount = 1;
  
    const dirs = ['N', 'E', 'S', 'W'];
    const deltas = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const cell = maze.getCell(x, y);
      if (!cell) continue;
  
      for (const dir of dirs) {
        if (!cell.hasWall(dir)) {
          const [dx, dy] = deltas[dir];
          const nx = x + dx, ny = y + dy;
          
          // Kontrola hranic
          if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height && !visited[ny][nx]) {
            visited[ny][nx] = true;
            visitedCount++;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
  
    const isFullyConnected = visitedCount === maze.width * maze.height;
    if (!isFullyConnected) {
      console.warn(`Kontrola propojení selhala: ${visitedCount}/${maze.width * maze.height} buněk dosažitelných`);
    }
    
    return isFullyConnected;
  }
  
  /**
   * Získat všechny buňky v bludišti, které mají přesně zadaný stupeň (počet otevřených průchodů)
   * 
   * @param {Maze} maze - Bludiště k prohledání
   * @param {number} degree - Počet otevřených průchodů (1=mrtvý konec, 2=chodba, 3=křižovatka, 4=kříž)
   * @returns {Array<{x: number, y: number}>} Pole souřadnic buněk
   */
  function getCellsOfDegree(maze, degree) {
    const cells = [];
    const dirs = ['N','E','S','W'];
  
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.getCell(x, y);
        if (!cell) continue;
        
        const openCount = dirs.filter(d => !cell.hasWall(d)).length;
        if (openCount === degree) {
          cells.push({ x, y });
        }
      }
    }
    
    return cells;
  }
  
  /**
   * OPRAVENO: Vyvažuje bludiště směrem k cílovým poměrům bezpečně.
   * Provádí pouze změny, které zachovávají propojení POUZE PŘIDÁVÁNÍM spojení, nikdy je neodstraňuje.
   * 
   * @param {Maze} maze - Bludiště k úpravě
   * @param {{deadEnds:number, threeWay:number, straight:number}} target - Cílové poměry distribuce
   */
  export function balanceDistribution(maze, target) {
    if (!maze || !target) {
      throw new Error('Neplatné bludiště nebo cílová distribuce');
    }
  
    const { deadEnds: targetDead, threeWay: targetThree } = target;
    let currentDist = analyzeDistribution(maze);
    
    console.log('Počáteční distribuce:', currentDist);
    console.log('Cílová distribuce:', target);
  
    const dirs = ['N','E','S','W'];
    const deltas = { N:[0,-1], E:[1,0], S:[0,1], W:[-1,0] };
    const opposite = { N:'S', E:'W', S:'N', W:'E' };
  
    // Bezpečnost: Ověřit, že bludiště je propojené, než začneme
    if (!isConnected(maze)) {
      throw new Error('Bludiště není propojené před vyvažováním distribuce');
    }
  
    // 1) BEZPEČNĚ snížit mrtvé konce jejich propojením se sousedy
    const maxDeadEndReductions = Math.max(0, Math.floor((currentDist.deadEnds - targetDead) * maze.width * maze.height));
    let deadEndReductions = 0;
    let attempts = 0;
    const maxAttempts = maxDeadEndReductions * 3; // Zabránit nekonečným smyčkám
  
    console.log(`Pokus o snížení ${maxDeadEndReductions} mrtvých konců`);
  
    while (currentDist.deadEnds > targetDead && deadEndReductions < maxDeadEndReductions && attempts < maxAttempts) {
      attempts++;
      const deadEndCells = getCellsOfDegree(maze, 1); // stupeň 1 = mrtvý konec
      
      if (deadEndCells.length === 0) {
        console.log('Žádné další mrtvé konce ke snížení');
        break;
      }
  
      // Vybrat náhodný mrtvý konec
      const { x, y } = deadEndCells[Math.floor(Math.random() * deadEndCells.length)];
      const cell = maze.getCell(x, y);
      if (!cell) continue;
  
      let connectionAdded = false;
  
      // Pokusit se připojit k sousedovi se stěnou
      const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
      for (const dir of shuffledDirs) {
        if (cell.hasWall(dir)) {
          const [dx, dy] = deltas[dir];
          const nx = x + dx, ny = y + dy;
          
          // Kontrola hranic
          if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) continue;
          
          const neighbor = maze.getCell(nx, ny);
          if (!neighbor || !neighbor.hasWall(opposite[dir])) continue;
  
          // Přidat spojení (toto může pouze zlepšit propojení, nikdy jej nepřeruší)
          cell.removeWall(dir);
          neighbor.removeWall(opposite[dir]);
          
          connectionAdded = true;
          deadEndReductions++;
          break;
        }
      }
  
      if (connectionAdded) {
        currentDist = analyzeDistribution(maze); // Aktualizovat distribuci
      }
    }
  
    console.log(`Sníženo ${deadEndReductions} mrtvých konců v ${attempts} pokusech`);
  
    // 2) BEZPEČNĚ zvýšit trojcestné křižovatky přidáním větví k rovným chodbám
    const maxThreeWayIncrease = Math.max(0, Math.floor((targetThree - currentDist.threeWay) * maze.width * maze.height));
    let threeWayIncrease = 0;
    attempts = 0;
    const maxThreeWayAttempts = maxThreeWayIncrease * 3;
  
    console.log(`Pokus o přidání ${maxThreeWayIncrease} trojcestných křižovatek`);
  
    while (currentDist.threeWay < targetThree && threeWayIncrease < maxThreeWayIncrease && attempts < maxThreeWayAttempts) {
      attempts++;
      const straightCells = getCellsOfDegree(maze, 2); // stupeň 2 = rovná chodba
      
      if (straightCells.length === 0) {
        console.log('Žádné další rovné chodby k větvení');
        break;
      }
  
      // Vybrat náhodnou rovnou chodbu
      const { x, y } = straightCells[Math.floor(Math.random() * straightCells.length)];
      const cell = maze.getCell(x, y);
      if (!cell) continue;
  
      let branchAdded = false;
  
      // Pokusit se přidat větev v směru se stěnou
      const walledDirs = dirs.filter(d => cell.hasWall(d));
      if (walledDirs.length === 0) continue;
  
      const shuffledWalledDirs = walledDirs.sort(() => Math.random() - 0.5);
      for (const dir of shuffledWalledDirs) {
        const [dx, dy] = deltas[dir];
        const nx = x + dx, ny = y + dy;
        
        // Kontrola hranic
        if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) continue;
        
        const neighbor = maze.getCell(nx, ny);
        if (!neighbor || !neighbor.hasWall(opposite[dir])) continue;
  
        // Přidat větev (opět, toto může pouze zlepšit propojení)
        cell.removeWall(dir);
        neighbor.removeWall(opposite[dir]);
        
        branchAdded = true;
        threeWayIncrease++;
        break;
      }
  
      if (branchAdded) {
        currentDist = analyzeDistribution(maze); // Aktualizovat distribuci
      }
    }
  
    console.log(`Přidáno ${threeWayIncrease} trojcestných křižovatek v ${attempts} pokusech`);
  
    // Finální ověření
    const finalDist = analyzeDistribution(maze);
    console.log('Finální distribuce:', finalDist);
  
    if (!isConnected(maze)) {
      throw new Error('Vyvažování distribuce přerušilo propojení bludiště!');
    }
  
    console.log('Vyvažování distribuce úspěšně dokončeno');
  }