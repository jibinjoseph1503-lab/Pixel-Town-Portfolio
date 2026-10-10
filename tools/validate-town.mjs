// Sanity checks for the town layout: nothing overlaps a road, every door can be reached from the spawn,
// and nothing hangs off the map. Run: node tools/validate-town.mjs
import {
  COLS, ROWS, BUILDINGS, SPAWN, FOUNTAIN, PATHS, TREES, FENCES, BUSHES, ROCKS, buildMaps, frontTile,
} from "../src/config/town.js";

const problems = [];
const { blocked } = buildMaps();

// every tile that is road
const road = new Set();
for (const [x, y, w, h] of PATHS) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) road.add(`${i},${j}`);

const plaza = new Set();
{
  const [x, y, w, h] = PATHS[0];
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) plaza.add(`${i},${j}`);
}

// what sits on each tile, so overlaps can be named
const owner = new Map();
const claim = (x, y, what) => {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) { problems.push(`${what} is off the map at ${x},${y}`); return; }
  const k = `${x},${y}`;
  if (owner.has(k) && !(owner.get(k).startsWith("tree") && what.startsWith("tree"))) problems.push(`${what} overlaps ${owner.get(k)} at ${k}`);
  // The fountain, its fence and the rocks beside it belong on the plaza (the first PATHS entry).
  const onPlaza = what === "fountain" || what === "fence" || what === "rock" && plaza.has(k);
  if (road.has(k) && !(onPlaza && plaza.has(k))) problems.push(`${what} sits on a road at ${k}`);
  owner.set(k, what);
};
for (const b of BUILDINGS) {
  for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) claim(x, y, `building ${b.id}`);
  claim(...b.sign, `sign of ${b.id}`);
}
for (const [x, y, kind] of TREES) {
  for (const [dx, dy] of kind === "pine" ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]]) {
    if (x + dx < COLS && y + dy < ROWS) claim(x + dx, y + dy, `tree(${x},${y})`);
  }
}
for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) claim(FOUNTAIN.tx + dx, FOUNTAIN.ty + dy, "fountain");
for (const [x, y] of FENCES) claim(x, y, "fence");
for (const [x, y] of BUSHES) claim(x, y, "bush");
for (const [x, y] of ROCKS) claim(x, y, "rock");
if (blocked[SPAWN.ty][SPAWN.tx]) problems.push("spawn tile is blocked");

// reachability from the spawn
const seen = new Set([`${SPAWN.tx},${SPAWN.ty}`]);
const queue = [[SPAWN.tx, SPAWN.ty]];
while (queue.length) {
  const [x, y] = queue.shift();
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || blocked[ny][nx] || seen.has(k)) continue;
    seen.add(k); queue.push([nx, ny]);
  }
}
for (const b of BUILDINGS) {
  const f = frontTile(b);
  if (!seen.has(`${f.tx},${f.ty}`)) problems.push(`front tile of ${b.id} (${f.tx},${f.ty}) is unreachable`);
  if (!road.has(`${f.tx},${f.ty}`)) problems.push(`front tile of ${b.id} (${f.tx},${f.ty}) is not on a road`);
}

console.log(`${COLS}x${ROWS} world, ${seen.size} walkable tiles reachable from spawn`);
console.log(problems.length ? "PROBLEMS:\n- " + problems.join("\n- ") : "layout OK");
process.exit(problems.length ? 1 : 0);
