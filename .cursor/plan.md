/plan for {{SCOPE}} changes with strict focus on real runtime issues only.

## CONTEXT RULE

This is a single-instance portfolio app (Vercel + AnalogJS + Angular).

Backend exists only for:
- UI enhancement
- AI enrichment
- lightweight analytics
- optional SSE updates

Do NOT treat this as a backend system.

---

## HARD RULES (MANDATORY)

- Only plan fixes for **verified runtime problems**
- Do NOT introduce architecture changes unless required to fix a bug
- Do NOT add redundancy “for safety”
- Do NOT split systems into layers unless there is a real failure reason
- Fix root cause first, not architectural abstractions

Each step must:
- solve a real issue
- not introduce new layers unnecessarily
- preserve current runtime behavior unless explicitly broken

---

## OUTPUT

- **Goal**: one-line summary
- **Prerequisites**: only real requirements (env, DB, etc.)
- **Step-by-step plan**:
  Each step must include:
  - file(s)
  - exact change type
  - dependency reasoning (why this step comes here)
  - expected runtime effect

- **Verification**:
  must describe real observable behavior (API response, UI behavior, logs)

- **Rollback strategy**:
  only if change is risky

---

## STRICT

- No speculative fixes
- No distributed-system assumptions
- No multi-layer redesigns
- No unnecessary abstraction
- No “best practice” changes without runtime impact