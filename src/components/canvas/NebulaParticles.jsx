// Particle clouds placed at midpoints between camera waypoints.
// Fog naturally reveals/hides them as the camera passes through.

import { useMemo } from 'react'
import * as THREE from 'three'
import { circleSprite } from '../../utils/sprite'

// Midpoints between consecutive section waypoints (kept in step with sections.js)
const CLOUDS = [
  { center: [13,   5,  122], color: '#4a90d9', count: 500, spread: 32 },  // Hero→About
  { center: [-33, 19,   15], color: '#8c7fe0', count: 420, spread: 34 },  // About→Skills
  { center: [-3,  -2,  -65], color: '#c8deff', count: 480, spread: 38 },  // Skills→Projects
  { center: [23, -24, -133], color: '#3a6a9a', count: 380, spread: 34 },  // Projects→Contact
]

function Cloud({ center, color, count, spread }) {
  const positions = useMemo(() => {
    const pts = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const θ = Math.random() * Math.PI * 2
      const φ = (Math.random() - 0.5) * Math.PI
      const r = Math.pow(Math.random(), 0.4) * spread
      pts[i * 3]     = center[0] + r * Math.cos(θ) * Math.cos(φ)
      pts[i * 3 + 1] = center[1] + r * Math.sin(φ) * 0.28  // flatten vertically
      pts[i * 3 + 2] = center[2] + r * Math.sin(θ) * Math.cos(φ)
    }
    return pts
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={circleSprite()}
        color={color}
        size={0.5}
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function NebulaParticles() {
  return (
    <>
      {CLOUDS.map((c, i) => <Cloud key={i} {...c} />)}
    </>
  )
}
