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

  // Ang kama (bed.js) - sa loob lang ng houseInside, sa ibabaw ng sahig/
  // dingding ng "placeholder room" (drawMapBackground/drawPlaceholderRoom
  // sa worlds.js) pero sa ilalim ng player (walang Y-sort dito, laging
  // nasa likod dahil laging naka-diretso sa dingding).
  if (typeof drawBed === "function") drawBed();

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

  // Ang madilim na "patse" (dark patch) sa lupa - marker ng gate
  // patungong "town" (decor.js) - GROUND DECAL din ito (walang Y-sort,
  // laging flat sa lupa), kaya dito ito ilagay kasunod ng bakas.
  if (typeof drawTownGatePatch === "function") drawTownGatePatch();

  // Mga item na nakalapag sa lupa (galing sa ani o inihagis) - nasa
  // ibabaw ng lupa, sa ilalim ng player (nalalakaran).
  drawGroundItems();

  // Mga naka-lagay na Crafter (crafting table) - PERMANENTENG bagay sa
  // mundo, hindi tulad ng groundItems (tingnan ang craft.js).
  if (typeof drawPlacedCrafters === "function") drawPlacedCrafters();

  // Mga naka-lagay na Stove (cooking station) - kaparehong-pareho ng
  // gawi ng Crafter (tingnan ang stove.js).
  if (typeof drawPlacedStoves === "function") drawPlacedStoves();

  // Ang outline ng tile na tinututukan ng mouse - nasa lupa rin, para
  // hindi ito pumatong sa puno o sa player.
  drawDigCursor();
  drawResourceCursor();

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

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-snappedCameraX, -snappedCameraY);
  ctx.imageSmoothingEnabled = false;

  drawMapObjects();

  // "lamps" / "snowlamps" (parol ng town) - LAGING NASA HARAP ng player,
  // tingnan ang paliwanag sa map.js (drawTownLampsForeground).
  if (typeof drawTownLampsForeground === "function") drawTownLampsForeground();

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

  // Ang liwanag ng torch (kapag naka-equip) - dapat nasa IBABAW ng
  // araw/gabi tint, para talagang "kumakalaban" ito sa dilim.
  drawTorchLight();

  // Ang ilaw ng Stove (kapag AKTIBONG NAGLULUTO) - kaparehong dahilan/
  // batayan ng torch light sa itaas (sa IBABAW ng araw/gabi tint).
  if (typeof drawStoveLight === "function") drawStoveLight();

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

  // drawDoorPrompt() - TINANGGAL na (hiling ng user): lahat ng pintuan
  // ay "auto" na ngayon (worlds.js, DOORS), kaya wala nang "E - ..."
  // na prompt na kailangan pang ipakita.
  drawMissionaryGreeting();

  // Compass arrow patungong blackhole gate (decor.js) - SCREEN SPACE,
  // dapat pinakahuli para laging nasa IBABAW ng lahat.
  if (typeof drawTownGateCompass === "function") drawTownGateCompass();
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
function drawDoorPrompt() {
  if (!mapReady) return;

  const door = getUsableDoor();

  if (!door) return;

  const text = "E - " + door.label;

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
