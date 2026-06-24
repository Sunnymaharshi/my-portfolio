import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { cameraState, navState } from '../../utils/sharedState'
import { audioEngine } from '../../utils/audio'
import { SECTIONS, SECTION_BY_INDEX } from '../../data/sections'
import { IS_MOBILE, RENDER_DPR, RENDER_MSAA } from '../../utils/device'

import Stars from './Stars'
import Galaxy from './Galaxy'
import ButterflyNebula from './ButterflyNebula'
import StarCluster from './StarCluster'
import BackgroundConstellations from './BackgroundConstellations'
import NebulaParticles from './NebulaParticles'
import Planet from './Planet'
import BlackHole from './BlackHole'
import ProjectGalaxy from './ProjectGalaxy'
import SpaceStation from './SpaceStation'
import SectionStars from './SectionBeacons'

// World-space centres of each section — derived from the single source of truth
// so positions can never drift out of sync with the nav / panels / beacons.
const SECTION_ZONES = SECTIONS
  .filter(s => s.index !== 0)
  .map(s => ({ index: s.index, pos: new THREE.Vector3(...s.world) }))

// Reusable objects — no per-frame allocation
const _cursorDir = new THREE.Vector3()
const _navUp     = new THREE.Vector3(0, 1, 0)
const _targetPos = new THREE.Vector3()
const _lookV     = new THREE.Vector3()
const _mat       = new THREE.Matrix4()
const _tq        = new THREE.Quaternion()

// ---------- Writes camera reference into shared store each frame ----------
function CameraSync() {
  const { camera, size } = useThree()
  useFrame(() => {
    cameraState.camera = camera
    cameraState.width  = size.width
    cameraState.height = size.height
  })
  return null
}

// ---------- Drag-to-look + scroll-to-fly camera ----------
function DragLookCamera({ onSectionChange }) {
  const { camera, gl } = useThree()
  const dragging  = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const scrollVel = useRef(0)
  const prevSec   = useRef(-1)

  useEffect(() => {
    const canvas = gl.domElement

    const onDown = (e) => {
      audioEngine.init()         // first gesture unlocks audio
      dragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      document.body.style.cursor = 'grabbing'
      navState.request = null    // taking manual control cancels any guided fly-to
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
    }
    const onMove = (e) => {
      cursorPos.current = { x: e.clientX, y: e.clientY }
      if (!dragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      const euler = new THREE.Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(camera.quaternion)
      euler.y += dx * 0.004
      euler.x += dy * 0.003
      euler.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, euler.x))
      camera.quaternion.setFromEuler(euler)
    }
    const onWheel = (e) => {
      e.preventDefault()
      audioEngine.init()         // first gesture unlocks audio
      navState.request = null    // manual flight cancels any guided fly-to
      scrollVel.current += e.deltaY * 0.04
      scrollVel.current = Math.max(-15, Math.min(15, scrollVel.current))
    }

    // One finger = look around. Two fingers (pinch) = fly: spread to move
    // forward toward the pinch point, pinch in to back up — the touch equivalent
    // of scroll-to-fly (mobile has no wheel).
    let lastTouch = null
    let pinchDist = null
    const onTouchStart = (e) => {
      audioEngine.init()              // first touch unlocks audio
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        pinchDist = null
      } else if (e.touches.length === 2) {
        lastTouch = null
        const [a, b] = e.touches
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        navState.request = null       // manual flight cancels any guided fly-to
      }
    }
    const onTouchMove = (e) => {
      // ── Two-finger pinch → fly ──
      if (e.touches.length === 2 && pinchDist != null) {
        const [a, b] = e.touches
        const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        cursorPos.current = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
        scrollVel.current += (d - pinchDist) * 0.25
        scrollVel.current = Math.max(-15, Math.min(15, scrollVel.current))
        pinchDist = d
        return
      }
      // ── One-finger drag → look ──
      if (e.touches.length !== 1 || !lastTouch) return
      const dx = e.touches[0].clientX - lastTouch.x
      const dy = e.touches[0].clientY - lastTouch.y
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const euler = new THREE.Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(camera.quaternion)
      euler.y += dx * 0.005
      euler.x += dy * 0.004
      euler.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, euler.x))
      camera.quaternion.setFromEuler(euler)
    }
    const onTouchEnd = (e) => {
      // Lifting one finger of a pinch: keep looking with the remaining finger.
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        pinchDist = null
      } else {
        lastTouch = null
        pinchDist = null
      }
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useFrame((_, dt) => {
    // ── Guided fly-to: tween BOTH position and orientation toward a section
    //    view pose, then clear. Framerate-independent damping. ──────────────
    if (navState.request) {
      const { pos, look } = navState.request
      _targetPos.set(pos[0], pos[1], pos[2])
      _lookV.set(look[0], look[1], look[2])

      const posA = 1 - Math.pow(0.92, dt * 60)   // ~0.08 / frame @60fps
      const rotA = 1 - Math.pow(0.88, dt * 60)   // ~0.12 / frame @60fps
      camera.position.lerp(_targetPos, posA)
      _mat.lookAt(camera.position, _lookV, _navUp)
      _tq.setFromRotationMatrix(_mat)
      camera.quaternion.slerp(_tq, rotA)

      if (camera.position.distanceTo(_targetPos) < 0.4) {
        camera.position.copy(_targetPos)
        camera.quaternion.copy(_tq)
        navState.request = null
      }
    }

    // ── Scroll inertia: fly along cursor ray ───────────
    if (Math.abs(scrollVel.current) > 0.01) {
      const ndcX = (cursorPos.current.x / window.innerWidth)  *  2 - 1
      const ndcY = (cursorPos.current.y / window.innerHeight) * -2 + 1
      _cursorDir.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
      camera.position.addScaledVector(_cursorDir, scrollVel.current * dt * 25)
      scrollVel.current *= 0.88
    }

    // Feed normalized fly speed to the audio whoosh
    audioEngine.setFlySpeed(Math.abs(scrollVel.current) / 15)

    // ── Proximity-based section detection ──────────────
    // Used only to drive UI state (nav highlight + which panel shows). The
    // camera is NEVER auto-snapped here — orientation is the user's, unless
    // they explicitly request a guided fly-to from the nav / beacons.
    let nearIdx = 0, nearDist = Infinity
    SECTION_ZONES.forEach(z => {
      const d = camera.position.distanceTo(z.pos)
      if (d < nearDist) { nearIdx = z.index; nearDist = d }
    })
    const sec = nearDist < 50 ? nearIdx : 0
    if (sec !== prevSec.current) {
      prevSec.current = sec
      onSectionChange?.(sec)
    }
  })

  return null
}

// ---------- Scene contents ----------
function Scene({ onSectionChange }) {
  const [sectionIndex, setSectionIndex] = useState(0)

  const handleSection = (idx) => {
    setSectionIndex(idx)
    onSectionChange?.(idx)
  }

  return (
    <>
      <CameraSync />
      <DragLookCamera onSectionChange={handleSection} />

      <ambientLight intensity={0.03} color="#050d1a" />
      <directionalLight position={[-5, 3, 5]} color="#c8deff" intensity={0.65} />

      <Stars />
      <Galaxy />
      <ButterflyNebula position={[150, 20, -105]} rotation={[0.2, Math.PI / 2, 0.12]} />
      <StarCluster position={[-55, 50, 35]} radius={9} />
      <BackgroundConstellations />
      {/* <NebulaParticles /> */}

      <Planet position={SECTION_BY_INDEX[1].world} scale={2.5} />

      <BlackHole
        position={SECTION_BY_INDEX[2].world}
        showLabels={sectionIndex === 2}
        active={sectionIndex === 2}
      />

      <ProjectGalaxy center={SECTION_BY_INDEX[3].world} sectionActive={sectionIndex === 3} />

      <SpaceStation position={SECTION_BY_INDEX[4].world} active={sectionIndex === 4} />

      <SectionStars />

      {/* <fog attach="fog" args={['#010508', 30, 90]} /> */}

      <EffectComposer multisampling={RENDER_MSAA}>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.07}
          luminanceSmoothing={0.5}
          radius={0.88}
          mipmapBlur
        />
        {/* DepthOfField removed — its fixed near focus plane left all of deep
            space / the hero view blurry. Everything is crisp now (also the
            cheapest post pass to drop for low-end GPUs). */}
        <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.16} />
        <Vignette offset={0.28} darkness={0.88} />
      </EffectComposer>
    </>
  )
}

// ---------- Canvas root ----------
export default function SpaceScene({ onSectionChange }) {
  return (
    <Canvas
      camera={{ position: [0, 12, 200], fov: 60, near: 0.1, far: 800 }}
      gl={{ antialias: true, alpha: false }}
      dpr={RENDER_DPR}
      style={{ background: '#000000' }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 4, 175)
        gl.domElement.style.touchAction = 'none'
        gl.setClearColor('#000000', 1)
      }}
    >
      <Scene onSectionChange={onSectionChange} />
    </Canvas>
  )
}
