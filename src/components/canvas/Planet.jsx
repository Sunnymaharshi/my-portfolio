import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Procedural gas-giant surface: swirling latitude bands + churning storms
//    in cool blue-violet tones, with a soft day/night terminator. ───────────
const surfaceVert = /* glsl */`
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vPosL    = position;
    vec4 wp  = modelMatrix * vec4(position, 1.0);
    vPosW    = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const surfaceFrag = /* glsl */`
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;
  uniform float uTime;
  uniform vec3  uLightDir;

  // ---- 3D value noise + fbm ----
  float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p){
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), u.x),
                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main(){
    vec3 n = normalize(vNormalW);
    vec3 sp = normalize(vPosL);

    float lat = sp.y;   // -1 (south) .. +1 (north)

    // Domain-warp the latitude so the bands undulate like flowing gas, with a
    // slow churn over time. Two octaves of warp give a turbulent, layered look.
    float warp  = fbm(sp * 2.2 + vec3(uTime * 0.02, 0.0, 0.0)) - 0.5;
    float swirl = fbm(sp * 4.5 + vec3(uTime * 0.035, 10.0, 0.0)) - 0.5;
    float bandCoord = lat * 9.0 + warp * 3.2 + swirl * 1.4;

    // Banded value (0..1) + fine turbulence streaks
    float bands = sin(bandCoord * 3.14159) * 0.5 + 0.5;
    float turb  = fbm(sp * 7.5 + vec3(uTime * 0.05, 0.0, 0.0));

    // Cool gas-giant palette: deep indigo → blue → pale cyan
    vec3 deep  = vec3(0.05, 0.08, 0.26);
    vec3 mid   = vec3(0.15, 0.33, 0.62);
    vec3 lightB= vec3(0.48, 0.70, 0.94);
    vec3 surf  = mix(deep, mid, bands);
    surf = mix(surf, lightB, smoothstep(0.62, 1.0, bands) * (0.5 + 0.5 * turb));
    surf *= 0.85 + 0.30 * turb;

    // A churning "great storm" oval (cool cyan→violet), like a calm cousin of
    // Jupiter's Red Spot.
    vec3  spotDir   = normalize(vec3(0.55, -0.22, 0.80));
    float d         = distance(sp, spotDir);
    float spot      = smoothstep(0.32, 0.0, d);
    float spotSwirl = fbm(sp * 11.0 + vec3(uTime * 0.08, 0.0, 0.0));
    vec3  spotCol   = mix(vec3(0.30, 0.52, 0.86), vec3(0.52, 0.40, 0.86), spotSwirl);
    surf = mix(surf, spotCol, spot * 0.85);

    // Brighten the poles slightly (cool haze)
    surf = mix(surf, vec3(0.55, 0.66, 0.86), smoothstep(0.86, 1.0, abs(lat)) * 0.5);

    // Day / night terminator — night side stays dim but not pure black
    float ndl = dot(n, normalize(uLightDir));
    float day = smoothstep(-0.25, 0.45, ndl);
    vec3  lit = surf * (0.10 + day * 1.05);

    gl_FragColor = vec4(lit, 1.0);
  }
`

// ── Fresnel atmosphere: bright rim glow that fades to clear at the centre ────
const atmoVert = /* glsl */`
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp  = modelMatrix * vec4(position, 1.0);
    vPosW    = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const atmoFrag = /* glsl */`
  varying vec3 vNormalW;
  varying vec3 vPosW;
  uniform vec3  uLightDir;
  uniform vec3  uColor;
  uniform float uPower;
  uniform float uIntensity;
  void main(){
    vec3 n = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float fres = pow(1.0 - max(dot(n, viewDir), 0.0), uPower);
    // Stronger on the day side (forward-scattering)
    float day  = smoothstep(-0.3, 0.5, dot(n, normalize(uLightDir)));
    float a = fres * uIntensity * (0.35 + day * 0.9);
    gl_FragColor = vec4(uColor, a);
  }
`

export default function Planet({ position = [0, 0, 0], scale = 1 }) {
  const meshRef = useRef()
  const cloudRef = useRef()
  const ringRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Light direction roughly matches the scene directional light
  const lightDir = useMemo(() => new THREE.Vector3(-5, 3, 5).normalize(), [])

  const surfMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: surfaceVert, fragmentShader: surfaceFrag,
    uniforms: {
      uTime:     { value: 0 },
      uLightDir: { value: lightDir },
    },
  }), [lightDir])

  const atmoMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmoVert, fragmentShader: atmoFrag,
    uniforms: {
      uLightDir:  { value: lightDir },
      uColor:     { value: new THREE.Color('#5ea8ff') },
      uPower:     { value: 3.2 },
      uIntensity: { value: 1.1 },
    },
    transparent: true, side: THREE.FrontSide, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [lightDir])

  // Wide outer glow shell (back side) for the soft corona
  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmoVert, fragmentShader: atmoFrag,
    uniforms: {
      uLightDir:  { value: lightDir },
      uColor:     { value: new THREE.Color('#4a90d9') },
      uPower:     { value: 2.4 },
      uIntensity: { value: 0.5 },
    },
    transparent: true, side: THREE.BackSide, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [lightDir])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    surfMat.uniforms.uTime.value = t
    if (meshRef.current)  meshRef.current.rotation.y = t * 0.035
    if (cloudRef.current) cloudRef.current.rotation.y = t * 0.05
    if (ringRef.current)  ringRef.current.rotation.z = t * 0.025
    atmoMat.uniforms.uIntensity.value = (hovered ? 1.4 : 1.1)
  })

  return (
    <group
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Procedural surface */}
      <mesh ref={meshRef} material={surfMat}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>

      {/* Fresnel atmosphere rim (front) */}
      <mesh material={atmoMat} scale={1.015}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>

      {/* Soft outer corona (back) */}
      <mesh material={glowMat} scale={1.28}>
        <sphereGeometry args={[1, 48, 48]} />
      </mesh>

      {/* Tilted multi-band ring system (Saturn-style) */}
      <group ref={ringRef} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[1.52, 0.018, 8, 140]} />
          <meshBasicMaterial color="#bcd4f5" transparent opacity={0.30} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.78, 0.026, 8, 140]} />
          <meshBasicMaterial color="#9fc4f0" transparent opacity={0.22} />
        </mesh>
        <mesh>
          <torusGeometry args={[2.05, 0.014, 8, 140]} />
          <meshBasicMaterial color="#c8deff" transparent opacity={0.16} />
        </mesh>
      </group>

      {/* Key + fill lights */}
      <pointLight position={[-3, 1.5, 2.5]} color="#cfe2ff" intensity={1.4} distance={12} />
      <pointLight position={[3, -1, -2]}    color="#0a2a5e" intensity={0.5} distance={6} />
    </group>
  )
}
