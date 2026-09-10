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
// AYOS (hiling ng user): "puro 10x8 na siya pero yung loob lang nag
// iiba exterior default yung laki ng 10x8 pero yung loob lang iba
// yung tile set...pilakamalaki is 20x20...ibase mo na dun sa laki ng
// interior from 12x11 to 20x20 pero 4 list lang" - dating IBA-IBA ang
// `tilesWide`/`tilesTall` (EXTERIOR footprint) kada tier - ngayon,
// FIXED na LAGI ang Exterior sa 10x8 (BUILDER_EXTERIOR_TILES_WIDE/TALL
// sa ibaba) sa LAHAT ng 4 tier - ang TALAGANG naiiba na ngayon ay ang
// `interiorTilesWide`/`interiorTilesTall` (ang BUKAS/walkable na sahig
// sa LOOB ng bahay, tingnan ang BUILDER_INTERIOR_WALL_THICKNESS sa
// ibaba para sa padding) - mula 10x8 (pinakamaliit, +padding = 12x11
// katumbas na PADDED na Template) hanggang 18x17 (pinakamalaki,
// +padding = 20x20 katumbas na PADDED na Template) - kaya mas malaki
// ang SILID sa loob, kahit PAREHONG-PAREHO lang ang itsura/laki ng
// bahay sa LABAS (mapa/minimap).
const BUILDER_EXTERIOR_TILES_WIDE = 10;
const BUILDER_EXTERIOR_TILES_TALL = 8;

const BUILDER_LOT_SIZES = [
  { id: "small", label: "Small", interiorTilesWide: 10, interiorTilesTall: 8, price: 300 },
  { id: "medium", label: "Medium", interiorTilesWide: 13, interiorTilesTall: 11, price: 600 },
  { id: "large", label: "Large", interiorTilesWide: 15, interiorTilesTall: 13, price: 900 },
  { id: "xlarge", label: "Extra Large", interiorTilesWide: 18, interiorTilesTall: 17, price: 1400 },
];

// =========================
// BUILDING TEMPLATES (user request: pre-made exterior+interior "bundles"
// like Coffee Shop / Tavern - pick one and it's built instantly, no manual
// upload needed) - a "Building" tab next to "Lots" lists these.
// =========================
// Each template is a ready-made pair of PNGs shipped with the game (NOT
// something the player uploads - these live in assets/builder-templates/).
// `interiorTilesWide`/`interiorTilesTall` here is the OPEN/walkable floor
// size the template's interior artwork was drawn for - it must match one
// of the BUILDER_LOT_SIZES tiers exactly (the interior PNG's pixel size is
// ALWAYS `getBuilderInteriorPaddedSize(...) * TILE_SIZE`, same rule as a
// custom-uploaded Interior). A template can only be applied to a Lot whose
// own `interiorTilesWide/Tall` matches - see getBuilderTemplateFit().
// `doorPosition` is FIXED per template (baked into the artwork, not
// player-chosen like the custom Exterior/Interior flow).
const BUILDER_BUILDING_TEMPLATES = [
  {
    id: "coffee-shop",
    name: "Coffee Shop",
    interiorTilesWide: 18,
    interiorTilesTall: 17,
    doorPosition: "bottom-center",
    exteriorImagePath: "./assets/builder-templates/coffeeshop-exterior.png",
    interiorImagePath: "./assets/builder-templates/coffeeshop-interior.png",
    // AYOS (hiling ng user): "yung coffeeshop at tavern kapag gabi na is
    // meron ilaw yung mga lamp nila at yung window wag lang masyadong
    // maliwanag" - {x, y} sa RELATIVE pixel coordinates ng exterior
    // artwork mismo (160x128, itaas-kaliwa = 0,0) - dito nakikita ang
    // 2 hanging lamp fixture sa harapan (dalawang bombilyang nakabitin
    // malapit sa pintuan) - ginawa NA-SAMPLE ito direkta mula sa
    // artwork (hinanap ang pinakamaliwanag na warm/orange pixel), hindi
    // basta hula.
    //
    // AYOS ULIT (hiling ng user): "ok naman kaso lamp lang yung
    // umiilaw e dapat pati yung sa window at pinto yung sa pinto
    // parang kagaya lang ng ilaw sa town na mga pintong bahay don" -
    // dinagdagan ng 2 pang punto (window + pinto), kaparehong disenyo
    // ng town (windows + door layer, tingnan Entry #90/#91) - hinanap
    // din ito sa pamamagitan ng pag-sample sa artwork (dark glass
    // color ng bintana/pintuan), VERIFIED sa pamamagitan ng pag-guhit
    // ng marker circle sa larawan bago isinama dito.
    lightPoints: [
      { x: 33, y: 92 }, // lamp (kaliwa)
      { x: 53, y: 92 }, // lamp (kanan)
      { x: 35, y: 102 }, // window
      { x: 83, y: 94 }, // pinto (maliit na salamin sa itaas)
    ],
  },
  {
    id: "tavern",
    name: "Tavern",
    interiorTilesWide: 18,
    interiorTilesTall: 17,
    doorPosition: "bottom-center",
    exteriorImagePath: "./assets/builder-templates/tavern-exterior.png",
    interiorImagePath: "./assets/builder-templates/tavern-interior.png",
    // Dalawang lantern na nakabitin sa magkabilang tabi ng "TAVERN" na
    // signage sa itaas ng pintuan - kaparehong paraan ng pag-sample.
    // AYOS ULIT (hiling ng user) - dinagdagan din ng 2 window (kaliwa/
    // kanan) + 1 pinto, kaparehong dahilan sa itaas.
    lightPoints: [
      { x: 51, y: 88 }, // lamp (kaliwa)
      { x: 95, y: 88 }, // lamp (kanan)
      { x: 26, y: 104 }, // window (kaliwa)
      { x: 109, y: 99 }, // window (kanan)
      { x: 73, y: 102 }, // pinto
    ],
  },
  // Planned (user: "gagawa pa ako ng iba like grocery store, at garden
  // house") - add more entries here once their exterior/interior PNGs are
  // ready, matching whichever BUILDER_LOT_SIZES tier they were drawn for.
];

// Preloaded once at parse-time (same pattern as MINIMAP_WORLD_BACKGROUND_IMAGES,
// minimap.js) - one `Image()` per path, reused for every house built from
// that template (never duplicated into localStorage - see saveCustomHouses,
// where template houses are deliberately excluded from the asset store).
const BUILDER_TEMPLATE_IMAGES = {};

for (const template of BUILDER_BUILDING_TEMPLATES) {
  const exteriorImg = new Image();

  exteriorImg.src = template.exteriorImagePath;

  const interiorImg = new Image();

  interiorImg.src = template.interiorImagePath;

  BUILDER_TEMPLATE_IMAGES[template.id] = { exterior: exteriorImg, interior: interiorImg };
}

function getBuilderTemplateById(templateId) {
  return BUILDER_BUILDING_TEMPLATES.find((template) => template.id === templateId) || null;
}

// True kung magkatugma ang OPEN interior floor size ng isang Lot at ang
// kailangan ng isang template - ang TANGING bagay na pumipigil sa isang
// template na ilapat kahit saang Lot (parehong-pareho naman ang Exterior
// footprint sa LAHAT ng Lot, 10x8, kaya iyon ay hindi problema).
function getBuilderTemplateFit(house, template) {
  return (
    house.interiorTilesWide === template.interiorTilesWide &&
    house.interiorTilesTall === template.interiorTilesTall
  );
}

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
//   exteriorImageDataURL, interiorImageDataURL, doorPosition }
//
// AYOS (hiling ng user): "sa interior naman kasi dapat nga hindi na
// mamimili ng tiles width at layo ng sa interior e dapat kung ano ng
// laki ng exterior ganun na din lakalaki pero yung sa collisions lang
// sa interior is gilid lang...kung bottom center yung napili
// automatic na bottom center na rin sa interior" - dating may SARILI
// SILANG hiwalay na `interiorTilesWide`/`interiorTilesTall`/
// `interiorDoorPosition` (malayang pinipili ng user) - TINANGGAL na
// ang mga ito - ang LOOB ng bahay ay AWTOMATIKONG kumukuha na lang sa
// `tilesWide`/`tilesTall`/`doorPosition` ng EXTERIOR (parehong-pareho
// ang sukat AT posisyon ng pintuan) - mas simple (isang beses ka na
// lang pumipili, hindi na doble), at mas makatuwiran din (parehong
// laki talaga dapat ang loob at labas ng bahay).
let customHouses = [];
let customHouseIdCounter = 0;

const BUILDER_SAVE_KEY = "tralala.customHouses.v1";

// =========================
// IMAGE ASSET STORE (fixes: houses disappearing after Save -> Load)
// =========================
// ROOT CAUSE: every "Save" creates a brand-new slot (by design), and
// each slot used to embed a full copy of every house's exterior AND
// interior PNG (as base64 text) directly inside it. A single house's
// artwork can be a few hundred KB - saving repeatedly (which is exactly
// what testing/iterating does) multiplies that same data across every
// slot, and it is very easy to blow past the browser's ~5MB localStorage
// quota after just a handful of saves. Once that happens, the slot
// write silently fails (or, in a worse case, throws partway through) -
// the next "Load" then finds no house data at all, which matches
// exactly what was reported: houses are fine right after building them,
// but vanish after Save -> Load.
//
// FIX: house artwork (the big base64 strings) is no longer embedded
// inline in the house record. Instead each image is written ONCE to
// its own key (BUILDER_ASSET_KEY_PREFIX + assetId), and the house
// record only keeps a small reference (`exteriorAssetId`/
// `interiorAssetId`). Saving 10 times no longer multiplies the image
// data 10x - the image bytes exist exactly once, no matter how many
// save slots reference them. `exteriorImageDataURL`/`interiorImageDataURL`
// still exist on the in-memory house object exactly as before (nothing
// else in the codebase needs to change) - they are simply rehydrated
// from the asset store on load instead of being persisted directly.
const BUILDER_ASSET_KEY_PREFIX = "tralala.customHouseAsset.v1.";

function builderAssetKey(assetId) {
  return BUILDER_ASSET_KEY_PREFIX + assetId;
}

let builderAssetIdCounter = 0;

function generateBuilderAssetId() {
  builderAssetIdCounter++;

  return Date.now() + "_" + builderAssetIdCounter + "_" + Math.floor(Math.random() * 100000);
}

// Writes one image to its own key and returns the new assetId, or
// `null` if it could not be written (storage full/blocked) - callers
// should leave the house's existing image untouched in that case
// rather than losing it.
function saveBuilderAsset(dataUrl) {
  const assetId = generateBuilderAssetId();

  try {
    localStorage.setItem(builderAssetKey(assetId), dataUrl);

    return assetId;
  } catch (err) {
    console.error("Could not save house artwork (storage may be full):", err);

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("STORAGE FULL - could not save that image! Delete an old save slot first.");
    }

    return null;
  }
}

function loadBuilderAsset(assetId) {
  if (!assetId) return null;

  try {
    return localStorage.getItem(builderAssetKey(assetId));
  } catch (err) {
    return null;
  }
}

function deleteBuilderAsset(assetId) {
  if (!assetId) return;

  try {
    localStorage.removeItem(builderAssetKey(assetId));
  } catch (err) {
    // Not critical.
  }
}

// Lists every asset key currently on disk - used by "Reset the game"
// (settings-menu.js) to make sure a full reset really does clear
// uploaded artwork too, and by Export (also settings-menu.js) to
// re-embed images into a portable save file.
function getAllBuilderAssetKeys() {
  const keys = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.indexOf(BUILDER_ASSET_KEY_PREFIX) === 0) keys.push(key);
    }
  } catch (err) {
    // Not critical.
  }

  return keys;
}

function saveCustomHouses() {
  try {
    // MIGRATION SAFETY NET: a house built with an OLDER version of this
    // code (before images were split into their own asset keys) still
    // has its image directly on `exteriorImageDataURL`/
    // `interiorImageDataURL`, with NO `exteriorAssetId`/`interiorAssetId`
    // yet. If we just stripped those two fields below like normal, that
    // image would be thrown away with nothing left to recover it from -
    // the house would come back with a blank Exterior/Interior (or the
    // whole house could look "gone" once its picture disappears). So:
    // for any house that has embedded image data but no asset id yet,
    // migrate it into the asset store right here, once, before slimming.
    //
    // EXCEPTION - a Building-template house (`house.templateId` set, see
    // applyBuilderTemplateToHouse) has its `exteriorImageDataURL`/
    // `interiorImageDataURL` pointing at a small STATIC asset path
    // (assets/builder-templates/...), not a big base64 upload - there is
    // nothing to "migrate", it costs nothing to keep those two fields as
    // plain strings, and routing them through the asset store would just
    // waste an asset key on a path that's already tiny.
    for (const house of customHouses) {
      if (house.templateId) continue;

      if (house.exteriorImageDataURL && !house.exteriorAssetId) {
        const assetId = saveBuilderAsset(house.exteriorImageDataURL);

        if (assetId) house.exteriorAssetId = assetId;
      }
      if (house.interiorImageDataURL && !house.interiorAssetId) {
        const assetId = saveBuilderAsset(house.interiorImageDataURL);

        if (assetId) house.interiorAssetId = assetId;
      }
    }

    // Only the SMALL fields are persisted here - `exteriorImageDataURL`/
    // `interiorImageDataURL` are deliberately left out for CUSTOM houses
    // (see the "IMAGE ASSET STORE" comment above); they live in their own
    // asset keys and get rehydrated by loadCustomHouses(). This keeps
    // BUILDER_SAVE_KEY itself small no matter how much artwork has been
    // uploaded. Template houses are the one exception - their image
    // fields are cheap static paths, so they're kept as-is (and there is
    // no assetId to rehydrate from for them anyway).
    const slimHouses = customHouses.map((house) => {
      if (house.templateId) return house;

      const { exteriorImageDataURL, interiorImageDataURL, ...rest } = house;

      return rest;
    });

    localStorage.setItem(
      BUILDER_SAVE_KEY,
      JSON.stringify({ idCounter: customHouseIdCounter, houses: slimHouses }),
    );
    return true;
  } catch (err) {
    console.error("Could not save custom houses (storage may be full):", err);

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("STORAGE FULL - could not save your houses! Delete an old save slot first.");
    }

    return false;
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

// Instantly gives a house BOTH its Exterior AND Interior from a pre-made
// Building template (Coffee Shop/Tavern/etc, see BUILDER_BUILDING_TEMPLATES
// above) - no upload needed. Re-uses the exact same fields/pipeline as a
// manual custom upload (`exteriorImageDataURL`/`interiorImageDataURL` just
// hold the template's static asset path here instead of a data: URL - both
// work identically everywhere else in the codebase, since drawing/minimap/
// door-registration all just do `img.src = house.exteriorImageDataURL`
// without caring whether that's a path or a data: URL).
function applyBuilderTemplateToHouse(house, template) {
  house.templateId = template.id;
  house.doorPosition = template.doorPosition;
  house.exteriorImageDataURL = template.exteriorImagePath;
  house.interiorImageDataURL = template.interiorImagePath;

  // Clear both custom-house image fields, matching the migration-safety-net
  // in saveCustomHouses() - a template house should NEVER carry an asset
  // store reference (its art isn't a user upload, so it isn't persisted as
  // one either - see the template special-case in saveCustomHouses).
  delete house.exteriorAssetId;
  delete house.interiorAssetId;

  delete customHouseExteriorImages[house.id];
  delete customHouseInteriorImages[house.id];
  ensureCustomHouseImagesLoaded(house);
  saveCustomHouses();
}

// LUMANG saved house (bago pa ang door-position feature) - walang pang
// `doorPosition` field, kaya "bottom-center" na lang (ang dating
// FIXED/tanging posisyon) ang ipapalagay dito - walang mababago sa
// gawi ng mga ito.
function normalizeCustomHouseDoorPositions(house) {
  house.doorPosition = migrateBuilderDoorPositionId(house.doorPosition);
}

function loadCustomHouses() {
  try {
    const raw = localStorage.getItem(BUILDER_SAVE_KEY);

    if (!raw) return;

    const parsed = JSON.parse(raw);

    customHouseIdCounter = parsed.idCounter || 0;
    customHouses = Array.isArray(parsed.houses) ? parsed.houses : [];

    for (const house of customHouses) {
      normalizeCustomHouseDoorPositions(house);

      // Rehydrate the actual image data from the asset store (see the
      // "IMAGE ASSET STORE" comment above) - the saved house record only
      // has the small `exteriorAssetId`/`interiorAssetId` references.
      // BUGFIX: only OVERWRITE with the asset-store lookup when an
      // assetId actually exists - a house saved by an OLDER version of
      // this code (before the asset store existed) still has its image
      // directly embedded as `exteriorImageDataURL`/`interiorImageDataURL`
      // with no assetId yet; blindly overwriting those fields with
      // `loadBuilderAsset(undefined)` (which is always null) would erase
      // that legacy artwork outright. Leaving the embedded value alone
      // here means saveCustomHouses()'s migration step (see there) gets
      // a chance to move it into the asset store on the next save.
      if (house.exteriorAssetId) house.exteriorImageDataURL = loadBuilderAsset(house.exteriorAssetId);
      if (house.interiorAssetId) house.interiorImageDataURL = loadBuilderAsset(house.interiorAssetId);

      ensureCustomHouseImagesLoaded(house);
    }
  } catch (err) {
    console.error("Could not load custom houses:", err);
    customHouses = [];
  }
}

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
// LAMP/WINDOW GLOW NG MGA BUILDING TEMPLATE (hiling ng user: "yung
// coffeeshop at tavern kapag gabi na is meron ilaw yung mga lamp nila
// at yung window") - ibinabalik ang mga WORLD-SPACE na punto (base sa
// house.col/row + ang `lightPoints` ng template nito, tingnan
// BUILDER_BUILDING_TEMPLATES) para sa lahat ng bahay na (a) nasa
// KASALUKUYANG mundo, at (b) may template na TALAGANG may `lightPoints`
// (custom/manual na Exterior ay wala nito - walang alam ang code kung
// saan dapat lumitaw ang ilaw sa isang larawang ini-upload lang ng
// manlalaro). Ginagamit ito ni drawCustomHouseLights (atmosphere.js).
// =========================
function getCustomHouseLightPoints() {
  if (typeof currentWorld === "undefined") return [];

  const points = [];

  for (const house of customHouses) {
    if (house.world !== currentWorld) continue;
    if (!house.templateId) continue;

    const template = getBuilderTemplateById(house.templateId);

    if (!template || !Array.isArray(template.lightPoints)) continue;

    const houseX = house.col * TILE_SIZE;
    const houseY = house.row * TILE_SIZE;

    for (const point of template.lightPoints) {
      points.push({ x: houseX + point.x, y: houseY + point.y });
    }
  }

  return points;
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
            ctx.fillText("Lot (no Exterior)", boxX + boxWidth / 2, boxY + boxHeight / 2);
            ctx.restore();
          }

          // AYOS (hiling ng user: "may label sa taas ng house dapat wag
          // mo na lagyan ng label sa mismong [mapa], process lang kay
          // joseph") - WALANG pangalan na nakasulat dito sa mapa - sa
          // mga panel/listahan na lang kay Joseph ito lumalabas.
        },
      };
    });
}

// =========================
// COLLISION (buong footprint MINUS isang notch/butas sa isang PADER,
// para sa pintuan) - tingnan ang getCustomHouseCollisionBoxes (checked
// ng collisions.js, canMoveTo) at ang DOORS entry (registerCustomHouseDoors).
// =========================
// AYOS (hiling ng user): "yung door guide is dapat may 3 selection ng
// door like left bottom, center bottom, right bottom" (unang bersyon,
// 3 pagpipilian, GITNA-IBABANG pader lang) - AYOS ULIT (hiling ng
// user): "sa interior is may selection din kung san yung door pero
// gawin mo na lang pala same lang ng template yung sa exterior at
// interior bali 12 na template top wall is top+left, top center,
// top-right, sa left wall is left+top, left+center, left+bottom, sa
// bottom wall is bottom left bottom center bottom right, sa right is
// right top, right center at right bottom" - ngayon, LAHAT ng 4 pader
// (top/left/bottom/right) ay may 3 posisyon (start/center/end) bawat
// isa = 12 pagpipilian - PAREHONG-PAREHONG listahan ito ang ginagamit
// ng EXTERIOR (`house.doorPosition`) - AWTOMATIKONG kinukuha na rin
// ito ng INTERIOR (tingnan ang registerCustomHouseInteriorWorld, wala
// nang sariling hiwalay na posisyon ang interior), "bottom-center" pa
// rin ang default (katumbas ng dating tanging FIXED na posisyon) -
// ito ang GINAGAMIT ng LAHAT ng pintuan-related na kalkulasyon
// (collision notch, DOORS entry/spawn, interior wall notch, AT ang
// guide marker mismo sa
// downloadBuilderTemplate) kaya GARANTISADO pa ring magkatugma ang
// lahat, kahit anong pader/posisyon ang piniling.
const BUILDER_DOOR_POSITIONS = [
  { id: "top-left", label: "Top-Left", wall: "top", align: "start" },
  { id: "top-center", label: "Top-Center", wall: "top", align: "center" },
  { id: "top-right", label: "Top-Right", wall: "top", align: "end" },
  { id: "left-top", label: "Left-Top", wall: "left", align: "start" },
  { id: "left-center", label: "Left-Center", wall: "left", align: "center" },
  { id: "left-bottom", label: "Left-Bottom", wall: "left", align: "end" },
  { id: "bottom-left", label: "Bottom-Left", wall: "bottom", align: "start" },
  { id: "bottom-center", label: "Bottom-Center", wall: "bottom", align: "center" },
  { id: "bottom-right", label: "Bottom-Right", wall: "bottom", align: "end" },
  { id: "right-top", label: "Right-Top", wall: "right", align: "start" },
  { id: "right-center", label: "Right-Center", wall: "right", align: "center" },
  { id: "right-bottom", label: "Right-Bottom", wall: "right", align: "end" },
];

const BUILDER_DEFAULT_DOOR_POSITION = "bottom-center";

// LUMANG value (bago pa ang 12-pader na bersyon: "left"/"center"/
// "right", laging GITNA-IBABANG pader) - i-map papunta sa katumbas
// nitong BAGONG id (lahat "bottom-*"), para hindi masira ang mga
// dati nang naitayong bahay.
function migrateBuilderDoorPositionId(value) {
  if (value === "left") return "bottom-left";
  if (value === "right") return "bottom-right";
  if (value === "center") return "bottom-center";
  if (BUILDER_DOOR_POSITIONS.some((entry) => entry.id === value)) return value;

  return BUILDER_DEFAULT_DOOR_POSITION;
}

function getBuilderDoorPositionDef(doorPosition) {
  return (
    BUILDER_DOOR_POSITIONS.find((entry) => entry.id === doorPosition) ||
    BUILDER_DOOR_POSITIONS.find((entry) => entry.id === BUILDER_DEFAULT_DOOR_POSITION)
  );
}

// Ibinabalik ang { wall, doorWidth, startOffset } - `startOffset` ay
// ALONG THE AXIS ng piniling pader (tiles wide para sa top/bottom,
// tiles tall para sa left/right), simula sa KALIWA (top/bottom) o
// ITAAS (left/right) ng pader na iyon.
function getBuilderDoorwayInfo(tilesWide, tilesTall, doorPosition) {
  const def = getBuilderDoorPositionDef(migrateBuilderDoorPositionId(doorPosition));
  const axisLength = def.wall === "top" || def.wall === "bottom" ? tilesWide : tilesTall;
  const doorWidth = Math.min(2, axisLength);
  let startOffset;

  if (def.align === "start") {
    startOffset = 0;
  } else if (def.align === "end") {
    startOffset = axisLength - doorWidth;
  } else {
    startOffset = Math.floor((axisLength - doorWidth) / 2);
  }

  return { wall: def.wall, doorWidth, startOffset };
}

// Ibinabalik ang notch/pintuan bilang TILE rectangle sa SARILING (0,0
// simula sa itaas-kaliwa) na coordinate frame ng kahon (bago pa
// idagdag ang col/row offset ng TALAGANG bahay sa mapa) - { col, row,
// width, height }, LAHAT sa TILES (hindi pixels).
function getBuilderDoorTileRect(tilesWide, tilesTall, doorPosition) {
  const { wall, doorWidth, startOffset } = getBuilderDoorwayInfo(
    tilesWide,
    tilesTall,
    doorPosition,
  );

  if (wall === "top") return { col: startOffset, row: 0, width: doorWidth, height: 1 };
  if (wall === "bottom") {
    return { col: startOffset, row: tilesTall - 1, width: doorWidth, height: 1 };
  }
  if (wall === "left") return { col: 0, row: startOffset, width: 1, height: doorWidth };

  // "right"
  return { col: tilesWide - 1, row: startOffset, width: 1, height: doorWidth };
}

// Buong footprint (tilesWide x tilesTall, simula sa colPx/rowPx sa
// PIXELS) MINUS ang notch ng pintuan - pareho itong ginagamit ng
// EXTERIOR collision (getCustomHouseCollisionBoxes, laban sa TALAGANG
// mapa) AT ng INTERIOR wall/notch (buildSyntheticInteriorTmj, laban sa
// sariling silid) - iisang generic na hugis lang, kahit anong pader
// pa ang piniling posisyon ng pintuan.
function getBuilderFootprintCollisionBoxes(colPx, rowPx, tilesWide, tilesTall, doorPosition) {
  const { wall, doorWidth, startOffset } = getBuilderDoorwayInfo(
    tilesWide,
    tilesTall,
    doorPosition,
  );
  const fullWidthPx = tilesWide * TILE_SIZE;
  const fullHeightPx = tilesTall * TILE_SIZE;
  const boxes = [];

  if (wall === "top" || wall === "bottom") {
    const doorStartCol = startOffset;
    const doorEndCol = doorStartCol + doorWidth - 1;

    // Kaliwa ng pintuan (buong taas).
    if (doorStartCol > 0) {
      boxes.push({ x: colPx, y: rowPx, width: doorStartCol * TILE_SIZE, height: fullHeightPx });
    }

    // Kanan ng pintuan (buong taas).
    const rightStartCol = doorEndCol + 1;

    if (rightStartCol <= tilesWide - 1) {
      boxes.push({
        x: colPx + rightStartCol * TILE_SIZE,
        y: rowPx,
        width: (tilesWide - rightStartCol) * TILE_SIZE,
        height: fullHeightPx,
      });
    }

    // Ang kabilang gilid (itaas kung "bottom" ang pader ng pintuan,
    // ibaba kung "top") - lahat ng hanay MALIBAN sa pinto mismo,
    // pero SAKOP LANG ang column-range ng pintuan (dahil kasama na
    // sa 2 box sa itaas ang natitirang columns).
    if (tilesTall > 1) {
      const otherRowsY = wall === "bottom" ? rowPx : rowPx + TILE_SIZE;

      boxes.push({
        x: colPx + doorStartCol * TILE_SIZE,
        y: otherRowsY,
        width: doorWidth * TILE_SIZE,
        height: (tilesTall - 1) * TILE_SIZE,
      });
    }
  } else {
    // "left" o "right" - pahalang (row-based) ang notch sa halip.
    const doorStartRow = startOffset;
    const doorEndRow = doorStartRow + doorWidth - 1;

    // Itaas ng pintuan (buong lapad).
    if (doorStartRow > 0) {
      boxes.push({ x: colPx, y: rowPx, width: fullWidthPx, height: doorStartRow * TILE_SIZE });
    }

    // Ibaba ng pintuan (buong lapad).
    const bottomStartRow = doorEndRow + 1;

    if (bottomStartRow <= tilesTall - 1) {
      boxes.push({
        x: colPx,
        y: rowPx + bottomStartRow * TILE_SIZE,
        width: fullWidthPx,
        height: (tilesTall - bottomStartRow) * TILE_SIZE,
      });
    }

    // Ang kabilang gilid (kanan kung "left" ang pader ng pintuan,
    // kaliwa kung "right") - lahat ng hanay MALIBAN sa pinto mismo,
    // pero SAKOP LANG ang row-range ng pintuan.
    if (tilesWide > 1) {
      const otherColX = wall === "right" ? colPx : colPx + TILE_SIZE;

      boxes.push({
        x: otherColX,
        y: rowPx + doorStartRow * TILE_SIZE,
        width: (tilesWide - 1) * TILE_SIZE,
        height: doorWidth * TILE_SIZE,
      });
    }
  }

  return boxes;
}

// =========================
// "WALKABLE" NA BUBONG - ITAAS NA 2 ROW NG EXTERIOR, WALANG COLLISION
// =========================
// AYOS (hiling ng user): "yung sa 10x8 diba gusto ko sa 8 is 6 lang
// may collisions yung 2 sa taas na pang 8 is walang collisions" -
// dating BUONG 10x8 na footprint ang solid (minus lang ang notch ng
// pintuan), kaya hindi ka makakalakad sa LIKOD ng bahay. Ngayon, ang
// ITAAS na 2 row ay BUKAS/walkable (bubong/likod ng bahay) - 6 na row
// na lang sa ibaba ang TALAGANG may collision.
//
// TANDAAN: PAGGUHIT/placement lang ang naiiba dito - ang FOOTPRINT pa
// rin (buong 10x8) ang ginagamit para sa (a) pag-check kung pwedeng
// itayo doon ang bagong Lot, at (b) pagtatago ng puno/bato sa ilalim
// (isTileCoveredByCustomHouse) - COLLISION lang talaga ang binago.
const BUILDER_EXTERIOR_OPEN_TOP_ROWS = 2;

// Ginugupit (clip) ang isang listahan ng box para MANATILI LANG ang
// bahaging nasa SOLID na rehiyon (mula sa row `openTopRows` pababa) -
// ginagawa itong GENERIC/clip sa halip na muling kalkulahin ang hugis,
// para GARANTISADONG tama pa rin ito sa LAHAT ng 12 posisyon ng
// pintuan (kasama na ang mga nasa "top"/"left"/"right" na pader).
function clipBuilderBoxesToSolidRows(boxes, rowPx, tilesTall, openTopRows) {
  const solidTopY = rowPx + Math.min(openTopRows, tilesTall) * TILE_SIZE;
  const solidBottomY = rowPx + tilesTall * TILE_SIZE;
  const clipped = [];

  for (const box of boxes) {
    const top = Math.max(box.y, solidTopY);
    const bottom = Math.min(box.y + box.height, solidBottomY);

    if (bottom - top <= 0) continue;

    clipped.push({ x: box.x, y: top, width: box.width, height: bottom - top });
  }

  return clipped;
}

// Ang TALAGANG collision shape ng isang EXTERIOR na bahay: buong
// footprint MINUS ang notch ng pintuan, MINUS pa ang bukas na itaas na
// 2 row. IISANG function na lang ang gamit ng LAHAT (mapa, at ang
// bughaw na guide sa Template) - kaya EKSAKTONG magkatugma ang nakikita
// mo sa Template at ang TALAGANG nararamdaman sa laro.
function getBuilderExteriorCollisionBoxes(colPx, rowPx, tilesWide, tilesTall, doorPosition) {
  return clipBuilderBoxesToSolidRows(
    getBuilderFootprintCollisionBoxes(colPx, rowPx, tilesWide, tilesTall, doorPosition),
    rowPx,
    tilesTall,
    BUILDER_EXTERIOR_OPEN_TOP_ROWS,
  );
}

// BUONG footprint (walang notch, walang clip) - para sa PLACEMENT lang
// (isBuilderTileFree) - kung ang clipped na collision ang gagamitin
// doon, PWEDENG MAG-OVERLAP ang bagong Lot sa bubong ng dati nang
// bahay (dahil "libre" na nga ang itaas na 2 row).
function getCustomHouseFootprintBoxes(worldName) {
  const boxes = [];

  for (const house of customHouses) {
    if (house.world !== worldName) continue;

    boxes.push({
      x: house.col * TILE_SIZE,
      y: house.row * TILE_SIZE,
      width: house.tilesWide * TILE_SIZE,
      height: house.tilesTall * TILE_SIZE,
    });
  }

  return boxes;
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

    boxes.push(
      ...getBuilderExteriorCollisionBoxes(
        house.col * TILE_SIZE,
        house.row * TILE_SIZE,
        house.tilesWide,
        house.tilesTall,
        house.doorPosition,
      ),
    );
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

  // AYOS: BUONG footprint ang tinitingnan dito (hindi ang collision
  // shape) - tingnan ang getCustomHouseFootprintBoxes sa itaas, dahil
  // "libre" na ngayon ang itaas na 2 row ng bawat bahay.
  if (getCustomHouseFootprintBoxes(worldName).some((box) => isColliding(tileBox, box))) {
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
// PANGALAN NG LOT (hiling ng user: "sana yung kapag may lots bago
// bumili is may lalabas na pwede kong ilagay na name tyaka magpunta sa
// map at mailagay")
// =========================
//
// DALOY: Lots tab -> pindutin ang presyo -> PANGALAN -> Map Picker ->
// i-click ang lugar -> Exterior -> Interior. Ang pangalan ay dala-dala
// lang sa buong daloy (hindi pa nase-save hangga't hindi TALAGANG
// naitayo ang bahay) - kaya kung isasara mo ang alinman sa mga screen,
// walang mababawas na gold at walang maiiwang basura.
const BUILDER_LOT_NAME_MAX_LENGTH = 20;

// Pinapayat ang sunod-sunod na espasyo at pinuputol sa max length -
// hindi ito nagbabawal ng emoji/anumang karakter, gusto lang natin na
// laging kasya ang label sa mga listahan.
function sanitizeBuilderLotName(value) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BUILDER_LOT_NAME_MAX_LENGTH);
}

// Ang IPAPAKITANG pangalan ng isang bahay - may fallback para sa mga
// LUMANG naitayo na (bago pa ang feature na ito, walang `name` field)
// at para sa mga blangkong sinagot ng user.
function getCustomHouseName(house) {
  const name = house && typeof house.name === "string" ? house.name.trim() : "";

  return name || "Unnamed";
}

// Screen 1 ng pagbili - pangalan muna bago ang mapa.
function openBuilderLotNameDialog(lotSize) {
  closeBuilderPanel();

  const overlay = document.createElement("div");

  overlay.className = "builder-panel-overlay";

  const panel = document.createElement("div");

  panel.className = "builder-panel";

  const header = document.createElement("div");

  header.className = "builder-panel-header";
  header.innerHTML = "<span>Name the Lot</span>";

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.className = "builder-panel-close";
  closeBtn.textContent = "\u2715";
  closeBtn.addEventListener("click", () => {
    overlay.remove();
    openBuilderPanel();
  });
  header.appendChild(closeBtn);

  const body = document.createElement("div");

  body.className = "builder-panel-body";

  const hint = document.createElement("p");

  hint.className = "builder-panel-hint";
  hint.textContent =
    "What do you want to call this house (" +
    lotSize.label +
    ", \ud83e\ude99" +
    lotSize.price +
    ")? The name only shows up in Joseph's lists - nothing is written on the map itself. After this, you will choose where to build it - the gold is only deducted once you place it there.";
  body.appendChild(hint);

  const form = document.createElement("div");

  form.className = "builder-name-form";

  const label = document.createElement("label");

  label.textContent = "Pangalan";

  const input = document.createElement("input");

  input.type = "text";
  input.className = "builder-name-input";
  input.maxLength = BUILDER_LOT_NAME_MAX_LENGTH;
  input.placeholder = "e.g. Ana's House";

  // BUGFIX (hiling ng user: "di nag fufunction yung wasd") - kapag
  // hawak mo pa ang W/A/S/D nang mag-click ka rito, mananatili silang
  // "naka-hawak" (walang keyup na darating habang naka-focus ang
  // input) - kaya binubura natin sila sa sandaling mag-focus dito.
  // Ang MISMONG pag-type naman ay inaayos na ng isTypingInTextField
  // (input.js) - doon nagmumula ang tunay na bug.
  input.addEventListener("focus", () => {
    if (typeof clearHeldKeys === "function") clearHeldKeys();
  });

  label.appendChild(input);
  form.appendChild(label);
  body.appendChild(form);

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => {
    overlay.remove();
    openBuilderPanel();
  });

  const nextBtn = document.createElement("button");

  nextBtn.type = "button";
  nextBtn.className = "builder-buy-btn";
  nextBtn.textContent = "Choose on Map \u2192";

  const proceed = () => {
    const lotName = sanitizeBuilderLotName(input.value);

    if (!lotName) {
      input.focus();

      if (typeof showFloatingMessage === "function") {
        showFloatingMessage("Enter a name for the house first.");
      }
      return;
    }

    overlay.remove();
    // AYOS (hiling ng user: "dapat pag confirm is mag map na") - dating
    // may HIWALAY pang "Pumili ng Mundo" na screen dito - TINANGGAL na,
    // nakalagay na lang ang pagpili ng Grassmap/Grassmap 2 sa MISMONG
    // taas ng Map Picker (isang pindot, hindi na dagdag na screen).
    openBuilderMapPicker(BUILDER_DEFAULT_PLACEMENT_WORLD, lotSize, lotName);
  };

  nextBtn.addEventListener("click", proceed);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      proceed();
    }
  });

  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);
  body.appendChild(actions);

  panel.appendChild(header);
  panel.appendChild(body);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  input.focus();
}

// =========================
// "MAP PICKER" - BUONG MAPA NA NAKA-ZOOM-OUT, PILIIN KUNG SAAN ILALAGAY
// =========================
//
// AYOS (hiling ng user: "dapat pag confirm is mag map na") - dating may
// hiwalay pang screen para pumili ng mundo bago ito - NASA LOOB NA ITO
// ngayon (mga buton sa itaas ng mapa), kaya DIRETSO na dito galing sa
// pangalanan-screen.
const BUILDER_DEFAULT_PLACEMENT_WORLD = "grassmap";

const BUILDER_PLACEMENT_WORLD_OPTIONS = [
  { id: "grassmap", label: "Grassmap" },
  { id: "grassmap2", label: "Grassmap 2" },
];

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
function openBuilderMapPicker(worldName, lotSize, lotName) {
  const bgImage = getBuilderMapPickerImage(worldName);
  const size = getBuilderWorldTileSize(worldName);

  if (!bgImage || !size) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("The map image is not ready yet - try again.");
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
    "<span>" +
    (lotName ? lotName + " - " : "") +
    "click where you want to build (" +
    BUILDER_EXTERIOR_TILES_WIDE +
    "x" +
    BUILDER_EXTERIOR_TILES_TALL +
    ")</span>";

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.className = "builder-panel-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => overlay.remove());
  header.appendChild(closeBtn);

  // AYOS (hiling ng user) - dito na ang pagpili ng mundo (dating
  // hiwalay na screen bago pa mapunta dito) - kapag ibang mundo ang
  // pinindot, muling binubuksan lang ang PAREHONG picker para sa
  // mundong iyon (dala pa rin ang lotSize/lotName).
  const worldTabs = document.createElement("div");

  worldTabs.className = "builder-panel-tabs";

  for (const option of BUILDER_PLACEMENT_WORLD_OPTIONS) {
    const worldBtn = document.createElement("button");

    worldBtn.type = "button";
    worldBtn.className = "builder-panel-tab-btn";
    worldBtn.textContent = option.label;
    worldBtn.classList.toggle("active", option.id === worldName);
    worldBtn.addEventListener("click", () => {
      if (option.id === worldName) return;

      overlay.remove();
      openBuilderMapPicker(option.id, lotSize, lotName);
    });

    worldTabs.appendChild(worldBtn);
  }

  const pickerCanvas = document.createElement("canvas");

  pickerCanvas.className = "builder-map-picker-canvas";

  panel.appendChild(header);
  panel.appendChild(worldTabs);
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
        BUILDER_EXTERIOR_TILES_WIDE,
        BUILDER_EXTERIOR_TILES_TALL,
      );

      pickerCtx.fillStyle = placeable ? "rgba(120, 230, 140, 0.5)" : "rgba(255, 80, 80, 0.5)";
      pickerCtx.strokeStyle = placeable ? "rgba(140, 255, 160, 0.95)" : "rgba(255, 100, 100, 0.95)";
      pickerCtx.lineWidth = 2;

      const boxX = hoverTile.col * TILE_SIZE * scale;
      const boxY = hoverTile.row * TILE_SIZE * scale;
      const boxW = BUILDER_EXTERIOR_TILES_WIDE * TILE_SIZE * scale;
      const boxH = BUILDER_EXTERIOR_TILES_TALL * TILE_SIZE * scale;

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

    if (
      !isBuilderFootprintFree(
        worldName,
        tile.col,
        tile.row,
        BUILDER_EXTERIOR_TILES_WIDE,
        BUILDER_EXTERIOR_TILES_TALL,
      )
    ) {
      if (typeof showFloatingMessage === "function") {
        showFloatingMessage("Something is blocking this spot - pick another location.");
      }
      return;
    }

    if (typeof goldCollected !== "undefined" && goldCollected < lotSize.price) {
      if (typeof showFloatingMessage === "function") showFloatingMessage("You do not have enough gold.");
      overlay.remove();
      return;
    }

    if (typeof goldCollected !== "undefined") goldCollected -= lotSize.price;

    customHouseIdCounter++;

    const house = {
      id: customHouseIdCounter,
      // AYOS (hiling ng user) - pangalan na inilagay sa unang screen ng
      // pagbili (openBuilderLotNameDialog) - nase-save kasama ng iba
      // pang detalye ng bahay (saveCustomHouses).
      name: sanitizeBuilderLotName(lotName),
      world: worldName,
      col: tile.col,
      row: tile.row,
      tilesWide: BUILDER_EXTERIOR_TILES_WIDE,
      tilesTall: BUILDER_EXTERIOR_TILES_TALL,
      interiorTilesWide: lotSize.interiorTilesWide,
      interiorTilesTall: lotSize.interiorTilesTall,
      price: lotSize.price,
      exteriorImageDataURL: null,
      interiorImageDataURL: null,
      doorPosition: BUILDER_DEFAULT_DOOR_POSITION,
    };

    customHouses.push(house);
    saveCustomHouses();

    overlay.remove();

    if (typeof syncHotbarUI === "function") syncHotbarUI();

    // AYOS (hiling ng user: "kapag mag lapat ako ng lots at malapag na sa
    // map lilipat yung tab sa building") - dating diretso sa Exterior
    // (door picker) ang bagong-lapag na Lot. AYOS ULIT (hiling ng user):
    // baligtad na ang daloy - Building STYLE (Coffee Shop/Tavern) muna
    // ang pinipili, SAKA lang Lot - kaya dito, ang Building panel ang
    // basta binubuksan (top-level, listahan ng STYLE), HINDI na diretso
    // sa isang partikular na Lot picker (mismong bagong-lapag na Lot na
    // ito ang lalabas mismo sa listahan ng Lot sa susunod na screen).
    builderPanelTab = "building";
    openBuilderPanel();

    // AYOS (hiling ng user): "wag mo na ipunta sa mismong map yung
    // character... puntahan ko na lang yung bahay after matapos yung
    // gusto ko kay Joseph, alisin mo na rin yung fade out and in" -
    // TINANGGAL na ang dating teleportPlayerToCustomHouse/fade - basta
    // manatili na lang ang player kung nasaan man siya (kasama ni
    // Joseph), lalapitan na lang niya mismo ang bahay balang araw.
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Built \"" + getCustomHouseName(house) + "\"!");
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

  // AYOS: dito na lang EXPLICIT binubura ang WORLDS entry ng interior
  // room nito (tingnan ang paliwanag sa unregisterCustomHouseDoors sa
  // itaas) - dito lang talaga dapat mangyari ito (TALAGANG binubuwag
  // na ang bahay), hindi sa bawat pag-re-register ng mga pintuan.
  if (typeof WORLDS !== "undefined") {
    delete WORLDS[getCustomHouseInteriorWorldName(house)];
  }

  saveCustomHouses();

  if (typeof syncHotbarUI === "function") syncHotbarUI();

  if (typeof showFloatingMessage === "function") {
    showFloatingMessage(
      "Sold \"" + getCustomHouseName(house) + "\" - +" + refund + " gold.",
    );
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
// INTERIOR WALL PADDING (hiling ng user): "yung interior is pwede bang
// gawin is yung 10x8 is walang collisions kumbaga mag add ka na lang
// ng 1 column left and right 2 row top and 1 row bottom para sa
// collisions...so magiging 12x11 laging 2 row sa taas tapos 1 row sa
// bottom" - dating ang loob mismo ng open/walkable na sukat
// (house.tilesWide x tilesTall) ay "kumakain" sa dulo (1-tile na pader
// sa 4 gilid, kaya 10x8 -> 8x6 na lang ang TALAGANG bukas) - ngayon,
// ang open/walkable na FLOOR ay eksaktong PAREHONG sukat pa rin ng
// Exterior (10x8 kung 10x8, hindi na binabawasan) - ang mga PADER ay
// IDINADAGDAG na lang SA LABAS nito bilang extra padding, kaya lumalaki
// ang TALAGANG interior room (12x11 kung 10x8 ang exterior).
// =========================
const BUILDER_INTERIOR_WALL_THICKNESS = { top: 2, bottom: 1, left: 1, right: 1 };

// { wide, tall } ng BUONG interior room (kasama na ang padding) - ang
// `tilesWide`/`tilesTall` dito ay ang OPEN/WALKABLE na sukat (parehong
// sukat ng Exterior Lot, house.tilesWide/tilesTall).
function getBuilderInteriorPaddedSize(tilesWide, tilesTall) {
  const T = BUILDER_INTERIOR_WALL_THICKNESS;

  return {
    wide: tilesWide + T.left + T.right,
    tall: tilesTall + T.top + T.bottom,
  };
}

// Ang notch/pintuan ng INTERIOR bilang TILE rectangle, sa PADDED na
// coordinate frame (0,0 sa itaas-kaliwa ng BUONG 12x11 na silid, hindi
// ng 10x8 na open area) - ang LALIM (depth) ng notch ay KASING KAPAL
// ng pader sa gilid na iyon (2 tile kung "top", 1 tile kung
// "bottom"/"left"/"right").
function getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition) {
  const { wall, doorWidth, startOffset } = getBuilderDoorwayInfo(
    tilesWide,
    tilesTall,
    doorPosition,
  );
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall);
  const T = BUILDER_INTERIOR_WALL_THICKNESS;

  if (wall === "top") {
    return { col: T.left + startOffset, row: 0, width: doorWidth, height: T.top };
  }
  if (wall === "bottom") {
    return {
      col: T.left + startOffset,
      row: padded.tall - T.bottom,
      width: doorWidth,
      height: T.bottom,
    };
  }
  if (wall === "left") {
    return { col: 0, row: T.top + startOffset, width: T.left, height: doorWidth };
  }

  // "right"
  return {
    col: padded.wide - T.right,
    row: T.top + startOffset,
    width: T.right,
    height: doorWidth,
  };
}

function getBuilderInteriorDoorAreaPx(tilesWide, tilesTall, doorPosition) {
  const rect = getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition);

  return {
    x: rect.col * TILE_SIZE,
    y: rect.row * TILE_SIZE,
    width: rect.width * TILE_SIZE,
    height: rect.height * TILE_SIZE,
  };
}

// INTERIOR - may padding (BUILDER_INTERIOR_WALL_THICKNESS), kaya ang
// TALAGANG bukas/walkable floor ay eksaktong PAREHO pa rin ng Exterior
// (tilesWide x tilesTall) - ang mga PADER (rects na ibinabalik nito)
// ay NASA LABAS/PALIGID lang ng open area na iyon.
function buildBuilderPerimeterWallRects(tilesWide, tilesTall, doorPosition) {
  const { wall } = getBuilderDoorwayInfo(tilesWide, tilesTall, doorPosition);
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall);
  const T = BUILDER_INTERIOR_WALL_THICKNESS;
  const doorRect = getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition);
  const rects = [];

  // ITAAS na pader (mga row 0 hanggang T.top-1) - buong lapad MALIBAN
  // kung dito ang pintuan.
  if (wall === "top") {
    if (doorRect.col > 0) {
      rects.push({ x: 0, y: 0, width: doorRect.col * TILE_SIZE, height: T.top * TILE_SIZE });
    }

    const rightStart = doorRect.col + doorRect.width;

    if (rightStart < padded.wide) {
      rects.push({
        x: rightStart * TILE_SIZE,
        y: 0,
        width: (padded.wide - rightStart) * TILE_SIZE,
        height: T.top * TILE_SIZE,
      });
    }
  } else {
    rects.push({ x: 0, y: 0, width: padded.wide * TILE_SIZE, height: T.top * TILE_SIZE });
  }

  // IBABANG pader (huling T.bottom na row) - buong lapad MALIBAN kung
  // dito ang pintuan.
  const bottomY = (padded.tall - T.bottom) * TILE_SIZE;

  if (wall === "bottom") {
    if (doorRect.col > 0) {
      rects.push({
        x: 0,
        y: bottomY,
        width: doorRect.col * TILE_SIZE,
        height: T.bottom * TILE_SIZE,
      });
    }

    const rightStart = doorRect.col + doorRect.width;

    if (rightStart < padded.wide) {
      rects.push({
        x: rightStart * TILE_SIZE,
        y: bottomY,
        width: (padded.wide - rightStart) * TILE_SIZE,
        height: T.bottom * TILE_SIZE,
      });
    }
  } else {
    rects.push({
      x: 0,
      y: bottomY,
      width: padded.wide * TILE_SIZE,
      height: T.bottom * TILE_SIZE,
    });
  }

  // KALIWANG pader (mga col 0 hanggang T.left-1) - buong taas MALIBAN
  // kung dito ang pintuan.
  if (wall === "left") {
    if (doorRect.row > 0) {
      rects.push({ x: 0, y: 0, width: T.left * TILE_SIZE, height: doorRect.row * TILE_SIZE });
    }

    const bottomStart = doorRect.row + doorRect.height;

    if (bottomStart < padded.tall) {
      rects.push({
        x: 0,
        y: bottomStart * TILE_SIZE,
        width: T.left * TILE_SIZE,
        height: (padded.tall - bottomStart) * TILE_SIZE,
      });
    }
  } else {
    rects.push({ x: 0, y: 0, width: T.left * TILE_SIZE, height: padded.tall * TILE_SIZE });
  }

  // KANANG pader (huling T.right na col) - buong taas MALIBAN kung
  // dito ang pintuan.
  const rightX = (padded.wide - T.right) * TILE_SIZE;

  if (wall === "right") {
    if (doorRect.row > 0) {
      rects.push({
        x: rightX,
        y: 0,
        width: T.right * TILE_SIZE,
        height: doorRect.row * TILE_SIZE,
      });
    }

    const bottomStart = doorRect.row + doorRect.height;

    if (bottomStart < padded.tall) {
      rects.push({
        x: rightX,
        y: bottomStart * TILE_SIZE,
        width: T.right * TILE_SIZE,
        height: (padded.tall - bottomStart) * TILE_SIZE,
      });
    }
  } else {
    rects.push({
      x: rightX,
      y: 0,
      width: T.right * TILE_SIZE,
      height: padded.tall * TILE_SIZE,
    });
  }

  return rects;
}

// =========================
// DYNAMIC NA INTERIOR WORLD (Blob URL na "tmj", tingnan ang paliwanag
// sa itaas ng file) - IISANG flat na larawan (ang uploaded interior
// PNG) ang buong background, may PADDED na pader (BUILDER_INTERIOR_WALL_THICKNESS)
// + notch/butas (Exit) sa PINILING pader ng exterior (house.doorPosition
// - iisa/pareho na lang ito ngayon para sa loob at labas ng bahay).
// `tilesWide`/`tilesTall` dito ay ang OPEN/WALKABLE na sukat (parehong
// sukat ng Exterior) - ang TALAGANG laki ng silid (kasama na ang
// padding) ay kinukuha sa getBuilderInteriorPaddedSize.
// =========================
function buildSyntheticInteriorTmj(tilesWide, tilesTall, doorPosition) {
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall);
  const rects = buildBuilderPerimeterWallRects(tilesWide, tilesTall, doorPosition);
  const objects = rects.map((rect, index) => ({ id: index + 1, ...rect }));

  return {
    width: padded.wide,
    height: padded.tall,
    tilewidth: TILE_SIZE,
    tileheight: TILE_SIZE,
    tilesets: [],
    layers: [
      {
        type: "tilelayer",
        name: "map",
        width: padded.wide,
        height: padded.tall,
        data: new Array(padded.wide * padded.tall).fill(0),
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

  // AYOS (hiling ng user: "ganun parin di parin pumapasok sa loob ng
  // room" - VERIFIED sa console error: "Walang mundong tinatawag na:
  // customHouse_9") - SANHI: dating dito rin binubura ang
  // `WORLDS[worldName]` - PERO tinatawag ito ni registerCustomHouseDoors
  // (sa ibaba) BAWAT beses na nagre-register ulit ng mga pintuan
  // (kasama ang NORMAL na landas: registerCustomHouseInteriorWorld
  // muna nagtatakda ng WORLDS[worldName] BAGO tumawag ng
  // registerCustomHouseDoors, na siya namang tumatawag DITO agad-agad
  // bilang unang hakbang - kaya AGAD nabubura ang WORLDS entry na
  // KAKAGAWA LANG, isang linya bago pa man ma-push ang mismong DOORS
  // na tumuturo roon!). Ito ang eksaktong dahilan kung bakit "Walang
  // mundong tinatawag na" - TAMANG paraan: itong function ay dapat
  // LINISIN LANG ang DOORS array (ang tunay na sadya nito, base sa
  // pangalan), HINDI galawin ang WORLDS - ang WORLDS[worldName] ay
  // dapat lang buburahin kapag TALAGANG binubuwag/ibinebenta na ang
  // bahay (tingnan ang sellCustomHouse sa ibaba, doon na lang ito
  // ginagawa nang EXPLICIT).
}

// Ang notch/pintuan (getBuilderDoorTileRect) bilang AREA sa PIXELS,
// naka-offset na papunta sa TALAGANG (colPx,rowPx) na posisyon nito sa
// mundo (o (0,0) para sa interior room, dahil laging sarili/simula sa
// itaas-kaliwa ang coordinate frame nito).
function getBuilderDoorAreaPx(colPx, rowPx, tilesWide, tilesTall, doorPosition) {
  const rect = getBuilderDoorTileRect(tilesWide, tilesTall, doorPosition);

  return {
    x: colPx + rect.col * TILE_SIZE,
    y: rowPx + rect.row * TILE_SIZE,
    width: rect.width * TILE_SIZE,
    height: rect.height * TILE_SIZE,
  };
}

// AYOS (hiling ng user: "di siya gumagalaw e di makaalis sa isang
// direction" - VERIFIED, MALAKING BUG): ang DATING bersyon nito ay
// basta direktang kinukuha ang "gustong posisyon ng collision box" AT
// itinatakda iyon NANG DIRETSO bilang `player.x`/`player.y` - PERO ang
// TALAGANG collision box ng player ay HINDI dokumentado sa parehong
// (x,y) na iyon: may SARILI itong proportional offset mula sa
// itaas-kaliwa ng sprite (tingnan ang getPlayerCollisionBox,
// collisions.js - ~50px ang pagkakaiba sa laki ng sprite na ito, 0.22x
// lang ng buong height ang collision box, nakadikit pa sa ILALIM). Ang
// resulta: NAKA-BAON ang player sa loob mismo ng pader sa sandaling
// mag-spawn (o pati sa LABAS ng buong mapa) - at kapag NAKA-BAON ka na
// sa isang collision box, HINDI ka na makakagalaw PALABAS nito
// (isa-isa lang sinusuri ang bawat hakbang ng galaw - `canMoveTo` -
// kaya kahit TALAGANG "papalayo" ang direksyon, tinatanggihan pa rin
// ito basta may KAHIT KAUNTING overlap pa - "nakakulong" ka na).
//
// AYOS: ginagaya na nito ang EKSAKTONG PARAAN ng getDoorExitSpawn
// (worlds.js, PROVEN na gumagana nang tama sa LAHAT ng ibang pintuan
// sa laro) - sinasampol muna ang TALAGANG offset ng collision box
// (getPlayerCollisionBox(0,0)), tapos "ibinabalik" (reverse) iyon para
// makuha ang TAMANG player.x/y na magreresulta sa GUSTONG posisyon ng
// collision box - GENERALIZED lang ito para gumana sa kahit anong
// pader (top/left/bottom/right), hindi lang sa "bottom" (na siya lang
// TALAGANG suportado ng orihinal na getDoorExitSpawn).
// Ang PUSO ng kalkulasyon (tingnan ang paliwanag sa itaas ng lumang
// getBuilderDoorSpawnPx) - hiniwalay bilang generic na function na
// tumatanggap na LANG ng eksaktong `area` (pixels) + `wall` - kaya
// puwede na itong gamitin ng EXTERIOR (walang padding) AT ng INTERIOR
// (may WALL PADDING na, tingnan ang BUILDER_INTERIOR_WALL_THICKNESS
// sa ibaba) - iisa/pareho lang ang core na matematika, iba lang ang
// `area` na ipinapasa.
function getBuilderSpawnPxForDoorArea(area, wall, direction) {
  const outward = direction === "outward";

  const sampleBox =
    typeof getPlayerCollisionBox === "function"
      ? getPlayerCollisionBox(0, 0)
      : { x: 0, y: 0, width: 0, height: 0 };

  const wallIsVertical = wall === "top" || wall === "bottom";
  const outwardSign = wall === "bottom" || wall === "right" ? 1 : -1;
  const effectiveSign = outward ? outwardSign : -outwardSign;
  const CLEARANCE_PX = 2;

  if (wallIsVertical) {
    const boxHeight = sampleBox.height;
    const areaEdgeY = effectiveSign > 0 ? area.y + area.height : area.y;
    const boxMinY =
      effectiveSign > 0
        ? areaEdgeY + CLEARANCE_PX
        : areaEdgeY - CLEARANCE_PX - boxHeight;
    const desiredCenterX = area.x + area.width / 2;

    return {
      x: Math.round(desiredCenterX - sampleBox.width / 2 - sampleBox.x),
      y: Math.round(boxMinY - sampleBox.y),
    };
  }

  const boxWidth = sampleBox.width;
  const areaEdgeX = effectiveSign > 0 ? area.x + area.width : area.x;
  const boxMinX =
    effectiveSign > 0
      ? areaEdgeX + CLEARANCE_PX
      : areaEdgeX - CLEARANCE_PX - boxWidth;
  const desiredCenterY = area.y + area.height / 2;

  return {
    x: Math.round(boxMinX - sampleBox.x),
    y: Math.round(desiredCenterY - sampleBox.height / 2 - sampleBox.y),
  };
}

// EXTERIOR - walang padding, iisang tile lang ang notch (kagaya ng
// dati).
function getBuilderDoorSpawnPx(colPx, rowPx, tilesWide, tilesTall, doorPosition, direction) {
  const area = getBuilderDoorAreaPx(colPx, rowPx, tilesWide, tilesTall, doorPosition);
  const { wall } = getBuilderDoorwayInfo(tilesWide, tilesTall, doorPosition);

  return getBuilderSpawnPxForDoorArea(area, wall, direction);
}

// INTERIOR - MAY PADDING (BUILDER_INTERIOR_WALL_THICKNESS) - `tilesWide`/
// `tilesTall` dito ay ang OPEN/WALKABLE na sukat (parehong sukat ng
// Exterior), HINDI ang buong padded na silid.
function getBuilderInteriorDoorSpawnPx(tilesWide, tilesTall, doorPosition, direction) {
  const area = getBuilderInteriorDoorAreaPx(tilesWide, tilesTall, doorPosition);
  const { wall } = getBuilderDoorwayInfo(tilesWide, tilesTall, doorPosition);

  return getBuilderSpawnPxForDoorArea(area, wall, direction);
}

function registerCustomHouseDoors(house) {
  if (!house.interiorImageDataURL) return;

  const worldName = getCustomHouseInteriorWorldName(house);

  unregisterCustomHouseDoors(house);

  const exteriorColPx = house.col * TILE_SIZE;
  const exteriorRowPx = house.row * TILE_SIZE;

  // PAPASOK - jalan/tapak sa may pintuan ng exterior (kahit anong
  // pader/posisyon pa ang piniling - house.doorPosition).
  DOORS.push({
    world: house.world,
    area: getBuilderDoorAreaPx(
      exteriorColPx,
      exteriorRowPx,
      house.tilesWide,
      house.tilesTall,
      house.doorPosition,
    ),
    to: worldName,
    // AYOS (hiling ng user: "kung ano ng laki ng exterior ganun na din
    // lakalaki...kung bottom center yung napili automatic na bottom
    // center na rin sa interior") - ang loob ng bahay ay PAREHONG-
    // PAREHONG sukat AT posisyon ng pintuan ng EXTERIOR na rin
    // (house.tilesWide/tilesTall/doorPosition) - WALA nang hiwalay na
    // pinipiling laki/posisyon para sa interior, kaya laging tugma ito
    // sa TALAGANG hitsura ng bahay mula sa labas. AYOS ULIT: gumagamit
    // na ito ng PADDED na interior spawn (getBuilderInteriorDoorSpawnPx,
    // may extra na pader sa paligid, tingnan ang
    // BUILDER_INTERIOR_WALL_THICKNESS) sa halip na yung EXTERIOR
    // (unpadded) na bersyon.
    spawn: getBuilderInteriorDoorSpawnPx(
      house.interiorTilesWide,
      house.interiorTilesTall,
      house.doorPosition,
      "inward",
    ),
    label: "Enter",
    // AYOS (hiling ng user: "gusto ko sana is napipindut din or press
    // e para mapasok sa interior room tapos yung labasan is...need din
    // press 'e'") - dating "auto: true" ito (awtomatikong papasok sa
    // sandaling madaanan, walang kailangang pindutin) - PAREHONG-
    // PAREHO na ngayon ito ng ibang E-triggered na interaksyon sa laro
    // (Crafter/Stove/Oldman/atbp, update.js/worlds.js) - kailangan nang
    // TALAGANG NAKAHARAP ang player sa pintuan (isPlayerFacingWorldPoint,
    // getDoorUnderPlayer) AT pindutin ang "E" (lalabas ang "E - Enter"
    // na paalala sa ibaba ng screen, drawDoorPrompt - AYOS ULIT hiling
    // ng user: "igaya mo dun sa iba na enter" - PAREHONG "Enter"/"Exit"
    // label ng ibang bahay sa laro, worlds.js, sa halip na Tagalog).
    auto: false,
  });

  // PALABAS - jalan sa may pintuan (notch) sa loob ng silid - PAREHONG
  // pader/posisyon (house.doorPosition) at sukat (house.tilesWide/
  // tilesTall) ng EXTERIOR na rin, dahil PAREHONG-PAREHO na ngayon ang
  // laki/posisyon ng loob at labas ng bahay - PERO ang notch/butas
  // mismo ay nasa PADDED na coordinate frame (getBuilderInteriorDoorAreaPx,
  // may extra na pader sa paligid).
  DOORS.push({
    world: worldName,
    area: getBuilderInteriorDoorAreaPx(house.interiorTilesWide, house.interiorTilesTall, house.doorPosition),
    to: house.world,
    // Palabas sa EXTERIOR pintuan mismo (house.doorPosition), 1.5 tile
    // palabas ng footprint - GARANTISADONG hindi agad ma-re-trigger
    // ulit ang papasok na DOORS entry sa itaas.
    spawn: getBuilderDoorSpawnPx(
      exteriorColPx,
      exteriorRowPx,
      house.tilesWide,
      house.tilesTall,
      house.doorPosition,
      "outward",
    ),
    label: "Exit",
    // Kaparehong-pareho ng paliwanag sa itaas ng "Enter" - "E" na rin
    // ang kailangan para lumabas, hindi na basta madaanan lang ang
    // pintuan (notch) sa loob ng silid.
    auto: false,
  });
}

function registerCustomHouseInteriorWorld(house) {
  if (!house.interiorImageDataURL) return;
  if (typeof WORLDS === "undefined") return;

  const worldName = getCustomHouseInteriorWorldName(house);
  // AYOS (hiling ng user): PAREHONG sukat (tilesWide/tilesTall) AT
  // posisyon ng pintuan (doorPosition) ng EXTERIOR na rin ang gamit
  // dito - wala nang hiwalay na "interiorTilesWide/Tall/DoorPosition".
  const tmj = buildSyntheticInteriorTmj(house.interiorTilesWide, house.interiorTilesTall, house.doorPosition);
  const blob = new Blob([JSON.stringify(tmj)], { type: "application/json" });
  const blobUrl = URL.createObjectURL(blob);

  WORLDS[worldName] = {
    url: blobUrl,
    outdoor: false,
    // AYOS: PAREHONG-PAREHO na ngayon ito ng "papasok" na spawn sa
    // registerCustomHouseDoors (getBuilderInteriorDoorSpawnPx, "inward")
    // - ito lang ang ginagamit bilang FALLBACK (hal. pag-restore ng
    // save na direktang naka-load na dito, walang dinaanang DOORS
    // trigger).
    spawn: getBuilderInteriorDoorSpawnPx(house.interiorTilesWide, house.interiorTilesTall, house.doorPosition, "inward"),
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
// notch/tile kung saan dapat ang pintuan, PAREHONG kalkulasyon ng
// getBuilderDoorAreaPx/getBuilderDoorwayInfo - GARANTISADONG magtutugma ito sa
// TALAGANG bukas/walang-collision na butas ng bahay/silid) - isang
// guide LANG ito, dapat "burahin"/gawing transparent (o guhitan ng
// bukas na pintuan) ng manlalaro sa mismong pixel editor bago
// i-export/i-upload pabalik.
//
// AYOS (hiling ng user): "yung door guide is dapat may 3 selection ng
// door like left bottom, center bottom, right bottom" - tumatanggap na
// ito ngayon ng `doorPosition` (galing sa renderBuilderDoorPicker sa
// ibaba, "center" kung wala/hindi ibinigay - PAREHONG-PAREHO ng dating
// FIXED na gawi).
//
// AYOS (hiling ng user): "yung template niya is dapat na dowdownload
// din sa mobile version" - PAREHONG isyu ng exportSaveSlot/
// exportSaveSlotViaNativeShare (tingnan ang settings-menu.js): sa loob
// ng naka-install na APK (Capacitor NATIVE), WALANG naka-kabit na
// "download manager" sa data:/blob: URL na ginagamit ng `<a download>`
// - kaya TAHIMIK lang itong nabibigo doon (walang error, pero walang
// file na lalabas). Kapag TALAGANG naka-install na APK ito
// (isRunningAsNativeCapacitorApp), gamitin na lang ang Filesystem+
// Share NATIVE plugin sa halip (tingnan ang
// exportBuilderTemplateViaNativeShare sa ibaba) - PAREHONG-PAREHONG
// paraan ng save-export, pero PNG (binary/base64) sa halip na JSON
// (utf8). Sa TUNAY na browser (walang Capacitor), PAREHONG-PAREHO pa
// rin ang dating `<a download>` na paraan (ginawang Blob na lang sa
// halip na direktang data: URL bilang href, mas maaasahan sa ibang
// browser).
// AYOS (hiling ng user - naka-attach na larawan na may bughaw na
// border sa 4 na gilid + pink/pulang notch sa ibaba): "sa mga template
// lagyan mo ng collisions lahat ng gilid base mo sa image na naka
// attached" - dagdag na BUGHAW na guide (hindi lang ang pulang
// pintuan) na EKSAKTONG kumukuha sa TALAGANG collision shape na
// ginagamit ng laro (parehong function, hindi hiwalay na guhit lang -
// GARANTISADONG magkatugma) - depende sa `kind`:
//   - "interior": manipis na 1-tile na PADER LANG sa 4 gilid
//     (buildBuilderPerimeterWallRects) - BUKAS ang loob (parehong-
//     pareho ng larawang in-attach ng user).
//   - "exterior" (default): BUONG footprint MINUS ang notch
//     (getBuilderFootprintCollisionBoxes) - halos LAHAT ay solid dito
//     (buong bahay ito mula sa LABAS, hindi lang manipis na pader),
//     kaya mas malaki ang bughaw na lugar kumpara sa interior.
function downloadBuilderTemplate(tilesWide, tilesTall, doorPosition, kind) {
  // AYOS (hiling ng user: "yung interior is...mag add ka na lang ng 1
  // column left and right 2 row top and 1 row bottom para sa
  // collisions...magiging 12x11") - `tilesWide`/`tilesTall` dito ay
  // LAGING ang OPEN/WALKABLE na sukat (parehong Exterior Lot) - para
  // sa "interior", ang TALAGANG canvas/PNG na kailangang i-download
  // ay ang PADDED na sukat (may extra na pader sa paligid), HINDI
  // ang open size mismo.
  const isInterior = kind === "interior";
  const canvasSize = isInterior
    ? getBuilderInteriorPaddedSize(tilesWide, tilesTall)
    : { wide: tilesWide, tall: tilesTall };

  const templateCanvas = document.createElement("canvas");

  templateCanvas.width = canvasSize.wide * TILE_SIZE;
  templateCanvas.height = canvasSize.tall * TILE_SIZE;

  const templateCtx = templateCanvas.getContext("2d");

  const collisionRects = isInterior
    ? buildBuilderPerimeterWallRects(tilesWide, tilesTall, doorPosition)
    : getBuilderExteriorCollisionBoxes(0, 0, tilesWide, tilesTall, doorPosition);

  templateCtx.fillStyle = "rgba(40, 110, 220, 0.45)";
  templateCtx.strokeStyle = "rgba(20, 70, 180, 0.9)";
  templateCtx.lineWidth = 1;

  for (const rect of collisionRects) {
    templateCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
    templateCtx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
  }

  // Blangko/transparent ang natitirang bahagi ng canvas - MALIBAN sa
  // guide marker ng pintuan sa ibaba (kahit anong pader/posisyon pa
  // ang piniling) - PADDED na coordinate frame (getBuilderInteriorDoorAreaPx)
  // para sa interior, EXTERIOR (unpadded, getBuilderDoorAreaPx) naman
  // kung hindi.
  const doorArea = isInterior
    ? getBuilderInteriorDoorAreaPx(tilesWide, tilesTall, doorPosition)
    : getBuilderDoorAreaPx(0, 0, tilesWide, tilesTall, doorPosition);

  templateCtx.fillStyle = "rgba(255, 80, 80, 0.35)";
  templateCtx.fillRect(doorArea.x, doorArea.y, doorArea.width, doorArea.height);

  templateCtx.strokeStyle = "rgba(255, 40, 40, 0.9)";
  templateCtx.lineWidth = 1;
  templateCtx.strokeRect(
    doorArea.x + 0.5,
    doorArea.y + 0.5,
    doorArea.width - 1,
    doorArea.height - 1,
  );

  const safeDoorPosition = migrateBuilderDoorPositionId(doorPosition);
  const fileName =
    "template_" +
    (isInterior ? "interior_" : "exterior_") +
    canvasSize.wide * TILE_SIZE +
    "x" +
    canvasSize.tall * TILE_SIZE +
    "_" +
    safeDoorPosition +
    ".png";
  const dataUrl = templateCanvas.toDataURL("image/png");

  if (
    typeof isRunningAsNativeCapacitorApp === "function" &&
    isRunningAsNativeCapacitorApp() &&
    window.Capacitor?.Plugins?.Filesystem &&
    window.Capacitor?.Plugins?.Share
  ) {
    exportBuilderTemplateViaNativeShare(fileName, dataUrl);
    return;
  }

  // AYOS (hiling ng user: "pag upload ng exterior at interior gamit yung
  // mobile version...dapat nakakapag download din ng template" - AT
  // "dapat direkta sa download folder ng mobile phone") - ang
  // Capacitor-native na sanga sa itaas ay para lang sa NAKA-INSTALL na
  // APK. Para naman sa ORDINARYONG mobile BROWSER (hindi naka-install
  // na app): sa Android Chrome, ang dating `<a download>` sa ibaba ay
  // TALAGA nang DIREKTANG nagsa-save sa Downloads folder (walang dialog/
  // share sheet) - kaya HUWAG nang idaan pa sa Web Share doon (dagdag na
  // hakbang lang na hindi naman kailangan). Sa iOS Safari lang talaga
  // KAILANGAN ang Web Share (`navigator.share`) bilang fallback - dahil
  // hindi maaasahan doon ang `<a download>` (madalas basta BUKSAN/
  // ipakita na lang ang larawan sa halip na i-download).
  const isIOS =
    typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent || "");

  if (isIOS) {
    try {
      const base64ForShare = dataUrl.split(",")[1];
      const byteCharsForShare = atob(base64ForShare);
      const shareBytes = new Uint8Array(byteCharsForShare.length);

      for (let i = 0; i < byteCharsForShare.length; i++) {
        shareBytes[i] = byteCharsForShare.charCodeAt(i);
      }

      const shareFile = new File([shareBytes], fileName, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [shareFile] }) &&
        navigator.share
      ) {
        navigator
          .share({ files: [shareFile], title: "Template" })
          .then(() => {
            if (typeof showFloatingMessage === "function") {
              showFloatingMessage("Choose where to save/send the Template. 📤");
            }
          })
          .catch((error) => {
            // "AbortError" - kinansela lang ng user ang share sheet,
            // hindi talaga error - huwag nang tumira ng "hindi ma-
            // download" na mensahe dito.
            if (error?.name === "AbortError") return;

            if (typeof showFloatingMessage === "function") {
              showFloatingMessage("Could not download the Template. 😕");
            }
          });
        return;
      }
    } catch (err) {
      // Walang suporta o may error sa Web Share (hal. hindi secure
      // context/HTTPS) - tuloy lang sa dating `<a download>` sa ibaba.
    }
  }

  try {
    const base64 = dataUrl.split(",")[1];
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Could not download the Template. 😕");
    }
  }
}

// Ang NATIVE APK na bersyon ng download (tingnan ang paliwanag sa
// itaas ng downloadBuilderTemplate) - isinusulat muna ang PNG
// (base64) sa Directory.Cache ng app, tapos ang Android SHARE SHEET
// mismo ang bahalang magpakita kung saan/paano ito talaga
// ise-save/ipadala ng user (Files, Google Drive, Messenger, atbp.).
// AYOS (hiling ng user: "dapat direkta sa download folder ng mobile
// phone") - dating basta Cache directory + Share dialog agad ang tanging
// paraan (kailangan pang mano-manong i-tap ang "Save"/piliin kung saan).
// NARESEARCH: MAY paraan talaga para TUNAY na direktang mai-save sa
// pampublikong Downloads folder nang WALANG anumang dialog/tap - ang
// `Directory.ExternalStorage` ng Capacitor Filesystem plugin (na
// TUMUTUKOY sa storage root, kaya "Download/<filename>" bilang path ay
// TALAGANG napupunta sa Downloads) - PERO LIMITADO lang ito sa Android 9
// pababa (scoped storage na ang Android 10+, hindi na ito accessible -
// opisyal na dokumentado ng Capacitor mismo). Kaya SINUSUBUKAN muna ito
// FIRST (direkta, walang dialog, gagana sa mas lumang device) - kapag
// nabigo (mas modernong Android, walang access dito), FALLBACK sa dating
// Cache + Share dialog (isang tap lang naman doon, "Save"/"Downloads" -
// ito na talaga ang OPISYAL na paraan ng Android para makapag-save sa
// Downloads mula sa isang app sa ilalim ng scoped storage, kailangan
// talaga ng Storage Access Framework/MediaStore na hindi kayang gawin ng
// stock Filesystem plugin nang walang dagdag pang NATIVE (Java/Kotlin)
// na code - wala tayong access dito mula sa plain JS/web layer).
async function exportBuilderTemplateViaNativeShare(fileName, dataUrl) {
  const { Filesystem, Share } = window.Capacitor.Plugins;
  const base64 = dataUrl.split(",")[1];

  try {
    await Filesystem.writeFile({
      path: "Download/" + fileName,
      data: base64,
      directory: "EXTERNAL_STORAGE",
    });

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Saved to your Downloads folder! 📥");
    }

    return;
  } catch (directSaveError) {
    // Malamang mas modernong Android (10+, scoped storage) - hindi
    // accessible ang EXTERNAL_STORAGE - tuloy sa Share fallback sa ibaba.
  }

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: "CACHE",
    });

    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: "CACHE",
    });

    await Share.share({
      title: "Save the Template",
      dialogTitle: "Where do you want to save/send the Template? (Choose \"Files\"/\"Downloads\" to go straight to your Downloads folder)",
      url: uri,
    });

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Choose \"Save\"/\"Downloads\" to go straight to your Downloads folder. 📤");
    }
  } catch (error) {
    // "Share cancelled" (kinansela lang ng user ang share sheet, hindi
    // talaga error) - huwag nang tumira ng "hindi ma-download" na
    // mensahe dito, para hindi nakakalito.
    const message = String(error?.message || error || "");

    if (/cancel/i.test(message)) return;

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Could not download the Template. 😕");
    }
  }
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
            "Wrong image size.\n\nRequired: " +
              requiredWidthPx +
              "x" +
              requiredHeightPx +
              " px\nUploaded: " +
              img.naturalWidth +
              "x" +
              img.naturalHeight +
              " px",
          );
          return;
        }

        onSuccess(dataUrl);
      };

      img.onerror = () => alert("Could not open that image - make sure it is a PNG file.");
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

// `afterOpen` (opsyonal) - tinatawag na dala ang BODY element sa
// sandaling bukas na ang panel - ginagamit ng "guided" na daloy ng
// pagbili (hiling ng user: pagkalapag sa mapa -> DIRETSO sa Exterior,
// pagka-upload ng Exterior -> DIRETSO sa Interior) para hindi na
// kailangan pang manwal na hanapin ang bahay sa listahan.
function openBuilderPanel(afterOpen) {
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
    { id: "building", label: "Building" },
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

  if (typeof afterOpen === "function") afterOpen(body);
}

function renderBuilderPanelBody(body) {
  body.innerHTML = "";

  if (builderPanelTab === "lots") renderBuilderLotsTab(body);
  else if (builderPanelTab === "building") renderBuilderBuildingTab(body);
  else if (builderPanelTab === "exterior") renderBuilderExteriorTab(body);
  else if (builderPanelTab === "interior") renderBuilderInteriorTab(body);
  else renderBuilderSellTab(body);
}

function renderBuilderLotsTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Choose a Lot size - then click where you want to build it on the Grassmap (anywhere, as long as nothing is in the way). The Exterior size is the same (" +
    BUILDER_EXTERIOR_TILES_WIDE +
    "x" +
    BUILDER_EXTERIOR_TILES_TALL +
    " tiles) for EVERY size - what differs is the ROOM SIZE (Interior) - the higher the price, the bigger the room inside, even though the outside looks the same.";
  body.appendChild(intro);

  for (const lot of BUILDER_LOT_SIZES) {
    const row = document.createElement("div");

    row.className = "builder-lot-row";

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent =
      lot.label + " (Interior " + lot.interiorTilesWide + "x" + lot.interiorTilesTall + " tiles)";

    const padded = getBuilderInteriorPaddedSize(lot.interiorTilesWide, lot.interiorTilesTall);

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";
    sub.textContent =
      "Exterior: " +
      BUILDER_EXTERIOR_TILES_WIDE * TILE_SIZE +
      "x" +
      BUILDER_EXTERIOR_TILES_TALL * TILE_SIZE +
      " px (fixed) • Interior Template: " +
      padded.wide * TILE_SIZE +
      "x" +
      padded.tall * TILE_SIZE +
      " px (" +
      padded.wide +
      "x" +
      padded.tall +
      " tiles, walls included)";

    label.appendChild(sub);

    const buyBtn = document.createElement("button");

    buyBtn.type = "button";
    buyBtn.className = "builder-buy-btn";
    buyBtn.textContent = "🪙" + lot.price;
    // AYOS (hiling ng user) - PANGALAN muna bago ang mapa.
    buyBtn.addEventListener("click", () => openBuilderLotNameDialog(lot));

    row.appendChild(label);
    row.appendChild(buyBtn);
    body.appendChild(row);
  }
}

// AYOS (hiling ng user): "gusto ko kapag may lots na lilitaw din sa
// list ng exterior yung lots na nabili imbis na description lagay is
// list na lang parang sa lots...click ng lots na yun is lalabas yung
// template niya kung san banda ilalagay yung mismong door...pagka
// confirm is mawawala yung list ng template mapapalitan ng napili mong
// template tapos dun mo na i upload" - SIMPLENG LISTAHAN ito (parang
// ang Lots tab), buong ROW ang pwedeng i-click.
//
// AYOS ULIT (hiling ng user): "sa interior naman kasi dapat nga hindi
// na mamimili ng tiles width at layo ng sa interior e dapat kung ano
// ng laki ng exterior ganun na din lakalaki...alisin mo na yung parang
// pilian ng tiles dapat automatic na click lang yung exterior na bahay
// tapos meron na dun upload...alisin mo na pala yung template" - kaya
// MAGKAIBA na ngayon ang gawi ng dalawang `kind`:
//   - EXTERIOR: i-click ang row -> diretso sa Door Picker
//     (renderBuilderDoorPicker, 12 posisyon) - dito PINIPILI ang sukat
//     (mula sa Lot) AT ang posisyon ng pintuan.
//   - INTERIOR: WALA nang sarili pang sukat/posisyon ng pintuan na
//     pinipili (AWTOMATIKONG kinukuha na lang ito mula sa EXTERIOR -
//     house.tilesWide/tilesTall/doorPosition, tingnan ang
//     registerCustomHouseInteriorWorld) - i-click ang row, DIRETSO nang
//     bubukas ang Upload dialog (kaparehong eksaktong sukat ng
//     Exterior Template mo, kaya puwede mo nang muling gamitin ang
//     PAREHONG na-download mong Template doon).
function renderBuilderHouseList(body, kind) {
  if (customHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent = "You do not have a Lot yet - buy one in the 'Lots' tab first.";
    body.appendChild(empty);
    return;
  }

  for (const house of customHouses) {
    const row = document.createElement("div");

    row.className = "builder-lot-row builder-lot-row-clickable";
    row.tabIndex = 0;
    row.setAttribute("role", "button");

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    // AYOS (hiling ng user) - PANGALAN na ang pangunahing label ngayon
    // (mas madaling makilala kaysa "10x8 Lot (grassmap)" na pare-pareho
    // ang itsura sa lahat) - nasa maliit na linya sa ibaba na lang ang
    // sukat/mundo.
    label.textContent = getCustomHouseName(house);

    const where = document.createElement("div");

    where.className = "builder-lot-sub";
    where.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ")";
    label.appendChild(where);

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";

    if (kind === "exterior") {
      sub.textContent = house.exteriorImageDataURL
        ? "May Exterior na (" +
          getBuilderDoorPositionDef(house.doorPosition).label +
          ") - i-click para baguhin."
        : "No Exterior yet - click to choose the door and upload.";
    } else {
      const padded = getBuilderInteriorPaddedSize(house.interiorTilesWide, house.interiorTilesTall);

      sub.textContent = house.interiorImageDataURL
        ? "Has an Interior (" +
          padded.wide +
          "x" +
          padded.tall +
          " tiles, extra walls) - click to replace."
        : "No Interior yet - click to download the Template (" +
          padded.wide +
          "x" +
          padded.tall +
          " tiles) and upload.";
    }

    label.appendChild(sub);
    row.appendChild(label);

    const openRow = () => {
      if (kind === "exterior") {
        renderBuilderDoorPicker(
          body,
          house,
          "exterior",
          house.tilesWide,
          house.tilesTall,
          () => renderBuilderPanelBody(body),
        );
        return;
      }

      // INTERIOR - dahil MAY EXTRA PADER na ngayon SA PALIGID ng open
      // area (BUILDER_INTERIOR_WALL_THICKNESS), MAS MALAKI na ang
      // TALAGANG kailangang i-upload na PNG kaysa sa Exterior mismo -
      // kaya kailangan pa rin ng sariling Template (screen) dito,
      // pero WALA nang hiwalay na PIPILIING sukat/posisyon ng pintuan
      // (AWTOMATIKONG mula sa Exterior na lang, tingnan ang
      // renderBuilderInteriorUploadScreen).
      renderBuilderInteriorUploadScreen(body, house, () => renderBuilderPanelBody(body));
    };

    row.addEventListener("click", openRow);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRow();
      }
    });

    body.appendChild(row);
  }
}

// AYOS (hiling ng user): "yung interior is pwede bang gawin is yung
// 10x8 is walang collisions...mag add ka na lang ng 1 column left and
// right 2 row top and 1 row bottom para sa collisions...tapos yung
// template ganun na?" - simpleng screen ito (walang picker) na
// nagpapakita ng AWTOMATIKONG PADDED na sukat (getBuilderInteriorPaddedSize,
// base sa house.tilesWide/tilesTall + BUILDER_INTERIOR_WALL_THICKNESS)
// - may "Template" (i-download ang PADDED/mas malaking canvas, may
// guide) at "Upload" na buton.
function renderBuilderInteriorUploadScreen(body, house, onBack) {
  body.innerHTML = "";

  const padded = getBuilderInteriorPaddedSize(house.interiorTilesWide, house.interiorTilesTall);
  const def = getBuilderDoorPositionDef(house.doorPosition);
  const T = BUILDER_INTERIOR_WALL_THICKNESS;

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Awtomatikong " +
    padded.wide +
    "x" +
    padded.tall +
    " tiles (" +
    padded.wide * TILE_SIZE +
    "x" +
    padded.tall * TILE_SIZE +
    " px is needed - " +
    house.interiorTilesWide +
    "x" +
    house.interiorTilesTall +
    " OPEN floor (based on your Lot size) + " +
    T.left +
    " column of wall on the left, " +
    T.right +
    " on the right, " +
    T.top +
    " row(s) on top, " +
    T.bottom +
    " row on the bottom. Door: " +
    def.label +
    " (same as chosen for the Exterior). Download the Template, draw the inside of your house (open in the middle, walls/guide only around the edge), then Upload it.";
  body.appendChild(intro);

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => onBack());

  const downloadBtn = document.createElement("button");

  downloadBtn.type = "button";
  downloadBtn.className = "builder-secondary-btn";
  downloadBtn.textContent = "Template";
  downloadBtn.addEventListener("click", () => {
    downloadBuilderTemplate(house.interiorTilesWide, house.interiorTilesTall, house.doorPosition, "interior");
  });

  const uploadBtn = document.createElement("button");

  uploadBtn.type = "button";
  uploadBtn.className = "builder-buy-btn";
  uploadBtn.textContent = "Upload";
  uploadBtn.addEventListener("click", () => {
    promptBuilderImageUpload(
      padded.wide * TILE_SIZE,
      padded.tall * TILE_SIZE,
      (dataUrl) => {
        // Store the image in its own asset key (see "IMAGE ASSET STORE"
        // above) instead of inline on the house - this is what stops
        // repeated Saves from multiplying the image data. If storage is
        // full, saveBuilderAsset() already shows an error and returns
        // null - keep whatever image the house already had rather than
        // losing it.
        const assetId = saveBuilderAsset(dataUrl);

        if (assetId) {
          const oldAssetId = house.interiorAssetId;

          house.interiorAssetId = assetId;
          house.interiorImageDataURL = dataUrl;
          // Manually uploading now, in a Custom capacity - clear any
          // Building-template tag (user request) so the house list no
          // longer shows this as e.g. "Built as Coffee Shop" once its art
          // has actually been replaced with something else.
          delete house.templateId;
          if (oldAssetId && oldAssetId !== assetId) deleteBuilderAsset(oldAssetId);
        }

        delete customHouseInteriorImages[house.id];
        ensureCustomHouseImagesLoaded(house);
        saveCustomHouses();
        closeBuilderPanel();

        if (assetId && typeof showFloatingMessage === "function") {
          showFloatingMessage("Interior uploaded! You can now enter the house.");
        }
      },
    );
  });

  actions.appendChild(backBtn);
  actions.appendChild(downloadBtn);
  actions.appendChild(uploadBtn);
  body.appendChild(actions);
}

// =========================
// BUILDING TAB (user request) - pick a ready-made template (Coffee Shop,
// Tavern, ...) and it's applied instantly, both Exterior AND Interior at
// once - no manual upload. Exterior/Interior tabs still exist separately
// for players who want to draw their own custom design instead.
// =========================
// =========================
// BUILDING TAB (hiling ng user: "kahit wala pang lots naka appear na dun
// yung mga building tapos click lang yung isa don tapos may list ng lots
// kung ano ng nabiling property lots pipili kung san tapos may confirm") -
// Coffee Shop/Tavern ang UNANG makikita (kahit WALANG Lot ang manlalaro),
// pinipili MUNA ang STYLE, TAPOS lang pinipili kung SAAN (alin sa mga
// Lot na tugma ang laki) ilalagay - baligtad sa dating Lot-muna-bago-
// Building na daloy.
// =========================

// Max na bilang ng bawat Building type na pwedeng itayo NANG SABAY (hiling
// ng user: "max 2 lang ang meron kada building na parehas like 2 coffee
// shop tapos 2 tavern") - PAREHONG-PAREHO ang limitasyon sa LAHAT ng
// template sa ngayon, kaya isang shared constant na lang - kung sakaling
// kailanganin ng ibang limitasyon kada template balang araw, magdagdag na
// lang ng sariling `maxCount` field sa BUILDER_BUILDING_TEMPLATES entry at
// gamitin iyon dito bilang fallback sa halip nito.
const BUILDER_TEMPLATE_MAX_COUNT = 2;

// Bilang ng bahay na TALAGANG naka-set sa template na ito NGAYON - LIVE
// itong kinukuwenta mula mismo sa `customHouses` (hindi hiwalay na
// counter na dapat pang i-update nang mano-mano) - kaya AWTOMATIKONG
// tama ito kapag nagbenta/nagpalit ng style ang manlalaro (isang slot
// agad na "napalaya" sa lumang template, isa namang "naubos" sa bago).
function getBuilderTemplateBuiltCount(template) {
  return customHouses.filter((house) => house.templateId === template.id).length;
}

// Screen 1 - listahan ng mga Building STYLE (Coffee Shop, Tavern, ...) -
// nakikita KAHIT WALANG Lot pa ang manlalaro (hiling ng user) - ang
// pagkakaroon (o wala) ng tugmang Lot ay tsinetsek na lang sa SUSUNOD na
// screen (renderBuilderTemplateLotPicker), hindi dito.
function renderBuilderBuildingTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Pick a Building style below - then choose which of your Lots to put it on. Both the Exterior and Interior are applied instantly, no drawing/uploading needed. Prefer to design your own instead? Use the Exterior/Interior tabs.";
  body.appendChild(intro);

  if (BUILDER_BUILDING_TEMPLATES.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent = "No Building styles are available yet.";
    body.appendChild(empty);
    return;
  }

  for (const template of BUILDER_BUILDING_TEMPLATES) {
    const builtCount = getBuilderTemplateBuiltCount(template);
    const atMax = builtCount >= BUILDER_TEMPLATE_MAX_COUNT;

    const row = document.createElement("div");

    row.className =
      "builder-lot-row" + (atMax ? " builder-lot-row-disabled" : " builder-lot-row-clickable");

    const content = document.createElement("div");

    content.className = "builder-template-row-content";

    const thumb = document.createElement("img");

    thumb.className = "builder-template-thumb";
    thumb.src = template.exteriorImagePath;
    thumb.alt = template.name;
    content.appendChild(thumb);

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent = template.name;

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";
    sub.textContent = atMax
      ? "Maximum reached (" + builtCount + "/" + BUILDER_TEMPLATE_MAX_COUNT + " built)."
      : "Needs a " +
        template.interiorTilesWide +
        "x" +
        template.interiorTilesTall +
        " interior floor Lot - " +
        builtCount +
        "/" +
        BUILDER_TEMPLATE_MAX_COUNT +
        " built.";
    label.appendChild(sub);
    content.appendChild(label);
    row.appendChild(content);

    if (!atMax) {
      const openPicker = () => {
        renderBuilderTemplateLotPicker(body, template, () => renderBuilderPanelBody(body));
      };

      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.addEventListener("click", openPicker);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      });
    }

    body.appendChild(row);
  }
}

// Screen 2 - listahan ng mga Lot ng manlalaro na TUGMA ang laki sa
// template na pinili (getBuilderTemplateFit) - hiling ng user: "may list
// ng lots kung ano ng nabiling property lots pipili kung san". Kung wala
// pang tugmang Lot, malinaw na sinasabi ito (sa halip na blangkong
// listahan lang) kasama ang kailangang bilhin.
function renderBuilderTemplateLotPicker(body, template, onBack) {
  body.innerHTML = "";

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Choose which Lot to build the \"" +
    template.name +
    "\" on - needs a " +
    template.interiorTilesWide +
    "x" +
    template.interiorTilesTall +
    " interior floor.";
  body.appendChild(intro);

  const fittingHouses = customHouses.filter((house) => getBuilderTemplateFit(house, template));

  if (fittingHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent =
      "You do not have a matching Lot yet - buy one with a " +
      template.interiorTilesWide +
      "x" +
      template.interiorTilesTall +
      " interior in the 'Lots' tab first.";
    body.appendChild(empty);
  }

  for (const house of fittingHouses) {
    const row = document.createElement("div");

    row.className = "builder-lot-row builder-lot-row-clickable";
    row.tabIndex = 0;
    row.setAttribute("role", "button");

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent = getCustomHouseName(house);

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";

    const currentTemplate = house.templateId ? getBuilderTemplateById(house.templateId) : null;

    sub.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ") - " +
      (currentTemplate
        ? "currently \"" + currentTemplate.name + "\""
        : house.exteriorImageDataURL
          ? "currently a custom design"
          : "empty, no building yet");
    label.appendChild(sub);
    row.appendChild(label);

    const openConfirm = () => {
      renderBuilderTemplateConfirm(body, house, template, onBack);
    };

    row.addEventListener("click", openConfirm);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openConfirm();
      }
    });

    body.appendChild(row);
  }

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => onBack());

  actions.appendChild(backBtn);
  body.appendChild(actions);
}

// Screen 3 - huling kumpirmasyon (hiling ng user: "tapos may confirm")
// bago talaga ilapat ang template - lalo na mahalaga ito kung MAY
// existing na Exterior/Interior (custom man o ibang template) ang
// napiling Lot, dahil PAPALITAN ito (walang "undo" pagkatapos).
function renderBuilderTemplateConfirm(body, house, template, onBack) {
  body.innerHTML = "";

  const currentTemplate = house.templateId ? getBuilderTemplateById(house.templateId) : null;

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Build \"" +
    template.name +
    "\" on \"" +
    getCustomHouseName(house) +
    "\"?" +
    (currentTemplate
      ? " This will REPLACE its current \"" + currentTemplate.name + "\" building."
      : house.exteriorImageDataURL
        ? " This will REPLACE its current custom Exterior/Interior."
        : "");
  body.appendChild(intro);

  const preview = document.createElement("img");

  preview.className = "builder-template-confirm-preview";
  preview.src = template.exteriorImagePath;
  preview.alt = template.name;
  body.appendChild(preview);

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => renderBuilderTemplateLotPicker(body, template, onBack));

  const confirmBtn = document.createElement("button");

  confirmBtn.type = "button";
  confirmBtn.className = "builder-buy-btn";
  confirmBtn.textContent = "Confirm";
  confirmBtn.addEventListener("click", () => {
    applyBuilderTemplateToHouse(house, template);

    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("Built \"" + template.name + "\" on \"" + getCustomHouseName(house) + "\"! You can now enter the house.");
    }

    onBack();
  });

  actions.appendChild(backBtn);
  actions.appendChild(confirmBtn);
  body.appendChild(actions);
}

function renderBuilderExteriorTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Choose the Lot you want to give an Exterior - click the Template, choose the wall and door position (12 choices - 4 walls x 3 positions each) and Confirm to download it, draw on it using Aseprite/LibreSprite/Photoshop, save it as a PNG (same exact size), then Upload it. There is a red guide on the Template - that is the EXACT door position, that is where your door drawing should go (you can erase/cover the guide before exporting it).";
  body.appendChild(intro);

  renderBuilderHouseList(body, "exterior");
}

function renderBuilderInteriorTab(body) {
  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Choose the Lot you want to give its own ROOM design (interior) - it AUTOMATICALLY uses the same door position as your Exterior (there is nothing separate to choose). EXTRA walls are added around the open floor (1 column left and right, 2 rows on top, 1 row on the bottom) - so the Template you download/upload is a bit bigger than the Exterior.";
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
    "Choose the Lot you want to sell/demolish - it will be removed from the map (along with its Exterior/Interior) and you will get " +
    Math.round(BUILDER_SELL_REFUND_RATIO * 100) +
    "% pabalik na gold.";
  body.appendChild(intro);

  if (customHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent = "You do not have a Lot to sell.";
    body.appendChild(empty);
    return;
  }

  for (const house of customHouses) {
    const row = document.createElement("div");

    row.className = "builder-lot-row";

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent = getCustomHouseName(house);

    const where = document.createElement("div");

    where.className = "builder-lot-sub";
    where.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ")";
    label.appendChild(where);

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";
    sub.textContent =
      (house.exteriorImageDataURL ? "Has Exterior" : "No Exterior") +
      " • " +
      (house.interiorImageDataURL ? "Has Interior" : "No Interior");

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

// =========================
// DOOR POSITION PICKER (bagong "Template section" - hiling ng user)
// =========================
// AYOS (hiling ng user): "yung door guide is dapat may 3 selection ng
// door like left bottom, center bottom, right bottom yung sa template
// dapat may template section nandun yung tatlo tapos mag select ako
// ng isa then confirm tyaka mag download yung template na yon" -
// dating basta direktang nagda-download agad ang "Template" na buton
// (FIXED sa gitna-ibaba) - ngayon, bubukas muna ito sa BAGONG screen
// na ito: 12 pagpipilian ng posisyon ng pintuan (4 pader x 3 posisyon),
// tapos "Kumpirmahin" na buton - doon pa lang mase-save
// (house.doorPosition, tingnan ang normalizeCustomHouseDoorPositions
// sa itaas).
//
// AYOS (hiling ng user: "sa interior naman kasi dapat nga hindi na
// mamimili ng tiles width...kung bottom center yung napili automatic
// na bottom center na rin sa interior") - EXTERIOR NA LANG ang tanging
// gumagamit nito ngayon (`kind` ay laging "exterior") - ang Interior ay
// AWTOMATIKONG kumukuha na lang sa parehong `house.doorPosition`
// (kasama na ang sukat, `house.tilesWide`/`tilesTall`) - tingnan ang
// renderBuilderHouseList/registerCustomHouseInteriorWorld.
function renderBuilderDoorPicker(body, house, kind, tilesWide, tilesTall, onBack) {
  body.innerHTML = "";

  let selected = migrateBuilderDoorPositionId(house.doorPosition);

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Choose the wall AND door position (you will see the guide on the Template) - then Confirm to download it.";
  body.appendChild(intro);

  // AYOS (hiling ng user): "sa interior is may selection din kung san
  // yung door pero gawin mo na lang pala same lang ng template yung sa
  // exterior at interior bali 12 na template..." - PAREHONG-PAREHONG
  // 12 pagpipilian (4 pader x 3 posisyon bawat isa) ang ipinapakita
  // dito, para sa EXTERIOR (`kind === "exterior"`) AT INTERIOR
  // (`kind === "interior"`) - iisa/shared na lang itong function,
  // grupo-grupo (isang maliit na hanay bawat pader) para hindi
  // masyadong magulo ang 12 buton.
  const optionButtons = [];
  const wallGroups = [
    { wall: "top", label: "TOP Wall" },
    { wall: "left", label: "LEFT Wall" },
    { wall: "bottom", label: "BOTTOM Wall" },
    { wall: "right", label: "RIGHT Wall" },
  ];

  for (const group of wallGroups) {
    const groupLabel = document.createElement("div");

    groupLabel.className = "builder-door-group-label";
    groupLabel.textContent = group.label;
    body.appendChild(groupLabel);

    const optionsRow = document.createElement("div");

    optionsRow.className = "builder-door-options";

    for (const option of BUILDER_DOOR_POSITIONS.filter((entry) => entry.wall === group.wall)) {
      const optionBtn = document.createElement("button");

      optionBtn.type = "button";
      optionBtn.className =
        "builder-door-option-btn" + (option.id === selected ? " selected" : "");
      optionBtn.textContent = option.label;
      optionBtn.addEventListener("click", () => {
        selected = option.id;

        for (const btn of optionButtons) btn.classList.remove("selected");
        optionBtn.classList.add("selected");
      });

      optionButtons.push(optionBtn);
      optionsRow.appendChild(optionBtn);
    }

    body.appendChild(optionsRow);
  }

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => onBack());

  const confirmBtn = document.createElement("button");

  confirmBtn.type = "button";
  confirmBtn.className = "builder-buy-btn";
  confirmBtn.textContent = "Confirm";
  confirmBtn.addEventListener("click", () => {
    house.doorPosition = selected;

    // AYOS (hiling ng user: "kung ano ng laki ng exterior ganun na din
    // lakalaki...kung bottom center yung napili automatic na bottom
    // center na rin sa interior") - dahil AWTOMATIKONG kumukuha na
    // lang ang interior (kung MAY na-upload na) sa house.doorPosition
    // ng exterior, kailangang I-REGISTER ULIT ito (TMJ/pader + DOORS)
    // sa sandaling MAGBAGO ang doorPosition, kung hindi, MANATILING
    // LUMA (hindi kasabay na-uupdate) ang notch/pintuan sa loob ng
    // silid - hindi kasi awtomatikong tumatawag dito ang paglipat ng
    // Image (ensureCustomHouseImagesLoaded, TANGING kapag BAGONG
    // Image lang ginagawa nito).
    if (house.interiorImageDataURL) {
      delete customHouseInteriorImages[house.id];
      ensureCustomHouseImagesLoaded(house);
    }

    saveCustomHouses();

    // AYOS (hiling ng user): "yung template download ihiwalay mo ng
    // button kasi nag auto download kapag confirm e gusto ko alisin mo
    // na yun meron naman download ulit na button ibahin mo na lang
    // label na template" - dating awtomatikong nagda-download AGAD ito
    // sa sandaling mag-Kumpirma (downloadBuilderTemplate dito mismo) -
    // TINANGGAL na ang auto-download na ito - ang bagong "naka-
    // kumpirma na" na screen (renderBuilderTemplateConfirmed) ang may
    // sariling HIWALAY na buton ("Template") para dito na lang
    // mag-download, kailan man niya gustuhin.

    // AYOS (hiling ng user): "pagka confirm is mawawala yung list ng
    // template mapapalitan ng napili mong template tapos dun mo na i
    // upload yung ginawa mong mockup house" - dating dito na lang
    // nananatili ang listahan ng 12 pagpipilian pagkatapos mag-Kumpirma
    // - ngayon, lumilipat na ito sa BAGONG "naka-kumpirma na" na
    // screen (renderBuilderTemplateConfirmed sa ibaba) - doon na ang
    // Upload.
    renderBuilderTemplateConfirmed(body, house, kind, tilesWide, tilesTall, selected, onBack);
  });

  actions.appendChild(backBtn);
  actions.appendChild(confirmBtn);
  body.appendChild(actions);
}

// =========================
// "NAKA-KUMPIRMA NA" NA TEMPLATE (kapalit ng listahan ng 12 pagpipilian
// pagkatapos mag-Kumpirmahin, hiling ng user)
// =========================
// Ipinapakita dito ang PINILING pintuan (wall + posisyon), may option
// na mag-download ulit o BAGUHIN ang pintuan (babalik sa Door Picker),
// AT ang "Upload" ng TALAGANG ginawang mockup/disenyo ng Exterior.
//
// AYOS (hiling ng user: "sa interior naman kasi dapat nga hindi na
// mamimili ng tiles width...alisin mo na pala yung template") -
// EXTERIOR NA LANG ang dumadaan dito ngayon - ang Interior ay diretso
// na lang sa Upload (renderBuilderHouseList), walang sariling
// Door Picker/"naka-kumpirma na" na screen, dahil AWTOMATIKONG
// kinukuha na lang nito ang sukat/posisyon ng pintuan ng Exterior.
function renderBuilderTemplateConfirmed(body, house, kind, tilesWide, tilesTall, doorPosition, onBack) {
  body.innerHTML = "";

  const def = getBuilderDoorPositionDef(doorPosition);

  const intro = document.createElement("p");

  intro.className = "builder-panel-hint";
  intro.textContent =
    "Chosen door: " +
    def.label +
    " (" +
    tilesWide * TILE_SIZE +
    "x" +
    tilesTall * TILE_SIZE +
    " px). Draw your house on this Template (remember to erase/cover the red guide), save it as a PNG, then Upload it here.";
  body.appendChild(intro);

  const summary = document.createElement("div");

  summary.className = "builder-lot-row";

  const summaryLabel = document.createElement("div");

  summaryLabel.className = "builder-lot-label";
  summaryLabel.textContent = def.label;

  const summarySub = document.createElement("div");

  summarySub.className = "builder-lot-sub";
  summarySub.textContent = "Wall: " + def.wall + " \u2022 Size: " + tilesWide + "x" + tilesTall + " tiles";

  summaryLabel.appendChild(summarySub);
  summary.appendChild(summaryLabel);
  body.appendChild(summary);

  const actions = document.createElement("div");

  actions.className = "builder-lot-actions";

  const backBtn = document.createElement("button");

  backBtn.type = "button";
  backBtn.className = "builder-secondary-btn";
  backBtn.textContent = "Back";
  backBtn.addEventListener("click", () => onBack());

  const changeDoorBtn = document.createElement("button");

  changeDoorBtn.type = "button";
  changeDoorBtn.className = "builder-secondary-btn";
  changeDoorBtn.textContent = "Change Door";
  changeDoorBtn.addEventListener("click", () => {
    renderBuilderDoorPicker(body, house, kind, tilesWide, tilesTall, onBack);
  });

  const downloadBtn = document.createElement("button");

  downloadBtn.type = "button";
  downloadBtn.className = "builder-secondary-btn";
  downloadBtn.textContent = "Template";
  downloadBtn.addEventListener("click", () => {
    downloadBuilderTemplate(tilesWide, tilesTall, doorPosition, kind);
  });

  const uploadBtn = document.createElement("button");

  uploadBtn.type = "button";
  uploadBtn.className = "builder-buy-btn";
  uploadBtn.textContent = "Upload";
  uploadBtn.addEventListener("click", () => {
    promptBuilderImageUpload(tilesWide * TILE_SIZE, tilesTall * TILE_SIZE, (dataUrl) => {
      // Store the image in its own asset key (see "IMAGE ASSET STORE"
      // above) instead of inline on the house.
      const assetId = saveBuilderAsset(dataUrl);

      if (assetId) {
        const oldAssetId = house.exteriorAssetId;

        house.exteriorAssetId = assetId;
        house.exteriorImageDataURL = dataUrl;
        // Same reasoning as the Interior upload handler above - manual
        // upload means this is no longer a Building template.
        delete house.templateId;
        if (oldAssetId && oldAssetId !== assetId) deleteBuilderAsset(oldAssetId);
      }

      delete customHouseExteriorImages[house.id];
      ensureCustomHouseImagesLoaded(house);
      saveCustomHouses();

      // Chain straight into Interior if it does not have one yet -
      // keeps the flow going: name -> map -> exterior -> interior. If
      // it already has an Interior (this was just a re-upload of the
      // Exterior), fall back to the normal list.
      if (!house.interiorImageDataURL) {
        builderPanelTab = "interior";
        renderBuilderInteriorUploadScreen(body, house, () => renderBuilderPanelBody(body));

        if (typeof showFloatingMessage === "function") {
          showFloatingMessage("Exterior uploaded! Now the Interior.");
        }

        return;
      }

      renderBuilderPanelBody(body);

      if (typeof showFloatingMessage === "function") {
        showFloatingMessage("Exterior uploaded!");
      }
    });
  });

  actions.appendChild(backBtn);
  actions.appendChild(changeDoorBtn);
  actions.appendChild(downloadBtn);
  actions.appendChild(uploadBtn);
  body.appendChild(actions);
}

// BUGFIX (nagdulot ng "nawawala ang bahay sa bawat reload/Load"): dating
// tinatawag ang loadCustomHouses() malapit sa itaas ng file, PERO kailangan
// nito ang BUILDER_DOOR_POSITIONS/BUILDER_DEFAULT_DOOR_POSITION (sa loob ng
// normalizeCustomHouseDoorPositions -> migrateBuilderDoorPositionId), na
// mga `const` na hindi pa na-i-i-INITIALIZE sa oras na iyon (deklarado pa
// lang sila MAS MABABA sa file). Sa JavaScript, ang pag-access sa isang
// `const`/`let` BAGO pa ito ma-initialize ay THROW (temporal dead zone),
// kahit hoisted na ang pangalan nito - kaya ANG BUONG loadCustomHouses()
// ay palaging bumabagsak sa try/catch nito sa SANDALING may kahit isang
// naka-save na bahay, tahimik na binabalik ang customHouses sa [] (walang
// error na makikita sa normal na paggamit, console.error lang). Ito talaga
// ang dahilan kung bakit laging "bumabalik sa walang bahay" pagkatapos
// mag-reload (kasama na ang location.reload() ng "Load") - HINDI dahil sa
// localStorage mismo (nandoon pa rin talaga ang data), kundi dahil bumagsak
// bago pa man ito nabasa. Ang AYOS: ITINULAK ang mismong TAWAG na ito
// papunta sa PINAKADULO ng file - sa puntong ito, TAPOS NA talagang
// na-deklara ang LAHAT ng const/function na ginagamit nito.
loadCustomHouses();
