import { useState, useEffect, useRef, useMemo } from 'react'

// ── Constellation name reveal ────────────────────────────────────────────────
// A full-screen field of stars. Within it, faint star-nodes are arranged into
// the letters of "MAHARSHI REDDY"; a thin luminous line traces each letter
// (letters are NOT joined to each other). When the draw finishes the lines fade
// away — leaving just the stars — and the whole overlay dissolves into the 3D
// space scene behind it.

// Single-stroke letter paths on a unit grid (x: 0..w, y: 0 top → 1 bottom)
const GLYPHS = {
  M: { w: 0.82, p: [[0,1],[0,0],[0.41,0.58],[0.82,0],[0.82,1]] },
  A: { w: 0.72, p: [[0,1],[0.36,0],[0.72,1],[0.55,0.56],[0.17,0.56]] },
  H: { w: 0.70, p: [[0,0],[0,1],[0,0.5],[0.70,0.5],[0.70,0],[0.70,1]] },
  R: { w: 0.70, p: [[0,1],[0,0],[0.50,0],[0.69,0.23],[0.50,0.48],[0,0.48],[0.70,1]] },
  S: { w: 0.66, p: [[0.66,0.16],[0.33,0],[0,0.22],[0.38,0.5],[0.66,0.74],[0.33,1],[0,0.82]] },
  I: { w: 0.40, p: [[0,0],[0.40,0],[0.20,0],[0.20,1],[0,1],[0.40,1]] },
  E: { w: 0.62, p: [[0.62,0],[0,0],[0,0.5],[0.46,0.5],[0,0.5],[0,1],[0.62,1]] },
  D: { w: 0.72, p: [[0,1],[0,0],[0.42,0],[0.72,0.32],[0.72,0.68],[0.42,1],[0,1]] },
  Y: { w: 0.70, p: [[0,0],[0.35,0.52],[0.70,0],[0.35,0.52],[0.35,1]] },
}

const UNIT = 54       // px per grid unit
const GAP  = 0.34     // gap between letters (grid units)
const LINE_GAP = 44   // px between the two text lines

const STAGGER = 0.16  // seconds between consecutive letters starting to draw
const DRAW    = 0.34  // seconds to trace one letter

// Lay out one text line into a list of per-letter point arrays (un-centred)
function layoutLine(text, originY) {
  let x = 0
  const letters = []
  for (const ch of text) {
    const g = GLYPHS[ch]
    if (!g) { x += 0.5 + GAP; continue }
    const pts = g.p.map(([px, py]) => [(x + px) * UNIT, originY + py * UNIT])
    letters.push({ pts })
    x += g.w + GAP
  }
  return { letters, width: (x - GAP) * UNIT }
}

export default function LoadingScreen({ onReveal, onLoaded }) {
  const [done, setDone] = useState(false)
  // Keep latest callbacks in refs so the timeline effect can run with empty
  // deps (StrictMode-safe; not restarted when the parent re-renders).
  const onRevealRef = useRef(onReveal); onRevealRef.current = onReveal
  const onLoadedRef = useRef(onLoaded); onLoadedRef.current = onLoaded

  const { letters, vbWidth, vbHeight } = useMemo(() => {
    const l1 = layoutLine('MAHARSHI', 0)
    const l2 = layoutLine('REDDY', UNIT + LINE_GAP)
    const maxW = Math.max(l1.width, l2.width)
    const centre = (line) => line.letters.map(L => ({
      pts: L.pts.map(([x, y]) => [x + (maxW - line.width) / 2, y]),
    }))
    // Global reading order → drives the per-letter draw stagger
    const letters = [...centre(l1), ...centre(l2)].map((L, i) => ({ ...L, order: i }))
    return { letters, vbWidth: maxW, vbHeight: UNIT * 2 + LINE_GAP }
  }, [])

  // Full-screen background starfield (viewport-% coordinates) — dense, so the
  // name star-nodes blend into the field once the connecting line fades.
  const bgStars = useMemo(() => Array.from({ length: 320 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: Math.random() < 0.12 ? 1.6 + Math.random() * 1.4 : 0.6 + Math.random() * 1.0,
    o: 0.22 + Math.random() * 0.5,
    d: Math.random() * 3,
  })), [])

  // Deterministic timeline (ms from mount). The fades are driven by CSS
  // animations (compositor thread) so they can't be starved by the 3D render
  // loop once the scene mounts. Only onReveal/onLoaded use timers — onReveal
  // fires while the main thread is still free (scene not yet mounted).
  const drawEnd  = (letters.length - 1) * STAGGER + DRAW   // seconds
  const linesAt  = drawEnd + 0.45
  const fadeAt   = drawEnd + 1.85
  const doneAt   = drawEnd + 2.70

  useEffect(() => {
    const tReveal = setTimeout(() => onRevealRef.current?.(), linesAt * 1000)
    const tDone   = setTimeout(() => { setDone(true); onLoadedRef.current?.() }, doneAt * 1000)
    return () => { clearTimeout(tReveal); clearTimeout(tDone) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (done) return null

  const pad = 70
  const W = vbWidth + pad * 2
  const H = vbHeight + pad * 2

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: '#050d1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', overflow: 'hidden',
      // Dissolve to the space scene (compositor-driven, can't be starved)
      animation: `loadDissolve 0.9s ease ${fadeAt}s forwards`,
    }}>
      {/* Full-screen starfield */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {bgStars.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.s, height: s.s, borderRadius: '50%', background: '#c8deff',
            boxShadow: `0 0 ${s.s * 2}px rgba(200,222,255,0.6)`,
            opacity: s.o, animation: `loadStarTwinkle 2.6s ease-in-out ${s.d}s infinite`,
          }} />
        ))}
      </div>

      {/* Name: per-letter trace lines + star-nodes */}
      <svg viewBox={`${-pad} ${-pad} ${W} ${H}`} style={{ width: 'min(86vw, 700px)', overflow: 'visible', zIndex: 1 }}>
        {/* Tracing lines — one polyline per letter, no inter-letter joins.
            Fade out once drawn (compositor-driven), leaving just the stars. */}
        <g style={{ animation: `loadDissolve 0.8s ease ${linesAt}s forwards` }}>
          {letters.map((L, i) => (
            <polyline
              key={i}
              points={L.pts.map(p => p.join(',')).join(' ')}
              fill="none"
              stroke="#9cc6f5"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `loadTrace ${DRAW}s ease-in-out ${L.order * STAGGER}s forwards`,
              }}
            />
          ))}
        </g>

        {/* Star-nodes — small, same look as the background stars (no glow), so
            after the line fades the name dissolves into the starfield. The line
            carries legibility while drawing, so the nodes stay subtle. */}
        {letters.map((L, li) =>
          L.pts.map((p, j) => {
            const delay = L.order * STAGGER + (j / L.pts.length) * DRAW
            return (
              <circle key={`${li}-${j}`} cx={p[0]} cy={p[1]} r={0.85} fill="#c8deff"
                style={{ opacity: 0, animation: `loadStarTwinkle 2.6s ease-in-out ${delay}s infinite` }} />
            )
          })
        )}
      </svg>

      <div style={{
        marginTop: 30, zIndex: 1, fontFamily: "'Space Mono', monospace",
        fontSize: 10, letterSpacing: '0.34em', color: '#4a6a8a', textTransform: 'uppercase',
        opacity: 0, animation: 'loadFadeIn 1s ease 1.4s forwards',
      }}>
        Software Engineer · Full-Stack · AI Systems
      </div>
    </div>
  )
}
