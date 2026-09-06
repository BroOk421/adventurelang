
// AUTO-GENERATED (crop dead-space tool): bawat entry dito ay
// nagsasabi kung gaano karaming porsyento ng ORIGINAL na frame/cell
// ang natira pagkatapos i-crop ang transparent na dead space ng PNG
// files (tingnan ang js/player.js -> getSpriteCropDestRect()). Dahil
// dito, MAAARING i-crop nang husto ang mga PNG (mas maliit ang file)
// PERO EXACTLY KAPAREHONG SUKAT/POSISYON pa rin ang lumalabas sa
// screen gaya ng dati - walang bagong "stretch"/distortion na
// idinaragdag, dahil pinupuno lang ulit ng destination box calculation
// (offset + scale) ang dating "puwang" na inalis sa file.
const SPRITE_CROP = {
  "idle.down": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "idle.up": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "idle.left": { offsetXFrac: 0.421875, offsetYFrac: 0.1875, scaleXFrac: 0.125, scaleYFrac: 0.609375 },
  "idle.right": { offsetXFrac: 0.421875, offsetYFrac: 0.1875, scaleXFrac: 0.125, scaleYFrac: 0.609375 },
  "walk.down": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "walk.up": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "walk.left": { offsetXFrac: 0.40625, offsetYFrac: 0.1875, scaleXFrac: 0.15625, scaleYFrac: 0.609375 },
  "walk.right": { offsetXFrac: 0.40625, offsetYFrac: 0.1875, scaleXFrac: 0.15625, scaleYFrac: 0.625 },
  "axeStrike.down": { offsetXFrac: 0.125, offsetYFrac: 0.203125, scaleXFrac: 0.46875, scaleYFrac: 0.625 },
  "axeStrike.up": { offsetXFrac: 0.390625, offsetYFrac: 0.078125, scaleXFrac: 0.203125, scaleYFrac: 0.71875 },
  "axeStrike.left": { offsetXFrac: 0.15625, offsetYFrac: 0.015625, scaleXFrac: 0.46875, scaleYFrac: 0.78125 },
  "axeStrike.right": { offsetXFrac: 0.34375, offsetYFrac: 0.03125, scaleXFrac: 0.453125, scaleYFrac: 0.765625 },
  "pickaxeStrike.down": { offsetXFrac: 0.203125, offsetYFrac: 0.203125, scaleXFrac: 0.390625, scaleYFrac: 0.625 },
  "pickaxeStrike.up": { offsetXFrac: 0.390625, offsetYFrac: 0.078125, scaleXFrac: 0.203125, scaleYFrac: 0.71875 },
  "pickaxeStrike.left": { offsetXFrac: 0.171875, offsetYFrac: 0.03125, scaleXFrac: 0.453125, scaleYFrac: 0.765625 },
  "pickaxeStrike.right": { offsetXFrac: 0.34375, offsetYFrac: 0.046875, scaleXFrac: 0.484375, scaleYFrac: 0.75 },
  "bagIdle.down": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "bagIdle.up": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "bagIdle.left": { offsetXFrac: 0.421875, offsetYFrac: 0.1875, scaleXFrac: 0.203125, scaleYFrac: 0.609375 },
  "bagIdle.right": { offsetXFrac: 0.34375, offsetYFrac: 0.1875, scaleXFrac: 0.203125, scaleYFrac: 0.609375 },
  "bagWalk.down": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "bagWalk.up": { offsetXFrac: 0.40625, offsetYFrac: 0.203125, scaleXFrac: 0.171875, scaleYFrac: 0.59375 },
  "bagWalk.left": { offsetXFrac: 0.40625, offsetYFrac: 0.1875, scaleXFrac: 0.21875, scaleYFrac: 0.609375 },
  "bagWalk.right": { offsetXFrac: 0.34375, offsetYFrac: 0.1875, scaleXFrac: 0.21875, scaleYFrac: 0.625 },
  "pick.left": { offsetXFrac: 0.0, offsetYFrac: 0.0, scaleXFrac: 1.0, scaleYFrac: 0.985239852398524 },
  "pick.right": { offsetXFrac: 0.0, offsetYFrac: 0.0, scaleXFrac: 1.0, scaleYFrac: 0.988929889298893 },

  // BAGO (hiling ng user): "yung mga png ng torch i crop mo tanggalin
  // yung mga dead space" - kaparehong-pareho ng ginawa sa itaas
  // (idle/walk/bagIdle/bagWalk), TUNAY na na-crop na ngayon ang mismong
  // PNG files ng torch (assets/character/torch/idle/, .../bag/idlebag/)
  // - kinuha ang UNION ng bounding box ng lahat ng 7 frame kada
  // direksyon (para pareho ang crop rectangle sa buong animation,
  // hindi nagkakaiba-iba kada frame), tapos in-apply ang parehong
  // offset/scale-fraction na paraan para EXACTLY kaparehong sukat/
  // posisyon pa rin ang lumalabas sa screen.
  "torchIdle.down": { offsetXFrac: 0.375, offsetYFrac: 0.1875, scaleXFrac: 0.21875, scaleYFrac: 0.625 },
  "torchIdle.up": { offsetXFrac: 0.390625, offsetYFrac: 0.1875, scaleXFrac: 0.234375, scaleYFrac: 0.625 },
  "torchIdle.left": { offsetXFrac: 0.359375, offsetYFrac: 0.171875, scaleXFrac: 0.203125, scaleYFrac: 0.640625 },
  "torchIdle.right": { offsetXFrac: 0.40625, offsetYFrac: 0.171875, scaleXFrac: 0.203125, scaleYFrac: 0.640625 },
  "torchBagIdle.down": { offsetXFrac: 0.375, offsetYFrac: 0.1875, scaleXFrac: 0.21875, scaleYFrac: 0.625 },
  "torchBagIdle.up": { offsetXFrac: 0.390625, offsetYFrac: 0.1875, scaleXFrac: 0.234375, scaleYFrac: 0.625 },
  "torchBagIdle.left": { offsetXFrac: 0.359375, offsetYFrac: 0.171875, scaleXFrac: 0.28125, scaleYFrac: 0.640625 },
  "torchBagIdle.right": { offsetXFrac: 0.328125, offsetYFrac: 0.171875, scaleXFrac: 0.28125, scaleYFrac: 0.640625 },
};
