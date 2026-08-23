// =========================
// COLLISIONS
// =========================

let collisions = [];

function getPlayerCollisionBox(x = player.x, y = player.y) {
  return {
    x: x + 4,
    y: y + 12,
    width: 16,
    height: 10,
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
