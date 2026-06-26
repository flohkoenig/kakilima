/* =========================================================================
   Kaki Lima — homepage dynamic bits (featured recipes + count)
   ========================================================================= */

(function () {
  const grid = document.getElementById("featuredGrid");
  const stat = document.getElementById("statCount");

  async function init() {
    try {
      const all = await loadIndex();
      if (stat) stat.textContent = all.length ? `${all.length}` : "0";

      if (grid) {
        const featured = all.filter(r => r.featured);
        const pick = (featured.length ? featured : all)
          .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
          .slice(0, 3);

        grid.innerHTML = pick.length
          ? pick.map(recipeCard).join("")
          : emptyState();
        grid.querySelectorAll(".reveal").forEach(el => el.classList.add("is-in"));
      }
    } catch (err) {
      if (stat) stat.textContent = "0";
      if (grid) grid.innerHTML = emptyState(err.message);
    }
  }

  function emptyState(msg) {
    return `<div class="state" style="grid-column:1/-1">
      <h3>Noch keine Rezepte</h3>
      <p>Lege deine erste Markdown-Datei in <code>/recipes</code> an —
      so geht's im <a href="leitfaden.html">Leitfaden</a>.</p>
      ${msg ? `<p style="font-size:.8rem;opacity:.7">${msg}</p>` : ""}
    </div>`;
  }

  init();
})();
