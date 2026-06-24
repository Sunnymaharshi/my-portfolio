import { useEffect, useRef, useState } from 'react'
import styles from './NavMenu.module.css'
import { navState } from '../../utils/sharedState'
import { SECTIONS, SECTION_BY_INDEX } from '../../data/sections'

// Ordered destinations for the bar (Home + the 4 sectors)
const ITEMS = SECTIONS

// Guided tour visits the 4 content sectors in order, pausing on each.
const TOUR_ORDER = [1, 2, 3, 4]
const TOUR_DWELL = 7000  // ms on each stop (fly-in ~2.5s + reading time)

function flyTo(index) {
  const s = SECTION_BY_INDEX[index]
  if (s) navState.request = s.view
}

export default function NavMenu({ sectionIndex, onHome }) {
  const [touring, setTouring] = useState(false)
  const timers = useRef([])
  const resume = SECTION_BY_INDEX[4]?.content?.resume

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
    if (index === 0) onHome?.()   // tapping Home brings the hero back
    flyTo(index)
  }

  return (
    <nav className={styles.nav} aria-label="Sections">
      <ul className={styles.list}>
        {ITEMS.map((s) => {
          const active = s.index === sectionIndex
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
        <a className={styles.resume} href={resume} target="_blank" rel="noreferrer">
          Résumé ↗
        </a>
      )}
    </nav>
  )
}
