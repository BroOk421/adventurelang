// =========================
// MAIN MENU (Loading -> Play / Load / Settings / Exit)
// =========================
//
// BAGO (hiling ng user: "gusto ko lang may loading play load settings
// exit bago mag start") - dating deretso agad pumapasok ang laro sa
// huling naka-save na mundo sa sandaling ma-parse ang mga script
// (tingnan ang dating dulo ng map.js) - WALA pang anumang menu bago
// noon. Ngayon, may bagong full-screen na overlay (#main-menu-overlay,
// index.html) na ipinapakita MUNA, may dalawang estado:
//   1. "Loading" - habang hinihintay ang mga kailangang async na
//      resource (GRASSMAP_RESOURCES_LOADED, worlds.js) - PAREHONG
//      dahilan kung bakit hinihintay din ito ng beginInitialWorldLoad
//      (map.js) bago tumawag ng loadWorld(), para HINDI puwedeng
//      pindutin ng user ang "Play" bago pa man talaga handa ang laro.
//   2. "Play / Load / Settings / Exit" - apat na button, sa sandaling
//      TAPOS na ang naghihintay sa itaas.
//
// Umaasa ito sa mga function na TALAGANG naka-deklara na sa ibang file
// (kaya kailangang MAUNA sa index.html ang lahat ng iyon):
//   - beginInitialWorldLoad() (map.js) - "Play"
//   - openLoadSlotsPopup() (settings-menu.js) - "Load" (parehong popup
//     na ginagamit ng in-game na burger-menu "Load")
//   - openSettingsPanel() (settings-menu.js) - "Settings"
//   - exitGame() (settings-menu.js) - "Exit"
// Gumagamit ng `typeof x === "function"` guard bago tumawag, kagaya ng
// ibang cross-file na code sa laro, kung sakaling may nag-alis/nagpalit
// ng pangalan ng function balang araw.

function hideMainMenuOverlay() {
  document.getElementById("main-menu-overlay")?.classList.add("hidden");
}

// Sinusuri paulit-ulit (maikling interval) kung TAPOS na ba ang
// GRASSMAP_RESOURCES_LOADED promise - gamit ang ".then()" mismo sa
// halip na polling sana ang mas tama, PERO gusto rin nating SIGURADONG
// hindi pa "Play"-able habang naghihintay pa - kaya ".then()" pa rin
// ang ginamit dito (tingnan sa ibaba), walang polling talaga.
function showMainMenuButtons() {
  document.getElementById("main-menu-loading")?.classList.add("hidden");
  document.getElementById("main-menu-content")?.classList.remove("hidden");
}

function initMainMenu() {
  const playBtn = document.getElementById("main-menu-play");
  const loadBtn = document.getElementById("main-menu-load");
  const settingsBtn = document.getElementById("main-menu-settings");
  const exitBtn = document.getElementById("main-menu-exit");

  // "started" guard - iwasan ang double-start kung sakaling ma-double
  // click/tap ang "Play" bago pa man matapos mag-fade out ang overlay.
  let started = false;

  playBtn?.addEventListener("click", () => {
    if (started) return;

    started = true;

    hideMainMenuOverlay();

    if (typeof beginInitialWorldLoad === "function") {
      beginInitialWorldLoad();
    }
  });

  // Parehong "Load" popup na ginagamit sa loob mismo ng laro (burger
  // menu) - pagpili ng isang save slot doon ay sumusulat sa "live"
  // localStorage keys tapos nagre-reload ng WHOLE page
  // (loadGameFromSlot, settings-menu.js) - kaya babalik tayo dito sa
  // main menu pagkatapos (dahil hindi pa "Play" ang pinindot), TAPOS
  // TALAGANG papasok na sa na-load na save sa pagpindot ng "Play".
  loadBtn?.addEventListener("click", () => {
    if (typeof openLoadSlotsPopup === "function") openLoadSlotsPopup();
  });

  settingsBtn?.addEventListener("click", () => {
    if (typeof openSettingsPanel === "function") openSettingsPanel();
  });

  exitBtn?.addEventListener("click", () => {
    if (typeof exitGame === "function") exitGame();
  });

  // Habang wala pang laman/handa ang GRASSMAP_RESOURCES_LOADED, panatilihin
  // munang naka-disable ang mga button (bukod sa Settings/Exit, na hindi
  // naman umaasa sa estado ng mundo) - iwasan ang pagpindot ng "Play"/
  // "Load" bago pa man talaga handa.
  if (playBtn) playBtn.disabled = true;
  if (loadBtn) loadBtn.disabled = true;

  function markReady() {
    if (playBtn) playBtn.disabled = false;
    if (loadBtn) loadBtn.disabled = false;

    showMainMenuButtons();
  }

  if (typeof GRASSMAP_RESOURCES_LOADED !== "undefined") {
    GRASSMAP_RESOURCES_LOADED.then(markReady).catch(markReady);
  } else {
    markReady();
  }
}

initMainMenu();
