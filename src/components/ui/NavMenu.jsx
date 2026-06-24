import { useEffect, useRef, useState } from 'react'
import styles from './NavMenu.module.css'
import { navState } from '../../utils/sharedState'
import { SECTIONS, SECTION_BY_INDEX } from '../../data/sections'
import { IS_MOBILE } from '../../utils/device'

// Ordered destinations for the bar (Home + the 4 sectors)
const ITEMS = SECTIONS

// Guided tour visits the 4 content sectors in order, pausing on each.
const TOUR_ORDER = [1, 2, 3, 4]
const TOUR_DWELL = 7000  // ms on each stop (fly-in ~2.5s + reading time)

function flyTo(index) {
  const s = SECTION_BY_INDEX[index]
  if (s) navState.request = (IS_MOBILE && s.viewMobile) ? s.viewMobile : s.view
}

export default function NavMenu({ sectionIndex, onHome, onNavigate }) {
  const [touring, setTouring] = useState(false)
  const [pendingIndex, setPendingIndex] = useState(null)
  const timers = useRef([])
  const resume = SECTION_BY_INDEX[4]?.content?.resume

  // Clear pending once camera arrives at the target section
  useEffect(() => {
    if (pendingIndex !== null && sectionIndex === pendingIndex) {
      setPendingIndex(null)
    }
  }, [sectionIndex, pendingIndex])

  const clearTour = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const stopTour = () => { clearTour(); setTouring(false) }

  const startTour = () => {
    clearTour()
    setTouring(true)
    TOUR_ORDER.forEach((idx, i) => {
      timers.current.push(setTimeout(() => flyTo(idx), i * TOUR_DWELL))
    })
    // auto-stop after the last dwell completes
    timers.current.push(setTimeout(() => setTouring(false), TOUR_ORDER.length * TOUR_DWELL))
  }

  useEffect(() => clearTour, [])

  const handleNav = (index) => {
    if (touring) stopTour()
    setPendingIndex(index)
    if (index === 0) onHome?.()
    else onNavigate?.()
    flyTo(index)
  }

  const activeIndex = pendingIndex ?? sectionIndex

  return (
    <nav className={styles.nav} aria-label="Sections">
      <ul className={styles.list}>
        {ITEMS.map((s) => {
          const active = s.index === activeIndex
          return (
            <li key={s.id}>
              <button
                className={`${styles.item} ${active ? styles.active : ''}`}
                onClick={() => handleNav(s.index)}
                style={active ? { '--dot': s.color } : undefined}
              >
                <span className={styles.dot} style={{ background: active ? s.color : undefined }} />
                {s.label}
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.divider} />

      <button
        className={`${styles.tour} ${touring ? styles.touring : ''}`}
        onClick={touring ? stopTour : startTour}
      >
        {touring ? '■ Stop tour' : '▶ Tour'}
      </button>

      {resume && (
        <a className={styles.resume} href={resume} target="_blank" rel="noreferrer" download>
          Résumé <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle',marginLeft:2}}><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>
        </a>
      )}
    </nav>
  )
}
