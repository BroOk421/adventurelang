// =========================
// GAME LOOP
// =========================

// Kailangan ang tunay na oras sa pagitan ng frames (deltaMs) para
// PAREHONG bilis ang galaw ng player kahit saang mundo - kung basta
// fixed na bilang ng piksel kada TICK (hindi kada SEGUNDO) ang
// gagamitin, mas bibilis ang galaw sa mundong mas magaan i-render
// (hal. loob ng bahay, walang niyebe/ulan/alitaptap na iginuguhit) kesa
// sa mas mabigat na mundo (labas, puno ng weather effects) - dahil mas
// madalas tumatakbo ang requestAnimationFrame sa magaan na mundo.
let lastFrameTimeMs = null;

function gameLoop(timestampMs) {
  const deltaMs = lastFrameTimeMs === null ? 0 : timestampMs - lastFrameTimeMs;

  lastFrameTimeMs = timestampMs;

  update(deltaMs);
  draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
