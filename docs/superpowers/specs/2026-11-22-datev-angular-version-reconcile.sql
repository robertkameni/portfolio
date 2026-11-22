-- DATEV Kanzlei Platform: reconcile the Angular version drift.
--
-- The record contradicted itself: the lead said "Angular 22", the architecture
-- bullet said "Angular 20", and the stack list said "Angular 21". The slug
-- (`...-angular20`) is the version the platform started on; the profile and CV
-- both say the DATEV stack is on 22 today. This patch makes the German source
-- and the English translation say exactly that, and nothing else.

UPDATE projects
SET
  "description" = $de$Technical Lead Frontend für die Kanzleiverwaltungs-Plattform: Architektur mit 2 Scrum-Teams, Angular 22, Signals, NgRx Signal Store und über 50 Design-System-Komponenten.$de$,
  "contentMarkdown" = $de$
## Projektkontext

Bei DATEV haben wir eine Enterprise-Plattform zur Verwaltung von Kanzleien neu entwickelt, verteilt auf 2 Scrum-Teams im gleichen Produkt.

## Meine Rolle

Ich war Technical Lead Frontend und habe Architekturentscheidungen, technische Standards und komplexe Features mit umgesetzt.

## Architektur und Umsetzung

- Angular 20 beim Start, inzwischen Angular 22 mit Standalone Components und Signals
- State Management mit NgRx Signal Store
- UI-Architektur mit Angular Material
- Klare Feature-Schnittstellen für mehrere parallele Teams
- Teststrategie mit Jest und Cypress

## Konkreter Beitrag

- Frontend-Zielarchitektur definiert und teamübergreifend eingeführt
- Patterns für Performance und Wartbarkeit im Alltag verankert
- Architektur-Code-Reviews, Mentoring und Pair Programming
- Entwicklungseffizienz durch technische Standardisierung um ca. 30% gesteigert

Skalierung und Auslieferung sind stabiler geworden, Features kommen schneller und einheitlicher, und neue Teammitglieder sind früher produktiv.

## Tech Stack

Angular 22, Signals, Angular Material, NgRx Signal Store, TypeScript, Jest, Cypress, Git Flow, Confluence
$de$,
  "descriptionEn" = $en$Technical Lead Frontend for the law firm management platform: architecture with 2 Scrum teams, Angular 22, Signals, NgRx Signal Store, and more than 50 design system components.$en$,
  "contentMarkdownEn" = $en$
## Project context

At DATEV we rebuilt an enterprise platform for managing law firms, split across 2 Scrum teams on the same product.

## My role

I was Technical Lead Frontend and drove architecture decisions, technical standards, and complex features.

## Architecture and delivery

- Angular 20 at the start, now Angular 22 with standalone components and signals
- State management with NgRx Signal Store
- UI architecture with Angular Material
- Clear feature boundaries for several parallel teams
- Test strategy with Jest and Cypress

## Concrete contribution

- Defined the frontend target architecture and rolled it out across teams
- Embedded patterns for performance and maintainability in day-to-day work
- Architecture code reviews, mentoring, and pair programming
- Raised delivery efficiency through technical standardization by around 30%

Scaling and shipping became more stable, features landed faster and more consistently, and new team members were productive sooner.

## Tech stack

Angular 22, Signals, Angular Material, NgRx Signal Store, TypeScript, Jest, Cypress, Git Flow, Confluence
$en$
WHERE slug = 'datev-kanzlei-management-platform-angular20';
