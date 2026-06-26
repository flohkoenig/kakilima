# Rezepte-Ordner

Jede `.md`-Datei in diesem Ordner ist **ein Rezept** und erscheint automatisch
auf der Website. Lege einfach eine neue Datei an, committe & pushe – fertig.

> Die ausführliche, bebilderte Anleitung findest du auf der Website unter
> **Rezept anlegen** (`leitfaden.html`).

## Schnellüberblick

- **Dateiname** = Web-Adresse: `nasi-goreng.md` → `/rezept.html?slug=nasi-goreng`
  Nur Kleinbuchstaben, Zahlen und Bindestriche, keine Umlaute/Leerzeichen.
- Jede Datei beginnt mit einem **Front Matter** zwischen zwei `---`-Zeilen.
- Danach folgt der Inhalt mit den Abschnitten `## Zutaten` und `## Zubereitung`.

## Vorlage

```markdown
---
title: Name des Gerichts
description: Ein, zwei Sätze für die Vorschau.
category: Hauptgericht
cuisine: Indonesisch
image: assets/img/datei.jpg
prep_time: 15
cook_time: 10
servings: 2
difficulty: Einfach
tags: [reis, schnell]
author: Dein Name
date: 2026-06-26
featured: false
---

Einleitende Sätze zum Gericht.

## Zutaten

- 300 g Reis
- 2 EL Kecap Manis

## Zubereitung

1. Erster Schritt.
2. Zweiter Schritt.

## Tipps

> Ein hilfreicher Hinweis.
```

## Front-Matter-Felder

| Feld          | Pflicht | Bedeutung                                              |
|---------------|---------|--------------------------------------------------------|
| `title`       | ✅      | Name des Rezepts                                       |
| `description` | empf.   | Kurztext für Karte & SEO                               |
| `category`    | empf.   | Filter-Kategorie (z. B. `Hauptgericht`, `Streetfood`)  |
| `cuisine`     | opt.    | Region/Küche                                           |
| `image`       | opt.    | Bildpfad, z. B. `assets/img/datei.jpg`                 |
| `prep_time`   | opt.    | Vorbereitungszeit in Minuten (Zahl)                    |
| `cook_time`   | opt.    | Kochzeit in Minuten (Zahl)                             |
| `total_time`  | opt.    | Gesamtzeit; sonst `prep_time + cook_time`              |
| `servings`    | opt.    | Portionen (Zahl)                                       |
| `difficulty`  | opt.    | `Einfach` / `Mittel` / `Anspruchsvoll`                 |
| `tags`        | opt.    | Liste: `[reis, scharf]`                                |
| `author`      | opt.    | Wer das Rezept beigetragen hat                         |
| `date`        | empf.   | `JJJJ-MM-TT` – steuert die Sortierung                  |
| `featured`    | opt.    | `true` = auf der Startseite hervorheben                |

## Index neu bauen

Beim Push baut die GitHub-Action `build-recipe-index` automatisch
`recipes/index.json`. Lokal:

```bash
node scripts/build-index.mjs
```
