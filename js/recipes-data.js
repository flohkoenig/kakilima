/* =========================================================================
   Kaki Lima — recipe data helpers (shared)
   ========================================================================= */

const RECIPES_DIR = "recipes";

/* ---- front-matter parser (YAML subset) ---- */
function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, "");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text.trim() };

  const data = {};
  const lines = match[1].split("\n");
  let key = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(stripQuotes(listItem[1].trim()));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const val = kv[2].trim();
    data[key] = val === "" ? "" : coerce(val);
  }
  return { data, body: match[2].trim() };
}

function stripQuotes(s) { return s.replace(/^["']|["']$/g, ""); }

function coerce(val) {
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    return inner ? inner.split(",").map(s => stripQuotes(s.trim())).filter(Boolean) : [];
  }
  const unq = stripQuotes(val);
  if (unq === "true") return true;
  if (unq === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(unq)) return Number(unq);
  return unq;
}

/* ---- formatting ---- */
function fmtMinutes(min) {
  min = Number(min) || 0;
  if (!min) return "—";
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}
function totalTime(d) {
  const t = (Number(d.prep_time) || 0) + (Number(d.cook_time) || 0);
  return Number(d.total_time) || t;
}
function recipeImage(d) { return d.image || d.bild || ""; }

/* recipes without an own photo fall back to a deterministic placeholder
   from the Lorem Picsum API (stable per recipe via the slug seed). */
function placeholderPhoto(seed, w, h) {
  const s = encodeURIComponent("kakilima-" + String(seed || "rezept").toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}
function displayImage(d, w, h) {
  return recipeImage(d) || placeholderPhoto(d.slug || d.title, w || 800, h || 600);
}

/* ---- icons ---- */
const ICONS = {
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12V7.5"/><path d="M12 12l3.2 1.8"/></svg>`,
  fire:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5M21 20c0-2.3-1.3-4-3.3-4.6"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17.5a7 7 0 0 1 14 0"/><path d="M12 17.5l3.4-4"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  utensils: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M7 13v8"/><path d="M17 3c-1.7 0-3 1.8-3 4s1.3 4 3 4v10"/></svg>`,
  grid:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  list:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>`,
  pdf:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
};
/* placeholder sits behind the image; on load error the <img> just removes
   itself (no HTML inside the onerror attribute → no escaping pitfalls). */
function thumbMedia(img, alt) {
  const ph = `<div class="ph">${ICONS.utensils}</div>`;
  return img
    ? `${ph}<img src="${escapeHtml(img)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.remove()">`
    : ph;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- recipe card ---- */
function recipeCard(r) {
  const cat = r.category ? `<span class="cat">${escapeHtml(r.category)}</span>` : "";
  const tt = totalTime(r);

  return `
  <article class="recipe-card">
    <a href="rezept.html?slug=${encodeURIComponent(r.slug)}">
      <div class="thumb">${thumbMedia(displayImage(r, 800, 600), r.title)}${cat}</div>
      <div class="body">
        <h3>${escapeHtml(r.title)}</h3>
        <p>${escapeHtml(r.description || "")}</p>
        <div class="meta">
          ${tt ? `<span>${ICONS.clock}${fmtMinutes(tt)}</span>` : ""}
          ${r.difficulty ? `<span>${ICONS.gauge}${escapeHtml(r.difficulty)}</span>` : ""}
        </div>
      </div>
    </a>
  </article>`;
}

/* ---- recipe row (list view) ---- */
function recipeRow(r) {
  const tt = totalTime(r);
  return `
  <article class="recipe-row">
    <a href="rezept.html?slug=${encodeURIComponent(r.slug)}">
      <div class="thumb">${thumbMedia(displayImage(r, 480, 360), r.title)}</div>
      <div class="body">
        <div class="top">
          <h3>${escapeHtml(r.title)}</h3>
          ${r.category ? `<span class="cat">${escapeHtml(r.category)}</span>` : ""}
        </div>
        <p>${escapeHtml(r.description || "")}</p>
        <div class="meta">
          ${tt ? `<span>${ICONS.clock}${fmtMinutes(tt)}</span>` : ""}
          ${r.servings ? `<span>${ICONS.users}${escapeHtml(String(r.servings))} Port.</span>` : ""}
          ${r.difficulty ? `<span>${ICONS.gauge}${escapeHtml(r.difficulty)}</span>` : ""}
        </div>
      </div>
    </a>
  </article>`;
}

/* ---- manifest ---- */
async function loadIndex() {
  const res = await fetch(`${RECIPES_DIR}/index.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`index.json nicht gefunden (HTTP ${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.recipes || []);
}
