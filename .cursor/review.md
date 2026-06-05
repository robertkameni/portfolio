/review {{SCOPE}} with strict focus on runtime correctness in a portfolio-grade Angular 22 + AnalogJS application.

For Angular API or best-practice feedback, verify claims with the **Angular CLI MCP server** (`search_documentation`, `get_best_practices`) before flagging issues.

## CONTEXT (MANDATORY INTERPRETATION RULE)

This project is:
- single-instance (Vercel deployment)
- NOT a distributed system
- NOT a backend platform
- NOT expected to scale horizontally

All backend logic exists ONLY to support UI features (AI, analytics, SSE, ingestion).

You MUST evaluate it as a UI-enhancement backend, not an infrastructure system.

---

## HARD RULES (MANDATORY)

- Only report issues that are **actually reachable in current runtime execution**
- Do NOT propose distributed systems design
- Do NOT introduce architectural redesigns unless a real runtime bug exists
- Do NOT suggest redundancy "for safety" unless a failure is demonstrably possible
- Do NOT evaluate scalability, load balancing, clustering, or multi-instance correctness

Before reporting an issue, verify:
- Does this break actual runtime behavior?
- Or is it already prevented by an existing layer?

If not runtime-impacting → ignore it.

---

## OUTPUT

- **Context**: What part of src/server is actually being reviewed
- **Architecture/Flow Description**: factual runtime flow only (no design interpretation)
- **Good Practices (exactly 3)**:
  - must reflect real implementation decisions
- **Issues (exactly 3 max)**:
  Each issue must include:
  - concrete file/module
  - runtime impact only
  - why it is reachable in THIS deployment model
  - minimal fix (no redesigns)
- **Optional Improvement (max 1)**:
  only if it improves runtime correctness directly

---

## STRICT ENFORCEMENT

- No theoretical problems
- No distributed systems concerns
- No “could scale better” suggestions
- No duplicated concerns across layers
- No multi-step architectural refactors
- No speculative failure modes

Every statement must be tied to observable runtime behavior in code.