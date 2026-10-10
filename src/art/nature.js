import { sprite, hash, lighten, darken } from "./draw.js";

const OUT_GREEN = "#17402a";
const OUT_BROWN = "#3a2415";

// A pine is a trunk plus overlapping triangular tiers. Light comes from the top left.
function pine(W, H, tiers, trunkW, trunkH, seed) {
  return sprite(W, H, (g) => {
    const cx = W / 2;
    const tx0 = Math.floor(cx - trunkW / 2);
    g.px("#7b4b2a", tx0, H - trunkH, trunkW, trunkH);
    g.px("#a56d40", tx0, H - trunkH, 1, trunkH);
    g.px("#573219", tx0 + trunkW - 1, H - trunkH, 1, trunkH);

    for (const t of tiers) {
      for (let r = 0; r < t.h; r++) {
        const hw = Math.max(1, Math.round((t.half * (r + 1)) / t.h));
        const y = t.top + r;
        const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw) - 1;
        g.span("#40a04c", y, x0, x1);
        const hl = Math.max(1, Math.round(hw * 0.6));
        g.span("#6cc65c", y, x0, x0 + hl - 1);
        if (r % 3 === 1 && hl > 2) g.px("#92dc7b", x0 + 1, y, 1, 1); // sparkle
        const sh = Math.max(1, Math.round(hw * 0.45));
        g.span("#2c7d3e", y, x1 - sh + 1, x1);
        // darker lip along the bottom of each tier, with a ragged lower edge
        if (r >= t.h - 2) g.span(r === t.h - 1 ? "#1f5c35" : "#2a6c3b", y, x0, x1);
        if (r === t.h - 1) for (let x = x0 + 1; x < x1; x += 3) if (x < tx0 || x >= tx0 + trunkW) g.clear(x, y, 1, 1);
      }
    }
    void seed;
  }, OUT_GREEN);
}

export const pineBig = () => pine(26, 34, [
  { top: 0, h: 12, half: 7 }, { top: 8, h: 12, half: 10 }, { top: 16, h: 13, half: 13 },
], 4, 6, 1);

export const pineSmall = () => pine(16, 22, [
  { top: 0, h: 8, half: 4.5 }, { top: 5, h: 8, half: 6.5 }, { top: 10, h: 8, half: 8 },
], 3, 4, 2);

export function bush() {
  return sprite(14, 11, (g) => {
    g.ellipse("#3d9a60", 7, 5, 6, 5);
    g.ellipse("#2a7a47", 8, 7, 5, 3); // shade underneath
    g.ellipse("#3d9a60", 7, 4, 5, 4);
    g.ellipse("#6fd08f", 5, 3, 3, 2);
    g.px("#a6efb8", 4, 2, 2, 1);
    g.px("#6fd08f", 9, 5, 2, 1);
    g.px("#1f5f38", 3, 9, 8, 1);
  }, "#1b4a30");
}

export function rock() {
  return sprite(14, 10, (g) => {
    g.ellipse("#a89a86", 7, 5, 6, 4);
    g.ellipse("#8c7f6c", 8, 7, 5, 2);
    g.ellipse("#c9bca6", 5, 3, 3, 2);
    g.px("#e6dbc6", 4, 2, 2, 1);
    g.px("#6e6352", 3, 8, 9, 1);
  }, "#4b4036");
}

export function post() {
  return sprite(8, 14, (g) => {
    g.px("#a8703f", 1, 2, 6, 11);
    g.px("#cf9460", 1, 2, 2, 11); // lit side
    g.px("#7a4a28", 5, 2, 2, 11);
    g.ellipse("#e0b27a", 3, 2, 3, 1); // sawn top
    g.px("#b98550", 2, 2, 3, 1);
    g.px("#5d3a1e", 1, 12, 6, 1); // base shadow
    for (const y of [5, 8]) g.px("#8d5a32", 2, y, 3, 1); // bark marks
  }, OUT_BROWN);
}

export function sign() {
  return sprite(14, 16, (g) => {
    g.px("#8a5a3c", 6, 8, 2, 8);
    g.px("#b07a50", 6, 8, 1, 8);
    g.px("#8a5a3c", 0, 0, 14, 9);
    g.px("#efd7a8", 1, 1, 12, 7);
    g.px("#f8e8c4", 1, 1, 12, 1);
    g.px("#b08a58", 3, 3, 8, 1);
    g.px("#b08a58", 3, 5, 6, 1);
  }, OUT_BROWN);
}

export function fountain() {
  return sprite(32, 32, (g) => {
    // basin: stone rim, shaded outer wall, then the water
    g.ellipse("#8995b0", 16, 21, 15, 9);
    g.ellipse("#cdd6e8", 16, 19, 15, 8);
    g.ellipse("#a5b1cb", 16, 20, 12, 6);
    g.ellipse("#4c7fc4", 16, 20, 11, 5);
    g.ellipse("#6aa1e3", 14, 19, 8, 3);
    g.span("#a9d0f5", 18, 8, 12); g.span("#a9d0f5", 21, 19, 23);
    for (const [x, y] of [[10, 22], [20, 17], [23, 21]]) g.px("#e8f4ff", x, y, 2, 1);
    // centre column and spout
    g.px("#8995b0", 13, 6, 6, 14);
    g.px("#cdd6e8", 13, 6, 3, 14);
    g.px("#6f7c98", 18, 6, 1, 14);
    g.ellipse("#cdd6e8", 16, 6, 4, 2);
    g.ellipse("#4c7fc4", 16, 5, 3, 1);
    g.px("#e8f4ff", 15, 0, 2, 5); // jet
    g.px("#bfe0ff", 14, 2, 1, 3); g.px("#bfe0ff", 17, 2, 1, 3);
    g.px("#bfe0ff", 12, 5, 1, 2); g.px("#bfe0ff", 19, 5, 1, 2);
  }, "#2c3550");
}
