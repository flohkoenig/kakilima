# Kaki Lima 🍜

Indonesische Straßenküche zum Nachkochen — als schnelle, statische Website mit
einem **Markdown-basierten Rezept-System**. Jedes Rezept ist eine `.md`-Datei im
Ordner [`recipes/`](recipes/) und erscheint automatisch auf der Seite.

> „Kaki Lima" sind die fahrbaren Garküchen Indonesiens — der Name heißt wörtlich
> „fünf Beine".

## ✨ Features

- **Rezepte als Markdown** – eine Datei pro Rezept, mit Front-Matter-Metadaten.
- **Automatischer Index** – eine GitHub-Action baut beim Push `recipes/index.json`.
- **Suche & Filter** – nach Name, Zutat, Kategorie und Tags.
- **Aufgewertetes Design** – warme Gewürz-Palette, moderne Typografie, responsive.
- **Keine Abhängigkeiten** – reines HTML/CSS/JS inkl. eigenem Markdown-Renderer,
  läuft direkt auf GitHub Pages (kein Build-Tool nötig).

## 📁 Projektstruktur

```
.
├── index.html            # Startseite
├── rezepte.html          # Übersicht aller Rezepte (Suche/Filter)
├── rezept.html           # Einzelnes Rezept (?slug=…)
├── leitfaden.html        # Anleitung: Rezept als Markdown anlegen
├── ueber-uns.html        # Über uns / Impressum
├── css/styles.css        # Design-System
├── js/
│   ├── site.js           # Header/Footer, Navigation, Scroll-Effekte
│   ├── markdown.js       # eigener, schlanker Markdown-Renderer
│   ├── recipes-data.js   # Front-Matter-Parser, Karten, Helfer
│   ├── recipes-list.js   # Übersicht: Suche & Filter
│   ├── recipe-detail.js  # Einzelrezept rendern
│   └── home.js           # Startseite: Highlights
├── recipes/
│   ├── *.md              # 👉 hier kommen die Rezepte rein
│   ├── index.json        # generiert – nicht von Hand bearbeiten
│   └── README.md         # Kurzanleitung im Ordner
├── scripts/build-index.mjs   # baut recipes/index.json
└── .github/workflows/build-recipe-index.yml
```

## 📝 Ein Rezept hinzufügen

1. Lege eine Datei `recipes/dein-rezept.md` an (Kleinbuchstaben, Bindestriche).
2. Beginne mit einem Front-Matter-Block und schreib `## Zutaten` / `## Zubereitung`.
3. Committe & pushe — der Index wird automatisch gebaut.

Die ausführliche Anleitung steht auf der Seite **„Rezept anlegen"**
(`leitfaden.html`) und im [`recipes/README.md`](recipes/README.md).

Minimalbeispiel:

```markdown
---
title: Nasi Goreng
description: Gebratener Reis – würzig und schnell.
category: Hauptgericht
prep_time: 15
cook_time: 10
servings: 2
difficulty: Einfach
tags: [reis, schnell]
date: 2026-06-26
---

## Zutaten
- 300 g Reis
- 2 EL Kecap Manis

## Zubereitung
1. Reis anbraten.
2. Würzen und servieren.
```

## 🛠️ Lokal entwickeln

Reine statische Seite — irgendein Webserver genügt:

```bash
# Rezept-Index (neu) bauen
node scripts/build-index.mjs

# lokal servieren
python3 -m http.server 8000
# → http://localhost:8000
```

## 🚀 Deployment (GitHub Pages)

1. In den Repo-Einstellungen unter **Settings → Pages** als Quelle
   **„GitHub Actions"** wählen.
2. Beim Push auf `main` baut die Action den Index und veröffentlicht die Seite.

## Lizenz

[MIT](LICENSE)
