import { hash } from "./draw.js";

const make = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return { c, ctx, px: (col, x, y, pw = 1, ph = 1) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), pw, ph); } };
};

// Scanline-fills a polygon (points in pixels) and returns the set of pixels it covered.
function fillPoly(px, pts, color, mask) {
  const ys = pts.map((p) => p[1]);
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) { px(color, x, y); mask?.add(`${x},${y}`); }
    }
  }
}

// A faceted boulder: lit top-left face, shaded right face, a crack, and a dark outline.
// (u, v) are fractions of the boulder's width and height; (cx, cy) is the middle of its base.
function boulder(px, cx, cy, w, h, tones, shape) {
  const at = (pts) => pts.map(([u, v]) => [cx - w / 2 + u * w, cy - h + v * h]);
  const mask = new Set();
  fillPoly(px, at(shape.body), tones.mid, mask);
  fillPoly(px, at(shape.lit), tones.light);
  fillPoly(px, at(shape.shade), tones.dark);
  for (const [[u0, v0], [u1, v1]] of shape.cracks) { // crack lines
    const n = Math.max(2, Math.round(Math.hypot((u1 - u0) * w, (v1 - v0) * h)));
    for (let i = 0; i <= n; i++) px(tones.crack, cx - w / 2 + (u0 + ((u1 - u0) * i) / n) * w, cy - h + (v0 + ((v1 - v0) * i) / n) * h);
  }
  for (const k of mask) {
    const [x, y] = k.split(",").map(Number);
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!mask.has(`${x + ox},${y + oy}`)) px(tones.edge, x + ox, y + oy);
  }
}

const BIG_ROCK = {
  body: [[0.04, 0.78], [0.0, 0.46], [0.16, 0.14], [0.46, 0.0], [0.8, 0.08], [1.0, 0.4], [0.96, 0.82], [0.74, 1.0], [0.24, 1.0]],
  lit: [[0.0, 0.46], [0.16, 0.14], [0.46, 0.0], [0.58, 0.32], [0.3, 0.62], [0.06, 0.74]],
  shade: [[1.0, 0.4], [0.96, 0.82], [0.74, 1.0], [0.56, 0.78], [0.66, 0.4], [0.8, 0.08]],
  cracks: [[[0.58, 0.32], [0.52, 0.62]], [[0.52, 0.62], [0.58, 0.9]], [[0.3, 0.62], [0.3, 0.9]]],
};
const SLAB = {
  body: [[0.0, 0.7], [0.22, 0.05], [0.95, 0.0], [1.0, 0.55], [0.7, 1.0], [0.1, 1.0]],
  lit: [[0.22, 0.05], [0.95, 0.0], [1.0, 0.3], [0.2, 0.34]],
  shade: [[1.0, 0.55], [0.7, 1.0], [0.1, 1.0], [0.0, 0.7], [0.3, 0.62]],
  cracks: [[[0.6, 0.34], [0.55, 0.62]]],
};

// The whole backdrop: sky, hills, meadow. Drawn for the exact size of the screen so it never stretches.
export function paintScenery(W, H) {
  const { c, px } = make(W, H);
  const horizon = Math.round(H * 0.58);

  // Sky: stepped bands with a dithered seam between them, like handheld hardware
  const bands = ["#2b79d6", "#3787df", "#4695e8", "#59a5ee", "#72b8f3", "#90cbf6", "#b0def9"];
  const bh = horizon / bands.length;
  bands.forEach((col, i) => px(col, 0, Math.floor(i * bh), W, Math.ceil(bh) + 1));
  for (let i = 0; i < bands.length - 1; i++) {
    const y0 = Math.floor((i + 1) * bh);
    for (let x = 0; x < W; x++) {
      if (x % 4 === 0) px(bands[i + 1], x, y0 - 2);
      if (x % 2 === 0) px(bands[i + 1], x, y0 - 1);
      if (x % 2 === 1) px(bands[i], x, y0);
    }
  }

  const ridge = (base, a1, f1, p1, a2, f2, p2) => (x) => base - a1 * Math.sin(x * f1 + p1) - a2 * Math.sin(x * f2 + p2);

  // Pine silhouettes along a ridge
  const pines = (fn, color, density, seed, maxH) => {
    for (let x = 2; x < W; x += 3) {
      if (hash(x, seed) > density) continue;
      const h = 3 + Math.floor(hash(x, seed + 9) * maxH);
      const y = Math.round(fn(x));
      for (let k = 0; k < h; k++) px(color, x - Math.floor(k / 3), y - h + k + 1, 1 + Math.floor(k / 3) * 2, 1);
    }
  };

  // Far hills (blue-green) with a big soft slope on the left
  const far = ridge(horizon - 8, H * 0.1, 0.0085, 0.6, H * 0.03, 0.03, 2);
  for (let x = 0; x < W; x++) {
    const y = Math.round(far(x));
    px("#5ea7b4", x, y, 1, horizon + 8 - y);
    px("#7cc0c8", x, y, 1, 1);
    px("#52989f", x, y + Math.round((horizon + 8 - y) * 0.55), 1, horizon + 8 - y); // shaded lower slope
  }
  pines(far, "#3f8a93", 0.5, 5, 4);

  // Nearer hills (green)
  const mid = ridge(horizon + 2, H * 0.045, 0.017, 2.2, H * 0.02, 0.05, 0.4);
  for (let x = 0; x < W; x++) {
    const y = Math.round(mid(x));
    px("#3d9a75", x, y, 1, horizon + 14 - y);
    px("#5cbb8f", x, y, 1, 1);
    px("#4aa982", x, y + 1, 1, 1);
  }
  pines(mid, "#2a7a59", 0.6, 11, 5);

  // Meadow
  const meadowTop = horizon + 8;
  const grass = ["#a6d84a", "#98cf3f", "#8bc436", "#7fb92f", "#74ad2a"];
  const gh = (H - meadowTop) / grass.length;
  grass.forEach((col, i) => px(col, 0, meadowTop + Math.floor(i * gh), W, Math.ceil(gh) + 1));
  for (let i = 0; i < grass.length - 1; i++) {
    const y0 = meadowTop + Math.floor((i + 1) * gh);
    for (let x = 0; x < W; x++) if ((x + i) % 2 === 0) px(grass[i + 1], x, y0 - 1);
  }
  const area = W * (H - meadowTop);
  for (let i = 0; i < area / 120; i++) { // grass tufts
    const x = Math.floor(hash(i, 1) * W), y = meadowTop + 2 + Math.floor(hash(i, 2) * (H - meadowTop - 4));
    const big = y > meadowTop + (H - meadowTop) * 0.5 ? 2 : 1;
    px("#5f9a22", x, y, 1, big + 1); px("#5f9a22", x + big + 1, y + 1, 1, big);
    px("#c6ea6e", x + 1, y - 1, 1, big);
  }
  for (let i = 0; i < area / 420; i++) { // flowers
    const x = Math.floor(hash(i, 3) * W), y = meadowTop + 6 + Math.floor(hash(i, 4) * (H - meadowTop - 10));
    const size = y > meadowTop + (H - meadowTop) * 0.55 ? 3 : 2;
    const col = ["#ffd23f", "#ffffff", "#ffd23f", "#e8553d"][Math.floor(hash(i, 5) * 4)];
    px("#3f8a1f", x + Math.floor(size / 2), y + size, 1, 2);
    px(col, x, y, size, size);
    if (size === 3) { px("#fff6c0", x + 1, y + 1, 1, 1); }
  }

  // Rocks on the right of the meadow
  const s = Math.max(0.7, Math.min(1.5, W / 480));
  const ry = meadowTop + Math.round((H - meadowTop) * 0.5);
  const tones = { light: "#e9ecf0", mid: "#c3c8d0", dark: "#8d94a0", edge: "#4f5766", crack: "#6b7280" };
  boulder(px, Math.round(W * 0.7), ry, 46 * s, 34 * s, tones, BIG_ROCK);
  boulder(px, Math.round(W * 0.7 + 38 * s), ry - 2 * s, 28 * s, 22 * s, tones, BIG_ROCK);
  boulder(px, Math.round(W * 0.92), ry - 10 * s, 34 * s, 26 * s, tones, BIG_ROCK);
  boulder(px, Math.round(W * 0.66), meadowTop + Math.round((H - meadowTop) * 0.86), 40 * s, 14 * s, { ...tones, mid: "#d7dbe1" }, SLAB);

  // Dark grass blades in the foreground corners
  for (let x = 0; x < W; x++) {
    const edge = Math.min(x, W - x) / W; // taller near the sides
    const h = Math.floor(hash(x, 6) * (5 + (1 - Math.min(1, edge * 4)) * 9));
    if (hash(x, 7) > 0.65) px(hash(x, 8) > 0.5 ? "#1c4a28" : "#2b6a35", x, H - h, 1, h);
  }
  return c;
}

// A fluffy pixel cloud: overlapping puffs, white on top, soft blue-grey underneath.
export function makeCloud(w, h, seed) {
  const { c, px } = make(w, h);
  const puffs = [];
  const n = Math.max(3, Math.round(w / 22));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const hump = Math.sin(t * Math.PI); // taller puffs in the middle
    const r = Math.round(h * (0.22 + 0.28 * hump + hash(i, seed) * 0.1));
    puffs.push([Math.round(t * w), h - r - 2 - Math.floor(hash(i, seed + 1) * 3), r]);
  }
  const inside = new Set();
  for (const [cx, cy, r] of puffs) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r && cy + y < h - 2) inside.add(`${cx + x},${cy + y}`);
  }
  for (const k of inside) {
    const [x, y] = k.split(",").map(Number);
    if (x < 0 || x >= w) continue;
    const rel = y / h;
    let col = "#ffffff";
    if (rel > 0.62) col = (x + y) % 2 === 0 ? "#ffffff" : "#dcebf8";
    if (rel > 0.74) col = "#d3e4f6";
    if (rel > 0.86) col = (x + y) % 2 === 0 ? "#d3e4f6" : "#b9d2ea";
    px(col, x, y);
  }
  return c;
}

const paintSprite = (rows, colors) => {
  const { c, px } = make(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) px(colors[ch], x, y); }));
  return c;
};

// Gull silhouettes: wings up / wings down
export function birdFrames() {
  const colors = { X: "#ffffff", g: "#aab9c9" };
  return [
    paintSprite(["X.....X", "gX...Xg", "..XXX.."], colors),
    paintSprite(["..XXX..", "gX...Xg", "X.....X"], colors),
  ];
}

// A small butterfly: wings open / closed
export function butterflyFrames() {
  const colors = { W: "#ffffff", p: "#f6a6c8", d: "#4b3a5a" };
  return [
    paintSprite(["Wp.d.pW", "WWpdpWW", ".Wp.pW.", "..W.W.."], colors),
    paintSprite(["...d...", "..WdW..", "..pdp..", "...d..."], colors),
  ];
}
