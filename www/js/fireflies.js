// =========================
// FIREFLIES (gabi lang, sa labas)
// =========================
//
// Munting kumikinang na tuldok na lumilipad-lipad nang random sa gabi -
// WORLD-ANCHORED tulad ng snow/rain (hindi sumusunod sa camera), pero
// HINDI bumabagsak - random na "wander" ang galaw nila (parang totoong
// alitaptap: paikot-ikot, minsan biglang nagbabago ng direksyon).
// Unti-unting lumalabas/nawawala kasabay ng pagdilim/pagliwanag ng
// kalangitan (getNightAmount mula sa atmosphere.js), hindi biglaan.

const FIREFLY_COUNT = 35;
const FIREFLY_GLOW_RADIUS = 2.2;
const FIREFLY_RESET_MARGIN = 40;

// Simula lumabas ang mga alitaptap kapag ganito na kadilim ang gabi
// (0=tanghali, 1=hatinggabi), buong lakas na sila sa NIGHT_FULL.
const FIREFLY_NIGHT_START = 0.35;
const FIREFLY_NIGHT_FULL = 0.6;

let fireflies = [];

function getFireflyOffsetX() {
  return Math.round(camera.x * camera.zoom);
}

function getFireflyOffsetY() {
  return Math.round(camera.y * camera.zoom);
}

function isFireflyWeather() {
  if (typeof isIndoors === "function" && isIndoors()) return false;

  // Hindi lumalabas ang alitaptap habang umuulan ng tubig o niyebe -
  // gabi lang AT tuyo/malinaw ang panahon.
  if (typeof isRaining === "function" && isRaining()) return false;
  if (typeof isSnowWeather === "function" && isSnowWeather()) return false;

  const nightAmount = typeof getNightAmount === "function" ? getNightAmount() : 0;

  return nightAmount > FIREFLY_NIGHT_START;
}

function createFirefly(offsetX, offsetY) {
  return {
    x: offsetX + Math.random() * canvas.width,
    y: offsetY + Math.random() * canvas.height,
    angle: Math.random() * Math.PI * 2,
    turnSpeed: (Math.random() - 0.5) * 0.06,
    speed: 0.2 + Math.random() * 0.35,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.02 + Math.random() * 0.03,
  };
}

function initFireflies() {
  fireflies = [];

  const offsetX = getFireflyOffsetX();
  const offsetY = getFireflyOffsetY();

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    fireflies.push(createFirefly(offsetX, offsetY));
  }
}

function updateFireflies() {
  if (!isFireflyWeather()) return;

  if (fireflies.length === 0) initFireflies();

  const offsetX = getFireflyOffsetX();
  const offsetY = getFireflyOffsetY();
  const wrapWidth = canvas.width + FIREFLY_RESET_MARGIN * 2;
  const wrapHeight = canvas.height + FIREFLY_RESET_MARGIN * 2;

  for (const fly of fireflies) {
    // Paminsan-minsang biglang pagbabago ng direksyon - para hindi
    // masyadong "makinis"/mekanikal ang galaw, mas parang totoong
    // insekto.
    if (Math.random() < 0.01) fly.turnSpeed = (Math.random() - 0.5) * 0.06;

    fly.angle += fly.turnSpeed;
    fly.x += Math.cos(fly.angle) * fly.speed;
    fly.y += Math.sin(fly.angle) * fly.speed;
    fly.twinklePhase += fly.twinkleSpeed;

    const screenX = fly.x - offsetX;
    const screenY = fly.y - offsetY;

    if (screenX > canvas.width + FIREFLY_RESET_MARGIN) fly.x -= wrapWidth;
    else if (screenX < -FIREFLY_RESET_MARGIN) fly.x += wrapWidth;

    if (screenY > canvas.height + FIREFLY_RESET_MARGIN) fly.y -= wrapHeight;
    else if (screenY < -FIREFLY_RESET_MARGIN) fly.y += wrapHeight;
  }
}

// Screen space, sa IBABAW ng araw/gabi na tint (drawDayNight) - sarili
// nilang liwanag ito, hindi dapat sumasabay dumilim.
function drawFireflies() {
  if (fireflies.length === 0) return;
  if (!isFireflyWeather()) return;

  const nightAmount = typeof getNightAmount === "function" ? getNightAmount() : 0;
  const intensity = Math.max(
    0,
    Math.min(
      1,
      (nightAmount - FIREFLY_NIGHT_START) / (FIREFLY_NIGHT_FULL - FIREFLY_NIGHT_START),
    ),
  );

  if (intensity <= 0) return;

  const offsetX = getFireflyOffsetX();
  const offsetY = getFireflyOffsetY();

  ctx.save();
  ctx.fillStyle = "#d4ff8a";
  ctx.shadowColor = "#d4ff8a";
  ctx.shadowBlur = 6;

  for (const fly of fireflies) {
    const twinkle = 0.5 + 0.5 * Math.sin(fly.twinklePhase);

    ctx.globalAlpha = intensity * (0.3 + 0.7 * twinkle);

    ctx.beginPath();
    ctx.arc(fly.x - offsetX, fly.y - offsetY, FIREFLY_GLOW_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
