// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the portfolio's sections.
//
// Every consumer reads from here so positions never drift out of sync:
//   • SpaceScene  → SECTIONS[].world (proximity zones)
//   • EdgeHints   → SECTIONS[].world + .view (beacon click → guided fly-to)
//   • NavMenu     → SECTIONS[].label / .view (jump-to + tour)
//   • InfoPanel   → SECTIONS[].content (readable DOM panels)
//
// `world` = the 3D object's centre.
// `view`  = the camera pose used when we guide the user to that section:
//           { pos: where the camera flies to, look: what it frames }.
//
// LAYOUT RULE (don't break this): the four sections are arranged AROUND a
// central point (~[0,0,-60]) in distinct directions, and each `view` sits
// *between* that centre and the object, looking OUTWARD into empty space.
// Consequence: when you're framed on one section, every OTHER section is
// behind the camera, so their EdgeHints markers clamp to the screen edge
// instead of projecting onto the object you're looking at. (A −Z "tunnel"
// layout fails here: a section deeper down the axis always projects near
// screen-centre and lands on the focused object — e.g. Contact over the
// black hole.) Turning to look toward another section still floats its
// marker in space, as intended. If you move a section, keep it well off the
// other view axes and approach it from the inside-out.
// ─────────────────────────────────────────────────────────────────────────────

export const SECTIONS = [
  // ── 0 · HERO / deep space ──────────────────────────────────────────────────
  {
    index: 0,
    id: 'home',
    label: 'Home',
    color: '#7bb3f0',
    world: [0, 4, 175],
    view: { pos: [0, 12, 200], look: [0, 4, 175] },
    content: {
      kind: 'hero',
      name: 'Maharshi Reddy',
      role: 'Software Engineer II — Full-Stack · AI Systems',
      tagline:
        'I build fast, accessible web platforms — and the AI systems behind them. 4+ years turning complex products into interfaces people actually enjoy using.',
    },
  },

  // ── 1 · ABOUT (Origin planet) ───────────────────────────────────────────────
  {
    index: 1,
    id: 'about',
    label: 'About',
    color: '#7bb3f0',
    world: [25, 6, 70],
    // EdgeHints marker floats this many world-units below the planet centre so
    // it sits just under the (large, bright) disk instead of on top of it.
    // World-space offset → scales correctly with viewing distance.
    hintOffset: [0, -4.5, 0],
    view:       { pos: [15, 7, 81], look: [29, 6, 71] },
    viewMobile: { pos: [50, 7, 70], look: [25, 6, 70] },
    content: {
      kind: 'about',
      eyebrow: '// ORIGIN',
      title: 'About',
      lead:
        "I'm a frontend engineer with full-stack range. For 4+ years I've built enterprise data platforms and e-commerce apps — increasingly with AI woven in: RAG pipelines, LangGraph agents, vector search. I like owning a problem end to end, from the architecture call to the production ship.",
      experience: [
        {
          role: 'Software Engineer II · Hashedin',
          meta: 'Oct 2023 – Present · Hyderabad',
          points: [
            'Lead a team of 4 on a micro-frontend data marketplace — including an AI chat that turns data products into plain-language metric definitions for non-technical users',
            'Designed the full data-product lifecycle from scratch: role-based workflows, permissions and live form validation — onboarding got 3× faster',
            'Made it fast — a 45% smaller JS bundle, Lighthouse CI guardrails holding Core Web Vitals above 85, and 20% quicker page loads',
            'Rolled out GitHub Copilot and Claude Code across the team with real adoption guidelines, lifting our velocity',
          ],
        },
        {
          role: 'Software Engineer I · Hashedin',
          meta: 'Aug 2022 – Sep 2023 · Bangalore',
          points: [
            'Shipped 15+ GCP serverless functions on GitHub Actions CI/CD, retiring manual deploys for good',
            'Reworked checkout with progressive disclosure and watched payment abandonment drop 15%',
            'Rebuilt keyboard nav, focus and ARIA to WCAG 2.1 AA, clearing 95% of outstanding accessibility issues',
          ],
        },
      ],
      stats: [
        ['4+', 'Years XP'],
        ['30+', 'Projects'],
        ['4', 'Engineers led'],
        ['2', 'Companies'],
      ],
      certs: [
        'AWS Solutions Architect — Professional',
        'GCP DevOps Engineer',
        'GenAI RAG — Google Cloud',
      ],
      education: 'B.Tech, Computer Science · Sree Vidyanikethan · 2018–2022',
    },
  },

  // ── 2 · SKILLS (Black Hole) ────────────────────────────────────────────────
  {
    index: 2,
    id: 'skills',
    label: 'Skills',
    color: '#5ec8e6',
    world: [-90, 32, -40],
    // Float the marker just below the black hole's disk.
    hintOffset: [0, -4.5, 0],
    view:       { pos: [-73, 28, -52], look: [-100, 32, -40] },
    viewMobile: { pos: [-74, 29, -40], look: [-90, 32, -40] },
    content: {
      kind: 'skills',
      eyebrow: '// SKILL NEBULA',
      title: 'Technical Arsenal',
      lead: 'The technologies in orbit — grouped by where they live in the stack.',
      groups: [
        {
          name: 'Frontend',
          items: ['JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Redux', 'Zustand', 'TanStack Query', 'React Hook Form', 'GraphQL'],
        },
        {
          name: 'Backend',
          items: ['FastAPI', 'Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'SQLAlchemy', 'Alembic', 'Celery', 'asyncio', 'WebSockets', 'OAuth2 / JWT'],
        },
        {
          name: 'Architecture',
          items: ['LangGraph', 'RAG pipelines', 'pgvector', 'Micro Frontends', 'PWAs', 'Performance Optimization', 'Lighthouse'],
        },
        {
          name: 'Testing & Build',
          items: ['Jest', 'React Testing Library', 'Playwright', 'Cypress', 'Pytest', 'Locust', 'Prometheus', 'Webpack', 'Vite'],
        },
        {
          name: 'DevOps',
          items: ['Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'AWS', 'GCP'],
        },
      ],
    },
  },

  // ── 3 · PROJECTS (Project Sector) ──────────────────────────────────────────
  {
    index: 3,
    id: 'projects',
    label: 'Projects',
    color: '#45c7c0',
    world: [-65, -35, -120],
    view:       { pos: [-50, -28, -107], look: [-57, -33, -117] },
    viewMobile: { pos: [-50, -28, -107], look: [-65, -35, -120] },
    content: {
      kind: 'projects',
      eyebrow: '// PROJECT SECTOR',
      title: 'Projects',
      lead: 'A couple of things I built end to end, from first commit to production.',
      projects: [
        {
          name: 'Codesense',
          color: '#9b8cf5',
          tagline: 'AI Developer Profiler',
          blurb:
            'An AI that reads a codebase the way a senior engineer would — point it at any GitHub repo and it grades the project’s health and profiles the developer behind it in seconds.',
          points: [
            'Indexes every repo in parallel and streams live progress to the UI over WebSockets',
            'Health-grades each repo A/B/C across 13 signals — tests, CI, Docker, license, commit activity',
            'Answers questions with RAG over the source: local embeddings (zero API cost) → pgvector → a Groq-hosted llama-3.3-70b streaming its reply token by token',
            'A LangGraph agent pre-computes skill scores with zero LLM tokens, driving a registry of React visualisations — heatmaps, skill radars, timelines',
          ],
          stack: ['LangGraph', 'FastEmbed', 'PostgreSQL', 'pgvector', 'Celery', 'Redis', 'FastAPI', 'React', 'Groq'],
          github: 'https://github.com/Sunnymaharshi/codesense',
        },
        {
          name: 'API Rate Limiter',
          color: '#6fb0ef',
          tagline: 'Infrastructure Middleware',
          blurb:
            'A production-grade rate limiter you can drop into any FastAPI app — four algorithms, atomic guarantees, and a dashboard to watch it work.',
          points: [
            'One @rate_limit decorator, four strategies (fixed/sliding window, token/leaky bucket), scoped per IP, API key or user',
            'Atomic Redis Lua scripts mean zero over-admission — proven under 500 concurrent requests',
            'Ships with a live Chart.js + Prometheus dashboard, 79 unit tests and a Locust load suite',
          ],
          stack: ['Python', 'FastAPI', 'Redis', 'Lua', 'Docker', 'Prometheus', 'pytest'],
          github: 'https://github.com/Sunnymaharshi/python/tree/main/fast-api/api-rate-limiter',
        },
      ],
    },
  },

  // ── 4 · CONTACT (Comm Station) ─────────────────────────────────────────────
  {
    index: 4,
    id: 'contact',
    label: 'Contact',
    color: '#4a90d9',
    world: [-40, -12, -175],
    hintOffset: [0, -8, 0],
    view:       { pos: [-18, -5, -133], look: [-32, -10, -172] },
    viewMobile: { pos: [-18, -5, -133], look: [-40, -12, -175] },
    content: {
      kind: 'contact',
      eyebrow: '// COMM STATION',
      title: "Let's build something",
      lead: 'Open to opportunities. The fastest way to reach me is below.',
      links: [
        { label: 'Email', value: 'maharshireddythangasani@gmail.com', href: 'mailto:maharshireddythangasani@gmail.com' },
        { label: 'GitHub', value: 'github.com/Sunnymaharshi', href: 'https://github.com/Sunnymaharshi' },
        { label: 'LinkedIn', value: 'linkedin.com/in/maharshireddy', href: 'https://linkedin.com/in/maharshireddy' },
      ],
      resume: '/Maharshi_Reddy_Resume.pdf',
    },
  },
]

// Convenience lookups
export const SECTION_BY_INDEX = SECTIONS.reduce((m, s) => ((m[s.index] = s), m), {})
export const NAV_SECTIONS = SECTIONS // ordered 0..4 for the nav bar
