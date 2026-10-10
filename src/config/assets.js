// Tile size, screen size and palette live here. All sprites are drawn in code (see src/art/), so
// there are no image files to load. To use real artwork later, replace the generators in
// src/art/index.js with loaders pointing at your own files.
export const TILE = 16;
export const GAME_W = 400;
export const GAME_H = 240; // 25 x 15 tiles

export const PALETTE = {
  // Sampled to match the reference mood (a little more teal and lower contrast than the PRD estimates)
  grass: 0x72c7a2,
  grassTuft: 0x5cb48a,
  path: 0x9edfbf,
  pathEdge: 0x7fc5a3,
  roof: 0xe0604a,
  water: 0x4c7fc4,
  wood: 0x8a5a3c,
  panel: 0xf8f8f0,
  outline: 0x2e3440,
};
