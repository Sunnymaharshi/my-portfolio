import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './About.module.css'

const STATS = [
  { label: 'XP', value: '5+ yrs', bar: 85 },
  { label: 'PROJECTS', value: '30+', bar: 90 },
  { label: 'FOCUS', value: 'Frontend', bar: 95 },
]

export default function About() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className={`${styles.about} section`} id="about" ref={ref}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, x: -40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className={styles.hud}>
          <div className={styles.hudHeader}>
            <span className={styles.hudLabel}>ENTITY.PROFILE</span>
            <span className={styles.hudStatus}>● ONLINE</span>
          </div>

          <div className={styles.avatar}>
            <div className={styles.avatarRing} />
            <div className={styles.avatarCore}>MR</div>
          </div>

          <div className={styles.stats}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className={styles.stat}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
              >
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{s.value}</span>
                </div>
                <div className={styles.bar}>
                  <motion.div
                    className={styles.barFill}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${s.bar}%` } : {}}
                    transition={{ delay: 0.5 + i * 0.15, duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={styles.text}>
          <div className={styles.sectionTag}>// about me</div>
          <h2 className={styles.heading}>
            Building interfaces<br />
            <span className={styles.accent}>that feel alive</span>
          </h2>
          <p className={styles.body}>
            I'm a senior frontend engineer who obsesses over the intersection of performance and beauty. I craft experiences that push the boundaries of what the browser can do — from buttery-smooth animations to real-time 3D environments.
          </p>
          <p className={styles.body}>
            When I'm not turning design mocks into pixel-perfect reality, I'm exploring creative coding, generative art, and building things that make people say "wait, how did you do that?"
          </p>
        </div>
      </motion.div>
    </section>
  )
}
