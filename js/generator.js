/* =========================================================================
   Kaki Lima — recipe markdown generator
   Turns the form into a ready-to-commit Markdown file (front matter + body).
   ========================================================================= */
(function () {
  const form = document.getElementById("genForm");
  const out = document.getElementById("genOut");
  const fileNameEl = document.getElementById("fileName");
  if (!form || !out) return;

  const $ = id => document.getElementById(id);
  const relSel = new Set();   // chosen related-recipe slugs

  /* slugify: lowercase, umlauts spelled out, only a–z 0–9 and dashes */
  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* quote a YAML scalar only when needed (colon, #, leading special char …) */
  function yamlValue(v) {
    const s = String(v);
    if (s === "") return '""';
    if (/[:#\[\]{}",&*!|>%@`]/.test(s) || /^[\s'-]/.test(s) || /\s$/.test(s)) {
      return `"${s.replace(/"/g, '\\"')}"`;
    }
    return s;
  }

  function splitLines(v) {
    return String(v || "")
      .split("\n")
      .map(l => l.trim().replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "")) // tolerate pasted bullets / numbering
      .filter(Boolean);
  }

  function build() {
    const title = $("f-title").value.trim();
    const slug = slugify(title) || "rezept";
    fileNameEl.textContent = `${slug}.md`;

    /* ---- front matter ---- */
    const fm = [];
    const push = (k, v) => fm.push(`${k}: ${v}`);
    if (title) push("title", yamlValue(title));
    const desc = $("f-description").value.trim();
    if (desc) push("description", yamlValue(desc));
    const cat = $("f-category").value.trim();
    if (cat) push("category", yamlValue(cat));
    const cuisine = $("f-cuisine").value.trim();
    if (cuisine) push("cuisine", yamlValue(cuisine));
    const image = $("f-image").value.trim();
    if (image) push("image", yamlValue(image));
    const gallery = splitLines($("f-gallery").value);
    if (gallery.length) push("gallery", `[${gallery.join(", ")}]`);
    const prep = $("f-prep").value.trim();
    if (prep !== "") push("prep_time", Number(prep));
    const cook = $("f-cook").value.trim();
    if (cook !== "") push("cook_time", Number(cook));
    const servings = $("f-servings").value.trim();
    if (servings !== "") push("servings", Number(servings));
    const diff = $("f-difficulty").value.trim();
    if (diff) push("difficulty", yamlValue(diff));
    const tags = $("f-tags").value.split(",").map(t => t.trim()).filter(Boolean);
    if (tags.length) push("tags", `[${tags.join(", ")}]`);
    const author = $("f-author").value.trim();
    if (author) push("author", yamlValue(author));
    const date = $("f-date").value.trim();
    if (date) push("date", date);
    if (relSel.size) push("related", `[${[...relSel].join(", ")}]`);
    if ($("f-featured").checked) push("featured", "true");

    /* ---- body ---- */
    const body = [];
    const intro = $("f-intro").value.trim();
    if (intro) body.push(intro);

    const isHeading = l => /^#{1,6}\s/.test(l);

    const ingredients = splitLines($("f-ingredients").value);
    if (ingredients.length) {
      const md = ingredients.map(l => isHeading(l) ? `\n${l}\n` : `- ${l}`).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      body.push("## Zutaten\n\n" + md);
    }

    const steps = splitLines($("f-steps").value);
    if (steps.length) {
      let i = 0;
      const md = steps.map(l => isHeading(l) ? `\n${l}\n` : `${++i}. ${l}`).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      body.push("## Zubereitung\n\n" + md);
    }

    const tips = splitLines($("f-tips").value);
    if (tips.length) {
      body.push("## Tipps\n\n" + tips.map(l => `> ${l}`).join("\n>\n"));
    }

    const extra = $("f-extra").value.trim();
    if (extra) body.push(extra);

    const md = `---\n${fm.join("\n")}\n---\n\n${body.join("\n\n")}\n`;
    out.textContent = md;
    return { md, slug };
  }

  function toast(msg) {
    let t = document.getElementById("klToast");
    if (!t) { t = document.createElement("div"); t.id = "klToast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  form.addEventListener("input", build);

  $("btnCopy").addEventListener("click", async () => {
    const { md } = build();
    try { await navigator.clipboard.writeText(md); toast("Markdown kopiert"); }
    catch { out.focus(); toast("Kopieren nicht möglich – bitte manuell markieren"); }
  });

  $("btnDownload").addEventListener("click", () => {
    const { md, slug } = build();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${slug}.md`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* related-recipe picker: list already-published recipes as clickable text */
  async function loadRelPicker() {
    const host = $("relPicker");
    if (!host || typeof loadIndex !== "function") return;
    let all = [];
    try { all = await loadIndex(); } catch (_) {}
    if (!all.length) { host.innerHTML = `<span class="muted">Noch keine veröffentlichten Rezepte gefunden.</span>`; return; }
    all.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    host.innerHTML = all.map(r =>
      `<button type="button" class="rel-chip" data-slug="${escapeHtml(r.slug)}">${escapeHtml(r.title)}</button>`
    ).join("");
    host.querySelectorAll(".rel-chip").forEach(btn => btn.addEventListener("click", () => {
      const s = btn.dataset.slug;
      if (relSel.has(s)) relSel.delete(s); else relSel.add(s);
      btn.classList.toggle("is-active", relSel.has(s));
      build();
    }));
    syncRelChips();
  }
  function syncRelChips() {
    document.querySelectorAll("#relPicker .rel-chip").forEach(btn =>
      btn.classList.toggle("is-active", relSel.has(btn.dataset.slug)));
  }

  /* ---- load an existing .md back into the form ---- */
  function splitBodySections(body) {
    const intro = [];
    const sections = [];
    let cur = null;
    for (const line of body.split("\n")) {
      const h = line.match(/^##\s+(.+?)\s*$/);          // level-2 headings only
      if (h) { cur = { title: h[1], lines: [] }; sections.push(cur); }
      else if (cur) cur.lines.push(line);
      else intro.push(line);
    }
    return { intro: intro.join("\n").trim(), sections };
  }

  /* unwrap a markdown list back to one item per line (continuation lines that
     don't start a new "- " / "1." item belong to the previous item) */
  function unwrapList(content, marker) {
    const items = [];
    for (const raw of content.split("\n")) {
      if (!raw.trim()) continue;
      if (/^#{1,6}\s/.test(raw)) { items.push(raw.trim()); continue; }   // keep ### subheadings
      const m = raw.match(marker);
      if (m) items.push(m[1].trim());
      else if (items.length) items[items.length - 1] += " " + raw.trim(); // wrapped line
      else items.push(raw.trim());
    }
    return items.join("\n");
  }
  function unwrapQuote(content) {
    const out = [];
    let cur = "";
    for (const raw of content.split("\n")) {
      const s = raw.replace(/^\s*>\s?/, "");
      if (!s.trim()) { if (cur) { out.push(cur); cur = ""; } continue; }  // blank / ">" = new tip
      cur = cur ? cur + " " + s.trim() : s.trim();
    }
    if (cur) out.push(cur);
    return out.join("\n");
  }

  function fillFromMarkdown(text) {
    const { data, body } = parseFrontMatter(text);
    const set = (id, v) => { const el = $(id); if (el) el.value = v ?? ""; };
    set("f-title", data.title);
    set("f-description", data.description);
    set("f-category", data.category);
    set("f-cuisine", data.cuisine);
    set("f-image", data.image || data.bild);
    set("f-prep", data.prep_time === "" || data.prep_time == null ? "" : data.prep_time);
    set("f-cook", data.cook_time === "" || data.cook_time == null ? "" : data.cook_time);
    set("f-servings", data.servings === "" || data.servings == null ? "" : data.servings);
    set("f-difficulty", ["Einfach", "Mittel", "Anspruchsvoll"].includes(data.difficulty) ? data.difficulty : "");
    set("f-tags", Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""));
    set("f-author", data.author);
    set("f-date", data.date ? String(data.date) : "");
    set("f-gallery", Array.isArray(data.gallery) ? data.gallery.join("\n") : (data.gallery || ""));
    $("f-featured").checked = data.featured === true;

    relSel.clear();
    (Array.isArray(data.related) ? data.related : (data.related ? [data.related] : []))
      .forEach(s => relSel.add(String(s)));
    syncRelChips();

    const { intro, sections } = splitBodySections(body);
    set("f-intro", intro);
    let ing = "", steps = "", tips = ""; const extra = [];
    for (const s of sections) {
      const t = s.title.toLowerCase();
      const content = s.lines.join("\n").replace(/^\n+|\n+$/g, "");
      if (/^(zutaten|ingredients)\b/.test(t)) {
        ing = unwrapList(content, /^\s*[-*•]\s+(.*)$/);
      } else if (/^(zubereitung|anleitung|preparation|method)\b/.test(t)) {
        steps = unwrapList(content, /^\s*\d+[.)]\s+(.*)$/);
      } else if (/^(tipps?|tips?|hinweise?)\b/.test(t)) {
        tips = unwrapQuote(content);
      } else {
        extra.push(`## ${s.title}\n\n${content}`.trim());
      }
    }
    set("f-ingredients", ing);
    set("f-steps", steps);
    set("f-tips", tips);
    set("f-extra", extra.join("\n\n"));
    build();
  }

  $("f-upload").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      fillFromMarkdown(text);
      $("uploadName").textContent = `„${file.name}" geladen`;
      toast("Rezept geladen – jetzt bearbeiten");
    } catch (_) {
      toast("Datei konnte nicht gelesen werden");
    }
    e.target.value = "";   // allow re-uploading the same file
  });

  /* default date = today, then first build */
  const d = $("f-date");
  if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);
  build();
  loadRelPicker();
})();
