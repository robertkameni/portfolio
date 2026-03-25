t# AGENTS.md

## Overview
This document provides essential knowledge for AI coding agents to be productive in the `personal-portfolio-project` codebase. It outlines the architecture, workflows, conventions, and integration points specific to this project.

---

## Big Picture Architecture

### Key Components
- **Frontend (Angular + AnalogJS)**: Located in `src/app/`, this includes components, pages, services, and shared utilities.
  - Example: `src/app/pages/index.page.ts` defines the main landing page.
- **Backend (Server Functions)**: Found in `src/server/`, this handles API routes, database access, and middleware.
  - Example: `src/server/api/realtime.get.ts` serves real-time data.
- **Database (Prisma)**: Prisma ORM is configured in `prisma/schema.prisma` and accessed via `src/server/db/client.ts`.

### Data Flow
1. **Frontend**: Components fetch data via route loaders or services.
2. **Backend**: Server functions process requests and interact with the database.
3. **Database**: Prisma queries are executed per request context.

### Structural Decisions
- **SSR-first Design**: Ensures SEO and performance.
- **Zoneless Angular**: Improves change detection efficiency.
- **File-based Routing**: Simplifies navigation and co-locates logic.

---

## Developer Workflows

### Build
- **Command**: `npm run build`
- **Config**: Vite-based build system (`vite.config.ts`).

### Test
- **Command**: `npm test`
- **Setup**: Tests are configured in `tsconfig.spec.json`.

### Debug
- **Frontend**: Use browser dev tools.
- **Backend**: Add `console.log` in server functions.

---

## Project-Specific Conventions

### Signals for State Management
- Use Angular signals for local and shared state.
  - Example: `src/app/store/visitor.store.ts` manages visitor data.

### Prisma Usage
- Queries are defined in `src/server/db/repositories/`.
  - Example: `project.repository.ts` handles project-related queries.
- Follow SSR safety rules (no shared state).

### File-Based Routing
- Pages and APIs follow AnalogJS conventions.
  - Example: `src/app/pages/admin/(dashboard)/index.page.ts` for admin dashboard.

---

## Integration Points

### External Dependencies
- **Prisma**: Database ORM.
- **Vercel**: Deployment platform.

### Cross-Component Communication
- Use services for shared logic.
  - Example: `src/app/services/auth.service.ts` handles authentication.

---

## Examples

### Adding a New API Route
1. Create a file in `src/server/api/`.
2. Define the route logic.
3. Use Prisma for database queries.

### Creating a New Page
1. Add a file in `src/app/pages/`.
2. Define the component and route.
3. Fetch data using a loader.

---

## Notes
- Ensure SSR correctness.
- Avoid client-side Prisma usage.
- Follow the project's coding conventions strictly.
- Do not add app prefix when generating a component
