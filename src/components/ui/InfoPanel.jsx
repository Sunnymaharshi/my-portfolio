import { useState, useEffect } from 'react'
import styles from './InfoPanel.module.css'
import { navState } from '../../utils/sharedState'
import { SECTION_BY_INDEX } from '../../data/sections'

function goTo(index) {
  const s = SECTION_BY_INDEX[index]
  if (s) navState.request = s.view
}

// True while the user is actively exploring (dragging or scrolling), flipping
// back to false after `idleMs` of stillness. Lets the centred hero get out of
// the way during flight, then return when the user pauses — content is hidden,
// never lost. (The canvas sits full-screen behind, so its drag/wheel events
// bubble to window.)
function useExploring(idleMs = 2500) {
  const [exploring, setExploring] = useState(false)
  useEffect(() => {
    let timer
    const bump = () => {
      setExploring(true)
      clearTimeout(timer)
      timer = setTimeout(() => setExploring(false), idleMs)
    }
    const onMove = (e) => { if (e.buttons) bump() }  // only while dragging
    window.addEventListener('pointermove', onMove)
    window.addEventListener('wheel', bump, { passive: true })
    window.addEventListener('touchmove', bump, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('wheel', bump)
      window.removeEventListener('touchmove', bump)
    }
  }, [idleMs])
  return exploring
}

// ── Hero (section 0) — the landing identity + calls to action ────────────────
function Hero({ c }) {
  const exploring = useExploring()
  return (
    <div className={`${styles.heroWrap} ${exploring ? styles.dimmed : ''}`}>
      <div className={styles.hero}>
        <p className={styles.heroEyebrow}>{c.eyebrow}</p>
        <h1 className={styles.heroName}>{c.name}</h1>
        <p className={styles.heroRole}>{c.role}</p>
        <p className={styles.heroTagline}>{c.tagline}</p>
        <div className={styles.heroCtas}>
          <button className={styles.btnPrimary} onClick={() => goTo(3)}>View Projects</button>
          <button className={styles.btn} onClick={() => goTo(1)}>About me</button>
          <button className={styles.btn} onClick={() => goTo(4)}>Contact</button>
        </div>
        <p className={styles.heroHint}>Drag to look · scroll to fly — or use the menu below</p>
      </div>
    </div>
  )
}

// ── Reusable section panel chrome ───────────────────────────────────────────
function PanelShell({ c, accent, children }) {
  return (
    <>
      <div className={styles.scrim} />
      <div className={styles.panelWrap}>
        <article className={styles.panel} style={{ '--accent': accent }}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>{c.eyebrow}</p>
            <h2 className={styles.title}>{c.title}</h2>
            {c.lead && <p className={styles.lead}>{c.lead}</p>}
          </header>
          {children}
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

export default function InfoPanel({ sectionIndex }) {
  const section = SECTION_BY_INDEX[sectionIndex]
  if (!section) return null
  const c = section.content

  if (c.kind === 'hero') return <Hero c={c} key="hero" />

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
