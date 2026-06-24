// Tumbling asteroids near the hero camera position (z=165–205).
// Fog (end=55) hides them completely once the camera leaves section 0.

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// Stable random asteroid data generated once at module load
const ASTEROIDS = Array.from({ length: 18 }, (_, i) => {
  const seed = i * 7.3
  const pseudo = (n) => Math.abs(Math.sin(seed + n) * 10000) % 1
  return {
    position: [
      (pseudo(1) - 0.5) * 56,
      (pseudo(2) - 0.35) * 28,
      165 + pseudo(3) * 40,
    ],
    scale: 0.45 + pseudo(4) * 2.1,
    rotSpeed: [
      (pseudo(5) - 0.5) * 0.28,
      (pseudo(6) - 0.5) * 0.22,
      (pseudo(7) - 0.5) * 0.18,
    ],
    detail: pseudo(8) > 0.6 ? 1 : 0,  // mix of rough and very rough
  }
})

function Asteroid({ position, scale, rotSpeed, detail }) {
  const ref = useRef()

  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.x += rotSpeed[0] * dt
    ref.current.rotation.y += rotSpeed[1] * dt
    ref.current.rotation.z += rotSpeed[2] * dt
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, detail]} />
      <meshStandardMaterial
        color="#151e2e"
        emissive="#0a1220"
        emissiveIntensity={0.4}
        roughness={0.92}
        metalness={0.08}
      />
    </mesh>
  )
}

export default function AsteroidField() {
  return (
    <>
      {ASTEROIDS.map((a, i) => <Asteroid key={i} {...a} />)}
    </>
  )
}
