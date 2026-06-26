/* =========================================================================
   Kaki Lima — shared site behaviour
   - injects header & footer (single source of truth for nav)
   - mobile nav, scroll state, scroll-reveal, footer year
   ========================================================================= */

const NAV = [
  { href: "index.html",       label: "Start" },
  { href: "rezepte.html",     label: "Rezepte" },
  { href: "leitfaden.html",   label: "Rezept anlegen" },
  { href: "ueber-uns.html",   label: "Über uns" },
];

function brandMark() {
  return `
  <svg class="brand-mark" width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="23" fill="#c1432b"/>
    <path d="M10 28h28a2 2 0 0 1-2 4H12a2 2 0 0 1-2-4z" fill="#e2a32d"/>
    <path d="M24 11c6 0 11 4.5 11 10v.5H13V21c0-5.5 5-10 11-10z" fill="#fbf3e8"/>
    <path d="M24 8v3M19 12l-1-2M29 12l1-2" stroke="#fbf3e8" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="1.4" fill="#2f6b52"/>
    <circle cx="24" cy="16.5" r="1.4" fill="#c1432b"/>
    <circle cx="30" cy="18" r="1.4" fill="#2f6b52"/>
  </svg>`;
}

function buildHeader() {
  const current = location.pathname.split("/").pop() || "index.html";
  const links = NAV.map(n => {
    const active = n.href === current ? " is-active" : "";
    return `<a href="${n.href}" class="${active.trim()}">${n.label}</a>`;
  }).join("");

  return `
  <header class="site-header" id="siteHeader">
    <div class="wrap nav">
      <a class="brand" href="index.html" aria-label="Kaki Lima — Startseite">
        ${brandMark()}
        <span class="brand-name">Kaki&nbsp;Lima<small>Straßenküche</small></span>
      </a>
      <nav class="nav-links" id="navLinks" aria-label="Hauptnavigation">
        ${links}
        <a class="btn btn--primary nav-cta" href="rezepte.html">Rezepte entdecken</a>
      </nav>
      <button class="nav-toggle" id="navToggle" aria-label="Menü öffnen" aria-expanded="false" aria-controls="navLinks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>
    </div>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html">${brandMark()}<span class="brand-name">Kaki&nbsp;Lima<small>Straßenküche</small></span></a>
          <p style="margin-top:1rem">Authentische indonesische Straßenküche zum Nachkochen — würzig, ehrlich und für jeden Tag gemacht.</p>
        </div>
        <div class="footer-col">
          <h4>Entdecken</h4>
          <a href="rezepte.html">Alle Rezepte</a>
          <a href="rezepte.html?cat=Hauptgericht">Hauptgerichte</a>
          <a href="rezepte.html?cat=Streetfood">Streetfood</a>
          <a href="rezepte.html?cat=Vegetarisch">Vegetarisch</a>
        </div>
        <div class="footer-col">
          <h4>Mitmachen</h4>
          <a href="leitfaden.html">Rezept beitragen</a>
          <a href="leitfaden.html#struktur">Markdown-Leitfaden</a>
          <a href="https://github.com/leotrax3d/kakilima" target="_blank" rel="noopener">GitHub-Repository</a>
        </div>
        <div class="footer-col">
          <h4>Mehr</h4>
          <a href="ueber-uns.html">Über uns</a>
          <a href="ueber-uns.html#kontakt">Kontakt</a>
          <a href="ueber-uns.html#impressum">Impressum</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="year"></span> Kaki Lima · Mit ❤️ und Sambal gemacht.</span>
        <span>Selada · Tempe · Rendang · Soto · Gado-Gado</span>
      </div>
    </div>
  </footer>`;
}

function initChrome() {
  const headerSlot = document.getElementById("site-header-slot");
  const footerSlot = document.getElementById("site-footer-slot");
  if (headerSlot) headerSlot.outerHTML = buildHeader();
  if (footerSlot) footerSlot.outerHTML = buildFooter();

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // mobile nav toggle
  const toggle = document.getElementById("navToggle");
  const links  = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => links.classList.remove("is-open")));
  }

  // sticky header scroll state
  const header = document.getElementById("siteHeader");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  initReveal();
}

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

document.addEventListener("DOMContentLoaded", initChrome);
