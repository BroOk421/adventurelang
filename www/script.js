const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

// =========================
// CANVAS
// =========================

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =========================
// TILED MAP
// =========================

const MAP_URL = "./assets/map/actualMap.tmj";

let mapData = null;
let mapReady = false;

const mapImages = {
  ground: new Image(),
  trees: new Image(),
};

mapImages.ground.src = "./assets/map/ground-assets.png";
mapImages.trees.src = "./assets/map/Tree.png";

// actualMap.tmj says:
// firstgid 1   = ground-assets
// firstgid 136 = Tree
const TILE_SIZE = 16;

const tilesets = {
  ground: {
    firstgid: 1,
    image: mapImages.ground,
    columns: Math.floor(250 / TILE_SIZE),
  },
  trees: {
    firstgid: 136,
    image: mapImages.trees,
    columns: Math.floor(350 / TILE_SIZE),
  },
};

// =========================
// SPRITES
// =========================

const sprites = {
  idle: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },

  walk: {
    down: new Image(),
    up: new Image(),
    left: new Image(),
    right: new Image(),
  },
};

sprites.idle.down.src = "./assets/player/idleFront.png";
sprites.idle.up.src = "./assets/player/idleBack.png";
sprites.idle.left.src = "./assets/player/idleLeft.png";
sprites.idle.right.src = "./assets/player/idleright.png";

sprites.walk.down.src = "./assets/player/walkFront.png";
sprites.walk.up.src = "./assets/player/walkBack.png";
sprites.walk.left.src = "./assets/player/walkLeft.png";
sprites.walk.right.src = "./assets/player/walkRight.png";

// =========================
// PLAYER
// =========================

const player = {
  x: 368,
  y: 268,

  width: 24,
  height: 24,

  speed: 2,

  direction: "down",

  frame: 0,
  frameTimer: 0,
  frameSpeed: 8,

  moving: false,
};

// =========================
// CAMERA
// =========================

const camera = {
  x: 0,
  y: 0,

  zoom: 3,

  follow() {
    this.x = player.x + player.width / 2 - canvas.width / 2 / this.zoom;
    this.y = player.y + player.height / 2 - canvas.height / 2 / this.zoom;
  },
};

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

// =========================
// COLLISIONS
// =========================

let collisions = [];

function getPlayerCollisionBox(x = player.x, y = player.y) {
  return {
    x: x + 4,
    y: y + 12,
    width: 16,
    height: 10,
  };
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function canMoveTo(x, y) {
  const playerBox = getPlayerCollisionBox(x, y);

  return !collisions.some((collision) => isColliding(playerBox, collision));
}

// =========================
// UPDATE
// =========================

function update() {
  player.moving = false;

  let nextX = player.x;
  let nextY = player.y;

  if (keys["w"] || keys["arrowup"] || keys["W"]) {
    nextY -= player.speed;
    player.direction = "up";
    player.moving = true;
  }

  if (keys["s"] || keys["arrowdown"] || keys["S"]) {
    nextY += player.speed;
    player.direction = "down";
    player.moving = true;
  }

  if (keys["a"] || keys["arrowleft"] || keys["A"]) {
    nextX -= player.speed;
    player.direction = "left";
    player.moving = true;
  }

  if (keys["d"] || keys["arrowright"] || keys["D"]) {
    nextX += player.speed;
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

  // Animation
  player.frameTimer++;

  if (player.frameTimer >= player.frameSpeed) {
    player.frame++;
    player.frameTimer = 0;

    if (player.frame >= 6) {
      player.frame = 0;
    }
  }
}

// =========================
// TILED TILE RENDERING
// =========================

function getTilesetForGid(gid) {
  if (gid >= tilesets.trees.firstgid) {
    return tilesets.trees;
  }

  if (gid >= tilesets.ground.firstgid) {
    return tilesets.ground;
  }

  return null;
}

function drawTile(gid, x, y) {
  if (!gid) return;

  // Tiled can store flip flags in the highest 3 bits.
  const FLIP_H = 0x80000000;
  const FLIP_V = 0x40000000;
  const FLIP_D = 0x20000000;

  const flipH = (gid & FLIP_H) !== 0;
  const flipV = (gid & FLIP_V) !== 0;
  const flipD = (gid & FLIP_D) !== 0;

  gid = gid & ~(FLIP_H | FLIP_V | FLIP_D);

  const tileset = getTilesetForGid(gid);
  if (!tileset || !tileset.image.complete) return;

  const localId = gid - tileset.firstgid;

  const sourceX = (localId % tileset.columns) * TILE_SIZE;

  const sourceY = Math.floor(localId / tileset.columns) * TILE_SIZE;

  ctx.save();

  ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);

  if (flipD) {
    ctx.rotate(Math.PI / 2);
    ctx.scale(-1, 1);
  }

  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);

  ctx.drawImage(
    tileset.image,
    sourceX,
    sourceY,
    TILE_SIZE,
    TILE_SIZE,
    -TILE_SIZE / 2,
    -TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE,
  );

  ctx.restore();
}

function drawTileLayer(layer) {
  if (!layer.visible || !layer.data) return;

  for (let row = 0; row < layer.height; row++) {
    for (let col = 0; col < layer.width; col++) {
      const gid = layer.data[row * layer.width + col];

      if (!gid) continue;

      drawTile(gid, col * mapData.tilewidth, row * mapData.tileheight);
    }
  }
}

// Cache ng mga "tree instance" - ibig sabihin, buong puno (leaves + trunk +
// roots) na pinagsama-sama bilang IISANG bagay, hindi na hiwa-hiwalay na
// tile. Ito yung ayaw natin ulitin kada frame kasi static naman ang mapa.
let treeInstances = null;

// Ginagrupo dito ang magkakadikit na tree tiles (flood fill) para maging
// iisang "puno" sila, tapos kinukuha yung pinakababang gilid (base/roots -
// kung saan siya dumidikit sa lupa) bilang reference point para sa
// depth-sorting laban sa player.
function buildTreeInstances(treeLayer) {
  const width = treeLayer.width;
  const height = treeLayer.height;
  const visited = new Uint8Array(width * height);

  const neighborOffsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  const instances = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;

      if (visited[idx]) continue;
      visited[idx] = 1;

      if (!treeLayer.data[idx]) continue;

      // May bagong puno tayong nakita - i-flood-fill lahat ng
      // magkakadikit na tiles nito.
      const tiles = [];
      let baseY = -Infinity;

      const stack = [[row, col]];

      while (stack.length) {
        const [r, c] = stack.pop();
        const i = r * width + c;
        const gid = treeLayer.data[i];

        const x = c * mapData.tilewidth;
        const y = r * mapData.tileheight;

        tiles.push({ gid, x, y });

        const bottom = y + mapData.tileheight;
        if (bottom > baseY) baseY = bottom;

        for (const [dr, dc] of neighborOffsets) {
          const nr = r + dr;
          const nc = c + dc;

          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;

          const ni = nr * width + nc;

          if (visited[ni]) continue;
          visited[ni] = 1;

          if (!treeLayer.data[ni]) continue;

          stack.push([nr, nc]);
        }
      }

      instances.push({ tiles, baseY });
    }
  }

  return instances;
}

function drawMap() {
  if (!mapReady) return;

  const treeLayer = mapData.layers.find(
    (layer) => layer.type === "tilelayer" && layer.name === "Trees",
  );

  // =================================
  // DRAW MAP EXCEPT TREES
  // =================================

  for (const layer of mapData.layers) {
    if (layer.type === "tilelayer" && layer.name !== "Trees") {
      drawTileLayer(layer);
    }
  }

  if (!treeLayer) {
    drawPlayer();
    return;
  }

  if (!treeInstances) {
    treeInstances = buildTreeInstances(treeLayer);
  }

  // =================================
  // Y-SORT (PAINTER'S ALGORITHM)
  // =================================
  //
  // Ang bawat puno ay iguguhit bilang IISANG buong bagay (hindi na
  // hiwa-hiwalay ang leaves at roots). Ikukumpara natin ang base
  // (roots - kung saan dumidikit sa lupa) ng buong puno sa paanan
  // (feet) ng player:
  //
  //  - Kung mas mababa pa sa screen ang base ng puno kesa sa paanan
  //    ng player (ibig sabihin hindi pa "naabot/nalagpasan" ng player
  //    ang puno), iguguhit ang BUONG puno PAGKATAPOS ng player - kaya
  //    natatakpan/naoverlap niya nang buo ang player, leaves man o
  //    roots.
  //  - Kung naabot/nalagpasan na ng player ang base ng puno, iguguhit
  //    ang buong puno BAGO ang player - kaya siya ang makikita sa
  //    harap.

  const playerBox = getPlayerCollisionBox();
  const playerSortY = playerBox.y + playerBox.height;

  const drawables = [];

  for (const tree of treeInstances) {
    drawables.push({
      sortY: tree.baseY,
      draw: () => {
        for (const tile of tree.tiles) {
          drawTile(tile.gid, tile.x, tile.y);
        }
      },
    });
  }

  drawables.push({ sortY: playerSortY, draw: drawPlayer });

  drawables.sort((a, b) => a.sortY - b.sortY);

  for (const item of drawables) {
    item.draw();
  }
}

// =========================
// PLAYER DRAW
// =========================

function drawPlayer() {
  const sprite = player.moving
    ? sprites.walk[player.direction]
    : sprites.idle[player.direction];

  if (!sprite.complete || !sprite.width) return;

  const frameWidth = sprite.width / 6;
  const frameHeight = sprite.height;

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    sprite,
    player.frame * frameWidth,
    0,
    frameWidth,
    frameHeight,
    player.x,
    player.y,
    player.width,
    player.height,
  );
}

// =========================
// DRAW
// =========================

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  camera.follow();

  ctx.save();

  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  ctx.imageSmoothingEnabled = false;

  drawMap();

  ctx.restore();
}

// =========================
// LOAD MAP
// =========================

fetch(MAP_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Could not load actualMap.tmj");
    }

    return response.json();
  })
  .then((map) => {
    mapData = map;

    const collisionLayer = map.layers.find(
      (layer) =>
        layer.type === "objectgroup" &&
        layer.name.toLowerCase() === "collisions",
    );

    if (collisionLayer) {
      collisions = collisionLayer.objects.filter(
        (object) => object.width > 0 && object.height > 0,
      );
    }

    console.log("Map loaded:", map.width, "x", map.height);
    console.log("Collision objects:", collisions.length);

    mapReady = true;
  })
  .catch((error) => {
    console.error(error);
  });

// =========================
// GAME LOOP
// =========================

function gameLoop() {
  update();
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
