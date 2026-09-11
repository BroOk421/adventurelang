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
// FIXED na LAGI ang Exterior sa 10x8 (SINUPERSEDE na ito ng Entry #93 -
// tingnan ang susunod na komento) (BUILDER_EXTERIOR_TILES_WIDE/TALL
// sa ibaba) sa LAHAT ng 4 tier - ang TALAGANG naiiba na ngayon ay ang
// `interiorTilesWide`/`interiorTilesTall` (ang BUKAS/walkable na sahig
// sa LOOB ng bahay, tingnan ang BUILDER_INTERIOR_WALL_THICKNESS sa
// ibaba para sa padding) - mula 10x8 (pinakamaliit, +padding = 12x11
// katumbas na PADDED na Template) hanggang 18x17 (pinakamalaki,
// +padding = 20x20 katumbas na PADDED na Template) - kaya mas malaki
// ang SILID sa loob, kahit PAREHONG-PAREHO lang ang itsura/laki ng
// bahay sa LABAS (mapa/minimap).
//
// AYOS ULIT (hiling ng user: "may bago akong selection sa lot meron na
// kasing 160x128 or 10x8 gusto ko naman dagdagan mo pa ng mas mahaba at
// payat na selection... sa lot tapos sa exterior ganun din pero sa
// interior 18x17 parin") - HINDI na FIXED sa 10x8 ang Exterior. Bawat
// tier sa BUILDER_LOT_SIZES ay may SARILI nang `exteriorTilesWide`/
// `exteriorTilesTall`; ang BUILDER_EXTERIOR_TILES_WIDE/TALL ay naging
// DEFAULT/fallback na lang (para sa mga LUMANG naka-save na bahay at
// mga template na walang naka-tukoy na sukat).
//
// TANDAAN sa hiniling na "135x150": ang buong laro ay naka-16px na tile
// grid (TILE_SIZE = 16) - ang 135 at 150 ay HINDI divisible sa 16
// (8.4375 at 9.375 na tile), kaya masisira ang collision/door/placement
// alignment kung pipilitin. Ang pinakamalapit na TILE-ALIGNED na sukat
// na may EKSAKTONG parehong 0.9 na ratio (135:150) ay 9x10 na tile =
// 144x160 px - iyon ang ginamit sa "tall" na tier sa ibaba.
const BUILDER_EXTERIOR_TILES_WIDE = 10;
const BUILDER_EXTERIOR_TILES_TALL = 8;

const BUILDER_LOT_SIZES = [
  {
    id: "small",
    label: "Small",
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
    interiorTilesWide: 10,
    interiorTilesTall: 8,
    price: 300,
  },
  {
    id: "medium",
    label: "Medium",
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
    interiorTilesWide: 13,
    interiorTilesTall: 11,
    price: 600,
  },
  {
    id: "large",
    label: "Large",
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
    interiorTilesWide: 15,
    interiorTilesTall: 13,
    price: 900,
  },
  {
    id: "xlarge",
    label: "Extra Large",
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
    interiorTilesWide: 18,
    interiorTilesTall: 17,
    price: 1400,
  },
  // BAGO - ang "mahaba at payat" na tier: mas MAKITID pero mas MATAAS
  // ang bahay sa LABAS (9x10 na tile = 144x160 px, kumpara sa 10x8 =
  // 160x128 ng lahat ng iba) - PERO KAPAREHONG-PAREHO pa rin ang loob
  // ng bahay sa pinakamalaking tier (18x17 na bukas na sahig = 20x20
  // na PADDED na Interior Template), kaya puwede pa rin ditong gamitin
  // ang mga Interior artwork na iginuhit para sa Extra Large.
  {
    id: "tall",
    label: "Tall",
    exteriorTilesWide: 9,
    exteriorTilesTall: 10,
    interiorTilesWide: 18,
    interiorTilesTall: 17,
    price: 1400,
  },
];

// Ang EXTERIOR footprint (sa TILES) ng isang tier ng Lot O ng isang
// naitayo NANG bahay - may fallback sa lumang FIXED na 10x8 para sa
// mga LUMANG naka-save na bahay (bago pa ang per-tier na sukat) at sa
// mga Building template na walang naka-tukoy nito.
function getBuilderExteriorSize(source) {
  const wide = source && Number.isFinite(source.exteriorTilesWide) ? source.exteriorTilesWide : BUILDER_EXTERIOR_TILES_WIDE;
  const tall = source && Number.isFinite(source.exteriorTilesTall) ? source.exteriorTilesTall : BUILDER_EXTERIOR_TILES_TALL;

  return { wide, tall };
}

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
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
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
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
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
  // BAGO (hiling ng user: "gusto ko i add mo sa building yung template na
  // grocery at gardenhouse") - ang GROCERY ay iginuhit para sa PAREHONG
  // tier ng Coffee Shop/Tavern (Extra Large: exterior 10x8 = 160x128 px,
  // interior 18x17 na open floor = 20x20 padded = 320x320 px).
  {
    id: "grocery",
    exteriorTilesWide: 10,
    exteriorTilesTall: 8,
    name: "Grocery",
    interiorTilesWide: 18,
    interiorTilesTall: 17,
    doorPosition: "bottom-center",
    exteriorImagePath: "./assets/builder-templates/grocery-exterior.png",
    interiorImagePath: "./assets/builder-templates/grocery-interior.png",
    // Kaparehong-parehong paraan ng pag-sample ng Coffee Shop/Tavern
    // (hinanap ang pinakamaliwanag na warm/orange na pixel sa mismong
    // artwork, hindi hula) - {x, y} sa RELATIVE pixel coords ng 160x128
    // na exterior PNG mismo (itaas-kaliwa = 0,0).
    lightPoints: [
      { x: 62, y: 96 }, // lamp (kaliwa ng pinto)
      { x: 97, y: 95 }, // lamp (kanan ng pinto)
      { x: 77, y: 50 }, // dormer na bintana (itaas-gitna)
      { x: 37, y: 58 }, // bintana sa itaas (kaliwa)
      { x: 120, y: 58 }, // bintana sa itaas (kanan)
      { x: 79, y: 101 }, // pinto (salamin)
    ],
  },
  // Ang GARDEN HOUSE (greenhouse) ay iginuhit para sa "Tall" na tier -
  // MAS MAKITID pero MAS MATAAS sa labas (9x10 = 144x160 px), PAREHONG
  // 18x17 na open interior floor (320x320 px) ng Extra Large.
  {
    id: "garden-house",
    exteriorTilesWide: 9,
    exteriorTilesTall: 10,
    name: "Garden House",
    // AYOS (hiling ng user): "top 5 tiles ang collisions 2 sa left at 2
    // sa right 1 sa bottom". Ang OPEN/walkable na sahig ay 16x14 - kaya
    // 16+2+2 = 20 lapad at 14+5+1 = 20 taas na PADDED, EKSAKTONG 320x320
    // px ang PNG, KAPAREHONG-PAREHO ng "Tall" na Lot (18x17 open +
    // default na {2,1,1,1} = 20x20 din) - ito ang TINUTUGMA ng
    // getBuilderTemplateFit.
    interiorTilesWide: 16,
    interiorTilesTall: 14,
    interiorWallThickness: { top: 5, bottom: 1, left: 2, right: 2 },
    doorPosition: "bottom-center",
    exteriorImagePath: "./assets/builder-templates/gardenhouse-exterior.png",
    interiorImagePath: "./assets/builder-templates/gardenhouse-interior.png",
    // AYOS (hiling ng user): "yan yung lalabas kapag na dig na yung inner
    // room" - PANGALAWANG bersyon ng KAPAREHONG 320x320 na interior
    // artwork, ang pinagkaiba lang ay HINUKAY/naararo na ang lupa. Hindi
    // ito buong-buong iginuguhit: ang TILE lang na TALAGANG nahukay ang
    // kinukuhanan ng 16x16 na crop mula rito (tingnan ang drawDugTiles sa
    // dig.js) - kaya isa-isang nagbabago ang hitsura ng bawat tile habang
    // inaararo mo, hindi sabay-sabay.
    interiorDugImagePath: "./assets/builder-templates/gardenhouse-dig.png",
    // 2 lantern sa magkabilang tabi ng pinto + ang salamin ng pinto
    // mismo + ang malalaking glass panel sa gilid (greenhouse ito, kaya
    // halos puro salamin) - PAREHONG paraan ng pag-sample sa artwork.
    lightPoints: [
      { x: 45, y: 125 }, // lantern (kaliwa)
      { x: 98, y: 125 }, // lantern (kanan)
      { x: 72, y: 130 }, // pinto (salamin)
      { x: 22, y: 95 }, // glass panel (kaliwa)
      { x: 122, y: 95 }, // glass panel (kanan)
    ],
    // =========================
    // TANIMAN SA LOOB (hiling ng user: "meron jan isang image na
    // screenshot about sa gardenhouse is kung san lang pwede mag tanim")
    // =========================
    // Ang Garden House LANG ang building template na may LUPA sa loob -
    // kaya ito LANG ang interior kung saan puwedeng gamitin ang rake at
    // magtanim (tingnan ang canDigAt sa dig.js; SARADO pa rin ang lahat
    // ng ibang interior, gaya ng dati).
    //
    // Mga rectangle NG LUPA, sa TILES, sa PADDED na coordinate frame ng
    // interior (0,0 = itaas-kaliwa ng BUONG 20x20 na silid, HINDI ng
    // 18x17 na open floor) - kaya DIREKTANG katumbas ito ng (col, row)
    // ng mundo sa loob (tingnan ang buildSyntheticInteriorTmj: ang
    // synthetic TMJ ay eksaktong padded.wide x padded.tall ang laki,
    // nagsisimula sa 0,0).
    //
    // Ang mga halagang ito ay HINDI hula: kinuha ang EKSAKTONG PAGKAKAIBA
    // ng gardenhouse-interior.png at gardenhouse-dig.png (pixel-by-pixel
    // diff) - ang mga tile na NAGBABAGO sa pagitan ng dalawang artwork ay
    // EKSAKTO ring ang mga tile na PUWEDENG hukayin/tamnan. Dalawang 6x7
    // na taniman, magkabilang tabi ng gitnang daanan (84 tile lahat).
    plantableTileRects: [
      { col: 2, row: 9, width: 6, height: 7 }, // kaliwang lupa
      { col: 12, row: 9, width: 6, height: 7 }, // kanang lupa
    ],
  },
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

  // Ang HINUKAY na bersyon ng interior (Garden House lang sa ngayon) -
  // opsyonal, kaya `null` kung walang `interiorDugImagePath` ang template.
  let dugImg = null;

  if (template.interiorDugImagePath) {
    dugImg = new Image();
    dugImg.src = template.interiorDugImagePath;
  }

  BUILDER_TEMPLATE_IMAGES[template.id] = {
    exterior: exteriorImg,
    interior: interiorImg,
    dug: dugImg,
  };
}

// Ang naka-preload nang HINUKAY na interior artwork para sa interior
// world na ito - `null` kung: hindi ito interior ng custom house, walang
// template, walang dug artwork ang template, o hindi pa tapos mag-load
// ang larawan. Ginagamit ng drawDugTiles (dig.js) - kaya LIGTAS itong
// tawagin kada frame.
function getBuilderInteriorDugImage(worldName) {
  if (!worldName) return null;
  if (typeof customHouses === "undefined" || !Array.isArray(customHouses)) return null;

  const house = customHouses.find(
    (entry) => getCustomHouseInteriorWorldName(entry) === worldName,
  );

  if (!house || !house.templateId) return null;

  const images = BUILDER_TEMPLATE_IMAGES[house.templateId];
  const image = images ? images.dug : null;

  if (!image || !image.complete || !image.naturalWidth) return null;

  return image;
}

function getBuilderTemplateById(templateId) {
  return BUILDER_BUILDING_TEMPLATES.find((template) => template.id === templateId) || null;
}

// True kung magkatugma ang OPEN interior floor size ng isang Lot at ang
// kailangan ng isang template - ang TANGING bagay na pumipigil sa isang
// template na ilapat kahit saang Lot (parehong-pareho naman ang Exterior
// footprint sa LAHAT ng Lot, 10x8, kaya iyon ay hindi problema).
function getBuilderTemplateFit(house, template) {
  // AYOS (kasabay ng bagong "Tall" na tier) - dati, ang INTERIOR lang
  // ang sinusuri dito dahil PAREHO ang Exterior footprint (10x8) ng
  // LAHAT ng Lot. Ngayong iba-iba na ito kada tier, kailangan ding
  // magtugma ang EXTERIOR - kung hindi, mabaluktot/mauunat ang
  // exterior PNG ng template (iginuhit ito para sa 160x128) kapag
  // inilapat sa isang 144x160 na "Tall" na Lot.
  // AYOS ULIT (kasabay ng per-template na kapal ng pader - tingnan ang
  // getBuilderInteriorWallThickness): ang PADDED na sukat na ngayon ang
  // sinusuri, HINDI na ang OPEN na sahig. Ito ang TAMANG batayan dahil
  // ang PADDED na sukat mismo ang TALAGANG laki ng interior PNG at ng
  // silid - dalawang template na magkaibang-magkaiba ang kapal ng pader
  // ay puwede pa ring PAREHO ang laki ng kuwarto (hal. Garden House
  // 16x13 + {5,2,2,2} = 20x20, kapareho ng "Tall" na Lot na 18x17 +
  // {2,1,1,1} = 20x20 din). Kung ang OPEN na sukat pa rin ang susuriin,
  // MALING "hindi tugma" ang isasagot nito para sa Garden House.
  const houseExterior = getBuilderExteriorSize(house);
  const templateExterior = getBuilderExteriorSize(template);
  const housePadded = getBuilderInteriorPaddedSize(
    house.interiorTilesWide,
    house.interiorTilesTall,
    getBuilderInteriorWallThickness(house),
  );
  const templatePadded = getBuilderInteriorPaddedSize(
    template.interiorTilesWide,
    template.interiorTilesTall,
    getBuilderInteriorWallThickness(template),
  );

  return (
    housePadded.wide === templatePadded.wide &&
    housePadded.tall === templatePadded.tall &&
    houseExterior.wide === templateExterior.wide &&
    houseExterior.tall === templateExterior.tall
  );
}

// =========================
// TANIMAN SA LOOB NG ISANG BUILDING TEMPLATE (Garden House)
// =========================
// Ang `plantableTileRects` ng isang template (tingnan ang Garden House
// sa BUILDER_BUILDING_TEMPLATES sa itaas) ay NAKATALI sa ARTWORK -
// kaya kailangan muna nating malaman kung ALING bahay ang may-ari ng
// interior world na kasalukuyang pinapasok, at kung ALING template ang
// naka-set dito.
//
// Ginagamit ito ng canDigAt (dig.js) - ito LANG ang butas sa dating
// "walang mahuhukay sa loob ng bahay" na patakaran.

// Ang mga plantable rect (tiles, padded interior frame) ng interior
// world na ito - `null` kung ito ay: hindi interior ng custom house,
// walang template, o template na WALANG taniman (Coffee Shop/Tavern/
// Grocery - lahat sila sarado sa farming, gaya ng dati).
function getBuilderPlantableRects(worldName) {
  if (!worldName) return null;
  if (typeof customHouses === "undefined" || !Array.isArray(customHouses)) return null;

  const house = customHouses.find(
    (entry) => getCustomHouseInteriorWorldName(entry) === worldName,
  );

  if (!house || !house.templateId) return null;

  const template = getBuilderTemplateById(house.templateId);

  if (!template || !Array.isArray(template.plantableTileRects)) return null;
  if (template.plantableTileRects.length === 0) return null;

  return template.plantableTileRects;
}

// Puwede bang hukayin/tamnan ang EKSAKTONG tile na ito sa loob ng
// interior world na ito? - `false` para sa LAHAT ng ibang mundo sa
// loob ng bahay (at para sa mga tile na NASA LABAS ng mismong lupa,
// hal. ang kahoy na daanan sa gitna ng Garden House).
function isBuilderPlantableTile(worldName, col, row) {
  const rects = getBuilderPlantableRects(worldName);

  if (!rects) return false;

  return rects.some(
    (rect) =>
      col >= rect.col &&
      col < rect.col + rect.width &&
      row >= rect.row &&
      row < rect.row + rect.height,
  );
}

// Ibabalik na gold kapag "Sell"/gibain ang isang bahay (80% ng
// TALAGANG binayaran para sa Lot nito - hiling ng user: "- 20%").
const BUILDER_SELL_REFUND_RATIO = 0.8;

// Mga mundo kung saan puwedeng ilagay ang isang Lot - hiling ng user.
const BUILDER_PLACEABLE_WORLDS = new Set(["grassmap", "grassmap2"]);

// =========================
// PAANAN NG PINTUAN NG BAWAT BAHAY SA TOWN (mariaHouse/josephHouse/atbp)
// =========================
// LAHAT ng 6 bahay sa town (worlds.js: manuelHouse/josephHouse/
// mariaHouse/escanorHouse/jillianHouse/matildaHouse) ay GUMAGAMIT ng
// PAREHONG "room_grassmap.tmj" - kaya IISA at PAREHONG-PAREHO ang
// "Exit" na butas ng pader sa LAHAT ng mga ito (VERIFIED sa DOORS,
// worlds.js: area { x: 63, y: 193, width: 39, height: 31 }, silid na
// 15x14 tile = 240x224 px). Ginagamit ito ni Joseph/Maria bilang
// "pintuan ng bahay nila" para sa paglalabas/pagpasok (tingnan ang
// buildHomeWalkPath sa ibaba).
const HOUSE_DOOR_FOOT_POSITION = { x: 63 + 39 / 2, y: 224 };

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

// =========================
// SI MARIA - "bahay" niya (hiling ng user: "meron silang kanya kanyang
// bahay mariaHouse at josephHouse")
// =========================
const MARIA_WORLD = "mariaHouse";
// Kaparehong-parehong posisyon ni Joseph (parehong silid naman,
// room_grassmap.tmj) - proven-safe na ito (malayo sa pader/pintuan).
const MARIA_HOME_COL = 8;
const MARIA_HOME_ROW = 4;
const MARIA_HOME_X = MARIA_HOME_COL * TILE_SIZE + TILE_SIZE / 2;
const MARIA_HOME_Y = MARIA_HOME_ROW * TILE_SIZE + TILE_SIZE;

// AYOS: walang sariling sprite/art pa si Joseph (walang in-upload na
// asset) - placeholder muna ito (bilog + emoji, parehong konsepto ng
// mga fallback emoji icon sa BAG_ITEMS) hanggang may idagdag pang
// tunay na larawan balang araw - hindi ito nakakaapekto sa gameplay,
// pero puwedeng palitan/i-swap balang araw (tingnan ang drawJoseph).
// =========================
// MGA NPC NA GUMAGAMIT NG SPRITE NG PLAYER (pansamantala)
// =========================
// Hiling ng user: "yung muka ni joseph gawin mo munang ako na naka idle...
// yung kunin mo naka animation parin kapag naka idle... tyaka ko na
// lagyan ng ibang itsura kapag nakagawa na ako" - WALA pang sariling art
// sina Joseph at Maria, kaya ang FRONT IDLE na strip ng player mismo
// (assets/character/idle/frontidle/frontidle.png, 7 frame - tingnan ang
// assets.js) ang pansamantalang ginagamit. IISANG lugar lang ito
// pinipili (NPC_PLACEHOLDER_SPRITE_KEY sa ibaba), kaya kapag may tunay
// nang art, isang palit lang ang kailangan kada NPC.
//
// TANDAAN: ang idle ng PLAYER mismo ay naka-FREEZE sa frame 0 (tingnan
// ang drawPlayer sa player.js) - SINASADYA iyon doon. Ang mga NPC dito
// ay may SARILING orasan (NPC_IDLE_FRAME_MS sa ibaba) kaya TALAGANG
// gumagalaw sila habang nakatayo, gaya ng hiniling.

const NPC_IDLE_FRAME_COUNT = 7;
const NPC_IDLE_FRAME_MS = 160;

// Ang kasalukuyang idle frame ng mga NPC - naka-batay sa TUNAY na oras,
// hindi sa bilang ng render frame, kaya PAREHO ang bilis kahit saang
// mundo (kaparehong dahilan ng time-based na `player.frameTimer` sa
// update.js).
function getNpcIdleFrame(offset) {
  return (
    (Math.floor(Date.now() / NPC_IDLE_FRAME_MS) + (offset || 0)) %
    NPC_IDLE_FRAME_COUNT
  );
}

// Iginuguhit ang isang NPC gamit ang FRONT IDLE na sprite ng player,
// naka-anchor sa PAANAN nito (feetX, feetY) - kaparehong-parehong
// paraan ng pag-size/crop ng tunay na player (getSpriteCropDestRect,
// player.js) kaya eksaktong PAREHO ang laki at pagkakatapak nila sa
// lupa, hindi lumulutang o lumalaki/liliit.
// AYOS (hiling ng user: "yung paglalakad nila walk back,front,left at
// right tapos idle front,back,left and right dapat") - may `direction`
// na ngayon (default "down"/nakaharap sa manlalaro/pinto) - dating
// "down" lang ang suportado (hardcoded), ngayon puwede nang "up"/
// "left"/"right" din, kaparehong-pareho ng ginagawa na ng
// drawNpcWalkCharacter sa ibaba.
function drawNpcIdleCharacter(feetX, feetY, frameOffset, direction) {
  if (typeof sprites === "undefined" || !sprites.idle) return;

  const dir = direction || "down";
  const sprite = sprites.idle[dir];

  if (!sprite || !sprite.complete || !sprite.width) return;

  const width = typeof player !== "undefined" ? player.width : 56;
  const height = typeof player !== "undefined" ? player.height : 64;

  const boxX = feetX - width / 2;
  const boxY = feetY - height;

  // AYOS (hiling ng user): "yung shadow nila sa ground is dapat kagaya
  // ng sa character ko na naglalakad is nasa ilalim lang ng character" -
  // dating gumagamit ng sariling hula (0.42 width, offsetY -4) - ngayon,
  // EKSAKTONG kopya ito ng formula ng TALAGANG anino ng player
  // (drawPlayerShadow, player.js): shadowWidth = width*0.3, at ang
  // TALAGANG "paanan" (para sa anino lang) ay HINDI ang buong ilalim ng
  // kahon (boxY+height) kundi bahagyang mas mataas dito
  // (PLAYER_FOOT_RATIO = 51/64) - may blangkong puwang kasi sa ilalim
  // ng bawat sprite art. Kung gagamitin ang buong ilalim, "lumulutang"
  // ang katawan sa ibabaw ng sarili niyang anino.
  const footRatio = typeof PLAYER_FOOT_RATIO === "number" ? PLAYER_FOOT_RATIO : 51 / 64;

  if (typeof drawGroundShadow === "function") {
    drawGroundShadow(feetX, boxY + height * footRatio, width * 0.3, {
      heightRatio: 0.25,
      blur: 3,
      alpha: 0.35,
    });
  }

  const frameWidth = sprite.width / NPC_IDLE_FRAME_COUNT;
  const frameIndex = getNpcIdleFrame(frameOffset);

  ctx.imageSmoothingEnabled = false;

  let destX = boxX;
  let destY = boxY;
  let destWidth = width;
  let destHeight = height;

  if (typeof getSpriteCropDestRect === "function") {
    const rect = getSpriteCropDestRect("idle." + dir, boxX, boxY, width, height);

    destX = rect[0];
    destY = rect[1];
    destWidth = rect[2];
    destHeight = rect[3];
  }

  ctx.drawImage(
    sprite,
    frameIndex * frameWidth,
    0,
    frameWidth,
    sprite.height,
    destX,
    destY,
    destWidth,
    destHeight,
  );
}

// =========================
// LABEL SA ULO NG NPC KAPAG LUMAPIT (hiling ng user: "kada lalapit ako
// may nag popup sa ulo nila na label na may border basta kapag mga npc
// merong ganun sa ulo kapag lalapit")
// =========================
// Gaano kalapit bago lumitaw - sinusukat mula sa PAANAN ng NPC papunta
// sa gitna ng collision box ng player, sa PIXELS (TILE_SIZE = 16, kaya
// ito ay mga 3 tile).
const NPC_LABEL_SHOW_DISTANCE_PX = 52;

function isPlayerNearWorldPoint(x, y, distancePx) {
  if (typeof getPlayerCollisionBox !== "function") return false;

  const box = getPlayerCollisionBox();
  const playerX = box.x + box.width / 2;
  const playerY = box.y + box.height / 2;
  const deltaX = playerX - x;
  const deltaY = playerY - y;

  return deltaX * deltaX + deltaY * deltaY <= distancePx * distancePx;
}

// Ang maliit na label na may BORDER sa itaas ng ulo. World space ito
// (nasa loob ng camera transform), kaya sumusunod ito sa NPC kapag
// gumagalaw ang kamera - hindi naka-pako sa screen.
function drawNpcNameLabel(feetX, feetY, text, headHeight) {
  if (!text) return;
  if (!isPlayerNearWorldPoint(feetX, feetY, NPC_LABEL_SHOW_DISTANCE_PX)) return;

  // `headHeight` - taas (pixels) mula sa PAANAN hanggang sa ULO. Default
  // ay ang taas ng player sprite, dahil iyon ang ginagamit nina Joseph
  // at Maria - ang oldman ay ibang laki, kaya sarili niyang halaga ang
  // ipinapasa niya (tingnan ang drawOldMan, decor.js).
  const height = Number.isFinite(headHeight)
    ? headHeight
    : (typeof player !== "undefined" ? player.height : 64) * 0.62;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.font = "7px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const paddingX = 4;
  const paddingY = 3;
  const textWidth = ctx.measureText(text).width;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = 11;
  const boxX = feetX - boxWidth / 2;
  const boxY = feetY - height - boxHeight - 2;

  ctx.fillStyle = "rgba(18, 18, 22, 0.85)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxWidth - 1, boxHeight - 1);

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(text, feetX, boxY + boxHeight / 2 + 0.5);

  ctx.restore();
}

// =========================
// PAGLALAKAD SA LOOB NG SARILING BAHAY (mariaHouse/josephHouse) -
// hiling ng user: "dapat maglakad sila galing sa bahay tapos lalabas"
// =========================
// IISANG function na ito, ginagamit ng PAREHONG Joseph at Maria sa
// kani-kanilang bahay - "atHome" (nakatayo), "leavingHome" (papalabas),
// "enteringHome" (papasok). Ibinabalik ang PAANANG posisyon na
// TALAGANG ginamit (para sa Y-sort), o `null` kung wala silang dapat
// iguhit DITO ngayon (nasa ibang lugar sila - grocery o "nawawala" sa
// pagitan ng dalawang mundo, tingnan ang paliwanag sa getNpcSchedulePhase).
//
// MAHALAGA: kailangan pa ring TSEKIN ng TUMATAWAG (drawJoseph/
// drawMariaAtHome sa ibaba) kung TALAGANG nasa TAMANG mundo tayo
// (currentWorld === "josephHouse"/"mariaHouse") bago ito tawagin -
// hindi ito nire-recheck dito para maiwasang doble-tawag sa
// getNpcSchedulePhase() kada frame.
function drawHomeNpc(homeSpotX, homeSpotY, frameOffset, phase, progress) {
  if (phase === "atHome") {
    drawNpcIdleCharacter(homeSpotX, homeSpotY, frameOffset, "down");
    return { x: homeSpotX, y: homeSpotY };
  }

  if (phase === "leavingHome") {
    const path = buildGroceryWalkPath(
      HOUSE_DOOR_FOOT_POSITION,
      homeSpotX,
      homeSpotY,
    ).reverse();
    const point = getPointAlongPath(path, progress);
    const direction = getWalkDirectionFromDelta(point.dirX, point.dirY);

    drawNpcWalkCharacter(point.x, point.y, direction, frameOffset);
    return { x: point.x, y: point.y };
  }

  if (phase === "enteringHome") {
    const path = buildGroceryWalkPath(HOUSE_DOOR_FOOT_POSITION, homeSpotX, homeSpotY);
    const point = getPointAlongPath(path, progress);
    const direction = getWalkDirectionFromDelta(point.dirX, point.dirY);

    drawNpcWalkCharacter(point.x, point.y, direction, frameOffset);
    return { x: point.x, y: point.y };
  }

  return null;
}

// Y-sort na "sortY" para sa isang bahay na NPC - kaparehong pattern ng
// grocery version, hiwalay lang para hindi kailangang mag-guhit lang
// para makuha ang posisyon.
function getHomeNpcSortY(homeSpotX, homeSpotY, phase, progress) {
  if (phase === "leavingHome") {
    return getPointAlongPath(
      buildGroceryWalkPath(HOUSE_DOOR_FOOT_POSITION, homeSpotX, homeSpotY).reverse(),
      progress,
    ).y;
  }

  if (phase === "enteringHome") {
    return getPointAlongPath(
      buildGroceryWalkPath(HOUSE_DOOR_FOOT_POSITION, homeSpotX, homeSpotY),
      progress,
    ).y;
  }

  return homeSpotY;
}

function drawJoseph() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return;

  const { phase, progress } = getNpcSchedulePhase();

  drawHomeNpc(JOSEPH_X, JOSEPH_Y, 0, phase, progress);
}

// Kasama sa Y-sort (map.js, fallbackDrawables - PAREHONG "walang
// overlap layer" na landas ginagamit ng getPigDrawables/getOldManDrawables,
// dahil PAREHONG walang "trees/house" overlap layers ang room_grassmap.tmj
// na ginagamit ng josephHouse).
//
// AYOS (hiling ng user, buong iskedyul): dating LAGING naka-guhit si
// Joseph dito basta nasa josephHouse ka (walang pakialam sa oras) -
// ngayon, TANGING kapag "atHome"/"leavingHome"/"enteringHome" lang ang
// yugto niya (nasa BAHAY siya, hindi nasa Grocery/nasa daan) - kaya
// kung "atWork" siya (nasa Grocery), WALANG makikita rito.
function getJosephDrawables() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return [];

  const { phase, progress } = getNpcSchedulePhase();

  if (phase !== "atHome" && phase !== "leavingHome" && phase !== "enteringHome") return [];

  return [
    {
      sortY: getHomeNpcSortY(JOSEPH_X, JOSEPH_Y, phase, progress),
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

// AYOS: "E" (Builder panel) lang habang "atHome" (nakatayo na, hindi
// pa/hindi na naglalakad) - kaparehong-pareho ng ginawang restriction
// sa Grocery na bersyon niya (isPlayerNearJosephAtGrocery).
function isPlayerNearJoseph() {
  if (typeof currentWorld === "undefined" || currentWorld !== JOSEPH_WORLD) return false;
  if (getNpcSchedulePhase().phase !== "atHome") return false;
  if (typeof isPlayerAdjacentToTile !== "function") return false;
  if (typeof isPlayerFacingTile !== "function") return false;

  return (
    isPlayerAdjacentToTile(JOSEPH_COL, JOSEPH_ROW) &&
    isPlayerFacingTile(JOSEPH_COL, JOSEPH_ROW)
  );
}

// =========================
// SI MARIA SA SARILING BAHAY ("mariaHouse")
// =========================
function drawMariaAtHome() {
  if (typeof currentWorld === "undefined" || currentWorld !== MARIA_WORLD) return;

  const { phase, progress } = getNpcSchedulePhase();

  drawHomeNpc(MARIA_HOME_X, MARIA_HOME_Y, 3, phase, progress);
}

function getMariaHomeDrawables() {
  if (typeof currentWorld === "undefined" || currentWorld !== MARIA_WORLD) return [];

  const { phase, progress } = getNpcSchedulePhase();

  if (phase !== "atHome" && phase !== "leavingHome" && phase !== "enteringHome") return [];

  return [
    {
      sortY: getHomeNpcSortY(MARIA_HOME_X, MARIA_HOME_Y, phase, progress),
      order: -1,
      type: "npc",
      draw: drawMariaAtHome,
    },
  ];
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

// =========================
// "OCCUPIED" NA LOT (hiling ng user: "kapag meron ng occupied sa lot may
// exterior at interior na is dapat hindi na pwedeng malagyan pa ng ibang
// exterior or interior naka disabled na yung button liban na kung i sell")
// =========================
// TAPOS/OKUPADO na ang isang Lot kapag MAYROON na itong EXTERIOR **AT**
// INTERIOR - mapa-template man iyon (Coffee Shop/Tavern/Grocery/Garden
// House) o sariling upload. Mula sa puntong iyon, LOCKED na ito: hindi
// na puwedeng palitan ang Exterior, Interior, o Building style - ang
// TANGING paraan ay IBENTA/gibain muna ito (tingnan ang sellCustomHouse,
// 80% refund) at magsimulang muli.
//
// Ang tsek na ito ang IISANG pinagmumulan ng katotohanan - ginagamit ito
// ng UI (para ma-disable ang mga row/buton) AT ng mismong mga
// nagbabagong function (applyBuilderTemplateToHouse at ang dalawang
// upload handler) bilang panghuling depensa, kaya kahit sa paanuman
// makalusot ang isang click, hindi pa rin mababago ang bahay.
function isCustomHouseOccupied(house) {
  return !!(house && house.exteriorImageDataURL && house.interiorImageDataURL);
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
  // LOCKED na ang tapos nang bahay - tingnan ang isCustomHouseOccupied.
  if (isCustomHouseOccupied(house)) return false;

  house.templateId = template.id;
  house.doorPosition = template.doorPosition;
  house.exteriorImageDataURL = template.exteriorImagePath;
  house.interiorImageDataURL = template.interiorImagePath;

  // BAGO (kasabay ng per-template na kapal ng pader): ang GEOMETRY ng
  // interior ay galing na ngayon sa TEMPLATE, hindi na sa tier ng Lot -
  // kung hindi, itatayo ng buildSyntheticInteriorTmj ang pader sa MALING
  // pwesto (hal. 18x17 open + {5,2,2,2} = 22x24 na silid, samantalang
  // 20x20 lang ang PNG). GARANTISADO nang tugma ang PADDED na sukat
  // dahil iyon mismo ang sinusuri ng getBuilderTemplateFit sa itaas.
  //
  // Itinatabi muna ang SARILING sukat ng Lot bago patungan, para kung
  // sakaling maalis ang template balang araw, may maibabalik (sa ngayon,
  // ang tanging labasan ay ang pagbebenta - LOCKED ang isang tapos nang
  // Lot, tingnan ang isCustomHouseOccupied - pero mas ligtas nang
  // nakatago ito kaysa tuluyan nang mawala).
  if (!Number.isFinite(house.lotInteriorTilesWide)) {
    house.lotInteriorTilesWide = house.interiorTilesWide;
    house.lotInteriorTilesTall = house.interiorTilesTall;
  }

  house.interiorTilesWide = template.interiorTilesWide;
  house.interiorTilesTall = template.interiorTilesTall;

  if (template.interiorWallThickness) {
    house.interiorWallThickness = { ...template.interiorWallThickness };
  } else {
    delete house.interiorWallThickness;
  }

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

  return true;
}

// LUMANG saved house (bago pa ang door-position feature) - walang pang
// `doorPosition` field, kaya "bottom-center" na lang (ang dating
// FIXED/tanging posisyon) ang ipapalagay dito - walang mababago sa
// gawi ng mga ito.
function normalizeCustomHouseDoorPositions(house) {
  house.doorPosition = migrateBuilderDoorPositionId(house.doorPosition);
}

// AYOS (hiling ng user: "naapak kasi sa salamin" - VERIFIED sa
// screenshot: nakalalakad ang player sa arch na salamin sa itaas ng
// Garden House, ibig sabihin 2 row lang ang pader doon, hindi 5).
//
// SANHI: ang INTERIOR na geometry (interiorTilesWide/Tall +
// interiorWallThickness) ay isinusulat lang sa bahay sa SANDALING
// ITAYO ito (applyBuilderTemplateToHouse) - kaya ang isang bahay na
// NAKA-SAVE NA BAGO pa idinagdag ang per-template na kapal ng pader ay
// nananatili sa LUMANG 18x17 + default na {2,1,1,1}, at doon nakabatay
// ang itinatayong pader ng buildSyntheticInteriorTmj. Ang artwork ay
// awtomatikong nag-a-update (path lang ito, hindi kopya) - ang
// COLLISION lang ang naiwan, kaya nagkakabanggaan sila.
//
// AYOS: sa BAWAT pag-load, kung ang bahay ay galing sa isang template,
// KINUKUHA ULIT ang geometry mula MISMO sa template - ang template ang
// laging pinagkukunan ng katotohanan para sa sarili nitong artwork.
// Kaya hindi mo na kailangang ibenta at itayong muli ang mga naitayo
// mo na, at awtomatiko ring susunod ang mga ito sa anumang pag-ayos ng
// artwork/kapal balang araw.
function normalizeCustomHouseTemplateGeometry(house) {
  if (!house || !house.templateId) return;

  const template = getBuilderTemplateById(house.templateId);

  if (!template) return;

  if (Number.isFinite(template.interiorTilesWide)) {
    house.interiorTilesWide = template.interiorTilesWide;
  }

  if (Number.isFinite(template.interiorTilesTall)) {
    house.interiorTilesTall = template.interiorTilesTall;
  }

  if (template.interiorWallThickness) {
    house.interiorWallThickness = { ...template.interiorWallThickness };
  } else {
    delete house.interiorWallThickness;
  }

  house.doorPosition = template.doorPosition || house.doorPosition;
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
      normalizeCustomHouseTemplateGeometry(house);

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
// "STATIC" na COLLISIONS ng grassmap/grassmap2 (bahay/ground na naka-
// guhit sa MISMONG larawan, HIWALAY sa dynamic na puno/bato/baboy)
// =========================
//
// AYOS (hiling ng user): "kaya ba na di malagyan sa map yung may mga
// collisions except sa collision ng trees at stones at pig? meron
// kasi akong bahay at ground na may collisions nasa grassmap na tmj" -
// dating (tingnan ang lumang paliwanag sa itaas ng isBuilderTileFree)
// TINANGGAL nang TULUYAN ang pagsusuri laban sa "Collisions" object
// layer ng .tmj, dahil WALANG pangalan/type ang 23 (grassmap) / 32
// (grassmap2) na hugis doon - hindi malaman kung alin ang TALAGANG
// pader ng bahay/gilid ng ground kumpara sa dekorasyong bato lang.
//
// VERIFIED (in-render ang bawat hugis sa ibabaw ng grassmap.png/
// grassmap2.png para makita kung ano talaga ito): sa grassmap.tmj,
// ang id 8/9/10/11 ay ang bahay (pader+bubong), ang id 26/27/28/29/30/
// 31/32/33/38/39/41/42/43/44/47 ay ang gilid/bangin ng "ground" -
// LAHAT ng ito ay dapat humarang. Ang id 2/3/6/7 lang ang TALAGANG
// hiwalay na dekorasyong bato (malayo sa bahay/ground, tingnan ang
// larawan) - NA-TAG na ngayon ng `"type": "stone"` sa mismong .tmj
// (grassmap.tmj/snowgrassmap.tmj, parehong-pareho ang coordinates) -
// ito, kagaya ng TALAGANG puno/bato/baboy (dynamic, tingnan sa ibaba),
// ang HINDI dapat humarang. Sa grassmap2.tmj, LAHAT ng 32 hugis ay
// bahagi lang ng gilid ng "ground" (walang hiwalay na bato doon) -
// kaya wala itong "stone" na na-tag, LAHAT humaharang.
//
// "Remote" ang pag-fetch nito (hindi umaasa sa currentWorld/mapData) -
// PAREHONG dahilan ng "remote" na disenyo ng buong file na ito
// (tingnan ang paliwanag sa itaas ng getCustomHouseCollisionBoxes) -
// gumagamit ng SARILING fetch() dito ng .tmj (WORLDS[worldName].url),
// hindi ng snowUrl - VERIFIED magkaparehong-pareho (parehong
// coordinates/tag) ang normal at snow na bersyon, kaya isa lang ang
// kailangang kunin kahit anong panahon.
const BUILDER_STATIC_COLLISIONS_CACHE = {}; // worldName -> [{x,y,width,height}, ...]
const BUILDER_STATIC_COLLISIONS_LOADING = {}; // worldName -> Promise (habang naglo-load pa lang)

async function loadBuilderStaticCollisions(worldName) {
  if (BUILDER_STATIC_COLLISIONS_CACHE[worldName]) {
    return BUILDER_STATIC_COLLISIONS_CACHE[worldName];
  }

  if (BUILDER_STATIC_COLLISIONS_LOADING[worldName]) {
    return BUILDER_STATIC_COLLISIONS_LOADING[worldName];
  }

  const worldDef = typeof WORLDS !== "undefined" ? WORLDS[worldName] : null;
  const url = worldDef && worldDef.url;

  const promise = !url
    ? Promise.resolve([])
    : fetch(url)
        .then((response) => (response.ok ? response.json() : null))
        .then((map) => {
          if (!map || !Array.isArray(map.layers)) return [];

          const collisionLayer = map.layers.find(
            (layer) => layer.type === "objectgroup" && layer.name.toLowerCase() === "collisions",
          );

          if (!collisionLayer) return [];

          return collisionLayer.objects.filter((object) => {
            if (!(object.width > 0 && object.height > 0)) return false;

            // "stone" - dekorasyong bato na naka-guhit sa art (tingnan
            // ang paliwanag sa itaas) - HINDI ito dapat humarang sa
            // Lot, kaparehong trato ng TALAGANG puno/bato/baboy.
            const tag = (object.type || object.name || "").toLowerCase();

            return tag !== "stone";
          });
        })
        .catch(() => []);

  BUILDER_STATIC_COLLISIONS_LOADING[worldName] = promise;

  const result = await promise;

  BUILDER_STATIC_COLLISIONS_CACHE[worldName] = result;
  delete BUILDER_STATIC_COLLISIONS_LOADING[worldName];

  return result;
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

  // Bahay/ground lang (hindi trees/stones/pig - tingnan ang paliwanag
  // sa itaas ng loadBuilderStaticCollisions) - kung hindi pa
  // na-preload ang cache nito (dapat naka-await na ito bago binuksan
  // ang Map Picker, tingnan ang openBuilderMapPicker), basta laktawan
  // muna nang tahimik (dating gawi/permissive) sa halip na basta
  // ipagpalagay na "puno ang buong mapa".
  const staticBlockingBoxes = BUILDER_STATIC_COLLISIONS_CACHE[worldName];

  if (staticBlockingBoxes && staticBlockingBoxes.some((box) => isColliding(tileBox, box))) {
    return false;
  }

  // Ang DOORS (portal)/ibang custom house na lang ang TALAGANG
  // bumabawal na dating check dito - TINANGGAL na ang pag-check laban
  // sa TALAGANG posisyon ng player (dating "huwag i-overlap ang
  // player") - dahil "remote" na ito, hindi na TALAGANG naroon ang
  // player para ma-overlap.
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
async function openBuilderMapPicker(worldName, lotSize, lotName) {
  const bgImage = getBuilderMapPickerImage(worldName);
  const size = getBuilderWorldTileSize(worldName);

  if (!bgImage || !size) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("The map image is not ready yet - try again.");
    }
    return;
  }

  // I-PRELOAD (at i-AWAIT) muna ang bahay/ground na static collisions
  // ng mundong ito (tingnan ang loadBuilderStaticCollisions sa itaas)
  // BAGO buksan ang Picker - kaya sigurado nang tama (hindi basta
  // permissive/"puwede lahat") ang unang preview/pag-drag pa lang,
  // hindi na kailangang maghintay ng ikalawang tap/drag. Karaniwan
  // nang naka-cache na ito (parehong 2 mundo lang, matagal nang
  // na-buksan minsan), kaya halos instant lang ito sa totoong laro.
  await loadBuilderStaticCollisions(worldName);

  const mapWidthPx = size.tilesWide * TILE_SIZE;
  const mapHeightPx = size.tilesTall * TILE_SIZE;
  // Ang EXTERIOR footprint ng TIER na binili (hindi na ang lumang
  // FIXED na 10x8) - ito ang laki ng dina-drag na preview box, ang
  // sinusuring collision, at ang isinusulat sa bagong bahay.
  const lotExterior = getBuilderExteriorSize(lotSize);

  const overlay = document.createElement("div");

  overlay.className = "builder-panel-overlay";

  const panel = document.createElement("div");

  panel.className = "builder-map-picker-panel";

  const header = document.createElement("div");

  header.className = "builder-panel-header";
  header.innerHTML =
    "<span>" +
    (lotName ? lotName + " - " : "") +
    "drag to where you want to build (" +
    lotExterior.wide +
    "x" +
    lotExterior.tall +
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

  // =========================
  // "DRAG THEN CONFIRM" na FOOTER (hiling ng user: "kaya ba na
  // draggable yung paglagay ng box na 160x128 lot tapos kapag na drop
  // ko na is may confirmation if goods na kung cancel is mag drag ulit
  // ako") - lumalabas SA ILALIM ng canvas ang Cancel/Confirm sa
  // sandaling "idrop" (pointerup) ang 160x128 na preview box.
  // =========================
  const pickerFooter = document.createElement("div");

  pickerFooter.className = "builder-map-picker-footer";

  const pickerHint = document.createElement("p");

  pickerHint.className = "builder-panel-hint";

  const pickerActions = document.createElement("div");

  pickerActions.className = "builder-lot-actions";
  pickerActions.style.display = "none"; // lalabas lang PAGKA-DROP

  const cancelPlacementBtn = document.createElement("button");

  cancelPlacementBtn.type = "button";
  cancelPlacementBtn.className = "builder-secondary-btn";
  cancelPlacementBtn.textContent = "Cancel";

  const confirmPlacementBtn = document.createElement("button");

  confirmPlacementBtn.type = "button";
  confirmPlacementBtn.className = "builder-buy-btn";
  confirmPlacementBtn.textContent = "Confirm";

  pickerActions.appendChild(cancelPlacementBtn);
  pickerActions.appendChild(confirmPlacementBtn);
  pickerFooter.appendChild(pickerHint);
  pickerFooter.appendChild(pickerActions);

  panel.appendChild(header);
  panel.appendChild(worldTabs);
  panel.appendChild(pickerCanvas);
  panel.appendChild(pickerFooter);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // "Contain" fit - buong mapa, walang naputol, naka-SCALE lang
  // pababa (kaya "naka-zoom-out"/nakalatag makikita ang lahat) -
  // BINAWASAN ng kaunti ang budget (0.62, dating 0.72) para may lugar
  // pa ang bagong Cancel/Confirm footer sa ilalim, lalo na sa
  // maliliit na mobile screen.
  const maxWidth = Math.min(window.innerWidth * 0.9, 1000);
  const maxHeight = Math.min(window.innerHeight * 0.62, 700);
  const scale = Math.min(maxWidth / mapWidthPx, maxHeight / mapHeightPx);

  pickerCanvas.width = Math.round(mapWidthPx * scale);
  pickerCanvas.height = Math.round(mapHeightPx * scale);
  pickerCanvas.style.width = pickerCanvas.width + "px";
  pickerCanvas.style.height = pickerCanvas.height + "px";

  const pickerCtx = pickerCanvas.getContext("2d");

  pickerCtx.imageSmoothingEnabled = false;

  let hoverTile = null;
  // Naka-hawak ba (mouse button down / daliri naka-drag) ngayon? -
  // habang totoo ito, sinusundan ng box ang mouse/daliri.
  let isDragging = false;
  // Naka-drop na ba (Cancel/Confirm na ang lumalabas)? - habang totoo
  // ito, HINDI na muna puwedeng mag-umpisa ng bagong drag hanggang sa
  // pindutin ang Cancel.
  let awaitingConfirm = false;

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

  // Kinukulong ang itaas-kaliwang sulok (anchor) ng 160x128 na box sa
  // LOOB ng mapa - kung idinrag hanggang sa gilid/dulo, i-CLAMP na
  // lang ito sa halip na basta tanggihan/mag-snap-back sa dati.
  function clampLotAnchor(tile) {
    return {
      col: Math.max(0, Math.min(tile.col, size.tilesWide - lotExterior.wide)),
      row: Math.max(0, Math.min(tile.row, size.tilesTall - lotExterior.tall)),
    };
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
        lotExterior.wide,
        lotExterior.tall,
      );

      pickerCtx.fillStyle = placeable ? "rgba(120, 230, 140, 0.5)" : "rgba(255, 80, 80, 0.5)";
      pickerCtx.strokeStyle = placeable ? "rgba(140, 255, 160, 0.95)" : "rgba(255, 100, 100, 0.95)";
      // Mas makapal ang outline (3 kaysa 2) habang nakalutang/naka-drop
      // na ito (awaitingConfirm) - dagdag na senyales na "naka-lock" na
      // ito, hinihintay na lang ang Cancel/Confirm.
      pickerCtx.lineWidth = awaitingConfirm ? 3 : 2;

      const boxX = hoverTile.col * TILE_SIZE * scale;
      const boxY = hoverTile.row * TILE_SIZE * scale;
      const boxW = lotExterior.wide * TILE_SIZE * scale;
      const boxH = lotExterior.tall * TILE_SIZE * scale;

      pickerCtx.fillRect(boxX, boxY, boxW, boxH);
      pickerCtx.strokeRect(boxX, boxY, boxW, boxH);
    }
  }

  // Iisang function na lang ang TALAGANG naghahawak/nagre-redraw ng
  // hoverTile - ginagamit ito ng desktop "mousemove" (bago pa ma-press,
  // basta preview) AT ng "pointerdown"/"pointermove" (habang TALAGANG
  // naka-drag, mouse man o daliri).
  function setHoverFromEvent(event) {
    const tile = eventToTile(event);

    if (!tile) return;

    hoverTile = clampLotAnchor(tile);
    redrawPicker();
    updatePickerFooter();
  }

  // Ina-update ang hint text sa ilalim + kung "Confirm" ay puwede
  // (disabled kapag may nakaharang sa kasalukuyang posisyon).
  function updatePickerFooter() {
    pickerActions.style.display = awaitingConfirm ? "flex" : "none";

    if (!awaitingConfirm) {
      pickerHint.textContent = hoverTile
        ? "Drag to reposition, then release to drop it here."
        : "Tap and drag on the map to position the house, then release.";
      return;
    }

    const placeable = isBuilderFootprintFree(
      worldName,
      hoverTile.col,
      hoverTile.row,
      lotExterior.wide,
      lotExterior.tall,
    );

    pickerHint.textContent = placeable
      ? 'Build "' + (lotName || "this house") + '" here?'
      : "Something is blocking this spot - Cancel, then drag it somewhere else.";
    confirmPlacementBtn.disabled = !placeable;
  }

  // Desktop-only na "hover" (walang naka-press) - hindi ito umaandar sa
  // touchscreen (walang totoong hover state doon), kaya't harmless lang
  // itong idagdag sa ibabaw ng pointer events sa ibaba.
  pickerCanvas.addEventListener("mousemove", (event) => {
    if (isDragging || awaitingConfirm) return;
    setHoverFromEvent(event);
  });

  // =========================
  // TALAGANG PAG-DRAG (mouse o daliri, iisang code path na - Pointer
  // Events) - "pointerdown" i-a-ARM ang box sa tinapa/kinlik na tile,
  // "pointermove" (habang naka-hawak) susunod ang box, "pointerup"
  // ("drop") ang magpapalabas ng Cancel/Confirm sa ibaba.
  // =========================
  pickerCanvas.addEventListener("pointerdown", (event) => {
    if (awaitingConfirm) return; // naka-lock muna hanggang sa Cancel

    isDragging = true;
    pickerCanvas.setPointerCapture(event.pointerId);
    setHoverFromEvent(event);
  });

  pickerCanvas.addEventListener("pointermove", (event) => {
    if (!isDragging || awaitingConfirm) return;
    setHoverFromEvent(event);
  });

  function dropPlacement() {
    if (!isDragging) return;

    isDragging = false;

    if (hoverTile) {
      awaitingConfirm = true;
      updatePickerFooter();
      redrawPicker();
    }
  }

  pickerCanvas.addEventListener("pointerup", dropPlacement);
  pickerCanvas.addEventListener("pointercancel", () => {
    isDragging = false;
  });

  // AYOS (hiling ng user): "kung cancel is mag drag ulit ako hanggang sa
  // maging ok na ako sa position" - HINDI tinatanggal ang box sa Cancel,
  // basta binabalik lang ito sa "puwedeng i-drag ulit" na mode - naka-
  // panatili pa rin ang huling posisyon nito bilang panimula.
  cancelPlacementBtn.addEventListener("click", () => {
    awaitingConfirm = false;
    updatePickerFooter();
    redrawPicker();
  });

  confirmPlacementBtn.addEventListener("click", () => {
    if (!hoverTile || confirmPlacementBtn.disabled) return;

    const tile = hoverTile;

    if (
      !isBuilderFootprintFree(
        worldName,
        tile.col,
        tile.row,
        lotExterior.wide,
        lotExterior.tall,
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
      tilesWide: lotExterior.wide,
      tilesTall: lotExterior.tall,
      // Itinatabi rin ang MISMONG tier id - para malaman ng Building
      // tab/template fit kung saang tier galing ang bahay kahit
      // mabago pa ang mga numero balang araw.
      lotSizeId: lotSize.id,
      exteriorTilesWide: lotExterior.wide,
      exteriorTilesTall: lotExterior.tall,
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

  updatePickerFooter();
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

// =========================
// PER-TEMPLATE NA KAPAL NG PADER (hiling ng user, para sa Garden House:
// "yung tiles niya kasi is 16x16 so yun top collisions na 5 tapos sa
// left 2 sa right 2 sa bottom 2")
// =========================
// Ang BUILDER_INTERIOR_WALL_THICKNESS sa itaas ang DEFAULT pa rin para
// sa LAHAT ng Lot at sa LAHAT ng sarili mong upload (walang nagbago
// doon) - PERO puwede na ngayong magdala ang isang Building template
// (o ang isang bahay na naaplayan na nito) ng SARILI nitong `top/
// bottom/left/right`, dahil hindi pantay-pantay ang kapal ng pader sa
// bawat artwork: ang Garden House ay may MATAAS na pader/bintana sa
// itaas (5 tile) at makakapal na gilid (2 tile bawat isa).
//
// MAHALAGA: kahit anong kapal, dapat PAREHO pa rin ang PADDED na sukat
// (open floor + pader) ng template at ng Lot - iyon ang TALAGANG laki
// ng PNG at ng silid mismo. Ito na ngayon ang sinusuri ng
// getBuilderTemplateFit (dating ang OPEN na sukat ang pinagtutugma).
// Hal. Garden House: 16x13 na open + {5,2,2,2} = 20x20 padded = 320x320
// px - KAPAREHONG-PAREHO ng "Tall" na Lot (18x17 open + {2,1,1,1}).
function getBuilderInteriorWallThickness(source) {
  const custom = source && source.interiorWallThickness;

  if (
    custom &&
    Number.isFinite(custom.top) &&
    Number.isFinite(custom.bottom) &&
    Number.isFinite(custom.left) &&
    Number.isFinite(custom.right)
  ) {
    return custom;
  }

  return BUILDER_INTERIOR_WALL_THICKNESS;
}

// { wide, tall } ng BUONG interior room (kasama na ang padding) - ang
// `tilesWide`/`tilesTall` dito ay ang OPEN/WALKABLE na sukat (parehong
// sukat ng Exterior Lot, house.tilesWide/tilesTall).
function getBuilderInteriorPaddedSize(tilesWide, tilesTall, thickness) {
  const T = getBuilderInteriorWallThickness({ interiorWallThickness: thickness });

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
function getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition, thickness) {
  const { wall, doorWidth, startOffset } = getBuilderDoorwayInfo(
    tilesWide,
    tilesTall,
    doorPosition,
  );
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall, thickness);
  const T = getBuilderInteriorWallThickness({ interiorWallThickness: thickness });

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

function getBuilderInteriorDoorAreaPx(tilesWide, tilesTall, doorPosition, thickness) {
  const rect = getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition, thickness);

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
function buildBuilderPerimeterWallRects(tilesWide, tilesTall, doorPosition, thickness) {
  const { wall } = getBuilderDoorwayInfo(tilesWide, tilesTall, doorPosition);
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall, thickness);
  const T = getBuilderInteriorWallThickness({ interiorWallThickness: thickness });
  const doorRect = getBuilderInteriorDoorTileRect(tilesWide, tilesTall, doorPosition, thickness);
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
function buildSyntheticInteriorTmj(tilesWide, tilesTall, doorPosition, thickness) {
  const padded = getBuilderInteriorPaddedSize(tilesWide, tilesTall, thickness);
  const rects = buildBuilderPerimeterWallRects(tilesWide, tilesTall, doorPosition, thickness);
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
function getBuilderInteriorDoorSpawnPx(tilesWide, tilesTall, doorPosition, direction, thickness) {
  const area = getBuilderInteriorDoorAreaPx(tilesWide, tilesTall, doorPosition, thickness);
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
    area: getBuilderInteriorDoorAreaPx(
      house.interiorTilesWide,
      house.interiorTilesTall,
      house.doorPosition,
      getBuilderInteriorWallThickness(house),
    ),
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

// =========================
// ISKEDYUL NG GROCERY - SI MARIA AT SI JOSEPH (hiling ng user)
// =========================
// "gusto ko kasi na pumupunta lang sila ng grocery kapag umaga...
// halimbawa galing silang kanya kanyang bahay 7am is aalis na sila ng
// bahay nila maglalakad papuntang grocery eenter tapos pwepwesto sa
// pwesto nila tapos mga bandang 4:30pm is aalis na sila sa grocery
// babalik na sa kanila kanilang bahay"
//
// MAHALAGANG PALIWANAG (para malinaw ang ginawa, hindi lang basta
// tahimik na nag-iba): ang laro ay HIWA-HIWALAY na mundo bawat isa
// (grassmap/town/josephHouse/mga custom house), IPINAGDUDUGTONG lang
// ng mga PINTUAN na direktang nagte-TELEPORT - walang isang tuloy-
// tuloy na daigdig na malalakaran mula bahay hanggang grocery. Kung
// susundin nang literal ang hiling ("galing sa bahay, lumalakad
// papuntang grocery"), kakailanganin ng: sariling bahay/posisyon si
// Maria (wala pa siyang isa), isang RUTA sa outdoor na mundo mula sa
// bawat bahay papunta sa pinto ng grocery, at isang "pathfinding" na
// sistema na umiiwas sa mga puno/bato/ibang bahay - malaking bagong
// sistema ito, at hindi ko ito magagawa nang maayos nang hindi
// masubukan.
//
// ANG GINAWA KO SA HALIP (parehong resulta, mas ligtas na saklaw): ang
// "paglalakad" ay ipinapakita SA LOOB MISMO ng Grocery - mula sa
// PINTUAN papunta sa kani-kanilang puwesto sa umaga (gamit ang WALK na
// animation), at mula puwesto pabalik sa pintuan sa hapon (saka
// nawawala - ipinapalagay na "umuwi na"). Bago mag-7am at pagkatapos
// ng 4:30pm, WALANG makikita kahit sino sa kanila - ganoon din ang
// gawi kung wala ka sa Grocery habang nagbabago ang oras (sa susunod
// mong pagpasok, nasa kani-kanilang tamang estado na sila base sa
// ORAS, hindi kailangang panoorin ang buong paglalakad).
//
// SI JOSEPH: pinananatili ko siyang LAGING nasa "josephHouse" (hindi
// ko siya inalis doon kahit kailan) - iyon ang TANGING paraan para
// makausap siya tungkol sa Builder feature, at kung tatanggalin siya
// roon sa oras ng "trabaho", MAWAWALA ang access sa pagtatayo ng bahay
// nang kalahati ng araw. Ang bersyon niya sa Grocery ay ISANG
// KARAGDAGANG PAGPAPAKITA lang ng parehong karakter (parehong sprite,
// hiwalay lang na "puwesto") - kung MALI ang pagkakaunawa kong ito,
// sabihin mo lang.

// 7:00 AM hanggang 4:30 PM (24-oras na format: 7 hanggang 16.5).
const NPC_WORKDAY_START_HOUR = 7;
const NPC_WORKDAY_END_HOUR = 16.5;

// Ilang TOTOONG segundo (hindi in-game) ang tagal ng paglalakad papasok/
// palabas SA LOOB ng Grocery - TUNABLE ito, walang partikular na dahilan
// bakit 18 segundo bukod sa "sapat na makita ang buong animation nang
// hindi masyadong matagal". 1 in-game oras = 75 totoong segundo
// (DAY_NIGHT_SECONDS=1800 segundo bawat 24 na in-game oras), kaya 18
// segundo ay bahagya lamang sa loob ng 9.5 oras na "shift".
const NPC_WALK_DURATION_MS = 18000;

// AYOS (ikalawang round, hiling ng user: "gusto ko kasi actual silang
// maglalakad papuntang grocery... yung shadow nila... nasa ilalim lang
// ng character"): DAGDAG na SEGMENT SA LABAS ng bahay - bago sila
// "pumasok" (bago 7am) at pagkatapos "lumabas" (pagkatapos 4:30pm),
// TALAGANG may makikita kang paglalakad SA LABAS (grassmap/grassmap2,
// kung saan man naka-tayo ang Grocery) - mula sa isang puntong ILANG
// TILE ang layo sa pintuan, papunta/pabalik doon. Hindi pa rin ito
// buong "galing sa sariling bahay" (tingnan ang paliwanag sa itaas kung
// bakit hindi pa iyon ligtas gawin nang hindi nasusubukan) - pero
// TALAGA nang may nakikitang paglalakad SA LABAS ng gusali, hindi na
// lang sa loob.
const NPC_OUTDOOR_APPROACH_MS = 15000;
const NPC_OUTDOOR_APPROACH_TILES = 3;

// Ilang TOTOONG segundo ang tagal ng paglalakad SA LOOB ng SARILING
// BAHAY nila (puwesto <-> pintuan ng mariaHouse/josephHouse) - hiling
// ng user: "dapat maglakad sila galing sa bahay tapos lalabas".
const NPC_HOME_WALK_DURATION_MS = 10000;

// Puntos sa TILES, PADDED na coordinate frame ng Grocery interior -
// hiling ng user: "sa loob 4 row tapos center" (Maria), "tabi sila ni
// maria may pagitan lang na 2 tiles" (Joseph). Ang 20-tile na lapad ay
// pantay na nahahati sa 10, kaya doon nakatayo si Maria; si Joseph naman
// ay 2 tile ang pagitan (cols 11-12 na walang laman sa pagitan nila).
const MARIA_SPOT_COL = 10;
const MARIA_SPOT_ROW = 4;
const JOSEPH_GROCERY_SPOT_COL = 13;
const JOSEPH_GROCERY_SPOT_ROW = 4;

const GROCERY_TEMPLATE_ID = "grocery";

// Ang PINTUAN ng Grocery bilang PAANAN sa pixels (kung saan sila
// "pumapasok"/"umaalis") - KINUKUHA mula MISMO sa geometry ng template
// (hindi hardcoded na numero), kaya kung sakaling magbago balang araw
// ang laki/posisyon ng pintuan ng Grocery, awtomatiko itong susunod.
// Naka-cache dahil static naman ang geometry ng isang template.
let groceryDoorFootPositionCache = null;

function getGroceryDoorFootPosition() {
  if (groceryDoorFootPositionCache) return groceryDoorFootPositionCache;

  const template = getBuilderTemplateById(GROCERY_TEMPLATE_ID);

  if (!template) return null;

  const thickness = getBuilderInteriorWallThickness(template);
  const padded = getBuilderInteriorPaddedSize(
    template.interiorTilesWide,
    template.interiorTilesTall,
    thickness,
  );
  const doorRect = getBuilderInteriorDoorTileRect(
    template.interiorTilesWide,
    template.interiorTilesTall,
    template.doorPosition,
    thickness,
  );

  // "bottom-center" ang doorPosition ng Grocery (tingnan ang
  // BUILDER_BUILDING_TEMPLATES) - kaya ang PAANAN nila sa pintuan ay
  // nasa ILALIM mismo ng silid (padded.tall), gitna ng lapad ng notch.
  groceryDoorFootPositionCache = {
    x: (doorRect.col + doorRect.width / 2) * TILE_SIZE,
    y: padded.tall * TILE_SIZE,
  };

  return groceryDoorFootPositionCache;
}

// Nasa loob ba tayo ngayon ng isang Grocery interior? `true`/`false`.
function isInsideGroceryInterior() {
  if (typeof currentWorld === "undefined" || !currentWorld) return false;
  if (typeof customHouses === "undefined" || !Array.isArray(customHouses)) return false;

  const house = customHouses.find(
    (entry) => getCustomHouseInteriorWorldName(entry) === currentWorld,
  );

  return !!house && house.templateId === GROCERY_TEMPLATE_ID;
}

// Ang KASALUKUYANG YUGTO ng "araw" nila, PURONG kwenta mula sa oras
// (walang itinatabing estado - kaya AWTOMATIKONG tama kahit kailan mo
// pa sila tingnan, hindi kailangang "buhayin"/i-simulate ang oras na
// hindi mo pinapanood):
//
//   "atHome"      - SA BAHAY nila (mariaHouse/josephHouse), nakatayo
//   "leavingHome" - SA LOOB ng bahay, galing sa puwesto patungong pintuan
//   "approaching" - SA LABAS (grassmap/grassmap2), papunta sa Grocery
//   "walkingIn"   - SA LOOB ng Grocery, galing sa pintuan patungong puwesto
//   "atWork"      - SA LOOB ng Grocery, nakatayo sa puwesto
//   "walkingOut"  - SA LOOB ng Grocery, galing sa puwesto patungong pintuan
//   "leaving"     - SA LABAS, palayo sa Grocery, pabalik sa bahay
//   "enteringHome"- SA LOOB ng bahay, galing sa pintuan patungong puwesto
//
// `progress` (0..1) - gaano na katapos ang segment na iyon.
//
// AYOS (hiling ng user): "dapat maglakad sila galing sa bahay tapos
// lalabas dapat realtime din sumasabay sa oras" - dagdag na 2 YUGTO
// (leavingHome/enteringHome) BAGO/PAGKATAPOS ng "approaching"/"leaving"
// - kaya may TALAGANG makikita kang paglabas/pagpasok sa SARILING bahay
// nila (mariaHouse/josephHouse), hindi lang basta "biglang nawala/
// biglang lumitaw" sa gilid ng Grocery.
//
// MAHALAGANG LIMITASYON (sinasabi nang malinaw): ang "town" (kung nasaan
// ang mga bahay) at ang "grassmap"/"grassmap2" (kung saan lang puwedeng
// itayo ang Grocery) ay MAGKAIBANG mundo - walang direktang lakaran sa
// pagitan nila kundi sa pamamagitan ng gate (isa pang pintuan). Kaya sa
// SANDALING lumabas sila sa pintuan ng bahay nila SA TOWN, "nawawala"
// muna sila hanggang sa lumitaw sila sa tabi ng Grocery SA grassmap/
// grassmap2 (parehong oras, magkaibang mundo) - hindi ito isang tuloy-
// tuloy na paglalakad na makikita mo sa IISANG panonood, dahil hindi
// puwedeng magkasabay ang manlalaro sa DALAWANG mundo. Ito ang pinaka-
// malapit na magagawa nang hindi ko kailangang bumuo ng buong
// pathfinding papuntang/palabas ng gate.
function getNpcSchedulePhase() {
  const dayMs = DAY_NIGHT_SECONDS * 1000;
  const msIntoDay = ((getGameNow() % dayMs) + dayMs) % dayMs;
  const startMs = (NPC_WORKDAY_START_HOUR / 24) * dayMs;
  const endMs = (NPC_WORKDAY_END_HOUR / 24) * dayMs;
  const approachStartMs = startMs - NPC_OUTDOOR_APPROACH_MS;
  const leaveEndMs = endMs + NPC_OUTDOOR_APPROACH_MS;
  const homeLeaveStartMs = approachStartMs - NPC_HOME_WALK_DURATION_MS;
  const homeEnterEndMs = leaveEndMs + NPC_HOME_WALK_DURATION_MS;

  if (msIntoDay >= homeLeaveStartMs && msIntoDay < approachStartMs) {
    return {
      phase: "leavingHome",
      progress: (msIntoDay - homeLeaveStartMs) / NPC_HOME_WALK_DURATION_MS,
    };
  }

  if (msIntoDay >= approachStartMs && msIntoDay < startMs) {
    return {
      phase: "approaching",
      progress: (msIntoDay - approachStartMs) / NPC_OUTDOOR_APPROACH_MS,
    };
  }

  if (msIntoDay >= startMs && msIntoDay < startMs + NPC_WALK_DURATION_MS) {
    return {
      phase: "walkingIn",
      progress: (msIntoDay - startMs) / NPC_WALK_DURATION_MS,
    };
  }

  if (msIntoDay >= startMs + NPC_WALK_DURATION_MS && msIntoDay < endMs - NPC_WALK_DURATION_MS) {
    return { phase: "atWork", progress: 0 };
  }

  if (msIntoDay >= endMs - NPC_WALK_DURATION_MS && msIntoDay < endMs) {
    return {
      phase: "walkingOut",
      progress: (msIntoDay - (endMs - NPC_WALK_DURATION_MS)) / NPC_WALK_DURATION_MS,
    };
  }

  if (msIntoDay >= endMs && msIntoDay < leaveEndMs) {
    return { phase: "leaving", progress: (msIntoDay - endMs) / NPC_OUTDOOR_APPROACH_MS };
  }

  if (msIntoDay >= leaveEndMs && msIntoDay < homeEnterEndMs) {
    return {
      phase: "enteringHome",
      progress: (msIntoDay - leaveEndMs) / NPC_HOME_WALK_DURATION_MS,
    };
  }

  return { phase: "atHome", progress: 0 };
}

// =========================
// ANG PAGLALAKAD SA LABAS (approaching/leaving) - hiling ng user:
// "gusto ko kasi actual silang maglalakad papuntang grocery"
// =========================
// Kinukuha ang unang Grocery na natagpuan (kung sakaling MARAMI, hanggang
// 2 - BUILDER_TEMPLATE_MAX_COUNT - iisa lang ang "ginagamit" para sa
// pisikal na paglalakad sa labas, para hindi magkadoble sina Maria/
// Joseph sa magkaibang panig ng mapa kung sabay silang malapit sa
// player - limitasyon ito, sinasadya, TUNAY namang bihira ang 2 Grocery.
function getScheduledGroceryHouse() {
  if (typeof customHouses === "undefined" || !Array.isArray(customHouses)) return null;

  return customHouses.find((entry) => entry.templateId === GROCERY_TEMPLATE_ID) || null;
}

// { doorThreshold, spawn } sa WORLD-SPACE pixels ng `house.world`
// (grassmap/grassmap2) - "doorThreshold" ay eksaktong nasa pintuan mismo
// (labas), "spawn" ay ilang tile (NPC_OUTDOOR_APPROACH_TILES) PALAYO sa
// direksyon KUNG SAAN NAKAHARAP ang pintuan (kaya laging "malinis"/walang
// bagay ang landas - kaparehong direksyon kung saan lumalabas ang
// PLAYER mismo, tingnan ang getBuilderSpawnPxForDoorArea).
function getGroceryExteriorApproachPoints(house) {
  const colPx = house.col * TILE_SIZE;
  const rowPx = house.row * TILE_SIZE;
  const area = getBuilderDoorAreaPx(
    colPx,
    rowPx,
    house.tilesWide,
    house.tilesTall,
    house.doorPosition,
  );
  const { wall } = getBuilderDoorwayInfo(house.tilesWide, house.tilesTall, house.doorPosition);

  let doorThreshold;
  let awayDx = 0;
  let awayDy = 0;

  if (wall === "bottom") {
    doorThreshold = { x: area.x + area.width / 2, y: rowPx + house.tilesTall * TILE_SIZE };
    awayDy = 1;
  } else if (wall === "top") {
    doorThreshold = { x: area.x + area.width / 2, y: rowPx };
    awayDy = -1;
  } else if (wall === "left") {
    doorThreshold = { x: colPx, y: area.y + area.height / 2 };
    awayDx = -1;
  } else {
    doorThreshold = { x: colPx + house.tilesWide * TILE_SIZE, y: area.y + area.height / 2 };
    awayDx = 1;
  }

  const spawn = {
    x: doorThreshold.x + awayDx * NPC_OUTDOOR_APPROACH_TILES * TILE_SIZE,
    y: doorThreshold.y + awayDy * NPC_OUTDOOR_APPROACH_TILES * TILE_SIZE,
  };

  return { doorThreshold, spawn };
}

// Ibinabalik ang { x, y } (paanan) NGAYON, SA LABAS ng Grocery - o
// `null` kung hindi tugma ang kasalukuyang mundo/yugto (wala dapat
// iguhit sa labas ngayon).
function getGroceryOutdoorNpcPosition() {
  const house = getScheduledGroceryHouse();

  if (!house) return null;
  if (typeof currentWorld === "undefined" || currentWorld !== house.world) return null;

  const { phase, progress } = getNpcSchedulePhase();

  if (phase !== "approaching" && phase !== "leaving") return null;

  const { doorThreshold, spawn } = getGroceryExteriorApproachPoints(house);

  if (phase === "approaching") {
    return {
      x: lerp(spawn.x, doorThreshold.x, progress),
      y: lerp(spawn.y, doorThreshold.y, progress),
      dirX: doorThreshold.x - spawn.x,
      dirY: doorThreshold.y - spawn.y,
    };
  }

  // "leaving"
  return {
    x: lerp(doorThreshold.x, spawn.x, progress),
    y: lerp(doorThreshold.y, spawn.y, progress),
    dirX: spawn.x - doorThreshold.x,
    dirY: spawn.y - doorThreshold.y,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// =========================
// COLLISION-SAFE NA RUTA (hiling ng user: "di sila nakakapag lakad sa
// mismong may collisions")
// =========================
// Ang dating diretsong-linya (door -> spot) ay puwedeng dumaan sa
// PADER kung malayo ang X ng puwesto sa X ng pintuan (hal. si Joseph,
// 2 tile ang layo sa gilid ng notch ng pintuan) - habang MABABA pa ang
// NPC (malapit pa sa hilera ng pader), puwede siyang "lumihis" papunta
// sa isang column na SARADO pa doon sa taas na iyon.
//
// AYOS: sa halip na isang tuwid na linya, dalawang SEGMENT (isang "L"
// na hugis) ang nilalakaran - (1) DERETSONG PAITAAS mula sa pintuan,
// eksaktong nasa X ng pintuan mismo (kaya laging nasa LOOB ng notch ng
// pintuan habang nasa taas ng pader), (2) PAHALANG papunta sa puwesto,
// SAKA lang ito nangyayari - matapos umakyat lampas sa pader, kung
// saan BUKAS na ang buong sahig (walang pader sa gitna). GARANTISADO
// itong ligtas KAHIT ANONG puwesto/pintuan, dahil ang sahig sa loob ng
// isang bahay ay LAGING bukas maliban sa mismong hangganan ng pader.
// PANSIN: kahit "Grocery" ang pangalan nito, GENERIC na talaga ang
// hugis (parehong "L" na ruta, kahit anong doorPos/spot) - ginagamit
// din ito para sa paglalakad SA LOOB ng SARILING BAHAY nila
// (mariaHouse/josephHouse, tingnan ang drawHomeNpc sa ibaba), doorPos
// na lang ang ipinapalit (HOUSE_DOOR_FOOT_POSITION sa halip na
// getGroceryDoorFootPosition()).
function buildGroceryWalkPath(doorPos, spotX, spotY) {
  return [
    { x: doorPos.x, y: doorPos.y },
    { x: doorPos.x, y: spotY },
    { x: spotX, y: spotY },
  ];
}

// Ibinabalik ang { x, y, dirX, dirY } sa distansyang `t` (0..1) sa
// kahabaan ng isang polyline - PANTAY na bilis sa magkabilang segment
// (batay sa TALAGANG haba nito, hindi basta bilang ng segment), kaya
// hindi biglaang bumibilis/bumabagal ang NPC sa sulok.
function getPointAlongPath(points, t) {
  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.hypot(dx, dy);

    segments.push({ from: points[i], to: points[i + 1], length, dx, dy });
    totalLength += length;
  }

  if (totalLength <= 0) {
    const p = points[0];

    return { x: p.x, y: p.y, dirX: 0, dirY: 0 };
  }

  let target = Math.max(0, Math.min(1, t)) * totalLength;

  for (const seg of segments) {
    if (target <= seg.length || seg === segments[segments.length - 1]) {
      const segT = seg.length > 0 ? target / seg.length : 1;

      return {
        x: lerp(seg.from.x, seg.to.x, segT),
        y: lerp(seg.from.y, seg.to.y, segT),
        dirX: seg.dx,
        dirY: seg.dy,
      };
    }

    target -= seg.length;
  }

  const last = points[points.length - 1];

  return { x: last.x, y: last.y, dirX: 0, dirY: 0 };
}

// Direksyon ng sprite (up/down/left/right) base sa TALAGANG galaw sa
// segment na iyon - hindi na basta "up palagi kapag papasok".
function getWalkDirectionFromDelta(dirX, dirY) {
  if (Math.abs(dirX) > Math.abs(dirY)) return dirX >= 0 ? "right" : "left";

  return dirY >= 0 ? "down" : "up";
}

// Iginuguhit ang isang NPC gamit ang WALK na sprite (kaparehong-pareho
// ng ginagamit ng player - assets/character/walk/...), naka-anchor sa
// PAANAN, "up" na direksyon kapag papasok, "down" kapag papalabas
// (palagi, dahil VERTICAL ang galaw nila mula pintuan patungong
// puwesto - malayo ang pintuan sa ibaba, malapit sa itaas ang puwesto).
function drawNpcWalkCharacter(feetX, feetY, direction, frameOffset) {
  if (typeof sprites === "undefined" || !sprites.walk) return;

  const sprite = sprites.walk[direction];

  if (!sprite || !sprite.complete || !sprite.width) return;

  const width = typeof player !== "undefined" ? player.width : 56;
  const height = typeof player !== "undefined" ? player.height : 64;
  const boxY = feetY - height;

  // Kaparehong-pareho ng ayos sa drawNpcIdleCharacter sa itaas - EKSAKTONG
  // kopya ng formula ng TALAGANG anino ng player (drawPlayerShadow).
  const footRatio = typeof PLAYER_FOOT_RATIO === "number" ? PLAYER_FOOT_RATIO : 51 / 64;

  if (typeof drawGroundShadow === "function") {
    drawGroundShadow(feetX, boxY + height * footRatio, width * 0.3, {
      heightRatio: 0.25,
      blur: 3,
      alpha: 0.35,
    });
  }

  // 10 frame ang up/down, 7 ang left/right - kaparehong-pareho ng
  // getPlayerAnimationFrameCount (player.js).
  const frameCount = direction === "up" || direction === "down" ? 10 : 7;
  const frameWidth = sprite.width / frameCount;
  // Bahagyang mas mabilis kaysa idle (NPC_IDLE_FRAME_MS) - parang
  // TALAGANG naglalakad, hindi lang basta umiindayog nang nakatayo.
  const frameIndex =
    (Math.floor(Date.now() / 110) + (frameOffset || 0)) % frameCount;

  ctx.imageSmoothingEnabled = false;

  const boxX = feetX - width / 2;

  let destX = boxX;
  let destY = boxY;
  let destWidth = width;
  let destHeight = height;

  if (typeof getSpriteCropDestRect === "function") {
    const rect = getSpriteCropDestRect("walk." + direction, boxX, boxY, width, height);

    destX = rect[0];
    destY = rect[1];
    destWidth = rect[2];
    destHeight = rect[3];
  }

  ctx.drawImage(
    sprite,
    frameIndex * frameWidth,
    0,
    frameWidth,
    sprite.height,
    destX,
    destY,
    destWidth,
    destHeight,
  );
}

// Ang PANGKALAHATANG "guhitin ang NPC na ito ngayon" - iisa lang ang
// function na ito, ginagamit ng PAREHONG Maria at ng Grocery na bersyon
// ni Joseph (parehong iskedyul, magkaibang puwesto/pangalan lang).
// SA LOOB (walkingIn/atWork/walkingOut) O SA LABAS (approaching/leaving)
// - dalawang lugar na ito ang PUWEDENG pagmulan ng guhit, depende sa
// KASALUKUYANG mundo at yugto. Ibinabalik ang PAANANG posisyon na
// TALAGANG ginamit (kailangan ito ng Y-sort), o `null` kung walang
// dapat iguhit dito ngayon.
function drawScheduledGroceryNpc(spotCol, spotRow, frameOffset) {
  // SA LABAS (approaching/leaving) - kaparehong-pareho ang batayan ng
  // Maria at Joseph dito (parehong Grocery house/pintuan naman ang
  // pinagmumulan), kaya IISA lang silang parehong posisyon SA LABAS -
  // TABI-TABI (offset ng ilang piksel base sa frameOffset) para hindi
  // sila TALAGANG magkapatong.
  const outdoor = getGroceryOutdoorNpcPosition();

  if (outdoor) {
    const sideOffset = (frameOffset || 0) * 6 - 9; // maliit na spread lang
    const x = outdoor.x + sideOffset;
    const direction = getWalkDirectionFromDelta(outdoor.dirX, outdoor.dirY);

    drawNpcWalkCharacter(x, outdoor.y, direction, frameOffset);
    return { x, y: outdoor.y };
  }

  if (!isInsideGroceryInterior()) return null;

  const doorPos = getGroceryDoorFootPosition();

  if (!doorPos) return null;

  const spotX = spotCol * TILE_SIZE + TILE_SIZE / 2;
  const spotY = spotRow * TILE_SIZE + TILE_SIZE;
  const { phase, progress } = getNpcSchedulePhase();

  if (phase === "atWork") {
    drawNpcIdleCharacter(spotX, spotY, frameOffset);
    return { x: spotX, y: spotY };
  }

  if (phase === "walkingIn") {
    const path = buildGroceryWalkPath(doorPos, spotX, spotY);
    const point = getPointAlongPath(path, progress);
    const direction = getWalkDirectionFromDelta(point.dirX, point.dirY);

    drawNpcWalkCharacter(point.x, point.y, direction, frameOffset);
    return { x: point.x, y: point.y };
  }

  if (phase === "walkingOut") {
    // PAREHONG ruta, PABALIKTAD lang (spot -> pintuan).
    const path = buildGroceryWalkPath(doorPos, spotX, spotY).reverse();
    const point = getPointAlongPath(path, progress);
    const direction = getWalkDirectionFromDelta(point.dirX, point.dirY);

    drawNpcWalkCharacter(point.x, point.y, direction, frameOffset);
    return { x: point.x, y: point.y };
  }

  return null;
}

function drawMaria() {
  drawScheduledGroceryNpc(MARIA_SPOT_COL, MARIA_SPOT_ROW, 3);
}

function drawJosephAtGrocery() {
  drawScheduledGroceryNpc(JOSEPH_GROCERY_SPOT_COL, JOSEPH_GROCERY_SPOT_ROW, 0);
}

// Kasama sa Y-sort - `sortY` ay batay sa KASALUKUYANG (paglalakad man o
// nakatayo, sa labas man o sa loob) posisyon, kaya tama pa rin ang
// lalim niya laban sa player/puno/bato habang gumagalaw.
function getMariaDrawables() {
  const outdoor = getGroceryOutdoorNpcPosition();

  if (outdoor) return [{ sortY: outdoor.y, order: -1, type: "npc", draw: drawMaria }];

  if (!isInsideGroceryInterior()) return [];

  const { phase, progress } = getNpcSchedulePhase();

  if (phase !== "walkingIn" && phase !== "atWork" && phase !== "walkingOut") return [];

  const doorPos = getGroceryDoorFootPosition();
  const spotX = MARIA_SPOT_COL * TILE_SIZE + TILE_SIZE / 2;
  const spotY = MARIA_SPOT_ROW * TILE_SIZE + TILE_SIZE;

  let sortY = spotY;

  if (phase === "walkingIn" && doorPos) {
    sortY = getPointAlongPath(buildGroceryWalkPath(doorPos, spotX, spotY), progress).y;
  } else if (phase === "walkingOut" && doorPos) {
    sortY = getPointAlongPath(
      buildGroceryWalkPath(doorPos, spotX, spotY).reverse(),
      progress,
    ).y;
  }

  return [{ sortY, order: -1, type: "npc", draw: drawMaria }];
}

// Kaparehong-pareho ng getMariaDrawables, PERO para sa GROCERY na
// bersyon ni Joseph - HIWALAY ito sa getJosephDrawables (na para sa
// josephHouse, hindi nagbabago) - puwede silang PAREHONG aktibo sa
// magkaibang mundo, walang tunggalian.
function getJosephGroceryDrawables() {
  const outdoor = getGroceryOutdoorNpcPosition();

  if (outdoor) {
    return [{ sortY: outdoor.y, order: -1, type: "npc", draw: drawJosephAtGrocery }];
  }

  if (!isInsideGroceryInterior()) return [];

  const { phase, progress } = getNpcSchedulePhase();

  if (phase !== "walkingIn" && phase !== "atWork" && phase !== "walkingOut") return [];

  const doorPos = getGroceryDoorFootPosition();
  const spotX = JOSEPH_GROCERY_SPOT_COL * TILE_SIZE + TILE_SIZE / 2;
  const spotY = JOSEPH_GROCERY_SPOT_ROW * TILE_SIZE + TILE_SIZE;

  let sortY = spotY;

  if (phase === "walkingIn" && doorPos) {
    sortY = getPointAlongPath(buildGroceryWalkPath(doorPos, spotX, spotY), progress).y;
  } else if (phase === "walkingOut" && doorPos) {
    sortY = getPointAlongPath(
      buildGroceryWalkPath(doorPos, spotX, spotY).reverse(),
      progress,
    ).y;
  }

  return [{ sortY, order: -1, type: "npc", draw: drawJosephAtGrocery }];
}

// =========================
// "E" PARA KAY MARIA/JOSEPH SA GROCERY (hiling ng user: "dapat si maria
// is na press e din para makabili ako ng mga vegetable tapos si joseph
// din")
// =========================
// TANGING kapag "atWork" (nakatayo na sa puwesto, tapos na maglakad) -
// hindi makakausap habang naglalakad pa papasok/palabas.
function isPlayerNearMaria() {
  if (!isInsideGroceryInterior()) return false;
  if (getNpcSchedulePhase().phase !== "atWork") return false;
  if (typeof isPlayerAdjacentToTile !== "function") return false;
  if (typeof isPlayerFacingTile !== "function") return false;

  return (
    isPlayerAdjacentToTile(MARIA_SPOT_COL, MARIA_SPOT_ROW) &&
    isPlayerFacingTile(MARIA_SPOT_COL, MARIA_SPOT_ROW)
  );
}

// AYOS: si Joseph SA GROCERY - "E" dito ay BINUBUKSAN ang PAREHONG
// Builder panel na inaalok niya sa josephHouse (openBuilderPanel) -
// maginhawang shortcut, hindi na kailangang bumalik pa sa bahay niya.
// KUNG MALI ito sa gusto mong mangyari (hal. gusto mo lang siyang
// "nandiyan lang" nang walang gagawin), sabihin mo lang.
function isPlayerNearJosephAtGrocery() {
  if (!isInsideGroceryInterior()) return false;
  if (getNpcSchedulePhase().phase !== "atWork") return false;
  if (typeof isPlayerAdjacentToTile !== "function") return false;
  if (typeof isPlayerFacingTile !== "function") return false;

  return (
    isPlayerAdjacentToTile(JOSEPH_GROCERY_SPOT_COL, JOSEPH_GROCERY_SPOT_ROW) &&
    isPlayerFacingTile(JOSEPH_GROCERY_SPOT_COL, JOSEPH_GROCERY_SPOT_ROW)
  );
}

// =========================
// TINDAHAN NI MARIA (hiling ng user: "makabili ako ng mga vegetable")
// =========================
// Sa ngayon, CARROT LANG ang paninda (iyon lang ang TUNAY na umiiral
// na crop/gulay sa laro - ang potato/cabbage/eggplant ay hihintayin
// pa ang refactor ng "crop system" na napag-usapan natin dati, bago
// sila maidagdag dito). Iisang presyo lang ng carrot sa buong laro
// (kasama na ang OLDMAN_SHOP_ITEMS) - hindi dito nag-iimbento ng bago.
// AYOS (multi-crop, hiling ng user: "i add mo na rin yung mga ibang
// vegetables sa list ni maria para magamit buy/sell") - APAT na ngayon
// (dating carrot lang). Ang buyPrice/sellPrice ng potato/cabbage/
// eggplant ay MISMONG sinabi ng user; carrot ay dating presyo na (hindi
// ko binago, kahit medyo hindi na tugma sa pagkakasunod-sunod ng iba -
// sabihin mo lang kung gusto mong ayusin).
const MARIA_SHOP_ITEMS = [
  { itemId: "carrot", label: "Carrot", buyPrice: 50, sellPrice: 30, fallbackIcon: "🥕" },
  { itemId: "potato", label: "Potato", buyPrice: 20, sellPrice: 15, fallbackIcon: "🥔" },
  { itemId: "cabbage", label: "Cabbage", buyPrice: 30, sellPrice: 20, fallbackIcon: "🥬" },
  { itemId: "eggplant", label: "Eggplant", buyPrice: 50, sellPrice: 40, fallbackIcon: "🍆" },
];

// AYOS (hiling ng user: "gawin mo yung ui ng oldman kapag lumitaw yung
// binibenta niya gawin mo yung kay maria yung pop up niya") - dating
// sariling floating div (hotkey-picker style) ang panel ni Maria -
// PINALITAN ito ng TUNAY na #maria-shop-panel (index.html), EKSAKTONG
// istruktura ng #oldman-shop-panel (parehong CSS ID rules, tingnan ang
// comma-selector sa style.css) - kaya magkatugma na ang itsura.
//
// DISCLOSED NA PAGKAKAIBA sa interaksyon: si Oldman ay DRAG-based (may
// quantity popup) - dito, mas simple: I-CLICK ang cell para bumili ng
// 1, I-RIGHT-CLICK para ibenta ANG LAHAT ng hawak mong stock niyon.
// Walang quantity picker - kung kailangan mo ring gawing eksaktong
// drag-based si Maria (tulad ni Oldman), sabihin mo lang, malaking
// dagdag na trabaho ito (kailangang gayahin ang buong hotbar.js drag/
// drop-target na sistema).
function isMariaShopPanelOpen() {
  const panel = document.getElementById("maria-shop-panel");

  return !!panel && !panel.classList.contains("hidden");
}

function closeMariaShopPanel() {
  const panel = document.getElementById("maria-shop-panel");

  if (panel) panel.classList.add("hidden");
}

function buildMariaShopCell(item) {
  const cell = document.createElement("button");

  cell.type = "button";
  // Parehong klase (.oldman-shop-cell) ng cell ni Oldman - kaya EKSAKTONG
  // parehong itsura (laki, border, hover) - dagdag na klase lang para
  // ma-overrid ang cursor (walang drag dito, click/right-click lang).
  cell.className = "oldman-shop-cell maria-shop-cell";

  const count = typeof CROP_TYPES !== "undefined" && CROP_TYPES[item.itemId]
    ? CROP_TYPES[item.itemId].getCount()
    : 0;

  cell.title =
    item.label +
    "\nBuy: " + item.buyPrice + " gold (click)" +
    "\nSell all (" + count + "): " + item.sellPrice + " gold each (right-click)";

  cell.innerHTML =
    '<span class="oldman-shop-cell-icon">' +
    (typeof getShopItemIconHTML === "function"
      ? getShopItemIconHTML(item.itemId, item.fallbackIcon)
      : item.fallbackIcon) +
    "</span>";

  if (count > 0) {
    const stock = document.createElement("span");

    stock.className = "oldman-shop-cell-stock";
    stock.textContent = count > 99 ? "99+" : String(count);
    cell.appendChild(stock);
  }

  cell.addEventListener("click", () => {
    buyFromMaria(item.itemId);
    syncMariaShopPanel();
  });

  cell.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    sellToMaria(item.itemId);
    syncMariaShopPanel();
  });

  return cell;
}

function syncMariaShopPanel() {
  const grid = document.getElementById("maria-shop-grid");

  if (!grid) return;

  grid.innerHTML = "";

  for (const item of MARIA_SHOP_ITEMS) {
    grid.appendChild(buildMariaShopCell(item));
  }

  const goldEl = document.getElementById("maria-shop-gold-amount");

  if (goldEl) {
    goldEl.textContent = typeof goldCollected !== "undefined" ? goldCollected : 0;
  }
}

function openMariaShopPanel() {
  const panel = document.getElementById("maria-shop-panel");

  if (!panel) return;

  panel.classList.remove("hidden");
  syncMariaShopPanel();
}

document
  .getElementById("maria-shop-panel-close")
  ?.addEventListener("click", () => closeMariaShopPanel());
// stock counter (kaparehong pattern ng harvestCarrot, dig.js), hindi
// dumadaan sa hotbar drag/drop (mas simple, sapat na para sa "E to
// buy" na daloy).
function buyFromMaria(itemId) {
  const item = MARIA_SHOP_ITEMS.find((entry) => entry.itemId === itemId);

  if (!item) return;

  if (typeof goldCollected === "undefined" || goldCollected < item.buyPrice) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("You do not have enough gold.");
    }

    return;
  }

  goldCollected -= item.buyPrice;

  // AYOS (multi-crop): dating "carrot lang, direktang carrotsCollected++"
  // - ngayon, GENERIC na (adjustGlobalItemCount, hotbar.js) para sa
  // KAHIT ANONG crop, hindi na kailangan pang idagdag dito ang bawat
  // bago (matagal nang ginagamit ito ng collectGroundItem, generic na
  // ito talaga).
  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, 1);
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof scheduleInventorySave === "function") scheduleInventorySave();

  if (typeof showFloatingMessage === "function") {
    showFloatingMessage("Bought 1 " + item.label + " for " + item.buyPrice + " gold.");
  }
}

// AYOS (multi-crop, hiling ng user: "para magamit buy/sell") - BAGO,
// wala pang "Sell" dati (Buy lang si Maria noon). Ibinebenta ang HANGGANG
// SA BUONG STOCK mo (hindi lang 1) kada click - mas mabilis, gaya ng
// dating gawi ng "Slice"/"Throw" ng ibang item (LAHAT o wala).
function sellToMaria(itemId) {
  const item = MARIA_SHOP_ITEMS.find((entry) => entry.itemId === itemId);

  if (!item) return;

  const crop = typeof CROP_TYPES !== "undefined" ? CROP_TYPES[itemId] : null;
  const count = crop ? crop.getCount() : 0;

  if (count <= 0) {
    if (typeof showFloatingMessage === "function") {
      showFloatingMessage("You do not have any " + item.label + " to sell.");
    }

    return;
  }

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, -count);
  }

  if (typeof consumeItemFromWherever === "function") {
    consumeItemFromWherever(itemId, count);
  }

  if (typeof goldCollected !== "undefined") {
    goldCollected += count * item.sellPrice;
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof scheduleInventorySave === "function") scheduleInventorySave();

  if (typeof showFloatingMessage === "function") {
    showFloatingMessage(
      "Sold " + count + " " + item.label + " for " + count * item.sellPrice + " gold.",
    );
  }
}

// =========================
// COLLISION NILA MARIA/JOSEPH (hiling ng user: "lagyan mo sila ng
// collisions parang si oldman")
// =========================
// Parehong sukat/paraan ng Oldman (OLDMAN_COLLISION_BOX_WIDTH/HEIGHT,
// decor.js: TILE_SIZE*0.6 x TILE_SIZE*0.4, naka-anchor sa PAANAN) -
// pero LIMITADO lang sa "atHome"/"atWork" (nakatayo, hindi gumagalaw)
// - SINASADYA itong hindi ibinibigay habang naglalakad
// (leavingHome/approaching/walkingIn/walkingOut/leaving/enteringHome):
// maliit ang mga silid (bahay/Grocery) at gumagalaw ang NPC sa isang
// FIXED na ruta - kung bibigyan pa ng collision habang gumagalaw,
// puwedeng ma-“sandwich”/mabara ang player sa isang sulok habang
// dumaraan ang NPC sa eksaktong parehong landas.
const NPC_COLLISION_BOX_WIDTH = TILE_SIZE * 0.6;
const NPC_COLLISION_BOX_HEIGHT = TILE_SIZE * 0.4;

function buildNpcCollisionBox(feetX, feetY) {
  return {
    x: feetX - NPC_COLLISION_BOX_WIDTH / 2,
    y: feetY - NPC_COLLISION_BOX_HEIGHT,
    width: NPC_COLLISION_BOX_WIDTH,
    height: NPC_COLLISION_BOX_HEIGHT,
  };
}

// Tinatawag ito ng collisions.js (canMoveTo) - ibinabalik ang LAHAT ng
// collision box na dapat balakin ngayon, sa KASALUKUYANG mundo lang
// (kaya iba't ibang resulta ito depende kung nasa josephHouse ka,
// mariaHouse, o sa loob ng isang Grocery).
function getScheduledNpcCollisionBoxes() {
  const boxes = [];

  if (typeof currentWorld === "undefined" || !currentWorld) return boxes;

  const { phase } = getNpcSchedulePhase();

  if (currentWorld === JOSEPH_WORLD && phase === "atHome") {
    boxes.push(buildNpcCollisionBox(JOSEPH_X, JOSEPH_Y));
  }

  if (currentWorld === MARIA_WORLD && phase === "atHome") {
    boxes.push(buildNpcCollisionBox(MARIA_HOME_X, MARIA_HOME_Y));
  }

  if (isInsideGroceryInterior() && phase === "atWork") {
    boxes.push(
      buildNpcCollisionBox(
        MARIA_SPOT_COL * TILE_SIZE + TILE_SIZE / 2,
        MARIA_SPOT_ROW * TILE_SIZE + TILE_SIZE,
      ),
    );
    boxes.push(
      buildNpcCollisionBox(
        JOSEPH_GROCERY_SPOT_COL * TILE_SIZE + TILE_SIZE / 2,
        JOSEPH_GROCERY_SPOT_ROW * TILE_SIZE + TILE_SIZE,
      ),
    );
  }

  return boxes;
}

// =========================
// "MAY TAO SA SILID" = HINDI MADILIM (hiling ng user)
// =========================
// "yung kulay mismo ng inner kapag di pa madilim kapag may tao sa mismong
// room ganun na ilagay mo kahit wala ng ilaw sa grocery lang ah kapag
// may tao lang pero kapag wala pa same parin madilim"
//
// Ang dilim sa loob ng bahay ay isang \"multiply\" na tint sa buong
// screen (drawDayNight, atmosphere.js) - nilalaktawan na ito kapag may
// NAKASINDING lampara sa silid (hasLitPlacedLightInCurrentWorld). Ito ay
// PANGALAWANG dahilan para laktawan iyon: may TAO sa loob. Sa ngayon,
// ang Grocery LANG (si Maria) ang may ganito - ang ibang silid ay
// nananatiling madilim kung walang ilaw, walang nagbago doon.
function hasNpcLitInterior() {
  if (!isInsideGroceryInterior()) return false;

  // Madilim pa rin ang Grocery kung "away"/"approaching"/"leaving" ang
  // yugto (SA LABAS pa sila, o wala pang trabaho) - liwanag lang habang
  // TALAGANG NASA LOOB na sila (papasok, nakatayo, o papalabas).
  const phase = getNpcSchedulePhase().phase;

  return phase === "walkingIn" || phase === "atWork" || phase === "walkingOut";
}

function registerCustomHouseInteriorWorld(house) {
  if (!house.interiorImageDataURL) return;
  if (typeof WORLDS === "undefined") return;

  const worldName = getCustomHouseInteriorWorldName(house);
  // AYOS (hiling ng user): PAREHONG sukat (tilesWide/tilesTall) AT
  // posisyon ng pintuan (doorPosition) ng EXTERIOR na rin ang gamit
  // dito - wala nang hiwalay na "interiorTilesWide/Tall/DoorPosition".
  const tmj = buildSyntheticInteriorTmj(
    house.interiorTilesWide,
    house.interiorTilesTall,
    house.doorPosition,
    getBuilderInteriorWallThickness(house),
  );
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
    spawn: getBuilderInteriorDoorSpawnPx(
      house.interiorTilesWide,
      house.interiorTilesTall,
      house.doorPosition,
      "inward",
      getBuilderInteriorWallThickness(house),
    ),
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
    "Choose a Lot size - then click where you want to build it on the Grassmap (anywhere, as long as nothing is in the way). Most sizes share the same " +
    BUILDER_EXTERIOR_TILES_WIDE +
    "x" +
    BUILDER_EXTERIOR_TILES_TALL +
    " tile Exterior and only differ in ROOM SIZE (Interior) - the higher the price, the bigger the room inside. The \"Tall\" size is the exception: a narrower, taller house on the outside, with the same biggest room on the inside.";
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
    const lotExterior = getBuilderExteriorSize(lot);

    sub.textContent =
      "Exterior: " +
      lotExterior.wide * TILE_SIZE +
      "x" +
      lotExterior.tall * TILE_SIZE +
      " px (" +
      lotExterior.wide +
      "x" +
      lotExterior.tall +
      " tiles) • Interior Template: " +
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
    // LOCKED (hiling ng user) - may Exterior AT Interior na ito, kaya
    // hindi na ito puwedeng galawin hangga't hindi ibinebenta.
    const occupied = isCustomHouseOccupied(house);

    const row = document.createElement("div");

    row.className =
      "builder-lot-row" +
      (occupied ? " builder-lot-row-disabled" : " builder-lot-row-clickable");

    if (!occupied) {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
    }

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

    if (occupied) {
      // PAREHONG mensahe sa Exterior at Interior na tab - malinaw kung
      // BAKIT hindi ito ma-click at kung ANO ang gagawin para mabago.
      sub.textContent =
        "Occupied - this Lot already has both an Exterior and an Interior. Sell it first (right-click the house) to build something else here.";
    } else if (kind === "exterior") {
      sub.textContent = house.exteriorImageDataURL
        ? "May Exterior na (" +
          getBuilderDoorPositionDef(house.doorPosition).label +
          ") - i-click para baguhin."
        : "No Exterior yet - click to choose the door and upload.";
    } else {
      const padded = getBuilderInteriorPaddedSize(
        house.interiorTilesWide,
        house.interiorTilesTall,
        getBuilderInteriorWallThickness(house),
      );

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

    if (!occupied) {
      row.addEventListener("click", openRow);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openRow();
        }
      });
    }

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

  const padded = getBuilderInteriorPaddedSize(
    house.interiorTilesWide,
    house.interiorTilesTall,
    getBuilderInteriorWallThickness(house),
  );
  const def = getBuilderDoorPositionDef(house.doorPosition);
  const T = getBuilderInteriorWallThickness(house);

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
        // PANGHULING DEPENSA (hiling ng user) - LOCKED na ang Lot na
        // may Exterior AT Interior na; ibenta muna ito bago mapalitan.
        if (isCustomHouseOccupied(house)) return;

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

// Ang EKSAKTONG sukat ng Lot na kailangan ng isang template, bilang
// teksto - PAREHONG-PAREHO ito ng TALAGANG sinusuri ng
// getBuilderTemplateFit (exterior AT interior), kaya hindi na
// nakakalito kung aling Lot ang bibilhin. IISANG helper lang ito para
// hindi magkaiba-iba ang sinasabi ng mga screen.
function getBuilderTemplateSizeText(template) {
  const exterior = getBuilderExteriorSize(template);

  return (
    exterior.wide +
    "x" +
    exterior.tall +
    " exterior + " +
    template.interiorTilesWide +
    "x" +
    template.interiorTilesTall +
    " interior floor"
  );
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
    // AYOS (kasabay ng Grocery/Garden House): dati, ang INTERIOR na
    // sukat lang ang nakasulat dito - PERO may DALAWA nang tier na
    // pareho ang interior (18x17) at EXTERIOR lang ang pinagkaiba
    // (Extra Large 10x8 vs Tall 9x10), kaya nakakalito na iyon:
    // mabibili mo ang maling Lot at hindi mo pa rin magagamit ang
    // template (tingnan ang getBuilderTemplateFit - PAREHO ang
    // sinusuri). Kaya nakalagay na ngayon ang DALAWA.
    const sizeText = getBuilderTemplateSizeText(template);

    sub.textContent = atMax
      ? "Maximum reached (" + builtCount + "/" + BUILDER_TEMPLATE_MAX_COUNT + " built)."
      : "Needs a " +
        sizeText +
        " Lot - " +
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
    getBuilderTemplateSizeText(template) +
    ".";
  body.appendChild(intro);

  const fittingHouses = customHouses.filter((house) => getBuilderTemplateFit(house, template));

  if (fittingHouses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "builder-panel-hint";
    empty.textContent =
      "You do not have a matching Lot yet - buy one with a " +
      getBuilderTemplateSizeText(template) +
      " in the 'Lots' tab first.";
    body.appendChild(empty);
  }

  for (const house of fittingHouses) {
    // LOCKED (hiling ng user) - kaparehong-parehong patakaran ng
    // Exterior/Interior na tab (tingnan ang isCustomHouseOccupied).
    const occupied = isCustomHouseOccupied(house);

    const row = document.createElement("div");

    row.className =
      "builder-lot-row" +
      (occupied ? " builder-lot-row-disabled" : " builder-lot-row-clickable");

    if (!occupied) {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
    }

    const label = document.createElement("div");

    label.className = "builder-lot-label";
    label.textContent = getCustomHouseName(house);

    const sub = document.createElement("div");

    sub.className = "builder-lot-sub";

    const currentTemplate = house.templateId ? getBuilderTemplateById(house.templateId) : null;

    sub.textContent =
      house.tilesWide + "x" + house.tilesTall + " Lot (" + house.world + ") - " +
      (occupied
        ? "occupied" +
          (currentTemplate ? " by \"" + currentTemplate.name + "\"" : " by a custom design") +
          ", sell it first"
        : currentTemplate
          ? "currently \"" + currentTemplate.name + "\""
          : house.exteriorImageDataURL
            ? "currently a custom design"
            : "empty, no building yet");
    label.appendChild(sub);
    row.appendChild(label);

    const openConfirm = () => {
      renderBuilderTemplateConfirm(body, house, template, onBack);
    };

    if (!occupied) {
      row.addEventListener("click", openConfirm);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openConfirm();
        }
      });
    }

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
    // Ang applyBuilderTemplateToHouse ay TATANGGI (false) kung OKUPADO
    // na ang Lot (may Exterior AT Interior) - hindi na dapat marating
    // ito dahil naka-disable na ang row sa picker, pero kung sakali,
    // malinaw ang mensahe sa halip na tahimik na walang mangyayari.
    const built = applyBuilderTemplateToHouse(house, template);

    if (!built) {
      if (typeof showFloatingMessage === "function") {
        showFloatingMessage(
          "\"" +
            getCustomHouseName(house) +
            "\" is occupied - sell it first before building something else there.",
        );
      }

      onBack();
      return;
    }

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
      // PANGHULING DEPENSA - kaparehong dahilan ng Interior handler
      // (tingnan ang isCustomHouseOccupied).
      if (isCustomHouseOccupied(house)) return;

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
