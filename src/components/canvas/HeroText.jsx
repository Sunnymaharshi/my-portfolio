// Native 3D hero title — floats in world space directly in front of
// the opening camera position. Fades in on mount, fades out as scroll begins.
// Geometrically exits the camera frustum naturally when camera moves toward section 1.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'

const FONT = '/fonts/SpaceMono-Regular.ttf'

export default function HeroText({ scrollProgress }) {
  const nameRef = useRef()
  const tagRef  = useRef()
  const el      = useRef(0)

  useFrame((_, dt) => {
    el.current = Math.min(el.current + dt, 1.5)
    const fadeIn  = Math.min(el.current / 0.9, 1)
    const fadeOut = Math.max(0, 1 - Math.max(0, scrollProgress - 0.04) / 0.08)
    const opacity = fadeIn * fadeOut

    if (nameRef.current) nameRef.current.fillOpacity = opacity
    if (tagRef.current)  tagRef.current.fillOpacity  = opacity * 0.85
  })

  return (
    <Billboard position={[0, 6.8, 186]}>
      {/* Name */}
      <Text
        ref={nameRef}
        position={[0, 0.9, 0]}
        fontSize={1.55}
        color="#e8f0ff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
        fillOpacity={0}
        font={FONT}
      >
        MAHARSHI REDDY
      </Text>

      {/* Role tagline */}
      <Text
        ref={tagRef}
        position={[0, -0.85, 0]}
        fontSize={0.40}
        color="#7bb3f0"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.10}
        fillOpacity={0}
        font={FONT}
        maxWidth={14}
      >
        SOFTWARE ENGINEER · FULL-STACK · AI SYSTEMS
      </Text>
    </Billboard>
  )
}
