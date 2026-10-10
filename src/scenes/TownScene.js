import Phaser from "phaser";
import { TILE } from "../config/assets.js";
import {
  COLS, ROWS, BUILDINGS, SPAWN, FOUNTAIN, TREES, FENCES, BUSHES, ROCKS, buildMaps, frontTile,
} from "../config/town.js";
import { paintGround } from "../systems/Ground.js";
import Player, { DIRS } from "../systems/Player.js";
import { openOverlay, fadeTo, reducedMotion } from "../ui/Overlay.js";

export default class TownScene extends Phaser.Scene {
  constructor() { super("Town"); }

  create() {
    const { blocked, doorAt, key } = buildMaps();
    this.blocked = blocked;
    this.doorAt = doorAt;
    this.key = key;
    this.locked = false;

    this.add.image(0, 0, paintGround(this)).setOrigin(0).setDepth(0);
    this.addProps();

    this.player = new Player(this, SPAWN.tx, SPAWN.ty);
    this.player.face(SPAWN.facing);
    this.setupCamera();
    if (!reducedMotion()) this.cameras.main.fadeIn(350, 0, 0, 0); // arrive from the title screen

    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys("W,A,S,D");
    this.interact = kb.addKeys("ENTER,SPACE");

    if (new URLSearchParams(location.search).has("debug")) {
      this.drawDebug();
      window.__town = this; // handy for automated checks
    }
  }

  // The world is bigger than the screen: the camera follows the player and stops at the world's edges.
  setupCamera() {
    const cam = this.cameras.main;
    const worldW = COLS * TILE, worldH = ROWS * TILE;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setRoundPixels(true);

    // Follow an invisible marker at the middle of the character's body so the view moves with each pixel.
    this.camTarget = this.add.zone(0, 0, 1, 1);
    this.syncCamera();
    cam.centerOn(this.camTarget.x, this.camTarget.y);
    cam.startFollow(this.camTarget, true, 1, 1);

    // ?map zooms out to show the whole world (for checking the layout)
    if (new URLSearchParams(location.search).has("map")) {
      cam.stopFollow();
      cam.setZoom(Math.min(cam.width / worldW, cam.height / worldH));
      cam.centerOn(worldW / 2, worldH / 2);
    }
  }

  syncCamera() {
    const s = this.player.sprite;
    this.camTarget.setPosition(s.x, s.y - 12);
  }

  addProps() {
    // `px` is the horizontal centre in pixels, `bottomRow` the tile row whose bottom edge the sprite
    // stands on. Every sprite is drawn with a 1px outline margin, so each is nudged down by 1 to sit
    // on the tile edge.
    const stand = (tex, px, bottomRow, flip = false) =>
      this.add.image(px, bottomRow * TILE + 1, tex).setOrigin(0.5, 1).setDepth(bottomRow * TILE).setFlipX(flip);
    const onTile = (tex, x, y) => stand(tex, x * TILE + TILE / 2, y + 1);

    for (const b of BUILDINGS) {
      stand(b.sprite, (b.tx + b.w / 2) * TILE, b.ty + b.h);
      onTile("sign", b.sign[0], b.sign[1]);
    }
    TREES.forEach(([x, y, kind], i) => {
      if (kind === "pine") stand("pine-big", (x + 1) * TILE, y + 2, i % 2 === 1);
      else onTile("pine-small", x, y);
    });
    stand("fountain", (FOUNTAIN.tx + 1) * TILE, FOUNTAIN.ty + 2);

    // Fence lines running sideways get two posts per tile so the logs sit shoulder to shoulder.
    const isFence = (x, y) => FENCES.some(([fx, fy]) => fx === x && fy === y);
    for (const [x, y] of FENCES) {
      if (isFence(x - 1, y) || isFence(x + 1, y)) {
        stand("post", x * TILE + 4, y + 1);
        stand("post", x * TILE + 12, y + 1);
      } else onTile("post", x, y);
    }
    for (const [x, y] of BUSHES) onTile("bush", x, y);
    for (const [x, y] of ROCKS) onTile("rock", x, y);
  }

  isBlocked(tx, ty) {
    return tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || this.blocked[ty][tx];
  }

  heldDir() {
    const c = this.cursors, w = this.wasd;
    if (c.up.isDown || w.W.isDown) return "up";
    if (c.down.isDown || w.S.isDown) return "down";
    if (c.left.isDown || w.A.isDown) return "left";
    if (c.right.isDown || w.D.isDown) return "right";
    return null;
  }

  update(_, delta) {
    // Keep animating even while input is locked (the door step needs to finish).
    this.player.update(delta);
    this.syncCamera();
    if (this.locked || this.player.moving) return;

    const dir = this.heldDir();
    if (!dir) {
      const pressed = Phaser.Input.Keyboard.JustDown(this.interact.ENTER) || Phaser.Input.Keyboard.JustDown(this.interact.SPACE);
      if (pressed) this.tryInteract();
      return;
    }

    const { tx, ty } = this.player;
    const d = DIRS[dir];
    const nx = tx + d.dx, ny = ty + d.dy;
    const door = this.doorAt.get(this.key(nx, ny));
    if (door && dir === "up") return this.enter(door);
    if (this.isBlocked(nx, ny)) return this.player.face(dir);
    this.player.step(dir);
  }

  // Enter / Space while standing at a door and facing it
  tryInteract() {
    const { tx, ty, facing } = this.player;
    if (facing !== "up") return;
    const door = this.doorAt.get(this.key(tx, ty - 1));
    if (door) this.enter(door);
  }

  // The enter sequence: step into the door, fade to near-black, open the panel.
  enter(building) {
    this.locked = true;
    this.player.face("up");

    const open = async () => {
      this.player.sprite.setVisible(false);
      await fadeTo(0.92, 250);
      this.input.keyboard.enabled = false;
      openOverlay(building.id, () => this.exit(building));
    };

    if (reducedMotion()) open();
    else this.player.step("up", 140, open);
  }

  // Closing the panel: stand one tile in front of that door, facing down.
  async exit(building) {
    const f = frontTile(building);
    this.player.place(f.tx, f.ty, "down");
    this.input.keyboard.enabled = true;
    this.input.keyboard.resetKeys();
    await fadeTo(0, 250);
    this.locked = false;
  }

  drawDebug() {
    const g = this.add.graphics().setDepth(9999).setAlpha(0.45);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (this.blocked[y][x]) { g.fillStyle(0xff0000); g.fillRect(x * TILE, y * TILE, TILE, TILE); }
    }
    for (const b of BUILDINGS) {
      g.fillStyle(0x00ff00);
      for (const dx of b.doors) g.fillRect(dx * TILE, (b.ty + b.h - 1) * TILE, TILE, TILE);
      g.fillStyle(0x0000ff);
      g.fillRect(frontTile(b).tx * TILE, frontTile(b).ty * TILE, TILE, TILE);
    }
  }
}
