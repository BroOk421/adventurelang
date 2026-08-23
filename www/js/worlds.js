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
  // Bagong blangkong mapa - purong niyebe, walang laman. Dito muna
  // nag-i-spawn ang player habang ginagawa ang bagong mapa sa Tiled.
  // Buksan ang assets/map/starterMap.tmj sa Tiled para lagyan ng laman.
  // Ang lumang nayon (snowMap.tmj) ay buo pa rin sa ibaba - ibalik lang
  // ang DEFAULT_WORLD sa "village" kung gusto mong bumalik doon.
  starter: {
    url: "./assets/map/starterMap.tmj",
    outdoor: true,
    spawn: { x: 312, y: 228 },
  },

  village: {
    url: "./assets/map/snowMap.tmj",
    outdoor: true,
    spawn: { x: 368, y: 268 },
  },

  // Bagong mapa (newmap.tmj) - kaparehong pattern/pipeline ng "village"
  // (bahay, puno, niyebe kapag snow weather - lahat awtomatikong gumagana
  // dahil sundin lang nito ang parehong Tiled layer names/tileset setup
  // at "outdoor: true"). Random na BATO (stones) na rin dito ngayon,
  // kaparehong gawi/dami ng puno (STONE_COUNT_PER_WORLD, resources.js) -
  // dating naka-"noStones: true" ito (kaya walang nakikitang batong
  // gumagala sa mapa), pero base sa bagong hiling, dapat pare-pareho
  // ang random spawn ng bato at puno, kaya tinanggal na ang flag.
  newmap: {
    url: "./assets/map/newmap.tmj",
    outdoor: true,
    spawn: { x: 400, y: 300 },
  },

  // Bagong world - "town" - hiwalay na maliit na bayan, inaabot mula
  // sa isang bagong "blackhole" gate sa TAAS-GITNA ng newmap (tingnan
  // ang DOORS sa ibaba at ang blackhole code sa decor.js). Gumagamit
  // na ng tunay na larawan (town.png, tinuturo ng tilesets/town.tsj)
  // ang buong mapa - kaya WALANG kailangan pang random na puno/bato/
  // damo/baboy (nakadrawing na lahat ng iyon mismo sa larawan) -
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

  houseInside: {
    url: "./assets/map/houseInside.tmj",
    outdoor: false,
    spawn: { x: 152, y: 176 },
    // PANSAMANTALA: walang interior tiles ang Snow.png (puro labas lang
    // ang laman nito - puno, bato, bakod, harap ng bahay). Kaya
    // iginuguhit natin ang silid mula sa mismong collision boxes.
    // Kapag nakagawa ka na ng tunay na interior sa Tiled, alisin mo na
    // lang ang linyang ito at gagana na agad ang normal na tiles.
    placeholderRoom: true,
  },
};

// Balik sa village ang spawn - ang "starter" ay nariyan pa rin bilang
// extra na blangkong mapa kung kailangan mo ng pagsusubukan.
const DEFAULT_WORLD = "newmap";

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
  {
    world: "village",
    area: { x: 184, y: 404, width: 26, height: 44 },
    to: "houseInside",
    spawn: { x: 152, y: 176 },
    // Saan mundo ka babalik kapag "Lumabas" ka sa houseInside, kung
    // PUMASOK ka gamit ITONG partikular na pintuan - ang eksaktong
    // POSISYON naman (dating "returnSpawn" dito) ay kinokompyuta na
    // lang ngayon mula sa "area" mismo (getDoorExitSpawn).
    returnWorld: "village",
    label: "Pumasok",
    // Hindi na kailangang pindutin ang E - awtomatiko nang lumilipat
    // ng mundo sa sandaling madikit ng player ang "area" (kagaya ng
    // blackhole gate sa ibaba) - hiling ng user.
    auto: true,
  },

  // Pintuan ng BABANG bahay sa newmap.tmj (ang bahay na malapit sa
  // spawn, HINDI ang malaking bahay sa itaas na walang bukas pang
  // pintuan) - papasok din sa parehong houseInside, pero babalik dito
  // sa newmap (hindi sa village) paglabas.
  {
    world: "newmap",
    area: { x: 190, y: 420, width: 26, height: 44 },
    to: "houseInside",
    spawn: { x: 152, y: 176 },
    returnWorld: "newmap",
    label: "Pumasok",
    auto: true,
  },

  // BAGONG GATE patungong "town" - umiikot na BLACKHOLE (decor.js) -
  // BUMALIK NA SA LABAS (newmap), sa TAAS-GITNA ng mapa - hiling ng
  // user (dating naka-loob ng bahay). Ang eksaktong "area" dito ay
  // dapat kaparehong-kapareho ng getTownGateBlackholeCenter() +
  // TOWN_GATE_BLACKHOLE_SIZE sa decor.js: center = ((70/2)*16, gitna
  // ng row 2) = (560, 40), size 16 - kaya box 552,32,16,16. "auto:
  // true" - hindi na kailangang pindutin ang E, basta lang MADAANAN.
  {
    world: "newmap",
    area: { x: 552, y: 32, width: 16, height: 16 },
    to: "town",
    spawn: { x: 560, y: 580 },
    label: "Town",
    auto: true,
  },

  // Ang kabaligtaran ng gate sa itaas - mula sa "town" pabalik sa
  // "newmap", ilang hakbang LAYO mula sa gate mismo paglabas (para
  // hindi agad ma-trigger ulit pabalik sa town - "arrivedAtDoor" na
  // rin ang bahalang mag-guard habang nakatayo pa roon). "auto: true"
  // din. Ang area naman dito ay malapit sa spawn point na ginagamit
  // ng newmap->town gate sa itaas (560,580), para sa may lugar
  // talagang pagbabalikan sa loob ng town.
  {
    world: "town",
    area: { x: 544, y: 610, width: 32, height: 24 },
    to: "newmap",
    spawn: { x: 550, y: 46 },
    label: "Village",
    auto: true,
  },

  {
    world: "houseInside",
    area: { x: 140, y: 200, width: 48, height: 28 },
    // Dinamiko ito - tingnan ang updateDoorState/houseReturnWorld sa
    // itaas at ang paggamit nito sa update.js. Hindi na "village" nang
    // paka-hard-code, dahil maraming labas na mundo na ang puwedeng
    // pinagmulan.
    to: "__return__",
    // Sa PINTUAN mismo - dun ka lalabas, hindi sa malayo. Hindi ka
    // agad mapapabalik sa loob dahil sa arrivedAtDoor (tingnan sa
    // itaas).
    spawn: null,
    label: "Lumabas",
    auto: true,
  },
];

// Kinukwenta ang EKSAKTONG lugar SA HARAP (LABAS, ilalim) ng isang
// partikular na pintuan - dito idinadala pabalik ang player kapag
// "Lumabas" siya mula sa houseInside. Awtomatiko itong batay sa
// "area" ng pintuan mismo (hindi na hardcoded na numero) - kaya laging
// TALAGANG naka-overlap/nakatayo mismo sa harap ng pinto ang player
// pagkalabas, kahit anong laki/posisyon pa ng door.area.
//
// Ang mga "4"/"12"/"16"/"10" dito ay EKSAKTONG kopya ng offset ng
// getPlayerCollisionBox (collisions.js) - kailangan itong tumugma para
// tamang-tama ang pagkukwenta (gitna ng COLLISION BOX ang basehan,
// hindi ng buong sprite).
function getDoorExitSpawn(door) {
  const area = door.area;

  const collisionOffsetX = 4;
  const collisionOffsetY = 12;
  const collisionWidth = 16;

  // Bahagyang buffer (4px) pababa mula sa ilalim ng pintuan - para
  // TALAGANG nasa LABAS na ng FULLY COLLIDABLE na door.area (map.js)
  // ang paanan ng player (hindi "nakatanim sa pader"), pero SAPAT PA
  // RIN kalapit (nasa loob ng DOOR_REACH_MARGIN_PX, worlds.js) para
  // gumana kaagad ang "Pumasok" prompt kung gusto niyang pumasok ulit.
  const exitBuffer = 4;

  return {
    x: Math.round(
      area.x + area.width / 2 - collisionOffsetX - collisionWidth / 2,
    ),
    y: Math.round(area.y + area.height + exitBuffer - collisionOffsetY),
  };
}

// Ang mundong kasalukuyang nilalaro. Itinatakda ito ng loadWorld sa
// map.js.
let currentWorld = null;

// Saang LABAS na mundo (at anong posisyon doon) dapat bumalik ang
// pintuang "Lumabas" ng houseInside - dinamiko ito (hindi laging
// "village"), dahil MARAMING labas na mundo (village, newmap, ...) ang
// puwedeng magtaglay ng sariling pintuan PAPASOK sa IISANG houseInside.
// Itinatakda ito sa update.js BAWAT pagpasok sa houseInside, base sa
// "returnWorld" ng pintuang ginamit papasok, at sa KOMPYUTADONG
// posisyon (getDoorExitSpawn) - tingnan ang paliwanag sa itaas ng
// DOORS.
let houseReturnWorld = "village";
let houseReturnSpawn = getDoorExitSpawn(DOORS[0]);

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

    if (touching) return door;
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

// =========================
// PANSAMANTALANG SILID
// =========================
//
// Simpleng kahoy na silid na iginuguhit mula sa collision boxes ng
// mapa. Hindi ito pixel art - pansamantala lang habang wala pang tunay
// na interior tileset. Sapat na para masubukan ang pinto at ang
// paglipat ng mapa.

const ROOM_FLOOR_COLOR = "#5b4331";
const ROOM_FLOOR_PLANK_COLOR = "#543d2c";
const ROOM_WALL_COLOR = "#3a2a1e";
const ROOM_WALL_EDGE_COLOR = "#2a1d15";

function drawPlaceholderRoom() {
  const mapWidth = mapData.width * mapData.tilewidth;
  const mapHeight = mapData.height * mapData.tileheight;

  ctx.save();

  ctx.fillStyle = ROOM_FLOOR_COLOR;
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // Mga guhit ng sahig, para hindi purong patag na kulay.
  ctx.fillStyle = ROOM_FLOOR_PLANK_COLOR;

  for (let y = 0; y < mapHeight; y += 16) {
    ctx.fillRect(0, y, mapWidth, 1);
  }

  for (const box of collisions) {
    ctx.fillStyle = ROOM_WALL_COLOR;
    ctx.fillRect(box.x, box.y, box.width, box.height);

    ctx.fillStyle = ROOM_WALL_EDGE_COLOR;
    ctx.fillRect(box.x, box.y + box.height - 3, box.width, 3);
  }

  // Ang pintuang palabas.
  for (const door of DOORS) {
    if (door.world !== currentWorld) continue;

    ctx.fillStyle = "#7a5533";
    ctx.fillRect(door.area.x, door.area.y, door.area.width, door.area.height);

    ctx.fillStyle = "#c9a227";
    ctx.fillRect(door.area.x + 4, door.area.y + door.area.height / 2, 3, 3);
  }

  ctx.restore();
}
