// =========================
// UPDATE
// =========================

// Itinatala ang estado ng "x" key noong NAKARAANG frame - kailangan
// natin ito para malaman kung "kakaclick lang" ba ito (edge), hindi
// yung basta naka-hold. Kaya isang beses lang mato-toggle kada pindot.
let xKeyWasDown = false;
let eKeyWasDown = false;

// Para sa pag-save ng posisyon. Hindi natin ito ginagawa KADA FRAME -
// mabagal ang localStorage, at sayang naman kung wala namang galaw.
// Nagsu-save lang tayo kapag (1) may ipinagbago ang posisyon at (2)
// lumipas na ang kaunting panahon mula noong huling save.
let lastSavedX = null;
let lastSavedY = null;
let saveCooldown = 0;

function maybeSavePlayerPosition() {
  if (saveCooldown > 0) {
    saveCooldown--;
    return;
  }

  if (player.x === lastSavedX && player.y === lastSavedY) return;

  lastSavedX = player.x;
  lastSavedY = player.y;

  saveCooldown = 30; // humigit-kumulang kada kalahating segundo

  savePlayerPosition();
}

// Ang player.speed/runSpeed (player.js) ay itinuning bilang "piksel
// kada TICK" sa 60fps - kaya ito ang batayang deltaMs kada tick.
const REFERENCE_FRAME_MS = 1000 / 60;

// Kapag nag-lag o nag-background ang tab (nawalan ng focus), puwedeng
// biglang sumobra ang deltaMs pagbalik - hinahadlangan natin dito para
// hindi bigla/"tumalon" nang malayo ang player sa isang tick lang.
const MAX_FRAME_DELTA_MS = 100;

function update(deltaMs) {
  // speedScale = 1 sa eksaktong 60fps - kung mas mabagal (mas malaki
  // ang deltaMs) o mas mabilis (mas maliit) ang frame rate, dito
  // isinasaayos ang bilang ng piksel na gagalawin PARA PAREHONG bilis
  // (piksel kada SEGUNDO) kahit saang mundo o gaano man kabigat i-render.
  const speedScale =
    Math.min(deltaMs || REFERENCE_FRAME_MS, MAX_FRAME_DELTA_MS) /
    REFERENCE_FRAME_MS;

  ensureResourceNodes();

  // BAGONG 15-minutong (GAME time) respawn ng puno/bato - isa-isa,
  // kada 15 minuto ng game time, SUSUSURIIN (hindi laging mag-
  // spa-spawn) kung may deficit pa (tingnan ang resources.js). Dapat
  // MAUNA ito sa ensureOakSpots/updatePigs sa ibaba (walang pagkakaiba
  // talaga, pero magkatabi lang para sa linaw - parehong "periodic
  // world upkeep" na tawag).
  if (typeof updateResourceRespawns === "function") updateResourceRespawns();

  // OLDMAN (decor.js) - MAUNA ito bago ang OAK (sa ibaba), dahil
  // umaasa ang 2 "backdrop" oak (likod niya) sa kung saan siya
  // nakatayo - tingnan ang addBackdropOaksNearOldMan.
  if (typeof ensureOldManSpot === "function") ensureOldManSpot();

  // OLDMAN - random na paglalakad/pagkawala-pagbalik (decor.js) -
  // gamit ang TALAGANG deltaMs (hindi speedScale) para pareho ang
  // bilis ng lakad niya kahit gaano man ka-mabagal/mabilis ang frame
  // rate - kaparehong dahilan ng updateTorchBurn sa itaas.
  if (typeof updateOldManWander === "function") {
    updateOldManWander(deltaMs || REFERENCE_FRAME_MS);
  }

  // OAK (decor.js) - kaparehong dahilan/gawi ng ensureResourceNodes sa
  // itaas (para naka-push na ang collision ng mga hindi pa na-chop na
  // oak bago i-resolve ang galaw ng player sa frame na ito).
  if (typeof ensureOakSpots === "function") ensureOakSpots();

  // MGA BABOY (pig.js) - sariling random na paglalakad/pagkawala-
  // pagbalik/"health" kada pig, kaparehong dahilan sa itaas.
  if (typeof updatePigs === "function") {
    updatePigs(deltaMs || REFERENCE_FRAME_MS);
  }

  // MGA DAMONG TUFT (grass.js) - random na spawn kagaya ng puno/bato
  // (MAUNA dapat ang ensureResourceNodes/ensureOakSpots sa itaas, para
  // naka-push na ang kanilang collision bago i-validate kung saan
  // puwedeng tumubo ang damo, iwasan ang pagpapatong). Chineck din kung
  // TALAGANG nakatapakan ng player ang isang tumpok (para sa pagyuko +
  // particle effect).
  if (typeof ensureGrassTufts === "function") ensureGrassTufts();
  if (typeof updateGrassTuftsTouch === "function") updateGrassTuftsTouch();
  if (typeof updateGrassParticles === "function") updateGrassParticles();

  // AUDIO (audio.js) - background music simula sa unang user gesture
  // (unlockAudio), rain ambience na sumasabay/tumitigil dito lang
  // (base sa isRaining()).
  if (typeof updateAmbientAudio === "function") updateAmbientAudio();


  updateSnow();
  updateRain();
  updateFireflies();
  updateFog();

  // Panahon ng lupa: pagtubo ng damo pagkatila ng niyebe, at pagtabon
  // sa mga hukay na walang tanim habang umuulan. Nasa dig.js.
  updateGroundWeather();

  // Mga item na nakalapag sa lupa - "vacuum"/magnet effect papunta sa
  // player kapag malapit na (tingnan ang GROUND_ITEM_MAGNET_RADIUS sa
  // ground-items.js) - TALAGANG deltaMs (hindi speedScale) para pareho
  // ang bilis ng paglipad nito kahit gaano man ka-mabagal/mabilis ang
  // frame rate, kaparehong dahilan ng updateOldManWander/updatePigs.
  if (typeof updateGroundItems === "function") {
    updateGroundItems(deltaMs || REFERENCE_FRAME_MS);
  }

  updatePlayerPutting();

  if (typeof updateCanvasCursor === "function") updateCanvasCursor();

  // Pagkonsumo ng torch (3 minuto) habang naka-equip - tunay na oras
  // (hindi apektado ng speedScale, para hindi maapektuhan ng zoom/fps
  // ang bilis ng pag-ubos). Ang visual na progress bar ay hiwalay na
  // DOM update (hotbar.js) - mas magaan kaysa buong syncHotbarUI kada
  // frame.
  if (typeof updateTorchBurn === "function") {
    updateTorchBurn(deltaMs || REFERENCE_FRAME_MS);
  }

  if (typeof updateTorchBurnVisual === "function") updateTorchBurnVisual();
  if (typeof updateEatCooldownVisual === "function") updateEatCooldownVisual();

  // STOVE (stove.js) - pagluluto/pag-smelt, may DURATION na ngayon
  // (SMELT_COOK_DURATION_MS kada piraso) - tunay na oras (hindi
  // apektado ng speedScale), kaparehong dahilan ng updateTorchBurn sa
  // itaas.
  if (typeof updateStoveCooking === "function") {
    updateStoveCooking(deltaMs || REFERENCE_FRAME_MS);
  }

  player.moving = false;

  // Shift = tumakbo. Kinukuha lang natin dito kung naka-hold ang
  // "shift" - hindi na kailangan galawin pa ang input.js, dahil
  // automatic naman itong natatala sa `keys` object.
  const isRunning = Boolean(keys["shift"]);
  const currentSpeed = (isRunning ? player.runSpeed : player.speed) * speedScale;

  player.running = isRunning;

  // --- SIT TOGGLE (isang click lang, hindi need i-hold) ---
  const xKeyDown = Boolean(keys["x"]);

  if (xKeyDown && !xKeyWasDown && !player.putting) {
    player.sitting = !player.sitting;
    player.direction = "down"; // laging naka-harap/"s" kapag umupo o tumayo via "x"
  }

  xKeyWasDown = xKeyDown;

  // --- PINTUAN (E) ---
  // Isang pindot lang, hindi hold - kung hindi, paulit-ulit kang
  // papasok-labas hangga't nakapatong ang daliri mo sa "e".
  const eKeyDown = Boolean(keys["e"]);

  updateDoorState();

  // --- AUTO NA PINTUAN (auto: true, worlds.js) ---
  // Hindi na kailangang pindutin ang E - awtomatikong lumilipat ng
  // mundo sa SANDALING makapatong/madaanan ng player ang "area" nito
  // (hal. ang gate patungong "town", decor.js). Ginagamit pa rin ang
  // parehong getUsableDoor() (sumusunod sa arrivedAtDoor/
  // DOOR_REACH_MARGIN, worlds.js) - kaya awtomatiko na ring
  // protektado ito laban sa paulit-ulit na pagpalit ng mundo habang
  // nakatayo pa rin ang player sa loob ng parehong area (parehong
  // "arrivedAtDoor" flag ang bahalang mag-reset nito kapag umalis na
  // siya sa lugar).
  if (!worldLoading && !player.putting) {
    const autoDoor = getUsableDoor();

    if (autoDoor && autoDoor.auto) {
      player.sitting = false;

      // (Ang blackhole gate ngayon ay newmap<->town na diretso, hindi
      // na dumadaan sa houseInside - kaya wala nang dahilan para
      // mag-overwrite ng "town" dito.)
      if (autoDoor.to === "houseInside" && autoDoor.returnWorld) {
        houseReturnWorld = autoDoor.returnWorld;
        houseReturnSpawn = getDoorExitSpawn(autoDoor);
      }

      loadWorld(autoDoor.to, autoDoor.spawn);
    }
  }

  if (eKeyDown && !eKeyWasDown && !worldLoading && !player.putting) {
    const door = getUsableDoor();

    if (door) {
      player.sitting = false;

      if (door.to === "__return__") {
        // Ito ang pintuang "Lumabas" ng houseInside - dinamiko kung
        // saan ka babalik (tingnan ang houseReturnWorld/houseReturnSpawn
        // sa worlds.js, itinakda noong pumasok ka).
        loadWorld(houseReturnWorld, houseReturnSpawn);
      } else {
        // Kapag PUMASOK papuntang houseInside gamit ang pintuang ito,
        // itabi muna kung saan/anong mundo ka dapat ibalik paglabas -
        // ang eksaktong POSISYON (dating "door.returnSpawn", hardcoded)
        // ay kinokompyuta na lang ngayon TALAGA sa harap ng pintuan
        // mismo (getDoorExitSpawn, worlds.js) - tingnan ang paliwanag
        // doon (ayos sa bug na "hindi sa mismong pinto napupunta").
        if (door.to === "houseInside" && door.returnWorld) {
          houseReturnWorld = door.returnWorld;
          houseReturnSpawn = getDoorExitSpawn(door);
        }

        loadWorld(door.to, door.spawn);
      }
    }
  }

  eKeyWasDown = eKeyDown;

  // TOWN <-> SNOWTOWN - awtomatikong nagre-reload sa tamang bersyon ng
  // mapa (town.tmj/snowtown.tmj, map.js) sa SANDALING magbago ang
  // panahon, kahit nakatayo ka pa rin doon - hindi mo na kailangang
  // umalis-pumasok ulit para "ma-refresh". Nasa dulo ito ng mga
  // door-related check sa itaas (kaparehong pattern ng auto-door
  // loadWorld), bago ang guard sa ibaba na humihinto sa galaw habang
  // nagre-reload.
  if (typeof checkWorldSnowSwap === "function") checkWorldSnowSwap();

  // Habang pinapalitan ang mapa, huwag munang paandarin ang player -
  // baka makagalaw siya habang wala pang collision data.
  if (worldLoading || !mapReady) return;

  // --- AUTO-STAND kapag pinindot ang WASD/arrow habang nakaupo ---
  const wantsToMove =
    keys["w"] ||
    keys["arrowup"] ||
    keys["s"] ||
    keys["arrowdown"] ||
    keys["a"] ||
    keys["arrowleft"] ||
    keys["d"] ||
    keys["arrowright"];

  if (player.sitting && wantsToMove) {
    player.sitting = false;
  }

  if (!player.sitting && !player.putting) {
    let nextX = player.x;
    let nextY = player.y;

    if (keys["w"] || keys["arrowup"]) {
      nextY -= currentSpeed;
      player.direction = "up";
      player.moving = true;
    }

    if (keys["s"] || keys["arrowdown"]) {
      nextY += currentSpeed;
      player.direction = "down";
      player.moving = true;
    }

    if (keys["a"] || keys["arrowleft"]) {
      nextX -= currentSpeed;
      player.direction = "left";
      player.moving = true;
    }

    if (keys["d"] || keys["arrowright"]) {
      nextX += currentSpeed;
      player.direction = "right";
      player.moving = true;
    }

    // Collision separately on X/Y.
    if (canMoveTo(nextX, player.y)) {
      player.x = nextX;
    }

    if (canMoveTo(player.x, nextY)) {
      player.y = nextY;
    }

    // Keep player inside map.
    if (mapData) {
      const mapWidth = mapData.width * mapData.tilewidth;
      const mapHeight = mapData.height * mapData.tileheight;

      player.x = Math.max(0, Math.min(player.x, mapWidth - player.width));

      player.y = Math.max(0, Math.min(player.y, mapHeight - player.height));
    }
  }

  // Pagkatapos gumalaw ang player - dun natin malalaman kung
  // nakapaghakbang na siya nang sapat para mag-iwan ng bagong bakas.
  updateFootprints();

  maybeSavePlayerPosition();

  // Animation
  player.frameTimer++;

  // Kapag tumatakbo (Shift/mobile Run), gamitin ang runFrameSpeed
  // (player.js) sa halip ng normal na frameSpeed - mas mabilis ito
  // mag-cycle, para tumutugma sa mas mabilis na runSpeed (hindi na
  // "nagmamadali"/hindi tugmang itsura sa pagitan ng galaw ng binti
  // at bilis ng paglipat sa screen).
  const activeFrameSpeed = player.running
    ? player.runFrameSpeed
    : player.frameSpeed;

  if (player.frameTimer >= activeFrameSpeed) {
    player.frame++;
    player.frameTimer = 0;

    if (player.frame >= PLAYER_ANIM_FRAME_COUNT) {
      player.frame = 0;
    }
  }
}
