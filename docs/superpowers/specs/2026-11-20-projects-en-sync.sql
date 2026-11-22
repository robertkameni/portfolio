-- Sync English case-study fields for all published projects.
-- Fact-lock: numbers, employers, stack versions, routes, and feature claims match DE source.
-- Project: cold-boat-79495908
-- Apply after review. Source of truth for descriptionEn / contentMarkdownEn.

UPDATE projects
SET
  "descriptionEn" = $en$Six agents from PM through Reviewer discuss your product idea in real time.
Live stream, tool calls, saved runs, and cost per run.$en$,
  "contentMarkdownEn" = $en$
## What is it?

You describe a product or project idea. Six AI agents debate in turn in real time, from scope and architecture through to review. After that, four deliverables are generated in a structured way and stored permanently.

## Core features

- Adaptive team: automatic classification as software, construction/compliance, or hybrid project, including matching role titles, prompts, and artifact tabs
- 6-agent pipeline: PM → Architect → Backend → Frontend → DevOps → Reviewer (Reviewer can reject turns)
- Live streaming: SSE debate with tool calls (npm package checks, standards search) and live activity badges
- Structured artifacts: Requirements, Architecture, Implementation, Review via Zod schema and `generateText` + `Output.object`
- Persistence and replay: runs in Neon Postgres; sidebar history; SSR replay at `/runs/[id]`
- Auth and ownership: guest sessions or email/password (JWT); runs belong to the session or account
- Transparency: token usage and estimated API cost per run
- Export: Markdown export (after sign-in); rate limiting via Upstash Redis in production

## Technical stack

| Area | Technology |
|---------|-------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui |
| AI | Vercel AI SDK 6, DeepSeek v4 (Flash + Pro), Tool Calling |
| Backend | Node.js API Routes, SSE, Server Actions |
| Database | Prisma 7, Neon Postgres |
| Auth | JWT (`jose`), bcrypt, guest session cookies |
| Infra | Vercel, Upstash Redis (rate limits) |

## Architecture highlights

- Sequential multi-agent orchestration with a shared transcript context
- Template routing (`software` / `physical` / `hybrid`) before the debate starts
- Stream resilience: fallbacks for empty reasoning streams, retry logic, Reviewer decisions from raw text
- SSR for saved runs (`SavedRunWorkspace`, static message thread) for performance
- Glass design system with container queries: desktop artifact panel, mobile bottom sheets

## Example flow

1. Enter an idea on the landing page
2. The team is classified and assembled
3. Six agents stream short Slack-style turns
4. Artifacts are synthesized on the server
5. Redirect to `/runs/[id]`: replay the debate, read artifacts, export

## What I demonstrated here

End-to-end product from idea to a live application: LLM orchestration, streaming UX, structured outputs, auth/ownership, production deployment, and error handling for streams and Reviewer decisions.
$en$
WHERE slug = 'ai-engineering-team-simulator';

UPDATE projects
SET
  "descriptionEn" = $en$Micronutrition PWA: for every vitamin, mineral, and plant you see what it does, which form makes sense, and when supplementation is reasonable, plus a catalog with 29 products. Offline, no account.$en$,
  "contentMarkdownEn" = $en$
## What is it?

ATLAS-BIO explains micronutrition. For every vitamin, mineral, and plant you get what it is for, which form is sensible, and when supplementation is justified, plus precautions and sources. The catalog lists 29 over-the-counter products across 12 situations, each with the composition published by the manufacturer. Each profile includes a daily tip. The app runs offline and needs no account.

## Three entry points, no anatomical navigation

Navigation follows need, not body parts. Organs appear on the detail sheet, not in the menu.

| Entry | Route | Content |
|---|---|---|
| Need | `/besoins` | One situation, what you know, what does not work, when to see a doctor |
| Product | `/produits` | Composition line by line, cited studies, what the product does not do |
| Nutrient | `/nutriments` | Index of nutrients, paginated, with a profile sheet per active ingredient |
$en$
WHERE slug = 'atlas-bio-micronutrition-pwa';

UPDATE projects
SET
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

UPDATE projects
SET
  "descriptionEn" = $en$Deployment control platform at W&W Informatik: new web components, frontend performance work, and a step-by-step monorepo upgrade from Angular 15 to 16.$en$,
  "contentMarkdownEn" = $en$
## Project context

At W&W Informatik, several Scrum teams run an enterprise platform that steers deployment processes and makes them easy to follow.

## My role

As a frontend developer I owned new components, performance topics, and ongoing care of the technical platform.

## Architecture and delivery

- Angular 15 as the baseline; guided the team upgrade path to Angular 16
- Monorepo with clearly structured feature areas
- State management with NgRx, data flows with reactive RxJS patterns
- Integration with backend services via REST/JSON
- Tests with Cypress and Jasmine/Karma

## Concrete contribution

I built new UI blocks so operators quickly see what to do next in the screens. I narrowed performance issues with profiling and fixed them at the source instead of optimizing blindly. Production defects were traced, analyzed, and closed. I prepared larger technical changes and rolled them out in small, controlled steps.

## Impact

User guidance is clearer in deployment-critical workflows. Releases are more stable, and the codebase is on Angular 16 so the monorepo can keep growing.

## Tech stack

Angular 15/16, TypeScript, RxJS, NgRx, Angular Material, REST/JSON, Cypress, Jasmine/Karma, Docker, Git Flow
$en$
WHERE slug = 'deployment-control-platform-angular-monorepo-upgrade';

UPDATE projects
SET
  "descriptionEn" = $en$Employee management in a small Scrum team: from analysis and design through frontend delivery, test strategy, and performance tuning.$en$,
  "contentMarkdownEn" = $en$
## Project context

A small, focused team needed to deliver an employee management system with a short time to market.

## My role

I owned the frontend from analysis through design, implementation, and testing.

## Architecture and delivery

- Angular 14 with Angular Material
- NgRx for structured state
- Nx monorepo for clear module separation
- REST/JSON integration with a Spring Boot backend
- Test strategy with Jest and Cypress

## Concrete contribution

- Turned business requirements into UI and component architecture
- Implemented core admin workflows with solid performance
- Built tests alongside feature development
- Performance optimizations for fast interactions in the main flows

## Impact

The system went live quickly: maintainable code structure, a solid test base, and UX you could build on.

## Tech stack

Angular 14, TypeScript, RxJS, NgRx, Angular Material, Nx, Spring Boot, REST/JSON, Jest, Cypress, Docker, Git Flow
$en$
WHERE slug = 'employee-management-system-angular-springboot';

UPDATE projects
SET
  "descriptionEn" = $en$New factoring software replacing a legacy system at Omnia Optica.
Focus: reliable delivery, performance, and fixes in live operation within a large Scrum setup.$en$,
  "contentMarkdownEn" = $en$
## Project context

At Omnia Optica we replaced an existing billing solution with new factoring software. The effort ran as a large, multi-team project in a Scrum rhythm.

## My role

As Senior Frontend Developer I owned core features, frontend stabilization, and technical evolution.

## Architecture and delivery

- Angular 15 with RxJS and NgRx
- Complex data views with AG-Grid
- REST/JSON to backend APIs with clear contracts
- Framework and dependency updates during active delivery
- Quality assurance with Jasmine/Karma and Cypress

## Concrete contribution

- Delivered business-critical frontend features from analysis through deployment
- Reproduced production issues, clarified root causes, and fixed them permanently
- Reduced performance bottlenecks and improved rendering behavior
- Improved maintainability through consistent patterns and clear component structure

Releases shipped faster, operations grew more stable, and the UI stayed usable in a dense factoring domain.

## Tech stack

Angular 15, RxJS, NgRx, TypeScript, Angular Material, AG-Grid, REST/JSON, Cypress, Jasmine/Karma, Docker, Git Flow
$en$
WHERE slug = 'factoring-modernization-angular15-omnia-optica';

UPDATE projects
SET
  "descriptionEn" = $en$AI analysis for job postings with salary fairness, ghost-job risk, and red flags,
plus contact strategy and a ready-to-send outreach message.$en$,
  "contentMarkdownEn" = $en$
## Project description

HirePath Jobs analyzes job listings with AI. Applicants get structured assessments, risks, and an outreach strategy without decoding vague job text line by line.

Web scraping, normalization, and a multi-stage AI pipeline turn unstructured postings into evaluations: competition level, ghost job risk, salary fairness, red flags, and more.

When automatic scraping is blocked (for example on LinkedIn or Indeed), users paste the description manually. The flow continues.

## Core features

### AI-assisted job analysis

- Competition level with reasoning
- Ghost job detection
- Salary fairness estimate
- Red flags and positive signals
- Final verdict: apply or not

### Personalized outreach

- Contact strategy tailored to the posting
- AI-generated outreach message based on the user profile

### Robust data capture

- Automatic scraping of job postings
- Fallback via manual job description entry
- Polling-based async pipeline for long-running AI steps
- Partial results and fallback handling

### Caching

- Avoids redundant AI calls
- Shorter runtimes and lower API cost

## Architecture

Full-stack monorepo: frontend, backend, and shared types are separate but live in the same repo.

### Frontend (Angular)

- Reactive UI with Angular Signals
- State and UX for long-running tasks

### Backend (NestJS)

- Modular REST API
- Orchestration of the AI pipeline
- Scraping and data normalization
- Error handling and fallbacks

### Shared types

- Type-safe contracts between Angular client and NestJS API

## Tech stack

- Frontend: Angular, TypeScript, Angular Signals, Tailwind CSS
- Backend: NestJS, TypeScript, REST API (OpenAPI / Swagger)
- AI / data: Google Gemini, structured JSON schema validation, multi-stage AI pipeline
- Tooling: monorepo, Biome, in-memory LRU cache, rate limiting and API protection

## Technical highlights

- Multi-stage AI pipeline with fallbacks and partial results
- Schema validation for stable model output
- Scraping with graceful degradation (automatic, otherwise manual)
- Content hashing (SHA-256) for cache keys to control cost
- Rate limiting and error classification for production-like API behavior
- End-to-end type safety across the stack

The flow runs from ingesting a posting to a finished outreach message. Applications rely on structured analysis; manual work on vague job text stays low. Full stack with NestJS and Angular, AI via Google Gemini, modular design, and fallbacks for blocked scraping and long AI runs.
$en$
WHERE slug = 'hirepath-jobs-ai-job-analysis';

UPDATE projects
SET
  "descriptionEn" = $en$Hosted GitHub Spec Kit pipeline: Markdown brief in, implementation-ready spec bundle out, with analyze gates and self-heal.$en$,
  "contentMarkdownEn" = $en$
## What is it?

The Engineering Forge takes a Markdown brief and runs it through a hosted [GitHub Spec Kit](https://github.com/github/spec-kit) pipeline. The result is a spec bundle under `specs/###-feature/…` plus a summarized `{featureSlug}-implementation-spec.md`. Both can be dropped into a target repository and continued with `/speckit.implement`.

Application code is not generated here. The Forge orchestrates specifications.

## Flow

1. Ingest: `POST /api/partner/ingest` accepts brief and file names via Bearer auth and responds with `202` and a `jobId`.
2. Pipeline: a BullMQ worker runs enrich → specify → plan → tasks (FR retagging, MVP post-processing) → checklist → quickstart → analyze → pack.
3. Self-heal: at the analyze stage, gates check and correct for up to three cycles before packing.
4. Track and download: `GET /api/jobs/{jobId}` returns status; at `…/download` you get the ZIP once the job is `READY`.

The job UUID is also the access token. Polling and download need no further login.

## Operations

Web and worker share one service so downloads see the same bundle filesystem as the pipeline. Redis is attached as an addon; bundles live on a volume at `/app/storage/spec-bundles`.

## Stack

Next.js 16, TypeScript, BullMQ, Redis, OpenAPI, Railway.
$en$
WHERE slug = 'the-engineering-forge';