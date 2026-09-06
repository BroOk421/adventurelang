// =========================
// MGA ITEM NA NAKALAPAG SA LUPA
// =========================
//
// Kapag na-ani ang isang carrot/puno/bato, O ibinato mula sa isang
// hotbar slot (tingnan ang dropItemFromSlotIntoWorld) - hindi na ito
// deretsong napupunta sa bag. Nakalapag muna ito bilang FISIKAL na
// bagay sa mundo, hanggang sa damputin - awtomatiko na ngayon ang
// pagdampot, basta i-click ito habang abot (tingnan ang hasHandActionAt
// sa dig.js).
//
// Session-lang ito (hindi naka-save sa localStorage) - katulad ng
// digEffects, nire-reset ito tuwing mag-reload.

let groundItems = []; // { id, world, col, row, itemId, count, offsetX, offsetY, bornAt }
let groundItemIdCounter = 0;

// Cache ng mga PNG icon (BAG_ITEMS.icon) na ginagamit ng drawGroundItems
// sa ibaba - isang beses lang i-load kada path, tulad ng RESOURCE_IMAGES
// sa resources.js.
const GROUND_ITEM_ICON_IMAGES = {};

// Paano idinaragdag sa bag ang bawat uri ng item (GENERIC na ngayon,
// gumagana sa LAHAT ng item type, hindi lang carrot/wood/stone) -
// tingnan ang tryPickupGroundItemsAt. Ang mga "boolean" na tool
// (pickaxe/rake/axe/sword - walang tunay na bilang, tingnan ang
// pickaxeUnlocked atbp.) ay hiwalay na hawak dito, ang lahat ng iba
// (kasama na ang "crafter" - COUNTABLE na ito ulit ngayon, hindi na
// basta PERMANENTENG structure kapag na-drop/nadampot lang, tingnan
// ang dropItemFromSlotIntoWorld sa ibaba) ay dumadaan sa
// adjustGlobalItemCount (para tumaas ang TOTAL), TAPOS sa
// routeCollectedItemIncrease (hotbar.js) - kung SAAN MAN kasalukuyang
// EXPLICIT na "nakatira" ang item na ito (hotbar slot o bag
// split-stack), doon idinaragdag ang bagong bilang, HINDI basta sa
// bagong/hiwalay na cell - kaya hindi ito "duplicate".
function collectGroundItem(itemId, count) {
  // Direktang "Unlocked" na (kaparehong bagong gawi ng craft.js,
  // collectCraftOutput) - kung SAKALING may nakalapag pang pickaxe/
  // rake/axe sa lupa (hal. lumang groundItems bago pa ang bagong
  // "direktang sa circle" na gawi), hindi na ito babalik bilang
  // normal na item sa bag - deretso na ring naka-install/equip-ready
  // sa tool radial.
  if (itemId === "pickaxe") pickaxeUnlocked = true;
  else if (itemId === "rake") rakeUnlocked = true;
  else if (itemId === "axe") axeUnlocked = true;
  else if (itemId === "sword") swordUnlocked = true;
  else {
    if (typeof adjustGlobalItemCount === "function")
      adjustGlobalItemCount(itemId, count);
    if (typeof routeCollectedItemIncrease === "function") {
      routeCollectedItemIncrease(itemId, count);
    }

    // AYOS (hiling ng user): "lagyan mo na rin ng ganung effects sa
    // trees kung ilan nakuha niya like 3... galing head pa taas konti
    // na +1 +2 +3 kada isa +1 isa pa +2 +3 pero isang label lang" -
    // floating text (floating-text.js) sa itaas ng ulo ng player -
    // "mergeKey" = itemId, kaya kung SUNOD-SUNOD (loob ng ilang
    // segundo) ang pagdampot ng PAREHONG item type (hal. 3 magkakahiwalay
    // na piraso ng kahoy mula sa isang puno), ISANG label lang ang
    // gagamitin/dadagdagan (+1 -> +2 -> +3), hindi tatlong hiwalay na
    // lumulutang na text.
    if (typeof spawnFloatingText === "function" && typeof player !== "undefined") {
      const pos = getPlayerHeadPosition();

      spawnFloatingText(pos.x, pos.y, "+" + count, {
        color: "#ffe98a",
        mergeKey: "pickup:" + itemId,
        amount: count,
      });
    }
  }
}

// Kapag maraming piraso ang lumalabas sabay-sabay (hal. 2 carrot mula
// sa isang ani), pinaghihiwalay natin ang oras ng paglabas nila
// (bornAt) para may "isa-isang lumalabas" na pakiramdam sa halip na
// biglaang sabay-sabay - tingnan ang mga caller (dig.js/resources.js).
const GROUND_ITEM_SPAWN_STAGGER_MS = 90;

// Kada ground item, may sariling "landing" animation - lumulukso
// paitaas saglit bago tuluyang lumapag, nananatili itong buo/tumpak,
// kapareho ng talagang madadampot pa, hanggang talagang ma-click/
// madampot (tingnan ang tryPickupGroundItemsAt) O hanggang mag-expire
// ito (tingnan ang GROUND_ITEM_DESPAWN_MS sa ibaba) - kaya laging
// magkatugma ang nakikita mo sa lupa at ang aktwal na natitira pang
// kunin.
const GROUND_ITEM_LAND_MS = 380;
const GROUND_ITEM_LAND_HEIGHT = 20; // pixels paitaas

// Kada ground item (ani man mula sa puno/bato/carrot, O sinadyang
// ihagis mula sa bag/slot) - may 1 minutong "buhay" na lang bago ito
// mawala kung hindi pa nadadampot, sinisimulan mula sa (naka-stagger
// nang) bornAt - hindi mula sa oras ng pagtawag sa spawnGroundItem (para
// hindi maapektuhan ng GROUND_ITEM_SPAWN_STAGGER_MS ang tunay na
// simula ng bilang).
const GROUND_ITEM_DESPAWN_MS = 60 * 1000;

// Ilang segundo bago matapos ang buhay ng isang item, saan nagsisimulang
// unti-unting kumupas (fade) bilang babala bago ito tuluyang mawala.
const GROUND_ITEM_FADE_WARNING_MS = 3 * 1000;

// =========================
// "VACUUM"/MAGNET EFFECT - lumilipad papunta sa player kapag malapit na
// =========================
//
// Kapag nasa loob ng GROUND_ITEM_MAGNET_RADIUS ang player (at TAPOS na
// sa "landing" bounce ang item, tingnan ang age check sa ibaba), unti-
// unting humihila ang item papunta sa gitna ng player - mas mabilis
// habang papalapit (parang vacuum) - hanggang MAABOT ito
// (GROUND_ITEM_MAGNET_CATCH_DISTANCE), saka awtomatikong nadadampot,
// walang kailangang i-click.
//
// BINAGO (hiling ng user): "1 tile distance" - eksaktong 1 TILE na
// lang ang layo bago mag-umpisang mahila/ma-loot ang isang nakalapag
// na item (dating mas malawak, TILE_SIZE * 3.2) - kasama na dito ang
// mga "floating"/nabreak na Crafter/Stove/Bag (tingnan ang
// breakPlacedCrafter/breakPlacedStove/breakPlacedBag) at ang normal na
// ani (trunk/wood/stone/atbp.) - PAREHONG generic na sistema ito para
// sa LAHAT ng ground item, hindi na kailangan pang idagdag nang
// bukod-bukod kada item type.
const GROUND_ITEM_MAGNET_RADIUS = TILE_SIZE * 1;
const GROUND_ITEM_MAGNET_CATCH_DISTANCE = 5; // world pixels
const GROUND_ITEM_MAGNET_MIN_SPEED = 0.09; // pixels/ms, sa dulo ng radius (mabagal)
const GROUND_ITEM_MAGNET_MAX_SPEED = 0.6; // pixels/ms, kapag halos naabot na (mabilis)

// Tinatawag kada frame mula sa update.js - tinatanggal ang mga item na
// lumagpas na sa GROUND_ITEM_DESPAWN_MS na buhay, gaano man karaming
// mundo ang mayroon nito (isang session-wide na array ito). Dito rin
// ngayon ang magnet effect (itaas) - TALAGANG deltaMs (hindi
// speedScale) para pareho ang bilis ng paglipad nito kahit gaano man
// ka-mabagal/mabilis ang frame rate.
function updateGroundItems(deltaMs) {
  if (groundItems.length === 0) return;

  const now = performance.now();
  const frameDelta = deltaMs || 1000 / 60;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const collectedIds = new Set();

  for (const item of groundItems) {
    if (item.world !== currentWorld) continue; // ibang mundo, walang epekto

    const age = now - item.bornAt;

    // Huwag munang i-magnet habang lumulukso pa ang "landing" bounce
    // (age < 0 ay staggered pa, hindi pa lumitaw kahit paano).
    if (age < GROUND_ITEM_LAND_MS) continue;

    const centerX = item.col * TILE_SIZE + TILE_SIZE / 2 + item.offsetX;
    const centerY = item.row * TILE_SIZE + TILE_SIZE / 2 + item.offsetY;

    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > GROUND_ITEM_MAGNET_RADIUS) continue;

    if (dist <= GROUND_ITEM_MAGNET_CATCH_DISTANCE) {
      collectedIds.add(item.id);
      continue;
    }

    // Mas malakas ang hila habang papalapit sa player - hindi
    // pare-parehong bilis, para talagang parang na-"vacuum".
    const closeness = 1 - dist / GROUND_ITEM_MAGNET_RADIUS;
    const speed =
      GROUND_ITEM_MAGNET_MIN_SPEED +
      (GROUND_ITEM_MAGNET_MAX_SPEED - GROUND_ITEM_MAGNET_MIN_SPEED) * closeness;

    const step = Math.min(dist, speed * frameDelta);

    item.offsetX += (dx / dist) * step;
    item.offsetY += (dy / dist) * step;
  }

  if (collectedIds.size > 0) {
    for (const item of groundItems) {
      if (!collectedIds.has(item.id)) continue;

      collectGroundItem(item.itemId, item.count);

      if (typeof playPutSfx === "function") playPutSfx();
    }

    groundItems = groundItems.filter((item) => !collectedIds.has(item.id));

    if (typeof syncHotbarUI === "function") syncHotbarUI();
  }

  groundItems = groundItems.filter(
    (item) => now - item.bornAt < GROUND_ITEM_DESPAWN_MS,
  );
}

// delayMs - opsyonal, gaano katagal bago pa lang "lumabas" ang item na
// ito (tingnan ang GROUND_ITEM_SPAWN_STAGGER_MS).
function spawnGroundItem(col, row, itemId, count, delayMs = 0) {
  groundItems.push({
    id: groundItemIdCounter++,
    world: currentWorld,
    col,
    row,
    itemId,
    count,
    // Kaunting random na offset sa loob ng tile, para hindi
    // magkapatong-patong kapag maraming item sa parehong tile.
    offsetX: (Math.random() - 0.5) * TILE_SIZE * 0.4,
    offsetY: (Math.random() - 0.5) * TILE_SIZE * 0.3,
    bornAt: performance.now() + delayMs,
  });
}

function getGroundItemsAt(col, row) {
  return groundItems.filter(
    (item) =>
      item.world === currentWorld && item.col === col && item.row === row,
  );
}

// I-click gamit ang kamay sa isang tile na may nakalapag na item -
// ISA LANG ang nadadampot kada click (tingnan ang spawnGroundItem -
// hiwa-hiwalay na piraso ang bawat ani, hindi iisang tambak), kaya
// kailangang paulit-ulit i-click (may sariling "pick" animation kada
// isa - tingnan ang handleHandClick sa dig.js) hanggang maubos ang
// lahat ng nandoon. Nagbabalik ng true kung may nadampot, para ihinto
// ng caller ang ibang pagproseso ng click (hal. huwag nang subukang
// anihin ang carrot sa parehong tile).
function tryPickupGroundItemsAt(col, row) {
  const index = groundItems.findIndex(
    (item) =>
      item.world === currentWorld && item.col === col && item.row === row,
  );

  if (index === -1) return false;

  const item = groundItems[index];

  collectGroundItem(item.itemId, item.count);

  groundItems.splice(index, 1);

  if (typeof spawnDigEffect === "function") spawnDigEffect(col, row);

  // HINDI na ito awtomatikong nilalagay sa hotbar (1-9) - sa inventory
  // BAG na lang laging napupunta ang bagong nadampot na item (tingnan
  // ang itemDefaultBagPosition/ensureDefaultBagPositions sa hotbar.js -
  // "first come first serve", susunod na bakanteng posisyon sa grid,
  // hindi na sa hotkey bar). Manwal na lang i-drag mula sa bag papunta
  // sa hotbar kung gusto talagang mai-pin doon.
  if (typeof syncHotbarUI === "function") syncHotbarUI();

  return true;
}

// =========================
// PAGHAGIS MULA SA HOTBAR (drag palabas ng slot papunta sa mundo)
// =========================
//
// Wala tayong "per-slot" na bilang - ang isang slot ay salamin lang ng
// TOTAL na stock ng item na iyon sa bag. Kaya ang "paghagis" ay
// ibinabato ang BUONG kasalukuyang stock bilang isang stack sa lupa,
// tapos zinero ang bag - tingnan ang dropItemFromSlotIntoWorld sa
// hotbar.js.

function getPlayerFacingTile() {
  const box = getPlayerCollisionBox();

  let col = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  let row = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  if (player.direction === "up") row -= 1;
  else if (player.direction === "down") row += 1;
  else if (player.direction === "left") col -= 1;
  else if (player.direction === "right") col += 1;

  return { col, row };
}

// Tinatawag ng hotbar.js kapag binitawan (pointerup) ang isang hawak na
// item (tingnan ang "HOLD-DRAG SPLIT STACK" sa hotbar.js) sa ibabaw ng
// mundo (canvas) - ibinabato ang "amount" (kung saan man ito galing -
// hotbar slot, bag master, o bag split-stack) bilang isang stack sa
// lupa. Ang PAGBAWAS naman ng stock (adjustGlobalItemCount) ay ginagawa
// na ng hotbar.js mismo pagkatapos nito, hindi dito. LAHAT ng item type
// (kasama na ang "crafter") ay pareho ang gawi dito - basta nakalapag/
// madadampot na ground item, hindi na basta agad PERMANENTENG structure
// (ang paglalagay ng crafter bilang PERMANENTENG bagay sa mundo ay
// hiwalay pa ring aksyon - i-select ang slot nito sa hotbar tapos
// i-click ang isang tile, tingnan ang isCrafterSlotSelected sa craft.js
// at ang mousedown listener sa dig.js).
function dropItemFromSlotIntoWorld(itemId, amount) {
  if (!amount || amount <= 0) return;

  const tile = getPlayerFacingTile();

  spawnGroundItem(tile.col, tile.row, itemId, amount);
}

// =========================
// PAGGUHIT
// =========================
//
// World space (kasama ng mga dug tile/footprints), sa ILALIM ng
// player at mga bagay - parang totoong nakalatag sa lupa, nalalakaran.

function getGroundItemIconImage(path) {
  if (!GROUND_ITEM_ICON_IMAGES[path]) {
    const img = new Image();

    img.src = path;
    GROUND_ITEM_ICON_IMAGES[path] = img;
  }

  return GROUND_ITEM_ICON_IMAGES[path];
}

function drawGroundItems() {
  if (groundItems.length === 0) return;

  const here = groundItems.filter((item) => item.world === currentWorld);

  if (here.length === 0) return;

  const now = performance.now();

  ctx.save();

  for (const ground of here) {
    const age = now - ground.bornAt;

    if (age < 0) continue; // staggered pa, hindi pa dapat lumitaw

    // Parabolic arc: 0 sa simula, pataas sa gitna, babalik sa 0 sa
    // dulo - parang tumatalon paitaas tapos lalapag sa tile. Pagkatapos
    // nito, laging 0 na ang liftY (nakalapag na, hindi na gumagalaw)
    // hanggang talagang madampot.
    let liftY = 0;

    if (age < GROUND_ITEM_LAND_MS) {
      const progress = age / GROUND_ITEM_LAND_MS;
      const arc = 4 * progress * (1 - progress);

      liftY = -arc * GROUND_ITEM_LAND_HEIGHT;
    }

    const centerX = ground.col * TILE_SIZE + TILE_SIZE / 2 + ground.offsetX;
    const centerY =
      ground.row * TILE_SIZE + TILE_SIZE / 2 + ground.offsetY + liftY;

    // Unti-unting kumukupas bilang babala bago tuluyang mawala
    // (GROUND_ITEM_DESPAWN_MS) - walang epekto habang mas bago pa ito.
    const msUntilDespawn = GROUND_ITEM_DESPAWN_MS - age;

    ctx.globalAlpha =
      msUntilDespawn < GROUND_ITEM_FADE_WARNING_MS
        ? Math.max(0, msUntilDespawn / GROUND_ITEM_FADE_WARNING_MS)
        : 1;

    if (ground.itemId === "carrot") {
      if (CARROT_ICON_IMAGE.complete && CARROT_ICON_IMAGE.naturalWidth > 0) {
        const w = TILE_SIZE * 0.5;
        const h = (w / CARROT_ICON_SRC.width) * CARROT_ICON_SRC.height;

        ctx.drawImage(
          CARROT_ICON_IMAGE,
          CARROT_ICON_SRC.x,
          CARROT_ICON_SRC.y,
          CARROT_ICON_SRC.width,
          CARROT_ICON_SRC.height,
          centerX - w / 2,
          centerY - h / 2,
          w,
          h,
        );
      }
    } else {
      // Lahat ng ibang item type - hinahanap muna kung may sariling
      // PNG icon na ito (BAG_ITEMS.icon, hotbar.js - dating "walang
      // sariling asset", pero MAY mga idinagdag na ngayon: wood/stone/
      // meat/torch/crafter/charcoal/stove/pickaxe/rake/axe/sword) -
      // GENERIC pa rin, gumagana sa KAHIT ANONG item na may `icon`,
      // hindi kailangang idagdag pa rin dito ang bawat bagong item
      // type. Kung wala talagang icon (hal. "cookedmeat" pa - walang
      // ibinigay na larawan dito), babalik sa emoji (iconEmoji).
      const groundItemDef =
        typeof BAG_ITEMS !== "undefined"
          ? BAG_ITEMS.find((entry) => entry.id === ground.itemId)
          : null;

      const iconImg = groundItemDef?.icon
        ? getGroundItemIconImage(groundItemDef.icon)
        : null;

      if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
        const w = TILE_SIZE * 0.55;
        const h = (w / iconImg.naturalWidth) * iconImg.naturalHeight;

        ctx.drawImage(iconImg, centerX - w / 2, centerY - h / 2, w, h);
      } else if (!groundItemDef?.icon) {
        const emoji = groundItemDef?.iconEmoji || "❓";

        ctx.font = TILE_SIZE * 0.55 + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, centerX, centerY);
      }
      // Kung may `icon` pero hindi pa "complete" (bahagyang naka-load
      // pa lang) - laktawan muna nang tahimik, sa halip na ipakita ang
      // emoji fallback saglit tapos biglang lumipat sa larawan (parang
      // "kumikislap").
    }
  }

  ctx.restore();
}
