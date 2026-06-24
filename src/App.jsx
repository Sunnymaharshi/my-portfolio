import { useState, useEffect } from 'react'
import SpaceScene from './components/canvas/SpaceScene'
import EdgeHints from './components/canvas/EdgeHints'
import HUD from './components/ui/HUD'
import NavMenu from './components/ui/NavMenu'
import InfoPanel from './components/ui/InfoPanel'
import LoadingScreen from './components/ui/LoadingScreen'

export default function App() {
  const [sectionIndex, setSectionIndex] = useState(0)
  const [mountScene, setMountScene]     = useState(false)  // defer heavy 3D until name is drawn
  const [loaded, setLoaded]             = useState(false)
  const [showHero, setShowHero]         = useState(true)   // hero shows at first; hidden once exploring

  // Hide the centered hero as soon as the user starts exploring (drag / scroll /
  // pinch). It does NOT come back on idle — only when the user taps Home (which
  // calls setShowHero(true) via NavMenu's onHome).
  useEffect(() => {
    const hide = () => setShowHero(false)
    const onMove = (e) => { if (e.buttons) hide() }   // drag only, not hover
    window.addEventListener('pointermove', onMove)
    window.addEventListener('wheel', hide, { passive: true })
    window.addEventListener('touchmove', hide, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('wheel', hide)
      window.removeEventListener('touchmove', hide)
    }
  }, [])

  return (
    <>
      {/* The 3D scene mounts only once the loading name has finished drawing,
          so the intro animation runs on an unobstructed main thread, and the
          shader-compile jank is hidden behind the still-opaque overlay. */}
      {mountScene && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <SpaceScene onSectionChange={setSectionIndex} />
        </div>
      )}

      {/* DOM portfolio layer — readable content, nav and beacons.
          The 3D world is the immersive stage; reading happens here. */}
      {loaded && <InfoPanel sectionIndex={sectionIndex} showHero={showHero} />}
      {loaded && <EdgeHints activeSectionIndex={sectionIndex} showHero={showHero} />}
      {loaded && <NavMenu sectionIndex={sectionIndex} onHome={() => setShowHero(true)} />}
      {loaded && <HUD sectionIndex={sectionIndex} />}

      <LoadingScreen
        onReveal={() => setMountScene(true)}     // start mounting scene behind the overlay
        onLoaded={() => setLoaded(true)}         // overlay gone — enable UI
      />
    </>
  )
}
