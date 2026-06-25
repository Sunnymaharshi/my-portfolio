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
    gl_PointSize = max(1.0, aSize * (300.0 / -mv.z));
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

      {/* ── Positive-Z galaxies — far behind starting camera, ~1400–1800u ── */}
      <SpiralGalaxy
        position={[350, 120, 1400]}
        rotation={[0.55, -0.38, 0.3]}
        scale={1.1}
        spinSpeed={0.016}
        params={{
          count: cnt(5000), radius: 24, arms: 3, spin: 0.52, randomness: 0.19,
          coreColor: '#ffeedd', armColor: '#6b9de8',
        }}
      />
      <SpiralGalaxy
        position={[-380, -165, 1600]}
        rotation={[1.15, 0.5, -0.48]}
        scale={0.9}
        spinSpeed={-0.019}
        params={{
          count: cnt(3800), radius: 20, arms: 2, spin: 0.68, randomness: 0.22,
          coreColor: '#ffe8f0', armColor: '#7272e8',
        }}
      />
      <SpiralGalaxy
        position={[120, -300, 1800]}
        rotation={[0.82, 0.22, 0.42]}
        scale={1.0}
        spinSpeed={0.011}
        params={{
          count: cnt(4400), radius: 23, arms: 4, spin: 0.6, randomness: 0.21,
          coreColor: '#ddeeff', armColor: '#5a8fe0',
        }}
      />
      <SpiralGalaxy
        position={[-280, 240, 1400]}
        rotation={[0.35, 0.7, -0.25]}
        scale={0.7}
        spinSpeed={0.022}
        params={{
          count: cnt(2800), radius: 18, arms: 3, spin: 0.45, randomness: 0.25,
          coreColor: '#cce8ff', armColor: '#6080d8',
        }}
      />

      {/* ── Upper-hemisphere galaxies — ~1400–1600u above ── */}
      <SpiralGalaxy
        position={[55, 1400, -100]}
        rotation={[0.12, 0.5, 0.08]}
        scale={1.2}
        spinSpeed={0.013}
        params={{
          count: cnt(5200), radius: 25, arms: 3, spin: 0.5, randomness: 0.19,
          coreColor: '#ffe8cc', armColor: '#5a90e0',
        }}
      />
      <SpiralGalaxy
        position={[-150, 1500, 280]}
        rotation={[1.5, 0.3, 0.4]}
        scale={0.9}
        spinSpeed={-0.017}
        params={{
          count: cnt(3600), radius: 21, arms: 2, spin: 0.7, randomness: 0.23,
          coreColor: '#e8d8ff', armColor: '#7060d8',
        }}
      />
      <SpiralGalaxy
        position={[230, 1600, -420]}
        rotation={[0.9, -0.4, 0.5]}
        scale={1.1}
        spinSpeed={0.015}
        params={{
          count: cnt(4400), radius: 23, arms: 4, spin: 0.62, randomness: 0.21,
          coreColor: '#ddeeff', armColor: '#6888d8',
        }}
      />

      {/* ── Lower-hemisphere galaxies — ~1400–1600u below ── */}
      <SpiralGalaxy
        position={[70, -1500, -120]}
        rotation={[0.18, -0.4, 0.1]}
        scale={1.1}
        spinSpeed={-0.014}
        params={{
          count: cnt(4800), radius: 24, arms: 3, spin: 0.55, randomness: 0.20,
          coreColor: '#ffeedd', armColor: '#6094e0',
        }}
      />
      <SpiralGalaxy
        position={[-140, -1400, 250]}
        rotation={[1.3, 0.6, -0.35]}
        scale={0.85}
        spinSpeed={0.02}
        params={{
          count: cnt(3400), radius: 20, arms: 2, spin: 0.72, randomness: 0.24,
          coreColor: '#d8e8ff', armColor: '#5878d8',
        }}
      />
      <SpiralGalaxy
        position={[220, -1600, -380]}
        rotation={[1.1, 0.5, 0.45]}
        scale={1.0}
        spinSpeed={-0.016}
        params={{
          count: cnt(4000), radius: 22, arms: 4, spin: 0.6, randomness: 0.22,
          coreColor: '#ccd8ff', armColor: '#5868e0',
        }}
      />
    </>
  )
}
