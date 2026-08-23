// =========================
// BABOY (PIG) - random na hayop na gumagala sa mapa
// =========================
//
// PIG_COUNT_PER_WORLD na piraso kada outdoor world, random ang unang
// posisyon (seeded, kaparehong pattern ng OAK sa decor.js - pareho
// palagi kada mundo hangga't hindi pa na-"patay" ang isa man). Bawat
// pig ay may SARILING random na paglalakad (naglalakad papunta sa
// random na kalapit na tile, humihinto ng ilang segundo, ulit) AT
// sariling random na "pagkawala/pagbalik" sa mapa - kaparehong
// konsepto ng OLDMAN wander (decor.js), pero mas maikli/mas madalas
// dahil mas marami sila at mas "malaya" silang gumala (hindi nakatali
// sa isang tahanan/tindahan gaya niya).
//
// May "health" (bilang ng hit) ang bawat pig - CLICKABLE (kahit anong
// naka-equip, o wala man) - kada click, nababawasan ang health.
// Kapag na-ubos (na-"patay"), naglalaho muna ito saglit, tapos
// MAG-RA-RANDOM SPAWN ULIT sa ibang bahagi ng mapa - kaparehong
// konsepto ng respawnOak/respawnResourceNode (decor.js/resources.js).
//
// Umaasa ito sa mga GLOBAL na function na nasa ibang file na (dapat
// na-load na sila bago ito TALAGANG tumakbo - tingnan ang load order
// sa index.html, nasa PAGKATAPOS ng decor.js ito):
//   - isFreeWanderTile / randomBetween (decor.js)
//   - hashStringToInt (resources.js), seededRandom (calendar.js)
//   - isColliding (collisions.js), getObjectCells/isTileInReach/
//     getMouseTile (dig.js)
//   - startPunchStrike (player.js)

const PIG_COUNT_PER_WORLD = 10;

// =========================
// LARAWAN
// =========================

const PIG_WALK_DIRECTIONS = ["north", "south", "east", "west"];
const PIG_WALK_FRAME_COUNT = 4;
const PIG_WALK_FRAME_MS = 200; // 0.2s kada frame - base sa filename mismo ng GIF

// Magkakahiwalay na GIF file kada frame - assets/animals/pig/walk/
// Pig_<direksyon>/frame_N_delay-0.2s.gif ("Pig_east" atbp, malaking
// "P" lang, maliit ang direksyon).
const PIG_WALK_IMAGES = {};

for (const pigDir of PIG_WALK_DIRECTIONS) {
  const folderName = "Pig_" + pigDir;

  PIG_WALK_IMAGES[pigDir] = [];

  for (let frame = 0; frame < PIG_WALK_FRAME_COUNT; frame++) {
    const frameImg = new Image();

    frameImg.src =
      "./assets/animals/pig/walk/" +
      folderName +
      "/frame_" +
      frame +
      "_delay-0.2s.gif";

    PIG_WALK_IMAGES[pigDir].push(frameImg);
  }
}

// IDLE - 8 direksyon, static na larawan lang (walang animation) -
// assets/animals/pig/idle/<pangalan>.png
const PIG_IDLE_DIRECTION_FILES = {
  north: "north.png",
  "north-east": "north-east.png",
  east: "east.png",
  "south-east": "south-east.png",
  south: "south.png",
  "south-west": "south-west.png",
  west: "west.png",
  "north-west": "north-west.png",
};

const PIG_IDLE_IMAGES = {};

for (const idleDir in PIG_IDLE_DIRECTION_FILES) {
  const idleImg = new Image();

  idleImg.src = "./assets/animals/pig/idle/" + PIG_IDLE_DIRECTION_FILES[idleDir];
  PIG_IDLE_IMAGES[idleDir] = idleImg;
}

// 1.6 tile - medyo mas maliit kaysa sa oldman (2 tile), para makilalang
// hayop lang ito, hindi tao.
const PIG_DEST_SIZE = TILE_SIZE * 1.6;

// =========================
// PAGGALAW (idle <-> walking, kaparehong estado ng oldman)
// =========================

const PIG_WANDER_RADIUS_TILES = 3;
const PIG_WALK_SPEED_PX_PER_SEC = 20;

// Munting "paanan" na box - gamit ng canFeetMoveTo (decor.js,
// continuous collision) habang naglalakad, para hindi sila makadaan
// sa puno/bahay/bato - kaparehong konsepto ng ginawa ring collision
// check ng oldman.
const PIG_COLLISION_BOX_WIDTH = TILE_SIZE * 0.5;
const PIG_COLLISION_BOX_HEIGHT = TILE_SIZE * 0.35;

const PIG_IDLE_MIN_MS = 3000;
const PIG_IDLE_MAX_MS = 8000;

// =========================
// HEALTH / PAGPATAY / RESPAWN (kaparehong konsepto ng puno - tingnan
// ang RESOURCE_REQUIRED_HITS sa resources.js)
// =========================
//
// Bagong SARILING "stats" ang pig (dating "hits"-based lang, apat na
// click kahit ano man ang tama, walang tunay na HP/defense) - ngayon
// may TALAGANG max HP at defense stat, kaparehong konsepto ng RPG:
// ang aktwal na nababawas sa HP kada hit ay ang base damage MINUS ang
// defense (hindi bababa sa 1, para hindi "immune" kahit gaano
// kalaki ang defense laban sa damage).
const PIG_MAX_HP = 550;
const PIG_DEFENSE = 50;

// "Damage" ng isang basic na hit (click/suntok, kahit anong naka-
// equip o wala man - tingnan ang mousedown handler sa ibaba) - walang
// hiwalay pang "weapon damage" system ang buong laro (click-based pa
// rin ang combat), kaya iisa lang muna itong constant. I-adjust ito
// (o gawing per-weapon balang araw) kung gustong mabago ang bilis ng
// "pagpatay" sa pig.
const PIG_HIT_DAMAGE = 150;

// Para sa BACKWARD-COMPATIBLE na health bar ratio lang (visual) -
// hindi na ito ang batayan ng "kailan mamamatay" (HP/defense na ang
// gamit doon), pero ginagamit pa rin ito bilang display kung ilang
// click (pinaka-mabagal, defense factored in) bago maubos ang 550 HP.
const PIG_REQUIRED_HITS = Math.ceil(
  PIG_MAX_HP / Math.max(1, PIG_HIT_DAMAGE - PIG_DEFENSE),
);

// Pagitan ng bawat "hit" - IISA lang itong cooldown (hindi per-pig),
// kaparehong gawi ng RESOURCE_HIT_COOLDOWN_MS (resources.js), para
// hindi basta i-spam-click ng player.
const PIG_HIT_COOLDOWN_MS = 400;

let lastPigHitAt = 0;

// "kapag na hit ko titigil yung pig" - saglit siyang tumitigil sa
// paglalakad (hit-stun) sa sandaling matamaan, bago ulit magdesisyon
// ng bagong galaw.
const PIG_HIT_STUN_MS = 900;

// EKSAKTONG 15 segundo bago ulit lumitaw ang pig (sa bagong random na
// pwesto) PAGKATAPOS ma-"patay" - bagong hiling: dating RANDOM
// (8-20s), FIXED 15s na lang ngayon, at ITO NA LANG (kamatayan) ang
// TANGING dahilan kung bakit mawawala ang isang pig - tingnan ang
// "PAGKAWALA/PAGBALIK SA MAPA" na TINANGGAL sa ibaba (item 20,
// CLAUDE.md) - hindi na sila basta nawawala nang kusa/random.
const PIG_RESPAWN_DELAY_MS = 15 * 1000;

// "may babagsak na meat 1-3 random" - dami ng "meat" na LUMALAGPAK sa
// lupa (hindi deretso sa bag - kailangan pa ring damputin, kaparehong
// gawi ng ani ng puno/carrot) sa sandaling mapatay ang isang pig.
const PIG_MEAT_DROP_MIN = 1;
const PIG_MEAT_DROP_MAX = 3;

// Nakolektang "meat" - kaparehong pattern ng woodCollected/
// stoneCollected (resources.js) - GENERIC na item na ito sa BAG_ITEMS
// (hotbar.js) at adjustGlobalItemCount, kaya kailangang naka-declare
// na ito BAGO pa man tumakbo ang hotbar.js/inventory-save.js (sumusunod
// naman sila dito sa index.html).
let meatCollected = 0;

let pigsCache = null;
let pigsValidatedFor = null;

// =========================
// PAGGAWA NG MGA UNANG POSISYON (seeded, isang beses kada mundo -
// kaparehong pattern ng generateOakSpots sa decor.js)
// =========================

function generatePigSpots() {
  const world = getWorld();

  if (!mapReady || !mapData || !world || !world.outdoor || world.noPigs)
    return [];

  const objectCells = getObjectCells();
  const occupied = new Set();
  const seedBase = hashStringToInt(currentWorld + ":pig");
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

  while (spots.length < PIG_COUNT_PER_WORLD && attempt < 1500) {
    attempt++;

    const col = 1 + Math.floor(nextRandom() * (mapData.width - 2));
    const row = 1 + Math.floor(nextRandom() * (mapData.height - 2));

    if (!isValidTile(col, row)) continue;

    spots.push({ col, row });
    occupied.add(col + "," + row);
  }

  return spots;
}

function makePigState(id, col, row) {
  return {
    id,
    col,
    row,
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE,
    facing: "south",
    idleFacing8: "south",
    moving: false,
    // "gone" - TINANGGAL na sa listahan ng POSIBLENG estado (item 20,
    // CLAUDE.md) - "dead" na lang ang tanging dahilan kung bakit
    // mawawala/hindi maguguhit ang isang pig.
    state: "idle", // "idle" | "walking" | "dead"
    phaseUntil:
      performance.now() + randomBetween(PIG_IDLE_MIN_MS, PIG_IDLE_MAX_MS),
    targetCol: null,
    targetRow: null,
    targetX: null,
    targetY: null,
    hits: 0,
    // Sariling stats ng BAWAT pig (hindi lang isang shared constant) -
    // "hp" ang kasalukuyang buhay (nagsisimula sa PIG_MAX_HP, 550),
    // "maxHp"/"defense" naka-attach din dito para readily-available
    // kada pig object (hal. kung sakaling gawing iba-iba balang araw
    // ang stats kada indibidwal na pig).
    hp: PIG_MAX_HP,
    maxHp: PIG_MAX_HP,
    defense: PIG_DEFENSE,
    hitFlashUntil: 0,
    respawnAt: 0,
  };
}

// Isang beses lang talaga tumatakbo ang mabigat na bahagi nito kada
// pagpasok sa isang mundo (kaparehong gawi ng ensureOakSpots).
function ensurePigs() {
  if (!mapReady || !mapData) return;
  if (pigsValidatedFor === currentWorld) return;

  pigsValidatedFor = currentWorld;

  const spots = generatePigSpots();

  pigsCache = spots.map((spot, index) => makePigState(index, spot.col, spot.row));
}

function findAlivePigAt(col, row) {
  if (!pigsCache) return null;

  return (
    pigsCache.find(
      (pig) =>
        pig.state !== "gone" &&
        pig.state !== "dead" &&
        pig.col === col &&
        pig.row === row,
    ) || null
  );
}

// LIVE (gumagalaw kada frame) na collision boxes ng lahat ng BUHAY na
// pig - kaparehong konsepto ng getOldManCollisionBox (decor.js).
// Ginagamit ng PLAYER (collisions.js → canMoveTo) at ng canFeetMoveTo
// mismo (decor.js, generic - gamit din ito ng oldman/ibang pig) para
// "totoo" ring hadlang ang bawat pig - hindi na puwedeng patawirin/
// mag-overlap dito. `excludePig` (opsyonal) - iniiwasan ang SARILING
// box ng isang partikular na pig (para hindi "bumangga sa sarili"
// kapag ito mismo ang naglalakad).
function getPigCollisionBoxes(excludePig) {
  if (!pigsCache) return [];

  return pigsCache
    .filter(
      (pig) =>
        pig !== excludePig &&
        pig.state !== "gone" &&
        pig.state !== "dead",
    )
    .map((pig) => ({
      x: pig.x - PIG_COLLISION_BOX_WIDTH / 2,
      y: pig.y - PIG_COLLISION_BOX_HEIGHT,
      width: PIG_COLLISION_BOX_WIDTH,
      height: PIG_COLLISION_BOX_HEIGHT,
    }));
}

// =========================
// PAGGALAW - IDLE <-> WALKING
// =========================

// 8-direksyon na "facing" base sa anggulo ng huling galaw - ginagamit
// LANG habang naka-idle (para magamit ang lahat ng 8 idle na larawan,
// mas maganda ang datingan kaysa 4 direksyon lang). Ang WALKING
// sprite mismo ay 4-direksyon lang (north/south/east/west) - walang
// available na diagonal na walk gif.
function angleTo8Direction(dx, dy) {
  if (dx === 0 && dy === 0) return "south";

  const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const dirs = [
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
    "north",
    "north-east",
  ];

  return dirs[Math.round(angleDeg / 45) % 8];
}

function pickPigWalkTarget(pig) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const dCol = Math.round((Math.random() * 2 - 1) * PIG_WANDER_RADIUS_TILES);
    const dRow = Math.round((Math.random() * 2 - 1) * PIG_WANDER_RADIUS_TILES);
    const col = pig.col + dCol;
    const row = pig.row + dRow;

    if (col === pig.col && row === pig.row) continue;
    if (!isFreeWanderTile(col, row)) continue;

    return { col, row };
  }

  return null;
}

function startPigWalk(pig) {
  const target = pickPigWalkTarget(pig);

  if (!target) {
    pig.state = "idle";
    pig.phaseUntil =
      performance.now() + randomBetween(PIG_IDLE_MIN_MS, PIG_IDLE_MAX_MS);

    return;
  }

  pig.state = "walking";
  pig.moving = true;
  pig.targetCol = target.col;
  pig.targetRow = target.row;
  pig.targetX = target.col * TILE_SIZE + TILE_SIZE / 2;
  pig.targetY = target.row * TILE_SIZE + TILE_SIZE;

  const dx = pig.targetX - pig.x;
  const dy = pig.targetY - pig.y;

  pig.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : "north");
  pig.idleFacing8 = angleTo8Direction(dx, dy);
}

function stepPigWalk(pig, deltaMs) {
  const dx = pig.targetX - pig.x;
  const dy = pig.targetY - pig.y;
  const dist = Math.hypot(dx, dy);
  const step = (PIG_WALK_SPEED_PX_PER_SEC * deltaMs) / 1000;

  if (dist <= step || dist === 0) {
    pig.x = pig.targetX;
    pig.y = pig.targetY;
    pig.col = pig.targetCol;
    pig.row = pig.targetRow;
    pig.moving = false;
    pig.state = "idle";
    pig.phaseUntil =
      performance.now() + randomBetween(PIG_IDLE_MIN_MS, PIG_IDLE_MAX_MS);

    return;
  }

  const nextX = pig.x + (dx / dist) * step;
  const nextY = pig.y + (dy / dist) * step;

  // May puno/bahay/bato (o anumang collidable) sa dinaraanan niya -
  // huwag ituloy ang galaw na ito (kaparehong bagong gawi ng oldman,
  // tingnan ang canFeetMoveTo sa decor.js) - sa halip na mag-clip sa
  // gitna nito, mag-iidle na lang muna siya rito.
  if (
    !canFeetMoveTo(nextX, nextY, PIG_COLLISION_BOX_WIDTH, PIG_COLLISION_BOX_HEIGHT, {
      excludePig: pig,
    })
  ) {
    pig.moving = false;
    pig.state = "idle";
    pig.phaseUntil =
      performance.now() + randomBetween(PIG_IDLE_MIN_MS, PIG_IDLE_MAX_MS);

    return;
  }

  pig.x = nextX;
  pig.y = nextY;
}

// =========================
// PAGBABALIK (RELOCATE) - GINAGAMIT LANG NGAYON PARA SA RESPAWN
// PAGKAPATAY (item 20, CLAUDE.md - tinanggal na ang random na
// "pagkawala sa mapa"/"traveler" na gawi, DATI dito rin ginagamit)
// =========================

// Random na bagong tile kahit saan sa mapa (hindi na paligid ng dating
// posisyon) - ginagamit ng "respawn pagkapatay".
function findPigRelocationSpot() {
  if (!mapReady || !mapData) return null;

  let attempt = 0;

  while (attempt < 400) {
    attempt++;

    const col = 1 + Math.floor(Math.random() * (mapData.width - 2));
    const row = 1 + Math.floor(Math.random() * (mapData.height - 2));

    if (!isFreeWanderTile(col, row)) continue;

    if (
      typeof isTilePlantedWithCrop === "function" &&
      isTilePlantedWithCrop(col, row)
    ) {
      continue;
    }

    return { col, row };
  }

  return null;
}

function placePigAt(pig, spot) {
  pig.col = spot.col;
  pig.row = spot.row;
  pig.x = spot.col * TILE_SIZE + TILE_SIZE / 2;
  pig.y = spot.row * TILE_SIZE + TILE_SIZE;
  pig.facing = "south";
  pig.idleFacing8 = "south";
  pig.moving = false;
  pig.state = "idle";
  pig.phaseUntil =
    performance.now() + randomBetween(PIG_IDLE_MIN_MS, PIG_IDLE_MAX_MS);

  // Buo ulit ang HP (at ang "hits" display counter) sa bawat
  // paglabas/respawn - kaparehong dating gawi (dati, buo ulit ang
  // health kada respawnPig), pero ngayon TALAGANG HP (550) ang
  // rineset, hindi lang bilang ng click.
  pig.hp = pig.maxHp || PIG_MAX_HP;
  pig.hits = 0;
}

// =========================
// HIT / PAGPATAY / RESPAWN
// =========================

function registerPigHit(pig) {
  // Tunay na HP/defense na ang batayan ngayon (dating "bilang ng
  // click LANG" - walang defense stat) - ang aktwal na nababawas sa
  // HP ay ang base hit damage MINUS ang defense ng pig (hindi
  // bababa sa 1, para hindi "immune" ang pig kahit gaano kalaki ang
  // defense niya laban sa damage).
  const damage = Math.max(1, PIG_HIT_DAMAGE - (pig.defense ?? PIG_DEFENSE));

  pig.hp = Math.max(0, (pig.hp ?? pig.maxHp ?? PIG_MAX_HP) - damage);
  pig.hits = (pig.hits || 0) + 1; // display/flash lang, hindi na batayan ng kamatayan
  pig.hitFlashUntil = performance.now() + 180; // saglit na "flash" reaction

  // "titigil yung pig" kapag na-hit - hindi na basta tumatakbo palayo
  // agad, kahit naglalakad pa siya noong tinamaan (cancel ang
  // kasalukuyang target) - saglit muna siyang naka-idle bago ulit
  // magdesisyon ng bagong galaw.
  pig.moving = false;
  pig.state = "idle";
  pig.phaseUntil = performance.now() + PIG_HIT_STUN_MS;

  if (pig.hp > 0) return;

  killPig(pig);
}

function killPig(pig) {
  // "may babagsak na meat 1-3 random" - lumalagpak sa lupa (hindi
  // deretso sa bag) sa TALAGANG posisyon niya nang mamatay -
  // kaparehong konsepto/pattern ng handleAxeClickOnOak (decor.js):
  // hiwa-hiwalay na piraso (hindi iisang tambak), naka-stagger ang
  // "landing" ng bawat isa (GROUND_ITEM_SPAWN_STAGGER_MS,
  // ground-items.js - naglo-load ito PAGKATAPOS ng pig.js, pero OK
  // lang - runtime call na ito, hindi parse-time).
  const dropCount =
    PIG_MEAT_DROP_MIN +
    Math.floor(Math.random() * (PIG_MEAT_DROP_MAX - PIG_MEAT_DROP_MIN + 1));

  if (typeof spawnGroundItem === "function") {
    for (let i = 0; i < dropCount; i++) {
      spawnGroundItem(pig.col, pig.row, "meat", 1, i * GROUND_ITEM_SPAWN_STAGGER_MS);
    }
  }

  pig.state = "dead";
  pig.moving = false;
  pig.hits = 0;
  pig.hp = 0;
  // EKSAKTONG 15 segundo (PIG_RESPAWN_DELAY_MS) - dating random (8-20s)
  // - tingnan ang item 20 sa CLAUDE.md.
  pig.respawnAt = performance.now() + PIG_RESPAWN_DELAY_MS;

  // Bagong LEVEL/EXP system (hotbar.js) - mas malaki ang exp dito
  // kaysa sa puno/bato, dahil mas mahirap patayin ang pig (maraming
  // hit + totoong HP/defense, tingnan ang PIG_MAX_HP).
  if (typeof gainExp === "function") gainExp(10);
}

function respawnPig(pig) {
  const spot = findPigRelocationSpot() || { col: pig.col, row: pig.row };

  placePigAt(pig, spot);
}

// =========================
// UPDATE (tinatawag kada frame mula sa update.js)
// =========================

function updatePigs(deltaMs) {
  ensurePigs();

  if (!pigsCache) return;

  const now = performance.now();

  for (const pig of pigsCache) {
    // "dead" na lang ang TANGING dahilan kung bakit mawawala/hindi
    // maguguhit ang isang pig ngayon (item 20, CLAUDE.md) - tinanggal
    // na ang dating random na "pagkawala sa mapa" (dating may check
    // dito laban sa `nextDisappearAt`/`vanishPig` - hindi na umiiral).
    if (pig.state === "dead") {
      if (now >= pig.respawnAt) respawnPig(pig);
      continue;
    }

    if (pig.state === "idle") {
      if (now >= pig.phaseUntil) startPigWalk(pig);
      continue;
    }

    if (pig.state === "walking") {
      stepPigWalk(pig, deltaMs);
    }
  }
}

// =========================
// PAGGUHIT
// =========================

function resolvePigSprite(pig) {
  if (pig.moving) {
    const frameIndex =
      Math.floor(performance.now() / PIG_WALK_FRAME_MS) % PIG_WALK_FRAME_COUNT;

    return PIG_WALK_IMAGES[pig.facing][frameIndex];
  }

  return PIG_IDLE_IMAGES[pig.idleFacing8] || PIG_IDLE_IMAGES.south;
}

// Munting health bar sa itaas ng ulo - lumalabas LANG kapag nagsimula
// nang matamaan (may hits na) - para hindi laging may lumulutang na
// bar sa ibabaw ng bawat pig kahit buo pa ang health.
function drawPigHealthBar(pig, feetX, feetY) {
  if (!pig.hits) return;

  const barWidth = TILE_SIZE * 0.7;
  const barHeight = 2;
  const x = feetX - barWidth / 2;
  const y = feetY - PIG_DEST_SIZE - 4;
  // TALAGANG hp/maxHp ratio na ngayon (dating hits/PIG_REQUIRED_HITS
  // LANG - walang defense factored in dati).
  const ratio = Math.max(0, (pig.hp ?? 0) / (pig.maxHp || PIG_MAX_HP));

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.fillStyle = ratio > 0.4 ? "#7CCB6B" : "#D9534F";
  ctx.fillRect(x, y, barWidth * ratio, barHeight);
  ctx.restore();
}

function drawPigAt(pig) {
  if (pig.state === "gone" || pig.state === "dead") return;

  const img = resolvePigSprite(pig);

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const feetX = pig.x;
  const feetY = pig.y;

  // Simpleng anino sa ilalim ng paanan - kaparehong helper (decor.js,
  // shared) na ginagamit din ng oldman. APAT ANG PAA ng pig (mas
  // malapad/mas "bilog" ang katawan kumpara sa nakatayong tao) - kaya
  // MAS MALAPAD at MAS BILOG (mas mataas na heightRatio) ang anino
  // nito kaysa sa oldman, para hiwalay/naaayon sa TALAGANG hugis at
  // laki ng bawat isa (PIG_DEST_SIZE).
  drawGroundShadow(feetX, feetY, PIG_DEST_SIZE * 0.62, {
    heightRatio: 0.38,
    blur: 2.5,
    alpha: 0.3,
    // Bahagyang itinaas (negative = pataas) - kaparehong ayos/dahilan
    // ng oldman (decor.js) - dating masyadong malayo sa TALAGANG paa,
    // kaya parang nakalutang.
    offsetY: -TILE_SIZE * 0.4,
  });

  // Saglit na "flash" (mas maliwanag) sa sandaling matamaan - simpleng
  // visual feedback na natamaan siya.
  const flashing = performance.now() < pig.hitFlashUntil;

  ctx.save();

  if (flashing) ctx.filter = "brightness(1.9)";

  ctx.translate(feetX, feetY);
  ctx.drawImage(img, -PIG_DEST_SIZE / 2, -PIG_DEST_SIZE, PIG_DEST_SIZE, PIG_DEST_SIZE);
  ctx.restore();

  drawPigHealthBar(pig, feetX, feetY);
}

// Kasama sa Y-sort (map.js) - kaparehong pattern ng getOakDrawables/
// getOldManDrawables (decor.js).
function getPigDrawables() {
  ensurePigs();

  if (!pigsCache) return [];

  return pigsCache
    .filter((pig) => pig.state !== "gone" && pig.state !== "dead")
    .map((pig) => ({
      sortY: pig.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      draw: () => drawPigAt(pig),
      // "type: pig" - kaparehong ayos ng ginawa sa oldman (decor.js,
      // getOldManDrawables) - WALA ito sa OCCLUDABLE_OVERLAP_TYPES
      // (map.js, trees/house lang), kaya hindi na siya nalalabuan
      // (opacity) tuwing nag-o-overlap ang bbox niya sa player -
      // laging 100% opacity/orihinal ang itsura ng pig.
      type: "pig",
      bbox: {
        x: pig.col * TILE_SIZE + TILE_SIZE * 0.2,
        y: pig.row * TILE_SIZE - TILE_SIZE * 0.6,
        width: TILE_SIZE * 0.6,
        height: TILE_SIZE * 1.4,
      },
    }));
}

// =========================
// PAG-CLICK (i-hit ang pig - kahit anong naka-equip, o wala man)
// =========================

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;

  const tile = getMouseTile();

  if (!tile) return;
  if (!isTileInReach(tile.col, tile.row)) return;
  if (Date.now() - lastPigHitAt < PIG_HIT_COOLDOWN_MS) return;

  const pig = findAlivePigAt(tile.col, tile.row);

  if (!pig) return;

  lastPigHitAt = Date.now();

  registerPigHit(pig);

  // Kunwaring "suntok" na reaction (kaparehong startPunchStrike na
  // ginagamit din ng puno/bato gamit ang kamao - tingnan ang
  // resources.js) - cosmetic lang, naaplay na agad ang hit sa itaas.
  if (typeof startPunchStrike === "function") {
    startPunchStrike(tile.col, tile.row);
  }
});
