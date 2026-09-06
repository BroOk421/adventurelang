// =========================
// "HOLD" / "THROW" - hiling ng user
// =========================
//
// "yung pag lagay ng mga item nadroppable sa ground like crafter at
// stove gusto ko sana na add yung feature na kapag nilagay ko sa
// hotkey slots is kapag nag rightclick ako is may lalabas na hold at
// throw tapos kapag hold is mapupunta sa ulo ng character nakahold na
// binubuhat niya kahit anung galaw ko sumusunod tapos kapag ayoko na i
// unhold mawawala sa ulo ng character."
//
// Sa halip na (o dagdag sa) dating "cut 1 into float"/"place on tile"
// na gawi ng mga droppable/pinnable na item (Crafter/Stove/Light -
// tingnan ang craft.js/stove.js/light.js), ngayon kapag NI-RIGHT-CLICK
// ang alinman sa mga ito (sa hotbar O sa bag panel - tingnan ang
// paggamit ng HOLDABLE_ITEM_IDS sa hotbar.js), may lalabas na maliit
// na popup menu (parehong showBagActionMenu na ginagamit na ng "bag"
// item, hotbar.js) na may dalawa/tatlong pagpipilian:
//
//   - "Hold"   - "binubuhat"/dinadala ito sa ULO ng player (lumalabas
//                na maliit na icon, kasing-laki lang ng nasa
//                bag/hotbar - hindi pa ang "totoong" placed na laki) -
//                sumusunod ito SAAN MAN pumunta ang player. HABANG
//                naka-hold, PARTE na rin ito ng normal na "armed for
//                placement" na sistema (placement.js/dig.js) - kaya
//                lumalabas ang berde/pulang tile preview sa mouse, at
//                puwede nang i-click ang isang tile para TALAGANG
//                ilagay (doon pa lang TALAGANG binabawas sa stock,
//                kaparehong-pareho ng normal na "i-select sa hotbar,
//                i-click ilagay" na gawi - walang double-deduction).
//   - "Unhold" - (kapalit ng "Hold" kapag ITO na mismo ang kasalukuyang
//                hawak) - basta nawawala na lang ito sa ulo (walang
//                binabago sa stock - hindi naman ito binawasan noong
//                "Hold").
//   - "Throw"  - ibinabawas ang stock ng 1, tapos LUMILIPAD ito
//                papuntang isang tile SA HARAP ng player (mas malayo
//                kaysa sa normal na "place", parang totoong itinapon)
//                bilang ORDINARYONG FLOATING ground item
//                (spawnGroundItem, ground-items.js) - kailangan pang
//                lapitan/damputin ulit.
//
// Isa lang ang puwedeng hawak nang sabay - kung may hawak ka na, at
// "Hold" ka ng ibang item, awtomatikong "Unhold" muna ang dati.

// BAGO (hiling ng user): kasama na ngayon ang "bed" - kaparehong-pareho
// na rin ito ngayon sa Crafter/Stove/Light (nahohold, may 2x3 na
// footprint/preview, may collision) - tingnan ang bed.js.
const HOLDABLE_ITEM_IDS = ["crafter", "stove", "light", "bed"];

let heldItemId = null;

function isItemHeld(itemId) {
  return heldItemId === itemId;
}

// =========================
// HOLD
// =========================
//
// AYOS (ikalawang round, hiling ng user): "kapag naka hold dun lalabas
// yung tiles na pwede ilapag" - ibig sabihin, ang "Hold" ay dapat
// PARTE na ng PAREHONG "armed for placement" na sistema ng
// Crafter/Stove/Light (placement.js/dig.js - ang normal na "i-select
// sa hotbar, may lumalabas na berde/pulang outline sa tile, i-click
// para ilagay") - HINDI ito hiwalay/bagong sistema. Kaya HINDI na
// dito binabawasan ang stock (adjustGlobalItemCount/
// consumeItemFromWherever) - ang PAGBAWAS ay nangyayari pa rin sa
// TALAGANG sandali ng paglalagay (placeCrafterInWorld/
// placeStoveInWorld/placeLightInWorld, kaparehong-pareho ng normal na
// gawi), HINDI sa sandali ng "Hold". Ang idinagdag lang dito ay ang
// (a) VISUAL - ipinapakita ang icon sa ULO ng player habang naka-hold
// (drawHeldItemOnPlayer sa ibaba), at (b) ARMED-CHECK - kinikilala ng
// getArmedPlacementItemId() (placement.js) at ng crafterArmed/
// stoveArmed/lightArmed (dig.js) ang isItemHeld() bilang KATUMBAS ng
// pagka-"selected" sa hotbar - kaya lumalabas ang parehong
// green/red na preview outline sa mouse, at gumagana ang left-click
// para ilagay, KAHIT hindi na "selected" sa hotbar ang slot (hal.
// naubos na ang bilang doon dahil naka-hold na palabas).
function holdItem(itemId) {
  if (!HOLDABLE_ITEM_IDS.includes(itemId)) return;
  if (heldItemId === itemId) return; // hawak na ito

  // Isa lang ang puwedeng hawak nang sabay - ibaba muna ang dating
  // hawak (kung meron) bago hawakan ang bago.
  if (heldItemId) unholdItem();

  heldItemId = itemId;

  if (typeof playPutSfx === "function") playPutSfx();
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// UNHOLD - nawawala lang sa ulo (WALANG binabago sa stock - hindi
// naman ito binawasan noong "Hold", tingnan ang paliwanag sa itaas).
// =========================
function unholdItem() {
  if (!heldItemId) return;

  heldItemId = null;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatawag ng craft.js/stove.js/light.js PAGKATAPOS talagang
// mailagay (matagumpay na naibawas sa stock at naidagdag sa
// placedCrafters/placedStoves/placedLights) - kung ITO ang
// kasalukuyang hawak, "mawawala" na rin ito sa ulo (naibigay/nailagay
// na kasi).
function clearHeldItemIfPlaced(itemId) {
  if (heldItemId === itemId) heldItemId = null;
}

// =========================
// THROW - lumilipad papuntang 2 tile SA HARAP ng player (mas malayo
// kaysa sa normal na "place"/1-tile lang, para talagang pakiramdam na
// "itinapon" ito) bilang floating ground item. LAGING bumabawas ng 1
// sa stock (kahit hawak/hindi hawak ang item na ito) - kung ITO ang
// kasalukuyang hawak, "mawawala" na rin ito sa ulo.
// =========================
function getThrowTargetTile() {
  const box =
    typeof getPlayerCollisionBox === "function" ? getPlayerCollisionBox() : null;

  if (!box) return null;

  let col = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  let row = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  const THROW_DISTANCE_TILES = 2;

  if (player.direction === "up") row -= THROW_DISTANCE_TILES;
  else if (player.direction === "down") row += THROW_DISTANCE_TILES;
  else if (player.direction === "left") col -= THROW_DISTANCE_TILES;
  else if (player.direction === "right") col += THROW_DISTANCE_TILES;

  return { col, row };
}

function throwItem(itemId) {
  if (!HOLDABLE_ITEM_IDS.includes(itemId)) return;

  if (typeof adjustGlobalItemCount === "function")
    adjustGlobalItemCount(itemId, -1);
  if (typeof consumeItemFromWherever === "function")
    consumeItemFromWherever(itemId, 1);

  if (heldItemId === itemId) heldItemId = null;

  const tile = getThrowTargetTile();

  if (tile && typeof spawnGroundItem === "function") {
    spawnGroundItem(tile.col, tile.row, itemId, 1);
  }

  if (typeof playPutSfx === "function") playPutSfx();
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// PAGGUHIT - lumulutang sa ITAAS ng ulo ng player, sumusunod SAAN MAN
// (world space, kada frame) - tingnan ang paggamit nito sa player.js
// (drawPlayer), pagkatapos iguhit ang mismong sprite ng character.
// =========================
//
// AYOS (ikatlong round, hiling ng user): "wag mo na lagyan ng animate
// yung nakahold medyo ibaba mo pa yung item sa bandang ulo niya" -
// TINANGGAL na ang "bob" animation (HELD_ITEM_BOB_AMPLITUDE, static na
// posisyon na lang ngayon), at "ibinaba" pa ang icon papalapit sa ulo
// (mas MALIIT/NEGATIVE na ang gap - tumataas ang bottomY, ibig sabihin
// mas malapit/bahagyang naka-overlap na ito sa ulo mismo, sa halip na
// lumulutang nang malayo sa itaas nito).
const HELD_ITEM_DRAW_SIZE = TILE_SIZE; // world pixels - kasing-laki ng 1 tile/icon
const HELD_ITEM_HEAD_GAP = -16; // world pixels - negative = bahagyang pababa/mas malapit sa ulo

const heldItemImageCache = {};

function getHeldItemImage(itemId) {
  if (heldItemImageCache[itemId]) return heldItemImageCache[itemId];

  const item =
    typeof BAG_ITEMS !== "undefined"
      ? BAG_ITEMS.find((entry) => entry.id === itemId)
      : null;

  if (!item || !item.icon) return null;

  const image = new Image();
  image.src = item.icon;

  heldItemImageCache[itemId] = image;

  return image;
}

// AYOS (bagong hiling ng user): "medyo malaki pa rin yung lamp kapag na
// hold, mahaba siya, dapat medyo maliit lang" - ang dating paraan
// (i-scale ang buong LAPAD papunta sa HELD_ITEM_DRAW_SIZE, tapos
// sumunod na lang ang taas sa aspect ratio) ay maganda para sa mga
// halos-parisukat na icon (crafter/stove), PERO ang lamp.png ay
// makitid/mataas (16x40) - kaya kapag pinilit na i-fit ang LAPAD sa
// TILE_SIZE, LUMALAKI/HUMAHABA nang sobra ang TAAS nito (40px, mas
// mataas pa sa crafter/stove). Ngayon, "CONTAIN" fit na ang ginagamit
// (kaparehong konsepto ng drawSpriteContainedInBox, pero dito na lang
// isinulat nang diretso) - LAHAT (lapad AT taas) ay dapat kasya sa loob
// ng HELD_ITEM_DRAW_SIZE x HELD_ITEM_DRAW_SIZE na kahon, kaya kahit
// anong hugis (mataas/makitid man o parisukat) ng icon, palaging
// pareho/makatwiran ang laki nito habang naka-hold.
function getHeldItemDrawSize(image) {
  const scale = Math.min(
    HELD_ITEM_DRAW_SIZE / image.naturalWidth,
    HELD_ITEM_DRAW_SIZE / image.naturalHeight,
  );

  return {
    width: image.naturalWidth * scale,
    height: image.naturalHeight * scale,
  };
}

function drawHeldItemOnPlayer() {
  if (!heldItemId) return;

  const image = getHeldItemImage(heldItemId);

  if (!image || !image.complete || image.naturalWidth === 0) return;

  const centerX = player.x + player.width / 2;
  // Ilalim ng icon: mas malapit na ngayon sa ulo (walang animate,
  // static na posisyon - tingnan ang paliwanag sa itaas ng
  // HELD_ITEM_HEAD_GAP).
  const bottomY = player.y - HELD_ITEM_HEAD_GAP;

  const { width: drawWidth, height: drawHeight } = getHeldItemDrawSize(image);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    centerX - drawWidth / 2,
    bottomY - drawHeight,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}
