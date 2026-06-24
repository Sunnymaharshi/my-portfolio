import { motion } from 'framer-motion'
import styles from './Nav.module.css'

const links = ['About', 'Skills', 'Projects', 'Contact']

export default function Nav() {
  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      className={styles.nav}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.5 }}
    >
      <span className={styles.logo}>MR</span>
      <div className={styles.links}>
        {links.map((link, i) => (
          <motion.button
            key={link}
            className={styles.link}
            onClick={() => scrollTo(link)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 + i * 0.1 }}
          >
            <span className={styles.index}>0{i + 1}.</span> {link}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  )
}
