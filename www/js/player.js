// =========================
// PLAYER
// =========================

// Kung saan nagsisimula ang player sa isang bagong laro - dito rin siya
// babalik kapag hindi na magamit ang naka-save na posisyon.
const PLAYER_SPAWN = { x: 368, y: 268 };

const player = {
  x: PLAYER_SPAWN.x,
  y: PLAYER_SPAWN.y,

  width: 16,
  height: 24,

  speed: 1.5,
  // BINAGAAN (dating 2) - hiling ng user, mas kontrolado/hindi
  // sobrang bilis ang takbo.
  runSpeed: 1.7,

  direction: "down",

  frame: 0,
  frameTimer: 1,
  // Bilis ng pag-cycle ng WALK animation (mas MALIIT na number = mas
  // MABILIS mag-cycle ang frames - ticks kada frame).
  frameSpeed: 5,
  // Bilis ng pag-cycle ng RUN animation - hiwalay ito sa frameSpeed
  // (update.js ang bahalang pumili kung alin ang gagamitin base sa
  // player.running) - dating IISA lang na frameSpeed ang ginagamit
  // kahit tumatakbo, kaya mukhang "nagmamadali"/hindi tugma ang
  // galaw ng binti sa bilis ng katawan sa screen. Proporsyonal ito sa
  // bagong runSpeed/speed ratio (1.7/1.5 ≈ 1.13x) - konting mas
  // mabilis lang ang leg-cycle, hindi biglaan.
  runFrameSpeed: 4,

  moving: false,
  sitting: false,

  // Kapag nagdadampot ng nakalapag na bagay (carrot/wood/stone) - tingnan
  // ang "PUTTING ANIMATION" sa ibaba. Habang totoo ito, hindi gumagalaw
  // ang player, at ibang sprite (assets/player/putting/) ang iginuguhit
  // sa halip na idle/walk/run.
  putting: false,
  puttingFrame: 0,
  puttingTimer: 0,
};

// =========================
// NAKA-SAVE NA POSISYON
// =========================
//
// Itinatabi natin sa localStorage ng browser kung saan huling tumigil
// ang player, para kapag nag-reload ka, dun ka pa rin - hindi na
// bumabalik sa umpisa.

// ".v2" dahil ang mga lumang save ay nakaturo sa village - nang lumipat
// tayo sa bagong starter na mapa, kailangang kalimutan ang mga iyon para
// doon na mag-spawn ang lahat. Kapag pinalitan mo ulit ang default na
// mundo, itaas lang ang bersyon dito.
const PLAYER_SAVE_KEY = "tralala.player.v3";

function loadPlayerPosition() {
  try {
    const raw = localStorage.getItem(PLAYER_SAVE_KEY);

    if (!raw) return null;

    const saved = JSON.parse(raw);

    if (!Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return null;

    return saved;
  } catch (error) {
    // Sirang laman o naka-block ang localStorage - balik na lang sa
    // spawn. Hindi ito dapat makasira ng laro.
    return null;
  }
}

function savePlayerPosition() {
  try {
    localStorage.setItem(
      PLAYER_SAVE_KEY,
      JSON.stringify({
        x: player.x,
        y: player.y,
        world: currentWorld,
        direction: player.direction,
        sitting: player.sitting,
      }),
    );
  } catch (error) {
    // Puwedeng naka-block ang localStorage (hal. private browsing).
    // Hindi kritikal - tuloy lang ang laro, wala lang matatandaan.
  }
}

// Tinatawag ito pagkatapos ma-load ang mapa. Puwedeng nabago mo na ang
// mapa sa Tiled mula nang ma-save ang posisyon - hal. may bagong puno o
// bakod na sa dating kinatatayuan mo, o lumiit ang mapa. Kapag ganoon,
// nakabaon na siya sa harang o nasa labas na ng mapa, kaya ibabalik
// natin siya sa spawn.
function validatePlayerPosition() {
  const mapWidth = mapData.width * mapData.tilewidth;
  const mapHeight = mapData.height * mapData.tileheight;

  const insideMap =
    player.x >= 0 &&
    player.y >= 0 &&
    player.x <= mapWidth - player.width &&
    player.y <= mapHeight - player.height;

  if (insideMap && canMoveTo(player.x, player.y)) return;

  console.log("Spawn Point");

  const world = getWorld();
  const spawn = world ? world.spawn : PLAYER_SPAWN;

  player.x = spawn.x;
  player.y = spawn.y;
}

const savedPlayer = loadPlayerPosition();

if (savedPlayer) {
  player.x = savedPlayer.x;
  player.y = savedPlayer.y;
  player.direction = savedPlayer.direction || player.direction;
  player.sitting = Boolean(savedPlayer.sitting);
}

// Huling pagkakataon para masagip ang eksaktong posisyon bago isara o
// i-reload ang page. Mas maaasahan ang "pagehide" kaysa "beforeunload",
// lalo na sa mobile.
window.addEventListener("pagehide", savePlayerPosition);

// =========================
// PICK ANIMATION (pagdampot ng bagay)
// =========================
//
// Kapag nag-click ng kamay sa isang nakalapag na item (carrot/wood/
// stone): hindi na agad ito napupunta sa bag - unang gumaganap ang
// player ng "pick" na animation (assets/player/pick/), umaabot sa
// HULING frame, saka lang talagang natatanggal ang item at
// naidaragdag sa bag (tingnan ang startPutting, tinatawag mula sa
// dig.js/handleHandClick).
//
// Anim (6) na HIWALAY na larawan kada direksyon (sprites.pick.left[0..5],
// sprites.pick.right[0..5] - assets.js), hindi isang spritesheet -
// pinapatugtog PASULONG lang (0 -> 5) para sa magkabila: yumuyuko papunta
// sa gitna, dinadampot ang bagay, tapos bumabalik sa pagtayo sa
// pagtatapos ng frame 5. Ginagamit din ang parehong dalawang set para sa
// "up"/"down" na direksyon (walang hiwalay na asset ang mga iyon).
const PICK_FRAME_COUNT = 6;
const PICK_FRAME_SPEED = 8; // ticks kada frame - kapareho ng bilis ng paglalakad

// Axe swing (pagputol ng puno gamit ang axe - tingnan ang
// handleAxeClickOnTree sa resources.js) - PAREHONG mekanismo ng "pick"
// (player.putting/puttingFrame), kaya lang ibang sprite set
// (sprites.axeStrike, tingnan ang puttingSpriteSet sa ibaba) - hindi na
// kailangan pa ng ganap na hiwalay na estado/timer.
const AXE_STRIKE_FRAME_COUNT = 6;
const AXE_STRIKE_FRAME_SPEED = 5; // medyo mas mabilis kaysa pick - parang totoong hampas

// Medyo mas MALIIT ang guhit ng character sa loob ng axeStrike frames
// kumpara sa idle/walk (parehong laki ng canvas, 159x271, pero mas
// maliit ang katawan sa loob nito - may sapat na espasyo iwan para sa
// nakataas na axe) - kaya kapag pinasok ito sa parehong destination box
// (player.width/height) kaysa ibang animation, MUKHANG lumiliit ang
// buong character. Dito na lang natin ito "kino-compensate" sa pamamagitan
// ng PAGLAKI ng destination box (tingnan ang drawPlayer) - baguhin lang
// itong SCALE kung kailangan pang i-fine-tune (>1 = mas malaki,
// nakaanchor pa rin sa parehong paanan/gitna kaya hindi ito lumilipat).
const AXE_STRIKE_SCALE = 1.18;

// Pickaxe (paghukay ng bato), rake (paggamit sa lupa), at punch (kamao,
// walang naka-equip na tool) - PAREHONG mekanismo ng axe sa itaas, tingnan
// ang startPickaxeStrike/startRakeStrike/startPunchStrike sa ibaba. Sinuri
// (pixel bounding-box, kaparehong paraan ng ginamit sa AXE_STRIKE_SCALE)
// kung gaano kalaki ang katawan ng character sa loob ng bawat frame kumpara
// sa idle: normal/hindi lumiliit ang pickaxe/rake (halos parehong sukat/
// posisyon ng paanan) - scale 1 lang, walang kailangang i-compensate. Ang
// punch lang ang lumiliit (kaparehong antas ng shrink ng axe), kaya
// PUNCH_STRIKE_SCALE lang ang tumanggap ng parehong pagpapalaki.
const PICKAXE_STRIKE_FRAME_COUNT = 6;
const PICKAXE_STRIKE_FRAME_SPEED = 5;
const PICKAXE_STRIKE_SCALE = 1;

const RAKE_STRIKE_FRAME_COUNT = 6;
const RAKE_STRIKE_FRAME_SPEED = 5;
const RAKE_STRIKE_SCALE = 1;

const PUNCH_STRIKE_FRAME_COUNT = 6;
const PUNCH_STRIKE_FRAME_SPEED = 5;
const PUNCH_STRIKE_SCALE = 1.18;

let puttingSpriteDir = "left";
let puttingSpriteSet = "pick"; // "pick" o "axeStrike" - tingnan ang drawPlayer
let puttingFrameCount = PICK_FRAME_COUNT;
let puttingFrameSpeed = PICK_FRAME_SPEED;
let puttingScale = 1;
let puttingCallback = null;

// Karaniwang setup (direksyon batay sa target tile, saka simulan ang
// animation loop) - ginagamit ng PAREHONG startPutting (pagdampot) at
// startAxeStrike (paghampas ng axe) sa ibaba, magkaiba lang ang sprite
// set/bilis/frame count/scale.
function beginPuttingAnimation(
  col,
  row,
  spriteSet,
  frameCount,
  frameSpeed,
  scale,
  onComplete,
) {
  const box = getPlayerCollisionBox();
  const deltaX = col * TILE_SIZE + TILE_SIZE / 2 - (box.x + box.width / 2);
  const deltaY = row * TILE_SIZE + TILE_SIZE / 2 - (box.y + box.height / 2);

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    player.direction = deltaX > 0 ? "right" : "left";
  } else {
    player.direction = deltaY > 0 ? "down" : "up";
  }

  puttingSpriteDir =
    player.direction === "right" || player.direction === "down"
      ? "right"
      : "left";
  puttingSpriteSet = spriteSet;
  puttingFrameCount = frameCount;
  puttingFrameSpeed = frameSpeed;
  puttingScale = scale;
  puttingCallback = onComplete;

  player.putting = true;
  player.moving = false;
  player.puttingFrame = 0;
  player.puttingTimer = 0;
}

// col/row: kung saang tile nakatutok ang player (parang getPlayerFacingTile,
// pero galing sa lokasyon mismo ng item, hindi sa direksyon). onComplete:
// tinatawag sa sandaling maabot ang huling frame ng animation - dito
// dapat talagang idinaragdag ang item sa bag.
function startPutting(col, row, onComplete) {
  if (typeof playPutSfx === "function") playPutSfx();

  beginPuttingAnimation(
    col,
    row,
    "pick",
    PICK_FRAME_COUNT,
    PICK_FRAME_SPEED,
    1,
    onComplete,
  );
}

// Tinatawag mula sa handleAxeClickOnTree (resources.js) tuwing may
// aktwal na tinamaan na puno gamit ang axe - GUIDE/COSMETIC na
// animation LANG ito (naaplay na agad ang hit/damage bago pa man ito
// tawagin, tingnan ang registerHit) - kaya walang onComplete/callback
// na kailangan para sa NORMAL na puno.
//
// "onComplete" - OPTIONAL (default null/wala). Idinagdag ito para sa
// OAK (decor.js): doon, HINDI agad umaalog ang puno sa sandaling
// ma-click - inaantay muna ang PAGTAPOS ng buong swing animation na ito
// bago talaga i-trigger ang shake, tingnan ang handleAxeClickOnOak sa
// decor.js.
function startAxeStrike(col, row, onComplete = null) {
  if (typeof playCutWoodSfx === "function") playCutWoodSfx();

  beginPuttingAnimation(
    col,
    row,
    "axeStrike",
    AXE_STRIKE_FRAME_COUNT,
    AXE_STRIKE_FRAME_SPEED,
    AXE_STRIKE_SCALE,
    onComplete,
  );
}

// Tinatawag mula sa handlePickaxeClickOnStone (resources.js) tuwing may
// aktwal na tinamaan na bato gamit ang pickaxe - kaparehong-pareho ng
// startAxeStrike sa itaas.
function startPickaxeStrike(col, row) {
  if (typeof playPickaxeSfx === "function") playPickaxeSfx();

  beginPuttingAnimation(
    col,
    row,
    "pickaxeStrike",
    PICKAXE_STRIKE_FRAME_COUNT,
    PICKAXE_STRIKE_FRAME_SPEED,
    PICKAXE_STRIKE_SCALE,
    null,
  );
}

// Tinatawag mula sa mousedown listener ng dig.js tuwing may aktwal na
// ginawang rake action (pagbungkal ng lupa o pagsira ng hindi pa hinog
// na tanim).
function startRakeStrike(col, row) {
  if (typeof playRakeSfx === "function") playRakeSfx();

  beginPuttingAnimation(
    col,
    row,
    "rakeStrike",
    RAKE_STRIKE_FRAME_COUNT,
    RAKE_STRIKE_FRAME_SPEED,
    RAKE_STRIKE_SCALE,
    null,
  );
}

// Tinatawag mula sa resources.js tuwing may aktwal na tinamaan na
// puno/bato GAMIT ANG KAMAO (walang naka-equip na axe/pickaxe).
//
// "onComplete" - OPTIONAL, gaya ng sa startAxeStrike sa itaas - ginagamit
// din para sa OAK kapag kamao ang gamit dito (decor.js).
function startPunchStrike(col, row, onComplete = null) {
  if (typeof playPunchSfx === "function") playPunchSfx();

  beginPuttingAnimation(
    col,
    row,
    "punchStrike",
    PUNCH_STRIKE_FRAME_COUNT,
    PUNCH_STRIKE_FRAME_SPEED,
    PUNCH_STRIKE_SCALE,
    onComplete,
  );
}

function finishPutting() {
  player.putting = false;

  const callback = puttingCallback;

  puttingCallback = null;

  if (callback) callback();
}

// Tinatawag kada frame mula sa update.js. Umaandar lang kapag totoo
// ang player.putting.
function updatePlayerPutting() {
  if (!player.putting) return;

  player.puttingTimer++;

  if (player.puttingTimer < puttingFrameSpeed) return;

  player.puttingTimer = 0;

  // Naabot na ang huling frame kanina pa (naipakita na ito nang isang
  // buong puttingFrameSpeed) - ngayon na talaga natin tatapusin.
  if (player.puttingFrame === puttingFrameCount - 1) {
    finishPutting();
    return;
  }

  player.puttingFrame++;
}

// Simpleng shadow sa ilalim ng paanan ng player - oval, malabo/blur
// ang gilid (parang "malambot" na anino), para may pakiramdam ng
// "lupa" sa ibaba ng sprite. Iginuguhit ito BAGO ang sprite mismo,
// kaya laging nasa ilalim/likod ng player.
//
// Gumagamit na ito ng SHARED na `drawGroundShadow()` (decor.js,
// naglo-load PAGKATAPOS ng file na ito - pero OK lang, runtime call
// lang ito, hindi parse-time, kaya available na ito sa oras na
// talagang tumakbo ang laro) - kaparehong hugis-oval/blur na ngayon
// ang gamit ng oldman/pig, para magkatugma ang "materyal"/istilo ng
// lahat ng anino sa laro. May `typeof` guard + lumang fallback kung
// sakaling hindi pa (o hindi) available ito.
function drawPlayerShadow() {
  const shadowWidth = player.width * 0.9;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height;

  if (typeof drawGroundShadow === "function") {
    drawGroundShadow(centerX, centerY, shadowWidth, {
      heightRatio: 0.25,
      blur: 3,
      alpha: 0.35,
    });

    return;
  }

  // Fallback (lumang paraan, walang blur) - sakaling hindi pa
  // available si drawGroundShadow sa kadahilanang anuman.
  const shadowHeight = shadowWidth * 0.25;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY - shadowHeight / 2,
    shadowWidth / 2,
    shadowHeight / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  // Ang "pick"/"axeStrike" na animation ay hiwa-hiwalay na larawan kada
  // frame (hindi spritesheet) - iba ang paraan ng pagguhit nito kaysa
  // sa ibang sprite sa ibaba (na parehong iisang strip na hinahati sa
  // frame). Totoong Left/Right na art na ang axeStrike (assets/player/
  // axe/left, assets/player/axe/right) - hindi na kailangan pang
  // i-mirror/flip.
  if (player.putting) {
    const sprite =
      sprites[puttingSpriteSet][puttingSpriteDir][player.puttingFrame];

    if (!sprite.complete || !sprite.width) return;

    ctx.imageSmoothingEnabled = false;

    drawPlayerShadow();

    // "puttingScale" (kadalasan 1, tingnan ang AXE_STRIKE_SCALE) -
    // pinapalaki ang destination box PERO naka-anchor pa rin sa PAREHONG
    // paanan/gitna ng normal na player box, kaya kahit lumaki, hindi ito
    // "lumilipat"/gumagalaw sa mundo, para lang lumaki ang guhit.
    const destWidth = player.width * puttingScale;
    const destHeight = player.height * puttingScale;
    const destX = player.x - (destWidth - player.width) / 2;
    const destY = player.y + player.height - destHeight;

    ctx.drawImage(sprite, destX, destY, destWidth, destHeight);

    return;
  }

  let sprite;
  let frameCount = 6;
  let frameIndex = 0;

  if (player.sitting) {
    sprite = sprites.sit;
  } else if (player.moving && player.running) {
    sprite = sprites.run[player.direction];
    // Umiikot lang ang animation frame (0-5) kapag talagang naglalakad.
    // Kapag naka-idle o naka-sit, laging unang frame (0) lang ang gamit,
    // para hindi "nanginginig"/nagbabago-bago ang pose kahit di gumagalaw.
    frameIndex = player.frame;
  } else if (player.moving) {
    sprite = sprites.walk[player.direction];
    frameIndex = player.frame;
  } else {
    sprite = sprites.idle[player.direction];
  }

  if (!sprite.complete || !sprite.width) return;

  const frameWidth = sprite.width / frameCount;
  const frameHeight = sprite.height;

  ctx.imageSmoothingEnabled = false;

  drawPlayerShadow();

  ctx.drawImage(
    sprite,
    frameIndex * frameWidth,
    0,
    frameWidth,
    frameHeight,
    player.x,
    player.y,
    player.width,
    player.height,
  );
}
