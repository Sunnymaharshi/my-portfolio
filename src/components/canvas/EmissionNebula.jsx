// Emission nebula — Orion / Lagoon Nebula inspired.
// Large irregular HII region: overlapping Gaussian blobs with embedded young stars.
// Core: teal/cyan (ionized gas). Mid: blue. Outer wisps: violet.
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
    gl_PointSize = clamp(aSize * (340.0 / -mv.z), 1.0, 6.0);
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
    gl_FragColor = vec4(vColor, a * a * 0.88);
  }
`

// HII region blobs — asymmetric like real nebulae
const BLOBS = [
  { o: [0, 0, 0],       s: 1.00 },   // main ionized core
  { o: [8, 3, -2],      s: 0.72 },   // bright lobe right
  { o: [-7, -4, 3],     s: 0.60 },   // bright lobe left
  { o: [3, 8, 5],       s: 0.52 },   // upper wisp
  { o: [-4, -7, -4],    s: 0.48 },   // lower wisp
  { o: [12, -3, -6],    s: 0.38 },   // far outer tendril
  { o: [-10, 5, -8],    s: 0.34 },   // far outer tendril
]

function buildEmission({ count, radius }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const siz = new Float32Array(count)

  const core  = new THREE.Color('#45c7c0')   // ionized teal (OIII)
  const mid   = new THREE.Color('#4a90d9')   // blue (Hβ)
  const wisps = new THREE.Color('#7b6fe0')   // violet diffuse edges
  const c = new THREE.Color()

  const totalWeight = BLOBS.reduce((sum, b) => sum + b.s, 0)

  for (let i = 0; i < count; i++) {
    // Pick a blob weighted by its size
    const r = Math.random() * totalWeight
    let acc = 0, blob = BLOBS[0]
    for (const b of BLOBS) { acc += b.s; if (r <= acc) { blob = b; break } }

    const blobR = radius * blob.s
    // Box-Muller Gaussian distribution
    const u1  = Math.max(1e-6, Math.random())
    const mag = blobR * Math.sqrt(-2 * Math.log(u1)) * 0.38
    const a1  = Math.random() * Math.PI * 2
    const a2  = Math.random() * Math.PI * 2

    const x = blob.o[0] + mag * Math.sin(a1) * Math.cos(a2)
    const y = blob.o[1] + mag * 0.58 * Math.sin(a1) * Math.sin(a2)  // slightly flattened
    const z = blob.o[2] + mag * Math.cos(a1)

    pos[i * 3]     = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z

    const dist = Math.sqrt(x * x + y * y + z * z) / radius
    if (dist < 0.28)       c.copy(core)
    else if (dist < 0.60)  c.copy(core).lerp(mid, (dist - 0.28) / 0.32)
    else                   c.copy(mid).lerp(wisps, Math.min((dist - 0.60) / 0.40, 1.0))

    const b = Math.max(0.08, 0.3 + 0.7 * Math.pow(Math.max(0, 1.0 - dist * 0.85), 1.2))
    col[i * 3]     = c.r * b
    col[i * 3 + 1] = c.g * b
    col[i * 3 + 2] = c.b * b

    siz[i] = 1.0 + Math.random() * 2.0
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
  g.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1))
  return g
}

// Embedded young hot stars (O/B type) at the brightest regions
const YOUNG_STARS = [
  [0,   0,   0  ],
  [5,   2,  -3  ],
  [-4,  3,   4  ],
  [3,  -4,   2  ],
  [7,   1,  -1  ],
]

export default function EmissionNebula({ position = [0, 0, 0], scale = 1 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildEmission({ count: IS_MOBILE ? 4000 : 9000, radius: 22 }),
    [],
  )
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }), [])

  useFrame((state) => {
    if (!ref.current) return
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.18) * 0.018
    ref.current.scale.setScalar(s)
  })

  return (
    <group position={position} rotation={[0.42, 0.68, 0.22]} scale={scale}>
      <points ref={ref} geometry={geo} material={mat} />
      {YOUNG_STARS.map(([x, y, z], k) => (
        <mesh key={k} position={[x, y, z]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial
            color="#dff0ff"
            transparent
            opacity={Math.max(0.3, 0.85 - k * 0.12)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}
