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

  // Hiwalay na larawan kada frame (hindi spritesheet) - tingnan ang
  // PICK_FRAME_COUNT sa player.js.
  pick: {
    left: [],
    right: [],
  },

  // Axe swing (pagputol ng puno) - BAGO na ngayon: 4 TUNAY na direksyon
  // (front/back/left/right, mula sa assets/character/axe/) sa halip na
  // 2 lang (left/right, saka minimirror/ginamit na rin para sa up/down).
  // KAPAREHONG FORMAT ng idle/walk (IISANG strip na larawan kada
  // direksyon, hindi hiwa-hiwalay na PNG kada frame) - tingnan ang
  // drawPlayer() sa player.js para sa bagong paraan ng pag-crop nito.
  axeStrike: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  // Pickaxe swing (paghukay ng bato) - tingnan ang startPickaxeStrike
  // sa player.js. BAGO: 4 TUNAY na direksyon na ngayon (front/back/
  // left/right, mula sa assets/character/pickaxe/) - kaparehong-pareho
  // ng ginawa sa axeStrike sa itaas (IISANG strip na larawan kada
  // direksyon, HINDI na hiwa-hiwalay na PNG kada frame - tingnan ang
  // paliwanag sa CLAUDE.md tungkol dito). Dating gamit ang
  // assets/player/pickaxe/{left,right}/ (2-direksyon lang, LUMANG
  // "bata" na art - hindi tugma sa kasalukuyang "santa" na character,
  // kaya distorted/nakaka-stretch ang lumalabas).
  pickaxeStrike: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  // Rake swing (paggamit ng rake) - tingnan ang startRakeStrike sa
  // player.js. BAGO (hiling ng user): "sprites.rakeStrike" ay dating
  // ARRAY (hiwa-hiwalay na PNG kada frame, assets/player/rake/), pero
  // sa ibaba ito ay ino-OVERRIDE/inaalis (tingnan ang
  // "sprites.rakeStrike = sprites.pickaxeStrike") - GINAGAMIT NA LANG
  // ANG PICKAXE ART (assets/character/pickaxe/), dahil wala pang
  // sariling art ang rake. Simpleng object reference lang ito (hindi
  // duplicate na Image load), kaya kahit palitan pa ang pickaxe art
  // balang araw, sumusunod agad ang rake dito.
  rakeStrike: {
    left: [],
    right: [],
  },
};

sprites.idle.down.src = "./assets/character/idle/frontidle/frontidle.png";
sprites.idle.up.src = "./assets/character/idle/backidle/backidle.png";
sprites.idle.left.src = "./assets/character/idle/leftidle/leftidle.png";
sprites.idle.right.src = "./assets/character/idle/rightidle/rightidle.png";

sprites.walk.down.src = "./assets/character/walk/frontwalk/frontwalk.png";
sprites.walk.up.src = "./assets/character/walk/backwalk/backwalk.png";
sprites.walk.left.src = "./assets/character/walk/leftwalk/leftwalk.png";
sprites.walk.right.src = "./assets/character/walk/rightwalk/rightwalk.png";

sprites.run.down.src = "./assets/character/walk/frontwalk/frontwalk.png";
sprites.run.up.src = "./assets/character/walk/backwalk/backwalk.png";
sprites.run.left.src = "./assets/character/walk/leftwalk/leftwalk.png";
sprites.run.right.src = "./assets/character/walk/rightwalk/rightwalk.png";

// Backpack (bag) na naka-suot - IISANG "idle" strip lang kada direksyon
// (assets/character/bag/idle/, 7 frame, kaparehong format ng normal na
// idle sa itaas) - GINAGAMIT LANG kapag "bagEquipped" (hotbar.js) AT
// hindi gumagalaw ang player (tingnan ang drawPlayer sa player.js).
// Walang "walk"/tool-swing na bersyon ang art na ito - kapag
// naglalakad/gumagamit ng tool habang naka-suot ang bag, babalik muna
// sa normal na sprite (walang bag na tila) hanggang may bagong asset.
sprites.bagIdle = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.bagIdle.down.src = "./assets/character/bag/idle/frontbag/frontbag.png";
sprites.bagIdle.up.src = "./assets/character/bag/idle/backbag/backbag.png";
sprites.bagIdle.left.src = "./assets/character/bag/idle/leftbag/leftbag.png";
sprites.bagIdle.right.src = "./assets/character/bag/idle/rightbag/rightbag.png";

// BAGONG TORCH ART (assets/character/torch/) - "erase" na ang dating
// paraan (kopyahin/gamitin na lang ang normal na bagIdle bilang
// pansamantalang stand-in para sa torch, walang tunay na hawak na
// torch na lumalabas sa sprite) - TUNAY na ngayon ang ginagamit na
// larawan (may hawak na torch, 7 frame, 64x64 kada frame - kaparehong
// bilang ng frame ng normal na idle sa itaas). Hiwalay lang ito sa
// dalawang bersyon (may bag/walang bag) dahil magkaiba ang larawan -
// tingnan ang drawPlayer() sa player.js kung paano pinipili sa pagitan
// nito.
//
// AYOS (BAGO, hiling ng user: "gusto ko sana i-apply mo na yung sa
// torch walk at sa bag na folder tapos walk kapag may used na
// torch") - MAY "walk" na TALAGA na ngayon ang torch art (tingnan
// ang sprites.torchWalk/torchBagWalk sa ibaba, malapit sa bagRun) -
// hindi na basta babalik sa normal na walk/bagWalk habang gumagalaw
// kahit naka-equip ang torch, gaya ng dati.
sprites.torchIdle = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.torchIdle.down.src =
  "./assets/character/torch/idle/frontidle/frontidletorch.png";
sprites.torchIdle.up.src =
  "./assets/character/torch/idle/backidle/backidletorch.png";
sprites.torchIdle.left.src =
  "./assets/character/torch/idle/leftidle/leftidletorch.png";
sprites.torchIdle.right.src =
  "./assets/character/torch/idle/rightidle/rightidletorch.png";

// Parehong "idle" lang, pero may suot na bag ZKA-HAWAK na torch (parehong
// naka-equip ang bag AT ang torch) - assets/character/torch/bag/idlebag/.
sprites.torchBagIdle = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.torchBagIdle.down.src =
  "./assets/character/torch/bag/idlebag/frontbag/frontbagandtorch.png";
sprites.torchBagIdle.up.src =
  "./assets/character/torch/bag/idlebag/backbag/backbagandtorch.png";
sprites.torchBagIdle.left.src =
  "./assets/character/torch/bag/idlebag/leftbag/leftbagandtorch.png";
sprites.torchBagIdle.right.src =
  "./assets/character/torch/bag/idlebag/rightbag/rightbagandtorch.png";

// BAGONG "naglalakad na naka-suot ng bag" (assets/character/bag/walk/)
// - IISANG strip kada direksyon, KAPAREHONG-KAPAREHONG frame count ng
// normal na walk (front/back = 10 frame, left/right = 7 frame) - kaya
// gumagana na agad ang PAREHONG getPlayerAnimationFrameCount() (player.js)
// nang walang dagdag na espesyal na kaso.
sprites.bagWalk = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.bagWalk.down.src = "./assets/character/bag/walk/frontwalk/frontwalk.png";
sprites.bagWalk.up.src = "./assets/character/bag/walk/backwalk/backwalk.png";
sprites.bagWalk.left.src = "./assets/character/bag/walk/leftwalk/leftwalk.png";
sprites.bagWalk.right.src = "./assets/character/bag/walk/rightwalk/rightwalk.png";

// "Takbo" na naka-bag - WALANG hiwalay na "run" na art ang bag (wala
// ring hiwalay na "run" na art ang normal/walang-bag na character -
// tingnan sa itaas, kopya lang ng walk ang sprites.run) - kaya kopya
// rin lang ng sprites.bagWalk ito, kaparehong-pareho ng gawi ng normal
// na run/walk.
sprites.bagRun = {
  down: sprites.bagWalk.down,
  up: sprites.bagWalk.up,
  left: sprites.bagWalk.left,
  right: sprites.bagWalk.right,
};

// BAGO (hiling ng user: "gusto ko sana i-apply mo na yung sa torch
// walk at sa bag na folder tapos walk kapag may used na torch") -
// TUNAY na ngayon ang "naglalakad habang naka-hawak ng torch" na
// sprite (assets/character/torch/walk/) - dating "walang hiwalay na
// torch na walk" pa (tingnan ang dating komento sa itaas ng
// torchIdle) - babalik na lang sa normal na walk/bagWalk noon habang
// gumagalaw kahit naka-equip ang torch. PAREHONG bilang ng frame ng
// normal na walk (front/back = 10, left/right = 7 - 640/64=10,
// 448/64=7, 64px kada frame kaparehong-pareho ng torchIdle) - kaya
// gumagana na agad ang PAREHONG getPlayerAnimationFrameCount() nang
// walang dagdag na espesyal na kaso. Tingnan ang drawPlayer()
// (player.js) kung paano ito pinipili.
sprites.torchWalk = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.torchWalk.down.src =
  "./assets/character/torch/walk/frontwalk/frontwalk.png";
sprites.torchWalk.up.src =
  "./assets/character/torch/walk/backwalk/backwalk.png";
sprites.torchWalk.left.src =
  "./assets/character/torch/walk/leftwalk/leftwalk.png";
sprites.torchWalk.right.src =
  "./assets/character/torch/walk/rightwalk/rightwalk.png";

// Parehong "walk", pero may suot na bag KASABAY ng hawak na torch
// (parehong naka-equip ang bag AT ang torch) -
// assets/character/torch/bag/walk/.
sprites.torchBagWalk = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image(),
};
sprites.torchBagWalk.down.src =
  "./assets/character/torch/bag/walk/frontwalk/frontwalk.png";
sprites.torchBagWalk.up.src =
  "./assets/character/torch/bag/walk/backwalk/backwalk.png";
sprites.torchBagWalk.left.src =
  "./assets/character/torch/bag/walk/leftwalk/leftwalk.png";
sprites.torchBagWalk.right.src =
  "./assets/character/torch/bag/walk/rightwalk/rightwalk.png";

// "Takbo" na naka-hawak ng torch (parehong may bag at wala) - WALANG
// hiwalay na "run" na art dito rin (kaparehong dahilan ng bagRun sa
// itaas) - kopya lang ng kani-kanilang "walk" na bersyon.
sprites.torchRun = {
  down: sprites.torchWalk.down,
  up: sprites.torchWalk.up,
  left: sprites.torchWalk.left,
  right: sprites.torchWalk.right,
};
sprites.torchBagRun = {
  down: sprites.torchBagWalk.down,
  up: sprites.torchBagWalk.up,
  left: sprites.torchBagWalk.left,
  right: sprites.torchBagWalk.right,
};

for (let i = 1; i <= 6; i++) {
  const left = new Image();
  left.src = `./assets/player/pick/Left/pickLeft${i}.png`;
  sprites.pick.left.push(left);

  const right = new Image();
  right.src = `./assets/player/pick/Right/pickRight${i}.png`;
  sprites.pick.right.push(right);
}

// Bagong 4-direksyon na AXE na art (assets/character/axe/) - IISANG
// strip kada direksyon (kaparehong-pareho ng paraan ng idle/walk sa
// itaas), 7 frame bawat isa (448x64px, 64x64 kada frame) - tingnan ang
// AXE_STRIKE_FRAME_COUNT sa player.js.
sprites.axeStrike.down.src = "./assets/character/axe/frontaxe/frontaxe.png";
sprites.axeStrike.up.src = "./assets/character/axe/backaxe/backaxe.png";
sprites.axeStrike.left.src = "./assets/character/axe/leftaxe/leftaxe.png";
sprites.axeStrike.right.src = "./assets/character/axe/rightaxe/rightaxe.png";

// Bagong 4-direksyon na PICKAXE na art (assets/character/pickaxe/) -
// IISANG strip kada direksyon (kaparehong-pareho ng paraan ng
// idle/walk/axe sa itaas), 7 frame bawat isa (448x64px, 64x64 kada
// frame) - tingnan ang PICKAXE_STRIKE_FRAME_COUNT sa player.js.
sprites.pickaxeStrike.down.src =
  "./assets/character/pickaxe/frontpickaxe/frontpickaxe.png";
sprites.pickaxeStrike.up.src =
  "./assets/character/pickaxe/backpickaxe/backpickaxe.png";
sprites.pickaxeStrike.left.src =
  "./assets/character/pickaxe/leftpickaxe/leftpickaxe.png";
sprites.pickaxeStrike.right.src =
  "./assets/character/pickaxe/rightpickaxe/rightpickaxe.png";

// BAGO (hiling ng user): "rakeStrike" -> gamitin na ang PICKAXE strip
// (character/pickaxe/) sa halip na ang lumang array ng
// assets/player/rake/{left,right}/*.png - tingnan ang paliwanag sa
// sprites.rakeStrike sa itaas. Isang beses lang ma-load ang mga larawan
// (sa pickaxeStrike.* Image objects sa itaas) - dito, "kinokopya" lang
// ang parehong reference, kaya hindi na kailangan pang mag-loop/mag-
// "new Image()" ulit para sa rake.
sprites.rakeStrike = sprites.pickaxeStrike;
