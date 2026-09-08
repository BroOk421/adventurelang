// =========================
// PAGLALAGAY NG "STRUCTURE" SA LUPA (Crafter/Stove/Light)
// =========================
//
// SHARED na file ito (hiling ng user) para sa mga bagay na inilalagay
// bilang PERMANENTENG structure sa lupa - Crafter (craft.js), Stove
// (stove.js), Light (light.js), at Bed (bed.js). Bago ito, magkakahiwalay/
// walang paghihigpit ang bawat isa (kahit saan puwedeng ilagay, 1 tile
// lang, walang preview sa mouse). Ngayon:
//
//   1. LOOB LANG NG BAHAY puwedeng maglagay (isInsideHouseWorld) -
//      "sa mismong loob ng bahay" (hiling ng user).
//   2. May "footprint" na bawat item (PLACEMENT_FOOTPRINTS) - 2 tile
//      (magkatabi, pahalang) ang Crafter at Stove, 1 tile lang ang
//      Light, 2x3 tile (bagong hiling ng user) ang Bed.
//   3. Habang naka-highlight/armed ang slot (Crafter/Stove/Light) sa
//      hotbar, may lumalabas na 16x16 (kada tile) na outline sa
//      ibabaw ng tinuturo ng mouse (drawPlacementPreview, tinatawag
//      ng draw.js) - LUNTIAN kapag puwede, PULA kapag hindi (kalahati
//      lang ang bakante, may nakalagay na, o wala sa loob ng bahay).
//   4. LAHAT ng tile ng footprint ay dapat LIBRE (walang collision/
//      bagay/pintuan/ibang structure) - hindi puwedeng "kalahati lang"
//      ang bakante (isFootprintPlaceable).

// Ilang TILE (pahalang, kanan) ang sinasakop ng bawat uri ng
// structure - dagdagan/baguhin dito kung magbabago pa ang laki sa
// hinaharap, awtomatiko namang susunod dito ang collision/preview/
// drawing ng bawat isa.
const PLACEMENT_FOOTPRINTS = {
  crafter: { width: 2, height: 1 },
  stove: { width: 2, height: 1 },
  light: { width: 1, height: 1 },
  // BAGO (hiling ng user): "bed" - 2x3 tiles (2 pahalang, 3 pababa) -
  // tingnan ang bed.js.
  bed: { width: 2, height: 3 },
};

function getPlacementFootprintCells(itemId, col, row) {
  const footprint = PLACEMENT_FOOTPRINTS[itemId] || { width: 1, height: 1 };
  const cells = [];

  for (let dx = 0; dx < footprint.width; dx++) {
    for (let dy = 0; dy < footprint.height; dy++) {
      cells.push({ col: col + dx, row: row + dy });
    }
  }

  return cells;
}

// Nasa LOOB ba tayo ngayon ng isang bahay? Ginagamit ang "outdoor"
// flag mismo ng WORLDS (worlds.js) - "false" ito sa LAHAT ng interior
// (grassmapHouse + 6 bahay sa town), kaya generic ito, gumagana kahit
// anong bahay pa ang idagdag sa hinaharap, hindi kailangang i-update
// pa ito.
function isInsideHouseWorld() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  return !!world && world.outdoor === false;
}

// Aggregator - may ibang NAKA-LAGAY NANG structure ba (Crafter/Stove/
// Light/Bag) sa cell na ito? `typeof` guard kada isa dahil hindi pa
// sigurado ang load order/pagkakaroon ng bawat isa (light.js, hal., ay
// opsyonal - baka gumagana pa rin ang laro kahit wala pa ito).
function isPlacedStructureTileOccupied(col, row) {
  if (typeof getPlacedCrafterAt === "function" && getPlacedCrafterAt(col, row))
    return true;

  if (typeof getPlacedStoveAt === "function" && getPlacedStoveAt(col, row))
    return true;

  if (typeof getPlacedLightAt === "function" && getPlacedLightAt(col, row))
    return true;

  if (typeof getPlacedBagAt === "function" && getPlacedBagAt(col, row))
    return true;

  if (typeof getPlacedBedAt === "function" && getPlacedBedAt(col, row))
    return true;

  return false;
}

// Isang tile lang (bahagi ng isang footprint) - libre ba ito? false
// kapag: labas sa mapa, may collision box (pader/hadlang) dito, may
// bagay sa isang "overlap" layer (kaparehong ginagamit ng getObjectCells,
// dig.js), pintuan ito, o may ibang naka-lagay nang structure na.
function isPlacementTileFree(col, row) {
  if (!mapReady || !mapData || worldLoading) return false;

  if (col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) {
    return false;
  }

  const tileBox = {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  };

  if (collisions.some((box) => isColliding(tileBox, box))) return false;

  const objectCells =
    typeof getObjectCells === "function" ? getObjectCells() : null;

  if (objectCells && objectCells.has(col + "," + row)) return false;

  if (typeof DOORS !== "undefined") {
    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        return false;
      }
    }
  }

  // AYOS (hiling ng user): "may bug na di na makagalaw yung character
  // baka napasok sa collision" - LALO NA sa MALALAKING footprint (2x3,
  // Bed): ang getPlacementFootprintCells (itaas) ay LAGING lumalago
  // PAKANAN/PABABA mula sa tinuturong (anchor) tile, KAHIT ANONG
  // direksyon ang HINAHARAP ng player - kaya posibleng umabot PABALIK
  // ang footprint sa MISMONG kinatatayuan niya (hal. nakaharap sa
  // "itaas"/up, malayo ang anchor sa itaas niya, pero ang 3-row na
  // taas ng Bed ay puwedeng bumaba pabalik hanggang sa sarili niyang
  // tile) - kapag nangyari iyon, may bagong SOLID na collision box na
  // biglang lumitaw sa MISMONG kinatatayuan ng player, kaya "nakukulong"
  // siya (walang direksyon na hindi na-o-overlap ng malaking box na
  // iyon). Bawal na ngayon ang KAHIT ANONG tile ng footprint na
  // kasalukuyang naka-overlap sa TALAGANG collision box ng player mismo.
  if (typeof getPlayerCollisionBox === "function") {
    const playerBox = getPlayerCollisionBox();

    if (isColliding(tileBox, playerBox)) return false;
  }

  if (isPlacedStructureTileOccupied(col, row)) return false;

  return true;
}

// Puwede bang ilagay dito ang BUONG footprint ng itemId na ito - LAHAT
// (hindi kalahati lang) ng tile na sasakupin nito ay dapat LIBRE, AT
// nasa LOOB ng bahay ang buong player mismo (hiling ng user).
function isFootprintPlaceable(itemId, col, row) {
  if (!isInsideHouseWorld()) return false;

  const cells = getPlacementFootprintCells(itemId, col, row);

  return cells.every((cell) => isPlacementTileFree(cell.col, cell.row));
}

// Alin (kung meron man) na item ang kasalukuyang "armed" (pwede nang
// ilagay/i-drop) - ginagamit ito ng preview sa ibaba AT ng dig.js
// (mousedown) para malaman kung anong PLACEMENT_FOOTPRINTS ang
// gagamitin.
//
// AYOS (ikatlong round, hiling ng user): "kapag nasa hotbar key na
// siya tapos na highlight hindi lalabas yung tiles para ma drop dapat
// need muna i hold bago ma drop" - TINANGGAL na ang dating
// isCrafterSlotSelected/isStoveSlotSelected/isLightSlotSelected na
// check dito (basta na-highlight/selected sa hotbar, "armed" na dati) -
// ngayon, KAILANGAN muna TALAGANG "Hold" (hold.js, right-click ->
// "Hold") bago lumabas ang preview/pwedeng mag-drop - ang basta
// pag-highlight/select lang sa hotbar slot ay WALA nang epekto sa
// placement.
function getArmedPlacementItemId() {
  if (typeof isItemHeld === "function") {
    if (isItemHeld("crafter")) return "crafter";
    if (isItemHeld("stove")) return "stove";
    if (isItemHeld("light")) return "light";
    if (isItemHeld("bed")) return "bed";
  }

  return null;
}

// =========================
// "PLACEMENT RANGE" - HIWALAY sa generic na isTileInReach (dig.js)
// =========================
//
// BAGONG HILING NG USER: "gusto ko [ang paglalagay ng bed/stove/crafter/
// lamp] nakaharap yung character pero may pagitan... o mas ok kung 1-2
// tile pwede niya malagyan, di lang sa harap niya mismo pero dapat
// nakaharap parin siya" - dating ang batayan ay basta ang generic
// isTileInReach (dig.js): KAHIT ANONG DIREKSYON, 1 tile lang ang layo
// (3x3 paligid ng player), WALANG facing requirement. Ngayon, SPESIPIKO
// na ito sa PAGLALAGAY LANG ng Crafter/Stove/Light/Bed (hindi ito
// ginagamit ng rake/pag-ani/awtomatikong-kamay - MANATILING isTileInReach
// pa rin ang gamit doon, hindi dapat maapektuhan ang mga iyon):
//
//   1. DAPAT NAKAHARAP ang player papunta sa tile (isPlayerFacingTile,
//      dig.js - parehong 45-degree cone na ginagamit na sa pagbukas ng
//      Crafter/Stove/Bed panel).
//   2. 1 O 2 TILE (Chebyshev distance) ang layo nito mula sa player -
//      hindi puwede sa MISMONG kinatatayuan niya (0), pero puwede na
//      ngayong 2 tile pasulong (dating 1 tile/kahit anong direksyon
//      lang).
function isTileInPlacementRange(col, row) {
  if (typeof isPlayerFacingTile === "function" && !isPlayerFacingTile(col, row)) {
    return false;
  }

  const box =
    typeof getPlayerCollisionBox === "function" ? getPlayerCollisionBox() : null;

  if (!box) return false;

  const playerCol = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  const playerRow = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  const distance = Math.max(
    Math.abs(col - playerCol),
    Math.abs(row - playerRow),
  );

  return distance >= 1 && distance <= 2;
}

// =========================
// PREVIEW (16x16 na outline sa ibabaw ng tinuturo ng mouse)
// =========================
//
// Tinatawag ito ng draw.js, SA LOOB ng camera transform (world space,
// kaparehong-pareho ng drawDigCursor sa dig.js) - kaya't dito rin
// hinahati sa camera.zoom ang lineWidth (para 1 TUNAY na device pixel
// lang, kahit anong zoom).
function drawPlacementPreview() {
  const itemId = getArmedPlacementItemId();

  if (!itemId) return;

  // AYOS (BUG FIX, hiling ng user: "once naka-hold na... may lilitaw
  // na tiles sa paligid niya, may lilitaw na green... pero kapag red
  // di pwede") - dating basta getMouseTile() lang (batay sa TALAGANG
  // posisyon ng MOUSE cursor) - PERO walang TUNAY na "mouse" sa
  // touchscreen (walang hover state) - ang tanging paraan na
  // na-uupdate ang mouseScreenX/mouseOnCanvas (dig.js) ay sa
  // "mousemove"/"mouseleave" na EVENT, na HINDI kailanman umaandar sa
  // totoong pag-tap ng daliri - kaya laging WALANG lumalabas na
  // preview sa mobile (mouseOnCanvas laging false), kahit gumagana
  // na PALA ang mismong PAGLALAGAY (placeCrafterInWorld, atbp.) sa
  // pag-pindot ng action button (useEquippedToolAtFacingTile,
  // mobile-controls.js - "sinisimulate" nito ang mismong click sa
  // FACING TILE, hindi umaasa sa preview na ito). Ngayon, sa TOUCH
  // devices (touch-controls-active), ang FACING TILE (getPlayerFacingTile,
  // ground-items.js - PAREHONG tile na TALAGANG gagamitin ng action
  // button) ang ginagamit sa halip na mouse cursor - kaya makikita na
  // rin agad kung green (pwede) o red (hindi) ang susunod na tatamaan
  // ng action button, bago pa man ito pindutin.
  const isTouch =
    typeof document !== "undefined" &&
    document.body &&
    document.body.classList.contains("touch-controls-active");

  const tile = isTouch
    ? typeof getPlayerFacingTile === "function"
      ? getPlayerFacingTile()
      : null
    : typeof getMouseTile === "function"
      ? getMouseTile()
      : null;

  if (!tile) return;

  // BAGO (hiling ng user): "isTileInPlacementRange" na ngayon ang
  // batayan (facing + 1-2 tile) - hindi na ang basta 1-tile/kahit
  // anong direksyon na isTileInReach (tingnan ang paliwanag sa itaas).
  const inReach =
    typeof isTileInPlacementRange !== "function" ||
    isTileInPlacementRange(tile.col, tile.row);

  const placeable = inReach && isFootprintPlaceable(itemId, tile.col, tile.row);

  const cells = getPlacementFootprintCells(itemId, tile.col, tile.row);

  ctx.save();

  const lineWidth = 1 / camera.zoom;

  ctx.lineWidth = lineWidth;
  ctx.fillStyle = placeable
    ? "rgba(120, 230, 140, 0.28)"
    : "rgba(255, 80, 80, 0.28)";
  ctx.strokeStyle = placeable
    ? "rgba(140, 255, 160, 0.95)"
    : "rgba(255, 100, 100, 0.85)";

  for (const cell of cells) {
    ctx.fillRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(
      cell.col * TILE_SIZE + lineWidth / 2,
      cell.row * TILE_SIZE + lineWidth / 2,
      TILE_SIZE - lineWidth,
      TILE_SIZE - lineWidth,
    );
  }

  ctx.restore();
}

// =========================
// COLLISION BOX NG BUONG FOOTPRINT (2 tile) - ginagamit ng craft.js/
// stove.js (getPlacedCrafterCollisionBoxes/getPlacedStoveCollisionBoxes)
// sa halip na paulit-ulit na kwentahin ang bounding box mismo.
// =========================
function getFootprintCollisionBox(itemId, col, row, insetRatio = 0.08) {
  const cells = getPlacementFootprintCells(itemId, col, row);

  const minCol = Math.min(...cells.map((cell) => cell.col));
  const minRow = Math.min(...cells.map((cell) => cell.row));
  const maxCol = Math.max(...cells.map((cell) => cell.col));
  const maxRow = Math.max(...cells.map((cell) => cell.row));

  const fullWidth = (maxCol - minCol + 1) * TILE_SIZE;
  const fullHeight = (maxRow - minRow + 1) * TILE_SIZE;
  const inset = TILE_SIZE * insetRatio;

  return {
    x: minCol * TILE_SIZE + inset,
    y: minRow * TILE_SIZE + inset,
    width: fullWidth - inset * 2,
    height: fullHeight - inset * 2,
  };
}

// =========================
// PAGGUHIT NG SPRITE - "FILL WIDTH", EKSAKTONG SAKOP ANG BUONG LAPAD NG
// FOOTPRINT (hal. 2 tile = 32px), naka-anchor sa ILALIM
// =========================
//
// BAGO (hiling ng user, ikalawang round): "gawin yung size ng
// pinasa kong image na crafter at stove at light dapat ganun kalaki -
// sakop yung 2 tiles" - dating "contain" fit (drawSpriteContainedInBox)
// ang ginamit, PERO dahil halos PARISUKAT ang crafter/stove.png
// (33x32) habang PAHABA/MALAWAK ang box nila (32x16, 2 tile x 1 tile),
// ang HEIGHT (hindi WIDTH) ang naging LIMITING FACTOR ng "contain" -
// kaya LUMIIT/hindi na sinasakop ng larawan ang BUONG 2-TILE na LAPAD
// (mali rin ito, kabaligtaran ngayon ng dating "sobrang laki/lumalabas"
// na problema).
//
// Dito, ang LAPAD (width) ang IPINIPILIT na EKSAKTO/kasing-lapad ng
// buong box (`boxWidth`, hal. 32px para sa 2-tile) - ang taas naman ay
// awtomatikong sumusunod sa TALAGANG aspect ratio ng larawan (kaya
// hindi ito NASTRETCH/NADISTORT), kahit LUMAGPAS ito sa taas ng box
// (karaniwan na sa top-down na laro - mas mataas ang guhit ng bagay
// kaysa sa "footprint" nito sa sahig, gaya ng nakikita sa reference
// image ng user - ang stove/fridge doon ay mas matangkad kaysa sa
// isang tile). Naka-ANCHOR SA ILALIM (parang nakatayo sa sahig) - kaya
// ang ILALIM lang ang GARANTISADONG eksakto sa 16x16 grid, puwede
// itong "umangat" paitaas papasok sa tile sa likod nito - katanggap-
// tanggap ito dahil maliit lang ang mga silid at walang Y-sort na mga
// bagay na dadaan doon.
function drawSpriteFillWidthInBox(image, boxX, boxY, boxWidth, boxHeight) {
  const scale = boxWidth / image.naturalWidth;

  const drawWidth = boxWidth;
  const drawHeight = image.naturalHeight * scale;

  const drawX = boxX;
  const drawY = boxY + boxHeight - drawHeight; // naka-anchor sa ILALIM

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}
