// =========================
// TOOL RADIAL MENU (pickaxe/rake/axe/cutter - hawak-Alt)
// =========================
//
// Kapalit ng dating magkakahiwalay na hotbar slots: hawakan ang "Alt"
// key para lumabas ang isang circular na menu sa gitna ng screen.
// ITUTOK LANG ng mouse (hindi na kailangang i-click) kung saan sa 4 na
// direksyon (bawat 90°, simula sa itaas) papunta ang gustong kasangkapan -
// naka-highlight (gold pie slice) ang direksyon na tinutukan. Bumitaw
// sa "Alt" para KUMPIRMAHIN ang kasalukuyang naka-tutok na opsyon:
//   - isa sa 4 na direksyon (loob ng bilog) -> ie-equip ang kaukulang
//     tool (force-equip, tingnan ang TOOL_RADIAL_EQUIP_BY_DIRECTION).
//   - GITNA (dead zone, napakalapit sa senter) -> "cancel" - walang
//     nagbabago, mananatili ang dati mong naka-equip (kung meron).
//   - LABAS ng bilog (distance > TOOL_RADIAL_OUTER_RADIUS_PX) -> wala
//     kang PINILI kahit ano, kaya ino-UNEQUIP ang kasalukuyang naka-
//     equip na tool (kung meron) - malinaw na "walang gusto" na
//     kilos, hindi lang basta cancel. Tingnan ang clearAllToolEquips()
//     sa dig.js.
// Puwede ring direktang i-click ang isang icon bilang alternatibo.
//
// WALANG "kamay" dito - awtomatiko na ngayon ang pagdampot/pag-ani,
// kahit anong tool ang naka-equip (tingnan ang hasHandActionAt sa
// dig.js). WALANG torch dito - i-drag na lang mula sa bag papunta sa
// left hand ng equipment panel para i-equip ito (tingnan ang hotbar.js).
//
// Ang Alt+1/5 na keyboard shortcuts (dig.js/resources.js) ay gumagana
// pa rin nang hiwalay, gamit din ang Alt key - pero dahil bare "Alt"
// (walang ibang key) ang nagbubukas ng radial na ito, kapag Alt+1/Alt+5
// ang ginamit mo, bubukas pa rin sandali ang radial (Alt keydown muna
// bago ang "1"/"5") - pero dahil hindi gumagalaw ang mouse sa gitnang
// dead zone bago mo bitawan ang Alt, "cancel" lang ang mangyayari dito
// (walang unequip), kaya hindi nagkokonflikto ang dalawang shortcut.

let toolRadialVisible = false;

// Alin sa 4 na direksyon ang kasalukuyang tinutukan ng mouse - null
// kapag nasa GITNANG dead zone (walang mapipili, "cancel"), o ang
// espesyal na value na "outside" kapag LABAS na sa bilog ang tutok
// (walang mapipili RIN, pero dito dapat mag-unequip - tingnan sa itaas).
let toolRadialAimedDirection = null;

const TOOL_RADIAL_DEAD_ZONE_PX = 22;

// Bilang default, kunin na lang ang kalahati ng lapad ng #tool-radial
// panel (tingnan ang style.css - 190px ang lapad nito, kaya ~95px ang
// radius) - kino-compute ito nang live sa mousemove sa halip na i-
// hardcode, para awtomatikong sumunod kahit magbago pa ang laki nito sa
// CSS balang araw.
let toolRadialOuterRadiusPx = 95;

const TOOL_RADIAL_EQUIP_BY_DIRECTION = {
  top: () => equipPickaxe(),
  right: () => equipRake(),
  bottom: () => equipAxe(),
  // BAGO (hiling ng user): "alisin mo na yung hand sa radial tools
  // ipalit mo dun yung cutter" - pinalitan na ang "kamao"/arrow
  // (walang function naman talaga - tingnan ang dating paliwanag sa
  // resources.js) ng cutter dito sa "left" slot ng 4-direction na
  // aim+release na gesture.
  left: () => equipCutter(),
};

const TOOL_RADIAL_ID_BY_DIRECTION = {
  top: "tool-radial-pickaxe",
  right: "tool-radial-rake",
  bottom: "tool-radial-axe",
  left: "tool-radial-cutter",
};

function showToolRadial() {
  if (toolRadialVisible) return;

  toolRadialVisible = true;
  toolRadialAimedDirection = null;
  document.getElementById("tool-radial")?.classList.remove("hidden");
  syncToolRadialAim();
}

function hideToolRadial() {
  if (!toolRadialVisible) return;

  toolRadialVisible = false;
  document.getElementById("tool-radial")?.classList.add("hidden");
}

// Kinukumpirma ang kasalukuyang naka-tutok na direksyon (kung meron) -
// tinatawag sa Alt keyup.
function confirmToolRadialAim() {
  if (toolRadialAimedDirection === "outside") {
    // Wala kang tinutok na anumang tool - malinaw na "walang gusto"
    // kilos ito, kaya inaalis ang kasalukuyang naka-equip (kung meron).
    if (typeof clearAllToolEquips === "function") {
      clearAllToolEquips();
      if (typeof syncHotbarUI === "function") syncHotbarUI();
    }
  } else if (toolRadialAimedDirection) {
    TOOL_RADIAL_EQUIP_BY_DIRECTION[toolRadialAimedDirection]();
  }
  // else: gitnang dead zone (null) - "cancel", walang ginagalaw.

  hideToolRadial();
}

document.addEventListener("keydown", (event) => {
  // BUGFIX - tingnan ang isTypingInTextField (input.js).
  if (typeof isTypingInTextField === "function" && isTypingInTextField(event)) return;

  if (event.key !== "v") return;

  event.preventDefault();
  showToolRadial();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "v") confirmToolRadialAim();
});

// Kung mawala ang focus ng window habang naka-hold ang "V" (hal.
// lumipat ka ng tab/app) - hindi na natin makikita ang keyup, kaya
// isara na lang din dito (walang kumpirmadong pili) para hindi maiwang
// bukas magpakailanman.
window.addEventListener("blur", () => hideToolRadial());

// =========================
// PAG-TUTOK (mouse angle mula sa gitna ng menu)
// =========================

document.addEventListener("mousemove", (event) => {
  if (!toolRadialVisible) return;

  const panel = document.getElementById("tool-radial");

  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Kunin nang live ang outer radius (kalahati ng lapad ng panel) - para
  // awtomatikong sumunod kahit magbago pa ang laki nito sa CSS.
  toolRadialOuterRadiusPx = rect.width / 2;

  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance < TOOL_RADIAL_DEAD_ZONE_PX) {
    // Gitna - "cancel", walang mapipili.
    toolRadialAimedDirection = null;
  } else if (distance > toolRadialOuterRadiusPx) {
    // Labas ng bilog - walang mapipiling tool, pero dapat mag-unequip
    // (tingnan ang confirmToolRadialAim) - iba ito sa gitnang "cancel".
    toolRadialAimedDirection = "outside";
  } else {
    // 0deg = pataas, dumadagdag PAKANAN (clockwise) - tumutugma sa
    // conic-gradient na "from" angle sa CSS. 4 na direksyon, 90° kada
    // isa, nakasentro sa 0/90/180/270.
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);

    if (angle < 0) angle += 360;

    if (angle >= 315 || angle < 45) toolRadialAimedDirection = "top";
    else if (angle < 135) toolRadialAimedDirection = "right";
    else if (angle < 225) toolRadialAimedDirection = "bottom";
    else toolRadialAimedDirection = "left";
  }

  syncToolRadialAim();
});

function syncToolRadialAim() {
  const highlight = document.getElementById("tool-radial-highlight");

  if (highlight) {
    // "outside" -> walang pie slice na naka-highlight (parang "none"
    // sa slice highlight), pero may sariling klase pa rin ito
    // (tool-radial-outside) sa panel para sa opsyonal na CSS cue
    // (tingnan ang style.css).
    highlight.className =
      "aim-" +
      (toolRadialAimedDirection && toolRadialAimedDirection !== "outside"
        ? toolRadialAimedDirection
        : "none");
  }

  document
    .getElementById("tool-radial")
    ?.classList.toggle("aim-outside", toolRadialAimedDirection === "outside");

  for (const direction in TOOL_RADIAL_ID_BY_DIRECTION) {
    const el = document.getElementById(TOOL_RADIAL_ID_BY_DIRECTION[direction]);

    el?.classList.toggle("aimed", direction === toolRadialAimedDirection);
  }
}

// I-click ang isang icon direkta bilang alternatibo sa "aim+release".
document
  .getElementById("tool-radial-pickaxe")
  ?.addEventListener("click", () => {
    equipPickaxe();
    hideToolRadial();
  });

document.getElementById("tool-radial-rake")?.addEventListener("click", () => {
  equipRake();
  hideToolRadial();
});

document.getElementById("tool-radial-axe")?.addEventListener("click", () => {
  equipAxe();
  hideToolRadial();
});

// BAGO (hiling ng user): "cutter" - pumalit na ito sa dating
// "kamao"/arrow slot (left, 4th cardinal direction) - direktang click
// bilang alternatibo sa "aim+release" na gesture (parehong-pareho ng
// ibang 3 sa itaas).
document
  .getElementById("tool-radial-cutter")
  ?.addEventListener("click", () => {
    equipCutter();
    hideToolRadial();
  });

function setRadialActive(id, active) {
  const el = document.getElementById(id);

  if (!el) return;

  el.classList.toggle("active", !!active);
}

// Tinatawag ito ng syncHotbarUI (hotbar.js) tuwing may nagbago sa
// equipped na kasangkapan, para naka-gold-highlight ang tamang opsyon
// sa loob ng radial menu.
function syncToolRadialUI() {
  setRadialActive("tool-radial-pickaxe", pickaxeEquipped);
  setRadialActive("tool-radial-rake", rakeEquipped);
  setRadialActive("tool-radial-axe", axeEquipped);
  setRadialActive(
    "tool-radial-cutter",
    typeof cutterEquipped !== "undefined" && cutterEquipped,
  );

  // Naka-lock (greyed-out, "tool-radial-locked") hanggang ma-craft -
  // tingnan ang pickaxeUnlocked/rakeUnlocked (dig.js), axeUnlocked/
  // cutterUnlocked (resources.js), at ang mga SHAPED recipe sa craft.js.
  document
    .getElementById("tool-radial-pickaxe")
    ?.classList.toggle("tool-radial-locked", !pickaxeUnlocked);
  document
    .getElementById("tool-radial-rake")
    ?.classList.toggle("tool-radial-locked", !rakeUnlocked);
  document
    .getElementById("tool-radial-axe")
    ?.classList.toggle("tool-radial-locked", !axeUnlocked);
  document
    .getElementById("tool-radial-cutter")
    ?.classList.toggle(
      "tool-radial-locked",
      !(typeof cutterUnlocked !== "undefined" && cutterUnlocked),
    );

  // AYOS (hiling ng user): "may duration na rin kada gamit... panatilihin
  // sa circle/tool radial, doon na lang ipakita ang durability" - maliit
  // na badge (parang hotbar-badge) sa ilalim ng bawat icon, "kasalukuyan/
  // max" (hal. "37/50") - lumalabas LANG kapag naka-unlock na ang tool
  // (walang silbi ipakita kung naka-lock/hindi pa na-craft).
  const cap = typeof TOOL_DURABILITY_MAX !== "undefined" ? TOOL_DURABILITY_MAX : 50;

  updateToolDurabilityBadge(
    "tool-radial-pickaxe",
    pickaxeUnlocked,
    typeof pickaxeDurability !== "undefined" ? pickaxeDurability : 0,
    cap,
  );
  updateToolDurabilityBadge(
    "tool-radial-rake",
    rakeUnlocked,
    typeof rakeDurability !== "undefined" ? rakeDurability : 0,
    cap,
  );
  updateToolDurabilityBadge(
    "tool-radial-axe",
    axeUnlocked,
    typeof axeDurability !== "undefined" ? axeDurability : 0,
    cap,
  );
  updateToolDurabilityBadge(
    "tool-radial-cutter",
    typeof cutterUnlocked !== "undefined" && cutterUnlocked,
    typeof cutterDurability !== "undefined" ? cutterDurability : 0,
    cap,
  );
}

// Ginagawa/ina-update ang maliit na "kasalukuyan/max" na badge ng
// durability sa loob ng isang tool-radial button - tinatanggal ito
// (kung meron) kapag "unlocked" ay false (wala namang silbi ipakita).
// Pulang tint (tool-radial-durability-low) kapag mababa na (<=20% ng
// max) - babala bago pa man talaga "sumabog"/masira ang tool.
function updateToolDurabilityBadge(buttonId, unlocked, durability, max) {
  const btn = document.getElementById(buttonId);

  if (!btn) return;

  let badge = btn.querySelector(".tool-radial-durability");

  if (!unlocked) {
    if (badge) badge.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tool-radial-durability";
    btn.appendChild(badge);
  }

  badge.textContent = durability + "/" + max;
  badge.classList.toggle(
    "tool-radial-durability-low",
    durability <= Math.ceil(max * 0.2),
  );
}

syncToolRadialUI();
