// About section — 3 constellation panels parented to planet group.
// Planet world pos: [20,-4,78]. Camera section 1: [30,-2,90] (~17u away).
// All positions here are LOCAL to the planet group.
import { ConstellationPanel } from './ConstellationReveal'

const IDENTITY = [
  { label: '// COMMANDER.PROFILE', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.00, gap: 0.14 },
  { label: 'Maharshi Reddy',        fontSize: 0.34, textColor: '#e8f0ff', delay: 0.06, gap: 0.16 },
  { label: 'Software Engineer II - Full-Stack - AI Systems', fontSize: 0.13, textColor: '#7bb3f0', delay: 0.13, gap: 0.22, maxWidth: 5.5 },
  { label: 'Frontend engineer with full-stack reach.', fontSize: 0.12, textColor: '#8aaed4', delay: 0.22, gap: 0.06, maxWidth: 5.5 },
  { label: '4+ years shipping enterprise platforms,', fontSize: 0.12, textColor: '#8aaed4', delay: 0.28, gap: 0.06, maxWidth: 5.5 },
  { label: 'RAG pipelines, and AI systems.', fontSize: 0.12, textColor: '#8aaed4', delay: 0.34, gap: 0.24, maxWidth: 5.5 },
  { label: 'github.com/Sunnymaharshi', fontSize: 0.12, textColor: '#4a90d9', delay: 0.44, gap: 0 },
]

const EXPERIENCE = [
  { label: '// MISSION LOG', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.15, gap: 0.14 },
  { label: 'Software Engineer II - Hashedin', fontSize: 0.14, textColor: '#c8deff', delay: 0.22, gap: 0.05, maxWidth: 5 },
  { label: 'Oct 2023 - Present - Hyderabad', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.28, gap: 0.16, maxWidth: 5 },
  { label: '> Led 4-eng team on enterprise data platform', fontSize: 0.11, textColor: '#8aaed4', delay: 0.34, gap: 0.05, maxWidth: 5 },
  { label: '> Bundle -45%  Core Web Vitals > 85', fontSize: 0.11, textColor: '#8aaed4', delay: 0.40, gap: 0.05, maxWidth: 5 },
  { label: '> Full RBAC lifecycle - 3x faster onboarding', fontSize: 0.11, textColor: '#8aaed4', delay: 0.46, gap: 0.22, maxWidth: 5 },
  { label: 'Software Engineer I - Hashedin', fontSize: 0.14, textColor: '#c8deff', delay: 0.54, gap: 0.05, maxWidth: 5 },
  { label: 'Aug 2022 - Sep 2023 - Bangalore', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.60, gap: 0.16, maxWidth: 5 },
  { label: '> 15+ GCP serverless + GitHub Actions CI/CD', fontSize: 0.11, textColor: '#8aaed4', delay: 0.66, gap: 0.05, maxWidth: 5 },
  { label: '> Checkout redesign - payment abandonment -15%', fontSize: 0.11, textColor: '#8aaed4', delay: 0.72, gap: 0, maxWidth: 5 },
]

const STATS = [
  { label: '// FIELD STATS', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.30, gap: 0.16 },
  { label: '4+  YRS XP  .  2  COMPANIES', fontSize: 0.14, textColor: '#c8deff', delay: 0.36, gap: 0.08 },
  { label: '30+ PROJECTS  .  4  ENG LED', fontSize: 0.14, textColor: '#c8deff', delay: 0.42, gap: 0.22 },
  { label: '// CERTIFICATIONS', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.50, gap: 0.14 },
  { label: '* AWS Solutions Architect - Pro', fontSize: 0.12, textColor: '#8aaed4', delay: 0.56, gap: 0.06 },
  { label: '* GCP DevOps Engineer', fontSize: 0.12, textColor: '#8aaed4', delay: 0.62, gap: 0.06 },
  { label: '* GenAI RAG - Google Cloud', fontSize: 0.12, textColor: '#8aaed4', delay: 0.68, gap: 0.22 },
  { label: '// EDUCATION', fontSize: 0.10, textColor: '#4a6a8a', delay: 0.76, gap: 0.12 },
  { label: 'B.Tech Computer Science', fontSize: 0.13, textColor: '#c8deff', delay: 0.82, gap: 0.05 },
  { label: 'Sree Vidyanikethan . 2018-2022', fontSize: 0.11, textColor: '#8aaed4', delay: 0.88, gap: 0 },
]

export default function PlanetInfo({ active }) {
  return (
    <>
      {/* Identity — upper-left of planet, angled toward camera */}
      <ConstellationPanel entries={IDENTITY}   position={[-3.5, 4.0, 1.5]} color="#4a90d9" active={active} />
      {/* Experience — right side of planet */}
      <ConstellationPanel entries={EXPERIENCE} position={[3.2,  3.2, 1.5]} color="#4a90d9" active={active} />
      {/* Stats — lower area */}
      <ConstellationPanel entries={STATS}      position={[-2.0,-4.2, 1.5]} color="#4a90d9" active={active} />
    </>
  )
}
