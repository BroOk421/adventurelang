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

// AYOS (hiling ng user): "kapag nag lagay ako ng 4 woods kusang
// lumilitaw sa result slot yung crafter dapat hindi kasi dapat ma fill
// yung tamang slots niya bago makagawa" - dating SHAPELESS ito
// (basta 4 total wood kahit saan/kahit anong cell/cells, kahit
// 4-in-1-cell), kaya kusang "gumagana" agad kahit hindi pa TALAGANG
// napuno ang BAWAT isa sa 4 slot ng "basic" (2x2) grid. Ngayon, SHAPED
// na rin ito (parang Minecraft: kailangang MAY laman ang BAWAT isa sa
// 4 slot) - inilipat na ito papunta sa CRAFT_SHAPED_RECIPES sa ibaba
// (4-cell na "shape", tumutugma sa laki ng "basic" grid - tingnan ang
// findMatchingShapedRecipe). WALA nang laman ang CRAFT_RECIPES (walang
// SHAPELESS recipe sa ngayon) - naiwan pa rin ang buong SHAPELESS na
// sistema (findMatchingCraftRecipe, atbp.) sakaling magdagdag pa ng
// bago balang araw.
const CRAFT_RECIPES = [];

// SHAPED na recipe - MAHALAGA ang EKSAKTONG posisyon. Ang "shape" ay
// tumutugma sa KASALUKUYANG laki ng grid nito: 4 entry = "basic" (2x2),
// 9 entry = "advanced" (3x3) - tingnan ang findMatchingShapedRecipe.
// Para sa 9-entry (advanced), (null = dapat bakante ang cell na iyon):
//
//   0 1 2      (ipinapakita bilang 1 2 3 sa UI)
//   3 4 5      (4 5 6)
//   6 7 8      (7 8 9)
const CRAFT_SHAPED_RECIPES = [
  {
    // W W    ("basic" 2x2 - kailangang MAY laman ang LAHAT ng 4 slot,
    // W W     hindi puwedeng "dumpin" nalang lahat sa iisang cell)
    shape: ["wood", "wood", "wood", "wood"],
    result: { itemId: "crafter", count: 1 },
  },
  // AYOS (BUG FIX, hiling ng user: "2x2 lang dapat kaya din niyan mag
  // lagay ng charcoal at torch bukod dun sa crafter") - dating 2 lang
  // ang shape dito (parehong "horizontal", parehong charcoal-muna-bago-
  // wood), kaya kung ibang ayos ang pagkakalagay (hal. patayo/vertical,
  // o baligtad ang pagkakasunod), "hindi tumutugma" kahit tama naman
  // ang 2 sangkap - kaya parang "may bug" kahit tama na ang totoong
  // ingredients. Idinagdag na ngayon ang LAHAT ng posibleng ayos sa
  // isang 2x2 grid (dalawang patayo, dalawang pahalang, PAREHONG
  // pagkakasunod - charcoal-muna o wood-muna) - basta MAGKATABI (hindi
  // pahilis/diagonal) ang dalawang cell, dapat gumana:
  //   C W      . .      C .      . C
  //   . .      C W      W .      . W
  {
    shape: ["charcoal", "wood", null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: ["wood", "charcoal", null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, "charcoal", "wood"],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, "wood", "charcoal"],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: ["charcoal", null, "wood", null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: ["wood", null, "charcoal", null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, "charcoal", null, "wood"],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, "wood", null, "charcoal"],
    result: { itemId: "torch", count: 1 },
  },
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
    // BAGO (hiling ng user): "sa crafter naman yung pattern niya is
    // 1,5,3 stones 7,9 wood" - slot 1/5/3 = stone, slot 7/9 = wood.
    // S . S
    // . S .
    // W . W
    shape: ["stone", null, "stone", null, "stone", null, "wood", null, "wood"],
    result: { itemId: "cutter", count: 1 },
  },
  {
    shape: ["charcoal", null, null, "wood", null, null, null, null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, "charcoal", null, null, "wood", null, null, null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, "charcoal", null, null, "wood", null, null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, null, "charcoal", null, null, "wood", null, null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, null, null, "charcoal", null, null, "wood", null],
    result: { itemId: "torch", count: 1 },
  },
  {
    shape: [null, null, null, null, "charcoal", null, "charcoal", null, "wood"],
    result: { itemId: "torch", count: 1 },
  },
  {
    // . C .
    // . W .
    // . W .
    //
    // BAGONG SHAPE (hiling ng user): "lamp: 2 slot charcoal, 5 slot
    // wood, 8 slot wood" - ito na ngayon ang shape ng "Light"/"Lamp"
    // (dating shapeless lang - wood 2 + stone 1, CRAFT_RECIPES) -
    // SHAPED na ito ngayon (parang torch, pero may dagdag na wood sa
    // cell 8), kaya "advanced" (3x3) mode lang ito magagawa.
    shape: [null, "charcoal", null, null, "wood", null, null, "wood", null],
    result: { itemId: "light", count: 1 },
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
  {
    // W W W    (hiling ng user: "yung sa bed 123 slots wool at
    // S S S     nabibili dun kay oldman 456 slots silk nabibili din
    // O O O     kay oldman 789 slots wood")
    shape: [
      "wool",
      "wool",
      "wool",
      "silk",
      "silk",
      "silk",
      "wood",
      "wood",
      "wood",
    ],
    result: { itemId: "bed", count: 1 },
  },
  {
    // I I I    (hiling ng user: "sa refrigerator naman is dapat iron e
    // I . I     12346789 slots yan puro iron" - lahat ng 8 slot sa
    // I I I     paligid ay iron, bakante lang ang gitna, slot 5)
    shape: [
      "iron",
      "iron",
      "iron",
      "iron",
      null,
      "iron",
      "iron",
      "iron",
      "iron",
    ],
    result: { itemId: "refrigerator", count: 1 },
  },
];

// Listahan ng mga item na ipinapakita sa recipe guide (dead space sa
// ilalim ng #crafter-dock - tingnan ang renderCraftGuide). Lahat ng ito
// ay SHAPED recipe (CRAFT_SHAPED_RECIPES), kaya "advanced" (3x3) mode
// lang gumagana ang guide/preview nito.
//
// BAGO (hiling ng user): "wala pa sa list ng craftable list yung lamp" -
// idinagdag na ang "light" (Lamp) - SHAPED recipe na rin ito ngayon
// (dating shapeless lang, hindi kasama dito), kaya puwede na siyang
// lumabas sa guide.
const CRAFT_GUIDE_ITEMS = [
  "pickaxe",
  "axe",
  "rake",
  "cutter",
  "sword",
  "torch",
  "light",
  "stove",
  "bed",
  "refrigerator",
];

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

// =========================
// BAGONG MATERIAL PARA SA BED/REFRIGERATOR RECIPE (hiling ng user)
// =========================
//
// "wool"/"silk" - parehong "countable" na crafting material,
// kaparehong pattern ng craftersCollected sa itaas - NABIBILI kay
// Oldman (OLDMAN_SHOP_ITEMS, decor.js), hindi (sa ngayon) makukuha sa
// paraan ng paghukay/pagputol.
let woolCollected = 0;
let silkCollected = 0;

// "iron" - kaparehong-pareho ng gawi ng wool/silk sa itaas
// ("countable" na crafting material), PERO HINDI muna ito nabibili kay
// Oldman - hiling ng user, magmumula ito sa PAGMIMINA ng bato sa isang
// BAGONG "cave" na mundo (balang araw pang gagawin, "cave map para sa
// mga minerals" - susunod na hiling). Idineklara na muna dito ang
// counter/BAG_ITEMS entry nito (tingnan ang hotbar.js) para gumana na
// AGAD ang "refrigerator" recipe sa ibaba - kapag gumawa na ng cave
// map balang araw, doon na lang idadagdag ang paraan ng PAGKUHA ng
// iron (hal. collectIron(), kaparehong pattern ng collectWood/
// collectStone sa resources.js) - hindi na kailangang galawin pa ang
// recipe/BAG_ITEMS entry nito.
let ironCollected = 0;

// "refrigerator" - bagong craftable na item (BAGO, hiling ng user: "add
// ka pala bed sa crafter tyaka refrigerator") - kaparehong-pareho ng
// gawi ng "bag" (hotbar.js): simpleng "countable" na stock sa bag/
// inventory (walang world-placement pa - hal. bed/crafter/stove - sa
// ngayon, dahil hindi pa ito hiniling; puwedeng idagdag balang araw
// kung gusto).
let refrigeratorCollected = 0;

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

// SHAPED recipe - EKSAKTONG posisyon ang sinusukat, kaya kailangang
// TUMUGMA ang KASALUKUYANG laki ng grid (craftInputs.length) sa
// bilang ng cell ng "shape" ng recipe (4 = "basic"/2x2, 9 =
// "advanced"/3x3) - hindi na hard-coded sa "advanced" lang (AYOS,
// hiling ng user: dapat SHAPED/may tamang slot din ang Crafter recipe
// sa "basic" 2x2 grid, tingnan ang CRAFT_SHAPED_RECIPES sa itaas).
function findMatchingShapedRecipe() {
  for (const recipe of CRAFT_SHAPED_RECIPES) {
    if (craftInputs.length !== recipe.shape.length) continue;

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

  // AYOS (BUG FIX): dating basta ".find()" lang gamit ang result.itemId
  // - pero DALAWA (o higit pa) na ngayon ang recipe entry na may
  // PAREHONG result (hal. "torch" - meron na ngayong 2x2 AT 3x3 na
  // bersyon), kaya laging ang UNANG match (ang 2x2) ang nakukuha kahit
  // "advanced" (3x3/9-cell) ang bukas na grid - resulta, sirang/maling
  // preview/ghost ang lumalabas sa guide kapag torch. Idinagdag ang
  // pagsuri sa shape.length para tumugma talaga sa KASALUKUYANG laki
  // ng grid (craftInputs.length).
  return (
    CRAFT_SHAPED_RECIPES.find(
      (recipe) =>
        recipe.result.itemId === craftGuideRecipeId &&
        recipe.shape.length === craftInputs.length,
    ) || null
  );
}

// BAGO (hiling ng user): "gawin madali/automatic ang paglalagay ng
// items sa tamang slot (1-9) kapag na-click ang isang craftable item sa
// guide". Sinusubukang punan ang BAWAT required cell ng shape ng recipe
// (recipe.shape[i]) gamit ang AKTWAL na item mula sa stock (parehong
// mekanismo ng placeCraftIngredient - kaya nababawas talaga ang stock,
// hindi lang ghost/preview). Mga tinatakasan (SKIP):
//   - cell na WALANG kailangan doon (null sa shape)
//   - cell na may laman na ng TAMANG item (huwag nang idagdag pa,
//     iwan kung ano man ang laman - baka gusto pa ng manlalaro ang
//     dami nito para sa batch crafting)
//   - cell na may laman ng IBANG item (huwag idisturbo/palitan -
//     kailangan pang alisin ito manually bago mapalitan)
// Kung walang (o kulang) stock ang isang required item, basta
// mananatiling bakante ang cell na iyon - ipapakita na lang bilang
// "missing" na ghost (pulang border, tingnan ang syncCraftPanel).
function autoFillGuideRecipe(itemId) {
  // AYOS (BUG FIX): dating basta ".find()" gamit ang result.itemId lang
  // (tingnan ang parehong bug sa getSelectedGuideRecipe sa itaas) - kaya
  // "torch" (may 2x2 AT 3x3 na bersyon na ngayon) ay laging nakukuha
  // ang 2x2 shape (ang UNANG entry sa CRAFT_SHAPED_RECIPES), kahit
  // "advanced" (9-cell) ang bukas na grid - resulta, hindi na-a-autofill
  // ang torch sa crafter (3x3) dahil hindi tumutugma ang shape.length
  // (4) sa craftInputs.length (9). Idinagdag na rin dito ang parehong
  // pagsuri sa shape.length (hindi lang basta result.itemId).
  const recipe = CRAFT_SHAPED_RECIPES.find(
    (entry) =>
      entry.result.itemId === itemId &&
      entry.shape.length === craftInputs.length,
  );

  if (!recipe) return;

  recipe.shape.forEach((expected, i) => {
    if (!expected) return;

    const cell = craftInputs[i];

    if (cell && cell.itemId === expected) return; // tama na, may laman na
    if (cell) return; // may ibang laman - huwag idisturbo

    placeCraftIngredient(i, expected, 1);
  });
}

// AYOS (hiling ng user): "di nag rereset yung sa pattern slots ... kapag
// nag change ako ng item is kung anung pattern niya yun yung lalabas" -
// dating iniiwan/hindi nadidisturbo ang laman ng mga cell kapag
// lumipat ng piniling guide recipe (tingnan ang autoFillGuideRecipe sa
// itaas - "may ibang laman - huwag idisturbo") - kaya kung may naiwang
// ingredient mula sa DATING pattern na hindi bahagi ng BAGONG pattern,
// naharangan/naka-block ang mga cell na iyon (hindi na maaaring ma-
// autofill ng bagong item). Ngayon, sa SANDALING magpalit (o mag-
// deselect) ng guide recipe, IBINABALIK muna sa stock ang BUONG laman
// ng LAHAT ng input cell (parang closeCraftPanel) bago ilapat ang
// bagong pattern - kaya laging "malinis"/fresh simula ang bawat pagpili
// ng ibang craftable item.
function resetCraftInputs() {
  for (let i = 0; i < craftInputs.length; i++) {
    const cell = craftInputs[i];

    if (!cell) continue;

    refundCraftItemAmount(cell.itemId, cell.count);
    craftInputs[i] = null;
  }

  craftOutput = null;
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
      const wasSelected = craftGuideRecipeId === itemId;

      craftGuideRecipeId = wasSelected ? null : itemId;

      // AYOS (hiling ng user): laging i-RESET (ibalik sa stock) muna
      // ang BUONG laman ng mga input cell BAWAT pagpili/pagbabago ng
      // guide recipe (kasama na ang pag-deselect) - tingnan ang
      // resetCraftInputs sa itaas - bago ilapat (kung mayroon man) ang
      // BAGONG pattern, para laging tugma sa TALAGANG kasalukuyang
      // piniling craftable item ang laman ng 1-9 grid, hindi naiiwan
      // ang laman ng dating pattern.
      resetCraftInputs();

      // BAGO (hiling ng user): "kapag na-click yung isang craftable item
      // is dapat automatic na malalagay yung mga item sa tamang slot
      // (1-9) kung meron namang stock" - sa SANDALING PINILI (hindi
      // deselect) ang isang guide icon, subukan agad na AWTOMATIKONG
      // ilagay ang aktwal na ingredients (mula sa stock/bag) sa bawat
      // required cell ng shape nito - tingnan ang autoFillGuideRecipe
      // sa ibaba. Kung kulang/walang stock sa isang partikular na cell,
      // mananatili itong bakante (ipapakita na lang bilang "missing"
      // na ghost - pulang 1px na border - tingnan ang syncCraftPanel).
      if (!wasSelected) autoFillGuideRecipe(itemId);

      updateCraftOutputFromInputs();
      syncCraftPanel();

      if (typeof syncHotbarUI === "function") syncHotbarUI();
    });

    iconsEl.appendChild(btn);
  }
}

// Tinatawag pagkatapos ng bawat pagbabago sa craftInputs. SHAPED muna
// ang sinusubukan, tapos SHAPELESS.
//
// AYOS (BUG FIX #3, hiling ng user): "gusto ko lang ipafix yung sa
// crafter na kapag lumabas na yung result sa slot is dapat hindi
// mawawala yung nasa slots pattern kapag na drag ko na sa mismong
// inventory tsaka lang dapat mawawala para if ever na change mind na
// magbago ng pattern o i-build is magagamit ulit yung nasa pattern
// slot na item kung di niya gusto yung item result" - dating
// KINOKONSUMO na agad (consumeShapedRecipeInputs/
// consumeShapelessRecipeInputs) ang mga ingredient sa SANDALING
// tumugma ang pattern - kaya kahit hindi pa na-drag palabas ang
// resulta papunta sa bag, "nawawala" na agad ang laman ng mga input
// cell (naka-eksena pa lang PREVIEW ang laman ng output slot, pero
// tapos na talaga ang "gawa"). Ngayon, ito ay PREVIEW/COMPUTED LANG -
// PANANATILIHIN ang buong laman ng bawat input cell (HINDI kinokonsumo
// dito), kaya kahit magbago pa ng isip ang manlalaro (halimbawa ibang
// recipe/shape na ang gusto, o gusto niyang bawiin ang ingredients),
// buo pa rin ang mga ito - magagamit/matatanggal pa. Saka pa lang
// TALAGANG kinokonsumo ang mga ingredient (tingnan ang
// collectCraftOutput sa ibaba) sa SANDALING i-drag/kunin ang resulta
// papunta sa bag/hotbar.
function updateCraftOutputFromInputs() {
  const shapedRecipe = findMatchingShapedRecipe();

  if (shapedRecipe) {
    const multiplier = getShapedRecipeMultiplier(shapedRecipe);

    craftOutput =
      multiplier > 0
        ? {
            itemId: shapedRecipe.result.itemId,
            count: shapedRecipe.result.count * multiplier,
          }
        : null;

    return;
  }

  const recipe = findMatchingCraftRecipe();

  craftOutput = recipe
    ? { itemId: recipe.result.itemId, count: recipe.result.count }
    : null;
}

// SHAPED: 1 lang ang kailangan bawat "required" na cell (walang
// bilang/quantity ang shape mismo) - PERO (AYOS/BUG FIX, hiling ng
// user: "kung ilan yung item halimbawa wood is 99 so dapat malagay
// dun is 99 ... tapos result dapat 99 din") - kung MARAMI pa ang
// naipon sa bawat kinakailangang cell (hal. 99 wood/stone/charcoal),
// dapat silang LAHAT magamit sa ISANG pag-craft (batch), hindi 1
// piraso lang kada beses. Tingnan ang getShapedRecipeMultiplier sa
// ibaba - doon kinukuha kung ilang beses puwedeng ma-craft ang recipe
// gamit ang KASALUKUYANG laman ng mga required cell (ang PINAKAMALIIT
// na count sa kanila - hal. kung 99 ang wood pero 5 lang ang stone sa
// isang recipe na parehong kailangan, 5 lang ang magiging multiplier).
function consumeShapedRecipeInputs(recipe, multiplier) {
  recipe.shape.forEach((expected, i) => {
    if (!expected) return;

    const cell = craftInputs[i];

    if (!cell) return;

    cell.count -= multiplier;

    if (cell.count <= 0) craftInputs[i] = null;
  });
}

// Ilang BESES puwedeng ma-craft ang isang SHAPED recipe ngayon dayon,
// base sa PINAKAMALIIT na available count sa lahat ng required cell
// nito (tingnan ang comment sa itaas). 0 kung may kulang/walang laman
// (hindi dapat mangyari kung tumugma na ang findMatchingShapedRecipe,
// pero sinusuri pa rin bilang safety net).
function getShapedRecipeMultiplier(recipe) {
  let multiplier = Infinity;

  recipe.shape.forEach((expected, i) => {
    if (!expected) return;

    const cell = craftInputs[i];
    const available = cell ? cell.count : 0;

    multiplier = Math.min(multiplier, available);
  });

  return Number.isFinite(multiplier) ? multiplier : 0;
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
  // AYOS (hiling ng user: "add ka pala bed sa crafter tyaka
  // refrigerator") - BUG na nahanap sa pagte-test: dating WALA dito ang
  // bagong crafting material (wool/silk/iron) - kaya kapag inilalagay
  // ang mga ito sa isang craft input cell (placeCraftIngredient, tawag
  // nito ito), TALAGANG WALANG NABABAWAS sa woolCollected/silkCollected/
  // ironCollected (walang tumutugmang "if" branch dito dati) - resulta,
  // "duplicate" ang materyal: nasa craft grid na ito PERO buo pa rin
  // ang laman ng bag/inventory (parang libre na lang, walang nagastos).
  // Idinagdag dito ang tatlong ito.
  else if (itemId === "wool") woolCollected -= amount;
  else if (itemId === "silk") silkCollected -= amount;
  else if (itemId === "iron") ironCollected -= amount;
}

// AYOS (hiling ng user): "dapat babalik sa slot niya na may memory ba
// yun na old slots niya" - dating basta consumeCraftItemAmount(itemId,
// -amount) lang ito (direktang pagdagdag sa RAW/generic na counter -
// hal. woodCollected++) - kaya kahit naka-PIN pa noon sa isang partikular
// na hotbar slot (o naka-split sa isang partikular na bag cell) ang
// pinagmulan ng ingredient bago ito nailagay sa crafter, "nawawala" ang
// bakas na iyon pagkatapos i-refund - basta na lang lumalabas/dumadagdag
// sa GENERIC/unassigned na bag pool (posibleng ibang cell na ito
// makikita, hindi na sa dating pinagmulan). Ngayon, gamit na ang
// PAREHONG "routing" mechanism ng ibang bahagi ng laro (kaparehong-
// pareho ng collectGroundItem sa ground-items.js AT collectSmeltOutput
// sa stove.js): unang idinagdag sa RAW counter (adjustGlobalItemCount,
// hotbar.js), TAPOS "ino-route" (routeCollectedItemIncrease) - kung
// may KASALUKUYANG naka-pin na hotbar slot O naka-split na bag cell
// ang item type na ito, DOON muna idinagdag/"bumalik" ang bilang
// (parang naibalik sa "dating slot" nito), sa halip na basta sa
// generic/unassigned pool - kung wala namang ganoon, doon pa rin sa
// generic pool bumabagsak (walang pagbabago sa gawi kung walang
// tugmang pinned/split slot).
function refundCraftItemAmount(itemId, amount) {
  if (amount <= 0) return;

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, amount);
  } else {
    // Fallback (hal. kung sakaling hindi pa naka-load ang hotbar.js) -
    // dating gawi, generic RAW counter lang.
    consumeCraftItemAmount(itemId, -amount);
  }

  if (typeof routeCollectedItemIncrease === "function") {
    routeCollectedItemIncrease(itemId, amount);
  }
}

// =========================
// PAGLALAGAY/PAG-ALIS NG INGREDIENTS
// =========================

// Tinatawag ng hotbar.js (pointerup, DRAG-AND-DROP ng BUONG hawak) at
// ng craft.js mismo (pointerdown sa cell, PLAIN CLICK - 1 lang laging
// hawak na `amount` doon) kapag maglalagay ng ingredient sa isang craft
// input cell - PUWEDE nang MARAMING piraso kada cell (dating isa lang):
// kung bakante ang cell, gumagawa ng bagong stack; kung may laman na
// PAREHONG item, dinadagdagan lang ang count (hanggang MAX_CRAFT_STACK);
// kung IBANG item ang laman, tinatanggihan (kailangan pang alisin muna).
//
// AYOS (hiling ng user): "yung slots sa crafter is di nalalagyan ng 99
// woods... kung yung woods ay more than one pwede siya madrag to slots
// 1-9" - dating "amount" ay LAGING 1 lang PER CALL kahit gaano karami
// ang HAWAK (floatingPickup) - kaya kahit i-drag mo ang BUONG 99 wood,
// 1 piraso lang ang naiilagay, ang natitirang 98 ay bumabalik sa bag.
// Ngayon, TUMATANGGAP na ng `amount` parameter (default 1, para hindi
// masira ang dating "plain click = 1 piraso lang" na gawi) - kapag
// DRAG-AND-DROP (hotbar.js), IPINAPASA na ang BUONG floatingPickup.count
// dito, kaya kung KASYA (base sa MAX_CRAFT_STACK at sa TALAGANG stock),
// BUONG stack ang naiilagay sa ISANG paglagay lang - kaya kung 99 wood +
// 99 charcoal, agad na 99 din ang resulta (torch, atbp. - tingnan ang
// getShapedRecipeMultiplier, umiiral na ito). Ibinabalik ang AKTWAL na
// bilang na TALAGANG naiLAGAY (0 kung tinanggihan/walang stock) - dito
// bumabatay ang caller (hotbar.js) kung gaano babawasan ang hawak.
function placeCraftIngredient(slotIndex, itemId, amount = 1) {
  const cell = craftInputs[slotIndex];

  if (cell && cell.itemId !== itemId) return 0; // ibang item na - alisin muna
  if (cell && cell.count >= MAX_CRAFT_STACK) return 0; // puno na ang stack dito

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return 0;

  const spaceLeft = MAX_CRAFT_STACK - (cell ? cell.count : 0);
  const stockAvailable = item.getCount();
  const placedAmount = Math.max(0, Math.min(amount, spaceLeft, stockAvailable));

  if (placedAmount <= 0) return 0;

  consumeCraftItemAmount(itemId, placedAmount);

  if (cell) cell.count += placedAmount;
  else craftInputs[slotIndex] = { itemId, count: placedAmount };

  updateCraftOutputFromInputs();
  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  return placedAmount;
}

// Tinatawag kapag ni-drag PALABAS (pabalik sa bag) ang laman ng isang
// craft input cell - ibinabalik ang BUONG count ng cell (hindi lang 1) -
// isang cell ay isang buong "stack" na ngayon, hindi na isang piraso.
function removeCraftIngredient(slotIndex) {
  const cell = craftInputs[slotIndex];

  if (!cell) return;

  refundCraftItemAmount(cell.itemId, cell.count);
  craftInputs[slotIndex] = null;

  // AYOS (hiling ng user): dahil hindi na "pre-consumed" ang mga input
  // cell (tingnan ang updateCraftOutputFromInputs sa itaas), kailangang
  // i-refresh ang preview ng output kada may inaalis na ingredient -
  // baka nasira na ang pattern (dapat mawala/mag-iba ang naka-preview
  // na resulta), o baka may IBANG tugmang recipe pa gamit ang natira.
  updateCraftOutputFromInputs();

  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatawag kapag ni-drag PALABAS (papunta sa bag) ang laman ng OUTPUT
// slot - DITO pa lang talaga TALAGANG kinokonsumo ang mga ingredient sa
// pattern (tingnan ang AYOS sa updateCraftOutputFromInputs sa itaas -
// PREVIEW/COMPUTED lang ang craftOutput bago dito, hindi pa
// "ginagastos" ang mga input cell) AT saka pa lang naidaragdag sa stock
// ang resulta. Hinahanap ulit dito ang tumutugmang recipe (dapat
// pareho pa rin sa nag-produce ng kasalukuyang craftOutput, dahil hindi
// pa ito nagbabago mula nang huling na-preview) para malaman EKSAKTO
// kung anong mga cell/bilang ang dapat bawasan.
function collectCraftOutput() {
  if (!craftOutput) return;

  const shapedRecipe = findMatchingShapedRecipe();

  if (shapedRecipe) {
    const multiplier = getShapedRecipeMultiplier(shapedRecipe);

    if (multiplier > 0) consumeShapedRecipeInputs(shapedRecipe, multiplier);
  } else {
    const recipe = findMatchingCraftRecipe();

    if (recipe) consumeShapelessRecipeInputs(recipe);
  }

  if (craftOutput.itemId === "crafter") craftersCollected += craftOutput.count;
  else if (craftOutput.itemId === "light") lightsCollected += craftOutput.count;
  // BAGO (hiling ng user: "add ka pala bed sa crafter tyaka
  // refrigerator") - parehong "countable" na stock lang (kaparehong
  // pattern ng "crafter"/"light" sa itaas).
  else if (craftOutput.itemId === "bed") {
    if (typeof bedsCollected !== "undefined")
      bedsCollected += craftOutput.count;
  } else if (craftOutput.itemId === "refrigerator") {
    if (typeof refrigeratorCollected !== "undefined")
      refrigeratorCollected += craftOutput.count;
  }
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
  else if (craftOutput.itemId === "pickaxe") {
    pickaxeUnlocked = true;
    // AYOS (hiling ng user): bagong-crafted na tool = FRESH/BUONG
    // durability (50) - tingnan ang TOOL_DURABILITY_MAX (dig.js).
    if (typeof pickaxeDurability !== "undefined")
      pickaxeDurability =
        typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;
  } else if (craftOutput.itemId === "rake") {
    rakeUnlocked = true;
    if (typeof rakeDurability !== "undefined")
      rakeDurability =
        typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;
  } else if (craftOutput.itemId === "axe") {
    axeUnlocked = true;
    if (typeof axeDurability !== "undefined")
      axeDurability =
        typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;
  } else if (craftOutput.itemId === "cutter") {
    if (typeof cutterUnlocked !== "undefined") cutterUnlocked = true;
    if (typeof cutterDurability !== "undefined")
      cutterDurability =
        typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;
  } else if (craftOutput.itemId === "sword") swordUnlocked = true;
  else if (craftOutput.itemId === "torch")
    torchesCollected += craftOutput.count;
  else if (craftOutput.itemId === "stove") stovesCollected += craftOutput.count;

  craftOutput = null;

  // AYOS: baka may natirang sapat pa ring ingredients (hal. malaking
  // stack, 99 wood pero 5 lang stone - 5 lang nagamit, may natitira pang
  // 94 wood) para sa parehong recipe - agad na muling i-preview kung
  // meron (hindi na kailangang mag-alis-lagay pa ulit ng ingredient).
  updateCraftOutputFromInputs();

  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// TOGGLE/PAGBUBUKAS NG PANEL
// =========================

// AYOS (hiling ng user, kaparehong-pareho ng ginawang ayos sa
// updateCraftOutputFromInputs sa itaas): "kapag biglang nasara yung
// crafter or napindot yung 'B' is babalik yung item na naiwan dun sa
// crafter" - dati, kapag "nasara" (bumaba/nagtago) ang panel (basta
// craftPanelOpen === false, o kaya naman VISUALLY nakatago na lang ito
// kasabay ng #bag-panel kapag pinindot ang 'B'/'b' - tingnan ang
// toggleBagPanel sa hotbar.js), NANANATILI pa rin ang laman ng mga
// craftInputs (at nakabawas pa rin sa stock) kahit tuluyan nang
// nakatago/"naiwan" ito - parang "nawawala"/naka-limbo ang mga
// ingredient (hindi makikita, pero hindi rin nababalik). Ngayon, sa
// SANDALING TALAGANG isinara ang panel (dito, sa closeCraftPanel),
// ibinabalik/rine-refund muna ang BUONG laman ng bawat pattern slot
// pabalik sa stock (parang hindi pa naisagawa ang batch na iyon -
// tama lang dahil PREVIEW/COMPUTED lang naman ang craftOutput hangga't
// hindi pa ito na-drag palabas, tingnan ang updateCraftOutputFromInputs) -
// KASAMA rin dito ang pagsara mismo (dating hiwalay na "if" sa loob ng
// toggleCraftPanel).
function closeCraftPanel() {
  if (!craftPanelOpen) return;

  craftPanelOpen = false;

  for (let i = 0; i < craftInputs.length; i++) {
    const cell = craftInputs[i];

    if (!cell) continue;

    refundCraftItemAmount(cell.itemId, cell.count);
    craftInputs[i] = null;
  }

  // Hindi pa naman "nakuha"/na-drag palabas ang naka-preview na resulta
  // (kung meron man) - kaya wala rin itong dapat maidagdag sa stock,
  // basta nililinis na lang.
  craftOutput = null;

  // Bumabalik sa "basic" (2x2), para laging sariwa ang susunod na
  // pagbukas gamit ang footer icon (hindi naiiwang naka-"advanced"
  // mode kahit wala nang kalapit na Crafter). Nililinis din ang
  // napiling recipe guide/preview (tingnan ang renderCraftGuide).
  craftPanelMode = "basic";
  craftGuideRecipeId = null;

  syncCraftPanel();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

function toggleCraftPanel() {
  if (craftPanelOpen) {
    closeCraftPanel();
    return;
  }

  craftPanelOpen = true;

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

          if (
            floatingPickup.count <= 0 &&
            typeof clearFloatingPickupState === "function"
          ) {
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

        // AYOS (hiling ng user): "kung wala/kulang ang requirement sa
        // slot na ito, gawing pulang 1px na border" - kung nasa GHOST
        // pa rin ang cell na ito (bakante) SA KABILA ng autoFillGuideRecipe
        // (tingnan sa itaas, tinatawag sa SANDALING piliin ang guide),
        // ibig sabihin talagang WALANG (o naubos na ang) stock ng item
        // na kailangan dito - kaya "craft-slot-missing" (pulang border,
        // tingnan ang style.css) - malinaw na senyales na hindi pa
        // makakapag-craft hangga't hindi nakukuha/nadadagdagan ang
        // item na ito.
        const stockAvailable =
          typeof ghostItem.getCount === "function" ? ghostItem.getCount() : 0;

        if (stockAvailable <= 0) cell.classList.add("craft-slot-missing");

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
// BAGO (hiling ng user): "dapat mag select ng tile sa mismong loob ng
// bahay" + "kapag kalahati lang ang 16x16 tile is di pwede malagyan" -
// dating kahit saan/kahit anong tile puwede, ngayon dumaraan muna sa
// isFootprintPlaceable (placement.js): (a) LOOB LANG ng bahay
// (isInsideHouseWorld), (b) LAHAT ng 2 tile ng footprint (PLACEMENT_FOOTPRINTS,
// placement.js) ay dapat LIBRE - kung may kalahating tile lang na
// bakante o may hadlang, WALANG mangyayari (tahimik lang na hindi
// natutuloy ang paglalagay, kaparehong "walang epekto" na gawi ng
// facing check sa Entry #63).
function placeCrafterInWorld(col, row) {
  if (craftersCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  if (
    typeof isFootprintPlaceable === "function" &&
    !isFootprintPlaceable("crafter", tile.col, tile.row)
  ) {
    return;
  }

  placedCrafters.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedCrafterIdCounter++,
  });

  craftersCollected--;

  // AYOS (hiling ng user): kung ITO ang kasalukuyang naka-hold (ulo ng
  // player), "mawawala" na rin ito dito - naibigay/nailagay na kasi
  // (tingnan ang hold.js).
  if (typeof clearHeldItemIfPlaced === "function")
    clearHeldItemIfPlaced("crafter");

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// May naka-lagay bang Crafter dito (sa kasalukuyang mundo)? BAGO: 2
// tile na ang footprint nito (placement.js) - kaya HINDI na simpleng
// col/row equality lang, tinitingnan kung KASAMA ang (col,row) sa
// buong footprint ng bawat naka-lagay na Crafter. Tingnan ang paggamit
// nito sa dig.js (mousedown listener).
function getPlacedCrafterAt(col, row) {
  return (
    placedCrafters.find((crafter) => {
      if (crafter.world !== currentWorld) return false;

      if (typeof getPlacementFootprintCells !== "function") {
        return crafter.col === col && crafter.row === row;
      }

      return getPlacementFootprintCells(
        "crafter",
        crafter.col,
        crafter.row,
      ).some((cell) => cell.col === col && cell.row === row);
    }) || null
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
// BAGO: 2 tile na ngayon ang footprint (placement.js) - ang collision
// box ay sumasakop na sa BUONG bounding box ng 2 tile (getFootprintCollisionBox),
// hindi lang sa unang tile.
function getPlacedCrafterCollisionBoxes() {
  if (placedCrafters.length === 0) return [];

  return placedCrafters
    .filter((crafter) => crafter.world === currentWorld)
    .map((crafter) =>
      typeof getFootprintCollisionBox === "function"
        ? getFootprintCollisionBox("crafter", crafter.col, crafter.row)
        : {
            x: crafter.col * TILE_SIZE,
            y: crafter.row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          },
    );
}

// BAGO (hiling ng user): "ibahin mo itsura ng stove at crafter dapat
// kung ano yung nasa inventory na itsura" - ang ITSURA (world sprite)
// ng naka-lagay na Crafter ay ang MISMONG icon na ginagamit sa bag/
// hotbar (assets/items/crafter.png, BAG_ITEMS - hotbar.js), hindi na
// basta emoji. "Mali yung tile dapat exact 16x16" - iginuguhit ito
// EKSAKTO sa loob ng buong 2-tile na footprint box (2*TILE_SIZE x
// TILE_SIZE, walang overflow/palabas sa grid) - hindi base sa aspect
// ratio ng larawan (puwede itong bahagyang ma-squish, pero laging
// TAMA/EKSAKTO ang pagkakahanay nito sa 16x16 grid).
const CRAFTER_SPRITE_IMAGE = new Image();

CRAFTER_SPRITE_IMAGE.src = "./assets/items/crafter.png";

// Iginuguhit sa PAREHONG layer/oras ng drawGroundItems (draw.js) - world
// space, sa ilalim ng player. BAGO: naka-sentro na sa GITNA ng BUONG
// 2-tile na footprint (hindi lang sa unang tile).
function drawPlacedCrafters() {
  if (placedCrafters.length === 0) return;

  const here = placedCrafters.filter(
    (crafter) => crafter.world === currentWorld,
  );

  if (here.length === 0) return;

  ctx.save();

  // Fallback (emoji) habang hindi pa fully-loaded ang sprite.
  if (
    !CRAFTER_SPRITE_IMAGE.complete ||
    CRAFTER_SPRITE_IMAGE.naturalWidth === 0
  ) {
    ctx.font = TILE_SIZE * 0.9 + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const crafter of here) {
      ctx.fillText(
        "🛠️",
        crafter.col * TILE_SIZE + TILE_SIZE,
        crafter.row * TILE_SIZE + TILE_SIZE / 2,
      );
    }

    ctx.restore();
    return;
  }

  for (const crafter of here) {
    if (typeof drawSpriteFillWidthInBox === "function") {
      drawSpriteFillWidthInBox(
        CRAFTER_SPRITE_IMAGE,
        crafter.col * TILE_SIZE,
        crafter.row * TILE_SIZE,
        TILE_SIZE * 2, // EKSAKTONG 2 tile (32x16) - hindi lalabas sa grid
        TILE_SIZE,
      );
    } else {
      ctx.drawImage(
        CRAFTER_SPRITE_IMAGE,
        crafter.col * TILE_SIZE,
        crafter.row * TILE_SIZE,
        TILE_SIZE * 2,
        TILE_SIZE,
      );
    }
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
