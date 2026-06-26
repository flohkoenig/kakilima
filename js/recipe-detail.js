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
      `<div class="fact"${lab === "Portionen" ? ' data-fact="servings"' : ""}>${ICONS[ic]}<span><b>${escapeHtml(val)}</b><small>${escapeHtml(lab)}</small></span></div>`
    ).join("");
  }

  /* ---------- portion calculator ----------
     Scales the leading quantity of every ingredient line. Numbers are parsed
     generically (integers, decimals "1,5", fractions "1/2", unicode "½",
     ranges "2–3"), so nothing extra has to be declared in the markdown. */
  const UNI_FRAC = { "½": .5, "⅓": 1/3, "⅔": 2/3, "¼": .25, "¾": .75, "⅕": .2, "⅖": .4, "⅗": .6, "⅘": .8, "⅙": 1/6, "⅚": 5/6, "⅛": .125, "⅜": .375, "⅝": .625, "⅞": .875 };
  const NICE = [[0, ""], [.125, "⅛"], [.25, "¼"], [1/3, "⅓"], [.375, "⅜"], [.5, "½"], [.625, "⅝"], [2/3, "⅔"], [.75, "¾"], [.875, "⅞"], [1, ""]];

  function readNumber(s) {
    let m;
    if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)/))) return { value: +m[1] + (+m[2] / +m[3]), len: m[0].length };
    if ((m = s.match(/^(\d+)\/(\d+)/)))          return { value: +m[1] / +m[2], len: m[0].length };
    if ((m = s.match(/^(\d+(?:[.,]\d+)?)/)))     return { value: parseFloat(m[1].replace(",", ".")), len: m[0].length };
    if ((m = s.match(/^([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/)))  return { value: UNI_FRAC[m[1]], len: 1 };
    return null;
  }

  function parseLeadingQty(text) {
    const lead = (text.match(/^\s*/) || [""])[0];
    const rest = text.slice(lead.length);
    const a = readNumber(rest);
    if (!a) return null;
    let len = a.len; const values = [a.value];
    const after = rest.slice(a.len);
    const rng = after.match(/^\s*(?:[–—-]|bis)\s+/);
    if (rng) {
      const b = readNumber(after.slice(rng[0].length));
      if (b) { len += rng[0].length + b.len; values.push(b.value); }
    }
    return { lead, raw: rest.slice(0, len), values };
  }

  function niceNumber(n) {
    if (!isFinite(n) || n <= 0) return "0";
    if (n >= 10) return String(Math.round(n));
    const whole = Math.floor(n + 1e-9), frac = n - whole;
    let best = NICE[0], bd = Infinity;
    for (const f of NICE) { const d = Math.abs(frac - f[0]); if (d < bd) { bd = d; best = f; } }
    if (bd < 0.06) {
      if (best[0] === 1) return String(whole + 1);
      if (best[1]) return whole > 0 ? `${whole} ${best[1]}` : best[1];
      return String(whole);
    }
    return (Math.round(n * 10) / 10).toString().replace(".", ",");
  }

  function wrapQty(li) {
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;          // skip whitespace-only nodes
      const q = parseLeadingQty(node.nodeValue);
      if (!q) return false;                          // first real text has no leading quantity
      const after = node.nodeValue.slice(q.lead.length + q.raw.length);
      const span = document.createElement("span");
      span.className = "qty";
      span.dataset.base = q.values.join("|");
      const frag = document.createDocumentFragment();
      if (q.lead) frag.appendChild(document.createTextNode(q.lead));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      return true;
    }
    return false;
  }

  function applyFactor(scope, factor) {
    scope.querySelectorAll(".qty").forEach(span => {
      const vals = span.dataset.base.split("|").map(Number);
      span.textContent = vals.map(v => niceNumber(v * factor)).join(" – ");
    });
  }

  function initPortions(scope, base) {
    const aside = scope.querySelector(".ingredients");
    if (!aside) return;
    let any = false;
    aside.querySelectorAll(".md li").forEach(li => { if (wrapQty(li)) any = true; });
    applyFactor(aside, 1);                            // normalise initial display

    const ctrl = aside.querySelector(".portions");
    const servFact = scope.querySelector('[data-fact="servings"] b');
    if (!base || !any) { if (ctrl) ctrl.remove(); return; }

    let cur = base;
    const valEl = ctrl.querySelector(".p-val");
    const minus = ctrl.querySelector(".p-minus");
    function set(n) {
      cur = Math.max(1, Math.min(99, n));
      valEl.textContent = cur;
      minus.disabled = cur <= 1;
      applyFactor(aside, cur / base);
      if (servFact) servFact.textContent = cur;
    }
    minus.addEventListener("click", () => set(cur - 1));
    ctrl.querySelector(".p-plus").addEventListener("click", () => set(cur + 1));
    set(base);
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

    const img = recipeImage(d) || placeholderPhoto(slug || d.title, 1200, 675);
    const photo = `<div class="recipe-photo">
        <div class="ph">${ICONS.utensils}</div>
        <img src="${escapeHtml(img)}" alt="${escapeHtml(d.title)}" onerror="this.remove()">
      </div>`;

    const tags = Array.isArray(d.tags) && d.tags.length
      ? `<div class="recipe-tags">${d.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : "";

    const parts = splitBody(body);
    const hasIngredients = !!parts.ingredients;
    const portions = Number(d.servings)
      ? `<div class="portions no-print" role="group" aria-label="Portionen anpassen">
           <button class="p-minus" type="button" aria-label="Weniger Portionen">−</button>
           <span class="p-val">${escapeHtml(String(d.servings))}</span>
           <span class="p-label">Portionen</span>
           <button class="p-plus" type="button" aria-label="Mehr Portionen">+</button>
         </div>`
      : "";
    const ingredients = hasIngredients
      ? `<aside class="ingredients">
           <div class="ing-head"><h2>Zutaten</h2>${portions}</div>
           <div class="md">${parts.ingredients}</div>
         </aside>`
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
    initPortions(root, Number(d.servings) || 0);
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
