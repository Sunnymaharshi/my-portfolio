import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SECTION_BY_INDEX } from '../../data/sections'
import { circleSprite } from '../../utils/sprite'

// Target world position of each section's main object (single source of truth)
const SECTION_TARGETS = {
  1: SECTION_BY_INDEX[1].world,
  2: SECTION_BY_INDEX[2].world,
  3: SECTION_BY_INDEX[3].world,
  4: SECTION_BY_INDEX[4].world,
}

const HEAD_DUR  = 1.0   // seconds the head takes to travel the path
const DUST_LIFE = 1.6   // seconds each dust mote takes to fade out (slow)
const DURATION  = HEAD_DUR + DUST_LIFE  // total component life (head + lingering wake)
const TRAIL     = 24    // bright streak segments attached to the head
const TRAIL_FRAC = 0.26 // fraction of the path the bright streak spans
const DUST      = 90    // lingering star-dust motes deposited along the path
const HEAD_COL  = new THREE.Color('#dbeaff')

const easeOut    = (t) => 1 - Math.pow(1 - t, 3)
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// A realistic meteor: a bright head + a short tapering streak attached to it,
// PLUS a wake of soft star-dust motes deposited along the path that linger and
// fade slowly after the head has passed (each with its own birth time, drift
// and shimmer). Taper/fade is done via per-vertex brightness under additive
// blending (black = invisible), since WebGL line width can't vary.
function ShootingStar({ from, to, onComplete }) {
  const headRef  = useRef()
  const lightRef = useRef()
  const trailGeo = useRef()
  const dustGeo  = useRef()
  const elapsed  = useRef(0)
  const done     = useRef(false)

  const fromV = useMemo(() => new THREE.Vector3(...from), [])
  const toV   = useMemo(() => new THREE.Vector3(...to), [])
  const head  = useMemo(() => new THREE.Vector3(), [])
  const tmp   = useMemo(() => new THREE.Vector3(), [])

  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), [])
  const trailCol = useMemo(() => new Float32Array(TRAIL * 3), [])
  const dustPos  = useMemo(() => new Float32Array(DUST * 3), [])
  const dustCol  = useMemo(() => new Float32Array(DUST * 3), [])
  const sprite   = useMemo(() => circleSprite(), [])

  // Per-mote params: where along the path it's deposited, when it's born (when
  // the head reaches that fraction), a small scatter offset, a slow drift and
  // a shimmer phase.
  const motes = useMemo(() => {
    const arr = []
    for (let i = 0; i < DUST; i++) {
      const fi = Math.random()
      arr.push({
        fi,
        born:  HEAD_DUR * (1 - Math.pow(1 - fi, 1 / 3)), // inverse of easeOut
        off:   [(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7],
        drift: [(Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35 + 0.05, (Math.random() - 0.5) * 0.35],
        ph:    Math.random() * 6.283,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (done.current) return
    elapsed.current = Math.min(elapsed.current + delta, DURATION)
    const e = elapsed.current

    const headT    = easeOut(Math.min(e / HEAD_DUR, 1))     // fast in, decelerating
    const headFade = Math.min(1, e / 0.06)                  // quick flare-in
                   * (1 - smoothstep(HEAD_DUR * 0.6, HEAD_DUR, e))  // burn out as it arrives

    // Bright streak attached to the head
    for (let k = 0; k < TRAIL; k++) {
      const f = Math.max(0, headT - (k / (TRAIL - 1)) * TRAIL_FRAC)
      tmp.lerpVectors(fromV, toV, f)
      trailPos[k * 3] = tmp.x; trailPos[k * 3 + 1] = tmp.y; trailPos[k * 3 + 2] = tmp.z
      const b = Math.pow(1 - k / (TRAIL - 1), 1.6) * headFade
      trailCol[k * 3] = HEAD_COL.r * b; trailCol[k * 3 + 1] = HEAD_COL.g * b; trailCol[k * 3 + 2] = HEAD_COL.b * b
    }
    if (trailGeo.current) {
      trailGeo.current.attributes.position.needsUpdate = true
      trailGeo.current.attributes.color.needsUpdate = true
    }

    // Lingering star-dust wake — each mote fades over DUST_LIFE after its birth
    for (let i = 0; i < DUST; i++) {
      const m = motes[i]
      const age = e - m.born
      let a = 0
      if (age >= 0) {
        const tw = 0.6 + 0.4 * Math.sin(e * 9.0 + m.ph)   // shimmer
        a = Math.max(0, 1 - age / DUST_LIFE) * tw
        tmp.lerpVectors(fromV, toV, m.fi)
        dustPos[i * 3]     = tmp.x + m.off[0] + m.drift[0] * age
        dustPos[i * 3 + 1] = tmp.y + m.off[1] + m.drift[1] * age
        dustPos[i * 3 + 2] = tmp.z + m.off[2] + m.drift[2] * age
      }
      dustCol[i * 3] = HEAD_COL.r * a; dustCol[i * 3 + 1] = HEAD_COL.g * a; dustCol[i * 3 + 2] = HEAD_COL.b * a
    }
    if (dustGeo.current) {
      dustGeo.current.attributes.position.needsUpdate = true
      dustGeo.current.attributes.color.needsUpdate = true
    }

    head.lerpVectors(fromV, toV, headT)
    if (headRef.current)  { headRef.current.position.copy(head); headRef.current.material.opacity = headFade }
    if (lightRef.current) { lightRef.current.position.copy(head); lightRef.current.intensity = 5 * headFade }

    if (e >= DURATION && !done.current) {
      done.current = true
      onComplete?.()
    }
  })

  return (
    <group>
      {/* Meteor head — additive so Bloom gives it a soft corona */}
      <mesh ref={headRef} position={from}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshBasicMaterial color="#eaf3ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Brief light flash as it passes nearby objects */}
      <pointLight ref={lightRef} color="#9fc4f0" intensity={0} distance={14} />

      {/* Bright streak attached to the head.
          frustumCulled=false: geometry starts at the origin (zeros) so its
          bounding sphere would otherwise cull it even though the verts move far away. */}
      <line frustumCulled={false}>
        <bufferGeometry ref={trailGeo}>
          <bufferAttribute attach="attributes-position" args={[trailPos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[trailCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </line>

      {/* Lingering star-dust wake — round soft motes that fade slowly */}
      <points frustumCulled={false}>
        <bufferGeometry ref={dustGeo}>
          <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[dustCol, 3]} />
        </bufferGeometry>
        <pointsMaterial map={sprite} vertexColors transparent size={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

// Manages all active shooting stars; must live inside <Canvas>
export default function ShootingStars({ sectionIndex }) {
  const { camera }     = useThree()
  const [stars, setStars] = useState([])
  const prevSection    = useRef(-1)

  useEffect(() => {
    // Skip on first mount
    if (prevSection.current === -1) { prevSection.current = sectionIndex; return }
    if (sectionIndex === prevSection.current) return
    prevSection.current = sectionIndex

    const target = SECTION_TARGETS[sectionIndex]
    if (!target) return

    // Spawn slightly above + to the side of where the camera currently is
    const cam = camera.position
    const from = [
      cam.x + (Math.random() - 0.5) * 30 + 6,
      cam.y + 7 + Math.random() * 8,
      cam.z + (Math.random() - 0.5) * 14,
    ]

    setStars((prev) => [...prev, { id: Date.now(), from, to: target }])
  }, [sectionIndex])

  const remove = useCallback((id) => {
    setStars((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return (
    <>
      {stars.map((s) => (
        <ShootingStar
          key={s.id}
          from={s.from}
          to={s.to}
          onComplete={() => remove(s.id)}
        />
      ))}
    </>
  )
}
