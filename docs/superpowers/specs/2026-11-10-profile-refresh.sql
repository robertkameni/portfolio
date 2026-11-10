-- Align the stored profile with the current CV (docs/cv/lebenslauf-robert-kameni-namou.docx).
-- The row was last written 2026-07-25 and still claimed "4+ years", Java 17 and
-- no Next.js work, which the chat twin repeated verbatim.
--
-- Only the facts that drifted are replaced; structure and icons stay as they are.
update profiles
set
  "updatedAt" = now(),

  -- Frontend and backend stack labels shown on the focus cards.
  "heroCards" = jsonb_set(
    jsonb_set(
      "heroCards",
      '{0,subtitle}',
      to_jsonb('Angular | Next.js | React | TypeScript'::text)
    ),
    '{1,subtitle}',
    to_jsonb('Java 21 | Spring Boot 3 | Testing'::text)
  ),

  -- Skill label follows the CV: Java 21, not 17.
  "skills" = (
    select jsonb_agg(
      case
        when skill ->> 'name' = 'Java 17' then jsonb_set(skill, '{name}', to_jsonb('Java 21'::text))
        else skill
      end
    )
    from jsonb_array_elements("skills") as skill
  ),

  "about" = jsonb_set(
    "about",
    '{paragraphs}',
    to_jsonb(
      array[
        'I am Robert Kameni, a Technical Lead Frontend Engineer with around 6 years of experience building complex enterprise web applications, mainly Angular (v8 to v22) and Next.js/React. I own frontend delivery end to end: architecture, implementation, quality, and go-live.',
        'At DATEV eG (since 08/2024) I own the frontend architecture and technical direction for two Scrum teams with eight developers, including mentoring two junior and mid-level engineers. I lead the Angular architecture with a focus on scalability, performance, and maintainability, and I introduced AI-assisted development workflows (GitHub Copilot, spec-driven development).',
        'Measurable results at DATEV: feature development time down 30% through a design system with 50+ reusable Angular components, bundle size down 25% and load times down 40%, and Angular 22 with Signals and NgRx Signal Store adopted across 5+ application modules, which cut state-related production errors by 50% in the first quarter. I also designed and led a new product built AI-first on Next.js 15/16 (App Router) and React 19.',
        'Before DATEV I spent 2.5 years as an IT consultant in frontend roles at Sifamo GmbH (02/2022 to 07/2024), with two long-term enterprise engagements: rebuilding the frontend of a factoring product on Angular 15 with RxJS and NgRx (load times down 30%), and building web components for a deployment-control platform plus migrating an Nx monorepo from Angular 15 to 16 across five applications (error rate down 60%).',
        'My technical range covers TypeScript, RxJS, Signals, NgRx Signal Store, Jest, Cypress, and the Java 21 / Spring Boot 3 backend side, so I can hold an API contract with a backend team instead of handing work over.',
        'As a Technical Lead I guide teams from the technical side, run reviews, and set engineering standards. I care most about performant, AI-ready frontends and teams that scale without losing quality.'
      ]::text[]
    )
  ),

  -- The contact rail repeated the same stale tenure.
  "contact" = jsonb_set(
    "contact",
    '{features,0,title}',
    to_jsonb('6+ Years Experience'::text)
  );
