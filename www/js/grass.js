// =========================
// MGA DAMONG TUFT (grass1/grass2/grass3 - dekorasyong sagwan sa tabi ng
// puno/bato)
// =========================
//
// Random na naglalagay ng maliliit na tumpok ng damo kada outdoor na
// mundo - KAPAREHONG PATTERN ng puno/bato (resources.js): seeded random
// batay sa pangalan ng mundo (pareho palagi kahit mag-reload), walang
// collision box (puwedeng patawirin/tapakan ng player - hindi tulad ng
// puno/bato), at Y-sort din sila laban sa player.
//
// AYOS (hiling ng user): "kapag dumaan yung character bumabalik sa old
// grass which is not [dapat]... i-apply mo lang yung old animation sa
// bagong grass, delete mo na yung dating mga grass" - dating LUMILIPAT
// sa IBANG larawan (grassleft.png/grassright.png/snowgrassleft.png/
// snowgrassright.png - "old grass") ang isang tumpok kapag natapakan/
// nadaanan ng player - TINANGGAL na ito, kasama ang mismong mga .png
// file (assets/objects/grass/). IISA/PAREHONG larawan na lang
// (grass1/grass2/grass3, random kada tumpok - tingnan ang
// GRASS_TUFT_IDLE_VARIANT_PATHS sa ibaba) ang ginagamit ng isang tumpok
// SA LAHAT ng pagkakataon - ang "epekto" ng pagtapak ay ang PAREHONG
// "skew" na canvas transform na dati nang ginagamit sa banayad na
// hangin-sway (tingnan ang paliwanag doon) - mas MALAKI/matambad lang
// ang anggulo nito habang TALAGANG nakatapakan (tingnan ang skew
// computation sa drawGrassTuftSprite sa ibaba) - kaya PAREHONG larawan
// pa rin, "humihilig"/yumuyuko lang ito papunta sa direksyon ng
// paglakad ng player, hindi na lumilipat sa ibang guhit.
//
// May maliit na "pagkalat ng dahon" na particle effect pa rin - saglit
// lang, lumilipad papaitaas/palabas at unti-unting nawawala, tuwing
// UMAALIS na (hindi na overlap) ang player sa isang tumpok - kasabay
// ng simula ng ease-out/"pag-animate pabalik" papuntang normal na
// wave (tingnan ang updateGrassTuftsTouch/drawGrassTuftSprite).
//
// Habang WALANG nakatapak dito, may banayad na "hangin" na sway
// animation (bahagyang paghilig paulit-ulit, sine wave) - hindi ito
// totoong frame-by-frame na animation (walang malinaw na hiwalay na
// frame boundary sa loob ng larawan), kaya sa halip, ginagamit ang
// canvas transform (skew) para sa banayad na paggalaw.

const GRASS_TUFT_COUNT_PER_WORLD = 50;

// 9 designs (grass1-grass9) - IISA lang sa 9 ang random na
// napipili KADA TUMPOK (tuft.variant), PAREHO ito SA LAHAT ng
// pagkakataon (idle, nakatapakan, umuulan ng niyebe) - tingnan ang
// paliwanag sa itaas kung bakit tinanggal na ang paglipat sa ibang
// larawan.
//
// AYOS (hiling ng user): "i add grass4 to grass9 i want you to add it
// in random grass" - dinagdag ang grass4-grass9.png sa listahan ng
// random na napipiling variant (dating grass1-grass3 lang) - kaya mas
// magkaka-iba-iba na ang itsura ng mga tumpok kada mundo.
const GRASS_TUFT_VARIANT_COUNT = 9;

const GRASS_TUFT_IDLE_VARIANT_PATHS = [
  "./assets/objects/grass/grass1.png",
  "./assets/objects/grass/grass2.png",
  "./assets/objects/grass/grass3.png",
  "./assets/objects/grass/grass4.png",
  "./assets/objects/grass/grass5.png",
  "./assets/objects/grass/grass6.png",
  "./assets/objects/grass/grass7.png",
  "./assets/objects/grass/grass8.png",
  "./assets/objects/grass/grass9.png",
];

const GRASS_TUFT_IMAGES = {};

for (const path of GRASS_TUFT_IDLE_VARIANT_PATHS) {
  const img = new Image();

  img.src = path;
  GRASS_TUFT_IMAGES[path] = img;
}

let grassTuftsCache = null;
let grassTuftsValidatedFor = null;

// =========================
// PAGPUTOL NG DAMO (CUTTER) - bagong hiling ng user
// =========================
//
// "gusto ko yun grass is 1 use lang is na wiwipe out na pero dapat
// naka front din yung character sa grass para masira siguro 3 tiles
// nasisira kung meron grass 123 tikes 1 left 2 middle character 3
// right" - kaya:
//   1. ISANG hit lang (hindi multi-hit tulad ng puno/bato) - agad
//      "nawiwipe-out"/nawawala ang tumpok sa sandaling matamaan.
//   2. Dapat NAKA-HARAP ang player sa direksyon ng tumpok (player.direction) -
//      ang TATLONG magkakatabing tile sa HARAP ng player (1=kaliwa,
//      2=gitna/eksaktong harap, 3=kanan, LAHAT relatibo sa direksyon ng
//      player) ang sabay-sabay na "nasisira"/nawawala kada isang hit -
//      tingnan ang getGrassCutterFrontRowTiles sa ibaba.
//   3. Tumutubo ulit (kaparehong-pareho ng puno, resources.js) sa
//      PAREHONG tile pagkatapos ng RANDOM na 3-5 minuto
//      (rollResourceRegrowMs(), resources.js - SHARED na helper, para
//      pareho ang gawi ng puno/bato/damo).
//
// Ang bawat "tuft" (fixedGrassTufts, maaaring may fractional na
// ".row" - hal. 32.5, para sa mas siksik/organic na cluster) ay
// kinukumpol sa PINAKAMALAPIT na INTEGER tile (Math.round) para sa
// layunin ng pag-aani - maraming magkakatabing tumpok (hal. row 30 AT
// 30.5) ay maaaring MAGKAPAREHONG "harvest slot" (isang buong tile) -
// TANGGAP lang ito, mas simple/tile-based na batayan (kapareho ng
// collision-key ng puno/bato) sa halip na pixel-perfect na
// pag-track ng bawat isa.

const GRASS_TUFT_SAVE_KEY = "tralala.harvestedGrassTufts";

// { [world]: { "col,row": true } } - "true" lang (hindi bilang ng hit,
// dahil 1-hit lang naman talaga) - tingnan ang paliwanag sa itaas.
let harvestedGrassTufts = loadHarvestedGrassTufts();

function loadHarvestedGrassTufts() {
  try {
    const raw = localStorage.getItem(GRASS_TUFT_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

// "force" param, default false - pareho ng ibang saveXxx() sa
// resources.js (tingnan ang paliwanag sa saveHarvestedResources doon).
function saveHarvestedGrassTufts(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      GRASS_TUFT_SAVE_KEY,
      JSON.stringify(harvestedGrassTufts),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getHarvestedGrassTuftsForCurrentWorld() {
  if (!currentWorld) return {};

  if (!harvestedGrassTufts[currentWorld]) {
    harvestedGrassTufts[currentWorld] = {};
  }

  return harvestedGrassTufts[currentWorld];
}

const GRASS_REGROW_SCHEDULE_SAVE_KEY = "tralala.grassRegrowSchedule";

// { [world]: { "col,row": regrowAtTimestamp } } - kaparehong-pareho ng
// treeRegrowSchedule (resources.js).
let grassRegrowSchedule = loadGrassRegrowSchedule();

function loadGrassRegrowSchedule() {
  try {
    const raw = localStorage.getItem(GRASS_REGROW_SCHEDULE_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

function saveGrassRegrowSchedule(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      GRASS_REGROW_SCHEDULE_SAVE_KEY,
      JSON.stringify(grassRegrowSchedule),
    );
  } catch (error) {
    // Hindi kritikal.
  }
}

function getGrassRegrowScheduleForCurrentWorld() {
  if (!currentWorld) return {};

  if (!grassRegrowSchedule[currentWorld]) {
    grassRegrowSchedule[currentWorld] = {};
  }

  return grassRegrowSchedule[currentWorld];
}

// Ang "harvest slot" (tile) key ng isang partikular na tuft - tingnan
// ang paliwanag sa itaas (Math.round ang batayan, hindi ang eksaktong
// fractional row nito).
function grassTuftTileKey(tuft) {
  return tuft.col + "," + Math.round(tuft.row);
}

function isGrassTuftHarvested(tuft) {
  const harvested = getHarvestedGrassTuftsForCurrentWorld();

  return !!harvested[grassTuftTileKey(tuft)];
}

// Tinatawag KADA FRAME (update.js) - kaparehong-pareho ng
// updateTreeRegrowth (resources.js): sinusuri kung may tile na
// "tapos na ang paghihintay" - kung meron, "tumutubo ulit" (tinatanggal
// sa harvested set) ang tumpok sa PAREHONG tile.
function updateGrassRegrowth() {
  if (typeof getGameNow !== "function") return;
  if (!currentWorld) return;

  const schedule = getGrassRegrowScheduleForCurrentWorld();
  const keys = Object.keys(schedule);

  if (keys.length === 0) return;

  const now = getGameNow();
  const harvested = getHarvestedGrassTuftsForCurrentWorld();
  let changed = false;

  for (const key of keys) {
    if (now < schedule[key]) continue;

    delete schedule[key];
    delete harvested[key];
    changed = true;
  }

  if (changed) {
    saveGrassRegrowSchedule();
    saveHarvestedGrassTufts();
  }
}

// May buhay/hindi pa na-aning tumpok ba sa EKSAKTONG (col,row) na tile
// na ito? ("row" dito ay INTEGER tile row na, hindi na yung fractional
// na row ng orihinal na tuft data - tingnan ang grassTuftTileKey).
function hasAliveGrassTuftAtTile(col, row) {
  if (!grassTuftsCache) return false;

  const key = col + "," + row;
  const harvested = getHarvestedGrassTuftsForCurrentWorld();

  if (harvested[key]) return false;

  return grassTuftsCache.some(
    (tuft) => tuft.col === col && Math.round(tuft.row) === row,
  );
}

// Ang 3 KATABING tile sa HARAP ng player, base sa KASALUKUYANG
// direksyon niya (player.direction) - "1=kaliwa, 2=gitna/harap
// mismo, 3=kanan", LAHAT relatibo sa TALAGANG kinakaharap ng
// karakter (hindi sa mouse), tingnan ang paliwanag sa itaas.
function getGrassCutterFrontRowTiles() {
  if (typeof player === "undefined") return [];

  const col = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const row = Math.floor((player.y + player.height / 2) / TILE_SIZE);
  const dir = player.direction;

  if (dir === "down") {
    return [
      { col: col - 1, row: row + 1 },
      { col: col, row: row + 1 },
      { col: col + 1, row: row + 1 },
    ];
  }

  if (dir === "up") {
    return [
      { col: col - 1, row: row - 1 },
      { col: col, row: row - 1 },
      { col: col + 1, row: row - 1 },
    ];
  }

  if (dir === "left") {
    return [
      { col: col - 1, row: row - 1 },
      { col: col - 1, row: row },
      { col: col - 1, row: row + 1 },
    ];
  }

  if (dir === "right") {
    return [
      { col: col + 1, row: row - 1 },
      { col: col + 1, row: row },
      { col: col + 1, row: row + 1 },
    ];
  }

  return [];
}

// Bilang ng damo na TALAGANG naputol na (session lang, hindi naka-save -
// katulad ng ibang purong session-state dito, hal. grassParticles) -
// ginagamit para malaman kung kailan na "ika-3" na pagputol
// (decreaseFoodDuration sa ibaba).
let grassCutCountForFood = 0;

// Tinatanggal (harvest) ang tumpok sa EKSAKTONG (col,row) tile na ito -
// isang beses/1-hit lang, itinatakda agad ang regrow schedule
// (RANDOM na 3-5 minuto, rollResourceRegrowMs() - resources.js).
// `false` kung wala namang buhay na tumpok dito (wala nang gagawin).
function cutGrassTileAt(col, row) {
  if (!hasAliveGrassTuftAtTile(col, row)) return false;

  const key = col + "," + row;

  getHarvestedGrassTuftsForCurrentWorld()[key] = true;
  saveHarvestedGrassTufts();

  const regrowMs =
    typeof rollResourceRegrowMs === "function"
      ? rollResourceRegrowMs()
      : 4 * 60 * 1000;

  getGrassRegrowScheduleForCurrentWorld()[key] =
    (typeof getGameNow === "function" ? getGameNow() : Date.now()) + regrowMs;
  saveGrassRegrowSchedule();

  // BAGO (hiling ng user): "gusto ko yung may effects na leaves
  // particles din kapag na cut ko yung grass" - REUSE na lang ang
  // parehong "pagkalat ng dahon" na particle burst na ginagamit na sa
  // pagtapak/paglisan sa damo (spawnGrassTouchEffect, itaas) - parehong
  // leaf-colored na particle, tama na ring epekto para sa isang
  // "pagputol".
  if (typeof spawnGrassTouchEffect === "function") {
    spawnGrassTouchEffect(col, row);
  }

  // BAGO (hiling ng user): "sa grass naman kada 3 na pag grass is -3
  // sa foods duration" - bilang PER INDIBIDWAL na tumpok na TALAGANG
  // naputol (hindi kada "swing" - isang swing ay puwedeng magputol ng
  // hanggang 3 tumpok nang sabay-sabay, tingnan ang
  // handleCutterClickOnGrass) - sa BAWAT ika-3 (3, 6, 9, ...),
  // bumabawas ng 3 sa food (decreaseFoodDuration, hotbar.js).
  grassCutCountForFood++;

  if (grassCutCountForFood % 3 === 0 && typeof decreaseFoodDuration === "function") {
    decreaseFoodDuration(3);
  }

  return true;
}

// Tinatawag mula sa mousedown listener (resources.js) kapag naka-equip
// ang cutter - "col,row" dito ay ang TALAGANG kinuklikan (dapat
// tumugma sa isa sa 3 front-row tile, kundi "naka-front" pa rin ang
// player doon - tingnan ang paliwanag sa itaas). Kapag TAMA/naka-front:
// PINUPUTOL ANG BUONG 3-TILE na hanay nang SABAY-SABAY (hindi lang ang
// eksaktong kinlikan), tulad ng hiniling.
function handleCutterClickOnGrass(col, row) {
  const frontTiles = getGrassCutterFrontRowTiles();

  const isFrontTile = frontTiles.some(
    (tile) => tile.col === col && tile.row === row,
  );

  if (!isFrontTile) return false;

  let cutAny = false;

  for (const tile of frontTiles) {
    if (cutGrassTileAt(tile.col, tile.row)) cutAny = true;
  }

  return cutAny;
}

// =========================
// PAGGAWA NG MGA POSISYON (seeded, isang beses kada mundo)
// =========================

function generateGrassTufts() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  if (!mapReady || !mapData || !world || !world.outdoor) return [];

  // AYOS (malaking bug - hiling ng user: "di parin lumilitaw yung
  // grass1/2/3"): dating "|| world.noGrassTufts" pa rin ang kasama sa
  // guard sa itaas - AGAD nag-re-return ng BLANGKO nito KAHIT may
  // laman na ang world.fixedGrassTufts (JSON), dahil ang "grassmap"
  // world (worlds.js) ay may "noGrassTufts: true" (mula nang hiling ng
  // user na "alisin ang random na damo, ako na maglagay manually via
  // JSON"). Kaya SINISIRA nito bago pa man maabot ang fixedGrassTufts
  // check sa ibaba - WALANG NAKALABAS na grass tuft (luma man o bago)
  // sa grassmap simula pa noon. Ang TAMANG gawi (kaparehong pattern ng
  // fixedTrees/fixedStones, resources.js) ay dapat "noGrassTufts" LANG
  // ang humahadlang sa RANDOM na paglalagay (placeNodes-style loop sa
  // ibaba) - HINDI dapat ito humadlang kapag may EKSPLISITONG
  // fixedGrassTufts na list - tingnan ang if-check sa ibaba.
  if (world.noGrassTufts && !Array.isArray(world.fixedGrassTufts)) return [];

  const objectCells =
    typeof getObjectCells === "function" ? getObjectCells() : null;

  // Iwasang magtanim sa ibabaw ng puno/bato (resources.js/decor.js) -
  // umaasa tayo dito na TAPOS na silang mai-generate/maipush sa
  // `collisions` bago tumakbo ito (tingnan ang pagkakasunod-sunod sa
  // update.js - ensureResourceNodes/ensureOakSpots MUNA bago
  // ensureGrassTufts).
  const occupied = new Set();
  const seedBase = hashStringToInt(currentWorld + ":grassTufts");
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

    // BAGONG: iwasan ding tumubo ang mga damong tuft (500 kada mundo!)
    // sa loob ng "clearing" ng gate patungong town (resources.js,
    // sinusunod din ng random na puno/bato) - kung hindi, natatakpan/
    // nakakatago ang madilim na patse (decor.js) sa dami ng tuft na
    // Y-sorted OBJECT (iginuguhit SA IBABAW ng patse, hindi tulad ng
    // ground-layer na damo).
    if (
      typeof isInsideTownGateClearing === "function" &&
      isInsideTownGateClearing(col, row)
    ) {
      return false;
    }

    const tileBox = {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    // AYOS (hiling ng user, kaparehong-pareho ng ayos sa resources.js):
    // dagdag na 1-TILE na CLEARANCE sa paligid ng kahit anong collision
    // (bundok/pader) - hindi lang basta EKSAKTONG tile ang iniiwasan.
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

  const tufts = [];

  // BAGO: "fixedGrassTufts" sa WORLDS (worlds.js) - kung meron nito
  // ang kasalukuyang mundo, ang EKSAKTONG listahan ng {col, row,
  // variant} na iyon ang gagamitin SA HALIP na random na paglalagay -
  // parehong pattern ng "fixedTrees"/"fixedStones" sa resources.js.
  //
  // AYOS (hiling ng user): "kada lagay ko o dagdag dun sa json is iba
  // iba yung nailalagay na grass" - dating "variant: node.variant || 0"
  // (PAREHONG grass PALAGI - unang variant lang - kapag walang
  // tinukoy na "variant" sa JSON entry) - ngayon, RANDOM na (parehong
  // seeded na "nextRandom" ng buong mundo, tingnan ang paliwanag sa
  // itaas) kapag WALANG eksplisitong "variant" na tinukoy - awtomatikong
  // magkaka-iba-iba ang itsura (grass1/grass2/grass3) ng bawat bagong
  // idinagdag na entry, HINDI mo na kailangang mano-manong pumili/
  // magtakda ng "variant" kada isa (puwede mo pa ring gawin, kung
  // gusto mo talagang PIRMihan ang isang partikular na disenyo).
  if (Array.isArray(world.fixedGrassTufts)) {
    for (const node of world.fixedGrassTufts) {
      tufts.push({
        col: node.col,
        row: node.row,
        variant: Number.isInteger(node.variant)
          ? node.variant
          : Math.floor(nextRandom() * GRASS_TUFT_VARIANT_COUNT),
        swayPhase: nextRandom() * Math.PI * 2,
      });
      occupied.add(node.col + "," + node.row);
    }

    return tufts;
  }

  let attempt = 0;

  // AYOS (hiling ng user, "grassmap2" - ~350 damo, random): opsyonal na
  // "world.grassTuftCount" override (kaparehong pattern ng
  // world.treeCount/world.stoneCount sa resources.js) - kung wala
  // namang itinakda, ang DATING GRASS_TUFT_COUNT_PER_WORLD (50) pa rin.
  const grassTuftTarget = world.grassTuftCount || GRASS_TUFT_COUNT_PER_WORLD;

  // AYOS (hiling ng user - "grassmap2", 350 target): parehong dahilan
  // ng cap increase sa resources.js placeNodes (dating 800, kulang para
  // sa mataas na target).
  while (tufts.length < grassTuftTarget && attempt < 6000) {
    attempt++;

    const col = 1 + Math.floor(nextRandom() * (mapData.width - 2));
    const row = 1 + Math.floor(nextRandom() * (mapData.height - 2));

    if (!isValidTile(col, row)) continue;

    tufts.push({
      col,
      row,
      variant: Math.floor(nextRandom() * GRASS_TUFT_VARIANT_COUNT),
      // Sariling "phase" ng bawat tumpok para sa sway animation - kaya
      // hindi sabay-sabay/naka-sync ang paghilig ng lahat ng tumpok
      // (mukhang mas natural, parang magkaibang bahagi ng hangin).
      swayPhase: nextRandom() * Math.PI * 2,
    });
    occupied.add(col + "," + row);
  }

  return tufts;
}

// Tinatawag kada frame mula sa update() - kagaya ng ensureResourceNodes,
// isang beses lang talaga tumatakbo ang mabigat na bahagi nito kada
// pagpasok sa isang mundo.
function ensureGrassTufts() {
  if (!mapReady || !mapData) return;
  if (grassTuftsValidatedFor === currentWorld) return;

  grassTuftsCache = generateGrassTufts();
  grassTuftsValidatedFor = currentWorld;
}

// =========================
// PAGTAPAK NG PLAYER (yumuyuko papunta sa direksyon ng lakad + effect)
// =========================

// Gaano katagal umere-ease pabalik sa tuwid pagkatapos umalis ang
// player - hindi agad bumabalik sa tuwid, para hindi "kumikislap"/
// nag-aabrupt na flicker.
const GRASS_BEND_RELEASE_MS = 350;

// Gaano kabilis mag-ease-IN ang pagyuko habang TALAGANG nakatapakan -
// mabilis lang ito (isang beses), pagkatapos ay NANATILING TUWID/
// STABLE ang anggulo habang nakatapak pa rin (hindi na nag-uulit-ulit
// ng ease-in kada frame) - dito na-aayos ang dating "nginig"/pagkislap
// ng damo habang nakatayo lang doon ang player.
const GRASS_BEND_SETTLE_MS = 140;

// key ("col,row") -> {
//   dir: "left" | "right",
//   touching: totoong nakatapakan pa ba NGAYON,
//   enteredAt: performance.now() nang UNANG tumapak (o nang huling
//     nagbago ang direksyon habang nakatapak) - basehan ng ease-IN,
//   releasedAt: performance.now() nang umalis (null habang nakatapak
//     pa) - basehan ng ease-OUT pabalik sa tuwid.
// }
let grassBendState = {};

// Mga tile na TALAGANG nakatapakan NGAYONG FRAME - ginagamit para
// malaman kung sino ang UMALIS na ngayong frame lang, para dito
// simulan ang ease-out AT isabog ang particle effect (isang beses lang
// kada pag-alis, hindi paulit-ulit).
let grassTouchedLastFrame = new Set();

function resolveGrassBendDirection(tuft) {
  // Priyoridad: TALAGANG direksyon ng paglakad ng player (player.js) -
  // yumuyuko ang damo PAPUNTA sa direksyon kung saan siya naglalakad,
  // parang tinatapakan/tinatabig niya ito habang dumaraan.
  if (player.direction === "right") return "left";
  if (player.direction === "left") return "right";

  // Patayo ang paglakad (up/down) - walang malinaw na kaliwa/kanan sa
  // "direction" mismo, kaya ang RELATIBONG posisyon na lang ng player
  // laban sa tumpok ang basehan (saan siya nagmula): kung nasa kaliwa
  // pa siya ng tumpok, parang papunta siya pakanan -> yumuyuko pakanan.
  const tuftCenterX = tuft.col * TILE_SIZE + TILE_SIZE / 2;
  const playerCenterX = player.x + player.width / 2;

  return playerCenterX < tuftCenterX ? "right" : "left";
}

function getGrassBendState(col, row) {
  const state = grassBendState[col + "," + row];

  if (!state) return null;

  // AYOS (hiling ng user): "yung effects niya kapag nasa kalagitnaan
  // yung character ng tile na may damo is nag skewed na siya... gusto
  // ko is tyaka lang mag effects na skewed kapag nakaalis na ng tile"
  // - dating nag-a-apply na ang bend/skew SA SANDALING nakatapakan pa
  // ang player (state.touching === true, tingnan ang paliwanag sa
  // itaas ng drawGrassTuftSprite) - ngayon, WALANG bend habang
  // TALAGANG nakatapakan pa - "wala" muna itong dapat gawin dito
  // (ibabalik ang idle sway/wave sa drawGrassTuftSprite) - tanging sa
  // SANDALING umalis na (touching === false) saka lang lalabas ang
  // buong ease-in-tapos-ease-out na pagyuko (tingnan ang paliwanag sa
  // drawGrassTuftSprite).
  if (state.touching) return null;

  // Hindi na nakatapak - kung TALAGANG lampas na sa buong ease-in +
  // ease-out na oras (settle + release), tuwid/nagwawave na ulit siya
  // (idle) - "wala" na itong dapat gawin.
  if (
    state.releasedAt !== null &&
    performance.now() - state.releasedAt <
      GRASS_BEND_SETTLE_MS + GRASS_BEND_RELEASE_MS
  ) {
    return state;
  }

  return null;
}

// Tinatawag kada frame mula sa update() - chinicheck kung ANONG ISANG
// tumpok (kung meron man) ang TALAGANG naaapakan ng player NGAYON,
// tapos ino-update ang direksyon ng pagyuko + tinitignan kung "bagong
// pasok" (para sa particle effect).
//
// AYOS (hiling ng user): "dapat specific lang na grass na kung yung
// isang tile nadaanan yun lang mag skewed at mag effects" - dating
// FULL BOX overlap check (isColliding) ang ginagamit laban sa
// collision box ng player (getPlayerCollisionBox) - PERO ang box na
// iyon ay MAS MALAPAD (~25px) kaysa sa isang TILE_SIZE (16px), kaya
// kapag naka-tayo ang player sa PAGITAN ng dalawang magkatabing hanay
// ng damo (hal. yung 3 hanay na fixedGrassTufts sa grassmap), DALAWANG
// tumpok ang SABAY-SABAY na naka-overlap sa box na iyon - kaya
// PAREHONG sumasabog/yumuyuko ang dalawa, hindi lang yung TALAGANG
// tinatapakan niya. AYOS: gamitin na lang ang GITNA/CENTER POINT ng
// collision box (isang (x,y) point, hindi buong box) - isang PUNTO ay
// laging isang TILE LANG ang puwedeng mapasukan (maliban sa eksaktong
// hangganan, hindi praktikal na mangyari), kaya ISANG tumpok LANG
// talaga ang puwedeng ma-detect bilang "naaapakan" sa isang frame.
function updateGrassTuftsTouch() {
  if (!grassTuftsCache || grassTuftsCache.length === 0) return;

  const playerBox =
    typeof getPlayerCollisionBox === "function"
      ? getPlayerCollisionBox()
      : {
          x: player.x,
          y: player.y,
          width: player.width,
          height: player.height,
        };

  const footPointX = playerBox.x + playerBox.width / 2;
  const footPointY = playerBox.y + playerBox.height / 2;

  const touchedNow = new Set();

  for (const tuft of grassTuftsCache) {
    // BAGO (cutter feature): laktawan ang mga na-cut na (isang beses)
    // na tumpok - wala nang guhit/epekto dito habang naghihintay pa ng
    // regrow (tingnan ang "PAGPUTOL NG DAMO (CUTTER)" sa itaas).
    if (isGrassTuftHarvested(tuft)) continue;

    const tileLeft = tuft.col * TILE_SIZE;
    const tileTop = tuft.row * TILE_SIZE;

    if (
      footPointX < tileLeft ||
      footPointX >= tileLeft + TILE_SIZE ||
      footPointY < tileTop ||
      footPointY >= tileTop + TILE_SIZE
    ) {
      continue;
    }

    const key = tuft.col + "," + tuft.row;
    const newDir = resolveGrassBendDirection(tuft);
    const prev = grassBendState[key];

    if (!prev || !prev.touching || prev.dir !== newDir) {
      // AYOS: dating "bentUntil" ay INIRE-RESET (now + hold) sa TUWING
      // frame habang nakatapak pa rin ang player - dahil dito, kada
      // frame ay parang "bagong-bago" ang pagyuko, kaya HINDI kailanman
      // umaabot sa buong (settled) na anggulo - nanatili itong halos
      // nasa gitna, at kahit maliit na pagkakaiba ng timing kada frame
      // ay nagiging kapansin-pansing "nginig"/pagkislap. AYOS: bago
      // lang nagse-set ng bagong `enteredAt` (basehan ng ease-in) kapag
      // TALAGANG bagong pasok o nagbago ang direksyon - kung parehas
      // pa rin ang direksyon at nakatapak pa rin, hindi na ito
      // ginagalaw pa, kaya nananatiling STABLE ang anggulo (walang
      // pag-uulit ng ease-in kada frame).
      grassBendState[key] = {
        dir: newDir,
        touching: true,
        enteredAt: performance.now(),
        releasedAt: null,
      };
    } else {
      prev.touching = true;
      prev.releasedAt = null;
    }

    touchedNow.add(key);

    // Isang PUNTO lang (footPointX/Y) ang ginagamit dito, kaya HINDI
    // kailanman magiging TAMA/kailangan pa ang pag-check sa IBANG
    // tuft - laging IISA (o wala) lang ang mapapasok. Ligtas na
    // mag-`break` dito (maliit na performance win, hindi mandatory).
    break;
  }

  // Mga tumpok na nakatapakan noong nakaraang frame PERO hindi na
  // ngayon - dito lang sinisimulan ang ease-out pabalik sa tuwid.
  //
  // AYOS (hiling ng user): "yung leaves particle dapat isabay mo na
  // lang dun sa pag animate pabalik o naalis na yung character sa
  // mismong tile" - dating sumasabog ang dahon SA SANDALING bagong
  // pasok/tumapak ang player (entry) - ngayon, DITO na lang isasabog
  // ang particle: SA SANDALING umalis na ang player sa tile (parehong
  // sandali ng pagsisimula ng ease-out/"pag-animate pabalik" sa
  // drawGrassTuftSprite) - isang beses lang din ito (isang beses lang
  // tumatakbo itong loop kada pag-alis, hindi paulit-ulit habang
  // patuloy na naka-release).
  for (const key of grassTouchedLastFrame) {
    if (touchedNow.has(key)) continue;

    const state = grassBendState[key];

    if (state) {
      state.touching = false;
      state.releasedAt = performance.now();

      const [col, row] = key.split(",").map(Number);

      spawnGrassTouchEffect(col, row);
    }
  }

  grassTouchedLastFrame = touchedNow;
}

// =========================
// PARTICLE EFFECT (pagkalat ng dahon kapag natapakan)
// =========================

const GRASS_PARTICLE_LIFETIME_MS = 500;
const GRASS_PARTICLE_COUNT = 6;
const GRASS_PARTICLE_COLORS = ["#8fd14f", "#5fae2f", "#79c93f"];

let grassParticles = [];

function spawnGrassTouchEffect(col, row) {
  if (typeof playGrassSfx === "function") playGrassSfx();

  const centerX = col * TILE_SIZE + TILE_SIZE / 2;
  const centerY = row * TILE_SIZE + TILE_SIZE * 0.6;

  for (let i = 0; i < GRASS_PARTICLE_COUNT; i++) {
    const angle =
      (Math.PI * 2 * i) / GRASS_PARTICLE_COUNT + Math.random() * 0.6;
    const speed = 0.35 + Math.random() * 0.35;

    grassParticles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      // Palaging may pataas na tulak - "lumilipad" ang dahon, hindi
      // basta kumakalat lang nang patag.
      vy: Math.sin(angle) * speed - 0.55,
      color:
        GRASS_PARTICLE_COLORS[
          Math.floor(Math.random() * GRASS_PARTICLE_COLORS.length)
        ],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      bornAt: performance.now(),
    });
  }

  // Proteksyon laban sa sobrang dami kung paulit-ulit na tumatakbo ang
  // player pasok-labas ng maraming tumpok nang sabay-sabay.
  if (grassParticles.length > 240) {
    grassParticles.splice(0, grassParticles.length - 240);
  }
}

function updateGrassParticles() {
  if (grassParticles.length === 0) return;

  const now = performance.now();

  grassParticles = grassParticles.filter(
    (particle) => now - particle.bornAt < GRASS_PARTICLE_LIFETIME_MS,
  );
}

// World-space na guhit (nasa loob ng camera transform) - tinatawag mula
// sa draw.js pagkatapos ng drawMapObjects, para laging nasa IBABAW ng
// damo/player ang mga lumilipad na dahon.
function drawGrassParticles() {
  if (grassParticles.length === 0) return;

  const now = performance.now();

  ctx.save();

  for (const particle of grassParticles) {
    const age = now - particle.bornAt;
    const progress = age / GRASS_PARTICLE_LIFETIME_MS;

    if (progress >= 1) continue;

    const x = particle.x + particle.vx * age * 0.06;
    const y = particle.y + particle.vy * age * 0.06 + progress * progress * 3; // bahagyang bumabagsak pabalik (gravity)
    const alpha = 1 - progress;
    const rotation = particle.rotation + particle.spin * age * 0.02;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = particle.color;
    ctx.fillRect(-1.6, -0.6, 3.2, 1.2); // munting "dahon" - simpleng patayong parihaba
    ctx.restore();
  }

  ctx.restore();
}

// =========================
// PAGGUHIT NG TUMPOK MISMO
// =========================

// AYOS (hiling ng user, sinunod ang pinakabagong eksaktong bilang):
// "isang tileheight: 25% character overlap, 26%-100% grassoverlap,
// width of tile is 100%" - NALAMAN na (base sa screenshot na sinend ng
// user, halos BUONG damo pa rin ang laging NASA HARAP ng player kahit
// binago na ang sortY threshold) na MALI ang dating paraan: ang
// pag-compare lang ng ISANG sortY value (buong sprite, alinman ang
// mauna sa Y-sort) ay HINDI puwedeng gumawa ng "bahagyang" overlap -
// laging BUONG sprite ang mananalo (alinman ito laging-laging nasa
// harap O laging-laging nasa likod, base sa random na maliit na
// pagkakaiba ng player Y laban sa tile), kaya HINDI kailanman
// natatamo ang "itaas laging harap PERO ibaba naaapakan" na epekto.
//
// TAMANG PARAAN: HATIIN ang MISMONG larawan sa DALAWANG piraso
// (hindi lang basta Y-sort order), gamit ang TILE_SIZE (hindi ang
// buong taas ng sprite mismo, na mas mataas pa sa isang tile) bilang
// basehan ng paghahati:
//   - BOTTOM/BACK na piraso (0%-25% ng ISANG TILE HEIGHT, sinusukat
//     mula sa ANCHOR/ugat pataas) - ang maliit na bahagi malapit sa
//     lupa/ugat ng tanim - ITO ang "naaapakan"/tinatabunan ng
//     character - kaya ITO LANG ang isinasama sa normal na Y-sort
//     (drawables) ng drawMapObjects, na may sortY na LAGING MAS MABABA
//     kaysa sa paanan ng player (tingnan sa ibaba) - LAGING NASA LIKOD
//     ng player.
//   - TOP/FRONT na piraso (26%-100%, ang NATITIRANG BUONG taas ng
//     larawan pataas mula sa 25% na hangganan) - ito ang matataas na
//     dahon - LAGING NASA HARAP ng player, kahit kailan, WALANG Y-sort
//     - hiwalay itong iginuguhit (drawGrassTuftsForeground, tinatawag
//     sa draw.js PAGKATAPOS ng drawMapObjects, kaparehong pattern ng
//     drawTownLampsForeground).
const GRASS_TUFT_TRAMPLE_HEIGHT_RATIO = 0.25;

function computeGrassTuftBendSkew(tuft) {
  const bend = getGrassBendState(tuft.col, tuft.row);

  // Banayad na sway kapag TUWID/idle (hangin) - bahagyang skew na
  // sine wave, iba't ibang phase kada tumpok.
  //
  // AYOS (hiling ng user): dating nag-sso-skew na ang damo SA SANDALING
  // nakatapakan pa ang player (habang "nasa kalagitnaan" siya ng tile)
  // - ngayon, WALANG bend habang TALAGANG nakatapakan pa (getGrassBendState
  // ay nagbabalik ng `null` sa kasong iyon, tingnan sa itaas), kaya
  // PATULOY lang ang normal na idle sway/wave animation habang nasa
  // ibabaw ng damo ang player - SA SANDALING umalis/lumabas na siya sa
  // tile (bend !== null - `state.touching` ay `false` na, tingnan ang
  // updateGrassTuftsTouch) saka lang lalabas ang buong pagyuko: mabilis
  // munang ease-IN papunta sa buong anggulo (GRASS_BEND_SETTLE_MS),
  // tapos unti-unting ease-OUT pabalik sa tuwid (GRASS_BEND_RELEASE_MS)
  // - saka na lang ito babalik/magpapatuloy sa sarili nitong idle
  // sway/wave animation (else branch sa ibaba) kapag TAPOS na ang buong
  // ease-in + ease-out (bend === null na ulit).
  if (bend) {
    const elapsedSinceRelease = performance.now() - bend.releasedAt;

    if (elapsedSinceRelease < GRASS_BEND_SETTLE_MS) {
      // Kaagad-agad na ease-IN papunta sa buong anggulo, SA SANDALING
      // umalis ang player sa tile - ito yung "efekto" ng pagtabig/
      // pagtapak habang siya ay umaalis.
      const settle = elapsedSinceRelease / GRASS_BEND_SETTLE_MS;

      return (bend.dir === "left" ? -0.34 : 0.34) * settle;
    }

    // Pagkatapos ng ease-in, unti-unting ease-OUT na pabalik sa
    // tuwid/nagwawave.
    const release = Math.max(
      0,
      1 -
        (elapsedSinceRelease - GRASS_BEND_SETTLE_MS) / GRASS_BEND_RELEASE_MS,
    );

    return (bend.dir === "left" ? -0.34 : 0.34) * release;
  }

  return Math.sin(performance.now() / 650 + tuft.swayPhase) * 0.06;
}

// AYOS (bug report ng user: "grass1, 2 and 3 still overlapping the
// pine tree which is not [dapat]"): ang naunang ayos (order: -2 sa
// getGrassTuftDrawables sa ibaba) ay TAMA para sa NORMAL na Y-sort
// (drawGrassTuftSpriteWhole/Back) - PERO WALANG epekto ito sa
// drawGrassTuftsForeground(), dahil ang FRONT/TOP na piraso ng isang
// KASALUKUYANG naaapakang tumpok ay laging iginuguhit doon nang
// UNCONDITIONAL, PAGKATAPOS ng buong drawMapObjects (walang Y-sort,
// walang comparison laban sa kahit anong puno) - kaya kung sa TABI/
// LOOB mismo ng canopy ng isang matangkad na puno (pinetree) natatapakan
// ang isang tumpok, ang FRONT piece nito ay LAGING lalabas SA IBABAW ng
// puno, kahit dapat nasa LIKOD ito - ITO ang TALAGANG dahilan kung bakit
// "still overlapping" kahit may order-based fix na. AYOS: bago ituring
// na "currently overlapped" (kaya sasailalim sa back/front split) ang
// isang tumpok, tignan muna kung nasa LOOB ng silhouette/occlusion bbox
// ng kahit anong puno ang BUONG larawan nito (getTreeOcclusionBbox,
// resources.js, PAREHONG bbox na ginagamit para sa puno/player see-
// through occlusion) - kung OO, HUWAG na munang i-split/i-force sa
// harap (drawGrassTuftsForeground), sa halip ay hayaan na lang ang
// NORMAL na Y-sort (drawGrassTuftSpriteWhole, kasama ang order: -2
// tie-break) ang bahalang mag-ayos kung nasa harap o likod ito ng puno
// - tama pa rin ang bend/skew animation at particle effect (hiwalay na
// state ito, hindi naaapektuhan nito).
function isGrassTuftNearOccludingTree(tuft) {
  if (typeof resourceNodesCache === "undefined" || !resourceNodesCache) {
    return false;
  }

  if (
    typeof getTreeOcclusionBbox !== "function" ||
    typeof isColliding !== "function"
  ) {
    return false;
  }

  const geo = computeGrassTuftGeometry(tuft);

  if (!geo) return false;

  const tuftBox = {
    x: geo.anchorX - geo.destWidth / 2,
    y: geo.anchorY - geo.destHeight,
    width: geo.destWidth,
    height: geo.destHeight,
  };

  const treeDestWidthInTiles =
    typeof getActiveTreeDestWidthInTiles === "function"
      ? getActiveTreeDestWidthInTiles()
      : 1;

  return resourceNodesCache.trees.some((tree) =>
    isColliding(tuftBox, getTreeOcclusionBbox(tree, treeDestWidthInTiles)),
  );
}

// Kinukuha ang lahat ng karaniwang sukat (larawan, sukat, posisyon,
// anggulo ng pagyuko) na PAREHONG ginagamit ng back/front na piraso -
// para hindi paulit-ulit ang code, at para PAREHONG-PAREHO (walang
// pagkakalayo/seam) ang dalawang piraso kapag pinagsama.
function computeGrassTuftGeometry(tuft) {
  const path =
    GRASS_TUFT_IDLE_VARIANT_PATHS[tuft.variant % GRASS_TUFT_IDLE_VARIANT_PATHS.length];

  const img = GRASS_TUFT_IMAGES[path];

  if (!img || !img.complete || img.naturalWidth === 0) return null;

  const destWidth = TILE_SIZE * 1.15;
  const destHeight = destWidth * (img.naturalHeight / img.naturalWidth);

  return {
    img,
    destWidth,
    destHeight,
    anchorX: tuft.col * TILE_SIZE + TILE_SIZE / 2,
    anchorY: tuft.row * TILE_SIZE + TILE_SIZE, // ilalim ng tile - "nakatanim" sa lupa
    skew: computeGrassTuftBendSkew(tuft),
    // Hangganan (sa DEST/target space, distansya PAITAAS mula sa
    // anchor) ng "trampled" na piraso sa ibaba - 25% ng ISANG
    // TILE_SIZE (hindi ng buong taas ng larawan).
    trampleBoundary: TILE_SIZE * GRASS_TUFT_TRAMPLE_HEIGHT_RATIO,
  };
}

// =========================
// PAGGUHIT NG TUMPOK MISMO
// =========================
//
// AYOS: dating IISANG drawImage call lang (buong larawan) - ngayon,
// dalawang piraso (tingnan ang paliwanag ng GRASS_TUFT_TRAMPLE_HEIGHT_RATIO
// sa itaas) - PAREHONG gumagamit ng parehong ctx.translate/skew
// transform (para PAREHONG-PAREHO ang anggulo ng pagyuko sa dalawang
// piraso, walang "seam"/pagkaputol sa itsura), pero magkaiba ang
// SOURCE (`sy`/`sHeight`) at DEST (`dy`/`dHeight`) crop ng bawat isa.

// BOTTOM/BACK na piraso - ang maliit na sliver malapit sa ugat/lupa
// (0%-25% ng isang TILE_SIZE, sinusukat mula sa anchor pataas) - ito
// ang "naaapakan" ng character (tingnan ang getGrassTuftDrawables sa
// ibaba kung paano ito laging naka-Y-sort SA LIKOD ng player).
function drawGrassTuftSpriteBack(tuft) {
  const geo = computeGrassTuftGeometry(tuft);

  if (!geo) return;

  const { img, destWidth, destHeight, anchorX, anchorY, skew, trampleBoundary } = geo;

  // Kung mas mataas pa ang hangganan kaysa sa buong larawan (hindi
  // dapat mangyari sa mga kasalukuyang larawan, pero proteksyon lang),
  // ituring na LAHAT ay "back" na piraso.
  const backDestHeight = Math.min(trampleBoundary, destHeight);
  const backSourceHeight = (backDestHeight / destHeight) * img.naturalHeight;
  const sourceY = img.naturalHeight - backSourceHeight;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.drawImage(
    img,
    0,
    sourceY,
    img.naturalWidth,
    backSourceHeight,
    -destWidth / 2,
    -backDestHeight,
    destWidth,
    backDestHeight,
  );
  ctx.restore();
}

// TOP/FRONT na piraso - ang natitirang BUONG taas ng larawan (26%
// pataas) - ang matataas na dahon - LAGING NASA HARAP ng player
// (tingnan ang drawGrassTuftsForeground sa ibaba, tinatawag PAGKATAPOS
// ng drawMapObjects sa draw.js, WALANG Y-sort/dynamic na basehan).
function drawGrassTuftSpriteFront(tuft) {
  const geo = computeGrassTuftGeometry(tuft);

  if (!geo) return;

  const { img, destWidth, destHeight, anchorX, anchorY, skew, trampleBoundary } = geo;

  const backDestHeight = Math.min(trampleBoundary, destHeight);
  const frontDestHeight = destHeight - backDestHeight;

  if (frontDestHeight <= 0) return;

  const frontSourceHeight =
    (frontDestHeight / destHeight) * img.naturalHeight;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.drawImage(
    img,
    0,
    0,
    img.naturalWidth,
    frontSourceHeight,
    -destWidth / 2,
    -destHeight,
    destWidth,
    frontDestHeight,
  );
  ctx.restore();
}

// BUONG larawan (parehong back+front na piraso, PINAGSAMA) - ito ang
// gamit sa NORMAL na Y-sort (kagaya ng puno/bato) PARA SA MGA TUFT na
// HINDI kasalukuyang naaapakan/na-o-overlap ng player (tingnan ang
// paliwanag sa getGrassTuftDrawables sa ibaba) - kaya kapag TALAGANG
// nakalampas/nakalagpas na ang player rito (hindi na ito kasalukuyang
// tile niya), TAMANG Y-sort (base sa buong tile, kapareho ng ibang
// bagay sa mundo) ang mag-aayos kung nasa harap o likod ito ng player,
// hindi na yung "laging harap" na special-case na eksklusibo lang sa
// kasalukuyang kinakatayuan/naaapakan niyang tumpok.
function drawGrassTuftSpriteWhole(tuft) {
  drawGrassTuftSpriteBack(tuft);
  drawGrassTuftSpriteFront(tuft);
}

// Tinatawag ito ng draw.js PAGKATAPOS ng drawMapObjects (kaparehong
// pattern ng drawTownLampsForeground) - dito iginuguhit ang TOP/FRONT
// na piraso, PERO SA MGA TUMPOK LANG na KASALUKUYANG naaapakan/na-o-
// overlap ng player (grassTouchedLastFrame, updateGrassTuftsTouch) -
// AYOS (hiling ng user): "yung mga tapos na o di na naapakan ng
// character is dapat naka overlap na yung character sa damo" - dating
// LAHAT ng tumpok sa buong mundo (kahit malayo na sa player, o
// nalampasan/nadaanan na niya) ay dinadraw dito bilang "laging harap"
// - kaya kahit tapos na siyang dumaan sa isang hanay ng damo (hal.
// nasa itaas na siya ng screenshot), MUKHANG NAKAKATAGO pa rin siya
// sa likod ng dahon nito - MALI, dapat NORMAL na Y-sort (drawGrassTuft
// SpriteWhole sa itaas, sa getGrassTuftDrawables) na ang bahalang
// mag-ayos niyan SA SANDALING hindi na ito ang kasalukuyan niyang
// kinakatayuan/naaapakang tumpok.
function drawGrassTuftsForeground() {
  if (!grassTuftsCache || grassTuftsCache.length === 0) return;

  for (const tuft of grassTuftsCache) {
    if (isGrassTuftHarvested(tuft)) continue;

    const key = tuft.col + "," + tuft.row;

    if (!grassTouchedLastFrame.has(key)) continue;

    // AYOS (tingnan ang paliwanag sa itaas ng isGrassTuftNearOccludingTree):
    // huwag i-force sa harap kung TALAGANG nasa loob ng bbox ng kahit
    // anong puno (hal. pinetree) ang tumpok na ito - hayaan na lang ang
    // NORMAL na Y-sort (getGrassTuftDrawables) ang bahalang mag-ayos.
    if (isGrassTuftNearOccludingTree(tuft)) continue;

    drawGrassTuftSpriteFront(tuft);
  }
}

// Ini-inject natin ang mga ito sa Y-sort na "drawables" ng
// drawMapObjects (map.js) - kaparehong-pareho ng ginagawa ng
// getResourceDrawables (resources.js).
//
// AYOS: ang "split" (BACK/FRONT, tingnan ang GRASS_TUFT_TRAMPLE_
// HEIGHT_RATIO) ay ILALAPAT LANG sa tumpok na KASALUKUYANG naaapakan/
// na-o-overlap ng player (grassTouchedLastFrame) - BACK piece dito sa
// Y-sort (laging likod), FRONT piece sa drawGrassTuftsForeground
// (laging harap). Para naman sa LAHAT ng IBANG tumpok (hindi
// kasalukuyang naaapakan - kasama na ang mga NALAMPASAN/nadaanan na ng
// player), BUONG sprite (drawGrassTuftSpriteWhole) na may NORMAL na
// sortY (buong tile, "+ TILE_SIZE", kapareho ng puno/bato) ang
// gagamitin - kaya TAMANG Y-sort ang mag-aayos kung ito ba ay nasa
// harap o likod ng player, base sa TALAGANG relatibong posisyon nila.
function getGrassTuftDrawables() {
  ensureGrassTufts();

  if (!grassTuftsCache) return [];

  const drawables = [];

  for (const tuft of grassTuftsCache) {
    // AYOS (hiling ng user): "kahit sana meron automatic lang mawawala
    // yung nakaharang na trees or rocks or grass tyaka lang babalik
    // kapag binenta na yung bahay" - PAREHONG "itago" na ginagawa sa
    // puno/bato (resources.js, getResourceDrawables) - hindi na
    // iguguhit ang tumpok ng damo na ito habang natatakpan ng isang
    // custom na bahay (builder.js).
    if (
      typeof isTileCoveredByCustomHouse === "function" &&
      isTileCoveredByCustomHouse(currentWorld, tuft.col, tuft.row)
    ) {
      continue;
    }

    // BAGO (cutter feature): huwag nang iguhit ang na-cut na tumpok
    // (tingnan ang "PAGPUTOL NG DAMO (CUTTER)" sa itaas) - blangko
    // muna ang tile hanggang sa TALAGANG tumubo ulit.
    if (isGrassTuftHarvested(tuft)) continue;

    const key = tuft.col + "," + tuft.row;
    // AYOS (tingnan ang paliwanag sa itaas ng isGrassTuftNearOccludingTree):
    // kahit TALAGANG naaapakan/na-o-overlap ng player ang tumpok na ito,
    // huwag na itong ituring na "currently overlapped" (kaya hindi na
    // masi-split sa back/front, at hindi na i-fo-force sa harap ng
    // drawGrassTuftsForeground) kung nasa loob ng bbox ng kahit anong
    // puno (pinetree, atbp.) ang BUONG larawan nito - dito, ibabalik na
    // lang sa NORMAL na Y-sort (drawGrassTuftSpriteWhole + order: -2)
    // ang buong pagpapasya, para TALAGANG mananalo ang puno sa mismong
    // tie na ito, sa halip na laging "manalo" ang damo dahil lang sa
    // unconditional na foreground draw.
    const isCurrentlyOverlapped =
      grassTouchedLastFrame.has(key) && !isGrassTuftNearOccludingTree(tuft);

    drawables.push({
      sortY: isCurrentlyOverlapped
        ? tuft.row * TILE_SIZE
        : tuft.row * TILE_SIZE + TILE_SIZE,
      // BAGO (bug fix, hiling ng user): "yung grass nag-ooverlap sa
      // trees kapag nadaanan yung tatlong grass dapat hindi" - SANHI:
      // parehong "order: -1" ang ginagamit ng damo AT ng puno/bato
      // (resources.js) - kapag NAGKATAON na MAGKAPAREHO ang sortY nila
      // (parehong tile-row, karaniwan dahil MALAWAK/MALAPAD ang
      // canopy/bbox ng puno - umaabot ito sa kalapit na column kung
      // saan may tumpok ng damo), ang comparator
      // (a.sortY-b.sortY || a.order-b.order) ay NATATALO/nag-i-tie,
      // kaya ang PAGKAKASUNOD-SUNOD NG PAGKAKA-PUSH (damo laging
      // PAGKATAPOS ng puno sa drawables array, tingnan ang map.js) ang
      // nagiging tie-breaker - lumalabas na "nasa HARAP"/nakapatong
      // ang damo sa puno, kahit hindi dapat. AYOS: mas MABABANG order
      // (-2) ang gamit ng damo (hindi -1) - kaya TALAGANG mananalo na
      // lagi ang puno/bato sa mismong tie na ito (mas mataas ang -1
      // kaysa -2), damo ang laging nasa LIKOD kapag pantay ang sortY.
      order: -2,
      // Walang "bbox" (sadya, kagaya ng bato sa resources.js) - mababa
      // lang ang damo, hindi ito dapat nakakatago sa player.
      draw: isCurrentlyOverlapped
        ? () => drawGrassTuftSpriteBack(tuft)
        : () => drawGrassTuftSpriteWhole(tuft),
    });
  }

  return drawables;
}
