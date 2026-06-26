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

/* ---- icons ---- */
const ICONS = {
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  fire:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3 .3 1 1 1.5 1.5 1.5C10 7 11 5 12 3z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5M21 20c0-2.3-1.3-4-3.3-4.6"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13l4-3"/><path d="M4 18a8 8 0 1 1 16 0"/><circle cx="12" cy="13" r="1"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  utensils: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M7 13v8"/><path d="M17 3c-1.7 0-3 1.8-3 4s1.3 4 3 4v10"/></svg>`,
  grid:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  list:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>`,
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
      <div class="thumb">${thumbMedia(recipeImage(r), r.title)}${cat}</div>
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
      <div class="thumb">${thumbMedia(recipeImage(r), r.title)}</div>
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
