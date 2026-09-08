// =========================
// PLAYER
// =========================

// Kung saan nagsisimula ang player sa isang bagong laro - dito rin siya
// babalik kapag hindi na magamit ang naka-save na posisyon.
const PLAYER_SPAWN = { x: 368, y: 268 };

// AUTO-GENERATED helper (crop dead-space tool) - kinukuha ang crop info
// mula sa SPRITE_CROP (js/sprite-crop.js) at ini-apply sa isang
// destination box (baseX/baseY/baseW/baseH) PARA MANATILING EXACTLY
// KAPAREHONG sukat/posisyon sa screen kahit na-crop na ang dead space
// sa PNG file mismo. Kung walang entry (hal. bagong sprite na hindi pa
// na-crop), ibinabalik na lang ang orihinal na box (walang epekto).
function getSpriteCropDestRect(cropKey, baseX, baseY, baseW, baseH) {
  const c =
    typeof SPRITE_CROP !== "undefined" ? SPRITE_CROP[cropKey] : null;
  if (!c) return [baseX, baseY, baseW, baseH];

  return [
    baseX + c.offsetXFrac * baseW,
    baseY + c.offsetYFrac * baseH,
    c.scaleXFrac * baseW,
    c.scaleYFrac * baseH,
  ];
}

const player = {
  x: PLAYER_SPAWN.x,
  y: PLAYER_SPAWN.y,

  width: 56,
  height: 64,

  speed: 0.8,
  // BINAGAAN (dating 2) - hiling ng user, mas kontrolado/hindi
  // sobrang bilis ang takbo.
  runSpeed: 1.1,

  direction: "down",

  frame: 0,
  frameTimer: 1,
  // Bilis ng pag-cycle ng WALK animation (mas MALIIT na number = mas
  // MABILIS mag-cycle ang frames - ticks kada frame).
  frameSpeed: 3,
  // Bilis ng pag-cycle ng RUN animation - hiwalay ito sa frameSpeed
  // (update.js ang bahalang pumili kung alin ang gagamitin base sa
  // player.running) - dating IISA lang na frameSpeed ang ginagamit
  // kahit tumatakbo, kaya mukhang "nagmamadali"/hindi tugma ang
  // galaw ng binti sa bilis ng katawan sa screen. Proporsyonal ito sa
  // bagong runSpeed/speed ratio (1.7/1.5 ≈ 1.13x) - konting mas
  // mabilis lang ang leg-cycle, hindi biglaan.
  runFrameSpeed: 2,

  moving: false,

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

// BAGO (hiling ng user: "ayoko na ng auto save kapag pindutin ko yung
// save sa settings dun lang mag save") - lahat ng save function sa buong
// laro (hindi lang ito) ay may bagong "force" na parameter, default
// FALSE - kapag FALSE (ibig sabihin, hindi ito galing sa opisyal na
// "I-save" button sa settings menu), NO-OP na lang ito (walang
// isinusulat sa localStorage). Ang DATING mga tawag dito sa buong
// codebase (walang argumento, hal. sa loob ng update.js/map.js) ay
// AWTOMATIKONG naging "wala nang epekto" na lang sa ganitong paraan -
// hindi na kailangang galawin isa-isa ang bawat lugar na tumatawag dito.
// Ang TANGING lugar na dapat gumamit ng `force = true` ay ang
// saveAllGameState() (settings-menu.js), na siyang tinatawag mismo ng
// "I-save" button.
function savePlayerPosition(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(
      PLAYER_SAVE_KEY,
      JSON.stringify({
        x: player.x,
        y: player.y,
        world: currentWorld,
        direction: player.direction,
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
}

// BUG FIX (hiling ng user: "yung sa load i parang di gumagana or dahil
// may bug na auto save parin" - VERIFIED: eksaktong ito ang sanhi) -
// dating "window.addEventListener('pagehide', savePlayerPosition);" -
// MALAKING BUG ito: kapag pinapasa ang isang function DIREKTA bilang
// event listener, ang UNANG argumento na natatanggap nito sa TALAGANG
// pagkatawag ay ang Event OBJECT mismo (hindi undefined/wala) - at dahil
// TOTOO/truthy ang KAHIT ANONG object sa JavaScript, ang "force"
// parameter ni savePlayerPosition (na dapat "false" bilang default,
// tingnan ang function definition sa itaas) ay NAGIGING itong Event
// object sa halip - kaya ang "if (!force) return;" na guard doon ay
// HINDI TALAGA nagiging epektibo dito (`!eventObject` ay laging false),
// at NAGSA-SAVE PA RIN nang buo tuwing mag-uunload ang page (kasama na
// ang `location.reload()` - ginagamit mismo ng bagong "I-load" popup
// sa settings-menu.js!). Ito ang eksaktong dahilan ng na-report na bug:
// "nag-save ako, lumayo ako, pag-Load ay nasa lumayo pa ring posisyon" -
// sa sandaling mag-reload() ang "I-load", nag-fire muna ang "pagehide"
// dito sa LUMANG (di pa na-reload) page, na siyang nag-OVERWRITE sa
// KASALUKUYANG (unsaved) posisyon PAGKATAPOS isulat ng loadGameFromSlot
// ang TAMANG naka-save na posisyon - kaya laging "nananalo" ang
// unsaved/current na posisyon sa halip na ang na-load na save. AYOS:
// TINANGGAL na ang buong listener na ito - "Save" button na LANG (sa
// settings menu) ang nag-iisang paraan para talagang mai-save,
// kaagad ng disenyo ng buong "force" na sistema (tingnan ang
// savePlayerPosition sa itaas).

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
// BAGO: 7 frame na ngayon (dating 6) - kaparehong bilang ng frame ng
// idle/walk na art (assets/character/...), dahil dito rin galing ang
// bagong 4-direksyon na axe strip (assets/character/axe/).
const AXE_STRIKE_FRAME_COUNT = 7;
// AYOS (hiling ng user: "bilisan medyo yung pag animate ng paggamit ng
// axe/pickaxe/rake") - dating 5, ngayon 3 (mas mabilis mag-cycle ang
// bawat frame) - parang mas mabilis/malakas na hampas.
const AXE_STRIKE_FRAME_SPEED = 3;

// BAGO (hiling ng user: "minimize size like idle or walk"): 1 na lang
// ang scale (dating 1.18) - LEFTOVER na comment/pagsasaayos ito mula sa
// LUMANG axe art (bago pa napalitan ng bagong 4-direksyon na
// assets/character/axe/ - tingnan ang Entry sa CLAUDE.md tungkol sa
// axe animation swap) na mas MALIIT ang guhit ng katawan sa loob ng
// frame nito kumpara sa idle/walk. Ang BAGONG axe art ay MULA sa
// PAREHONG "character" na pamilya ng asset (parehong sukat/proporsyon
// ng katawan gaya ng idle/walk), kaya HINDI na kailangan ang dating
// 1.18x na "compensation" - sa halip, MAS MALAKI/hindi tugma ang
// lumalabas na guhit ng character habang humahampas. Ngayon, kapareho
// na ng normal na idle/walk (scale 1) ang laki habang gumagamit ng axe.
const AXE_STRIKE_SCALE = 1;

// Pickaxe (paghukay ng bato), rake (paggamit sa lupa) - PAREHONG
// mekanismo ng axe sa itaas, tingnan ang startPickaxeStrike/
// startRakeStrike sa ibaba. Sinuri (pixel bounding-box, kaparehong
// paraan ng ginamit sa AXE_STRIKE_SCALE) kung gaano kalaki ang katawan
// ng character sa loob ng bawat frame kumpara sa idle: normal/hindi
// lumiliit ang pickaxe/rake (halos parehong sukat/posisyon ng paanan) -
// scale 1 lang, walang kailangang i-compensate.
// BAGO: 7 frame na ngayon (dating 6) - kaparehong bilang ng frame ng
// bagong 4-direksyon na pickaxe strip (assets/character/pickaxe/),
// kaparehong-pareho ng AXE_STRIKE_FRAME_COUNT sa itaas.
const PICKAXE_STRIKE_FRAME_COUNT = 7;
// AYOS (hiling ng user): bahagyang bilisan din - dating 5.
const PICKAXE_STRIKE_FRAME_SPEED = 3;
const PICKAXE_STRIKE_SCALE = 1;

// BAGO (hiling ng user: "palitan ang animation ng rake to character
// pickaxe" - wala pa kasing tunay na rake art, kaya sa halip na yung
// LUMANG 2-direksyon na "rake" na larawan (assets/player/rake/), ang
// GAGAMITIN na ng rake ngayon ay ang MISMONG bagong 4-direksyon na
// PICKAXE strip (assets/character/pickaxe/) - tingnan ang
// "sprites.rakeStrike = sprites.pickaxeStrike" sa assets.js. Kaya
// KAPAREHONG-PAREHO na rin ngayon ang frame count/speed/scale nito sa
// PICKAXE_STRIKE_* sa itaas (7 frame, hindi na 6).
const RAKE_STRIKE_FRAME_COUNT = 7;
// AYOS (hiling ng user): bahagyang bilisan din - dating 5.
const RAKE_STRIKE_FRAME_SPEED = 3;
const RAKE_STRIKE_SCALE = 1;

let puttingSpriteDir = "left";

// BAGO: kailangan ng AXE ang TUNAY na 4-direksyon (down/up/left/right,
// tingnan ang bagong sprites.axeStrike sa assets.js) - hindi na sapat
// ang lumang 2-direksyon na "puttingSpriteDir" (left/right lang, doon
// na lang "nilalagay" ang up/down dati). BAGO: kasama na rin ngayon ang
// "pickaxeStrike" AT "rakeStrike" dito (parehong 4-direksyon na rin,
// tingnan ang assets.js) - "pick" (item pickup) na lang ang natitirang
// gumagamit ng lumang 2-direksyon na "puttingSpriteDir".
let puttingSpriteDirFull = "down";
let puttingSpriteSet = "pick"; // "pick" o "axeStrike" - tingnan ang drawPlayer
let puttingFrameCount = PICK_FRAME_COUNT;
let puttingFrameSpeed = PICK_FRAME_SPEED;
let puttingScale = 1;
let puttingCallback = null;

// AYOS (hiling ng user: "isakto sa last frame yung sound effect medyo
// delay kasi") - dating tinatawag agad ang sound effect (cutWood/
// pickaxe/rake) SA MISMONG SIMULA ng swing (startAxeStrike/
// startPickaxeStrike/startRakeStrike), bago pa man makita ang
// aktwal na "hampas"/last frame - kaya parang "maaga"/hindi tugma sa
// mismong tama ng axe/pickaxe/rake sa puno/bato/lupa, at nararamdamang
// naka-delay/off ang bawat swing. Ngayon, iniimbak muna ang function
// na dapat tawagin (puttingSfx) - saka lang ito talaga tatawagin ng
// updatePlayerPutting() sa ibaba, EKSAKTO sa sandaling maabot ang
// HULING frame ng animation (hindi na sa simula).
let puttingSfx = null;

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
  sfx = null,
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
  // Tunay na 4-direksyon (down/up/left/right) - ginagamit lang ng
  // AXE ngayon (tingnan ang drawPlayer), pero itinatabi palagi (mura
  // lang) para ligtas gamitin ng ibang tool balang araw.
  puttingSpriteDirFull = player.direction;
  puttingSpriteSet = spriteSet;
  puttingFrameCount = frameCount;
  puttingFrameSpeed = frameSpeed;
  puttingScale = scale;
  puttingCallback = onComplete;
  puttingSfx = sfx;

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
  beginPuttingAnimation(
    col,
    row,
    "axeStrike",
    AXE_STRIKE_FRAME_COUNT,
    AXE_STRIKE_FRAME_SPEED,
    AXE_STRIKE_SCALE,
    onComplete,
    typeof playCutWoodSfx === "function" ? playCutWoodSfx : null,
  );
}

// Tinatawag mula sa handlePickaxeClickOnStone (resources.js) tuwing may
// aktwal na tinamaan na bato gamit ang pickaxe - kaparehong-pareho ng
// startAxeStrike sa itaas.
function startPickaxeStrike(col, row) {
  beginPuttingAnimation(
    col,
    row,
    "pickaxeStrike",
    PICKAXE_STRIKE_FRAME_COUNT,
    PICKAXE_STRIKE_FRAME_SPEED,
    PICKAXE_STRIKE_SCALE,
    null,
    typeof playPickaxeSfx === "function" ? playPickaxeSfx : null,
  );
}

// Tinatawag mula sa mousedown listener ng dig.js tuwing may aktwal na
// ginawang rake action (pagbungkal ng lupa o pagsira ng hindi pa hinog
// na tanim).
function startRakeStrike(col, row) {
  beginPuttingAnimation(
    col,
    row,
    "rakeStrike",
    RAKE_STRIKE_FRAME_COUNT,
    RAKE_STRIKE_FRAME_SPEED,
    RAKE_STRIKE_SCALE,
    null,
    typeof playRakeSfx === "function" ? playRakeSfx : null,
  );
}

function finishPutting() {
  player.putting = false;

  const callback = puttingCallback;

  puttingCallback = null;
  puttingSfx = null;

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

  // Eksaktong ngayon lang "tinamaan" (huling frame, ang aktwal na
  // hampas/swing) ang puno/bato/lupa - dito na natin tinatawag ang
  // sound effect (cutWood/pickaxe/rake), hindi na sa mismong simula ng
  // animation - tingnan ang paliwanag sa itaas ng "puttingSfx".
  if (player.puttingFrame === puttingFrameCount - 1 && puttingSfx) {
    puttingSfx();
  }
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
// AYOS: hindi pala eksaktong nasa PINAKAILALIM (bottom edge) ng
// 64px-tall na canvas ng bawat sprite frame ang totoong paanan ng
// character - may ~13px na walang laman (transparent) sa ibaba ng
// bawat frame (nasuri gamit ang bounding-box ng frontidle.png at
// frontwalk.png, parehong nasa y=51 ng 64px ang pinakababang pixel).
// Dati, ginagamit ang buong player.y + player.height (ibig sabihin,
// ang pinakababa ng bounding BOX, hindi ng aktwal na paanan) bilang
// sentro ng anino, kaya "lumulutang"/masyadong mababa ang anino
// kumpara sa tunay na posisyon ng paa. Ang FOOT_RATIO na ito
// (51/64) ang nagsasaad kung gaano kalayo PABABA (bilang porsyento
// ng buong canvas height) ang aktwal na paanan.
const PLAYER_FOOT_RATIO = 51 / 64;

function drawPlayerShadow() {
  const shadowWidth = player.width * 0.3;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height * PLAYER_FOOT_RATIO;

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

// Ilang frame TALAGA ang laman ng kasalukuyang gumaganang sprite
// (idle/walk/run/sit) - hindi na pwedeng ipalagay na "6 palagi" dahil
// magkaiba-iba ang bilang ng frame kada strip ngayon:
//   - idle (assets/character/idle/...)         -> 7 frame, 4 direksyon
//   - walk PAITAAS/PABABA (backwalk/frontwalk) -> 10 frame
//   - walk PAKALIWA/PAKANAN (left/rightwalk)   -> 7 frame
//   - run (assets/player/run*.png, bata pa rin)-> 6 frame (hindi
//     nagbago, hindi ginalaw ang "character" swap na ito)
// GINAGAMIT ito PAREHO sa drawPlayer() (para tama ang paghihiwa/
// frameWidth ng bawat strip) AT sa js/update.js (para tama ang
// pag-ikot/wrap-around ng player.frame - hindi tumigil nang maaga o
// sumobra kapag lumipat ng direksyon/estado). Dapat MAGKATUGMA ang
// dalawang gamit na ito, kaya IISANG function na lang ang pinagkukunan.
function getPlayerAnimationFrameCount() {
  if (player.moving && player.running)
    return player.direction === "up" || player.direction === "down" ? 10 : 7;

  if (player.moving) {
    // "walk" - magkaiba ang bilang ng frame ng front/back (10) kumpara
    // sa left/right (7) na art, kaya direction-aware.
    return player.direction === "up" || player.direction === "down" ? 10 : 7;
  }

  // idle - 7 frame ang lahat ng 4 direksyon.
  return 7;
}

// AYOS (hiling ng user): "gusto ko lang yung torchglow kapag napadaan
// sa trees or mga halaman is mag bebehind yung glow niya" - ito ang
// TALAGANG ginagamit na "draw" sa Y-sort na drawables (map.js) sa
// halip na basta drawPlayer() mismo - iginuguhit muna ang torch glow
// (drawTorchGlowWorld, atmosphere.js - world space na, WALANG epekto
// kung hindi naka-equip ang torch) BAGO ang player, sa PAREHONG
// sortY/order - kaya kahit anong bagay na may MAS MALAKING sortY (hal.
// isang punong "nasa harap"/nalagpasan na ng player) ay iguguhit
// PAGKATAPOS ng dalawang ito, natatakpan/nagiging LIKOD ng puno ang
// glow (at ang player) sa tamang pagkakataon - normal na bahagi na
// lang ito ng parehong Y-sort, hindi na hiwalay/screen-space overlay.
function drawPlayerWithTorchGlow() {
  if (typeof drawTorchGlowWorld === "function") drawTorchGlowWorld();

  drawPlayer();
}

function drawPlayer() {
  // Ang "pick"/"axeStrike" na animation ay hiwa-hiwalay na larawan kada
  // frame (hindi spritesheet) - iba ang paraan ng pagguhit nito kaysa
  // sa ibang sprite sa ibaba (na parehong iisang strip na hinahati sa
  // frame). Totoong Left/Right na art na ang axeStrike (assets/player/
  // axe/left, assets/player/axe/right) - hindi na kailangan pang
  // i-mirror/flip.
  if (player.putting) {
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

    // BAGONG format ng AXE (4 tunay na direksyon, IISANG strip na
    // larawan kada direksyon - kaparehong-pareho ng idle/walk sa
    // ibaba, HINDI na hiwa-hiwalay na PNG kada frame) - kailangan ng
    // ibang paraan ng pag-crop (frameWidth = buong lapad / bilang ng
    // frame) kaysa sa lumang "pick"/"rakeStrike" (hiwa-hiwalay na
    // larawan kada frame, array).
    // BAGO: kasama na rin ang "pickaxeStrike" dito (dating "pick"-style
    // array ng hiwa-hiwalay na PNG kada frame) - pareho na itong IISANG
    // strip na larawan kada direksyon (assets/character/pickaxe/),
    // kaya PAREHONG paraan ng pag-crop ang gamit ngayon.
    if (
      puttingSpriteSet === "axeStrike" ||
      puttingSpriteSet === "pickaxeStrike" ||
      // BAGO: "rakeStrike" - kinopya na lang mismo ang art/format ng
      // pickaxe (tingnan ang sprites.rakeStrike sa assets.js), kaya
      // kaparehong-pareho na rin ang paraan ng pag-crop/pagguhit nito.
      puttingSpriteSet === "rakeStrike"
    ) {
      const sprite = sprites[puttingSpriteSet][puttingSpriteDirFull];

      if (!sprite.complete || !sprite.width) return;

      const frameWidth = sprite.width / puttingFrameCount;
      const frameHeight = sprite.height;

      // AUTO-GENERATED (crop dead-space tool): "destX/Y/Width/Height"
      // sa itaas ay batay pa rin sa LUMANG walang-crop na sukat ng
      // frame (ibig sabihin, ito ang "buong box" gaya ng dati) -
      // kailangan munang i-adjust ito gamit ang crop info (kung ilang
      // porsyento ng orihinal na frame ang natira pagkatapos i-crop
      // ang PNG) bago tuluyang iguhit, para EXACTLY kapareho pa rin ng
      // dati ang lumalabas sa screen.
      // "rakeStrike" -> gamit ang crop data ng "pickaxeStrike" (parehong
      // larawan/art talaga ang ginagamit nila, tingnan ang assets.js).
      const cropCategoryForDraw =
        puttingSpriteSet === "rakeStrike" ? "pickaxeStrike" : puttingSpriteSet;
      const [cDestX, cDestY, cDestWidth, cDestHeight] =
        getSpriteCropDestRect(
          `${cropCategoryForDraw}.${puttingSpriteDirFull}`,
          destX,
          destY,
          destWidth,
          destHeight,
        );

      ctx.drawImage(
        sprite,
        player.puttingFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        cDestX,
        cDestY,
        cDestWidth,
        cDestHeight,
      );

      return;
    }

    // Lumang paraan ("pick" na lang ngayon - "rakeStrike" ay
    // nailipat na sa itaas, kasama na ng axeStrike/pickaxeStrike, dahil
    // strip-style na rin ang ginagamit nitong art) - hiwa-hiwalay na
    // larawan kada frame, left/right lang.
    const sprite =
      sprites[puttingSpriteSet][puttingSpriteDir][player.puttingFrame];

    if (!sprite.complete || !sprite.width) return;

    // AUTO-GENERATED (crop dead-space tool) - tingnan ang paliwanag sa
    // itaas, kaparehong ideya lang (grupo/direksyon ang gamit dito
    // bilang crop key sa halip na direksyon lang).
    const [cDestX, cDestY, cDestWidth, cDestHeight] = getSpriteCropDestRect(
      `${puttingSpriteSet}.${puttingSpriteDir}`,
      destX,
      destY,
      destWidth,
      destHeight,
    );

    ctx.drawImage(sprite, cDestX, cDestY, cDestWidth, cDestHeight);

    return;
  }

  let sprite;
  let frameCount = getPlayerAnimationFrameCount();
  let frameIndex = 0;
  // AUTO-GENERATED (crop dead-space tool): pangalan ng grupo (walk/
  // bagWalk/idle/bagIdle) na gagamitin bilang crop key sa ibaba -
  // tingnan ang getSpriteCropDestRect().
  let cropCategory = "idle";

  if (player.moving && player.running) {
    // BAGONG BACKPACK: bagRun kapag "Use"/naka-suot ang bag
    // (bagEquipped, hotbar.js) - hiling ng user na gamitin din ito sa
    // "run", hindi lang sa idle. Kaparehong-pareho ng gawi ng normal na
    // run (kopya lang ng walk, tingnan ang assets.js).
    //
    // AYOS (BAGO, hiling ng user: "i-apply mo na yung sa torch walk at
    // sa bag na folder tapos walk kapag may used na torch") - MAY
    // sariling "torch" na bersyon na ngayon (torchRun/torchBagRun,
    // kopya lang ng torchWalk/torchBagWalk, tingnan ang assets.js) -
    // apat na posibleng kumbinasyon, PAREHONG priyoridad ng idle sa
    // ibaba (torch+bag > torch lang > bag lang > wala).
    const torchOnRun = typeof torchEquipped !== "undefined" && torchEquipped;
    const bagOnRun = typeof bagEquipped !== "undefined" && bagEquipped;

    if (torchOnRun && bagOnRun && sprites.torchBagRun && sprites.torchBagRun[player.direction]) {
      sprite = sprites.torchBagRun[player.direction];
      cropCategory = "torchBagWalk"; // parehong art/crop ng torchBagWalk (kopya lang ng file)
    } else if (torchOnRun && sprites.torchRun && sprites.torchRun[player.direction]) {
      sprite = sprites.torchRun[player.direction];
      cropCategory = "torchWalk"; // parehong art/crop ng torchWalk (kopya lang ng file)
    } else if (bagOnRun && sprites.bagRun && sprites.bagRun[player.direction]) {
      sprite = sprites.bagRun[player.direction];
      cropCategory = "bagWalk"; // parehong art/crop ng bagWalk (kopya lang ng file)
    } else {
      sprite = sprites.run[player.direction];
      cropCategory = "walk"; // parehong art/crop ng walk (kopya lang ng file)
    }
    // Umiikot lang ang animation frame (0-5) kapag talagang naglalakad.
    // Kapag naka-idle o naka-sit, laging unang frame (0) lang ang gamit,
    // para hindi "nanginginig"/nagbabago-bago ang pose kahit di gumagalaw.
    frameIndex = player.frame;
  } else if (player.moving) {
    // BAGONG BACKPACK: bagWalk kapag naka-suot ang bag (hiling ng user:
    // "add bag walk use it if i used bag ... idle and walk") - parehong
    // frame count ng normal na walk (assets.js), kaya walang dagdag na
    // pagbabago sa getPlayerAnimationFrameCount() na kailangan.
    //
    // AYOS (BAGO, hiling ng user: "i-apply mo na yung sa torch walk at
    // sa bag na folder tapos walk kapag may used na torch") - dating
    // basta bagWalk/walk lang ang sinusuri dito (walang torch) - kaya
    // babalik sa normal na sprite habang gumagalaw kahit naka-equip
    // ang torch. Ngayon, apat na posibleng kumbinasyon (PAREHONG
    // priyoridad ng idle sa ibaba):
    //   torch + bag  -> torchBagWalk (may bag AT hawak na torch)
    //   torch lang   -> torchWalk    (hawak na torch, walang bag)
    //   bag lang     -> bagWalk      (dating gawi)
    //   wala         -> walk         (normal)
    const torchOnWalk = typeof torchEquipped !== "undefined" && torchEquipped;
    const bagOnWalk = typeof bagEquipped !== "undefined" && bagEquipped;

    if (torchOnWalk && bagOnWalk && sprites.torchBagWalk && sprites.torchBagWalk[player.direction]) {
      sprite = sprites.torchBagWalk[player.direction];
      cropCategory = "torchBagWalk";
    } else if (torchOnWalk && sprites.torchWalk && sprites.torchWalk[player.direction]) {
      sprite = sprites.torchWalk[player.direction];
      cropCategory = "torchWalk";
    } else if (bagOnWalk && sprites.bagWalk && sprites.bagWalk[player.direction]) {
      sprite = sprites.bagWalk[player.direction];
      cropCategory = "bagWalk";
    } else {
      sprite = sprites.walk[player.direction];
      cropCategory = "walk";
    }
    frameIndex = player.frame;
  } else {
    // AYOS: dati ay laging frame 0 lang ang ginagamit dito (walang
    // frameIndex na naka-assign), kaya "nakatigil"/hindi umaandar ang
    // idle animation kahit umiikot na si player.frame sa update.js.
    // Ngayon, kaparehong player.frame ang ginagamit gaya ng walk/run,
    // kaya umiikot na rin ang 6-7 frame ng idle habang nakatayo lang
    // ang character.
    // BAGONG BACKPACK: kapag "Use" ang pinili sa bag sa inventory
    // (bagEquipped, tingnan ang hotbar.js), ipinapakita ang bersyon ng
    // idle sprite na may suot na bag (assets/character/bag/idle/) sa
    // halip na ang normal na idle. (Ang "run"/"walk" na bersyon nito ay
    // nasa itaas na, tingnan ang mga sanga sa itaas.)
    //
    // BAGO (hiling ng user): TUNAY na ngayon ang TORCH na sprite
    // (assets/character/torch/, sprites.torchIdle/torchBagIdle sa
    // assets.js) - "erase" na ang dating pansamantalang paraan (ang
    // normal na bagIdle na lang bilang stand-in). TANGING sa IDLE lang
    // ito nag-aapply, "only idlebag and idle" gaya ng hiling - walang
    // hiwalay na torch na "walk" na ginagamit dito (babalik sa normal
    // na walk/bagWalk sa mga sanga sa itaas habang gumagalaw).
    //
    // Apat na posibleng kumbinasyon:
    //   torch + bag  -> torchBagIdle (may bag AT hawak na torch)
    //   torch lang   -> torchIdle    (hawak na torch, walang bag)
    //   bag lang     -> bagIdle      (dating gawi)
    //   wala         -> idle         (normal)
    const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;
    const bagOn = typeof bagEquipped !== "undefined" && bagEquipped;

    if (torchOn && bagOn && sprites.torchBagIdle && sprites.torchBagIdle[player.direction]) {
      sprite = sprites.torchBagIdle[player.direction];
      cropCategory = "torchBagIdle";
    } else if (torchOn && sprites.torchIdle && sprites.torchIdle[player.direction]) {
      sprite = sprites.torchIdle[player.direction];
      cropCategory = "torchIdle";
    } else if (bagOn && sprites.bagIdle && sprites.bagIdle[player.direction]) {
      sprite = sprites.bagIdle[player.direction];
      cropCategory = "bagIdle";
    } else {
      sprite = sprites.idle[player.direction];
      cropCategory = "idle";
    }
    frameIndex = player.frame;
  }

  if (!sprite.complete || !sprite.width) return;

  const frameWidth = sprite.width / frameCount;
  const frameHeight = sprite.height;

  ctx.imageSmoothingEnabled = false;

  drawPlayerShadow();

  // AUTO-GENERATED (crop dead-space tool) - tingnan ang paliwanag sa
  // getSpriteCropDestRect() kung bakit kailangan ang adjustment na ito.
  const [cDestX, cDestY, cDestWidth, cDestHeight] = getSpriteCropDestRect(
    `${cropCategory}.${player.direction}`,
    player.x,
    player.y,
    player.width,
    player.height,
  );

  ctx.drawImage(
    sprite,
    frameIndex * frameWidth,
    0,
    frameWidth,
    frameHeight,
    cDestX,
    cDestY,
    cDestWidth,
    cDestHeight,
  );

  // "HOLD" na item (hiling ng user) - lumulutang sa ITAAS ng ulo,
  // sumusunod SAAN MAN, kaya dito ito iginuguhit PAGKATAPOS ng mismong
  // sprite ng character (tingnan ang hold.js).
  if (typeof drawHeldItemOnPlayer === "function") drawHeldItemOnPlayer();
}
