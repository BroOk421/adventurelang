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

const sprites = {
  idle: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  walk: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  run: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  sit: new Image(),

  // Hiwalay na larawan kada frame (hindi spritesheet) - tingnan ang
  // PICK_FRAME_COUNT sa player.js.
  pick: {
    left: [],
    right: [],
  },

  // Axe swing (pagputol ng puno) - hiwalay na larawan kada frame kada
  // direksyon (hindi na naka-mirror/flip pa - totoong Left/Right art na
  // ito, kaparehong-pareho ng "pick" sa itaas).
  axeStrike: {
    left: [],
    right: [],
  },

  // Pickaxe swing (paghukay ng bato) - tingnan ang startPickaxeStrike
  // sa player.js.
  pickaxeStrike: {
    left: [],
    right: [],
  },

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

sprites.idle.down.src = "./assets/player/idleFront.png";
sprites.idle.up.src = "./assets/player/idleBack.png";
sprites.idle.left.src = "./assets/player/idleLeft.png";
sprites.idle.right.src = "./assets/player/idleright.png";

sprites.walk.down.src = "./assets/player/walkFront.png";
sprites.walk.up.src = "./assets/player/walkBack.png";
sprites.walk.left.src = "./assets/player/walkLeft.png";
sprites.walk.right.src = "./assets/player/walkRight.png";

sprites.run.down.src = "./assets/player/runFront.png";
sprites.run.up.src = "./assets/player/runBack.png";
sprites.run.left.src = "./assets/player/runLeft.png";
sprites.run.right.src = "./assets/player/runRight.png";

sprites.sit.src = "./assets/player/sit.png";

for (let i = 1; i <= 6; i++) {
  const left = new Image();
  left.src = `./assets/player/pick/Left/pickLeft${i}.png`;
  sprites.pick.left.push(left);

  const right = new Image();
  right.src = `./assets/player/pick/Right/pickRight${i}.png`;
  sprites.pick.right.push(right);
}

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
  left.src = `./assets/player/pickaxe/left/PickaxeLeft${i}.png`;
  sprites.pickaxeStrike.left.push(left);

  const right = new Image();
  right.src = `./assets/player/pickaxe/right/PickaxeRight${i}.png`;
  sprites.pickaxeStrike.right.push(right);
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
