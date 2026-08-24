// =========================
// COLLISIONS
// =========================

let collisions = [];

// Ang collision box dati ay NAKA-HARDCODE sa eksaktong piksel base sa
// ORIHINAL na sukat ng player (16x24): x+4, y+12, width 16, height 10 -
// katumbas ng "paa" lang ng character (hindi ang buong sprite, kaya
// puwede pa ring mag-overlap ang ulo/katawan sa mga puno/bakod sa
// itaas, likas na ganito sa top-down na laro).
//
// Ngayong pinalaki na ang sprite (36x54, tingnan ang player.js) -
// PROPORTIONAL na sa kasalukuyang player.width/height ang box sa halip
// na hardcoded na piksel, gamit ang PAREHONG RATIO ng orihinal na
// 16x24 na kalkulasyon sa itaas (4/16, 12/24, 16/16, 10/24) - kaya
// kahit magbago pa ulit ang sukat ng sprite balang-araw, sasabay pa
// rin nang tama ang collision box (hindi na kailangang balikan ito
// kada resize).
const PLAYER_COLLISION_OFFSET_X_RATIO = 4 / 16; // 25% mula sa kaliwang gilid
const PLAYER_COLLISION_OFFSET_Y_RATIO = 12 / 24; // 50% pababa - gitna hanggang ilalim
const PLAYER_COLLISION_WIDTH_RATIO = 16 / 16; // buong lapad ng sprite
const PLAYER_COLLISION_HEIGHT_RATIO = 10 / 24; // ~41.7% ng taas - makitid na "paa" lang

function getPlayerCollisionBox(x = player.x, y = player.y) {
  return {
    x: x + player.width * PLAYER_COLLISION_OFFSET_X_RATIO,
    y: y + player.height * PLAYER_COLLISION_OFFSET_Y_RATIO,
    width: player.width * PLAYER_COLLISION_WIDTH_RATIO,
    height: player.height * PLAYER_COLLISION_HEIGHT_RATIO,
  };
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function canMoveTo(x, y) {
  const playerBox = getPlayerCollisionBox(x, y);

  if (collisions.some((collision) => isColliding(playerBox, collision))) {
    return false;
  }

  // Bagong "buhay" na hadlang - hindi na puwedeng patawirin/i-overlap
  // ng player ang oldman at ang mga pig (dating puwede - "walang
  // collision box ang pig/oldman laban sa player", tingnan ang
  // CLAUDE.md). Ang mga function na ito (decor.js/pig.js, naglo-load
  // pagkatapos ng file na ito) ay gumagamit ng `typeof` guard dahil
  // baka hindi pa sila available sa unang ilang frame.
  if (typeof getOldManCollisionBox === "function") {
    const oldManBox = getOldManCollisionBox();

    if (oldManBox && isColliding(playerBox, oldManBox)) return false;
  }

  if (typeof getPigCollisionBoxes === "function") {
    if (getPigCollisionBoxes().some((pigBox) => isColliding(playerBox, pigBox))) {
      return false;
    }
  }

  // Naka-lagay na Crafter/Stove (craft.js/stove.js) - totoong hadlang
  // na ngayon, hindi na madadaanan.
  if (typeof getPlacedCrafterCollisionBoxes === "function") {
    if (
      getPlacedCrafterCollisionBoxes().some((box) => isColliding(playerBox, box))
    ) {
      return false;
    }
  }

  if (typeof getPlacedStoveCollisionBoxes === "function") {
    if (
      getPlacedStoveCollisionBoxes().some((box) => isColliding(playerBox, box))
    ) {
      return false;
    }
  }

  return true;
}
