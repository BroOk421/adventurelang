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
// ".v7" - hiling ng user: "bigyan mo muna ako sa inventory ng 1 light,
// stove at crafter" (para matest agad ang bagong placement system,
// Entry #64) - PERO may EXISTING na naka-save na siya (".v6"), kaya
// hindi naabot ang bagong default (craftersCollected/stovesCollected/
// lightsCollected = 1) sa ibaba - laging babalik doon sa dating naka-
// save na 0. Itinaas ang bersyon dito (parehong paraan ng ".v1") para
// ma-force ang bagong laro/panimulang estado - MATATABUNAN ang lumang
// progreso (hotbar/bag/placed structures) ng sinumang naglalaro na
// gamit ang lumang ".v6" na save.
// ".v8" - bagong hiling ng user: "lagay ka na lang muna din ng 1 bed
// panimula sa inventory" - PAREHONG dahilan/pattern ng ".v7" sa itaas
// (bagong default na starting stock, pero hindi maaabot kung may
// EXISTING nang naka-save) - itinaas ulit ang bersyon para ma-force ang
// bagong panimulang estado (1 Bed na agad, tingnan ang loadInventoryState
// sa ibaba).
// ".v9" - hiling ng user: "lagay ka rin ng 5 quantity ng carrots sa
// inventory for testing" (bagong FOOD/hunger system - EDIBLE_ITEMS,
// hotbar.js) - PAREHONG dahilan/pattern ng ".v7"/".v8" sa itaas (bagong
// default na starting stock, pero hindi maaabot kung may EXISTING nang
// naka-save) - itinaas ang bersyon dito para ma-force ang bagong
// panimulang estado (5 Carrot na agad, tingnan ang loadInventoryState
// sa ibaba).
const INVENTORY_SAVE_KEY = "tralala.inventory.v10";

// Mabagal ang localStorage - kagaya ng maybeSavePlayerPosition
// (update.js), hindi tayo nagsu-save KADA TAWAG (maaaring paulit-ulit
// ito mula sa syncHotbarUI, na tumatakbo nang madalas) - sapat nang
// "iskedyul" ang isang save sa loob ng kaunting sandali, kahit paulit-
// ulit na hilingin ito bago pa man umabot doon (debounce).
// BAGO (hiling ng user: "ayoko na ng auto save") - hindi na dapat
// mag-iskedyul ng save sa background (ang function na ito ay tinatawag
// nang MADALAS, tuwing may pagbabago sa hotbar/bag, mula sa
// syncHotbarUI) - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa disenyo ng "force" parameter na ginagamit ng lahat ng ibang
// save function sa buong laro. Dito, sapat nang gawing NO-OP na lang
// ang buong scheduleInventorySave() (hindi na kailangan pang mag-debounce
// ng isang bagay na hindi naman dapat mangyari).
function scheduleInventorySave() {
  // Sinasadyang walang laman - tingnan ang paliwanag sa itaas.
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
    light: typeof lightsCollected !== "undefined" ? lightsCollected : 0,
    meat: typeof meatCollected !== "undefined" ? meatCollected : 0,
    cookedmeat: typeof cookedmeat !== "undefined" ? cookedmeat : 0,
    bag: typeof bagCollected !== "undefined" ? bagCollected : 0,
    bed: typeof bedsCollected !== "undefined" ? bedsCollected : 0,

    // BAGO (hiling ng user: "add ka pala bed sa crafter tyaka
    // refrigerator...yung sa bed 123 slots wool...456 slots
    // silk...refrigerator naman is dapat iron") - bagong crafting
    // material/item, tingnan ang craft.js (woolCollected/silkCollected/
    // ironCollected/refrigeratorCollected).
    wool: typeof woolCollected !== "undefined" ? woolCollected : 0,
    silk: typeof silkCollected !== "undefined" ? silkCollected : 0,
    iron: typeof ironCollected !== "undefined" ? ironCollected : 0,
    refrigerator:
      typeof refrigeratorCollected !== "undefined" ? refrigeratorCollected : 0,

    // Mga na-craft/na-unlock na kasangkapan (boolean).
    pickaxeUnlocked: typeof pickaxeUnlocked !== "undefined" ? pickaxeUnlocked : false,
    rakeUnlocked: typeof rakeUnlocked !== "undefined" ? rakeUnlocked : false,
    axeUnlocked: typeof axeUnlocked !== "undefined" ? axeUnlocked : false,
    cutterUnlocked: typeof cutterUnlocked !== "undefined" ? cutterUnlocked : false,
    swordUnlocked: typeof swordUnlocked !== "undefined" ? swordUnlocked : false,

    // BAGO (hiling ng user): DURABILITY ng bawat tool (50 max, HIWALAY
    // na counter bawat isa - tingnan ang TOOL_DURABILITY_MAX/
    // useToolDurability sa dig.js).
    pickaxeDurability:
      typeof pickaxeDurability !== "undefined" ? pickaxeDurability : 0,
    rakeDurability: typeof rakeDurability !== "undefined" ? rakeDurability : 0,
    axeDurability: typeof axeDurability !== "undefined" ? axeDurability : 0,
    cutterDurability:
      typeof cutterDurability !== "undefined" ? cutterDurability : 0,

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
    cutterEquipped: typeof cutterEquipped !== "undefined" ? cutterEquipped : false,
    arrowEquipped: typeof arrowEquipped !== "undefined" ? arrowEquipped : false,
    torchEquipped: typeof torchEquipped !== "undefined" ? torchEquipped : false,
    // BAGO: naka-suot ba ang backpack (tingnan ang player.js -
    // sprites.bagIdle).
    bagEquipped: typeof bagEquipped !== "undefined" ? bagEquipped : false,

    // BAGO: "Hold" na item (hold.js) - kung anong itemId ang kasalukuyang
    // hawak sa ulo ng player (null kung wala).
    heldItemId: typeof heldItemId !== "undefined" ? heldItemId : null,

    // Buong hotbar (1-9) at bag (split-stacks + default na posisyon ng
    // bawat item type).
    pinnedSlots: typeof pinnedSlots !== "undefined" ? pinnedSlots : {},
    pinnedSlotCounts: typeof pinnedSlotCounts !== "undefined" ? pinnedSlotCounts : {},
    bagSplitStacks: typeof bagSplitStacks !== "undefined" ? bagSplitStacks : {},
    itemDefaultBagPosition:
      typeof itemDefaultBagPosition !== "undefined" ? itemDefaultBagPosition : {},

    // Mga permanenteng naka-lagay na bagay sa mundo (Crafter/Stove/Bag/Light/Bed).
    placedCrafters: typeof placedCrafters !== "undefined" ? placedCrafters : [],
    placedStoves: typeof placedStoves !== "undefined" ? placedStoves : [],
    placedBags: typeof placedBags !== "undefined" ? placedBags : [],
    placedLights: typeof placedLights !== "undefined" ? placedLights : [],
    placedBeds: typeof placedBeds !== "undefined" ? placedBeds : [],
  };
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveInventoryState(force = false) {
  if (!force) return;

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
  // INVENTORY_SAVE_KEY sa itaas) - TALAGANG WALANG LAMAN ang simula.
  //
  // AYOS (hiling ng user: "alisin mo na yung mga gamit sa bag gawin mo
  // siyang parang new player na walang gamit o kahit ano") - dating
  // may "starter kit" dito (99 wood/stone/charcoal, 5 carrot, 1 torch,
  // 1 crafter/stove/light/bed, atbp) - PANSAMANTALA/PAMBUBURA lang ito
  // dati, para sa pagte-test ng iba't ibang feature. TINANGGAL na ito -
  // TALAGANG 0/false/walang-laman na ngayon ang lahat sa isang bagong
  // laro, tulad ng dapat sa isang totoong bagong manlalaro.
  if (!saved || typeof saved !== "object") {
    woodCollected = 0;
    stoneCollected = 0;
    carrotsCollected = 0;
    torchesCollected = 0;
    goldCollected = 0;
    craftersCollected = 0;
    if (typeof charcoalCollected !== "undefined") charcoalCollected = 0;
    if (typeof stovesCollected !== "undefined") stovesCollected = 0;
    if (typeof lightsCollected !== "undefined") lightsCollected = 0;
    if (typeof meatCollected !== "undefined") meatCollected = 0;
    if (typeof cookedmeat !== "undefined") cookedmeat = 0;
    if (typeof bagCollected !== "undefined") bagCollected = 0;
    if (typeof bedsCollected !== "undefined") bedsCollected = 0;
    // BAGO (hiling ng user: "add ka pala bed sa crafter tyaka
    // refrigerator") - bagong crafting material/item, kaparehong-
    // pareho ng "new player" na ayos ng lahat sa itaas - 0 lahat sa
    // bagong laro.
    if (typeof woolCollected !== "undefined") woolCollected = 0;
    if (typeof silkCollected !== "undefined") silkCollected = 0;
    if (typeof ironCollected !== "undefined") ironCollected = 0;
    if (typeof refrigeratorCollected !== "undefined") refrigeratorCollected = 0;

    // Walang naka-craft na tool pa (pickaxeUnlocked/rakeUnlocked/
    // axeUnlocked = false pa rin) - 0 muna ang durability, fresh na 50
    // ang ibibigay sa sandaling ma-craft (collectCraftOutput, craft.js).
    if (typeof pickaxeDurability !== "undefined") pickaxeDurability = 0;
    if (typeof rakeDurability !== "undefined") rakeDurability = 0;
    if (typeof axeDurability !== "undefined") axeDurability = 0;
    if (typeof cutterDurability !== "undefined") cutterDurability = 0;

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

  // AYOS (hiling ng user: "gawin mo siyang parang new player na walang
  // gamit") - dating PINIPILIT (Math.max) ang wood/stone/charcoal na
  // HINDI bumaba sa 99 kahit ano ang laman ng save - pambubura/testing
  // lang ito dati. TINANGGAL na ito - ang TALAGANG naka-save (o 0 kung
  // walang laman/bagong laro) na ang laging sinusunod, walang artipisyal
  // na minimum.
  if (Number.isFinite(saved.stove) && typeof stovesCollected !== "undefined") {
    stovesCollected = saved.stove;
  }
  if (Number.isFinite(saved.light) && typeof lightsCollected !== "undefined") {
    lightsCollected = saved.light;
  }
  if (Number.isFinite(saved.meat) && typeof meatCollected !== "undefined") {
    meatCollected = saved.meat;
  }
  if (Number.isFinite(saved.cookedmeat) && typeof cookedmeat !== "undefined") {
    cookedmeat = saved.cookedmeat;
  }
  if (Number.isFinite(saved.bag) && typeof bagCollected !== "undefined") {
    bagCollected = saved.bag;
  }
  if (Number.isFinite(saved.bed) && typeof bedsCollected !== "undefined") {
    bedsCollected = saved.bed;
  }
  // BAGO (hiling ng user): "add ka pala bed sa crafter tyaka
  // refrigerator" - bagong crafting material/item, parehong-parehong
  // ayos ng paglo-load sa itaas.
  if (Number.isFinite(saved.wool) && typeof woolCollected !== "undefined") {
    woolCollected = saved.wool;
  }
  if (Number.isFinite(saved.silk) && typeof silkCollected !== "undefined") {
    silkCollected = saved.silk;
  }
  if (Number.isFinite(saved.iron) && typeof ironCollected !== "undefined") {
    ironCollected = saved.iron;
  }
  if (
    Number.isFinite(saved.refrigerator) &&
    typeof refrigeratorCollected !== "undefined"
  ) {
    refrigeratorCollected = saved.refrigerator;
  }


  if (typeof pickaxeUnlocked !== "undefined") pickaxeUnlocked = Boolean(saved.pickaxeUnlocked);
  if (typeof rakeUnlocked !== "undefined") rakeUnlocked = Boolean(saved.rakeUnlocked);
  if (typeof axeUnlocked !== "undefined") axeUnlocked = Boolean(saved.axeUnlocked);
  if (typeof cutterUnlocked !== "undefined") cutterUnlocked = Boolean(saved.cutterUnlocked);
  if (typeof swordUnlocked !== "undefined") swordUnlocked = Boolean(saved.swordUnlocked);

  // BAGO (hiling ng user): ibalik ang naka-save na DURABILITY - PERO
  // kung may EXISTING na naka-save na "Unlocked" na tool MULA PA BAGO
  // idinagdag ang durability feature na ito (walang number/`NaN` sa
  // saved.*Durability), bigyan ng BUONG/FRESH na durability (TOOL_
  // DURABILITY_MAX) sa halip na 0 - para hindi agad "sira" sa
  // paningin ng manlalaro ang tool na matagal na niyang ginagamit.
  {
    const cap = typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;

    if (typeof pickaxeDurability !== "undefined") {
      pickaxeDurability = Number.isFinite(saved.pickaxeDurability)
        ? saved.pickaxeDurability
        : pickaxeUnlocked
          ? cap
          : 0;
    }

    if (typeof rakeDurability !== "undefined") {
      rakeDurability = Number.isFinite(saved.rakeDurability)
        ? saved.rakeDurability
        : rakeUnlocked
          ? cap
          : 0;
    }

    if (typeof axeDurability !== "undefined") {
      axeDurability = Number.isFinite(saved.axeDurability)
        ? saved.axeDurability
        : axeUnlocked
          ? cap
          : 0;
    }

    if (typeof cutterDurability !== "undefined") {
      cutterDurability = Number.isFinite(saved.cutterDurability)
        ? saved.cutterDurability
        : cutterUnlocked
          ? cap
          : 0;
    }
  }

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
  if (typeof cutterEquipped !== "undefined") cutterEquipped = Boolean(saved.cutterEquipped);
  if (typeof arrowEquipped !== "undefined") arrowEquipped = Boolean(saved.arrowEquipped);
  if (typeof torchEquipped !== "undefined") torchEquipped = Boolean(saved.torchEquipped);
  if (typeof bagEquipped !== "undefined") bagEquipped = Boolean(saved.bagEquipped);

  if (typeof heldItemId !== "undefined") {
    heldItemId = saved.heldItemId || null;
  }

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

  // AYOS (hiling ng user: "bumabalik yung bag kapag nag sort") - kung
  // naka-suot ang bag (bagEquipped=true), dapat WALA itong slot sa
  // inventory grid. Puwedeng may LUMANG save data (bago ang ayos na
  // ito) na naglalaman pa rin ng bag bilang split stack (bagSplitStacks)
  // o may naka-pako itong itemDefaultBagPosition, kahit naka-suot -
  // kaya "bumabalik" ito pagka-load/pagka-Sort. Linisin dito: kung
  // naka-suot, alisin ang lahat ng bag na split stack AT ang naka-pako
  // nitong default position - pumapasok ito sa dynamic na sistema
  // (nakatago habang naka-suot, tingnan ang getBagDynamicPositions sa
  // hotbar.js).
  if (typeof bagEquipped !== "undefined" && bagEquipped) {
    if (typeof bagSplitStacks === "object" && bagSplitStacks) {
      for (const key in bagSplitStacks) {
        if (bagSplitStacks[key] && bagSplitStacks[key].itemId === "bag") {
          delete bagSplitStacks[key];
        }
      }
    }

    if (
      typeof itemDefaultBagPosition === "object" &&
      itemDefaultBagPosition &&
      itemDefaultBagPosition["bag"] !== undefined
    ) {
      delete itemDefaultBagPosition["bag"];
    }
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

  if (Array.isArray(saved.placedBags) && typeof placedBags !== "undefined") {
    placedBags = saved.placedBags;
    placedBagIdCounter = placedBags.reduce((max, entry) => Math.max(max, entry.id + 1), 0);
  }

  if (Array.isArray(saved.placedLights) && typeof placedLights !== "undefined") {
    placedLights = saved.placedLights;
    placedLightIdCounter = placedLights.reduce(
      (max, entry) => Math.max(max, entry.id + 1),
      0,
    );
  }

  if (Array.isArray(saved.placedBeds) && typeof placedBeds !== "undefined") {
    placedBeds = saved.placedBeds;
    placedBedIdCounter = placedBeds.reduce(
      (max, entry) => Math.max(max, entry.id + 1),
      0,
    );
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
