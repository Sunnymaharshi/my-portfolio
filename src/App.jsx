import { useState } from 'react'
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
      {loaded && <InfoPanel sectionIndex={sectionIndex} />}
      {loaded && <EdgeHints activeSectionIndex={sectionIndex} />}
      {loaded && <NavMenu sectionIndex={sectionIndex} />}
      {loaded && <HUD sectionIndex={sectionIndex} />}

      <LoadingScreen
        onReveal={() => setMountScene(true)}     // start mounting scene behind the overlay
        onLoaded={() => setLoaded(true)}         // overlay gone — enable UI
      />
    </>
  )
}
