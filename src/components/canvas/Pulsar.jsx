import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'

const ptVert = (coeff, maxPx) => /* glsl */`
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(${coeff} / -mv.z, 1.0, ${maxPx});
    gl_Position = projectionMatrix * mv;
  }
`
const ptFrag = (r, g, b, opacity) => /* glsl */`
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.38, d);
    gl_FragColor = vec4(${r}, ${g}, ${b}, a * ${opacity});
  }
`

const cnt = n => Math.round(IS_MOBILE ? n * 0.5 : n)

const RING_COUNT = 5
const SPIN_SPEED = 1.5   // rad/s — fast neutron-star rotation
const RING_SPEED = 0.13  // phase/s — full expand ~7.5 s

export default function Pulsar({ position }) {
  const beamRef  = useRef()
  const ringRefs = useRef([])
  const windMat  = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ptVert('190.0', '13.0'), fragmentShader: ptFrag('0.23', '0.53', '0.85', '0.45'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }), [])
  const shellMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ptVert('140.0', '10.0'), fragmentShader: ptFrag('0.48', '0.69', '0.88', '0.25'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }), [])
  const phases   = useRef(
    Array.from({ length: RING_COUNT }, (_, i) => i / RING_COUNT)
  )

  // Dense equatorial wind nebula — disk of swept-up particles
  const windGeo = useMemo(() => {
    const n = cnt(420)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r     = 3 + Math.pow(Math.random(), 0.6) * 9
      const theta = Math.random() * Math.PI * 2
      pos[i * 3]     = Math.cos(theta) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5
      pos[i * 3 + 2] = Math.sin(theta) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  // Supernova remnant shell — diffuse outer cloud the pulsar was born in
  const shellGeo = useMemo(() => {
    const n = cnt(300)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const phi   = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r     = 13 + (Math.random() - 0.5) * 5
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((_, dt) => {
    if (beamRef.current) beamRef.current.rotation.y += dt * SPIN_SPEED

    phases.current = phases.current.map((p, i) => {
      const next = (p + dt * RING_SPEED) % 1
      const ring = ringRefs.current[i]
      if (ring) {
        ring.scale.setScalar(1 + next * 14)
        ring.material.opacity = Math.max(0, (1 - next) * 0.42)
      }
      return next
    })
  })

  return (
    <group position={position}>
      {/* ── Neutron star core — pinpoint, let bloom make the corona ── */}
      <mesh>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#e8f4ff" />
      </mesh>
      {/* tight inner halo — just enough to seed bloom */}
      <mesh>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial
          color="#90c8ff" transparent opacity={0.10}
          blending={THREE.AdditiveBlending} depthWrite={false}
        />
      </mesh>

      {/* ── Rotating dipole beams — tilted axis ── */}
      <group ref={beamRef} rotation={[0.28, 0, 0.12]}>
        {/* North beam: tip (narrow) at star, base (wide) flaring outward */}
        <mesh position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[1.6, 7, 20, 1, true]} />
          <meshBasicMaterial color="#5aacf0" transparent opacity={0.09}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, 7, 12, 1, true]} />
          <meshBasicMaterial color="#d0eaff" transparent opacity={0.32}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* South beam */}
        <mesh position={[0, -3.5, 0]}>
          <coneGeometry args={[1.6, 7, 20, 1, true]} />
          <meshBasicMaterial color="#5aacf0" transparent opacity={0.09}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, -3.5, 0]}>
          <coneGeometry args={[0.28, 7, 12, 1, true]} />
          <meshBasicMaterial color="#d0eaff" transparent opacity={0.32}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* ── Electromagnetic pulse rings — expand & fade ── */}
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => { ringRefs.current[i] = el }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1, 0.035, 6, 80]} />
          <meshBasicMaterial
            color="#4a90d9" transparent
            opacity={(1 - i / RING_COUNT) * 0.42}
            blending={THREE.AdditiveBlending} depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Pulsar wind nebula — equatorial particle disk ── */}
      <points geometry={windGeo} material={windMat} />

      {/* ── Supernova remnant shell — the system it was born in ── */}
      <points geometry={shellGeo} material={shellMat} />
    </group>
  )
}
