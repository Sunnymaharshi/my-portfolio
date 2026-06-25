import { useState } from 'react'
import styles from './HUD.module.css'
import { audioEngine } from '../../utils/audio'

const SECTION_LABELS = [
  'DEEP SPACE',
  'ORIGIN — ABOUT',
  'SKILL NEBULA — SKILLS',
  'PROJECT SECTOR — PROJECTS',
  'COMM STATION — CONTACT',
]

export default function HUD({ sectionIndex }) {
  const [muted, setMuted] = useState(true)   // sound off until the user enables it

  const onToggleAudio = () => {
    audioEngine.init()                        // unlock/resume the context (gesture)
    setMuted(audioEngine.toggleMute())
  }

  return (
    <div className={styles.hud}>
      {/* Brand — top left: the portfolio belongs to a person, not a ship */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>◈</span>
        <span className={styles.brandName}>MAHARSHI REDDY</span>
      </div>

      {/* Audio toggle — top right */}
      <button className={styles.audioBtn} onClick={onToggleAudio} aria-label="Toggle sound">
        <span className={styles.audioIcon}>
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" fill="currentColor"/>
              <line x1="11" y1="4" x2="14" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="14" y1="4" x2="11" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" fill="currentColor"/>
              <path d="M11 4.5 Q13.5 7 11 9.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
            </svg>
          )}
        </span>
        <span className={styles.audioLabel}>{muted ? 'SOUND OFF' : 'SOUND ON'}</span>
      </button>

      {/* Section label — top center */}
      <div className={styles.targetLabel}>
        {SECTION_LABELS[sectionIndex] ?? SECTION_LABELS[0]}
      </div>
    </div>
  )
}
