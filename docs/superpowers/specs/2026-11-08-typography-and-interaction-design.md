# Typo-Rhythmus und Interaktion

Datum: 2026-11-08
Status: umgesetzt
Vorgänger: `2026-11-08-project-evidence-design.md`

## Teil B: Typografie und Rhythmus

### Befund

Ein Audit der Startseite zeigte, dass von 130 Textknoten 67 unter 13px lagen.
Alle 67 gehörten zu **einer** Klasse: `.type-meta` (12px, uppercase, Mono,
0.08em Sperrung). Es war also kein Streuproblem, sondern eine Ebene, die zu
klein und zu häufig auftrat.

Zusätzlich:

- Masthead 869px hoch bei einem 844px-Viewport: der Hero passte nicht mehr.
- 12 von 17 interaktiven Zielen lagen unter 40px Höhe (kleinste: 15px).
- Die Tag-Zeile einer Projektzeile war 85px hoch, weil elf Mono-Tags auf vier
  Zeilen umbrachen und die Beschreibung nach unten drückten.
- Abschnittsabstände waren auf Mobilgeräten so groß wie auf dem Desktop.

### Änderungen

1. `--text-meta` von 12px auf 13px. Nichts auf der Seite liegt jetzt unter 13px.
2. Masthead: Portrait auf Mobil auf 15rem begrenzt (20rem ab `md`), oberes
   Padding reduziert. Höhe 869px auf 744px bei 844px Viewport.
3. `.tap-area`: ein Pseudo-Element, das die Trefferfläche kleiner Mono-Links auf
   44px Höhe bringt, ohne Schriftgröße oder Zeilenabstand anzutasten. Das
   Pseudo-Element gehört zum Link, Klicks darauf zählen als Klick auf den Link.
   Verwendet für Social-Links, Toolbar-Marke, „Alle Projekte", „Live ansehen",
   Umschalter und Backdrop-Button.
4. Projekt-Tags auf vier sichtbare gekürzt, der Rest als `+N` im Akzentton.
   Die Tag-Zeile fällt von 85px auf 18px. Die Detailseite zeigt weiterhin alle.
5. Abschnittsabstände: `py-16 md:py-24` statt `py-24`, Projekte `py-16 md:py-20`.

### Nicht geändert

- Keine Eyebrow entfernt: es gibt genau eine über einer Überschrift
  (`skills-bento`), das liegt innerhalb des Limits.
- Keine Inhalte gekürzt, um eine Kennzahl zu treffen. Die Seite ist auf Mobil
  länger geworden, weil echte Screenshots dazugekommen sind.

## Teil C: Interaktion

### Verworfene Idee: Tag-Filter

54 verschiedene Tags bei 8 Projekten. Ein Filter über Roh-Tags wäre eine Wand
aus 54 Schaltflächen gewesen. Auch nach Normalisierung blieben 18 Optionen, die
je nur zwei bis vier Projekte zeigen. Das ist eine Datenbank-Ansicht, kein
Portfolio.

### Gebaut: Stack-Filter

Stattdessen eine abgeleitete Achse: Framework-Familie.

- `stackFamilies(tags)` bildet `Angular*` auf `angular` und `Next.js*` /
  `React*` auf `react` ab. Abgeleitet, nie gespeichert: `Angular 23` in den
  Daten braucht keine Migration.
- Wortgrenze im Muster, damit `Angularly` oder `Reactive` nicht treffen.
- Es werden nur Familien angeboten, die in den Daten vorkommen, sortiert nach
  Anzahl. Ein Filter kann also nie eine leere Liste erzeugen.
- Umsetzung als `role="group"` mit `aria-pressed`-Schaltflächen, die das
  bestehende `.toolbar-option`-Muster nutzen (44px, Akzent-Unterstrich).
  Die Anzahl steht sichtbar daneben und im `aria-label`.
- Ergebnis: Alle 8, Angular 5, React & Next.js 3.

### Gebaut: Screenshot-Zoom

Ein Screenshot, der bei 16:10 lesbar bleibt, ist zu klein, um die UI darin zu
lesen. Deshalb:

- Der Screenshot auf der Detailseite ist ein `cursor-zoom-in`-Button mit
  `aria-label` und öffnet das Bild in voller Auflösung (1202x752 bei 1440x900).
- Natives `<dialog>` mit `showModal()`: Fokus-Falle, Escape und Top-Layer
  kommen von der Plattform statt aus eigenen Listenern.
- Schließen über Button, Backdrop-Klick und Escape; der Fokus kehrt zum
  Auslöser zurück, das Scroll-Lock wird freigegeben.
- Backdrop-Klick wird über `event.target === dialog` erkannt, weil der Dialog
  das ganze Viewport füllt und `::backdrop` selbst keine Klicks bekommt.

### Gebaut: Screenshot als Link

Der Screenshot in der Projektzeile ist jetzt ebenfalls ein Link auf das
Projekt. Er ist das größte Element der Zeile, und wer darauf tippt, erwartet
die Fallstudie, nicht Stillstand.

## Verifikation

- Filter: 8 Reihen ohne Auswahl, 5 mit Angular, 3 mit React; `aria-pressed`
  wechselt korrekt; Reihenfolge nach Anzahl.
- Zoom: Bild 1202x752 bei 1440x900; Escape, Button und Backdrop schließen;
  Fokus kehrt zum Auslöser zurück; Scroll-Lock wird in allen drei Pfaden
  freigegeben.
- Backdrop-Pixel: (27,28,30) im hellen, (11,12,13) im dunklen Theme.
- Masthead 744px bei 844px Viewport, Portrait 240x300, kein horizontaler
  Überlauf bei 391px Breite.
- Tag-Zeile 85px auf 18px.
- 133 Tests grün, `npm run build` grün, ESLint sauber.

## Offen

- Der ATLAS-BIO-Screenshot ist sehr blass (Minzweiß). Als Thumbnail trägt er
  weniger als die drei anderen. Ein Scroll-Ausschnitt mit Inhalt statt des
  Hero wäre die bessere Aufnahme.
