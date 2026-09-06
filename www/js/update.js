// =========================
// UPDATE
// =========================

// Itinatala ang estado ng "x" key noong NAKARAANG frame - kailangan
// natin ito para malaman kung "kakaclick lang" ba ito (edge), hindi
// yung basta naka-hold. Kaya isang beses lang mato-toggle kada pindot.
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

  // PANSAMANTALA - tingnan ang paliwanag sa hotbar.js (syncDebugCoordsHud).
  if (typeof syncDebugCoordsHud === "function") syncDebugCoordsHud();

  // BAGONG 15-minutong (GAME time) respawn ng puno/bato - isa-isa,
  // kada 15 minuto ng game time, SUSUSURIIN (hindi laging mag-
  // spa-spawn) kung may deficit pa (tingnan ang resources.js). Dapat
  // MAUNA ito sa ensureOakSpots/updatePigs sa ibaba (walang pagkakaiba
  // talaga, pero magkatabi lang para sa linaw - parehong "periodic
  // world upkeep" na tawag).
  if (typeof updateResourceRespawns === "function") updateResourceRespawns();
  if (typeof updateTreeRegrowth === "function") updateTreeRegrowth();
  if (typeof updateGrassRegrowth === "function") updateGrassRegrowth();

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

  // GRASSMAP - mga hand-placed na puno (decor.js, GRASSMAP_TREE_SPOTS)
  // - kaparehong dahilan/gawi ng ensureOakSpots sa itaas (para naka-push
  // na ang collision ng bawat trunk bago i-resolve ang galaw ng player
  // sa frame na ito). No-op ito sa ibang mundo (may sariling guard sa
  // loob base sa world.grassmapTrees).
  if (typeof ensureGrassmapTrees === "function") ensureGrassmapTrees();

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

  // FOOD/HUNGER (BAGONG HILING ng user) - tunay na oras din (hindi
  // apektado ng speedScale), kaparehong dahilan ng updateTorchBurn sa
  // itaas.
  if (typeof updateFoodHunger === "function") updateFoodHunger();

  // FLOATING TEXT (BAGONG HILING ng user) - "+health"/"+item" na
  // lumulutang sa itaas ng ulo (floating-text.js) - tinatanggal dito
  // ang mga naubusan na ng oras.
  if (typeof updateFloatingTexts === "function") updateFloatingTexts();

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
      // (Ang blackhole gate ngayon ay newmap<->town na diretso, hindi
      // na dumadaan sa houseInside - kaya wala nang dahilan para
      // mag-overwrite ng "town" dito.)
      //
      // AYOS: hindi na dapat "=== 'houseInside'" lang ang tinitignan
      // dito - dating iisa lang ang interior na mundo (houseInside),
      // pero ngayon may sarili nang tunay na interior ang grassmap
      // (grassmapHouse, worlds.js) na gumagamit ng PAREHONG "__return__"
      // na sistema. Ang "returnWorld" mismo ang sapat nang senyales -
      // ITO lang ang field na nilalagyan kapag TALAGANG papasok sa
      // isang interior (tingnan ang DOORS, worlds.js), kaya gagana na
      // ito kahit anong bagong interior pa ang idagdag sa hinaharap.
      // AYOS (bug fix): dating IISANG global (houseReturnWorld/
      // houseReturnSpawn) ang na-uupdate dito, kaya kapag hindi
      // TALAGANG na-trigger nang tama ang pagpasok sa isang interior
      // (hal. grassmapHouse), naiiwan ang LUMANG value mula sa IBANG
      // interior (hal. "newmap" mula sa huling pagpasok sa houseInside)
      // - kaya doon nagbabalik ang "Exit", hindi sa tamang mundo.
      // Ngayon, itinatabi ang return info PER INTERIOR (keyed sa
      // autoDoor.to, ang pangalan ng interior world mismo) - tingnan
      // ang setInteriorReturnInfo (worlds.js).
      if (autoDoor.returnWorld) {
        setInteriorReturnInfo(
          autoDoor.to,
          autoDoor.returnWorld,
          getDoorExitSpawn(autoDoor),
        );
      }

      // Kapag ang "to" ng auto na pintuan ay "__return__" (hal. ang
      // "Exit" na pintuan ng grassmapHouse/houseInside), HINDI ito
      // literal na pangalan ng mundo - kunin ang naka-tabing return
      // info NG KASALUKUYANG INTERIOR (currentWorld, hal.
      // "grassmapHouse" mismo), hindi basta autoDoor.to/autoDoor.spawn
      // (na "__return__"/null - walang ganitong mundo).
      if (autoDoor.to === "__return__") {
        const returnInfo =
          getInteriorReturnInfo(currentWorld) ||
          getFallbackInteriorReturnInfo(currentWorld);

        loadWorld(returnInfo.world, returnInfo.spawn);
      } else {
        loadWorld(autoDoor.to, autoDoor.spawn);
      }
    }
  }

  if (eKeyDown && !eKeyWasDown && !worldLoading && !player.putting) {
    const door = getUsableDoor();

    if (door) {
      if (door.to === "__return__") {
        // Ito ang pintuang "Lumabas" ng interior na kinatatayuan mo
        // ngayon (currentWorld, hal. "houseInside" o "grassmapHouse") -
        // dinamiko kung saan ka babalik, base sa NAKA-TABING return
        // info NG MISMONG INTERIOR NA ITO (tingnan ang
        // getInteriorReturnInfo, worlds.js), itinakda noong pumasok ka.
        const returnInfo =
          getInteriorReturnInfo(currentWorld) ||
          getFallbackInteriorReturnInfo(currentWorld);

        loadWorld(returnInfo.world, returnInfo.spawn);
      } else {
        // Kapag PUMASOK papuntang isang interior (houseInside,
        // grassmapHouse, at kung anupaman pang idagdag sa hinaharap)
        // gamit ang pintuang ito, itabi muna kung saan/anong mundo ka
        // dapat ibalik paglabas - ang eksaktong POSISYON (dating
        // "door.returnSpawn", hardcoded) ay kinokompyuta na lang ngayon
        // TALAGA sa harap ng pintuan mismo (getDoorExitSpawn, worlds.js)
        // - tingnan ang paliwanag doon (ayos sa bug na "hindi sa
        // mismong pinto napupunta"). Itinatabi PER INTERIOR (door.to)
        // ang return info - tingnan ang paliwanag sa itaas (autoDoor).
        if (door.returnWorld) {
          setInteriorReturnInfo(
            door.to,
            door.returnWorld,
            getDoorExitSpawn(door),
          );
        }

        loadWorld(door.to, door.spawn);
      }
    } else if (typeof getUsableStructureUnderPlayer === "function") {
      // BAGO (hiling ng user): "E" na lang ang paraan para gamitin ang
      // naka-lagay na Crafter/Stove/Light/Bed (dating left-click, dig.js
      // mousedown - tingnan ang paliwanag sa getUsableStructureUnderPlayer,
      // dig.js) - kaparehong-pareho ng "isang pindot lang" na gawi ng
      // pintuan sa itaas (eKeyDown && !eKeyWasDown).
      const structure = getUsableStructureUnderPlayer();

      if (structure) {
        if (structure.type === "crafter") {
          if (typeof openAdvancedCraftPanel === "function") openAdvancedCraftPanel();
        } else if (structure.type === "stove") {
          if (typeof openStovePanel === "function") openStovePanel();
        } else if (structure.type === "light") {
          if (typeof toggleLight === "function") toggleLight(structure.target);
        } else if (structure.type === "bed") {
          if (typeof trySleepInBed === "function") trySleepInBed(structure.target);
        } else if (structure.type === "oldman") {
          // AYOS (hiling ng user): "yung sa oldman gusto ko di na
          // clickable dapat e na rin gamit" - kaparehong-pareho na
          // ngayon ito ng Crafter/Stove/Light/Bed sa itaas.
          if (typeof openOldManShopPanel === "function") openOldManShopPanel();
        }
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

  if (!player.putting) {
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

    // Hindi na "6" palaging hardcoded dito - magkaiba-iba na ang bilang
    // ng frame kada sprite/direksyon ngayon (idle 7, walk paitaas/
    // pababa 10, walk pakaliwa/pakanan 7, run 6 pa rin) - tingnan
    // getPlayerAnimationFrameCount() sa player.js. Kung "6" pa rin ang
    // gamit dito habang mas marami/kaunti pa ang totoong frame ng
    // kasalukuyang sprite, "pipiglas"/uulit nang maaga o hihila ng mga
    // frame mula sa KASUNOD na direksyon/estado na strip (mali/
    // "kalat" ang lalabas na animation).
    if (player.frame >= getPlayerAnimationFrameCount()) {
      player.frame = 0;
    }
  }
}
