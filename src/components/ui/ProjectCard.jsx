import { motion, AnimatePresence } from 'framer-motion'
import styles from './ProjectCard.module.css'

export default function ProjectCard({ project, onClose }) {
  if (!project) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.card}
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          style={{ '--project-color': project.color }}
        >
          <div className={styles.header}>
            <div
              className={styles.starIcon}
              style={{ background: project.color, boxShadow: `0 0 18px ${project.color}` }}
            />
            <div>
              <div className={styles.systemLabel}>MISSION FILE</div>
              <h2 className={styles.name}>{project.name}</h2>
            </div>
            <button className={styles.close} onClick={onClose}>✕</button>
          </div>

          <p className={styles.tagline}>{project.tagline}</p>

          {project.highlights && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>KEY METRICS</div>
              <ul className={styles.highlights}>
                {project.highlights.map((h, i) => (
                  <li key={i} className={styles.highlight}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionLabel}>TECH STACK</div>
            <div className={styles.tags}>
              {project.tech.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className={styles.btn}
              >
                View Code ↗
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
