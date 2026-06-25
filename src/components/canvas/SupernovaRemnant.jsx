// Supernova remnant — Crab/Cassiopeia-A inspired.
// Filamentary expanding shock shell + inner pulsar wind nebula + central neutron star.
// Cool palette: blue-white core, teal mid-shell, violet filaments.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'

const vert = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (340.0 / -mv.z), 1.0, 5.0);
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */`
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, core * core);
  }
`

function buildRemnant({ count, radius }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const siz = new Float32Array(count)

  const hot  = new THREE.Color('#dbeeff')   // blue-white (pulsar wind, hot interior)
  const teal = new THREE.Color('#45c7c0')   // teal shocked gas
  const viol = new THREE.Color('#8b7fe8')   // violet outer filaments
  const c    = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const u     = Math.random() * 2 - 1
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(Math.max(-1, Math.min(1, u)))

    const onShell   = Math.random() < 0.72
    const shellFrac = onShell
      ? 0.78 + Math.random() * 0.28   // outer filamentary shell
      : Math.random() * 0.75          // inner wind nebula fill

    // Filamentary density: sinusoidal ridges across the shell surface
    const filament = Math.abs(
      Math.sin(phi * 7.0 + theta * 2.3) * Math.cos(theta * 4.0 + phi * 1.9)
      + 0.35 * Math.sin(phi * 12.0 + theta * 5.1)
    )

    const rScale = onShell ? 1.0 + 0.12 * filament : 1.0
    const r      = radius * shellFrac * rScale

    // Slight prolate ellipsoid (like the Crab along its jet axis)
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.cos(phi) * 1.22
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    const t = r / radius
    if (t < 0.38)       c.copy(hot)
    else if (t < 0.68)  c.copy(hot).lerp(teal, (t - 0.38) / 0.30)
    else                c.copy(teal).lerp(viol, Math.min((t - 0.68) / 0.32, 1.0))

    const bright = (0.25 + 0.75 * filament) * (0.55 + 0.45 * (1.0 - t * 0.55))
    col[i * 3]     = c.r * Math.max(0.08, bright)
    col[i * 3 + 1] = c.g * Math.max(0.08, bright)
    col[i * 3 + 2] = c.b * Math.max(0.08, bright)

    siz[i] = onShell ? 0.9 + Math.random() * 1.1 : 0.7 + Math.random() * 0.7
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
  g.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1))
  return g
}

export default function SupernovaRemnant({ position = [0, 0, 0], scale = 1 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildRemnant({ count: IS_MOBILE ? 3000 : 7000, radius: 18 }),
    [],
  )
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }), [])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.018
  })

  return (
    <group position={position} rotation={[0.28, 0, 0.14]} scale={scale}>
      <points ref={ref} geometry={geo} material={mat} />
      {/* Central neutron star */}
      <mesh>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      {/* Inner wind nebula glow */}
      <mesh>
        <sphereGeometry args={[3.0, 16, 16]} />
        <meshBasicMaterial color="#b0ccff" transparent opacity={0.07}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
