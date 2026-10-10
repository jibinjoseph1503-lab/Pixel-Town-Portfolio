// Town layout, in tile units. The world is 44 x 30 tiles (704 x 480 px); the screen shows 25 x 15 of
// them and the camera follows the player, like the handheld games.
export const COLS = 44;
export const ROWS = 30;

// tx/ty = top-left tile of the footprint, w/h = footprint size in tiles. Each sprite sits on the bottom
// edge of its footprint, centred sideways (taller sprites overhang the top). doors = tile columns on the
// footprint's bottom row that count as the door; the tile directly below the first door is the "front"
// tile the player stands on.
export const BUILDINGS = [
  { id: "work", label: "WORK", sprite: "bld-work", tx: 8, ty: 5, w: 7, h: 4, doors: [11], sign: [8, 9] },
  { id: "projects", label: "PROJECTS", sprite: "bld-projects", tx: 30, ty: 5, w: 7, h: 3, doors: [33], sign: [32, 8] },
  { id: "about", label: "ABOUT", sprite: "bld-about", tx: 7, ty: 21, w: 5, h: 3, doors: [9], sign: [7, 24] },
  { id: "contact", label: "CONTACT", sprite: "bld-contact", tx: 32, ty: 21, w: 5, h: 3, doors: [34], sign: [37, 22] },
];

export const SPAWN = { tx: 22, ty: 17, facing: "down" };

// Fountain is 2x2 tiles; top-left tile.
export const FOUNTAIN = { tx: 21, ty: 14 };

// Rectangles of path / plaza paving: [x, y, w, h]. Corners are rounded when painted.
export const PATHS = [
  [17, 11, 10, 8], // plaza
  [9, 9, 26, 2], // main road along the top
  [33, 8, 2, 2], // spur up to the gym
  [21, 19, 2, 5], // road south from the plaza
  [8, 24, 28, 2], // road along the bottom
];

// Trees: [tx, ty, kind]. A "pine" is a big tree on a 2x2 footprint (tx, ty = its top-left tile); a
// "small" pine stands on a single tile.
export const TREES = (() => {
  const list = [];
  const add = (x, y, kind = "pine") => list.push([x, y, kind]);

  // Border ring, two tiles thick
  for (let x = 0; x < COLS; x += 2) { add(x, 0); add(x, ROWS - 2); }
  for (let y = 2; y < ROWS - 2; y += 2) { add(0, y); add(COLS - 2, y); }

  // Grove north of the plaza, with a clearing in the middle
  for (let x = 14; x <= 28; x += 2) if (x !== 20 && x !== 22) add(x, 3);
  for (let x = 15; x <= 27; x += 2) if (x !== 21 && x !== 23) add(x, 5);
  add(28, 7);

  // West and east groves
  for (const [x, y] of [[2, 12], [4, 14], [2, 16], [5, 17], [3, 19], [5, 11]]) add(x, y);
  for (const [x, y] of [[39, 9], [41, 11], [39, 13], [41, 15], [38, 17], [40, 19], [37, 12]]) add(x, y);

  // Smaller pines scattered between the roads, planted in loose pairs
  for (const [x, y] of [[13, 14], [14, 20], [29, 16], [31, 13], [28, 21], [3, 22], [40, 24], [12, 17]]) {
    add(x, y, "small");
    add(x + 1, y + 1, "small");
  }
  return list;
})();

// Log-post fence: a line above the fountain and a post line down each side (open at the bottom).
export const FENCES = [
  [19, 12], [20, 12], [21, 12], [22, 12], [23, 12], [24, 12],
  [19, 13], [19, 14], [19, 15], [19, 16],
  [24, 13], [24, 14], [24, 15], [24, 16],
];

export const BUSHES = [[8, 11], [12, 12], [31, 11], [28, 12], [6, 23], [37, 19], [13, 23], [30, 23], [25, 20], [15, 8], [16, 14], [27, 17]];
export const ROCKS = [[18, 12], [25, 12], [16, 8], [35, 16]];

// Decoration painted into the ground (never blocks walking).
export const FLOWERS = [
  [15, 7], [17, 6], [26, 7], [28, 9], [12, 13], [14, 12], [29, 11], [31, 15], [12, 18], [15, 17], [28, 18],
  [10, 13], [34, 12], [34, 18], [12, 22], [5, 24], [38, 22], [20, 6], [23, 7], [16, 22], [26, 22], [6, 8], [37, 9],
];
export const STONES = [[19, 20], [18, 21], [17, 22]];

const key = (x, y) => `${x},${y}`;

export function buildMaps() {
  const blocked = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const doorAt = new Map(); // "x,y" -> building
  const block = (x, y) => {
    if (x >= 0 && y >= 0 && x < COLS && y < ROWS) blocked[y][x] = true;
  };

  for (const b of BUILDINGS) {
    for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) block(x, y);
    for (const dx of b.doors) doorAt.set(key(dx, b.ty + b.h - 1), b);
    block(...b.sign);
  }
  for (const [x, y, kind] of TREES) {
    block(x, y);
    if (kind === "pine") { block(x + 1, y); block(x, y + 1); block(x + 1, y + 1); }
  }
  block(FOUNTAIN.tx, FOUNTAIN.ty); block(FOUNTAIN.tx + 1, FOUNTAIN.ty);
  block(FOUNTAIN.tx, FOUNTAIN.ty + 1); block(FOUNTAIN.tx + 1, FOUNTAIN.ty + 1);
  for (const [x, y] of [...FENCES, ...BUSHES, ...ROCKS]) block(x, y);

  return { blocked, doorAt, key };
}

// The tile in front of a building's door, used for standing and for walking back out.
export function frontTile(b) {
  return { tx: b.doors[0], ty: b.ty + b.h };
}
