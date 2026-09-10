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
//
// BAGO (hiling ng user: "ayoko na ng auto save kapag pindutin ko yung
// save sa settings dun lang mag save tyaka may list ng save dun sa
// load mag popup yung list") - malaking pagbabago sa disenyo:
//   1) WALA NANG AUTO-SAVE - lahat ng saveXxxState() function sa buong
//      laro (player.js/dig.js/resources.js/decor.js/inventory-save.js/
//      gametime.js) ay may bagong "force" parameter (default false) -
//      kapag hindi "force", NO-OP na lang ito. Ang TANGING lugar na
//      gumagamit ng "force: true" ay ang saveAllGameState() sa ibaba.
//   2) MARAMING SAVE SLOT - sa halip na basta isang "live" save,
//      gumagawa na ngayon ng BAGONG, PINANGALANANG slot ang bawat
//      "Save" (tingnan ang "MARAMING SAVE SLOT" sa ibaba).
//   3) "I-load" ay nagbubukas na ngayon ng POPUP na naglilista ng
//      lahat ng save slot (tingnan ang "LOAD POPUP" sa ibaba), sa
//      halip na basta mag-reload nang deretso.

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
  if (typeof saveInventoryState === "function") saveInventoryState(true);
  if (typeof savePlayerPosition === "function") savePlayerPosition(true);
  if (typeof saveDugTiles === "function") saveDugTiles(true);
  if (typeof saveHarvestedResources === "function") saveHarvestedResources(true);
  if (typeof saveHarvestedOakTrees === "function") saveHarvestedOakTrees(true);
  // BAGONG 15-minutong respawn system ng puno/bato (resources.js) - dalawang
  // hiwalay na save key (mga "extra" na node + ang schedule kung kailan
  // susunod na susuriin).
  if (typeof saveResourceExtraNodes === "function") saveResourceExtraNodes(true);
  if (typeof saveResourceRespawnSchedule === "function") {
    saveResourceRespawnSchedule(true);
  }
  // BAGO: dating nakalimutan dito (gap) - ang 1-minutong "tumubo ulit"
  // na schedule ng bawat puno (hiwalay sa 15-minutong respawn sa itaas),
  // at ang oras/petsa ng laro (Araw 1 epoch + sleep offset).
  if (typeof saveTreeRegrowSchedule === "function") saveTreeRegrowSchedule(true);
  if (typeof saveStumpHits === "function") saveStumpHits(true);
  if (typeof saveHarvestedGrassTufts === "function") saveHarvestedGrassTufts(true);
  if (typeof saveGrassRegrowSchedule === "function") saveGrassRegrowSchedule(true);
  if (typeof saveGameTimeState === "function") saveGameTimeState(true);
  // BAGO (scattered-loot.js) - nakakalat na wood/stone loot (grassmap/
  // grassmap2) + ang 10-minutong respawn schedule nito, kaparehong
  // pattern ng resourceExtraNodes/resourceRespawnSchedule sa itaas.
  if (typeof saveScatteredLoot === "function") saveScatteredLoot(true);
  if (typeof saveScatteredLootSchedule === "function") {
    saveScatteredLootSchedule(true);
  }
  // BUGFIX (hiling ng user: "kapag na save ko na meron na nakalagay na
  // houses tapos reset tapos i load yung sisave ko di siya nasasave
  // balik sa walang bahay") - NAKALIMUTAN dati ang builder.js dito, kaya
  // HINDI kasama sa "snapshot" ng save slot ang mga naitayong Lot/bahay
  // (exterior/interior/posisyon/pangalan) - kaya laging "walang bahay"
  // pagkatapos mag-load.
  if (typeof saveCustomHouses === "function") saveCustomHouses();
}

// Lahat ng save KEY (localStorage) na ginagamit ng laro - ginagamit ng
// "I-reset ang laro" sa settings panel (tingnan sa ibaba), AT ng
// save-slot system (tingnan ang "MARAMING SAVE SLOT" sa ibaba). Kailangang
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
    typeof TREE_REGROW_SCHEDULE_SAVE_KEY !== "undefined"
      ? TREE_REGROW_SCHEDULE_SAVE_KEY
      : null,
    typeof STUMP_HITS_SAVE_KEY !== "undefined" ? STUMP_HITS_SAVE_KEY : null,
    typeof GRASS_TUFT_SAVE_KEY !== "undefined" ? GRASS_TUFT_SAVE_KEY : null,
    typeof GRASS_REGROW_SCHEDULE_SAVE_KEY !== "undefined"
      ? GRASS_REGROW_SCHEDULE_SAVE_KEY
      : null,
    typeof SCATTERED_LOOT_SAVE_KEY !== "undefined"
      ? SCATTERED_LOOT_SAVE_KEY
      : null,
    typeof SCATTERED_LOOT_SCHEDULE_SAVE_KEY !== "undefined"
      ? SCATTERED_LOOT_SCHEDULE_SAVE_KEY
      : null,
    typeof GAME_TIME_SAVE_KEY !== "undefined" ? GAME_TIME_SAVE_KEY : null,
    // BUGFIX - ang mga custom na bahay (builder.js, si Joseph) ay
    // TALAGANG nakatabi na sa localStorage, PERO wala sila sa listahang
    // ito - kaya (a) hindi sila naisasama sa bundle ng bawat save slot,
    // at (b) hindi rin sila nabubura ng "I-reset ang laro". Dahil dito,
    // parang nakadikit sila sa BROWSER sa halip na sa SAVE mo.
    typeof BUILDER_SAVE_KEY !== "undefined" ? BUILDER_SAVE_KEY : null,
  ].filter(Boolean);
}

// =========================
// MARAMING SAVE SLOT (hiling ng user: "ayoko na ng auto save kapag
// pindutin ko yung save sa settings dun lang mag save tyaka may list
// ng save dun sa load mag popup yung list")
// =========================
//
// DATING GAWI: IISA lang ang "save" (direktang nakasulat sa mismong
// live localStorage key ng bawat subsystem - PLAYER_SAVE_KEY, atbp),
// kaya "I-load" dati ay basta nag-re-reload lang ng page (walang
// ibang gagawin, dahil iisa lang naman talaga ang laman). BAGO: ang
// bawat "Save" ngayon ay gumagawa ng BAGONG, HIWALAY na slot (na may
// pangalan/petsa) - ang lahat ng slot ay nakalista sa isang "index"
// (SAVE_SLOTS_INDEX_KEY), habang ang AKTWAL na laman ng bawat isa
// (isang JSON "bundle" ng lahat ng save key/value - tingnan ang
// getAllSaveKeys() sa itaas) ay nakatabi sa sarili nitong key
// (SAVE_SLOT_DATA_PREFIX + id). Sa "I-load", ipinapakita muna ang
// LISTAHAN ng mga slot (popup) - pinipili ng manlalaro kung alin ang
// ilo-load.
const SAVE_SLOTS_INDEX_KEY = "tralala.saveSlots.v1";
const SAVE_SLOT_DATA_PREFIX = "tralala.saveSlotData.";
const SAVE_BUNDLE_KEYS_MARKER = "__savedKeys";

function getSaveSlots() {
  try {
    const raw = localStorage.getItem(SAVE_SLOTS_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistSaveSlotsIndex(slots) {
  try {
    localStorage.setItem(SAVE_SLOTS_INDEX_KEY, JSON.stringify(slots));
  } catch (error) {
    // Naka-block ang localStorage - wala nang ibang magagawa dito.
  }
}

function defaultSaveSlotName() {
  const now = new Date();

  return "Save - " + now.toLocaleString();
}

// Ginagawa ang isang BAGONG save slot: (1) pinipilit munang mag-save
// ang LAHAT ng subsystem (saveAllGameState - sinusulat ang KASALUKUYANG
// live na estado papunta sa kani-kanilang "current" localStorage key),
// (2) binubuo ang isang "bundle" (snapshot) mula sa mga NASULAT na
// values na iyon, (3) itinatabi ang bundle sa sarili nitong key, at
// idinaragdag ang bagong slot sa index/listahan.
function saveGameToNewSlot(name) {
  saveAllGameState();

  const bundle = {};

  try {
    // MARKER (tingnan ang loadGameFromSlot) - ito ang nagsasabi na ang
    // slot na ito ay ginawa ng BAGONG code, kaya ALAM natin na ang
    // KAWALAN ng isang key dito ay TALAGANG ibig sabihin "wala nito
    // noong nag-save" (hindi "luma lang ang save"). Hindi ito tunay na
    // localStorage key - kaya may "__" prefix, imposibleng ma-clash sa
    // mga "tralala.*" na tunay na key.
    bundle[SAVE_BUNDLE_KEYS_MARKER] = JSON.stringify(getAllSaveKeys());

    for (const key of getAllSaveKeys()) {
      const value = localStorage.getItem(key);

      if (value !== null) bundle[key] = value;
    }
  } catch (error) {
    // Naka-block ang localStorage - wala tayong maiimbak na bundle.
    return null;
  }

  const id =
    "slot_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  const slots = getSaveSlots();

  slots.push({
    id,
    name: (name && name.trim()) || defaultSaveSlotName(),
    savedAt: Date.now(),
  });

  persistSaveSlotsIndex(slots);

  try {
    localStorage.setItem(SAVE_SLOT_DATA_PREFIX + id, JSON.stringify(bundle));
  } catch (error) {
    // Naka-block/PUNO ang localStorage - naitala na sa index pero
    // walang laman. AYOS: dating TAHIMIK ito, kaya akala mo nakasave ka
    // na - ngayon, binubura na ang "bulok" na entry at may sinasabi na
    // ito, dahil malalaki ang PNG ng mga custom na bahay at TALAGANG
    // kayang mapuno ang limitasyon ng localStorage.
    persistSaveSlotsIndex(getSaveSlots().filter((entry) => entry.id !== id));
    showSettingsToast("Could not save - storage is full. Delete an old save. \ud83d\ude15");

    return null;
  }

  return id;
}

// Binabasa ang bundle ng partikular na slot, isinusulat ang bawat
// key/value nito PABALIK sa live localStorage (kaya sa susunod na
// pag-reload, babasahin ito ng bawat subsystem's loadXxxState() na
// parang normal), tapos nire-reload ang page - ito ang PINAKASIMPLE at
// PINAKA-MAASAHANG paraan (iisang lugar lang, hindi na kailangang
// muling tawagin nang isa-isa ang bawat loadXxxState() sa tamang
// pagkakasunod-sunod).
// Ibinabalik ang listahan ng key na TALAGANG isinaalang-alang noong
// ginawa ang slot na ito - o `null` kung LUMANG slot ito (walang
// marker), na ibig sabihin ay hindi natin alam, kaya huwag nang
// bumura ng kahit ano.
function parseSaveBundleKeys(bundle) {
  try {
    const raw = bundle[SAVE_BUNDLE_KEYS_MARKER];

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function loadGameFromSlot(id) {
  let bundle;

  try {
    const raw = localStorage.getItem(SAVE_SLOT_DATA_PREFIX + id);

    bundle = raw ? JSON.parse(raw) : null;
  } catch (error) {
    bundle = null;
  }

  if (!bundle || typeof bundle !== "object") {
    showSettingsToast("Could not open this save. 😕");
    return;
  }

  try {
    // Ang isang key na WALA sa bundle ay dapat BURAHIN, para EKSAKTONG
    // kung ano ang na-save, iyon ang mababalik (kung hindi, "dumadaan"
    // ang laman ng NAKARAANG laro).
    //
    // BUGFIX (MAHALAGA) - dating ginagawa ito sa LAHAT ng slot - PERO
    // ang mga LUMANG slot (ginawa bago pa naidagdag ang BUILDER_SAVE_KEY
    // sa getAllSaveKeys) ay TALAGANG walang bahay sa loob, kaya ang
    // pag-load ng ganoong slot ay BUMUBURA sa mga bahay na kaka-tayo mo
    // lang. Kaya ngayon, kapag WALANG marker ang slot (= lumang save),
    // HINDI na ito bumubura - iniiwan na lang kung ano ang meron, dahil
    // hindi natin masasabi kung "wala talaga" o "hindi lang naisama".
    const savedKeys = parseSaveBundleKeys(bundle);

    if (savedKeys) {
      for (const key of savedKeys) {
        if (!(key in bundle)) localStorage.removeItem(key);
      }
    }

    for (const key of Object.keys(bundle)) {
      if (key === SAVE_BUNDLE_KEYS_MARKER) continue;

      localStorage.setItem(key, bundle[key]);
    }
  } catch (error) {
    showSettingsToast("Could not load - storage is blocked. 😕");
    return;
  }

  location.reload();
}

function deleteSaveSlot(id) {
  const slots = getSaveSlots().filter((slot) => slot.id !== id);

  persistSaveSlotsIndex(slots);

  try {
    localStorage.removeItem(SAVE_SLOT_DATA_PREFIX + id);
  } catch (error) {
    // Hindi kritikal.
  }
}

// =========================
// LOAD POPUP (listahan ng mga save slot)
// =========================

function openLoadSlotsPopup() {
  renderLoadSlotsList();
  document.getElementById("load-slots-overlay")?.classList.remove("hidden");
}

function closeLoadSlotsPopup() {
  document.getElementById("load-slots-overlay")?.classList.add("hidden");
}

function formatSaveSlotDate(timestampMs) {
  try {
    return new Date(timestampMs).toLocaleString();
  } catch (error) {
    return "";
  }
}

// " \u2022 \ud83c\udfe0 2" kung may 2 bahay ang slot na ito, "" kung wala/
// hindi mabasa - panandang-teksto lang ito, hindi kritikal, kaya
// tahimik lang itong sumusuko kapag may problema.
function describeSaveSlotHouses(id) {
  try {
    const raw = localStorage.getItem(SAVE_SLOT_DATA_PREFIX + id);

    if (!raw) return "";

    const bundle = JSON.parse(raw);
    const housesRaw =
      typeof BUILDER_SAVE_KEY !== "undefined" ? bundle[BUILDER_SAVE_KEY] : null;

    if (!housesRaw) return "";

    const houses = JSON.parse(housesRaw).houses;

    if (!Array.isArray(houses) || houses.length === 0) return "";

    return " \u2022 \ud83c\udfe0 " + houses.length;
  } catch (error) {
    return "";
  }
}

function renderLoadSlotsList() {
  const listEl = document.getElementById("load-slots-list");
  const emptyEl = document.getElementById("load-slots-empty");

  if (!listEl) return;

  listEl.innerHTML = "";

  // Pinakabago munang lumalabas sa itaas.
  const slots = getSaveSlots().slice().sort((a, b) => b.savedAt - a.savedAt);

  emptyEl?.classList.toggle("hidden", slots.length > 0);

  for (const slot of slots) {
    const row = document.createElement("div");

    row.className = "load-slot-row";

    const info = document.createElement("div");

    info.className = "load-slot-info";

    const nameEl = document.createElement("div");

    nameEl.className = "load-slot-name";
    nameEl.textContent = slot.name;

    const dateEl = document.createElement("div");

    dateEl.className = "load-slot-date";
    // AYOS - ipinapakita rin kung ILANG custom na bahay ang TALAGANG
    // laman ng save na ito. Ang mga slot na ginawa BAGO pa naidagdag
    // ang mga bahay sa save system ay WALA nito - kaya kitang-kita mo
    // agad kung bakit "nawawala" ang mga bahay kapag lumang save ang
    // ni-load mo (sagot: wala talaga silang laman - kailangan mo munang
    // gumawa ng BAGONG save).
    dateEl.textContent =
      formatSaveSlotDate(slot.savedAt) + describeSaveSlotHouses(slot.id);

    info.appendChild(nameEl);
    info.appendChild(dateEl);

    const actions = document.createElement("div");

    actions.className = "load-slot-actions";

    const loadBtn = document.createElement("button");

    loadBtn.type = "button";
    loadBtn.className = "load-slot-btn load-slot-load-btn";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        'Load the save "' +
          slot.name +
          '"? Any unsaved changes will be lost.',
      );

      if (confirmed) loadGameFromSlot(slot.id);
    });

    const exportBtn = document.createElement("button");

    exportBtn.type = "button";
    exportBtn.className = "load-slot-btn load-slot-export-btn";
    exportBtn.title = "Export this save as a file";
    exportBtn.textContent = "📤";
    exportBtn.addEventListener("click", () => exportSaveSlot(slot.id));

    const deleteBtn = document.createElement("button");

    deleteBtn.type = "button";
    deleteBtn.className = "load-slot-btn load-slot-delete-btn";
    deleteBtn.title = "Delete this save";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        'Delete the save "' + slot.name + '"? This cannot be undone.',
      );

      if (!confirmed) return;

      deleteSaveSlot(slot.id);
      renderLoadSlotsList();
    });

    actions.appendChild(loadBtn);
    actions.appendChild(exportBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(actions);

    listEl.appendChild(row);
  }
}

// =========================
// EXPORT / IMPORT (hiling ng user: "pwede ring export at import ng
// file para pwede ako maglaro kahit saang computer") - dahil naka-
// localStorage lang ang lahat ng save (hindi umaabot sa ibang
// computer/browser), pinapayagan dito ang pag-download ng ISANG save
// slot bilang .json file ("Export" - tabi ng "I-load"/🗑️ sa bawat
// row ng listahan sa LOAD popup), at ang pag-upload nito ulit sa
// (ibang) computer bilang BAGONG slot ("Import" - itaas-kanan ng LOAD
// popup, tabi ng ✕). Tingnan ang renderLoadSlotsList() sa itaas para
// sa mismong mga button, at ang load-slots-header/load-slots-import
// sa index.html.
// =========================

// AYOS (hiling ng user: "kapag nag export ako ng save hindi nag
// dodownload" - sa NAKA-INSTALL na APK mismo, hindi sa browser): ang
// dating paraan (`<a download>` + blob: URL + link.click()) ay
// GUMAGANA lang nang maaasahan sa isang TUNAY na browser (Chrome/
// Safari) - sa loob ng isang Capacitor WebView (ito mismo ang
// environment ng naka-install na app, tingnan ang
// capacitor.config.json/android/), WALANG naka-kabit na "download
// manager" sa blob: URL na ito - kaya TAHIMIK lang itong nabibigo
// (walang error, pero walang file na lalabas kahit saan) - kaya
// "hindi ko nakikita sa Downloads" ang naramdaman ng user.
//
// AYOS: kapag TALAGANG naka-install na APK ito (Capacitor NATIVE
// platform, hindi lang basta "mobile browser" - tingnan ang
// isRunningAsNativeCapacitorApp sa ibaba), gamitin ang mismong
// "Filesystem" + "Share" na NATIVE PLUGIN ng Capacitor sa halip
// (isinulat ang JSON papuntang Directory.Cache, pagkatapos buksan ang
// NATIVE share sheet ng Android - doon na mismo pipiliin ng user kung
// saan/paano talaga i-se-save - "Files", Google Drive, ipapadala sa
// sarili sa Messenger/Gmail, atbp. - GARANTISADONG makikita ito ng
// user kahit saan niya piliing i-save, kaiba sa "Downloads" na
// tahimik lang na nabibigo). Sa TUNAY na browser (walang Capacitor),
// PAREHONG-PAREHO pa rin ang DATING `<a download>` na paraan - walang
// binago roon.
//
// TANDAAN: kailangan munang idagdag ang "@capacitor/filesystem" at
// "@capacitor/share" sa package.json (nagawa na ito) TAPOS patakbuhin
// ang `npm install` at `npx cap sync android` (at i-rebuild/i-install
// ulit ang APK) bago talaga gumana ito sa totoong device - hanggang
// hindi pa nagagawa iyon, awtomatiko na lang itong babagsak (try/
// catch) pabalik sa lumang `<a download>` na paraan (tingnan ang
// "walang Filesystem/Share plugin" na sanga sa ibaba).
function isRunningAsNativeCapacitorApp() {
  return !!(
    typeof window.Capacitor !== "undefined" &&
    typeof window.Capacitor.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform()
  );
}

// I-eexport lang ang IISANG partikular na slot (yung ni-click na
// "📤" sa tabi ng "I-load" nito) - hindi lahat ng save nang sabay.
function exportSaveSlot(id) {
  const slot = getSaveSlots().find((entry) => entry.id === id);

  if (!slot) {
    showSettingsToast("Could not find this save. 😕");
    return;
  }

  let bundle;

  try {
    const raw = localStorage.getItem(SAVE_SLOT_DATA_PREFIX + id);

    bundle = raw ? JSON.parse(raw) : null;
  } catch (error) {
    bundle = null;
  }

  if (!bundle) {
    showSettingsToast("Could not export - this save is empty. 😕");
    return;
  }

  // House artwork (exterior/interior PNGs) is NOT embedded inline in
  // BUILDER_SAVE_KEY - it lives in its own asset keys, shared across all
  // slots, so that repeated Saves don't multiply the same images (see
  // the "IMAGE ASSET STORE" comment in builder.js). That's great for
  // local storage, but it means the raw bundle above only has small
  // assetId references, not the actual image data - useless on another
  // device/browser where those asset keys don't exist. So here, for
  // export ONLY, re-embed ("inflate") the real image data from the
  // local asset store back into a COPY of the house records, so the
  // exported file is fully self-contained and portable.
  if (typeof BUILDER_SAVE_KEY !== "undefined" && bundle[BUILDER_SAVE_KEY]) {
    try {
      const parsed = JSON.parse(bundle[BUILDER_SAVE_KEY]);

      if (Array.isArray(parsed.houses) && typeof loadBuilderAsset === "function") {
        for (const house of parsed.houses) {
          if (house.exteriorAssetId) {
            house.exteriorImageDataURL = loadBuilderAsset(house.exteriorAssetId);
          }
          if (house.interiorAssetId) {
            house.interiorImageDataURL = loadBuilderAsset(house.interiorAssetId);
          }
        }
      }

      bundle = { ...bundle, [BUILDER_SAVE_KEY]: JSON.stringify(parsed) };
    } catch (error) {
      // If this fails for any reason, fall through and export the slim
      // bundle as-is rather than blocking the export entirely.
    }
  }

  // "type"/"version" - ginagamit ng importSaveFile() sa ibaba para
  // matiyak na TALAGANG save file ito ng laro (hindi random na .json).
  const exportPayload = {
    type: "adventureLangSaveExport",
    version: 2,
    exportedAt: Date.now(),
    slot: { id: slot.id, name: slot.name, savedAt: slot.savedAt },
    bundle,
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const safeName = (slot.name || "save").replace(/[^\w\-]+/g, "_");
  const fileName = "adventureLang-" + safeName + ".json";

  if (
    isRunningAsNativeCapacitorApp() &&
    window.Capacitor.Plugins?.Filesystem &&
    window.Capacitor.Plugins?.Share
  ) {
    exportSaveSlotViaNativeShare(fileName, json);
    return;
  }

  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showSettingsToast("Save exported! 📤 Check your Downloads.");
  } catch (error) {
    showSettingsToast("Could not export the save file. 😕");
  }
}

// Ang NATIVE APK na bersyon ng export (tingnan ang paliwanag sa itaas
// ng exportSaveSlot) - isinusulat muna sa Directory.Cache ng app
// (LAGING pinapayagan ito ng Android na i-share, kahit walang dagdag
// na "file_paths.xml" config - tingnan ang opisyal na dokumentasyon ng
// @capacitor/share), tapos ang Android SHARE SHEET mismo ang bahalang
// magpakita kung saan/paano ito talaga ise-save/ipadala ng user.
async function exportSaveSlotViaNativeShare(fileName, json) {
  try {
    const { Filesystem, Share } = window.Capacitor.Plugins;

    await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: "CACHE",
      encoding: "utf8",
    });

    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: "CACHE",
    });

    await Share.share({
      title: "Save the AdventureLang save file",
      dialogTitle: "Where do you want to save/send the save file?",
      url: uri,
    });

    showSettingsToast(
      "Save exported! 📤 Choose where to save/send it.",
    );
  } catch (error) {
    // "Share cancelled" (kinansela lang ng user ang share sheet, hindi
    // talaga error) - huwag nang tumira ng "hindi ma-export" na toast
    // dito, para hindi nakakalito (buong sadya namang kinansela).
    const message = String(error?.message || error || "");

    if (/cancel/i.test(message)) return;

    showSettingsToast("Could not export the save file. 😕");
  }
}

// Binabasa ang na-upload na .json file (galing sa exportSaveSlot() sa
// itaas), tapos IDINADAGDAG (hindi pinapatungan) ito bilang BAGONG
// slot sa listahan ng save dito sa computer na ito - ligtas kaya
// kahit mayroon nang sariling save dito, hindi mabubura. Kung may
// bangga ang id (hal. na-import na dati), bibigyan na lang ito ng
// bagong id. Pagkatapos mag-import, kailangan pa ring "I-load" ng
// manlalaro ang bagong slot mula sa listahan (hindi ito basta agad
// nag-a-apply).
function importSaveFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let payload;

    try {
      payload = JSON.parse(reader.result);
    } catch (error) {
      showSettingsToast("Could not read this file. 😕");
      return;
    }

    if (
      !payload ||
      payload.type !== "adventureLangSaveExport" ||
      !payload.slot ||
      !payload.bundle
    ) {
      showSettingsToast("This is not a valid save file for this game. 😕");
      return;
    }

    try {
      const existingSlots = getSaveSlots();
      const existingIds = new Set(existingSlots.map((slot) => slot.id));

      let newId = payload.slot.id;

      if (!newId || existingIds.has(newId)) {
        newId =
          "slot_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      }

      // Mirror image of the "inflate" step in exportSaveSlot: an
      // imported file may have full house artwork embedded inline
      // (exteriorImageDataURL/interiorImageDataURL). Save each image
      // into THIS device's local asset store under a fresh assetId, and
      // slim the house record back down to just the reference - so the
      // stored slot stays small and consistent with every other slot
      // (and so re-saving from here on doesn't start duplicating this
      // imported artwork either).
      let bundleToStore = payload.bundle;

      if (typeof BUILDER_SAVE_KEY !== "undefined" && bundleToStore[BUILDER_SAVE_KEY]) {
        try {
          const parsed = JSON.parse(bundleToStore[BUILDER_SAVE_KEY]);

          if (Array.isArray(parsed.houses) && typeof saveBuilderAsset === "function") {
            for (const house of parsed.houses) {
              if (house.exteriorImageDataURL) {
                const assetId = saveBuilderAsset(house.exteriorImageDataURL);

                if (assetId) house.exteriorAssetId = assetId;
                delete house.exteriorImageDataURL;
              }
              if (house.interiorImageDataURL) {
                const assetId = saveBuilderAsset(house.interiorImageDataURL);

                if (assetId) house.interiorAssetId = assetId;
                delete house.interiorImageDataURL;
              }
            }
          }

          bundleToStore = { ...bundleToStore, [BUILDER_SAVE_KEY]: JSON.stringify(parsed) };
        } catch (error) {
          // If this fails, fall back to storing the bundle exactly as
          // given rather than blocking the import entirely.
        }
      }

      localStorage.setItem(
        SAVE_SLOT_DATA_PREFIX + newId,
        JSON.stringify(bundleToStore),
      );

      const mergedSlots = existingSlots.slice();

      mergedSlots.push({
        id: newId,
        name: payload.slot.name || defaultSaveSlotName(),
        savedAt: payload.slot.savedAt || Date.now(),
      });

      persistSaveSlotsIndex(mergedSlots);

      renderLoadSlotsList();

      showSettingsToast('Save imported! 📥 Press "Load".');
    } catch (error) {
      showSettingsToast("Could not import - storage is blocked. 😕");
    }
  };

  reader.onerror = () => {
    showSettingsToast("Could not read this file. 😕");
  };

  reader.readAsText(file);
}

document
  .getElementById("load-slots-import")
  ?.addEventListener("click", () => {
    document.getElementById("load-slots-import-file-input")?.click();
  });

document
  .getElementById("load-slots-import-file-input")
  ?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];

    if (file) importSaveFile(file);

    // I-reset ang value - kung hindi, hindi na "magba-fire" ang
    // "change" event kapag pinili ulit ng manlalaro ang PAREHONG file
    // sa susunod (hal. kung nag-cancel muna sya nang di sinasadya).
    event.target.value = "";
  });

document
  .getElementById("load-slots-close")
  ?.addEventListener("click", () => closeLoadSlotsPopup());

document.getElementById("load-slots-overlay")?.addEventListener("click", (event) => {
  // I-close lang kapag ang mismong DARK OVERLAY (background) ang
  // kinlick, hindi ang panel/laman sa loob nito.
  if (event.target.id === "load-slots-overlay") closeLoadSlotsPopup();
});

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

    // BAGO (hiling ng user: "yung sa settings sana yung pop up is lagay
    // sa gitna ng screen at medyo malaki natatabunan kasi ng minimap") -
    // dating naka-anchor lang ito sa ILALIM ng burger icon (top-right,
    // tabi-tabi ng #minimap - kaya madalas natatabunan/nagkakadikit sa
    // minimap doon). Ngayon, GITNA na ng screen palagi ito lumalabas
    // (centered=true) - dati "centered" LANG ito kapag binuksan sa
    // pamamagitan ng phone BACK button (mobile-controls.js), pero
    // ngayon ito na rin ang DEFAULT sa normal na pag-click ng burger
    // icon (tingnan ang .settings-menu-centered sa style.css - mas
    // malaki na rin ngayon ang laki nito doon).
    setSettingsMenuOpen(!settingsMenuOpen, true);
  });

// I-sara ang dropdown kapag nag-click kahit saan pa sa labas nito.
document.addEventListener("click", (event) => {
  if (!settingsMenuOpen) return;

  const menu = document.getElementById("settings-menu");

  if (menu && !menu.contains(event.target)) setSettingsMenuOpen(false);
});

document.getElementById("settings-menu-save")?.addEventListener("click", () => {
  setSettingsMenuOpen(false);

  // BAGO (hiling ng user): bawat "Save" ay gumagawa na ngayon ng
  // BAGONG slot (hindi na basta pinapatungan ang iisang laging-
  // parehong save) - hinihingan ng pangalan (opsyonal, may default na
  // may petsa/oras) gamit ang simpleng window.prompt().
  const name = window.prompt(
    "Name for this save (optional):",
    defaultSaveSlotName(),
  );

  // Cancel sa prompt (null) - huwag nang mag-save.
  if (name === null) return;

  saveGameToNewSlot(name);
  showSettingsToast("Game saved! 💾");
});

document.getElementById("settings-menu-load")?.addEventListener("click", () => {
  setSettingsMenuOpen(false);
  openLoadSlotsPopup();
});

document
  .getElementById("settings-menu-settings")
  ?.addEventListener("click", () => {
    setSettingsMenuOpen(false);
    openSettingsPanel();
  });

// AYOS (hiling ng user: "gusto ko lang may loading play load settings
// exit bago mag start") - hiniwalay ang aktwal na LOHIKA ng "Exit" sa
// sarili nitong function (`exitGame`), para magamit din ito ng BAGONG
// "Exit" button sa main menu (js/main-menu.js) - dating nasa loob lang
// ito ng click handler ng in-game na settings-menu-exit button.
function exitGame() {
  // BAGO (hiling ng user: "kapag pindutin ko yung save sa settings dun
  // lang mag save") - dating awtomatikong nagsa-save ito bago
  // isarado ang tab - TINANGGAL na ito, dahil "Save" button LANG dapat
  // ang nag-iisang paraan para talagang mai-save. Karamihan sa browser
  // ay hindi papayagan ang script na isara ang isang tab na hindi
  // naman binuksan ng script (window.close() - walang epekto/silently
  // fails) - kaya sinasabi na lang sa manlalaro na puwede na niyang
  // isara ang tab nang mano-mano.
  window.close();

  showSettingsToast(
    'You can close the tab now. (Reminder: hit "Save" first if you want to keep your progress.)',
  );
}

document.getElementById("settings-menu-exit")?.addEventListener("click", () => {
  setSettingsMenuOpen(false);
  exitGame();
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
      "Are you sure you want to delete ALL save data (inventory, dug tiles, trees, position) AND every save slot? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      for (const key of getAllSaveKeys()) {
        localStorage.removeItem(key);
      }

      // BAGO: burahin din ang LAHAT ng save SLOT (hindi lang ang
      // "live" na estado) - kung hindi, puwede pa ring "I-load" pabalik
      // ang isang lumang slot pagkatapos mag-reset, kaya hindi talaga
      // "malinis" ang simula.
      for (const slot of getSaveSlots()) {
        localStorage.removeItem(SAVE_SLOT_DATA_PREFIX + slot.id);
      }

      localStorage.removeItem(SAVE_SLOTS_INDEX_KEY);

      // Also clear uploaded house artwork (builder.js's separate asset
      // store) - it isn't part of getAllSaveKeys() by design (that's
      // what stops repeated Saves from duplicating it), so a full reset
      // needs its own step to actually clear it out too.
      if (typeof getAllBuilderAssetKeys === "function") {
        for (const key of getAllBuilderAssetKeys()) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // Naka-block ang localStorage - wala nang ibang magagawa dito.
    }

    location.reload();
  });
