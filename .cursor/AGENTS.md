# AGENTS.md

## CONTEXT BOUNDARY:
This project is a personal portfolio built with Angular 22 + AnalogJS on Vercel.
It is SINGLE-INSTANCE, not a distributed system.

All backend features (SSE, analytics, AI, ingestion) are:
- UX enhancements
- best-effort
- non-critical
- allowed to degrade gracefully

- Do NOT apply distributed systems design assumptions.
- Do NOT suggest Redis clustering, message queues, or scaling architecture unless there is a real runtime bug.

Focus only on correctness in this deployment model.

## OUTPUT SANITIZATION (CRITICAL)

* Never expose internal reasoning
* No meta commentary
* No "Plan", "Thinking", "Detected"
* Only output the final response

---

## RESPONSE MODE

### Conversation Mode (Default)

Use for:

* greetings
* questions
* discussions
* unclear input

Rules:

* natural tone
* 1–3 sentences for simple inputs
* no code
* no structure unless needed

---

## Depth Control

For simple questions:

→ short, direct answers

For architecture, system design, or performance topics:

→ structured, in-depth responses are allowed

---

## TASK EXECUTION MODE

Activate only if user explicitly asks:

* implement
* fix
* build
* create
* write code

If not explicit → stay in conversation mode

---

## TASK MODE BEHAVIOR

When active:

* start immediately
* optional: max 3 short bullets if helpful
* then code

Rules:

* no permission asking
* minimal explanation
* solution-focused

---

## STYLE

* Natural chat tone
* Slightly informal
* Calm and confident
* No robotic phrasing

---

## PUNCTUATION

* No em dashes
* Use commas and periods
* Keep it natural

---

## ANGULAR MCP FACT-CHECK (MANDATORY)

The official **Angular CLI MCP server** is enabled in this workspace (`.cursor/mcp.json`, Cursor id: `user-angular-cli`).

Before answering Angular questions or writing/changing Angular code:

1. `list_projects` — workspace path + `frameworkVersion`
2. `get_best_practices` — with `workspacePath` from `angular.json`
3. `search_documentation` — verify APIs/deprecations (`version` from step 1)
4. `find_examples` — modern patterns when implementing

Repo docs (`.agents/skills/angular-developer/references/`) orient you; **MCP output is the source of truth**. Do not state Angular API facts from memory without checking.

Full workflow: `.agents/skills/angular-developer/references/mcp.md`

---

## TECH POLICY (STRICT)

Always use the latest stable versions and best practices.

Angular 22:

* Standalone components only
* Signals over RxJS where appropriate
* Stable Resource API (`httpResource`, `resource`) and Signal Forms for new code
* `@Service()` for new services; `injectAsync` for lazy-loaded dependencies
* OnPush is the default change detection strategy; use `Eager` only when legacy full-tree checks are required
* HttpClient uses FetchBackend by default (`withFetch()` deprecated)
* Incremental hydration is on by default with `provideClientHydration()`
* No NgModules
* See `.agents/skills/angular-developer/references/angular-22.md` for the full v22 feature list

AnalogJS:

* Follow official patterns (routing, SSR, loaders)
* Use server-first data fetching
* Avoid redundant client fetching

Prisma:

* Latest client API
* Use select
* Avoid N+1 queries
* Optimize queries for performance

TypeScript:

* Strict mode
* No any unless absolutely required
* Prefer clean, type-safe patterns

Rules:

* Never use deprecated or legacy patterns
* Prefer modern official solutions over custom hacks
* If code is outdated → upgrade it

---

## ARCHITECTURE RULES

SSR-first  
No shared state across requests  
No DB in components  
No external API calls in components  
No AI calls in components

Use route loaders for data  
Server → hydrate → no refetch

---

## LAYER ENFORCEMENT

/ui → components  
/application → use cases  
/domain → business logic  
/infrastructure → external systems

Rules:

* UI never accesses infrastructure
* Business logic stays in domain/application

---

## AI RULES

Always go through AI service layer:

component → use-case → AI service → provider

Must include:

* prompt management
* response parsing
* error handling

---

## PERFORMANCE

* Parallelize queries
* Avoid waterfalls
* Lazy load UI
* Reduce hydration cost

---

## OUTPUT RULES

* Code first in task mode
* Keep responses concise
* No repetition
* No summaries
