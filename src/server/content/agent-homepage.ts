/**
 * Markdown for AI agents: same body as `GET /` with `Accept: text/markdown`
 * and `GET /api/agent-site-markdown`. Not linked from the Angular UI.
 *
 * Edit this string when profile or URLs change; keep hosts aligned with
 * `public/sitemap.xml` and `public/robots.txt`.
 */
export const agentHomepageMarkdown = `# Robert Kameni — portfolio (agent-oriented summary)

**Role:** Technical Lead Frontend Specialist — Angular, TypeScript, enterprise web, full stack collaboration.

**Canonical site:** https://robert-kameni-personal-portfolio.vercel.app/

**Contact**

- Email: robertkameni83@gmail.com
- Phone: +49 176 30131077
- LinkedIn: https://www.linkedin.com/in/robertkameni/
- Xing: https://www.xing.com/profile/Robert_Kameni

## Summary

Technical Lead focused on scalable Angular applications (Signals, NgRx Signal Store, RxJS), integration with Java 17 / Spring Boot APIs, automated testing (Jest, Cypress), performance and architecture, and Scrum delivery in cross-functional teams.

## How to fetch this content

| Mechanism | Description |
|-----------|-------------|
| Content negotiation | \`GET /\` with header \`Accept: text/markdown\` returns this document with \`Content-Type: text/markdown\`. |
| Direct API | \`GET /api/agent-site-markdown\` returns the same body (not linked from the UI). |
| Static copy | \`GET /agent/site-for-agents.md\` — plain file under \`/public/agent/\`; keep text aligned with this module when you edit either one. |

## Discovery

- Sitemap: https://robert-kameni-personal-portfolio.vercel.app/sitemap.xml  
- Robots: https://robert-kameni-personal-portfolio.vercel.app/robots.txt  
`;
