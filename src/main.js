import Phaser from "phaser";
import "./styles.css";
import { GAME_W, GAME_H, PALETTE } from "./config/assets.js";
import BootScene from "./scenes/BootScene.js";
import TownScene from "./scenes/TownScene.js";
import ArtPreview from "./scenes/ArtPreview.js";

// ?art shows every sprite enlarged (handy while tweaking the art).
const artMode = new URLSearchParams(location.search).has("art");

// The game fills the whole window. Pixels are scaled by a whole number so they stay crisp, and the
// view gets as many tiles as fit: a bigger window shows more of the world, like a wider handheld screen.
const zoomFor = () => {
  const fit = Math.floor(Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H));
  const minZoom = window.innerWidth < 700 ? 2 : 1; // phones: keep the pixels a readable size
  return Math.max(fit, minZoom);
};
const sizeFor = (zoom) => ({
  width: artMode ? 400 : Math.ceil(window.innerWidth / zoom),
  height: artMode ? 400 : Math.ceil(window.innerHeight / zoom),
});

const zoom = zoomFor();
const size = sizeFor(zoom);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  ...size,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: PALETTE.grass,
  scale: { mode: Phaser.Scale.NONE, zoom },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: artMode ? [ArtPreview] : [BootScene, TownScene],
});

if (!artMode) {
  window.addEventListener("resize", () => {
    const z = zoomFor();
    const s = sizeFor(z);
    game.scale.setZoom(z);
    game.scale.resize(s.width, s.height);
  });
}

// Press F to toggle full screen (the whole page, so the section panels still show).
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "f" || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|textarea|select)$/i.test(document.activeElement?.tagName)) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
});
