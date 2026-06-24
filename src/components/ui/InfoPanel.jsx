import { useState } from 'react'
import styles from './InfoPanel.module.css'
import { navState } from '../../utils/sharedState'
import { SECTION_BY_INDEX } from '../../data/sections'

function goTo(index) {
  const s = SECTION_BY_INDEX[index]
  if (s) navState.request = s.view
}

// ── Hero (section 0) — the landing identity + calls to action ────────────────
// `visible` is owned by App: shown at first load, hidden once the user starts
// exploring, and shown again only when they tap Home. (No idle auto-return.)
function Hero({ c, visible }) {
  return (
    <div className={`${styles.heroWrap} ${visible ? '' : styles.dimmed}`}>
      <div className={styles.hero}>
        <h1 className={styles.heroName}>{c.name}</h1>
        <p className={styles.heroRole}>{c.role}</p>
        <p className={styles.heroTagline}>{c.tagline}</p>
        <div className={styles.heroCtas}>
          <button className={styles.btnPrimary} onClick={() => goTo(3)}>View Projects</button>
          <button className={styles.btn} onClick={() => goTo(1)}>About me</button>
          <button className={styles.btn} onClick={() => goTo(4)}>Contact</button>
        </div>
        <p className={styles.heroHint}>Drag to look · scroll or pinch to fly — or use the menu below</p>
      </div>
    </div>
  )
}

// ── Reusable section panel chrome ───────────────────────────────────────────
// Desktop: a right-side card with everything visible.
// Mobile: a bottom sheet — the header bar is a toggle; collapsed (default) it
// shows just eyebrow + title so the 3D object stays visible above, expanded it
// reveals the scrollable content. (The `expanded` class is ignored on desktop.)
function PanelShell({ c, accent, children }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <div className={styles.scrim} />
      <div className={styles.panelWrap}>
        <article className={`${styles.panel} ${expanded ? styles.expanded : ''}`} style={{ '--accent': accent }}>
          <button
            className={styles.sheetHead}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className={styles.headText}>
              <span className={styles.eyebrow}>{c.eyebrow}</span>
              <span className={styles.title}>{c.title}</span>
            </span>
            <span className={styles.chevron} aria-hidden="true">⌃</span>
          </button>
          <div className={styles.sheetBody}>
            {c.lead && <p className={styles.lead}>{c.lead}</p>}
            {children}
          </div>
        </article>
      </div>
    </>
  )
}

function About({ c }) {
  return (
    <>
      <div className={styles.statsRow}>
        {c.stats.map(([n, l]) => (
          <div key={l} className={styles.stat}>
            <span className={styles.statNum}>{n}</span>
            <span className={styles.statLabel}>{l}</span>
          </div>
        ))}
      </div>

      <h3 className={styles.subhead}>Experience</h3>
      {c.experience.map((e) => (
        <div key={e.role} className={styles.exp}>
          <p className={styles.expRole}>{e.role}</p>
          <p className={styles.expMeta}>{e.meta}</p>
          <ul className={styles.bullets}>
            {e.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      ))}

      <h3 className={styles.subhead}>Certifications</h3>
      <ul className={styles.bullets}>
        {c.certs.map((p) => <li key={p}>{p}</li>)}
      </ul>

      <h3 className={styles.subhead}>Education</h3>
      <p className={styles.plain}>{c.education}</p>
    </>
  )
}

function Skills({ c }) {
  return (
    <div className={styles.groups}>
      {c.groups.map((g) => (
        <div key={g.name} className={styles.group}>
          <p className={styles.groupName}>{g.name}</p>
          <div className={styles.chips}>
            {g.items.map((i) => <span key={i} className={styles.chip}>{i}</span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

function Projects({ c }) {
  return (
    <div className={styles.projects}>
      {c.projects.map((p) => (
        <div key={p.name} className={styles.project} style={{ '--pc': p.color }}>
          <div className={styles.projectTop}>
            <h3 className={styles.projectName}>{p.name}</h3>
            <span className={styles.projectTag}>{p.tagline}</span>
          </div>
          <p className={styles.plain}>{p.blurb}</p>
          <ul className={styles.bullets}>
            {p.points.map((pt) => <li key={pt}>{pt}</li>)}
          </ul>
          <div className={styles.chips}>
            {p.stack.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
          </div>
          <a className={styles.projectLink} href={p.github} target="_blank" rel="noreferrer">
            View code ↗
          </a>
        </div>
      ))}
    </div>
  )
}

function Contact({ c }) {
  return (
    <>
      <div className={styles.links}>
        {c.links.map((l) => (
          <a key={l.label} className={styles.link} href={l.href} target="_blank" rel="noreferrer">
            <span className={styles.linkLabel}>{l.label}</span>
            <span className={styles.linkValue}>{l.value}</span>
            <span className={styles.linkArrow}>↗</span>
          </a>
        ))}
      </div>
      {c.resume && (
        <a className={styles.btnPrimary} href={c.resume} target="_blank" rel="noreferrer" style={{ marginTop: 18, display: 'inline-flex' }}>
          Download Résumé ↗
        </a>
      )}
    </>
  )
}

export default function InfoPanel({ sectionIndex, showHero }) {
  const section = SECTION_BY_INDEX[sectionIndex]
  if (!section) return null
  const c = section.content

  if (c.kind === 'hero') return <Hero c={c} visible={showHero} key="hero" />

  // key forces a fresh entrance animation each time the section changes
  return (
    <div key={section.id}>
      <PanelShell c={c} accent={section.color}>
        {c.kind === 'about' && <About c={c} />}
        {c.kind === 'skills' && <Skills c={c} />}
        {c.kind === 'projects' && <Projects c={c} />}
        {c.kind === 'contact' && <Contact c={c} />}
      </PanelShell>
    </div>
  )
}
