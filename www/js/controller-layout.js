// =========================
// CONTROLLER LAYOUT (Settings > Controller > Edit Layout)
// =========================
//
// BAGO (hiling ng user): "gusto ko nga gawa ka na lang o add ka
// feature dun sa settings tapos crontroller tapos edit layout ganyan
// para ako na nag aadjust ng mga need ayusin mapa scale, opacity ng
// buttons ganyan" - sa halip na ako (Claude) ang mag-eedit ng CSS
// kada may reklamo sa posisyon/laki ng mga on-screen control
// (D-pad/hand button/Tools/minimap), bagong panel ito (Settings >
// "🎮 Controller") na nagbibigay-daan sa USER MISMO na:
//   1. I-DRAG ang bawat control papunta sa gustong posisyon (edit
//      mode - tingnan ang "(a) EDIT MODE" sa ibaba).
//   2. Baguhin ang GENERAL na LAKI (scale) at OPACITY ng lahat ng
//      control gamit ang 2 slider.
//   3. I-reset pabalik sa default posisyon/laki/opacity.
//
// Naka-save sa localStorage (CONTROLLER_LAYOUT_SAVE_KEY sa ibaba) -
// nananatili ito kahit mag-reload/mag-restart ng laro.
//
// PAANO ITO GUMAGANA (teknikal): ang bawat control ay may sarili nang
// "fixed" na posisyon (left/right/top/bottom, env(safe-area-inset-*),
// tingnan ang style.css) - hindi na natin ito ginagalaw/kino-compute
// ulit. Sa halip, isang ADDITIONAL na "transform: translate(dx, dy)
// scale(s)" ang inilalapat sa IBABAW ng posisyong iyon - kaya
// nananatiling tama ang orihinal na "base" na posisyon (kasama ang
// safe-area math nito), "dx/dy" na lang ang nagdaragdag ng offset
// mula roon.

const CONTROLLER_LAYOUT_SAVE_KEY = "tralala.controllerLayout.v1";

// Ang mga control na puwedeng i-customize - "id" (element ID sa
// index.html) + "label" (Filipino, para sa hinaharap kung kailanganin
// pa ng per-element na UI).
const CONTROLLER_LAYOUT_TARGETS = [
  { id: "mobile-dpad", label: "D-pad" },
  { id: "mobile-btn-action", label: "Hand button" },
  { id: "mobile-btn-tools", label: "Tools button" },
  { id: "minimap", label: "Minimap" },
];

function defaultControllerLayout() {
  const positions = {};

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    positions[id] = { dx: 0, dy: 0 };
  }

  return { scale: 1, opacity: 1, positions };
}

let controllerLayoutCache = null;

function getControllerLayout() {
  if (controllerLayoutCache) return controllerLayoutCache;

  try {
    const raw = localStorage.getItem(CONTROLLER_LAYOUT_SAVE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const base = defaultControllerLayout();

    if (saved && typeof saved === "object") {
      controllerLayoutCache = {
        scale: typeof saved.scale === "number" ? saved.scale : base.scale,
        opacity:
          typeof saved.opacity === "number" ? saved.opacity : base.opacity,
        positions: { ...base.positions, ...(saved.positions || {}) },
      };
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

// Inilalapat ang saved na layout (posisyon/scale/opacity) sa lahat ng
// CONTROLLER_LAYOUT_TARGETS - tinatawag sa unang pag-load, AT tuwing
// may binago (drag/slider/reset).
function applyControllerLayout() {
  const layout = getControllerLayout();

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    const el = document.getElementById(id);

    if (!el) continue;

    const pos = layout.positions[id] || { dx: 0, dy: 0 };

    el.style.transform = `translate(${pos.dx}px, ${pos.dy}px) scale(${layout.scale})`;
    el.style.opacity = String(layout.opacity);
  }
}

// I-apply agad sa unang pag-load (kung may naka-save na custom na
// layout mula sa nakaraang session) - kahit hindi pa ito touch device
// ngayon (?mobileui=1 preview sa desktop), walang epekto/ligtas lang
// kung wala namang laman ang mga element (getElementById -> null,
// naka-guard na sa itaas).
applyControllerLayout();

// =========================
// (a) EDIT MODE (i-drag ang mga control)
// =========================

let controllerEditModeActive = false;

function setControllerEditMode(active) {
  controllerEditModeActive = active;

  const toggleBtn = document.getElementById("controller-layout-edit-toggle");

  if (toggleBtn) {
    toggleBtn.textContent = active
      ? "✅ Tapos sa Pag-edit"
      : "✏️ I-edit ang Posisyon";
    toggleBtn.classList.toggle("active", active);
  }

  for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
    document
      .getElementById(id)
      ?.classList.toggle("controller-edit-target", active);
  }
}

// Isang beses lang itinatakda ang drag listener kada control (hindi
// paulit-ulit tuwing binubuksan ang panel) - "capture: true" ang
// mahalagang detalye dito: kapag AKTIBO ang edit mode, hinaharang
// natin ang event DITO PA LANG (bago pa man ito maabot ng mismong
// button sa loob, hal. ng D-pad arrow) - kaya HINDI na rin
// naa-apektuhan/naitatrigger ang normal na paggalaw/paggamit habang
// nagda-drag, dahil hindi na ito naaabot ng mga sariling listener ng
// mismong button. Kapag HINDI naman aktibo ang edit mode, wala tayong
// ginagawa (`return` agad), kaya normal/walang pagbabago ang gawi.
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

      dragging = true;
      activePointerId = event.pointerId;
      startClientX = event.clientX;
      startClientY = event.clientY;

      const pos = getControllerLayout().positions[id] || { dx: 0, dy: 0 };

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
    const layout = getControllerLayout();

    el.style.transform = `translate(${dx}px, ${dy}px) scale(${layout.scale})`;
  }

  function endDrag(event) {
    if (!dragging || event.pointerId !== activePointerId) return;

    dragging = false;
    activePointerId = null;

    const dx = baseDx + (event.clientX - startClientX);
    const dy = baseDy + (event.clientY - startClientY);
    const layout = getControllerLayout();

    layout.positions[id] = { dx, dy };
    saveControllerLayout(layout);
  }

  el.addEventListener("pointermove", updateDrag, true);
  el.addEventListener("pointerup", endDrag, true);
  el.addEventListener("pointercancel", endDrag, true);
}

for (const { id } of CONTROLLER_LAYOUT_TARGETS) {
  makeControllerTargetDraggable(id);
}

// =========================
// (b) PANEL (buksan/isara, slider, reset)
// =========================

function openControllerLayoutPanel() {
  document.getElementById("controller-layout-panel")?.classList.remove("hidden");

  const layout = getControllerLayout();
  const scaleInput = document.getElementById("controller-layout-scale");
  const opacityInput = document.getElementById("controller-layout-opacity");

  if (scaleInput) scaleInput.value = String(layout.scale);
  if (opacityInput) opacityInput.value = String(layout.opacity);
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
    const layout = getControllerLayout();

    layout.scale = parseFloat(event.target.value) || 1;
    saveControllerLayout(layout);
    applyControllerLayout();
  });

document
  .getElementById("controller-layout-opacity")
  ?.addEventListener("input", (event) => {
    const layout = getControllerLayout();

    layout.opacity = parseFloat(event.target.value) || 1;
    saveControllerLayout(layout);
    applyControllerLayout();
  });

document
  .getElementById("controller-layout-reset")
  ?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "I-reset ang laki/opacity/posisyon ng mga control pabalik sa default?",
    );

    if (!confirmed) return;

    saveControllerLayout(defaultControllerLayout());
    applyControllerLayout();

    const scaleInput = document.getElementById("controller-layout-scale");
    const opacityInput = document.getElementById("controller-layout-opacity");

    if (scaleInput) scaleInput.value = "1";
    if (opacityInput) opacityInput.value = "1";

    if (typeof showSettingsToast === "function") {
      showSettingsToast("Na-reset ang controller layout. 🔄");
    }
  });
