// Procedural bipolar ("butterfly") nebula — two wide, hollow, frilly flaring
// wings from a bright nucleus (NGC-6302-style), plus a dusty equatorial waist.
// Crisp shader points (clamped size) so it stays sharp up close, like the
// galaxies — not soft sprites that balloon/blur when you fly near it.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'

const vert = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  varying vec3 vColor;
  void main(){
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (340.0 / -mv.z), 1.0, 5.0);   // clamp → no blur up close
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */`
  varying vec3 vColor;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);     // crisp round dot
    gl_FragColor = vec4(vColor, core * core);
  }
`

function buildButterfly({ count, length, flare }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const siz = new Float32Array(count)
  const core = new THREE.Color('#dbeeff')   // hot blue-white near the waist
  const mid  = new THREE.Color('#7fa6f2')   // blue
  const edge = new THREE.Color('#b074e6')   // violet wing rims
  const c = new THREE.Color()

  const ringCount = Math.floor(count * 0.10)   // dusty equatorial waist

  for (let i = 0; i < count; i++) {
    siz[i] = 0.9 + Math.random() * 1.1

    if (i < ringCount) {
      const a = Math.random() * Math.PI * 2
      const rr = 0.4 + Math.pow(Math.random(), 0.5) * 1.4
      pos[i * 3]     = Math.cos(a) * rr
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 2] = Math.sin(a) * rr * 0.85
      c.copy(mid).multiplyScalar(0.45)
      const b = 0.4 + 0.3 * Math.random()
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b
      continue
    }

    const side = i % 2 ? 1 : -1
    const t = Math.pow(Math.random(), 0.5)             // 0 waist → 1 outer rim
    const R = flare * t                                // trumpet flare

    const a = Math.random() * Math.PI * 2
    const frill = 0.86 + 0.14 * Math.sin(a * 6.0 + side * 1.3) + 0.08 * (Math.random() - 0.5)
    const shell = R * frill

    const x = Math.cos(a) * shell * 1.8 + Math.sign(Math.cos(a)) * 0.22 * R
    const z = Math.sin(a) * shell * 0.45
    const along = side * (0.35 + t * length)

    const j = 0.22
    pos[i * 3]     = x + (Math.random() - 0.5) * j
    pos[i * 3 + 1] = along + (Math.random() - 0.5) * j
    pos[i * 3 + 2] = z + (Math.random() - 0.5) * j

    c.copy(core).lerp(mid, Math.min(t * 1.5, 1))
    if (t > 0.5) c.lerp(edge, (t - 0.5) / 0.5)
    const clump = 0.5 + 0.5 * Math.abs(Math.sin(a * 4.0 + t * 6.0))
    const b = (0.45 + 0.55 * t) * (0.5 + 0.5 * clump)
    col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(siz, 1))
  return g
}

export default function ButterflyNebula({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const ref = useRef()
  const geo = useMemo(
    () => buildButterfly({ count: IS_MOBILE ? 3200 : 7000, length: 6.5, flare: 6.5 }),
    [],
  )
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }), [])

  // Gentle breathing rather than spinning — keeps the wings face-on.
  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.35) * 0.025
      ref.current.scale.setScalar(s)
    }
  })

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <points ref={ref} geometry={geo} material={mat} />
      {/* glowing nucleus */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#eaf4ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}
