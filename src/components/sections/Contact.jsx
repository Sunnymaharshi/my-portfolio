import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Contact.module.css'

export default function Contact() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className={`${styles.contact} section`} id="contact" ref={ref}>
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.sectionTag}>// space station</div>
          <h2 className={styles.heading}>
            Transmit<br /><span className={styles.accent}>Message</span>
          </h2>
          <p className={styles.sub}>
            Open to new missions.<br />
            Let's build something extraordinary.
          </p>
          <div className={styles.coords}>
            <div className={styles.coord}>
              <span className={styles.coordLabel}>EMAIL</span>
              <a href="mailto:thangasanimaharshireddy@gmail.com" className={styles.coordVal}>
                thangasanimaharshireddy@gmail.com
              </a>
            </div>
            <div className={styles.coord}>
              <span className={styles.coordLabel}>LOCATION</span>
              <span className={styles.coordVal}>Earth, Milky Way</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.terminal}
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className={styles.termHeader}>
            <div className={styles.dot} style={{ background: '#ff5f57' }} />
            <div className={styles.dot} style={{ background: '#febc2e' }} />
            <div className={styles.dot} style={{ background: '#28c840' }} />
            <span className={styles.termTitle}>transmission.sh</span>
          </div>

          {!sent ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>{'>'} SENDER_NAME</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{'>'} SIGNAL_ORIGIN</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{'>'} TRANSMISSION_BODY</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  placeholder="Your message..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <button className={styles.send} type="submit">
                ▶ TRANSMIT MESSAGE
              </button>
            </form>
          ) : (
            <motion.div
              className={styles.success}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.successIcon}>✦</div>
              <div className={styles.successText}>Signal received.</div>
              <div className={styles.successSub}>I'll be in touch from the stars.</div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Built by Maharshi Reddy · 2024</span>
        <span className={styles.footerMono}>react-three-fiber · gsap · framer-motion</span>
      </div>
    </section>
  )
}
