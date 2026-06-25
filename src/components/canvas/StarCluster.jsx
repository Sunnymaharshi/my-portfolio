// Globular star cluster — dense, centrally-concentrated ball of stars.
// Custom shader keeps a 1px minimum point size so it stays visible at any distance.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'

const vert = /* glsl */`
  attribute vec3  aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.0, 0.32 * (280.0 / -mv.z));
    gl_Position  = projectionMatrix * mv;
  }
`
const frag = /* glsl */`
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * 0.9);
  }
`

function buildCluster({ count, radius }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const white = new THREE.Color('#e6f0ff')
  const blue  = new THREE.Color('#8fb6ef')
  const c = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const r  = radius * Math.pow(Math.random(), 2.0)
    const u  = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const s  = Math.sqrt(1 - u * u)
    pos[i * 3]     = r * s * Math.cos(th)
    pos[i * 3 + 1] = r * u
    pos[i * 3 + 2] = r * s * Math.sin(th)

    c.copy(white).lerp(blue, Math.random() * 0.7)
    const b = 0.55 + 0.45 * Math.random()
    col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
  return g
}

export default function StarCluster({ position = [0, 0, 0], radius = 9, spin = 0.01 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildCluster({ count: IS_MOBILE ? 1400 : 3200, radius }),
    [radius],
  )
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }), [])

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * spin })

  return (
    <group position={position}>
      <points ref={ref} geometry={geo} material={mat} />
      {/* soft core glow */}
      <mesh>
        <sphereGeometry args={[radius * 0.32, 16, 16]} />
        <meshBasicMaterial color="#bcd4f5" transparent opacity={0.12}
          blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
