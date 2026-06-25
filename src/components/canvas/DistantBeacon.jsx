// Distant star twinkling effect — marks far-away nebulae so users know to explore.
// Multi-frequency flicker mimics real atmospheric scintillation. Fades out
// smoothly once you're close enough to see the nebula itself.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FADE_START = 250
const FADE_END   = 100

export default function DistantBeacon({ position, color = '#b8d8ff' }) {
  const coreRef = useRef()
  const haloRef = useRef()
  const grpRef  = useRef()
  const _pos    = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]])

  useFrame((state) => {
    const dist = state.camera.position.distanceTo(_pos)
    const vis  = THREE.MathUtils.clamp((dist - FADE_END) / (FADE_START - FADE_END), 0, 1)

    if (grpRef.current) grpRef.current.visible = vis > 0.01
    if (vis < 0.01) return

    const t     = state.clock.elapsedTime
    const phase = (_pos.x + _pos.y + _pos.z) * 0.07

    // Combine three incommensurable frequencies → aperiodic, natural-looking twinkle
    const twinkle = Math.max(0.08,
      0.50
      + 0.25 * Math.sin(t * 3.10 + phase)
      + 0.15 * Math.sin(t * 7.30 + phase * 1.3)
      + 0.10 * Math.cos(t * 13.7 + phase * 0.7)
    ) * vis

    if (coreRef.current) {
      coreRef.current.opacity = twinkle * 0.95
      // Slight scale pulse so the bloom footprint breathes
      const s = 0.80 + 0.20 * twinkle
      grpRef.current.scale.setScalar(s)
    }
    if (haloRef.current) {
      haloRef.current.opacity = twinkle * 0.22
    }
  })

  return (
    <group ref={grpRef} position={position}>
      {/* Bright core — bloom turns this into a star-like glow */}
      <mesh>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshBasicMaterial ref={coreRef} color={color} transparent opacity={0.9}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      {/* Soft outer corona */}
      <mesh>
        <sphereGeometry args={[5.5, 8, 8]} />
        <meshBasicMaterial ref={haloRef} color={color} transparent opacity={0.18}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
