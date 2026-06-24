// Globular star cluster — a dense, centrally-concentrated ball of stars.
// Deep-background scenery, additive + fog=false. Cool blue-white palette.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { circleSprite } from '../../utils/sprite'
import { IS_MOBILE } from '../../utils/device'

function buildCluster({ count, radius }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const white = new THREE.Color('#e6f0ff')
  const blue  = new THREE.Color('#8fb6ef')
  const c = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const r = radius * Math.pow(Math.random(), 2.0)   // dense core, sparse halo
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    pos[i * 3]     = r * s * Math.cos(th)
    pos[i * 3 + 1] = r * u
    pos[i * 3 + 2] = r * s * Math.sin(th)

    c.copy(white).lerp(blue, Math.random() * 0.7)
    const b = 0.55 + 0.45 * Math.random()
    col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

export default function StarCluster({ position = [0, 0, 0], radius = 9, spin = 0.01 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildCluster({ count: IS_MOBILE ? 1400 : 3200, radius }),
    [],
  )
  const sprite = useMemo(() => circleSprite(), [])

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * spin })

  return (
    <group position={position}>
      <points ref={ref} geometry={geo}>
        <pointsMaterial
          map={sprite}
          vertexColors
          transparent
          opacity={0.9}
          size={0.32}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>
      {/* soft core glow */}
      <mesh>
        <sphereGeometry args={[radius * 0.32, 16, 16]} />
        <meshBasicMaterial color="#bcd4f5" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
