// =========================
// KEYBOARD
// =========================

const keys = {};

document.addEventListener("keydown", (event) => {
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
