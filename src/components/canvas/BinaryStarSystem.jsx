import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'
import { circleSprite } from '../../utils/sprite'

const FONT = '/fonts/SpaceMono-Regular.ttf'
const cnt  = n => Math.round(IS_MOBILE ? n * 0.5 : n)

// Codesense = violet, larger; API Rate Limiter = sky-blue, smaller
const STARS = [
  { id: 'codesense',    name: 'Codesense',       color: '#9b8cf5', radius: 1.20, orbitR: 3.2, orbitSpd:  0.18, ph: 0 },
  { id: 'rate-limiter', name: 'API Rate Limiter', color: '#6fb0ef', radius: 0.80, orbitR: 5.0, orbitSpd: -0.18, ph: Math.PI },
]

function Star({ data }) {
  const coreRef  = useRef()
  const orbitRef = useRef()

  useFrame((state) => {
    const t  = state.clock.elapsedTime
    const a  = t * data.orbitSpd + data.ph
    if (orbitRef.current) {
      orbitRef.current.position.set(
        Math.cos(a) * data.orbitR,
        Math.sin(a * 0.3) * 0.6,
        Math.sin(a) * data.orbitR,
      )
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 1.8 + data.ph) * 0.05
      coreRef.current.scale.setScalar(pulse)
    }
  })

  const ring = useMemo(() => {
    const n   = cnt(60)
    const pts = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = data.radius * 2.0 + Math.random() * data.radius * 1.2
      pts[i * 3]     = Math.cos(a) * r
      pts[i * 3 + 1] = (Math.random() - 0.5) * 0.4
      pts[i * 3 + 2] = Math.sin(a) * r
    }
    return pts
  }, [])

  const col = new THREE.Color(data.color)

  return (
    <group ref={orbitRef}>
      {/* Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[data.radius, 20, 20]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.4} />
      </mesh>
      {/* Soft halo */}
      <mesh>
        <sphereGeometry args={[data.radius * 2.2, 12, 12]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.05} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Orbital debris ring */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={data.color} size={0.10}
          transparent opacity={0.55} sizeAttenuation
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
      <pointLight color={data.color} intensity={5} distance={28} />
      {/* Name tag */}
      <Billboard position={[0, data.radius + 1.6, 0]}>
        <Text
          fontSize={0.20} color={data.color}
          anchorX="center" anchorY="middle"
          letterSpacing={0.10} font={FONT} fillOpacity={0.88}
        >
          {data.name.toUpperCase()}
        </Text>
      </Billboard>
    </group>
  )
}

export default function BinaryStarSystem({ position = [0, 0, 0] }) {
  // Surrounding violet+blue nebula cloud
  const nebulaGeo = useMemo(() => {
    const n   = cnt(900)
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const cA  = new THREE.Color('#9b8cf5')
    const cB  = new THREE.Color('#6fb0ef')
    for (let i = 0; i < n; i++) {
      const phi   = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r     = 6 + Math.pow(Math.random(), 0.7) * 6
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.55
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
      const c = cA.clone().lerp(cB, Math.random())
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  return (
    <group position={position}>
      {STARS.map(s => <Star key={s.id} data={s} />)}
      <points geometry={nebulaGeo}>
        <pointsMaterial
          vertexColors size={0.18} map={circleSprite()}
          transparent opacity={0.08} alphaTest={0.01} sizeAttenuation
          depthWrite={false} blending={THREE.AdditiveBlending} fog={false}
        />
      </points>
    </group>
  )
}
