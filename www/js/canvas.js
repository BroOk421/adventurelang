// =========================
// CANVAS
// =========================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

// AYOS (hiling ng user: "dapat i full screen mo na rin sa mobile kasi
// may spacing pa siya") - "window.innerWidth/innerHeight" (dating
// gamit lang) ay HINDI laging TALAGANG tumutugma sa TALAGANG
// nakikitang lugar sa mobile browser (lalo na habang lumalabas/
// nawawala ang address bar) - ang "window.visualViewport" (mas bagong
// API, sinusuportahan na ng halos lahat ng modernong mobile browser)
// ang TALAGANG sumusunod dito nang real-time. Fallback pa rin sa
// innerWidth/innerHeight kung wala nito (lumang browser).
function getViewportSize() {
  if (window.visualViewport) {
    return {
      width: Math.round(window.visualViewport.width),
      height: Math.round(window.visualViewport.height),
    };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function resizeCanvas() {
  const size = getViewportSize();

  canvas.width = size.width;
  canvas.height = size.height;
}

window.addEventListener("resize", resizeCanvas);

// "orientationchange" - hindi laging sumasabay ang "resize" event kada
// pag-ikot ng device (may mga browser na medyo naaantala/hindi
// nagfa-fire agad) - dagdag na listener para talagang ma-resize agad.
window.addEventListener("orientationchange", resizeCanvas);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeCanvas);
}

resizeCanvas();
