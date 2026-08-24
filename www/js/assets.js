// =========================
// TILED MAP ASSETS
// =========================

const MAP_URL = "./assets/map/snowMap.tmj";

// Folder ng mapa - dito rin hinahanap ang mga tileset (.tsx / .tsj) at
// ang mga larawan nila.
const MAP_DIR = "./assets/map/";

// Ginagamit sa fetch/img.src ng mapa, tileset files (.tsx/.tsj), at mga
// larawan nila - PARA HINDI ito ma-cache nang matagal ng browser (hindi
// tulad ng mga <script> tag sa itaas na may "?v=" na, ang mga fetch()
// dito ay walang ganoon dati, kaya kahit baguhin mo pa ang isang .tmj/
// .tsj/.png, minsan LUMANG bersyon pa rin ang ipinapakita ng browser
// hangga't hindi mo pinipilit i-hard-refresh). Isang beses lang ito
// nabubuo bawat pag-load ng page (Date.now()), kaya FRESH palagi ang
// kinukuha sa bawat bagong session, pero hindi naman paulit-ulit na
// nagre-request kada frame (iisa lang ang value habang bukas ang tab).
const CACHE_BUST = "?v=" + Date.now();

const TILE_SIZE = 16;

// Pinupuno ito habang nilo-load ang mapa - isang entry kada tileset na
// nakasulat mismo sa .tmj.
//
// Dati, IISANG tileset ang naka-hardcode dito (firstgid 1, Snow.png).
// Ang problema: sa Tiled, tuwing magdadagdag ka ng bagong tileset sa
// mapa, may bago itong firstgid (hal. 7019). Kapag ipininta mo ang
// lupa gamit ang bagong tileset na iyon, magiging 7892 ang gid ng bawat
// tile - at dahil firstgid 1 lang ang kilala ng laro, WALANG lumalabas:
// itim ang buong lupa. Ganoon ang nangyari nang dalawang beses.
//
// Ngayon, kung ano ang nakalista sa mapa, yun ang susundin - kaya kahit
// ilang tileset pa ang idagdag mo sa Tiled, lalabas pa rin lahat.
let tilesets = [];

// =========================
// PLAYER SPRITES
// =========================

// =========================
// OLDMAN SKIN (bagong itsura ng player)
// =========================
//
// Pinalitan na ang player mula sa dating "generic" na sprite tungo sa
// oldman art (assets/player/oldman/) - idle, walk, sit, pick, pickaxe.
// Iba ang FORMAT ng mga bagong asset na ito kumpara dati: hindi na
// isang spritesheet-strip na hinahati sa frameCount (tulad ng dating
// idleFront.png/walkFront.png/sit.png) - HIWALAY na larawan na ito
// kada frame (tulad na rin ng dating "pick"), at may APAT na direksyon
// na ngayon (front/back/left/right) sa halip na dalawa lang
// (left/right) para sa pick/pickaxe.
//
// WALANG oldman art para sa AXE at PUNCH (kamao) - kulang pa ang mga
// asset na iyon (tingnan ang CLAUDE.md/usapan) - kaya PINANATILI muna
// natin ang DATING sprite set (sprites.axeStrike, sprites.punchStrike)
// sa ibaba - ibang itsura pa rin ito habang naghahampas ng axe/kamao,
// hanggang sa magkaroon ng tamang oldman art para dito.
//
// WALANG hiwalay na "run" art ang oldman - ginagamit na lang natin
// ulit ang WALK frames kapag tumatakbo (sprites.run = sprites.walk sa
// ibaba) - kulang lang ito sa art, hindi bug.
const OLDMAN_ANIM_FRAME_COUNT = 8;

// down = "front", up = "back" - ganito ang naka-pangalan ang mga
// folder/file sa assets/player/oldman/.
const OLDMAN_DIR_PREFIX = {
  down: "front",
  up: "back",
  left: "left",
  right: "right",
};

// Kinakarga ang APAT na direksyon (front/back/left/right) ng isang
// oldman animation (\"idle\", \"walk\", \"sit\", \"pick\", \"pickaxe\") -
// parehong pattern ang folder/file naming sa lahat ng ito:
//   assets/player/oldman/<anim>/<prefix><anim>/<prefix><anim><N>.png
// kung saan walang <N> (blangko) ang unang frame, saka 2..8 sunod.
function loadOldmanAnim(anim) {
  const frames = { down: [], up: [], left: [], right: [] };

  Object.keys(OLDMAN_DIR_PREFIX).forEach((dir) => {
    const prefix = OLDMAN_DIR_PREFIX[dir];

    for (let i = 1; i <= OLDMAN_ANIM_FRAME_COUNT; i++) {
      const img = new Image();
      const suffix = i === 1 ? "" : String(i);

      img.src = `./assets/player/oldman/${anim}/${prefix}${anim}/${prefix}${anim}${suffix}.png`;

      frames[dir].push(img);
    }
  });

  return frames;
}

const sprites = {
  idle: loadOldmanAnim("idle"),
  walk: loadOldmanAnim("walk"),
  sit: loadOldmanAnim("sit"),

  // Hiwalay na larawan kada frame (hindi spritesheet) - tingnan ang
  // PICK_FRAME_COUNT sa player.js. Apat na direksyon na ngayon
  // (dati left/right lang).
  pick: loadOldmanAnim("pick"),

  // Axe swing (pagputol ng puno) - hiwalay na larawan kada frame kada
  // direksyon (hindi na naka-mirror/flip pa - totoong Left/Right art na
  // ito, kaparehong-pareho ng "pick" sa itaas).
  axeStrike: {
    left: [],
    right: [],
  },

  // Pickaxe swing (paghukay ng bato) - tingnan ang startPickaxeStrike
  // sa player.js. Apat na direksyon na ngayon (dati left/right lang).
  pickaxeStrike: loadOldmanAnim("pickaxe"),

  // Rake swing (paggamit ng rake) - tingnan ang startRakeStrike sa
  // player.js. PANSININ: sa ngayon, PICKAXE ang laman ng aktwal na mga
  // larawan sa assets/player/rake/{left,right}/ (hindi pa naipalit sa
  // totoong rake art) - gumagana pa rin ang code, mali lang ang
  // makikita habang hindi pa napapalitan ang mga PNG.
  rakeStrike: {
    left: [],
    right: [],
  },

  // Punch (kamao, walang naka-equip na tool) - tingnan ang
  // startPunchStrike sa player.js.
  punchStrike: {
    left: [],
    right: [],
  },
};

// Walang hiwalay na "run" art ang oldman - ginagamit na lang natin
// ulit ang WALK frames (parehong Image object references, hindi
// kinokopya - okay lang, hindi naman ito nire-render nang magkasabay).
sprites.run = sprites.walk;

for (let i = 1; i <= 6; i++) {
  const left = new Image();
  left.src = `./assets/player/axe/left/AxeStrikeLeft${i}.png`;
  sprites.axeStrike.left.push(left);

  const right = new Image();
  right.src = `./assets/player/axe/right/AxeStrikeRight${i}.png`;
  sprites.axeStrike.right.push(right);
}

for (let i = 1; i <= 6; i++) {
  const left = new Image();
  left.src = `./assets/player/rake/left/rakeLeft${i}.png`;
  sprites.rakeStrike.left.push(left);

  const right = new Image();
  right.src = `./assets/player/rake/right/RakeRight${i}.png`;
  sprites.rakeStrike.right.push(right);
}

for (let i = 1; i <= 6; i++) {
  const left = new Image();
  left.src = `./assets/player/punch/left/PunchLeft${i}.png`;
  sprites.punchStrike.left.push(left);

  const right = new Image();
  right.src = `./assets/player/punch/right/PunchRight${i}.png`;
  sprites.punchStrike.right.push(right);
}
