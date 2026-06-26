/* =========================================================================
   Kaki Lima — recipe data helpers
   Shared between the listing page and the single-recipe page.
   ========================================================================= */

const RECIPES_DIR = "recipes";

/* ---- tiny YAML front-matter parser (subset: strings, numbers, bools,
   inline [a, b] arrays and "- " block lists). Good enough for recipes. ---- */
function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, "");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text.trim() };

  const data = {};
  const lines = match[1].split("\n");
  let key = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // block-list item belonging to the previous key
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(stripQuotes(listItem[1].trim()));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    let val = kv[2].trim();

    if (val === "") { data[key] = ""; continue; } // maybe a block list follows
    data[key] = coerce(val);
  }
  return { data, body: match[2].trim() };
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "");
}

function coerce(val) {
  // inline array
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(s => stripQuotes(s.trim())).filter(Boolean);
  }
  const unq = stripQuotes(val);
  if (unq === "true")  return true;
  if (unq === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(unq)) return Number(unq);
  return unq;
}

/* ---- formatting helpers ---- */
function fmtMinutes(min) {
  min = Number(min) || 0;
  if (!min) return "—";
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} Std ${m} Min` : `${h} Std`;
}

function totalTime(d) {
  const t = (Number(d.prep_time) || 0) + (Number(d.cook_time) || 0);
  return d.total_time ? Number(d.total_time) : t;
}

function recipeImage(d) {
  return d.image || d.bild || "";
}

/* ---- inline SVG icons ---- */
const ICONS = {
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  fire:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1-3 .3 1 1 1.5 1.5 1.5C10 7 11 5 12 3z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5M21 20c0-2.3-1.3-4-3.3-4.6"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13l4-3"/><path d="M4 18a8 8 0 1 1 16 0"/><circle cx="12" cy="13" r="1"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  bowl:  `<svg viewBox="0 0 64 64" fill="none"><path d="M8 28h48c0 13-10 22-24 22S8 41 8 28z" fill="#c1432b"/><path d="M8 28h48a4 4 0 0 0-4-4H12a4 4 0 0 0-4 4z" fill="#e2a32d"/><path d="M22 18c2-3 6-3 8 0M34 14c2-3 6-3 8 0M28 20c2-3 6-3 8 0" stroke="#6b3f2a" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="34" r="2" fill="#2f6b52"/><circle cx="40" cy="36" r="2" fill="#fbf3e8"/></svg>`,
};

function placeholderThumb() {
  return `<div class="ph">${ICONS.bowl}</div>`;
}

/* ---- a single recipe card (used on listing + related sections) ---- */
function recipeCard(r) {
  const img = recipeImage(r);
  const media = img
    ? `<img src="${img}" alt="${escapeHtml(r.title)}" loading="lazy" onerror="this.parentElement.innerHTML='${placeholderThumb().replace(/'/g, "&#39;")}'">`
    : placeholderThumb();
  const cat = r.category ? `<span class="cat-pill">${escapeHtml(r.category)}</span>` : "";
  const tt = totalTime(r);

  return `
  <article class="card recipe-card reveal">
    <a href="rezept.html?slug=${encodeURIComponent(r.slug)}">
      <div class="thumb">${media}${cat}</div>
      <div class="body">
        <h3>${escapeHtml(r.title)}</h3>
        <p>${escapeHtml(r.description || "")}</p>
        <div class="recipe-meta">
          ${tt ? `<span>${ICONS.clock}${fmtMinutes(tt)}</span>` : ""}
          ${r.servings ? `<span>${ICONS.users}${escapeHtml(String(r.servings))} Port.</span>` : ""}
          ${r.difficulty ? `<span>${ICONS.gauge}${escapeHtml(r.difficulty)}</span>` : ""}
        </div>
      </div>
    </a>
  </article>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- load the generated manifest ---- */
async function loadIndex() {
  const res = await fetch(`${RECIPES_DIR}/index.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`index.json nicht gefunden (HTTP ${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.recipes || []);
}
