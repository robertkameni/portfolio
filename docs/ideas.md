# Ideas

Open ideas, not yet scheduled.

## Feed the project case studies into the chat context

**Status:** designed, not scheduled. Spec: `docs/superpowers/specs/2026-11-12-chat-case-study-context-design.md`
**Found:** 2026-11-11, after the chat stopped reciting the About section (PR #17)

The twin only knows the profile and the project metadata. The profile is also
what the About section shows, so a question like "tell me about your Angular
experience" will always overlap with the page: the career is the career. Prompt
rules can improve how that material is delivered, but they cannot add anything
the model does not have.

The project detail pages contain more than the home page. Home lists three
projects; each detail page has a `contentMarkdown` body in the database with
what the product does, the stack, the design decisions and the hard parts.
Handing that text to the chat is what would let the twin say something a visitor
has not already read.

Rough shape:

- include `contentMarkdown` for the projects selected for the question, not all
  of them, since the full corpus will not fit a prompt budget
- reuse `selectRelevantProjects()` from `prompt-helpers.ts` to pick the rows
- trim each body to a length the model can use, keeping the sections that
  describe work rather than install instructions
- the existing rule "reach for PROJECT CONTEXT first" already points at the
  right place; it needs material behind it

Trade-offs to settle: prompt size and cost per message, and how much of a case
study is worth including before the reply turns into a summary of the detail
page.

The spec settles those: one full body when the question matches, a 4,000
character cap, and a spoken retell of that single study.
