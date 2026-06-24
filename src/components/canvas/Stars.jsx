import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader-based stars: per-star size, color, realistic scintillation + spikes
const vertexShader = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aPhase;
  attribute float aSpeed;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vBright;

  uniform float uTime;

  void main() {
    vColor = aColor;

    // Atmospheric scintillation: three overlapping frequencies make the
    // flicker irregular (not a smooth sine), then a power curve sharpens the
    // dips so stars briefly "wink" like real twinkling.
    float s = uTime * aSpeed + aPhase;
    float f = sin(s) * 0.5 + sin(s * 2.3 + 1.7) * 0.3 + sin(s * 5.1 + 4.2) * 0.2;
    float twinkle = 0.55 + 0.45 * pow(f * 0.5 + 0.5, 1.6);
    vAlpha = twinkle;

    // How "bright"/large this star is — drives diffraction spikes in frag
    vBright = clamp((aSize - 0.16) / 0.6, 0.0, 1.0);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (340.0 / -mv.z) * (0.85 + twinkle * 0.4), 0.4, 14.0);
    gl_Position  = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  varying float vBright;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Bright core fading to a soft halo
    float core = smoothstep(0.5, 0.0,  dist);
    float halo = smoothstep(0.5, 0.12, dist) * 0.35;

    // 4-point diffraction spikes for bright stars (lens-cross sparkle)
    float ax = 1.0 - smoothstep(0.0, 0.5, abs(uv.x));
    float ay = 1.0 - smoothstep(0.0, 0.5, abs(uv.y));
    float spike = (pow(ax, 6.0) * (1.0 - smoothstep(0.0, 0.5, abs(uv.y) * 6.0))
                 + pow(ay, 6.0) * (1.0 - smoothstep(0.0, 0.5, abs(uv.x) * 6.0)));
    spike *= vBright * 0.4;

    float alpha = (core + halo + spike) * vAlpha;

    // Hot core washes slightly toward white at peak brightness
    vec3 col = mix(vColor, vec3(1.0), core * 0.4);
    gl_FragColor = vec4(col, alpha);
  }
`

export default function Stars() {
  const bgRef     = useRef()
  const brightRef = useRef()
  const uTime     = useRef({ value: 0 })

  // ── Background star field: 5200 tiny stars ──────────────────────────────
  const bgGeo = useMemo(() => {
    const N   = 5200
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const sz  = new Float32Array(N)
    const ph  = new Float32Array(N)
    const sp  = new Float32Array(N)

    for (let i = 0; i < N; i++) {
      // Milky Way density band: 38% of stars clustered near equatorial plane
      const inBand = Math.random() < 0.38
      const theta  = Math.random() * Math.PI * 2
      const phi    = inBand
        ? Math.PI / 2 + (Math.random() - 0.5) * 0.85
        : Math.acos(2 * Math.random() - 1)
      const r = 45 + Math.random() * 55

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Star color distribution: mostly blue-white, some yellow, rare orange
      const roll = Math.random()
      if (roll < 0.55) {
        // Blue-white O/B/A class
        col[i * 3] = 0.82 + Math.random() * 0.18
        col[i * 3 + 1] = 0.88 + Math.random() * 0.12
        col[i * 3 + 2] = 1.0
      } else if (roll < 0.80) {
        // Pure white F class
        col[i * 3] = 1.0; col[i * 3 + 1] = 1.0; col[i * 3 + 2] = 1.0
      } else if (roll < 0.93) {
        // Yellow-white G class (like our sun)
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.97; col[i * 3 + 2] = 0.82
      } else {
        // Orange-red K/M class
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 0.55
      }

      sz[i] = Math.random() < 0.12 ? 0.16 + Math.random() * 0.12 : 0.06 + Math.random() * 0.07
      ph[i] = Math.random() * Math.PI * 2
      sp[i] = 0.1 + Math.random() * 0.25  // slow background shimmer
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sz,  1))
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(ph,  1))
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(sp,  1))
    return geo
  }, [])

  // ── Bright twinkling foreground stars: 320 vivid stars ──────────────────
  const brightGeo = useMemo(() => {
    const N   = 320
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const sz  = new Float32Array(N)
    const ph  = new Float32Array(N)
    const sp  = new Float32Array(N)

    const palette = [
      [0.75, 0.85, 1.0],   // vivid blue
      [0.88, 0.93, 1.0],   // blue-white
      [1.0,  1.0,  1.0],   // pure white
      [1.0,  0.98, 0.88],  // warm white
      [1.0,  0.95, 0.70],  // yellow
      [1.0,  0.80, 0.50],  // orange
    ]

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 42 + Math.random() * 30

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]

      sz[i] = 0.28 + Math.random() * 0.55   // larger, clearly visible
      ph[i] = Math.random() * Math.PI * 2
      sp[i] = 0.6 + Math.random() * 2.2     // active twinkling
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sz,  1))
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(ph,  1))
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(sp,  1))
    return geo
  }, [])

  const shaderUniforms = useMemo(() => ({ uTime: uTime.current }), [])

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime
    uTime.current.value = t

    // Sky-sphere: always surround the camera so stars are visible anywhere in the world
    if (bgRef.current)     bgRef.current.position.copy(camera.position)
    if (brightRef.current) brightRef.current.position.copy(camera.position)

    const rotY = t * 0.006
    const rotX = Math.sin(t * 0.003) * 0.012
    if (bgRef.current)     { bgRef.current.rotation.y     = rotY; bgRef.current.rotation.x     = rotX }
    if (brightRef.current) { brightRef.current.rotation.y = rotY; brightRef.current.rotation.x = rotX }
  })

  const matProps = {
    vertexShader,
    fragmentShader,
    uniforms: shaderUniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: false,
    blending: THREE.AdditiveBlending,   // stars add light → soft natural glow
  }

  return (
    <>
      <points ref={bgRef} geometry={bgGeo}>
        <shaderMaterial {...matProps} />
      </points>
      <points ref={brightRef} geometry={brightGeo}>
        <shaderMaterial {...matProps} />
      </points>
    </>
  )
}
