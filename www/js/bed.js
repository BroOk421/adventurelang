// =========================
// BED (sa loob ng bahay) - tulugan hanggang 6am
// =========================
//
// BAGONG HILING NG USER (malaking pagbabago): "yung bed is dapat same
// din sa crafter or stove na nahohold tapos naibabaglag din sa ground
// kaya ba 2x3 na tiles? tapos may collisions din" - dating IISANG
// FIXED na kama (BED_X/BED_Y) na laging naroroon sa BAWAT interior
// world (walang stock, hindi pickup-able) - ngayon, PAREHONG-PAREHO na
// ito sa Crafter/Stove/Light (craft.js/stove.js/light.js): isang
// COUNTABLE na item sa bag (bedsCollected), puwedeng i-"Hold" (hold.js,
// right-click sa hotbar/bag) para dalhin sa ULO ng player, may
// berde/pulang preview sa mouse habang naka-hold (placement.js), tapos
// i-CLICK ang isang tile SA LOOB NG BAHAY para ilagay bilang
// PERMANENTENG structure - 2x3 tiles ang footprint (PLACEMENT_FOOTPRINTS.bed,
// placement.js), MAY sarili nang collision box (getPlacedBedCollisionBoxes
// sa ibaba, kaparehong-pareho ng getPlacedCrafterCollisionBoxes).
//
// PAANO MAKUKUHA: bibilhin kay Oldman (OLDMAN_SHOP_ITEMS, decor.js) -
// hindi na ito "libre"/laging-naroroon sa bawat bahay tulad ng dati,
// kailangan na munang bilhin at ilagay mismo ng player.
//
// I-RIGHT-CLICK ang isang naka-lagay na Bed para "sirain" ito
// (breakPlacedBed) - kaparehong-pareho ng gawi ng breakPlacedCrafter/
// breakPlacedStove, agad itong nagiging ordinaryong FLOATING ground
// item (kailangan pang damputin bago mapunta ulit sa bag).
//
// I-CLICK (kailangan abot AT nakaharap - isPlayerFacingTile, tingnan
// ang dig.js) para matulog. GABI LANG (mula 6pm hanggang bago mag-6am)
// puwedeng matulog - kung araw pa, may lalabas na mensahe sa halip.

const BED_TILE_COLS = 2;
const BED_TILE_ROWS = 3;
const BED_WIDTH = BED_TILE_COLS * TILE_SIZE;
const BED_HEIGHT = BED_TILE_ROWS * TILE_SIZE;

const SLEEP_WAKE_HOUR = 6; // 6:00 AM

let bedsCollected = 0; // stock sa bag - kaparehong pattern ng craftersCollected/stovesCollected

let placedBeds = []; // { world, col, row, id }
let placedBedIdCounter = 0;

// Puwede lang matulog sa pagitan ng 6pm hanggang bago mag-6am (gabi) -
// tumutugma sa "isDaytime" ng calendar.js (06:00-17:59 = araw).
function isBedUsableNow() {
  return !getCalendarState().isDaytime;
}

// Tinatawag ng dig.js (mousedown, habang naka-highlight ang Bed sa
// isang hotbar slot - tingnan ang isItemHeld sa hold.js) papunta sa
// EKSAKTONG tinurong tile - dumaraan sa isFootprintPlaceable
// (placement.js): (a) LOOB LANG ng bahay, (b) LAHAT ng 2x3 tile ng
// footprint ay dapat LIBRE.
function placeBedInWorld(col, row) {
  if (bedsCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  if (
    typeof isFootprintPlaceable === "function" &&
    !isFootprintPlaceable("bed", tile.col, tile.row)
  ) {
    return;
  }

  placedBeds.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedBedIdCounter++,
  });

  bedsCollected--;

  // AYOS (kaparehong gawi ng crafter/stove/light): kung ITO ang
  // kasalukuyang naka-hold (ulo ng player), "mawawala" na rin ito dito -
  // naibigay/nailagay na kasi (tingnan ang hold.js).
  if (typeof clearHeldItemIfPlaced === "function") clearHeldItemIfPlaced("bed");

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Bed dito (sa kasalukuyang mundo)? 2x3 tiles ang
// footprint nito (placement.js) - kaya HINDI simpleng col/row equality
// lang, tinitingnan kung KASAMA ang (col,row) sa buong footprint ng
// bawat naka-lagay na Bed. Tingnan ang paggamit nito sa dig.js
// (mousedown/contextmenu listener) at sa placement.js
// (isPlacedStructureTileOccupied).
function getPlacedBedAt(col, row) {
  return (
    placedBeds.find((bed) => {
      if (bed.world !== currentWorld) return false;

      if (typeof getPlacementFootprintCells !== "function") {
        return bed.col === col && bed.row === row;
      }

      return getPlacementFootprintCells("bed", bed.col, bed.row).some(
        (cell) => cell.col === col && cell.row === row,
      );
    }) || null
  );
}

// I-RIGHT-CLICK ang isang naka-lagay na Bed sa mundo (tingnan ang
// contextmenu listener sa dig.js) para "sirain"/tanggalin ito -
// kaparehong-pareho ng gawi ng breakPlacedCrafter/breakPlacedStove:
// lumalabas muna bilang ORDINARYONG FLOATING ground item, kailangan pa
// itong damputin bago mapunta sa bag.
function breakPlacedBed(bed) {
  const index = placedBeds.indexOf(bed);

  if (index === -1) return;

  placedBeds.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(bed.col, bed.row, "bed", 1);
  }

  if (typeof spawnDigEffect === "function") {
    spawnDigEffect(bed.col, bed.row);
  }
}

// =========================
// COLLISION NG NAKA-LAGAY NA BED
// =========================
//
// Kaparehong-pareho ng pattern ng getPlacedCrafterCollisionBoxes
// (craft.js) / getPlacedStoveCollisionBoxes (stove.js) - "LIVE" na
// collision, tinatawag ng canMoveTo (collisions.js, player) AT ng
// canFeetMoveTo (decor.js, oldman/pig). 2x3 tiles ang footprint ng Bed
// (PLACEMENT_FOOTPRINTS.bed, placement.js) - sumasakop ang collision
// box sa BUONG bounding box nito.
function getPlacedBedCollisionBoxes() {
  if (placedBeds.length === 0) return [];

  return placedBeds
    .filter((bed) => bed.world === currentWorld)
    .map((bed) =>
      typeof getFootprintCollisionBox === "function"
        ? getFootprintCollisionBox("bed", bed.col, bed.row)
        : {
            x: bed.col * TILE_SIZE,
            y: bed.row * TILE_SIZE,
            width: BED_WIDTH,
            height: BED_HEIGHT,
          },
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

// Tinatawag ng dig.js (mousedown handler) kapag na-click ang isang
// naka-lagay na Bed AT abot/nakaharap ng player. "bed" - ang tinukoy na
// naka-lagay na Bed (getPlacedBedAt) - hindi pa ginagamit ang col/row
// nito sa logic (basta pareho lang ang oras ng gising kahit saang Bed),
// naiwan na lang ang parameter para kung sakaling kailanganin pa sa
// hinaharap (hal. per-bed na cooldown).
function trySleepInBed(bed) {
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
// PAGGUHIT (bed.png sprite) - PAREHONG icon ng bag/hotbar
// (assets/items/bed.png, BAG_ITEMS - hotbar.js), kaparehong-pareho ng
// pattern ng drawPlacedCrafters/drawPlacedStoves/drawPlacedLights.
// =========================
const BED_SPRITE_IMAGE = new Image();

BED_SPRITE_IMAGE.src = "./assets/items/bed.png";

// Iginuguhit sa PAREHONG layer/oras ng drawPlacedCrafters/drawPlacedStoves
// (draw.js) - world space, sa ilalim ng player. Naka-ANCHOR SA ILALIM
// (drawSpriteFillWidthInBox, placement.js), naka-sentro sa BUONG 2x3
// footprint (hindi lang sa unang tile).
function drawPlacedBeds() {
  if (placedBeds.length === 0) return;

  const here = placedBeds.filter((bed) => bed.world === currentWorld);

  if (here.length === 0) return;

  ctx.save();

  // Fallback (emoji) habang hindi pa fully-loaded ang sprite -
  // kaparehong gawi ng drawPlacedStoves/drawPlacedCrafters/drawPlacedLights.
  if (!BED_SPRITE_IMAGE.complete || BED_SPRITE_IMAGE.naturalWidth === 0) {
    ctx.font = TILE_SIZE * 0.9 + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const bed of here) {
      ctx.fillText(
        "🛏️",
        bed.col * TILE_SIZE + BED_WIDTH / 2,
        bed.row * TILE_SIZE + BED_HEIGHT / 2,
      );
    }

    ctx.restore();
    return;
  }

  for (const bed of here) {
    if (typeof drawSpriteFillWidthInBox === "function") {
      drawSpriteFillWidthInBox(
        BED_SPRITE_IMAGE,
        bed.col * TILE_SIZE,
        bed.row * TILE_SIZE,
        BED_WIDTH,
        BED_HEIGHT,
      );
    } else {
      ctx.drawImage(
        BED_SPRITE_IMAGE,
        bed.col * TILE_SIZE,
        bed.row * TILE_SIZE,
        BED_WIDTH,
        BED_HEIGHT,
      );
    }
  }

  ctx.restore();
}
