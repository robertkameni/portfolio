# Projekt-Evidenz im Portfolio

Datum: 2026-11-08
Status: umgesetzt

## Ausgangslage

Ein Audit der Startseite (1440x900) ergab:

- Genau **ein** Bild auf der gesamten Seite: das Portrait (320x480).
- Acht Projekte, davon fünf live erreichbar, aber **kein einziger Screenshot** wurde gezeigt.
- Die vier internen Projekte trugen generische Unsplash-Stockfotos als `coverImageUrl`.
  Fremde Fotografie als Beleg für eigene Arbeit ist irreführend.
- Zwei echte Screenshots lagen ungenutzt in `public/assets/`.

Für ein Portfolio, dessen Publikum Recruiter und Founder sind, ist fehlende Evidenz das
größere Problem als jede Typografie-Frage.

## Entscheidung

Der Beleg wird Teil der Projektzeile, nicht ein Kartenraster.

1. **Bild links, Text rechts**, ab `md` ein zweispaltiges Grid mit `auto`-Spalte.
   Das Bild ist 16:10, `object-cover object-top`, 16rem breit, mit 1px Hairline als Rahmen.
   `loading="lazy"`, feste `width`/`height` gegen Layout-Shift.
2. **Ohne Bild keine Attrappe.** Fehlt `coverImageUrl`, kollabiert die Bildspalte auf 0
   und der Text beginnt am linken Rand. Kein Platzhalterkasten, kein Stockfoto, keine
   erfundene UI. Wo es nichts zu zeigen gibt, wird nichts vorgetäuscht.
3. **Chronologie bleibt.** Keine Gruppierung nach "mit/ohne Bild"; die Reihenfolge ist
   das Argument.
4. **Eine Bildsprache.** Alle Screenshots im 1200x750-Viewport aufgenommen, damit die
   Textgröße in den Bildern konsistent ist und die Zeilen nicht wie eine Collage wirken.
5. **Kein Overlay.** Keine Tags auf dem Bild, keine Deko-Bildunterschrift. Metadaten
   bleiben in der Textspalte.

## Herkunft der Bilder

| Projekt | Quelle |
|---|---|
| ATLAS-BIO | `public/assets/projects/atlas-bio.png`, live abfotografiert |
| The Engineering Forge | `public/assets/projects/engineering-forge.png`, live abfotografiert |
| AI Engineering Team Simulator | `public/assets/projects/team-sim.png`, live abfotografiert |
| HirePath Jobs | `public/assets/projects/hirepath.png`, live abfotografiert |
| DATEV, Factoring, Deployment, Mitarbeiterverwaltung | kein Bild, `coverImageUrl = null` |

## Detailseite

Der Cover-Bereich war eine Banner-Höhe (`h-44` bis `lg:h-72`) mit `object-center` und
beschnitt ein 16:10-Bild auf 2.4:1. Jetzt `aspect-16/10` mit `max-h-104` und
`object-top`: der Screenshot bleibt unbeschnitten, Navigation und Hero sind sichtbar.

## Nicht-Ziele

- Keine Bildergalerie pro Projekt.
- Keine Hover-Vorschau, keine Filter.
- Keine Umstellung des Datenbankschemas: `coverImageUrl` existierte bereits.
- Keine Optimierungspipeline für Bildvarianten. Die vier PNGs wiegen zusammen rund
  518 KB und werden lazy geladen.

## Verifikation

- Die drei Startseiten-Zeilen laden ihre Bilder mit `naturalWidth = 1200`, sobald sie
  in den Viewport scrollen.
- Desktop: Bild bei x=216, Überschrift bei x=216, Textspalte bei x=528.
- Projekt ohne Bild: Text beginnt bei x=216, keine Bildspalte.
- Mobil (390px): Bild 353x221 über dem Text, kein horizontaler Überlauf.
- Detailseite: Bild 664x414, Seitenverhältnis 1.6, unbeschnitten.
- 120 Tests grün, `npm run build` grün, ESLint sauber.
