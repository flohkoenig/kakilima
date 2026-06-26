/* =========================================================================
   Kaki Lima — single recipe (rezept.html?slug=...)
   ========================================================================= */
(function () {
  const root = document.getElementById("recipeRoot");
  if (!root) return;

  const slug = new URLSearchParams(location.search).get("slug");

  function fail(msg) {
    document.title = "Rezept nicht gefunden · Kaki Lima";
    root.innerHTML = `<div class="wrap section center">
      <h1>Rezept nicht gefunden</h1>
      <p class="muted" style="margin:1rem auto 0;max-width:50ch">${escapeHtml(msg)}</p>
      <p style="margin-top:1.6rem"><a class="btn btn--primary" href="rezepte.html">Zu allen Rezepten</a></p>
    </div>`;
  }

  /* pull the "Zutaten" section out so it can sit in the sidebar.
     Section boundaries are level-2 headings only, so "### …" subsections
     (e.g. "### Für die Sauce") stay inside the ingredients block. */
  function splitBody(body) {
    const md = window.marked;
    const headingRe = /^##\s+(.+)$/gm;
    const sections = [];
    let m, last = null;
    while ((m = headingRe.exec(body)) !== null) {
      if (last) last.end = m.index;
      last = { title: m[1].trim(), start: m.index, end: body.length };
      sections.push(last);
    }
    let ingredientsMd = "", restMd = body;
    const idx = sections.findIndex(s => /^(zutaten|ingredients)\b/i.test(s.title));
    if (idx !== -1) {
      const s = sections[idx];
      ingredientsMd = body.slice(s.start, s.end).replace(/^##\s+.+\n?/, "").trim();
      restMd = (body.slice(0, s.start) + body.slice(s.end)).trim();
    }
    return {
      ingredients: ingredientsMd ? md.parse(ingredientsMd) : "",
      rest: md.parse(restMd),
    };
  }

  function facts(d) {
    const out = [];
    const prep = Number(d.prep_time) || 0;
    const cook = Number(d.cook_time) || 0;
    if (prep) out.push(["clock", fmtMinutes(prep), "Vorbereitung"]);
    if (cook) out.push(["fire", fmtMinutes(cook), "Kochzeit"]);
    // "Gesamt" only when it actually differs from a single shown time
    if (prep && cook) out.push(["clock", fmtMinutes(totalTime(d)), "Gesamt"]);
    if (d.servings) out.push(["users", String(d.servings), "Portionen"]);
    if (d.difficulty) out.push(["gauge", d.difficulty, "Schwierigkeit"]);
    return out.map(([ic, val, lab]) =>
      `<div class="fact">${ICONS[ic]}<span><b>${escapeHtml(val)}</b><small>${escapeHtml(lab)}</small></span></div>`
    ).join("");
  }

  function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
    el.content = content;
  }

  function toast(msg) {
    let t = document.getElementById("klToast");
    if (!t) { t = document.createElement("div"); t.id = "klToast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  async function share(d) {
    const url = location.href;
    const data = { title: `${d.title} · Kaki Lima`, text: d.description || d.title, url };
    if (navigator.share) {
      try { await navigator.share(data); } catch (_) { /* abgebrochen */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link kopiert");
    } catch (_) {
      prompt("Link zum Teilen kopieren:", url);
    }
  }

  function render(d, body) {
    document.title = `${d.title} · Kaki Lima`;
    setMeta("description", d.description || "");

    const img = recipeImage(d);
    const photo = `<div class="recipe-photo">
        <div class="ph">${ICONS.utensils}</div>
        ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(d.title)}" onerror="this.remove()">` : ""}
      </div>`;

    const tags = Array.isArray(d.tags) && d.tags.length
      ? `<div class="recipe-tags">${d.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : "";

    const parts = splitBody(body);
    const hasIngredients = !!parts.ingredients;
    const ingredients = hasIngredients
      ? `<aside class="ingredients"><h2>Zutaten</h2><div class="md">${parts.ingredients}</div></aside>`
      : "";

    root.innerHTML = `
    <article class="wrap section recipe">
      <nav class="crumbs no-print"><a href="index.html">Startseite</a> › <a href="rezepte.html">Rezepte</a> › ${escapeHtml(d.title)}</nav>

      <header class="recipe-head">
        <span class="kicker">${escapeHtml(d.category || d.cuisine || "Rezept")}</span>
        <h1>${escapeHtml(d.title)}</h1>
        ${d.description ? `<p class="lead">${escapeHtml(d.description)}</p>` : ""}
        ${tags}
        <div class="recipe-actions no-print">
          <button class="btn btn--ghost" id="btnShare" type="button">${ICONS.share}<span>Teilen</span></button>
          <button class="btn btn--ghost" id="btnPdf" type="button">${ICONS.pdf}<span>Als PDF</span></button>
        </div>
      </header>

      ${photo}

      <div class="facts">${facts(d)}</div>

      <div class="recipe-grid${hasIngredients ? "" : " single"}">
        ${ingredients}
        <div class="md">${parts.rest}</div>
      </div>

      <div class="recipe-foot no-print">
        <a class="btn btn--ghost" href="rezepte.html">← Alle Rezepte</a>
        ${d.author ? `<span class="muted">Rezept von <strong style="color:var(--brown-dk)">${escapeHtml(d.author)}</strong></span>` : ""}
      </div>
    </article>`;

    root.querySelector("#btnShare").addEventListener("click", () => share(d));
    root.querySelector("#btnPdf").addEventListener("click", () => window.print());
  }

  async function init() {
    if (!slug) return fail("Es wurde kein Rezept angegeben.");
    if (!/^[a-z0-9._-]+$/i.test(slug)) return fail("Ungültiger Rezeptname.");
    try {
      const res = await fetch(`${RECIPES_DIR}/${slug}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Die Datei recipes/${slug}.md existiert nicht.`);
      const { data, body } = parseFrontMatter(await res.text());
      if (!data.title) data.title = slug.replace(/[-_]/g, " ");
      render(data, body);
    } catch (err) {
      fail(err.message);
    }
  }
  init();
})();
