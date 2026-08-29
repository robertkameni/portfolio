# Personal Portfolio & AI Showcase

**Live demo:** [https://robert-kameni-personal-portfolio.vercel.app/](https://robert-kameni-personal-portfolio.vercel.app/)

An **Angular 22 + AnalogJS-based portfolio** demonstrating modern frontend architecture, lightweight server-side capabilities, and optional AI-driven UI personalization.

The project showcases how **Angular 22 (Signals, stable Resource API, Signal Forms, SSR, standalone components)** combined with **AnalogJS server routes (Nitro runtime)** can deliver a fast, reactive, and content-adaptive user experience without requiring a separate backend system.

---

## 👨‍💻 About This Project

This is a **frontend-first engineering showcase** with a minimal, embedded backend layer.

It demonstrates practical use of:

* Angular 22 (Signals, stable Resource API, Signal Forms, OnPush-by-default, SSR, standalone architecture)
* AnalogJS (server-side rendering + file-based server routes)
* Nitro runtime (lightweight API layer inside Angular app)
* PostgreSQL (via Prisma ORM)
* DeepSeek API (AI-driven enrichment layer)
* Server-Sent Events (SSE) for optional realtime updates

The system is designed for **single-instance deployment (Vercel)** and prioritizes:

* simplicity over distributed complexity
* UX responsiveness over backend orchestration
* pragmatic architecture over infrastructure abstraction

---

## 🤖 AI-Powered UI Personalization

The portfolio includes a **non-blocking AI enrichment pipeline** that adapts content based on user interaction signals.

### Flow overview:

* User interactions are captured in the browser
* Events are batched locally for efficiency
* AnalogJS/Nitro server routes process analytics asynchronously
* Optional AI enrichment is generated via DeepSeek API
* UI updates are applied when results are available
* Angular Signals ensure minimal, targeted re-renders

This layer is **progressive enhancement**, not a core dependency.

---

## 📊 Architecture Overview

```mermaid
sequenceDiagram
    autonumber
    actor User as Visitor
    participant UI as Angular + AnalogJS App
    participant API as AnalogJS / Nitro Server Routes
    participant DB as PostgreSQL
    participant AI as DeepSeek API
    participant SSE as Realtime Layer

    User->>UI: Interacts with portfolio
    UI->>UI: Batch interaction events locally

    UI->>API: Send batched analytics
    API->>DB: Persist events
    API-->>UI: 202 Accepted

    API->>AI: Trigger optional analysis
    AI-->>API: AI-generated insights
    API->>DB: Store enrichment result

    API->>SSE: Emit update (best effort)
    SSE-->>UI: Push update (if connected)

    UI->>UI: Update view via Angular Signals
```

---

## ⚙️ Key Design Principles

* **Frontend-first architecture** — backend exists only to support UX
* **No blocking AI calls** — everything runs asynchronously
* **Single-instance optimized** — designed for Vercel deployment
* **Progressive enhancement model** — features degrade gracefully
* **Signal-driven UI updates** — minimal DOM work, reactive updates only
* **Optional realtime layer (SSE)** — improves UX but is not required

---

## Contributor Setup

### Prerequisites

- Node.js >= 20.19.1 (CI uses 24.15.0)
- PostgreSQL database (local or hosted, e.g. Neon)
- A DeepSeek API key for AI features (optional — the app degrades gracefully)

### Environment variables

| Variable | Required | Description | Example |
|---|---|---|---|
| **Database** | | | |
| `DATABASE_URL` | yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/portfolio?schema=public` |
| **Auth** | | | |
| `ACCESS_TOKEN_SECRET` | yes | JWT signing key for access tokens (20m) | `openssl rand -hex 64` |
| `REFRESH_TOKEN_SECRET` | yes | JWT signing key for refresh tokens (7d) | `openssl rand -hex 64` |
| `SESSION_SECRET` | yes | Fallback for realtime token signing | `openssl rand -hex 64` |
| **Realtime** | | | |
| `REALTIME_SESSION_TOKEN_SECRET` | yes | Primary key for SSE realtime tokens | `openssl rand -hex 64` |
| `UPSTASH_REDIS_REST_URL` | no | Redis for rate limits in production | `redis://...` |
| **AI / DeepSeek** | | | |
| `DEEPSEEK_API_KEY` | yes | API key for chat + visitor intelligence | `sk-...` |
| `DEEPSEEK_CHAT_MODEL` | no | Model name (default: `deepseek-chat`) | `deepseek-chat` |
| `DEEPSEEK_VISITOR_MODEL` | no | Separate model for visitor analysis | `deepseek-chat` |
| `DEEPSEEK_THINKING_ENABLED` | no | Enable reasoning output | `true` |
| `DEEPSEEK_FETCH_TIMEOUT_MS` | no | HTTP timeout in ms (default: 120000) | `120000` |
| **Cal.com** | | | |
| `CALCOM_API_KEY` | no | Cal.com API key for scheduling | `cal_live_...` |
| `CALCOM_EVENT_TYPE_ID` | no | Event type ID for bookings | `123456` |
| `CALCOM_USERNAME` | no | Cal.com username | `your-username` |
| **Resend (email)** | | | |
| `RESEND_API_KEY` | no | Resend API key for contact form emails | `re_...` |
| `NOTIFICATION_EMAIL` | no | Where notifications are sent | `notifications@your-domain.com` |
| `RESEND_FROM_EMAIL` | no | Sender address for emails | `notifications@your-domain.com` |

All required variables must be set before the server boots — a Zod schema validates them at startup. Copy `.env.example` to `.env` and fill in the values.

### First-time setup

```bash
# 1. Install dependencies (postinstall runs prisma generate automatically)
npm install

# 2. Set up your .env file
cp .env.example .env
# Fill in DATABASE_URL, auth secrets, and at minimum DEEPSEEK_API_KEY

# 3. Run database migrations
npx prisma migrate dev

# 4. (Optional) Seed the database with sample data
npx prisma db seed

# 5. Start the dev server
npm run dev
```

### Common scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (client + SSR + Nitro) |
| `npm run verify` | Run lint + typecheck + tests (CI gate) |
| `npm run test` | Run Vitest in watch mode |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (app + specs + server) |
| `npm run format:fix` | Prettier auto-format |
| `npm run build:analyze` | Build + generate Rollup treemap |
| `npm run check:bundles` | Validate gzip bundle budgets |

### Platform-specific notes

**Hybrid rendering:** Public routes (home, projects list, project detail) are **server-rendered (SSR)** — they read the database at request time, so no static prerendering runs during the build on any platform. Admin routes use **client-only** rendering. See `src/app/shared/routing/hybrid-render.config.ts` and per-page `routeMeta.renderMode`. An anti-drift Vitest (`hybrid-render.config.spec.ts`) ensures pages stay in sync.

### Further reading

- [docs/security.md](docs/security.md) — JWT rotation, CSP configuration, cookie reference
- [docs/bundle-analysis.md](docs/bundle-analysis.md) — chunk breakdown, code-splitting verification, budget details
- [docs/typescript-strictness.md](docs/typescript-strictness.md) — strictness levels and server-only flags
- [docs/angular-patterns.md](docs/angular-patterns.md) — `httpResource` vs `rxMethod` guidance for new features