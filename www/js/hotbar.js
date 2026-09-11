// =========================
// HOTBAR (UI SA IBABA NG SCREEN)
// =========================
//
// 2 grupo na lang mula kaliwa: (1) 9-slot na inventory row - walang
// default na laman, lahat ng 9 slot ay puwedeng lagyan ng KAHIT ANONG
// item mula sa bag (click/drag/swap - tingnan sa ibaba), kasama na ang
// carrot (na nagsisilbing binhi kapag na-activate - tingnan ang
// activateHotbarSlot); (2) bag (key "B"). Ang pickaxe/kamay/axe/arrow
// ay WALA nang sariling slot dito - hawak-"V" na lang para pumili sa
// radial menu (tool-radial.js).

// Lahat ng 9 slot ng inventory row - clickable, may sariling id
// (hotbar-slot-1..9), bakante lahat hanggang may i-drag/i-click ka
// mula sa bag (tingnan ang pinItemToSlot/syncPinnedSlots sa ibaba).
(function renderEmptyInventorySlots() {
  const row = document.getElementById("hotbar-inventory-row");

  if (!row) return;

  for (let i = 1; i <= 9; i++) {
    const slot = document.createElement("button");

    slot.type = "button";
    slot.className = "hotbar-slot hotbar-slot-empty";
    slot.id = "hotbar-slot-" + i;
    slot.title = "Bakante";

    const key = document.createElement("span");

    key.className = "hotbar-key";
    key.textContent = String(i);

    slot.appendChild(key);
    row.appendChild(slot);

    slot.addEventListener("pointerdown", (event) =>
      startPointerAction("slot", i, event),
    );

    // Pigilan ang OS/browser context menu - ginagamit ang RIGHT-CLICK
    // dito para sa Alt+Right-Click na "bawas" (tingnan ang "ALT +
    // LEFT-CLICK" sa itaas).
    slot.addEventListener("contextmenu", (event) => event.preventDefault());

    // Double-click - dagdag na paraan (bukod sa pag-drag) para i-equip
    // ang laman nito, kung "equipable" ito (torch lang - tingnan ang
    // DOUBLE_CLICK_EQUIPABLE_ITEMS).
    slot.addEventListener("dblclick", () => {
      equipViaDoubleClick(pinnedSlots[i], i);
    });
  }
})();

function syncHotbarUI() {
  if (typeof ensureDefaultBagPositions === "function")
    ensureDefaultBagPositions();

  syncPinnedSlots();
  syncBagPanel();
  syncEquipmentPanel();
  syncEquipmentStats();

  if (typeof syncToolRadialUI === "function") syncToolRadialUI();
  if (typeof syncCraftPanel === "function") syncCraftPanel();
  if (typeof syncStovePanel === "function") syncStovePanel();

  // Naka-save sa localStorage ang halos lahat ng dumadaan dito (bag/
  // hotbar/crafting/placed structures) - tingnan ang inventory-save.js.
  if (typeof scheduleInventorySave === "function") scheduleInventorySave();
}

// =========================
// EQUIPMENT PANEL (paperdoll, kaliwang bahagi ng bag - tingnan ang
// index.html)
// =========================
//
// Ang helmet/shoulder/armor/gauntlets/boots ay static na placeholder
// pa lang (walang item/asset pa para dito) - dito lang ang left/right
// hand ang may aktwal na laman:
//
//   - Right hand: kasalukuyang naka-equip na WORKING TOOL (Alt radial -
//     pickaxe/rake/kamay/axe/arrow/binhi). HINDI kasama ang torch dito -
//     doon na lang sa LEFT hand ito lumalabas (tingnan sa ibaba).
//   - Left hand: ang torch kapag naka-equip (TANGING paraan para ma-
//     equip ito - i-drag mula sa bag/slot papunta sa #equip-slot-
//     lefthand), kung wala namang torch, sumasalamin na lang ito sa
//     kasalukuyang naka-highlight na item sa hotbar row
//     (selectedInventorySlot).
//
// Parehong left/right hand ay puwede ring i-drag PABALIK sa bag/trash
// para alisin/i-unequip ang laman nito - tingnan ang "TORCH SA LEFT
// HAND" pagkatapos ng syncBagPanel sa ibaba.

// Direksyon papuntang icon ng bawat WORKING TOOL - tingnan din ang
// #tool-radial sa index.html (parehong emoji). Sadyang hindi kasama
// dito ang torch - left hand na ang lugar niyan. Sadyang NASA DULO
// (pinakamababang priority) ang arrow - puwede na itong maging active
// KASABAY ng ibang tool (equipArrow sa resources.js), kaya kung may
// ibang "totoong" tool na naka-equip sabay ng arrow, iyon ang dapat
// lumabas sa right hand, hindi ang arrow. Arrow lang ang ipapakita
// kapag WALANG ibang tool na naka-equip.
// SADYANG hindi na kasama dito ang carrot/binhi - ang RIGHT HAND ay para
// lang sa TUNAY na kasangkapan (pickaxe/rake/axe/sword balang araw) - ang
// pagtatanim ay batay na lang sa gold-highlight/selection ng hotbar slot
// (selectedInventorySlot) mismo, hindi na "nag-o-occupy" ng right hand -
// tingnan ang isCarrotSlotSelected sa dig.js.
const EQUIP_RIGHT_HAND_ICON_BY_TOOL = [
  {
    equipped: () => pickaxeEquipped,
    iconHTML: () =>
      '<img src="./assets/items/pickaxe.png" alt="" class="hotbar-slot-item-img">',
    unequip: () => clearAllToolEquips(),
  },
  {
    equipped: () => rakeEquipped,
    iconHTML: () =>
      '<img src="./assets/items/rake.png" alt="" class="hotbar-slot-item-img">',
    unequip: () => clearAllToolEquips(),
  },
  {
    equipped: () => axeEquipped,
    iconHTML: () =>
      '<img src="./assets/items/axe.png" alt="" class="hotbar-slot-item-img">',
    unequip: () => clearAllToolEquips(),
  },
  // BAGO (hiling ng user): "cutter" - pang-putol ng damo, tingnan ang
  // grass.js/resources.js - pareho ng ibang "right hand" na tool sa
  // itaas.
  {
    equipped: () => typeof cutterEquipped !== "undefined" && cutterEquipped,
    iconHTML: () =>
      '<img src="./assets/items/cutter.png" alt="" class="hotbar-slot-item-img">',
    unequip: () => clearAllToolEquips(),
  },
  // Arrow - hindi kasama sa clearAllToolEquips (tingnan ang dig.js),
  // kaya dito lang natin ito talagang tine-toggle off kapag ito lang
  // mismo ang lumalabas (walang ibang totoong tool na kasabay).
  {
    equipped: () => arrowEquipped,
    iconHTML: () =>
      '<img src="./assets/items/punch.png" alt="" class="hotbar-slot-item-img">',
    unequip: () => equipArrow(),
  },
];

// Tinatawag kapag ni-drag PALABAS ang right hand pabalik sa bag/trash -
// i-unequip kung ano man ang kasalukuyang lumalabas dito (tingnan ang
// "unequip" ng bawat entry sa itaas).
function unequipRightHandTool() {
  const activeTool = EQUIP_RIGHT_HAND_ICON_BY_TOOL.find((entry) =>
    entry.equipped(),
  );

  if (activeTool) activeTool.unequip();
}

function setEquipSlotContent(id, iconHTML) {
  const el = document.getElementById(id);

  if (!el) return;

  el.innerHTML = iconHTML || "";
  el.classList.toggle("equip-slot-filled", Boolean(iconHTML));
}

function syncEquipmentPanel() {
  if (!document.getElementById("equipment-panel")) return;

  const activeTool = EQUIP_RIGHT_HAND_ICON_BY_TOOL.find((entry) =>
    entry.equipped(),
  );

  setEquipSlotContent(
    "equip-slot-righthand",
    activeTool ? activeTool.iconHTML() : "",
  );

  // AYOS (bug: "yung bag sa profile hindi nag-uupdate/hindi lumalabas
  // kapag na-Use habang may naka-equip na torch") - VERIFIED sa
  // recording: may naka-equip na torch (nasa left hand) sa buong video.
  // Dating NASA IBABA pa (pagkatapos ng torch na bahagi) ang pag-update
  // ng bag slot - PERO kapag naka-equip ang torch, may `return` (sa
  // ibaba) na tumatakbo MUNA bago pa man marating ang bag na bahagi,
  // kaya HINDI KAILANMAN NAA-UPDATE ang bag slot habang may torch -
  // "stuck" ito sa kung ano man ang huling laman nito (o sa dating
  // naka-hardcode na larawan sa index.html). AYOS: INILIPAT dito sa
  // TAAS (bago pa ang anumang maagang `return`) ang buong pag-update ng
  // bag slot, para LAGI itong tama, may torch man o wala.
  updateBagEquipSlot();

  const leftHandEl = document.getElementById("equip-slot-lefthand");

  if (torchEquipped) {
    setEquipSlotContent(
      "equip-slot-lefthand",
      '<img src="./assets/items/torch.png" alt="" class="hotbar-slot-item-img">',
    );
    leftHandEl?.classList.add("torch-burning");

    // AYOS (hiling ng user): "kapag na hold and drop ko sa left hand
    // is kung ilan yung nasa inventory halimbawa 3 is dapat 3 din
    // nandun" - maliit na badge (parehong itsura ng bag/hotbar-badge)
    // na nagpapakita ng NATITIRANG bilang ng torch (torchesCollected -
    // kasama pa rin ang KASALUKUYANG nasusunog, dahil hindi pa ito
    // TALAGANG "nagagamit"/nababawas hangga't hindi pa TALAGANG
    // nauubos ang buong 3 minuto nito - tingnan ang updateTorchBurn,
    // resources.js). setEquipSlotContent (itaas) ang nag-iinnerHTML="",
    // kaya DITO PA LANG (pagkatapos noon) idinadagdag ang badge.
    if (leftHandEl) {
      let badge = leftHandEl.querySelector(".hotbar-badge");

      if (!badge) {
        badge = document.createElement("span");
        badge.className = "hotbar-badge";
        leftHandEl.appendChild(badge);
      }

      badge.textContent = torchesCollected > 99 ? "99+" : torchesCollected;
    }

    updateTorchBurnVisual();
    return;
  }

  leftHandEl?.classList.remove("torch-burning");

  // Torch LANG ang puwedeng lumabas dito - hindi na sumasalamin sa
  // kasalukuyang naka-highlight/naka-select na item sa hotbar (dating
  // gawi nito) - kung wala namang torch, laging blangko na lang ito.
  setEquipSlotContent("equip-slot-lefthand", "");
}

// Buong pag-update ng #equip-slot-bag (profile bag slot) - HIWALAY na
// function ngayon (dating naka-inline sa dulo ng syncEquipmentPanel)
// para matawag ito nang MAAGA doon, BAGO pa ang maagang `return` na
// dulot ng torch (tingnan ang paliwanag sa itaas).
//
// AYOS (hiling ng user): "alisin mo na yung gauntlet icon dun sa
// mismong left center ng profile, palit mo yung bag para kapag nag
// use ako ng bag na bili kay oldman is dun mapunta" - DEDIKADO na ang
// slot na ito sa bag (id="equip-slot-bag", index.html): 🎒 placeholder
// kapag WALANG naka-suot, at ang MISMONG bag.png kapag naka-"Use"/
// naka-suot (bagEquipped) - kahit saan pa nanggaling ang bag (na-craft,
// o binili kay Oldman/decor.js - PAREHONG dumadaan sa iisang
// "bagEquipped" flag/useBagEquip()). Left-click dito habang naka-suot
// ay nag-uunequip (tingnan ang pointerdown listener sa ibaba).
function updateBagEquipSlot() {
  const bagSlotEl = document.getElementById("equip-slot-bag");

  if (!bagSlotEl) return;

  const bagIsEquipped = typeof bagEquipped !== "undefined" && bagEquipped;

  if (bagIsEquipped) {
    bagSlotEl.innerHTML =
      '<img src="./assets/items/bag.png" alt="" class="hotbar-slot-item-img">';
    bagSlotEl.title = "Bag - click to remove";
  } else {
    bagSlotEl.innerHTML = "🎒";
    bagSlotEl.title = "Bag";
  }

  bagSlotEl.classList.toggle("equip-slot-filled", bagIsEquipped);
}

// Tinatawag KADA FRAME mula sa update() (update.js) - mas magaan kaysa
// buong syncHotbarUI (na muling binubuo ang buong bag panel grid),
// direktang DOM style update lang ito, para makinis ang progress bar
// ng pagkasunog ng torch nang hindi nagpapabagal.
function updateTorchBurnVisual() {
  if (!torchEquipped) return;

  const el = document.getElementById("equip-slot-lefthand");

  if (!el) return;

  const progress = Math.max(
    0,
    Math.min(1, torchRemainingMs / TORCH_LIFESPAN_MS),
  );

  el.style.setProperty("--torch-progress", progress);
}

// =========================
// EQUIPMENT STATS (sa ilalim ng equipment-panel - index.html)
// =========================
//
// AYOS: ang health/stamina/exp/level ay TUNAY na gumagana na ngayon
// (tingnan ang gainExp sa itaas) - hindi na basta static placeholder.
// Ang ATK/DEF/Crit DMG/Crit Chance ay PLACEHOLDER/COSMETIC pa rin
// (walang tunay na combat system sa likod nito), naka-laan lang para
// sa susunod na feature.
// =========================
// LEVEL / EXP
// =========================
//
// Bagong "leveling system" - simple pero TUNAY na gumagana (hindi na
// basta static placeholder tulad ng dati): may PLAYER_STATS.level
// (nagsisimula sa 1) at PLAYER_STATS.exp (current/max). Tuwing may
// exp na "kinita" (tingnan ang gainExp), pinupuno ang exp bar - pag
// umabot/lumagpas sa max, "level up": +1 sa level, natitirang labis
// na exp ay DUMADAAN/carry-over sa bagong bar (hindi basta nawawala),
// at TUMATAAS ang kailangang exp para sa SUSUNOD na level
// (EXP_LEVEL_GROWTH) - kaya unti-unting humihirap/tumatagal ang bawat
// susunod na level, kagaya ng karaniwang RPG. Bilang gantimpala,
// napupuno ulit ang health/stamina sa bawat level up.
const EXP_LEVEL_GROWTH = 1.18; // +18% na kailangang exp kada level

function gainExp(amount) {
  if (!amount || amount <= 0) return;

  PLAYER_STATS.exp.current += amount;

  let leveledUp = false;

  while (PLAYER_STATS.exp.current >= PLAYER_STATS.exp.max) {
    PLAYER_STATS.exp.current -= PLAYER_STATS.exp.max;
    PLAYER_STATS.exp.max = Math.round(PLAYER_STATS.exp.max * EXP_LEVEL_GROWTH);
    PLAYER_STATS.level += 1;
    leveledUp = true;
  }

  if (leveledUp) {
    // Gantimpala - buo ulit ang health/stamina kada level up.
    PLAYER_STATS.health.current = PLAYER_STATS.health.max;
    PLAYER_STATS.stamina.current = PLAYER_STATS.stamina.max;

    if (typeof showSettingsToast === "function") {
      showSettingsToast(
        "Level Up! Ngayon ay Level " + PLAYER_STATS.level + " ka na. 🎉",
      );
    }
  }

  syncEquipmentStats();
}

// =========================
// FOOD / HUNGER (BAGONG HILING ng user)
// =========================
//
// "gusto ko i add mo sa baba ng stamina yung foods duration naman na
// need niya kumain once na nagugutom na yung character siguro from
// 1-100 yung duration kada random 2-3 mins is nababawasan yung food
// duration ng random -4 to 5" - PLAYER_STATS.food (0-100, tingnan sa
// itaas). Kada RANDOM na 2-3 minuto (tunay na oras, hindi apektado ng
// speedScale - kaparehong konsepto ng TORCH_LIFESPAN_MS), bumabawas ito
// ng RANDOM na 4-5 - PAULIT-ULIT (bagong random interval kada tick).
// "sa min is yung nababawasan kapag naubos na yung foods, tsaka lang
// mababawasan ang health" - kapag TALAGANG naubos na (food.current <=
// 0), sa HALIP na food, ang HEALTH na ang binabawasan sa BAWAT susunod
// na tick (walang eksaktong bilang na sinabi ang user para dito - ginamit
// ang STARVATION_HEALTH_LOSS_MIN/MAX bilang makatwirang default,
// proporsyonal sa bagong 500 max health).
const FOOD_DECAY_MIN_MS = 1 * 60 * 1000;
const FOOD_DECAY_MAX_MS = 2 * 60 * 1000;
const FOOD_DECAY_MIN_AMOUNT = 4;
const FOOD_DECAY_MAX_AMOUNT = 5;

const STARVATION_HEALTH_LOSS_MIN = 10;
const STARVATION_HEALTH_LOSS_MAX = 20;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// BAGO (hiling ng user): "kada tapos ng pag-pickaxe or axe sa pag putol
// ng puno is nababawasan yung foods duration ng -3... sa grass naman
// kada 3 na pag grass is -3 sa foods duration" - IISANG shared na
// helper na ito, ginagamit ng puno/bato (registerHit, resources.js) at
// ng damo/cutter (grass.js, kada ika-3 pagputol) - basta bawasan ang
// food (hindi hihina sa negative), tapos i-sync ang UI.
function decreaseFoodDuration(amount) {
  PLAYER_STATS.food.current = Math.max(0, PLAYER_STATS.food.current - amount);

  if (typeof syncEquipmentStats === "function") syncEquipmentStats();
}

let nextFoodTickAt =
  Date.now() + randomBetween(FOOD_DECAY_MIN_MS, FOOD_DECAY_MAX_MS);

// Tinatawag kada frame mula sa update() (update.js) - tunay na oras
// (Date.now()-based, hindi deltaMs/speedScale) ang batayan, kaya hindi
// ito apektado ng zoom/fps, kaparehong klase ng updateTorchBurn.
function updateFoodHunger() {
  if (Date.now() < nextFoodTickAt) return;

  nextFoodTickAt =
    Date.now() + randomBetween(FOOD_DECAY_MIN_MS, FOOD_DECAY_MAX_MS);

  if (PLAYER_STATS.food.current > 0) {
    const amount = Math.round(
      randomBetween(FOOD_DECAY_MIN_AMOUNT, FOOD_DECAY_MAX_AMOUNT),
    );

    PLAYER_STATS.food.current = Math.max(0, PLAYER_STATS.food.current - amount);
  } else {
    // Nagugutom na - ang HEALTH na ang binabawasan.
    const amount = Math.round(
      randomBetween(STARVATION_HEALTH_LOSS_MIN, STARVATION_HEALTH_LOSS_MAX),
    );

    PLAYER_STATS.health.current = Math.max(
      0,
      PLAYER_STATS.health.current - amount,
    );
  }

  syncEquipmentStats();
}

const PLAYER_STATS = {
  name: "Farmer",
  level: 1,
  // BAGO (hiling ng user): 500/500 na ang max health (dating 100/100).
  health: { current: 500, max: 500 },
  stamina: { current: 100, max: 100 },
  // BAGO (hiling ng user): "FOOD" duration/hunger - 1-100 (nagsisimula
  // sa buo/100, hindi pa gutom). Tingnan ang updateFoodHunger sa ibaba
  // para sa gawi ng pagbaba nito (random na 4-5 kada random na 2-3
  // minuto), at eatItem para sa pagdaragdag (kumakain).
  food: { current: 100, max: 100 },
  exp: { current: 0, max: 100 },
  // Base bare-hand damage - meron pa ring dmg kahit walang naka-equip
  // na sword (walang totoong weapon system pa, placeholder na number
  // lang muna).
  atk: 50,
  def: 0,
  critDmg: 150,
  critChance: 5,
};

function setStatBarFill(id, fraction) {
  const el = document.getElementById(id);

  if (!el) return;

  el.style.width = Math.max(0, Math.min(1, fraction)) * 100 + "%";
}

function syncEquipmentStats() {
  // Ang bagong top-left HUD (#player-hud) ay laging nakikita (hindi
  // tulad ng #equipment-stats sa ibaba na nasa loob ng bag panel) -
  // kaya ito muna, BAGO ang guard sa ibaba.
  syncPlayerHud();

  if (!document.getElementById("equipment-stats")) return;

  setStatBarFill(
    "stat-fill-health",
    PLAYER_STATS.health.current / PLAYER_STATS.health.max,
  );
  setStatBarFill(
    "stat-fill-stamina",
    PLAYER_STATS.stamina.current / PLAYER_STATS.stamina.max,
  );
  setStatBarFill(
    "stat-fill-food",
    PLAYER_STATS.food.current / PLAYER_STATS.food.max,
  );
  setStatBarFill(
    "stat-fill-exp",
    PLAYER_STATS.exp.current / PLAYER_STATS.exp.max,
  );

  const atkEl = document.getElementById("stat-value-atk");
  const defEl = document.getElementById("stat-value-def");
  const critDmgEl = document.getElementById("stat-value-critdmg");
  const critChanceEl = document.getElementById("stat-value-critchance");
  const levelEl = document.getElementById("stat-value-level");

  if (atkEl) atkEl.textContent = PLAYER_STATS.atk;
  if (defEl) defEl.textContent = PLAYER_STATS.def;
  if (critDmgEl) critDmgEl.textContent = PLAYER_STATS.critDmg + "%";
  if (critChanceEl) critChanceEl.textContent = PLAYER_STATS.critChance + "%";
  if (levelEl) levelEl.textContent = PLAYER_STATS.level;
}

// =========================
// TOP-LEFT HUD (#player-hud) - laging nakikita, hindi tulad ng
// #equipment-stats sa itaas (nakatago sa loob ng bag panel, kailangan
// pang buksan). Pangalan, health, stamina, at level+exp - tingnan ang
// index.html para sa markup.
// =========================
function syncPlayerHud() {
  if (!document.getElementById("player-hud")) return;

  const nameEl = document.getElementById("player-hud-name");
  const levelEl = document.getElementById("player-hud-level");

  if (nameEl) nameEl.textContent = PLAYER_STATS.name;
  if (levelEl) levelEl.textContent = "Lv. " + PLAYER_STATS.level;

  setStatBarFill(
    "player-hud-fill-health",
    PLAYER_STATS.health.current / PLAYER_STATS.health.max,
  );
  setStatBarFill(
    "player-hud-fill-stamina",
    PLAYER_STATS.stamina.current / PLAYER_STATS.stamina.max,
  );
  setStatBarFill(
    "player-hud-fill-food",
    PLAYER_STATS.food.current / PLAYER_STATS.food.max,
  );
  setStatBarFill(
    "player-hud-fill-exp",
    PLAYER_STATS.exp.current / PLAYER_STATS.exp.max,
  );
}

// PANSAMANTALA (tingnan ang paliwanag sa index.html,
// #player-hud-row-debug-coords) - live na col/row ng player, para sa
// paghahanap ng eksaktong lugar ng puno/bato/damo (fixedTrees/
// fixedStones sa resources.js, fixedGrassTufts sa grass.js). Tinatawag
// ito KADA FRAME (update.js), hindi lang paminsan-minsan tulad ng
// syncPlayerHud, dahil kailangang live/real-time ito habang lumalakad
// ang player. Tanggalin na lang ang buong function na ito (at ang
// tawag dito sa update.js) kapag tapos na sa paglalagay.
function syncDebugCoordsHud() {
  const el = document.getElementById("player-hud-debug-coords");

  if (!el) return;
  if (typeof player === "undefined" || typeof TILE_SIZE === "undefined") {
    return;
  }

  const col = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const row = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  el.textContent = "Col: " + col + ", Row: " + row;
}

function setHotbarSlotActive(id, active) {
  const el = document.getElementById(id);

  if (!el) return;

  el.classList.toggle("active", !!active);
}

// =========================
// BAG PANEL (lahat ng item)
// =========================
//
// Listahan ng bawat item na puwedeng makolekta - kada entry ay may
// icon (larawan O emoji - tingnan ang syncBagPanel) at function na
// kumukuha ng kasalukuyang bilang. Kahit anong item dito (kasama na
// ang carrot) ay pareho ang gawi - i-drag (o i-click para deretsong
// mapunta sa unang bakanteng slot) papunta sa kahit alin sa 9 na slot
// ng hotbar (tingnan ang "PAGLALAGAY/PAG-DRAG NG ITEM" sa ibaba).
// Kapag naka-slot na ang carrot, ang pag-activate dito (click/digit
// key - tingnan ang activateHotbarSlot) ang siyang nag-eequip nito
// bilang binhi para sa pagtatanim.

const BAG_GRID_COLUMNS = 8;

// BAGO (hiling ng user): "kapag walang bag is nasa 2 rows lang yung bag
// pero kapag naka equipt na mag fully max na yung bag" - limitado
// muna sa 2 hanay (16 slot) ang bag hangga't HINDI pa naka-"Use"/
// naka-suot ang backpack (bagEquipped, tingnan sa ibaba) - sa
// sandaling isuot ito, lumalaki papuntang FULL capacity
// (BAG_GRID_ROWS_MAX, 15 hanay = 120 slot). Ang mismong DATA ng mga
// item (itemDefaultBagPosition/bagSplitStacks) ay HINDI naaapektuhan
// nito - kahit anong posisyon (0-119) pa ang nakatalaga sa isang item,
// nananatili itong naka-imbak doon; "nagtatago" lang ang mga cell na
// LAMPAS sa kasalukuyang aktibong bilang ng hanay (hindi ginuguhit sa
// grid) hangga't hindi pa naka-suot ang bag - muling lalabas ang lahat
// sa sandaling isuot ito.
const BAG_GRID_ROWS_NO_BAG = 2;
const BAG_GRID_ROWS_MAX = 15;

function getActiveBagGridRows() {
  return typeof bagEquipped !== "undefined" && bagEquipped
    ? BAG_GRID_ROWS_MAX
    : BAG_GRID_ROWS_NO_BAG;
}

// =========================
// BACKPACK ("bag") - bilhin sa oldman (200 gold), tingnan decor.js
// OLDMAN_SHOP_ITEMS
// =========================
//
// Bilang ng bag na hawak (bag/inventory count) - "countable" na item,
// kaparehong pattern ng craftersCollected/stovesCollected sa itaas.
let bagCollected = 0;

// Naka-"suot"/naka-gamit ba ngayon ang bag? Toggle lang ito (tingnan
// ang "Use" sa showBagActionMenu sa ibaba) - kapag totoo, ipinapakita
// ng player.js ang idle sprite na may bag (sprites.bagIdle, assets.js)
// sa halip na ang normal na idle. HINDI ito bumabawas sa bagCollected -
// parang "nakasuot" lang, hindi "nagamit/naubos".
let bagEquipped = false;

// Mga bag na naka-lagay/naka-drop sa MUNDO (hindi pa "floating"/
// lootable - kaparehong-pareho ng konsepto ng placedCrafters sa
// craft.js: PERMANENTENG bagay muna ito sa lupa hangga't hindi pa
// "Break" ang piniling aksyon - tingnan ang showBagActionMenu).
let placedBags = []; // { world, col, row, id }
let placedBagIdCounter = 0;

const BAG_ITEMS = [
  {
    id: "carrot",
    label: "Carrot",
    // AYOS (hiling ng user, dating turn: "yung icon ng carrot lipat mo
    // dun sa vegetable na din") - dating "./assets/assets/carrots.png".
    icon: "./assets/vegetables/carrots/carrot.png",
    getCount: () => carrotsCollected,
  },
  // AYOS (multi-crop, hiling ng user: "i add mo na rin yung mga ibang
  // vegetables sa list ni maria para magamit buy/sell at pag plant at
  // pag grow pag drop at pick up ng gamit papuntang inventory") -
  // parehong-pareho ang anyo ng entry ng carrot sa itaas, iba lang ang
  // icon/counter. Ang planting/growing mismo ay hawak na ng CROP_TYPES
  // (dig.js) - dito lang kailangan para makita/mahawakan/ma-drag sila
  // sa bag/hotbar gaya ng ibang item.
  {
    id: "potato",
    label: "Potato",
    icon: "./assets/vegetables/potato/potato.png",
    getCount: () => potatoCollected,
  },
  {
    id: "cabbage",
    label: "Cabbage",
    icon: "./assets/vegetables/cabbage/cabbage.png",
    getCount: () => cabbageCollected,
  },
  {
    id: "eggplant",
    label: "Eggplant",
    icon: "./assets/vegetables/eggplant/eggplant.png",
    getCount: () => eggplantCollected,
  },
  {
    id: "wood",
    label: "Wood",
    icon: "./assets/items/wood.png",
    getCount: () => woodCollected,
  },
  {
    id: "stone",
    label: "Stone",
    icon: "./assets/items/stone.png",
    getCount: () => stoneCollected,
  },
  {
    id: "meat",
    label: "Meat",
    icon: "./assets/items/meat.png",
    // Nakukuha mula sa pagpatay ng pig (1-3 random, tingnan ang
    // killPig sa pig.js) - lumalapag muna sa lupa (kaparehong gawi ng
    // wood/stone/carrot), kailangan pa ring damputin.
    getCount: () => (typeof meatCollected !== "undefined" ? meatCollected : 0),
  },
  {
    id: "torch",
    label: "Torch",
    icon: "./assets/items/torch.png",
    // Stackable/countable na rin ito (resources.js) - nauubos ang
    // bawat isa pagkatapos ng 3 minutong pagkasunog (tingnan ang
    // updateTorchBurn).
    getCount: () => torchesCollected,
  },
  {
    id: "crafter",
    label: "Crafting Table",
    icon: "./assets/items/crafter.png",
    // Ginagawa sa crafting panel (craft.js, 4 wood) - i-drag papuntang
    // mundo (canvas) para ilagay bilang permanenteng "Crafter" (tingnan
    // ang placeCrafterInWorld/dropItemFromSlotIntoWorld).
    getCount: () => craftersCollected,
  },
  {
    id: "charcoal",
    label: "Charcoal",
    icon: "./assets/items/charcoal.png",
    // Nakukuha sa pag-smelt ng wood (fuel: wood/charcoal) sa loob ng
    // Stove - tingnan ang stove.js.
    getCount: () => charcoalCollected,
  },
  {
    id: "cookedmeat",
    label: "Cooked Meat",
    iconEmoji: "🍖",
    // Nakukuha sa pag-smelt ng raw "meat" (fuel: wood/charcoal) sa
    // loob ng Stove - tingnan ang SMELT_RECIPES sa stove.js. Walang
    // ibinigay na icon file para dito - emoji muna hanggang may
    // idagdag pa.
    getCount: () => (typeof cookedmeat !== "undefined" ? cookedmeat : 0),
  },
  {
    id: "stove",
    label: "Stove",
    icon: "./assets/items/stove.png",
    // Kaparehong-pareho ng gawi ng "crafter" (SHAPED recipe, i-drag
    // papuntang mundo para ilagay bilang permanenteng bagay) - pero
    // "advanced" (3x3) crafting panel ang bumubukas kapag na-click ito
    // sa mundo, may sarili itong smelting UI - tingnan ang stove.js.
    getCount: () => stovesCollected,
  },
  {
    id: "light",
    label: "Light",
    icon: "./assets/items/lamp.png",
    // Kaparehong-pareho ng gawi ng "crafter"/"stove" (i-highlight ang
    // slot tapos i-click ang isang tile SA LOOB NG BAHAY para ilagay
    // bilang permanenteng "Light" - may ON/OFF toggle) - tingnan ang
    // light.js.
    getCount: () =>
      typeof lightsCollected !== "undefined" ? lightsCollected : 0,
  },
  // Pickaxe/Rake/Axe - "boolean" na kasangkapan (walang tunay na
  // "bilang" - 0 kung hindi pa na-craft). DALAWANG yugto ngayon
  // (dating isang "Unlocked" flag lang): (1) "InInventory" - bago pa
  // lang na-craft, NORMAL na item ito sa bag/hotbar (makikita/
  // madra-drag/mapipili, PERO hindi pa gumagana/hindi pa equippable),
  // (2) "Unlocked" - TALAGANG na-INSTALL na sa tool radial (double-
  // click sa bag - tingnan ang equipViaDoubleClick sa ibaba) - dito na
  // lang ito equippable, at NAWAWALA na sa bag (getCount() → 0, kaya
  // "permanente" na itong nasa circle na lang, hindi na nag-oo-occupy
  // ng espasyo sa inventory). Tingnan ang pickaxeInInventory (dig.js),
  // rakeInInventory (dig.js), axeInInventory (resources.js).
  {
    id: "pickaxe",
    label: "Pickaxe",
    icon: "./assets/items/pickaxe.png",
    getCount: () => (pickaxeInInventory ? 1 : 0),
  },
  {
    id: "rake",
    label: "Rake",
    icon: "./assets/items/rake.png",
    getCount: () => (rakeInInventory ? 1 : 0),
  },
  {
    id: "axe",
    label: "Axe",
    icon: "./assets/items/axe.png",
    getCount: () => (axeInInventory ? 1 : 0),
  },
  {
    id: "cutter",
    label: "Cutter",
    icon: "./assets/items/cutter.png",
    // Tingnan ang cutterInInventory (resources.js) - hindi na aktibong
    // gamit (laging 0), naiwan lang para may label/icon ang guide
    // (renderCraftGuide) - diretso nang "Unlocked" ang cutter
    // (collectCraftOutput, craft.js), kaparehong-pareho ng pickaxe/
    // rake/axe sa itaas.
    getCount: () => (cutterInInventory ? 1 : 0),
  },
  {
    id: "sword",
    label: "Sword",
    icon: "./assets/items/sword.png",
    // tingnan ang swordUnlocked (craft.js) - parehong konsepto ng
    // pickaxeUnlocked/rakeUnlocked/axeUnlocked sa itaas.
    getCount: () => (swordUnlocked ? 1 : 0),
  },
  {
    id: "bag",
    label: "Backpack",
    icon: "./assets/items/bag.png",
    // Bilhin sa oldman (200 gold, decor.js OLDMAN_SHOP_ITEMS) -
    // right-click sa loob ng bag para lumabas ang "Use"/"Drop" na
    // menu (tingnan ang showBagActionMenu sa ibaba).
    getCount: () => bagCollected,
  },
  {
    id: "bed",
    label: "Bed",
    icon: "./assets/items/bed.png",
    // BAGO (hiling ng user): kaparehong-pareho na ngayon ito sa
    // "crafter"/"stove" (Hold -> preview sa tile -> i-click ilagay,
    // 2x3 na footprint, may collision) - bibilhin kay Oldman
    // (OLDMAN_SHOP_ITEMS, decor.js), hindi na "libre" sa bawat bahay -
    // tingnan ang bed.js. AYOS (hiling ng user): puwede na rin itong
    // ma-craft sa Crafter ngayon (wool/silk/wood - tingnan ang
    // CRAFT_SHAPED_RECIPES sa craft.js) - PAREHONG paraan (bili o
    // craft) ay parehong dumadaan sa iisang bedsCollected counter.
    getCount: () => (typeof bedsCollected !== "undefined" ? bedsCollected : 0),
  },
  {
    id: "wool",
    label: "Wool",
    icon: "./assets/items/wool.png",
    // BAGO (hiling ng user: "yung sa bed 123 slots wool ... nabibili
    // dun kay oldman") - crafting material para sa "bed" - bilhin kay
    // Oldman (OLDMAN_SHOP_ITEMS, decor.js), tingnan ang woolCollected
    // (craft.js).
    getCount: () => (typeof woolCollected !== "undefined" ? woolCollected : 0),
  },
  {
    id: "silk",
    label: "Silk",
    icon: "./assets/items/silk.png",
    // BAGO (hiling ng user: "456 slots silk nabibili din kay oldman") -
    // crafting material para sa "bed", kaparehong-pareho ng gawi ng
    // wool sa itaas - bilhin kay Oldman, tingnan ang silkCollected
    // (craft.js).
    getCount: () => (typeof silkCollected !== "undefined" ? silkCollected : 0),
  },
  {
    id: "iron",
    label: "Iron",
    icon: "./assets/items/iron.png",
    // BAGO (hiling ng user: "sa refrigerator naman is dapat iron...
    // siguro sa bato pero dapat gagawa ng cave map para dun magkaroon
    // ng iron") - crafting material para sa "refrigerator" - HINDI (sa
    // ngayon) nabibili kay Oldman/nakukuha sa paghukay - PAGMIMINA sa
    // isang HINAHARAP na "cave" na mundo ang plano (susunod na hiling
    // ng user, hindi pa ginawa) - tingnan ang ironCollected (craft.js).
    getCount: () => (typeof ironCollected !== "undefined" ? ironCollected : 0),
  },
  {
    id: "refrigerator",
    label: "Refrigerator",
    icon: "./assets/items/refrigerator.png",
    // BAGO (hiling ng user: "add ka pala bed sa crafter tyaka
    // refrigerator") - bagong craftable na item (8 iron sa paligid,
    // bakante ang gitna - tingnan ang CRAFT_SHAPED_RECIPES sa
    // craft.js) - simpleng "countable" na stock lang sa ngayon
    // (kaparehong-pareho ng gawi ng "bag" - walang world-placement pa,
    // puwedeng idagdag balang araw kung hihilingin).
    getCount: () =>
      typeof refrigeratorCollected !== "undefined" ? refrigeratorCollected : 0,
  },
];

// =========================
// BAG ACTION MENU ("Use"/"Drop" sa inventory, "Use"/"Break" sa lupa)
// =========================
//
// Munting floating menu (2 buton) na lumalabas malapit sa cursor -
// ginagamit ng DALAWANG lugar: (1) right-click sa "bag" sa loob ng
// inventory (tingnan ang pointerdown listener sa ibaba, "Use"/"Drop"),
// at (2) right-click sa isang NAKA-LAGAY na bag sa MUNDO (tingnan ang
// dig.js contextmenu listener, "Use"/"Break"). Isang beses lang bukas
// kada oras - awtomatikong nagsasara kapag nag-click sa labas nito o
// may bagong binuksan.
let bagActionMenuEl = null;

function closeBagActionMenu() {
  if (bagActionMenuEl) {
    bagActionMenuEl.remove();
    bagActionMenuEl = null;
  }
}

function showBagActionMenu(x, y, actions) {
  closeBagActionMenu();

  const menu = document.createElement("div");

  menu.className = "bag-action-menu";
  // Bahagyang i-clamp papasok sa screen, para hindi lumagpas sa gilid
  // kapag right-click sa sulok.
  menu.style.left = Math.min(x, window.innerWidth - 130) + "px";
  menu.style.top = Math.min(y, window.innerHeight - 80) + "px";

  for (const action of actions) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "bag-action-menu-btn";
    btn.textContent = action.label;

    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeBagActionMenu();
      action.onClick();
    });

    menu.appendChild(btn);
  }

  document.body.appendChild(menu);
  bagActionMenuEl = menu;
}

// Isara kapag nag-click kahit saan sa LABAS ng menu mismo.
document.addEventListener("pointerdown", (event) => {
  if (bagActionMenuEl && !bagActionMenuEl.contains(event.target)) {
    closeBagActionMenu();
  }
});

// =========================
// "ABOUT" NA POPUP (hiling ng user: "sa lahat ng labels lagyan mo ng
// about label lagay mo sa pinaka babang list ng pop up lahat ng items
// lagyan mo niyan nakapaloob sa about is item name ikaw na bahala sa
// description kahit 3 lines lang wag masyadong malaki yung text tapos
// price magkano ibenta sa oldman")
// =========================
//
// Maikling reference lang (2-3 linya) para sa bawat item - LAHAT ng
// BAG_ITEMS ay may sariling entry dito. Ipinapakita ito sa "About" na
// popup (showItemAboutPopup sa ibaba), kasama ang pangalan at ang
// presyo kapag ibinenta kay Oldman (mula sa OLDMAN_SHOP_ITEMS, kung
// meron - "Hindi tinatanggap ni Oldman" kung wala pang entry doon).
const ITEM_DESCRIPTIONS = {
  carrot: "Fresh vegetable from the farm. Can be eaten or replanted as seed.",
  wood: "Wood from chopping trees. Main ingredient for many crafts.",
  stone: "Stone from mining. Used for crafting sturdy equipment.",
  meat: "Raw meat from a pig. Can be eaten right away or cooked on the Stove first.",
  torch: "Gives off light in the dark. Equip in your left hand, burns down over time.",
  crafter: "Table for making various items. Place it in the world to use it.",
  charcoal: "Charcoal from burning wood on the Stove. Fuel for cooking.",
  cookedmeat: "Cooked meat, more nutritious than raw. Eat to satisfy hunger.",
  stove: "Stove for cooking/smelting. Place it in the world to use it.",
  light: "A lamp that can be turned on/off. Place it inside a house.",
  pickaxe: "Tool for mining stone. Use to equip it as your current tool.",
  rake: "Tool for digging soil. Use to equip it as your current tool.",
  axe: "Tool for chopping trees. Use to equip it as your current tool.",
  cutter: "Tool for cutting grass. Use to equip it as your current tool.",
  sword: "Weapon for combat. A future update is still coming.",
  bag: "A backpack that increases your bag slots. Use to equip it.",
  bed: "A bed - place it inside a house to sleep/save time.",
  wool: "Soft material from a sheep. Ingredient for making a Bed.",
  silk: "Fine, premium material. Also an ingredient for making a Bed.",
  iron: "Heavy metal. Ingredient for making a Refrigerator.",
  refrigerator: "Keeps food fresh. Place it inside a house.",
};

let itemAboutPopupEl = null;

function closeItemAboutPopup() {
  if (itemAboutPopupEl) {
    itemAboutPopupEl.remove();
    itemAboutPopupEl = null;
  }
}

// Hinahanap ang TALAGANG sell price mula sa OLDMAN_SHOP_ITEMS (iisang
// pinagmumulan lang, kaparehong-pareho ng ginagamit na ng
// getFoodTooltipText sa itaas) - `null` kung wala pang entry doon ang
// itemId na ito (hindi pa ito tinatanggap/binibili ni Oldman), sa
// halip na basta mag-imbento ng presyo na hindi naman TALAGANG
// gumagana kapag TALAGANG binenta.
function getItemSellPrice(itemId) {
  const shopEntry =
    typeof OLDMAN_SHOP_ITEMS !== "undefined"
      ? OLDMAN_SHOP_ITEMS.find((entry) => entry.itemId === itemId)
      : null;

  return shopEntry ? shopEntry.sellPrice : null;
}

function showItemAboutPopup(x, y, itemId) {
  closeBagActionMenu();
  closeItemAboutPopup();

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);
  const label = item ? item.label : itemId;
  const description =
    ITEM_DESCRIPTIONS[itemId] || "No details available for this yet.";

  const popup = document.createElement("div");

  popup.className = "bag-about-popup";
  popup.style.left = Math.min(x, window.innerWidth - 210) + "px";
  popup.style.top = Math.min(y, window.innerHeight - 130) + "px";

  const nameEl = document.createElement("div");

  nameEl.className = "bag-about-name";
  nameEl.textContent = label;
  popup.appendChild(nameEl);

  const descEl = document.createElement("div");

  descEl.className = "bag-about-desc";
  descEl.textContent = description;
  popup.appendChild(descEl);

  const priceEl = document.createElement("div");

  priceEl.className = "bag-about-price";

  // AYOS (hiling ng user): "sa about pala imbis na text na sell is
  // gawin mo icon ng gold lagay mo dun" - dating "Sell: X gold" (plain
  // text) - ginamit na ngayon ang PAREHONG gold ICON (🪙 emoji) na
  // ginagamit na ng ibang bahagi ng laro (decor.js - presyo sa oldman
  // shop) sa halip na ang salitang "gold".
  const sellPrice = getItemSellPrice(itemId);

  if (sellPrice === null) {
    priceEl.textContent = "Sell: Oldman does not buy this";
  } else {
    priceEl.textContent = "Sell: 🪙" + sellPrice;
  }

  popup.appendChild(priceEl);

  document.body.appendChild(popup);
  itemAboutPopupEl = popup;
}

document.addEventListener("pointerdown", (event) => {
  if (itemAboutPopupEl && !itemAboutPopupEl.contains(event.target)) {
    closeItemAboutPopup();
  }
});

// =========================
// "USE" ANG BAG - suotin/gamitin (bagEquipped, tingnan player.js)
// =========================
//
// AYOS (hiling ng user: "kapag ni-uuse ko yung bag hindi napupunta dun
// sa bag slot, nasa inventory pa rin"): dating TOGGLE ito
// (bagEquipped = !bagEquipped) - kung SAKALING naka-save na sa
// browser ang bagEquipped=true mula sa isang NAUNANG pagkaka-equip
// (localStorage, tingnan ang inventory-save.js), ang PAG-CLICK ng
// "Use" (akala ng manlalaro ay UNANG PAGKAKATAON niya itong i-e-equip)
// ay MAG-U-UNEQUIP sa HALIP (dahil true na ito, naging false) - kaya
// "walang epekto"/"babalik lang sa inventory" ang nakikita, imbes na
// lumipat sa bag slot. Ngayon, DEFINITIVE na ang "Use" - LAGING
// nag-eequip (true), kahit ano pa ang naunang estado - walang
// pagkakataong "toggle papuntang false" ito. Ang PAG-UNEQUIP ay
// hiwalay/malinaw na aksyon na (i-click ang equip-slot-bag mismo
// habang naka-suot, o "Drop" - tingnan ang mga pointerdown listener
// sa ibaba).
function useBagEquip() {
  bagEquipped = true;

  // AYOS (hiling ng user: "di nawawala sa inventory e kapag naka used
  // na") - VERIFIED sa script na test: kapag naka-imbak ang bag bilang
  // isang SPLIT STACK (bagSplitStacks - nangyayari kapag NA-DRAG mo ito
  // papunta sa ibang slot, o pagkatapos mag-Sort, o mula sa ilang lumang
  // save state), ang resolveBagCellAt() ay UNANG-UNANG ibinabalik ang
  // split entry na iyon nang DIRETSO - walang tinitingnan kung naka-
  // equip ba (kaiba sa "master"/dynamic na sistema, na may ganoong
  // guard) - kaya NANANATILING nakikita sa inventory ang bag KAHIT
  // naka-suot na. AYOS: kapag nag-Use (nag-equip), i-DISSOLVE muna ang
  // LAHAT ng split stack ng "bag" pabalik sa generic na pool (delete
  // bilang split; buo pa rin ang bagCollected, hindi ito bumababa) -
  // kaya PAREHONG-PAREHONG "dynamic" na ang trato dito: nagtatago habang
  // naka-suot, at muling lumalabas (via getBagDynamicPositions) sa unang
  // bakanteng slot pagka-Unuse.
  dissolveBagSplitStacks();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Tinatanggal ang LAHAT ng split-stack na "bag" (bagSplitStacks) -
// hindi ito bumabawas sa bagCollected (na siyang totoong bilang ng bag
// na hawak), inaalis lang ang PAGKAKA-PAKO nito sa isang partikular na
// slot, para pumasok ito sa generic/dynamic na sistema (tingnan ang
// useBagEquip sa itaas para sa dahilan).
function dissolveBagSplitStacks() {
  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (stack && stack.itemId === "bag") {
      delete bagSplitStacks[key];
    }
  }
}

// Hiwalay/malinaw na "Unequip" - laging nagse-set sa false (kaparehong
// dahilan ng pagiging "definitive" ng useBagEquip sa itaas). Tingnan
// ang "BAG SA INVENTORY - DYNAMIC NA POSISYON" sa ibaba (malapit sa
// getBagDynamicPositions) para sa BAGONG paraan (mula sa scratch) kung
// paano nirereresolba KUNG SAAN lalabas ang bag sa inventory pagbalik
// nito dito - hindi na ito umaasa sa PERMANENTENG posisyon.
function unequipBag() {
  bagEquipped = false;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// =========================
// "DROP" ANG BAG - ilagay sa lupa (PERMANENTENG bagay muna, hindi pa
// "floating"/lootable - kaparehong konsepto ng placeCrafterInWorld sa
// craft.js) - SA HARAP ng player, base sa KASALUKUYANG hinaharap na
// direksyon niya (angle/facing) - tingnan ang getPlayerFacingTile.
// =========================
function placeBagInWorld(col, row) {
  if (bagCollected <= 0) return;

  let tile = col !== undefined && row !== undefined ? { col, row } : null;

  if (!tile) {
    tile =
      typeof getPlayerFacingTile === "function" ? getPlayerFacingTile() : null;
  }

  if (!tile) return;

  placedBags.push({
    world: currentWorld,
    col: tile.col,
    row: tile.row,
    id: placedBagIdCounter++,
  });

  if (typeof adjustGlobalItemCount === "function")
    adjustGlobalItemCount("bag", -1);
  if (typeof consumeItemFromWherever === "function")
    consumeItemFromWherever("bag", 1);

  // AYOS: kung SAKALING naka-suot ito habang ino-"Drop" (hal. mula sa
  // bagong right-click menu ng equip-slot-bag mismo), tanggalin din
  // ang "naka-suot" na estado - wala na ring nakaturing na bag sa
  // inventory/katawan.
  if (typeof bagEquipped !== "undefined" && bagEquipped) {
    bagEquipped = false;
  }

  if (typeof playPutSfx === "function") playPutSfx();

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Kapag nag-right-click sa BAG sa loob ng inventory (tingnan ang
// pointerdown listener sa ibaba) - lumalabas ang "Use"/"Drop" na menu.
function dropBagFromInventory() {
  placeBagInWorld();
}

// May naka-lagay bang bag sa eksaktong cell na ito (kasalukuyang
// mundo)? Tingnan ang paggamit nito sa dig.js (contextmenu listener).
function getPlacedBagAt(col, row) {
  return (
    placedBags.find(
      (bag) => bag.world === currentWorld && bag.col === col && bag.row === row,
    ) || null
  );
}

// "Use" sa isang NAKA-LAGAY na bag sa mundo - dinadampot ULIT PABALIK
// sa inventory AT sinusuot/ginagamit agad (bagEquipped = true) - iisang
// hakbang na lang, sa halip na dalawang hiwalay na aksyon.
function usePlacedBag(bag) {
  const index = placedBags.indexOf(bag);

  if (index === -1) return;

  placedBags.splice(index, 1);

  if (typeof adjustGlobalItemCount === "function")
    adjustGlobalItemCount("bag", 1);
  if (typeof routeCollectedItemIncrease === "function")
    routeCollectedItemIncrease("bag", 1);

  bagEquipped = true;

  if (typeof playPutSfx === "function") playPutSfx();
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// "Break" sa isang NAKA-LAGAY na bag sa mundo - kaparehong-pareho ng
// breakPlacedCrafter (craft.js): TINATANGGAL ito bilang PERMANENTENG
// bagay, at sa HALIP ay lumalabas bilang ORDINARYONG FLOATING/lootable
// na ground item (spawnGroundItem, ground-items.js) - "kapag na-break,
// LUMULUTANG na" (hiling ng user) - kailangan pang lapitan (1 tile,
// tingnan GROUND_ITEM_MAGNET_RADIUS) bago talaga mapunta sa bag.
function breakPlacedBag(bag) {
  const index = placedBags.indexOf(bag);

  if (index === -1) return;

  placedBags.splice(index, 1);

  if (typeof spawnGroundItem === "function") {
    spawnGroundItem(bag.col, bag.row, "bag", 1);
  }

  if (typeof spawnDigEffect === "function") spawnDigEffect(bag.col, bag.row);
}

// =========================
// COLLISION NG NAKA-LAGAY NA BAG
// =========================
//
// AYOS (hiling ng user, BINAWI): dating totoong hadlang (kaparehong
// pattern ng Crafter/Stove) ang naka-lagay/naka-drop na Bag sa mundo -
// "alisin mo na yung collisions niya kung san siya naka drop" - HINDI
// na ito hadlang ngayon (tingnan ang canMoveTo, collisions.js at
// canFeetMoveTo, decor.js - hindi na tinatawag ang function na ito sa
// alinman sa dalawa) - madadaanan/matatapakan na lang ito, kaparehong
// gawi ng ordinaryong ground item. NAIWAN pa rin ang FUNCTION na ito
// (hindi tinanggal) sakaling may ibang gustong gumamit muli nito sa
// hinaharap - pero WALANG TUMATAWAG dito ngayon kahit saan.
const BAG_COLLISION_SIZE = TILE_SIZE * 0.7;

function getPlacedBagCollisionBoxes() {
  if (placedBags.length === 0) return [];

  const inset = (TILE_SIZE - BAG_COLLISION_SIZE) / 2;

  return placedBags
    .filter((bag) => bag.world === currentWorld)
    .map((bag) => ({
      x: bag.col * TILE_SIZE + inset,
      y: bag.row * TILE_SIZE + inset,
      width: BAG_COLLISION_SIZE,
      height: BAG_COLLISION_SIZE,
    }));
}

// Iginuguhit sa PAREHONG layer/oras ng drawGroundItems/drawPlacedCrafters
// (draw.js) - world space, gamit ang bag icon (BAG_ITEMS.icon).
function drawPlacedBags() {
  if (placedBags.length === 0) return;

  const here = placedBags.filter((bag) => bag.world === currentWorld);

  if (here.length === 0) return;

  const iconPath = "./assets/items/bag.png";

  if (!drawPlacedBags.iconImg) {
    drawPlacedBags.iconImg = new Image();
    drawPlacedBags.iconImg.src = iconPath;
  }

  const img = drawPlacedBags.iconImg;

  ctx.save();

  for (const bag of here) {
    const centerX = bag.col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = bag.row * TILE_SIZE + TILE_SIZE / 2;

    if (img.complete && img.naturalWidth > 0) {
      const w = TILE_SIZE * 0.75;
      const h = (w / img.naturalWidth) * img.naturalHeight;

      ctx.drawImage(img, centerX - w / 2, centerY - h / 2, w, h);
    } else {
      ctx.font = TILE_SIZE * 0.75 + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎒", centerX, centerY);
    }
  }

  ctx.restore();
}

// =========================
// PAGKAIN NG FOOD MULA SA HOTBAR SLOT (Alt + 1-9)
// =========================
//
// Pag-click lang (WALANG Alt) sa isang naka-slot na digit key (1-9) ay
// kaparehong-pareho pa rin ng dati - highlight/toggle lang (tingnan ang
// activateHotbarSlot). Ang Alt + kaparehong digit ay HIWALAY na aksyon -
// kung "food" (tingnan ang EDIBLE_ITEMS) ang laman ng slot na iyon,
// kinakain ito: -1 sa bilang, +health, may 3 segundong cooldown bago
// makakain ulit. (Wala pang animation dito - susunod na feature.)
//
// May mga digit din na dating naka-reserve na PARA sa Alt-shortcuts ng
// mga tool (Alt+1 pickaxe, Alt+3 axe, Alt+4 arrow, Alt+5 rake, Alt+6
// torch - tingnan ang dig.js/resources.js) - kapag may food NAMAN sa
// slot na kaparehong digit, ang PAGKAIN ang mananalo (hindi na
// mage-equip ang tool) - tingnan ang capture-phase na listener sa
// ibaba, na siyang UNANG tumatakbo (bago pa man umabot ang event sa mga
// bubble-phase na listener ng dig.js/resources.js) kapag food ang
// nakita.

const EAT_COOLDOWN_MS = 3000;

let lastEatAt = 0;

// Ang mga caller ng eatItem (eatFoodFromSlot sa ibaba, at ang dblclick
// listener ng buildBagSplitStackSlot) ay MAY SARILI NANG bespoke na
// pagbawas sa pinnedSlotCounts/bagSplitStacks pagkatapos nito - kaya
// dito, ang "consume" ay diretso na lang sa RAW/global na variable
// (hindi tumatawag ng consumeItemFromWherever - iyon ay para lang sa
// mga path na WALA pang ganitong bespoke handling, hal. plantCarrot sa
// dig.js).
const EDIBLE_ITEMS = {
  carrot: {
    label: "Carrot",
    description: "Sariwang gulay - nagpapawi ng gutom.",
    healAmount: 10,
    // BAGO (hiling ng user): "once na i use ko mag add ng +3 kada
    // isang carrots" - idinaragdag sa PLAYER_STATS.food (tingnan ang
    // eatItem sa ibaba).
    foodAmount: 3,
    consume: () => {
      carrotsCollected--;
    },
  },
  // AYOS (multi-crop, hiling ng user: "i add mo na rin yung mga ibang
  // vegetables") - parehong-pareho ang anyo ng carrot sa itaas, iba
  // lang ang halaga - kusang-loob kong pinili ang mga numerong ito
  // (proporsyonal sa presyo/laki nila), madaling baguhin.
  potato: {
    label: "Potato",
    description: "Matabang gulay mula sa lupa - nagpapawi ng gutom.",
    healAmount: 12,
    foodAmount: 4,
    consume: () => {
      potatoCollected--;
    },
  },
  cabbage: {
    label: "Cabbage",
    description: "Malutong na gulay - nagpapawi ng gutom.",
    healAmount: 14,
    foodAmount: 5,
    consume: () => {
      cabbageCollected--;
    },
  },
  eggplant: {
    label: "Eggplant",
    description: "Malaking gulay - nagpapawi ng gutom nang husto.",
    healAmount: 18,
    foodAmount: 7,
    consume: () => {
      eggplantCollected--;
    },
  },
  // AYOS (hiling ng user): "yung sa foods is may use din yung raw meat
  // lagyan mo rin ng plus 5 para sa foods" - dating hindi pa "kainin"
  // (hindi EDIBLE_ITEMS) ang HILAW/raw na "meat" (kaiba sa
  // "cookedmeat", na luto na sa Stove) - ngayon, puwede na rin itong
  // kainin nang diretso, mas mababa lang ang halaga kaysa luto na
  // (hiling: +5).
  meat: {
    label: "Raw Meat",
    description: "Hilaw na karne - puwede nang kainin, pero mas mainam lutuin muna sa Stove.",
    healAmount: 5,
    foodAmount: 5,
    consume: () => {
      meatCollected--;
    },
  },
};

// AYOS (hiling ng user): "ganto yung label description niya kapag na
// hover sa inventory o hotbar is name, description, health +100, food
// +3 tapos yung sell gold niya" - buong multi-line na text (gamit ang
// "\n", parehong convention ng ".title" attribute sa buong file na ito)
// na ipinapakita kada i-hover ang isang food item, saan man (bag master
// cell, bag split-stack, o naka-pin na hotbar slot) - null kung hindi
// naman ito EDIBLE_ITEMS. Ang "Sell" ay hinahanap mula sa OLDMAN_SHOP_ITEMS
// (decor.js, may sarili nang sellPrice - iisang pinagmumulan lang, hindi
// dinu-duplicate dito).
function getFoodTooltipText(itemId) {
  const edible = EDIBLE_ITEMS[itemId];

  if (!edible) return null;

  const lines = [edible.label || itemId];

  if (edible.description) lines.push(edible.description);
  if (edible.healAmount) lines.push("Health +" + edible.healAmount);
  if (edible.foodAmount) lines.push("Food +" + edible.foodAmount);

  // AYOS (multi-crop): kasama na ngayon ang MARIA_SHOP_ITEMS (builder.js)
  // bilang pangalawang pinagmumulan ng "Sell" na presyo - si Maria ang
  // nagbebenta/bumibili ng mga bagong gulay (potato/cabbage/eggplant),
  // hindi si Oldman.
  const shopEntry =
    (typeof OLDMAN_SHOP_ITEMS !== "undefined"
      ? OLDMAN_SHOP_ITEMS.find((entry) => entry.itemId === itemId)
      : null) ||
    (typeof MARIA_SHOP_ITEMS !== "undefined"
      ? MARIA_SHOP_ITEMS.find((entry) => entry.itemId === itemId)
      : null);

  if (shopEntry) lines.push("Sell: " + shopEntry.sellPrice + " gold");

  return lines.join("\n");
}

// May makakain bang food sa slot na ito ngayon (may item AT may stock)?
// Ginagamit ito para malaman kung dapat i-intercept ng pagkain ang
// Alt+digit na ito (kahit naka-cooldown pa - tingnan ang keydown
// listener sa ibaba).
function hasEdibleItemInSlot(slotIndex) {
  const itemId = pinnedSlots[slotIndex];

  if (!itemId || !EDIBLE_ITEMS[itemId]) return false;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  return Boolean(item && item.getCount() > 0);
}

// Ang tunay na "pagkain" - shared ito ng eatFoodFromSlot (Alt+digit sa
// isang naka-pin na hotbar slot) AT ng direktang double-click sa isang
// food item sa loob mismo ng BAG (tingnan ang buildBagItemSlot) - iisa
// lang na GLOBAL na cooldown (EAT_COOLDOWN_MS/lastEatAt) ang ginagamit
// nila pareho, kaya magkakabit ang cooldown nila (kumain man sa slot o
// sa bag mismo).
function eatItem(itemId) {
  const edible = EDIBLE_ITEMS[itemId];

  if (!edible) return false;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item || item.getCount() <= 0) return false;

  if (Date.now() - lastEatAt < EAT_COOLDOWN_MS) return false;

  lastEatAt = Date.now();
  edible.consume();

  PLAYER_STATS.health.current = Math.min(
    PLAYER_STATS.health.max,
    PLAYER_STATS.health.current + edible.healAmount,
  );

  // AYOS (hiling ng user): "once na i use ko mag add ng +3 kada isang
  // carrots" - idinaragdag din sa FOOD stat (naka-cap sa max, 100).
  if (edible.foodAmount) {
    PLAYER_STATS.food.current = Math.min(
      PLAYER_STATS.food.max,
      PLAYER_STATS.food.current + edible.foodAmount,
    );
  }

  // AYOS (hiling ng user): "yung sa foods kapag kumain may lilitaw na
  // label na may stroke... lilitaw yung +health nya" - floating text
  // (floating-text.js) sa itaas ng ulo ng player, kulay pink/red
  // (health-themed) - hindi "merge" (bagong label bawat kagat, hindi
  // tulad ng "+1+2+3" na pattern ng pagdampot ng item - tingnan ang
  // collectGroundItem, ground-items.js).
  if (edible.healAmount && typeof spawnFloatingText === "function") {
    const pos = getPlayerHeadPosition();

    spawnFloatingText(pos.x, pos.y, "+" + edible.healAmount, {
      color: "#ff6b81",
    });
  }

  syncEquipmentStats();
  syncHotbarUI();

  return true;
}

function eatFoodFromSlot(slotIndex) {
  if (!hasEdibleItemInSlot(slotIndex)) return false;

  const itemId = pinnedSlots[slotIndex];
  const ate = eatItem(itemId);

  // Kung EKSPLISITONG nahati ang slot na ito (tingnan ang "ALT +
  // LEFT-CLICK"), bawasan din ito rito mismo - hindi lang sa GLOBAL na
  // stock (ginagawa na ng eatItem) - para manatiling tama ang kabuuan.
  if (ate && pinnedSlotCounts[slotIndex] !== undefined) {
    pinnedSlotCounts[slotIndex]--;

    if (pinnedSlotCounts[slotIndex] <= 0) {
      delete pinnedSlots[slotIndex];
      delete pinnedSlotCounts[slotIndex];
    }
  }

  return ate;
}

// Tinatawag KADA FRAME mula sa update() (update.js) - kaparehong pattern
// ng updateTorchBurnVisual: direktang DOM style update lang ito (walang
// syncHotbarUI/full rebuild), para makinis ang pagbaba ng cooldown
// overlay nang hindi nagpapabagal. Ang overlay ay naka-anchor sa IBABA
// (bottom:0) - habang bumababa ang natitirang cooldown, bumababa rin ang
// height nito, kaya ang TAAS na dulo (itaas) ng lightgray ang unti-
// unting "bumababa" papuntang ibaba hanggang mawala.
function updateEatCooldownVisual() {
  const elapsed = Date.now() - lastEatAt;
  const remainingFraction = Math.max(0, 1 - elapsed / EAT_COOLDOWN_MS);

  for (const overlay of document.querySelectorAll(".hotbar-eat-cooldown")) {
    overlay.style.height = remainingFraction * 100 + "%";
  }
}

document.addEventListener(
  "keydown",
  (event) => {
    if (!event.altKey || event.key < "1" || event.key > "9") return;

    const slotIndex = Number(event.key);

    if (!hasEdibleItemInSlot(slotIndex)) return; // hayaan ang ibang Alt-shortcut (tool equip)

    event.preventDefault();
    // Pinipigilan nito ang mga sumusunod na keydown listener (dig.js/
    // resources.js na Alt+1/3/4/5/6 tool-equip shortcuts) mula sa
    // pagtakbo pa - ang pagkain ang mananalo kapag may food sa slot.
    event.stopImmediatePropagation();

    eatFoodFromSlot(slotIndex);
  },
  true, // capture phase - tumatakbo BAGO pa man ang bubble-phase listeners ng ibang file
);

// Alin sa mga item sa loob ng BAG (hindi ang hotbar row) ang naka-
// highlight ngayon - isang beses lang i-click ang isang item (WALANG
// drag) para dito, tinatanggal ang dating naka-highlight kapag ibang
// item ang na-click (isa lang kada sandali - tingnan ang "dragState.
// activated" na sanga ng pointerup listener sa ibaba). Hindi pa rin
// nito inilalagay ang item sa hotbar - hold-drag pa rin ang kailangan
// para doon (tingnan ang "HOLD-DRAG SPLIT STACK" sa itaas).
let selectedBagItemId = null;

// Naka-equip ba sa LEFT hand ngayon ang item na ito (torch lang - ang
// carrot/binhi ay hindi na "umaalis" sa bag/hotbar kahit naka-highlight
// ito para itanim - tingnan ang isCarrotSlotSelected sa dig.js)?
// Ginagamit ito para ITAGO muna ito sa BAG GRID habang naka-equip -
// "lumilipat" lang ito papuntang equip slot, babalik lang sa bag
// pagka-unequip nito (tingnan ang syncEquipmentPanel para sa aktwal na
// display sa equip slot).
// AYOS (hiling ng user): "tapos mawawala sa inventory" - dating "torch"
// LANG ang dumadaan dito (nawawala rin sa bag/hotbar kapag naka-equip)
// - HINDI pa kasama ang "bag" (bagEquipped) kahit na naka-suot na ito
// (nagpapakita na ng bag icon sa equip-slot-bag) - kaya
// "duplicate"/nananatiling nakikita pa rin ito sa loob ng inventory
// KAHIT naka-suot na, tila dalawang bag na (isa sa katawan/gauntlet
// slot, isa pa sa bag panel).
function isItemEquippedToHand(itemId) {
  return (
    (itemId === "torch" && torchEquipped) ||
    (itemId === "bag" && typeof bagEquipped !== "undefined" && bagEquipped)
  );
}

// I-click ang "sort" na icon sa footer ng bag (tingnan ang #bag-sort sa
// index.html) - PINAGSASAMA (hanggang MAX_EXPLICIT_STACK bawat isa) ang
// lahat ng magkakahiwalay na split-stack ng PAREHONG item type, TAPOS
// inaayos ang mga ito nang PAALPABETIKO (A-Z, ayon sa label) simula
// DIRETSO sa unang posisyon pagkatapos ng nakalaang "master" zone
// (BAG_ITEMS.length) - ang pinaka-"A" ang unang mapupunta.
//
// HINDI na hinihipo ang MASTER/unassigned pool ng bawat item type (dati
// itong ini-ibuhos din papunta sa mga bagong split-stack, pero DAHIL
// diyan, tuwing mag-so-sort, naiiwang "empty" ang buong master zone -
// kaya lumalabas na parang "nawawala"/hindi na-sort papuntang unahan
// ang mga item, dahil doon mismo ito unang ipinapakita, hindi sa
// split-stack zone). Ngayong LIBRE na ang lahat ng posisyon (tingnan
// ang "FIXED-POSITION NA BAG GRID" sa itaas), diretso na ring maaaring
// isulat ng Sort ang LAHAT (master/unassigned pool + dating hiwalay na
// split-stack) simula mismo sa POSITION 0 - ang unang slot ng unang
// hanay - hanggang mapuno ang bawat hanay, tapos susunod na hanay, atbp
// (walang round-up/patay na puwang).
function sortBagItems() {
  const totalsByItem = {};

  // Ibuhos din ang natitira sa MASTER/unassigned pool ng bawat item type -
  // kasama ito ngayon sa buong pagsa-sort simula sa position 0, hindi
  // lang ang mga split-stack.
  //
  // AYOS (hiling ng user: "nag sort ako lumalabas yung bag sa inventory
  // kahit naka used na") - kapag naka-suot ang bag (bagEquipped), HINDI
  // ito dapat kasama sa pagsa-sort - kung isasama, muli itong maisusulat
  // bilang split stack sa grid (bagSplitStacks, sa ibaba), kaya "lumalabas
  // ulit sa inventory" kahit naka-suot. LAKTAWAN ito dito - manatili ito
  // sa pool (buo pa rin ang bagCollected), nakatago sa grid habang naka-
  // suot, kaya walang lalabas dito pagka-Sort.
  for (const item of BAG_ITEMS) {
    if (item.id === "bag" && typeof bagEquipped !== "undefined" && bagEquipped)
      continue;

    const unassigned = getBagUnassignedCount(item.id);

    if (unassigned > 0) totalsByItem[item.id] = unassigned;
  }

  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (!stack) continue;

    // Parehong dahilan sa itaas - kung naka-suot ang bag, huwag isama
    // (at burahin na lang ang lumang split entry nito, kung meron man -
    // dahil dapat WALA itong slot habang naka-suot).
    if (
      stack.itemId === "bag" &&
      typeof bagEquipped !== "undefined" &&
      bagEquipped
    ) {
      delete bagSplitStacks[key];
      continue;
    }

    totalsByItem[stack.itemId] =
      (totalsByItem[stack.itemId] || 0) + stack.count;
    delete bagSplitStacks[key];
  }

  const itemIdsAZ = Object.keys(totalsByItem).sort((a, b) => {
    const itemA = BAG_ITEMS.find((entry) => entry.id === a);
    const itemB = BAG_ITEMS.find((entry) => entry.id === b);

    return (itemA ? itemA.label : a).localeCompare(itemB ? itemB.label : b);
  });

  let position = 0;

  for (const itemId of itemIdsAZ) {
    let remaining = totalsByItem[itemId];

    while (remaining > 0) {
      const amount = Math.min(remaining, MAX_EXPLICIT_STACK);

      bagSplitStacks[position] = { itemId, count: amount };
      remaining -= amount;
      position++;
    }
  }

  syncHotbarUI();
  syncBagPanel();
}

document.getElementById("bag-sort")?.addEventListener("click", () => {
  sortBagItems();
});

// =========================
// PAGLALAGAY/PAG-DRAG NG ITEM SA MGA SLOT (2-9) <-> BAG
// =========================
//
// I-DRAG (WALANG click-to-pin na shortcut) ang isang item mula sa bag
// papunta sa isang partikular na slot ng hotbar - kung may laman na ang
// target na slot, NAGPAPALITAN (swap) ang dalawa. Pag-drag din ng
// isang NAKALAGAY nang slot PABALIK sa bag panel - inaalis ito sa
// hotbar (bumabalik lang sa bag, hindi nawawala ang item mismo).
//
// Kapag na-click (hindi na-drag) ang isang NAKALAGAY nang slot, o kaya
// pinindot ang digit key nito: tingnan ang activateHotbarSlot - kung
// carrot ang laman, doon ito nag-eequip bilang binhi; kung iba, doon
// lang nag-toggle ang gold highlight.
//
// Session-lang ito (hindi naka-save) - katulad ng ibang UI state dito.
// Walang default na laman ang mga slot - kailangan munang i-drag mula
// sa bag bago may lumabas dito (kasama na ang carrot - wala nang
// hiwalay/naka-reserve na "seed slot").

let pinnedSlots = {}; // slotIndex (1-9) -> item id

// slotIndex -> bilang na TALAGANG nakalaan sa slot na ito (tingnan ang
// "HOLD-DRAG SPLIT STACK" sa ibaba). Kapag WALANG entry dito para sa
// isang naka-pin na slot, ibig sabihin "hindi pa nahahati" ito -
// ipinapakita pa rin nito ang TOTAL na stock (item.getCount()) minus
// kung anuman ang eksplisitong nakalaan na sa IBANG slot ng parehong
// item (tingnan ang getPinnedSlotEffectiveCount) - kapareho ito ng
// dating gawi bago magkaroon ng split-stack, kaya hindi ito nakakaapekto
// sa mga item na hindi kailanman hinati.
let pinnedSlotCounts = {};

// =========================
// FIXED-POSITION NA BAG GRID
// =========================
//
// Ang bawat item type ay may DEFAULT na posisyon kung saan lumalabas
// ang "MASTER" na cell nito (ang NATITIRA pagkatapos ibawas ang lahat
// ng eksplisitong nakalaan sa hotbar/split-stacks - tingnan ang
// getBagUnassignedCount) - PERO DYNAMIC na ito ngayon, "first come
// first serve" batay sa kung kailan UNANG nagkaroon ng stock ang item
// (hindi na nakatali sa BAG_ITEMS array order) - tingnan ang
// itemDefaultBagPosition/ensureDefaultBagPositions. LIBRE pa rin ang
// mga posisyong ito - kahit anong item ay puwedeng i-drop/idikit dito
// (tingnan ang resolveBagCellAt/moveFloatingToBagPosition) - kapag may
// ibang item na naka-explicit-place (split stack) sa eksaktong
// posisyon na iyon, IYON ang ipapakita sa halip na ang master, hanggang
// sa alisin ito.
//
// Ang LAHAT ng posisyon (kasama na ngayon ang dating "reserved" zone)
// ay TUNAY na FIXED - keyed DIRETSO sa sariling GRID POSITION nito
// (position -> { itemId, count }), hindi na compacting/auto-pack array -
// kaya PANATILIHIN ang laman kung saan man ito unang inilapag, kahit
// magbago pa ang dami ng ibang item type. Natatanggal (delete, HINDI
// muling i-reindex) kapag naubos.
let bagSplitStacks = {};

// Pinakamataas na bilang bawat SLOT ng bag/hotbar - kasama na rito ang
// "master" na cell ng isang item type (hotbar slot at bag split-stack,
// gaya ng dati). AYOS (hiling ng user): "max 99 item lang each slots,
// kapag lumagpas na mag appear sa katabing slot" - dating puwede pang
// lumagpas ang MASTER cell dito (hilaw na numero, walang tunay na cap),
// ngayon kada 99 na sobra ay awtomatikong "kumakalat" sa susunod na
// bakanteng slot bilang bagong "overflow" cell ng parehong item -
// tingnan ang computeMasterOverflowSlots/resolveBagCellAt sa ibaba.
const MAX_EXPLICIT_STACK = 99;

// Alin sa mga naka-fill na slot ang "napili" (gold highlight) - ISANG
// click lang, hindi kailangang gumalaw pa ang player. I-click ulit ang
// parehong slot para i-off ang highlight.
let selectedInventorySlot = null;

function findEmptyInventorySlotIndex() {
  return findAnyEmptySlot(null);
}

// Kagaya ng findEmptyInventorySlotIndex, pero puwedeng magdagdag ng
// isa pang slot na huwag pansinin (hal. ang targetIndex na kasalukuyang
// pupunuan, para hindi ito magkamaling ituring na "bakante" pa).
function findAnyEmptySlot(excludeIndex) {
  for (let i = 1; i <= 9; i++) {
    if (i === excludeIndex) continue;
    if (!pinnedSlots[i]) return i;
  }
  return null;
}

// =========================
// DUPLICATE/STACK NA PATAKARAN
// =========================
//
// Bawat item ay isang beses lang puwedeng i-pin (isang slot lang), MALIBAN:
//   - kung "stackable" ito (may getCount() na tumataas - carrot/wood/
//     stone/torch) AT lumagpas na sa 99 ang bilang nito - doon lang
//     puwede nang maglagay ng PANGALAWANG slot ng parehong item.
//   - o kung "equipment" ito (hal. sword/armor balang araw - tingnan
//     ang ALWAYS_DUPLICABLE_ITEMS) - laging puwedeng i-duplicate kahit
//     isa pa lang.

const STACK_DUPLICATE_MIN_COUNT = 99;

// Item type na LAGING puwedeng magkaroon ng maraming slot kahit isa pa
// lang - walang laman pa (wala pa tayong sword/armor bilang draggable
// na BAG_ITEMS), naka-laan lang para sa susunod na feature.
const ALWAYS_DUPLICABLE_ITEMS = new Set();

// Puwede bang maglagay ng ISA PANG slot ng itemId na ito, gayong
// nasa isa (o marami) na itong ibang slot?
function canDuplicateItemInSlot(itemId) {
  if (ALWAYS_DUPLICABLE_ITEMS.has(itemId)) return true;

  const alreadyPlaced = Object.values(pinnedSlots).includes(itemId);

  if (!alreadyPlaced) return true;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  return Boolean(item && item.getCount() > STACK_DUPLICATE_MIN_COUNT);
}

// =========================
// HOTKEY NA BUTON SA BAWAT BAG ITEM (hiling ng user: "sa inventory sa
// mga item add ka rin ng button sa label ng hotkey tapos may lalabas pa
// 1-9 na slots kung ano ang pipiliin na slots dun mapupunta yung item
// tapos kapag nandun na sa hotkey slots yung item click ulit tapos may
// lalabas na back to inventory")
// =========================
// Dati, ang TANGING paraan para mailagay sa isang PARTIKULAR na numbered
// slot ang isang item ay ang i-DRAG ito mula sa bag papunta doon (ang
// click/pinItemToSlot ay basta kung saan ang UNANG bakante - hindi mo
// mapipili). Mahirap ito sa maliit na screen/touch. Ngayon, may maliit
// na buton sa kanang-itaas ng bawat item sa bag: nakasulat dito ang
// KASALUKUYANG hotkey nito (hal. "3") o "+" kung wala pa - i-click at
// may lilitaw na maliit na menu ng 1-9 (at "Back to inventory" kung
// naka-pin na ito), doon mo diretsong pipiliin kung saang slot ito
// mapupunta.
//
// TANDAAN: ang DRAG ay gumagana pa rin nang eksaktong-eksakto gaya ng
// dati - hindi ito pinapalitan, dagdag na paraan lang ito.

// Ang UNANG numbered slot (1-9) na kinaroroonan ng item na ito, o `null`
// kung wala ito sa hotbar. (Puwedeng nasa MAHIGIT ISANG slot ang isang
// item - tingnan ang canDuplicateItemInSlot - ang una ang ipinapakita sa
// buton, at LAHAT sila ang tinatanggal ng "Back to inventory".)
function getItemPinnedSlotIndex(itemId) {
  for (let i = 1; i <= 9; i++) {
    if (pinnedSlots[i] === itemId) return i;
  }

  return null;
}

// Inilalagay ang item sa EKSAKTONG slot na pinili. Kung ang item ay nasa
// ibang slot na, INAALIS muna ito doon (paglipat ito, hindi pagdami).
// Kung MAY IBANG item na ang target na slot, ang dating laman niyon ang
// bumabalik sa inventory - hindi ito nawawala, nasa bag pa rin naman
// LAGI ang tunay na stock (ang `pinnedSlots` ay isang "shortcut" lang
// papunta sa item, hindi hiwalay na imbakan).
function assignItemToHotbarSlot(itemId, slotIndex) {
  if (slotIndex < 1 || slotIndex > 9) return;

  // 1) Alisin muna ang item sa LAHAT ng dati nitong slot - paglipat ito,
  //    hindi pagdami. Ang anumang EXPLICIT na bilang doon ay bumabalik
  //    sa bag pool (tingnan ang getBagUnassignedCount: ang mga slot na
  //    walang `pinnedSlotCounts` entry ay HINDI binabawas sa pool).
  for (let i = 1; i <= 9; i++) {
    if (pinnedSlots[i] === itemId) {
      delete pinnedSlots[i];
      delete pinnedSlotCounts[i];
    }
  }

  // 2) Bakantehin ang target - kung may IBANG item doon, bumabalik iyon
  //    sa inventory (parehong paraan: burahin ang explicit nitong
  //    bilang, kaya awtomatiko itong muling mabibilang sa bag pool).
  delete pinnedSlots[slotIndex];
  delete pinnedSlotCounts[slotIndex];

  // 3) AYOS (ikalawang round, hiling ng user): "yung image ng carrots di
  //    parin nalagay sa hotkey e kahit yung ibang item di napupunta
  //    don" - ang SANHI: ang bilang na inilalagay dito ay dating galing
  //    sa getBagUnassignedCount(), na BINABAWASAN ng LAHAT ng explicit
  //    na alokasyon - kasama na ang mga BAG SPLIT-STACK ng parehong
  //    item. Kaya kung ang stock mo ay nasa isang split-stack (bunga ng
  //    Alt-drag o ng "Slice"), 0 ang isinasagot niyon - at ang isang
  //    slot na 0 ang bilang ay AWTOMATIKONG binubura ng syncPinnedSlots
  //    ("naubos ang stock"), kaya para itong hindi man lang tinanggap
  //    ang item.
  //
  //    AYOS: nililinis muna ang LAHAT ng explicit na alokasyon ng item
  //    na ito (mga pin sa itaas AT ang mga split-stack sa bag), para
  //    TALAGANG buo na ang stock sa master pool - saka kinukuha ang
  //    BUONG bilang mismo ng item. Ito rin naman ang inaasahan: "mawawala
  //    yung item sa inventory at mapupunta sa slot na napili".
  for (const key in bagSplitStacks) {
    if (bagSplitStacks[key] && bagSplitStacks[key].itemId === itemId) {
      delete bagSplitStacks[key];
    }
  }

  let total = 0;

  try {
    const item = BAG_ITEMS.find((entry) => entry.id === itemId);

    total = item ? item.getCount() : 0;
  } catch (err) {
    total = 0;
  }

  // Sumusunod pa rin sa "max 99 kada slot" na patakaran - kung mas
  // marami pa sa 99 ang hawak mo, ang sobra ay NAIIWAN sa bag (hindi
  // nawawala), kaparehong-pareho ng gawi ng drag-and-drop.
  const moving = Math.min(Math.max(0, total), MAX_EXPLICIT_STACK);

  pinnedSlots[slotIndex] = itemId;

  if (moving > 0) pinnedSlotCounts[slotIndex] = moving;

  // 4) AYOS (hiling ng user): "gusto ko itanim gamit yung hotkey
  //    highlight tapos pindot sa na dig same sa logic dati" - AGAD na
  //    hina-highlight (gold) ang slot na pinili. Hindi ito kosmetiko
  //    lang: ang `selectedInventorySlot` mismo ANG nagpapasya kung
  //    "armado" na ang carrot para itanim (tingnan ang
  //    isCarrotSlotSelected sa dig.js - pinnedSlots[selectedInventorySlot]
  //    === "carrot"). Kung hindi ito itatakda dito, mapupunta nga ang
  //    carrot sa slot PERO mananatiling hindi armado - kaya walang
  //    mangyayari kapag pinindot mo ang hinukay na lupa, at mukhang
  //    "ayaw mapunta sa slot". Kaparehong-pareho na ito ngayon ng
  //    gawi ng double-click na landas (equipViaDoubleClick).
  //
  //    Ginagawa ito para sa LAHAT ng item, hindi lang sa carrot - iyon
  //    naman ang inaasahan kapag may pinili kang slot: iyon ang
  //    "aktibo" mong item ngayon.
  selectedInventorySlot = slotIndex;

  syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();
}

// "Back to inventory" - tinatanggal ang item sa LAHAT ng numbered slot.
function unpinItemFromHotbar(itemId) {
  for (let i = 1; i <= 9; i++) {
    if (pinnedSlots[i] === itemId) {
      delete pinnedSlots[i];
      delete pinnedSlotCounts[i];
    }
  }

  syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();
}

// Iisa lang ang bukás na menu kahit kailan.
let hotkeyPickerEl = null;

function closeHotkeyPicker() {
  if (!hotkeyPickerEl) return;

  hotkeyPickerEl.remove();
  hotkeyPickerEl = null;
  document.removeEventListener("pointerdown", handleHotkeyPickerOutside, true);
  document.removeEventListener("keydown", handleHotkeyPickerKeydown, true);
}

function handleHotkeyPickerOutside(event) {
  if (hotkeyPickerEl && !hotkeyPickerEl.contains(event.target)) {
    closeHotkeyPicker();
  }
}

function handleHotkeyPickerKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeHotkeyPicker();
  }
}

// Binubuksan ang menu sa tabi ng `anchorEl` (ang maliit na buton mismo).
function openHotkeyPicker(itemId, anchorEl) {
  closeHotkeyPicker();

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return;

  const currentSlot = getItemPinnedSlotIndex(itemId);

  const picker = document.createElement("div");

  picker.className = "hotkey-picker";

  const title = document.createElement("div");

  title.className = "hotkey-picker-title";
  title.textContent = "Send \"" + item.label + "\" to slot:";
  picker.appendChild(title);

  const grid = document.createElement("div");

  grid.className = "hotkey-picker-grid";

  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "hotkey-picker-slot";
    btn.textContent = String(i);

    const occupantId = pinnedSlots[i];

    if (occupantId === itemId) {
      // Dito na mismo ito nakalagay ngayon.
      btn.classList.add("hotkey-picker-slot-current");
      btn.title = "Nandito na ito ngayon";
    } else if (occupantId) {
      // May ibang item - ipinapakita kung ano, para alam mo kung ano
      // ang mapapalitan bago mo pa ito pindutin.
      const occupant = BAG_ITEMS.find((entry) => entry.id === occupantId);

      btn.classList.add("hotkey-picker-slot-taken");
      btn.title = occupant
        ? "Taken by " + occupant.label + " - it will go back to your inventory"
        : "Taken - it will go back to your inventory";
    } else {
      btn.title = "Empty slot";
    }

    btn.addEventListener("click", () => {
      assignItemToHotbarSlot(itemId, i);
      closeHotkeyPicker();
    });

    grid.appendChild(btn);
  }

  picker.appendChild(grid);

  // "Back to inventory" - lumilitaw LANG kung TALAGANG naka-pin na ito
  // (wala namang tatanggalin kung wala pa ito sa hotbar).
  if (currentSlot !== null) {
    const backBtn = document.createElement("button");

    backBtn.type = "button";
    backBtn.className = "hotkey-picker-back";
    backBtn.textContent = "Back to inventory";
    backBtn.addEventListener("click", () => {
      unpinItemFromHotbar(itemId);
      closeHotkeyPicker();
    });

    picker.appendChild(backBtn);
  }

  // Huwag hayaang makalusot ang pointerdown papunta sa bag item sa
  // likod nito (mag-uumpisa iyon ng drag).
  picker.addEventListener("pointerdown", (event) => event.stopPropagation());

  document.body.appendChild(picker);

  // Ipuwesto sa ilalim ng buton, pero PANATILIHIN sa loob ng screen -
  // ang mga item sa kanang gilid ng bag ay lalabas sana sa labas ng
  // viewport kung basta-basta lang isasalin ang left/top ng anchor.
  const anchorRect = anchorEl.getBoundingClientRect();
  const pickerRect = picker.getBoundingClientRect();
  const margin = 6;

  let left = anchorRect.left;
  let top = anchorRect.bottom + 4;

  if (left + pickerRect.width > window.innerWidth - margin) {
    left = window.innerWidth - pickerRect.width - margin;
  }

  if (left < margin) left = margin;

  if (top + pickerRect.height > window.innerHeight - margin) {
    top = anchorRect.top - pickerRect.height - 4;
  }

  if (top < margin) top = margin;

  picker.style.left = left + "px";
  picker.style.top = top + "px";

  hotkeyPickerEl = picker;

  // `capture` - para mauna ito sa mga pointerdown handler ng bag item.
  document.addEventListener("pointerdown", handleHotkeyPickerOutside, true);
  document.addEventListener("keydown", handleHotkeyPickerKeydown, true);
}

// Kapareho ng openHotkeyPicker, pero PUNTO (x, y) sa screen ang anchor
// sa halip na isang elemento - ginagamit ito ng "Hotkey" na buton sa
// item action popup (mobile-slice.js), kung saan ang popup mismo ay
// nawawala na bago pa mabuksan ito, kaya walang elementong maiaanchor.
function openHotkeyPickerAt(itemId, x, y) {
  openHotkeyPicker(itemId, {
    getBoundingClientRect: () => ({
      left: x,
      right: x,
      top: y,
      bottom: y,
      width: 0,
      height: 0,
    }),
  });
}

// Ang maliit na buton mismo, ipinapasok sa isang bag item cell.
function buildBagHotkeyButton(itemId) {
  const slotIndex = getItemPinnedSlotIndex(itemId);

  const btn = document.createElement("button");

  btn.type = "button";
  btn.className =
    "bag-item-hotkey-btn" + (slotIndex !== null ? " bag-item-hotkey-btn-set" : "");
  btn.textContent = slotIndex !== null ? String(slotIndex) : "+";
  btn.title =
    slotIndex !== null
      ? "Hotkey " + slotIndex + " - click to move it or send it back to your inventory"
      : "No hotkey yet - click to choose a slot (1-9)";

  // Huwag paandarin ang drag ng bag item sa likod nito.
  btn.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    event.preventDefault();
  });

  btn.addEventListener("dblclick", (event) => event.stopPropagation());

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    openHotkeyPicker(itemId, btn);
  });

  return btn;
}

function pinItemToSlot(itemId) {
  if (!canDuplicateItemInSlot(itemId)) {
    syncHotbarUI();
    return;
  }

  const slotIndex = findEmptyInventorySlotIndex();

  if (slotIndex === null) return; // puno na ang buong row

  pinnedSlots[slotIndex] = itemId;
  delete pinnedSlotCounts[slotIndex]; // bagong pin - hindi pa nahahati
  syncHotbarUI();
}

// --- ANG DRAG CONTROLLER MISMO ---
//
// Iisang pointerdown/pointermove/pointerup lang ang ginagamit kada
// draggable na bagay (bag item, filled na slot), kaya iisa lang na
// "dragState" ang kailangan. Kung maliit lang ang galaw (< DRAG_
// THRESHOLD_PX) - itinuturing itong CLICK, hindi drag.

const DRAG_THRESHOLD_PX = 6;

let dragState = null; // { source, itemId, fromSlotIndex, bagSplitIndex, fromBagPosition, startX, startY, activated }
let dragGhostEl = null;

// =========================
// HOLD-DRAG SPLIT STACK (hawak + i-drag = kunin LAHAT; right-click
// habang naka-hawak = "bawas" 1 kada pindot)
// =========================
//
// I-HOLD (pointerdown, hawak ang left mouse button) tapos I-DRAG (lumagpas
// sa DRAG_THRESHOLD_PX) ang isang item (bag, bag split-stack, o naka-pin
// na hotbar slot) na may stock - KUNIN AGAD ang BUONG available na
// bilang doon papunta sa isang "lumulutang" na ghost na sumusunod sa
// cursor (may bilang/label sa ilalim nito - tingnan ang
// updateFloatingGhostContent) - kagaya ng normal na drag, kailangang
// HAWAK ang mouse button buong oras.
//
// I-DROP (bitawan ang left button) sa isang BAKANTENG hotbar slot/bag
// cell, o sa isang cell na MAY LAMAN NA ng PAREHONG item (PAGSASAMA,
// hanggang MAX_EXPLICIT_STACK) - doon mapupunta ang BUONG hawak na
// bilang. Kung saan man hindi valid na target ang binitawan - ibinabalik
// ang lahat pabalik sa pinagmulan (walang nawawalang item).
//
// Habang NAKA-HAWAK pa rin ang left button (hindi pa binibitawan) -
// I-RIGHT-CLICK ang kahit anong hotbar slot o bag cell para "IBAWAS" ng
// 1 piraso doon (kunin mula sa hawak, hanggang maubos) - paulit-ulit na
// puwede, kagaya ng pagbuo ng "sub-stack" sa Minecraft.
let floatingPickup = null; // { itemId, count, source: {type:"bag"} | {type:"slot", slot} | {type:"bagSplit", index} }
let floatingGhostEl = null;

// Ang TALAGANG bilang na "puwedeng makuha" mula sa isang partikular na
// naka-pin na slot ngayon - kung wala pang eksplisitong pinaghating
// bilang dito (undefined sa pinnedSlotCounts), ang TOTAL na stock minus
// ang eksplisitong nakalaan na sa IBANG slot ng parehong item.
function getPinnedSlotEffectiveCount(slotIndex, itemId) {
  if (pinnedSlotCounts[slotIndex] !== undefined)
    return pinnedSlotCounts[slotIndex];

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return 0;

  let explicitElsewhere = 0;

  for (const key in pinnedSlots) {
    const otherIndex = Number(key);

    if (
      otherIndex !== slotIndex &&
      pinnedSlots[key] === itemId &&
      pinnedSlotCounts[key] !== undefined
    ) {
      explicitElsewhere += pinnedSlotCounts[key];
    }
  }

  // Ibawas din ang eksplisitong nakalaan sa BAG split-stacks - hindi
  // lang sa ibang hotbar slot (kung hindi, magda-duplicate ang bilang -
  // ipapakita pa rin ng UNSPLIT na slot ang TOTAL kahit may nailagay na
  // sa bag).
  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (stack && stack.itemId === itemId) explicitElsewhere += stack.count;
  }

  // Ibawas din kung may kasalukuyang lumulutang na parehong item (kahit
  // saan man ito galing) - HINDI na ito bahagi ng "natitira" habang
  // hawak, kaya hindi dapat ipakita ng UNSPLIT na slot na parang
  // available pa rin ito (kung hindi, magda-duplicate: makikita pareho
  // sa lumulutang AT dito).
  if (floatingPickup && floatingPickup.itemId === itemId) {
    explicitElsewhere += floatingPickup.count;
  }

  return item.getCount() - explicitElsewhere;
}

// Ang TALAGANG bilang na "puwedeng makuha" mula sa MASTER na cell ng
// bag (bukod sa eksplisitong nakalaan na sa mga naka-pin na hotbar
// slot AT sa mga split-stack sa loob mismo ng bag, at bukod sa kung
// anong bahagi ng kasalukuyang lumulutang ang galing mismo sa master).
// Ito rin ang IPINAPAKITANG bilang sa master cell mismo (tingnan ang
// buildBagItemSlot/resolveBagCellAt).
function getBagUnassignedCount(itemId) {
  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return 0;

  let explicitlyAllocated = 0;

  for (const key in pinnedSlots) {
    if (pinnedSlots[key] === itemId && pinnedSlotCounts[key] !== undefined) {
      explicitlyAllocated += pinnedSlotCounts[key];
    }
  }

  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (stack && stack.itemId === itemId) explicitlyAllocated += stack.count;
  }

  // Ibawas kung may kasalukuyang lumulutang na parehong item (kahit
  // saan man ito galing - hotbar slot, bag split-stack, o mismong
  // master) - hindi na ito bahagi ng "natitira" sa master pool habang
  // hawak (kung hindi, magda-duplicate ang bilang).
  const floating =
    floatingPickup && floatingPickup.itemId === itemId
      ? floatingPickup.count
      : 0;

  // Ang getCount() ng ibang item (hal. "crafter"/"charcoal"/"stove") ay
  // umaasa sa isang `let` variable na idineklara sa IBANG script file
  // (craft.js/stove.js) na maaaring HINDI PA nakaka-load (hal. dito
  // mismo sa PAUNANG syncHotbarUI() call sa dulo ng hotbar.js, bago pa
  // man umabot ang <script> ng ibang file) - ligtas na 0 na lang ang
  // gamitin sa halip na basagin ang buong render pass.
  let currentCount = 0;

  try {
    currentCount = item.getCount();
  } catch (err) {
    currentCount = 0;
  }

  return Math.max(0, currentCount - explicitlyAllocated - floating);
}

// Ang bilang na nasa isang partikular na bag split-stack (ang GRID
// POSITION mismo ang "index" dito - tingnan ang "FIXED-POSITION NA BAG
// GRID" sa itaas).
function getBagSplitStackCount(position) {
  return bagSplitStacks[position] ? bagSplitStacks[position].count : 0;
}

// Dynamic na "default" na posisyon ng bawat item type sa bag grid -
// HINDI na ito nakatali sa BAG_ITEMS array order (dating gawi - laging
// carrot=0, wood=1, atbp. anuman ang pagkakasunod-sunod ng pagkuha).
// Sa halip, "first come first serve": ang UNANG item type na magkaroon
// ng stock ang siyang unang makakakuha ng SUSUNOD na bakanteng posisyon
// (unang row muna, kaliwa-pakanan, tapos susunod na row - punan din ang
// mga puwang sa gitna, hindi lang basta idikit sa dulo) - tingnan ang
// ensureDefaultBagPositions. Minsan lang ito naitatalaga kada item type,
// PERMANENTE na ito (hindi na nag-iiba) hanggang sa mag-reload ang
// laro.
let itemDefaultBagPosition = {};

// Tinatawag sa simula ng syncHotbarUI (bago pa man mag-render) - sinisiguro
// na ang bawat item type na may STOCK na (unassigned > 0) pero wala pang
// default na posisyon ay bibigyan ng SUSUNOD na talagang bakanteng
// posisyon (walang split stack roon AT walang ibang item na dati nang
// naitalaga doon).
function ensureDefaultBagPositions() {
  // AYOS (hiling ng user: "gawin mo na lang from scratch muna yung sa
  // bag slot sa profile") - BINAGO MULA SA SIMULA ang buong paraan ng
  // pag-DISPLAY ng "bag" sa loob ng inventory grid: hindi na ito
  // dumadaan dito (walang PERMANENTENG itemDefaultBagPosition["bag"]
  // na naitatalaga) - tingnan ang getBagDynamicPositions() sa ibaba
  // (malapit sa computeMasterOverflowSlots) para sa bagong paraan,
  // kung saan LAGING kinukumputo NANG SARIWA (hindi naka-imbak) kung
  // saang slot dapat lumabas ang bag, batay sa KASALUKUYANG estado ng
  // grid - laging sa PINAKAUNANG totoong bakanteng slot ito lalabas,
  // hindi kailanman "natitirik" sa isang lumang posisyon. (VERIFIED sa
  // recording + script na test - ang DATING permanenteng-posisyon na
  // sistema, kahit may naunang ayos na, ay puwede pa ring "matirik" sa
  // isang lumang posisyon kapag na-block ito ng ibang item HABANG
  // naka-display pa ang bag doon, hindi lang sa oras ng equip/unequip.)
  //
  // Kaya dito, LINIS na lang muna ang anumang LUMANG naka-imbak na
  // "bag" key (mula sa mas lumang save data, bago pa itong ayos) -
  // kung hindi ito lilinisin, puwede pa ring MAGDOBLE ang bag (isang
  // lumang "hard" na posisyon MULA SA SAVE DATA, isa pang bago mula sa
  // dynamic na sistema).
  delete itemDefaultBagPosition["bag"];

  for (const item of BAG_ITEMS) {
    if (item.id === "bag") continue; // dynamic na ang bag, tingnan sa itaas

    // AYOS (BUG FIX, hiling ng user: "meron akong item sa 1,2,3,5 pero
    // dating nasa 4 slot si torch pero kapag nilagay ko dun sa left
    // hand ok pero pag balik sa inventory... hindi na nafifill up yung
    // slot 4 which is empty... napupunta lagi sa 7") - ITO ang UGAT ng
    // bug: dating kapag naubos ang UNASSIGNED na bilang ng isang item
    // (0, hal. buong stock ay na-equip/na-pin sa ibang lugar), basta
    // na lang "SKIP" ito dito - PERO HINDI TINATANGGAL ang LUMANG
    // itemDefaultBagPosition[item.id] nito, kaya naiiwan itong
    // "nakareserba"/naka-alaala. Kapag bumalik ang stock (hal. na-
    // unequip), ang ipinapakitang posisyon ay ang LUMANG reserbadong
    // iyon (maaaring MATAGAL nang itinalaga - hal. noong UNANG beses
    // kinolekta ang item, bago pa man ito i-drag/i-split ng manlalaro
    // papunta sa ibang slot), HINDI ang KASALUKUYANG unang bakanteng
    // slot - kaya "lumalabas" ang item sa MALI/LUMANG posisyon
    // (hal. slot 7) sa halip na sa TALAGANG unang bakanteng slot
    // ngayon (hal. slot 4, na siya namang huling ginamit/pinuwesto
    // ng manlalaro dati bago ito na-equip). AYOS: kapag 0 na ang
    // unassigned na bilang, TALAGANG TINATANGGAL na ngayon ang lumang
    // reserbasyon nito (delete) - kaya sa susunod na bumalik ang
    // stock, TALAGANG SARIWANG maghahanap ito ng BAGONG unang
    // bakanteng slot (mula sa itaas-kaliwa pababa, tingnan ang
    // paghahanap sa ibaba), hindi na "natitirik" sa isang lumang
    // posisyon na hindi na naman TALAGANG kasalukuyang pinakaunang
    // bakante.
    if (getBagUnassignedCount(item.id) <= 0) {
      delete itemDefaultBagPosition[item.id];
      continue;
    }

    const assignedPosition = itemDefaultBagPosition[item.id];

    // AYOS (bug: "natatabunan"/"nawawala" ang item pag bumalik ang stock
    // nito): dating kapag MAY assigned na posisyon na ang isang item type
    // (kahit noong 0 na ang unassigned count nito), basta na lang
    // SKIP ito dito kahit MAY BAGO na SPLIT STACK ng IBANG item type ang
    // "umagaw" na sa mismong posisyon na iyon habang wala pang stock ang
    // item na ito - resulta, kapag bumalik ang stock (hal. nakapulot ulit
    // ng wood matapos maubos), TALAGANG WALANG LUMALABAS na cell para
    // dito (resolveBagCellAt - "split" ang laman doon ngayon, hindi na
    // "master") - parang "nawala"/"natatabunan" ang item hanggang mag-Sort
    // (tingnan din ang relocateMasterIfBlocking sa itaas - PAREHONG
    // klase ng bug, pero doon "IBANG item ang natatabunan", dito naman
    // "SARILING dating posisyon ang na-aagawan"). Kaya dito, kung
    // MAY assigned na posisyon PERO NA-BLOCK na ito ngayon ng ibang split
    // stack, hindi na dapat i-skip - kailangan pang humanap ng BAGONG
    // TALAGANG-bakanteng posisyon sa halip.
    if (assignedPosition !== undefined && !bagSplitStacks[assignedPosition])
      continue;

    const takenPositions = new Set(Object.values(itemDefaultBagPosition));
    let position = 0;

    while (bagSplitStacks[position] || takenPositions.has(position)) position++;

    itemDefaultBagPosition[item.id] = position;
  }
}

// =========================
// BAG SA INVENTORY - DYNAMIC NA POSISYON (BAGO, mula sa scratch)
// =========================
//
// AYOS (hiling ng user: "gawin mo na lang from scratch muna yung sa
// bag slot sa profile...alisin mo muna...gawin mo na yung slot pang
// bag") - dating dumadaan ang "bag" sa PAREHONG sistema ng LAHAT ng
// ibang item (itemDefaultBagPosition, itaas) - isang beses lang
// naitatalaga ang posisyon nito, PERMANENTE na ito kahit pa mag-iba
// ang estado ng grid (equip/unequip) o ma-block/ma-unblock ang
// posisyong iyon ng ibang item - kaya paulit-ulit itong "natitirik" sa
// isang lumang posisyon (kahit bakante na ang mas unang slot) tuwing
// may humaharang dito kahit pansamantara lang. VERIFIED ito gamit ang
// script na test (buy -> use -> unuse, tapos block sa pinakaunang slot
// -> unuse ulit) - nananatili ang bug kahit may naunang ayos na sa
// unequipBag() lang, dahil puwede palang mangyari ang "pagkatirik"
// KAHIT HINDI pa naka-equip.
//
// AYOS: WALANG PERMANENTENG posisyon ang "bag" - HINDI na ito
// dumadaan sa itemDefaultBagPosition (tingnan ang "continue" para
// dito sa ensureDefaultBagPositions sa itaas). Sa halip, LAGING
// kinukumputo NANG SARIWA (hindi naka-imbak kahit saan) ang eksaktong
// posisyon nito sa BAWAT PAGTAWAG dito - laging ang PINAKAUNANG
// totoong bakanteng slot (walang splitstack roon AT walang ibang item
// na naka-permanenteng-posisyon doon), simula sa position 0. Kapag
// naka-equip (bagEquipped) o walang natitirang bag (getBagUnassignedCount
// <= 0), WALANG ibinabalik na posisyon (blangko ang resulta) - dahil
// wala namang dapat ipakita sa grid.
//
// Bawat isang MAX_EXPLICIT_STACK (99) na labis, kumakalat din ito sa
// SUSUNOD na bakanteng slot (kaparehong-pareho ng ginagawa ng
// computeMasterOverflowSlots sa ibaba para sa ibang item), kaya kahit
// daan-daang bag ang hawak, hindi ito "nagsasarado" sa isang cell.
//
// "isOverflow: true" LAGI para sa LAHAT ng bag cell dito (kahit yung
// "una") - sadya itong ginawang ganito: dahil WALANG PERMANENTENG
// posisyon ang bag, hindi na kailangang "protektahan"/i-relocate pa
// ito kapag hinarangan ng ibang item (tingnan ang "kung cell.isOverflow,
// WALANG dapat gawing relocation" sa relocateMasterIfBlocking sa
// ibaba) - kusa na lang itong "lilipat" papuntang susunod na bakanteng
// slot sa SUSUNOD na render, dahil sariwang kinukumputo ito palagi.
function getBagDynamicPositions() {
  if (typeof bagEquipped !== "undefined" && bagEquipped) return [];

  let remaining =
    typeof getBagUnassignedCount === "function"
      ? getBagUnassignedCount("bag")
      : 0;

  if (remaining <= 0) return [];

  const takenPositions = new Set(Object.values(itemDefaultBagPosition));
  const result = [];
  let position = 0;

  while (remaining > 0) {
    while (bagSplitStacks[position] || takenPositions.has(position)) {
      position++;
    }

    const amount = Math.min(remaining, MAX_EXPLICIT_STACK);

    result.push({ position, count: amount });
    takenPositions.add(position);
    remaining -= amount;
    position++;
  }

  return result;
}

// Mabilisang tingin: ano (kung meron man) ang laman ng bag sa
// isang partikular na POSISYON, ayon sa getBagDynamicPositions() sa
// itaas - ginagamit ito ng resolveBagCellAt (ibaba).
function resolveBagDynamicCellAt(position) {
  const positions = getBagDynamicPositions();
  const entry = positions.find((slot) => slot.position === position);

  if (!entry) return null;

  const bagItem = BAG_ITEMS.find((bagEntry) => bagEntry.id === "bag");

  if (!bagItem) return null;

  return {
    type: "master",
    item: bagItem,
    displayCount: entry.count,
    isOverflow: true,
  };
}

// AYOS (hiling ng user): "yung items mismo sa inventory, max 99 item
// lang each slots, kapag lumagpas na mag appear sa katabing slot" -
// dating ang "master" na cell ng isang item type (itemDefaultBagPosition)
// ay basta na lang IPINAPAKITA ang BUONG getBagUnassignedCount nito sa
// IISANG cell (walang cap - puwedeng lumabas na "150" o kung ano pa),
// kaya "sarado"/mukhang isang malaking bunton na lang ito sa isang
// slot. Ngayon, kada 99 (MAX_EXPLICIT_STACK) na LUMALAGPAS pa sa unang
// (master) cell, awtomatikong LUMALABAS ito sa SUSUNOD na TALAGANG
// bakanteng slot bilang "overflow" na cell (parehong itsura/gawi ng
// "master" - kinukuha rin mula sa MISMONG unassigned pool, hindi
// hiwalay na storage) - paulit-ulit hanggang maubos ang labis (kaya
// "kumakalat" sa mga katabing slot ang isang item kapag sobra-sobra na
// ang bilang nito). Ang FUNCTION na ito ang nagko-compute ng buong
// mapa (position -> {itemId, count}) ng lahat ng ganitong "overflow"
// na cell - TINATAWAG ITO NANG BUO (fresh) sa bawat resolveBagCellAt,
// dahil magaan lang naman ito (~15 item type, ilang beses na loop) at
// nag-iiba ang resulta kada pagbabago ng estado ng bag - walang
// kailangang i-cache/i-invalidate nang manu-mano.
function computeMasterOverflowSlots() {
  if (typeof ensureDefaultBagPositions === "function")
    ensureDefaultBagPositions();

  const overflow = {};
  const taken = new Set(Object.values(itemDefaultBagPosition));
  let nextFree = 0;

  const findNextFree = () => {
    while (bagSplitStacks[nextFree] || taken.has(nextFree)) nextFree++;
    return nextFree;
  };

  for (const item of BAG_ITEMS) {
    const basePosition = itemDefaultBagPosition[item.id];

    if (basePosition === undefined) continue; // wala pang stock kailanman
    if (bagSplitStacks[basePosition]) continue; // na-block na ang base cell nito, hiwalay nang isyu

    let remaining = getBagUnassignedCount(item.id) - MAX_EXPLICIT_STACK;

    while (remaining > 0) {
      const position = findNextFree();

      taken.add(position);

      const amount = Math.min(remaining, MAX_EXPLICIT_STACK);

      overflow[position] = { itemId: item.id, count: amount };
      remaining -= amount;
      nextFree = position + 1;
    }
  }

  return overflow;
}

// Alin ang laman ng isang partikular na POSISYON sa bag GRID (0-based) -
// "master" (default na posisyon ng isang item type, tingnan ang
// itemDefaultBagPosition sa itaas - LIBRE pa rin ito, kung may ibang
// item na naka-drop dito na (split stack), IYON ang unang susundin), o
// "empty". "split" (mula sa bagSplitStacks - PUWEDE mangyari KAHIT
// saan, kasama na ang mga default na posisyon). Ginagamit ito kapwa ng
// syncBagPanel (pag-render) AT ng move/peel logic sa ibaba (batay sa
// cursor position).
//
// Ang "master" na resulta ay may kasamang "displayCount" ngayon (ang
// bilang na TALAGANG dapat ipakita sa cell na ito - 99 pinakamataas
// bawat isa) AT "isOverflow" (true kung ito ay isa sa mga "kumalat" na
// overflow cell, hindi ang MISMONG itemDefaultBagPosition nito) - ang
// PAG-KUHA (pickup)/gawi ng interaksyon ay PAREHONG "master" (mula sa
// generic na unassigned pool, hindi tied sa isang partikular na
// posisyon) - tingnan ang resolveTargetSourceAt/buildBagItemSlot.
function resolveBagCellAt(position) {
  const stack = bagSplitStacks[position];

  if (stack) return { type: "split", index: position, stack };

  // BAGO (mula sa scratch) - tingnan ang getBagDynamicPositions/
  // resolveBagDynamicCellAt sa itaas: WALANG PERMANENTENG posisyon
  // ang "bag" - dito muna ito sinusuri (bago pa man ang generic
  // itemDefaultBagPosition/overflow na sistema sa ibaba, na PARA NA
  // LANG sa ibang item type simula ngayon).
  const bagDynamicCell = resolveBagDynamicCellAt(position);

  if (bagDynamicCell) return bagDynamicCell;

  const overflowEntry = computeMasterOverflowSlots()[position];

  if (overflowEntry) {
    const item = BAG_ITEMS.find((entry) => entry.id === overflowEntry.itemId);

    if (item) {
      return {
        type: "master",
        item,
        displayCount: overflowEntry.count,
        isOverflow: true,
      };
    }
  }

  const itemId = Object.keys(itemDefaultBagPosition).find(
    (id) => itemDefaultBagPosition[id] === position,
  );

  if (itemId) {
    const item = BAG_ITEMS.find((entry) => entry.id === itemId);

    if (
      item &&
      getBagUnassignedCount(item.id) > 0 &&
      !isItemEquippedToHand(item.id)
    ) {
      return {
        type: "master",
        item,
        displayCount: Math.min(
          getBagUnassignedCount(item.id),
          MAX_EXPLICIT_STACK,
        ),
        isOverflow: false,
      };
    }
  }

  return { type: "empty" };
}

// AYOS (bug: "natatabunan" na item - kailangan pang i-Sort para makita):
// dating kapag nag-drop ka ng item B papunta sa isang posisyon na
// kasalukuyang nagpapakita ng "master" cell ng ITEM A (hindi pa split
// stack doon, kaya mukhang "bakante"), basta na lang NATATABUNAN si
// item A - wala itong ibang posisyon, kaya NAWAWALA/NATATAGO ito hanggang
// mag-Sort. Tinatawag ito BAGO magsulat ng bagong split stack sa isang
// posisyon - kung ang posisyon na iyon ay master cell ng IBANG item
// (may natitira pang unassigned na bilang), inililipat muna ang default
// na posisyon niyon sa TALAGANG bakanteng lugar, para hindi ito
// mawala/matabunan.
//
// AYOS (hiling ng user, bagong "overflow" na cell): kung ang na-block
// na cell ay isang OVERFLOW na cell lang (isOverflow: true, hindi ang
// MISMONG itemDefaultBagPosition ng item na iyon), WALANG dapat
// gawing "relocation" dito - ang overflow ay purong KOMPYUTADO/live
// lang sa bawat render (computeMasterOverflowSlots), kaya kusa na lang
// itong "lilipat" sa ibang libreng posisyon sa SUSUNOD na render kapag
// na-block na ito ng bagong split stack - hindi kailangang galawin ang
// itemDefaultBagPosition (na hindi naman TALAGANG nasa posisyong ito).
function relocateMasterIfBlocking(position, incomingItemId) {
  const cell = resolveBagCellAt(position);

  if (cell.type !== "master") return;
  if (cell.isOverflow) return;
  if (cell.item.id === incomingItemId) return; // parehong item lang - okay lang dito

  const takenPositions = new Set(Object.values(itemDefaultBagPosition));
  let newPosition = 0;

  while (bagSplitStacks[newPosition] || takenPositions.has(newPosition)) {
    newPosition++;
  }

  itemDefaultBagPosition[cell.item.id] = newPosition;
}

// "Boolean" na tool (pickaxe/rake/axe/sword) - walang tunay na bilang
// (0 o 1 lang, tingnan ang getCount() sa BAG_ITEMS), kaya sa halip na
// dagdagan/bawasan ng "delta", ang NEGATIVE delta (dropItemFromSlotIntoWorld
// - itinapon sa mundo) ang siyang nag-aalis ng "unlocked" flag - kung
// hindi, mananatiling "unlocked" pa rin ito (kaya makikita pa rin sa
// bag) KAHIT nakalapag na rin ito sa lupa bilang ground item -
// duplicate.
function adjustGlobalItemCount(itemId, delta) {
  if (itemId === "wood") woodCollected += delta;
  else if (itemId === "stone") stoneCollected += delta;
  else if (itemId === "meat") meatCollected += delta;
  else if (itemId === "carrot") carrotsCollected += delta;
  // AYOS (multi-crop, hiling ng user: "i add mo na rin yung mga ibang
  // vegetables... buy/sell...pag drop at pag pick up") - PAREHONG-
  // PAREHONG dahilan ng "carrot" sa itaas.
  else if (itemId === "potato") potatoCollected += delta;
  else if (itemId === "cabbage") cabbageCollected += delta;
  else if (itemId === "eggplant") eggplantCollected += delta;
  else if (itemId === "gold") goldCollected += delta;
  else if (itemId === "torch") torchesCollected += delta;
  else if (itemId === "crafter") craftersCollected += delta;
  else if (itemId === "light") lightsCollected += delta;
  else if (itemId === "charcoal") charcoalCollected += delta;
  else if (itemId === "cookedmeat") cookedmeat += delta;
  else if (itemId === "stove") stovesCollected += delta;
  else if (itemId === "bag") bagCollected += delta;
  else if (itemId === "bed") bedsCollected += delta;
  // BAGO (hiling ng user: "add ka pala bed sa crafter tyaka
  // refrigerator") - bagong crafting material/item, ginagamit ito ng
  // pagbili/pagbenta kay Oldman (wool/silk) at ng crafting/pag-drop
  // (refrigerator/iron).
  else if (itemId === "wool") woolCollected += delta;
  else if (itemId === "silk") silkCollected += delta;
  else if (itemId === "iron") ironCollected += delta;
  else if (itemId === "refrigerator") refrigeratorCollected += delta;
  else if (itemId === "pickaxe" && delta < 0) pickaxeInInventory = false;
  else if (itemId === "rake" && delta < 0) rakeInInventory = false;
  else if (itemId === "axe" && delta < 0) axeInInventory = false;
  else if (itemId === "cutter" && delta < 0) {
    if (typeof cutterInInventory !== "undefined") cutterInInventory = false;
  }
  else if (itemId === "sword" && delta < 0) swordUnlocked = false;
}

// Kapag may BAGONG nadampot na dami ng isang item (hal. mula sa lupa -
// tingnan ang collectGroundItem sa ground-items.js), dapat itong
// idagdag sa KUNG SAAN MAN kasalukuyang EXPLICIT na "nakatira" ang item
// na iyon - isang hotbar slot (priority, tingnan ang pinnedSlotCounts)
// o isang bag split-stack - HINDI basta sa master/unassigned pool
// (kahit ito ang default na tinutumbok ng adjustGlobalItemCount) -
// para hindi ito "duplicate" (dalawang magkahiwalay na cell ng
// parehong item) kundi tumataas na lang ang bilang kung saan na ito
// talaga nakalagay. Naka-cap pa rin sa MAX_EXPLICIT_STACK (99) ang
// bawat explicit na cell - ang labis (kung meron) ay awtomatiko na
// lang lalabas sa master pool (dahil doon na rin idinagdag ng
// adjustGlobalItemCount ang BUONG "count", hindi lang ang inilipat
// dito). Walang epekto (wala pang EXPLICIT na lokasyon, manatili na
// lang sa master/unassigned pool) kung hindi pa kailanman nailipat ang
// item na ito sa alinmang partikular na slot.
function routeCollectedItemIncrease(itemId, count) {
  if (!itemId || count <= 0) return;

  for (const key in pinnedSlots) {
    if (pinnedSlots[key] !== itemId || pinnedSlotCounts[key] === undefined)
      continue;

    const slotIndex = Number(key);
    const room = Math.max(0, MAX_EXPLICIT_STACK - pinnedSlotCounts[slotIndex]);

    pinnedSlotCounts[slotIndex] += Math.min(room, count);

    return;
  }

  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (!stack || stack.itemId !== itemId) continue;

    const room = Math.max(0, MAX_EXPLICIT_STACK - stack.count);

    stack.count += Math.min(room, count);

    return;
  }
}

// Kabaligtaran ng routeCollectedItemIncrease sa itaas - kapag NAUBOS
// (ginamit/kinain/itinanim/na-craft) ang isang piraso ng item, dapat
// dito rin ito ibawas kung saan man ito EXPLICIT na "nakatira" (hotbar
// slot o bag split-stack), HINDI lang sa global/raw na variable
// (hal. carrotsCollected--). Kung hindi, mananatiling FROZEN ang
// bilang na ipinapakita sa hotbar slot (kahit bumaba na ang totoong
// stock sa ibang lugar) - kaya parang "hindi nababawasan" ang item
// kahit magamit mo na ito. Tingnan ang paggamit nito sa plantCarrot
// (dig.js) at EDIBLE_ITEMS.carrot.consume sa itaas.
function consumeItemFromWherever(itemId, count) {
  if (!itemId || count <= 0) return;

  for (const key in pinnedSlots) {
    if (pinnedSlots[key] !== itemId || pinnedSlotCounts[key] === undefined)
      continue;

    const slotIndex = Number(key);

    pinnedSlotCounts[slotIndex] = Math.max(
      0,
      pinnedSlotCounts[slotIndex] - count,
    );

    if (pinnedSlotCounts[slotIndex] <= 0) {
      delete pinnedSlots[slotIndex];
      delete pinnedSlotCounts[slotIndex];
    }

    return;
  }

  for (const key in bagSplitStacks) {
    const stack = bagSplitStacks[key];

    if (!stack || stack.itemId !== itemId) continue;

    stack.count -= count;

    if (stack.count <= 0) delete bagSplitStacks[key];

    return;
  }
}

function updateFloatingGhostContent() {
  if (!floatingGhostEl || !floatingPickup) return;

  const item = BAG_ITEMS.find((entry) => entry.id === floatingPickup.itemId);

  floatingGhostEl.innerHTML = item ? getItemIconHTML(item) : "";

  const badge = document.createElement("span");

  badge.className = "hotbar-badge";
  badge.textContent = floatingPickup.count > 99 ? "99+" : floatingPickup.count;
  floatingGhostEl.appendChild(badge);
}

// AYOS (BUG FIX, hiling ng user: "sa mobile version... pag drag ng
// item sa slots is di maganda... napupunta naman pangit lang tignan")
// - kinukuha ang TALAGANG kasalukuyang visual "scale" ng #hotbar
// (galing sa CSS transform: scale(...), tingnan ang body.touch-
// controls-active #hotbar sa style.css - 1 (walang scale) sa
// desktop, 0.82/0.7 sa mobile) - ginagamit ito sa halip na basta
// hard-code ang numero dito, para awtomatikong tama kahit magbago pa
// ang eksaktong CSS scale balang araw.
function getHotbarVisualScale() {
  const hotbarEl = document.getElementById("hotbar");

  if (!hotbarEl) return 1;

  const transform = getComputedStyle(hotbarEl).transform;

  if (!transform || transform === "none") return 1;

  // "matrix(a, b, c, d, tx, ty)" - ang "a" (unang numero) ay ang
  // horizontal scale factor kapag walang rotation (tama para dito,
  // scale lang naman - walang rotation - ang ginagamit ng #hotbar).
  const match = /matrix\(([^,]+),/.exec(transform);
  const scale = match ? parseFloat(match[1]) : NaN;

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

// Itinatakda ang laki ng #floating-pickup-ghost (custom property
// --floating-ghost-scale, tingnan ang style.css) para TUMUGMA sa
// laki ng KASALUKUYANG pinagmulan nito - kapag mula sa isang hotbar
// slot (source.type === "slot") AT naka-scale-down ang #hotbar
// (mobile/touch), itutugma ang ghost sa PAREHONG scale (hindi na
// "biglaang lumalaki" ang icon habang naka-drag). Ibang uri ng
// pinagmulan (bag/bagSplit) - hindi naman naka-scale ang #bag-panel
// sa mobile, kaya 1 (default) na lang, walang epekto.
function applyFloatingGhostScale(source) {
  if (!floatingGhostEl) return;

  const scale = source && source.type === "slot" ? getHotbarVisualScale() : 1;

  floatingGhostEl.style.setProperty("--floating-ghost-scale", String(scale));
}

// AYOS (hiling ng user): sa TOUCH (daliri), natatakpan ng mismong
// daliri ang icon kapag EKSAKTONG nasa ilalim ng tapat na tapat ng
// touch point ito (kaya "di maganda tignan"/hindi makita nang maayos
// kung saan talaga dinadala ang item) - itinataas nang kaunti ang
// ghost sa itaas ng TALAGANG touch point kapag touch-controls-active,
// para makita ito nang malinaw. Walang epekto sa desktop/mouse
// (0 offset doon - eksakto pa rin sa ilalim ng cursor, dating gawi).
const MOBILE_FLOATING_GHOST_Y_OFFSET = 46;

function getFloatingGhostYOffset() {
  return document.body.classList.contains("touch-controls-active")
    ? MOBILE_FLOATING_GHOST_Y_OFFSET
    : 0;
}

function moveFloatingGhost(x, y) {
  if (!floatingGhostEl) return;

  floatingGhostEl.style.left = x + "px";
  floatingGhostEl.style.top = y - getFloatingGhostYOffset() + "px";
}

function clearFloatingPickupState() {
  floatingPickup = null;

  if (floatingGhostEl) {
    floatingGhostEl.remove();
    floatingGhostEl = null;
  }

  // BAGO (kasama ng "Transfer" na buton - tingnan ang mobile-slice.js):
  // kapag wala nang hawak, awtomatikong isinasara ang transfer mode
  // (nawawala ang highlight ng mga slot at ang Cancel na bar) - dito
  // ito inilagay dahil ITO ang IISANG daanan ng LAHAT ng paraan ng
  // pagkaubos ng hawak (tap sa hotbar/bag/craft/stove).
  if (typeof syncTransferModeUI === "function") syncTransferModeUI();
}

// Kinukuha ang BUONG available na bilang mula sa "source" papunta sa
// isang bagong floatingPickup - tinatawag sa pointermove sa sandaling
// lumagpas sa DRAG_THRESHOLD_PX (tingnan sa ibaba). Ibinabalik ang
// false (at hindi gagawa ng float) kung wala palang stock doon.
function grabWholeStackIntoFloat(source, itemId) {
  const available =
    source.type === "bag"
      ? getBagUnassignedCount(itemId)
      : source.type === "bagSplit"
        ? getBagSplitStackCount(source.index)
        : getPinnedSlotEffectiveCount(source.slot, itemId);

  if (available <= 0) return false;

  if (source.type === "slot") {
    delete pinnedSlots[source.slot];
    delete pinnedSlotCounts[source.slot];
  } else if (source.type === "bagSplit") {
    delete bagSplitStacks[source.index];
  }

  floatingPickup = { itemId, count: available, source };

  floatingGhostEl = document.createElement("div");
  floatingGhostEl.id = "floating-pickup-ghost";
  document.body.appendChild(floatingGhostEl);
  applyFloatingGhostScale(source);
  updateFloatingGhostContent();

  syncHotbarUI();
  syncBagPanel();

  return true;
}

// Inililipat ang HANGGANG "amount" mula sa lumulutang papunta sa isang
// hotbar slot - kung EMPTY ito, likhain; kung MAY LAMAN na (parehong
// item), i-MERGE (hanggang MAX_EXPLICIT_STACK); kung MAY LAMAN na
// (IBANG item), mag-SWAP (tingnan ang trySwapFloatingWithOccupiedSlot) -
// bumabalik ang IBANG item papunta sa ORIHINAL na pinagmulan ng hawak.
// Ibinabalik ang TALAGANG nailipat (posibleng mas mababa sa "amount", o
// 0 kung puno na).
function moveFloatingToSlot(slotIndex, amount) {
  if (!floatingPickup || amount <= 0) return 0;

  const itemId = floatingPickup.itemId;
  const existing = pinnedSlots[slotIndex];

  if (existing && existing !== itemId) {
    return trySwapFloatingWithOccupiedSlot(
      () => pinnedSlots[slotIndex],
      () => pinnedSlotCounts[slotIndex] || 0,
      (id, count) => {
        pinnedSlots[slotIndex] = id;
        pinnedSlotCounts[slotIndex] = count;
      },
    );
  }

  const current = existing ? getPinnedSlotEffectiveCount(slotIndex, itemId) : 0;
  const room = Math.max(0, MAX_EXPLICIT_STACK - current);
  const moving = Math.min(room, amount, floatingPickup.count);

  if (moving <= 0) return 0;

  pinnedSlots[slotIndex] = itemId;
  pinnedSlotCounts[slotIndex] = current + moving;
  floatingPickup.count -= moving;

  if (floatingPickup.count <= 0) clearFloatingPickupState();
  else updateFloatingGhostContent();

  return moving;
}

// Ginagamit ni moveFloatingToSlot/moveFloatingToBagSplitIndex kapag IBANG
// item ang laman na ng target - sa halip na i-reject (dating gawi),
// PALITAN/SWAP: (1) alisin muna ang laman ng target, (2) ilagay doon ang
// BUONG hawak (floatingPickup), (3) ibalik ang inalis na item papunta sa
// ORIHINAL na pinagmulan ng hawak (floatingPickup.source - tingnan ang
// placeDisplacedItemAtSource). "getTargetItemId/getTargetCount" ang
// bumabasa ng KASALUKUYANG laman ng target, "setTargetContent" ang
// nag-oobersayt nito - hiwalay na callback para magamit ito kapwa ng
// hotbar slot (pinnedSlots/pinnedSlotCounts) at bag split-stack
// (bagSplitStacks).
function trySwapFloatingWithOccupiedSlot(
  getTargetItemId,
  getTargetCount,
  setTargetContent,
) {
  if (!floatingPickup) return 0;

  const displacedItemId = getTargetItemId();
  const displacedCount = getTargetCount();
  const movedItemId = floatingPickup.itemId;
  const movedCount = floatingPickup.count;

  setTargetContent(movedItemId, movedCount);
  placeDisplacedItemAtSource(
    floatingPickup.source,
    displacedItemId,
    displacedCount,
  );
  clearFloatingPickupState();

  return movedCount;
}

// Inilalagay ang "itemId"/"count" pabalik sa EKSAKTONG posisyon kung
// saan UNANG nanggaling ang isang lumulutang na item (floatingPickup.
// source) - ginagamit sa pag-SWAP (tingnan sa itaas) para ibalik ang
// naalis na item sa target patungo sa dating puwesto ng papasok na
// item. Walang kailangang gawin kapag "bag" (master) ang source - dahil
// "derived" lang ito (getBagUnassignedCount), awtomatiko na itong
// muling lalabas sa master pool sa sandaling maalis ang laman nito sa
// target.
function placeDisplacedItemAtSource(source, itemId, count) {
  if (!itemId || count <= 0) return;

  if (source.type === "slot") {
    pinnedSlots[source.slot] = itemId;
    pinnedSlotCounts[source.slot] = count;
  } else if (source.type === "bagSplit") {
    bagSplitStacks[source.index] = { itemId, count };
  }
}

// Kaparehong-pareho ng gawi ng moveFloatingToSlot (i-MERGE hanggang
// MAX_EXPLICIT_STACK, i-reject kung ibang item ang laman na) PERO para
// sa LUMANG dragGhostEl na paraan (craft-input/craft-output - walang
// floatingPickup dito, kaya diretso na lang ang "amount" ang inililipat,
// hindi galing sa isang lumulutang na estado). Ginagamit kapag ni-drop
// ang isang crafted item/ingredient DERETSO sa isang partikular na
// hotbar slot (1-9), para talagang MAILAGAY ito roon (hindi lang basta
// maidagdag sa bag stock) - tingnan ang paggamit nito sa "pointerup"
// listener sa ibaba.
function pinCraftItemToSlot(slotIndex, itemId, amount) {
  if (!itemId || amount <= 0) return 0;

  const existing = pinnedSlots[slotIndex];

  if (existing && existing !== itemId) return 0;

  // Iwasan ang bagong DUPLICATE na slot (parehong panuntunan ng
  // pinItemToSlot/canDuplicateItemInSlot - isang beses lang dapat
  // ma-pin ang isang item MALIBAN kung lumagpas na sa 99 ang bilang) -
  // kung wala pang laman ang target na ito PERO nasa ibang slot na ang
  // parehong item, huwag nang gumawa ng bagong slot dito, sa halip ay
  // manatili na lang ito sa bag stock (nadagdagan na ito ng
  // collectCraftOutput/consumeOneOfCraftItem BAGO tawagin ito).
  if (
    !existing &&
    typeof canDuplicateItemInSlot === "function" &&
    !canDuplicateItemInSlot(itemId)
  ) {
    return 0;
  }

  const current = existing ? getPinnedSlotEffectiveCount(slotIndex, itemId) : 0;
  const room = Math.max(0, MAX_EXPLICIT_STACK - current);
  const moving = Math.min(room, amount);

  if (moving <= 0) return 0;

  pinnedSlots[slotIndex] = itemId;
  pinnedSlotCounts[slotIndex] = current + moving;

  return moving;
}

// Kapareho ng moveFloatingToSlot, pero sa isang partikular na bag
// split-stack (index) - ginagawa ito kung wala pa (reuse ng "hole"),
// nag-SWAP kung ibang item ang laman na (tingnan ang
// trySwapFloatingWithOccupiedSlot).
function moveFloatingToBagSplitIndex(index, amount) {
  if (!floatingPickup || amount <= 0) return 0;

  const itemId = floatingPickup.itemId;

  // AYOS: bago isulat/idagdag ang bagong split stack dito, siguraduhin
  // munang hindi ito "master" cell pa ng IBANG item (tingnan ang
  // relocateMasterIfBlocking sa itaas) - kung hindi, matatabunan/
  // mawawala ang ibang item na iyon.
  relocateMasterIfBlocking(index, itemId);

  const stack = bagSplitStacks[index];

  if (stack && stack.itemId !== itemId) {
    return trySwapFloatingWithOccupiedSlot(
      () => (bagSplitStacks[index] ? bagSplitStacks[index].itemId : null),
      () => (bagSplitStacks[index] ? bagSplitStacks[index].count : 0),
      (id, count) => {
        bagSplitStacks[index] = { itemId: id, count };
      },
    );
  }

  const current = stack ? stack.count : 0;
  const room = Math.max(0, MAX_EXPLICIT_STACK - current);
  const moving = Math.min(room, amount, floatingPickup.count);

  if (moving <= 0) return 0;

  bagSplitStacks[index] = { itemId, count: current + moving };
  floatingPickup.count -= moving;

  if (floatingPickup.count <= 0) clearFloatingPickupState();
  else updateFloatingGhostContent();

  return moving;
}

// I-DEPOSIT ang "amount" pabalik sa MASTER na cell ng bag - dahil
// "derived" lang (total minus eksplisitong nakalaan) ang ipinapakita ng
// master, sapat nang BAWASAN ang lumulutang - awtomatiko nang tataas
// ang bilang na ipinapakita sa master. Walang cap dito.
function moveFloatingToBagMaster(amount) {
  if (!floatingPickup || amount <= 0) return 0;

  const moving = Math.min(amount, floatingPickup.count);

  if (moving <= 0) return 0;

  floatingPickup.count -= moving;

  if (floatingPickup.count <= 0) clearFloatingPickupState();
  else updateFloatingGhostContent();

  return moving;
}

// Dispatcher batay sa GRID POSITION (0-based, mula sa cursor/dataset.
// bagPosition) - LIBRE na ang LAHAT ng posisyon (kasama na ang mga
// dating "reserved" na master zone, 0..BAG_ITEMS.length-1), kahit anong
// item ang puwedeng ilagay - diretso na lang dito ginagamit ang MISMONG
// position bilang address ng bagong/existing split stack (tingnan ang
// moveFloatingToBagSplitIndex/resolveBagCellAt).
function moveFloatingToBagPosition(position, amount) {
  return moveFloatingToBagSplitIndex(position, amount);
}

// Ibinabalik ang LAHAT ng natitirang lumulutang pabalik sa MISMONG
// pinagmulan nito (Escape, na-blur ang window, walang valid na drop
// target, o may natira pagkatapos kumuha ng 1 sa crafting) - walang
// nawawalang item. Kung sakaling puno na pala ang orihinal na puwesto
// (bihirang mangyari), idineposit na lang ang labis sa bag master pool
// bilang huling paraan.
function settleFloatBackToSource() {
  if (!floatingPickup) return;

  const { source, count } = floatingPickup;

  if (source.type === "slot") moveFloatingToSlot(source.slot, count);
  else if (source.type === "bagSplit")
    moveFloatingToBagSplitIndex(source.index, count);
  else moveFloatingToBagMaster(count);

  if (floatingPickup) moveFloatingToBagMaster(floatingPickup.count);

  // Kahit sa landas na ito (Cancel/Escape/blur/walang valid na target) -
  // isara rin ang transfer mode, kung sakaling hindi pa ito nadaanan ng
  // clearFloatingPickupState sa itaas.
  if (typeof syncTransferModeUI === "function") syncTransferModeUI();

  syncHotbarUI();
  syncBagPanel();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && floatingPickup) {
    settleFloatBackToSource();
    dragState = null;
  }
});

window.addEventListener("blur", () => {
  if (floatingPickup) settleFloatBackToSource();
  dragState = null;
});

// Sinusundan ang mouse ang lumulutang na ghost KAHIT WALANG HAWAK na
// mouse button - kailangan ito para sa STANDALONE na "cut 1" (tingnan
// ang paliwanag sa "HOLD-DRAG SPLIT STACK" sa itaas) - ang pointermove
// (dragState-based) handler sa itaas ang bahalang mag-move ng ghost
// HABANG naka-hold, pero pagkatapos i-right-click "cut" (walang hawak
// na left button), ito na lang ang tanging paraan para sumunod ito.
document.addEventListener("mousemove", (event) => {
  if (!floatingGhostEl) return;
  if (dragState && dragState.activated) return; // dinadala na ito ng pointermove sa itaas

  moveFloatingGhost(event.clientX, event.clientY);
});

// Alin ang laman (source + itemId) ng isang hotbar slot/bag cell na
// nasa ilalim ng cursor - ginagamit ng "standalone cut" at "peel habang
// naka-hold" na right-click logic sa ibaba.
function resolveTargetSourceAt(x, y) {
  const { slotIndex, bagPosition } = getDropTargetsAt(x, y);

  if (slotIndex) {
    const itemId = pinnedSlots[slotIndex];

    return itemId
      ? { source: { type: "slot", slot: slotIndex }, itemId }
      : null;
  }

  if (bagPosition !== null) {
    const cell = resolveBagCellAt(bagPosition);

    if (cell.type === "master")
      return { source: { type: "bag" }, itemId: cell.item.id };
    if (cell.type === "split") {
      return {
        source: { type: "bagSplit", index: cell.index },
        itemId: cell.stack.itemId,
      };
    }
  }

  return null;
}

function sameSource(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === "bag") return true;
  if (a.type === "bagSplit") return a.index === b.index;
  return a.slot === b.slot;
}

// Kinukuha (o dinaragdagan, kung ito na ang parehong pinagmulan) ang 1
// piraso mula sa "source" papunta sa floatingPickup - ginagamit ng
// STANDALONE na "right-click = cut 1" (walang kailangang i-hold ang
// left button - tingnan ang paliwanag sa itaas).
function cutOneIntoFloat(source, itemId) {
  if (
    floatingPickup &&
    (floatingPickup.itemId !== itemId ||
      !sameSource(floatingPickup.source, source))
  ) {
    return false;
  }

  const available =
    source.type === "bag"
      ? getBagUnassignedCount(itemId)
      : source.type === "bagSplit"
        ? getBagSplitStackCount(source.index)
        : getPinnedSlotEffectiveCount(source.slot, itemId);

  if (available <= 0) return false;

  if (!floatingPickup) {
    floatingPickup = { itemId, count: 0, source };

    floatingGhostEl = document.createElement("div");
    floatingGhostEl.id = "floating-pickup-ghost";
    document.body.appendChild(floatingGhostEl);
    applyFloatingGhostScale(source);
  }

  if (source.type === "slot") {
    pinnedSlotCounts[source.slot] = available - 1;

    if (pinnedSlotCounts[source.slot] <= 0) {
      delete pinnedSlots[source.slot];
      delete pinnedSlotCounts[source.slot];
    }
  } else if (source.type === "bagSplit") {
    bagSplitStacks[source.index].count = available - 1;

    if (bagSplitStacks[source.index].count <= 0) {
      delete bagSplitStacks[source.index];
    }
  }

  floatingPickup.count++;
  updateFloatingGhostContent();
  syncHotbarUI();
  syncBagPanel();

  return true;
}

// I-RIGHT-CLICK ang kahit anong hotbar slot/bag cell na may stock para
// "BAWASAN"/"CUT" ng 1 piraso doon patungong isang lumulutang na sumusunod
// sa cursor - PAULIT-ULIT na puwede sa PAREHONG pinagmulan (dumaragdag ng
// 1 kada pindot). Habang naka-HAWAK pa rin ang left button (dragState.
// activated) - ito rin ang parehong right-click, pero ang ibig sabihin
// dito ay "IBAWAS" mula sa HAWAK papunta sa kahit saang target (tingnan
// ang unang sanga sa ibaba).
document.addEventListener("pointerdown", (event) => {
  if (event.button !== 2) return;

  if (dragState && dragState.activated && floatingPickup) {
    event.preventDefault();

    const { slotIndex, bagPosition } = getDropTargetsAt(
      event.clientX,
      event.clientY,
    );

    if (slotIndex) moveFloatingToSlot(slotIndex, 1);
    else if (bagPosition !== null) moveFloatingToBagPosition(bagPosition, 1);

    if (!floatingPickup) dragState = null; // naubos na - tapos na rin ang hold

    syncHotbarUI();
    syncBagPanel();
    return;
  }

  if (dragState) return; // may nangyayaring click/hold pa (di pa na-activate)

  // AYOS (hiling ng user): "nandun na rin yung rightclick yung unuse/
  // drop mapupunta sa inventory" - RIGHT-CLICK sa MISMONG equip slot ng
  // bag (profile) habang naka-suot - "Unuse"/"Drop" na popup, kaparehong
  // itsura ng "Use"/"Drop" sa ibaba (bag sa inventory). SINADYANG
  // nilagay ito DITO (document-level, HINDI direktang element listener)
  // - kasunod ng "outside click closer" (itaas ng file) sa PAGKAKASUNOD-
  // SUNOD ng pagkaka-REGISTER, para hindi agad "isara" ang sarili
  // niyang menu sa parehong event cycle (tingnan ang mas detalyadong
  // paliwanag kung saan dating nakalagay ito, malapit sa useBagEquip).
  if (
    typeof bagEquipped !== "undefined" &&
    bagEquipped &&
    event.target.closest &&
    event.target.closest("#equip-slot-bag")
  ) {
    event.preventDefault();

    showBagActionMenu(event.clientX, event.clientY, [
      { label: "Unuse", onClick: () => unequipBag() },
      { label: "Drop", onClick: () => placeBagInWorld() },
    ]);

    return;
  }

  const target = resolveTargetSourceAt(event.clientX, event.clientY);

  if (!target) return;

  // BAGONG SPECIAL CASE: "bag" - sa halip na "cut 1 into float" (gawi ng
  // LAHAT ng ibang item), lumalabas ang "Use"/"Drop" na menu (hiling ng
  // user). Hindi ito humahantong sa cutOneIntoFloat.
  if (target.itemId === "bag" && !floatingPickup) {
    event.preventDefault();

    showBagActionMenu(event.clientX, event.clientY, [
      { label: "Use", onClick: () => useBagEquip() },
      { label: "Drop", onClick: () => dropBagFromInventory() },
    ]);

    return;
  }
  // BAGONG SPECIAL CASE (hiling ng user): "Hold"/"Throw" - para sa mga
  // "droppable sa ground" na item (Crafter/Stove/Light - tingnan ang
  // HOLDABLE_ITEM_IDS, hold.js) - kaparehong-pareho ng gawi ng "bag" sa
  // itaas (sariling popup menu, hindi humahantong sa cutOneIntoFloat).
  // Kung ITO na mismo ang kasalukuyang HAWAK (heldItemId), "Unhold" ang
  // lumalabas sa halip na "Hold".
  if (
    typeof HOLDABLE_ITEM_IDS !== "undefined" &&
    HOLDABLE_ITEM_IDS.includes(target.itemId) &&
    !floatingPickup
  ) {
    event.preventDefault();

    const alreadyHeld =
      typeof heldItemId !== "undefined" && heldItemId === target.itemId;

    showBagActionMenu(event.clientX, event.clientY, [
      alreadyHeld
        ? { label: "Unhold", onClick: () => unholdItem() }
        : { label: "Hold", onClick: () => holdItem(target.itemId) },
      // AYOS (hiling ng user: "magkaiba ang drop sa throw - yung
      // throw is itatapon ang item, at drop naman ay ilalapag sa
      // sahig") - DALAWANG hiwalay na aksyon (dating "Throw" na lang
      // pinalitan ng label papuntang "Drop" - MALI, dahil magkaiba
      // pala talaga ang gusto - "Throw" (2 tile, parang itinapon) AT
      // "Drop" (1 tile lang, mahinahong nilapag) ang dapat pareho
      // ipakita, hindi lang isa sa dalawa.
      { label: "Throw", onClick: () => throwItem(target.itemId) },
      { label: "Drop", onClick: () => dropItem(target.itemId) },
    ]);

    return;
  }

  // BAGONG SPECIAL CASE (hiling ng user): "food" (EDIBLE_ITEMS - carrot,
  // atbp.) - lumalabas ang "Use" na menu (isang buton lang) sa halip na
  // "cut 1 into float" (dating/generic na gawi) - kaparehong-pareho ng
  // gawi ng "bag"/HOLDABLE sa itaas. Gumagana ito KAHIT SAAN nakikita
  // ang food (bag master cell, bag split-stack, O naka-pin na hotbar
  // slot) dahil generic na ang resolveTargetSourceAt sa parehong source.
  if (
    typeof EDIBLE_ITEMS !== "undefined" &&
    EDIBLE_ITEMS[target.itemId] &&
    !floatingPickup
  ) {
    event.preventDefault();

    showBagActionMenu(event.clientX, event.clientY, [
      { label: "Use", onClick: () => eatItem(target.itemId) },
    ]);

    return;
  }

  if (cutOneIntoFloat(target.source, target.itemId)) event.preventDefault();
});

// Pigilan ang OS/browser context menu habang may lumulutang O naka-hawak
// (ang right-click dito ay para sa "cut/bawas", hindi para sa menu).
document.addEventListener("contextmenu", (event) => {
  if (floatingPickup || (dragState && dragState.activated))
    event.preventDefault();
});

function getItemIconHTML(item) {
  if (item.icon) {
    return '<img src="' + item.icon + '" alt="" class="hotbar-slot-item-img">';
  }
  if (item.iconEmoji) {
    return '<span class="hotbar-icon">' + item.iconEmoji + "</span>";
  }
  return "";
}

// "slot" -> pointerdown sa isang FILLED na hotbar slot (1-9). "bag" ->
// mula sa MASTER cell ng bag panel (itemId ang ibinibigay). "bagSplit"
// -> mula sa isang HIWALAY na split-stack cell sa bag (index ang
// ibinibigay) - tingnan ang syncBagPanel/buildBagSplitStackSlot.
function startPointerAction(source, slotIndexOrItemId, event) {
  if (event.button !== 0) return; // left-click lang ang nagpapasimula ng hold/click dito

  // May STANDALONE na lumulutang na (right-click "cut" - tingnan ang
  // "HOLD-DRAG SPLIT STACK" sa itaas), HINDI mula sa isang aktibong
  // hold-drag - ang SUSUNOD na plain LEFT-CLICK kahit saan (slot/bag/
  // bagSplit) ay MAGLALAGAY nito doon, sa halip na magsimula ng bagong
  // hold.
  if (floatingPickup && (!dragState || !dragState.activated)) {
    event.preventDefault();

    if (source === "slot")
      moveFloatingToSlot(slotIndexOrItemId, floatingPickup.count);
    else if (source === "bagSplit")
      moveFloatingToBagSplitIndex(slotIndexOrItemId, floatingPickup.count);
    else moveFloatingToBagMaster(floatingPickup.count);

    if (floatingPickup) settleFloatBackToSource(); // hindi kumasya lahat - ibalik ang natira

    syncHotbarUI();
    syncBagPanel();
    return;
  }

  const itemId =
    source === "slot"
      ? pinnedSlots[slotIndexOrItemId]
      : source === "bagSplit"
        ? bagSplitStacks[slotIndexOrItemId]?.itemId
        : slotIndexOrItemId;

  if (!itemId) {
    // Bakanteng hotbar slot (1-9) - walang idadrag (walang laman),
    // pero CLICKABLE pa rin para sa "selection" (plain white border -
    // tingnan ang .hotbar-slot-empty.active sa style.css): i-click ang
    // isang bakanteng slot para piliin ito (at para AWTOMATIKONG
    // maalis ang dating gold na highlight ng ibang FILLED na slot, kung
    // meron - iisa lang kasi ang selectedInventorySlot kahit anong uri
    // ng slot). I-click ulit ang parehong bakanteng slot para i-off.
    if (source === "slot") {
      selectedInventorySlot =
        selectedInventorySlot === slotIndexOrItemId ? null : slotIndexOrItemId;
      syncHotbarUI();
    }

    return;
  }

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item) return;

  if (source === "slot") {
    if (item.getCount() <= 0) {
      // Naubos na ang stock - alisin na lang sa slot.
      delete pinnedSlots[slotIndexOrItemId];
      delete pinnedSlotCounts[slotIndexOrItemId];
      syncHotbarUI();
      return;
    }

    // AGAD na naka-gold-highlight ang alinmang item (kasama na ang
    // carrot) sa mismong pointerdown, hindi na naghihintay ng
    // pointerup/drag-threshold pa - para isa lang talaga kahit kailan
    // ang naka-highlight, at agad itong nawawala/lumilipat kapag may
    // ibang na-click, kahit anong pagsasama ng slot (may laman o wala).
    // Ang AKTWAL na pag-equip ng carrot bilang binhi (hindi lang ang
    // highlight) ay ipinagpapaliban pa rin hanggang sa pointerup, kung
    // click lang ito (hindi drag) - tingnan ang "dragState.activated"
    // sa ibaba - para hindi maapektuhan ang tunay na equip state sa
    // tuwing may subukan lang i-drag (ilipat) ang carrot papunta sa
    // ibang slot.
    selectedInventorySlot =
      selectedInventorySlot === slotIndexOrItemId ? null : slotIndexOrItemId;
    syncHotbarUI();
  }

  dragState = {
    source,
    itemId,
    fromSlotIndex: source === "slot" ? slotIndexOrItemId : null,
    bagSplitIndex: source === "bagSplit" ? slotIndexOrItemId : null,
    fromBagPosition:
      source === "bag" && event.currentTarget?.dataset.bagPosition !== undefined
        ? Number(event.currentTarget.dataset.bagPosition)
        : null,
    startX: event.clientX,
    startY: event.clientY,
    activated: false,
  };

  event.preventDefault();
}

// Tinatawag mula sa keydown listener (dig.js) kapag pinindot ang digit
// key 1-9 - kaparehong epekto ng basta pag-click (hindi drag) sa
// mismong slot na iyon sa hotbar UI: kung carrot ang laman, doon nito
// ie-equip/i-unequip bilang binhi; kung ibang item, doon lang nag-
// toggle ang gold highlight (selectedInventorySlot). Walang ginagawa
// kung bakante ang slot.
// Kung ang itemId ay isa sa pickaxe/rake/axe - i-equip/i-unequip ito
// (kaparehong-pareho ng Alt+radial - tingnan ang equipPickaxe/equipRake/
// equipAxe) sa halip na basta i-toggle ang gold-highlight/selection.
// Ginagamit ito ng activateHotbarSlot (digit key) AT ng pointerup
// click-branch (mouse click, walang drag) - tingnan sa ibaba.
//
// TANDAAN: nag-che-check din ito ng "Unlocked" (naka-install na sa tool
// radial) bago mag-equip - kung "InInventory" pa lang ito (bago pa
// lang na-craft, hindi pa na-double click/na-install), FALSE ang
// ibabalik nito - kaya babagsak na lang sa normal na gold-highlight/
// selection sa halip na basta walang mangyayari, gaya ng ibang normal
// na item sa bag (tingnan ang activateHotbarSlot sa ibaba).
function equipToolItemIfApplicable(itemId) {
  if (itemId === "pickaxe" && pickaxeUnlocked) {
    equipPickaxe();
    return true;
  }
  if (itemId === "rake" && rakeUnlocked) {
    equipRake();
    return true;
  }
  if (itemId === "axe" && axeUnlocked) {
    equipAxe();
    return true;
  }
  return false;
}

function activateHotbarSlot(i) {
  const itemId = pinnedSlots[i];

  if (!itemId) return;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  if (!item || item.getCount() <= 0) {
    // Naubos na ang stock - alisin na lang sa slot.
    delete pinnedSlots[i];
    delete pinnedSlotCounts[i];
    syncHotbarUI();
    return;
  }

  if (equipToolItemIfApplicable(itemId)) return;

  selectedInventorySlot = selectedInventorySlot === i ? null : i;
  syncHotbarUI();
}

function moveDragGhost(x, y) {
  if (!dragGhostEl) return;
  dragGhostEl.style.left = x + "px";
  dragGhostEl.style.top = y + "px";
}

function clearDropHighlights() {
  document
    .querySelectorAll(".drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
}

function getDropTargetsAt(x, y) {
  const el = document.elementFromPoint(x, y);

  if (!el) return {};

  const slotEl = el.closest && el.closest('[id^="hotbar-slot-"]');
  const slotMatch = slotEl && /^hotbar-slot-([1-9])$/.exec(slotEl.id);
  const trashEl = el.closest && el.closest("#bag-trash");
  const leftHandEl = el.closest && el.closest("#equip-slot-lefthand");
  const rightHandEl = el.closest && el.closest("#equip-slot-righthand");
  // AYOS (hiling ng user): "kapag na drag ko yung bag papuntang bag
  // slot sa profile" - pangalawang paraan (bukod sa right-click "Use")
  // para i-equip ang bag - i-drag/i-drop diretso sa #equip-slot-bag.
  const bagSlotEl = el.closest && el.closest("#equip-slot-bag");
  // "#bag-panel" o "#stove-panel" - PAREHONG bag data ang ipinapakita
  // nila (tingnan ang renderBagGridInto/#stove-panel-grid sa
  // stove.js), kaya PAREHONG "overBag" ang dalawa.
  const bagEl = el.closest && el.closest("#bag-panel, #stove-panel");
  const bagCellEl =
    el.closest &&
    el.closest(
      "#bag-panel-grid > [data-bag-position], #stove-panel-grid > [data-bag-position]",
    );
  const craftInputEl = el.closest && el.closest(".craft-input-slot");
  const craftOutputEl = el.closest && el.closest("#craft-output-slot");
  const smeltInputEl = el.closest && el.closest(".smelt-input-slot");
  const smeltOutputEl = el.closest && el.closest("#stove-output-slot");
  // Ang oldman shop panel (decor.js) - "drop" dito ng isang item mula
  // sa bag/hotbar = pagbebenta SA KANYA (hindi karaniwang paglipat ng
  // slot) - tingnan ang paggamit nito sa pointermove/pointerup sa ibaba.
  const oldManShopEl = el.closest && el.closest("#oldman-shop-panel");

  return {
    slotIndex: slotMatch ? Number(slotMatch[1]) : null,
    overTrash: !!trashEl,
    overLeftHand: !!leftHandEl,
    overRightHand: !!rightHandEl,
    overBagSlot: !!bagSlotEl,
    overBag: !!bagEl,
    overCanvas: el.id === "gameCanvas",
    // Posisyon (0-based) ng bag grid cell na kasalukuyang tinuturo.
    bagPosition: bagCellEl ? Number(bagCellEl.dataset.bagPosition) : null,
    // Posisyon (0-based) ng craft input cell na kasalukuyang tinuturo,
    // kung meron (tingnan ang craft.js).
    craftInputSlot: craftInputEl
      ? Number(craftInputEl.dataset.craftSlot)
      : null,
    overCraftOutput: !!craftOutputEl,
    // "ingredient" o "fuel" - alin sa dalawang smelt input slot ng
    // #stove-panel ang kasalukuyang tinuturo (tingnan ang stove.js).
    smeltInputSlot: smeltInputEl ? smeltInputEl.dataset.smeltSlot : null,
    overSmeltOutput: !!smeltOutputEl,
    overOldManShop: !!oldManShopEl,
  };
}

// Puwede bang buhatin/i-drag PALABAS ang laman ng isang "equip hand"
// slot? Ito lang ang mga source na "equip-left"/"equip-right" (tingnan
// ang mga pointerdown listener ng #equip-slot-lefthand/righthand sa
// ibaba) - LUMANG paraan pa rin ito (dragGhostEl, hindi floatingPickup).
function isEquipHandSource(source) {
  return source === "equip-left" || source === "equip-right";
}

// Ang mga source na ito ay bahagi ng BAGONG "hold-drag split stack"
// economy (may bilang, floatingPickup) - lahat ng iba pa (equip-left/
// right, craft-input/output) ay LUMANG dragGhostEl-based na drag pa rin,
// hindi nagbago.
function usesFloatEconomy(source) {
  return source === "slot" || source === "bag" || source === "bagSplit";
}

document.addEventListener("pointermove", (event) => {
  if (!dragState) return;

  // AYOS (hiling ng user): "alisin mo na yung mga item na draggable di
  // na dapat draggable throw na lang kung sakali" - dating dito
  // (pagkatapos lumampas ng DRAG_THRESHOLD_PX ng cursor habang naka-
  // hawak) "ina-ARM" ang buong stack papunta sa isang lumulutang na
  // ghost na sumusunod sa cursor (grabWholeStackIntoFloat) - TALAGANG
  // "draggable" na paglipat ng item. TINANGGAL na ito - hindi na
  // dapat mag-activate ang isang drag kahit gaano pa gumalaw ang
  // cursor/daliri habang naka-hawak sa isang PANGKALAHATANG item sa
  // inventory (slot/bag/bagSplit - tingnan ang usesFloatEconomy) - sa
  // halip, ang popup ng mga aksyon na lang (Use/Hold/Throw/Drop/Slice -
  // buildMobileItemActions, mobile-slice.js) ang lumalabas sa isang
  // plain click/tap (tingnan ang pointerup sa ibaba). HINDI apektado
  // nito ang IBANG uri ng drag (craft-input/craft-output/smelt-
  // ingredient/smelt-fuel/equip-hand/oldman-buy) - LUMANG dragGhostEl-
  // based na paraan pa rin ang mga iyon, hiwalay sa usesFloatEconomy -
  // tuloy-tuloy silang gumagana, walang binago.
  if (usesFloatEconomy(dragState.source)) return;

  // Ang mga LUMANG dragGhostEl-based na source (craft-input/craft-
  // output/smelt-ingredient/smelt-fuel/equip-hand/oldman-buy) ay
  // "activated: true" na AGAD sa pointerdown pa lang nila mismo
  // (tingnan ang startCraftInputDrag, craft.js, at kaparehong mga
  // function sa stove.js/dito) - walang DRAG_THRESHOLD_PX na
  // hinihintay, kaya diretso na lang dito sa paggalaw ng ghost.
  moveDragGhost(event.clientX, event.clientY);

  clearDropHighlights();

  const {
    slotIndex,
    overTrash,
    overLeftHand,
    overBagSlot,
    overBag,
    bagPosition,
    craftInputSlot,
    overCraftOutput,
    smeltInputSlot,
    overSmeltOutput,
    overOldManShop,
  } = getDropTargetsAt(event.clientX, event.clientY);

  if (overOldManShop && usesFloatEconomy(dragState.source)) {
    document.getElementById("oldman-shop-panel")?.classList.add("drop-target");
  } else if (overTrash) {
    document.getElementById("bag-trash")?.classList.add("drop-target");
  } else if (overLeftHand && dragState.itemId === "torch") {
    document
      .getElementById("equip-slot-lefthand")
      ?.classList.add("drop-target");
  } else if (overBagSlot && dragState.itemId === "bag") {
    document.getElementById("equip-slot-bag")?.classList.add("drop-target");
  } else if (craftInputSlot !== null && usesFloatEconomy(dragState.source)) {
    document
      .querySelector(`.craft-input-slot[data-craft-slot="${craftInputSlot}"]`)
      ?.classList.add("drop-target");
  } else if (overCraftOutput && dragState.source === "craft-output") {
    document.getElementById("craft-output-slot")?.classList.add("drop-target");
  } else if (smeltInputSlot && usesFloatEconomy(dragState.source)) {
    document
      .querySelector(`.smelt-input-slot[data-smelt-slot="${smeltInputSlot}"]`)
      ?.classList.add("drop-target");
  } else if (
    overSmeltOutput &&
    (dragState.source === "smelt-ingredient" ||
      dragState.source === "smelt-fuel")
  ) {
    document.getElementById("stove-output-slot")?.classList.add("drop-target");
  } else if (slotIndex) {
    document
      .getElementById("hotbar-slot-" + slotIndex)
      ?.classList.add("drop-target");
  } else if (
    bagPosition !== null &&
    (usesFloatEconomy(dragState.source) ||
      dragState.source === "craft-input" ||
      dragState.source === "craft-output" ||
      dragState.source === "smelt-ingredient" ||
      dragState.source === "smelt-fuel")
  ) {
    document
      .querySelectorAll(`[data-bag-position="${bagPosition}"]`)
      .forEach((cellEl) => cellEl.classList.add("drop-target"));
  } else if (
    overBag &&
    (dragState.source === "slot" ||
      isEquipHandSource(dragState.source) ||
      dragState.source === "oldman-buy" ||
      dragState.source === "craft-input" ||
      dragState.source === "craft-output" ||
      dragState.source === "smelt-ingredient" ||
      dragState.source === "smelt-fuel")
  ) {
    document.getElementById("bag-panel")?.classList.add("drop-target");
    document.getElementById("stove-panel")?.classList.add("drop-target");
  }
});

document.addEventListener("pointerup", (event) => {
  if (!dragState) return;
  if (event.button !== 0) return;

  const floatEconomy = usesFloatEconomy(dragState.source);

  if (!dragState.activated) {
    // Click lang ito, hindi drag (hindi pa lumagpas sa threshold - kaya
    // wala pang floatingPickup na nasimulan). Mula sa BAG: i-highlight
    // lang ang item na ito. Ang gold-highlight ng carrot (para sa
    // pagtatanim - tingnan ang isCarrotSlotSelected sa dig.js) ay
    // nangyari na sa pointerdown, kasabay ng ibang item - wala nang
    // dagdag na gagawin dito.
    if (dragGhostEl) {
      dragGhostEl.remove();
      dragGhostEl = null;
    }
    clearDropHighlights();

    // AYOS (hiling ng user): "alisin mo na yung mga item na draggable
    // di na dapat draggable throw na lang kung sakali" - dating
    // TOUCH-ONLY na alternatibo ito sa pag-drag (dahil noon, DESKTOP
    // pa rin ang gumagamit ng TALAGANG pag-drag papuntang ibang slot -
    // tingnan ang pointermove sa itaas, TINANGGAL na rin ngayon iyon).
    // Ngayon, PAREHONG-PAREHO na ito (mouse man o touch) - isang
    // MAIKLING TAP/CLICK lang (walang paggalaw, walang long-press) sa
    // isang naka-fill na SLOT/BAG/bagSplit cell ay nagpapakita ng popup
    // ng mga karagdagang aksyon (Use/Hold/Throw/Drop/Slice, depende sa
    // uri ng item - buildMobileItemActions, mobile-slice.js) - NANANATILI
    // ang item sa kinaroroonan nito (WALANG "tumataas"/float, tingnan
    // ang handleMobileItemTap doon), highlight/selection na lang.
    // TOOLS (pickaxe/axe/rake) - nauuna pa rin ang pag-equip
    // (equipToolItemIfApplicable) kaysa sa popup na ito, para hindi
    // masira ang dating gawi ng pag-click/tap sa mga ito.
    if (
      usesFloatEconomy(dragState.source) &&
      dragState.itemId &&
      typeof handleMobileItemTap === "function"
    ) {
      const isTool =
        dragState.source === "slot" &&
        equipToolItemIfApplicable(dragState.itemId);

      if (!isTool) {
        const source =
          dragState.source === "slot"
            ? { type: "slot", slot: dragState.fromSlotIndex }
            : dragState.source === "bagSplit"
              ? { type: "bagSplit", index: dragState.bagSplitIndex }
              : { type: "bag" };

        handleMobileItemTap(
          source,
          dragState.itemId,
          event.clientX,
          event.clientY,
        );
      }

      dragState = null;
      return;
    }

    dragState = null;
    return;
  }

  if (dragGhostEl) {
    dragGhostEl.remove();
    dragGhostEl = null;
  }
  clearDropHighlights();

  const {
    slotIndex,
    overTrash,
    overLeftHand,
    overBagSlot,
    overBag,
    overCanvas,
    bagPosition,
    craftInputSlot,
    overCraftOutput,
    smeltInputSlot,
    overSmeltOutput,
    overOldManShop,
  } = getDropTargetsAt(event.clientX, event.clientY);

  if (floatEconomy) {
    if (!floatingPickup) {
      dragState = null;
      return;
    }

    if (overOldManShop) {
      // Pagbebenta SA OLDMAN (decor.js) - hindi na basta paglipat ng
      // slot. Ibinabalik muna nang BUO sa pinagmulan ang hawak (parang
      // na-cancel ang normal na drag) - ang OLDMAN SELL FLOW mismo
      // (popup kung >1 ang bilang, o direkta kung 1 lang) ang bahalang
      // mag-alis ng stock/dagdag ng gold, base sa pinili ng manlalaro.
      const sellItemId = floatingPickup.itemId;
      const sellMaxCount = floatingPickup.count;

      settleFloatBackToSource();

      if (typeof startOldManSellFlow === "function") {
        startOldManSellFlow(sellItemId, sellMaxCount);
      }
    } else if (overTrash) {
      // Permanenteng tanggalin - EKSAKTONG ang hawak na bilang lang
      // (hindi ang buong TOTAL na stock), dahil baka may nailagay na
      // ibang piraso nito sa ibang slot na (right-click peel) bago pa
      // man dumating dito.
      adjustGlobalItemCount(floatingPickup.itemId, -floatingPickup.count);

      if (
        floatingPickup.itemId === "torch" &&
        torchEquipped &&
        torchesCollected <= 0
      ) {
        equipTorch();
      }

      clearFloatingPickupState();
    } else if (overLeftHand && floatingPickup.itemId === "torch") {
      // TORCH SA LEFT HAND - "ginamit" na ito, hindi na ibinabalik kahit
      // saan (hindi rin nabawasan ang stock - boolean lang ang equip).
      if (!torchEquipped) equipTorch();
      clearFloatingPickupState();
    } else if (overBagSlot && floatingPickup.itemId === "bag") {
      // AYOS (hiling ng user): "kapag na drag ko yung bag papuntang bag
      // slot sa profile, once na drop ko dun sa slot is automatic mag
      // equip" - PAREHONG dahilan/gawi ng torch sa left hand sa itaas -
      // "ginamit" na ito (bagEquipped = true), hindi na ibinabalik/
      // nabawasan ang stock (boolean/toggle lang din ang "suot ba" -
      // tingnan ang useBagEquip, itaas).
      if (!bagEquipped) useBagEquip();
      clearFloatingPickupState();
    } else if (craftInputSlot !== null) {
      // AYOS (hiling ng user): "yung slots sa crafter is di nalalagyan
      // ng 99 woods... kung yung woods ay more than one pwede siya
      // madrag" - BUONG HAWAK (floatingPickup.count) na ang ipinapasa
      // ngayon (dating 1 lang, laging natitira ang sobra) - kung KASYA
      // (base sa MAX_CRAFT_STACK ng cell at sa TALAGANG stock),
      // BUONG stack ang naiilagay sa ISANG paglagay/drag lang. Ang
      // AKTWAL na naibawas sa hawak ay base sa TALAGANG naiLAGAY
      // (placedAmount, ibinalik ng placeCraftIngredient) - hindi na
      // basta 1 - ang NATITIRA lang (kung meron, hal. puno na ang
      // cell bago pa naubos ang buong hawak) ang ibinabalik pabalik sa
      // pinagmulan.
      if (typeof placeCraftIngredient === "function") {
        const placedAmount = placeCraftIngredient(
          craftInputSlot,
          floatingPickup.itemId,
          floatingPickup.count,
        );

        floatingPickup.count -= placedAmount;

        if (floatingPickup.count <= 0) clearFloatingPickupState();
        else settleFloatBackToSource();
      } else {
        settleFloatBackToSource();
      }
    } else if (
      smeltInputSlot === "fuel" &&
      !SMELT_FUEL_ITEMS.has(floatingPickup.itemId)
    ) {
      // "Strictly" wood/charcoal LANG ang tinatanggap ng fuel slot
      // (tingnan ang SMELT_FUEL_ITEMS sa stove.js) - basta ibalik sa
      // pinagmulan kung ibang item ito.
      settleFloatBackToSource();
    } else if (smeltInputSlot) {
      // "ingredient" o "fuel" - KAHIT ILANG PIRASO na (buong hawak,
      // hindi na 1 lang - tingnan ang placeSmeltItem sa stove.js), ang
      // NATITIRA lang (kung meron - hal. tumangging tumanggap dahil
      // ibang item type na ang laman) ang ibinabalik sa pinagmulan.
      if (typeof placeSmeltItem === "function") {
        const placed = placeSmeltItem(
          smeltInputSlot,
          floatingPickup.itemId,
          floatingPickup.count,
        );

        floatingPickup.count -= placed;

        if (floatingPickup.count <= 0) clearFloatingPickupState();
        else settleFloatBackToSource();
      } else {
        settleFloatBackToSource();
      }
    } else if (slotIndex) {
      moveFloatingToSlot(slotIndex, floatingPickup.count);
      if (floatingPickup) settleFloatBackToSource(); // may natira (puno ang target)
    } else if (bagPosition !== null) {
      moveFloatingToBagPosition(bagPosition, floatingPickup.count);
      if (floatingPickup) settleFloatBackToSource();
    } else if (overCanvas) {
      // Itinapon sa mundo - EKSAKTONG ang hawak na bilang lang.
      const amount = floatingPickup.count;

      if (typeof dropItemFromSlotIntoWorld === "function") {
        dropItemFromSlotIntoWorld(floatingPickup.itemId, amount);
      }

      adjustGlobalItemCount(floatingPickup.itemId, -amount);
      clearFloatingPickupState();
    } else if (overBag) {
      // Nasa bag panel pero hindi eksaktong sa ibabaw ng isang cell -
      // i-deposit na lang sa MASTER pool.
      moveFloatingToBagMaster(floatingPickup.count);
    } else {
      // Walang valid na target - ibalik sa pinagmulan.
      settleFloatBackToSource();
    }

    syncHotbarUI();
    syncBagPanel();
    dragState = null;
    return;
  }

  // LUMANG paraan (equip-left/equip-right/craft-input/craft-output) -
  // hindi nagbago.
  if (overTrash) {
    if (dragState.source === "equip-left") {
      if (torchEquipped) equipTorch();
    } else if (dragState.source === "equip-right") {
      unequipRightHandTool();
    }
    syncHotbarUI();
  } else if (overCraftOutput && dragState.source === "craft-output") {
    // AYOS (hiling ng user): "dun kasi sa result slot ng crafter at
    // stove at sa craft is draggable dapat para malipat mas ok siguro
    // kung isang pindot na lang din at automatic na pupunta sa
    // inventory" - dating WALANG EPEKTO ang basta pag-CLICK (walang
    // paggalaw) dito - kailangan pa TALAGANG i-drag PALABAS (papunta
    // sa bag/hotbar slot/mundo) bago pa man "makuha" ang laman nito.
    // Ngayon, isang PLAIN CLICK na lang (drop pabalik sa MISMONG
    // output slot ring ito - ibig sabihin, walang TALAGANG paggalaw)
    // ay AWTOMATIKONG kumukuha nito papunta sa inventory (parehong
    // function/resulta ng "i-drag papunta sa bag" - collectCraftOutput,
    // craft.js).
    if (typeof collectCraftOutput === "function") collectCraftOutput();

    syncHotbarUI();
  } else if (dragState.source === "craft-input" && overCanvas) {
    // Itinapon sa MUNDO (hindi sa bag) - dapat kaparehong-pareho ng
    // gawi ng ibang item (carrot/wood/stone, tingnan ang
    // dropItemFromSlotIntoWorld sa ground-items.js): totoong
    // "floating"/naka-lapag na ground item (may bounce animation), o
    // PLACEMENT kung "crafter" (naiiba ito - hindi basta nahuhulog,
    // permanenteng inilalagay sa isang tile). HINDI dapat ibinabalik
    // sa GLOBAL bag stock (kaya HINDI tinatawag ang
    // removeCraftIngredient dito - iyon ay para sa "bag" lang na
    // destinasyon).
    //
    // AYOS: BUONG count ng cell (hindi lang 1) ang dapat mahulog -
    // ang isang craft-input cell ay puwede nang maghawak ng maraming
    // piraso ngayon (tingnan ang craft.js) - kung 1 lang ang basta
    // gagamitin dito, mawawala/masasayang ang labis kapag maraming
    // naipon sa cell na iyon.
    const droppedCell = craftInputs[dragState.fromSlotIndex];
    const droppedAmount = droppedCell ? droppedCell.count : 1;

    craftInputs[dragState.fromSlotIndex] = null;

    if (typeof dropItemFromSlotIntoWorld === "function") {
      dropItemFromSlotIntoWorld(dragState.itemId, droppedAmount);
    }

    // AYOS: dahil hindi na "pre-consumed" ang mga input cell (tingnan
    // ang updateCraftOutputFromInputs sa craft.js), kailangang i-refresh
    // ang preview ng output - baka nasira na ang pattern.
    if (typeof updateCraftOutputFromInputs === "function")
      updateCraftOutputFromInputs();

    if (typeof syncCraftPanel === "function") syncCraftPanel();

    syncHotbarUI();
  } else if (dragState.source === "craft-output" && overCanvas) {
    const outputItemId = craftOutput ? craftOutput.itemId : null;
    const outputCount = craftOutput ? craftOutput.count : 0;

    craftOutput = null;

    if (outputItemId && typeof dropItemFromSlotIntoWorld === "function") {
      dropItemFromSlotIntoWorld(outputItemId, outputCount);
    }

    if (typeof syncCraftPanel === "function") syncCraftPanel();

    syncHotbarUI();
  } else if (
    dragState.source === "craft-input" &&
    (overBag || slotIndex || bagPosition !== null)
  ) {
    // "Makukuha"/mailalagay ang isang crafted item kahit saan (hotbar
    // slot 1-9, o kahit anong bag cell), basta HINDI equipment slot
    // (walang branch dito para diyan, kaya nire-reject/wala itong
    // epekto) - tingnan din ang katulad na paghahambing sa
    // craft-output sa ibaba. Una, ibinabalik sa GLOBAL stock (bag) ang
    // isang piraso, TAPOS kung eksaktong sa isang hotbar slot (1-9)
    // ito na-drop, ipipin ito DIRETSO doon (pinCraftItemToSlot) - kaya
    // "mawawala" ito sa bag master pool (nabawasan na ang unassigned
    // count nito, tingnan ang getBagUnassignedCount) at doon na lang
    // mapupunta/lalabas sa hotbar.
    if (typeof removeCraftIngredient === "function") {
      removeCraftIngredient(dragState.fromSlotIndex);
    }

    if (slotIndex && typeof pinCraftItemToSlot === "function") {
      pinCraftItemToSlot(slotIndex, dragState.itemId, 1);
    }

    syncHotbarUI();
  } else if (
    dragState.source === "craft-output" &&
    (overBag || slotIndex || bagPosition !== null)
  ) {
    // Kunin muna ang itemId/bilang BAGO tumawag ng collectCraftOutput
    // (nag-uuwi nito ng "null" sa craftOutput).
    const outputItemId = craftOutput ? craftOutput.itemId : null;
    const outputCount = craftOutput ? craftOutput.count : 0;

    if (typeof collectCraftOutput === "function") collectCraftOutput();

    if (slotIndex && outputItemId && typeof pinCraftItemToSlot === "function") {
      pinCraftItemToSlot(slotIndex, outputItemId, outputCount);
    }

    syncHotbarUI();
  } else if (overSmeltOutput && dragState.source === "smelt-output") {
    // Parehong AYOS ng craft-output sa itaas - isang PLAIN CLICK na
    // lang (walang TALAGANG paggalaw) ay AWTOMATIKONG kumukuha na rin
    // nito papunta sa inventory (collectSmeltOutput, stove.js).
    if (typeof collectSmeltOutput === "function") collectSmeltOutput();
  } else if (
    (dragState.source === "smelt-ingredient" ||
      dragState.source === "smelt-fuel") &&
    overCanvas
  ) {
    // Kaparehong-pareho ng gawi ng craft-input - itinapon sa MUNDO
    // (hindi sa bag), kaya HINDI dapat ibinabalik sa GLOBAL bag stock.
    // BUONG STACK (hindi lang 1) ang natatanggal/nahuhulog ngayon -
    // tingnan ang removeSmeltItem (stove.js).
    const removed =
      typeof removeSmeltItem === "function"
        ? removeSmeltItem(dragState.smeltSlotType, false)
        : null;

    if (removed && typeof dropItemFromSlotIntoWorld === "function") {
      dropItemFromSlotIntoWorld(removed.itemId, removed.count);
    }

    if (typeof syncStovePanel === "function") syncStovePanel();

    syncHotbarUI();
  } else if (dragState.source === "smelt-output" && overCanvas) {
    const outputItemId = smeltOutput ? smeltOutput.itemId : null;
    const outputCount = smeltOutput ? smeltOutput.count : 0;

    smeltOutput = null;

    if (outputItemId && typeof dropItemFromSlotIntoWorld === "function") {
      dropItemFromSlotIntoWorld(outputItemId, outputCount);
    }

    if (typeof syncStovePanel === "function") syncStovePanel();

    syncHotbarUI();
  } else if (
    (dragState.source === "smelt-ingredient" ||
      dragState.source === "smelt-fuel") &&
    (overBag || slotIndex || bagPosition !== null)
  ) {
    // BUONG STACK (hindi lang 1) ang inaalis/naibabalik sa bag/hotbar
    // ngayon - tingnan ang removeSmeltItem (stove.js), nagre-refund na
    // ito mismo sa GLOBAL stock (refundToBag=true), kaya pwede na
    // lang direktang i-pin ang buong natanggal na count kung may
    // partikular na target na slotIndex.
    const removed =
      typeof removeSmeltItem === "function"
        ? removeSmeltItem(dragState.smeltSlotType, true)
        : null;

    if (removed && slotIndex && typeof pinCraftItemToSlot === "function") {
      pinCraftItemToSlot(slotIndex, removed.itemId, removed.count);
    }

    syncHotbarUI();
  } else if (
    dragState.source === "smelt-output" &&
    (overBag || slotIndex || bagPosition !== null)
  ) {
    const outputItemId = smeltOutput ? smeltOutput.itemId : null;
    const outputCount = smeltOutput ? smeltOutput.count : 0;

    if (typeof collectSmeltOutput === "function") collectSmeltOutput();

    if (slotIndex && outputItemId && typeof pinCraftItemToSlot === "function") {
      pinCraftItemToSlot(slotIndex, outputItemId, outputCount);
    }

    syncHotbarUI();
  } else if (overBag && isEquipHandSource(dragState.source)) {
    if (dragState.source === "equip-left" && torchEquipped) equipTorch();
    else if (dragState.source === "equip-right") unequipRightHandTool();
    syncHotbarUI();
  } else if (dragState.source === "oldman-buy" && (overBag || slotIndex)) {
    // BILI SA OLDMAN (decor.js) - hindi hawak ng manlalaro ang item na
    // ito bago pa man ito i-drop (galing sa tindahan, hindi sa sariling
    // bag), kaya ang BUY FLOW mismo (popup kung >1 ang kayang bilhin, o
    // direkta kung 1 lang) ang bahalang magbawas ng gold/stock at
    // magdagdag sa bag, base sa pinili ng manlalaro.
    if (typeof startOldManBuyFlow === "function") {
      startOldManBuyFlow(dragState.itemId);
    }
  }

  dragState = null;
});

// --- PAGBUHAT MULA SA LEFT/RIGHT HAND (equipment panel) ---
//
// Left hand: puwede lang i-drag PALABAS kapag torch ang laman (tingnan
// ang syncEquipmentPanel) - ang "mirror ng selectedInventorySlot" na
// laman ay hindi na kailangan pang i-drag dito, i-drag na lang mula sa
// mismong hotbar slot. Right hand: puwedeng i-drag palabas ang
// kasalukuyang naka-equip na working tool - i-unequip lang ito.

document
  .getElementById("equip-slot-lefthand")
  ?.addEventListener("pointerdown", (event) => {
    if (!torchEquipped) return;

    dragState = {
      source: "equip-left",
      itemId: "torch",
      fromSlotIndex: null,
      startX: event.clientX,
      startY: event.clientY,
      // LUMANG paraan (dragGhostEl, hindi floatingPickup) - agad na
      // "activated" (walang threshold-gating tulad ng "HOLD-DRAG SPLIT
      // STACK" - kung hindi, palaging matuturing na "click lang" sa
      // pointerup, kahit totoong drag - tingnan ang "usesFloatEconomy".
      activated: true,
    };

    dragGhostEl = document.createElement("div");
    dragGhostEl.id = "hotbar-drag-ghost";
    dragGhostEl.innerHTML = '<span class="hotbar-icon">🔦</span>';
    document.body.appendChild(dragGhostEl);
    moveDragGhost(event.clientX, event.clientY);

    event.preventDefault();
  });

document
  .getElementById("equip-slot-righthand")
  ?.addEventListener("pointerdown", (event) => {
    const activeTool = EQUIP_RIGHT_HAND_ICON_BY_TOOL.find((entry) =>
      entry.equipped(),
    );

    if (!activeTool) return;

    dragState = {
      source: "equip-right",
      itemId: null,
      fromSlotIndex: null,
      startX: event.clientX,
      startY: event.clientY,
      activated: true, // tingnan ang paliwanag sa equip-slot-lefthand sa itaas
    };

    dragGhostEl = document.createElement("div");
    dragGhostEl.id = "hotbar-drag-ghost";
    dragGhostEl.innerHTML = activeTool.iconHTML();
    document.body.appendChild(dragGhostEl);
    moveDragGhost(event.clientX, event.clientY);

    event.preventDefault();
  });

// Double-click - dagdag na paraan (bukod sa pag-drag pabalik sa bag)
// para talagang i-DEQUIP ang laman ng left/right hand.
document
  .getElementById("equip-slot-lefthand")
  ?.addEventListener("dblclick", () => {
    if (torchEquipped) equipTorch();
    syncHotbarUI();
  });

document
  .getElementById("equip-slot-righthand")
  ?.addEventListener("dblclick", () => {
    unequipRightHandTool();
    syncHotbarUI();
  });

// BAGO (hiling ng user): "kapag left click sa bag is unuse yung label" -
// ang #equip-slot-bag (dating "gauntlet-left") ay nagiging bag icon
// kapag naka-suot (tingnan ang syncEquipmentPanel sa itaas) - LEFT-
// CLICK dito habang nakikita ang bag ay nag-uunequip (bumabalik sa
// dating 🎒 placeholder). Walang epekto ang click na ito kapag hindi
// naman naka-suot ang bag.
// AYOS (hiling ng user): "nandun na rin yung rightclick yung unuse/
// drop mapupunta sa inventory" - kaparehong-pareho ng "Use"/"Drop" na
// popup sa loob ng bag/inventory (itaas) - ngayon RIGHT-CLICK (hindi
// na left-click) ang nagpapalabas ng popup ("Unuse"/"Drop") DITO SA
// MISMONG equip slot habang naka-suot ang bag. "Unuse" = unequipBag()
// (babalik sa inventory, buo pa rin ang bagCollected). "Drop" =
// placeBagInWorld() (lalabas sa mundo, mababawasan ang stock).
//
// AYOS (bug fix): dating NAKA-ATTACH ito nang DIREKTA sa element mismo
// (#equip-slot-bag.addEventListener) - PERO may HIWALAY na document-
// level na "isara kapag may pointerdown SA LABAS ng menu" (itaas,
// bagActionMenuEl). Dahil sa PAGKAKASUNOD-SUNOD ng DOM bubbling (target
// element muna, saka pa lang document sa dulo), ang element-specific
// listener na ito (nagbubukas ng menu) ay UNANG tumatakbo, TAPOS
// bumubula papunta sa document - kung saan AGAD itong isinasara ng
// "outside click" checker (dahil ang menu, na bagong-bago pa lang
// nagawa, ay HINDI naman "nasa loob" ng element na ito - hiwalay na
// child ito ng <body>) - PAREHONG event cycle pa lang, "nabubukas"
// tapos "agad nasasara" - kaya parang WALANG NANGYAYARI sa paningin.
// Inilipat na ito papunta sa PAREHONG document-level na pointerdown
// listener (sa ibaba, kasabay ng "bag" sa inventory) - doon, dahil
// PAREHONG naka-DOCUMENT level ang menu-opener AT ang outside-closer,
// ang PAGKAKASUNOD-SUNOD ng PAGKAKA-REGISTER (hindi ng DOM bubbling)
// ang bahalang sumunod - naka-ayos na ito (outside-closer muna
// nakalagay sa itaas ng file, bago pa man ang menu-opener) kaya walang
// self-close na problema.
document
  .getElementById("equip-slot-bag")
  ?.addEventListener("contextmenu", (event) => event.preventDefault());

// Permanenteng pagtanggal ng isang item (tingnan ang "#bag-trash" sa
// itaas) - hindi tulad ng pagtapon sa canvas (dropItemFromSlotIntoWorld),
// na inilalapag pa rin ang item bilang fisikal na bagay sa mundo (kaya
// puwede pang mabawi). Dito, zinero na agad ang aktwal na bilang - talaga
// nang nawawala.
function deleteItem(itemId) {
  if (itemId === "wood") woodCollected = 0;
  else if (itemId === "stone") stoneCollected = 0;
  else if (itemId === "carrot") carrotsCollected = 0;
  else if (itemId === "gold") goldCollected = 0;
  else if (itemId === "torch") {
    if (torchEquipped) equipTorch(); // i-unequip muna
    torchesCollected = 0;
  } else if (itemId === "pickaxe") pickaxeInInventory = false;
  else if (itemId === "rake") rakeInInventory = false;
  else if (itemId === "axe") axeInInventory = false;
}

// Alin sa mga item ang "equipable" - torch lang talaga (left hand). Ang
// carrot dati ay "equipable" din (right hand, bilang binhi) - ngayon,
// gold-highlight/selection na lang ng hotbar slot mismo (selectedInventorySlot)
// ang bumabalangkas kung "handa nang itanim" - tingnan ang
// isCarrotSlotSelected sa dig.js. "Farmable" na lang ang wood/stone
// (galing sa puno/bato) - hindi sila "equipable", basta draggable/
// pin-able lang sila sa hotbar row, walang ibang gawi.
const DOUBLE_CLICK_EQUIPABLE_ITEMS = new Set([
  "torch",
  "carrot",
  "pickaxe",
  "rake",
  "axe",
  "cutter",
]);

// Tinatawag mula sa dblclick listener ng bag item (buildBagItemSlot) O
// ng isang hotbar slot (renderEmptyInventorySlots) - dagdag na paraan
// ito sa pag-equip, bukod sa pag-drag (papunta sa left hand para sa
// torch - tingnan ang "TORCH SA LEFT HAND" sa pointerup listener sa
// itaas). fromSlotIndex - opsyonal, kung saang numbered slot galing.
function equipViaDoubleClick(itemId, fromSlotIndex) {
  if (!DOUBLE_CLICK_EQUIPABLE_ITEMS.has(itemId)) return;

  if (itemId === "torch") {
    if (!torchEquipped) equipTorch();

    // Aalisin sa slot - nasa left hand na ito, hindi na kailangang
    // doblehin.
    if (fromSlotIndex) {
      delete pinnedSlots[fromSlotIndex];
      delete pinnedSlotCounts[fromSlotIndex];
    }
  } else if (itemId === "pickaxe" || itemId === "rake" || itemId === "axe" || itemId === "cutter") {
    // "I-INSTALL" papunta sa tool radial (bagong hiling - dating
    // agad na "Unlocked"/equippable ang isang pickaxe/rake/axe sa
    // sandaling ma-drag palabas ng crafting output; ngayon, dalawang
    // yugto na ito): (1) tinatanggal sa bag (InInventory → false, kaya
    // "mawawala" ito sa inventory - getCount() → 0 - tingnan ang
    // BAG_ITEMS sa itaas), (2) minamarkahang "Unlocked" (permanenteng
    // available/equippable na sa tool radial mula ngayon), (3)
    // kaagad ding na-eequip sa kamay (kaparehong konsepto ng torch sa
    // itaas - "instant equip" kapag double-click).
    if (itemId === "pickaxe") {
      pickaxeInInventory = false;
      pickaxeUnlocked = true;
      equipPickaxe();
    } else if (itemId === "rake") {
      rakeInInventory = false;
      rakeUnlocked = true;
      equipRake();
    } else if (itemId === "axe") {
      axeInInventory = false;
      axeUnlocked = true;
      equipAxe();
    } else if (itemId === "cutter") {
      if (typeof cutterInInventory !== "undefined") cutterInInventory = false;
      if (typeof cutterUnlocked !== "undefined") cutterUnlocked = true;
      if (typeof equipCutter === "function") equipCutter();
    }

    // Aalisin sa numbered slot (kung naka-pin) - nawala na rin ito sa
    // bag mismo (InInventory → false), kaya walang dapat manatiling
    // nakalagay na reference dito.
    if (fromSlotIndex) {
      delete pinnedSlots[fromSlotIndex];
      delete pinnedSlotCounts[fromSlotIndex];
    }
  } else if (itemId === "carrot") {
    if (carrotsCollected <= 0) return;

    // Mula sa BAG (walang fromSlotIndex) - hanapin muna kung may
    // umiiral nang carrot slot; kung wala, i-pin sa unang bakante -
    // kailangan itong nasa isang numbered slot bago "ma-arm" para sa
    // pagtatanim (tingnan ang isCarrotSlotSelected sa dig.js).
    let targetSlot = fromSlotIndex;

    if (!targetSlot) {
      targetSlot = Number(
        Object.keys(pinnedSlots).find((key) => pinnedSlots[key] === "carrot"),
      );

      if (!targetSlot) {
        pinItemToSlot("carrot");
        targetSlot = Number(
          Object.keys(pinnedSlots).find((key) => pinnedSlots[key] === "carrot"),
        );
      }
    }

    // I-highlight (i-arm) ang slot na ito - dalawang click (pointerdown
    // x2) ang bumubuo sa isang "double click", kaya baka na-toggle nang
    // OFF ang selectedInventorySlot ng PANGALAWANG click bago pa man
    // umabot dito - kaya i-FORCE na lang ang tamang slot dito.
    if (targetSlot) selectedInventorySlot = targetSlot;
  }

  syncHotbarUI();
}

function syncPinnedSlots() {
  for (let i = 1; i <= 9; i++) {
    const slot = document.getElementById("hotbar-slot-" + i);

    if (!slot) continue;

    const itemId = pinnedSlots[i];
    const item = itemId ? BAG_ITEMS.find((entry) => entry.id === itemId) : null;
    // Ang TALAGANG bilang na nasa slot na ito - baka mas mababa kaysa sa
    // TOTAL na stock kung nahati na ito (tingnan ang "ALT + LEFT-CLICK").
    const slotCount = item ? getPinnedSlotEffectiveCount(i, itemId) : 0;

    if (item && slotCount > 0) {
      slot.classList.remove("hotbar-slot-empty");
      // Ang carrot ay sumusunod na lang sa PAREHONG uniform na
      // selectedInventorySlot tulad ng ibang item - hindi na ito
      // "umaalis"/nagko-occupy sa right hand (tingnan ang
      // isCarrotSlotSelected sa dig.js) - kaya laging agad nawawala/
      // lumilipat ang gold highlight kapag may ibang na-click, at ITO
      // MISMONG highlight na ang siyang nagpapatunay kung "handa nang
      // itanim". Ang torch lang ang natitirang special case - naka-
      // highlight pa rin ito habang naka-equip kahit hindi ito ang
      // kasalukuyang naka-select, dahil hiwalay itong "buhay" sa left
      // hand.
      slot.classList.toggle(
        "active",
        i === selectedInventorySlot || (itemId === "torch" && torchEquipped),
      );
      slot.title = EDIBLE_ITEMS[itemId]
        ? getFoodTooltipText(itemId) +
          "\n\ncarrot seed, or right-click to use"
        : itemId === "torch"
          ? item.label + " - double-click to equip"
          : item.label;
      slot.innerHTML = "";

      if (item.icon) {
        const img = document.createElement("img");

        img.src = item.icon;
        img.alt = item.label;
        img.className = "hotbar-slot-item-img";
        slot.appendChild(img);
      } else if (item.iconEmoji) {
        const emoji = document.createElement("span");

        emoji.className = "hotbar-icon";
        emoji.textContent = item.iconEmoji;
        slot.appendChild(emoji);
      }

      const badge = document.createElement("span");

      badge.className = "hotbar-badge";
      // Naka-cap sa 99 ang display kada slot (kahit lumagpas pa ang
      // TOTAL na bilang - tingnan ang STACK_DUPLICATE_MIN_COUNT) -
      // doon pumapasok ang "99+" na tinatanggap na pattern sa maraming
      // laro, sa halip na ipakita ang buong totoong bilang sa dalawang
      // magkahiwalay na slot.
      badge.textContent = slotCount > 99 ? "99+" : slotCount;
      slot.appendChild(badge);

      // Cooldown overlay - lightgray na "takip" na unti-unting bumababa
      // (mula sa itaas papuntang ibaba) habang tumatakbo ang 3 segundong
      // EAT_COOLDOWN_MS pagkatapos kumain - lahat ng slot na may food
      // ay sabay na naka-highlight nito (isang GLOBAL na cooldown ang
      // pagkain, hindi per-item), tingnan ang updateEatCooldownVisual.
      if (EDIBLE_ITEMS[itemId]) {
        const cooldown = document.createElement("span");

        cooldown.className = "hotbar-eat-cooldown";
        slot.appendChild(cooldown);
      }
    } else {
      if (itemId) {
        delete pinnedSlots[i]; // naubos ang stock
        delete pinnedSlotCounts[i];
      }

      slot.classList.add("hotbar-slot-empty");
      // Bakanteng slot pero CLICKABLE/selectable pa rin (tingnan ang
      // startPointerAction) - plain WHITE border na lang ang ipinapakita
      // (.hotbar-slot-empty.active sa style.css), hindi ang gold na
      // ginagamit ng mga FILLED na slot - kaya hindi ito basta
      // "clinclear" dito, iisa lang ang selectedInventorySlot state.
      slot.classList.toggle("active", i === selectedInventorySlot);
      slot.title = "Bakante";
      slot.innerHTML = '<span class="hotbar-key">' + i + "</span>";
    }
  }
}

let bagPanelOpen = false;

function toggleBagPanel() {
  bagPanelOpen = !bagPanelOpen;
  syncBagPanel();

  // AYOS (hiling ng user): kasabay/"nakadikit" sa #bag-panel ang
  // craft dock (basic 2x2) AT ang crafter-dock (advanced 3x3) - kaya
  // kapag ISINARA ang bag panel dito (hal. pagpindot ng 'B'/'b' key),
  // TALAGANG "nasasara" na rin ang crafting panel kahit hindi mismo
  // ang close button nito ang pinindot - dapat din itong dumaan sa
  // closeCraftPanel (craft.js) para maibalik/ma-refund ang anumang
  // naiwang laman sa mga pattern slot (kaparehong-pareho ng
  // pinagbatayan na fix sa craft.js - tingnan doon).
  if (
    !bagPanelOpen &&
    typeof craftPanelOpen !== "undefined" &&
    craftPanelOpen &&
    typeof closeCraftPanel === "function"
  ) {
    closeCraftPanel();
  }

  // Ang crafting panel ay kasalukuyang nakikita LANG habang bukas din
  // ang bag (tingnan ang syncCraftPanel) - kailangan itong i-refresh
  // din dito, hindi lang sa syncHotbarUI, dahil ang bag toggle button
  // mismo ay tumatawag lang ng syncBagPanel().
  if (typeof syncCraftPanel === "function") syncCraftPanel();
}

function syncBagPanel() {
  const panel = document.getElementById("bag-panel");

  if (!panel) return;

  panel.classList.toggle("hidden", !bagPanelOpen);
  setHotbarSlotActive("hotbar-slot-bag", bagPanelOpen);

  const goldCountEl = document.getElementById("bag-gold-count");

  if (goldCountEl) goldCountEl.textContent = goldCollected;

  if (!bagPanelOpen) return;

  renderBagGridInto(document.getElementById("bag-panel-grid"));
}

// Ginuguhit ang BUONG 8x15 na bag grid papasok sa "gridEl" na ibinigay -
// HIWALAY na function ito (base ng syncBagPanel) para magamit din ng
// ibang panel na kailangang magpakita/gamitin ang EKSAKTONG parehong
// bag data (hal. #stove-panel-grid - "copy lang ng inventory", tingnan
// ang stove.js) - IISA lang ang pinagmumulan ng datos (resolveBagCellAt),
// magkaiba lang ang mga <div> na pinaglalagyan.
function renderBagGridInto(gridEl) {
  if (!gridEl) return;

  // Palaging buong grid (8 kolum x 15 hanay = 120 slot) ang ipinapakita,
  // hindi lang ang mga item na meron ka - FIXED na ang posisyon ng lahat
  // (tingnan ang "FIXED-POSITION NA BAG GRID" sa itaas): nakalaan ang
  // unang ilang cell (isa kada item type) para sa "master" pool, ang
  // lahat ng iba ay tunay na fixed-position split-stack cell (bunga ng
  // hold-drag na "paghati ng stack" na idinropo dito) o bakanteng
  // placeholder - tingnan ang resolveBagCellAt.
  gridEl.innerHTML = "";

  // AYOS (hiling ng user): "kapag wala pang bag dapat kung ano na yung
  // max slots nandun na pero naka disabled lang" - dating "nagtatago"
  // (hindi ginuguhit) ang mga cell LAMPAS sa kasalukuyang aktibong
  // bilang ng hanay (getActiveBagGridRows) hangga't hindi pa naka-suot
  // ang bag. Ngayon, LAGING BUONG 120 slot (BAG_GRID_ROWS_MAX) ang
  // ginuguhit - ang mga cell na LAMPAS sa aktibong hanay na lang ang
  // may dagdag na klase na "bag-slot-locked" (tingnan ang style.css):
  // makikita pa rin ang mga ito (naka-gray/disabled), pero hindi na
  // magagamit (walang pointer events - elementFromPoint mismo, tingnan
  // ang getDropTargetsAt, ay awtomatiko nang lalampas dito papuntang
  // kung ano man ang nasa likod, kaya hindi rin dito puwedeng mag-drop).
  const activeRows = getActiveBagGridRows();

  for (let i = 0; i < BAG_GRID_COLUMNS * BAG_GRID_ROWS_MAX; i++) {
    const cellInfo = resolveBagCellAt(i);
    let cell;

    if (cellInfo.type === "master")
      cell = buildBagItemSlot(cellInfo.item, cellInfo.displayCount);
    else if (cellInfo.type === "split")
      cell = buildBagSplitStackSlot(cellInfo.index, cellInfo.stack);
    else cell = buildEmptyBagSlot(i);

    // Posisyon nito sa grid (0-based) - ginagamit para malaman kung
    // saang posisyon dinidiretso ang isang lumulutang na hawak habang
    // naka-drag (tingnan ang getDropTargetsAt/pointerup sa itaas).
    cell.dataset.bagPosition = String(i);

    const row = Math.floor(i / BAG_GRID_COLUMNS);

    if (row >= activeRows) {
      cell.classList.add("bag-slot-locked");
      cell.title = "Buy a Backpack from Oldman to use this";
    }

    gridEl.appendChild(cell);
  }
}

// AYOS (hiling ng user): tumatanggap na ngayon ng "displayCount" (mula
// sa resolveBagCellAt - 99 pinakamataas, kahit sa MISMONG master cell
// o sa isa sa mga "overflow" na cell nito) - hindi na basta ang BUONG
// getBagUnassignedCount(item.id) (dating gawi, puwedeng lumagpas sa 99
// at magpakita ng malaking hilaw na numero sa iisang cell lang).
function buildBagItemSlot(item, displayCount) {
  const slot = document.createElement("div");

  slot.className = "bag-item bag-item-plantable";
  slot.title = EDIBLE_ITEMS[item.id]
    ? getFoodTooltipText(item.id) +
      "\n\nclick to highlight, drag to your right hand to plant as a seed, or right-click to use"
    : DOUBLE_CLICK_EQUIPABLE_ITEMS.has(item.id)
      ? item.label +
        " - click/drag to the hotbar, or double-click to equip"
      : item.label + " - click or drag to the hotbar";

  // Ang "active"/gold highlight dito ay PURONG sumusunod na lang sa
  // selectedBagItemId (huling na-click na item sa loob mismo ng bag) -
  // HINDI na dapat kasama pa ang "naka-pin ba sa hotbar" (dating
  // OR-condition dito) - kung hindi, mananatiling "naka-highlight" ang
  // isang item (hal. carrot) kahit hindi na ito ang huling na-click,
  // dahil lang naka-pin pa rin ito sa isang numbered slot.
  if (item.id === selectedBagItemId) {
    slot.classList.add("active");
  }

  slot.addEventListener("pointerdown", (event) =>
    startPointerAction("bag", item.id, event),
  );

  // Pigilan ang OS/browser context menu - Alt+Right-Click na "bawas".
  slot.addEventListener("contextmenu", (event) => event.preventDefault());

  // Double-click - kung "food" (may EDIBLE_ITEMS entry - carrot),
  // KINAKAIN ito agad (parehong cooldown ng Alt+digit - tingnan ang
  // eatItem), HINDI na ito nag-eequip. Kung iba pang "equipable" na item
  // (torch), gaya ng dati - i-eequip.
  slot.addEventListener("dblclick", () => {
    if (EDIBLE_ITEMS[item.id]) {
      eatItem(item.id);
    } else {
      equipViaDoubleClick(item.id, null);
    }
  });

  if (item.icon) {
    const img = document.createElement("img");

    img.src = item.icon;
    img.alt = item.label;

    slot.appendChild(img);
  } else if (item.iconEmoji) {
    const emoji = document.createElement("span");

    emoji.className = "bag-item-emoji";
    emoji.textContent = item.iconEmoji;

    slot.appendChild(emoji);
  }

  const count = document.createElement("span");

  count.className = "bag-item-count";
  // AYOS (hiling ng user): "max 99 item lang each slots" - ang
  // displayCount na ibinigay ng resolveBagCellAt ang ipinapakita dito
  // (naka-cap na sa 99 - kung mas marami pa, doon na ito "kumakalat"
  // sa susunod na cell/cells - tingnan ang computeMasterOverflowSlots),
  // hindi na ang buong/hilaw na getBagUnassignedCount(item.id).
  count.textContent =
    typeof displayCount === "number"
      ? displayCount
      : getBagUnassignedCount(item.id);

  slot.appendChild(count);

  // Ang maliit na hotkey na buton sa kanang-itaas (tingnan ang
  // buildBagHotkeyButton) - dito diretsong napipili kung saang numbered
  // slot (1-9) mapupunta ang item, o maibabalik ito sa inventory.
  slot.appendChild(buildBagHotkeyButton(item.id));

  // Cooldown overlay - kaparehong-pareho ng ginagawa sa mga hotbar slot
  // (syncPinnedSlots) - lightgray na "takip" na unti-unting bumababa
  // habang tumatakbo ang 3 segundong EAT_COOLDOWN_MS, dahil dito rin
  // puwedeng kumain (double-click) - tingnan ang updateEatCooldownVisual.
  if (EDIBLE_ITEMS[item.id]) {
    const cooldown = document.createElement("span");

    cooldown.className = "hotbar-eat-cooldown";
    slot.appendChild(cooldown);
  }

  return slot;
}

// HIWALAY na split-stack cell sa loob ng BAG PANEL mismo (tingnan ang
// bagSplitStacks) - bunga ito ng pag-drop ng isang lumulutang na item
// sa isang bakanteng bag cell habang naka-hawak ang Alt. May sarili
// itong bilang, hiwalay sa MASTER na cell ng parehong item type.
function buildBagSplitStackSlot(index, stack) {
  const item = BAG_ITEMS.find((entry) => entry.id === stack.itemId);

  if (!item) return buildEmptyBagSlot(index); // hindi dapat mangyari

  const slot = document.createElement("div");

  slot.className = "bag-item bag-item-plantable";
  slot.title = EDIBLE_ITEMS[item.id]
    ? getFoodTooltipText(item.id) + "\n\n(hiwalay na split-stack)"
    : item.label + " - hiwalay na split-stack";

  slot.addEventListener("pointerdown", (event) =>
    startPointerAction("bagSplit", index, event),
  );

  slot.addEventListener("contextmenu", (event) => event.preventDefault());

  // Pagkain (kung "food") - tinatanggal dito mismo sa split-stack, hindi
  // sa TOTAL/global count lang, para manatiling tama ang kabuuan.
  slot.addEventListener("dblclick", () => {
    if (!EDIBLE_ITEMS[item.id]) return;

    if (eatItem(item.id)) {
      stack.count--;

      if (stack.count <= 0) delete bagSplitStacks[index];

      syncBagPanel();
    }
  });

  if (item.icon) {
    const img = document.createElement("img");

    img.src = item.icon;
    img.alt = item.label;

    slot.appendChild(img);
  } else if (item.iconEmoji) {
    const emoji = document.createElement("span");

    emoji.className = "bag-item-emoji";
    emoji.textContent = item.iconEmoji;

    slot.appendChild(emoji);
  }

  const count = document.createElement("span");

  count.className = "bag-item-count";
  count.textContent = stack.count > 99 ? "99+" : stack.count;
  slot.appendChild(count);

  if (EDIBLE_ITEMS[item.id]) {
    const cooldown = document.createElement("span");

    cooldown.className = "hotbar-eat-cooldown";
    slot.appendChild(cooldown);
  }

  return slot;
}

// Walang laman - hindi ito "draggable-FROM" (walang item). May DALAWANG
// paraan para makapaglagay dito: (1) i-drop (pointerup) dito ang isang
// AKTIBONG hold-drag - tingnan ang pointerup/moveFloatingToBagPosition
// sa itaas; (2) plain LEFT-CLICK dito habang may STANDALONE na lumulutang
// (right-click "cut", walang hold) - dito lang tayo mismo kailangang
// mag-listen (hindi na kasama sa startPointerAction dahil walang item
// dito na puwedeng "pindutin").
function buildEmptyBagSlot(position) {
  const slot = document.createElement("div");

  slot.className = "bag-item bag-item-empty";

  slot.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (!floatingPickup || (dragState && dragState.activated)) return;

    event.preventDefault();

    moveFloatingToBagPosition(position, floatingPickup.count);

    if (floatingPickup) settleFloatBackToSource();

    syncHotbarUI();
    syncBagPanel();
  });

  slot.addEventListener("contextmenu", (event) => event.preventDefault());

  return slot;
}

document
  .getElementById("hotbar-slot-bag")
  ?.addEventListener("click", () => toggleBagPanel());

document.addEventListener("keydown", (event) => {
  // BUGFIX - huwag buksan ang Bag kapag nagta-type (hal. pangalan ng
  // bahay kay Joseph) - tingnan ang isTypingInTextField sa input.js.
  if (typeof isTypingInTextField === "function" && isTypingInTextField(event)) return;

  if (event.key === "b" || event.key === "B") toggleBagPanel();
});

// =========================
// PAG-DRAG NG BAG PANEL (sa border/header sa taas lang)
// =========================
//
// Bydifault, naka-center ang panel sa gitna ng screen (CSS). Kapag
// hinila mo mula sa header (hindi sa mga elemento na may
// ".panel-no-drag" - hal. isang close button, tingnan sa ibaba),
// sumusunod ito sa mouse - simpleng pointer drag, walang external
// library. Pagkatapos ng unang drag, "naka-pin" na ang posisyon (fixed
// left/top) hanggang sa susunod na drag.

function setupDraggablePanel(panelId, headerId) {
  const panel = document.getElementById(panelId);
  const header = document.getElementById(headerId);

  if (!panel || !header) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("pointerdown", (event) => {
    // Huwag simulan ang drag kapag sa loob ng isang ".panel-no-drag" na
    // elemento (hal. close button) ang pinindot - kung hindi, aagawin
    // ng setPointerCapture sa ibaba ang lahat ng pointer event papunta
    // sa header mismo, kaya hindi na makakarating ang "click" sa
    // aktwal na button (dating bug ito sa #craft-popup-close).
    if (event.target.closest && event.target.closest(".panel-no-drag")) return;

    const rect = panel.getBoundingClientRect();

    dragging = true;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    // Mula rito, left/top na ang gamit (hindi na ang default na
    // center-via-transform), kaya sumusunod agad sa eksaktong posisyon
    // ng mouse nang walang biglaang "jump".
    panel.style.left = rect.left + "px";
    panel.style.top = rect.top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";

    header.setPointerCapture(event.pointerId);
  });

  header.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const maxLeft = window.innerWidth - panel.offsetWidth;
    const maxTop = window.innerHeight - panel.offsetHeight;

    panel.style.left =
      Math.max(0, Math.min(maxLeft, event.clientX - offsetX)) + "px";
    panel.style.top =
      Math.max(0, Math.min(maxTop, event.clientY - offsetY)) + "px";
  });

  header.addEventListener("pointerup", (event) => {
    dragging = false;

    // Kung "panel-no-drag" ang pinindot (tingnan sa itaas), hindi
    // na-capture ang pointer na ito - iiwasan dito ang exception mula sa
    // pag-release ng hindi naman na-capture.
    if (header.hasPointerCapture(event.pointerId)) {
      header.releasePointerCapture(event.pointerId);
    }
  });
}

setupDraggablePanel("bag-panel", "bag-panel-header");

// AYOS (hiling ng user): "yung sa bag, crafter, stove lagyan mo ng
// 'x' sa top right ng section nila para na eexit" - bagong close
// button (dating wala, "hilahin lang sa header" bago nito) - parehong
// toggleBagPanel() na tinatawag ng "B" key/bag hotbar slot (kaya
// TALAGANG sarado, kasama na ang crafting panel na "nakadikit" dito -
// tingnan ang paliwanag sa loob ng toggleBagPanel).
document.getElementById("bag-panel-close")?.addEventListener("click", () => {
  if (bagPanelOpen) toggleBagPanel();
});
setupDraggablePanel("stove-panel", "stove-panel-header");
setupDraggablePanel("oldman-shop-panel", "oldman-shop-panel-header");

syncHotbarUI();
