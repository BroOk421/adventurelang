// =========================
// TILED MAP
// =========================

let mapData = null;
let mapReady = false;

// =========================
// TILE RENDERING
// =========================

// =========================
// PAG-LOAD NG MGA TILESET
// =========================
//
// Binabasa natin ang listahan ng tileset mula mismo sa .tmj, kaya kahit
// ano pang idagdag o baguhin mo sa Tiled, susunod ang laro.

function loadImage(source) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);

    image.src = source + CACHE_BUST;
  });
}

// Madalas, ang itinuturo ng tileset ay path sa LABAS ng project (hal.
// ".../Downloads/Inspire/Libresprite/Snow.png" - dun kasi galing ang
// orihinal na PNG nang i-add mo siya sa Tiled). Hindi maaabot ng
// browser ang mga ganoong path. Kaya kapag nabigo, susubukan natin ang
// PAREHONG PANGALAN ng file sa loob ng assets/map/.
async function loadTilesetImage(imageSource) {
  const direct = await loadImage(MAP_DIR + imageSource);

  if (direct) return direct;

  const fileName = imageSource.split(/[\\/]/).pop();

  return loadImage(MAP_DIR + fileName);
}

// Ang "-clear" na bersyon ng isang tileset image: parehong-parehong
// grid at posisyon ng mga tile, pero WALANG niyebe ang guhit (hal.
// Snow.png -> Snow-clear.png). Kapag mayroon nito sa assets/map,
// awtomatikong lumilipat dito ang mga tile kapag tag-damo na (tingnan
// ang shouldUseClearArt sa dig.js). Kapag wala, walang nagbabago.
async function loadClearVariantImage(imageSource) {
  const fileName = imageSource.split(/[\\/]/).pop();

  if (!/\.png$/i.test(fileName)) return null;

  const clearName = fileName.replace(/\.png$/i, "-clear.png");

  return loadImage(MAP_DIR + clearName);
}

// Kayang basahin ang parehong format ng Tiled: .tsx (XML) at .tsj (JSON).
function parseTileset(source, text) {
  if (text.trim().startsWith("{")) {
    const json = JSON.parse(text);

    return { columns: json.columns, image: json.image };
  }

  const document = new DOMParser().parseFromString(text, "text/xml");

  const tilesetNode = document.querySelector("tileset");
  const imageNode = document.querySelector("image");

  if (!tilesetNode || !imageNode) {
    console.warn("Hindi tileset file:", source);
    return null;
  }

  return {
    columns: Number(tilesetNode.getAttribute("columns")),
    image: imageNode.getAttribute("source"),
  };
}

async function loadTilesets(map) {
  const entries = map.tilesets || [];

  const loaded = await Promise.all(
    entries.map(async (entry) => {
      // Puwedeng naka-embed na mismo sa mapa ang tileset (walang
      // "source") - kunin na lang natin diretso ang laman nito.
      const parsed = entry.source
        ? await fetchTileset(entry.source)
        : { columns: entry.columns, image: entry.image };

      if (!parsed || !parsed.image) return null;

      const image = await loadTilesetImage(parsed.image);

      if (!image) {
        console.warn("Hindi mahanap ang larawan ng tileset:", parsed.image);
        return null;
      }

      // Opsyonal na walang-niyebe na bersyon (hal. Snow-clear.png).
      const clearImage = await loadClearVariantImage(parsed.image);

      return {
        firstgid: entry.firstgid,
        columns: parsed.columns,
        image,
        clearImage,
        // Pangalan ng source file (hal. "new-assets.tsj") - itinatabi
        // para sa kaso na kailangang malaman KUNG SAANG partikular na
        // .tsj/.tsx nanggaling ang isang gid (hindi na ginagamit para
        // sa bahay - tingnan ang "BAHAY -> HIWALAY NA PNG" sa ibaba,
        // pero puwede pang magamit ng ibang bagong feature balang araw).
        source: entry.source || null,
      };
    }),
  );

  // Mula sa pinakamalaki papuntang pinakamaliit ang firstgid, para
  // mabilis lang ang paghahanap sa getTilesetForGid.
  tilesets = loaded.filter(Boolean).sort((a, b) => b.firstgid - a.firstgid);

  console.log(
    "Tilesets loaded:",
    tilesets.map((t) => t.firstgid + " (" + t.columns + " cols)").join(", "),
  );
}

async function fetchTileset(source) {
  try {
    const response = await fetch(MAP_DIR + source + CACHE_BUST);

    if (!response.ok) {
      console.warn("Wala ang tileset file:", source);
      return null;
    }

    return parseTileset(source, await response.text());
  } catch (error) {
    console.warn("Hindi mabasa ang tileset:", source, error);
    return null;
  }
}

// Ang tileset ng isang gid ay yung may PINAKAMALAKING firstgid na hindi
// pa lalampas sa gid. Ganito rin ang tuntunin ng Tiled mismo.
function getTilesetForGid(gid) {
  for (const tileset of tilesets) {
    if (gid >= tileset.firstgid) return tileset;
  }

  return null;
}

// =========================
// BAHAY -> HIWALAY NA PNG (house.png / snowhouse.png)
// =========================
//
// FINAL na paraan (mas simple/ligtas kaysa sa mga dati): sa halip na
// buuin ang bahay mula sa maraming magkakadikit na TILE (mula sa
// "House" layer/s ng newmap.tmj) at subukang hanapin/i-shift papunta
// sa isang "katapat" na snow bersyon sa loob ng Snow.png (fragile -
// puwedeng "putol" kung may 2+ layer na "House", puwedeng "sumira"/
// mag-leak ng maling laman kung mali ang shift), may 2 na ngayong
// HIWALAY, KUMPLETONG larawan: `house.png` (walang niyebe) at
// `snowhouse.png` (may niyebe) - bawat isa ay IISANG buo/tapos na
// larawan (hindi na tileset), kaya diretso na lang ISANG `drawImage`
// call kada bahay, walang tile-by-tile na pagsasama-sama, walang
// panganib na "maputol" o "magka-leak".
//
// Ang bounding box (`bbox`) at "ground line" (`baseY`) ng bahay ay
// GALING PA RIN sa "House" layer/s ng newmap.tmj (buildHouseInfo/
// buildIndividualHouseBBoxes sa ibaba - HINDI ito binago, tama na ito
// mula noon: UNION na ng LAHAT ng layer na "House" ang pangalan) -
// ginagamit lang ito bilang REPERENSIYA kung SAAN (posisyon) iguguhit
// ang larawan (naka-anchor sa ILALIM-GITNA ng bbox, kung saan
// naninirahan ang pinto/harapan), HINDI na ito ang PINAGMUMULAN ng
// aktwal na larawan.
const houseImage = new Image();
houseImage.src = "./assets/map/sprites/house.png";

const snowhouseImage = new Image();
snowhouseImage.src = "./assets/map/sprites/snowhouse.png";

// BAGO (hiling ng user, minimap.js): "yung mismong img na lang ilagay
// tapos medyo lakihan sa map ng mga assets like bahay" - cache ng mga
// bbox ng bahay ng KASALUKUYANG mundo (parehong listahan na ginagawa sa
// loadWorld sa ibaba para sa buildHouseWallCollisions) - ginagamit ito
// ng minimap.js (drawMinimapHouses) para malaman kung SAAN iguguhit ang
// icon ng bahay (gamit rin ang parehong houseImage/snowhouseImage sa
// itaas), sa halip na basta generic na collision box.
let currentWorldHouseBBoxes = [];

// Iginuguhit ang larawan sa NATIVE na sukat nito (walang stretch/
// scale papunta sa laki ng lumang tile-bbox - maaaring magkaiba nang
// bahagya ang sukat ng house.png kumpara sa snowhouse.png, sadya
// iyon: mas "malaki"/mas mataas ang niyebe sa bubong) - naka-anchor sa
// ILALIM-GITNA ng bbox (kung saan dapat "nakadikit sa lupa" ang bahay).
function drawHouseImageAt(bbox) {
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const image = snowing ? snowhouseImage : houseImage;

  if (!image.complete || image.naturalWidth === 0) return;

  const x = bbox.x + bbox.width / 2 - image.naturalWidth / 2;
  const y = bbox.y + bbox.height - image.naturalHeight;

  ctx.drawImage(image, x, y);
}

// =========================
// "lamps" TILE LAYER -> POSISYON NG ILAW (parol sa town)
// =========================
//
// BAGO (update ng buong town.tmj): iisa na lang ang layer para sa parol
// - "lamps" (dating hiwalay na "lumb"/"lambs"). Ang mismong ART ng
// parol ay laging iginuguhit SA HARAP ng player (tingnan ang
// drawTownLampsForeground sa ibaba, tinatawag PAGKATAPOS ng
// drawMapObjects sa draw.js - hiling ng user: "character behind the
// lamps") - kaya HINDI ito overlap/Y-sort layer (wala sa
// OVERLAP_LAYER_NAMES). Dito naman, direkta nating binabasa ang RAW na
// tile data ng "lamps" layer mismo, at pinagsasama-sama natin
// (connected-component clustering, kagaya ng ginagawa ng
// getOverlapClusters) ang magkakadikit na tile bilang IISANG poste,
// para malaman kung SAAN (world space) dapat ilagay ang bawat mainit
// na ilaw (ginagamit ito ng atmosphere.js, drawTownLamps, bilang gitna
// ng glow). Apat na magkakahiwalay na parol ang meron sa bagong
// town.tmj (verified), 2-3 tile ang lapad ng bawat isa - walang
// signboard/noticeboard na kasama dito ngayon, kaya wala nang
// pangangailangan ng "pinakamalapad na 2 tile" na filter (dating
// nasa "lumb", tinanggal na rito). Cache kada mundo (hindi nagbabago
// ang layer sa runtime).
const lampLightPointsCache = {};

function getLampLightPoints() {
  if (!mapReady || !mapData || !currentWorld) return [];

  if (lampLightPointsCache[currentWorld]) {
    return lampLightPointsCache[currentWorld];
  }

  const allTileLayers = flattenTileLayers(mapData.layers);
  const layer = allTileLayers.find(
    (candidate) =>
      candidate.name.toLowerCase() === "lamps" ||
      candidate.name.toLowerCase() === "snowlamps",
  );

  const points = [];

  if (layer && Array.isArray(layer.data)) {
    const tileSet = new Set();

    for (let i = 0; i < layer.data.length; i++) {
      if (!layer.data[i]) continue;

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      tileSet.add(col + "," + row);
    }

    const visited = new Set();

    for (const key of tileSet) {
      if (visited.has(key)) continue;

      const stack = [key];
      const comp = [];

      visited.add(key);

      while (stack.length > 0) {
        const current = stack.pop();
        const [cx, cy] = current.split(",").map(Number);

        comp.push([cx, cy]);

        const neighbors = [
          cx + 1 + "," + cy,
          cx - 1 + "," + cy,
          cx + "," + (cy + 1),
          cx + "," + (cy - 1),
        ];

        for (const neighborKey of neighbors) {
          if (tileSet.has(neighborKey) && !visited.has(neighborKey)) {
            visited.add(neighborKey);
            stack.push(neighborKey);
          }
        }
      }

      const xs = comp.map((tile) => tile[0]);
      const ys = comp.map((tile) => tile[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);

      points.push({
        x: (minX + maxX + 1) * 0.5 * TILE_SIZE,
        y: minY * TILE_SIZE + TILE_SIZE * 0.6,
      });
    }
  }

  lampLightPointsCache[currentWorld] = points;

  return points;
}

// =========================
// "windows" TILE LAYER -> POSISYON NG ILAW (bintana ng town)
// =========================
//
// Sa town, hiwalay na tilelayer ang "windows" - dito mismo idinikit ng
// artist (sa Tiled) ang mga lit-window na tile sa BAWAT bahay/tindahan.
// Sa halip na mag-hardcode ng pixel coordinates (gaya ng dati), dito
// natin BASAHIN mismo ang layer para makuha ang GITNA (world space) ng
// bawat window tile - kaya kahit dagdagan pa ng artist ang bilang ng
// bintana sa hinaharap, awtomatiko itong masusundan, walang kailangang
// baguhin sa code.
//
// Cache kada mundo (currentWorld) - hindi nagbabago ang layer sa
// runtime, kaya sapat nang kalkulahin isang beses lang kada world load.
const windowLayerPointsCache = {};

function getWindowLayerLightPoints() {
  if (!mapReady || !mapData || !currentWorld) return [];

  if (windowLayerPointsCache[currentWorld]) {
    return windowLayerPointsCache[currentWorld];
  }

  const allTileLayers = flattenTileLayers(mapData.layers);
  const layer = allTileLayers.find(
    (candidate) => candidate.name.toLowerCase() === "windows",
  );

  const points = [];

  if (layer && Array.isArray(layer.data)) {
    for (let i = 0; i < layer.data.length; i++) {
      if (!layer.data[i]) continue;

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      points.push({
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
      });
    }
  }

  windowLayerPointsCache[currentWorld] = points;

  return points;
}

// =========================
// "door" TILE LAYER -> POSISYON NG ILAW (naka-ilaw na pinto ng town)
// =========================
//
// Bagong layer ito (kasama ng buong update ng town.tmj) - kaparehong-
// pareho ang gawi nito ng "windows" sa itaas: dito mismo idinikit ng
// artist (sa Tiled) ang mga naka-ilaw na pintong tile sa bawat
// bahay/tindahan. Kinukuha lang natin ang GITNA (world space) ng bawat
// tile - hindi na kailangang mag-cluster (hindi tulad ng "lamps"),
// dahil bawat tile mismo ay sapat na bilang sariling pinagmumulan ng
// ilaw (kagaya rin ng ginagawa sa windows). Cache kada mundo.
const doorLayerPointsCache = {};

function getDoorLayerLightPoints() {
  if (!mapReady || !mapData || !currentWorld) return [];

  if (doorLayerPointsCache[currentWorld]) {
    return doorLayerPointsCache[currentWorld];
  }

  const allTileLayers = flattenTileLayers(mapData.layers);
  const layer = allTileLayers.find(
    (candidate) => candidate.name.toLowerCase() === "door",
  );

  const points = [];

  if (layer && Array.isArray(layer.data)) {
    for (let i = 0; i < layer.data.length; i++) {
      if (!layer.data[i]) continue;

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      points.push({
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
      });
    }
  }

  doorLayerPointsCache[currentWorld] = points;

  return points;
}

// =========================
// BINTANA NG BAHAY -> LIWANAG KAPAG GABI
// =========================
//
// Mga (x, y) offset (LOCAL sa larawan mismo - house.png/snowhouse.png,
// hindi pa naidadagdag ang posisyon ng bahay sa mundo) kung saan
// makikita ang 3 bintana ng bahay (1 bilog sa itaas ng pinto, 2 maliit
// na parisukat sa magkabilang gilid ng pinto) - VERIFIED sa pamamagitan
// ng pag-inspect (grid overlay) sa parehong larawan. Ginagamit ito ng
// atmosphere.js (drawHouseWindowLights) para lagyan ng mainit na ilaw
// ang mga bintana KAPAG GABI - hindi ito guhit dito, dito lang
// kinokolekta ang mga TALAGANG posisyon (world space) kada frame
// (tingnan ang houseWindowLightPoints/collectHouseWindowLightPoints sa
// ibaba), dahil ang aktwal na guhit ay SCREEN SPACE (kagaya ng
// drawTorchLight), para "kumakalaban" talaga ito sa dilim.
const HOUSE_WINDOW_OFFSETS = [
  { x: 38, y: 45 },
  { x: 25, y: 64 },
  { x: 53, y: 64 },
];

const SNOWHOUSE_WINDOW_OFFSETS = [
  { x: 38, y: 46 },
  { x: 24, y: 68 },
  { x: 56, y: 68 },
];

// BAGO (hiling ng user): "kapag naka off or wala pang lamp sa loob ng
// bahay, yung labas ng bahay ay dapat WALANG ilaw sa bintana - once
// lang meron nang lamp AT naka-ON, doon lang lalabas" - dating basta
// GABI NA lang ang batayan ng drawHouseWindowLights (atmosphere.js),
// kahit walang aktwal na naka-ON na Light sa loob ng partikular na
// bahay na iyon. Para malaman KANINONG interior world ang isang bahay
// (walang direktang "name"/identity ang mga overlap-instance na bahay,
// connected-component detection lang sila mula sa sprite pixels),
// tinitingnan natin ang PINAKAMALAPIT na pintuan (DOORS, worlds.js) sa
// KASALUKUYANG mundo base sa X position - ang bawat bahay dito ay may
// kaakibat na pintuan papasok (world: "town", to: "manuelHouse" atbp.)
// na naka-anchor din sa parehong X area ng bahay mismo.
function findInteriorWorldForHouseBBox(bbox) {
  if (typeof DOORS === "undefined") return null;

  const centerX = bbox.x + bbox.width / 2;

  let closestWorld = null;
  let closestDistance = Infinity;

  for (const door of DOORS) {
    if (door.world !== currentWorld) continue;
    if (!door.to || door.to === "__return__") continue;

    const doorCenterX = door.area.x + door.area.width / 2;
    const distance = Math.abs(doorCenterX - centerX);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestWorld = door.to;
    }
  }

  return closestWorld;
}

// Pinupunuan ito ni drawMapObjects (isang beses kada frame, bago mag-
// Y-sort) - listahan ng LAHAT ng bintanang dapat magliwanag ngayong
// frame (world space na coordinates), para magamit ito ni
// drawHouseWindowLights (atmosphere.js) SA LABAS na ng camera
// transform.
let houseWindowLightPoints = [];

function collectHouseWindowLightPoints(bbox) {
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const image = snowing ? snowhouseImage : houseImage;
  const offsets = snowing ? SNOWHOUSE_WINDOW_OFFSETS : HOUSE_WINDOW_OFFSETS;

  if (!image.complete || image.naturalWidth === 0) return;

  const x = bbox.x + bbox.width / 2 - image.naturalWidth / 2;
  const y = bbox.y + bbox.height - image.naturalHeight;

  // BAGO: alamin muna kung KANINONG interior world ang bahay na ito
  // (tingnan ang paliwanag sa findInteriorWorldForHouseBBox sa itaas) -
  // isasama ito sa bawat point para malaman ng drawHouseWindowLights
  // (atmosphere.js) kung TALAGANG may naka-ON na Light sa loob bago
  // magpasya kung magliliwanag ang bintanang ito.
  const interiorWorld =
    typeof findInteriorWorldForHouseBBox === "function"
      ? findInteriorWorldForHouseBBox(bbox)
      : null;

  for (const offset of offsets) {
    houseWindowLightPoints.push({
      x: x + offset.x,
      y: y + offset.y,
      world: interiorWorld,
    });
  }
}

// =========================
// BAHAY -> "WALL-ONLY" NA COLLISION (gilid ng pinto + itaas ng pinto)
// =========================
//
// Gaano kataas (mula sa ILALIM ng bbox pataas) ang tinuturing na
// "pader" (hindi kasama ang dahilig na bubong sa itaas nito) - VERIFIED
// sa pamamagitan ng pag-inspect sa alpha bounding box ng house.png/
// snowhouse.png (kung saan nagsisimulang maging patayo/parallel ang
// gilid, hudyat na tapos na ang bubong, nagsimula na ang pader).
const HOUSE_WALL_HEIGHT_FROM_BOTTOM = 69;

// Kalahating lapad ng buong pader (mula sa gitna ng bbox papunta sa
// magkabilang gilid) - VERIFIED din sa parehong pag-inspect.
const HOUSE_WALL_HALF_WIDTH = 27;

// Hinahanap kung anong "pintuan" (DOORS sa worlds.js) ang TALAGANG
// bahagi ng bahay na ito - hindi basta ang UNANG match sa parehong
// mundo (posibleng may 2+ HIWALAY na bahay sa isang mundo, pero isa
// lang sa kanila ang may TUNAY na "Pumasok" na interaction - tingnan
// ang buildHouseWallCollisions sa ibaba). `null` kung wala talagang
// pintuan dito (dekorasyon lang - buong solid na lang ang pader).
function findDoorForHouseBBox(worldName, bbox) {
  if (typeof DOORS === "undefined") return null;

  return (
    DOORS.find(
      (door) =>
        door.world === worldName &&
        door.area &&
        door.area.x >= bbox.x &&
        door.area.x <= bbox.x + bbox.width,
    ) || null
  );
}

// Ginagawa ang 1-3 na collision rectangle PER bahay: kaliwang pader,
// kanang pader, at "lintel" (itaas ng pinto, hanggang sa TALAGANG
// simula ng door TRIGGER zone) - may BUTAS lang sa eksaktong lugar ng
// pintuan (kung mayroon), para hindi masira ang "Pumasok" na
// interaction. Kung walang tunay na pintuan dito (dekorasyon lang),
// ISANG buong solid na rectangle na lang ang buong pader.
function buildHouseWallCollisions(worldName, houses) {
  const result = [];

  for (const house of houses) {
    const bbox = house.bbox;
    const centerX = bbox.x + bbox.width / 2;
    const bottom = bbox.y + bbox.height;
    const wallTop = bottom - HOUSE_WALL_HEIGHT_FROM_BOTTOM;
    const wallLeft = centerX - HOUSE_WALL_HALF_WIDTH;
    const wallRight = centerX + HOUSE_WALL_HALF_WIDTH;

    const door = findDoorForHouseBBox(worldName, bbox);

    if (!door) {
      // Walang tunay na pintuan dito - buong solid na lang ang pader.
      result.push({
        x: wallLeft,
        y: wallTop,
        width: wallRight - wallLeft,
        height: HOUSE_WALL_HEIGHT_FROM_BOTTOM,
      });

      continue;
    }

    const doorLeft = door.area.x;
    const doorRight = door.area.x + door.area.width;
    const doorTop = door.area.y;

    if (doorLeft - wallLeft > 0) {
      result.push({
        x: wallLeft,
        y: wallTop,
        width: doorLeft - wallLeft,
        height: HOUSE_WALL_HEIGHT_FROM_BOTTOM,
      });
    }

    if (wallRight - doorRight > 0) {
      result.push({
        x: doorRight,
        y: wallTop,
        width: wallRight - doorRight,
        height: HOUSE_WALL_HEIGHT_FROM_BOTTOM,
      });
    }

    // Lintel - mula sa taas ng pader hanggang sa TALAGANG simula ng
    // door trigger zone (hindi lalampas dito - kung hindi, masasarhan
    // ang buong pintuan, hindi na makakapasok kailanman ang player).
    if (doorTop - wallTop > 0) {
      result.push({
        x: doorLeft,
        y: wallTop,
        width: doorRight - doorLeft,
        height: doorTop - wallTop,
      });
    }

    // AYOS: dating "kalahati lang" (itaas) ang naka-collide dito, kaya
    // nakakalakad pa rin ang player papasok sa IBABANG kalahati ng
    // pintuan (para lang sa "Pumasok" prompt) - hindi pa rin tama,
    // hiling ng user: dapat TALAGANG hindi na makapasok/makatapak sa
    // loob ng pintuan mula sa labas, sa "E" prompt (Pumasok) na lang
    // dapat ang paraan. Ngayon, ang BUONG door.area (hindi na kalahati
    // lang) ang naka-collide - ganap nang blocked ang literal na
    // paglakad papasok. Ang "Pumasok" na trigger (getDoorUnderPlayer,
    // worlds.js) ay may sarili na ngayong "reach margin"
    // (DOOR_REACH_MARGIN_PX) para gumana pa rin ito kahit hindi na
    // literal na naka-overlap ang player sa loob ng pintuan - basta
    // nakatayo siya dikit dito mula sa labas.
    result.push({
      x: doorLeft,
      y: doorTop,
      width: doorRight - doorLeft,
      height: door.area.height,
    });
  }

  return result;
}

// Ang "seasonX/seasonY" ay OPSYONAL na ibang posisyon na gagamitin
// LAMANG para sa desisyon ng snow<->clear (hindi para sa aktwal na
// pagguhit). Kailangan ito para sa mga OVERLAP INSTANCE (puno, bato,
// bahay, bakod): binubuo sila ng MARAMING magkakadikit na tile, at kung
// bawat tile ay sarili-sariling desisyon (base sa sariling x,y), may
// pagkakataong SEGUNDANG tumawid na sa "walang niyebe" ang ibang piraso
// ng IISANG bagay habang naka-"niyebe" pa ang katabi nito - kalahating
// may-niyebeng puno, halimbawa. Sa pagpasa ng IISANG anchor point
// (karaniwan ay ang unang tile ng bagay) sa lahat ng piraso nito,
// sabay-sabay silang lumilipat - buo pa rin ang bagay kahit anong yugto
// ng transition.
function drawTile(gid, x, y, seasonX = x, seasonY = y, allowClearArt = true) {
  if (!gid) return;

  // Tiled can store flip flags in the highest 3 bits.
  const FLIP_H = 0x80000000;
  const FLIP_V = 0x40000000;
  const FLIP_D = 0x20000000;

  const flipH = (gid & FLIP_H) !== 0;
  const flipV = (gid & FLIP_V) !== 0;
  const flipD = (gid & FLIP_D) !== 0;

  gid = gid & ~(FLIP_H | FLIP_V | FLIP_D);

  const tileset = getTilesetForGid(gid);
  if (!tileset || !tileset.image.complete) return;

  // Kapag tag-damo na at may walang-niyebe na bersyon ang tileset,
  // doon tayo kukuha ng tile - pareho ang posisyon, iba lang ang guhit.
  // Kaya sabay na "natutunaw" ang niyebe sa bahay/puno/bato habang
  // dumadamo ang lupa.
  let sourceImage = tileset.image;

  if (
    allowClearArt &&
    tileset.clearImage &&
    typeof shouldUseClearArt === "function" &&
    shouldUseClearArt(seasonX, seasonY)
  ) {
    sourceImage = tileset.clearImage;
  }

  const localId = gid - tileset.firstgid;

  const sourceX = (localId % tileset.columns) * TILE_SIZE;

  const sourceY = Math.floor(localId / tileset.columns) * TILE_SIZE;

  ctx.save();

  ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);

  if (flipD) {
    ctx.rotate(Math.PI / 2);
    ctx.scale(-1, 1);
  }

  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);

  ctx.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    TILE_SIZE,
    TILE_SIZE,
    -TILE_SIZE / 2,
    -TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE,
  );

  ctx.restore();
}

function drawTileLayer(layer) {
  if (!layer.visible || !layer.data) return;

  for (let row = 0; row < layer.height; row++) {
    for (let col = 0; col < layer.width; col++) {
      const gid = layer.data[row * layer.width + col];

      if (!gid) continue;

      drawTile(gid, col * mapData.tilewidth, row * mapData.tileheight);
    }
  }
}

// =========================
// LAYER TREE FLATTENING
// =========================
//
// Ang bagong mapa (snowMap.tmj) ay gumagamit ng "group" layers (hal. mga
// "Trees"/"Rocks"/"Fence" groups na may maraming sub-layer sa loob). Dito
// natin ilalatag/i-flaflatten ang lahat ng aktwal na TILE layers (kahit
// nakabaon pa sa loob ng ilang antas ng group), para hindi na natin
// kailangan alalahanin ang pagkaka-nest kapag gumuhit o kumukuha ng tiles.

function flattenTileLayers(layers, out = []) {
  for (const layer of layers) {
    if (layer.type === "group") {
      flattenTileLayers(layer.layers, out);
    } else if (layer.type === "tilelayer") {
      out.push(layer);
    }
  }

  return out;
}

// Kinukuha ang mga "cluster": bawat TOP-LEVEL na group (hal. isang
// "Trees" group, isang "Rocks" group) o standalone na tilelayer (hal.
// "House") ay ISANG cluster - listahan ng lahat ng aktwal na tile
// layers sa loob nito (kahit ilang antas pa ang pagkaka-nest). HINDI
// natin pinagsasama-sama ang magkaibang cluster sa isa't isa dito,
// dahil bawat isa ay hiwalay na inilagay/ginuhit ng Tiled artist (hal.
// bahay dito, puno doon) - kung pagsasamahin pa rin natin sila bago mag
// flood-fill, kapag nagkataong nagkadikit-dikit sila sa mapa (tulad ng
// bahay na katabi ng punong grupo), mababawi silang lahat bilang IISANG
// napakalaking bagay na may IISANG baseY - kaya sira ang overlap sa
// player kahit malayo na sa aktwal na sanhi (puno/bato) ang bahay.
function getOverlapClusters(layers) {
  const clusters = [];

  for (const layer of layers) {
    const isGroup = layer.type === "group";
    const isTilelayer = layer.type === "tilelayer";

    if (!isGroup && !isTilelayer) continue;

    if (!isOverlapLayer(layer)) continue;

    const tileLayers = isGroup ? flattenTileLayers(layer.layers) : [layer];

    if (tileLayers.length > 0) {
      // "type" - pangalan ng ORIHINAL na group/layer sa Tiled ("trees",
      // "fence", "rocks", "house" - tingnan ang OVERLAP_LAYER_NAMES) -
      // itinatabi ito PARA MALAMAN kung "puno" ba ang isang instance
      // (ang tanging dapat mag-see-through occlusion, kasama ng bahay -
      // tingnan ang shouldOccludeForPlayer), hindi bakod/bato.
      clusters.push({ layers: tileLayers, type: layer.name.toLowerCase() });
    }
  }

  return clusters;
}

// =========================
// OVERLAP INSTANCES (para sa Trees AT House)
// =========================
//
// Cache ng mga "overlap instance" - ibig sabihin, buong bagay (puno o
// bahay) na pinagsama-sama bilang IISANG bagay, hindi na hiwa-hiwalay na
// tile. Ginagamit ito para sa Y-sorting laban sa player - kaya kahit puno
// o bahay man, parehong-pareho ang paraan ng pag-overlap sa player.
let overlapInstances = null;

// Pangalan ng mga layer na dapat tratuhin bilang "puwedeng-overlap-sa-
// player" na bagay - hindi flat na background lang. Case-INsensitive na
// ito (naka-lowercase lahat dito), dahil sa Tiled map natin, magkaiba
// ang case ng group name laban sa mismong tilelayer name sa loob nito
// (hal. group na "Trees" pero ang sub-layer sa loob ay "trees" lang) -
// kaya kung case-sensitive lang, hindi na-match yun dati at nade-draw
// lang bilang background ang mga puno at bato.
const OVERLAP_LAYER_NAMES = new Set([
  "trees",
  "house",
  "rocks",
  "fence",
  // Hindi kasama dito ang "lamps" (bagong pinagsamang parol layer ng
  // town.tmj) - hiling ng user: LAGING NASA HARAP ng player ang parol
  // ("character behind the lamps"), kaya hindi ito Y-sort/dynamic -
  // tingnan ang drawTownLampsForeground sa ibaba (tinatawag sa draw.js
  // PAGKATAPOS ng drawMapObjects, kaya laging sa IBABAW ng player).
]);

function isOverlapLayer(layer) {
  return OVERLAP_LAYER_NAMES.has(layer.name.toLowerCase());
}

// =========================
// PAGHIWA-HIWALAY NG MGA BAGAY ("STAMPS")
// =========================
//
// Paano ginawa sa Tiled ang mapa natin: sa halip na isang layer kada
// uri, DINODOBLE ng artist ang layer bago magdagdag ng bagong bagay -
// kaya ang bawat sublayer ay KOPYA ng nauna PLUS isang bagong stamp
// (isang puno, isang bato, isang bakod). Kaya nga may 83 layers ang
// mapa pero 68 lang na aktwal na bagay ang nandoon.
//
// Dahil ganoon, mababawi natin ang bawat ISAHANG bagay: ang DIFF ng
// magkasunod na layer ay eksaktong isang stamp.
//
// Bakit hindi na lang flood fill (yung dating paraan)? Dahil
// MAGKAKADIKIT ang mga puno sa mapa. Kapag flood fill ang gamit,
// nagiging IISANG higanteng bagay ang buong kagubatan na ang base ay
// nasa pinakailalim ng mapa - kaya lumalabas na nasa HARAP ng lahat ang
// mga puno: sa harap ng bakod, ng bato, at ng player, kahit malayo pa
// sila. Yan ang dahilan kung bakit nag-ooverlap ang katawan ng puno sa
// bakod at bato.
//
// MAHALAGA: hindi natin pinipili ang IISANG gid kada cell. Marami kasing
// beses na may DALAWA O HIGIT PANG tiles sa magkaibang layer pero
// PAREHONG cell - ganoon ang paraan ng artist para tama ang pagkakapatong
// ng magkadikit na puno. Kung last-layer-wins ang gagawin, may
// mawawalang parte at magiging putol-putol ang mga puno. Kaya
// itinatabi natin ang BUONG "salansan" (stack) ng gid sa bawat cell, sa
// tamang pagkakasunod-sunod.

const NEIGHBOR_OFFSETS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

// Tiled can store flip flags in the highest 3 bits - kailangan tanggalin
// bago mag-aritmetika sa gid.
const GID_FLAG_MASK = 0x1fffffff;

// Sa Tiled, ang isang "stamp" ay kinukuha sa REKTANGULONG bahagi ng
// tileset. Kaya sa loob ng IISANG bagay: kapag lumipat ka ng isang tile
// pakanan, +1 ang gid; kapag pababa, +columns (bilang ng hanay ng
// tileset). Ginagamit natin ang relasyong ito para malaman kung
// magkasama nga ba talaga sa iisang bagay ang dalawang magkadikit na
// cell.
//
// Bakit hindi sapat ang "magkadikit"? Kasi sa gilid ng mapa,
// MAGKAKADIKIT ang cells ng magkakaibang puno - walang puwang sa
// pagitan nila. Kung dikit lang ang batayan, magiging IISANG bagay ang
// lima o anim na puno na may IISANG base sa pinakailalim ng mapa. Kaya
// nagkakamali ang lalim: nasa harap ng bakod at bato ang mga punong
// dapat sana ay nasa likod.
function isSameStamp(cellA, cellB, dRow, dCol, stackOf) {
  for (const rawA of stackOf[cellA]) {
    const gidA = rawA & GID_FLAG_MASK;
    const tileset = getTilesetForGid(gidA);

    if (!tileset) continue;

    const delta = dRow * tileset.columns + dCol;

    for (const rawB of stackOf[cellB]) {
      const gidB = rawB & GID_FLAG_MASK;

      // Kung magkaibang tileset sila, magkaibang bagay na iyon - walang
      // saysay ang pagbabawas ng gid sa magkaibang sheet.
      if (getTilesetForGid(gidB) !== tileset) continue;

      if (gidB - gidA === delta) return true;
    }
  }

  return false;
}

// Hinahati ang isang stamp sa magkakahiwalay na bagay. Kailangan ito
// dahil ang UNANG layer ng bawat serye ay maaaring may ilang bagay na
// sabay-sabay nailagay - hindi laging isa lang.
function splitConnected(cells, width, height, stackOf) {
  const remaining = new Set(cells);
  const pieces = [];

  for (const start of cells) {
    if (!remaining.has(start)) continue;

    const piece = [];
    const stack = [start];
    remaining.delete(start);

    while (stack.length) {
      const cell = stack.pop();
      piece.push(cell);

      const row = Math.floor(cell / width);
      const col = cell % width;

      for (const [dr, dc] of NEIGHBOR_OFFSETS) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;

        const neighbor = nr * width + nc;

        if (!remaining.has(neighbor)) continue;
        if (!isSameStamp(cell, neighbor, dr, dc, stackOf)) continue;

        remaining.delete(neighbor);
        stack.push(neighbor);
      }
    }

    pieces.push(piece);
  }

  return pieces;
}

function makeInstance(cells, stackOf, width, type) {
  const tiles = [];

  let tileBottom = -Infinity;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Row-major na pagkakasunod-sunod, tulad ng dating drawTileLayer.
  cells.sort((a, b) => a - b);

  for (const cell of cells) {
    const row = Math.floor(cell / width);
    const col = cell % width;

    const x = col * mapData.tilewidth;
    const y = row * mapData.tileheight;

    for (const gid of stackOf[cell]) {
      tiles.push({ gid, x, y });
    }

    if (y + mapData.tileheight > tileBottom) {
      tileBottom = y + mapData.tileheight;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + mapData.tilewidth);
    maxY = Math.max(maxY, y + mapData.tileheight);
  }

  // "bbox" (world-space) ng buong stamp na ito - ginagamit para malaman
  // kung nag-o-overlap ang player dito (tingnan ang "SEE-THROUGH NA
  // OCCLUSION" sa drawMapObjects). Para sa "trees" - NIPISIN ang bbox
  // papuntang gitna, PERO HINDI na masyadong makitid (tingnan ang AYOS
  // sa ibaba).
  let bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  // AYOS (bug report ng user, may video): "kahit di mag-gamit ng axe is
  // dapat nag-oopacity parin" - VERIFIED sa recording: nakatayo ang
  // player sa ILALIM/GILID ng MALAPAD na canopy (kitang-kita, natatakpan
  // pa nga ang ulo niya ng dahon), PERO hindi nag-fade ang puno - SANHI:
  // masyadong MAKITID (35% lang ng lapad, "trunk only") ang dating bbox
  // dito, kaya kahit malinaw na nasa ILALIM ng canopy ang player,
  // hindi ito na-de-detect bilang "overlap" (lampas na sa makitid na
  // 35% band, kahit pa nasa loob ng buong 100% canopy). PALAKIHIN sa
  // 70% ng lapad (mas malapit sa TALAGANG lapad ng canopy, hindi na
  // basta "trunk only" katulad ng dating 35%) - sapat pa ring may
  // margin sa mismong gilid (hindi 100%) para hindi masyadong agad
  // mag-trigger kapag TALAGANG nasa TABI pa lang (hindi pa LIKOD) ng
  // puno ang player, pero MAS MALAKING bahagi na ng canopy ang saklaw
  // nito ngayon kumpara sa dati.
  if (type === "trees") {
    const trunkWidth = bbox.width * 0.7;

    bbox = {
      x: bbox.x + (bbox.width - trunkWidth) / 2,
      y: bbox.y,
      width: trunkWidth,
      height: bbox.height,
    };
  }

  return {
    tiles,
    baseY: getArtGroundY(tiles, tileBottom),
    bbox,
    type,
  };
}

function buildOverlapInstances(layers, width, height, excludedCells, type) {
  const size = width * height;

  // Para sa bawat cell: sino ang HULING sumulat dito, at ano ang buong
  // salansan ng gid na nailagay dito.
  const ownerOf = new Int32Array(size).fill(-1);
  const stackOf = new Array(size);
  const previous = new Int32Array(size);

  for (let index = 0; index < layers.length; index++) {
    const data = layers[index].data;

    if (!data) continue;

    for (let cell = 0; cell < size; cell++) {
      const gid = data[cell];

      // Bagong "sulat" lang ang binibilang - kapag pareho pa rin sa
      // nakaraang layer, kopya lang iyon (cumulative snapshot), kaya
      // hindi na natin uulitin. Dito nawawala ang libo-libong doble.
      if (gid && gid !== previous[cell]) {
        ownerOf[cell] = index;

        if (!stackOf[cell]) stackOf[cell] = [];
        stackOf[cell].push(gid);
      }

      previous[cell] = gid;
    }
  }

  // Ang mga cell na pag-aari na ng bahay ay tinatanggal dito, para
  // hindi madamay ang bahay sa mga puno (tingnan ang buildHouseInfo).
  if (excludedCells) {
    for (const cell of excludedCells) ownerOf[cell] = -1;
  }

  const cellsByOwner = new Map();

  for (let cell = 0; cell < size; cell++) {
    const owner = ownerOf[cell];

    if (owner < 0) continue;

    if (!cellsByOwner.has(owner)) cellsByOwner.set(owner, []);
    cellsByOwner.get(owner).push(cell);
  }

  const instances = [];

  for (const cells of cellsByOwner.values()) {
    for (const piece of splitConnected(cells, width, height, stackOf)) {
      instances.push(makeInstance(piece, stackOf, width, type));
    }
  }

  return instances;
}

// =========================
// PAGHIWALAY NG PUNO SA PALIGID NG BAHAY
// =========================
//
// PROBLEMA: kapag ang mga puno ay pumapaligid sa isang bahay (may puno
// sa itaas, kaliwa, at kanan nito - hugis-∩), nagiging IISANG malaking
// "instance" sila dahil magkakadikit. Ang IISANG baseY ng buong blob na
// iyon ay galing sa PINAKAMABABANG puno nito (yung nasa gilid, mas mababa
// pa sa bahay sa screen) - kaya ang BUONG blob (pati ang bahaging nasa
// ITAAS/LIKOD ng bahay) ay nade-draw PAGKATAPOS ng bahay, kaya mukhang
// nakapatong ang puno sa bubong ng bahay.
//
// SOLUSYON: kung ang isang tree instance ay pumapatong (column-wise) sa
// isang bahay AT may bahagi ito sa ITAAS ng bahay (mas mataas kaysa sa
// bubong), hatiin ito sa dalawa: ang mga tile na NASA ITAAS ng ilalim ng
// bahay ay isang hiwalay na instance na may MAS MATAAS na base (kaya
// nasa LIKOD ng bahay), at ang iba ay nananatiling nasa harap. Ginagawa
// lang ito kada tree instance na talagang naka-overlap sa bahay.
function splitTreeInstancesAroundHouses(treeInstances, houses) {
  if (!houses || houses.length === 0) return treeInstances;

  const result = [];

  for (const inst of treeInstances) {
    // Hanapin ang bahay na (a) nag-o-overlap column-wise sa punong ito,
    // at (b) may bahagi ang puno sa ITAAS ng ilalim ng bahay. Ito ang
    // bahay na dahilan ng maling sort.
    const straddled = houses.find((house) => {
      const hb = house.bbox;
      const ib = inst.bbox;

      const colsOverlap = ib.x < hb.x + hb.width && ib.x + ib.width > hb.x;

      const treeReachesAboveHouseBase = ib.y < hb.y + hb.height;

      return colsOverlap && treeReachesAboveHouseBase;
    });

    if (!straddled) {
      result.push(inst);
      continue;
    }

    // Hatiin ang mga tile: yung base (ilalim) ng bawat tile na NASA
    // ITAAS ng ilalim ng bahay -> "likod" (behind); ang iba -> "harap".
    const houseBaseY = straddled.bbox.y + straddled.bbox.height;

    const behindTiles = [];
    const frontTiles = [];

    for (const tile of inst.tiles) {
      const tileBottom = tile.y + mapData.tileheight;

      if (tileBottom <= houseBaseY) {
        behindTiles.push(tile);
      } else {
        frontTiles.push(tile);
      }
    }

    // Kung wala talagang mahati (lahat nasa isang panig lang), iwan na
    // lang ito nang buo - walang saysay ang paghahati.
    if (behindTiles.length === 0 || frontTiles.length === 0) {
      result.push(inst);
      continue;
    }

    result.push(makeTreePiece(behindTiles, straddled.bbox.y - 1));
    result.push(makeTreePiece(frontTiles));
  }

  return result;
}

// Gumagawa ng maliit na tree "instance" mula sa listahan ng tile - para
// sa mga hiwang galing sa splitTreeInstancesAroundHouses. Kung may
// ibinigay na forcedBaseY, iyon ang gagamitin (para masiguradong nasa
// LIKOD ng bahay ang piraso sa itaas); kung wala, ang art-bottom ng mga
// tile mismo ang basehan (normal na gawi).
function makeTreePiece(tiles, forcedBaseY = null) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let tileBottom = -Infinity;

  for (const tile of tiles) {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x + mapData.tilewidth);
    maxY = Math.max(maxY, tile.y + mapData.tileheight);

    if (tile.y + mapData.tileheight > tileBottom) {
      tileBottom = tile.y + mapData.tileheight;
    }
  }

  const fullWidth = maxX - minX;
  // AYOS (parehong bug fix ng makeInstance sa itaas - "kahit di
  // mag-gamit ng axe is dapat nag-oopacity parin") - PALAKIHIN sa 70%
  // (dati'y 35%, masyadong makitid) para SAKUP ang mas malaking bahagi
  // ng TALAGANG nakikitang canopy, hindi lang ang gitnang trunk.
  const trunkWidth = fullWidth * 0.7;

  const bbox = {
    x: minX + (fullWidth - trunkWidth) / 2,
    y: minY,
    width: trunkWidth,
    height: maxY - minY,
  };

  return {
    tiles,
    baseY:
      forcedBaseY !== null ? forcedBaseY : getArtGroundY(tiles, tileBottom),
    bbox,
    type: "trees",
  };
}
//
// Dalawang bagay ang inaayos dito, at pareho silang dahilan kung bakit
// natatakpan ng bahay ang player kahit nasa HARAP/pintuan na siya:
//
// 1) Sa Tiled map natin, may KOPYA ng buong bahay sa loob ng mga "Trees"
//    layer - hindi lang siya nasa sariling "House" layer. Yung kopyang
//    iyon ay dikit-dikit sa napakaraming puno, kaya sa flood fill ay
//    nagiging IISANG higanteng bagay sila na ang base (baseY) ay nasa
//    pinakailalim na ng mapa. Dahil doon, LAGI siyang iginuguhit
//    PAGKATAPOS ng player - kahit saan pa tumayo ang player.
//    Solusyon: lahat ng tile na nasa loob ng mga cell ng bahay
//    (galing man sa "House" o sa "Trees" layer) ay pinagsasama sa
//    IISANG bagay na "bahay", at tinatanggal sa grupo ng mga puno.
//    Hindi nagbabago ang hitsura - sinusunod pa rin ang orihinal na
//    pagkakasunod-sunod ng mga layer sa loob ng bagay na ito.
//
// 2) Ang ilalim ng SPRITE ng bahay ay HINDI ang ilalim ng pader nito.
//    May porch/harapan pa sa ibaba na nilalakaran mismo ng player. Kung
//    ilalim ng sprite ang gagamiting base, matatakpan pa rin ng bahay
//    ang player pag-akyat niya sa porch. Kaya ang base ng bahay ay ang
//    ILALIM NG COLLISION nito (yung pader) - dun talaga dumidikit sa
//    lupa ang bahay.

let houseInfo = null;

function findTileLayerByName(layers, name) {
  for (const layer of layers) {
    if (layer.type === "group") {
      const found = findTileLayerByName(layer.layers, name);
      if (found) return found;
    } else if (
      layer.type === "tilelayer" &&
      layer.name.toLowerCase() === name
    ) {
      return layer;
    }
  }

  return null;
}

// Kapareho ng findTileLayerByName sa itaas, PERO ibinabalik ang LAHAT
// ng tugmang layer (hindi lang ang UNANG nakita). Kailangan ito dahil
// VERIFIED: may 2 HIWALAY na layer sa newmap.tmj na PAREHONG "House"
// ang pangalan (isa naglalaman ng dingding/ilalim ng bahay, isa
// naglalaman ng bubong/itaas) - dating gamit lang ang UNA sa dalawa
// (findTileLayerByName) ang ginagamit para malaman kung "saan ba
// talaga ang bahay" (buildHouseInfo), kaya nawawala ang KALAHATI ng
// bahay (yung mga cell na NASA IKALAWANG layer lang) sa pag-guhit -
// ito ang sanhi ng "kalahati lang" na bug.
function findAllTileLayersByName(layers, name, out = []) {
  for (const layer of layers) {
    if (layer.type === "group") {
      findAllTileLayersByName(layer.layers, name, out);
    } else if (
      layer.type === "tilelayer" &&
      layer.name.toLowerCase() === name
    ) {
      out.push(layer);
    }
  }

  return out;
}

// =========================
// GROUND LINE
// =========================
//
// Saan ba talaga dumidikit sa lupa ang isang bagay? HINDI laging sa
// ilalim ng sprite niya. Dalawang halimbawa dito sa mapa:
//
//  - BAHAY: may porch/harapan pa sa ibaba ng sprite na nilalakaran
//    mismo ng player. Ang ilalim ng PADER ang totoong dikit sa lupa.
//  - BAKOD: 3 tiles ang taas ng sprite (hanggang y=496), pero ang
//    poste ay dumidikit na sa lupa sa y=469 pa lang. Kapag ilalim ng
//    sprite ang ginamit, natatakpan ng bakod ang player kahit nasa
//    HARAP na ito - dahil hindi na siya makakalapit pa (hinaharangan
//    na siya ng collision sa y=469, kaya 479 ang pinakamababang
//    maaabot ng paanan niya - kulang pa rin sa 496).
//
// Kaya ang batayan ay ang COLLISION mismo - dun talaga dumidikit sa
// lupa ang bagay. Kinukuha natin ang collision na may PINAKAMALAKING
// patong sa bagay - yun ang katawan/footprint nito - tapos:
//
//  - Kung LUMALAMPAS ito sa ilalim ng sprite, ibig sabihin nakaupo lang
//    nang normal sa lupa ang bagay (o iisang mahabang collision ang
//    ginamit para sa isang hanay ng puno). Ilalim ng sprite ang tama.
//  - Kung MAS MATAAS ito, dun nagtatapos ang solidong parte - yun ang
//    ground line (hal. pader ng bahay, poste ng bakod).
//
// Ang MIN_COLLISION_SHARE ay mahalaga: kailangang sakop ng collision
// ang makabuluhang bahagi ng bagay bago natin siya paniwalaan. Kung
// wala nito, mananalo ang maliliit na "ingay" na collision - may punong
// 7 tiles ang taas dito na napunta ang ground line sa 250 (halos tuktok
// niya, imbes na 352) dahil sa tatlong maliliit na rect na 4-67 px2
// lang ang patong. Resulta: nakatayo ang player sa TUKTOK ng puno.
//
// Kapag walang collision na sapat ang laki, ilalim ng sprite ang
// gagamitin - yun ang tama para sa karamihan ng puno at bato.
const MIN_COLLISION_SHARE = 0.1;

// =========================
// GROUND LINE MULA SA MISMONG GUHIT
// =========================
//
// Para sa karaniwang bagay (puno, bato, bakod), ang base ay ang
// PINAKAMABABANG PIXEL NA MAY KULAY - hindi ang ilalim ng tile grid.
// Malaki ang ipinagkaiba: ang bakod ay 3 tiles ang taas (hanggang
// y=496) pero ang huling 12 pixels ay blangko - sa y=484 pa lang
// tapos na ang guhit. Kapag 496 ang ginamit, HINDI KAILANMAN
// makakalampas ang player (484 lang ang pinakamalayong maaabot ng
// paanan niya), kaya laging nasa harap ang bakod.
//
// Dati, collision ang batayan dito - mapanganib pala: may punong
// 7-tiles ang taas na napunta ang base sa may TUKTOK niya, dahil sa
// tatlong maliliit na collision (4-67 px2 lang) na dumadaan lang doon.
// Resulta: nakatayo ang player sa ibabaw ng puno. Ang guhit mismo ang
// pinakamaaasahan - walang hulaan.
//
// (Ang BAHAY lang ang hindi dito dumadaan - guhit din kasi ang porch
// niya na nilalakaran mismo ng player, kaya collision talaga ang tamang
// batayan doon. Tingnan ang buildHouseInfo.)

const ALPHA_THRESHOLD = 8;

// gid -> ilang pixel pababa mula sa itaas ng tile bago matapos ang guhit
const tileArtBottoms = new Map();

function readTilesetPixels(tileset) {
  if (tileset.pixels !== undefined) return tileset.pixels;

  try {
    const surface = document.createElement("canvas");

    surface.width = tileset.image.naturalWidth;
    surface.height = tileset.image.naturalHeight;

    const context = surface.getContext("2d", { willReadFrequently: true });

    context.drawImage(tileset.image, 0, 0);

    tileset.pixels = context.getImageData(0, 0, surface.width, surface.height);
  } catch (error) {
    // Nangyayari ito kapag binuksan ang laro nang diretso sa file://
    // - "tainted" ang canvas, bawal basahin ang pixels. Babalik na lang
    // tayo sa ilalim ng tile grid (tulad ng dati).
    console.warn("Hindi mabasa ang pixels ng tileset:", error);

    tileset.pixels = null;
  }

  return tileset.pixels;
}

function getTileArtBottom(gid) {
  const clean = gid & GID_FLAG_MASK;

  if (tileArtBottoms.has(clean)) return tileArtBottoms.get(clean);

  let artBottom = TILE_SIZE;

  const tileset = getTilesetForGid(clean);
  const pixels = tileset ? readTilesetPixels(tileset) : null;

  if (pixels) {
    const local = clean - tileset.firstgid;

    const sourceX = (local % tileset.columns) * TILE_SIZE;
    const sourceY = Math.floor(local / tileset.columns) * TILE_SIZE;

    artBottom = 0;

    for (let row = TILE_SIZE - 1; row >= 0; row--) {
      let hasArt = false;

      for (let col = 0; col < TILE_SIZE; col++) {
        const index = ((sourceY + row) * pixels.width + sourceX + col) * 4 + 3;

        if (pixels.data[index] > ALPHA_THRESHOLD) {
          hasArt = true;
          break;
        }
      }

      if (hasArt) {
        artBottom = row + 1;
        break;
      }
    }
  }

  tileArtBottoms.set(clean, artBottom);

  return artBottom;
}

function getArtGroundY(tiles, spriteBottom) {
  let lowest = -Infinity;

  for (const tile of tiles) {
    const bottom = tile.y + getTileArtBottom(tile.gid);

    if (bottom > lowest) lowest = bottom;
  }

  return lowest === -Infinity ? spriteBottom : lowest;
}

function getCollisionGroundY(bbox) {
  const spriteBottom = bbox.y + bbox.height;
  const minArea = bbox.width * bbox.height * MIN_COLLISION_SHARE;

  let bestBottom = null;
  let bestArea = 0;

  for (const box of collisions) {
    const overlapWidth =
      Math.min(bbox.x + bbox.width, box.x + box.width) -
      Math.max(bbox.x, box.x);

    const overlapHeight =
      Math.min(bbox.y + bbox.height, box.y + box.height) -
      Math.max(bbox.y, box.y);

    if (overlapWidth <= 0 || overlapHeight <= 0) continue;

    const area = overlapWidth * overlapHeight;

    if (area < minArea) continue;

    if (area > bestArea) {
      bestArea = area;
      bestBottom = box.y + box.height;
    }
  }

  if (bestBottom === null) return spriteBottom;

  return Math.min(bestBottom, spriteBottom);
}

// Bawat ISANG bahay bilang hiwalay na bbox (connected component ng
// House layer). Ginagamit ng splitTreeInstancesAroundHouses para malaman
// kung saang bahay pumapaligid ang isang tree instance. Iba ito sa
// buildHouseInfo na pinagsasama ang lahat ng bahay sa iisang bbox.
function buildIndividualHouseBBoxes(layers, width, height) {
  const houseLayers = findAllTileLayersByName(layers, "house");

  if (houseLayers.length === 0) return [];

  // "May laman ba dito, sa ALINMAN sa mga House layer?" - UNION, hindi
  // yung isa lang, para tama ang connectivity ng flood-fill sa ibaba
  // (tingnan ang paliwanag sa findAllTileLayersByName).
  const hasTile = (idx) => houseLayers.some((l) => l.data && l.data[idx]);

  const visited = new Uint8Array(width * height);
  const houses = [];

  const OFFSETS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let start = 0; start < width * height; start++) {
    if (!hasTile(start) || visited[start]) continue;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const stack = [start];
    visited[start] = 1;

    while (stack.length) {
      const cell = stack.pop();
      const row = Math.floor(cell / width);
      const col = cell % width;

      const x = col * mapData.tilewidth;
      const y = row * mapData.tileheight;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + mapData.tilewidth > maxX) maxX = x + mapData.tilewidth;
      if (y + mapData.tileheight > maxY) maxY = y + mapData.tileheight;

      for (const [dr, dc] of OFFSETS) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;

        const neighbor = nr * width + nc;

        if (visited[neighbor] || !hasTile(neighbor)) continue;

        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    houses.push({
      bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    });
  }

  return houses;
}

function buildHouseInfo(layers, width, height) {
  const houseLayers = findAllTileLayersByName(layers, "house");

  if (houseLayers.length === 0) return null;

  const cells = new Set();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;

      // UNION: kahit alin sa mga House layer ang may laman dito, bahagi
      // ito ng bahay - hindi lang yung UNANG layer.
      const hasTile = houseLayers.some((l) => l.data && l.data[idx]);

      if (!hasTile) continue;

      cells.add(idx);

      const x = col * mapData.tilewidth;
      const y = row * mapData.tileheight;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + mapData.tilewidth > maxX) maxX = x + mapData.tilewidth;
      if (y + mapData.tileheight > maxY) maxY = y + mapData.tileheight;
    }
  }

  if (cells.size === 0) return null;

  const bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  return { cells, bbox, baseY: getCollisionGroundY(bbox) };
}

// =========================
// DRAW MAP
// =========================

// Hinati sa DALAWA ang pagguhit ng mapa, para may mapagsingitan ang
// niyebeng dapat nasa LIKOD ng lahat:
//
//   drawMapBackground()  - lupa, niyebe sa lupa
//   drawSnow("back")     - malalayong snowflake
//   drawMapObjects()     - puno, bahay, bakod, player (naka-Y-sort)
//   drawSnow("front")    - malalapit na snowflake
//
// Tingnan ang draw.js para sa buong pagkakasunod-sunod.

function drawMapBackground() {
  if (!mapReady) return;

  const world = getWorld();

  // AYOS: TINANGGAL na ang "placeholderRoom" na sanga (drawPlaceholderRoom,
  // worlds.js) - hiling ng user, walang WORLDS entry na dapat gumamit
  // nito mula ngayon (lahat ng interior ay may TUNAY na tileset na).

  // GRASSMAP: hiling ng user - "erase the bug of house in the ground"
  // (isang maliit na "ghost"/stray na guhit na lumalabas sa lupa,
  // malapit sa bahay). SANHI: dating tile-by-tile na RECONSTRUCTION
  // ito ng "upperground" layer (drawTileLayer, gamit ang gid/tileset
  // resolution) - VERIFIED (Python pixel-diff): may MALIIT na
  // pagkakaiba (ilang daang pixel lang, malapit sa bahay) sa pagitan
  // ng reconstruction na ito at ng TALAGANG grassmap.png - malamang
  // dahil sa mga pagbabago ng user sa Tiled (pag-eerase ng puno)
  // habang hindi pareho ang na-re-export na tile DATA laban sa
  // na-edit na larawan. Sa halip na umasa pa sa gid/tileset
  // reconstruction (madaling ma-out-of-sync, at palaging nare-reset
  // ang tileset path sa SIRA tuwing mag-e-export ulit sa Tiled - tingnan
  // ang paliwanag sa .tmj/.tsj file), DIREKTA na lang ngayong iginuguhit
  // ang BUONG grassmap.png bilang IISANG flat na larawan (isang
  // drawImage call lang) - GARANTISADONG eksaktong-eksakto ang
  // makikita sa laro laban sa TALAGANG larawan, kahit anong baguhin pa
  // sa Tiled/tileset sa hinaharap.
  if (currentWorld === "grassmap") {
    const mapWidthPx = mapData.width * mapData.tilewidth;
    const mapHeightPx = mapData.height * mapData.tileheight;

    drawGrassmapDirectRegion(0, 0, mapWidthPx, mapHeightPx);
    return;
  }

  const allTileLayers = flattenTileLayers(mapData.layers);
  const overlapLayerSet = new Set(allTileLayers.filter(isOverlapLayer));

  // "windows" at "door" - hiwalay na tilelayer (town) na may naka-ilaw
  // na art - dapat lang makita ito KAPAG GABI (tingnan ang
  // getNightAmount sa atmosphere.js), kaya hindi sila parte ng normal
  // na palaging-guguhitin na background - kondisyonal sila, hiwalay sa
  // ibaba.
  const nightAmount =
    typeof getNightAmount === "function" ? getNightAmount() : 0;

  for (const layer of allTileLayers) {
    if (overlapLayerSet.has(layer)) continue;

    const layerName = layer.name.toLowerCase();

    if (layerName === "windows" || layerName === "door") {
      if (nightAmount > 0.05) drawTileLayer(layer);
      continue;
    }

    // "lamps" - LAGING NASA HARAP ng player (hindi bahagi ng background
    // dito) - tingnan ang drawTownLampsForeground sa ibaba, tinatawag
    // ito sa draw.js PAGKATAPOS ng drawMapObjects, kaya kailangang
    // i-skip dito para hindi ito madoble ang pagkakaguhit. Ito rin ang
    // "map" layer (buong larawan ng town) - dahil hindi ito overlap
    // layer o "windows"/"door"/"lamps", direkta itong nade-draw dito
    // bilang FLAT BACKGROUND (hiling ng user: "map behind the
    // character") - IISA lang ang pagkakataon na iginuguhit ito, BAGO
    // pa man ang drawMapObjects (tingnan ang draw.js), kaya laging nasa
    // LIKOD ng player ang buong mapa.
    if (layerName === "lamps" || layerName === "snowlamps") continue;

    drawTileLayer(layer);
  }
}

// =========================
// "lamps" - LAGING NASA HARAP NG PLAYER
// =========================
//
// Hiling ng user (buong update ng town.tmj): ang parol ("lamps",
// pinagsamang layer na ngayon - dating hiwalay na "lumb"/"lambs") ay
// dapat laging NASA HARAP ng character ("character behind the lamps")
// - hindi Y-sort/dynamic, laging iginuguhit ITO PAGKATAPOS ng player,
// kahit saan pa siya tumayo. Tinatawag ito ng draw.js PAGKATAPOS ng
// drawMapObjects(), habang naka-active pa rin ang camera transform
// (world space).
function drawTownLampsForeground() {
  if (!mapReady || !mapData) return;

  const allTileLayers = flattenTileLayers(mapData.layers);
  const layer = allTileLayers.find(
    (candidate) =>
      candidate.name.toLowerCase() === "lamps" ||
      candidate.name.toLowerCase() === "snowlamps",
  );

  if (layer) drawTileLayer(layer);
}

// =========================
// SEE-THROUGH NA OCCLUSION (puno/bahay sa likod ng player)
// =========================
//
// Kapag ang isang bagay (puno/bahay/bato) ay iguguhit PAGKATAPOS ng
// player sa Y-sort (ibig sabihin natatakpan/tinatago nito ang player -
// tingnan ang paliwanag sa itaas ng drawMapObjects) AT nag-o-overlap ang
// bounding box nito sa player, medyo pinapalabo natin ITO LANG (hindi
// lahat ng ibang puno/bahay sa screen) para makita pa rin ang player sa
// likod nito. "Buong bagay" ang pinapalabo (hindi lang literal ang
// bahaging tinatamaan ng player) - mas simple at karaniwang paraan ito
// sa mga katulad na laro (Stardew Valley, atbp.), sapat na ang epekto
// nang hindi kailangan ng per-pixel na pagputol/mask.
const OCCLUSION_ALPHA = 0.45;

// "type" ng Tiled overlap instance na PUWEDENG mag-occlude - "trees"
// AT "house" (tingnan ang OVERLAP_LAYER_NAMES). Hindi ang "fence" o
// "rocks", kahit may bbox din sila (tingnan ang buildOverlapInstances/
// makeInstance) - hindi natin sila gustong lumabo.
//
// AYOS (hiling ng user): "yung mga trees or house na matakpan yung
// character is dapat nag oopacity" - IBINALIK ang "house" (dating
// tinanggal dahil madalas mag-trigger ang fade kahit sa TABI lang ng
// bahay ang player, hindi pa talaga LIKOD) - ngayon, NGINIPIN muna ang
// bbox ng bawat bahay papuntang gitnang 55% ng lapad lang (tingnan ang
// paliwanag sa loob ng overlapInstances.push para sa "house" sa ibaba)
// bago ito idinaragdag dito - PAREHONG konsepto ng "trunk-narrowing" na
// ginagawa na ng puno (makeInstance), kaya hindi na dapat masyadong
// mag-trigger kapag nasa gilid lang.
const OCCLUDABLE_OVERLAP_TYPES = new Set(["trees", "house"]);

// AYOS (bug report ng user, may video): "yung pinetree kailangan pa
// i-axe ng isang beses bago mag-opacity kapag dumaan yung character;
// dapat kahit di mag-gamit ng axe is dapat nag-oopacity parin" -
// SANHI: ang occlusion check ay naghahambing ng BASE/paanan ng puno
// (item.sortY = tree.row*TILE+TILE) laban sa PAANAN ng player
// (playerSortY). PERO ang pinetree ay MATAAS (~7.7 tiles) - malawak
// ang canopy nito na LUMULUKOB sa player kahit ang PAANAN ng player ay
// nasa MISMONG hanay pa lang (o bahagyang mas mababa) kaysa sa ugat ng
// puno. Sa ganoong posisyon, item.sortY <= playerSortY, kaya
// (nang WALANG tolerance) HINDI ito nag-fa-fade - kahit malinaw na
// nakatakip na ang canopy sa player. (Kaya "gumagana kapag nag-axe":
// ang axe-strike ay nagpo-force ng item.sortY = MAX_SAFE_INTEGER, na
// LAGING lalampas sa playerSortY, kaya doon lang nag-fa-fade.) AYOS:
// magdagdag ng TOLERANCE (para sa MATAAS na occluder LANG - puno,
// HINDI bahay) - nag-fa-fade na rin ito kung ang base ng puno ay
// nasa loob ng ~1.5 tiles PABABA ng paanan ng player, hindi na kailangang
// TALAGANG mas mataas pa. Sapat ito para saklawin ang "katabi/harap-
// tabi ng matangkad na puno" na sitwasyon, pero hindi masyadong
// agresibo (hindi lahat ng puno sa paligid ay biglang mag-fa-fade).
const TREE_OCCLUSION_SORT_TOLERANCE = TILE_SIZE * 1.5;

function shouldOccludeForPlayer(item, playerVisualBox, playerSortY) {
  if (item.isPlayer || !item.bbox) return false;

  // "type" - Tiled overlap instance lang ang meron nito (trees/house/
  // rocks/fence). Ang mga random na puno mula sa resources.js
  // (getResourceDrawables) at oak (decor.js) ay WALANG "type" - okay
  // lang, laging puno lang sila.
  if (item.type && !OCCLUDABLE_OVERLAP_TYPES.has(item.type)) return false;

  // MATAAS na occluder (puno - lahat maliban sa "house")? Bigyan ng
  // sort-tolerance (tingnan ang TREE_OCCLUSION_SORT_TOLERANCE sa itaas)
  // - ang bahay ay WALANG tolerance (0), dahil mababa/patag lang ito
  // at ayaw nating mag-fade ito kapag nasa tabi/harap lang ang player.
  const isTallOccluder = item.type !== "house";
  const sortTolerance = isTallOccluder ? TREE_OCCLUSION_SORT_TOLERANCE : 0;

  // Iguguhit lang ito PAGKATAPOS ng player (kaya siya sana ang
  // "tatakip") - kung TALAGANG nauna pa ito nang malaki sa player
  // (lampas pa sa tolerance), wala namang epekto ang pagpalabo (nasa
  // harap na ang player kahit ganoon).
  if (item.sortY <= playerSortY - sortTolerance) return false;

  return isColliding(item.bbox, playerVisualBox);
}

function drawDrawableWithOcclusion(item, playerVisualBox, playerSortY) {
  if (!shouldOccludeForPlayer(item, playerVisualBox, playerSortY)) {
    item.draw();
    return;
  }

  ctx.save();
  ctx.globalAlpha = OCCLUSION_ALPHA;
  item.draw();
  ctx.restore();
}

// =========================
// GRASSMAP - "DIRECT POSITION CROP" para sa house/trees/rocks
// =========================
//
// NATUKLASAN (VERIFIED sa pamamagitan ng isang Python simulation ng
// buong render): ang "upperground" background layer ng grassmap.tmj ay
// TAMA (gumagamit ng tileset firstgid=1, columns=70, larawan
// grassmap.png - eksaktong-eksaktong kapareho ng reference), PERO ang
// "house"/"trees"/"rocks" na OVERLAP layers (para sa Y-sort laban sa
// player) ay gumagamit ng IBANG tileset (firstgid=2801) na SIRA ang
// tunay na .tsj definition nito (parehong klase ng "sirang absolute
// path mula sa Tiled ng dating developer" na paulit-ulit nang nangyari
// sa proyektong ito - tingnan CLAUDE.md). Kapag ginawa itong basta
// "grassmap.png din" (parehong paraan ng ginawa sa firstgid=1), MALI
// ang kinukuha nitong crop (nagre-resulta sa "garbled"/maling
// parisukat na kulay-brick sa maling posisyon - ito ang sanhi ng
// report ng user).
//
// AYOS: dahil PAREHONG (col,row) POSITION sa mapa ang ginagamit ng
// overlap layer at ng background sa ILALIM nito (kopya lang ito para
// sa Y-sort, hindi bagong larawan), ang TAMANG paraan ay basta
// KUNIN DIREKTA ang pixel content mula sa grassmap.png sa EKSAKTONG
// PAREHONG (col,row) na posisyon nito sa mapa - HINDI na kailangang
// gumamit ng gid/tileset resolution kahit kailan para dito. VERIFIED
// (parehong Python simulation) - eksaktong-eksaktong tumutugma ito sa
// reference na larawan.
const grassmapDirectImage = new Image();
grassmapDirectImage.src = "./assets/map/grassmap.png";

// AYOS (hiling ng user: "di mo nilapat yung snowgrassmap sa grassmap")
// - ang totoong dahilan: itong drawGrassmapDirectRegion (ginagamit ng
// BUONG background NG grassmap, kasama pa ang mga puno/bato overlap
// instance sa ibaba) ay direktang gumuguhit mula sa IISANG hardcoded
// na Image (grassmapDirectImage, laging "grassmap.png") - kaya kahit
// matagumpay namang na-swap ng loadWorld() (map.js) ang .tmj papuntang
// snowgrassmap.tmj kapag snow weather, WALANG epekto ito sa TALAGANG
// nakikita sa screen, dahil hindi naman dito ginagamit ang loaded na
// tileset image - dito lang palagi, sa grassmap.png, kumukuha ng pixel
// ang function na ito. (Ito rin ang dahilan kung bakit gumana ang
// snowgrassmap2 - walang katulad na hardcoded na shortcut ang
// "grassmap2", normal na drawTile()/tileset system pa rin ang gamit
// doon.) AYOS: dagdag na "snow" na bersyon ng parehong Image - dito na
// pipiliin (batay mismo sa isSnowWeather(), kaparehong basehan ng
// snowhouseImage/houseImage sa itaas) kung alin sa dalawang larawan
// ang gagamitin, sa BAWAT tawag sa drawGrassmapDirectRegion.
const grassmapDirectSnowImage = new Image();
grassmapDirectSnowImage.src = "./assets/map/snowgrassmap.png";

function getGrassmapDirectImage() {
  const snowing = typeof isSnowWeather === "function" && isSnowWeather();

  return snowing ? grassmapDirectSnowImage : grassmapDirectImage;
}

function drawGrassmapDirectRegion(x, y, width, height) {
  const image = getGrassmapDirectImage();

  if (!image.complete || image.naturalWidth === 0) {
    return;
  }

  ctx.drawImage(image, x, y, width, height, x, y, width, height);
}

function drawMapObjects() {
  if (!mapReady) return;

  // Bagong listahan kada frame (tingnan ang collectHouseWindowLightPoints
  // sa itaas) - kung hindi ito ni-reset, mananatili ang mga bintana ng
  // isang world kahit lumipat ka na sa iba.
  houseWindowLightPoints = [];

  // Buong sprite ng player (hindi lang ang maliit na collision box sa
  // paanan) - ito ang gamit sa overlap check, para makita talaga kung
  // natatakpan ang KATAWAN niya, hindi lang ang mismong paanan.
  const playerVisualBox = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  const allTileLayers = flattenTileLayers(mapData.layers);

  const overlapLayerSet = new Set(allTileLayers.filter(isOverlapLayer));

  if (overlapLayerSet.size === 0) {
    // Walang puno/bahay (Tiled overlap layers) dito, pero puwede pa
    // ring may tanim/resource nodes (outdoor map na walang static na
    // bagay) - Y-sort pa rin sila laban sa player, hindi lang basta
    // i-skip.
    const playerBox = getPlayerCollisionBox();
    const playerSortY = playerBox.y + playerBox.height;
    const fallbackDrawables = [
      { sortY: playerSortY, order: Infinity, draw: drawPlayerWithTorchGlow, isPlayer: true },
    ];

    if (typeof getResourceDrawables === "function") {
      fallbackDrawables.push(...getResourceDrawables());
    }

    if (typeof getCarrotDrawables === "function") {
      fallbackDrawables.push(...getCarrotDrawables());
    }

    // Dekorasyon lang (decor.js) - ang OLDMAN muna (clickable NPC) bago
    // ang OAK trees, dahil kailangang malaman muna kung saan siya
    // (top-right ng mapa) bago mailagay ang 2 oak sa likod niya
    // (tingnan ang addBackdropOaksNearOldMan sa decor.js).
    if (typeof getOldManDrawables === "function") {
      fallbackDrawables.push(...getOldManDrawables());
    }

    if (typeof getOakDrawables === "function") {
      fallbackDrawables.push(...getOakDrawables());
    }

    if (typeof getBackdropOakDrawables === "function") {
      fallbackDrawables.push(...getBackdropOakDrawables());
    }

    // GRASSMAP - mga hand-placed na puno (decor.js) - kaparehong-pareho
    // ng OAK sa itaas (sariling sortY/bbox kada puno), pero FIXED na
    // posisyon (walang random). No-op sa ibang mundo.
    if (typeof getGrassmapTreeDrawables === "function") {
      fallbackDrawables.push(...getGrassmapTreeDrawables());
    }

    // Mga baboy (pig.js) - clickable/may health, gumagala sa mapa.
    if (typeof getPigDrawables === "function") {
      fallbackDrawables.push(...getPigDrawables());
    }

    // Mga damong tuft (grass.js) - dekorasyon lang, walang collision,
    // kaya puwedeng tapakan/dumaan ang player (tingnan ang grass.js).
    if (typeof getGrassTuftDrawables === "function") {
      fallbackDrawables.push(...getGrassTuftDrawables());
    }

    fallbackDrawables.sort((a, b) => a.sortY - b.sortY || a.order - b.order);

    for (const item of fallbackDrawables) {
      drawDrawableWithOcclusion(item, playerVisualBox, playerSortY);
    }

    return;
  }

  if (!overlapInstances) {
    houseInfo = buildHouseInfo(mapData.layers, mapData.width, mapData.height);

    // Hiwalay na listahan ng bawat ISANG bahay (connected component ng
    // House layer) - ang houseInfo sa itaas ay pinagsasama ang LAHAT ng
    // bahay sa iisang bbox, masyadong magaspang para sa per-bahay na
    // paghahati ng puno sa ibaba. Dito, isa-isa.
    const individualHouses = buildIndividualHouseBBoxes(
      mapData.layers,
      mapData.width,
      mapData.height,
    );

    const clusters = getOverlapClusters(mapData.layers);

    overlapInstances = [];

    for (const cluster of clusters) {
      // GRASSMAP: hiling ng user ("i want the character overlap in this
      // area") - ang mga DEKORASYONG bato ("rocks" tile layer, malapit
      // sa pintuan) ay maiksi/mababaw lang talaga (hindi tulad ng puno)
      // - PERO dahil dynamic Y-sorted pa rin ito, may pagkakataong
      // MAGKAMALI ang pagkakasunod-sunod (baseY na kinukwenta mula sa
      // SARILING bbox ng bunton ng bato) kapag malapit dito ang paanan
      // ng player - resulta, TINATAKPAN ng bato ang bahagi ng
      // character (VERIFIED sa report/screenshot ng user). Dahil hindi
      // naman kailangan ng bato ang occlusion/Y-sort effect (maiksi
      // lang ito, hindi katulad ng puno/bahay na puwedeng "tabunan" ng
      // player), FLAT/bahagi na lang ito ng background dito (kaparehong
      // ayos ng bahay sa itaas) - laging LIKOD ng player, walang
      // panganib na matakpan siya.
      if (cluster.type === "rocks" && currentWorld === "grassmap") continue;

      let built = buildOverlapInstances(
        cluster.layers,
        mapData.width,
        mapData.height,
        houseInfo ? houseInfo.cells : null,
        cluster.type,
      );

      // Para lang sa PUNO: hatiin ang mga instance na pumapaligid sa
      // bahay, para ang bahaging nasa itaas/likod ng bahay ay tama ang
      // lalim (nasa likod, hindi nakapatong sa bubong).
      if (cluster.type === "trees") {
        built = splitTreeInstancesAroundHouses(built, individualHouses);
      }

      overlapInstances.push(...built);
    }

    // BAGO (hiling ng user): kaya nga TINAGGAL natin ang "trees"/"rocks"
    // dynamic Y-sort para sa grassmap (naunang ayos) - ito lang talaga
    // ang PANSAMANTALANG paraan para maiwasan ang pagkawala ng player
    // sa likod ng BAHAY (na SIRA ang baseY nito, tingnan sa ibaba). Ang
    // "trees"/"rocks" ay LIGTAS/TAMA (`makeInstance()`, itaas) - ang
    // baseY nila ay kinukuha diretso sa SARILING bbox ng bawat
    // instance/kumpol (`tileBottom`, hindi umaasa sa `collisions`
    // array kagaya ng bahay) - kaya walang dahilan para hindi sila
    // magkaroon ng normal na Y-sort + opacity occlusion (kaparehong
    // gawi ng random na puno/oak) - IBINALIK na ito ngayon. Ang
    // ACTUAL na guhit (draw closure sa ibaba) ay gumagamit pa rin ng
    // direct-position crop (drawGrassmapDirectRegion) sa halip na
    // drawTile - dahil sira ang gid/tileset ng partikular na layer na
    // ito (tingnan ang paliwanag doon).

    // Ang bahay ay hiwalay na ginagawa (hindi sa stamps), para
    // siguradong IISANG bagay siya na may sariling ground line.
    //
    // MAHALAGA: bawat INDIVIDUAL na bahay (connected component, tingnan
    // ang buildIndividualHouseBBoxes) ay dapat may SARILI/HIWALAY na
    // `baseY`/`bbox` - dating IISA lang (mula sa `houseInfo`, na
    // pinagsasama-sama ang LAHAT ng bahay sa IISANG malaking bbox) ang
    // ginagamit para sa LAHAT ng bahay, kaya (a) mali ang Y-sort ng mga
    // bahay laban sa puno (getCollisionGroundY ay pumipili lang ng
    // PINAKAMALAKING-OVERLAP na collision box sa loob ng buong
    // pinagsamang bbox, kaya isa lang sa mga bahay ang tamang baseY -
    // ito ang dahilan kung bakit "nasa harap" na puno ay natatakpan pa
    // rin ng bahay), at (b) sobrang laki/maluwag ang bbox na ginagamit
    // ng occlusion check (`shouldOccludeForPlayer`), kaya kahit sa
    // GILID lang ng bahay (hindi pa talaga LIKOD) ay nagiging
    // transparent na agad ang player.
    //
    // AYOS (hiling ng user): "yung mga trees or house na matakpan yung
    // character is dapat nag oopacity yung trees or bahay" - NGINIPIN
    // muna ang bbox papuntang GITNANG 55% ng lapad lang (naka-center)
    // bago gamitin sa occlusion check - PAREHONG konsepto ng "trunk-
    // narrowing" ng puno (makeInstance, itaas): kung buong lapad/
    // footprint ang gagamitin, nag-o-opacity na rin kahit nasa GILID
    // lang (hindi pa talaga LIKOD) ng bahay ang player - ito mismo ang
    // dahilan kung bakit tinanggal muna ang "house" sa
    // OCCLUDABLE_OVERLAP_TYPES dati (tingnan sa ibaba - IBINALIK na ito
    // ngayon).
    //
    // GRASSMAP: NANATILI pa ring excluded ang bahay dito (VERIFIED
    // dati: "random/hindi-kaugnay na malawak na collision box" ang
    // nahuhuli ng getCollisionGroundY para sa partikular na bahay na
    // ito, kaya MALI/random ang naging baseY) - IBA kasi ang art
    // pipeline dito (isang MALAKING pre-drawn na larawan, grassmap.png,
    // hindi hiwalay na house.png sprite na puwedeng Y-sort/i-occlude
    // nang ligtas gaya ng ginagawa dito para sa ibang mundo) - kaya
    // mas malaki ang panganib na masira ang background rendering kung
    // ito rin ay ipipilit dito nang walang live/visual na pagsubok.
    // Manatili muna itong FLAT/bahagi ng background (drawMapBackground) -
    // walang panganib na "matakpan"/mawala ang player, pero wala ring
    // occlusion fade sa ngayon.
    if (individualHouses.length > 0 && currentWorld !== "grassmap") {
      for (const house of individualHouses) {
        const fullBbox = house.bbox;
        const narrowWidth = fullBbox.width * 0.55;

        overlapInstances.push({
          type: "house",
          tiles: [],
          bbox: {
            x: fullBbox.x + (fullBbox.width - narrowWidth) / 2,
            y: fullBbox.y,
            width: narrowWidth,
            height: fullBbox.height,
          },
          baseY: getCollisionGroundY(fullBbox),
        });
      }
    }

    // Ang pagkakasunod-sunod ng paggawa dito ay SUNOD sa pagkakasunod-
    // sunod ng layer sa Tiled. Itinatabi natin ito bilang "order" para
    // may malinaw na batayan kapag pantay ang base ng dalawang bagay.
    overlapInstances.forEach((instance, index) => {
      instance.order = index;
    });
  }

  // =================================
  // Y-SORT (PAINTER'S ALGORITHM)
  // =================================
  //
  // Ang bawat puno O bahay ay iguguhit bilang IISANG buong bagay (hindi
  // na hiwa-hiwalay ang mga bahagi nito). Ikukumpara natin ang base
  // (kung saan dumidikit sa lupa) ng buong bagay sa paanan (feet) ng
  // player:
  //
  //  - Kung mas mababa pa sa screen ang base nito kesa sa paanan ng
  //    player (ibig sabihin hindi pa "naabot/nalagpasan" ng player),
  //    iguguhit ang BUONG bagay PAGKATAPOS ng player - kaya
  //    natatakpan/naoverlap niya nang buo ang player.
  //  - Kung naabot/nalagpasan na ng player ang base nito, iguguhit ang
  //    buong bagay BAGO ang player - kaya siya ang makikita sa harap.
  //
  // Ito rin mismo ang dahilan kung bakit gumagana ito nang pareho para
  // sa puno at sa bahay - parehong "overlap instance" lang sila, walang
  // espesyal na logic per-type.

  const playerBox = getPlayerCollisionBox();
  const playerSortY = playerBox.y + playerBox.height;

  const drawables = [];

  for (const instance of overlapInstances) {
    const isHouse = instance.type === "house";

    // IISANG anchor point para sa BUONG bagay - ang unang tile nito.
    // Ginagamit ito ng lahat ng piraso ng bagay para sa desisyon ng
    // snow<->clear, para sabay-sabay silang lumipat (tingnan ang
    // paliwanag sa drawTile). WALANG `.tiles` ang bahay ngayon (hiwalay
    // na PNG na ang ginagamit, tingnan ang drawHouseImageAt) - hindi na
    // kailangan ng seasonX/seasonY dito.
    const seasonX = isHouse ? 0 : instance.tiles[0].x;
    const seasonY = isHouse ? 0 : instance.tiles[0].y;

    // Ang mga PUNO lang ang laging Snow.png (HINDI dapat lumipat sa
    // Snow-clear.png) - ang partikular na mga tile na ginagamit ng
    // Trees group ay wala pang katapat na guhit sa Snow-clear.png
    // (blangko/transparent doon), kaya kung pinapayagan ang swap,
    // "nawawala" ang puno sa gitna ng snow<->clear transition. Bahay
    // (at iba pang overlap type) ay normal pa ring lumilipat.
    const allowClearArt = instance.type !== "trees";

    drawables.push({
      sortY: instance.baseY,
      order: instance.order,
      bbox: instance.bbox,
      type: instance.type,
      draw: () => {
        // Bahay: hiwalay/kumpletong PNG na larawan (house.png/
        // snowhouse.png, tingnan ang drawHouseImageAt sa itaas) - isang
        // `drawable` na PER INDIVIDUAL na bahay (tingnan sa itaas -
        // hindi na isang malaking pinagsama-samang instance), kaya
        // ISANG bbox lang dito, hindi na kailangang mag-loop.
        if (isHouse) {
          // (Ang bahay ng grassmap ay HINDI na dumarating dito - hindi
          // na ito idinadagdag sa overlapInstances para sa mundong
          // iyon, tingnan ang paliwanag sa itaas kung saan ginagawa ang
          // overlapInstances. Nananatili ang sanga na ito para sa
          // village/newmap, na gumagamit pa rin ng tunay na
          // house.png/snowhouse.png sprite.)
          drawHouseImageAt(instance.bbox);
          collectHouseWindowLightPoints(instance.bbox);
          return;
        }

        // GRASSMAP: kaparehong dahilan/paraan ng itaas - ang tileset na
        // ginagamit ng "trees"/"rocks" na overlap layer dito ay SIRA
        // (tingnan ang paliwanag sa itaas ng drawGrassmapDirectRegion),
        // kaya sa halip na `drawTile(tile.gid, ...)` (gid-based, mali
        // ang crop), direkta na lang kunin ang tamang pixel content sa
        // PAREHONG (x,y) na posisyon mismo mula sa grassmap.png.
        if (currentWorld === "grassmap") {
          for (const tile of instance.tiles) {
            drawGrassmapDirectRegion(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
          }
          return;
        }

        for (const tile of instance.tiles) {
          drawTile(tile.gid, tile.x, tile.y, seasonX, seasonY, allowClearArt);
        }
      },
    });
  }

  drawables.push({
    sortY: playerSortY,
    order: Infinity,
    draw: drawPlayerWithTorchGlow,
    isPlayer: true,
  });

  // Mga random na puno/bato (resources.js) - hiwalay itong sistema sa
  // Tiled overlap layers sa itaas, kaya dito na lang sila isinasabit
  // bago mag-Y-sort, para tama ang lalim nila laban sa player.
  if (typeof getResourceDrawables === "function") {
    drawables.push(...getResourceDrawables());
  }

  // Mga tanim na carrots (dig.js) - pareho ring dahilan: para hindi
  // natatabunan ang mataas na dahon ng hinog na tanim ng katabing tile
  // o ng player.
  if (typeof getCarrotDrawables === "function") {
    drawables.push(...getCarrotDrawables());
  }

  // Dekorasyon lang (decor.js) - ang OLDMAN muna (clickable NPC, TOP-
  // RIGHT ng mapa) bago ang OAK trees, dahil kailangang malaman muna
  // kung saan siya bago mailagay ang 2 oak sa likod niya (tingnan ang
  // addBackdropOaksNearOldMan sa decor.js). Oak: choppable (axe/kamao,
  // tingnan ang resources.js). Oldman: clickable din (tindahan,
  // tingnan ang dig.js).
  if (typeof getOldManDrawables === "function") {
    drawables.push(...getOldManDrawables());
  }

  if (typeof getOakDrawables === "function") {
    drawables.push(...getOakDrawables());
  }

  if (typeof getBackdropOakDrawables === "function") {
    drawables.push(...getBackdropOakDrawables());
  }

  // GRASSMAP - mga hand-placed na puno (decor.js) - tingnan ang
  // paliwanag sa fallback branch sa itaas (drawMapObjects). Nandito rin
  // ito para tuloy-tuloy gumana kahit magdagdag pa ng ibang Tiled
  // overlap layer (trees/house/atbp.) sa grassmap.tmj sa hinaharap.
  if (typeof getGrassmapTreeDrawables === "function") {
    drawables.push(...getGrassmapTreeDrawables());
  }

  // Mga baboy (pig.js) - clickable/may health, gumagala sa mapa. Y-sort
  // din sila (kaparehong pattern ng oldman/oak) para tamang-tama ang
  // lalim laban sa player at sa ibang bagay.
  if (typeof getPigDrawables === "function") {
    drawables.push(...getPigDrawables());
  }

  // Mga damong tuft (grass.js) - dekorasyon lang, walang collision,
  // kaya puwedeng tapakan/dumaan ang player (tingnan ang grass.js).
  if (typeof getGrassTuftDrawables === "function") {
    drawables.push(...getGrassTuftDrawables());
  }

  // Kapag MAGKAPAREHO ang base ng dalawang bagay, pareho sila ng lalim -
  // kaya kailangan ng pangalawang batayan. Ginagamit natin ang
  // pagkakasunod-sunod ng layer sa Tiled: kung ano ang mas nauna doon,
  // mas nauna rin dito. Yun naman ang intensyon mo nang iguhit mo sila.
  //
  // Dati, "(a.isPlayer ? 1 : -1)" ang gamit dito - MALI iyon: sa dalawang
  // hindi-player, -1 ang isinasauli KAHIT ALIN pa ang ikumpara, kaya
  // hindi consistent ang comparator at hindi matukoy ang magiging order.
  // Dito mismo nagmumula yung sumasagabat na katawan ng puno sa bakod:
  // pantay-pantay silang lahat sa base 496, kaya bahala na kung sino ang
  // mauuna.
  //
  // Ang player ay may order = Infinity, kaya siya ang huli kapag pantay
  // ang base - nasa paanan kasi siya ng bagay, ibig sabihin nasa harapan.
  drawables.sort((a, b) => a.sortY - b.sortY || a.order - b.order);

  for (const item of drawables) {
    drawDrawableWithOcclusion(item, playerVisualBox, playerSortY);
  }
}

// =========================
// LOAD WORLD
// =========================
//
// Hindi na iisa ang mapa - may nayon sa labas at may loob ng bahay.
// Tinatawag ito sa simula ng laro at tuwing dadaan ka sa isang pintuan.

// Habang naglo-load, hindi natin puwedeng payagan ang pangalawang
// paglipat - baka magkahalo ang dalawang mapa.
let worldLoading = false;

// Kasalukuyang naka-load ba ang "snow" na bersyon (world.snowUrl) ng
// currentWorld, o ang normal (world.url)? Itinatakda ito sa loadWorld
// sa ibaba - ginagamit ito ng checkWorldSnowSwap() (tinatawag kada
// frame mula sa update.js) para malaman kung "luma" na ang naka-load
// (hal. town.tmj pa rin kahit umuulan na ng niyebe ngayon) at
// kailangan nang i-reload papuntang snowtown.tmj - o kabaliktaran.
let currentWorldSnowVariant = false;

// Gaano katagal dapat "makita" ang loading overlay bago ito matago
// ulit - ang totoong fetch() ng local na .tmj ay halos instant, kaya
// kung walang minimum na ito, "flash" lang siya (hindi mo talaga
// mababasa/mapapansin). Dahil si worldLoading din ang ginagamit ng
// auto-door check (update.js), ito rin ang bumabahalang gumawa ng
// "cooldown" - hindi kaagad ma-re-trigger ang parehong pintuan pabalik-
// balik habang naka-display pa ang overlay.
const MIN_LOADING_MS = 450;

async function loadWorld(name, spawn) {
  const world = WORLDS[name];

  if (!world) {
    console.error("Walang mundong tinatawag na:", name);
    return;
  }

  if (worldLoading) return;

  worldLoading = true;

  const loadStartedAt = performance.now();
  const loadingOverlay = document.getElementById("world-loading-overlay");
  loadingOverlay?.classList.remove("hidden");

  // Ipahinga muna ang pagguhit habang pinapalitan ang mapa, at burahin
  // ang lahat ng naka-cache na galing sa dating mapa.
  mapReady = false;
  overlapInstances = null;
  houseInfo = null;
  collisions = [];
  tileArtBottoms.clear();

  // Iba nang mundo - walang dalang bakas mula sa dati.
  clearFootprints();

  // Kung may "snowUrl" ang mundong ito (hal. "town" -> snowtown.tmj),
  // gamitin ito sa halip ng normal na "url" KAPAG snow day ngayon
  // (isSnowWeather(), calendar.js) - typeof guard dahil dig.js/
  // calendar.js ay maaaring hindi pa naka-load sa unang beses (map.js
  // mismo ang unang tumatawag ng loadWorld(), bago pa man umabot ang
  // <script> tag ng dig.js/calendar.js sa index.html) - default sa
  // normal (walang-snow) na mapa kapag ganito, ligtas namang gagana
  // nang tama ang susunod na loadWorld() (hal. paglabas-pasok sa
  // pintuan) dahil naka-load na lahat ng script sa puntong iyon.
  const useSnowMap =
    Boolean(world.snowUrl) &&
    typeof isSnowWeather === "function" &&
    isSnowWeather();
  const mapUrl = useSnowMap ? world.snowUrl : world.url;

  // Itala kung alin dito ang aktwal na na-load - ginagamit ito ng
  // checkWorldSnowSwap() sa ibaba para malaman kung "luma" na ito
  // (nagbago na ang panahon simula noong huling pagkarga nitong mapa).
  currentWorldSnowVariant = useSnowMap;

  try {
    const response = await fetch(mapUrl + CACHE_BUST);

    if (!response.ok) {
      throw new Error("Hindi ma-load ang mapa: " + mapUrl);
    }

    const map = await response.json();

    mapData = map;
    currentWorld = name;

    // Kailangang naka-load na ang mga tileset BAGO tayo mag-draw -
    // kung hindi, walang lalabas na tile sa mga unang frame.
    await loadTilesets(map);

    const collisionLayer = map.layers.find(
      (layer) =>
        layer.type === "objectgroup" &&
        layer.name.toLowerCase() === "collisions",
    );

    collisions = collisionLayer
      ? collisionLayer.objects.filter(
          (object) => object.width > 0 && object.height > 0,
        )
      : [];

    // Bagong "wall-only" na collision PER bahay (house.png/snowhouse.png
    // sprite, tingnan ang "BAHAY -> HIWALAY NA PNG" sa itaas) - VERIFIED
    // (report ng user): may mga puwang sa dating collision (lumang mga
    // Tiled object, posibleng hindi na tugma sa bagong PNG art) - lalo
    // na sa GILID ng pinto at sa ITAAS ng pinto (gable/window area) -
    // puwedeng dumaan/lumusot ang player doon. Idinaragdag ito SA IBABAW
    // ng (hindi pinapalitan) ang mga lumang collision object - tatlong
    // hugis PER bahay (kaliwang pader, kanang pader, at "lintel" sa
    // itaas ng pinto), may BUTAS lang sa eksaktong lugar ng door TRIGGER
    // (worlds.js DOORS) para hindi masira ang "Pumasok" na interaction -
    // tingnan ang buildHouseWallCollisions sa ibaba.
    const houses = buildIndividualHouseBBoxes(
      map.layers,
      map.width,
      map.height,
    );

    // I-cache globally para magamit ng minimap.js (tingnan ang
    // paliwanag sa itaas ng currentWorldHouseBBoxes) - HINDI ito
    // kasama sa mga mundong walang bahay (grassmap, interiors) - basta
    // blangkong array na lang ang babalik ng buildIndividualHouseBBoxes
    // dito, kaya safe lang basta i-assign palagi.
    currentWorldHouseBBoxes = houses;

    collisions.push(...buildHouseWallCollisions(name, houses));

    if (spawn) {
      player.x = spawn.x;
      player.y = spawn.y;

      // Sa pintuan mismo tayo lumalabas, kaya kailangang hindi muna
      // gumana ang E hangga't hindi ka umaalis doon.
      arrivedAtDoor = true;
    }

    console.log(
      "Mundo:",
      name,
      "|",
      map.width + "x" + map.height,
      "| collisions:",
      collisions.length,
    );

    // Kailangang naka-load na ang mapa at ang mga collision bago natin
    // masuri kung magagamit pa ang posisyon ng player.
    validatePlayerPosition();

    mapReady = true;

    savePlayerPosition();
  } catch (error) {
    console.error(error);
  } finally {
    // Sapilitang hintayin ang MIN_LOADING_MS (kung mas mabilis natapos
    // ang totoong load) bago itago ang overlay AT bago payagan ulit
    // ang susunod na auto-door - ito na ang "cooldown" (iisang flag
    // lang, walang bagong hiwalay na variable pa na kailangan).
    const elapsed = performance.now() - loadStartedAt;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

    setTimeout(() => {
      worldLoading = false;
      loadingOverlay?.classList.add("hidden");
    }, remaining);
  }
}

// =========================
// PAG-SWITCH NG MAPA HABANG NAKATAYO (town.tmj <-> snowtown.tmj)
// =========================
//
// AYOS: dati, iisang beses lang sinusuri kung "snow" ba ang dapat
// gamiting bersyon ng mapa - eksaktong sandali lang na tinatawag ang
// loadWorld() (pagpasok sa mundo/pag-reload ng page). Kaya kung
// nagbago ang panahon HABANG naroroon ka pa rin (o kung nag-DEFAULT
// nang mali ang unang pagkarga dahil hindi pa naka-load ang
// calendar.js/dig.js sa mismong sandaling iyon - tingnan ang paliwanag
// sa loadWorld sa itaas), hindi na ito napapansin/naitatama kailanman
// hangga't hindi ka lumalabas at pumapasok ulit sa mundo.
//
// Ang function na ito ay tinatawag KADA FRAME (update.js) - sinusuri
// nito kung tumutugma pa ba ang naka-load na bersyon (currentWorldSnowVariant)
// sa TALAGANG dapat na ngayon (isSnowWeather()) - kung hindi na
// tumutugma, awtomatiko nang nagre-reload ng currentWorld (loadWorld,
// WALANG spawn override - kaya nananatili ang player sa eksaktong
// kinatatayuan niya, mapa lang ang napapalitan sa ilalim niya). Kaya
// ito rin mismo ang AWTOMATIKONG nag-aayos sa unang-pagkarga na bug sa
// itaas - sa sandaling maka-load na ang calendar.js at magsimula ang
// update loop, agad itong nasusuri/naitatama sa unang ilang frame.
function checkWorldSnowSwap() {
  if (worldLoading || !mapReady || !currentWorld) return;
  if (typeof isSnowWeather !== "function") return;

  const world = WORLDS[currentWorld];

  if (!world || !world.snowUrl) return;

  const shouldUseSnowMap = isSnowWeather();

  if (shouldUseSnowMap === currentWorldSnowVariant) return;

  loadWorld(currentWorld);
}

// Ibinabalik tayo sa kung saan tayo huling tumigil - pati na kung nasa
// loob ba tayo ng bahay o nasa labas.
//
// AYOS: TINANGGAL na ang mga dating hiwalay na MIGRATION na sanga para
// sa "village"/"houseInside" (parehong mundo ay TINANGGAL na rin sa
// WORLDS, hiling ng user: "2 na lang, town at grassmap") - hindi na
// ito kailangan dahil ang `WORLDS[savedPlayer.world]` check sa ibaba
// ay AWTOMATIKO nang bumabalik sa DEFAULT_WORLD ("grassmap") kapag
// ang naka-save na mundo (kahit "village"/"newmap"/"houseInside"/
// "starter") ay wala nang entry sa WORLDS - iisang generic na fallback
// na lang, gumagana pa rin ito kahit anong lumang world name pa ang
// mahanap sa isang matandang save.
let savedWorld =
  savedPlayer && WORLDS[savedPlayer.world] ? savedPlayer.world : DEFAULT_WORLD;

// AYOS (hiling ng user: "gusto ko lang may loading play load settings
// exit bago mag start") - ang UNANG pagtawag sa loadWorld() (dating
// awtomatiko, tumatakbo agad sa sandaling ma-parse ang script na ito)
// ay NASA LOOB na ngayon ng function na ito - HINDI na ito awtomatikong
// tumatakbo. Ang js/main-menu.js na ang bahalang tumawag dito, sa
// sandaling pindutin ng user ang "Play" (o pagkatapos pumili ng save sa
// "Load" popup - tingnan ang paliwanag doon) sa BAGONG main menu
// overlay (index.html, #main-menu-overlay) - dati, deretso agad
// pumapasok sa mundo nang walang anumang menu.
function beginInitialWorldLoad() {
  if (typeof GRASSMAP_RESOURCES_LOADED !== "undefined") {
    GRASSMAP_RESOURCES_LOADED.then(() => {
      loadWorld(savedWorld, null);
    });
  } else {
    loadWorld(savedWorld, null);
  }
}
