// Decorative star constellation shapes scattered far off the camera path.
// fog=false on all geometry — visible from anywhere as faint background patterns.

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

const CONSTELLATIONS = [
  {
    id: "orion",
    center: [100, -60, 75], // bottom-right of entry view (right + below horizon)
    scale: 6,
    color: "#c8deff",
    stars: [
      [-0.2, 4.0, 0], // Betelgeuse
      [1.8, 3.8, 0], // Bellatrix
      [-0.5, 0.3, 0], // Mintaka
      [0.0, 0.0, 0], // Alnilam
      [0.5, -0.3, 0], // Alnitak
      [-1.5, -3.8, 0], // Saiph
      [2.0, -4.0, 0], // Rigel
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [5, 2],
      [6, 4],
      [0, 1],
    ],
  },
  {
    id: "big-dipper",
    center: [114, -20, 15],
    scale: 12,
    color: "#7bb3f0",
    stars: [
      [0.0, 0.0, 0], // Dubhe
      [1.4, -0.7, 0], // Merak
      [2.8, 0.0, 0], // Phecda
      [3.5, 1.1, 0], // Megrez
      [5.0, 2.4, 0], // Alioth
      [6.4, 3.6, 0], // Mizar
      [7.8, 3.0, 0], // Alkaid
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    id: "cassiopeia",
    center: [-125, -52, -72],
    scale: 11,
    color: "#c8deff",
    stars: [
      [0.0, 0.0, 0],
      [1.5, 2.2, 0],
      [3.0, 0.5, 0],
      [4.5, 2.2, 0],
      [6.0, 0.4, 0],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: "leo",
    center: [50, 48, -158],
    scale: 10,
    color: "#b9c4ef",
    stars: [
      [0.0, 0.0, 0], // Regulus
      [0.8, 1.8, 0], // Eta
      [0.1, 3.0, 0], // Gamma
      [-0.9, 2.2, 0], // Zeta
      [-1.2, 0.9, 0], // Mu
      [3.2, 0.4, 0], // Denebola
      [4.4, 1.6, 0], // Theta
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [0, 5],
      [5, 6],
      [6, 1],
    ],
  },
];

function ConstellationShape({ data }) {
  const starRefs = useRef([]);

  const positions = useMemo(
    () =>
      data.stars.map((s) => [
        data.center[0] + s[0] * data.scale,
        data.center[1] + s[1] * data.scale,
        data.center[2] + s[2] * data.scale,
      ]),
    [],
  );

  const lineBuffers = useMemo(
    () =>
      data.lines.map(
        ([a, b]) => new Float32Array([...positions[a], ...positions[b]]),
      ),
    [positions],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    starRefs.current.forEach((mesh, i) => {
      if (!mesh?.material) return;
      // Compound-sine twinkle — each star on its own phase
      const s =
        0.55 +
        0.45 * Math.sin(t * 0.9 + i * 1.37) * Math.sin(t * 1.4 + i * 0.83);
      mesh.material.emissiveIntensity = 1.4 * s;
    });
  });

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => {
            starRefs.current[i] = el;
          }}
          position={pos}
        >
          <sphereGeometry args={[data.starSize ?? 0.38, 5, 5]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={data.color}
            emissiveIntensity={1.4}
            fog={false}
          />
        </mesh>
      ))}
      {lineBuffers.map((buf, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buf, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={data.color}
            transparent
            opacity={data.lineOpacity ?? 0.16}
            fog={false}
          />
        </line>
      ))}
    </group>
  );
}

export default function BackgroundConstellations() {
  return (
    <>
      {CONSTELLATIONS.map((c) => (
        <ConstellationShape key={c.id} data={c} />
      ))}
    </>
  );
}
