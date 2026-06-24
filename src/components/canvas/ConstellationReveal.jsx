// Native 3D information panels — no Html overlay.
// On activation: star nodes burst from scattered positions and fly to their
// layout positions; text materialises at each node after the star arrives.
// On deactivation: opacity resets instantly; nodes fly again next activation.

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const FONT    = '/fonts/SpaceMono-Regular.ttf'
const easeOut = t => 1 - Math.pow(1 - Math.min(t, 1), 3)

// ─── star node that flies from scatter → target position ──────────────────────
function AnimatedStar({ target, color, delay, active }) {
  const ref = useRef()
  const el  = useRef(0)
  const on  = useRef(false)

  const targetV = useMemo(() => new THREE.Vector3(...target), [])
  const scatter = useMemo(() => {
    const r = 3 + Math.random() * 5
    const θ = Math.random() * Math.PI * 2
    const φ = (Math.random() - 0.5) * Math.PI * 0.8
    return new THREE.Vector3(
      target[0] + r * Math.cos(θ) * Math.cos(φ),
      target[1] + r * Math.sin(φ) * 0.7,
      target[2] + r * Math.sin(θ) * 0.3,
    )
  }, [])
  const col = useMemo(() => new THREE.Color(color), [color])

  useEffect(() => {
    on.current = active
    if (!active) {
      el.current = 0
      if (ref.current) {
        ref.current.position.copy(scatter)
        ref.current.material.opacity = 0
      }
    }
  }, [active])

  useFrame((_, dt) => {
    if (!ref.current) return
    if (!on.current) { ref.current.visible = false; return }
    ref.current.visible = true
    el.current = Math.min(el.current + dt, delay + 1.8)
    const p = easeOut(Math.max(0, el.current - delay) / 1.5)
    ref.current.position.lerpVectors(scatter, targetV, p)
    ref.current.material.opacity = Math.min(p * 3, 1)
    ref.current.material.emissiveIntensity = 5 + 9 * p
  })

  return (
    <mesh ref={ref} position={scatter.toArray()} visible={false}>
      <sphereGeometry args={[0.04, 5, 5]} />
      <meshStandardMaterial
        color="#ffffff" emissive={col} emissiveIntensity={5}
        transparent opacity={0} fog={false}
      />
    </mesh>
  )
}

// ─── text label that fades in after its star arrives ─────────────────────────
function AnimatedText({ pos, label, textColor, fontSize, delay, active, maxWidth }) {
  const ref = useRef()
  const el  = useRef(0)
  const on  = useRef(false)

  useEffect(() => {
    on.current = active
    if (!active) { el.current = 0; if (ref.current) ref.current.fillOpacity = 0 }
  }, [active])

  useFrame((_, dt) => {
    if (!ref.current || !on.current) return
    el.current = Math.min(el.current + dt, delay + 1.0)
    ref.current.fillOpacity = easeOut(Math.max(0, el.current - delay) / 0.6)
  })

  return (
    <Text
      ref={ref}
      position={pos}
      fontSize={fontSize}
      color={textColor}
      anchorX="left"
      anchorY="middle"
      maxWidth={maxWidth ?? 6}
      letterSpacing={0.03}
      fillOpacity={0}
      outlineWidth={fontSize * 0.10}
      outlineColor="#020812"
      outlineOpacity={0.9}
      outlineBlur={fontSize * 0.18}
      font={FONT}
    >
      {label}
    </Text>
  )
}

// ─── soft radial dark backing — improves text legibility, no hard box ────────
const backingFrag = `
varying vec2 vUv;
uniform float uOpacity;
void main(){
  vec2 c = (vUv - 0.5) * 2.0;
  // Elliptical falloff, soft edges → reads as a haze, never a panel
  float d = length(c * vec2(0.9, 1.0));
  float a = (1.0 - smoothstep(0.2, 1.0, d)) * uOpacity;
  gl_FragColor = vec4(0.012, 0.047, 0.10, a);
}
`
const backingVert = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

function BackingGlow({ center, width, height, active }) {
  const mat = useRef()
  const el  = useRef(0)
  const on  = useRef(false)
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: backingVert, fragmentShader: backingFrag,
    uniforms: { uOpacity: { value: 0 } },
    transparent: true, depthWrite: false,
  }), [])

  useEffect(() => {
    on.current = active
    if (!active) { el.current = 0; material.uniforms.uOpacity.value = 0 }
  }, [active])

  useFrame((_, dt) => {
    if (!on.current) return
    el.current = Math.min(el.current + dt, 1.4)
    material.uniforms.uOpacity.value = easeOut(el.current / 1.2) * 0.62
  })

  return (
    <mesh position={center} material={material} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}

// ─── faint vertical spine connecting all node stars ──────────────────────────
function SpineLine({ p1, p2, color, delay, active }) {
  const mat = useRef()
  const el  = useRef(0)
  const on  = useRef(false)

  useEffect(() => {
    on.current = active
    if (!active) { el.current = 0; if (mat.current) mat.current.opacity = 0 }
  }, [active])

  useFrame((_, dt) => {
    if (!mat.current) return
    if (!on.current) { mat.current.opacity = 0; return }
    el.current = Math.min(el.current + dt, delay + 0.9)
    mat.current.opacity = 0.2 * easeOut(Math.max(0, el.current - delay) / 0.8)
  })

  const pts = useMemo(() => new Float32Array([...p1, ...p2]), [])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={mat} color={color} transparent opacity={0} fog={false} />
    </line>
  )
}

// ─── ConstellationPanel ───────────────────────────────────────────────────────
// entries: [{ label, fontSize, textColor, delay?, gap?, maxWidth? }]
// Lays entries top-to-bottom from `position`; star node sits 0.28u to the left.
// Spine line drawn after all nodes settle.
export function ConstellationPanel({ entries, position = [0, 0, 0], color = '#4a90d9', active }) {
  const rows = useMemo(() => {
    let y = 0
    return entries.map(e => {
      const starPos = [position[0] - 0.28, position[1] + y, position[2]]
      const textPos = [position[0],         position[1] + y, position[2]]
      const row = { ...e, starPos, textPos }
      y -= (e.fontSize ?? 0.14) * 1.8 + (e.gap ?? 0.14)
      return row
    })
  }, []) // static content — compute once

  const maxDelay = useMemo(() => Math.max(...rows.map(r => r.delay ?? 0)), [rows])

  // Bounds for the soft backing haze
  const backing = useMemo(() => {
    const ys = rows.map(r => r.textPos[1])
    const top = Math.max(...ys) + 0.3
    const bot = Math.min(...ys) - 0.3
    const widest = Math.max(...rows.map(r => (r.maxWidth ?? 6) > 5
      ? r.label.length * (r.fontSize ?? 0.14) * 0.62
      : (r.maxWidth ?? 6)))
    const width = Math.min(widest, 5.5) + 0.9
    const height = (top - bot)
    const center = [position[0] + width * 0.30, (top + bot) / 2, position[2] - 0.05]
    return { width, height, center }
  }, [])

  return (
    <group>
      <BackingGlow
        center={backing.center}
        width={backing.width}
        height={backing.height}
        active={active}
      />
      {rows.length > 1 && (
        <SpineLine
          p1={rows[0].starPos}
          p2={rows[rows.length - 1].starPos}
          color={color}
          delay={maxDelay + 1.0}
          active={active}
        />
      )}
      {rows.map((row, i) => {
        const nodeDelay = row.delay ?? i * 0.08
        return (
          <group key={i}>
            <AnimatedStar
              target={row.starPos}
              color={color}
              delay={nodeDelay}
              active={active}
            />
            <AnimatedText
              pos={row.textPos}
              label={row.label}
              textColor={row.textColor ?? '#8aaed4'}
              fontSize={row.fontSize ?? 0.14}
              delay={nodeDelay + 0.55}
              active={active}
              maxWidth={row.maxWidth ?? 6}
            />
          </group>
        )
      })}
    </group>
  )
}
