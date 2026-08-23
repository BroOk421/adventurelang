// =========================
// CRAFTING (2x2 basic / 3x3 advanced - parang Minecraft)
// =========================
//
// "Basic" mode - 2x2 (4) input slots, palaging available (i-click ang
// #bag-craft sa footer ng bag para buksan/isara). "Advanced" mode - 3x3
// (9) input slots, kapag naka-click ang isang naka-lagay na Crafter sa
// mundo (tingnan ang openAdvancedCraftPanel). Numero ang bawat cell
// nito 1-9 (unang hanay 1-2-3, ikalawa 4-5-6, ikatlo 7-8-9 - tingnan ang
// syncCraftPanel) - ginagamit ito ng mga SHAPED recipe (tingnan ang
// CRAFT_SHAPED_RECIPES) kung saan MAHALAGA ang EKSAKTONG posisyon ng
// bawat ingredient, hindi lang ang bilang. May mga SHAPELESS recipe pa
// rin (CRAFT_RECIPES, ang BILANG lang ang mahalaga, hindi ang posisyon)
// - gumagana sa PAREHONG mode.
//
// Kada input cell ay puwede nang MARAMING piraso (stack, kagaya ng bag/
// hotbar) - hindi na "isang piraso lang" (dating hiling). Nag-uubos ng 1
// sa stock (woodCollected, atbp) kada idinaragdag na piraso, at nire-
// refund ang BUONG count kapag inalis ang cell. Kapag tumugma sa isang
// SHAPELESS recipe, awtomatikong naubos ang mga input (base sa TOTAL na
// bilang, hindi sa bilang ng cell) at lumalabas ang resulta sa OUTPUT
// SLOT (laging nasa KALIWA ng input grid) - kailangan pang i-drag ito
// palabas papunta sa bag bago talagang maidagdag sa stock. Kapag SHAPED
// recipe (pickaxe/rake/axe) - diretso nang na-"unlock" ang kasangkapan
// (walang output slot - equip-only ito, walang bilang/stock).

let craftPanelOpen = false;
let craftPanelMode = "basic"; // "basic" (2x2) o "advanced" (3x3)

// null = walang laman. May laman = { itemId, count } - MARAMING piraso
// na ng parehong item ang puwedeng maipon sa IISANG cell (tingnan ang
// placeCraftIngredient/MAX_CRAFT_STACK sa ibaba).
let craftInputs = [null, null, null, null];

// Pinakamataas na bilang na puwedeng maipon sa IISANG craft input cell -
// kaparehong konsepto/numero ng MAX_EXPLICIT_STACK sa hotbar.js.
const MAX_CRAFT_STACK = 99;

// { itemId, count } o null kung wala pang naigawang resulta.
let craftOutput = null;

const CRAFT_RECIPES = [
  { ingredients: { wood: 4 }, result: { itemId: "crafter", count: 1 } },
];

// SHAPED na recipe - MAHALAGA ang EKSAKTONG posisyon (0-8, "advanced"
// 3x3 lang - tingnan ang findMatchingShapedRecipe). Ang "shape" ay 9
// entry (null = dapat bakante ang cell na iyon).
//
//   0 1 2      (ipinapakita bilang 1 2 3 sa UI)
//   3 4 5      (4 5 6)
//   6 7 8      (7 8 9)
const CRAFT_SHAPED_RECIPES = [
  {
    // S S S
    // S W .
    // S . W
    shape: [
      "stone",
      "stone",
      "stone",
      "stone",
      "wood",
      null,
      "stone",
      null,
      "wood",
    ],
    result: { itemId: "pickaxe", count: 1 },
  },
  {
    // S . .
    // S W .
    // . . W
    shape: ["stone", null, null, "stone", "wood", null, null, null, "wood"],
    result: { itemId: "rake", count: 1 },
  },
  {
    // S S .
    // S W .
    // . . W
    shape: ["stone", "stone", null, "stone", "wood", null, null, null, "wood"],
    result: { itemId: "axe", count: 1 },
  },
  {
    // . S .
    // . S .
    // . W .
    shape: [null, "stone", null, null, "stone", null, null, "wood", null],
    result: { itemId: "sword", count: 1 },
  },
  {
    // . C .
    // . W .
    // . W .
    shape: [null, "charcoal", null, null, "wood", null, null, "wood", null],
    result: { itemId: "torch", count: 1 },
  },
  {
    // S S S
    // S . S
    // S S S
    shape: [
      "stone",
      "stone",
      "stone",
      "stone",
      null,
      "stone",
      "stone",
      "stone",
      "stone",
    ],
    result: { itemId: "stove", count: 1 },
  },
];

// Listahan ng mga item na ipinapakita sa recipe guide (dead space sa
// ilalim ng #crafter-dock - tingnan ang renderCraftGuide). Lahat ng ito
// ay SHAPED recipe (CRAFT_SHAPED_RECIPES), kaya "advanced" (3x3) mode
// lang gumagana ang guide/preview nito.
const CRAFT_GUIDE_ITEMS = ["pickaxe", "axe", "rake", "sword", "torch", "stove"];

// ItemId ng kasalukuyang PINILING guide/preview (null = wala) - tingnan
// ang renderCraftGuide/getSelectedGuideRecipe. GUIDE/PREVIEW LANG ito
// (naka-opacity, hindi tunay na ingredient) - kailangan pa ring
// maglagay ng AKTWAL na item sa bawat cell para talagang makapag-craft.
let craftGuideRecipeId = null;

// Panimulang stock ng "Crafter" (crafting table) - 0, dahil kailangan
// pa itong gawin (o balang araw, bilhin) - walang default na stock
// tulad ng ibang bagong item dati (carrot).
let craftersCollected = 0;

// Sword - "boolean" na kasangkapan (equip-only, walang tunay na bilang)
// kaparehong-pareho ng gawi ng pickaxeUnlocked/rakeUnlocked (dig.js) at
// axeUnlocked (resources.js) - tingnan ang collectCraftOutput. Wala pa
// itong aktwal na hotbar equip/combat na gawi (susunod na feature) -
// dito muna ito idineklara dahil crafting-specific pa lang ito.
let swordUnlocked = false;

function getCraftGridSize() {
  return craftPanelMode === "advanced" ? 9 : 4;
}

function getCraftGridColumns() {
  return craftPanelMode === "advanced" ? 3 : 2;
}

// =========================
// PAGTUTUGMA NG RECIPE
// =========================

function getCraftInputCounts() {
  const counts = {};

  for (const cell of craftInputs) {
    if (!cell) continue;

    counts[cell.itemId] = (counts[cell.itemId] || 0) + cell.count;
  }

  return counts;
}

function findMatchingCraftRecipe() {
  const counts = getCraftInputCounts();
  const presentIds = Object.keys(counts);

  for (const recipe of CRAFT_RECIPES) {
    const neededIds = Object.keys(recipe.ingredients);

    if (presentIds.length !== neededIds.length) continue;

    const matches = neededIds.every(
      (id) => counts[id] === recipe.ingredients[id],
    );

    if (matches) return recipe;
  }

  return null;
}

// SHAPED recipe lang - EKSAKTONG posisyon (0-8) ang sinusukat, "advanced"
// (3x3) mode lang ito valid (walang ika-10 cell sa "basic" para tugma
// dito, kaya walang epekto ang tawag na ito habang "basic" pa).
function findMatchingShapedRecipe() {
  if (craftPanelMode !== "advanced" || craftInputs.length !== 9) return null;

  for (const recipe of CRAFT_SHAPED_RECIPES) {
    const matches = recipe.shape.every((expected, i) => {
      const cell = craftInputs[i];
      const actualId = cell ? cell.itemId : null;

      return (expected || null) === actualId;
    });

    if (matches) return recipe;
  }

  return null;
}

// Ang recipe (CRAFT_SHAPED_RECIPES entry) na kasalukuyang PINILI sa
// recipe guide (#craft-recipe-guide-icons, tingnan ang renderCraftGuide)
// - null kung wala. GUIDE/PREVIEW LANG ito, gamit sa pag-overlay ng mga
// ghost icon sa mga bakanteng input cell (tingnan ang syncCraftPanel).
function getSelectedGuideRecipe() {
  if (!craftGuideRecipeId) return null;

  return (
    CRAFT_SHAPED_RECIPES.find(
      (recipe) => recipe.result.itemId === craftGuideRecipeId,
    ) || null
  );
}

// Iginuguhit ang hanay ng mga icon sa ilalim ng #crafter-dock (CRAFT_
// GUIDE_ITEMS) - i-click ang isang icon para PILIIN/I-DESELECT ito
// bilang recipe guide (tingnan ang getSelectedGuideRecipe), tapos
// ire-refresh ang buong panel para makita agad ang ghost preview sa
// input grid.
function renderCraftGuide() {
  const iconsEl = document.getElementById("craft-recipe-guide-icons");

  if (!iconsEl) return;

  iconsEl.innerHTML = "";

  for (const itemId of CRAFT_GUIDE_ITEMS) {
    const item = BAG_ITEMS.find((entry) => entry.id === itemId);

    if (!item) continue;

    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "craft-guide-icon";
    btn.title = item.label;
    btn.classList.toggle(
      "craft-guide-icon-active",
      craftGuideRecipeId === itemId,
    );

    if (typeof getItemIconHTML === "function")
      btn.innerHTML = getItemIconHTML(item);

    btn.addEventListener("click", () => {
      craftGuideRecipeId = craftGuideRecipeId === itemId ? null : itemId;
      syncCraftPanel();
    });

    iconsEl.appendChild(btn);
  }
}

// Tinatawag pagkatapos ng bawat pagbabago sa craftInputs. SHAPED muna
// ang sinusubukan (pickaxe/rake/axe - walang output slot, diretso nang
// na-"unlock"), tapos SHAPELESS (may output slot pa - hindi ito
// susubukan kung may naka-hintay na output).
function updateCraftOutputFromInputs() {
  if (craftOutput) return;

  const shapedRecipe = findMatchingShapedRecipe();

  if (shapedRecipe) {
    consumeShapedRecipeInputs(shapedRecipe);
    craftOutput = {
      itemId: shapedRecipe.result.itemId,
      count: shapedRecipe.result.count,
    };

    return;
  }

  const recipe = findMatchingCraftRecipe();

  if (!recipe) return;

  consumeShapelessRecipeInputs(recipe);
  craftOutput = { itemId: recipe.result.itemId, count: recipe.result.count };
}

// SHAPED: 1 lang ang kailangan bawat "required" na cell (walang
// bilang/quantity ang shape mismo) - kaya bawasan lang ng 1 ang bawat
// cell na bahagi ng shape, panatilihin ang ANUMANG NATITIRA (hal. kung
// may 3 wood na naipon sa isang cell na kailangan lang ng 1, 2 ang
// matitira roon pagkatapos - HINDI basta nawawala/nasasayang).
function consumeShapedRecipeInputs(recipe) {
  recipe.shape.forEach((expected, i) => {
    if (!expected) return;

    const cell = craftInputs[i];

    if (!cell) return;

    cell.count -= 1;

    if (cell.count <= 0) craftInputs[i] = null;
  });
}

// SHAPELESS: TOTAL na bilang (kahit saang cell/cells nanggaling) ang
// kailangan bawat ingredient - kaya dinadala/"drain" ang bawat cell na
// may tugmang itemId (sunod-sunod, mula sa unang cell) hanggang sa
// maabot ang kailangang TOTAL, hindi basta lahat ng cell na may
// tugmang item ay nilinis nang buo.
function consumeShapelessRecipeInputs(recipe) {
  for (const itemId of Object.keys(recipe.ingredients)) {
    let needed = recipe.ingredients[itemId];

    for (let i = 0; i < craftInputs.length && needed > 0; i++) {
      const cell = craftInputs[i];

      if (!cell || cell.itemId !== itemId) continue;

      const take = Math.min(cell.count, needed);

      cell.count -= take;
      needed -= take;

      if (cell.count <= 0) craftInputs[i] = null;
    }
  }
}

// =========================
// PAGDARAGDAG/PAG-ALIS NG STOCK (generic, kasama na ang "crafter")
// =========================

function consumeCraftItemAmount(itemId, amount) {
  if (itemId === "wood") woodCollected -= amount;
  else if (itemId === "stone") stoneCollected -= amount;
  else if (itemId === "carrot") carrotsCollected -= amount;
  else if (itemId === "charcoal") charcoalCollected -= amount;
}

function refundCraftItemAmount(itemId, amount) {
  consumeCraftItemAmount(itemId, -amount);
}

// =========================
// PAGLALAGAY/PAG-ALIS NG INGREDIENTS
// =========================

// Tinatawag ng hotbar.js (pointerup) kapag ni-drop ang isang HAWAK (mula
// sa floatingPickup - tingnan ang "HOLD-DRAG SPLIT STACK" sa hotbar.js)
// papunta sa isang craft input cell - PUWEDE nang MARAMING piraso kada
// cell ngayon (dating isa lang): kung bakante ang cell, gumagawa ng
// bagong stack (count 1); kung may laman na PAREHONG item, dinadagdagan
// lang ng 1 ang count (hanggang MAX_CRAFT_STACK); kung IBANG item ang
// laman, tinatanggihan (kailangan pang alisin muna, kagaya ng dati).
// Ang natitira sa hawak (kung meron) ay ibinabalik na ng hotbar.js
// pabalik sa pinagmulan.
function placeCraftIngredient(slotIndex, itemId) {
  const cell = craftInputs[slotIndex];

  if (cell && cell.itemId !== itemId) return; // ibang item na - alisin muna
  if (cell && cell.count >= MAX_CRAFT_STACK) return; // puno na ang stack dito

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item || item.getCount() <= 0) return;

  consumeCraftItemAmount(itemId, 1);

  if (cell) cell.count += 1;
  else craftInputs[slotIndex] = { itemId, count: 1 };

  updateCraftOutputFromInputs();
  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatawag kapag ni-drag PALABAS (pabalik sa bag) ang laman ng isang
// craft input cell - ibinabalik ang BUONG count ng cell (hindi lang 1) -
// isang cell ay isang buong "stack" na ngayon, hindi na isang piraso.
function removeCraftIngredient(slotIndex) {
  const cell = craftInputs[slotIndex];

  if (!cell) return;

  refundCraftItemAmount(cell.itemId, cell.count);
  craftInputs[slotIndex] = null;

  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatawag kapag ni-drag PALABAS (papunta sa bag) ang laman ng OUTPUT
// slot - saka pa lang talaga naidaragdag sa stock ang resulta.
function collectCraftOutput() {
  if (!craftOutput) return;

  if (craftOutput.itemId === "crafter") craftersCollected += craftOutput.count;
  // Pickaxe/rake/axe - BAGONG HILING: direktang "Unlocked" (equip-
  // ready sa tool radial) agad SA SANDALING i-drag palabas ang output
  // (dating dumadaan pa muna sa "InInventory"/bag bilang normal na
  // item, kailangang i-double click - tingnan ang lumang bahagi 7 item
  // 17 sa CLAUDE.md) - HINDI na sila lumalabas/lumilitaw sa bag/
  // inventory KAHIT SANDALI, para "less item sa inventory" - deretso
  // sa circle tools (tool radial). Ang `pickaxeInInventory`/
  // `rakeInInventory`/`axeInInventory` (dig.js/resources.js) ay
  // NAIWAN pa rin bilang variable (safe/hindi na aktibong gamit ng
  // landas na ito - tingnan ang bahagi 7 item 19 sa ibaba) sakaling
  // may umaasa pa dito (hal. lumang naka-save na data).
  else if (craftOutput.itemId === "pickaxe") pickaxeUnlocked = true;
  else if (craftOutput.itemId === "rake") rakeUnlocked = true;
  else if (craftOutput.itemId === "axe") axeUnlocked = true;
  else if (craftOutput.itemId === "sword") swordUnlocked = true;
  else if (craftOutput.itemId === "torch")
    torchesCollected += craftOutput.count;
  else if (craftOutput.itemId === "stove") stovesCollected += craftOutput.count;

  craftOutput = null;

  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// TOGGLE/PAGBUBUKAS NG PANEL
// =========================

function toggleCraftPanel() {
  craftPanelOpen = !craftPanelOpen;

  // Bumabalik sa "basic" (2x2) kapag isinara, para laging sariwa ang
  // susunod na pagbukas gamit ang footer icon (hindi naiiwang naka-
  // "advanced" mode kahit wala nang kalapit na Crafter). Nililinis din
  // ang napiling recipe guide/preview (tingnan ang renderCraftGuide).
  if (!craftPanelOpen) {
    craftPanelMode = "basic";
    craftGuideRecipeId = null;
  }

  syncCraftPanel();
}

// Tinatawag ng dig.js kapag na-click ang isang naka-lagay na Crafter sa
// mundo - pinapalitan sa "advanced" (3x3) mode at binubuksan ang
// #crafter-dock (huling kolum ng #bag-panel-body). Bahagi na ito ngayon
// ng #bag-panel (hindi na hiwalay/floating), kaya kailangan ding buksan
// ang bag panel mismo kung sarado pa ito, para makita agad ang crafter
// kahit saan pa sa mundo pinindot ang naka-lagay na Crafter.
function openAdvancedCraftPanel() {
  craftPanelMode = "advanced";
  craftPanelOpen = true;

  // syncHotbarUI (sa ibaba) ang bahalang mag-syncBagPanel gamit ang
  // bagong bagPanelOpen na ito.
  if (typeof bagPanelOpen !== "undefined") bagPanelOpen = true;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  else syncCraftPanel();
}

document.getElementById("bag-craft")?.addEventListener("click", () => {
  toggleCraftPanel();
});

document.getElementById("crafter-dock-close")?.addEventListener("click", () => {
  toggleCraftPanel();
});

// =========================
// PAGGUHIT NG PANEL
// =========================

// Dalawang "shell" ang crafting UI, depende sa craftPanelMode: "basic"
// = #craft-dock (unang kolum ng #bag-panel-body, walang close button,
// sumusunod sa bukas/sara ng buong bag); "advanced" = #crafter-dock
// (huling kolum, may "✕" close button). Iisa lang ang aktwal na laman
// (output slot + input grid, #craft-panel-body) - ini-reparent lang ito
// papunta sa tamang shell tuwing magbabago ang mode/estado.
function syncCraftPanel() {
  const body = document.getElementById("craft-panel-body");
  const dock = document.getElementById("craft-dock");
  const crafterDock = document.getElementById("crafter-dock");
  const guideAnchor = document.getElementById("craft-recipe-guide");

  if (!body || !dock || !crafterDock || !guideAnchor) return;

  const shouldShow = craftPanelOpen;
  const isAdvanced = craftPanelMode === "advanced";

  // Sa #crafter-dock, kailangang mauna ang laman (output+grid) bago ang
  // recipe guide (na naka-fix na sa dulo ng markup) - kaya insertBefore,
  // hindi lang basta appendChild.
  if (isAdvanced) crafterDock.insertBefore(body, guideAnchor);
  else dock.appendChild(body);

  // Mas malaki/naka-stretch ang output slot sa "advanced" mode (tingnan
  // ang #craft-panel-body.craft-panel-body-advanced sa style.css).
  body.classList.toggle("craft-panel-body-advanced", isAdvanced);

  dock.classList.toggle("hidden", !shouldShow || isAdvanced);
  crafterDock.classList.toggle("hidden", !shouldShow || !isAdvanced);

  if (typeof setHotbarSlotActive === "function") {
    setHotbarSlotActive("bag-craft", craftPanelOpen && !isAdvanced);
  }

  if (isAdvanced) renderCraftGuide();

  if (!shouldShow) return;

  const grid = document.getElementById("craft-input-grid");
  const outputSlot = document.getElementById("craft-output-slot");

  if (!grid || !outputSlot) return;

  const size = getCraftGridSize();

  grid.style.gridTemplateColumns =
    "repeat(" + getCraftGridColumns() + ", 40px)";

  // I-resize ang craftInputs kung kailangan (basic <-> advanced switch) -
  // nananatili ang laman ng mga cell na naibagay pa (0..min(old,new)).
  if (craftInputs.length !== size) {
    const resized = new Array(size).fill(null);

    for (let i = 0; i < Math.min(size, craftInputs.length); i++) {
      resized[i] = craftInputs[i];
    }

    craftInputs = resized;
  }

  grid.innerHTML = "";

  for (let i = 0; i < size; i++) {
    const cell = document.createElement("div");

    cell.className = "craft-slot craft-input-slot";
    cell.dataset.craftSlot = String(i);

    const inputCell = craftInputs[i];

    if (inputCell) {
      const item = BAG_ITEMS.find((entry) => entry.id === inputCell.itemId);

      if (item && typeof getItemIconHTML === "function") {
        cell.innerHTML = getItemIconHTML(item);
      }

      // Quantity badge - kapareho ng estilo ng output slot/hotbar (may
      // laman lang kapag maraming piraso na ang naipon sa cell na ito).
      if (inputCell.count > 1) {
        const badge = document.createElement("span");

        badge.className = "hotbar-badge";
        badge.textContent = inputCell.count > 99 ? "99+" : inputCell.count;
        cell.appendChild(badge);
      }
    }

    // BAGONG: kung may naka-hawak (floatingPickup) na HINDI aktibong
    // dinadrag (nakatigil lang, kagaya ng gawi ng startPointerAction sa
    // hotbar.js) - pinapayagan na rin ngayon ang PLAIN LEFT-CLICK dito
    // (kahit malaking dami/"maraming quantity" ang buong hawak, hindi na
    // kailangang literal na i-drag/i-drop) - kada click, 1 piraso lang
    // ang inilalagay (kaparehong-pareho ng gawi ng hold-drag-drop sa
    // pointerup, hotbar.js), kaya paulit-ulit na puwedeng i-click para
    // dagdagan pa. Kung walang floatingPickup, normal na pag-drag lang
    // (kung may laman) o wala nang epekto (kung bakante).
    cell.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      if (
        typeof floatingPickup !== "undefined" &&
        floatingPickup &&
        (typeof dragState === "undefined" || !dragState || !dragState.activated)
      ) {
        event.preventDefault();

        const beforeCell = craftInputs[i];
        const beforeCount = beforeCell ? beforeCell.count : 0;

        if (typeof placeCraftIngredient === "function") {
          placeCraftIngredient(i, floatingPickup.itemId);
        }

        const afterCell = craftInputs[i];
        const afterCount = afterCell ? afterCell.count : 0;

        // Tumaas lang ang bilang sa cell kung TALAGANG natanggap ito
        // (tama ang item type, may stock pa, hindi puno ang stack) -
        // dito lang babawasan ang hawak, para hindi "mawala" nang walang
        // dahilan ang isang piraso kapag tinanggihan ng cell.
        if (afterCount > beforeCount) {
          floatingPickup.count--;

          if (floatingPickup.count <= 0 && typeof clearFloatingPickupState === "function") {
            clearFloatingPickupState();
          } else if (typeof updateFloatingGhostContent === "function") {
            updateFloatingGhostContent();
          }
        }

        if (typeof syncHotbarUI === "function") syncHotbarUI();
        if (typeof syncBagPanel === "function") syncBagPanel();

        return;
      }

      if (inputCell) startCraftInputDrag(i, inputCell.itemId, event);
    });

    if (!inputCell) {
      // Kapag walang laman ang cell na ito, ipinapakita ang GUIDE/
      // PREVIEW ng napiling recipe sa recipe guide (naka-opacity lang,
      // hindi tunay na ingredient - tingnan ang renderCraftGuide) kung
      // may kailangan dito ayon sa "shape" nito, kung hindi (o walang
      // napiling guide), numero na lang (1-9) - ginagamit ng mga SHAPED
      // recipe (CRAFT_SHAPED_RECIPES) para malinaw kung saang EKSAKTONG
      // cell ilalagay ang bawat ingredient. Tingnan din ang
      // ".hotbar-key" sa hotbar.js/style.css - kaparehong estilo.
      const guideRecipe = isAdvanced ? getSelectedGuideRecipe() : null;
      const ghostIngredient = guideRecipe ? guideRecipe.shape[i] : null;
      const ghostItem = ghostIngredient
        ? BAG_ITEMS.find((entry) => entry.id === ghostIngredient)
        : null;

      if (ghostItem && typeof getItemIconHTML === "function") {
        cell.classList.add("craft-slot-ghost");
        cell.innerHTML = getItemIconHTML(ghostItem);
      } else {
        const key = document.createElement("span");

        key.className = "hotbar-key";
        key.textContent = String(i + 1);
        cell.appendChild(key);
      }
    }

    grid.appendChild(cell);
  }

  outputSlot.innerHTML = "";
  outputSlot.classList.toggle("craft-output-ready", Boolean(craftOutput));

  if (craftOutput) {
    const item = BAG_ITEMS.find((entry) => entry.id === craftOutput.itemId);

    if (item && typeof getItemIconHTML === "function") {
      outputSlot.innerHTML = getItemIconHTML(item);
    }

    const badge = document.createElement("span");

    badge.className = "hotbar-badge";
    badge.textContent = craftOutput.count > 99 ? "99+" : craftOutput.count;
    outputSlot.appendChild(badge);
  }
}

// =========================
// PAG-DRAG PALABAS NG MGA CRAFT SLOT
// =========================
//
// Kaparehong-pareho ng gawi ng startPointerAction (hotbar.js) - iisa
// pa ring dragState/dragGhostEl ang ginagamit (global, hotbar.js) para
// magkatugma ang buong drag system.

function startCraftInputDrag(slotIndex, itemId, event) {
  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return;

  dragState = {
    source: "craft-input",
    itemId,
    fromSlotIndex: slotIndex,
    fromBagPosition: null,
    startX: event.clientX,
    startY: event.clientY,
    // LUMANG paraan (dragGhostEl, hindi floatingPickup) - agad na
    // "activated", walang threshold-gating (tingnan ang
    // "usesFloatEconomy" sa hotbar.js) - kung hindi, palaging matuturing
    // na "click lang" ang pointerup, kahit totoong drag.
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
  .getElementById("craft-output-slot")
  ?.addEventListener("pointerdown", (event) => {
    if (!craftOutput) return;

    const item = BAG_ITEMS.find((entry) => entry.id === craftOutput.itemId);

    if (!item) return;

    dragState = {
      source: "craft-output",
      itemId: craftOutput.itemId,
      fromSlotIndex: null,
      fromBagPosition: null,
      startX: event.clientX,
      startY: event.clientY,
      activated: true, // tingnan ang paliwanag sa startCraftInputDrag sa itaas
    };

    dragGhostEl = document.createElement("div");
    dragGhostEl.id = "hotbar-drag-ghost";
    dragGhostEl.innerHTML = getItemIconHTML(item);
    document.body.appendChild(dragGhostEl);
    moveDragGhost(event.clientX, event.clientY);

    event.preventDefault();
  });

// =========================
// PAGLALAGAY NG "CRAFTER" SA MUNDO (parang crafting table sa Minecraft)
// =========================

let placedCrafters = []; // { world, col, row, id }
let placedCrafterIdCounter = 0;

// Naka-highlight (naka-select - selectedInventorySlot sa hotbar.js) ba
// ngayon ang isang hotbar slot na may Crafter? Kapareho ng
// isCarrotSlotSelected (dig.js) - ito na ang batayan kung "handa nang
// ilagay sa mundo" sa pamamagitan ng left-click sa isang ground tile
// (tingnan ang mousedown listener sa dig.js), sa halip na i-drag papunta
// sa canvas.
function isCrafterSlotSelected() {
  return (
    typeof selectedInventorySlot !== "undefined" &&
    selectedInventorySlot !== null &&
    typeof pinnedSlots !== "undefined" &&
    pinnedSlots[selectedInventorySlot] === "crafter"
  );
}

// Tinatawag ng dig.js (mousedown, habang naka-highlight ang Crafter sa
// isang hotbar slot - tingnan ang isCrafterSlotSelected) papunta sa
// EKSAKTONG tinurong tile, o ng dropItemFromSlotIntoWorld (ground-items.js,
// lumang paraan - i-drag papunta sa canvas, gumagamit ng "facing tile"
// kapag walang col/row na ibinigay). HINDI ito basta nakalapag na
// madadampot, PERMANENTENG BAGAY ito sa mundo (parang bahay/puno) na
// puwedeng i-click para buksan ang "advanced" crafting panel (tingnan
// ang getPlacedCrafterAt sa dig.js).
function placeCrafterInWorld(col, row) {
  if (craftersCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  placedCrafters.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedCrafterIdCounter++,
  });

  craftersCollected--;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Crafter sa eksaktong cell na ito (sa kasalukuyang
// mundo)? Tingnan ang paggamit nito sa dig.js (mousedown listener).
function getPlacedCrafterAt(col, row) {
  return (
    placedCrafters.find(
      (crafter) =>
        crafter.world === currentWorld &&
        crafter.col === col &&
        crafter.row === row,
    ) || null
  );
}

// I-RIGHT-CLICK ang isang naka-lagay na Crafter sa mundo (tingnan ang
// contextmenu listener sa dig.js) para "sirain"/tanggalin ito bilang
// PERMANENTENG bagay - hindi ito bumabalik agad sa craftersCollected/
// hotbar (1-9), kung hindi ay lumalabas muna bilang ORDINARYONG
// FLOATING ground item (kaparehong-pareho ng ibang ani/drop - tingnan
// ang spawnGroundItem sa ground-items.js), kaya kailangan pa itong
// damputin (awtomatikong "kamay" sa dig.js) bago talagang mapunta sa
// bag/inventory.
function breakPlacedCrafter(crafter) {
  const index = placedCrafters.indexOf(crafter);

  if (index === -1) return;

  placedCrafters.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(crafter.col, crafter.row, "crafter", 1);
  }

  if (typeof spawnDigEffect === "function") {
    spawnDigEffect(crafter.col, crafter.row);
  }
}

// =========================
// COLLISION NG NAKA-LAGAY NA CRAFTER
// =========================
//
// Kaparehong-pareho ng pattern ng oldman/pig (getOldManCollisionBox sa
// decor.js) - "LIVE" na collision (hindi bahagi ng static na
// `collisions` array, dahil hindi ito naka-tali sa isang partikular na
// pag-load ng mundo - nananatili ito sa buong laro/session). Tinatawag
// ito ng canMoveTo (collisions.js, player) AT ng canFeetMoveTo
// (decor.js, oldman/pig) - totoong hadlang na ngayon ang naka-lagay na
// Crafter, hindi na madadaanan.
const CRAFTER_COLLISION_SIZE = TILE_SIZE * 0.85;

function getPlacedCrafterCollisionBoxes() {
  if (placedCrafters.length === 0) return [];

  const inset = (TILE_SIZE - CRAFTER_COLLISION_SIZE) / 2;

  return placedCrafters
    .filter((crafter) => crafter.world === currentWorld)
    .map((crafter) => ({
      x: crafter.col * TILE_SIZE + inset,
      y: crafter.row * TILE_SIZE + inset,
      width: CRAFTER_COLLISION_SIZE,
      height: CRAFTER_COLLISION_SIZE,
    }));
}

// Iginuguhit sa PAREHONG layer/oras ng drawGroundItems (draw.js) - world
// space, sa ilalim ng player.
function drawPlacedCrafters() {
  if (placedCrafters.length === 0) return;

  const here = placedCrafters.filter(
    (crafter) => crafter.world === currentWorld,
  );

  if (here.length === 0) return;

  ctx.save();
  ctx.font = TILE_SIZE * 0.8 + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const crafter of here) {
    ctx.fillText(
      "🛠️",
      crafter.col * TILE_SIZE + TILE_SIZE / 2,
      crafter.row * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  ctx.restore();
}

function breakPlacedStove(craft) {
  const index = placedCrafters.indexOf(craft);

  if (index === -1) return;

  placedCrafters.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(craft.col, craft.row, "craft", 1);
  }

  if (typeof spawnDigEffect === "function") {
    spawnDigEffect(craft.col, craft.row);
  }
}
