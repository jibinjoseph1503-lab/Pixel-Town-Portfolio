import { TILE } from "../config/assets.js";

// base = first frame of that direction in the character sheet (idle); +1 and +2 are the two steps.
// Left uses the right-facing frames, mirrored.
export const DIRS = {
  down: { dx: 0, dy: 1, base: 0, flip: false },
  up: { dx: 0, dy: -1, base: 3, flip: false },
  left: { dx: -1, dy: 0, base: 6, flip: true },
  right: { dx: 1, dy: 0, base: 6, flip: false },
};

const FEET = 1; // the frames carry a 1px outline margin under the feet

// A character that walks on the tile grid, one tile at a time (GBA style).
export default class Player {
  constructor(scene, tx, ty, sheet = "player") {
    this.scene = scene;
    this.sheet = sheet;
    this.tx = tx;
    this.ty = ty;
    this.facing = "down";
    this.moving = false;
    this.elapsed = 0;
    this.duration = 130; // ms per tile
    this.from = null;
    this.to = null;
    this.onArrive = null;
    this.sprite = scene.add.sprite(0, 0, sheet, 0).setOrigin(0.5, 1);
    this.place(tx, ty);
  }

  place(tx, ty, facing = this.facing) {
    this.tx = tx;
    this.ty = ty;
    this.moving = false;
    this.sprite.setPosition(tx * TILE + TILE / 2, ty * TILE + TILE + FEET);
    this.sprite.setVisible(true).setAlpha(1);
    this.face(facing);
    this.sortDepth();
  }

  face(dir) {
    this.facing = dir;
    this.sprite.setFlipX(DIRS[dir].flip);
    this.sprite.setFrame(DIRS[dir].base);
  }

  // The feet decide who is drawn in front of whom.
  sortDepth() {
    this.sprite.setDepth(this.sprite.y - FEET - 1);
  }

  // Begin walking one tile in `dir`. Caller has already checked it is allowed.
  step(dir, duration = this.duration, onArrive = null) {
    const d = DIRS[dir];
    this.facing = dir;
    this.moving = true;
    this.elapsed = 0;
    this.duration = duration;
    this.from = { x: this.sprite.x, y: this.sprite.y };
    this.to = { x: this.sprite.x + d.dx * TILE, y: this.sprite.y + d.dy * TILE };
    this.pendingTile = { tx: this.tx + d.dx, ty: this.ty + d.dy };
    this.onArrive = onArrive;
    this.sprite.setFlipX(d.flip);
    // Alternate left-foot / right-foot poses on each tile; the idle pose only shows when stopped.
    this.alt = !this.alt;
    this.sprite.setFrame(d.base + (this.alt ? 1 : 2));
  }

  update(delta) {
    if (!this.moving) return false;
    this.elapsed += delta;
    const t = this.duration <= 0 ? 1 : Math.min(1, this.elapsed / this.duration);
    this.sprite.x = Math.round(this.from.x + (this.to.x - this.from.x) * t);
    this.sprite.y = Math.round(this.from.y + (this.to.y - this.from.y) * t);
    this.sortDepth();
    if (t < 1) return true;

    this.moving = false;
    this.tx = this.pendingTile.tx;
    this.ty = this.pendingTile.ty;
    this.sprite.setFrame(DIRS[this.facing].base);
    const cb = this.onArrive;
    this.onArrive = null;
    if (cb) cb();
    return false;
  }
}
