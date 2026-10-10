import { sprite, hash, lighten, darken, mix } from "./draw.js";

// Shared building parts ------------------------------------------------------------------------

function window_(g, x, y, w, h, { frame = "#4a3a34", sill = "#cfc6b0" } = {}) {
  g.px(frame, x, y, w, h);
  g.px("#7fbdea", x + 1, y + 1, w - 2, h - 2);
  g.px("#b9e2fa", x + 1, y + 1, w - 2, 2); // sky glint at the top
  g.px("#d9f1ff", x + 2, y + 3, 2, 1); // little reflection
  g.px("#d9f1ff", x + 3, y + 4, 2, 1);
  g.px(frame, x + Math.floor(w / 2), y + 1, 1, h - 2); // mullion
  g.px(frame, x + 1, y + Math.floor(h / 2), w - 2, 1);
  g.px(sill, x - 1, y + h, w + 2, 2); // sill
  g.px(darken(sill, 0.25), x - 1, y + h + 1, w + 2, 1);
}

function door(g, x, y, w, h, col = "#9a6b43") {
  g.px("#3d2a20", x - 1, y - 1, w + 2, h + 1); // frame
  g.px(col, x, y, w, h);
  g.px(lighten(col, 0.18), x, y, 2, h); // lit edge
  g.px(darken(col, 0.22), x + w - 2, y, 2, h);
  g.px("#7fbdea", x + 3, y + 2, w - 6, 6); // glass
  g.px("#d9f1ff", x + 4, y + 3, 2, 1);
  g.px("#3d2a20", x + Math.floor(w / 2), y + 2, 1, 6);
  g.px(darken(col, 0.3), x + 3, y + 10, w - 6, h - 12); // lower panel
  g.px("#f3d36b", x + w - 4, y + Math.floor(h / 2) + 1, 2, 2); // knob
}

function step(g, x, y, w) {
  g.px("#aab3be", x, y, w, 3);
  g.px("#d5dbe3", x, y, w, 1);
  g.px("#7e8895", x, y + 2, w, 1);
}

function stoneBase(g, y, w, h) {
  g.px("#9aa6b2", 0, y, w, h);
  for (let j = 0; j < h; j += 3) {
    g.px("#7d8895", 0, y + j + 2, w, 1);
    for (let x = (j / 3) % 2 ? 4 : 0; x < w; x += 8) g.px("#7d8895", x, y + j, 1, 3);
  }
  g.px("#bcc6d0", 0, y, w, 1);
}

// Overlapping roof tiles. rows of `tw` x `th` tiles, every other row shifted by half a tile.
function roofTiles(g, x0, y0, w, h, [light, base, dark], { inset = () => 0, tw = 8, th = 4, seed = 1 } = {}) {
  for (let y = 0; y < h; y++) {
    const row = Math.floor(y / th);
    const off = row % 2 ? tw / 2 : 0;
    const ins = inset(y);
    for (let x = ins; x < w - ins; x++) {
      const tx = (x + off) % tw;
      const tile = Math.floor((x + off) / tw);
      let c = base;
      const v = hash(tile, row, seed);
      if (v < 0.18) c = mix(base, light, 0.35);
      else if (v > 0.86) c = mix(base, dark, 0.3);
      const ty = y % th;
      if (ty === 0) c = light === base ? c : mix(c, light, 0.7); // lit top edge of each tile
      if (ty === th - 1) c = dark; // shadow under each tile
      if (tx === tw - 1) c = mix(c, dark, 0.55); // seam between tiles
      g.px(c, x0 + x, y0 + y, 1, 1);
    }
  }
}

// 1. STUDIO (Work): terracotta roof, cream walls, striped awning ----------------------------
export function studio() {
  const W = 112, H = 64;
  return sprite(W, H, (g) => {
    const R = ["#f08a68", "#e0604a", "#a93f30"];
    // roof
    roofTiles(g, 0, 0, W, 26, R, { inset: (y) => Math.max(0, 6 - y), seed: 3 });
    g.px("#f4a08a", 7, 0, W - 14, 1); // ridge highlight
    // eave, then the shadow it throws
    g.px("#7c2e24", 0, 26, W, 3);
    g.px("#b8483a", 0, 26, W, 1);
    g.px("#d9caa6", 0, 29, W, 2);
    // walls
    g.px("#f5ecd3", 0, 29, W, 29);
    for (let y = 33; y < 58; y += 5) g.px("#e7dcbc", 0, y, W, 1); // siding
    g.px("#cfc2a0", 0, 29, 2, 29); // left shade
    g.px("#cfc2a0", W - 2, 29, 2, 29);
    // windows either side of the door
    window_(g, 9, 35, 15, 14);
    window_(g, 30, 35, 15, 14);
    window_(g, 67, 35, 15, 14);
    window_(g, 88, 35, 15, 14);
    // door with a striped awning
    stoneBase(g, 58, W, 6);
    door(g, 48, 37, 16, 21);
    for (let x = 41; x < 71; x++) {
      const stripe = Math.floor((x - 41) / 5) % 2 === 0;
      g.px(stripe ? "#e0604a" : "#fbf4e2", x, 31, 1, 5);
      g.px(stripe ? "#a93f30" : "#cfc6b0", x, 36, 1, 1);
    }
    g.px("#7c2e24", 41, 30, 30, 1);
    step(g, 45, 61, 22);
  });
}

// 2. GALLERY (Projects): round cream building, pillars and a sunset banner ------------------
export function gallery() {
  const W = 112, H = 48;
  return sprite(W, H, (g) => {
    g.rrect("#f3e9ca", 0, 0, W, H, 11, { bottom: false });
    // sunset banner behind the pillars
    const bands = ["#f7b267", "#f4845f", "#e0604a", "#c0463a"];
    bands.forEach((c, i) => g.px(c, 2, 9 + i * 3, W - 4, 3));
    g.px("#fff1c9", 2, 9, W - 4, 1);
    // pillars (skip the middle where the door is)
    for (const x of [6, 22, 38, 70, 86, 102]) {
      g.px("#fff8e1", x, 3, 5, 40);
      g.px("#d8cba4", x + 4, 3, 1, 40);
      g.px("#fff8e1", x - 1, 3, 7, 2); // cap
      g.px("#d8cba4", x - 1, 5, 7, 1);
      g.px("#d8cba4", x - 1, 41, 7, 2); // plinth
    }
    // arched windows
    for (const x of [12, 28, 76, 92]) {
      g.px("#4a3a34", x, 24, 9, 13);
      g.px("#7fbdea", x + 1, 25, 7, 11);
      g.px("#b9e2fa", x + 1, 25, 7, 2);
      g.px("#d9f1ff", x + 2, 28, 2, 1);
    }
    g.px("#b9b09a", 0, 43, W, 5);
    g.px("#d6cfba", 0, 43, W, 1);
    door(g, 48, 26, 16, 17);
    // little gallery frame sign above the door
    g.px("#4a3a34", 50, 19, 12, 5);
    g.px("#fff1c9", 51, 20, 10, 3);
    g.px("#e0604a", 53, 21, 2, 1);
    g.px("#4a8fd0", 57, 21, 3, 1);
    step(g, 45, 44, 22);
  }, "#2b2a2e");
}

// 3. HOUSE (About): warm yellow walls, grey striped roof, brick chimney --------------------
export function house() {
  const W = 80, H = 54;
  return sprite(W, H, (g) => {
    // chimney
    g.px("#b5523b", 58, 0, 9, 14);
    g.px("#d46e52", 58, 0, 9, 2);
    g.px("#8d3a29", 64, 2, 3, 12);
    for (let y = 3; y < 14; y += 3) g.px("#8d3a29", 58, y, 9, 1);
    // roof: grey stripes
    for (let y = 0; y < 17; y++) {
      const ins = Math.max(0, 5 - y);
      const c = y % 4 === 3 ? "#5d6776" : y % 4 === 0 ? "#a9b2bf" : "#8d97a5";
      g.px(c, ins, 6 + y, W - ins * 2, 1);
    }
    g.px("#5d6776", 0, 23, W, 2);
    g.px("#e0d7b6", 0, 25, W, 2); // shadow under the eave
    // walls
    g.px("#f1df9f", 0, 27, W, 23);
    for (let y = 31; y < 50; y += 4) g.px("#e2cf86", 0, y, W, 1);
    g.px("#d6c47c", 0, 27, 2, 23);
    g.px("#d6c47c", W - 2, 27, 2, 23);
    stoneBase(g, 50, W, 4);
    window_(g, 9, 33, 14, 11);
    window_(g, 57, 33, 14, 11);
    door(g, 32, 34, 16, 16, "#8a5a3c");
    g.px("#e0604a", 29, 30, 22, 3); // door canopy
    g.px("#a93f30", 29, 33, 22, 1);
    step(g, 29, 51, 22);
  });
}

// 4. POST OFFICE (Contact): blue roof, white walls, red envelope sign -----------------------
export function postOffice() {
  const W = 80, H = 48;
  return sprite(W, H, (g) => {
    const B = ["#7fb0ec", "#4c7fc4", "#2f5a96"];
    roofTiles(g, 0, 0, W, 17, B, { inset: (y) => Math.max(0, 4 - y), tw: 6, seed: 9 });
    g.px("#274a7d", 0, 17, W, 3);
    g.px("#3d6cb0", 0, 17, W, 1);
    g.px("#d4d7dd", 0, 20, W, 2);
    g.px("#f7f7ef", 0, 22, W, 22);
    for (let y = 26; y < 44; y += 4) g.px("#e6e6dc", 0, y, W, 1);
    g.px("#cfd2d8", 0, 22, 2, 22);
    g.px("#cfd2d8", W - 2, 22, 2, 22);
    // red envelope sign
    g.px("#3a2630", 26, 22, 28, 12);
    g.px("#d94a3d", 27, 23, 26, 10);
    g.px("#fff6e0", 31, 25, 18, 6);
    g.px("#d94a3d", 31, 25, 1, 1); g.px("#d94a3d", 32, 26, 1, 1); g.px("#d94a3d", 33, 27, 1, 1);
    g.px("#d94a3d", 48, 25, 1, 1); g.px("#d94a3d", 47, 26, 1, 1); g.px("#d94a3d", 46, 27, 1, 1);
    g.px("#d94a3d", 34, 28, 12, 1);
    g.px("#8c8c80", 39, 29, 2, 2); // wax seal
    g.px("#9aa6b2", 0, 44, W, 4);
    g.px("#7d8895", 0, 47, W, 1);
    window_(g, 7, 26, 14, 11);
    window_(g, 59, 26, 14, 11);
    door(g, 32, 29, 16, 15, "#5b7fb0");
    // mailbox beside the door
    g.px("#2b2230", 53, 31, 7, 11);
    g.px("#e0604a", 54, 32, 5, 5);
    g.px("#2b2230", 55, 34, 3, 1);
    g.px("#9a6b43", 55, 42, 1, 3);
    step(g, 29, 45, 22);
  }, "#222a38");
}
