/* =========================================================================
   Kaki Lima — homepage recipe carousel
   ========================================================================= */
(function () {
  const root = document.getElementById("carousel");
  if (!root) return;

  async function init() {
    root.innerHTML = spinnerHTML("Rezepte werden geladen …");
    let all = [];
    try { all = await loadIndex(); } catch { /* leer */ }

    all.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    if (!all.length) {
      root.innerHTML = `<div class="state"><h3>Noch keine Rezepte</h3>
        <p>Lege deine erste Markdown-Datei in <code>recipes/</code> an — siehe <a href="leitfaden.html">Leitfaden</a>.</p></div>`;
      return;
    }

    root.innerHTML = `
      <button class="carousel-btn prev" aria-label="Zurück">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="carousel-track" id="carTrack">
        ${all.map(r => `<div class="carousel-card">${recipeCard(r)}</div>`).join("")}
      </div>
      <button class="carousel-btn next" aria-label="Weiter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>
      <div class="carousel-dots" id="carDots"></div>`;

    const track = root.querySelector("#carTrack");
    const prev = root.querySelector(".prev");
    const next = root.querySelector(".next");
    const dotsEl = root.querySelector("#carDots");
    const cards = [...track.children];

    dotsEl.innerHTML = cards.map((_, i) =>
      `<button data-i="${i}" aria-label="Rezept ${i + 1}"></button>`).join("");
    const dots = [...dotsEl.children];

    const step = () => (cards[0]?.offsetWidth || 300) + parseFloat(getComputedStyle(track).columnGap || 16);

    function activeIndex() {
      return Math.round(track.scrollLeft / step());
    }
    function update() {
      const i = activeIndex();
      dots.forEach((d, di) => d.classList.toggle("is-active", di === i));
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
    }

    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    dots.forEach(d => d.addEventListener("click", () =>
      track.scrollTo({ left: step() * Number(d.dataset.i), behavior: "smooth" })));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update);
    update();

    // gentle auto-advance, pause on hover/focus
    let timer = setInterval(advance, 5000);
    function advance() {
      if (track.scrollLeft > track.scrollWidth - track.clientWidth - 4) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: step(), behavior: "smooth" });
      }
    }
    const pause = () => { clearInterval(timer); };
    const resume = () => { clearInterval(timer); timer = setInterval(advance, 5000); };
    root.addEventListener("pointerenter", pause);
    root.addEventListener("pointerleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", resume);
  }

  init();
})();
