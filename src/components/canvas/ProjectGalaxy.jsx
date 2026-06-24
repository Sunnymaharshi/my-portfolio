import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { circleSprite } from '../../utils/sprite'

const FONT = '/fonts/SpaceMono-Regular.ttf'

// Offsets are relative to the section centre (passed in as `center`), so the
// whole sector moves in one place — see sections.js.
export const PROJECTS = [
  {
    id: 'codesense',
    name: 'Codesense',
    color: '#9b8cf5',
    offset: [-4, 3, -2],
    github: 'https://github.com/Sunnymaharshi/codesense',
  },
  {
    id: 'rate-limiter',
    name: 'API Rate Limiter',
    color: '#6fb0ef',
    offset: [5, -3, 3],
    github: 'https://github.com/Sunnymaharshi/python/tree/main/fast-api/api-rate-limiter',
  },
]

function StarSystem({ project, center, sectionActive }) {
  const position = [
    center[0] + project.offset[0],
    center[1] + project.offset[1],
    center[2] + project.offset[2],
  ]
  const coreRef  = useRef()
  const groupRef = useRef()
  const [hov, setHov] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) groupRef.current.rotation.y = t * 0.05
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 1.5) * 0.06
      coreRef.current.scale.setScalar((hov || sectionActive) ? pulse * 1.35 : pulse)
    }
  })

  const particles = useMemo(() => {
    const pts = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) {
      const a = (i / 80) * Math.PI * 2
      const r = 1.8 + Math.random() * 3.2
      pts[i * 3]     = Math.cos(a) * r
      pts[i * 3 + 1] = (Math.random() - 0.5) * 1.2
      pts[i * 3 + 2] = Math.sin(a) * r
    }
    return pts
  }, [])

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => { setHov(true);  document.body.style.cursor = 'pointer' }}
      onPointerOut={() =>  { setHov(false); document.body.style.cursor = 'auto' }}
    >
      {/* Core star */}
      <Sphere ref={coreRef} args={[1.2, 24, 24]}>
        <meshStandardMaterial
          color={project.color} emissive={project.color}
          emissiveIntensity={(hov || sectionActive) ? 2.0 : 0.9}
        />
      </Sphere>
      {/* Soft halo */}
      <Sphere args={[2.2, 16, 16]}>
        <meshBasicMaterial color={project.color} transparent opacity={(hov || sectionActive) ? 0.18 : 0.06} side={THREE.BackSide} />
      </Sphere>
      {/* Orbital debris */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial map={circleSprite()} color={project.color} size={0.16} transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <pointLight color={project.color} intensity={(hov || sectionActive) ? 8 : 3} distance={30} />

      {/* Always-visible name tag — native 3D Billboard so no Html box */}
      <Billboard position={[0, 2.6, 0]}>
        <Text
          fontSize={0.22}
          color={project.color}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
          font={FONT}
          fillOpacity={0.9}
        >
          {project.name.toUpperCase()}
        </Text>
      </Billboard>
      {/* Full project dossiers now live in the readable DOM Projects panel */}
    </group>
  )
}

export default function ProjectGalaxy({ center = [85, -35, -90], sectionActive }) {
  return (
    <group>
      {PROJECTS.map((project) => (
        <StarSystem key={project.id} project={project} center={center} sectionActive={sectionActive} />
      ))}
    </group>
  )
}
