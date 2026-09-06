// =========================
// GAME CLOCK (epoch + sleep offset)
// =========================
//
// Dating disenyo (calendar.js): direktang Date.now() laban sa isang
// FIXED na epoch constant (Jan 1, 2025) ang basehan ng petsa/taon -
// habang tumatagal ang TOTOONG panahon mula sa constant na iyon, unti-
// unting "tumatanda" ang taon sa loob ng laro (hal. Taon 2079+ na sa
// ngayon, dahil malayo na tayo sa 2025 at 30 minuto lang ang 1 araw) -
// hindi ito ang gustong resulta (dapat laging Taon 2000, Enero 1 ang
// simula ng isang BAGONG laro).
//
// Dalawang bagay ang pinagsama dito:
//
//   1) GAME EPOCH - kailan "nagsimula" ang mundo (Araw 1, Taon 2000).
//      Naka-save sa localStorage, ITINATAKDA LANG kapag WALA pang laman
//      (unang beses maglaro/bagong save) - kaya PAREHO ito sa bawat
//      pag-reload ng PAREHONG laro (hindi Date.now() kada reload).
//
//   2) SLEEP OFFSET - dagdag na "oras" (hindi bahagi ng totoong
//      paglipas ng panahon) - idinadagdag dito tuwing matulog sa bed
//      (tingnan ang js/bed.js) para "tumalon" pasulong ang oras
//      papuntang 6am ng susunod na araw, sa halip na literal na
//      hintayin.
//
// getGameNow() - ITO ang dapat gamitin sa LAHAT ng lugar na dating
// Date.now() para sa anumang KALENDARYO/DAY-NIGHT/PANAHON/paglaki ng
// tanim/pagbalik ng lupa na kwenta (atmosphere.js, calendar.js,
// dig.js "secondsIntoDay"/dug-tile timestamps/plantedAt, snow.js,
// decor.js/resources.js snow timing) - PERO HINDI para sa mga simpleng
// REAL-TIME na "cooldown" laban sa mabilis na pag-click (hal.
// lastRakeAt/lastEatAt/lastResourceHitAt/lastPlantAt) - dapat totoong
// segundo pa rin sila, hindi apektado ng pagtulog.

const GAME_TIME_SAVE_KEY = "tralala.gameTime.v1";

let gameEpochMs = null;
let gameTimeOffsetMs = 0;

function loadGameTimeState() {
  try {
    const raw = localStorage.getItem(GAME_TIME_SAVE_KEY);
    const saved = raw ? JSON.parse(raw) : null;

    if (saved && typeof saved.epochMs === "number") {
      gameEpochMs = saved.epochMs;
      gameTimeOffsetMs = typeof saved.offsetMs === "number" ? saved.offsetMs : 0;

      return;
    }
  } catch (error) {
    // Sirang laman o naka-block ang localStorage - magsimula na lang sa
    // bago (sa ibaba).
  }

  // Walang naka-save pa (bagong laro, o unang beses) - DITO lang
  // "nagsisimula" ang mundo: NGAYON (Araw 1, Taon 2000 - tingnan ang
  // CALENDAR_START_YEAR sa calendar.js).
  gameEpochMs = Date.now();
  gameTimeOffsetMs = 0;
  // BAGO (hiling ng user: "ayoko na ng auto save") - ang tawag na ito
  // ay isang BEHES lamang, sa PAG-BOOTSTRAP ng bagong laro (walang
  // ibang paraan para itakda ang epoch nang isang beses lang) - kaya
  // "force: true" gamit dito, hindi tulad ng saveGameTimeState() sa
  // advanceGameTime() sa ibaba (na dapat i-suppress).
  saveGameTimeState(true);
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveGameTimeState(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      GAME_TIME_SAVE_KEY,
      JSON.stringify({ epochMs: gameEpochMs, offsetMs: gameTimeOffsetMs }),
    );
  } catch (error) {
    // Hindi kritikal - tuloy lang ang laro, wala lang matatandaan.
  }
}

// Kailangang mangyari ito AGAD (hindi hihintayin ang DOMContentLoaded/
// unang frame) - una itong script na tumatakbo dito (tingnan ang load
// order sa index.html), kaya handa na ang gameEpochMs/gameTimeOffsetMs
// bago pa man tawagin ng ibang file ang getGameNow().
loadGameTimeState();

// Gamitin ito sa halip na Date.now() para sa kalendaryo/day-night/
// panahon/paglaki ng tanim - tingnan ang paliwanag sa itaas.
function getGameNow() {
  return Date.now() + gameTimeOffsetMs;
}

// Idinadagdag ang eksaktong dami ng ms para "tumalon" pasulong ang oras
// (ginagamit ng js/bed.js) - hiwalay na function (sa halip na direktang
// i-mutate ang gameTimeOffsetMs kahit saan) para may IISANG lugar lang
// na nag-a-apply AT nag-se-save nito.
function advanceGameTime(deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;

  gameTimeOffsetMs += deltaMs;
  saveGameTimeState();
}
