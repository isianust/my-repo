/* ================================================================
   2048 V2 – Game Engine Module
   Features: 5 stages, coins, harvester, enhanced scoring
   ================================================================ */

const SIZE = 4;

/* ── Tile color map (original 2048 palette) ─────────────── */
const TILE_STYLE = {
  2:    { bg:'#eee4da', color:'#776e65', fontSize: 2   },
  4:    { bg:'#ede0c8', color:'#776e65', fontSize: 2   },
  8:    { bg:'#f2b179', color:'#f9f6f2', fontSize: 2   },
  16:   { bg:'#f59563', color:'#f9f6f2', fontSize: 2   },
  32:   { bg:'#f67c5f', color:'#f9f6f2', fontSize: 2   },
  64:   { bg:'#f65e3b', color:'#f9f6f2', fontSize: 2   },
  128:  { bg:'#edcf72', color:'#f9f6f2', fontSize: 1.8 },
  256:  { bg:'#edcc61', color:'#f9f6f2', fontSize: 1.8 },
  512:  { bg:'#edc850', color:'#f9f6f2', fontSize: 1.8 },
  1024: { bg:'#edc53f', color:'#f9f6f2', fontSize: 1.5 },
  2048: { bg:'#edc22e', color:'#f9f6f2', fontSize: 1.5 },
  4096: { bg:'#3e3933', color:'#f9f6f2', fontSize: 1.3 },
  8192: { bg:'#2d2926', color:'#f9f6f2', fontSize: 1.3 },
};

function tileStyle(v) {
  if (TILE_STYLE[v]) return TILE_STYLE[v];
  return { bg: '#3c3a32', color: '#f9f6f2', fontSize: 1.3 };
}

/* ── Coin types ──────────────────────────────────────────── */
const COIN_TYPES = {
  NONE: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
};

const COIN_ICONS = {
  [COIN_TYPES.NONE]: '',
  [COIN_TYPES.BRONZE]: '🟤',
  [COIN_TYPES.SILVER]: '⚪',
  [COIN_TYPES.GOLD]: '🟡',
};

const COIN_LABELS = {
  [COIN_TYPES.BRONZE]: 'Bronze',
  [COIN_TYPES.SILVER]: 'Silver',
  [COIN_TYPES.GOLD]: 'Gold',
};

const COIN_MULTIPLIERS = {
  [COIN_TYPES.BRONZE]: 1000,
  [COIN_TYPES.SILVER]: 2000,
  [COIN_TYPES.GOLD]: 3000,
};

/* ── Stage definitions ───────────────────────────────────── */
const STAGES = {
  1: { threshold: 64,   label: 'Stage 1', coinSpawn: null },
  2: { threshold: 1024, label: 'Stage 2', coinSpawn: { bronze: 0.30, silver: 0, gold: 0 } },
  3: { threshold: 2048, label: 'Stage 3', coinSpawn: { bronze: 0, silver: 0.20, gold: 0 } },
  4: { threshold: 4096, label: 'Stage 4', coinSpawn: { bronze: 0, silver: 0, gold: 0.10 } },
  5: { threshold: Infinity, label: 'Stage 5', coinSpawn: { bronze: 0.15, silver: 0.10, gold: 0.05 } },
};

const HARVESTER_INTERVAL = 30;

/* ── Helper Functions ────────────────────────────────────── */
function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function emptyCoinGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(COIN_TYPES.NONE));
}

function emptyCells(g) {
  const cells = [];
  g.forEach((row, ri) => row.forEach((val, ci) => {
    if (!val) cells.push([ri, ci]);
  }));
  return cells;
}

function maxTileValue(g) {
  let max = 0;
  g.forEach(row => row.forEach(val => { if (val > max) max = val; }));
  return max;
}

function determineStage(g) {
  const maxVal = maxTileValue(g);
  if (maxVal < 64) return 1;
  if (maxVal < 1024) return 2;
  if (maxVal < 2048) return 3;
  if (maxVal < 4096) return 4;
  return 5;
}

function hasValue(g, v) {
  return g.some(row => row.includes(v));
}

function canMove(g) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!g[r][c]) return true;
      if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
      if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
    }
  }
  return false;
}

/* ── Coin spawning ───────────────────────────────────────── */
function spawnCoinForStage(stage, randomFn) {
  const rand = randomFn || Math.random;
  const config = STAGES[stage] && STAGES[stage].coinSpawn;
  if (!config) return COIN_TYPES.NONE;

  const goldRoll = rand();
  const silverRoll = rand();
  const bronzeRoll = rand();

  const candidates = [];

  if (goldRoll < config.gold) candidates.push(COIN_TYPES.GOLD);
  if (silverRoll < config.silver) candidates.push(COIN_TYPES.SILVER);
  if (bronzeRoll < config.bronze) candidates.push(COIN_TYPES.BRONZE);

  if (candidates.length === 0) return COIN_TYPES.NONE;

  // If multiple coin types appear, the block with the lowest point value takes precedence.
  // Bronze (1pt) < Silver (2pt) < Gold (3pt), so pick the smallest coin type number.
  return Math.min(...candidates);
}

/* ── Add random tile ─────────────────────────────────────── */
function addRandom(g, coinGrid, stage, randomFn) {
  const rand = randomFn || Math.random;
  const cells = emptyCells(g);
  if (!cells.length) return null;

  const [r, c] = cells[Math.floor(rand() * cells.length)];
  g[r][c] = rand() < 0.9 ? 2 : 4;

  let coin = COIN_TYPES.NONE;
  if (coinGrid && stage >= 2) {
    coin = spawnCoinForStage(stage, randomFn);
    coinGrid[r][c] = coin;
  }

  return { row: r, col: c, value: g[r][c], coin };
}

/* ── Slide one row left ──────────────────────────────────── */
function slideRow(row) {
  let a = row.filter(v => v);
  let merged = 0;
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i] === a[i + 1]) {
      a[i] *= 2;
      merged += a[i];
      a.splice(i + 1, 1);
    }
  }
  while (a.length < SIZE) a.push(0);
  return { row: a, merged };
}

/* ── Slide row with coin tracking ────────────────────────── */
function slideRowWithCoins(row, coinRow) {
  // Track non-zero values and their coins
  const items = [];
  for (let i = 0; i < row.length; i++) {
    if (row[i]) items.push({ value: row[i], coin: coinRow[i] });
  }

  let merged = 0;
  const resultItems = [];

  for (let i = 0; i < items.length; i++) {
    if (i < items.length - 1 && items[i].value === items[i + 1].value) {
      const mergedValue = items[i].value * 2;
      merged += mergedValue;
      // Coin merge rules: 0+0=0, 0+1=1, 1+0=1, 1+1=1
      const coinA = items[i].coin;
      const coinB = items[i + 1].coin;
      let mergedCoin = COIN_TYPES.NONE;
      if (coinA !== COIN_TYPES.NONE && coinB !== COIN_TYPES.NONE) {
        // Both tiles have coins: keep the lower value coin
        mergedCoin = Math.min(coinA, coinB);
      } else if (coinA !== COIN_TYPES.NONE || coinB !== COIN_TYPES.NONE) {
        // Only one tile has a coin: keep whichever exists
        mergedCoin = Math.max(coinA, coinB);
      }
      resultItems.push({ value: mergedValue, coin: mergedCoin });
      i++; // skip next item
    } else {
      resultItems.push({ value: items[i].value, coin: items[i].coin });
    }
  }

  // Fill with zeros
  while (resultItems.length < SIZE) {
    resultItems.push({ value: 0, coin: COIN_TYPES.NONE });
  }

  return {
    row: resultItems.map(it => it.value),
    coinRow: resultItems.map(it => it.coin),
    merged,
  };
}

/* ── Get/Set column helpers ──────────────────────────────── */
function getCol(g, c) { return g.map(r => r[c]); }
function setCol(g, c, col) { for (let r = 0; r < SIZE; r++) g[r][c] = col[r]; }

/* ── Move whole grid with coins ──────────────────────────── */
function moveWithCoins(grid, coinGrid, dir) {
  let g = grid.map(r => [...r]);
  let cg = coinGrid.map(r => [...r]);
  let pts = 0;
  let moved = false;
  const mergedPositions = new Set();

  if (dir === 0) {
    // LEFT
    for (let r = 0; r < SIZE; r++) {
      const { row, coinRow, merged } = slideRowWithCoins(g[r], cg[r]);
      if (row.some((v, i) => v !== g[r][i])) moved = true;
      // Track merged positions
      if (merged) {
        for (let i = 0; i < SIZE; i++) {
          if (row[i] && row[i] !== g[r][i]) mergedPositions.add(r + ',' + i);
        }
      }
      g[r] = row;
      cg[r] = coinRow;
      pts += merged;
    }
  } else if (dir === 2) {
    // RIGHT
    for (let r = 0; r < SIZE; r++) {
      const rev = [...g[r]].reverse();
      const revCoins = [...cg[r]].reverse();
      const { row, coinRow, merged } = slideRowWithCoins(rev, revCoins);
      const result = row.reverse();
      const resultCoins = coinRow.reverse();
      if (result.some((v, i) => v !== g[r][i])) moved = true;
      if (merged) {
        for (let i = 0; i < SIZE; i++) {
          if (result[i] && result[i] !== g[r][i]) mergedPositions.add(r + ',' + i);
        }
      }
      g[r] = result;
      cg[r] = resultCoins;
      pts += merged;
    }
  } else if (dir === 1) {
    // UP
    for (let c = 0; c < SIZE; c++) {
      const col = getCol(g, c);
      const coinCol = getCol(cg, c);
      const { row, coinRow, merged } = slideRowWithCoins(col, coinCol);
      if (row.some((v, i) => v !== col[i])) moved = true;
      if (merged) {
        for (let i = 0; i < SIZE; i++) {
          if (row[i] && row[i] !== col[i]) mergedPositions.add(i + ',' + c);
        }
      }
      setCol(g, c, row);
      setCol(cg, c, coinRow);
      pts += merged;
    }
  } else if (dir === 3) {
    // DOWN
    for (let c = 0; c < SIZE; c++) {
      const col = getCol(g, c).reverse();
      const coinCol = getCol(cg, c).reverse();
      const { row, coinRow, merged } = slideRowWithCoins(col, coinCol);
      const result = row.reverse();
      const resultCoins = coinRow.reverse();
      const origCol = getCol(g, c);
      if (result.some((v, i) => v !== origCol[i])) moved = true;
      if (merged) {
        for (let i = 0; i < SIZE; i++) {
          if (result[i] && result[i] !== origCol[i]) mergedPositions.add(i + ',' + c);
        }
      }
      setCol(g, c, result);
      setCol(cg, c, resultCoins);
      pts += merged;
    }
  }

  return { grid: g, coinGrid: cg, points: pts, moved, mergedPositions };
}

/* ── Harvester: collect all coins from grid ──────────────── */
function harvestCoins(coinGrid) {
  const collected = { bronze: 0, silver: 0, gold: 0 };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (coinGrid[r][c] === COIN_TYPES.BRONZE) collected.bronze++;
      else if (coinGrid[r][c] === COIN_TYPES.SILVER) collected.silver++;
      else if (coinGrid[r][c] === COIN_TYPES.GOLD) collected.gold++;
      coinGrid[r][c] = COIN_TYPES.NONE;
    }
  }
  return collected;
}

function calculateCoinScore(collected) {
  return (
    collected.gold * COIN_MULTIPLIERS[COIN_TYPES.GOLD] +
    collected.silver * COIN_MULTIPLIERS[COIN_TYPES.SILVER] +
    collected.bronze * COIN_MULTIPLIERS[COIN_TYPES.BRONZE]
  );
}

/* ── Count coins on grid ─────────────────────────────────── */
function countCoinsOnGrid(coinGrid) {
  const counts = { bronze: 0, silver: 0, gold: 0 };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (coinGrid[r][c] === COIN_TYPES.BRONZE) counts.bronze++;
      else if (coinGrid[r][c] === COIN_TYPES.SILVER) counts.silver++;
      else if (coinGrid[r][c] === COIN_TYPES.GOLD) counts.gold++;
    }
  }
  return counts;
}

/* ── Export for testing & UI ─────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SIZE,
    TILE_STYLE,
    COIN_TYPES,
    COIN_ICONS,
    COIN_LABELS,
    COIN_MULTIPLIERS,
    STAGES,
    HARVESTER_INTERVAL,
    tileStyle,
    emptyGrid,
    emptyCoinGrid,
    emptyCells,
    maxTileValue,
    determineStage,
    hasValue,
    canMove,
    spawnCoinForStage,
    addRandom,
    slideRow,
    slideRowWithCoins,
    getCol,
    setCol,
    moveWithCoins,
    harvestCoins,
    calculateCoinScore,
    countCoinsOnGrid,
  };
}
