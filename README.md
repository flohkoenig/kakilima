# Kaki Lima

Indonesische Küche und mehr… — ein schlichter, statischer Rezeptblog. Jedes
Rezept ist eine Markdown-Datei im Ordner [`recipes/`](recipes/) und erscheint
automatisch auf der Website.

## Aufbau

```
index.html        Startseite (Intro + neueste Rezepte)
rezepte.html      Übersicht (Suche & Kategorie-Filter)
rezept.html       Einzelrezept (?slug=…)
leitfaden.html    Anleitung: Rezept als Markdown anlegen
impressum.html    Impressum & Kontakt
css/ js/          Styles und Logik (inkl. eigener Markdown-Renderer)
recipes/          die Rezepte als .md  +  generierte index.json
assets/img/       Rezeptbilder
scripts/build-index.mjs              baut recipes/index.json
.github/workflows/build-recipe-index.yml
```

## Rezept hinzufügen

Eine Datei `recipes/dein-rezept.md` anlegen, committen und pushen. Die genaue
Struktur (Front Matter, Abschnitte, Bild) steht im Leitfaden auf der Website
(`leitfaden.html`).

## Lokal

```bash
node scripts/build-index.mjs   # Index neu bauen
python3 -m http.server 8000    # → http://localhost:8000
```

## Deployment (GitHub Pages)

In **Settings → Pages** als Quelle **„GitHub Actions"** wählen. Beim Push auf
`main` baut die Action den Index und veröffentlicht die Seite.

## Lizenz

[MIT](LICENSE)
