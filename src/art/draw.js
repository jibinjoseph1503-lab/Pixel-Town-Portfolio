// A tiny pixel-art toolkit. Every sprite is painted into its own canvas with a 1px transparent
// margin, then an automatic dark outline is traced around the silhouette (GBA style).

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
export const lighten = (c, t) => mix(c, "#ffffff", t);
export const darken = (c, t) => mix(c, "#000000", t);

// Cheap deterministic noise so patterns are stable between loads.
export const hash = (x, y, s = 0) => {
  let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function addOutline(canvas, color) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const [r, g, b] = rgb(color);
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        const i = (y * W + x) * 4;
        out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
      }
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

// Paint a sprite of w x h pixels. The returned canvas is (w + 2) x (h + 2): the extra pixel on each
// side holds the outline. Coordinates passed to the painter run 0..w-1 and 0..h-1.
export function sprite(w, h, paint, outline = "#1b2a2f") {
  const canvas = document.createElement("canvas");
  canvas.width = w + 2;
  canvas.height = h + 2;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const g = {
    w, h, ctx,
    px(col, x, y, pw = 1, ph = 1) {
      if (pw <= 0 || ph <= 0) return;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, pw, ph);
    },
    clear(x, y, pw = 1, ph = 1) { ctx.clearRect(Math.round(x) + 1, Math.round(y) + 1, pw, ph); },
    span(col, y, x0, x1) { if (x1 >= x0) this.px(col, x0, y, x1 - x0 + 1, 1); },
    // Rounded rectangle; `top` / `bottom` choose which corners are rounded.
    rrect(col, x, y, rw, rh, r, { top = true, bottom = true } = {}) {
      for (let j = 0; j < rh; j++) {
        let inset = 0;
        const fromTop = top && j < r ? r - j - 0.5 : null;
        const fromBottom = bottom && rh - 1 - j < r ? r - (rh - 1 - j) - 0.5 : null;
        const dy = fromTop ?? fromBottom;
        if (dy !== null) inset = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
        this.px(col, x + inset, y + j, rw - inset * 2, 1);
      }
    },
    ellipse(col, cx, cy, rx, ry) {
      for (let j = -ry; j <= ry; j++) {
        const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / ((ry + 0.5) * (ry + 0.5)))));
        this.px(col, cx - half, cy + j, half * 2 + 1, 1);
      }
    },
  };
  paint(g);
  if (outline) addOutline(canvas, outline);
  return canvas;
}
