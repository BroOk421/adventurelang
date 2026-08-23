// =========================
// NAKA-SAVE NA INVENTORY/CRAFTING (localStorage)
// =========================
//
// Kaparehong-pareho ng disenyo ng PLAYER_SAVE_KEY (player.js)/
// DIG_SAVE_KEY (dig.js)/RESOURCE_SAVE_KEY (resources.js) - itinatabi sa
// localStorage ng browser para MANATILI kahit mag-reload/bumalik ka
// mamaya: lahat ng NAKOLEKTANG STOCK (wood/stone/carrot/torch/gold/
// crafter/charcoal/stove), ang mga NA-UNLOCK na kasangkapan (pickaxe/
// rake/axe/sword), ang KASALUKUYANG NAKA-EQUIP (pickaxe/rake/axe/torch/
// arrow), ang buong HOTBAR (pinnedSlots/pinnedSlotCounts) at BAG
// (bagSplitStacks/itemDefaultBagPosition), at ang mga PERMANENTENG
// naka-lagay na Crafter/Stove sa mundo.
//
// SADYANG HINDI kasama dito ang groundItems (mga item na nakalapag pa
// lang, hindi pa nadadampot) - session-lang talaga ito (tingnan ang
// paliwanag sa ground-items.js, may sarili itong 60-segundong
// "despawn" pa rin kahit hindi mag-reload).
//
// Kailangang MAULING i-load ito PAGKATAPOS ng lahat ng script na
// nagdedeklara ng mga variable na ito (hotbar.js/dig.js/resources.js/
// craft.js/stove.js) - kaya ito ang PINAKAHULING <script> na
// umaasa dito sa index.html (bago pa lang ang tool-radial.js/atmosphere.js
// atbp, na hindi naman umaasa dito).

// ".v2" - kaparehong dahilan ng PLAYER_SAVE_KEY (player.js): kailangang
// i-clear ang laman ng inventory (testing data lang, hindi na dapat
// makita ng manlalaro) - sa halip na direktang burahin ang localStorage
// ng aktwal na browser ng user (hindi natin magagalaw iyon dito),
// itinaas na lang natin ang bersyon, kaya HINDI na mababasa/gagamitin
// pa ang lumang laman - magsisimula sa panimulang estado (lahat 0/
// walang laman) ang susunod na pag-load, parang bagong laro. Itaas
// ulit ito balang araw kung may kailangan pang i-clear.
// ".v4" - binago ang default ng axeUnlocked (resources.js) papuntang
// "true" para may axe na agad ang manlalaro (para masubukan ang bagong
// axeStrike swing animation) - kailangang itaas ulit ang bersyon dito,
// kung hindi, mananatiling "false" ito para sa mga dating naka-save na
// (matatabunan ng lumang laman ang bagong default).
// ".v5" - parehong dahilan ng ".v4" - binago ang default ng
// pickaxeUnlocked/rakeUnlocked (dig.js) papuntang "true" para may
// pickaxe/rake na agad ang manlalaro para masubukan ang mga bagong
// swing animation nito.
// ".v6" - parehong dahilan ng ".v4"/".v5" - ibinalik na sa NORMAL na
// panimulang estado (0/false sa lahat) ang carrotsCollected/
// woodCollected/torchesCollected (dig.js/resources.js) at ang
// pickaxeUnlocked/rakeUnlocked/axeUnlocked (dig.js/resources.js) -
// dating "testing stock/tools" lang ang mga ito (para agad masubukan
// ang mga bagong swing animation), pero hindi na dapat makita ng
// aktwal na manlalaro - dapat magsimula silang WALANG laman ang bag at
// kailangan pa munang mag-craft bago magkaroon ng pickaxe/rake/axe.
const INVENTORY_SAVE_KEY = "tralala.inventory.v6";

// Mabagal ang localStorage - kagaya ng maybeSavePlayerPosition
// (update.js), hindi tayo nagsu-save KADA TAWAG (maaaring paulit-ulit
// ito mula sa syncHotbarUI, na tumatakbo nang madalas) - sapat nang
// "iskedyul" ang isang save sa loob ng kaunting sandali, kahit paulit-
// ulit na hilingin ito bago pa man umabot doon (debounce).
let inventorySaveTimer = null;

function scheduleInventorySave() {
  if (inventorySaveTimer) return; // may naka-iskedyul na, huwag nang dagdagan

  inventorySaveTimer = setTimeout(() => {
    inventorySaveTimer = null;
    saveInventoryState();
  }, 500);
}

function serializeInventoryState() {
  return {
    // Nakolektang stock ng bawat "simpleng" resource.
    wood: woodCollected,
    stone: stoneCollected,
    carrot: carrotsCollected,
    torch: torchesCollected,
    gold: goldCollected,
    crafter: craftersCollected,
    charcoal: typeof charcoalCollected !== "undefined" ? charcoalCollected : 0,
    stove: typeof stovesCollected !== "undefined" ? stovesCollected : 0,
    meat: typeof meatCollected !== "undefined" ? meatCollected : 0,
    cookedmeat: typeof cookedmeat !== "undefined" ? cookedmeat : 0,

    // Mga na-craft/na-unlock na kasangkapan (boolean).
    pickaxeUnlocked: typeof pickaxeUnlocked !== "undefined" ? pickaxeUnlocked : false,
    rakeUnlocked: typeof rakeUnlocked !== "undefined" ? rakeUnlocked : false,
    axeUnlocked: typeof axeUnlocked !== "undefined" ? axeUnlocked : false,
    swordUnlocked: typeof swordUnlocked !== "undefined" ? swordUnlocked : false,

    // BAGO: pickaxe/rake/axe na na-craft na PERO hindi pa na-double
    // click/i-INSTALL papunta sa tool radial - nakalagay pa lang ito
    // bilang normal na item sa bag (tingnan ang bahagi 7, item 17 sa
    // CLAUDE.md). Hiwalay ito sa itaas na "Unlocked" (na ngayon ay
    // nangangahulugan ng "naka-install na sa circle, hindi na
    // makikita sa bag").
    pickaxeInInventory:
      typeof pickaxeInInventory !== "undefined" ? pickaxeInInventory : false,
    rakeInInventory:
      typeof rakeInInventory !== "undefined" ? rakeInInventory : false,
    axeInInventory:
      typeof axeInInventory !== "undefined" ? axeInInventory : false,

    // Kasalukuyang naka-equip (right hand/left hand) - para bumalik sa
    // parehong "kasangkapan sa kamay" pagkatapos mag-reload.
    pickaxeEquipped: typeof pickaxeEquipped !== "undefined" ? pickaxeEquipped : false,
    rakeEquipped: typeof rakeEquipped !== "undefined" ? rakeEquipped : false,
    axeEquipped: typeof axeEquipped !== "undefined" ? axeEquipped : false,
    arrowEquipped: typeof arrowEquipped !== "undefined" ? arrowEquipped : false,
    torchEquipped: typeof torchEquipped !== "undefined" ? torchEquipped : false,

    // Buong hotbar (1-9) at bag (split-stacks + default na posisyon ng
    // bawat item type).
    pinnedSlots: typeof pinnedSlots !== "undefined" ? pinnedSlots : {},
    pinnedSlotCounts: typeof pinnedSlotCounts !== "undefined" ? pinnedSlotCounts : {},
    bagSplitStacks: typeof bagSplitStacks !== "undefined" ? bagSplitStacks : {},
    itemDefaultBagPosition:
      typeof itemDefaultBagPosition !== "undefined" ? itemDefaultBagPosition : {},

    // Mga permanenteng naka-lagay na bagay sa mundo (Crafter/Stove).
    placedCrafters: typeof placedCrafters !== "undefined" ? placedCrafters : [],
    placedStoves: typeof placedStoves !== "undefined" ? placedStoves : [],
  };
}

function saveInventoryState() {
  try {
    localStorage.setItem(INVENTORY_SAVE_KEY, JSON.stringify(serializeInventoryState()));
  } catch (error) {
    // Puwedeng naka-block ang localStorage (hal. private browsing) -
    // hindi kritikal, tuloy lang ang laro, wala lang matatandaan.
  }
}

function loadInventoryState() {
  let saved;

  try {
    const raw = localStorage.getItem(INVENTORY_SAVE_KEY);

    if (raw) saved = JSON.parse(raw);
  } catch (error) {
    saved = null; // sirang laman - magsimula na lang sa TALAGANG walang laman
  }

  // Walang naka-save (bagong laro, o ni-clear - tingnan ang tala sa
  // INVENTORY_SAVE_KEY sa itaas) - TALAGANG WALANG LAMAN ang simula
  // (hindi ang "panimulang starter kit" na naka-hardcode sa ibang
  // script - carrotsCollected=5 sa dig.js, torchesCollected=3/
  // woodCollected=4 sa resources.js - dito na ang HULING salita kung
  // ano talaga ang laman sa simula).
  if (!saved || typeof saved !== "object") {
    woodCollected = 0;
    stoneCollected = 0;
    carrotsCollected = 0;
    torchesCollected = 0;
    goldCollected = 0;
    craftersCollected = 0;
    if (typeof charcoalCollected !== "undefined") charcoalCollected = 0;
    if (typeof stovesCollected !== "undefined") stovesCollected = 0;
    if (typeof meatCollected !== "undefined") meatCollected = 0;
    if (typeof cookedmeat !== "undefined") cookedmeat = 0;

    return;
  }

  if (Number.isFinite(saved.wood)) woodCollected = saved.wood;
  if (Number.isFinite(saved.stone)) stoneCollected = saved.stone;
  if (Number.isFinite(saved.carrot)) carrotsCollected = saved.carrot;
  if (Number.isFinite(saved.torch)) torchesCollected = saved.torch;
  if (Number.isFinite(saved.gold)) goldCollected = saved.gold;
  if (Number.isFinite(saved.crafter)) craftersCollected = saved.crafter;
  if (Number.isFinite(saved.charcoal) && typeof charcoalCollected !== "undefined") {
    charcoalCollected = saved.charcoal;
  }
  if (Number.isFinite(saved.stove) && typeof stovesCollected !== "undefined") {
    stovesCollected = saved.stove;
  }
  if (Number.isFinite(saved.meat) && typeof meatCollected !== "undefined") {
    meatCollected = saved.meat;
  }
  if (Number.isFinite(saved.cookedmeat) && typeof cookedmeat !== "undefined") {
    cookedmeat = saved.cookedmeat;
  }

  if (typeof pickaxeUnlocked !== "undefined") pickaxeUnlocked = Boolean(saved.pickaxeUnlocked);
  if (typeof rakeUnlocked !== "undefined") rakeUnlocked = Boolean(saved.rakeUnlocked);
  if (typeof axeUnlocked !== "undefined") axeUnlocked = Boolean(saved.axeUnlocked);
  if (typeof swordUnlocked !== "undefined") swordUnlocked = Boolean(saved.swordUnlocked);

  if (typeof pickaxeInInventory !== "undefined") {
    pickaxeInInventory = Boolean(saved.pickaxeInInventory);
  }
  if (typeof rakeInInventory !== "undefined") {
    rakeInInventory = Boolean(saved.rakeInInventory);
  }
  if (typeof axeInInventory !== "undefined") {
    axeInInventory = Boolean(saved.axeInInventory);
  }

  if (typeof pickaxeEquipped !== "undefined") pickaxeEquipped = Boolean(saved.pickaxeEquipped);
  if (typeof rakeEquipped !== "undefined") rakeEquipped = Boolean(saved.rakeEquipped);
  if (typeof axeEquipped !== "undefined") axeEquipped = Boolean(saved.axeEquipped);
  if (typeof arrowEquipped !== "undefined") arrowEquipped = Boolean(saved.arrowEquipped);
  if (typeof torchEquipped !== "undefined") torchEquipped = Boolean(saved.torchEquipped);

  if (saved.pinnedSlots && typeof saved.pinnedSlots === "object") {
    pinnedSlots = saved.pinnedSlots;
  }

  if (saved.pinnedSlotCounts && typeof saved.pinnedSlotCounts === "object") {
    pinnedSlotCounts = saved.pinnedSlotCounts;
  }

  if (saved.bagSplitStacks && typeof saved.bagSplitStacks === "object") {
    bagSplitStacks = saved.bagSplitStacks;
  }

  if (saved.itemDefaultBagPosition && typeof saved.itemDefaultBagPosition === "object") {
    itemDefaultBagPosition = saved.itemDefaultBagPosition;
  }

  if (Array.isArray(saved.placedCrafters) && typeof placedCrafters !== "undefined") {
    placedCrafters = saved.placedCrafters;
    placedCrafterIdCounter = placedCrafters.reduce(
      (max, entry) => Math.max(max, entry.id + 1),
      0,
    );
  }

  if (Array.isArray(saved.placedStoves) && typeof placedStoves !== "undefined") {
    placedStoves = saved.placedStoves;
    placedStoveIdCounter = placedStoves.reduce((max, entry) => Math.max(max, entry.id + 1), 0);
  }
}

loadInventoryState();

// Ang paunang syncHotbarUI() (dulo ng hotbar.js) ay TUMAKBO NA bago pa
// man ma-load ang naka-save na estadong ito (mauna ang hotbar.js sa
// script order) - kailangang mag-refresh ulit dito para talagang
// makita ang naibalik na estado.
if (typeof syncHotbarUI === "function") syncHotbarUI();

// Ang pag-equip ng torch ay may kasamang epekto sa left hand equipment
// slot/torch-burning visual (tingnan ang equipTorch sa resources.js) -
// pero DIRETSO lang natin binago ang "torchEquipped" sa itaas (hindi
// dumaan sa equipTorch mismo), kaya siguraduhin nating buhay/tumpak pa
// rin ang torch-burning visual kung naka-equip pa rin ito.
if (typeof torchEquipped !== "undefined" && torchEquipped) {
  if (typeof updateTorchBurnVisual === "function") updateTorchBurnVisual();
}
