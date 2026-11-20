# Ideas

Open ideas, not yet scheduled.

_(None right now.)_

## Done

### Feed the project case studies into the chat context

**Status:** shipped. Spec: `docs/superpowers/specs/2026-11-12-chat-case-study-context-design.md`. Plan: `docs/superpowers/plans/2026-11-12-chat-case-study-context.md`.
**Shipped:** chat loads one matching `contentMarkdown` body (4,000-char trim), withholds it in scheduling mode, and retells that study instead of replaying About. Prod spot-check 2026-11-20 passed on the Angular prompt chip.
**Found:** 2026-11-11, after the chat stopped reciting the About section (PR #17)
