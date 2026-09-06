// =========================
// BAKAS SA NIYEBE
// =========================
//
// Tuwing naglalakad ang player sa labas, may naiiwang yapak sa niyebe.
// Unti-unting nawawala ang bawat bakas sa loob ng 30 segundo - parang
// natatabunan ng bagong niyebe.
//
// Nasa WORLD coordinates ang mga bakas (hindi screen), kaya nananatili
// sila kung saan mo sila iniwan kahit gumalaw ang camera. Iginuguhit
// sila sa LUPA - sa ibabaw ng niyebeng nakalatag, pero sa ILALIM ng
// puno, bahay, at ng player mismo. Kaya kung papasok ka sa likod ng
// puno, natatakpan din ang mga bakas mo doon.

const FOOTPRINT_LIFETIME = 30;

// Gaano kalayo ang isang hakbang bago mag-iwan ng bagong bakas, sa
// world pixels. Masyadong maliit = magiging tuloy-tuloy na guhit;
// masyadong malaki = parang tumatalon ang player.
const FOOTPRINT_SPACING = 7;

// Gaano kalayo mula sa gitna ang kaliwa at kanang paa.
const FOOTPRINT_SIDE_OFFSET = 2.5;

const FOOTPRINT_RADIUS_X = 2.1;
const FOOTPRINT_RADIUS_Y = 1.4;

// Ilang bahagi ng buhay nito ang buong-linaw bago magsimulang kumupas.
// Kung wala nito, kumukupas agad ang bakas paglabas pa lang - mas
// maganda kung nananatili muna siyang malinaw, saka unti-unting
// nawawala sa dulo.
const FOOTPRINT_HOLD = 0.45;

// Naghambing ako ng tatlong lakas laban sa mismong niyebe ng mapa.
// Ang 0.28 na may mapusyaw na kulay ay halos hindi makita sa tunay na
// laki - kailangan talagang mas madilim at mas malinaw kaysa sa
// inaakala, dahil napakaliwanag ng lupa dito.
const FOOTPRINT_MAX_OPACITY = 0.42;

// Hangganan para hindi lumobo ang listahan kung sobrang tagal kang
// naglalakad. Sa 30 segundo at ganitong espasyo, malayong-malayo pa
// tayo sa hangganang ito - proteksyon lang siya.
const FOOTPRINT_MAX = 400;

let footprints = [];

// Saan huling nag-iwan ng bakas, at aling paa ang susunod.
let lastFootprintX = null;
let lastFootprintY = null;
let nextFootIsLeft = true;

function clearFootprints() {
  footprints = [];
  lastFootprintX = null;
  lastFootprintY = null;
}

function addFootprint(x, y, dirX, dirY) {
  // Ang offset ng paa ay PATAGILID sa direksyon ng paglakad - kaya
  // kapag naglalakad ka pataas, magkatabi ang kaliwa't kanan; kapag
  // patagilid, magkapatong-patong sila pataas-pababa. Ito ang
  // perpendicular ng direksyon: (x, y) -> (-y, x).
  const side = nextFootIsLeft ? 1 : -1;

  footprints.push({
    x: x + -dirY * FOOTPRINT_SIDE_OFFSET * side,
    y: y + dirX * FOOTPRINT_SIDE_OFFSET * side,
    bornAt: performance.now(),
  });

  nextFootIsLeft = !nextFootIsLeft;

  if (footprints.length > FOOTPRINT_MAX) {
    footprints.splice(0, footprints.length - FOOTPRINT_MAX);
  }
}

function updateFootprints() {
  const now = performance.now();

  // Tanggalin ang mga lumang bakas. Nasa unahan ng listahan ang
  // pinakaluma (sunod-sunod kasi ang pagdagdag), kaya sapat na ang
  // pagbibilang mula sa simula.
  let expired = 0;

  while (
    expired < footprints.length &&
    (now - footprints[expired].bornAt) / 1000 >= FOOTPRINT_LIFETIME
  ) {
    expired++;
  }

  if (expired > 0) footprints.splice(0, expired);

  // Sa loob ng bahay walang niyebe, kaya walang bakas. Wala ring bagong
  // bakas kapag HINDI umuulan ng niyebe ngayon (hiling ng user: "gusto
  // ko lang lumitaw ang bakas/niyebe kapag umuulan talaga") - dating
  // wala itong check dito, kaya nagpapatuloy pa rin ang mga lumang
  // bakas na naiwan noong huling snow day kahit ubod-linaw na ang araw
  // ngayon (walang niyebe), at patuloy pang nagdaragdag ng bago habang
  // naglalakad ang player kahit HINDI umuulan.
  if (
    isIndoors() ||
    typeof isSnowWeather !== "function" ||
    !isSnowWeather()
  ) {
    lastFootprintX = null;
    lastFootprintY = null;

    // Alisin din ang mga natirang bakas mula sa nakaraang snow day -
    // hindi na dapat sila makita/mag-fade out sa isang araw na walang
    // niyebe.
    if (footprints.length > 0) footprints = [];

    return;
  }

  if (!player.moving) return;

  const box = getPlayerCollisionBox();

  const footX = box.x + box.width / 2;
  const footY = box.y + box.height;

  if (lastFootprintX === null) {
    lastFootprintX = footX;
    lastFootprintY = footY;
    return;
  }

  const deltaX = footX - lastFootprintX;
  const deltaY = footY - lastFootprintY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance < FOOTPRINT_SPACING) return;

  addFootprint(footX, footY, deltaX / distance, deltaY / distance);

  lastFootprintX = footX;
  lastFootprintY = footY;
}

// Iginuguhit ito SA LOOB ng camera transform (world space) - tingnan
// ang draw.js.
function drawFootprints() {
  if (footprints.length === 0) return;

  const now = performance.now();

  ctx.save();

  // Bahagyang mas madilim kaysa sa niyebe - parang lubog na yapak na
  // may anino sa loob.
  ctx.fillStyle = "#6b768f";

  for (const print of footprints) {
    const age = (now - print.bornAt) / 1000 / FOOTPRINT_LIFETIME;

    if (age >= 1) continue;

    const fade =
      age < FOOTPRINT_HOLD ? 1 : 1 - (age - FOOTPRINT_HOLD) / (1 - FOOTPRINT_HOLD);

    ctx.globalAlpha = fade * FOOTPRINT_MAX_OPACITY;

    ctx.beginPath();
    ctx.ellipse(
      print.x,
      print.y,
      FOOTPRINT_RADIUS_X,
      FOOTPRINT_RADIUS_Y,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.restore();
}
