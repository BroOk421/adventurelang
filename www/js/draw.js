// =========================
// DRAW
// =========================

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  camera.follow();

  ctx.save();

  ctx.scale(camera.zoom, camera.zoom);

  // I-snap ang camera sa pinakamalapit na DEVICE pixel (isinasaalang-
  // alang ang zoom), hindi sa pinakamalapit na world-pixel. Kapag
  // world-pixel lang ang ginamit, malaki ang bawat "step" (1 world-unit
  // = 5 device-pixel dahil sa zoom mo), kaya kitang-kita/nanginginig
  // ang galaw. Dito, mas pino ang steps (1 device-pixel lang bawat
  // step), kaya halos hindi na mapapansin pero wala pa ring seams sa
  // pagitan ng mga tiles.
  const snappedCameraX = Math.round(camera.x * camera.zoom) / camera.zoom;
  const snappedCameraY = Math.round(camera.y * camera.zoom) / camera.zoom;

  ctx.translate(-snappedCameraX, -snappedCameraY);

  ctx.imageSmoothingEnabled = false;

  drawMapBackground();

  // BAGO (hiling ng user): "yung lightray nung bahay is dapat
  // nakapailalim sa tao at sa grass at sa trees" - dating iginuguhit
  // ito NA HULI (screen space, PAGKATAPOS ng drawDayNight/drawMapObjects
  // - tingnan ang dating paliwanag sa loob ng atmosphere.js), kaya
  // NASA IBABAW ito ng LAHAT (player, damo, puno) - lumipat na dito
  // (WORLD SPACE, PINAKAUNA - kaagad pagkatapos ng background, bago pa
  // man ang damo) - kaya AWTOMATIKONG natatakpan na ito ng damo/puno/
  // player (Y-sorted/normal na draw-order occlusion na lang, hindi na
  // kailangan pang umasa sa dating "masked na pinetree cutout" trick
  // - naiwan pa rin iyon sa atmosphere.js, pero redundant/hindi na
  // mahalaga ngayon, dahil AWTOMATIKO nang natatakpan ang ray ng
  // KAHIT ANONG puno/damo/player sa itaas nito).
  if (typeof drawGrassmapHouseLightray === "function")
    drawGrassmapHouseLightray();

  // Ang damo (kapag matagal nang tila ang niyebe) - sa ibabaw ng snow
  // layer, sa ilalim ng mga hinukay na tile.
  drawGrass();

  // Habang aktibong umuulan ng niyebe: unti-unting natatabunan ng
  // puting niyebe ang lupa - sa ibabaw ng damo, pero sa ilalim pa rin
  // ng mga hinukay na tile (para makita mo pa rin ang farm mo).
  drawSnowGroundCover();

  // Ang mga nahukay na tile (niyebe -> lupa) ay nasa ibabaw ng snow
  // layer at ng damo, pero sa ilalim ng lahat ng iba - kapareho ng bakas.
  drawDugTiles();

  // Nasa LUPA ang mga bakas - sa ibabaw ng niyebeng nakalatag, pero sa
  // ilalim ng puno, bahay, at ng player. Kaya nasa loob pa rin sila ng
  // camera transform (world space).
  drawFootprints();

  // AYOS (hiling ng user): "alisin mo na yung mga blackhole erase mo
  // na sa lahat" - TINANGGAL na ang umiikot na "blackhole" ground decal
  // sa magkabilang gate (town<->grassmap) - tingnan ang buong
  // paliwanag/TINANGGAL na code sa decor.js ("GATE PATUNGONG TOWN").
  // Hindi naman kailangan ng mismong pag-teleport (DOORS, worlds.js) -
  // hiwalay at independent ang area/coordinates niyan sa visual na ito.

  // Mga item na nakalapag sa lupa (galing sa ani o inihagis) - nasa
  // ibabaw ng lupa, sa ilalim ng player (nalalakaran).
  drawGroundItems();

  // Mga naka-lagay na Crafter (crafting table) - PERMANENTENG bagay sa
  // mundo, hindi tulad ng groundItems (tingnan ang craft.js).
  if (typeof drawPlacedCrafters === "function") drawPlacedCrafters();

  // Mga naka-lagay na Stove (cooking station) - kaparehong-pareho ng
  // gawi ng Crafter (tingnan ang stove.js).
  if (typeof drawPlacedStoves === "function") drawPlacedStoves();

  // Mga naka-lagay na Bag (backpack, "Drop" mula sa inventory) -
  // kaparehong-pareho ng gawi ng Crafter/Stove (tingnan ang hotbar.js).
  if (typeof drawPlacedBags === "function") drawPlacedBags();

  // Mga naka-lagay na Light (1 tile, may ON/OFF) - kaparehong-pareho ng
  // gawi ng Crafter/Stove/Bag (tingnan ang light.js).
  if (typeof drawPlacedLights === "function") drawPlacedLights();

  // Mga naka-lagay na Bed (2x3 tiles) - BAGO (hiling ng user): kaparehong-
  // pareho na ngayon ito sa Crafter/Stove/Light/Bag (naka-hold, may
  // collision, PERMANENTENG structure na sa mundo) - dating fixed/laging
  // naroroon na lang ito sa bawat bahay (drawBed sa itaas ng file na
  // ito, dati) - tingnan ang bed.js.
  if (typeof drawPlacedBeds === "function") drawPlacedBeds();

  // Ang outline ng tile na tinututukan ng mouse - nasa lupa rin, para
  // hindi ito pumatong sa puno o sa player.
  drawDigCursor();
  drawResourceCursor();

  // BAGONG "placement preview" - 16x16 (kada tile) na outline sa
  // ibabaw ng tinuturo ng mouse habang naka-highlight/armed ang isang
  // Crafter/Stove/Light sa hotbar (tingnan ang placement.js) - LUNTIAN
  // kapag puwedeng ilagay, PULA kapag hindi (kalahati lang ang
  // bakante, may nakalagay na, o wala sa loob ng bahay).
  if (typeof drawPlacementPreview === "function") drawPlacementPreview();

  ctx.restore();

  // Ang malalayong niyebe ay nasa LIKOD ng lahat - natatakpan sila ng
  // puno, bahay, at ng player. Dito nanggagaling ang pakiramdam na nasa
  // LOOB ka ng pagbagsak ng niyebe, hindi nakatingin lang sa likod ng
  // salamin.
  drawSnow("back");

  // Mga sparkle ng niyebe/splash ng ulan na kumikislap kahit saang tile -
  // kaparehong teknik/posisyon ng snow "back" sa itaas, kaya nasa
  // ILALIM din ito ng player/mga bagay (drawMapObjects sa ibaba).
  drawSnowGroundSparkles();
  drawRainGroundSplashes();

  // BAGO (hiling ng user - ULIT): "dapat lahat mag-black, pati house
  // ground, pati paligid" - BINAWI na ang dating "ground laging tunay
  // na kulay" na eksperimento (kasama ang off-screen na objects-layer
  // na ginamit para dito) - normal/DIREKTA na ulit dito sa TALAGANG
  // canvas ang pagguhit (walang binabaling na `ctx`), dahil ang
  // BUONG eksena na (lupa+puno+bahay+player) ang pinapadilim ngayon
  // nang SABAY-SABAY (tingnan ang drawDayNight sa ibaba, atmosphere.js) -
  // hindi na kailangan pang paghiwalayin ang lupa sa mga object.
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-snappedCameraX, -snappedCameraY);
  ctx.imageSmoothingEnabled = false;

  // BAGO (hiling ng user, may kalakip na CodePen reference) - "long
  // shadow" ng puno/bato/damo habang naka-equip ang TORCH, PAALIS sa
  // apoy nito (tingnan ang shadows.js) - BAGO ang drawMapObjects()
  // (sa ILALIM ng mismong puno/bato/player ang anino, hindi sa ibabaw).
  if (typeof drawTorchShadows === "function") drawTorchShadows();

  drawMapObjects();

  // "lamps" / "snowlamps" (parol ng town) - LAGING NASA HARAP ng player,
  // tingnan ang paliwanag sa map.js (drawTownLampsForeground).
  if (typeof drawTownLampsForeground === "function") drawTownLampsForeground();

  // Ang TOP/FRONT na piraso ng bawat damong tuft (grass.js) - LAGING
  // NASA HARAP ng player (hindi Y-sort/dynamic, tingnan ang paliwanag
  // sa grass.js/GRASS_TUFT_TRAMPLE_HEIGHT_RATIO) - ang BACK/BOTTOM na
  // piraso na lang (maliit na sliver malapit sa lupa) ang Y-sorted sa
  // loob ng drawMapObjects sa itaas.
  if (typeof drawGrassTuftsForeground === "function") drawGrassTuftsForeground();

  // Ang mga pirasong niyebe mula sa paghukay - lumilipad sila paitaas,
  // kaya dapat nasa IBABAW ng mga bagay at ng player para kitang-kita.
  drawDigEffects();

  // Mga lumilipad na dahon kapag natapakan ang damo (grass.js) - nasa
  // IBABAW din ng damo/player para kitang-kita ang epekto.
  if (typeof drawGrassParticles === "function") drawGrassParticles();

  ctx.restore();

  // Lahat ng sumusunod ay nasa labas na ng camera transform (screen
  // space), kaya hindi apektado ng zoom ang laki nila. Ang POSISYON
  // naman ng fog at niyebe ay nakadikit pa rin sa mundo - sila na mismo
  // ang nagbabawas ng camera offset.
  //
  // Mahalaga ang pagkakasunod-sunod dito:
  //
  //   1. fog       - parte ng mundo, kaya dapat siyang madilim kapag gabi
  //   2. araw/gabi - dito dumidilim ang LAHAT ng nasa itaas nito
  //   3. niyebe    - nasa ibabaw ng lahat, kaya malinaw pa rin kahit gabi
  drawFog();
  drawDayNight();

  // Ang liwanag ng torch (kapag naka-equip) - GINAWA na itong world-
  // space (sa loob ng drawMapObjects/map.js, kasabay ng player sa
  // Y-sort "drawables" list - tingnan ang drawTorchGlowWorld sa
  // atmosphere.js) sa halip na dito, para TAMA ang pagkakasunod-sunod
  // nito laban sa mga puno/bahay (natatakpan ito kapag nasa HARAP ang
  // isang puno, hindi na laging nasa IBABAW ng lahat). AYOS (hiling ng
  // user: "gusto ko lang yung torchglow kapag napadaan sa trees or mga
  // halaman is mag bebehind yung glow niya") - dating dito ito iginuguhit
  // (screen space, laging IBABAW), tapos may dagdag pang muling
  // pagguhit sa player mismo dito (para "mailigtas" ang katawan niya sa
  // ilalim ng glow) - PERO sobra/mali ang naging epekto noon: NAGING
  // LAGING NASA IBABAW ng LAHAT (kasama ang puno/bahay) ang buong
  // katawan ng player, hindi lang ang glow. TINANGGAL na ang PAREHONG
  // bahaging iyon dito - wala nang tawag sa drawTorchLight/muling
  // pagguhit ng player dito, tingnan na lang ang map.js.

  // Ang ilaw ng Stove (kapag AKTIBONG NAGLULUTO) - kaparehong dahilan/
  // batayan ng torch light sa itaas (sa IBABAW ng araw/gabi tint).
  if (typeof drawStoveLight === "function") drawStoveLight();

  // NAALIS NA (hiling ng user: "yung glow sa loob ng bahay kapag naka
  // open yung lamp is alisin na") - dating dito tinatawag ang
  // drawPlacedLightGlow() (buong-screen na warm wash sa LOOB ng silid
  // kapag may naka-ON na Light) - wala na ring hiwalay na buong-silid
  // na tint mula sa LOOB. Ang naka-ON na Light ay makikita/
  // mararamdaman na lang sa loob mismo ng silid (ang sprite mismo ng
  // Light, light.js) - PLUS ang lightray sa LABAS ng grassmapHouse
  // (drawGrassmapHouseLightray, atmosphere.js, naka-GATE sa TALAGANG
  // estado ng Light sa loob) - ANG PAGGUHIT NITO AY LUMIPAT NA sa
  // PINAKAUNA ng frame (WORLD SPACE, tingnan sa itaas ng file na ito,
  // bago pa man ang drawGrass()) - hiling ng user na "nakapailalim sa
  // tao at sa grass at sa trees" ang ray, kaya kailangang mauna itong
  // maiguhit bago ang mga iyon.

  // Ang ilaw ng bintana ng bahay (kapag gabi) at ng mga lamb sa town -
  // parehong dahilan/batayan ng torch light sa itaas (sa IBABAW ng
  // araw/gabi tint). Screen space ang lahat ng ito, kaya awtomatikong
  // "nag-o-overlap"/kumakalaban ang liwanag kahit saan (kasama ang
  // character) - iginuguhit ito PAGKATAPOS ng drawMapObjects (kung
  // saan iginuguhit ang player), kaya laging nasa IBABAW ng player ang
  // liwanag kapag lumapit siya sa parol/bintana.

  drawHouseWindowLights();
  drawTownLamps();
  drawTownWindowLights();
  if (typeof drawTownDoorLights === "function") drawTownDoorLights();

  // Sarili nilang liwanag ang alitaptap - dapat nasa IBABAW ng
  // araw/gabi tint (hindi dapat sumasabay dumilim).
  drawFireflies();

  drawSnow("front");
  drawRain();

  // Ang kidlat ay dapat nasa PINAKAIBABAW ng lahat - kahit ng niyebe -
  // para talagang kitang-kita ito.
  drawThunderFlash();

  // drawDoorPrompt() - muling PINAGANA (hiling ng user: "gusto ko e
  // press pa yung E key para makaenter tapos may label na house name")
  // - ang mga pintuang PAPASOK ngayon sa 6 bahay sa town (worlds.js)
  // ay HINDI na "auto", kaya kailangan ulit ang "E - <pangalan>" na
  // paalala. Sinusuri sa loob mismo ng function (tingnan sa ibaba) na
  // "auto" na pintuan lang ang nilalaktawan - kaya hindi ito lumalabas
  // nang walang dahilan sa mga pintuang OTOMATIKO pa rin (Exit, mga
  // gate ng town<->grassmap, atbp.).
  drawDoorPrompt();
  drawMissionaryGreeting();

  // BAGO (hiling ng user): floating text ("+health"/"+item",
  // floating-text.js) - SCREEN space (kaparehong pattern ng
  // drawMissionaryGreeting sa itaas - manual world->screen conversion,
  // FIXED na font size, hindi apektado ng camera.zoom).
  if (typeof drawFloatingTexts === "function") drawFloatingTexts();

  // BAGO (hiling ng user): minimap (minimap.js) - SARILING canvas
  // (hindi bahagi ng world-space na "ctx" sa itaas), kaya tinatawag
  // ito DITO sa labas/dulo (hindi apektado ng camera.zoom/translate na
  // ginamit sa itaas ng draw() na ito).
  if (typeof drawMinimap === "function") drawMinimap();
}

// Awtomatikong label na lumalabas kapag MALAPIT na ang player sa
// missionary (dating "oldman") - hindi kailangang pindutin ang kahit
// ano, kusa itong sumusulpot. May border at 10px na padding sa lahat ng
// gilid, nakalutang sa ITAAS ng ulo niya (world-anchored - gumagalaw
// kasama niya sa screen habang gumagalaw ang camera).
const MISSIONARY_GREETING_TEXT = "Hey, wanna trade something?";

// Gaano kalapit (sa world pixels, palibot sa kanya) bago lumitaw ang
// label - mas malawak kaysa sa mismong katawan niya, para "papalapit"
// pa lang ay kita mo na ito.
const MISSIONARY_GREETING_RANGE = TILE_SIZE * 2.5;

function isPlayerNearMissionary() {
  // Kasalukuyang posisyon niya (oldManWander) ang ginagamit na ngayon -
  // naglalakad na siya ngayon (decor.js), kaya hindi na palaging nasa
  // "tindahan" niya. Wala ring greeting habang "gone" siya (nawawala
  // sa mapa).
  if (typeof oldManWander === "undefined" || !oldManWander) return false;
  if (oldManWander.state === "gone") return false;

  // Sentro ng missionary (sa paanan) laban sa sentro ng player.
  const missionaryX = oldManWander.x;
  const missionaryY = oldManWander.y - TILE_SIZE / 2;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const dx = missionaryX - playerCenterX;
  const dy = missionaryY - playerCenterY;

  return Math.hypot(dx, dy) <= MISSIONARY_GREETING_RANGE + TILE_SIZE;
}

function drawMissionaryGreeting() {
  if (!mapReady) return;
  if (typeof oldManWander === "undefined" || !oldManWander) return;
  if (oldManWander.state === "gone") return;
  if (!isPlayerNearMissionary()) return;

  // Posisyon sa mundo: sa itaas mismo ng ulo ng missionary.
  const worldX = oldManWander.x;
  const worldTopY = oldManWander.y - OLDMAN_DEST_SIZE;

  // World -> screen (sundin ang parehong snapped-camera transform ng
  // draw() sa itaas).
  const snappedCameraX = Math.round(camera.x * camera.zoom) / camera.zoom;
  const snappedCameraY = Math.round(camera.y * camera.zoom) / camera.zoom;

  const screenX = (worldX - snappedCameraX) * camera.zoom;
  const screenTopY = (worldTopY - snappedCameraY) * camera.zoom;

  ctx.save();

  ctx.font = "600 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const PADDING = 10; // 10px sa top-bottom-left-right (hiling)
  const BORDER = 2;

  const textWidth = ctx.measureText(MISSIONARY_GREETING_TEXT).width;
  const textHeight = 15; // ayon sa font size

  const boxWidth = textWidth + PADDING * 2;
  const boxHeight = textHeight + PADDING * 2;

  // Nakasentro sa ulo niya, may kaunting espasyo pataas.
  const boxX = screenX - boxWidth / 2;
  const boxY = screenTopY - boxHeight - 12;

  // Background
  ctx.fillStyle = "rgba(20, 22, 28, 0.92)";
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();

  // Border
  ctx.lineWidth = BORDER;
  ctx.strokeStyle = "rgba(212, 175, 55, 0.9)";
  roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
  ctx.stroke();

  // Text
  ctx.fillStyle = "white";
  ctx.fillText(MISSIONARY_GREETING_TEXT, screenX, boxY + boxHeight / 2);

  ctx.restore();
}

// Maliit na helper para sa rounded rectangle (walang built-in sa lahat
// ng browser ang ctx.roundRect, kaya manu-mano).
function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

// Maliit na paalala kapag nakatayo ka sa isang pintuan. Screen space
// ito at hindi apektado ng araw/gabi, kaya nababasa mo kahit hatinggabi.
//
// AYOS: hindi ito lumalabas para sa mga pintuang "auto" (worlds.js) -
// dahil awtomatiko na namang lumilipat ang mundo sa mga iyon (walang
// dahilan para sabihing "pindutin ang E").
function drawDoorPrompt() {
  if (!mapReady) return;

  const door = typeof getUsableDoor === "function" ? getUsableDoor() : null;

  if (door && !door.auto) {
    drawEPrompt("E - " + door.label);
    return;
  }

  // BAGO (hiling ng user): "E na lang" din ang paraan para gamitin ang
  // Crafter/Stove/Light/Bed (dating left-click, dig.js) - kaya dito rin
  // ipinapakita ang PAREHONG "E - <pangalan>" na paalala (kaparehong-
  // istilo ng pintuan sa itaas) kapag may isa sa mga ito na nasa loob
  // ng saklaw (getUsableStructureUnderPlayer, dig.js).
  const structure =
    typeof getUsableStructureUnderPlayer === "function"
      ? getUsableStructureUnderPlayer()
      : null;

  if (!structure) return;

  const labels = {
    crafter: "Crafting Table",
    stove: "Stove",
    bed: "Sleep",
  };

  let label = labels[structure.type];

  // "Light" - ipinapakita kung Buksan (kapag OFF) o Patayin (kapag ON)
  // ang ilaw, sa halip na generic na pangalan lang.
  if (structure.type === "light") {
    label = structure.target && structure.target.on ? "Turn Off Light" : "Turn On Light";
  }

  drawEPrompt("E - " + label);
}

// SHARED na "E - <label>" na paalala sa ilalim ng screen - kaparehong-
// pareho ng lumang laman ng drawDoorPrompt (pintuan LANG dati) - ngayon
// ginagamit din ito ng Crafter/Stove/Light/Bed (tingnan sa itaas).
function drawEPrompt(text) {
  ctx.save();

  ctx.font = "600 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const width = ctx.measureText(text).width + 28;
  const x = canvas.width / 2;
  const y = canvas.height - 56;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x - width / 2, y - 18, width, 36);

  ctx.fillStyle = "white";
  ctx.fillText(text, x, y);

  ctx.restore();
}
