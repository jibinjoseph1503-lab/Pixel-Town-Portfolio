import { studio, gallery, house, postOffice } from "./buildings.js";
import { pineBig, pineSmall, bush, rock, post, sign, fountain } from "./nature.js";
import { characterSheet, FRAME_W, FRAME_H, PLAYER, ELDER } from "./character.js";

// Every sprite in the game is drawn in code (no third-party art), so the whole town shares one
// palette and one outline style. Each entry becomes a texture with the same key.
export const SPRITES = {
  "bld-work": studio,
  "bld-projects": gallery,
  "bld-about": house,
  "bld-contact": postOffice,
  "pine-big": pineBig,
  "pine-small": pineSmall,
  bush,
  rock,
  post,
  sign,
  fountain,
};

export function generateArt(scene) {
  for (const [key, make] of Object.entries(SPRITES)) {
    if (!scene.textures.exists(key)) scene.textures.addCanvas(key, make());
  }
  for (const [key, palette] of [["player", PLAYER], ["npc", ELDER]]) {
    if (scene.textures.exists(key)) continue;
    const sheet = characterSheet(palette);
    const tex = scene.textures.addCanvas(key, sheet);
    for (let i = 0; i < sheet.width / FRAME_W; i++) tex.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
  }
}
