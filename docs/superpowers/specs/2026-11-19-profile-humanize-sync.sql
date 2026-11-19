-- Sync live profiles row to Batch 1 humanized English fallbacks in
-- src/server/data/default-profile.ts (icons/structure preserved via jsonb_set).
-- Apply only after human approve. Project: cold-boat-79495908.

UPDATE profiles
SET
  "updatedAt" = now(),

  "intro" = jsonb_set(
    "intro",
    '{description}',
    to_jsonb(
      'Technical Lead Frontend Engineer on Angular (v8 to v22) and Next.js/React. Builds enterprise web applications and leads teams through delivery.'::text
    )
  ),

  "heroCards" = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  "heroCards",
                  '{0,description}',
                  to_jsonb(
                    'Most of my work is Angular: apps that stay fast and maintainable as features pile on.'::text
                  )
                ),
                '{0,items,0,description}',
                to_jsonb('Runtime tuning, architecture choices, Signal Store, and NgRx.'::text)
              ),
              '{0,items,1,description}',
              to_jsonb(
                'Angular platforms that grow with the product; monorepo upgrades when they are due.'::text
              )
            ),
            '{0,items,2,description}',
            to_jsonb('Desktop and mobile with HTML5, CSS3, and Angular Material.'::text)
          ),
          '{1,description}',
          to_jsonb(
            'Comfortable in enterprise Java/Spring backends and focused on keeping production stable.'::text
          )
        ),
        '{1,items,0,description}',
        to_jsonb('Angular frontends wired to Java 21 and Springboot 3 services.'::text)
      ),
      '{1,items,1,description}',
      to_jsonb('Jest and Cypress for unit tests and E2E coverage.'::text)
    ),
    '{1,items,2,description}',
    to_jsonb('Production bugfixes, root-cause work, and changes meant to stick.'::text)
  ),

  "about" = jsonb_set(
    jsonb_set(
      "about",
      '{paragraphs}',
      to_jsonb(
        ARRAY[
          'I am Robert Kameni Namou, Technical Lead Frontend Engineer. Around 6 years in, mostly on complex enterprise web apps with Angular (v8 to v22) and Next.js/React. I take frontend delivery end to end: architecture, implementation, quality, and go-live.',
          'At DATEV eG (since 08/2024) I own frontend architecture and technical direction for two Scrum teams with eight developers, including mentoring two junior and mid-level engineers. I steer the Angular stack toward scalability, performance, and maintainability, and I brought in AI-assisted workflows (GitHub Copilot, spec-driven development).',
          'At DATEV the numbers moved: feature development time down 30% after a design system with 50+ reusable Angular components; bundle size down 25% and load times down 40%; Angular 22 with Signals and NgRx Signal Store across 5+ application modules, cutting state-related production errors by 70% in the first quarter. I also designed and led a new product built AI-first on Next.js 15/16 (App Router) and React 19.',
          'Before DATEV I spent 2.5 years as an IT consultant in frontend roles at Sifamo GmbH (02/2022 to 07/2024). Two long-term enterprise engagements: rebuilding the frontend of a factoring product on Angular 15 with RxJS and NgRx (load times down 30%), and web components for a deployment-control platform plus migrating an Nx monorepo from Angular 15 to 16 across five applications (error rate down 60%).',
          'Day to day that means TypeScript, RxJS, Signals, NgRx Signal Store, Jest, Cypress, and enough Java 21 / Spring Boot 3 to negotiate API contracts with backend teams instead of throwing work over the wall.',
          'As Technical Lead I guide teams from the technical side, run reviews, and set engineering standards. I like fast frontends, sensible use of AI tooling, and teams that can grow without letting quality slip.'
        ]::text[]
      )
    ),
    '{highlights}',
    (
      SELECT jsonb_agg(h ORDER BY ord)
      FROM (
        VALUES
          (
            1,
            jsonb_build_object(
              'title', 'Angular Expertise Across Versions',
              'description', 'Shipped and maintained production Angular from v8 through v22, picking up new framework features where they helped.',
              'iconPath', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            )
          ),
          (
            2,
            jsonb_build_object(
              'title', 'Execution and Performance Impact',
              'description', 'Better runtime performance, clearer architecture patterns, and about 70% more development efficiency across the teams involved.',
              'iconPath', 'M13 10V3L4 14h7v7l9-11h-7z'
            )
          ),
          (
            3,
            jsonb_build_object(
              'title', 'Technical Leadership and Team Scaling',
              'description', 'Ran code reviews, coached developers on hard calls, and put engineering standards in place so delivery could scale.',
              'iconPath', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
            )
          ),
          (
            4,
            jsonb_build_object(
              'title', 'AI-Driven Development',
              'description', 'Uses LLMs and AI tooling in architecture and delivery where they save time without compromising quality or maintainability.',
              'iconPath', 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
            )
          )
      ) AS t(ord, h)
    )
  ),

  "contact" = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  "contact",
                  '{description}',
                  to_jsonb(
                    'If you have a frontend or lead role in mind, get in touch. Happy to talk scope, stack, and timeline.'::text
                  )
                ),
                '{features,0,description}',
                to_jsonb('Enterprise web applications, mostly Angular and Next.js'::text)
              ),
              '{features,1,description}',
              to_jsonb('Lead-level Angular with Java/Spring on the API side'::text)
            ),
            '{features,2,description}',
            to_jsonb('Consulting engagements and in-house product teams'::text)
          ),
          '{formCard,title}',
          to_jsonb('Ready to Start Your Project?'::text)
        ),
        '{formCard,description}',
        to_jsonb('Tell me what you are building and what you need from a lead.'::text)
      ),
      '{features,0,title}',
      to_jsonb('6+ Years Experience'::text)
    ),
    '{features,1,title}',
    to_jsonb('Full Stack Expertise'::text)
  )

WHERE id = '77539b66-f421-46c3-8136-8b374ac50af4';
