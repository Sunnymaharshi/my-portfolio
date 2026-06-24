// Coarse capability flag, evaluated once at load. Used to scale back GPU work
// (MSAA, dpr, particle counts) and to drop desktop-only UI on touch/small screens.
export const IS_MOBILE = typeof window !== 'undefined' && (
  window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 820
)
