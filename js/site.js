/* =========================================================================
   Kaki Lima — shared chrome: header, footer, mobile nav
   ========================================================================= */

const NAV = [
  { href: "index.html",   label: "Startseite" },
  { href: "rezepte.html", label: "Rezepte" },
];

function brandMark() {
  // dunkelbraune Logo-Variante (aus der Alpha-Form generiert)
  return `<img class="brand-logo" src="assets/img/logo-brown.png" width="42" height="42" alt="" aria-hidden="true">`;
}

function buildHeader() {
  const current = location.pathname.split("/").pop() || "index.html";
  const links = NAV.map(n =>
    `<a href="${n.href}"${n.href === current ? ' class="is-active"' : ""}>${n.label}</a>`
  ).join("");

  return `
  <header class="site-header">
    <div class="wrap nav">
      <a class="brand" href="index.html" aria-label="Kaki Lima — Startseite">
        ${brandMark()}
        <span class="brand-name">Kaki&nbsp;Lima<small>Indonesische Küche &amp; mehr…</small></span>
      </a>
      <nav class="nav-links" id="navLinks" aria-label="Hauptnavigation">${links}</nav>
      <button class="nav-toggle" id="navToggle" aria-label="Menü" aria-expanded="false" aria-controls="navLinks">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <span>© <span id="year"></span> Kaki Lima</span>
      <nav class="footer-links" aria-label="Footer">
        <a href="rezepte.html">Rezepte</a>
        <a href="impressum.html">Impressum</a>
      </nav>
    </div>
  </footer>`;
}

function initChrome() {
  const h = document.getElementById("site-header-slot");
  const f = document.getElementById("site-footer-slot");
  if (h) h.outerHTML = buildHeader();
  if (f) f.outerHTML = buildFooter();

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => links.classList.remove("is-open")));
  }
}

document.addEventListener("DOMContentLoaded", initChrome);
