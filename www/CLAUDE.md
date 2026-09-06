# CLAUDE.md — Gabay sa Proyektong Ito

> Basahin muna ito bago mag-edit. Layunin ng file na ito: mabilis maintindihan
> ng kahit sinong bagong session (o bagong tao) kung paano gumagana ang laro,
> saan naka-lagay ang mga bagay, at kung anong mga desisyon ang ginawa na —
> para hindi na kailangang basahin ang buong codebase mula simula.

---

## 1. Ano ito

Isang 2D top-down farming/exploration game na puro **vanilla JavaScript + HTML
canvas** (walang framework, walang build step). Direkta lang bubuksan sa
browser ang `index.html`. Tiled map editor ang pinagmulan ng mga mapa (`.tmj`
/ `.tmx` na JSON/XML na nasa `assets/map/`).

- **Wika ng mga comment:** Tagalog. Panatilihin ito — sundin ang parehong
  estilo (mahaba at nagpapaliwanag ng "bakit", hindi lang "ano") kapag
  nagdadagdag ng code.
- **Walang bundler/npm.** Ang bawat `js/*.js` ay isang plain `<script>` na
  sunod-sunod na nilo-load sa `index.html`. Lahat ng function/variable ay
  **global** (walang modules/import). Kaya OK lang tawagin ang function ng
  ibang file basta na-load na ito (tingnan ang load order sa ibaba).
- **Persistence:** `localStorage` (hukay na lupa, tanim, inventory, calendar).

## 2. Paano patakbuhin

Kailangan ng maliit na HTTP server (dahil nag-fe-fetch ng mapa/asset ang
laro — hindi gagana sa `file://` dahil sa CORS):

```bash
# alinman sa mga ito, mula sa loob ng folder na may index.html:
python3 -m http.server 8000
# tapos buksan sa browser: http://localhost:8000
```

## 3. Estruktura ng folder

```
index.html          # entry point — dito naka-listahan ang script load order
style.css           # lahat ng UI styling (hotbar, radial menu, shop panel, atbp.)
script.js           # (legacy/root script — tingnan kung ginagamit pa)
js/                  # lahat ng game logic (tingnan sa ibaba)
assets/
  map/              # Tiled maps (.tmj/.tmx) + tilesets (.tsx/.tsj) + tile PNGs
  player/           # player sprite sheets (idle/walk/run + tool animations)
                    #   idle*/walk* ay ang "santa"/bagong character na
                    #   ngayon (galing sa assets/character/, tingnan Entry
                    #   #59 - SINUPERSEDE na ang Entry #58/oldman na tangkang
                    #   ito) - run/sit/tool animations, HINDI pa binago,
                    #   bata pa rin ang lumang character doon.
                    #   Naka-backup ang TALAGANG ORIHINAL na bata na
                    #   idle*/walk* sa
                    #   assets/player/_backup_original_player_sprites/.
  character/        # "santa" character (idle/walk, 4 direksyon) - PINAGMULAN
                    #   ngayon ng idle/walk sprite ng PLAYER (Entry #59).
                    #   May .ase (Aseprite source) + .png (exported strip)
                    #   kada direksyon - IBA-IBA ang bilang ng frame kada
                    #   isa sa ORIHINAL na PNG (idle=7, walk front/back=10,
                    #   walk right=7) - hindi ito direktang nagamit, dahil
                    #   FIXED sa 6 frames/strip ang engine (tingnan Entry
                    #   #59 para sa paliwanag). WALANG PNG ang leftwalk (.ase
                    #   lang) - kinuha na lang/na-mirror ang rightwalk.
  npc/              # oldman idle GIFs (oldmanIdleFront/Back.gif) +
                    #   npc/oldman/walk/Oldman_<dir>/ (walking GIFs) - HINDI
                    #   na ito ang ginagamit ng player (nabawi na, tingnan
                    #   Entry #59) - gumagana pa rin ito para sa ORIHINAL na
                    #   oldman NPC (shopkeeper).
  animals/pig/      # pig walk (Pig_<dir>/) + idle (8 direksyon, PNG)
  trees/ rocks/     # resource art
  carrots/          # crop growth frames
```

## 4. Script load order (mula sa `index.html`)

Mahalaga ang pagkakasunod dahil global lahat. Simplipikadong listahan:

```
canvas → assets → gametime → player → camera → input → collisions →
worlds → footprints → map → dig → resources → decor → bed →
ground-items → hotbar → craft → stove → inventory-save →
settings-menu → tool-radial → atmosphere → calendar → snow → rain →
fireflies → calendar-ui → update → draw → main
```

- `main.js` — game loop (requestAnimationFrame).
- `update.js` — bawat frame na logic (galaw, panahon, world transitions).
- `draw.js` — bawat frame na pagguhit (tumatawag sa mga drawer ng ibang file).

## 5. Mahahalagang file at ano ang laman

| File | Responsibilidad |
|------|-----------------|
| `js/gametime.js` | **Game clock** — `getGameNow()` (Date.now() + sleep offset), `gameEpochMs` (dinamikong simula, Taon 2000), `advanceGameTime()`. Ginagamit ng lahat ng calendar/panahon/paglaki-ng-tanim na kwenta. |
| `js/worlds.js` | Depinisyon ng mga mundo (`WORLDS`), `currentWorld`, `DOORS`, at kung `outdoor` (may panahon) ba. Worlds: `village`, `starter`, `snow(...)`, at `houseInside`. |
| `js/map.js` | Pag-load/pagguhit ng Tiled map. **Y-sort (painter's algorithm)** at ang **see-through occlusion** (paglabo ng puno/bahay kapag nasa likod ang player). Dito rin ang paghahati ng puno sa paligid ng bahay. |
| `js/dig.js` | Rake/hukay ng lupa, tanim ng carrot, lifecycle ng lupa (grass→dirt→wet→grass), at ang **equip state ng mga tool** (`pickaxeEquipped`, `rakeEquipped`, atbp.). |
| `js/resources.js` | Random na puno/bato, pag-chop (axe/kamao), at `axeEquipped`/`arrowEquipped`/`torchEquipped`. |
| `js/decor.js` | Static na dekorasyon, **oldman NPC** (naglalakad/nawawala + shop), at oak trees. |
| `js/pig.js` | **Mga baboy** - gumagala sa mapa, may "health"/clickable, namamatay-nabubuhay-muli (tingnan ang bahagi 7, item 12). |
| `js/bed.js` | Ang **kama** sa loob ng houseInside — i-click para matulog hanggang 6am (gabi lang puwede). |
| `js/tool-radial.js` | Ang **radial (pabilog) na tool menu** — hawak-Alt para buksan. |
| `js/hotbar.js` | Inventory bar, equipment panel (left/right hand), drag-drop, item counts. Pinakamalaking file. |
| `js/player.js` | Player sprite + tool swing animations (rake/pickaxe/axe/punch). Idle/walk sprites niya ngayon (`js/assets.js`) ay galing sa "santa" character art (`assets/character/`) - tingnan Entry #59 (SINUPERSEDE na ang Entry #58/oldman). |
| `js/craft.js` | Crafting (shaped recipes → nagbu-unlock ng mga tool). |
| `js/stove.js` | Kalan/pagluluto. |
| `js/settings-menu.js` | Burger-icon na menu (I-save/I-load/Settings/Lumabas). |
| `js/atmosphere.js`, `snow.js`, `rain.js`, `fireflies.js`, `calendar.js` | Panahon, gabi/araw na ilaw, seasons. |

## 6. Mahahalagang konsepto / "gotchas"

- **Global scope lang.** Kapag tumawag ng function ng ibang file, iwasang mag-
  assume na na-load na — gumamit ng `typeof foo === "function"` guard kapag
  hindi sigurado (ganito ang ginagawa ng existing code).
- **Tool mutual-exclusivity:** iisa lang ang puwedeng hawak sa "right hand"
  (pickaxe/rake/axe). Tinatanggal sila ng `clearAllToolEquips()` sa `dig.js`.
  Ang **arrow** (cursor mode) at **torch** (left hand) ay HINDI kasama dito —
  puwede silang kasabay ng ibang tool.
- **Tool equip functions nagto-toggle:** `equipPickaxe()`, `equipRake()`,
  `equipAxe()`, `equipArrow()` — kapag naka-equip na, ino-off nila. Para sa
  **force-equip** (laging ON, hindi toggle) gamitin ang `setRightHandTool(name)`
  sa `dig.js` (`name` = `"pickaxe"|"rake"|"axe"|"arrow"`).
- **Occlusion (paglabo):** nasa `map.js` → `shouldOccludeForPlayer()`. Isang
  bagay ay lumalabo LANG kung: (a) iginuhit ito pagkatapos ng player (nasa
  harap/tumatakip), at (b) nag-o-overlap ang box nito sa player, at (c) ang
  `type` nito ay nasa `OCCLUDABLE_OVERLAP_TYPES` (`trees`, `house` lang).
- **Tiled GIDs:** hindi puwedeng i-hardcode ang buong gid — nagbabago ang
  `firstgid` kada mapa. Ang **local id** lang ang itinatabi, tapos kinu-compute
  ang tamang gid (tingnan ang `getDigGids()` sa `dig.js`).
- **Cache-busting:** may `?v=<timestamp>` ang bawat script sa `index.html`.
  Kapag nag-edit ng JS at hindi nag-uupdate ang browser, palitan/bumphin ang
  bilang na iyon (o hard-refresh).
- **Oras/kalendaryo:** GAMITIN LAGI ang `getGameNow()` (`js/gametime.js`),
  HINDI `Date.now()`, para sa anumang bago/susunod pang KALENDARYO/
  day-night/panahon/paglaki-ng-tanim/pagbalik-ng-lupa na code — kung
  hindi, hindi ito sasama sa sleep time-skip (tingnan ang bahagi 11 sa
  ibaba). Real-time na INPUT COOLDOWN lang (mabilis na pag-click,
  hal. `lastRakeAt`) ang dapat manatiling `Date.now()`.

## 7. Mga BINAGO na feature (kasaysayan ng mga request)

Labing-isang pagbabago na ang ginawa. Narito kung saan tumingin kapag
kailangang i-adjust ang mga ito.

### (1) Bahay lumalabo lang kapag SALIKOD, hindi kapag sa gilid
- **File:** `js/map.js`
- **Paano:** bagong `getOcclusionCheckBox(item)` — para sa `type === "house"`,
  nini-nipis ang overlap box papuntang gitna gamit ang
  `HOUSE_OCCLUSION_BODY_RATIO` (kasalukuyan: **0.55**, ibig sabihin 55% ng
  lapad, nakasentro). Kaya kapag nasa gilid (kaliwa/kanan) lang ang player,
  hindi lumalabo; kapag salikod ng katawan, lumalabo.
- **Para i-adjust:** baguhin ang `HOUSE_OCCLUSION_BODY_RATIO` (mas maliit =
  mas makitid ang "salikod" zone).
- **Tandaan:** ang narrowing ay para LANG sa occlusion check — hindi apektado
  ang `baseY`/Y-sort ng bahay (buong lapad pa rin iyon).

### (2) Rake grass → dirt, balik grass pag 10s walang tanim
- **File:** `js/dig.js`
- **Paano:**
  - Bagong konstant `GRASS_RAKE_REVERT_MS = 10000` (10 segundo).
  - Sa `updateGroundWeather()` (non-snow branch): kung walang `record.seed`
    (walang tanim) at lampas na sa 10s, babalik sa damo.
  - Sa `drawDugTiles()`: sa normal na damuhan (walang niyebe), **plain dirt**
    ang ipinapakita sa buong 10s (in-skip ang "wet dirt" stage) — malinaw na
    lupa ang kita. Ang wet stage ay para na lang sa niyebe/ulan na cascade.
  - Kapag NAGTANIM ka sa loob ng 10s, hindi na babalik (may `seed` na).
- **Para i-adjust:** baguhin ang `GRASS_RAKE_REVERT_MS`.
- **Tandaan:** ang niyebe/ulan ay may sariling mas mabagal na revert
  (`DUG_REVERT_MS` = 25s) — hindi ito ginalaw.

### (3) Tool radial: hawak-Alt para buksan, LABAS ng bilog = unequip
- **File:** `js/tool-radial.js`
- **Paano:**
  - **Alt** ang hold para buksan ang bilog. Bitaw = confirm.
  - Tutok sa isang direksyon (LOOB ng bilog) → force-equip ng kaukulang
    tool (`TOOL_RADIAL_EQUIP_BY_DIRECTION`, tumatawag sa
    `equipPickaxe/Rake/Axe/Arrow`).
  - GITNA (dead zone, `TOOL_RADIAL_DEAD_ZONE_PX` = 22px mula sa senter) =
    "cancel" — walang nagbabago, mananatili ang dati mong naka-equip.
  - **LABAS ng bilog** (distance > `toolRadialOuterRadiusPx`, kinukuha nang
    live mula sa kalahati ng lapad ng `#tool-radial` panel sa CSS, ~95px) =
    walang PINILI kahit ano, kaya **ino-unequip** ang kasalukuyang naka-equip
    na tool (`clearAllToolEquips()`) — sadyang iba ito sa gitnang
    "cancel": dati (dating desisyon) ie-equip lang ulit ang pinakahuling
    ginamit na tool dito, pero base sa bagong request, dapat talagang
    mawalan ng equip — kaya UNEQUIP na ngayon, hindi na "balik sa
    huling ginamit".
- **Direction → tool mapping:** `TOOL_RADIAL_EQUIP_BY_DIRECTION`
  (top=pickaxe, right=rake, bottom=axe, left=arrow).
- **Alerto:** ang **Alt** ay minsan nafo-focus ang browser menu bar. May
  `event.preventDefault()` na — pero i-test sa aktwal na browser. May
  `window.addEventListener("blur", ...)` din para isara ang radial kung
  mawala ang window focus habang naka-hold ang Alt.

### (4) Oldman: walang opacity kapag dumaan ang player
- **File:** `js/decor.js` → `getOldManDrawables()`
- **Paano:** nilagyan ng `type: "npc"`. Dahil wala ang `"npc"` sa
  `OCCLUDABLE_OVERLAP_TYPES` (`map.js`), hindi na siya lumalabo kahit dumaan sa
  likod niya ang player.
- **Para baligtarin:** tanggalin ang `type: "npc"` (babalik sa dating paglabo),
  o idagdag ang `"npc"` sa `OCCLUDABLE_OVERLAP_TYPES`.

### (5) Naayos: rake hindi nagiging dirt (nananatiling parang damo)
- **File:** `js/dig.js` (`getDigGids()`)
- **Sanhi ng bug:** ang dating pinagmumulan ng dirt/wet/grass gids
  (`Tiles.tsx`) ay may **SIRANG `<image>` path**
  (`../../../../../Downloads/assets.png` — path sa personal na computer ng
  dating developer, wala sa project) — kaya PALAGING nabibigo itong mag-load,
  at natatanggal sa runtime tileset list. Ang problema: may IBANG tileset
  (`dirt.tsx`, tumuturo sa `vegetableList.png`) na **nagkataong magkatulad
  ang `firstgid`** nito sa `Tiles.tsx` sa loob ng `newmap.tmj`/`snowMap.tmj`
  (parehong 12289) — kaya `dirt.tsx` na lang ang na-load sa puwesto ng
  `Tiles.tsx`. Resulta: ang "dirt" gid na kino-compute gamit ang firstgid na
  iyon ay random na pixel ng GULAY (berde) pala ang nakukuha mula sa
  `vegetableList.png` — mukhang damo pa rin kahit naka-rake ka na (parang
  "walang nangyayari").
- **Ayos:** gumagamit na ngayon ng dalawang tileset na PATUNAY nang gumagana
  (parehong ginagamit din ng "dirt"/"wet_dirt"/"grass" layers mismo sa loob
  ng `newmap.tmj`): `new-ground.tsj` (larawan: `grass2.png`) para sa
  dirt/grass, at `ground-assets.tsj` (larawan: `ground-assets.png`) para sa
  mas maitim/mamasa-masang wet-dirt stage.
- **Bagong safety net (`findLoadedTilesetFirstgid()`):** bago gamitin ang
  firstgid ng isang tileset, ino-verify muna na TALAGANG na-load ang tamang
  larawan nito (tinitingnan ang runtime `tilesets` array ng `map.js` — dapat
  may parehong firstgid AT parehong bilang ng columns). Kung hindi tumugma
  (nabigo itong mag-load, o may ibang tileset na "nag-agaw" ng parehong
  firstgid, gaya mismo ng nangyari dati), ibinabalik ang `null` sa halip na
  basta gamitin — para hindi na maulit ang parehong klase ng SILENT na bug.
- **Para i-adjust:** baguhin ang `DIRT_LOCAL_ID`/`WET_DIRT_LOCAL_ID`/
  `GRASS_LOCAL_ID` sa `js/dig.js` (mga posisyon ngayon sa loob ng
  `grass2.png`/`ground-assets.png`, hindi na sa `Tiles.tsx`).
- **Tandaan:** kung magdadagdag pa ng bagong tileset sa Tiled na SIRA rin ang
  image path nito, at nagkataong magkatulad ang firstgid sa ibang tileset —
  puwedeng maulit ang parehong klase ng bug kahit saang bahagi ng laro
  (hindi lang dito). Mas maganda kung ayusin/palitan na lang ang aktwal na
  `<image>` reference sa `assets/map/Tiles.tsx` balang araw kapag available
  na ang tunay na larawan nito.

### (6) Naayos: tool radial "labas ng bilog" ay hindi na nag-e-equip
- **File:** `js/tool-radial.js`
- Dati, kahit gaano kalayo ang tutok ng mouse mula sa senter (basta labas na
  ng gitnang dead zone), isa pa rin sa 4 na direksyon (pinakamalapit na
  anggulo) ang napipili — walang paraan para talagang "wala" ang mapili
  maliban sa mismong gitna. Ngayon, may hiwalay nang **outer radius** check
  (tingnan ang bahagi 3 sa itaas) — LABAS ng bilog = unequip, hindi equip.

### (7) Naayos: maling texture ng "grass" (dating plain lang, ngayon halo-halo)
- **Files:** `js/dig.js` (`getGrassLocalId`/`grassVariantRoll`),
  `assets/map/newmap.tmj` (`"grass"` na tilelayer)
- **Sanhi:** dalawang HIWALAY na sistema ang gumuguhit ng damo, at PAREHONG
  gumagamit lang ng "plain"/walang-dekorasyong bahagi ng `grass2.png`
  (`GRASS_LOCAL_ID = 22`, isang fixed tile lang):
  1. Ang STATIC `"grass"` tilelayer na nakapinta mismo sa `newmap.tmj`
     (Tiled) — ito ang laging nasa ILALIM ng `"snow"` layer, kaya bihira
     lang talaga makita (nakatago sa likod ng niyebe).
  2. Ang DYNAMIC na `drawGrass()` sa `dig.js` — ito ang TALAGANG kita ng
     manlalaro habang natutunaw ang niyebe/lumalaki ang damo (tingnan ang
     `getGrassProgress()`) — ito mismo ang "mali" na grass na nakita sa
     screenshot (walang bulaklak/bato, plain/patag lang).
- **Ayos:** ngayon DALAWANG variant block na ang ginagamit mula sa
  `grass2.png`, PINAGSAMA (weighted mix, hindi 50/50):
  - `GRASS_PLAIN_BASE_LOCAL_ID = 22` (2x4 block) — payak na damo, ito ang
    MADALAS lumabas (default).
  - `GRASS_DECOR_BASE_LOCAL_ID = 27` (4x4 block) — may bulaklak/bato, ito
    ang BIHIRA lang lumabas — kinokontrol ng `GRASS_DECOR_CHANCE_PERCENT`
    (kasalukuyan: **15%** ng mga tile).
  - Ang pagpili kung "plain" o "decorated" ang isang partikular na tile ay
    base sa isang deterministic na "hash" ng (col, row) — `grassVariantRoll()`
    — kaya PARE-PAREHO palagi ang resulta sa parehong tile (hindi
    nagbabago-bago kada frame), pero hindi rin halatang paulit-ulit ang
    pattern (hindi basta modulo lang).
  - Ang `newmap.tmj` mismo ay in-regenerate (script, hindi manual sa Tiled)
    gamit ang KAPAREHONG porsyento/formula sa Python, para magkatugma pa
    rin ang static layer at ang dynamic system kung sakaling maging
    biglang visible ang static layer balang araw (hal. kung tinanggal ang
    `"snow"` layer sa itaas nito).
- **Para i-adjust:** baguhin ang `GRASS_DECOR_CHANCE_PERCENT` sa `dig.js`
  (mas mataas = mas madalas lumabas ang bulaklak/bato). Kapag binago ito,
  kailangan ding patakbuhin ulit ang parehong script (Python, tingnan ang
  git history/session na ito) para i-regenerate ang `newmap.tmj` gamit ang
  bagong porsyento — hindi ito nagse-sync na mag-isa.
- **Tandaan:** kung gagawa ng bagong outdoor world sa hinaharap na may sarili
  nitong bagong tileset (hindi `new-ground.tsj`/`grass2.png`), hindi
  awtomatikong mag-a-apply ang parehong 2 block na ito — kailangang hanapin
  muna ang katumbas na "plain"/"decorated" na posisyon sa BAGONG tileset.

### (8) Oldman shop: bili na sa pag-DRAG (hindi na click), may quantity popup, at naka-grayscale na kapag hindi na kaya bilhin
- **Files:** `js/decor.js`, `js/hotbar.js` (pointermove/pointerup drag
  handling), `index.html` (`#oldman-buy-qty-popup`), `style.css`
- **Bago:** click lang sa isang cell sa `#oldman-shop-grid` = agad bumibili
  ng 1 piraso. Naka-`opacity: 1` (walang epekto) ang `:disabled` state ng
  cell — kaya kahit naubos na ang stock o hindi na kayang bilhin, PAREHO
  pa rin ang itsura/kulay ng item (walang visual feedback).
- **Ngayon:**
  - **Drag-only ang pagbili** — kagaya na ng LUMANG paraan ng pag-drag
    (`dragGhostEl`, hindi ang bagong "float economy") na ginagamit na rin
    ng equip-left/equip-right sa `hotbar.js`. Bagong drag source:
    `"oldman-buy"` — sinisimulan sa `startOldManBuyDrag()` (decor.js,
    `pointerdown` sa shop cell), tinatapos sa `pointerup` (hotbar.js) kung
    na-drop sa bag/hotbar → tumatawag ng `startOldManBuyFlow()`.
  - **Quantity popup** (`#oldman-buy-qty-popup`, kaparehong-pareho ng
    istilo ng `#oldman-sell-qty-popup` na dati nang meron) — lumalabas
    kung higit sa 1 ang pinakamalaking dami na kaya bilhin (`maxAffordableOldManCount()`,
    hinahadlangan pareho ng STOCK at ng GOLD). Kung 1 lang, direkta nang
    nabibili (walang popup) — kagaya ng gawi ng sell flow.
  - **Naka-grayscale na ngayon ang disabled cell** —
    `.oldman-shop-cell:disabled { opacity: 0.35; filter: grayscale(1); }`
    sa `style.css` (dati `opacity: 1`, walang epekto).
- **Bagong function sa `decor.js`:** `buyFromOldManQuantity(itemId, qty)`
  (bulk buy, kapareho ng existing `sellToOldManQuantity`),
  `maxAffordableOldManCount()`, `startOldManBuyDrag()`, `startOldManBuyFlow()`,
  `openOldManBuyQtyPopup()`/`closeOldManBuyQtyPopup()`.
- **Para i-adjust:** presyo/stock pa rin sa `OLDMAN_SHOP_ITEMS` (decor.js).

### (9) Normal/walang-lamang panimulang inventory (tinanggal ang "testing stock")
- **Files:** `js/dig.js`, `js/resources.js`, `js/inventory-save.js`
- **Sanhi:** may mga "panandaliang testing default" na naiwan mula sa
  ibang sesyon (para agad may masubukang tool/swing animation nang hindi
  na kailangang mag-craft/mangolekta muna): `pickaxeUnlocked`/
  `rakeUnlocked` (dig.js) at `axeUnlocked` (resources.js) ay `true` kahit
  hindi pa na-craft, `carrotsCollected = 5`, `woodCollected = 4`,
  `torchesCollected = 3` — kaya may laman na agad ang bag/mga tool kahit
  bagong-bago pa lang ang laro.
- **Ayos:** ibinalik lahat sa NORMAL na panimulang estado: `pickaxeUnlocked
  = false`, `rakeUnlocked = false`, `axeUnlocked = false` (kailangan pa
  ring i-craft, tingnan ang `CRAFT_SHAPED_RECIPES` sa `craft.js`), at
  `carrotsCollected`/`woodCollected`/`torchesCollected` = `0`.
  `stoneCollected`/`goldCollected`/`charcoalCollected`/`stovesCollected`/
  `craftersCollected` ay `0` na dati pa (walang binago doon).
- **`INVENTORY_SAVE_KEY` binuhat papuntang `.v6`** (`inventory-save.js`) —
  kagaya ng dating `.v4`/`.v5` bump: dahil nagbago ang DEFAULT (hindi
  yung save format mismo), kailangang "itaas ang bersyon" para hindi na
  mabasa/matabunan ng LUMANG naka-save na estado (na may laman pa) ang
  bagong walang-laman na default. Tuwing may susunod pang default na
  babaguhin sa inventory-related variables, ULITIN ang parehong
  pattern (bumphin ulit ang bersyon, magdagdag ng bagong `".vN" -
  ...` na komento sa itaas ng `INVENTORY_SAVE_KEY`).

### (10) Settings menu (burger icon, itaas-kanan): I-save / I-load / Settings / Lumabas
- **Files:** `js/settings-menu.js` (bago), `index.html`
  (`#top-right-bar`, `#settings-panel`, `#settings-toast`), `style.css`
- **Paano:**
  - Bagong `#top-right-bar` na flex wrapper sa itaas-kanan na naghahawak
    PAREHO ng bagong burger button (`#settings-menu-button`) at ng dati
    nang `#calendar-panel` (inalis na ang sarili nitong `position: fixed`
    sa CSS — ang wrapper na ngayon ang may hawak ng posisyon), para
    magkatabi sila nang hindi nagkakapatong.
  - **I-save** — tumatawag sa LAHAT ng 5 hiwalay na save function
    (`saveInventoryState`/`savePlayerPosition`/`saveDugTiles`/
    `saveHarvestedResources`/`saveHarvestedOakTrees`) nang sabay-sabay
    (`saveAllGameState()`), tapos nagpapakita ng toast ("Na-save ang
    laro!").
  - **I-load** — `confirm()` muna, tapos `location.reload()` (babasahin
    ulit ang huling laman ng localStorage — ito na ang "load").
  - **Settings** — bumubukas ng `#settings-panel` (gitna ng screen,
    kaparehong istilo ng ibang panel dito) — may **Fullscreen toggle**
    (`document.documentElement.requestFullscreen()`/`exitFullscreen()`)
    at **"I-reset ang laro"** (nagtatanggal ng LAHAT ng save key mula sa
    `getAllSaveKeys()`, tapos `location.reload()` — panimulang estado
    ulit).
  - **Lumabas** — `saveAllGameState()` muna, saka susubukang
    `window.close()` (madalas hindi gumagana ang script-close sa mga
    browser kung hindi script mismo ang nagbukas ng tab), kaya may
    fallback na toast na nagsasabing puwede nang isara nang mano-mano
    ang tab.
- **Load order:** kailangang SUMUNOD ang `settings-menu.js` sa
  `inventory-save.js` (at sa dig/resources/player/decor) sa
  `index.html`, dahil tinatawag nito ang save function ng bawat isa.
- **Para i-adjust:** dagdag/bawas ng menu item — sa `index.html`
  (`#settings-menu-dropdown`) at `js/settings-menu.js` (bagong
  `addEventListener`).

### (11) Bagong "game clock" system (Taon 2000 muli) + kama para matulog hanggang 6am
- **Files:** `js/gametime.js` (bago), `js/bed.js` (bago), `js/calendar.js`,
  `js/atmosphere.js`, `js/dig.js`, `js/decor.js`, `js/resources.js`,
  `js/snow.js`, `js/draw.js`, `index.html`, `style.css`
- **(a) Sanhi ng "maling taon":** dating `CALENDAR_EPOCH_MS` sa
  `calendar.js` ay isang FIXED na totoong petsa (`Date.UTC(2025,0,1)`).
  Dahil 30 minuto lang ang 1 araw sa laro (`DAY_NIGHT_SECONDS`), at
  tumatagal ang TOTOONG oras palayo sa 2025, unti-unting umaakyat nang
  MABILIS ang "taon" sa loob ng laro (~2079+ na noong nahuli itong
  napansin) — hindi dapat ganito, dapat laging Taon 2000 ang simula ng
  isang BAGONG laro.
- **(b) Ayos — bagong `js/gametime.js`:** dalawang bagay na naka-save sa
  localStorage (`GAME_TIME_SAVE_KEY = "tralala.gameTime.v1"`):
  - `gameEpochMs` — DINAMIKO na ngayon (hindi na hardcoded constant),
    itinatakda LANG sa Date.now() sa UNANG beses na maglaro (walang
    laman pa ang save) — kaya PAREHONG-PARE-PARE-PAREHO ito sa bawat
    pag-reload ng PAREHONG laro, at laging Taon 2000 (`CALENDAR_START_YEAR`
    sa `calendar.js`, hindi ito ginalaw) ang Araw 1 ng bagong laro.
  - `gameTimeOffsetMs` — dagdag na "oras" (para sa sleep, tingnan sa
    ibaba), 0 bilang default, idinadagdag ng `advanceGameTime(deltaMs)`.
  - `getGameNow()` = `Date.now() + gameTimeOffsetMs` — ITO ang GAMITIN
    sa halip na `Date.now()` para sa ANUMANG kalendaryo/day-night/
    panahon/paglaki-ng-tanim/pagbalik-ng-lupa na kwenta.
  - **HINDI dapat baguhin:** ang mga simpleng REAL-TIME na input
    cooldown (`lastRakeAt`/`lastEatAt`/`lastResourceHitAt`/`lastPlantAt`
    sa dig.js/hotbar.js/resources.js) — dapat manatiling `Date.now()`
    (hindi dapat maapektuhan ng pagtulog, mga throttle lang ito laban sa
    mabilis na pag-click).
  - **Napalitan na ng `getGameNow()`:** `calendar.js`
    (`getTotalDaysElapsed`/`getCalendarState` secondsIntoDay),
    `atmosphere.js` (`getDayNightProgress`), `dig.js`
    (`getSnowStartedAtMs`/`getGrassProgress`/`updateGroundWeather`/
    `drawDugTiles`/ang mga TIMESTAMP na naka-save sa `dug[...].at` at
    `seed.plantedAt` — kailangan ito para TALAGANG umuusad ang paglaki
    ng tanim/pagbalik ng lupa kapag "tumalon" ang oras dahil sa
    pagtulog), `decor.js`/`resources.js` (snow elapsed time ng oak/tree
    sprite stage).
- **(c) Bagong `js/bed.js` — kama sa loob ng bahay (houseInside):**
  - `BED_X`/`BED_Y`/`BED_WIDTH`/`BED_HEIGHT` — 2x3 tile, malapit sa
    itaas-kaliwang sulok ng silid (nasa loob ng interior, LAYAS sa mga
    dingding — VERIFIED sa isang beses na script, walang overlap).
    Guhit lang (canvas rectangles, kagaya ng estilo ng
    "placeholder room" mismo, tingnan ang `drawPlaceholderRoom` sa
    `worlds.js`) — **walang collision box** (puwedeng patawirin ng
    player, hindi ito hinahadlangan — simplification lang, tingnan ang
    "Tandaan" sa ibaba).
  - I-click (`isBedTile()`, tinatawag ng `dig.js` mousedown handler —
    kasunod ng oldman/crafter/stove check, PAREHONG paraan) para
    matulog (`trySleepInBed()`).
  - **GABI LANG puwede** (`isBedUsableNow()` → `!getCalendarState().isDaytime`,
    ibig sabihin 6pm hanggang bago mag-6am) — kung araw, may lalabas na
    toast na mensahe sa halip (walang mangyayari).
  - Kapag natulog: `getNextWakeTimeMs()` ang kumukwenta ng PINAKAMALAPIT
    na 6:00 AM (ngayong araw pa kung maaga pa/madaling-araw, o bukas na
    kung gabi na/lampas 6pm) — tapos `advanceGameTime(deltaMs)`
    (gametime.js) ang talagang "tumatalon" sa oras. May saglit na
    **fade-to-black** habang nangyayari ito (`#bed-sleep-overlay`,
    `fadeScreenThenBack()`), tapos toast na "Magandang umaga!".
  - Iginuguhit sa `draw.js` (`drawBed()`, pagkatapos ng
    `drawMapBackground()`, gated sa `currentWorld === "houseInside"`).
- **Para i-adjust:** posisyon ng kama → `BED_X`/`BED_Y` sa `bed.js`
  (i-verify munang walang overlap sa `Collisions` ng `houseInside.tmj`
  kung babaguhin). Oras ng paggising → `SLEEP_WAKE_HOUR` (bed.js). Kailan
  puwedeng matulog → `isBedUsableNow()` (bed.js).
- **Tandaan:** walang tunay na collision ang kama (puwedeng patawirin ng
  player) — kapag nagkaroon na ng tunay na interior tileset/art
  balang-araw (tingnan ang "PANSAMANTALA" note sa `houseInside` sa
  `worlds.js`), dapat isama na rin ang bed sa `collisions` array (o sa
  Tiled `Collisions` objectgroup mismo) para hindi na madaanan.

### (12) Oldman: random na naglalakad + nawawala sa mapa; bagong PIG (baboy) na hayop
- **Files:** `js/decor.js` (Oldman), `js/pig.js` (bago), `js/map.js`,
  `js/update.js`, `js/draw.js`, `index.html`
- **(a) Oldman - hindi na siya laging naka-tayo lang:**
  - Bagong estado, `oldManWander` (decor.js) - `{col, row, x, y, facing,
    moving, state, phaseUntil, ...}`. Tatlong `state`: `"idle"`
    (humihinga, breathing gif, kaparehong dating gawi),
    `"walking"` (papunta sa random na tile SA LOOB ng
    `OLDMAN_WANDER_RADIUS_TILES` mula sa TALAGANG tindahan niya -
    `oldManSpotCache`, hindi mula sa kasalukuyang tayuan, para hindi
    siya "lumutang" papalayo sa paglipas ng panahon), `"gone"`
    (pansamantalang wala siya sa mapa).
  - **Walking animation:** `OLDMAN_WALK_IMAGES[direksyon][frame]` -
    hindi ito isang spritesheet, MAGKAKAHIWALAY na GIF file kada frame
    (`assets/npc/oldman/walk/Oldman_<north|south|east|west>/
    frame_N_delay-0.2s.gif`, 6 frame, 0.2s bawat isa - kinukuha
    mismo mula sa filename ang delay, hindi na kinukwenta). **Tandaan
    ang casing:** `Oldman_west` (maliit na "w") ang TALAGANG pangalan
    ng folder - HUWAY i-capitalize.
  - **Idle:** dating `oldmanIdleFront.gif`/`oldmanIdleBack.gif` pa rin
    (ang mga GIF na nasa LABAS ng `walk`/`idle` na subfolder) - ito
    ang tamang gamit ayon sa orihinal na hiling: front/back kapag
    N/S ang facing, at UNANG frame lang ng walk gif (static, hindi
    umaandar) kapag E/W ang facing (walang tunay na "nakatayong
    tabi" na asset).
  - **Kada 30 segundo humihinto** (`OLDMAN_IDLE_DURATION_MS`) - eksakto
    ito, hindi random - saka lang siya mag-de-decide ulit kung
    maglalakad (`startOldManWalk`).
  - **Kapag na-click siya para buksan ang tindahan
    (`oldManShopPanelOpen === true`):** humihinto AGAD ang paglalakad
    (`updateOldManWander` - unang chineck kaagad kung bukas ang
    tindahan, kung oo, "idle" ang ipinipilit na state) AT humaharap
    siya sa player (`computeOldManFacingTowardPlayer` - base sa
    posisyon ng player LABAN sa kasalukuyang posisyon niya, hindi sa
    tindahan niya).
  - **Nawawala sa mapa paminsan-minsan** ("parang traveler"):
    random ang pagitan (`OLDMAN_DISAPPEAR_INTERVAL_MIN/MAX_MS`, 2.5-5
    min) bago siya "mawala" (`vanishOldMan`, awtomatiko ring
    isinasara ang tindahan niya kung bukas), tapos random din kung
    gaano siya katagal na wala
    (`OLDMAN_DISAPPEAR_DURATION_MIN/MAX_MS`, 25-60s). Pagbalik
    (`reappearOldMan`) - `OLDMAN_TRAVELER_SPOT_CHANCE` (50%) na
    chance na lalabas siya sa ISANG BAGONG random na bahagi ng mapa sa
    halip na bumalik sa tindahan (`findFreeSpotNear` gamit ang
    `OLDMAN_TRAVELER_SEARCH_RADIUS_TILES`), kung hindi, bumabalik sa
    dati niyang tindahan.
  - **`isOldManTile`/`getOldManDrawables`/`isPlayerOverlappingOldMan`
    at ang "Hey, wanna trade something?" greeting (`draw.js`)** ay
    sumusunod na sa `oldManWander` (kasalukuyang posisyon), HINDI na
    sa `oldManSpotCache` (iyon na lang ang "tahanan"/anchor niya para
    sa wander radius at sa 2 backdrop oak sa likod niya).
  - **Para i-adjust:** bilis ng lakad → `OLDMAN_WALK_SPEED_PX_PER_SEC`,
    gaano kalayo puwedeng gumala → `OLDMAN_WANDER_RADIUS_TILES`,
    tagal ng pahinga → `OLDMAN_IDLE_DURATION_MS`, pagitan/tagal ng
    pagkawala → `OLDMAN_DISAPPEAR_*`, tsansang maging "traveler" pagod
    bumalik → `OLDMAN_TRAVELER_SPOT_CHANCE`.
- **(b) Bagong `js/pig.js` - mga baboy na gumagala sa mapa:**
  - Bagong file (`PIG_COUNT_PER_WORLD = 10` kada outdoor world) -
    SUMUSUNOD agad pagkatapos ng `decor.js` sa `index.html` (umaasa
    ito sa `isFreeWanderTile`/`randomBetween`, dalawang GENERIC na
    helper na idinagdag sa `decor.js` bilang bahagi ng gawaing ito -
    puwede ring gamitin ng ibang susunod pang "gumagalang" na bagay
    balang araw, hindi lang pig).
  - **Unang posisyon:** seeded random (`generatePigSpots`, kaparehong
    pattern ng `generateOakSpots` sa decor.js) - pareho palagi kada
    mundo, PERO dahil gumagala na sila (at nagre-respawn sa RANDOM na
    lokasyon pagkapatay - hindi seeded), unti-unting magiging
    "di-seeded" ang aktwal na posisyon nila sa paglipas ng panahon -
    tanging ang UNANG spawn lang ang deterministic.
  - **Paglalakad:** kaparehong estado ng Oldman (`idle`/`walking`/
    `gone`, dagdag `dead`) - PERO ang batayan ng bagong target ay ang
    KASALUKUYANG posisyon niya (hindi nakatali sa isang "tahanan"
    gaya ng Oldman), kaya mas malaya silang gumagala sa buong mapa sa
    paglipas ng oras. Walk gif: `assets/animals/pig/walk/
    Pig_<north|south|east|west>/frame_N_delay-0.2s.gif` (4 frame,
    0.2s bawat isa). Idle: 8-direksyon na STATIC na PNG
    (`assets/animals/pig/idle/`) - may hiwalay na `angleTo8Direction()`
    na kumukwenta ng pinakamalapit sa 8 direksyon base sa anggulo ng
    HULING galaw (mas maganda ang datingan kaysa 4 direksyon lang
    habang naka-tayo, kahit 4 lang ang direksyon ng walk animation
    mismo).
  - **"Health"/clickable:** click (KAHIT ANO o walang naka-equip,
    hiwalay itong `canvas.addEventListener("mousedown", ...)` sa
    `pig.js` mismo - hindi umaasa sa axe/pickaxe) sa tile ng isang
    buhay na pig → `registerPigHit()` (may sariling cooldown,
    `PIG_HIT_COOLDOWN_MS`, IISA lang ito kada pig-click kahit alin pang
    pig ang tinamaan - kaparehong konsepto ng
    `RESOURCE_HIT_COOLDOWN_MS` sa resources.js) → saglit na "flash"
    (mas maliwanag) bilang reaction, at may munting health bar na
    LUMALABAS LANG kapag may hits na (hindi laging nakalutang).
    `PIG_REQUIRED_HITS = 4` bago "mapatay" (`killPig`).
  - **Pagkapatay:** `state = "dead"`, nawawala muna sa guhit
    (`getPigDrawables` - hindi kasama ang `dead`/`gone`), tapos random
    na 8-20 segundo (`PIG_RESPAWN_DELAY_MIN/MAX_MS`) bago
    `respawnPig()` - LUMALABAS SA BAGONG RANDOM na lokasyon KAHIT SAAN
    sa mapa (`findPigRelocationSpot`, HINDI seeded, kaparehong konsepto
    ng `respawnOak`/`respawnResourceNode`), buo na ulit ang health.
  - **Nawawala/bumabalik din sa mapa** (hiwalay sa "pagkapatay") -
    kaparehong konsepto ng Oldman traveler behavior pero mas madalas/
    mas maikli (`PIG_DISAPPEAR_INTERVAL_MIN/MAX_MS` 1-3 min,
    `PIG_DISAPPEAR_DURATION_MIN/MAX_MS` 15-40s) - dahil mas marami
    silang piraso, hindi kailangang kasing-bihira ng Oldman.
  - **Walang collision box ang pig** (simplification, gaya ng kama sa
    `bed.js`) - puwedeng patawirin ng player, at hindi rin sila
    kasama sa `collisions` array kaya hindi rin sila nagiging hadlang
    sa ibang bagay na naghahanap ng bakanteng tile.
  - **May drop na ngayon** ("meat", 1-3 random) - tingnan ang bahagi
    7, item (14) sa ibaba (sunod na hiling pagkatapos nito).
  - **Para i-adjust:** dami ng pig → `PIG_COUNT_PER_WORLD`, bilang ng
    hit bago mamatay → `PIG_REQUIRED_HITS`, bilis ng lakad →
    `PIG_WALK_SPEED_PX_PER_SEC`, gaano kalayo bawat lakad →
    `PIG_WANDER_RADIUS_TILES`, tagal ng pahinga →
    `PIG_IDLE_MIN/MAX_MS`, tagal bago mag-respawn pagkapatay →
    `PIG_RESPAWN_DELAY_MIN/MAX_MS`.
- **(c) Koneksyon sa ibang file:**
  - `js/update.js` - bagong tawag na `updateOldManWander(deltaMs)`
    (pagkatapos ng `ensureOldManSpot()`, bago ang `ensureOakSpots()`)
    at `updatePigs(deltaMs)` (pagkatapos ng `ensureOakSpots()`) -
    TALAGANG `deltaMs` (hindi `speedScale`) ang ipinapasa, para
    pareho ang bilis ng lakad nila kahit gaano man ka-mabagal/
    mabilis ang frame rate.
  - `js/map.js` - bagong `getPigDrawables()` idinagdag sa PAREHONG
    Y-sort branch (may overlap layers at ang "fallback" na walang
    overlap layers), kasunod ng `getBackdropOakDrawables()`.
  - `index.html` - `pig.js` DAPAT SUMUNOD agad pagkatapos ng
    `decor.js` (umaasa sa mga function nito).

### (13) Sunod na ayos sa (12): tinanggal ang "paraharap" ng oldman, may TUNAY na collision na ngayon habang naglalakad (oldman + pig), mas maliit na health bar ng pig, at "hit-stun"
- **Files:** `js/decor.js`, `js/pig.js`, `index.html`
- **(a) Tinanggal ang "paraharap sa player" ng oldman kapag na-click:**
  - Dating gawi (item 12): kapag bukas ang tindahan
    (`oldManShopPanelOpen`), humaharap siya sa player
    (`computeOldManFacingTowardPlayer`, may special na static pose
    para sa east/west). **Bug/hindi magandang datingan pala ito -
    TINANGGAL NA** - tinanggal na ang buong function na iyon at ang
    espesyal na "shop-open" branch sa `resolveOldManSprite()`.
  - **Kasalukuyang gawi:** kapag bukas ang tindahan, HUMIHINTO pa rin
    siya sa paglalakad (para hindi siya lumayo habang kausap mo pa
    siya), pero GAMIT niya na lang ang dating front/back breathing
    idle animation (walang espesyal na facing) - parehong gawi
    kung "idle" siya kahit saradong tindahan.
- **(b) Bagong TUNAY (piksel-by-piksel) na collision habang naglalakad:**
  - **Sanhi ng dating bug:** ang `isFreeWanderTile()` (decor.js) ay
    TILE-based - sinisigurong bakante ang DESTINASYONG tile, pero
    hindi kailanman na-check ang BUONG daanan papunta doon - kaya
    puwedeng "dumaan"/mag-clip ang oldman/pig sa GITNA ng isang
    puno/bahay/bato kung nasa pagitan ito ng kasalukuyan at
    destinasyong tile (lalo na sa diagonal na galaw).
  - **Ayos - bagong `canFeetMoveTo(feetX, feetY, boxWidth, boxHeight)`**
    (decor.js, generic, ginagamit din ng pig.js) - kaparehong konsepto
    ng `canMoveTo()` ng player (`collisions.js`) pero para sa
    kahit anong "paanan"-based na character: gumagawa ng munting box
    sa bagong (feetX, feetY) at chine-check laban sa `collisions`
    array. Tinatawag ito SA BAWAT HAKBANG (`stepOldManWalk`/
    `stepPigWalk`), BAGO pa man talaga i-apply ang bagong posisyon -
    kung may nakabangga, HUMIHINTO agad siya doon (nagiging "idle",
    mamimili ng BAGONG destinasyon sa susunod na pagkakataon) sa
    halip na tumuloy nang dumaan/mag-clip sa bagay na iyon.
  - Dahil dito, kapag naglalakad papunta/palapit sa isang puno o bahay,
    hindi na sila "dumadaan"/tumatawid dito - kung saan sila
    huminto, doon din sila lalabas sa Y-sort (`sortY`) laban sa
    puno/bahay - kaya "napapailalim"/natatakpan sila nang tama kapag
    talagang nasa likod ng bagay na iyon ang posisyon nila, kaparehong
    normal na Y-sort na ginagamit din sa player.
  - **Box size (maliit lang, "paanan" lang, hindi buong katawan):**
    `OLDMAN_COLLISION_BOX_WIDTH/HEIGHT` (decor.js),
    `PIG_COLLISION_BOX_WIDTH/HEIGHT` (pig.js).
- **(c) Mas maliit na health bar ng pig:** `drawPigHealthBar()`
  (pig.js) - `barWidth` mula `TILE_SIZE * 1.2` → `TILE_SIZE * 0.7`,
  `barHeight` mula `3` → `2`, medyo mas malapit na rin sa ulo
  (`y` offset mula `6` → `4`).
- **(d) "Hit-stun" ng pig - titigil sa paglalakad kapag na-hit:**
  - Bagong `PIG_HIT_STUN_MS = 900` - sa `registerPigHit()`, sa SANDALING
    matamaan (kahit naglalakad pa siya noon - kinakansela ang
    kasalukuyang target), agad siyang inilalagay sa `state = "idle"`
    (`moving = false`) sa loob ng 900ms bago siya ulit
    magdesisyon ng bagong galaw (`pig.phaseUntil`).
  - **Para i-adjust:** tagal ng hitstun → `PIG_HIT_STUN_MS`.

### (14) Bagong item na "meat" - lumalagpak (1-3 random) kapag napatay ang pig
- **Files:** `js/pig.js`, `js/hotbar.js`, `js/inventory-save.js`,
  `index.html`
- **Paano:** sa `killPig()` (pig.js) - random na `PIG_MEAT_DROP_MIN`
  (1) hanggang `PIG_MEAT_DROP_MAX` (3) na "meat" ang `spawnGroundItem`
  (ground-items.js) sa TALAGANG posisyon ng pig nang mamatay -
  hiwa-hiwalay na piraso (naka-stagger ang "landing" ng bawat isa,
  `GROUND_ITEM_SPAWN_STAGGER_MS`), kailangan pa ring damputin
  (i-click habang abot) - kaparehong-pareho ng gawi ng ani ng puno/
  carrot, HINDI ito deretso napupunta sa bag.
- **Bagong `meatCollected`** (pig.js, kaparehong pattern ng
  `woodCollected`/`stoneCollected` sa resources.js) - kailangang
  naka-declare na ito BAGO pa man tumakbo ang `hotbar.js`/
  `inventory-save.js` (parehong sumusunod naman dito sa
  `index.html`, kaya ligtas).
- **`js/hotbar.js`:**
  - Bagong entry sa `BAG_ITEMS` - `id: "meat"`, `iconEmoji: "🥩"`
    (walang sariling larawan/asset, EMOJI na lang ang gamit,
    kaparehong wood/stone/torch - tingnan ang `drawGroundItems` sa
    ground-items.js, generic na ang paggamit nito ng `iconEmoji`).
  - Bagong `else if (itemId === "meat") meatCollected += delta;` sa
    `adjustGlobalItemCount()` - **HINDI GENERIC ang function na ito**
    (hardcoded if/else chain kada item type) - kaya SA TUWING may
    bagong "simpleng" (stackable/countable) item type sa hinaharap,
    KAILANGANG idagdag din dito ang sariling branch, hindi lang sa
    `BAG_ITEMS` - kung hindi, hindi talaga tataas ang stock kahit
    "nadampot" na ito sa paningin ng manlalaro.
- **`js/inventory-save.js`:** naka-save/naka-load na rin ang `meat`
  (parehong pattern ng `charcoal`/`stove` - `typeof` guard sa
  serialize/reset/load) - WALANG bagong bump ng `INVENTORY_SAVE_KEY`
  version (`.v6` pa rin) dahil bagong FIELD lang ito na may TAMA nang
  default (`0`) - hindi tulad ng mga dating pagbabago sa `.v4`/`.v5`/
  `.v6` na binago ang DEFAULT ng isang EXISTING na field.

### (15) Naayos: pig hindi talaga humaharang sa puno/bahay/bato + oldman/pig hindi na nalalabuan (opacity) + bagong TUNAY na stats (550 HP / 50 defense) ng pig
- **Files:** `js/decor.js`, `js/pig.js`, `index.html`

- **(a) Bug: nakakadaan/naka-clip pa rin ang pig (at oldman) sa
  puno/bahay/bato kahit "na-ayos" na raw ito noon (item 13, itaas):**
  - **Sanhi:** `canFeetMoveTo()` (decor.js, generic, ginagamit ng
    oldman AT pig) ay tumitingin LANG sa `collisions` array - galing
    ito sa Tiled `"Collisions"` objectgroup (manually ginuhit,
    kaunti lang - mga 19-33 rectangle kada mapa, mukhang para sa
    bahay/hangganan lang talaga) PLUS mga DYNAMIC na collision box na
    itinutulak ng resources.js (random tree/stone) at decor.js (oak).
    **HINDI kasama dito ang mga STATIC na puno/bahay/bato/bakod na
    direktang GUHIT sa Tiled bilang "overlap" TILE layer**
    (`"trees"/"house"/"rocks"/"fence"` - `OVERLAP_LAYER_NAMES` sa
    `map.js`) - ang mga iyon ay tinitingnan LANG ng `getObjectCells()`
    (dig.js), na ginagamit dati ng `isFreeWanderTile`/
    `generatePigSpots` PERO HINDI ng `canFeetMoveTo` - kaya kahit
    "buo"/tama ang tingin ng puno/bahay/bato sa screen, wala talagang
    collision box doon maliban kung sinadyang idagdag bilang rectangle
    sa `"Collisions"` layer.
  - **Ayos:** bago mag-return ang `canFeetMoveTo()`, chine-check din
    ngayon ang `getObjectCells()` (bagong helper na
    `getTileCellsForBox()` - kinukwenta lahat ng tile na na-o-overlap
    ng box, hindi lang isang tile) - kung occupied ang KAHIT ISA sa
    mga tile na iyon (ibig sabihin may static na puno/bahay/bato/bakod
    doon), hindi puwedeng gumalaw doon.
  - **Para i-adjust:** wala nang atkonstant dito - automatic na ngayong
    sumasakop ang collision sa lahat ng puno/bahay/bato/bakod na Tiled
    art, hindi na kailangang mag-drawing pa ng manual na rectangle sa
    `"Collisions"` layer para dito.

- **(b) Bug: nalalabuan (opacity 0.45) ang oldman/pig kapag na-overlap
  sila ng player, kahit "trees"/"house" LANG dapat ang pinapalabo:**
  - **Sanhi:** `shouldOccludeForPlayer()` (map.js) - `if (item.type &&
    !OCCLUDABLE_OVERLAP_TYPES.has(item.type)) return false;` - ang
    check na ito ay TAMA LANG kung may `type` ang item. Ang
    `getOldManDrawables()`/`getPigDrawables()` (dati) ay WALANG `type`
    field, kaya lumalagpas sila sa check na ito papunta sa
    bbox-overlap check sa ibaba - resulta, kapag na-overlap sila ng
    player AT nauna ang player sa Y-sort, nalalabuan sila (parang
    puno/bahay) - HINDI ito ang gustong gawi.
  - **Tandaan:** may dating naka-dokumento na "(4) Oldman: walang
    opacity kapag dumaan ang player" sa itaas (bahagi 7, item 4) na
    nagsasabing `type: "npc"` na raw ang nakadagdag doon - PERO sa
    aktwal na code, WALA palang natagpuang `type` field - marahil
    na-revert/nawala ito sa isang sesyon (o hindi na-apply talaga
    dati) - kaya inayos ulit dito, at ginawa na rin ang parehong ayos
    sa PIG.
  - **Ayos:** idinagdag ang `type: "npc"` sa `getOldManDrawables()`
    (decor.js) at `type: "pig"` sa `getPigDrawables()` (pig.js) -
    WALA ang alinman dito sa `OCCLUDABLE_OVERLAP_TYPES`
    (`trees`/`house` lang), kaya laging 100% opacity/orihinal na
    itsura sila kahit dumaan/mag-overlap ang player.
  - **Para baligtarin:** tanggalin ang `type: "npc"`/`type: "pig"`
    (babalik sa dating paglabo), o idagdag ang `"npc"`/`"pig"` sa
    `OCCLUDABLE_OVERLAP_TYPES` (map.js).

- **(c) Bagong TUNAY na "stats" ng pig - 550 HP, 50 defense:**
  - **Sanhi/dating gawi:** simpleng "bilang ng click" lang
    (`PIG_REQUIRED_HITS = 4`, walang defense) ang batayan ng
    kamatayan ng pig - walang tunay na HP/defense stat.
  - **Bagong constants (`pig.js`):** `PIG_MAX_HP = 550`,
    `PIG_DEFENSE = 50`, `PIG_HIT_DAMAGE = 150` (base damage ng isang
    click/suntok - wala pang per-weapon na damage system ang buong
    laro, click-based pa rin). Ang aktwal na nababawas sa HP kada hit
    ay `max(1, PIG_HIT_DAMAGE - defense)` - kaya hindi "immune" ang
    pig kahit gaano kalaki ang defense laban sa damage.
  - **Sariling field kada pig (hindi lang shared constant):**
    `pig.hp`/`pig.maxHp`/`pig.defense` - naka-set na sa
    `makePigState()` (unang gawa) AT nire-reset (`hp = maxHp`) sa
    `placePigAt()` (respawn/reappear) - kaya buo ulit ang 550 HP
    kada pagbalik ng isang pig.
  - **`registerPigHit()`:** bumabawas na ng TALAGANG damage sa
    `pig.hp` (dating "hits += 1" LANG) - namamatay (`killPig()`)
    kapag `pig.hp <= 0`. Ang `pig.hits` ay display/flash-tracking na
    lang ngayon, hindi na batayan ng kamatayan.
  - **Health bar (`drawPigHealthBar`):** `hp/maxHp` na ang ratio
    (dating `hits/PIG_REQUIRED_HITS`).
  - **Para i-adjust:** `PIG_MAX_HP`, `PIG_DEFENSE`, `PIG_HIT_DAMAGE`
    (pig.js) - kung gustong mas mabilis/mabagal mamatay ang pig,
    dito baguhin.

### (16) Anino (shadow) ng oldman/pig, TUNAY na collision sila laban sa player/isa't isa, batong random spawn din sa "newmap", presyo ng meat (15), at hindi na "naka-disable" ang mga item ng tindahan kahit kulang ang gold
- **Files:** `js/decor.js`, `js/pig.js`, `js/collisions.js`, `js/worlds.js`,
  `index.html`

- **(a) Bagong anino (shadow) sa ilalim ng paanan ng oldman/pig:**
  - Bagong SHARED helper na `drawGroundShadow(feetX, feetY, shadowWidth)`
    (decor.js, itaas ng file, bago pa man ang OAK section) - generic na
    bersyon ng `drawPlayerShadow` (player.js) pero naka-anchor sa
    "paanan" (feetX, feetY) - iisang anchor point, kagaya ng x/y ng
    oldman/pig - sa halip na sa top-left box ng player.
  - Tinawag ito sa `drawOldMan()` (decor.js) at `drawPigAt()` (pig.js) -
    BAGO iguhit ang sprite mismo, kaya laging nasa ilalim/likod.
  - **Para i-adjust:** laki ng anino → ang 2nd argument sa tawag
    (`OLDMAN_DEST_SIZE * 0.5` / `PIG_DEST_SIZE * 0.55`), lamlam/kulay →
    `rgba(0, 0, 0, 0.35)` sa loob ng `drawGroundShadow` mismo.

- **(b) Bagong TUNAY na collision - hinaharang na ngayon ng oldman/pig
  ang PLAYER, at ang isa't isa (oldman ↔ pig, pig ↔ pig):**
  - **Dating gawi:** "Walang collision box ang pig/oldman laban sa
    player" (tingnan ang lumang bahagi 7 item 12(b) sa itaas) - basta
    lang PUWEDENG patawirin/i-overlap ng player sila, at hindi rin
    sila humaharang sa isa't isa.
  - **Bagong `getOldManCollisionBox()`** (decor.js) - LIVE (gumagalaw
    kada frame) na box, HIWALAY sa static na `collisions` array
    (na para lang sa di-gumagalaw na bagay).
  - **Bagong `getPigCollisionBoxes(excludePig)`** (pig.js) - LIVE na
    box ng LAHAT ng BUHAY na pig - may opsyonal na `excludePig` para
    hindi "bumangga sa sarili" ang isang partikular na pig kapag ito
    mismo ang naglalakad.
  - **`canMoveTo()` (collisions.js, PLAYER movement)** - dinagdagan ng
    check laban sa `getOldManCollisionBox()`/`getPigCollisionBoxes()`
    (may `typeof` guard, dahil naglo-load pa lang ang decor.js/pig.js
    PAGKATAPOS ng collisions.js sa index.html).
  - **`canFeetMoveTo()` (decor.js, generic, oldman AT pig)** -
    dinagdagan din ng parehong 3 bagong check (player/oldman/pig
    boxes), may bagong ika-5 (opsyonal) na `options` argument:
    `{ skipPlayer, skipOldMan, excludePig }` - ginagamit ito ng
    `stepOldManWalk` (`{ skipOldMan: true }` - iniiwasan ang SARILING
    box) at `stepPigWalk` (`{ excludePig: pig }` - iniiwasan din ang
    sarili).
  - **Tandaan:** hindi apektado ang PAG-CLICK para buksan ang
    tindahan ng oldman (`isOldManTile`/`isTileInReach`, tile-based,
    HINDI umaasa sa physical na overlap) - kaya normal pa ring
    mabubuksan ang tindahan kahit "nahaharang" na ngayon ang tunay na
    paglapit dahil sa bagong collision.
  - **Para i-adjust:** laki ng "hadlang" na box → parehong constant sa
    itaas (`OLDMAN_COLLISION_BOX_WIDTH/HEIGHT`,
    `PIG_COLLISION_BOX_WIDTH/HEIGHT`).

- **(c) Bug: walang random na bato (stone) na gumagala sa "newmap"
  (ang KASALUKUYANG `DEFAULT_WORLD`):**
  - **Sanhi:** may `noStones: true` flag ang `newmap` sa `WORLDS`
    (worlds.js) - binabasa ito ng `generateResourceNodes()`
    (resources.js) para LAKTAWAN (0 stones) ang pagbuo ng random na
    bato sa mundong iyon, PUNO lang.
  - **Ayos:** tinanggal ang `noStones: true` sa `newmap` - normal na
    ring gumagala ang bato ngayon (`STONE_COUNT_PER_WORLD = 10`),
    kaparehong dami/gawi ng puno.
  - **Para i-adjust:** `STONE_COUNT_PER_WORLD` (resources.js) - kung
    gusto pang dagdagan/bawasan ang dami.

- **(d) Bagong presyo ng "meat" sa tindahan ng oldman - 15 gold kada
  isa (sellPrice):**
  - Bagong entry sa `OLDMAN_SHOP_ITEMS` (decor.js) - `itemId: "meat"`,
    `sellPrice: 15` (hiling), `buyPrice: 30` (kaparehong 2x pattern ng
    ibang item, walang hinilingang specific na buy price).
  - **Tandaan:** dating WALA pang "meat" sa listahang ito - kaya kahit
    nakokolekta na ito (item 14, drop ng pig) mula noon, hindi pa ito
    puwedeng ibenta sa oldman hanggang ngayon.

- **(e) Bug: "naka-disable"/gray/hindi ma-drag ang mga item sa
  tindahan ng oldman kapag kulang ang gold:**
  - **Dating gawi:** `buildOldManShopCell()` - `cell.disabled = stock
    <= 0 || goldCollected < item.buyPrice` - kaya naka-gray/hindi
    puwedeng simulan ang drag (`pointerdown` hindi tumatakbo sa
    disabled na `<button>`) kapag kulang ang gold, kahit "meron naman"
    talaga itong stock.
  - **Ayos:** `cell.disabled = stock <= 0` na lang (tinanggal ang
    gold check) - normal na itsura/drag-able ang item kahit kulang ang
    gold. Sa halip, `startOldManBuyFlow()` (tinatawag SA SANDALING
    i-drop mo talaga ang item sa bag/hotbar) na ngayon ang
    nag-che-check - kung kulang pa rin ang gold sa oras na iyon, may
    lalabas na TOAST na "Kulang ang gold mo! 🪙" (`showSettingsToast`,
    settings-menu.js) sa halip na tahimik lang na walang mangyayari.
  - **`startOldManBuyDrag()`** - inalis din ang gold check dito (stock
    lang ang tinitingnan bago simulan ang drag).
  - **Para i-adjust:** teksto ng toast → hanapin ang "Kulang ang gold
    mo!" sa `startOldManBuyFlow()` (decor.js).

### (17) Blurred/naiibang anino kada character + puno, at bagong 2-yugtong pag-install ng pickaxe/rake/axe (bag → tool radial, permanente)
- **Files:** `js/decor.js`, `js/pig.js`, `js/player.js`, `js/resources.js`,
  `js/dig.js`, `js/craft.js`, `js/hotbar.js`, `js/ground-items.js`,
  `js/inventory-save.js`, `index.html`

- **(a) Blurred na anino, naiiba kada character/puno (dating iisang
  hugis lang para sa lahat):**
  - `drawGroundShadow(feetX, feetY, shadowWidth, options)` (decor.js,
    SHARED helper, itaas ng file) - bagong ika-4 na `options` argument:
    `{ heightRatio, blur, alpha }`. Ang `blur` ay gumagamit ng canvas
    `ctx.filter = "blur(Npx)"` - kaya malambot/hindi tuwid ang
    hangganan ng anino (dating matigas/malinaw na hugis-itlog).
  - **Bawat isa ngayon ay may SARILING hugis/laki, batay sa TALAGANG
    proporsyon ng katawan nila:**
    - Oldman (`drawOldMan`, decor.js): makitid/mahabang oval
      (`heightRatio: 0.22`) - "nakatayong tao", makitid ang paa.
    - Pig (`drawPigAt`, pig.js): mas bilog/malapad
      (`heightRatio: 0.38`) - apat ang paa, mas malapad ang katawan.
    - Player (`drawPlayerShadow`, player.js): gumagamit na rin ng
      PAREHONG shared helper (dating sariling/lumang hugis-itlog na
      code lang, walang blur) - `heightRatio: 0.25`. May
      `typeof drawGroundShadow === "function"` guard + LUMANG
      fallback (walang blur) kung sakaling hindi available.
    - Mga PUNO - trees (resources.js, `getResourceDrawables`), oak
      (decor.js, `drawOakAt`), AT backdrop oak (decor.js,
      `drawBackdropOakAt` - mga puno sa likod ng oldman) - lahat ng
      TATLO ngayon ay may anino sa ilalim
      (`heightRatio: 0.32`, mas malapad, `TILE_SIZE * 1.1`) - dating
      WALA silang anino.
  - **Para i-adjust:** hanapin ang tawag sa `drawGroundShadow(...)` sa
    bawat draw function na binanggit sa itaas - ang 2nd argument
    (shadowWidth) ang laki, ang `options.heightRatio` ang "kabilugan"
    (mas mataas = mas bilog), `blur` ang lambot ng gilid, `alpha` ang
    kadiliman.

- **(b) Bagong 2-YUGTONG pag-"install" ng pickaxe/rake/axe (bagong
  hiling - dating agad na "Unlocked"/equippable sa sandaling ma-drag
  palabas ng crafting output):**
  - **YUGTO 1 - "InInventory"** (bagong flag - `pickaxeInInventory`/
    `rakeInInventory` sa `dig.js`, `axeInInventory` sa `resources.js`):
    itinatakda ito ng `collectCraftOutput()` (craft.js) sa halip na
    diretsong "Unlocked" - kaya kapag na-craft, NORMAL na lang munang
    itsura ang item sa bag/hotbar (makikita/madra-drag/mapipili -
    `getCount()` ng BAG_ITEMS entry sa hotbar.js ay sumusunod na sa
    ito, hindi na sa "Unlocked"), PERO WALANG mangyayari kung basta
    i-click/i-drag mo lang ito papunta sa isang numbered slot -
    `equipPickaxe()`/`equipRake()`/`equipAxe()` (dig.js/resources.js)
    ay naka-guard pa rin sa `pickaxeUnlocked`/`rakeUnlocked`/
    `axeUnlocked` (HINDI sa InInventory), kaya safe na "walang
    epekto" lang ang anumang maagang click.
  - **YUGTO 2 - "Unlocked" (Install)** - kailangan pang I-DOUBLE
    CLICK ang item (sa bag O sa isang numbered slot) - dinagdag ang
    `"pickaxe"`/`"rake"`/`"axe"` sa `DOUBLE_CLICK_EQUIPABLE_ITEMS`
    (hotbar.js), at bagong branch sa `equipViaDoubleClick()`:
    (1) `InInventory = false` (mawawala na sa bag - `getCount()` → 0),
    (2) `Unlocked = true` (permanenteng equippable na sa tool radial
    mula ngayon - tingnan ang `syncToolRadialUI` sa tool-radial.js,
    hindi na "locked/greyed-out"), (3) AGAD ding na-eequip sa kamay
    (`equipPickaxe()`/atbp - kaparehong instant-equip na gawi ng
    torch sa parehong function).
  - **`equipToolItemIfApplicable()` (hotbar.js)** - dinagdagan ng
    `&& pickaxeUnlocked` (atbp) sa condition - dating basta
    "pickaxe" ang itemId ay diretsong tumatawag ng `equipPickaxe()`
    (na naman ay naka-guard rin doon, pero "naaagaw" pa rin ang click
    kaya walang normal na gold-highlight/selection na nangyayari) -
    ngayon, kung "InInventory" pa lang (hindi pa naka-install), normal
    na lang itong tumatakbo bilang basic na item selection, gaya ng
    ibang normal na item sa bag.
  - **`adjustGlobalItemCount()`/`collectGroundItem()`/`deleteItem()`
    (hotbar.js/ground-items.js)** - lahat ng ito ay sumusunod na sa
    "InInventory" flag sa halip na "Unlocked" (hal. kapag ibinato/
    natapon at dinampot ulit ang isang HINDI PA naka-install na
    kasangkapan, babalik itong normal na item lang, HINDI awtomatikong
    naka-install/naka-equip).
  - **`inventory-save.js`** - naka-save/naka-load na rin ang bagong 3
    "InInventory" flag (parehong pattern ng "Unlocked") - WALANG bagong
    bump ng `INVENTORY_SAVE_KEY` (bagong FIELD lang ito, `false` na
    naman ang tamang default).
  - **Tandaan:** SWORD ay HINDI kasama sa bagong 2-yugtong gawi na
    ito (nananatili sa dating "agad na Unlocked" - hindi ito hiniling
    baguhin).
  - **Para i-adjust/baligtarin:** kung gusto pa ring "agad na
    Unlocked" (dating gawi), ibalik na lang ang
    `pickaxeInInventory = true` (craft.js) pabalik sa
    `pickaxeUnlocked = true` (parehong ganito ang ibang 2 tool).

### (18) Ayos: itinapat ang anino ng oldman/pig mismo sa gitna ng paa (dating "lumulutang"/hindi eksakto), at TINANGGAL ang anino ng mga puno (sanhi ng LAG)
- **Files:** `js/decor.js`, `js/resources.js`

- **(a) Bug: hindi eksakto sa paanan ang anino ng oldman/pig:**
  - **Sanhi:** `drawGroundShadow()` (decor.js, shared helper - item 17
    sa itaas) - may dating AWTOMATIKONG `feetY - shadowHeight * 0.15`
    na "itinutulak" ang sentro ng ellipse PAITAAS, sa halip na eksakto
    sa (feetX, feetY) mismo - kaya bahagyang "lumulutang"/hindi
    talaga nakapatong sa TALAGANG paanan ang anino.
  - **Ayos:** tinanggal ang awtomatikong `-0.15` offset - (feetX,
    feetY) mismo (walang extra tulak) na ngayon ang default na sentro
    ng ellipse - EKSAKTO itong tumatapat sa parehong (feetX, feetY) na
    ginagamit din ng `ctx.translate`/drawImage anchor ng bawat isa
    (`drawOldMan`/`drawPigAt`) - kaya laging TALAGANG nakapatong ito
    sa gitna ng paa, hindi kailanman "lumulutang".
  - **Bagong opsyonal na `options.offsetY`** (piksel) - kung may
    partikular na character/sprite sa hinaharap na kailangan pa ring
    i-fine-tune nang bahagya (hal. may built-in na puwang sa ibaba ng
    larawan mismo), dito na lang ipasa sa halip na baguhin ang default
    ng function.
  - **Para i-adjust:** kung may isang partikular na character na
    "mali" pa rin ang tapat ng anino (depende sa sariling sprite art
    nito), dagdagan ng `offsetY: <piksel>` ang `options` object sa
    kaukulang tawag ng `drawGroundShadow(...)` (decor.js `drawOldMan`,
    pig.js `drawPigAt`).

- **(b) Bug: LAG dahil sa anino ng mga puno (item 17 sa itaas, bahagi
  1):**
  - **Sanhi:** ang blur filter (`ctx.filter = "blur(Npx)"`) sa loob ng
    `drawGroundShadow()` ay MABIGAT sa canvas kada tawag - dati,
    tinatawag ito kada FRAME kada puno (random tree: hanggang 10 kada
    outdoor world, oak: 20, backdrop oak: 10) - kaya hanggang 40 extra
    blurred-shadow draw call kada frame, sa ibabaw pa ng mga oldman/
    pig/player - sanhi ito ng napansing LAG.
  - **Ayos:** TINANGGAL na ang anino ng LAHAT ng puno (random tree -
    `getResourceDrawables` sa resources.js, oak - `drawOakAt`, at
    backdrop oak - `drawBackdropOakAt`, parehong decor.js). Ang
    oldman/pig/player LANG (kaunti/iisa lang sila, hindi
    paulit-ulit/dose-dosena) ang nagtataglay pa ng anino ngayon.
  - **Para ibalik:** kung gustong ibalik balang araw (hal. kung
    ma-optimize/bawasan ang bilang ng puno, o palitan ang blur ng mas
    magaan na epekto), tingnan ang git history/paunang bersyon ng
    item 17 sa itaas para sa eksaktong code na tinanggal.

### (19) Baligtad: pickaxe/rake/axe - direktang sa circle tools na (HINDI na lumalabas sa inventory kahit sandali) + itinaas ang shadow ng oldman/pig (dating parang "nakalutang")
- **Files:** `js/craft.js`, `js/ground-items.js`, `js/decor.js`, `js/pig.js`

- **(a) Bagong hiling: "less item sa inventory" - hindi na dapat
  lumitaw KAHIT SANDALI ang pickaxe/rake/axe sa bag - deretso na sa
  tool radial:**
  - **Sanhi/dating gawi (item 17 sa itaas):** 2-yugtong "InInventory"
    → double-click → "Unlocked" - kaya bago pa man ma-install,
    lumalabas muna ito bilang normal na item sa bag/hotbar.
  - **Bagong ayos:** `collectCraftOutput()` (craft.js) - direktang
    itinatakda na ngayon ang `pickaxeUnlocked`/`rakeUnlocked`/
    `axeUnlocked` (hindi na ang "InInventory" flag) SA SANDALING
    i-drag palabas ng OUTPUT slot papunta sa bag - kaya HINDI na ito
    kailanman lumilitaw/lumalabas sa bag mismo, deretso na sa tool
    radial (locked → unlocked agad).
  - **`collectGroundItem()` (ground-items.js)** - parehong ginawang
    direktang "Unlocked" (dating "InInventory" din) - sakaling may
    dating-naka-drop pang pickaxe/rake/axe sa lupa (matandang
    groundItems), hindi na rin ito babalik bilang normal na item sa
    bag.
  - **Tandaan:** naiwan pa rin ang `pickaxeInInventory`/
    `rakeInInventory`/`axeInInventory` (dig.js/resources.js) at ang
    kanilang paggamit sa `BAG_ITEMS`/`equipViaDoubleClick`/
    `DOUBLE_CLICK_EQUIPABLE_ITEMS` (hotbar.js) - HINDI na sila
    aktibong tinatawag/binabago ng KAHIT ANONG landas (walang code
    na nagse-set ng "InInventory" pabalik sa `true`), kaya laging
    `false`/`getCount() === 0` na sila - epektibong "patay" na code
    ito ngayon, pero iniwan (hindi tinanggal) para hindi na kailangang
    galawin ang maraming file kung sakaling gustong ibalik ito balang
    araw (tingnan ang "Para i-adjust/baligtarin" sa item 17 sa itaas).
  - **Para ibalik ang 2-yugtong gawi:** ibalik na lang ang 2 pares ng
    linya sa `collectCraftOutput()`/`collectGroundItem()` pabalik sa
    "InInventory = true" (tingnan ang item 17 para sa eksaktong
    dating code).

- **(b) Ayos: masyadong "malayo"/nakalutang ang shadow ng oldman/pig
  laban sa TALAGANG paa nila:**
  - **Sanhi:** bagama't (feetX, feetY) na mismo (walang extra offset)
    ang default na sentro ng `drawGroundShadow()` mula noong item 18
    sa itaas, may transparent/blangkong puwang pa rin pala sa ILALIM
    mismo ng sprite art (.gif/.png) ng oldman/pig - kaya kahit
    "tama" ang (feetX, feetY) sa teknikal/collision na anchor point,
    mas MABABA pa rin ito kaysa sa VISUAL na tila-paanan na
    nakikita sa screen - resulta, parang "nakalutang" sa ibabaw ng
    sariling anino ang oldman/pig.
  - **Ayos:** ginamit ang bagong `options.offsetY` (idinagdag noong
    item 18) - `offsetY: -TILE_SIZE * 0.3` (oldman, decor.js) at
    `offsetY: -TILE_SIZE * 0.25` (pig, pig.js) - negatibong halaga
    ang nagtutulak ng sentro ng anino PAITAAS, mas malapit sa
    VISUAL na paanan.
  - **Para i-adjust:** taasan pa ang `-TILE_SIZE * 0.3`/`0.25`
    (mas malaking numero = mas malapit/mas taas ang anino) sa
    kaukulang `drawGroundShadow(...)` na tawag.

### (20) Tinanggal ang random na "pagkawala sa mapa" ng pig (dating "traveler" na gawi) - "dead" na lang ang dahilan, FIXED 15s na respawn + mas mataas pang anino ng oldman/pig
- **File:** `js/pig.js`, `js/decor.js`

- **(a) Tinanggal: random na "nawawala sa mapa" ang pig kahit hindi
  pa napapatay:**
  - **Dating gawi (bahagi 7, item 12(b) sa itaas):** bukod sa
    "namatay → mawawala → mag-re-respawn", may HIWALAY pang random na
    "traveler" na gawi ang pig - random na pagitan
    (`PIG_DISAPPEAR_INTERVAL_MIN/MAX_MS`, 1-3 min) bago basta
    "mawala" (`vanishPig`, state → `"gone"`), tapos random na tagal
    (`PIG_DISAPPEAR_DURATION_MIN/MAX_MS`, 15-40s) bago
    `reappearPig()` sa BAGONG random na lokasyon - KAHIT HINDI pa
    napapatay/buo pa ang HP.
  - **Bug/hindi magandang datingan ayon sa hiling:** parang basta
    nawawala/kusang nag-re-respawn ang pig kahit buhay pa - "dapat
    mag-spawn lang sila kapag namatay na yung ibang baboy... di
    pwede silang mawala ng kusa".
  - **Ayos:** TINANGGAL na ang BUONG "PAGKAWALA/PAGBALIK SA MAPA" na
    seksyon (`vanishPig()`, `reappearPig()`, ang `nextDisappearAt`
    field, at ang `PIG_DISAPPEAR_INTERVAL/DURATION_MIN/MAX_MS` na
    constants) - "dead" (killPig) na lang ang TANGING paraan kung
    paano mawawala ang isang pig sa paningin, tapos `respawnPig()`
    (dating `reappearPig`/`respawnPig`, iisa na lang ngayon ang
    landas) ang bumabalik sa kanya. Tinanggal din ang `"gone"` mula sa
    listahan ng POSIBLENG `state` (`"idle" | "walking" | "dead"` na
    lang) - naiwan pa rin (pero epektibong hindi na aktibong
    ginagamit/dead code na) ang mga `state !== "gone"` na check sa ibang
    lugar (safe/harmless, defensive lang).
  - **Bagong FIXED na 15 segundong respawn delay (dating RANDOM
    8-20s):** `killPig()` - `pig.respawnAt = performance.now() +
    PIG_RESPAWN_DELAY_MS` (bagong constant, `15 * 1000`, pinalitan ang
    dating `PIG_RESPAWN_DELAY_MIN_MS`/`PIG_RESPAWN_DELAY_MAX_MS`).
  - **Para i-adjust:** tagal ng respawn pagkatapos mamatay →
    `PIG_RESPAWN_DELAY_MS` (pig.js).

- **(b) Itinaas pa ng konti ang anino ng oldman/pig (dating item 19
  sa itaas, medyo malayo pa rin/nakalutang):**
  - `offsetY: -TILE_SIZE * 0.3` → `-TILE_SIZE * 0.45` (oldman,
    decor.js), `offsetY: -TILE_SIZE * 0.25` → `-TILE_SIZE * 0.4`
    (pig, pig.js).
  - **Para i-adjust pa:** taasan/babaan pa ang parehong multiplier
    (mas malaking numero = mas malapit/mas taas ang anino).

### (21) Bagong MOBILE/TOUCH CONTROLS - magagamit na ngayon sa Android/touchscreen (dating keyboard+mouse LANG)
- **Files:** `js/mobile-controls.js` (bago), `index.html`, `style.css`

- **Problema bago ito:** puro keyboard (WASD/Shift/E/V/digit keys) at
  mouse (click/drag) ang buong laro - walang paraan para talagang
  gumalaw ang player sa isang touchscreen na walang keyboard.

- **(a) Bagong `js/mobile-controls.js`** - PINAKAHULING script sa
  `index.html` (pagkatapos ng `main.js`), para siguradong naka-declare
  na ang LAHAT ng ginagamit nitong global (`keys`, `showToolRadial`,
  `hideToolRadial`, `toolRadialVisible`):
  - **Touch device detection** (`isMobileTouchDevice`) - kombinasyon
    ng `"ontouchstart" in window` / `navigator.maxTouchPoints` /
    `matchMedia("(pointer: coarse)")` - kung touch device, idinadagdag
    ang `touch-controls-active` class sa `<body>` (CSS na ang bahalang
    magpakita ng mga bagong control - `style.css`) - **WALANG epekto
    sa desktop**, keyboard+mouse pa rin ang default doon.
  - **Virtual joystick** (`#mobile-joystick`, kaliwang-ibaba) - i-drag
    mula sa gitna ng bilog - DIREKTANG minamanipula ang PAREHONG
    global na `keys` object (`input.js`) na binabasa ng `update.js`
    (`keys["w"/"a"/"s"/"d"]`) - kaya AWTOMATIKONG gumagana ito nang
    walang binagong code sa `update.js`/`player.js`, kasama na ang
    diagonal na galaw (2 direksyon nang sabay, 8-octant na
    conversion ng anggulo). Mas malapit sa gilid ng bilog ang hila
    (`RUN_THRESHOLD_RATIO = 0.72`) = `keys["shift"] = true`
    (kaparehong Shift key, "takbo").
  - **"V" na button (Tool Radial)** - i-TAP para buksan
    (`showToolRadial()`) - sa halip na ang "hawak+itutok+bitaw" na
    gesture (mahirap gawin sa touch), i-TAP na lang ang gustong icon
    SA LOOB ng radial - GUMAGANA NA agad ito dahil may sarili nang
    `click` listener kada icon (tool-radial.js, ito rin ang
    ginagamit bilang mouse-click alternatibo - walang binago dito).
  - **"E" na button (Pumasok/Lumabas sa pintuan)** - sinusunod ang
    PAREHONG "edge-detected" na paraan ng totoong keyboard na "E"
    (update.js, `eKeyDown`/`eKeyWasDown`) - itinatakda lang ang
    `keys["e"] = true` sa `pointerdown`, `false` sa `pointerup`/
    `pointercancel`, GAYA MISMO ng totoong keydown/keyup - walang
    hiwalay/duplicate na logic para sa pagbukas ng pintuan.
  - **Bagong "tap sa LABAS para mag-cancel ang tool radial"** -
    dating "keyup ng V"/"window blur" LANG ang paraan para isara ito
    nang walang napiling tool - walang keyup sa touch, kaya bagong
    generic na `document.addEventListener("pointerdown", ...)` na
    nagsasara nito (`hideToolRadial()`) kung sa LABAS ng
    `#tool-radial` panel ang tinamaan - gumagana ito pareho sa mouse
    AT touch.
  - **TANDAAN:** ang PAG-TAP mismo sa MUNDO (canvas) - pag-ani,
    pagdampot, pagbukas ng tindahan/crafter/kama, atbp - AY GUMAGANA
    NA nang walang karagdagang code: awtomatikong gumagawa ang
    browser ng "synthetic" mouse events (mousemove → mousedown →
    mouseup → click) mula sa isang simpleng tap, at ang `dig.js` ay
    nakikinig lang sa `"mousedown"`/`"mousemove"` (walang sariling
    touch listener) - kaya AWTOMATIKONG gumagana na ito sa touch.
  - **Pag-drag ng item sa inventory** - gumagana na rin dati pa
    (walang binago) dahil `pointerdown`/`pointerup` (unified sa
    touch) ang ginamit ng buong drag system (hotbar.js).

- **(b) `index.html`** - bagong markup: `#mobile-joystick` (base +
  stick) at `#mobile-action-buttons` (2 button - `#mobile-btn-tools`,
  `#mobile-btn-interact`) - inilagay bago ang `<script>` tags.

- **(c) `style.css`** - bagong seksyon (dulo ng file) - nakatago LANG
  (`display: none`) hangga't wala pang `touch-controls-active` class
  ang `<body>`. Bagong `touch-action: none;` sa `canvas` mismo (itaas
  ng file) - pinipigilan ang default browser gestures (pinch-zoom,
  double-tap zoom, pan) habang naglalaro, HINDI hinahadlangan ang
  "synthetic mouse events" na kailangan pa rin ng tap-to-interact.

- **Para i-adjust:** laki/posisyon ng joystick/buttons →
  `#mobile-joystick`/`#mobile-action-buttons` (style.css, `left`/
  `right`/`bottom`). Gaano kalayo bago "takbo" → `RUN_THRESHOLD_RATIO`
  (mobile-controls.js). Laki ng dead zone → `DEAD_ZONE_PX`.

### (22) Crafter: puwede nang i-BREAK (right-click), "Lutuan" → "Stove" (buong rename), Oldman shop: UNLIMITED buy, Stove: kahit ilang quantity + 10s duration kada piraso + sprite animation, at bagong wet-dirt tile (ulan) mula sa grass2.png
- **Files:** `js/craft.js`, `js/dig.js`, `js/decor.js`, `js/stove.js`
  (dating `js/lutuan.js` - RENAMED), `js/hotbar.js`, `js/update.js`,
  `index.html`, `style.css`, `assets/objects/stove/stove.png` (bago)

- **(a) Crafter: right-click para i-BREAK ang naka-lagay na Crafter sa
  mundo.** Dati, PERMANENTE (walang paraan para tanggalin maliban sa
  pag-drag papuntang mundo BAGO pa ito ma-place). Ngayon:
  - `breakPlacedCrafter(crafter)` (craft.js) - inaalis mula sa
    `placedCrafters`, tapos `spawnGroundItem(col, row, "crafter", 1)`
    (ground-items.js) - **HINDI direktang bumabalik sa
    `craftersCollected`/hotbar** - ordinaryong FLOATING ground item na
    lang muna ito (kagaya ng ani), kailangan pang damputin gamit ang
    awtomatikong "kamay" (dig.js) bago talagang mapunta sa bag.
  - Bagong `canvas.addEventListener("contextmenu", ...)` (dig.js,
    katabi ng `mousedown` listener) - `event.preventDefault()` (para
    hindi lumabas ang OS/browser context menu), tapos tinatawag
    `getPlacedCrafterAt`/`breakPlacedCrafter` kung may Crafter sa
    tinuturong tile AT abot ng player (`isTileInReach`).
  - **Hindi ginawa ang parehong bagay sa Stove** - hindi hiniling,
    manatiling PERMANENTE (walang break) ang mga naka-lagay na Stove
    sa ngayon.

- **(b) Buong rename: "Lutuan" → "Stove".** Case-sensitive na 3-pass
  na `sed` (`LUTUAN`→`STOVE`, `Lutuan`→`Stove`, `lutuan`→`stove`) sa
  LAHAT ng `.js`/`.html`/`.css`/`.md` file - variable/function names,
  item id (`"lutuan"` → `"stove"`), HTML ids/classes
  (`#lutuan-panel` → `#stove-panel`, atbp.), CSS selectors, saved-data
  keys (`inventory-save.js`: `placedLutuans` → `placedStoves`,
  `stovesCollected`). **Na-rename din ang file mismo**:
  `js/lutuan.js` → `js/stove.js` (kasama ang `<script src>` sa
  `index.html`). Walang backward-compat para sa lumang localStorage key
  na `lutuan`/`placedLutuans` - hindi ito naka-save cross-session dati
  (session-only pa rin ang placed structures, tingnan ang (d) sa
  ibaba), kaya walang epekto.

- **(c) Oldman shop: UNLIMITED buy (stock na lang ang hadlang, hindi na
  ang gold).** `js/decor.js`:
  - `maxAffordableOldManCount(item, stock)` - TINANGGAL ang
    `goldCollected`/`buyPrice` na check, `stock` na lang mismo ang
    ibinabalik (basta `stock > 0`).
  - `buyFromOldManQuantity` - binabawas pa rin ang gold KUNG MERON
    (`goldCollected = Math.max(0, goldCollected - price * amount)`) -
    naka-CLAMP sa 0 (hindi na bumababa pa sa negatibo) - kaya kahit
    ubos na ang gold, tuloy pa rin ang biling walang bayad.
  - Toast message na "Kulang ang gold mo!" - pinalitan ng "Ubos na ang
    stock!" (dahil stock na lang talaga ang dahilan kung bakit
    mabibigo ang `startOldManBuyFlow`).

- **(d) Stove: kahit ilang quantity kada slot + 10 segundong DURATION
  kada piraso (dating 1 piraso lang, INSTANT).** `js/stove.js`:
  - `smeltIngredient`/`smeltFuel` - dating `itemId` lang (1 piraso),
    ngayon `{ itemId, count }` (STACK) - puwede nang buong hawak/
    floatingPickup (kahit ilang piraso) ang idrop sa isang beses
    (`placeSmeltItem(slotType, itemId, qty)` - naka-clamp sa TALAGANG
    stock, TUMATANGGI kung may laman na ang slot na IBANG item type).
  - `SMELT_COOK_DURATION_MS = 10000` (10s) + `smeltCookProgressMs` -
    bagong `updateStoveCooking(deltaMs)`, tinatawag KADA FRAME mula sa
    `js/update.js` (tunay na oras, hindi apektado ng `speedScale` -
    kaparehong dahilan ng `updateTorchBurn`) - habang
    `isStoveActivelyCooking()` (may sapat pang ingredient AT fuel, at
    may valid recipe), tumatakbo ang progress, PAULIT-ULIT na
    kumakain ng 1 ingredient + 1 fuel kada 10s hangga't may natitira
    (hindi na kailangang paulit-ulit i-drag) - lumalabas sa
    `smeltOutput.count` (naiipon, hindi nawawala kung hindi pa
    nadadampot).
  - `removeSmeltItem(slotType, refundToBag)` - inaalis na ang BUONG
    STACK (dati 1 piraso lang), ibinabalik ang `{itemId, count}` na
    natanggal - ginamit ito ng `js/hotbar.js` (drag palabas ng smelt
    slot papunta sa mundo/bag) para malaman kung ILAN ang ilalagay sa
    ground item/bag, hindi na naka-hardcode sa `1`.
  - Bagong progress bar sa ilalim ng `#stove-smelt-row`
    (`--stove-cook-progress` CSS var, `.stove-cooking` class,
    `style.css`) - light-weight na `updateStoveCookVisual()` (isang
    CSS custom property lang, hindi buong `syncStovePanel`) kada
    frame habang bukas ang panel.
  - Bagong sprite-based na guhit sa mundo (dating "🍲" emoji lang) -
    ginagamit ang bagong `assets/objects/stove/stove.png` (6-frame
    horizontal strip, 337×63px) - Frame 1 (index 0) = walang
    apoy/idle, Frame 2-6 (index 1-5) = umiikot (`STOVE_COOK_FRAME_MS
    = 150`ms bawat frame) HABANG `isStoveActivelyCooking()` (hindi na
    basta "may `smeltOutput`" - puwede nang magpatuloy ng maraming
    piraso magkakasunod).

- **(e) Bagong wet-dirt tile habang UMUULAN (dating masyadong simple/
  flat na kulay na tile mula sa `ground-assets.png`).** `js/dig.js`
  (`drawGrass`):
  - Kinuha mula sa `grass2.png` (parehong pinagmumulan ng
    `GRASS_PLAIN_BASE_LOCAL_ID`/`GRASS_DECOR_BASE_LOCAL_ID` sa itaas) -
    ang card sa **IBABANG-KALIWA** (bottom-left) ng 3×3 na grid ng
    "preview card" na larawan (maputik, may bakas ng paa). Bawat card
    sa `grass2.png` ay may EMBOSSED/rounded na border+shadow sa gilid
    (nakita gamit ang pag-detect ng mga bg-gutter row/column sa pagitan
    ng bawat 3×3 card) - kaya "INNER" lang (loob) ng card ang kinuha,
    hindi kasama ang border, kaparehong-paraan ng pagkuha ng
    `GRASS_PLAIN`/`GRASS_DECOR` (4×4 variant block, may natural na
    pagkaiba-iba kada tile sa halip na 1 paulit-ulit na tile lang).
  - `RAIN_WET_DIRT_BASE_LOCAL_ID = 177` (grass2.png, row 12 col 2,
    1-based) + `RAIN_WET_DIRT_COLS/ROWS = 4` (4×4 block) + bagong
    `getRainWetDirtLocalId(col, row)` (kaparehong-pareho ng
    `getGrassLocalId`).
  - `drawGrass` - ang sanga ng `isWetFromRain` ay gumagamit na ng
    `gids.grassFirstgid + getRainWetDirtLocalId(col, row)` sa halip na
    `gids.wet` (na galing pa rin sa `ground-assets.png`/
    `WET_TILESET_FILE` - IYON ay para na lang sa FARM na basang lupa
    matapos manghukay/magdilig, `drawDugTiles`, HINDI ito ginalaw -
    magkaibang bagay ang "nabasa dahil sa ulan" laban sa "nadiligan/
    hinukay" na lupa).

### (23) Tunay na snow-ground texture habang umuulan ng niyebe (dati puting overlay lang)
- **Files:** `js/dig.js`
- **Konteksto:** puno/bato (`resources.js`) ay MAY-ROON NANG snow-swap
  dati pa (ibang larawan file, `snowtree*.png`/`snowrock*.png`) - ang
  lupa mismo lang ang kulang (puting `fillRect()` lang, hindi tunay na
  texture).
- `SNOW_TILESET_FILE = "Snow.tsx"` (larawan: `Snow.png`) +
  `SNOW_GROUND_LOCAL_ID = 776` (hilera 9 hanay 9, 1-based - isang
  payak na PAULIT-ULIT na snow texture).
- `getDigGids()` - `gids.snow` (kaparehong-paraan ng `gids.wet`, may
  sariling `findLoadedTilesetFirstgid` verification - `null` kung
  hindi ito ma-verify, para bumalik na lang sa puting overlay).
- `drawSnowGroundCover()` - `drawTile(gids.snow, ...)` sa halip na
  `ctx.fillRect()` ng puting kulay (may fallback pa rin sa puting
  `fillRect` kung `null` ang `gids.snow`). Pareho pa rin ang fade-in
  (`ctx.globalAlpha = snowCoverage`).
- **Note:** ito ang FALLBACK na lang ngayon - ang PANGUNAHING batayan
  ng snow-ground texture (pati grass/dirt/wet_dirt) ay direktang mula
  sa mga naka-paint na layer sa newmap.tmj, tingnan ang entry (27).
- **Para i-adjust:** ibang snow-ground texture (fallback) → baguhin
  `SNOW_GROUND_LOCAL_ID`.

### (24) Rain: bagong "target tile row" na pag-ulan (kagaya ng sample) + mas malinaw na splash + staggered start mula sa itaas
- **Files:** `js/rain.js`
- **Konteksto:** hiling ng user na kagaya ng isang standalone na "Top
  Down Rain" na sample (diretsong pababa lang, may target tile row,
  splash pag-abot doon) ang itsura ng ulan - dating diagonal na streak
  lang na basta umiikot/wumawrap sa gilid ng screen, walang direktang
  ugnayan ang splash sa mismong patak.
- **Bagong pag-uugali ng bawat patak** - may `targetY` (naka-align sa
  `TILE_SIZE * camera.zoom`, DAPAT naka-zoom dahil device-pixel space
  na ang buong offsetX/offsetY system, hindi world-pixel - dating bug
  ito, kaya halos hindi makita ang splash bago naayos), diretsong
  pababa (walang tagilid), pag-abot sa `targetY` doon mismo lumalabas
  ang splash tapos nag-re-reset sa bagong random na target.
- **LAGING nagmumula sa ITAAS NG BUONG VIEW ang bawat reset** (hindi
  lang sa itaas ng SARILING target nito) - kaya kung malapit ang
  target sa itaas, mabilis tumama; kung malayo (ibaba), matagal pa -
  dahan-dahang kumakalat ang ulan mula itaas papuntang ibaba sa
  simula, hindi bigla-biglang buo agad ang buong screen.
- **Splash radius/opacity** - naka-batay sa laki ng tile SA SCREEN
  (`RAIN_SPLASH_RADIUS_TILE_FRACTION * tileStep`), hindi FIXED na
  pixel value - dati halos invisible dahil napakaliit kumpara sa
  laki ng tile sa 4x-8x na zoom.
- **Para i-adjust:** bilang ng patak → `RAIN_DROP_COUNT`. Kulay →
  `RAIN_COLOR`. Laki ng splash → `RAIN_SPLASH_RADIUS_TILE_FRACTION`.

### (25) Snow: parehong "staggered start mula sa itaas" gaya ng ulan
- **Files:** `js/snow.js`
- Kagaya ng entry 24 - ang `initSnow()` (unang batch ng snowflakes) ay
  hindi na basta ikinakalat sa BUONG screen height agad (`randomizeY =
  true` dati) - `createSnowflake(false, ...)` na, pero naka-randomize
  pa rin ang layo sa itaas (hindi laging `-SNOW_MAX_RADIUS*2` lang para
  sa lahat, kung hindi isang tuwid na "linya" ang bababa nang sabay-
  sabay sa unang segundo).

### (26) Weather calendar: 3 "season block" (rain/snow/sunny) kada buwan, tig-10 araw, random ang order
- **Files:** `js/calendar.js`
- **Dating gawi:** isang random na araw lang (25-30) ang niyebe kada
  buwan, at 1-12 kalat-kalat na random na araw ang ulan kada 24-araw
  na cycle - magkahiwalay/independent ang dalawa.
- **Bagong gawi:** hinahati ang 30-araw na buwan sa TATLONG
  magkakasunod na block (`WEATHER_TYPES = ["rain","snow","sunny"]`),
  tig-`WEATHER_BLOCK_DAYS` (=10) araw bawat isa - RANDOM ang
  pagkakasunod-sunod nila kada buwan (`getMonthWeatherOrder`, seeded
  Fisher-Yates shuffle sa `year,monthIndex`), pero eksaktong 10/10/10
  palagi ang bilang (na-verify sa simulation).
- Sa loob ng "rain" block, may porsyento (`THUNDERSTORM_CHANCE`) ng
  mga araw doon na nagiging thunderstorm - iba-iba PER-ARAW (seeded sa
  `totalDays`), hindi pareho sa buong block. Ganun din ang
  `SNOW_STORM_CHANCE` sa loob ng "snow" block.
- **Para i-adjust:** haba ng bawat block → hatiin ang
  `CALENDAR_DAYS_PER_MONTH` (30) sa ibang bilang ng `WEATHER_TYPES`.
  Tsansa ng bagyo → `THUNDERSTORM_CHANCE`/`SNOW_STORM_CHANCE`.

### (27) Ground tiles (grass/dirt/wet_dirt/snow) - sinusunod na ngayon ang AKTWAL na naka-paint na layer sa newmap.tmj, hindi na sariling hash/flip variant
- **Files:** `js/dig.js`
- **Natuklasan:** may 4 na BUONG-mapa (70x40, WALANG blangkong cell) na
  layer na pala sa newmap.tmj: `"grass"`, `"dirt"`, `"wet_dirt"`,
  `"snow"` - may 4-24 unique gid bawat isa, ibig sabihin GAWA NA pala
  ng map author ang tamang variety - hindi na kailangan pang mag-hash/
  mag-flip ng sarili nating variant (dating `getGrassLocalId`/
  `getRainWetDirtLocalId`/flat `SNOW_GROUND_LOCAL_ID`/flip-hack).
- Bagong `getPaintedGroundGid(layerName, col, row)` (kasama ang
  `getGroundLayer`/`findMapLayerByName`, cached per `currentWorld`) -
  direktang binabasa ang gid na NAKA-PAINT doon sa (col,row). Ginamit
  sa `drawGrass` (grass/wet_dirt), `drawDugTiles` (dirt/wet_dirt), at
  `drawSnowGroundCover` (snow) - PALAGING may fallback sa dating hash/
  flat-constant kung 0/walang layer sa kasalukuyang mundo (hal.
  starterMap.tmj/snowMap.tmj/houseInside.tmj na walang ganitong layer).
- **Para i-adjust:** kung magbabago ang pangalan ng layer sa Tiled,
  tugmain ang string na ipinapasa sa `getPaintedGroundGid` (hal.
  `"grass"`, `"dirt"`, atbp.) - case-sensitive, dapat eksaktong tugma
  sa `layer.name` sa .tmj.

### (28) Oak trees (choppable, 20 random kada mundo) - dating WALANG snow-swap, ngayon may snowtree/snowtree1 na rin
- **Files:** `js/decor.js`
- **Konteksto:** may 2 SEPARADONG "oak" system pala: (a) ang
  `BACKDROP_OAK_COUNT` (10, di-choppable, dekorasyon lang malapit sa
  bahay) - MAY snow-swap na dati (`resolveBackdropOakSprite`, gumagamit
  ng `snowtree.png`/`snowtree1.png`). (b) ang `OAK_COUNT_PER_WORLD`
  (20, CHOPPABLE/axeable, random kalat sa buong mapa) - ito ang
  tinutukoy ng "mga random na pwedeng i-axe na trees" - WALANG snow-
  swap logic kahit kailan (laging `oak.png`/`oakidle.png`), kaya
  "kalahati lang" ang tila-may-niyebe sa paningin ng user.
- **Fix:** `resolveOakSprite` (choppable) - kapag `isSnowWeather()`,
  gumagamit na rin ngayon ng `backdropSnowTreeImage`/
  `backdropSnowTree1Image` (parehong asset/threshold -
  `BACKDROP_SNOW_HEAVY_AFTER_MS` - ng backdrop system, REUSED, hindi
  duplicated) - sa halip na `oakIdleImage`. Ang HIT/chop reaction
  animation lang ang hindi ginalaw (laging `oakImage`, simple lang
  dapat ang biglaang swing reaction).

### (29) Bahay: hiwalay na PNG art (house.png/snowhouse.png) + tamang per-bahay na Y-sort/occlusion
- **Files:** `js/map.js`, assets `assets/map/house.png` +
  `assets/map/snowhouse.png`
- **Kasalukuyang paraan:** dalawang KUMPLETONG larawan (hindi tileset)
  - `house.png` (walang niyebe) at `snowhouse.png` (may niyebe) -
    ginagamit ang alinman ayon sa `isSnowWeather()`. Isang
    `ctx.drawImage()` call lang bawat bahay (`drawHouseImageAt`),
    NATIVE na sukat (walang stretch), naka-anchor sa ILALIM-GITNA ng
    bawat bahay na bbox.
  - Ang bbox/ground-line ng bawat bahay ay mula pa rin sa "House"
    layer(s) ng newmap.tmj (`buildHouseInfo`/`buildIndividualHouseBBoxes`)
    - ito lang ang GAMIT ngayon PARA MALAMAN kung SAAN iguguhit ang
    larawan (posisyon/laki ng footprint), HINDI na ito ang
    pinagmumulan ng aktwal na larawan.
  - **Bawat INDIVIDUAL na bahay (connected component ng "House" layer)
    ay may SARILING `overlapInstances` entry** - sariling `bbox` AT
    sariling `baseY` (`getCollisionGroundY(house.bbox)`, kinukwenta
    PER-bahay). Mahalaga ito dahil MARAMING HIWALAY na bahay ang
    posible sa isang mundo (2 sa newmap.tmj) - kung IISANG malaking
    "instance" lang (pinagsamang bbox) ang gagawin para sa lahat,
    mali ang Y-sort ng ilan sa kanila laban sa puno sa paligid nila
    (natatakpan ang puno sa HARAPAN, dapat likod lang), at masyadong
    maluwag/mali ang occlusion bbox (nag-o-opacity kahit GILID lang
    ng bahay ang nadikit ng player, hindi pa talaga likod).
- **2 gotcha na dapat tandaan kung babalikan/babaguhin pa ang bahay:**
  1. May 2 HIWALAY na `tilelayer` sa newmap.tmj na PAREHONG "House"
     ang pangalan (isa dingding, isa bubong/karagdagang piraso) -
     `findAllTileLayersByName` (HINDI `findTileLayerByName`) ang
     dapat laging gamitin kapag kailangang malaman ang buong
     footprint ng bahay, kung hindi, kalahati ng mga cell ay
     mawawala.
  2. Kung babalik man sa isang tile-based na paraan (halimbawa,
     kumuha ulit ng larawan mula sa isang tileset/spritesheet sa
     halip na hiwalay na PNG), TANDAAN: maraming BLANGKONG tile sa
     gilid ng dahilig na roofline - kung mag-shift/kumuha ka ng
     ibang posisyon base dito, siguraduhing panatilihing BLANGKO ang
     mga talagang blangko (huwag basta ipilit kumuha ng anumang
     laman sa bagong posisyon), kung hindi, may panganib na "ma-leak"
     ang laman ng ibang sprite papunta rito.
- **Para i-adjust:** ibang anchor (hindi ilalim-gitna) → baguhin ang
  `x`/`y` computation sa `drawHouseImageAt`. Bagong bahay sa Tiled sa
  hinaharap → awtomatiko itong may tamang bbox/baseY basta "House" pa
  rin ang pangalan ng layer nito.

### (30) 3 hiwalay na ayos: tinanggal ang house occlusion fade, stackable na ang crafting input slots, at naayos ang "natatabunang" item sa bag
- **Files:** `js/map.js`, `js/craft.js`, `js/hotbar.js`
- **(a) Bahay - tinanggal ang occlusion/fade effect.** `js/map.js`:
  `OCCLUDABLE_OVERLAP_TYPES` ay `["trees"]` na lang (dating
  `["trees", "house"]`) - VERIFIED sa pamamagitan ng video na ipinadala
  ng user: palaging washed-out/malabo ang bahay kahit malayo pa ang
  player, dahil sa maluwag na bbox (buong roof+wall silhouette) na
  ginagamit ng `shouldOccludeForPlayer` - hindi laging TALAGANG "likod"
  ang totoong dahilan ng pag-overlap. Sa halip na i-tune pa ang bbox,
  tinanggal na lang ang buong fade behavior para sa bahay (hiling ng
  user) - mga puno na lang ang may occlusion fade ngayon.
- **(b) Crafting input slots - stackable na (maraming quantity kada
  cell).** `js/craft.js`: dating isang piraso lang kada cell
  (`craftInputs[i]` = itemId string o null). Ngayon `{itemId, count}`
  na ang bawat cell (o null), may `MAX_CRAFT_STACK = 99` na cap:
  - `placeCraftIngredient` - kung bakante ang cell, bagong stack
    (count 1); kung PAREHONG item na ang laman, dinadagdagan lang ang
    count; kung IBANG item, tinatanggihan pa rin (kailangan pang alisin
    muna, kagaya ng dati).
  - `removeCraftIngredient` - ibinabalik na ang BUONG count ng cell
    (hindi lang 1) - isang cell = isang buong stack na ngayon.
  - `getCraftInputCounts` - sinusuma na ang `count` ng bawat cell
    (hindi na basta +1 kada occupied cell).
  - Bagong `consumeShapedRecipeInputs`/`consumeShapelessRecipeInputs` -
    dating basta nililinis (`.map(() => null)`) ang LAHAT ng cell
    pagka-match ng recipe, kahit may NATITIRANG quantity pa (posibleng
    mawala/masayang ang labis) - ngayon TAMANG binabawas lang ang
    EKSAKTONG kailangan (1 bawat "required" cell para sa SHAPED, TOTAL
    na dami ayon sa `recipe.ingredients` para sa SHAPELESS, "draining"
    cell-by-cell), panatilihin ang anumang natitira.
  - `js/hotbar.js` (pointerup, "craft-input" + overCanvas/itinapon sa
    mundo) - inayos din para ibagsak ang BUONG count ng cell (hindi
    basta 1), kung hindi, mawawala ang labis na quantity.
  - Bagong quantity badge (`.hotbar-badge`, parehong estilo ng output
    slot) sa bawat input cell na may count > 1.
- **(c) Bag: naayos ang "natatabunang" item (dating kailangan pang
  i-Sort para makita).** `js/hotbar.js`: ROOT CAUSE - may "default
  master position" ang bawat item type sa bag grid
  (`itemDefaultBagPosition`) - kapag nag-drag ng IBANG item papunta sa
  eksaktong posisyon na iyon (bago pa man ito naging tunay na "split
  stack" doon), basta na lang ito NAOOVERWRITE ng bagong
  `bagSplitStacks[position]` entry nang walang swap/babala - nawawala/
  natatago ang dating item (`resolveBagCellAt` ay split stack ang
  sinusunod, hindi na ipinapakita ang "master" ng ibang item sa
  parehong posisyon). Bagong `relocateMasterIfBlocking(position,
  incomingItemId)` - tinatawag BAGO magsulat ng bagong split stack sa
  isang posisyon: kung "master" cell pa ito ng IBANG item na may
  natitirang unassigned count, awtomatiko munang inililipat ang
  default position niyon sa TALAGANG bakanteng lugar, para hindi na
  ito matabunan/mawala. Sort (`sortBagItems`) ay gumagana pa rin
  bilang "buong recompute" (unaffected), pero hindi na dapat kailanganin
  para makita ang mga item - dapat awtomatiko na itong nangyayari.

### (31) Bahay: collision sa gilid/itaas ng pinto; Crafter/Stove: totoong collision + Stove breakable na rin (individually); Stove: may ilaw kapag nagluluto
- **Files:** `js/map.js`, `js/craft.js`, `js/stove.js`, `js/collisions.js`,
  `js/decor.js`, `js/dig.js`, `js/draw.js`
- **(a) Bahay - collision sa gilid/itaas ng pinto.** `js/map.js`:
  VERIFIED sa pamamagitan ng pag-overlay ng collision rectangles laban
  sa aktwal na house.png/snowhouse.png art - kulang/mali ang dating
  Tiled collision object para sa bagong PNG-based na bahay (entry 29).
  Bagong `buildHouseWallCollisions(worldName, houses)` (tinatawag sa
  `loadWorld`, PAGKATAPOS mai-load ang static na Collisions layer -
  DINADAGDAG, hindi pinapalitan) - gumagawa ng 1-3 rectangle PER bahay:
  - Kung WALANG tunay na pintuan doon (DOORS sa worlds.js - dekorasyon
    lang na bahay): 1 buong solid na rectangle (`HOUSE_WALL_HALF_WIDTH`
    x `HOUSE_WALL_HEIGHT_FROM_BOTTOM`, naka-center/naka-anchor sa
    ILALIM ng bbox, kaparehong batayan ng `drawHouseImageAt`).
  - Kung MAY tunay na pintuan (`findDoorForHouseBBox` - hinahanap ang
    TAMANG `DOORS` entry na TALAGANG nasa loob ng bbox na ito, hindi
    basta ang unang match sa parehong mundo, dahil posibleng may 2+
    HIWALAY na bahay): kaliwang pader + kanang pader (parehong buong
    taas) + "lintel" (mula sa taas ng pader hanggang sa TALAGANG simula
    ng door TRIGGER zone, `door.area.y`) - may BUTAS lang sa eksaktong
    lugar ng pintuan, para hindi masira ang "Pumasok" na interaction.
- **(b) Crafter/Stove - totoong collision na.** Bagong
  `getPlacedCrafterCollisionBoxes()` (craft.js) /
  `getPlacedStoveCollisionBoxes()` (stove.js) - "LIVE" na collision
  (kaparehong pattern ng `getOldManCollisionBox`/`getPigCollisionBoxes`
  - HINDI bahagi ng static na `collisions` array, dahil PERSISTENT ang
  mga naka-lagay na Crafter/Stove sa BUONG session, hindi naka-tali sa
  isang partikular na pag-load ng mundo). Naka-wire sa `canMoveTo`
  (collisions.js, player) AT `canFeetMoveTo` (decor.js, oldman/pig) -
  parehong hindi na sila makakadaan sa naka-lagay na Crafter/Stove.
- **(c) Stove - breakable na rin (individually, right-click).**
  Bagong `breakPlacedStove(stove)` (stove.js) - kaparehong-pareho ng
  gawi ng `breakPlacedCrafter` (entry 22): hindi agad bumabalik sa
  `stovesCollected`/hotbar, lumalabas muna bilang ORDINARYONG FLOATING
  ground item. Ang `contextmenu` listener (dig.js) ay sinusuri muna
  ang Crafter, TAPOS ang Stove - INDIBIDWAL na nasisira ang bawat isa
  (isa lang ang naaapektuhan kada right-click sa isang partikular na
  tile, hindi lahat).
- **(d) Stove - may ilaw kapag AKTIBONG NAGLULUTO.** Bagong
  `drawStoveLight()` (stove.js), tinawag sa `draw.js` katabi ng
  `drawTorchLight()` - kaparehong estilo (radial gradient, screen
  space, "lighter" composite operation sa IBABAW ng araw/gabi tint),
  PERO naka-anchor sa POSISYON ng bawat naka-lagay na Stove (hindi sa
  player), at may MINIMUM na intensity (`STOVE_LIGHT_MIN_INTENSITY =
  0.35`) KAHIT ARAW PA (hindi tulad ng torch na 0 kapag araw) - dahil
  apoy mismo ito sa loob ng stove, hindi panlaban lang sa dilim. Aktibo
  lang kapag `isStoveActivelyCooking()` (existing function, dati nang
  ginagamit ng `getStoveAnimFrameIndex` para sa animated na apoy sa
  sprite - REUSED, hindi duplicated). **Tandaan:** ISANG GLOBAL na
  estado lang ang pagluluto (smeltIngredient/Fuel/Output - hindi
  per-stove), kaya LAHAT ng naka-lagay na Stove sa KASALUKUYANG mundo
  ay nag-iilaw nang SABAY kapag may aktibong niluluto (walang paraan
  para malaman KUNG ALIN eksaktong Stove ang "totoong" pinagmumulan).
- **Para i-adjust:** laki ng pader ng bahay → `HOUSE_WALL_HALF_WIDTH`/
  `HOUSE_WALL_HEIGHT_FROM_BOTTOM` (map.js). Laki ng collision ng
  Crafter/Stove → `CRAFTER_COLLISION_SIZE` (craft.js) /
  `STOVE_COLLISION_SIZE` (stove.js). Sukat/kulay/lakas ng ilaw ng stove
  → `STOVE_LIGHT_RADIUS`/`STOVE_LIGHT_COLOR`/`STOVE_LIGHT_MIN_INTENSITY`
  (stove.js).

### (32) Stove: naayos ang unreachable na "meat" recipe, bagong "cookedmeat" item (raw meat → cooked)
- **Files:** `js/stove.js`, `js/hotbar.js`, `js/inventory-save.js`
- **Sanhi ng bug:** dalawang entry sa `SMELT_RECIPES` ang may PAREHONG
  `ingredient: "wood"` (isa papuntang `charcoal`, isa papuntang `meat`)
  - dahil `.find()` (unang tugma lang) ang ginagamit ng
  `findMatchingSmeltRecipe()`, HINDI na-aabot kailanman ang pangalawang
  entry - lagi na lang charcoal ang lumalabas kahit ano pa ang fuel.
  Dagdag pa, mali rin ang resulta nito (`itemId: "meat"` - parang
  gumagawa ng RAW meat mula sa wood, hindi "cooked" na bersyon).
  Kasabay nito, may dead code rin sa `SMELT_FUEL_ITEMS` -
  `new Set(["wood","charcoal"], ["wood","meat"])` - binabalewala ng
  Set constructor ang 2nd argument, kaya walang epekto ang
  `["wood","meat"]` doon (fuel pa rin ay wood/charcoal lang, tama pa
  rin base sa comment, pero nakakalito).
- **Ayos:**
  - `SMELT_RECIPES` (stove.js) - pinalitan ang 2nd entry:
    `{ ingredient: "meat", result: { itemId: "cookedmeat", count: 1 } }`
    - ngayon raw `"meat"` (drop ng pig, tingnan ang bahagi 7 item 12)
    ang ingredient, hindi na `"wood"`, kaya HINDI na nagko-collide sa
    charcoal recipe. Fuel pa rin dapat (wood/charcoal) ang gamitin,
    parehong `SMELT_COOK_DURATION_MS` (10s/piraso).
  - `SMELT_FUEL_ITEMS` (stove.js) - tinanggal ang dead 2nd argument,
    `new Set(["wood", "charcoal"])` na lang.
  - Bagong `cookedmeat` entry sa `BAG_ITEMS` (hotbar.js, katabi ng
    `stove`) - `🍖` icon, `getCount()` ay bumabasa sa `cookedmeat`
    variable (na-declare na pala dati sa stove.js pero hindi pa
    ginagamit kahit saan - "orphaned" na variable).
  - Bagong case sa `adjustGlobalItemCount()` (hotbar.js) -
    `cookedmeat += delta`, kaparehong pattern ng `charcoal`/`meat`.
  - Bagong `cookedmeat` field sa `serializeInventoryState`/
    `loadInventoryState` (inventory-save.js) - kaparehong pattern ng
    `meat`/`charcoal` (kung hindi ito idadagdag dito, mababalik sa 0
    ang cookedmeat kada page reload kahit successfully na-save ang
    ibang item).
- **Para i-adjust:** ibang icon → `iconEmoji` sa BAG_ITEMS entry.
  Ibang cook time → `SMELT_COOK_DURATION_MS` (parehong ginagamit ng
  lahat ng recipe, walang per-recipe duration sa kasalukuyan).

### (33) Bagong "grass tufts" (damo) - random na spawn kagaya ng puno/bato, sway animation, yumuyuko + particle effect kapag natapakan
- **File:** `js/grass.js` (bago)
- Kaparehong pattern ng `resources.js` (seeded random na spawn kada
  outdoor world, `GRASS_TUFT_COUNT_PER_WORLD`) - PERO WALANG collision
  (puwedeng tapakan/dumaan ang player, hindi tulad ng puno/bato).
- **Idle:** banayad na sway animation (canvas skew, sine wave, iba't
  ibang phase kada tumpok).
- **Pagtapak:** yumuyuko ang damo PAPUNTA sa direksyon ng paglakad ng
  player (`resolveGrassBendDirection` - base sa `player.direction`),
  gamit ang `grassleft.png`/`grassright.png` (may snow variant din) -
  at may munting "pagkalat ng dahon" na particle effect
  (`spawnGrassTouchEffect`). Ang bend state ay STABLE habang
  nakatapakan (isang beses lang ang ease-in, hindi paulit-ulit
  kada frame - dating bug ito, "nginig"/kumikislap, tingnan ang
  `GRASS_BEND_SETTLE_MS`/`GRASS_BEND_RELEASE_MS`).
- **Para i-adjust:** dami ng tumpok → `GRASS_TUFT_COUNT_PER_WORLD`.
  Lakas ng bend → ang `0.34` multiplier sa `drawGrassTuftSprite`.

### (34) Oak: bagong "chop reaction" na naka-batay sa direksyon (oakLeft.png) + sariling snow hit animation (snowtreeLeft.png)
- **File:** `js/decor.js`
- Dating IISA lang (`oakImage`) ang HIT/chop reaction kahit anong
  direksyon/panahon. Ngayon: `resolveOakHitDirection(col)` (base sa
  `player.direction`, o relatibong posisyon kung patayo ang galaw) ang
  nagdedesisyon kung `oakImage`/`oakLeftImage` (normal na panahon) o
  `backdropSnowTreeImage`/`backdropSnowTreeLeftImage` (snow na panahon)
  ang gagamitin - itinatabi sa `oakHitAnimDirs` SA SANDALING mag-umpisa
  ang hit (hindi kada frame, para hindi magpalit-palit habang
  tumatakbo pa ang animation).
- **Para i-adjust:** ibang assets → `oakLeftImage`/
  `backdropSnowTreeLeftImage` sa itaas ng decor.js.

### (35) Rain: "makulimlim" na overcast tint
- **File:** `js/atmosphere.js`
- `drawDayNight()` - naghahalo (lerp) ng malamig na kulay-abong tono
  (`RAIN_OVERCAST_COLOR`) sa kasalukuyang araw/gabi tint habang umuulan
  - mas malakas kapag TALAGANG bagyo (`RAIN_THUNDERSTORM_OVERCAST_STRENGTH`)
  kaysa payak na ulan (`RAIN_OVERCAST_STRENGTH`).

### (36) Bagong LEVEL/EXP system + persistent na top-left HUD (pangalan/health/stamina/level+exp)
- **Files:** `js/hotbar.js`, `index.html`, `style.css`
- `PLAYER_STATS.level`/`.name` - bago. `gainExp(amount)` - pinupuno ang
  exp bar, "level up" (+1 level, carry-over ng labis na exp, tumataas
  ang kailangan sa susunod - `EXP_LEVEL_GROWTH`) pag umabot sa max, may
  toast + buo ulit ang health/stamina bilang gantimpala. May maliit na
  exp reward sa: pagputol ng puno/oak (`registerHit`/
  `handleAxeClickOnOak`), pag-ani ng carrot (`collectCarrot`), at
  pagpatay ng pig (`killPig`).
- `#player-hud` (index.html/style.css) - bagong LAGING NAKIKITANG frame
  sa itaas-kaliwa (hindi tulad ng `#equipment-stats`, nasa loob ng bag
  panel lang) - pangalan, health bar, stamina bar, "Lv. N" sa KALIWA ng
  exp bar. `syncPlayerHud()` (hotbar.js), tinatawag sa loob ng
  `syncEquipmentStats()`.
- **Para i-adjust:** exp reward per action → hanapin ang `gainExp(...)`
  calls (resources.js/decor.js/dig.js/pig.js). Bilis ng level-up →
  `EXP_LEVEL_GROWTH` (hotbar.js).

### (37) Item icons - totoong PNG (assets/items/) sa halip na emoji
- **Files:** `js/hotbar.js`, `js/ground-items.js`, `index.html`, `style.css`
- Pinalitan ang `iconEmoji` ng `icon: "./assets/items/<name>.png"` sa
  `BAG_ITEMS` (wood/stone/meat/torch/crafter/charcoal/stove/pickaxe/
  rake/axe/sword) - awtomatiko itong lumalabas sa bag/hotbar/crafting/
  stove/oldman-shop dahil GENERIC na ang `getItemIconHTML()`
  (hotbar.js). Idinagdag din ang parehong suporta sa
  `drawGroundItems()` (ground-items.js, `getGroundItemIconImage` cache)
  para sa mga item na NAKALAPAG sa lupa. Tool-radial (pickaxe/rake/
  axe/kamao) at equip-slot (left/right hand) - pinalitan din ng
  `<img>` (index.html/hotbar.js).
- **Tandaan:** `cookedmeat` lang ang naiwang emoji (walang ibinigay na
  icon file para dito).

### (38) Na-organize ang `assets/map/` (tilesets/, sprites/, _unused/)
- **Files:** `js/map.js`, `js/decor.js`, apat na `.tmj`, `newmap.tmx`
- **MAHALAGANG NATUKLASAN:** ang `loadTilesetImage()` (map.js) ay
  LAGING naghahanap ng tileset PNG (Snow.png/grass2.png/
  ground-assets.png/Snow-clear.png) diretso sa loob ng `MAP_DIR`
  (`assets/map/`), KAHIT SAAN pa nakatira ang `.tsx`/`.tsj` na
  tumutukoy dito - kaya HINDI puwedeng ilipat ang mga PNG na ito sa
  subfolder (mananatili sa root). Ang `.tsx`/`.tsj` FILES mismo
  (tileset DEFINITIONS) ay ligtas namang ilipat, dahil ang
  `findLoadedTilesetFirstgid()` (dig.js) ay `.split("/").pop()` na
  lang (basename) ang ikinukumpara, hindi buong path.
- **Resulta:** `assets/map/tilesets/` (lahat ng `.tsx`/`.tsj`),
  `assets/map/sprites/` (mga PNG na DIREKTANG tinatawag ng JS - house/
  snowhouse/oak/oakLeft/oakidle/snowtree/snowtree1/snowtreeLeft),
  `assets/map/_unused/` (mga sirang/hindi na ginagamit na file -
  archived, hindi binura). Nanatili sa root: `.tmj`/`.tmx` (world
  files) + ang mga tileset PNG na kailangang manatili doon.
  In-update ang `"source"` field sa 4 `.tmj` at `newmap.tmx`, at ang
  8 hardcoded na JS path (`map.js`/`decor.js`) papuntang `sprites/`.

### (39) Bagong AUDIO system (background music, ambience, sound effects) + weather-based music switching
- **File:** `js/audio.js` (bago), `js/player.js`, `js/grass.js`, `js/rain.js`
- Plain `HTMLAudioElement`, walang external library. Background music:
  `musicAudio`/`christmasMusicAudio` (loop, play/pause lang) -
  `updateBackgroundMusic()` (tinatawag kada frame) ang nagdedesisyon
  base sa panahon: **MAARAW** → `background-music.mp3`, **NIYEBE** →
  `its-beginning.mp3` (christmas song), **UMUULAN** → WALANG music
  (`raining.mp3` na lang ang naririnig).
- Sound effects (cloneNode kada tawag, para mag-overlap): axe
  (`playCutWoodSfx`), pickaxe (`playPickaxeSfx`), rake
  (`playRakeSfx`), damo (`playGrassSfx`, grass.js), pagdampot/
  pagtatanim (`playPutSfx`), kamao (`playPunchSfx` - RANDOM sa 3
  magkaibang tunog, `PUNCH_AUDIO_PATHS`), kulog (`playThunderSfx` -
  isang beses lang kada TALAGANG flash, tingnan ang
  `getThunderFlashAlpha` sa rain.js).
- **AYOS (bug fix):** dating "hindi tumutunog ang christmas-music pag
  nag-snow" - sanhi: PER-ELEMENT ang autoplay-unlock sa ibang browser
  (lalo na mobile/iOS Safari) - kung hindi pa na-.play() ang ISANG
  partikular na Audio element habang nasa loob ng user gesture,
  permanenteng naka-block ito sa hinaharap (tahimik, walang error).
  Ayos: `primeAudioElement()` (audio.js) - "pina-priming" (play() nang
  naka-mute, agad pino-pause) ang LAHAT ng persistent na music/ambient
  Audio element sa loob ng `unlockAudio()`, hindi lang yung
  kasalukuyang "desired" track.
- **Para i-adjust:** volume kada tunog → `AUDIO_VOLUME` (audio.js).
  Bagong sound → idagdag sa `AUDIO_PATHS` + sariling `play*Sfx()`.

### (40) Ground items: "vacuum"/magnet auto-pickup + mas maliit na laki
- **File:** `js/ground-items.js`, `js/update.js`
- `updateGroundItems(deltaMs)` - kapag TAPOS na sa "landing" bounce ang
  isang nakalapag na item AT malapit na ang player
  (`GROUND_ITEM_MAGNET_RADIUS`), unti-unting lumilipad ito papunta sa
  player - mas mabilis habang papalapit (`GROUND_ITEM_MAGNET_MIN_SPEED`
  hanggang `_MAX_SPEED`) - hanggang MAABOT
  (`GROUND_ITEM_MAGNET_CATCH_DISTANCE`), saka awtomatikong nadadampot
  (walang click na kailangan). Binawasan din ang laki ng iginuhit na
  item sa lupa (`drawGroundItems` - `TILE_SIZE*0.5`/`0.55`, dating
  `0.7`/`0.75`).
- **Para i-adjust:** lawak ng "pull" → `GROUND_ITEM_MAGNET_RADIUS`.
  Bilis → `GROUND_ITEM_MAGNET_MIN/MAX_SPEED`.

### (41) Bahay: BUONG pintuan na FULLY collidable (ayos sa "nakakapasok" na bug) + reach-margin + computed na exit spawn
- **Files:** `js/map.js`, `js/worlds.js`, `js/update.js`
- Dating "kalahati lang" (itaas) ang naka-collide sa pintuan (item 31)
  - nakakalakad pa rin ang player papasok sa IBABANG kalahati. Ngayon,
  ang BUONG `door.area` ang naka-collide (`buildHouseWallCollisions`,
  map.js) - ganap nang hindi na literal na makakapasok mula sa labas,
  "E" (Pumasok) na lang ang paraan.
- Dahil dito, kailangang ayusin ang `getDoorUnderPlayer()` (worlds.js)
  - dating kailangang TALAGANG mag-overlap ang player sa loob ng
  door.area (hindi na posible ngayon, dahil solid na ito) - may bagong
  `DOOR_REACH_MARGIN_PX` (6px) na "reach margin" para gumana pa rin
  ang prompt habang nakatayo lang DIKIT sa pintuan mula sa labas.
- **AYOS (bug fix):** dahil dito, ang mga LUMANG hardcoded na
  `door.returnSpawn` (village/newmap) ay naging NASA LOOB NG SOLID NA
  PADER - kaya "hindi sa mismong pinto napupunta" ang player pag-
  "Lumabas". Ayos: TINANGGAL ang hardcoded returnSpawn, may bagong
  `getDoorExitSpawn(door)` (worlds.js) na KINOKOMPYUTA ito TALAGA mula
  sa `door.area` (gitna nito, kaunting buffer pababa) - laging tama
  kahit anong laki/posisyon pa ng pintuan.
- **Para i-adjust:** margin ng reach → `DOOR_REACH_MARGIN_PX`. Buffer
  ng exit spawn → `exitBuffer` sa loob ng `getDoorExitSpawn`.

### (42) Snow particles - "in-remake" (pixelated square flakes, kagaya ng reference code)
- **File:** `js/snow.js`
- Batay sa isang sinend na reference (standalone "Top Down Snow" na
  HTML/canvas demo) - dating BILOG (`ctx.arc`, may AA/blur sa gilid)
  ang bawat snowflake; ngayon, MALIIT NA KUWADRADONG PIXEL (`ctx.fillRect`
  na may `Math.floor`, walang antialiasing) - mas tumutugma sa
  "image-rendering: pixelated" na istilo ng buong laro.
  `SNOW_MIN_SIZE`/`SNOW_MAX_SIZE` (1-3px, integer) - pinalitan ang
  dating `SNOW_MIN_RADIUS`/`SNOW_MAX_RADIUS` (2-5px, fractional).
  Idinagdag din ang isang munting PATULOY na "drift" (hangin) kada
  snowflake (dagdag sa dati nang sway) - parehong konsepto ng
  reference code.
- **Tandaan:** PINANATILI ang mga naunang fix/feature na WALA sa
  reference code (dahil sadyang kailangan sa totoong laro): world-
  anchored na posisyon (hindi screen-space), back/front na layer
  (occlusion sa likod ng puno/bahay), calendar-driven na simula/tigil
  (`getSnowIntensity`), snowstorm intensity boost, at ground sparkles -
  ang REMAKE ay nasa ITSURA/pagguhit lang ng bawat particle, hindi sa
  buong sistema.
- **Para i-adjust:** laki ng snowflake → `SNOW_MIN_SIZE`/`SNOW_MAX_SIZE`.

### (43) Crafter/Stove: LEFT-CLICK na rin (hindi lang drag) para maglagay mula sa isang malaking hawak; naayos ang "natatabunang" item sa bag; naayos ang hindi tumutunog na ulan; PERMANENTE na ang naputol na puno/bato + bagong 15-minutong (game time) respawn, isa-isa
- **Files:** `js/craft.js`, `js/stove.js`, `js/hotbar.js`, `js/audio.js`,
  `js/resources.js`, `js/update.js`, `js/settings-menu.js`

- **(a) Crafter/Stove input slots - puwede nang PLAIN LEFT-CLICK, hindi
  na kailangang literal na i-drag:**
  - Dating ang paglalagay ng isang HAWAK (`floatingPickup`, tingnan ang
    "HOLD-DRAG SPLIT STACK" sa hotbar.js) papunta sa isang craft-input/
    smelt-input slot ay sa pamamagitan LANG ng aktwal na drag-then-
    release (pointerup, `getDropTargetsAt`) - kung tapos na ang
    hold-drag gesture (floating na lang, cursor-following, hindi na
    aktibong dinadrag - kagaya ng gawi ng `startPointerAction` para sa
    hotbar slot/bag), WALANG listener sa craft/smelt slots na
    sumusuri dito - basta na lang nagsisimula ng BAGONG drag (kung
    may laman) o walang ginagawa (kung bakante).
  - **Ayos:** `js/craft.js` - bawat craft-input cell (FILLED man o
    EMPTY) ay may bagong pointerdown check: kung may `floatingPickup`
    na HINDI aktibong dinadrag, isang `placeCraftIngredient()` (1
    piraso) ang tatakbo kada click - paulit-ulit na puwedeng i-click
    (kahit malaking dami/"maraming quantity" ang buong hawak) para
    dagdagan pa. `js/stove.js` - kaparehong-pareho, pero
    `placeSmeltItem()` na BUONG `floatingPickup.count` ang isinusubok
    ilagay kada click (stackable talaga ang stove input, hindi 1 lang
    kada click gaya ng crafter).
  - **Para i-adjust:** wala nang bagong constant - parehong dami pa rin
    (1 kada click sa crafter, buong hawak sa stove) ang ginamit dati sa
    drag-drop na landas (hotbar.js pointerup).

- **(b) Bug: "natatabunan"/nawawalang item sa bag pag bumalik ang
  stock:**
  - **Sanhi:** may "default/master" posisyon ang bawat item type sa bag
    grid (`itemDefaultBagPosition`, hotbar.js) - PERMANENTE ito ONCE
    naitalaga. Kapag naubos ang isang item type (unassigned → 0), ang
    posisyon niyon ay itinuturing na "libre" (`resolveBagCellAt`) - kaya
    puwedeng ma-drop-an ito ng IBANG item bilang split stack. Pero kapag
    bumalik ang stock ng UNANG item (hal. nakapulot ulit ng wood),
    `ensureDefaultBagPositions()` ay basta na lang SKIP dahil MAY
    assigned position na raw ito (`itemDefaultBagPosition[item.id] !==
    undefined`) - kahit BLOCKED na pala ito ngayon ng split stack ng
    ibang item - resulta, WALANG cell na lumalabas para dito
    (`resolveBagCellAt` ay "split" ang uunahin, hindi na "master") -
    parang "nawala" ang item hanggang mag-Sort.
  - **Ayos:** `ensureDefaultBagPositions()` (hotbar.js) - kung MAY
    assigned na posisyon PERO NA-BLOCK na ito ngayon ng ibang split
    stack (`bagSplitStacks[assignedPosition]` ay may laman), hindi na
    ito ski-skip-in - humahanap ng BAGONG talagang-bakanteng posisyon sa
    halip (parehong pattern ng `relocateMasterIfBlocking`, pero
    "reverse" - dito ang SARILING lumang posisyon ang nabawi na ng
    ibang item, hindi ang IBANG item ang natatabunan).

- **(c) Bug: hindi tumutunog ang "raining.mp3" (rain ambience) kapag
  umuulan:**
  - **Sanhi:** RACE CONDITION sa `unlockAudio()`/`primeAudioElement()`
    (audio.js) - kung UMUULAN NA MISMO sa sandali ng unang user gesture,
    naga-"prime" pa rin (muted play → pause/reset) ang `rainAudio` KAHIT
    kaunting frame lang matapos noon, TALAGANG sinisimulan na rin ito
    nang totoo (unmuted) ng `updateAmbientAudio()` (dahil umuulan na) -
    pagkatapos noon, kapag natapos na ang muted-priming na promise
    (async), basta na lang PINA-PAUSE/RESET nito (nang tahimik, walang
    error) ang TUNAY na tumutugtog na audio - naiiwan ang
    `rainAudioPlaying` flag na parang "tumutunog pa rin", kaya hindi na
    ito uulit i-play() ng `updateAmbientAudio` hanggang tumigil-bumalik
    ang ulan.
  - **Ayos:** `primeAudioElement(audio, isActiveNow)` - bagong
    opsyonal na 2nd argument (function) - kapag totoo ito sa oras na
    matapos ang priming promise, hindi na ito pina-pause/rine-reset (i-
    unmute na lang, huwag guluhin ang tunay na tumutugtog). `unlockAudio()`
    - kung UMUULAN NA sa sandaling mag-unlock, DIREKTANG pinapatugtog na
    ang `rainAudio` nang totoo (`rainAudioPlaying = true;
    rainAudio.play()`), hindi na ito pina-prime - walang pagkakataong
    ma-race. Dinagdagan din ng parehong `isActiveNow` guard ang
    music/christmasMusic priming (dagdag na depensa, kahit hindi pa
    ito naabutan/na-trigger sa totoong bug report).

- **(d) Bug: bumabalik ang naputol na puno/bato pag-reload/paglabas-
  pasok ng bahay + bagong 15-minutong (GAME time) respawn, isa-isa:**
  - **Sanhi:** dating ang `respawnResourceNode()` (resources.js) ay
    AGAD/INSTANT na "inililipat" ang node papuntang bagong random na
    lokasyon SA SANDALING mismo ma-fully-harvest ito - PERO ang paglipat
    na iyon ay NASA MEMORY LANG (`resourceNodesCache`, hindi naka-save),
    at BINUBURA pa nito ang harvested-record ng LUMANG posisyon
    (`delete harvested[...]`). Dahil deterministic/seeded pa rin ang
    `generateResourceNodes()` at nabura na ang harvested-record,
    bumabalik ang puno/bato sa ORIHINAL nitong posisyon sa susunod na
    pag-load ng mundo (reload, o paglabas/pasok ng bahay - parehong
    tumatawag ng `ensureResourceNodes`/`generateResourceNodes` ulit) -
    parang "gumagaling"/hindi permanente ang pagkakaputol.
  - **Ayos - PERMANENTENG pagkawala:** TINANGGAL ang buong
    `respawnResourceNode()` (kasama ang tawag dito sa `registerHit`) -
    ang harvested-record (`harvestedResources`, naka-save na pala noon
    pa) na lang ang nag-iisang batayan, kaya PERMANENTENG nananatiling
    nakatago ang naani nang buo, kahit mag-reload/lumipat ng mundo.
  - **Ayos - bagong 15-minutong (GAME time) respawn, isa-isa:** sa
    halip na "ilipat" ang PAREHONG node, gumagawa na ngayon ng BAGONG
    "extra" na node (naka-save, `resourceExtraNodes`/
    `RESOURCE_EXTRA_NODES_SAVE_KEY`) sa bagong random na lokasyon -
    PERO hindi na ito instant: may bagong SCHEDULE kada mundo
    (`resourceRespawnSchedule`/`RESOURCE_RESPAWN_SCHEDULE_SAVE_KEY`,
    hiwalay ang `nextTreeAt`/`nextStoneAt`) na gumagamit ng
    `getGameNow()` (HINDI `Date.now()`, ayon sa convention ng project -
    tingnan ang bahagi 6 sa itaas) - kada `RESOURCE_RESPAWN_INTERVAL_MS`
    (15 minuto ng GAME time), SUSURIIN lang (hindi laging mag-spa-spawn)
    kung may "deficit" pa (mas kaunti sa `TREE_COUNT_PER_WORLD`/
    `STONE_COUNT_PER_WORLD` ang buhay na node) - kung meron, ISANG
    (isa lang) bagong node ang lalabas. Tinatawag ito kada frame
    (`updateResourceRespawns`, update.js) gamit ang isang WHILE loop
    (may safety cap) sa halip na IF - kaya kung "tumalon" nang malayo
    ang game time (natulog nang matagal - `advanceGameTime`), maaabutan
    pa rin ang lahat ng lumipas na 15-minutong tick sa isang beses
    (posibleng maramihang node ang lumabas kung matagal natulog),
    hindi lang isa.
  - **Naka-merge sa `generateResourceNodes()`:** ang mga "extra" na node
    ay isinasama na sa dulo ng listahan ng trees/stones (pagkatapos ng
    seeded na base) - kaya AUTOMATIC na silang nasasama sa parehong
    collision-adding (`ensureResourceNodes`) at drawing
    (`getResourceDrawables`) na landas - walang binago doon.
  - **Para i-adjust:** tagal ng respawn interval →
    `RESOURCE_RESPAWN_INTERVAL_MS` (resources.js, kasalukuyang 15
    minuto). Target na dami kada mundo → `TREE_COUNT_PER_WORLD`/
    `STONE_COUNT_PER_WORLD` (parehong dati nang constant, ginamit na
    lang ulit bilang "deficit" na batayan).

### (44) Bagong mundo "town" (bayan) - inaabot sa pamamagitan ng "gate" na 2 puno sa itaas ng newmap + fix ng "lumb" -> "lamb" na layer name
- **Files:** `js/worlds.js`, `js/decor.js`, `js/map.js`,
  `assets/map/town.tmj`

- **(a) Naitala na sa `WORLDS`/`DOORS` ang bagong "town" na mundo:**
  - Bagong entry sa `WORLDS` (worlds.js) - `town: { url:
    "./assets/map/town.tmj", outdoor: true, spawn: { x: 560, y: 580 }
    }` - kaparehong pattern ng "newmap"/"village" (may panahon, snow/
    rain, atbp. - awtomatiko dahil "outdoor: true").
  - Dalawang BAGONG pintuan sa `DOORS` (worlds.js), parehong
    E-to-use (kaparehong gawi ng bahay - PINDUTIN ang E, hindi
    awtomatikong "nadadaanan"):
    - `newmap` → `town`: `area: { x: 528, y: 16, width: 64, height:
      32 }` (sa pagitan ng 2 gate tree, itaas/likod ng newmap),
      lalabas sa `{ x: 560, y: 580 }` (malapit sa ilalim ng town.tmj).
    - `town` → `newmap`: `area: { x: 544, y: 604, width: 32, height:
      24 }` (malapit sa ilalim ng town.tmj), lalabas sa `{ x: 552, y:
      72 }` (kaunting hakbang PABABA mula sa gate mismo sa newmap,
      para hindi agad "arrivedAtDoor" - tingnan ang paliwanag ng flag
      na iyon sa itaas ng worlds.js).
  - **Para i-adjust ang eksaktong posisyon:** baguhin ang `area`/
    `spawn` ng dalawang DOORS entry na ito, ITUGMA rin ang
    `TOWN_GATE_TREE_COL_LEFT`/`_RIGHT`/`_ROW` (decor.js) kung
    ililipat ang gate sa ibang bahagi ng newmap.

- **(b) Bagong "gate" - 2 FIXED (hindi random) na dekorasyong puno sa
  itaas/likod ng newmap (`js/decor.js`):**
  - **Sanhi ng disenyo:** ang mga puno sa newmap ay RANDOM/seeded
    (`resources.js`, generateResourceNodes) - hindi laging pareho ang
    pinaka-eksaktong hugis ng "2 puno" na tinutukoy ng user kada
    sesyon. Sa halip, gumawa ng bagong, LANDMARK na 2 puno na FIXED
    ang posisyon (`TOWN_GATE_TREE_COL_LEFT = 32`,
    `TOWN_GATE_TREE_COL_RIGHT = 37`, `TOWN_GATE_TREE_ROW = 2`) -
    laging naririyan, laging pareho ang itsura, at bukas ang
    pagitan nila (4 tiles) bilang "daanan" patungo sa DOORS area sa
    itaas.
  - Ginamit ang PAREHONG `drawTreeSprite`/`TREE_VARIANT_PATHS`
    (resources.js) sa pagguhit (`getTownGateTreeDrawables`) - kaya
    magkatulad ang itsura ng mga ito sa normal na random na puno,
    pero HINDI sila "choppable" (wala silang entry sa
    `resourceNodesCache`, kaya walang axe interaction/harvest).
  - May sariling collision box ang bawat isa
    (`getTownGateTreeCollisionBoxes`, 1 tile bawat puno) - idinaragdag
    sa `collisions` sa loob ng `loadWorld` (map.js), kasunod ng
    `buildHouseWallCollisions` - guarded ng `typeof` (baka hindi pa
    naka-load ang decor.js sa unang ilang frame, bihira lang
    talaga mangyari dahil async ang buong `loadWorld`).
  - Parehong naka-hook din sa PAGGUHIT (dalawang branch ng Y-sort sa
    map.js - may overlap layers man o wala, tingnan ang
    `getTownGateTreeDrawables` na tawag sa parehong lugar ng
    `getBackdropOakDrawables`).
  - **Guard:** parehong function ay `currentWorld !== "newmap"` ang
    unang check - kaya WALANG epekto sa ibang mundo (kasama na ang
    "town" mismo).
  - **Para i-adjust:** posisyon → `TOWN_GATE_TREE_COL_LEFT`/`_RIGHT`/
    `_ROW` (decor.js, ITUGMA rin ang DOORS `area` sa worlds.js kung
    babaguhin). Kung sa IBANG mundo ilalagay ang gate balang araw,
    baguhin ang `TOWN_GATE_WORLD` (decor.js).

- **(e) Naayos: hindi makita/hindi makilala ang gate (natatabunan ng
  napakaraming random na puno sa paligid):**
  - **Sanhi:** ang mga random na puno (resources.js,
    `TREE_COUNT_PER_WORLD = 50`) ay hindi alam na may 2 FIXED na
    "landmark" na puno sa may itaas ng newmap - basta na lang sila
    puwedeng mag-spawn KAHIT DIKIT/PALIBOT sa 2 gate tree, kaya
    natatabunan/nalulunod ang mga ito sa dami ng normal/magkakatulad na
    puno sa paligid - hindi na makilalang "2 espesyal na puno" ang
    laman ng gate, kahit TALAGANG naka-render na ito (report ng user:
    "di ko makita e binawasan ko muna yung oak tree" - hindi rin
    nakatulong ang pagbawas ng OAK dahil IBANG sistema ang oak
    (decor.js) kaysa sa random na puno na ito, resources.js).
  - **Ayos - bagong `isInsideTownGateClearing(col, row)`
    (resources.js):** kung nasa loob ng isang PADDED na "clearing"
    (10 columns x 7 rows, mas malaki kaysa sa eksaktong gate mismo)
    sa paligid ng gate ang isang tile, TINATANGGIHAN na ngayon ito bilang
    posisyon ng BAGONG random na puno/bato - kapwa sa `isValidTile`
    (unang seeded generation) AT `findValidRelocationSpot` (ginagamit
    ng 15-minutong respawn system, item 43 sa itaas) - kaya laging
    malinis/bukas ang paligid ng gate, TALAGANG namumukod-tangi ang 2
    landmark na puno.
  - Dinagdagan din ng kaunti ang laki ng gate trees mismo
    (`destWidthInTiles` mula 2 → 2.6 sa `getTownGateTreeDrawables`,
    decor.js) - para mas mukhang sadyang mas malaki/importante sila
    kumpara sa normal na puno.
  - **TANDAAN (side-effect):** dahil SEEDED/sequential ang random na
    algorithm ng puno/bato (isang PRNG value kada "attempt", tama man
    o mali) - ANUMANG pagbabago sa `isValidTile` (kasama na itong
    bagong exclusion zone, at ang mga bagong DOORS na naidagdag na rin
    dati) ay nagpapa-"shuffle" sa POSISYON ng LAHAT ng random na puno/
    bato sa buong newmap, hindi lang sa malapit sa gate - normal/
    dating nangyari na rin ito noong una munang naidagdag ang mga
    bagong DOORS (kasama na ang mismong gate door). Hindi ito
    "sira"/panganib sa save data (ligtas pa ring gagana ang mga LUMANG
    `harvestedResources` na entry, "patay" na lang sila kung wala nang
    puno doon sa BAGONG layout), pero puwedeng mapansin ng user na
    "nagbago" ang buong porma ng gubat pagkatapos ng update na ito.
  - **Para i-adjust:** laki ng clearing → ang `padding` variable sa
    loob ng `isInsideTownGateClearing` (resources.js, kasalukuyang 2
    tiles sa magkabila/itaas, 4 sa ibaba).

- **(c) ALERTO: kulang ang tileset ng town.tmj:**
  - Itinuro na ang `"source"` ng tileset sa `town.tmj` papuntang
    `assets/map/tilesets/town.tsj` (dating sirang path papuntang
    personal na Tiled folder ng dating developer - kaparehong klase ng
    bug ng `Tiles.tsx` dati, tingnan ang bahagi 7 item 5 sa itaas) -
    PERO ang aktwal na `town.tsj` (kasama ang PNG na tinuturo nito) ay
    HINDI PA kasama sa proyekto - kailangan pang i-upload ito sa
    `assets/map/tilesets/` (parehong lokasyon ng ibang `.tsj`/`.tsx`
    dito). Hangga't wala pa ito: gagana ang mundo (mararating,
    may collision), PERO BLANGKO ang itsura (walang makikitang
    grass/lamb/trees na larawan) - ligtas namang mabibigo lang ito
    (`fetchTileset`/`loadTilesetImage`, map.js - naka-try/catch,
    walang crash).

- **(d) Fix: "lumb" → "lamb" na typo sa layer name (`town.tmj`):**
  - Dating `"name":"lumb"` ang isang tilelayer sa `town.tmj` (id 2) -
    pinalitan na ng `"name":"lamb"`. Data-level lang ang pagbabagong
    ito (JSON edit, walang binagong JS) - basta't walang JS code na
    tumutukoy dito gamit ang lumang pangalan (wala namang natagpuan),
    walang ibang epekto.

### (45) Gate patungong "town": tinanggal ang 2 puno, pinalitan ng madilim na patse sa lupa + inilipat MALAPIT sa bahay (dating napakalayo)
- **Files:** `js/decor.js`, `js/map.js`, `js/draw.js`, `js/resources.js`,
  `js/worlds.js`

- **Sanhi/dating problema (item 44 sa itaas):** dalawang bagay ang mali
  sa unang bersyon ng gate: (1) sobrang layo ito sa bahay (halos
  itaas mismo ng buong 40-row na mapa, `TOWN_GATE_TREE_ROW = 2`) -
  matagal at mahirap abutin; (2) kahit narating na, ang 2 "landmark"
  na puno doon ay HINDI pa rin kitang-kita/nakikilala - nalulunod sila
  sa dami ng normal/random na puno sa paligid (kahit may "clearing" na
  idinagdag noon - item 44(e) - hindi pa rin sapat ayon sa follow-up
  screenshot ng user).
- **Ayos - TINANGGAL ang buong "2 puno" na konsepto:** wala nang
  `TOWN_GATE_TREE_*`/`getTownGateTreeDrawables`/
  `getTownGateTreeCollisionBoxes` (decor.js) - hindi na kailangan ng
  puno bilang marker ayon sa bagong hiling ("kahit wala ng puno").
- **Bagong marker - "madilim na patse" (dark ground patch):** bagong
  `TOWN_GATE_PATCH_COL_START/_END`/`_ROW_START/_END` (decor.js,
  kasalukuyan: cols 15-19, rows 7-9 - 5×3 tiles) - iginuguhit ito ng
  bagong `drawTownGatePatch()` bilang GROUND DECAL (radial gradient,
  itim, malabo ang gilid - parang anino/bukana ng kuweba) - SA IBABAW
  ng normal na lupa/damo, PERO SA ILALIM ng puno/player (walang
  Y-sort, laging "flat" sa lupa - kaparehong lugar/timing ng
  `drawFootprints()` sa `draw.js`, tinawag kasunod nito). Walang
  collision na idinagdag dito (hindi tulad ng dating 2 puno na may
  collision box) - basta bukas/madaanan ang buong lugar, ang patse ay
  VISUAL LANG na marker.
- **Bagong posisyon - MALAPIT NA sa bahay** (dating halos itaas mismo
  ng buong mapa): `TOWN_GATE_PATCH_COL_START = 15`/`_ROW_START = 7`
  (pixel x:240,y:112) - ilang tiles lang sa itaas ng bahay cluster
  (nagsisimula sa mismong y:196) - VERIFIED (kinwenta mula sa
  Collisions objects ng newmap.tmj) na walang overlap.
- **`DOORS` (worlds.js)** - in-update ang `area` ng newmap→town door
  papunta sa parehong lugar ng bagong patse (`{ x: 240, y: 112,
  width: 80, height: 48 }`), at ang `spawn` ng town→newmap door
  papuntang `{ x: 272, y: 168 }` (ilang piksel PABABA mula sa patse,
  bago pa man ang collision ng bahay - VERIFIED walang overlap laban
  sa `getPlayerCollisionBox` offset).
- **`isInsideTownGateClearing()` (resources.js)** - in-update para
  sumunod sa BAGONG `TOWN_GATE_PATCH_*` (dating `TOWN_GATE_TREE_*`) -
  parehong function pa rin, parehong dahilan (walang random na
  puno/bato ang puwedeng mag-spawn sa loob ng patse + 2-tile na
  padding sa paligid nito), pareho ring ginagamit ng
  `isValidTile`/`findValidRelocationSpot` (15-minutong respawn
  system, item 43).
- **Para i-adjust:** posisyon/laki ng patse →
  `TOWN_GATE_PATCH_COL_START/_END`/`_ROW_START/_END` (decor.js,
  ITUGMA rin ang `DOORS` `area`/`spawn` sa worlds.js kung babaguhin).
  Itsura ng patse (kulay/pagkamadilim/lambot ng gilid) → ang mga
  `rgba(...)` na `addColorStop` sa loob ng `drawTownGatePatch()`.

### (46) Gate patungong "town": inilipat DIKIT sa spawn point (dating malapit lang sa bahay, hindi pa rin nakita) + bagong AUTO-WALK na pintuan (hindi na kailangan pindutin ang E) + mas kitang-kitang itsura
- **Files:** `js/decor.js`, `js/worlds.js`, `js/update.js`, `js/resources.js`

- **(a) Ikatlong pagkakataon na inaayos ang POSISYON:** item 44 - 2
  puno, halos itaas mismo ng buong mapa (masyadong layo). Item 45 -
  madilim na patse, pero row 7-9 lang (malapit sa BAHAY, hindi sa
  literal na "taas ng mapa") - hindi pa rin nakita ng user. Bagong
  posisyon: `TOWN_GATE_PATCH_COL_START = 24`/`_ROW_START = 14` (dating
  15/7) - DIKIT na mismo sa `newmap.spawn` (worlds.js,
  `{x:400,y:300}`) - 2-4 tiles lang ang layo, literal na makikita
  agad pagbukas ng laro.
- **(b) BAGONG uri ng pintuan - "auto" (hindi na E-to-use):** bagong
  hiling ng user: "gusto ko dadaanan ko lang tapos lilipat ako sa
  town" - hindi na dapat kailanganin pang pindutin ang E, kagaya ng
  ibang pintuan (bahay). Bagong `auto: true` na field sa DOORS entry
  (worlds.js) - dalawang direksyon (newmap→town AT town→newmap).
  `js/update.js` - bagong check (BAGO ang normal na E-key check, pero
  parehong function/protection lang ang ginamit -
  `getUsableDoor()`/`arrivedAtDoor`): kung `auto: true` ang nakuhang
  door mula sa `getUsableDoor()`, AGAD na tumatawag ng `loadWorld(...)`
  nang HINDI hinihintay ang `eKeyDown` - awtomatiko pa ring
  protektado laban sa infinite-loop/paulit-ulit na pagpalit ng mundo
  dahil PAREHONG batayan (`arrivedAtDoor` flag) ang ginagamit,
  kaparehong-pareho ng E-door.
  - **Tandaan:** ang mga LUMANG pintuan (bahay, houseInside "Lumabas")
    ay HINDI ginalaw - wala silang `auto` field (`undefined`, hindi
    `true`), kaya normal pa rin silang E-to-use.
  - **Para gawing E-to-use ulit ang gate:** alisin na lang ang
    `auto: true` sa parehong DOORS entry (worlds.js).
- **(c) Mas kitang-kitang itsura ng patse (`drawTownGatePatch`,
  decor.js):** dating radial gradient LANG (mabilis kumupas, halos
  transparent na sa 70% pababa) - MASYADONG SUBTLE. Ngayon: (1) SOLID
  na dark `fillRect` muna sa buong parihaba (hindi lang gradient), (2)
  bahagyang blur sa paligid (`ctx.filter`) para hindi biglaang
  kuwadrado, (3) bagong KUMIKISLAP (pulsing, `Math.sin(performance.now())`)
  na dashed na border - parang "portal", mas madaling mapansin ng mata
  sa gitna ng gubat.
- **(d) Dinagdagan ang exclusion padding ng random na puno/bato**
  (`isInsideTownGateClearing`, resources.js) mula 2 → 4 tiles - mas
  malaking clearing sa paligid ng patse, para hindi ito matakpan ng
  canopy ng kalapit na puno.
- **VERIFIED (walang collision conflict):** ang bagong `area`
  (`{x:384,y:224,width:64,height:48}`) ay HINDI nag-o-overlap sa
  alinmang existing Collisions object sa `newmap.tmj` (parehong
  cluster ng bahay ay nasa `x:163-307` range, malayo sa bagong
  `x:384-448`), at HINDI rin ito masyadong malapit sa spawn mismo
  (`{x:400,y:300}` → collision box y:312-322, samantalang ang gate ay
  y:224-272 - may 40px na puwang, kaya hindi agad-agad na na-trigger
  sa unang frame pa lang).
- **Para i-adjust:** posisyon → `TOWN_GATE_PATCH_*` (decor.js, ITUGMA
  rin ang `DOORS` `area` sa worlds.js). I-on/off ang auto-walk →
  `auto: true` sa DOORS entry (worlds.js).

### (47) Gate patungong "town": natuklasang sanhi ng "hindi pa rin makita" - 500 damong TUFT (grass.js) na natatakip sa patse + inilipat KATABI MISMO NG BAHAY
- **Files:** `js/decor.js`, `js/worlds.js`, `js/grass.js`

- **Natuklasang SANHI (bakit hindi pa rin nakita kahit 2 beses nang
  inayos ang posisyon, item 44-46):** may bagong nalamang sistema -
  `GRASS_TUFT_COUNT_PER_WORLD = 500` (grass.js) - 500 damong tuft
  kada mundo, Y-SORTED na OBJECT (iginuguhit sa `drawMapObjects()`,
  KASAMA sa Y-sort laban sa player/puno), hindi tulad ng madilim na
  patse (ground DECAL, walang Y-sort, iginuguhit MAS MAAGA). Ibig
  sabihin: ANUMANG grass tuft na mag-spawn SA LOOB ng patse ay
  IGINUGUHIT SA IBABAW nito - natatakpan/nakakatago ang buong patse
  sa ilalim ng mga tuft sprite. Ang unang exclusion zone
  (`isInsideTownGateClearing`, item 45) ay para lang sa RANDOM na
  puno/bato (resources.js) - HINDI ito nalapat sa grass tufts, kaya
  patuloy pa ring may mga tuft na tumutubo sa loob ng patse.
- **Ayos:** `js/grass.js` (`generateGrassTufts` → `isValidTile`) -
  dinagdagan ng parehong `isInsideTownGateClearing(col, row)` check
  (function na nasa resources.js, `typeof` guard) - kaya hindi na rin
  tumutubo ang damong tuft sa loob ng clearing ng gate.
- **BAGONG posisyon - KATABI MISMO NG BAHAY** (ikatlong beses nang
  inililipat - tingnan ang buong kasaysayan sa item 44/45/46):
  `TOWN_GATE_PATCH_COL_START = 20`/`_ROW_START = 13` (dating 24/14) -
  sa KANANG GILID ng malaking bahay sa newmap (ang bahay na collision
  cluster ay `x:224-297` (max), ang bagong patse ay `x:320-384` - may
  23px na ligtas na puwang sa pagitan). VERIFIED walang overlap sa
  alinmang existing collision object.
- **`DOORS` (worlds.js)** - in-update ang `area` (newmap→town,
  `{x:320,y:208,width:64,height:48}`, ITUGMA sa laki ng patse) at ang
  `spawn` (town→newmap, `{x:352,y:250}` - ilang piksel PABABA mula sa
  patse, VERIFIED walang overlap sa house collision).
- **Para i-adjust:** posisyon → `TOWN_GATE_PATCH_*` (decor.js, ITUGMA
  rin ang `DOORS` `area`/`spawn` sa worlds.js). Kung may IBA PANG
  Y-sorted na "clutter" system balang araw (bago pang decor/random
  spawn) na puwedeng tumakip sa patse, TANDAAN na dagdagan din ng
  parehong `isInsideTownGateClearing` check ang `isValidTile` nito
  (kaparehong pattern ng resources.js/grass.js).

### (48) Gate patungong "town": inilipat sa TAMANG bahay (VERIFIED gamit ang screenshot) - katabi ng bahay na may TUNAY/kilalang "Pumasok" na pinto
- **Files:** `js/decor.js`, `js/worlds.js`

- **Natuklasang SANHI (bakit hindi pa rin nakita kahit naayos na ang
  grass tuft occlusion, item 47):** may 2 bahay sa newmap - ang
  "malaking bahay" (walang gumaganang pinto, `x:224-297` (max) na
  collision cluster) at ang bahay na may TUNAY na "Pumasok" na pinto
  (`x:163-229` (max), area `{x:179,y:420,width:26,height:44}` sa
  DOORS). Ang IKAAPAT na posisyon (item 47) ay katabi ng MALAKING
  bahay - PERO base sa screenshot na ipinadala ng user (naka-mark ang
  eksaktong gustong lokasyon gamit ang red circle), IBANG bahay pala
  (yung may pinto) ang aktwal niyang tinitingnan/nirereach - kaya
  walang laman ang lugar na kanyang kinatatayuan.
- **Ayos:** BAGONG posisyon, `TOWN_GATE_PATCH_COL_START = 15`/
  `_ROW_START = 24` - direktang KATABI (kanang gilid) ng bahay na may
  TUNAY/kilalang pinto (ang unang DOORS entry, `area: {x:179,y:420,
  width:26,height:44}`) - hindi na basta tantiya/estimate mula sa
  screenshot, ITO na ang GARANTISADONG kilalang bahay dahil
  gumagana/verified na ang interaction nito.
- **`DOORS` (worlds.js)** - in-update: `area` (newmap→town,
  `{x:240,y:384,width:64,height:48}`, VERIFIED walang overlap sa
  parehong "Pumasok" na door area AT sa mga wall collision ng bahay -
  `240 > 229` (max x ng wall collisions)), `spawn` (town→newmap,
  `{x:300,y:448}` - ilang hakbang PAKANAN mula sa "Pumasok" na pinto,
  para hindi magkalito ang 2 magkaibang pintuan).
- **TANDAAN kung babaguhin pa ulit ang posisyon balang araw:** GAMITIN
  ang mga KILALANG anchor point (tulad ng `DOORS` area ng bahay na
  may TUNAY na interaction) sa halip na basta tantiyahin mula sa
  screenshot - mas maaasahan/tiyak ito.
- **Para i-adjust:** posisyon → `TOWN_GATE_PATCH_*` (decor.js, ITUGMA
  rin ang `DOORS` `area`/`spawn` sa worlds.js).

### (49) Gate patungong "town": bagong BLACKHOLE na asset (in-upload ng user) sa halip na madilim na patse, bumalik sa TAAS-GITNA (top-center) ng buong mapa
- **Files:** `js/decor.js`, `js/worlds.js`, `js/resources.js`,
  `assets/objects/blackhole-sheet.png` (bago, in-upload ng user)

- **Bagong asset:** `blackhole-sheet.png` (VERIFIED sa Python/Pillow:
  1045×177px, 6 magkakasunod na frame ng umiikot na blackhole/
  singularity, horizontal strip) - in-upload mismo ng user bilang
  panibagong itsura ng gate (sa halip na basta madilim na patse -
  tingnan ang buong kasaysayan sa CLAUDE.md entry 44-48).
- **Bagong posisyon: TAAS-GITNA (top-center) ng BUONG MAPA** - LITERAL
  na ngayon ang ibig sabihin, hindi na basta tantiya: bagong
  `getTownGateBlackholeCenter()` (decor.js) - `x = (mapData.width / 2)
  * TILE_SIZE` (GITNA MISMO ng lapad ng mapa, awtomatikong tama kahit
  anong laki pa ng mapa - hindi na hardcoded na column), `y` batay sa
  `TOWN_GATE_BLACKHOLE_ROW = 3` (malapit sa itaas na gilid).
  `getTownGatePatchBox()` - kinukwenta na LANG mula rito (function-
  based, hindi na FIXED na column/row constants - tingnan ang
  "Tandaan" sa ibaba).
- **Animation (`drawTownGatePatch`, decor.js):** kaparehong pattern ng
  `getStoveAnimFrameIndex` (stove.js) - `frameWidth = img.naturalWidth
  / TOWN_GATE_BLACKHOLE_FRAME_COUNT` (6), umiikot bawat
  `TOWN_GATE_BLACKHOLE_FRAME_MS` (120ms) gamit ang `performance.now()`.
  Iginuguhit pa rin bilang GROUND DECAL (parehong lugar/timing sa
  draw.js, walang Y-sort) - kaya nakatapak/nakadaan pa rin ang player
  sa ibabaw nito.
- **`DOORS` (worlds.js)** - in-update ang `area` (newmap→town,
  `{x:528,y:24,width:64,height:64}`, ITUGMA sa `getTownGatePatchBox()`)
  at ang `spawn` (town→newmap, `{x:560,y:112}` - ilang piksel PABABA
  mula sa blackhole, malayo sa DOWNS ibang collision - LIBRE ang buong
  itaas na bahagi ng newmap, walang existing Collisions object doon).
- **TANDAAN (breaking change sa exclusion helper):** dahil FUNCTION-
  BASED na ngayon (hindi na FIXED constants) ang posisyon,
  `isInsideTownGateClearing()` (resources.js) ay IN-UPDATE din -
  tumatawag na ngayon ng `getTownGatePatchBox()` (decor.js) at
  gumagamit ng PIXEL-based na `isColliding()` check (may 4-tile na
  padding sa paligid, pixel form) sa halip na column/row comparison -
  PAREHONG ginagamit pa rin ng `resources.js` (random na puno/bato)
  AT `grass.js` (damong tuft).
- **Para i-adjust:** posisyon ng row → `TOWN_GATE_BLACKHOLE_ROW`
  (decor.js, awtomatiko namang naka-center na sa column). Laki →
  `TOWN_GATE_BLACKHOLE_SIZE`. Bilis ng ikot → `TOWN_GATE_BLACKHOLE_
  FRAME_MS`. ITUGMA rin ang `DOORS` `area`/`spawn` (worlds.js) kung
  babaguhin ang `TOWN_GATE_BLACKHOLE_ROW`/`_SIZE`.

### (50) Gate patungong "town": bagong COMPASS ARROW na palaging nakikita, tuturo saan man patungo sa gate
- **Files:** `js/decor.js`, `js/draw.js`

- **Konteksto:** kahit na tama na ang posisyon (top-center ng mapa,
  item 49) at may tekstong direksyon na naibigay, paulit-ulit pa ring
  hindi mahanap ng user ang gate sa loob ng open-world na mapa (walang
  paraan para ma-verify ang eksaktong posisyon ng player nang real-
  time gamit ang screenshot lang). Sa halip na ipagpatuloy ang
  "tantiya-hulaan" na approach, bagong PALAGING NAKIKITANG UI element
  na ang idinagdag - hindi na kailangang mag-isip/tumantiya pa.
- **Bagong `drawTownGateCompass()` (decor.js):** SCREEN-SPACE na arrow
  (hindi apektado ng camera zoom/pan, tinatawag sa PINAKA-HULI ng
  `draw()` - draw.js, kaparehong lugar ng `drawDoorPrompt()`) - kada
  frame, kinukwenta ang ANGLE mula sa TALAGANG posisyon ng player
  patungong `getTownGateBlackholeCenter()` (item 49), tapos iginuguhit
  ang isang triangle/arrow sa gilid ng bilog na "compass" (radius =
  kalahati ng mas maliit sa canvas width/height, minus 56px na margin)
  - laging nakaturo ang dulo nito papunta sa TUNAY na direksyon ng
  gate, may label na "N tiles" (distansya, naka-round sa buong tile).
- **Awtomatikong nawawala kapag kitang-kita na ang gate mismo:**
  `gateVisible` check - kinukumpara ang world-position ng gate laban
  sa TALAGANG kasalukuyang viewport (`camera.x/y` + `canvas.width/
  height / camera.zoom`, may 32px na margin) - kung nasa loob na ng
  screen ang gate, itinatago na ang compass (hindi na kailangan,
  makikita na mismo ito).
- **Guard:** `currentWorld !== TOWN_GATE_WORLD` (parehong "newmap"
  lang) - walang epekto sa ibang mundo.
- **Para i-adjust:** margin bago ituring na "visible" ang gate →
  `TOWN_GATE_COMPASS_VIEWPORT_MARGIN` (decor.js). Kulay/laki ng arrow →
  ang `fillStyle`/`moveTo`/`lineTo` na numero sa loob ng
  `drawTownGateCompass()`.

### (51) Buong update ng `town.tmj` - bagong layer names (`lamps`/`door`), ilaw ng pinto/bintana/parol, at ayos ng "map behind character, character behind lamps"
- **Files:** `assets/map/town.tmj`, `assets/map/tilesets/lamps.tsj` (bago),
  `js/map.js`, `js/atmosphere.js`, `js/draw.js`
- **Konteksto:** in-upload ng user ang bagong `town.tmj` (mula sa Tiled) -
  binago ang buong istruktura ng layer: `map` (buong larawan ng
  bayan), `lamps` (PINAGSAMANG layer na ngayon - dating hiwalay na
  `lumb`/`lambs`), `door` (BAGO), `windows`, `Collisions`. Tinanggal na
  ang dating hiwalay na `grass`/`trees` na tile layer (hindi na
  kailangan - `noTrees`/`noStones`/`noGrassTufts`/`noPigs`/`noOaks` na
  rin ang `town` sa `worlds.js`, walang epekto ang pagkatanggal).
- **(a) SIRANG tileset path (SILENT na sanhi ng "walang lumalabas na
  mapa"):** kagaya mismo ng bug na (5) sa itaas (Tiles.tsx), muling
  na-save ng Tiled ang `town.tmj` gamit ang ABSOLUTE-ish na path mula
  sa personal na Tiled project ng user
  (`../../../../Tiled/File/town.tsj` at `.../lamps.tsj`) - hindi ito
  maaabot ng browser. Dahil DALAWANG beses pa itong lumalabas sa
  listahan ng tilesets (`firstgid: 1` AT `firstgid: 6046`, parehong
  `town.tsj` - mukhang duplicate/stale entry sa Tiled mismo, pero hindi
  ginagamit ang unang isa ng kahit anong layer, kaya walang epekto),
  in-ayos ang LAHAT ng `source` papuntang lokal na `tilesets/town.tsj`
  (VERIFIED na, tumutugma sa `town.png`) - tingnan din ang
  `fetchTileset()`/`loadTilesets()` sa `map.js`: walang fallback ang
  FETCH ng `.tsj/.tsx` mismo (hindi tulad ng larawan nito,
  `loadTilesetImage()`, na may fallback sa parehong filename), kaya
  FATAL/SILENT na nabibigo ang buong tileset kapag sira ang `source`.
  In-ayos din ang `lamb2.tsj`/`lamb3.tsj`/`lamb4.tsj` (parehong sirang
  path, pero hindi naman ginagamit ng kahit anong layer - walang
  epekto sa laro, linisan lang).
- **(b) Bagong `assets/map/tilesets/lamps.tsj`:** wala pang `.tsj` na
  file para sa bagong `lamps.png` (200x60px) - ginawa ito
  (VERIFIED sa pamamagitan ng script na nag-re-render ng buong layer
  gamit ang parehong grid, kinumpara sa aktwal na larawan ng 4 parol):
  `columns: 12`, `tilewidth`/`tileheight: 16`, `tilecount: 36` (12x3
  grid sa loob ng 200x60 na larawan - may sobrang 8px/12px na walang
  laman sa gilid/ibaba, hindi ginagamit, normal lang).
- **(c) `getLampLightPoints()` (map.js):** pinalitan mula `"lumb"`
  papuntang `"lamps"` na layer name. TINANGGAL ang dating "signboard
  filter" (`widthPx > TILE_SIZE * 2` = i-skip) - VERIFIED (script) na
  ang 4 parol sa bagong `lamps` layer ay 2-3 tile ang lapad bawat isa
  (walang signboard/noticeboard na kasama ngayon) - kung nanatili ang
  filter, MATATANGGAL ang 2 sa 4 na parol sa glow computation (dahil
  3-tile ang lapad ng dalawa sa kanila, higit sa dating 2-tile na
  limitasyon).
- **(d) Bagong `getDoorLayerLightPoints()` (map.js):** kaparehong-
  pareho ng `getWindowLayerLightPoints()` - isang punto kada tile sa
  `"door"` layer, walang clustering (hindi tulad ng lamps).
- **(e) Bagong `drawTownDoorLights()` (atmosphere.js):** kaparehong-
  pareho ng `drawTownWindowLights()` - warm glow (parehong kulay/radius
  ng window light) sa bawat punto mula sa `getDoorLayerLightPoints()`,
  KAPAG GABI LANG. Tinawag sa `draw.js` kasunod ng
  `drawTownWindowLights()`.
- **(f) "map behind the character, character behind the lamps" (hiling
  ng user):**
  - `drawMapBackground()` (map.js) - ang `"map"` layer (buong larawan
    ng bayan) ay direktang FLAT BACKGROUND (hindi overlap, hindi
    `"windows"/"door"/"lamps"`), kaya laging nasa LIKOD ng player
    (`drawMapBackground()` tinatawag BAGO ang `drawMapObjects()` sa
    `draw.js`).
  - `"windows"` at `"door"` - VERIFIED (script) na PAREHONG-PAREHONG
    gid ito ng `"map"` layer sa parehong (col,row) - ibig sabihin,
    hindi "ibang art" ang mga ito, KOPYA lang ng art na nasa `map.js`
    na rin (ginagamit lang bilang MARKER kung saan dapat maglagay ng
    glow) - kaya walang epekto sa itsura kahit palagi itong i-draw,
    pero sinusunod pa rin ang dating gawi ng `"windows"` (gabi lang
    idinadagdag) para tumugma sa `getNightAmount()` na batayan ng glow.
  - `drawLambsForeground()` PINALITAN ng pangalan/laman -
    `drawTownLampsForeground()` ngayon, gumagamit ng `"lamps"` layer
    (dating `"lambs"`), tinatawag pa rin sa `draw.js` PAGKATAPOS ng
    `drawMapObjects()` (kung saan iginuguhit ang player) - kaya laging
    NASA HARAP ng character ang parol.
  - `OVERLAP_LAYER_NAMES` (map.js) - hindi kasama ang `"lamps"` (hindi
    Y-sort/dynamic, laging foreground na lang - tingnan sa itaas).
- **Cache-bust:** binump ang `?v=` ng `map.js`/`atmosphere.js`/`draw.js`
  sa `index.html` papuntang bagong timestamp, para awtomatikong
  ma-refresh ng browser ang mga file na ito.
- **Para i-adjust:** kulay/radius ng ilaw ng pinto →
  `WINDOW_LIGHT_COLOR`/`WINDOW_LIGHT_RADIUS` (atmosphere.js, PAREHO pa
  rin ito ng bintana - hindi pa hiwalay). Kulay/radius ng parol →
  `TOWN_LAMP_LIGHT_COLOR`/`TOWN_LAMP_LIGHT_RADIUS` (atmosphere.js).

### (52) "Snow" na bersyon ng `town` - bagong `snowtown.tmj`/`snowtown.png` (in-upload ng user), pinili sa pagitan ng dalawa base sa `isSnowWeather()` + ibinalik ang `snow`/`sunny` sa weather calendar
- **Files:** `assets/map/snowtown.tmj`, `assets/map/tilesets/snowtown.tsj` (bago),
  `assets/map/tilesets/snowlamps.tsj` (bago), `assets/map/snowlamps.png` (bago,
  placeholder), `js/worlds.js`, `js/map.js`, `js/calendar.js`, `index.html`
- **Konteksto:** in-upload ng user ang `snowtown.tmj`/`snowtown.png` (kaparehong
  Tiled export ng `town.tmj`/`town.png`, tingnan entry 51) at hiniling na
  gawin ang parehong collisions/doors/windows/lamp-light + z-order
  ("map behind character, character behind lamps") para dito.
- **(a) Parehong sirang tileset path (kapareho mismo ng bug (a) sa entry 51):**
  `snowtown.tmj` (mula sa personal na Tiled project ng user) ay nakaturo sa
  `../../../../Tiled/File/snowtown.tsj`/`snowlamps.tsj` - hindi maaabot ng
  browser. In-ayos papuntang lokal na `tilesets/snowtown.tsj`/
  `tilesets/snowlamps.tsj` (bago, kaparehong hugis ng `tilesets/town.tsj`/
  `tilesets/lamps.tsj`).
- **(b) Layer names - PINALITAN papuntang KAPAREHONG pangalan ng `town.tmj`
  (`map`/`lamps`/`door`/`windows`/`Collisions`)**, mula sa orihinal na
  `map`/`snowlamps`/`doors`/`windows`/`Collissions` (may typo pa - dobleng
  "s"). Dahil dito, **ZERO na dagdag na code** ang kinailangan sa
  `getLampLightPoints`/`getDoorLayerLightPoints`/`getWindowLayerLightPoints`/
  `drawTownLampsForeground`/`drawMapBackground` (map.js) o sa
  `drawTownLamps`/`drawTownDoorLights`/`drawTownWindowLights` (atmosphere.js)
  - lahat ng iyon ay HINDI naka-hardcode sa pangalan ng mundo ("town"), basta
  tumutugma lang ang PANGALAN NG LAYER - kaya awtomatikong gumana ang parehong
  ilaw/z-order (`map` bottom → character mid → `lamps` top) sa bagong mapa,
  kagaya rin ng dating gawi ng `town`.
- **(c) Bagong `snowlamps.png`/`tilesets/snowlamps.tsj` - PLACEHOLDER pa rin:**
  ang `lamps` layer ng `snowtown.tmj` ay gumagamit ng hanggang 4 na hanay
  (rows) ng parol-tile (48 tiles, 12 columns x 4 rows), pero ang umiiral na
  `lamps.png` (town) ay 3 hanay lang (36 tiles). Wala pang natatanging
  "snow" na parol art na in-upload ang user, kaya ginawa muna ang
  `snowlamps.png` sa pamamagitan ng pag-duplicate ng ika-3 hanay ng
  `lamps.png` papunta sa ika-4 na hanay (script, hindi bagong drawing) -
  kaya walang blangkong/nawawalang tile, pero PAREHO pa ring itsura ng
  regular (hindi-snow) na parol ang lalabas, hindi niyebe-tema. Ang mismong
  ILAW (glow) ay TAMA/hiwalay na gumagana kahit paano (basado sa POSISYON
  ng tile sa layer, hindi sa aktwal na larawan). **Kapag may totoong
  snow-lamp art na (mas mataas na `lamps.png`-stylang sheet) ang user,**
  palitan lang ang `assets/map/snowlamps.png` (parehong 12-column na grid,
  16x16 kada tile) - awtomatikong susunod ang lahat.
- **(d) Seasonal swap (`worlds.js`/`map.js`):** bagong `snowUrl` field sa
  `WORLDS.town` (`./assets/map/snowtown.tmj`) - HINDI ito bagong hiwalay na
  "world"/mundo (iisa pa rin ang `"town"`, kaya hindi na kailangang dagdagan
  ang `DOORS` sa worlds.js - VERIFIED na ang parehong shared na pintuan/gate
  coordinates, kapwa spawn (560,580) at exit-door area, ay LIBRE/walang
  collision sa PAREHONG bersyon ng mapa). Sa halip, `loadWorld()` (map.js)
  mismo ang pumipili sa pagitan ng `world.url` (normal) at `world.snowUrl`
  (niyebe) - `isSnowWeather()` (calendar.js/dig.js) ang batayan, KAPAG
  pumapasok/nag-re-reload ng mundong ito (hindi live-swap habang nakatayo
  ka na sa loob - katanggap-tanggap, dahil isang beses lang talaga nag-
  a-occur ang snow/hindi-snow transition kada ilang oras, sa susunod na
  pagpasok mo ulit sa `town` (pintuan/gate) awtomatiko namang tama).
  `typeof isSnowWeather === "function"` guard pa rin (parehong pattern ng
  ibang bahagi ng codebase) - dahil ang FIRST na tawag sa `loadWorld()`
  (dulo ng `map.js`) ay nangyayari BAGO pa man ma-load ang `calendar.js`/
  `dig.js` (mas huli sa `<script>` order) - default sa normal na mapa kung
  ganito, tama naman ang susunod na `loadWorld()` (pagkatapos maka-load ang
  lahat) kapag totoong nasa `town` at snow day.
- **(e) Weather calendar - NABURA palang ang `snow`/`sunny`:** natuklasan na
  `WEATHER_TYPES` (calendar.js) ay `["rain"]` LANG (hindi tugma sa
  dokumentado, entry 26: dapat `["rain","snow","sunny"]`) - kaya
  KAILANMAN hindi naging totoo ang `isSnowDay`/`isSnowWeather()` sa buong
  laro (walang paraang mapili ang "snow" block). Ibinalik sa
  `["rain","snow","sunny"]` (hiling ng user: "add snow in calendar") -
  kaya ngayon puwede nang subukan ang bagong `snowtown` sa mismong susunod
  na snow block (random ang buwan/pagkakasunod-sunod, tingnan entry 26).
- **Cache-bust:** binump ang `?v=` ng `worlds.js`/`map.js`/`calendar.js` sa
  `index.html`.
- **Para i-adjust:** tsansa ng snow block → `WEATHER_TYPES`/
  `WEATHER_BLOCK_DAYS` (calendar.js). Snow-lamp art → `assets/map/
  snowlamps.png` (tingnan (c) sa itaas). Kung sa hinaharap gagawa pa ng
  ibang seasonal na bersyon ng ibang mundo (hal. `newmap` sa taglamig),
  parehong `snowUrl` field na lang sa `worlds.js` ang idagdag - susunod na
  ang `loadWorld()` nang walang dagdag na code.

## 8. Konbensyon kapag nag-e-edit

- Panatilihin ang Tagalog na comment na nagpapaliwanag ng **bakit**, hindi lang
  ano.
- Gumamit ng `typeof x === "function"` / `typeof x !== "undefined"` guards kapag
  tumatawag ng cross-file na bagay na baka hindi pa load.
- Iwasang basagin ang Y-sort/occlusion invariants sa `map.js` — pag-isipan kung
  ang binabago ay dapat ba nasa `bbox` (occlusion) o `baseY` (sort).
- Pagkatapos mag-edit ng JS, mag-`node --check js/<file>.js` para masigurong
  walang syntax error, at hard-refresh ang browser (o bumphin ang `?v=` sa
  `index.html`).


### Entry #54 — Mobile/Touch UI mirrors current gameplay functions
- Mobile controls are touch-only and do not alter desktop keyboard/mouse behavior.
- Added a virtual joystick for WASD movement; dragging farther can trigger the same Shift/run state.
- Added explicit touch Run, Enter/Exit, Tools, Bag, and Menu buttons so the current desktop gameplay functions have direct mobile controls.
- Enter/Exit uses the existing `keys["e"]` path, so the same door logic is preserved.
- Tools opens the existing tool radial; Bag triggers the existing bag button; Menu triggers the existing settings menu.
- Existing map, character, snow/weather, snowlamps foreground order, and door systems are preserved.

### Entry #55 — Mobile skill-cluster redesign (MLBB-style, circular), auto-doors, run animation fix, loading/cooldown overlay
- **Files:** `js/player.js`, `js/update.js`, `js/worlds.js`, `js/draw.js`,
  `js/map.js`, `js/settings-menu.js`, `js/mobile-controls.js`, `index.html`,
  `style.css`

- **(a) Run speed + animation fix.** `player.runSpeed` binaba (2 → 1.7).
  Dating IISA lang na `player.frameSpeed` ang ginagamit kahit tumatakbo -
  mismatch sa pagitan ng bilis ng galaw ng binti at bilis ng katawan sa
  screen ("nagmamadaling" itsura). Bagong `player.runFrameSpeed` (4) -
  `update.js` (animation block) ang pumipili ngayon sa pagitan ng
  `frameSpeed`/`runFrameSpeed` base sa `player.running`.

- **(b) Lahat ng pintuan ay "auto" na ngayon** (`auto: true` sa 3 natitirang
  DOORS entry ng `worlds.js` - village/newmap→houseInside at
  houseInside→`__return__`) - kagaya na ng town gate, awtomatikong
  lumilipat ng mundo sa sandaling madikit ng player, hindi na kailangan ng
  "E". Tinanggal din ang "E - Pumasok/Lumabas" na label (`drawDoorPrompt()`
  hindi na tinatawag sa `draw.js`).

- **(c) Loading overlay + cooldown** (`js/map.js`, `loadWorld()`) - bagong
  `MIN_LOADING_MS` (450ms) na sapilitang minimum na "makikita" ang
  `#world-loading-overlay` (dark overlay + spinner, `index.html`/
  `style.css`) bago matapos ang `worldLoading = false` - dahil parehong
  `worldLoading` flag ang ginagamit ng auto-door check (`update.js`),
  ito na rin mismo ang bumabahalang gumawa ng "cooldown" (hindi
  kaagad ma-re-trigger pabalik-balik ang parehong pintuan) - iisang flag
  lang, walang bagong hiwalay na variable.

- **(d) Bagong Mobile skill-cluster** (`#mobile-skill-cluster`,
  `index.html`/`style.css`, pinalitan ang dating `#mobile-action-buttons`
  grid) - puro BILOG, MLBB-style:
  - **Punch** - PINAKAMALAKI (92px), totoong `assets/items/punch.png`
    icon. I-tap para "tapikin" ang tile na KAHARAP ng player (base sa
    `player.direction`) - `simulateWorldTap()`/`triggerMobilePunch()`
    (mobile-controls.js) ang gumagawa nito sa pamamagitan ng
    SYNTHETIC mousemove/mousedown/mouseup/click sa canvas (kabaligtaran
    ng conversion sa `getMouseTile()`, dig.js) - kaya AWTOMATIKONG
    gumagana ang lahat ng existing interaction (puno/bato/kama/shop/
    crafter/stove/pagdampot) nang walang duplicate na logic.
  - **Tools** - inibaba at pinaliit ng konti (46px, dating 58px sa mas
    mataas na posisyon), gamit ang `pickaxe.png` bilang icon.
  - **Run** - inilipat KATABI ng Tools (dating nasa itaas ng joystick) -
    parehong Tools at Run ay nasa ITAAS ng Punch ngayon.
  - **TINANGGAL:** Enter/Exit button (auto-door na), Bag na floating
    button (hotbar's own bag slot pa rin ang gamit), Menu na floating
    button (tingnan (e) sa ibaba).
  - Joystick inibaba ng konti (`bottom: 92px` → `66px`).

- **(f) "?mobileui=1" URL param** (`js/mobile-controls.js`) - PARA LANG
  SA PAG-PREVIEW ng touch UI sa DESKTOP nang walang totoong phone -
  buksan lang ang laro nang ganito: `http://localhost:8000/?mobileui=1`
  - ituturing na "touch device" kahit desktop talaga, kaya lalabas ang
  joystick/skill-cluster, magagamit gamit ang MOUSE (drag/click, dahil
  Pointer Events na ang ginagamit). Walang epekto sa totoong
  mobile/touch detection - dagdag lang ito, hindi pinalitan.

- **(e) Settings sa GITNA ng screen gamit ang phone BACK button**
  (`js/mobile-controls.js`, bagong "(d)" section) - popstate/history
  guard trick (standard na paraan para ma-intercept ang hardware/browser
  BACK sa isang plain webpage) - touch device LANG
  (`isMobileTouchDevice`). `setSettingsMenuOpen(open, centered)`
  (`settings-menu.js`) - bagong 2nd parameter: `centered = true` ay
  nagdaragdag ng `.settings-menu-centered` class sa
  `#settings-menu-dropdown` (`style.css`) na naga-override sa posisyon
  papuntang `position: fixed; top/left: 50%` sa halip na naka-anchor sa
  burger icon (normal/desktop click pa rin ang default, hindi centered).

### Entry #56 — Bug fix: Tools button (mobile) agad nagsasara ang tool radial
- **File:** `js/mobile-controls.js`
- Ang generic "tap outside to cancel" listener (document-level pointerdown)
  ay naaabot din ng MISMONG pointerdown na nagbukas ng radial (dahil ang
  Tools button ay NASA LABAS ng `#tool-radial` panel) - kaya nagbubukas at
  agad nagsasara ang radial sa loob ng iisang tap, parang "hindi lumalabas".
  Fix: `event.stopPropagation()` sa loob ng Tools button handler, para
  hindi na maabot ng document-level listener ang parehong event. Verified
  na gumagana na ngayon (screenshot) - centered sa gitna ng screen, gaya
  ng desktop.

### Entry #57 — Bug fix: mobile HUD adjustments hindi gumagana sa landscape phones + hotbar off-center + calendar inilipat sa ilalim ng player-hud
- **File:** `style.css`
- **BUG:** ang buong "MOBILE HUD / TOUCH LAYOUT" block ay naka-gate sa
  `@media (max-width: 700px)` - pero karamihan sa totoong phone sa
  LANDSCAPE (strict landscape ang laro, hiling ng user) ay MAS MALAPAD
  sa 700px (hal. iPhone 13 = 844px pahiga) - kaya HINDI KAILANMAN
  nag-fi-fire ang buong block sa totoong paggamit. Fix: pinalitan ang
  gate papuntang `body.touch-controls-active` (parehong class na
  nagpapakita/nagtatago ng joystick/skill-cluster) - base na ngayon sa
  TALAGANG uri ng device, hindi sa lapad ng screen.
- **BUG (hotbar off-center):** dahil sa itaas, hindi rin dating
  gumagana ang sumusunod na fix: `#hotbar` sa mobile ay `transform:
  scale(...)` LANG (nawala ang `translateX(-50%)` na dating
  ginagawang naka-center ito, `left: 50%` base rule) - lumihis papunta
  sa KANAN. Fix: `transform: translateX(-50%) scale(...)` (parehong
  kasama) sa lahat ng 3 lugar (`body.touch-controls-active #hotbar`,
  at ang dalawang extra-small-screen media query). Verified (screenshot,
  844px width): eksaktong nasa gitna na ang hotbar.
- **Calendar/petsa/panahon inilipat sa ILALIM ng `#player-hud`** (hiling
  ng user) - bagong `body.touch-controls-active #calendar-panel` rule,
  `position: fixed; left/top` (independiyente sa DOM parent nito
  `#settings-menu`/`#top-right-bar`, dahil walang transform ang mga
  ninuno nito na bumubuo ng bagong containing block). Ang burger/
  settings button (☰) ay NANANATILI sa itaas-KANAN, walang binago
  doon. Verified (screenshot): stacked na sila (HUD sa itaas, calendar
  sa ibaba, parehong kaliwang column).

### Entry #58 — Player: pinalitan ang IDLE at WALK sprites, ngayon "oldman" na ang itsura (RUN/SIT/tools hindi pa)
- **Files:** `assets/player/idleFront.png`, `idleBack.png`, `idleLeft.png`,
  `idleright.png`, `walkFront.png`, `walkBack.png`, `walkLeft.png`,
  `walkRight.png` (walang binago sa `js/assets.js`/`js/player.js` - parehong
  filename/format pa rin ang ginagamit, palitan lang ang laman).
- **Hiling ng user:** gawing "oldman" (yung shopkeeper NPC, `assets/npc/
  oldman/`) ang itsura ng player - IDLE at WALK muna, hindi pa RUN/SIT/tool
  swing animations (`runFront.png` atbp., `sit.png`, `axe/`, `pick/`,
  `pickaxe/`, `rake/`, `punch/` - bata pa rin doon).
- **Pinagmulan ng bagong art:** `assets/npc/oldman/` (hindi ito
  ginalaw/binura - pinuntahan lang bilang source, gumagana pa rin ang
  oldman NPC mismo gamit ang parehong mga file).
  - `walkFront/Back/Left/Right.png` - direktang kinuha ang 6 magkakahiwalay
    na GIF frame kada direksyon (`oldman/walk/Oldman_south|north|west|east/
    frame_0..5_delay-0.2s.gif`) at pinagsama-samang PARA maging ISANG
    horizontal strip (frame_0 sa kaliwa hanggang frame_5 sa kanan) - ito
    ang FORMAT na inaasahan ng `drawPlayer()` sa `js/player.js`
    (`frameWidth = sprite.width / 6`, tapos `frameIndex * frameWidth` ang
    kino-crop kada frame ng animation).
  - `idleFront.png`/`idleBack.png` - kinuha ang UNANG frame lang ng
    `oldmanIdleFront.gif`/`oldmanIdleBack.gif` (breathing-idle GIF, may 4
    frame ang orihinal, pero PAULIT-ULIT lang frame 0 ang ginagamit ng
    player anyway kapag naka-idle - tingnan susunod na punto).
  - `idleLeft.png`/`idleright.png` - **WALANG** hiwalay na left/right idle
    art ang oldman NPC (front/back lang siya kapag naka-tayo) - kaya
    ginamit na lang ang frame 0 (nakatayong pose) ng
    `walk/Oldman_west|east/` bilang pinagmulan.
- **Mahalagang detalye:** kahit anong ilagay dito, isang beses lang
  gagamitin ng `drawPlayer()` ang bawat idle image kapag hindi gumagalaw
  ang player - **laging `frameIndex = 0`** (ika-anim/unang bahagi lang ng
  strip). Kaya para gumana nang tama sa PAREHONG frameWidth-slicing logic
  (na fixed sa 6 frames/strip para sa lahat - idle man o walk), ang bawat
  idle PNG dito ay UNANG frame pa rin PERO **PINAULIT nang 6 na beses**
  (magkakaparehong larawan magkatabi) - hindi lang isang solong imahe -
  kung hindi, mali/pira-piraso ang lalabas dahil hahatiin pa rin ito ng
  code sa 6 na pantay na bahagi.
- **Backup:** nakalagay ang mga LUMANG (batang) idle/walk PNG sa
  `assets/player/_backup_original_player_sprites/` - pwedeng ibalik kung
  kailangan (palitan lang ulit ang 8 files pabalik sa `assets/player/`).
- **Susunod (hindi pa ginawa):** RUN, SIT, at lahat ng tool-swing
  animations (axe/pick/pickaxe/rake/punch) - bata pa rin ang art doon,
  kaya "magkahalo" muna ang itsura (matandang lakad/tayo, batang tumatakbo/
  gumagamit ng tools) hangga't hindi pa hiling na palitan din ang mga ito.
- **PINALITAN/SINUPERSEDE ni Entry #59** - hindi na "oldman" ang ginagamit,
  "santa" character na (tingnan sa ibaba).

### Entry #59 — Player: pinalitan ULIT ang IDLE/WALK sprites - "santa" na (assets/character/), HINDI na "oldman" (SINUPERSEDE ang Entry #58)
- **Files:** parehong 8 file gaya ng Entry #58 (`assets/player/idleFront.png`,
  `idleBack.png`, `idleLeft.png`, `idleright.png`, `walkFront.png`,
  `walkBack.png`, `walkLeft.png`, `walkRight.png`) - laman lang ulit ang
  pinalitan, pareho pa rin ang filename/format, walang binago sa
  `js/assets.js`/`js/player.js`/`js/update.js`.
- **Tama palang folder ang tinutukoy ng user:** hindi pala `assets/npc/
  oldman/` (yun ang NPC shopkeeper) kundi `assets/character/` - literal na
  "character" ang pangalan ng folder, may sarili itong `idle/` at `walk/`
  subfolder (4 direksyon kada isa) - ito na ang bagong art ng MAIN
  character/player (tinawag ng user na "santa").
- **Pinagmulan:**
  - `assets/character/idle/{front,back,left,right}idle/*.png` - 7 frame
    bawat direksyon (may kasamang `.ase` - Aseprite source file, hindi
    nagamit, PNG lang ang kinuha).
  - `assets/character/walk/{front,back,right}walk/*.png` - front/back ay
    10 frame, right ay 7 frame.
  - **`leftwalk` - WALANG exported PNG** (`.ase` lang ang mayroon sa
    folder, walang kasamang `.png`) - kaya hindi ito direktang nagamit;
    sa halip, kinuha ang `rightwalk.png` at **hinorizontal-mirror**
    (kaliwa-kanan) ang bawat frame nito para gawing panandaliang
    `walkLeft.png` - gumagana naman dahil karaniwang simetriko/frontal
    ang disenyo ng character (walang hawak na baril/tool na naka-isang
    kamay lang na "mali" kapag na-mirror). Kung meron palang totoong
    `leftwalk.png`/exported frames sa hinaharap, palitan na lang ito.
- **BAGONG problema na hindi lumitaw noong "oldman" (Entry #58):**
  IBA-IBA ang bilang ng frame kada direksyon dito sa "santa" art (7 sa
  idle, 10 sa walk front/back, 7 sa walk left/right) - **pero FIXED sa
  6 frames/strip ang buong sprite-slicing logic ng engine**
  (`frameWidth = sprite.width / 6` sa `drawPlayer()`, `js/player.js`;
  saka `if (player.frame >= 6) player.frame = 0;` sa `js/update.js`,
  parehong hardcoded 6, hindi alam kung ilang frame TALAGA ang laman ng
  bawat sprite). Kung direkta na lang ikinabit ang orihinal na 7/10-frame
  na PNG dito nang walang ibang ginawa, MALI ang lalabas na paghihiwa
  (hindi tama ang crop kada frame, "putol-putol"/maling parte ng sprite
  ang lalabas).
  - **Paraan ng pag-aayos (sa halip na baguhin pa ang engine/
    `player.js`/`update.js` mismo, mas ligtas/mas maliit na pagbabago):**
    hiniwa-hiwalay muna ang bawat orihinal na PNG papunta sa
    magkakahiwalay na 64×64 frame (Python/Pillow script - hindi bahagi ng
    laro, ginamit lang minsanan para gawin ang mga file dito), pumili ng
    ANIM (6) sa mga iyon nang PANTAY-PANTAY ang pagitan (hal. sa 10 frame,
    kinuha ang indices 0,2,4,5,7,9 - hindi lahat), tapos muling
    pinagsama-sama papunta sa bagong 6-frame na strip bago i-save bilang
    `walkFront.png` atbp. Kaya TAMA pa rin ang paghihiwa ng engine (6
    frames pa rin talaga ang laman), kahit iba ang ORIHINAL na bilang ng
    frame sa `assets/character/`.
  - Ganito rin ang ginawa sa IDLE (7 → 6 frame) - kahit hindi na
    kailangan dahil ISANG beses (`frameIndex = 0`) lang naman palaging
    ginagamit sa idle (tingnan Entry #58), sinunod pa rin ang 6-frame
    format PARA CONSISTENT/hindi malito kung sakaling babaguhin pa ito sa
    hinaharap.
- **Backup:** `assets/player/_backup_original_player_sprites/` - ito pa
  rin ang TALAGANG-TALAGANG orihinal (batang character, BAGO pa man ang
  oldman attempt) - HINDI ito nag-iba, hindi rin ito kinailangang i-update
  dahil hindi ito ang huling ginamit na "oldman" na bersyon (walang
  na-save na hiwalay na backup ng oldman attempt - kung kakailanganin pa
  yun, muling bubuuin na lang gamit ang parehong paraan sa Entry #58 mula
  sa `assets/npc/oldman/`).
- **Susunod (hindi pa ginawa):** RUN, SIT, at lahat ng tool-swing
  animations - bata pa rin ang art doon (parehong pahayag gaya ng
  Entry #58) - kaya "magkahalo" pa rin ang itsura habang naka-idle/naka-
  walk (santa) kumpara sa tumatakbo/gumagamit ng tools (bata) hangga't
  hindi pa hiling na palitan din ang mga ito.

### Entry #60 — Player: naayos ang FRAME COUNT mismatch (hardcoded "6") + naayos ang COLLISION box na hindi na tumutugma matapos palakihin ang character
- **Konteksto:** sa pagitan ng Entry #59 at ngayon, may sarili nang
  ginawang pagbabago ang user OUTSIDE ng Claude (bagong bersyon ng
  project ang in-upload): (1) direktang tinuro na ni `js/assets.js`
  ang `sprites.idle`/`sprites.walk` sa TALAGANG orihinal na strip sa
  `assets/character/idle|walk/...` (7/10/7 frame) sa halip na sa mga
  6-frame na "downsampled" na kopya sa `assets/player/idleFront.png`
  atbp. na ginawa sa Entry #59 - kaya YAON (`assets/player/idle*.png`,
  `walk*.png`) ay **DEAD/UNUSED na files na ngayon**, walang
  bumabanggit dito maliban sa hindi-ginagamit na root-level
  `script.js` (lumang monolitikong file, WALANG `<script>` tag dito sa
  `index.html`, hindi tumatakbo sa laro - ligtas na balewalain/burahin
  balang araw); (2) pinalaki ang `player.width`/`player.height`
  (`js/player.js`) mula 16×24 papuntang **56×64**; (3) may kasamang
  eksport na `leftwalk.png` na ngayon sa `assets/character/walk/
  leftwalk/` (7 frame) - dating WALA pa nito noong Entry #59
  (mirror na lang ang ginawang paraan noon dahil dito).
- **BUG #1 - Frame count:** dahil DIREKTA na ngayong ginagamit ng
  `js/assets.js` ang totoong-totoong strip (idle = 7 frame/direksyon,
  walk paitaas/pababa = 10 frame, walk pakaliwa/pakanan = 7 frame -
  eksaktong tulad ng sinabi ng user), pero `js/player.js`
  (`drawPlayer()`) at `js/update.js` (frame wrap-around) ay
  **HARDCODED sa 6 frames palagi**, MALI ang paghihiwa ng bawat frame
  (`frameWidth = sprite.width / 6` gamit ang maling divisor) -
  "pira-piraso"/pilipit ang lumalabas na sprite, at maaaring "tumalon"
  papunta sa maling bahagi ng strip habang naglalakad.
  - **Fix:** bagong function na `getPlayerAnimationFrameCount()`
    (`js/player.js`, bago mismo ang `drawPlayer()`) - dinideretmina
    kung ilang frame TALAGA ang laman ng KASALUKUYANG aktibong sprite,
    base sa estado ng player:
    - naka-sit → 6 (bata pa ring `sit.png`, frame 0 lang naman
      ginagamit)
    - naka-run → 6 (bata pa ring `run*.png`, hindi ginalaw)
    - naglalakad (walk), direksyon up/down → **10**
    - naglalakad (walk), direksyon left/right → **7**
    - naka-idle (hindi gumagalaw) → **7**
    - Ginamit ito PAREHO sa `drawPlayer()` (para tama ang
      `frameWidth`) AT sa `js/update.js` (para tama ang wrap-around ng
      `player.frame` - `if (player.frame >= getPlayerAnimationFrameCount())`
      sa halip na `>= 6`) - IISANG pinagmulan ng totoo para hindi
      na muling maging magkaiba/hindi magkatugma ang dalawang lugar na
      ito sa hinaharap.
- **BUG #2 - Collision box hindi na tumutugma matapos lumaki ang
  character:** `getPlayerCollisionBox()` (`js/collisions.js`) ay
  FIXED PIXEL VALUES dati (`x+4, y+12, width:16, height:10`) -
  kinalkula noong 16×24 pa lang ang `player.width/height` (yung
  ORIHINAL na batang sprite). Nang pinalaki ang character papuntang
  56×64 nang hindi ito hinawakan, "naiwan" ang maliit/maling-posisyon
  na hitbox malapit sa itaas-kaliwang sulok ng BAGONG mas malaking
  sprite (malayo sa TALAGANG paanan) - kaya "maaga"/"mali" ang
  pakiramdam ng banggaan sa mga hadlang (parang may nabanggang bagay
  kahit malayo pa "sa mata" ang paa ng character sa hadlang).
  - **Fix:** ginawang PROPORTIONAL (percentage ng `player.width`/
    `player.height`) sa halip na fixed pixels ang hitbox - 45% ng
    width, 22% ng height, naka-center horizontally at naka-anchor sa
    PINAKABABA (paanan) ng sprite:
    ```js
    const width = player.width * 0.45;
    const height = player.height * 0.22;
    return {
      x: x + (player.width - width) / 2,
      y: y + player.height - height,
      width,
      height,
    };
    ```
    Awtomatiko na itong susunod kung magbabago pa ulit ang laki ng
    character sa hinaharap - hindi na kailangang balikan/i-retouch
    pang muli ang collisions.js kada palitan ang `player.width`/
    `player.height`.
- **HINDI ginalaw/hindi kasama sa fix na ito:** `getOldManCollisionBox`
  at `getPigCollisionBoxes` (`decor.js`/`pig.js`) - sarili nilang NPC
  box ito, independent sa `player.width/height`, walang naiulat na
  isyu dito.
- **Susunod na maaaring i-clean-up (opsyonal, hindi ginawa dahil
  hindi hiniling):** pwedeng burahin na ang mga dead na
  `assets/player/idleFront.png`, `idleBack.png`, `idleLeft.png`,
  `idleright.png`, `walkFront.png`, `walkBack.png`, `walkLeft.png`,
  `walkRight.png` (6-frame na "downsampled" na kopya mula Entry #59,
  wala nang gumagamit) - pati na rin ang buong root-level `script.js`
  (lumang unused na kopya) - pero hindi muna hinawakan dito para
  hindi ma-touch ang mga file na hindi bahagi ng hiling.

### Entry #61 — 2-mundo na lang (town + grassmap), tinanggal ang code-drawn na placeholder room, bagong 6 bahay sa town, bagong "House naming convention"
- **Files:** `js/worlds.js`, `js/map.js`, `js/update.js`, `js/bed.js`,
  `js/draw.js`, `js/decor.js`, `js/resources.js`, `js/dig.js`, `index.html`

- **(a) KONBENSIYON NG PANGALAN PARA SA MGA BAHAY/INTERIOR (SUNDIN ITO
  SA BAWAT BAGONG BAHAY MULA NGAYON):** `<pangalan ng may-ari>` +
  `"House"` (camelCase, unang letra maliit) — halimbawa: kung "tan" ang
  pangalan ng account, ang WORLDS entry/pangalan ng silid nito ay
  `tanHouse`. Ito ang ginamit sa 6 bagong bahay sa ibaba
  (`manuelHouse`, `josephHouse`, atbp.) at dati nang ginamit ng
  `grassmapHouse`. Kapag may bagong bahay sa hinaharap, gawin munang
  isang bagong `WORLDS.<pangalan>House` entry (worlds.js) + kaukulang
  `DOORS` pares (Enter mula sa labas + Exit `"__return__"` papuntang
  loob nito) — tingnan ang (c) sa ibaba para sa buong pattern.

- **(b) Tinanggal ang `starter`, `village`, `newmap`, at `houseInside`
  sa `WORLDS`** (hiling ng user: "mangyayari is 2 na lang town at
  grassmap") — `town` at `grassmap` na lang ang natitirang labas na
  mundo, magkadugtong pa rin sa pamamagitan ng umiiral na (hindi
  ginalaw) na "Grass Path"/"Town" na pares ng pintuan. Dahil dito:
  - Tinanggal din ang mga `DOORS` entry na dating tumuturo
    papunta/mula sa mga tinanggal na mundong ito (village/newmap →
    houseInside, ang dating newmap↔town blackhole gate, at ang
    houseInside "Exit").
  - `js/map.js` (`loadWorld` ng dulo ng file, savedWorld migration) —
    tinanggal ang mga HIWALAY na espesyal na "village"→"newmap" at
    "houseInside"→DEFAULT_WORLD na migration branch — HINDI na
    kailangan ang mga ito: awtomatiko nang bumabalik sa
    `DEFAULT_WORLD` ("grassmap") ang generic na
    `WORLDS[savedPlayer.world]` na check kapag wala nang entry doon
    ang naka-save na pangalan ng mundo (kahit anong luma pang pangalan
    pa ito).
  - `js/dig.js` — `WORLDS_WITHOUT_GROUND_WEATHER_OVERLAY` mula
    `["village", "town"]` papuntang `["town"]` na lang.

- **(c) Tinanggal ang "PANSAMANTALANG SILID" (code-drawn placeholder
  room) system** (hiling ng user: "yung static room na ginawa via code
  alisin mo na ayoko na nun"):
  - `js/worlds.js` — tinanggal ang buong `drawPlaceholderRoom()`
    function at ang `ROOM_FLOOR_COLOR`/`ROOM_FLOOR_PLANK_COLOR`/
    `ROOM_WALL_COLOR`/`ROOM_WALL_EDGE_COLOR` na constants. Wala nang
    dapat maglagay ng `placeholderRoom: true` sa alinmang bagong
    `WORLDS` entry — LAHAT ng interior mula ngayon ay dapat may TUNAY
    na Tiled `.tmj`/tileset (gaya ng `room_grassmap.tmj`), hindi na
    guhit-lang-ng-canvas.
  - `js/map.js` (`drawMapBackground()`) — tinanggal ang
    `if (world.placeholderRoom) { drawPlaceholderRoom(); return; }` na
    sanga.

- **(d) BAGONG 6 na bahay sa loob ng "town"** (hiling ng user: "yung sa
  town is yung mga pinto is napapasukan lagyan mo rin ng name 6 house
  yun so may different name, manuel, joseph, maria, escanor, jillian,
  matilda"):
  - **Paano nakita ang eksaktong 6 pintuan:** may `"door"` tile layer
    na ang `town.tmj` (dating ginamit lang bilang marker ng ilaw ng
    pinto, entry 51) — kinuha (Python script) ang lahat ng
    di-blangkong (col,row) doon, pinag-cluster (magkalapit na tile),
    at NAKAKITA ng EKSAKTONG 6 pangkat — tumutugma sa 6 bahay na may
    bukas na guhit na pinto sa larawan mismo (`town.png`). VERIFIED
    gamit ang script na nag-o-overlay ng "door" tiles (cyan) at
    `Collisions` objects (red) sa ibabaw ng `town.png`
    (screenshot-checked) — kinumpirma kung saan TALAGANG bukas/
    madadaanan (walang Collision) sa HARAP/ilalim ng bawat pintuan,
    hindi basta ang pintuan mismo (na may pader sa magkabilang gilid).
  - **Pangalan → posisyon (world:"town", bawat isa "Enter", `auto:
    true`):**
    - `manuelHouse` — bahay na may BERDENG bubong (itaas-kaliwa),
      `area: {x:216,y:176,width:24,height:24}`
    - `josephHouse` — 2nd na bahay sa itaas (BUGHAW bubong),
      `area: {x:520,y:192,width:24,height:24}`
    - `mariaHouse` — 3rd na bahay sa itaas (PULANG bubong),
      `area: {x:730,y:176,width:30,height:20}`
    - `escanorHouse` — 4th/pinakakanan na bahay sa itaas (BUGHAW
      bubong), `area: {x:950,y:168,width:22,height:18}`
    - `jillianHouse` — bahay sa gitna-kanan (KAYUMANGGING bubong, may
      tsimenea), `area: {x:908,y:360,width:20,height:18}`
    - `matildaHouse` — bahay sa ibaba-kaliwa (kahel/kayumanggi),
      `area: {x:280,y:432,width:32,height:24}`
  - Bawat isa ay may katumbas na "Exit" na `DOORS` entry sa SARILI
    nitong world (`area: {x:63,y:193,width:39,height:31}`, `to:
    "__return__"`) — EKSAKTONG kopya ng butas ng `room_grassmap.tmj`
    (tingnan sa ibaba kung bakit pareho).
  - **WALA PANG sariling hiwalay na art/tileset ang bawat isa** — LAHAT
    ng 6 (pati `grassmapHouse`) ay gumagamit MUNA ng PAREHONG
    `room_grassmap.tmj` bilang panloob na larawan/tileset (parehong
    `spawn: {x:55,y:120}` at parehong Exit-hole na posisyon) — kaya
    IISANG itsura lang ang makikita sa loob ng bawat isa sa ngayon.
    **Kapag may sarili nang guhit/Tiled export ang isang partikular na
    bahay balang araw, PALITAN LANG ang `url` ng kaukulang
    `WORLDS.<pangalan>House` entry** papunta sa bagong `.tmj` — hindi
    na kailangang galawin ang `DOORS`/ibang bahagi ng code.

- **(e) `js/bed.js` — ginawang GENERIC (dating naka-tali lang sa
  `houseInside`, na TINANGGAL na):**
  - `isBedTile()`/`drawBed()` — sinusunod na ngayon ang `isIndoors()`
    (worlds.js, basta hindi `outdoor`) sa halip na
    `currentWorld === "houseInside"` — kaya gumagana na ang
    "matulog hanggang 6am" sa LAHAT ng interior (grassmapHouse + lahat
    ng bagong bahay sa town), hindi lang sa isa.
  - `BED_X`/`BED_Y` binago mula `(40,56)` papuntang `(28,80)` — VERIFIED
    laban sa `Collisions` ng `room_grassmap.tmj` (ang walkable na
    interior nito ay `x:20-210, y:74-193`) — ang lumang posisyon ay
    NASA LOOB pa ng itaas na pader (para sa IBANG silid/laki,
    `houseInside.tmj`, hindi ito) — ngayon TALAGANG nasa loob ng
    walkable na sahig ang kama.

- **(f) `js/decor.js`/`js/draw.js`/`js/resources.js` — dead-code
  cleanup ng "town gate" system pagkatapos tanggalin ang "newmap":**
  - Tinanggal ang UNANG "blackhole gate" (dynamic na naka-center sa
    TAAS-GITNA ng "newmap" — `TOWN_GATE_WORLD`,
    `getTownGateBlackholeCenter()`, `getTownGatePatchBox()`,
    `drawTownGatePatch()`) — wala nang mundong gagamit dito. Tinanggal
    din ang tawag dito sa `draw.js`.
  - **Natuklasang DATING BUG (hindi dulot ng session na ito, pero
    nahanap habang tina-trace ang "newmap" references):**
    `drawNewmapReturnGatePatch()` ay may `if (currentWorld !==
    "newmap") return;` — MALI/hindi tumutugma sa TALAGANG box nito
    (`NEWMAP_RETURN_GATE_CENTER`, eksaktong kapareho ng "area" ng
    DOORS entry `world:"grassmap"` papuntang "town") — kaya HINDI
    KAILANMAN talaga lumalabas ang decal na ito sa loob ng grassmap.
    **Naayos:** `currentWorld !== "grassmap"` na ang check.
  - `isInsideTownGateClearing()` (resources.js) — dating
    naka-gate sa `currentWorld !== "newmap"` (palaging `false` na
    ngayon dahil wala nang "newmap") — ginawang simpleng `return
    false;` (parehong resulta pa rin, mas malinaw/walang nakabiting
    reference sa tinanggal na `getTownGatePatchBox`).

- **Para i-adjust:** posisyon ng bawat bagong pintuan ng bahay sa town
  → ang kaukulang `DOORS` entry (`area`, worlds.js) — ITUGMA rin ang
  `world:"town"` `to:` niyon. Ibang tileset/art bawat bahay → `url` sa
  kaukulang `WORLDS.<pangalan>House` (worlds.js). Posisyon ng kama →
  `BED_X`/`BED_Y` (bed.js, i-verify munang walang overlap kung
  babaguhin pa ang interior tileset).

### Entry #63 — LAHAT ng pintuan ng bahay (town + grassmapHouse) ay E-to-use na sa PAPASOK AT PALABAS + bagong "facing check" (dapat nakaharap) para sa stove/crafter/bed/pintuan
- **Files:** `js/worlds.js`, `js/collisions.js`, `js/dig.js`

- **(a) Hiling ng user:** "sa town at sa grassmap na bahay yung mga
  pinto papasok/palabas is dapat need na mag press 'e' key" - dating
  ang mga Enter na pintuan ng 6 bahay sa town ay E-to-use na (Entry
  #62), PERO ang lahat ng Exit (palabas) - kasama na ang grassmapHouse
  Enter/Exit - ay "auto: true" pa rin (basta madaanan, awtomatiko).
  **Ayos:** tinanggal ang `auto: true` sa **grassmapHouse Enter**,
  **grassmapHouse Exit**, at sa **6 Exit ng bahay sa town**
  (manuelHouse/josephHouse/mariaHouse/escanorHouse/jillianHouse/
  matildaHouse → `__return__`) - lahat ng ito ay kailangan na ring
  E-to-use ngayon. **HINDI ginalaw** ang gate patungong "town"
  ("Grass Path"/"Town" na pares sa pagitan ng `town`/`grassmap`) -
  hindi ito "bahay" ayon sa literal na hiling, nananatiling "auto".
  Walang binago sa `js/update.js` - parehong E-key/auto-door code path
  na umiiral na (Entry #46/#55) ang sumusunod dito, basta tinanggal
  lang ang `auto` field sa `DOORS` (worlds.js).

- **(b) Bagong "FACING CHECK" - hiling ng user:** "gusto ko yung
  character dapat nakaharap sa mismong may mga function lang para ma
  use yun bahay na may function like stove crafter bed door etc" -
  dating basta ABOT/MALAPIT (`isTileInReach` sa dig.js, o
  reach-margin ng `getDoorUnderPlayer` sa worlds.js) na lang ang
  kailangan, kahit anong direksyon (`player.direction`) ang kaharap ng
  player - hal. puwede pa rin buksan ang Stove kahit TALIKOD dito.
  **Ayos - bagong SHARED helper, `isPlayerFacingWorldPoint(targetX,
  targetY)`** (`js/collisions.js`, PIXEL-based, hindi tile-based) -
  kinukwenta ang direksyon mula sa GITNA ng collision box ng player
  papunta sa target point, tapos tinitignan kung tumutugma ito sa
  `player.direction` gamit ang isang "45-degree cone" (ang
  PANGUNAHING axis ay dapat mas malaki-o-kapantay sa KABILANG axis) -
  hindi eksaktong-tuwid-na-linya lang, para gumana pa rin ang malaking
  bagay (hal. kama, ilang tile ang lapad).
  - `js/dig.js` - bagong `isPlayerFacingTile(col, row)` (tile-center
    wrapper ng `isPlayerFacingWorldPoint`) - dinagdag ang check na ito
    (`facingTile`) bago pahintulutan ang **Crafter** (`openAdvancedCraftPanel`),
    **Stove** (`openStovePanel`), at **Bed** (`trySleepInBed`) sa loob
    ng `mousedown` listener - kung hindi nakaharap, WALANG mangyayari
    (hindi bumubukas ang panel/hindi natutulog), pero HINDI rin
    tumutuloy sa ibang click behavior (hal. rake/pagtatanim) - basta
    "walang epekto" lang ang click sa ganitong sitwasyon.
  - `js/worlds.js` (`getDoorUnderPlayer`) - dinagdagan din ng parehong
    check (gamit ang gitna ng `door.area` bilang target) - PERO
    `door.auto === true` na pintuan lang (hal. ang gate) ang
    EXCLUDED dito - basta madaanan pa rin (kahit anong direksyon),
    dahil hindi naman "E to use" na interaction iyon. Lahat ng E-to-use
    na pintuan (kasama ang LAHAT ng bahay ngayon, tingnan (a) sa
    itaas) ay kailangan na ring HARAPIN muna bago lumabas ang
    "E - <label>" na prompt/gumana ang E.
  - **Sadyang HINDI kasama:** Oldman NPC shop (`isOldManTile`) - hindi
    ito bahagi ng literal na hiling ("stove, crafter, bed, door") -
    gumagana pa rin ito kahit anong direksyon habang malapit lang.
  - **Para i-adjust:** lapad ng "cone" (kasalukuyan, 45°/1:1 ratio) →
    baguhin ang `Math.abs(deltaX) <= Math.abs(deltaY)` (atbp.) sa loob
    ng `isPlayerFacingWorldPoint` (collisions.js) - mas MALAKING
    multiplier sa isang side (hal. `<= Math.abs(deltaY) * 1.5`) ay
    magpapaluwag sa cone (mas madaling "nakaharap"). Para idagdag ang
    parehong check sa ibang function object sa hinaharap (hal. oldman
    shop, kung babaguhin ang isip) - tawagin lang ang
    `isPlayerFacingTile(col, row)` (dig.js) bago payagan ang
    interaction.

- **(c) Bug (VERIFIED, hiwalay sa (a)/(b)): "yung paglabas ng bahay ni
  Manuel sa ibang lugar pumupunta"** - `getDoorExitSpawn()`
  (`js/worlds.js`) ay gumagamit pala ng HARDCODED na
  `collisionOffsetX/Y`/`collisionWidth` (4/12/16) - EKSAKTONG kopya ng
  LUMANG fixed-pixel na `getPlayerCollisionBox` (bago pa ang Entry #60)
  na ginawa NOONG 16×24 pa lang ang sprite. Nang ginawang PROPORTIONAL
  (45%/22% ng `player.width/height`, 56×64 na) ang collision box sa
  Entry #60, NAIWAN/hindi na-update ang function na ito - kaya humigit
  kumulang **52px masyadong PABABA at 16px masyadong PAKANAN** ang
  nakukwentang "harap ng pintuan" kumpara sa TALAGANG tamang posisyon -
  kaya lumalabas ang player nang malayo sa TALAGANG pinto (posibleng
  katabi na ng ibang bahay/hadlang, "ibang lugar" ang datingan).
  **Ayos:** sa halip na mag-hardcode ulit ng bagong numero (parehong
  klase ng bug ang muling mangyayari kapag nagbago pa ulit ang laki ng
  player), `getDoorExitSpawn()` ay DIREKTANG tumatawag na ngayon sa
  TALAGANG `getPlayerCollisionBox(0, 0)` (collisions.js) para
  kunin ang eksaktong offset ng box mula sa top-left ng sprite, tapos
  "reverse"-kino-compute ang (x,y) ng player na kailangan para ang
  GITNA (x) ng collision box ay tumapat sa GITNA ng pintuan, at ang
  ILALIM (y) nito ay bahagyang PABABA (`exitBuffer`) mula sa ilalim ng
  pintuan - AWTOMATIKO na itong tama kahit magbago pa ulit ang
  `player.width`/`player.height` sa hinaharap.
  - **Epekto:** TAMA na ngayon ang exit spawn ng LAHAT ng interior na
    gumagamit ng `getDoorExitSpawn()` (grassmapHouse + 6 bahay sa
    town) - hindi lang si Manuel, dahil IISANG SHARED function ito
    para sa lahat (walang per-house na magkahiwalay na code path).

### Entry #62 — 6 bahay sa town: kailangan na ulit pindutin ang E para pumasok + label na PANGALAN ng may-ari sa itaas ng "E - ..." na prompt
- **Files:** `js/worlds.js`, `js/draw.js`

- **Hiling ng user:** "gusto ko e press pa yung E key para makaenter
  tapos may label na house name lke 'Joseph' yung mga name ilagay sa
  pinto" - ang 6 pintuan PAPASOK sa bahay sa town (Entry #61) ay
  dating "auto" (basta madaanan, awtomatikong papasok) - ngayon
  kailangan na namang pindutin ang E, at may nakalutang na paalala sa
  ilalim ng screen na nagsasabi kung KANINONG bahay ito.
- **`js/worlds.js` (`DOORS`):** tinanggal ang `auto: true` sa 6 Enter
  na pintuan (town → manuelHouse/josephHouse/mariaHouse/escanorHouse/
  jillianHouse/matildaHouse) - kailangan na ulit pindutin ang E
  (parehong E-key na landas na dati nang umiiral sa `update.js`,
  walang binago doon). Pinalitan din ang `label` ng bawat isa mula sa
  generic na `"Enter"` papuntang PANGALAN ng may-ari (`"Manuel"`,
  `"Joseph"`, `"Maria"`, `"Escanor"`, `"Jillian"`, `"Matilda"`).
  **Ang mga "Exit" na pintuan (palabas) ay NANANATILING "auto"** -
  hindi hiniling baguhin, awtomatiko pa ring lalabas ang manlalaro.
- **`js/draw.js`:** muling PINAGANA ang `drawDoorPrompt()` (dating
  tinanggal ang tawag dito noong Entry #55, dahil noon lahat ng
  pintuan ay "auto" na - tingnan ang paliwanag doon) - ipinapakita
  nito ang `"E - " + door.label` sa ilalim-gitna ng screen kapag
  nakatayo ang player sa isang MAAABOT na pintuan. Dinagdagan ng bagong
  guard (`if (!door || door.auto) return;`) - HINDI ito lumalabas para
  sa mga pintuang "auto" pa rin (dahil awtomatiko na namang lumilipat
  ang mundo doon, walang saysay sabihin pang "pindutin ang E").
- **Para i-adjust:** pangalan ng bawat bahay sa prompt → `label` sa
  kaukulang `DOORS` entry (worlds.js). Kung gusto ring gawing "auto"
  ulit ang isang partikular na bahay (walang E), ibalik na lang ang
  `auto: true` doon.

### Entry #64 — Crafter/Stove: paglalagay ngayon ay LOOB LANG NG BAHAY, may 2-TILE na footprint, at may "placement preview" (16x16 na outline sa mouse). Bagong "Light" (1 tile, ON/OFF, may glow) - bagong file `light.js` + `placement.js`
- **Files (bago):** `js/placement.js`, `js/light.js`,
  `assets/objects/light/light.png` (2-frame strip, OFF/ON - GENERATED
  na placeholder pixel-art, PALITAN kung may tunay na art na).
- **Files (binago):** `js/craft.js`, `js/stove.js`, `js/dig.js`,
  `js/hotbar.js`, `js/draw.js`, `js/inventory-save.js`, `index.html`.

- **(a) Hiling ng user:** "yung mga item na nilalagay sa ground like
  crafter at stove is dapat mag-select ng tile sa MISMONG LOOB NG
  BAHAY, at kapag tinapat ang mouse, lilitaw ang 16x16 na tile
  (highlight) - kapag KALAHATI lang ang bakante, hindi puwedeng
  malagyan - crafter 2 tiles, stove 2 tiles din, kapag may nakalagay na
  sa isang tile, hindi na puwedeng malagyan pa - pero dapat may
  collisions ang stove (crafter man)."

- **Bagong SHARED file, `js/placement.js`** (dahil PAREHONG-PAREHO ang
  logic na kailangan ng Crafter/Stove/Light, hindi na inuulit kada
  file):
  - `PLACEMENT_FOOTPRINTS` - listahan kung ilang tile (pahalang,
    kanan) ang sinasakop ng bawat uri: `crafter`/`stove` = 2 tile,
    `light` = 1 tile lang. Dito lang babaguhin kung magbabago pa ang
    laki sa hinaharap.
  - `isInsideHouseWorld()` - GENERIC na "loob ba tayo ng bahay?" check,
    ginagamit ang `outdoor: false` na FLAG mismo ng `WORLDS`
    (worlds.js) - gumagana ito sa LAHAT ng interior (grassmapHouse +
    lahat ng bahay sa town), hindi kailangang i-hardcode ang listahan
    ng world keys, kaya awtomatikong susunod dito ang bagong bahay sa
    hinaharap.
  - `isPlacementTileFree(col,row)` - isang tile lang: false kapag labas
    sa mapa, may collision box (pader), may bagay sa isang "overlap"
    layer (kaparehong `getObjectCells` na ginagamit din ng paghukay,
    dig.js), pintuan ito, O may IBANG naka-lagay nang Crafter/Stove/
    Light/Bag na dito (`isPlacedStructureTileOccupied`).
  - `isFootprintPlaceable(itemId,col,row)` - LOOB LANG ng bahay
    (isInsideHouseWorld) AT LAHAT (hindi kalahati lang) ng tile ng
    buong footprint ay dapat FREE - ito ang TALAGANG GATEKEEPER, ginagamit
    ng `placeCrafterInWorld`/`placeStoveInWorld` (dating walang anumang
    validation - kahit saan/kahit anong tile puwede noon) at ng bagong
    `placeLightInWorld`.
  - `drawPlacementPreview()` - tinatawag ng `draw.js` (world space,
    loob ng camera transform) HABANG naka-highlight/"armed" ang isang
    Crafter/Stove/Light sa hotbar (`getArmedPlacementItemId`) - LUNTIAN
    na outline+fill kung puwedeng ilagay dito, PULA kung hindi (ito ang
    "kapag tinapat ko ang mouse, lilitaw ang 16x16 tile" na hiling) -
    kaparehong estilo/lineWidth-hati-sa-zoom ng `strokeDigCursorTile`
    (dig.js).
  - `getFootprintCollisionBox(itemId,col,row)` - bounding box (buong
    footprint, may kaunting inset) para sa collision - ginagamit ng
    `getPlacedCrafterCollisionBoxes`/`getPlacedStoveCollisionBoxes`
    (HINDI binago ang totoong "may collisions na" na gawi - NANDOON NA
    ito bago pa ang entry na ito, dinagdagan lang para sumakop sa 2 tile
    sa halip na 1).

- **`js/craft.js`/`js/stove.js`:** `placeCrafterInWorld`/
  `placeStoveInWorld` - dumaraan na ngayon sa `isFootprintPlaceable`
  bago itulak sa `placedCrafters`/`placedStoves` (kung hindi puwede,
  TAHIMIK lang na walang mangyayari, kaparehong "walang epekto" na gawi
  ng facing-check sa Entry #63). `getPlacedCrafterAt`/`getPlacedStoveAt`
  - hindi na simpleng col/row equality, KASAMA na ngayon ang BUONG
  2-tile na footprint (`getPlacementFootprintCells`), kaya ma-cli-click/
  ma-i-right-click ang ALINMAN sa 2 tile para buksan/sirain ito.
  Drawing (emoji ng Crafter, sprite ng Stove) - naka-sentro na sa GITNA
  ng 2-tile na footprint (dating 1 tile lang) - ganito rin ngayon ang
  `drawStoveLight` anchor.

- **Bagong `js/light.js`** ("Light" item, hiling ng user: "kapag sa
  light is 1 tile lang... madadagdag lang is yung ON/OFF, kapag OFF
  madilim, kapag ON gawin mong normal ang kulay ng paligid... lagyan mo
  muna ako ng isang light.png... dapat may function ilalagay ko sa
  tile sa loob ng bahay"):
  - Kaparehong-pareho ng pattern ng Crafter/Stove: `lightsCollected`
    (stock sa bag), bagong SHAPELESS recipe sa `craft.js`
    (`CRAFT_RECIPES`, 2 wood + 1 stone → 1 Light), bagong entry sa
    `BAG_ITEMS` (hotbar.js, icon: `assets/items/light.png` - ito yung
    NAUNA NANG asset sa `items/` folder, INVENTORY ICON lang ito).
  - `placeLightInWorld(col,row)` - dumaraan din sa `isFootprintPlaceable`
    ("light", 1 tile). `getPlacedLightAt` - simpleng col/row equality
    (1 tile lang naman ang footprint). WALANG sariling collision box
    ito (hindi bahagi ng literal na hiling - "stove...dapat may
    collisions" lang, hindi kasama ang Light) - madadaanan pa rin ito.
  - `toggleLight(light)` - ang "function ilalagay sa tile" na hiling -
    tinatawag ito ng `dig.js` (mousedown, KASAMA sa facing-check
    pattern ng Entry #63 - crafter/stove/bed/door) kapag NI-CLICK (habang
    ABOT AT NAKAHARAP) ang isang naka-lagay nang Light - simpleng
    `light.on = !light.on`, walang bukas na panel.
  - `breakPlacedLight(light)` - i-RIGHT-CLICK para tanggalin (kaparehong
    gawi ng `breakPlacedCrafter`/`breakPlacedStove` - lumalabas muna
    bilang floating ground item, kailangan pa itong damputin).
  - **Bagong asset `assets/objects/light/light.png`** - 2-FRAME na
    horizontal strip (16x16 kada frame: frame 0 = OFF/madilim, frame 1
    = ON/maliwanag) - GINAWA/GENERATED na simpleng pixel-art na
    lampara (Python/PIL script, hindi tunay na iginuhit/in-upload ng
    user) bilang PANSAMANTALANG placeholder - PALITAN na lang ang file
    na ito (parehong dimensions/frame layout) kung may tunay na art na.
  - `drawPlacedLightGlow()` - kaparehong-estilo ng `drawStoveLight`/
    `drawTorchLight` (atmosphere.js): bilog, "lighter"/additive blend,
    SCREEN SPACE, sa IBABAW ng araw/gabi tint - PERO mas MALAKAS ang
    intensity (0.95 sa gitna, laban sa 0.55-0.6 ng torch/stove) at mas
    MALAWAK ang radius (95px laban sa 40-70px) - dahil ito talaga ang
    "gawin mong NORMAL ang kulay ng paligid" na hiling, hindi lang
    "dagdag na init/ambiance". AKTIBO lang ito kapag `light.on === true`
    - kapag OFF, WALANG dagdag na epekto (nananatili ang normal na
    araw/gabi tint mula sa `atmosphere.js`, PAREHONG-PAREHO ito sa
    dating logic - ito mismo ang "parang ganun pa rin ang logic ngayon"
    na sinabi ng user).

- **`js/inventory-save.js`:** dinagdagan ng `light`/`placedLights` ang
  serialize/load/reset paths - kaparehong-pareho ng ginawa na para sa
  `stove`/`placedStoves` (kung hindi, mawawala ang mga naka-lagay na
  Light at ang stock nito tuwing mag-reload).

- **`index.html`:** dinagdag ang `<script src="./js/placement.js">`
  (pagkatapos ng `ground-items.js`, bago ang `hotbar.js` - kailangan
  ang `TILE_SIZE`/`mapData`/`collisions`/`DOORS`/`getObjectCells`, LAHAT
  ay na-load na sa puntong ito) at `<script src="./js/light.js">`
  (pagkatapos ng `stove.js`, bago ang `inventory-save.js` - kailangan
  ang `BAG_ITEMS`/`pinnedSlots` mula sa `hotbar.js`).

- **Sadyang HINDI kasama/binago:** ang orientation ng 2-tile na
  footprint (crafter/stove) ay FIXED na PAHALANG papuntang KANAN
  (`col`, `col+1`, parehong `row`) - hindi ito sumusunod sa
  `player.direction` - kung gusto pa itong gawing adaptive (hal.
  paitaas/pababa depende sa direksyon ng paglalagay), doon sa
  `PLACEMENT_FOOTPRINTS`/`getPlacementFootprintCells` (placement.js)
  gagawin ang pagbabago.
- **Para i-adjust:** laki ng footprint kada item → `PLACEMENT_FOOTPRINTS`
  (placement.js). Kulay/lakas ng "preview" outline →
  `drawPlacementPreview` (placement.js). Lakas/radius ng glow ng Light
  → `LIGHT_GLOW_RADIUS`/`LIGHT_GLOW_COLOR` (light.js). Recipe ng Light
  → `CRAFT_RECIPES` (craft.js).

### Entry #65 — Itsura ng naka-lagay na Crafter/Stove/Light = MISMONG inventory icon na (hindi na emoji/animated sprite), garantisadong hindi lumalabas sa 16x16 grid, at "buong silid" na warm na tint kapag may Light na ON
- **Files (binago):** `js/placement.js`, `js/craft.js`, `js/stove.js`,
  `js/light.js`. **Files (tinanggal):** `assets/objects/light/`
  (generated placeholder ng Entry #64 - PALITAN na ng `assets/items/light.png`).

- **(a) Hiling ng user:** "mali yung tile dapat exact 16x16 - check mo
  yung naka-attached image dapat ganyan yung tile 16x16, tapos ibahin
  mo itsura ng stove at crafter dapat kung ano yung nasa inventory na
  itsura, tapos yung sa light.png yun gamitin mong light, tapos yung
  ganyang kulay ng room dapat ganyan itsura kapag na open yung ilaw,
  tapos off naman normal na kapag night".

- **VERIFIED na BUGROOT ng "mali yung tile":** sa dating
  `drawPlacedStoves` (stove.js, Entry #64), ang `drawHeight` ay
  KINUWENTA base sa TALAGANG aspect ratio ng sprite
  (`(drawWidth/frameWidth)*frameHeight`) - kung MATANGKAD ang orihinal
  na larawan, LUMALAGPAS ang guhit sa ITAAS ng sariling 1-tile-tall na
  footprint row, hindi na tumutugma sa 16x16 grid ng mapa.

- **Bagong SHARED helper, `drawSpriteContainedInBox(image,x,y,w,h)`**
  (placement.js) - "contain" fit (HINDI STRETCH/HINDI DISTORT):
  pinapanatili ang aspect ratio ng orihinal na larawan, pinapaliit
  LANG hanggang kumasya ito sa box, naka-sentro pahalang, naka-ANCHOR
  SA ILALIM (parang nakatayo sa sahig) - GARANTISADONG hindi na ito
  lalabas sa box kahit anong hugis pa (parisukat man o matangkad) ang
  orihinal na larawan. Ito ang ginagamit ngayon ng LAHAT (Crafter/
  Stove/Light) sa halip na basta `ctx.drawImage` na naka-stretch sa
  buong box.

- **`js/craft.js` (`drawPlacedCrafters`):** gumagamit na ng
  `CRAFTER_SPRITE_IMAGE` = `assets/items/crafter.png` (ang MISMONG
  icon sa bag/hotbar) sa halip na emoji ("🛠️"), guguhitin sa loob ng
  2-tile na box (`drawSpriteContainedInBox`).
- **`js/stove.js` (`drawPlacedStoves`):** gumagamit na ng
  `STOVE_SPRITE_IMAGE` = `assets/items/stove.png` (static na icon) sa
  halip na ang LUMANG animated na sprite
  (`assets/objects/stove/stove.png`, 6-frame) - **TINANGGAL na ang
  buong "cooking animation"** ng world sprite (`getStoveAnimFrameIndex`/
  `STOVE_SPRITE_FRAME_COUNT`/`STOVE_COOK_FRAME_MS`, wala nang
  gumagamit) - HINDI ito nakaapekto sa apoy-glow na `drawStoveLight`
  (hiwalay/nananatili pa rin, base pa rin sa `isStoveActivelyCooking`).
- **`js/light.js`:**
  - `LIGHT_SPRITE_IMAGE` = `assets/items/light.png` na ngayon (dating
    generated placeholder sa `assets/objects/light/light.png`, 2-frame
    OFF/ON - TINANGGAL na ang buong folder na iyon). Iisang larawan na
    lang (walang hiwalay na frame), ang ON/OFF ay sa `ctx.filter` na
    lang: `"none"` (normal) kapag ON, `"grayscale(70%) brightness(0.55)"`
    (madilim/walang-kulay) kapag OFF.
  - `drawPlacedLightGlow()` - **BINAGO mula sa maliit na radial
    gradient papunta sa BUONG-SCREEN na warm wash** (`ctx.fillRect(0,
    0, canvas.width, canvas.height)`, "lighter" blend, kulay
    `LIGHT_ROOM_TINT_COLOR` = "255, 214, 150") - hiling ng user
    (reference screenshot niya): "yung ganyang kulay ng room dapat
    ganyan itsura kapag na open yung ilaw" - BUONG SILID (hindi lang
    lugar malapit sa lamp) ang nagiging warm/maliwanag, dahil maliit
    lang naman ang bawat silid sa laro. AKTIBO lang ito kapag may
    KAHIT ISANG Light na `on === true` sa kasalukuyang mundo
    (`placedLights.some(...)`) - kapag WALA (lahat OFF, o walang
    naka-lagay), WALANG dagdag na epekto, nananatili ang normal na
    araw/gabi na dilim (`atmosphere.js`, hindi ito ginalaw) - ito ang
    "off naman normal na kapag night" na hiling.

- **Sadyang HINDI kasama/binago:** hindi ginalaw ang collision
  (crafter/stove) o ang facing-check/toggle logic (light) - itong
  Entry na ito ay PURONG VISUAL lang (itsura ng sprite + kulay ng
  ilaw), walang binago sa mechanics/placement rules ng Entry #64.
- **Para i-adjust:** kulay/lakas ng "buong silid" na warm wash →
  `LIGHT_ROOM_TINT_COLOR` at ang `0.65` multiplier sa
  `drawPlacedLightGlow` (light.js). Kung gusto pang gawing "contain"
  fit (hindi stretch) ang IBANG existing na sprite sa laro sa
  hinaharap → gamitin na lang ang `drawSpriteContainedInBox`
  (placement.js).

### Entry #66 — Sprite ng Crafter/Stove/Light dapat SAKOP ang BUONG LAPAD ng footprint (hindi lumiit), at Light: tinanggal ang facing-check + dagdag na "laging nakikita" na glow indicator (araw man o gabi) para talagang MAKITA agad ang ON/OFF
- **Files:** `js/placement.js`, `js/craft.js`, `js/stove.js`,
  `js/light.js`, `js/dig.js`.

- **(a) Hiling ng user:** "try mo gawin yung size ng pinasa kong image
  na crafter at stove at light dapat ganun kalaki sakop yung 2 tiles,
  tapos yung light di nag switch on/off di nalitaw".

- **VERIFIED na dahilan ng "lumiit"/hindi sakop ang 2 tile:** ang
  `drawSpriteContainedInBox` (Entry #65) ay "contain" fit - kinukuha
  ang MAS MALIIT sa dalawang scale (base sa width AT height). Dahil
  HALOS PARISUKAT ang `crafter.png`/`stove.png` (33x32) habang
  MALAWAK/MABABA ang box nila (32x16 - 2 tile x 1 tile), ang HEIGHT
  ang naging LIMITING FACTOR - kaya LUMIIT ang larawan (~16px na lang
  ang lapad, HINDI ang inaasahang 32px/2-tile).
- **Ayos - `drawSpriteFillWidthInBox` (placement.js, PINALITAN ang
  `drawSpriteContainedInBox`):** ang LAPAD (width) na ngayon ang
  IPINIPILIT na EKSAKTO/kasing-lapad ng buong box (hal. 32px para sa
  2-tile) - awtomatikong sumusunod ang TAAS sa TALAGANG aspect ratio
  (hindi nastretch/nadistort), kahit LUMAGPAS ito sa taas ng
  sariling 1-tile-tall na row (karaniwan sa top-down na laro - mas
  matangkad ang guhit kaysa "footprint" sa sahig, gaya ng
  crafter/stove/fridge sa reference image ng user) - naka-ANCHOR SA
  ILALIM pa rin (ang ILALIM lang ang GARANTISADONG eksakto sa grid).
  Resulta: crafter/stove ≈ 32x31px (buong 2-tile na lapad), light ≈
  16x38px (buong 1-tile na lapad, mas matangkad - katulad ng floor
  lamp).

- **(b) "Light di nag switch on/off di nalitaw":**
  - **`js/dig.js`:** TINANGGAL ang facing-check (`isPlayerFacingTile`)
    bago payagan ang `toggleLight` - hindi naman talaga ito bahagi ng
    literal na hiling noon ("stove, crafter, bed, door" lang sa Entry
    #63) - sapat na ang ABOT (`isTileInReach`). Dating kung minsan
    "parang walang nangyayari" ang click kapag hindi eksaktong
    nakaharap ang player sa maliit (1-tile) na Light.
  - **`js/light.js` (`drawPlacedLights`):** dagdag na "laging
    nakikita" na maliit na glow (radial gradient, "lighter" blend) sa
    paligid ng bumbilya mismo kapag `light.on === true` - HINDI ito
    naka-batay sa gabi/`getNightAmount` (dating ang TANGING
    pagkakaiba ng ON/OFF ay yung buong-silid na wash sa
    `drawPlacedLightGlow`, na AKTIBO lang KAPAG GABI - kaya kung araw
    ang pag-tetest, WALANG anumang makikitang pagbabago). Pinalakas
    din ang OFF-dimming (`grayscale(90%) brightness(0.4)` +
    `globalAlpha 0.85`, dating `70%`/`0.55`/walang alpha) para mas
    kitang-kita ang pagkakaiba.
- **Sadyang HINDI kasama:** hindi ginalaw ang buong-silid na warm wash
  (`drawPlacedLightGlow`) - GABI PA RIN ito lang lumalabas (sadya
  itong batay sa "kapag gabi na" sa orihinal na hiling) - ang BAGO
  dito ay ang MALIIT na LOCAL na glow LANG (laging nakikita, hindi
  batay sa oras).
- **Para i-adjust:** lakas/radius ng "laging nakikita" na glow →
  `glowRadius`/`glowGradient` sa loob ng `drawPlacedLights` (light.js).

### Entry #67 — Naayos: grass1/grass2/grass3 (grass.js) ay TALAGANG NAG-OOVERLAP PA RIN sa puno (hal. pinetree) KAHIT may naunang "order: -2" tie-break fix
- **File:** `js/grass.js` (`isGrassTuftNearOccludingTree` - bago, `drawGrassTuftsForeground`, `getGrassTuftDrawables`)
- **Sanhi:** ang naunang fix (`order: -2` sa `getGrassTuftDrawables`, tingnan
  ang komento doon) ay TAMA lang para sa NORMAL na Y-sort na pagguhit
  (`drawGrassTuftSpriteWhole`/`Back`) - PERO WALANG epekto ito sa
  `drawGrassTuftsForeground()`: ang FRONT/TOP na piraso ng isang
  KASALUKUYANG naaapakang tumpok (player physically standing on that
  grass tile) ay laging iginuguhit doon nang UNCONDITIONAL, tinatawag
  PAGKATAPOS ng buong `drawMapObjects()` sa `draw.js` - walang Y-sort,
  walang comparison laban sa kahit anong puno. Kaya kung ang natatapakang
  tumpok ay nasa loob/tabi ng canopy ng isang matangkad na puno
  (pinetree), ang FRONT piece nito ay LAGING lalabas SA IBABAW ng puno
  - ito ang TALAGANG dahilan kung bakit "still overlapping" kahit may
  order-based fix na.
- **Ayos:** bagong `isGrassTuftNearOccludingTree(tuft)` - kinukuha ang
  BUONG visual bbox ng tumpok (`computeGrassTuftGeometry`) at chinicheck
  kung nag-o-`isColliding` ito laban sa `getTreeOcclusionBbox` (resources.js,
  PAREHONG bbox na ginagamit na para sa puno/player see-through occlusion)
  ng KAHIT ANONG puno sa `resourceNodesCache.trees`. Kung OO:
  - `drawGrassTuftsForeground()` - LALAKTAWAN na ito, hindi na i-fo-force
    sa harap.
  - `getGrassTuftDrawables()` - hindi na ituturing na "currently
    overlapped" (kahit TALAGANG naaapakan) - babalik sa NORMAL na Y-sort
    (`drawGrassTuftSpriteWhole`, may `order: -2` tie-break pa rin) sa
    halip, kaya TALAGANG mananalo/nasa harap ang puno kapag dapat.
  - Bend/skew animation at leaf particle effect ay HINDI naaapektuhan
    (hiwalay na state ito sa `grassBendState`/`grassTouchedLastFrame`) -
    tama pa rin ang "pagyuko" ng damo kahit hindi na siya masi-split.
- **Para i-adjust:** kung gusto pang mas maluwag/mahigpit ang "malapit sa
  puno" na check, i-adjust ang 0.9 scale sa loob ng `getTreeOcclusionBbox`
  (resources.js) - ginagamit din ito ng ibang occlusion logic, kaya
  mag-ingat sa side-effects.

### Entry #68 — Naayos: puno (lalo na pinetree) ay nagfa-fade/nagiging see-through habang AKTIBONG hinahampas ng axe - "erase the opacity of the pinetree when using axe"
- **File:** `js/resources.js` (`getResourceDrawables` - `isBeingAxeStruck` branches)
- **Sanhi:** Entry #? na naunang fix ("gawing likod ng puno ang axe
  animation") ay nag-fo-force ng `drawSortY = Number.MAX_SAFE_INTEGER`
  PARA sa puno habang `isBeingAxeStruck` (para lumabas na "nasa likod ng
  puno" ang kamay/axe ng player) - PERO KASABAY pa rin nito ang normal na
  `bbox: getTreeOcclusionBbox(...)`. Dahil MAS MALAKI/HARAP na ang
  sortY ng puno PERO nag-o-overlap pa rin ang bbox nito sa player, ito
  mismo ang trigger ng `shouldOccludeForPlayer` (map.js) - kaya
  AWTOMATIKONG nagiging see-through/naka-fade ang PUNO sa BUONG axe
  swing, hindi lang habang tinatago ng puno ang player.
- **Ayos:** kapag `isBeingAxeStruck === true`, `bbox: undefined` na ang
  ipinapasa sa drawable (sa halip na `getTreeOcclusionBbox(...)`) - dahil
  ang `shouldOccludeForPlayer` ay agad nagre-return ng `false` kapag
  walang `bbox` ang item (`if (item.isPlayer || !item.bbox) return
  false`), kaya WALANG fade na mangyayari habang mismong humahampas ang
  axe - SOLID/opaque ang puno, pero nananatili pa rin sa HARAP
  (`drawSortY`) kaya tama pa rin ang dating "axe parang nasa likod ng
  puno" na epekto. Sa sandaling matapos na ang swing
  (`isBeingAxeStruck` false ulit), bumabalik ang normal na
  occlusion/fade kapag TALAGANG likod ng puno ang player.
- **Sakop:** parehong branch - ang pinetree axe-strike-frame (may `hits
  > 0` na) AT ang normal/idle na drawTreeSprite branch (kapag first
  swing pa lang, `hits === 0`). Hindi kailangang galawin ang fall-frame
  branch (`getPinetreeFallProgress`) - hindi na kasabay ng aktibong axe
  swing ang pagbagsak.

### Entry #69 — Naayos: pinetreecutanimation (pagbagsak ng puno) ay nagfa-fade/nagiging see-through pa rin kahit hindi na aktibong hinahampas ng axe + TINANGGAL na ang lahat ng umiikot na "blackhole" gate visual
- **Files:** `js/resources.js` (`getResourceDrawables` - fall-frame branch),
  `js/decor.js`, `js/draw.js`
- **(a) Pinetree fall animation opacity:**
  - **Sanhi:** ang Entry #68 fix ay TAMA na para sa AKTIBONG axe swing
    (`isBeingAxeStruck`) - PERO ang "pagbagsak" na animation frame
    (`drawPinetreeFallFrame`, tumatakbo na PAGKATAPOS ng ika-7 hit,
    HINDI na `isBeingAxeStruck`) ay may HIWALAY na drawable na LAGING
    may `bbox: getTreeOcclusionBbox(...)` (walang guard) - kaya kahit
    "normal" na (hindi na hinahampas) ang puno habang bumabagsak,
    puwede pa rin itong mag-fade kung nag-o-overlap ang bbox sa player.
  - **Ayos:** tinanggal na ang `bbox` sa drawable na ito - WALANG
    occlusion/fade na mangyayari sa buong "pagbagsak" na animation,
    LAGING normal/opaque ito.
- **(b) "Blackhole" gate visual - tinanggal sa lahat:**
  - **Sanhi:** may umiikot na "blackhole" na ground decal
    (`blackhole.png`, 6-frame animation) na dating dinadraw sa DALAWANG
    gate (`drawTownPathGatePatch` sa "town", `drawNewmapReturnGatePatch`
    sa "grassmap") - purely visual/decorative lang ito, hiwalay sa
    aktwal na pag-teleport (`DOORS`, worlds.js, sariling
    area/coordinates).
  - **Ayos:** tinanggal na ang parehong function, ang lahat ng
    kaugnay na constants (`TOWN_GATE_BLACKHOLE_*`, `TOWN_PATH_GATE_*`,
    `NEWMAP_RETURN_GATE_*`), at ang image loader
    (`townGateBlackholeImage`) sa `decor.js`, pati na ang mga tawag
    dito sa `draw.js`. HINDI naapektuhan ang aktwal na pag-lipat ng
    mundo sa pagitan ng "town" at "grassmap" - gumagana pa rin ito
    nang normal (walang visual na gate/portal na lang na nakikita sa
    lugar na iyon).
  - **Hindi tinanggal:** ang `assets/objects/blackhole.png`/
    `blackhole-sheet.png` na file mismo - naiwan lang ito nang hindi
    ginagamit, ligtas namang burahin nang manual kung gusto.

### Entry #70 — "still not fix the opacity when strike" - TALAGANG TAMA na pala ang Entry #68/#69 fix, PERO HINDI NAKAKARATING sa browser dahil hindi na-bump ang `?v=` cache-bust ng mga nabagong file
- **File:** `index.html` (mga `<script src="./js/....js?v=...">` tag)
- **Sanhi:** dokumentado mismo sa itaas ng file na ito ("Cache-busting:
  may `?v=<timestamp>` ang bawat script sa index.html") - kailangang
  I-BUMP ang `?v=` ng ISANG file sa TUWING binabago ito, kundi
  patuloy na ang LUMANG/CACHED na bersyon ang pinapatakbo ng browser
  (o ng naka-bundle na WebView sa mobile app), KAHIT TAMA na ang
  code sa mismong file sa disk. Sa mga naunang round (Entry #68 -
  "erase the opacity of the pinetree when using axe", Entry #69 -
  pinetree fall animation opacity + blackhole removal), NABAGO na ang
  `resources.js`/`decor.js`/`draw.js`/`grass.js` PERO hindi na-bump
  ang kani-kanilang `?v=` dito sa `index.html` - kaya "still not fix"
  pa rin ang naramdaman/nakita ng user (LUMANG bersyon pa rin
  talaga ang tumatakbo).
- **Ayos:** binump ang `?v=` ng apat na apektadong file:
  - `resources.js` → `1800000000013`
  - `decor.js` → `1800000000014`
  - `grass.js` → `1800000000015`
  - `draw.js` → `1800000000016`
- **Para maiwasan ito sa hinaharap:** TUWING may binabago sa isang
  `.js` file, siguraduhing NAKA-BUMP din ang kaukulang `?v=` nito dito
  sa `index.html` (mas mataas na numero kaysa sa lahat ng nauna) -
  kung hindi, hard-refresh/clear-cache man ng user ay HINDI sapat
  dahil parehong URL (walang pagbabago sa query string) pa rin ang
  hinihiling ng browser sa network/service-worker cache.

### Entry #71 — "still have opacity, check the video ... i want only the shaking not opacity" - naka-flicker/kumikislap pala ang fade sa PAGITAN ng bawat swing (VERIFIED sa video ng user)
- **File:** `js/resources.js` (`getResourceDrawables` - naging
  `suppressFadeForAxe`, dating `isBeingAxeStruck` din ang gamit sa
  `bbox`)
- **Sanhi (nakita sa frame-by-frame na pag-inspect ng na-upload na
  video):** TAMA na ang Entry #68/#69 fix (walang bbox
  literal na HABANG kumikilos ang swing animation
  `player.putting && puttingSpriteSet === "axeStrike"`) - PERO ang
  buong swing ANIMATION ay MAIKLI lang (~350ms, `AXE_STRIKE_FRAME_COUNT`
  × `AXE_STRIKE_FRAME_SPEED`) kumpara sa `RESOURCE_HIT_COOLDOWN_MS`
  (1000ms) bago pa man muling makapag-click ang user. Sa ~650ms na
  PUWANG sa PAGITAN ng dalawang magkasunod na hampas, `player.putting`
  ay `false` na (tapos na ang isang swing), kaya bumabalik ang NORMAL
  na occlusion `bbox` doon - PALIT-PALIT/KUMIKISLAP ang opacity ng
  puno sa BUONG "combo" (opaque habang swinging, faded sa pagitan) sa
  halip na TULUYANG mawala - ito mismo ang nakita sa video.
- **Ayos:** hiniwalay ang DALAWANG bagay na dating iisa lang
  (`isBeingAxeStruck`):
  - `isSwingingAxeAtThisTree` - PANANATILIHIN, literal na "kumikilos
    ang swing animation ngayon" - ginagamit LANG para sa `drawSortY`
    (force sa harap, para tama ang "axe parang nasa likod ng puno").
  - `suppressFadeForAxe` (BAGO) - `axeStrikeTargetTreeKey === key`
    (kasalukuyang tinatarget) AT may hampas na naitala sa loob ng
    bagong `AXE_STRIKE_NO_FADE_GRACE_MS` (1400ms, mas mahaba kaysa sa
    `RESOURCE_HIT_COOLDOWN_MS` para SAKUP ang buong puwang sa pagitan
    ng dalawang swing) - ITO na ang gamit sa `bbox` (kapag `true`,
    `undefined` ang bbox, walang fade) - LAGING solid/opaque ang puno
    sa BUONG combo, hindi lang sa bawat individual na swing, kaya wala
    nang "kislap".
  - Bumabalik lang ang normal na fade sa sandaling TALAGANG tumigil
    (o lumipat ng ibang target) ang user nang lampas sa grace period.
- **Cache-bust:** binump ulit ang `?v=` ng `resources.js` sa
  `index.html` → `1800000000017` (tingnan ang Entry #70 - kailangan
  ITO sa TUWING may binabago sa isang `.js` file).
- **Para i-adjust:** kung sobrang tagal/maikli pa rin ang "grace" →
  `AXE_STRIKE_NO_FADE_GRACE_MS` (resources.js).

### Entry #72 — BAGONG Main Menu (Loading → Play / Load / Settings / Exit) bago mag-umpisa ang laro
- **Files:** `index.html` (bagong `#main-menu-overlay`), `style.css`
  (bagong seksyon), `js/map.js` (`beginInitialWorldLoad`, bago),
  `js/settings-menu.js` (`exitGame`, hiniwalay mula sa click handler),
  `js/main-menu.js` (BAGONG file)
- **Context:** una, tinanong ng user kung puwedeng gumawa ng
  register/login (online account) system - pinili niyang gamitin sana
  ang Supabase/Firebase, PERO nag-isip-isip ulit at sinabing "wag muna
  mag online" - sa halip, gusto niya na lang ng isang SIMPLENG main
  menu (Loading/Play/Load/Settings/Exit) bago pumasok sa laro. Walang
  backend/account system na ipinatupad - purong client-side/local pa
  rin ang laro (kagaya ng dati).
- **Dating gawi:** deretso agad pumapasok ang laro sa huling naka-save
  na mundo (o DEFAULT_WORLD kung wala pa) sa sandaling ma-parse ang
  script - walang anumang menu bago noon.
- **Bagong gawi:**
  1. Ang dating awtomatikong pagtawag sa `loadWorld()` sa DULO ng
     `map.js` (naghihintay muna sa `GRASSMAP_RESOURCES_LOADED`) ay
     inilipat sa loob ng bagong `beginInitialWorldLoad()` function -
     HINDI na ito awtomatikong tumatakbo.
  2. Bagong full-screen na `#main-menu-overlay` (index.html,
     pinakamataas na z-index sa buong laro, 1000) - dalawang estado:
     - `#main-menu-loading` (default visible) - "Naglo-load..." habang
       hinihintay ang `GRASSMAP_RESOURCES_LOADED` promise.
     - `#main-menu-content` (lumalabas sa sandaling tapos na ang
       paghihintay sa itaas) - 4 na button: **Play**, **Load**,
       **Settings**, **Exit**.
  3. `js/main-menu.js` (bago) - ikinakabit ang click listeners:
     - **Play:** itinatago ang overlay (`hideMainMenuOverlay`), tapos
       tinatawag ang `beginInitialWorldLoad()` (map.js) - dito lang
       TALAGA nagsisimula ang laro.
     - **Load:** tinatawag ang PAREHONG `openLoadSlotsPopup()` na
       ginagamit na ng in-game na burger-menu "Load" (settings-menu.js,
       may listahan ng save slots) - pagpili ng slot doon ay
       nagre-reload ng WHOLE page (existing behavior, hindi ginalaw) -
       kaya babalik muna sa main menu ito pagkatapos mag-reload
       (dahil "Play" pa rin ang TANGING nagsisimula ng laro), TALAGANG
       papasok na sa na-load na save sa kasunod na pagpindot ng "Play".
     - **Settings:** tinatawag ang existing `openSettingsPanel()`.
     - **Exit:** tinatawag ang bagong `exitGame()` (settings-menu.js -
       hiniwalay lang mula sa dating click handler ng in-game na
       "Exit", PAREHONG lohika/mensahe pa rin - `window.close()` +
       toast fallback).
     - "Play"/"Load" ay naka-disable muna habang naghihintay pa sa
       `GRASSMAP_RESOURCES_LOADED`.
  4. `style.css` (bagong seksyon "MAIN MENU") + binump ang z-index ng
     `#settings-panel` (31 → 1010) at `#load-slots-overlay` (45 →
     1010) - dahil puwede na ngayon itong buksan MULA sa main menu
     (bago pa man mag-umpisa ang laro), kailangang mas mataas pa sa
     `#main-menu-overlay` (1000) para talagang makita/ma-click.
- **Sadyang hindi ginalaw:** ang gameLoop (main.js) ay TULOY-TULOY pa
  ring tumatakbo (update/draw) kahit habang naka-display pa ang main
  menu - ligtas lang ito dahil ang halos LAHAT ng subsystem ay may
  `mapReady`/`currentWorld` guard na (kaparehong-pareho ng paraan ng
  paggamit nito habang `worldLoading` sa mga door transition) - itim
  lang/walang laman ang canvas sa likod ng buong-screen na overlay.
- **Cache-bust:** binump ang `?v=` ng `style.css` (1800000000019),
  `map.js` (1800000000020), `settings-menu.js` (1800000000021), at
  bagong `main-menu.js` (1800000000018) sa `index.html` (tingnan ang
  Entry #70 - kailangan ITO sa TUWING may binabago sa isang file).

### Entry #73 — Naayos: bahagyang "nakikita pa rin" ang laman ng laro (HUD/calendar/burger icon) SA LIKOD ng main menu sa mobile (VERIFIED via Playwright mobile screenshot)
- **File:** `style.css` (`#main-menu-overlay` background)
- **Sanhi:** ang radial-gradient na background ng `#main-menu-overlay`
  ay may alpha na `0.97`/`0.99` (halos-opaque lang, hindi TALAGANG
  `1`) - kaya sa ilalim ng mobile na screenshot, bahagyang
  "nagbabakas"/nakikitang malabo pa rin ang HUD (pangalan/health bar),
  calendar, at burger-menu icon sa likod nito.
- **Ayos:** ginawang ganap na `1` (opaque) ang parehong alpha stop ng
  gradient - solid na ngayon ang overlay, wala nang anumang
  "nagbabakas" mula sa laro sa likod nito.
- **Cache-bust:** binump ulit ang `?v=` ng `style.css` →
  `1800000000022`.
