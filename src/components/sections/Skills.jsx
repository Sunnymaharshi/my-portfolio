import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Skills.module.css'

const SKILL_GROUPS = [
  {
    label: 'Core Systems',
    skills: [
      { name: 'React / Next.js', level: 95 },
      { name: 'TypeScript', level: 90 },
      { name: 'JavaScript (ES2024)', level: 98 },
    ],
  },
  {
    label: 'Visual Layer',
    skills: [
      { name: 'CSS / Tailwind', level: 92 },
      { name: 'GSAP / Framer Motion', level: 88 },
      { name: 'Three.js / WebGL', level: 80 },
    ],
  },
  {
    label: 'Backend & Infra',
    skills: [
      { name: 'Node.js / Express', level: 82 },
      { name: 'GraphQL', level: 78 },
      { name: 'AWS / Vercel', level: 75 },
    ],
  },
]

export default function Skills() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className={`${styles.skills} section`} id="skills" ref={ref}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.sectionTag}>// skill tree</div>
          <h2 className={styles.heading}>Ability<br /><span className={styles.accent}>Loadout</span></h2>
          <p className={styles.sub}>Hover the orbiting moons to interact with skills in 3D</p>
        </motion.div>

        <div className={styles.groups}>
          {SKILL_GROUPS.map((group, gi) => (
            <motion.div
              key={group.label}
              className={styles.group}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + gi * 0.15, duration: 0.7 }}
            >
              <div className={styles.groupLabel}>{group.label}</div>
              <div className={styles.skillList}>
                {group.skills.map((skill, si) => (
                  <motion.div
                    key={skill.name}
                    className={styles.skill}
                    initial={{ opacity: 0, x: -15 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.35 + gi * 0.15 + si * 0.08, duration: 0.5 }}
                  >
                    <div className={styles.skillRow}>
                      <span className={styles.skillName}>{skill.name}</span>
                      <span className={styles.skillPct}>{skill.level}%</span>
                    </div>
                    <div className={styles.track}>
                      <motion.div
                        className={styles.fill}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${skill.level}%` } : {}}
                        transition={{ delay: 0.5 + gi * 0.15 + si * 0.08, duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
