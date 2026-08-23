// =========================
// CAMERA
// =========================

// Hangganan ng zoom - hindi puwedeng lumagpas dito sa magkabilang
// dulo. Buong numero lang ang bawat baitang (hindi fraction) para
// manatiling malinaw/crisp ang pixel art kahit anong zoom.
const CAMERA_MIN_ZOOM = 3;
const CAMERA_MAX_ZOOM = 8;

const camera = {
  x: 0,
  y: 0,

  zoom: 3,

  follow() {
    const viewWidth = canvas.width / this.zoom;
    const viewHeight = canvas.height / this.zoom;

    let targetX = player.x + player.width / 2 - viewWidth / 2;
    let targetY = player.y + player.height / 2 - viewHeight / 2;

    // I-clamp ang camera sa loob ng hangganan ng mapa, para kapag
    // narating na ng player ang gilid (itaas, ibaba, kaliwa, kanan),
    // titigil na lang ang camera doon sa dulo - "dead end" - sa halip
    // na ipakita pa ang blangkong/black na espasyo sa labas ng mapa.
    if (mapReady && mapData) {
      const mapWidth = mapData.width * mapData.tilewidth;
      const mapHeight = mapData.height * mapData.tileheight;

      if (mapWidth <= viewWidth) {
        // Mas maliit ang mapa kesa sa screen - i-center na lang.
        targetX = (mapWidth - viewWidth) / 2;
      } else {
        targetX = Math.max(0, Math.min(targetX, mapWidth - viewWidth));
      }

      if (mapHeight <= viewHeight) {
        targetY = (mapHeight - viewHeight) / 2;
      } else {
        targetY = Math.max(0, Math.min(targetY, mapHeight - viewHeight));
      }
    }

    this.x = targetX;
    this.y = targetY;
  },
};

// =========================
// ZOOM (mouse wheel)
// =========================
//
// Nakasentro pa rin sa player ang camera pagkatapos mag-zoom - hindi na
// kailangang gumawa ng dagdag na logic para diyan, dahil laging
// kinukwenta ni camera.follow() ang posisyon base sa viewWidth/Height
// (na kinukwenta naman mula sa zoom) kada frame.
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1; // pababa = zoom out, pataas = zoom in

    camera.zoom = Math.max(
      CAMERA_MIN_ZOOM,
      Math.min(CAMERA_MAX_ZOOM, camera.zoom + direction),
    );
  },
  { passive: false },
);
