// =========================
// MOBILE/TOUCH CONTROLS (virtual joystick + on-screen buttons)
// =========================
//
// Ang buong laro ay dating keyboard+mouse LANG (WASD/arrow para
// gumalaw, Shift para tumakbo, "E" para sa pintuan, "V" hawak para sa
// tool radial, atbp - tingnan ang input.js/update.js/tool-radial.js) -
// walang paraan para talagang MAGLARO sa isang touchscreen (Android/
// iOS) dahil walang keyboard doon. Idinagdag ito para dumagdag ng
// touch-friendly na paraan, HINDI pagpapalit sa keyboard/mouse (parehong
// gumagana pa rin sila sa desktop, walang binago doon).
//
// (a) VIRTUAL JOYSTICK (kaliwang ibaba) - i-drag mula sa gitna ng
//     bilog papunta sa gustong direksyon. Sa halip na gumawa ng bagong
//     hiwalay na "movement system", dito na lang DIREKTA
//     minamanipula ang PAREHONG global na `keys` object (input.js) na
//     binabasa ng update.js (keys["w"/"a"/"s"/"d"]) - kaya AWTOMATIKO
//     itong gumagana nang walang binabagong code sa update.js/player.js,
//     kasama na ang diagonal na galaw (2 direksyon nang sabay,
//     kaparehong-pareho ng epekto ng talagang paghawak ng 2 keyboard
//     key nang sabay). Mas malayo ang hila (malapit sa gilid) = "takbo"
//     (keys["shift"] = true, kaparehong Shift key).
//
// (b) MGA ACTION BUTTON (kanang ibaba):
//     - "V" (Tool Radial) - i-TAP para buksan (showToolRadial(),
//       tool-radial.js) - sa halip na ang "hawak+itutok+bitaw" na
//       gesture (mahirap gawin sa touch nang eksakto), i-TAP na lang
//       ang gustong icon sa loob ng radial - GUMAGANA NA ito dahil
//       may sarili nang "click" listener kada icon (tingnan ang
//       tool-radial.js, ito rin ang ginagamit bilang mouse-click
//       alternatibo). Bagong "tap sa LABAS para mag-cancel" (tingnan
//       sa ibaba) - dahil walang keyup/blur na pwedeng umasa dito sa
//       touch.
//     - "E" (Pumasok/Lumabas sa pintuan) - sinusundan ang PAREHONG
//       "edge-detected" na gawi ng keyboard na "E" (update.js -
//       eKeyDown/eKeyWasDown) - itinatakda lang ang keys["e"] = true
//       sa pagpindot, false sa pagbitaw, GAYA MISMO ng totoong
//       keyboard keydown/keyup - kaya walang duplicate/hiwalay na
//       logic dito, sumusunod na lang sa umiiral nang mekanismo.
//
// Ang PAG-TAP mismo sa MUNDO (canvas) - para mag-ani, dumampot, mag-
// bukas ng tindahan/crafter/kama, atbp - AY GUMAGANA NA (walang
// karagdagang code dito): awtomatikong gumagawa ang browser ng
// "synthetic" mouse events (mousemove → mousedown → mouseup → click)
// mula sa isang simpleng tap, at ang dig.js ay nakikinig lang sa mga
// "mousedown"/"mousemove" event (walang sariling touch listener) -
// kaya awtomatiko itong "gumagana" na sa touch nang hindi na
// kailangang galawin pa.

// Touch device lang ba ito (hindi puro-mouse na desktop)? Kumbinasyon
// ng ilang signal - "ontouchstart" (pinaka-karaniwan), maxTouchPoints
// (mas bago/tamang paraan, sinusuportahan pati ilang touch-laptop),
// at "pointer: coarse" media query (malaki/hindi eksaktong "daliri" ang
// pangunahing input, hindi "mouse"-precise) - kahit isa dito, ituring
// nang "touch".
//
// BAGONG "?mobileui=1" na URL param - PARA LANG SA PAG-PREVIEW ng
// touch UI sa DESKTOP (walang totoong phone, gusto lang makita ang
// itsura/layout gamit ang mouse) - kapag naka-set ito, itinuturing
// nang "touch device" kahit desktop browser talaga. Walang epekto sa
// totoong mobile/touch detection sa itaas (idinagdag lang ito, hindi
// pinalitan) - buksan lang ang laro nang ganito para subukan:
//   http://localhost:8000/?mobileui=1
// Ang joystick/buttons ay gumagana pa rin nang normal gamit ang MOUSE
// (drag/click) dahil Pointer Events na ang ginagamit (input.js) -
// pareho ito sa touch AT mouse, walang dagdag na code na kailangan.
const forceMobileUIPreview =
  new URLSearchParams(window.location.search).get("mobileui") === "1";

const isMobileTouchDevice =
  forceMobileUIPreview ||
  "ontouchstart" in window ||
  (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
  (typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches);

if (isMobileTouchDevice) {
  document.body.classList.add("touch-controls-active");
}

// =========================
// (a) VIRTUAL JOYSTICK
// =========================

(function setupMobileJoystick() {
  const base = document.getElementById("mobile-joystick-base");
  const stick = document.getElementById("mobile-joystick-stick");

  if (!base || !stick) return;

  // Pinakamalayong puwedeng ilayo ang stick mula sa gitna (piksel) -
  // dito rin batay ang "takbo" na threshold sa ibaba.
  const MAX_RADIUS_PX = 38;

  // Napakaliit na galaw (baka aksidenteng dokot lang) - huwag pang
  // ituring na "gustong gumalaw".
  const DEAD_ZONE_PX = 6;

  // Gaano kalapit dapat sa gilid (bahagdan ng MAX_RADIUS_PX) bago
  // ituring na "gustong tumakbo" (kaparehong Shift key).
  const RUN_THRESHOLD_RATIO = 0.72;

  let activePointerId = null;

  function setDirectionKeys(dx, dy, distRatio) {
    // 0° = pakanan, dumadagdag PABABA (screen space, +Y = pababa) -
    // kino-convert papunta sa 8 octant, para puwedeng magsabay ang 2
    // direksyon (diagonal) - PAREHONG "keys" object (input.js) na
    // binabasa mismo ng update.js, kaya walang ibang code na
    // kailangang baguhin doon.
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;

    keys["d"] = deg > -67.5 && deg < 67.5;
    keys["a"] = deg > 112.5 || deg < -112.5;
    keys["s"] = deg > 22.5 && deg < 157.5;
    keys["w"] = deg < -22.5 && deg > -157.5;

    if (!document.getElementById("mobile-btn-run")?.classList.contains("active")) {
      keys["shift"] = distRatio > RUN_THRESHOLD_RATIO;
    }
  }

  function clearDirectionKeys() {
    keys["w"] = false;
    keys["a"] = false;
    keys["s"] = false;
    keys["d"] = false;
    if (!document.getElementById("mobile-btn-run")?.classList.contains("active")) {
      keys["shift"] = false;
    }
  }

  function updateFromClientPoint(clientX, clientY) {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const dist = Math.hypot(rawDx, rawDy);

    const clampedDist = Math.min(dist, MAX_RADIUS_PX);
    const angle = Math.atan2(rawDy, rawDx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    stick.style.transform = "translate(" + stickX + "px, " + stickY + "px)";

    if (dist < DEAD_ZONE_PX) {
      clearDirectionKeys();
      return;
    }

    setDirectionKeys(rawDx, rawDy, clampedDist / MAX_RADIUS_PX);
  }

  function resetJoystick() {
    activePointerId = null;
    stick.style.transform = "translate(0px, 0px)";
    base.classList.remove("active");
    clearDirectionKeys();
  }

  base.addEventListener("pointerdown", (event) => {
    // Isa lang sa isang pagkakataon (unang daliring dumokot) - iwasan
    // ang ibang sabay-sabay na touch (hal. habang naka-drag na sa bag)
    // na "umagaw" sa joystick.
    if (activePointerId !== null) return;

    activePointerId = event.pointerId;
    base.classList.add("active");

    try {
      base.setPointerCapture(event.pointerId);
    } catch (err) {
      // Ok lang - ilang browser/device ay hindi sumusuporta dito,
      // pointermove pa rin ang bahalang sumunod sa daliri.
    }

    updateFromClientPoint(event.clientX, event.clientY);
    event.preventDefault();
  });

  base.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;

    updateFromClientPoint(event.clientX, event.clientY);
    event.preventDefault();
  });

  function handlePointerEnd(event) {
    if (event.pointerId !== activePointerId) return;

    resetJoystick();
  }

  base.addEventListener("pointerup", handlePointerEnd);
  base.addEventListener("pointercancel", handlePointerEnd);

  // Kung mawala ang focus ng window habang naka-drag (hal. lumipat ng
  // app) - i-reset na lang, para hindi maiwang "nakadikit" sa isang
  // direksyon magpakailanman.
  window.addEventListener("blur", resetJoystick);
})();

// =========================
// (b) MGA ACTION BUTTON
// =========================

(function setupMobileActionButtons() {
  const toolsBtn = document.getElementById("mobile-btn-tools");
  const runBtn = document.getElementById("mobile-btn-run");
  const punchBtn = document.getElementById("mobile-btn-punch");

  // NOTE: Wala nang "Enter/Exit" button dito - lahat ng pintuan ay
  // "auto" na ngayon (worlds.js, DOORS - auto:true), kaya awtomatiko
  // na lang itong nagtatrigger sa sandaling madikit ng player,
  // kagaya mismo ng totoong blackhole gate. Wala na ring "Bag"
  // (ginagamit na lang ang bag slot sa hotbar mismo) o "Menu" na
  // floating button (ginagamit na ngayon ang phone BACK button -
  // tingnan ang "(c)" sa ibaba).

  if (toolsBtn) {
    toolsBtn.addEventListener("pointerdown", (event) => {
      event.preventDefault();

      // MAHALAGA: i-stop ang pagbubulusok (bubble) ng event papunta sa
      // document - kung hindi, ang PAREHONG pointerdown na ito ay
      // maaabot din ng "tap outside to cancel" listener sa ibaba
      // (dahil ang Tools button mismo ay NASA LABAS ng #tool-radial
      // panel) - agad na magsasara (hideToolRadial()) sa MISMONG sandali
      // ring binuksan ito, kaya parang "hindi lumalabas" ang radial
      // (nagbubukas at nagsasara sa loob ng iisang tap).
      event.stopPropagation();

      if (typeof showToolRadial === "function") showToolRadial();
    });
  }

  if (runBtn) {
    const setRun = (event) => {
      event.preventDefault();
      keys["shift"] = true;
      runBtn.classList.add("active");
    };
    const clearRun = (event) => {
      event.preventDefault();
      keys["shift"] = false;
      runBtn.classList.remove("active");
    };
    runBtn.addEventListener("pointerdown", setRun);
    runBtn.addEventListener("pointerup", clearRun);
    runBtn.addEventListener("pointercancel", clearRun);
    runBtn.addEventListener("pointerleave", clearRun);
  }

  if (punchBtn) {
    punchBtn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      punchBtn.classList.add("active");
      triggerMobilePunch();
    });

    const releasePunch = () => punchBtn.classList.remove("active");
    punchBtn.addEventListener("pointerup", releasePunch);
    punchBtn.addEventListener("pointercancel", releasePunch);
    punchBtn.addEventListener("pointerleave", releasePunch);
  }
})();

// =========================
// (c) PUNCH BUTTON - i-TAP ang tile na KAHARAP ng player
// =========================
//
// Sa halip na gumawa ng bagong hiwalay na "attack system" (duplicate
// ng logic sa dig.js/resources.js), dito na lang natin GINAGAYA ang
// isang totoong TAP sa mundo - kinukwenta natin ang tile na kaharap
// ng player (base sa player.direction), ico-convert papuntang SCREEN
// coordinates (kabaligtaran ng ginagawa ng getMouseTile, dig.js), at
// nagpapadala ng SYNTHETIC mousemove/mousedown/mouseup/click sa
// canvas doon - kaya AWTOMATIKONG gumagana ang lahat ng existing na
// interaction (puno/bato gamit ang kamao -> startPunchStrike,
// pagdampot, Oldman shop, kama, crafter/stove, atbp.), walang
// duplicate na code, at laging tugma sa kahit anong pagbabago sa
// ibang file balang araw.
function simulateWorldTap(worldX, worldY) {
  if (typeof camera === "undefined" || typeof canvas === "undefined") return;

  const snappedCameraX = Math.round(camera.x * camera.zoom) / camera.zoom;
  const snappedCameraY = Math.round(camera.y * camera.zoom) / camera.zoom;

  const screenX = (worldX - snappedCameraX) * camera.zoom;
  const screenY = (worldY - snappedCameraY) * camera.zoom;

  const rect = canvas.getBoundingClientRect();
  const clientX = rect.left + screenX;
  const clientY = rect.top + screenY;

  const opts = { clientX, clientY, bubbles: true, button: 0 };

  canvas.dispatchEvent(new MouseEvent("mousemove", opts));
  canvas.dispatchEvent(new MouseEvent("mousedown", opts));
  canvas.dispatchEvent(new MouseEvent("mouseup", opts));
  canvas.dispatchEvent(new MouseEvent("click", opts));
}

function triggerMobilePunch() {
  if (typeof player === "undefined" || player.putting) return;
  if (typeof TILE_SIZE === "undefined") return;

  const box =
    typeof getPlayerCollisionBox === "function"
      ? getPlayerCollisionBox()
      : { x: player.x, y: player.y, width: player.width, height: player.height };

  let targetX = box.x + box.width / 2;
  let targetY = box.y + box.height / 2;

  // Isang buong tile pasulong, base sa direction na hinaharap ng
  // player ngayon - kaparehong-pareho sa "isTileInReach" (dig.js,
  // ±1 tile sa paligid ng player), kaya tiyak na aabot ito.
  switch (player.direction) {
    case "up":
      targetY -= TILE_SIZE;
      break;
    case "down":
      targetY += TILE_SIZE;
      break;
    case "left":
      targetX -= TILE_SIZE;
      break;
    case "right":
      targetX += TILE_SIZE;
      break;
  }

  simulateWorldTap(targetX, targetY);
}

// =========================
// (d) PHONE BACK BUTTON -> BUKSAN ANG SETTINGS SA GITNA NG SCREEN
// =========================
//
// Walang direktang "onBackPressed" event sa isang plain webpage -
// ang standard na paraan para "ma-intercept" ang hardware/browser
// BACK button ay ang popstate trick: laging may isang "guard" na
// history entry na pinush natin, kaya kapag "bumalik" ang browser
// dahil sa BACK, doon muna tayo tumatapat (popstate event) sa halip
// na agad lumabas sa page - dun na natin binubuksan/isinasara ang
// Settings sa GITNA ng screen, tapos nagpu-push tayo ng bagong guard
// agad para laging maka-intercept ulit sa SUSUNOD na BACK press.
// Touch device lang ito (isMobileTouchDevice, itaas) - hindi dapat
// nakikialam sa normal na back-navigation ng desktop browser.
if (isMobileTouchDevice) {
  (function setupBackButtonSettings() {
    function pushGuardState() {
      try {
        history.pushState({ mobileSettingsGuard: true }, "");
      } catch (err) {
        // Ok lang - ilang browser/context (hal. sandboxed iframe) ay
        // hindi pumapayag dito, wala lang epekto ang feature na ito.
      }
    }

    pushGuardState();

    window.addEventListener("popstate", () => {
      if (typeof setSettingsMenuOpen !== "function") return;

      setSettingsMenuOpen(!settingsMenuOpen, true);

      pushGuardState();
    });
  })();
}

// I-CANCEL ang tool radial kapag TUMAPAT (tap/click) sa LABAS ng panel
// habang bukas ito - dating "keyup ng V"/"window blur" LANG ang
// paraan para isara ito nang walang napiling tool (walang keyup sa
// touch) - bagong generic na "tap outside to cancel", gumagana pareho
// sa mouse AT touch (hindi lang mobile-specific, pero PINAKAKAILANGAN
// dito dahil wala nang ibang paraan mag-cancel sa touch).
document.addEventListener("pointerdown", (event) => {
  if (typeof toolRadialVisible === "undefined" || !toolRadialVisible) return;

  const panel = document.getElementById("tool-radial");

  if (panel && !panel.contains(event.target)) {
    if (typeof hideToolRadial === "function") hideToolRadial();
  }
});
