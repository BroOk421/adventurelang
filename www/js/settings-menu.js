// =========================
// SETTINGS MENU (burger icon, itaas-kanan)
// =========================
//
// Apat na pinipili: I-save / I-load / Settings / Lumabas. Umaasa ito sa
// mga save function na TALAGANG naka-deklara na sa ibang file (kaya
// kailangang mauna sa index.html ang lahat ng iyon - tingnan ang
// paliwanag sa itaas ng inventory-save.js). Gumagamit ng
// `typeof x === "function"` guard bago tumawag, kagaya ng ibang cross-
// file na code dito, kung sakaling may nag-alis/nagpalit ng pangalan
// ng function balang araw.

// =========================
// TOAST (maikling mensahe)
// =========================

let settingsToastTimer = null;

function showSettingsToast(message) {
  const toast = document.getElementById("settings-toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  // Force reflow bago i-add ang "visible" class, para gumana ang CSS
  // transition kahit paulit-ulit itong tawagin nang magkakasunod.
  void toast.offsetWidth;

  toast.classList.add("visible");

  if (settingsToastTimer) clearTimeout(settingsToastTimer);

  settingsToastTimer = setTimeout(() => {
    toast.classList.remove("visible");
    settingsToastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 300); // hintayin munang matapos ang fade-out (opacity transition)
  }, 1800);
}

// =========================
// I-SAVE LAHAT (lahat ng 5 hiwalay na localStorage system)
// =========================

function saveAllGameState() {
  if (typeof saveInventoryState === "function") saveInventoryState();
  if (typeof savePlayerPosition === "function") savePlayerPosition();
  if (typeof saveDugTiles === "function") saveDugTiles();
  if (typeof saveHarvestedResources === "function") saveHarvestedResources();
  if (typeof saveHarvestedOakTrees === "function") saveHarvestedOakTrees();
  // BAGONG 15-minutong respawn system ng puno/bato (resources.js) - dalawang
  // hiwalay na save key (mga "extra" na node + ang schedule kung kailan
  // susunod na susuriin) - naka-auto-save na rin ito sa bawat pagbabago,
  // pero isinasama pa rin dito para kumpleto ang "I-save" button.
  if (typeof saveResourceExtraNodes === "function") saveResourceExtraNodes();
  if (typeof saveResourceRespawnSchedule === "function") {
    saveResourceRespawnSchedule();
  }
}

// Lahat ng save KEY (localStorage) na ginagamit ng laro - ginagamit ng
// "I-reset ang laro" sa settings panel (tingnan sa ibaba). Kailangang
// I-TUGMA ito kapag may bagong SAVE_KEY na naidagdag sa ibang file
// balang araw.
function getAllSaveKeys() {
  return [
    typeof INVENTORY_SAVE_KEY !== "undefined" ? INVENTORY_SAVE_KEY : null,
    typeof PLAYER_SAVE_KEY !== "undefined" ? PLAYER_SAVE_KEY : null,
    typeof DIG_SAVE_KEY !== "undefined" ? DIG_SAVE_KEY : null,
    typeof RESOURCE_SAVE_KEY !== "undefined" ? RESOURCE_SAVE_KEY : null,
    typeof OAK_SAVE_KEY !== "undefined" ? OAK_SAVE_KEY : null,
    typeof RESOURCE_EXTRA_NODES_SAVE_KEY !== "undefined"
      ? RESOURCE_EXTRA_NODES_SAVE_KEY
      : null,
    typeof RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY !== "undefined"
      ? RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY
      : null,
  ].filter(Boolean);
}

// =========================
// DROPDOWN (☰)
// =========================

let settingsMenuOpen = false;

// "centered" - kapag true, ipinapakita ang dropdown sa GITNA ng
// screen sa halip na naka-anchor sa ilalim ng burger icon (tingnan
// ang .settings-menu-centered sa style.css) - ginagamit ito ng
// phone BACK button (mobile-controls.js). Default false = normal na
// gawi (click sa burger icon, top-right).
function setSettingsMenuOpen(open, centered = false) {
  settingsMenuOpen = open;

  document
    .getElementById("settings-menu-dropdown")
    ?.classList.toggle("hidden", !open);
  document
    .getElementById("settings-menu-dropdown")
    ?.classList.toggle("settings-menu-centered", open && centered);
  document
    .getElementById("settings-menu-button")
    ?.classList.toggle("active", open);
}

document
  .getElementById("settings-menu-button")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
    setSettingsMenuOpen(!settingsMenuOpen);
  });

// I-sara ang dropdown kapag nag-click kahit saan pa sa labas nito.
document.addEventListener("click", (event) => {
  if (!settingsMenuOpen) return;

  const menu = document.getElementById("settings-menu");

  if (menu && !menu.contains(event.target)) setSettingsMenuOpen(false);
});

document.getElementById("settings-menu-save")?.addEventListener("click", () => {
  saveAllGameState();
  showSettingsToast("Na-save ang laro! 💾");
  setSettingsMenuOpen(false);
});

document.getElementById("settings-menu-load")?.addEventListener("click", () => {
  setSettingsMenuOpen(false);

  const confirmed = window.confirm(
    "I-lo-load ang huling na-save na laro? Mawawala ang mga pagbabagong hindi pa na-save.",
  );

  if (confirmed) location.reload();
});

document
  .getElementById("settings-menu-settings")
  ?.addEventListener("click", () => {
    setSettingsMenuOpen(false);
    openSettingsPanel();
  });

document.getElementById("settings-menu-exit")?.addEventListener("click", () => {
  setSettingsMenuOpen(false);

  saveAllGameState();

  // Karamihan sa browser ay hindi papayagan ang script na isara ang
  // isang tab na hindi naman binuksan ng script (window.close() -
  // walang epekto/silently fails) - kaya sa halip, sinisigurado muna
  // nating naka-save ang lahat, tapos ipinapaalam na lang sa manlalaro
  // na puwede na niyang isara ang tab nang mano-mano.
  window.close();

  showSettingsToast("Na-save na ang laro — puwede mo nang isara ang tab.");
});

// =========================
// SETTINGS PANEL (Fullscreen, reset save)
// =========================

function openSettingsPanel() {
  document.getElementById("settings-panel")?.classList.remove("hidden");
  syncFullscreenToggleLabel();
}

function closeSettingsPanel() {
  document.getElementById("settings-panel")?.classList.add("hidden");
}

document
  .getElementById("settings-panel-close")
  ?.addEventListener("click", () => closeSettingsPanel());

function syncFullscreenToggleLabel() {
  const button = document.getElementById("settings-fullscreen-toggle");

  if (!button) return;

  button.textContent = document.fullscreenElement
    ? "🖥️ Umalis sa Fullscreen"
    : "🖥️ Fullscreen";
}

document
  .getElementById("settings-fullscreen-toggle")
  ?.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Puwedeng ma-reject (hal. hindi pinayagan ng browser) - hindi
        // kritikal, wala lang mangyayaring pagbabago.
      });
    }
  });

document.addEventListener("fullscreenchange", syncFullscreenToggleLabel);

document
  .getElementById("settings-reset-save")
  ?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Sigurado ka bang burahin ang LAHAT ng save data (imbentaryo, hukay, puno, posisyon)? Hindi na ito puwedeng bawiin.",
    );

    if (!confirmed) return;

    try {
      for (const key of getAllSaveKeys()) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      // Naka-block ang localStorage - wala nang ibang magagawa dito.
    }

    location.reload();
  });
