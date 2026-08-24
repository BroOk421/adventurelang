// =========================
// PLAYER
// =========================

// Kung saan nagsisimula ang player sa isang bagong laro - dito rin siya
// babalik kapag hindi na magamit ang naka-save na posisyon.
const PLAYER_SPAWN = { x: 368, y: 268 };

// Bilang ng frame ng idle/walk/run/sit animation (oldman art) - dating
// 6, ngayon 8 para mas smooth. Ginagamit ito ng update.js para malaman
// kung kailan mag-loop pabalik ang player.frame sa 0 (tingnan din ang
// OLDMAN_ANIM_FRAME_COUNT sa assets.js - parehong 8, dalawang magkaibang
// bagay lang sila: yung isa doon ay para sa PAGKARGA ng mga frame, ito
// naman dito ay para sa PAG-CYCLE habang tumatakbo ang laro).
const PLAYER_ANIM_FRAME_COUNT = 8;

const player = {
  x: PLAYER_SPAWN.x,
  y: PLAYER_SPAWN.y,

  width: 26,
  height: 34,

  speed: 1,
  // BINAGAAN (dating 2) - hiling ng user, mas kontrolado/hindi
  // sobrang bilis ang takbo.
  runSpeed: 1,

  direction: "down",

  frame: 0,
  frameTimer: 1,
  // Bilis ng pag-cycle ng WALK animation (mas MALIIT na number = mas
  // MABILIS mag-cycle ang frames - ticks kada frame).
  frameSpeed: 4,
  // Bilis ng pag-cycle ng RUN animation - hiwalay ito sa frameSpeed
  // (update.js ang bahalang pumili kung alin ang gagamitin base sa
  // player.running) - dating IISA lang na frameSpeed ang ginagamit
  // kahit tumatakbo, kaya mukhang "nagmamadali"/hindi tugma ang
  // galaw ng binti sa bilis ng katawan sa screen. Proporsyonal ito sa
  // bagong runSpeed/speed ratio (1.7/1.5 ≈ 1.13x) - konting mas
  // mabilis lang ang leg-cycle, hindi biglaan.
  runFrameSpeed: 8,

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
// Anim (8) na HIWALAY na larawan kada direksyon (sprites.pick.down[0..7],
// .up[0..7], .left[0..7], .right[0..7] - oldman art, assets.js), hindi
// isang spritesheet - pinapatugtog PASULONG lang (0 -> 7): yumuyuko
// papunta sa gitna, dinadampot ang bagay, tapos bumabalik sa pagtayo sa
// pagtatapos ng huling frame. May sarili na ring art ang "up"/"down" na
// direksyon ngayon (dati, dalawang set - left/right - lang ang meron,
// kaya doon lang din pinapatong ang up/down; oldman art na apat na
// direksyon).
// 8 na frame na ngayon (dati 6) - mas maraming frame ang oldman pick
// art (assets/player/oldman/pick/), kaya mas smooth ang animation.
const PICK_FRAME_COUNT = 8;
const PICK_FRAME_SPEED = 8; // ticks kada frame - kapareho ng bilis ng paglalakad

// Axe swing (pagputol ng puno gamit ang axe - tingnan ang
// handleAxeClickOnTree sa resources.js) - PAREHONG mekanismo ng "pick"
// (player.putting/puttingFrame), kaya lang ibang sprite set
// (sprites.axeStrike, tingnan ang puttingSpriteSet sa ibaba) - hindi na
// kailangan pa ng ganap na hiwalay na estado/timer.
const AXE_STRIKE_FRAME_COUNT = 6;
const AXE_STRIKE_FRAME_SPEED = 5; // medyo mas mabilis kaysa pick - parang totoong hampas

// Ang axeStrike ay LUMANG (hindi oldman) na art pa rin - pero na-crop
// na rin ito ngayon (per-frame, tinanggal ang patay na espasyo sa
// paligid ng character kada frame - dating malaki ang pagkakaiba ng
// "laki" ng character sa bawat frame, mula 83%-98% ng canvas, ngayon
// pare-pareho na ~96-99%) - kaya HINDI na kailangan ang dating 1.18
// compensation, kapareho na ng laki ng idle/walk kahit walang
// scale-up.
const AXE_STRIKE_SCALE = 1;

// Pickaxe (paghukay ng bato) - oldman art, at rake (paggamit sa lupa) -
// lumang art pa rin - PAREHONG mekanismo ng axe sa itaas, tingnan ang
// startPickaxeStrike/startRakeStrike sa ibaba. Dating "lumiliit"/
// nag-iiba ang laki ng character kada frame ng pickaxe swing (58-93%
// fill ng canvas depende sa frame - malayang bahagi ng frame ang
// tinatamaan ng nakataas/pababang pickaxe) - NAAYOS na ito sa pamamagitan
// ng PER-FRAME na pag-crop ng patay na espasyo (hindi na iisang shared
// crop box para sa buong animation, bawat frame may sariling tight crop
// ngayon) - kaya pare-pareho na ang ~94-96% fill sa LAHAT ng frame,
// scale 1 lang, walang kailangang i-compensate.
// 8 na frame na ngayon (dati 6) - kapareho ng dahilan sa PICK_FRAME_COUNT
// sa itaas, oldman pickaxe art (assets/player/oldman/pickaxe/).
const PICKAXE_STRIKE_FRAME_COUNT = 8;
const PICKAXE_STRIKE_FRAME_SPEED = 5;
const PICKAXE_STRIKE_SCALE = 1;

const RAKE_STRIKE_FRAME_COUNT = 6;
const RAKE_STRIKE_FRAME_SPEED = 5;
const RAKE_STRIKE_SCALE = 1;

const PUNCH_STRIKE_FRAME_COUNT = 6;
const PUNCH_STRIKE_FRAME_SPEED = 5;
const PUNCH_STRIKE_SCALE = 1.18;

// Ang "pick" at "pickaxeStrike" ay mayroon nang APAT na direksyon
// (front/back/left/right - oldman art), kaya ginagamit na diretso ang
// player.direction para dito. Ang "axeStrike"/"rakeStrike"/"punchStrike"
// ay DALAWA lang ang direksyon ng art nila (left/right) - dito pa rin
// natin ini-mirror ang up/down papuntang left/right (tingnan sa ibaba).
const FOUR_DIR_PUTTING_SETS = new Set(["pick", "pickaxeStrike"]);

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

  puttingSpriteDir = FOUR_DIR_PUTTING_SETS.has(spriteSet)
    ? player.direction
    : player.direction === "right" || player.direction === "down"
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
//
// Ang shadowWidth (player.width * 0.9) ay AWTOMATIKONG proportional na
// sa kasalukuyang sukat ng player - kaya kahit pinalaki na ang sprite
// (36x54, dating 16x24), sumasabay pa rin ito. Ang "blur" (piksel ng
// pagkalabo ng gilid) ay HINDI dati automatic - piksel-based/fixed ito
// (3px), kaya kung mananatiling 3px kahit lumaki ang anino, mas
// "matigas"/manipis ang labo kumpara dati (proporsyonal na mas maliit
// na bahagi na ngayon ng mas malaking anino) - dito na natin ito
// isini-scale gamit ang PLAYER_SHADOW_SCALE (batay sa 16px na ORIHINAL
// na lapad) para PAREHONG antas ng "lambot" ng gilid ang makita, kahit
// gaano pa lumaki/liit ang sprite.
const PLAYER_SHADOW_REFERENCE_WIDTH = 10; // orihinal na player.width bago pinalaki

function drawPlayerShadow() {
  const shadowWidth = player.width * 0.9;
  const shadowScale = player.width / PLAYER_SHADOW_REFERENCE_WIDTH;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height - 5;

  if (typeof drawGroundShadow === "function") {
    drawGroundShadow(centerX, centerY, shadowWidth, {
      heightRatio: 0.25,
      blur: 3 * shadowScale,
      alpha: 0.35,
    });

    return;
  }

  // Fallback (lumang paraan, walang blur) - sakaling hindi pa
  // available si drawGroundShadow sa kadahilanang anuman.
  const shadowHeight = shadowWidth * 0.35;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY - shadowHeight / 2,
    shadowWidth / 3,
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

  // Oldman art (idle/walk/run/sit) - HIWALAY na larawan na kada frame
  // (hindi na spritesheet-strip), kaya iba ang paraan ng pagguhit dito
  // kaysa dati: piliin muna ang buong ARRAY ng frames base sa
  // estado (sitting/running/moving/idle) + direksyon, saka kunin ang
  // eksaktong frame gamit ang player.frame.
  //
  // Iisa lang ngayon ang counter (player.frame, 0-7, tingnan ang
  // update.js) na paikot na tumatakbo KAHIT hindi gumagalaw ang
  // player - kaya awtomatikong may banayad na "paghinga"/sway ang
  // idle at sit (bago, dati static/frame-0-lang ang mga ito).
  let frames;

  if (player.sitting) {
    frames = sprites.sit[player.direction];
  } else if (player.moving && player.running) {
    frames = sprites.run[player.direction];
  } else if (player.moving) {
    frames = sprites.walk[player.direction];
  } else {
    frames = sprites.idle[player.direction];
  }

  const frameIndex = player.frame % frames.length;
  const sprite = frames[frameIndex];

  if (!sprite || !sprite.complete || !sprite.width) return;

  ctx.imageSmoothingEnabled = false;

  drawPlayerShadow();

  // Isang buong larawan na ang bawat frame (hindi na hinahati/sinlice) -
  // direktang iginuhit sa buong player box.
  ctx.drawImage(
    sprite,
    0,
    0,
    sprite.width,
    sprite.height,
    player.x,
    player.y,
    player.width,
    player.height,
  );
}
