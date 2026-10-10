import { TILE, PALETTE } from "../config/assets.js";
import { COLS, ROWS, PATHS, FLOWERS, STONES } from "../config/town.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

// Pixel widths cut from (or added to) a corner, row by row, to round it.
const ROUND = [4, 2, 1, 1];

// Paints the whole ground (grass, paths with rounded corners, flowers, stones) into one texture.
export function paintGround(scene) {
  const W = COLS * TILE, H = ROWS * TILE;
  const tex = scene.textures.createCanvas("ground", W, H);
  const ctx = tex.getContext();
  const rect = (color, x, y, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  rect(hex(PALETTE.grass), 0, 0, W, H);

  // Tufts on a regular lattice, like handheld RPG grass (some tiles left bare)
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const n = (tx * 7 + ty * 13) % 5;
      if (n === 0) continue;
      const x = tx * TILE + 2 + n * 2 + (ty % 2) * 3, y = ty * TILE + 3 + ((tx + n) % 3) * 3;
      const c = hex(PALETTE.grassTuft);
      rect(c, x, y + 1, 1, 2); rect(c, x + 1, y, 1, 3); rect(c, x + 2, y + 1, 1, 2);
    }
  }

  // ---- Paths: build a pixel mask, round the corners, then outline it ----
  const tilePath = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (const [x, y, w, h] of PATHS) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) tilePath[j][i] = true;
  const isP = (x, y) => y >= 0 && x >= 0 && y < ROWS && x < COLS && tilePath[y][x];

  const mask = new Uint8Array(W * H);
  const set = (px, py, v) => { if (px >= 0 && py >= 0 && px < W && py < H) mask[py * W + px] = v; };
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    if (!tilePath[ty][tx]) continue;
    for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) set(tx * TILE + i, ty * TILE + j, 1);
  }
  // Sets a rounded staircase of pixels in one corner of a tile. (sx, sy) = -1/+1 picks left/right, top/bottom.
  const round = (tx, ty, sx, sy, v) => {
    const ox = sx < 0 ? tx * TILE : tx * TILE + TILE - 1;
    const oy = sy < 0 ? ty * TILE : ty * TILE + TILE - 1;
    for (let j = 0; j < ROUND.length; j++) for (let i = 0; i < ROUND[j]; i++) set(ox + (sx < 0 ? i : -i), oy + (sy < 0 ? j : -j), v);
  };
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const h = isP(tx + sx, ty), v = isP(tx, ty + sy);
      if (tilePath[ty][tx]) { if (!h && !v) round(tx, ty, sx, sy, 0); } // convex: trim
      else if (h && v) round(tx, ty, sx, sy, 1); // concave: fill the inner corner
    }
  }

  const at = (px, py) => px >= 0 && py >= 0 && px < W && py < H && mask[py * W + px] === 1;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (!at(px, py)) continue;
    const edge = !at(px - 1, py) || !at(px + 1, py) || !at(px, py - 1) || !at(px, py + 1);
    rect(hex(edge ? PALETTE.pathEdge : PALETTE.path), px, py);
  }
  // paving speckle
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    if (!tilePath[ty][tx]) continue;
    const x = tx * TILE + 3 + ((tx * 5 + ty * 3) % 8), y = ty * TILE + 4 + ((tx * 3 + ty * 7) % 7);
    if (at(x, y)) rect("#8ACBA9", x, y, 2, 1);
    if (at(x + 5, y + 5)) rect("#8ACBA9", x + 5, y + 5, 1, 1);
  }

  // ---- Stepping stones ----
  for (const [tx, ty] of STONES) {
    const x = tx * TILE, y = ty * TILE;
    for (const [dx, dy, w, h] of [[3, 3, 5, 4], [9, 8, 5, 4]]) {
      rect("#5C6B66", x + dx - 1, y + dy, w + 2, h); rect("#5C6B66", x + dx, y + dy - 1, w, h + 2);
      rect("#D9E4D2", x + dx, y + dy, w, h - 1); rect("#B7C6B3", x + dx + 1, y + dy + h - 2, w - 1, 1);
    }
  }

  // ---- Flowers ----
  const colors = ["#FFFFFF", "#F6D55C", "#F28DB2"];
  FLOWERS.forEach(([tx, ty], n) => {
    const x = tx * TILE, y = ty * TILE;
    for (const [dx, dy] of [[3, 4], [10, 9], [5, 11]]) {
      const c = colors[(n + dx) % colors.length];
      rect("#3F9A62", x + dx + 1, y + dy + 1, 1, 2);
      rect(c, x + dx, y + dy, 3, 1); rect(c, x + dx + 1, y + dy - 1, 1, 3);
      rect("#F6D55C", x + dx + 1, y + dy, 1, 1);
    }
  });

  tex.refresh();
  return "ground";
}
