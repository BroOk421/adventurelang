// =========================
// "LIGHT" - ILAW NA NAKA-LAGAY SA LUPA (loob ng bahay lang)
// =========================
//
// Hiling ng user: "kapag sa light is 1 tile lang, tapos kapag naka off
// yung light is madilim yung paligid kapag gabi na - parang ganun pa
// rin sa logic ngayon (ang normal na araw/gabi tint, atmosphere.js) -
// pero ang madadagdag lang is yung light is ON/OFF: kapag OFF, madilim
// (walang dagdag na epekto - ganito na rin ang nangyayari ngayon);
// kapag ON, gawin normal ang kulay ng paligid nito (parang may
// nagliliwanag na ilaw sa loob ng silid)."
//
// Kaparehong-pareho ng pattern ng Crafter (craft.js) / Stove (stove.js):
// isang COUNTABLE na item sa bag (lightsCollected), i-highlight ang
// slot nito sa hotbar (isLightSlotSelected) tapos i-click ang isang
// tile SA LOOB NG BAHAY (dumaan sa isFootprintPlaceable, placement.js)
// para ilagay bilang PERMANENTENG bagay. 1 TILE lang ang footprint
// nito (PLACEMENT_FOOTPRINTS.light, placement.js) - hindi tulad ng
// Crafter/Stove (2 tile).
//
// AYOS (bagong hiling ng user): "palagyan din ng collision yung lamp,
// 1 tile sa mismong pinaglagayan niya" - MAY sarili na ring collision
// box ngayon ang isang naka-lagay na Light, kaparehong-pareho ng gawi
// ng Crafter/Stove (getPlacedCrafterCollisionBoxes/getPlacedStoveCollisionBoxes)
// - tingnan ang getPlacedLightCollisionBoxes sa ibaba. 1 TILE lang ang
// sakop nito (PLACEMENT_FOOTPRINTS.light), kaya mas maliit ang box
// kaysa sa 2-tile na Crafter/Stove, pero hindi na ito madadaanan/
// malalampasan.

let lightsCollected = 0; // stock sa bag - kaparehong pattern ng craftersCollected/stovesCollected

let placedLights = []; // { world, col, row, id, on }
let placedLightIdCounter = 0;

// Naka-highlight (naka-select) ba ngayon ang isang hotbar slot na may
// Light? Kaparehong-pareho ng isCrafterSlotSelected/isStoveSlotSelected.
function isLightSlotSelected() {
  return (
    typeof selectedInventorySlot !== "undefined" &&
    selectedInventorySlot !== null &&
    typeof pinnedSlots !== "undefined" &&
    pinnedSlots[selectedInventorySlot] === "light"
  );
}

// Tinatawag ng dig.js (mousedown, habang naka-highlight ang Light sa
// isang hotbar slot) papunta sa EKSAKTONG tinurong tile - dumaraan sa
// isFootprintPlaceable (placement.js): LOOB LANG ng bahay, at LIBRE
// ang tile (walang kalahating-tile na puwedeng malagyan).
function placeLightInWorld(col, row) {
  if (lightsCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  if (
    typeof isFootprintPlaceable === "function" &&
    !isFootprintPlaceable("light", tile.col, tile.row)
  ) {
    return;
  }

  placedLights.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedLightIdCounter++,
    // BAGONG naka-lagay na Light - naka-ON agad bilang default (parang
    // bagong sinindihan), i-off na lang manwal (i-click ito) kung
    // gusto.
    on: true,
  });

  lightsCollected--;

  // AYOS (hiling ng user): kung ITO ang kasalukuyang naka-hold (ulo ng
  // player), "mawawala" na rin ito dito - naibigay/nailagay na kasi
  // (tingnan ang hold.js).
  if (typeof clearHeldItemIfPlaced === "function") clearHeldItemIfPlaced("light");

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Light sa eksaktong cell na ito (sa kasalukuyang
// mundo)? 1 tile lang ang footprint nito kaya simpleng col/row
// equality. Tingnan ang paggamit nito sa dig.js (mousedown listener).
function getPlacedLightAt(col, row) {
  return (
    placedLights.find(
      (light) =>
        light.world === currentWorld && light.col === col && light.row === row,
    ) || null
  );
}

// I-CLICK (habang NAKAHARAP at ABOT, tingnan ang facingTile check sa
// dig.js) para i-TOGGLE ang isang naka-lagay na Light - ON kung OFF,
// OFF kung ON. Walang bukas na panel dito (hindi tulad ng Crafter/
// Stove), basta agad lumilipat ang estado.
function toggleLight(light) {
  if (!light) return;

  light.on = !light.on;

  if (typeof playPutSfx === "function") playPutSfx();
}

// I-RIGHT-CLICK para "sirain"/tanggalin ang isang naka-lagay na Light -
// kaparehong-pareho ng gawi ng breakPlacedCrafter/breakPlacedStove:
// lumalabas muna bilang ORDINARYONG FLOATING ground item, kailangan pa
// itong damputin bago mapunta sa bag.
function breakPlacedLight(light) {
  const index = placedLights.indexOf(light);

  if (index === -1) return;

  placedLights.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(light.col, light.row, "light", 1);
  }

  if (typeof spawnDigEffect === "function") {
    spawnDigEffect(light.col, light.row);
  }
}

// =========================
// COLLISION NG NAKA-LAGAY NA LIGHT/LAMP
// =========================
//
// Kaparehong-pareho ng pattern ng getPlacedCrafterCollisionBoxes
// (craft.js) / getPlacedStoveCollisionBoxes (stove.js) - "LIVE" na
// collision, tinatawag ng canMoveTo (collisions.js, player) AT ng
// canFeetMoveTo (decor.js, oldman/pig). 1 TILE lang ang footprint ng
// Light (PLACEMENT_FOOTPRINTS.light, placement.js), kaya isang tile
// lang din ang collision box nito kada naka-lagay na Light.
function getPlacedLightCollisionBoxes() {
  if (placedLights.length === 0) return [];

  return placedLights
    .filter((light) => light.world === currentWorld)
    .map((light) =>
      typeof getFootprintCollisionBox === "function"
        ? getFootprintCollisionBox("light", light.col, light.row)
        : {
            x: light.col * TILE_SIZE,
            y: light.row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          },
    );
}

// =========================
// SPRITE (assets/items/lamp.png) - BAGO (hiling ng user): "yung sa
// light.png yun gamitin mong light" - GINAMIT na ang MISMONG icon ng
// bag/hotbar (BAG_ITEMS, hotbar.js) sa halip na ang dating GENERATED
// na placeholder (assets/objects/light/light.png, 2-frame). Iisang
// larawan na lang ito (walang hiwalay na OFF/ON na frame) - ang
// pagkakaiba ng ON/OFF ay sa pamamagitan na lang ng ctx.filter
// (madilim/walang-kulay kapag OFF, normal kapag ON) - tingnan ang
// drawPlacedLights sa ibaba.
//
// PINALITAN NA ang pangalan ng file (hiling ng user): "light.png" ->
// "lamp.png" (parehong-pareho pa rin ang laman/larawan, pangalan lang
// ng file mismo ang nagbago - tingnan din ang hotbar.js, BAG_ITEMS.light
// icon).
// =========================
const LIGHT_SPRITE_IMAGE = new Image();

LIGHT_SPRITE_IMAGE.src = "./assets/items/lamp.png";

// Iginuguhit sa PAREHONG layer/oras ng drawPlacedCrafters/drawPlacedStoves
// (draw.js) - world space, sa ilalim ng player. BAGO: "mali yung tile
// dapat exact 16x16" - iginuguhit EKSAKTO sa loob ng 1-tile na
// footprint box (TILE_SIZE x TILE_SIZE), hindi base sa aspect ratio ng
// larawan.
function drawPlacedLights() {
  if (placedLights.length === 0) return;

  const here = placedLights.filter((light) => light.world === currentWorld);

  if (here.length === 0) return;

  ctx.save();

  // Fallback (emoji) habang hindi pa fully-loaded ang sprite - kaparehong
  // gawi ng drawPlacedStoves/drawPlacedCrafters.
  if (!LIGHT_SPRITE_IMAGE.complete || LIGHT_SPRITE_IMAGE.naturalWidth === 0) {
    ctx.font = TILE_SIZE * 0.8 + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const light of here) {
      ctx.globalAlpha = light.on ? 1 : 0.55;
      ctx.fillText(
        "💡",
        light.col * TILE_SIZE + TILE_SIZE / 2,
        light.row * TILE_SIZE + TILE_SIZE / 2,
      );
    }

    ctx.restore();
    return;
  }

  for (const light of here) {
    ctx.save();

    // TINANGGAL (hiling ng user): yung maliit na "glow"/halo na
    // lumalabas sa paligid ng bumbilya mismo kapag ON. Ang TANGING
    // pagkakaiba ngayon ng ON/OFF sprite ay ang filter sa ibaba
    // (normal na kulay kapag ON, madilim/grayscale kapag OFF) - walang
    // dagdag na additive glow sa paligid nito.

    // OFF - MAS MALINAW na madilim/walang-kulay ngayon (kaparehong "off
    // naman normal na kapag night" na hiling - walang dagdag na
    // epekto, mukhang simpleng sinindihang lampara lang na patay). ON
    // - normal na kulay (walang filter).
    ctx.filter = light.on ? "none" : "grayscale(90%) brightness(0.4)";
    ctx.globalAlpha = light.on ? 1 : 0.85;

    if (typeof drawSpriteFillWidthInBox === "function") {
      drawSpriteFillWidthInBox(
        LIGHT_SPRITE_IMAGE,
        light.col * TILE_SIZE,
        light.row * TILE_SIZE,
        TILE_SIZE, // EKSAKTONG 1 tile (16x16) - hindi lalabas sa grid
        TILE_SIZE,
      );
    } else {
      ctx.drawImage(
        LIGHT_SPRITE_IMAGE,
        light.col * TILE_SIZE,
        light.row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }

    ctx.restore();
  }

  ctx.restore();
}

// =========================
// LIWANAG NG BUONG SILID (kapag may KAHIT ISANG naka-lagay na Light na
// ON sa kasalukuyang mundo)
// =========================
//
// BAGO (hiling ng user, base sa reference screenshot niya): "yung
// ganyang kulay ng room dapat ganyan itsura kapag na open yung ilaw,
// tapos off naman normal na kapag night" - hindi na lang maliit na
// bilog sa paligid ng lamp mismo (parang torch/stove) - BUONG
// SCREEN/SILID na ang epekto (mainit/warm na kulay, kaparehong-kahawig
// ng reference), dahil maliit lang naman ang bawat silid/bahay sa
// laro. Kaparehong-estilo pa rin ng drawTorchLight/drawStoveLight
// (atmosphere.js): "lighter"/additive blend, SCREEN SPACE, sa IBABAW
// ng araw/gabi na tint (drawDayNight) - kumakalaban ito sa dilim. Kapag
// WALANG naka-ON na Light, WALANG dagdag na epekto - nananatili ang
// normal na araw/gabi na dilim mula sa atmosphere.js, PAREHONG-PAREHO
// sa dating logic (ito ang "off naman normal na kapag night" na
// hiling).
const LIGHT_ROOM_TINT_COLOR = "255, 214, 150"; // mainit/"warm" na kulay, kahoy/ilaw-parol

// Ginagamit ito ng drawPlacedLightGlow sa ibaba, PERO GAMIT DIN ito ng
// drawDayNight (atmosphere.js) - "May kahit isang naka-ON na Light ba
// sa KASALUKUYANG silid?" Ibinukod bilang sariling function (hindi na
// paulit-ulit na isinusulat ang parehong .some(...) check) dahil
// KAILANGAN din ito ng ibang file - tingnan ang paliwanag sa
// atmosphere.js kung bakit.
//
// BAGO: ginawang tumatanggap ng SARILING world name (hindi na basta
// currentWorld lang) - kailangan nito na masuri ang estado ng Light NG
// LOOB ng isang partikular na bahay (hal. "manuelHouse") HABANG NASA
// LABAS ka pa (currentWorld === "town") - tingnan ang paggamit nito sa
// drawHouseWindowLights (atmosphere.js, bintana ng mga bahay sa town) -
// kaya hindi na sapat ang dating currentWorld-only na bersyon.
function hasLitPlacedLightInWorld(worldName) {
  return placedLights.some(
    (light) => light.world === worldName && light.on,
  );
}

function hasLitPlacedLightInCurrentWorld() {
  return hasLitPlacedLightInWorld(currentWorld);
}

function drawPlacedLightGlow() {
  if (placedLights.length === 0) return;

  const hasLightOn = hasLitPlacedLightInCurrentWorld();

  if (!hasLightOn) return;

  const nightAmount =
    typeof getNightAmount === "function" ? getNightAmount() : 0;

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  ctx.fillStyle = `rgba(${LIGHT_ROOM_TINT_COLOR}, ${0.65 * nightAmount})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}
