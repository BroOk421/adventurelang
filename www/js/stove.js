// =========================
// STOVE (cooking/smelting station)
// =========================
//
// Kaparehong-pareho ng gawi ng "Crafter" (craft.js) - i-craft (SHAPED
// recipe, 8 stone paikot sa gitna ng 3x3 grid - tingnan ang
// CRAFT_SHAPED_RECIPES sa craft.js), i-drag papuntang mundo para
// ilagay bilang PERMANENTENG bagay (o basta i-drop na lang bilang
// karaniwang floating ground item, kagaya ng crafter - tingnan ang
// placeStoveInWorld/isStoveSlotSelected), i-click ito sa mundo para
// buksan ang sarili nitong FLOATING na panel (tulad ng #bag-panel - may
// draggable header, "✕" close).
//
// Ang panel: [OUTPUT] <- [INGREDIENT] <- [FUEL] na 3 smelt slot sa
// itaas, tapos buong "copy" ng inventory grid sa ibaba - PAREHONG DATA
// mismo ng bag (hindi hiwalay na storage), tingnan ang renderBagGridInto
// sa hotbar.js. KAHIT ILANG PIRASO na ngayon ang puwedeng ilagay kada
// smelt cell (STACK, hindi na 1 lang) - tingnan ang placeSmeltItem sa
// ibaba. May DURATION na ang pagluluto - SMELT_COOK_DURATION_MS (10
// segundo) kada 1 piraso, awtomatikong tumutuloy (isa-isa) hangga't may
// natitira pang PAREHONG ingredient AT fuel - tingnan ang
// updateStoveCooking, tinatawag kada frame mula sa update.js.
let cookedmeat = 0;
let charcoalCollected = 0;
let stovesCollected = 0;

let stovePanelOpen = false;

// null = walang laman. May laman = { itemId, count } - STACK na ngayon
// (dating 1 piraso lang).
let smeltIngredient = null;
let smeltFuel = null;

// { itemId, count } o null kung wala pang naigawang resulta. Dito
// nagpupunta/naiipon ang bawat piraso na natapos i-luto (tingnan ang
// updateStoveCooking) - patuloy itong tumataas habang hindi pa
// nadadampot/na-drag palabas (tingnan ang collectSmeltOutput).
let smeltOutput = null;

// "Strictly" wood/charcoal LANG ang tinatanggap ng fuel slot (tingnan
// ang paggamit nito sa hotbar.js - pointermove/pointerup listener).
// (Dating may sirang 2nd argument dito - `new Set(arr1, arr2)` ay
// BINABALEWALA ng Set constructor ang lahat ng argumento pagkatapos ng
// una, kaya walang epekto ang dating `["wood", "meat"]` doon - dead
// code lang, tinanggal na para hindi malito.)
const SMELT_FUEL_ITEMS = new Set(["wood", "charcoal"]);

// Ang "ingredient" lang ang tumutukoy sa resulta - kahit anong fuel
// (wood o charcoal, basta nasa SMELT_FUEL_ITEMS) ang gamitin, pareho
// lang ang lalabas. `findMatchingSmeltRecipe` ay `.find()` (unang
// tugma lang) - kaya iisa lang dapat ang recipe kada ingredient, kung
// hindi, "mananakaw"/mapaparang unreachable ang susunod na recipe na
// may PAREHONG ingredient (ito ang dating bug: dalawang "wood" entry,
// kaya ang 2nd entry - dapat sana ay cookedmeat - hindi na kailanman
// naaabot).
const SMELT_RECIPES = [
  { ingredient: "wood", result: { itemId: "charcoal", count: 1 } },
  // Raw na "meat" (drop ng pig, tingnan ang pig.js) → "cookedmeat" -
  // parehong fuel (wood/charcoal) at parehong 10s/piraso na batayan ng
  // ibang recipe, tingnan ang SMELT_COOK_DURATION_MS sa itaas.
  { ingredient: "meat", result: { itemId: "cookedmeat", count: 1 } },
];

// Ilang ms bago matapos ang PAGLUTO ng 1 piraso - tunay na oras (Date.now
// -based, hindi apektado ng zoom/fps), kaparehong klase ng batayan ng
// TORCH_LIFESPAN_MS (hotbar.js).
const SMELT_COOK_DURATION_MS = 10000;

// Gaano na katagal (ms) ang kasalukuyang "in progress" na piraso -
// naka-reset sa 0 tuwing may bagong piraso na natapos (o kapag tumigil
// ang pagluluto, hal. naubos ang ingredient/fuel o inalis ito) - tingnan
// ang updateStoveCooking sa ibaba.
let smeltCookProgressMs = 0;

function findMatchingSmeltRecipe() {
  if (!smeltIngredient || !smeltFuel) return null;

  return (
    SMELT_RECIPES.find(
      (recipe) => recipe.ingredient === smeltIngredient.itemId,
    ) || null
  );
}

// Aktibong may niluluto ba ngayon? (may sapat pang ingredient AT fuel,
// at may valid na recipe) - ginagamit ito ng updateStoveCooking (baba)
// para malaman kung dapat tumakbo ang timer, at ng getStoveAnimFrameIndex
// (ibaba pa) para malaman kung dapat mag-animate ang apoy sa sprite.
function isStoveActivelyCooking() {
  return (
    Boolean(smeltIngredient) &&
    smeltIngredient.count > 0 &&
    Boolean(smeltFuel) &&
    smeltFuel.count > 0 &&
    Boolean(findMatchingSmeltRecipe())
  );
}

// Tinatawag KADA FRAME mula sa update.js (tunay na deltaMs, hindi
// apektado ng speedScale) - unti-unting tumatakbo ang SMELT_COOK_
// DURATION_MS kada piraso habang isStoveActivelyCooking(), pagkatapos
// noon awtomatikong naubusan ng 1 ang ingredient AT fuel, tapos
// idinaragdag ang resulta sa smeltOutput - PAULIT-ULIT ito hangga't may
// natitira pa (hindi na kailangang muling ilagay/i-drag).
function updateStoveCooking(deltaMs) {
  if (!isStoveActivelyCooking()) {
    smeltCookProgressMs = 0;
    return;
  }

  smeltCookProgressMs += deltaMs;

  let changed = false;

  while (
    smeltCookProgressMs >= SMELT_COOK_DURATION_MS &&
    isStoveActivelyCooking()
  ) {
    const recipe = findMatchingSmeltRecipe();

    if (!recipe) break;

    // Kung may laman na ang output slot na IBANG item type (hindi
    // dapat mangyari sa kasalukuyang SMELT_RECIPES - iisa pa lang ang
    // recipe - pero segurado tayo para sa susunod na dagdag na recipe),
    // huwag munang ituloy - parang "puno" ang output, hintayin munang
    // madampot bago tumuloy.
    if (smeltOutput && smeltOutput.itemId !== recipe.result.itemId) break;

    smeltCookProgressMs -= SMELT_COOK_DURATION_MS;

    smeltIngredient.count--;
    smeltFuel.count--;

    if (smeltIngredient.count <= 0) smeltIngredient = null;
    if (smeltFuel.count <= 0) smeltFuel = null;

    if (smeltOutput) smeltOutput.count += recipe.result.count;
    else
      smeltOutput = {
        itemId: recipe.result.itemId,
        count: recipe.result.count,
      };

    changed = true;
  }

  if (!isStoveActivelyCooking()) smeltCookProgressMs = 0;

  if (changed) {
    syncStovePanel();

    if (typeof syncHotbarUI === "function") syncHotbarUI();
  } else {
    // Walang natapos na piraso sa frame na ito, pero tumatakbo pa rin
    // ang progress bar - light-weight na DOM update lang (hindi buong
    // syncStovePanel/syncHotbarUI, mahal ang pag-rebuild ng bag grid
    // kada frame) - tingnan ang updateStoveCookVisual sa ibaba.
    if (typeof updateStoveCookVisual === "function") updateStoveCookVisual();
  }
}

// =========================
// PAGLALAGAY/PAG-ALIS NG INGREDIENTS
// =========================

// slotType - "ingredient" o "fuel". qty - ilang piraso ang isusubukang
// ilagay (tingnan ang paggamit nito sa hotbar.js - pointerup listener,
// buong hawak/floatingPickup.count ang ipinapasa, hindi na 1 lang) -
// naka-clamp pa rin sa TALAGANG stock, at TUMATANGGI kung may LAMAN NA
// ang slot na IBANG item type (hindi puwedeng maghalo). Ibinabalik ang
// ILANG PIRASO ANG TALAGANG NAILAGAY (para malaman ng caller kung
// magkano ang natitira sa hawak niya).
function placeSmeltItem(slotType, itemId, qty) {
  if (!itemId || !qty || qty <= 0) return 0;
  if (slotType === "fuel" && !SMELT_FUEL_ITEMS.has(itemId)) return 0;

  const currentSlot = slotType === "ingredient" ? smeltIngredient : smeltFuel;

  if (currentSlot && currentSlot.itemId !== itemId) return 0; // ibang item na, hindi puwede

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return 0;

  const amount = Math.min(qty, item.getCount());

  if (amount <= 0) return 0;

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, -amount);
  }

  if (currentSlot) {
    currentSlot.count += amount;
  } else if (slotType === "ingredient") {
    smeltIngredient = { itemId, count: amount };
  } else {
    smeltFuel = { itemId, count: amount };
  }

  syncStovePanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  return amount;
}

// refundToBag - true kung dapat ibalik sa GLOBAL bag stock (papunta sa
// bag/hotbar), false kung itatapon sa mundo (HUWAG nang ibalik sa
// stock - ground item na ang bahalang kumatawan dito, tingnan ang
// paggamit nito sa hotbar.js pointerup listener). Inaalis ang BUONG
// STACK (hindi lang 1) - ibinabalik ang { itemId, count } na natanggal
// (o null kung wala namang laman), para malaman ng caller (hotbar.js)
// kung ilan/ano ang ilalagay sa mundo/bag.
function removeSmeltItem(slotType, refundToBag) {
  const slot = slotType === "ingredient" ? smeltIngredient : smeltFuel;

  if (!slot) return null;

  const removed = { itemId: slot.itemId, count: slot.count };

  if (refundToBag && typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(removed.itemId, removed.count);
  }

  if (slotType === "ingredient") smeltIngredient = null;
  else smeltFuel = null;

  smeltCookProgressMs = 0; // itinigil ang kasalukuyang in-progress na piraso

  syncStovePanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  return removed;
}

// Tinatawag kapag ni-drag PALABAS (papunta sa bag/hotbar) ang laman ng
// OUTPUT slot - saka pa lang talaga naidaragdag sa stock ang resulta.
// Kaparehong-pareho ng gawi ng collectGroundItem (ground-items.js) -
// kung SAAN MAN kasalukuyang EXPLICIT na "nakatira" ang item na ito
// (hotbar slot o bag split-stack), doon ito idinaragdag (routeCollectedItemIncrease),
// hindi basta bagong cell.
function collectSmeltOutput() {
  if (!smeltOutput) return;

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(smeltOutput.itemId, smeltOutput.count);
  }

  if (typeof routeCollectedItemIncrease === "function") {
    routeCollectedItemIncrease(smeltOutput.itemId, smeltOutput.count);
  }

  smeltOutput = null;

  syncStovePanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// TOGGLE/PAGBUBUKAS NG PANEL
// =========================

function toggleStovePanel() {
  stovePanelOpen = !stovePanelOpen;
  syncStovePanel();
}

// Tinatawag ng dig.js kapag na-click ang isang naka-lagay na Stove sa
// mundo.
function openStovePanel() {
  stovePanelOpen = true;
  syncStovePanel();
}

document.getElementById("stove-panel-close")?.addEventListener("click", () => {
  toggleStovePanel();
});

// =========================
// PAGGUHIT NG PANEL
// =========================

function syncStovePanel() {
  const panel = document.getElementById("stove-panel");

  if (!panel) return;

  panel.classList.toggle("hidden", !stovePanelOpen);

  if (!stovePanelOpen) return;

  const ingredientEl = document.querySelector(
    '.smelt-input-slot[data-smelt-slot="ingredient"]',
  );
  const fuelEl = document.querySelector(
    '.smelt-input-slot[data-smelt-slot="fuel"]',
  );
  const outputEl = document.getElementById("stove-output-slot");

  if (ingredientEl) {
    ingredientEl.innerHTML = "";

    if (smeltIngredient) {
      const item = BAG_ITEMS.find(
        (entry) => entry.id === smeltIngredient.itemId,
      );

      if (item && typeof getItemIconHTML === "function") {
        ingredientEl.innerHTML = getItemIconHTML(item);
      }

      const badge = document.createElement("span");

      badge.className = "hotbar-badge";
      badge.textContent =
        smeltIngredient.count > 99 ? "99+" : smeltIngredient.count;
      ingredientEl.appendChild(badge);
    }
  }

  if (fuelEl) {
    fuelEl.innerHTML = "";

    if (smeltFuel) {
      const item = BAG_ITEMS.find((entry) => entry.id === smeltFuel.itemId);

      if (item && typeof getItemIconHTML === "function") {
        fuelEl.innerHTML = getItemIconHTML(item);
      }

      const badge = document.createElement("span");

      badge.className = "hotbar-badge";
      badge.textContent = smeltFuel.count > 99 ? "99+" : smeltFuel.count;
      fuelEl.appendChild(badge);
    }
  }

  if (outputEl) {
    outputEl.innerHTML = "";
    outputEl.classList.toggle("craft-output-ready", Boolean(smeltOutput));

    if (smeltOutput) {
      const item = BAG_ITEMS.find((entry) => entry.id === smeltOutput.itemId);

      if (item && typeof getItemIconHTML === "function") {
        outputEl.innerHTML = getItemIconHTML(item);
      }

      const badge = document.createElement("span");

      badge.className = "hotbar-badge";
      badge.textContent = smeltOutput.count > 99 ? "99+" : smeltOutput.count;
      outputEl.appendChild(badge);
    }
  }

  // "Copy" ng buong inventory grid - PAREHONG DATA mismo ng bag
  // (renderBagGridInto sa hotbar.js), hindi hiwalay na storage.
  if (typeof renderBagGridInto === "function") {
    renderBagGridInto(document.getElementById("stove-panel-grid"));
  }

  updateStoveCookVisual();
}

// Light-weight na DOM update lang (isang CSS custom property) - hindi
// kasing-bigat ng buong syncStovePanel (na nagre-rebuild ng bag grid) -
// tinatawag ito KADA FRAME (updateStoveCooking sa itaas) habang bukas
// ang panel, para makita ang progress bar ng "niluluto" na piraso nang
// SMOOTH, hindi lang tuwing may natatapos.
function updateStoveCookVisual() {
  if (!stovePanelOpen) return;

  const row = document.getElementById("stove-smelt-row");

  if (!row) return;

  const cooking = isStoveActivelyCooking();
  const progress = cooking
    ? Math.max(0, Math.min(1, smeltCookProgressMs / SMELT_COOK_DURATION_MS))
    : 0;

  row.classList.toggle("stove-cooking", cooking);
  row.style.setProperty("--stove-cook-progress", progress);
}

// =========================
// PAG-DRAG PALABAS NG MGA SMELT SLOT
// =========================
//
// Kaparehong-pareho ng gawi ng startCraftInputDrag (craft.js) - iisa
// pa ring dragState/dragGhostEl ang ginagamit (global, hotbar.js) para
// magkatugma ang buong drag system.


function startSmeltItemDrag(slotType, itemId, event) {
  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return;

  dragState = {
    source: slotType === "ingredient" ? "smelt-ingredient" : "smelt-fuel",
    itemId,
    smeltSlotType: slotType,
    fromSlotIndex: null,
    fromBagPosition: null,
    startX: event.clientX,
    startY: event.clientY,
    activated: true,
  };

  dragGhostEl = document.createElement("div");
  dragGhostEl.id = "hotbar-drag-ghost";
  dragGhostEl.innerHTML = getItemIconHTML(item);
  document.body.appendChild(dragGhostEl);
  moveDragGhost(event.clientX, event.clientY);

  event.preventDefault();
}

// BAGONG: kung may naka-hawak (floatingPickup) na HINDI aktibong
// dinadrag - kagaya ng feature na idinagdag din sa craft.js - puwede na
// ring PLAIN LEFT-CLICK ang paglalagay dito, KAHIT ILANG PIRASO pa ang
// buong hawak (buong floatingPickup.count ang isinusubok ilagay kada
// click, kaparehong-pareho ng gawi ng hold-drag-drop sa pointerup,
// hotbar.js - ang "stove" ay talagang stackable na kada slot, hindi
// tulad ng crafter na 1 piraso lang kada click).
function tryPlaceFloatingIntoSmeltSlot(slotType, event) {
  if (
    typeof floatingPickup === "undefined" ||
    !floatingPickup ||
    (typeof dragState !== "undefined" && dragState && dragState.activated)
  ) {
    return false;
  }

  event.preventDefault();

  const placed =
    typeof placeSmeltItem === "function"
      ? placeSmeltItem(slotType, floatingPickup.itemId, floatingPickup.count)
      : 0;

  if (placed > 0) {
    floatingPickup.count -= placed;

    if (floatingPickup.count <= 0 && typeof clearFloatingPickupState === "function") {
      clearFloatingPickupState();
    } else if (typeof updateFloatingGhostContent === "function") {
      updateFloatingGhostContent();
    }
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();

  return true;
}

document
  .querySelector('.smelt-input-slot[data-smelt-slot="ingredient"]')
  ?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (tryPlaceFloatingIntoSmeltSlot("ingredient", event)) return;
    if (!smeltIngredient) return;
    startSmeltItemDrag("ingredient", smeltIngredient.itemId, event);
  });

document
  .querySelector('.smelt-input-slot[data-smelt-slot="fuel"]')
  ?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (tryPlaceFloatingIntoSmeltSlot("fuel", event)) return;
    if (!smeltFuel) return;
    startSmeltItemDrag("fuel", smeltFuel.itemId, event);
  });

document
  .getElementById("stove-output-slot")
  ?.addEventListener("pointerdown", (event) => {
    if (!smeltOutput) return;

    const item = BAG_ITEMS.find((entry) => entry.id === smeltOutput.itemId);

    if (!item) return;

    dragState = {
      source: "smelt-output",
      itemId: smeltOutput.itemId,
      fromSlotIndex: null,
      fromBagPosition: null,
      startX: event.clientX,
      startY: event.clientY,
      activated: true,
    };

    dragGhostEl = document.createElement("div");
    dragGhostEl.id = "hotbar-drag-ghost";
    dragGhostEl.innerHTML = getItemIconHTML(item);
    document.body.appendChild(dragGhostEl);
    moveDragGhost(event.clientX, event.clientY);

    event.preventDefault();
  });

// =========================
// PAGLALAGAY NG "STOVE" SA MUNDO (kaparehong-pareho ng "Crafter")
// =========================

let placedStoves = []; // { world, col, row, id }
let placedStoveIdCounter = 0;

// Naka-highlight (naka-select - selectedInventorySlot sa hotbar.js) ba
// ngayon ang isang hotbar slot na may Stove? Kapareho ng
// isCrafterSlotSelected (craft.js) - ito na ang batayan kung "handa
// nang ilagay sa mundo" sa pamamagitan ng left-click sa isang ground
// tile (tingnan ang mousedown listener sa dig.js).
function isStoveSlotSelected() {
  return (
    typeof selectedInventorySlot !== "undefined" &&
    selectedInventorySlot !== null &&
    typeof pinnedSlots !== "undefined" &&
    pinnedSlots[selectedInventorySlot] === "stove"
  );
}

// Tinatawag ng dig.js (mousedown, habang naka-highlight ang Stove sa
// isang hotbar slot - tingnan ang isStoveSlotSelected) papunta sa
// EKSAKTONG tinurong tile, o ng dropItemFromSlotIntoWorld
// (ground-items.js, i-drag papunta sa canvas, kaparehong-pareho ng
// gawi ng ibang item ngayon - basta floating ground item, hindi na
// espesyal). PERMANENTENG BAGAY ito sa mundo (parang bahay/puno) kapag
// PINLACE (hindi basta na-drop) - tingnan ang getPlacedStoveAt sa
// dig.js.
function placeStoveInWorld(col, row) {
  if (stovesCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  placedStoves.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedStoveIdCounter++,
  });

  stovesCollected--;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Stove sa eksaktong cell na ito (sa kasalukuyang
// mundo)? Tingnan ang paggamit nito sa dig.js (mousedown listener).
function getPlacedStoveAt(col, row) {
  return (
    placedStoves.find(
      (stove) =>
        stove.world === currentWorld && stove.col === col && stove.row === row,
    ) || null
  );
}

// I-RIGHT-CLICK ang isang naka-lagay na Stove sa mundo (tingnan ang
// contextmenu listener sa dig.js) para "sirain"/tanggalin ito bilang
// PERMANENTENG bagay - kaparehong-pareho ng gawi ng breakPlacedCrafter
// (craft.js): hindi ito bumabalik agad sa stovesCollected/hotbar,
// lumalabas muna bilang ORDINARYONG FLOATING ground item (kailangan pa
// itong damputin bago mapunta sa bag). ANUMANG kasalukuyang niluluto
// (smeltIngredient/smeltFuel/smeltOutput) ay NANATILI (hindi kasama
// ang mga ito sa "pagsira" ng estruktura - iisa pa lang kasi ang
// GLOBAL na estado ng pagluluto sa buong laro, hindi per-stove).
function breakPlacedStove(stove) {
  const index = placedStoves.indexOf(stove);

  if (index === -1) return;

  placedStoves.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(stove.col, stove.row, "stove", 1);
  }

  if (typeof spawnDigEffect === "function") {
    spawnDigEffect(stove.col, stove.row);
  }
}

// =========================
// COLLISION NG NAKA-LAGAY NA STOVE
// =========================
//
// Kaparehong-pareho ng gawi ng getPlacedCrafterCollisionBoxes
// (craft.js) - "LIVE" na collision, tinatawag ng canMoveTo
// (collisions.js, player) AT ng canFeetMoveTo (decor.js, oldman/pig).
const STOVE_COLLISION_SIZE = TILE_SIZE * 0.85;

function getPlacedStoveCollisionBoxes() {
  if (placedStoves.length === 0) return [];

  const inset = (TILE_SIZE - STOVE_COLLISION_SIZE) / 2;

  return placedStoves
    .filter((stove) => stove.world === currentWorld)
    .map((stove) => ({
      x: stove.col * TILE_SIZE + inset,
      y: stove.row * TILE_SIZE + inset,
      width: STOVE_COLLISION_SIZE,
      height: STOVE_COLLISION_SIZE,
    }));
}

// =========================
// SPRITE (assets/objects/stove/stove.png) - 6 frame, magkakapantay na
// hanay (horizontal strip). Frame 1 (index 0) - "walang laman/wala pang
// niluluto" (naka-off ang apoy). Frame 2-6 (index 1-5) - umaandar/may
// apoy - tingnan ang getStoveAnimFrameIndex sa ibaba, kung SAAN ito
// gina-cycle habang AKTIBONG NAGLULUTO (isStoveActivelyCooking - may
// sapat pang ingredient AT fuel, tingnan sa itaas) - hindi na basta
// "may output" lang, dahil puwede nang magpatuloy magluto ng maraming
// piraso magkakasunod (tingnan ang updateStoveCooking).
const STOVE_SPRITE_IMAGE = new Image();

STOVE_SPRITE_IMAGE.src = "./assets/objects/stove/stove.png";

const STOVE_SPRITE_FRAME_COUNT = 6;

// Ilang ms bawat frame habang naka-"cook" (umiikot lang sa frame 2-6,
// hindi na babalik pa sa frame 1 hangga't aktibong naglluto).
const STOVE_COOK_FRAME_MS = 150;

// index (0-based) ng kasalukuyang dapat ipakitang frame sa sprite sheet -
// 0 (frame 1) kapag walang niluluto, 1-5 (frame 2-6) na umiikot kapag
// meron (tingnan ang paliwanag sa itaas).
function getStoveAnimFrameIndex() {
  if (typeof isStoveActivelyCooking !== "function" || !isStoveActivelyCooking())
    return 0;

  const cookFrames = STOVE_SPRITE_FRAME_COUNT - 1; // 5 (frame 2-6)
  const step = Math.floor(performance.now() / STOVE_COOK_FRAME_MS) % cookFrames;

  return 1 + step;
}

// Iginuguhit sa PAREHONG layer/oras ng drawPlacedCrafters (draw.js) -
// world space, sa ilalim ng player.
function drawPlacedStoves() {
  if (placedStoves.length === 0) return;

  const here = placedStoves.filter((stove) => stove.world === currentWorld);

  if (here.length === 0) return;

  // Kapag hindi pa fully-loaded ang sprite (lumaki lang habang pumapasok
  // ang unang mga frame ng loop), emoji muna bilang fallback - hindi na
  // ito mangyayari sa madaling panahon (naka-cache na agad ang image
  // pagka-preload), pero segurado tayong hindi basta "walang laman" ang
  // makikita.
  if (!STOVE_SPRITE_IMAGE.complete || STOVE_SPRITE_IMAGE.naturalWidth === 0) {
    ctx.save();
    ctx.font = TILE_SIZE * 0.8 + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const stove of here) {
      ctx.fillText(
        "🍲",
        stove.col * TILE_SIZE + TILE_SIZE / 2,
        stove.row * TILE_SIZE + TILE_SIZE / 2,
      );
    }

    ctx.restore();
    return;
  }

  const frameIndex = getStoveAnimFrameIndex();
  const frameWidth = STOVE_SPRITE_IMAGE.naturalWidth / STOVE_SPRITE_FRAME_COUNT;
  const frameHeight = STOVE_SPRITE_IMAGE.naturalHeight;

  const drawWidth = TILE_SIZE;
  const drawHeight = (drawWidth / frameWidth) * frameHeight;

  ctx.save();

  for (const stove of here) {
    const centerX = stove.col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = stove.row * TILE_SIZE + TILE_SIZE / 2;

    ctx.drawImage(
      STOVE_SPRITE_IMAGE,
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight,
    );
  }

  ctx.restore();
}

// =========================
// ILAW NG STOVE (kapag AKTIBONG NAGLULUTO)
// =========================
//
// Kaparehong-estilo ng drawTorchLight (atmosphere.js) - bilog na
// mainit na liwanag, SCREEN SPACE (hindi kasama sa camera transform ng
// draw.js, tingnan ang paggamit nito doon), sa IBABAW ng araw/gabi na
// tint (drawDayNight) para kumakalaban ito sa dilim. PERO naka-anchor
// sa POSISYON ng bawat naka-lagay na Stove (hindi sa player), at LAGING
// may kaunting liwanag KAHIT ARAW PA (hindi tulad ng torch na
// nawawalan ng epekto sa liwanag ng araw) - dahil ito mismo ay parang
// "apoy sa loob ng stove", hindi pangkalahatang panlaban sa dilim.
// AKTIBO lang ito kapag AKTIBONG NAGLULUTO (isStoveActivelyCooking) -
// naka-off ang apoy (frame 1, walang liwanag) kapag walang niluluto,
// kaparehong batayan ng getStoveAnimFrameIndex sa itaas.
const STOVE_LIGHT_RADIUS = 40; // world pixels, hindi pa naka-multiply sa zoom
const STOVE_LIGHT_COLOR = "255, 160, 60";

// Minimum na intensity kahit tanghaling-tapat (0-1) - hindi tulad ng
// torch (na 0 kapag araw), dahil TALAGANG may apoy na nakikita sa loob
// ng stove mismo, hindi lang panlaban sa kadiliman sa paligid.
const STOVE_LIGHT_MIN_INTENSITY = 0.35;

function drawStoveLight() {
  if (placedStoves.length === 0) return;
  if (typeof isStoveActivelyCooking !== "function" || !isStoveActivelyCooking())
    return;

  const here = placedStoves.filter((stove) => stove.world === currentWorld);

  if (here.length === 0) return;

  const nightAmount =
    typeof getNightAmount === "function" ? getNightAmount() : 0;
  const intensity =
    STOVE_LIGHT_MIN_INTENSITY + (1 - STOVE_LIGHT_MIN_INTENSITY) * nightAmount;

  const radius = STOVE_LIGHT_RADIUS * camera.zoom;

  ctx.save();

  // "lighter" (additive) - kaparehong dahilan ng drawTorchLight sa itaas.
  ctx.globalCompositeOperation = "lighter";

  for (const stove of here) {
    const screenX =
      (stove.col * TILE_SIZE + TILE_SIZE / 2 - camera.x) * camera.zoom;
    const screenY =
      (stove.row * TILE_SIZE + TILE_SIZE / 2 - camera.y) * camera.zoom;

    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      radius,
    );

    gradient.addColorStop(0, `rgba(${STOVE_LIGHT_COLOR}, ${0.6 * intensity})`);
    gradient.addColorStop(
      0.6,
      `rgba(${STOVE_LIGHT_COLOR}, ${0.25 * intensity})`,
    );
    gradient.addColorStop(1, `rgba(${STOVE_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
