/* =========================================================================
   Kaki Lima — single recipe page (rezept.html?slug=...)
   Fetches the raw Markdown, parses front matter, renders the recipe.
   ========================================================================= */

(function () {
  const root = document.getElementById("recipeRoot");
  if (!root) return;

  const slug = new URLSearchParams(location.search).get("slug");

  function fail(msg) {
    document.title = "Rezept nicht gefunden · Kaki Lima";
    root.innerHTML = `<div class="wrap section center">
      <p class="eyebrow">Hoppla</p>
      <h1>Rezept nicht gefunden</h1>
      <p class="lead" style="margin-inline:auto">${escapeHtml(msg)}</p>
      <p style="margin-top:2rem"><a class="btn btn--primary" href="rezepte.html">Zu allen Rezepten</a></p>
    </div>`;
  }

  /* split markdown body so the "Zutaten" section can sit in the sidebar */
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
    let ingredientsMd = "";
    let restMd = body;

    const ingIdx = sections.findIndex(s => /zutaten|ingredients/i.test(s.title));
    if (ingIdx !== -1) {
      const s = sections[ingIdx];
      // body of the ingredients section without its heading line
      const inner = body.slice(s.start, s.end).replace(/^##\s+.+\n?/, "");
      ingredientsMd = inner.trim();
      restMd = (body.slice(0, s.start) + body.slice(s.end)).trim();
    }
    return {
      ingredients: ingredientsMd ? md.parse(ingredientsMd) : "",
      rest: md.parse(restMd),
    };
  }

  function facts(d) {
    const items = [];
    const tt = totalTime(d);
    if (d.prep_time) items.push(["clock", fmtMinutes(d.prep_time), "Vorbereitung"]);
    if (d.cook_time) items.push(["fire",  fmtMinutes(d.cook_time), "Kochzeit"]);
    if (tt)          items.push(["clock", fmtMinutes(tt), "Gesamt"]);
    if (d.servings)  items.push(["users", String(d.servings), "Portionen"]);
    if (d.difficulty)items.push(["gauge", d.difficulty, "Schwierigkeit"]);
    return items.map(([ic, val, lab]) => `
      <div class="fact">
        <span class="fi">${ICONS[ic]}</span>
        <span><b>${escapeHtml(val)}</b><small>${escapeHtml(lab)}</small></span>
      </div>`).join("");
  }

  function render(d, body) {
    document.title = `${d.title} · Kaki Lima`;
    setMeta("description", d.description || "");

    const img = recipeImage(d);
    const media = img
      ? `<img src="${img}" alt="${escapeHtml(d.title)}" onerror="this.parentElement.innerHTML='<div class=&quot;ph&quot;>${ICONS.bowl.replace(/"/g,'&quot;')}</div>'">`
      : `<div class="ph">${ICONS.bowl}</div>`;

    const tags = Array.isArray(d.tags) && d.tags.length
      ? `<div class="recipe-tags">${d.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>` : "";

    const parts = splitBody(body);
    const ingredientsBox = parts.ingredients
      ? `<aside class="ingredients-box"><h2>Zutaten</h2><div class="markdown-body">${parts.ingredients}</div></aside>`
      : "";

    root.innerHTML = `
    <article class="wrap section">
      <nav class="crumbs">
        <a href="index.html">Start</a> ›
        <a href="rezepte.html">Rezepte</a> ›
        <span>${escapeHtml(d.title)}</span>
      </nav>

      <div class="recipe-hero" style="margin-top:1.4rem">
        <div>
          <p class="eyebrow">${escapeHtml(d.category || d.cuisine || "Rezept")}</p>
          <h1>${escapeHtml(d.title)}</h1>
          <p class="lead">${escapeHtml(d.description || "")}</p>
          ${tags}
          <div class="facts">${facts(d)}</div>
        </div>
        <div class="media">${media}</div>
      </div>

      <div class="recipe-layout">
        ${ingredientsBox}
        <div class="markdown-body">${parts.rest}</div>
      </div>

      <div class="recipe-foot">
        <a class="btn btn--ghost" href="rezepte.html">← Alle Rezepte</a>
        ${d.author ? `<span style="color:var(--c-muted)">Rezept von <strong style="color:var(--c-ink)">${escapeHtml(d.author)}</strong></span>` : ""}
      </div>
    </article>

    <section class="wrap section--tight">
      <div class="cta-band">
        <h2>Dein Rezept gehört hierher</h2>
        <p>Kaki Lima lebt von echten Familienrezepten. Leg eine Markdown-Datei an — den Rest erledigt die Seite automatisch.</p>
        <p style="margin-top:1.4rem"><a class="btn btn--gold" href="leitfaden.html">So funktioniert's</a></p>
      </div>
    </section>`;
  }

  function setMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
    el.content = content;
  }

  async function init() {
    if (!slug) return fail("Es wurde kein Rezept angegeben.");
    if (!/^[a-z0-9._-]+$/i.test(slug)) return fail("Ungültiger Rezeptname.");

    try {
      const res = await fetch(`${RECIPES_DIR}/${slug}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Die Datei recipes/${slug}.md existiert nicht.`);
      const raw = await res.text();
      const { data, body } = parseFrontMatter(raw);
      if (!data.title) data.title = slug.replace(/[-_]/g, " ");

      window.marked.setOptions({ breaks: false, gfm: true });
      render(data, body);
    } catch (err) {
      fail(err.message);
    }
  }

  init();
})();
