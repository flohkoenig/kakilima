/* =========================================================================
   Kaki Lima — shared chrome: header, footer, mobile nav
   ========================================================================= */

const NAV = [
  { href: "index.html",     label: "Startseite" },
  { href: "rezepte.html",   label: "Rezepte" },
  { href: "leitfaden.html", label: "Rezept anlegen" },
  { href: "impressum.html", label: "Impressum" },
];

function brandMark() {
  return `
  <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="19" fill="#57340d"/>
    <path d="M8 23h24c0 6.6-5.4 11-12 11S8 29.6 8 23z" fill="#ffc65a"/>
    <path d="M8 23h24a2.5 2.5 0 0 0-2.5-2.5h-19A2.5 2.5 0 0 0 8 23z" fill="#fbf4e4"/>
    <path d="M15 17c1.2-2 4-2 5 0M22 14c1.2-2 4-2 5 0" stroke="#fbf4e4" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
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
      <div>
        <span class="brand-name">Kaki&nbsp;Lima<small>Indonesische Küche &amp; mehr…</small></span>
        <p>Eine kleine Sammlung indonesischer Rezepte zum Nachkochen. Selamat makan!</p>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a href="index.html">Startseite</a>
        <a href="rezepte.html">Rezepte</a>
        <a href="leitfaden.html">Rezept anlegen</a>
        <a href="impressum.html">Impressum</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="wrap">© <span id="year"></span> Kaki Lima · All Rights Reserved</div>
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
