// =========================
// TAP-TO-ACT NA POPUP (mouse man o touch) - hiling ng user
// =========================
//
// AYOS (BAGO, hiling ng user: "pag click sa mismong mga item sa
// inventory tumataas kasi yung item e dapat nandun na lang mismo sa
// slot niya di na tataas mag highlights lang... alisin mo na yung mga
// item na draggable di na dapat draggable throw na lang kung sakali") -
// dating "binubuhat"/in-a-ARM (grabWholeStackIntoFloat) muna ang buong
// stack papunta sa isang lumulutang na ghost SA TUWING may tap/click sa
// isang naka-fill na slot (kahit basta makita lang ang mga posibleng
// aksyon) - TALAGANG "tumataas"/lumilipad palayo muna sa slot ang
// item bago pa man piliin ang isang aksyon. Katulad din nito, may
// TALAGANG press-and-drag pa rin noon (mouse) papunta sa ibang slot -
// TALAGANG "draggable". PAREHONG TINANGGAL na ngayon ang dalawang ito
// (tingnan ang mga paliwanag sa pointermove/pointerup, hotbar.js, at
// handleMobileItemTap sa ibaba) - isang MAIKLING TAP/CLICK LANG na
// lang (walang paghintay, walang paggalaw/pagdrag, PAREHO anuman ang
// pointerType) sa isang naka-fill na hotbar slot/bag cell ang:
//
//   1. NANANATILI ang item sa TALAGANG kinaroroonan nito (WALANG
//      "tumataas"/floating) - highlight/selection na lang
//      (setMobileTapSelection sa ibaba, parehong variable na ginagamit
//      na ng ibang bahagi ng UI - selectedInventorySlot/selectedBagItemId).
//   2. SABAY-SABAY, lumalabas ang isang maliit na popup menu
//      (showBagActionMenu) na may mga aksyon depende sa uri ng item
//      (buildMobileItemActions sa ibaba):
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
//      Kung NAKA-EQUIP na ang item na ito (torch/bag) - inilalapit ang
//      popup na ito sa TALAGANG equip slot nito sa PROFILE
//      (getEquipAnchorPosition sa ibaba), hindi sa mismong na-tap na
//      posisyon - mas malinaw na "doon" (profile) mapupunta ang
//      "Unequip"/"Unuse" na aksyon.
//   3. Kung PINILI ng manlalaro ang isa sa mga buton ng popup - direkta
//      na itong isinasagawa sa "source" (walang na-ARM na floatingPickup
//      na kailangan pang "ibalik" muna, kaiba sa dati).
//
// Ang "Slice" (paghihiwalay ng piling bilang lang, hindi ang buong
// stack) ay bukas pa rin gamit ang parehong #mobile-slice-qty-popup
// (parehong itsura/estilo ng #oldman-sell-qty-popup) - DITO pa lang
// (TALAGANG pinili ng manlalaro ang "Slice" sa popup) TALAGANG
// na-a-ARM ang isang floatingPickup, sadya at inaasahan.

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

// Tinatawag mula sa hotbar.js (pointerup, MAIKLING TAP/CLICK - hindi
// drag) para sa ISANG naka-fill na slot/bag cell. Ito ang PANGUNAHING
// entry point ng buong sistemang ito (tingnan ang paliwanag sa itaas
// ng file). Ibinabalik ang true kung may lumabas na popup, false kung
// wala (hal. walang available na aksyon).
//
// AYOS (hiling ng user): "pag click sa mismong mga item sa inventory
// tumataas kasi yung item e dapat nandun na lang mismo sa slot niya di
// na tataas mag highlights lang" - dating AGAD na "binubuhat"/in-a-ARM
// (grabWholeStackIntoFloat) ang BUONG stack papunta sa isang lumulutang
// na ghost DITO, kaya literal na "tumataas"/lumilipad palayo muna sa
// slot ang item habang bukas pa lang ang popup - kahit na basta i-click
// lang ang isang FILLED na slot para MAKITA ang mga posibleng aksyon
// dito (hindi pa talaga pinipili). TINANGGAL na ang buong pag-ARM na
// iyon - NANANATILI na ngayon ang item sa TALAGANG kinaroroonan nito
// (hindi na gumagalaw/tumataas), "highlight"/selection na lang ang
// nangyayari sa pag-tap/click (setMobileTapSelection sa ibaba) - ang
// mga TALAGANG action mismo (Throw/Slice/Use/Hold/Drop, piniling buton
// sa popup) na ang bahalang mag-alis/gumalaw ng item, sa TALAGANG
// pagkakataon na piliin ito - gumagana pa rin sila nang walang binago,
// dahil "source"-based na rin talaga ang mga ito (tingnan ang
// throwWholeStackFromSourceToWorld/dropWholeStackFromSourceToWorld sa
// ibaba - direkta silang tumutukoy sa "source", hindi umaasa sa isang
// paunang floatingPickup).
let lastMobileActionAnchorX = 0;
let lastMobileActionAnchorY = 0;

function handleMobileItemTap(source, itemId, x, y) {
  if (!itemId) return false;

  const actions = buildMobileItemActions(source, itemId);

  if (actions.length === 0) return false;

  // Itinatabi pa rin ang posisyon ng tap na ito - kailangan pa rin ito
  // ng "Slice" (openMobileSliceQtyPopup -> sliceStackIntoFloat sa
  // ibaba) para malaman kung SAAN ilalagay ang floating ghost nito sa
  // sandaling TALAGANG piliin ang aksyong iyon sa popup - HIWALAY ito
  // sa bug na "tumataas ang item sa pag-tap lang" (hindi na nangyayari
  // ito dito, tingnan ang paliwanag sa itaas).
  lastMobileLongPressX = x;
  lastMobileLongPressY = y;

  setMobileTapSelection(source, itemId);

  // AYOS (hiling ng user): "tapos yung sa bag kapag naka equip na
  // dapat na unequip din dun mismo lalabas yung label or pop up sa
  // tabi ng bag sa profile" - kung ITO ang item na kasalukuyang
  // NAKA-EQUIP na (torch sa left hand, bag sa profile) - sa halip na
  // ilagay ang popup sa mismong na-tap/na-click na posisyon (loob ng
  // bag/hotbar), ilalapit na lang ito sa TALAGANG equip slot nito sa
  // PROFILE (getEquipAnchorPosition sa ibaba) - mas malinaw kaya
  // makikitang "doon" (sa profile) talaga mapupunta ang epekto ng
  // "Unequip"/"Unuse" na aksyon sa popup.
  const anchor = getEquipAnchorPosition(itemId) || { x, y };

  // Itinatabi rin ang TALAGANG anchor na ito (hindi na basta ang
  // orihinal na tap position) - ginagamit ng "About" na aksyon
  // (buildMobileItemActions sa ibaba) para lumabas ang info card nito
  // sa PAREHONG lugar kung saan lumabas ang popup ng mga aksyon, kahit
  // "inilapit" pa ito sa profile.
  lastMobileActionAnchorX = anchor.x;
  lastMobileActionAnchorY = anchor.y;

  showBagActionMenu(anchor.x, anchor.y, actions);

  return true;
}

// Ibinabalik ang { x, y } malapit sa TALAGANG equip slot (profile) ng
// itemId na ito, KUNG naka-equip na ito ngayon - `null` kung hindi
// (o walang katumbas na equip slot) - gagamitin na lang dito ang
// TALAGANG na-tap na posisyon sa halip (tingnan ang paggamit sa itaas).
function getEquipAnchorPosition(itemId) {
  let equipSlotId = null;

  if (itemId === "torch" && typeof torchEquipped !== "undefined" && torchEquipped) {
    equipSlotId = "equip-slot-lefthand";
  } else if (itemId === "bag" && typeof bagEquipped !== "undefined" && bagEquipped) {
    equipSlotId = "equip-slot-bag";
  }

  if (!equipSlotId) return null;

  const equipEl = document.getElementById(equipSlotId);

  if (!equipEl) return null;

  const rect = equipEl.getBoundingClientRect();

  return { x: rect.right + 10, y: rect.top + rect.height / 2 };
}

// I-highlight (selection lang, WALANG paggalaw/pag-angat) ang item na
// kasalukuyang na-tap/na-click - reuse ng PAREHONG variable na
// ginagamit na ng ibang bahagi ng UI para sa gold-highlight
// (selectedInventorySlot para sa hotbar slot, selectedBagItemId para
// sa master bag cell) - tingnan ang syncHotbarUI/buildBagItemSlot.
function setMobileTapSelection(source, itemId) {
  if (source.type === "slot") {
    selectedInventorySlot =
      selectedInventorySlot === source.slot ? null : source.slot;
  } else if (source.type === "bag") {
    selectedBagItemId = selectedBagItemId === itemId ? null : itemId;
  }
  // "bagSplit" - walang sariling highlight variable pa (parehong dati) -
  // ang popup mismo (malapit sa na-tap na cell) ang sapat nang
  // indikasyon kung alin ang piniling item dito.

  if (typeof syncHotbarUI === "function") syncHotbarUI();
  if (typeof syncBagPanel === "function") syncBagPanel();
}

// Binabalot ang isang popup action - dating "ibinabalik muna sa
// TALAGANG pinagmulan (settleFloatBackToSource) ang naka-arm na stack
// BAGO isagawa ang TALAGANG action" (kailangan noon dahil AGAD na
// na-ARM/floating ang item sa simula pa lang ng pag-tap, tingnan ang
// paliwanag sa handleMobileItemTap sa itaas) - HINDI na kailangan
// ngayon, dahil HINDI na talaga naiaalis/na-a-ARM ang item hangga't
// hindi pa TALAGANG pinipili ang isang partikular na aksyon dito -
// plain pass-through na lang ito ngayon, iniwan na lang ang pangalan
// para hindi na kailangang baguhin ang buildMobileItemActions sa ibaba.
function withSettledSource(fn) {
  return fn;
}

// "Special-case chain" ng mga item na may sariling popup - "bag" ->
// Use/Drop; holdable (crafter/stove/light/bed) -> Hold/Throw/Drop;
// torch -> Use/Drop; food (EDIBLE_ITEMS) -> Use; KAHIT ANO PANG
// generic na may dami -> Throw/Slice (LAGING dalawa, hiling ng user).
// Mga "handheld tool" na ginagawa sa Crafter (pickaxe/rake/axe/cutter) -
// AYOS (hiling ng user): "yung sa pickaxe wag mo na i auto na mawawala
// at mapunta sa tool-radial gawin na lang is mapunta sa inventory tapos
// may pop up na label din use or throw" - dating direktang "Unlocked"
// (naka-equip agad sa tool radial) ang mga ito sa sandaling makuha sa
// crafting output (collectCraftOutput, craft.js) - ngayon, "InInventory"
// na lang muna (normal na item sa bag/hotbar) - dito na lang, sa
// popup na ito, TALAGANG mag-eequip/mag-i-install sa tool radial
// (equipViaDoubleClick, hotbar.js) kapag pinili ang "Use".
const HANDHELD_TOOL_ITEM_IDS = new Set(["pickaxe", "rake", "axe", "cutter"]);

function buildMobileItemActions(source, itemId) {
  let actions;

  if (itemId === "bag") {
    actions = [
      { label: "Use", onClick: withSettledSource(() => useBagEquip()) },
      { label: "Drop", onClick: withSettledSource(() => dropBagFromInventory()) },
    ];
  } else if (HANDHELD_TOOL_ITEM_IDS.has(itemId)) {
    actions = [
      {
        label: "Use",
        onClick: withSettledSource(() => {
          if (typeof equipViaDoubleClick === "function") {
            equipViaDoubleClick(
              itemId,
              source.type === "slot" ? source.slot : undefined,
            );
          }
        }),
      },
      {
        label: "Throw",
        onClick: withSettledSource(() =>
          throwWholeStackFromSourceToWorld(source, itemId),
        ),
      },
    ];
  } else if (
    typeof HOLDABLE_ITEM_IDS !== "undefined" &&
    HOLDABLE_ITEM_IDS.includes(itemId)
  ) {
    const alreadyHeld = typeof heldItemId !== "undefined" && heldItemId === itemId;

    actions = [
      alreadyHeld
        ? { label: "Unhold", onClick: withSettledSource(() => unholdItem()) }
        : { label: "Hold", onClick: withSettledSource(() => holdItem(itemId)) },
      // Magkaiba ang Throw (2 tile, parang itinapon) sa Drop (1 tile,
      // mahinahong nilapag, dropItem sa hold.js) - hiling ng user.
      { label: "Throw", onClick: withSettledSource(() => throwItem(itemId)) },
      { label: "Drop", onClick: withSettledSource(() => dropItem(itemId)) },
    ];
  } else if (itemId === "torch") {
    const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;

    actions = [
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
  } else if (typeof EDIBLE_ITEMS !== "undefined" && EDIBLE_ITEMS[itemId]) {
    actions = [{ label: "Use", onClick: withSettledSource(() => eatItem(itemId)) }];
  } else {
    // Generic na item (wood/stone/atbp.) - Throw lang ang natitira dito;
    // ang Slice ay IBINABA na sa shared na bahagi (tingnan sa ibaba),
    // dahil hiling ng user na LAHAT na ng item ang may Slice, hindi lang
    // ang mga generic.
    actions = [
      {
        label: "Throw",
        onClick: withSettledSource(() =>
          throwWholeStackFromSourceToWorld(source, itemId),
        ),
      },
    ];
  }

  // =========================
  // SHARED NA MGA AKSYON - nasa DULO ng LAHAT ng uri ng item
  // =========================
  // AYOS (hiling ng user): "sa lahat i apply ang slice kapag marami pero
  // kapag isa lang di lilitaw more than 1 lang tapos lahat ng items
  // kapag click use, slice, hotkey, about yan lalabas" - dating ang
  // GENERIC na item lang (wood/stone) ang may Slice, kaya walang Slice
  // ang carrot at ang iba pang may sariling special-case (food, torch,
  // tools, holdables). Ngayon, iisang lugar na lang ito, kaya
  // AWTOMATIKONG nakukuha ito ng LAHAT.
  //
  // MAHIGPIT ang kondisyon: MAHIGIT SA ISA dapat ang hawak - walang
  // kabuluhan ang "paghahati" ng iisang piraso (wala kang mahahati),
  // kaya itinatago na lang ang buton sa halip na ipakitang walang
  // epekto kapag pinindot.
  const sliceAvailable = getAvailableCountForMobileSlice(source, itemId);

  // =========================
  // "TRANSFER" (BAGO, hiling ng user: "may bug yung sa mobile di na ma
  // punta yung item sa craft or crafter at stove... lagyan na lang din
  // ng label button kapag pindot sa item sa inventory add mo yung
  // transfer pag click is mag highlight tapos lilipat kahit san slot
  // kahit craft, crafter inventory at stove")
  // =========================
  //
  // SANHI ng bug: noong tinanggal ang pagiging "draggable" ng mga item
  // sa inventory (tingnan ang paliwanag sa itaas ng file at ang
  // `usesFloatEconomy` na early-return sa pointermove, hotbar.js),
  // NAWALA rin ang TANGING paraan para makapaglagay ng item sa mga
  // craft input slot at sa Stove - dahil ang mga slot na iyon ay
  // tumatanggap LANG ng isang naka-ARM na `floatingPickup` (tingnan ang
  // pointerdown ng .craft-input-slot sa craft.js at ng .smelt-input-slot
  // sa stove.js). Ang natitirang paraan lang para makapag-ARM ay ang
  // "Slice" - PERO lumalabas lang iyon kapag MAHIGIT SA ISA ang hawak,
  // kaya ang isahang item (hal. isang crafter/stove/kahoy) ay TALAGANG
  // hindi na mailalagay kahit saan sa mobile.
  //
  // Ito ang AYOS: isang "Transfer" na buton na BUONG stack agad ang
  // ina-ARM (walang qty popup, hindi tulad ng Slice) - pagkatapos nito,
  // NAKA-HIGHLIGHT ang LAHAT ng tumatanggap na slot (tingnan ang
  // syncTransferModeUI sa ibaba at ang `body.transfer-mode` sa style.css),
  // at isang TAP na lang sa kahit aling slot (hotbar 1-9, kahit anong
  // cell ng bag/inventory, ang 4 o 9 na craft input ng Crafter, o ang
  // Ingredient/Fuel ng Stove) ang naglilipat doon - lahat ng mga
  // pointerdown handler na iyon ay matagal nang naghihintay ng
  // floatingPickup, kaya walang ibang kailangang baguhin doon.
  if (sliceAvailable > 0) {
    actions.push({
      label: "Transfer",
      onClick: () => {
        const available = getAvailableCountForMobileSlice(source, itemId);

        if (available > 0) startMobileTransfer(source, itemId, available);
      },
    });
  }

  if (sliceAvailable > 1) {
    actions.push({
      label: "Slice",
      onClick: withSettledSource(() => {
        const available = getAvailableCountForMobileSlice(source, itemId);

        if (available > 1) openMobileSliceQtyPopup(source, itemId, available);
      }),
    });
  }

  // AYOS (hiling ng user): "kapag click naman sa item sa hotkey may
  // lilitaw na use, slice, highlight tapos to inventory" - MAGKAIBA na
  // ang huling dalawang buton depende sa KUNG SAAN galing ang item:
  //
  //   - Nasa BAG pa       -> "Hotkey"       (pumili ng slot 1-9)
  //   - Nasa HOTBAR SLOT  -> "Highlight"    (i-arm ito - ito ang
  //                          nagpapahintulot ng pagtatanim ng carrot,
  //                          tingnan ang isCarrotSlotSelected sa dig.js)
  //                       + "To inventory"  (ibalik sa bag)
  if (source.type === "slot") {
    actions.push({
      label: "Highlight",
      onClick: () => {
        selectedInventorySlot = source.slot;
        if (typeof syncHotbarUI === "function") syncHotbarUI();
      },
    });

    actions.push({
      label: "To inventory",
      onClick: () => {
        delete pinnedSlots[source.slot];
        delete pinnedSlotCounts[source.slot];

        if (selectedInventorySlot === source.slot) selectedInventorySlot = null;

        if (typeof syncHotbarUI === "function") syncHotbarUI();
      },
    });
  } else {
    actions.push({
      label: "Hotkey",
      onClick: () => {
        if (typeof openHotkeyPickerAt === "function") {
          openHotkeyPickerAt(itemId, lastMobileActionAnchorX, lastMobileActionAnchorY);
        }
      },
    });
  }

  // AYOS (hiling ng user): "sa lahat ng labels lagyan mo ng about label
  // lagay mo sa pinaka babang list ng pop up lahat ng items lagyan mo
  // niyan" - LAGING idinaragdag DITO SA DULO (huling buton) ng
  // KAHIT ANONG uri ng item ang "About" - nakapaloob dito ang item
  // name/description/sell price (showItemAboutPopup, hotbar.js).
  actions.push({
    label: "About",
    onClick: () => {
      if (typeof showItemAboutPopup === "function") {
        showItemAboutPopup(lastMobileActionAnchorX, lastMobileActionAnchorY, itemId);
      }
    },
  });

  return actions;
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
      "How many " + (item ? item.label : "piece(s)") + " to split off?";
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

// =========================
// "TRANSFER" NA MODE (hiling ng user: "pag click is mag highlight tapos
// lilipat kahit san slot kahit craft, crafter inventory at stove")
// =========================
//
// Ang buong daloy:
//
//   1. I-tap ang item sa inventory/hotbar -> lalabas ang popup ng mga
//      aksyon (handleMobileItemTap sa itaas).
//   2. Pindutin ang "Transfer" -> DITO (startMobileTransfer): ina-ARM
//      ang BUONG hawak bilang isang lumulutang na ghost
//      (sliceStackIntoFloat, parehong-pareho ng ginagamit ng "Slice",
//      buong bilang lang ang ipinapasa) AT bumubukas ang "transfer
//      mode" - naka-highlight ang LAHAT ng tumatanggap na slot, at may
//      lumalabas na maliit na bar sa ibaba ("Tap a slot..." + Cancel).
//   3. I-tap ang kahit aling naka-highlight na slot -> doon lilipat.
//      WALANG bagong handler na kailangan dito: ang hotbar slot
//      (startPointerAction), bag cell (buildBagItemSlot/
//      buildBagSplitStackSlot/buildEmptyBagSlot), craft input
//      (craft.js) at smelt input (stove.js) ay LAHAT may dating
//      pointerdown na naghihintay ng floatingPickup.
//   4. Kapag naubos na ang hawak (o pinindot ang Cancel/Escape),
//      awtomatikong nagsasara ang transfer mode - tingnan ang
//      syncTransferModeUI, tinatawag mula sa clearFloatingPickupState/
//      settleFloatBackToSource (hotbar.js).

let transferCancelBarEl = null;

function startMobileTransfer(source, itemId, available) {
  if (typeof floatingPickup !== "undefined" && floatingPickup) return false;

  if (typeof sliceStackIntoFloat !== "function") return false;

  if (!sliceStackIntoFloat(source, itemId, available)) return false;

  // Itugma ang laki ng lumulutang na ghost sa pinagmulan nito - hindi
  // ito ginagawa ng sliceStackIntoFloat mismo (kaiba sa
  // grabWholeStackIntoFloat/cutOneIntoFloat), kaya "lumalaki" ang icon
  // sa mobile kung hindi itatawag dito (tingnan ang
  // --floating-ghost-scale sa style.css).
  if (typeof applyFloatingGhostScale === "function") {
    applyFloatingGhostScale(source);
  }

  syncTransferModeUI();

  return true;
}

// Binubuksan/isinasara ang transfer mode batay sa TALAGANG estado ng
// floatingPickup - iisang pinagmumulan ng katotohanan, kaya hindi ito
// puwedeng "maiwan" na nakabukas.
//
// Ang highlight mismo ay isang klase sa BODY (hindi sa bawat slot) -
// sadya ito: ang bag grid at ang craft/stove grid ay buong-buong
// muling iginuguhit (innerHTML = "") sa bawat pagbabago, kaya
// mawawala agad ang kahit anong per-element na klase; ang nasa body ay
// hindi apektado at awtomatikong sumasaklaw sa mga bagong cell.
function syncTransferModeUI() {
  const active = typeof floatingPickup !== "undefined" && !!floatingPickup;

  document.body.classList.toggle("transfer-mode", active);

  if (!active) {
    if (transferCancelBarEl) {
      transferCancelBarEl.remove();
      transferCancelBarEl = null;
    }

    return;
  }

  if (transferCancelBarEl) return;

  const bar = document.createElement("div");

  bar.id = "transfer-mode-bar";

  const label = document.createElement("span");

  label.id = "transfer-mode-label";
  label.textContent = "Tap a highlighted slot to move it";
  bar.appendChild(label);

  const cancel = document.createElement("button");

  cancel.type = "button";
  cancel.id = "transfer-mode-cancel";
  cancel.textContent = "Cancel";

  // "pointerdown" (hindi "click") - pareho ng ibang buton ng UI na ito,
  // at para hindi pa maunahan ng ibang pointerdown handler sa document.
  cancel.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof settleFloatBackToSource === "function") {
      settleFloatBackToSource(); // ibinabalik ang lahat sa pinagmulan
    }

    syncTransferModeUI();
  });

  bar.appendChild(cancel);

  document.body.appendChild(bar);
  transferCancelBarEl = bar;
}
