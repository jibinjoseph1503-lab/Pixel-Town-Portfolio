import work from "../content/work.json";
import projects from "../content/projects.json";
import about from "../content/about.json";
import contact from "../content/contact.json";

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TITLES = {
  work: "Work",
  projects: "Visual Design & Other Projects",
  about: "About Me",
  contact: "Contact",
};

// Small helper: build DOM nodes without ever using innerHTML on content.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

function link(label, href, cls = "px-link") {
  const a = el("a", { class: cls, href, text: label });
  if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  return a;
}

function cards(items) {
  const grid = el("div", { class: "cards" });
  for (const item of items) {
    const thumb = item.thumbnail
      ? el("img", { class: "card-thumb", src: item.thumbnail, alt: "", loading: "lazy" })
      : el("div", { class: "card-thumb card-thumb--empty", "aria-hidden": "true", text: "IMAGE" });
    const meta = [item.role, item.year].filter(Boolean).join(" · ");
    grid.append(el("article", { class: "card" },
      thumb,
      el("h3", { class: "card-title", text: item.title }),
      el("p", { class: "card-meta", text: meta }),
      el("p", { class: "card-text", text: item.summary }),
      item.link ? link("View ↗", item.link) : null));
  }
  return grid;
}

function aboutView(a) {
  const photo = a.photo
    ? el("img", { class: "about-photo", src: a.photo, alt: `Portrait of ${a.name}` })
    : el("div", { class: "about-photo about-photo--empty", "aria-hidden": "true", text: "PHOTO" });
  const skills = el("ul", { class: "chips" }, ...a.skills.map((s) => el("li", { text: s })));
  return el("div", { class: "about" },
    photo,
    el("div", { class: "about-body" },
      el("h3", { class: "card-title", text: `${a.name} — ${a.role}` }),
      ...a.bio.map((p) => el("p", { class: "card-text", text: p })),
      el("h4", { class: "mini-heading", text: "Skills" }),
      skills,
      a.cvLink ? link("Download CV ↗", a.cvLink) : null));
}

function contactView(c) {
  const list = el("ul", { class: "links" },
    el("li", {}, link(c.email, `mailto:${c.email}`)),
    ...c.socials.map((s) => el("li", {}, link(s.label + " ↗", s.url))));
  return el("div", { class: "contact" },
    el("p", { class: "card-text", text: "Say hello — I'd love to hear from you." }), list);
}

const VIEWS = {
  work: () => cards(work),
  projects: () => cards(projects),
  about: () => aboutView(about),
  contact: () => contactView(contact),
};

// Render a section's content into any container (used by the overlay now, and the classic view later).
export function renderSection(id) { return VIEWS[id](); }
export function sectionTitle(id) { return TITLES[id]; }

// ---- Black fade used when entering / leaving a building ----
const fadeEl = document.createElement("div");
fadeEl.id = "fade";
document.body.append(fadeEl);

export function fadeTo(opacity, ms = 250) {
  if (reducedMotion()) ms = 0;
  fadeEl.style.transition = `opacity ${ms}ms linear`;
  fadeEl.style.opacity = String(opacity);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- The section panel ----
let root, panel, titleEl, bodyEl, closeBtn, onClose = null, opener = null;

function build() {
  titleEl = el("h2", { class: "panel-title", id: "panel-title" });
  closeBtn = el("button", { class: "panel-close", type: "button", "aria-label": "Close" , text: "✕" });
  bodyEl = el("div", { class: "panel-body" });
  panel = el("div", { class: "panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "panel-title", tabindex: "-1" },
    el("header", { class: "panel-head" }, titleEl, closeBtn), bodyEl);
  root = el("div", { class: "overlay", hidden: "" }, panel);
  document.body.append(root);

  closeBtn.addEventListener("click", () => closeOverlay());
  root.addEventListener("mousedown", (e) => { if (e.target === root) closeOverlay(); });
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); closeOverlay(); }
    if (e.key === "Tab") trapFocus(e);
  });
}

function trapFocus(e) {
  const f = [...panel.querySelectorAll("a[href], button")].filter((n) => !n.hasAttribute("disabled"));
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function isOpen() { return root && !root.hidden; }

export function openOverlay(id, closeCb) {
  if (!root) build();
  onClose = closeCb;
  opener = document.activeElement;
  titleEl.textContent = TITLES[id];
  bodyEl.replaceChildren(renderSection(id));
  bodyEl.scrollTop = 0;
  root.hidden = false;
  panel.focus();
}

export function closeOverlay() {
  if (!isOpen()) return;
  root.hidden = true;
  const cb = onClose;
  onClose = null;
  if (opener && opener.focus) opener.focus();
  if (cb) cb();
}
