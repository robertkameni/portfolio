# Humanize Twin Chat System Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Humanize model-facing instruction strings in `prompt-helpers.ts` without changing any twin behavioral rule, and keep `prompt-helpers.spec.ts` green.

**Architecture:** Sectioned humanizer pass over existing builders (`buildSystemInstruction`, `buildIntentHint`, `projectContextRules`, `buildSchedulingRules`, mode/capability arrays). No new modules, no API/DB changes. Behavior lock mirrors the public-copy fact-lock: every rule, length band, ban list, and engagement fact must survive.

**Tech Stack:** TypeScript, Vitest, humanizer skill (`C:\Users\lucas\.claude\skills\humanizer\SKILL.md`), Analog/Angular chat twin.

**Spec:** `docs/superpowers/specs/2026-11-19-humanize-chat-prompts-design.md`

## Global Constraints

- Branch: `feat/humanize-chat-prompts` (from `main`); separate PR from public-copy #28.
- Touch only instruction **string literals** in `src/server/api/ai/chat/prompt-helpers.ts` plus assertion updates in `prompt-helpers.spec.ts`.
- Do **not** edit `detectResponseMode`, `scoreProject`, `selectRelevantProjects`, `buildProjectPromptContext` logic, `visitor.agent.ts`, or i18n.
- Behavior lock: keep length bands `50-140`, `120-220`, `120-180`; DATEV permanent / no freelance; first-person “I”; no em/en dashes in **built** instruction strings; case-study isolation; brochure-word ban list; intent labels.
- Prefer keeping high-value spec anchors (`speak only as "I"`, `THE PERSON ALREADY READ THE PAGE`, `der Teil, der`, etc.). If an anchor must change, update the matching `toMatch`/`toContain` in the same commit.
- Human approve the unified diff before the final commit/PR push if working with a human gate; otherwise commit after green specs.
- Humanizer skill in **file mode** for prose literals only.

## File map

| File | Responsibility |
|------|----------------|
| `src/server/api/ai/chat/prompt-helpers.ts` | All twin system instruction assembly |
| `src/server/api/ai/chat/prompt-helpers.spec.ts` | Behavior pins for instruction text |
| `docs/superpowers/specs/2026-11-19-humanize-chat-prompts-design.md` | Approved design (already committed) |

---

### Task 1: Baseline — green specs + assertion inventory

**Files:**
- Modify: none yet
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`
- Read: `src/server/api/ai/chat/prompt-helpers.ts` (full file)

**Interfaces:**
- Consumes: current `buildSystemInstruction`, `buildIntentHint`, `CASE_STUDY_PREFIX`
- Produces: a short written inventory of regex/`toContain` anchors that must survive (paste into the PR description or a local note under `.superpowers/sdd/` — do not commit `.superpowers/` notes)

- [ ] **Step 1: Confirm branch and baseline**

```bash
git branch --show-current
# expect: feat/humanize-chat-prompts
npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts
```

Expected: all tests PASS on unmodified helpers.

- [ ] **Step 2: Inventory behavior anchors**

From `prompt-helpers.spec.ts`, list every assertion that matches instruction text (examples that exist today):

- `/speak only as "I"/i`
- `/never write about yourself in the third person/i`
- `/Robert can clarify that/i` (negative example that must remain in the prompt)
- no `[\u2014\u2013]` in `instruction()` or intent hints
- `/THE PERSON ALREADY READ THE PAGE/i`
- `/do not paraphrase it/i`
- `ABOUT TEXT`
- `/do not end with a question by default/i`
- `/never close with an offer/i`
- tenure / experience openings
- `/never announce a turn or a highlight/i` and `/der Teil, der/i`
- case-study / walkthrough rules
- freelance / DATEV engagement
- length / mode strings as asserted in the file

Save this list for Task 2–3 behavior-lock checks. Do not change production code in this task.

- [ ] **Step 3: Commit nothing (or docs-only if you added an allowed inventory file under `docs/`)**

If no docs file was added, skip commit. Task 1 is complete when baseline is green and the anchor list exists for the implementer.

---

### Task 2: Humanize core system instruction (identity → ENGAGEMENT + modes + scheduling)

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` — string literals inside:
  - `buildSystemInstruction` (identity through ENGAGEMENT, `modeSpecificRules`, `capabilityRules`, `aboutTextLengthRule`, `reasoningRule`)
  - `buildSchedulingRules`
- Do **not** rewrite `buildIntentHint` or `projectContextRules` yet (Task 3)
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Consumes: humanizer skill; Global Constraints; Task 1 anchor list
- Produces: humanized core instruction sections; same function signatures

- [ ] **Step 1: Read humanizer skill**

Read `C:\Users\lucas\.claude\skills\humanizer\SKILL.md` fully. Use file mode: only final prose into string literals.

- [ ] **Step 2: Rewrite core sections**

In `buildSystemInstruction` / `buildSchedulingRules`, humanize AI-sounding instruction prose while keeping:

- Name `Robert Kameni Namou` and first-person rules (including third-person fail examples)
- Header-style labels that specs pin (e.g. `THE PERSON ALREADY READ THE PAGE`, `WRITING RULES:`, `ACTIVE MODE: concise_recruiter.`) unless you intentionally update specs in Task 4
- Length numbers: `50-140`, `120-220`, `120-180`
- Brochure ban list words
- Dash ban (and do not introduce U+2013/U+2014 into any new string)
- DATEV / freelance ENGAGEMENT facts
- Scheduling tool rules (`get_availability`, `book_meeting`, `/contact`, email)

Leave TypeScript control flow unchanged.

- [ ] **Step 3: Run specs (expect possible FAIL on exact substrings)**

```bash
npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts
```

Expected: FAIL only on changed exact phrases, OR PASS if anchors preserved. Do not “fix” by deleting assertions.

- [ ] **Step 4: Behavior-lock diff check**

Diff old vs new strings. Confirm no lost rule from the Task 1 list for sections touched in this task. Restore any accidental drop before continuing.

- [ ] **Step 5: Commit (optional checkpoint)**

```bash
git add src/server/api/ai/chat/prompt-helpers.ts
git commit -m "copy(chat): humanize twin system instruction core sections"
```

If specs still fail, either keep working uncommitted into Task 3–4 or commit only after Task 4 greens — prefer **one green commit** covering Tasks 2–4 if intermediate commits would be red.

---

### Task 3: Humanize `projectContextRules` + `buildIntentHint`

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` — `projectContextRules`, `buildIntentHint`
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Consumes: humanizer skill; existing intent labels (`freelance_availability`, `availability_setup`, `backend_collaboration`, `measurable_impact`, `general_recruiter_screening`)
- Produces: humanized intent/case-study instruction strings; same exports

- [ ] **Step 1: Rewrite `projectContextRules`**

Keep: empty vs attached case-study branches; 120–180 retell; practical-question override (rate/salary/availability/location/start date + German equivalents); ban on inventing walkthroughs from PROJECT CONTEXT; ban on DATEV closer when retelling another product; word-count rules.

- [ ] **Step 2: Rewrite `buildIntentHint`**

Keep every INTENT label name and the action rules (freelance → DATEV permanent 1–2 sentences; availability → hiring facts only; backend → API contract collaboration; impact → strongest defendable number). Smooth diction only. No new intents. No em/en dashes.

- [ ] **Step 3: Run specs**

```bash
npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts
```

Expected: failures only from intentional substring drift.

- [ ] **Step 4: Full behavior-lock pass**

Walk the Task 1 checklist against the full built instruction for:

```ts
buildSystemInstruction(profile, projects, '', 'concise_recruiter', buildIntentHint('Tell me about Angular'), {})
buildSystemInstruction(..., 'storytelling_recruiter', ...)
buildSystemInstruction(..., { caseStudy: 'CASE STUDY ...' })
buildSystemInstruction(..., { schedulingMode: true, calcomEnabled: true })
buildSystemInstruction(..., { schedulingMode: true, calcomEnabled: false })
```

Confirm no U+2013/U+2014 anywhere in those outputs.

---

### Task 4: Align specs, green gate, human approve, PR

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.spec.ts` (only assertions whose exact text changed)
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` if lock gaps found
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Consumes: Tasks 2–3 output
- Produces: green suite; commit; PR

- [ ] **Step 1: Update failing assertions to equivalent pins**

For each failed `toMatch`/`toContain`, either:

1. Restore the original anchor phrase in `prompt-helpers.ts`, or  
2. Change the assertion to the new wording **that still proves the same rule**.

Never delete a behavior pin without a replacement.

Example pattern:

```ts
// Before
expect(text).toMatch(/do not paraphrase it/i);
// After (only if the instruction was rephrased deliberately)
expect(text).toMatch(/do not (paraphrase|restate) it/i);
```

- [ ] **Step 2: Run the gate**

```bash
npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts
```

Expected: all PASS.

- [ ] **Step 3: Present unified diff for human approve**

```bash
git diff -- src/server/api/ai/chat/prompt-helpers.ts src/server/api/ai/chat/prompt-helpers.spec.ts
```

Wait for **approve** if a human gate is active.

- [ ] **Step 4: Commit**

```bash
git add src/server/api/ai/chat/prompt-helpers.ts src/server/api/ai/chat/prompt-helpers.spec.ts
git commit -m "copy(chat): humanize twin system prompts with behavior lock"
```

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin HEAD
gh pr create --title "copy(chat): humanize twin system prompts" --body "$(cat <<'EOF'
## Summary
- Humanize twin chat system instruction prose in `prompt-helpers.ts` (sectioned pass).
- Behavior lock: length bands, voice, DATEV/freelance, writing bans, case-study rules, intents unchanged in meaning.
- Spec pins updated only where exact wording shifted.

## Test plan
- [ ] `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts` green
- [ ] Spot-check built instruction has no U+2013/U+2014
- [ ] Confirm PR does not touch `visitor.agent.ts` or i18n

EOF
)"
```

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Scope: prompt-helpers only | Tasks 2–4 |
| Behavior lock checklist | Tasks 2–3 Step 4, Task 4 |
| Sectioned humanizer approach | Tasks 2–3 |
| Spec-lock verification | Tasks 1, 4 |
| Branch from main / separate PR | Task 4 Step 5 |
| Out of scope (visitor, i18n, modules) | Global Constraints |
| Dash ban on built strings | Tasks 2–3 lock + Task 4 |
| Human approve before finish | Task 4 Step 3 |

## Plan self-review

- Spec coverage: all locked decisions mapped to tasks.  
- No TBD/placeholder steps.  
- Function names match codebase: `buildSystemInstruction`, `buildIntentHint`, `projectContextRules`, `buildSchedulingRules`.  
- TDD adapted: Task 1 baseline green → rewrite → expect substring FAIL → Task 4 restore pins → green.
