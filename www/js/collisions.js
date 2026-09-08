// =========================
// COLLISIONS
// =========================

let collisions = [];

// BINAGO - dating FIXED na pixel values ito (x+4, y+12, width:16,
// height:10), kinalkula/"eyeballed" noong 16x24 pa lang ang
// player.width/height (yung ORIHINAL na bata na sprite). Nung pinalaki
// ang character (56x64 ngayon, tingnan player.js), hindi na tumutugma
// yung lumang box - halos "nakadikit" na lang ito sa itaas-kaliwang
// sulok ng bagong mas malaking sprite (malayo sa TALAGANG paanan), kaya
// "mali"/"maaga" ang pakiramdam ng collision (parang may nabanggang
// hadlang kahit malayo pa ang mga paa sa tingin).
//
// Ngayon PROPORTIONAL na sa player.width/height mismo ang hitbox
// (porsyento, hindi fixed pixel), kaya kahit magbago pa ulit ang laki
// ng character sa hinaharap, awtomatikong sumusunod ang collision box -
// hindi na kailangang i-retouch ito paulit-ulit. Maliit/nasa PAANAN
// lang ang box (hindi buong katawan), gaya ng dati - top-down na
// paraan, para makatabi ang player sa isang bagay hanggang sa
// "makalapit" ang kanyang mga paa dito, hindi ang buong (mas malaking)
// sprite/ulo/balikat.
function getPlayerCollisionBox(x = player.x, y = player.y) {
  const width = player.width * 0.45;
  const height = player.height * 0.22;

  return {
    x: x + (player.width - width) / 2,
    y: y + player.height - height,
    width,
    height,
  };
}

// BAGO (hiling ng user): "gusto ko yung character dapat nakaharap sa
// mismong may mga function lang para ma use" - hindi na sapat na basta
// MALAPIT/ABOT lang (isTileInReach sa dig.js, o ang reach-margin ng
// getDoorUnderPlayer sa worlds.js) - dapat TALAGA ring NAKAHARAP
// (player.direction) ang player papunta sa bagay bago niya ito magamit
// - stove, crafter, bed, pintuan, atbp. Generic na PIXEL-based na
// helper ito (hindi tile-based) para magamit ng lahat ng iba't ibang
// uri ng "target" (tile center para sa stove/crafter/bed, gitna ng
// door.area para sa mga pintuan).
//
// Paraan: kinukuha ang direksyon (deltaX/deltaY) mula sa GITNA ng
// collision box ng player patungo sa target point, tapos tinitingnan
// kung tumutugma ito sa kasalukuyang player.direction - gamit ang
// "45-degree cone" (ang PANGUNAHING axis ng galaw ay dapat mas malaki
// o kapantay sa KABILANG axis) sa halip na eksaktong tuwid na linya
// lang - kung hindi, imposibleng magamit ang isang bagay na hindi
// eksaktong nasa parehong hanay/hilera (hal. isang malaking kama na
// ilang tile ang lapad).
function isPlayerFacingWorldPoint(targetX, targetY) {
  const box = getPlayerCollisionBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  const deltaX = targetX - centerX;
  const deltaY = targetY - centerY;

  // Sobrang lapit/halos magkapatong na - huwag nang pilitin pa ang
  // facing check dito (iwas maling "hindi ka nakaharap" kahit
  // literal na nasa ibabaw/gitna mismo ng player ang target).
  if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return true;

  switch (player.direction) {
    case "up":
      return deltaY < 0 && Math.abs(deltaX) <= Math.abs(deltaY);
    case "down":
      return deltaY > 0 && Math.abs(deltaX) <= Math.abs(deltaY);
    case "left":
      return deltaX < 0 && Math.abs(deltaY) <= Math.abs(deltaX);
    case "right":
      return deltaX > 0 && Math.abs(deltaY) <= Math.abs(deltaX);
    default:
      return true;
  }
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

  // Naka-lagay na Light/Lamp (light.js) - kaparehong-pareho ng Crafter/
  // Stove sa itaas (bagong hiling ng user) - totoong hadlang na rin ito
  // ngayon (1 tile lang, kaysa 2 tile ng Crafter/Stove).
  if (typeof getPlacedLightCollisionBoxes === "function") {
    if (
      getPlacedLightCollisionBoxes().some((box) => isColliding(playerBox, box))
    ) {
      return false;
    }
  }

  // Naka-lagay na Bed (bed.js) - bagong hiling ng user, totoong hadlang
  // na rin ito ngayon (2x3 tiles).
  if (typeof getPlacedBedCollisionBoxes === "function") {
    if (
      getPlacedBedCollisionBoxes().some((box) => isColliding(playerBox, box))
    ) {
      return false;
    }
  }

  // Custom na bahay ni Joseph/manlalaro (builder.js, hiling ng user:
  // "kahit saan pwede basta walang collisions na matamaan") - totoong
  // hadlang (buong footprint MINUS ang butas/pintuan nito).
  if (typeof getCustomHouseCollisionBoxes === "function") {
    if (
      getCustomHouseCollisionBoxes().some((box) => isColliding(playerBox, box))
    ) {
      return false;
    }
  }

  // AYOS (hiling ng user): "alisin mo na yung collisions niya kung san
  // siya naka drop" - dating totoong hadlang (parang Crafter/Stove) ang
  // naka-lagay na Bag sa mundo - HINDI na ngayon, madadaanan/
  // matatapakan na lang ito (kaparehong gawi ng ordinaryong ground
  // item, hindi solidong istruktura).

  return true;
}
