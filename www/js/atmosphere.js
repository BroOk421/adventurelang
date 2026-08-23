// =========================
// ATMOSPHERE - FOG + ARAW AT GABI
// =========================
//
// Dalawang epekto dito, pareho silang iginuguhit SA IBABAW ng buong
// mundo (mapa, puno, bahay, player) pero SA ILALIM ng niyebe:
//
//   mundo -> fog -> tint ng araw/gabi -> niyebe
//
// Nasa ilalim ng tint ang fog para madilim din siya kapag gabi - parte
// siya ng mundo. Ang niyebe naman ay nasa itaas ng lahat, kaya malinaw
// pa rin siyang makita kahit hatinggabi.

// =========================
// ARAW AT GABI
// =========================
//
// Isang buong ikot = 30 minuto = 24 na "oras" (1 oras totoong-buhay ay
// 1.25 minuto). Ang "at" sa DAY_NIGHT_STOPS sa ibaba ay direktang
// tumutugma sa RELOHESAN (progress * 24 = oras) - kaya kapag "06:00"
// ang lumalabas sa calendar-ui.js, dapat talagang umaga na/maliwanag,
// at kapag "18:00" naman, dapat gabi na - tumutugma ito sa isDaytime sa
// calendar.js (06:00-17:59 = araw).
//
// Ang paraan ng pagdilim ay "multiply": pinaparami ang kulay ng bawat
// pixel sa kulay ng oras. Ibig sabihin, PUTI = walang pagbabago
// (tanghali), at habang dumidilim/nagkukulay ang tint, sabay-sabay
// dumidilim ang lahat nang natural - hindi lang nilalagyan ng
// kulay-abo sa ibabaw. Kaya hindi namumutla ang mga kulay kapag gabi.

const DAY_NIGHT_SECONDS = 1800;

// Ang "at" ay posisyon sa loob ng ikot (0 hanggang 1) - i-multiply sa
// 24 para makuha ang katumbas na oras (hal. 0.25 = 06:00).
const DAY_NIGHT_STOPS = [
  { at: 0.0, color: [58, 72, 132] }, // 00:00, hatinggabi (pinakamadilim)
  { at: 0.15, color: [186, 172, 205] }, // 03:36, madaling-araw (lila)
  { at: 0.25, color: [255, 255, 255] }, // 06:00, umaga (maliwanag na)
  { at: 0.5, color: [255, 252, 240] }, // 12:00, tanghali (pinakamaliwanag)
  { at: 0.65, color: [255, 186, 138] }, // 15:36, dapit-hapon (mainit/orange)
  { at: 0.75, color: [96, 112, 176] }, // 18:00, gabi (dumidilim na)
  { at: 0.9, color: [58, 72, 132] }, // 21:36, papalapit sa hatinggabi
  { at: 1.0, color: [58, 72, 132] }, // 24:00/00:00, balik sa hatinggabi
];

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

// =========================
// "MAKULIMLIM" NA EPEKTO HABANG UMUULAN
// =========================
//
// Malamig/kulay-abong tono na hinahalo sa kasalukuyang tint ng
// araw/gabi (drawDayNight, sa ibaba) tuwing umuulan - parang natatakpan
// ng makapal na ulap ang buong paligid, kahit tanghali pa. Mas malakas
// ang halo kapag TALAGANG bagyo (may kidlat, tingnan ang isThunderstorm
// sa calendar.js) kaysa sa payak na pag-ulan lang.
const RAIN_OVERCAST_COLOR = [123, 132, 150]; // malamig na kulay-abong asul
const RAIN_OVERCAST_STRENGTH = 0.32;
const RAIN_THUNDERSTORM_OVERCAST_STRENGTH = 0.52;

// Pinapakinis ang paglipat: mabagal sa umpisa, mabagal sa dulo, mabilis
// sa gitna. Kung purong linear ang gamit, may bahagyang "kink" sa bawat
// hangganan ng dalawang oras - biglang nagbabago ang bilis ng pagdilim,
// at nakikita iyon bilang parang kaunting "lundag" ng liwanag. Dito,
// zero ang bilis ng pagbabago sa mismong hangganan, kaya tuloy-tuloy at
// pakonti-konti ang liwanag/dilim - walang mahahalatang hati.
function smoothstep(amount) {
  const clamped = Math.max(0, Math.min(1, amount));

  return clamped * clamped * (3 - 2 * clamped);
}

// Ilang bahagi na ba tayo ng ikot? Naka-batay ito sa TOTOONG orasan
// (getGameNow(), tingnan ang gametime.js - Date.now() + kahit anong
// SLEEP OFFSET), hindi sa performance.now - ang performance.now ay
// nagsisimula sa 0 tuwing buksan ang page, kaya lagi sanang umaga
// pagka-refresh. Dito, tuloy-tuloy ang oras ng mundo: kung gabi na bago
// ka nag-refresh, gabi pa rin pagbalik mo.
function getDayNightProgress() {
  return (getGameNow() / 1000 / DAY_NIGHT_SECONDS) % 1;
}

function getDayNightColor(progress) {
  for (let i = 0; i < DAY_NIGHT_STOPS.length - 1; i++) {
    const from = DAY_NIGHT_STOPS[i];
    const to = DAY_NIGHT_STOPS[i + 1];

    if (progress > to.at) continue;

    const span = to.at - from.at;
    const amount = smoothstep(span <= 0 ? 0 : (progress - from.at) / span);

    return [
      lerp(from.color[0], to.color[0], amount),
      lerp(from.color[1], to.color[1], amount),
      lerp(from.color[2], to.color[2], amount),
    ];
  }

  return DAY_NIGHT_STOPS[DAY_NIGHT_STOPS.length - 1].color;
}

// 0 = tanghaling-tapat, 1 = pinakamadilim na gabi. Ginagamit ito ng fog
// para mas makapal siya kapag gabi.
function getNightAmount() {
  const [red, green, blue] = getDayNightColor(getDayNightProgress());

  return 1 - (red + green + blue) / (3 * 255);
}

function drawDayNight() {
  let [red, green, blue] = getDayNightColor(getDayNightProgress());

  // AYOS: bagong "makulimlim" na epekto habang umuulan - hinahalo
  // (lerp) ang kulay ng oras ng araw papunta sa isang malamig/kulay-
  // abo na tono (RAIN_OVERCAST_COLOR), parang natatakpan ng makapal na
  // ulap ang langit. Mas malakas ito kapag TALAGANG bagyo (kidlat)
  // kaysa sa payak na pag-ulan lang - tingnan ang RAIN_OVERCAST_STRENGTH/
  // RAIN_THUNDERSTORM_OVERCAST_STRENGTH sa ibaba.
  if (typeof isRaining === "function" && isRaining()) {
    const thunderstorm =
      typeof getCalendarState === "function" &&
      getCalendarState().isThunderstorm;

    const strength = thunderstorm
      ? RAIN_THUNDERSTORM_OVERCAST_STRENGTH
      : RAIN_OVERCAST_STRENGTH;

    red = lerp(red, RAIN_OVERCAST_COLOR[0], strength);
    green = lerp(green, RAIN_OVERCAST_COLOR[1], strength);
    blue = lerp(blue, RAIN_OVERCAST_COLOR[2], strength);
  }

  // Halos puti = tanghali, walang mababago - laktawan na natin, sayang
  // lang ang isang buong fullscreen na guhit.
  if (red > 252 && green > 252 && blue > 252) return;

  ctx.save();

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle =
    "rgb(" +
    Math.round(red) +
    ", " +
    Math.round(green) +
    ", " +
    Math.round(blue) +
    ")";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

// =========================
// TORCH LIGHT (kapag naka-equip ang torch - resources.js)
// =========================
//
// Bilog na mainit na liwanag sa paligid ng player, sa IBABAW ng
// araw/gabi na tint (drawDayNight) para talagang "kumakalaban" ito sa
// dilim - screen space ito (kagaya ng drawDayNight), hindi kasama sa
// camera transform ng draw.js.

const TORCH_LIGHT_RADIUS = 70; // world pixels, hindi pa naka-multiply sa zoom
const TORCH_LIGHT_COLOR = "255, 200, 120";

function drawTorchLight() {
  if (typeof torchEquipped === "undefined" || !torchEquipped) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  const screenX = (player.x + player.width / 2 - camera.x) * camera.zoom;
  const screenY = (player.y + player.height / 2 - camera.y) * camera.zoom;
  const radius = TORCH_LIGHT_RADIUS * camera.zoom;

  ctx.save();

  // "lighter" (additive) - dahil "multiply" ang ginamit ng drawDayNight
  // para padilimin ang lahat, kailangan nating MAGDAGDAG ng liwanag sa
  // halip na palitan lang ang kulay, para talagang lumabas na parang
  // may sarili itong ilaw sa dilim.
  ctx.globalCompositeOperation = "lighter";

  const gradient = ctx.createRadialGradient(
    screenX,
    screenY,
    0,
    screenX,
    screenY,
    radius,
  );

  gradient.addColorStop(0, `rgba(${TORCH_LIGHT_COLOR}, ${0.55 * nightAmount})`);
  gradient.addColorStop(0.6, `rgba(${TORCH_LIGHT_COLOR}, ${0.25 * nightAmount})`);
  gradient.addColorStop(1, `rgba(${TORCH_LIGHT_COLOR}, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================
// BINTANA NG BAHAY (window glow) KAPAG GABI
// =========================
//
// Kaparehong-pareho ng paraan ng drawTorchLight sa itaas (screen
// space, "lighter"/additive, sa IBABAW ng araw/gabi tint para
// kumakalaban talaga sa dilim) - pero maraming maliliit na bilog dito
// (isa kada bintana) sa halip na isa lang na sumusunod sa player. Ang
// mga TALAGANG posisyon (world space) ay galing sa
// houseWindowLightPoints (map.js, pinupunuan ni collectHouseWindowLightPoints
// kada frame habang iginuguhit ang bawat bahay).

const WINDOW_LIGHT_RADIUS = 16; // world pixels, hindi pa naka-multiply sa zoom
const WINDOW_LIGHT_COLOR = "255, 214, 140";

function drawHouseWindowLights() {
  if (typeof houseWindowLightPoints === "undefined") return;
  if (houseWindowLightPoints.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const radius = WINDOW_LIGHT_RADIUS * camera.zoom;

  for (const point of houseWindowLightPoints) {
    const screenX = (point.x - camera.x) * camera.zoom;
    const screenY = (point.y - camera.y) * camera.zoom;

    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${0.75 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${0.35 * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
// LUMB (lamp post) SA TOWN KAPAG GABI
// =========================
//
// Ang mga posisyon ay HINDI na hardcoded - kinukuha na sila LIVE kada
// frame mula sa getLampLightPoints() (map.js), na basa naman diretso
// sa raw tile data ng "lamps" layer (connected-component clustering),
// kaya awtomatikong sumusunod ang ilaw kahit baguhin pa ng artist ang
// bilang/posisyon ng parol sa Tiled. Kagaya ng torch light, screen
// space at "lighter" ang blend, para kumakalaban talaga sa dilim. Ang
// mismong ART ng parol ay LAGING NASA HARAP ng player (hindi overlap/
// Y-sort - tingnan ang drawTownLampsForeground sa map.js), kaya hindi
// ito natatakpan kailanman - IISA lang ang "layer" ng liwanag na dapat
// asahan (ito), hindi tulad ng bahay/puno na puwedeng mag-occlude.
const TOWN_LAMP_LIGHT_RADIUS = 90; // world pixels, hindi pa naka-multiply sa zoom
const TOWN_LAMP_LIGHT_COLOR = "255, 196, 110";

function drawTownLamps() {
  if (typeof getLampLightPoints !== "function") return;

  const points = getLampLightPoints();

  if (points.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const radius = TOWN_LAMP_LIGHT_RADIUS * camera.zoom;

  for (const point of points) {
    const screenX = (point.x - camera.x) * camera.zoom;
    const screenY = (point.y - camera.y) * camera.zoom;

    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      radius,
    );

    gradient.addColorStop(0, `rgba(${TOWN_LAMP_LIGHT_COLOR}, ${0.75 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${TOWN_LAMP_LIGHT_COLOR}, ${0.36 * nightAmount})`);
    gradient.addColorStop(1, `rgba(${TOWN_LAMP_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
// BINTANA NG MGA BAHAY/TINDAHAN SA TOWN ("windows" tile layer)
// =========================
//
// Hindi na rin hardcoded ang mga ito - basahan mula sa "windows"
// tilelayer mismo (tingnan ang getWindowLayerLightPoints sa map.js) -
// dun na direktang inilalagay ng artist (sa Tiled) ang mga lit-window
// tile kada bahay/tindahan sa town. Dahil dito, ang mismong art ng
// window (naka-ilaw na tile) ay iginuguhit na rin ng drawMapBackground
// KAPAG GABI LANG (tingnan ang map.js) - ITONG glow function naman ay
// dagdag na "bloom"/ambiance sa ibabaw noon.
// =========================
// PINTUAN NG MGA BAHAY/TINDAHAN SA TOWN ("door" tile layer)
// =========================
//
// Kaparehong-pareho ng gawi ng drawTownWindowLights sa itaas (bagong
// layer ito, kasama ng buong update ng town.tmj) - ang posisyon ay
// mula sa "door" tilelayer (getDoorLayerLightPoints, map.js), at ang
// mismong naka-ilaw na art ng pinto ay iginuguhit na rin ng
// drawMapBackground KAPAG GABI LANG (tingnan ang map.js) - ITONG glow
// function naman ay dagdag na "bloom"/ambiance sa ibabaw noon, kagaya
// rin ng ginagawa sa bintana.
function drawTownDoorLights() {
  if (typeof getDoorLayerLightPoints !== "function") return;

  const points = getDoorLayerLightPoints();

  if (points.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const radius = WINDOW_LIGHT_RADIUS * camera.zoom;

  for (const point of points) {
    const screenX = (point.x - camera.x) * camera.zoom;
    const screenY = (point.y - camera.y) * camera.zoom;

    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${0.75 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${0.35 * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTownWindowLights() {
  if (typeof getWindowLayerLightPoints !== "function") return;

  const points = getWindowLayerLightPoints();

  if (points.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const radius = WINDOW_LIGHT_RADIUS * camera.zoom;

  for (const point of points) {
    const screenX = (point.x - camera.x) * camera.zoom;
    const screenY = (point.y - camera.y) * camera.zoom;

    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${0.75 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${0.35 * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
// FOG
// =========================
//
// Malalaking malalabong bilog na dahan-dahang gumagapang pahalang -
// parang hamog na dinadala ng hangin. Tulad ng niyebe, WORLD-ANCHORED
// sila: nakadikit sa mundo ang posisyon nila, kaya hindi sila
// sumusunod sa'yo kapag naglalakad ka. Umiikot (wrap) sila sa paligid
// ng tanawin, kaya wala kang maaabot na gilid ng fog.

const FOG_PUFF_COUNT = 14;

const FOG_MIN_RADIUS = 150;
const FOG_MAX_RADIUS = 340;

// Bilis ng hangin, sa device pixels kada frame. Dapat napakabagal para
// hindi mapansin ang paggalaw - hamog ito, hindi usok.
const FOG_DRIFT_X = 0.14;
const FOG_DRIFT_Y = 0.02;

// Gaano kakapal ang fog kapag tanghali, at kung gaano pa ito kakapal
// kapag hatinggabi.
const FOG_DAY_ALPHA = 0.07;
const FOG_NIGHT_ALPHA = 0.16;

const FOG_MARGIN = 360;

let fogPuffs = [];
let fogSprite = null;

// Iginuguhit natin nang ISANG BESES lang ang malabong bilog, tapos
// ginagamit na lang paulit-ulit. Kung gradient ang gagamitin kada
// guhit, kada frame na iyon gagawa ng bagong gradient - mabigat.
function getFogSprite() {
  if (fogSprite) return fogSprite;

  const size = 256;
  const half = size / 2;

  const surface = document.createElement("canvas");

  surface.width = size;
  surface.height = size;

  const context = surface.getContext("2d");

  const gradient = context.createRadialGradient(half, half, 0, half, half, half);

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.45)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  fogSprite = surface;

  return fogSprite;
}

function getFogOffsetX() {
  return Math.round(camera.x * camera.zoom);
}

function getFogOffsetY() {
  return Math.round(camera.y * camera.zoom);
}

function createFogPuff(offsetX, offsetY) {
  return {
    x: offsetX + Math.random() * canvas.width,
    y: offsetY + Math.random() * canvas.height,
    radius: FOG_MIN_RADIUS + Math.random() * (FOG_MAX_RADIUS - FOG_MIN_RADIUS),
    // Bawat isa ay may sariling kaunting pagkakaiba sa bilis at lakas,
    // para hindi sila magmukhang iisang bloke na gumagalaw.
    speed: 0.6 + Math.random() * 0.8,
    strength: 0.5 + Math.random() * 0.5,
    bobPhase: Math.random() * Math.PI * 2,
  };
}

function initFog() {
  fogPuffs = [];

  const offsetX = getFogOffsetX();
  const offsetY = getFogOffsetY();

  for (let i = 0; i < FOG_PUFF_COUNT; i++) {
    fogPuffs.push(createFogPuff(offsetX, offsetY));
  }
}

function updateFog() {
  if (fogPuffs.length === 0) initFog();

  const offsetX = getFogOffsetX();
  const offsetY = getFogOffsetY();

  const wrapWidth = canvas.width + FOG_MARGIN * 2;
  const wrapHeight = canvas.height + FOG_MARGIN * 2;

  for (const puff of fogPuffs) {
    puff.bobPhase += 0.003;

    puff.x += FOG_DRIFT_X * puff.speed;
    puff.y += FOG_DRIFT_Y * puff.speed + Math.sin(puff.bobPhase) * 0.05;

    // Umiikot sa paligid ng tanawin - pareho ng ginagawa ng niyebe.
    // Sa KABILANG gilid sila lumalabas, kaya hindi nauubos ang fog
    // kahit tuloy-tuloy kang maglakad sa iisang direksyon.
    const screenX = puff.x - offsetX;
    const screenY = puff.y - offsetY;

    if (screenX > canvas.width + FOG_MARGIN) puff.x -= wrapWidth;
    else if (screenX < -FOG_MARGIN) puff.x += wrapWidth;

    if (screenY > canvas.height + FOG_MARGIN) puff.y -= wrapHeight;
    else if (screenY < -FOG_MARGIN) puff.y += wrapHeight;
  }
}

function drawFog() {
  if (fogPuffs.length === 0) return;

  const sprite = getFogSprite();

  const offsetX = getFogOffsetX();
  const offsetY = getFogOffsetY();

  const density = lerp(FOG_DAY_ALPHA, FOG_NIGHT_ALPHA, getNightAmount());

  ctx.save();

  // Malabo dapat ang fog - kabaligtaran ito ng malinaw na pixel art,
  // kaya dito lang natin binubuksan ang smoothing.
  ctx.imageSmoothingEnabled = true;

  for (const puff of fogPuffs) {
    ctx.globalAlpha = density * puff.strength;

    ctx.drawImage(
      sprite,
      puff.x - offsetX - puff.radius,
      puff.y - offsetY - puff.radius,
      puff.radius * 2,
      puff.radius * 2,
    );
  }

  ctx.restore();
}
