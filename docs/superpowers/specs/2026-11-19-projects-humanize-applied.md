# Batch 4b — Project case studies humanize (applied)

**Date:** 2026-11-19  
**Branch:** `feat/humanize-public-copy`  
**DB:** Neon project `cold-boat-79495908` (`projects` where `isPublished = true`)

## What changed

For each published project, `description` and `contentMarkdown` were rewritten with the humanizer skill (German only; empty EN fields left empty). Fact-lock: numbers, employers, stack versions, routes, and feature claims preserved.

## Slugs updated

- `ai-engineering-team-simulator`
- `atlas-bio-micronutrition-pwa`
- `datev-kanzlei-management-platform-angular20`
- `deployment-control-platform-angular-monorepo-upgrade`
- `employee-management-system-angular-springboot`
- `factoring-modernization-angular15-omnia-optica`
- `hirepath-jobs-ai-job-analysis`
- `the-engineering-forge`

## Apply method

Parameterized `UPDATE` via local script (not checked in under `src/`): `.superpowers/sdd/apply-humanize-projects.mjs`, reading preview markdown from `.superpowers/sdd/humanize-projects/<slug>.md` (gitignored under `.superpowers/`).

## Out of scope

Chat/agent system prompts — deferred to a follow-on brainstorm.
