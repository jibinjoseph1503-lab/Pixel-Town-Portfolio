// A 5x7 pixel font drawn pixel by pixel, so title text stays perfectly crisp at any whole-number scale.
// Each glyph is 7 rows of 5 characters; "1" is a lit pixel.
const G = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11110 10001 10001 10001 10001 10001 11110",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01110",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "01110 00100 00100 00100 00100 00100 01110",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 11001 10101 10011 10001 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 11011 10001",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  0: "01110 10001 10011 10101 11001 10001 01110",
  1: "00100 01100 00100 00100 00100 00100 01110",
  2: "01110 10001 00001 00010 00100 01000 11111",
  3: "11110 00001 00001 01110 00001 00001 11110",
  4: "00010 00110 01010 10010 11111 00010 00010",
  5: "11111 10000 11110 00001 00001 10001 01110",
  6: "00110 01000 10000 11110 10001 10001 01110",
  7: "11111 00001 00010 00100 01000 01000 01000",
  8: "01110 10001 10001 01110 10001 10001 01110",
  9: "01110 10001 10001 01111 00001 00010 01100",
  " ": "00000 00000 00000 00000 00000 00000 00000",
  ".": "00000 00000 00000 00000 00000 01100 01100",
  ",": "00000 00000 00000 00000 00110 00100 01000",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  "!": "00100 00100 00100 00100 00100 00000 00100",
  "?": "01110 10001 00001 00110 00100 00000 00100",
  ":": "00000 01100 01100 00000 01100 01100 00000",
  "/": "00001 00001 00010 00100 01000 10000 10000",
  "'": "00100 00100 01000 00000 00000 00000 00000",
  "&": "01100 10010 10100 01000 10101 10010 01101",
};
const GLYPHS = Object.fromEntries(Object.entries(G).map(([k, v]) => [k, v.split(" ")]));

// Regular text is 5 pixels wide plus a 1 pixel gap. Bold text doubles up each pixel sideways (6 wide).
const advance = (bold) => (bold ? 7 : 6);

export function measure(text, scale = 1, bold = false) {
  return { w: (text.length * advance(bold) - 1) * scale, h: 7 * scale };
}

// Draws `text` into a new canvas. `outline` is a list of { color, size } rings from the inside out
// (size in font pixels). `shadow` drops a solid copy underneath. `fill` can be one colour or two
// ([top, bottom]) for a simple two-tone gradient.
export function renderText(text, { scale = 1, fill = "#ffffff", outline = [], shadow = null, bold = false } = {}) {
  const pad = (outline.reduce((m, o) => Math.max(m, o.size), 0) + (shadow ? shadow.dy : 0) + 1) * scale;
  const { w, h } = measure(text, scale, bold);
  const canvas = document.createElement("canvas");
  canvas.width = w + pad * 2;
  canvas.height = h + pad * 2;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Lit pixels of the text, in font units
  const lit = [];
  [...text.toUpperCase()].forEach((ch, i) => {
    const rows = GLYPHS[ch] || GLYPHS["?"];
    rows.forEach((row, y) => [...row].forEach((v, x) => {
      if (v !== "1") return;
      lit.push([i * advance(bold) + x, y]);
      if (bold) lit.push([i * advance(bold) + x + 1, y]); // double up sideways for a heavier stroke
    }));
  });

  const stamp = (color, dx, dy, grow = 0) => {
    ctx.fillStyle = color;
    for (const [x, y] of lit) ctx.fillRect(pad + (x + dx - grow) * scale, pad + (y + dy - grow) * scale, (1 + grow * 2) * scale, (1 + grow * 2) * scale);
  };
  const ring = (color, size, dx = 0, dy = 0) => {
    for (let oy = -size; oy <= size; oy++) for (let ox = -size; ox <= size; ox++) {
      if (ox * ox + oy * oy <= size * size + size) stamp(color, ox + dx, oy + dy);
    }
  };

  const outer = outline.length ? outline[outline.length - 1].size : 0;
  if (shadow) ring(shadow.color, outer, 0, shadow.dy);
  [...outline].reverse().forEach((o) => ring(o.color, o.size));

  const colors = Array.isArray(fill) ? fill : [fill, fill];
  lit.forEach(([x, y]) => {
    ctx.fillStyle = y < 3 ? colors[0] : colors[1];
    ctx.fillRect(pad + x * scale, pad + y * scale, scale, scale);
  });
  return canvas;
}
