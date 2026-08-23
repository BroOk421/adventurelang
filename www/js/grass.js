// =========================
// MGA DAMONG TUFT (grassleft/grassright/grass - dekorasyong sagwan sa
// tabi ng puno/bato)
// =========================
//
// Random na naglalagay ng maliliit na tumpok ng damo kada outdoor na
// mundo - KAPAREHONG PATTERN ng puno/bato (resources.js): seeded random
// batay sa pangalan ng mundo (pareho palagi kahit mag-reload), walang
// collision box (puwedeng patawirin/tapakan ng player - hindi tulad ng
// puno/bato), at Y-sort din sila laban sa player.
//
// Dalawang bagay ang "epekto" kapag TALAGANG NATAPAKAN/nadaanan ng
// player ang isang tumpok:
//   1. Yumuyuko/humihilig ito papunta sa direksyon ng paglakad ng
//      player (grassleft.png kapag papakaliwa, grassright.png kapag
//      papakanan) - bumabalik sa normal (grass.png, tuwid) pagkalipas
//      ng saglit kapag umalis na ang player doon.
//   2. May maliit na "pagkalat ng dahon" na particle effect - saglit
//      lang, lumilipad papaitaas/palabas at unti-unting nawawala.
//
// Habang WALANG nakatapak dito, may banayad na "hangin" na sway
// animation (bahagyang paghilig paulit-ulit, sine wave) - hindi ito
// totoong frame-by-frame na animation (walang malinaw na hiwalay na
// frame boundary sa loob ng larawan), kaya sa halip, ginagamit ang
// canvas transform (skew) para sa banayad na paggalaw.

const GRASS_TUFT_COUNT_PER_WORLD = 500;

// Bawat larawan (grass.png/grassleft.png/grassright.png/snowgrassleft/
// snowgrassright.png) ay isang PAHALANG na "strip" na naglalaman ng 6
// magkakaibang hugis ng tumpok ng damo (hindi animation frame - iba't
// ibang DISENYO lang, kagaya ng variant 0/1 ng ROCK_VARIANT_PATHS sa
// resources.js, pero 6 dito sa halip na 2) - random kung alin sa 6 ang
// gagamitin kada tumpok, itinatabi lang minsan (variant) kaya hindi ito
// nagpapalit-palit kada frame.
const GRASS_TUFT_VARIANT_COUNT = 6;

const GRASS_TUFT_PATHS = {
  normal: "./assets/objects/grass/grass.png",
  left: "./assets/objects/grass/grassleft.png",
  right: "./assets/objects/grass/grassright.png",
  snowLeft: "./assets/objects/grass/snowgrassleft.png",
  snowRight: "./assets/objects/grass/snowgrassright.png",
};

const GRASS_TUFT_IMAGES = {};

for (const path of Object.values(GRASS_TUFT_PATHS)) {
  const img = new Image();

  img.src = path;
  GRASS_TUFT_IMAGES[path] = img;
}

let grassTuftsCache = null;
let grassTuftsValidatedFor = null;

// =========================
// PAGGAWA NG MGA POSISYON (seeded, isang beses kada mundo)
// =========================

function generateGrassTufts() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  if (!mapReady || !mapData || !world || !world.outdoor || world.noGrassTufts)
    return [];

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

    if (collisions.some((box) => isColliding(tileBox, box))) return false;

    for (const door of DOORS) {
      if (door.world === currentWorld && isColliding(tileBox, door.area)) {
        return false;
      }
    }

    return true;
  }

  const tufts = [];
  let attempt = 0;

  while (tufts.length < GRASS_TUFT_COUNT_PER_WORLD && attempt < 800) {
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
// malaman kung "kakapasok lang" (bagong overlap) ang isang tumpok, para
// isang beses lang sumabog ang particle effect kada pagpasok (hindi
// paulit-ulit habang nakatayo lang doon), AT para malaman kung sino ang
// UMALIS na ngayong frame lang (para simulan ang ease-out).
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
  if (state.touching) return state;

  // Hindi na nakatapak - kung TALAGANG lampas na sa buong ease-out na
  // oras, tuwid na siya ulit (idle) - "wala" na itong dapat gawin.
  if (
    state.releasedAt !== null &&
    performance.now() - state.releasedAt < GRASS_BEND_RELEASE_MS
  ) {
    return state;
  }

  return null;
}

// Tinatawag kada frame mula sa update() - chinicheck kung anong mga
// tumpok ang na-o-overlap ng paanan ng player NGAYON, tapos ino-
// update ang direksyon ng pagyuko + tinitignan kung "bagong pasok"
// (para sa particle effect).
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

  const touchedNow = new Set();

  for (const tuft of grassTuftsCache) {
    const tileBox = {
      x: tuft.col * TILE_SIZE,
      y: tuft.row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    if (!isColliding(playerBox, tileBox)) continue;

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

    // Bagong pasok lang (hindi pa nakatapak dito noong nakaraang
    // frame) - saka lang sasabog ang dahon.
    if (!grassTouchedLastFrame.has(key)) {
      spawnGrassTouchEffect(tuft.col, tuft.row);
    }
  }

  // Mga tumpok na nakatapakan noong nakaraang frame PERO hindi na
  // ngayon - dito lang sinisimulan ang ease-out pabalik sa tuwid.
  for (const key of grassTouchedLastFrame) {
    if (touchedNow.has(key)) continue;

    const state = grassBendState[key];

    if (state) {
      state.touching = false;
      state.releasedAt = performance.now();
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

function getGrassTuftSourceRect(img, variant) {
  const frameWidth = img.naturalWidth / GRASS_TUFT_VARIANT_COUNT;

  return {
    sx: frameWidth * variant,
    sy: 0,
    sWidth: frameWidth,
    sHeight: img.naturalHeight,
  };
}

function drawGrassTuftSprite(tuft) {
  const bend = getGrassBendState(tuft.col, tuft.row);
  const snowy = typeof isSnowWeather === "function" && isSnowWeather();

  let path;

  if (bend) {
    path =
      bend.dir === "left"
        ? snowy
          ? GRASS_TUFT_PATHS.snowLeft
          : GRASS_TUFT_PATHS.left
        : snowy
          ? GRASS_TUFT_PATHS.snowRight
          : GRASS_TUFT_PATHS.right;
  } else {
    // Walang dedikadong "tuwid/idle" na larawan para sa snow (2
    // bersyon lang ang meron - left/right) - kaya kapag idle at
    // umuulan ng niyebe, gamitin na lang ang left/right base sa
    // "variant" (fixed kada tumpok, hindi nagpapalit-palit) - may
    // pagkakaiba-iba pa rin sa hitsura ng bawat isa sa halip na
    // paulit-ulit na iisang tuwid na larawan.
    if (snowy) {
      path =
        tuft.variant % 2 === 0
          ? GRASS_TUFT_PATHS.snowLeft
          : GRASS_TUFT_PATHS.snowRight;
    } else {
      path = GRASS_TUFT_PATHS.normal;
    }
  }

  const img = GRASS_TUFT_IMAGES[path];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const source = getGrassTuftSourceRect(img, tuft.variant);
  const destWidth = TILE_SIZE * 1.15;
  const destHeight = destWidth * (source.sHeight / source.sWidth);

  const anchorX = tuft.col * TILE_SIZE + TILE_SIZE / 2;
  const anchorY = tuft.row * TILE_SIZE + TILE_SIZE; // ilalim ng tile - "nakatanim" sa lupa

  // Banayad na sway kapag TUWID/idle (hangin) - bahagyang skew na
  // sine wave, iba't ibang phase kada tumpok. Kapag NAKAYUKO (bend),
  // WALA nang idle sway na hinahalo (dating dahilan ng "nginig" habang
  // nakatapakan) - malinaw/stable na lang ang anggulo ng pagyuko,
  // parang talagang tinatabig/nakatapakan ito ng player.
  let skew;

  if (bend) {
    if (bend.touching) {
      // Mabilis na ease-IN papunta sa buong anggulo - TUMATAKBO LANG
      // ISANG BESES (batay sa `enteredAt`, hindi na-re-reset kada
      // frame habang patuloy na nakatapak), kaya STABLE na ang anggulo
      // pagkatapos ng maikling settle na ito.
      const settle = Math.min(
        1,
        (performance.now() - bend.enteredAt) / GRASS_BEND_SETTLE_MS,
      );

      skew = (bend.dir === "left" ? -0.34 : 0.34) * settle;
    } else {
      // Umalis na ang player - unti-unting bumabalik sa tuwid.
      const release = Math.max(
        0,
        1 - (performance.now() - bend.releasedAt) / GRASS_BEND_RELEASE_MS,
      );

      skew = (bend.dir === "left" ? -0.34 : 0.34) * release;
    }
  } else {
    skew = Math.sin(performance.now() / 650 + tuft.swayPhase) * 0.06;
  }

  ctx.save();
  ctx.translate(anchorX, anchorY);
  // Ang "c" (index 2) ng transform ang gumagawa ng pahalang na skew
  // batay sa taas (parang yumuyuko mula sa ugat, hindi buong tumpok
  // basta lumilipat pakaliwa/pakanan).
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sWidth,
    source.sHeight,
    -destWidth / 2,
    -destHeight,
    destWidth,
    destHeight,
  );
  ctx.restore();
}

// Ini-inject natin ang mga ito sa Y-sort na "drawables" ng
// drawMapObjects (map.js) - kaparehong-pareho ng ginagawa ng
// getResourceDrawables (resources.js).
function getGrassTuftDrawables() {
  ensureGrassTufts();

  if (!grassTuftsCache) return [];

  const drawables = [];

  for (const tuft of grassTuftsCache) {
    drawables.push({
      sortY: tuft.row * TILE_SIZE + TILE_SIZE,
      order: -1,
      // Walang "bbox" (sadya, kagaya ng bato sa resources.js) - mababa
      // lang ang damo, hindi ito dapat nakakatago sa player.
      draw: () => drawGrassTuftSprite(tuft),
    });
  }

  return drawables;
}
