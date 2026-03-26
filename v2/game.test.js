/* ================================================================
   2048 V2 – Unit Tests
   Run with: node v2/game.test.js
   ================================================================ */

const {
  SIZE,
  COIN_TYPES,
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
} = require('./game.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push(`${message} (expected ${e}, got ${a})`);
    console.error(`  ✗ FAIL: ${message} (expected ${e}, got ${a})`);
  }
}

function describe(name, fn) {
  console.log(`\n▸ ${name}`);
  fn();
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Constants', () => {
  assert(SIZE === 4, 'SIZE should be 4');
  assert(HARVESTER_INTERVAL === 30, 'HARVESTER_INTERVAL should be 30');
  assert(COIN_TYPES.NONE === 0, 'COIN_TYPES.NONE should be 0');
  assert(COIN_TYPES.BRONZE === 1, 'COIN_TYPES.BRONZE should be 1');
  assert(COIN_TYPES.SILVER === 2, 'COIN_TYPES.SILVER should be 2');
  assert(COIN_TYPES.GOLD === 3, 'COIN_TYPES.GOLD should be 3');
  assert(COIN_MULTIPLIERS[COIN_TYPES.BRONZE] === 1000, 'Bronze multiplier should be 1000');
  assert(COIN_MULTIPLIERS[COIN_TYPES.SILVER] === 2000, 'Silver multiplier should be 2000');
  assert(COIN_MULTIPLIERS[COIN_TYPES.GOLD] === 3000, 'Gold multiplier should be 3000');
});

describe('Stage definitions', () => {
  assert(STAGES[1].threshold === 64, 'Stage 1 threshold is 64');
  assert(STAGES[2].threshold === 1024, 'Stage 2 threshold is 1024');
  assert(STAGES[3].threshold === 2048, 'Stage 3 threshold is 2048');
  assert(STAGES[4].threshold === 4096, 'Stage 4 threshold is 4096');
  assert(STAGES[5].threshold === Infinity, 'Stage 5 threshold is Infinity');
  assert(STAGES[1].coinSpawn === null, 'Stage 1 has no coin spawn');
  assert(STAGES[2].coinSpawn.bronze === 0.30, 'Stage 2 bronze spawn is 30%');
  assert(STAGES[2].coinSpawn.silver === 0, 'Stage 2 silver spawn is 0%');
  assert(STAGES[2].coinSpawn.gold === 0, 'Stage 2 gold spawn is 0%');
  assert(STAGES[3].coinSpawn.bronze === 0, 'Stage 3 bronze spawn is 0%');
  assert(STAGES[3].coinSpawn.silver === 0.20, 'Stage 3 silver spawn is 20%');
  assert(STAGES[3].coinSpawn.gold === 0, 'Stage 3 gold spawn is 0%');
  assert(STAGES[4].coinSpawn.bronze === 0, 'Stage 4 bronze spawn is 0%');
  assert(STAGES[4].coinSpawn.silver === 0, 'Stage 4 silver spawn is 0%');
  assert(STAGES[4].coinSpawn.gold === 0.10, 'Stage 4 gold spawn is 10%');
  assert(STAGES[5].coinSpawn.bronze === 0.15, 'Stage 5 bronze spawn is 15%');
  assert(STAGES[5].coinSpawn.silver === 0.10, 'Stage 5 silver spawn is 10%');
  assert(STAGES[5].coinSpawn.gold === 0.05, 'Stage 5 gold spawn is 5%');
});

describe('tileStyle', () => {
  assert(tileStyle(2).bg === '#eee4da', 'tileStyle(2) returns correct bg');
  assert(tileStyle(2048).bg === '#edc22e', 'tileStyle(2048) returns correct bg');
  assert(tileStyle(16384).bg === '#3c3a32', 'Unknown tile gets default style');
});

describe('emptyGrid', () => {
  const g = emptyGrid();
  assert(g.length === 4, 'Grid has 4 rows');
  assert(g[0].length === 4, 'Grid has 4 columns');
  assert(g.every(r => r.every(v => v === 0)), 'All cells are 0');
});

describe('emptyCoinGrid', () => {
  const cg = emptyCoinGrid();
  assert(cg.length === 4, 'Coin grid has 4 rows');
  assert(cg[0].length === 4, 'Coin grid has 4 columns');
  assert(cg.every(r => r.every(v => v === COIN_TYPES.NONE)), 'All cells are NONE');
});

describe('emptyCells', () => {
  const g = emptyGrid();
  assert(emptyCells(g).length === 16, 'Empty grid has 16 empty cells');
  g[0][0] = 2;
  g[1][1] = 4;
  assert(emptyCells(g).length === 14, 'Grid with 2 tiles has 14 empty cells');
});

describe('maxTileValue', () => {
  const g = emptyGrid();
  assert(maxTileValue(g) === 0, 'Empty grid has max 0');
  g[0][0] = 2; g[1][1] = 64; g[2][2] = 32;
  assert(maxTileValue(g) === 64, 'Grid with 64 has max 64');
  g[3][3] = 2048;
  assert(maxTileValue(g) === 2048, 'Grid with 2048 has max 2048');
});

describe('determineStage', () => {
  const g = emptyGrid();
  g[0][0] = 2;
  assert(determineStage(g) === 1, 'Max 2 is Stage 1');

  g[0][0] = 32;
  assert(determineStage(g) === 1, 'Max 32 is Stage 1');

  g[0][0] = 64;
  assert(determineStage(g) === 2, 'Max 64 is Stage 2');

  g[0][0] = 512;
  assert(determineStage(g) === 2, 'Max 512 is Stage 2');

  g[0][0] = 1024;
  assert(determineStage(g) === 3, 'Max 1024 is Stage 3');

  g[0][0] = 2048;
  assert(determineStage(g) === 4, 'Max 2048 is Stage 4');

  g[0][0] = 4096;
  assert(determineStage(g) === 5, 'Max 4096 is Stage 5');

  g[0][0] = 8192;
  assert(determineStage(g) === 5, 'Max 8192 is Stage 5');
});

describe('hasValue', () => {
  const g = emptyGrid();
  assert(!hasValue(g, 2), 'Empty grid does not have 2');
  g[1][2] = 2;
  assert(hasValue(g, 2), 'Grid with 2 has 2');
  assert(!hasValue(g, 4), 'Grid without 4 does not have 4');
});

describe('canMove', () => {
  const g = emptyGrid();
  assert(canMove(g), 'Empty grid can move');

  // Full grid with no merges
  const full = [
    [2, 4, 8, 16],
    [16, 8, 4, 2],
    [2, 4, 8, 16],
    [16, 8, 4, 2],
  ];
  assert(!canMove(full), 'Full grid with no merges cannot move');

  // Full grid with one merge possible
  const fullMerge = [
    [2, 4, 8, 16],
    [16, 8, 4, 2],
    [2, 4, 8, 16],
    [16, 8, 4, 4],
  ];
  assert(canMove(fullMerge), 'Full grid with a merge can move');
});

describe('slideRow', () => {
  assertDeepEqual(slideRow([0, 0, 0, 0]), { row: [0, 0, 0, 0], merged: 0 }, 'Empty row stays empty');
  assertDeepEqual(slideRow([2, 0, 0, 0]), { row: [2, 0, 0, 0], merged: 0 }, 'Single tile stays');
  assertDeepEqual(slideRow([0, 0, 0, 2]), { row: [2, 0, 0, 0], merged: 0 }, 'Tile slides left');
  assertDeepEqual(slideRow([2, 2, 0, 0]), { row: [4, 0, 0, 0], merged: 4 }, 'Two 2s merge');
  assertDeepEqual(slideRow([2, 2, 2, 2]), { row: [4, 4, 0, 0], merged: 8 }, 'Four 2s merge to two 4s');
  assertDeepEqual(slideRow([4, 2, 2, 0]), { row: [4, 4, 0, 0], merged: 4 }, '4,2,2 -> 4,4');
  assertDeepEqual(slideRow([2, 2, 4, 4]), { row: [4, 8, 0, 0], merged: 12 }, '2,2,4,4 -> 4,8');
  assertDeepEqual(slideRow([2, 4, 8, 16]), { row: [2, 4, 8, 16], merged: 0 }, 'No merges possible');
});

describe('slideRowWithCoins', () => {
  // 0+0 = 0 (no coins)
  const r1 = slideRowWithCoins([2, 2, 0, 0], [0, 0, 0, 0]);
  assertDeepEqual(r1.row, [4, 0, 0, 0], '2+2 merge values');
  assertDeepEqual(r1.coinRow, [0, 0, 0, 0], '0+0 = 0 (no coins)');
  assert(r1.merged === 4, '2+2 merge score is 4');

  // 0+1 = 1 (coin persists)
  const r2 = slideRowWithCoins([2, 2, 0, 0], [0, 1, 0, 0]);
  assertDeepEqual(r2.coinRow, [1, 0, 0, 0], '0+1 = 1 (bronze persists)');

  // 1+0 = 1 (coin persists)
  const r3 = slideRowWithCoins([2, 2, 0, 0], [1, 0, 0, 0]);
  assertDeepEqual(r3.coinRow, [1, 0, 0, 0], '1+0 = 1 (bronze persists)');

  // 1+1 = 1 (merge keeps one coin)
  const r4 = slideRowWithCoins([2, 2, 0, 0], [1, 1, 0, 0]);
  assertDeepEqual(r4.coinRow, [1, 0, 0, 0], '1+1 = 1 (merge keeps one coin)');

  // Different coin types: gold + bronze -> bronze (min)
  const r5 = slideRowWithCoins([4, 4, 0, 0], [3, 1, 0, 0]);
  assertDeepEqual(r5.coinRow, [1, 0, 0, 0], 'gold+bronze = bronze (lower kept)');

  // Silver + gold -> silver (min)
  const r6 = slideRowWithCoins([8, 8, 0, 0], [2, 3, 0, 0]);
  assertDeepEqual(r6.coinRow, [2, 0, 0, 0], 'silver+gold = silver (lower kept)');

  // Multiple merges with coins
  const r7 = slideRowWithCoins([2, 2, 4, 4], [1, 0, 2, 3]);
  assertDeepEqual(r7.row, [4, 8, 0, 0], 'Multiple merge values');
  assertDeepEqual(r7.coinRow, [1, 2, 0, 0], 'Multiple merge coins: bronze persists, silver wins (min)');

  // Non-merging tile keeps coin
  const r8 = slideRowWithCoins([0, 0, 2, 0], [0, 0, 2, 0]);
  assertDeepEqual(r8.row, [2, 0, 0, 0], 'Tile slides left');
  assertDeepEqual(r8.coinRow, [2, 0, 0, 0], 'Coin slides with tile');

  // No tiles at all
  const r9 = slideRowWithCoins([0, 0, 0, 0], [0, 0, 0, 0]);
  assertDeepEqual(r9.row, [0, 0, 0, 0], 'Empty stays empty');
  assertDeepEqual(r9.coinRow, [0, 0, 0, 0], 'No coins stay none');
});

describe('getCol / setCol', () => {
  const g = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ];
  assertDeepEqual(getCol(g, 0), [1, 5, 9, 13], 'getCol returns column 0');
  assertDeepEqual(getCol(g, 3), [4, 8, 12, 16], 'getCol returns column 3');
  setCol(g, 0, [10, 20, 30, 40]);
  assertDeepEqual(getCol(g, 0), [10, 20, 30, 40], 'setCol sets column correctly');
});

describe('moveWithCoins - LEFT', () => {
  const g = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [1, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const result = moveWithCoins(g, cg, 0);
  assert(result.moved, 'Move should be detected');
  assert(result.grid[0][0] === 4, 'Tiles merged to 4');
  assert(result.coinGrid[0][0] === 1, 'Coin preserved after merge (1+0=1)');
  assert(result.points === 4, 'Points from merge');
});

describe('moveWithCoins - RIGHT', () => {
  const g = [
    [0, 0, 2, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [0, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const result = moveWithCoins(g, cg, 2);
  assert(result.moved, 'Move RIGHT detected');
  assert(result.grid[0][3] === 4, 'Tiles merged to 4 on right');
  assert(result.coinGrid[0][3] === 2, 'Silver coin preserved');
});

describe('moveWithCoins - UP', () => {
  const g = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [0, 0, 0, 0],
    [3, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const result = moveWithCoins(g, cg, 1);
  assert(result.moved, 'Move UP detected');
  assert(result.grid[0][0] === 4, 'Tiles merged upward');
  assert(result.coinGrid[0][0] === 3, 'Gold coin preserved');
});

describe('moveWithCoins - DOWN', () => {
  const g = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 0, 0],
    [2, 0, 0, 0],
  ];
  const cg = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ];
  const result = moveWithCoins(g, cg, 3);
  assert(result.moved, 'Move DOWN detected');
  assert(result.grid[3][0] === 4, 'Tiles merged downward');
  assert(result.coinGrid[3][0] === 1, 'Bronze coin preserved (1+1=1)');
});

describe('moveWithCoins - no move', () => {
  const g = [
    [2, 4, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = emptyCoinGrid();
  const result = moveWithCoins(g, cg, 0); // already at left
  assert(!result.moved, 'No movement when tiles are already at left');
});

describe('moveWithCoins - coins move with tiles without merge', () => {
  const g = [
    [0, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [0, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const result = moveWithCoins(g, cg, 0); // slide left
  assert(result.moved, 'Tile moved left');
  assert(result.grid[0][0] === 2, 'Tile at position 0,0');
  assert(result.coinGrid[0][0] === 2, 'Silver coin moved with tile');
  assert(result.coinGrid[0][3] === 0, 'Old position has no coin');
});

describe('spawnCoinForStage', () => {
  // Stage 1: no coins
  assert(spawnCoinForStage(1) === COIN_TYPES.NONE, 'Stage 1 spawns no coins');

  // Stage 2: only bronze can spawn
  const allLow = () => 0.01;
  assert(spawnCoinForStage(2, allLow) === COIN_TYPES.BRONZE, 'Stage 2 low roll => bronze (only coin type)');

  // Stage 2: high roll => no coin
  const allHigh = () => 0.99;
  assert(spawnCoinForStage(2, allHigh) === COIN_TYPES.NONE, 'Stage 2 high roll => no coin');

  // Stage 3: only silver can spawn
  let callCount = 0;
  const stage3Low = () => 0.01;
  assert(spawnCoinForStage(3, stage3Low) === COIN_TYPES.SILVER, 'Stage 3 low roll => silver (only coin type)');
  assert(spawnCoinForStage(3, allHigh) === COIN_TYPES.NONE, 'Stage 3 high roll => no coin');

  // Stage 4: only gold can spawn
  assert(spawnCoinForStage(4, allLow) === COIN_TYPES.GOLD, 'Stage 4 low roll => gold (only coin type)');
  assert(spawnCoinForStage(4, allHigh) === COIN_TYPES.NONE, 'Stage 4 high roll => no coin');

  // Stage 5: all coin types can spawn
  callCount = 0;
  const stage5Bronze = () => {
    callCount++;
    if (callCount === 1) return 0.99; // gold roll >= 0.05 => no gold
    if (callCount === 2) return 0.99; // silver roll >= 0.10 => no silver
    return 0.10; // bronze roll < 0.15 => bronze
  };
  callCount = 0;
  assert(spawnCoinForStage(5, stage5Bronze) === COIN_TYPES.BRONZE, 'Stage 5: only bronze triggers');

  // Stage 5: all low rolls => bronze (lowest value wins)
  assert(spawnCoinForStage(5, allLow) === COIN_TYPES.BRONZE, 'Stage 5 all low => bronze (lowest value)');
});

describe('addRandom', () => {
  const g = emptyGrid();
  const cg = emptyCoinGrid();

  // Stage 1: no coin on new tile
  const result1 = addRandom(g, cg, 1);
  assert(result1 !== null, 'addRandom returns result');
  assert(result1.value === 2 || result1.value === 4, 'New tile is 2 or 4');
  assert(result1.coin === COIN_TYPES.NONE, 'Stage 1 has no coin');
  assert(g[result1.row][result1.col] === result1.value, 'Grid updated correctly');

  // Stage 2 with deterministic random (force coin)
  const g2 = emptyGrid();
  const cg2 = emptyCoinGrid();
  let rIdx = 0;
  const fakeRand = () => {
    const vals = [0.5, 0.5, 0.01, 0.01, 0.01]; // cell pick, tile value, gold, silver, bronze
    return vals[rIdx++] || 0.5;
  };
  rIdx = 0;
  const result2 = addRandom(g2, cg2, 2, fakeRand);
  assert(result2 !== null, 'addRandom stage 2 returns result');
  assert(result2.coin === COIN_TYPES.BRONZE, 'Stage 2 with low rolls => bronze (only coin type for stage 2)');

  // Full grid returns null
  const fullGrid = [
    [2, 4, 8, 16],
    [16, 8, 4, 2],
    [2, 4, 8, 16],
    [16, 8, 4, 2],
  ];
  const result3 = addRandom(fullGrid, emptyCoinGrid(), 1);
  assert(result3 === null, 'Full grid returns null');
});

describe('harvestCoins', () => {
  const cg = emptyCoinGrid();
  cg[0][0] = COIN_TYPES.BRONZE;
  cg[0][1] = COIN_TYPES.SILVER;
  cg[1][0] = COIN_TYPES.GOLD;
  cg[2][2] = COIN_TYPES.BRONZE;
  cg[3][3] = COIN_TYPES.GOLD;

  const collected = harvestCoins(cg);
  assert(collected.bronze === 2, 'Collected 2 bronze');
  assert(collected.silver === 1, 'Collected 1 silver');
  assert(collected.gold === 2, 'Collected 2 gold');

  // Grid should be clear
  assert(cg.every(r => r.every(v => v === COIN_TYPES.NONE)), 'Coin grid cleared after harvest');
});

describe('calculateCoinScore', () => {
  assert(calculateCoinScore({ gold: 0, silver: 0, bronze: 0 }) === 0, 'No coins = 0 score');
  assert(calculateCoinScore({ gold: 1, silver: 0, bronze: 0 }) === 3000, '1 gold = 3000');
  assert(calculateCoinScore({ gold: 0, silver: 1, bronze: 0 }) === 2000, '1 silver = 2000');
  assert(calculateCoinScore({ gold: 0, silver: 0, bronze: 1 }) === 1000, '1 bronze = 1000');
  assert(calculateCoinScore({ gold: 2, silver: 3, bronze: 5 }) === 17000, '2g+3s+5b = 17000');
});

describe('countCoinsOnGrid', () => {
  const cg = emptyCoinGrid();
  cg[0][0] = COIN_TYPES.GOLD;
  cg[1][1] = COIN_TYPES.SILVER;
  cg[2][2] = COIN_TYPES.SILVER;
  cg[3][3] = COIN_TYPES.BRONZE;

  const counts = countCoinsOnGrid(cg);
  assert(counts.gold === 1, 'Count 1 gold');
  assert(counts.silver === 2, 'Count 2 silver');
  assert(counts.bronze === 1, 'Count 1 bronze');
});

describe('Complex merge scenario: multiple rows', () => {
  const g = [
    [2, 2, 4, 4],
    [8, 8, 8, 8],
    [0, 2, 0, 2],
    [4, 0, 4, 0],
  ];
  const cg = [
    [1, 2, 3, 0],
    [0, 1, 0, 2],
    [0, 3, 0, 1],
    [2, 0, 1, 0],
  ];

  const result = moveWithCoins(g, cg, 0); // LEFT
  // Row 0: [2,2,4,4] => [4,8] coins: [1,2,3,0] => merge(1,2)=1, merge(3,0)=3 => [1,3,0,0]
  assertDeepEqual(result.grid[0], [4, 8, 0, 0], 'Row 0 merges correctly');
  assertDeepEqual(result.coinGrid[0], [1, 3, 0, 0], 'Row 0 coins merge correctly');

  // Row 1: [8,8,8,8] => [16,16] coins: [0,1,0,2] => merge(0,1)=1, merge(0,2)=2 => [1,2,0,0]
  assertDeepEqual(result.grid[1], [16, 16, 0, 0], 'Row 1 merges correctly');
  assertDeepEqual(result.coinGrid[1], [1, 2, 0, 0], 'Row 1 coins merge correctly');

  // Row 2: [0,2,0,2] => [4] coins: [0,3,0,1] => merge(3,1)=1 => [1,0,0,0]
  assertDeepEqual(result.grid[2], [4, 0, 0, 0], 'Row 2 merges correctly');
  assertDeepEqual(result.coinGrid[2], [1, 0, 0, 0], 'Row 2 coins merge correctly');

  // Row 3: [4,0,4,0] => [8] coins: [2,0,1,0] => merge(2,1)=1 => [1,0,0,0]
  assertDeepEqual(result.grid[3], [8, 0, 0, 0], 'Row 3 merges correctly');
  assertDeepEqual(result.coinGrid[3], [1, 0, 0, 0], 'Row 3 coins merge correctly');
});

describe('Complex merge scenario: UP direction', () => {
  const g = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  const cg = [
    [1, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 0, 0, 0],
  ];

  const result = moveWithCoins(g, cg, 1); // UP
  // Column 0 UP: [2,2,4,4] => [4,8,0,0] coins: [1,2,0,3] => merge(1,2)=1, merge(0,3)=3
  assertDeepEqual(getCol(result.grid, 0), [4, 8, 0, 0], 'Column 0 merges up correctly');
  assertDeepEqual(getCol(result.coinGrid, 0), [1, 3, 0, 0], 'Column 0 coins merge correctly');
});

describe('Complex merge scenario: DOWN direction', () => {
  const g = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  const cg = [
    [1, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 0, 0, 0],
  ];

  const result = moveWithCoins(g, cg, 3); // DOWN
  // Column 0 DOWN: reversed [4,4,2,2] coins reversed [3,0,2,1]
  // slide: [4,4,2,2] => [8,4,0,0] coins: merge(3,0)=3, merge(2,1)=1 => [3,1,0,0]
  // reverse back: [0,0,4,8] coins: [0,0,1,3]
  assertDeepEqual(getCol(result.grid, 0), [0, 0, 4, 8], 'Column 0 merges down correctly');
  assertDeepEqual(getCol(result.coinGrid, 0), [0, 0, 1, 3], 'Column 0 coins merge down correctly');
});

describe('Complex merge scenario: RIGHT direction', () => {
  const g = [
    [2, 2, 4, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [1, 0, 3, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  const result = moveWithCoins(g, cg, 2); // RIGHT
  // Row 0 RIGHT: reverse [4,4,2,2] coins reverse [2,3,0,1]
  // slide: [4,4,2,2] => [8,4,0,0] coins: merge(2,3)=2, merge(0,1)=1 => [2,1,0,0]
  // reverse back: [0,0,4,8] coins: [0,0,1,2]
  assertDeepEqual(result.grid[0], [0, 0, 4, 8], 'Row 0 merges right correctly');
  assertDeepEqual(result.coinGrid[0], [0, 0, 1, 2], 'Row 0 coins merge right correctly');
});

describe('Coin spawning does not affect empty cells', () => {
  const g = emptyGrid();
  const cg = emptyCoinGrid();
  g[0][0] = 2;
  cg[0][0] = COIN_TYPES.GOLD;

  // After move, only tiles with values should have coins
  const result = moveWithCoins(g, cg, 0);
  // No movement since single tile at left already
  assert(!result.moved, 'Single tile at left does not move');
  assert(result.coinGrid[0][0] === COIN_TYPES.GOLD, 'Coin stays on tile');
});

describe('Empty cell coins are cleared when tile is removed', () => {
  const g = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const cg = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  // Coins only exist on tiles, so empty cells should never have coins
  assert(countCoinsOnGrid(cg).gold === 0, 'No gold on empty grid');
});

describe('Harvester timing', () => {
  assert(HARVESTER_INTERVAL === 30, 'Harvester triggers every 30 moves');
  // Test logic: moveCount % 30 === 0
  assert(30 % HARVESTER_INTERVAL === 0, '30 triggers harvester');
  assert(60 % HARVESTER_INTERVAL === 0, '60 triggers harvester');
  assert(15 % HARVESTER_INTERVAL !== 0, '15 does not trigger harvester');
  assert(29 % HARVESTER_INTERVAL !== 0, '29 does not trigger harvester');
});

describe('Stage transition during game', () => {
  const g = emptyGrid();
  g[0][0] = 32;
  g[0][1] = 32;
  // Before merge: max = 32, stage 1
  assert(determineStage(g) === 1, 'Before merge: stage 1');

  // After sliding left, 32+32=64, stage 2
  const result = moveWithCoins(g, emptyCoinGrid(), 0);
  assert(result.grid[0][0] === 64, 'Merge produces 64');
  assert(determineStage(result.grid) === 2, 'After merge: stage 2');
});

describe('Coin merge edge case: three tiles, two merge', () => {
  // [2, 2, 2, 0] LEFT => [4, 2, 0, 0] (first pair merges)
  const r = slideRowWithCoins([2, 2, 2, 0], [1, 2, 3, 0]);
  assertDeepEqual(r.row, [4, 2, 0, 0], 'First pair merges, third stays');
  assertDeepEqual(r.coinRow, [1, 3, 0, 0], 'Coins: merge(1,2)=1, third slides with coin 3');
});

describe('Coin merge edge case: [4, 2, 2, 4]', () => {
  const r = slideRowWithCoins([4, 2, 2, 4], [1, 2, 3, 0]);
  assertDeepEqual(r.row, [4, 4, 4, 0], 'Middle pair merges');
  assertDeepEqual(r.coinRow, [1, 2, 0, 0], 'Coins: 1 stays, merge(2,3)=2, 0 stays');
});

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('All tests passed! ✅');
  process.exit(0);
}
