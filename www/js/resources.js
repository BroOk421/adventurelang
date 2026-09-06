// =========================
// RANDOM NA PUNO AT BATO (TREES/STONES)
// =========================
//
// Random na naglalagay ng mga puno at bato kada mundo (outdoor lang) -
// PURONG KWENTA ito mula sa pangalan ng mundo (seeded random, tingnan
// ang seededRandom sa calendar.js), kaya pareho palagi ang mga posisyon
// kahit mag-reload ka. Ang itinatabi lang natin sa localStorage ay kung
// ALIN na ang NA-ANI (harvested) - katulad ng dugTiles sa dig.js.
//
// Pickaxe (Alt+1) - anihin ang bato -> stone.
// Axe (Alt+3)     - anihin ang puno -> wood.
//
// Dalawang larawan kada uri (tree/tree1, rock/rock1), at may kani-
// kaniyang "snow" na bersyon (snowtree/snowtree1, snowrock/snowrock1)
// na ginagamit sa halip kapag umuulan ng niyebe ngayon.

const TREE_COUNT_PER_WORLD = 11;
const STONE_COUNT_PER_WORLD = 20;

// Ilang beses kailangang i-click (axe/pickaxe) bago talaga maani ang
// isang puno/bato - kada click, may shake animation (tingnan ang
// "SHAKE ANIMATION" sa ibaba), hanggang sa huling click na doon lang
// talaga tinatanggal ang node at binibigyan ng ani.
const RESOURCE_REQUIRED_HITS = 6;

// PERMANENTENG "tapos na"/harvested na marka - tingnan ang paliwanag sa
// registerHit() sa ibaba (bug fix: nagbabalik-balik na nakikita ang
// puno depende sa KASALUKUYANG naka-equip na tool). SADYANG ISANG
// MALAKING FIXED NA BILANG ito (hindi `Infinity`) - dahil ang
// `JSON.stringify(Infinity)` ay nagiging `null` (SIRA ang JSON format
// nito), kaya kung `Infinity` ang gagamitin, MABABAWI ito pabalik sa 0
// (treated bilang "wala pang hit") sa sandaling mag-reload/mag-save -
// isang FIXED number na ligtas i-JSON.stringify ang gamit sa halip,
// basta't laging MAS MALAKI ito kaysa sa ANUMANG posibleng
// `getRequiredHitsFor()` na resulta (6 o 10).
const RESOURCE_HARVESTED_SENTINEL = 999999;

// =========================
// AXE (bagong kasangkapan, hiwalay sa pickaxe/kamay/binhi)
// =========================

let axeEquipped = false;

// Kailangan munang i-CRAFT ang axe (tingnan ang CRAFT_SHAPED_RECIPES sa
// craft.js) bago maging equippable - tingnan ang pickaxeUnlocked/
// rakeUnlocked sa dig.js para sa parehong konsepto.
let axeUnlocked = false;
// AYOS (hiling ng user): durability ng axe - tingnan ang paliwanag sa
// TOOL_DURABILITY_MAX/useToolDurability (dig.js).
let axeDurability = 0;

// Tingnan ang pickaxeInInventory/rakeInInventory (dig.js) para sa
// parehong konsepto - "InInventory" = na-craft na, nakikita sa bag,
// PERO hindi pa "na-install" sa tool radial (kailangan pang i-double
// click - equipViaDoubleClick, hotbar.js).
let axeInInventory = false;

function equipAxe() {
  if (!axeUnlocked) return; // kailangan munang i-craft

  // BAGO (hiling ng user): "strictly use the pickaxe, axe and rake
  // only when have bag" - kaparehong-pareho ng ayos sa equipPickaxe/
  // equipRake (dig.js).
  if (typeof bagEquipped !== "undefined" && !bagEquipped) {
    if (typeof showSettingsToast === "function") {
      showSettingsToast("Kailangan mo munang isuot ang bag! 🎒");
    }
    return;
  }

  const wasEquipped = axeEquipped;

  clearAllToolEquips();
  axeEquipped = !wasEquipped;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// CUTTER (bagong kasangkapan - hiling ng user: "1 use lang is
// nawiwipe-out na [ang damo], pero dapat naka-front din yung
// character sa grass" - pang-putol ng damo/grass tuft, 3-tile na
// hanay sa HARAP ng player base sa direksyon niya, tingnan ang
// "PAGPUTOL NG DAMO (CUTTER)" sa grass.js para sa aktwal na mekanismo)
// =========================
//
// AYOS (2nd round, hiling ng user): "sa crafter naman yung pattern
// niya is 1,5,3 stones 7,9 wood" - may crafting recipe na ngayon ito
// (tingnan ang CRAFT_SHAPED_RECIPES, craft.js) - kaya kailangan na
// ring i-CRAFT muna bago maging equippable, PAREHONG-PAREHO na ngayon
// sa pickaxe/rake/axe (unlock + durability), hindi na "laging
// available" tulad ng 1st round.
let cutterEquipped = false;

// Kailangan munang i-CRAFT ang cutter (tingnan ang CRAFT_SHAPED_RECIPES
// sa craft.js) bago maging equippable - tingnan ang axeUnlocked sa
// itaas para sa parehong konsepto.
let cutterUnlocked = false;

// Durability - parehong TOOL_DURABILITY_MAX/useToolDurability (dig.js)
// na ginagamit ng pickaxe/rake/axe.
let cutterDurability = 0;

// Tingnan ang axeInInventory sa itaas para sa konsepto - HINDI na
// aktibong gamit ang landas na ito (diretso nang "Unlocked" ang cutter
// sa collectCraftOutput, craft.js, kaparehong-pareho ng pickaxe/rake/
// axe) - naiwan lang ito para sa BAG_ITEMS entry (hotbar.js), na
// gumagamit nito bilang laging-0 na getCount (hindi na lumalabas sa
// bag/inventory kahit sandali, "less item sa inventory").
let cutterInInventory = false;

function equipCutter() {
  if (!cutterUnlocked) return; // kailangan munang i-craft

  // Parehong "kailangan munang naka-Use ang bag" na patakaran ng ibang
  // working tool (pickaxe/rake/axe) - tingnan ang equipAxe sa itaas.
  if (typeof bagEquipped !== "undefined" && !bagEquipped) {
    if (typeof showSettingsToast === "function") {
      showSettingsToast("Kailangan mo munang isuot ang bag! 🎒");
    }
    return;
  }

  const wasEquipped = cutterEquipped;

  clearAllToolEquips();
  cutterEquipped = !wasEquipped;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// ARROW (bagong kasangkapan - wala pang function ang interaction nito,
// nakalaan lang para sa susunod na paggamit)
// =========================
//
// HINDI ito bahagi ng mutual-exclusivity ng ibang kasangkapan (tingnan
// ang clearAllToolEquips sa dig.js) - "cursor mode" lang ito, kaya
// puwede itong kasabay ng pickaxe/axe/kamay/rake/atbp. Hindi nito
// inaalis ang mga iyon, at hindi rin sila nag-aalis dito - simpleng
// toggle lang, walang epekto sa ibang estado.
let arrowEquipped = false;

function equipArrow() {
  arrowEquipped = !arrowEquipped;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// TORCH (nagbibigay ng liwanag sa paligid ng player sa gabi - tingnan
// ang atmosphere.js para sa aktwal na pagguhit ng liwanag)
// =========================
//
// Nasa LEFT HAND ito (hindi bahagi ng right-hand na working tools -
// tingnan ang clearAllToolEquips sa dig.js), kaya HINDI ito nag-aalis
// ng kasalukuyang naka-equip na tool, at hindi rin ito naaalis ng mga
// iyon - puwede silang kasabay (parehong kamay, magkaibang bagay).
//
// Stackable/countable na item na rin ito (kagaya ng carrot/wood/stone) -
// may sariling bilang (torchesCollected), kaya puwede na ring dumaan sa
// STACK_DUPLICATE_MIN_COUNT na patakaran (hotbar.js). Walang panimulang
// stock - normal na simula ng laro.
let torchesCollected = 0;

let torchEquipped = false;

// Habang naka-equip, "nasusunog" ang torch - 3 minuto lang ang buhay
// nito (TORCH_LIFESPAN_MS), tapos naubos (tingnan ang updateTorchBurn).
// HUMIHINTO (pause) lang ang pag-ubos habang naka-UNEQUIP - hindi ito
// gumagalaw/nababawasan - saka ito IPINAGPAPATULOY (resume) mula sa
// natitira noong huling pagkakataon kapag naka-equip ulit ang PAREHONG
// torch na ito. Bumabalik lang sa buo ang TORCH_LIFESPAN_MS kapag
// talagang bagong torch (naubos na ang huli, o unang pagkakataon).
const TORCH_LIFESPAN_MS = 3 * 60 * 1000;

let torchRemainingMs = TORCH_LIFESPAN_MS;

function equipTorch() {
  const turningOn = !torchEquipped;

  if (turningOn && torchesCollected <= 0) return; // walang stock

  torchEquipped = turningOn;

  // Bagong torch lang (naubos na ang natitira, o unang pagkakataon) ang
  // nagre-reset pabalik sa buong 3 minuto - kung meron pang natitira
  // mula sa nakaraang pagkaka-equip nito, doon na lang ito ipagpapatuloy.
  if (turningOn && torchRemainingMs <= 0) torchRemainingMs = TORCH_LIFESPAN_MS;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatawag kada frame mula sa update() (update.js) - binabawasan ang
// natitirang oras habang naka-equip, at kapag naubos na: naaalis ang
// isang torch sa stock (talagang "nagamit" na ito).
//
// AYOS (hiling ng user): "continues lang yung paggamit niya, yung
// duration once natapos yung isa... maging 2 and so on hanggang
// maubos" - dating basta na-uunequip agad (kailangan pang MANWAL na
// i-equip ulit) sa sandaling maubos ang isang torch, kahit may
// natitira pa namang stock - ngayon, kung may NATITIRA pa (torchesCollected
// > 0 pagkatapos bawasan), TULOY-TULOY na kusang "sinisindihan" ang
// SUSUNOD na torch (bumabalik sa buong TORCH_LIFESPAN_MS, nananatiling
// naka-equip/nasusunog) - PAULIT-ULIT ito hanggang TALAGANG maubos ang
// buong stock, saka pa lang talaga naka-uunequip.
function updateTorchBurn(deltaMs) {
  if (!torchEquipped) return;

  torchRemainingMs -= deltaMs;

  if (torchRemainingMs > 0) return;

  // Naubos ang KASALUKUYANG hawak na torch.
  torchesCollected = Math.max(0, torchesCollected - 1);

  if (torchesCollected > 0) {
    // May natitira pa - awtomatikong ipagpatuloy gamit ang susunod.
    torchRemainingMs = TORCH_LIFESPAN_MS;
  } else {
    // Talagang naubos na ang lahat - saka pa lang mag-uunequip.
    torchRemainingMs = 0;
    torchEquipped = false;
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key === "3") {
    event.preventDefault();
    equipAxe();
  } else if (event.altKey && event.key === "4") {
    event.preventDefault();
    equipArrow();
  } else if (event.altKey && event.key === "6") {
    event.preventDefault();
    equipTorch();
  }
});

// =========================
// NAKA-SAVE NA MGA NA-ANI (harvested resource nodes)
// =========================

const RESOURCE_SAVE_KEY = "tralala.harvestedResources";

// Ang value ay BILANG ng hits (0..RESOURCE_REQUIRED_HITS), hindi
// true/false - tingnan ang isNodeFullyHarvested sa ibaba.
// { village: { "col,row": 3, ... }, houseInside: { ... } }
let harvestedResources = loadHarvestedResources();

function loadHarvestedResources() {
  try {
    const raw = localStorage.getItem(RESOURCE_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveHarvestedResources(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(RESOURCE_SAVE_KEY, JSON.stringify(harvestedResources));
  } catch (error) {
    // Hindi kritikal.
  }
}

function getHarvestedForCurrentWorld() {
  if (!currentWorld) return {};

  if (!harvestedResources[currentWorld]) {
    harvestedResources[currentWorld] = {};
  }

  return harvestedResources[currentWorld];
}

// =========================
// PAGTUBO ULIT NG PUNO SA PAREHONG TILE (bagong hiling ng user)
// =========================
//
// DATING GAWI: kapag na-chop na nang buo ang isang puno,
// PERMANENTENG nawawala ito sa TALAGANG posisyon nito, at isang BAGONG
// puno sa IBANG random na lokasyon ang lumalabas pagkatapos ng
// RESOURCE_RESPAWN_INTERVAL_MS (tingnan ang "1-MINUTONG RESPAWN
// SCHEDULE" sa itaas/AUTO-REGENERATION sa ibaba).
//
// BAGO (hiling ng user): "medyo mabilis pa kasi spawning kahit i-random
// mo from 3 mins to 5 mins yung pag spawn ng trees, rocks at grass" -
// dating FIXED na 1 minuto (60*1000) - ngayon, isang RANGE, at
// RANDOM ang aktwal na hintay ng BAWAT indibidwal na puno/bato/damo
// (tingnan ang rollResourceRegrowMs sa ibaba) - hindi na iisang
// paulit-ulit na eksaktong bilang. Ginagamit ito ng TATLO: puno
// (dito, registerHit), bato (updateResourceRespawns sa ibaba), at
// BAGONG "cutter"/damo-cutting system (grass.js).
const RESOURCE_REGROW_MIN_MS = 3 * 60 * 1000;
const RESOURCE_REGROW_MAX_MS = 5 * 60 * 1000;

function rollResourceRegrowMs() {
  return (
    RESOURCE_REGROW_MIN_MS +
    Math.random() * (RESOURCE_REGROW_MAX_MS - RESOURCE_REGROW_MIN_MS)
  );
}

const TREE_REGROW_SCHEDULE_SAVE_KEY = "tralala.treeRegrowSchedule";

// { [world]: { "col,row": regrowAtTimestamp } }
let treeRegrowSchedule = loadTreeRegrowSchedule();

function loadTreeRegrowSchedule() {
  try {
    const raw = localStorage.getItem(TREE_REGROW_SCHEDULE_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveTreeRegrowSchedule(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      TREE_REGROW_SCHEDULE_SAVE_KEY,
      JSON.stringify(treeRegrowSchedule),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getTreeRegrowScheduleForCurrentWorld() {
  if (!currentWorld) return {};

  if (!treeRegrowSchedule[currentWorld]) {
    treeRegrowSchedule[currentWorld] = {};
  }

  return treeRegrowSchedule[currentWorld];
}

// Tinatawag KADA FRAME (update.js) - sinisiyasat kung may puno na
// "tapos na ang 1-minutong paghihintay" - kung meron, ibinabalik ang
// harvested[key] pabalik sa 0 (choppable ulit) AT ibinabalik ang
// collision box nito (tinanggal ito noong una itong na-chop, tingnan
// ang removeResourceCollisionAt sa registerHit) - LITERAL na "tumubo
// ulit" ang PAREHONG puno sa PAREHONG (col,row), hindi bagong node sa
// ibang lugar.
function updateTreeRegrowth() {
  if (typeof getGameNow !== "function") return;
  if (!currentWorld) return;

  const schedule = getTreeRegrowScheduleForCurrentWorld();
  const keys = Object.keys(schedule);

  if (keys.length === 0) return;

  const now = getGameNow();
  const harvested = getHarvestedForCurrentWorld();
  let changed = false;

  for (const key of keys) {
    if (now < schedule[key]) continue;

    delete schedule[key];
    harvested[key] = 0;
    changed = true;

    // Bagong puno na ito ngayon (hindi na tuod) - "linisin" ang bilang
    // ng stump-hits ng LUMANG tuod dito, kung meron man (tingnan ang
    // "PAGSIRA SA TUOD/STUMP" sa itaas) - para simula sa 0 ulit ito sa
    // susunod na maputol.
    const stumpHitsForWorld = getStumpHitsForCurrentWorld();

    if (stumpHitsForWorld[key] !== undefined) {
      delete stumpHitsForWorld[key];
      saveStumpHits();
    }

    const [colStr, rowStr] = key.split(",");

    collisions.push({
      x: Number(colStr) * TILE_SIZE,
      y: Number(rowStr) * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      resourceKey: key,
    });
  }

  if (changed) {
    saveTreeRegrowSchedule();
    saveHarvestedResources();
  }
}

// =========================
// PAGSIRA SA TUOD/STUMP BAGO PA MATAPOS ANG REGROW (bagong hiling ng
// user)
// =========================
//
// HILING: "yung pinetreecut is kapag lumabas na dapat gagamitan pa rin
// ng axe, tapos nasisira at may item loot pa rin, pero mawawala na
// yung pinetreecut na yon (pati na yung collision nito) - pero yung
// ALGORITHM ng pagtubo ulit (TREE_REGROW_MS/updateTreeRegrowth sa
// itaas) ay DAPAT PAREHO PA RIN, DAGDAG lang feature ito - nasisira
// ang tuod sa 3 hits ng axe (STUMP_REQUIRED_HITS)."
//
// Kaya HIWALAY na counter ito sa "harvested" (na, sa puno, laging
// nasa RESOURCE_HARVESTED_SENTINEL na sa sandaling maputol - hindi na
// magagamit uli bilang "bilang ng hit" doon). Ang pagsira sa tuod ay
// HINDI nakakaapekto sa treeRegrowSchedule/updateTreeRegrowth sa
// itaas - TULOY pa rin "tutubo ulit" ang puno sa eksaktong (col,row)
// na ito sa parehong oras na nakatakda na, kahit wala/nasira na ang
// tuod sa oras na iyon (tingnan ang cleanup sa updateTreeRegrowth sa
// itaas - dinaragdag doon ang pag-alis ng stumpHits[key] kapag tumubo
// na ulit, para "malinis" na simula ang bagong puno).
const STUMP_REQUIRED_HITS = 3;

const STUMP_HITS_SAVE_KEY = "tralala.stumpHits";

// { [world]: { "col,row": bilang ng axe hits na natanggap na ng tuod } }
let stumpHits = loadStumpHits();

function loadStumpHits() {
  try {
    const raw = localStorage.getItem(STUMP_HITS_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// "force" param, default false - pareho ng ibang saveXxx() dito
// (tingnan ang paliwanag sa saveHarvestedResources sa itaas).
function saveStumpHits(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(STUMP_HITS_SAVE_KEY, JSON.stringify(stumpHits));
  } catch (error) {
    // Hindi kritikal.
  }
}

function getStumpHitsForCurrentWorld() {
  if (!currentWorld) return {};

  if (!stumpHits[currentWorld]) {
    stumpHits[currentWorld] = {};
  }

  return stumpHits[currentWorld];
}

function isStumpDestroyed(key) {
  return (getStumpHitsForCurrentWorld()[key] || 0) >= STUMP_REQUIRED_HITS;
}

// Totoo lang kung: (1) may puno dito, (2) tapos na itong maputol
// (fully harvested), (3) mayroon pang schedule ng pagtubo-ulit (ibig
// sabihin, "tuod" pa mismo ang nasa tile na ito - hindi lang basta
// blangkong tile), (4) may art talaga ang variant na ito para sa tuod,
// (5) hindi pa naaabot ang STUMP_REQUIRED_HITS dito, at (6) - kaso
// lang ng pinetree - tapos na ang "pagbagsak" na animation nito
// (hindi pa dapat magagamit ang axe habang tumatakbo pa iyon).
function canChopStumpAt(col, row) {
  const key = col + "," + row;
  const harvested = getHarvestedForCurrentWorld();
  const tree = findTreeAt(col, row);

  if (!tree) return false;
  if (!isNodeFullyHarvested(harvested, key, "wood")) return false;
  if (getTreeRegrowScheduleForCurrentWorld()[key] === undefined) return false;
  if (!treeVariantHasStumpArt(tree.variant)) return false;
  if (isStumpDestroyed(key)) return false;

  const isPinetree =
    (currentWorld === "grassmap" || currentWorld === "grassmap2") &&
    tree.variant === PINETREE_VARIANT_INDEX;

  if (isPinetree && getPinetreeFallProgress(col, row) !== null) return false;

  return true;
}

// Isang hit ng axe laban sa tuod/stump - hiwalay na "hit counter" ito
// (stumpHits, itaas) sa "harvested" ng puno. Sa ika-STUMP_REQUIRED_HITS
// na hit: tinatanggal ang collision AT nagbibigay ng loot (kagaya ng
// normal na pag-ani), PERO HINDI ginagalaw ang treeRegrowSchedule -
// tuloy pa rin "tutubo ulit" ang puno sa eksaktong oras na nakatakda
// na (updateTreeRegrowth, itaas).
function registerStumpHit(col, row) {
  const key = col + "," + row;
  const hitsForWorld = getStumpHitsForCurrentWorld();
  const hits = (hitsForWorld[key] || 0) + 1;

  hitsForWorld[key] = hits;
  saveStumpHits();
  spawnNodeShake(col, row);

  if (typeof useToolDurability === "function") {
    useToolDurability("axe");
  }

  if (hits < STUMP_REQUIRED_HITS) return;

  // Nasira na ang tuod - mawawala na ang guhit nito (tingnan ang
  // isStumpDestroyed/getResourceDrawables) AT ang 1-tile na collision
  // nito.
  removeResourceCollisionAt(col, row);

  const yieldCount = randomResourceYield();

  if (typeof spawnGroundItem === "function") {
    for (let i = 0; i < yieldCount; i++) {
      const dropTile =
        typeof getRandomAdjacentTile === "function"
          ? getRandomAdjacentTile(col, row)
          : { col, row };

      spawnGroundItem(
        dropTile.col,
        dropTile.row,
        "wood",
        1,
        i * GROUND_ITEM_SPAWN_STAGGER_MS,
      );
    }
  } else {
    collectWood(yieldCount);
  }

  if (typeof gainExp === "function") gainExp(3);
}

// =========================
// "EXTRA" NA MGA NODE (bunga ng 15-minutong respawn system sa ibaba)
// =========================
//
// Ang ORIHINAL na 50 puno/50 bato kada mundo (TREE_COUNT_PER_WORLD/
// STONE_COUNT_PER_WORLD) ay SEEDED/deterministic (generateResourceNodes
// sa itaas) - pareho palagi ang posisyon nila, kaya sapat nang i-save
// KUNG ALIN ang na-harvest (harvestedResources) para malaman kung alin
// ang dapat itago. PERO ang mga BAGONG node na idinaragdag ng respawn
// system (isa-isa, kada 15 minuto ng GAME time - tingnan ang
// "AUTO-REGENERATION" sa ibaba) ay RANDOM ang lokasyon (hindi seeded/
// makukuha ulit sa parehong posisyon basta i-recompute) - kailangan
// silang i-save nang buo (col/row/variant), hindi lang ang "harvested"
// state nila.
const RESOURCE_EXTRA_NODES_SAVE_KEY = "tralala.resourceExtraNodes";

// { [world]: { trees: [{col,row,variant}], stones: [...] } }
let resourceExtraNodes = loadResourceExtraNodes();

function loadResourceExtraNodes() {
  try {
    const raw = localStorage.getItem(RESOURCE_EXTRA_NODES_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveResourceExtraNodes(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      RESOURCE_EXTRA_NODES_SAVE_KEY,
      JSON.stringify(resourceExtraNodes),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getExtraNodesForCurrentWorld() {
  if (!currentWorld) return { trees: [], stones: [] };

  if (!resourceExtraNodes[currentWorld]) {
    resourceExtraNodes[currentWorld] = { trees: [], stones: [] };
  }

  const entry = resourceExtraNodes[currentWorld];

  if (!entry.trees) entry.trees = [];
  if (!entry.stones) entry.stones = [];

  return entry;
}

// =========================
// 1-MINUTONG RESPAWN SCHEDULE (kada mundo, hiwalay ang puno sa bato)
// =========================
//
// BAGONG HILING: hindi na dapat "bumabalik" (mag-reset) ang na-break
// mo nang puno/bato kapag nag-reload/lumabas-pumasok ng bahay - dapat
// PERMANENTENG nawala ito sa kinalalagyan nito (tingnan ang
// harvestedResources sa itaas, naka-save na ito noon pa - hindi na
// kailangang ulitin). Sa halip, dapat mag-spawn ng BAGONG puno/bato
// ISA-ISA, kada RANDOM na 3-5 MINUTO (hiling ng user: "medyo mabilis pa
// kasi spawning... i-random mo from 3 mins to 5 mins" - dating FIXED
// na 1 minuto) ng GAME time (gamit ang getGameNow(), HINDI Date.now() -
// ayon sa convention ng project, para sumasabay ito sa pagtulog/
// time-skip), sa isang BAGONG RANDOM na lokasyon (findValidRelocationSpot(),
// sa ibaba - iniiwasan ang collisions/objectCells/existing na node,
// tingnan ang paliwanag doon) - hanggang sa mabalik ang
// TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD na dami. Ginagamit na
// ngayon ang shared na rollResourceRegrowMs() (itaas) sa halip na isang
// fixed na constant dito.

const RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY = "tralala.resourceRespawnSchedule";

// { [world]: { nextTreeAt: number|null, nextStoneAt: number|null } } -
// ang mga oras (getGameNow() timestamp) kung kailan susunod na
// susuriin (hindi laging mag-spa-spawn, tingnan ang updateResourceRespawns)
// kung may bagong puno/bato dapat lumabas.
let resourceRespawnSchedule = loadResourceRespawnSchedule();

function loadResourceRespawnSchedule() {
  try {
    const raw = localStorage.getItem(RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveResourceRespawnSchedule(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY,
      JSON.stringify(resourceRespawnSchedule),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getRespawnScheduleForCurrentWorld() {
  if (!currentWorld) return { nextTreeAt: null, nextStoneAt: null };

  if (!resourceRespawnSchedule[currentWorld]) {
    resourceRespawnSchedule[currentWorld] = {
      nextTreeAt: null,
      nextStoneAt: null,
    };
  }

  return resourceRespawnSchedule[currentWorld];
}

// Ilan sa mga node (trees/stones) ng KASALUKUYANG mundo ang "buhay" pa
// (hindi pa fully-harvested) ngayon - batayan ito ng "deficit" (ilan
// pa ang dapat ibalik ng respawn system).
function countAliveResourceNodes(listKey) {
  if (!resourceNodesCache || !resourceNodesCache[listKey]) return 0;

  const harvested = getHarvestedForCurrentWorld();
  const itemId = listKey === "trees" ? "wood" : "stone";

  let alive = 0;

  for (const node of resourceNodesCache[listKey]) {
    if (!isNodeFullyHarvested(harvested, node.col + "," + node.row, itemId)) {
      alive++;
    }
  }

  return alive;
}

// Gumagawa ng ISANG BAGONG node (tree/stone) sa isang bagong, TALAGANG
// bakanteng lokasyon (parehong validation ng findValidRelocationSpot
// sa ibaba) - idinaragdag sa "extra" na listahan (naka-save) AT sa
// kasalukuyang resourceNodesCache (kaagad na makikita/nakakabangga).
function spawnExtraResourceNode(listKey) {
  const spot = findValidRelocationSpot(listKey);

  if (!spot) return false; // walang nahanap na lugar - susubukan na lang sa susunod na tick

  // Tamang variant COUNT base sa AKTIBONG variant array ng mundong ito
  // (tingnan ang getActiveTreeVariantPaths/getActiveStoneVariantPaths) -
  // dating "2" lang ang laging naka-hardcode dito, kaya kung mas marami
  // (hal. 6 na bato ng grassmap) ang aktibong variant array, hindi
  // kailanman lalabas ang mga karagdagang hugis sa mga BAGONG node na
  // idinaragdag ng 15-minutong respawn system na ito.
  const variantCount =
    listKey === "trees"
      ? getActiveTreeVariantPaths().length
      : getActiveStoneVariantPaths().length;

  const extra = getExtraNodesForCurrentWorld();
  const node = {
    col: spot.col,
    row: spot.row,
    variant: Math.floor(Math.random() * variantCount),
  };

  extra[listKey].push(node);
  saveResourceExtraNodes();

  if (resourceNodesCache && resourceNodesCache[listKey]) {
    resourceNodesCache[listKey].push(node);
  }

  // BAGO: kung bato ang idinaragdag na "extra" node na ito, gamitin ang
  // parehong tamang-sukat na collision (getStoneCollisionBox) sa halip
  // na basta buong tile - tingnan ang paliwanag sa getStoneCollisionBox.
  const extraKey = node.col + "," + node.row;

  if (listKey === "stones") {
    collisions.push({ ...getStoneCollisionBox(node), resourceKey: extraKey });
  } else {
    collisions.push({
      x: node.col * TILE_SIZE,
      y: node.row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      resourceKey: extraKey,
    });
  }

  return true;
}

// Tinatawag KADA FRAME (update.js) - simpleng timestamp check lang,
// hindi mabigat. Gumagamit ng WHILE loop (may safety cap) sa halip na
// IF, para kung sakaling "tumalon" nang malayo ang game time (hal.
// natulog nang maraming oras - tingnan ang advanceGameTime sa
// gametime.js), maabutan/masunod pa rin ang lahat ng lumipas na 15-
// minutong tick sa isang beses, hindi lang isa.
function updateResourceRespawns() {
  const world = getWorld();

  if (!world || !world.outdoor) return; // ang mga node ay OUTDOOR lang
  if (typeof getGameNow !== "function") return;
  if (!mapReady || !mapData) return;

  ensureResourceNodes();

  const schedule = getRespawnScheduleForCurrentWorld();
  const now = getGameNow();
  let changed = false;

  if (schedule.nextTreeAt === null) {
    schedule.nextTreeAt = now + rollResourceRegrowMs();
    changed = true;
  }

  if (schedule.nextStoneAt === null) {
    schedule.nextStoneAt = now + rollResourceRegrowMs();
    changed = true;
  }

  let guard = 0;

  // BAGO: HINDI na dito ginagawa ang respawn ng PUNO (tingnan ang
  // "PAGTUBO ULIT NG PUNO SA PAREHONG TILE" sa itaas) - ang puno na
  // na-chop ay TUMUTUBO ULIT sa PAREHONG (col,row) nito pagkatapos ng
  // TREE_REGROW_MS (updateTreeRegrowth(), tinatawag din kada frame mula
  // update.js) - HINDI na kailangan pang gumawa ng BAGONG puno sa
  // IBANG lokasyon. Ang schedule.nextTreeAt ay naiwan pa rin dito
  // (walang epekto, session-lang, ligtas na "patay" na code) para hindi
  // na kailangang galawin pa ang naka-save nang estado ng mga
  // umiiral nang manlalaro.
  while (now >= schedule.nextTreeAt && guard < 1000) {
    guard++;
    changed = true;

    schedule.nextTreeAt += rollResourceRegrowMs();
  }

  guard = 0;

  while (now >= schedule.nextStoneAt && guard < 1000) {
    guard++;
    changed = true;

    if (
      !world.noStones &&
      countAliveResourceNodes("stones") < (world.stoneCount || STONE_COUNT_PER_WORLD)
    ) {
      spawnExtraResourceNode("stones");
    }

    schedule.nextStoneAt += rollResourceRegrowMs();
  }

  if (changed) saveResourceRespawnSchedule();
}

// BAGO (hiling ng user: "erase the punch function, i dont want punch
// anymore") - tinanggal na ang KAMAO (bare-hand) na paraan ng
// pag-ani ng puno/bato (dating 10 hits, mas mabagal, walang
// naka-equip na tool) - kailangan na talaga ng TAMANG tool
// (axe para sa puno, pickaxe para sa bato) bago makapag-ani, tingnan
// ang mousedown listener sa ibaba.
function getRequiredHitsFor(itemId) {
  return RESOURCE_REQUIRED_HITS;
}

// Ang value sa harvested[key] ay ISANG BILANG (bilang ng click na
// natanggap na ng node na ito), hindi lang true/false.
//
// BUG FIX (hiling ng user): "kapag di ko na ginamit yung axe lumilitaw
// yung ibang mga trees pero kapag use nawawala parin kahit yung sa
// pickaxe din" - SANHI: ang lumang bersyon ng function na ito ay
// dumadaan sa DYNAMIC na getRequiredHitsFor(itemId) - na NAGBABAGO
// depende sa KASALUKUYANG naka-equip na tool (6 kapag may tamang
// tool, 10 kapag kamao/walang equip). Kaya kung PARTIAL pa lang ang
// isang node (hal. 7 beses na na-click gamit ang kamao - hindi pa
// "tapos" doon dahil 10 ang required), sa SANDALING mag-equip ng
// tamang tool (6 na lang ang naging required), 7 >= 6 na, kaya
// biglang "fully harvested" ang TINGIN ng ibang function
// (getResourceDrawables/ensureResourceNodes/countAliveResourceNodes/
// drawResourceCursor) - "nawawala"/nagiging madaanan ang puno/bato
// KAHIT HINDI PA TALAGA ito na-ani (walang collision na natanggal,
// walang wood/stone na lumabas - hindi pa dumaan sa registerHit()
// finalize logic sa ibaba) - bumabalik ulit kapag na-unequip ulit ang
// tool (bumalik sa 10 ang required). Parehong klase ng bug ito ng
// dating "nagbabalik-balik na nakikita ang puno" (tingnan ang
// paliwanag sa loob ng registerHit), pero ito ay para sa PARTIAL na
// hit count, hindi lang sa eksaktong sandali ng pagkumpleto.
//
// AYOS: ang TANGING batayan na ngayon ay kung TALAGANG na-FINALIZE na
// ang node - RESOURCE_HARVESTED_SENTINEL, itinatakda LANG ni
// registerHit() sa SANDALING TALAGANG maabot ang required threshold
// (gamit ang TOOL na aktwal na ginamit NOONG sandaling iyon, hindi sa
// kasalukuyan) - hindi na ito muling kinukumpyuta base sa
// KASALUKUYANG naka-equip na tool sa bawat pagtawag/frame. Kaya
// CONSISTENT na ang display/collision/respawn-deficit/cursor sa
// TALAGANG estado ng node, kahit ano pa ang i-equip/i-unequip
// pagkatapos. "itemId" - naiwan pa rin ang parameter (hindi na ito
// ginagamit sa loob) para hindi na kailangang galawin ang lahat ng
// dating tumatawag dito.
function isNodeFullyHarvested(harvested, key, itemId) {
  return (harvested[key] || 0) >= RESOURCE_HARVESTED_SENTINEL;
}

// =========================
// PAGGAWA NG MGA POSISYON (seeded, isang beses kada mundo)
// =========================

function hashStringToInt(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }

  return hash;
}

let resourceNodesCache = null;
let resourceNodesValidatedFor = null;

// May aktibong tanim (buhay na binhi, hindi lang basta hukay) ba sa
// eksaktong tile na ito ngayon? Ginagamit ito para IWASAN (hindi
// paglalagyan) ng random na puno/bato dito - kapwa sa UNANG spawn
// (isValidTile sa generateResourceNodes) at sa RESPAWN pagkatapos
// maani (findValidRelocationSpot sa ibaba) - hindi dapat biglang may
// tumubong puno/bato sa ibabaw ng tinanim mong carrot.
function isTilePlantedWithCrop(col, row) {
  if (typeof getDugTilesForCurrentWorld !== "function") return false;

  const dug = getDugTilesForCurrentWorld();
  const record = dug ? dug[col + "," + row] : null;

  return Boolean(record && record.seed);
}

// AYOS: dating may "clearing" na exclusion dito sa paligid ng gate
// patungong "town" (para hindi matabunan ng random na puno/bato/damo)
// - pero TINANGGAL na ang buong "newmap" (WORLDS, hiling ng user), at
// ang mga natitirang labas na mundo ("town"/"grassmap") ay PAREHONG
// walang random na puno/bato malapit doon (parehong "noTrees: true"/
// nakadrawing na sa larawan mismo/gumagamit ng "fixedTrees" - tingnan
// ang worlds.js) - kaya hindi na kailangan ang exclusion na ito, laging
// FALSE na lang.
function isInsideTownGateClearing(col, row) {
  return false;
}

// =========================
// "CLEARANCE" SA PALIGID NG BATO (hiling ng user: "i want to walk or
// run of top left right bottom of the tile have stone")
// =========================
//
// Bawat bato ay iisang tile lang talaga ang collision (tingnan ang
// ensureResourceNodes/spawnExtraResourceNode - TILE_SIZE x TILE_SIZE
// LANG, hindi kailanman lumalampas dito) - PERO dahil PAREHONG random
// ang placement ng bato/puno (walang minimum na agwat sa pagitan ng
// mga node), maaaring MAGKATABI ang dalawa o higit pang bato/puno,
// kaya "parang malaki" ang nararamdamang collision (isang cluster ng
// magkakadikit na 1-tile na collision, hindi mismong isang bato).
// AYOS: sa PAGLALAGAY (placement) pa lang ng bato, sinisiguro na na
// LAGING bukas/madadaanan ang 4 karatig na tile nito (itaas/ibaba/
// kaliwa/kanan) - hindi pinapayagan ang ibang node (puno man o bato)
// na malagay doon.
function isOrthogonallyAdjacentToStone(col, row, stoneTileKeys) {
  return (
    stoneTileKeys.has(col - 1 + "," + row) ||
    stoneTileKeys.has(col + 1 + "," + row) ||
    stoneTileKeys.has(col + "," + (row - 1)) ||
    stoneTileKeys.has(col + "," + (row + 1))
  );
}

function hasOccupiedOrthogonalNeighbor(col, row, occupiedKeys) {
  return (
    occupiedKeys.has(col - 1 + "," + row) ||
    occupiedKeys.has(col + 1 + "," + row) ||
    occupiedKeys.has(col + "," + (row - 1)) ||
    occupiedKeys.has(col + "," + (row + 1))
  );
}

// BAGONG (migration/paglilinis): mga "extra" na node na naka-save na
// sa localStorage MULA PA BAGO idinagdag ang "clearance" rule sa itaas
// ay maaaring MAY dati nang bato na magkatabi ng ibang node (dahil
// wala pang paghihigpit noon) - hindi ito automatikong naaayos ng
// bagong isValidTile check (iyon ay para lang sa BAGONG ilalagay na
// node, hindi retroactive sa mga NAKA-SAVE NA). AYOS: sa TUWING
// mag-load ng extra nodes ng isang mundo, tinatanggal na ang ANUMANG
// EXTRA na bato na KARATIG ng ibang EXTRA na node (puno man o bato) -
// isang beses lang ito talaga magaganap kada mundo (naka-save agad
// pagkatapos ang resulta, kaya hindi na ito uulitin sa susunod na
// pag-load).
function cleanupExtraStoneClearance(extra) {
  const occupiedKeys = new Set();

  for (const tree of extra.trees) occupiedKeys.add(tree.col + "," + tree.row);
  for (const stone of extra.stones) {
    occupiedKeys.add(stone.col + "," + stone.row);
  }

  const keptStones = extra.stones.filter((stone) => {
    // Sariling tile ng bato ang tinatanggal muna sa Set bago suriin,
    // para hindi ito "makita" ang sarili nitong key bilang "occupied
    // neighbor" (hindi naman ito totoong karatig sa sarili).
    const selfKey = stone.col + "," + stone.row;

    occupiedKeys.delete(selfKey);

    const hasNeighbor = hasOccupiedOrthogonalNeighbor(
      stone.col,
      stone.row,
      occupiedKeys,
    );

    occupiedKeys.add(selfKey); // ibalik agad - baka sunod pang bato ang susuriin

    return !hasNeighbor;
  });

  const changed = keptStones.length !== extra.stones.length;

  extra.stones = keptStones;

  return changed;
}

function generateResourceNodes() {
  const world = getWorld();

  if (!mapReady || !mapData || !world || !world.outdoor) {
    return { trees: [], stones: [] };
  }

  const objectCells = getObjectCells();
  const occupied = new Set();
  const seedBase = hashStringToInt(currentWorld);
  let seedCounter = 0;

  // BAGONG: mga "EXTRA" na node na dating idinagdag ng 15-minutong
  // respawn system (tingnan ang "AUTO-REGENERATION" sa ibaba) - hindi
  // ito bahagi ng seeded/deterministic na batayan (random ang lokasyon,
  // kaya naka-save/load sa localStorage) - kailangang isama muna sa
  // "occupied" BAGO maglagay ng mga bagong seeded na node, para hindi
  // sila magkapatong.
  const extra = getExtraNodesForCurrentWorld();

  // Paglilinis ng mga LUMANG "extra" na bato (tingnan ang
  // cleanupExtraStoneClearance sa itaas) - kailangan ito bago pa man
  // gamitin ang `extra` sa ibaba, para CONSISTENT kaagad ang unang
  // pag-render pagkatapos mag-load.
  if (cleanupExtraStoneClearance(extra)) {
    saveResourceExtraNodes();
  }

  for (const tree of extra.trees) occupied.add(tree.col + "," + tree.row);
  for (const stone of extra.stones) occupied.add(stone.col + "," + stone.row);

  // Bahagi ng "clearance" system sa itaas - hiwalay na Set na
  // TANGING mga bato lang ang laman (kasama na ang mga "extra" na bato
  // mula sa itaas), para masuri kung ang isang candidate tile ay
  // KARATIG (orthogonal) ng isang bato - tingnan ang
  // isOrthogonallyAdjacentToStone.
  const stoneTiles = new Set();

  for (const stone of extra.stones) stoneTiles.add(stone.col + "," + stone.row);

  function nextRandom() {
    return seededRandom(seedBase + seedCounter++);
  }

  function isValidTile(col, row) {
    const key = col + "," + row;

    if (
      col < 1 ||
      row < 1 ||
      col >= mapData.width - 1 ||
      row >= mapData.height - 1
    ) {
      return false;
    }

    if (occupied.has(key)) return false;
    if (objectCells && objectCells.has(key)) return false;
    if (isTilePlantedWithCrop(col, row)) return false;
    if (isInsideTownGateClearing(col, row)) return false;

    // Huwag payagang malagay ang KAHIT ANONG node (puno, bato, damo)
    // sa isang tile na KARATIG ng isang EXISTING na bato - tingnan ang
    // "CLEARANCE SA PALIGID NG BATO" sa itaas.
    if (isOrthogonallyAdjacentToStone(col, row, stoneTiles)) return false;

    const tileBox = {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    // AYOS (hiling ng user): "wag mo lagyan ng trees, rocs or grass
    // yung may collisions dun sa grassmap2.png" - dating EKSAKTONG
    // tile lang ang sinusuri (tileBox) laban sa `collisions` - kaya
    // kahit hindi mismo NAKAPATONG, puwede pa ring lumabas ang isang
    // puno/bato NAKADIKIT mismo sa gilid ng isang bundok/pader (mukhang
    // "tumutubo mula rito"). Dito, dagdag na 1-TILE na CLEARANCE ang
    // ginagamit sa paligid ng bawat collision box - kaya may konting
    // puwang na palaging naiiwan sa paligid ng kahit anong bundok/
    // pader/istruktura.
    const clearanceBox = {
      x: tileBox.x - TILE_SIZE,
      y: tileBox.y - TILE_SIZE,
      width: tileBox.width + TILE_SIZE * 2,
      height: tileBox.height + TILE_SIZE * 2,
    };

    if (collisions.some((box) => isColliding(clearanceBox, box))) return false;

    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        return false;
      }
    }

    return true;
  }

  function placeNodes(count, variantCount, nodeKind) {
    const nodes = [];
    let attempt = 0;

    // AYOS (hiling ng user - "grassmap2", 350 target): dating 800 lang
    // ang attempt cap - sapat na dati para sa maliliit na count (11-20),
    // pero kulang na para sa mas mataas na target (350) lalo na sa BATO
    // (may dagdag na "walang karatig na bato" na patakaran, kaya
    // unti-unting humihirap maghanap ng bagong lugar habang dumadami na
    // ang naka-lagay - dating natitigil sa ~230/350 lang). Isang beses
    // lang naman tumatakbo ito kada pagpasok sa isang mundo (cached),
    // kaya ligtas/mura pa ring taasan.
    while (nodes.length < count && attempt < 6000) {
      attempt++;

      const col = 1 + Math.floor(nextRandom() * (mapData.width - 2));
      const row = 1 + Math.floor(nextRandom() * (mapData.height - 2));

      if (!isValidTile(col, row)) continue;

      // BAGONG (bato lang): bukod sa hindi pagiging KARATIG ng ibang
      // bato (nasa loob na ng isValidTile), kailangan ding TALAGANG
      // WALANG ANUMANG node (puno o bato) sa 4 karatig na tile NG
      // MISMONG bagong batong ito - tingnan ang "CLEARANCE SA PALIGID
      // NG BATO" sa itaas.
      if (
        nodeKind === "stone" &&
        hasOccupiedOrthogonalNeighbor(col, row, occupied)
      ) {
        continue;
      }

      // "variant" - alin sa (2, o kung ilan man ang laman ng aktibong
      // variant array ng mundong ito - tingnan ang getActiveTreeVariantPaths/
      // getActiveStoneVariantPaths, resources.js) na magkaibang hugis
      // ang gagamitin sa node na ito. Naka-decide isang beses lang sa
      // paggawa nito, kaya hindi ito nagpapalit-palit kada frame.
      nodes.push({
        col,
        row,
        variant: Math.floor(nextRandom() * variantCount),
      });
      occupied.add(col + "," + row);

      if (nodeKind === "stone") stoneTiles.add(col + "," + row);
    }

    return nodes;
  }

  // BAGO: "fixedTrees"/"fixedStones" sa WORLDS (worlds.js) - kung
  // meron nito ang kasalukuyang mundo, GAMITIN na ang EKSAKTONG
  // listahan ng {col, row, variant} na iyon SA HALIP na random na
  // paglalagay (placeNodes). Ito ang hiniling na "specific na lugar"
  // na paglalagay ng pinetree/stone - hal.:
  //
  //   fixedTrees: [
  //     { col: 40, row: 20, variant: 0 }, // 0 = pinetree (unang path sa GRASSMAP_TREE_VARIANT_PATHS)
  //     { col: 45, row: 22 },             // variant optional, default 0
  //   ],
  //
  // Gamitin ang "P" key habang naglalaro (tingnan ang input.js -
  // logDebugTileUnderPlayer) para makita sa console (F12) kung anong
  // col/row ang kinatatayuan mo ngayon - dun mo kukunin ang mga numero
  // na ilalagay dito.
  const seededTrees = Array.isArray(world.fixedTrees)
    ? world.fixedTrees.map((node) => ({
        col: node.col,
        row: node.row,
        variant: node.variant || 0,
      }))
    : placeNodes(
        world.noTrees ? 0 : world.treeCount || TREE_COUNT_PER_WORLD,
        getActiveTreeVariantPaths().length,
        "tree",
      );
  // Ilang mundo (tingnan ang "noStones"/"noTrees" sa WORLDS - worlds.js)
  // ay sadyang walang random na puno/bato (hal. "town") - gagamitin ang
  // 0 bilang count sa halip na TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD
  // para sa mga iyon.
  //
  // AYOS (hiling ng user, "grassmap2" - 350 puno/bato/damo, random na
  // lugar): "world.treeCount"/"world.stoneCount" (worlds.js) - opsyonal
  // na PER-WORLD override sa TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD
  // (11/20 - masyadong kaunti para sa hiling na ~350) - kung wala namang
  // itinakdang override, ang DATING global na default pa rin
  // (TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD) ang ginagamit, kaya
  // walang nagbabagong gawi sa ibang mundo (town/grassmap, parehong may
  // fixedTrees/fixedStones o noTrees/noStones na rin naman).
  const seededStones = Array.isArray(world.fixedStones)
    ? world.fixedStones.map((node) => ({
        col: node.col,
        row: node.row,
        variant: node.variant || 0,
      }))
    : placeNodes(
        world.noStones ? 0 : world.stoneCount || STONE_COUNT_PER_WORLD,
        getActiveStoneVariantPaths().length,
        "stone",
      );

  // BAGO (hiling ng user): "json para sa mga di-fixed na trees/stones,
  // para makapag-test" - HIWALAY na listahan ito (world.trees/
  // world.stones, mula sa assets/map/grassmap-resources-test.json,
  // tingnan ang worlds.js) - PAREHONG {col,row,variant} format lang ng
  // fixedTrees/fixedStones sa itaas, kaya PAREHO ring
  // gumagana ang lahat ng existing na mekanismo dito (axe/pickaxe-
  // strike hit animation, pinetree cut-down/stump, harvested-tracking,
  // 15-minutong respawn system) - WALANG espesyal na "di-permanente" na
  // kaso, PERMANENTE pa rin itong nawawala kapag na-ubos, kagaya ng
  // fixedTrees/fixedStones.
  const testTrees = Array.isArray(world.trees)
    ? world.trees.map((node) => ({
        col: node.col,
        row: node.row,
        variant: node.variant || 0,
      }))
    : [];
  const testStones = Array.isArray(world.stones)
    ? world.stones.map((node) => ({
        col: node.col,
        row: node.row,
        variant: node.variant || 0,
      }))
    : [];

  // Isinasama na ngayon ang mga EXTRA na node (mula sa respawn system)
  // sa dulo ng listahan - ang parehong "harvested" filtering (tingnan
  // ang ensureResourceNodes/getResourceDrawables) ay gumagana pareho
  // sa dalawa, dahil "col,row" key lang ang batayan nito.
  return {
    trees: seededTrees.concat(testTrees, extra.trees),
    stones: seededStones.concat(testStones, extra.stones),
  };
}

// Tinatawag kada frame mula sa update() - pero isang beses lang talaga
// tumatakbo ang mabigat na bahagi nito kada pagpasok sa isang mundo
// (resourceNodesValidatedFor gate), tulad ng validateDugTiles sa dig.js.
function ensureResourceNodes() {
  if (!mapReady || !mapData) return;
  if (resourceNodesValidatedFor === currentWorld) return;

  resourceNodesCache = generateResourceNodes();
  resourceNodesValidatedFor = currentWorld;

  // Idinaragdag ang collision box ng mga HINDI PA na-aning puno/bato -
  // hindi madadaanan ang mga ito, tulad ng ibang bagay sa mapa. Ang
  // mga na-ani na (tingnan ang harvested) ay wala nang collision - MALIBAN
  // (BAGO, hiling ng user) kung meron pang NAKATAYONG TUOD (stump,
  // pinetreecut.png - tingnan ang "pendingRegrow" sa ibaba): solid pa
  // rin ang tuod, kaya dapat may 1-tile na collision pa rin ito habang
  // hindi pa tumutubo ulit ang puno.
  const harvested = getHarvestedForCurrentWorld();
  const regrowSchedule = getTreeRegrowScheduleForCurrentWorld();

  for (const node of [
    ...resourceNodesCache.trees.map((tree) => ({ ...tree, itemId: "wood" })),
    ...resourceNodesCache.stones.map((stone) => ({
      ...stone,
      itemId: "stone",
    })),
  ]) {
    const key = node.col + "," + node.row;
    const fullyHarvested = isNodeFullyHarvested(harvested, key, node.itemId);
    // Tuod lang ang meron nito (walang katumbas na bersyon ang bato,
    // laging "buo" o "wala na" lang ang isang bato) - tingnan ang
    // "pendingRegrow" sa getResourceDrawables() para sa PAREHONG check
    // na ito (dapat magkatugma sila, para tumutugma ang collision sa
    // TALAGANG nakikita/iginuguhit).
    // BAGO (hiling ng user): "dapat mawala na yung pinetreecut na yon
    // don mawawala yung collisions" - kung nasira na ang tuod (3 hits
    // ng axe, tingnan ang "PAGSIRA SA TUOD/STUMP" sa itaas), TALAGANG
    // wala na itong collision (isStumpDestroyed check dito) - kahit
    // may schedule pa (tuloy pa rin iyon sa likod-tabi lang, tingnan
    // ang updateTreeRegrowth).
    const isStump =
      node.itemId === "wood" &&
      fullyHarvested &&
      regrowSchedule[key] !== undefined &&
      treeVariantHasStumpArt(node.variant) &&
      !isStumpDestroyed(key);

    if (fullyHarvested && !isStump) continue; // wala na - wala ring collision

    // "resourceKey" - GINAGAMIT ni removeResourceCollisionAt() para
    // tanggalin ito nang tama sa oras na maani, KAHIT PA hindi na
    // buong-tile ang hugis ng box (tingnan ang getStoneCollisionBox) -
    // hindi na dependent sa eksaktong x/y match.
    if (node.itemId === "stone") {
      collisions.push({ ...getStoneCollisionBox(node), resourceKey: key });
    } else {
      collisions.push({
        x: node.col * TILE_SIZE,
        y: node.row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        resourceKey: key,
      });
    }
  }
}

// "variant.cut" guard - kung WALANG larawan ng tuod ang variant na ito
// (hal. ibang mundo, tingnan ang drawTreeStump), WALANG nakikitang
// guhit doon - kaya HUWAG ding maglagay ng "invisible" na collision.
// Ginagamit ito ng PAREHONG ensureResourceNodes (itaas, "world just
// loaded" na kaso) AT registerHit (BAGO idinagdag - "kaka-chop lang"
// na kaso, tingnan ang paliwanag doon).
function treeVariantHasStumpArt(variantIndex) {
  const variant = getActiveTreeVariantPaths()[variantIndex];

  return !!(variant && variant.cut);
}

// BAGO (hiling ng user: "yung pinetreecut is kapag lumabas na dapat may
// collisions din 1 tile") - ito mismo ang PUSH ng collision box ng
// tuod, hiwalay na function para magamit din ito ng registerHit
// (SANHI ng orihinal na bug: dating "ensureResourceNodes" LANG ang
// naglalagay ng stump collision, PERO minsan lang talaga tumatakbo ang
// function na iyon - isang beses lang kada PAGPASOK sa isang mundo, tingnan
// ang "resourceNodesValidatedFor" gate. Kaya kapag na-chop mo LANG
// habang naglalaro (hindi ka lumabas/pumasok ulit sa mundo), NAWAWALA
// LANG ang collision (removeResourceCollisionAt sa registerHit) at
// WALANG NAGDARAGDAG PABALIK nito - kaya "nadadaanan pa rin" ang tuod
// hanggang sa susunod na pag-reload/pagpasok sa mundo).
function addStumpCollision(col, row) {
  collisions.push({
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    resourceKey: col + "," + row,
  });
}

// =========================
// PAGGUHIT
// =========================
//
// Ini-inject natin ang mga ito sa Y-sort na "drawables" ng
// drawMapObjects (map.js) sa pamamagitan ng getResourceDrawables() -
// kaya tama ang lalim nila laban sa player at sa ibang bagay (puno,
// bahay) sa mapa.

// Dalawang hugis kada uri (tree/tree1, rock/rock1 - tingnan ang
// "variant" sa placeNodes), at bawat isa ay may bersyon na may niyebe -
// ginagamit ito sa halip na ang normal kapag umuulan ng niyebe ngayon
// (isSnowWeather() mula sa dig.js, parehong calendar-based na batayan
// ng snow.js).
const TREE_VARIANT_PATHS = [
  { normal: "./assets/assets/trees/tree.png" },
  { normal: "./assets/assets/trees/tree1.png" },
];

// GRASSMAP: bagong art na in-upload ng user (assets/objects/trees/) -
// dalawang variant lang (bigtree/pinetree), WALANG snow-swap dito
// (walang binigay na snow art para dito) - okay lang, ang GENERIC na
// snow-STAGE system (getTreeImagePathForStage, tingnan sa ibaba) ay
// nagpapalit na rin sa parehong shared na "snowtree.png"/"snowtree1.png"
// KAHIT ANONG variant array ang aktibo, kaya walang panganib na
// "mawala"/maging blangko ang puno kapag umuulan ng niyebe.
// BAGO: bawat variant ay may "cut" na larawan na ngayon (tuod, in-upload
// ng user - bigtreecut.png/pinetreecut.png) - tingnan ang
// TREE_STUMP_WIDTH_FRACTION/drawTreeStump sa ibaba: sa halip na
// basta mawala/maging blangko ang tile habang naghihintay ng
// TREE_REGROW_MS (dating comment dati: "wala pa tayong larawan ng
// tuod"), ipinapakita na ngayon ang TAMANG tuod base sa SPESIPIKONG
// puno na na-cut (bigtree -> bigtreecut, pinetree -> pinetreecut).
// BAGO (hiling ng user): "yung bigtree alisin mo na sa map" - tinanggal
// na ang bigtree variant (bukod pa dito, WALA namang
// bigtree.png sa assets - pinetree na LANG ang aktwal na na-spawn na
// puno sa grassmap ngayon).
const GRASSMAP_TREE_VARIANT_PATHS = [
  {
    normal: "./assets/objects/trees/pinetree.png",
    cut: "./assets/objects/trees/pinetreecut.png",
    // BAGO (hiling ng user): "again replace the pinetree if snow use
    // snowpinetree.png" - dedikadong SNOW na bersyon ng IDLE/standing
    // na larawan mismo ng pinetree (hindi lang stump/strike/fall) -
    // tingnan ang getTreeImagePathForStage sa ibaba: kapag may "snow"
    // field ang isang variant, ITO na ang gagamitin sa halip ng
    // generic na TREE_SNOW_LIGHT_PATH/HEAVY_PATH (snowtree.png/
    // snowtree1.png, "oak"-style, hindi tugma sa hugis ng pinetree).
    snow: "./assets/objects/trees/snowpinetree.png",
    // BAGO (hiling ng user): "may inadd ako na snowpinetreecut...
    // dapat palitan mo na yung snow aok tree ng mga yan para accurate
    // yung tree" - dedikadong SNOW na bersyon ng tuod (stump) - tingnan
    // ang treeVariantHasStumpArt/drawTreeStump sa ibaba (pinipili na
    // ngayon ang "snowCut" sa halip na "cut" kapag umuulan ng niyebe).
    snowCut: "./assets/objects/trees/snowpinetreecut.png",
  },
];

// Alin sa GRASSMAP_TREE_VARIANT_PATHS (itaas) ang pinetree - ginagamit
// ito ng dedikadong axe-strike/fall animation sa ibaba (tingnan ang
// "PINETREE AXE-STRIKE ANIMATION"). Pinetree na lang ang tanging
// variant (0) ngayon dahil tinanggal na ang bigtree.
const PINETREE_VARIANT_INDEX = 0;

// =========================
// PINETREE AXE-STRIKE ANIMATION (7 hits = 7 frame, tapos "fall/cutted"
// animation bago mawala nang tuluyan)
// =========================
//
// Hiling ng user: "animate the animation 1-7 strike of using axe and
// after that the animation of pinetreecuttedanimation will appear
// after 7 hit" - PINETREE LANG (PINETREE_VARIANT_INDEX sa itaas, ang
// TANGING variant na ngayon matapos tanggalin ang bigtree) ang may
// ganitong dedikadong animation.
//
// (1) BAWAT HIT (bago pa ma-cut nang tuluyan): isang static "damage"
// frame mula sa pinetreecutanimation.png, 7 frame kada isa (1st hit =
// frame 0, ..., 7th hit = frame 6). Pareho ang laki ng bawat frame sa
// pinetree.png mismo (77x149, verified via Pillow) at PAREHONG posisyon
// ng trunk sa loob ng frame - kaya PAREHONG anchor formula
// (drawTreeAtOpacityAndScale) ang gamit, walang extra offset kailangan.
const PINETREE_STRIKE_SHEET_PATH =
  "./assets/objects/trees/pinetreecutanimation.png";
const PINETREE_STRIKE_FRAME_COUNT = 7;
const PINETREE_STRIKE_FRAME_WIDTH = 77;
const PINETREE_STRIKE_FRAME_HEIGHT = 149;

// BAGO (hiling ng user): "may inadd ako na snowpinetreecutanimation...
// dapat palitan mo na yung snow aok tree ng mga yan para accurate yung
// tree at animations kapag nag gamit ako ng axe" - dedikadong SNOW na
// bersyon ng buong strike sheet (PAREHONG eksaktong laki/bilang ng
// frame - 539x149, 7 frame - verified via Pillow) - ginagamit sa halip
// ng normal na sheet sa itaas kapag umuulan ng niyebe (tingnan ang
// drawPinetreeStrikeFrame sa ibaba).
const PINETREE_STRIKE_SHEET_SNOW_PATH =
  "./assets/objects/trees/snowpinetreecutanimation.png";

// Kailangan MISMONG 7 hits ang pinetree (hindi ang generic
// RESOURCE_REQUIRED_HITS) - para tumugma nang eksakto ang bilang ng
// hit sa bilang ng frame ng strike animation sa itaas.
const PINETREE_REQUIRED_HITS = 7;

// (2) PAGKATAPOS NG IKA-7 HIT: isang beses na "pagbagsak" na animation
// (7 frame, magkakaiba ang lapad kada frame dahil paatilad ang
// canopy - 195x149 kada frame, verified via Pillow). Pagkatapos NITO,
// lumalabas ang PINETREECUT.PNG (tuod) sa MISMONG tile - PAREHONG
// "pendingRegrow -> drawTreeStump" na batayan ng ibang puno (tingnan
// ang getResourceDrawables) - at doon MANANATILI habang hindi pa
// tumutubo ulit ang puno (hiling ng user).
const PINETREE_FALL_SHEET_PATH =
  "./assets/objects/trees/pinetreecuttedanimation.png";
const PINETREE_FALL_FRAME_COUNT = 7;
const PINETREE_FALL_FRAME_WIDTH = 195;
const PINETREE_FALL_FRAME_HEIGHT = 149;
const PINETREE_FALL_FRAME_MS = 110; // ~0.77s ang buong pagbagsak
const PINETREE_FALL_TOTAL_MS =
  PINETREE_FALL_FRAME_COUNT * PINETREE_FALL_FRAME_MS;

// BAGO (hiling ng user, tingnan sa itaas) - dedikadong SNOW na bersyon
// ng buong fall sheet (PAREHONG eksaktong laki/bilang ng frame -
// 1365x149, 7 frame - verified via Pillow) - filename ay
// "snowpinetreecuttedtanimation.png" (may extra "t", eksaktong ganito
// talaga ang na-upload).
const PINETREE_FALL_SHEET_SNOW_PATH =
  "./assets/objects/trees/snowpinetreecuttedtanimation.png";

// BAGO (hiling ng user): "kapag naputol na medyo aangat yung
// snowpinetreecuttedanimation tapos pag babalik sa pwesto
// snowpinetreecut which is not good" - SANHI: kahit PAREHONG canvas
// size (195x149) ang snow at non-snow na bersyon ng fall sheet, ANG
// TALAGANG TRUNK (hindi lang basta ang buong silhouette/alpha bbox -
// tingnan ang paliwanag sa ibaba kung bakit mahalaga ang pagkakaiba)
// sa loob ng snow na bersyon ay HINDI kasing-baba ng sa non-snow na
// bersyon.
//
// AYOS (2nd round - mas tumpak na sukat): sinukat gamit ang
// COLOR-BASED na pag-scan (Pillow, hinahanap ang KAYUMANGGING trunk
// mismo, hindi lang basta ang alpha/transparency ng BUONG larawan -
// kasama pa kasi doon ang lumalagpak na dahon/canopy/alikabok na
// LUMALAMPAS pa sa TALAGANG puwesto ng trunk sa mga huling frame,
// kaya MALI yung 1st round na sukat - akala flush na sa ilalim ang
// ika-7 frame, PERO ang TRUNK mismo doon ay nasa ~138px pa rin, hindi
// 149px):
//   - STRIKE sheet (idle/hit frames, 149px height): 144px ang
//     trunk-bottom, PAREHO sa snow AT non-snow - ito ang "baseline"
//     (5px gap sa canvas bottom, pero CONSISTENT kaya hindi
//     napapansin sa idle/strike stage).
//   - FALL sheet, NON-SNOW: ~146-147px ang trunk-bottom (2-3px lang
//     ang pagkakaiba sa baseline - halos hindi mapapansin).
//   - FALL sheet, SNOW: ~137-138px LANG ang trunk-bottom (11-12px ang
//     gap sa canvas bottom) - malayo sa 5px na baseline, kaya
//     "lumulutang"/"aangat" ang TALAGANG puno sa SANDALING magsimula
//     ang snow fall animation (hindi lang sa dulo).
//
// Ang bawat entry dito ay ang EXTRA na Y offset (idinaragdag, hindi
// pinapalitan) na kailangan PER FRAME para ibalik ang trunk sa PAREHONG
// baseline (144/149) na ginagamit ng strike stage - COMPUTED bilang
// (149 - trunkBottomSrc) - 5, per frame, gamit ang trunk-specific na
// sukat sa itaas. Kapansin-pansin: HINDI ito 0 sa ika-7/HULING frame
// (di tulad ng 1st round na sukat) - dahil PALAGING mas mataas pa rin
// ang TALAGANG trunk kaysa sa assumption na "flush sa ilalim" - PERO
// pareho pa rin ito ng klase ng maliit (~2-3px) na di-kapansin-pansing
// pagkakaiba na NARETONG NA ring umiiral sa non-snow bersyon sa
// sandaling lumipat na sa tuod (walang eksaktong 0 doon kahit non-snow).
const PINETREE_FALL_SNOW_FRAME_BOTTOM_GAP_SRC = [7, 7, 7, 6, 7, 7, 6];

// Sinukat mula mismo sa larawan (Pillow, pixel-by-pixel na pag-scan
// ng kulay-kayumangging trunk): kung saan (sa loob ng 77px-wide na
// canvas ng pinetree.png/pinetreecutanimation.png) nakaposisyon ang
// KALIWANG gilid ng trunk - HALOS PAREHO ito sa lahat ng 7 strike
// frame (hindi gumagalaw ang trunk, dahon/canopy lang ang bahagyang
// umuuga). Ginagamit ito para ma-anchor nang tama (walang biglaang
// "jump" sa posisyon) ang UNANG frame ng fall animation (na MAS
// MALAPAD na canvas - 195px, may sariling ibang posisyon ng trunk).
// Ito rin (walang pagbabago) ang GINAGAMIT kahit sa SNOW na bersyon -
// pareho pala ang eksaktong posisyon ng trunk (column 22, verified
// din via Pillow sa row-by-row na pag-scan) SA SANDALING iayon muna
// ang bottom-gap sa itaas - hindi ito ang bahaging "aangat", ang
// PINETREE_FALL_SNOW_FRAME_BOTTOM_GAP_SRC (itaas) ang solusyon doon.
const PINETREE_TRUNK_LEFT_EDGE_SRC = 27;
// Kaparehong sukat pero sa loob ng 195px na canvas ng
// pinetreecuttedanimation.png - halos hindi rin gumagalaw (21-23px) sa
// lahat ng 7 frame nito.
const PINETREE_FALL_TRUNK_LEFT_EDGE_SRC = 22;

// Alin sa listahan ng variant ang GAGAMITIN, base sa kasalukuyang
// mundo. Direktang "currentWorld === "grassmap"" check na lang dito
// (hindi "world.treeVariantPaths" field sa WORLDS/worlds.js) - dahil
// mauna pa mag-parse ang worlds.js kaysa dito (resources.js), kaya
// hindi pa available ang GRASSMAP_TREE_VARIANT_PATHS sa oras na
// nabubuo ang WORLDS object kung doon ito ilalagay.
function getActiveTreeVariantPaths() {
  // AYOS (hiling ng user, "grassmap2" - kinopya mula sa grassmap):
  // parehong art/pinetree style ang gamit ng bagong mundong ito.
  if (currentWorld === "grassmap" || currentWorld === "grassmap2")
    return GRASSMAP_TREE_VARIANT_PATHS;

  return TREE_VARIANT_PATHS;
}

// =========================
// SNOW STAGE NG MGA PUNO
// =========================
//
// Ang mga puno (tree.png / tree1.png) ay parehong nagiging "snowtree"
// kapag umuulan ng niyebe - hindi ito ayon sa hugis/variant, kundi
// ayon sa GAANO KATAGAL nang tuloy-tuloy na umuulan:
//   normal -> (snow start) -> "light" (snowtree.png) -> (5 minuto)
//   -> "heavy" (snowtree1.png)
// Kapag tumigil ang niyebe, bumabalik agad sa "normal" (tree.png /
// tree1.png ayon sa variant).
const TREE_SNOW_LIGHT_PATH = "./assets/assets/trees/snowtree.png";
const TREE_SNOW_HEAVY_PATH = "./assets/assets/trees/snowtree1.png";
const TREE_SNOW_HEAVY_AFTER_MS = 5 * 60 * 1000; // 5 minutong tuloy-tuloy na snow

// Sa halip na biglaang pagpalit ng larawan, may maikling "paglitaw" na
// animation (cross-fade + bahagyang pop mula sa maliit) tuwing nagbabago
// ang stage - kaya lang siya nag-a-animate sa MISMONG sandali ng
// pagbabago (hindi palagi/tuluy-tuloy).
const TREE_SNOW_TRANSITION_MS = 900;

let treeSnowStage = "normal"; // "normal" | "light" | "heavy"
let treeSnowPrevStage = null;
let treeSnowStageChangedAt = 0;

function getTreeSnowStage() {
  if (!isSnowWeather()) return "normal";

  const elapsedMs = getGameNow() - getSnowStartedAtMs();

  return elapsedMs >= TREE_SNOW_HEAVY_AFTER_MS ? "heavy" : "light";
}

// Tinatawag isang beses kada frame (mula sa getResourceDrawables) -
// dinideteknay lang kung nagbago ang stage mula noong huling frame; kung
// oo, itinatabi kung ANO ang dating stage (para sa cross-fade sa ibaba)
// at KAILAN ito nagbago (para sa progreso ng animation).
function updateTreeSnowStage() {
  const stage = getTreeSnowStage();

  if (stage === treeSnowStage) return;

  treeSnowPrevStage = treeSnowStage;
  treeSnowStage = stage;
  treeSnowStageChangedAt = performance.now();
}

// AYOS (hiling ng user): "again replace the pinetree if snow use
// snowpinetree.png" - kung may sariling "snow" na larawan ang variant
// mismo (hal. GRASSMAP_TREE_VARIANT_PATHS/pinetree - snowpinetree.png),
// ITO ang gagamitin sa halip ng generic na TREE_SNOW_LIGHT_PATH/
// HEAVY_PATH (parehong stage - "light" man o "heavy" - iisa lang ang
// snow art ng pinetree, walang hiwalay na "mas matinding niyebe" na
// bersyon, hindi tulad ng "oak"-style na puno). Kung WALANG "snow"
// field ang variant (ang lumang TREE_VARIANT_PATHS - tree.png/tree1.png),
// bumabalik sa DATING gawi (generic light/heavy swap).
function getTreeImagePathForStage(variant, stage) {
  if (stage === "normal") return variant.normal;

  if (variant.snow) return variant.snow;

  if (stage === "heavy") return TREE_SNOW_HEAVY_PATH;
  if (stage === "light") return TREE_SNOW_LIGHT_PATH;

  return variant.normal;
}

const ROCK_VARIANT_PATHS = [
  {
    normal: "./assets/assets/rocks/rock.png",
    snow: "./assets/assets/rocks/snowrock.png",
  },
  {
    normal: "./assets/assets/rocks/rock1.png",
    snow: "./assets/assets/rocks/snowrock1.png",
  },
];

// GRASSMAP: bagong art na in-upload ng user (assets/objects/stones/,
// 6 na magkakaibang hugis) - "snow" ay pinareho na lang sa "normal"
// (walang ibinigay na snow-specific na larawan) - MAHALAGA ito dahil,
// hindi tulad ng puno, ang bato (drawResourceSprite) ay DIREKTANG
// gumagamit ng variant.snow field nang walang generic fallback - kung
// naiwang undefined ito, MAWAWALA/magiging invisible ang bato sa
// sandaling umulan ng niyebe.
const GRASSMAP_STONE_VARIANT_PATHS = [1, 2, 3, 4, 5, 6].map((n) => {
  const path = `./assets/objects/stones/stone${n}.png`;

  return { normal: path, snow: path };
});

// Kaparehong pattern ng getActiveTreeVariantPaths() sa itaas - direktang
// "currentWorld" check (hindi world.stoneVariantPaths field), parehong
// dahilan (script load order).
function getActiveStoneVariantPaths() {
  // AYOS (hiling ng user, "grassmap2"): parehong stone art/style.
  if (currentWorld === "grassmap" || currentWorld === "grassmap2")
    return GRASSMAP_STONE_VARIANT_PATHS;

  return ROCK_VARIANT_PATHS;
}

// Gaano kalapad (sa tiles) iguguhit ang bato - GINAGAMIT NA RIN ito ng
// getStoneCollisionBox() para eksaktong tumugma ang collision box sa
// TALAGANG nakikitang sukat ng bato (tingnan ang paliwanag doon).
const STONE_DEST_WIDTH_IN_TILES = 1.1;

// Isang beses lang i-load ang bawat larawan, itinatabi dito kada path.
const RESOURCE_IMAGES = {};

function preloadResourceImages(variantPaths) {
  for (const variant of variantPaths) {
    for (const path of [variant.normal, variant.snow, variant.cut, variant.snowCut]) {
      if (!path || RESOURCE_IMAGES[path]) continue;

      const img = new Image();

      img.src = path;
      RESOURCE_IMAGES[path] = img;
    }
  }
}

preloadResourceImages(TREE_VARIANT_PATHS);
preloadResourceImages(ROCK_VARIANT_PATHS);
preloadResourceImages(GRASSMAP_TREE_VARIANT_PATHS);
preloadResourceImages(GRASSMAP_STONE_VARIANT_PATHS);

// Hiwalay na i-preload ang 2 snow-stage na larawan ng puno (hindi na
// per-variant, iisa lang ito kada stage - tingnan ang paliwanag sa
// itaas).
for (const path of [TREE_SNOW_LIGHT_PATH, TREE_SNOW_HEAVY_PATH]) {
  const img = new Image();

  img.src = path;
  RESOURCE_IMAGES[path] = img;
}

// BAGO: dalawang bagong spritesheet ng pinetree (hiling ng user) -
// tingnan ang "PINETREE AXE-STRIKE ANIMATION" sa ibaba para sa
// detalyadong paliwanag kung paano ito ginagamit. Kasama na rin dito
// ang mga SNOW na bersyon ng mga ito (PINETREE_STRIKE_SHEET_SNOW_PATH/
// PINETREE_FALL_SHEET_SNOW_PATH), pati na ang "snowCut" (stump) na
// idinagdag sa GRASSMAP_TREE_VARIANT_PATHS sa itaas - PRELOAD lahat
// dito para AGAD nang available (RESOURCE_IMAGES) sa unang pagkakataon
// na kailangan ito (drawPinetreeStrikeFrame/drawPinetreeFallFrame/
// drawTreeStump).
for (const path of [
  PINETREE_STRIKE_SHEET_PATH,
  PINETREE_FALL_SHEET_PATH,
  PINETREE_STRIKE_SHEET_SNOW_PATH,
  PINETREE_FALL_SHEET_SNOW_PATH,
]) {
  const img = new Image();

  img.src = path;
  RESOURCE_IMAGES[path] = img;
}

// =========================
// SHAKE ANIMATION (bawat click, bago pa man maani nang buo)
// =========================
//
// Purong session-lang na estado ito (hindi naka-save) - kada click sa
// isang puno/bato na hindi pa RESOURCE_REQUIRED_HITS, umuuga ito nang
// saglit (kaliwa-kanan, humihina papunta sa dulo) bilang feedback na
// "tumama ka". Time-based tulad ng ibang effects dito.

const NODE_SHAKE_DURATION_MS = 260;
const NODE_SHAKE_AMPLITUDE = 2.4; // pixels, world space

let nodeShakeStarts = {}; // "col,row" -> performance.now() nang nag-umpisa

function spawnNodeShake(col, row) {
  nodeShakeStarts[col + "," + row] = performance.now();
}

function getNodeShakeOffsetX(col, row) {
  const startedAt = nodeShakeStarts[col + "," + row];

  if (startedAt === undefined) return 0;

  const age = performance.now() - startedAt;

  if (age >= NODE_SHAKE_DURATION_MS) return 0;

  const progress = age / NODE_SHAKE_DURATION_MS;
  const decay = 1 - progress;

  // Mabilis na pag-uga papakaliwa't pakanan, humihina papunta sa dulo.
  return Math.sin(progress * Math.PI * 6) * NODE_SHAKE_AMPLITUDE * decay;
}

// destWidth = gaano kalapad iguguhit (sa tiles), naka-anchor sa IBABA
// ng tile (parang tumutubo mula roon), sinusunod ang aspect ratio ng
// larawan mismo para hindi maunat/ma-squish.
function drawResourceSprite(node, variantPaths, destWidthInTiles) {
  const variant = variantPaths[node.variant] || variantPaths[0];

  if (!variant) return;
  const path = isSnowWeather() ? variant.snow : variant.normal;
  const img = RESOURCE_IMAGES[path];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const destWidth = TILE_SIZE * destWidthInTiles;
  const destHeight = destWidth * (img.naturalHeight / img.naturalWidth);

  const shakeOffsetX = getNodeShakeOffsetX(node.col, node.row);

  const x = node.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2 + shakeOffsetX;
  const y = node.row * TILE_SIZE + TILE_SIZE - destHeight;

  ctx.drawImage(img, x, y, destWidth, destHeight);
}

// BAGO (hiling ng user): "yung mga stones dapat kung gaano kalaki yung
// SUKAT nila (yung mismong larawan), ganun din dapat kalaki ang
// collision - hindi basta buong 1 tile" - dati, PAREHONG buong 1 TILE
// (16x16) ang collision ng bawat bato KAHIT ANO pa ang aktwal na
// hugis/sukat ng larawan nito (stone1.png hanggang stone6.png ay
// magkakaibang proportion - hal. stone1.png ay MALAPAD PERO MABABA,
// kaya kapag pinilit na buong tile ang collision, "sumosobra" ito sa
// tuktok/paligid ng kung saan TALAGA nakikita ang bato - dito nanggaling
// ang reklamo na "parang ang laki ng collisions").
//
// Ito mismo ang GINAGAMIT na formula ng drawResourceSprite sa itaas
// (destWidth batay sa STONE_DEST_WIDTH_IN_TILES, destHeight batay sa
// TUNAY na aspect ratio ng larawan) - kaya EXACTLY kasing-sukat/posisyon
// ng TALAGANG nakikitang bato ang collision box nito ngayon. "shakeOffsetX"
// (jitter animation kapag na-hit) ay SADYANG HINDI isinasama dito - hindi
// dapat "gumagalaw" ang collision kada frame kahit umuuga ang guhit.
// BAGO (2nd investigation, hiling ng user: "isang tile lang o kung
// malaki dapat 2 tile") - NAKAHANAP kami ng ACTUAL BUG kung bakit
// "pareho pa rin/malaki pa rin" ang naramdaman kahit may unang fix na:
// ang DATING bersyon nito ay UMAASA sa `img.complete`/`img.naturalWidth`
// (RESOURCE_IMAGES[path], isang <img> na Image() na kasalukuyang
// naglo-load pa sa network) SA MISMONG SANDALING tumatakbo ang
// ensureResourceNodes() - PERO tumatakbo ito NANG MAAGA (sa unang
// pagpasok sa mundo), BAGO pa man matapos mag-DOWNLOAD ang mga PNG na
// ito. Kung hindi pa "complete" ang larawan sa EKSAKTONG sandaling iyon,
// bumabalik ito sa LUMANG buong-TILE_SIZE na fallback - at dahil ISANG
// BESES LANG naman tumatakbo ang buong function na ito kada pagpasok sa
// mundo (resourceNodesValidatedFor gate), NANANATILI itong "buong tile"
// para sa BUONG SESSION na iyon, kahit na-load na pala ang larawan ilang
// segundo lang pagkatapos - kaya "parang walang epekto" ang unang fix.
//
// AYOS: NAG-MEASURE na kami (offline, sa mismong PNG files) ng TALAGANG
// pixel na sukat ng bawat isa sa 6 na variant ng bato
// (assets/objects/stones/stone1.png hanggang stone6.png) - naka-hardcode
// na ngayon dito (STONE_NATURAL_SIZES sa ibaba), kaya HINDI na
// umaasa/naghihintay sa Image() loading state - laging tama agad,
// walang race condition.
//
// RESULTA ng pag-measure: sa kasalukuyang STONE_DEST_WIDTH_IN_TILES
// (1.1x), ang PINAKAMALAKING variant (stone4) ay ~18.7px lang ang taas
// (kumpara sa 16px na TILE_SIZE) - halos 1 tile lang talaga lahat sila,
// WALANG kahit isa na kalahati pa lang ng 2 tiles (32px) - kaya sinunod
// namin ang mas simpleng hiling: ISANG TILE LANG (16x16, kaparehong-
// pareho ng puno) ang collision ng LAHAT ng bato, walang
// fractional/kakaibang sukat, walang dependency sa loading state.
const STONE_COLLISION_SIZES = {
  "./assets/objects/stones/stone1.png": { w: 8, h: 2.8 },
  "./assets/objects/stones/stone2.png": { w: 8, h: 3.2 },
  "./assets/objects/stones/stone3.png": { w: 8, h: 3.3 },
  "./assets/objects/stones/stone4.png": { w: 8, h: 3 },
  "./assets/objects/stones/stone5.png": { w: 8, h: 2.8 },
  "./assets/objects/stones/stone6.png": { w: 8, h: 2.8 },
  "./assets/assets/rocks/rock.png": { w: 8, h: 3 },
  "./assets/assets/rocks/snowrock.png": { w: 8, h: 3 },
  "./assets/assets/rocks/rock1.png": { w: 8, h: 3 },
  "./assets/assets/rocks/snowrock1.png": { w: 8, h: 3 },
};

function getStoneCollisionBox(stone) {
  const variantPaths = getActiveStoneVariantPaths();
  const variant = variantPaths[stone.variant] || variantPaths[0];
  const path = variant && (isSnowWeather() ? variant.snow : variant.normal);
  const size = (path && STONE_COLLISION_SIZES[path]) || { w: 14, h: 3 };

  return {
    x: stone.col * TILE_SIZE + TILE_SIZE / 2 - size.w / 2,
    y: stone.row * TILE_SIZE + TILE_SIZE - size.h,
    width: size.w,
    height: size.h,
  };
}

// Katulad ng drawResourceSprite pero PARA SA PUNO LANG - may 3 posibleng
// stage (normal/light-snow/heavy-snow, tingnan sa itaas) at may maikling
// "paglitaw" na animation (cross-fade + bahagyang pop) tuwing NAGBABAGO
// ang stage, hindi biglaang swap.
function drawTreeAtOpacityAndScale(
  img,
  node,
  destWidthInTiles,
  shakeOffsetX,
  alpha,
  scale,
) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const destWidth = TILE_SIZE * destWidthInTiles * scale;
  const destHeight = destWidth * (img.naturalHeight / img.naturalWidth);

  const x = node.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2 + shakeOffsetX;
  const y = node.row * TILE_SIZE + TILE_SIZE - destHeight;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x, y, destWidth, destHeight);
  ctx.restore();
}

// AYOS (hiling ng user): "again replace the pinetree if snow use
// snowpinetree.png" - ngayon, may sarili nang "snow" na larawan ang
// pinetree variant (GRASSMAP_TREE_VARIANT_PATHS, itaas) na TALAGANG
// tumutugma sa hugis nito - kaya bumalik na sa SIMPLENG paraan (basta
// TAWAGIN palagi ang getTreeImagePathForStage, kahit anong variant),
// wala nang espesyal na "laktawan ang swap" na pangangailangan pa
// (ang function mismo ang bahalang pumili ng tamang larawan kada
// variant, tingnan ang paliwanag doon).
function drawTreeSprite(node, destWidthInTiles) {
  const variant = getActiveTreeVariantPaths()[node.variant];

  if (!variant) return; // ligtas na guard - baka magkaiba na ang variant count

  const currentImg =
    RESOURCE_IMAGES[getTreeImagePathForStage(variant, treeSnowStage)];

  if (!currentImg || !currentImg.complete || currentImg.naturalWidth === 0)
    return;

  const shakeOffsetX = getNodeShakeOffsetX(node.col, node.row);

  const age = performance.now() - treeSnowStageChangedAt;
  const transitioning =
    treeSnowPrevStage !== null && age < TREE_SNOW_TRANSITION_MS;

  if (!transitioning) {
    drawTreeAtOpacityAndScale(
      currentImg,
      node,
      destWidthInTiles,
      shakeOffsetX,
      1,
      1,
    );
    return;
  }

  const progress = Math.max(0, Math.min(1, age / TREE_SNOW_TRANSITION_MS));
  const eased = 1 - Math.pow(1 - progress, 3); // ease-out - mabilis sa una, bumabagal papunta sa dulo

  const prevImg =
    RESOURCE_IMAGES[getTreeImagePathForStage(variant, treeSnowPrevStage)];

  // ILALIM: ang DATING itsura, unti-unting nawawala.
  drawTreeAtOpacityAndScale(
    prevImg,
    node,
    destWidthInTiles,
    shakeOffsetX,
    1 - eased,
    1,
  );

  // IBABAW: ang BAGONG itsura - unti-unting lumalabas (fade-in) habang
  // bahagyang "pop" mula sa mas maliit na sukat papunta sa normal, parang
  // bagong sumibol/tumakip na niyebe.
  const popScale = 0.85 + eased * 0.15;

  drawTreeAtOpacityAndScale(
    currentImg,
    node,
    destWidthInTiles,
    shakeOffsetX,
    eased,
    popScale,
  );
}

// GRASSMAP: hiling ng user - "adjust the size of the trees much taller
// than character" - ang bagong tree art dito (bigtree.png/pinetree.png)
// ay masyadong MALIIT/mababa (halos kasing-taas lang ng character) sa
// default na destWidthInTiles (2) na ginagamit ng ibang mundo. Dito na
// lang pinipili kung gaano kalapad iguguhit ang puno, base sa
// kasalukuyang mundo - mas malaki dito, para talagang "MUCH TALLER"
// kaysa sa character (56x64px).
function getActiveTreeDestWidthInTiles() {
  // BAGO: "medyo liitan mo masyadong malaki" (hiling ng user - 3rd na
  // round) - dating 7 (masyadong malaki na pala), binaba sa gitna ng
  // 5.2 (masyadong maliit dati) at 7 (masyadong malaki).
  if (currentWorld === "grassmap") return 4;

  return 4;
}

// =========================
// "CUTTEDTREE" - TUOD NG NA-CUT NA PUNO
// =========================
//
// BAGO (hiling ng user): "kapag na cut yung specific na tree kung ano
// yung name yun yung ilalagay sa mismong cuttedtree" - habang
// naghihintay ang isang puno na "tumubo ulit" (TREE_REGROW_MS,
// tingnan sa itaas), sa halip na basta mawala/maging blangko ang tile
// (dating gawi - wala pang art ng tuod noon), ipinapakita na ngayon
// ang TAMANG "cut" na larawan mula sa variant NG MISMONG puno na
// na-chop (bigtree -> bigtreecut.png, pinetree -> pinetreecut.png -
// tingnan ang GRASSMAP_TREE_VARIANT_PATHS).
//
// BAGO (2nd hiling): "yung mismong pinetreecut at bigtreecut is
// accurate mo yung size sa mismong ibaba trunk ng pinetree at
// bigtree" - VERIFIED sa pamamagitan ng Python/Pillow (detalyadong
// row-by-row na pixel inspection ng bottom rows ng bigtree.png/
// pinetree.png): ang tuod/trunk sa PINAKA-IBABA (ground level) ng
// BUONG puno ay humigit-kumulang 16px (bigtree, sa 87px na kabuuang
// lapad = ~18.4%) at ~14-16px (pinetree, sa 77px = ~18-20%) - kaya
// halos MAGKAPAREHONG porsyento ang dalawa (~19%) ng KABUUANG lapad ng
// larawan ng puno, hindi kasing-lapad ng buong canopy/dahon.
//
// BAGO (3rd hiling - "di parin accurate"): ayon sa mas maingat na
// muling sukat sa itaas, medyo MALAKI ang dating 0.22 kumpara sa
// TALAGANG ~0.19 na fraction - binaba dito.
const TREE_STUMP_WIDTH_FRACTION = 0.27;

function drawTreeStump(node, treeDestWidthInTiles) {
  const variant = getActiveTreeVariantPaths()[node.variant];

  if (!variant || !variant.cut) return; // walang art ng tuod ang variant na ito

  // AYOS (hiling ng user): "may inadd ako na snowpinetreecut... dapat
  // palitan mo na yung snow aok tree ng mga yan para accurate yung
  // tree" - gamitin ang dedikadong SNOW na bersyon ng tuod (snowCut)
  // kapag umuulan ng niyebe, kung meron (may fallback pa rin sa normal
  // na "cut" kung sakaling walang snowCut na field/larawan).
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const path = snowing && variant.snowCut ? variant.snowCut : variant.cut;

  const img = RESOURCE_IMAGES[path];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const destWidth =
    TILE_SIZE * treeDestWidthInTiles * TREE_STUMP_WIDTH_FRACTION;
  const destHeight = destWidth * (img.naturalHeight / img.naturalWidth);

  // BAGO (hiling ng user): "kapag nagamitan ng axe [ang pinetreecut]
  // is dapat nag shake din gaya dun ng di pa siya putol" - parehong
  // getNodeShakeOffsetX/spawnNodeShake (itaas, ginagamit na rin ng
  // drawTreeSprite/drawPinetreeStrikeFrame) - tinatawag na rin ito ni
  // registerStumpHit sa ibaba kada hit laban sa tuod, kaya kailangan
  // lang dito ay basahin/i-apply ang parehong offset.
  const shakeOffsetX = getNodeShakeOffsetX(node.col, node.row);

  // Parehong (col, row) bottom-anchor gaya ng buong puno (drawTreeSprite)
  // - kaya EKSAKTONG nasa TALAGANG puwesto ng dating trunk ang tuod.
  const x = node.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2 + shakeOffsetX;
  const y = node.row * TILE_SIZE + TILE_SIZE - destHeight;

  ctx.drawImage(img, x, y, destWidth, destHeight);
}

// =========================
// PINETREE - PAGGUHIT NG STRIKE/FALL ANIMATION FRAMES
// =========================
//
// Tingnan ang paliwanag/mga constant sa itaas (PINETREE AXE-STRIKE
// ANIMATION) - dito na ang aktwal na PAGGUHIT gamit ang mga ito.

// Isang frame lang (base sa bilang ng hits, 1-7) mula sa
// pinetreecutanimation.png - PAREHONG anchor formula sa
// drawTreeAtOpacityAndScale/drawTreeSprite (walang extra offset,
// dahil magkapareho ang laki/posisyon ng trunk sa pinetree.png at sa
// bawat frame nito).
function drawPinetreeStrikeFrame(node, treeDestWidthInTiles, hits) {
  // AYOS (hiling ng user): "may inadd ako na snowpinetreecutanimation
  // ... dapat palitan mo na yung snow aok tree ng mga yan para
  // accurate yung tree at animations kapag nag gamit ako ng axe" -
  // gamitin ang dedikadong SNOW na bersyon ng strike sheet kapag
  // umuulan ng niyebe (PAREHONG eksaktong laki/bilang ng frame, kaya
  // walang ibang kailangang baguhin sa ibaba).
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const sheetPath = snowing
    ? PINETREE_STRIKE_SHEET_SNOW_PATH
    : PINETREE_STRIKE_SHEET_PATH;

  const img = RESOURCE_IMAGES[sheetPath];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const frameIndex = Math.max(
    0,
    Math.min(PINETREE_STRIKE_FRAME_COUNT - 1, hits - 1),
  );

  const destWidth = TILE_SIZE * treeDestWidthInTiles;
  const destHeight =
    destWidth * (PINETREE_STRIKE_FRAME_HEIGHT / PINETREE_STRIKE_FRAME_WIDTH);

  const shakeOffsetX = getNodeShakeOffsetX(node.col, node.row);

  const x = node.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2 + shakeOffsetX;
  const y = node.row * TILE_SIZE + TILE_SIZE - destHeight;

  ctx.drawImage(
    img,
    frameIndex * PINETREE_STRIKE_FRAME_WIDTH,
    0,
    PINETREE_STRIKE_FRAME_WIDTH,
    PINETREE_STRIKE_FRAME_HEIGHT,
    x,
    y,
    destWidth,
    destHeight,
  );
}

// Session-lang na estado (hindi naka-save, katulad ng nodeShakeStarts) -
// "col,row" -> performance.now() nang nagsimula ang pagbagsak. Ginagamit
// para malaman kung ANONG FRAME ng pinetreecuttedanimation.png ang
// iguguhit ngayon, at kung kailan na ito dapat tuluyang mawala.
let pinetreeFallStarts = {};

function spawnPinetreeFallAnimation(col, row) {
  pinetreeFallStarts[col + "," + row] = performance.now();
}

// Nagbabalik ng edad (ms) ng fall animation kung AKTIBO pa ito, o null
// kung wala/tapos na (awtomatikong nililinis dito ang estado sa
// sandaling matapos - dumadaan na ang pagguhit sa normal na
// "pendingRegrow -> drawTreeStump" na batayan, tingnan ang
// getResourceDrawables).
function getPinetreeFallProgress(col, row) {
  const key = col + "," + row;
  const startedAt = pinetreeFallStarts[key];

  if (startedAt === undefined) return null;

  const age = performance.now() - startedAt;

  if (age >= PINETREE_FALL_TOTAL_MS) {
    delete pinetreeFallStarts[key];
    return null;
  }

  return age;
}

function drawPinetreeFallFrame(node, treeDestWidthInTiles, age) {
  // AYOS (hiling ng user, tingnan ang paliwanag sa drawPinetreeStrikeFrame
  // sa itaas) - dedikadong SNOW na bersyon ng fall sheet kapag umuulan
  // ng niyebe.
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const sheetPath = snowing
    ? PINETREE_FALL_SHEET_SNOW_PATH
    : PINETREE_FALL_SHEET_PATH;

  const img = RESOURCE_IMAGES[sheetPath];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const frameIndex = Math.max(
    0,
    Math.min(
      PINETREE_FALL_FRAME_COUNT - 1,
      Math.floor(age / PINETREE_FALL_FRAME_MS),
    ),
  );

  // Parehong scale factor (base sa 77px na natural width ng
  // pinetree.png/pinetreecutanimation.png) gaya ng normal/strike frame -
  // kaya CONSISTENT ang sukat ng trunk sa lahat ng stage (idle ->
  // strike -> fall), walang biglaang pagbabago ng laki.
  const scale =
    (TILE_SIZE * treeDestWidthInTiles) / PINETREE_STRIKE_FRAME_WIDTH;
  const destWidth = PINETREE_FALL_FRAME_WIDTH * scale;
  const destHeight = PINETREE_FALL_FRAME_HEIGHT * scale;

  // I-anchor base sa TRUNK (hindi sa buong lapad ng mas malapad na
  // frame na ito) - tingnan ang paliwanag sa itaas ng
  // PINETREE_TRUNK_LEFT_EDGE_SRC/PINETREE_FALL_TRUNK_LEFT_EDGE_SRC -
  // para walang biglaang "jump" sa posisyon ng puno sa sandaling
  // magsimula ang fall animation (mula sa dating anchor ng idle/strike
  // frame patungo sa mas malapad na canvas ng fall frame).
  const idleLeftEdgeX =
    node.col * TILE_SIZE +
    TILE_SIZE / 2 -
    (PINETREE_STRIKE_FRAME_WIDTH * scale) / 2;
  const trunkWorldX = idleLeftEdgeX + PINETREE_TRUNK_LEFT_EDGE_SRC * scale;
  const x = trunkWorldX - PINETREE_FALL_TRUNK_LEFT_EDGE_SRC * scale;

  // BAGO (hiling ng user, tingnan ang paliwanag sa
  // PINETREE_FALL_SNOW_FRAME_BOTTOM_GAP_SRC sa itaas) - kapag SNOW na
  // bersyon ang iginuguhit, dinaragdag ang naka-scale na "gap" ng
  // FRAME na ito (kung meron man) sa Y, para ang TALAGANG nakikitang
  // puno (hindi ang canvas mismo) ang naka-dikit sa lupa, kahit may
  // blangkong puwang pa sa ilalim ng canvas nito.
  const snowBottomGapSrc = snowing
    ? PINETREE_FALL_SNOW_FRAME_BOTTOM_GAP_SRC[frameIndex] || 0
    : 0;
  const y =
    node.row * TILE_SIZE + TILE_SIZE - destHeight + snowBottomGapSrc * scale;

  ctx.drawImage(
    img,
    frameIndex * PINETREE_FALL_FRAME_WIDTH,
    0,
    PINETREE_FALL_FRAME_WIDTH,
    PINETREE_FALL_FRAME_HEIGHT,
    x,
    y,
    destWidth,
    destHeight,
  );
}

// =========================
// OCCLUSION BBOX NG PUNO (opacity kapag likod ng puno ang player)
// =========================
//
// BAGO (bug fix, hiling ng user, 1st round): "opacity mo kapag
// napalikod yung character sa tree" - SANHI ng UNANG bug: ang lumang
// bbox formula ay nag-a-apply ng PAREHONG "treeBboxScale" sa PAREHONG
// y-offset (itaas) AT height nito - pero dapat ang BOTTOM ng bbox ay
// LAGING nakatapat sa TALAGANG ANCHOR ng puno (tree.row*TILE_SIZE +
// TILE_SIZE, kaparehong ginagamit ng drawTreeSprite). Naayos na ito -
// hiwalay na ngayon ang scale ng LAPAD laban sa TAAS, at LAGING
// nakatapat sa bottom-anchor.
//
// BAGO (2nd round - "di pa rin gumagana"): kahit tama na ang anchor,
// MASYADONG MAKITID pa rin ang bbox (18-19% lang ng lapad, "trunk
// only") kumpara sa TALAGANG NAKIKITANG canopy/dahon ng puno (lalo na
// ngayong 6-7 tiles ang lapad ng buong puno!) - kaya karamihan sa mga
// pagkakataong "likod ng puno" ang player (behind the WIDE canopy,
// hindi lang sa gitna ng manipis na trunk) ay HINDI na-de-detect bilang
// overlap - nawawala/natatago na lang nang buo ang character (walang
// fade) sa halip na lumabo/makita pa rin. AYOS: ang bbox ay gagamit na
// ngayon ng HALOS BUONG rendered silhouette ng puno (parehong lapad/
// taas ng aktwal na drawTreeSprite) - kaya kahit saang bahagi ng
// canopy "tumago" ang player, tumatama ang overlap check at lumalabo
// ang puno (makikita pa rin ang character sa likod nito).
function getTreeOcclusionBbox(tree, treeDestWidthInTiles) {
  const variant = getActiveTreeVariantPaths()[tree.variant];
  const img = variant ? RESOURCE_IMAGES[variant.normal] : null;

  const destWidth = TILE_SIZE * treeDestWidthInTiles;
  const naturalAspect =
    img && img.complete && img.naturalWidth
      ? img.naturalHeight / img.naturalWidth
      : 1.25; // ligtas na default kung hindi pa naka-load ang larawan
  const destHeight = destWidth * naturalAspect;

  // Halos buong lapad/taas ng TALAGANG naka-render na puno (90%) - hindi
  // 100% nang eksakto, para hindi masyadong sensitibo/agad-agad
  // mag-trigger sa pinaka-gilid na transparent na bahagi ng larawan.
  const bboxWidth = destWidth * 0.9;
  const bboxHeight = destHeight * 0.9;

  const treeBottomY = tree.row * TILE_SIZE + TILE_SIZE; // parehong anchor ng drawTreeSprite
  const treeCenterX = tree.col * TILE_SIZE + TILE_SIZE / 2;

  return {
    x: treeCenterX - bboxWidth / 2,
    y: treeBottomY - bboxHeight,
    width: bboxWidth,
    height: bboxHeight,
  };
}

function getResourceDrawables() {
  ensureResourceNodes();
  updateTreeSnowStage();

  if (!resourceNodesCache) return [];

  const harvested = getHarvestedForCurrentWorld();
  const drawables = [];
  const treeDestWidthInTiles = getActiveTreeDestWidthInTiles();

  for (const tree of resourceNodesCache.trees) {
    const key = tree.col + "," + tree.row;
    const isPinetree =
      (currentWorld === "grassmap" || currentWorld === "grassmap2") &&
      tree.variant === PINETREE_VARIANT_INDEX;

    // BAGO (hiling ng user: "i want the animation of the axe make it
    // behind of the pinetree") - habang AKTIBONG tumatakbo pa ang axe
    // swing (player.putting + puttingSpriteSet === "axeStrike") laban
    // sa MISMONG puno na ito - i-force ang puno na ito na mag-drawing
    // NA PARANG NASA HARAP/IBABAW ng player (napaka-laking sortY) - ang
    // resulta: PARANG NASA LIKOD ng puno ang kamay/axe ng player habang
    // humahampas.
    const isSwingingAxeAtThisTree =
      axeStrikeTargetTreeKey === key &&
      typeof player !== "undefined" &&
      player.putting &&
      typeof puttingSpriteSet !== "undefined" &&
      puttingSpriteSet === "axeStrike";

    const treeSortY = tree.row * TILE_SIZE + TILE_SIZE;
    const drawSortY = isSwingingAxeAtThisTree
      ? Number.MAX_SAFE_INTEGER
      : treeSortY;

    // AYOS (hiling ng user: "erase the opacity of the pinetree when
    // using axe" -> "still have opacity, check the video ... i want
    // only the shaking not opacity") - SANHI ng "still opacity" kahit
    // may naunang fix na (WALANG bbox habang `isSwingingAxeAtThisTree`):
    // ang SWING ANIMATION mismo ay MAIKLI lang (~350ms, AXE_STRIKE_
    // FRAME_COUNT x FRAME_SPEED) kumpara sa RESOURCE_HIT_COOLDOWN_MS
    // (1000ms) bago puwedeng mag-click ulit - kaya may ~650ms na
    // PAUSE sa PAGITAN ng dalawang magkasunod na hampas kung saan
    // `player.putting` ay BALIK na sa `false` (tapos na ang isang
    // swing animation, pero hindi pa rin nagre-release ang mouse/
    // hindi pa rin lumilipat ng puno ang user) - sa maikling window
    // na iyon, bumabalik ang NORMAL na occlusion bbox (dahil `false`
    // na ang `isSwingingAxeAtThisTree`), kaya nag-fa-fade ulit ang
    // puno saglit BAGO ang susunod na swing - paulit-ulit ito sa BAWAT
    // pagitan ng hampas, kaya "kumikislap"/nagpapalit-palit ng opacity
    // ang buong "combo" sa halip na tuluyang mawala ito - ito ang
    // TALAGANG nakita sa video.
    //
    // AYOS: hiwalay na ngayon ang basehan ng "walang bbox/fade"
    // (`suppressFadeForAxe` sa ibaba) sa basehan ng "i-force sa harap"
    // (`isSwingingAxeAtThisTree` sa itaas, PANANATILIHIN lang habang
    // TALAGANG kumikilos ang swing animation - hindi kailangan bago
    // ito). Ang `suppressFadeForAxe` ay TUMATAGAL nang MAS MAHABA -
    // solid/walang fade LAGI habang ANG PUNONG ITO pa rin ang
    // KASALUKUYANG tinatarget ng axe (`axeStrikeTargetTreeKey`) AT
    // may hampas na naitala sa loob ng `AXE_STRIKE_NO_FADE_GRACE_MS`
    // (mas mahaba pa sa RESOURCE_HIT_COOLDOWN_MS, kaya SAKOP na ang
    // buong pagitan ng dalawang magkasunod na click/hampas, walang
    // pagitan/kislap) - bumabalik lang ang normal na fade kapag
    // TALAGANG TUMIGIL na (o lumipat ng ibang target) ang user sa
    // sapat na katagalan.
    const suppressFadeForAxe =
      axeStrikeTargetTreeKey === key &&
      Date.now() - lastResourceHitAt < AXE_STRIKE_NO_FADE_GRACE_MS;

    if (isNodeFullyHarvested(harvested, key, "wood")) {
      // BAGO (hiling ng user): habang TUMATAKBO pa ang "pagbagsak" na
      // animation (pinetreecuttedanimation.png) - ipakita LANG ang
      // animation frame, WALANG kasabay na stump/tuod. Sa sandaling
      // MATAPOS na ito (getPinetreeFallProgress ay nagbabalik ng null),
      // dumadaloy na patungo sa PAREHONG "pendingRegrow -> drawTreeStump"
      // na batayan sa ibaba, tulad ng ibang puno - "dapat mag-appear
      // yung mismong pinetreecut.png, stay lang yun sa mismong tile
      // habang hindi pa tumutubo ulit yung puno".
      if (isPinetree) {
        const fallAge = getPinetreeFallProgress(tree.col, tree.row);

        if (fallAge !== null) {
          drawables.push({
            sortY: drawSortY,
            order: -1,
            draw: () =>
              drawPinetreeFallFrame(tree, treeDestWidthInTiles, fallAge),
            // AYOS (hiling ng user): "nag oopacity parin yung
            // pinetreecutanimation e dapat normal na lang siya na
            // wala ng opacity" - dating may `bbox` pa rin dito
            // (getTreeOcclusionBbox), kaya kahit BUMABAGSAK na ang
            // puno (hindi na aktibong hinahampas ng axe), puwede pa
            // rin itong mag-fade kapag nag-overlap ang bbox sa
            // player (shouldOccludeForPlayer, map.js). WALANG "bbox"
            // na dapat dito - normal/opaque LAGI ang buong
            // "pagbagsak" na animation, wala nang see-through occlusion.
          });

          continue;
        }
        // tapos na ang fall animation (o hindi na kailangan pa, hal.
        // pagkatapos mag-reload) - dumadaan na sa normal na
        // stump-habang-naghihintay-ng-regrow na batayan sa ibaba.
      }

      // BAGO: habang naghihintay pa ng TREE_REGROW_MS (may schedule pa
      // sa getTreeRegrowScheduleForCurrentWorld) - ipakita ang tuod ng
      // MISMONG puno na na-cut (bigtreecut/pinetreecut) sa halip na
      // basta mawala/maging blangko ang tile.
      const pendingRegrow =
        getTreeRegrowScheduleForCurrentWorld()[key] !== undefined;

      // BAGO (hiling ng user): "dapat mawala na yung pinetreecut na
      // yon" pagkatapos masira (3 hits ng axe, tingnan ang
      // "PAGSIRA SA TUOD/STUMP" sa itaas) - huwag nang iguhit ang
      // tuod kapag naabot na ang STUMP_REQUIRED_HITS, KAHIT may
      // schedule pa (tuloy pa rin ito sa likod-tabi - hindi ito
      // ginagalaw, tingnan ang updateTreeRegrowth) - blangko na lang
      // muna ang tile hanggang sa TALAGANG tumubo ulit ang puno.
      if (pendingRegrow && !isStumpDestroyed(key)) {
        drawables.push({
          sortY: treeSortY,
          order: -1,
          draw: () => drawTreeStump(tree, treeDestWidthInTiles),
        });
      }

      continue; // pinutol na - hindi na ito ang buong puno
    }

    // BAGO (pinetree lang): kapag may hits na (bago pa na-cut nang
    // tuluyan) - ipakita ang katumbas na frame ng
    // pinetreecutanimation.png (hit 1 = frame 1, ..., hit 7 = frame 7)
    // sa halip na ang normal/idle na larawan - tingnan ang
    // "PINETREE AXE-STRIKE ANIMATION" sa itaas.
    const hits = harvested[key] || 0;

    if (isPinetree && hits > 0) {
      drawables.push({
        sortY: drawSortY,
        order: -1,
        draw: () => drawPinetreeStrikeFrame(tree, treeDestWidthInTiles, hits),
        // AYOS: "suppressFadeForAxe" (tingnan ang buong paliwanag sa
        // itaas) sa halip na ang literal na "isSwingingAxeAtThisTree"
        // (masyadong MAIKLI lang ang window nito, kaya kumikislap pa
        // rin sa pagitan ng bawat hampas) - WALANG "bbox" dito habang
        // kasalukuyan pa ring tinatarget/kararampot lang na-hampas ang
        // puno na ito, kaya hindi na ito matatamaan ng
        // `shouldOccludeForPlayer` (map.js, "if (item.isPlayer ||
        // !item.bbox) return false") - LAGING SOLID/opaque ang puno
        // sa BUONG "combo" ng paghampas (hindi lang sa isang swing),
        // PERO nasa HARAP pa rin (drawSortY) habang TALAGANG kumikilos
        // ang swing animation. Bumabalik ang normal na occlusion bbox
        // (fade kapag likod ng player) sa sandaling TALAGANG tumigil
        // na (o lumipat ng ibang target) ang user.
        bbox: suppressFadeForAxe
          ? undefined
          : getTreeOcclusionBbox(tree, treeDestWidthInTiles),
      });
      continue;
    }

    drawables.push({
      sortY: drawSortY,
      order: -1,
      // Tandaan: dating may anino dito (drawGroundShadow) - TINANGGAL
      // (bahagi 7, item 18 sa CLAUDE.md) - nagdulot ito ng LAG (maraming
      // puno kada mundo, TREE_COUNT_PER_WORLD = 10, PLUS blur filter
      // per-frame kada isa - mabigat sa canvas). Ang oldman/pig/player
      // LANG (kaunti/iisa lang sila) ang may anino ngayon.
      draw: () => drawTreeSprite(tree, treeDestWidthInTiles),
      // AYOS (hiling ng user - tingnan ang paliwanag sa itaas): parehong
      // "walang bbox habang suppressFadeForAxe" na lohika - kahit anong
      // puno (hindi lang pinetree may hits pa) ay hindi dapat mag-fade
      // habang kasalukuyan pa ring tinatarget/kararampot lang na-hampas
      // ng axe.
      bbox: suppressFadeForAxe
        ? undefined
        : getTreeOcclusionBbox(tree, treeDestWidthInTiles),
    });
  }

  for (const stone of resourceNodesCache.stones) {
    const key = stone.col + "," + stone.row;

    if (isNodeFullyHarvested(harvested, key, "stone")) continue; // wala nang natitira

    // Walang "bbox" dito (sadya) - puno/bahay LANG ang dapat mag-see-
    // through occlusion (tingnan ang shouldOccludeForPlayer sa map.js),
    // hindi ang bato (mababa lang ito, hindi naman siya nakakatago sa
    // player).
    drawables.push({
      sortY: stone.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      draw: () =>
        drawResourceSprite(
          stone,
          getActiveStoneVariantPaths(),
          STONE_DEST_WIDTH_IN_TILES,
        ),
    });
  }

  return drawables;
}

// =========================
// PAG-AANI (click gamit ang pickaxe/axe)
// =========================

const RESOURCE_HARVEST_MIN_YIELD = 1;
const RESOURCE_HARVEST_MAX_YIELD = 2;

function randomResourceYield() {
  return (
    RESOURCE_HARVEST_MIN_YIELD +
    Math.floor(
      Math.random() *
        (RESOURCE_HARVEST_MAX_YIELD - RESOURCE_HARVEST_MIN_YIELD + 1),
    )
  );
}

// AYOS (hiling ng user: "gawin mo siyang parang new player na walang
// gamit o kahit ano") - TALAGANG 0 na ngayon ang panimulang stock
// (dating 99/99 na "pambubura"/testing default) - kailangan munang
// pumutol ng puno/bumato tulad ng dapat sa isang totoong bagong
// manlalaro. Tingnan din ang loadInventoryState (inventory-save.js) -
// doon na rin TALAGANG "HULING salita" kung ano ang laman sa simula.
let woodCollected = 0;
let stoneCollected = 0;

// Bilang ng gold - ipinapakita sa ilalim-kanang sulok ng bag panel
// (tingnan ang syncBagPanel sa hotbar.js). Wala pa tayong paraan para
// kumita nito sa loob ng laro (walang tindahan/shop pa) - naka-laan
// muna ito bilang UI para sa susunod na feature.
let goldCollected = 0;

function collectWood(count) {
  woodCollected += count;
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

function collectStone(count) {
  stoneCollected += count;
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

function collectGold(count) {
  goldCollected += count;
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatanggal ang collision box ng isang partikular na tile - ginagamit
// pagkatapos maani, para hindi na nakababara ang tuod/nawalang bato.
// BAGO: gamit na ang "resourceKey" tag (idinagdag ng ensureResourceNodes/
// updateTreeRegrowth) sa halip na EKSAKTONG x/y match - kailangan ito
// dahil hindi na laging buong-tile (col*TILE, row*TILE) ang collision
// box ngayon (tingnan ang getStoneCollisionBox - naka-center/naka-anchor
// sa ibaba ang bato, kaya maaaring magkaiba ang x/y nito sa col*TILE/
// row*TILE mismo).
function removeResourceCollisionAt(col, row) {
  const key = col + "," + row;

  collisions = collisions.filter(
    (box) =>
      box.resourceKey !== key &&
      !(box.x === col * TILE_SIZE && box.y === row * TILE_SIZE),
  );
}

function findTreeAt(col, row) {
  if (!resourceNodesCache) return null;

  return resourceNodesCache.trees.find(
    (tree) => tree.col === col && tree.row === row,
  );
}

// BAGONG HILING: "throw in random area of the tile only 1 tile... add
// 1 tile" - kumukuha ng random na KATABING tile (eksaktong 1 tile ang
// layo, alinman sa 8 direksyon sa palibot) - ginagamit ng registerHit
// (itaas) para sa paglalapag ng nakolektang wood, para hindi ito
// nakapatong mismo sa tuod/tinutubuan ulit na puno.
function getRandomAdjacentTile(col, row) {
  const offsets = [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ];

  const offset = offsets[Math.floor(Math.random() * offsets.length)];

  return { col: col + offset.dx, row: row + offset.dy };
}

function findStoneAt(col, row) {
  if (!resourceNodesCache) return null;

  return resourceNodesCache.stones.find(
    (stone) => stone.col === col && stone.row === row,
  );
}

// Isang click = isang "hit". Sa bawat hit (bago pa maabot ang
// RESOURCE_REQUIRED_HITS): umuuga lang ang node (spawnNodeShake) bilang
// feedback. Sa HULING hit: saka lang talaga tinatanggal ang node,
// binibigyan ng ani, at lumalapag ang mga piraso nito sa lupa (tingnan
// ang GROUND_ITEM_LAND_MS sa ground-items.js).
function registerHit(col, row, itemId) {
  const harvested = getHarvestedForCurrentWorld();
  const key = col + "," + row;

  if (isNodeFullyHarvested(harvested, key, itemId)) {
    // BAGO (hiling ng user): "yung pinetreecut is kapag lumabas na
    // dapat gagamitan pa rin ng axe" - tuod/stump na lang ang natitira
    // dito (kung meron man), kaya subukang i-route bilang isang "hit"
    // laban dito sa halip (tingnan ang "PAGSIRA SA TUOD/STUMP" sa
    // itaas) - kahit anong mangyari, wala nang ibang gagawin ang
    // regular na pag-ani sa ibaba (tapos na ang puno/bato mismo).
    if (itemId === "wood" && canChopStumpAt(col, row)) {
      registerStumpHit(col, row);
    }

    return; // wala nang matitira sa puno/bato mismo
  }

  const hits = (harvested[key] || 0) + 1;

  harvested[key] = hits;
  saveHarvestedResources();
  spawnNodeShake(col, row);

  // BAGO: ang pinetree (PINETREE_VARIANT_INDEX) ay MISMONG 7 hits
  // laging kailangan (hindi ang generic getRequiredHitsFor(itemId), na
  // 6 o 10 depende sa tool) - dahil dapat tumugma nang eksakto ang
  // bilang ng hit sa bilang ng frame ng strike animation nito (tingnan
  // ang PINETREE_REQUIRED_HITS/"PINETREE AXE-STRIKE ANIMATION" sa
  // itaas), kahit anong tool (axe o kamao) ang ginamit.
  const tree = itemId === "wood" ? findTreeAt(col, row) : null;
  const isPinetree =
    tree &&
    (currentWorld === "grassmap" || currentWorld === "grassmap2") &&
    tree.variant === PINETREE_VARIANT_INDEX;
  const requiredHits = isPinetree
    ? PINETREE_REQUIRED_HITS
    : getRequiredHitsFor(itemId);

  if (hits < requiredHits) return;

  // AYOS (bug report ng user): "kapag naputol ko gamit axe, tapos
  // kapag na-unequip ko, lumalabas ulit yung na-chop ko na tree; tapos
  // kapag na-equip ko ulit, nawawala ulit" - SANHI: si
  // `isNodeFullyHarvested()` ay INULIT na kinukwenta (bawat frame,
  // bawat click) kung "TAPOS NA ba" ang node sa pamamagitan ng
  // paghahambing ng `harvested[key]` (fixed na bilang ng hit) laban sa
  // `getRequiredHitsFor(itemId)` - PERO ang required na iyon ay
  // NAGBABAGO depende sa KASALUKUYANG naka-equip na tool (6 kapag may
  // tamang tool, 10 kapag kamao lang) - kaya kapag naputol gamit ang
  // axe (6 hits, "tapos na" ito laban sa 6), tapos ina-unequip ang axe,
  // biglang naging 10 ang required, at 6 < 10, kaya "hindi pa pala
  // tapos" ulit ang parehong node - lumalabas/bumabalik ito. AYOS: sa
  // sandaling TALAGANG matapos (dito mismo, itong linyang ito) -
  // itinatakda na natin ang `harvested[key]` sa
  // RESOURCE_HARVESTED_SENTINEL (hindi na basta ang eksaktong bilang ng
  // hit, at HINDI rin `Infinity` - tingnan ang paliwanag doon kung
  // bakit) - PERMANENTENG "tapos na" ito kahit anong tool pa ang
  // mai-equip/i-unequip pagkatapos, dahil laging >= ito kahit anong
  // required na threshold (6 o 10).
  harvested[key] = RESOURCE_HARVESTED_SENTINEL;
  saveHarvestedResources();

  removeResourceCollisionAt(col, row);

  // AYOS (hiling ng user): "may duration na rin kada gamit siguro 50
  // trees, stones" - isang buong pagkakaputol ng puno (axe) o
  // pagkaka-mina ng bato (pickaxe) = 1 "gamit"/hit sa durability ng
  // kaukulang tool (tingnan ang useToolDurability, dig.js). Ligtas
  // ito - kailangan na talagang naka-equip ang tamang tool bago pa man
  // maabot ang puntong ito (walang bare-hand/kamao fallback, tingnan
  // ang mousedown listener sa ibaba).
  if (typeof useToolDurability === "function") {
    useToolDurability(itemId === "wood" ? "axe" : "pickaxe");
  }

  // BAGO (hiling ng user): "kada tapos ng pag pickaxe or axe sa pag
  // putol ng puno is nababawasan yung foods duration ng -3 trees or
  // stones" - shared na decreaseFoodDuration (hotbar.js), tinatawag
  // ISANG BESES LANG dito, sa SANDALING TALAGANG matapos/na-harvest
  // ang buong puno/bato (hindi kada click/hit).
  if (typeof decreaseFoodDuration === "function") {
    decreaseFoodDuration(3);
  }

  // BAGONG HILING: para sa PUNO lang (itemId === "wood") - sa halip na
  // permanenteng mawala dito at magpalabas ng BAGONG puno sa IBANG
  // lugar (dating gawi ng "1-MINUTONG RESPAWN SCHEDULE" sa itaas -
  // tinanggal na ang "trees" na sanga niyon, tingnan ang
  // updateResourceRespawns), ang PAREHONG puno sa PAREHONG (col,row) na
  // ito ang "tutubo ulit" pagkatapos ng TREE_REGROW_MS - tingnan ang
  // updateTreeRegrowth() sa itaas.
  if (itemId === "wood") {
    getTreeRegrowScheduleForCurrentWorld()[key] = getGameNow() + rollResourceRegrowMs();
    saveTreeRegrowSchedule();

    // AYOS (bug report ng user, buhat sa video: "yung pinetreecut...
    // nadadaanan pa rin") - ITO ang NAWAWALANG bahagi noong una: dating
    // ensureResourceNodes() LANG (isang beses lang tumatakbo kada
    // PAGPASOK sa mundo) ang naglalagay ng collision ng tuod, kaya kapag
    // na-chop MISMO habang naglalaro (walang paglabas/pagpasok ulit sa
    // mundo), tinatanggal lang ng removeResourceCollisionAt sa itaas ang
    // collision ng puno - WALANG nagdaragdag pabalik nito para sa tuod
    // na lalabas. Dito na ito idinaragdag AGAD, sa sandaling
    // "opisyal" nang tuod (may schedule na, may art pa) ang tile na ito.
    if (treeVariantHasStumpArt(tree ? tree.variant : 0)) {
      addStumpCollision(col, row);
    }
  }

  // BAGO (pinetree lang): i-play ang isang beses na "pagbagsak" na
  // animation (pinetreecuttedanimation.png) - tingnan ang
  // spawnPinetreeFallAnimation/getPinetreeFallProgress at ang paggamit
  // nito sa getResourceDrawables (itaas).
  if (isPinetree) {
    spawnPinetreeFallAnimation(col, row);
  }

  const yieldCount = randomResourceYield();

  // Hindi na deretso sa bag - nakalapag muna sa lupa, damputin gamit
  // ang kamay (tingnan ang ground-items.js). Hiwa-hiwalay na piraso
  // (isa kada wood/stone) - kaya kailangang isa-isahin ang pagdampot,
  // hindi basta isang click na lang para sa buong ani.
  //
  // BAGONG HILING (puno lang/"wood"): huwag na ilapag ang piraso sa
  // MISMONG tile ng puno mismo - "throw in random area of the tile
  // only 1 tile... add 1 tile" - kaya kumukuha ng random na KATABING
  // tile (1 tile ang layo, alinman sa 8 direksyon) PER PIRASO, para may
  // pakiramdam ng "nagkalat"/natapon ang kahoy sa palibot ng puno sa
  // halip na nakatambak lang mismo sa ilalim nito. Ang bato ("stone")
  // ay HINDI ginalaw - doon pa rin mismo sa sariling tile nito
  // lumalapag, tulad ng dati.
  if (typeof spawnGroundItem === "function") {
    for (let i = 0; i < yieldCount; i++) {
      const dropTile =
        itemId === "wood" && typeof getRandomAdjacentTile === "function"
          ? getRandomAdjacentTile(col, row)
          : { col, row };

      spawnGroundItem(
        dropTile.col,
        dropTile.row,
        itemId,
        1,
        i * GROUND_ITEM_SPAWN_STAGGER_MS,
      );
    }
  } else if (itemId === "wood") {
    collectWood(yieldCount);
  } else if (itemId === "stone") {
    collectStone(yieldCount);
  }

  // BAGONG HILING: hindi na dito basta agad "inililipat"/inire-respawn
  // ang node - PERMANENTE na itong nawawala dito (harvestedResources
  // na naka-save sa itaas ang bahalang tumandaan nito, hindi na
  // babalik pagkatapos mag-reload/lumipat ng mundo). Ang PAGPAPALIT
  // dito ay gawain na ngayon ng 15-minutong respawn system
  // (updateResourceRespawns, tinatawag kada frame mula sa update.js) -
  // tingnan ang "AUTO-REGENERATION" sa ibaba. (Ang PUNO/"wood" ay may
  // SARILI na ngayong ibang paraan - tingnan ang paliwanag sa itaas.)

  // Bagong LEVEL/EXP system (hotbar.js) - maliit na exp kada
  // pagpuputol/pagmimina, para may TUNAY na dahilan mag-level up.
  if (typeof gainExp === "function") gainExp(3);
}

// =========================
// AUTO-REGENERATION (bagong node, isa-isa kada 15 minuto ng game time)
// =========================
//
// DATING GAWI (na TINANGGAL na ngayon - bug ayon sa hiling): dati,
// agad/INSTANT na "inililipat" (respawnResourceNode) ang node papuntang
// bagong random na lugar SA SANDALING mismo maani ito nang buo - PERO
// ang paglipat na iyon ay NASA MEMORY LANG (resourceNodesCache), hindi
// naka-save, kaya nawawala ito pagka-reload/paglipat ng mundo - saka
// pa, dahil BINUBURA rin ang harvested-record ng LUMANG posisyon
// (`delete harvested[...]`) at deterministic/seeded pa rin ang
// generateResourceNodes(), bumabalik ang puno/bato sa ORIHINAL nitong
// posisyon (parang "gumagaling"/hindi permanente ang pagkakaputol).
//
// BAGONG GAWI: PERMANENTE na ngayon ang pagkawala sa ORIHINAL na
// posisyon (harvestedResources na naman, naka-save na pala talaga
// noon pa - ang BURA lang ang bug). Sa halip na "ilipat" ang PAREHONG
// node, GUMAGAWA na lang tayo ng BAGONG "extra" na node (naka-save,
// tingnan ang resourceExtraNodes sa itaas) sa isang bagong random na
// lokasyon - PERO hindi na ito INSTANT: isa-isa lang, kada 15 minuto
// ng GAME time (RESOURCE_RESPAWN_INTERVAL_MS/updateResourceRespawns sa
// itaas), at kada 15 minuto, isang beses lang susuriin kung may
// deficit pa (kulang pa sa TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD) -
// kung meron, doon pa lang talaga lalabas ang bagong node.

function findValidRelocationSpot(listKey) {
  if (!mapReady || !mapData || !resourceNodesCache) return null;

  const objectCells = getObjectCells();
  const occupied = new Set();
  const stoneTiles = new Set();

  for (const node of [
    ...resourceNodesCache.trees,
    ...resourceNodesCache.stones,
  ]) {
    occupied.add(node.col + "," + node.row);
  }

  for (const stone of resourceNodesCache.stones) {
    stoneTiles.add(stone.col + "," + stone.row);
  }

  let attempt = 0;

  while (attempt < 400) {
    attempt++;

    const col = 1 + Math.floor(Math.random() * (mapData.width - 2));
    const row = 1 + Math.floor(Math.random() * (mapData.height - 2));
    const key = col + "," + row;

    if (occupied.has(key)) continue;
    if (objectCells && objectCells.has(key)) continue;
    if (isTilePlantedWithCrop(col, row)) continue;
    if (isInsideTownGateClearing(col, row)) continue;

    // BAGONG (tingnan ang "CLEARANCE SA PALIGID NG BATO" sa itaas) -
    // parehong tuntunin dito para sa mga node na idinadagdag ng
    // 15-minutong respawn system: huwag payagang malagay ang KAHIT
    // ANONG bagong node sa isang tile na KARATIG ng isang EXISTING na
    // bato, AT (kung isang BAGONG BATO mismo ang ilalagay) tiyaking
    // WALA ring anumang node sa 4 karatig na tile nito.
    if (isOrthogonallyAdjacentToStone(col, row, stoneTiles)) continue;

    if (
      listKey === "stones" &&
      hasOccupiedOrthogonalNeighbor(col, row, occupied)
    ) {
      continue;
    }

    const tileBox = {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    if (collisions.some((box) => isColliding(tileBox, box))) continue;

    let blockedByDoor = false;

    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        blockedByDoor = true;
        break;
      }
    }

    if (blockedByDoor) continue;

    return { col, row };
  }

  return null; // walang nahanap na lugar - mananatiling naani muna
}

function handleAxeClickOnTree(col, row) {
  // BAGO (linaw ng hiling ng user): "dapat yung tile kung san naka
  // root yung puno dapat dun lang niya ma hit" - simple na tile-match
  // lang (ang (col,row) mismo ng node - ibig sabihin, ang tile kung
  // saan "naka-ugat"/nakatanim ang puno), WALANG karagdagang
  // pixel-precise na trunk hitbox check - iyon pala ang naging sanhi
  // ng hindi pagtama kahit tumama na sa tamang tile.
  const tree = findTreeAt(col, row);

  if (!tree) return false;

  // AYOS (hiling ng user): "gagamitan pa rin ng axe kahit wala na
  // yung snowpinetree or mga trees, dapat hindi na magamitan, tsaka
  // lang gagana kapag meron ng punong tumubo ulit" - SANHI:
  // findTreeAt (itaas) ay nagbabalik pa rin ng data KAHIT PERMANENTENG
  // wala nang laman ang tile na ito (fully harvested AT nasira na rin
  // ang tuod/stump, tingnan ang "PAGSIRA SA TUOD/STUMP" sa itaas) -
  // dahil PAREHO pa ring nakalista ang node sa resourceNodesCache
  // (seeded/permanenteng listahan, hindi nag-iiba base sa
  // harvested-state). Kaya dating "totoo" pa rin ang resulta nito,
  // nagsi-swing pa ang axe (walang mangyayaring hit, pero
  // NAKIKITANG "gumagana") kahit wala nang TALAGANG matitirang puno o
  // tuod doon. AYOS: kung fully-harvested na ang tile na ito AT wala
  // nang choppable na tuod dito (canChopStumpAt) - wala TALAGANG
  // dapat mangyari (kabilang na ang axe swing mismo) - "false" ang
  // ibalik, hanggang sa TALAGANG tumubo ulit ang puno rito
  // (updateTreeRegrowth, sa sandaling iyon ay isasama na naman ito sa
  // isNodeFullyHarvested === false).
  const harvested = getHarvestedForCurrentWorld();
  const key = col + "," + row;
  const fullyHarvested = isNodeFullyHarvested(harvested, key, "wood");

  if (fullyHarvested && !canChopStumpAt(col, row)) return false;

  registerHit(col, row, "wood");

  return true;
}

function handlePickaxeClickOnStone(col, row) {
  if (!findStoneAt(col, row)) return false;

  registerHit(col, row, "stone");

  return true;
}

// Pagitan ng bawat "hit" gamit ang axe/pickaxe sa puno/bato - kahit
// sino pang tree/stone ang tamaan, IISA lang itong cooldown (hindi
// per-node), para hindi basta i-spam-click ng player ang pag-ani.
const RESOURCE_HIT_COOLDOWN_MS = 1000;

let lastResourceHitAt = 0;

// AYOS (hiling ng user - tingnan ang buong paliwanag sa loob ng
// getResourceDrawables, "suppressFadeForAxe"): mas MAHABA kaysa
// RESOURCE_HIT_COOLDOWN_MS (1000ms) - kailangang SAKUP ang buong
// pagitan ng dalawang magkasunod na axe swing (maikli lang ang swing
// animation mismo, ~350ms), kaya may extra margin dito (1400ms) para
// hindi tuluyang mag-expire ang "walang fade" bago pa man makapag-
// click ulit ang user sa susunod na hampas.
const AXE_STRIKE_NO_FADE_GRACE_MS = 1400;

// =========================
// "AXE BEHIND PINETREE" (hiling ng user: "i want the animation of the
// axe make it behind of the pinetree")
// =========================
//
// "col,row" ng puno na KASALUKUYANG hinahampas ng axe (session-lang,
// hindi naka-save) - ginagamit ng getResourceDrawables (itaas) para
// PANSAMANTALANG i-force ang puno na mag-drawing SA HULI (sa itaas/
// harap ng player sa Y-sort), sa halip na ang normal na batayan
// (posisyon). Dahil ang parehong occlusion system na ginagamit para
// "makita ang player sa likod ng puno" (tingnan ang
// shouldOccludeForPlayer sa map.js) ay awtomatikong nagpapalabo
// (fade) sa PUNO sa sandaling ito ay nasa HARAP ng player SA
// PAGGUHIT ngunit NAGTATAMA ang kanilang bounding box - ang epekto
// nito, habang aktibong humahampas: PARANG NASA LIKOD ng puno ang
// kamay/axe ng player (nakikita pa rin dahil malabo/see-through ang
// puno, pero TALAGANG nasa ILALIM/LIKOD ito sa pagkakasunod-sunod ng
// pagguhit).
let axeStrikeTargetTreeKey = null;

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;

  const tile = getMouseTile();

  if (!tile) return;
  if (!isTileInReach(tile.col, tile.row)) return;

  if (Date.now() - lastResourceHitAt < RESOURCE_HIT_COOLDOWN_MS) return;

  let hit = false;

  if (axeEquipped) {
    hit = handleAxeClickOnTree(tile.col, tile.row);

    // Cosmetic swing animation lang (naaplay na agad ang hit sa itaas) -
    // "axe" na mismo ang naka-equip (hindi kamao/bare-hand) kaya may
    // axe na dapat makita sa kamay - tingnan ang startAxeStrike sa
    // player.js.
    if (hit && typeof startAxeStrike === "function") {
      // Itinatabi kung ANONG puno ang tinatarget (tingnan ang
      // "AXE BEHIND PINETREE" sa itaas) - ginagamit ng
      // getResourceDrawables para malaman kung dapat i-force ang
      // puno na ito na mag-drawing sa harap/ibabaw ng player habang
      // tumatakbo ang swing animation.
      axeStrikeTargetTreeKey = tile.col + "," + tile.row;
      startAxeStrike(tile.col, tile.row);
    }

    // OAK (decor.js) - hiwalay itong sistema sa normal na puno, kaya
    // sinusubukan lang ito kapag walang normal na puno dito. Naiiba
    // ang animation timing: HINDI agad umaalog ang oak - inaantay
    // muna ang PAGTAPOS ng swing (onComplete callback) bago talaga
    // i-trigger ang shake, tingnan ang playOakHitAnimation sa decor.js.
    if (!hit && typeof handleAxeClickOnOak === "function") {
      const oakCol = tile.col;
      const oakRow = tile.row;

      hit = handleAxeClickOnOak(oakCol, oakRow);

      if (hit && typeof startAxeStrike === "function") {
        startAxeStrike(oakCol, oakRow, () => {
          if (typeof playOakHitAnimation === "function") {
            playOakHitAnimation(oakCol, oakRow);
          }
        });
      }
    }
  } else if (pickaxeEquipped) {
    hit = handlePickaxeClickOnStone(tile.col, tile.row);

    if (hit && typeof startPickaxeStrike === "function") {
      startPickaxeStrike(tile.col, tile.row);
    }
  } else if (cutterEquipped) {
    // BAGO (hiling ng user): "cutter" - pang-putol ng damo/grass tuft,
    // 3-tile na hanay SA HARAP ng player (tingnan ang
    // "PAGPUTOL NG DAMO (CUTTER)" sa grass.js) - kailangan pa ring
    // TALAGANG i-click ang isa sa 3 target tile (parehong "in reach"
    // guard sa itaas), PERO ang function mismo (handleCutterClickOnGrass)
    // ang nagsusuri kung TALAGA bang "naka-front" doon ang player bago
    // pumayag - kaya HINDI ito basta "swing kahit saan" (mouse-based
    // pa rin ang targeting, gaya ng axe/pickaxe).
    if (typeof handleCutterClickOnGrass === "function") {
      hit = handleCutterClickOnGrass(tile.col, tile.row);
    }

    // AYOS: parehong durability system ng axe/pickaxe (dig.js) - isang
    // "swing na tumama" (kahit ilan sa 3 tile ang TALAGANG na-cut) =
    // isang gamit sa durability ng cutter.
    if (hit && typeof useToolDurability === "function") {
      useToolDurability("cutter");
    }

    // WALANG swing animation muna dito ("lagyan ko na lang ng
    // animation sa susunod", hiling ng user) - sinadyang HINDI
    // ginamit ang startAxeStrike/startPickaxeStrike dito (mali/
    // nakakalito kung axe/pickaxe ang ipapakita sa kamay habang
    // "cutter" ang naka-equip) - kapag may dedikado nang swing sheet
    // ang cutter balang araw, dito na lang idadagdag ang katumbas na
    // startCutterStrike(tile.col, tile.row) na tawag, kaparehong-pareho
    // ng ginagawa ng ibang tool sa itaas. Naaplay na agad ang hit sa
    // itaas kahit walang animation pa.
  }
  // BAGO (hiling ng user: "erase the punch function, i dont want
  // punch anymore") - tinanggal na ang KAMAO (bare-hand) na branch na
  // dating nandito - kailangan na talaga ng naka-equip na axe/pickaxe
  // bago makapag-ani ng puno/bato/oak; walang mangyayari kapag walang
  // naka-equip na tool.

  // Nagsisimula lang ang cooldown kapag TALAGANG may tinamaan - hindi
  // dapat naghihintay ang player kapag basta nag-click siya sa
  // walang-lamang tile.
  if (hit) lastResourceHitAt = Date.now();
});

// =========================
// CURSOR (puting/pulang outline para sa pickaxe/axe sa resource nodes)
// =========================
//
// Dagdag lang ito sa drawDigCursor (dig.js) - hiwalay na tinatawag mula
// sa draw.js. Puti = may maaani rito; wala kapag walang node.

function drawResourceCursor() {
  if (!mapReady || worldLoading) return;

  const tile = getMouseTile();

  if (!tile) return;
  if (!isTileInReach(tile.col, tile.row)) return;

  const harvested = getHarvestedForCurrentWorld();
  const key = tile.col + "," + tile.row;

  // Kailangan na TALAGANG naka-equip ang tamang tool bago magpakita ng
  // cursor dito (hiling ng user: "erase the punch function, i dont
  // want punch anymore") - wala nang bare-hand/kamao na fallback.
  // OAK (decor.js) - hiwalay na store/function ito, kaya hiwalay din
  // ang pagsusuri (hindi na dumadaan sa isNodeFullyHarvested/harvested
  // sa itaas - iyon ay para sa NORMAL na puno/bato lang).
  const hasOakTargetHere =
    typeof hasOakTargetAt === "function" && hasOakTargetAt(tile.col, tile.row);

  // BAGO (linaw ng hiling ng user): simple na tile-match lang ulit ang
  // "may target dito" - ang tile kung saan naka-root/nakatanim ang
  // puno mismo, walang karagdagang pixel-precise na trunk hitbox.
  //
  // BAGO (hiling ng user, "gagamitan pa rin ng axe" ang tuod/stump) -
  // choppable pa rin ang cursor kapag TUOD/stump ang nasa tile na ito
  // (canChopStumpAt), kahit fully-harvested na ang puno mismo dito.
  //
  // BAGO (cutter): puting outline din sa TATLONG front-row tile
  // (getGrassCutterFrontRowTiles, grass.js) kapag TALAGANG may
  // choppable na tumpok doon - parehong "naka-front ka ba talaga sa
  // grass" na batayan ng handleCutterClickOnGrass, para tumugma ang
  // NAKIKITANG cursor sa TALAGANG mag-e-effect kapag na-click.
  const hasTargetHere = axeEquipped
    ? (!!findTreeAt(tile.col, tile.row) &&
        !isNodeFullyHarvested(harvested, key, "wood")) ||
      canChopStumpAt(tile.col, tile.row) ||
      hasOakTargetHere
    : pickaxeEquipped
      ? !!findStoneAt(tile.col, tile.row) &&
        !isNodeFullyHarvested(harvested, key, "stone")
      : cutterEquipped
        ? typeof getGrassCutterFrontRowTiles === "function" &&
          getGrassCutterFrontRowTiles().some(
            (front) =>
              front.col === tile.col &&
              front.row === tile.row &&
              typeof hasAliveGrassTuftAtTile === "function" &&
              hasAliveGrassTuftAtTile(tile.col, tile.row),
          )
        : false;

  if (!hasTargetHere) return;

  const lineWidth = 1 / camera.zoom;

  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeRect(
    tile.col * TILE_SIZE + lineWidth / 2,
    tile.row * TILE_SIZE + lineWidth / 2,
    TILE_SIZE - lineWidth,
    TILE_SIZE - lineWidth,
  );
  ctx.restore();
}
