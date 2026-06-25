# Portfolio — CLAUDE.md

Maharshi Reddy's 3D space portfolio. React Three Fiber — drag-to-look + scroll-to-fly through 5 sectors. Content lives in **DOM panels** overlaid on the canvas; the 3D scene is pure scenery.

## Dev

```bash
npm run dev    # http://localhost:5173
npm run build
```

## Stack

- React 18 + Vite, React Three Fiber + drei, CSS Modules
- **@react-three/postprocessing must stay v2.x** — v3 requires R3F v9
- Space Grotesk (sans) + Space Mono (mono). 3D text needs TTF — troika doesn't support woff2
- `html, body { overflow: hidden }` — no page scroll

## Design (`src/styles/globals.css`)

Palette: **moonlit night** — deep navy, silver-white, cool blue. No warm/orange anywhere.

| Variable | Value | Variable | Value |
|---|---|---|---|
| `--bg-deep` | `#050d1a` | `--accent-blue` | `#4a90d9` |
| `--bg-mid` | `#0a1628` | `--accent-silver` | `#c8deff` |
| `--text-secondary` | `#8aaed4` | `--accent-glow` | `#7bb3f0` |

Per-section: About `#7bb3f0` · Skills `#5ec8e6` · Projects `#45c7c0` · Contact `#4a90d9`

## Sections (`src/data/sections.js` — single source of truth)

| idx | World pos | 3D object | Status |
|---|---|---|---|
| 0 | — | — | — |
| 1 | [25, 6, 70] | **StellarNursery** | ✓ done |
| 2 | [-90, 32, -40] | **BlackHole** + AGN galaxy disk | ✓ done |
| 3 | [-65, -35, -120] | **BinaryStarSystem** in nebula | ✓ done |
| 4 | [-40, -12, -175] | **Pulsar** | ✓ done |

Each object is embedded in a surrounding system (cloud/disk/shell) for an immersive fly-in. Implementation order: Contact ✓ → About ✓ → Skills ✓ → Projects ✓. All sections complete.

### Section object specs

**About — StellarNursery** (`StellarNursery.jsx`, replaces `Planet`)
- Central protostar: small warm sphere (`#fff8e0`), bloom creates corona
- Spinning accretion disk: ~1200 particles, inner warm (`#ffcc88`) → outer cool (`#8899dd`), rotates on Y
- Bipolar jets: ~300 particles streaming ±Y from poles, blue-white (`#ccddff`)
- 3 infant planetesimals: small spheres in elliptical orbits at 5–8u, rocky colors
- Outer molecular cloud: ~1800 particles, 5–14u radius, warm orange (`#cc8840`), very faint

**Skills — BlackHole AGN** (extend `BlackHole.jsx`, don't replace)
- Keep all existing black hole shader + skill orbs unchanged
- Add a sparse galaxy particle disk fanning outward beyond the orbs (radius 15–28u)
- Disk should look like a galactic plane — the black hole is the AGN at its core
- Cool blue/silver colors matching existing palette; very faint to not compete with the shader

**Projects — BinaryStarSystem** (`BinaryStarSystem.jsx`, replaces `ProjectGalaxy`)
- Two stars orbiting each other: Codesense = violet (`#9b8cf5`), API Rate Limiter = sky-blue (`#6fb0ef`)
- Different sizes (Codesense larger), slow mutual orbit (8–10u separation)
- Billboard+Text name tags near each star (same pattern as ProjectGalaxy)
- Surrounding nebula cloud: ~1000 particles, mix of violet+blue, 6–12u radius
- Contact content stays in InfoPanel unchanged

Sections sit **around** a central point (~[0,0,-60]) — not in a tunnel. This keeps EdgeHints clamped to screen edges. Don't rearrange into a linear −Z layout.

Camera start: `[0, 12, 200]` looking toward `[0, 4, 175]`. `fov=60, far=6000`.

## Adding / replacing a section 3D object

1. **Create `ComponentName.jsx`** in `src/components/canvas/`. Use additive blending + `depthWrite={false}` + `fog={false}` for all particle/glow materials. Mobile: thin particle counts with `IS_MOBILE` guard.
2. **Wire into SpaceScene.jsx** — swap old import + JSX line. Position via `SECTION_BY_INDEX[n].world`.
3. **Set the view pose in `sections.js`** — `view.pos` must be **within 50u** of `section.world` or the info card will never open (proximity trigger in `DragLookCamera` is hardcoded at 50u). Formula to check: `sqrt((px-wx)²+(py-wy)²+(pz-wz)²) < 50`.
4. **Left-of-card offset (desktop)** — the info card occupies the right ~35% of screen. Target NDC X ≈ −0.33 for the object center.

   **The approach direction determines which world axis is camera-right — get this wrong and the object lands on the right side (behind the card).**

   | Camera looks toward | Camera local right = world… | To put object on LEFT, camera must be… |
   |---|---|---|
   | **−Z** (object deeper than camera, e.g. StellarNursery at z=70 viewed from z=92) | **+X** | to the **left** (−X) of the object |
   | **+Z** (object shallower than camera) | **−X** | to the **right** (+X) of the object |
   | **−X** (object at negative X) | **−Z** | camera must be at **more negative Z** than the object (cam.z < obj.z), then look PAST the object further in −X |

   **StellarNursery lesson (About, world [25,6,70]):** old pose `pos=[41,7,52]` put the camera in *front* of the object (z=52 < 70), making the camera look in +Z. Camera-right was world -X. Object at x=25 was in the -X direction from x=41 → appeared on the RIGHT side. Fix: `pos=[8,8,92]` puts camera *behind* the object (z=92 > 70), looking in −Z. Camera-right is now world +X. Camera is at x=8 (left of object x=25), look at [31,6,72] (right of object) → NDC X ≈ −0.35 ✓.

   **Critical: `look = object` always gives NDC X = 0.** When the look target equals the object's world position, the forward vector points directly at the object, so cam_local_X = 0 regardless of camera position. To place the object off-center, aim `look` PAST the object (further along the look direction).

   **Skills section (world [−90,32,−40], looks in −X):** cam_right = −Z. For the object to appear LEFT (NDC X ≈ −0.34), camera must be at z < −40 (e.g. z=−52), with look aimed past the object in −X (e.g. [−100,32,−40]). The +Z offset from camera to object (12u) is in the −cam_right direction → LEFT. Current working pose: `pos:[−73,28,−52], look:[−100,32,−40]`.

   **Rule of thumb:** place `view.pos` on the *same side* (in Z) as the camera start [0,12,200], but *past* the natural fly-in stopping point. For objects at positive Z, come from z > object.z. For objects at negative Z (Skills, Projects, Contact), come from z > object.z as well (between origin and object). Aim `view.look` slightly to the *right* and *past* the object so it falls left of look center. Mobile `viewMobile` should center the object directly (`look = world`).
5. **Verify object fits in frame** — outer shell/cloud radius R needs D > R/tan30° ≈ 1.73R to fit on screen. For a 18u shell: D > 31u minimum; use D ≈ 45–48u for breathing room.
6. **EdgeHints shift is expected** — changing `view.pos` changes camera orientation at that section, so other sections' markers land in different screen positions. Not a bug.

## Debugging background objects visible in a section view

When the user reports an unwanted object in a section's background, follow this checklist **before moving anything**:

### 1. Identify the actual object (don't assume by name)

`EmissionNebula` and `SupernovaRemnant` share the **same teal core color `#45c7c0`** — they look identical to the user. Check ALL decorative types, not just the one named.

### 2. Compute which objects are in the frustum (FOV 60°, half-angle 30°)

For a camera at `pos` looking at `look`:
```
forward = normalize(look - pos)
vector  = object_world - pos
depth   = dot(vector, forward)      // negative → behind camera, safe
frac    = |dot(vector, cam_right)| / depth   // > 0.577 → off screen horizontally
```
Only objects with `depth > 0` AND `frac < 0.577` are on screen.

**cam_right** = `normalize(cross(worldUp=[0,1,0], backward))` where `backward = normalize(pos - look)` (Three.js `lookAt` convention — NOT `cross(up, forward)`)

### 3. Skills section view — known danger zone

Skills camera: `pos=[-73, 28, -40]`, `look=[-87, 33, -41]`, **forward ≈ (−0.940, 0.336, −0.067)** (mostly −X).

Any decorative object with **x < −73** is potentially in front of this camera. The past offenders:
- **CLOSE SupernovaRemnant** — was at `[-158, 38, -42]`, sat at NDC X=−0.08, NDC Y=−0.40 (center-lower, fully visible). Fixed to `[-158, -80, 80]`.
- **FAR EmissionNebula** — was at `[-1500, 200, -300]`, then `[-300, 200, -1500]`. Fixed to `[1500, 200, -800]` which is in +X (behind the skills camera, depth = −1370u).

**Rule:** to guarantee an object is behind the skills camera, its **x must be > −73** (positive side). The skills camera looks in −X so anything in +X is behind it.

### 4. Hotfix pattern

Move the object to a position where `depth < 0` from the offending view. For skills, move to **x > −73**. Verify from all other section cameras that the new position doesn't land in their frustums either (run the depth formula above for each).

## Known constraints

- **No `<Html>` inside canvas** — use `<Billboard><Text>` for 3D labels, DOM for content
- **sections.js positions** auto-update nav/beacons but NOT 3D object props — update both manually
- **Black hole is a billboarded 2D shader** — don't place bright objects at its center (bloom → false rings)
- **Noise: `BlendFunction.OVERLAY opacity≤0.16` only** — SOFT_LIGHT fringes the photon ring
- **EdgeHints opacity** — set only in rAF loop, never in JSX `style` (React resets it on re-render)
- **`camera.updateMatrixWorld()`** must be called manually in EdgeHints rAF
- **Audio** needs user gesture — `init()` + `ctx.resume()`; starts muted

## What to customize

| What | Where |
|---|---|
| Bio, skills, projects, contact text | `src/data/sections.js` |
| Skill orb names (3D) | `BlackHole.jsx` `SKILLS` |
| Project star systems (3D) | `BinaryStarSystem.jsx` `STARS` |
| Section positions + view poses | `sections.js` + matching component props |
| Loading screen name | `LoadingScreen.jsx` `layoutLine` + `GLYPHS` |
| Decorative nebulae / clusters | `SpaceScene.jsx` decorative block |
| Galaxies | `Galaxy.jsx` `<SpiralGalaxy>` calls |
| Post-fx | `SpaceScene.jsx` `<EffectComposer>` |
