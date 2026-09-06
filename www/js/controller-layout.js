// =========================
// CONTROLLER LAYOUT (Settings > Controller > Edit Layout)
// =========================
//
// BAGO (hiling ng user): "gusto ko nga gawa ka na lang o add ka
// feature dun sa settings tapos crontroller tapos edit layout ganyan
// para ako na nag aadjust ng mga need ayusin mapa scale, opacity ng
// buttons ganyan" - sa halip na ako (Claude) ang mag-eedit ng CSS
// kada may reklamo sa posisyon/laki ng mga on-screen control
// (D-pad/hand button/Tools/minimap/hotbar), bagong panel ito
// (Settings > "🎮 Controller") na nagbibigay-daan sa USER MISMO na:
//   1. I-DRAG ang bawat control papunta sa gustong posisyon.
//   2. I-SELECT ang isang partikular na control (mag-hi-highlight ito)
//      at baguhin ang SARILI NITONG laki (scale) at opacity - HINDI
//      global (hiling ng user round 3: "dapat individual kapag click
//      ko sa isang button is dapat mag highlight yon tapos lalabas
//      yung size at opacity nun").
//   3. I-reset pabalik sa default posisyon/laki/opacity.
//
// Naka-save sa localStorage (CONTROLLER_LAYOUT_SAVE_KEY sa ibaba) -
// nananatili ito kahit mag-reload/mag-restart ng laro (hiling ng
// user: "kapag save ko kung anong ayos ang ginawa ko ganun na
// kalalabasan" - AWTOMATIKO nang naka-save ang bawat pagbabago,
// walang hiwalay na "Save" button na kailangan).
//
// PAANO ITO GUMAGANA (teknikal): ang bawat control ay may sarili nang
// "fixed" na posisyon (left/right/top/bottom, env(safe-area-inset-*),
// tingnan ang style.css) - hindi na natin ito ginagalaw/kino-compute
// ulit. Sa halip, isang ADDITIONAL na "transform: translate(dx, dy)
// scale(s)" ang inilalapat sa IBABAW ng posisyong iyon - kaya
// nananatiling tama ang orihinal na "base" na posisyon (kasama ang
// safe-area math nito), "dx/dy" na lang ang nagdaragdag ng offset
// mula roon, at "s" ang SARILING scale ng element na iyon.

const CONTROLLER_LAYOUT_SAVE_KEY = "tralala.controllerLayout.v2";

// Ang mga control na puwedeng i-customize - "id" (element ID sa
// index.html) + "label" (Filipino, ipinapakita sa panel kapag
// na-select). AYOS (hiling ng user: "lahat ng nasa screen button
// dapat mag appear") - dinagdagan ng "hotbar" (dating 4 lang: D-pad/
// hand button/Tools/minimap).
const CONTROLLER_LAYOUT_TARGETS = [
  { id: "mobile-dpad", label: "D-pad" },
  { id: "mobile-btn-action", label: "Hand button" },
  { id: "mobile-btn-tools", label: "Tools button" },
  { id: "minimap", label: "Minimap" },
  // AYOS: ang #hotbar ay may sarili nang "translateX(-50%)" sa CSS
  // (kailangan para sa pag-center nito, dahil "left: 50%" ang batayan
  // ng posisyon nito) - kung basta "translate(dx,dy) scale(s)" LANG
  // (walang -50%) ang ilalagay sa INLINE style nito, MAWAWALA ang
  // pag-center (mas prayoridad ang inline style kaysa sa class-based
  // na CSS rule) - kaya idinadagdag muna ang "baseTransform" na ito
  // BAGO ang dx/dy/scale kada pagkuha ng transform string
  // (getComposedTransform, sa ibaba), para manatiling naka-center pa
  // rin ito bago i-apply ang dagdag na drag offset/scale.
  { id: "hotbar", label: "Hotbar", baseTransform: "translateX(-50%) " },
];

// Karaniwang paraan ng pagbuo ng buong "transform" string ng isang
// target - isinasama ang "baseTransform" nito (kung meron, tingnan
// ang paliwanag sa itaas ng "hotbar") BAGO ang dx/dy/scale.
function getComposedTransform(id, dx, dy, scale) {
  const target = CONTROLLER_LAYOUT_TARGETS.find((entry) => entry.id === id);
  const basePrefix = target && target.baseTransform ? target.baseTransform : "";

  return `${basePrefix}translate(${dx}px, ${dy}px) scale(${scale})`;
}

function defaultTargetLayout() {
  return { dx: 0, dy: 0, scale: 1, opacity: 1 };
}

// True kung TALAGANG hindi pa ginagalaw/binago ng user ang target na
// ito (default pa rin lahat ng value) - ginagamit ng applyControllerLayout
// sa ibaba para MALAMAN kung dapat bang basta huwag munang galawin
// ang inline style nito (tingnan ang paliwanag doon - mahalaga ito
// lalo na para sa #hotbar, na may sariling responsive/mobile na
// "scale(0.82)" default sa CSS na dapat manatili hangga't hindi pa
// TALAGANG kino-customize ng user).
function isDefaultTargetLayout(pos) {
  return pos.dx === 0 && pos.dy === 0 && pos.scale === 1 && pos.opacity === 1;
}

function defaultControllerLayout() {
  const positions = {};

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    positions[id] = defaultTargetLayout();
  }

  return { positions };
}

let controllerLayoutCache = null;

function getControllerLayout() {
  if (controllerLayoutCache) return controllerLayoutCache;

  try {
    const raw = localStorage.getItem(CONTROLLER_LAYOUT_SAVE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const base = defaultControllerLayout();

    if (saved && typeof saved === "object" && saved.positions) {
      const positions = {};

      for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
        positions[id] = {
          ...defaultTargetLayout(),
          ...(saved.positions[id] || {}),
        };
      }

      controllerLayoutCache = { positions };
    } else {
      controllerLayoutCache = base;
    }
  } catch (error) {
    controllerLayoutCache = defaultControllerLayout();
  }

  return controllerLayoutCache;
}

function saveControllerLayout(layout) {
  controllerLayoutCache = layout;

  try {
    localStorage.setItem(CONTROLLER_LAYOUT_SAVE_KEY, JSON.stringify(layout));
  } catch (error) {
    // Naka-block ang localStorage - wala nang ibang magagawa dito,
    // pero patuloy pa ring gagana ang layout PARA SA KASALUKUYANG
    // session (nasa memory pa rin ang controllerLayoutCache).
  }
}

function getTargetLayout(id) {
  return getControllerLayout().positions[id] || defaultTargetLayout();
}

function setTargetLayout(id, patch) {
  const layout = getControllerLayout();

  layout.positions[id] = { ...getTargetLayout(id), ...patch };
  saveControllerLayout(layout);

  return layout.positions[id];
}

// Inilalapat ang saved na layout (posisyon/scale/opacity, SARILI ng
// BAWAT target) sa lahat ng CONTROLLER_LAYOUT_TARGETS - tinatawag sa
// unang pag-load, AT tuwing may binago (drag/slider/reset).
//
// AYOS: kung TALAGANG DEFAULT pa rin (hindi pa kino-customize ng user)
// ang isang target, "" (blangko) na lang ang ilalagay sa inline style
// nito sa halip na literal na "translate(0px,0px) scale(1)" - kung
// hindi, ang inline style (mas mataas ang priyoridad kaysa sa normal
// na CSS rule) ay MAPAPAWALANG-BISA ang anumang SARILING responsive/
// default na "transform" ng target sa CSS mismo (hal. ang "#hotbar"
// ay may sariling "scale(0.82)" default sa mobile, tingnan ang
// style.css) - kaya "" lang (walang override) hangga't wala pang
// TALAGANG customization, para manatiling gumagana ang default na
// CSS behavior nito.
function applyControllerLayout() {
  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    const el = document.getElementById(id);

    if (!el) continue;

    const pos = getTargetLayout(id);

    if (isDefaultTargetLayout(pos)) {
      el.style.transform = "";
      el.style.opacity = "";
      continue;
    }

    el.style.transform = getComposedTransform(id, pos.dx, pos.dy, pos.scale);
    el.style.opacity = String(pos.opacity);
  }
}

// I-apply agad sa unang pag-load (kung may naka-save na custom na
// layout mula sa nakaraang session) - kahit hindi pa ito touch device
// ngayon (?mobileui=1 preview sa desktop), walang epekto/ligtas lang
// kung wala namang laman ang mga element (getElementById -> null,
// naka-guard na sa itaas).
applyControllerLayout();

// =========================
// (a) EDIT MODE (i-select/i-drag ang mga control)
// =========================

let controllerEditModeActive = false;
let controllerSelectedTargetId = null;

function syncControllerSelectionUI() {
  const nameEl = document.getElementById("controller-layout-selected-name");
  const emptyHint = document.getElementById("controller-layout-empty-hint");
  const sliders = document.getElementById("controller-layout-sliders");
  const scaleInput = document.getElementById("controller-layout-scale");
  const opacityInput = document.getElementById("controller-layout-opacity");

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    document
      .getElementById(id)
      ?.classList.toggle(
        "controller-edit-selected",
        id === controllerSelectedTargetId,
      );
  }

  if (!controllerSelectedTargetId) {
    if (sliders) sliders.classList.add("hidden");
    if (emptyHint) emptyHint.classList.remove("hidden");

    return;
  }

  if (sliders) sliders.classList.remove("hidden");
  if (emptyHint) emptyHint.classList.add("hidden");

  const target = CONTROLLER_LAYOUT_TARGETS.find(
    (entry) => entry.id === controllerSelectedTargetId,
  );

  if (nameEl) nameEl.textContent = target ? target.label : "";

  const pos = getTargetLayout(controllerSelectedTargetId);

  if (scaleInput) scaleInput.value = String(pos.scale);
  if (opacityInput) opacityInput.value = String(pos.opacity);
}

function selectControllerTarget(id) {
  controllerSelectedTargetId = id;
  syncControllerSelectionUI();
}

function setControllerEditMode(active) {
  controllerEditModeActive = active;

  const toggleBtn = document.getElementById("controller-layout-edit-toggle");

  if (toggleBtn) {
    toggleBtn.textContent = active
      ? "✅ Tapos sa Pag-edit"
      : "✏️ I-edit ang Posisyon/Laki";
    toggleBtn.classList.toggle("active", active);
  }

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    document
      .getElementById(id)
      ?.classList.toggle("controller-edit-target", active);
  }

  if (!active) {
    controllerSelectedTargetId = null;
  }

  syncControllerSelectionUI();
}

// Isang beses lang itinatakda ang drag listener kada control (hindi
// paulit-ulit tuwing binubuksan ang panel) - "capture: true" ang
// mahalagang detalye dito: kapag AKTIBO ang edit mode, hinaharang
// natin ang event DITO PA LANG (bago pa man ito maabot ng mismong
// button sa loob, hal. ng D-pad arrow) - kaya HINDI na rin
// naa-apektuhan/naitatrigger ang normal na paggalaw/paggamit habang
// nagda-drag. Kapag HINDI naman aktibo ang edit mode, wala tayong
// ginagawa (`return` agad), kaya normal/walang pagbabago ang gawi.
// AYOS (hiling ng user round 3): sa PAGDIKIT PA LANG (pointerdown),
// AGAD na rin itong "nase-select" (selectControllerTarget) - dito
// lumalabas ang sarili nitong Laki/Opacity slider - hindi na
// kailangan ng hiwalay na "tap to select" na hakbang bago ang drag.
function makeControllerTargetDraggable(id) {
  const el = document.getElementById(id);

  if (!el) return;

  let dragging = false;
  let activePointerId = null;
  let startClientX = 0;
  let startClientY = 0;
  let baseDx = 0;
  let baseDy = 0;

  el.addEventListener(
    "pointerdown",
    (event) => {
      if (!controllerEditModeActive) return;

      event.preventDefault();
      event.stopPropagation();

      selectControllerTarget(id);

      dragging = true;
      activePointerId = event.pointerId;
      startClientX = event.clientX;
      startClientY = event.clientY;

      const pos = getTargetLayout(id);

      baseDx = pos.dx;
      baseDy = pos.dy;

      try {
        el.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ok lang - ilang browser/device ay hindi sumusuporta dito.
      }
    },
    true,
  );

  function updateDrag(event) {
    if (!dragging || event.pointerId !== activePointerId) return;

    event.preventDefault();

    const dx = baseDx + (event.clientX - startClientX);
    const dy = baseDy + (event.clientY - startClientY);
    const pos = getTargetLayout(id);

    el.style.transform = getComposedTransform(id, dx, dy, pos.scale);
  }

  function endDrag(event) {
    if (!dragging || event.pointerId !== activePointerId) return;

    dragging = false;
    activePointerId = null;

    const dx = baseDx + (event.clientX - startClientX);
    const dy = baseDy + (event.clientY - startClientY);

    setTargetLayout(id, { dx, dy });
  }

  el.addEventListener("pointermove", updateDrag, true);
  el.addEventListener("pointerup", endDrag, true);
  el.addEventListener("pointercancel", endDrag, true);
}

for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
  makeControllerTargetDraggable(id);
}

// =========================
// (b) PANEL (buksan/isara, per-target slider, reset)
// =========================

function openControllerLayoutPanel() {
  document.getElementById("controller-layout-panel")?.classList.remove("hidden");
  syncControllerSelectionUI();
}

function closeControllerLayoutPanel() {
  document.getElementById("controller-layout-panel")?.classList.add("hidden");

  // Awtomatikong lumalabas sa edit mode kapag isinara ang panel - para
  // hindi ito "nakadikit" (hindi na puwedeng ma-drag ang mga control)
  // sa susunod na pagbukas ng laro nang hindi sinasadya.
  setControllerEditMode(false);
}

document
  .getElementById("settings-controller-btn")
  ?.addEventListener("click", () => {
    if (typeof closeSettingsPanel === "function") closeSettingsPanel();
    openControllerLayoutPanel();
  });

document
  .getElementById("controller-layout-close")
  ?.addEventListener("click", () => closeControllerLayoutPanel());

document
  .getElementById("controller-layout-edit-toggle")
  ?.addEventListener("click", () => {
    setControllerEditMode(!controllerEditModeActive);
  });

document
  .getElementById("controller-layout-scale")
  ?.addEventListener("input", (event) => {
    if (!controllerSelectedTargetId) return;

    setTargetLayout(controllerSelectedTargetId, {
      scale: parseFloat(event.target.value) || 1,
    });
    applyControllerLayout();
  });

document
  .getElementById("controller-layout-opacity")
  ?.addEventListener("input", (event) => {
    if (!controllerSelectedTargetId) return;

    setTargetLayout(controllerSelectedTargetId, {
      opacity: parseFloat(event.target.value) || 1,
    });
    applyControllerLayout();
  });

document
  .getElementById("controller-layout-reset")
  ?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "I-reset ang laki/opacity/posisyon ng LAHAT ng control pabalik sa default?",
    );

    if (!confirmed) return;

    saveControllerLayout(defaultControllerLayout());
    applyControllerLayout();
    syncControllerSelectionUI();

    if (typeof showSettingsToast === "function") {
      showSettingsToast("Na-reset ang controller layout. 🔄");
    }
  });
