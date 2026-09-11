// =========================
// DEKORASYON + OAK (choppable) + OLDMAN (NPC/tindahan)
// =========================
//
// Dalawang bagay dito:
//
//  1) OAK TREES - random na ikinakalat sa mga BAKANTENG tile ng mapa.
//     DALAWANG spritesheet: "oakidle.png" (tuloy-tuloy na banayad na
//     pag-uga, IDLE state - default, hindi kailanman huminto) at
//     "oak.png" (chop reaction - LUMILITAW LANG sandali, sa sandaling
//     matapos ang axe swing ng player - hindi agad sa click).
//     Choppable gamit ang axe, may collision habang buo pa,
//     nagbibigay ng "wood", may sariling harvest store (hiwalay sa
//     harvestedResources ng resources.js).
//
//  2) OLDMAN (idle NPC) - iisa lang, nakatayo sa TOP-RIGHT ng mapa. May
//     banayad na "paghinga" (breathing), bihirang lumingon (Front/Back,
//     isang beses kada 5 minuto), may 2 oak SA LIKOD niya. CLICKABLE -
//     binubuksan nito ang tindahan niya: iisang GRID (ang stock niya) -
//     i-click para bumili, i-hover para makita presyo/pangalan. Ang
//     PAGBEBENTA sa kanya ay sa pamamagitan ng PAG-DRAG ng sariling
//     item papunta sa panel (tingnan ang hotbar.js pointerup) - may
//     popup na magtatanong ng dami kapag higit sa 1 ang hawak.

// =========================
// SHARED: SIMPLENG ANINO (SHADOW) SA PAANAN NG KAHIT SINONG NAGLALAKAD
// NA CHARACTER
// =========================
//
// Generic na bersyon ng drawPlayerShadow (player.js) - naka-anchor sa
// "paanan" (feetX, feetY - iisang anchor point, tulad ng x/y ng
// oldman/pig) sa halip na sa top-left box ng player. Ginagamit ito ng
// drawOldMan (sa ibaba) at ng drawPigAt (pig.js, sunod na file) -
// iginuhit BAGO ang sprite mismo (mula sa caller), kaya laging nasa
// ilalim/likod ng character.
// options (lahat opsyonal):
//   heightRatio - laki ng taas laban sa lapad (default 0.28, mas mataas
//     ang numero = mas bilog/"maikli't mataba" ang hugis, mas mababa =
//     mas patag/hinaba - hal. mas MABABA ang gamit ng tao/oldman
//     [nakatayo, makitid ang anino] kumpara sa pig [apat ang paa, mas
//     bilog/malapad ang anino]).
//   blur - piksel ng Gaussian blur (canvas `filter`) sa gilid ng anino
//     (default 3) - para "malabo"/malambot ang gilid sa halip na
//     matigas/malinaw na hugis-itlog.
//   alpha - kadiliman (default 0.32).
function drawGroundShadow(feetX, feetY, shadowWidth, options) {
  options = options || {};

  const heightRatio =
    typeof options.heightRatio === "number" ? options.heightRatio : 0.28;
  const blur = typeof options.blur === "number" ? options.blur : 3;
  const alpha = typeof options.alpha === "number" ? options.alpha : 0.32;
  // AYOS: dating may awtomatikong "-0.15" na itinutulak PAITAAS ang
  // sentro ng anino (hindi eksakto sa (feetX, feetY) mismo) - kaya
  // parang "lumulutang"/hindi eksaktong nakapatong sa paanan. Ngayon,
  // (feetX, feetY) mismo (walang extra offset) ang default na sentro
  // ng anino - eksakto itong nakatapat sa PAANAN ng character
  // (kaparehong (feetX, feetY) na ginagamit din ng drawImage anchor ng
  // bawat isa - tingnan ang drawOldMan/drawPigAt). May opsyonal pa
  // ring `offsetY` (piksel) kung sakaling may partikular na sprite na
  // kailangan pang i-fine-tune balang araw.
  const offsetY = typeof options.offsetY === "number" ? options.offsetY : 0;

  const shadowHeight = shadowWidth * heightRatio;

  ctx.save();
  // Blur na gilid (dating matigas/malinaw na hugis-itlog lang) - gamit
  // ang canvas `filter` (kaparehong konsepto ng CSS blur), kaya
  // "malambot"/hindi tuwid ang hangganan ng anino.
  ctx.filter = "blur(" + blur + "px)";
  ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
  ctx.beginPath();
  ctx.ellipse(
    feetX,
    feetY + offsetY,
    shadowWidth / 2,
    shadowHeight / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

// =========================
// OAK TREES (choppable)
// =========================

const OAK_COUNT_PER_WORLD = 0;
const OAK_FRAME_COUNT = 6;

// Gaano kalapad iguguhit ang bawat oak (sa tiles) - mas malaki nang
// bahagya kaysa sa random na puno ng resources.js (2 tiles), para
// makilala agad na hiwalay/mas matandang puno ito.
const OAK_DEST_WIDTH_TILES = 4;

// IDLE - tuloy-tuloy na animation, PERO random ang bilis kada oak (para
// hindi sabay-sabay/parang "spam" ang pag-uga ng bawat isa).
const OAK_IDLE_MIN_FRAME_MS = 550;
const OAK_IDLE_MAX_FRAME_MS = 950;

// Kapag umuulan, umiikot lang sa frame 1-4 (hindi hanggang OAK_FRAME_COUNT)
// ang oakidle spritesheet.
const OAK_IDLE_RAIN_FRAME_COUNT = 4;

// HIT (chop reaction) - gaano katagal umaandar kapag na-trigger
// (pagkatapos ng swing) - random din kada oak.
const OAK_HIT_ANIM_MIN_MS = 450;
const OAK_HIT_ANIM_MAX_MS = 650;

const oakIdleImage = new Image();
oakIdleImage.src = "./assets/map/sprites/oakidle.png";

const oakImage = new Image();
oakImage.src = "./assets/map/sprites/oak.png";

// AYOS: bagong "chop reaction" na naka-mirror sa kaliwa (oakLeft.png) -
// gamit ito kapag NASA KANAN ng oak ang player (papunta pakaliwa ang
// direksyon ng suntok/palakol niya), para talagang tumutugma sa
// direksyon ng galaw - tingnan ang resolveOakHitDirection sa ibaba.
const oakLeftImage = new Image();
oakLeftImage.src = "./assets/map/sprites/oakLeft.png";

let oakSpotsCache = null;
let oakSpotsValidatedFor = null;

// "col,row" -> performance.now() nang talagang nag-umpisa ang HIT
// animation (tingnan ang playOakHitAnimation - tinatawag ito sa
// ONCOMPLETE ng swing, hindi sa mismong click).
let oakHitAnimStarts = {};

// "col,row" -> "left" | "right" - direksyon ng hit animation, itinabi
// SA SANDALING mag-umpisa ang animation (hindi kada frame - kung
// hindi, puwedeng magpalit-palit ang itsura kada frame kung gumagalaw
// ang player habang tumatakbo pa ang animation). Tingnan ang
// resolveOakHitDirection.
let oakHitAnimDirs = {};

// =========================
// SAVE STORE (hiwalay sa harvestedResources ng resources.js)
// =========================

const OAK_SAVE_KEY = "tralala.harvestedOakTrees";

let harvestedOakTrees = loadHarvestedOakTrees();

function loadHarvestedOakTrees() {
  try {
    const raw = localStorage.getItem(OAK_SAVE_KEY);

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
function saveHarvestedOakTrees(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(OAK_SAVE_KEY, JSON.stringify(harvestedOakTrees));
  } catch (error) {
    // Hindi kritikal.
  }
}

function getHarvestedOakForCurrentWorld() {
  if (!currentWorld) return {};

  if (!harvestedOakTrees[currentWorld]) {
    harvestedOakTrees[currentWorld] = {};
  }

  return harvestedOakTrees[currentWorld];
}

// Ginagamit ang parehong hits-threshold ng normal na puno (RESOURCE_
// REQUIRED_HITS, getRequiredHitsFor) mula sa resources.js - "wood" pa
// rin talaga ang ani dito.
function isOakFullyHarvested(harvested, key) {
  return (harvested[key] || 0) >= getRequiredHitsFor("wood");
}

// =========================
// PAGGAWA NG MGA POSISYON (seeded, isang beses kada mundo)
// =========================

function generateOakSpots() {
  const world = getWorld();

  if (!mapReady || !mapData || !world || !world.outdoor || world.noOaks)
    return [];

  const objectCells = getObjectCells();
  const occupied = new Set();
  const seedBase = hashStringToInt(currentWorld + ":oak");
  let seedCounter = 0;

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

    if (
      typeof isTilePlantedWithCrop === "function" &&
      isTilePlantedWithCrop(col, row)
    ) {
      return false;
    }

    const tileBox = {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    // Kasama na dito ang mga collision ng puno/bato (resources.js) -
    // tinatawag muna ang ensureResourceNodes bago ito (tingnan ang
    // pagkakasunod-sunod sa map.js/update.js), kaya naka-push na sila
    // sa `collisions` bago pa man dumating dito.
    if (collisions.some((box) => isColliding(tileBox, box))) return false;

    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        return false;
      }
    }

    return true;
  }

  const spots = [];
  let attempt = 0;

  while (spots.length < OAK_COUNT_PER_WORLD && attempt < 1500) {
    attempt++;

    const col = 1 + Math.floor(nextRandom() * (mapData.width - 2));
    const row = 1 + Math.floor(nextRandom() * (mapData.height - 2));

    if (!isValidTile(col, row)) continue;

    spots.push(makeOakSpotData(col, row, nextRandom));

    occupied.add(col + "," + row);
  }

  return spots;
}

// "rng" - opsyonal na seeded random function (nextRandom); kung wala,
// Math.random (ginagamit ng mga backdrop/relocation oak na hindi na
// bahagi ng seeded na paunang paglalagay).
function makeOakSpotData(col, row, rng) {
  const random = rng || Math.random;

  return {
    col,
    row,
    idleFrameDurationMs:
      OAK_IDLE_MIN_FRAME_MS +
      random() * (OAK_IDLE_MAX_FRAME_MS - OAK_IDLE_MIN_FRAME_MS),
    idlePhaseOffsetMs: random() * 20000,
    hitAnimDurationMs:
      OAK_HIT_ANIM_MIN_MS +
      random() * (OAK_HIT_ANIM_MAX_MS - OAK_HIT_ANIM_MIN_MS),
  };
}

// Dagdag na 2 oak SA LIKOD (itaas/north) ng oldman - hiwalay ito sa
// random OAK_COUNT_PER_WORLD pool. Kailangang naka-set na ang
// oldManSpotCache bago ito tawagin (tingnan ang pagkakasunod-sunod sa
// map.js - MAUNA ang getOldManDrawables bago ang getOakDrawables).
const OLDMAN_BACKDROP_OAK_COUNT = 2;

function addBackdropOaksNearOldMan() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  // AYOS (hiling ng user - "erase those fixed oak trees"): dating
  // TUMATAKBO PA RIN ito kahit "noOaks: true" ang mundo (hal.
  // grassmap) - iba/hiwalay kasi ang check nito sa generateOakSpots()
  // sa itaas (na TALAGANG gumagalang sa "noOaks"). Dahil dito, 2 FIXED
  // (hindi random) na oak pa rin ang laging lumalabas malapit sa
  // oldman kahit ayaw talaga ng mundong ito ng KAHIT ANONG oak - ito
  // ang sanhi ng report ng user na "lumalabas pa rin ang mga fixed na
  // oak tree" sa grassmap. Ngayon, kaparehong "noOaks" check din ang
  // sinusunod dito.
  if (!world || world.noOaks) return;

  if (!oldManSpotCache || !oakSpotsCache) return;

  const occupied = new Set(oakSpotsCache.map((oak) => oak.col + "," + oak.row));
  const objectCells = getObjectCells();

  const baseCol = oldManSpotCache.col;
  const baseRow = oldManSpotCache.row - 2; // "likod" niya - paitaas (north)

  let placed = 0;

  for (
    let radius = 0;
    radius <= 6 && placed < OLDMAN_BACKDROP_OAK_COUNT;
    radius++
  ) {
    for (
      let dCol = -radius;
      dCol <= radius && placed < OLDMAN_BACKDROP_OAK_COUNT;
      dCol++
    ) {
      const col = baseCol + dCol;
      const row = baseRow;
      const key = col + "," + row;

      if (
        col < 1 ||
        row < 1 ||
        col >= mapData.width - 1 ||
        row >= mapData.height - 1
      )
        continue;
      if (occupied.has(key)) continue;
      if (objectCells && objectCells.has(key)) continue;

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

      oakSpotsCache.push(makeOakSpotData(col, row));
      occupied.add(key);
      placed++;
    }
  }
}

// Isang beses lang talaga tumatakbo ang mabigat na bahagi nito kada
// pagpasok sa isang mundo (parehong gawi ng ensureResourceNodes sa
// resources.js) - kasama na dito ang pag-push ng collision ng mga
// HINDI PA na-aning oak (parang puno, hinaharang ang paglakad).
function ensureOakSpots() {
  if (!mapReady || !mapData) return;
  if (oakSpotsValidatedFor === currentWorld) return;

  oakSpotsCache = generateOakSpots();

  // Dapat MAUNA na ang oldman (map.js - getOldManDrawables bago
  // getOakDrawables) para malaman kung saan siya, tapos dito lang
  // idadagdag ang 2 oak sa likod niya.
  addBackdropOaksNearOldMan();

  oakSpotsValidatedFor = currentWorld;

  const harvested = getHarvestedOakForCurrentWorld();

  for (const oak of oakSpotsCache) {
    const key = oak.col + "," + oak.row;

    if (isOakFullyHarvested(harvested, key)) continue;

    collisions.push({
      x: oak.col * TILE_SIZE,
      y: oak.row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    });
  }
}

function findOakAt(col, row) {
  if (!oakSpotsCache) return null;

  return (
    oakSpotsCache.find((oak) => oak.col === col && oak.row === row) || null
  );
}

function hasOakTargetAt(col, row) {
  const oak = findOakAt(col, row);

  if (!oak) return false;

  const harvested = getHarvestedOakForCurrentWorld();

  return !isOakFullyHarvested(harvested, oak.col + "," + oak.row);
}

// =========================
// PAG-CHOP (axe) - tingnan ang mousedown listener sa resources.js
// =========================
//
// Kaparehong-pareho ng gawi ng registerHit (resources.js): agad na
// naitatala ang hit/ani (hindi naghihintay ng animation) - ang
// PAGKAKAIBA lang, WALANG immediate shake dito. Ang HIT SPRITE
// (oak.png) mismo ay ipinapakita lang SA LABAS (playOakHitAnimation),
// sa sandaling matapos ang swing animation ng player.

function handleAxeClickOnOak(col, row) {
  const oak = findOakAt(col, row);

  if (!oak) return false;

  const harvested = getHarvestedOakForCurrentWorld();
  const key = col + "," + row;

  if (isOakFullyHarvested(harvested, key)) return false;

  const hits = (harvested[key] || 0) + 1;

  harvested[key] = hits;
  saveHarvestedOakTrees();

  if (hits < getRequiredHitsFor("wood")) return true;

  // Huling hit - talagang bumagsak na ang oak na ito dito.
  removeResourceCollisionAt(col, row);

  const yieldCount = randomResourceYield();

  if (typeof spawnGroundItem === "function") {
    for (let i = 0; i < yieldCount; i++) {
      spawnGroundItem(col, row, "wood", 1, i * GROUND_ITEM_SPAWN_STAGGER_MS);
    }
  } else {
    collectWood(yieldCount);
  }

  respawnOak(col, row);

  // Bagong LEVEL/EXP system (hotbar.js) - mas malaki nang bahagya
  // kaysa sa normal na puno (mas matagal/matigas kasi ang oak).
  if (typeof gainExp === "function") gainExp(5);

  return true;
}

// Direksyon ng "chop reaction" (oak.png/oakLeft.png, o ang snow na
// bersyon) - batay sa TALAGANG direksyon ng paglakad ng player
// (player.direction, player.js), kaparehong konsepto ng
// resolveGrassBendDirection sa grass.js: yumuyuko/humihilig ang puno
// PAPUNTA sa direksyon ng galaw ng player, parang talagang natabig
// niya ito habang sumusuntok. Kapag patayo (up/down) ang paglakad,
// ang RELATIBONG posisyon ng player laban sa oak (col) na lang ang
// basehan.
function resolveOakHitDirection(col) {
  if (player.direction === "left") return "left";
  if (player.direction === "right") return "right";

  const tileCenterX = col * TILE_SIZE + TILE_SIZE / 2;
  const playerCenterX = player.x + player.width / 2;

  return playerCenterX < tileCenterX ? "right" : "left";
}

// Tinatawag SA SANDALING matapos ang swing animation ng player (hindi
// sa mismong click) - dito lang talaga nagsisimula ang HIT SPRITE
// (oak.png/oakLeft.png, o ang snow na bersyon) na makikita sa oak.
function playOakHitAnimation(col, row) {
  const key = col + "," + row;

  oakHitAnimStarts[key] = performance.now();
  // Itinatabi ang direksyon SA SANDALING ITO LANG (hindi kada frame) -
  // kung hindi, puwedeng magpalit-palit ang itsura kahit kaunti pa
  // lang gumagalaw ang player habang tumatakbo pa ang animation.
  oakHitAnimDirs[key] = resolveOakHitDirection(col);
}

// =========================
// AUTO-REGENERATION (bagong lugar sa mapa pagkatapos maani nang buo) -
// kaparehong-pareho ng gawi ng respawnResourceNode sa resources.js.
// =========================

function findValidOakRelocationSpot() {
  if (!mapReady || !mapData || !oakSpotsCache) return null;

  const objectCells = getObjectCells();
  const occupied = new Set(oakSpotsCache.map((oak) => oak.col + "," + oak.row));

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

  return null;
}

function respawnOak(oldCol, oldRow) {
  if (!oakSpotsCache) return;

  const oak = oakSpotsCache.find(
    (item) => item.col === oldCol && item.row === oldRow,
  );

  if (!oak) return;

  const spot = findValidOakRelocationSpot();

  if (!spot) return;

  const harvested = getHarvestedOakForCurrentWorld();

  delete harvested[oldCol + "," + oldRow];
  saveHarvestedOakTrees();

  oak.col = spot.col;
  oak.row = spot.row;

  collisions.push({
    x: oak.col * TILE_SIZE,
    y: oak.row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  });
}

// =========================
// PAGGUHIT
// =========================

// Ibinabalik: { image, frameIndex } - ALIN sa dalawang spritesheet ang
// dapat gamitin ngayon (idle o hit) PATI ang tamang frame doon.
//
// AYOS: dating WALANG snow-awareness ang CHOPPABLE na oak (20 random
// na puno kada mundo, "mga pwedeng i-axe") - laging oak.png/oakidle.png
// kahit umuulan ng niyebe, kaya "kalahati lang" ang tila-may-niyebe (yung
// BACKDROP na oak na di-choppable lang ang tunay na nagpapalit sa
// snowtree.png/snowtree1.png, tingnan ang resolveBackdropOakSprite sa
// ibaba). Ngayon, PAREHONG-PAREHO na ang gawi ng dalawa - kahit
// choppable, tuwing umuulan ng niyebe, gagamit din ito ng snowtree/
// snowtree1 (idle) at snowtree/snowtreeLeft (hit) sa halip na ang
// normal na bersyon. AYOS din: dating IISA lang (oakImage) ang HIT
// reaction kahit anong panahon - ngayon MAY DALAWANG bersyon na rin ito
// (kaliwa/kanan, batay sa direksyon ng suntok - tingnan ang
// resolveOakHitDirection), pareho sa normal AT sa snow na panahon.
function resolveOakSprite(spot) {
  const key = spot.col + "," + spot.row;
  const hitStartedAt = oakHitAnimStarts[key];

  if (hitStartedAt !== undefined) {
    const age = performance.now() - hitStartedAt;

    if (age < spot.hitAnimDurationMs) {
      const progress = age / spot.hitAnimDurationMs;
      const dir = oakHitAnimDirs[key] || "right";

      // AYOS: dating IISA lang (oakImage) ang HIT reaction kahit ano
      // pa ang panahon/direksyon - ngayon MAY DALAWANG bagay na
      // pinagbabatayan:
      //   1. Direksyon ng suntok (dir) - "left" -> naka-mirror na
      //      bersyon (oakLeft.png / snowtreeLeft.png), "right" ->
      //      ang orihinal (oak.png / snowtree.png).
      //   2. Panahon - kapag umuulan ng niyebe, gamit ang snow na
      //      bersyon (parehong larawan ng "idle" snow stage sa ibaba,
      //      REUSED - hindi duplicated), para tuluy-tuloy ang itsura
      //      ng puno bago/pagkatapos ng hit.
      const snowy = typeof isSnowWeather === "function" && isSnowWeather();

      const image = snowy
        ? dir === "left"
          ? backdropSnowTreeLeftImage
          : backdropSnowTreeImage
        : dir === "left"
          ? oakLeftImage
          : oakImage;

      return {
        image,
        frameIndex: Math.min(
          OAK_FRAME_COUNT - 1,
          Math.floor(progress * OAK_FRAME_COUNT),
        ),
      };
    }
  }

  // SNOW DAY: gamitin ang snowtree.png (o snowtree1.png kapag 5 min+
  // na tuloy-tuloy na umuulan ng niyebe) sa halip na ang normal na
  // oakidle - reuse na lang ang parehong larawan/threshold na ginagamit
  // na ng backdrop (di-choppable) na oak sa ibaba, para magkatugma.
  if (typeof isSnowWeather === "function" && isSnowWeather()) {
    const elapsed =
      typeof getSnowStartedAtMs === "function"
        ? getGameNow() - getSnowStartedAtMs()
        : 0;

    const image =
      elapsed >= BACKDROP_SNOW_HEAVY_AFTER_MS
        ? backdropSnowTree1Image
        : backdropSnowTreeImage;

    const t = performance.now() + spot.idlePhaseOffsetMs;
    const frameIndex =
      Math.floor(t / spot.idleFrameDurationMs) % BACKDROP_OAK_FRAME_COUNT;

    return { image, frameIndex };
  }

  // Walang aktibong hit (o tapos na) - IDLE loop. Umaandar lang (frame
  // 1-4) kapag umuulan; kapag maaraw, frame 1 lang (walang animation).
  if (typeof isRaining === "function" && !isRaining()) {
    return { image: oakIdleImage, frameIndex: 0 };
  }

  const elapsed = performance.now() + spot.idlePhaseOffsetMs;
  const frameIndex =
    Math.floor(elapsed / spot.idleFrameDurationMs) % OAK_IDLE_RAIN_FRAME_COUNT;

  return { image: oakIdleImage, frameIndex };
}

function drawOakAt(spot) {
  const { image, frameIndex } = resolveOakSprite(spot);

  if (!image.complete || image.naturalWidth === 0) return;

  // Ang snowtree.png/snowtree1.png ay PAREHONG 6-frame layout gaya ng
  // oak.png/oakidle.png (tingnan ang paliwanag sa BACKDROP OAKS sa
  // ibaba) - kaya OAK_FRAME_COUNT pa rin (hindi BACKDROP_OAK_FRAME_COUNT,
  // pareho lang naman silang 6) ang tamang divisor kahit snow image ito.
  const frameWidth = image.naturalWidth / OAK_FRAME_COUNT;
  const frameHeight = image.naturalHeight;

  const destWidth = TILE_SIZE * OAK_DEST_WIDTH_TILES;
  const destHeight = destWidth * (frameHeight / frameWidth);

  // Naka-anchor sa ILALIM ng tile (parang tumutubo mula roon) - kagaya
  // ng drawResourceSprite sa resources.js.
  const x = spot.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2;
  const y = spot.row * TILE_SIZE + TILE_SIZE - destHeight;

  // Tandaan: dating may anino dito (drawGroundShadow) - TINANGGAL
  // (bahagi 7, item 18 sa CLAUDE.md), nagdulot ito ng LAG (20 oak kada
  // mundo, OAK_COUNT_PER_WORLD = 20, PLUS blur filter kada isa kada
  // frame - mabigat sa canvas).

  ctx.drawImage(
    image,
    frameIndex * frameWidth,
    0,
    frameWidth,
    frameHeight,
    x,
    y,
    destWidth,
    destHeight,
  );
}

// AYOS (bug report ng user, may video): "kahit di mag-gamit ng axe is
// dapat nag-oopacity parin" - ang occlusion bbox ng oak ay dapat
// TUMUGMA sa TALAGANG naka-render na sprite (bottom-anchored, buong
// taas, ~70% ng lapad) - HINDI na yung dating maliit/manipis na
// hand-typed na bbox (0.7 TILE lang ang lapad, at 3 TILE lang ang taas
// na nakasimula pa sa row*TILE-2*TILE - kaya (a) sobrang kitid kumpara
// sa 4-tile na canopy, at (b) hindi umaabot sa TUKTOK ng canopy). Ito
// ang shared na helper - PAREHONG formula ng drawOakAt/drawBackdropOakAt
// (destWidth = TILE*destWidthTiles, destHeight base sa aspect ng
// larawan, bottom-anchored sa row*TILE+TILE) - naka-narrow lang ang
// lapad papuntang gitnang `widthFraction` (default 0.7) para hindi
// mag-trigger kapag TALAGANG nasa TABI pa lang (hindi pa LIKOD).
function computeOakOcclusionBbox(spot, image, destWidthTiles, widthFraction) {
  const destWidth = TILE_SIZE * destWidthTiles;

  const aspect =
    image && image.complete && image.naturalWidth
      ? image.naturalHeight / (image.naturalWidth / OAK_FRAME_COUNT)
      : 1.22; // ligtas na default kung hindi pa naka-load ang larawan

  const destHeight = destWidth * aspect;
  const bboxWidth = destWidth * widthFraction;

  return {
    x: spot.col * TILE_SIZE + TILE_SIZE / 2 - bboxWidth / 2,
    y: spot.row * TILE_SIZE + TILE_SIZE - destHeight,
    width: bboxWidth,
    height: destHeight,
  };
}

// Isinasabit sa Y-sort na "drawables" ng drawMapObjects (map.js), kaya
// tamang-tama ang pagkakapatong (z-index) ng bawat oak laban sa player
// at sa ibang bagay - hindi sila laging nasa harap o laging nasa likod.
function getOakDrawables() {
  ensureOakSpots();

  if (!oakSpotsCache) return [];

  const harvested = getHarvestedOakForCurrentWorld();

  return oakSpotsCache
    .filter(
      (spot) => !isOakFullyHarvested(harvested, spot.col + "," + spot.row),
    )
    .map((spot) => ({
      sortY: spot.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      draw: () => drawOakAt(spot),
      // See-through occlusion (tingnan ang map.js at ang
      // computeOakOcclusionBbox sa itaas) - tumutugma na ngayon sa
      // TALAGANG naka-render na oak (oakImage, OAK_DEST_WIDTH_TILES).
      bbox: computeOakOcclusionBbox(spot, oakImage, OAK_DEST_WIDTH_TILES, 0.7),
    }));
}

// =========================
// BACKDROP OAKS (dekorasyon lang - HINDI puwedeng putulin/i-axe)
// =========================
//
// 10 dagdag na oak na nakalagay SA LIKOD (hilaga/itaas) ng mga bahay,
// puro pang-tanawin lang - HINDI sila choppable (walang epekto ang axe
// sa kanila, at hindi sila naka-save sa harvestedOakTrees). Sinusundan
// nila ang parehong idle/ulan na animation ng normal na oak (oak.png /
// oakidle.png), PERO kapag SNOW DAY, pinapalitan sila ng snow na puno:
//   - snowtree.png  (0-5 min ng snow)
//   - snowtree1.png (5 min pataas ng snow)
// May collision pa rin sila (hindi madadaanan), tulad ng ibang puno.

const BACKDROP_OAK_COUNT = 0;

// Larawan: parehong 6-frame na layout ng oak.png/oakidle.png. Ang snow
// na bersyon ay animated din (6 frames) - gagamitin bilang kapalit kapag
// snow day.
const backdropOakImage = new Image();
backdropOakImage.src = "./assets/map/sprites/oak.png";

const backdropOakIdleImage = new Image();
backdropOakIdleImage.src = "./assets/map/sprites/oakidle.png";

const backdropSnowTreeImage = new Image();
backdropSnowTreeImage.src = "./assets/map/sprites/snowtree.png";

const backdropSnowTree1Image = new Image();
backdropSnowTree1Image.src = "./assets/map/sprites/snowtree1.png";

// AYOS: bagong "chop reaction" na naka-mirror sa kaliwa PARA SA SNOW
// (snowtreeLeft.png) - ginagamit ng CHOPPABLE oak (resolveOakSprite sa
// itaas) kapag umuulan ng niyebe AT papakaliwa ang direksyon ng suntok -
// tingnan ang resolveOakHitDirection. Ang backdropSnowTreeImage (walang
// "Left") na ang gamit bilang default/"right" na bersyon nito.
const backdropSnowTreeLeftImage = new Image();
backdropSnowTreeLeftImage.src = "./assets/map/sprites/snowtreeLeft.png";

// Kailan lumilipat mula snowtree.png -> snowtree1.png (mas maraming
// niyebe) - 5 minuto ng tuloy-tuloy na snow, katulad ng sa resources.js.
const BACKDROP_SNOW_HEAVY_AFTER_MS = 5 * 60 * 1000;

const BACKDROP_OAK_FRAME_COUNT = 6;
const BACKDROP_OAK_DEST_WIDTH_TILES = 3;
const BACKDROP_OAK_IDLE_RAIN_FRAME_COUNT = 4;

const BACKDROP_OAK_IDLE_MIN_FRAME_MS = 550;
const BACKDROP_OAK_IDLE_MAX_FRAME_MS = 950;

let backdropOakSpotsCache = null;
let backdropOakValidatedFor = null;

// Hinahanap ang mga cell ng bahay (House layer) - dito natin ilalagay
// ang mga oak sa LIKOD (hilaga) nito.
function getHouseCellRows() {
  if (!mapData) return [];

  const houseCells = [];

  for (const layer of flattenTileLayers(mapData.layers)) {
    if (layer.name.toLowerCase() !== "house") continue;

    for (let i = 0; i < layer.data.length; i++) {
      if (layer.data[i]) {
        houseCells.push({
          col: i % layer.width,
          row: Math.floor(i / layer.width),
        });
      }
    }
  }

  return houseCells;
}

function isBackdropOakTileFree(col, row, occupied) {
  if (
    col < 1 ||
    row < 1 ||
    col >= mapData.width - 1 ||
    row >= mapData.height - 1
  ) {
    return false;
  }

  const key = col + "," + row;

  if (occupied.has(key)) return false;

  const objectCells = getObjectCells();

  if (objectCells && objectCells.has(key)) return false;

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

// Hinahati ang mga house cell sa magkakahiwalay na bahay (connected
// components) - para makapaglagay tayo ng oak sa LIKOD ng BAWAT bahay,
// hindi lang sa itaas ng pinakamataas na bahay.
function getSeparateHouses() {
  const cells = getHouseCellRows();

  if (cells.length === 0) return [];

  const cellSet = new Set(cells.map((c) => c.col + "," + c.row));
  const visited = new Set();
  const houses = [];

  for (const start of cells) {
    const startKey = start.col + "," + start.row;

    if (visited.has(startKey)) continue;

    const group = [];
    const stack = [start];
    visited.add(startKey);

    while (stack.length) {
      const cell = stack.pop();
      group.push(cell);

      const neighbors = [
        { col: cell.col - 1, row: cell.row },
        { col: cell.col + 1, row: cell.row },
        { col: cell.col, row: cell.row - 1 },
        { col: cell.col, row: cell.row + 1 },
      ];

      for (const n of neighbors) {
        const nKey = n.col + "," + n.row;

        if (cellSet.has(nKey) && !visited.has(nKey)) {
          visited.add(nKey);
          stack.push(n);
        }
      }
    }

    const rows = group.map((c) => c.row);
    const cols = group.map((c) => c.col);

    houses.push({
      minRow: Math.min(...rows),
      minCol: Math.min(...cols),
      maxCol: Math.max(...cols),
    });
  }

  return houses;
}

function generateBackdropOakSpots() {
  if (!mapReady || !mapData) return [];

  const houses = getSeparateHouses();

  if (houses.length === 0) return [];

  const occupied = new Set();
  const spots = [];

  // Deterministiko (hindi nagbabago kada reload) - seeded sa pangalan ng
  // mundo, katulad ng resources.js.
  const seedBase = hashStringToInt(currentWorld + ":backdropOak");
  let counter = 0;
  const rand = () => seededRandom(seedBase + counter++);

  // Hatiin nang pantay ang BACKDROP_OAK_COUNT sa mga bahay - bawat bahay
  // may sariling grupo ng oak sa likod nito.
  const perHouse = Math.max(1, Math.floor(BACKDROP_OAK_COUNT / houses.length));

  for (let h = 0; h < houses.length; h++) {
    const house = houses[h];

    // Ang huling bahay ang kukuha ng natitira, para eksaktong
    // BACKDROP_OAK_COUNT ang kabuuan.
    const target =
      h === houses.length - 1 ? BACKDROP_OAK_COUNT - spots.length : perHouse;

    // Lugar sa LIKOD (hilaga/itaas) ng bahay na ito.
    const rowTop = Math.max(1, house.minRow - 6);
    const rowBottom = Math.max(1, house.minRow - 1);
    const colLeft = Math.max(1, house.minCol - 3);
    const colRight = Math.min(mapData.width - 2, house.maxCol + 3);

    let placed = 0;
    let attempt = 0;

    while (placed < target && attempt < 2000) {
      attempt++;

      const col = colLeft + Math.floor(rand() * (colRight - colLeft + 1));
      const row = rowTop + Math.floor(rand() * (rowBottom - rowTop + 1));

      if (!isBackdropOakTileFree(col, row, occupied)) continue;

      spots.push({
        col,
        row,
        idleFrameDurationMs:
          BACKDROP_OAK_IDLE_MIN_FRAME_MS +
          rand() *
            (BACKDROP_OAK_IDLE_MAX_FRAME_MS - BACKDROP_OAK_IDLE_MIN_FRAME_MS),
        idlePhaseOffsetMs: rand() * 20000,
      });

      occupied.add(col + "," + row);
      placed++;
    }
  }

  return spots;
}

function ensureBackdropOakSpots() {
  if (!mapReady || !mapData) return;
  if (backdropOakValidatedFor === currentWorld) return;

  const world = getWorld();

  // Labas na mundo lang (may bahay/panahon). Sa loob ng bahay, wala.
  if (!world || !world.outdoor) {
    backdropOakSpotsCache = [];
    backdropOakValidatedFor = currentWorld;
    return;
  }

  backdropOakSpotsCache = generateBackdropOakSpots();
  backdropOakValidatedFor = currentWorld;

  // Collision - hindi madadaanan, tulad ng ibang puno. HINDI choppable
  // kaya laging naka-collision (walang "harvested" na estado).
  for (const oak of backdropOakSpotsCache) {
    collisions.push({
      x: oak.col * TILE_SIZE,
      y: oak.row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    });
  }
}

// Aling larawan (at ilang frame ang aandar dito) ang gagamitin ngayon:
// - SNOW DAY: snowtree.png (o snowtree1.png kapag 5 min+), laging animated
// - UMUULAN (hindi snow): oakidle.png, frame 1-4 na umaandar
// - MAARAW (idle): oakidle.png frame 0 lang (walang galaw)
function resolveBackdropOakSprite(spot) {
  if (typeof isSnowWeather === "function" && isSnowWeather()) {
    const elapsed =
      typeof getSnowStartedAtMs === "function"
        ? getGameNow() - getSnowStartedAtMs()
        : 0;

    const image =
      elapsed >= BACKDROP_SNOW_HEAVY_AFTER_MS
        ? backdropSnowTree1Image
        : backdropSnowTreeImage;

    // Snow trees - laging umaandar (buong 6 frames) para may banayad na
    // pag-uga / paghulog ng niyebe.
    const t = performance.now() + spot.idlePhaseOffsetMs;
    const frameIndex =
      Math.floor(t / spot.idleFrameDurationMs) % BACKDROP_OAK_FRAME_COUNT;

    return { image, frameIndex };
  }

  // Hindi snow day - normal na oak. Umaandar lang kapag umuulan.
  if (typeof isRaining === "function" && !isRaining()) {
    return { image: backdropOakIdleImage, frameIndex: 0 };
  }

  const t = performance.now() + spot.idlePhaseOffsetMs;
  const frameIndex =
    Math.floor(t / spot.idleFrameDurationMs) %
    BACKDROP_OAK_IDLE_RAIN_FRAME_COUNT;

  return { image: backdropOakIdleImage, frameIndex };
}

function drawBackdropOakAt(spot) {
  const { image, frameIndex } = resolveBackdropOakSprite(spot);

  if (!image.complete || image.naturalWidth === 0) return;

  const frameWidth = image.naturalWidth / BACKDROP_OAK_FRAME_COUNT;
  const frameHeight = image.naturalHeight;

  const destWidth = TILE_SIZE * BACKDROP_OAK_DEST_WIDTH_TILES;
  const destHeight = destWidth * (frameHeight / frameWidth);

  const x = spot.col * TILE_SIZE + TILE_SIZE / 2 - destWidth / 2;
  const y = spot.row * TILE_SIZE + TILE_SIZE - destHeight;

  // Tandaan: dating may anino dito (drawGroundShadow) - TINANGGAL
  // (bahagi 7, item 18 sa CLAUDE.md, dahilan sa LAG - kaparehong
  // sanhi ng normal/oak trees sa itaas).

  ctx.drawImage(
    image,
    frameIndex * frameWidth,
    0,
    frameWidth,
    frameHeight,
    x,
    y,
    destWidth,
    destHeight,
  );
}

function getBackdropOakDrawables() {
  ensureBackdropOakSpots();

  if (!backdropOakSpotsCache) return [];

  return backdropOakSpotsCache.map((spot) => ({
    sortY: spot.row * TILE_SIZE + TILE_SIZE,
    order: -1,
    draw: () => drawBackdropOakAt(spot),
    // AYOS (parehong bug fix ng getOakDrawables sa itaas) - tumutugma
    // na ang bbox sa TALAGANG naka-render na backdrop oak
    // (backdropOakIdleImage, BACKDROP_OAK_DEST_WIDTH_TILES), buong taas
    // + 70% na lapad (tingnan ang computeOakOcclusionBbox).
    bbox: computeOakOcclusionBbox(
      spot,
      backdropOakIdleImage,
      BACKDROP_OAK_DEST_WIDTH_TILES,
      0.7,
    ),
  }));
}

// =========================
// OLDMAN (idle NPC + tindahan, TOP-RIGHT ng mapa)
// =========================

const OLDMAN_IMAGES = {
  front: new Image(),
  back: new Image(),
};

OLDMAN_IMAGES.front.src = "./assets/npc/oldmanIdleFront.gif";
OLDMAN_IMAGES.back.src = "./assets/npc/oldmanIdleBack.gif";

// Ilang beses lang siya puwedeng "lumingon" (magpalit ng Front/Back) -
// isang beses lang kada 5 minuto, hindi bawat ilang segundo lang.
const OLDMAN_FACE_SWITCH_INTERVAL_MS = 5 * 60 * 1000;

// 2 tiles (32px) - mas malaki kaysa sa taas ng player (24px/1.5 tile).
const OLDMAN_DEST_SIZE = TILE_SIZE * 2;

// Banayad na "paghinga" - patuloy na pag-alsa/baba ng katawan (scale
// oscillation, anchored sa paanan) - hindi ito nauubos/nagsto-stop,
// laging umaandar habang naka-stand siya.
const OLDMAN_BREATH_PERIOD_MS = 3200;
const OLDMAN_BREATH_AMPLITUDE = 0.028;

// Ilang tile mula sa itaas/kanang gilid ng mapa dapat siya lumapag
// (bago pa man hanapin ang pinakamalapit na TALAGANG bakanteng tile).
const OLDMAN_TOP_RIGHT_MARGIN_TILES = 4;

let oldManSpotCache = null;
let oldManSpotValidatedFor = null;

// =========================
// TAHANANG MUNDO NG OLDMAN (iisang mundo lang siya lumalabas)
// =========================
//
// AYOS (hiling ng user): "i want him only in one map like grassmap or
// grassmap2 he only spawn once in grassmap or grassmap2" - dating
// kahit anong "world.outdoor" na mundo (town, grassmap, grassmap2...)
// ay may SARILI/HIWALAY na oldman (nag-re-reset/nagbabagong-buo ang
// oldManSpotCache/oldManWander kada bagong currentWorld sa
// ensureOldManSpot sa ibaba) - kaya PARANG magkakaibang oldman (o
// parehong tao na sabay-sabay nasa dalawang lugar) ang lumalabas kada
// pumasok ka sa ibang outdoor world. MALI - dapat IISA lang talaga
// siya, sa IISANG mundo lang.
//
// AYOS: random na pumipili (ISANG BESES lang, tapos NAKA-SAVE na sa
// localStorage - kaya PAREHO PALAGI kahit mag-reload) ng ISA sa
// "grassmap"/"grassmap2" bilang TAHANANG mundo niya - doon LANG siya
// lalabas (kabilang na ang random na paglabas-masok niya via
// vanishOldMan/reappearOldMan, tingnan sa ibaba). Sa LAHAT ng ibang
// mundo (kasama na ang "town"), WALANG oldman - tingnan ang guard sa
// ensureOldManSpot.
const OLDMAN_HOME_WORLD_SAVE_KEY = "tralala.oldManHomeWorld";
const OLDMAN_POSSIBLE_HOME_WORLDS = ["grassmap", "grassmap2"];

let oldManHomeWorldCache = null;

function getOldManHomeWorld() {
  if (oldManHomeWorldCache) return oldManHomeWorldCache;

  try {
    const saved = localStorage.getItem(OLDMAN_HOME_WORLD_SAVE_KEY);

    if (OLDMAN_POSSIBLE_HOME_WORLDS.includes(saved)) {
      oldManHomeWorldCache = saved;
      return oldManHomeWorldCache;
    }
  } catch (error) {
    // Hindi kritikal - dadaan na lang sa bagong random na pagpili sa ibaba.
  }

  oldManHomeWorldCache =
    OLDMAN_POSSIBLE_HOME_WORLDS[
      Math.floor(Math.random() * OLDMAN_POSSIBLE_HOME_WORLDS.length)
    ];

  try {
    localStorage.setItem(OLDMAN_HOME_WORLD_SAVE_KEY, oldManHomeWorldCache);
  } catch (error) {
    // Hindi kritikal - gagana pa rin ang session na ito, babalik lang
    // sa panibagong random na pagpili sa susunod na reload.
  }

  return oldManHomeWorldCache;
}

// Hinahanap ang pinakamalapit na BAKANTENG tile sa paligid ng isang
// anchor point (world pixels), gumagalaw papalayo nang paunti-unti
// (spiral) hanggang may mahanap.
function findFreeSpotNear(anchorX, anchorY, maxRadiusTiles) {
  if (!mapReady || !mapData) return null;

  const objectCells = getObjectCells();
  const anchorCol = Math.floor(anchorX / TILE_SIZE);
  const anchorRow = Math.floor(anchorY / TILE_SIZE);

  for (let radius = 0; radius <= maxRadiusTiles; radius++) {
    for (let dRow = -radius; dRow <= radius; dRow++) {
      for (let dCol = -radius; dCol <= radius; dCol++) {
        if (Math.max(Math.abs(dRow), Math.abs(dCol)) !== radius) continue;

        const col = anchorCol + dCol;
        const row = anchorRow + dRow;

        if (
          col < 1 ||
          row < 1 ||
          col >= mapData.width - 1 ||
          row >= mapData.height - 1
        ) {
          continue;
        }

        const key = col + "," + row;

        if (objectCells && objectCells.has(key)) continue;

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
    }
  }

  return null;
}

// Hinahanap lang siya ISANG BESES kada pagpasok sa isang mundo (kahit
// anong outdoor world - hindi na ito nakatali sa bahay/pintuan).
function ensureOldManSpot() {
  if (!mapReady || !mapData) return;
  if (oldManSpotValidatedFor === currentWorld) return;

  oldManSpotValidatedFor = currentWorld;
  oldManSpotCache = null;
  oldManWander = null; // bagong mundo - bagong wander state din

  const world = getWorld();

  if (!world || !world.outdoor) return;

  // AYOS (hiling ng user): tingnan ang paliwanag sa itaas ng
  // OLDMAN_HOME_WORLD_SAVE_KEY - IISANG mundo lang (random na pinili,
  // grassmap o grassmap2) ang TALAGANG puwestuhan niya, kahit outdoor
  // pa rin ang ibang mundo (hal. town) - doon, WALANG oldman.
  if (currentWorld !== getOldManHomeWorld()) return;

  const anchorCol = mapData.width - 1 - OLDMAN_TOP_RIGHT_MARGIN_TILES;
  const anchorRow = OLDMAN_TOP_RIGHT_MARGIN_TILES;

  oldManSpotCache = findFreeSpotNear(
    anchorCol * TILE_SIZE + TILE_SIZE / 2,
    anchorRow * TILE_SIZE + TILE_SIZE / 2,
    12,
  );

  if (oldManSpotCache) initOldManWander();
}

// Kasalukuyang tile lang ba siya nakatayo (hindi na ang bahay/tindahan
// niya) - ito na ang gamit ngayon para malaman kung saan siya
// TALAGA kada frame, dahil naglalakad na siya ngayon (tingnan ang
// "OLDMAN - PAGLALAKAD" sa ibaba). Kapag "gone" siya (nawawala sa
// mapa), walang matatamaan dito.
function isOldManTile(col, row) {
  return Boolean(
    oldManWander &&
    oldManWander.state !== "gone" &&
    oldManWander.col === col &&
    oldManWander.row === row,
  );
}

// Purong function ng ORAS - walang itinatabing estado. Kaya kailangan
// (5 minuto) bago siya lumingon sa kabilang direksyon. Ginagamit LANG
// habang TALAGANG naka-idle siya (hindi naglalakad, hindi bukas ang
// tindahan) - tingnan ang resolveOldManSprite sa ibaba.
function getOldManFacing() {
  const cycle = Math.floor(performance.now() / OLDMAN_FACE_SWITCH_INTERVAL_MS);

  return cycle % 2 === 0 ? "front" : "back";
}

// Ginagamit ng proximity popup (tingnan sa ibaba) para malaman kung
// malapit/nadidikit na ang player sa oldman - kasalukuyang posisyon
// niya (oldManWander), hindi na ang bahay/tindahan niya.
function isPlayerOverlappingOldMan() {
  if (!oldManWander || oldManWander.state === "gone") return false;

  const oldManBox = {
    x: oldManWander.col * TILE_SIZE + TILE_SIZE * 0.25,
    y: oldManWander.row * TILE_SIZE - TILE_SIZE * 0.75,
    width: TILE_SIZE * 0.5,
    height: TILE_SIZE * 1.75,
  };

  const playerBox = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  return isColliding(playerBox, oldManBox);
}

// =========================
// OLDMAN - PAGLALAKAD (random na naglalakad, humihinto ng 30s, minsan
// nawawala sa mapa)
// =========================
//
// Bago lang ito, hindi na siya laging naka-tayo lang sa iisang tile.
// May 4 na estado siya (oldManWander.state):
//
//   "idle"    - naka-tayo lang, humihinga (front/back breathing gif) -
//               tumatagal ng eksaktong OLDMAN_IDLE_DURATION_MS (30s)
//               bago siya magpasyang maglakad ulit.
//   "walking" - papunta sa isang random na kalapit na tile (sa loob ng
//               OLDMAN_WANDER_RADIUS_TILES mula sa TALAGANG tindahan
//               niya - hindi siya lumalayo nang sobra), gamit ang
//               tamang direksyon na walk gif (Oldman_north/south/
//               east/west, 6 frame, magkakahiwalay na GIF file kada
//               frame - tingnan ang OLDMAN_WALK_IMAGES sa ibaba).
//   "gone"    - pansamantalang WALANG guhit/click target - "nawala sa
//               mapa" - tingnan ang vanishOldMan/reappearOldMan.
//   (walang "dead" - hindi siya nasasaktan/namamatay, iba ito sa pig.)
//
// Kapag BUKAS ang tindahan niya (oldManShopPanelOpen, decor.js sa
// ibaba pa) - humihinto agad ang paglalakad, at LUMILINGON siya
// papunta sa player (facePlayer) - iyon ang "paraharap" na hiniling.

const OLDMAN_WALK_DIRECTIONS = ["north", "south", "east", "west"];
const OLDMAN_WALK_FRAME_COUNT = 6;
const OLDMAN_WALK_FRAME_MS = 200; // 0.2s kada frame - base sa filename mismo ng bawat GIF

// Magkakahiwalay na GIF file kada frame (hindi isang spritesheet) -
// tingnan ang assets/npc/oldman/walk/Oldman_<direksyon>/frame_N_delay-0.2s.gif
const OLDMAN_WALK_IMAGES = {};

for (const oldManDir of OLDMAN_WALK_DIRECTIONS) {
  // Tandaan: "Oldman_west" atbp. ang TALAGANG pangalan ng folder sa
  // assets/npc/oldman/walk/ (malaking "O" lang, maliit ang direksyon) -
  // huwag baguhin/i-capitalize pa ang direksyon dito.
  const folderName = "Oldman_" + oldManDir;

  OLDMAN_WALK_IMAGES[oldManDir] = [];

  for (let frame = 0; frame < OLDMAN_WALK_FRAME_COUNT; frame++) {
    const frameImg = new Image();

    frameImg.src =
      "./assets/npc/oldman/walk/" +
      folderName +
      "/frame_" +
      frame +
      "_delay-0.2s.gif";

    OLDMAN_WALK_IMAGES[oldManDir].push(frameImg);
  }
}

// Gaano kalayo (sa tiles) sa PALIGID ng tindahan niya puwede siyang
// gumala - para hindi siya basta-basta mawawala sa paningin ng player
// kapag bumisita sa tindahan.
const OLDMAN_WANDER_RADIUS_TILES = 4;

// Mabagal na lakad (matandang tao) - piksel kada segundo.
const OLDMAN_WALK_SPEED_PX_PER_SEC = 26;

// Munting "paanan" na box - gamit ng canFeetMoveTo (continuous
// collision) habang naglalakad, para hindi siya makadaan sa puno/
// bahay/bato.
const OLDMAN_COLLISION_BOX_WIDTH = TILE_SIZE * 0.6;
const OLDMAN_COLLISION_BOX_HEIGHT = TILE_SIZE * 0.4;

// LIVE (gumagalaw kada frame) na collision box ng oldman - HIWALAY sa
// static na `collisions` array (na para lang sa mga di-gumagalaw na
// bagay) - ginagamit ng PLAYER (collisions.js → canMoveTo) at ng PIG
// (pig.js → canFeetMoveTo) para "totoo" ring hadlang ang oldman -
// hindi na puwedeng patawirin/i-overlap ng player/pig ang oldman.
function getOldManCollisionBox() {
  if (!oldManWander || oldManWander.state === "gone") return null;

  return {
    x: oldManWander.x - OLDMAN_COLLISION_BOX_WIDTH / 2,
    y: oldManWander.y - OLDMAN_COLLISION_BOX_HEIGHT,
    width: OLDMAN_COLLISION_BOX_WIDTH,
    height: OLDMAN_COLLISION_BOX_HEIGHT,
  };
}

// "humihinto din ng 30 seconds" - eksaktong 30s bawat pagkakataon.
const OLDMAN_IDLE_DURATION_MS = 30 * 1000;

// Pagitan bago siya "mawala sa mapa" (random, para hindi laging
// pareho ang timing) at kung gaano siya katagal na wala.
const OLDMAN_DISAPPEAR_INTERVAL_MIN_MS = 2.5 * 60 * 1000;
const OLDMAN_DISAPPEAR_INTERVAL_MAX_MS = 5 * 60 * 1000;
const OLDMAN_DISAPPEAR_DURATION_MIN_MS = 25 * 1000;
const OLDMAN_DISAPPEAR_DURATION_MAX_MS = 60 * 1000;

// Kapag bumalik siya - ilang porsyento ang tsansang "parang traveler"
// siyang lumitaw sa ISANG BAGONG random na bahagi ng mapa (sa halip
// na bumalik lang sa tindahan niya).
const OLDMAN_TRAVELER_SPOT_CHANCE = 0.5;
const OLDMAN_TRAVELER_SEARCH_RADIUS_TILES = 40;

let oldManWander = null;

// Simpleng random helper - ginagamit din ito ng pig.js (naglo-load
// pagkatapos ng file na ito, kaya available na siya).
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Purong pagsusuri kung "puwede bang lakaran" ang isang tile - GENERIC
// na bersyon ito (hindi lang para sa oldman) - ginagamit din ito ng
// pig.js para sa sariling paglalakad ng mga baboy.
function isFreeWanderTile(col, row) {
  if (!mapReady || !mapData) return false;

  if (
    col < 1 ||
    row < 1 ||
    col >= mapData.width - 1 ||
    row >= mapData.height - 1
  ) {
    return false;
  }

  const objectCells = getObjectCells();
  const key = col + "," + row;

  if (objectCells && objectCells.has(key)) return false;

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

// Tinatawag ng canFeetMoveTo sa ibaba - ibinabalik ang lahat ng
// "col,row" na tile na TALAGANG na-o-overlap ng isang box (hindi lang
// isang tile, kaya tama pa rin kahit malaki/naka-diagonal ang box sa
// pagitan ng 2+ tile).
function getTileCellsForBox(box) {
  const cells = [];
  const minCol = Math.floor(box.x / TILE_SIZE);
  const maxCol = Math.floor((box.x + box.width - 0.01) / TILE_SIZE);
  const minRow = Math.floor(box.y / TILE_SIZE);
  const maxRow = Math.floor((box.y + box.height - 0.01) / TILE_SIZE);

  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      cells.push(col + "," + row);
    }
  }

  return cells;
}

// Continuous (piksel-by-piksel) na collision check, base sa "paanan"
// (feetX, feetY - iisang anchor point, tulad ng x/y ng oldman/pig) -
// GAMIT ito (hindi ang per-TILE na isFreeWanderTile sa itaas) SA
// TUWING GUMAGALAW ang isang naglalakad na character, para hindi
// sila basta "makadaan"/tumawid sa puno/bahay/bato sa PAGITAN ng
// kasalukuyan at destinasyong tile (hal. diagonal na galaw na
// "nakakadaplis" lang sa gilid ng isang collidable na bagay - hindi
// ito nahuhuli ng isFreeWanderTile mismo, dahil TILE lang ang
// tinitingnan noon, hindi ang buong daanan). Ginagamit din ito ng
// pig.js (sunod na file, naglo-load pagkatapos nito).
//
// AYOS (bug na dating hindi nag-co-collide ang oldman/pig sa puno/
// bahay/bato): dating `collisions` array LANG (galing sa Tiled
// "Collisions" objectgroup + mga DYNAMIC na puno/oak na itinutulak ng
// resources.js/decor.js) ang tinitingnan dito - HINDI kasama ang mga
// STATIC na puno/bahay/bato/bakod na direktang GUHIT sa Tiled bilang
// "overlap" tile layer ("trees"/"house"/"rocks"/"fence" -
// OVERLAP_LAYER_NAMES sa map.js). Kaya kung walang manual na rectangle
// sa "Collisions" layer sa eksaktong puwesto ng isang puno/bahay/bato,
// nakakadaan/naka-clip lang dito ang oldman/pig kahit "buo" itong
// nakikita sa screen. Ngayon, chine-check din ang `getObjectCells()`
// (dig.js - PAREHONG pinagmumulan ng "occupied" cells na ginagamit ng
// isFreeWanderTile/generatePigSpots sa itaas) para sa BAWAT tile na
// na-o-overlap ng box - kaya kahit static na Tiled art lang (walang
// hiwalay na "Collisions" rectangle) ang puno/bahay/bato, tunay pa
// ring hinaharang nito ang paglalakad.
function canFeetMoveTo(feetX, feetY, boxWidth, boxHeight, options) {
  options = options || {};

  const box = {
    x: feetX - boxWidth / 2,
    y: feetY - boxHeight,
    width: boxWidth,
    height: boxHeight,
  };

  if (collisions.some((collision) => isColliding(box, collision))) {
    return false;
  }

  const objectCells =
    typeof getObjectCells === "function" ? getObjectCells() : null;

  if (objectCells) {
    for (const key of getTileCellsForBox(box)) {
      if (objectCells.has(key)) return false;
    }
  }

  // Bagong "buhay" na collision - hindi lang mga bagay/puno/bahay ang
  // hinaharang ng oldman/pig habang naglalakad, kundi ang PLAYER at
  // ang isa't isa (oldman ↔ pig, pig ↔ pig) - kaparehong hiling ng
  // "collision on their own". Ang `options.skipPlayer`/
  // `options.skipOldMan`/`options.excludePig` ay para hindi
  // "bumangga sa sarili" ang tumatawag mismo (hal. hindi kailangang
  // i-check ng oldman ang sarili niyang box).
  if (!options.skipPlayer && typeof getPlayerCollisionBox === "function") {
    const playerBox = getPlayerCollisionBox();

    if (playerBox && isColliding(box, playerBox)) return false;
  }

  if (!options.skipOldMan && typeof getOldManCollisionBox === "function") {
    const oldManBox = getOldManCollisionBox();

    if (oldManBox && isColliding(box, oldManBox)) return false;
  }

  if (typeof getPigCollisionBoxes === "function") {
    if (
      getPigCollisionBoxes(options.excludePig).some((pigBox) =>
        isColliding(box, pigBox),
      )
    ) {
      return false;
    }
  }

  // Naka-lagay na Crafter/Stove (craft.js/stove.js) - hadlang din ito
  // para sa oldman/pig, hindi lang sa player (canMoveTo, collisions.js).
  if (typeof getPlacedCrafterCollisionBoxes === "function") {
    if (
      getPlacedCrafterCollisionBoxes().some((crafterBox) =>
        isColliding(box, crafterBox),
      )
    ) {
      return false;
    }
  }

  if (typeof getPlacedStoveCollisionBoxes === "function") {
    if (
      getPlacedStoveCollisionBoxes().some((stoveBox) =>
        isColliding(box, stoveBox),
      )
    ) {
      return false;
    }
  }

  // Naka-lagay na Light/Lamp (light.js) - bagong hiling ng user, hadlang
  // din ito para sa oldman/pig, hindi lang sa player (canMoveTo,
  // collisions.js).
  if (typeof getPlacedLightCollisionBoxes === "function") {
    if (
      getPlacedLightCollisionBoxes().some((lightBox) =>
        isColliding(box, lightBox),
      )
    ) {
      return false;
    }
  }

  // Naka-lagay na Bed (bed.js) - bagong hiling ng user, hadlang din ito
  // para sa oldman/pig, hindi lang sa player (canMoveTo, collisions.js).
  if (typeof getPlacedBedCollisionBoxes === "function") {
    if (
      getPlacedBedCollisionBoxes().some((bedBox) => isColliding(box, bedBox))
    ) {
      return false;
    }
  }

  // AYOS (hiling ng user): "alisin mo na yung collisions niya kung san
  // siya naka drop" - dating hadlang din ito para sa oldman/pig - hindi
  // na, kaparehong ayos ng canMoveTo (collisions.js) - tingnan doon.

  return true;
}

// =========================
// PAGGALAW NG NAGLALAKAD NA NPC (oldman/pig) - collision-safe
// =========================
//
// BUG (hiling ng user: "dapat hindi siya makakadaan sa mga collisions
// kagaya ng character"): dating ISANG malaking hakbang kada frame ang
// ginagawa ng oldman/pig, tapos ang DESTINASYON lang ng hakbang na iyon
// ang chine-check sa canFeetMoveTo. 2 butas iyon:
//
//   1) TUNNELING - RAW na deltaMs ang ipinapasa ng update.js sa
//      updateOldManWander/updatePigs (hindi tulad ng player, na
//      naka-clamp sa MAX_FRAME_DELTA_MS). Kapag nag-lag o naka-
//      background ang tab, puwedeng umabot sa libong milisegundo ang
//      deltaMs - isang hakbang na ilang TILE ang layo. Dahil ang
//      DULO lang ng hakbang ang chine-check, "tumatalon" siya sa
//      KABILANG GILID ng puno/bahay/bakod - mukhang dumaan siya sa
//      collision.
//   2) WALANG SLIDING - kapag barado ang diagonal na hakbang, tumitigil
//      siya nang tuluyan; hindi siya makausad sa gilid ng harang gaya
//      ng player (na hiwalay ang X at Y na check - tingnan ang
//      update.js).
//
// Inaayos ito ng moveFeetTowards sa ibaba: hinahati ang galaw ng isang
// frame sa maliliit na hakbang (FEET_SUBSTEP_MAX_PX), bawat isa ay
// dumaraan sa canFeetMoveTo, at may axis sliding - eksaktong-eksakto
// kung paano gumagalaw ang character.

// Pinakamalaking layo ng ISANG substep. Mas maliit ito kaysa sa
// pinakamaliit na collision box sa laro, kaya imposible nang
// "makalusot" sa pagitan ng 2 check.
const FEET_SUBSTEP_MAX_PX = 2;

// Kapareho ng MAX_FRAME_DELTA_MS ng player (update.js) - hindi natin
// hinahayaang gumalaw nang napakalayo ang isang NPC sa isang frame
// lang kapag nag-lag/nag-background ang tab.
const WANDER_MAX_FRAME_DELTA_MS = 100;

function clampWanderDelta(deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;

  return Math.min(deltaMs, WANDER_MAX_FRAME_DELTA_MS);
}

// Igalaw ang "paanan" (feetX/feetY) papunta sa target nang hanggang
// `maxDistance` na piksel - hakbang-hakbang, may collision check kada
// hakbang, at may axis sliding kapag barado ang diagonal.
// Ibinabalik: { x, y, moved, blocked }.
function moveFeetTowards(
  feetX,
  feetY,
  targetX,
  targetY,
  maxDistance,
  boxWidth,
  boxHeight,
  options,
) {
  let x = feetX;
  let y = feetY;
  let remaining = Math.max(0, maxDistance);
  let blocked = false;

  while (remaining > 0.0001) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);

    // Nakarating na.
    if (dist <= 0.0001) break;

    const stepLength = Math.min(FEET_SUBSTEP_MAX_PX, remaining, dist);
    const stepX = (dx / dist) * stepLength;
    const stepY = (dy / dist) * stepLength;

    if (canFeetMoveTo(x + stepX, y + stepY, boxWidth, boxHeight, options)) {
      x += stepX;
      y += stepY;
    } else if (
      stepX !== 0 &&
      canFeetMoveTo(x + stepX, y, boxWidth, boxHeight, options)
    ) {
      // Barado ang diagonal - dumausdos sa X lang (gaya ng player).
      x += stepX;
      blocked = true;
    } else if (
      stepY !== 0 &&
      canFeetMoveTo(x, y + stepY, boxWidth, boxHeight, options)
    ) {
      // ...o sa Y lang.
      y += stepY;
      blocked = true;
    } else {
      // Talagang barado sa lahat ng direksyon - tumigil dito.
      blocked = true;
      break;
    }

    remaining -= stepLength;
  }

  return { x, y, moved: x !== feetX || y !== feetY, blocked };
}

// Tinatawag sa loob ng ensureOldManSpot - isang beses lang, kapag
// unang natagpuan (o na-reset dahil bagong mundo) ang tindahan niya.
function initOldManWander() {
  oldManWander = {
    col: oldManSpotCache.col,
    row: oldManSpotCache.row,
    // "Home" - ang gitna ng paglalakad niya (OLDMAN_WANDER_RADIUS_TILES
    // ang paligid nito). Karaniwan ito ang tindahan niya, PERO kapag
    // lumitaw siyang "traveler" sa malayong bahagi ng mapa
    // (reappearOldMan), ang BAGONG puwesto niya ang nagiging home -
    // kung hindi, tatawid siya sa buong mapa pabalik sa tindahan kada
    // lakad, na siyang dahilan kung bakit lagi siyang nakabangga/
    // nakabara sa mga bagay sa daan.
    homeCol: oldManSpotCache.col,
    homeRow: oldManSpotCache.row,
    x: oldManSpotCache.col * TILE_SIZE + TILE_SIZE / 2,
    y: oldManSpotCache.row * TILE_SIZE + TILE_SIZE,
    facing: "south",
    moving: false,
    state: "idle",
    // Mag-iidle muna siya bago maglakad sa unang pagkakataon - hindi
    // agad-agad pagpasok mo sa mundo.
    phaseUntil: performance.now() + OLDMAN_IDLE_DURATION_MS,
    targetCol: null,
    targetRow: null,
    targetX: null,
    targetY: null,
    nextDisappearAt:
      performance.now() +
      randomBetween(
        OLDMAN_DISAPPEAR_INTERVAL_MIN_MS,
        OLDMAN_DISAPPEAR_INTERVAL_MAX_MS,
      ),
  };
}

function pickOldManWalkTarget() {
  if (!oldManSpotCache || !oldManWander) return null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const dCol = Math.round(
      (Math.random() * 2 - 1) * OLDMAN_WANDER_RADIUS_TILES,
    );
    const dRow = Math.round(
      (Math.random() * 2 - 1) * OLDMAN_WANDER_RADIUS_TILES,
    );

    // PALIGID ng "home" niya ang batayan (hindi ng kasalukuyang
    // tayuan) - para hindi siya "lumutang" papalayo nang paunti-unti sa
    // paglipas ng oras. Karaniwan ang tindahan ang home, maliban kung
    // "traveler" siya ngayon (tingnan ang initOldManWander/
    // reappearOldMan) - kaya laging MAIKLI ang bawat lakad at hindi na
    // siya tumatawid sa buong mapa.
    const baseCol = Number.isFinite(oldManWander.homeCol)
      ? oldManWander.homeCol
      : oldManSpotCache.col;
    const baseRow = Number.isFinite(oldManWander.homeRow)
      ? oldManWander.homeRow
      : oldManSpotCache.row;

    const col = baseCol + dCol;
    const row = baseRow + dRow;

    if (col === oldManWander.col && row === oldManWander.row) continue;
    if (!isFreeWanderTile(col, row)) continue;

    return { col, row };
  }

  return null;
}

function startOldManWalk() {
  const target = pickOldManWalkTarget();

  if (!target) {
    // Walang mahanap na lugar ngayon (baka lahat naka-block) - mag-
    // iidle na lang muna ulit sa halip na mag-crash/mag-freeze.
    oldManWander.state = "idle";
    oldManWander.phaseUntil = performance.now() + OLDMAN_IDLE_DURATION_MS;

    return;
  }

  oldManWander.state = "walking";
  oldManWander.moving = true;
  oldManWander.targetCol = target.col;
  oldManWander.targetRow = target.row;
  oldManWander.targetX = target.col * TILE_SIZE + TILE_SIZE / 2;
  oldManWander.targetY = target.row * TILE_SIZE + TILE_SIZE;

  const dx = oldManWander.targetX - oldManWander.x;
  const dy = oldManWander.targetY - oldManWander.y;

  oldManWander.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "east"
        : "west"
      : dy > 0
        ? "south"
        : "north";
}

function finishOldManWalk() {
  oldManWander.moving = false;
  oldManWander.state = "idle";
  oldManWander.phaseUntil = performance.now() + OLDMAN_IDLE_DURATION_MS;
}

function stepOldManWalk(deltaMs) {
  // NAKA-CLAMP na deltaMs (tingnan ang clampWanderDelta) - kung hindi,
  // isang lag spike/naka-background na tab ay puwedeng magpalipat sa
  // kanya ng ilang TILE sa isang frame at tumawid sa kabilang gilid ng
  // isang puno/bahay.
  const step =
    (OLDMAN_WALK_SPEED_PX_PER_SEC * clampWanderDelta(deltaMs)) / 1000;

  if (step <= 0) return;

  // Hakbang-hakbang (may collision check kada isa) at may axis
  // sliding - kaparehong-pareho ng galaw ng player (update.js:
  // hiwalay na canMoveTo sa X at sa Y).
  const result = moveFeetTowards(
    oldManWander.x,
    oldManWander.y,
    oldManWander.targetX,
    oldManWander.targetY,
    step,
    OLDMAN_COLLISION_BOX_WIDTH,
    OLDMAN_COLLISION_BOX_HEIGHT,
    { skipOldMan: true },
  );

  oldManWander.x = result.x;
  oldManWander.y = result.y;

  const remaining = Math.hypot(
    oldManWander.targetX - oldManWander.x,
    oldManWander.targetY - oldManWander.y,
  );

  // Nakarating na sa destinasyon.
  if (remaining <= 0.01) {
    oldManWander.col = oldManWander.targetCol;
    oldManWander.row = oldManWander.targetRow;
    finishOldManWalk();

    return;
  }

  // Talagang barado (hindi na makausad kahit padausdos sa X o sa Y) -
  // mag-iidle muna dito, tapos mamimili ng BAGONG destinasyon.
  if (!result.moved) {
    // Tandaan ang TALAGANG tile na kinatatayuan niya ngayon - kung
    // hindi, mananatiling luma (ang pinanggalingan) ang col/row niya,
    // kaya mali ang isOldManTile/susunod na pagpili ng destinasyon.
    oldManWander.col = Math.floor(oldManWander.x / TILE_SIZE);
    oldManWander.row = Math.floor((oldManWander.y - 1) / TILE_SIZE);
    finishOldManWalk();

    return;
  }

  // Nadausdos siya sa gilid ng isang harang - patuloy pa rin siyang
  // naglalakad, pero i-update ang col/row para tumugma sa TALAGANG
  // kinatatayuan niya.
  oldManWander.col = Math.floor(oldManWander.x / TILE_SIZE);
  oldManWander.row = Math.floor((oldManWander.y - 1) / TILE_SIZE);
}

function vanishOldMan() {
  oldManWander.state = "gone";
  oldManWander.moving = false;
  oldManWander.phaseUntil =
    performance.now() +
    randomBetween(
      OLDMAN_DISAPPEAR_DURATION_MIN_MS,
      OLDMAN_DISAPPEAR_DURATION_MAX_MS,
    );

  // Awtomatikong isasara ang tindahan niya kung bukas pa ito - wala
  // namang kausap na oldman kung wala siya sa mapa.
  if (oldManShopPanelOpen && typeof syncOldManShopPanel === "function") {
    oldManShopPanelOpen = false;
    syncOldManShopPanel();
  }
}

function reappearOldMan() {
  let spot = null;

  // Minsan, bumabalik lang siya sa dating pwesto niya (tindahan). Sa
  // ibang pagkakataon, "parang traveler" - bigla siyang lalabas sa
  // ibang bahagi ng mapa, parang bagong dating.
  if (Math.random() < OLDMAN_TRAVELER_SPOT_CHANCE && mapData) {
    const randomCol = 1 + Math.floor(Math.random() * (mapData.width - 2));
    const randomRow = 1 + Math.floor(Math.random() * (mapData.height - 2));

    spot = findFreeSpotNear(
      randomCol * TILE_SIZE + TILE_SIZE / 2,
      randomRow * TILE_SIZE + TILE_SIZE / 2,
      OLDMAN_TRAVELER_SEARCH_RADIUS_TILES,
    );
  }

  // Huling siguro: kahit "libre" ang tile ayon sa findFreeSpotNear
  // (tile/objectCells/collisions lang ang tinitingnan noon), baka may
  // NAKA-LAGAY na bagay o may pig/player doon ngayon - huwag siyang
  // ilitaw sa loob ng isang collision.
  if (
    spot &&
    !canFeetMoveTo(
      spot.col * TILE_SIZE + TILE_SIZE / 2,
      spot.row * TILE_SIZE + TILE_SIZE,
      OLDMAN_COLLISION_BOX_WIDTH,
      OLDMAN_COLLISION_BOX_HEIGHT,
      { skipOldMan: true },
    )
  ) {
    spot = null;
  }

  if (!spot) spot = oldManSpotCache; // fallback: bumalik sa tindahan

  oldManWander.col = spot.col;
  oldManWander.row = spot.row;
  // BAGONG "home" - dito na siya gagala habang nandito siya (hindi na
  // siya tatawid pabalik sa tindahan sa isang mahabang tuwid na linya).
  oldManWander.homeCol = spot.col;
  oldManWander.homeRow = spot.row;
  oldManWander.x = spot.col * TILE_SIZE + TILE_SIZE / 2;
  oldManWander.y = spot.row * TILE_SIZE + TILE_SIZE;
  oldManWander.facing = "south";
  oldManWander.moving = false;
  oldManWander.state = "idle";
  oldManWander.phaseUntil = performance.now() + OLDMAN_IDLE_DURATION_MS;
  oldManWander.nextDisappearAt =
    performance.now() +
    randomBetween(
      OLDMAN_DISAPPEAR_INTERVAL_MIN_MS,
      OLDMAN_DISAPPEAR_INTERVAL_MAX_MS,
    );
}

// Tinatawag kada frame mula sa update() (update.js).
function updateOldManWander(deltaMs) {
  if (!oldManWander || !oldManSpotCache) return;

  // Habang bukas ang tindahan - huwag munang mag-desisyon ng bagong
  // galaw (para hindi siya biglang lumayo habang kausap mo pa siya) -
  // pero HINDI na siya pinipilit humarap sa player (dating bug/
  // hiniling nang tanggalin - basta "idle" lang, dating breathing
  // animation niya rin ang gamit, tingnan ang resolveOldManSprite).
  if (oldManShopPanelOpen) {
    oldManWander.moving = false;
    oldManWander.state = "idle";
    oldManWander.phaseUntil = performance.now() + OLDMAN_IDLE_DURATION_MS;

    return;
  }

  const now = performance.now();

  // --- DISAPPEAR/REAPPEAR ("parang traveler" paminsan-minsan) ---
  if (oldManWander.state === "gone") {
    if (now >= oldManWander.phaseUntil) reappearOldMan();

    return;
  }

  if (now >= oldManWander.nextDisappearAt) {
    vanishOldMan();

    return;
  }

  // --- WALK / IDLE CYCLE ---
  if (oldManWander.state === "idle") {
    if (now >= oldManWander.phaseUntil) startOldManWalk();

    return;
  }

  if (oldManWander.state === "walking") {
    stepOldManWalk(deltaMs);
  }
}

// Ibinabalik: ang tamang IMAGE na iguguhit ngayon - depende lang sa
// kung naglalakad siya o naka-idle (WALA nang special na "nakaharap sa
// player" na pose - tinanggal na ito, dating bug/hiniling tanggalin).
function resolveOldManSprite() {
  if (!oldManWander) return null;

  if (oldManWander.moving) {
    const frameIndex =
      Math.floor(performance.now() / OLDMAN_WALK_FRAME_MS) %
      OLDMAN_WALK_FRAME_COUNT;

    return OLDMAN_WALK_IMAGES[oldManWander.facing][frameIndex];
  }

  // Idle (hindi naglalakad, hindi bukas ang tindahan) - dating front/
  // back breathing gif, may bihirang paglingon (5 min).
  return OLDMAN_IMAGES[getOldManFacing()];
}

function drawOldMan() {
  if (!oldManWander || oldManWander.state === "gone") return;

  const img = resolveOldManSprite();

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const feetX = oldManWander.x;
  const feetY = oldManWander.y;

  // Simpleng oval na anino sa ilalim ng paanan - kaparehong konsepto
  // ng drawPlayerShadow (player.js), pero naka-anchor sa "paanan"
  // (feetX, feetY) ng oldman sa halip na sa top-left box - iginuhit
  // BAGO ang sprite mismo, kaya laging nasa ilalim/likod niya.
  // NAKATAYONG TAO ang oldman (makitid ang paa) - mas makitid/mas
  // "hinabang oval" ang anino (heightRatio mababa) kaysa sa pig sa
  // ibaba, kaparehong laki din ng aktwal na katawan niya
  // (OLDMAN_DEST_SIZE).
  drawGroundShadow(feetX, feetY, OLDMAN_DEST_SIZE * 0.42, {
    heightRatio: 0.22,
    blur: 3,
    alpha: 0.3,
    // Bahagyang itinaas (negative = pataas) - dating masyadong "malayo"
    // sa TALAGANG paa (may transparent na puwang sa ibaba mismo ng
    // sprite art), kaya parang nakalutang ang oldman sa ibabaw ng
    // anino niya - tingnan ang "offsetY" sa drawGroundShadow (decor.js).
    offsetY: -TILE_SIZE * 0.45,
  });

  // Banayad na "paghinga" - sine wave na scale (Y lang), naka-anchor sa
  // PAANAN (hindi sa gitna), para parang umaalsa/bumababa ang dibdib
  // niya, hindi lumulutang ang buong katawan. HUMIHINTO ito habang
  // naglalakad (sarili nang animation na ang nagpapakita ng galaw).
  let breatheScale = 1;

  if (!oldManWander.moving) {
    const breathePhase =
      (performance.now() % OLDMAN_BREATH_PERIOD_MS) / OLDMAN_BREATH_PERIOD_MS;

    breatheScale =
      1 + Math.sin(breathePhase * Math.PI * 2) * OLDMAN_BREATH_AMPLITUDE;
  }

  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale(1, breatheScale);
  ctx.drawImage(
    img,
    -OLDMAN_DEST_SIZE / 2,
    -OLDMAN_DEST_SIZE,
    OLDMAN_DEST_SIZE,
    OLDMAN_DEST_SIZE,
  );
  ctx.restore();

  // AYOS (hiling ng user): "alisin mo na yung mga label nila na name sa
  // ulo" - tinanggal ang drawNpcNameLabel dito (builder.js) - iniwan
  // pa rin ang function mismo kung sakaling muling kailanganin.
}

// Kasama rin siya sa Y-sort (map.js) para tamang-tama ang lalim niya
// laban sa player at sa ibang bagay - hindi siya laging nasa harap.
// Kasalukuyang posisyon (oldManWander) na ang gamit dito, hindi na
// ang bahay/tindahan niya - at wala siyang iguguhit habang "gone".
function getOldManDrawables() {
  ensureOldManSpot();

  if (!oldManWander || oldManWander.state === "gone") return [];

  return [
    {
      sortY: oldManWander.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      draw: drawOldMan,
      // "type: npc" - AYOS (bug): dating walang "type" ang object na
      // ito, kaya sa shouldOccludeForPlayer (map.js) - na dapat lang
      // mag-o-opacity ng "trees"/"house" - nadadaan siya sa
      // `if (item.type && ...)` na check (FALSE dahil walang type),
      // kaya patuloy siyang na-che-check sa bbox overlap at
      // NALALABUAN (opacity 0.45) tuwing nag-o-overlap ang player sa
      // kanya. Ngayon may "npc" na type - WALA ito sa
      // OCCLUDABLE_OVERLAP_TYPES (trees/house lang), kaya laging 100%
      // opacity/buo ang itsura niya kahit dumaan/mag-overlap ang
      // player.
      type: "npc",
      bbox: {
        x: oldManWander.col * TILE_SIZE + TILE_SIZE * 0.25,
        y: oldManWander.row * TILE_SIZE - TILE_SIZE * 0.75,
        width: TILE_SIZE * 0.5,
        height: TILE_SIZE * 1.75,
      },
    },
  ];
}

// =========================
// TINDAHAN NG OLDMAN
// =========================
//
// "buyPrice" - babayaran mo (gold) kapag BINILI MO ang item mula sa
// kanya (i-click sa grid). "sellPrice" - ibinibigay niya sa'yo (gold)
// kapag IBINENTA MO ang item na ito SA KANYA (i-DRAG papunta sa panel).
// "stockMin/stockMax" - random na dami ng available niyang stock (para
// sa BUY lang) kada pagpasok sa mundo.
const OLDMAN_SHOP_ITEMS = [
  {
    itemId: "carrot",
    label: "Carrot",
    fallbackIcon: "🥕",
    sellPrice: 30,
    buyPrice: 50,
    stockMin: 2,
    stockMax: 8,
  },
  {
    itemId: "wood",
    label: "Wood",
    fallbackIcon: "🪵",
    sellPrice: 5,
    buyPrice: 10,
    stockMin: 3,
    stockMax: 12,
  },
  {
    itemId: "stone",
    label: "Rocks",
    fallbackIcon: "🪨",
    sellPrice: 3,
    buyPrice: 6,
    stockMin: 3,
    stockMax: 12,
  },
  {
    itemId: "charcoal",
    label: "Charcoal",
    fallbackIcon: "⚫",
    sellPrice: 15,
    buyPrice: 30,
    stockMin: 2,
    stockMax: 8,
  },
  {
    itemId: "meat",
    label: "Meat",
    fallbackIcon: "🥩",
    // Hiling: 15 gold kada isang "meat" (sellPrice) - ang buyPrice ay
    // kaparehong 2x pattern ng ibang item sa itaas (walang binanggit
    // na specific na buy price sa hiling).
    sellPrice: 15,
    buyPrice: 30,
    stockMin: 2,
    stockMax: 8,
  },
  {
    itemId: "bag",
    label: "Backpack",
    fallbackIcon: "🎒",
    // Hiling ng user: 200 gold ang presyo ng bag (buyPrice). SellPrice
    // (kapag ibinebenta pabalik) ay kalahati lang, kaparehong ratio ng
    // ibang item sa itaas.
    sellPrice: 100,
    buyPrice: 200,
    stockMin: 1,
    stockMax: 3,
  },
  {
    itemId: "bed",
    label: "Bed",
    fallbackIcon: "🛏️",
    // BAGO (hiling ng user): "bed" - dito na lang bibilhin (parang
    // "bag"), mas mahal dahil mas malaki ang footprint nito (2x3
    // tiles) - kaparehong 2x ratio ng buyPrice/sellPrice ng ibang item
    // sa itaas.
    sellPrice: 150,
    buyPrice: 300,
    stockMin: 1,
    stockMax: 3,
  },
  {
    itemId: "wool",
    label: "Wool",
    fallbackIcon: "🧶",
    // BAGO (hiling ng user: "yung sa bed 123 slots wool at nabibili
    // dun kay oldman") - crafting material lang, kaparehong presyo-
    // pattern ng "charcoal"/"meat" sa itaas.
    sellPrice: 20,
    buyPrice: 40,
    stockMin: 3,
    stockMax: 12,
  },
  {
    itemId: "silk",
    label: "Silk",
    fallbackIcon: "🕸️",
    // BAGO (hiling ng user: "456 slots silk nabibili din kay oldman") -
    // mas mahal kaysa wool (mas "premium" na materyales) - kaparehong
    // 2x ratio ng wool sa itaas.
    sellPrice: 35,
    buyPrice: 70,
    stockMin: 2,
    stockMax: 8,
  },
];

// UNLIMITED ang stock ng LAHAT ng item ni oldman (walang label na
// "x{stock}", hindi nauubos) - PERO ang GOLD ang hadlang sa pagbili
// (tingnan ang maxAffordableOldManCount at buyFromOldManQuantity):
// kung kulang ang gold, hindi matutuloy ang bili.
// WALANG KATAPUSAN na ngayon ang stock ng LAHAT ng item ni
// oldman (hindi na random na stockMin/stockMax - naiwan na lang ang
// mga field na iyon sa OLDMAN_SHOP_ITEMS para hindi na kailangang
// baguhin ang listahan, pero hindi na ito ginagamit). Isang malaking
// numero lang (hindi Infinity - hindi maganda ang Infinity bilang
// HTML input "max" attribute sa quantity popup, tingnan
// openOldManBuyQtyPopup) ang ginagamit bilang "walang katapusan" -
// hindi rin ito binabawasan pagkatapos bumili (tingnan
// buyFromOldManQuantity) kaya TALAGANG hindi ito nauubos kahit gaano
// katagal.
const OLDMAN_UNLIMITED_STOCK = 999;

// { itemId: quantity } - hindi na talaga "random" (tingnan sa itaas),
// pero naiwan pa rin ang mekanismong ito (ensureOldManStock) dahil
// sinusunod pa rin ito ng ibang bahagi ng code (buyFromOldManQuantity,
// startOldManBuyDrag, atbp.) - laging OLDMAN_UNLIMITED_STOCK na lang
// ang nilalagay dito ngayon.
let oldManStock = null;

function ensureOldManStock() {
  if (oldManStock) return;

  oldManStock = {};

  for (const item of OLDMAN_SHOP_ITEMS) {
    oldManStock[item.itemId] = OLDMAN_UNLIMITED_STOCK;
  }
}

function getShopItemIconHTML(itemId, fallbackEmoji) {
  if (
    typeof BAG_ITEMS !== "undefined" &&
    typeof getItemIconHTML === "function"
  ) {
    const entry = BAG_ITEMS.find((candidate) => candidate.id === itemId);

    if (entry) return getItemIconHTML(entry);
  }

  return '<span class="hotbar-icon">' + fallbackEmoji + "</span>";
}

function getShopOwnedCount(itemId) {
  if (typeof BAG_ITEMS !== "undefined") {
    const entry = BAG_ITEMS.find((candidate) => candidate.id === itemId);

    if (entry) return entry.getCount();
  }

  return 0;
}

// Pinakamalaking dami na PUWEDENG PILIIN sa popup - ang STOCK lang ang
// hadlang dito (UNLIMITED, OLDMAN_UNLIMITED_STOCK). HINDI ito
// hinahadlangan ng gold: lalabas pa rin ang popup at kahit ilan pa ang
// i-type mo, papayagan - sa CONFIRM na lang mag-e-error kapag kulang
// ang gold (tingnan ang getOldManBuyCost/buyFromOldManQuantity at ang
// #oldman-buy-qty-confirm handler sa ibaba).
function maxAffordableOldManCount(item, stock) {
  if (!item || stock <= 0) return 0;

  return stock;
}

// Kabuuang bayad sa "qty" na piraso ng item.
function getOldManBuyCost(item, qty) {
  if (!item) return 0;

  return (item.buyPrice || 0) * Math.max(0, qty);
}

// Kaya ba ng HAWAK na gold ang buong bayad? Ito ang IISANG panuntunan
// na sinusunod ng lahat ng buy path (popup confirm at ang 1-click na
// bili) - kaya sigurado, walang libreng item.
function canAffordOldManBuy(item, qty) {
  const gold = typeof goldCollected !== "undefined" ? goldCollected : 0;

  return getOldManBuyCost(item, qty) <= gold;
}

// "qty" - EKSAKTONG dami na bibilhin (na-clamp na sa caller, kagaya ng
// sellToOldManQuantity sa ibaba). Ginagamit ito ng BUY FLOW (drag-and-drop
// mula sa #oldman-shop-grid papunta sa bag/hotbar).
function buyFromOldManQuantity(itemId, qty) {
  ensureOldManStock();

  const item = OLDMAN_SHOP_ITEMS.find((entry) => entry.itemId === itemId);

  if (!item) return;

  const stock = oldManStock[itemId] || 0;
  const maxCount = maxAffordableOldManCount(item, stock);
  const amount = Math.max(0, Math.min(qty, maxCount));

  if (amount <= 0) return;

  // HULING BANTAY: dito talaga tinitingnan kung KAYA ng gold ang buong
  // bayad. Kung kulang - ERROR, at WALANG mangyayari: walang item na
  // napupunta sa inventory at hindi nababawasan ang gold (dati:
  // naka-clamp sa 0 ang gold kaya libre ang bili kapag ubos ka na -
  // ito ang bug).
  if (!canAffordOldManBuy(item, amount)) {
    if (typeof showSettingsToast === "function")
      showSettingsToast("You do not have enough gold!");

    return;
  }

  if (typeof goldCollected !== "undefined") {
    goldCollected -= getOldManBuyCost(item, amount);
  }

  // AYOS: hindi na binabawasan ang oldManStock dito - walang
  // katapusan/unlimited na ang stock ni oldman (tingnan
  // OLDMAN_UNLIMITED_STOCK/ensureOldManStock sa itaas), kaya
  // permanenteng nananatiling buo ang bilang nito kahit ilang beses pa
  // bilhin - "bili lang ng bili" (hiling ng user).

  if (typeof adjustGlobalItemCount === "function")
    adjustGlobalItemCount(itemId, amount);
  if (typeof routeCollectedItemIncrease === "function")
    routeCollectedItemIncrease(itemId, amount);

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  syncOldManShopPanel();
}

// "qty" - EKSAKTONG dami na ibebenta (na-clamp na sa caller). Ginagamit
// ito ng SELL FLOW (drag-and-drop, tingnan sa ibaba) - hindi na dumadaan
// sa isang button kada item gaya ng dati.
function sellToOldManQuantity(itemId, qty) {
  const item = OLDMAN_SHOP_ITEMS.find((entry) => entry.itemId === itemId);

  if (!item) return;

  const owned = getShopOwnedCount(itemId);
  const amount = Math.max(0, Math.min(qty, owned));

  if (amount <= 0) return;

  if (typeof adjustGlobalItemCount === "function")
    adjustGlobalItemCount(itemId, -amount);
  if (typeof consumeItemFromWherever === "function")
    consumeItemFromWherever(itemId, amount);

  if (typeof goldCollected !== "undefined")
    goldCollected += item.sellPrice * amount;

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  syncOldManShopPanel();
}

let oldManShopPanelOpen = false;

function toggleOldManShopPanel() {
  oldManShopPanelOpen = !oldManShopPanelOpen;
  syncOldManShopPanel();
}

// Tinatawag ng dig.js kapag na-click ang oldman sa mundo.
function openOldManShopPanel() {
  ensureOldManStock();
  oldManShopPanelOpen = true;
  syncOldManShopPanel();
}

document
  .getElementById("oldman-shop-panel-close")
  ?.addEventListener("click", () => {
    toggleOldManShopPanel();
  });

function buildOldManShopCell(item) {
  const cell = document.createElement("button");

  cell.type = "button";
  cell.className = "oldman-shop-cell";
  cell.dataset.tooltip = item.label + " - 🪙" + item.buyPrice;

  // AYOS (hiling ng user): "wag na lagyan ng quantity unlimited na
  // kahit wala ng label" - tinanggal na ang "x{stock}" na badge (dating
  // "oldman-shop-cell-stock" span) at ang "disabled kapag naubos ang
  // stock" na gawi - WALANG KATAPUSAN na ngayon ang bawat item ni
  // oldman (OLDMAN_UNLIMITED_STOCK), kaya laging naka-enable/buyable
  // ang lahat ng cell dito.
  cell.innerHTML =
    '<span class="oldman-shop-cell-icon">' +
    getShopItemIconHTML(item.itemId, item.fallbackIcon) +
    "</span>";

  // AYOS (hiling ng user): "wag na traggable, pag click ng item
  // lalabas na lang label na Buy o Cancel, tapos kapag Buy lalabas
  // yung quantity popup" - dating i-DRAG papunta sa bag/hotbar
  // (startOldManBuyDrag) - CLICK na lang ngayon, gaya na rin ng
  // ginagawa ni Maria (buildMariaShopCell sa builder.js): lumalabas
  // ang munting "Buy"/"Cancel" na menu (showBagActionMenu, hotbar.js -
  // IISANG component din ito na ginagamit ng "Use"/"Transfer"/"Slice"
  // sa hotbar/inventory), "Buy" lang ang talagang magbubukas ng
  // quantity popup (startOldManBuyFlow sa ibaba).
  cell.addEventListener("click", (event) => {
    if (typeof showBagActionMenu !== "function") return;

    showBagActionMenu(event.clientX, event.clientY, [
      { label: "Buy", onClick: () => startOldManBuyFlow(item.itemId) },
      { label: "Cancel", onClick: () => {} },
    ]);
  });

  // AYOS: JS na ngayon ang tooltip (hindi na purong CSS ::after) -
  // tingnan ang paliwanag sa itaas ng "#oldman-shop-tooltip" sa
  // style.css kung bakit (natatakpan/na-clip dati ng overflow-y:auto
  // ng #oldman-shop-body).
  cell.addEventListener("pointerenter", () => {
    showOldManShopTooltip(cell, cell.dataset.tooltip);
  });
  cell.addEventListener("pointerleave", hideOldManShopTooltip);

  return cell;
}

// Iisang tooltip element (index.html, #oldman-shop-tooltip) na
// LAGING dinadala/pino-position dito papunta sa TALAGANG kinatatayuan
// ng hovered na cell (getBoundingClientRect - screen coordinates,
// dahil "position:fixed" ito) - kaya LAGING naka-overlap ito sa ibabaw
// ng lahat, hindi na na-cclip kahit anong row pa ang ni-hover, hindi
// tulad ng dating purong-CSS na bersyon.
function showOldManShopTooltip(cell, text) {
  const tooltip = document.getElementById("oldman-shop-tooltip");

  if (!tooltip || !text) return;

  tooltip.textContent = text;
  tooltip.classList.remove("hidden");

  const rect = cell.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  // Sa ITAAS ng cell kapag may sapat na espasyo, kung hindi (hal.
  // unang hanay, walang lugar sa itaas) - sa IBABA na lang ito ilalagay
  // sa halip - dito lang talaga makikita ang pagkakaiba kumpara sa
  // dating CSS ::after (na laging sa itaas lang, kahit na-clip pa).
  let top = rect.top - tooltipRect.height - 6;

  if (top < 4) top = rect.bottom + 6;

  // Huwag palampasin sa gilid ng screen (kaliwa/kanan).
  left = Math.max(4, Math.min(left, window.innerWidth - tooltipRect.width - 4));

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideOldManShopTooltip() {
  const tooltip = document.getElementById("oldman-shop-tooltip");

  if (tooltip) tooltip.classList.add("hidden");
}

function syncOldManShopPanel() {
  const panel = document.getElementById("oldman-shop-panel");

  if (!panel) return;

  panel.classList.toggle("hidden", !oldManShopPanelOpen);

  // Iwasang matirang nakabitin ang tooltip (hal. nag-scroll/nagsara
  // habang naka-hover pa rin) - ligtas na itong itago tuwing nagre-
  // rebuild/nagsasara ang panel na ito.
  if (typeof hideOldManShopTooltip === "function") hideOldManShopTooltip();

  if (!oldManShopPanelOpen) return;

  const goldEl = document.getElementById("oldman-shop-gold-amount");

  if (goldEl)
    goldEl.textContent =
      typeof goldCollected !== "undefined" ? goldCollected : 0;

  const grid = document.getElementById("oldman-shop-grid");

  if (grid) {
    grid.innerHTML = "";

    for (const item of OLDMAN_SHOP_ITEMS) {
      grid.appendChild(buildOldManShopCell(item));
    }

    // Punuin ang natitira para maging kumpletong 8x8 (64 cells) na grid -
    // blangkong cell lang ang mga dagdag (walang laman, hindi puwedeng
    // i-click), para pantay-pantay ang hitsura ng buong inventory.
    const OLDMAN_SHOP_TOTAL_CELLS = 8 * 8;

    for (let i = OLDMAN_SHOP_ITEMS.length; i < OLDMAN_SHOP_TOTAL_CELLS; i++) {
      const empty = document.createElement("div");

      empty.className = "oldman-shop-cell oldman-shop-cell-empty";
      grid.appendChild(empty);
    }
  }
}

// =========================
// SELL FLOW (i-drag ang item papunta sa panel) - tingnan ang
// getDropTargetsAt/pointerup sa hotbar.js. Kung 1 lang ang hawak, agad
// na naibebenta (walang popup). Kung higit sa 1, may lalabas na popup
// (dami + Confirm/Cancel).
// =========================

let oldManSellFlowState = null; // { itemId, maxCount }

function startOldManSellFlow(itemId, maxCount) {
  const item = OLDMAN_SHOP_ITEMS.find((entry) => entry.itemId === itemId);

  // Item na hindi kilala ng tindahan (hal. torch/pickaxe) - hindi
  // niya binebenta/binibili, kaya walang mangyayari.
  if (!item || maxCount <= 0) return;

  if (maxCount === 1) {
    sellToOldManQuantity(itemId, 1);
    return;
  }

  oldManSellFlowState = { itemId, maxCount };
  openOldManSellQtyPopup();
}

function openOldManSellQtyPopup() {
  if (!oldManSellFlowState) return;

  const popup = document.getElementById("oldman-sell-qty-popup");

  if (!popup) return;

  const item = OLDMAN_SHOP_ITEMS.find(
    (entry) => entry.itemId === oldManSellFlowState.itemId,
  );

  if (!item) {
    oldManSellFlowState = null;
    return;
  }

  const iconEl = document.getElementById("oldman-sell-qty-icon");

  if (iconEl)
    iconEl.innerHTML = getShopItemIconHTML(item.itemId, item.fallbackIcon);

  const labelEl = document.getElementById("oldman-sell-qty-label");

  if (labelEl) labelEl.textContent = "How many " + item.label + " to sell?";

  const input = document.getElementById("oldman-sell-qty-input");

  if (input) {
    input.min = 1;
    input.max = oldManSellFlowState.maxCount;
    input.value = oldManSellFlowState.maxCount;
  }

  updateOldManSellQtyTotal();

  popup.classList.remove("hidden");
}

function closeOldManSellQtyPopup() {
  const popup = document.getElementById("oldman-sell-qty-popup");

  if (popup) popup.classList.add("hidden");

  oldManSellFlowState = null;
}

function clampOldManSellQtyInput() {
  const input = document.getElementById("oldman-sell-qty-input");

  if (!input || !oldManSellFlowState) return 1;

  let value = parseInt(input.value, 10);

  if (!Number.isFinite(value)) value = 1;

  value = Math.max(1, Math.min(value, oldManSellFlowState.maxCount));
  input.value = value;

  return value;
}

function updateOldManSellQtyTotal() {
  if (!oldManSellFlowState) return;

  const item = OLDMAN_SHOP_ITEMS.find(
    (entry) => entry.itemId === oldManSellFlowState.itemId,
  );

  if (!item) return;

  const qty = clampOldManSellQtyInput();
  const totalEl = document.getElementById("oldman-sell-qty-total");

  if (totalEl) totalEl.textContent = "You will receive: 🪙" + item.sellPrice * qty;
}

document
  .getElementById("oldman-sell-qty-input")
  ?.addEventListener("input", updateOldManSellQtyTotal);

document
  .getElementById("oldman-sell-qty-minus")
  ?.addEventListener("click", () => {
    const input = document.getElementById("oldman-sell-qty-input");

    if (!input) return;

    input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    updateOldManSellQtyTotal();
  });

document
  .getElementById("oldman-sell-qty-plus")
  ?.addEventListener("click", () => {
    if (!oldManSellFlowState) return;

    const input = document.getElementById("oldman-sell-qty-input");

    if (!input) return;

    input.value = Math.min(
      oldManSellFlowState.maxCount,
      (parseInt(input.value, 10) || 1) + 1,
    );
    updateOldManSellQtyTotal();
  });

document
  .getElementById("oldman-sell-qty-cancel")
  ?.addEventListener("click", () => {
    closeOldManSellQtyPopup();
  });

document
  .getElementById("oldman-sell-qty-confirm")
  ?.addEventListener("click", () => {
    if (!oldManSellFlowState) return;

    const itemId = oldManSellFlowState.itemId;
    const qty = clampOldManSellQtyInput();

    closeOldManSellQtyPopup();
    sellToOldManQuantity(itemId, qty);
  });

// =========================
// BUY FLOW - CLICK na lang (hindi na drag, hiling ng user: "wag na
// traggable") - lumalabas munа ang munting "Buy"/"Cancel" na menu
// (showBagActionMenu, hotbar.js, tingnan ang buildOldManShopCell sa
// itaas at buildMariaShopCell sa builder.js), saka pa lang bubukas ang
// quantity popup sa sandaling piliin ang "Buy". GENERIC na ito ngayon
// (may "shop" field, "oldman" o "maria") - IISANG quantity popup
// (#oldman-buy-qty-popup) na lang ang ginagamit ng PAREHONG tindahan
// (tingnan ang getShopBuyFlowItem sa ibaba), kaya magkatugma ang
// karanasan ng bumibili kay Oldman at kay Maria. Kung 1 lang ang
// kayang bilhin, agad na mabibili (walang qty popup). Kung higit sa 1,
// may lalabas na popup (dami + Confirm/Cancel).
// =========================

let oldManBuyFlowState = null; // { shop: "oldman" | "maria", itemId, maxCount }

// Ibinabalik ang { items, item } ng KASALUKUYANG shop sa
// oldManBuyFlowState - "oldman" -> OLDMAN_SHOP_ITEMS (decor.js dito
// rin), "maria" -> MARIA_SHOP_ITEMS (builder.js) - IISANG function na
// ito ang tanging pinagmumulan ng item-lookup ng buong popup sa ibaba,
// para hindi na kailangang ulit-ulitin ang parehong "kung anong shop"
// na check sa bawat function.
function getShopItemsArray(shop) {
  if (shop === "maria") {
    return typeof MARIA_SHOP_ITEMS !== "undefined" ? MARIA_SHOP_ITEMS : [];
  }

  return OLDMAN_SHOP_ITEMS;
}

function getShopBuyFlowItem() {
  if (!oldManBuyFlowState) return null;

  const items = getShopItemsArray(oldManBuyFlowState.shop);

  return items.find((entry) => entry.itemId === oldManBuyFlowState.itemId) || null;
}

// Tinatawag mula sa "Buy" na buton ng popup menu (showBagActionMenu) -
// "shop" ay "oldman" o "maria".
function startShopBuyFlow(shop, itemId) {
  const items = getShopItemsArray(shop);
  const item = items.find((entry) => entry.itemId === itemId);

  if (!item) return;

  let maxCount;

  if (shop === "maria") {
    // Walang stock si Maria (unlimited, gaya ni Oldman) - ang gold
    // lang ang hadlang, kaya isang malaking numero na lang (kapareho
    // ng OLDMAN_UNLIMITED_STOCK) ang gagamitin bilang "max" ng popup.
    maxCount = OLDMAN_UNLIMITED_STOCK;
  } else {
    ensureOldManStock();

    const stock = oldManStock[itemId] || 0;

    maxCount = maxAffordableOldManCount(item, stock);

    if (maxCount <= 0) {
      // UNLIMITED ang stock kaya hindi na ito dapat maabot.
      if (typeof showSettingsToast === "function") {
        showSettingsToast("Out of stock!");
      }

      return;
    }
  }

  if (maxCount === 1) {
    if (shop === "maria") buyFromMariaQuantity(itemId, 1);
    else buyFromOldManQuantity(itemId, 1);

    return;
  }

  oldManBuyFlowState = { shop, itemId, maxCount };
  openOldManBuyQtyPopup();
}

// Tinatawag ng "Buy" na buton sa #oldman-shop-grid (tingnan ang
// buildOldManShopCell sa itaas).
function startOldManBuyFlow(itemId) {
  startShopBuyFlow("oldman", itemId);
}

// Tinatawag ng "Buy" na buton sa #maria-shop-grid (tingnan ang
// buildMariaShopCell sa builder.js).
function startMariaBuyFlow(itemId) {
  startShopBuyFlow("maria", itemId);
}

function openOldManBuyQtyPopup() {
  if (!oldManBuyFlowState) return;

  const popup = document.getElementById("oldman-buy-qty-popup");

  if (!popup) return;

  const item = getShopBuyFlowItem();

  if (!item) {
    oldManBuyFlowState = null;
    return;
  }

  const iconEl = document.getElementById("oldman-buy-qty-icon");

  if (iconEl)
    iconEl.innerHTML = getShopItemIconHTML(item.itemId, item.fallbackIcon);

  const labelEl = document.getElementById("oldman-buy-qty-label");

  if (labelEl) labelEl.textContent = "How many " + item.label + " to buy?";

  const input = document.getElementById("oldman-buy-qty-input");

  if (input) {
    input.min = 1;
    // "max" = stock (UNLIMITED) - hindi ito nakadepende sa gold, kaya
    // kahit ilan ang i-type mo, papayagan ng popup.
    input.max = oldManBuyFlowState.maxCount;
    // Default na 1 (hindi na maxCount) - para hindi maubos agad ang
    // lahat ng gold sa isang aksidenteng Confirm. Palitan ito pabalik
    // ng oldManBuyFlowState.maxCount kung mas gusto mo ang dati.
    input.value = 1;
  }

  updateOldManBuyQtyTotal();

  popup.classList.remove("hidden");
}

function closeOldManBuyQtyPopup() {
  const popup = document.getElementById("oldman-buy-qty-popup");

  if (popup) popup.classList.add("hidden");

  oldManBuyFlowState = null;
}

function clampOldManBuyQtyInput() {
  const input = document.getElementById("oldman-buy-qty-input");

  if (!input || !oldManBuyFlowState) return 1;

  let value = parseInt(input.value, 10);

  if (!Number.isFinite(value)) value = 1;

  value = Math.max(1, Math.min(value, oldManBuyFlowState.maxCount));
  input.value = value;

  return value;
}

function updateOldManBuyQtyTotal() {
  if (!oldManBuyFlowState) return;

  const item = getShopBuyFlowItem();

  if (!item) return;

  const qty = clampOldManBuyQtyInput();
  const totalEl = document.getElementById("oldman-buy-qty-total");

  if (!totalEl) return;

  // Live na babala habang binabago ang dami - makikita mo agad kung
  // kulang ang gold bago mo pa pindutin ang Confirm.
  const affordable = canAffordOldManBuy(item, qty);

  totalEl.textContent =
    "To pay: 🪙" +
    getOldManBuyCost(item, qty) +
    (affordable ? "" : " (not enough gold)");
  totalEl.style.color = affordable ? "" : "#ff6b6b";
}

document
  .getElementById("oldman-buy-qty-input")
  ?.addEventListener("input", updateOldManBuyQtyTotal);

document
  .getElementById("oldman-buy-qty-minus")
  ?.addEventListener("click", () => {
    const input = document.getElementById("oldman-buy-qty-input");

    if (!input) return;

    input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    updateOldManBuyQtyTotal();
  });

document
  .getElementById("oldman-buy-qty-plus")
  ?.addEventListener("click", () => {
    if (!oldManBuyFlowState) return;

    const input = document.getElementById("oldman-buy-qty-input");

    if (!input) return;

    input.value = Math.min(
      oldManBuyFlowState.maxCount,
      (parseInt(input.value, 10) || 1) + 1,
    );
    updateOldManBuyQtyTotal();
  });

document
  .getElementById("oldman-buy-qty-cancel")
  ?.addEventListener("click", () => {
    closeOldManBuyQtyPopup();
  });

document
  .getElementById("oldman-buy-qty-confirm")
  ?.addEventListener("click", () => {
    if (!oldManBuyFlowState) return;

    // Itinatabi muna BAGO tawagin ang closeOldManBuyQtyPopup (na
    // nagse-set ng oldManBuyFlowState pabalik sa null) - kailangan
    // namin ito pagkatapos para malaman KANINONG bibilhan
    // (buyFromOldManQuantity o buyFromMariaQuantity).
    const shop = oldManBuyFlowState.shop;
    const itemId = oldManBuyFlowState.itemId;
    const qty = clampOldManBuyQtyInput();
    const item = getShopBuyFlowItem();

    // KULANG ANG GOLD - ERROR lang, at NANANATILING BUKAS ang popup
    // para puwede mong ibaba ang dami at subukan ulit (imbes na
    // isara at simulan ulit ang buong bili).
    if (!canAffordOldManBuy(item, qty)) {
      if (typeof showSettingsToast === "function")
        showSettingsToast("You do not have enough gold!");

      return;
    }

    closeOldManBuyQtyPopup();

    if (shop === "maria") buyFromMariaQuantity(itemId, qty);
    else buyFromOldManQuantity(itemId, qty);
  });

// AYOS (hiling ng user): "alisin mo na yung mga blackhole erase mo na
// sa lahat" - TINANGGAL na ang buong "umiikot na blackhole" ground
// decal na dati'y dinadraw sa gate patungo/galing "town"<->"grassmap"
// (dating drawTownPathGatePatch/drawNewmapReturnGatePatch dito, tinawag
// mula sa draw.js) - kasama na ang asset (blackhole.png) at lahat ng
// TOWN_GATE_BLACKHOLE_*/TOWN_PATH_GATE_*/NEWMAP_RETURN_GATE_* na
// konstante. Ang mismong PAG-TETELEPORT sa pagitan ng "town" at
// "grassmap" ay HINDI naapektuhan - hiwalay/independent ang area/
// coordinates niyan (DOORS, worlds.js) sa visual na ito.

// =========================
// GRASSMAP - INDIVIDUAL NA MGA PUNO (hand-placed, hindi random)
// =========================
//
// Ang grassmap.tmj ay may sarili nang guhit na puno sa larawan
// (grassmap.png - ang "reference" na sinabi ng user) - pero SA HALIP
// na gawin itong Tiled tile-layer/"overlap instance" (tinanggal na ito
// sa tmj mismo - "inalis ko yung overlay", hiling ng user), ginagawa
// nating INDIVIDUAL na JS drawable ang BAWAT puno, KAPAREHONG-KAPAREHO
// ng OAK TREES sa itaas: sariling sortY (Y-sort laban sa player) at
// sariling bbox (see-through occlusion, tingnan ang shouldOccludeForPlayer
// sa map.js) - kaya nag-iisa/independent ang pagkalabo ng BAWAT puno
// ("by each yung opacity nung puno, parang ginawa sa oaktree").
//
// Larawan na ginagamit: grassmap-trees-overlay.png - EKSAKTONG kopya ng
// kulay ng grassmap.png (walang ibang binago) sa mga pixel na TALAGANG
// bahagi ng puno lang (nakuha sa pamamagitan ng pag-diff laban sa
// grassmap-no-trees.png, ang background na larawan ng "Tile Layer 1")
// - TRANSPARENT sa lahat ng iba pa. Dahil dito, ligtas itong i-crop
// gamit ang simpleng PARISUKAT/RECTANGULAR na hangganan kahit hindi
// eksaktong kasing-hugis ng tunay na puno (walang lalabas na
// nakikitang seam/kahon, dahil transparent naman ang paligid nito).
const grassmapTreesImage = new Image();
grassmapTreesImage.src = "./assets/map/grassmap-trees-overlay.png";

// Bawat entry ay ISANG "puno" (o grupo ng magkadikit/magkapatong na
// puno sa larawan na hindi na mahihiwalay nang malinis dahil
// nagtatagpo ang canopy nila - hal. yung mga magkadikit na puno sa
// likod ng bahay na may IISA na lang natitirang NAKIKITANG puno/trunk
// sa hanay na iyon, ang iba ay nakatago sa likod):
//   src        - (sx,sy,sw,sh) eksaktong crop region sa
//                grassmap-trees-overlay.png.
//   baseY      - world-Y kung saan "nakatapak sa lupa" ang puno (ilalim
//                ng NAKIKITANG trunk) - dito ikinukumpara ang Y-sort
//                laban sa paanan ng player (kaparehong konsepto ng
//                spot.row*TILE_SIZE+TILE_SIZE sa OAK).
//   trunkBox   - MANIPIS na collision (hindi madadaanan) - sa TALAGANG
//                puno/trunk LANG, hindi sa buong canopy - para may
//                lugar pa ring madaanan SA ILALIM ng nakausling sanga
//                (hiling: "trees overlap the character when beneath
//                the tree").
//   occludeBox - MAS MATANGKAD na bbox (mula ibabaw ng canopy hanggang
//                sa trunk base, pero MANIPIS pa rin ang lapad) - ITO
//                ang GINAGAMIT PARA SA OPACITY FADE (see-through) laban
//                sa player: kapag LIKOD na ng puno ang player (mas
//                mababa pa sa screen ang paanan niya kaysa dito) AT
//                nag-o-overlap ang katawan niya rito, lumalabo ang
//                puno - kaya nakikita/"naka-overlap" ang character sa
//                puno. Kapag NASA HARAP naman ng puno ang player (mas
//                mataas pa sa screen ang base niya), normal na
//                iginuguhit ang puno PAGKATAPOS ng player - kaya ang
//                puno ang "naka-overlap"/tumatakip sa character - pareho
//                lang sa OAK (isa lang talaga ang logic, Y-sort lang
//                ang batayan).
const GRASSMAP_TREE_SPOTS = [
  // Kaliwang dalawang puno (harap, malapit sa landas/bato).
  {
    src: { sx: 119, sy: 336, sw: 47, sh: 181 },
    baseY: 514,
    trunkBox: { x: 139, y: 474, width: 23, height: 41 },
    occludeBox: { x: 138.5, y: 336, width: 23, height: 181 },
  },
  {
    src: { sx: 166, sy: 336, sw: 39, sh: 181 },
    baseY: 466,
    trunkBox: { x: 171, y: 426, width: 23, height: 41 },
    occludeBox: { x: 170.5, y: 336, width: 23, height: 181 },
  },
  // Kanang grupo ng puno (likod ng bahay) - hinati sa 3 "hanay" base sa
  // 3 natitirang NAKIKITANG puno sa larawan (ang iba pang puno rito ay
  // nakatago/magkapatong sa likod ng mga ito, kaya sama-samang bahagi
  // na lang sila ng pinakamalapit na hanay - hangga't hindi pa
  // nagbibigay ng bagong tunay na tileset/sprite per-puno, ito ang
  // pinakamalapit na tamang paghahati batay mismo sa nakikita sa
  // larawan).
  {
    src: { sx: 205, sy: 294, sw: 168, sh: 118 },
    baseY: 412,
    trunkBox: { x: 347, y: 389, width: 23, height: 24 },
    occludeBox: { x: 346.5, y: 294, width: 23, height: 118 },
  },
  {
    src: { sx: 373, sy: 294, sw: 32, sh: 118 },
    baseY: 412,
    trunkBox: { x: 379, y: 378, width: 19, height: 35 },
    occludeBox: { x: 378.5, y: 294, width: 19, height: 118 },
  },
  {
    src: { sx: 405, sy: 294, sw: 46, sh: 118 },
    baseY: 412,
    trunkBox: { x: 411, y: 389, width: 23, height: 24 },
    occludeBox: { x: 410.5, y: 294, width: 23, height: 118 },
  },
];

// Kaparehong gawi ng ensureOakSpots(): isang beses lang kada world
// (idinadagdag ang collision ng bawat trunk) - tinatawag ito KADA FRAME
// mula update.js, pero mura lang ang paulit-ulit na check
// (currentWorld comparison), kaya hindi ito problema sa performance.
let grassmapTreesValidatedFor = null;

function ensureGrassmapTrees() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  if (!world || !world.grassmapTrees) return;
  if (grassmapTreesValidatedFor === currentWorld) return;

  grassmapTreesValidatedFor = currentWorld;

  for (const spot of GRASSMAP_TREE_SPOTS) {
    collisions.push({ ...spot.trunkBox });
  }
}

function drawGrassmapTreeAt(spot) {
  if (!grassmapTreesImage.complete || grassmapTreesImage.naturalWidth === 0) {
    return;
  }

  const { sx, sy, sw, sh } = spot.src;

  // 1:1 na crop-and-place (walang scale) - eksaktong kopya ng
  // pinagmulang pixel sa EKSAKTONG parehong world coordinates.
  ctx.drawImage(grassmapTreesImage, sx, sy, sw, sh, sx, sy, sw, sh);
}

// Isinasabit sa Y-sort na "drawables" ng drawMapObjects (map.js) -
// kaparehong-pareho ng getOakDrawables sa itaas, pero FIXED na posisyon
// (hindi random) dahil hand-drawn/static na larawan ang grassmap.tmj.
function getGrassmapTreeDrawables() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  if (!world || !world.grassmapTrees) return [];

  return GRASSMAP_TREE_SPOTS.map((spot) => ({
    sortY: spot.baseY,
    order: -1,
    draw: () => drawGrassmapTreeAt(spot),
    bbox: spot.occludeBox,
  }));
}
