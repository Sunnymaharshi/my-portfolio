import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const FONT = '/fonts/SpaceMono-Regular.ttf'

const SKILLS = [
  { name: 'React',      abbr: '⚛',  color: '#61dafb', a: 3.0, e: 0.08, inc: 0.15, Ω: 0.0,  ω: 0.0,  period: 7   },
  { name: 'TypeScript', abbr: 'TS', color: '#3178c6', a: 3.7, e: 0.20, inc: 0.40, Ω: 1.0,  ω: 0.5,  period: 9.5 },
  { name: 'Python',     abbr: 'Py', color: '#ffd43b', a: 4.2, e: 0.18, inc: -0.30,Ω: 2.2,  ω: 1.0,  period: 11  },
  { name: 'FastAPI',    abbr: '⚡', color: '#009688', a: 2.8, e: 0.14, inc: 0.50, Ω: 0.5,  ω: 2.0,  period: 6   },
  { name: 'Next.js',   abbr: 'Nx', color: '#e8f0ff', a: 4.8, e: 0.25, inc: -0.50,Ω: 3.0,  ω: 0.3,  period: 13  },
  { name: 'PostgreSQL', abbr: 'PG', color: '#336791', a: 5.4, e: 0.12, inc: 0.60, Ω: 4.0,  ω: 1.5,  period: 15  },
  { name: 'Redis',      abbr: 'Re', color: '#dc382d', a: 3.3, e: 0.22, inc: -0.25,Ω: 1.5,  ω: 0.8,  period: 8   },
  { name: 'Docker',     abbr: '🐳', color: '#2496ed', a: 5.0, e: 0.10, inc: 0.35, Ω: 2.5,  ω: 2.5,  period: 14  },
  { name: 'GCP',        abbr: 'GC', color: '#4285f4', a: 4.1, e: 0.28, inc: -0.42,Ω: 3.5,  ω: 1.2,  period: 10  },
  { name: 'LangGraph',  abbr: 'LG', color: '#e8a020', a: 2.5, e: 0.32, inc: 0.55, Ω: 0.8,  ω: 0.6,  period: 5.5 },
]

// Newton-Raphson solver for Kepler's equation: E - e·sin(E) = M
function solveKepler(M, e) {
  let E = M
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  return E
}

function keplerPos(t, { a, e, inc, Ω, ω, period }) {
  const M  = ((t / period) % 1) * Math.PI * 2
  const E  = solveKepler(M, e)
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  const r  = a * (1 - e * e) / (1 + e * Math.cos(nu))
  const xO = r * Math.cos(nu + ω)
  const yO = r * Math.sin(nu + ω)
  const cI = Math.cos(inc), sI = Math.sin(inc)
  const cΩ = Math.cos(Ω),   sΩ = Math.sin(Ω)
  return new THREE.Vector3(
    xO * cΩ - yO * sI * sΩ,
    yO * cI,
    xO * sΩ + yO * sI * cΩ
  )
}

// ── Interstellar "Gargantua" black hole shader ───────────────────────────────
// Camera-facing billboard. A vertically-squashed accretion ring naturally
// produces the signature silhouette: the disk arcs OVER the top of the shadow
// and passes UNDER the bottom (gravitational-lensing look), with a thin bright
// photon ring hugging the event horizon. Fully procedural turbulence + glow.
const diskVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const diskFrag = `
varying vec2 vUv;
uniform float uTime;

// ---- value noise + fbm for plasma turbulence ----
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main(){
  // Plane coords. Scaled out to ~[-1.5, 1.5] so the disk's wide horizontal
  // extensions (which reach dr≈1.25) sit inside the plane with margin and are
  // not clipped at the quad edges.
  vec2 p = (vUv - 0.5) * 3.0;
  float r = length(p);
  float ang = atan(p.y, p.x);

  vec3  col   = vec3(0.0);
  float alpha = 0.0;

  // Event-horizon shadow radius (in plane units)
  const float holeR = 0.30;

  // ── Photon ring: blazing icy ring wrapping the shadow ───────────────────
  // Cool blue-white to match the moonlit theme (a "blue supergiant" disk).
  float pr = smoothstep(0.075, 0.0, abs(r - (holeR + 0.020)));
  // Sharper inner spike for the bright filament
  pr += smoothstep(0.028, 0.0, abs(r - (holeR + 0.010))) * 0.9;
  col   += vec3(0.62, 0.80, 0.98) * pr * 0.7;
  alpha  = max(alpha, clamp(pr * 1.2, 0.0, 1.0));

  // ── Accretion disk as a vertically-squashed ring ────────────────────────
  // Squashing Y turns a circular ring into a tilted ellipse: its top edge
  // rides over the shadow, the bottom edge sweeps underneath, and the sides
  // form the bright horizontal extensions.
  float yScale = 3.1;
  vec2  d  = vec2(p.x, p.y * yScale);
  float dr = length(d);

  float inner = 0.33;
  float outer = 1.25;
  float band  = smoothstep(inner, inner + 0.06, dr) *
                (1.0 - smoothstep(outer - 0.45, outer, dr));

  // Rotating turbulent streaks (faster near the inner edge)
  float swirlA = ang * 2.5 - uTime * (0.55 + 0.6 / max(dr, 0.2));
  float turb   = fbm(vec2(swirlA, dr * 4.0 - uTime * 0.35));
  float turb2  = fbm(vec2(swirlA * 1.7 + 3.1, dr * 7.0 + uTime * 0.5));
  float plasma = mix(turb, turb2, 0.4);
  band *= 0.45 + 0.85 * plasma;

  // Inner edge runs hotter (blue-white) → cyan → deep indigo at the rim
  vec3 hot  = vec3(0.58, 0.76, 0.94);
  vec3 mid  = vec3(0.24, 0.52, 0.82);
  vec3 cool = vec3(0.06, 0.16, 0.45);
  vec3 diskCol = mix(hot, mid, smoothstep(inner, 0.72, dr));
  diskCol = mix(diskCol, cool, smoothstep(0.72, outer, dr));

  // Subtle relativistic beaming: the approaching (left) side is brighter
  float beam = 1.0 + 0.35 * (-p.x);
  band *= beam;

  // Occlude the slice of the ring that passes BEHIND the shadow
  band *= 1.0 - smoothstep(holeR + 0.02, holeR - 0.04, r) * step(p.y, 0.0) * 0.0; // keep front
  band *= (r < holeR) ? 0.0 : 1.0;

  col   += diskCol * band * 0.85;
  alpha  = max(alpha, clamp(band, 0.0, 1.0));

  // ── Soft outer halo bloom feed ──────────────────────────────────────────
  float halo = smoothstep(0.95, holeR, r) * 0.06;
  col += vec3(0.40, 0.70, 1.00) * halo * plasma;

  // Pure black inside the event horizon
  if (r < holeR) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  // Seal the rim: force full opacity from the horizon out through the photon
  // ring so the (blue-ish) background behind the billboard can't bleed through
  // the transparent edge as a coloured fringe.
  float seal = 1.0 - smoothstep(holeR, holeR + 0.11, r);
  alpha = max(alpha, seal);

  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
`

function SkillOrb({ skill, showLabels }) {
  const groupRef = useRef()
  const [hov, setHov] = useState(false)
  const posVec = useMemo(() => new THREE.Vector3(), [])
  // Tint each brand colour toward the moonlit azure so the orbs stay cohesive
  // with the cool theme (mutes the warm ones like Python/LangGraph) while still
  // reading as distinct technologies.
  const tint = useMemo(
    () => new THREE.Color(skill.color).lerp(new THREE.Color('#88baf0'), 0.5),
    [],
  )

  useFrame((state) => {
    posVec.copy(keplerPos(state.clock.elapsedTime, skill))
    if (groupRef.current) groupRef.current.position.copy(posVec)
  })

  return (
    <group ref={groupRef}>
      <mesh
        onPointerOver={() => { setHov(true);  document.body.style.cursor = 'pointer' }}
        onPointerOut={() =>  { setHov(false); document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={tint} emissive={tint}
          emissiveIntensity={hov ? 2.6 : 1.1}
          roughness={0.15} metalness={0.5}
        />
      </mesh>
      <pointLight color={tint} intensity={hov ? 1.3 : 0.4} distance={3} />

      {(showLabels || hov) && (
        <Billboard>
          {/* Abbreviation badge — sits above the orb sphere */}
          <Text
            position={[0, 0.42, 0]}
            fontSize={0.13}
            color="#e8f0ff"
            anchorX="center"
            anchorY="bottom"
            font={FONT}
            letterSpacing={0.04}
          >
            {skill.abbr}
          </Text>
          {/* Full skill name — below the orb */}
          <Text
            position={[0, -0.38, 0]}
            fontSize={0.12}
            color={tint}
            anchorX="center"
            anchorY="top"
            font={FONT}
            letterSpacing={0.05}
          >
            {skill.name}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

export default function BlackHole({ position = [-5, 0, 4], showLabels = false, active = false }) {
  const diskMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: diskVert, fragmentShader: diskFrag,
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
  }), [])

  useFrame((state) => {
    diskMat.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group position={position}>
      {/* Gargantua — camera-facing procedural disk + lensing + photon ring.
          Billboard keeps the 2D shader correct from every approach angle. */}
      <Billboard>
        <mesh material={diskMat} renderOrder={2}>
          <planeGeometry args={[16, 16]} />
        </mesh>
      </Billboard>

      {/* Cool light cast by the accretion disk onto orbiting orbs */}
      <pointLight color="#5ea8ff" intensity={4}   distance={22} />
      <pointLight color="#dbe9ff" intensity={1.8} distance={9}  />
      <pointLight color="#3a7ad9" intensity={1.2} distance={14} position={[2, 0, 0]} />

      {/* Orbiting skill icons — readable copy now lives in the DOM Skills panel */}
      {SKILLS.map((s) => <SkillOrb key={s.name} skill={s} showLabels={showLabels} />)}
    </group>
  )
}
