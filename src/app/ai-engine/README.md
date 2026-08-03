# AI Engine Feature Boundary

Self-contained client feature for **visitor chat** and **behavior analytics tracking**.

## Public API

Import only from the barrel:

```typescript
import { ChatWidget, TrackBehaviorDirective } from '../ai-engine';
```

Do **not** deep-import paths such as `ai-engine/chat/chat-widget` or `ai-engine/directives/track-behavior.directive`.

## Structure

| Path | Role |
| --- | --- |
| `chat/chat-widget.ts` | Deferred chat UI (loaded from home via `@defer (on interaction)`) |
| `directives/track-behavior.directive.ts` | IntersectionObserver-based section visibility tracking |

## Coupling

- Depends on app-level `AnalyticsService`, `ChatStore`, and `RealtimeService`.
- Used by home page components for `trackBehavior` attribute binding.
- Not moved under `pages/ai/` because `TrackBehaviorDirective` is woven into multiple home section components and chat is deferred from `index.page.html` — relocation would be high churn with no bundle win (chat is already lazy via `@defer`).

## Future growth

If the AI surface expands (dedicated routes, admin intelligence UI), consider:

1. Lazy route group under `pages/ai/`
2. Moving chat-only code while keeping `TrackBehaviorDirective` in shared or analytics module
