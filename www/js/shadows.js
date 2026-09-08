// =========================
// TORCH "LONG SHADOW" (mga anino ng puno/bato/damo/placed structure
// dahil sa ilaw ng TORCH) - hiling ng user, may kalakip na CodePen
// reference: "Long shadow" ni mladen___
// (https://codepen.io/mladen___/pen/gbvqBo)
// =========================
//
// Habang NAKA-EQUIP ang TORCH, ang mga bagay na malapit sa APOY nito
// (puno, bato, tumpok ng damo, o mga placed structure - bed/crafter/
// stove/lamp sa loob ng bahay) ay may "long shadow" - isang anino na
// PAALIS sa liwanag, kaparehong-pareho ng ipinapakita ng CodePen na
// iyon gamit ang mga umiikot na parisukat ("boxes").
//
// ANG ALGORITHM (kopya ng CodePen, inayos lang papunta sa "world
// space" ng laro - hindi screen space - at gumagamit ng TALAGANG
// posisyon ng apoy ng torch, hindi cursor):
//   Para sa bawat KANTO (corner) ng "footprint" (parisukat na
//   bounding box) ng isang bagay - kunin ang ANGGULO mula sa liwanag
//   patungo doon, i-"project" ang kantong iyon PAALIS sa liwanag, tapos
//   gumuhit ng isang "quad" (4 na punto: 2 orihinal na kanto + 2
//   na-project na kanto) sa BAWAT gilid ng parisukat - ang kumbinasyon
//   ng 4 na quad na ito (isa kada gilid) ang bumubuo sa buong silweta
//   ng anino papalayo sa liwanag, eksaktong hugis-anggulo depende sa
//   posisyon ng player/torch laban sa bagay.
//
// AYOS (hiling ng user): "medyo mahaba kasi... kapag malapit sa item
// ... pagitan is 1 tile lang is gawin mo na lang na yung mismong
// shadow niya is mawawala yung shadow pero kapag malayo or papalayo is
// lumalaki yung shadow" - DATING FIXED na haba (TORCH_SHADOW_LENGTH)
// ang anino kahit gaano pa kalapit/kalayo ang liwanag - AYOS: dinamiko
// na ito ngayon, BATAY SA DISTANSYA mula sa liwanag papunta sa bagay
// (tingnan ang computeTorchShadowLengthForDistance sa ibaba):
//   - LOOB ng 1 tile (TORCH_SHADOW_NEAR_DISTANCE) - WALANG anino
//     (haba = 0) - parang "nalunod"/nasa ilalim mismo ng liwanag.
//   - Papalayo mula doon hanggang TORCH_SHADOW_CAST_RADIUS - unti-
//     unting lumalaki ang haba (linear interpolation) hanggang sa
//     umabot sa buong TORCH_SHADOW_LENGTH sa pinakadulo ng saklaw ng
//     liwanag - ito na ang dating "laging ganito" na itsura, ngayon
//     nasa PINAKAMALAYONG punto na lang ito nangyayari.
//
// SAKLAW:
//   - puno/bato (resources.js: resourceNodesCache.trees/.stones)
//   - oak trees (decor.js: oakSpotsCache)
//   - indibidwal na puno sa grassmap/grassmap2 (decor.js:
//     GRASSMAP_TREE_SPOTS, gamit ang trunkBox nila)
//   - tumpok ng damo (grass.js: grassTuftsCache)
//   - BAGO (hiling ng user): mga PLACED/dropable na structure SA LOOB
//     NG BAHAY - Bed (bed.js: placedBeds), Crafter (craft.js:
//     placedCrafters), Stove (stove.js: placedStoves), Lamp/Light
//     (light.js: placedLights) - gumagamit ng PAREHONG
//     PLACEMENT_FOOTPRINTS (placement.js) para malaman ang TALAGANG
//     laki (sa tiles) ng bawat isa (2x1 ang crafter/stove, 1x1 ang
//     light, 2x3 ang bed).
//
// PERFORMANCE: hindi lahat ng bagay sa BUONG mundo ang binibigyan ng
// anino - LOOB LANG ng TORCH_SHADOW_CAST_RADIUS mula sa apoy (halos
// pareho lang ng saklaw ng liwanag mismo, TORCH_LIGHT_RADIUS sa
// atmosphere.js) - wala namang makikitang anino sa madilim/malayong
// bahagi ng screen kahit sino pa.

// AYOS (BUG FIX, hiling ng user: "gusto ko lang mangyari is lalabas
// lang yung shadow sa loob lang mismo ng light ng torch... kahit di
// nasisinagan ng torch light is nag shashadow din") - dating 150
// ang TORCH_SHADOW_CAST_RADIUS (basta hard-coded, hiwalay sa
// TALAGANG saklaw ng liwanag) samantalang ang TUNAY na "hole"/liwanag
// ng torch (drawDayNight, atmosphere.js) ay MAS MALIIT lang
// (TORCH_LIGHT_RADIUS * 0.85 ≈ 59.5 world px, bago pa man ang pulse/
// zoom) - kaya may mga bagay na LAMPAS na sa TALAGANG naiilawan
// (60-150px mula sa apoy) pero naaninagan/naka-shadow pa rin - kitang-
// kita, "pangit tignan". Itinutugma na ngayon dito ang eksaktong
// PAREHONG radius ng liwanag (hindi na basta ibang numero).
const TORCH_LIGHT_VISIBLE_RADIUS =
  typeof TORCH_LIGHT_RADIUS !== "undefined" ? TORCH_LIGHT_RADIUS * 0.85 : 60;

const TORCH_SHADOW_LENGTH = 220; // world pixels - PINAKAMAHABANG anino (sa dulo ng saklaw ng liwanag)
const TORCH_SHADOW_CAST_RADIUS = TORCH_LIGHT_VISIBLE_RADIUS; // world pixels - saklaw bago i-skip (performance) - dito rin umaabot sa pinakamahaba
const TORCH_SHADOW_NEAR_DISTANCE = 16; // world pixels (~1 tile) - loob nito, WALANG anino
// AYOS (BUG FIX, hiling ng user: "kaya bang gawin na kung anong kulay
// ng dark sa gabi ganun yung magiging kulay ng shadow? apply mo kung
// anong kulay ng gabi sa snow, sunny at rainy") - dating FIXED itim
// (rgba(0,0,0,0.4)) ang kulay ng anino kahit anong oras/panahon.
// Ginagamit na ngayon ang getCurrentAtmosphereTintRGB (atmosphere.js)
// - PAREHONG kulay na ginagamit ng drawDayNight mismo (may kasamang
// snow/sunny/rain overcast blend) - para talagang kaparehong-pareho
// ng "dilim ng gabi" (kasama na ang mood/personalidad ng
// kasalukuyang panahon) ang kulay ng anino, hindi na basta hiwalay/
// FIXED na numero.
// AYOS (BUG FIX, hiling ng user: "kapag sobrang haba na yung shadow
// is dapat nag fafade na yung shadow niya to normal night lang na
// kulay") - dating nagpupunta ito sa TRANSPARENT (alpha 0) sa
// pinakadulo ng anino, kaya sa pinakamalayong punto, "nawawala"/
// nagiging kasing-liwanag na parang WALANG anino - PERO mali ito,
// dahil ang pinakadulo ng anino ay TALAGA namang nasa gilid na ng
// saklaw ng liwanag ng torch (TORCH_SHADOW_CAST_RADIUS, itinugma na
// sa TALAGANG saklaw ng liwanag sa itaas) - dapat kasing-dilim na ito
// ng NORMAL na gabi (walang torch), hindi kasing-liwanag pa rin.
// Ngayon, nagpupunta na ito sa MALAKAS/halos-buong-lakas na parehong
// kulay (hindi na 0), kaya "natutunaw"/"nag-fade" ang dulo ng anino
// PABALIK sa normal na dilim ng gabi, sa halip na basta biglang
// mawala/lumiwanag.
// AYOS (BUG FIX, hiling ng user: "medyo matapang yung kulay nung
// shadow ng mga object kapag nag torch medyo i-light mo lang or
// opacity") - dating PAREHONG 1.0/buong-lakas (opaque AT far) ang
// anino ng puno/bato/structure - kaya masyadong MATAPANG/malakas ang
// kontrast laban sa maliwanag na paligid nito (nasa LOOB naman ito ng
// saklaw ng liwanag ng torch, kaya kapansin-pansin talaga kung
// buong-lakas). PINAHINA (0.6) na ngayon ang bahaging MALAPIT sa
// bagay ("opaque") - mas magaan/malambot ang itsura - PERO pinanatili
// PA RIN sa buong-lakas (1.0) ang dulo ("far") - doon naman TALAGANG
// nasa gilid na ng saklaw ng liwanag (natural na dapat kasing-dilim
// ng normal na gabi doon, hindi kailangang pahinain pa).
// AYOS (BUG FIX, hiling ng user: "medyo matapang pa rin, i-light mo
// lang or opacity kahit 30% lang") - dating 0.6 pa rin masyadong
// matapang - pinababa pa ngayon papuntang 0.3 (30%) - ito na mismo
// ang eksaktong numerong hiniling, mas magaan/mas magiliw na anino
// malapit sa bagay. Nananatiling buong-lakas (1.0) pa rin ang dulo
// ("far") - normal na dilim ng gabi naman talaga doon, hindi
// kailangang pahinain pa (tingnan ang paliwanag sa itaas).
// AYOS (BUG FIX, hiling ng user: "medyo aninag pa yung 30%... gawin
// mo na lang kahit 10%") - pinababa pa ulit mula 0.3 papuntang 0.1
// (10%) - mas magaan/mas manipis pang anino malapit sa bagay.
const TORCH_SHADOW_ALPHA = 0.1;
const TORCH_SHADOW_FAR_ALPHA = 1;

// AYOS (BAGO, hiling ng user: "yung sa grass... dapat maikli lang
// depende sa size niya... gusto ko yung dulo ng shadow is dapat nag
// fafade") - hiwalay na (mas MAIKLING) haba ng anino PARA SA DAMO
// LANG - dating PAREHONG TORCH_SHADOW_LENGTH (220px, kasing-haba ng
// sa puno) ang ginagamit ng LAHAT, kahit na maliit lang/manipis ang
// damo - hindi makatotohanan (masyadong mahaba para sa laki nito).
// Idinagdag din ang "fadeToNothing" flag (tingnan ang
// buildTorchShadowFootprint/drawTorchLongShadowForFootprint sa
// ibaba) - SA HALIP na "kulay ng paligid" (full-opaque tulad ng
// puno/bato), ang DULO ng anino ng damo ay TALAGANG nagpupunta sa
// WALANG-KULAY/TRANSPARENT (0 alpha) - dahil manipis/magaan lang ang
// damo, dapat "natutunaw"/nawawala na lang nang tuluyan ang anino
// nito sa dulo, hindi nagiging solid/opaque na parang puno.
const GRASS_SHADOW_LENGTH = 45; // world pixels - AYOS (hiling ng user: "medyo malaki lang, wag masyadong mahaba") - dating 26, pinalaki pa

// AYOS (BAGO, hiling ng user: "liitan mo lang din yung shadow niya
// [bato] parang sa grass") - dating PAREHONG TORCH_SHADOW_LENGTH
// (220px, kasing-haba ng puno) din ang ginagamit ng BATO - masyadong
// mahaba para sa laki nito (mas maliit ang bato kaysa puno). Hiwalay
// na (mas MAIKLING) haba - mas mahaba pa sa GRASS_SHADOW_LENGTH
// (mas malaki naman ang bato kaysa sa isang tumpok ng damo), pero
// mas maikli pa rin kaysa TORCH_SHADOW_LENGTH ng puno. Hindi
// "fadeOut" (transparent) ang dulo nito, kundi "kulay ng paligid"
// pa rin (tulad ng puno) - solid pa rin naman ang bato, hindi tulad
// ng manipis na damo.
const STONE_SHADOW_LENGTH = 75; // world pixels - AYOS (hiling ng user: "medyo malaki lang, wag masyadong mahaba") - dating 40, pinalaki pa

// AYOS (BAGO, hiling ng user: "lagyan mo rin pala shadow yung pig,
// isakto mo lang sa size niya wag mahaba parang sa grass") - hiwalay
// na (maigsi, kaparehong-pareho ng GRASS_SHADOW_LENGTH) na haba ng
// anino PARA SA PIG - hindi ito dating kasama sa listahan ng
// casters (walang shadow ang pig noon). "Isakto sa size" - gamit ang
// TALAGANG collision footprint ng pig (PIG_COLLISION_BOX_WIDTH/HEIGHT,
// pig.js) bilang batayan ng footprint, hindi basta buong tile.
const PIG_SHADOW_LENGTH = GRASS_SHADOW_LENGTH;

function getTorchShadowColor() {
  const [red, green, blue] =
    typeof getCurrentAtmosphereTintRGB === "function"
      ? getCurrentAtmosphereTintRGB()
      : [0, 0, 0];

  const rgb = Math.round(red) + ", " + Math.round(green) + ", " + Math.round(blue);

  return {
    opaque: "rgba(" + rgb + ", " + TORCH_SHADOW_ALPHA + ")",
    // AYOS (hiling ng user: "yung diamond/box sa dulo... alisin mo") -
    // "far" (kulay ng paligid, buong-lakas) ay HINDI na ginagamit ng
    // drawTorchLongShadowForFootprint - LAHAT ng anino ngayon ay
    // nagpupunta sa "fadeOut" (transparent) sa pinakadulo, para
    // "natutunaw" ang KAHIT ANONG hugis doon (kasama ang diamond/box
    // na dating nabubuo kapag naka-per-corner-angle na malapit ang
    // liwanag) bago pa man ito TALAGANG makita nang buo. Iniiwan na
    // lang ito (hindi tinatanggal) kung sakaling kailanganin pa balang
    // araw.
    far: "rgba(" + rgb + ", " + TORCH_SHADOW_FAR_ALPHA + ")",
    fadeOut: "rgba(" + rgb + ", 0)",
  };
}

// Batay sa distansya (world pixels) mula sa liwanag papunta sa
// GITNA ng bagay - ibinabalik ang TALAGANG gagamiting haba ng anino
// nito (0 hanggang maxLength, tingnan ang paliwanag sa itaas ng
// file na ito). "maxLength" - opsyonal, TORCH_SHADOW_LENGTH bilang
// default (puno/bato/structure) - GRASS_SHADOW_LENGTH kapag damo
// (mas maigsi, tingnan ang addTileBoxShadowCaster/getTorchShadowCasters).
function computeTorchShadowLengthForDistance(distance, maxLength) {
  const limit = maxLength || TORCH_SHADOW_LENGTH;

  if (distance <= TORCH_SHADOW_NEAR_DISTANCE) return 0;
  if (distance >= TORCH_SHADOW_CAST_RADIUS) return limit;

  const t =
    (distance - TORCH_SHADOW_NEAR_DISTANCE) /
    (TORCH_SHADOW_CAST_RADIUS - TORCH_SHADOW_NEAR_DISTANCE);

  return limit * t;
}

// Iisang pormat lang ang ginagamit ng LAHAT ng pinagmulan (puno, bato,
// oak, grassmap tree, damo, placed structure) - {x, y, width, height,
// shadowLength, fadeOut} sa WORLD pixels - ang "shadowLength" ay
// NA-COMPUTE NA (batay sa distansya, tingnan sa itaas) sa MISMONG
// oras na kinolekta ang caster na ito, para hindi na kailangang
// kuwentahin ulit mamaya. "fadeOut" - BAGO (hiling ng user) - kung
// true, ang DULO ng anino nito ay TALAGANG nawawala/nagiging
// transparent (damo) sa halip na "kulay ng paligid" (puno/bato/
// structure, default/false).
function buildTorchShadowFootprint(x, y, width, height, shadowLength, fadeOut) {
  return { x, y, width, height, shadowLength, fadeOut: !!fadeOut };
}

// Karaniwang RECT (world pixels, hindi na kailangang tile-aligned) -
// pinagbabasehan ng LAHAT ng ibang "add*ShadowCaster" helper sa ibaba.
// Kahit na "0" ang shadowLength (masyadong malapit) ay ITINUTULOY pa
// rin itong idinagdag - kailangan pa ring "mag-fade out" nang tama sa
// pagitan ng malapit/malayo, hindi bigla na lang basta mawawala.
// "options" (opsyonal) - { maxLength, fadeOut } - tingnan ang
// paliwanag sa computeTorchShadowLengthForDistance/
// buildTorchShadowFootprint sa itaas.
function addRectShadowCaster(casters, lightX, lightY, x, y, width, height, options) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const distance = Math.hypot(centerX - lightX, centerY - lightY);

  if (distance > TORCH_SHADOW_CAST_RADIUS) return;

  const maxLength = options && options.maxLength;
  const fadeOut = options && options.fadeOut;
  const shadowLength = computeTorchShadowLengthForDistance(distance, maxLength);

  casters.push(buildTorchShadowFootprint(x, y, width, height, shadowLength, fadeOut));
}

// Tile-based na bagay (col/row, TILE_SIZE x TILE_SIZE) - karamihan sa
// mga pinagmulan (puno/bato/oak/damo) ay ganito. "shrink" - bahagyang
// paliitin ang footprint (mula sa BUONG tile) papunta sa mas
// makatotohanang laki ng trunk/bato mismo (hindi ito eksakto/pang-
// physics, kozmetiko lang - basta't "sapat na" ang laki para sa
// anino). "options" (opsyonal) - { maxLength, fadeOut }, tingnan ang
// addRectShadowCaster sa itaas.
function addTileBoxShadowCaster(casters, lightX, lightY, col, row, shrink, options) {
  const size = TILE_SIZE - shrink * 2;
  const x = col * TILE_SIZE + shrink;
  const y = row * TILE_SIZE + shrink;

  addRectShadowCaster(casters, lightX, lightY, x, y, size, size, options);
}

// BAGO: mga PLACED/dropable na structure (Bed/Crafter/Stove/Lamp) sa
// LOOB NG BAHAY - "list" ang array ng nakalagay na structure
// ({world, col, row, id, ...}, tingnan ang bed.js/craft.js/stove.js/
// light.js), "itemId" ang key papunta sa PLACEMENT_FOOTPRINTS
// (placement.js) para malaman ang TALAGANG laki (sa tiles) nito.
function addPlacedStructureShadowCasters(casters, lightX, lightY, list, itemId) {
  if (!Array.isArray(list) || list.length === 0) return;

  const footprint =
    (typeof PLACEMENT_FOOTPRINTS !== "undefined" &&
      PLACEMENT_FOOTPRINTS[itemId]) ||
    { width: 1, height: 1 };

  for (const placed of list) {
    if (placed.world !== currentWorld) continue;

    addRectShadowCaster(
      casters,
      lightX,
      lightY,
      placed.col * TILE_SIZE,
      placed.row * TILE_SIZE,
      footprint.width * TILE_SIZE,
      footprint.height * TILE_SIZE,
    );
  }
}

function getTorchShadowCasters(lightX, lightY) {
  const casters = [];

  if (typeof resourceNodesCache !== "undefined" && resourceNodesCache) {
    const harvested =
      typeof getHarvestedForCurrentWorld === "function"
        ? getHarvestedForCurrentWorld()
        : {};

    for (const tree of resourceNodesCache.trees || []) {
      if (harvested[tree.col + "," + tree.row]) continue; // na-chop, hindi pa tumutubo ulit

      addTileBoxShadowCaster(casters, lightX, lightY, tree.col, tree.row, 2);
    }

    for (const stone of resourceNodesCache.stones || []) {
      if (harvested[stone.col + "," + stone.row]) continue; // na-mina, hindi pa nagbabalik

      // AYOS (BAGO, hiling ng user: "liitan mo lang din yung shadow
      // niya [bato] parang sa grass") - hiwalay/mas maikling
      // STONE_SHADOW_LENGTH (tingnan ang paliwanag sa itaas), sa
      // halip na basta TORCH_SHADOW_LENGTH (kasing-haba ng puno).
      addTileBoxShadowCaster(casters, lightX, lightY, stone.col, stone.row, 3, {
        maxLength: STONE_SHADOW_LENGTH,
      });
    }
  }

  if (typeof oakSpotsCache !== "undefined" && Array.isArray(oakSpotsCache)) {
    const harvestedOak =
      typeof getHarvestedOakForCurrentWorld === "function"
        ? getHarvestedOakForCurrentWorld()
        : {};

    for (const oak of oakSpotsCache) {
      const key = oak.col + "," + oak.row;

      if (
        typeof isOakFullyHarvested === "function" &&
        isOakFullyHarvested(harvestedOak, key)
      ) {
        continue;
      }

      addTileBoxShadowCaster(casters, lightX, lightY, oak.col, oak.row, 1);
    }
  }

  if (
    typeof GRASSMAP_TREE_SPOTS !== "undefined" &&
    Array.isArray(GRASSMAP_TREE_SPOTS)
  ) {
    for (const spot of GRASSMAP_TREE_SPOTS) {
      if (!spot.trunkBox) continue;

      addRectShadowCaster(
        casters,
        lightX,
        lightY,
        spot.trunkBox.x,
        spot.trunkBox.y,
        spot.trunkBox.width,
        spot.trunkBox.height,
      );
    }
  }

  // BAGO (hiling ng user): shadow ng pig - "isakto sa size, wag
  // mahaba parang sa grass" - gamit ang TALAGANG collision footprint
  // nito (PIG_COLLISION_BOX_WIDTH/HEIGHT, pig.js - nasa paanan ng
  // pig, hindi basta buong tile) bilang batayan, at maigsi lang ang
  // haba (PIG_SHADOW_LENGTH, kapareho ng damo). Nilalaktawan ang mga
  // patay na pig (state === "dead") - kagaya ng pag-laktaw sa mga
  // na-harvest na puno/bato sa itaas.
  if (typeof pigsCache !== "undefined" && Array.isArray(pigsCache)) {
    for (const pig of pigsCache) {
      if (pig.state === "dead") continue;

      addRectShadowCaster(
        casters,
        lightX,
        lightY,
        pig.x - PIG_COLLISION_BOX_WIDTH / 2,
        pig.y - PIG_COLLISION_BOX_HEIGHT,
        PIG_COLLISION_BOX_WIDTH,
        PIG_COLLISION_BOX_HEIGHT,
        { maxLength: PIG_SHADOW_LENGTH },
      );
    }
  }

  if (typeof grassTuftsCache !== "undefined" && Array.isArray(grassTuftsCache)) {
    for (const tuft of grassTuftsCache) {
      // Mas maliit ang shrink (5) kaysa puno/bato - manipis lang ang
      // tumpok ng damo, hindi dapat kasing-laki ng buong tile ang
      // "batayan" ng anino nito.
      //
      // AYOS (BAGO, hiling ng user: "yung sa grass... dapat maikli
      // lang depende sa size niya... gusto ko yung dulo ng shadow is
      // dapat nag fafade") - dating GAMIT NG PAREHONG haba/kulay ng
      // puno/bato (TORCH_SHADOW_LENGTH, "kulay ng paligid" sa dulo) -
      // ngayon, may sariling MAS MAIKLING haba (GRASS_SHADOW_LENGTH)
      // AT nagpupunta talaga sa WALANG-KULAY (fadeOut: true) sa dulo,
      // sa halip na "kulay ng paligid" (angkop lang sa mas malalaki/
      // solid na bagay).
      addTileBoxShadowCaster(casters, lightX, lightY, tuft.col, tuft.row, 5, {
        maxLength: GRASS_SHADOW_LENGTH,
        fadeOut: true,
      });
    }
  }

  // BAGO (hiling ng user): mga placed structure SA LOOB NG BAHAY.
  if (typeof placedBeds !== "undefined")
    addPlacedStructureShadowCasters(casters, lightX, lightY, placedBeds, "bed");

  if (typeof placedCrafters !== "undefined") {
    addPlacedStructureShadowCasters(
      casters,
      lightX,
      lightY,
      placedCrafters,
      "crafter",
    );
  }

  if (typeof placedStoves !== "undefined") {
    addPlacedStructureShadowCasters(
      casters,
      lightX,
      lightY,
      placedStoves,
      "stove",
    );
  }

  if (typeof placedLights !== "undefined") {
    addPlacedStructureShadowCasters(
      casters,
      lightX,
      lightY,
      placedLights,
      "light",
    );
  }

  return casters;
}

// Ang MISMONG "long shadow" - kopya ng CodePen algorithm (drawShadow,
// Box.prototype), inayos lang papunta sa 4 na kanto ng isang
// PARISUKAT (dating custom na "quad shape" pa ang orihinal, dito mas
// simple - axis-aligned na footprint na lang) AT gumagamit na ng
// DINAMIKONG haba (box.shadowLength, tingnan ang paliwanag sa itaas ng
// file) sa halip na FIXED na TORCH_SHADOW_LENGTH.
//
// AYOS (BUG FIX, hiling ng user: "yoko sana yung parang may box sa
// dulo ng shadow") - unang sinubukan: IISANG anggulo na lang (light-
// to-center) para sa LAHAT ng 4 kanto (sa halip na sarili-sariling
// anggulo kada kanto) - PERO feedback ng user: "mas ok yung bago mo
// binago, di naman nawala yung box... inalis mo yung parang naka-
// slant, mas ok yun" - gusto pa rin niya ang DATING "naka-slant"/
// dynamic na itsura (sarili-sariling anggulo kada kanto, MAS totoo/
// mas magandang itsura), HINDI ang bagong "parehong direksyon" na
// paraan - BINALIK na ito dito. Ang TALAGANG dahilan ng "box/diamond"
// sa dulo ay hindi ang sarili-sariling anggulo mismo, kundi ang
// SOLID/OPAQUE na kulay sa pinakadulo (dating "kulay ng paligid",
// buong-lakas) - kaya kitang-kita/nagmumukhang hiwalay na SOLID na
// hugis (diamond/box) ang natitirang hugis kapag "nagbukas" ang 4
// kanto sa dulo. AYOS: FADEOUT (TRANSPARENT, hindi na "kulay ng
// paligid") na ngayon ang PINAKADULO ng LAHAT ng anino (hindi lang
// damo) - kaya "natutunaw"/nawawalang tuluyan ang KAHIT ANONG hugis
// (diamond/box man o hindi) bago pa man ito TALAGANG makita nang
// buo/solid.
function drawTorchLongShadowForFootprint(lightX, lightY, box, shadowColor) {
  // Wala nang gagawin kung 0 na ang haba (masyadong malapit sa
  // liwanag) - kahit ang footprint mismo, hindi na iguguhit (walang
  // "anino" na dapat lumabas, kaparehong hiling ng user).
  if (box.shadowLength <= 0) return;

  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];

  const projected = corners.map((corner) => {
    const angle = Math.atan2(corner.y - lightY, corner.x - lightX);

    return {
      startX: corner.x,
      startY: corner.y,
      endX: corner.x + Math.cos(angle) * box.shadowLength,
      endY: corner.y + Math.sin(angle) * box.shadowLength,
    };
  });

  // AYOS (BUG FIX, hiling ng user: "dapat di siya na box line lang na
  // parang solid yung kulay dapat box shadow may parang pa fade sa
  // gilid gilid") - dating IISANG "fillStyle" (solid na kulay) lang
  // ang ginagamit sa BUONG quad (mula sa gilid ng bagay hanggang sa
  // pinakadulo ng anino) - kaya parang "hard edge"/kahon lang talaga
  // ang itsura, walang natural na pagkupas. Ngayon, gumagamit na ng
  // LINEAR GRADIENT kada quad - MALAKAS/buong-alpha ang kulay malapit
  // sa mismong bagay (start), unti-unting nawawala/nagiging
  // TRANSPARENT (alpha 0) sa pinakadulo ng anino (end) - kaya
  // natural/"pa-fade" na ang itsura sa dulo, hindi na tuluyang
  // biglang-puputol.
  for (let i = 0; i < projected.length; i++) {
    const next = (i + 1) % projected.length;
    const from = projected[i];
    const to = projected[next];

    // Gradient batay sa GITNA ng gilid na ito (start->end) - sapat na
    // ito bilang direksyon dahil magkalapit lang naman ang anggulo ng
    // dalawang magkatabing kanto ng isang maliit na footprint.
    const gradient = ctx.createLinearGradient(
      (from.startX + to.startX) / 2,
      (from.startY + to.startY) / 2,
      (from.endX + to.endX) / 2,
      (from.endY + to.endY) / 2,
    );

    gradient.addColorStop(0, shadowColor.opaque);
    gradient.addColorStop(1, shadowColor.fadeOut);

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(from.startX, from.startY);
    ctx.lineTo(to.startX, to.startY);
    ctx.lineTo(to.endX, to.endY);
    ctx.lineTo(from.endX, from.endY);
    ctx.closePath();
    ctx.fill();
  }

  // Punuin din ang MISMONG footprint (base ng bagay mismo) - depende
  // sa posisyon ng liwanag, minsan may manipis na "puwang"/seam sa
  // pagitan ng 4 quad malapit mismo sa bagay - tinitiyak nito na
  // solid/walang puwang ang agarang paligid nito. Nananatiling SOLID
  // (hindi pa-fade) ito - dito talaga "nakadikit"/pinakamalapit ang
  // anino sa bagay, kaya dapat pa rin itong pinakamadilim.
  ctx.fillStyle = shadowColor.opaque;
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.fill();
}

// Tinatawag mula sa draw.js, BAGO ang drawMapObjects() (gusto nating
// nasa ILALIM ng mismong puno/bato/player/structure ang anino, hindi
// sa ibabaw).
function drawTorchShadows() {
  const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;

  if (!torchOn) return;
  if (typeof mapReady === "undefined" || !mapReady) return;
  if (typeof getTorchFlamePosition !== "function") return;

  // AYOS (hiling ng user, ULIT: "gusto ko baguhin yung oras mga 6pm
  // na") - dating pinababa papuntang 4pm (16:00) ang simula ng anino -
  // ibinalik na ngayon sa 6pm (18:00), kaparehong-pareho ng
  // getCalendarState().isDaytime (06:00-17:59 = araw/walang shadow,
  // 18:00-05:59 = gabi/may shadow).
  const calendarState =
    typeof getCalendarState === "function" ? getCalendarState() : null;

  if (calendarState && calendarState.hour24 >= 6 && calendarState.hour24 < 18) {
    return;
  }

  const light = getTorchFlamePosition();
  const casters = getTorchShadowCasters(light.x, light.y);

  if (casters.length === 0) return;

  // AYOS (hiling ng user): kinukuha dito (ISANG BESES lang kada
  // frame, hindi paulit-ulit kada caster) ang kasalukuyang kulay ng
  // "dilim ng gabi" (kasama na ang snow/sunny/rain overcast, tingnan
  // ang getTorchShadowColor sa itaas) - {opaque, transparent} na
  // parehong RGB pero magkaibang alpha, gamit sa fade-gradient ng
  // BAWAT quad (drawTorchLongShadowForFootprint).
  const shadowColor = getTorchShadowColor();

  ctx.save();

  // "multiply" - para makita pa rin ang texture ng lupa/damo sa ilalim
  // ng anino (hindi tuluyang itim/patay) - kaparehong paraan ng
  // ginagamit ng drawDayNight (atmosphere.js) para sa dilim ng gabi.
  ctx.globalCompositeOperation = "multiply";

  for (const box of casters) {
    drawTorchLongShadowForFootprint(light.x, light.y, box, shadowColor);
  }

  ctx.restore();
}
