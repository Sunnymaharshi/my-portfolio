import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function SpaceStation({ position = [-4, -1, -3], active }) {
  const groupRef  = useRef()
  const solarRef  = useRef()
  const beaconRef = useRef()
  const ringRef   = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current)  groupRef.current.rotation.y  = t * 0.06
    if (solarRef.current)  solarRef.current.rotation.z  = t * 0.03
    if (ringRef.current)   ringRef.current.rotation.z   = t * 0.12
    if (beaconRef.current) beaconRef.current.intensity  = 0.8 + Math.sin(t * 2.4) * 0.5
  })

  return (
    <group position={position}>
      {/* Rotating station geometry */}
      <group ref={groupRef}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.9, 12]} />
          <meshStandardMaterial color="#0d1e38" emissive="#1a3a6a" emissiveIntensity={active ? 0.65 : 0.35} metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.07, 8, 40]} />
          <meshStandardMaterial color="#4a90d9" emissive="#4a90d9" emissiveIntensity={active ? 1.2 : 0.6} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.035, 6, 32]} />
          <meshStandardMaterial color="#c8deff" emissive="#c8deff" emissiveIntensity={active ? 0.8 : 0.4} metalness={0.9} roughness={0.1} />
        </mesh>
        <group ref={solarRef}>
          <mesh position={[1.5, 0, 0]}><boxGeometry args={[1.1, 0.02, 0.48]} /><meshStandardMaterial color="#0a3a6a" emissive="#1a5a9a" emissiveIntensity={0.25} /></mesh>
          <mesh position={[-1.5, 0, 0]}><boxGeometry args={[1.1, 0.02, 0.48]} /><meshStandardMaterial color="#0a3a6a" emissive="#1a5a9a" emissiveIntensity={0.25} /></mesh>
        </group>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.22, 8]} />
          <meshStandardMaterial color="#c8deff" emissive="#c8deff" emissiveIntensity={0.5} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.88, 0, Math.sin(a) * 0.88]}>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshStandardMaterial color="#08192e" emissive="#1a4a8a" emissiveIntensity={active ? 0.9 : 0.45} />
            </mesh>
          )
        })}
      </group>

      <pointLight ref={beaconRef} color="#4a90d9" intensity={0.8} distance={12} />
      <pointLight color="#c8deff" intensity={0.3} distance={5} position={[0, 0.8, 0.5]} />
      {/* Contact details + links now live in the readable DOM Contact panel */}
    </group>
  )
}
