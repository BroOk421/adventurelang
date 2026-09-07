// =========================
// NAKAKALAT NA WOOD/STONE NA LOOT (naka-floating, direktang madadampot)
// =========================
//
// Hiling ng user: "mag dagdag ka na lang ng 10 woods at 10 rocks na naka
// floating lang sa ground yung mga lootable na woods at rocks... nakakalat
// sa map random siyang nakakalat every 10 mins nag spawn isa isa sa
// grassmap at grassmap2".
//
// MAHALAGANG PAGKAKAIBA sa random na puno/bato ng resources.js: doon,
// kailangan mo munang mag-CHOP/MINE (ilang beses na click gamit ang
// tamang tool) bago ka makakuha ng wood/stone. DITO, hindi na
// "choppable" na node - direkta nang isang NAKALAPAG NA ITEM sa lupa
// (parehong-pareho ang gawi ng ibang groundItems, ground-items.js -
// awtomatikong madadampot/"ma-vacuum" pag lumapit ka, o i-click) - kaya
// "loot"/"floating" ang tawag dito, hindi "resource node".
//
// Dalawang bagay ang naka-save (parehong pattern ng resourceExtraNodes/
// resourceRespawnSchedule sa resources.js):
//   1) SCATTERED_LOOT_SAVE_KEY - ang AKTWAL na listahan (col/row/id) ng
//      bawat kasalukuyang nakalapag na loot, kada mundo, kada uri
//      (wood/stone) - PERSISTENT ito (hindi tulad ng normal na
//      groundItems na 1-minutong "buhay" lang, tingnan ang GROUND_ITEM_
//      DESPAWN_MS) - mananatili ito hanggang talagang madampot.
//   2) SCATTERED_LOOT_SCHEDULE_SAVE_KEY - kung kailan (getGameNow())
//      susunod na dapat lumabas ang bagong piraso, kada mundo/uri -
//      kaparehong disenyo ng 15-minutong respawn ng puno/bato, PERO
//      FIXED na 10 minuto (hindi random na saklaw) ayon mismo sa
//      hiling ng user.

// Saang mga mundo lumalabas ito - "town" at "grassmap" ay may sarili
// nang drawn-in na dekorasyon/fixed na resources (tingnan ang noTrees/
// noStones/fixedTrees sa worlds.js), kaya doon hindi kailangan nito.
const SCATTERED_LOOT_WORLDS = ["grassmap", "grassmap2"];

// "10 woods at 10 rocks" - target na bilang na dapat laging
// PANANATILIHIN (hindi laging bago, dahil may respawn schedule sa
// ibaba) kada mundo, kada uri.
const SCATTERED_LOOT_TARGET_COUNT = 10;

// "every 10 mins" (GAME time, getGameNow() - kaparehong convention ng
// buong proyekto, tingnan ang paliwanag sa itaas ng resources.js kung
// bakit HINDI Date.now() ang ginagamit) - FIXED na 10 minuto, hindi
// random na saklaw tulad ng rollResourceRegrowMs() ng puno/bato.
const SCATTERED_LOOT_RESPAWN_MS = 10 * 60 * 1000;

const SCATTERED_LOOT_SAVE_KEY = "tralala.scatteredLoot";
const SCATTERED_LOOT_SCHEDULE_SAVE_KEY = "tralala.scatteredLootSchedule";

// { [world]: { wood: [{id,col,row}], stone: [{id,col,row}], initialized } }
let scatteredLoot = loadScatteredLoot();

// { [world]: { nextWoodAt: number|null, nextStoneAt: number|null } }
let scatteredLootSchedule = loadScatteredLootSchedule();

let scatteredLootIdCounter = 0;

function loadScatteredLoot() {
  try {
    const raw = localStorage.getItem(SCATTERED_LOOT_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - kaparehong disenyo ng savePlayerPosition (player.js)
// at saveResourceExtraNodes (resources.js): NO-OP ito maliban kung
// TALAGANG "force: true" (mula sa saveAllGameState, settings-menu.js).
function saveScatteredLoot(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(SCATTERED_LOOT_SAVE_KEY, JSON.stringify(scatteredLoot));
  } catch (error) {
    // Hindi kritikal.
  }
}

function loadScatteredLootSchedule() {
  try {
    const raw = localStorage.getItem(SCATTERED_LOOT_SCHEDULE_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

function saveScatteredLootSchedule(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      SCATTERED_LOOT_SCHEDULE_SAVE_KEY,
      JSON.stringify(scatteredLootSchedule),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getScatteredLootForWorld(world) {
  if (!scatteredLoot[world]) {
    scatteredLoot[world] = { wood: [], stone: [], initialized: false };
  }

  const entry = scatteredLoot[world];

  if (!entry.wood) entry.wood = [];
  if (!entry.stone) entry.stone = [];

  return entry;
}

function getScatteredLootScheduleForWorld(world) {
  if (!scatteredLootSchedule[world]) {
    scatteredLootSchedule[world] = { nextWoodAt: null, nextStoneAt: null };
  }

  return scatteredLootSchedule[world];
}

// =========================
// PAGHAHANAP NG BAKANTENG TILE
// =========================
//
// Kaparehong-pareho ang disenyo ng findValidRelocationSpot (resources.js)
// - iniiwasan ang mga puno/bato (resourceNodesCache), mga bagay sa mapa
// (getObjectCells), mga tanim, ang paligid ng town gate, mga collision
// box, at mga pintuan. IDINAGDAG dito: iniiwasan din ang mga TILE na
// mayroon nang IBANG scattered loot (parehong mundo) - para hindi
// magkapatong-patong ang mga ito.
function findValidScatteredLootSpot() {
  if (!mapReady || !mapData) return null;

  const objectCells = getObjectCells();
  const occupied = new Set();
  const stoneTiles = new Set();

  if (typeof resourceNodesCache !== "undefined" && resourceNodesCache) {
    for (const node of [
      ...(resourceNodesCache.trees || []),
      ...(resourceNodesCache.stones || []),
    ]) {
      occupied.add(node.col + "," + node.row);
    }

    for (const stone of resourceNodesCache.stones || []) {
      stoneTiles.add(stone.col + "," + stone.row);
    }
  }

  // Mga TILE na mayroon nang ibang nakalapag na scattered loot (o
  // kahit anong ibang groundItems) sa kasalukuyang mundo.
  if (typeof groundItems !== "undefined") {
    for (const item of groundItems) {
      if (item.world === currentWorld) occupied.add(item.col + "," + item.row);
    }
  }

  let attempt = 0;

  while (attempt < 400) {
    attempt++;

    const col = 1 + Math.floor(Math.random() * (mapData.width - 2));
    const row = 1 + Math.floor(Math.random() * (mapData.height - 2));
    const key = col + "," + row;

    if (occupied.has(key)) continue;
    if (objectCells && objectCells.has(key)) continue;
    if (
      typeof isTilePlantedWithCrop === "function" &&
      isTilePlantedWithCrop(col, row)
    ) {
      continue;
    }
    if (
      typeof isInsideTownGateClearing === "function" &&
      isInsideTownGateClearing(col, row)
    ) {
      continue;
    }
    if (
      typeof isOrthogonallyAdjacentToStone === "function" &&
      isOrthogonallyAdjacentToStone(col, row, stoneTiles)
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

  return null; // walang nahanap na bakanteng lugar - susubukan na lang sa susunod
}

// =========================
// PAGLALAGAY NG VISUAL (groundItems, ground-items.js)
// =========================
//
// "permanent: true" - iniiwasan ng despawn filter (updateGroundItems)
// at ng fade-out (drawGroundItems), tingnan ang paliwanag doon.
// "lootId" - ang gamit para malaman ng handleScatteredLootPickup kung
// ALIN sa scatteredLoot registry ang dapat tanggalin sa sandaling
// madampot ito.
function spawnScatteredLootVisual(world, col, row, itemId, lootId, delayMs = 0) {
  groundItems.push({
    id: groundItemIdCounter++,
    world,
    col,
    row,
    itemId,
    count: 1,
    offsetX: (Math.random() - 0.5) * TILE_SIZE * 0.4,
    offsetY: (Math.random() - 0.5) * TILE_SIZE * 0.3,
    bornAt: performance.now() + delayMs,
    permanent: true,
    lootId,
  });
}

// Session-lang ito (HINDI naka-save) - listahan ng mga mundong
// "na-hydrate" na (ibig sabihin, nailagay na sa groundItems ang mga
// naka-save nang scattered loot nito) sa KASALUKUYANG session. Bagong
// pag-load ng page = bagong bilang, kailangan ulit i-hydrate isang
// beses kada mundo (dahil groundItems mismo ay session-lang, tingnan
// ang paliwanag sa itaas ng ground-items.js) - PERO ang mismong
// POSISYON/BILANG (scatteredLoot, naka-save) ay nananatili.
const scatteredLootHydratedWorlds = new Set();

function ensureScatteredLootVisualsHydrated(world) {
  if (scatteredLootHydratedWorlds.has(world)) return;

  scatteredLootHydratedWorlds.add(world);

  const entry = getScatteredLootForWorld(world);

  let stagger = 0;

  for (const node of entry.wood) {
    spawnScatteredLootVisual(world, node.col, node.row, "wood", node.id, stagger);
    stagger += GROUND_ITEM_SPAWN_STAGGER_MS;
  }

  for (const node of entry.stone) {
    spawnScatteredLootVisual(world, node.col, node.row, "stone", node.id, stagger);
    stagger += GROUND_ITEM_SPAWN_STAGGER_MS;
  }
}

// =========================
// PAGDAMPOT (tinatawag mula sa ground-items.js kapag na-collect ang
// isang "permanent" na item)
// =========================
function handleScatteredLootPickup(world, lootId) {
  if (!scatteredLoot[world]) return;

  const entry = scatteredLoot[world];

  entry.wood = entry.wood.filter((node) => node.id !== lootId);
  entry.stone = entry.stone.filter((node) => node.id !== lootId);

  saveScatteredLoot();
}

// =========================
// UNANG PAGKAKALAT (isang beses lang, habang buhay ang save file)
// =========================
//
// Sa SANDALING mismo unang mapasok ang isang scattered-loot world
// (grassmap/grassmap2) - agad na nilalagyan ito ng buong
// SCATTERED_LOOT_TARGET_COUNT (10) na wood AT 10 stone, nakakalat nang
// random. Pagkatapos nito, ang respawn schedule (10 minuto kada isa)
// na ang bahalang magpuno ulit sa mga nadampot.
function initializeScatteredLootIfNeeded(world) {
  const entry = getScatteredLootForWorld(world);

  if (entry.initialized) return;

  entry.initialized = true;

  for (let i = 0; i < SCATTERED_LOOT_TARGET_COUNT; i++) {
    spawnScatteredLootItem(world, "wood");
  }

  for (let i = 0; i < SCATTERED_LOOT_TARGET_COUNT; i++) {
    spawnScatteredLootItem(world, "stone");
  }

  saveScatteredLoot();
}

// Gumagawa ng ISANG bagong scattered loot node (wood o stone) sa isang
// bagong random/bakanteng lokasyon, kasabay na inilalagay ang visual
// nito (groundItems) - tinatawag ng initializeScatteredLootIfNeeded
// (unang beses) AT ng updateScatteredLoot (kada 10 minutong "tick", sa
// ibaba). Nagbabalik ng true kung talagang may nailagay.
function spawnScatteredLootItem(world, kind) {
  const spot = findValidScatteredLootSpot();

  if (!spot) return false; // walang bakanteng lugar - susubukan na lang sa susunod na tick

  const entry = getScatteredLootForWorld(world);
  const id = "sl" + scatteredLootIdCounter++;
  const node = { id, col: spot.col, row: spot.row };

  entry[kind].push(node);

  spawnScatteredLootVisual(world, node.col, node.row, kind, id);

  return true;
}

// =========================
// KADA-FRAME NA TICK (update.js)
// =========================
//
// Kaparehong-pareho ang disenyo ng updateResourceRespawns (resources.js)
// - WHILE loop (may safety cap) sa halip na IF, para masunod pa rin
// lahat ng lumipas na 10-minutong tick sa isang beses (hal. matapos
// mag-time-skip/matulog nang matagal), hindi lang isa. Ang
// KASALUKUYANG mundo (currentWorld) lang ang pinoproseso dito, dahil
// umaasa ang findValidScatteredLootSpot sa mapData/collisions/
// resourceNodesCache ng NAKA-LOAD na mundo lang.
function updateScatteredLoot() {
  const world = getWorld();

  if (!world || !world.outdoor) return;
  if (!SCATTERED_LOOT_WORLDS.includes(currentWorld)) return;
  if (typeof getGameNow !== "function") return;
  if (!mapReady || !mapData) return;

  ensureScatteredLootVisualsHydrated(currentWorld);
  initializeScatteredLootIfNeeded(currentWorld);

  const entry = getScatteredLootForWorld(currentWorld);
  const schedule = getScatteredLootScheduleForWorld(currentWorld);
  const now = getGameNow();
  let changed = false;

  if (schedule.nextWoodAt === null) {
    schedule.nextWoodAt = now + SCATTERED_LOOT_RESPAWN_MS;
    changed = true;
  }

  if (schedule.nextStoneAt === null) {
    schedule.nextStoneAt = now + SCATTERED_LOOT_RESPAWN_MS;
    changed = true;
  }

  let guard = 0;

  while (now >= schedule.nextWoodAt && guard < 1000) {
    guard++;
    changed = true;

    if (entry.wood.length < SCATTERED_LOOT_TARGET_COUNT) {
      if (spawnScatteredLootItem(currentWorld, "wood")) saveScatteredLoot();
    }

    schedule.nextWoodAt += SCATTERED_LOOT_RESPAWN_MS;
  }

  guard = 0;

  while (now >= schedule.nextStoneAt && guard < 1000) {
    guard++;
    changed = true;

    if (entry.stone.length < SCATTERED_LOOT_TARGET_COUNT) {
      if (spawnScatteredLootItem(currentWorld, "stone")) saveScatteredLoot();
    }

    schedule.nextStoneAt += SCATTERED_LOOT_RESPAWN_MS;
  }

  if (changed) saveScatteredLootSchedule();
}
