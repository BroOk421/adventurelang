// =========================
// AUDIO (background music + sound effects)
// =========================
//
// Simpleng audio manager gamit ang plain HTMLAudioElement - walang
// external library. Dalawang klase ng tunog:
//
//   1) MUSIC/AMBIENT (background music, ulan) - isang instance lang,
//      LOOP, "play/pause" lang ang ginagalaw (hindi cloneNode).
//   2) SOUND EFFECTS (axe, pickaxe, rake, damo, pagdampot) - maikli,
//      paulit-ulit na tinatawag - gumagamit ng cloneNode() KADA TAWAG,
//      para puwedeng MAG-OVERLAP ang tunog (hal. mabilis na successive
//      na paghampas) sa halip na maputol ang naunang tugtog.
//
// AUTOPLAY: hinaharangan ng browser ang tunog na may kasamang boses
// hangga't walang user interaction - kaya HINDI agad sinisimulan ang
// background music sa page load, inaantay muna ang UNANG pointerdown/
// keydown (tingnan ang unlockAudio sa ibaba).

const AUDIO_PATHS = {
  music: "./assets/audio/background-music.mp3",
  christmasMusic: "./assets/audio/its-beginning.mp3",
  rain: "./assets/audio/raining.mp3",
  cutWood: "./assets/audio/cut-wood.mp3",
  pickaxe: "./assets/audio/pickaxe.mp3",
  rake: "./assets/audio/rake.mp3",
  grass: "./assets/audio/grass.mp3",
  put: "./assets/audio/put.mp3",
  thunder: "./assets/audio/thunder.mp3",
  cricket: "./assets/audio/crickets.mp3",
  bird: "./assets/audio/bird.mp3",
};

const AUDIO_VOLUME = {
  music: 0.32,
  christmasMusic: 1,
  rain: 1,
  cutWood: 0.55,
  pickaxe: 0.55,
  rake: 0.5,
  grass: 0.4,
  put: 0.5,
  thunder: 0.6,
};

// =========================
// BACKGROUND MUSIC
// =========================
//
// AYOS: dating IISA lang na track (musicAudio) na tuloy-tuloy na
// naka-loop simula sa unang user gesture, kahit anong panahon. Ngayon,
// TATLONG klase ng gawi base sa kasalukuyang panahon (tingnan ang
// updateBackgroundMusic sa ibaba, tinatawag kada frame):
//   - MAARAW (sunny)  -> "music" (background-music.mp3)
//   - UMUULAN (rain)  -> WALANG music (payak na ulan lang ang
//     maririnig, tingnan ang "rain" ambience sa ibaba) - hiling ito ng
//     user, hindi dapat sumasabay ang music sa ulan.
//   - NIYEBE (snow)   -> "christmasMusic" (its-beginning.mp3)
// Dalawang HIWALAY na Audio element (hindi cloneNode, gaya ng sound
// effects) - parehong naka-loop, "play/pause" lang ang ginagalaw dito,
// para tuloy-tuloy (hindi nagre-restart mula simula) ang bawat isa
// kada balik dito matapos lumipat sa ibang panahon.

const musicAudio = new Audio(AUDIO_PATHS.music);
musicAudio.loop = true;
musicAudio.volume = AUDIO_VOLUME.music;

const christmasMusicAudio = new Audio(AUDIO_PATHS.christmasMusic);
christmasMusicAudio.loop = true;
christmasMusicAudio.volume = AUDIO_VOLUME.christmasMusic;

// null (walang tumutugtog, umuulan) | "sunny" | "snow" - kasalukuyang
// aktibong track, para malaman kung kailan TALAGA dapat lumipat
// (iwasan ang paulit-ulit na pag-.play()/.pause() kada frame).
let currentMusicTrack = undefined; // "undefined" = wala pang na-eebalweyt, iba sa null (raining state)

function updateBackgroundMusic() {
  if (!audioUnlocked) return;

  let raining = false;
  let snowing = false;

  // Naka-try/catch - baka tawagin ito bago pa man talaga handa ang
  // mundo/kalendaryo (hal. napindot agad ang isang key bago pa ma-
  // load ang mapa) - sa ganoong sandali, ligtas na "hindi umuulan/
  // hindi niyebe" (sunny) na lang ang ipagpalagay.
  try {
    raining = typeof isRaining === "function" && isRaining();
    snowing = typeof isSnowWeather === "function" && isSnowWeather();
  } catch (error) {
    raining = false;
    snowing = false;
  }

  const desired = raining ? null : snowing ? "snow" : "sunny";

  if (desired === currentMusicTrack) return; // walang pagbabago

  currentMusicTrack = desired;

  musicAudio.pause();
  christmasMusicAudio.pause();

  if (desired === "sunny") {
    musicAudio.play().catch(() => {});
  } else if (desired === "snow") {
    christmasMusicAudio.play().catch(() => {});
  }
  // desired === null (umuulan) - pareho lang na naka-pause, walang
  // music - ang "rain" ambience (sa ibaba) na lang ang maririnig.
}

// =========================
// AMBIENT RAIN LOOP - sumasabay/tumitigil base sa panahon (isRaining()
// sa rain.js) - tingnan ang updateAmbientAudio sa ibaba.
// =========================

const rainAudio = new Audio(AUDIO_PATHS.rain);
rainAudio.loop = true;
rainAudio.volume = AUDIO_VOLUME.rain;

let rainAudioPlaying = false;

// =========================
// PAG-UNLOCK (unang user gesture)
// =========================

let audioUnlocked = false;

// AYOS: SANHI NG BUG na "hindi tumutunog ang christmas-music pag
// nag-snow" - sa ilang browser (lalo na sa mobile/iOS Safari),
// PER-ELEMENT ang autoplay-unlock requirement: kung ANG PARTIKULAR na
// Audio element mismo ay HINDI pa TALAGANG na-.play() habang nasa loob
// ng user gesture, permanenteng hinaharangan (TAHIMIK - naka-.catch()
// lang, walang error na makikita) ang PAG-PLAY nito sa HINAHARAP,
// KAHIT naka-unlock na ang IBANG audio sa parehong pahina. Dating
// "musicAudio" lang ang na-a-unlock dito (kung "sunny" nung unang
// click) - kaya kapag lumipat sa snow MAMAYA (sa loob ng
// updateAmbientAudio, HINDI na user gesture), silently nabibigo ang
// unang .play() ng christmasMusicAudio.
//
// AYOS: "pina-priming" (play() nang naka-mute, agad pino-pause) ang
// LAHAT ng persistent na music/ambient Audio element (musicAudio,
// christmasMusicAudio, rainAudio) DITO, habang TALAGANG nasa loob pa
// rin ng user gesture - kaya naka-unlock na silang lahat, kahit alin
// pa ang aktwal na kasalukuyang panahon.
// AYOS (bug: "hindi tumutunog ang ulan" kung UMUULAN NA SA MISMONG
// SANDALI ng unang user gesture): dating basta na lang PINAPAUSE/
// RE-RESET (currentTime = 0) ng priming ang audio pagkatapos ng muted
// play() nito - kung sakaling nag-umpisa nang TALAGANG tumugtog (hindi
// naka-mute) ang PAREHONG audio element bago pa man matapos ang
// muted play() promise ng priming (hal. tinawag na ng
// updateAmbientAudio ang TUNAY na .play() nito dahil UMUULAN na
// mismo nang sandaling iyon, kaunting frame lang matapos i-simulan
// ng primeAudioElement ang SARILING muted play() nito) - kapag
// natapos na ang priming promise, basta na lang PINA-PAUSE nito ang
// audio (kahit TALAGANG tumutugtog na ito ngayon nang totoo) - lumalabas
// nang "tahimik" (walang error) kaya parang "hindi tumutunog" kahit
// TALAGANG sinimulan na ito.
//
// "isActiveNow" - opsyonal na function na sinusuri KUNG TALAGANG dapat
// nang tumutunog ang audio na ito SA SANDALING iyon (hal.
// "() => rainAudioPlaying") - kung totoo ito paglabas ng promise,
// hindi na dapat i-pause/i-reset, un-mute na lang (huwag guluhin ang
// TUNAY na tumutugtog na audio).
function primeAudioElement(audio, isActiveNow) {
  const playPromise = audio.play();

  audio.muted = true;

  const finishPriming = () => {
    if (typeof isActiveNow === "function" && isActiveNow()) {
      // TALAGANG tumutugtog na ito ngayon nang totoo (hindi na priming
      // lang) - iwasan nang guluhin, un-mute na lang.
      audio.muted = false;
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
  };

  if (playPromise && typeof playPromise.then === "function") {
    playPromise.then(finishPriming).catch(() => {
      audio.muted = false;
    });
  } else {
    finishPriming();
  }
}

function unlockAudio() {
  if (audioUnlocked) return;

  audioUnlocked = true;

  // MAUNA ito, para malaman kung alin sa musicAudio/christmasMusicAudio
  // ang TALAGANG dapat tumugtog NGAYON (base sa kasalukuyang panahon).
  updateBackgroundMusic();

  // Saka lang "pi-prime" (itaas) ang mga IBANG track na HINDI
  // kasalukuyang tumutugtog - para hindi ito ma-interrupt ng priming
  // (kung sabay itong papatugtugin, may tsansang ma-pause agad ng
  // priming ang TALAGANG dapat na tumutugtog). Dagdag pang "isActiveNow"
  // guard (tingnan ang primeAudioElement sa itaas) - depensa laban sa
  // parehong uri ng race, kung sakaling MAGBAGO ang panahon sa gitna
  // mismo ng priming.
  if (currentMusicTrack !== "sunny") {
    primeAudioElement(musicAudio, () => currentMusicTrack === "sunny");
  }
  if (currentMusicTrack !== "snow") {
    primeAudioElement(christmasMusicAudio, () => currentMusicTrack === "snow");
  }

  // Rain - hiwalay na flag/logic ito (updateAmbientAudio, hindi pa ito
  // ginagalaw ng updateBackgroundMusic sa itaas). AYOS (bug: "hindi
  // tumutunog ang ulan"): kung UMUULAN NA MISMO sa sandaling ito
  // (TALAGANG dapat nang tumutunog ang rain ambience), huwag na itong
  // "i-prime" (muted play->pause) - direktang PATUGTUGIN na ito nang
  // totoo (kagaya mismo ng ginagawa ng updateAmbientAudio), para hindi
  // na tumakbo ang priming logic sa audio na ito kahit kailan (walang
  // pagkakataong ma-race/ma-pause nang tahimik ang tunay na tugtog).
  // Kung HINDI umuulan, ligtas pa rin ang normal na muted-priming.
  let rainingAtUnlock = false;

  try {
    rainingAtUnlock = typeof isRaining === "function" && isRaining();
  } catch (error) {
    rainingAtUnlock = false;
  }

  if (rainingAtUnlock) {
    rainAudioPlaying = true;
    rainAudio.play().catch(() => {});
  } else {
    primeAudioElement(rainAudio, () => rainAudioPlaying);
  }
}

["pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, unlockAudio, { once: true });
});

// =========================
// SOUND EFFECTS
// =========================
//
// Isang "template" na Audio element lang kada tunog (naka-preload) -
// kada TALAGANG pagpapatugtog, kinokopya ito (cloneNode) para hindi
// magkabanggaan/maputol ang sunod-sunod na tunog.

const sfxTemplates = {};

function getSfxTemplate(key) {
  if (!sfxTemplates[key]) {
    const audio = new Audio(AUDIO_PATHS[key]);

    audio.volume = AUDIO_VOLUME[key] !== undefined ? AUDIO_VOLUME[key] : 0.5;
    sfxTemplates[key] = audio;
  }

  return sfxTemplates[key];
}

function playSfx(key) {
  if (!audioUnlocked) return; // sundin din ang parehong autoplay rule

  const template = getSfxTemplate(key);
  const instance = template.cloneNode();

  instance.volume = template.volume;
  instance.play().catch(() => {});
}

// Mga pangalan ng function na direktang tinatawag ng ibang file
// (player.js para sa axe/pickaxe/rake/put, grass.js para sa damo) -
// hiwalay na function kada isa (sa halip na palaging playSfx("...")
// sa caller) para malinaw kung anong tunog ang nire-refer, at para
// magkaroon ng iisang lugar kung sakaling kailangan pa ng dagdag na
// logic (hal. random pitch variation) balang araw.
function playCutWoodSfx() {
  playSfx("cutWood");
}

function playPickaxeSfx() {
  playSfx("pickaxe");
}

function playRakeSfx() {
  playSfx("rake");
}

function playGrassSfx() {
  playSfx("grass");
}

function playPutSfx() {
  playSfx("put");
}

// Kulog - isang beses lang kada TALAGANG pagkidlat (tingnan ang
// getThunderFlashAlpha sa rain.js - doon tinatawag ito, sa MISMONG
// simula ng flash, hindi paulit-ulit habang kumukupas pa ang flash).
function playThunderSfx() {
  playSfx("thunder");
}

// =========================
// PER-FRAME UPDATE (tinatawag mula sa update.js)
// =========================
//
// Simpleng flag check lang - hindi mabigat kahit kada frame tawagin.
function updateAmbientAudio() {
  if (!audioUnlocked) return;

  updateBackgroundMusic();

  const raining = typeof isRaining === "function" && isRaining();

  if (raining && !rainAudioPlaying) {
    rainAudioPlaying = true;
    rainAudio.play().catch(() => {});
  } else if (!raining && rainAudioPlaying) {
    rainAudioPlaying = false;
    rainAudio.pause();
    rainAudio.currentTime = 0;
  }
}
