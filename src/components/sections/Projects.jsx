import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import ProjectCard from '../ui/ProjectCard'
import styles from './Projects.module.css'

const PROJECTS = [
  {
    id: 'project-1',
    name: 'Project Alpha',
    tagline: 'Replace with your project description. What problem did it solve? What was your role?',
    tech: ['React', 'Node.js', 'MongoDB'],
    color: '#4a90d9',
    github: '#',
    live: '#',
  },
  {
    id: 'project-2',
    name: 'Project Beta',
    tagline: 'Replace with your project description. What problem did it solve? What was your role?',
    tech: ['TypeScript', 'GraphQL', 'AWS'],
    color: '#7bb3f0',
    github: '#',
    live: '#',
  },
]

export default function Projects() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [selected, setSelected] = useState(null)

  return (
    <section className={`${styles.projects} section`} id="projects" ref={ref}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.sectionTag}>// star systems</div>
          <h2 className={styles.heading}>
            Project<br /><span className={styles.accent}>Galaxy</span>
          </h2>
          <p className={styles.sub}>Click a star system in 3D space or select below</p>
        </motion.div>

        <div className={styles.grid}>
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.id}
              className={styles.card}
              style={{ '--c': project.color }}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
              onClick={() => setSelected(project)}
              whileHover={{ y: -4 }}
            >
              <div className={styles.cardGlow} />
              <div className={styles.starDot} style={{ background: project.color }} />
              <div className={styles.systemId}>SYSTEM {String(i + 1).padStart(2, '0')}</div>
              <h3 className={styles.projectName}>{project.name}</h3>
              <p className={styles.projectDesc}>{project.tagline}</p>
              <div className={styles.techRow}>
                {project.tech.map((t) => (
                  <span key={t} className={styles.techTag}>{t}</span>
                ))}
              </div>
              <div className={styles.explore}>Explore system →</div>
            </motion.div>
          ))}
        </div>
      </div>

      {selected && (
        <ProjectCard project={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
