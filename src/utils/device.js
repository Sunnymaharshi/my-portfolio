// Coarse capability flag, evaluated once at load. Used to scale back GPU work
// (MSAA, dpr, particle counts) and to drop desktop-only UI on touch/small screens.
export const IS_MOBILE = typeof window !== 'undefined' && (
  window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 820
)

// Estimate device GPU tier on mobile:
//   'high'   → modern flagship  (cores ≥ 8, devicePixelRatio ≥ 2.5)
//   'mid'    → capable mid-range (cores ≥ 6, or high DPR)
//   'low'    → budget / old device
function detectMobileTier() {
  if (!IS_MOBILE) return 'high' // desktop always high
  const cores = navigator.hardwareConcurrency ?? 4
  const dpr   = window.devicePixelRatio ?? 1
  if (cores >= 8 && dpr >= 2.5) return 'high'
  if (cores >= 6 || dpr >= 2)   return 'mid'
  return 'low'
}

export const MOBILE_TIER = detectMobileTier()

// Render quality presets per tier
export const RENDER_DPR = IS_MOBILE
  ? MOBILE_TIER === 'high' ? [1, 2.5]
  : MOBILE_TIER === 'mid'  ? [1, 2]
  :                          1
  : [1, 1.5]

export const RENDER_MSAA = IS_MOBILE
  ? MOBILE_TIER === 'high' ? 4
  : MOBILE_TIER === 'mid'  ? 2
  :                          0
  : 4
