import * as THREE from 'three'

// A soft radial-gradient circle texture, generated once and shared.
// Used as the `map` on pointsMaterial so particles render as round glows
// instead of the default square point sprites.
let _circle = null
export function circleSprite() {
  if (_circle) return _circle
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0.0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1.0, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  _circle = new THREE.CanvasTexture(c)
  return _circle
}
