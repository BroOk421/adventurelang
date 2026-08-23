// =========================
// SNOW EFFECT (falling snow, slow-mo)
// =========================
//
// Mga snowflakes na dahan-dahan bumabagsak, may kaunting pagkiling/sway
// papakaliwa't pakanan para hindi "robotic"/tuwid-tuwid lang ang bagsak.
// Ginuguhit ito SA IBABAW ng buong mapa/player (huling layer), kaya
// parang totoong niyebe na bumabagsak sa harap ng lahat.
//
// MAHALAGA: nakadikit ang niyebe sa MUNDO, hindi sa screen. Dati kasi,
// screen-space ang posisyon ng bawat snowflake - kaya kapag naglakad o
// tumakbo ang player, kasama/sumusunod ang buong niyebe sa kanya (parang
// nakadikit sa camera), na hindi natural tingnan.
//
// Ngayon, ang posisyon ng bawat snowflake ay nasa WORLD coordinates
// (naka-multiply sa zoom, kaya device-pixel pa rin ang unit). Sa
// pagguhit, ibinabawas natin ang posisyon ng camera - kaya nananatili
// ang niyebe sa kinaroroonan nito sa mundo habang gumagalaw ang player.
// Hindi pa rin sila apektado ng zoom pagdating sa LAKI, kaya pareho pa
// rin sila kalaki at malinaw kahit anong zoom.

// =========================
// DALAWANG LAYER: LIKOD AT HARAP
// =========================
//
// Hindi lahat ng niyebe ay nasa harapan. Ang mga MALAYO (maliit,
// mabagal, malabo) ay iginuguhit sa LIKOD ng mga puno, bahay, at ng
// player mismo - kaya natatakpan sila. Ang mga MALAPIT naman ay nasa
// harap ng lahat. Dito nanggagaling ang pakiramdam na nasa LOOB ka ng
// pagbagsak ng niyebe, hindi nakatingin lang sa likod ng salamin.
//
// Ang layer ay HIWALAY na palabunutan - hindi nakadikit sa laki.
//
// Dati, ang "depth" ang batayan: kung maliit at malabo ang snowflake,
// nasa likod siya. Mukhang matalino pero HINDI ITO NAKIKITA: yung mga
// nasa likod ay puro pinakamaliliit (radius 2-3.3) at pinakamalalabo
// (opacity 0.5-0.7), kaya kapag nadaanan nila ang isang puno, wala
// namang mapapansing nawala. Parang walang epekto.
//
// Ngayon, kahit MALAKI at MALINAW na snowflake ay puwedeng mapunta sa
// likod. Doon mo makikita ang epekto: may malalaking snowflake na
// dumadaan sa LIKOD ng puno at ng tao, habang ang iba naman ay dumadaan
// sa harapan nila.
const SNOW_BACK_LAYER_SHARE = 0.45;

// =========================
// PABALIK-BALIK NA PANAHON (KALENDARYO)
// =========================
//
// Hindi na random na cycle - ang niyebe ay sumusunod na ngayon sa
// KALENDARYO (tingnan ang calendar.js): isang random na araw lang
// (25-30) kada buwan ang umuulan, buong "araw" (30 minuto). May
// unti-unting paglakas/paghina sa simula/dulo ng araw na iyon, kaya
// hindi biglaang nawawala o sumusulpot.
const SNOW_FADE_SECONDS = 25;

const SNOW_FLAKE_COUNT = 180;

// Napakababagal - "slow-mo" na bagsak, hindi parang normal na snow.
// Sa panahon ng SNOWSTORM (tingnan ang getSnowSpeedMultiplier), mas
// mabilis at mas makapal ito - normal/mabagal kapag hindi bagyo.
const SNOW_MIN_SPEED = 0.1;
const SNOW_MAX_SPEED = 0.2;
const SNOW_STORM_SPEED_MULTIPLIER = 3.5;
const SNOW_STORM_SIZE_MULTIPLIER = 1.3;

// AYOS: "in-remake" ang itsura ng bawat snowflake para tumugma sa
// sinend na reference code (standalone "Top Down Snow" na HTML/canvas
// demo) - doon, MALILIIT NA KUWADRADONG PIXEL ang bawat isa (fillRect,
// integer na laki - 1px kadalasan, 2px minsan), hindi mga bilog na
// gradient/blur - mas tumutugma ito sa "image-rendering: pixelated" na
// istilo ng buong laro. Dating "radius" (bilog, 2-5px na patuloy/hindi
// integer) - ngayon "size" na (kuwadrado, integer pixel lang: 1-3px).
const SNOW_MIN_SIZE = 1;
const SNOW_MAX_SIZE = 3;

const SNOW_MIN_OPACITY = 0.5;
const SNOW_MAX_OPACITY = 0.95;

// Gaano kadikit ang niyebe sa mundo:
//   1    = ganap na nakadikit sa mundo (hindi talaga sumusunod sa player)
//   0    = nakadikit sa screen (dating ugali - sumusunod sa player)
//   0.8  = bahagyang sumusunod, parang malapit sa camera ang niyebe
//          (parallax) - subukan mo kung gusto mo ng kaunting lalim.
const SNOW_PARALLAX = 1;

// Dagdag na espasyo sa labas ng screen bago ibalik/i-recycle ang isang
// snowflake, para walang biglaang "pop" sa mismong gilid.
const SNOW_RESET_MARGIN = 40;

let snowflakes = [];

// =========================
// SPARKLE NG NIYEBE SA LUPA (kahit saang tile)
// =========================
//
// Kapareho ng ginawa nating rain ground splash (rain.js) - munting
// kumikinang na "+" na sparkle na random na lumalabas kahit saang tile
// habang umuulan ng niyebe, para makita na "may nangyayari" sa lupa
// mismo, hindi lang bumabagsak na snowflakes sa hangin. Naka-offset
// tulad ng snowflakes mismo, at iginuguhit sa PAGITAN ng dalawang
// world-transform block (tingnan ang draw.js), kaya nasa ILALIM ng
// player/mga bagay.

let snowGroundSparkles = []; // { x, y, bornAt }

const SNOW_SPARKLE_DURATION_MS = 500;
const SNOW_SPARKLE_SPAWN_INTERVAL_MS = 90;

let snowSparkleLastSpawnAt = 0;

function maybeSpawnSnowGroundSparkle(offsetX, offsetY) {
  const now = performance.now();

  if (now - snowSparkleLastSpawnAt < SNOW_SPARKLE_SPAWN_INTERVAL_MS) return;

  snowSparkleLastSpawnAt = now;

  snowGroundSparkles.push({
    x: offsetX + Math.random() * canvas.width,
    y: offsetY + Math.random() * canvas.height,
    bornAt: now,
  });
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Ang offset ng camera sa DEVICE pixels. Gumagamit tayo ng Math.round
// dito para tugma sa pixel-snapping ng camera sa draw.js - kung hindi,
// bahagyang "nagsi-shimmer"/nanginginig ang niyebe laban sa mapa.
function getSnowOffsetX() {
  return Math.round(camera.x * camera.zoom * SNOW_PARALLAX);
}

function getSnowOffsetY() {
  return Math.round(camera.y * camera.zoom * SNOW_PARALLAX);
}

// Ang laki, bilis, at linaw ng isang snowflake ay HINDI hiwa-hiwalay na
// random - iisang "lalim" (depth) ang pinagmumulan nilang tatlo:
//
//   depth = 0  ->  malayo:  maliit, mabagal, malabo
//   depth = 1  ->  malapit: malaki, mabilis, malinaw
//
// Ganito talaga ang totoong niyebe - ang malapit sa'yo ay malaki AT
// mabilis. Kapag hiwa-hiwalay ang random ng bawat isa, may lumalabas na
// kakaiba (hal. malaking snowflake na napakabagal), at nawawala ang
// pakiramdam ng lalim.
function randomSnowflakeLook() {
  const depth = Math.random();

  return {
    depth,
    layer: Math.random() < SNOW_BACK_LAYER_SHARE ? "back" : "front",
    // Integer pixel size (1-3px) - KUWADRADO (hindi bilog), kagaya ng
    // sinend na reference code - tumataas papalapit sa "front"/depth=1.
    size: Math.round(
      SNOW_MIN_SIZE + depth * (SNOW_MAX_SIZE - SNOW_MIN_SIZE),
    ),
    speed: SNOW_MIN_SPEED + depth * (SNOW_MAX_SPEED - SNOW_MIN_SPEED),
    opacity: SNOW_MIN_OPACITY + depth * (SNOW_MAX_OPACITY - SNOW_MIN_OPACITY),
    // Floating motion - sine wave (paikot-ikot pakaliwa't pakanan)
    // PLUS munting PATULOY na "drift" (parang hangin, hindi
    // umaandar/umuuga) - pareho itong dalawang bagay na ginagamit ng
    // reference code (angle/angleSpeed = sway dito, drift = drift).
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: randomRange(0.01, 0.025),
    swayAmount: randomRange(0.3, 1),
    drift: randomRange(-0.4, 0.4),
  };
}

// Gaano kalakas ang niyebe ngayon: 0 = wala, 1 = buong lakas. Naka-batay
// sa TOTOONG orasan (Date.now, hindi performance.now) - kaya kahit
// mag-refresh o mag-restart ka, tuloy-tuloy ang panahon: kung tila na
// ang niyebe bago ka umalis, tila pa rin pagbalik mo. Sa loob ng bahay,
// laging 0 - walang niyebe sa loob.
function getSnowIntensity() {
  if (typeof isIndoors === "function" && isIndoors()) return 0;

  if (!getCalendarState().isSnowDay) return 0;

  // Buong "araw" (30 minuto, DAY_NIGHT_SECONDS) ang tagal ng snow day -
  // unti-unting lumalakas sa simula, unti-unting humihina sa dulo.
  const secondsIntoDay = (getGameNow() / 1000) % DAY_NIGHT_SECONDS;

  if (secondsIntoDay < SNOW_FADE_SECONDS) {
    return secondsIntoDay / SNOW_FADE_SECONDS;
  }

  const secondsUntilDayEnds = DAY_NIGHT_SECONDS - secondsIntoDay;

  if (secondsUntilDayEnds < SNOW_FADE_SECONDS) {
    return secondsUntilDayEnds / SNOW_FADE_SECONDS;
  }

  return 1;
}

// 1 = normal (mabagal), mas malaki kapag SNOWSTORM ang araw na ito -
// "mabilis" ang bawat snowflake sa panahon ng bagyo.
function getSnowSpeedMultiplier() {
  return getCalendarState().isSnowStorm ? SNOW_STORM_SPEED_MULTIPLIER : 1;
}

// Ang x/y dito ay WORLD position (sa device pixels). Ang bagong
// snowflake ay laging inilalagay sa loob (o sa itaas mismo) ng
// KASALUKUYANG tanawin, kaya kahit saan pumunta ang player, may niyebe
// pa ring bumabagsak sa paligid niya.
function createSnowflake(randomizeY, offsetX, offsetY) {
  return {
    x: offsetX + Math.random() * canvas.width,
    y:
      offsetY +
      (randomizeY
        ? Math.random() * canvas.height
        : // Laging galing sa ITAAS ng view, pero naka-randomize kung
          // gaano kalayo sa itaas (hindi lang -SNOW_MAX_SIZE*2 na
          // pareho para sa lahat) - kung hindi, isang tuwid na "linya"
          // ng niyebe ang bababa nang sabay-sabay sa unang segundo.
          // Sa halip, unti-unti/staggered ang pagdating ng bawat
          // snowflake sa view, kaya paunti-unting napupuno ang buong
          // taas ng screen mula sa itaas pababa.
          -(SNOW_MAX_SIZE * 2 + Math.random() * canvas.height)),
    ...randomSnowflakeLook(),
  };
}

function initSnow() {
  snowflakes = [];

  const offsetX = getSnowOffsetX();
  const offsetY = getSnowOffsetY();

  for (let i = 0; i < SNOW_FLAKE_COUNT; i++) {
    // false = laging galing sa ITAAS ng view (hindi na ikinakalat sa
    // BUONG screen agad) - kahit ang unang batch. Kaya sa umpisa,
    // unti-unti munang tumatakip ang niyebe mula sa itaas pababa,
    // hanggang sa maabot ang ilalim ng screen - hindi bigla-biglang
    // puno na agad ang buong tanawin sa unang segundo.
    snowflakes.push(createSnowflake(false, offsetX, offsetY));
  }
}

// Binibigyan ng bagong laki/bilis/linaw ang isang snowflake - ginagamit
// tuwing bagong bagsak siya mula sa itaas, para hindi halatang paulit-
// ulit lang ang IISANG hanay ng niyebe.
function refreshSnowflakeLook(flake) {
  Object.assign(flake, randomSnowflakeLook());
}

function updateSnow() {
  const now = performance.now();

  snowGroundSparkles = snowGroundSparkles.filter(
    (sparkle) => now - sparkle.bornAt < SNOW_SPARKLE_DURATION_MS,
  );

  if (snowflakes.length === 0) initSnow();

  const offsetX = getSnowOffsetX();
  const offsetY = getSnowOffsetY();

  if (getSnowIntensity() > 0) {
    maybeSpawnSnowGroundSparkle(offsetX, offsetY);
  }

  const wrapWidth = canvas.width + SNOW_RESET_MARGIN * 2;
  const wrapHeight = canvas.height + SNOW_RESET_MARGIN * 2;

  const speedMultiplier = getSnowSpeedMultiplier();

  for (const flake of snowflakes) {
    flake.y += flake.speed * speedMultiplier;
    flake.swayPhase += flake.swaySpeed;
    flake.x += Math.sin(flake.swayPhase) * flake.swayAmount * 0.1;
    // Munting PATULOY na "drift" (hangin) - dagdag sa sway, kagaya ng
    // reference code (this.drift * 0.05).
    flake.x += flake.drift * 0.05;

    // UMIIKOT (wrap) ang niyebe sa paligid ng tanawin. Mahalaga na sa
    // KABILANG gilid siya lumalabas, hindi laging sa itaas:
    //
    //  - Nahulog sa ibaba (dahil bumabagsak siya) -> babalik sa itaas.
    //  - Lumabas sa itaas (dahil naglakad PABABA ang player, kaya
    //    umaakyat ang niyebe kumpara sa screen) -> babalik sa IBABA.
    //
    // Kung laging sa itaas ibabalik, mauubusan ng niyebe ang screen
    // kapag tuloy-tuloy kang naglalakad pababa - lahat ng snowflake ay
    // maiipit sa itaas na gilid.

    const screenY = flake.y - offsetY;

    if (screenY > canvas.height + SNOW_RESET_MARGIN) {
      flake.y -= wrapHeight;
      flake.x = offsetX + Math.random() * canvas.width;
      refreshSnowflakeLook(flake);
    } else if (screenY < -SNOW_RESET_MARGIN) {
      flake.y += wrapHeight;
    }

    const screenX = flake.x - offsetX;

    if (screenX > canvas.width + SNOW_RESET_MARGIN) {
      flake.x -= wrapWidth;
    } else if (screenX < -SNOW_RESET_MARGIN) {
      flake.x += wrapWidth;
    }
  }
}

// Dalawang beses tinatawag ito kada frame: isa para sa "back" (bago
// iguhit ang mga puno/bahay/player) at isa para sa "front" (pagkatapos
// ng lahat). Tingnan ang draw.js para sa pagkakasunod-sunod.
//
// AYOS: "in-remake" ang paraan ng pagguhit dito para tumugma sa
// sinend na reference code - dating BILOG (ctx.arc, may blur/AA sa
// gilid dahil sa fractional radius) ang bawat snowflake; ngayon,
// MALIIT NA KUWADRADONG PIXEL (ctx.fillRect, may Math.floor para
// TALAGANG crisp/walang antialiasing) - mas tumutugma ito sa
// "image-rendering: pixelated" na istilo ng buong laro (kagaya
// mismo ng ginawa ng reference code).
function drawSnow(layer) {
  if (snowflakes.length === 0) return;

  const intensity = getSnowIntensity();

  if (intensity <= 0) return;

  const offsetX = getSnowOffsetX();
  const offsetY = getSnowOffsetY();

  // Mas malaki/makapal ang bawat snowflake sa panahon ng snowstorm -
  // "much snow" na hitsura, kasabay ng mas mabilis na bagsak.
  const sizeMultiplier = getCalendarState().isSnowStorm
    ? SNOW_STORM_SIZE_MULTIPLIER
    : 1;

  ctx.save();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

  for (const flake of snowflakes) {
    if (flake.layer !== layer) continue;

    ctx.globalAlpha = flake.opacity * intensity;

    const size = Math.max(1, Math.round(flake.size * sizeMultiplier));

    ctx.fillRect(
      Math.floor(flake.x - offsetX),
      Math.floor(flake.y - offsetY),
      size,
      size,
    );
  }

  ctx.restore();
}

// Munting kumikinang na "+" na sparkle sa lupa - papalaki tapos
// papaliit habang kumukupas (twinkle). Tinatawag ito ng draw.js sa
// PAGITAN ng dalawang world-transform block (kapareho ng drawSnow
// "back"), kaya nasa ILALIM ito ng player at ng mga bagay sa mapa.
function drawSnowGroundSparkles() {
  if (snowGroundSparkles.length === 0) return;

  const now = performance.now();
  const offsetX = getSnowOffsetX();
  const offsetY = getSnowOffsetY();

  ctx.save();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;

  for (const sparkle of snowGroundSparkles) {
    const progress = Math.min(
      1,
      (now - sparkle.bornAt) / SNOW_SPARKLE_DURATION_MS,
    );
    const size = (1 - Math.abs(progress - 0.5) * 2) * 3;

    ctx.globalAlpha = (1 - progress) * 0.7;

    const x = sparkle.x - offsetX;
    const y = sparkle.y - offsetY;

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
  }

  ctx.restore();
}
