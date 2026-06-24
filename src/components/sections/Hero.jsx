import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Hero.module.css'

const LINES = [
  '> Initializing portfolio...',
  '> Loading star systems...',
  '> Calibrating orbit paths...',
  '> Welcome, explorer.',
]

function TypewriterLine({ text, delay, onDone }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, ++i))
        if (i >= text.length) {
          clearInterval(interval)
          onDone?.()
        }
      }, 38)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay, onDone])

  return (
    <div className={styles.line}>
      <span>{displayed}</span>
      {displayed.length < text.length && <span className={styles.cursor}>_</span>}
    </div>
  )
}

export default function Hero() {
  const [phase, setPhase] = useState(0)

  return (
    <section className={`${styles.hero} section`} id="hero">
      <div className={styles.inner}>
        <div className={styles.terminal}>
          {LINES.slice(0, phase + 1).map((line, i) => (
            <TypewriterLine
              key={i}
              text={line}
              delay={0}
              onDone={i === phase && phase < LINES.length - 1 ? () => setPhase(p => p + 1) : undefined}
            />
          ))}
        </div>

        <motion.div
          className={styles.main}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: phase >= LINES.length - 1 ? 1 : 0, y: phase >= LINES.length - 1 ? 0 : 30 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className={styles.greeting}>Hello, universe. I'm</div>
          <h1 className={styles.name}>
            Maharshi<br />
            <span className={styles.nameAccent}>Reddy</span>
          </h1>
          <p className={styles.role}>
            <span className={styles.mono}>Senior Frontend Engineer</span>
            <span className={styles.dot}> · </span>
            Crafting digital galaxies
          </p>
          <div className={styles.scrollHint}>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <span className={styles.scrollText}>scroll to explore</span>
              <div className={styles.scrollLine} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
