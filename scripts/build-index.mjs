#!/usr/bin/env node
/* =========================================================================
   Kaki Lima — recipe index builder
   Scans recipes/*.md, reads the front matter of each file and writes
   recipes/index.json (the manifest the website reads).

   Run locally:   node scripts/build-index.mjs
   In CI:         see .github/workflows/build-recipe-index.yml
   ========================================================================= */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RECIPES_DIR = join(ROOT, "recipes");
const OUT = join(RECIPES_DIR, "index.json");

// Files that are docs, not recipes — never indexed.
const IGNORE = new Set(["index.json", "README.md", "LEITFAEDEN.md", "VORLAGE.md"]);

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "");
}

function coerce(val) {
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(s => stripQuotes(s.trim())).filter(Boolean);
  }
  const unq = stripQuotes(val);
  if (unq === "true") return true;
  if (unq === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(unq)) return Number(unq);
  return unq;
}

/* Same front-matter logic as js/recipes-data.js, kept in sync. */
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

function firstParagraph(body) {
  const m = body.replace(/^#.*$/gm, "").trim().match(/^(?!#)(.+?)(\n\s*\n|$)/s);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

async function build() {
  let files;
  try {
    files = await readdir(RECIPES_DIR);
  } catch {
    console.error(`✗ Ordner nicht gefunden: ${RECIPES_DIR}`);
    process.exit(1);
  }

  const mdFiles = files
    .filter(f => f.toLowerCase().endsWith(".md"))
    .filter(f => !IGNORE.has(f));

  const recipes = [];
  for (const file of mdFiles.sort()) {
    const raw = await readFile(join(RECIPES_DIR, file), "utf8");
    const { data, body } = parseFrontMatter(raw);
    const slug = basename(file, ".md");

    if (!data.title) {
      console.warn(`⚠  ${file}: kein "title" im Front Matter — wird übersprungen.`);
      continue;
    }

    const prep = Number(data.prep_time) || 0;
    const cook = Number(data.cook_time) || 0;

    recipes.push({
      slug,
      title: data.title,
      description: data.description || firstParagraph(body),
      category: data.category || "",
      cuisine: data.cuisine || "",
      image: data.image || data.bild || "",
      prep_time: prep,
      cook_time: cook,
      total_time: Number(data.total_time) || (prep + cook) || 0,
      servings: data.servings ?? "",
      difficulty: data.difficulty || "",
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      author: data.author || "",
      date: data.date ? String(data.date) : "",
      featured: data.featured === true,
    });
  }

  // newest first
  recipes.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  await writeFile(OUT, JSON.stringify(recipes, null, 2) + "\n", "utf8");
  console.log(`✓ ${recipes.length} Rezept(e) → ${OUT.replace(ROOT + "/", "")}`);
}

build().catch(err => {
  console.error("✗ Build fehlgeschlagen:", err);
  process.exit(1);
});
