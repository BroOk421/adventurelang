// =========================
// RAIN + THUNDERSTORM
// =========================
//
// Katulad ng snow.js: WORLD-ANCHORED ang bawat patak (hindi sumusunod
// sa camera), naka-batay sa TOTOONG orasan kung kailan ito bumabagsak
// (tingnan ang calendar.js - 1-12 random na araw kada 24-araw na
// cycle). May 3 tier ng lalim (RAIN_TIERS - top/mid/bottom), random na
// napipili kada patak, kaya magkakaiba ang laki/bilis/lambot nila -
// hindi lahat parehong-pareho.
//
// BAWAT PATAK AY MAY TARGET TILE ROW: diretsong pababa ang bawat patak
// (walang tagilid) papunta sa isang random na row na naka-align sa
// TILE_SIZE grid ng mapa - pag-abot doon (drop.y >= drop.targetY), doon
// mismo lumalabas ang splash (drawRainGroundSplashes), tapos
// nag-re-reset ang patak sa bagong random na posisyon/target sa itaas
// ng screen ulit. Kaya laging magkatugma ang splash sa TALAGANG puntong
// tinamaan ng patak - hindi na hiwalay na "spawn timer" na walang
// kinalaman sa mismong patak.
//
// Bukod sa ulan, may THUNDERSTORM effect din: paminsan-minsang biglang
// pagputi/pag-flash ng buong screen (parang kidlat), random ang
// pagitan - tingnan ang drawThunderFlash.

const RAIN_DROP_COUNT = 150;

// Light blue ang kulay ng ulan. Iisa lang ang kulay - ang tier (sa
// ibaba) ang nagbabago ng opacity/laki/bilis, hindi ng kulay.
const RAIN_COLOR = "161, 189, 212";

// =========================
// 3 TIER NG LALIM (top/mid/bottom)
// =========================
//
// Random na napipili ang isa sa 3 sa PAGGAWA ng bawat patak (hindi
// nagbabago pagkatapos) - "top" ang pinakamalayo (maliit, mabagal,
// malabo), "bottom" ang pinakamalapit (malaki, mabilis, makapal). Kaya
// hindi lang basta parehong-pareho ang bawat patak - may lalim.
const RAIN_TIERS = [
  {
    name: "top",
    speedMin: 7,
    speedMax: 9,
    lengthMin: 6,
    lengthMax: 9,
    opacityMin: 0.15,
    opacityMax: 0.3,
    widthMin: 1,
    widthMax: 1,
  },
  {
    name: "mid",
    speedMin: 10,
    speedMax: 13,
    lengthMin: 9,
    lengthMax: 13,
    opacityMin: 0.32,
    opacityMax: 0.5,
    widthMin: 1,
    widthMax: 1,
  },
  {
    name: "bottom",
    speedMin: 14,
    speedMax: 18,
    lengthMin: 13,
    lengthMax: 18,
    opacityMin: 0.5,
    opacityMax: 0.78,
    widthMin: 1,
    widthMax: 1,
  },
];

let raindrops = [];

// =========================
// SPLASH NA "TUMATAMA SA LUPA" (sa mismong target ng bawat patak)
// =========================
//
// Kapag umabot ang isang patak sa targetY nito, doon lumalabas ang
// splash - munting paos na singsing na lumalaki habang kumukupas,
// parang totoong ulan na tumatama sa lupa. Kapareho ng ginagawa ng snow
// "back" layer (snow.js): naka-offset sa camera.x*zoom, pero
// ITINATABI/IGINUGUHIT SA PAGITAN ng dalawang world-transform block sa
// draw.js (tingnan ang drawRainGroundSplashes) - kaya nasa ILALIM ito
// ng player/mga bagay (naka-Y-sort sa drawMapObjects), hindi nasa
// itaas.

let rainGroundSplashes = []; // { x, y, bornAt } - offset-based (kapareho ng snow)

const RAIN_SPLASH_DURATION_MS = 300;

// Porsyento ng laki ng isang tile (sa screen, KASAMA na ang zoom) ang
// pinaka-malaking radius ng splash - kaya palaging makikita ito nang
// malinaw kahit anong zoom level, hindi tulad ng dating FIXED na 3.5px
// (na halos hindi na makita sa zoom 4x-8x dahil sobrang liit niya
// kumpara sa isang buong tile).
const RAIN_SPLASH_RADIUS_TILE_FRACTION = 0.2;

function spawnRainGroundSplash(x, y) {
  rainGroundSplashes.push({ x, y, bornAt: performance.now() });
}

function isRaining() {
  if (typeof isIndoors === "function" && isIndoors()) return false;

  return getCalendarState().isRainDay;
}

function getRainOffsetX() {
  return Math.round(camera.x * camera.zoom);
}

function getRainOffsetY() {
  return Math.round(camera.y * camera.zoom);
}

// Ang laki ng ISANG tile SA SCREEN (device-pixel space, kasama na ang
// zoom) - dahil ang offsetX/offsetY (camera.x/y * zoom) ay NASA
// device-pixel space na rin, dito dapat din naka-batay ang alignment ng
// bawat target row, HINDI sa raw TILE_SIZE (na world-unit pa lang,
// hindi pa naka-zoom) - kung hindi, mali ang pagtutugma at napakaliit
// din ang lahat ng nakabatay dito (kagaya ng nangyari dati sa splash
// radius).
function getRainTileStep() {
  return TILE_SIZE * camera.zoom;
}

// Pumipili ng bagong random na target tile-row (naka-align sa
// TILE_SIZE grid ng mapa, hindi basta random na Y) sa loob ng
// kasalukuyang tanawin (+/- kaunting margin), tapos inilalagay ang
// patak sa itaas nito bilang panibagong starting point - kapareho ng
// gawi ng isang totoong patak ng ulan na "tumatarget" sa isang tile
// bago bumagsak.
function resetRaindrop(drop, offsetX, offsetY) {
  const tier = RAIN_TIERS[Math.floor(Math.random() * RAIN_TIERS.length)];

  const tileStep = getRainTileStep();
  const topRow = Math.floor(offsetY / tileStep) - 1;
  const visibleRows = Math.ceil(canvas.height / tileStep) + 2;
  const targetRow = topRow + Math.floor(Math.random() * visibleRows);

  drop.x = offsetX + Math.random() * canvas.width;
  drop.targetY = targetRow * tileStep;

  // LAHAT ng patak ay nagmumula sa ITAAS ng kasalukuyang view (hindi sa
  // itaas lang ng SARILING target nito) - kagaya ng sample: laging
  // negative/nasa itaas ng canvas ang starting Y, kahit ano pa ang
  // target row. Kaya ang mga patak na naka-target sa MALAPIT (itaas ng
  // screen) ay mabilis na tatama, habang ang mga naka-target sa
  // MALAYO (ibaba ng screen) ay matagal pa bago makarating doon - kaya
  // sa umpisa, tila sa itaas lang unang tumatama ang ulan, unti-unting
  // kumakalat pababa hanggang ma-cover ang BUONG screen sa paglipas ng
  // panahon (hindi bigla-biglang kumpleto agad lahat).
  drop.y = offsetY - (tileStep + Math.random() * canvas.height);

  drop.speed = tier.speedMin + Math.random() * (tier.speedMax - tier.speedMin);
  drop.length =
    tier.lengthMin + Math.random() * (tier.lengthMax - tier.lengthMin);
  drop.opacity =
    tier.opacityMin + Math.random() * (tier.opacityMax - tier.opacityMin);
  drop.width = tier.widthMin + Math.random() * (tier.widthMax - tier.widthMin);
}

function createRaindrop(offsetX, offsetY) {
  const drop = {};

  resetRaindrop(drop, offsetX, offsetY);

  return drop;
}

function initRain() {
  raindrops = [];

  const offsetX = getRainOffsetX();
  const offsetY = getRainOffsetY();

  for (let i = 0; i < RAIN_DROP_COUNT; i++) {
    // Walang override dito - LAHAT (kasama na ang unang batch) ay
    // dapat magsimula sa itaas ng view (tingnan ang resetRaindrop),
    // hindi na kailangan pang ikalat nang artipisyal papuntang gitna
    // ng screen.
    raindrops.push(createRaindrop(offsetX, offsetY));
  }
}

function updateRain() {
  // Tinatanggal pa rin ang mga tapos nang splash kahit tumigil na ang
  // ulan (para hindi maiwang "nakabimbin" ang mga zombie na entry sa
  // rainGroundSplashes), pero ang pagbagsak/pagbago ng patak mismo ay
  // ang lang naghihinto.
  const now = performance.now();

  rainGroundSplashes = rainGroundSplashes.filter(
    (splash) => now - splash.bornAt < RAIN_SPLASH_DURATION_MS,
  );

  if (!isRaining()) return;

  if (raindrops.length === 0) initRain();

  const offsetX = getRainOffsetX();
  const offsetY = getRainOffsetY();

  for (const drop of raindrops) {
    drop.y += drop.speed;

    // Pag-abot ng patak sa target row nito - doon lumalabas ang
    // splash, tapos bagong random na target/posisyon naman ulit.
    if (drop.y >= drop.targetY) {
      spawnRainGroundSplash(drop.x, drop.targetY);
      resetRaindrop(drop, offsetX, offsetY);
    }
  }
}

// Screen space (tulad ng snow "front" layer) - sa ibabaw ng lahat. Ang
// mga splash naman (drawRainGroundSplashes) ay HIWALAY na tinatawag ng
// draw.js sa mas maagang punto, sa ILALIM ng player/mga bagay.
function drawRain() {
  if (!isRaining() || raindrops.length === 0) return;

  const offsetX = getRainOffsetX();
  const offsetY = getRainOffsetY();

  ctx.save();

  ctx.strokeStyle = "rgb(" + RAIN_COLOR + ")";
  ctx.lineCap = "round";

  for (const drop of raindrops) {
    ctx.globalAlpha = drop.opacity;
    ctx.lineWidth = drop.width;

    const x = drop.x - offsetX;
    const y = drop.y - offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - drop.length);
    ctx.stroke();
  }

  ctx.restore();
}

// Munting paos na singsing na kumikislap kahit saang tile - lumalaki
// habang kumukupas. Tinatawag ito ng draw.js sa PAGITAN ng dalawang
// world-transform block (kapareho ng drawSnow("back")), kaya nasa
// ILALIM ito ng player at ng mga bagay sa mapa.
function drawRainGroundSplashes() {
  if (rainGroundSplashes.length === 0) return;

  const now = performance.now();
  const offsetX = getRainOffsetX();
  const offsetY = getRainOffsetY();

  // Naka-batay sa laki ng tile SA SCREEN (may kasama nang zoom) ang
  // pinaka-laki ng bawat splash - kaya palaging kapansin-pansin ito
  // kumpara sa laki ng isang tile, kahit anong zoom level.
  const maxRadius = getRainTileStep() * RAIN_SPLASH_RADIUS_TILE_FRACTION;

  ctx.save();
  ctx.strokeStyle = "rgb(" + RAIN_COLOR + ")";
  ctx.lineWidth = Math.max(1, camera.zoom * 0.1);

  for (const splash of rainGroundSplashes) {
    const progress = Math.min(
      1,
      (now - splash.bornAt) / RAIN_SPLASH_DURATION_MS,
    );

    // Mabilis na lumalaki sa simula (para agad kitang-kita), tapos
    // dahan-dahan na lang - hindi tuluy-tuloy/linear na paglaki, para
    // hindi laging pinaka-malabo ang splash sa oras na pinaka-malaki
    // ito (dating problema: sabay na sumasabay pagliit ng opacity at
    // paglaki ng radius, kaya laging "invisible sweet spot" lang ang
    // nakikita).
    const radius = maxRadius * Math.sqrt(progress);
    const alpha = (1 - progress) * 0.9;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.ellipse(
      splash.x - offsetX,
      splash.y - offsetY,
      radius,
      radius * 0.45,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  ctx.restore();
}

// =========================
// THUNDERSTORM (kidlat)
// =========================
//
// Kapag thunderstorm ang kasalukuyang maulan na araw: paminsan-minsan
// may biglaang pagputi ng buong screen - parang kidlat - tapos mabilis
// itong kumukupas. Purong kwenta mula sa Date.now (seededRandom +
// modulo) - walang itinatabing estado/timer, kaya kahit mag-refresh ka
// sa gitna ng isang flash, makikita mo pa rin ito sa tamang sandali.

const THUNDER_SLOT_SECONDS = 8; // posibleng may kidlat kada ~8 segundo
const THUNDER_FLASH_SECONDS = 0.18; // bilis ng pagkupas ng flash
const THUNDER_SLOT_CHANCE = 0.5; // kalahati ng mga slot ay may kidlat

// Naka-tabi kung anong "slot" na huling pinatugtog ang tunog ng kulog -
// para ISANG BESES LANG tumugtog kada flash (hindi paulit-ulit habang
// kumukupas pa ito, dahil tinatawag ang function na ito KADA FRAME).
let lastThunderSoundSlot = null;

function getThunderFlashAlpha() {
  const calendar = getCalendarState();

  if (!calendar.isRainDay || !calendar.isThunderstorm) return 0;
  if (typeof isIndoors === "function" && isIndoors()) return 0;

  const t = Date.now() / 1000;
  const slot = Math.floor(t / THUNDER_SLOT_SECONDS);
  const withinSlot = t % THUNDER_SLOT_SECONDS;

  if (seededRandom(slot * 977 + 13) > THUNDER_SLOT_CHANCE) return 0;
  if (withinSlot > THUNDER_FLASH_SECONDS) return 0;

  // Bagong tunog ng kulog (audio.js) - dito lang, sa MISMONG unang
  // frame ng flash na ito (naka-lock na ngayon ang `slot`, kaya hindi
  // na ito muling tutugtog hangga't parehas pa rin ang slot).
  if (lastThunderSoundSlot !== slot) {
    lastThunderSoundSlot = slot;

    if (typeof playThunderSfx === "function") playThunderSfx();
  }

  return 1 - withinSlot / THUNDER_FLASH_SECONDS;
}

// Screen space, sa PINAKAIBABAW ng lahat (kahit ng snow) - kidlat ito,
// dapat kitang-kita saan mang parte ng screen.
function drawThunderFlash() {
  const alpha = getThunderFlashAlpha();

  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
