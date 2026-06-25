# Portfolio — CLAUDE.md

Maharshi Reddy's 3D space portfolio. React Three Fiber — drag-to-look + scroll-to-fly through 5 sectors. Content in **DOM panels** overlaid on the canvas; 3D scene is pure scenery.

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

`--bg-deep #050d1a` · `--bg-mid #0a1628` · `--accent-blue #4a90d9` · `--accent-silver #c8deff` · `--text-secondary #8aaed4` · `--accent-glow #7bb3f0`

Per-section: About `#7bb3f0` · Skills `#5ec8e6` · Projects `#45c7c0` · Contact `#4a90d9`

## Sections (`src/data/sections.js` — single source of truth)

| idx | World pos | 3D object | Status |
|---|---|---|---|
| 1 | [25, 6, 70] | **StellarNursery** | ✓ |
| 2 | [-90, 32, -40] | **BlackHole** + AGN disk | ✓ |
| 3 | [-65, -35, -120] | **BinaryStarSystem** in nebula | ✓ |
| 4 | [-40, -12, -175] | **Pulsar** | ✓ |

Sections arranged **around** ~[0,0,-60] — not a linear −Z tunnel. Camera start: `[0,12,200]` → `[0,4,175]`, `fov=60, far=6000`.

## What to customize

| What | Where |
|---|---|
| Bio, skills, projects, contact text | `src/data/sections.js` |
| Skill orb names (3D) | `BlackHole.jsx` `SKILLS` |
| Project star systems (3D) | `BinaryStarSystem.jsx` `STARS` |
| Section positions + view poses | `sections.js` + matching component |
| Loading screen name | `LoadingScreen.jsx` `layoutLine` + `GLYPHS` |
| Decorative nebulae / clusters | `SpaceScene.jsx` decorative block |
| Post-fx | `SpaceScene.jsx` `<EffectComposer>` |

## Adding a section 3D object

1. Create `ComponentName.jsx` in `src/components/canvas/`. Use additive blending + `depthWrite={false}` + `fog={false}`. Mobile: thin counts with `IS_MOBILE` guard.
2. Wire into `SpaceScene.jsx` — swap import + JSX. Position via `SECTION_BY_INDEX[n].world`.
3. `view.pos` must be **within 50u** of `section.world` — proximity trigger is hardcoded at 50u.
4. **Left-of-card (desktop):** card occupies right ~35%. Target NDC X ≈ −0.33.
   - `cam_right = normalize(cross([0,1,0], backward))` where `backward = normalize(pos - look)` (Three.js convention)
   - `look = object` always gives NDC X = 0 — aim `look` PAST the object to offset it
   - For −Z objects: camera between origin and object, look past object to the right
   - Mobile `viewMobile`: `look = world` centers the object
5. Outer cloud radius R needs camera distance D > 1.73R to fit in FOV (fov=60, half-angle 30°).

## Debugging background objects in a section view

**Frustum check** (FOV 60°, half-angle 30°):
```
backward = normalize(pos - look)
cam_right = normalize(cross([0,1,0], backward))
forward = -backward
depth = dot(object - pos, forward)      // < 0 → behind camera, safe
frac  = |dot(object - pos, cam_right)| / depth   // > 0.577 → off screen
```

**Skills danger zone** — camera `pos=[-73,28,-52]` looks mostly in −X. Any object with `x < −73` may be visible. Rule: move offenders to `x > −73` (behind skills camera).

`EmissionNebula` and `SupernovaRemnant` share teal color `#45c7c0` — check both before assuming which one is visible.

## Known constraints

- No `<Html>` inside canvas — use `<Billboard><Text>` for 3D labels
- `sections.js` positions update nav/beacons but **not** 3D object props — update both
- Black hole is a billboarded 2D shader — no bright objects at its center (bloom → false rings)
- `BlendFunction.OVERLAY opacity≤0.16` only — SOFT_LIGHT fringes the photon ring
- EdgeHints opacity — set only in rAF loop, never JSX `style` (React resets it)
- `camera.updateMatrixWorld()` must be called manually in EdgeHints rAF
- Audio needs user gesture — `init()` + `ctx.resume()`; starts muted
