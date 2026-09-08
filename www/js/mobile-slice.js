// =========================
// MOBILE "TAP TO ACT" (hiling ng user)
// =========================
//
// AYOS (BAGO, hiling ng user: "sa mobile version wala ng press hold
// na mangyayari ah pag click na lang sa mismong item sa lahat...
// same mo sa torch sa iba pa na may lilitaw na label... pero dun sa
// woods, stone is meron din pero throw lang meron at pwede rin
// malipat kahit saan stay tayo kung anung meron ngayon ang papalitan
// lang is yung sa wood at stone na pag pindot may lilitaw din na pop
// up na throw at slice basta lahat ng item na may quantity meron
// slice lagi") - dating LONG-PRESS (~480ms, walang malaking galaw)
// pa ang kailangan bago lumabas ang popup ng bag/holdable/torch/food,
// AT hiwalay pa ang paraan ng "paglipat sa ibang slot" (basta i-drag,
// o kaya i-long-press din para sa "Slice" lang) - dalawang HIWALAY na
// interaksyon, magkaibang response time. TINANGGAL na ngayon ang
// buong long-press timer - lahat ay nangyayari na sa ISANG MAIKLING
// TAP/CLICK LANG (walang paghintay), PAREHO anuman ang item:
//
//   1. TAP sa isang naka-fill na hotbar slot/bag cell - AGAD na
//      "binubuhat"/in-a-ARM ang BUONG stack papunta sa floatingPickup
//      (parehong estado ng normal na hold-drag, hotbar.js) - kaya
//      PWEDE na itong I-TAP sa kahit anong ibang slot para roon
//      ILIPAT/mag-SWAP (EXISTING na mekanismo, startPointerAction sa
//      hotbar.js - walang binago doon) - "stay muna tayo kung anong
//      meron ngayon" (hiling ng user) para dito.
//   2. SABAY-SABAY, may lumalabas ding maliit na popup menu (reuse ng
//      showBagActionMenu, hotbar.js) na may mga KARAGDAGANG aksyon
//      depende sa uri ng item (buildMobileItemActions sa ibaba):
//        - "bag"                    -> Use / Drop
//        - holdable (crafter/stove/
//          light/bed)                -> Hold(/Unhold) / Throw / Drop
//        - torch                     -> Use(/Unequip) / Drop
//        - pagkain (EDIBLE_ITEMS)    -> Use
//        - KAHIT ANO PANG generic
//          na may dami (wood/stone,
//          atbp.)                    -> Throw / Slice (LAGING dalawa
//                                       ito - hiling ng user: "basta
//                                       lahat ng item na may quantity
//                                       meron slice lagi")
//   3. Kung PINILI ng manlalaro ang isa sa mga buton ng popup - dahil
//      NAKA-ARM/nakabuhat na ang buong stack (#1 sa itaas), IBINABALIK
//      muna ito sa TALAGANG pinagmulan (settleFloatBackToSource,
//      hotbar.js) bago talaga isagawa ang piniling aksyon (Use/Hold/
//      Throw/Drop/Slice) - kaya gumagana ang MISMONG parehong
//      function (holdItem/throwItem/dropItem/equipTorch/eatItem/
//      openMobileSliceQtyPopup) nang hindi na kailangang baguhin, gaya
//      pa rin ng dating "source-based" na paraan nila.
//   4. Kung sa halip, TINAP ng manlalaro ang IBANG slot (hindi ang
//      popup) - awtomatiko na lang itong lumilipat/nag-sswap doon
//      (EXISTING na mekanismo, #1), at nasasarhan na rin ang popup
//      (existing na "outside click closer", hotbar.js).
//
// Ang "Slice" (paghihiwalay ng piling bilang lang, hindi ang buong
// stack) ay bukas pa rin gamit ang parehong #mobile-slice-qty-popup
// (parehong itsura/estilo ng #oldman-sell-qty-popup).

let mobileSliceState = null; // { source, itemId, maxCount }
let lastMobileLongPressX = 0; // "huling na-tap na posisyon" (pangalan lang natira, ginagamit pa rin ng sliceStackIntoFloat)
let lastMobileLongPressY = 0;

// Ang TALAGANG bilang na "puwedeng makuha" mula sa isang "source" -
// dispatcher lang papunta sa tatlong existing helper (hotbar.js),
// magkakaparehong ginagamit ng cutOneIntoFloat/grabWholeStackIntoFloat.
function getAvailableCountForMobileSlice(source, itemId) {
  if (source.type === "bag") return getBagUnassignedCount(itemId);
  if (source.type === "bagSplit") return getBagSplitStackCount(source.index);

  return getPinnedSlotEffectiveCount(source.slot, itemId);
}

// Tinatawag mula sa hotbar.js (pointerup, MAIKLING TAP - hindi drag)
// kapag TOUCH device, para sa ISANG naka-fill na slot/bag cell. Ito
// ang PANGUNAHING entry point ng buong bagong sistema (tingnan ang
// paliwanag sa itaas ng file). Ibinabalik ang true kung na-arm
// (grabbed) ang item, false kung wala (hal. 0 na ang available).
function handleMobileItemTap(source, itemId, x, y) {
  if (!itemId) return false;
  if (typeof grabWholeStackIntoFloat !== "function") return false;

  const grabbed = grabWholeStackIntoFloat(source, itemId);

  if (!grabbed) return false;

  lastMobileLongPressX = x;
  lastMobileLongPressY = y;

  // AYOS (BUG FIX): dating naka-default sa "left:0; top:0" (itaas-
  // kaliwang sulok) ang ghost icon hanggang sa may susunod na
  // pointermove - wala nito pagkatapos ng isang MAIKLING TAP (agad
  // nakabitaw ang daliri) - kaya "lumilipad" papuntang sulok ang icon
  // sa halip na manatili malapit sa TALAGANG na-tap na posisyon.
  if (typeof moveFloatingGhost === "function") moveFloatingGhost(x, y);

  const actions = buildMobileItemActions(source, itemId);

  if (actions.length > 0 && typeof showBagActionMenu === "function") {
    showBagActionMenu(x, y, actions);
  }

  return true;
}

// Binabalot ang isang popup action - IBINABALIK muna sa TALAGANG
// pinagmulan (settleFloatBackToSource) ang naka-arm na stack BAGO
// isagawa ang "fn" (ang TALAGANG action - Use/Hold/Throw/Drop/Slice) -
// kaya gumagana ang parehong EXISTING/source-based na function nito
// nang walang binago, PAREHONG resulta ng dating desktop right-click
// na paraan.
function withSettledSource(fn) {
  return () => {
    if (typeof settleFloatBackToSource === "function") settleFloatBackToSource();
    fn();
  };
}

// "Special-case chain" ng mga item na may sariling popup - "bag" ->
// Use/Drop; holdable (crafter/stove/light/bed) -> Hold/Throw/Drop;
// torch -> Use/Drop; food (EDIBLE_ITEMS) -> Use; KAHIT ANO PANG
// generic na may dami -> Throw/Slice (LAGING dalawa, hiling ng user).
function buildMobileItemActions(source, itemId) {
  if (itemId === "bag") {
    return [
      { label: "Use", onClick: withSettledSource(() => useBagEquip()) },
      { label: "Drop", onClick: withSettledSource(() => dropBagFromInventory()) },
    ];
  }

  if (
    typeof HOLDABLE_ITEM_IDS !== "undefined" &&
    HOLDABLE_ITEM_IDS.includes(itemId)
  ) {
    const alreadyHeld = typeof heldItemId !== "undefined" && heldItemId === itemId;

    return [
      alreadyHeld
        ? { label: "Unhold", onClick: withSettledSource(() => unholdItem()) }
        : { label: "Hold", onClick: withSettledSource(() => holdItem(itemId)) },
      // Magkaiba ang Throw (2 tile, parang itinapon) sa Drop (1 tile,
      // mahinahong nilapag, dropItem sa hold.js) - hiling ng user.
      { label: "Throw", onClick: withSettledSource(() => throwItem(itemId)) },
      { label: "Drop", onClick: withSettledSource(() => dropItem(itemId)) },
    ];
  }

  if (itemId === "torch") {
    const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;

    return [
      {
        label: torchOn ? "Unequip" : "Use",
        onClick: withSettledSource(() => {
          if (typeof equipTorch === "function") equipTorch();
        }),
      },
      {
        label: "Drop",
        onClick: withSettledSource(() =>
          dropWholeStackFromSourceToWorld(source, itemId),
        ),
      },
    ];
  }

  if (typeof EDIBLE_ITEMS !== "undefined" && EDIBLE_ITEMS[itemId]) {
    return [{ label: "Use", onClick: withSettledSource(() => eatItem(itemId)) }];
  }

  // Generic na item (wood/stone/atbp.) - LAGING Throw + Slice (hiling
  // ng user: "basta lahat ng item na may quantity meron slice lagi").
  return [
    {
      label: "Throw",
      onClick: withSettledSource(() =>
        throwWholeStackFromSourceToWorld(source, itemId),
      ),
    },
    {
      label: "Slice",
      onClick: withSettledSource(() => {
        const available = getAvailableCountForMobileSlice(source, itemId);

        if (available > 0) openMobileSliceQtyPopup(source, itemId, available);
      }),
    },
  ];
}

// Parehong konsepto ng dropWholeStackFromSourceToWorld (ibaba) - PERO
// "itinatapon" (2 tile sa harap, getThrowTargetTile - hold.js) sa
// halip na "inilalapag lang" (1 tile) - para sa GENERIC na item
// (wood/stone/atbp., hindi lang sa HOLDABLE_ITEM_IDS).
function throwWholeStackFromSourceToWorld(source, itemId) {
  const available = getAvailableCountForMobileSlice(source, itemId);

  if (available <= 0) return;

  if (source.type === "slot") {
    delete pinnedSlots[source.slot];
    delete pinnedSlotCounts[source.slot];
  } else if (source.type === "bagSplit") {
    delete bagSplitStacks[source.index];
  }

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, -available);
  }

  const tile =
    typeof getThrowTargetTile === "function" ? getThrowTargetTile() : null;

  if (tile && typeof spawnGroundItem === "function") {
    spawnGroundItem(tile.col, tile.row, itemId, available);
  } else if (typeof dropItemFromSlotIntoWorld === "function") {
    dropItemFromSlotIntoWorld(itemId, available); // fallback lang
  }

  if (typeof playPutSfx === "function") playPutSfx();
  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();
}

// BAGO (hiling ng user, kasama ng "Use"/"Drop" na menu ng torch sa
// itaas) - inaalis ang BUONG available na bilang ng "itemId" mula sa
// eksaktong "source" nito (hotbar slot o bag split-stack - PAREHONG
// paraan ng grabWholeStackIntoFloat, hotbar.js), TAPOS itinatapon ito
// bilang isang ordinaryong FLOATING ground item sa harap ng player
// (dropItemFromSlotIntoWorld, ground-items.js) - hindi na ito
// nagiging floatingPickup muna, direkta nang "nahuhulog" sa lupa,
// PAREHONG resulta ng pag-drag ng buong hawak papunta sa mundo
// (canvas).
function dropWholeStackFromSourceToWorld(source, itemId) {
  const available = getAvailableCountForMobileSlice(source, itemId);

  if (available <= 0) return;

  if (source.type === "slot") {
    delete pinnedSlots[source.slot];
    delete pinnedSlotCounts[source.slot];
  } else if (source.type === "bagSplit") {
    delete bagSplitStacks[source.index];
  }

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(itemId, -available);
  }

  if (typeof dropItemFromSlotIntoWorld === "function") {
    dropItemFromSlotIntoWorld(itemId, available);
  }

  // PAREHONG dahilan/gawi ng pagtapon sa basura (hotbar.js, overTrash) -
  // kung ITO ang naka-equip na torch AT naubos na ang buong stock,
  // awtomatikong mag-unequip (walang natitirang torch para "sunugin").
  if (
    itemId === "torch" &&
    typeof torchEquipped !== "undefined" &&
    torchEquipped &&
    typeof torchesCollected !== "undefined" &&
    torchesCollected <= 0 &&
    typeof equipTorch === "function"
  ) {
    equipTorch();
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();
}

// =========================
// QUANTITY POPUP (parehong itsura/estilo ng #oldman-sell-qty-popup)
// =========================

function openMobileSliceQtyPopup(source, itemId, maxCount) {
  mobileSliceState = { source, itemId, maxCount };

  const popup = document.getElementById("mobile-slice-qty-popup");

  if (!popup) return;

  const item = BAG_ITEMS.find((entry) => entry.id === itemId);

  const iconEl = document.getElementById("mobile-slice-qty-icon");

  if (iconEl) {
    iconEl.innerHTML =
      item && typeof getItemIconHTML === "function"
        ? getItemIconHTML(item)
        : "";
  }

  const labelEl = document.getElementById("mobile-slice-qty-label");

  if (labelEl) {
    labelEl.textContent =
      "Ilang " + (item ? item.label : "piraso") + " ang ihihiwalay?";
  }

  const input = document.getElementById("mobile-slice-qty-input");

  if (input) {
    input.min = 1;
    input.max = maxCount;
    // Default: BUONG available (parang hold-drag sa desktop) - laging
    // pwede pang bawasan gamit ang "−" o direktang i-type.
    input.value = maxCount;
  }

  popup.classList.remove("hidden");
}

function closeMobileSliceQtyPopup() {
  const popup = document.getElementById("mobile-slice-qty-popup");

  if (popup) popup.classList.add("hidden");

  mobileSliceState = null;
}

function clampMobileSliceQtyInput() {
  const input = document.getElementById("mobile-slice-qty-input");

  if (!input || !mobileSliceState) return 1;

  let value = parseInt(input.value, 10);

  if (!Number.isFinite(value)) value = 1;

  value = Math.max(1, Math.min(value, mobileSliceState.maxCount));
  input.value = value;

  return value;
}

document
  .getElementById("mobile-slice-qty-input")
  ?.addEventListener("input", clampMobileSliceQtyInput);

document
  .getElementById("mobile-slice-qty-minus")
  ?.addEventListener("click", () => {
    const input = document.getElementById("mobile-slice-qty-input");

    if (!input) return;

    input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
  });

document
  .getElementById("mobile-slice-qty-plus")
  ?.addEventListener("click", () => {
    if (!mobileSliceState) return;

    const input = document.getElementById("mobile-slice-qty-input");

    if (!input) return;

    input.value = Math.min(
      mobileSliceState.maxCount,
      (parseInt(input.value, 10) || 1) + 1,
    );
  });

document
  .getElementById("mobile-slice-qty-cancel")
  ?.addEventListener("click", () => {
    closeMobileSliceQtyPopup();
  });

document
  .getElementById("mobile-slice-qty-confirm")
  ?.addEventListener("click", () => {
    if (!mobileSliceState) return;

    const { source, itemId } = mobileSliceState;
    const qty = clampMobileSliceQtyInput();

    closeMobileSliceQtyPopup();
    sliceStackIntoFloat(source, itemId, qty);
  });

// =========================
// ANG TALAGANG PAGHIWALAY (kapareho ng gawi ng cutOneIntoFloat, pero
// "amount" ang binabawas sa ISANG hakbang lang - hindi na kailangang
// tumawag nang paulit-ulit)
// =========================
function sliceStackIntoFloat(source, itemId, count) {
  if (floatingPickup) return false; // may hawak na - hindi dapat mangyari, safety lang

  const available = getAvailableCountForMobileSlice(source, itemId);
  const amount = Math.max(1, Math.min(count, available));

  if (amount <= 0) return false;

  floatingPickup = { itemId, count: 0, source };

  floatingGhostEl = document.createElement("div");
  floatingGhostEl.id = "floating-pickup-ghost";
  document.body.appendChild(floatingGhostEl);

  if (source.type === "slot") {
    pinnedSlotCounts[source.slot] = available - amount;

    if (pinnedSlotCounts[source.slot] <= 0) {
      delete pinnedSlots[source.slot];
      delete pinnedSlotCounts[source.slot];
    }
  } else if (source.type === "bagSplit") {
    bagSplitStacks[source.index].count = available - amount;

    if (bagSplitStacks[source.index].count <= 0) {
      delete bagSplitStacks[source.index];
    }
  }
  // "bag" (master cell) - walang babawasing eksplisito dito: derived
  // value na lang ang master (getBagUnassignedCount), awtomatiko nang
  // bumababa ang ipinapakitang bilang doon dahil binabawas na nito ang
  // floatingPickup.count kapag pareho ang itemId (tingnan ang function
  // na iyon, hotbar.js).

  floatingPickup.count = amount;

  if (typeof updateFloatingGhostContent === "function")
    updateFloatingGhostContent();

  // Ilagay ang ghost sa eksaktong kinaroroonan ng pagkakadiin - walang
  // "hover" sa touchscreen (hindi tulad ng mousemove sa desktop), kaya
  // hindi ito awtomatikong susunod sa daliri hangga't hindi muling
  // hinahawakan - titigil na lang ito roon hanggang sa susunod na tap
  // sa isang target slot (tingnan ang startPointerAction, hotbar.js).
  if (typeof moveFloatingGhost === "function") {
    moveFloatingGhost(lastMobileLongPressX, lastMobileLongPressY);
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();

  return true;
}

// Sundan ng ghost ang DALIRI habang TALAGANG naka-touch pa rin
// (pointermove mula sa touch ay gumagana habang naka-drag ang daliri
// sa screen, kaiba sa mouse na may hover) - dagdag na "quality of
// life" para makita kung saan ito dadalhin bago pa man ibitin/i-tap.
document.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "touch") return;
  if (!floatingGhostEl || !floatingPickup) return;
  if (dragState && dragState.activated) return; // dinadala na ito ng ibang pointermove (hotbar.js)

  if (typeof moveFloatingGhost === "function") {
    moveFloatingGhost(event.clientX, event.clientY);
  }
});
