import Phaser from "phaser";
import { SPRITES, generateArt } from "../art/index.js";

// Open the site with ?art to see every sprite enlarged on a plain background.
export default class ArtPreview extends Phaser.Scene {
  constructor() { super("ArtPreview"); }

  create() {
    generateArt(this);
    this.cameras.main.setBackgroundColor(0x72c7a2);
    let x = 4, y = 4, rowH = 0;
    const place = (key, frame) => {
      const img = this.add.image(0, 0, key, frame).setOrigin(0);
      if (x + img.width > 396) { x = 4; y += rowH + 6; rowH = 0; }
      img.setPosition(x, y);
      x += img.width + 6;
      rowH = Math.max(rowH, img.height);
    };
    for (const key of Object.keys(SPRITES)) place(key);
    for (const key of ["player", "npc"]) for (let i = 0; i < 9; i++) place(key, i);
  }
}
