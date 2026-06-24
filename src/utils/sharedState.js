// Module-level shared state between the R3F Canvas and plain DOM components.
// Using plain objects avoids React context overhead and works across boundaries.

export const cameraState = {
  camera: null,   // THREE.PerspectiveCamera, set by CameraSync inside Canvas
  width: 0,
  height: 0,
}

// Guided navigation request. Set by NavMenu / EdgeHints (DOM) when the user
// chooses a destination; consumed by DragLookCamera inside the Canvas, which
// smoothly tweens the camera's position AND orientation toward the pose, then
// clears it. Any manual drag/scroll cancels it (so the user is never fighting
// the camera — this replaces the old jarring proximity auto-align snap).
export const navState = {
  request: null,  // { pos: [x,y,z], look: [x,y,z] } | null
}
