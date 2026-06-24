// SectionStars — each section's object appears as a distant twinkling star
// until the camera is close enough for the real geometry to materialise.
//
// fog=false on every material here means these stars are always visible
// regardless of scene fog, just like real stars seen from deep space.

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SECTIONS } from '../../data/sections'

// Positioned exactly at the main 3D object of each section (derived from the
// single source of truth) so the "star" is the first thing you see from afar,
// then the real mesh resolves as you approach.
const STARS = SECTIONS
  .filter(s => s.index !== 0)
  .map(s => ({ pos: s.world, color: s.color }))

// Cross/spike ray geometry — forms the classic star diffraction pattern
function makeCrossGeo() {
  const pts = new Float32Array([
    -1.4, 0, 0,   1.4, 0, 0,   // horizontal ray
     0, -1.4, 0,  0, 1.4, 0,   // vertical ray
    -0.9, -0.9, 0,  0.9,  0.9, 0, // diagonal 1
     0.9, -0.9, 0, -0.9,  0.9, 0, // diagonal 2
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  return geo
}

// Micro-sparkle satellite offsets (tiny secondary stars that blink
// independently — they're the "sparkles" visible even from afar)
const SPARKLE_OFFSETS = [
  [ 0.30,  0.14, 0.05],
  [-0.24,  0.20, 0.00],
  [ 0.08, -0.28, 0.08],
  [-0.18, -0.16, 0.12],
  [ 0.22,  0.05,-0.18],
  [-0.10,  0.25,-0.10],
]

function StarBeacon({ position, color }) {
  const coreRef    = useRef()
  const raysRef    = useRef()
  const sparkles   = useRef([])
  const crossGeo   = useMemo(makeCrossGeo, [])
  const colorObj   = useMemo(() => new THREE.Color(color), [color])
  const posVec     = useMemo(() => new THREE.Vector3(...position), [])

  useFrame(({ camera, clock }) => {
    const t    = clock.elapsedTime
    const dist = camera.position.distanceTo(posVec)

    // Fade beacon out as section geometry materialises inside ~35u
    const vis = dist < 10 ? 0
              : dist < 35 ? (dist - 10) / 25
              : 1

    // Compound-sine scintillation — multiple overlapping frequencies
    // produce the irregular twinkling of a real star
    const sc = (
      Math.sin(t * 7.1        ) * 0.40 +
      Math.sin(t * 13.3 + 0.8 ) * 0.30 +
      Math.sin(t *  3.7 + 2.1 ) * 0.30
    ) * 0.5 + 0.5   // → 0..1

    // Core star — emissiveIntensity drives the Bloom corona
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = (10 + 10 * sc) * vis
      coreRef.current.material.opacity           = Math.min(vis, 1)
    }

    // Diffraction cross rays — scale + opacity breathe with scintillation
    if (raysRef.current) {
      const s = (0.5 + 0.6 * sc) * vis
      raysRef.current.scale.setScalar(s)
      raysRef.current.material.opacity = 0.55 * sc * vis
    }

    // Micro-sparkle satellites — each blinks independently
    sparkles.current.forEach((mesh, i) => {
      if (!mesh) return
      const blink = Math.sin(t * (8.5 + i * 2.3) + i * 1.7)
      const alpha = blink > 0.3 ? ((blink - 0.3) / 0.7) * 0.85 * vis : 0
      mesh.material.opacity           = alpha
      mesh.material.emissiveIntensity = alpha * 9 * vis
    })
  })

  return (
    <group position={position}>
      {/* Core — fog=false so it's visible across any distance */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={colorObj}
          emissiveIntensity={14}
          transparent
          opacity={1}
          fog={false}
        />
      </mesh>

      {/* Diffraction cross — the "spike" pattern of a bright star */}
      <lineSegments ref={raysRef} geometry={crossGeo}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          fog={false}
        />
      </lineSegments>

      {/* Micro-sparkle satellites */}
      {SPARKLE_OFFSETS.map((off, i) => (
        <mesh
          key={i}
          ref={(el) => { sparkles.current[i] = el }}
          position={off}
        >
          <sphereGeometry args={[0.025, 4, 4]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={colorObj}
            emissiveIntensity={8}
            transparent
            opacity={0}
            fog={false}
          />
        </mesh>
      ))}

      {/* Very dim ambient fill — gives nearby space a faint colour cast */}
      <pointLight color={color} intensity={0.5} distance={35} />
    </group>
  )
}

export default function SectionStars() {
  return (
    <>
      {STARS.map((s, i) => (
        <StarBeacon key={i} position={s.pos} color={s.color} />
      ))}
    </>
  )
}
