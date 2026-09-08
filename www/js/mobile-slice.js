// =========================
// MOBILE LONG-PRESS "SLICE STACK" (hiling ng user)
// =========================
//
// Sa DESKTOP, ang paghihiwalay ng ISANG BAHAGI LANG ng isang stack na
// maraming quantity ay ginagawa sa pamamagitan ng RIGHT-CLICK (paulit-
// ulit, 1 piraso kada pindot - tingnan ang cutOneIntoFloat/
// grabWholeStackIntoFloat, hotbar.js). Walang right-click sa
// touchscreen, kaya dito idinaragdag ang katumbas na paraan PARA SA
// MOBILE LANG - HINDI ito dapat makaapekto/magbago sa desktop mode
// (hiling ng user: "sa mobile version lang wag mo na baguhin yung
// desktop mode goods").
//
// SINADYANG "event.pointerType === 'touch'" ang GINAGAMIT na
// PANGUNAHING hadlang dito (hindi basta isMobileTouchDevice/media
// query, tingnan ang mobile-controls.js) - mas mahigpit ito:
// GARANTISADONG hindi tatakbo ang buong feature na ito kapag MOUSE
// (kahit sa isang touchscreen na laptop/desktop) ang ginamit - iisang
// TALAGANG TOUCH (daliri) lang ang magpapasimula nito.
//
// ANG BUONG DALOY (kaparehong-pareho ng hiling ng user):
//   1. TOUCH-AND-HOLD (long-press, ~480ms, walang malaking galaw) sa
//      isang hotbar slot (1-9) o bag cell (master/split) na may laman.
//   2. Lumalabas ang isang munting menu malapit sa dinantayan (reuse
//      ng showBagActionMenu, hotbar.js) - PAREHONG special case ng
//      desktop right-click (bag -> Use/Drop; holdable -> Hold/Throw;
//      food -> Use). Para sa GENERIC na item na may HIGIT SA 1 piraso,
//      "Slice" ang lumalabas (BAGO, hindi taglay ng desktop dahil doon
//      diretso nang "cutOneIntoFloat" ang isang right-click).
//   3. Pag-tap ng "Slice" - bukas ang #mobile-slice-qty-popup (parehong
//      itsura/estilo ng #oldman-sell-qty-popup - ito mismo ang
//      tinutukoy ng user bilang "parang sa oldman na magbebenta ka
//      ganun itsura"): may icon/label ng item, may bilang (number
//      input), may −/+ na buton (bawas/dagdag ng 1), at may
//      Confirm/Cancel sa ibaba.
//   4. Pag-Confirm - LUMULUTANG na ang NAPILING bilang lang
//      (floatingPickup, hotbar.js - PAREHONG estado na ginagamit ng
//      desktop) - PWEDE na itong I-TAP sa ibang slot/bag cell para
//      roon ilipat (parehong startPointerAction/pointerdown listener
//      sa hotbar.js ang bahalang tumanggap nito, gumagana na ito
//      kahit saan man nanggaling ang tap, touch man o mouse) - EKSAKTO
//      ang resultang ito sa kung paulit-ulit na na-right-click ang
//      parehong dami sa desktop.
//
// Kung IISA (1) na lang ang available - diretso na lang ang
// cutOneIntoFloat (walang punto pang magpapakita ng popup kung iisa
// lang naman ang mapipili).

const MOBILE_LONG_PRESS_MS = 480;
// AYOS (BUG FIX, hiling ng user: "sa mobile version... pag drag ng
// item sa slots is di maganda, di nadadala ng maayos yung item e
// na-stock") - dating mas MALAKI ang tolerance dito (12px) kaysa sa
// TALAGANG "drag threshold" ng normal na hold-drag sa hotbar.js
// (DRAG_THRESHOLD_PX, 6px) - kaya may maikling agwat (6px-12px) kung
// saan AKTIBO na ang normal na drag (floatingPickup na gumagalaw)
// PERO HINDI pa na-kansela ang timer na ito. Sa KARANIWAN, hindi
// dulot nito ng aktwal na sira dahil may sarili nang guard ang
// triggerMobileLongPressSlice (floatingPickup check sa ibaba) - PERO
// kung MABAGAL/MAINGAT ang paggalaw ng daliri (karaniwan kapag
// tinatarget ang isang maliit na 40px na slot), posibleng manatili
// pa ring MAS MABABA sa 6px ang TOTAL na galaw sa loob ng buong
// 480ms - sa kasong iyon, "nauunahan" ng long-press timer ang
// TALAGANG pagsisimula ng drag (na-kakansela pa ang dragState nito,
// tingnan ang triggerMobileLongPressSlice), kaya parang "nawawala"/
// "hindi nadadala nang maayos" ang item. Itinutugma na ngayon ang
// tolerance dito sa parehong 6px (hindi na basta 12) para KAAGAD
// na-kakansela ang pending long-press sa SANDALING may sapat nang
// galaw para maituring itong drag (parehong pamantayan ng hotbar.js).
const MOBILE_LONG_PRESS_MOVE_TOLERANCE_PX =
  typeof DRAG_THRESHOLD_PX !== "undefined" ? DRAG_THRESHOLD_PX : 6;

let mobileLongPressTimer = null;
let mobileLongPressStart = null; // { x, y, pointerId }
let mobileSliceState = null; // { source, itemId, maxCount }
let lastMobileLongPressX = 0;
let lastMobileLongPressY = 0;

function clearMobileLongPressTimer() {
  if (mobileLongPressTimer) {
    clearTimeout(mobileLongPressTimer);
    mobileLongPressTimer = null;
  }

  mobileLongPressStart = null;
}

// Hotbar slot (1-9) o bag cell (master/split, kasama ang stove panel
// na gumagamit ng parehong bag data) - tingnan ang getDropTargetsAt
// (hotbar.js) para sa parehong listahan ng "sliceable surfaces".
function isMobileSliceSurfaceEl(el) {
  return (
    el &&
    el.closest &&
    (el.closest('[id^="hotbar-slot-"]') ||
      el.closest("#bag-panel-grid > [data-bag-position]") ||
      el.closest("#stove-panel-grid > [data-bag-position]"))
  );
}

// AYOS (BAGO, hiling ng user: "ganun pa rin yung bug sa pag drag ng
// item papuntang slots... kapag naman pindot ko ng slot mag highlight
// yung slots niya sa inventory tapos pipindutin ko lang yung kahit
// anung slot is mapupunta na siya dun... kung meron naman mga laman
// yung slots na yun mag swap lang sila ng pwesto") - tinatawag mula sa
// hotbar.js (pointerup, MAIKLING TAP lang - hindi drag) kapag TOUCH
// device. Kung may sariling popup ang item (bag/holdable/torch/food) -
// ipinapakita iyon (showMobileItemActionMenu, itaas). Kung generic na
// resource (wood/stone/atbp.) - "binubuhat"/in-a-ARM ang BUONG stack
// papunta sa floatingPickup (grabWholeStackIntoFloat, hotbar.js) - ang
// SUSUNOD na tap sa kahit anong ibang slot ay awtomatiko nang
// naglalagay/nag-sswap (EXISTING na mekanismo, startPointerAction).
// Ibinabalik ang true kung may nangyaring aksyon (menu o naka-arm na),
// false kung wala (hal. walang available na stock).
function handleMobileGenericItemTap(source, itemId, x, y) {
  if (!itemId) return false;

  const target = { source, itemId };

  if (showMobileItemActionMenu(target, x, y)) return true;

  if (typeof grabWholeStackIntoFloat !== "function") return false;

  const grabbed = grabWholeStackIntoFloat(source, itemId);

  // AYOS (BUG FIX): dating naka-default sa "left:0; top:0" (itaas-
  // kaliwang sulok) ang ghost icon hanggang sa may susunod na
  // pointermove (walang nangyayari nito pagkatapos ng isang MAIKLING
  // TAP - nakabitaw na agad ang daliri) - kaya biglang "lumilipad"
  // papuntang sulok ang icon sa halip na manatili malapit sa
  // TALAGANG na-tap na posisyon. Itinatakda na dito agad ang tamang
  // posisyon (ang mismong x/y ng tap).
  if (grabbed && typeof moveFloatingGhost === "function") {
    moveFloatingGhost(x, y);
  }

  return grabbed;
}

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  if (!isMobileSliceSurfaceEl(event.target)) return;

  mobileLongPressStart = {
    x: event.clientX,
    y: event.clientY,
    pointerId: event.pointerId,
  };

  mobileLongPressTimer = setTimeout(() => {
    mobileLongPressTimer = null;

    // AYOS (BUG FIX): huling pagsuri (safety net) bago talaga ipakita
    // ang Slice menu - kung sakaling naumpisahan na (`dragState`,
    // hotbar.js) at TALAGANG naka-activate na (floatingPickup) ang
    // isang normal na drag sa mismong sandaling ito (hal. race sa
    // pagitan ng setTimeout at pointermove), huwag nang ituloy - ang
    // triggerMobileLongPressSlice mismo ang may sariling guard din
    // dito, pero sinusuri na rin agad dito para hindi na kailanganing
    // kanselahin pa ang dragState sa loob nito kung hindi na kailangan.
    if (
      mobileLongPressStart &&
      !(typeof floatingPickup !== "undefined" && floatingPickup)
    ) {
      triggerMobileLongPressSlice(
        mobileLongPressStart.x,
        mobileLongPressStart.y,
      );
    }

    mobileLongPressStart = null;
  }, MOBILE_LONG_PRESS_MS);
});

// Kanselahin ang pending long-press kapag lumagpas na sa tolerance ang
// galaw ng daliri (ituturing na drag/swipe, hindi hold) - o kapag
// binitawan/na-cancel na ang touch bago pa man umabot ang timer.
document.addEventListener("pointermove", (event) => {
  if (!mobileLongPressStart || event.pointerId !== mobileLongPressStart.pointerId)
    return;

  const moved = Math.hypot(
    event.clientX - mobileLongPressStart.x,
    event.clientY - mobileLongPressStart.y,
  );

  if (moved > MOBILE_LONG_PRESS_MOVE_TOLERANCE_PX) clearMobileLongPressTimer();
});

document.addEventListener("pointerup", clearMobileLongPressTimer);
document.addEventListener("pointercancel", clearMobileLongPressTimer);

// Ang TALAGANG bilang na "puwedeng makuha" mula sa isang "source" -
// dispatcher lang papunta sa tatlong existing helper (hotbar.js),
// magkakaparehong ginagamit ng cutOneIntoFloat/grabWholeStackIntoFloat.
function getAvailableCountForMobileSlice(source, itemId) {
  if (source.type === "bag") return getBagUnassignedCount(itemId);
  if (source.type === "bagSplit") return getBagSplitStackCount(source.index);

  return getPinnedSlotEffectiveCount(source.slot, itemId);
}

function triggerMobileLongPressSlice(x, y) {
  // May lumulutang na (floatingPickup) - hindi na dapat magpakita pa ng
  // bagong menu (kaparehong-pareho ng "dragState" guard sa desktop
  // right-click, hotbar.js) - ang SUSUNOD na tap ay dapat maglagay na
  // lang nito sa kung saan man ito na-diinan (tingnan ang
  // startPointerAction).
  if (typeof floatingPickup !== "undefined" && floatingPickup) return;
  if (typeof resolveTargetSourceAt !== "function") return;

  const target = resolveTargetSourceAt(x, y);

  if (!target) return;

  lastMobileLongPressX = x;
  lastMobileLongPressY = y;

  // KANSELAHIN ang dragState na nagsimula na mula sa pointerdown na ito
  // (startPointerAction, hotbar.js, tumatakbo bago pa man umabot dito)
  // - kung hindi, ang PAGBITAW ng daliri (pointerup) pagkatapos
  // ipakita ang menu ay ituturing pa ring "click" (mag-tto-toggle ng
  // gold-highlight/equip, tingnan ang pointerup listener sa
  // hotbar.js).
  dragState = null;

  // AYOS (BAGO, hiling ng user: "kapag pinindutin ko yung item... may
  // lilitaw popup... kapag naman pindot ko ng slot mag-highlight...
  // tapos pipindutin ko lang yung kahit anung slot is mapupunta na
  // siya dun") - inilipat na ang buong "special-case chain" (bag/
  // holdable/torch/edible -> sariling popup) papunta sa hiwalay na
  // showMobileItemActionMenu (ibaba) - PAREHONG ginagamit ito ng
  // LONG-PRESS dito AT ng BAGONG "maikling tap" na paraan (tingnan ang
  // handleMobileGenericItemTap sa ibaba, tinatawag mula sa hotbar.js)
  // - kaya PAREHONG-PAREHO ang gawi anuman ang RESPONSE TIME ng
  // pagpindot (mabilis man o matagal).
  if (showMobileItemActionMenu(target, x, y)) return;

  const available = getAvailableCountForMobileSlice(
    target.source,
    target.itemId,
  );

  if (available <= 0) return;

  if (available <= 1) {
    // Iisa lang - diretso na lang, parehong resulta kung ano man ang
    // pipiliin sa popup (parehong gawi ng desktop cutOneIntoFloat).
    if (typeof cutOneIntoFloat === "function") {
      cutOneIntoFloat(target.source, target.itemId);
    }

    return;
  }

  showBagActionMenu(x, y, [
    {
      label: "Slice",
      onClick: () =>
        openMobileSliceQtyPopup(target.source, target.itemId, available),
    },
  ]);
}

// AYOS (BAGO, hiling ng user) - "special-case chain" ng mga item na
// may SARILING popup menu (hindi basta Slice/cutOneIntoFloat) - "bag"
// -> Use/Drop; holdable (crafter/stove/light/bed) -> Hold/Drop; torch
// -> Use/Drop; food (EDIBLE_ITEMS) -> Use. PAREHONG ginagamit ito ng
// LONG-PRESS (triggerMobileLongPressSlice, itaas) AT ng bagong
// MAIKLING TAP na paraan (handleMobileGenericItemTap, ibaba) - kaya
// magkatulad ang lumalabas na menu kahit gaano man katagal ang
// pagpindot. Ibinabalik ang true kung TALAGANG may ipinakitang popup
// (dapat itigil na ng caller ang sunod na gagawin - Slice/paglipat),
// false kung "generic"/walang sariling menu ang item na ito.
function showMobileItemActionMenu(target, x, y) {
  if (target.itemId === "bag" && typeof showBagActionMenu === "function") {
    showBagActionMenu(x, y, [
      { label: "Use", onClick: () => useBagEquip() },
      { label: "Drop", onClick: () => dropBagFromInventory() },
    ]);

    return true;
  }

  if (
    typeof HOLDABLE_ITEM_IDS !== "undefined" &&
    HOLDABLE_ITEM_IDS.includes(target.itemId)
  ) {
    const alreadyHeld =
      typeof heldItemId !== "undefined" && heldItemId === target.itemId;

    showBagActionMenu(x, y, [
      alreadyHeld
        ? { label: "Unhold", onClick: () => unholdItem() }
        : { label: "Hold", onClick: () => holdItem(target.itemId) },
      // AYOS (hiling ng user: "magkaiba ang drop sa throw - yung
      // throw is itatapon ang item, at drop naman ay ilalapag sa
      // sahig") - DALAWANG hiwalay na aksyon (hindi lang isa) - Throw
      // (2 tile, parang itinapon) AT Drop (1 tile, mahinahong nilapag,
      // dropItem sa hold.js).
      { label: "Throw", onClick: () => throwItem(target.itemId) },
      { label: "Drop", onClick: () => dropItem(target.itemId) },
    ]);

    return true;
  }

  // BAGO (hiling ng user: "halimbawa sa torch, may popup na lilitaw
  // use, or drop") - dating WALA pang sariling special case ang torch
  // dito - basta na-uuwi sa generic na "Slice" (kung >1) o direktang
  // cutOneIntoFloat (kung 1 na lang) - kaya walang paraan i-equip ang
  // torch sa left hand gamit ang menu na ito (kailangan pang i-drag
  // papunta mismo sa left-hand slot, mahirap sa mobile). Ngayon, may
  // sarili nang "Use"/"Unequip" + "Drop" na menu ang torch - "Use"
  // (o "Unequip" kung naka-equip na) ay direktang nag-to-toggle ng
  // torchEquipped (kaparehong gawi ng pag-drop sa left-hand slot,
  // walang binabawas sa stock - boolean lang ang equip). "Drop" ay
  // inaalis ang BUONG available na piraso mula sa pinagmulang ito at
  // itinatapon bilang ground item sa harap ng player (tingnan ang
  // dropWholeStackFromSourceToWorld sa ibaba).
  if (target.itemId === "torch" && typeof showBagActionMenu === "function") {
    const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;

    showBagActionMenu(x, y, [
      {
        label: torchOn ? "Unequip" : "Use",
        onClick: () => {
          if (typeof equipTorch === "function") equipTorch();
        },
      },
      {
        label: "Drop",
        onClick: () => dropWholeStackFromSourceToWorld(target.source, target.itemId),
      },
    ]);

    return true;
  }

  if (typeof EDIBLE_ITEMS !== "undefined" && EDIBLE_ITEMS[target.itemId]) {
    showBagActionMenu(x, y, [
      { label: "Use", onClick: () => eatItem(target.itemId) },
    ]);

    return true;
  }

  return false;
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
