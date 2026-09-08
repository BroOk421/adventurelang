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

const TORCH_SHADOW_LENGTH = 220; // world pixels - PINAKAMAHABANG anino (sa dulo ng saklaw ng liwanag)
const TORCH_SHADOW_CAST_RADIUS = 150; // world pixels - saklaw bago i-skip (performance) - dito rin umaabot sa pinakamahaba
const TORCH_SHADOW_NEAR_DISTANCE = 16; // world pixels (~1 tile) - loob nito, WALANG anino
const TORCH_SHADOW_COLOR = "rgba(0, 0, 0, 0.4)";

// Batay sa distansya (world pixels) mula sa liwanag papunta sa
// GITNA ng bagay - ibinabalik ang TALAGANG gagamiting haba ng anino
// nito (0 hanggang TORCH_SHADOW_LENGTH, tingnan ang paliwanag sa
// itaas ng file na ito).
function computeTorchShadowLengthForDistance(distance) {
  if (distance <= TORCH_SHADOW_NEAR_DISTANCE) return 0;
  if (distance >= TORCH_SHADOW_CAST_RADIUS) return TORCH_SHADOW_LENGTH;

  const t =
    (distance - TORCH_SHADOW_NEAR_DISTANCE) /
    (TORCH_SHADOW_CAST_RADIUS - TORCH_SHADOW_NEAR_DISTANCE);

  return TORCH_SHADOW_LENGTH * t;
}

// Iisang pormat lang ang ginagamit ng LAHAT ng pinagmulan (puno, bato,
// oak, grassmap tree, damo, placed structure) - {x, y, width, height,
// shadowLength} sa WORLD pixels - ang "shadowLength" ay NA-COMPUTE NA
// (batay sa distansya, tingnan sa itaas) sa MISMONG oras na kinolekta
// ang caster na ito, para hindi na kailangang kuwentahin ulit mamaya.
function buildTorchShadowFootprint(x, y, width, height, shadowLength) {
  return { x, y, width, height, shadowLength };
}

// Karaniwang RECT (world pixels, hindi na kailangang tile-aligned) -
// pinagbabasehan ng LAHAT ng ibang "add*ShadowCaster" helper sa ibaba.
// Kahit na "0" ang shadowLength (masyadong malapit) ay ITINUTULOY pa
// rin itong idinagdag - kailangan pa ring "mag-fade out" nang tama sa
// pagitan ng malapit/malayo, hindi bigla na lang basta mawawala.
function addRectShadowCaster(casters, lightX, lightY, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const distance = Math.hypot(centerX - lightX, centerY - lightY);

  if (distance > TORCH_SHADOW_CAST_RADIUS) return;

  const shadowLength = computeTorchShadowLengthForDistance(distance);

  casters.push(buildTorchShadowFootprint(x, y, width, height, shadowLength));
}

// Tile-based na bagay (col/row, TILE_SIZE x TILE_SIZE) - karamihan sa
// mga pinagmulan (puno/bato/oak/damo) ay ganito. "shrink" - bahagyang
// paliitin ang footprint (mula sa BUONG tile) papunta sa mas
// makatotohanang laki ng trunk/bato mismo (hindi ito eksakto/pang-
// physics, kozmetiko lang - basta't "sapat na" ang laki para sa
// anino).
function addTileBoxShadowCaster(casters, lightX, lightY, col, row, shrink) {
  const size = TILE_SIZE - shrink * 2;
  const x = col * TILE_SIZE + shrink;
  const y = row * TILE_SIZE + shrink;

  addRectShadowCaster(casters, lightX, lightY, x, y, size, size);
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

      addTileBoxShadowCaster(casters, lightX, lightY, stone.col, stone.row, 3);
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

  if (typeof grassTuftsCache !== "undefined" && Array.isArray(grassTuftsCache)) {
    for (const tuft of grassTuftsCache) {
      // Mas maliit ang shrink (5) kaysa puno/bato - manipis lang ang
      // tumpok ng damo, hindi dapat kasing-laki ng buong tile ang
      // "batayan" ng anino nito.
      addTileBoxShadowCaster(casters, lightX, lightY, tuft.col, tuft.row, 5);
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
function drawTorchLongShadowForFootprint(lightX, lightY, box) {
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

  ctx.fillStyle = TORCH_SHADOW_COLOR;

  // Isang "quad" kada gilid ng parisukat (4 gilid = 4 quad) - ang mga
  // ito lang, magkakasama, ang bumubuo sa buong anino papalayo sa
  // liwanag (kaparehong-pareho ng loop sa CodePen).
  for (let i = 0; i < projected.length; i++) {
    const next = (i + 1) % projected.length;

    ctx.beginPath();
    ctx.moveTo(projected[i].startX, projected[i].startY);
    ctx.lineTo(projected[next].startX, projected[next].startY);
    ctx.lineTo(projected[next].endX, projected[next].endY);
    ctx.lineTo(projected[i].endX, projected[i].endY);
    ctx.closePath();
    ctx.fill();
  }

  // Punuin din ang MISMONG footprint (base ng bagay mismo) - depende
  // sa posisyon ng liwanag, minsan may manipis na "puwang"/seam sa
  // pagitan ng 4 quad malapit mismo sa bagay - tinitiyak nito na
  // solid/walang puwang ang agarang paligid nito.
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

  const light = getTorchFlamePosition();
  const casters = getTorchShadowCasters(light.x, light.y);

  if (casters.length === 0) return;

  ctx.save();

  // "multiply" - para makita pa rin ang texture ng lupa/damo sa ilalim
  // ng anino (hindi tuluyang itim/patay) - kaparehong paraan ng
  // ginagamit ng drawDayNight (atmosphere.js) para sa dilim ng gabi.
  ctx.globalCompositeOperation = "multiply";

  for (const box of casters) {
    drawTorchLongShadowForFootprint(light.x, light.y, box);
  }

  ctx.restore();
}
