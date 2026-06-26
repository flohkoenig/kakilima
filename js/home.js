/* =========================================================================
   Kaki Lima — homepage: show the latest recipes
   ========================================================================= */
(function () {
  const grid = document.getElementById("recipeGrid");
  if (!grid) return;

  async function init() {
    grid.innerHTML = Array.from({ length: 3 }).map(() => `<div class="skeleton"></div>`).join("");
    try {
      const all = await loadIndex();
      const pick = all
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
        .slice(0, 6);
      grid.innerHTML = pick.length
        ? pick.map(recipeCard).join("")
        : `<div class="state"><h3>Noch keine Rezepte</h3><p>Lege deine erste Markdown-Datei in <code>recipes/</code> an — so geht's im <a href="leitfaden.html">Leitfaden</a>.</p></div>`;
    } catch (err) {
      grid.innerHTML = `<div class="state"><h3>Noch keine Rezepte</h3><p>Lege deine erste Markdown-Datei in <code>recipes/</code> an — siehe <a href="leitfaden.html">Leitfaden</a>.</p></div>`;
    }
  }
  init();
})();
