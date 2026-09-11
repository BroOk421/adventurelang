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
//
// AYOS (hiling ng user, ULIT): "medyo dark pa lang, gawin BLACK na
// talaga" - pinababa PA ULIT ang PINAKAMADILIM na mga stop (dating
// [9,10,18]) papuntang HALOS PUROng itim (average RGB ~5-6 na lang,
// hindi na ~11-13) - napaka-subtle na lang ng asul na tono (halos
// hindi na mapapansin, para lang hindi TALAGANG 100% pure black/
// walang-personalidad na screen). Pinadilim din pa ang 18:00 (dusk).
const DAY_NIGHT_STOPS = [
  { at: 0.0, color: [5, 5, 9] }, // 00:00, hatinggabi (halos purong itim na)
  { at: 0.15, color: [40, 35, 48] }, // 03:36, madaling-araw (unti-unti pang madilim, lila)
  { at: 0.25, color: [255, 255, 255] }, // 06:00, umaga (maliwanag na)
  { at: 0.5, color: [255, 252, 240] }, // 12:00, tanghali (pinakamaliwanag)
  { at: 0.65, color: [255, 186, 138] }, // 15:36, dapit-hapon (mainit/orange)
  { at: 0.75, color: [28, 32, 50] }, // 18:00, gabi (mas mabilis na dumidilim ngayon)
  { at: 0.9, color: [5, 5, 9] }, // 21:36, papalapit sa hatinggabi (halos purong itim na)
  { at: 1.0, color: [5, 5, 9] }, // 24:00/00:00, balik sa hatinggabi
];

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

// =========================
// "MAKULIMLIM" NA EPEKTO SA BAWAT PANAHON (rain/snow/sunny)
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

// BAGO (hiling ng user): "yung pag gabi ng darkness sa rain is
// maganda, gusto ko implement mo rin yung ganung dilim sa sunny at sa
// snow" - PAREHONG konsepto/mekanismo ng rain overcast sa itaas, PERO
// may sarili-sariling KULAY ang bawat panahon, para may sariling
// personalidad/mood ang bawat isa (hindi lang basta "maputi" tuwing
// walang ulan/niyebe):
//   - SNOW: malamig/maputlang asul (parang maulap/malamig na araw ng
//     niyebe) - mas malakas pa kapag SNOWSTORM (isSnowStorm,
//     calendar.js).
//   - SUNNY (walang ulan/niyebe): mainit/alikabok na amber - mas
//     mahina/subtle lang ito (walang "storm" na bersyon ang sunny),
//     dagdag lang na atmospera sa halip na basta purong DAY_NIGHT_STOPS
//     na kulay.
//
// PAALALA: ang RESULTA ng blending na ito ay depende pa rin sa
// KASALUKUYANG oras (DAY_NIGHT_STOPS) - ibig sabihin, kahit gabi na,
// may sariling subtle na kulay/mood pa rin base sa panahon (hindi na
// basta parehong purong itim/gabi kahit anong panahon) - ito mismo ang
// "ganung dilim" (mood/texture ng dilim) na gustong i-generalize ng
// user sa lahat ng panahon, hindi lang sa ulan.
const SNOW_OVERCAST_COLOR = [150, 165, 190]; // maputlang malamig na asul
const SNOW_OVERCAST_STRENGTH = 0.28;
const SNOW_STORM_OVERCAST_STRENGTH = 0.48;

const SUNNY_OVERCAST_COLOR = [150, 130, 100]; // mainit/alikabok na amber
const SUNNY_OVERCAST_STRENGTH = 0.18;

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

// AYOS: kapag naka-ON ang KAHIT ISANG Light sa kasalukuyang silid
// (hasLitPlacedLightInCurrentWorld, light.js), LAKTAWAN na TALAGA ang
// araw/gabi na pagdidilim (ibalik agad, huwag nang mag-fill ng
// kahit-ano) - parang "naka-ilaw" na talaga ang buong silid,
// walang-anino, tapos ang warm/mainit na "wash" na lang ng
// drawPlacedLightGlow (sa IBABAW nito, tingnan ang draw.js) ang
// bahalang magbigay ng mainit/malamlam na kulay na katulad ng
// reference - hindi na ito kailangang "labanan" pa ang isang dilim na
// multiply sa ilalim nito.
//
// BAGONG HILING ng user (ULIT - binalik sa dating smooth na bilog):
// "pangit ng tile-based na ilaw, balik mo na lang sa recent, pero sa
// CENTER (hindi naka-offset sa direksyon), tapos liitan mo pa ng
// kaunti" - kaya BINALIK ang SMOOTH RADIAL GRADIENT na "hole" (hindi
// na tile-by-tile), naka-CENTER TALAGA sa player (walang facing-
// offset), at PINALIIT ang radius (TORCH_LIGHT_RADIUS * 1.15, dating
// 1.6, noong naka-offset pa).
let dayNightTintCanvas = null;
let dayNightTintCtx = null;

function getDayNightTintSurface() {
  if (
    !dayNightTintCanvas ||
    dayNightTintCanvas.width !== canvas.width ||
    dayNightTintCanvas.height !== canvas.height
  ) {
    dayNightTintCanvas = document.createElement("canvas");
    dayNightTintCanvas.width = canvas.width;
    dayNightTintCanvas.height = canvas.height;
    dayNightTintCtx = dayNightTintCanvas.getContext("2d");
  } else {
    dayNightTintCtx.clearRect(0, 0, dayNightTintCanvas.width, dayNightTintCanvas.height);
    dayNightTintCtx.globalCompositeOperation = "source-over";
  }

  return dayNightTintCtx;
}

// Tinatayang posisyon ng MISMONG APOY ng torch (hindi lang basta
// gitna ng player) - naka-hawak ito nang bahagyang PAITAAS at PATABI
// (base sa direksyon kung saan nakaharap ang player, player.direction,
// tingnan ang player.js) - kaya doon mismo dapat nakatapat/naka-center
// ang liwanag, hindi sa buong katawan.
const TORCH_FLAME_OFFSETS = {
  down: { x: 3, y: -6 },
  up: { x: 3, y: -10 },
  left: { x: -5, y: -8 },
  right: { x: 5, y: -8 },
};

function getTorchFlamePosition() {
  const direction =
    typeof player !== "undefined" && player.direction ? player.direction : "down";

  const offset = TORCH_FLAME_OFFSETS[direction] || TORCH_FLAME_OFFSETS.down;

  return {
    x: player.x + player.width / 2 + offset.x,
    y: player.y + player.height / 2 + offset.y,
  };
}

// "PULSE"/paghinga ng liwanag - mabagal na lumalaki't liliit (sine
// wave, hindi biglaan/flicker) - 0.9 hanggang 1.1x ng base radius.
//
// AYOS (hiling ng user: "wag na yung bilog na light ng torch") -
// dating ginagamit ito sa "hole-punch" na radial gradient ng torch sa
// drawDayNight (TINANGGAL na, tingnan ang paliwanag doon) - wala nang
// gumagamit nito ngayon, pero iniiwan na lang ang function (hindi
// tinatanggal nang buo) kung sakaling may bagong pulsing effect pa
// balang araw.
function getTorchPulseFactor() {
  return 1 + Math.sin(Date.now() / 450) * 0.1;
}

// AYOS (hiling ng user: "ang concern about lightray was not working" -
// hindi na lumalabas ang liwanag ng bintana sa GABI): SANHI - dating
// dito iginuguhit ang lightray SA HULI (screen space, PAGKATAPOS ng
// multiply-dilim ng drawDayNight sa ibaba), kaya "lighter"/additive
// itong nakapatong sa IBABAW ng dilim, tama ang liwanag. NANG lumipat
// ito papuntang WORLD SPACE at MAS MAAGA sa buong frame (draw.js -
// bago pa man ang drawGrass/drawMapObjects, para TALAGANG ma-occlude
// ng damo/puno/player, tingnan ang paliwanag sa drawGrassmapHouseLightray
// sa ibaba) - naging MAS MAAGA na rin ito kaysa sa drawDayNight, kaya
// ang parehong "multiply"-dilim na iyon (na dumadaan sa BUONG canvas)
// ay TUMATAKBO na PAGKATAPOS ng ray - ni-nunullify/pinapadilim nito
// pabalik ang bright na "lighter" glow ng ray (parang walang nangyari),
// kahit gabi na at naka-ON ang Light sa loob. AYOS: kaparehong
// "hole-punch" na trick na ginagamit na ng torch (offscreen tint
// canvas + destination-out) - BUTASAN din ang eksaktong hugis/posisyon
// ng ray (gamit ang PAREHONG naka-mask na canvas ng ray mismo, hindi
// lang basta parisukat) sa loob ng dayNightTintCanvas BAGO ito i-multiply
// sa TALAGANG frame - kaya ang lugar na iyon ay HINDI na dumadaan sa
// dilim/multiply, PANATILI ang liwanag na naiguhit na doon kanina pa
// (habang PARIN naka-occlude ang RAY mismo ng damo/puno/player, dahil
// hindi naman ito nagbabago - ang na-punch lang na butas ay ang
// PAGDILIM sa IBABAW nito, hindi ang ray/occlusion mismo).
function getGrassmapHouseLightrayHoleInfo() {
  if (typeof currentWorld === "undefined" || currentWorld !== "grassmap") {
    return null;
  }

  if (
    typeof hasLitPlacedLightInWorld !== "function" ||
    !hasLitPlacedLightInWorld(LIGHTRAY_GRASSMAPHOUSE_INTERIOR_WORLD)
  ) {
    return null;
  }

  const maskedSurface =
    typeof getGrassmapHouseLightrayMaskedSurface === "function"
      ? getGrassmapHouseLightrayMaskedSurface()
      : null;

  if (!maskedSurface) return null;

  const alpha = typeof getNightAmount === "function" ? getNightAmount() : 0;

  if (alpha <= 0.05) return null;

  return { maskedSurface, alpha };
}

// Binubutas ang "tintCtx" (offscreen dayNightTintCanvas) sa EKSAKTONG
// hugis/posisyon ng lightray (screen space, base sa camera/zoom
// ngayon) - tingnan ang paliwanag sa itaas ng getGrassmapHouseLightrayHoleInfo.
function punchGrassmapHouseLightrayHole(tintCtx, hole) {
  const screenX = (LIGHTRAY_GRASSMAPHOUSE_WORLD_X - camera.x) * camera.zoom;
  const screenY = (LIGHTRAY_GRASSMAPHOUSE_WORLD_Y - camera.y) * camera.zoom;
  const screenWidth = hole.maskedSurface.width * camera.zoom;
  const screenHeight = hole.maskedSurface.height * camera.zoom;

  tintCtx.save();
  tintCtx.globalCompositeOperation = "destination-out";
  tintCtx.globalAlpha = hole.alpha;
  tintCtx.drawImage(hole.maskedSurface, screenX, screenY, screenWidth, screenHeight);
  tintCtx.restore();
}

// =========================
// "HOLE-PUNCH" PARA SA WINDOW LIGHTS (hiling ng user: "yung lightray
// ng window dapat naka ilalim sa puno at sa grass at sa character e
// dapat naapakan siya pero kita parin yung glow niya")
// =========================
//
// Kaparehong konsepto ng punchGrassmapHouseLightrayHole sa itaas, pero
// para sa MARAMING points (bawat naka-ilaw na bintana - parehong
// houseWindowLightPoints/map.js at getWindowLayerLightPoints/map.js) -
// simpleng malambot na BILOG na lang ang butas kada isa (hindi
// sprite-shaped/masked), dahil plain radial gradient lang naman ang
// mismong glow ng mga ito (drawHouseWindowLights/drawTownWindowLights,
// ibaba).
function getWindowLightHolePoints() {
  const points = [];

  const nightAmount = typeof getNightAmount === "function" ? getNightAmount() : 0;

  if (nightAmount <= 0.05) return points; // araw pa, walang butas na kailangan

  if (typeof houseWindowLightPoints !== "undefined") {
    for (const point of houseWindowLightPoints) {
      if (
        point.world &&
        typeof hasLitPlacedLightInWorld === "function" &&
        hasLitPlacedLightInWorld(point.world)
      ) {
        points.push(point);
      }
    }
  }

  if (typeof getWindowLayerLightPoints === "function") {
    points.push(...getWindowLayerLightPoints());
  }

  // BUGFIX (hiling ng user: "sa coffee shop at sa tavern wala pang ilaw
  // sa gabi") - nakalimutang idagdag dito ang bagong
  // getCustomHouseLightPoints() (Entry #90) - kaya nag-a-apply na nga
  // ang glow (drawCustomHouseLights) PERO agad itong natatakpan ng
  // multiply-dilim na night tint sa ibaba (walang naka-punch na butas
  // para dito), kaya parang WALANG epekto sa TALAGANG nakikita.
  if (typeof getCustomHouseLightPoints === "function") {
    points.push(...getCustomHouseLightPoints());
  }

  return points;
}

function punchWindowLightHoles(tintCtx, points) {
  const holeRadius = WINDOW_LIGHT_RADIUS * 1.3 * camera.zoom;

  tintCtx.save();
  tintCtx.globalCompositeOperation = "destination-out";

  for (const point of points) {
    const screenX = (point.x - camera.x) * camera.zoom;
    const screenY = (point.y - camera.y) * camera.zoom;

    const holeGradient = tintCtx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      holeRadius,
    );

    holeGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    holeGradient.addColorStop(0.55, "rgba(0, 0, 0, 0.5)");
    holeGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    tintCtx.fillStyle = holeGradient;
    tintCtx.beginPath();
    tintCtx.arc(screenX, screenY, holeRadius, 0, Math.PI * 2);
    tintCtx.fill();
  }

  tintCtx.restore();
}

// AYOS (BUG FIX/BAGO, hiling ng user: "kung anong kulay ng dark sa
// gabi ganun yung magiging kulay ng shadow [ng torch]... apply mo
// kung anong kulay ng gabi sa snow, sunny at rainy") - hinati/inilabas
// ang buong pagkukwenta ng "kasalukuyang kulay ng oras+panahon" dito
// (dating nasa LOOB lang ng drawDayNight, hindi puwedeng gamitin ng
// ibang file) - PAREHONG [red,green,blue] ito na ginagamit ng
// drawDayNight sa ibaba (walang binago sa gawi nito), PERO puwede na
// ring tawagin ng shadows.js (getTorchShadowColorRGB) para ang anino
// ng torch ay TALAGANG kaparehong-kaparehong kulay ng dilim ng
// kasalukuyang oras/panahon (gabi + snow/sunny/rain overcast), sa
// halip na basta FIXED na itim (dating TORCH_SHADOW_COLOR).
function getCurrentAtmosphereTintRGB() {
  let [red, green, blue] = getDayNightColor(getDayNightProgress());

  // AYOS: bagong "makulimlim" na epekto habang umuulan - hinahalo
  // (lerp) ang kulay ng oras ng araw papunta sa isang malamig/kulay-
  // abo na tono (RAIN_OVERCAST_COLOR), parang natatakpan ng makapal na
  // ulap ang langit. Mas malakas ito kapag TALAGANG bagyo (kidlat)
  // kaysa sa payak na pag-ulan lang - tingnan ang RAIN_OVERCAST_STRENGTH/
  // RAIN_THUNDERSTORM_OVERCAST_STRENGTH sa ibaba.
  //
  // BAGO (hiling ng user): "gusto ko implement mo rin yung ganung
  // dilim sa sunny at sa snow" - PAREHONG paraan (blend/lerp), pero
  // ibang kulay/lakas kada panahon - SNOW kapag niyebe (mas malakas
  // pa kapag snowstorm), SUNNY kapag WALANG ulan/niyebe (default/
  // malinaw na araw). Parehong naka-guard sa `!isIndoors()` (hindi
  // dapat maapektuhan ang loob ng bahay ng panahon sa LABAS) - ang
  // rain lang ang mayroon nang ganitong guard sa loob mismo ng
  // isRaining(), kaya hiwalay itong tsina-check para sa snow/sunny.
  const indoorsNow = typeof isIndoors === "function" && isIndoors();

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
  } else if (
    !indoorsNow &&
    typeof isSnowWeather === "function" &&
    isSnowWeather()
  ) {
    const snowstorm =
      typeof getCalendarState === "function" &&
      getCalendarState().isSnowStorm;

    const strength = snowstorm
      ? SNOW_STORM_OVERCAST_STRENGTH
      : SNOW_OVERCAST_STRENGTH;

    red = lerp(red, SNOW_OVERCAST_COLOR[0], strength);
    green = lerp(green, SNOW_OVERCAST_COLOR[1], strength);
    blue = lerp(blue, SNOW_OVERCAST_COLOR[2], strength);
  } else if (!indoorsNow) {
    // "Sunny" - default/malinaw na araw (walang ulan, walang niyebe).
    red = lerp(red, SUNNY_OVERCAST_COLOR[0], SUNNY_OVERCAST_STRENGTH);
    green = lerp(green, SUNNY_OVERCAST_COLOR[1], SUNNY_OVERCAST_STRENGTH);
    blue = lerp(blue, SUNNY_OVERCAST_COLOR[2], SUNNY_OVERCAST_STRENGTH);
  }

  return [red, green, blue];
}

// AYOS (BUG FIX, hiling ng user: "i mean ikaw na pala mag-bago kasi
// nawala rin yung light sa gabi e di na umiilaw yung sa torch") -
// dating TINANGGAL NANG BUO ang liwanag/"hole" ng torch (hiling ng
// user noon: "wag na yung bilog") - PERO sobra pala ang tanggal:
// wala na ring ANUMANG liwanag na natitira sa gabi kahit naka-equip
// ang torch (kitang-kita, hindi makapag-eksplora sa dilim). Ibinalik
// na ngayon ang liwanag, PERO mas MALAKI AT MAS MALAMBOT/GRADUAL na
// ngayon ang gradient nito (dating maliit at may medyo matigas na
// hangganan sa 55%-100%, kaya kitang-kitang "bilog"/spotlight) - mas
// maraming color stop, mas unti-unti ang paglabo papalayo, para
// mas "natural"/hindi gaanong kapansin-pansin bilang isang eksaktong
// bilog, pero TALAGANG may liwanag pa rin sa paligid ng torch.
function drawDayNight() {
  // AYOS (hiling ng user): may TAO sa silid (sa ngayon, si Maria sa
  // Grocery - tingnan ang hasNpcLitInterior sa builder.js) - nananatili
  // itong maliwanag KAHIT WALANG nakasinding lampara. Ang ibang silid
  // ay madilim pa rin kung walang ilaw, gaya ng dati.
  if (
    typeof isIndoors === "function" &&
    isIndoors() &&
    typeof hasNpcLitInterior === "function" &&
    hasNpcLitInterior()
  ) {
    return;
  }

  if (
    typeof isIndoors === "function" &&
    isIndoors() &&
    typeof hasLitPlacedLightInCurrentWorld === "function" &&
    hasLitPlacedLightInCurrentWorld()
  ) {
    return;
  }

  let [red, green, blue] = getCurrentAtmosphereTintRGB();

  // Halos puti = tanghali, walang mababago - laktawan na natin, sayang
  // lang ang isang buong fullscreen na guhit.
  if (red > 252 && green > 252 && blue > 252) return;

  const tintColor =
    "rgb(" + Math.round(red) + ", " + Math.round(green) + ", " + Math.round(blue) + ")";

  const torchOn = typeof torchEquipped !== "undefined" && torchEquipped;
  const lightrayHole = getGrassmapHouseLightrayHoleInfo();

  // AYOS (hiling ng user): "yung lightray ng window dapat naka ilalim
  // sa puno at sa grass at sa character e dapat naapakan siya pero
  // kita parin yung glow niya" - ang mga "window" glow
  // (drawHouseWindowLights/drawTownWindowLights, ibaba) ay LUMIPAT na
  // papuntang WORLD SPACE at MAS MAAGA sa buong frame (draw.js, bago
  // pa man ang drawMapObjects) para TALAGANG ma-occlude ng
  // damo/puno/player - PERO dahil dito, MAS MAAGA na rin sila kaysa
  // sa "multiply"-dilim na ito (kaparehong sitwasyon ng lightray ng
  // grassmapHouse sa itaas) - kaya kung wala pang AYOS, babalik lang
  // itong madidilim ng multiply-tint na ito (parang walang glow).
  // PAREHONG "hole-punch" na trick (destination-out sa offscreen tint
  // canvas) ang ginagamit dito - isang malambot na bilog na butas
  // KADA window point, para PANATILIHIN ang liwanag na naiguhit na sa
  // lugar na iyon.
  const windowLightHolePoints = getWindowLightHolePoints();

  if (!torchOn && !lightrayHole && windowLightHolePoints.length === 0) {
    // Walang naka-equip na torch AT walang kailangang butasin (lightray) -
    // direkta sa TALAGANG canvas, walang hole/butas.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tintColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return;
  }

  // May naka-equip na torch AT/O may kailangang butasin (lightray) -
  // gumamit ng off-screen buffer para makapag-"butas" (malambot na
  // radial gradient para sa torch, eksaktong hugis ng ray para sa
  // lightray), ITINAPAT sa mismong APOY ng torch (hindi sa gitna ng
  // player mismo), at may "PULSE"/paghinga (unti-unting lumalaki-
  // liliit) - tingnan ang getTorchFlamePosition/getTorchPulseFactor
  // sa ibaba.
  const tintCtx = getDayNightTintSurface();

  tintCtx.fillStyle = tintColor;
  tintCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (lightrayHole) punchGrassmapHouseLightrayHole(tintCtx, lightrayHole);
  if (windowLightHolePoints.length > 0) {
    punchWindowLightHoles(tintCtx, windowLightHolePoints);
  }

  if (!torchOn) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(dayNightTintCanvas, 0, 0);
    ctx.restore();
    return;
  }

  const flame = getTorchFlamePosition();

  const screenX = (flame.x - camera.x) * camera.zoom;
  const screenY = (flame.y - camera.y) * camera.zoom;

  // AYOS (mas malambot/mas malaki, hindi na kasing-tigas ng dati) -
  // dating 0.85x lang ng TORCH_LIGHT_RADIUS ang saklaw (mabilis
  // ma-abot ang "buong dilim" - matigas ang hangganan), ngayon 1.4x -
  // mas malawak, kaya mas unti-unti/mas gradual ang paglabo papalayo.
  const holeRadius =
    TORCH_LIGHT_RADIUS * 1.4 * getTorchPulseFactor() * camera.zoom;

  const holeGradient = tintCtx.createRadialGradient(
    screenX,
    screenY,
    0,
    screenX,
    screenY,
    holeRadius,
  );

  // Mas MARAMING color stop (dating 3 lang - 0/0.55/1) - mas
  // unti-unti/mas malambot ang pagkupas papalayo sa liwanag, para
  // hindi masyadong "matigas"/kapansin-pansin bilang eksaktong bilog.
  holeGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  holeGradient.addColorStop(0.35, "rgba(0, 0, 0, 0.85)");
  holeGradient.addColorStop(0.6, "rgba(0, 0, 0, 0.55)");
  holeGradient.addColorStop(0.8, "rgba(0, 0, 0, 0.25)");
  holeGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  tintCtx.globalCompositeOperation = "destination-out";
  tintCtx.fillStyle = holeGradient;
  tintCtx.beginPath();
  tintCtx.arc(screenX, screenY, holeRadius, 0, Math.PI * 2);
  tintCtx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(dayNightTintCanvas, 0, 0);
  ctx.restore();
}

// =========================
// TORCH LIGHT (kapag naka-equip ang torch - resources.js)
// =========================
//
// AYOS (hiling ng user): "gusto ko lang yung torchglow kapag napadaan
// sa trees or mga halaman is mag bebehind yung glow niya" - dating
// SCREEN SPACE ito (kagaya ng drawDayNight), iginuguhit PAGKATAPOS ng
// LAHAT (kasama ang mga puno/bahay), kaya laging NASA IBABAW ng lahat
// - hindi ito natatakpan kahit dumaan/tumayo ang player sa LIKOD ng
// isang puno. Sinubukan munang "ayusin" ito sa pamamagitan ng muling
// pagguhit sa PLAYER sa itaas ng glow (para hindi bumalot dito) -
// PERO mali/sobra ang naging epekto noon: naging LAGING NASA IBABAW
// ng LAHAT (kahit ng puno/bahay) ang buong KATAWAN ng player, hindi
// lang ang glow.
//
// TUNAY na ayos ngayon: WORLD SPACE na ito (hindi na screen space) -
// iginuguhit bilang BAHAGI ng normal na Y-sort (tingnan ang
// drawTorchGlowWorld sa ibaba, at ang paggamit nito sa map.js kasabay
// ng player sa "drawables" list) - kaya SUMUSUNOD ito sa PAREHONG
// "sortY" ng player. Ang epekto: kung nasa HARAP ang isang puno
// (mas malaki ang sortY nito kaysa sa paanan ng player), iguguhit
// ito PAGKATAPOS ng glow+player - kaya TALAGANG NATATAKPAN/NAGIGING
// LIKOD ng puno ang glow (at ang player) sa tamang pagkakataon.
const TORCH_LIGHT_RADIUS = 70; // world pixels

// Kulay ng "torch light" - mainit na dilaw-orange (parang totoong
// apoy). Ito na ngayon ang TANGING pinagmumulan ng kulay ng torch
// (dati may hiwalay na additive glow na gumagamit nito, pero
// tinanggal na iyon - tingnan ang drawTorchGlowWorld sa ibaba) -
// pinapanatili ito bilang REFERENCE na kulay para GAMITIN din ng
// WINDOW_LIGHT_COLOR (hiling ng user: "yung window lightray dapat
// kasing kulay lang ng torch light") - iisang constant na lang ang
// pinagmumulan ng kulay, kaya GARANTISADONG magkatugma sila.
const TORCH_LIGHT_COLOR = "255, 178, 90";

// BAGONG AYOS (hiling ng user): "wag na yung may bilog na liwanag na
// lumalabas" - TINANGGAL na ang dating radial-gradient na BLOB (dating
// dito iginuguhit, additive/"lighter", may sariling kulay na dilaw/
// orange - kitang-kita bilang isang bilog na LIWANAG na parang
// nakapatong lang sa taas ng eksena). LATER na hiling din: TINANGGAL
// na rin ang sumunod na "hole-punch"/reveal-circle na pinalit dito sa
// drawDayNight (nagmumukha ring bilog, kahit walang idinaragdag na
// kulay) - PANTAY na lang ngayon ang dilim kahit saan (tingnan ang
// drawDayNight sa itaas), walang anumang uri ng "circle" sa paligid ng
// player.
//
// Wala nang ATASIN dito (world-space) - iniiwan na lang itong
// function na ito bilang no-op (hindi na tinatanggal nang buo dahil
// tinatawag pa rin ito ng drawPlayerWithTorchGlow, player.js) para
// hindi na kailangan pang baguhin/i-clean ang ibang file.
function drawTorchGlowWorld() {
  // Sinasadyang walang laman - erased na ang dating bilog na
  // additive glow AT ang sumunod na "hole"/reveal-circle (tingnan ang
  // malaking paliwanag sa itaas). Pantay na lang ang dilim ngayon
  // (drawDayNight), walang bilog na epekto kahit saan.
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
//
// AYOS (hiling ng user): "kapag naka off or wala pang lamp sa loob ng
// bahay, dapat walang ilaw sa bintana sa labas" - dating basta GABI NA
// lang ang kailangan (palaging naka-ilaw ang bintana ng LAHAT ng bahay
// sa town kapag gabi, kahit walang Light na naka-ON sa loob) - ngayon,
// kailangan munang TALAGANG may naka-ON na placed Light (light.js) SA
// LOOB ng partikular na bahay na iyon (tingnan ang loob ng function sa
// ibaba - hasLitPlacedLightInWorld per-point, gamit ang world na
// itinabi ni collectHouseWindowLightPoints).

const WINDOW_LIGHT_RADIUS = 16; // world pixels, hindi pa naka-multiply sa zoom
// BAGO (hiling ng user): "yung window lightray is dapat kasing kulay
// na lang nung torch light" - ginagamit na lang ngayon ang MISMONG
// TORCH_LIGHT_COLOR (itaas) sa halip na sariling hiwalay na kulay -
// garantisadong magkatugma na sila palagi.
const WINDOW_LIGHT_COLOR = TORCH_LIGHT_COLOR;

// AYOS (hiling ng user): "yung sa town yung mga bahay dun sa window at
// door is sobrang lakas ng ilaw medyo babaan mo yung light niya" - ang
// TALAGANG dahilan ay COMPOUNDING: bawat bahay sa town ay may ILANG
// magkakalapit na "windows"/"door" na tile (isang glow point BAWAT
// tile, tingnan getWindowLayerLightPoints/getDoorLayerLightPoints,
// map.js), lahat "lighter" (additive) ang pagsasama - kaya kahit
// mukhang katamtaman ang isang glow nang mag-isa, TALAGANG SOBRA na
// kapag pinagsama-sama ang lahat ng magkakalapit na ilaw ng isang
// bahay. SARILING (mas mahina) na mga constant ito, hiwalay sa
// WINDOW_LIGHT_RADIUS/COLOR (na ginagamit pa rin ng grassmap house
// lightray/drawHouseWindowLights, HINDI kasama sa hiling na ito) -
// TUNABLE, kung kailangan pang babaan/taasan.
const TOWN_BUILDING_LIGHT_RADIUS = 12; // dating WINDOW_LIGHT_RADIUS (16)
const TOWN_BUILDING_LIGHT_PEAK_ALPHA = 0.4; // dating 0.75
const TOWN_BUILDING_LIGHT_MID_ALPHA = 0.18; // dating 0.35

function drawHouseWindowLights() {
  if (typeof houseWindowLightPoints === "undefined") return;
  if (houseWindowLightPoints.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // AYOS (hiling ng user): "yung lightray ng window dapat naka ilalim
  // sa puno at sa grass at sa character" - WORLD SPACE na ito ngayon
  // (tinatawag na sa loob ng camera transform, draw.js, PAGKATAPOS
  // ang drawGrass()/drawMapObjects()) - kaya WALA nang manual na
  // camera.x/camera.zoom conversion dito (kaparehong-pareho ng ginawa
  // na sa drawGrassmapHouseLightray).
  const radius = WINDOW_LIGHT_RADIUS;

  for (const point of houseWindowLightPoints) {
    // BAGO (hiling ng user): "kapag naka off or wala pang lamp sa loob
    // ng bahay, yung labas ay dapat WALANG ilaw sa bintana - once lang
    // meron nang lamp AT naka-ON, doon lang lalabas" - dating basta
    // GABI NA lang ang batayan (walang pakialam sa aktwal na estado ng
    // Light sa loob) - ngayon, kailangan munang TALAGANG may naka-ON na
    // Light (hasLitPlacedLightInWorld, light.js) sa KATUMBAS na interior
    // world ng bahay na ito (point.world, tingnan ang
    // findInteriorWorldForHouseBBox/collectHouseWindowLightPoints,
    // map.js) - laktawan/huwag iguhit kung wala (o hindi natukoy) ang
    // interior world nito.
    if (
      !point.world ||
      typeof hasLitPlacedLightInWorld !== "function" ||
      !hasLitPlacedLightInWorld(point.world)
    ) {
      continue;
    }

    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${0.75 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${0.35 * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
// ILAW NA LUMALABAS SA BINTANA NG grassmapHouse, MULA SA LOOB
// =========================
//
// AYOS (bagong hiling ng user): "sa lightray lightray_grassmaphouse.png
// is mag appear yan kapag umilaw yung lamp kapag hindi di siya lilitaw"
// - IBINALIK ang sprite (assets/lightray/lightray_grassmaphouse.png,
// dating TINANGGAL - tingnan ang lumang paliwanag na dati nasa itaas
// nito) - PERO ngayon naka-GATE ito sa TALAGANG estado ng naka-lagay na
// Light (light.js) SA LOOB ng "grassmapHouse": kailangan munang may
// naka-ON na Light doon (hasLitPlacedLightInWorld) bago ito lumabas -
// walang Light (o naka-OFF), walang lightray - kaparehong-pattern ng
// ginagawa ng drawHouseWindowLights sa itaas (per-house window glow ng
// mga bahay sa town) - PERO gamit ang MISMONG sprite (hand-drawn na
// bintana+glow, hindi basta bilog na gradient) dahil kailangang
// eksaktong-eksaktong tumugma ito sa TALAGANG bintana ng bahay sa
// grassmap.png (hand-drawn na larawan, hindi tile-based).
//
// POSISYON: NA-VERIFY (Python pixel-inspection laban sa TALAGANG
// grassmap.png) - ang bintana ng bahay ay nasa humigit-kumulang
// x:286-323, y:441-460 (world pixels). Ang sprite mismo ay may
// "bintana" na guhit (ang maliwanag na 4-parisukat na outline sa
// itaas nito) na eksaktong kapareho ng laki nito (37x19px) - kaya ang
// TAMANG posisyon ng TOP-LEFT CORNER ng buong sprite (60x77px) ay
// (269, 435), para PAREHONG-PAREHO/naka-align ang guhit ng bintana sa
// sprite sa TALAGANG bintana sa background.
const LIGHTRAY_GRASSMAPHOUSE_IMAGE = new Image();
LIGHTRAY_GRASSMAPHOUSE_IMAGE.src = "./assets/lightray/lightray_grassmaphouse.png";

const LIGHTRAY_GRASSMAPHOUSE_WORLD_X = 269;
const LIGHTRAY_GRASSMAPHOUSE_WORLD_Y = 435;

// Ang interior world kung saan dapat naka-ON ang isang placed Light
// bago lumabas ang lightray - tingnan ang worlds.js (DOORS, "to:
// grassmapHouse").
const LIGHTRAY_GRASSMAPHOUSE_INTERIOR_WORLD = "grassmapHouse";

// =========================
// AYOS (bagong hiling ng user): "yung light ray is dapat nakapaloob sa
// pinetree, overlap siya ng pinetree yung lightray"
// =========================
//
// Ang lightray ay iginuguhit sa SCREEN SPACE, PAGKATAPOS ng
// drawDayNight ("lighter"/additive blend, tingnan sa ibaba) - kaya
// kahit may puno (pinetree, resources.js) na naunang naiguhit sa
// WORLD space (drawMapObjects, mas maaga sa buong frame), NAPAPATONG
// pa rin dito ang ray sa IBABAW ng puno (dahil huli itong iginuguhit),
// kahit alin ang mas malapit "dapat" - MALI, hiling ng user na
// "nakapaloob" dapat sa puno ang ray (ang puno ang nasa HARAP).
//
// AYOS: sa halip na buong retrace ng puno mismo (kumplikado - snow
// stage/chop/shake states), MASKED/PINUTOL na lang ang MISMONG larawan
// ng ray - isang beses lang ito kina-cache (isang offscreen canvas),
// gamit ang ALPHA/SILWETA ng BASE na larawan ng kilalang PINETREE na
// natatabihan/nakaharang dito (fixedTrees sa grassmap-resources.json,
// col:20/row:30 - ang PINAKAMALAPIT sa bintana) bilang "eraser"
// (destination-out) - kaya EKSAKTONG hugis ng puno (hindi basta
// parisukat) ang nabubutas sa ray, TAMA ang itsura ng "puno sa harap".
//
// Static/FIXED ang parehong node (col:20,row:30) at ang posisyon ng
// ray (LIGHTRAY_GRASSMAPHOUSE_WORLD_X/Y sa itaas) - kaya FIXED/hindi
// nagbabago ang RELATIBONG posisyon nila sa isa't isa (walang
// pakialam sa camera/zoom) - ligtas itong i-cache nang isang beses
// lang (hindi kailangang ulitin kada frame).
const LIGHTRAY_OVERLAPPING_PINETREE_IMAGE = new Image();
LIGHTRAY_OVERLAPPING_PINETREE_IMAGE.src = "./assets/objects/trees/pinetree.png";

const LIGHTRAY_OVERLAPPING_PINETREE_NODE = { col: 20, row: 30 };

let grassmapHouseLightrayMaskedCanvas = null;

// Kinukuha (o binubuo, isang beses lang) ang NAKA-MASK na bersyon ng
// ray - `null` habang HINDI pa fully-loaded ang DALAWANG larawan
// (ray mismo + pinetree).
function getGrassmapHouseLightrayMaskedSurface() {
  if (grassmapHouseLightrayMaskedCanvas) return grassmapHouseLightrayMaskedCanvas;

  if (
    !LIGHTRAY_GRASSMAPHOUSE_IMAGE.complete ||
    LIGHTRAY_GRASSMAPHOUSE_IMAGE.naturalWidth === 0 ||
    !LIGHTRAY_OVERLAPPING_PINETREE_IMAGE.complete ||
    LIGHTRAY_OVERLAPPING_PINETREE_IMAGE.naturalWidth === 0
  ) {
    return null;
  }

  const rayWidth = LIGHTRAY_GRASSMAPHOUSE_IMAGE.naturalWidth;
  const rayHeight = LIGHTRAY_GRASSMAPHOUSE_IMAGE.naturalHeight;

  const surface = document.createElement("canvas");

  surface.width = rayWidth;
  surface.height = rayHeight;

  const surfaceCtx = surface.getContext("2d");

  // (1) Ang ray mismo, buo muna - normal na pagguhit (source-over).
  surfaceCtx.drawImage(LIGHTRAY_GRASSMAPHOUSE_IMAGE, 0, 0);

  // (2) Kinakalkula ang posisyon ng puno RELATIBO sa TOP-LEFT ng ray
  // (LOCAL na coordinate space ng offscreen canvas na ito) - PAREHONG
  // FORMULA ng drawTreeAtOpacityAndScale (resources.js): destWidth base
  // sa TILE_SIZE*getActiveTreeDestWidthInTiles(), destHeight base sa
  // aspect ratio ng larawan mismo, anchor sa ILALIM-GITNA ng tile nito.
  const destWidthInTiles =
    typeof getActiveTreeDestWidthInTiles === "function"
      ? getActiveTreeDestWidthInTiles()
      : 4;

  const treeDestWidth = TILE_SIZE * destWidthInTiles;
  const treeDestHeight =
    treeDestWidth *
    (LIGHTRAY_OVERLAPPING_PINETREE_IMAGE.naturalHeight /
      LIGHTRAY_OVERLAPPING_PINETREE_IMAGE.naturalWidth);

  const treeWorldX =
    LIGHTRAY_OVERLAPPING_PINETREE_NODE.col * TILE_SIZE +
    TILE_SIZE / 2 -
    treeDestWidth / 2;
  const treeWorldY =
    LIGHTRAY_OVERLAPPING_PINETREE_NODE.row * TILE_SIZE +
    TILE_SIZE -
    treeDestHeight;

  const treeLocalX = treeWorldX - LIGHTRAY_GRASSMAPHOUSE_WORLD_X;
  const treeLocalY = treeWorldY - LIGHTRAY_GRASSMAPHOUSE_WORLD_Y;

  // (3) "Ibutas" ang EKSAKTONG SILWETA (alpha) ng puno mula sa ray -
  // "destination-out": kung saan may OPAQUE na pixel ang puno
  // (LIGHTRAY_OVERLAPPING_PINETREE_IMAGE), doon MABUBURA/magiging
  // transparent ang katumbas na pixel ng ray sa offscreen canvas na
  // ito - LUMALABAS na parang "nakapaloob"/natatakpan ng puno ang ray
  // (dahil kapag na-composite na ito sa TALAGANG frame, kung ano man
  // ang naunang naiguhit doon - ang puno mismo - ay makikita na sa
  // lugar na iyon SA HALIP na madagdagan pa ng liwanag ng ray).
  surfaceCtx.globalCompositeOperation = "destination-out";
  surfaceCtx.drawImage(
    LIGHTRAY_OVERLAPPING_PINETREE_IMAGE,
    treeLocalX,
    treeLocalY,
    treeDestWidth,
    treeDestHeight,
  );

  grassmapHouseLightrayMaskedCanvas = surface;

  return grassmapHouseLightrayMaskedCanvas;
}

// World space na ngayon ang pagguhit nito (hiling ng user: "yung
// lightray nung bahay is dapat nakapailalim sa tao at sa grass at sa
// trees") - LUMIPAT na ang TAWAG dito sa PINAKAUNA ng frame (tingnan
// ang draw.js), bago pa man ang drawGrass()/drawMapObjects, para
// AWTOMATIKONG natatakpan ito ng kahit anong damo/puno/player na
// naiguhit PAGKATAPOS nito (normal na draw-order occlusion, hindi na
// kailangang umasa sa dating "masked na pinetree cutout" trick sa
// ibaba - naiwan pa rin iyon, pero redundant/hindi na mahalaga
// ngayon). Dahil dito, DIREKTANG world coordinates na lang ang gamit
// sa pagguhit (WALA nang manual na camera.x/camera.zoom na
// conversion - nasa loob na kasi ito ng parehong ctx.scale/
// ctx.translate na ginagamit ng ibang world-space na pagguhit) -
// pareho pa rin ang "lighter"/additive blend (para kumakalaban sa
// dilim sa gabi) at ang pag-fade base sa nightAmount.
function drawGrassmapHouseLightray() {
  // Makikita lang ito HABANG NASA LABAS ka (world "grassmap") - hindi
  // ito lumalabas habang NASA LOOB ka na mismo ng bahay (walang saysay
  // doon, ang bintana mismo ay nakikita mula sa LABAS lang).
  if (typeof currentWorld === "undefined" || currentWorld !== "grassmap") {
    return;
  }

  // Kailangan munang may naka-ON na Light SA LOOB ng grassmapHouse -
  // walang Light (o naka-OFF pa lang) doon, walang lightray na lalabas.
  if (
    typeof hasLitPlacedLightInWorld !== "function" ||
    !hasLitPlacedLightInWorld(LIGHTRAY_GRASSMAPHOUSE_INTERIOR_WORLD)
  ) {
    return;
  }

  // NAKA-MASK na bersyon (tingnan ang paliwanag sa itaas) - `null`
  // habang hindi pa fully-loaded ang alinman sa dalawang larawan
  // (susubukan na lang ulit sa susunod na frame).
  const maskedSurface = getGrassmapHouseLightrayMaskedSurface();

  if (!maskedSurface) return;

  // Unti-unting nangingibabaw lang ito habang dumidilim (kaparehong
  // fade ng drawHouseWindowLights) - halos hindi mapapansin kapag
  // araw pa, kahit naka-ON na ang Light sa loob (makatuwiran - hindi
  // kapansin-pansin ang ilaw ng lamp laban sa liwanag ng araw).
  const nightAmount = typeof getNightAmount === "function" ? getNightAmount() : 0;

  if (nightAmount <= 0.05) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = nightAmount;
  ctx.drawImage(
    maskedSurface,
    LIGHTRAY_GRASSMAPHOUSE_WORLD_X,
    LIGHTRAY_GRASSMAPHOUSE_WORLD_Y,
    maskedSurface.width,
    maskedSurface.height,
  );
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
const TOWN_LAMP_LIGHT_RADIUS = 75; // dating 90 - hiling ng user: babaan ang ilaw
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

    // AYOS (hiling ng user): "tyaka yung 4 lamps sa gitna ng town" -
    // babaan din ang alpha nito (dating 0.75/0.36), TUNABLE.
    gradient.addColorStop(0, `rgba(${TOWN_LAMP_LIGHT_COLOR}, ${0.55 * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${TOWN_LAMP_LIGHT_COLOR}, ${0.24 * nightAmount})`);
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

  const radius = TOWN_BUILDING_LIGHT_RADIUS * camera.zoom;

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

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_PEAK_ALPHA * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_MID_ALPHA * nightAmount})`);
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

  // AYOS (hiling ng user): "yung lightray ng window dapat naka ilalim
  // sa puno at sa grass at sa character" - WORLD SPACE na ito ngayon
  // (tinatawag na sa loob ng camera transform, draw.js) - WALA nang
  // manual na camera.x/camera.zoom conversion dito.
  const radius = TOWN_BUILDING_LIGHT_RADIUS;

  for (const point of points) {
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_PEAK_ALPHA * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_MID_ALPHA * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
// LAMP/WINDOW GLOW NG MGA BUILDING TEMPLATE (Coffee Shop/Tavern/atbp) -
// hiling ng user: "yung coffeeshop at tavern kapag gabi na is meron
// ilaw yung mga lamp nila at yung window wag lang masyadong maliwanag"
// =========================
//
// Kaparehong-pareho ang disenyo ng drawTownWindowLights sa itaas (world
// space, tinatawag bago pa man ang drawGrass()/drawMapObjects() sa
// draw.js - kaya "naaapakan"/natatakpan ng puno/damo/player, PERO
// kikinang pa rin sa mga bahaging bukas) - ang mismong POSISYON lang
// ang naiiba (getCustomHouseLightPoints, builder.js, base sa
// house.col/row + ang `lightPoints` ng ginamit na template). Gamit ang
// PAREHONG mahinang TOWN_BUILDING_LIGHT_* constants (hiling ng user:
// "wag lang masyadong maliwanag") - hindi kailangan ng sarili pang
// hiwalay na numero.
function drawCustomHouseLights() {
  if (typeof getCustomHouseLightPoints !== "function") return;

  const points = getCustomHouseLightPoints();

  if (points.length === 0) return;

  const nightAmount = getNightAmount();

  if (nightAmount <= 0.05) return; // araw pa, halos walang epekto

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const radius = TOWN_BUILDING_LIGHT_RADIUS;

  for (const point of points) {
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius,
    );

    gradient.addColorStop(0, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_PEAK_ALPHA * nightAmount})`);
    gradient.addColorStop(0.55, `rgba(${WINDOW_LIGHT_COLOR}, ${TOWN_BUILDING_LIGHT_MID_ALPHA * nightAmount})`);
    gradient.addColorStop(1, `rgba(${WINDOW_LIGHT_COLOR}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
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
