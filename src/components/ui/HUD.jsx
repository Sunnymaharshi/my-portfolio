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
        <span className={`${styles.audioIcon} ${muted ? styles.audioMuted : ''}`}>♪</span>
        <span className={styles.audioLabel}>{muted ? 'SOUND OFF' : 'SOUND ON'}</span>
      </button>

      {/* Section label — top center */}
      <div className={styles.targetLabel}>
        {SECTION_LABELS[sectionIndex] ?? SECTION_LABELS[0]}
      </div>
    </div>
  )
}
