// =========================
// BED (sa loob ng bahay) - tulugan hanggang 6am
// =========================
//
// Isang simpleng NAKA-GUHIT na kama (walang tunay na sprite pa, kagaya
// ng buong houseInside - "placeholder room" pa rin, tingnan ang
// paliwanag sa worlds.js) sa loob ng houseInside. I-click ito (kailangan
// abot/malapit, kagaya ng ibang klikable dito - oldman/crafter/stove)
// para matulog. GABI LANG (mula 6pm hanggang bago mag-6am) puwedeng
// matulog - kung araw pa, may lalabas na mensahe sa halip.
//
// Pagkatapos matulog, "tumatalon" pasulong ang oras (advanceGameTime,
// gametime.js) papuntang ALINMANG mas malapit na 6:00 AM - ngayong araw
// pa (kung maaga pa, hal. 3am) o bukas na (kung gabi na, 6pm pataas) -
// walang literal na paghihintay, may saglit na PAGDIDILIM ng buong
// screen (fade) habang "natutulog".

const BED_TILE_COLS = 2;
const BED_TILE_ROWS = 3;
const BED_X = 40; // world px - sa loob ng houseInside, malapit sa itaas-kaliwang sulok
const BED_Y = 56;
const BED_WIDTH = BED_TILE_COLS * TILE_SIZE;
const BED_HEIGHT = BED_TILE_ROWS * TILE_SIZE;

const SLEEP_WAKE_HOUR = 6; // 6:00 AM

// Puwede lang matulog sa pagitan ng 6pm hanggang bago mag-6am (gabi) -
// tumutugma sa "isDaytime" ng calendar.js (06:00-17:59 = araw).
function isBedUsableNow() {
  return !getCalendarState().isDaytime;
}

function isBedTile(col, row) {
  if (currentWorld !== "houseInside") return false;

  const px = col * TILE_SIZE;
  const py = row * TILE_SIZE;

  return (
    px >= BED_X && px < BED_X + BED_WIDTH && py >= BED_Y && py < BED_Y + BED_HEIGHT
  );
}

// Kailan ang PINAKAMALAPIT na susunod na 6:00 AM mula sa ibinigay na
// oras (ngayong araw pa, kung maaga pa; bukas na, kung lampas na)?
function getNextWakeTimeMs(fromMs) {
  const secondsIntoDay = (fromMs / 1000) % DAY_NIGHT_SECONDS;
  const startOfDayMs = fromMs - secondsIntoDay * 1000;
  const wakeSecondsIntoDay = (SLEEP_WAKE_HOUR / 24) * DAY_NIGHT_SECONDS;

  let wakeMs = startOfDayMs + wakeSecondsIntoDay * 1000;

  if (wakeMs <= fromMs) wakeMs += DAY_NIGHT_SECONDS * 1000;

  return wakeMs;
}

// =========================
// FADE OVERLAY (pagdidilim habang "natutulog")
// =========================

const BED_FADE_MS = 550;

function fadeScreenThenBack(onBlackScreen) {
  const overlay = document.getElementById("bed-sleep-overlay");

  if (!overlay) {
    // Walang overlay (hindi dapat mangyari) - direktang gawin na lang
    // ang laman kahit walang fade.
    onBlackScreen();
    return;
  }

  overlay.classList.remove("hidden");

  // Force reflow bago i-add ang "visible" class, para gumana ang CSS
  // transition kahit paulit-ulit itong tawagin.
  void overlay.offsetWidth;

  overlay.classList.add("visible");

  setTimeout(() => {
    onBlackScreen();

    setTimeout(() => {
      overlay.classList.remove("visible");

      setTimeout(() => {
        overlay.classList.add("hidden");
      }, BED_FADE_MS);
    }, 250); // saglit na itim bago bumalik ang liwanag
  }, BED_FADE_MS);
}

// Tinatawag ng dig.js (mousedown handler) kapag na-click ang bed tile
// AT abot ng player.
function trySleepInBed() {
  if (!isBedUsableNow()) {
    if (typeof showSettingsToast === "function") {
      showSettingsToast("Hindi mo pa kailangang matulog - gabi ka na lang (mula 6pm).");
    }

    return;
  }

  const nowMs = getGameNow();
  const wakeMs = getNextWakeTimeMs(nowMs);
  const deltaMs = wakeMs - nowMs;

  fadeScreenThenBack(() => {
    advanceGameTime(deltaMs);
  });

  if (typeof showSettingsToast === "function") {
    setTimeout(() => {
      showSettingsToast("Magandang umaga! ☀️ 6:00 AM na.");
    }, BED_FADE_MS + 250);
  }
}

// =========================
// PAGGUHIT (simpleng kama, kagaya ng estilo ng "placeholder room")
// =========================

const BED_FRAME_COLOR = "#4a3624";
const BED_FRAME_EDGE_COLOR = "#2f2116";
const BED_MATTRESS_COLOR = "#e7e1d2";
const BED_BLANKET_COLOR = "#8a3b3b";
const BED_BLANKET_STRIPE_COLOR = "#6e2c2c";
const BED_PILLOW_COLOR = "#f4efe4";

function drawBed() {
  if (currentWorld !== "houseInside" || !mapReady) return;

  ctx.save();

  // Frame (buong kama).
  ctx.fillStyle = BED_FRAME_COLOR;
  ctx.fillRect(BED_X, BED_Y, BED_WIDTH, BED_HEIGHT);

  ctx.fillStyle = BED_FRAME_EDGE_COLOR;
  ctx.fillRect(BED_X, BED_Y, BED_WIDTH, 3);
  ctx.fillRect(BED_X, BED_Y + BED_HEIGHT - 3, BED_WIDTH, 3);

  // Unan (sa itaas, malapit sa headboard).
  ctx.fillStyle = BED_PILLOW_COLOR;
  ctx.fillRect(BED_X + 3, BED_Y + 4, BED_WIDTH - 6, 10);

  // Kumot (natitirang bahagi).
  ctx.fillStyle = BED_BLANKET_COLOR;
  ctx.fillRect(BED_X + 3, BED_Y + 16, BED_WIDTH - 6, BED_HEIGHT - 20);

  ctx.fillStyle = BED_BLANKET_STRIPE_COLOR;
  for (let y = BED_Y + 20; y < BED_Y + BED_HEIGHT - 4; y += 8) {
    ctx.fillRect(BED_X + 3, y, BED_WIDTH - 6, 2);
  }

  // Bahagyang bakas ng mattress sa gilid.
  ctx.fillStyle = BED_MATTRESS_COLOR;
  ctx.fillRect(BED_X + 1, BED_Y + 3, 2, BED_HEIGHT - 6);
  ctx.fillRect(BED_X + BED_WIDTH - 3, BED_Y + 3, 2, BED_HEIGHT - 6);

  ctx.restore();
}
