// =========================
// MGA MUNDO (MAPA) AT PINTUAN
// =========================
//
// Higit sa isa na ang mapa ng laro: ang nayon sa labas, at ang loob ng
// bahay. Dito nakalista kung ano-ano sila at kung paano magkakadugtong.
//
// Ang "outdoor" ay nagsasabi kung may panahon (niyebe, hamog, araw at
// gabi) sa mundong iyon. Sa loob ng bahay, wala - kaya tumitigil ang
// niyebe pagpasok mo.

const WORLDS = {
  // Bagong world - "town" - maliit na bayan, GITNA na ngayon ng laro
  // (kasama ng "grassmap") - dating naaabot lang mula sa "newmap"
  // (TINANGGAL na ngayon, hiling ng user: "2 na lang, town at
  // grassmap") - direkta na lang mula sa "grassmap" (tingnan ang DOORS
  // sa ibaba, "Grass Path"/"Town" na pares ng pintuan). Gumagamit na
  // ng tunay na larawan (town.png, tinuturo ng tilesets/town.tsj) ang
  // buong mapa - kaya WALANG kailangan pang random na puno/bato/damo/
  // baboy (nakadrawing na lahat ng iyon mismo sa larawan) -
  // "noTrees"/"noStones"/"noGrassTufts"/"noPigs" (hiling ng user,
  // kaparehong pattern ng "noStones" sa ibang mundo).
  town: {
    url: "./assets/map/town.tmj",
    // Bagong "snow" na bersyon (in-upload ng user: snowtown.tmj +
    // snowtown.png) - KAPARIS na Tiled export ng town.tmj (parehong
    // layer structure na "map"/"snowlamps"/"door"/"windows"/"Collisions", kaya
    // GUMAGANA na agad ang lahat ng ilaw/collision code sa map.js/
    // atmosphere.js nang walang dagdag na pagbabago doon), pero sariling
    // (magkaibang) larawan/collisions - loadWorld() (map.js) ang
    // pumipili sa pagitan ng dalawang ito, batay sa isSnowWeather()
    // (calendar.js) sa MISMONG sandali na pinapasok/nire-reload ang
    // mundong ito.
    snowUrl: "./assets/map/snowtown.tmj",
    outdoor: true,
    spawn: { x: 570, y: 580 },
    noTrees: true,
    noStones: true,
    noGrassTufts: true,
    noPigs: true,
    noOaks: true,
  },

  // "grassmap" - ang PANGALAWA/HULING labas na mundo (kasama ng
  // "town") - hiling ng user: "2 na lang, town at grassmap" (tinanggal
  // na ang "starter"/"village"/"newmap"). DEFAULT_WORLD pa rin ito
  // (tingnan sa ibaba) - dito unang nag-i-spawn ang bagong manlalaro.
  // Sariling hand-drawn na larawan ang buong mapa (grassmap.png/
  // grassmap-no-trees.png, tulad ng town) - kaya "noTrees"/"noStones"/
  // "noGrassTufts"/"noPigs"/"noOaks" din, kaparehong dahilan/pattern ng
  // "town": nakadrawing na lahat ng bahay/bakod/puno/bato mismo sa
  // larawan, walang kailangang idagdag na random na spawn.
  grassmap: {
    url: "./assets/map/grassmap.tmj",
    // BAGO (hiling ng user: "nag add ako ng snowgrassmap.png... gusto
    // ko kapag nag niyebe is mapapalitan ng ganyang map") - parehong
    // pattern ng "town" sa itaas: sariling .tmj (snowgrassmap.tmj,
    // kinopya mula rito, tinuturo na lang ang mga tileset nito sa
    // snowgrassmap.png sa halip na grassmap.png - EKSAKTONG PAREHONG
    // laki/tiles/Collisions layer, dahil sinabi mismo ng user na
    // "png lang yun, nilagyan ko lang ng color pang niyebe") -
    // loadWorld()/checkWorldSnowSwap() (map.js) na ang bahalang
    // pumili/mag-swap dito batay sa isSnowWeather() (calendar.js).
    snowUrl: "./assets/map/snowgrassmap.tmj",
    outdoor: true,
    // Default spawn kung sakaling pumasok dito nang hindi sa pintuan
    // (hal. debug) - malapit sa "Town" na pabalik na gate (75,75).
    spawn: { x: 90, y: 135 },
    // BAGO (hiling ng user): "alisin mo na yung mga old pinetrees,
    // stones at grass, ako na mag lagay" - INILIPAT na mula sa
    // random/seeded na paglalagay (TREE_COUNT_PER_WORLD/
    // STONE_COUNT_PER_WORLD/GRASS_TUFT_COUNT_PER_WORLD) papunta sa
    // MANUAL/SPESIPIKONG paglalagay - tingnan ang "fixedTrees"/
    // "fixedStones"/"fixedGrassTufts" sa ibaba. Kaya "true" muna ang
    // tatlong "no___" na ito (walang random na pinetree/stone/grass sa
    // ngayon) - AWTOMATIKO namang babalik/lalabas ang mga choppable/
    // mineable node kapag nilagyan na ng laman ang fixedTrees/
    // fixedStones/fixedGrassTufts sa ibaba (hindi na sinusunod ang
    // "no___" na ito kapag may fixed list na - tingnan ang
    // generateResourceNodes sa resources.js).
    noTrees: true,
    noStones: true,
    noGrassTufts: true,
    noPigs: false,
    noOaks: true,
    // AYOS: naibalik na ng user ang tunay na "rocks" tile layer (may
    // totoong gid data, DEKORASYON lang ito - bahagi ng hand-painted
    // scene malapit sa bahay, HIWALAY ito sa bagong CHOPPABLE na bato
    // sa itaas) sa loob ng grassmap.tmj mismo - gumagamit ito ng
    // KAPAREHONG generic na "overlap instance" na sistema ng ibang
    // mundo (Y-sort/occlusion, tingnan ang OVERLAP_LAYER_NAMES sa
    // map.js) - AWTOMATIKO na itong gumagana ngayon na naayos na ang
    // sirang tileset path ng grassmap.tmj (tingnan ang paliwanag sa
    // itaas ng .tmj/.tsj file).
    grassmapTrees: false,

    // BAGO: dito mo ilalagay ang SPESIPIKONG col/row ng bawat
    // choppable na puno (pinetree), mineable na bato, at damo na gusto
    // mong lumabas sa grassmap - HALIP na random.
    //
    // Paano makakuha ng col/row (SA MISMONG SCREEN na, walang console/
    // inspect): may lalabas na "📍 Col: _, Row: _" sa ibaba mismo ng
    // health bar (kaliwang-itaas) habang naglalaro - live itong
    // nag-uupdate base sa kinatatayuan mo. Lumakad ka lang papunta sa
    // eksaktong lugar na gusto mong lagyan, tapos i-copy dito ang
    // numerong nakikita mo.
    //
    // "variant" (opsyonal, 0 kung wala) - alin sa mga larawan sa
    // GRASSMAP_TREE_VARIANT_PATHS (resources.js, pinetree ngayon ang
    // variant 0) o GRASSMAP_STONE_VARIANT_PATHS (stone1.png-stone6.png,
    // 0-5) ang gagamitin.
    //
    // AYOS (hiling ng user: "gawin mo na lang itong json bukod na file
    // para di pangit tignan") - INILIPAT na ang mahabang listahan papuntang
    // hiwalay na file (assets/map/grassmap-resources.json) - dito na lang
    // sa GRASSMAP_RESOURCES_LOADED (sa ibaba ng file na ito) ito
    // ini-fetch/inilalagay sa mismong object na ito (fixedTrees/
    // fixedStones/fixedGrassTufts) BAGO tuluyang mag-loadWorld (tingnan
    // ang paliwanag sa GRASSMAP_RESOURCES_LOADED at ang pagbabago sa
    // map.js) - kaya hindi na kailangang panatilihin dito ang mahabang
    // hardcoded na array.
  },

  // BAGO: "grassmap2" - bagong mundo (hiling ng user: "may ginawa akong
  // bagong map na grassmap2.png") - IISANG larawan lang (grassmap2.png,
  // KAPAREHONG sukat/tiles ng grassmap.png - 70x40 tile, 1120x640px)
  // ang ginamit bilang buong background (tingnan ang grassmap2.tmj/
  // tilesets/grassmap2-full1.tsj - parehong "buong-larawan-bilang-
  // tileset" na trick ng grassmap.png sa itaas).
  //
  // AYOS (natuklasan habang ginagawa - hindi literal na "kopya" ng
  // grassmap.png ang larawan): may SARILI itong bagong "mounth"/bundok
  // na guhit sa TOP-RIGHT (hindi umiiral sa grassmap.png - plain grass
  // lang doon) - kaya HINDI na kinopya ang Collisions object group ng
  // grassmap.tmj (mali/hindi tumutugma ang hugis) - sa halip,
  // TALAGANG sinuri (color/pixel analysis) ang bagong larawan mismo
  // para makabuo ng 10 collision rectangle na TUMUTUGMA sa TALAGANG
  // hugis ng bagong bundok na ito (tingnan ang Collisions object group
  // sa grassmap2.tmj).
  //
  // "lagyan mo ng trees rocks grass random area tag 350 each" - HINDI
  // gumagamit ng "fixedTrees"/"fixedStones"/"fixedGrassTufts" (manual/
  // partikular na lokasyon, gaya ng "grassmap") - dito, GENUINELY
  // RANDOM (placeNodes/generateGrassTufts, resources.js/grass.js), pero
  // gamit ang BAGONG per-world na "treeCount"/"stoneCount"/
  // "grassTuftCount" override, sa halip na ang DATING pandaigdig na
  // default na TREE_COUNT_PER_WORLD(11)/STONE_COUNT_PER_WORLD(20)/
  // GRASS_TUFT_COUNT_PER_WORLD(50) - tingnan ang paliwanag doon.
  //
  // AYOS (hiling ng user): "dapat yung trees, stones dapat yan yung
  // hindi fixed at dapat may sarili rin siyang json file" - HINDI na
  // dito naka-hardcode ang treeCount/stoneCount (dating 350/350) -
  // INILIPAT na papunta sa sariling JSON file (grassmap2-resources.json,
  // kaparehong pattern ng grassmap-resources.json - tingnan ang
  // GRASSMAP2_RESOURCES_LOADED sa ibaba ng file na ito), na siyang
  // nagta-target ngayon ng 50 (dating 350, hiling ding bawasan). PANATILI
  // pa rin RANDOM (hindi "fixed") ang mekanismo - JSON lang ang
  // "target count", hindi listahan ng eksaktong col/row.
  grassmap2: {
    url: "./assets/map/grassmap2.tmj",
    // Kaparehong bagong "snow" swap ng "grassmap" sa itaas - sariling
    // snowgrassmap2.tmj (kinopya mula sa grassmap2.tmj, tinuturo lang
    // ang tileset nito sa snowgrassmap2.png).
    snowUrl: "./assets/map/snowgrassmap2.tmj",
    outdoor: true,
    // Default spawn kung sakaling pumasok dito nang hindi sa portal
    // (hal. debug) - malapit sa portal patungong "grassmap" (top-left).
    spawn: { x: 90, y: 90 },
    noTrees: false,
    noStones: false,
    noGrassTufts: false,
    noOaks: true, // kaparehong "grassmap" - walang random/backdrop oak
    grassTuftCount: 350,
  },

  // BAGO: TUNAY na interior ng bahay sa grassmap (hiling ng user: "nag
  // dagdag ako ng room_grassmap sa rooms folder ilagay mo yan sa
  // grassmap") - hand-drawn na larawan (room_grassmap.png, in-upload ng
  // user sa assets/rooms/grassmap/, kinopya/pinagtabas dito bilang
  // room_grassmap.tsj+.tmj, kaparehong "buong-larawan-bilang-tileset"
  // na trick ng town.png/grassmap.png - tingnan ang paliwanag sa itaas
  // ng room_grassmap.tsj file kung bakit dito ito nakalagay sa halip
  // na sa assets/rooms/grassmap/: hardcoded sa engine (assets.js,
  // MAP_DIR) na laging sa assets/map/ hinahanap ang lahat ng tileset/
  // larawan ng mapa, kahit saan pa man nakatago ang mismong .tmj).
  //
  // AYOS: TINANGGAL na ang buong "houseInside" (dating generic
  // placeholder room na GUHIT LANG NG CODE - drawPlaceholderRoom,
  // hiling ng user: "yung static room na ginawa via code alisin mo
  // na ayoko na nun") - lahat ng interior ngayon ay dapat TUNAY na
  // hand-drawn na tileset/larawan, gaya nito.
  //
  // KONBENSIYON NG PANGALAN (hiling ng user, ITO ANG SUSUNDIN sa
  // BAWAT bagong bahay mula ngayon): <pangalan ng may-ari> + "House"
  // (camelCase, halimbawa: ang "grassmapHouse" na ito mismo, o
  // "manuelHouse"/"tanHouse" - tingnan ang bahagi 5/CLAUDE.md para sa
  // buong paliwanag).
  grassmapHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    // Malapit sa pintuan (tingnan ang DOORS sa ibaba, "Exit" na
    // pintuan ng grassmapHouse) - default lang ito kung sakaling
    // pumasok nang hindi sa pintuan (hal. debug).
    // AYOS (hiling ng user): dating naive percentage-scaling lang ito
    // (82,184) laban sa lumang (324,830) - MALI dahil FIXED na laki
    // ang player (56x64) habang lumiit nang husto ang silid (240x224
    // na lang) - kaya nasa LABAS na mismo ng sahig (lampas sa
    // ibaba ng bahay) ang paanan niya sa spawn na iyon. Ngayon,
    // direktang kinompyut base sa TALAGANG "butas"/pintuan sa
    // Collisions (tingnan ang "Exit" DOORS entry sa ibaba, x:63-102,
    // y:193-224) at sa getPlayerCollisionBox (collisions.js: paanan
    // lang, 45%/22% ng buong sprite) - nakatayo ang player EKSAKTO sa
    // GITNA (x) ng pintuan, at ilang piksel (~9px) LANG sa ITAAS ng
    // butas (y) - kaya't isa/dalawang hakbang lang pababa, maaabot na
    // niya agad ang "Exit" na butas (hiling ng user: "pagbaba niya ng
    // konti, doon mismo yung palabas").
    spawn: { x: 55, y: 120 },
  },

  // BAGONG 6 NA BAHAY sa loob ng "town" (hiling ng user: "yung sa town
  // is yung mga pinto is napapasukan lagyan mo rin ng name 6 house
  // yun so may different name") - VERIFIED ang eksaktong posisyon ng
  // bawat pintuan sa pamamagitan ng script (kinuha ang "door" tile
  // layer ng town.tmj, tapos kinumpara laban sa "Collisions" objects
  // nito para hanapin ang TALAGANG mabubuhusan/madadaanang bahagi sa
  // harap ng bawat pintuan - tingnan ang DOORS sa ibaba).
  //
  // WALA PA (SA NGAYON) NA SARILING HIWALAY NA ART/TILESET ang bawat
  // isa - GINAGAMIT MUNA ang PAREHONG "room_grassmap.tmj" (kaparehong
  // interior ng grassmapHouse) bilang PANSAMANTALANG laman ng lahat ng
  // 6 - kaya PAREHONG-PAREHO ang itsura ng loob ng bawat isa sa
  // ngayon. Kapag may sarili nang natatanging guhit/Tiled export ang
  // isang partikular na bahay balang araw, PALITAN LANG ang "url" ng
  // kaukulang entry dito papunta sa bagong .tmj (gaya ng ginawa noon
  // sa grassmapHouse mismo, tingnan sa itaas) - hindi na kailangang
  // galawin ang DOORS/ibang bahagi ng code.
  manuelHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
  josephHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
  mariaHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
  escanorHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
  jillianHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
  matildaHouse: {
    url: "./assets/map/room_grassmap.tmj",
    outdoor: false,
    spawn: { x: 55, y: 120 },
  },
};

// GRASSMAP ang MAIN MAP ng laro (hiling ng user) - dito na unang
// nag-i-spawn ang player kapag binuksan ang laro.
const DEFAULT_WORLD = "grassmap";

// Bawat pintuan: kapag nasa loob ka ng "area" at pinindot mo ang E,
// dadalhin ka sa mundong "to", sa posisyong "spawn".
//
// Ang mga sukat ay nasa world pixels. Ang pintuan ng bahay sa nayon ay
// nasa gitna ng harapan nito - yung daanan sa pagitan ng dalawang poste
// ng porch.
//
// AYOS: dating naka-hardcode na (x,y) ang "returnSpawn" ng bawat labas
// na pintuan (village/newmap) - SANHI ito ng bug na "hindi sa mismong
// pinto napupunta" ang player pag-"Lumabas" mula sa houseInside: nung
// ginawang FULLY COLLIDABLE ang buong door.area (map.js,
// buildHouseWallCollisions - dating kalahati lang), nagiging NASA
// LOOB NG SOLID NA PADER na ang mga lumang hardcoded coordinate na
// iyon - kaya nagiging kakaiba/nalilihis ang posisyon ng player
// pagkalabas. AYOS: TINANGGAL na ang hardcoded na "returnSpawn" -
// palagi na lang KINOKOMPYUTA (getDoorExitSpawn, sa ibaba) TALAGA sa
// LABAS/HARAP ng door.area mismo, kaya laging TAMA/naka-overlap sa
// harap ng bahay ang player pagkalabas, kahit anong laki/posisyon pa
// ng pintuan.
const DOORS = [
  // Gate patungong "town" mula sa "grassmap" (at kabaliktaran) - ito na
  // ang TANGING koneksyon sa pagitan ng 2 labas na mundo, ngayong
  // tinanggal na ang "newmap" (hiling ng user).
  {
    world: "town",
    area: { x: 395, y: 0, width: 50, height: 50 },
    to: "grassmap",
    spawn: { x: 80, y: 570 },
    label: "Grass Path",
    auto: true,
  },

  {
    world: "grassmap",
    area: { x: 75, y: 635, width: 50, height: 50 },
    to: "town",
    spawn: { x: 390, y: 10 },
    label: "Town",
    auto: true,
  },

  // BAGO (hiling ng user): portal sa pagitan ng "grassmap" at
  // "grassmap2" (bagong mundo, tingnan ang WORLDS.grassmap2 sa itaas) -
  // "yung portal niya sa grassmap is top right column 3 tapos row 3
  // papuntang grassmap2.png tapos yung sa grassmap2.png na portal naman
  // is nasa top left col 3 row 3" - kaparehong-pareho ng "auto: true"
  // na gawi ng "Grass Path"/"Town" na pares sa itaas (parehong outdoor,
  // basta madaanan lang, awtomatikong tumatawid).
  //
  // AYOS (bug fix - hiling ng user: "wala pa yung portal"): dating
  // masyadong MALIIT (32x32px lang, 2x2 tile) at nakadikit mismo sa
  // sulok ng mapa ang area - dahil naka-clamp ang player.x/y papasok
  // (hindi lumalagpas sa gilid ng mapa) AT ang collision box ng player
  // (getPlayerCollisionBox, collisions.js) ay maliit/naka-anchor sa
  // PAANAN (hindi ang buong sprite), ang TALAGANG "puwedeng-maabot" na
  // sulok ng trigger area ay sobrang liit/mahirap tamaan nang eksakto -
  // parang "walang portal" sa paningin ng manlalaro. NILAKI na ngayon
  // (buong kanto ng mapa, ~9x6 tile) para hindi na kailangang maging
  // pixel-perfect - basta pumunta sa pangkalahatang lugar na iyon
  // (itaas-kanan ng grassmap / itaas-kaliwa ng grassmap2), awtomatiko
  // nang tatawid. VERIFIED din laban sa BAGONG "mounth" na hugis sa
  // grassmap2.png (Collisions object group sa grassmap2.tmj) - walang
  // overlap ang parehong area dito sa bagong bundok (nasa mas mababang
  // parte/mas kanan ang bundok, tingnan ang paliwanag sa itaas).
  {
    world: "grassmap",
    area: { x: 1100, y: 90, width: 144, height: 96 }, // buong itaas-kanang sulok
    to: "grassmap2",
    spawn: { x: 15, y: 40 },
    label: "Grassmap 2",
    auto: true,
  },

  {
    world: "grassmap2",
    area: { x: -130, y: 20, width: 144, height: 96 }, // buong itaas-kaliwang sulok
    to: "grassmap",
    spawn: { x: 1030, y: 90 },
    label: "Grassmap",
    auto: true,
  },

  // Pintuan ng bahay na nasa grassmap.tmj (VERIFIED sa pamamagitan ng
  // script/pixel-inspection laban sa TALAGANG larawan, grassmap.png):
  // ang TUNAY na pintuan (bukas na daanan sa pagitan ng mga
  // naka-Collisions na pader sa grassmap.tmj mismo) ay nasa
  // humigit-kumulang x:237-267, y:460-496.
  // AYOS (hiling ng user): "sa town at sa grassmap na bahay yung mga
  // pinto papasok/palabas is dapat need na mag press 'e' key" - kaya
  // TINANGGAL ang "auto: true" ng parehong Enter/Exit ng grassmapHouse
  // (dating basta madaanan lang, awtomatiko nang papasok/lumalabas) -
  // kailangan na ngayong pindutin ang E, kaparehong-pareho ng gawi ng
  // 6 bahay sa town (Entry #62). Ang gate patungong "town"
  // ("Grass Path"/"Town" sa itaas, hindi ito "bahay") ay HINDI kasama
  // dito - nananatiling "auto" iyon.
  {
    world: "grassmap",
    area: { x: 237, y: 440, width: 30, height: 40 },
    to: "grassmapHouse",
    spawn: { x: 60, y: 135 },
    returnWorld: "grassmap",
    label: "Enter",
  },

  {
    world: "grassmapHouse",
    // EKSAKTONG kapareho ng BUTAS (walang Collisions) sa bandang ibaba
    // ng room_grassmap.tmj - tingnan ang "bottom wall left"/"bottom
    // wall right" doon.
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  // =========================
  // 6 NA BAHAY sa "town" (hiling ng user)
  // =========================
  //
  // Bawat "area" dito ay VERIFIED sa pamamagitan ng script (Python +
  // Pillow): kinuha ang eksaktong (col,row) ng bawat pintuang
  // naka-guhit sa "door" tile layer ng town.tmj (6 magkakahiwalay na
  // grupo ng tile ang natagpuan doon - eksaktong tumutugma sa 6 bahay
  // na may bukas na pinto sa larawan mismo), tapos kinumpara laban sa
  // "Collisions" objectgroup para hanapin ang TALAGANG bukas/
  // madadaanang bahagi SA HARAP (ilalim) ng bawat pintuan iyon
  // (kaparehong konsepto ng "VERIFIED" na paraan na ginamit na noon sa
  // ibang bahagi ng codebase - tingnan ang CLAUDE.md) - kaya
  // GARANTISADONG hindi ito nasa loob ng pader/hindi maaabot.
  //
  // KONBENSIYON NG PANGALAN (basahin din sa CLAUDE.md): <pangalan> +
  // "House" - ito ang gamitin sa BAWAT bagong bahay mula ngayon.
  //
  // AYOS (hiling ng user): ang 6 pintuang PAPASOK dito ay HINDI na
  // "auto" - kailangan na namang pindutin ang E (kaparehong dating
  // gawi bago ginawang "auto" lahat ng pintuan) - at ang "label" ng
  // bawat isa ay ngayon ang PANGALAN ng may-ari (hal. "Joseph") sa
  // halip na generic na "Enter" - ito ang lumalabas sa "E - <label>"
  // na paalala sa ilalim ng screen (drawDoorPrompt, draw.js - muling
  // pinagana, tingnan doon).
  //
  // BAGONG AYOS (hiling ng user: "papasok/palabas is dapat need na mag
  // press 'e' key"): ang "Exit" na mga pintuan (palabas) ng bawat
  // bahay ay TINANGGALAN NA RIN ngayon ng "auto: true" - dating
  // awtomatiko itong lumalabas basta madaanan, kailangan na ngayong
  // pindutin din ang E papalabas, kaparehong-pareho ng papasok.
  {
    world: "town",
    area: { x: 216, y: 176, width: 24, height: 24 },
    to: "manuelHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Manuel",
  },
  {
    world: "manuelHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  {
    world: "town",
    area: { x: 520, y: 192, width: 24, height: 24 },
    to: "josephHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Joseph",
  },
  {
    world: "josephHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  {
    world: "town",
    area: { x: 730, y: 176, width: 30, height: 20 },
    to: "mariaHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Maria",
  },
  {
    world: "mariaHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  {
    world: "town",
    area: { x: 950, y: 168, width: 22, height: 18 },
    to: "escanorHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Escanor",
  },
  {
    world: "escanorHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  {
    world: "town",
    area: { x: 908, y: 360, width: 20, height: 18 },
    to: "jillianHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Jillian",
  },
  {
    world: "jillianHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },

  {
    world: "town",
    area: { x: 280, y: 432, width: 32, height: 24 },
    to: "matildaHouse",
    spawn: { x: 55, y: 120 },
    returnWorld: "town",
    label: "Matilda",
  },
  {
    world: "matildaHouse",
    area: { x: 63, y: 193, width: 39, height: 31 },
    to: "__return__",
    spawn: null,
    label: "Exit",
  },
];

// Kinukwenta ang EKSAKTONG lugar SA HARAP (LABAS, ilalim) ng isang
// partikular na pintuan - dito idinadala pabalik ang player kapag
// "Lumabas" siya mula sa isang interior (grassmapHouse, ang 6 bahay sa
// town, atbp). Awtomatiko itong batay sa "area" ng pintuan mismo
// (hindi na hardcoded na numero) - kaya laging TALAGANG naka-overlap/
// nakatayo mismo sa harap ng pinto ang player pagkalabas, kahit anong
// laki/posisyon pa ng door.area.
//
// NAAYOS NA BUG (hiling ng user: "yung paglabas ng bahay ni manuel sa
// ibang lugar pumupunta"): dating HARDCODED ("4"/"12"/"16") dito ang
// offset/laki ng collision box ng player - EKSAKTONG kopya noon ng
// LUMANG FIXED-PIXEL na getPlayerCollisionBox (x+4, y+12, width:16,
// height:10, para sa 16x24 na ORIHINAL na sprite). Nang ginawang
// PROPORTIONAL (45%/22% ng player.width/height, tingnan ang Entry #60
// sa CLAUDE.md) ang collisions.js dahil pinalaki na ang character
// (56x64), NAIWAN/hindi na-update ang function na ITO - kaya MALI na
// ang kinukwentang posisyon (humigit-kumulang 52px masyadong PABABA,
// at 16px masyadong PAKANAN, kumpara sa TALAGANG dapat na posisyon sa
// harap ng pintuan) - kaya "ibang lugar"/hindi sa tapat ng pinto ang
// nilalabasan ng player, LALO na kapag maliit ang bahay/madaling
// tumama sa ibang bagay (hal. collision ng KAPITBAHAY na bahay) dahil
// sa laking pagkakalayo.
//
// AYOS: sa halip na basta mag-hardcode ulit ng bagong numero (parehong
// klase ng bug ang posibleng maulit balang araw kapag nagbago pa ulit
// ang laki ng player), dito na DIREKTANG ikino-compute ang kailangang
// (x,y) ng player GAMIT ang TALAGANG getPlayerCollisionBox (base sa
// player.width/height mismo) - hindi na kailangang panatilihin pa ang
// magkahiwalay na "kopya" ng mga numerong ito.
function getDoorExitSpawn(door) {
  const area = door.area;

  // Ang collision box ay computed base sa (playerX, playerY) - dahil
  // KNOWN na ang RELASYON nito (proportional offset, tingnan
  // getPlayerCollisionBox sa collisions.js), pwede nating i-REVERSE
  // ito: sample muna sa (0,0) para makuha ang eksaktong offset ng box
  // mula sa top-left ng sprite, tapos i-subtract iyon sa gustong
  // TALAGANG (x,y) ng collision box.
  const sampleBox =
    typeof getPlayerCollisionBox === "function"
      ? getPlayerCollisionBox(0, 0)
      : { x: 0, y: 0, width: 0, height: 0 };

  // NAAYOS NA BUG (hiling ng user: "kapag lumabas ako sa grasshouse,
  // sa malapit sa portal ng town napupunta" - VERIFIED): dating "4px"
  // LANG (walang kinalaman sa TAAS ng collision box ng player) ang
  // buffer dito - pero ang BUONG door.area ay FULLY COLLIDABLE ngayon
  // (buildHouseWallCollisions, map.js). Dahil mas MATAAS ang collision
  // box ng player (~14px, base sa getPlayerCollisionBox) kaysa sa
  // dating 4px na buffer, ang ITAAS ng box ay NANATILING NASA LOOB pa
  // rin ng collidable na door.area kahit "labas" na ang ilalim/paanan -
  // kaya BUMABANGGA agad ang player sa MISMONG pintuan sa sandali ng
  // pag-spawn. Sinusuri ito ng validatePlayerPosition() (player.js)
  // pagkatapos mag-loadWorld - kapag "blocked"/bumabangga ang bagong
  // posisyon, IBINABALIK nito ang player sa GENERIC na world.spawn
  // (hal. grassmap spawn, malapit sa "Town" gate) - kaya "sa ibang
  // lugar" (malapit sa portal ng town) ang TALAGANG napupuntahan, hindi
  // sa harap ng pintuan.
  //
  // AYOS: ang buffer ay dapat KASING TAAS (o mas malaki pa) ng buong
  // collision box ng player - para GARANTISADONG nasa LABAS na ng
  // BUONG door.area (hindi lang ang ilalim, kundi ang ITAAS din nito)
  // ang buong collision box, kahit gaano pa kalaki/liit ang player sa
  // hinaharap. Dagdag pang 2px na "tunay" na puwang (hindi lang
  // eksaktong magkadikit sa gilid) para talagang WALANG-BANGGAAN.
  const exitBuffer = sampleBox.height + 2;

  // Gustong X ng GITNA ng collision box: eksaktong nasa GITNA ng
  // pintuan (horizontally).
  const desiredBoxCenterX = area.x + area.width / 2;
  // Gustong Y ng ILALIM (paanan) ng collision box: buffer PABABA mula
  // sa ilalim ng pintuan - sapat na ngayon para lumabas din ang ITAAS
  // ng collision box sa buong door.area (tingnan ang paliwanag sa
  // itaas ng exitBuffer).
  const desiredBoxBottomY = area.y + area.height + exitBuffer;

  return {
    x: Math.round(desiredBoxCenterX - sampleBox.width / 2 - sampleBox.x),
    y: Math.round(desiredBoxBottomY - sampleBox.height - sampleBox.y),
  };
}

// Ang mundong kasalukuyang nilalaro. Itinatakda ito ng loadWorld sa
// map.js.
let currentWorld = null;

// Saang LABAS na mundo (at anong posisyon doon) dapat bumalik ang
// pintuang "Lumabas" ng BAWAT interior (houseInside, grassmapHouse,
// at kung anupaman pang idagdag) - dinamiko ito, dahil MARAMING labas
// na mundo (village, newmap, grassmap, ...) ang puwedeng magtaglay ng
// sariling pintuan PAPASOK sa isang interior.
//
// AYOS (bug fix): dating IISANG global variable (houseReturnWorld/
// houseReturnSpawn) lang ang ginagamit ng LAHAT ng interior - kaya
// kung pumasok ka muna sa isang interior (hal. houseInside via
// newmap), tapos pumasok ka sa IBANG interior (hal. grassmapHouse) na
// hindi TALAGANG na-detect/na-trigger nang tama ang pintuang
// papasukan (hal. naka-collide muna sa pader bago makapasok, o anumang
// timing issue), hindi na-uupdate ang naka-tabing return info - kaya
// LUMANG value pa rin (hal. "newmap") ang ginagamit paglabas, sa halip
// na "grassmap". Ngayon, BAWAT interior (WORLDS.*.to na hindi outdoor)
// ay may SARILI/HIWALAY na naka-tabing return info sa
// INTERIOR_RETURN_INFO (keyed sa pangalan ng interior world mismo) -
// kaya hindi na maaaring mag-overwrite/magkalat sa isa't isa ang mga
// interior.
const INTERIOR_RETURN_INFO = {};

function setInteriorReturnInfo(interiorWorldName, returnWorld, returnSpawn) {
  INTERIOR_RETURN_INFO[interiorWorldName] = {
    world: returnWorld,
    spawn: returnSpawn,
  };
}

function getInteriorReturnInfo(interiorWorldName) {
  return INTERIOR_RETURN_INFO[interiorWorldName] || null;
}

// LIGTAS na "saan babalik" kung sakaling ang kasalukuyang interior ay
// wala pang naka-tabing return info sa INTERIOR_RETURN_INFO (hal.
// direktang na-spawn/na-migrate dito, hindi dumaan sa coded na
// pintuan) - sa halip na hindi gumana ang "Lumabas" (o mag-crash).
//
// NAAYOS NA BUG (hiling ng user: "kapag lalabas na ng pinto sa
// grassmapHouse, sa ibang lugar napupunta - dapat sa tapat ng door ng
// bahay outdoor"): ito ang mismong nangyayari kapag ang laro ay
// nag-reload ng page HABANG nasa LOOB ka pa ng isang interior (hal.
// grassmapHouse) - direktang pumapasok doon ang loadWorld(savedWorld)
// sa ibaba ng file na ito, HINDI dumaraan sa "Enter" na pintuan - kaya
// WALANG naitatabing INTERIOR_RETURN_INFO["grassmapHouse"] sa fresh na
// session na ito (in-memory na variable lang ito, nawawala tuwing
// mag-reload). Dating basta bumabalik na lang ito sa DEFAULT_WORLD
// ("grassmap") sa GENERIC na spawn nito (malapit sa "Town" na gate,
// x:90,y:135) - malayo iyon sa TALAGANG pintuan ng bahay, kaya "ibang
// lugar" ang napupuntahan.
//
// AYOS: sa halip na basta DEFAULT_WORLD, HANAPIN muna sa DOORS kung
// alin ang TALAGANG pintuan papasok sa interior na ito
// (door.to === interiorWorldName, may returnWorld) - kapag may
// natagpuan, gamitin ang SARILI nitong returnWorld at kompyutahin
// (getDoorExitSpawn) ang eksaktong posisyon SA TAPAT ng pintuang iyon
// mismo sa labas - kaparehong-pareho ng ginagawa kapag TALAGANG dumaan
// ka sa pintuan (setInteriorReturnInfo, update.js). DEFAULT_WORLD na
// lang ang GAGAMITIN kapag WALANG mahanap na kaukulang pintuan (hal.
// lumang/hindi kilalang world name mula sa matandang save).
function getFallbackInteriorReturnInfo(interiorWorldName) {
  const entryDoor = DOORS.find(
    (door) => door.to === interiorWorldName && door.returnWorld,
  );

  if (entryDoor) {
    return {
      world: entryDoor.returnWorld,
      spawn: getDoorExitSpawn(entryDoor),
    };
  }

  return {
    world: DEFAULT_WORLD,
    spawn: WORLDS[DEFAULT_WORLD] ? WORLDS[DEFAULT_WORLD].spawn : null,
  };
}

// Kadarating lang ba natin sa pintuan mula sa kabilang mundo?
//
// Kailangan ito dahil sa pintuan MISMO tayo lumalabas - kung hindi,
// malayo sa pinto ang lalabasan mo, na pangit tingnan. Pero kung
// nakatayo ka sa pinto pagkalabas mo, isang pindot lang ng E ay
// mapapabalik ka agad - parang hindi ka nakalabas.
//
// Kaya habang nakatayo ka pa rin sa pintuang pinanggalingan mo,
// binabalewala muna ang E. Kapag nakaalis ka na sa pintuan, gagana
// ulit siya - kaya puwede kang bumalik anumang oras, basta lumayo ka
// muna kahit isang hakbang.
let arrivedAtDoor = false;

function getWorld() {
  return currentWorld ? WORLDS[currentWorld] : null;
}

function isIndoors() {
  const world = getWorld();

  return Boolean(world) && !world.outdoor;
}

// AYOS: dating kailangang TALAGANG mag-overlap ang collision box ng
// player sa loob ng door.area para gumana ang "E" prompt - pero
// ngayon, FULLY COLLIDABLE na ang buong pintuan (tingnan ang
// buildHouseWallCollisions sa map.js) para hindi na literal na
// makapasok ang player sa loob ng bahay mula sa labas - kaya kailangan
// ng DAGDAG na "reach margin" dito (DOOR_REACH_MARGIN_PX), para pag
// nakatayo ang player DIKIT sa pintuan (ang pinakamalapit na puwede
// niyang maabot dahil sa bagong collision), MAKIKITA/MAGAGAMIT pa rin
// niya ang "Pumasok" na prompt, kahit hindi na TALAGANG naka-overlap
// ang box niya sa door.area mismo.
const DOOR_REACH_MARGIN_PX = 6;

// Aling pintuan ang MAAABOT ng player ngayon? Ang ginagamit natin ay
// ang collision box ng player (yung paanan), hindi ang buong sprite -
// para kailangan mong TALAGANG lumapit sa pintuan, hindi lang madaanan
// ng ulo mo.
function getDoorUnderPlayer() {
  if (!currentWorld) return null;

  const box = getPlayerCollisionBox();

  for (const door of DOORS) {
    if (door.world !== currentWorld) continue;

    const area = door.area;

    const touching =
      box.x < area.x + area.width + DOOR_REACH_MARGIN_PX &&
      box.x + box.width > area.x - DOOR_REACH_MARGIN_PX &&
      box.y < area.y + area.height + DOOR_REACH_MARGIN_PX &&
      box.y + box.height > area.y - DOOR_REACH_MARGIN_PX;

    if (!touching) continue;

    // BAGO (hiling ng user): dapat NAKAHARAP ang player sa pintuan
    // bago niya ito magamit gamit ang E (isPlayerFacingWorldPoint,
    // collisions.js) - HINDI ito ipinapataw sa mga "auto" na pintuan
    // (hal. ang "Grass Path"/"Town" na gate sa pagitan ng 2 labas na
    // mundo) - basta madaanan lang iyon (kahit anong direksyon), dahil
    // hindi naman ito "E to use" na interaction.
    if (!door.auto && typeof isPlayerFacingWorldPoint === "function") {
      const targetX = area.x + area.width / 2;
      const targetY = area.y + area.height / 2;

      if (!isPlayerFacingWorldPoint(targetX, targetY)) continue;
    }

    return door;
  }

  return null;
}

// Tinatawag kada frame. Kapag nakaalis na ang player sa pintuang
// pinanggalingan niya, gumagana na ulit ang E.
function updateDoorState() {
  if (arrivedAtDoor && !getDoorUnderPlayer()) {
    arrivedAtDoor = false;
  }
}

// Puwede na bang gamitin ang pintuang tinatapakan ngayon?
function getUsableDoor() {
  if (arrivedAtDoor) return null;

  return getDoorUnderPlayer();
}

// AYOS: TINANGGAL na ang buong "PANSAMANTALANG SILID" na sistema
// (drawPlaceholderRoom + ROOM_* na constants) - hiling ng user: "yung
// static room na ginawa via code alisin mo na ayoko na nun". Iyon ang
// dating GUHIT-LANG-NG-CANVAS na silid (walang tunay na tileset/larawan
// - kahoy na kahon lang, ginagamit noon ng "houseInside", na TINANGGAL
// na rin) - lahat ng interior ngayon ay dapat may TUNAY na hand-drawn
// na Tiled tileset/larawan (gaya ng room_grassmap.tmj) - walang
// "placeholderRoom" flag na dapat idagdag pa sa alinmang WORLDS entry
// mula ngayon.

// =========================
// GRASSMAP RESOURCES (fixedTrees/fixedStones/fixedGrassTufts) - BUKOD
// NA JSON FILE (hiling ng user: "gawin mo na lang itong json bukod na
// file para di pangit dignan")
// =========================
//
// Dating direktang naka-hardcode sa loob ng WORLDS.grassmap (sa itaas)
// ang mahabang listahan ng col/row ng bawat puno/bato/damo - inilipat
// na ito papunta sa assets/map/grassmap-resources.json (mas malinis
// tingnan ang worlds.js ngayon).
//
// Dahil isang beses lang naman ito na-fetch/binabasa (hindi kagaya ng
// .tmj na map na dumaraan sa loadWorld() kada pagpasok sa mundo), at
// KAILANGAN nang MAAGA (bago pa man mag-generate ng resource nodes ang
// resources.js), dito na ito direktang ini-fetch sa TOP LEVEL ng file
// na ito - ang RESULTA (Promise) ay itinatago sa GRASSMAP_RESOURCES_LOADED
// (global) para MAAARING hintayin/i-await ito ng ibang script (tingnan
// ang paggamit nito sa map.js, BAGO tuluyang tawagin ang UNANG
// loadWorld() ng laro) - kaya GARANTISADONG naka-populate na ang
// fixedTrees/fixedStones/fixedGrassTufts ng grassmap SA ORAS na
// kailangan na ito ng resources.js/grass.js, kahit asynchronous ang
// fetch.
const GRASSMAP_RESOURCES_URL = "./assets/map/grassmap-resources.json";

// BAGO (hiling ng user): "json para sa mga di-fixed na trees/stones,
// para makapag-test" - HIWALAY na file ito
// (grassmap-resources-test.json), may sariling "trees"/"stones" key
// (WALANG "fixed" sa pangalan, di gaya ng fixedTrees/fixedStones sa
// itaas) - tingnan ang buildResourceNodes() sa resources.js
// (world.trees/world.stones) kung paano ito hinahalo/idinaragdag sa
// dulo ng fixedTrees/fixedStones. Layunin lang nito: magkaroon ng
// bukod na lugar na maidadagdag/aalisan ng "test" na puno/bato nang
// hindi kinakailangang galawin ang opisyal na grassmap-resources.json.
const GRASSMAP_RESOURCES_TEST_URL = "./assets/map/grassmap-resources-test.json";

// AYOS (hiling ng user: "walang lumitaw" pagkatapos mag-dagdag sa
// JSON) - WALANG cache-busting dati ang fetch na ito (hindi tulad ng
// .tmj na map loading - map.js, na may kasamang CACHE_BUST/"?v=..." sa
// bawat fetch nito) - posibleng LUMANG naka-cache na bersyon pa rin
// (mula sa nakaraang pagbukas) ang binabasa ng browser sa halip na ang
// TALAGANG bagong laman ng file, kahit na-save mo na ang bagong
// idinagdag na fixedTrees/fixedStones/fixedGrassTufts. Kasama na rito
// ang PAREHONG CACHE_BUST (assets.js, "?v=" + Date.now()) - GARANTISADO
// nang laging sariwa/bago ang binabasa nito kada pag-reload.
const GRASSMAP_RESOURCES_LOADED = Promise.all([
  fetch(GRASSMAP_RESOURCES_URL + CACHE_BUST)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Hindi ma-load ang grassmap-resources.json: " + response.status,
        );
      }

      return response.json();
    })
    .then((data) => {
      // Direktang idinidikit (Object.assign) sa WORLDS.grassmap ang
      // laman ng JSON - kaya PAREHONG-PAREHO pa rin ang gawi ng
      // resources.js/grass.js (world.fixedTrees/fixedStones/
      // fixedGrassTufts), parang naka-hardcode pa rin ito dati.
      Object.assign(WORLDS.grassmap, data);
    })
    .catch((error) => {
      // Kung sakaling mabigo ang fetch (hal. offline/naka-block), huwag
      // na lang basta i-crash ang buong laro - basta magiging "walang
      // fixedTrees/fixedStones/fixedGrassTufts" na lang (parehong gawi
      // ng dating wala pang laman ang mga field na ito).
      console.error(error);
    }),

  // BAGO: pareho ring fetch, PERO sa "test" na file (trees/stones,
  // walang "fixed" sa pangalan) - HIWALAY na Object.assign call, para
  // kung sakaling mabigo ito (hal. wala/na-delete ang test file),
  // hindi maapektuhan ang pag-load ng OPISYAL na
  // grassmap-resources.json sa itaas.
  fetch(GRASSMAP_RESOURCES_TEST_URL + CACHE_BUST)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Hindi ma-load ang grassmap-resources-test.json: " + response.status,
        );
      }

      return response.json();
    })
    .then((data) => {
      Object.assign(WORLDS.grassmap, data);
    })
    .catch((error) => {
      console.error(error);
    }),
]);

// AYOS (hiling ng user): "dapat may sarili rin siyang json file" - kaparehong
// pattern ng GRASSMAP_RESOURCES_LOADED sa itaas, pero para sa "grassmap2"
// (treeCount/stoneCount, HINDI fixedTrees/fixedStones - RANDOM pa rin
// ang paglalagay, "target count" lang ang laman ng JSON na ito).
const GRASSMAP2_RESOURCES_URL = "./assets/map/grassmap2-resources.json";

const GRASSMAP2_RESOURCES_LOADED = fetch(GRASSMAP2_RESOURCES_URL + CACHE_BUST)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        "Hindi ma-load ang grassmap2-resources.json: " + response.status,
      );
    }

    return response.json();
  })
  .then((data) => {
    Object.assign(WORLDS.grassmap2, data);
  })
  .catch((error) => {
    // Hindi "default" na mundo ang grassmap2 (hindi ito ang unang
    // pinapasukan ng bagong manlalaro) - kaya kahit sakaling mabigo ang
    // fetch na ito, hindi na kailangang i-gate/hintayin pa ang unang
    // loadWorld() ng laro (tingnan ang GRASSMAP_RESOURCES_LOADED sa
    // map.js - PARA lang iyon sa "grassmap", ang DEFAULT_WORLD).
    console.error(error);
  });
