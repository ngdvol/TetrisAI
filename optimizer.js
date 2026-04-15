// === DBS Tetris AI Optimizer === Nguyen An Loc

async function runTetrisOptimizer({ level = 1, seed = 42, timeMinutes = 1 }) {
  console.log(`%c🚀 Starting Ultimate AI Optimizer...`, 'color: #00FFFF; font-size: 18px; font-weight: bold;');
  console.log(`Level: ${level} | Seed: ${seed} | Time Limit: ${timeMinutes} minute(s)`);
  console.log("The browser page WILL FREEZE while it is calculating. This is normal. Let it run.");

  // Helper for random ranges
  const randNum = (min, max, decimals = 2) => {
    let raw = Math.random() * (max - min) + min;
    return parseFloat(raw.toFixed(decimals));
  };
  const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const startTime = Date.now();
  const maxTimeMs = timeMinutes * 60 * 1000;
  
  let bestLines = -1;
  let bestConfig = null;
  const history = [];
  
  // Backup game state
  const originalFormulas = { ...customFormulas };
  const originalScorer = customScorerFn;
  
  // To avoid truly freezing the browser to death, we break execution into micro-chunks
  let iterations = 0;
  
  console.log("%cStarting search loop... check back soon!", "color: yellow;");

  function runSearchChunk() {
    const candidate = {
      weights: {
        lines: randNum(0.0, 2.0, 1),
        holes: randNum(-2.0, 0.0, 1),
        bumpiness: randNum(-1.0, 0.0, 1),
        height: randNum(-0.10, 0.0, 2),
        valley: randNum(-1.0, 0.0, 1)
      },
      formulas: { lines: '', holes: '', bump: '', height: '', valley: '', total: '' },
      scorer: 'return 0;'
    };

    // LEVEL 2: Add Formula Mutations
    // GUI only supports: numbers, variables, +, -, *, /, ^, parentheses
    if (level >= 2) {
      candidate.formulas.holes = randChoice([
        '',
        'holes * wHoles * 3',
        'holes * holes * wHoles * 2',
        'holes * holes * wHoles * 5',
        'holes * holes * holes * wHoles',
        'holes ^ 2 * wHoles * 3',
        'holes * wHoles * 10',
        'holes ^ 2 * wHoles'
      ]);
      candidate.formulas.height = randChoice([
        '',
        'height * wHeight * 2',
        'height * height * wHeight',
        'height ^ 2 * wHeight * 0.01',
        'height * wHeight * 5',
        'height ^ 2 * wHeight * 0.005'
      ]);
      candidate.formulas.bump = randChoice([
        '',
        'bump * wBump * 1.5',
        'bump * wBump * 2',
        'bump ^ 2 * wBump',
        'bump * bump * wBump * 0.5'
      ]);
      candidate.formulas.valley = randChoice([
        '',
        'valley * valley * wValley * 0.5',
        'valley ^ 2 * wValley',
        'valley * wValley * 2'
      ]);
    }

    // LEVEL 3: Add Scorer JS Mutations
    // KEY INSIGHT: The scorer must add NEW intelligence, NOT re-penalize holes/height
    // (the sliders + formulas already handle holes & height)
    if (level >= 3) {
      const scorerTemplates = [
        // Template A: Tetris bonus only (minimal, let formulas do the rest)
        (params) => `
          if (linesCleared === 4) return ${params.tetrisBonus};
          if (linesCleared === 3) return ${params.tripleBonus};
          if (linesCleared === 2) return ${params.doubleBonus};
          return 0;
        `,
        // Template B: Row completeness (reward nearly-full rows)
        (params) => `
          let score = 0;
          if (linesCleared === 4) score += ${params.tetrisBonus};
          else if (linesCleared > 0) score += ${params.doubleBonus};
          for (let r = 0; r < 20; r++) {
            let filled = 0;
            for (let c = 0; c < 10; c++) { if (board[r][c] !== 0) filled++; }
            if (filled === 9) score += ${params.nineBonus};
            else if (filled === 8) score += ${params.eightBonus};
          }
          return score;
        `,
        // Template C: Well strategy (keep one column clear for I-pieces)
        (params) => `
          let score = 0;
          if (linesCleared === 4) score += ${params.tetrisBonus};
          else if (linesCleared > 0) score += 10;
          for (let r = 0; r < 20; r++) {
            if (board[r][${params.wellCol}] !== 0) score -= ${params.wellPenalty};
          }
          return score;
        `,
        // Template D: Bottom density (reward filling from the bottom up)
        (params) => `
          let score = 0;
          if (linesCleared === 4) score += ${params.tetrisBonus};
          else if (linesCleared > 0) score += 15;
          for (let r = 15; r < 20; r++) {
            let filled = 0;
            for (let c = 0; c < 10; c++) { if (board[r][c] !== 0) filled++; }
            score += filled * ${params.densityBonus};
          }
          return score;
        `,
        // Template E: Flatness bonus (reward smooth surface)
        (params) => `
          let score = 0;
          if (linesCleared === 4) score += ${params.tetrisBonus};
          else if (linesCleared > 0) score += 15;
          let minH = 20, maxH = 0;
          for (let c = 0; c < 10; c++) {
            let h = 0;
            for (let r = 0; r < 20; r++) { if (board[r][c]) { h = 20 - r; break; } }
            if (h > maxH) maxH = h;
            if (h < minH) minH = h;
          }
          if (maxH > 0) score -= (maxH - minH) * ${params.flatPenalty};
          return score;
        `,
        // Template F: Pure line clear reward (no board analysis at all)
        (params) => `
          return linesCleared * linesCleared * ${params.lineMultiplier};
        `
      ];

      const params = {
        tetrisBonus: randChoice([200, 400, 600, 800, 1000, 1500]),
        tripleBonus: randChoice([50, 100, 150, 200]),
        doubleBonus: randChoice([10, 20, 30, 50]),
        nineBonus: randChoice([10, 20, 30, 50]),
        eightBonus: randChoice([3, 5, 10, 15]),
        wellCol: randChoice([0, 9]),
        wellPenalty: randChoice([5, 10, 15, 20]),
        densityBonus: randChoice([1, 2, 3, 5]),
        flatPenalty: randChoice([2, 3, 5, 8]),
        lineMultiplier: randChoice([50, 100, 150, 200])
      };

      const template = randChoice(scorerTemplates);
      candidate.scorer = template(params);
    }

    // Apply & Evaluate
    Object.assign(customFormulas, candidate.formulas);
    compileFormulas(); // CRITICAL: formulas must be compiled before simulation uses them!
    if (level >= 3) {
      customScorerFn = new Function('board', 'linesCleared', candidate.scorer);
    } else {
      customScorerFn = null;
    }

    // Stop simulate Headless Game at 40,000 to keep it from taking too long per iteration
    const res = simulateHeadlessGame(candidate.weights, seed, 40000);
    iterations++;

    if (res.linesCleared > bestLines) {
      bestLines = res.linesCleared;
      bestConfig = candidate;
      console.log(`%c[${Math.round((Date.now() - startTime)/1000)}s] New Best -> ${res.linesCleared} lines!`, "color: #00FF00;");
    }

    history.push({
      Lines: res.linesCleared,
      Pieces: res.piecesPlaced,
      Holes: candidate.weights.holes,
      Bump: candidate.weights.bumpiness,
      Formula: candidate.formulas.holes || "Linear",
      ScorerCode_Snippet: level >= 3 ? "Has Scorer" : "No Scorer"
    });

    // Loop check
    if (Date.now() - startTime < maxTimeMs) {
      // Free the UI thread for 1 millisecond so Chrome doesn't crash the tab with "Page Unresponsive"
      setTimeout(runSearchChunk, 1);
    } else {
      finishSearch();
    }
  }

  function finishSearch() {
    // Restore Original State
    Object.assign(customFormulas, originalFormulas);
    compileFormulas(); // Restore compiled formulas too
    customScorerFn = originalScorer;

    console.log(`\n%c🏁 SEARCH COMPLETE! Evaluated ${iterations} variations in ${timeMinutes} minute(s).`, 'color: #00FFFF; font-size: 16px;');
    console.log(`%c🏆 ABSOLUTE WINNER: ${bestLines} Lines`, 'color: #00FF00; font-size: 18px; font-weight: bold;');
    
    console.log("%c--- COPY THESE OPTIMIZED VALUES ---", "color: yellow;");
    console.log("== 1. WEIGHT SLIDERS ==");
    console.table(bestConfig.weights);
    
    if(level >= 2) {
      console.log("== 2. CUSTOM FORMULAS ==");
      console.table(bestConfig.formulas);
    }
    
    if(level >= 3) {
      console.log("== 3. CUSTOM SCORER CODE ==");
      console.log(bestConfig.scorer);
    }

    console.log("Top 10 Performers Evaluated:");
    history.sort((a,b) => b.Lines - a.Lines);
    console.table(history.slice(0, 10));
  }

  // Kickoff the loop
  setTimeout(runSearchChunk, 100);
}
