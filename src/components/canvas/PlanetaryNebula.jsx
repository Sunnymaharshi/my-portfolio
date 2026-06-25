// Planetary nebula — Helix / Ring Nebula inspired.
// Dead star surrounded by concentric toroidal shells of expelled gas.
// Inner ionized zone: blue-white. Main ring: teal (OIII). Outer halo: violet.
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
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a);
  }
`

function buildShell({ count }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const siz = new Float32Array(count)

  const ionized = new THREE.Color('#cce8ff')  // hot inner zone
  const oiii    = new THREE.Color('#5ec8e6')  // OIII cyan main ring
  const outer   = new THREE.Color('#9b8cf5')  // violet outer halo
  const c = new THREE.Color()

  // Concentric shells: inner bubble + two toroidal rings + diffuse halo
  const layers = [
    { kind: 'sphere', R: 0,   r: 2.8, frac: 0.14, c0: ionized, c1: ionized },
    { kind: 'torus',  R: 4.2, r: 0.9, frac: 0.38, c0: oiii,    c1: oiii    },
    { kind: 'torus',  R: 6.0, r: 0.7, frac: 0.26, c0: oiii,    c1: outer   },
    { kind: 'sphere', R: 0,   r: 8.0, frac: 0.22, c0: outer,   c1: outer   },
  ]

  let i = 0
  layers.forEach(({ kind, R, r, frac, c0, c1 }) => {
    const n = Math.min(Math.floor(count * frac), count - i)
    for (let k = 0; k < n; k++, i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.random() * Math.PI * 2
      const rr    = r * (0.55 + 0.45 * Math.random())

      if (kind === 'sphere') {
        // Uniform sphere — used for inner bubble and outer halo
        const u  = Math.random() * 2 - 1
        const th = Math.random() * Math.PI * 2
        const sr = rr * Math.pow(Math.random(), R === 0 ? 0.4 : 0.6)
        pos[i * 3]     = sr * Math.sqrt(1 - u * u) * Math.cos(th)
        pos[i * 3 + 1] = sr * u * 0.65
        pos[i * 3 + 2] = sr * Math.sqrt(1 - u * u) * Math.sin(th)
      } else {
        // True torus: thick ring with slight vertical compression
        pos[i * 3]     = (R + rr * Math.cos(phi)) * Math.cos(theta)
        pos[i * 3 + 1] = rr * Math.sin(phi) * 0.42
        pos[i * 3 + 2] = (R + rr * Math.cos(phi)) * Math.sin(theta)
      }

      c.copy(c0).lerp(c1, Math.random())
      const b = 0.4 + 0.6 * Math.random()
      col[i * 3]     = c.r * b
      col[i * 3 + 1] = c.g * b
      col[i * 3 + 2] = c.b * b
      siz[i] = 0.8 + Math.random() * 1.0
    }
  })

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
  g.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1))
  return g
}

export default function PlanetaryNebula({ position = [0, 0, 0], scale = 1 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildShell({ count: IS_MOBILE ? 2000 : 5000 }),
    [],
  )
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }), [])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.013
  })

  return (
    // Tilt to show the ring structure — not perfectly face-on
    <group position={position} rotation={[0.55, 0.35, 0.08]} scale={scale}>
      <points ref={ref} geometry={geo} material={mat} />
      {/* Central white dwarf */}
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1.0}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      {/* Hot inner glow */}
      <mesh>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color="#b8e4ff" transparent opacity={0.14}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
