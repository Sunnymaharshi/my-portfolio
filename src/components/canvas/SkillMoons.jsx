import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'

const SKILLS = [
  { name: 'React',      level: 95, color: '#61dafb', radius: 2.6, speed: 0.42, phase: 0    },
  { name: 'TypeScript', level: 90, color: '#3178c6', radius: 3.4, speed: 0.30, phase: 1.2  },
  { name: 'Next.js',    level: 88, color: '#e8f0ff', radius: 4.0, speed: 0.22, phase: 2.4  },
  { name: 'FastAPI',    level: 85, color: '#009688', radius: 2.9, speed: 0.37, phase: 3.8  },
  { name: 'PostgreSQL', level: 83, color: '#336791', radius: 4.6, speed: 0.17, phase: 0.8  },
  { name: 'Redis',      level: 80, color: '#dc382d', radius: 3.7, speed: 0.27, phase: 5.0  },
  { name: 'LangGraph',  level: 82, color: '#e8a020', radius: 5.2, speed: 0.14, phase: 1.8  },
  { name: 'Docker',     level: 85, color: '#2496ed', radius: 5.8, speed: 0.12, phase: 2.6  },
  { name: 'GCP',        level: 88, color: '#4285f4', radius: 3.2, speed: 0.33, phase: 4.5  },
  { name: 'pgvector',   level: 78, color: '#8b5cf6', radius: 4.3, speed: 0.19, phase: 3.2  },
]

// Arc ring showing skill level
function LevelArc({ level, color, visible }) {
  const ref    = useRef()
  const thetaL = (level / 100) * Math.PI * 2
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime
      ref.current.material.opacity = visible
        ? 0.4 + Math.sin(t * 1.2) * 0.15
        : 0
    }
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.22, 0.27, 48, 1, 0, thetaL]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Moon({ skill, showLabels, isOverview, onSkillsClick }) {
  const groupRef = useRef()
  const angle    = useRef(skill.phase)
  const [hov, setHov] = useState(false)

  useFrame((_, delta) => {
    angle.current += skill.speed * delta
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle.current) * skill.radius
      groupRef.current.position.z = Math.sin(angle.current) * skill.radius
      groupRef.current.position.y = Math.sin(angle.current * 0.5) * 0.4
    }
  })

  const size = 0.07 + (skill.level / 100) * 0.13

  return (
    <group
      ref={groupRef}
      onPointerOver={() => { setHov(true);  if (isOverview) document.body.style.cursor = 'pointer' }}
      onPointerOut={() =>  { setHov(false); document.body.style.cursor = 'auto' }}
      onClick={isOverview ? onSkillsClick : undefined}
    >
      <Sphere args={[size, 16, 16]}>
        <meshStandardMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={hov ? 1.1 : 0.7}
          roughness={0.3}
          metalness={0.5}
        />
      </Sphere>
      <pointLight color={skill.color} intensity={0.5} distance={1.8} />

      {/* Level arc — visible in skills mode */}
      <LevelArc level={skill.level} color={skill.color} visible={showLabels} />

      {/* Label — shows in skills view or on hover in overview */}
      {(showLabels || (isOverview && hov)) && (
        <Html distanceFactor={5} center style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            whiteSpace: 'nowrap',
            textAlign: 'center',
            animation: 'holodrift 5s ease-in-out infinite',
          }}>
            <div style={{
              fontSize: showLabels ? 11 : 9,
              color: skill.color,
              textShadow: `0 0 10px ${skill.color}`,
              letterSpacing: '0.1em',
            }}>
              {skill.name}
            </div>
            {showLabels && (
              <div style={{
                fontSize: 9,
                color: skill.color,
                opacity: 0.7,
                marginTop: 3,
                letterSpacing: '0.08em',
              }}>
                {skill.level}%
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return pts
  }, [radius])
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#4a90d9" transparent opacity={0.06} />
    </line>
  )
}

// Overview click target for the whole skills zone
function SkillsClickTarget({ onClick }) {
  return (
    <mesh
      position={[2.5, -0.5, -1]}
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() =>  { document.body.style.cursor = 'auto' }}
    >
      <sphereGeometry args={[6, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

export default function SkillMoons({ target, onSkillsClick }) {
  const isOverview  = target === null
  const showLabels  = target === 'skills'

  return (
    <group>
      {SKILLS.map((skill) => (
        <OrbitRing key={`ring-${skill.name}`} radius={skill.radius} />
      ))}
      {SKILLS.map((skill) => (
        <Moon
          key={skill.name}
          skill={skill}
          showLabels={showLabels}
          isOverview={isOverview}
          onSkillsClick={onSkillsClick}
        />
      ))}
    </group>
  )
}
