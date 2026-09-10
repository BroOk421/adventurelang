// =========================
// KEYBOARD
// =========================

const keys = {};

// =========================
// BUGFIX (hiling ng user: "may bug pa sa pag input ng name ng house di
// nag fufunction yung wasd")
// =========================
// Ang handler sa ibaba ay naka-attach sa BUONG document, kaya tumatama
// ito KAHIT nasa loob ka ng isang text field - dalawang masamang epekto:
//   1. `event.preventDefault()` sa w/a/s/d - kaya HINDI na talaga
//      naila-type ang mga letrang iyon (ito ang bug na napansin).
//   2. `keys[key] = true` - kaya GUMAGALAW pa rin ang player habang
//      nagta-type ka.
// Ang solusyon: laktawan ang LAHAT ng gameplay na keyboard handler
// kapag ang pinag-ta-type-an ay isang input/textarea/contenteditable.
// GLOBAL ito (input.js ang PINAKAMAUNA sa mga script na may keyboard
// handler, tingnan ang index.html) para magamit din ng ibang file -
// hotbar.js ("b" = bag), tool-radial.js ("v"), dig.js/resources.js
// (alt+numero) - PAREHONG problema sana ang mga iyon.
function isTypingInTextField(event) {
  const el = (event && event.target) || document.activeElement;

  if (!el) return false;
  if (el.isContentEditable) return true;

  const tag = el.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

// Binubura ang LAHAT ng naka-"hawak" na key - tinatawag kapag may
// bumukas na text field, para hindi "ma-stuck" na naka-lakad ang player
// kung hawak niya ang W habang nag-click sa input.
function clearHeldKeys() {
  for (const key of Object.keys(keys)) keys[key] = false;
}

document.addEventListener("keydown", (event) => {
  if (isTypingInTextField(event)) return;

  const key = event.key.toLowerCase();

  keys[key] = true;

  if (
    key === "w" ||
    key === "a" ||
    key === "s" ||
    key === "d" ||
    key.startsWith("arrow")
  ) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});
