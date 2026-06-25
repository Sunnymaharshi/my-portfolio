import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'
import { sharpCircleSprite } from '../../utils/sprite'

const cnt = n => Math.round(IS_MOBILE ? n * 0.5 : n)

// Shader-computed crisp circles — analytically sharp at any size,
// no canvas-texture downsampling blur.
const diskVert = /* glsl */`
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(48.0 / -mv.z, 1.0, 5.0);
    gl_Position = projectionMatrix * mv;
  }
`
const diskFrag = /* glsl */`
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.38, d);
    gl_FragColor = vec4(vColor, a * 0.65);
  }
`

// Infant planetesimals: orbital radius, speed, phase offset, body radius, orbital inclination, color
const ORBITERS = [
  { r: 4.5, spd: 0.22, ph: 0.0,           sz: 0.17, inc: 0.20,  col: '#4a6a90' },
  { r: 6.0, spd: 0.14, ph: Math.PI * 0.7, sz: 0.13, inc: -0.16, col: '#7aa4c4' },
  { r: 7.2, spd: 0.09, ph: Math.PI * 1.4, sz: 0.19, inc: 0.28,  col: '#3a5870' },
]

export default function StellarNursery({ position }) {
  const diskRef   = useRef()
  const orbitRefs = useRef([])

  // Accretion disk — flat spinning ring, silver-white inner → accent blue mid → deep steel outer
  const diskGeo = useMemo(() => {
    const n = cnt(900)
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const cInner = new THREE.Color('#d8eaff')
    const cMid   = new THREE.Color('#7bb3f0')
    const cOuter = new THREE.Color('#4a6a90')
    for (let i = 0; i < n; i++) {
      const r     = 0.9 + Math.pow(Math.random(), 0.4) * 3.5
      const theta = Math.random() * Math.PI * 2
      // Disk thickens slightly at outer edge (realistic flared disk)
      const y     = (Math.random() - 0.5) * 0.15 * (1 + r / 4.4)
      pos[i * 3]     = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r
      // Three-stop colour: hot inner → warm mid → cool outer
      const t = (r - 0.9) / 3.5
      const c = t < 0.5
        ? cInner.clone().lerp(cMid,   t * 2)
        : cMid.clone().lerp(cOuter, (t - 0.5) * 2)
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  const diskMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: diskVert, fragmentShader: diskFrag,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }), [])

  // Inner blue nebula cloud — hugs the disk
  const innerCloudGeo = useMemo(() => {
    const n = cnt(300)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const phi   = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r     = 1.8 + Math.pow(Math.random(), 0.8) * 2.8
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.65
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  // Outer blue nebula cloud — fades past the planetesimal orbits
  const outerCloudGeo = useMemo(() => {
    const n = cnt(160)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const phi   = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r     = 3.5 + Math.pow(Math.random(), 0.8) * 3.5
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.65
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((state, dt) => {
    if (diskRef.current) diskRef.current.rotation.y += dt * 0.22

    const t = state.clock.elapsedTime
    ORBITERS.forEach((o, i) => {
      const grp = orbitRefs.current[i]
      if (!grp) return
      const a = t * o.spd + o.ph
      grp.position.set(
        Math.cos(a) * o.r,
        Math.sin(a) * o.r * Math.sin(o.inc),
        Math.sin(a) * o.r,
      )
    })
  })

  return (
    <group position={position}>
      {/* ── Protostar core — bloom creates the warm corona, no orange halos ── */}
      <mesh>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial color="#fff6d0" />
      </mesh>

      {/* ── Spinning accretion disk ── */}
      <points ref={diskRef} geometry={diskGeo} material={diskMat} />

      {/* ── Infant planetesimals ── */}
      {ORBITERS.map((o, i) => (
        <group key={i} ref={el => { orbitRefs.current[i] = el }}>
          <mesh>
            <sphereGeometry args={[o.sz, 10, 10]} />
            <meshBasicMaterial color={o.col} fog={false} />
          </mesh>
        </group>
      ))}

      {/* ── Blue nebula dust — near center only ── */}
      <points geometry={innerCloudGeo}>
        <pointsMaterial
          color="#5b8cc4" size={0.20} map={sharpCircleSprite()}
          transparent opacity={0.10} alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthWrite={false} sizeAttenuation
        />
      </points>
      <points geometry={outerCloudGeo}>
        <pointsMaterial
          color="#4a78b0" size={0.13} map={sharpCircleSprite()}
          transparent opacity={0.06} alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthWrite={false} sizeAttenuation
        />
      </points>
    </group>
  )
}
