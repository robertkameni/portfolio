# Humanize twin chat system prompts

Datum: 2026-11-19  
Status: Approved design — pending implementation plan  
Follow-on to: `2026-11-19-humanize-public-copy-design.md` (public copy deferred chat/agent prompts)

## Goal

Rewrite twin-chat **system instruction** prose in `prompt-helpers.ts` with the humanizer skill so the instruction text itself has fewer AI-writing tells, without changing any behavioral rule the model must follow.

Motivation: the public-copy pass left chat/agent prompts out. Those strings are not indexed, but they shape every twin reply; stock AI diction in the instruction can bleed into answers. Specs already note that the model imitates prompt punctuation and shape.

## Decisions locked

- **Scope (Option A):** Twin chat system prompts only — `src/server/api/ai/chat/prompt-helpers.ts` (`buildSystemInstruction`, `buildIntentHint`, `projectContextRules`, mode/capability/scheduling strings assembled there) plus matching updates to `prompt-helpers.spec.ts`.
- **Out of scope:** `visitor.agent.ts` and other internal analyzer prompts; UI i18n chat strings (already humanized); live LLM smoke tests; splitting the file into modules.
- **Behavior lock (Option A):** Keep every rule, intent label, length band, banned-pattern list, employer/engagement fact (DATEV permanent employee, no freelance), first-person voice requirements, dash ban, and case-study isolation rules. Only wording and rhythm of the instruction sentences may change. Do not merge or drop rules.
- **Verification (Option A):** Spec lock — keep/update `prompt-helpers.spec.ts` substring and regex pins so critical behaviors remain asserted. No required manual chat smoke; no golden live-reply fixtures.
- **Landing (Option A):** New branch `feat/humanize-chat-prompts` from `main` → separate PR (not stacked on #28 / `feat/humanize-public-copy`).
- **Approach (1):** Sectioned humanizer pass over the existing builder (not extract-modules-then-humanize, not inventory-only minimal diff).

## Architecture

Single source: `buildSystemInstruction` and helpers in `prompt-helpers.ts` produce one system string consumed by `stream.post.ts` / scheduling stream paths. No new files, no API changes, no DB.

Section order for the rewrite (align with current structure):

1. Identity / audience / goal / tone  
2. Capability / Cal.com rules  
3. VOICE (first person)  
4. Page-already-read / ABOUT TEXT rules  
5. Case-study / PROJECT CONTEXT rules (`projectContextRules`)  
6. Openings / experience / SHAPE  
7. WRITING RULES (including bans the model must obey in replies)  
8. ENGAGEMENT (DATEV / freelance)  
9. Mode-specific blocks (`concise_recruiter` / `storytelling_recruiter`)  
10. `buildIntentHint` intent strings  

Humanizer file mode: change instruction string literals only. Keep TypeScript structure, exports, option flags, and profile-injection placeholders.

## Behavior lock (checklist)

These must still be present after rewrite (wording may shift; meaning must not):

| Area | Must keep |
|------|-----------|
| Identity | Speak as Robert Kameni Namou / “I” only; no third-person “Robert …” |
| Audience | Recruiters / hiring managers as primary |
| Length bands | Concise 50–140; storytelling 120–220; case-study retell 120–180; practical Qs stay concise |
| Page rules | Assume ABOUT TEXT already read; do not paraphrase chronology; no meta “the page/site” |
| Case study | One study only; no inventing from PROJECT CONTEXT list; no DATEV closer when retelling another product |
| Writing bans | No em/en dashes in **built** instruction strings; ban “not X but Y”; no asterisk emphasis; no forced threes; brochure-word ban list |
| Engagement | Permanent DATEV employee; refuse freelance/side projects in 1–2 sentences |
| Intents | Existing intent labels and their action rules (freelance, availability, backend, etc.) |

When a spec pins an exact phrase (e.g. `speak only as "I"`, `THE PERSON ALREADY READ THE PAGE`, German fail examples like `der Teil, der`), either keep that anchor or update the spec to an equivalent explicit pin in the same commit—never drop the pin.

## Process

1. Ensure branch `feat/humanize-chat-prompts` is based on current `main`.
2. Mark AI tells in instruction sections; rewrite with humanizer skill (file mode).
3. Behavior-lock pass: compare old vs new for lost rules/numbers/bans.
4. Update `prompt-helpers.spec.ts` only where exact strings changed.
5. Run `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`.
6. Human approve unified diff → commit → open PR.

## Testing & success

- **Gate:** `prompt-helpers.spec.ts` green.
- **Success:** Instruction prose is plainer and less stock-AI; all behavior pins still hold; built strings still contain no U+2013/U+2014.
- **Non-goals:** Measuring live reply quality; changing tool wiring or intent detection heuristics beyond string copy.

## Risks

- Softening rule language can reduce model compliance → mitigate with behavior lock + substring specs.
- Large single-file diff → review by section headers in the PR description.
- Parallel open PR #28 (public copy) is independent; merge order does not matter for this file set unless `main` moves—rebase if needed before PR.

## Files

| Path | Action |
|------|--------|
| `src/server/api/ai/chat/prompt-helpers.ts` | Humanize instruction string literals |
| `src/server/api/ai/chat/prompt-helpers.spec.ts` | Adjust exact-match assertions |
| `docs/superpowers/specs/2026-11-19-humanize-chat-prompts-design.md` | This design |

## Out of scope (explicit)

- Visitor intelligence agent prompts  
- Chat UI chrome in `de.ts` / `en.ts`  
- Refactoring prompt assembly into multiple modules  
- Adding new twin capabilities or tools  
