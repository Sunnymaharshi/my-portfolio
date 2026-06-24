import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { IS_MOBILE } from '../../utils/device'

const cnt = (n) => Math.round(IS_MOBILE ? n * 0.45 : n)  // thin particle counts on mobile

// ── Distant spiral galaxies — logarithmic-spiral particle disks. Placed far
//    off the flight path as deep-background scenery (fog disabled). Slowly
//    rotate. Warm core → blue arms, additive blending for a luminous glow. ────

const galaxyVert = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aTwinkle;
  varying vec3  vColor;
  varying float vT;
  uniform float uTime;
  void main(){
    vColor = aColor;
    vT = aTwinkle;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const galaxyFrag = /* glsl */`
  varying vec3  vColor;
  varying float vT;
  uniform float uTime;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float tw = 0.7 + 0.3 * sin(uTime * 0.5 + vT * 30.0);
    gl_FragColor = vec4(vColor, core * core * tw);
  }
`

function buildGalaxy({ count, radius, arms, spin, randomness, coreColor, armColor }) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const sz  = new Float32Array(count)
  const tw  = new Float32Array(count)
  const cCore = new THREE.Color(coreColor)
  const cArm  = new THREE.Color(armColor)

  for (let i = 0; i < count; i++) {
    // Radius with central concentration
    const r = Math.pow(Math.random(), 1.8) * radius
    const branch = (i % arms) / arms * Math.PI * 2
    const spinA = r * spin

    // Randomness grows with radius (fluffier arms outward)
    const rand = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * r
    const rx = rand(), ry = rand() * 0.35, rz = rand()

    const a = branch + spinA
    pos[i * 3]     = Math.cos(a) * r + rx
    pos[i * 3 + 1] = ry
    pos[i * 3 + 2] = Math.sin(a) * r + rz

    // Colour: core warm → arms blue
    const mixT = Math.min(r / radius, 1.0)
    const c = cCore.clone().lerp(cArm, mixT)
    // Sprinkle a few pink/young-star highlights in the arms
    if (Math.random() < 0.04 && mixT > 0.4) c.setRGB(1.0, 0.6, 0.8)
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b

    sz[i] = (mixT < 0.15 ? 0.9 : 0.4) + Math.random() * 0.5
    tw[i] = Math.random()
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sz, 1))
  geo.setAttribute('aTwinkle', new THREE.BufferAttribute(tw, 1))
  return geo
}

function SpiralGalaxy({ position, rotation, scale, spinSpeed, params }) {
  const ref = useRef()
  const geo = useMemo(() => buildGalaxy(params), [])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * spinSpeed
  })

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <points ref={ref} geometry={geo}>
        <shaderMaterial
          vertexShader={galaxyVert}
          fragmentShader={galaxyFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Bright glowing core */}
      <mesh>
        <sphereGeometry args={[scale ? 1.4 : 1.4, 24, 24]} />
        <meshBasicMaterial color={params.coreColor} transparent opacity={0.18} fog={false} />
      </mesh>
    </group>
  )
}

export default function Galaxy() {
  return (
    <>
      {/* Large face-on spiral, far above-left of the flight path */}
      <SpiralGalaxy
        position={[-220, 120, -120]}
        rotation={[0.5, 0.2, 0.3]}
        scale={1}
        spinSpeed={0.012}
        params={{
          count: cnt(6000), radius: 26, arms: 3, spin: 0.55, randomness: 0.18,
          coreColor: '#ffe6b0', armColor: '#5a8fe0',
        }}
      />
      {/* Smaller edge-tilted spiral, far below-right */}
      <SpiralGalaxy
        position={[260, -150, -260]}
        rotation={[1.2, 0.6, -0.4]}
        scale={0.7}
        spinSpeed={-0.018}
        params={{
          count: cnt(4200), radius: 22, arms: 2, spin: 0.7, randomness: 0.22,
          coreColor: '#ffd0d8', armColor: '#7b6fe0',
        }}
      />
      {/* Distant 4-arm spiral, far ahead and above-right */}
      <SpiralGalaxy
        position={[200, 100, -360]}
        rotation={[0.9, -0.3, 0.5]}
        scale={0.85}
        spinSpeed={0.014}
        params={{
          count: cnt(5200), radius: 24, arms: 4, spin: 0.6, randomness: 0.2,
          coreColor: '#cfe0ff', armColor: '#6f7fe0',
        }}
      />
      {/* Tilted 2-arm spiral, far behind-left */}
      <SpiralGalaxy
        position={[-280, -110, -200]}
        rotation={[1.4, 0.4, -0.6]}
        scale={0.6}
        spinSpeed={-0.02}
        params={{
          count: cnt(3600), radius: 20, arms: 2, spin: 0.75, randomness: 0.24,
          coreColor: '#e6ecff', armColor: '#5aa0d9',
        }}
      />
    </>
  )
}
