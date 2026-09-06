// =========================
// MINIMAP (BAGONG HILING ng user)
// =========================
//
// "kaya ba lagyan ng minimap sa top right baba ng weather section gawa
// ka ng circle na navigation ng character tapos minimap ng mapa" -
// bilog na overview ng KAPALIGIRAN ng player (nakikita ang mga collision -
// pader/bundok/puno/bato - bilang maliliwanag na hugis laban sa
// madilim na background, ang mga portal/pintuan bilang gintong tuldok,
// at ang PLAYER bilang tatsulok na nakaturo sa DIREKSYON niya -
// player.direction: "up"/"down"/"left"/"right") - tingnan ang #minimap/
// #minimap-canvas sa index.html/style.css.
//
// Iginuguhit sa SARILING canvas (HIWALAY sa pangunahing #gameCanvas) -
// fixed UI overlay, hindi apektado ng camera/zoom ng laro. Tinatawag
// kada frame mula sa dulo ng draw() (draw.js).
//
// AYOS (hiling ng user): "i accurate mo yung mga bagay bagay like
// siguro kahit yung mga icon na lang ilagay mo imbis na box dun sa mga
// trees rocks etc. tapos alisin mo yung bawat sulok ng map sa minimap
// like kita yung black gusto ko hindi makikita yun kapag nasa dulo na
// yung character ko ng map" - dalawang bahagi ito:
//   1. Puno/bato (at naka-lagay na Crafter/Stove/Light/Bed) - dating
//      basta GENERIC na parisukat (mula sa `collisions` array, kaparehong
//      hugis/laki ng collision box) ang ipinapakita, kahit anong uri -
//      hindi makilala kung ano talaga. Ngayon, may sariling maliliit na
//      ICON (tatsulok na luntian = puno, bilog na abo = bato, kulay na
//      parisukat ayon sa uri = naka-lagay na structure) - tingnan ang
//      drawMinimapTreeIcon/drawMinimapStoneIcon/drawMinimapStructures
//      sa ibaba. Ang GENERIC na box-loop naman ay para na lang ngayon
//      sa TALAGANG static na bahagi ng mapa (pader/bundok/bahay - mga
//      collision na WALANG "resourceKey", tingnan ang skip sa ibaba).
//   2. "Black corners" sa dulo ng mapa - dating LAGING naka-CENTER sa
//      PLAYER ang "view" (centerX/centerY), kaya kapag malapit na siya
//      sa gilid ng mapa, ang KALAHATI ng bilog ay wala nang laman
//      (lampas na sa TALAGANG sukat ng mapa) - naka-EXPOSE ang dark na
//      background ng #minimap (CSS) sa likod nito. Ngayon, CLINAMP ang
//      view center (kaparehong-pareho ng gawi ng camera.follow(),
//      camera.js) - hindi na ito lalampas sa gilid ng mapa, kaya laging
//      puno ng TALAGANG lupa ang buong bilog, kahit nasa mismong dulo
//      na ng mapa ang player (sa halip, ang PLAYER MARKER na ang
//      "lumalayo" sa gitna papunta sa gilid ng bilog sa mga ganitong
//      pagkakataon - karaniwang gawi ito sa mga minimap).

// Dapat tumugma sa width/height ng #minimap-canvas sa index.html (150).
const MINIMAP_SIZE = 150;

// AYOS (hiling ng user): "medyo ilapit mo yung zoom sa minimap kahit 3
// mo lang" - dating "fit buong mapa sa loob ng bilog" (auto-scale) ang
// gawi (masyadong LAYO/maliit ang nakikita) - ngayon, ZOOMED IN na
// (naka-multiply ng MINIMAP_ZOOM sa "fit" na batayang scale), at naka-
// CENTER sa PLAYER (hindi na sa gitna ng buong mapa) - kaya "gumagalaw"
// ang minimap kasabay ng player (parang tunay na naka-follow na
// camera), hindi na static/buong-mapa view.
const MINIMAP_ZOOM = 7;

// Maliit na puwang sa loob ng bilog - ginagamit lang bilang batayan ng
// "fit" scale bago i-multiply ng MINIMAP_ZOOM sa itaas.
const MINIMAP_PADDING = 8;

let minimapCanvas = null;
let minimapCtx = null;

// =========================
// TALAGANG LARAWAN NG MAPA (bagong hiling ng user) - "kahit mismong
// buong map na lang ilagay, di na plain color"
// =========================
//
// Sa halip na basta FLAT/payak na kulay ang "lupa" (tingnan ang
// drawMinimap sa ibaba), iguguhit na ang TALAGANG background image ng
// kasalukuyang mundo (parehong larawan na ginagamit ng laro mismo,
// hal. grassmap.png/town.png) - mas totoo/kapaki-pakinabang ang
// itsura (makikita mismo sa loob ng minimap ang shape ng dirt patch,
// bahay, atbp, hindi lang basta berdeng kahon). May "snow" na bersyon
// din, kaparehong pattern ng ibang bahagi dito (isSnowWeather()).
//
// Isang IMAGE lang kada mundo (kasama ang snow variant nito) - dahil
// ang mga mundong ito ay TALAGANG IISANG malaking larawan bilang
// buong background (parehong konsepto ng drawGrassmapDirectRegion sa
// map.js - ang buong .tmj/tileset ng bawat isa ay eksaktong-eksaktong
// tumutugma sa parehong PNG na ito, kaya ligtas/tama ang basta i-scale
// papuntang minimap size).
const MINIMAP_WORLD_BACKGROUND_PATHS = {
  grassmap: {
    normal: "./assets/map/grassmap.png",
    snow: "./assets/map/snowgrassmap.png",
  },
  grassmap2: {
    normal: "./assets/map/grassmap2.png",
    snow: "./assets/map/snowgrassmap2.png",
  },
  town: {
    normal: "./assets/map/town.png",
    snow: "./assets/map/snowtown.png",
  },
};

const MINIMAP_WORLD_BACKGROUND_IMAGES = {};

for (const worldName in MINIMAP_WORLD_BACKGROUND_PATHS) {
  const paths = MINIMAP_WORLD_BACKGROUND_PATHS[worldName];

  const normalImage = new Image();
  normalImage.src = paths.normal;

  const snowImage = new Image();
  snowImage.src = paths.snow;

  MINIMAP_WORLD_BACKGROUND_IMAGES[worldName] = {
    normal: normalImage,
    snow: snowImage,
  };
}

// Kinukuha ang TAMANG larawan (normal o snow) para sa KASALUKUYANG
// mundo - `null` kung walang katumbas na larawan ang mundong ito
// (future-proof: hal. isang bagong mundo na wala pa sa listahan sa
// itaas) - FALLBACK na lang sa payak na kulay ang drawMinimap sa mga
// ganitong pagkakataon.
function getMinimapWorldBackgroundImage() {
  if (typeof currentWorld === "undefined" || !currentWorld) return null;

  const entry = MINIMAP_WORLD_BACKGROUND_IMAGES[currentWorld];

  if (!entry) return null;

  const snowing = typeof isSnowWeather === "function" && isSnowWeather();

  return snowing ? entry.snow : entry.normal;
}


function getMinimapContext() {
  if (minimapCtx) return minimapCtx;

  minimapCanvas = document.getElementById("minimap-canvas");

  if (!minimapCanvas) return null;

  minimapCtx = minimapCanvas.getContext("2d");

  return minimapCtx;
}

// Anong anggulo (radians) ang itinuturo ng tatsulok ng player, base sa
// player.direction - "right" (0 rad) ang "unang itsura" ng tatsulok
// (tingnan ang drawMinimapPlayerMarker sa ibaba), kaya doon nagsisimula
// ang pag-ikot.
const MINIMAP_DIRECTION_ANGLES = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

function drawMinimapPlayerMarker(ctx2, x, y, direction) {
  const angle = MINIMAP_DIRECTION_ANGLES[direction] || 0;

  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(angle);

  ctx2.fillStyle = "#ffd25a";
  ctx2.strokeStyle = "rgba(0, 0, 0, 0.65)";
  ctx2.lineWidth = 1;

  ctx2.beginPath();
  ctx2.moveTo(6, 0);
  ctx2.lineTo(-4, 4);
  ctx2.lineTo(-4, -4);
  ctx2.closePath();
  ctx2.fill();
  ctx2.stroke();

  ctx2.restore();
}

// AYOS (hiling ng user): "hindi ba kaya na kahit yung mismong img na
// lang ilagay tapos medyo lakihan sa map ng mga assets like bahay
// trees, rocks, grass, pig, etc" - sa halip na basta vector na hugis
// (tatsulok/bilog), ginagamit na ngayon ang AKTWAL na sprite ng bawat
// bagay (parehong Image object na ginagamit ng laro mismo - tingnan sa
// ibaba kung saan galing bawat isa), naka-scale down lang papunta sa
// isang maliit (pero medyo malaki na, hiling ng user) na destination
// size sa minimap, naka-center sa tamang (x,y). May FALLBACK pa rin sa
// simpleng vector na hugis (drawMinimapTreeIcon/StoneIcon sa ibaba)
// kung sakaling hindi pa fully-loaded ang tunay na larawan (hal.
// napaka-bilis mag-render ng unang frame) - para may makita pa rin
// kahit papaano sa halip na basta mawala/maging blangko.
function drawMinimapSpriteIcon(ctx2, image, x, y, destWidth) {
  if (!image || !image.complete || !image.naturalWidth) return false;

  const destHeight = destWidth * (image.naturalHeight / image.naturalWidth);

  ctx2.drawImage(image, x - destWidth / 2, y - destHeight / 2, destWidth, destHeight);

  return true;
}

// Fallback lang - maliit na tatsulok (parang puno/pino), FIXED na laki
// (hindi apektado ng minimap scale, kaparehong konsepto ng player
// marker sa itaas).
function drawMinimapTreeIcon(ctx2, x, y) {
  ctx2.fillStyle = "#4fae6f";
  ctx2.strokeStyle = "rgba(15, 35, 20, 0.85)";
  ctx2.lineWidth = 0.7;

  ctx2.beginPath();
  ctx2.moveTo(x, y - 4.2);
  ctx2.lineTo(x + 3.6, y + 3.4);
  ctx2.lineTo(x - 3.6, y + 3.4);
  ctx2.closePath();
  ctx2.fill();
  ctx2.stroke();
}

// Fallback lang - maliit na bilog na abo (parang bato), kaparehong
// FIXED na laki.
function drawMinimapStoneIcon(ctx2, x, y) {
  ctx2.fillStyle = "#a6a297";
  ctx2.strokeStyle = "rgba(35, 33, 28, 0.85)";
  ctx2.lineWidth = 0.7;

  ctx2.beginPath();
  ctx2.arc(x, y, 2.8, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
}

// Destination width (minimap px) ng bawat uri ng icon - "medyo
// lakihan" (hiling ng user) - pinalaki pa ito bukod sa dating
// pagpapalaki ng vector fallback sa itaas.
const MINIMAP_TREE_ICON_WIDTH = 11;
const MINIMAP_STONE_ICON_WIDTH = 8;
const MINIMAP_GRASS_ICON_WIDTH = 6;
const MINIMAP_PIG_ICON_WIDTH = 8;
const MINIMAP_HOUSE_ICON_WIDTH = 18;

// AYOS (hiling ng user): "lagyan mo rin ng grass icons lahat ng nasa
// map" (at gamitin ang mismong img) - fallback na tuldok/dot na
// luntian kung hindi pa fully-loaded ang tunay na larawan ng damo.
function drawMinimapGrassIcon(ctx2, x, y) {
  ctx2.fillStyle = "#79c88f";
  ctx2.strokeStyle = "rgba(20, 45, 28, 0.7)";
  ctx2.lineWidth = 0.5;

  ctx2.beginPath();
  ctx2.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
}

// Buhay pa ba (may collision/nakikita sa mundo) ang isang resource node
// (puno/bato) na ito - hindi pa "fully harvested"? Kaparehong-pareho ng
// batayan ng ensureResourceNodes (resources.js) para tumugma ang icon
// sa minimap sa TALAGANG nakikita sa mundo - kapag na-ani na (wala nang
// puno/bato doon), wala na ring icon dapat lumabas sa minimap.
function isMinimapResourceNodeAlive(node, itemId, harvested) {
  if (typeof isNodeFullyHarvested !== "function") return true;

  const key = node.col + "," + node.row;

  return !isNodeFullyHarvested(harvested, key, itemId);
}

// Kinukuha ang AKTWAL na Image object (RESOURCE_IMAGES, resources.js)
// ng isang partikular na puno/bato node, base sa "variant" index nito
// at sa kasalukuyang aktibong variant-path list ng mundo
// (getActiveTreeVariantPaths/getActiveStoneVariantPaths) - null kung
// hindi pa available (hal. resources.js hindi pa fully loaded/na-parse).
function getMinimapTreeImage(node) {
  if (typeof getActiveTreeVariantPaths !== "function") return null;
  if (typeof RESOURCE_IMAGES === "undefined") return null;

  const variant = getActiveTreeVariantPaths()[node.variant];

  return variant ? RESOURCE_IMAGES[variant.normal] || null : null;
}

function getMinimapStoneImage(node) {
  if (typeof getActiveStoneVariantPaths !== "function") return null;
  if (typeof RESOURCE_IMAGES === "undefined") return null;

  const variant = getActiveStoneVariantPaths()[node.variant];

  return variant ? RESOURCE_IMAGES[variant.normal] || null : null;
}

// Iginuguhit ang mga BUHAY na puno/bato (resourceNodesCache, resources.js)
// gamit ang AKTWAL nilang sprite (may vector fallback - tingnan ang
// paliwanag sa itaas).
function drawMinimapResourceIcons(ctx2, toMinimapX, toMinimapY) {
  if (typeof resourceNodesCache === "undefined" || !resourceNodesCache) return;

  const harvested =
    typeof getHarvestedForCurrentWorld === "function"
      ? getHarvestedForCurrentWorld()
      : {};

  for (const tree of resourceNodesCache.trees || []) {
    if (!isMinimapResourceNodeAlive(tree, "wood", harvested)) continue;

    const x = toMinimapX(tree.col * TILE_SIZE + TILE_SIZE / 2);
    const y = toMinimapY(tree.row * TILE_SIZE + TILE_SIZE / 2);

    const drew = drawMinimapSpriteIcon(
      ctx2,
      getMinimapTreeImage(tree),
      x,
      y,
      MINIMAP_TREE_ICON_WIDTH,
    );

    if (!drew) drawMinimapTreeIcon(ctx2, x, y);
  }

  for (const stone of resourceNodesCache.stones || []) {
    if (!isMinimapResourceNodeAlive(stone, "stone", harvested)) continue;

    const x = toMinimapX(stone.col * TILE_SIZE + TILE_SIZE / 2);
    const y = toMinimapY(stone.row * TILE_SIZE + TILE_SIZE / 2);

    const drew = drawMinimapSpriteIcon(
      ctx2,
      getMinimapStoneImage(stone),
      x,
      y,
      MINIMAP_STONE_ICON_WIDTH,
    );

    if (!drew) drawMinimapStoneIcon(ctx2, x, y);
  }
}

// AYOS (hiling ng user): "lagyan mo rin ng grass icons lahat ng nasa
// map" - lahat ng damo (grassTuftsCache, grass.js) ng KASALUKUYANG
// mundo, gamit ang AKTWAL na larawan nito (GRASS_TUFT_IMAGES, grass.js),
// walang exception/filtering (walang "harvested" na konsepto ang damo).
function drawMinimapGrassIcons(ctx2, toMinimapX, toMinimapY) {
  if (typeof grassTuftsCache === "undefined" || !grassTuftsCache) return;

  const hasImages =
    typeof GRASS_TUFT_IMAGES !== "undefined" &&
    typeof GRASS_TUFT_IDLE_VARIANT_PATHS !== "undefined";

  for (const tuft of grassTuftsCache) {
    const x = toMinimapX(tuft.col * TILE_SIZE + TILE_SIZE / 2);
    const y = toMinimapY(tuft.row * TILE_SIZE + TILE_SIZE / 2);

    const image = hasImages
      ? GRASS_TUFT_IMAGES[GRASS_TUFT_IDLE_VARIANT_PATHS[tuft.variant]]
      : null;

    const drew = drawMinimapSpriteIcon(ctx2, image, x, y, MINIMAP_GRASS_ICON_WIDTH);

    if (!drew) drawMinimapGrassIcon(ctx2, x, y);
  }
}

// =========================
// PIG (pig.js) - AKTWAL na sprite, gumagalaw kasabay ng TALAGANG
// paglalakad nila sa mundo
// =========================
//
// AYOS (hiling ng user): "...at pig, etc" - kaparehong-pareho ng
// paraan ng OLDMAN sa ibaba, PERO MARAMI (hindi iisa lang) - kaya
// dumadaan sa BUONG pigsCache (pig.js), nilalaktawan ang mga "dead".
function drawMinimapPigs(ctx2, toMinimapX, toMinimapY) {
  if (typeof pigsCache === "undefined" || !pigsCache) return;
  if (typeof PIG_IDLE_IMAGES === "undefined") return;

  for (const pig of pigsCache) {
    if (pig.state === "dead") continue;

    const image =
      PIG_IDLE_IMAGES[pig.idleFacing8] || PIG_IDLE_IMAGES.south || null;

    drawMinimapSpriteIcon(
      ctx2,
      image,
      toMinimapX(pig.x),
      toMinimapY(pig.y - TILE_SIZE / 3),
      MINIMAP_PIG_ICON_WIDTH,
    );
  }
}

// =========================
// BAHAY (map.js) - AKTWAL na sprite (house.png/snowhouse.png)
// =========================
//
// AYOS (hiling ng user): "...like bahay..." - gamit ang parehong
// currentWorldHouseBBoxes (map.js, cache per-world) at houseImage/
// snowhouseImage (parehong Image object na ginagamit din ng
// pangunahing pagguhit ng mundo, drawHouseImageAt) - walang bahay dito
// ang mga mundong walang "House" tile layer (grassmap, interiors) -
// blangkong array na lang ang currentWorldHouseBBoxes doon.
function drawMinimapHouses(ctx2, toMinimapX, toMinimapY) {
  if (typeof currentWorldHouseBBoxes === "undefined") return;
  if (!currentWorldHouseBBoxes || currentWorldHouseBBoxes.length === 0) return;
  if (typeof houseImage === "undefined") return;

  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const image = snowing ? snowhouseImage : houseImage;

  for (const house of currentWorldHouseBBoxes) {
    const bbox = house.bbox;

    if (!bbox) continue;

    drawMinimapSpriteIcon(
      ctx2,
      image,
      toMinimapX(bbox.x + bbox.width / 2),
      toMinimapY(bbox.y + bbox.height / 2),
      MINIMAP_HOUSE_ICON_WIDTH,
    );
  }
}

// =========================
// OLDMAN NPC (decor.js) - "navigation" na icon na GUMAGALAW kasabay
// niya sa mundo
// =========================
//
// AYOS (hiling ng user): "meron din siyang navigation dun sa map na
// gumagalaw kapag gumalaw siya at lagay mo yung mismong siya na kahit
// ulo lang niya" - dating WALANG anumang marker ang OLDMAN sa minimap
// (hindi bahagi ng `collisions`, ni ng generic na structure markers) -
// ngayon, may sariling bilog na icon na gumagamit ng AKTWAL na sprite
// niya (OLDMAN_IMAGES.front, decor.js) - naka-CROP lang sa ULO (hindi
// buong katawan, tingnan ang OLDMAN_HEAD_CROP sa ibaba) at naka-CLIP sa
// isang bilog para maganda ang itsura kahit sa ganito kaliit na sukat.
// Ang posisyon (oldManWander.x/y) ay LIVE - kada frame kinukuha, kaya
// TUMUTUGMA ito sa TALAGANG gumagalang paglalakad niya sa mundo, hindi
// static/fixed na tuldok lang.

// Source-crop rectangle (sx, sy, sw, sh) sa loob ng 64x64 na
// oldmanIdleFront.gif - ang ULO/MUKHA lang (kasama ang hood/hat niya),
// hindi ang buong katawan.
const OLDMAN_HEAD_CROP = { sx: 10, sy: 0, sw: 44, sh: 26 };

// Radius (minimap pixels) ng bilog na icon.
const OLDMAN_MINIMAP_ICON_RADIUS = 5.5;

function drawMinimapOldMan(ctx2, toMinimapX, toMinimapY) {
  if (typeof oldManWander === "undefined" || !oldManWander) return;
  if (oldManWander.state === "gone") return;
  if (typeof OLDMAN_IMAGES === "undefined") return;

  const image = OLDMAN_IMAGES.front;

  if (!image || !image.complete || image.naturalWidth === 0) return;

  const x = toMinimapX(oldManWander.x);
  const y = toMinimapY(oldManWander.y - TILE_SIZE / 2);

  ctx2.save();

  // Bilog na background/border muna (para may "badge" na itsura ang
  // icon, at may kulay pa ring makikita kahit hindi pa fully-loaded o
  // habang naglo-load pa ang crop sa sulok).
  ctx2.fillStyle = "rgba(40, 30, 20, 0.85)";
  ctx2.strokeStyle = "rgba(255, 210, 90, 0.9)";
  ctx2.lineWidth = 0.8;
  ctx2.beginPath();
  ctx2.arc(x, y, OLDMAN_MINIMAP_ICON_RADIUS, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();

  // I-CLIP sa parehong bilog bago i-drawImage ang ulo niya - kaya
  // "bilugan"/"badge" ang itsura ng resultang icon, hindi basta
  // parisukat na sprite.
  ctx2.beginPath();
  ctx2.arc(x, y, OLDMAN_MINIMAP_ICON_RADIUS - 0.6, 0, Math.PI * 2);
  ctx2.clip();

  const size = OLDMAN_MINIMAP_ICON_RADIUS * 2;

  ctx2.drawImage(
    image,
    OLDMAN_HEAD_CROP.sx,
    OLDMAN_HEAD_CROP.sy,
    OLDMAN_HEAD_CROP.sw,
    OLDMAN_HEAD_CROP.sh,
    x - size / 2,
    y - size / 2,
    size,
    size,
  );

  ctx2.restore();
}

// Naka-lagay na Crafter/Stove/Light/Bed (craft.js/stove.js/light.js/
// bed.js) - dating WALANG lumalabas sa minimap ANG MGA ITO (hindi
// bahagi ng generic na `collisions` array - hiwalay na "live" collision
// getters, tingnan ang collisions.js) - ngayon, kulay na parisukat ayon
// sa uri (naka-eksaktong laki/pwesto base sa TALAGANG footprint nito,
// PLACEMENT_FOOTPRINTS - placement.js), para "accurate" talaga ang
// minimap sa lahat ng permanenteng bagay sa mundo, hindi lang sa
// pader/bundok/puno/bato.
const MINIMAP_STRUCTURE_COLORS = {
  crafter: "rgba(210, 150, 80, 0.95)",
  stove: "rgba(230, 90, 70, 0.95)",
  light: "rgba(255, 220, 120, 0.95)",
  bed: "rgba(150, 120, 220, 0.95)",
};

function drawMinimapStructureList(ctx2, toMinimapX, toMinimapY, list, itemId) {
  if (!list || list.length === 0) return;

  const color = MINIMAP_STRUCTURE_COLORS[itemId] || "rgba(255, 255, 255, 0.9)";

  ctx2.fillStyle = color;

  for (const entry of list) {
    if (entry.world !== currentWorld) continue;

    const cells =
      typeof getPlacementFootprintCells === "function"
        ? getPlacementFootprintCells(itemId, entry.col, entry.row)
        : [{ col: entry.col, row: entry.row }];

    const minCol = Math.min(...cells.map((cell) => cell.col));
    const minRow = Math.min(...cells.map((cell) => cell.row));
    const maxCol = Math.max(...cells.map((cell) => cell.col));
    const maxRow = Math.max(...cells.map((cell) => cell.row));

    const x = toMinimapX(minCol * TILE_SIZE);
    const y = toMinimapY(minRow * TILE_SIZE);
    const w = (maxCol - minCol + 1) * TILE_SIZE;
    const h = (maxRow - minRow + 1) * TILE_SIZE;

    ctx2.fillRect(x, y, Math.max(1.5, w * minimapCurrentScale), Math.max(1.5, h * minimapCurrentScale));
  }
}

function drawMinimapStructures(ctx2, toMinimapX, toMinimapY) {
  if (typeof currentWorld === "undefined") return;

  if (typeof placedCrafters !== "undefined") {
    drawMinimapStructureList(ctx2, toMinimapX, toMinimapY, placedCrafters, "crafter");
  }

  if (typeof placedStoves !== "undefined") {
    drawMinimapStructureList(ctx2, toMinimapX, toMinimapY, placedStoves, "stove");
  }

  if (typeof placedLights !== "undefined") {
    drawMinimapStructureList(ctx2, toMinimapX, toMinimapY, placedLights, "light");
  }

  if (typeof placedBeds !== "undefined") {
    drawMinimapStructureList(ctx2, toMinimapX, toMinimapY, placedBeds, "bed");
  }
}

// Kasalukuyang "scale" (world-to-minimap-pixel ratio) ng huling
// pagkakaguhit - kailangan ito ng drawMinimapStructureList (itaas) para
// makapag-compute ng TUNAY na laki (width/height) ng bawat structure sa
// minimap, hindi lang ng posisyon nito.
let minimapCurrentScale = 1;

// Tinatawag KADA FRAME (draw.js, dulo ng draw()) - iginuguhit ang
// KAPALIGIRAN ng player (naka-ZOOM at naka-CENTER sa kanya, tingnan ang
// MINIMAP_ZOOM sa itaas), hindi na buong mundo/mapa nang paliit lang.
//
// AYOS (hiling ng user): "yung sa minimap din ng room kapag nasa inside
// house is alisin na lang yung minimap, hide mo na lang - gagana lang
// kapag nasa labas ng bahay" - dating laging ipinapakita ang #minimap
// (kahit sa loob ng bahay/interior world) - ngayon, ITINATAGO na (buong
// bilog, hindi lang ang laman) sa SANDALING nasa loob (isIndoors(),
// worlds.js - PAREHONG batayan ng ibang "outdoor-only" na feature, hal.
// snow/rain/fireflies) - lumalabas/gumagana lang ulit ito pagbalik sa
// LABAS.
function drawMinimap() {
  const ctx2 = getMinimapContext();

  if (!ctx2) return;

  const minimapEl = document.getElementById("minimap");
  const indoors = typeof isIndoors === "function" && isIndoors();

  if (minimapEl) minimapEl.classList.toggle("hidden", indoors);

  ctx2.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  if (indoors) return; // nasa loob ng bahay - nakatago na ang buong #minimap sa itaas

  // Walang ipakita habang wala pang naka-load na mundo (hal. bago pa
  // man matapos ang unang loadWorld()).
  if (!mapReady || !mapData || !mapData.width || !mapData.height) return;
  if (typeof player === "undefined") return;

  const mapWidthPx = mapData.width * mapData.tilewidth;
  const mapHeightPx = mapData.height * mapData.tileheight;

  if (!mapWidthPx || !mapHeightPx) return;

  const usable = MINIMAP_SIZE - MINIMAP_PADDING * 2;
  const baseScale = Math.min(usable / mapWidthPx, usable / mapHeightPx);
  const scale = baseScale * MINIMAP_ZOOM;

  minimapCurrentScale = scale;

  // Sentro ng "view" - malapit sa PLAYER (world space), PERO CLINAMP
  // (kaparehong-pareho ng gawi ng camera.follow(), camera.js) para
  // hindi ito lumampas sa gilid ng TALAGANG mapa - kaya laging puno ng
  // lupa ang BUONG bilog (walang "black corner" na makikita kahit nasa
  // mismong dulo na ng mapa ang player, tingnan ang paliwanag sa itaas).
  const viewSize = MINIMAP_SIZE / scale;

  let centerX = player.x + player.width / 2;
  let centerY = player.y + player.height / 2;

  if (mapWidthPx <= viewSize) {
    centerX = mapWidthPx / 2;
  } else {
    centerX = Math.max(viewSize / 2, Math.min(centerX, mapWidthPx - viewSize / 2));
  }

  if (mapHeightPx <= viewSize) {
    centerY = mapHeightPx / 2;
  } else {
    centerY = Math.max(viewSize / 2, Math.min(centerY, mapHeightPx - viewSize / 2));
  }

  const toMinimapX = (worldX) => MINIMAP_SIZE / 2 + (worldX - centerX) * scale;
  const toMinimapY = (worldY) => MINIMAP_SIZE / 2 + (worldY - centerY) * scale;

  // "Lupa" - buong sukat ng kasalukuyang mundo (kahit malayo/naka-clip
  // na ito ngayon lampas sa nakikitang bilog, dahil zoomed-in na).
  //
  // BAGO (hiling ng user): "kaya mo bang gawin na yung kahit mismong
  // buong map na lang ilagay di na plain color" - iguguhit na ang
  // TALAGANG larawan ng mapa (getMinimapWorldBackgroundImage, itaas)
  // sa halip na basta payak na kulay - FALLBACK pa rin sa payak na
  // kulay (dating gawi) kung wala pang katumbas na larawan ang
  // kasalukuyang mundo, o hindi pa ito fully loaded.
  const minimapBackgroundImage = getMinimapWorldBackgroundImage();

  if (
    minimapBackgroundImage &&
    minimapBackgroundImage.complete &&
    minimapBackgroundImage.naturalWidth
  ) {
    ctx2.drawImage(
      minimapBackgroundImage,
      toMinimapX(0),
      toMinimapY(0),
      mapWidthPx * scale,
      mapHeightPx * scale,
    );
  } else {
    // BAGO (hiling ng user): "kapag nag snow is dapat snow din yung tile
    // or ground niya [sa minimap]" - PAREHONG batayan ng ibang
    // outdoor/snow-dependent na feature dito (isSnowWeather(), dig.js) -
    // pinapalitan ang kulay ng "lupa" papuntang maputing-yelo (sinukat
    // mismo mula sa TALAGANG background/snow-ground na kulay ng laro sa
    // panahon ng snow weather) sa halip na ang palaging luntian, para
    // tumugma ang minimap sa TALAGANG itsura ng mundo ngayon.
    const minimapSnowing =
      typeof isSnowWeather === "function" && isSnowWeather();

    ctx2.fillStyle = minimapSnowing
      ? "rgba(221, 247, 239, 0.95)"
      : "rgba(60, 110, 80, 0.9)";
    ctx2.fillRect(
      toMinimapX(0),
      toMinimapY(0),
      mapWidthPx * scale,
      mapHeightPx * scale,
    );
  }

  // Mga collision (pader, bundok) - kayumanggi/madilim. Ang mga
  // puno/bato (may "resourceKey", tingnan ang resources.js) ay
  // LINALAKTAWAN na dito - may sarili na silang icon sa ibaba
  // (drawMinimapResourceIcons) sa halip na basta box. Ang mga BAHAY
  // (walang resourceKey, pero may sarili nang icon - drawMinimapHouses,
  // itinatawag PAGKATAPOS nito) ay natatakpan/naguguhitan pa rin dito
  // muna (parte ng generic box loop, mula sa House-wall collisions,
  // map.js), pero OK LANG - buong natatakpan naman ito ng mas malaking
  // icon ng bahay sa ibaba.
  if (typeof collisions !== "undefined" && Array.isArray(collisions)) {
    ctx2.fillStyle = "rgba(55, 42, 34, 0.9)";

    for (const box of collisions) {
      if (box.resourceKey) continue;

      ctx2.fillRect(
        toMinimapX(box.x),
        toMinimapY(box.y),
        Math.max(1, box.width * scale),
        Math.max(1, box.height * scale),
      );
    }
  }

  // Mga bahay - AKTWAL na sprite (house.png/snowhouse.png), naguguhit
  // sa IBABAW ng generic na collision box sa itaas (para matakpan ang
  // "sira-sira"/hiwa-hiwalay na wall-box na hugis nito).
  drawMinimapHouses(ctx2, toMinimapX, toMinimapY);

  // Mga pintuan/portal SA KASALUKUYANG mundo - gintong tuldok.
  if (typeof DOORS !== "undefined" && typeof currentWorld !== "undefined") {
    ctx2.fillStyle = "rgba(255, 215, 90, 0.95)";

    for (const door of DOORS) {
      if (door.world !== currentWorld || !door.area) continue;

      const cx = toMinimapX(door.area.x + door.area.width / 2);
      const cy = toMinimapY(door.area.y + door.area.height / 2);

      ctx2.beginPath();
      ctx2.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx2.fill();
    }
  }

  // Damo - maliliit na tuldok, lahat ng nasa kasalukuyang mundo.
  drawMinimapGrassIcons(ctx2, toMinimapX, toMinimapY);

  // Buhay na puno/bato - maliliit na icon (tatsulok/bilog).
  drawMinimapResourceIcons(ctx2, toMinimapX, toMinimapY);

  // Naka-lagay na Crafter/Stove/Light/Bed - kulay na parisukat ayon sa
  // uri, eksaktong laki/pwesto base sa footprint nito.
  drawMinimapStructures(ctx2, toMinimapX, toMinimapY);

  // Mga pig - AKTWAL na sprite, gumagalaw kasabay ng totoong paglalakad
  // nila sa mundo.
  drawMinimapPigs(ctx2, toMinimapX, toMinimapY);

  // OLDMAN NPC - bilog na icon (ulo niya), gumagalaw kasabay ng
  // TALAGANG paglalakad niya sa mundo.
  drawMinimapOldMan(ctx2, toMinimapX, toMinimapY);

  // Ang PLAYER - naka-turo sa DIREKSYON niya, PERO hindi na laging
  // eksaktong nasa MINIMAP_SIZE/2 (gitna) - tumutugma na sa TALAGANG
  // posisyon niya laban sa (posibleng naka-clamp na) view center, kaya
  // "lumalayo" ito papunta sa gilid ng bilog kapag nasa dulo na ng
  // mapa (tingnan ang paliwanag sa itaas).
  drawMinimapPlayerMarker(
    ctx2,
    toMinimapX(player.x + player.width / 2),
    toMinimapY(player.y + player.height / 2),
    player.direction,
  );
}
