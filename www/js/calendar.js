// =========================
// KALENDARYO NG MUNDO (araw, buwan, panahon)
// =========================
//
// Lahat dito ay PURONG KWENTA mula sa TOTOONG orasan (Date.now) - walang
// itinatabing estado, kaya tuloy-tuloy ang kalendaryo kahit mag-refresh
// o mag-restart ka (tulad ng day/night sa atmosphere.js at ang snow
// cycle dati). Ang parehong "araw" (1 araw = 30 minuto, mula sa
// DAY_NIGHT_SECONDS sa atmosphere.js) ang pinagbabatayan ng petsa,
// buwan, snow, at ulan - kaya magkatugma silang lahat.
//
// 1 buwan = 30 araw (pinasimple - walang 28/29/31, walang leap year).
// 12 buwan = 1 taon = 360 araw.

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CALENDAR_DAYS_PER_MONTH = 30;
const CALENDAR_MONTHS_PER_YEAR = 12;

// =========================
// 3 "SEASON BLOCK" KADA BUWAN (rain / snow / sunny)
// =========================
//
// Sa halip na paisa-isang random na araw lang (dating gawi), ang buong
// 30-araw na buwan ay hinahati ngayon sa TATLONG magkakasunod na
// "block" - isa bawat panahon (WEATHER_TYPES sa ibaba), tig-10 araw
// bawat isa (30 / 3 = 10). RANDOM ang PAGKAKASUNOD-SUNOD ng tatlong
// block kada buwan (hal. minsan Rain->Snow->Sunny, minsan
// Sunny->Rain->Snow, atbp.) - seeded sa (year, monthIndex) kaya pareho
// palagi ang resulta para sa parehong buwan, pero iba-iba sa
// magkakaibang buwan.
// AYOS: naka-"rain"-lang ito (walang "snow"/"sunny") - kaya kailanman
// hindi naging totoo ang isSnowDay/isSnowWeather() sa buong laro
// (walang block na maaaring pumili ng "snow"). Ibinalik sa
// dokumentadong gawi (tingnan ang CLAUDE.md, entry 26) para
// matestuhan ang bagong snowtown reskin ng "town" (worlds.js/map.js).
const WEATHER_TYPES = ["snow"];
const WEATHER_BLOCK_DAYS = CALENDAR_DAYS_PER_MONTH / WEATHER_TYPES.length;

// Sa loob ng isang "rain" block: ilang porsyento ng mga araw doon ang
// magiging THUNDERSTORM sa halip na ordinaryong ulan. Sa loob ng
// "snow" block naman: ilang porsyento ang magiging SNOWSTORM.
const THUNDERSTORM_CHANCE = 0.3;
const SNOW_STORM_CHANCE = 0.3;

// =========================
// SEEDED RANDOM
// =========================
//
// Gusto nating "random" ang pagkakasunod-sunod ng mga season block at
// kung alin sa mga araw doon ay bagyo, PERO hindi dapat nagbabago
// paulit-ulit sa bawat frame o pagka-refresh - dapat pareho palagi
// para sa PAREHONG buwan/araw. Kaya hash function ito (mulberry32-
// type), hindi Math.random(): kinukwenta base sa isang integer seed,
// palaging iisa ang resulta para sa parehong seed.
function seededRandom(seed) {
  let t = (seed += 0x6d2b79f5);

  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Random na PAGKAKASUNOD-SUNOD (Fisher-Yates shuffle, seeded) ng 3
// season block para sa isang partikular na (year, monthIndex) - laging
// pareho ang resulta sa parehong buwan, pero iba-iba bawat buwan.
function getMonthWeatherOrder(year, monthIndex) {
  const order = WEATHER_TYPES.slice();

  for (let i = order.length - 1; i > 0; i--) {
    const r = seededRandom(year * 1000 + monthIndex * 7 + 900 + i);
    const j = Math.floor(r * (i + 1));

    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
}

// Alin sa 3 panahon ("rain"/"snow"/"sunny") ang naka-atas sa isang
// partikular na araw ng buwan - base sa kung aling 10-araw na block
// (WEATHER_BLOCK_DAYS) ito napapasukan.
function getWeatherTypeForDay(year, monthIndex, dayOfMonth) {
  const order = getMonthWeatherOrder(year, monthIndex);
  const blockIndex = Math.min(
    order.length - 1,
    Math.floor((dayOfMonth - 1) / WEATHER_BLOCK_DAYS),
  );

  return order[blockIndex];
}

// =========================
// PETSA AT ORAS
// =========================

// Simula ng "Taon 1, Enero 1" ng mundo - ITO na ang GAME EPOCH mula sa
// gametime.js (dinamiko, itinatakda sa unang beses maglaro - tingnan
// ang paliwanag doon), kaya laging Taon 2000 (CALENDAR_START_YEAR sa
// ibaba) ang simula ng isang BAGONG laro, hindi na nakatali sa isang
// FIXED na totoong petsa (na unti-unting "tumatanda" habang tumatagal
// ang totoong panahon).

// Ilang buong "araw" na ang lumipas mula sa epoch - ito ang pundasyon
// ng lahat: petsa, buwan, snow, ulan. Gumagamit ng getGameNow() (hindi
// direktang Date.now()) para isama ang anumang SLEEP OFFSET (tingnan
// ang gametime.js/bed.js).
function getTotalDaysElapsed() {
  return Math.floor((getGameNow() - gameEpochMs) / 1000 / DAY_NIGHT_SECONDS);
}

// Ang taon/buwan/araw-ng-buwan para sa isang partikular na totalDays -
// hiwalay na function ito (hindi lang bahagi ng getCalendarState) dahil
// kailangan din ito ng dig.js para malaman kung "kahapon" (totalDays-1)
// ay araw ng niyebe, para sa unti-unting pagtubo ng damo pagkatapos
// mag-snow (tingnan ang isSnowDayForTotalDays sa ibaba).
const CALENDAR_START_YEAR = 2000;

function getYearMonthForTotalDays(totalDays) {
  const year =
    Math.floor(
      totalDays / (CALENDAR_DAYS_PER_MONTH * CALENDAR_MONTHS_PER_YEAR),
    ) + CALENDAR_START_YEAR;
  const monthIndex =
    Math.floor(totalDays / CALENDAR_DAYS_PER_MONTH) % CALENDAR_MONTHS_PER_YEAR;
  const dayOfMonth = (totalDays % CALENDAR_DAYS_PER_MONTH) + 1;

  return { year, monthIndex, dayOfMonth };
}

function isSnowDayForTotalDays(totalDays) {
  const { year, monthIndex, dayOfMonth } = getYearMonthForTotalDays(totalDays);

  return getWeatherTypeForDay(year, monthIndex, dayOfMonth) === "snow";
}

// Ang buong kasalukuyang estado ng kalendaryo - isang beses lang
// kinukwenta ang lahat dito, ginagamit ito ng snow.js/rain.js/UI.
function getCalendarState() {
  const totalDays = getTotalDaysElapsed();
  const { year, monthIndex, dayOfMonth } = getYearMonthForTotalDays(totalDays);

  const secondsIntoDay = (getGameNow() / 1000) % DAY_NIGHT_SECONDS;
  const dayProgress = secondsIntoDay / DAY_NIGHT_SECONDS; // 0..1

  const totalMinutesOfDay = dayProgress * 24 * 60;
  const hour24 = Math.floor(totalMinutesOfDay / 60);
  const minute = Math.floor(totalMinutesOfDay % 60);

  // 06:00 hanggang 17:59 = araw, 18:00 hanggang 05:59 = gabi - tumutugma
  // sa DAY_NIGHT_STOPS sa atmosphere.js (doon talaga nagmumula ang
  // ACTUAL na tint/kulay ng kalangitan - dito lang ito para sa simpleng
  // "araw ba o gabi?", hal. sun/moon icon).
  const isDaytime = hour24 >= 6 && hour24 < 18;

  // --- PANAHON NGAYONG ARAW: alin sa 3 season-block ito napapasukan ---
  const weatherType = getWeatherTypeForDay(year, monthIndex, dayOfMonth);

  const isSnowDay = weatherType === "snow";
  const isRainDay = weatherType === "rain";

  // Seeded PER-ARAW (gamit ang totalDays, hindi lang ang buwan) - kaya
  // magkaiba-iba ang bawat araw sa loob ng isang block, hindi laging
  // pareho ang bagyo-o-hindi kada araw ng buong block.
  const isSnowStorm =
    isSnowDay && seededRandom(totalDays * 977 + 41) < SNOW_STORM_CHANCE;
  const isThunderstorm =
    isRainDay && seededRandom(totalDays * 977 + 43) < THUNDERSTORM_CHANCE;

  return {
    totalDays,
    year,
    monthIndex,
    monthName: MONTH_NAMES[monthIndex],
    dayOfMonth,
    isDaytime,
    hour24,
    minute,
    isSnowDay,
    isSnowStorm,
    isRainDay,
    isThunderstorm,
  };
}
