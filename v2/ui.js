/* ================================================================
   2048 V2 – UI Controller
   Connects game engine to the DOM
   ================================================================ */

/* ── State ───────────────────────────────────────────────── */
let grid, coinGrid, score, best, won, keepPlaying, busy;
let moveCount, totalCoinsCollected;

const $score     = document.getElementById('score');
const $best      = document.getElementById('best');
const $tc        = document.getElementById('tileContainer');
const $winOvl    = document.getElementById('winOverlay');
const $loseOvl   = document.getElementById('loseOverlay');
const $stageInd  = document.getElementById('stageIndicator');
const $moveCount = document.getElementById('moveCounter');
const $goldCount = document.getElementById('goldCount');
const $silverCount = document.getElementById('silverCount');
const $bronzeCount = document.getElementById('bronzeCount');
const $harvesterOvl = document.getElementById('harvesterOverlay');
const $harvesterCoins = document.getElementById('harvesterCoinsCollected');
const $scoreBreakdown = document.getElementById('scoreBreakdown');

best = +(localStorage.getItem('best2048v2') || 0);
$best.textContent = best;

/* ── Rendering ───────────────────────────────────────────── */
function cellSize() {
  const board = document.getElementById('board');
  const inner = board.clientWidth - 24;
  return (inner - 12 * 3) / 4;
}

function renderTiles(newTile, mergedSet) {
  $tc.innerHTML = '';
  const cs = cellSize();
  const gap = 12;
  grid.forEach((row, r) => {
    row.forEach((val, c) => {
      if (!val) return;
      const s = tileStyle(val);
      const el = document.createElement('div');
      el.className = 'tile';
      if (newTile && newTile.row === r && newTile.col === c) el.classList.add('new');
      if (mergedSet && mergedSet.has(r + ',' + c)) el.classList.add('merged');

      el.textContent = val;

      // Show coin icon in bottom-right
      const coin = coinGrid[r][c];
      if (coin !== COIN_TYPES.NONE) {
        const coinEl = document.createElement('span');
        coinEl.className = 'coin-icon';
        coinEl.textContent = COIN_ICONS[coin];
        el.appendChild(coinEl);
      }

      const left = c * (cs + gap);
      const top  = r * (cs + gap);
      el.style.cssText = `
        width:${cs}px; height:${cs}px;
        top:${top}px; left:${left}px;
        background:${s.bg}; color:${s.color};
        font-size:${cs * 0.38 * (s.fontSize / 2)}px;
      `;
      $tc.appendChild(el);
    });
  });
}

function updateScore(pts) {
  score += pts;
  $score.textContent = score;
  if (score > best) {
    best = score;
    $best.textContent = best;
    localStorage.setItem('best2048v2', best);
  }
}

function updateInfoBar() {
  const stage = determineStage(grid);
  $stageInd.textContent = STAGES[stage].label;

  // Update stage indicator color
  const stageColors = {
    1: '#bbada0',
    2: '#edcf72',
    3: '#f2b179',
    4: '#f67c5f',
    5: '#edc22e',
  };
  $stageInd.style.background = stageColors[stage] || '#bbada0';

  const movesUntilHarvest = HARVESTER_INTERVAL - (moveCount % HARVESTER_INTERVAL);
  $moveCount.textContent = `Moves: ${moveCount} | Harvest in: ${movesUntilHarvest}`;

  $goldCount.textContent = totalCoinsCollected.gold;
  $silverCount.textContent = totalCoinsCollected.silver;
  $bronzeCount.textContent = totalCoinsCollected.bronze;
}

function showHarvesterAnimation(collected, coinScore) {
  $harvesterCoins.innerHTML =
    `<span>🟡 ${collected.gold}</span>` +
    `<span>⚪ ${collected.silver}</span>` +
    `<span>🟤 ${collected.bronze}</span>` +
    `<span>+${coinScore}</span>`;
  $harvesterOvl.classList.add('active');
  setTimeout(() => {
    $harvesterOvl.classList.remove('active');
  }, 1400);
}

function showGameOverBreakdown() {
  const goldScore = totalCoinsCollected.gold * COIN_MULTIPLIERS[COIN_TYPES.GOLD];
  const silverScore = totalCoinsCollected.silver * COIN_MULTIPLIERS[COIN_TYPES.SILVER];
  const bronzeScore = totalCoinsCollected.bronze * COIN_MULTIPLIERS[COIN_TYPES.BRONZE];

  $scoreBreakdown.innerHTML = `
    <div class="breakdown-row">
      <span class="breakdown-icon">🟡</span>
      <span>Gold × ${totalCoinsCollected.gold}</span>
      <span class="breakdown-value">${goldScore.toLocaleString()}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-icon">⚪</span>
      <span>Silver × ${totalCoinsCollected.silver}</span>
      <span class="breakdown-value">${silverScore.toLocaleString()}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-icon">🟤</span>
      <span>Bronze × ${totalCoinsCollected.bronze}</span>
      <span class="breakdown-value">${bronzeScore.toLocaleString()}</span>
    </div>
    <div class="final-score">Final: ${score.toLocaleString()}</div>
    <div class="total-moves">Total moves: ${moveCount}</div>
  `;
}

/* ── Game flow ───────────────────────────────────────────── */
function newGame() {
  grid = emptyGrid();
  coinGrid = emptyCoinGrid();
  score = 0;
  won = false;
  keepPlaying = false;
  busy = false;
  moveCount = 0;
  totalCoinsCollected = { gold: 0, silver: 0, bronze: 0 };
  $score.textContent = 0;
  $winOvl.classList.remove('active');
  $loseOvl.classList.remove('active');
  $harvesterOvl.classList.remove('active');

  addRandom(grid, coinGrid, 1);
  const nt = addRandom(grid, coinGrid, 1);
  renderTiles(nt);
  updateInfoBar();
}

function handleMove(dir) {
  if (busy) return;

  const stage = determineStage(grid);
  const result = moveWithCoins(grid, coinGrid, dir);
  if (!result.moved) return;

  busy = true;
  grid = result.grid;
  coinGrid = result.coinGrid;
  updateScore(result.points);
  moveCount++;

  // Spawn new tile with possible coin
  const currentStage = determineStage(grid);
  const nt = addRandom(grid, coinGrid, currentStage);
  renderTiles(nt, result.mergedPositions);

  // Check harvester
  if (moveCount > 0 && moveCount % HARVESTER_INTERVAL === 0) {
    const collected = harvestCoins(coinGrid);
    const coinScore = calculateCoinScore(collected);
    totalCoinsCollected.gold += collected.gold;
    totalCoinsCollected.silver += collected.silver;
    totalCoinsCollected.bronze += collected.bronze;
    updateScore(coinScore);
    renderTiles(null); // re-render without coins
    showHarvesterAnimation(collected, coinScore);
  }

  updateInfoBar();

  setTimeout(() => {
    if (!won && !keepPlaying && hasValue(grid, 2048)) {
      won = true;
      $winOvl.classList.add('active');
    } else if (!canMove(grid)) {
      // Final harvest before game over
      const finalCollected = harvestCoins(coinGrid);
      const finalCoinScore = calculateCoinScore(finalCollected);
      totalCoinsCollected.gold += finalCollected.gold;
      totalCoinsCollected.silver += finalCollected.silver;
      totalCoinsCollected.bronze += finalCollected.bronze;
      if (finalCoinScore > 0) {
        updateScore(finalCoinScore);
      }
      showGameOverBreakdown();
      $loseOvl.classList.add('active');
    }
    busy = false;
  }, 150);
}

/* ── Input ───────────────────────────────────────────────── */
const DIR = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 };

document.addEventListener('keydown', e => {
  if (DIR[e.key] !== undefined) { e.preventDefault(); handleMove(DIR[e.key]); }
});

// Touch / swipe
let tx, ty;
document.getElementById('board').addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
});
document.getElementById('board').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 2 : 0);
  else handleMove(dy > 0 ? 3 : 1);
});

/* ── Buttons ─────────────────────────────────────────────── */
document.getElementById('newGameBtn').onclick = newGame;
document.getElementById('winNewGameBtn').onclick = newGame;
document.getElementById('loseNewGameBtn').onclick = newGame;
document.getElementById('keepGoingBtn').onclick = () => {
  keepPlaying = true;
  $winOvl.classList.remove('active');
};

/* ── Resize ──────────────────────────────────────────────── */
window.addEventListener('resize', () => renderTiles());

/* ── Start! ──────────────────────────────────────────────── */
newGame();
