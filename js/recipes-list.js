/* =========================================================================
   Kaki Lima — recipe listing: search, category filter, card/list view
   ========================================================================= */
(function () {
  const container = document.getElementById("recipeContainer");
  const countEl = document.getElementById("resultCount");
  const searchEl = document.getElementById("recipeSearch");
  const chipsEl = document.getElementById("catChips");
  const viewEl = document.getElementById("viewToggle");
  if (!container) return;

  let all = [];
  let activeCat = "Alle";
  let query = "";
  let view = localStorage.getItem("kl-view") === "list" ? "list" : "card";

  const params = new URLSearchParams(location.search);
  if (params.get("cat")) activeCat = params.get("cat");

  function current() {
    const q = query.trim().toLowerCase();
    return all.filter(r => {
      const catOk = activeCat === "Alle" || r.category === activeCat ||
        (Array.isArray(r.tags) && r.tags.includes(activeCat));
      if (!catOk) return false;
      if (!q) return true;
      const hay = [r.title, r.description, r.category, (r.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function render() {
    const list = current();
    if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? "Rezept" : "Rezepte"}`;

    if (!list.length) {
      container.className = "";
      container.innerHTML = `<div class="state"><h3>Nichts gefunden</h3><p>Probier einen anderen Suchbegriff oder eine andere Kategorie.</p></div>`;
      return;
    }
    if (view === "list") {
      container.className = "list";
      container.innerHTML = list.map(recipeRow).join("");
    } else {
      container.className = "grid";
      container.innerHTML = list.map(recipeCard).join("");
    }
  }

  function buildChips() {
    if (!chipsEl) return;
    const cats = ["Alle", ...new Set(all.map(r => r.category).filter(Boolean))];
    chipsEl.innerHTML = cats.map(c =>
      `<button class="chip${c === activeCat ? " is-active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join("");
    chipsEl.querySelectorAll(".chip").forEach(btn =>
      btn.addEventListener("click", () => {
        activeCat = btn.dataset.cat;
        chipsEl.querySelectorAll(".chip").forEach(b => b.classList.toggle("is-active", b === btn));
        render();
      }));
  }

  function buildViewToggle() {
    if (!viewEl) return;
    viewEl.innerHTML =
      `<button data-view="card" aria-label="Kachelansicht">${ICONS.grid}<span>Kacheln</span></button>
       <button data-view="list" aria-label="Listenansicht">${ICONS.list}<span>Liste</span></button>`;
    const sync = () => viewEl.querySelectorAll("button").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
    viewEl.querySelectorAll("button").forEach(btn =>
      btn.addEventListener("click", () => {
        view = btn.dataset.view;
        localStorage.setItem("kl-view", view);
        sync();
        render();
      }));
    sync();
  }

  async function init() {
    container.className = "grid";
    container.innerHTML = Array.from({ length: 6 }).map(() => `<div class="skeleton"></div>`).join("");
    try {
      all = await loadIndex();
      all.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      buildChips();
      buildViewToggle();
      render();
    } catch (err) {
      container.className = "";
      container.innerHTML = `<div class="state"><h3>Rezepte konnten nicht geladen werden</h3>
        <p>${escapeHtml(err.message)}<br>Lege Markdown-Dateien im Ordner <code>recipes/</code> ab — siehe <a href="leitfaden.html">Leitfaden</a>.</p></div>`;
      if (countEl) countEl.textContent = "";
    }
  }

  if (searchEl) {
    let t;
    searchEl.addEventListener("input", e => { clearTimeout(t); query = e.target.value; t = setTimeout(render, 110); });
  }
  init();
})();
