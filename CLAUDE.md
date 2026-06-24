# Portfolio — CLAUDE.md

## Project overview

Maharshi Reddy's personal portfolio. A 3D space-themed experience built with React Three Fiber. The **3D universe is the immersive stage; the portfolio content is read in crisp DOM panels overlaid on top** — a deliberate combination of "space exploration" and "readable portfolio." **Drag-to-look + scroll-to-fly exploration** — drag to look around, scroll to fly in the direction of the cursor. 5 sectors separated by ~100–130 world-units of deep space. No pointer lock, no keyboard controls, no scroll-driven camera.

**Navigation is guided, never forced.** Proximity (camera within 50u of a zone) only updates `sectionIndex` to drive the UI (nav highlight + which DOM panel shows) — it never moves or rotates the camera. The user reaches sections by free flight, by clicking the persistent **NavMenu**, or by clicking an **EdgeHints** waypoint; both trigger a smooth **guided fly-to** (camera tweens position + orientation to a framed view pose, cancelled instantly by any drag/scroll). A **guided Tour** auto-visits all four sectors in order.

Each active section shows a readable **DOM InfoPanel** (right-side glass card) with a focus scrim that quiets the busy background; section 0 (deep space / home) shows a **hero overlay** (name, role, tagline, CTAs). The 3D objects (planet, black hole + skill orbs, project star systems, station) are now visual anchors only — their dense text dossiers were moved into the DOM panels.

## Dev server

```bash
npm run dev       # starts on http://localhost:5173 (or next free port)
npm run build     # production build to dist/ (4 parallel chunks)
```

## Stack

- **React 18 + Vite** — app shell; `vite.config.js` splits into 4 manual chunks (`three`, `r3f`, `post`, `index`) for parallel loading and long-term caching
- **React Three Fiber + @react-three/drei** — all 3D scenes (`<Text>` for 3D labels, `<Billboard>` for camera-facing labels — no Html boxes *inside* the canvas; readable portfolio text lives in DOM panels overlaid outside the canvas)
- **Three.js** — underlying WebGL
- **@react-three/postprocessing@2.19.1 + postprocessing** — Bloom + DepthOfField + Noise + Vignette (R3F v8 compatible; v3 requires R3F v9)
- **maath** — math utilities (easing, random distributions)
- **troika-three-text** — SDF text rendering (pulled in by drei `<Text>`, no direct install needed). **Only supports TTF/OTF/WOFF — not woff2.**
- **CSS Modules** — per-component styles (no Tailwind)
- **Space Grotesk** (sans) + **Space Mono** (mono) — Google Fonts (HTML); Space Mono TTF at `public/fonts/SpaceMono-Regular.ttf` for all native 3D text

**No scroll** — `App.jsx` has no scroll listener or 500vh spacer. Navigation is fully 3D drag+scroll. `html, body { overflow: hidden }` prevents any page scroll.

## Design system

Defined as CSS custom properties in `src/styles/globals.css`:

| Variable | Value | Use |
|---|---|---|
| `--bg-deep` | `#050d1a` | page background |
| `--bg-mid` | `#0a1628` | card backgrounds |
| `--accent-blue` | `#4a90d9` | primary accent, borders, labels |
| `--accent-silver` | `#c8deff` | headings, highlights |
| `--accent-moon` | `#e8f0ff` | brightest text |
| `--accent-glow` | `#7bb3f0` | glow/shadow color |
| `--text-secondary` | `#8aaed4` | body text |
| `--text-dim` | `#4a6a8a` | labels, metadata |
| `--font-sans` | Space Grotesk | headings, body |
| `--font-mono` | Space Mono | terminal, labels, tags |

Palette concept: **moonlit night** — deep navy, silver-white highlights, cool blue glow. Not neon, not harsh. **Everything stays in the cool family — no warm/orange accents** (the black-hole disk, projects, and nebulae were recolored away from gold).

**Per-section accent hues** (in `sections.js` `color`, used for beacons, EdgeHints, panel borders) — distinct but all cool:

| Section | Hue | Section | Hue |
|---|---|---|---|
| About | `#7bb3f0` azure | Projects | `#45c7c0` teal |
| Skills | `#5ec8e6` cyan | Contact | `#4a90d9` blue |

Project card colors: Codesense (AI) `#9b8cf5` violet, API Rate Limiter `#6fb0ef` sky.

## Architecture

```
src/
├── components/
│   ├── canvas/              # Three.js / R3F 3D objects
│   │   ├── SpaceScene             # Canvas root, DragLookCamera, CameraSync, post-processing, scene assembly
│   │   ├── EdgeHints              # Waypoint markers — plain React DOM outside canvas, own rAF loop
│   │   ├── HeroText               # 3D Billboard title (exists but NOT rendered — name now on loading screen)
│   │   ├── Planet                 # Procedural-surface planet (GLSL) + Fresnel atmosphere (section 1)
│   │   ├── PlanetInfo             # UNUSED — old 3D constellation about-panels (content now in DOM InfoPanel)
│   │   ├── ConstellationReveal    # UNUSED by sections — reusable native-3D panel (stars fly to layout → text); kept for accents
│   │   ├── BlackHole              # Interstellar "Gargantua" shader + Keplerian skill orbs (section 2)
│   │   ├── ProjectGalaxy          # Project star systems + 3D name tags (dossiers now in DOM InfoPanel) (section 3)
│   │   ├── SpaceStation           # Station geometry only (contact text/links now in DOM InfoPanel) (section 4)
│   │   ├── AsteroidField          # UNUSED — low-poly asteroids removed from the scene (looked boxy)
│   │   ├── BackgroundConstellations # 4 classic star patterns (Orion, Big Dipper, Cassiopeia, Leo)
│   │   ├── Galaxy                 # 2 distant spiral-galaxy particle disks (deep-background scenery)
│   │   ├── NebulaParticles        # Additive particle clouds at inter-section midpoints
│   │   ├── Stars                  # Background star field — scintillation + diffraction spikes
│   │   ├── SectionBeacons         # Twinkling star beacons at section positions (fog=false)
│   │   └── ShootingStars          # UNUSED — meteor-on-arrival effect removed from the scene
│   └── ui/
│       ├── LoadingScreen          # Constellation name-reveal overlay (SVG line traces "MAHARSHI REDDY")
│       ├── HUD                    # Fixed overlay: brand (= name), section label, audio toggle
│       ├── HUD.module.css
│       ├── NavMenu (+ .module.css)   # Persistent bottom nav: Home/About/Skills/Projects/Contact + Tour + Résumé; guided fly-to
│       └── InfoPanel (+ .module.css) # Readable DOM content panels per section + hero overlay (section 0) + focus scrim
├── data/
│   └── sections.js          # SINGLE SOURCE OF TRUTH: per-section index/id/label/color, world pos, camera view pose, + DOM panel content
├── utils/
│   ├── sharedState.js       # Module-level stores: cameraState (camera ref + size) + navState (guided fly-to request)
│   └── audio.js             # Web Audio engine: ambient drone + scroll-reactive whoosh (singleton)
├── styles/
│   └── globals.css          # CSS variables, resets, keyframe animations
├── App.jsx                  # sectionIndex + mountScene/loaded state; defers SpaceScene mount until loading draws; renders InfoPanel/EdgeHints/NavMenu/HUD outside canvas
└── main.jsx
```

## Navigation model

**Drag-to-look + scroll-to-fly, plus guided fly-to.** No pointer lock, no WASD. `App.jsx` manages one piece of state: `sectionIndex` (0–4), updated via callback from `SpaceScene`.

`DragLookCamera` inside `SpaceScene` runs per-frame, detects which section the camera is closest to (within 50 world-units), and calls `onSectionChange(idx)` when that changes. **It does NOT move or rotate the camera on proximity** — there is no auto-align snap (removed; it fought the user). The only programmatic camera motion is an *explicitly requested* guided fly-to.

All section positions and camera view poses live in **`src/data/sections.js`** (single source of truth); `SpaceScene` `SECTION_ZONES` and `EdgeHints` `TARGETS` are both **derived** from it, so they can't drift.

**Section zones (proximity, 50u radius — UI only):**

| sectionIndex | World centre | Sector |
|---|---|---|
| 0 (none) | — | Deep Space / Home (hero overlay) |
| 1 | [25, 6, 70] | Origin planet (About) |
| 2 | [-90, 32, -40] | Skill Nebula (Black Hole) |
| 3 | [85, -35, -90] | Project Sector |
| 4 | [-40, -12, -175] | Comm Station (Contact) |

**Outward-cluster layout (don't break it):** the four sections sit AROUND a central point (~[0,0,-60]) in distinct directions, and each `view` pose sits *between* that centre and the object, looking OUTWARD into empty space. So when you're framed on one section, every *other* section is **behind the camera** (verified 116°–175° off-axis) and its EdgeHints marker clamps to the screen edge — it can't project onto the object you're looking at. Turning toward another section still floats its marker in-world. A −Z "tunnel" layout fails: a section deeper down the view axis always projects near screen-centre and lands on the focused object (this caused the Contact-marker-on-black-hole bug). See the `LAYOUT RULE` comment in `sections.js`.

**Controls:**
- `drag` (mousedown + mousemove) → look around — YXZ Euler rotation, pitch clamped ±81°
- `scroll wheel` → fly in the direction of the cursor (ray from camera through cursor NDC position)
- `click NavMenu item / EdgeHints waypoint / hero CTA` → **guided fly-to** that section's view pose
- `Tour` button → auto-fly through sectors 1→4 in order, pausing on each
- `touch`: one finger = look, two-finger pinch = fly (see Mobile touch)
- No pointer lock, no keyboard movement, no WASD

**Guided fly-to**: a click sets `navState.request = { pos, look }` (the section's `view` pose from `sections.js`). `DragLookCamera` tweens the camera's **position** (lerp toward `pos`) *and* **orientation** (slerp toward looking at `look`) with framerate-independent damping, then clears the request when within 0.4u. **Any `mousedown` or `wheel` cancels it instantly** (`navState.request = null`) so the user never fights the camera. `view.look` is biased slightly +X so the 3D object sits left-of-centre, leaving the right side clear for the DOM panel.

## Camera (`DragLookCamera` in `SpaceScene.jsx`)

Starting position: `[0, 12, 200]` looking toward `[0, 4, 175]` (set in Canvas `onCreated`).

**Drag-to-look**: `mousedown` starts drag; `mousemove` accumulates dx/dy into YXZ Euler applied to `camera.quaternion`. Pitch clamped to `±0.45π`. Touch supported (single-finger drag).

**Scroll-to-fly**: `wheel` deltaY accumulates into `scrollVel` (capped ±15). Each frame:
```js
const ndcX = (cursorPos.x / window.innerWidth)  *  2 - 1
const ndcY = (cursorPos.y / window.innerHeight) * -2 + 1
_cursorDir.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
camera.position.addScaledVector(_cursorDir, scrollVel * dt * 25)
scrollVel *= 0.88   // inertia decay
```
Direction is the ray from camera through the cursor's screen position — scroll aims where you point.

**Guided fly-to**: when `navState.request = { pos, look }` is set, each frame tweens position + orientation with framerate-independent damping:
```js
const posA = 1 - Math.pow(0.92, dt * 60)   // ~0.08/frame @60fps
const rotA = 1 - Math.pow(0.88, dt * 60)   // ~0.12/frame @60fps
camera.position.lerp(_targetPos, posA)
_mat.lookAt(camera.position, _lookV, _navUp)
_tq.setFromRotationMatrix(_mat)
camera.quaternion.slerp(_tq, rotA)
// clears navState.request when camera.position.distanceTo(_targetPos) < 0.4
// onDown / onWheel set navState.request = null → manual control wins
```

`camera.far = 800`. `camera.fov = 60`.

**CameraSync** — a tiny R3F component inside `Scene` that writes `cameraState.camera`, `cameraState.width`, `cameraState.height` every frame via `useFrame`. EdgeHints reads from this store.

## Shared state (`src/utils/sharedState.js`)

Two plain module-level objects that bridge the Canvas and DOM:

```js
cameraState = { camera: null, width: 0, height: 0 }
// Written by CameraSync (inside canvas) every frame.
// Read by EdgeHints rAF loop to project world positions.

navState = { request: null }  // { pos: [x,y,z], look: [x,y,z] } | null
// Written by NavMenu / EdgeHints / InfoPanel (hero CTAs) when the user picks a
// destination. Read + tweened + cleared by DragLookCamera useFrame.
// Cleared on any manual drag/scroll so the user is never fought.
```

No React context, no Zustand — plain object mutation is synchronous and GC-free.

## EdgeHints (`src/components/canvas/EdgeHints.jsx`)

**Plain React DOM component rendered in `App.jsx` outside the Canvas** — no `Html` from drei, no `useThree`, no `useFrame`. Lives at `position: fixed; z-index: 20; inset: 0`.

Runs its own `requestAnimationFrame` loop (started in `useEffect`, cancelled on unmount). Each tick:
1. Reads `cameraState.camera` — skips if null or canvas not ready (`w < 10`)
2. Calls `camera.updateMatrixWorld()` — ensures matrices reflect latest position/quaternion
3. For each non-active section: projects world pos → NDC via `_ndc.copy(t.pos).project(camera)`
4. **On-screen** (`ndc.z ≤ 1` and `|ndc.x| ≤ 1` and `|ndc.y| ≤ 1`): places hint at exact projected pixel position — it floats in space over the section (so when you look toward a section, its marker sits on it in-world)
5. **Off-screen or behind**: clamps to screen edge (PAD=56px inset). Behind-camera: mirrors screen position around centre (corrects for negative clip-space w). Markers overlapping a focused object is avoided by the **section layout** (sections are spread on a zig-zag with alternating X/Y so they don't sit along each other's view axis) rather than by a distance clamp.
6. Active section hint: `opacity: 0`, `pointerEvents: none`

`activeRef` keeps section index current without restarting the loop on every section change. Opacity is initialised to `'0'` via ref callback (never in JSX style, so React never resets it on re-render).

Click on any hint → `navState.request = t.view` (the section's view pose from `sections.js`) → DragLookCamera flies the camera to it. `TARGETS` is derived from `SECTIONS` (no hardcoded positions).

Each marker is a flat coloured `✦` star (with a gentle `edgePulse` opacity breathe) + a section-coloured label — no glow, no backing chip. A section may set `hintOffset` (world-space vec3) in `sections.js` to float its marker off a large/bright object — About uses `[0,-8,0]` so the marker sits just below the planet instead of lost on its bright disk. The offset is baked into the projected `pos` (scales with distance); the click target (`view`) is unaffected.

## 3D scene objects

**HeroText** — `HeroText.jsx` still exists but is **no longer rendered** in `SpaceScene`. The hero name now lives only in the loading screen (the constellation name reveal), so the 3D title in deep space was removed to avoid duplicating it. Re-import + render it in `SpaceScene` (gated on `sectionIndex === 0`) to bring it back.

**AsteroidField** — **removed from the scene** (the low-poly icosahedrons read as boxy). `AsteroidField.jsx` still exists but is no longer imported/rendered; re-add `<AsteroidField />` in `SpaceScene` if you want it back (consider higher `detail` for rounder rocks).

**BackgroundConstellations** — 4 classic star patterns placed far off the camera path, all `fog=false`:

| Constellation | Center | Color | Stars |
|---|---|---|---|
| Orion | [-162, 60, 85] | `#c8deff` | 7 (Betelgeuse, belt trio, Rigel…) |
| Big Dipper | [148, 78, 15] | `#7bb3f0` | 7 (bowl + handle) |
| Cassiopeia | [-125, -52, -72] | `#c8deff` | 5 (W shape) |
| Leo | [115, 48, -158] | `#b9c4ef` | 7 (sickle + body) |

Each star twinkles via compound-sine (two overlapping frequencies, unique phase per star). Connecting lines at opacity 0.16, `fog=false`.

**NebulaParticles** — Additive particle clouds at inter-section midpoints.

| Midpoint | Color | Count |
|---|---|---|
| Hero → About (≈[13,5,122]) | `#4a90d9` blue | 500 |
| About → Skills (≈[-33,19,15]) | `#8c7fe0` violet | 420 |
| Skills → Projects (≈[-3,-2,-65]) | `#c8deff` silver | 480 |
| Projects → Contact (≈[23,-24,-133]) | `#3a6a9a` deep blue | 380 |

**Planet** — `position=[25, 6, 70]` (from `sections.js` section 1 `world`), `scale=2.5`. A **cool banded gas giant** (not Earth-like — deliberately alien/moonlit for the About / "Origin" planet). Fully procedural via custom GLSL (no textures):
- **Surface shader** (`surfaceVert`/`surfaceFrag`): swirling **latitude bands** — `sin(lat*9 + fbm warp)` domain-warped by two fbm octaves for turbulent flow — in a cool palette (deep indigo → blue → pale cyan), plus a churning **"great storm" oval** (cyan→violet) and cool polar haze. Soft **day/night terminator** (`dot(normal, uLightDir)`); night side stays dim, not black. `uLightDir` matches the scene directional light `[-5,3,5]`. (The old Earth surface — continents/oceans/ice caps/city lights — was replaced.)
- **Fresnel atmosphere** (`atmoVert`/`atmoFrag`): rim glow `pow(1 - dot(n, viewDir), uPower)`, additive blend, brighter on the day side. Two shells: a tight front-side rim (`#5ea8ff`, scale 1.015) and a wide back-side corona (`#4a90d9`, scale 1.28).
- **Layered Saturn-style ring** (3 tilted torus bands at r≈1.52/1.78/2.05) + key/fill point lights. Surface rotates `0.035 rad/s`, ring `0.025`. Hover lifts atmosphere intensity. (`cloudRef` is declared but unused — no separate cloud shell now.)

**PlanetInfo** — **UNUSED / no longer rendered.** Previously 3 `ConstellationPanel` groups parented to the planet. The About content now lives in the DOM `InfoPanel` (`sections.js` → section 1 content). File kept in case the 3D treatment is wanted back.

**ConstellationReveal** — reusable native-3D panel at `src/components/canvas/ConstellationReveal.jsx` (drei `<Text>` + animated star nodes + spine line). **No longer used by any section** (all dossiers moved to DOM panels); kept as a reusable accent component.

**BlackHole** — centered at `[-90, 32, -40]` (from `sections.js` section 2 `world`). Props: `position`, `showLabels` (bool), `active` (bool). Interstellar "Gargantua" look, fully procedural:
- **Single camera-facing Billboard plane** (16×16) with a custom GLSL `ShaderMaterial` (`diskVert`/`diskFrag`). The entire black hole — event-horizon shadow, photon ring, accretion disk, lensing arcs, plasma turbulence — is drawn in 2D in the fragment shader. **No separate event-horizon sphere, no lensing-ring meshes, no jets** (all removed). Shader coords are `(vUv-0.5)*3.0` (range ±1.5) so the disk (which reaches `dr≈1.25`) sits inside the plane with margin and is **not clipped at the quad edges**.
- The signature silhouette comes from a **vertically-squashed accretion ring** (`yScale=3.1`): the squash turns a circular ring into a tilted ellipse whose top edge arcs OVER the shadow and bottom sweeps UNDER it, with bright horizontal extensions left/right. A thick icy **photon ring** hugs the shadow (`holeR=0.30`). fbm turbulence drives rotating plasma streaks; **cool** color ramp inner blue-white → cyan → deep indigo (recolored from the original Interstellar gold to match the moonlit theme); subtle relativistic beaming brightens the left side. A **rim `seal`** forces full opacity from the horizon out through the photon ring so the background can't bleed through the transparent edge.
- **ShaderMaterial has no fog**, so the disk glows through fog across all sections.
- 10 skill orbs with Keplerian physics: `keplerPos(elapsedTime, skill)` per frame. **Orbit-trail lines were removed** — overlapping blue/cyan skill-colored trails bloomed into a false ring over the shadow; the orbs' motion conveys the orbits on its own.
- `showLabels` prop (`sectionIndex === 2`): reveals `<Billboard><Text>` orb labels — **no Html**, always camera-facing.
- `active` prop is now a no-op (the old `NEBULA_ENTRIES` `ConstellationPanel` was removed). The readable skills list (grouped by category) lives in the DOM `InfoPanel` (`sections.js` → section 2 content).

**ProjectGalaxy** — two `StarSystem` groups positioned by `center` (= `sections.js` section 3 `world`, `[85, -35, -90]`) + per-project `offset`. Native `Billboard+Text` name tags only; the full project dossiers were removed and now live in the DOM `InfoPanel` (`sections.js` → section 3 content). `PROJECTS` array holds id/name/color/offset/github.

**SpaceStation** — at `[-40, -12, -175]` (from `sections.js` section 4 `world`). Torus ring + cylindrical hub + solar panels animate on `useFrame`. Geometry only — the station dossier text and the contact links were removed (and now live in the DOM `InfoPanel`, `sections.js` → section 4 content, including the Résumé button). `active` brightens the emissive materials.

**Stars** — shader-based star field (5200 bg + 320 bright foreground). **Follows camera each frame** so stars always surround the viewer. Stars at `r=45–100` relative to camera. **Realistic scintillation**: three overlapping sine frequencies + a power curve make the flicker irregular (stars briefly "wink"), and twinkle modulates point size. Bright stars (`vBright`) get 4-point **diffraction spikes** in the fragment shader.

**Galaxy** (`Galaxy.jsx`) — 2 distant **spiral-galaxy particle disks** as deep-background scenery, far off the flight path. Logarithmic-spiral arm distribution (`buildGalaxy`: radius^1.8 central concentration, per-arm branch angle + spin, radius-scaled randomness). Warm core → blue arms color lerp with rare pink young-star highlights; additive blending; a faint glowing core sphere. Slow per-galaxy rotation. Positions `[-220,120,-120]` (3-arm, scale 1) and `[260,-150,-260]` (2-arm, scale 0.7).

**SectionBeacons** (`SectionBeacons.jsx`, exports `SectionStars`) — twinkling star beacons AT each section position. `fog=false` → always visible as distant specks. Fades out as camera enters < 35u.

| Star | World position | Color |
|---|---|---|
| Planet (About) | [25, 6, 70] | `#7bb3f0` |
| Black Hole (Skills) | [-90, 32, -40] | `#5ec8e6` |
| Project Galaxy | [85, -35, -90] | `#45c7c0` |
| Space Station (Contact) | [-40, -12, -175] | `#4a90d9` |

(`SectionBeacons` `STARS` is **derived** from `sections.js`, not hardcoded.)

**ShootingStars** — **removed from the scene** (the meteor/trail flourish on section change was distracting). `ShootingStars.jsx` still exists (meteor head + tapering streak + lingering dust wake) but is no longer imported/rendered in `SpaceScene`. Re-add `<ShootingStars sectionIndex={sectionIndex} />` to bring it back.

**HUD** — fixed overlay, `z-index: 10`, pointer-events none (except the audio button). Shows:
- Brand (top-left): `◈ MAHARSHI REDDY` (the portfolio belongs to a person)
- Audio toggle (top-right): `♪ SOUND ON/OFF` — `pointer-events: auto`, calls `audioEngine.init()` + `toggleMute()`
- Section label (top-center): animated on section change
- (The old bottom-center hint was removed — it collided with the NavMenu and is now redundant with the hero hint.)

## DOM portfolio layer (outside the canvas)

These plain-React components render in `App.jsx` (only after `loaded`), layered over the canvas. This is where all *reading* happens — the deliberate "readable portfolio" half of the experience.

**NavMenu** (`src/components/ui/NavMenu.jsx`, `z-index: 30`) — persistent bottom-center pill: Home · About · Skills · Projects · Contact (active item highlighted by `sectionIndex`, colored dot), plus a **Tour** toggle and a **Résumé** link. Clicking an item → `navState.request = section.view` (guided fly-to). **Tour** chains `setTimeout`s (`TOUR_DWELL = 7000ms`) flying through sectors 1→4 and auto-stops; manual nav cancels it.

**InfoPanel** (`src/components/ui/InfoPanel.jsx`, scrim `z-index: 14`, panel/hero `z-index: 16`) — renders the active section's content from `sections.js`:
- **Hero (section 0)**: centered overlay — name, role, tagline, CTAs (View Projects / About / Contact → guided fly-to), drag/scroll hint. `pointer-events: none` except the CTA buttons, so it never blocks exploration. **Visibility is owned by `App` (`showHero`)**: shown at first load, hidden the moment the user explores (a window-level `wheel`/drag-`pointermove`/`touchmove` listener sets it false), and shown again **only** when the user taps **Home** in the NavMenu (`onHome` → `setShowHero(true)`). No idle auto-return (the old `useExploring` idle-fade was removed because the hero kept reappearing mid-exploration).
- **Sections 1–4 (desktop)**: a right-side glass card (`min(440px, 92vw)`, scrollable) with a **focus scrim** (gradient darkening the background toward the panel side) so text stays legible over the busy universe. `key={section.id}` re-mounts the card on section change to replay the entrance animation. The scrim is `pointer-events: none` (drag still rotates the camera through it); only the card is interactive.
- **Sections 1–4 (mobile ≤720px)**: the card becomes a **collapsible bottom sheet** so the 3D object stays visible — the `PanelShell` header (`sheetHead`, a `<button>`) toggles an `expanded` state; collapsed (default) shows only eyebrow + title with a chevron, expanded reveals the scrollable `sheetBody`. Desktop ignores `expanded` (chevron hidden, body always shown). Scrim hidden on mobile; `EdgeHints` markers are not rendered on mobile (`IS_MOBILE` in `App.jsx`) and the NavMenu collapses to a single compact row (Résumé/Tour dropped — Résumé still in the Contact sheet).
- Content shapes per `kind`: `about` (stats grid + experience + certs + education), `skills` (category groups → chips), `projects` (cards: name, tagline, blurb, bullets, stack chips, "View code" link), `contact` (link rows + Résumé button).

**LoadingScreen** — fixed fullscreen overlay (`z-index: 100`). **Constellation name reveal**: a dense full-screen starfield (DOM `div` dots, ~320), with small star-nodes arranged into the letters of **MAHARSHI / REDDY**; a thin luminous `<polyline>` traces **each letter** (letters are NOT joined). Single-stroke glyphs in `GLYPHS` (unit-grid point arrays); `layoutLine` produces one polyline per letter; the global letter order drives a draw stagger. The name-nodes are deliberately small so that when the line fades they dissolve into the starfield rather than spelling the name in bright dots.
- **Deferred scene mount**: the heavy 3D `SpaceScene` is NOT mounted at page load. `LoadingScreen` calls `onReveal` (after the name finishes drawing) → `App` sets `mountScene` → the scene mounts hidden behind the still-opaque overlay; the shader-compile jank is hidden. Then the overlay dissolves to reveal it, and `onLoaded` enables the HUD/EdgeHints. This keeps the intro animation smooth (it runs on an unobstructed main thread).
- **Fades are CSS-animation driven** (`loadDissolve`, compositor thread), not React state — so once the scene's render loop starts they can't be starved/stalled.
- **StrictMode-safe**: the timeline effect uses empty deps `[]` with `onReveal`/`onLoaded` held in refs. (A `triggered`-guard pattern previously broke under StrictMode — the double-invoke's first cleanup cleared the timers and the second run early-returned, so the scene never mounted.)

## Post-processing (SpaceScene.jsx)

`<EffectComposer multisampling={4}>` wrapping (order matters):
- `Bloom` — `intensity=2.2, luminanceThreshold=0.07, radius=0.88, mipmapBlur`
- **`DepthOfField` was removed** — its fixed near focus plane (`focusDistance=0.012`) kept only near objects sharp and left all of deep space / the hero view blurry. A single fixed-focus DoF can't keep both a near object and far space sharp, so it was dropped (everything is crisp now). It was also the heaviest post pass. To bring a cinematic version back, re-add `<DepthOfField>` with a far focus + low `bokehScale`.
- `Noise` — film grain, `BlendFunction.OVERLAY`, `opacity=0.16` (imported from `postprocessing`). **Do NOT use `premultiply` + `SOFT_LIGHT`** — that combination fringes the black hole's ultra-bright HDR photon ring into a complement-coloured ring (see Known constraints).
- `Vignette` — `offset=0.28, darkness=0.88` (heavy dark edges; key to "terrifying void of space" aesthetic)
- **`ChromaticAberration` was removed** — it was investigated as the source of the black-hole fringe but the real culprit was the Noise blend; CA added little and is gone.

## Audio (`src/utils/audio.js`)

`audioEngine` singleton (Web Audio API, no asset files). **Blocked until a user gesture** — `audioEngine.init()` is called from the first `mousedown`/`wheel`/`touchstart` in `DragLookCamera` and from the HUD audio toggle. Public methods are no-ops until then. Engine starts **muted** (sound is opt-in via the HUD toggle).
- **Ambient drone**: detuned low oscillators (55–110 Hz) through a lowpass + filtered-noise "solar wind" bed, with a slow LFO breathing the whole bus. Fades in over 4s.
- **Reactive whoosh**: looping noise → bandpass → gain. `DragLookCamera` calls `audioEngine.setFlySpeed(|scrollVel|/15)` every frame; gain + bandpass frequency track fly speed (smoothed via `setTargetAtTime`).
- **`chime(sectionIndex)`** exists (bell-like additive partials) but is **currently not called** — the arrival chime was removed per design feedback. `toggleMute()` ramps the master gain; HUD reflects state.

## Scene fog

`<fog args={['#050d1a', 18, 55]} />` — clear within 18u, fully hidden at 55u. Sections are ~100–130u apart so adjacent sections never appear together. SectionBeacons, constellation SpineLines, and BackgroundConstellations use `fog={false}` to remain visible.

## Mobile touch

`canvas { touch-action: none }` in globals.css and `gl.domElement.style.touchAction = 'none'` in `onCreated` (the latter also stops the browser pinch-zooming the page). Touch controls in `DragLookCamera`:
- **One finger drag** → look around (same euler rotation as mouse drag).
- **Two-finger pinch** → fly: spreading flies forward toward the pinch midpoint, pinching in backs up (the touch equivalent of scroll-to-fly — mobile has no wheel). Feeds the same `scrollVel` + cursor-ray flight as the wheel; lifting one finger hands back to one-finger look.
- First `touchstart` calls `audioEngine.init()` (audio unlock parity with mouse/wheel).

## Build output (4 chunks)

| Chunk | Size (gzip) | Contents |
|---|---|---|
| `three` | ~176 KB | Three.js core |
| `r3f` | ~135 KB | @react-three/fiber + @react-three/drei (incl. troika) |
| `post` | ~17 KB | @react-three/postprocessing + postprocessing |
| `index` | ~51 KB | App code, components, styles |

## What to customize

> **Most text content now lives in one place:** `src/data/sections.js`. Edit the `content` object on each section for About bio, Skills groups, Projects, and Contact — these drive the DOM `InfoPanel` and the hero.

1. **Skills** — copy/groups → `sections.js` (section 2 `content.groups`). The orbiting orbs (3D flavour) → `BlackHole.jsx` `SKILLS` array.
2. **Projects** — copy/cards → `sections.js` (section 3 `content.projects`). The 3D star systems (position/color/name tag) → `ProjectGalaxy.jsx` `PROJECTS` array.
3. **About bio** — `sections.js` (section 1 `content`: lead, experience, stats, certs, education).
4. **Contact links / Résumé** — `sections.js` (section 4 `content.links` + `content.resume`). Drop the résumé PDF at `public/resume.pdf` (the default path the button points to).
5. **Hero (name/role/tagline/CTAs)** — `sections.js` (section 0 `content`). Also shown on the loading screen (`LoadingScreen.jsx` → `layoutLine`/`GLYPHS`). `HeroText.jsx` exists but is not rendered.
6. **Section positions / camera view poses** — `sections.js` `SECTIONS[].world` and `.view`. `SpaceScene` `SECTION_ZONES` and `EdgeHints` `TARGETS` are derived from this — **edit only `sections.js`** (but the 3D object positions in `SpaceScene.jsx` / component props must be moved to match `world`).
7. **Star beacons** — `src/components/canvas/SectionBeacons.jsx` → `STARS` array.
8. **Background constellations** — `src/components/canvas/BackgroundConstellations.jsx` → `CONSTELLATIONS` array.
9. **Nebula clouds** — `src/components/canvas/NebulaParticles.jsx` → `CLOUDS` array.
10. **Galaxies** — `src/components/canvas/Galaxy.jsx` → the two `<SpiralGalaxy>` calls (position, arms, colors, count).
11. **Loading name** — `src/components/ui/LoadingScreen.jsx` → `layoutLine('MAHARSHI', …)` / `layoutLine('REDDY', …)`; new letters need a `GLYPHS` entry (single-stroke unit-grid point array).
12. **Black hole shader** — `src/components/canvas/BlackHole.jsx` → `diskFrag` (holeR, yScale, color ramp, turbulence). Skills → `SKILLS` array.
13. **Planet surface** — `src/components/canvas/Planet.jsx` → `surfaceFrag` (gas-giant band frequency `lat*9`, warp amounts, palette `deep`/`mid`/`lightB`, storm `spotDir`/`spotCol`) + `atmoFrag` (rim color/power) + the ring-band torus radii.
14. **Audio** — `src/utils/audio.js` → drone `freqs`, whoosh mapping in `setFlySpeed`.

## ConstellationReveal entry format

```js
{
  label: 'text to display',
  fontSize: 0.14,        // 0.10=tiny label, 0.24=title, 0.34=hero
  textColor: '#8aaed4',
  delay: 0.2,            // seconds before node starts flying in
  gap: 0.14,             // extra spacing below this row
  maxWidth: 5,           // text wrap width in world units (default 6)
}
```

Font file: `public/fonts/SpaceMono-Regular.ttf`. Star node size is 0.04u radius, `fog={false}`.

## CSS keyframe animations (globals.css)

- `edgePulse` — opacity breathe on EdgeHints `✦` star markers
- `loadTrace` — `stroke-dashoffset` 1→0 for the loading-screen name line
- `loadStarPop` — star nodes lighting up as the line passes
- `loadStarTwinkle` / `loadFadeIn` — loading-screen background stars + tagline
- `holodrift` — subtle Y float
- `holopulse` — opacity breathe on project name tags
- `scanReveal`, `clickRingPulse` — available for future use

## Known constraints

- **Planet is custom GLSL** — `Planet.jsx` uses two `ShaderMaterial`s (surface + Fresnel atmosphere), not `meshStandardMaterial`. No textures; everything is procedural noise. The surface shader reads `cameraPosition` (a built-in three.js uniform) for specular — works because it's a raw `ShaderMaterial`.
- **No Html boxes _inside the canvas_** — nothing uses drei `<Html>`. In-world labels are native 3D (`Billboard+Text`). Readable portfolio content is plain-React DOM **outside** the canvas (`InfoPanel`, `NavMenu`, `EdgeHints`, `HUD`, `LoadingScreen` — all `position: fixed`). This relaxes the old "all info is native 3D" rule: dense paragraphs were illegible as tiny 3D text fighting bloom/DoF/fog, so they moved to DOM panels. Keep *labels/accents* in 3D; keep *reading* in DOM.
- **`sections.js` is the single source of truth for positions** — `SpaceScene.jsx` `SECTION_ZONES` and `EdgeHints.jsx` `TARGETS` are both derived from `SECTIONS`, so they can't drift. Note the *3D object* positions (planet/black hole/projects/station props in `SpaceScene.jsx`) are still literals and must be moved to match a changed `world`.
- **Black hole is a billboarded 2D shader** — the whole Gargantua is one camera-facing plane; it has no true 3D geometry. Looks correct from any approach angle because `<Billboard>` keeps it facing the camera. **Don't add bright line/point objects centered on the black hole** — overlapping colored lines bloom into false rings over the shadow (this is why orbit trails were removed).
- **Accretion disk bypasses fog** — BlackHole ShaderMaterial has no fog uniforms. Intentional.
- **Noise grain blend fringes HDR edges** — a `<Noise premultiply blendFunction={SOFT_LIGHT}>` pass at high opacity wraps the black-hole's bright HDR photon ring in a **complement-coloured ring** (the complement of the ring colour is the tell — e.g. an orange/gold halo around the now-cool cyan ring). This cost a long debugging session: the fringe survives Bloom/CA being off and scales with the shader's `holeR`, which makes it look like geometry. Use `BlendFunction.OVERLAY` at `opacity≤0.16` for grain instead. If a colored ring ever reappears on the black hole, suspect the **post-processing chain**, not the shader. (Note: the disk palette is now cool blue/cyan — recolored from gold — so a *warm* fringe is the post-processing tell.)
- **Audio needs a user gesture** — `audioEngine` is silent until `init()` runs on first click/wheel (browser autoplay policy). Don't expect sound on page load. `init()` (and `toggleMute` when unmuting) calls `ctx.resume()` because browsers can create the context **suspended** even inside a gesture — without the resume the drone is scheduled but never heard (toggle reads ON, no sound). The HUD audio button **starts** sound on first click (rather than muting), then toggles thereafter.
- **DepthOfField removed** — it made deep space / the hero view blurry (fixed near focus plane), so it's gone. `multisampling` is the heaviest post setting.
- **Mobile perf scaling** — `IS_MOBILE` in `SpaceScene.jsx` (coarse pointer OR `innerWidth < 820`, evaluated once at load) drops `EffectComposer multisampling` `4 → 0` and the Canvas `dpr` `[1,1.5] → 1` on phones, the two biggest GPU costs (MSAA + pixels drawn). If a real device still struggles, next thin the particle counts (Stars 5200, NebulaParticles, dust).
- **@react-three/postprocessing version** — must stay at v2.x (currently 2.19.1). v3 requires R3F v9.
- **ConstellationReveal useMemo deps []** — layout computed once on mount; entries/position are static.
- **troika fillOpacity** — `ref.current.fillOpacity = val` works imperatively in `useFrame` on drei `<Text>` refs.
- **troika font format** — `public/fonts/SpaceMono-Regular.ttf` must stay as TTF. woff2 not supported.
- **EdgeHints opacity ownership** — opacity is set only in the rAF loop and the ref callback. Never put `opacity` in EdgeHints JSX `style` props or React will reset it on re-render.
- **camera.updateMatrixWorld()** — called manually in EdgeHints' rAF loop because R3F updates matrices during `gl.render()`, which happens after `useFrame`. Without this call, `project()` would use the previous frame's camera transform.
- **Dynamic particle geometry needs `frustumCulled={false}`** — the ShootingStars trail/dust `<line>`/`<points>` start with all-zero positions, so their auto-computed bounding sphere sits at the origin and three.js frustum-culls them even though the verts later move far away (the trail was invisible until this was set). Any buffer geometry whose vertices are written per-frame from a zero/placeholder start should disable frustum culling (or call `geometry.computeBoundingSphere()` each frame).
- **Round particle sprites** — `NebulaParticles` and `ProjectGalaxy` debris use `circleSprite()` (`src/utils/sprite.js`, a shared soft radial-gradient `CanvasTexture`) as the pointsMaterial `map`, so points render as round glows, not the default square quads. `Stars` uses `AdditiveBlending` for a natural glow; its fragment already masks to a circle via `gl_PointCoord`.
- **Billboard inside moving group** — `<Billboard>` in BlackHole `SkillOrb` is parented to a group that moves every frame. Billboard rotation is applied on top, so labels always face camera.

## Future improvements (suggested, not yet done)

Ideas raised during review, kept here so they aren't lost. Roughly in priority order. `[both] / [mobile] / [desktop]` = where it matters.

**High impact (portfolio value / correctness):**
1. **Project thumbnails** `[both]` — add a preview image per project card (`sections.js` → `content.projects[].image`) and render it in `InfoPanel` `Projects`. Live `github` links are now set (codesense, api-rate-limiter); add `liveUrl` + a "Live demo" link too if/when the projects are deployed. (Thumbnails deferred per owner.)
2. **Accessible / SEO content fallback** `[both]` — section text only renders when you navigate to that section (`sectionIndex`-gated), so crawlers + screen readers see ~only the hero. Add an always-present visually-hidden full-content block, or a "Read as page" 2D toggle. Big for SEO + a11y.
3. **WebGL / no-3D fallback** `[both]` — if WebGL is unavailable or the context is lost, show a graceful static fallback (name, role, links, résumé) instead of a black screen. (R3F `onCreated`/error boundary, or a `WEBGL.isWebGLAvailable()` check before mounting `SpaceScene`.)

**UX polish:**
4. **Onboarding cue** `[both]` — a subtle one-time animated hint (or gentle idle camera drift) teaching drag / scroll / pinch, instead of relying on the static hero hint line.
5. **`prefers-reduced-motion`** `[both, esp. mobile]` — honor the OS setting: calm drifting/auto-animations/bloom; saves battery on phones.
6. **Mobile bottom-sheet polish** `[mobile]` — add swipe-up-to-expand (not just tap) + a grab-handle visual; add a one-time "pinch to fly" hint (the gesture isn't discoverable).
7. **Keyboard navigation + focus rings** `[desktop]` — number keys / arrows to jump sections; visible focus outlines on the NavMenu buttons (currently pointer/touch only).

**Smaller niceties:**
8. **Copy-email button** on Contact `[both]` — tap-to-copy beside the `mailto:`.
9. **Hover affordance** on interactive 3D objects (skill orbs, project stars) `[desktop]` — a clearer highlight/label so it reads as interactive.
10. **Section orientation cue** `[both]` — faint "you are here" / progress; low priority since the NavMenu already highlights the active section.
