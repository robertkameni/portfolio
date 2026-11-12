# Fallstudie im Chat-Kontext

Datum: 2026-11-12
Status: Entwurf, zur Durchsicht

## Ausgangslage

Der Chat kennt Profil und Projektmetadaten. `loadChatPromptContext()` liest die veröffentlichten Projekte mit Titel, Beschreibung, Tags und `updatedAt`, `selectRelevantProjects()` nimmt die sechs passendsten, und `normalizeProjectSummary()` macht daraus eine Zeile pro Projekt. `contentMarkdown` bleibt draußen. Die About-Texte stehen auf der Seite, die der Besucher schon sieht. Eine Antwort, die nur daraus schöpft, wiederholt die Seite.

Die Detailseiten haben den Rest: was das Produkt tut, welche Rolle Robert hatte, wo es hakte, was dabei herauskam. Acht veröffentlichte Fallstudien, zusammen etwa 12.000 Zeichen, die längste rund 2.800. Englische Fassungen (`contentMarkdownEn`) sind leer. Die Texte sind schon nach Projektkontext, Rolle, Umsetzung, Beitrag, Impact und Stack gegliedert. Eine Installationsanleitung ist nicht dabei.

## Entscheidung

Pro Nachricht bekommt höchstens eine Fallstudie ihren vollen Text. Das ist das höchstbewertete Projekt, und nur dann, wenn die Bewertung über null liegt. Die übrigen Projekte bleiben die kurze Liste aus Titel, Beschreibung und Tags. Keine neuen Datenbankfelder, kein zweiter Modellaufruf, kein Abschnitt-Parser.

## Was in den Prompt kommt

`loadChatPromptContext()` liest zusätzlich `contentMarkdown`. Die Bewertung bleibt die heutige: Tag-Treffer, Titelwörter, bei Gleichstand das neuere `updatedAt`, dann der Titel. Die Punktwerte ändern sich nicht. Die Funktion, die die Punkte vergibt, wird exportiert, damit der Loader die Punktzahl des Siegers lesen kann, ohne die Sortierung nachzubauen.

Eine reine Funktion baut daraus zwei Texte:

- `projectSummary`: die bisherigen sechs Kurzzeilen, der Sieger eingeschlossen.
- `caseStudy`: leer, oder ein Block mit Titel und Markdown des Siegers.

`caseStudy` ist nur dann gefüllt, wenn der Sieger mehr als null Punkte hat und `contentMarkdown` nach dem Trim nicht leer ist. Der Block heißt im Prompt `CASE STUDY` und ist als die eine Geschichte markiert, die erzählt werden soll.

Über 4.000 Zeichen wird am letzten Absatzumbruch davor abgeschnitten. Absatzumbruch heißt die letzte Leerzeile vor der Grenze. Gibt es keine Leerzeile, gilt die letzte Zeilenschaltung. Ist der Text eine einzige Zeile, fällt er hart bei 4.000 Zeichen. Kein Auslassungszeichen, kein Hinweis, dass gekürzt wurde.

`buildSystemInstruction()` bekommt `caseStudy` als weiteres Argument. Eine reine Funktion davor blendet den Block aus, sobald der Buchungsmodus aktiv ist, auch wenn der Loader eine Fallstudie gefunden hat. Der Buchungspfad, die Werkzeuge und der Fallback bleiben unverändert. `contentMarkdownEn` wird nicht gelesen.

## Wie die Antwort klingt

Ist `CASE STUDY` vorhanden und die Frage keine Sachfrage zu Satz, Gehalt, Verfügbarkeit, Ort oder Startdatum, ersetzt diese Form die Längenvorgabe des aktiven Modus:

- eine gesprochene Fassung dieser einen Fallstudie
- vier Punkte in Prosa: was das Produkt ist, welcher Teil Roberts war, wo es hakte, was dabei herauskam
- etwa 120 bis 180 Wörter
- die Markdown-Überschriften sind Notizen, keine Gliederung zum Abschreiben
- die anderen Projekte aus `PROJECT CONTEXT` werden nicht der Reihe nach erzählt
- die Antwort folgt der Sprache der Frage; der deutsche Quelltext wird nicht vorher übersetzt

Eine Sachfrage gewinnt gegen diese Form, auch wenn beide Signale in derselben Nachricht stehen. Satz, Gehalt, Verfügbarkeit, Ort und Startdatum bleiben kurz, auch wenn ein Projektwort getroffen hat und der Block deshalb dabei ist. Die Fallstudie ersetzt dort keine fehlende Zahl.

Ist `CASE STUDY` leer, gibt es keinen erfundenen Rundgang aus Titeln und Einzeilern. Die kurze Liste darf einen Namen liefern, wenn nach weiteren Projekten gefragt wird. Die früheren Turns bleiben im Chat-Verlauf. Eine Nachfrage wie "und ein anderes?" trifft oft nichts, bekommt deshalb keinen zweiten Volltext und stützt sich auf Verlauf plus Kurzliste.

Die bestehende Anweisung, zuerst `PROJECT CONTEXT` zu nehmen, wird darauf zugeschnitten: vorhanden heißt die Geschichte `CASE STUDY`, die Kurzliste ist das Namensverzeichnis.

## Grenzen

- Leeres oder fehlendes `contentMarkdown` bei einem Treffer: kein `CASE STUDY`-Block. Die Kurzbeschreibung bleibt in der Liste.
- Punktzahl null: kein Block. Bis zu sechs Kurzzeilen, Sortierung wie heute.
- Keine veröffentlichten Projekte: der bisherige Fallback-Satz, kein Block.
- Datenbankfehler: unverändert der SSE-Fehler des Stream-Handlers. Kein eigener Fehlerkanal.
- Buchungsmodus: kein `CASE STUDY`-Block.

## Tests

In `prompt-helpers.spec.ts`, ohne Datenbank:

- Punktzahl null ergibt einen leeren Fallstudien-Block, die Kurzliste bleibt.
- Punktzahl über null mit Text ergibt Titel und Markdown nur für den Sieger. Ein zweites Projekt mit niedrigerer Punktzahl und eigenem Markdown taucht im Block nicht auf.
- Leeres Markdown trotz Treffer ergibt einen leeren Block.
- Ein Text über 4.000 Zeichen endet an der letzten Leerzeile vor der Grenze.
- Mit Block enthält die Systemanweisung die Vier-Punkte-Form, die 120-bis-180-Wörter-Grenze, die Ausnahme für Sachfragen und den Fallstudientext.
- Ohne Block fehlt die Vier-Punkte-Form, und die Anweisung verbietet den Rundgang aus der Kurzliste.
- Eine Sachfrage (Satz, Gehalt, Verfügbarkeit, Ort, Startdatum) behält die kurze Form, auch wenn der Block übergeben wird.
- Eine reine Funktion entscheidet, ob der Block übergeben wird. Im Buchungsmodus ist das Ergebnis leer, auch wenn der Loader eine Fallstudie gefunden hat. Die Systemanweisung enthält dann keinen `CASE STUDY`-Block.

`selectRelevantProjects()` behält seine bisherigen Tests. Punktwerte und Gleichstand bleiben.

## Nicht-Ziele

- Keine strukturierten Felder für Produkt, Rolle, Schwierigkeit und Ergebnis.
- Kein zweiter Modellaufruf, der das Projekt auswählt.
- Kein Mitschicken aller acht Volltexte.
- Keine Pflege von `contentMarkdownEn` in diesem Schritt.
- Kein Wissen darüber, auf welcher Seite der Besucher gerade steht.
- Keine Änderung an Buchungswerkzeugen, Ratenbegrenzung oder Besucherprofil.

## Betroffene Dateien

- `src/server/api/ai/chat/prompt-helpers.ts`
- `src/server/api/ai/chat/prompt-helpers.spec.ts`
- `src/server/api/ai/chat/chat-stream-shared.ts`
- `src/server/api/ai/chat/stream.post.ts` nur soweit, dass der Buchungsmodus die Ausblend-Funktion benutzt
