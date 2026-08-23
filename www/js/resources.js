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

const TREE_COUNT_PER_WORLD = 50;
const STONE_COUNT_PER_WORLD = 50;

// Ilang beses kailangang i-click (axe/pickaxe) bago talaga maani ang
// isang puno/bato - kada click, may shake animation (tingnan ang
// "SHAKE ANIMATION" sa ibaba), hanggang sa huling click na doon lang
// talaga tinatanggal ang node at binibigyan ng ani.
const RESOURCE_REQUIRED_HITS = 6;

// =========================
// AXE (bagong kasangkapan, hiwalay sa pickaxe/kamay/binhi)
// =========================

let axeEquipped = false;

// Kailangan munang i-CRAFT ang axe (tingnan ang CRAFT_SHAPED_RECIPES sa
// craft.js) bago maging equippable - tingnan ang pickaxeUnlocked/
// rakeUnlocked sa dig.js para sa parehong konsepto.
let axeUnlocked = false;

// Tingnan ang pickaxeInInventory/rakeInInventory (dig.js) para sa
// parehong konsepto - "InInventory" = na-craft na, nakikita sa bag,
// PERO hindi pa "na-install" sa tool radial (kailangan pang i-double
// click - equipViaDoubleClick, hotbar.js).
let axeInInventory = false;

function equipAxe() {
  if (!axeUnlocked) return; // kailangan munang i-craft

  const wasEquipped = axeEquipped;

  clearAllToolEquips();
  axeEquipped = !wasEquipped;

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
// isang torch sa stock (talagang "nagamit" na ito), at kusang na-
// uunequip. Hindi dito tinatawag ang syncHotbarUI() para sa progress
// bar mismo - iyon ay direktang DOM update na lang (mas magaan, tingnan
// ang updateTorchBurnVisual sa hotbar.js), pero tinatawag pa rin ito
// kapag NAUBOS na (may nagbagong estado - torchEquipped/torchesCollected).
function updateTorchBurn(deltaMs) {
  if (!torchEquipped) return;

  torchRemainingMs -= deltaMs;

  if (torchRemainingMs > 0) return;

  torchRemainingMs = 0;
  torchEquipped = false;
  torchesCollected = Math.max(0, torchesCollected - 1);

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

function saveHarvestedResources() {
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

function saveResourceExtraNodes() {
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
// 15-MINUTONG RESPAWN SCHEDULE (kada mundo, hiwalay ang puno sa bato)
// =========================
//
// BAGONG HILING: hindi na dapat "bumabalik" (mag-reset) ang na-break
// mo nang puno/bato kapag nag-reload/lumabas-pumasok ng bahay - dapat
// PERMANENTENG nawala ito sa kinalalagyan nito (tingnan ang
// harvestedResources sa itaas, naka-save na ito noon pa - hindi na
// kailangang ulitin). Sa halip, dapat mag-spawn ng BAGONG puno/bato
// ISA-ISA, kada 15 minuto ng GAME time (gamit ang getGameNow(), HINDI
// Date.now() - ayon sa convention ng project, para sumasabay ito sa
// pagtulog/time-skip) - hanggang sa mabalik ang TREE_COUNT_PER_WORLD/
// STONE_COUNT_PER_WORLD na dami.
const RESOURCE_RESPAWN_INTERVAL_MS = 15 * 60 * 1000;

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

function saveResourceRespawnSchedule() {
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
  const spot = findValidRelocationSpot();

  if (!spot) return false; // walang nahanap na lugar - susubukan na lang sa susunod na tick

  const extra = getExtraNodesForCurrentWorld();
  const node = { col: spot.col, row: spot.row, variant: Math.floor(Math.random() * 2) };

  extra[listKey].push(node);
  saveResourceExtraNodes();

  if (resourceNodesCache && resourceNodesCache[listKey]) {
    resourceNodesCache[listKey].push(node);
  }

  collisions.push({
    x: node.col * TILE_SIZE,
    y: node.row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  });

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
    schedule.nextTreeAt = now + RESOURCE_RESPAWN_INTERVAL_MS;
    changed = true;
  }

  if (schedule.nextStoneAt === null) {
    schedule.nextStoneAt = now + RESOURCE_RESPAWN_INTERVAL_MS;
    changed = true;
  }

  let guard = 0;

  while (now >= schedule.nextTreeAt && guard < 1000) {
    guard++;
    changed = true;

    if (
      !world.noTrees &&
      countAliveResourceNodes("trees") < TREE_COUNT_PER_WORLD
    ) {
      spawnExtraResourceNode("trees");
    }

    schedule.nextTreeAt += RESOURCE_RESPAWN_INTERVAL_MS;
  }

  guard = 0;

  while (now >= schedule.nextStoneAt && guard < 1000) {
    guard++;
    changed = true;

    if (
      !world.noStones &&
      countAliveResourceNodes("stones") < STONE_COUNT_PER_WORLD
    ) {
      spawnExtraResourceNode("stones");
    }

    schedule.nextStoneAt += RESOURCE_RESPAWN_INTERVAL_MS;
  }

  if (changed) saveResourceRespawnSchedule();
}

// Kamao (walang naka-equip na axe/pickaxe) - puwede pa ring gamitin sa
// puno/bato, mas mabagal lang (10 hit sa halip na 6). "itemId" - "wood"
// (puno, axe) o "stone" (bato, pickaxe); ang KASALUKUYANG naka-equip
// (o kawalan nito) sa SANDALING ito mismo tinatama ang batayan.
const RESOURCE_REQUIRED_HITS_BARE_HAND = 10;

function getRequiredHitsFor(itemId) {
  const hasProperTool = itemId === "wood" ? axeEquipped : pickaxeEquipped;

  return hasProperTool
    ? RESOURCE_REQUIRED_HITS
    : RESOURCE_REQUIRED_HITS_BARE_HAND;
}

// Ang value sa harvested[key] ay ISANG BILANG na ngayon (0..
// RESOURCE_REQUIRED_HITS/RESOURCE_REQUIRED_HITS_BARE_HAND) - bilang ng
// click na natanggap na ng node na ito, hindi lang true/false. "itemId" -
// opsyonal, "wood"/"stone" (tingnan ang getRequiredHitsFor) - kung wala,
// ang MAS MABAGAL (kamao) na threshold ang gamit bilang ligtas na
// default, para hindi maagang "matapos" ang isang check na walang
// alam kung anong item ang tinutukoy.
function isNodeFullyHarvested(harvested, key, itemId) {
  const required = itemId
    ? getRequiredHitsFor(itemId)
    : RESOURCE_REQUIRED_HITS_BARE_HAND;

  return (harvested[key] || 0) >= required;
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

// BAGONG: kung ang isang tile ay nasa loob ng "clearing" (bukas na
// erya) sa paligid ng gate patungong "town" (decor.js) - kung oo,
// dapat hindi na dito pinapayagang mag-spawn ng random na puno/bato
// (isValidTile/findValidRelocationSpot sa ibaba) - kung hindi,
// natatabunan/nawawala ang 2 FIXED na "landmark" na puno sa dami ng
// normal/random na puno sa paligid nila, kaya mahirap makilala/mahanap
// ang gate mismo (napansin ito sa totoong paglalaro - dating ni-report
// ng user bilang "di ko makita" ang gate). Ang "padding" (2 tiles sa
// magkabila, 2 sa itaas, 4 sa ibaba) ay sadyang MAS MALAKI kaysa sa
// eksaktong lapad/taas ng gate mismo, para talagang maglinis ng
// puwang sa paligid (parang "clearing"), hindi lang literal na ang
// 2 puno at ang daanan.
// AYOS: dating FIXED na column/row constants (TOWN_GATE_PATCH_COL_
// START/_END/_ROW_START/_END) ang batayan dito - pero ngayon,
// FUNCTION-BASED na (getTownGatePatchBox, decor.js - kinukwenta mula
// sa GITNA MISMO ng lapad ng mapa) ang posisyon ng gate, kaya dito
// na lang direktang tinatawag ang function na iyon (pixel-based na
// paghahambing gamit ang isColliding, sa halip na column/row
// comparison).
function isInsideTownGateClearing(col, row) {
  if (currentWorld !== "newmap") return false;
  if (typeof getTownGatePatchBox !== "function") return false;

  const box = getTownGatePatchBox();
  const padding = 4 * TILE_SIZE;

  const expandedBox = {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };

  const tileBox = {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  };

  return isColliding(tileBox, expandedBox);
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

  for (const tree of extra.trees) occupied.add(tree.col + "," + tree.row);
  for (const stone of extra.stones) occupied.add(stone.col + "," + stone.row);

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

    const tileBox = {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    if (collisions.some((box) => isColliding(tileBox, box))) return false;

    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        return false;
      }
    }

    return true;
  }

  function placeNodes(count) {
    const nodes = [];
    let attempt = 0;

    while (nodes.length < count && attempt < 800) {
      attempt++;

      const col = 1 + Math.floor(nextRandom() * (mapData.width - 2));
      const row = 1 + Math.floor(nextRandom() * (mapData.height - 2));

      if (!isValidTile(col, row)) continue;

      // "variant" - alin sa 2 magkaibang hugis (tree/tree1,
      // rock/rock1) ang gagamitin sa node na ito. Naka-decide isang
      // beses lang sa paggawa nito, kaya hindi ito nagpapalit-palit
      // kada frame.
      nodes.push({ col, row, variant: Math.floor(nextRandom() * 2) });
      occupied.add(col + "," + row);
    }

    return nodes;
  }

  const seededTrees = placeNodes(world.noTrees ? 0 : TREE_COUNT_PER_WORLD);
  // Ilang mundo (tingnan ang "noStones"/"noTrees" sa WORLDS - worlds.js)
  // ay sadyang walang random na puno/bato (hal. "town") - gagamitin ang
  // 0 bilang count sa halip na TREE_COUNT_PER_WORLD/STONE_COUNT_PER_WORLD
  // para sa mga iyon.
  const seededStones = placeNodes(world.noStones ? 0 : STONE_COUNT_PER_WORLD);

  // Isinasama na ngayon ang mga EXTRA na node (mula sa respawn system)
  // sa dulo ng listahan - ang parehong "harvested" filtering (tingnan
  // ang ensureResourceNodes/getResourceDrawables) ay gumagana pareho
  // sa dalawa, dahil "col,row" key lang ang batayan nito.
  return {
    trees: seededTrees.concat(extra.trees),
    stones: seededStones.concat(extra.stones),
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
  // mga na-ani na (tingnan ang harvested) ay wala nang collision.
  const harvested = getHarvestedForCurrentWorld();

  for (const node of [
    ...resourceNodesCache.trees.map((tree) => ({ ...tree, itemId: "wood" })),
    ...resourceNodesCache.stones.map((stone) => ({
      ...stone,
      itemId: "stone",
    })),
  ]) {
    const key = node.col + "," + node.row;

    if (isNodeFullyHarvested(harvested, key, node.itemId)) continue;

    collisions.push({
      x: node.col * TILE_SIZE,
      y: node.row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    });
  }
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

function getTreeImagePathForStage(variant, stage) {
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

// Isang beses lang i-load ang bawat larawan, itinatabi dito kada path.
const RESOURCE_IMAGES = {};

function preloadResourceImages(variantPaths) {
  for (const variant of variantPaths) {
    for (const path of [variant.normal, variant.snow]) {
      if (RESOURCE_IMAGES[path]) continue;

      const img = new Image();

      img.src = path;
      RESOURCE_IMAGES[path] = img;
    }
  }
}

preloadResourceImages(TREE_VARIANT_PATHS);
preloadResourceImages(ROCK_VARIANT_PATHS);

// Hiwalay na i-preload ang 2 snow-stage na larawan ng puno (hindi na
// per-variant, iisa lang ito kada stage - tingnan ang paliwanag sa
// itaas).
for (const path of [TREE_SNOW_LIGHT_PATH, TREE_SNOW_HEAVY_PATH]) {
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
  const variant = variantPaths[node.variant];
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

function drawTreeSprite(node, destWidthInTiles) {
  const variant = TREE_VARIANT_PATHS[node.variant];
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

function getResourceDrawables() {
  ensureResourceNodes();
  updateTreeSnowStage();

  if (!resourceNodesCache) return [];

  const harvested = getHarvestedForCurrentWorld();
  const drawables = [];

  for (const tree of resourceNodesCache.trees) {
    const key = tree.col + "," + tree.row;

    if (isNodeFullyHarvested(harvested, key, "wood")) continue; // pinutol na

    drawables.push({
      sortY: tree.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      // Tandaan: dating may anino dito (drawGroundShadow) - TINANGGAL
      // (bahagi 7, item 18 sa CLAUDE.md) - nagdulot ito ng LAG (maraming
      // puno kada mundo, TREE_COUNT_PER_WORLD = 10, PLUS blur filter
      // per-frame kada isa - mabigat sa canvas). Ang oldman/pig/player
      // LANG (kaunti/iisa lang sila) ang may anino ngayon.
      draw: () => drawTreeSprite(tree, 2),
      // NIPIS na "bbox" lang, halos katumbas ng puno (trunk), HINDI
      // ang buong lapad ng dahon/canopy (2 tiles) - kung buo ang lapad
      // ang gagamitin, nag-o-opacity na rin kahit nasa TABI lang ang
      // player (hindi pa siya nasa LIKOD talaga) - tingnan ang "SEE-
      // THROUGH NA OCCLUSION" sa map.js.
      bbox: {
        x: tree.col * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE * 0.35,
        y: tree.row * TILE_SIZE - TILE_SIZE * 1.5,
        width: TILE_SIZE * 0.7,
        height: TILE_SIZE * 2.5,
      },
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
      draw: () => drawResourceSprite(stone, ROCK_VARIANT_PATHS, 1.1),
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

// Walang panimulang stock - normal na simula ng laro (kailangan munang
// pumutol ng puno para makakuha ng wood).
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
function removeResourceCollisionAt(col, row) {
  collisions = collisions.filter(
    (box) => !(box.x === col * TILE_SIZE && box.y === row * TILE_SIZE),
  );
}

function findTreeAt(col, row) {
  if (!resourceNodesCache) return null;

  return resourceNodesCache.trees.find(
    (tree) => tree.col === col && tree.row === row,
  );
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

  if (isNodeFullyHarvested(harvested, key, itemId)) return; // wala nang matitira

  const hits = (harvested[key] || 0) + 1;

  harvested[key] = hits;
  saveHarvestedResources();
  spawnNodeShake(col, row);

  if (hits < getRequiredHitsFor(itemId)) return;

  removeResourceCollisionAt(col, row);

  const yieldCount = randomResourceYield();

  // Hindi na deretso sa bag - nakalapag muna sa lupa, damputin gamit
  // ang kamay (tingnan ang ground-items.js). Hiwa-hiwalay na piraso
  // (isa kada wood/stone) - kaya kailangang isa-isahin ang pagdampot,
  // hindi basta isang click na lang para sa buong ani.
  if (typeof spawnGroundItem === "function") {
    for (let i = 0; i < yieldCount; i++) {
      spawnGroundItem(col, row, itemId, 1, i * GROUND_ITEM_SPAWN_STAGGER_MS);
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
  // tingnan ang "AUTO-REGENERATION" sa ibaba.

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

function findValidRelocationSpot() {
  if (!mapReady || !mapData || !resourceNodesCache) return null;

  const objectCells = getObjectCells();
  const occupied = new Set();

  for (const node of [
    ...resourceNodesCache.trees,
    ...resourceNodesCache.stones,
  ]) {
    occupied.add(node.col + "," + node.row);
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
  if (!findTreeAt(col, row)) return false;

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
  } else {
    // KAMAO (walang naka-equip na axe/pickaxe) - puwede pa ring gamitin
    // sa puno O bato, mas mabagal lang (tingnan ang
    // RESOURCE_REQUIRED_HITS_BARE_HAND).
    hit =
      handleAxeClickOnTree(tile.col, tile.row) ||
      handlePickaxeClickOnStone(tile.col, tile.row);

    if (hit && typeof startPunchStrike === "function") {
      startPunchStrike(tile.col, tile.row);
    }

    // OAK gamit ang kamao - parehong dahilan gaya ng sa axe sa itaas.
    if (!hit && typeof handleAxeClickOnOak === "function") {
      const oakCol = tile.col;
      const oakRow = tile.row;

      hit = handleAxeClickOnOak(oakCol, oakRow);

      if (hit && typeof startPunchStrike === "function") {
        startPunchStrike(oakCol, oakRow, () => {
          if (typeof playOakHitAnimation === "function") {
            playOakHitAnimation(oakCol, oakRow);
          }
        });
      }
    }
  }

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

  // Kamao (walang naka-equip na tool) - puno O bato, alinman - mas
  // mabagal lang (tingnan ang RESOURCE_REQUIRED_HITS_BARE_HAND).
  // OAK (decor.js) - hiwalay na store/function ito, kaya hiwalay din
  // ang pagsusuri (hindi na dumadaan sa isNodeFullyHarvested/harvested
  // sa itaas - iyon ay para sa NORMAL na puno/bato lang).
  const hasOakTargetHere =
    typeof hasOakTargetAt === "function" && hasOakTargetAt(tile.col, tile.row);

  const hasTargetHere = axeEquipped
    ? (!!findTreeAt(tile.col, tile.row) &&
        !isNodeFullyHarvested(harvested, key, "wood")) ||
      hasOakTargetHere
    : pickaxeEquipped
      ? !!findStoneAt(tile.col, tile.row) &&
        !isNodeFullyHarvested(harvested, key, "stone")
      : (!!findTreeAt(tile.col, tile.row) &&
          !isNodeFullyHarvested(harvested, key, "wood")) ||
        (!!findStoneAt(tile.col, tile.row) &&
          !isNodeFullyHarvested(harvested, key, "stone")) ||
        hasOakTargetHere;

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
