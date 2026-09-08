// =========================
// SI JOSEPH ("Builder") - CUSTOM NA BAHAY (hiling ng user)
// =========================
//
// "kaya ba na requirements na tiles para sa horizontal at vertical na
// bahay... may kakausapin yung character na gusto niya magtayo ng
// bahay... kahit saan pwede basta walang collisions na matamaan tapos
// pwedeng gibain at ibenta kapag gustong baguhin yung bahay ibebenta
// ulit sa kausap na npc tapos yung bahay na yon pwedeng pasukin tyaka
// same parin sa labas kung merong import sa bahay dapat ganun din sa
// loob pwedeng gumawa ng sarili mong interior house design"
//
// BUOD NG SISTEMA:
//   1. Si JOSEPH - static na NPC (hindi gumagala, kaiba sa Oldman) sa
//      LOOB ng sarili niyang silid ("josephHouse", isa sa 6 bahay sa
//      town, tingnan ang worlds.js) - "E" (kaparehong-pareho ng
//      Crafter/Stove/Bed/Oldman) para makausap, bubukas ang Builder
//      panel (3 tab: Lots/Exterior/Interior, tingnan sa ibaba).
//   2. LOTS - bibili ng isang LAKI (tiles wide x tall) - pagkatapos,
//      "armed" na ang placement - susunod na i-CLICK ng manlalaro sa
//      GRASSMAP o GRASSMAP2 (KAHIT SAAN, basta walang collision doon)
//      ang magtatayo ng bakanteng Lot doon (walang laman pang larawan).
//   3. EXTERIOR - i-a-upload ang PNG (dapat EKSAKTONG tumutugma ang
//      pixel size nito sa laki ng Lot, tilesWide*16 x tilesTall*16) -
//      may "Download Template" na buton (blangko/transparent na PNG,
//      eksaktong sukat) - buksan ito sa Aseprite/LibreSprite/Photoshop/
//      kahit anong pixel editor, iguhit ang bahay, i-export/i-save
//      bilang PNG (parehong sukat), tapos i-upload dito.
//   4. INTERIOR - kaparehong-pareho ng Exterior, PERO malaya ang laki
//      (hindi kailangang tumugma sa Lot) - pipili muna ng sariling
//      tiles wide/tall ang manlalaro, saka lalabas ang template/upload.
//      Ito ang magiging BUONG larawan ng SILID sa loob ng bahay.
//   5. Pagkatapos MAY exterior AT interior - PWEDE NA itong PASUKIN
//      (auto-door, JALAN LANG sa may pintuan sa ibaba ng bahay -
//      kaparehong-pareho ng gawi ng LAHAT ng ibang bahay sa laro).
//   6. GIBAIN/IBENTA - right-click sa bahay -> "Sell" -> 80% ng presyo
//      ng Lot ang ibabalik na gold (20% na "fee"), tinatanggal ang
//      bahay (kasama ang exterior/interior nito).

// =========================
// LOT SIZES (presyo, sukat)
// =========================
const BUILDER_LOT_SIZES = [
  { id: "small", label: "Maliit", tilesWide: 4, tilesTall: 4, price: 300 },
  { id: "medium", label: "Katamtaman", tilesWide: 6, tilesTall: 6, price: 600 },
  { id: "large", label: "Malaki", tilesWide: 8, tilesTall: 6, price: 900 },
  { id: "xlarge", label: "Napakalaki", tilesWide: 10, tilesTall: 8, price: 1400 },
];

// Ibabalik na gold kapag "Sell"/gibain ang isang bahay (80% ng
// TALAGANG binayaran para sa Lot nito - hiling ng user: "- 20%").
const BUILDER_SELL_REFUND_RATIO = 0.8;

// Mga mundo kung saan puwedeng ilagay ang isang Lot - hiling ng user.
const BUILDER_PLACEABLE_WORLDS = new Set(["grassmap", "grassmap2"]);

// =========================
// SI JOSEPH - static na NPC sa loob ng "josephHouse"
// =========================
const JOSEPH_WORLD = "josephHouse";
// Malayo sa "Exit" na pintuan (bandang ~x:63-102,y:193-224 - tingnan
// ang worlds.js) - itinayo malapit sa itaas-gitna ng silid.
const JOSEPH_COL = 8;
const JOSEPH_ROW = 4;
const JOSEPH_X = JOSEPH_COL * TILE_SIZE + TILE_SIZE / 2;
const JOSEPH_Y = JOSEPH_ROW * TILE_SIZE + TILE_SIZE;

// AYOS: walang sariling sprite/art pa si Joseph (walang in-upload na
// asset) - placeholder muna ito (bilog + emoji, parehong konsepto ng
// mga fallback emoji icon sa BAG_ITEMS) hanggang may idagdag pang
// tunay na larawan balang araw - hindi ito nakakaapekto sa gameplay,
// pero puwedeng palitan/i-swap balang araw (tingnan ang drawJoseph).
function drawJoseph() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return;

  ctx.save();

  ctx.beginPath();
  ctx.arc(JOSEPH_X, JOSEPH_Y - 10, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#8a5a34";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔨", JOSEPH_X, JOSEPH_Y - 10);

  ctx.font = "8px sans-serif";
  ctx.fillStyle = "white";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Joseph", JOSEPH_X, JOSEPH_Y + 6);

  ctx.restore();
}

// Kasama sa Y-sort (map.js, fallbackDrawables - PAREHONG "walang
// overlap layer" na landas ginagamit ng getPigDrawables/getOldManDrawables,
// dahil PAREHONG walang "trees/house" overlap layers ang room_grassmap.tmj
// na ginagamit ng josephHouse).
function getJosephDrawables() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return [];

  return [
    {
      sortY: JOSEPH_ROW * TILE_SIZE + TILE_SIZE,
      order: -1,
      draw: drawJoseph,
      type: "joseph",
      bbox: {
        x: JOSEPH_X - TILE_SIZE * 0.3,
        y: JOSEPH_Y - TILE_SIZE * 1.2,
        width: TILE_SIZE * 0.6,
        height: TILE_SIZE * 1.2,
      },
    },
  ];
}

function isPlayerNearJoseph() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return false;
  if (typeof isPlayerAdjacentToTile !== "function") return false;
  if (typeof isPlayerFacingTile !== "function") return false;

  return (
    isPlayerAdjacentToTile(JOSEPH_COL, JOSEPH_ROW) &&
    isPlayerFacingTile(JOSEPH_COL, JOSEPH_ROW)
  );
}

// =========================
// DATA NG MGA NAITAYONG BAHAY (persistent, localStorage)
// =========================
//
// { id, world, col, row, tilesWide, tilesTall, price,
//   exteriorImageDataURL, interiorImageDataURL,
//   interiorTilesWide, interiorTilesTall }
let customHouses = [];
let customHouseIdCounter = 0;

const BUILDER_SAVE_KEY = "tralala.customHouses.v1";

function saveCustomHouses() {
  try {
    localStorage.setItem(
      BUILDER_SAVE_KEY,
      JSON.stringify({ idCounter: customHouseIdCounter, houses: customHouses }),
    );
  } catch (err) {
    console.error("Hindi na-save ang mga custom house (baka puno na ang storage):", err);
  }
}

// In-memory na Image() cache - hiwalay sa customHouses (walang laman
// ang mismong dataURL string na TALAGANG "loaded" na larawan, kailangan
// pa munang gawan ng Image()).
const customHouseExteriorImages = {}; // id -> Image
const customHouseInteriorImages = {}; // id -> Image

function ensureCustomHouseImagesLoaded(house) {
  if (house.exteriorImageDataURL && !customHouseExteriorImages[house.id]) {
    const img = new Image();
    img.src = house.exteriorImageDataURL;
    customHouseExteriorImages[house.id] = img;
  }

  if (house.interiorImageDataURL && !customHouseInteriorImages[house.id]) {
    const img = new Image();
    img.src = house.interiorImageDataURL;
    customHouseInteriorImages[house.id] = img;
    registerCustomHouseInteriorWorld(house);
  }
}

function loadCustomHouses() {
  try {
    const raw = localStorage.getItem(BUILDER_SAVE_KEY);

    if (!raw) return;

    const parsed = JSON.parse(raw);

    customHouseIdCounter = parsed.idCounter || 0;
    customHouses = Array.isArray(parsed.houses) ? parsed.houses : [];

    for (const house of customHouses) {
      ensureCustomHouseImagesLoaded(house);
    }
  } catch (err) {
    console.error("Hindi na-load ang mga custom house:", err);
    customHouses = [];
  }
}

loadCustomHouses();

// AYOS (hiling ng user): "sample muna lagyan mo ako ng gold na
// 100,000" - para MADALING masubukan/ma-test ang buong Lot/Exterior/
// Interior na sistema (mahal ang mga Lot). Ito ang script tag na
// SUMUSUNOD sa inventory-save.js (tingnan ang index.html) - kaya
// TALAGANG ito na ang HULING nagbabago sa goldCollected sa unang
// pag-load, hindi na ito babalikan/mababawi ng loadInventoryState().
// TANGGALIN na lang ito (o palitan ng normal na simula) kapag hindi
// na kailangan ang testing/sample na gold na ito.
if (typeof goldCollected !== "undefined") {
  goldCollected = 100000;
}

// =========================
// PAGGUHIT NG EXTERIOR (world space, Y-sort - PAREHONG landas ng
// getPigDrawables/getJosephDrawables - grassmap/grassmap2 ay walang
// overlap layers)
// =========================
function getCustomHouseDrawables() {
  if (typeof currentWorld === "undefined") return [];

  return customHouses
    .filter((house) => house.world === currentWorld)
    .map((house) => {
      const image = customHouseExteriorImages[house.id];

      return {
        sortY: (house.row + house.tilesTall) * TILE_SIZE,
        order: -1,
        type: "customHouse",
        bbox: {
          x: house.col * TILE_SIZE,
          y: house.row * TILE_SIZE,
          width: house.tilesWide * TILE_SIZE,
          height: house.tilesTall * TILE_SIZE,
        },
        draw: () => {
          const boxX = house.col * TILE_SIZE;
          const boxY = house.row * TILE_SIZE;
          const boxWidth = house.tilesWide * TILE_SIZE;
          const boxHeight = house.tilesTall * TILE_SIZE;

          if (image && image.complete && image.naturalWidth) {
            ctx.drawImage(image, boxX, boxY, boxWidth, boxHeight);
          } else {
            // Wala pang na-upload na Exterior - bakanteng Lot lang
            // (dashed outline + label), makikita pa rin kung nasaan.
            ctx.save();
            ctx.strokeStyle = "rgba(255, 210, 90, 0.85)";
            ctx.fillStyle = "rgba(255, 210, 90, 0.12)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            ctx.setLineDash([]);
            ctx.font = "9px sans-serif";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Lot (walang Exterior)", boxX + boxWidth / 2, boxY + boxHeight / 2);
            ctx.restore();
          }
        },
      };
    });
}

// =========================
// COLLISION (buong footprint MINUS isang notch/butas sa gitna-ibaba,
// para sa pintuan) - tingnan ang getCustomHouseCollisionBoxes (checked
// ng collisions.js, canMoveTo) at ang DOORS entry (registerCustomHouseDoors).
// =========================
function getBuilderDoorwayTileRange(tilesWide) {
  const doorWidth = Math.min(2, tilesWide);
  const startOffset = Math.floor((tilesWide - doorWidth) / 2);

  return { doorWidth, startOffset };
}

// AYOS (hiling ng user): "wag mo na ipunta sa mismong map yung
// character dapat dun parin sa place ni joseph" - tumatanggap na ito
// ng EXPLICIT na worldName (dating basta currentWorld lang, na
// nangangailangang TALAGANG naroon ang player) - kaya default na lang
// sa currentWorld kung walang ibinigay (ginagamit pa rin ito ng
// collisions.js/canMoveTo, TALAGANG mundo ng player doon), pero
// puwede na ring ibang mundo ang tanungin nang REMOTE (Map Picker
// sa ibaba, habang naka-tayo pa rin ang player kay Joseph).
function getCustomHouseCollisionBoxes(worldName) {
  const targetWorld = worldName || (typeof currentWorld !== "undefined" ? currentWorld : null);

  if (!targetWorld) return [];

  const boxes = [];

  for (const house of customHouses) {
    if (house.world !== targetWorld) continue;

    const { doorWidth, startOffset } = getBuilderDoorwayTileRange(house.tilesWide);
    const doorStartCol = house.col + startOffset;
    const doorEndCol = doorStartCol + doorWidth - 1;

    // Kaliwa ng pintuan (buong taas).
    if (doorStartCol > house.col) {
      boxes.push({
        x: house.col * TILE_SIZE,
        y: house.row * TILE_SIZE,
        width: (doorStartCol - house.col) * TILE_SIZE,
        height: house.tilesTall * TILE_SIZE,
      });
    }

    // Kanan ng pintuan (buong taas).
    const rightStartCol = doorEndCol + 1;
    const lastCol = house.col + house.tilesWide - 1;

    if (rightStartCol <= lastCol) {
      boxes.push({
        x: rightStartCol * TILE_SIZE,
        y: house.row * TILE_SIZE,
        width: (lastCol - rightStartCol + 1) * TILE_SIZE,
        height: house.tilesTall * TILE_SIZE,
      });
    }

    // Ibabaw ng pintuan (lahat ng hanay MALIBAN sa pinakahuli - iyon
    // ang bukas/pintuan mismo).
    if (house.tilesTall > 1) {
      boxes.push({
        x: doorStartCol * TILE_SIZE,
        y: house.row * TILE_SIZE,
        width: doorWidth * TILE_SIZE,
        height: (house.tilesTall - 1) * TILE_SIZE,
      });
    }
  }

  return boxes;
}

// Sukat (sa TILES) ng isang OUTDOOR na mundo (grassmap/grassmap2) -
// KINUKUHA DIREKTA mula sa mismong laki ng background Image nito
// (MINIMAP_WORLD_BACKGROUND_IMAGES, minimap.js) - HINDI na umaasa sa
// `mapData` (na TALAGANG mundo lang ng player ang laman, kaya MALI
// kung "remote" na tinitignan - hal. si Joseph na nasa josephHouse
// habang grassmap ang tinatanong). VERIFIED na ito na rin (tingnan
// ang "GRASSMAP - DIRECT POSITION CROP" sa map.js) - EKSAKTONG-
// EKSAKTONG magkatugma ang laki ng larawan sa TALAGANG laki ng mapa.
function getBuilderWorldTileSize(worldName) {
  const image = typeof getBuilderMapPickerImage === "function" ? getBuilderMapPickerImage(worldName) : null;

  if (!image) return null;

  return {
    tilesWide: Math.round(image.naturalWidth / TILE_SIZE),
    tilesTall: Math.round(image.naturalHeight / TILE_SIZE),
  };
}

// =========================
// PAG-CHECK NG PLACEMENT (kahit saan sa grassmap/grassmap2, basta
// walang collision - hiling ng user, HIWALAY sa isFootprintPlaceable
// ng placement.js na "loob ng bahay lang" ang gamit doon)
// =========================
//
// AYOS: "REMOTE" na ito ngayon - tumatanggap ng explicit na worldName,
// HINDI na kailangang TALAGANG naroon/na-loadWorld() ang player sa
// mundong iyon bago pa man ito tanungin (hiling ng user, tingnan ang
// paliwanag sa itaas ng getCustomHouseCollisionBoxes).
function isBuilderTileFree(worldName, col, row) {
  const size = getBuilderWorldTileSize(worldName);

  if (!size) return false;
  if (col < 0 || row < 0 || col >= size.tilesWide || row >= size.tilesTall) return false;

  const tileBox = { x: col * TILE_SIZE, y: row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };

  // AYOS (hiling ng user): "kahit sana meron automatic lang mawawala
  // yung nakaharang na trees or rocks or grass tyaka lang babalik
  // kapag binenta na yung bahay" - VERIFIED: ang buong "Collisions"
  // layer ng grassmap.tmj/grassmap2.tmj (23 na bagay, WALANG
  // pangalan/type) ay talagang mga hindi-nakikilalang collision box ng
  // mga puno/bato/palumpong na naka-guhit sa larawan mismo - walang
  // paraan para "hiwalayin" ang mga ito mula sa TALAGANG istruktura
  // (wala namang RAW na pader sa grassmap/grassmap2 - ang bahay dito,
  // grassmapHouse, ay HIWALAY na mundo). Kaya TINANGGAL na rin ang
  // dating pag-check dito laban sa `collisions` - kahit ano ang
  // naka-guhit (puno/bato/damo), pwede nang patungan/itayuan (ang
  // resources.js na ang bahalang "itago"/i-suppress ang mga ito habang
  // naka-tayo ang bahay - tingnan ang isTileCoveredByCustomHouse doon).
  // Ang DOORS (portal)/ibang custom house na lang ang TALAGANG
  // bumabawal - TINANGGAL na rin ang pag-check laban sa TALAGANG
  // posisyon ng player (dating "huwag i-overlap ang player") - dahil
  // "remote" na ito, hindi na TALAGANG naroon ang player para
  // ma-overlap.
  if (typeof DOORS !== "undefined") {
    for (const door of DOORS) {
      if (door.world === worldName && isColliding(tileBox, door.area)) return false;
    }
  }

  if (getCustomHouseCollisionBoxes(worldName).some((box) => isColliding(tileBox, box))) {
    return false;
  }

  return true;
}

function isBuilderFootprintFree(worldName, col, row, tilesWide, tilesTall) {
  if (!BUILDER_PLACEABLE_WORLDS.has(worldName)) return false;

  for (let dx = 0; dx < tilesWide; dx++) {
    for (let dy = 0; dy < tilesTall; dy++) {
      if (!isBuilderTileFree(worldName, col + dx, row + dy)) return false;
    }
  }

  return true;
}

// =========================
// "MAP PICKER" - PUMILI NG MUNDO (Grassmap/Grassmap2), TAPOS BUONG
// MAPA NA NAKA-ZOOM-OUT PARA MAKITA/MAPILI KUNG SAAN ILALAGAY (hiling
// ng user: "lilitaw yung na grassmap or grassmap2 tapos kapag pindot
// sa isa don lilitaw yung buong map... naka zoom out")
// =========================
//
// AYOS: dating "armed" na mode ito (i-close ang panel, i-click ang
// TALAGANG canvas ng laro sa KASALUKUYANG zoom/posisyon) - TINANGGAL
// na ito, PALIT sa isang HIWALAY na "picker" na canvas (hindi ang
// canvas ng laro): (1) piliin muna ang mundo, (2) i-LOAD (loadWorld)
// iyon kung hindi pa ito ang currentWorld (para TALAGANG TAMA ang
// collision data), (3) iguhit ang BUONG larawan ng mundong iyon
// (parehong Image na ginagamit na ng minimap.js - MINIMAP_WORLD_
// BACKGROUND_IMAGES) naka-SCALE/"contain"-fit sa loob ng modal (kaya
// "naka-zoom-out"/nakalatag ang buong mapa) - MOUSEMOVE/CLICK dito
// (hindi sa TALAGANG canvas ng laro) ang gagamitin para pumili ng
// eksaktong (col,row).
function openBuilderWorldPicker(lotSize) {
  closeBuilderPanel();

  const overlay = document.createElement("div");

  overlay.className = "builder-panel-overlay";

  const panel = document.createElement("div");

  panel.className = "builder-panel";

  const header = document.createElement("div");

  header.className = "builder-panel-header";
  header.innerHTML = "<span>Pumili ng Mundo</span>";

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.className = "builder-panel-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => overlay.remove());
  header.appendChild(closeBtn);

  const body = document.createElement("div");

  body.className = "builder-panel-body";

  const hint = document.createElement("p");

  hint.className = "builder-panel-hint";
  hint.textContent =
    "Saang mundo mo gustong itayo ang " +
    lotSize.tilesWide +
    "x" +
    lotSize.tilesTall +
    " na Lot?";
  body.appendChild(hint);

  const worldOptions = [
    { id: "grassmap", label: "Grassmap" },
    { id: "grassmap2", label: "Grassmap 2" },
  ];

  for (const option of worldOptions) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "builder-buy-btn builder-world-choice-btn";
    btn.textContent = option.label;
    btn.addEventListener("click", () => {
      overlay.remove();
      openBuilderMapPicker(option.id, lotSize);
    });

    body.appendChild(btn);
  }

  panel.appendChild(header);
  panel.appendChild(body);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

// Kinukuha ang PAREHONG buong-mapa na Image na ginagamit na ng
// minimap.js (MINIMAP_WORLD_BACKGROUND_IMAGES) - iisang eksaktong
// larawan lang (grassmap.png/grassmap2.png, o ang snow variant) ang
// TALAGANG background ng buong mundong ito.
function getBuilderMapPickerImage(worldName) {
  if (typeof MINIMAP_WORLD_BACKGROUND_IMAGES === "undefined") return null;

  const entry = MINIMAP_WORLD_BACKGROUND_IMAGES[worldName];

  if (!entry) return null;

  const snowing = typeof isSnowWeather === "function" && isSnowWeather();
  const image = snowing ? entry.snow : entry.normal;

  return image && image.complete && image.naturalWidth ? image : null;
}

// AYOS (hiling ng user): "wag mo na ipunta sa mismong map yung
// character dapat dun parin sa place ni joseph pabalik balik kasi ako
// kay joseph e" - dating tinatawag dito ang loadWorld() (TALAGANG
// nilipat ang player papunta sa grassmap/grassmap2) para lang malaman
// ang TAMANG laki/collision - TINANGGAL na ito, "remote" na lang ang
// buong Picker (tingnan ang getBuilderWorldTileSize/
// getCustomHouseCollisionBoxes(worldName) sa itaas) - hindi na
// kailangang kumilos ang player, manatili siyang kasama ni Joseph.
function openBuilderMapPicker(worldName, lotSize) {
  const bgImage = getBuilderMapPickerImage(worldName);
  const size = getBuilderWorldTileSize(worldName);

  if (!bgImage || !size) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Hindi pa handa ang larawan ng mapa - subukan ulit.");
    }
    return;
  }

  const mapWidthPx = size.tilesWide * TILE_SIZE;
  const mapHeightPx = size.tilesTall * TILE_SIZE;

  const overlay = document.createElement("div");

  overlay.className = "builder-panel-overlay";

  const panel = document.createElement("div");

  panel.className = "builder-map-picker-panel";

  const header = document.createElement("div");

  header.className = "builder-panel-header";
  header.innerHTML =
    "<span>I-click ang gustong lugar (" +
    lotSize.tilesWide +
    "x" +
    lotSize.tilesTall +
    ")</span>";

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.className = "builder-panel-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => overlay.remove());
  header.appendChild(closeBtn);

  const pickerCanvas = document.createElement("canvas");

  pickerCanvas.className = "builder-map-picker-canvas";

  panel.appendChild(header);
  panel.appendChild(pickerCanvas);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // "Contain" fit - buong mapa, walang naputol, naka-SCALE lang
  // pababa (kaya "naka-zoom-out"/nakalatag makikita ang lahat).
  const maxWidth = Math.min(window.innerWidth * 0.9, 1000);
  const maxHeight = Math.min(window.innerHeight * 0.72, 800);
  const scale = Math.min(maxWidth / mapWidthPx, maxHeight / mapHeightPx);

  pickerCanvas.width = Math.round(mapWidthPx * scale);
  pickerCanvas.height = Math.round(mapHeightPx * scale);
  pickerCanvas.style.width = pickerCanvas.width + "px";
  pickerCanvas.style.height = pickerCanvas.height + "px";

  const pickerCtx = pickerCanvas.getContext("2d");

  pickerCtx.imageSmoothingEnabled = false;

  let hoverTile = null;

  function eventToTile(event) {
    const rect = pickerCanvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const worldX = localX / scale;
    const worldY = localY / scale;
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);

    if (col < 0 || row < 0 || col >= size.tilesWide || row >= size.tilesTall) return null;

    return { col, row };
  }

  function redrawPicker() {
    pickerCtx.clearRect(0, 0, pickerCanvas.width, pickerCanvas.height);
    pickerCtx.drawImage(bgImage, 0, 0, pickerCanvas.width, pickerCanvas.height);

    // Ipinapakita rin ang mga naitayo NANG bahay (kung meron) - para
    // hindi na kailangang mag-hover doon para malaman na okupado na.
    for (const house of customHouses) {
      if (house.world !== worldName) continue;

      pickerCtx.fillStyle = "rgba(255, 210, 90, 0.55)";
      pickerCtx.fillRect(
        house.col * TILE_SIZE * scale,
        house.row * TILE_SIZE * scale,
        house.tilesWide * TILE_SIZE * scale,
        house.tilesTall * TILE_SIZE * scale,
      );
    }

    if (hoverTile) {
      const placeable = isBuilderFootprintFree(
        worldName,
        hoverTile.col,
        hoverTile.row,
        lotSize.tilesWide,
        lotSize.tilesTall,
      );

      pickerCtx.fillStyle = placeable ? "rgba(120, 230, 140, 0.5)" : "rgba(255, 80, 80, 0.5)";
      pickerCtx.strokeStyle = placeable ? "rgba(140, 255, 160, 0.95)" : "rgba(255, 100, 100, 0.95)";
      pickerCtx.lineWidth = 2;

      const boxX = hoverTile.col * TILE_SIZE * scale;
      const boxY = hoverTile.row * TILE_SIZE * scale;
      const boxW = lotSize.tilesWide * TILE_SIZE * scale;
      const boxH = lotSize.tilesTall * TILE_SIZE * scale;

      pickerCtx.fillRect(boxX, boxY, boxW, boxH);
      pickerCtx.strokeRect(boxX, boxY, boxW, boxH);
    }
  }

  pickerCanvas.addEventListener("mousemove", (event) => {
    hoverTile = eventToTile(event);
    redrawPicker();
  });

  pickerCanvas.addEventListener("click", (event) => {
    const tile = eventToTile(event);

    if (!tile) return;

    if (!isBuilderFootprintFree(worldName, tile.col, tile.row, lotSize.tilesWide, lotSize.tilesTall)) {
      if (typeof showFloatingMessage === "function") {
        showFloatingMessage("May bumabara dito - pumili ng ibang lugar.");
      }
      return;
    }

    if (typeof goldCollected !== "undefined" && goldCollected < lotSize.price) {
      if (typeof showFloatingMessage === "function") showFloatingMessage("Kulang ang gold mo.");
      overlay.remove();
      return;
    }

    if (typeof goldCollected !== "undefined") goldCollected -= lotSize.price;

    customHouseIdCounter++;

    const house = {
      id: customHouseIdCounter,
      world: worldName,
      col: tile.col,
      row: tile.row,
      tilesWide: lotSize.tilesWide,
      tilesTall: lotSize.tilesTall,
      price: lotSize.price,
      exteriorImageDataURL: null,
      interiorImageDataURL: null,
      interiorTilesWide: null,
      interiorTilesTall: null,
    };

    customHouses.push(house);
    saveCustomHouses();

    overlay.remove();

    if (typeof syncHotbarUI === "function") syncHotbarUI();

    // AYOS (hiling ng user): "wag mo na ipunta sa mismong map yung
    // character... puntahan ko na lang yung bahay after matapos yung
    // gusto ko kay Joseph, alisin mo na rin yung fade out and in" -
    // TINANGGAL na ang dating teleportPlayerToCustomHouse/fade - basta
    // manatili na lang ang player kung nasaan man siya (kasama ni
    // Joseph), lalapitan na lang niya mismo ang bahay balang araw.
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Naitayo ang Lot! I-upload na ang Exterior/Interior kay Joseph.");
    }
  });

  redrawPicker();
}



// =========================
// RIGHT-CLICK -> "Sell" (gibain, 80% refund)
// =========================
function getCustomHouseAt(col, row) {
  return customHouses.find(
    (house) =>
      house.world === currentWorld &&
      col >= house.col &&
      col < house.col + house.tilesWide &&
      row >= house.row &&
      row < house.row + house.tilesTall,
  );
}

// AYOS (hiling ng user): "kung may mga trees don at rocks mawawala na
// di na tutubo hanggat may bahay" - tinatawag ito ng resources.js
// (getResourceDrawables/handleAxeClickOnTree/handlePickaxeClickOnStone)
// para malaman kung dapat "itago"/hindi na puwedeng gamitin ang isang
// tile - kaiba sa getCustomHouseAt (currentWorld lang), tumatanggap
// ito ng EXPLICIT na worldName (parehong resulta naman kung
// currentWorld ang ipinasa).
function isTileCoveredByCustomHouse(worldName, col, row) {
  return customHouses.some(
    (house) =>
      house.world === worldName &&
      col >= house.col &&
      col < house.col + house.tilesWide &&
      row >= house.row &&
      row < house.row + house.tilesTall,
  );
}

function sellCustomHouse(house) {
  const refund = Math.round(house.price * BUILDER_SELL_REFUND_RATIO);

  if (typeof goldCollected !== "undefined") goldCollected += refund;

  customHouses = customHouses.filter((entry) => entry.id !== house.id);
  delete customHouseExteriorImages[house.id];
  delete customHouseInteriorImages[house.id];
  unregisterCustomHouseDoors(house);

  saveCustomHouses();

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  if (typeof showFloatingMessage === "function") {
    showFloatingMessage("Naibenta ang bahay - +" + refund + " gold.");
  }
}

canvas.addEventListener("contextmenu", (event) => {
  // (Ang placement ngayon ay dumadaan sa Map Picker modal, hindi na
  // sa live game canvas - walang "armed mode" na dapat pang tignan
  // dito bago mag-Sell.)

  const tile = typeof getMouseTile === "function" ? getMouseTile() : null;

  if (!tile) return;

  const house = getCustomHouseAt(tile.col, tile.row);

  if (!house) return;
  if (!isTileInReach(tile.col, tile.row)) return;

  event.preventDefault();

  if (typeof showBagActionMenu === "function") {
    showBagActionMenu(event.clientX, event.clientY, [
      {
        label: "Sell (+" + Math.round(house.price * BUILDER_SELL_REFUND_RATIO) + " gold)",
        onClick: () => sellCustomHouse(house),
      },
    ]);
  }
});

// =========================
// PANSAMANTALANG FLOATING MESSAGE (walang existing generic na toast sa
// laro - munting sariling bersyon lang dito, disappear pagkatapos ng
// ilang segundo)
// =========================
let builderMessageEl = null;
let builderMessageTimeout = null;

function showFloatingMessage(text) {
  if (builderMessageEl) builderMessageEl.remove();
  if (builderMessageTimeout) clearTimeout(builderMessageTimeout);

  builderMessageEl = document.createElement("div");
  builderMessageEl.className = "builder-floating-message";
  builderMessageEl.textContent = text;
  document.body.appendChild(builderMessageEl);

  builderMessageTimeout = setTimeout(() => {
    if (builderMessageEl) builderMessageEl.remove();
    builderMessageEl = null;
  }, 3200);
}

// =========================
// DYNAMIC NA INTERIOR WORLD (Blob URL na "tmj", tingnan ang paliwanag
// sa itaas ng file) - IISANG flat na larawan (ang uploaded interior
// PNG) ang buong background, may simpleng perimeter wall + notch/butas
// (Exit) sa gitna-ibaba, kaparehong-pareho ng doorway ng exterior.
// =========================
function buildSyntheticInteriorTmj(tilesWide, tilesTall) {
  const { doorWidth, startOffset } = getBuilderDoorwayTileRange(tilesWide);
  const doorStartCol = startOffset;
  const doorEndCol = doorStartCol + doorWidth - 1;

  const objects = [];
  let objectId = 1;

  // Itaas - buong lapad.
  objects.push({
    id: objectId++,
    x: 0,
    y: 0,
    width: tilesWide * TILE_SIZE,
    height: TILE_SIZE,
  });

  // Kaliwang pader (buong taas).
  objects.push({ id: objectId++, x: 0, y: 0, width: TILE_SIZE, height: tilesTall * TILE_SIZE });

  // Kanang pader (buong taas).
  objects.push({
    id: objectId++,
    x: (tilesWide - 1) * TILE_SIZE,
    y: 0,
    width: TILE_SIZE,
    height: tilesTall * TILE_SIZE,
  });

  // Ibabang pader - kaliwa ng pintuan.
  if (doorStartCol > 0) {
    objects.push({
      id: objectId++,
      x: 0,
      y: (tilesTall - 1) * TILE_SIZE,
      width: doorStartCol * TILE_SIZE,
      height: TILE_SIZE,
    });
  }

  // Ibabang pader - kanan ng pintuan.
  if (doorEndCol < tilesWide - 1) {
    objects.push({
      id: objectId++,
      x: (doorEndCol + 1) * TILE_SIZE,
      y: (tilesTall - 1) * TILE_SIZE,
      width: (tilesWide - 1 - doorEndCol) * TILE_SIZE,
      height: TILE_SIZE,
    });
  }

  return {
    width: tilesWide,
    height: tilesTall,
    tilewidth: TILE_SIZE,
    tileheight: TILE_SIZE,
    tilesets: [],
    layers: [
      {
        type: "tilelayer",
        name: "map",
        width: tilesWide,
        height: tilesTall,
        data: new Array(tilesWide * tilesTall).fill(0),
        visible: true,
      },
      {
        type: "objectgroup",
        name: "Collisions",
        visible: false,
        objects,
      },
    ],
  };
}

function getCustomHouseInteriorWorldName(house) {
  return "customHouse_" + house.id;
}

// I-tinatatabi ang mga "to"/"world" na pares na naidagdag na sa DOORS
// para hindi ito madoble kapag paulit-ulit tinawag (hal. sa bawat
// pag-import ng bagong interior).
function unregisterCustomHouseDoors(house) {
  const worldName = getCustomHouseInteriorWorldName(house);

  if (typeof DOORS === "undefined") return;

  for (let i = DOORS.length - 1; i >= 0; i--) {
    if (DOORS[i].world === worldName || DOORS[i].to === worldName) {
      DOORS.splice(i, 1);
    }
  }

  if (typeof WORLDS !== "undefined") delete WORLDS[worldName];
}

function registerCustomHouseDoors(house) {
  if (!house.interiorImageDataURL) return;

  const worldName = getCustomHouseInteriorWorldName(house);

  unregisterCustomHouseDoors(house);

  const { doorWidth, startOffset } = getBuilderDoorwayTileRange(house.tilesWide);
  const entranceCol = house.col + startOffset;
  const entranceRow = house.row + house.tilesTall - 1;

  // PAPASOK - jalan/tapak sa may pintuan sa ibaba ng exterior
  // (kaparehong-pareho ng gawi ng lahat ng ibang bahay sa laro).
  DOORS.push({
    world: house.world,
    area: {
      x: entranceCol * TILE_SIZE,
      y: entranceRow * TILE_SIZE,
      width: doorWidth * TILE_SIZE,
      height: TILE_SIZE,
    },
    to: worldName,
    spawn: {
      x: (house.interiorTilesWide * TILE_SIZE) / 2,
      y: (house.interiorTilesTall - 2) * TILE_SIZE,
    },
    label: "Bahay",
    auto: true,
  });

  // PALABAS - jalan sa may pintuan (notch) sa loob ng silid.
  const interiorDoorway = getBuilderDoorwayTileRange(house.interiorTilesWide);

  DOORS.push({
    world: worldName,
    area: {
      x: interiorDoorway.startOffset * TILE_SIZE,
      y: (house.interiorTilesTall - 1) * TILE_SIZE,
      width: interiorDoorway.doorWidth * TILE_SIZE,
      height: TILE_SIZE,
    },
    to: house.world,
    spawn: {
      x: entranceCol * TILE_SIZE + (doorWidth * TILE_SIZE) / 2,
      y: entranceRow * TILE_SIZE + TILE_SIZE * 1.5,
    },
    label: "Labas",
    auto: true,
  });
}

function registerCustomHouseInteriorWorld(house) {
  if (!house.interiorImageDataURL || !house.interiorTilesWide || !house.interiorTilesTall) return;
  if (typeof WORLDS === "undefined") return;

  const worldName = getCustomHouseInteriorWorldName(house);
  const tmj = buildSyntheticInteriorTmj(house.interiorTilesWide, house.interiorTilesTall);
  const blob = new Blob([JSON.stringify(tmj)], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);

  WORLDS[worldName] = {
    url: blobUrl,
    outdoor: false,
    spawn: {
      x: (house.interiorTilesWide * TILE_SIZE) / 2,
      y: (house.interiorTilesTall - 2) * TILE_SIZE,
    },
  };

  registerCustomHouseDoors(house);
}

// Ang GUHIT ng interior background (buong larawan, direct crop -
// PAREHONG "isang drawImage lang, walang seams" na trick ng
// grassmap/grassmap2/room_grassmap - tingnan ang map.js).
function getCustomHouseInteriorImage(worldName) {
  const house = customHouses.find(
    (entry) => getCustomHouseInteriorWorldName(entry) === worldName,
  );

  if (!house) return null;

  return customHouseInteriorImages[house.id] || null;
}

// =========================
// TEMPLATE (blangko/transparent na PNG, eksaktong sukat) - i-download
// para magamit bilang canvas sa Aseprite/LibreSprite/Photoshop/atbp.
// =========================
// AYOS (hiling ng user): "gusto ko yung template na yun is meron ng
// area ng pinto o tile ng pinto para palatandaan na door yon" - dating
// blangko/transparent LANG (walang anumang guide) ang template - ngayon,
// may naka-guhit na MARKER (kulay/outline + label) sa EKSAKTONG
// notch/tile kung saan dapat ang pintuan (bottom-center, PAREHONG
// kalkulasyon ng getBuilderDoorwayTileRange - GARANTISADONG magtutugma
// ito sa TALAGANG bukas/walang-collision na butas ng bahay/silid) -
// isang guide LANG ito, dapat "burahin"/gawing transparent (o guhitan
// ng bukas na pintuan) ng manlalaro sa mismong pixel editor bago
// i-export/i-upload pabalik.
function downloadBuilderTemplate(tilesWide, tilesTall) {
  const templateCanvas = document.createElement("canvas");

  templateCanvas.width = tilesWide * TILE_SIZE;
  templateCanvas.height = tilesTall * TILE_SIZE;

  const templateCtx = templateCanvas.getContext("2d");

  // Blangko/transparent ang buong canvas - MALIBAN sa guide marker ng
  // pintuan sa ibaba.
  const { doorWidth, startOffset } = getBuilderDoorwayTileRange(tilesWide);
  const doorX = startOffset * TILE_SIZE;
  const doorY = (tilesTall - 1) * TILE_SIZE;
  const doorPxWidth = doorWidth * TILE_SIZE;

  templateCtx.fillStyle = "rgba(255, 80, 80, 0.35)";
  templateCtx.fillRect(doorX, doorY, doorPxWidth, TILE_SIZE);

  templateCtx.strokeStyle = "rgba(255, 40, 40, 0.9)";
  templateCtx.lineWidth = 1;
  templateCtx.strokeRect(doorX + 0.5, doorY + 0.5, doorPxWidth - 1, TILE_SIZE - 1);

  const link = document.createElement("a");

  link.download = "template_" + tilesWide * TILE_SIZE + "x" + tilesTall * TILE_SIZE + ".png";
  link.href = templateCanvas.toDataURL("image/png");
  link.click();
}

// =========================
// PAG-UPLOAD + VALIDATION (generic - ginagamit ng Exterior AT Interior)
// =========================
function promptBuilderImageUpload(requiredWidthPx, requiredHeightPx, onSuccess) {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = "image/png";

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();

      img.onload = () => {
        if (img.naturalWidth !== requiredWidthPx || img.naturalHeight !== requiredHeightPx) {
          alert(
            "Maling sukat ng larawan.\n\nKailangan: " +
              requiredWidthPx +
              "x" +
              requiredHeightPx +
              " px\nNa-upload: " +
              img.naturalWidth +
              "x" +
              img.naturalHeight +
              " px",
          );
          return;
        }

        onSuccess(dataUrl);
      };

      img.onerror = () => alert("Hindi mabuksan ang larawan - siguraduhing PNG file.");
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });

  input.click();
}

// =========================
// BUILDER PANEL (JS-built modal, 3 tab: Lots/Exterior/Interior)
// =========================
let builderPanelEl = null;
let builderPanelTab = "lots";

function closeBuilderPanel() {
  if (builderPanelEl) {
    builderPanelEl.remove();
    builderPanelEl = null;
  }
}

function openBuilderPanel() {
  closeBuilderPanel();

  const overlay = document.createElement("div");

  overlay.className = "builder-panel-overlay";
  overlay.addEventListener("pointerdown", (event) => {
    if (event.target === overlay) closeBuilderPanel();
  });

  const panel = document.createElement("div");

  panel.className = "builder-panel";

  const header = document.createElement("div");

  header.className = "builder-panel-header";
  header.innerHTML = "<span>Joseph - Builder</span>";

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.className = "builder-panel-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeBuilderPanel);
  header.appendChild(closeBtn);

  const tabs = document.createElement("div");

  tabs.className = "builder-panel-tabs";

  const tabDefs = [
    { id: "lots", label: "Lots" },
    { id: "exterior", label: "Exterior" },
    { id: "interior", label: "Interior" },
    { id: "sell", label: "Sell" },
  ];

  const body = document.createElement("div");

  body.className = "builder-panel-body";

  for (const tabDef of tabDefs) {
    const tabBtn = document.createElement("button");

    tabBtn.type = "button";
    tabBtn.className = "builder-panel-tab-btn";
    tabBtn.textContent = tabDef.label;
    tabBtn.classList.toggle("active", builderPanelTab === tabDef.id);

    tabBtn.addEventListener("click", () => {
      builderPanelTab = tabDef.id;
      renderBuilderPanelBody(body);

      for (const btn of tabs.querySelectorAll(".builder-panel-tab-btn")) {
        btn.classList.remove("active");
      }

      tabBtn.classList.add("active");
    });

    tabs.appendChild(tabBtn);
  }

  panel.appendChild(header);
  panel.appendChild(tabs);
  panel.appendChild(body);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  builderPanelEl = overlay;

  renderBuilderPanelBody(body);
}

function renderBuilderPanelBody(body) {
  body.innerHTML = "";

  if (builderPanelTab === "lots") renderBuilderLotsTab(body);
  else if (builderPanelTab === "exterior") renderBuilderExteriorTab(body);
  else if (builderPanelTab === "interior") renderBuilderInteriorTab(body);
  else renderBuilderSellTab(body);
}

function renderBuilderLotsTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Pumili ng laki ng Lot - pagkatapos, i-click ang gustong lugar sa Grassmap para itayo (kahit saan, basta walang bumabara).";
  body.appendChild(intro);

  for (const lot of BUILDER_LOT_SIZES) {
    const row = document.createElement("div");

    row.className = "builder-lot-row";

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent =
      lot.label + " (" + lot.tilesWide + "x" + lot.tilesTall + " tiles)";

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";
    sub.textContent =
      "Kailangang sukat ng Exterior PNG: " +
      lot.tilesWide * TILE_SIZE +
      "x" +
      lot.tilesTall * TILE_SIZE +
      " px";

    label.appendChild(sub);

    const buyBtn = document.createElement("button");

    buyBtn.type = "button";
    buyBtn.className = "builder-buy-btn";
    buyBtn.textContent = "🪙" + lot.price;
    buyBtn.addEventListener("click", () => openBuilderWorldPicker(lot));

    row.appendChild(label);
    row.appendChild(buyBtn);
    body.appendChild(row);
  }
}

function renderBuilderHouseList(body, kind) {
  if (customHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent = "Wala ka pang Lot - bumili muna sa tab na 'Lots'.";
    body.appendChild(empty);
    return;
  }

  for (const house of customHouses) {
    const row = document.createElement("div");

    row.className = "builder-lot-row";

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ")";

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";

    if (kind === "exterior") {
      sub.textContent = house.exteriorImageDataURL
        ? "May Exterior na - i-click para palitan."
        : "Wala pang Exterior - kailangan: " +
          house.tilesWide * TILE_SIZE +
          "x" +
          house.tilesTall * TILE_SIZE +
          " px";
    } else {
      sub.textContent = house.interiorImageDataURL
        ? "May Interior na (" +
          house.interiorTilesWide +
          "x" +
          house.interiorTilesTall +
          " tiles) - i-click para palitan."
        : "Wala pang Interior.";
    }

    label.appendChild(sub);
    row.appendChild(label);

    const actions = document.createElement("div");

    actions.className = "builder-lot-actions";

    if (kind === "exterior") {
      const templateBtn = document.createElement("button");

      templateBtn.type = "button";
      templateBtn.className = "builder-secondary-btn";
      templateBtn.textContent = "Template";
      templateBtn.addEventListener("click", () =>
        downloadBuilderTemplate(house.tilesWide, house.tilesTall),
      );

      const uploadBtn = document.createElement("button");

      uploadBtn.type = "button";
      uploadBtn.className = "builder-buy-btn";
      uploadBtn.textContent = "Upload";
      uploadBtn.addEventListener("click", () => {
        promptBuilderImageUpload(
          house.tilesWide * TILE_SIZE,
          house.tilesTall * TILE_SIZE,
          (dataUrl) => {
            house.exteriorImageDataURL = dataUrl;
            delete customHouseExteriorImages[house.id];
            ensureCustomHouseImagesLoaded(house);
            saveCustomHouses();
            renderBuilderPanelBody(body);
            if (typeof showFloatingMessage === "function") {
              showFloatingMessage("Na-upload ang Exterior!");
            }
          },
        );
      });

      actions.appendChild(templateBtn);
      actions.appendChild(uploadBtn);
    } else {
      const sizeBtn = document.createElement("button");

      sizeBtn.type = "button";
      sizeBtn.className = "builder-buy-btn";
      sizeBtn.textContent = house.interiorImageDataURL ? "Palitan" : "Gumawa";
      sizeBtn.addEventListener("click", () => renderBuilderInteriorSizePicker(body, house));

      actions.appendChild(sizeBtn);
    }

    row.appendChild(actions);
    body.appendChild(row);
  }
}

function renderBuilderExteriorTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Piliin ang Lot na gustong bigyan ng Exterior - i-download ang Template, iguhit gamit ang Aseprite/LibreSprite/Photoshop, i-save bilang PNG (parehong eksaktong sukat), tapos i-Upload. May pulang guide sa Template - iyon ang EKSAKTONG posisyon ng pintuan, doon dapat ilagay ang guhit ng pintuan mo (puwede mo nang burahin/tabunan ang guide bago i-export).";
  body.appendChild(intro);

  renderBuilderHouseList(body, "exterior");
}

function renderBuilderInteriorTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Piliin ang Lot na gustong bigyan ng sariling disenyo ng SILID (interior) - malaya ang sukat nito, ikaw ang pipili. May pulang guide rin ang Template na ito - iyon ang pintuang PALABAS ng silid.";
  body.appendChild(intro);

  renderBuilderHouseList(body, "interior");
}

// AYOS (hiling ng user): "lagay ka rin ng tab para i sell yung
// property na lots na yon para maalis na rin sa map" - dating right-
// click LANG sa mismong bahay (sa TALAGANG mundo, tingnan ang
// contextmenu listener sa itaas) ang paraan para mag-Sell - dagdag na
// paraan na ito, DIREKTA sa loob ng Builder panel (hindi na
// kailangang puntahan/lakarin pa ang bahay).
function renderBuilderSellTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Piliin ang Lot na gustong ibenta/gibain - matatanggal ito sa mapa (kasama ang Exterior/Interior nito) at makakatanggap ka ng " +
    Math.round(BUILDER_SELL_REFUND_RATIO * 100) +
    "% pabalik na gold.";
  body.appendChild(intro);

  if (customHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent = "Wala ka pang Lot na maibebenta.";
    body.appendChild(empty);
    return;
  }

  for (const house of customHouses) {
    const row = document.createElement("div");

    row.className = "builder-lot-row";

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ")";

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";
    sub.textContent =
      (house.exteriorImageDataURL ? "May Exterior" : "Walang Exterior") +
      " • " +
      (house.interiorImageDataURL ? "May Interior" : "Walang Interior");

    label.appendChild(sub);
    row.appendChild(label);

    const sellBtn = document.createElement("button");

    sellBtn.type = "button";
    sellBtn.className = "builder-buy-btn";
    sellBtn.textContent = "Sell (+🪙" + Math.round(house.price * BUILDER_SELL_REFUND_RATIO) + ")";
    sellBtn.addEventListener("click", () => {
      sellCustomHouse(house);
      renderBuilderPanelBody(body);
    });

    row.appendChild(sellBtn);
    body.appendChild(row);
  }
}

function renderBuilderInteriorSizePicker(body, house) {
  body.innerHTML = "";

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent = "Ilang tiles (16px kada tile) ang laki ng SILID na gagawin mo?";
  body.appendChild(intro);

  const form = document.createElement("div");

  form.className = "builder-size-form";

  const widthLabel = document.createElement("label");

  widthLabel.textContent = "Tiles Wide";

  const widthInput = document.createElement("input");

  widthInput.type = "number";
  widthInput.min = "4";
  widthInput.max = "30";
  widthInput.value = house.interiorTilesWide || 12;

  const heightLabel = document.createElement("label");

  heightLabel.textContent = "Tiles Tall";

  const heightInput = document.createElement("input");

  heightInput.type = "number";
  heightInput.min = "4";
  heightInput.max = "30";
  heightInput.value = house.interiorTilesTall || 10;

  widthLabel.appendChild(widthInput);
  heightLabel.appendChild(heightInput);
  form.appendChild(widthLabel);
  form.appendChild(heightLabel);
  body.appendChild(form);

  const pxHint = document.createElement("p");

  pxHint.className = "builder-panel-hint";
  body.appendChild(pxHint);

  function updatePxHint() {
    const w = Math.max(4, Math.min(30, parseInt(widthInput.value, 10) || 12));
    const h = Math.max(4, Math.min(30, parseInt(heightInput.value, 10) || 10));

    pxHint.textContent = "Kailangang sukat ng Interior PNG: " + w * TILE_SIZE + "x" + h * TILE_SIZE + " px";
  }

  widthInput.addEventListener("input", updatePxHint);
  heightInput.addEventListener("input", updatePxHint);
  updatePxHint();

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const templateBtn = document.createElement("button");

  templateBtn.type = "button";
  templateBtn.className = "builder-secondary-btn";
  templateBtn.textContent = "Template";
  templateBtn.addEventListener("click", () => {
    const w = Math.max(4, Math.min(30, parseInt(widthInput.value, 10) || 12));
    const h = Math.max(4, Math.min(30, parseInt(heightInput.value, 10) || 10));

    downloadBuilderTemplate(w, h);
  });

  const uploadBtn = document.createElement("button");

  uploadBtn.type = "button";
  uploadBtn.className = "builder-buy-btn";
  uploadBtn.textContent = "Upload";
  uploadBtn.addEventListener("click", () => {
    const w = Math.max(4, Math.min(30, parseInt(widthInput.value, 10) || 12));
    const h = Math.max(4, Math.min(30, parseInt(heightInput.value, 10) || 10));

    promptBuilderImageUpload(w * TILE_SIZE, h * TILE_SIZE, (dataUrl) => {
      house.interiorImageDataURL = dataUrl;
      house.interiorTilesWide = w;
      house.interiorTilesTall = h;
      delete customHouseInteriorImages[house.id];
      ensureCustomHouseImagesLoaded(house);
      saveCustomHouses();
      closeBuilderPanel();

      if (typeof showFloatingMessage === "function") {
        showFloatingMessage("Na-upload ang Interior! Pwede nang pasukin ang bahay.");
      }
    });
  });

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Bumalik";
  backBtn.addEventListener("click", () => renderBuilderPanelBody(body));

  actions.appendChild(backBtn);
  actions.appendChild(templateBtn);
  actions.appendChild(uploadBtn);
  body.appendChild(actions);
}
