import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { cameraState, navState } from '../../utils/sharedState'
import { SECTIONS } from '../../data/sections'
import { IS_MOBILE } from '../../utils/device'

// Derived from the single source of truth so positions never drift.
const TARGETS = SECTIONS
  .filter(s => s.index !== 0)
  .map(s => ({
    index: s.index,
    name: s.label.toUpperCase(),
    pos: new THREE.Vector3(...s.world).add(new THREE.Vector3(...(s.hintOffset ?? [0, 0, 0]))),
    view: s.view,
    viewMobile: s.viewMobile,
    color: s.color,
  }))

const PAD = 56           // px inset from each screen edge
const _ndc = new THREE.Vector3()

export default function EdgeHints({ activeSectionIndex, showHero }) {
  const refs       = useRef({})
  const activeRef  = useRef(activeSectionIndex)
  const showHeroRef = useRef(showHero)

  useEffect(() => { activeRef.current = activeSectionIndex }, [activeSectionIndex])
  useEffect(() => { showHeroRef.current = showHero }, [showHero])

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
      // On mobile: hide all markers when hero is visible or a section card is open
      const hideAll = IS_MOBILE && (showHeroRef.current || active > 0)

      TARGETS.forEach(t => {
        const el = refs.current[t.index]
        if (!el) return

        if (hideAll || t.index === active) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          return
        }

        // Project world position → NDC [-1, 1]
        _ndc.copy(t.pos).project(camera)

        const inFront   = _ndc.z <= 1                            // in front of near plane
        const inViewport = Math.abs(_ndc.x) <= 1 && Math.abs(_ndc.y) <= 1
        const onScreen  = inFront && inViewport

        let ex, ey

        if (onScreen) {
          // Object is in view: pin the marker exactly where it is in space
          ex = (_ndc.x *  0.5 + 0.5) * w
          ey = (1 - (_ndc.y * 0.5 + 0.5)) * h
        } else {
          // Off-screen or behind — clamp to the screen edge as a directional
          // cue, so you can rotate the camera toward it until the object comes
          // into view (the marker then slides onto it in space).
          let sx = (_ndc.x *  0.5 + 0.5) * w
          let sy = (1 - (_ndc.y * 0.5 + 0.5)) * h

          // Behind camera: perspective divide by negative w already negated x/y
          // in NDC. Mirror around centre to restore the correct edge direction.
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

        el.style.opacity = IS_MOBILE ? '0.55' : '1'
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
          onClick={() => { navState.request = (IS_MOBILE && t.viewMobile) ? t.viewMobile : t.view }}
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
            fontSize: IS_MOBILE ? 16 : 22,
            lineHeight: 1,
            animation: 'edgePulse 2.2s ease-in-out infinite',
          }}>
            ✦
          </div>
          {/* Section label */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: IS_MOBILE ? 7 : 8,
            letterSpacing: '0.12em',
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
