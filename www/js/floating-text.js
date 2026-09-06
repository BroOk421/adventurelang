// =========================
// FLOATING TEXT (BAGONG HILING ng user)
// =========================
//
// "yung sa foods kapag kumain may lilitaw na label na may stroke kapag
// kumain ako ng carrots lilitaw yung +health nya" - maliit na text na
// lumulutang paitaas mula sa isang WORLD position (may text-stroke/
// outline para mabasa kahit anong background) - ginagamit ito ng:
//   - eatItem() (hotbar.js) - "+<healAmount>" sa itaas ng ULO ng player
//     kapag kumain ng food (carrot, atbp).
//   - collectGroundItem() (ground-items.js) - "+<count>" sa itaas ng
//     ULO ng player kapag may nadampot na item sa lupa (puno/bato/atbp).
//
// "lagyan mo na rin ng ganung effects sa trees kung ilan nakuha niya
// like 3... magkaka roon ng animation galing head pa taas konti na +1
// +2 +3 kada isa +1 isa pa +2 +3 pero isang label lang" - kapag
// SUNOD-SUNOD (loob ng ilang segundo) ang pagdampot ng PAREHONG item
// type (hal. 3 magkakahiwalay na piraso ng kahoy mula sa isang puno),
// HUWAG mag-spawn ng 3 HIWALAY na lumulutang na text (magulo/nagtatabon
// sa isa't isa) - sa HALIP, ISANG label lang ang gagamitin, na
// nagpapatuloy lang "dumadagdag" (mergeKey, tingnan ang
// spawnFloatingText sa ibaba) - +1, papalitan ng +2, papalitan ng +3 -
// nire-reset din ang oras ng pagkawala nito kada dagdag, kaya laging
// nakikita habang tuloy-tuloy pa ang pagdampot.

let floatingTexts = []; // { text, x, y, startTime, color, mergeKey }

const FLOATING_TEXT_DURATION_MS = 1100;
const FLOATING_TEXT_RISE_PX = 34;
// Gaano "kabago" pa dapat ang isang naunang floating text (parehong
// mergeKey) para dito na lang idagdag ang bagong halaga, sa halip na
// gumawa ng bago - tama lang na katumbas ito ng buong DURATION (basta
// "buhay" pa/nakikita pa ang naunang label, puwede pa itong madagdagan).
const FLOATING_TEXT_MERGE_WINDOW_MS = FLOATING_TEXT_DURATION_MS;

// x/y - WORLD space (hindi screen space) - karaniwan, ang itaas ng ULO
// ng player. "mergeKey" (opsyonal) - kung may kaparehong mergeKey na
// floating text pa ring "buhay" (loob ng FLOATING_TEXT_MERGE_WINDOW_MS),
// DUN na lang idadagdag ang `amount` (kabuuang bilang, "+1"->"+2"->"+3")
// sa halip na gumawa ng bagong hiwalay na label - "isang label lang"
// gaya ng hiling. Kung wala namang "amount" (hal. text na literal lang,
// gaya ng "+10" para sa health), basta ipapakita ang `text` nang buo -
// walang merging (bawat tawag, bagong label).
function spawnFloatingText(x, y, text, options = {}) {
  const { color = "#ffe98a", mergeKey = null, amount = 0 } = options;

  if (mergeKey) {
    const existing = floatingTexts.find(
      (entry) =>
        entry.mergeKey === mergeKey &&
        Date.now() - entry.startTime < FLOATING_TEXT_MERGE_WINDOW_MS,
    );

    if (existing) {
      existing.amount += amount;
      existing.text = "+" + existing.amount;
      existing.startTime = Date.now(); // i-reset ang fade - "buhay" pa
      existing.x = x;
      existing.y = y;

      return existing;
    }
  }

  const entry = {
    text,
    x,
    y,
    startTime: Date.now(),
    color,
    mergeKey,
    amount,
  };

  floatingTexts.push(entry);

  return entry;
}

// Tinatawag KADA FRAME mula sa update() (update.js) - tinatanggal ang
// mga naubusan na ng oras.
function updateFloatingTexts() {
  if (floatingTexts.length === 0) return;

  const now = Date.now();

  floatingTexts = floatingTexts.filter(
    (entry) => now - entry.startTime < FLOATING_TEXT_DURATION_MS,
  );
}

// Tinatawag KADA FRAME mula sa draw() (draw.js) - SA LABAS ng world-
// space camera transform (kaparehong pattern ng drawMissionaryGreeting,
// draw.js) - manual na kino-convert ang WORLD position papuntang SCREEN
// position (camera.zoom/offset), gamit ang FIXED/hindi-naka-zoom na
// font size. AYOS: dating iginuguhit ito SA LOOB ng naka-scale(zoom)
// context - kaya lumalaki NANG SOBRA (13px * zoom, hal. 13*3.5=45.5px
// TALAGANG screen pixels) at MALI ang naging TINGIN ng posisyon nito
// (masyadong malayo mula sa ulo ng player).
function drawFloatingTexts() {
  if (floatingTexts.length === 0) return;

  const now = Date.now();

  const snappedCameraX = Math.round(camera.x * camera.zoom) / camera.zoom;
  const snappedCameraY = Math.round(camera.y * camera.zoom) / camera.zoom;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // AYOS: siguraduhing "clean slate" (walang naiwang scale/translate mula sa ibang function bago dito) ang transform bago mag-compute ng screen coordinates
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.lineJoin = "round";

  for (const entry of floatingTexts) {
    const elapsed = now - entry.startTime;
    const t = Math.min(1, elapsed / FLOATING_TEXT_DURATION_MS);

    const worldY = entry.y - t * FLOATING_TEXT_RISE_PX;

    const screenX = (entry.x - snappedCameraX) * camera.zoom;
    const screenY = (worldY - snappedCameraY) * camera.zoom;

    // Buo muna (walang kupas) sa unang 60% ng buhay nito, saka pa lang
    // unti-unting kumukupas papunta sa dulo - hindi basta linear mula
    // simula, para hindi "agad nauupos" sa mata.
    const alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

    ctx.globalAlpha = Math.max(0, alpha);

    // AYOS (hiling ng user): "may label na may stroke" - dark outline
    // muna bago ang kulay na fill, para mabasa kahit anong background
    // (damo, lupa, snow, gabi, atbp).
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
    ctx.strokeText(entry.text, screenX, screenY);

    ctx.fillStyle = entry.color;
    ctx.fillText(entry.text, screenX, screenY);
  }

  ctx.restore();
}

// Maginhawang helper - "itaas ng ulo" ng PLAYER (world space) - dito
// karaniwang lumalabas ang mga floating text (parehong food/item
// pickup), kaya iisa na lang ang pinagmumulan ng x/y computation.
//
// AYOS (na-calibrate empirically): AKALA ko noon ay "top-left" mismo ng
// bounding box (player.y) ang kasing-taas ng ULO sa sprite - MALI: may
// malaking transparent padding sa ITAAS ng bounding box (para sa mga
// animation na kailangan ng dagdag na espasyo, hal. axe swing) - ang
// TALAGANG ulo ay nasa mas MABABANG parte nito, humigit-kumulang 25%
// pababa mula sa player.y (natukoy sa pamamagitan ng aktwal na
// pagsukat/screenshot, hindi basta hula).
function getPlayerHeadPosition() {
  return {
    x: player.x + player.width / 2,
    y: player.y + player.height * 0.25 - 8,
  };
}
