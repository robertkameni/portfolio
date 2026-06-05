/analyse {{SCOPE}} with strict focus on factual runtime behavior only.

## CONTEXT RULE

This is a portfolio-grade Angular 22 + AnalogJS application.

It is:
- single-instance
- UI-first backend
- not a distributed system
- not infrastructure-critical

Only evaluate actual runtime behavior.

For Angular API or pattern claims in the analysis, verify with the **Angular CLI MCP server** (`search_documentation`, `get_best_practices`) — do not rely on memory alone.

---

## HARD RULES (MANDATORY)

- Separate FACTS from INTERPRETATION
- Only report issues that are observable in code execution
- Do NOT assume failure scenarios unless code path proves it
- Do NOT suggest architectural redesigns
- Do NOT treat missing enterprise patterns as issues

If something is not causing runtime risk → it is NOT an issue.

---

## OUTPUT

- **Scope**: what is actually analyzed
- **Structure**: factual modules + entry points only
- **Issues (only real runtime issues)**:
  Each must include:
  - file/module
  - runtime impact
  - why it is reachable in execution
  - severity (high/medium/low)

- **Dependencies**:
  only real external/internal dependencies

- **Opportunities**:
  only improvements that do NOT change architecture

- **Risk Assessment**:
  only runtime risks, not theoretical risks

---

## STRICT

- No speculative problems
- No distributed systems reasoning
- No architecture redesign suggestions
- No duplication across sections
- No “this could scale better” statements