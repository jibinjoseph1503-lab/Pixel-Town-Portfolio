import Phaser from "phaser";
import { generateArt } from "../art/index.js";
import { renderText, measure } from "../art/bitmapFont.js";
import { paintScenery, makeCloud, birdFrames, butterflyFrames } from "../art/titleScenery.js";
import { hash } from "../art/draw.js";
import { reducedMotion } from "../ui/Overlay.js";

const params = new URLSearchParams(location.search);
const SKIP = params.has("skip") || params.has("debug"); // automated checks jump straight into the town

const LOGO = { bold: true, fill: ["#ffe866", "#ffc400"], outline: [{ color: "#26399a", size: 1 }, { color: "#4a72e0", size: 2 }], shadow: { color: "#14235f", dy: 1 } };
const WHITE = { fill: "#ffffff", outline: [{ color: "#1d2b57", size: 1 }] };

// The title screen doubles as the preloader. All the game's art is drawn in code, so "loading" is the
// short moment while the sprites are painted; then it waits for "press start".
export default class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  create() {
    this.ready = false;
    this.started = false;
    this.progress = 0;
    this.build();
    this.scale.on("resize", this.onResize, this);
    this.events.once("shutdown", () => this.scale.off("resize", this.onResize, this));

    // Paint the sprites in two steps so the bar visibly fills
    this.time.delayedCall(60, () => {
      this.progress = 0.5; this.updateBar();
      generateArt(this);
      this.time.delayedCall(120, () => {
        this.progress = 1; this.updateBar();
        if (document.fonts?.load) document.fonts.load("12px 'Pixelify Sans'"); // for the section panels later
        this.ready = true;
        if (SKIP) return this.scene.start("Town");
        this.showPrompt();
        this.input.keyboard.on("keydown-ENTER", () => this.start());
        this.input.keyboard.on("keydown-SPACE", () => this.start());
        this.input.on("pointerdown", () => this.start());
      });
    });
  }

  start() {
    if (!this.ready || this.started) return;
    this.started = true;
    if (reducedMotion()) return this.scene.start("Town");
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Town"));
  }

  onResize() {
    if (!this.scene.isActive()) return;
    this.build();
    if (this.ready) this.showPrompt();
  }

  // ---- drawing ----------------------------------------------------------------------------------

  addTexture(key, canvas) {
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
    this.keys.push(key);
    return key;
  }

  teardown() {
    this.root?.destroy();
    (this.keys || []).forEach((k) => this.textures.exists(k) && this.textures.remove(k));
    this.keys = [];
    this.clouds = []; this.birds = []; this.butterfly = null;
  }

  // Text from the pixel font, centred horizontally at `y` (a fraction of the screen height).
  line(text, style, scale, yFrac, name) {
    const { width: W, height: H } = this.scale;
    const key = this.addTexture(`title-${name}`, renderText(text, { scale, ...style }));
    const img = this.add.image(Math.round(W / 2), Math.round(H * yFrac), key).setOrigin(0.5);
    this.root.add(img);
    return img;
  }

  build() {
    this.teardown();
    const { width: W, height: H } = this.scale;
    this.root = this.add.container(0, 0);

    this.root.add(this.add.image(0, 0, this.addTexture("title-scenery", paintScenery(W, H))).setOrigin(0));

    // Clouds drift slowly across the sky
    const unit = Math.min(1, W / 480);
    const count = Math.max(4, Math.round(W / 100));
    for (let i = 0; i < count; i++) {
      const w = Math.round((54 + hash(i, 40) * 100) * Math.max(0.55, unit));
      const key = this.addTexture(`title-cloud-${i}`, makeCloud(w, Math.round(w * 0.42), i));
      const img = this.add.image(Math.round(hash(i, 41) * W), Math.round(H * (0.04 + hash(i, 42) * 0.36)), key).setOrigin(0.5);
      this.root.add(img);
      this.clouds.push({ img, speed: 2 + hash(i, 43) * 5 });
    }

    // Gulls and a butterfly
    const [b0, b1] = birdFrames(), [f0, f1] = butterflyFrames();
    this.birdKeys = [this.addTexture("title-bird-0", b0), this.addTexture("title-bird-1", b1)];
    this.flyKeys = [this.addTexture("title-fly-0", f0), this.addTexture("title-fly-1", f1)];
    for (let i = 0; i < 2; i++) {
      const img = this.add.image(Math.round(W * (0.6 + i * 0.25)), Math.round(H * (0.1 + i * 0.07)), this.birdKeys[0]);
      this.root.add(img);
      this.birds.push({ img, speed: 9 + i * 3, phase: i });
    }
    const fly = this.add.image(Math.round(W * 0.25), Math.round(H * 0.7), this.flyKeys[0]);
    this.root.add(fly);
    this.butterfly = { img: fly, t: 0 };

    // Logo, tagline
    const nameW = measure("PIXEL TOWN", 1, true).w + 8;
    const oneLine = Math.floor((W * 0.82) / nameW) >= 3;
    let logoBottom;
    if (oneLine) {
      const logo = this.line("PIXEL TOWN", LOGO, Math.min(7, Math.floor((W * 0.82) / nameW)), 0.2, "logo");
      logoBottom = logo.y + logo.height / 2;
    } else {
      const s = Math.max(1, Math.floor((W * 0.78) / (measure("PIXEL", 1, true).w + 8)));
      this.line("PIXEL", LOGO, s, 0.14, "logo1");
      const second = this.line("TOWN", LOGO, s, 0.27, "logo2");
      logoBottom = second.y + second.height / 2;
    }
    this.line("A UX DESIGNER'S PORTFOLIO", WHITE, 1, (logoBottom + 9) / H, "tag");

    // Loading bar and prompt share a spot; only one is shown at a time
    this.loadGroup = this.add.container(0, 0);
    this.promptGroup = this.add.container(0, 0);
    this.root.add([this.loadGroup, this.promptGroup]);

    const barW = Math.min(150, Math.round(W * 0.5)), barH = 8;
    const bx = Math.round((W - barW) / 2), by = Math.round(H * 0.47);
    this.loadGroup.add(this.add.rectangle(bx - 2, by - 2, barW + 4, barH + 4, 0x1d2b57).setOrigin(0));
    this.loadGroup.add(this.add.rectangle(bx, by, barW, barH, 0xffffff).setOrigin(0));
    this.barFill = this.add.rectangle(bx, by, 0, barH, 0xffc400).setOrigin(0);
    this.barMax = barW;
    this.loadGroup.add(this.barFill);
    const ltxt = this.addTexture("title-loading", renderText("LOADING", { scale: 1, ...WHITE }));
    this.loadGroup.add(this.add.image(Math.round(W / 2), by - 10, ltxt).setOrigin(0.5));
    this.updateBar();

    const pscale = W >= 380 ? 2 : 1;
    const pk = this.addTexture("title-press", renderText("PRESS START", { scale: pscale, ...WHITE }));
    this.pressImg = this.add.image(Math.round(W / 2), Math.round(H * 0.47), pk).setOrigin(0.5);
    this.promptGroup.add(this.pressImg);
    const hk = this.addTexture("title-hint", renderText("ARROWS OR WASD TO WALK  -  F FOR FULL SCREEN", { scale: 1, ...WHITE }));
    const hintFits = measure("ARROWS OR WASD TO WALK  -  F FOR FULL SCREEN", 1).w + 6 <= W;
    if (hintFits) this.promptGroup.add(this.add.image(Math.round(W / 2), H - 12, hk).setOrigin(0.5));
    else {
      const hk2 = this.addTexture("title-hint2", renderText("ARROWS OR WASD TO WALK", { scale: 1, ...WHITE }));
      this.promptGroup.add(this.add.image(Math.round(W / 2), H - 12, hk2).setOrigin(0.5));
    }

    this.loadGroup.setVisible(!this.ready);
    this.promptGroup.setVisible(this.ready);
  }

  updateBar() {
    if (this.barFill) this.barFill.width = Math.round(this.barMax * this.progress);
  }

  showPrompt() {
    this.loadGroup.setVisible(false);
    this.promptGroup.setVisible(true);
  }

  update(time, delta) {
    const { width: W } = this.scale;
    const dt = delta / 1000;
    if (this.promptGroup?.visible) this.pressImg.setVisible(reducedMotion() || Math.floor(time / 550) % 2 === 0);
    if (reducedMotion() || !this.clouds) return;

    for (const c of this.clouds) {
      c.img.x += c.speed * dt;
      if (c.img.x - c.img.width / 2 > W) c.img.x = -c.img.width / 2;
    }
    for (const b of this.birds) {
      b.img.x -= b.speed * dt;
      b.img.y += Math.sin(time / 700 + b.phase) * 0.08;
      b.img.setTexture(this.birdKeys[Math.floor(time / 260 + b.phase) % 2]);
      if (b.img.x < -10) b.img.x = W + 10;
    }
    const f = this.butterfly;
    f.t += dt;
    f.img.x = W * 0.28 + Math.sin(f.t * 0.7) * W * 0.12;
    f.img.y = this.scale.height * 0.7 + Math.sin(f.t * 1.9) * 8;
    f.img.setTexture(this.flyKeys[Math.floor(time / 140) % 2]);
  }
}
