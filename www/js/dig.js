// =========================
// PAGHUKAY NG NIYEBE (RAKE) AT PAGTATANIM (CAROTS)
// =========================
//
// Left click sa isang tile na malapit sa player:
//   - hawak ang rake: nahuhukay ang niyebe at nagiging lupa ang
//     tile na iyon. Isang click lang kada tile. Ang pickaxe ay pang-
//     bato na lang ngayon (tingnan ang resources.js) - hindi na ito
//     nakakahukay ng lupa.
//   - hawak ang binhi ng carrots: tinatamnan ang isang nahukay na
//     tile, o inaani ang tanim dito kung hinog na (tingnan ang
//     "PAGTATANIM NG CAROTS" sa ibaba).
//
// Ang mga nahukay na tile (kasama ang mga tanim dito) ay naka-save sa
// localStorage (kada mundo), kaya kahit mag-reload ka, lupa/tanim pa
// rin sila.
//
// HINDI puwedeng hukayin:
//   - ang mga cell na may bagay (puno, bato, bakod, bahay)
//   - ang mga cell na may collision box
//   - ang mga pintuan
//   - ang labas ng mapa, o ang mga mundong walang niyebe (sa loob ng bahay)
//   - ang malayo sa player

// =========================
// EQUIP NG PICKAXE / RAKE / BINHI NG CAROTS
// =========================
//
// Ang pickaxe/rake ay HIWALAY na grupo ng slot sa hotbar (tingnan ang
// hotbar.js), hindi bahagi ng numbered na inventory row - kaya "Alt+1"
// (pickaxe), "Alt+5" (rake) ang ginagamit dito, sa halip na basta
// "1"/"5". Ang binhi ng carrots naman ay carrot lang na i-nadrag/
// i-click sa loob ng 9-slot na inventory row (walang default na
// puwesto - tingnan ang activateHotbarSlot sa hotbar.js) - susunod ang
// digit shortcut nito (walang Alt) sa kung saan man ito kasalukuyang
// nakalagay.
//
// Ang "kamay" (pagdampot ng nakalapag na item / pag-ani ng hinog na
// tanim) ay HINDI na isang hiwalay na equippable na tool - awtomatiko
// na itong gumagana ngayon, kahit anong tool (o wala man) ang naka-equip,
// basta may maidadampot/maaani sa tinuturo ng mouse at abot ng player
// (tingnan ang hasHandActionAt/handleHandClick sa ibaba, at ang
// mousedown listener kung saan ito UNANG sinusubukan bago ang ibang
// tool).
//
// Isa lang sa mga kasangkapan (pickaxe/binhi/rake/axe/arrow/torch) ang
// puwedeng hawak nang sabay - ang paghawak ng isa ay nag-aalis sa iba
// (tingnan ang clearAllToolEquips). Kapag walang hawak na kahit ano:
// walang white box na lalabas sa mga tile (maliban kung may maidadampot/
// maaani - awtomatiko iyon), at walang mahuhukay/matatamnan.
//
// Puwede ring i-click ang mga slot sa hotbar/tool radial para gawin ang
// parehong bagay - ang mga function sa ibaba (equipPickaxe/equipRake)
// ang ginagamit ng pareho, para pareho lang ang estado kung saan man
// galing ang input. Ang "binhi"/carrot ay HINDI na kasama dito - ang
// RIGHT HAND ay para na lang sa TUNAY na kasangkapan (pickaxe/rake/axe) -
// ang pagtatanim ay "kamay" (default, tingnan ang canPlantCarrot sa
// ibaba) - LAGING available basta may stock, kahit anong tool ang
// naka-equip (pickaxe/axe/rake) o ano pa mang slot ang naka-highlight.

let pickaxeEquipped = false;
let rakeEquipped = false;

// Naka-highlight (naka-select - selectedInventorySlot sa hotbar.js) ba
// ngayon ang isang hotbar slot na may KAHIT ANONG crop (carrot/potato/
// cabbage/eggplant)?
//
// AYOS (multi-crop, hiling ng user: "i add mo na rin yung mga ibang
// vegetables... at pag plant at pag grow"): DATI, "purong cosmetic" na
// lang ito (hindi nagpapasya kung ano ang itatanim - IISA lang naman
// ang crop noon, laging carrot). NGAYON, dahil MAY APAT na uri na, ITO
// MISMO ang NAGPAPASYA kung ALIN ang itatanim (tingnan ang plantCarrot
// sa ibaba) - "gusto ko itanim gamit yung hotkey highlight" (hiling ng
// user sa naunang round) ang eksaktong disenyong ito: i-highlight ang
// crop sa hotbar, saka pindutin ang hinukay na lupa.
function getSelectedCropId() {
  if (typeof selectedInventorySlot === "undefined" || selectedInventorySlot === null) {
    return null;
  }

  if (typeof pinnedSlots === "undefined") return null;

  const itemId = pinnedSlots[selectedInventorySlot];

  return itemId && CROP_TYPES[itemId] ? itemId : null;
}

// Pinapanatili ang lumang pangalan (maraming tumatawag dito sa buong
// codebase) - ngayon, KAHIT ANONG naka-highlight na crop (hindi na
// "carrot" lang mismo) ang sinasagot nito.
function isCarrotSlotSelected() {
  return getSelectedCropId() !== null;
}

// Ang TANGING batayan ngayon kung "puwede nang magtanim" - kailangan
// muna NAKA-HIGHLIGHT ang isang crop (getSelectedCropId) AT may stock
// pa nito (tingnan ang paliwanag sa itaas ng isCarrotSlotSelected kung
// bakit nagbago ito mula sa dating "laging carrot, kahit ano ang
// naka-highlight").
function canPlantCarrot() {
  const cropId = getSelectedCropId();
  const crop = cropId ? CROP_TYPES[cropId] : null;

  return !!crop && crop.getCount() > 0;
}

// Kailangan munang i-CRAFT ang pickaxe/rake (tingnan ang
// CRAFT_SHAPED_RECIPES sa craft.js) bago maging equippable - naka-lock
// muna ang mga ito, kaya "empty"/walang epekto ang mga kaukulang slot
// sa Alt radial (tingnan ang tool-radial-locked sa style.css/index.html)
// at hindi rin gumagana ang Alt+1/5 keyboard shortcut habang false pa
// ito.
//
// "Unlocked" = TALAGANG na-INSTALL na sa tool radial (double-click sa
// bag - tingnan ang equipViaDoubleClick sa hotbar.js) - dito na lang
// ito equippable, at HINDI na ito makikita sa bag (getCount() → 0 -
// tingnan ang BAG_ITEMS sa hotbar.js).
let pickaxeUnlocked = false;
let rakeUnlocked = false;

// "InInventory" = bago pa lang na-CRAFT (nasa OUTPUT slot, na-drag na
// palabas papunta sa bag) - nakikita bilang NORMAL na item sa bag/
// hotbar (getCount() → 1), PERO hindi pa ito equippable/gumagana
// (parehong `equipPickaxe()`/`equipRake()` sa ibaba ay naka-guard pa
// rin sa `pickaxeUnlocked`/`rakeUnlocked`, hindi ito - kaya walang
// mangyayari kung i-click/i-drag mo lang ito sa hotbar) - kailangan
// pang i-DOUBLE CLICK (equipViaDoubleClick, hotbar.js) para talagang
// "i-install" (Unlocked = true, InInventory = false, kasabay na rin
// i-equip agad sa kamay).
let pickaxeInInventory = false;
let rakeInInventory = false;

// =========================
// TOOL DURABILITY (BAGONG HILING ng user, kasama ang axe sa resources.js)
// =========================
//
// "may duration na rin kada gamit siguro 50 trees, stones at pag hukay
// ng lupa max na yung 50 sa tatlo... strictly 1 per item kapag meron
// ulit another slot siya mapunta" - PANATILIHIN muna sa circle/tool
// radial ang pickaxe/rake/axe (HINDI sila lalabas sa bag/hotbar bilang
// item - nanatili ang dating desisyon), pero may LIMITADONG bilang na
// ngayon ng magagamit na "hits"/gawa (50, HIWALAY na counter bawat isa
// sa tatlo - hindi shared) bago ito "masira": isang buong puno na
// naputol (axe) / isang buong batong na-mina (pickaxe) / isang
// paghukay ng lupa (rake) ang bumabawas ng 1 dito (tingnan ang
// useToolDurability sa ibaba, at ang mga caller: registerHit sa
// resources.js para sa axe/pickaxe, digTile/destroyCarrot dito para sa
// rake). Pagdating sa 0: "SIRA" na ito (breakTool sa ibaba) - bumabalik
// itong parang hindi pa na-craft (naka-lock ulit sa radial, naka-
// unequip) - kailangan pang mag-craft ulit ng BAGO (fresh 50 durability
// ulit - tingnan ang collectCraftOutput, craft.js) bago ito magamit
// muli. May "broken" toast warning muna bago ito mangyari.
const TOOL_DURABILITY_MAX = 50;

let pickaxeDurability = 0;
let rakeDurability = 0;
// (axeDurability - resources.js, katabi ng axeUnlocked)

// Tinatawag sa TUWING TALAGANG NAGAMIT/nagtagumpay ang isang naka-
// equip na tool (isang buong puno/bato/paghukay) - "toolId" ay
// "pickaxe"/"rake"/"axe". Wala itong epekto kung hindi naman naka-
// unlock ang tool na iyon (hindi dapat mangyari, dahil kailangan munang
// naka-equip ito bago ito magamit, at kailangan munang naka-unlock bago
// ito ma-equip - safety net lang).
function useToolDurability(toolId) {
  if (toolId === "pickaxe") {
    if (!pickaxeUnlocked) return;

    pickaxeDurability = Math.max(0, pickaxeDurability - 1);

    if (pickaxeDurability <= 0) breakTool("pickaxe");
  } else if (toolId === "rake") {
    if (!rakeUnlocked) return;

    rakeDurability = Math.max(0, rakeDurability - 1);

    if (rakeDurability <= 0) breakTool("rake");
  } else if (toolId === "axe") {
    if (typeof axeUnlocked === "undefined" || !axeUnlocked) return;

    axeDurability = Math.max(0, axeDurability - 1);

    if (axeDurability <= 0) breakTool("axe");
  } else if (toolId === "cutter") {
    if (typeof cutterUnlocked === "undefined" || !cutterUnlocked) return;

    cutterDurability = Math.max(0, cutterDurability - 1);

    if (cutterDurability <= 0) breakTool("cutter");
  }

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Naubos na ang durability ng isang tool - "SIRA" na ito: bumabalik sa
// naka-lock na estado (parang hindi pa ito na-craft, tingnan ang
// tool-radial-locked sa tool-radial.js), at kusang naka-unequip (kung
// kasalukuyang naka-hawak) - kailangan pang mag-craft ulit ng bago.
function breakTool(toolId) {
  const label =
    toolId === "pickaxe"
      ? "Pickaxe"
      : toolId === "rake"
        ? "Rake"
        : toolId === "cutter"
          ? "Cutter"
          : "Axe";

  if (toolId === "pickaxe") {
    pickaxeUnlocked = false;
    pickaxeEquipped = false;
  } else if (toolId === "rake") {
    rakeUnlocked = false;
    rakeEquipped = false;
  } else if (toolId === "axe") {
    if (typeof axeUnlocked !== "undefined") axeUnlocked = false;
    if (typeof axeEquipped !== "undefined") axeEquipped = false;
  } else if (toolId === "cutter") {
    if (typeof cutterUnlocked !== "undefined") cutterUnlocked = false;
    if (typeof cutterEquipped !== "undefined") cutterEquipped = false;
  }

  if (typeof showSettingsToast === "function") {
    showSettingsToast(
      "Your " + label + " broke! You need to craft it again.",
    );
  }

  if (typeof syncToolRadialUI === "function") syncToolRadialUI();
  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Isa lang sa mga "right hand" na working tool (pickaxe/binhi/rake/
// axe) ang puwedeng hawak nang sabay - tinatawag ito ng bawat
// equip* function (dig.js/resources.js) BAGO nito itakda ang sarili
// nitong estado, para hindi na kailangang paulit-ulit isulat ang buong
// listahan kada isa.
//
// SADYANG hindi kasama dito ang arrowEquipped o torchEquipped - ang
// arrow ay "cursor mode" lang (tingnan ang equipArrow sa resources.js),
// at ang torch ay nasa IBANG kamay (left hand, hindi right hand -
// tingnan ang equipTorch sa resources.js) - parehong puwedeng kasabay
// ng kahit anong right-hand tool: hindi sila nag-aalis ng ibang naka-
// equip, at hindi rin sila naaalis ng ibang equip* function.
function clearAllToolEquips() {
  pickaxeEquipped = false;
  rakeEquipped = false;
  axeEquipped = false;
  if (typeof cutterEquipped !== "undefined") cutterEquipped = false;
}

function equipPickaxe() {
  if (!pickaxeUnlocked) return; // kailangan munang i-craft

  // BAGO (hiling ng user): "strictly use the pickaxe, axe and rake
  // only when have bag" - kailangan munang naka-"Use"/naka-suot ang
  // backpack (bagEquipped, tingnan ang hotbar.js) bago maging
  // magagamit ang alinman sa 3 "right hand" na working tool na ito.
  if (typeof bagEquipped !== "undefined" && !bagEquipped) {
    if (typeof showSettingsToast === "function") {
      showSettingsToast("You need to equip a bag first! 🎒");
    }
    return;
  }

  const wasEquipped = pickaxeEquipped;

  clearAllToolEquips();
  pickaxeEquipped = !wasEquipped;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

// Panghukay ng lupa (dating gawi ng pickaxe) - ang pickaxe naman ay
// pang-bato na lang (tingnan ang resources.js).
function equipRake() {
  if (!rakeUnlocked) return; // kailangan munang i-craft

  if (typeof bagEquipped !== "undefined" && !bagEquipped) {
    if (typeof showSettingsToast === "function") {
      showSettingsToast("You need to equip a bag first! 🎒");
    }
    return;
  }

  const wasEquipped = rakeEquipped;

  clearAllToolEquips();
  rakeEquipped = !wasEquipped;

  if (typeof syncHotbarUI === "function") syncHotbarUI();
}

document.addEventListener("keydown", (event) => {
  // BUGFIX - tingnan ang isTypingInTextField (input.js).
  if (typeof isTypingInTextField === "function" && isTypingInTextField(event)) return;

  if (event.altKey && event.key === "1") {
    event.preventDefault();
    equipPickaxe();
  } else if (event.altKey && event.key === "5") {
    event.preventDefault();
    equipRake();
  } else if (!event.altKey && event.key >= "1" && event.key <= "9") {
    // Kada digit (1-9) - kaparehong epekto ng pag-click mismo sa slot na
    // iyon sa hotbar (tingnan ang activateHotbarSlot sa hotbar.js): kung
    // nasaan man ang binhi (seedSlotIndex, puwedeng nailipat na), doon
    // nito ie-equip; kung may laman ang slot, doon nag-toggle ang gold
    // highlight; walang laman, walang gagawin.
    if (typeof activateHotbarSlot === "function") {
      activateHotbarSlot(Number(event.key));
    }
  }
});

// Umuulan ba ng niyebe ngayon (bilang PANAHON, hindi bilang epekto)?
// Direkta sa kalendaryo ang tingin (calendar.js) - hindi sa
// getSnowIntensity - dahil ang getSnowIntensity ay nagiging 0 sa loob
// ng bahay, pero ang panahon sa labas ay tuloy-tuloy kahit nasa loob ka.
function isSnowWeather() {
  return getCalendarState().isSnowDay;
}

// Kailan nagsimula ang kasalukuyang pag-ulan ng niyebe? Buong "araw"
// (DAY_NIGHT_SECONDS) ang tagal ng isang snow day, kaya ang simula
// nito ay simula rin ng kasalukuyang araw.
function getSnowStartedAtMs() {
  const secondsIntoDay = (getGameNow() / 1000) % DAY_NIGHT_SECONDS;

  return getGameNow() - secondsIntoDay * 1000;
}

// Araw ba ng niyebe ang KAHAPON (totalDays - 1)? Ginagamit ito ng
// getGrassProgress sa ibaba para malaman kung dapat pa unti-unting
// tumubo ang damo ngayong araw (bagong tigil lang), o buong damuhan na
// dahil matagal nang walang niyebe.
function wasYesterdaySnowDay() {
  return isSnowDayForTotalDays(getTotalDaysElapsed() - 1);
}

// Ang mga tile ng nahukay na lupa ay hango sa mga EXISTING na ground-
// texture na tileset na ginagamit na rin sa background ng mapa mismo
// (new-ground.tsj/grass2.png para sa dirt/grass, ground-assets.tsj/
// ground-assets.png para sa wet) - PINILI ITO DAHIL PATUNAY na ito ay
// talagang naglo-load nang tama sa browser.
//
// BAKIT HINDI NA "Tiles.tsx" (dating ginagamit dito): SIRA ang <image
// source> nito - tumuturo ito sa "../../../../../Downloads/assets.png",
// isang path sa personal na computer ng dating developer na wala sa
// project, kaya PALAGING nabibigo itong mag-load. Dahil doon, hindi na
// dapat lumabas ang gid ng Tiles.tsx kahit saan - PERO nagkataong may
// ISA PANG tileset (dirt.tsx) na PAREHONG-PAREHO ang firstgid nito sa
// Tiles.tsx sa loob ng newmap.tmj/snowMap.tmj (parehong 12289) - dahil
// dun, ang dirt.tsx (na tumuturo naman sa vegetableList.png - larawan
// ng GULAY, hindi lupa) ang siyang "nag-agaw" at NA-LOAD sa lugar ng
// Tiles.tsx sa runtime. Kaya ang "dirt" gid na kino-compute gamit ang
// firstgid ng Tiles.tsx ay random na PIXEL NG GULAY pala ang nakukuha -
// berde ang kulay, kaya MUKHANG DAMO PA RIN kahit nag-rake ka na
// (parang "walang nangyayari"). Ito ang dating bug - tingnan ang git
// history/CLAUDE.md para sa detalye.
//
// Ang bagong solusyon: gumamit na lang ng tileset na PATUNAY nang
// gumagana (parehong ginagamit din ng "dirt"/"wet_dirt"/"grass" layers
// mismo sa loob ng newmap.tmj), at may EXTRA VERIFICATION (tingnan ang
// findLoadedTilesetFirstgid sa ibaba) na TALAGANG na-load ang tamang
// larawan bago ito gamitin - para hindi na maulit ang parehong klase ng
// bug kung sakaling magbago pa ang mapa sa hinaharap.
const DIRT_GRASS_TILESET_FILE = "new-ground.tsj"; // larawan: grass2.png
const WET_TILESET_FILE = "ground-assets.tsj"; // larawan: ground-assets.png

// Mga posisyon (local id) sa loob ng bawat tileset - kinuha mula sa mga
// tile na PATUNAY nang gumagana (ginagamit na rin ng "dirt"/"grass"
// layers mismo sa newmap.tmj).
const DIRT_LOCAL_ID = 129; // grass2.png, hilera 8 hanay 1 - malinis na tuyong lupa
const WET_DIRT_LOCAL_ID = 41; // ground-assets.png, hilera 2 hanay 11 - mas madilim/mamasa-masang lupa

// DAMO (grass) - PINAGSAMA ngayon ang DALAWANG variant mula sa grass2.png:
//   1) "plain" - yung payak/walang-dekorasyong berdeng damo (2x4 block ng
//      variant, base local id 22) - ITO ang MADALAS na lalabas.
//   2) "decorated" - yung may bulaklak/bato (4x4 block ng variant, base
//      local id 27) - BIHIRA lang, parang mga natural na "patch"/kalat
//      sa pana-panahon, hindi paulit-ulit kada tile.
// Parehong ginagamit din ang parehong dalawang block na ito ng "grass"
// LAYER mismo sa newmap.tmj (tingnan ang getGrassLocalId sa ibaba) -
// kaya magkatugma ang itsura ng damo na TALAGANG nakapinta sa mapa
// (Tiled) at ng damo na dynamic na "tumutubo" pagkatapos manghukay/
// lumipas ang niyebe.
const GRASS_PLAIN_BASE_LOCAL_ID = 22; // grass2.png, hilera 2 hanay 7 - payak na damo
const GRASS_PLAIN_COLS = 2;
const GRASS_PLAIN_ROWS = 4;

const GRASS_DECOR_BASE_LOCAL_ID = 27; // grass2.png, hilera 2 hanay 12 - may bulaklak/bato
const GRASS_DECOR_COLS = 4;
const GRASS_DECOR_ROWS = 4;

// Porsyento (0-99) ng bawat tile na magiging "decorated" sa halip na
// "plain" - mababa dapat (bihira lang dapat lumabas ang bulaklak/bato,
// hindi dapat sabay-sabay/paulit-ulit kada ilang hakbang).
const GRASS_DECOR_CHANCE_PERCENT = 15;

// WET-DIRT (habang umuulan, tingnan ang drawGrass sa ibaba) - kinuha rin
// mula sa grass2.png (kaparehong-paraan ng GRASS_PLAIN/GRASS_DECOR sa
// itaas - 4x4 block ng variant, para may natural na pagkakaiba-iba kada
// tile sa halip na paulit-ulit lang), mula sa card na NASA GITNA ng
// png (hilera 2 hanay 2 sa 3x3 na pagkaka-ayos ng mga card - payak na
// maputik na lupa, walang bakas ng paa/puddle/bato na sumisira sa
// pattern kapag paulit-ulit na ikinalat sa mga tile). Dati'y galing ito
// sa card ng "bakas ng paa" (bottom-left) - MALI iyon dahil kitang-kita
// ang mga bakas kapag na-tile paulit-ulit. INNER lang ang kinukuha (base
// local id 102 = hilera 7 hanay 7, 4x4 block hanggang hilera 10 hanay
// 10, 0-based) - iniiwasan ang emboss/anino sa gilid ng bawat card
// (tingnan ang mga bg-gutter sa paligid ng bawat 3x3 card sa png mismo).
const RAIN_WET_DIRT_BASE_LOCAL_ID = 102; // grass2.png, hilera 7 hanay 7 (gitnang card) - payak na maputik na lupa
const RAIN_WET_DIRT_COLS = 4;
const RAIN_WET_DIRT_ROWS = 4;

// SNOW GROUND (habang umuulan ng niyebe, tingnan ang drawSnowGroundCover
// sa ibaba) - kinuha mula sa Snow.tsx/Snow.png (parehong tileset na
// pinagmumulan na rin ng bahay/puno/bakod na naka-baked sa "house"/
// "trees"/"fence" layers ng newmap.tmj, tingnan ang shouldUseClearArt
// sa ibaba - dati puting fillRect() lang ang niyebe sa lupa, ngayon
// TUNAY na na niyebeng texture mula rito).
//
// SNOW_TILESET_FILE - hiwalay ito sa DIRT_GRASS_TILESET_FILE (na para
// sa normal na damo/putik) - ang Snow.tsx ang naglalaman ng lahat ng
// "winter" na art (bahay-may-niyebe, puno-may-niyebe, atbp.), kaya doon
// din tayo kukuha ng plain na snow-ground texture, para magkatugma ang
// kulay/texture ng lupa sa ibang bagay na "naniniyebe" na rin.
const SNOW_TILESET_FILE = "Snow.tsx"; // larawan: Snow.png
const SNOW_TILESET_COLUMNS = 96;

// Local id ng isang payak/walang-dekorasyong snow-ground swatch sa loob
// ng Snow.png - hilera 9 hanay 9 (1-based, 0-based row 8 col 8), isang
// 16x16 na texture na PAULIT-ULIT (repeating) - VERIFIED sa pamamagitan
// ng direktang pag-inspect sa larawan (tingnan ang git history/paalala
// kung babaguhin pa ito - hindi ito basta hula, sinukat gamit ang alpha
// bounding box ng bawat swatch sa loob ng png).
const SNOW_GROUND_LOCAL_ID = 776;

// May IISANG swatch lang na available sa Snow.png para sa snow-ground
// (hindi tulad ng grass/wet-dirt sa grass2.png na may 4x4 block ng
// variant) - kaya kapag paulit-ulit itong na-tile nang WALANG pagbabago,
// KITANG-KITA ang parehong diagonal na guhit kada 16px, parang grid ng
// seams (VERIFIED sa screenshot: "pangit" ayon sa feedback). Sa halip
// na maghanap ng bagong larawan, ginagamit natin ang FLIP FLAGS na
// suportado na ng drawTile (parehong mekanismo ng Tiled) - random pero
// DETERMINISTIC na h/v flip kada (col,row), kaya nag-iiba ang direksyon
// ng streak kada tile sa halip na laging pareho - nasisira ang
// "conveyor belt" na tingin kahit IISANG source pixel lang ang ginagamit.
const SNOW_GROUND_FLIP_H = 0x80000000;
const SNOW_GROUND_FLIP_V = 0x40000000;

function getSnowGroundVariantGid(baseGid, col, row) {
  // Ibang seed offset (hindi grassVariantRoll(col,row) mismo) para hindi
  // magkatugma ang flip pattern dito sa decor chance ng damo (magkaibang
  // sistema, walang dapat na koneksyon sa isa't isa).
  const roll = grassVariantRoll(col + 7919, row + 7919) % 4;

  if (roll === 1) return baseGid | SNOW_GROUND_FLIP_H;
  if (roll === 2) return baseGid | SNOW_GROUND_FLIP_V;
  if (roll === 3) return baseGid | SNOW_GROUND_FLIP_H | SNOW_GROUND_FLIP_V;

  return baseGid;
}

// Simpleng deterministic "hash" base sa (col, row) - PAREHO palagi ang
// resulta ng parehong tile (hindi nagbabago kada frame/kada laro), pero
// kalat/hindi halatang paulit-ulit ang pattern (hindi tulad ng basta
// modulo lang) - kaya natural ang tingin ng saan lalabas ang bulaklak.
function grassVariantRoll(col, row) {
  let h = (col * 92821 + row * 68917) >>> 0;

  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;

  return h % 100;
}

// Pinipili ang partikular na variant (plain o decorated, tapos kung
// alin sa loob ng block na iyon) base sa ABSOLUTE tile position (col,
// row) sa mapa - kaya pare-pareho/hindi nagbabago ang variant sa bawat
// partikular na tile, at magkatugma pa rin sa pattern na ginagamit ng
// nakapintang "grass" layer.
function getGrassLocalId(col, row) {
  if (grassVariantRoll(col, row) < GRASS_DECOR_CHANCE_PERCENT) {
    const colOff = (((col % GRASS_DECOR_COLS) + GRASS_DECOR_COLS) % GRASS_DECOR_COLS);
    const rowOff = (((row % GRASS_DECOR_ROWS) + GRASS_DECOR_ROWS) % GRASS_DECOR_ROWS);

    return GRASS_DECOR_BASE_LOCAL_ID + colOff + rowOff * 16;
  }

  const colOff = (((col % GRASS_PLAIN_COLS) + GRASS_PLAIN_COLS) % GRASS_PLAIN_COLS);
  const rowOff = (((row % GRASS_PLAIN_ROWS) + GRASS_PLAIN_ROWS) % GRASS_PLAIN_ROWS);

  return GRASS_PLAIN_BASE_LOCAL_ID + colOff + rowOff * 16;
}

// Kaparehong-pareho ng gawi ng getGrassLocalId sa itaas, pero para sa
// RAIN_WET_DIRT block (tingnan ang paliwanag sa itaas) - ginagamit ito
// ng drawGrass sa halip na getGrassLocalId sa mga tile na "binasa" ng
// ulan.
function getRainWetDirtLocalId(col, row) {
  const colOff = (((col % RAIN_WET_DIRT_COLS) + RAIN_WET_DIRT_COLS) % RAIN_WET_DIRT_COLS);
  const rowOff = (((row % RAIN_WET_DIRT_ROWS) + RAIN_WET_DIRT_ROWS) % RAIN_WET_DIRT_ROWS);

  return RAIN_WET_DIRT_BASE_LOCAL_ID + colOff + rowOff * 16;
}

// Gaano katagal bago maging basa ang bagong hukay na lupa (tuyo -> basa),
// gaano katagal ito manatiling basa bago matuyo ulit kapag walang tanim
// (basa -> tuyo), at gaano katagal pagkatapos noon bago ito bumalik sa
// likas na lupa - niyebe o damo (tuyo -> likas).
//
// BAGO (hiling ng user): "babalik lang sa dating tile kapag di
// nakapag tanim ng ilang segundo lang 10sec" - dating 25 segundo
// (5+10+10) ang BUONG cascade bago bumalik sa damo ang isang
// hinukay-pero-WALANG-TANIM na tile - pinaikli na sa TOTAL na 10
// segundo (3+4+3), pareho pa rin ang proporsyon ng bawat stage
// (tuyo -> basa -> tuyo -> likas). HINDI ito nagbabago kung MAY TANIM
// na (record.seed) - iyon ay hiwalay na check (tingnan ang
// updateGroundWeather/drawDugTiles sa ibaba), laging pinapanatili ang
// itsura ng TALAGANG itinanim hanggang sa maani.
const WET_DIRT_DELAY_MS = 3000;
const DIRT_AGAIN_DELAY_MS = 4000;
const GRASS_REVERT_DELAY_MS = 3000;
const DUG_REVERT_MS =
  WET_DIRT_DELAY_MS + DIRT_AGAIN_DELAY_MS + GRASS_REVERT_DELAY_MS;

// BAGO (hiling ng user): "mawawala yung dig babalik sa dati after 3 mins
// ng walang tanim" - sa LOOB ng Garden House ay MAS MAHABA ang palugit
// kaysa sa labas (10 segundo lang doon). May dahilan ito: ang taniman sa
// loob ay maliit at nakapirmi (84 tile lang), kaya sayang na sayang kung
// mabibilis mawawala ang inararo mo habang naghahanap ka pa ng binhi.
// Sa sandaling MAY TANIM na, hindi na ito nagagalaw ng orasan (parehong
// patakaran sa labas) - hanggang sa maani.
const INDOOR_DUG_REVERT_MS = 3 * 60 * 1000;

// Ilang milliseconds bago bumalik sa dati ang isang HINUKAY PERO hindi
// natamnan na tile sa mundong kinaroroonan ngayon.
function getDugRevertMs() {
  const world = typeof getWorld === "function" ? getWorld() : null;

  return world && world.outdoor === false ? INDOOR_DUG_REVERT_MS : DUG_REVERT_MS;
}

// Ang isang katatapos lang aniin na tile (record.harvested) ay hindi
// dumadaan sa buong wet->dry->grass na cascade sa itaas - bumabalik na
// lang agad ito sa likas na lupa (damo/niyebe) 1 minuto pagkatapos.
const CARROT_HARVEST_REVERT_MS = 60000;

let digGidCache = null;
let digGidCacheWorld = null;

// =========================
// SUNDIN NA LANG ANG NAKA-PAINT NA LAYER SA .tmj (grass/dirt/wet_dirt/
// snow) SA HALIP NA GUMAWA NG SARILING VARIANT
// =========================
//
// VERIFIED: puno na pala ng tamang variant ang newmap.tmj mismo - may
// hiwalay na "grass", "dirt", "wet_dirt", at "snow" na layer, BUONG
// 70x40 na mapa ang saklaw (walang blangkong cell), may ilang unique
// gid bawat isa (hal. 24 variant sa "grass", 4 sa "snow") - ibig
// sabihin, ITO na mismo ang TAMANG texture na ginawa/pinili ng may-ari
// ng mapa sa Tiled, hindi na kailangang mag-imbento pa tayo ng sarili
// nating hash-based na variant (getGrassLocalId/getRainWetDirtLocalId/
// atbp. sa itaas) - sapat nang basahin ang gid na NAKA-PAINT NA doon sa
// (col, row) na iyon.
//
// Kaya dito, PINIPILI muna ang gid mula sa ATING layer bago sumubok ng
// kahit ano pa - bumabalik lang sa lumang paraan (hash/flat constant)
// kung WALANG ganitong layer sa kasalukuyang mundo (hal. starterMap.tmj/
// snowMap.tmj/houseInside.tmj) o kung 0/wala talagang laman doon sa
// partikular na cell na iyon.
let groundLayerCache = null;
let groundLayerCacheWorld = null;

function findMapLayerByName(name) {
  if (!mapData || !mapData.layers) return null;

  for (const layer of mapData.layers) {
    if (layer.type === "tilelayer" && layer.name === name) return layer;
  }

  return null;
}

function getGroundLayer(name) {
  if (groundLayerCacheWorld !== currentWorld) {
    groundLayerCache = {};
    groundLayerCacheWorld = currentWorld;
  }

  if (!(name in groundLayerCache)) {
    groundLayerCache[name] = findMapLayerByName(name);
  }

  return groundLayerCache[name];
}

// Ibinabalik ang gid na NAKA-PAINT sa layer na "name" sa (col, row) -
// 0 kung walang layer noon, o kung blangko ang cell na iyon (parehong
// kahulugan ng "wala/gumamit na lang ng fallback").
function getPaintedGroundGid(name, col, row) {
  const layer = getGroundLayer(name);

  if (!layer || !layer.data) return 0;
  if (col < 0 || row < 0 || col >= layer.width || row >= layer.height) return 0;

  return layer.data[row * layer.width + col] || 0;
}

// Hinahanap ang firstgid ng isang tileset base sa filename nito
// (mapData.tilesets, ang HILAW na listahan mula sa .tmj) - PERO bago ito
// ibalik, KAILANGAN MUNANG PATUNAYAN na TALAGANG na-load ang larawan
// nito sa runtime (ang `tilesets` array sa map.js, puro mga SUCCESSFULLY
// LOADED na tileset lang ang laman) SA PARE-PAREHONG firstgid at bilang
// ng columns. Kung hindi tumugma (nabigo itong mag-load, o may ibang
// tileset na "nag-agaw" ng parehong firstgid dahil sa magkatapat na
// numero sa .tmj - eksaktong ito ang nangyari dati sa Tiles.tsx/dirt.tsx,
// tingnan ang malaking paliwanag sa itaas), ibinabalik ang null sa halip
// na basta gamitin - mas maganda ang tamang fallback kaysa sa SILENT na
// maling larawan.
function findLoadedTilesetFirstgid(sourceFile, expectedColumns) {
  const entry = (mapData.tilesets || []).find((tileset) => {
    if (!tileset.source) return false;

    const base = tileset.source.replace(/\\/g, "/").split("/").pop();

    return base === sourceFile;
  });

  if (!entry) return null;

  const loaded =
    typeof tilesets !== "undefined"
      ? tilesets.find((t) => t.firstgid === entry.firstgid)
      : null;

  if (!loaded || loaded.columns !== expectedColumns) return null;

  return entry.firstgid;
}

function getDigGids() {
  if (!mapData) return null;

  if (digGidCache && digGidCacheWorld === currentWorld) return digGidCache;

  const dirtGrassFirstgid = findLoadedTilesetFirstgid(
    DIRT_GRASS_TILESET_FILE,
    16,
  );
  const wetFirstgid = findLoadedTilesetFirstgid(WET_TILESET_FILE, 15);

  // Para sa TUNAY na snow-ground texture (drawSnowGroundCover) - hiwalay
  // itong lookup dahil hiwalay ding tileset (Snow.tsx) ang pinagmumulan,
  // may sarili itong verification (findLoadedTilesetFirstgid) kaya kung
  // sakaling hindi ito ma-load nang tama sa isang mundo, `null` ang
  // ibabalik at babalik na lang sa dating puting overlay (tingnan ang
  // drawSnowGroundCover) sa halip na magpakita ng maling larawan.
  const snowFirstgid = findLoadedTilesetFirstgid(
    SNOW_TILESET_FILE,
    SNOW_TILESET_COLUMNS,
  );

  if (dirtGrassFirstgid !== null) {
    digGidCache = {
      dirt: dirtGrassFirstgid + DIRT_LOCAL_ID,
      // Hindi na iisang gid - itinatago na lang ang firstgid, dahil
      // may 4x4 na VARIANT ang damo ngayon (tingnan ang
      // getGrassLocalId/getGrassGid sa itaas/ibaba, ginagamit sa
      // drawGrass base sa (col, row)).
      grassFirstgid: dirtGrassFirstgid,
      // Kung walang (o nabigong mag-load ang) ground-assets.tsj sa
      // mundong ito, gamitin na lang ang dirt gid din bilang wet - hindi
      // bibida ang "basa" na itsura, pero tama pa rin ang tuyong lupa.
      wet:
        wetFirstgid !== null
          ? wetFirstgid + WET_DIRT_LOCAL_ID
          : dirtGrassFirstgid + DIRT_LOCAL_ID,
      snow: snowFirstgid !== null ? snowFirstgid + SNOW_GROUND_LOCAL_ID : null,
    };
  } else {
    // Walang new-ground.tsj ang mundong ito (hal. starterMap.tmj) -
    // gumamit na lang ng lumang lupa mula sa Snow.tsx para may makita
    // pa rin. Walang grass.
    digGidCache = {
      dirt: 411,
      wet: 411,
      grassFirstgid: null,
      snow: snowFirstgid !== null ? snowFirstgid + SNOW_GROUND_LOCAL_ID : null,
    };
  }

  digGidCacheWorld = currentWorld;

  return digGidCache;
}

// =========================
// NAKA-SAVE NA MGA NAHUKAY
// =========================

const DIG_SAVE_KEY = "tralala.dugTiles";

// { village: { "col,row": true, ... }, houseInside: { ... } }
let dugTiles = loadDugTiles();

function loadDugTiles() {
  try {
    const raw = localStorage.getItem(DIG_SAVE_KEY);

    if (!raw) return {};

    const saved = JSON.parse(raw);

    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    // Sirang laman o naka-block ang localStorage - magsimula sa wala.
    return {};
  }
}

// BAGO (hiling ng user: "ayoko na ng auto save") - "force" param,
// default false - tingnan ang paliwanag sa savePlayerPosition (player.js)
// para sa buong disenyo nito.
function saveDugTiles(force = false) {
  if (!force) return;

  try {
    localStorage.setItem(DIG_SAVE_KEY, JSON.stringify(dugTiles));
  } catch (error) {
    // Hindi kritikal - tuloy lang ang laro, wala lang matatandaan.
  }
}

function getDugTilesForCurrentWorld() {
  if (!currentWorld) return null;

  if (!dugTiles[currentWorld]) {
    dugTiles[currentWorld] = {};
  }

  return dugTiles[currentWorld];
}

// =========================
// ALING CELL ANG MAY BAGAY?
// =========================
//
// Ang mga puno/bato/bakod/bahay ay tile layers - hindi lahat ng parte
// nila ay may collision box (ang dahon ng puno, halimbawa, ay
// nalalakaran). Kaya bukod sa collision check, kailangan din nating
// malaman kung aling mga cell ang MAY TILE sa mga overlap layer, para
// hindi ka makapaghukay sa ilalim ng dahon - matatakpan lang ng puno
// ang lupa mo doon.
//
// Kino-compute ito nang isang beses kada pagpasok sa isang mundo, tapos
// naka-cache na.

let objectCellCache = null;
let objectCellCacheWorld = null;

function getObjectCells() {
  if (!mapReady || !mapData) return null;

  if (objectCellCache && objectCellCacheWorld === currentWorld) {
    return objectCellCache;
  }

  const occupied = new Set();

  for (const layer of flattenTileLayers(mapData.layers)) {
    if (!isOverlapLayer(layer)) continue;

    for (let i = 0; i < layer.data.length; i++) {
      if (layer.data[i]) {
        occupied.add((i % layer.width) + "," + Math.floor(i / layer.width));
      }
    }
  }

  objectCellCache = occupied;
  objectCellCacheWorld = currentWorld;

  return occupied;
}

// =========================
// PUWEDE BANG HUKAYIN?
// =========================

function canDigAt(col, row) {
  if (!mapReady || !mapData || worldLoading) return false;

  const world = getWorld();

  if (!world) return false;

  // BAGO (hiling ng user): ang GARDEN HOUSE (building template, tingnan
  // ang `plantableTileRects` sa builder.js) ay may TUNAY na lupa sa
  // loob - ito ang TANGING butas sa dating "walang mahuhukay sa loob ng
  // bahay" na patakaran, at MAHIGPIT ito: TANGING ang mga tile na NASA
  // LOOB mismo ng iginuhit na lupa ang puwede (hindi ang kahoy na
  // daanan sa gitna, hindi ang paligid) - kaya hindi mo mabubutas ang
  // sahig ng kahit anong ibang interior.
  const plantableIndoorTile =
    world.outdoor === false &&
    typeof isBuilderPlantableTile === "function" &&
    isBuilderPlantableTile(currentWorld, col, row);

  // Sa labas lang may niyebe - walang mahuhukay sa loob ng bahay
  // (MALIBAN sa taniman ng Garden House sa itaas).
  if (!world.outdoor && !plantableIndoorTile) return false;

  if (col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) {
    return false;
  }

  // Nahukay na.
  const dug = getDugTilesForCurrentWorld();

  if (dug && dug[col + "," + row]) return false;

  // May bagay (puno, bato, bakod, bahay) sa cell na ito.
  const objectCells = getObjectCells();

  if (objectCells && objectCells.has(col + "," + row)) return false;

  const tileX = col * mapData.tilewidth;
  const tileY = row * mapData.tileheight;
  const tileBox = {
    x: tileX,
    y: tileY,
    width: mapData.tilewidth,
    height: mapData.tileheight,
  };

  // May collision box sa cell na ito.
  if (collisions.some((box) => isColliding(tileBox, box))) return false;

  // Pintuan - huwag hukayin, dadaanan iyan.
  for (const door of DOORS) {
    if (door.world === currentWorld && isColliding(tileBox, door.area)) {
      return false;
    }
  }

  return true;
}

// Abot ba ng pickaxe ang tile? ISANG TILE lang ang abot: ang tile na
// kinatatayuan ng player at ang 8 tile sa paligid nito.
function isTileInReach(col, row) {
  const box = getPlayerCollisionBox();

  const playerCol = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  const playerRow = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  return Math.abs(col - playerCol) <= 1 && Math.abs(row - playerRow) <= 1;
}

// BAGO (hiling ng user): "gusto ko yung character dapat nakaharap sa
// mismong may mga function lang para ma use" - hindi na sapat na basta
// ABOT (isTileInReach) - dapat TALAGA ring NAKAHARAP (player.direction)
// ang player papunta sa tile bago niya ito magamit (stove/crafter/bed
// - tingnan ang mousedown listener sa ibaba). Gumagamit ng SHARED na
// helper (isPlayerFacingWorldPoint, collisions.js) - tile CENTER
// (pixel) ang ipinapasa dito.
function isPlayerFacingTile(col, row) {
  if (typeof isPlayerFacingWorldPoint !== "function") return true;

  const targetX = col * TILE_SIZE + TILE_SIZE / 2;
  const targetY = row * TILE_SIZE + TILE_SIZE / 2;

  return isPlayerFacingWorldPoint(targetX, targetY);
}

// =========================
// "E" PARA GAMITIN ANG CRAFTER/STOVE/LIGHT/BED (bagong hiling ng user)
// =========================
//
// "yung pag pindot is dapat e na lang sa crafter, lamp, bed at stove
// press 'e' na lang" - TINANGGAL na ang left-click bilang paraan ng
// paggamit ng mga ito (tingnan ang mousedown listener sa ibaba) -
// kaparehong-pareho na ngayon ito ng gawi ng mga PINTUAN (E, worlds.js
// - getDoorUnderPlayer/getUsableDoor) - tingnan ang paggamit nito sa
// update.js.
//
// AYOS (hiling ng user): "dapat strictly nakaharap lang yung character
// sa item tsaka lang ma press e ... kung ano lang laki ng tiles nila
// like sa crafter is 2 tiles lang so dapat 2 tile lang sakop niya na
// lilitaw yung e, kung anong pwesto niya dun lang pwede ma-i at
// nakaharap doon" - dating gumagamit ng generic na 2-TILE na "radius"
// PALIGID ng player (STRUCTURE_REACH_OFFSETS + isTileInPlacementRange,
// tingnan sa mismong git history/comment sa ibaba) - masyadong MALUWAG
// ito: puwede pang gamitin ang isang structure kahit 2 tile pa ang
// layo AT hindi mismo naka-tapat dito (basta nasa loob ng malawak na
// 45-degree cone). Ngayon, EKSAKTO na lang sa AKTWAL na footprint ng
// BAWAT structure mismo (PLACEMENT_FOOTPRINTS, placement.js - hal. 2
// tile pahalang ang Crafter/Stove) ang sinasakop - KATABI (1 tile lang,
// hindi na 2) ng ISA sa mga cell nito AT diretsong NAKAHARAP doon
// (isPlayerFacingTile) - hindi na basta-basta kahit saan sa loob ng
// isang malawak na bilog/cone sa paligid ng player.

// Katabi lang (1 tile, Chebyshev distance) ba ang player sa partikular
// na tile na ito - hindi kasama ang MISMONG kinatatayuan niya (0).
function isPlayerAdjacentToTile(col, row) {
  const box =
    typeof getPlayerCollisionBox === "function" ? getPlayerCollisionBox() : null;

  if (!box) return false;

  const playerCol = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  const playerRow = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  const distance = Math.max(Math.abs(col - playerCol), Math.abs(row - playerRow));

  return distance === 1;
}

// Puwede bang gamitin (E) ang isang structure na "itemId" na naka-lagay
// sa (col, row - ang ANCHOR/top-left tile nito, tingnan ang
// getPlacementFootprintCells) - KATABI AT NAKAHARAP ba ang player sa
// ISA (kahit alin) sa mga AKTWAL na tile ng buong footprint nito? Kaya
// eksaktong "sakop" lang ng structure (hal. 2 tile ang Crafter/Stove, 1
// tile ang Light, 2x3 ang Bed) ang puwedeng pagmulan ng "E" - hindi na
// lumalampas pa sa isang generic na radius sa paligid ng player.
function isStructureUsableFromPlayer(itemId, col, row) {
  const cells =
    typeof getPlacementFootprintCells === "function"
      ? getPlacementFootprintCells(itemId, col, row)
      : [{ col, row }];

  return cells.some(
    (cell) =>
      isPlayerAdjacentToTile(cell.col, cell.row) &&
      isPlayerFacingTile(cell.col, cell.row),
  );
}

// Alin (kung meron man) na naka-lagay na Crafter/Stove/Light/Bed ang
// puwede nang gamitin ngayon gamit ang "E" - { type, target } o null.
// Tingnan ang paggamit nito sa update.js (eKeyDown, kaparehong-pareho
// ng getUsableDoor). Dumaraan na ngayon DIRETSO sa mismong listahan ng
// bawat naka-lagay na structure (placedCrafters/placedStoves/
// placedLights/placedBeds) sa halip na mag-scan ng isang generic na
// radius ng mga tile sa paligid ng player (tingnan ang paliwanag sa
// itaas) - kaya AKTWAL na footprint mismo ng bawat isa (isStructureUsableFromPlayer)
// ang batayan. Kung MARAMI ang kasabay na "usable" (bihira, magkalapit
// na structure), ang PINAKAMALAPIT (Chebyshev distance mula sa player
// papuntang anchor tile) ang mauuna.
function getUsableStructureUnderPlayer() {
  if (!currentWorld) return null;

  const box =
    typeof getPlayerCollisionBox === "function" ? getPlayerCollisionBox() : null;

  if (!box) return null;

  const playerCol = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  const playerRow = Math.floor((box.y + box.height / 2) / TILE_SIZE);

  const candidates = [];

  if (typeof placedCrafters !== "undefined") {
    for (const crafter of placedCrafters) {
      if (crafter.world !== currentWorld) continue;
      if (isStructureUsableFromPlayer("crafter", crafter.col, crafter.row)) {
        candidates.push({ type: "crafter", target: crafter, col: crafter.col, row: crafter.row });
      }
    }
  }

  if (typeof placedStoves !== "undefined") {
    for (const stove of placedStoves) {
      if (stove.world !== currentWorld) continue;
      if (isStructureUsableFromPlayer("stove", stove.col, stove.row)) {
        candidates.push({ type: "stove", target: stove, col: stove.col, row: stove.row });
      }
    }
  }

  if (typeof placedLights !== "undefined") {
    for (const light of placedLights) {
      if (light.world !== currentWorld) continue;
      if (isStructureUsableFromPlayer("light", light.col, light.row)) {
        candidates.push({ type: "light", target: light, col: light.col, row: light.row });
      }
    }
  }

  if (typeof placedBeds !== "undefined") {
    for (const bed of placedBeds) {
      if (bed.world !== currentWorld) continue;
      if (isStructureUsableFromPlayer("bed", bed.col, bed.row)) {
        candidates.push({ type: "bed", target: bed, col: bed.col, row: bed.row });
      }
    }
  }

  // AYOS (hiling ng user): "yung sa oldman gusto ko di na clickable
  // dapat e na rin gamit" - kaparehong-pareho ng gawi ng Crafter/Stove/
  // Light/Bed sa itaas (katabi AT nakaharap), PERO hindi ito galing sa
  // PLACEMENT_FOOTPRINTS (1 tile lang siya, hindi rin "placed" ng
  // player - gumagala siya, isOldManTile/oldManWander - decor.js), kaya
  // DIRETSO na lang ang tile niya (oldManWander.col/row) ang sinusuri,
  // hindi dumadaan sa isStructureUsableFromPlayer/getPlacementFootprintCells.
  if (
    typeof oldManWander !== "undefined" &&
    oldManWander &&
    oldManWander.state !== "gone" &&
    isPlayerAdjacentToTile(oldManWander.col, oldManWander.row) &&
    isPlayerFacingTile(oldManWander.col, oldManWander.row)
  ) {
    candidates.push({
      type: "oldman",
      target: oldManWander,
      col: oldManWander.col,
      row: oldManWander.row,
    });
  }

  // AYOS (hiling ng user): si Joseph ("Builder" NPC, builder.js) -
  // static (hindi gumagala, kaiba sa Oldman), kaya diretso na lang
  // ang FIXED na (JOSEPH_COL, JOSEPH_ROW) niya ang sinusuri.
  if (typeof isPlayerNearJoseph === "function" && isPlayerNearJoseph()) {
    candidates.push({
      type: "joseph",
      target: null,
      col: JOSEPH_COL,
      row: JOSEPH_ROW,
    });
  }

  // AYOS (hiling ng user): "dapat si maria is na press e din para
  // makabili ako ng mga vegetable tapos si joseph din" - kaparehong-
  // parehong paraan ng "joseph" sa itaas, PERO sa loob ng Grocery
  // (builder.js) - dito lang sila makakausap habang "atWork" (nakatayo
  // na sa puwesto, tapos na ang paglalakad).
  if (typeof isPlayerNearMaria === "function" && isPlayerNearMaria()) {
    candidates.push({
      type: "maria",
      target: null,
      col: MARIA_SPOT_COL,
      row: MARIA_SPOT_ROW,
    });
  }

  if (
    typeof isPlayerNearJosephAtGrocery === "function" &&
    isPlayerNearJosephAtGrocery()
  ) {
    candidates.push({
      type: "josephGrocery",
      target: null,
      col: JOSEPH_GROCERY_SPOT_COL,
      row: JOSEPH_GROCERY_SPOT_ROW,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const distA = Math.max(Math.abs(a.col - playerCol), Math.abs(a.row - playerRow));
    const distB = Math.max(Math.abs(b.col - playerCol), Math.abs(b.row - playerRow));

    return distA - distB;
  });

  return candidates[0];
}

// =========================
// MOUSE
// =========================
//
// Ang mouse ay nasa SCREEN pixels, pero ang mapa ay nasa WORLD pixels.
// Ang conversion ay kabaligtaran ng ginagawa sa draw.js: doon,
// scale(zoom) muna tapos translate(-snappedCamera). Kaya pabalik:
// hatiin sa zoom, tapos idagdag ang snapped camera. Ginagamit natin ang
// PAREHONG pag-snap ng camera para eksaktong tumapat ang cursor sa
// tile na nakikita mo.

let mouseScreenX = 0;
let mouseScreenY = 0;
let mouseOnCanvas = false;

function getMouseTile() {
  if (!mouseOnCanvas || !mapReady || !mapData) return null;

  const snappedCameraX = Math.round(camera.x * camera.zoom) / camera.zoom;
  const snappedCameraY = Math.round(camera.y * camera.zoom) / camera.zoom;

  const worldX = mouseScreenX / camera.zoom + snappedCameraX;
  const worldY = mouseScreenY / camera.zoom + snappedCameraY;

  const col = Math.floor(worldX / TILE_SIZE);
  const row = Math.floor(worldY / TILE_SIZE);

  if (col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) {
    return null;
  }

  return { col, row };
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();

  mouseScreenX = event.clientX - rect.left;
  mouseScreenY = event.clientY - rect.top;
  mouseOnCanvas = true;
});

canvas.addEventListener("mouseleave", () => {
  mouseOnCanvas = false;
  canvas.style.cursor = "";
});

// I-RIGHT-CLICK ang isang naka-lagay na Crafter O Stove sa mundo (abot
// ng player) para "sirain" ito - tingnan ang breakPlacedCrafter
// (craft.js) / breakPlacedStove (stove.js) - magiging ordinaryong
// FLOATING ground item na lang ito (kailangan pang damputin/i-click
// gamit ang awtomatikong "kamay", kagaya ng ibang ani, bago talagang
// mapunta sa bag). Bawat isa (Crafter man o Stove) ay INDIBIDWAL na
// sinisira - isa lang ang naaapektuhan kada right-click, hindi ang
// lahat.
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  const tile = getMouseTile();

  if (!tile || !isTileInReach(tile.col, tile.row)) return;

  // BAGONG "bag" na naka-lagay sa mundo - HINDI agad sinisira (hindi
  // tulad ng Crafter/Stove sa ibaba) - lumalabas muna ang "Use"/"Break"
  // na menu (hiling ng user), tingnan ang usePlacedBag/breakPlacedBag
  // (hotbar.js).
  const bagHere =
    typeof getPlacedBagAt === "function" ? getPlacedBagAt(tile.col, tile.row) : null;

  if (bagHere && typeof showBagActionMenu === "function") {
    showBagActionMenu(event.clientX, event.clientY, [
      { label: "Use", onClick: () => usePlacedBag(bagHere) },
      { label: "Break", onClick: () => breakPlacedBag(bagHere) },
    ]);

    return;
  }

  const crafterHere =
    typeof getPlacedCrafterAt === "function" ? getPlacedCrafterAt(tile.col, tile.row) : null;

  if (crafterHere && typeof breakPlacedCrafter === "function") {
    breakPlacedCrafter(crafterHere);
    return;
  }

  const stoveHere =
    typeof getPlacedStoveAt === "function" ? getPlacedStoveAt(tile.col, tile.row) : null;

  if (stoveHere && typeof breakPlacedStove === "function") {
    breakPlacedStove(stoveHere);
    return;
  }

  const lightHere =
    typeof getPlacedLightAt === "function" ? getPlacedLightAt(tile.col, tile.row) : null;

  if (lightHere && typeof breakPlacedLight === "function") {
    breakPlacedLight(lightHere);
    return;
  }

  // BAGONG naka-lagay na Bed (bed.js, hiling ng user) - kaparehong-pareho
  // ng gawi ng Crafter/Stove sa itaas, agad na sinisira (walang
  // "Use"/"Break" na menu).
  const bedHere =
    typeof getPlacedBedAt === "function" ? getPlacedBedAt(tile.col, tile.row) : null;

  if (bedHere && typeof breakPlacedBed === "function") {
    breakPlacedBed(bedHere);
  }
});

canvas.addEventListener("mousedown", (event) => {
  // Left click lang.
  if (event.button !== 0) return;

  // Huwag pang tumanggap ng bagong click habang gumaganap pa ang
  // "putting" na animation (tingnan ang handleHandClick sa ibaba).
  if (player.putting) return;

  const tile = getMouseTile();

  if (!tile) return;

  // AYOS (hiling ng user): "yung sa oldman gusto ko di na clickable
  // dapat e na rin gamit" - TINANGGAL na ang left-click bilang paraan
  // ng pagbukas ng tindahan niya (dating dito, openOldManShopPanel) -
  // "E" na rin ngayon ang gamit (tingnan ang getUsableStructureUnderPlayer
  // sa ibaba, at ang paggamit nito sa update.js), kaparehong-pareho na
  // ng Crafter/Stove/Light/Bed. Basta "consumed" na lang ang click na
  // ito (walang mangyayari) kapag nakatama sa kanya, para hindi ito
  // bumagsak/mag-fallthrough papunta sa awtomatikong kamay/rake/atbp.
  if (isTileInReach(tile.col, tile.row)) {
    const oldManHere =
      typeof isOldManTile === "function" && isOldManTile(tile.col, tile.row);

    if (oldManHere) return;

    // AYOS (hiling ng user): si Joseph (builder.js) - kaparehong-pareho
    // ng gawi ng Oldman sa itaas (consumed ang click, "E" na lang ang
    // paraan para makausap).
    if (tile.col === JOSEPH_COL && tile.row === JOSEPH_ROW && typeof JOSEPH_WORLD !== "undefined" && currentWorld === JOSEPH_WORLD) {
      return;
    }
  }

  // Custom na bahay (builder.js, hiling ng user) - HUWAG nang gumawa ng
  // anuman dito sa left-click (right-click na lang ang "Sell", tingnan
  // ang builder.js) - basta "consumed" na lang, para hindi bumagsak
  // papunta sa paghukay/awtomatikong kamay.
  if (typeof getCustomHouseAt === "function" && getCustomHouseAt(tile.col, tile.row)) {
    return;
  }

  // NAKA-LAGAY NA CRAFTER/STOVE/LIGHT/BED (craft.js/stove.js/light.js/
  // bed.js) - HUWAG nang gumawa ng anuman dito sa left-click (kahit
  // tumama sa tinutukan) - "E" na lang ang paraan (tingnan sa itaas).
  // Basta "consumed" na lang ang click na ito (walang mangyayari),
  // para hindi ito bumagsak/mag-fallthrough papunta sa awtomatikong
  // kamay/rake/atbp. sa ibaba habang nakaturo mismo sa isang structure.
  if (
    (typeof getPlacedCrafterAt === "function" && getPlacedCrafterAt(tile.col, tile.row)) ||
    (typeof getPlacedStoveAt === "function" && getPlacedStoveAt(tile.col, tile.row)) ||
    (typeof getPlacedLightAt === "function" && getPlacedLightAt(tile.col, tile.row)) ||
    (typeof getPlacedBedAt === "function" && getPlacedBedAt(tile.col, tile.row))
  ) {
    return;
  }

  // AWTOMATIKONG "KAMAY" - pagdampot ng nakalapag na item o pag-ani ng
  // hinog na tanim - gumagana ito KAHIT ANO (o wala man) ang naka-equip
  // na kasangkapan, basta abot ng player. Hindi na kailangang mag-equip
  // pa ng hiwalay na "kamay" - una itong sinusubukan bago ang ibang
  // tool, at kung may maidadampot/maaani dito, doon na natatapos ang
  // click (tingnan ang hasHandActionAt/resolveHandClickTile sa ibaba).
  const handTile = resolveHandClickTile(tile.col, tile.row);

  if (isTileInReach(handTile.col, handTile.row) && hasHandActionAt(handTile.col, handTile.row)) {
    handleHandClick(handTile.col, handTile.row);
    return;
  }

  // Wala namang maidadampot/maaani dito - kailangan na ngayong may
  // hawak (rake para sa lupa), may stock ng binhi (pagtatanim - LAGING
  // available basta may stock, tingnan ang canPlantCarrot), o naka-
  // "Hold" (hold.js, hiling ng user) ang isang Crafter/Stove/Light.
  //
  // AYOS (ikatlong round, hiling ng user): "kapag nasa hotbar key na
  // siya tapos na highlight hindi lalabas yung tiles para ma drop
  // dapat need muna i hold bago ma drop" - TINANGGAL na ang dating
  // isCrafterSlotSelected/isStoveSlotSelected/isLightSlotSelected na
  // check dito (basta na-highlight/selected sa hotbar, "armed" na
  // dati) - kailangan na TALAGANG "Hold" muna (hindi lang basta
  // pag-select ng slot) bago gumana ang left-click-to-place.
  const crafterArmed = typeof isItemHeld === "function" && isItemHeld("crafter");
  const stoveArmed = typeof isItemHeld === "function" && isItemHeld("stove");
  const lightArmed = typeof isItemHeld === "function" && isItemHeld("light");
  const bedArmed = typeof isItemHeld === "function" && isItemHeld("bed");
  const anyStructureArmed = crafterArmed || stoveArmed || lightArmed || bedArmed;

  if (
    !rakeEquipped &&
    !canPlantCarrot() &&
    !crafterArmed &&
    !stoveArmed &&
    !lightArmed &&
    !bedArmed
  )
    return;

  // BAGO (hiling ng user): "nakaharap yung character pero may
  // pagitan... 1-2 tile pwede niya malagyan, dapat nakaharap parin
  // siya" - PARA LANG sa PAGLALAGAY ng Crafter/Stove/Light/Bed ang
  // BAGONG isTileInPlacementRange (placement.js: facing + 1-2 tile) -
  // ang rake/pagtatanim SA IBABA ay MANATILING gumagamit ng lumang
  // isTileInReach (1 tile/kahit anong direksyon, walang facing
  // requirement) - hindi dapat maapektuhan ang mga iyon.
  const inPlacementRange = anyStructureArmed
    ? typeof isTileInPlacementRange === "function" &&
      isTileInPlacementRange(tile.col, tile.row)
    : isTileInReach(tile.col, tile.row);

  if (!inPlacementRange) return;

  if (crafterArmed) {
    if (typeof placeCrafterInWorld === "function") {
      placeCrafterInWorld(tile.col, tile.row);
    }
    return;
  }

  if (stoveArmed) {
    if (typeof placeStoveInWorld === "function") {
      placeStoveInWorld(tile.col, tile.row);
    }
    return;
  }

  if (lightArmed) {
    if (typeof placeLightInWorld === "function") {
      placeLightInWorld(tile.col, tile.row);
    }
    return;
  }

  if (bedArmed) {
    if (typeof placeBedInWorld === "function") {
      placeBedInWorld(tile.col, tile.row);
    }
    return;
  }

  // AYOS (hiling ng user): "ang pwede lang is cutter" - ang CUTTER ang
  // TANGING kasangkapang makakaalis ng isang nakatanim na. Nauuna ito
  // sa rake na sangay sa ibaba, at TANGING sa tile na TALAGANG may
  // tanim ito gumagana - kaya walang naaapektuhang ibang gawi ng
  // cutter sa mga tile na walang tanim.
  //
  // Ang HINOG na tanim ay SINASADYANG hindi rin sinisira dito: aanihin
  // mo iyon (kamay, awtomatiko - tingnan ang hasHandActionAt sa itaas),
  // hindi puputulin - kaya hindi masasayang sa isang maling click ang
  // matagal mong hinintay na ani.
  if (typeof cutterEquipped !== "undefined" && cutterEquipped) {
    const dugForCutter = getDugTilesForCurrentWorld();
    const cutterRecord = dugForCutter
      ? dugForCutter[tile.col + "," + tile.row]
      : null;

    if (cutterRecord && cutterRecord.seed) {
      if (!isTileInReach(tile.col, tile.row)) return;
      if (isCarrotReady(cutterRecord.seed)) return; // aanihin, hindi puputulin

      destroyCarrot(tile.col, tile.row);

      if (typeof useToolDurability === "function") useToolDurability("cutter");

      return;
    }
  }

  if (rakeEquipped) {
    // AYOS (hiling ng user): "kahit sana sa lahat may hawak man na
    // pickaxe, axe, rake at kung ano basta naka highlight sa hotkey
    // malalagay siya tapos matatanim" - ang pickaxe/axe/cutter ay
    // DUMADAAN na dati papunta sa handleCarrotClick sa ibaba (hindi
    // sila humaharang), PERO ang RAKE ay hindi: dito ito natatapos,
    // kaya imposible dating magtanim habang hawak ito.
    //
    // Ngayon, kapag ang carrot ang NAKA-HIGHLIGHT sa hotbar
    // (isCarrotSlotSelected) AT ang tile ay HINUKAY na PERO WALA PANG
    // tanim - ang PAGTATANIM ang nauuna, hindi ang rake. Malinaw ang
    // pagkakabukod: walang mawawala sa rake (wala namang hinuhukay sa
    // isang nahukay na, at hindi naman nito nagagalaw ang hinog na
    // tanim), kaya walang dating gawi ang nasisira nito.
    const dugNow = getDugTilesForCurrentWorld();
    const recordNow = dugNow ? dugNow[tile.col + "," + tile.row] : null;

    if (
      recordNow &&
      !recordNow.seed &&
      typeof isCarrotSlotSelected === "function" &&
      isCarrotSlotSelected() &&
      canPlantCarrot()
    ) {
      handleCarrotClick(tile.col, tile.row);
      return;
    }

    // AYOS (hiling ng user): "kahit anong itanim wag na masisira kapag
    // nakatanim na... alisin mo na yung kapag nakagamit ng pickaxe,
    // rake or axe yung may tanim is di na clickable... ang pwede lang
    // is cutter" - DATI, sinisira ng rake ang alinmang tanim na HINDI
    // PA hinog (babalik sa payak na dirt, walang makukuha). Napakadaling
    // masira nang HINDI SINASADYA ang buong taniman nang ganoon: iisang
    // maling click lang habang inaararo mo ang katabing tile.
    //
    // NGAYON: ang isang tile na MAY TANIM ay HINDI NA gumagalaw sa
    // rake - basta hindi ito pinapansin (parang hindi na-click), kaya
    // ligtas nang mag-araro sa tabi mismo ng mga pananim mo. Ang
    // CUTTER na lang ang TANGING makakaalis ng tanim (tingnan ang
    // cutter na sangay sa ibaba).
    const dug = getDugTilesForCurrentWorld();
    const record = dug ? dug[tile.col + "," + tile.row] : null;

    if (record && record.seed) return;

    // Pagitan ng bawat paghukay/pag-gamit ng rake - kaparehong dahilan
    // ng PLANT_COOLDOWN_MS (pagtatanim) - hindi dapat basta-basta
    // i-spam-click.
    if (Date.now() - lastRakeAt < RAKE_COOLDOWN_MS) return;

    // Puwedeng maghukay kahit umuulan ng niyebe - pero kapag hindi mo
    // natamnan agad, may ilang segundo lang bago ito matabunan ulit
    // (tingnan ang updateGroundWeather sa ibaba).
    if (!canDigAt(tile.col, tile.row)) return;

    lastRakeAt = Date.now();
    digTile(tile.col, tile.row);
    if (typeof startRakeStrike === "function") startRakeStrike(tile.col, tile.row);
    // AYOS (hiling ng user): "may duration na rin kada gamit... pag
    // hukay ng lupa" - bumabawas ng 1 sa rake durability kada
    // paghukay.
    if (typeof useToolDurability === "function") useToolDurability("rake");
    return;
  }

  handleCarrotClick(tile.col, tile.row);
});

// =========================
// ANG PAGHUKAY MISMO
// =========================

// Pagitan ng bawat paghukay/pag-gamit ng rake sa isang tile - kaparehong
// dahilan ng PLANT_COOLDOWN_MS (pagtatanim), iwas spam-click.
const RAKE_COOLDOWN_MS = 1000;

let lastRakeAt = 0;

function digTile(col, row) {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  // Itinatabi ang ORAS ng paghukay - kailangan ito para malaman kung
  // kailan magiging wet-dirt (5 segundo pagkatapos). Naka-save ito,
  // kaya kahit mag-reload ka, tuloy ang pagbasa ng lupa.
  dug[col + "," + row] = { at: getGameNow() };

  saveDugTiles();

  spawnDigEffect(col, row);

  // Humarap ang player sa hinukay na tile - mukhang siya talaga ang
  // humukay, hindi lang basta may nangyari sa malayo.
  const box = getPlayerCollisionBox();
  const deltaX = col * TILE_SIZE + TILE_SIZE / 2 - (box.x + box.width / 2);
  const deltaY = row * TILE_SIZE + TILE_SIZE / 2 - (box.y + box.height / 2);

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    player.direction = deltaX > 0 ? "right" : "left";
  } else {
    player.direction = deltaY > 0 ? "down" : "up";
  }
}

// =========================
// PAGTATANIM NG CAROTS
// =========================
//
// Kailangan munang hukayin (pickaxe) ang isang tile bago dito
// makapagtanim - ang binhi ay itinatabi sa PAREHONG record ng dug
// tiles (dug[key].seed), kaya awtomatiko itong exempted sa
// updateGroundWeather (tingnan ang "May tanim na" sa ibaba).
//
// Random ang tagal ng pagtubo - kadalasan 4 hanggang 7 minuto - bago
// umabot sa huling yugto (hinog na). HINDI ito nawawala nang basta-
// basta pagdating doon - mananatili ito sa tile hanggang anihin mo
// gamit ang KAMAY (key "3"), tingnan ang "PAG-AANI GAMIT ANG KAMAY" sa
// ibaba.

// 4 na larawan ng pagtubo (assets/assets/carrots/carrotFrame1-4.png) -
// bawat isa ay may sariling taas (lumalaki paitaas habang tumutubo),
// kaya iginuguhit natin ito naka-anchor sa IBABA ng tile (tingnan ang
// drawCarrotFrame) sa halip na i-stretch sa fixed na TILE_SIZE.
const CARROT_FRAME_COUNT = 4;
const carrotFrameImages = [];

for (let i = 1; i <= CARROT_FRAME_COUNT; i++) {
  const img = new Image();

  img.src = `./assets/assets/carrots/carrotFrame${i}.png`;
  carrotFrameImages.push(img);
}

const CARROT_MIN_GROW_MS = 4 * 60 * 1000; // 4 minuto
const CARROT_MAX_GROW_MS = 7 * 60 * 1000; // 7 minuto

// =========================
// MULTI-CROP NA SISTEMA (hiling ng user: "i add mo na rin yung mga
// ibang vegetables sa list ni maria para magamit buy/sell at pag plant
// at pag grow pag drop at pick up ng gamit papuntang inventory")
// =========================
// Si CARROT ang UNANG crop (sa itaas) - dito na PINALAWAK ang parehong
// disenyo (4 frame, plantedAt+growMs sa dug[key].seed) para sa TATLONG
// karagdagang gulay: potato, cabbage, eggplant. Isang beses lang
// isinusulat ang mismong LOHIKA ng pagtubo/pag-ani (getCarrotProgress/
// getCarrotStageIndex/plantCarrot/harvestCarrot sa ibaba) - ang
// PAGKAKAIBA lang kada crop (larawan, bilang na hawak, tagal ng
// pagtubo) ay nakatago dito, sa IISANG CROP_TYPES na talaan.
//
// TAGAL NG PAGTUBO: si CARROT lang (sa itaas) ang RANDOM (4-7 minuto,
// dating gawi, HINDI ko ito ginalaw) - ang TATLONG bago ay FIXED/hindi
// random na tagal, para tumugma sa eksaktong hiniling ng user para sa
// eggplant ("7 mins each 1-4" = 7 minuto KADA YUGTO x 4 yugto = 28
// minuto total - awtomatiko itong nangyayari sa formula na
// getCarrotStageIndex, walang kailangang hiwalay na "per-stage timer").
// Ang potato/cabbage ay AKING NAPILI (hiling ng user: "ikaw na bahala
// sa iba kung ilan depende sa price") - proporsyonal sa presyo nila:
//   potato  (buy 20/sell 15)  -> 10 minuto total (2.5 min/yugto)
//   cabbage (buy 30/sell 20)  -> 16 minuto total (4 min/yugto)
//   eggplant(buy 50/sell 40)  -> 28 minuto total (7 min/yugto, sinabi
//                                 mismo ng user)
// KUNG MALI ANG PAGKAKAINTINDI KO SA PRESYO/TAGAL, MADALING BAGUHIN -
// ito lang ang IISANG talaan na kailangang ayusin.

let potatoCollected = 0;
let cabbageCollected = 0;
let eggplantCollected = 0;

function loadCropFrameImages(folder, prefix) {
  const images = [];

  for (let i = 1; i <= CARROT_FRAME_COUNT; i++) {
    const img = new Image();

    img.src = `./assets/vegetables/${folder}/${prefix}${i}.png`;
    images.push(img);
  }

  return images;
}

const potatoFrameImages = loadCropFrameImages("potato", "potato");
const cabbageFrameImages = loadCropFrameImages("cabbage", "cabbage");
const eggplantFrameImages = loadCropFrameImages("eggplant", "eggplant");

// itemId -> { label, frameImages, getCount(), getGrowMs() }. Ang
// `getCount`/`getGrowMs` ay FUNCTIONS (hindi plain value) - kailangan
// laging KASALUKUYANG (live) na basahin ang counter variable (hindi
// naka-freeze sa oras na ginawa ang talaang ito), at para makapag-
// random pa rin ang carrot sa bawat pagtatanim.
const CROP_TYPES = {
  carrot: {
    label: "Carrot",
    frameImages: carrotFrameImages,
    getCount: () => carrotsCollected,
    getGrowMs: () =>
      CARROT_MIN_GROW_MS + Math.random() * (CARROT_MAX_GROW_MS - CARROT_MIN_GROW_MS),
  },
  potato: {
    label: "Potato",
    frameImages: potatoFrameImages,
    getCount: () => potatoCollected,
    getGrowMs: () => 10 * 60 * 1000,
  },
  cabbage: {
    label: "Cabbage",
    frameImages: cabbageFrameImages,
    getCount: () => cabbageCollected,
    getGrowMs: () => 16 * 60 * 1000,
  },
  eggplant: {
    label: "Eggplant",
    frameImages: eggplantFrameImages,
    getCount: () => eggplantCollected,
    getGrowMs: () => 28 * 60 * 1000,
  },
};

// Ang frame-image array ng isang crop id - `carrotFrameImages` bilang
// ligtas na fallback kung sakaling luma/hindi kilalang uri (hal.
// sirang save data).
function getCropFrameImages(cropId) {
  const crop = CROP_TYPES[cropId];

  return crop ? crop.frameImages : carrotFrameImages;
}

function drawCarrotFrame(stageIndex, col, row, cropId) {
  const img = getCropFrameImages(cropId)[stageIndex];

  if (!img.complete || img.naturalWidth === 0) return;

  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE + TILE_SIZE - img.naturalHeight;

  ctx.drawImage(img, x, y, img.naturalWidth, img.naturalHeight);
}

// 0..1 - gaano na katubo ang tanim. Naka-cap sa 1 kahit lumagpas pa ng
// husto ang oras (para hindi na kailangan pang i-clamp sa mga gumagamit
// nito).
function getCarrotProgress(seed) {
  return Math.max(0, Math.min(1, (getGameNow() - seed.plantedAt) / seed.growMs));
}

// Hinahati sa 4 na pantay na bahagi (25% kada isa) ang buong pagtubo -
// frame1 (0-25%), frame2 (25-50%), frame3 (50-75%), frame4 (75-100%).
function getCarrotStageIndex(seed) {
  const progress = getCarrotProgress(seed);

  return Math.min(
    CARROT_FRAME_COUNT - 1,
    Math.floor(progress * CARROT_FRAME_COUNT),
  );
}

// AYOS (hiling ng user): "kapag nasa 3-4 frame na ng vegetable, dapat
// pumapasok na ang Y-sort laban sa player" - dating "progress-based"
// ito (>=90% na pagtubo, na LAGING nasa loob ng huling stage/frame4
// pa lang talaga, kailanman hindi naaabot ng frame3) - STAGE-based na
// ngayon direkta (stageIndex >= 2, ibig sabihin FRAME 3 AT FRAME 4,
// hindi lang frame4) - dalawang pinakamataas na yugto na ng paglaki
// (frame 3/4, mas mataas na sa isang tile) ang sumasali na sa Y-sort
// laban sa player, hindi lang yung pinakahuli/pinakamatangkad.
function shouldCarrotOverlapPlayer(seed) {
  return getCarrotStageIndex(seed) >= 2;
}

// Puwede nang anihin sa sandaling lumitaw na ang huling frame
// (carrotFrame4, 75% pataas) - hindi na kailangang hintayin pa ang
// 100%.
function isCarrotReady(seed) {
  return getCarrotStageIndex(seed) === CARROT_FRAME_COUNT - 1;
}

// Kumukuha mula mismo sa mga na-aning carrots (carrotsCollected sa bag) -
// isa kada tanim. "Kamay"/default na aksyon ito - basta may stock ka ng
// carrot, puwede ka nang magtanim (tingnan ang canPlantCarrot), kahit
// anong tool ang naka-equip o ano pa mang slot ang naka-highlight.
function plantCarrot(col, row) {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const record = dug[col + "," + row];

  if (!record || record.seed) return;

  // AYOS (multi-crop): ALIN sa 4 na uri ang itatanim ay base na ngayon
  // sa naka-highlight na slot sa hotbar (getSelectedCropId) - hindi na
  // basta "carrot" palagi.
  const cropId = getSelectedCropId();
  const crop = cropId ? CROP_TYPES[cropId] : null;

  if (!crop || crop.getCount() <= 0) return; // walang natitirang stock

  if (typeof adjustGlobalItemCount === "function") {
    adjustGlobalItemCount(cropId, -1);
  }

  // Ibawas din sa KUNG SAAN MAN ito kasalukuyang EXPLICIT na "nakatira"
  // (hotbar slot o bag split-stack) - hindi lang sa raw na variable sa
  // itaas - kung hindi, mananatiling frozen/hindi nababawasan ang
  // ipinapakita sa hotbar kahit bumaba na ang totoong stock (tingnan
  // ang consumeItemFromWherever sa hotbar.js).
  if (typeof consumeItemFromWherever === "function") {
    consumeItemFromWherever(cropId, 1);
  }

  // Kung naubos na dito (0 na), awtomatiko itong "mawawala" sa
  // pinnedSlots ng syncPinnedSlots (tingnan ang hotbar.js) sa susunod na
  // render - hindi na kailangang i-force dito, dahil derived na lang
  // mismo sa pinnedSlots/selectedInventorySlot ang isCarrotSlotSelected.
  if (typeof syncHotbarUI === "function") syncHotbarUI();

  record.seed = {
    type: cropId,
    plantedAt: getGameNow(),
    growMs: crop.getGrowMs(),
  };

  saveDugTiles();
  spawnDigEffect(col, row);
}

function harvestCarrot(col, row) {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const record = dug[col + "," + row];

  if (!record || !record.seed) return;

  delete record.seed;

  // Bumabalik agad sa payak na tuyong dirt (hindi sa basa) - at
  // may sariling MAS MABILIS na revert-to-grass na oras (tingnan ang
  // CARROT_HARVEST_REVERT_MS / "harvested" flag sa drawDugTiles at
  // updateGroundWeather), sa halip na ang mas mahabang wet->dry->grass
  // na cascade ng ordinaryong hukay.
  record.at = getGameNow();
  record.harvested = true;

  saveDugTiles();
  spawnDigEffect(col, row);
}

// Kapag ginamitan ng PICKAXE (hindi kamay) ang isang tanim na HINDI PA
// hinog (bago pa sa carrotFrame4) - nasisira ito, walang makukuhang
// carrot, bumabalik lang sa payak na dirt (ordinaryong wet->dry->grass
// cascade, hindi ang mabilis na post-harvest revert).
function destroyCarrot(col, row) {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const record = dug[col + "," + row];

  if (!record || !record.seed) return;

  delete record.seed;
  record.at = getGameNow();

  saveDugTiles();
  spawnDigEffect(col, row);
}

// Pagitan ng bawat pagtatanim - hindi dapat basta-basta i-spam-click
// ang pagtatanim, kaparehong dahilan ng RESOURCE_HIT_COOLDOWN_MS
// (resources.js).
const PLANT_COOLDOWN_MS = 1000;

let lastPlantAt = 0;

function handleCarrotClick(col, row) {
  if (Date.now() - lastPlantAt < PLANT_COOLDOWN_MS) return;

  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const record = dug[col + "," + row];

  if (!record) return; // dapat nahukay na muna bago matamnan

  // May tanim na dito - hindi na ito puwedeng tamnan/anihin gamit ang
  // binhi. Ang kamay (key "3") na lang ang umaani ng hinog na tanim.
  if (record.seed) return;

  lastPlantAt = Date.now();

  // BAGO (hiling ng user): tinanggal na ang "put" na animation - agad
  // na lang natatanim ang binhi, walang pagyuko/paghinto muna.
  plantCarrot(col, row);
}

// =========================
// PAG-AANI (AWTOMATIKONG "KAMAY")
// =========================
//
// Awtomatiko na itong umaani ng hinog na carrots (hindi na kailangang
// mag-equip ng "kamay" muna) - hindi ito nangyayari sa basta pag-click
// gamit ang binhi, tanging sa tamang tile lang na may hinog na tanim.
// Kapag na-click ang isang hinog na tanim: agad itong nabubunot (bumabalik
// sa dirt ang tile - tingnan ang harvestCarrot), habang lumulukso
// paitaas ang 2-3 na icon ng carrot (mula sa assets/assets/carrots.png)
// bilang epekto, at dumadagdag ng kaparehong bilang sa bag (tingnan ang
// hotbar.js).

const CARROT_HARVEST_MIN_YIELD = 1;
const CARROT_HARVEST_MAX_YIELD = 2;

// Ang isang hinog na tanim (frame3/4, 23-24px) ay mas mataas pa sa
// isang tile (16px) - iginuguhit ito naka-anchor sa IBABA (drawCarrotFrame),
// kaya umaapaw ito PAITAAS papasok sa biswal na espasyo ng tile SA
// IBABAW nito. Kapag nag-click ang user sa tuktok ng tanim na nakikita
// niya - natural na gawin - ang tile na tinatamaan ng grid-based click
// (getMouseTile) ay yung tile SA IBABAW, hindi yung talagang pinagtaniman.
// Kaya kapag walang direktang matatanggap dito, tinitingnan din natin
// ang tile SA IBABA (kung saan talaga nakatanim) bago tuluyang mag-
// walang-nangyari.
// May maidadampot (nakalapag na item) o maaani (hinog na tanim) ba sa
// eksaktong cell na ito? Ito rin ang ginagamit para malaman kung
// dapat awtomatikong tumugon ang isang click/cursor dito bilang
// "kamay", kahit anong kasangkapan (o wala man) ang naka-equip
// (tingnan ang mousedown/drawDigCursor/updateCanvasCursor).
function hasHandActionAt(col, row) {
  if (
    typeof getGroundItemsAt === "function" &&
    getGroundItemsAt(col, row).length > 0
  ) {
    return true;
  }

  const dug = getDugTilesForCurrentWorld();
  const record = dug ? dug[col + "," + row] : null;

  return Boolean(record && record.seed && isCarrotReady(record.seed));
}

function resolveHandClickTile(col, row) {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return { col, row };

  if (hasHandActionAt(col, row)) return { col, row };

  const below = dug[col + "," + (row + 1)];

  if (
    below &&
    below.seed &&
    isCarrotReady(below.seed) &&
    shouldCarrotOverlapPlayer(below.seed)
  ) {
    return { col, row: row + 1 };
  }

  return { col, row };
}

function handleHandClick(col, row) {
  // Unahin munang subukang damputin ang anumang nakalapag na item dito
  // (ground-items.js) - bago pa man tingnan kung may aanihin. BAGO
  // (hiling ng user): tinanggal na ang "put" na animation - agad na
  // lang nadadampot ang item, walang paghinto/pagyuko muna.
  if (
    typeof getGroundItemsAt === "function" &&
    getGroundItemsAt(col, row).length > 0
  ) {
    tryPickupGroundItemsAt(col, row);

    return;
  }

  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const record = dug[col + "," + row];

  if (!record || !record.seed || !isCarrotReady(record.seed)) return;

  // Itinatabi MUNA ang uri (bago pa "harvestCarrot" mag-alis ng
  // record.seed sa ibaba) - ito ang siyang ipapakuha/ilalapag sa lupa.
  const harvestedCropId = record.seed.type;

  const yieldCount =
    CARROT_HARVEST_MIN_YIELD +
    Math.floor(
      Math.random() * (CARROT_HARVEST_MAX_YIELD - CARROT_HARVEST_MIN_YIELD + 1),
    );

  // BAGO (hiling ng user): tinanggal na ang "put" na animation - agad
  // na lang nabubunot/naaani ang tanim, walang paghinto/pagyuko muna.
  const finishHarvest = () => {
    harvestCarrot(col, row);

    // Hindi na deretso sa bag - nakalapag muna sa lupa, damputin gamit
    // ang kamay (tingnan ang ground-items.js). Hiwa-hiwalay na piraso (isa
    // kada ani) - kaya kailangang isa-isahin ang pagdampot, hindi
    // basta isang click na lang para sa buong ani. Ang bawat piraso ay may
    // sariling "landing" animation (tingnan ang GROUND_ITEM_SPAWN_STAGGER_MS
    // sa ground-items.js) - hindi na ito nawawala/kumukupas sa sarili
    // nito, doon lang talaga mawawala kapag na-damputan na.
    if (typeof spawnGroundItem === "function") {
      for (let i = 0; i < yieldCount; i++) {
        spawnGroundItem(col, row, harvestedCropId, 1, i * GROUND_ITEM_SPAWN_STAGGER_MS);
      }
    } else if (typeof adjustGlobalItemCount === "function") {
      adjustGlobalItemCount(harvestedCropId, yieldCount);
      if (typeof syncHotbarUI === "function") syncHotbarUI();
    }
  };

  finishHarvest();
}

// Larawan ng carrot na ginagamit ng ground-items.js para iguhit ang mga
// nakalapag na carrot sa lupa (tingnan ang drawGroundItems).
const CARROT_ICON_IMAGE = new Image();
CARROT_ICON_IMAGE.src = "./assets/vegetables/carrots/carrot.png";

// Buong larawan na lang - iisang icon lang ang laman ng carrots.png.
const CARROT_ICON_SRC = { x: 0, y: 0, width: 16, height: 17 };

// =========================
// BILANG NG NA-ANING CARROTS (BAG)
// =========================
//
// Hindi ito naka-save sa localStorage - nire-reset ito sa 0 (walang
// panimulang stock - normal na simula ng laro) tuwing mag-reload,
// katulad ng ibang session-only na estado dito. Ang hotbar.js ang
// nagpapakita ng bilang na ito sa UI.

let carrotsCollected = 0;

function collectCarrot(count) {
  carrotsCollected += count;
  if (typeof syncHotbarUI === "function") syncHotbarUI();
  // Bagong LEVEL/EXP system (hotbar.js) - maliit na exp kada carrot,
  // isa-isa itong tinatawag (isang piraso kada dampot), kaya hindi ito
  // "count" mismo ang i-multiply - tingnan ang caller sa ground-items.js.
  if (typeof gainExp === "function") gainExp(2 * count);
}

// =========================
// EFFECT NG PAGBASAG (kada tile)
// =========================
//
// Kapag nahukay ang tile: sumasabog ang mga piraso ng niyebe paitaas
// tapos bumabagsak (may gravity), habang may puting kislap sandali sa
// tile mismo. Time-based ito tulad ng footprints - walang kailangang
// update() hook, ang draw ang nagkukwenta ng edad ng bawat particle.

const DIG_EFFECT_LIFETIME = 0.55; // segundo

let digEffects = [];

function spawnDigEffect(col, row) {
  const centerX = col * TILE_SIZE + TILE_SIZE / 2;
  const centerY = row * TILE_SIZE + TILE_SIZE / 2;

  const particles = [];

  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 12 + Math.random() * 26;

    particles.push({
      x: centerX + (Math.random() - 0.5) * 8,
      y: centerY + (Math.random() - 0.5) * 8,
      // Paitaas ang kalahati ng bilis, para "sumambulat" bago bumagsak.
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed * 0.5 - 22,
      size: 1 + Math.random() * 1.6,
    });
  }

  digEffects.push({
    col,
    row,
    bornAt: performance.now(),
    particles,
  });
}

function drawDigEffects() {
  if (digEffects.length === 0) return;

  const now = performance.now();

  // Tanggalin ang mga tapos na.
  digEffects = digEffects.filter(
    (effect) => (now - effect.bornAt) / 1000 < DIG_EFFECT_LIFETIME,
  );

  ctx.save();

  for (const effect of digEffects) {
    const age = (now - effect.bornAt) / 1000;
    const progress = age / DIG_EFFECT_LIFETIME;

    // Puting kislap sa tile mismo, mabilis na kumukupas.
    if (progress < 0.35) {
      ctx.globalAlpha = (1 - progress / 0.35) * 0.55;
      ctx.fillStyle = "white";
      ctx.fillRect(
        effect.col * TILE_SIZE,
        effect.row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }

    // Mga pirasong niyebe. Simpleng physics: tuloy-tuloy na galaw plus
    // gravity, kinukwenta mula sa edad (hindi kada frame), kaya pareho
    // ang bilis kahit anong FPS.
    ctx.fillStyle = "#e8eef7";
    ctx.globalAlpha = 1 - progress;

    const GRAVITY = 90;

    for (const particle of effect.particles) {
      const x = particle.x + particle.velocityX * age;
      const y =
        particle.y + particle.velocityY * age + 0.5 * GRAVITY * age * age;

      ctx.fillRect(x, y, particle.size, particle.size);
    }
  }

  ctx.restore();
}

// =========================
// PANAHON NG LUPA (SNOW <-> GRASS)
// =========================
//
// Kapag UMULAN ng niyebe (isang buong "araw" tuwing may snow day - tingnan
// ang calendar.js): mag-uulan MUNA nang ilang saglit bago pa man
// magsimulang matabunan ang lupa - hindi agad-agad. Kapag TUMILA naman
// (araw pagkatapos ng snow day): pagkalipas ng 2 minuto, unti-unting
// nagiging damo ang lupa - paisa-isa lang ang mga tile, hanggang buong
// damuhan. Sa mga araw na malayo na sa huling snow day, buong damuhan
// na agad - walang habang-panahong "unti-unting tumutubo".
//
// Ang mga HINUKAY na tile ay may sariling patakaran, kapareho sa
// dalawang panahon: ang hukay na WALANG tanim (seeds) ay bumabalik sa
// natural na lupa (niyebe o damo, kung alin ang nararapat) pagkalipas
// ng ilang segundo. Ang may tanim, hinding-hindi ginagalaw ng panahon -
// kailanman, kahit anong panahon.

const SNOW_COVER_DELAY_SECONDS = 20; // mag-snow muna bago magsimulang matabunan ang lupa
const SNOW_COVER_SECONDS = 60; // gaano katagal mula unang tabon hanggang puro niyebe na
const GRASS_DELAY_SECONDS = 120; // 2 minuto pagkatapos tumila bago magsimulang matunaw
const GRASS_GROW_SECONDS = 120; // gaano katagal mula unang damo hanggang buo

// Mga mundong may SARILI NANG kumpletong art (town.tmj/snowtown.tmj -
// buong larawan na mismo ang tile, ginawa sa Tiled) o hindi naman
// dinisenyo para sa generic na dirt/grass/snow overlay (village -
// snowMap.tmj) - kaya HINDI na dito ipinapatong ang dynamic na
// snow<->grass ground cover system sa ibaba (drawGrass/
// drawSnowGroundCover/updateGroundWeather/shouldUseClearArt). Ang
// "town" ay saklaw na nito ang PAREHONG bersyon (town.tmj at ang
// snow na kapalit nitong snowtown.tmj, loadWorld sa map.js na ang
// bahalang magpalit sa pagitan ng dalawa base sa panahon) - hindi na
// kailangan pang dagdagan pa ng sarili nating snow tiles sa ibabaw
// niyan.
//
// Ang FARMING/RAKE mismo (canDigAt, digTile, plantCarrot, atbp.) ay
// HINDI apektado nito - gumagana pa rin ang mga iyon dito, hiwalay na
// sistema iyon sa cosmetic na ground weather overlay.
// AYOS: tinanggal ang "village" (TINANGGAL na rin sa WORLDS, worlds.js)
// - "town" na lang.
//
// AYOS (hiling ng user): "di pa rin natanggal yung niyebe na white sa
// tiles... puro puti" - ang totoong dahilan: WALANG "Snow.tsx" tileset
// na naka-load sa grassmap/grassmap2 (sariling larawan lang ang mga
// ito, hindi generic na dirt/grass tileset), kaya kapag sinubukan ng
// drawSnowGroundCover (sa ibaba) na maghanap ng "snowGid" dito, laging
// NABIGO ito - bumabagsak sa FALLBACK na PLAIN WHITE fillRect sa BAWAT
// tile na dapat sana ay niyebe na (tingnan ang drawSnowGroundCover) -
// ito mismo ang "puro puting tile" na nakapatong sa buong grassmap.
// Ngayon (worlds.js), mayroon nang SARILING kumpletong "snow" na
// bersyon ng buong mapa ang grassmap/grassmap2 (snowgrassmap.tmj/
// snowgrassmap2.tmj, snowUrl) - PAREHONG-PAREHO ang pattern ng "town"
// sa itaas - kaya HINDI na rin dapat dito ipinapatong ang generic na
// dynamic na snow ground cover system.
const WORLDS_WITHOUT_GROUND_WEATHER_OVERLAY = ["town", "grassmap", "grassmap2"];

function worldHasGroundWeatherOverlay() {
  return !WORLDS_WITHOUT_GROUND_WEATHER_OVERLAY.includes(currentWorld);
}

// 0 = purong niyebe ang lupa, 1 = buong damuhan na. PURONG KWENTA ito
// mula sa orasan - walang itinatabing estado - kaya kahit mag-refresh
// ka, eksaktong ganoon pa rin ang damo pagbalik mo. Ang bawat cell ay
// may sariling posisyon sa pagitan ng 0..1 (tingnan ang
// tileGrassOrder), kaya kahit tuloy-tuloy ang formula, PAISA-ISANG
// TILE lang ang nagpapalit sa bawat sandali - hindi biglaang lahat.
function getGrassProgress() {
  const secondsIntoDay = (getGameNow() / 1000) % DAY_NIGHT_SECONDS;

  if (isSnowWeather()) {
    // Umuulan ngayong araw - mula buong damuhan, unti-unting natatabunan
    // simula SNOW_COVER_DELAY_SECONDS pagkasimula ng araw na ito.
    const coveringFor = Math.max(0, secondsIntoDay - SNOW_COVER_DELAY_SECONDS);

    return Math.max(0, 1 - coveringFor / SNOW_COVER_SECONDS);
  }

  if (!wasYesterdaySnowDay()) return 1; // matagal nang tumila - buong damuhan na

  // Kahapon lang huling nag-snow - unti-unting tumutubo ang damo mula
  // sa simula ng araw na ito.
  return Math.min(
    1,
    Math.max(0, (secondsIntoDay - GRASS_DELAY_SECONDS) / GRASS_GROW_SECONDS),
  );
}

// Kapag umuulan ng NIYEBE: unti-unti (paisa-isa, naka-stagger kada
// tile) namamatay/nasisira rin ang mga TANIM (dating "hinding-hindi
// ginagalaw ng panahon" - ngayon, sa niyebe lang, apektado na rin sila) -
// ang bilang ng saglit na "safe" na TANIM (hindi maaapektuhan ng snow
// die-off) sa isang pagkakataon.
const PLANTED_CROP_SNOW_MIN_SURVIVORS = 2;

// Palugit BAGO pa man mag-umpisang "mabilang" ang oras ng pagkamatay ng
// isang partikular na tanim - hindi ito dapat basta sinusukat mula sa
// simula ng SNOW DAY (kung matagal nang umuulan, kaagad-agad na sana
// itong "malapit nang mamatay" kahit kaka-tanim mo pa lang - kaya
// GAMITIN ang MAS HULI sa dalawa: kailan nag-umpisa ang niyebe, O kailan
// talaga itinanim - tingnan ang paggamit nito sa updateGroundWeather).
const PLANTED_CROP_SNOW_GRACE_MS = 15 * 1000;

// Ang haba ng "window" kung saan naka-kalat/naka-stagger ang oras ng
// pagkamatay ng bawat tanim (bawat tile ay may sariling posisyon sa
// loob ng window na ito - tingnan ang tilePlantedSnowKillOrder) - kaya
// hindi sabay-sabay lahat nawawala, unti-unti sa loob ng ilang minuto,
// pagkatapos ng PLANTED_CROP_SNOW_GRACE_MS sa itaas.
const PLANTED_CROP_SNOW_KILL_STAGGER_MS = 3 * 60 * 1000;

// Kaparehong klase ng hash ng tileGrassOrder/tileWetOrder, pero ibang
// numero - para hindi magkatugma (decorrelated), 0..1 na deterministic
// na "puwesto" ng bawat tile sa loob ng PLANTED_CROP_SNOW_KILL_STAGGER_MS
// na window ng pagkamatay.
function tilePlantedSnowKillOrder(col, row) {
  const noise = Math.sin(col * 53.9898 + row * 91.233) * 24634.6345;

  return noise - Math.floor(noise);
}

// Itinatabi ang bilang ng TANIM sa simula pa lang ng kasalukuyang snow
// day (bago pa man may namamatay) - dito nakabatay kung ilan ang
// "floor"/pinaka-kaunting matitirang buhay na tanim (PLANTED_CROP_
// SNOW_MIN_SURVIVORS) - MALIBAN kung ang simulang bilang mismo ay
// PAREHO o MAS MABABA pa sa floor na iyon, doon puwede nang maubos
// LAHAT (walang "reserba" na ipinagtatanggol). Kailangan itong "i-lock"
// sa simula ng bawat BAGONG snow day (hindi paulit-ulit na kinukwenta
// habang paisa-isang nauubos) - kung hindi, papalit-palit ang floor
// habang bumababa ang bilang.
let plantedSnowFloorCache = null; // { world, snowStartedAtMs, floor }

function getPlantedCropSnowFloor(dug, snowStartedAtMs) {
  if (
    plantedSnowFloorCache &&
    plantedSnowFloorCache.world === currentWorld &&
    plantedSnowFloorCache.snowStartedAtMs === snowStartedAtMs
  ) {
    return plantedSnowFloorCache.floor;
  }

  let plantedCount = 0;

  for (const key of Object.keys(dug)) {
    if (dug[key] && dug[key].seed) plantedCount++;
  }

  const floor =
    plantedCount > PLANTED_CROP_SNOW_MIN_SURVIVORS
      ? PLANTED_CROP_SNOW_MIN_SURVIVORS
      : 0;

  plantedSnowFloorCache = { world: currentWorld, snowStartedAtMs, floor };

  return floor;
}

// Tinatawag kada frame mula sa update.js. Ang tanging trabaho na lang
// nito ay ang PAGBABALIK SA NATURAL NA LUPA ng mga hukay na WALANG
// tanim - ang damo/niyebe mismo ay purong kwenta na (getGrassProgress),
// walang ina-update dito. Kasama na rin dito ngayon ang unti-unting
// (staggered) pagbabalik sa dirt ng mga TANIM habang umuulan ng niyebe
// (tingnan ang "May tanim na" sa ibaba) - saka lang tuluyang babalik
// ito sa likas na niyebe sa SUSUNOD na tawag dito, dahil dumadaan na
// ito sa ORDINARYONG dirt/wet/snow cascade sa ibaba (gaya rin ng ginagawa
// ng destroyCarrot/rake).
function updateGroundWeather() {
  if (!mapReady || !currentWorld) return;

  // PANSIN: sinasadyang HINDI dito ginagamit ang
  // worldHasGroundWeatherOverlay() - ang function na ito ay tungkol sa
  // PAGBABALIK ng mga HINUKAY/TANIM na tile (farming) sa natural na
  // lupa pagkalipas ng oras, hiwalay na sistema iyon sa cosmetic na
  // "buong mapa" na snow/grass overlay (drawGrass/drawSnowGroundCover
  // sa ibaba) - dapat gumana pa rin ito kahit saang mundo, para tuloy-
  // tuloy ang farming.
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const now = getGameNow();

  // BAGO (kasabay ng taniman sa loob ng GARDEN HOUSE - tingnan ang
  // canDigAt sa itaas): sa LOOB ng bahay ay WALANG panahon - hindi
  // umuulan ng niyebe doon, kaya HINDI dapat mamatay ang mga tanim mo
  // sa greenhouse dahil lang sa taglamig sa LABAS (ito mismo ang
  // punto ng isang greenhouse). Ang mga hinukay PERO hindi natamnan ay
  // babalik pa rin sa normal pagkalipas ng DUG_REVERT_MS - kaya
  // "1" (tila tag-damo na) ang ipinapasang grassProgress sa loob,
  // hindi ang tunay na progreso sa labas (kung hindi, hindi na
  // kailanman maglilinis ang mga naiwang butas tuwing taglamig).
  const indoorWorld = (() => {
    const world = typeof getWorld === "function" ? getWorld() : null;

    return !!world && world.outdoor === false;
  })();

  const snowing = !indoorWorld && isSnowWeather();
  const snowStartedAtMs = snowing ? getSnowStartedAtMs() : 0;
  const grassProgress = indoorWorld ? 1 : snowing ? 0 : getGrassProgress();

  let changed = false;
  let plantedRemaining = null; // lazy - bilangin lang kapag talagang kailangan (tingnan sa ibaba)

  for (const key of Object.keys(dug)) {
    const record = dug[key];
    const [col, row] = key.split(",").map(Number);

    // May tanim na - normal ay hindi ito ginagalaw ng panahon, PERO
    // habang umuulan ng niyebe, unti-unti itong nasisira (nagiging
    // payak na dirt, gaya ng ginagawa ng rake) - MALIBAN kung naabot na
    // ang floor (PLANTED_CROP_SNOW_MIN_SURVIVORS, o 0 kung kaunti na
    // talaga mula pa sa simula - tingnan ang getPlantedCropSnowFloor).
    if (record && record.seed) {
      if (!snowing) continue;

      if (plantedRemaining === null) {
        plantedRemaining = 0;

        for (const otherKey of Object.keys(dug)) {
          if (dug[otherKey] && dug[otherKey].seed) plantedRemaining++;
        }
      }

      const floor = getPlantedCropSnowFloor(dug, snowStartedAtMs);

      if (plantedRemaining <= floor) continue; // protektado - huwag munang galawin

      // Base sa MAS HULI sa dalawa: simula ng snow day, O kailan talaga
      // itinanim (record.seed.plantedAt) - kaya kung itinanim mo ito
      // HABANG umuulan na (matagal na simula ng snow day), sariwa pa
      // ring may PLANTED_CROP_SNOW_GRACE_MS itong palugit bago pa man
      // sumali sa "queue" ng pagkamatay, sa halip na agad-agad itong
      // masira dahil "expired" na raw ang snowStartedAtMs.
      const plantedAt = record.seed.plantedAt || record.at || now;
      const killAt =
        Math.max(snowStartedAtMs, plantedAt) +
        PLANTED_CROP_SNOW_GRACE_MS +
        tilePlantedSnowKillOrder(col, row) * PLANTED_CROP_SNOW_KILL_STAGGER_MS;

      if (now < killAt) continue;

      delete record.seed;
      record.at = now;
      plantedRemaining--;
      changed = true;

      spawnDigEffect(col, row);
      continue; // susunod na tawag na lang dito dadaan sa ordinaryong cascade sa ibaba
    }

    const dugAt = record && record.at ? record.at : 0;

    if (record && record.harvested) {
      // Katatapos lang aniin - laging 5 segundo lang, deretso, hindi
      // naghihintay sa tunay na "pagtubo ng damo" sa lokasyong ito
      // (hindi ito naaapektuhan ng grassHereAlready sa ibaba).
      if (now < dugAt + CARROT_HARVEST_REVERT_MS) continue;
    } else if (snowing) {
      // Ang 10 segundo ay binibilang mula sa MAS HULI sa dalawa: kailan
      // hinukay, o kailan nagsimula ang niyebe. Kaya ang hinukay BAGO pa
      // umulan ay may 10 segundo ring palugit pagsapit ng ulan.
      if (now < Math.max(dugAt, snowStartedAtMs) + getDugRevertMs()) continue;
    } else {
      // Tag-damo: babalik lang sa damo kapag TUMUBO NA nga ang damo sa
      // mismong pwestong ito (hindi lang basta "tag-damo na" sa
      // pangkalahatan) - kung hindi, biglang magiging damuhan ang
      // isang piraso ng lupa kahit niyebe pa ang paligid nito.
      const grassHereAlready = tileGrassOrder(col, row) <= grassProgress;

      if (!grassHereAlready) continue;
      if (now < dugAt + getDugRevertMs()) continue;
    }

    delete dug[key];
    changed = true;

    // Munting epekto sa pagbabalik - parang tinabunan/tinubuan.
    spawnDigEffect(col, row);
  }

  if (changed) saveDugTiles();
}

// Pare-parehong pagkakasunod ng "pagtubo" ng damo kada tile - hash na
// nakabatay sa posisyon, kaya kahit mag-reload ka, pareho pa rin ang
// mga unang tumutubo. Ang tile ay may damo na kapag ang sariling numero
// nito (0..1) ay mas mababa na sa getGrassProgress().
function tileGrassOrder(col, row) {
  const noise = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;

  return noise - Math.floor(noise);
}

// Kaparehong klase ng hash sa itaas, pero ibang numero - para hindi
// magkatugma (decorrelated) sa tileGrassOrder. Ginagamit ito ng
// drawGrass para malaman kung "basa" (wet-dirt) ang isang partikular na
// tile ng damo habang umuulan - PAREHO palagi ang resulta kada tile,
// kaya hindi ito nagpapalit-palit kada frame.
function tileWetOrder(col, row) {
  const noise = Math.sin(col * 271.3 + row * 143.9) * 91274.723;

  return noise - Math.floor(noise);
}

// Habang umuulan: 3/4 (75%) ng mga damong tile ang nagiging basang
// lupa (wet-dirt) sa halip na damo - hindi lahat, para hindi biglang
// nagmukhang solidong putik ang buong tanawin.
const RAIN_WET_GRASS_SHARE = 0.75;

// Gagamitin ba ang walang-niyebe na bersyon ng tile sa posisyong ito?
// (Tinatawag ito ng drawTile sa map.js, para sa MGA TILESET NA MAY
// "-clear.png" na kapares - hal. Snow.png + Snow-clear.png.)
//
// Pareho ang batayan ng damo at ng pagtunaw: ang tileGrassOrder ng
// cell laban sa getGrassProgress. Kaya kung saan unang tumutubo ang
// damo, doon din unang natutunaw ang niyebe ng bahay/puno/bato -
// sabay-sabay na nagpapalit ng panahon ang buong tanawin.
function shouldUseClearArt(x, y) {
  const world = getWorld();

  // Sa loob ng bahay, walang panahon - laging normal ang itsura.
  if (!world || !world.outdoor) return false;

  // Village/town(snowtown) - sariling kumpletong art na ang mga ito,
  // hindi dapat pinapalitan ng generic na "clear" na bersyon.
  if (!worldHasGroundWeatherOverlay()) return false;

  const progress = getGrassProgress();

  if (progress <= 0) return false;
  if (progress >= 1) return true;

  return (
    tileGrassOrder(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)) <=
    progress
  );
}

// Aling mga cell ang may laman sa "ground" layer (yung mga dekorasyong
// lupa na ipininta mo sa Tiled)? Hindi natin dinadamuhan ang mga iyon.
let groundCellCache = null;
let groundCellCacheWorld = null;

function getGroundLayerCells() {
  if (!mapReady || !mapData) return null;

  if (groundCellCache && groundCellCacheWorld === currentWorld) {
    return groundCellCache;
  }

  const occupied = new Set();

  for (const layer of flattenTileLayers(mapData.layers)) {
    if (layer.name.toLowerCase() !== "ground") continue;

    for (let i = 0; i < layer.data.length; i++) {
      if (layer.data[i]) {
        occupied.add((i % layer.width) + "," + Math.floor(i / layer.width));
      }
    }
  }

  groundCellCache = occupied;
  groundCellCacheWorld = currentWorld;

  return occupied;
}

// Ang damo - iginuguhit sa ibabaw ng snow layer pero sa ilalim ng mga
// hinukay na tile, bakas, mga bagay, at ng player. World space.
function drawGrass() {
  if (!mapReady || !mapData) return;
  if (!worldHasGroundWeatherOverlay()) return;

  const progress = getGrassProgress();

  if (progress <= 0) return;

  const world = getWorld();

  // Sa labas lang may panahon.
  if (!world || !world.outdoor) return;

  const gids = getDigGids();

  if (!gids || !gids.grassFirstgid) return;

  const groundCells = getGroundLayerCells();

  // Habang umuulan (rain.js): binabasa ang 3/4 ng mga tile ng damo -
  // ipinapakita bilang wet-dirt sa halip na damo, kinuha mula sa
  // RAIN_WET_DIRT block ng grass2.png (tingnan ang RAIN_WET_GRASS_SHARE/
  // tileWetOrder/getRainWetDirtLocalId sa itaas) - HINDI na ito gumagamit
  // ng gids.wet (ground-assets.png) tulad ng dati, iyon ay para na lang
  // sa basang FARM tile (drawDugTiles sa ibaba) matapos manghukay/
  // magdilig, magkaibang bagay ito sa "nabasang lupa dahil sa ulan".
  const raining = typeof isRaining === "function" && isRaining();

  for (let row = 0; row < mapData.height; row++) {
    for (let col = 0; col < mapData.width; col++) {
      if (groundCells && groundCells.has(col + "," + row)) continue;

      if (tileGrassOrder(col, row) <= progress) {
        const isWetFromRain = raining && tileWetOrder(col, row) < RAIN_WET_GRASS_SHARE;

        const paintedGid = isWetFromRain
          ? getPaintedGroundGid("wet_dirt", col, row)
          : getPaintedGroundGid("grass", col, row);

        drawTile(
          paintedGid ||
            (isWetFromRain
              ? gids.grassFirstgid + getRainWetDirtLocalId(col, row)
              : gids.grassFirstgid + getGrassLocalId(col, row)),
          col * TILE_SIZE,
          row * TILE_SIZE,
        );
      }
    }
  }
}

// Habang aktibong umuulan ng niyebe (isang buong "araw" kada buwan):
// unti-unting NATATABUNAN ng TUNAY na snow-ground TILE (mula sa
// Snow.tsx/Snow.png, tingnan ang SNOW_GROUND_LOCAL_ID sa itaas) ang
// lupa - hindi na lang basta puting overlay/tint. Ginagamit ang
// PAREHONG batayan (tileGrassOrder) ng damo, kaya ang unang tile na
// nawalan ng damo ay siya ring unang natatabunan ng niyebe - sabay-
// sabay na "nagbabago ng panahon" ang tanawin.
//
// May fade-in pa rin (ctx.globalAlpha = snowCoverage) para hindi
// biglaang "pop" ang bawat tile sa simula/dulo ng isang snow day -
// kapareho ng dating pakiramdam ng puting overlay, pero ngayon TUNAY
// na texture ang unti-unting lumalabas sa halip na flat na kulay.
function drawSnowGroundCover() {
  if (!mapReady || !mapData) return;
  if (!worldHasGroundWeatherOverlay()) return;
  if (typeof isSnowWeather !== "function" || !isSnowWeather()) return;

  const world = getWorld();

  if (!world || !world.outdoor) return;

  const grassProgress = getGrassProgress(); // 1 = buong damuhan pa, 0 = tuluyang natabunan
  const snowCoverage = 1 - grassProgress;

  if (snowCoverage <= 0) return;

  const groundCells = getGroundLayerCells();
  const gids = getDigGids();
  const snowGid = gids ? gids.snow : null;

  ctx.save();

  // Fallback: kung hindi ma-verify na na-load nang tama ang Snow.tsx sa
  // mundong ito (tingnan ang findLoadedTilesetFirstgid), bumalik sa
  // dating puting overlay sa halip na basta huwag magpakita ng anuman.
  if (!snowGid) ctx.fillStyle = "white";

  for (let row = 0; row < mapData.height; row++) {
    for (let col = 0; col < mapData.width; col++) {
      if (groundCells && groundCells.has(col + "," + row)) continue;

      // Dito na wala/kaunti na lang ang damo - doon na natabunan ng
      // niyebe (parehong desisyon na "tileGrassOrder <= progress" na
      // ginagamit din ng drawGrass, pero kabaligtaran - ITO ang mga
      // tile na LUMAMPAS na sa grassProgress, kaya hindi na damuhan).
      if (tileGrassOrder(col, row) > grassProgress) {
        const paintedGid = getPaintedGroundGid("snow", col, row);
        const tileGid = paintedGid || snowGid;

        ctx.globalAlpha = tileGid ? snowCoverage : snowCoverage * 0.55;

        if (tileGid) {
          drawTile(
            paintedGid ? paintedGid : getSnowGroundVariantGid(tileGid, col, row),
            col * TILE_SIZE,
            row * TILE_SIZE,
          );
        } else {
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  ctx.restore();
}

// =========================
// PAGGUHIT
// =========================

// Kapag nag-edit ka ng mapa sa Tiled (hal. naglagay ka ng puno sa dati
// mong hinukay), kailangang i-drop ang mga nahukay na tile na bawal na
// ngayon - kung hindi, may lupang nakasilip sa loob ng puno. Isang
// beses lang ito kada pagpasok sa mundo.
let dugTilesValidatedFor = null;

function validateDugTiles() {
  // =========================
  // AYOS (BUG, hiling ng user: "kapag labas ko ng gardenhouseinner to
  // grassmap pag balik ko is nawawala na yung natanim ko")
  // =========================
  //
  // SANHI: sa loadWorld (map.js), ang `mapReady = true` ay nauuna sa
  // `worldLoading = false` - ang huli ay nasa loob pa ng isang
  // setTimeout(MIN_LOADING_MS = 450ms). Kaya may humigit-kumulang
  // KALAHATING SEGUNDO na bintana kung saan `mapReady === true` PERO
  // `worldLoading === true` pa rin. Sa loob ng bintanang iyon,
  // tumatakbo na ang draw() kada frame -> drawDugTiles() (hindi na ito
  // humihinto dahil mapReady na) -> validateDugTiles() dito. At ang
  // UNANG linya ng canDigAt ay:
  //
  //     if (!mapReady || !mapData || worldLoading) return false;
  //
  // ...kaya FALSE ang isinasagot nito sa LAHAT ng tile - at ang loop sa
  // ibaba ay nagbubura ng bawat tile na hindi "canDigAt". Resulta:
  // pagbalik mo sa Garden House, NABUBURA ang BUONG taniman (kasama ang
  // mga tanim na hindi pa tapos), at dahil naitakda na ang
  // dugTilesValidatedFor, hindi na ito uulitin/maibabalik pa.
  //
  // AYOS: huwag munang mag-validate habang naglo-load pa ang mundo -
  // babalik na lang dito ang susunod na frame (hindi pa naitatakda ang
  // dugTilesValidatedFor, kaya awtomatiko itong susubok ulit) pagkatapos
  // ng tunay na pagka-load.
  if (typeof worldLoading !== "undefined" && worldLoading) return;
  if (!mapReady || !mapData) return;

  if (dugTilesValidatedFor === currentWorld) return;

  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  let dropped = 0;

  for (const key of Object.keys(dug)) {
    const [col, row] = key.split(",").map(Number);

    const value = dug[key];

    // PANGALAWANG proteksyon (depensa lang, bukod sa worldLoading na
    // guard sa itaas): ang isang tile na MAY TANIM ay hindi na dapat
    // basta-basta mabura ng validation na ito. Ang tanging dahilan para
    // tuluyan itong tanggalin ay kung TALAGANG wala na ito sa mapa
    // (labas na sa hangganan) - hal. napalitan/pinaliit ang mundo.
    // Lahat ng iba pang dahilan (may bagong puno sa ibabaw, atbp.) ay
    // hindi sapat para sirain ang pinaghirapan mong pananim.
    if (value && value.seed) {
      const insideMap =
        col >= 0 && row >= 0 && col < mapData.width && row < mapData.height;

      if (insideMap) continue;

      delete dug[key];
      dropped++;
      continue;
    }

    // Tanggalin muna pansamantala para hindi sabihin ng canDigAt na
    // "nahukay na" - ang tanong natin ay kung LEGAL pa ba ang cell.
    delete dug[key];

    if (canDigAt(col, row)) {
      // Ang mga LUMANG save ay "true" lang ang laman (walang oras) -
      // ituring silang matagal nang hukay, kaya wet-dirt na agad.
      dug[key] = value && value.at ? value : { at: 0 };
    } else {
      dropped++;
    }
  }

  if (dropped > 0) {
    console.log("Removed", dropped, "dug tile(s) - the map changed.");
    saveDugTiles();
  }

  dugTilesValidatedFor = currentWorld;
}

// Ini-inject natin ang mga tanim (carrots) sa Y-sort na "drawables" ng
// drawMapObjects (map.js), kaparehong-pareho ng ginagawa ng
// resources.js para sa mga puno/bato - kaya tama ang lalim nila laban
// sa player at sa ibang bagay: kapag mas mataas na ang tanim (frame3/4,
// aabot sa itaas ng sarili nitong tile), hindi na ito natatabunan ng
// katabing tile o ng player na dapat sana ay NASA LIKOD pa nito.
function getCarrotDrawables() {
  const dug = getDugTilesForCurrentWorld();

  if (!dug) return [];

  const drawables = [];

  for (const key of Object.keys(dug)) {
    const record = dug[key];

    if (!record || !record.seed) continue;

    // Bago pa frame3 ang tubo, iginuguhit na ito sa drawDugTiles (laging
    // nasa likod ng player) - dito lang isinasama ang mga nasa frame
    // 3/4 na para sa Y-sort.
    if (!shouldCarrotOverlapPlayer(record.seed)) continue;

    const [col, row] = key.split(",").map(Number);

    // AYOS (hiling ng user): "gawin mong eksaktong 50% (gitna) ng
    // tile ang hati - kapag nasa itaas na kalahati (51%+) ang
    // character, nasa LIKOD siya ng tanim; kapag nasa ibaba (49%
    // pababa), NASA HARAP siya" - dating "overflow-based" ang
    // sortY (row*TILE_SIZE + TILE_SIZE - overflow, base sa TUNAY na
    // taas ng bawat larawan ng bawat crop) - HINDI pantay-pantay ang
    // resulta nito kada uri ng gulay (magkaiba ang taas ng
    // carrot4/potato4/cabbage4/eggplant4 sa isa't isa), kaya
    // lumilitaw itong "mali"/hindi magkatugma depende sa tanim.
    // Ngayon, FIXED na sa EKSAKTONG GITNA ng tile mismo ang threshold
    // (row*TILE_SIZE + TILE_SIZE/2) - PAREHONG-PAREHO na ito sa LAHAT
    // ng crop/stage, kaya laging pareho/predictable ang "50/50" split:
    // parating naaabot ng "isang hakbang" (1 tile) pataas/pababa ang
    // sapat para lumipat mula likod papuntang harap (o kabaliktaran).
    const tileTop = row * TILE_SIZE;
    const tileCenterY = tileTop + TILE_SIZE / 2;

    drawables.push({
      sortY: tileCenterY,
      order: -1,
      draw: () => drawCarrotFrame(getCarrotStageIndex(record.seed), col, row, record.seed.type),
    });
  }

  return drawables;
}

// Ang mga nahukay na tile - iginuguhit sa ibabaw ng snow layer, sa
// ilalim ng footprints, mga bagay, at ng player. World space (nasa
// loob ng camera transform sa draw.js).
function drawDugTiles() {
  if (!mapReady || !mapData) return;

  validateDugTiles();

  const dug = getDugTilesForCurrentWorld();

  if (!dug) return;

  const gids = getDigGids();
  const now = getGameNow();

  // BAGO (hiling ng user): sa loob ng GARDEN HOUSE ay WALANG tileset ang
  // synthetic na silid (`tilesets: []`, tingnan ang
  // buildSyntheticInteriorTmj) - kaya walang maiguguhit ang normal na
  // drawTile(gid) doon. Sa halip, may SARILING artwork ang template para
  // sa HINUKAY na lupa (`interiorDugImagePath`) - eksaktong KAPAREHONG
  // 320x320 na larawan, araro lang ang lupa - at kinukuha natin dito ang
  // 16x16 na crop ng MISMONG tile na nahukay. Kaya isa-isang nagbabago
  // ang itsura ng bawat tile habang inaararo, at perpektong tumutugma
  // ito sa background dahil iisang artwork lang naman sila.
  const dugImage =
    typeof getBuilderInteriorDugImage === "function"
      ? getBuilderInteriorDugImage(currentWorld)
      : null;

  // Ang tile na ito mula sa HINUKAY na artwork - `true` kung naiguhit,
  // `false` kung walang dug artwork ang mundong ito (kaya dapat na lang
  // bumalik sa normal na drawTile(gid) na landas sa ibaba).
  const drawDugArtTile = (col, row) => {
    if (!dugImage) return false;

    ctx.drawImage(
      dugImage,
      col * TILE_SIZE,
      row * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
      col * TILE_SIZE,
      row * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    );

    return true;
  };

  for (const key of Object.keys(dug)) {
    const [col, row] = key.split(",").map(Number);
    const record = dug[key];

    // May tanim dito. BAGO (hiling ng user): dating "continue" agad
    // dito (walang iginuguhit na dirt/wet-dirt sa ILALIM ng tumutubong
    // tanim) - kaya nagmumukhang bumalik/nanatiling basta damo ang
    // lupa sa TINGIN ng manlalaro habang tumutubo pa lang ang carrot,
    // kahit hindi pa talaga ito naaani/nawawala. AYOS: iginuguhit muna
    // ang tamang dirt/wet-dirt tile (parehong tuyo->basa->tuyo na
    // cascade ng isang sariwang hukay, base sa KAILAN ITO ITINANIM -
    // record.seed.plantedAt), saka lang ang carrot sprite sa ibabaw
    // nito - kaya TALAGANG "tilled farmland na may tumutubong tanim"
    // ang itsura, hindi basta plain grass. Hindi na ito babalik pa sa
    // likas na lupa habang MAY seed pa (tingnan ang updateGroundWeather),
    // kaya panatag itong ipakita nang tuloy-tuloy anuman ang gawin
    // (kasama na ang pagpasok/paglabas sa bahay).
    if (record && record.seed) {
      const plantedAt = record.seed.plantedAt || record.at || now;
      const elapsedSincePlanted = now - plantedAt;
      const isWetSincePlanted =
        elapsedSincePlanted >= WET_DIRT_DELAY_MS &&
        elapsedSincePlanted < WET_DIRT_DELAY_MS + DIRT_AGAIN_DELAY_MS;

      // Sa Garden House, ang sariling HINUKAY na artwork ang ginagamit
      // (walang wet/dry na bersyon doon - iisang naararong lupa lang).
      if (!drawDugArtTile(col, row)) {
        const plantedGid = getPaintedGroundGid(
          isWetSincePlanted ? "wet_dirt" : "dirt",
          col,
          row,
        );

        drawTile(
          plantedGid || (isWetSincePlanted ? gids.wet : gids.dirt),
          col * TILE_SIZE,
          row * TILE_SIZE,
        );
      }

      if (!shouldCarrotOverlapPlayer(record.seed)) {
        drawCarrotFrame(getCarrotStageIndex(record.seed), col, row, record.seed.type);
      }
      continue;
    }

    const dugAt = record && record.at ? record.at : 0;
    const elapsed = now - dugAt;

    // Katatapos lang aniin - payak na tuyong dirt lang habang nasa
    // loob ng maikling 5-segundong palugit bago ito bumalik sa likas
    // na lupa (tingnan ang updateGroundWeather) - hindi ito dumadaan
    // sa wet stage.
    //
    // Sariwang hukay (walang tanim kailanman) = tuyong dirt. Pagkalipas
    // ng 5 segundo, nagiging basa ito; pagkalipas ng dagdag na 10
    // segundo, tumutuyo ulit - tapos may isa pang 10 segundo bago
    // bumalik sa likas na lupa.
    const isWet =
      !(record && record.harvested) &&
      elapsed >= WET_DIRT_DELAY_MS &&
      elapsed < WET_DIRT_DELAY_MS + DIRT_AGAIN_DELAY_MS;

    // Kaparehong dahilan ng may-tanim na sangay sa itaas.
    if (drawDugArtTile(col, row)) continue;

    const paintedGid = getPaintedGroundGid(isWet ? "wet_dirt" : "dirt", col, row);

    drawTile(
      paintedGid || (isWet ? gids.wet : gids.dirt),
      col * TILE_SIZE,
      row * TILE_SIZE,
    );
  }
}

// Iginuguhit ang puting/pulang outline sa isang tile - puti = puwedeng
// gawin ang aksyon, pula/malabo = abot mo pero bawal (may bagay,
// collision, pintuan, atbp).
function strokeDigCursorTile(outlineTile, diggable) {
  ctx.save();

  // Nasa loob tayo ng camera.zoom-scaled na context - kaya kung "1"
  // lang ang lineWidth dito, "1 * zoom" na device pixels talaga ang
  // lumalabas (hal. 6px sa zoom na 6). Hinahati natin sa zoom para
  // isang TUNAY na device pixel lang ang guhit, kahit anong zoom.
  const lineWidth = 1 / camera.zoom;

  ctx.lineWidth = lineWidth;

  ctx.strokeStyle = diggable
    ? "rgba(255, 255, 255, 0.9)"
    : "rgba(255, 80, 80, 0.45)";

  ctx.strokeRect(
    outlineTile.col * TILE_SIZE + lineWidth / 2,
    outlineTile.row * TILE_SIZE + lineWidth / 2,
    TILE_SIZE - lineWidth,
    TILE_SIZE - lineWidth,
  );

  ctx.restore();
}

// Ang tile na tinututukan ng mouse. Puting outline = puwedeng gawin
// ang aksyon; pulang malabo = abot mo pero bawal (may bagay, collision,
// o pintuan). Walang ipinapakita kapag malayo o walang gagawin - para
// hindi magulo ang screen.
function drawDigCursor() {
  if (!mapReady || worldLoading) return;

  const tile = getMouseTile();

  if (!tile) return;

  // AWTOMATIKONG "KAMAY" - una itong sinusubukan (tingnan ang
  // mousedown), kahit anong tool (o wala man) ang naka-equip - kaya
  // dito rin ito unang tinitingnan bago ang rake/binhi na guide.
  // Ituro ang resolved na tile (tingnan ang resolveHandClickTile) -
  // kapag nakatuon ang mouse sa umaapaw na dulo ng isang mataas na
  // hinog na tanim, dapat ang tile SA IBABA (kung saan talaga
  // pinagtaniman) ang mag-highlight, para tumapat ang biswal na gabay
  // sa kung ano talaga ang mangyayari kapag na-click.
  const handTile = resolveHandClickTile(tile.col, tile.row);

  if (isTileInReach(handTile.col, handTile.row) && hasHandActionAt(handTile.col, handTile.row)) {
    strokeDigCursorTile(handTile, true);
    return;
  }

  if (!rakeEquipped && !canPlantCarrot()) return;

  if (!isTileInReach(tile.col, tile.row)) return;

  let diggable;

  if (rakeEquipped) {
    const dug = getDugTilesForCurrentWorld();
    const record = dug ? dug[tile.col + "," + tile.row] : null;

    // Ang may-tanim na tile ay HINDI na gumagalaw sa rake (tingnan ang
    // mousedown sa itaas) - kaya WALA nang guhit na ipinapakita dito,
    // sa halip na isang PUTING outline na nangangakong may mangyayari
    // kapag na-click.
    if (record && record.seed) return;

    diggable = canDigAt(tile.col, tile.row);
  } else {
    const dug = getDugTilesForCurrentWorld();
    const record = dug ? dug[tile.col + "," + tile.row] : null;

    diggable = !!record && !record.seed;
  }

  strokeDigCursorTile(tile, diggable);
}

// Ang aktwal na mouse cursor (hindi yung puting/pulang outline sa itaas) -
// nagiging "pointer" (parang naka-highlight na dampot) kapag may
// maidadampot/maaani sa tinuturo, kahit anong tool ang naka-equip.
// Tinatawag kada frame (update.js) - hindi lang sa mousemove, dahil
// puwedeng magbago ang reach ng player (gumalaw) kahit hindi gumagalaw
// ang mouse.
function updateCanvasCursor() {
  if (!mouseOnCanvas || !mapReady || worldLoading) {
    canvas.style.cursor = "";
    return;
  }

  const tile = getMouseTile();

  if (tile) {
    const handTile = resolveHandClickTile(tile.col, tile.row);

    if (isTileInReach(handTile.col, handTile.row) && hasHandActionAt(handTile.col, handTile.row)) {
      canvas.style.cursor = "pointer";
      return;
    }
  }

  canvas.style.cursor = "";
}
