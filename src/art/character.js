import { sprite } from "./draw.js";

// A walking character, 14 x 22 px plus outline = a 16 x 24 frame (GBA overworld proportions).
// Frame order in the sheet: down (idle, stepA, stepB), up (idle, stepA, stepB), right (idle, stepA, stepB).
// "left" is the right-facing frames mirrored by the game.

export const FRAME_W = 16;
export const FRAME_H = 24;

export const PLAYER = {
  hair: "#2f2420", hairHi: "#5c453a", skin: "#f6cfa6", skinSh: "#dba57c",
  shirt: "#ee7a3d", shirtSh: "#c85d28", shirtHi: "#f9a06a",
  pants: "#41609f", pantsSh: "#2f487c", shoes: "#f4f1e8", shoesSh: "#b9b6ab", eye: "#1f2430",
};

export const ELDER = {
  hair: "#d9dbe0", hairHi: "#f5f6f8", skin: "#f1c59b", skinSh: "#d19c74",
  shirt: "#5ea06f", shirtSh: "#3f7d50", shirtHi: "#86c795",
  pants: "#7a6a58", pantsSh: "#594c3e", shoes: "#6b4a34", shoesSh: "#432c1d", eye: "#1f2430",
};

const POSES = {
  idle: { ll: 0, lr: 0, al: 0, ar: 0, lf: 0, lb: 0 },
  a: { ll: 0, lr: 2, al: 1, ar: -1, lf: 2, lb: -2 },
  b: { ll: 2, lr: 0, al: -1, ar: 1, lf: -2, lb: 2 },
};

// Fill a span centred on the sprite (cx = 7): `half` pixels each side of the middle line.
const sym = (g, col, y, half) => g.span(col, y, 7 - half, 6 + half);

function legsFront(g, p, pose) {
  // left leg x4..6, right leg x7..9; "lift" shortens a leg and raises its shoe
  for (const [x0, lift] of [[4, pose.ll], [7, pose.lr]]) {
    const shoeX = x0 === 4 ? 3 : 7;
    g.px(p.pants, x0, 17, 3, 3 - lift);
    g.px(p.pantsSh, x0 + 2, 17, 1, 3 - lift);
    g.px(p.shoes, shoeX, 20 - lift, 4, 1); // shoe top
    g.px(p.shoesSh, shoeX, 21 - lift, 4, 1); // sole
  }
}

function torsoFront(g, p, pose, back) {
  // arms hang at the sides and swing with the pose (positive = lower)
  const armTop = 12;
  g.px(p.shirtSh, 1, armTop + pose.al, 2, 4); g.px(p.shirtSh, 11, armTop + pose.ar, 2, 4);
  g.px(p.skin, 1, armTop + 4 + pose.al, 2, 2); g.px(p.skin, 11, armTop + 4 + pose.ar, 2, 2);
  sym(g, p.shirt, 11, 4);
  for (let y = 12; y <= 16; y++) sym(g, p.shirt, y, 4);
  g.px(p.shirtHi, 4, 12, 2, 1);
  g.px(p.shirtSh, 9, 13, 1, 4); // right-side shade
  sym(g, p.shirtSh, 16, 4); // hem
  if (!back) { g.px(p.skin, 6, 11, 2, 1); g.px(p.shirtSh, 6, 12, 2, 1); } // collar and zip line
  else { g.px(p.shirtSh, 4, 11, 6, 1); }
}

function headFront(g, p, back) {
  sym(g, p.hair, 0, 3);
  sym(g, p.hair, 1, 5);
  for (let y = 2; y <= 8; y++) sym(g, p.hair, y, 6);
  if (back) {
    sym(g, p.hair, 9, 5);
    sym(g, p.hair, 10, 3);
    g.span(p.skinSh, 10, 6, 7);
    g.px(p.hairHi, 3, 1, 3, 1); g.px(p.hairHi, 3, 2, 2, 1);
    g.px(p.hairHi, 4, 5, 1, 2);
    return;
  }
  sym(g, p.skin, 4, 3); // forehead under the fringe
  g.span(p.hair, 4, 4, 5); g.span(p.hair, 4, 8, 9); // fringe tufts
  sym(g, p.skin, 5, 4);
  for (let y = 6; y <= 8; y++) sym(g, p.skin, y, 5);
  sym(g, p.skin, 9, 4);
  sym(g, p.skin, 10, 3);
  g.px(p.skinSh, 3, 9, 1, 1); g.px(p.skinSh, 10, 9, 1, 1);
  g.px(p.eye, 4, 7, 1, 2); g.px(p.eye, 9, 7, 1, 2); // eyes
  g.px("#ffffff", 4, 7, 1, 1); g.px("#ffffff", 9, 7, 1, 1); // catch-lights
  g.px("#c4766a", 6, 9, 2, 1); // mouth
  g.px(p.hairHi, 3, 1, 3, 1); g.px(p.hairHi, 3, 2, 2, 1);
}

function front(p, pose, back = false) {
  return sprite(14, 22, (g) => {
    headFront(g, p, back);
    torsoFront(g, p, pose, back);
    legsFront(g, p, pose);
  }, "#1f2430");
}

function side(p, pose) {
  return sprite(14, 22, (g) => {
    // head, facing right
    const rows = [
      [4, 9], [2, 10], [1, 11], [1, 11], [1, 8], [1, 5], [1, 5], [1, 4], [1, 4],
    ];
    rows.forEach(([a, b], y) => g.span(p.hair, y, a, b));
    g.span(p.skin, 4, 9, 11);
    g.span(p.skin, 5, 6, 11);
    g.span(p.skin, 6, 6, 11);
    g.span(p.skin, 7, 5, 11);
    g.span(p.skin, 8, 5, 11);
    g.span(p.skin, 9, 4, 10); g.span(p.hair, 9, 2, 3);
    g.span(p.skin, 10, 5, 9);
    g.px(p.skin, 12, 8, 1, 1); // nose
    g.px(p.eye, 9, 7, 1, 2); g.px("#ffffff", 9, 7, 1, 1);
    g.px("#c4766a", 9, 10, 2, 1);
    g.px(p.hairHi, 3, 1, 3, 1); g.px(p.hairHi, 2, 2, 2, 1);
    g.px(p.hair, 6, 4, 3, 1); // fringe
    // body
    for (let y = 11; y <= 16; y++) g.span(p.shirt, y, 4, 9);
    g.span(p.shirtHi, 12, 5, 6);
    g.span(p.shirtSh, 16, 4, 9);
    g.px(p.shirtSh, 4, 12, 1, 4);
    g.px(p.skin, 6, 11, 2, 1);
    // near arm swings
    const sw = pose.al;
    g.px(p.shirtSh, 5 + sw, 12, 3, 4);
    g.px(p.skin, 5 + sw, 16, 3, 2);
    // legs: back leg is darker
    const legs = [[4 + pose.lb, p.pantsSh, p.shoesSh], [6 + pose.lf, p.pants, p.shoes]];
    for (const [x, pc, sc] of legs) {
      g.px(pc, x, 17, 3, 4);
      g.px(sc, x, 20, 4, 2);
    }
  }, "#1f2430");
}

// Build a horizontal sheet of 9 frames (16 x 24 each) for a character palette.
export function characterSheet(palette) {
  const frames = [
    ...["idle", "a", "b"].map((k) => front(palette, POSES[k], false)),
    ...["idle", "a", "b"].map((k) => front(palette, POSES[k], true)),
    ...["idle", "a", "b"].map((k) => side(palette, POSES[k])),
  ];
  const sheet = document.createElement("canvas");
  sheet.width = FRAME_W * frames.length;
  sheet.height = FRAME_H;
  const ctx = sheet.getContext("2d");
  frames.forEach((f, i) => ctx.drawImage(f, i * FRAME_W, 0));
  return sheet;
}
