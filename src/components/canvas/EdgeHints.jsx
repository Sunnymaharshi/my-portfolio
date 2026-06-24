import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { cameraState, navState } from '../../utils/sharedState'
import { SECTIONS } from '../../data/sections'

// Derived from the single source of truth so positions never drift.
const TARGETS = SECTIONS
  .filter(s => s.index !== 0)
  .map(s => ({
    index: s.index,
    name: s.label.toUpperCase(),
    // The marker projects from `world + hintOffset` so a section can nudge its
    // marker off a large/bright object (e.g. About floats below the planet).
    pos: new THREE.Vector3(...s.world).add(new THREE.Vector3(...(s.hintOffset ?? [0, 0, 0]))),
    view: s.view,
    color: s.color,
  }))

const PAD = 56           // px inset from each screen edge
const _ndc = new THREE.Vector3()

export default function EdgeHints({ activeSectionIndex }) {
  const refs       = useRef({})
  const activeRef  = useRef(activeSectionIndex)

  // Keep a ref in sync so the rAF loop always reads the latest section without restarting
  useEffect(() => {
    activeRef.current = activeSectionIndex
  }, [activeSectionIndex])

  useEffect(() => {
    let rafId

    const update = () => {
      const { camera, width: w, height: h } = cameraState

      // Wait until the canvas has initialised
      if (!camera || w < 10 || h < 10) {
        rafId = requestAnimationFrame(update)
        return
      }

      // Ensure camera matrices reflect the latest position/quaternion
      camera.updateMatrixWorld()

      const cx = w / 2
      const cy = h / 2
      const active = activeRef.current

      TARGETS.forEach(t => {
        const el = refs.current[t.index]
        if (!el) return

        // Hide the indicator for whichever section the user is currently inside
        if (t.index === active) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          return
        }

        // Project world position → NDC [-1, 1]
        _ndc.copy(t.pos).project(camera)

        const inFront   = _ndc.z <= 1                            // in front of near plane
        const inViewport = Math.abs(_ndc.x) <= 1 && Math.abs(_ndc.y) <= 1
        const onScreen  = inFront && inViewport                  // float in-world when looking toward it

        let ex, ey

        if (onScreen) {
          // Section is visible: float the hint at its exact projected position
          ex = (_ndc.x *  0.5 + 0.5) * w
          ey = (1 - (_ndc.y * 0.5 + 0.5)) * h
        } else {
          // Section is off-screen or behind — clamp to screen edge
          let sx = (_ndc.x *  0.5 + 0.5) * w
          let sy = (1 - (_ndc.y * 0.5 + 0.5)) * h

          // Behind camera: perspective divide by negative w already negated x/y in NDC.
          // Mirror to restore correct edge direction.
          if (_ndc.z > 1) {
            sx = w - sx
            sy = h - sy
          }

          const dx  = sx - cx
          const dy  = sy - cy
          const mag = Math.hypot(dx, dy)

          if (mag < 1) {
            ex = cx
            ey = PAD
          } else {
            const tx = (cx - PAD) / Math.abs(dx)
            const ty = (cy - PAD) / Math.abs(dy)
            const s  = Math.min(tx, ty)
            ex = cx + dx * s
            ey = cy + dy * s
          }
        }

        el.style.opacity = '1'
        el.style.pointerEvents = 'auto'
        el.style.transform = `translate(${ex}px,${ey}px) translate(-50%,-50%)`
      })

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, []) // runs once; activeRef keeps section current without restarting the loop

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 20,
      overflow: 'hidden',
    }}>
      {TARGETS.map(t => (
        <div
          key={t.index}
          ref={el => {
            if (el) {
              refs.current[t.index] = el
              el.style.opacity = '0'    // start hidden; rAF shows them once camera is ready
            }
          }}
          onClick={() => { navState.request = t.view }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            userSelect: 'none',
            pointerEvents: 'none',   // rAF sets to 'auto' when visible
          }}
        >
          {/* Coloured star beacon */}
          <div style={{
            color: t.color,
            fontSize: 22,
            lineHeight: 1,
            animation: 'edgePulse 2.2s ease-in-out infinite',
          }}>
            ✦
          </div>
          {/* Section label */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.14em',
            color: t.color,
            opacity: 0.85,
            whiteSpace: 'nowrap',
          }}>
            {t.name}
          </div>
        </div>
      ))}
    </div>
  )
}
