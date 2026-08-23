// =========================
// LUTUAN (cooking/smelting station)
// =========================
//
// Kaparehong-pareho ng gawi ng "Crafter" (craft.js) - i-craft (SHAPED
// recipe, 8 stone paikot sa gitna ng 3x3 grid - tingnan ang
// CRAFT_SHAPED_RECIPES sa craft.js), i-drag papuntang mundo para
// ilagay bilang PERMANENTENG bagay (o basta i-drop na lang bilang
// karaniwang floating ground item, kagaya ng crafter - tingnan ang
// placeLutuanInWorld/isLutuanSlotSelected), i-click ito sa mundo para
// buksan ang sarili nitong FLOATING na panel (tulad ng #bag-panel - may
// draggable header, "✕" close).
//
// Ang panel: [OUTPUT] <- [INGREDIENT] <- [FUEL] na 3 smelt slot sa
// itaas, tapos buong "copy" ng inventory grid sa ibaba - PAREHONG DATA
// mismo ng bag (hindi hiwalay na storage), tingnan ang renderBagGridInto
// sa hotbar.js. Isang piraso lang kada smelt cell, INSTANT ang
// pag-smelt sa sandaling magtugma ang ingredient+fuel (walang timer/
// progress bar pa - susunod na feature kung kailangan).

let cookedmeat = 0;
let charcoalCollected = 0;
let lutuansCollected = 0;

let lutuanPanelOpen = false;

// null = walang laman. May laman = itemId (isang piraso lang).
let smeltIngredient = null;
let smeltFuel = null;

// { itemId, count } o null kung wala pang naigawang resulta.
let smeltOutput = null;

// "Strictly" wood/charcoal LANG ang tinatanggap ng fuel slot (tingnan
// ang paggamit nito sa hotbar.js - pointermove/pointerup listener).
const SMELT_FUEL_ITEMS = new Set(["wood", "charcoal"], ["wood", "meat"]);

// Ang "ingredient" lang ang tumutukoy sa resulta - kahit anong fuel
// (wood o charcoal, basta nasa SMELT_FUEL_ITEMS) ang gamitin, pareho
// lang ang lalabas.
const SMELT_RECIPES = [
  { ingredient: "wood", result: { itemId: "charcoal", count: 1 } },
  { ingredient: "meat", result: { itemId: "charcoal", count: 1 } },
];

function findMatchingSmeltRecipe() {
  if (!smeltIngredient || !smeltFuel) return null;

  return (
    SMELT_RECIPES.find((recipe) => recipe.ingredient === smeltIngredient) ||
    null
  );
}

// Tinatawag pagkatapos ng bawat pagbabago sa smeltIngredient/smeltFuel -
// INSTANT ang pag-smelt (walang paghihintay) sa sandaling magtugma ang
// dalawa, kaparehong-pareho ng gawi ng updateCraftOutputFromInputs sa
// craft.js.
function updateSmeltOutputFromInputs() {
  if (smeltOutput) return;

  const recipe = findMatchingSmeltRecipe();

  if (!recipe) return;

  smeltIngredient = null;
  smeltFuel = null;
  smeltOutput = { itemId: recipe.result.itemId, count: recipe.result.count };
}

// =========================
// PAGDARAGDAG/PAG-ALIS NG STOCK
// =========================

function consumeOneOfSmeltItem(itemId) {
  if (itemId === "wood") woodCollected--;
  else if (itemId === "charcoal") charcoalCollected--;
  else if (itemId === "meat") cookedmeat--;
}

function refundOneOfSmeltItem(itemId) {
  if (itemId === "wood") woodCollected++;
  else if (itemId === "charcoal") charcoalCollected++;
  else if (itemId === "meat") cookedmeat++;
}

// =========================
// PAGLALAGAY/PAG-ALIS NG INGREDIENTS
// =========================

// slotType - "ingredient" o "fuel". Tinatawag ng hotbar.js (pointerup)
// kapag ni-drop ang isang HAWAK papunta sa isang smelt input slot.
function placeSmeltItem(slotType, itemId) {
  if (slotType === "fuel" && !SMELT_FUEL_ITEMS.has(itemId)) return;
  if (slotType === "ingredient" && smeltIngredient) return; // may laman na
  if (slotType === "fuel" && smeltFuel) return;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item || item.getCount() <= 0) return;

  consumeOneOfSmeltItem(itemId);

  if (slotType === "ingredient") smeltIngredient = itemId;
  else smeltFuel = itemId;

  updateSmeltOutputFromInputs();
  syncLutuanPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// refundToBag - true kung dapat ibalik sa GLOBAL bag stock (papunta sa
// bag/hotbar), false kung itatapon sa mundo (HUWAG nang ibalik sa
// stock - ground item na ang bahalang kumatawan dito, tingnan ang
// paggamit nito sa hotbar.js pointerup listener).
function removeSmeltItem(slotType, refundToBag) {
  const itemId = slotType === "ingredient" ? smeltIngredient : smeltFuel;

  if (!itemId) return;

  if (refundToBag) refundOneOfSmeltItem(itemId);

  if (slotType === "ingredient") smeltIngredient = null;
  else smeltFuel = null;

  syncLutuanPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
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

  syncLutuanPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// TOGGLE/PAGBUBUKAS NG PANEL
// =========================

function toggleLutuanPanel() {
  lutuanPanelOpen = !lutuanPanelOpen;
  syncLutuanPanel();
}

// Tinatawag ng dig.js kapag na-click ang isang naka-lagay na Lutuan sa
// mundo.
function openLutuanPanel() {
  lutuanPanelOpen = true;
  syncLutuanPanel();
}

document.getElementById("lutuan-panel-close")?.addEventListener("click", () => {
  toggleLutuanPanel();
});

// =========================
// PAGGUHIT NG PANEL
// =========================

function syncLutuanPanel() {
  const panel = document.getElementById("lutuan-panel");

  if (!panel) return;

  panel.classList.toggle("hidden", !lutuanPanelOpen);

  if (!lutuanPanelOpen) return;

  const ingredientEl = document.querySelector(
    '.smelt-input-slot[data-smelt-slot="ingredient"]',
  );
  const fuelEl = document.querySelector(
    '.smelt-input-slot[data-smelt-slot="fuel"]',
  );
  const outputEl = document.getElementById("lutuan-output-slot");

  if (ingredientEl) {
    ingredientEl.innerHTML = "";

    if (smeltIngredient) {
      const item = BAG_ITEMS.find((entry) => entry.id === smeltIngredient);

      if (item && typeof getItemIconHTML === "function") {
        ingredientEl.innerHTML = getItemIconHTML(item);
      }
    }
  }

  if (fuelEl) {
    fuelEl.innerHTML = "";

    if (smeltFuel) {
      const item = BAG_ITEMS.find((entry) => entry.id === smeltFuel);

      if (item && typeof getItemIconHTML === "function") {
        fuelEl.innerHTML = getItemIconHTML(item);
      }
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
    renderBagGridInto(document.getElementById("lutuan-panel-grid"));
  }
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

document
  .querySelector('.smelt-input-slot[data-smelt-slot="ingredient"]')
  ?.addEventListener("pointerdown", (event) => {
    if (!smeltIngredient) return;
    startSmeltItemDrag("ingredient", smeltIngredient, event);
  });

document
  .querySelector('.smelt-input-slot[data-smelt-slot="fuel"]')
  ?.addEventListener("pointerdown", (event) => {
    if (!smeltFuel) return;
    startSmeltItemDrag("fuel", smeltFuel, event);
  });

document
  .getElementById("lutuan-output-slot")
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
// PAGLALAGAY NG "LUTUAN" SA MUNDO (kaparehong-pareho ng "Crafter")
// =========================

let placedLutuans = []; // { world, col, row, id }
let placedLutuanIdCounter = 0;

// Naka-highlight (naka-select - selectedInventorySlot sa hotbar.js) ba
// ngayon ang isang hotbar slot na may Lutuan? Kapareho ng
// isCrafterSlotSelected (craft.js) - ito na ang batayan kung "handa
// nang ilagay sa mundo" sa pamamagitan ng left-click sa isang ground
// tile (tingnan ang mousedown listener sa dig.js).
function isLutuanSlotSelected() {
  return (
    typeof selectedInventorySlot !== "undefined" &&
    selectedInventorySlot !== null &&
    typeof pinnedSlots !== "undefined" &&
    pinnedSlots[selectedInventorySlot] === "lutuan"
  );
}

// Tinatawag ng dig.js (mousedown, habang naka-highlight ang Lutuan sa
// isang hotbar slot - tingnan ang isLutuanSlotSelected) papunta sa
// EKSAKTONG tinurong tile, o ng dropItemFromSlotIntoWorld
// (ground-items.js, i-drag papunta sa canvas, kaparehong-pareho ng
// gawi ng ibang item ngayon - basta floating ground item, hindi na
// espesyal). PERMANENTENG BAGAY ito sa mundo (parang bahay/puno) kapag
// PINLACE (hindi basta na-drop) - tingnan ang getPlacedLutuanAt sa
// dig.js.
function placeLutuanInWorld(col, row) {
  if (lutuansCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  placedLutuans.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedLutuanIdCounter++,
  });

  lutuansCollected--;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Lutuan sa eksaktong cell na ito (sa kasalukuyang
// mundo)? Tingnan ang paggamit nito sa dig.js (mousedown listener).
function getPlacedLutuanAt(col, row) {
  return (
    placedLutuans.find(
      (lutuan) =>
        lutuan.world === currentWorld &&
        lutuan.col === col &&
        lutuan.row === row,
    ) || null
  );
}

// Iginuguhit sa PAREHONG layer/oras ng drawPlacedCrafters (draw.js) -
// world space, sa ilalim ng player.
function drawPlacedLutuans() {
  if (placedLutuans.length === 0) return;

  const here = placedLutuans.filter((lutuan) => lutuan.world === currentWorld);

  if (here.length === 0) return;

  ctx.save();
  ctx.font = TILE_SIZE * 0.8 + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const lutuan of here) {
    ctx.fillText(
      "🍲",
      lutuan.col * TILE_SIZE + TILE_SIZE / 2,
      lutuan.row * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  ctx.restore();
}
