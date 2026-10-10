# PRD — Pixel Town Portfolio (MVP)

**Owner:** Jibin (UX Designer)
**Builder:** Claude Code
**Status:** Ready to build
**Target effort:** 1–2 days

---

## 1. Overview

A personal portfolio website where the hero section is an explorable, top-down pixel-art town in the style of GBA-era RPGs (Pokémon LeafGreen / FireRed feel). Visitors control a small character with the keyboard or mouse and walk into buildings. Each building is a section of the portfolio.

The goal is a memorable, playful first impression that still lets a busy recruiter reach the work in a few seconds.

**Visual reference:** `assets/reference/reference.png` is a screenshot that shows the target layout, colour mood and level of polish. **It is a reference only.** Do not crop, trace or reuse anything from it. All art must come from the licensed asset packs in `assets/` (see §5).

---

## 2. Goals and non-goals

### Goals (MVP)
- A single-screen pixel town that visually matches the reference: soft mint grass, crisp 16×16 tiles, warm roofs, trees, fences, a central fountain.
- A walking character controlled by **keyboard** and **mouse/touch**.
- **4 buildings**, each opening one portfolio section.
- Content is editable without touching game code.
- Fast, accessible and usable on mobile, with an escape hatch for anyone who doesn't want to play.

### Non-goals (not in MVP)
- Walkable building interiors
- NPC conversations beyond one hint NPC
- Sound and music
- A scrolling or multi-screen map
- A CMS or backend
- Save state or progress tracking

---

## 3. Users and key stories

| User | Story |
|---|---|
| Recruiter / hiring manager | "I want to see Jibin's work in under 10 seconds." → click the Work building, or use "Skip to classic view". |
| Curious visitor | "I want to explore." → walk around with arrow keys and enter buildings. |
| Mouse-only user | "I don't want to use the keyboard." → click a building; the character walks there and enters. |
| Mobile user | "I'm on my phone." → tap a building or tap the ground to walk. |
| Keyboard / screen-reader user | "I need an accessible path." → Tab through buildings and press Enter, or use the classic view. |

---

## 4. Tech stack

- **Vite** (vanilla JS or TypeScript, your choice; keep it simple)
- **Phaser 3** for rendering, sprites, animation, collision and input
- **Tiled** map format (`.tmj` / JSON) for the town layout
- **EasyStar.js** for grid pathfinding (click-to-walk)
- **Plain HTML/CSS** for overlays and the classic view. No portfolio text is rendered inside the canvas.
- **Deploy:** Vercel (static build)

---

## 5. Assets

Assets are placed manually by the owner in `assets/` before or during the build.

| Asset | Source | Notes |
|---|---|---|
| Town tileset (16×16) | Licensed itch.io pack in a GBA/Gen-3 style | Slice at 16×16. Check the pack's license file. |
| Character walk sheet | Free/licensed pack (for example Ninja Adventure, CC0) | Needs 4 directions × walk frames. |
| Pixel font | Google Fonts: *Pixelify Sans* or *Press Start 2P* | For labels and overlays. |
| Reference screenshot | `assets/reference/reference.png` | Layout and colour mood only. Never used in the build. |

**Until real assets are added, use simple placeholder tiles and sprites** (coloured rectangles or code-drawn tiles) so development is not blocked. Asset paths live in one config file so the art can be swapped without code changes.

**Hard rule:** no Pokémon or other third-party IP anywhere. That means no Poké Center, no Poké Ball logos, no trainer sprites and no game names in signage.

---

## 6. Visual direction

Match the reference's *feel*:

- **Palette** (approximate; sample exact values from the chosen tileset):
  - Grass: soft mint green, around `#8FD6A9`
  - Paths: lighter mint or cream, around `#C6EBC9`
  - Roofs: warm red-orange, around `#E0604A`
  - Trees: mid and deep greens
  - Fountain and water: slate blue, around `#4C7FC4`
  - Wood and fences: warm brown, around `#8A5A3C`
  - UI panel: off-white `#F8F8F0` with a dark outline `#2E3440`
- **Rendering:**
  - Native game resolution about **480×270** or **400×240** (16×16 tiles), scaled up by an integer factor to fit the viewport.
  - `pixelArt: true` in Phaser and `image-rendering: pixelated` in CSS. No blurry scaling or sub-pixel positions.
  - Letterbox with a background colour that matches the grass, so it looks intentional at any aspect ratio.
- **Layout** (loosely following the reference):
  - A central plaza with a fountain, which is where the player spawns.
  - Four buildings around the plaza, connected by paths.
  - Tree clusters on the edges acting as natural walls.
  - Fences and bushes framing the paths.
  - Signposts in front of each building.

---

## 7. Buildings and sections

| ID | Building | Section | Content |
|---|---|---|---|
| `work` | Studio / office building | **Work** | Case studies: title, one-line summary, thumbnail, role, link |
| `projects` | Gallery / workshop | **Visual Design and Other Projects** | Grid of visual work and side projects |
| `about` | House | **About Me** | Short bio, photo or avatar, skills, CV link |
| `contact` | Post office | **Contact** | Email, LinkedIn, Behance/Dribbble, optional simple form (mailto) |

Each building has:
- A **door zone**, a trigger rectangle in front of the door.
- A **click zone**, the building's bounding area for mouse and touch.
- A **pixel label** shown on hover or proximity, such as "WORK".
- A **signpost** in front with the section name.

---

## 8. Interaction spec

### 8.1 Keyboard movement
- Arrow keys and WASD move the character on the tile grid. Movement can be smooth or snapped to the grid; pick whichever looks closer to GBA games.
- 4-direction walking animation; an idle frame faces the last direction.
- Collision with trees, fences, buildings, the fountain and rocks.
- **Entering:** walking into a door zone, or pressing Enter/Space while facing a door, triggers the enter sequence (§8.4).

### 8.2 Mouse and touch
- **Hover over a building:** soft highlight or outline, pointer cursor, pixel label appears above the roof.
- **Click or tap a building:** the character pathfinds to that building's door (EasyStar.js on the collision grid), then the enter sequence plays.
  - The auto-walk lasts about **1.5 seconds at most**. If the path is longer, increase walk speed so it still fits.
  - Clicking or tapping again during the walk, or pressing Esc, skips straight to entering.
- **Click or tap on open ground:** the character walks to that tile, if it's walkable.
- **Any keyboard input cancels an auto-walk** immediately and hands control back.

### 8.3 Accessibility input
- Visually hidden HTML `<button>`s, one per building, in a logical order. They are focusable with **Tab**; **Enter** opens the section.
- When a button has focus, highlight the matching building on the map.
- Respect `prefers-reduced-motion`: replace the walk and fade with an instant open.

### 8.4 Enter sequence
1. The character steps into the door (a short animation, or just a stop).
2. The screen fades to a near-black tint (about 250 ms).
3. The **section overlay** opens (§9).
4. **Closing** (Esc, the close button or a backdrop click) fades back, and the character stands one tile in front of that door, facing down.

### 8.5 Hint and onboarding
- One **hint NPC** by the fountain and a small persistent hint in a corner:
  - Desktop: "Use arrow keys or click a building"
  - Touch: "Tap a building to enter"
- Walking next to the NPC shows a GBA-style dialogue box with the same hint. Dismiss with any key or a tap.

### 8.6 Skip / classic view
- A clear link in a corner: **"Skip to classic view →"**
- It opens a normal, scrollable single-page portfolio with the same content: Work, Projects, About, Contact. It uses the same pixel font and palette but has standard web layout.
- The classic view can also be reached directly at `/#classic`, or a `/classic` route.

---

## 9. Overlay (section panel) design

- A GBA menu-style panel: off-white background, 3–4 px dark pixel border, slight rounded corners, pixel font for headings, and a readable sans-serif for body text (body text must stay legible).
- **Desktop:** centered, max about 900 px wide, scrollable inside.
- **Mobile:** full-screen sheet.
- A header with the section title and a close (✕) button.
- Focus moves into the panel when it opens and returns to the map, or the hidden button, when it closes. Esc closes it.
- Content is rendered from data (§10), not hard-coded.
- Work items can open an external case-study link in a new tab. In-panel case-study detail pages are optional for the MVP.

---

## 10. Content model

All content lives in `src/content/*.json` (or Markdown), so the owner can edit it without touching game code.

```json
// src/content/work.json
[
  {
    "title": "Project name",
    "summary": "One-line description",
    "role": "UX / UI Design",
    "year": "2026",
    "thumbnail": "/content/work/project-1.png",
    "link": "https://..."
  }
]
```

- `projects.json`: same shape as work.
- `about.json`: name, bio paragraphs, photo, skills[], cvLink.
- `contact.json`: email, socials[] (label and URL).

Fill these with clearly marked placeholder content to begin with.

---

## 11. Suggested project structure

```
/
├─ index.html
├─ PRD.md
├─ assets/
│  ├─ reference/reference.png     # reference only, never imported
│  ├─ tiles/                       # tileset PNG(s)
│  ├─ sprites/                     # character sheet(s)
│  └─ maps/town.tmj                # Tiled export
├─ public/content/                 # images for portfolio content
├─ src/
│  ├─ main.js                      # Phaser config, boot
│  ├─ config/assets.js             # all asset paths + tile size in one place
│  ├─ scenes/
│  │  ├─ BootScene.js              # preload
│  │  └─ TownScene.js              # map, player, buildings, input
│  ├─ systems/
│  │  ├─ Player.js                 # movement + animation
│  │  ├─ Pathfinding.js            # EasyStar wrapper
│  │  └─ Buildings.js              # door/click zones, hover, labels
│  ├─ ui/
│  │  ├─ Overlay.js                # section panel (HTML)
│  │  ├─ Hint.js                   # hint + NPC dialogue
│  │  ├─ A11yNav.js                # hidden building buttons
│  │  └─ ClassicView.js            # skip/classic page
│  ├─ content/                     # work/projects/about/contact JSON
│  └─ styles.css
└─ vite.config.js
```

If the owner doesn't make a Tiled map, build the map in code from a simple tile grid array instead, with the same layout described in §6.

---

## 12. Performance and quality

- First load under about **1.5 MB** (excluding portfolio images, which lazy-load in overlays).
- A pixel-styled loading indicator while assets preload.
- 60 fps on a mid-range laptop and a recent phone.
- No layout shift; the canvas is sized before render.
- SEO: real `<title>`, meta description and Open Graph image. Classic-view content is in the HTML so it can be indexed.
- Works in the latest Chrome, Safari, Firefox and Edge.

---

## 13. Acceptance criteria

- [ ] The town renders crisp, unblurred pixel art and fills the viewport at any size.
- [ ] Arrow keys and WASD move the character with 4-direction animation; collisions work.
- [ ] Walking into any door opens the correct section overlay with a fade.
- [ ] Hovering a building shows a highlight, a pointer cursor and a label.
- [ ] Clicking a building auto-walks to its door within about 1.5 s, then enters.
- [ ] Clicking the ground walks to that tile; keyboard input cancels an auto-walk.
- [ ] Tapping works the same on mobile.
- [ ] Tab/Enter can open every section; focus is managed correctly in overlays.
- [ ] `prefers-reduced-motion` gives instant transitions.
- [ ] The "Skip to classic view" link shows all content as a normal page.
- [ ] All content comes from the JSON files.
- [ ] No Pokémon or third-party IP is present.
- [ ] Deployed to Vercel and loads in under 3 s on a typical connection.

---

## 14. Build order

1. **Scaffold:** Vite + Phaser, pixel-perfect scaling, placeholder tiles, a boot/preload scene.
2. **Map:** placeholder town grid (or load `town.tmj`), collision layer, 4 buildings with door zones.
3. **Player:** keyboard movement, 4-direction animation, collision.
4. **Entering:** door triggers, fade, HTML overlay rendered from JSON content.
5. **Mouse/touch:** hover states, click-to-enter with pathfinding, click-to-walk, input arbitration.
6. **Accessibility:** hidden building buttons, focus management, reduced motion.
7. **Hint NPC and dialogue box.**
8. **Classic view** and the skip link.
9. **Swap in real assets** via `config/assets.js` and tune the palette of the UI to match.
10. **Polish, SEO, deploy** to Vercel.

After step 4, stop and show a playable build before continuing.

---

## 15. Open questions for the owner

- Final asset packs (tileset and character)? Placeholders are used until then.
- Real content for the four sections? Placeholder JSON is used until then.
- A custom domain for deployment?
- Is a contact form needed, or are mailto and social links enough?
