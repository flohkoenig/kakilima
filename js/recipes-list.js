/* =========================================================================
   Kaki Lima — recipe listing page
   ========================================================================= */

(function () {
  const grid    = document.getElementById("recipeGrid");
  const countEl = document.getElementById("resultCount");
  const searchEl= document.getElementById("recipeSearch");
  const chipsEl = document.getElementById("catChips");
  if (!grid) return;

  let all = [];
  let activeCat = "Alle";
  let query = "";

  // preselect category from ?cat=
  const params = new URLSearchParams(location.search);
  if (params.get("cat")) activeCat = params.get("cat");

  function render() {
    const q = query.trim().toLowerCase();
    const list = all.filter(r => {
      const catOk = activeCat === "Alle" || r.category === activeCat ||
        (Array.isArray(r.tags) && r.tags.includes(activeCat));
      if (!catOk) return false;
      if (!q) return true;
      const hay = [r.title, r.description, r.category, (r.tags || []).join(" ")]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });

    countEl.textContent = `${list.length} ${list.length === 1 ? "Rezept" : "Rezepte"}`;

    if (!list.length) {
      grid.innerHTML = `<div class="state" style="grid-column:1/-1">
        ${ICONS.search}
        <h3>Nichts gefunden</h3>
        <p>Probier einen anderen Suchbegriff oder eine andere Kategorie.</p>
      </div>`;
      return;
    }
    grid.innerHTML = list.map(recipeCard).join("");
    // re-trigger reveal for freshly inserted cards
    grid.querySelectorAll(".reveal").forEach(el => el.classList.add("is-in"));
  }

  function buildChips() {
    const cats = ["Alle", ...new Set(all.map(r => r.category).filter(Boolean))];
    chipsEl.innerHTML = cats.map(c =>
      `<button class="chip${c === activeCat ? " is-active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join("");
    chipsEl.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCat = btn.dataset.cat;
        chipsEl.querySelectorAll(".chip").forEach(b =>
          b.classList.toggle("is-active", b === btn));
        render();
      });
    });
  }

  async function init() {
    grid.innerHTML = Array.from({ length: 6 })
      .map(() => `<div class="skeleton"></div>`).join("");
    try {
      all = await loadIndex();
      // newest first when a date exists
      all.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      buildChips();
      render();
    } catch (err) {
      grid.innerHTML = `<div class="state" style="grid-column:1/-1">
        <h3>Rezepte konnten nicht geladen werden</h3>
        <p>${escapeHtml(err.message)}<br>
        Lege Markdown-Dateien im Ordner <code>/recipes</code> ab und führe den
        Index-Build aus — siehe <a href="leitfaden.html">Leitfaden</a>.</p>
      </div>`;
      countEl.textContent = "";
    }
  }

  if (searchEl) {
    let t;
    searchEl.addEventListener("input", e => {
      clearTimeout(t);
      query = e.target.value;
      t = setTimeout(render, 120);
    });
  }

  init();
})();
